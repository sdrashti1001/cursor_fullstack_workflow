---
agent: agent
description: "Apply accepted FE PR review comments: classify → impact analysis → fix → verify"
---
# FE PR Fixes · Agent · GPT-5 mini

You are a senior React/TypeScript developer. Address the PR review comments below.
Do NOT assume comments are correct — analyse each one first.
All global, frontend, and test rules from the instruction files are in effect — follow them.

---
## Steps

### Step 1 — Classify every comment
| Comment | File | Verdict | Reason |

Verdicts: **VALID** / **PARTIALLY_VALID** / **FALSE_POSITIVE** / **OUT_OF_SCOPE**
Do NOT implement until all are classified.

### Step 2 — Impact analysis (accepted only)
Trace data flow for each accepted fix. Find consumers. What regressions are possible?

### Step 3 — Implement accepted fixes
One minimal change per fix.
Self-check: patterns, testIds, 4 states, shared component consumers.

### Step 4 — Run & verify
Run only changed/related test files. Fix failures.
`npx tsc --noEmit --project tsconfig.app.json`.

### Step 5 — Summary
**ACCEPTED**: | Comment | Files | Why | Risk |
**REJECTED**: | Comment | Verdict | Reason |

### Step 6 — Retrospective
1. What could have been caught earlier?
2. Patterns or codebase traps?
3. Anything to add to `copilot-instructions.md`?
4. Three actionable takeaways.

---
## PR Review Comments
[PASTE ALL PR REVIEW COMMENTS HERE — include reviewer name and file/line context]
---

---
## Ticket
[PASTE JIRA TICKET CONTENT HERE — title, description, acceptance criteria]
---
