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
relationship. The assignment explicitly guards against this: _"Should never be told
'approved' and then later 'actually, denied.'"_

**Why "pending" works:**
It gives instant feedback (the user knows their action was received) without asserting
a state the system cannot yet guarantee. The rollback, if it happens, is expected —
the user was never told they were approved.

#### Consistency Model

This system does not control the source of truth (HCM) and cannot enforce distributed
consistency guarantees like CP or AP. Instead, it enforces a **UX-level consistency
contract**:

- The UI never asserts a state it cannot verify
- All optimistic states are explicitly labeled as unconfirmed
- Every mutation is followed by read-after-write verification against the authoritative source

**Guiding principle:** Prefer honest latency over false certainty. A user who waits
briefly for confirmation is better served than one who receives a confident answer that
later proves wrong. The relevant question is not "CP or AP?" but "what can this UI
honestly claim to know?"

When verification fails or HCM is unreachable, the correct behavior is to surface an
honest error state — not to silently preserve an optimistic state that cannot be
confirmed. Availability is not sacrificed as a theorem violation; it is simply not the
right tradeoff for an HR operation where a wrong answer creates real-world consequences.

#### Database Design Implication (Forward-Looking)

If this system evolves to own its own datastore, the schema should reflect this same
commitment to auditability:

- Requests stored as an **append-only event log** — status is derived, never overwritten.
- HCM responses appended as immutable external events.
- This makes reconciliation, rollback, and audit natural by design rather than bolted on.

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

#### UX Contract Per State

| State | Label | Message | Actions |
|---|---|---|---|
| `optimistic-pending` | Pending | "Your request has been submitted and is awaiting HCM confirmation." | — (form locked) |
| `hcm-confirmed` | Confirmed by HCM | "HCM confirmed your request and the balance has been updated." | Dismiss |
| `hcm-rejected` | Request rejected | "HCM rejected this request. Your balance has not changed." | Dismiss |
| `hcm-conflict` | Conflict detected | "A conflicting change occurred at the same time. Please try again." | Dismiss, Retry |
| `hcm-silently-wrong` | Unconfirmed | "HCM acknowledged the request but the balance did not update as expected. Your previous balance has been restored." | Dismiss, Retry |
| `optimistic-rolled-back` | Rolled back | "The request could not be completed. Your balance has been restored." | Dismiss, Retry |

**Retry behavior:** Retry reuses the same `requestId` (idempotency key — see §2.7).
The UI re-enters `optimistic-pending` without creating a new request record on the
HCM side.

---

### 2.3 Cache Invalidation Strategy

**Decision:** Per-request, per-mutation cache invalidation with read-after-write
consistency verification.

**Scope:** When a mutation fires for `[employeeId, locationId]`, only that cache entry
is invalidated — not the global balance corpus. Unrelated balances stay warm.

**The verified flow:**

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

> **Implementation note:** The `processing` tag was not implemented as a separate
> record annotation. Instead, `useSubmitRequest` uses React Query's `cancelQueries`
> in `onMutate` to prevent any in-flight reads from acting on pre-mutation state, and
> `useBalance`'s `isMutating` guard suppresses background polls for the duration of
> the mutation. These two mechanisms together satisfy the same invariant without
> introducing a separate status field on the request record.

**Read-after-write consistency requirements:**

