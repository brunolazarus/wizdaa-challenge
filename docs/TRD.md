# Technical Requirement Document
## ExampleHR — Time-Off Frontend

**Author:** Bruno Lazaro
**Date:** 2026-04-24
**Status:** Approved — drives all implementation

---

## 1. Problem Statement

ExampleHR's Time-Off module must present balance data and manage request workflows
that feel instant and trustworthy, while the underlying data is owned by an HCM system
(Workday/SAP-like) that ExampleHR does not control.

The core tension: the UI must give immediate feedback, but HCM is the source of truth
and can reject, delay, or silently misreport. Resolving this tension without confusing
the user or creating liability exposure is the central design challenge.

---

## 2. Key Design Decisions

### 2.1 Optimistic Update Strategy — "Pending", Not "Approved"

**Decision:** Optimistic UI with a `pending` state. The balance is decremented immediately
on submission, but the request is shown as **"pending HCM confirmation"** — never as
"approved" — until the full verified flow completes.

**Why not pessimistic (show spinner, wait for HCM)?**
Acceptable for correctness but unacceptable for UX. Time-off requests are high-stakes
interactions; showing a spinner for an indeterminate HCM call creates anxiety and
erodes trust in the product.

**Why not optimistic "approved"?**
Time-off balances carry legal and financial consequences. An employee who sees "approved"
may book travel, notify their manager, or make irreversible commitments. If HCM later
rejects the request, the system has created liability exposure and a broken trust
relationship. The assignment explicitly guards against this: *"Should never be told
'approved' and then later 'actually, denied.'"*

**Why "pending" works:**
It gives instant feedback (the user knows their action was received) without asserting
a state the system cannot yet guarantee. The rollback, if it happens, is expected —
the user was never told they were approved.

#### CAP Theorem Implication

This system must favor **Consistency over Availability** (CP in CAP terms). When a
partition occurs between ExampleHR and HCM:

- **Correct behavior:** the UI blocks, surfaces an error, and refuses to confirm a state
  it cannot verify.
- **Wrong behavior:** the UI shows "approved" to maintain availability, when HCM may
  deny the request moments later.

For an HR operation, a wrong answer is worse than a slow one. Availability is sacrificed
at partition boundaries in favor of a consistent, trustworthy state.

#### Database Design Implication (Forward-Looking)

If this system evolves to own its own datastore, the schema must reflect this consistency
requirement:

- Requests are stored as an **append-only event log**, not mutable rows. The HCM
  response is an external event appended as an immutable record.
- Status only moves forward through the state machine — it is never overwritten.
- This makes auditing, rollback, and consistency verification natural by design.
- The database is intentionally **not partition-tolerant** — it is a CP system. Under
  a partition, operations block rather than proceed with unverified state.

---

### 2.2 Request State Machine

Every time-off request moves through exactly these states, in order:

```
idle
  → optimistic-pending          (submitted, HCM call in-flight)
      → hcm-confirmed           (HCM 200 + reconcile re-fetch verifies version changed)
      → hcm-rejected            (HCM returned explicit rejection / 4xx)
      → hcm-conflict            (HCM returned 409)
      → hcm-silently-wrong      (HCM 200 but re-fetch shows balance unchanged)
      → optimistic-rolled-back  (any failure — surfaced to user, never silent)
```

No state transition is silent. Every failure path surfaces a visible, descriptive
state to the user. `optimistic-rolled-back` is the terminal failure state — the UI
never silently resets to `idle` after a failure.

---

### 2.3 Cache Invalidation Strategy

**Decision:** Per-request, per-mutation cache invalidation with read-after-write
consistency verification.

**Scope:** When a mutation fires for `[employeeId, locationId]`, only that cache entry
is invalidated — not the global balance corpus. Unrelated balances stay warm.

**The verified flow (non-negotiable):**

```
mutation commits (transaction confirmed)
  → cache entry invalidated (keyed by [employeeId, locationId])
  → read from primary / source-of-truth (not replica, not cache)
  → verify version / ETag / updated_at changed from pre-mutation value
  → only then: transition optimistic-pending → hcm-confirmed
```

A 200 response from HCM is not sufficient to confirm success. The re-fetch and version
check are mandatory — HCM can return 200 and silently not apply the change.

**Processing state tag:** For sensitive operations, a `processing` status tag is written
to the request record before the mutation fires. No downstream read acts on a request
in `processing` state. The tag is cleared only after the verified flow completes.

**Read-after-write consistency requirements:**
- Read from primary/master — never a replica (replica lag can return pre-mutation state
  and falsely trigger `hcm-silently-wrong`)
- Use the same DB connection/session for the post-mutation read when possible
- Enable strong consistency mode if the database supports it
- Every balance record carries a `version`, `updated_at`, or `ETag` — the post-mutation
  re-fetch must confirm this value changed

