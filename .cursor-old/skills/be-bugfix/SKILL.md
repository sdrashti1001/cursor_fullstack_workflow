# BE Bug Fix

Senior backend engineer. Fix the bug exactly.

## Steps

### Step 1 — Orient
Search/grep for files related to the bug. Trace the data flow: request → route → service → data layer → response.
Print (terse):
- **ROOT CAUSE**: one line — the cause, not the symptom
- **FIX PLAN**: one line
- **FILES TO MODIFY**: list
- **CONTRACT IMPACT**: does the response shape change? Who consumes it?
- **RISKS**: what could break?

If root cause unclear — say so. Do NOT guess.

### Step 2 — Minimal fix
Read each target file (skip if already in conversation). Do NOT refactor unrelated code.
Self-check: root cause addressed? auth/validation still enforced? existing consumers (FE, other services) still work? no new N+1?

### Step 3 — Regression tests
Cover: regression (old bug gone), happy path, edge cases, existing behaviour preserved.

### Step 4 — Run & verify
Run changed/related tests. Fix failures (max 3 attempts).
`npx tsc --noEmit --project tsconfig.app.json` (or the project's backend build check).

### Step 5 — Self-review
Report only FLAG/FAIL. Top 2 production risks.
**Fix all FAILs before finishing.**

### Step 6 — PR description
What | Root Cause | Fix Applied | Contract Changes | Testing | Files | AC ✅

### Step 7 — Retrospective
Three actionable takeaways (one line each). If a takeaway is a reusable pattern (not ticket-specific), append it to `.cursor/rules/learnings.mdc`.
