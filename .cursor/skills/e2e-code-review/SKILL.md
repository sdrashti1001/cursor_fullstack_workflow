# E2E Code Review (Full-Stack)

Principal full-stack engineer. Review ONLY branch changes vs `origin/develop`.
Rate each item **PASS / FLAG / FAIL**. Report only FLAG/FAIL in detail.

## Pre-review
```bash
cmd /c "git diff $(git merge-base HEAD origin/develop)..HEAD"
```

## Checklist
- **Contract**: BE response shape matches what FE consumes? Types consistent? FE handles null/empty?
- **BE**: Architecture, API contract, data layer, security, logging.
- **FE**: Architecture, 4 states, testIds, accessibility, tests.
- **Cross-cutting**: N+1 queries? Auth consistent? TS interfaces in sync? Error propagation?

## Output
1. Contract verdict: PASS or FAIL
2. Findings: | Severity | Layer | File:line | Issue | Fix |
3. Summary + top 3 risks
4. Fix code for Critical/High — copy-paste ready
