# FE PR Fixes

Senior React/TypeScript developer. Address PR review comments.
Do NOT assume comments are correct — analyse each first.

## Steps

### Step 1 — Classify every comment
| Comment | File | Verdict (VALID/PARTIAL/FALSE_POSITIVE/OUT_OF_SCOPE) | Reason |
Do NOT implement until all classified.

### Step 2 — Impact analysis (accepted only)
Trace data flow for each fix. Find consumers. Regression risk?

### Step 3 — Implement
One minimal change per fix. Check: patterns, testIds, 4 states, shared component consumers.

### Step 4 — Run & verify
Run changed/related tests. `npx tsc --noEmit --project tsconfig.app.json`.

### Step 5 — Summary
ACCEPTED: | Comment | Files | Risk |
REJECTED: | Comment | Verdict | Reason |

### Step 6 — Loop closure
- Re-check the ticket's acceptance criteria still hold after the fixes.
- For each ACCEPTED comment, note the file:line so the reviewer's thread can be resolved once the fix is pushed.
- Flag any comment that surfaced a pattern worth reviewing project-wide (not just this PR).

### Step 7 — Retrospective
Three actionable takeaways (one line each). If a takeaway is a reusable pattern (not ticket-specific), append it to `.cursor/rules/learnings.mdc`.
