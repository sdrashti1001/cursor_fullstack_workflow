---
name: fix-pr-comments
description: >-
  Addresses review feedback for a ticket in this monorepo — loads the fix queue
  from a review file or pasted PR comments, classifies each, fixes in priority
  order, verifies, and updates the queue status. Use when the user says "Fix PR
  Comments ECP-123", "address PR comments", or pastes reviewer feedback.
argument-hint: "TICKET-ID [HIGH|MEDIUM|LOW|R-00n]"
user-invocable: true
---

# Fix PR Comments · Address Review Feedback

Entry point: `Fix PR Comments [TICKET-ID]`

Modifiers: `… HIGH` / `… MEDIUM` / `… LOW` (one tier only) or `… R-003` (one
item). No modifier → all OPEN items, HIGH first.

Does not require a prior `Plan` pass. **Do not assume comments are correct** —
analyse each one.

---

## Step 0 — Load

**Source A — pasted comments.** Use what the user pasted in chat.

**Source B — review file (preferred after `Review`).** If nothing was pasted,
read `tempAgentOutput/review-[TICKET-ID].md` → **Prioritized fix queue**. Load
only `Status: OPEN` items unless the user names specific ids. Apply the priority
modifier.

If neither exists, stop:
`⚠️ No comments found. Run: Review [TICKET-ID] first, or paste PR comments.`

Also read, if present: `tempAgentOutput/plan-[TICKET-ID].md` (BASE, APPS,
Constraints) and `tempAgentOutput/ticket-context-[TICKET-ID].md` (AC), so fixes
don't violate them. When the diff touches `portal/`, `parent-portal/`,
`pupil-portal/`, or `teacher-app/`, also read
`.cursor/context/app-local-alignment.md` — ALPG (incl. A6) is a blocking gate
for this skill.

---

## Step 1 — Classify

| Id | Comment | File | Verdict | **Class** | Priority | Reason |

Verdicts: **VALID / PARTIAL / FALSE_POSITIVE / OUT_OF_SCOPE**.
Priority applies only to VALID and PARTIAL — use **N/A** otherwise. For items
loaded from a review file, pre-fill Id, Comment, File, and Priority from the
queue; still assign a Verdict (usually VALID).

**Class — SURFACE vs PATTERN. This is the most important column.**

- **SURFACE** — a local, bounded edit: rename a hook, delete a `staleTime`,
  change a toast to a disabled button, remove one dead export.
- **PATTERN** — the reviewer is pointing at how the code is *shaped*, usually by
  naming a reference file or using words like "workaround", "unusual", "our
  usual pattern", "follow the same as X", "I don't need all these functions",
  "delete X altogether". These are **not** satisfied by tidying — they require
  making the file structurally match the named reference (see Step 3).

A comment that names a reference file (`AllPurchases.tsx`, `parents-evenings.ts`)
or asks you to *remove an abstraction* is **PATTERN**, never SURFACE. When in
doubt, it is PATTERN. Record the reference path in the Reason column — it becomes
the A1/A6 reference for that item.

Priority rubric is the one in `review`. When torn, take the higher. A PATTERN
comment is at least **HIGH**.

Do not implement until everything is classified. Then print:
`QUEUE (accepted this pass): HIGH [n] | MEDIUM [n] | LOW [n] | PATTERN [n]`

---

## Step 2 — Impact analysis (accepted only)

In priority order. For each VALID/PARTIAL comment: trace the data flow, find
consumers, note regression risk. Group related comments where one change can
close several threads safely.

---

## Step 3 — Implement

**HIGH → MEDIUM → LOW.** Do not start MEDIUM or LOW until every HIGH item in
this pass is done or explicitly deferred with a one-line reason.

Check against `.cursor/context/frontend-conventions.md`: patterns, 4 states,
shared component consumers, correct router/store version for the app, Tailwind
utilities only.

**SURFACE items:** one minimal change per accepted fix.

