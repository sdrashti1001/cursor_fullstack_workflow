# CSV format for Jira test scenarios

## Canonical headers (default)

Use this exact header row unless an existing template file in the repo defines a different row:

```text
Test Scenario ID,Test Scenario Title,Scenario Type,Preconditions,Test Steps,Expected Result,Priority,Module/Feature Area,Required Test Data
```

## Template override

If this file exists, read the **first line only** and use it as the header row for all new exports:

`FrameWorkWithAgent/tests/csvfiles/Post_Migration_Actions_Test_Cases.csv`

## Field rules

| Column | Notes |
|--------|--------|
| Test Scenario ID | Unique per file; include issue key |
| Test Scenario Title | ≤ 120 chars when possible |
| Scenario Type | Exactly: `Positive`, `Negative`, or `Edge` |
| Preconditions | Semicolon-separated if multiple |
| Test Steps | Numbered list in one cell |
| Expected Result | Single verifiable outcome |
| Priority | `High`, `Medium`, or `Low` |
| Module/Feature Area | Product surface under test |
| Required Test Data | Concrete values; `N/A` if none |

## Example row

```csv
Test Scenario ID,Test Scenario Title,Scenario Type,Preconditions,Test Steps,Expected Result,Priority,Module/Feature Area,Required Test Data
ECP-319-TS-001,Admin can trigger post-migration action,Positive,User logged in as school admin with migration completed,"1. Open Post Migration Actions
2. Select valid action
3. Confirm execution",Action completes successfully and success message is shown,High,Portal,Admin account on school with completed migration
```

## File naming

`FrameWorkWithAgent/tests/csvfiles/{Feature_Name}_Test_Cases.csv`

Example: `Post_Migration_Actions_Test_Cases.csv`