**Hidden caching layers to guard against:**
Replica lag, ORM identity-map caching, CDN/API gateway caching, and React Query's
client-side cache. Each layer must be explicitly accounted for in the post-mutation flow.
After a write, the cache must be one of: invalidated, updated atomically, or busted via
short TTL + explicit purge. Leaving a stale entry is not an option.

**Performance tradeoff:**
This strategy deliberately trades throughput for correctness. The synchronous
read-after-write adds latency to every mutation. This is acceptable because time-off
operations are low-frequency and high-stakes — not bulk operations where throughput
matters. The database is a CP system; correctness is the invariant, not speed.

---

### 2.4 Background Refresh & Reconciliation

**Decision:** Background polling with an in-flight mutation guard. The guard lives
in the data hook, not the component.

**Polling interval:** 30 seconds. Balances are not real-time data; 30s is frequent
enough to catch HCM-side changes (anniversary bonuses, year-start resets, manual
adjustments) without excessive server load.

**The collision problem:**
A background poll fires while a user has an optimistic update in-flight. If the poll
lands, it overwrites the pending balance with the pre-mutation value — the request
appears to silently vanish.

**Guard mechanism:**
`useBalance` checks `isMutating` for its cache key before allowing an incoming
re-fetch result to be written to the cache. While a mutation is in-flight for
`[employeeId, locationId]`, background poll results for that key are suppressed.
After the mutation settles, a fresh reconcile re-fetch is triggered explicitly.

**When a background refresh lands with no mutation in-flight:**
The balance updates and a visible `"Balance updated"` inline indicator is shown.
No page reload, no toast (toasts are disruptive for passive background events).
The `asOf` timestamp updates so the user can see when the value was last confirmed.

#### Tests (Required — must not be removed)

**Test: background refresh must not clobber in-flight optimistic state**
```
1. User has balance: 10 days
2. User submits request for 3 days
   → optimistic update applied → balance shows 7 days (pending)
3. Background poll fires, returns 10 days (pre-mutation value from HCM)
4. Assert: UI still shows 7 days (pending) — poll result is suppressed
5. Mutation settles (HCM confirms)
6. Assert: reconcile re-fetch fires → balance shows 7 days (confirmed)
```

**Test: background refresh lands cleanly when no mutation is in-flight**
```
1. User has balance: 10 days, no pending requests
2. HCM anniversary bonus fires externally → balance becomes 15 days
3. Background poll fires, returns 15 days
4. Assert: UI updates to 15 days with visible "Balance updated" indicator
5. Assert: no page reload required
```

---

### 2.5 Component Tree & State Ownership

**Principle:** State lives as low in the tree as possible. It moves up only when two
sibling subtrees genuinely need to share it. Lifting state down is always possible;
lifting it up after the fact is expensive and disruptive.

**Initial hydration via Server Components:**
The balance batch fetch runs as a Next.js Server Component. Data arrives pre-rendered —
no loading spinner on first paint. React Query's `HydrationBoundary` + `dehydrate`
transfers server-fetched data into the client cache. Subsequent reads hit the cache
instead of the network.

**Three tiers of state:**

| Tier | Mechanism | Contents |
|---|---|---|
| Server → Client | `HydrationBoundary` | Initial balance corpus (batch fetch) |
| Global (minority) | Context API | Current user identity (`employeeId`, `role`) |
| Local | `useState` / hook-local | Form fields, modal state, dismissed banners |

React Query sits outside this hierarchy — it is the shared cache, not a state manager.
Components call their own hooks; the cache deduplicates network calls automatically.
Context API is used sparingly — only for data that is genuinely global and changes
rarely or never during a session.

**`optimistic-pending` is derived, not stored:**
`useMutation` from React Query exposes `isPending` and `variables`. These are sufficient
to render the pending state. No separate `useState` is introduced for this. The component
that calls `useSubmitRequest()` owns the pending display locally — it does not propagate
this state upward.

**Background refresh safety lives in the hook:**
`useBalance` owns the guard logic. Components render what the hook returns; they have
no awareness of whether a poll result was suppressed. This keeps component code clean
and the guard logic testable in isolation.

---

### 2.6 Test Strategy

**Principle:** Each test layer guards a distinct class of regression. A bug that could
be caught by a unit test should never require an integration test to detect it.
The line between layers is strict.

#### Vitest — Unit Tests

Covers pure logic with no DOM or network:
- Hook state machine transitions
- Cache key factory (`lib/query-keys.ts`)
- ETag / version verification logic
- In-flight mutation guard logic
- Utility functions

These run in milliseconds and have zero external dependencies. **If this layer
disappears:** business logic regressions (wrong state transitions, incorrect cache keys,
broken version checks) go undetected silently.

#### Storybook — Visual States + Living API Documentation

Every meaningful component state gets a named story. Stories serve dual purpose:

1. **Interaction tests** — user clicks, form submits, state transitions via
   `@storybook/test`. Covers the component's behavior from the outside.
