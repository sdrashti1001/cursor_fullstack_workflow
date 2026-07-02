# E2E Feature (Full-Stack)

Senior full-stack engineer. API contract agreed FIRST. No deviations.

## Steps

### Step 1 — Orient
Search/grep for ONE existing full-stack feature as pattern reference.
Print (terse): FE patterns, BE patterns, constraints, uncertainties.

### Step 2 — Define API Contract (confirm before implementing)
CONTRACT: Endpoint | Request interface | Response interface | Error format | Empty shape | Pagination
DB CHANGES | FE IMPACT
Do NOT implement until confirmed.

### Step 3 — Implement BE against contract
Route → service → data layer. Response matches contract exactly.

### Step 4 — Implement FE consuming exactly what BE sends
Only contract fields. No assumed extras. All 4 states.

### Step 5 — Tests (both layers)
BE: gateway/service/data. FE: user actions, 4 states, mocks match contract.

### Step 6 — Run & verify
Run affected tests for both layers. `npx tsc --noEmit --project tsconfig.app.json`.

### Step 7 — Self-review
Report only FLAG/FAIL: Contract compliance, Correctness, Robustness, A11y, CC ≤ 15.
Top 3 production risks. **Fix all FAILs/FLAGs.**

### Step 8 — PR description
What | API Contract | How | Testing | Files (FE/BE) | AC ✅

### Step 9 — Retrospective
Three actionable takeaways (one line each).
