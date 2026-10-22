---
name: review-code
description: >-
  Read-only review of a ticket's changes in this monorepo — diff-scoped code
  quality, Sonar and Snyk gates, acceptance-criteria coverage, design fidelity,
  and root-cause verification for bugs. Produces a prioritized fix queue that
  `fix-pr-comments` consumes. Use when the user says "Review ECP-123", "review this
  branch", or "PR review".
argument-hint: "TICKET-ID [base:BRANCH]"
user-invocable: true
---

# Review · Code Quality + Acceptance Criteria

Entry point: `Review [TICKET-ID]` — or `Review` / `Review [PR-URL]` for a
diff-only pass with no ticket.

Read-only. Produces `tempAgentOutput/review-[TICKET-ID].md` with a **prioritized
fix queue** that `Fix PR Comments [TICKET-ID]` consumes.

**Do not modify source files in this skill.**

---

## Phase 0 — Context

If `tempAgentOutput/plan-[TICKET-ID].md` exists, read it — it has AC,
Constraints, BASE, APPS, TYPE, design spec path, BE requirements path, and (for
bugs) ROOT CAUSE. **That is enough. Do not refetch the ticket or its story.**

Only if the plan file is missing: fetch the subtask into
`tempAgentOutput/ticket-context-[TICKET-ID].md`, and for story constraints reuse
`tempAgentOutput/story-context-[STORY-ID].md` if it exists rather than
refetching the story.

If TYPE is bugfix and no plan file exists, say so up front: without the stated
root cause you can check code quality but **cannot** verify the fix addresses
the cause rather than the symptom.

If a design spec exists, read `tempAgentOutput/ui-references/[TICKET-ID].md` —
not the original image or Figma link.

**Base branch**, in order: `base:<branch>` arg → `BASE:` from the plan file →
`cmd /c "gh pr view --json baseRefName"` → ask the user, offering branches from
`git branch -r`. Never default to a branch name.

---

## Phase 1 — Pre-review (mechanical)

```bash
cmd /c "git diff --name-only origin/<base>...HEAD"
cmd /c "git diff origin/<base>...HEAD"
cmd /c "git status"
```

Three-dot diff. Also check unstaged changes if the tree has uncommitted work.

Per app touched:
```bash
cmd /c "cd <app> && yarn test <affected paths>"
cmd /c "cd <app> && yarn lint"
```
Plus type-check, **Sonar** (cognitive complexity on changed files), and **Snyk**
(`snyk_code_scan`). Note if either tool is unavailable rather than skipping
silently.

**A failing type-check, test run, Sonar threshold, or Snyk finding is a FAIL on
its own** — report it up front. A clean-looking diff does not override a red run.

**Scope constraint:** review only lines added, modified, or deleted in the diff.
Do not comment on pre-existing code or architecture outside the diff, even if
the file is open. **Exception:** **App-local alignment (ALPG)** — compare new
files in the diff to the owning app's named API/UI references (see below).

**Fast filter.** Deep-read application source, tests, infra code. Skip markdown,
lockfiles, generated artifacts, IDE folders — but list them in the inventory and
flag "manual review required" if a skipped file is test- or security-relevant.

**Large diff (>1000 changed lines).** Focus on entry points (routes, handlers,
APIs), security boundaries (auth, validation, sanitisation, secrets), data
mutation, core business logic. Note `deferred: N files` with a one-line reason
each.

---

## Phase 1b — App-local pattern gate (blocking)

Read `.cursor/context/app-local-alignment.md`. For **each owning app** in the
diff:

