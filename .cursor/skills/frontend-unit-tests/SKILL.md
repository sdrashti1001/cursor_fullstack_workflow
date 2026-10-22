---
name: frontend-unit-tests
description: >-
  Writes and updates Vitest unit tests for School Spider React frontend apps
  (portal, parent-portal, pupil-portal, teacher-app). Activates when creating
  tests for a file or directory, adding coverage to a feature area, fixing
  broken tests after code changes, or when the user mentions unit tests, vitest,
  test coverage, fixtures, or mocking components/hooks. Asks clarifying questions
  before changing any code when scope or intent is unclear. Covers test placement,
  fixtures, vi.mock patterns, and global mock candidates.
---

# Frontend Unit Tests

Vitest + React Testing Library + jsdom. Applies to `portal/`, `parent-portal/`, `pupil-portal/`, and `teacher-app/`.

## When to Apply

- User asks to create unit tests for a **file** or **directory** (e.g. `src/containers/surveys`)
- User asks to **update or fix** tests after production code changed
- User mentions fixtures, mocks, or `vitest.setup.ts`

## Ask Before Changing Code

**Do not write or edit any files until ambiguities are resolved.** If anything is unclear, ask the user first — do not guess and proceed.

Ask when unsure about:

- **Scope** — which app, directory, or files to include or exclude
- **Intent** — whether a failing test means the code or the test is wrong
- **Pattern choice** — which nearby co-located test best matches the unit under test
- **Coverage depth** — smoke tests vs exhaustive branch coverage
- **Mocks** — what to stub vs render for real; whether a dependency is in scope
- **Global setup** — anything that might belong in an app's global mocks
- **Production code** — never change non-test source to make tests pass without explicit approval

Batch related questions in one message. If the user's prompt is already explicit, proceed without unnecessary questions.

## Reference Patterns

Read the closest existing tests before writing new ones:

| Pattern | Location | Use when |
|---------|----------|----------|
| **Selector** | `portal/src/components/Selector/components/ListItem.test.tsx` | Components with context, shared fixtures, `vi.mock` per dependency |
| **Surveys** | `portal/src/containers/Surveys/components/Questions.test.tsx` | Container components with many child UI mocks inline |
| **Utils/hooks** | `portal/src/components/Selector/utils.test.ts`, `portal/src/hooks/use-school-entities.test.ts` | Pure functions, `renderHook`, store/query mocks |

Pick the closest co-located test that best matches the code under test.

## File Layout

### Placement

Put every test **beside the source file it tests**:

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

Do **not** create dedicated `test/`, `tests/`, `__test__/`, or `__tests__/` directories for feature tests. App-wide test infrastructure such as `portal/src/test/` is the exception. For an `index.tsx`, use `index.test.tsx` in the same directory.

### Naming

| Source | Test file |
|--------|-----------|
| `Foo.tsx` / `Foo.ts` | `Foo.test.tsx` / `Foo.test.ts` |
| `Foo.jsx` / `Foo.js` | `Foo.test.jsx` / `Foo.test.js` |

### Fixtures

- Put shared feature fixtures in `fixtures.ts` at the nearest common feature root
- Keep data used by only one test in that test file
- Split to a feature-level `fixtures/` directory only when a single file becomes unwieldy
- Reuse fixtures across tests in the same feature; do not duplicate mock data

## What to Test

Judge per file — nothing is skipped by default. Prioritise:

- **Utils** — pure functions, edge cases, error paths
- **Hooks** — `renderHook`, state transitions, derived values
- **Components** — user-visible behaviour, callbacks, conditional rendering, validation display
- **Context providers** — selection state, param updates (see `SelectorContext.test.tsx`)

Skip only when genuinely untestable in isolation (e.g. a one-line re-export). When unsure, test it.

## Mock Strategy

### Per-test / per-feature (`vi.mock` in test file or fixtures)

- React context providers used by the unit under test
- Sibling/child components when testing a parent in isolation
- App hooks (`hooks/use-school-entities`, `context/school-context`)
- `services/fetcher`, `@tanstack/react-query` (per hook test)
- Package mocks that are **specific to one feature** or need per-test behaviour (e.g. deterministic `nanoid`)

Use `vi.hoisted()` when mock factories need shared mutable state across `vi.mock` and test bodies.

### Global

Each app has its own setup file:

| App | Setup file |
|-----|------------|
| portal | `portal/vitest.setup.ts` |
| parent-portal | `parent-portal/vitest.setup.ts` |
| pupil-portal | `pupil-portal/vitest.setup.ts` |
| teacher-app | `teacher-app/vitest.setup.ts` |

Portal-wide mocks live in `portal/src/test/mocks.ts`, which is loaded by `portal/vitest.setup.ts`. Keep `vitest.setup.ts` limited to setup imports. Other apps should follow their existing global setup structure.

**Do not add a global mock without user approval.** When a mock looks global (third-party package used across many features, or identical mock repeated 3+ times), list it in the completion summary with rationale and wait for confirmation.

Portal globals today include `@tanstack/react-virtual`, `@fortawesome/react-fontawesome`, `@headlessui/react`, `components/Modal`, and `framer-motion`. Parent-portal includes `react-i18next`, `@capacitor/core`, and `@capacitor/haptics`.

