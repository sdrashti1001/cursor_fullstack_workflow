# E2E Bug Fix (Full-Stack)

Senior full-stack engineer. Identify WHICH LAYER the bug lives in before writing any code.

## Steps

### Step 1 — Orient and localise
Trace: user action → API call → BE → DB → response → FE rendering.
- **BUG LOCATION**: FE only / BE only / Contract mismatch / Both
- **ROOT CAUSE** | **FIX PLAN** | **CONTRACT IMPACT** | **RISKS**

### Step 2 — Minimal fix (correct layer only)
Contract wrong? Fix BE first, then FE.
Circuit breaker: same area fixed twice and outcome toggles → STOP.

### Step 3 — Regression tests for all affected layers

### Step 4 — Run & verify
Run affected tests for both layers. `npx tsc --noEmit --project tsconfig.app.json`.

### Step 5 — Self-review + PR description
Report only FLAG/FAIL. Top 2 production risks.
What | Root Cause (which layer) | Fix | Contract Changes | Testing | Files

### Step 6 — Retrospective
Three actionable takeaways (one line each). If a takeaway is a reusable pattern (not ticket-specific), append it to `.cursor/rules/learnings.mdc`.
