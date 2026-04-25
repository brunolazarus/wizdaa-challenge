# Implementation Plan — ExampleHR Time-Off Frontend

**Assignment:** Agentic frontend development. No code written manually.
**Stack:** Next.js 14 App Router · TanStack Query v5 · MSW v2 · Storybook 8 · Vitest + RTL
**Authoritative design:** `docs/TRD.md` (written before any code)

Each phase has a clear entry condition, a concrete output, and a definition of done.
Phases are sequential — do not start a phase until the previous one is done.

---

## Phase 0 — Foundation & TRD ✓

**Goal:** All design decisions are locked. Tooling runs. CI is wired.

### Open Questions — Resolved ✓

- [x] **ETag strategy:** `version: number` in response body. No header parsing; works
      identically in MSW and Next.js routes. See TRD §5.

- [x] **Manager staleness threshold:** 60 seconds. Re-fetch forced automatically before
      approve/deny if `asOf` exceeds this. See TRD §5.

- [x] **Anniversary timer:** Opt-in via `HCM_ANNIVERSARY_TIMER_ENABLED=true`. Timer is a
      dev/demo tool only — tests use `POST /api/hcm/anniversary-bonus` directly. See TRD §5.

### Scaffolding Tasks

- [x] `git init`, create GitHub repo, push initial commit (PDF + CLAUDE.md + PLAN.md + TRD.md)
- [x] Scaffold Next.js 14 project (`create-next-app` — TypeScript strict, Tailwind, App Router)
- [x] Install and configure: TanStack Query v5, MSW v2, Storybook 8, Vitest, RTL
- [x] Set up `lib/hcm-types.ts` — TypeScript interfaces for all HCM request/response shapes
      (shapes decided by open question above; block on that answer first)
- [x] Set up `lib/query-keys.ts` — centralized key factory
      (`queryKeys.balance(empId, locId)`, `queryKeys.balances()`, `queryKeys.requests()`)
- [x] Set up `lib/hcm-client.ts` — typed fetch wrapper (shape only, no logic)
- [x] Set up `UserContext` — provides `{ employeeId, role }` to the component tree
      (Context API, not React Query; this data is session-scoped and never re-fetches)
- [x] Configure MSW for Storybook (`msw-storybook-addon`) and for Vitest (`msw/node`)
- [x] GitHub Actions CI: `tsc --noEmit` + `vitest run` on every push
- [x] Verify: `npm run dev`, `npm run storybook`, `npm run test` all start without errors

### Done When
- All three open questions answered and recorded in TRD §5
- All tooling starts without errors on a fresh clone
- CI green on first push

---

## Phase 1 — Mock HCM Layer ✓

**Goal:** A realistic HCM simulator that can reproduce every interesting failure mode.
The mock logic is written **once** and shared between Storybook, Vitest, and dev mode.

### Shared Handler Architecture (Required)

Mock logic lives in `mocks/handlers.ts` — not duplicated across environments:

```
mocks/handlers.ts          ← single source of mock logic
  ├── Storybook             (browser, MSW Service Worker)
  ├── Vitest                (Node, MSW server via setupFilesAfterEach)
  └── app/api/hcm/**/route.ts  (Next.js thin wrappers — import handler logic directly)
```

Next.js API routes are thin wrappers over the same handler functions, not independent
implementations. This ensures dev-mode behavior matches test behavior exactly.

### Tasks

- [x] Define all TypeScript interfaces in `lib/hcm-types.ts`:
  - `HcmBalance`: `{ employeeId, locationId, balance, unit, asOf: ISO8601, version: number }`
  - `HcmBalanceBatch`: `{ rows: HcmBalance[] }`
  - `HcmWriteRequest`: `{ employeeId, locationId, delta, reason }`
  - `HcmWriteResponse`: `{ success: boolean, balance: HcmBalance }`
  - `HcmErrorResponse`: `{ code: 'CONFLICT' | 'REJECTED' | 'INSUFFICIENT_BALANCE', message: string }`

- [x] Seed data module (`mocks/seed.ts`):
  - 3 employees × 2 locations with varying balances and `version: 1`
  - Deterministic (no randomness in seed) so tests get consistent starting state

