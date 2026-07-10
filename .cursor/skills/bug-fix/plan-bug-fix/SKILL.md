# Plan Bug Fix · Bug Ticket Planning

Entry point: `Plan Bug Fix [TICKET-ID]` (or `plan bug fix [TICKET-ID]`).

Planning-only pass for a bug ticket — fetches ticket context, investigates
root cause, and writes a fix plan. Makes **no source code changes**. Output
is consumed by `Implement Bug Fix [TICKET-ID]`, and by
`Review Bug Fix [TICKET-ID]` once the fix is implemented.

---

## Phase 1 — Fetch context

Use the connected Jira MCP to fetch the ticket, its parent, and its epic.
Pull: summary, issue type, description, repro steps, full Gherkin
acceptance criteria, and any epic-level constraints/exclusions.

Write what you fetched to `tempAgentOutput/ticket-context-[TICKET-ID].md`,
then extract every **Must NOT** / exclusion / constraint from the epic.

If no Jira MCP tool is available in this session, stop and tell the user.

Print:
```
TICKET:      [ID] — [Summary]
PARENT:      [ID — Summary]
EPIC:        [ID — Summary]
CONSTRAINTS: [list]
```

---

## Phase 2 — Investigate (read-only)

Search/grep for files related to the bug. Trace the data flow end to end.
- **ROOT CAUSE**: one line — the cause, not the symptom. If unclear, say
  so — do NOT guess.
- **FILES TO MODIFY**: list
- **RISKS**: what could break?

If the root cause can't be pinned down with confidence, stop and ask
rather than letting the plan guess at one.

---

## Phase 3 — Plan (read-only)

- **FIX PLAN**: one line
- **FILES TO MODIFY**: list with what changes in each
- **RISKS**: what could break?
- **TEST PLAN**: regression case (old bug reproduced, now fails without
  the fix), happy path, edge cases, existing behaviour to preserve

---

## Phase 4 — Write the plan file

Save everything gathered to `tempAgentOutput/plan-[TICKET-ID].md` (same
file the generic `plan` skill produces, so `Implement Bug Fix` and
`Review Bug Fix` can read it identically):

```markdown
# Plan — [TICKET-ID]

## Ticket
[Summary] | Bug | [Parent] | [Epic]

## Classification
TYPE: bugfix

## Constraints
- [every Must NOT from the epic]

## Acceptance Criteria
[full Gherkin scenarios from ticket-context-[TICKET-ID].md — needed by `review` later]

## Orient
[output of Phase 2]

## Plan
[output of Phase 3]

## Open questions
[anything ambiguous that needs a human answer before implementation]
```

Print: `📋 Plan saved → tempAgentOutput/plan-[TICKET-ID].md | Review it, then run: Implement Bug Fix [TICKET-ID]`

Do NOT implement. Do NOT create, edit, or delete any file outside
`tempAgentOutput/`.

---

Downstream review for this ticket is `Review Bug Fix [TICKET-ID]` — the
dedicated bug-fix review, not the generic `Review`.
