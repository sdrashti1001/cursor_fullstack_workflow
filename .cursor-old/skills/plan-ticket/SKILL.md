# Plan Ticket · Planning-Only

Planning-only pass for a Jira ticket. Produces a single reviewable artifact —
`tempAgentOutput/plan-[TICKET-ID].md` — and makes **no source code changes**.

This is the "planner" half of the solve-ticket workflow (see
`.cursor/skills/solve-ticket/SKILL.md`). `solve-ticket`'s Phase 2.5 auto-split
gate calls into this skill's Phase 3-4 automatically for any ticket
estimated at 2+ files — you normally won't invoke `plan-ticket` directly.
Manual invocation works the same way: run this first, review/edit the plan
file, then hand off to `solve-ticket` with `Implement [TICKET-ID]` to execute
it. Using this skill standalone (Option B) requires nothing extra. It can
also be pasted as the instructions for a restricted Cursor Custom Mode with
Edit/Write tools turned off (Option A) — see
`.cursor/context/custom-mode-planner.md` for that setup; under a restricted
mode, save the plan file via a terminal heredoc instead of the Edit/Write
tool.

---

## Input Recognition

| User input | Action |
|---|---|
| `Plan [TICKET-ID]` | Run Phases 1-4 below |
| `Plan [TICKET-ID] again` / ticket context already in conversation | Re-run Phase 3-4 only, ticket context reused |

---

## Phase 1 — Fetch Context

```bash
cmd /c "node scripts/fetch-jira.cjs [TICKET-ID]"
```
Read `tempAgentOutput/ticket-context.md`. Extract every **Must NOT** / exclusion / constraint from the epic.

---

## Phase 2 — Classify

Apply the exact same Layer / Work type / Complexity / Skill map rules as
`solve-ticket/SKILL.md` Phase 2 — read that section, do not re-derive your own
rules here (keeps the two skills from drifting apart).

Print: `LAYER: [x] | TYPE: [x] | COMPLEXITY: [x] | FILES: [n] | SKILL: [x]`

If ambiguous — ask. If skill folder missing — ask.

---

## Phase 3 — Orient + Plan (read-only)

Read `.cursor/skills/[skill]/SKILL.md` for the skill selected in Phase 2.
Execute **only** its Orient step and its Plan / Define-Contract step (the
steps before "Implement"). Do not execute Implement, Tests, Run & verify, or
any later step — this phase never touches a source file.

Apply the same complexity gate depth as `solve-ticket` (SIMPLE = target
files only + one grep; STANDARD/COMPLEX = target files + pattern
references), but always produce the full plan block below regardless of
complexity — a reviewable artifact is the entire point of this skill, so
SIMPLE tickets don't get to skip it here even though they skip it in
`solve-ticket`'s own fast track.

If Orient reveals the actual file count differs from Phase 2's estimate
enough to change the SIMPLE/STANDARD/COMPLEX band, note the corrected count
in the plan file's Classification line and flag the discrepancy — don't
silently keep the stale estimate.

---

## Phase 4 — Write the plan file

Save everything gathered to `tempAgentOutput/plan-[TICKET-ID].md`:

```markdown
# Plan — [TICKET-ID]

## Ticket
[Summary] | [Type] | [Parent] | [Epic]

## Classification
LAYER: [x] | TYPE: [x] | COMPLEXITY: [x] | FILES: [n] | SKILL: [x]

## Constraints
- [every Must NOT from the epic]

## Orient
[output of the skill's Orient step]

## Plan
[output of the skill's Plan / Define-Contract step]

## Chain
[chain instruction carried over from the originating `Solve ... then ...`
call, if any — e.g. "then review". Empty if none.]

## Open questions
[anything ambiguous that needs a human answer before implementation]
```

Print: `📋 Plan saved → tempAgentOutput/plan-[TICKET-ID].md | Review it, then open a new chat and run: Implement [TICKET-ID] | Model/mode: see model-guidance.mdc`

Do NOT implement. Do NOT create, edit, or delete any file outside `tempAgentOutput/`.

---

## Handoff

Review the plan file — edit it directly if anything is wrong, this is the
correction point before any code gets touched. Then, in `solve-ticket`, run:

```
Implement [TICKET-ID]
```

`solve-ticket` will read this plan file, skip re-deriving Phase 1/2 and the
orient/plan steps, start straight from the target skill's Implement step,
and — if the `## Chain` field is set — run that chain after its own Phase 4.
