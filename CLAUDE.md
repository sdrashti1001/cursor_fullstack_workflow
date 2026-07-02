# CLAUDE.md

Instructions for Claude Code working in this repository. This mirrors
`.cursor/rules/*.mdc` — when either changes, update both (see "Keeping
instruction files in sync" below).

The ticket context (subtask, parent task, and epic) is provided in
conversation, either fetched via `scripts/fetch-jira.cjs` or pasted manually.
Do not break task-level acceptance criteria.

## Workflow

This project's task-execution workflow lives in `.cursor/skills/`. The entry
point is `solve-ticket`, which classifies a ticket by layer (FE/BE/E2E),
work type (bugfix/new-feature/code-review/pr-fixes/task-review), and
complexity (SIMPLE/STANDARD/COMPLEX), then routes to the matching skill file.
Read `.cursor/skills/solve-ticket/SKILL.md` for the full routing table before
starting ticket work.

For a reviewable plan before any code changes, use `.cursor/skills/plan-ticket/SKILL.md`
first — it produces `tempAgentOutput/plan-[TICKET-ID].md` and stops. See that
file's "Handoff" section for continuing into implementation.

## Honesty

- List every assumption. Flag every judgment call.
- Not certain something exists? Say so — never invent.
- Stuck or looping? Say so immediately.

## Hygiene

- No `console.log`, commented-out code, TODOs, or debug artifacts in final output.
- No sensitive data, tokens, or secrets in logs, responses, or client-side code.
- Do not create extra files (PLAN.md, NOTES.md, TODO.md) unless explicitly asked.
- Place temporary output files in `tempAgentOutput/` (git-ignored).
- Prefer `String#replaceAll()` over `String#replace()`.

## Reuse First

- Search the codebase before writing any new utility, hook, function, constant, or component.
- Use existing TypeScript types. No `any`. No `@ts-ignore`.
- Only create new if nothing similar exists — explain why.

## Scope

- Only touch files in scope for this ticket.
- Spotted an unrelated issue? Add `// TODO:` comment — do not fix it.

## Patterns

- Match the project's existing patterns exactly.
- Prefer the simplest solution.
- Circuit breaker: if same area fixed 2+ times and outcome toggles → STOP, diagnose.

## Git

- Branch: `[type]/[ticket-id]-short-desc`.
- Commit: imperative, present tense, ≤72 chars, include ticket ID.
- Never stage or commit `.env*`, `.gitignore`, or `.cursor/mcp.json` files.
- Never commit any code without explicitly asking to do so.

## Complexity

- Every function and React component below **Cognitive Complexity 15**.
- Exceeds limit → extract branches into named helper functions above the parent.

## Token Efficiency

- Use grep/search to locate relevant code BEFORE reading entire files.
- Read only the files you will modify, plus ONE existing file as a pattern reference.
- Do not re-read files already in this conversation.
- Keep intermediate output terse — bullet points, not paragraphs.
- In self-review, report only FLAG and FAIL items.
- Do not echo back large blocks of code already in context.

## FE Component Standards

- testId format: `[feature]-[component]-[element]` on interactive elements and major containers.
- Use API response data as-is — never redefine or duplicate backend values.
- Handle loading, error, empty, and success states for every data-fetch and submission.
- useEffect must clean up subscriptions, timers, and event listeners.
- Disable submit buttons while in-flight.

## BE Standards

- Validate input at the boundary (route/controller), never trust client-sent data downstream.
- Enforce authentication and authorization on every route — never assume a caller checked it.
- Response shape matches the agreed contract exactly — no leaking internal fields, stack traces, or ORM entities.
- Avoid N+1 queries — batch or join instead of looping over records to fetch related data.
- Migrations must be backward-compatible and reversible; never a breaking change deployed in the same step as the code that depends on it.
- Log failure paths with enough context to debug — never log PII, tokens, or secrets.
- Wrap multi-step writes in transactions where partial failure would leave inconsistent state.

## Accessibility

- `aria-label` on every interactive element without visible text — must describe action AND target.
- All interactions keyboard-navigable.
- Focus returns to trigger after modal/drawer/popover closes.
- `role="alert"` on dynamically injected error/success banners.

## Testing

- Mock all hooks that call fetch/useSWR.
- `afterEach`: `cleanup()` + `vi.clearAllMocks()`. 5000ms timeout on every test.
- Mocks must match the actual API response shape.
- After modifying source files, run affected tests. Fix failures.
- `npx tsc --noEmit --project tsconfig.app.json` — zero type errors before done.
- Coverage ≥ 70% on changed files. Run `npx vitest run --pool=forks --coverage` to confirm.
- **Before considering the task complete, run the full test suite** — not only affected tests. Use `npm run testCi` (matches CI, includes coverage) or `npm run test -- run`.

## UI Copy

When writing user-facing text, read `.cursor/context/ui-copy-rules.md` for
cardinality, Oxford comma, empty state, banner, and i18n rules. Key
principles: never hardcode singular/plural next to a dynamic count; zero
count gets a dedicated empty-state message; error messages say what went
wrong AND what to do next.

## Security

- Run `snyk_code_scan` for new or modified first-party code. Fix issues, rescan, repeat until clean.

## Learnings

Read `.cursor/rules/learnings.mdc` for accumulated cross-ticket patterns
before starting non-trivial work. Append reusable takeaways there at the end
of a ticket's retrospective — see the skill files under `.cursor/skills/`.

## Keeping Instruction Files in Sync

This project maintains AI coding assistant instructions in three places:

- **VS Code / GitHub Copilot**: `.github/instructions/*.instructions.md`
- **Cursor**: `.cursor/rules/*.mdc`
- **Claude Code**: `CLAUDE.md` (this file)

When modifying any instruction file, apply the same change to all three locations so they stay consistent.