- [x] `mocks/handlers.ts` — MSW request handlers:
  - `GET /api/hcm/balance` — per-cell read
    - Returns `HcmBalance` including `version`
    - ~5% chance of returning stale/wrong value (silent failure) unless header overrides
  - `POST /api/hcm/balance` — write balance change
    - On success: increments `version`, updates `balance`, returns `HcmWriteResponse`
    - ~10% chance of 409 conflict
    - ~5% chance of silent failure (200 but `version` and `balance` unchanged)
    - ~2% chance of timeout (no response for 10s)
  - `GET /api/hcm/balances` — full batch corpus
    - Returns all rows with `version` and `asOf`
  - `POST /api/hcm/anniversary-bonus` — manual trigger
    - Adds bonus to all location balances for the given employee, increments `version`

- [x] `app/api/hcm/balance/route.ts` — thin wrapper over handler logic
- [x] `app/api/hcm/balances/route.ts` — thin wrapper
- [x] `app/api/hcm/anniversary-bonus/route.ts` — thin wrapper
- [x] Anniversary timer: fires every 30s in dev mode only when
      `NEXT_PUBLIC_HCM_ANNIVERSARY_TIMER=true`

- [x] Failure injection via request header `X-HCM-Force-Failure: silent|conflict|timeout`
      takes precedence over random rates (used by tests for deterministic control)

### Done When
- All endpoints return correct `HcmBalance` shapes including `version`
- Failure injection via header works and is tested
- MSW handlers load in both Storybook and Vitest without errors
- Next.js routes respond correctly in `npm run dev`

---

## Phase 2 — Data Layer ✓

**Goal:** React Query hooks that implement the full verified flow from TRD §2.3 —
optimistic update, ETag capture, read-after-write verification, and the in-flight guard.

### Tasks

#### Server-Side Hydration (replaces client-side batch fetch hook)

- [x] Server Component fetches batch corpus at request time using `lib/hcm-client.ts`
- [x] `dehydrate(queryClient)` + `<HydrationBoundary>` transfers server data into client cache
- [x] Per-cell cache entries are pre-populated from batch result on first render
- [x] No `useBalanceBatch` hook — the Server Component owns initial hydration

#### `useBalance(employeeId, locationId)`

- [x] Polls every 30s (`refetchInterval: 30_000`)
- [x] Before writing a poll result to cache, checks `useIsMutating({ mutationKey: queryKeys.balance(employeeId, locationId) })`
- [x] If a mutation is in-flight for this key: suppress the poll result (do not update cache)
- [x] Returns `{ data: HcmBalance, isStale, isFetching, asOf }`

#### `useSubmitRequest()`

Implements the full verified flow from TRD §2.3:

- [x] Before firing: write `processing` flag to request record (prevents downstream reads from acting on unsettled state)
- [x] Capture pre-mutation `version` from current cache entry
- [x] Apply optimistic update: decrement balance, set request status to `optimistic-pending`
- [x] Fire `POST /api/hcm/balance`
- [x] On any response (success or error): invalidate cache entry `[employeeId, locationId]`
- [x] Trigger read-after-write re-fetch from primary (not cache)
- [x] Verify `version` changed from pre-mutation value:
  - Version changed → transition to `hcm-confirmed`, clear `processing` flag
  - Version unchanged (HCM 200 but no write) → transition to `hcm-silently-wrong`, roll back
- [x] On HCM 4xx rejection: roll back optimistic update, transition to `hcm-rejected`
- [x] On HCM 409: roll back, transition to `hcm-conflict`
- [x] On any failure: transition to `optimistic-rolled-back` — never silently reset to `idle`

#### `useApproveRequest()` / `useDenyRequest()`

- [x] Before action: re-fetch employee's balance (force fresh from primary)
- [x] Block action if `asOf` is older than the staleness threshold (resolved in Phase 0)
- [x] On success: invalidate request list cache

#### Query key factory (`lib/query-keys.ts`)

- [x] `queryKeys.balance(empId, locId)` — used as both query key and mutation key (enables `useIsMutating` filter)
- [x] `queryKeys.balances()`
- [x] `queryKeys.requests()`
- [x] `queryKeys.request(requestId)`

