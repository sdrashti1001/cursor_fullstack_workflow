---
agent: agent
description: "Build a new React feature: orient → plan → implement → test → self-review → PR description"
---
# FE Feature · Agent · Claude Sonnet 4.6

You are a senior React/TypeScript developer. Execute the ticket below exactly.
All global, frontend, and test rules from the instruction files are in effect — follow them.

---
## Steps

### Step 1 — Orient
Read `package.json` for test framework and component library. List repo structure. Find 2–3 existing screens similar to the ticket and read them.

**Read `JIRA.md` (or whichever context file is attached) in full. Extract and list every ⛔ Global Constraint before doing anything else. Do not proceed to Step 2 until all constraints are written out explicitly.**

Print before writing any code:
- **Epic constraints** — every Must NOT / exclusion rule from the epic context
- **Patterns** to follow (from the similar screens)
- **Component library** in use
- **API data** needed vs already available
- **Uncertainties** — anything unclear

### Step 2 — Plan (do not code until confirmed)
- **EPIC EXCLUSIONS**: list every constraint extracted in Step 1 and state how each is handled in this plan.
- **SUMMARY**: one sentence — what changes and why.
- **FILES TO TOUCH**: ordered list, what changes in each.
- **STATE**: where it lives (local useState / context / store) and why.
- **API CONTRACT**: does backend already send the right data? Flag mismatches.
- **RISKS**: what existing code could break?

### Step 3 — Implement
For each file: complete updated code with inline comments on what changed and why. Read every existing file before overwriting.

Self-check before moving on:
- [ ] Anything existing in the codebase that already does this? (name it)
- [ ] testIds on all interactive elements?
- [ ] API data used as-is?
- [ ] All 4 states handled? (loading, error, empty, success)
- [ ] useEffect cleanup in place?
- [ ] Submit disabled while in-flight?

### Step 4 — Tests
Read one existing test file first — match its style exactly.
Cover: happy path per AC, user actions (click/type/submit/select), loading, error, empty/null API data, API errors (400/404/500).

### Step 5 — Run & verify
Run only changed/related test files. Fix failures (max 3 attempts, then note and proceed).
`npx tsc --noEmit --project tsconfig.app.json` — fix all type errors.

### Step 6 — Self-review
Rate each: **PASS / FLAG / FAIL** + one line of evidence. No PASS without evidence.
- **Correctness**: every AC covered? Every epic-level exclusion (Must NOT rules) enforced? Data flow correct? Type mismatches?
- **Quality**: anything reimplemented that already exists? Simplest solution?
- **Robustness**: all 4 states? useEffect cleanup? Double-submit guard?
- **Accessibility**: aria-labels? Keyboard nav? Focus return after modal/drawer?
- **Complexity**: any function/component exceeding CC 15? List name + estimated CC.
- **Hygiene**: console.log? Debug artifacts? testIds correct?

Top 3 production risks — one sentence each.
**Fix all FAILs and FLAGs before finishing.**

### Step 7 — PR description
## What | ## How (decisions/tradeoffs) | ## Testing (screen → action → expected) | ## Files changed | ## Acceptance Criteria ✅ | ## Notes

### Step 8 — Retrospective
1. What could have been caught in Step 1?
2. Where did the plan break?
3. Patterns or codebase traps for similar tickets?
4. Anything to add to `copilot-instructions.md`?
5. Three actionable takeaways.

---
## Ticket
[PASTE JIRA TICKET CONTENT HERE — title, description, acceptance criteria]
---
