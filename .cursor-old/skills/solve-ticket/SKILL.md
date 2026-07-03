# Solve Ticket · Orchestrator

Agentic workflow for Jira tickets. Handles initial implementation, follow-up reviews, and PR fixes — all through one entry point.

---

## Input Recognition

Determine what the user is asking and route accordingly:

| User input | Route |
|---|---|
| `Solve [TICKET-ID]` | → Phase 1 (fetch) → Phase 2 (classify) → Phase 2.5 (auto-split gate) → Phase 3 (execute) → Phase 4 (commit) |
| `Plan [TICKET-ID]` | → hand off to the `plan-ticket` skill. Produces `tempAgentOutput/plan-[TICKET-ID].md`, no code changes. Does not continue into this skill. |
| `Implement [TICKET-ID]` | → **Plan handoff.** If `tempAgentOutput/plan-[TICKET-ID].md` exists, read it and skip straight to Phase 3, starting the mapped skill at its Implement step (Phase 1/2 and the orient/plan step are already in the plan file). If the file does NOT exist, treat identically to `Solve [TICKET-ID]`. |
| `Review` or `Review it` or `Run code review` | → Phase 3 directly with type=**code-review** (ticket context already in conversation or re-fetch if new chat) |
| PR comments pasted (look for file paths, line numbers, reviewer names) | → Phase 3 directly with type=**pr-fixes** |
| `Solve [TICKET-ID] then review` | → Full pipeline, then auto-chain code-review after Phase 4. If the ticket auto-splits (Phase 2.5), the chain does not run in this chat — it's carried into the plan file instead. See "Chaining" below. |
| `Fix PR comments for [TICKET-ID]` + comments pasted | → Phase 1 (fetch) → Phase 3 with type=**pr-fixes** |
| `Verify [TICKET-ID]` or `Validate AC for [TICKET-ID]` | → Phase 1 (fetch, if not already in context) → Phase 2 (classify layer only) → Phase 3 directly with type=**task-review**. If the resolved layer has no task-review skill (BE and E2E currently don't — see Skill map), say so and offer `Review` (code-quality diff) as the closest available alternative instead of guessing. |
| Multiple ticket IDs in one input (e.g. `Solve ES-1 and ES-2`) | → Do **not** combine into one run — a ticket owns one branch, one commit, one plan file, and "only touch files in scope for this ticket" doesn't hold across two tickets at once. Ask which to run first, or confirm running sequentially: fully complete one (through Phase 4, or through the Phase 2.5 stop) before starting the next. Never interleave. |

**Follow-up detection:** If ticket context already exists in this conversation (from a previous `Solve`), skip Phase 1. If not, run Phase 1 first.

`Solve [TICKET-ID]` is the only command you need to type for new work — Phase 2.5 decides automatically whether to run end-to-end inline or stop after planning. `Plan [TICKET-ID]` / `Implement [TICKET-ID]` remain available as manual overrides: force a checkpoint on a ticket that would otherwise run inline, force a bigger ticket to run inline, or deliberately use the restricted Planner custom mode (see Phase 2.5).

---

## Phase 1 — Fetch Context

```bash
cmd /c "node scripts/fetch-jira.cjs [TICKET-ID]"
```
Read `tempAgentOutput/ticket-context.md`. Extract every **Must NOT** / exclusion / constraint from the epic.

Print:
```
TICKET:      [ID] — [Summary]
TYPE:        [issue type]
PARENT:      [ID — Summary]
EPIC:        [ID — Summary]
CONSTRAINTS: [list]
```

---

## Phase 2 — Classify

### Layer
- **FE** → React, UI, button, page, component, modal
- **BE** → API, endpoint, service, database, controller
- **E2E** → both signals
- **Terraform** → infrastructure, IAC

### Work type
- **bugfix** → Bug type, or "fix/broken/defect/regression"
- **new-feature** → "build/add/create/implement"
- **code-review** → "review/audit/check"
- **pr-fixes** → PR review comments referenced
- **task-review** → "verify/validate" against AC

### Complexity
Estimate file count from the ticket description — this is a pre-Orient guess,
not measured fact. State a number anyway; Phase 3's Orient step is where it
gets confirmed or corrected (see Phase 2.5's reality check).

| Level | Files | Signals |
|---|---|---|
| **SIMPLE** | 1 | Single component, clear what to do, no new patterns needed |
| **STANDARD** | 2-5 | Some cross-component work, need to verify patterns |
| **COMPLEX** | 5+ | New patterns, cross-cutting, multi-layer impact |

### Skill map
| | bugfix | new-feature | code-review | pr-fixes | task-review |
|---|---|---|---|---|---|
| FE | fe-bugfix | fe-new-feature | fe-pr-review | fe-pr-fixes | fe-task-review |
| BE | be-bugfix | be-new-feature | be-code-review | be-pr-fixes | — |
| E2E | e2e-bugfix | e2e-new-feature | e2e-code-review | — | — |

Print: `LAYER: [x] | TYPE: [x] | COMPLEXITY: [x] | FILES: [n] | SKILL: [x]`

If ambiguous — ask. If skill folder missing — ask.

### Feature-flag modifier (orthogonal)
If the ticket mentions "flag", "rollout", "gate", or "kill switch", also
apply `.cursor/skills/feature-flag-rollout/SKILL.md` alongside the mapped
skill above — it covers flag-specific steps only, not the whole ticket.

---

## Phase 2.5 — Auto-split gate

| FILES (from Phase 2) | Route |
|---|---|
| **1** (SIMPLE) | Continue to Phase 3 in this chat — plan and implement happen together. |
| **2+** (STANDARD/COMPLEX) | Hand off to `.cursor/skills/plan-ticket/SKILL.md` Phase 3-4 (Orient + Plan, write the plan file) instead of continuing here. STOP once the plan file is saved — do not implement in this chat. |

Model and Cursor-mode choice are not something this skill can set for you —
see `.cursor/rules/model-guidance.mdc` for which tier to use per phase, and
`.cursor/context/custom-mode-planner.md` for the restricted Planner mode
(high-risk tickets only — it has no edit tool, so it can only be chosen
deliberately before you start, never entered mid-split).

On split, print: `📋 [ID] — [n] files, plan saved → tempAgentOutput/plan-[TICKET-ID].md | Open a NEW chat and run: Implement [TICKET-ID] | Model/mode: see model-guidance.mdc`

**Chain carry-over:** if a chain instruction was given (e.g. `Solve ES-1838
then review`) and the ticket splits, write it into the plan file's `## Chain`
field instead of running it here — `Implement [TICKET-ID]` executes it after
its own Phase 4. See "Chaining" below.

**Estimate-vs-reality check (inline path only):** if Phase 3's Orient step
reveals the ticket actually touches 2+ files despite a SIMPLE classification,
stop, flag the mismatch, and confirm with the user before proceeding rather
than silently continuing past the point the split should have triggered.

Override the route only on explicit instruction (e.g. "solve this inline
even though it touches 3 files", or "always split, even for 1-file tickets").

---

## Phase 3 — Execute

Read `.cursor/skills/[skill]/SKILL.md` for the step-by-step workflow.

**Plan file check:** if `tempAgentOutput/plan-[TICKET-ID].md` exists, read it
first. It already contains Phase 1/2 output plus the skill's Orient and
Plan/Define-Contract output. Do not redo those steps — start the skill
directly at its Implement step, using the plan file's content as if it were
just produced in this conversation. If the plan file's classification
disagrees with what you'd derive now, or a Constraint looks stale, flag it
and confirm before proceeding rather than silently overriding either source.
If the plan file has a `## Chain` field set, treat it as if that instruction
were given now — run it after Phase 4 (see "Chaining").

**Apply complexity gates before following those steps:**

### SIMPLE — fast track
- **Orient:** Read ONLY the target file you will modify. Run ONE grep/search to check if what you're building already exists. Note patterns from the target file itself. Do NOT read other screens.
- **Plan:** 2-3 bullets. Do NOT wait for confirmation.
- **Implement:** Full — follow all self-check items (testIds, 4 states, reuse, etc.).
- **Tests:** Happy path per AC + one edge case. Read ONE existing test file for style.
- **Self-review:** Only: (1) Every AC met? (2) Any constraint violated? (3) Any existing pattern broken?
- **PR description:** Short — What + AC ✅.
- **Skip:** Retrospective.

### STANDARD — full workflow
- Follow all skill steps. Orient: target files + ONE pattern reference. Self-review: FLAG/FAIL only. Retrospective: three one-liners.

### COMPLEX — thorough workflow
- Follow all skill steps. Orient: target files + 2-3 pattern references. Self-review: full checklist. Retrospective: full.

---

## Non-negotiable — all complexities

Never skip regardless of SIMPLE/STANDARD/COMPLEX:

1. **Read before write** — never modify a file you haven't read in this session.
2. **Search before create** — before writing any new utility, hook, component, or constant, search to confirm it doesn't exist.
3. **Patterns from the target** — match naming, imports, and structure of the file you're modifying.
4. **API data as-is** — never redefine or duplicate backend values.
5. **4 states** — loading, error, empty, success for any data-fetch or submission.
6. **testIds** — `[feature]-[component]-[element]` on interactive elements.
7. **Epic constraints** — every Must NOT from Phase 1 must be enforced.
8. **No debug artifacts** — no console.log, commented-out code, TODOs.

---

## Phase 4 — Pre-Push Gate

1. `npx tsc --noEmit --project tsconfig.app.json` — zero errors
2. Affected tests pass
3. Coverage ≥ 70% on changed files
4. No console.log, commented-out code, or debug artifacts
5. Branch (if not already on one): `cmd /c "git checkout -b [type]/[TICKET-ID]-short-desc"`
6. Commit: `cmd /c "git add -A -- ":!.env*" ":!.gitignore" ":!.cursor/mcp.json"" && cmd /c "git commit -m \"[type](TICKET-ID): [desc]\""`
7. Save PR description to `tempAgentOutput/pr-description.md`

Do NOT push.

Print: `✅ [ID] done | Branch: [x] | Files: [list] | → git push -u origin [branch]`

---

## Chaining — after Phase 4 completes

If the original input included a chain instruction (e.g. "Solve ES-1838 then
review"), OR the plan file being executed has a `## Chain` field set:

1. Print: `--- CHAINING: code-review ---`
2. Set type = code-review, keep same layer and ticket context.
3. Go to Phase 3 with the code-review skill.
4. The review skill will generate its diff from the branch changes.
5. If review finds Critical/High issues → fix them → re-run Phase 4.

If the user later pastes PR comments in the same conversation:
1. Recognize as pr-fixes (file paths + line numbers + reviewer text).
2. Set type = pr-fixes, keep same context.
3. Go to Phase 3 with the pr-fixes skill.
4. Run Phase 4 after fixes.
