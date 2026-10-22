---
name: review-pr
description: >-
  Diff-only senior + security review of a branch as it would appear in a GitHub
  PR — runs the senior "skim gate" (structure/filing, API shape, visual
  fidelity) FIRST, then code quality, security, and tests. Use on your own
  branch before requesting review, or on a PR by number/URL. Produces PR-style
  findings, not the tempAgentOutput fix queue (that is `review-code`).
argument-hint: "[PR-NUMBER | PR-URL]"
user-invocable: true
---

# Review PR · Senior Skim Gate + Security & Quality

Entry point: `Review PR` — optionally `Review PR [PR-NUMBER]` or a pasted PR URL.

This is the pass you run **before a human reviewer sees the branch**. Its job is
to catch everything a senior catches on a first skim — bad filing, invented
abstractions, API over-engineering, off-pattern visuals — *before* they have to
write the comment. Read-only unless the user says otherwise.

**CRITICAL CONSTRAINT:** review ONLY lines added, modified, or deleted in the
diff. Do not comment on pre-existing code outside the diff. **Exception:** the
App-local alignment gate compares new files to their owning-app references.

---

## Setup

1. **Base branch:** PR URL/number → `cmd /c "gh pr view --json baseRefName"`.
   Otherwise `BASE:` from `tempAgentOutput/plan-[TICKET-ID].md`, else ask —
   offering branches from `git branch -r`. Never default silently.
2. **Changeset:** `cmd /c "git diff origin/<base>...HEAD"` (three-dot) and
   `git diff --name-only origin/<base>...HEAD`.
3. **Apps in scope:** from diff paths. Read `.cursor/context/monorepo-map.md` if
   you need commands/versions.

---

## GATE 0 — Senior skim (blocking, do this FIRST)

A reviewer will not read your logic until the shape is right. Run this before
anything else; any FAIL here is **HIGH** and must be fixed before the PR is
review-ready. Report as a table: Check · PASS/FAIL · Evidence.

### Structure & filing
- **Feature folder:** only `index`, `types`, `utils` live at the feature root —
  every other file is under `components/`. A file at the root that renders UI or
  holds a hook is a FAIL.
- **Util sprawl:** more than one helper/constant module per feature, OR any
  exported helper imported from only one place, OR any unused export → FAIL.
  Inline single-use helpers; delete unused ones. Never wrap a single field
  access in a function (`xDisplayName(a) => a.full_name`).
- **HTTP location:** any `fetcher`/`instance.*`/axios call outside `src/api/` →
  FAIL.

### API shape (`src/api/*`)
Compare to the owning app's reference module (e.g. `parents-evenings.ts`,
`payg.ts`). FAIL when the module is more than: a list/index call, a detail call,
and the action calls the feature needs.
- No path-building util functions when a **laroute key** exists — use the key.
- No `fetcher`/`mutation` wrapper functions — put the call inline in the hook.
- Hook names have **no** `Query`/`Mutation` suffix (`useThing`, `useUpdateThing`).
- Config spread as `config?.onSuccess`, not a destructured-and-respread
  `restConfig`. No per-hook `staleTime`. No `use*WithGlobalError` in new code.
- **Params are the component's job, not the hook's.** The hook takes `params`
  and passes them to the backend as-is; it never builds, normalises, defaults,
  or filters them — so it stays reusable by other features. Filter/page/sort
  are supplied by the calling component from the URL.

### Index / list page
Side-by-side against the reference list page (e.g. `AllPurchases.tsx`): the URL
**is** the query string — `useThing(Object.fromEntries(searchParams), …)`. FAIL
on any `build*QueryParams`, cross-field filter rule, re-parsed page/limit, or
forced default param living in the page. Each filter control writes the API's
own param (`filter[linked]=0`), not a UI-only value the page later translates.
Page header uses the shared **Header + actions** pattern (ref
`Payments/Vouchers/index.tsx`), not a custom header. Table + pagination + empty
state live together in the list component.

### Visual fidelity
- **No hardcoded hex colours** — use the app's Tailwind tokens. Off-palette
  badges/alerts read as "not our style".
