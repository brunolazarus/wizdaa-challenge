# ExampleHR — Time-Off Frontend

Take-home frontend assignment. Implements the Time-Off module for ExampleHR: employee balance view, request submission, and manager approve/deny workflow.

The HCM system is the source of truth for all balances. This UI presents, optimistically updates, and reconciles data from it — it never owns the numbers.

---

## Running locally

```bash
npm install
npm run dev          # Next.js dev server — http://localhost:3000
```

**Routes:**
- `/` → Employee view (Alice Johnson, hardcoded for demo)
- `/manager` → Manager view (Sam Rivera, hardcoded for demo)

The HCM mock layer runs as Next.js API routes under `/api/hcm/*`. No external services required.

To simulate background anniversary bonus mutations in dev mode:

```bash
HCM_ANNIVERSARY_TIMER_ENABLED=true npm run dev
```

---

## Tests

```bash
npm run test              # all tests (unit + Storybook interaction)
npm run test:unit         # Vitest unit + integration tests only
npm run test:storybook    # Storybook interaction tests via @storybook/addon-vitest
npm run test:coverage     # unit tests with coverage report
```

---

## Storybook

```bash
npm run storybook         # dev server — http://localhost:6006
npm run build-storybook   # static build → storybook-static/
```

Every component has a corresponding story file co-located under `components/`. MSW intercepts all HCM network calls — no Next.js server required to run any story.

**Storybook (Chromatic):** _URL to be recorded after first deployment._

To deploy:

```bash
CHROMATIC_PROJECT_TOKEN=<your-token> npm run chromatic
```

---

## Architecture

| Concern | Tool |
|---|---|
| Framework | Next.js 16 App Router (TypeScript strict) |
| Styling | Tailwind CSS |
| Data fetching / cache | TanStack Query v5 |
| Mock API | MSW v2 (shared between Storybook, Vitest, and Next.js dev routes) |
| Component dev | Storybook 10 |
| Unit / component tests | Vitest + React Testing Library |
| Interaction tests | Storybook + `@storybook/addon-vitest` |

See `docs/TRD.md` for the full technical design and `docs/PLAN.md` for the phased implementation log.