1. Take **API reference** and **UI reference** from the plan's `## App-local
   alignment` section, or if missing grep the owning app's `src/api` and
   `src/containers` for the nearest domain sibling and **note plan gap**.
2. Run checks **A2–A4** on all **new** files in the diff under that app.
3. Record the PASS/FAIL table in the review file.

Any ALPG **FAIL** is **FAIL** in Part A (usually **HIGH**). Do not downgrade to
“matches repo drift” or “mostly aligned.”

---

## Part A — Code quality (against the diff)

Rate **PASS / FLAG / FAIL** with one line of evidence. **Report only FLAG and
FAIL in detail.** No PASS without evidence.

- **App-local alignment** — ALPG Phase 1b table; references in **owning app
  only**; laroute vs path builders; util/module sprawl; HTTP only in `src/api/`.
- **Architecture** — single responsibility? state at the right level? a hook or
  util reimplemented that already exists (grep **owning app** before flagging
  duplication)? `useEffect` deps correct?
- **Complexity (Sonar)** — any function or component at or above CC 15? Name it
  and its CC. This is a FAIL, not a FLAG.
- **Security (Snyk)** — any finding on new first-party code, unfixed?
- **Frontend** — all 4 states? submit guard? API data used as-is? mutations
  invalidate queries? no side effects inside hooks? correct router/store version
  for that app? Tailwind only, no custom CSS?
- **Design fidelity** *(only if a spec exists)* — matches the spec's component
  and Tailwind mappings? Reuses the components the spec named? Any invented
  detail the design did not show?
- **Accessibility** — `aria-label` describing action *and* target on icon-only
  controls? inputs labelled? keyboard reachable? focus returns after modal close?
- **UI copy** *(only if the diff has user-facing strings)* — read
  `.cursor/context/ui-copy-rules.md`: cardinality (0/1/2+), Oxford comma on 3+,
  dedicated empty-state copy, errors say what went wrong *and* what to do next,
  no hardcoded currency/date/number formats, i18n-safe interpolation.
- **API contract** *(if a BE requirements file exists)* — does the FE consume
  only fields the contract defines? Does it handle the shape the BE actually
  ships today, versus the shape requested? Any field consumed that nobody has
  committed to sending is a FAIL.
- **Tests** — every AC covered? user actions? 4 states? mocks match the real API
  shape? co-located, not in `__tests__/`? New public function, module, or error
  branch with no test → `Missing Test`.
- **Dead code** — unused exports/components introduced here and never called?
  commented-out code left in?
- **Justification failures** — a TODO/FIXME deferring work with no ticket, owner,
  or removal condition ("later", "temporary", "works on my machine"). A properly
  tracked TODO does not fail. Propose a concrete fix, not a complaint.

Standards already enforced by CI or lint: do not restate. Flag only gaps.

**Portal API / list-page hygiene** (when `portal/src/api/` or payments index
pages are in the diff):
- **Filing:** only `index`/`types`/`utils` at a feature root — rest under
  `components/`. No util sprawl, no single-use or unused exports, no util that
  just returns one field.
- **API module:** hook names without `Query`/`Mutation` suffix;
  `useQuery`/`useMutation` (not `use*WithGlobalError`) unless the file already
  uses global wrappers; call inline, no `fetcher`/`mutation` wrapper functions;
  `config?.onSuccess` not a respread `restConfig`; module limited to
  list/detail/action calls; **params passed in by the component, never built in
  the hook**; laroute keys not path builders.
- No redundant `staleTime` when app defaults + `invalidateQueries` suffice.
- Money: `formatPrice(pence / 100)` only — no `*_formatted` hybrid helpers.
- **Index pages:** URL is the query string — `useThing(Object.fromEntries(
  searchParams))`, like `AllPurchases.tsx`. **No `build*QueryParams`, no
  cross-field filter rules, no re-parsed/defaulted params in the page** (A6).
  Shared Header + actions (ref `Payments/Vouchers/index.tsx`), not a custom
  header. Avoid needless `useMemo`/`useCallback`.
- **Visual:** no hardcoded hex (Tailwind tokens); reuse existing badge/table
  styles; right table variant for the surface; dropdowns/popovers in modals
  portalled out (check last row); `cn()` for conditional classes; no UI absent
  from the prototype.
- **UX:** invalid action → disabled button + tooltip, not a firing toast. No
  placeholder settings UI; no global `fetcher.ts` changes for one feature.
- List UI: table + pagination + empty state live together, not split across
  single-consumer files.

---

## Part B — Acceptance criteria

For each Gherkin scenario: **Satisfied / Partially Satisfied / Not Satisfied** ·
code location · missing functionality · tests needed.

Where an AC cannot be satisfied because a BE endpoint has not shipped, mark it
**Blocked on BE** and reference the requirements file — that is not an FE
failure.

Also:
- **Root cause** *(bugfix only)* — does the diff address the plan's stated ROOT
  CAUSE, or patch the symptom? A null check instead of fixing why the value is
  null is a FAIL — say why.
- **Regression test** *(bugfix only)* — Present / Missing / Brittle. Present
  means it reproduces the original bug and fails without the fix.
- **Feature flag** *(if applicable)* — OFF: existing behaviour unchanged. ON:
  new behaviour correct, other flows unaffected.
- **Regression analysis** — if this reuses shared components or logic, trace the
  consumers and confirm no regressions elsewhere.

---

## Priority rubric

| Priority | When | Examples |
|----------|------|----------|
| **HIGH** | Must fix before merge | Logic bugs, AC not satisfied, Sonar CC ≥ 15, unfixed Snyk finding, security, authz, secrets, data loss, a11y blockers, failing tests, **any ALPG FAIL** |
| **MEDIUM** | Should fix | Missing tests, a11y gaps, partial AC, design drift, regression risk in shared code |
| **LOW** | Nice to have | Naming, optional refactors, minor copy, docs |

FAIL → usually HIGH. FLAG → MEDIUM or LOW. Partially Satisfied AC → MEDIUM
(HIGH if user-facing). Not Satisfied AC → HIGH. Torn between two levels → take
the higher.

Every item gets a stable id: `R-001`, `R-002`, …

---

## Phase 2 — Write the review file

`tempAgentOutput/review-[TICKET-ID].md`:

```markdown
# Review — [TICKET-ID]

