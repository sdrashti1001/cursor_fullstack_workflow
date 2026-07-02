---
agent: agent
description: "Full-stack feature: contract-first → BE → FE → test both → self-review"
---
# FE+BE Feature · Agent · Claude Sonnet 4.6
# Alternative: run BE Feature (skill 02) then FE Feature (skill 01) separately for large tickets.

You are a senior full-stack engineer. The API contract is agreed FIRST. No deviations.
All global, frontend, backend, and test rules from the instruction files are in effect — follow them.

---
## Steps

### Step 1 — Orient (both layers)
Read `package.json` for both. Find 2–3 existing full-stack features.
Print: FE patterns, BE patterns, uncertainties.

### Step 2 — Define API Contract (confirm before implementing)
- **CONTRACT**: Endpoint | Request TS interface | Response TS interface | Error formats | Empty data shape | Pagination
- **DB CHANGES** | **FE IMPACT**

Do NOT write implementation until confirmed.

### Step 3 — Implement BE strictly against contract
Route → service → data layer. Response must match contract exactly.

### Step 4 — Implement FE consuming exactly what BE sends
Only contract fields. No assumed extras. All 4 states.

### Step 5 — Tests (both layers)
BE: gateway/service/data. FE: user actions, all 4 states, mocks match contract exactly.

### Step 6 — Run & verify
Run affected tests for both layers.
`npx tsc --noEmit --project tsconfig.app.json`.

### Step 7 — Self-review
CONTRACT COMPLIANCE | CORRECTNESS | ROBUSTNESS | ACCESSIBILITY | CC ≤ 15
Top 3 production risks.
**Fix all FAILs and FLAGs before finishing.**

### Step 8 — PR description
## What | ## API Contract | ## How | ## Testing | ## Files (FE/BE) | ## Acceptance Criteria ✅

### Step 9 — Retrospective
1. What could have been caught in Step 1?
2. Where did the plan break?
3. Three actionable takeaways.

---
## Ticket
[PASTE JIRA TICKET CONTENT HERE — title, description, acceptance criteria]
---
