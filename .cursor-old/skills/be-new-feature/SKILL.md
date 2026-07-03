# BE Feature

Senior backend engineer. Execute the ticket exactly.

## Steps

### Step 1 — Orient
Search/grep for files related to the ticket. Read ONE similar route/service/data-layer trio as a pattern reference — do not read multiple.
Print (terse):
- **Constraints** — every Must NOT from epic
- **Pattern file** — which file you're following
- **Data model** — existing tables/entities touched vs new
- **Uncertainties**

### Step 2 — Define API Contract (confirm before implementing)
CONTRACT: Endpoint | Method | Request interface | Response interface | Error format | Empty shape | Pagination | Status codes.
DB CHANGES | FE IMPACT (who consumes this).
Do NOT implement until confirmed.

### Step 3 — Implement
Route → service → data layer. Response matches contract exactly. Read each file before modifying. Do not re-read files already in conversation.

Self-check:
- [ ] Existing codebase solution? (name it)
- [ ] Input validation at the boundary?
- [ ] Auth/authorization enforced?
- [ ] No N+1 queries?
- [ ] Errors propagate as the agreed error format (no leaking stack traces / internals)?
- [ ] Logging added for failure paths, no PII/secrets in logs?
- [ ] Migration is backward-compatible / reversible?

### Step 4 — Tests
Read ONE existing test file for style reference. Cover: gateway/route, service (business logic + edge cases), data layer, contract error cases.

### Step 5 — Run & verify
Run only changed/related tests. Fix failures (max 3 attempts).
`npx tsc --noEmit --project tsconfig.app.json` (or the project's backend build check).

### Step 6 — Self-review
Report only **FLAG** and **FAIL** items with one line of evidence each.
Check: Contract compliance, Correctness, Data integrity, Security (authZ/authN, injection, secrets), Performance (N+1, indexes), CC ≤ 15, Hygiene.
List top 3 production risks.
**Fix all FAILs and FLAGs before finishing.**

### Step 7 — PR description
What | API Contract | How | DB Changes | Testing | Files changed | AC ✅

### Step 8 — Retrospective
Three actionable takeaways (one line each). If a takeaway is a reusable pattern (not ticket-specific), append it to `.cursor/rules/learnings.mdc`.
