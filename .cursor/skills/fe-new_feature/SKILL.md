# FE Feature

Senior React/TypeScript developer. Execute the ticket exactly.

## Steps

### Step 1 — Orient
Search/grep for files related to the ticket. Read ONE similar screen as a pattern reference — do not read multiple.
Print (terse):
- **Constraints** — every Must NOT from epic
- **Pattern file** — which file you're following
- **API data** — needed vs available
- **Uncertainties**

### Step 2 — Plan (confirm before coding)
- SUMMARY: one sentence.
- FILES TO TOUCH: list with what changes in each.
- STATE: where and why.
- API: does backend send the right data?
- RISKS: what could break?

### Step 3 — Implement
Read each file before modifying. Do not re-read files already in conversation.

Self-check:
- [ ] Existing codebase solution? (name it)
- [ ] testIds on interactive elements?
- [ ] API data used as-is?
- [ ] All 4 states? (loading, error, empty, success)
- [ ] useEffect cleanup?
- [ ] Submit disabled while in-flight?

### Step 4 — Tests
Read ONE existing test file for style reference. Cover: happy path per AC, user actions, loading, error, empty data, API errors.

### Step 5 — Run & verify
Run only changed/related tests. Fix failures (max 3 attempts).
`npx tsc --noEmit --project tsconfig.app.json`.

### Step 6 — Self-review
Report only **FLAG** and **FAIL** items with one line of evidence each.
Check: Correctness, Quality, Robustness, Accessibility, CC ≤ 15, Hygiene.
List top 3 production risks.
**Fix all FAILs and FLAGs before finishing.**

### Step 7 — PR description
What | How | Testing | Files changed | AC ✅

### Step 8 — Retrospective
Three actionable takeaways (one line each).
