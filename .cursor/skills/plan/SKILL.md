---
name: plan
description: >-
  Planning-only pass for a Jira ticket in this monorepo — fetches ticket context
  via Jira MCP, classifies the ticket (new-feature, bugfix, pr-fixes), resolves
  the base branch, converts any design source into a text spec, investigates
  read-only, and writes a plan file plus a backend-requirements handover if the
  FE needs API changes. Makes no source changes. Use when the user says "Plan
  ECP-123" or asks for a plan before implementing.
argument-hint: "TICKET-ID [base:BRANCH]"
user-invocable: true
---

# Plan · Ticket Planning

Entry point: `Plan [TICKET-ID]` — optionally `Plan [TICKET-ID] base:staging`.

Produces up to three artifacts and **no source code changes**:

| File | When |
|------|------|
| `tempAgentOutput/plan-[TICKET-ID].md` | always |
| `tempAgentOutput/story-context-[STORY-ID].md` | first subtask under a story, or when the story changed |
| `tempAgentOutput/ui-references/[TICKET-ID].md` | ticket has a design source |
| `tempAgentOutput/be-requirements-[TICKET-ID].md` | FE needs data or endpoints the BE does not yet provide |

Every ticket goes through this first. There is no fast-track.

---

## Phase 1 — Context

**1a. Ticket.** Fetch the subtask via Jira MCP: summary, issue type, status,
description, parent story key, full Gherkin acceptance criteria, repro steps
(bugs). Note any attached designs, prototype URLs, or Figma links.

Write to `tempAgentOutput/ticket-context-[TICKET-ID].md`.

If no Jira MCP tool is available, stop and tell the user.

**1b. Story — cached, do not refetch per subtask.**

Story content is stable across sibling tickets. Fetch it **once per story**, not
once per ticket. Stop at the story — do not walk further up the hierarchy.

1. Read the parent story key from the ticket.
2. If `tempAgentOutput/story-context-[STORY-ID].md` **does not exist** → fetch
   the story in full: summary, description, story-level acceptance criteria, and
   every **Must NOT** / exclusion / constraint. Write it with the front-matter
   block below.
3. If it **does exist** → check staleness cheaply. If the Jira MCP can return a
   single field, request only the story's `updated` timestamp and compare it to
   `jira_updated` in the file.
   - Unchanged → **reuse the file. Do not refetch.**
   - Changed → refetch in full, overwrite, and note in the plan:
     `⚠️ Story [ID] changed since [date] — constraints re-extracted.`
   - If the MCP cannot do a field-limited fetch, refetch the story but say so
     once: `Story refetched — MCP does not support a cheap staleness check.`

```markdown
---
story: ECP-700
jira_updated: 2026-08-17T09:12:00Z
fetched_at: 2026-08-19
children_planned: [ECP-717, ECP-718]
---

# Story context — ECP-700

## Summary
## Story-level acceptance criteria
## ⛔ Constraints (apply to every subtask)
- [every Must NOT / exclusion]
```

Append this ticket's id to `children_planned` so it's visible which subtasks
were planned against this snapshot.

**Copy the Constraints list into the plan file** (Phase 7). It is short, and
`implement` / `review` already read the plan — that saves them a second file
read. `story-context-[STORY-ID].md` is a fetch cache, not a runtime dependency.

**1c. Base branch.** In order — stop at the first that resolves:
1. `base:<branch>` in the entry point
2. `cmd /c "gh pr view --json baseRefName"` if a PR exists
3. `cmd /c "git branch -r"` → **ask the user**, offering the detected long-lived
   branches (typically `staging`, `dev`, `main`)

Never guess. Downstream skills read it from the plan file instead of re-asking.

**1d. Apps in scope.** Which of `portal/`, `parent-portal/`, `pupil-portal/`,
`teacher-app/`? Read `.cursor/context/monorepo-map.md` if you need versions or
commands. If the ticket also lists `api/`, that is **BE team scope** — see
Phase 5.

**1e. Learnings.** Skim `.cursor/rules/learnings.mdc` for traps in these apps.

**1f. Prior diagnosis.** If `diagnose-ticket` was run for this ticket earlier in
the conversation, reuse its likely-cause and fix-impact rather than re-deriving
them in Phase 4. It writes no artifact, so it is only available in-session.

Print:
```
TICKET:      [ID] — [Summary]
TYPE:        [issue type]
STORY:       [ID — Summary]  (context: cached [date] | fetched now)
BASE:        [branch]  (source: arg | gh pr | user)
APPS:        [list]
DESIGN:      [prototype URL | figma | image | none]
CONSTRAINTS: [list]
```

---

## Phase 2 — Classify

- **bugfix** — issue type Bug, or "fix / broken / defect / regression"
- **new-feature** — "build / add / create / implement"
- **pr-fixes** — PR review comments pasted alongside the ticket id

**Feature-flag modifier:** ticket mentions "flag", "rollout", "gate", or
"kill switch" → FLAG: yes.

Print `TYPE: [x] | FLAG: [yes/no]`. If ambiguous — ask.

---

## Phase 3 — Design spec (only if DESIGN ≠ none)

Read `.cursor/context/design-workflow.md` and follow it. Prefer a prototype URL
over a Figma link over an image. Produce
`tempAgentOutput/ui-references/[TICKET-ID].md`, including the Tailwind and
existing-component mappings.

Interpret the design **once, here**. `implement` and `review` read the markdown,
never the original. Skip this phase entirely when the ticket has no design.

---

## Phase 4 — Orient (read-only)

Grep first. Read **ONE** pattern file.

### bugfix
Trace the data flow end to end.
- **ROOT CAUSE** — one line, the cause not the symptom. Cannot pin it down?
  **Stop and ask.** Do not let the plan guess.
