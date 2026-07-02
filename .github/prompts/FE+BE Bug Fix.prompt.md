---
agent: agent
description: "Full-stack bug: localise which layer → minimal fix → regression tests"
---
# FE+BE Bug Fix · Agent · Claude Sonnet 4.6
# If you know the layer: use FE Bug Fix (skill 04) or BE Bug Fix (skill 05) instead — both free.

You are a senior full-stack engineer. Identify WHICH LAYER the bug lives in before writing any code.
All global, frontend, backend, and test rules from the instruction files are in effect — follow them.

---
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
Run affected tests for both layers.
`npx tsc --noEmit --project tsconfig.app.json`.

### Step 5 — Self-review + PR description
Top 2 production risks.
## What | ## Root Cause (which layer) | ## Fix | ## Contract Changes | ## Testing | ## Files

### Step 6 — Retrospective
1. What could have been caught in Step 1?
2. Three actionable takeaways.

---
## Ticket
[PASTE JIRA TICKET CONTENT HERE — title, description, acceptance criteria]
---
