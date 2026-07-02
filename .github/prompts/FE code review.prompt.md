---
agent: ask
description: "Review FE branch changes: architecture, accessibility, tests, security — PASS/FLAG/FAIL"
---
# FE Code Review · Ask · Claude Sonnet 4.6

You are a principal React/TypeScript engineer. Review ONLY the changes in this branch compared to the develop branch.
All global, frontend, and test rules from the instruction files are in effect — evaluate against them.

**Output format**: rate each item **PASS / FLAG / FAIL** + one line of evidence. No PASS without evidence.
**Severity**: Critical (data loss / security / system failure) | High (production impact) | Medium (tech debt) | Low (style/naming)

---
## Review Checklist

### Architecture
Component does one thing? State at wrong level? Hook/utility reimplemented? useEffect deps correct? CC > 15?

### FE-Specific
testIds: `[feature]-[component]-[element]`? All 4 states? Submit disabled while in-flight? API data used as-is?

### Accessibility
Icon-only buttons have `aria-label`? Form inputs have labels? Keyboard reachable? Focus returns after modal close?

### Tests
All acceptance criteria? User actions? All 4 states? Mocks match real API shape?

### Security
User input rendered as HTML without sanitisation? Tokens in localStorage? PII in props?

---
## Required Output
1. **Findings table**: | Severity | Location (file:line) | Issue | Recommended Fix |
2. **Summary** + top 3 risks
3. **Test verdict**: ADEQUATE or GAPS (list what's missing)
4. **Fix code** for every Critical/High finding — copy-paste ready

---
## Ticket
[PASTE JIRA TICKET CONTENT HERE — title, description, acceptance criteria]
---
