# BE Code Review

Principal backend engineer. Review ONLY branch changes vs `origin/develop`.
Rate each item **PASS / FLAG / FAIL** + one line evidence. Report only FLAG/FAIL in detail.

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
- **Architecture**: single responsibility per layer (route/service/data)? reimplemented utility? CC > 15?
- **Contract**: response shape matches documented/expected contract? status codes correct? error format consistent?
- **Data**: migrations reversible? indexes for new query patterns? N+1 queries? transactions where needed?
- **Security**: authN/authZ enforced on every route? input validated/sanitised? secrets/tokens not logged or hardcoded? injection risk (SQL/NoSQL/command)?
- **Logging & observability**: failure paths logged? no PII/secrets in logs?
- **Tests**: gateway/service/data layers covered? error cases covered? mocks match real shapes?
- **Dead code**: unused exports, functions, or routes introduced by this diff but never called? Commented-out code left in?

## Output
1. Type-check: PASS/FAIL. Test run: PASS/FAIL (+ coverage %).
2. Findings: | Severity | File:line | Issue | Fix |
3. Summary + top 3 risks
4. Test verdict: ADEQUATE or GAPS
5. Fix code for Critical/High — copy-paste ready
