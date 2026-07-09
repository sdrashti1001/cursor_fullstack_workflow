# Implement Bug Fix · Bug Ticket Execution

Entry point: `Implement Bug Fix [TICKET-ID]` (or `implement bug fix
[TICKET-ID]`).

Executes the plan produced by `Plan Bug Fix [TICKET-ID]`. Requires
`tempAgentOutput/plan-[TICKET-ID].md` to exist.

**If the plan file does NOT exist:** stop. Print `⚠️ No plan found for
[TICKET-ID]. Run: Plan Bug Fix [TICKET-ID] first.` Do not improvise a fix
inline — planning-first is a hard requirement, not a suggestion.

---

## Step 1 — Load the plan

Read `tempAgentOutput/plan-[TICKET-ID].md` in full. Do not re-derive the
root cause, constraints, or plan — reuse it as-is. If a constraint looks
stale (e.g. epic changed since planning), flag it and confirm with the
user before proceeding rather than silently overriding.

---

## Step 2 — Fix

Read each target file before modifying (skip if already in this
conversation). Apply the minimal fix for the stated ROOT CAUSE only — do
not refactor unrelated code.

Self-check: root cause addressed? testIds correct
(`[feature]-[component]-[element]`)? 4 states handled (loading, error,
empty, success)? Shared component consumers still work?

---

## Step 3 — Tests

Read ONE existing test file for style reference. Cover: regression (old
bug is gone), happy path, edge cases, existing behaviour preserved.

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
into named helper functions above the parent — before moving to
self-review. Rescan after refactoring to confirm it's clear.

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

## Step 8 — Fix summary

Save to `tempAgentOutput/implement-[TICKET-ID].md`:
What | Root Cause | Fix Applied | Testing | Files | AC ✅

---

## Step 9 — Retrospective + short report

Three actionable takeaways (one line each). If a takeaway is a reusable
pattern (not ticket-specific), append it to `.cursor/rules/learnings.mdc`.

Print short report:
```
✅ [TICKET-ID] done | Files: [list]
Tests: PASS (coverage X%) | Type-check: PASS
Changes are uncommitted — review and commit manually.
→ Review [TICKET-ID]
```
