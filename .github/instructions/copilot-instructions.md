# GitHub Copilot Instructions

> Place at `.github/copilot-instructions.md` and commit.

Read #file:../context/JIRA.md for epic and task scope. The subtask to implement is pasted in chat. Do not break task-level acceptance criteria.

## Honesty

- List every assumption. Flag every judgment call.
- Not certain something exists? Say so — never invent.
- Stuck or looping? Say so immediately: what you know, where you're stuck, what you need.
- Multi-part problem? Show progress after each part.

## Hygiene

- No `console.log`, commented-out code, TODOs, or debug artifacts in final output.
- No sensitive data, tokens, or secrets in logs, responses, or client-side code.
- Do not create extra files (PLAN.md, NOTES.md, TODO.md) unless explicitly asked.

## Reuse First

- Search the codebase before writing any new utility, hook, function, constant, or component.
- Use existing TypeScript types. No `any`. No `@ts-ignore`.
- Only create new if nothing similar exists — explain why.

## Scope

- Only touch files in scope for this ticket.
- Spotted an unrelated issue? Add `// TODO:` comment — do not fix it.
- Not certain something exists? Say so — never invent a file or function name.

## Patterns

- Match the project's existing patterns exactly. Find how similar features are built and follow that style.
- Prefer the simplest solution.
- Circuit breaker: if same area fixed 2+ times and outcome toggles → STOP, diagnose before writing more code.

## Terminal / Shell

- Always run commands using `cmd` (`cmd /c "..."`), never PowerShell.
- When invoking `run_in_terminal`, use `cmd /c "<command>"`.

## Git Conventions

- Branch: `[type]/[ticket-id]-short-desc` e.g. `feat/PROJ-123-add-user-filter`.
- Commit: imperative, present tense, ≤72 chars, include ticket ID.
- PR titles follow commit message format.

## Complexity

- Every function and React component must stay below **Cognitive Complexity 15** (SonarQube / `sonarjs/cognitive-complexity` ESLint rule).
- When a function exceeds the limit, extract branches into named helper functions **above** the parent — do not merely inline-comment them.
- Specific patterns that inflate complexity:
  - Ternaries nested inside loops or other ternaries — extract to a named function.
  - Long `if / else if` chains inside `useMemo` / `useCallback` — extract the multi-branch logic as a module-level pure function.
  - Sort comparators with multiple guard `if`s — extract to a named comparator function.
- Before submitting any PR or validating any ticket, run `npx eslint --rule '{"sonarjs/cognitive-complexity": ["error", 15]}' <changed files>` (or rely on the existing lint step) to catch violations early.