- Read from primary/master (replica lag can return pre-mutation state
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

#### Baseline behavior

- **Interval:** 30 seconds per `[employeeId, locationId]` key.
- **Scope:** Per-cell — only the viewed employee's balances are polled, not the full corpus.
- **Visibility-aware:** Polling pauses when the browser tab is hidden and resumes on
  focus. This avoids unnecessary HCM load and stale-data churn on inactive sessions.
  (`refetchIntervalInBackground: false` in TanStack Query.)

#### The collision problem

A background poll fires while a user has an optimistic update in-flight. If the poll
lands, it overwrites the pending balance with the pre-mutation value — the request
appears to silently vanish.

**Guard mechanism:**
`useBalance` checks `isMutating` for its cache key before allowing an incoming
re-fetch result to be written to the cache. While a mutation is in-flight for
`[employeeId, locationId]`, background poll results for that key are suppressed.
After the mutation settles, a fresh reconcile re-fetch is triggered explicitly.

#### Backoff under repeated failure

On consecutive HCM read failures, polling interval increases:
`30s → 60s → 120s` (capped). The degraded state is surfaced to the user (see §2.9).
A successful read resets the interval to baseline.

#### When a background refresh lands cleanly

The balance updates and a visible `"Balance updated"` inline indicator is shown for
~3 seconds. No toast, no page reload — passive background events should not interrupt
the user's workflow. The `asOf` timestamp updates so the user can see when the value
was last confirmed by HCM.

#### Upgrade path

Polling is a fallback synchronization mechanism. It is replaceable by an SSE or
WebSocket stream from the ExampleHR server without changing client-side guard logic —
only the delivery mechanism changes. The `asOf` field and version check remain valid
in both models.

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

| Tier              | Mechanism               | Contents                                     |
| ----------------- | ----------------------- | -------------------------------------------- |
| Server → Client   | `HydrationBoundary`     | Initial balance corpus (batch fetch)         |
| Global (minority) | Context API             | Current user identity (`employeeId`, `role`) |
| Local             | `useState` / hook-local | Form fields, modal state, dismissed banners  |

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

### 2.7 Mutation Semantics & Idempotency

All write operations to HCM are treated as **non-idempotent by default**. Without
an explicit idempotency strategy, network retries — whether triggered by the user,
the browser, or a timeout — can result in duplicate balance deductions or inconsistent
request state. This is a data corruption class of bug, not a UX one.

#### Idempotency key design

Each submission generates a **client-side `requestId`** (UUID v4) at the moment the
user clicks submit. This key is:

- Sent with every write to HCM (`POST /api/hcm/balance`, `POST /api/hcm/requests/:id/approve`)
- Stable across retries for the same user action
- Used by the mock HCM layer to detect and deduplicate replays

**Flow:**
```
User submits request
  → client generates requestId (UUID)
  → requestId stored in mutation state
  → POST /api/hcm/balance { ..., requestId }
  → HCM checks: has this requestId been processed?
      → Yes: return previous result (idempotent replay)
      → No: process and record requestId
```

#### UI behavior under retry

- Retry reuses the same `requestId` — no new request is created on the HCM side
- UI re-enters `optimistic-pending` without resetting the balance
- If the duplicate response returns a different result than the original, treat it as
  `hcm-conflict` — this indicates a consistency anomaly in HCM itself

> **Implementation status:** The `requestId` contract is designed here and reflected
> in the UX state machine (§2.2 retry actions). It is not yet wired into the mock
> HCM layer — the mock currently relies on the stateful store to handle duplicates
> naturally. Full idempotency key propagation is deferred to a production HCM
> integration.

---

### 2.8 Multi-Actor Concurrency

The system must handle concurrent actions from three actor types:
- **Employee** submitting requests
- **Manager** approving or denying
- **HCM** mutating balances externally (anniversary bonus, year-start reset)

#### Key race conditions

| Race | Risk | Mitigation |
|---|---|---|
| Employee submits while manager is approving a different request for the same employee | Manager approves on a balance that is about to decrease | Manager-side revalidation (see below) |
| Manager approves using a balance read >60s ago | Approval granted against stale data | Force re-fetch before action; block if `asOf` exceeds threshold |
| External HCM update occurs between employee submit and manager approval | Approved balance becomes negative at HCM | Version check on approval; HCM returns 409 on conflict |
| Two managers act on the same request concurrently | Double approval / denial | HCM request store enforces settled state; returns 409 on second action |

#### Manager-side revalidation

Before approve or deny:
1. Force fresh balance read from HCM primary (not from cache)
2. Block action if `asOf` exceeds the 60s staleness threshold
3. Proceed only after fresh balance is confirmed

This is implemented in `ensureFreshBalance` inside `useApproveRequest` /
`useDenyRequest`, with a UI-level disable while the re-fetch is in-flight.

#### Optimistic isolation

Pending requests are treated as **reserved balance** at the UI layer. A manager
viewing an employee's balance sees:
- Current HCM-reported balance
- Pending requests reducing effective available balance

This prevents a manager from approving a request that would leave the employee with
a negative balance, even if the HCM-reported number has not yet been decremented.

> **Implementation status:** The staleness guard and manager re-fetch are implemented.
> The "effective available balance" display (current minus pending) is a forward-looking
> enhancement — the current manager view shows HCM balance only.

---

### 2.9 Failure Modes & Degraded Operation

The system must fail transparently. Silent degradation — where the UI continues to
appear functional while returning unreliable data — is a worse outcome than an
explicit error state.

#### Read failure

When a balance read fails or times out:
- Show last known value with a visible staleness warning (`"Data may be outdated"`)
- Disable approve/deny actions if `asOf` exceeds the staleness threshold
- Trigger backoff on subsequent polls (see §2.4)

The user retains read access to the last known state. No data is shown as current
when it cannot be verified.

#### Write failure

When a mutation fails:
- Request transitions to the appropriate terminal state (`hcm-rejected`, `hcm-conflict`,
  `optimistic-rolled-back`) — never silently to `idle`
- Balance is rolled back to its pre-mutation value
- User is offered a retry action where appropriate (see §2.2 UX contracts)

#### Extended HCM unavailability

When repeated reads and writes fail over a sustained window:
- Surface a degraded-mode indicator at the page level:
  `"Time-off system is having trouble connecting. Balances may be outdated."`
- Block new submissions while HCM is unresponsive — submitting against unverifiable
  state creates requests that cannot be confirmed or rolled back reliably
- Read-only access remains available using the last known cached values

> **Implementation status:** The per-operation failure states are implemented.
> The global degraded-mode banner and submission block are designed here but deferred
> — the current implementation surfaces failures at the per-request level only.

#### Principle

The system aims to fail loudly and specifically. Every failure state names what went
wrong and what the user can do next. Ambiguous errors ("Something went wrong") are
not acceptable for an HR system where the stakes of a wrong answer are real.

---

## 3. Mock HCM Endpoints

Built as Next.js API route handlers under `app/api/hcm/`. Part of the test harness,
not production code. Failure rates are injected via request headers
(`X-HCM-Force-Failure: silent|conflict|timeout`) for deterministic test control.

| Endpoint                          | Default behavior                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| `GET /api/hcm/balance`            | Per-cell read. ~5% chance of returning stale/wrong value.                                |
| `POST /api/hcm/balance`           | Write. ~10% 409 conflict. ~5% silent failure. ~2% timeout.                               |
| `GET /api/hcm/balances`           | Full batch corpus. Used for initial hydration only.                                      |
| `POST /api/hcm/anniversary-bonus` | Manual trigger — adds bonus to all balances for given employee.                          |
| Internal timer                    | Anniversary bonus fires automatically every ~30s for a random employee in dev/test mode. |

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

## 5. Implementation Deviations

| TRD spec                                                    | What was built                                       | Reason                                                                                        |
| ----------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `processing` flag written to request record before mutation | `cancelQueries` + `isMutating` guard in `useBalance` | Same invariant, simpler — no extra field; guard lives in the data layer not the request model |
| `ApproveButton` / `DenyButton` as separate components       | Approve/Deny buttons are inline in `RequestCard`     | The buttons have no reuse outside that card; extracting them would be premature abstraction   |

---

## 6. Resolved Decisions

| Question                    | Decision                                        | Rationale                                                                                                                                                                                                                  |
| --------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ETag vs `version` field     | `version: number` in response body              | No header parsing complexity; works identically in MSW and Next.js routes; simpler to verify in tests                                                                                                                      |
| Manager staleness threshold | 60 seconds                                      | One full poll cycle. HR/legal context means managers must never approve on data older than one reconciliation window. Re-fetch is forced automatically before approve/deny if `asOf` exceeds this.                         |
| Anniversary timer in CI     | Opt-in via `HCM_ANNIVERSARY_TIMER_ENABLED=true` | Timer is a dev/demo simulation tool, not a test tool. Tests use `POST /api/hcm/anniversary-bonus` directly for deterministic control. Timer off by default prevents random balance changes from causing flaky CI failures. |
