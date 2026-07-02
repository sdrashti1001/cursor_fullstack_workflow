# FE Task-Level Acceptance Review

Review implementation against the ticket's Gherkin acceptance criteria.

## Pre-review
```bash
cmd /c "npx tsc --noEmit --project tsconfig.app.json"
cmd /c "npx vitest run --pool=forks --coverage"
```
Type-check and test run are mechanical, not a judgment call — if either
fails, note it up front; it doesn't block the AC review below but it's a
blocker for merge regardless of AC status.

## AC scenarios

For each Gherkin scenario in the ticket:
- **Satisfied** / **Partially Satisfied** / **Not Satisfied**
- Relevant code location
- Missing functionality
- Tests needed to verify

## Report

1. **Implementation Verification**
   - Verify that all commits correctly implement the required functionality for the ticket.
   - Check whether the implementation aligns with the expected behavior and requirements.

2. **Gap Analysis**
   - Identify any missing functionality, incomplete implementation, or deviations from the expected behavior.
   - Highlight any unnecessary or extra code that has been introduced but is not required (dead code, unused exports, commented-out code).

3. **Feature Flag Validation** (only if the ticket touches a flag — see `.cursor/skills/feature-flag-rollout/SKILL.md`)
   - **Flag OFF:** existing behavior is unchanged — no regressions.
   - **Flag ON:** new behavior works correctly, and all other existing flows the flag doesn't target still function without regressions.

4. **Regression Analysis**
   - If this change reuses existing components or logic, verify those shared changes don't introduce regressions or unintended side effects elsewhere in the app.

5. **Final Report** — comprehensive summary including:
   - ✅ Correctly implemented changes
   - ❌ Missing functionality or gaps
   - ⚠️ Potential risks or edge cases
   - 🧹 Unnecessary or extra code
   - 💡 Recommendations for improvements before the branch is merged
