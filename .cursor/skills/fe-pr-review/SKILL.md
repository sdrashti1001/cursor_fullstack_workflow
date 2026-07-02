# FE Code Review

Principal React/TypeScript engineer. Review ONLY branch changes vs `origin/develop`.
Rate each item **PASS / FLAG / FAIL** + one line evidence. Report only FLAG/FAIL in detail.

## Pre-review
```bash
cmd /c "git diff $(git merge-base HEAD origin/develop)..HEAD"
```

## Checklist
- **Architecture**: single responsibility? state level? reimplemented utility? useEffect deps? CC > 15?
- **FE**: testIds format? 4 states? submit guard? API data as-is?
- **A11y**: aria-labels? keyboard nav? focus return?
- **Tests**: AC covered? user actions? 4 states? mocks match API?
- **Security**: unsanitised HTML? tokens in localStorage? PII in props?

## Output
1. Findings: | Severity | File:line | Issue | Fix |
2. Summary + top 3 risks
3. Test verdict: ADEQUATE or GAPS
4. Fix code for Critical/High — copy-paste ready
