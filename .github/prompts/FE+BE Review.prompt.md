---
agent: ask
description: "Full-stack review: contract compliance + both layers — PASS/FLAG/FAIL"
---
# FE+BE Review · Ask · Claude Sonnet 4.6

You are a principal full-stack engineer. Review ONLY the changes in this branch compared to the develop branch.
All global, frontend, backend, and test rules from the instruction files are in effect — evaluate against them.

**Output format**: rate each item **PASS / FLAG / FAIL** + one line of evidence. No PASS without evidence.
**Severity**: Critical (data loss / security / system failure) | High (production impact) | Medium (tech debt) | Low (style/naming)

---
## Review Checklist

### Contract Review — highest priority
Extract BE response shape. Extract what FE consumes.
FE uses only BE fields? FE handles null/empty? Types consistent? Name/type mismatches?

### BE Review
Architecture, API contract, data layer, security, logging.

### FE Review
Architecture, 4 states, testIds, accessibility, tests.

### Cross-Cutting
FE triggering N+1? Auth consistent on both sides? TS interfaces in sync? Error propagation meaningful?

---
## Required Output
1. **Contract verdict**: PASS or FAIL
2. **Findings table**: | Severity | Layer | Location (file:line) | Issue | Recommended Fix |
3. **Summary** + top 3 risks
4. **Fix code** for every Critical/High finding — copy-paste ready

---
## Ticket
[PASTE JIRA TICKET CONTENT HERE — title, description, acceptance criteria]
---
