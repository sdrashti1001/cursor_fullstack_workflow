# Review · FE Code Quality + Acceptance Criteria

Entry point: `Review [TICKET-ID]` (or `review ticket-number`).

Principal React/TypeScript engineer. Two checks against the ticket, always
run together as one report — code quality against the diff, and acceptance
criteria against the ticket (at the ticket level — the criteria this
specific ticket owns, not a separate sub-task-by-sub-task breakdown).

---

## Phase 0 — Ensure ticket context is loaded

If `tempAgentOutput/plan-[TICKET-ID].md` exists in this conversation or on
disk, read it — it already has the Gherkin acceptance criteria and
constraints from planning, no need to re-fetch.

If it does NOT exist (e.g. fresh chat, no prior `Plan`/`Implement` this
session), fetch fresh:
```bash
cmd /c "node scripts/fetch-jira.cjs [TICKET-ID]"
```
Read `tempAgentOutput/ticket-context-[TICKET-ID].md` for the acceptance criteria.

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
- **Tests**: AC covered? user actions? 4 states? mocks match API?
- **Security**: unsanitised HTML? tokens in localStorage? PII in props?
- **Dead code**: unused exports/functions/components introduced by this
  diff but never called? Commented-out code left in?

---

## Part B — Acceptance criteria (against the ticket)

For each Gherkin scenario from Phase 0's ticket context:
- **Satisfied** / **Partially Satisfied** / **Not Satisfied**
- Relevant code location
- Missing functionality
- Tests needed to verify

Also check:
- **Feature Flag Validation** (only if the ticket touches a flag): Flag OFF
  → existing behavior unchanged, no regressions. Flag ON → new behavior
  correct, other flows unaffected.
- **Regression Analysis**: if this change reuses existing components or
  logic, verify those shared changes don't introduce regressions elsewhere.
- **Bug Regression Test** (only if Classification.TYPE = bugfix, from a
  `Plan Bug Fix` / `plan` plan file): a test exists that reproduces the
  original bug and would fail without this fix. Root cause from the plan
  actually addressed — not just the reported symptom.

---

## Output — single combined report

1. Type-check: PASS/FAIL. Test run: PASS/FAIL (+ coverage %).
2. **Code quality findings**: | Severity | File:line | Issue | Fix |
3. **AC scenarios**: | Scenario | Verdict | Location | Gap |
4. ✅ Correctly implemented | ❌ Missing/gaps | ⚠️ Risks/edge cases |
   🧹 Unnecessary/extra code
5. Summary + top 3 risks
6. Test verdict: ADEQUATE or GAPS
7. Fix code for Critical/High findings — copy-paste ready
8. Recommendations before merge