## Test Style

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
```

- Use **`fireEvent`** (project convention; no `@testing-library/user-event`)
- Use **`screen`** queries; prefer `getByRole`, `getByText`, `getByTestId`
- Use **`it.each`** for variant tables (see `parent-portal/src/components/Badge/Badge.test.tsx`)
- Use **`beforeEach`** to reset mutable mock state
- No snapshot tests unless the user explicitly requests them
- Assert **behaviour**, not implementation details

### Component test pattern

```typescript
vi.mock('../context/MyContext', () => ({
  useMyContext: () => context,
}));

beforeEach(() => {
  context = mockMyContext();
});

it('calls onSubmit when form is valid', () => {
  render(<MyForm onSubmit={onSubmit} />);
  fireEvent.click(screen.getByRole('button', { name: /save/i }));
  expect(onSubmit).toHaveBeenCalledWith(/* ... */);
});
```

### Hook test pattern

```typescript
import { renderHook, act } from '@testing-library/react';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: undefined, isSuccess: false })),
}));

it('returns filtered pupils', () => {
  const { result } = renderHook(() => useSelectorPupils());
  expect(result.current).toEqual(/* ... */);
});
```

## Creating Tests

Copy this checklist and track progress:

```
Task Progress:
- [ ] Step 0: Ask the user about anything unclear (scope, pattern, mocks) — do not change code until resolved
- [ ] Step 1: Identify app and target path(s)
- [ ] Step 2: Read the closest co-located reference tests
- [ ] Step 3: List testable files; skip only truly untestable
- [ ] Step 4: Create each test beside its source; add feature-root fixtures.ts if needed
- [ ] Step 5: Write tests file-by-file
- [ ] Step 6: Run vitest for all new files; fix failures
- [ ] Step 7: Summarise global mock candidates (do not add without approval)
```

**Step 1 — Identify app**

Determine which app owns the path. Run tests from that app directory:

```bash
cd portal && yarn test path/to/File.test.tsx
```

**Step 2 — Read references**

Before writing, read at least one similar existing test in the same app.

**Step 3 — Scope**

For a directory prompt like *"create unit tests for everything testable in surveys"*:

1. List components, utils, hooks under the path
2. Check which already have tests; only add missing coverage or extend thin coverage
3. Group shared mock data into `fixtures.ts` at the nearest common feature root

**Step 4–5 — Implement**

- Co-locate every test with its source file
- One test file per source file (unless utils are trivially grouped)
- Keep mocks minimal — mock dependencies, not the unit under test
- For containers with heavy UI trees, mock child components as simple stubs (Surveys pattern)

**Step 6 — Run**

Run every new or changed test file and fix failures before finishing:

```bash
cd portal && yarn test src/containers/Surveys/
cd portal && yarn test src/containers/Surveys/components/Questions.test.tsx
```

Run from the relevant app root (`portal`, `parent-portal`, etc.).

## Updating Tests

Use when production code changed and tests fail or need new assertions.

```
Task Progress:
- [ ] Step 0: Ask the user about anything unclear (failing behaviour, whether code or test should change) — do not change code until resolved
- [ ] Step 1: Run failing test(s) to capture errors
- [ ] Step 2: Read the production code diff — understand intentional behaviour change
- [ ] Step 3: Update tests to match new behaviour (not old behaviour)
- [ ] Step 4: Add tests for new branches/paths introduced by the change
- [ ] Step 5: Re-run all affected test files; fix until green
- [ ] Step 6: Summarise any global mock candidates
```

- **Fix the test** when behaviour intentionally changed
- **Fix the code** when the test exposed a real bug — say so in the summary
- Do not delete assertions without reason; replace with assertions for the new contract
- If mocks are stale (renamed export, new dependency), update mocks before assertions

## Completion Summary

Always end with:

```markdown
## Tests written/updated
- `path/to/Foo.test.tsx` — brief note on what is covered

## Global mock candidates (not added — awaiting approval)
- `{package-or-module}` — why it might belong globally, which apps would use it
- (or "None")

## Commands run
- `cd portal && yarn test …`
```

If nothing belongs in global setup, say **"None"**.

## Example Prompt

> Create unit tests for all the testable components/utils etc in `surveys`, similar to what has been done in `components/Selector`. Any sharable mocks etc should be in their own fixtures file. After making the changes, list any mocks that seem like candidates for the portal's global mocks and explain why.

Interpret as:

1. App = `portal`, target = `src/containers/Surveys/`
2. Structure = tests co-located with their source files + `Surveys/fixtures.ts` for shared feature data
3. Global mocks = **propose only**, list in summary; if approved, add portal-wide mocks to `portal/src/test/mocks.ts`

## Anti-Patterns

- Changing code while scope, intent, or pattern is still ambiguous — ask first
- Modifying production source to fix tests without user approval
- Creating `test/`, `tests/`, `__test__/`, or `__tests__/` directories instead of co-locating tests
- Duplicating fixture data across test files in the same feature
- Adding global mocks without user approval
- Testing implementation details (internal state, mock call order) over user-visible outcomes
- Leaving failing tests — always run and fix before finishing
- Using `any` or `@ts-ignore` in new test files without strong justification