- Reuse existing badge/table/component styles; do not invent new ones.
- Match the reference screen's table/container **variant** (e.g. the standard
  table is not for white backgrounds) — don't force the default.
- Dropdowns/popovers inside a modal or on the last row must render **outside**
  their container (portal), never clipped.
- **Do not build UI that is not in the prototype** (extra icons, explanatory
  paragraphs). If you think the prototype should change, flag it to the
  designer/PM — do not ship the change unasked.
- Use `cn()` from `utils` for conditional classes.

### App-local alignment
Run ALPG A1–A6 (`.cursor/context/app-local-alignment.md`), including the **A6
in-file shape match** side-by-side. "Mostly aligned" / "domain-specific" is not
PASS.

---

## GATE 1 — Mechanical

Per app touched: `yarn test <affected>`, `yarn lint`, type-check, **Sonar**
(cognitive complexity — any function ≥ CC 15 is a FAIL; a `filter*.ts` doing
filter algebra is usually both a CC and a GATE 0 FAIL), **Snyk**
(`snyk_code_scan`). A red run is a FAIL on its own, reported up front.

**Coverage:** meet the **PR's actual CI coverage gate on new code**, which is
higher than 70% and **varies by area** (80%, 95% seen on portal). Read the PR's
checks — do not assume a flat number. Below the required threshold is a FAIL.

---

## Fast filter

Deep-review application source, tests, infra. Skip markdown, lockfiles,
generated artifacts, IDE folders — but list them and flag "manual review
required" if a skipped file is test- or security-relevant.

## Large diff (>1000 changed lines)

Focus on entry points, security boundaries (auth, validation, sanitisation,
secrets), data mutation, core logic. Note `deferred: N files` + one-line reason.

---

## GATE 2 — Code, security, tests

- **Security (HIGH):** authz, injection, secrets, data loss, broken contracts,
  unsafe production config. Discover existing utilities via search before
  flagging duplication.
- **Robustness:** 4 states (loading/error/empty/success), submit guard,
  `useEffect` cleanup, mutations invalidate queries, no side effects in hooks,
  API data used as-is, correct router/store version for the app.
- **Money:** `formatPrice(pence / 100)` — no `*_formatted` hybrid helpers.
- **UX patterns:** invalid action → disabled button + explanatory tooltip, not a
  click that fires an error toast. No placeholder/empty "settings" shells.
- **Tests:** every changed public function/branch covered; mocks match the real
  API shape; co-located, not `__tests__/`. **Test descriptions must match what
  they assert** — a name saying "with X" that asserts no-X is a FAIL.
- **Accessibility:** `aria-label` describing action *and* target on icon-only
  controls; keyboard reachable; focus returns after modal close; `role="alert"`
  on injected banners.
- **UI copy** (if user-facing strings changed): read
  `.cursor/context/ui-copy-rules.md`. Don't duplicate a visible button in helper
  text.
- **Justification failures:** TODO/FIXME with no ticket/owner/removal condition.

Standards already enforced by CI/lint: do not restate — flag only gaps.

---

## Output — single response

```markdown
## Summary
Max 2 sentences: PR intent for non-technical stakeholders.

## Gate 0 — Senior skim
| Check | PASS/FAIL | Evidence |
(Structure · API shape · Index/list · Visual · ALPG A1–A6)
→ If any FAIL: "NOT review-ready — fix Gate 0 before requesting review."

## Priority table
| HIGH | LOW |
| [n] | [n] |

## Findings
Loc: [path]:[line]
Issue: [what] | Risk: [impact]
Test status: [Covered | Missing | Brittle | Insufficient]
Fix (HIGH): [copy-paste-ready code]  /  Fix (Low): [change X → Y]

## Residual risks
[only what cannot be verified from diff/tests — integration env, perf, threat model]
```

**Agent mode:** apply `Fix (HIGH)` patches then run verification. **Ask mode:**
output fixes only, do not apply. Tone: direct, imperative, no corporate fluff.
