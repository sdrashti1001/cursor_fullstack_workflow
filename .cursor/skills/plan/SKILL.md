# Plan · FE Ticket Planning

Entry point: `Plan [TICKET-ID]` (or `plan ticket-number`).

Planning-only pass for a frontend Jira ticket. Produces one reviewable
artifact — `tempAgentOutput/plan-[TICKET-ID].md` — and makes **no source
code changes**. Every ticket goes through this step first, regardless of
size or complexity — there is no auto-split or inline fast-track.

---

## Phase 1 — Fetch Context

Use the connected Jira MCP to fetch the ticket, its parent, and its epic.
Pull: summary, issue type, parent, epic, description, full Gherkin
acceptance criteria, and any epic-level constraints/exclusions.

Write what you fetched to `tempAgentOutput/ticket-context.md` so downstream
steps and `review` can read it consistently, then extract every
**Must NOT** / exclusion / constraint from the epic.

If no Jira MCP tool is available in this session, stop and tell the user.

Print:
```
TICKET:      [ID] — [Summary]
TYPE:        [issue type]
PARENT:      [ID — Summary]
EPIC:        [ID — Summary]
CONSTRAINTS: [list]
```

---

## Phase 2 — Classify ticket type

- **bugfix** — Bug type, or "fix/broken/defect/regression"
- **new-feature** — "build/add/create/implement"
- **pr-fixes** — PR review comments pasted alongside the ticket ID

**Feature-flag modifier (orthogonal):** if the ticket mentions "flag",
"rollout", "gate", or "kill switch", also apply the flag-specific steps in
`.cursor/rules/learnings.mdc` history and note it in the plan — see
Phase 3 below.

Print: `TYPE: [x] | FLAG: [yes/no]`

If ambiguous — ask.

---

## Phase 3 — Orient (read-only, per type)

### bugfix
Search/grep for files related to the bug. Trace the data flow.
- **ROOT CAUSE**: one line — the cause, not the symptom. If unclear, say so — do NOT guess.
- **FILES TO MODIFY**: list
- **RISKS**: what could break?

### new-feature
Search/grep for files related to the ticket. Read ONE similar screen as a
pattern reference — do not read multiple.
- **Constraints** — every Must NOT from epic
- **Pattern file** — which file you're following
- **API data** — needed vs available
- **Uncertainties**

### pr-fixes
Classify every pasted comment first:
| Comment | File | Verdict (VALID/PARTIAL/FALSE_POSITIVE/OUT_OF_SCOPE) | Reason |
Do not plan implementation for comments not yet classified.

### If flagged (any type)
Also define the flag contract: exact flag key, default state (OFF unless
stated), scope (global/per-org/per-user — confirm before implementing).
Both ON and OFF branches must be real code paths, checked as close to the
entry point as possible.

---

## Phase 4 — Plan (read-only, per type)

### bugfix
- FIX PLAN: one line
- FILES TO MODIFY: list with what changes in each
- RISKS: what could break?

### new-feature
- SUMMARY: one sentence
- FILES TO TOUCH: list with what changes in each
- STATE: where and why
- API: does backend send the right data?
- RISKS: what could break?

### pr-fixes
- Impact analysis for accepted comments only: trace data flow, find
  consumers, note regression risk.
- ACCEPTED: | Comment | Files | Risk |
- REJECTED: | Comment | Verdict | Reason |

### If flagged
- Test plan must cover flag ON and flag OFF as separate, explicit cases —
  never assume symmetry.
- Note the cleanup debt: "Flag `[name]` — remove after [condition]."

---

## Phase 5 — Write the plan file

Save everything gathered to `tempAgentOutput/plan-[TICKET-ID].md`:

```markdown
# Plan — [TICKET-ID]

## Ticket
[Summary] | [Type] | [Parent] | [Epic]

## Classification
TYPE: [bugfix/new-feature/pr-fixes] | FLAG: [yes/no]

## Constraints
- [every Must NOT from the epic]

## Acceptance Criteria
[full Gherkin scenarios from ticket-context.md — needed by `review` later]

## Orient
[output of Phase 3]

## Plan
[output of Phase 4]

## Open questions
[anything ambiguous that needs a human answer before implementation]
```

Print: `📋 Plan saved → tempAgentOutput/plan-[TICKET-ID].md | Review it, then run: Implement [TICKET-ID]`

Do NOT implement. Do NOT create, edit, or delete any file outside `tempAgentOutput/`.
