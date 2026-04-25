# ExampleHR — Time-Off Frontend

## Project Purpose

Take-home frontend assignment building the Time-Off module for ExampleHR.
The HCM system (Workday/SAP-like) is the **source of truth** for balances. ExampleHR
presents and reconciles data from it — it never owns the numbers.

**Agentic constraint:** Do not write code that is not driven by a test or a Storybook story.
The TRD (`docs/TRD.md`) is the authoritative design; implementation must match it.
If you deviate during implementation, update the TRD and call it out explicitly.

---

## Non-Negotiable Tech Stack

| Concern | Tool |
|---|---|
| Framework | Next.js 14+ App Router (TypeScript strict) |
| Styling | Tailwind CSS |
| Data fetching / cache | TanStack Query v5 |
| Mock API | MSW v2 — used in both tests AND Storybook |
| Component dev | Storybook 8+ |
| Unit / component tests | Vitest + React Testing Library |
| Interaction tests | Storybook + `@storybook/test` |
| Integration tests | Playwright or Vitest + MSW |

Do not introduce alternative libraries for any of the above without updating this file
and documenting the reason in the TRD.

---

## Architecture Rules

### Data Layer

- Balances are **per-employee per-location**. Cache key is always `['balance', employeeId, locationId]`.
- **Initial load:** batch endpoint (hydrates all rows at once).
- **Real-time read:** per-cell endpoint — treat as authoritative over the batch result.
- **All mutations use optimistic updates.** On HCM rejection or conflict, roll back visibly. Never silently reset.
- After every mutation success response, schedule a background re-fetch to reconcile — HCM can silently lie.
- A background refresh **must not clobber** an in-flight mutation's optimistic state. Use React Query's `isMutating` guard or cancel/re-issue pattern.

### Request State Machine

Every time-off request moves through exactly these states:

```
idle
  → optimistic-pending       (user submitted, HCM call in-flight)
      → hcm-confirmed        (HCM 200 + reconcile re-fetch agrees)
      → hcm-rejected         (HCM returned 4xx / explicit rejection)
      → hcm-conflict         (HCM returned 409)
      → hcm-silently-wrong   (HCM returned 200 but re-fetch shows balance unchanged)
      → optimistic-rolled-back (any failure path — user must see this, never silent)
```

`optimistic-pending` shows **"pending"**, never "approved". The employee should never
see "approved" and then later "actually, denied."

### Mock HCM Endpoints (Next.js Route Handlers)

Build these as Next.js API routes under `app/api/hcm/`. They are part of the test
harness, not production code — make them realistic, not trivial.

| Endpoint | Behavior |
|---|---|
| `GET /api/hcm/balance` | Per-cell read (`locationId`, `employeeId`). ~5% chance of returning stale/wrong value (silent failure simulation). |
| `POST /api/hcm/balance` | Write a balance change. ~10% chance of 409 conflict. ~5% silent failure (200 but no change). |
| `GET /api/hcm/balances` | Batch corpus. Used for initial hydration. |
| `POST /api/hcm/anniversary-bonus` | Manually trigger a work-anniversary bonus for a given employee. |
| Internal timer | Anniversary bonus also fires automatically every ~30s for a random employee to simulate background HCM mutations. |

Inject randomness **at the handler level** using a seeded config so tests can control it.

### Storybook

- Every UI state gets its own named story — not just the happy path.
- Use MSW Storybook addon to control HCM behavior per-story.
- Required stories (minimum):
  - `Loading` — skeleton / initial fetch in-flight
  - `Empty` — no balances returned
  - `Stale` — data shown but marked as potentially outdated
  - `OptimisticPending` — request submitted, awaiting HCM
  - `OptimisticRolledBack` — HCM rejected, shown to user
  - `HcmRejected` — explicit HCM denial
  - `HcmSilentlyWrong` — 200 but re-fetch disagrees
  - `BalanceRefreshedMidSession` — anniversary bonus fired while user is viewing

---

## What NOT To Do

- Do **not** use `useEffect` to sync server data into local `useState`.
- Do **not** use a global store (Redux, Zustand) for server-owned data — React Query is the cache.
- Do **not** show "approved" in the UI before HCM confirms and the reconcile re-fetch passes.
- Do **not** mock the database or React Query cache in integration tests — use MSW handlers.
- Do **not** write comments explaining **what** code does. Only comment **why** when non-obvious (hidden constraint, workaround, invariant).
- Do **not** create a new component without a corresponding Storybook story.
- Do **not** add error handling for impossible scenarios. Only validate at system boundaries (HCM responses, form input).
- Do **not** write backwards-compatibility shims for removed code — just remove it.

---

## Testing Rules

| Test type | What it guards |
|---|---|
| Storybook interaction tests | Every story with user interaction — clicking, submitting, approving |
| Component tests (Vitest + RTL) | State transitions, optimistic update → rollback flow |
| Integration tests (MSW) | Full request lifecycle against the mock HCM, including conflict and silent failure paths |

**The highest-priority regression to guard:** optimistic update is applied, HCM rejects,
rollback is shown to user. If this silently breaks, the user sees phantom state.
Every integration test suite must include at least one rejection path.

---

## File Conventions

```
app/
  api/hcm/          # Mock HCM route handlers
  (employee)/       # Employee view routes
  (manager)/        # Manager view routes
components/
  ui/               # Primitive, stateless UI components
  features/         # Feature-level components (compose ui/ + data hooks)
hooks/
  use-balance.ts    # React Query hooks for balance reads
  use-request.ts    # Mutation hook for submitting requests
lib/
  hcm-client.ts     # Typed fetch wrapper for HCM endpoints
  query-keys.ts     # Centralized query key factory
stories/            # Co-located .stories.tsx files next to components
docs/
  TRD.md            # Technical Requirement Document (authoritative)
  PLAN.md           # Phased implementation plan
```

---

## Definition of Done (per phase)

A phase is done when:
1. All Storybook stories for that phase render correctly.
2. All tests for that phase pass.
3. TypeScript compiles with zero errors (`tsc --noEmit`).
4. No `any` types introduced without a `// eslint-disable` comment explaining why.