## Pre-review
- Base: [branch] | Apps: [list]
- Type-check / Lint / Tests / Sonar / Snyk: PASS/FAIL each
- Diff scope: [files] | Skipped: [files] | Deferred: [n + reasons]

## App-local alignment (ALPG)
| Check | PASS/FAIL | Evidence |
| A1 References | | |
| A2 File tree | | |
| A3 API / laroute | | |
| A4 UI | | |

## Code quality findings
| Id | Priority | Rating | File:line | Issue | Suggested fix |

## Acceptance criteria
| Scenario | Verdict | Location | Gap |

## Root cause verdict        (bugfix only)
## Regression test verdict   (bugfix only)

## Summary
✅ Correct | ❌ Gaps | ⚠️ Risks | 🧹 Extra code | 🔒 Blocked on BE
Top 3 risks | Test verdict: ADEQUATE | GAPS

## Prioritized fix queue
### HIGH
| Id | Comment | File | Status |
| R-001 | [one-line actionable] | path:line | OPEN |
### MEDIUM
### LOW

## Copy-paste fixes (HIGH only)

## Residual risks
[only things not verifiable from diff/tests — integration env, perf, threat model]
```

Every FAIL/FLAG and every AC gap with a concrete fix becomes a queue row. Do not
invent LOW items for things that passed. Status starts `OPEN`.

Print:
```
📋 Review saved → tempAgentOutput/review-[TICKET-ID].md
Sonar: [PASS/n over CC15] | Snyk: [PASS/n findings]
QUEUE: HIGH [n] | MEDIUM [n] | LOW [n]
→ Fix PR Comments [TICKET-ID]        (all OPEN)
→ Fix PR Comments [TICKET-ID] HIGH   (HIGH only)
→ Fix PR Comments [TICKET-ID] R-003  (single item)
```

Also print the findings table, AC table, summary, and queue counts in chat.

Tone: direct and imperative. No corporate fluff.
