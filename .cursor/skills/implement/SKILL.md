---
name: implement
description: >-
  Executes the plan file produced by the `plan` skill for a Jira ticket in this
  monorepo — applies frontend changes per the plan's classification, writes
  tests, runs tests/lint/type-check/Sonar/Snyk in the owning app, self-reviews,
  and writes an implementation summary. Never writes backend code. Use when the
  user says "Implement ECP-123".
argument-hint: "TICKET-ID"
user-invocable: true
---

# Implement · Ticket Execution

Entry point: `Implement [TICKET-ID]`.

Requires `tempAgentOutput/plan-[TICKET-ID].md`.

**If it does not exist:** stop. Print
`⚠️ No plan found for [TICKET-ID]. Run: Plan [TICKET-ID] first.`
Do not improvise a plan inline.

---

## Step 1 — Load

Read `tempAgentOutput/plan-[TICKET-ID].md` in full. Reuse Classification, BASE,
APPS, Constraints, and Orient/Plan **as-is** — do not re-derive. If a constraint
looks stale, flag it and confirm before proceeding.

**Design spec.** If the plan names one, read
`tempAgentOutput/ui-references/[TICKET-ID].md` before any UI work. Use its
Tailwind and existing-component mappings. **Do not re-open the image, prototype,
or Figma link** — the spec is the source now. Where the spec conflicts with the
ticket, the ticket wins; note the discrepancy.

**BE requirements.** If the plan names
`tempAgentOutput/be-requirements-[TICKET-ID].md`:
- Read it so you build against the agreed shape.
- **Do not implement any of it.** No files under `api/`.
- If an item is marked **blocking**, do not fake the data. Build the FE against
  the documented contract and leave the loading/error path honest. State clearly
  in the summary which behaviour cannot be verified until BE ships.
- If you find yourself needing an endpoint that is *not* in the file, stop and
  say so — the plan's API analysis was incomplete.

---

## Step 2 — Implement

Read each target file before modifying (skip if already in this conversation).
Do not refactor unrelated code. Consult
`.cursor/context/frontend-conventions.md` when unsure of a pattern.

**App-local alignment:** Read `.cursor/context/app-local-alignment.md`. Implement
only against the plan's **API reference** and **UI reference** in the **owning
app** — do not mirror another app's folder layout or API style.

### bugfix
Minimal fix for the plan's stated ROOT CAUSE only.
Self-check: root cause not symptom? 4 states still handled? Shared component
touched — do all consumers still work?

### new-feature
Follow FILES TO TOUCH.
- [ ] Reused what already exists? (name it)
- [ ] API data used as-is, never redefined on the client?
- [ ] All 4 states — loading, error, empty, success?
- [ ] `useEffect` cleanup for subscriptions, timers, listeners?
- [ ] Submit disabled while in-flight?
- [ ] Mutations invalidate affected queries; no toasts/navigation inside hooks?
- [ ] Correct router/store version for **this** app (portal ≠ parent-portal)?
- [ ] Tailwind utilities only — no custom CSS to match a design?

### pr-fixes
One minimal change per ACCEPTED comment. Skip REJECTED and OUT_OF_SCOPE.

### If FLAG: yes
ON and OFF are both real code paths — never stub OFF as a TODO. Check the flag
as close to the entry point as possible, never in shared utility code.

**Circuit breaker applies.** Same area changed twice with a toggling outcome →
stop and report.

---

## Step 3 — Tests

Read `.cursor/context/test-conventions.md`, then **ONE** existing co-located
test as a style reference. Co-locate new tests beside their source.

Per-type coverage is in the conventions file. For bugfix, the regression test
must fail without the fix — a happy-path test on the same file does not count.

---

## Step 4 — Run & verify

Per app touched (see `.cursor/context/monorepo-map.md`):

```bash
cmd /c "cd <app> && yarn test <changed test paths>"
cmd /c "cd <app> && yarn lint"
```
Plus the app's type-check. Run changed/related tests first; fix failures, max 3
attempts, then note and proceed. Zero type errors before moving on.

---

## Step 5 — Sonar (blocking)

Scan changed files for cognitive complexity. Any function or component **at or
above 15** must be refactored — extract branches into named helper functions
above the parent, not inline comments. **Rescan** after refactoring to confirm.

Report: `Sonar: PASS` or the list of `function — CC` still over threshold.

---

## Step 6 — Snyk (blocking)

Run `snyk_code_scan` on new first-party code. Fix issues using the Snyk result
context, **rescan**, repeat until clean. If the tool is unavailable this
session, say so once — do not silently skip.

---

## Step 7 — App-local pattern gate (blocking)

Run **ALPG** (`.cursor/context/app-local-alignment.md`) for each owning app in
the plan. Complete the PASS/FAIL table (A1–A4). Any **FAIL** → fix or stop and
ask the user; do not print implement done.

---

## Step 8 — Self-review

Report only **FLAG** and **FAIL**, one line of evidence each. No summary of what
passed.

Correctness (every AC, every Must NOT) · **ALPG (Step 7)** · Quality (reuse,
simplest solution) · Robustness (4 states, cleanup, double-submit) ·
Accessibility (aria-label describing action *and* target, keyboard nav, focus
return) · Design fidelity (only if a spec exists — matches the spec's mappings,
no invented details) · UI Copy (read `.cursor/context/ui-copy-rules.md` only if
the diff contains user-facing strings) · Hygiene (no `console.log`,
commented-out code, TODOs, secrets, `any`, `@ts-ignore`).

**Fix every FAIL and FLAG before finishing.**

---

## Step 9 — Git

**None.** No branch, stage, commit, or push.

---

## Step 10 — Summary

`tempAgentOutput/implement-[TICKET-ID].md`:

- **bugfix** — What | Root Cause | Fix Applied | Testing | Files | AC ✅
- **new-feature** — What | How | Testing | Files changed | AC ✅
- **pr-fixes** — ACCEPTED table | REJECTED table | Files | AC re-check
- **If FLAG** — `Flag [name] — remove after [condition].`
- **If BE requirements exist** — `Blocked on BE: [which AC cannot be verified
  until the endpoints ship]`

---

## Step 11 — Retrospective

Three actionable takeaways, one line each. Reusable patterns get appended to
`.cursor/rules/learnings.mdc` — but a learning is a **liability** if written
wrong, so before appending, every entry must pass this guard:

- **General, not ticket-specific.** "index pages pass `searchParams` straight to
  the hook" ✅. "CashlessCatering keeps filter mapping in index.tsx" ❌ — that
  names a ticket and bakes in a decision.
- **Encodes the *reviewer's* rule, not your own design choice.** Only write what
  a human reviewer corrected or confirmed. Never record a pattern you invented
  this ticket as if it were validated — that is how the anti-pattern gets taught
  back to the next ticket.
- **No raw API/endpoint/field details** (routes, payload keys, pence-vs-pounds
  of one endpoint). Those live in the PR description and the code, not here.
- **Resolve, don't stack.** If it contradicts an existing entry, the old entry
  was wrong or is now stale — edit/remove it. Never leave two entries that
  disagree.

If a takeaway fails the guard, keep it in the PR/summary instead of the file.

Print:
```
✅ [TICKET-ID] done | Type: [x] | Apps: [list] | Files: [list]
Tests PASS | Type-check PASS | Lint PASS | Sonar PASS | Snyk PASS | ALPG PASS
Blocked on BE: [none or list]
Uncommitted — review and commit manually.
→ Review [TICKET-ID]
```
