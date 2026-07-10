# Bug Fix Review · Bug Ticket Code Quality + Root Cause Verification

Entry point: `Review Bug Fix [TICKET-ID]` (or `bug fix review
[TICKET-ID]`).

Principal React/TypeScript engineer review, specialised for bug tickets
handled via `Plan Bug Fix` / `Implement Bug Fix`. Two checks against the
ticket, always run together as one report — code quality against the
diff, and that the actual root cause (not just the reported symptom) was
fixed.

---

## Phase 0 — Ensure ticket context is loaded

If `tempAgentOutput/plan-[TICKET-ID].md` exists in this conversation or on
disk, read it — it already has the ROOT CAUSE, fix plan, and constraints
from planning, no need to re-derive.

If it does NOT exist (e.g. fresh chat, no prior `Plan Bug Fix` /
`Implement Bug Fix` this session), stop and tell the user: `⚠️ No plan
found for [TICKET-ID]. Run: Plan Bug Fix [TICKET-ID] first.` Do not
reconstruct the root cause from the diff alone — a review without the
plan's stated root cause can't verify the fix actually addresses it.

---

## Phase 1 — Pre-review (mechanical, not a judgment call)

```bash
cmd /c "git diff $(git merge-base HEAD origin/develop)..HEAD"
cmd /c "npx tsc --noEmit --project tsconfig.app.json"
cmd /c "npx vitest run --pool=forks --coverage"
```
If type-check or test run fails, that's a FAIL on its own — report it up
front, independent of the checklists below. Don't let a clean-looking diff
override a red test run.

---

## Part A — Code quality (against the diff)

Rate each item **PASS / FLAG / FAIL** + one line evidence. Report only
FLAG/FAIL in detail.

- **Architecture**: single responsibility? state level? reimplemented
  utility? useEffect deps? CC > 15?
- **FE**: testIds format? 4 states? submit guard? API data as-is?
- **A11y**: aria-labels? keyboard nav? focus return?
- **UI Copy**: against `.cursor/context/ui-copy-rules.md` — cardinality
  (0/1/2+) handled? Oxford comma on 3+ lists? dedicated empty-state
  copy (never "0 files")? error messages say what went wrong AND what to
  do next? no hardcoded currency/date/number formats?
- **Security**: unsanitised HTML? tokens in localStorage? PII in props?
- **Dead code**: unused exports/functions/components introduced by this
  diff but never called? Commented-out code left in?

---

## Part B — Root cause & regression verification (against the plan)

- **Root Cause Match**: does the diff actually address the plan's stated
  ROOT CAUSE, or does it patch the symptom? If the diff only masks the
  symptom (e.g. a null check instead of fixing why the value is null),
  FAIL this and say why.
- **Bug Regression Test**: a test exists that reproduces the original bug
  and would fail without this fix (not just a happy-path test touching
  the same file).
- **Existing Behaviour Preserved**: trace consumers of any shared
  component/logic this fix touches — confirm no regressions elsewhere.
- **Acceptance Criteria**: for each Gherkin scenario from the plan's
  ticket context — **Satisfied** / **Partially Satisfied** / **Not
  Satisfied**, relevant code location, missing functionality, tests
  needed to verify.

---

## Output — single combined report

1. Type-check: PASS/FAIL. Test run: PASS/FAIL (+ coverage %).
2. **Code quality findings**: | Severity | File:line | Issue | Fix |
3. **Root cause verdict**: Match / Symptom-only-patch (with reasoning).
4. **Regression test verdict**: Present / Missing / Brittle.
5. **AC scenarios**: | Scenario | Verdict | Location | Gap |
6. ✅ Correctly implemented | ❌ Missing/gaps | ⚠️ Risks/edge cases |
   🧹 Unnecessary/extra code
7. Summary + top 3 risks
8. Fix code for Critical/High findings — copy-paste ready
9. Recommendations before merge