- **FILES TO MODIFY** · **RISKS**

### new-feature
- **Constraints** — every Must NOT
- **App-local alignment** — read `.cursor/context/app-local-alignment.md`. In the
  **owning app only** (never another app), fill the **A1 reference-per-concern
  table**: name a sibling for every concern the ticket touches (API module, list
  page, filter bar, money, nav, dialog…), not just one UI file. A concern with no
  named reference is a plan gap — flag it. List planned new non-component files;
  each must pass A2 or be rejected from the plan.
- **Reuse** — existing components/hooks/utils found by grep **in the owning app**
- **API data** — what the UI needs vs what the backend already sends. Be exact:
  laroute key if one exists in the owning app's `src/api/`, else BE requirement.
  This feeds Phase 5.
- **Uncertainties**

### pr-fixes
Classify every pasted comment before planning:
| Comment | File | Verdict (VALID / PARTIAL / FALSE_POSITIVE / OUT_OF_SCOPE) | Reason |

### If FLAG: yes
Flag contract: exact key, default state (OFF unless stated), scope (global /
per-org / per-user — confirm). Both branches are real code paths, checked as
close to the entry point as possible.

---

## Phase 5 — Backend requirements (handover, not implementation)

**You never write backend code.** If the FE needs anything the API does not
already provide, write `tempAgentOutput/be-requirements-[TICKET-ID].md` — a
short document the user forwards to the BE team as-is.

Trigger this phase when any of these is true:
- The UI needs a field the current response does not contain
- No endpoint exists for an action the ticket requires
- An existing payload needs a new key
- A response shape, status code, or error format needs to change

Before writing it: **verify against the real API.** Grep `api/routes/` and the
existing FE hook/`fetcher` calls to confirm the endpoint and its current shape.
Never invent a route name. If you cannot confirm the current shape, say
`current shape unverified` rather than guessing.

**Keep it short.** One screen. Tables and field names, no prose, no rationale
essays, no implementation suggestions for the BE team.

```markdown
# BE requirements — [TICKET-ID]

FE ticket: [ID — Summary]
Apps: [portal / parent-portal / …]
Blocking FE work: yes / no

---

## 1. New endpoint — `GET /api/products/{id}/consents`
**Needed for:** signature count on the product card

Request: `id` (path, int)

Response:
| Field | Type | Notes |
|-------|------|-------|
| `count` | int | total signatures captured |
| `pupils[].name` | string | |
| `pupils[].signed_at` | ISO 8601 | null if pending |

---

## 2. Existing endpoint — `POST /api/products`
**Needed for:** the "Require parental consent" toggle

Add to request body:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `requires_consent` | bool | no | defaults false |

Add to response:
| Field | Type | Notes |
|-------|------|-------|
| `requires_consent` | bool | |
| `purchase_count` | int | FE disables the toggle when > 0 |

---

## Open questions for BE
- [only things the FE genuinely cannot decide]
```

Rules for this file:
- One numbered section per endpoint. New endpoints first, then changes to
  existing ones.
- Every entry states **what FE screen or behaviour needs it** in one line.
- Field tables only — no example JSON blobs unless the shape is nested enough
  that a table is unreadable.
- Mark each item `Blocking` or `Non-blocking` for FE progress.
- **Do not** propose Laravel implementations, migrations, controller names, or
  DB schema. That is the BE team's call.

Print: `📤 BE requirements → tempAgentOutput/be-requirements-[TICKET-ID].md — share with BE team`

If nothing is needed, skip the file entirely and note `BE changes: none` in the
plan.

---

## Phase 6 — Plan (read-only)

### bugfix
FIX PLAN (one line) | FILES TO MODIFY (what changes in each) | RISKS |
TEST PLAN (regression case that fails without the fix, happy path, edge cases,
existing behaviour to preserve)

### new-feature
SUMMARY (one sentence) | FILES TO TOUCH (ordered, what changes in each) |
STATE (where and why) | API (already available / needs BE — reference the BE
requirements file) | RISKS

### pr-fixes
Impact analysis for accepted comments only — data flow, consumers, regression
risk.
- ACCEPTED: | Comment | Files | Risk |
- REJECTED: | Comment | Verdict | Reason |

### If FLAG: yes
Test plan covers ON and OFF as separate explicit cases. Record cleanup debt:
`Flag [name] — remove after [condition].`

---

## Phase 7 — Write the plan file

`tempAgentOutput/plan-[TICKET-ID].md`:

```markdown
# Plan — [TICKET-ID]

## Ticket
[Summary] | [Type] | [Story]

## Context
- BASE: [branch]
- APPS: [list]
- TYPE: [bugfix / new-feature / pr-fixes]
- FLAG: [yes/no]
- STORY CONTEXT: story-context-[STORY-ID].md (snapshot [date])
- DESIGN SPEC: [path or none]
- BE REQUIREMENTS: [path or none] — [blocking / non-blocking]

## Constraints
- [every Must NOT]

## Acceptance criteria
[full Gherkin — `review` reads these from here]

## Orient
[Phase 4 output]

## App-local alignment
[API reference, UI reference, owning app(s), planned modules, laroute keys — ALPG A1]

## Plan
[Phase 6 output]

## Open questions
[anything needing a human answer before implementation]
```

Print:
```
📋 Plan saved → tempAgentOutput/plan-[TICKET-ID].md
BASE: [branch] | TYPE: [x] | APPS: [list]
Design spec: [path or none] | BE requirements: [path or none]
→ Implement [TICKET-ID]
```

Do NOT implement. Do NOT create, edit, or delete any file outside
`tempAgentOutput/`.