2. **API documentation** — `autodocs` + `argTypes` generate living prop documentation.
   Stories are the contract for what a component can look like. A state that exists
   in code but has no story does not exist as far as reviewers are concerned.

Required stories (minimum — enforced in CLAUDE.md):
`Loading`, `Empty`, `Stale`, `OptimisticPending`, `OptimisticRolledBack`,
`HcmRejected`, `HcmConflict`, `HcmSilentlyWrong`, `BalanceRefreshedMidSession`

**If this layer disappears:** UI regressions accumulate silently, and the component
API becomes undocumented tribal knowledge.

#### Vitest + MSW — Integration Tests

Full request lifecycle against shared MSW handlers. MSW intercepts HTTP at the network
level — same handlers run in both Storybook (browser) and Vitest (Node.js). Mock HCM
behavior is written once and shared across both environments.

Covers:
- Submit → HCM confirms → balance updates (happy path)
- Submit → HCM rejects → rollback visible to user
- Submit → HCM 200 → re-fetch disagrees → `hcm-silently-wrong` shown
- Submit → 409 conflict → rollback + conflict message
- Background refresh collision (the guard tests above)
- Background refresh with no mutation in-flight → balance updates with indicator
- Manager approval → balance re-fetched → confirmed

**If this layer disappears:** the optimistic update → rollback flow can silently break
without any unit test or story catching it. This is the highest-severity regression
class in this system.

**The line between layers:**
- Network interception required → integration test (Vitest + MSW)
- Rendered component, no network → Storybook interaction test
- Pure logic, no render → Vitest unit test
- No test belongs in two layers

---

## 3. Mock HCM Endpoints

Built as Next.js API route handlers under `app/api/hcm/`. Part of the test harness,
not production code. Failure rates are injected via request headers
(`X-HCM-Force-Failure: silent|conflict|timeout`) for deterministic test control.

| Endpoint | Default behavior |
|---|---|
| `GET /api/hcm/balance` | Per-cell read. ~5% chance of returning stale/wrong value. |
| `POST /api/hcm/balance` | Write. ~10% 409 conflict. ~5% silent failure. ~2% timeout. |
| `GET /api/hcm/balances` | Full batch corpus. Used for initial hydration only. |
| `POST /api/hcm/anniversary-bonus` | Manual trigger — adds bonus to all balances for given employee. |
| Internal timer | Anniversary bonus fires automatically every ~30s for a random employee in dev/test mode. |

---

## 4. Alternatives Considered

### Event-Driven Architecture (Rejected for Now)

**The architecture:** SSE or WebSocket from ExampleHR server to connected clients,
with ExampleHR subscribing to HCM internally.

```
HCM change event / webhook
  → ExampleHR event store
    → SSE / WebSocket to clients
      → React Query cache update (with sequence number guard)
```

**Why it's the correct long-term architecture:**
Events carry sequence numbers, making the background refresh collision problem trivially
solvable — buffer events while a mutation is in-flight, replay after it settles.
Eliminates polling overhead at scale.

**Why it's rejected for this implementation:**
HCM exposes a request/response API only — no push mechanism. Building an event
infrastructure (WebSocket server, event broker, at-least-once delivery, idempotency)
on top of a system we don't control exceeds the complexity budget. The polling +
in-flight guard achieves the same correctness guarantee at lower infrastructure cost.

**Named upgrade path:** When ExampleHR scales, replace the 30s poll with an SSE
stream from the ExampleHR server. The client-side guard logic remains identical —
only the delivery mechanism changes.

### Global State Manager (Redux / Zustand) — Rejected

A global store for balance data would duplicate React Query's cache with no benefit.
React Query already provides: deduplication, background refresh, cache invalidation,
optimistic update, and rollback. Adding a second cache layer creates two sources of
truth and a new class of sync bugs. Context API covers the minority of genuinely
global state (user identity, role) without this cost.

### Pessimistic Updates — Rejected

Correct but UX-unacceptable for the reasons described in §2.1. Spinners on every
time-off submission erode trust in a product that is supposed to feel instant.

---

## 5. Resolved Decisions

| Question | Decision | Rationale |
|---|---|---|
| ETag vs `version` field | `version: number` in response body | No header parsing complexity; works identically in MSW and Next.js routes; simpler to verify in tests |
| Manager staleness threshold | 60 seconds | One full poll cycle. HR/legal context means managers must never approve on data older than one reconciliation window. Re-fetch is forced automatically before approve/deny if `asOf` exceeds this. |
| Anniversary timer in CI | Opt-in via `HCM_ANNIVERSARY_TIMER_ENABLED=true` | Timer is a dev/demo simulation tool, not a test tool. Tests use `POST /api/hcm/anniversary-bonus` directly for deterministic control. Timer off by default prevents random balance changes from causing flaky CI failures. |
