# Implement · FE Ticket Execution

Entry point: `Implement [TICKET-ID]` (or `implement ticket-number`).

Executes the plan produced by the `plan` skill. Requires
`tempAgentOutput/plan-[TICKET-ID].md` to exist.

**If the plan file does NOT exist:** stop. Print `⚠️ No plan found for
[TICKET-ID]. Run: Plan [TICKET-ID] first.` Do not improvise a plan inline —
planning-first is a hard requirement for this workflow, not a suggestion.

---

## Step 1 — Load the plan

Read `tempAgentOutput/plan-[TICKET-ID].md` in full. Do not re-derive
classification, constraints, or the orient/plan output — reuse it as-is. If
a constraint looks stale (e.g. epic changed since planning), flag it and
confirm with the user before proceeding rather than silently overriding.

---

## Step 2 — Implement (per plan's Classification.TYPE)

Read each target file before modifying (skip if already in this
conversation). Do not refactor unrelated code.

### bugfix
- Apply the minimal fix for the stated ROOT CAUSE only.
- Self-check: root cause addressed? testIds correct? 4 states handled?
  Shared component consumers still work?

### new-feature
- Follow FILES TO TOUCH from the plan.
- Self-check:
  - [ ] Existing codebase solution reused where one exists? (name it)
  - [ ] testIds on interactive elements? (`[feature]-[component]-[element]`)
  - [ ] API data used as-is, never redefined/duplicated?
  - [ ] All 4 states? (loading, error, empty, success)
  - [ ] useEffect cleanup (subscriptions, timers, listeners)?
  - [ ] Submit disabled while in-flight?

### pr-fixes
- One minimal change per ACCEPTED comment from the plan. Skip
  REJECTED/OUT_OF_SCOPE comments entirely.
- Check: patterns, testIds, 4 states, shared component consumers.

### If plan's Classification.FLAG = yes
- Implement both ON and OFF branches as real code paths — never stub the
  OFF branch as a TODO.
- Check the flag as close to the entry point as possible (route, top-level
  component) — never bury it in shared/reused utility code.

---

## Step 3 — Tests

Read ONE existing test file for style reference.

- **bugfix**: regression (old bug gone), happy path, edge cases, existing
  behaviour preserved.
- **new-feature**: happy path per AC, user actions, loading, error, empty
  data, API errors.
- **pr-fixes**: cover whatever the accepted comment's fix changed.
- **If flagged**: one full test run with flag ON, one with flag OFF —
  do not assume symmetry. If the ticket says "existing flow must be
  unaffected when OFF," write a test that would fail if the OFF path
  changed at all.

---

## Step 4 — Run & verify

```bash
cmd /c "npx tsc --noEmit --project tsconfig.app.json"
cmd /c "npx vitest run --pool=forks --coverage"
```
Run only changed/related tests first; fix failures (max 3 attempts). Zero
type errors and coverage ≥ 70% on changed files before moving on.

---

## Step 5 — Complexity check (before self-review)

Run a Sonar cognitive-complexity scan (`sonar_scan` tool, or the project's
`sonar-scanner`/lint script) on changed files. Any function or component at
or above **cognitive complexity 15** must be refactored — extract branches
into named helper functions above the parent — before moving to self-review.
Rescan after refactoring to confirm it's clear.

---

## Step 6 — Self-review

Report only **FLAG** and **FAIL** items with one line of evidence each.
Check: Correctness, Quality, Robustness, Accessibility (aria-labels,
keyboard nav, focus return), CC ≤ 15, UI Copy (against
`.cursor/context/ui-copy-rules.md` — cardinality, Oxford comma, empty
state, error/warning wording, i18n), Hygiene (no console.log,
commented-out code, TODOs, secrets).

**Fix all FAILs and FLAGs before finishing.**

---

## Step 7 — Git (none)

No git commands of any kind — no branch creation, staging, commit, or push.
Leave the working tree exactly as the file edits produced it. Branching,
staging, committing, and pushing are all done manually by the user.

---

## Step 8 — Implementation summary

Save to `tempAgentOutput/implement-[TICKET-ID].md`:
- **bugfix**: What | Root Cause | Fix Applied | Testing | Files | AC ✅
- **new-feature**: What | How | Testing | Files changed | AC ✅
- **pr-fixes**: ACCEPTED table | REJECTED table | Files | AC re-check
- **If flagged**: add a line — "Flag `[name]` — remove after [condition]."

---

## Step 9 — Retrospective + short report

Three actionable takeaways (one line each). If a takeaway is a reusable
pattern (not ticket-specific), append it to `.cursor/rules/learnings.mdc`.

Print short report:
```
✅ [TICKET-ID] done | Type: [x] | Branch: [x] | Files: [list]
Tests: PASS (coverage X%) | Type-check: PASS
Changes are uncommitted — review and commit manually.
→ Review [TICKET-ID]
```