### Done When
- All hooks typed, no `any`
- Unit tests: state machine transitions, version verification logic, guard logic
- Integration tests (Vitest + MSW):
  - **Required test A** (from TRD §2.4): background poll fires while mutation in-flight → poll suppressed → mutation settles → re-fetch confirms correct balance
  - **Required test B** (from TRD §2.4): background poll fires with no mutation → balance updates with indicator
  - `useSubmitRequest` drives through all 5 terminal states (confirmed, rejected, conflict, silently-wrong, rolled-back)

---

## Phase 3 — Employee View ✓

**Goal:** The employee sees honest, up-to-date balances and gets accurate feedback at every step of a request.

### Tasks

#### Context

- [x] `UserContext` wired at layout level (`app/(employee)/layout.tsx`)
      Provides `{ employeeId, role: 'employee' }` — consumed by hooks, not drilled as props

#### Components

- [x] `BalanceTable` — per-location rows, consumes `useBalance` per row
- [x] `BalanceCell` — single cell showing balance, unit, `asOf` timestamp, staleness indicator
      Must show `"Balance updated"` inline indicator when poll lands a new value mid-session
- [x] `RequestForm` — location selector, date range, reason field
      Disabled while a mutation is in-flight for the selected location
- [x] `RequestStatusBanner` — renders current request state:
      `optimistic-pending` | `hcm-confirmed` | `hcm-rejected` | `hcm-conflict` | `hcm-silently-wrong` | `optimistic-rolled-back`
      Never shows "approved" — shows "confirmed by HCM" at most
- [x] `StaleDataWarning` — shown when the balance at submission time differs from the
      balance returned by the post-mutation re-fetch

#### Storybook Stories (with `argTypes` for API docs)

- [x] `BalanceTable`: `Loading`, `Empty`, `Stale`, `BalanceRefreshedMidSession`
- [x] `BalanceCell`: `Default`, `Loading`, `Stale`, `Refreshing`, `JustUpdated`
- [x] `RequestForm`: `Idle`, `Submitting`, `Disabled`, `OptimisticRolledBack`, `HcmSilentlyWrong`
- [x] `RequestStatusBanner`: `OptimisticPending`, `HcmConfirmed`, `HcmRejected`,
      `HcmConflict`, `HcmSilentlyWrong`, `OptimisticRolledBack`

All stories: configure `argTypes` for every prop. Enable `autodocs` on the component.
MSW addon controls HCM behavior per-story — no network required.

### Done When
- [x] All stories render with MSW-controlled HCM
- [x] Storybook interaction test: submit form → `OptimisticPending` → MSW returns 4xx → `OptimisticRolledBack`
- [x] Storybook interaction test: submit form → `OptimisticPending` → MSW silent failure → `HcmSilentlyWrong`
- [x] TypeScript clean, no `any`

---

## Phase 4 — Manager View ✓

**Goal:** A manager approves or denies requests with confidence that the balance is accurate at the exact moment of decision.

### Tasks

#### Context

- [x] `UserContext` wired at layout level (`app/(manager)/layout.tsx`)
      Provides `{ employeeId, role: 'manager' }`

#### Components

- [x] `PendingRequestList` — lists all pending requests across all employees
- [x] `RequestCard` — request details + employee's current balance
      Balance is freshly fetched when the card mounts (not from stale cache)
- [x] `BalanceFreshnessIndicator` — shows `asOf` timestamp; shows warning if older than
      the staleness threshold resolved in Phase 0
- [x] `ApproveButton` / `DenyButton` — inline in `RequestCard`; blocked while balance is
      stale or fetching; `ensureFreshBalance` in the mutation hook serves as safety net

#### Storybook Stories

- [x] `PendingRequestList`: `Loading`, `Empty`, `WithRequests`
- [x] `RequestCard`: `PendingWithFreshBalance`, `PendingWithStaleBalance`,
      `ApprovingInFlight`, `ApproveConfirmed`, `DenyConfirmed`
- [x] `BalanceFreshnessIndicator`: `Fresh`, `Stale`, `Refreshing`

All stories: `argTypes` configured, `autodocs` enabled, MSW controls HCM.

### Done When
- [x] Manager cannot approve if balance `asOf` exceeds staleness threshold (re-fetch triggered automatically)
- [x] Storybook interaction test: click approve → balance re-fetch fires → `ApproveConfirmed`
- [x] Storybook interaction test: click deny → `DenyConfirmed`
- [x] TypeScript clean, no `any`

---

