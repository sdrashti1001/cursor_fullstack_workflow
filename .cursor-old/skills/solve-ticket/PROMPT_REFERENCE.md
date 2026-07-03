# Solve Ticket — Prompt Reference

> Invoke the `solve-ticket` skill in Cursor Agent mode, then use any prompt below.

---

## Implement a ticket — automatic plan/implement split

```
Solve ES-1838
```

is all you need to type. `solve-ticket` fetches the ticket, classifies
layer/type/complexity, then decides for you (Phase 2.5): a 1-file ticket
runs fully inline, end to end, in this chat — orient, plan, implement,
test, self-review, commit. A 2+ file ticket instead writes
`tempAgentOutput/plan-ES-1838.md` and stops — you review/edit the plan, then
open a **new chat** and run:

```
Implement ES-1838
```

which reads the plan file and starts straight at the Implement step of the
mapped skill, skipping re-derivation of Phase 1/2 and orient/plan.

You don't choose which path runs — the file count decides it. To override
(force inline on a bigger ticket, or force a checkpoint on a 1-file one),
call `Plan ES-1838` / `Implement ES-1838` directly instead of `Solve`.

---

## Implement + auto-review

```
Solve ES-1838 then review
```

Implements the feature, commits, then automatically runs code review on the branch diff. Fixes any Critical/High findings before finishing.

If the ticket turns out to be 2+ files, the auto-split gate stops this chat after planning — "then review" doesn't run here. It's saved into the plan file's `## Chain` field instead, and runs automatically after `Implement ES-1838`'s own commit step in the new chat.

---

## Review current branch

```
Review
```
```
Review it
```
```
Run code review
```

Reviews the current branch changes against `origin/develop`. Works as a follow-up after `Solve` (uses existing context) or standalone (re-fetches if needed).

---

## Review a specific ticket's branch

```
Review ES-1838
```

Fetches the ticket for AC context, then reviews the current branch diff against those acceptance criteria.

---

## Fix PR comments

Paste the reviewer comments directly — the orchestrator detects them automatically:

```
@john: ConnectionCard.tsx line 45 — use the shared Button component instead
@john: Missing aria-label on the change MIS connection button
@sarah: The empty state doesn't match our pattern — check Dashboard.tsx
```

Or be explicit:

```
Fix PR comments for ES-1838

@john: ConnectionCard.tsx line 45 — use the shared Button component instead
@john: Missing aria-label on the change MIS connection button
```

---

## Verify acceptance criteria

```
Verify ES-1838
```
```
Validate AC for ES-1838
```

Checks the current implementation against the ticket's Gherkin scenarios. Marks each as Satisfied / Partially Satisfied / Not Satisfied, runs the type-check and test suite as a mechanical prerequisite, and flags dead code and regression risk on shared components. FE-only for now — for a BE or E2E ticket, this falls back to suggesting `Review` instead.

---

## Fix a bug

```
Solve ES-2100
```

If ES-2100 is a Bug type in Jira, the orchestrator auto-selects the bugfix skill. No need to specify — classification is automatic.

---

## Full pipeline (implement → review → verify)

```
Solve ES-1838 then review
```

After review completes, you can chain further:

```
Now verify the acceptance criteria
```

---

## Direct skill usage (bypass orchestrator)

For edge cases where you don't want the orchestrator, invoke skills directly:

| Skill | When to use |
|---|---|
| `plan-ticket` | You want a reviewable plan file before any code changes — see "Implement a ticket — automatic plan/implement split" above |
| `fe-new-feature` | You already know it's an FE feature, ticket context pasted manually |
| `fe-bugfix` | Quick bug fix, context pasted manually |
| `fe-pr-review` | Just want a code review, no ticket context needed |
| `fe-pr-fixes` | Paste PR comments directly, no Jira fetch needed |
| `fe-task-review` | Quick AC check against current code |
| `e2e-new-feature` | Full-stack feature, context pasted manually |
| `e2e-bugfix` | Full-stack bug, context pasted manually |
| `e2e-code-review` | Full-stack review |

---

## Tips

**Token efficiency:** For simple tickets, the orchestrator auto-classifies as SIMPLE and skips heavy steps (pattern research, verbose planning, retrospective). You don't need to tell it — it decides based on ticket scope.

**New chat vs same chat:** For 2+ file tickets, Phase 2.5 stops after planning and expects you to open a new chat for `Implement` — this keeps the implementation agent's context clean and cheaper. For 1-file tickets everything stays in one chat automatically.

**PR comments format:** The orchestrator recognizes PR comments by looking for file paths, line numbers, and reviewer-style text. Include the file name and line context for best results.

**Override classification:** If the orchestrator classifies wrong, just say:
```
That's actually a bugfix, not a feature. Reclassify and run again.
```
