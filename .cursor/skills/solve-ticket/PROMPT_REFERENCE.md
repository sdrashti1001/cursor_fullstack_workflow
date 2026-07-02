# Solve Ticket — Prompt Reference

> Invoke the `solve-ticket` skill in Cursor Agent mode, then use any prompt below.

---

## Implement a ticket

```
Solve ES-1838
```
```
Solve ES-2035
```

Fetches the ticket, classifies layer/type/complexity, runs the right skill, commits.

---

## Plan first, then implement separately

```
Plan ES-1838
```

Runs fetch + classify + orient/plan only, via the `plan-ticket` skill. Writes
`tempAgentOutput/plan-ES-1838.md` and stops — no code changes. Review or edit
that file, then:

```
Implement ES-1838
```

Reads the plan file and starts `solve-ticket` straight at the Implement step
of the mapped skill, skipping re-derivation of Phase 1/2 and orient/plan.

Useful for STANDARD/COMPLEX tickets where you want a checkpoint before any
code is touched, or when planning and implementing in separate sessions (see
"New chat vs same chat" below). For SIMPLE tickets `Solve ES-1838` alone is
usually faster — the split adds a review step you may not need.

---

## Implement + auto-review

```
Solve ES-1838 then review
```

Implements the feature, commits, then automatically runs code review on the branch diff. Fixes any Critical/High findings before finishing.

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

Checks the current implementation against the ticket's Gherkin scenarios. Marks each as Satisfied / Partially Satisfied / Not Satisfied.

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
| `plan-ticket` | You want a reviewable plan file before any code changes — see "Plan first, then implement separately" above |
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

**New chat vs same chat:** Chaining in the same chat is convenient (context carries forward) but costs more tokens. For large tickets, start a new chat for each phase.

**PR comments format:** The orchestrator recognizes PR comments by looking for file paths, line numbers, and reviewer-style text. Include the file name and line context for best results.

**Override classification:** If the orchestrator classifies wrong, just say:
```
That's actually a bugfix, not a feature. Reclassify and run again.
```