**PATTERN items — "one minimal change" is suspended.** A minimal edit is the
*wrong* response and is what gets a fix bounced a second time. Instead:

1. **Open the named reference file in full** (`AllPurchases.tsx`,
   `parents-evenings.ts`, …) — the A1 reference for this item. Do not work from
   memory of it.
2. Build the **A6 side-by-side** (`.cursor/context/app-local-alignment.md`): how
   does the reference flow data vs how does your file? Name every structural
   difference.
3. **Rewrite your file to match the reference's shape**, deleting the
   abstraction the reviewer named — do not preserve a mapper/util "because it's
   domain-specific". If the reference has no equivalent layer, yours must not
   either. Deleting a whole `utils.ts` or `build*Params` block is an expected
   PATTERN outcome, not scope creep.
4. The item is not done until the A6 table shows **match** on every row.

**Circuit breaker applies.** Same area changed twice with a toggling outcome →
stop and report rather than continuing.

---

## Step 4 — Run & verify

Per app touched:
```bash
cmd /c "cd <app> && yarn test <changed paths>"
cmd /c "cd <app> && yarn lint"
```
Plus the app's type-check. Fix failures before proceeding.

---

## Step 5 — Sonar + Snyk (blocking)

**Sonar** — scan changed files for cognitive complexity. Anything at or above
**15** gets refactored: extract branches into named helper functions above the
parent. Rescan to confirm.

**Snyk** — `snyk_code_scan` on new first-party code. Fix using the result
context, rescan, repeat until clean. If either tool is unavailable, say so once
rather than skipping silently.

---

## Step 6 — Self-review

**FLAG and FAIL only**, one line of evidence each. Correctness · **ALPG (A1–A6,
`.cursor/context/app-local-alignment.md`)** · Quality · Robustness ·
Accessibility · Hygiene. Read `.cursor/context/ui-copy-rules.md` only if the diff
touched user-facing strings.

**Every PATTERN item must show its A6 side-by-side with `match` on every row.**
An A6 FAIL — including a surviving mapper/util the reviewer asked you to delete —
is a FAIL here, not a "partial but OK". "Domain-specific" is not an accepted
justification unless the reference sibling has the same layer.

Fix all FAILs and FLAGs before finishing.

---

## Step 7 — Git

**None.** No stage, commit, or push.

---

## Step 8 — Summary & queue update

Append to `tempAgentOutput/implement-[TICKET-ID].md`:
- **ACCEPTED by priority** — HIGH / MEDIUM / LOW: | Id | Comment | Files | Risk |
- **REJECTED** — | Id | Comment | Verdict | Reason |
- **DEFERRED** — | Id | Comment | Priority | Why not this pass |

Update each addressed item's **Status** in
`tempAgentOutput/review-[TICKET-ID].md` to `FIXED` or `DEFERRED`. Leave the rest
`OPEN`.

---

## Step 9 — Loop closure

- Re-check the ticket's AC still hold after the fixes.
- Note file:line per accepted comment so the reviewer's thread can be resolved
  once pushed.
- Flag any comment that revealed a pattern worth reviewing project-wide.
- If a takeaway is a reusable pattern, append it to `.cursor/rules/learnings.mdc`
  **only if it passes the learnings write-guard** (general, encodes the
  reviewer's rule not your own design, no raw API details, resolves rather than
  stacks contradictions — see `implement` Step 11). A PATTERN comment that
  bounced is prime learning material: record the *rule* ("index owns no filter
  algebra"), never the ticket ("CashlessCatering filter mapping").

Print:
```
✅ Comments done | HIGH [fixed/deferred] | MEDIUM [x] | LOW [x]
Sonar PASS | Snyk PASS
REJECTED: [n] | Files: [list]
OPEN remaining: [ids or none]
→ Fix PR Comments [TICKET-ID] MEDIUM  |  Re-run Review [TICKET-ID]
```
