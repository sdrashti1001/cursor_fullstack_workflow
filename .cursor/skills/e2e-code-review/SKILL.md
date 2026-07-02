# E2E Code Review (Full-Stack)

Principal full-stack engineer. Review ONLY branch changes vs `origin/develop`.
Rate each item **PASS / FLAG / FAIL**. Report only FLAG/FAIL in detail.

## Pre-review
```bash
cmd /c "git diff $(git merge-base HEAD origin/develop)..HEAD"
cmd /c "npx tsc --noEmit --project tsconfig.app.json"
cmd /c "npm run testCi"
```
Type-check and test run are mechanical, not a judgment call — if either
fails, that's a FAIL on its own, independent of the checklist below. Don't
let a clean-looking diff override a red test run.

## Checklist
- **Contract**: BE response shape matches what FE consumes? Types consistent? FE handles null/empty?
- **BE**: Architecture, API contract, data layer, security, logging.
- **FE**: Architecture, 4 states, testIds, accessibility, tests.
- **Cross-cutting**: N+1 queries? Auth consistent? TS interfaces in sync? Error propagation?
- **Dead code**: unused exports, functions, or components introduced by this diff but never called? Commented-out code left in?

## Output
1. Type-check: PASS/FAIL. Test run: PASS/FAIL (+ coverage %).
2. Contract verdict: PASS or FAIL
3. Findings: | Severity | Layer | File:line | Issue | Fix |
4. Summary + top 3 risks
5. Fix code for Critical/High — copy-paste ready