## Phase 5 — Storybook Coverage Pass & Deployment ✓

**Goal:** Every meaningful UI state is a story. Storybook is deployed and serves as
living API documentation. No network required to run any story.

### Tasks

- [x] Audit all components against required state matrix in `CLAUDE.md` — add missing stories
- [x] Verify all stories have `argTypes` configured for every prop
- [x] Verify `autodocs` is enabled for every component
- [x] Storybook interaction tests pass for every story with user interaction
      (Fixed `RequestForm` labels — missing `htmlFor`/`id` pairs broke `getByLabelText`)
- [x] MSW Storybook addon: each story is fully self-contained — no Next.js server required
- [x] Deploy Storybook to **Chromatic**
- [x] Record Chromatic URL in `README.md` — https://www.chromatic.com/library?appId=69ed208e81b16d489bd7d877

### Done When
- [x] `storybook build` succeeds with zero errors
- [x] Every required story exists and its interaction test passes
- [x] Storybook accessible via Chromatic URL without running the app locally

---

## Phase 6 — Test Suite Hardening

**Goal:** A test suite that future contributors cannot silently break. Coverage thresholds
enforced in CI.

### Test Inventory (Vitest + MSW — no Playwright)

All integration tests use Vitest + MSW. Playwright is not introduced — MSW provides
sufficient network interception for the integration layer without a real browser.

#### Required Integration Tests

- [ ] **Happy path:** submit request → HCM confirms → `version` incremented → `hcm-confirmed`
- [ ] **Rejection path:** submit → HCM 4xx → rollback → `hcm-rejected` visible
- [ ] **Silent failure path:** submit → HCM 200 → `version` unchanged → `hcm-silently-wrong` visible
- [ ] **Conflict path:** submit → HCM 409 → rollback → `hcm-conflict` visible
- [ ] **Required test A (TRD §2.4):** background poll fires during in-flight mutation →
      poll suppressed → mutation settles → reconcile re-fetch confirms balance
- [ ] **Required test B (TRD §2.4):** background poll fires with no mutation →
      balance updates → `"Balance updated"` indicator visible, no page reload
- [ ] **Manager approval path:** click approve → balance re-fetched fresh → `version`
      verified → approved
- [ ] **Staleness block:** balance older than threshold → approve button blocked →
      re-fetch triggered → button re-enabled

#### Coverage Thresholds

- [ ] Add to `vitest.config.ts`:
  - `hooks/`: branches ≥ 80%
  - `lib/`: branches ≥ 80%
  - `components/`: statements ≥ 70%
- [ ] CI fails if thresholds are not met

### Done When
- All integration tests pass
- `vitest --coverage` meets all thresholds
- CI green on a fresh clone with no local state

---

## Phase 7 — Finalization & Delivery

**Goal:** The repo is clean, the TRD reflects what was built, and everything works on
a fresh clone.

### Tasks

- [x] Resolve any remaining open questions from TRD §5 — all three questions resolved, no open items
- [x] Review TRD §2 against actual implementation — two deviations recorded in TRD §5
- [x] Remove all TODO comments and debug logging — none found
- [x] `README.md`: how to run dev, how to run tests, how to run Storybook locally,
      Chromatic URL, brief architecture summary
- [x] Final `tsc --noEmit` — zero errors
- [x] Final `vitest run` — 62 tests passing
- [x] Final `storybook build` — zero errors
- [x] Tag release commit on GitHub — `v1.0.0` on `51af9e9`

### Done When
- Repo submitted with: TRD, code, test suite passing, Chromatic Storybook URL in README

---

## Dependency Graph

```
Phase 0 (Foundation — open questions + scaffold)
    ↓
Phase 1 (Mock HCM — shared handlers)
    ↓
Phase 2 (Data Layer — hooks + verified flow)
    ↓
Phase 3 (Employee View) ──┬──→ Phase 5 (Storybook Pass + Chromatic)
                           │         ↓
Phase 4 (Manager View) ───┘   Phase 6 (Test Hardening)
                                      ↓
                               Phase 7 (Finalization)
```

Phase 3 and Phase 4 can overlap once Phase 2 is stable.
Storybook stories are added as components are built — Phase 5 is a pass, not a start.
Phase 6 integration tests reference the same MSW handlers built in Phase 1.
```
