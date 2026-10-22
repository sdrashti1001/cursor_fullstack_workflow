# Test conventions

Vitest + React Testing Library + jsdom, across all four React apps. Read when
writing or reviewing tests.

For bulk work ("write tests for everything in `containers/Surveys`"), use the
dedicated `frontend-unit-tests` skill instead — it has the full scoping and
global-mock-approval workflow. This file covers per-ticket test work.

## Ask before changing code

**Do not write or edit any file while scope, intent, or pattern choice is still
ambiguous.** Ask first — do not guess and proceed. Batch related questions into
one message; if the request is already explicit, proceed without asking.

Ask when unsure about:
- **Scope** — which app, directory, or files to include or exclude
- **Intent** — whether a failing test means the code is wrong or the test is
- **Pattern choice** — which nearby co-located test best matches this unit
- **Coverage depth** — smoke tests vs exhaustive branch coverage
- **Mocks** — what to stub vs render for real; whether a dependency is in scope
- **Global setup** — anything that might belong in an app's global mocks
- **Production code** — **never** change non-test source to make a test pass
  without explicit approval

---

## What to test

Judge per file; nothing is skipped by default. Prioritise:

- **Utils** — pure functions, edge cases, error paths
- **Hooks** — `renderHook`, state transitions, derived values
- **Components** — user-visible behaviour, callbacks, conditional rendering,
  validation display
- **Context providers** — selection state, param updates

Skip only when genuinely untestable in isolation (a one-line re-export). When
unsure, test it.

---

## Placement

Tests sit **beside** the file they test. Never create `test/`, `tests/`,
`__test__/`, or `__tests__/` directories for feature tests.

```
src/containers/Surveys/
├── fixtures.ts
├── components/
│   ├── Questions.tsx
│   └── Questions.test.tsx
├── hooks/
│   ├── useSurvey.ts
│   └── useSurvey.test.ts
├── utils.ts
└── utils.test.ts
```

`Foo.tsx` → `Foo.test.tsx`. `Foo.js` → `Foo.test.js`. `index.tsx` →
`index.test.tsx` in the same directory.

Exception: app-wide infrastructure such as `portal/src/test/`.

## Reference tests — read ONE before writing

| Pattern | File | Use for |
|---------|------|---------|
| Component + context | `portal/src/components/Selector/components/ListItem.test.tsx` | components with context, shared fixtures, per-dependency `vi.mock` |
| Container | `portal/src/containers/Surveys/components/Questions.test.tsx` | containers with many child UI mocks inline |
| Utils / hooks | `portal/src/components/Selector/utils.test.ts`, `portal/src/hooks/use-school-entities.test.ts` | pure functions, `renderHook`, store/query mocks |
| Variant tables | `parent-portal/src/components/Badge/Badge.test.tsx` | `it.each` |

Pick the closest co-located test. Read one, not three.

## Style

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
```

- **`fireEvent`**, not `@testing-library/user-event` — project convention.
- `screen` queries; prefer `getByRole`, `getByText`, `getByTestId`.
- `it.each` for variant tables.
- `beforeEach` to reset mutable mock state.
- No snapshot tests unless explicitly requested.
- Assert **behaviour**, not implementation details.

## Fixtures

- Shared feature fixtures → `fixtures.ts` at the nearest common feature root.
- Data used by one test stays in that test file.
- Never duplicate fixture data across tests in the same feature.

## Mocks

**Per-test / per-feature:** context providers, sibling/child components when
testing a parent in isolation, app hooks (`hooks/use-school-entities`,
`context/school-context`), `services/fetcher`, `@tanstack/react-query`, and any
package mock specific to one feature. Use `vi.hoisted()` when a mock factory
needs shared mutable state.

**Global — requires user approval.** Do not add one unilaterally. If a mock
looks global (third-party package used across many features, or the identical
mock repeated 3+ times), list it in the summary with rationale and wait.

Already global in portal: `@tanstack/react-virtual`,
`@fortawesome/react-fontawesome`, `@headlessui/react`, `components/Modal`,
`framer-motion`. In parent-portal: `react-i18next`, `@capacitor/core`,
`@capacitor/haptics`.

## What a ticket's tests must cover

| Ticket type | Cover |
|-------------|-------|
| new-feature | happy path per AC, user actions (click/type/submit/select), loading, error, empty/null data, API errors |
| bugfix | **regression** (reproduces the original bug — must fail without the fix), happy path, edge cases, existing behaviour preserved |
| pr-fixes | whatever the accepted comment's fix changed |
| feature-flagged | one full run with flag ON, one with flag OFF. Never assume symmetry. If the ticket says "existing flow unaffected when OFF", write a test that fails if the OFF path changed at all. |

## When production code changed

- **Fix the test** when the behaviour changed intentionally — update it to assert
  the *new* contract, don't delete assertions.
- **Fix the code** when the test exposed a real bug — and say so explicitly in
  the summary rather than quietly changing the test.
- If mocks are stale (renamed export, new dependency), update the mocks before
  touching assertions.

---

## Hook test shape

```ts
import { renderHook, act } from '@testing-library/react';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: undefined, isSuccess: false })),
}));

it('returns filtered pupils', () => {
  const { result } = renderHook(() => useSelectorPupils());
  expect(result.current).toEqual(/* … */);
});
```

---

## Running

```bash
cd portal && yarn test src/containers/Surveys/
```

Run from the owning app root. Fix failures before finishing — never leave a red
test.

## Coverage gate

Coverage is a **CI gate on new code**, and the required percentage is **higher
than 70% and varies by area** — 80% and 95% on new code have both been required
on portal. **Read the PR's own checks for the number that applies; never assume
a flat 70%.** Below the required threshold is a failing check, same as a red
test. If you cannot reach it honestly, say which branches are uncovered and why
rather than writing assertion-free tests to inflate the number.

## Anti-patterns

- Changing production source to make a test pass, without approval
- Adding a global mock without approval
- Dedicated `__tests__/` directories
- Duplicating fixtures within a feature
- Testing internal state or mock call order instead of user-visible outcomes
- `any` / `@ts-ignore` in new test files
- A test description that doesn't match what it asserts — rename it when the
  asserted behaviour changes (a name saying "with Till subtitle" that asserts
  there is no `Till:` line is a bug, not a style nit)
