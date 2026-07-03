# FE Code Review

Principal React/TypeScript engineer. Review ONLY branch changes vs `origin/develop`.
Rate each item **PASS / FLAG / FAIL** + one line evidence. Report only FLAG/FAIL in detail.

## Pre-review
```bash
cmd /c "git diff $(git merge-base HEAD origin/develop)..HEAD"
cmd /c "npx tsc --noEmit --project tsconfig.app.json"
cmd /c "npx vitest run --pool=forks --coverage"
```
Type-check and test run are mechanical, not a judgment call — if either
fails, that's a FAIL on its own, independent of the checklist below. Don't
let a clean-looking diff override a red test run.

## Checklist
- **Architecture**: single responsibility? state level? reimplemented utility? useEffect deps? CC > 15?
- **FE**: testIds format? 4 states? submit guard? API data as-is?
- **A11y**: aria-labels? keyboard nav? focus return?
- **Tests**: AC covered? user actions? 4 states? mocks match API?
- **Security**: unsanitised HTML? tokens in localStorage? PII in props?
- **Dead code**: unused exports, functions, or components introduced by this diff but never called? Commented-out code left in?

## Output
1. Type-check: PASS/FAIL. Test run: PASS/FAIL (+ coverage %).
2. Findings: | Severity | File:line | Issue | Fix |
3. Summary + top 3 risks
4. Test verdict: ADEQUATE or GAPS
5. Fix code for Critical/High — copy-paste ready
