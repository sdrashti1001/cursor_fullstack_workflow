---
name: jira-test-scenarios
description: >-
  Generates manual QA test scenarios from Jira ECP ticket descriptions, exports
  them as CSV under FrameWorkWithAgent/tests/csvfiles, and runs a functional
  coverage review pass. Use when the user supplies a Jira ticket (ECP-xxx),
  asks for test cases from Jira, test scenarios for a ticket, or names this
  skill.
disable-model-invocation: true
---

# Jira test scenarios (QA CSV)

## Role

You are an expert QA Test Engineer AI Agent working with multiple review agents.

**Task:** Generate complete, high-quality test scenarios for the given feature.

**Input shape:**

- **Name:** `ECP-xxx` (issue key)
- **Feature description:** full Jira ticket body (summary, description, acceptance criteria, comments if relevant)

## Required input

The user supplies **one or more** Jira issue keys or URLs, for example:

- `ECP-319`
- `https://ngiris.atlassian.net/browse/ECP-319`

Normalize keys to uppercase `ECP-\d+`. Dedupe duplicates.

If no ticket is provided, **ask once** for the issue key before proceeding.

## Step 0 — Fetch Jira ticket content

Pull **summary**, **description**, and **acceptance criteria** (and linked subtasks only when they clarify scope) before writing scenarios.

Use the **[Atlassian CLI (`acli`)](https://developer.atlassian.com/cloud/acli/guides/how-to-get-started/)** — not raw REST/curl.

**Site:** `ngiris.atlassian.net`

### Prerequisites

Assume the acli client is installed. Tell the user to install the acli client if it isn't. Check the authentication. If the user is not authenticated, tell the user to authenticate with acli. Do not attempt to install or authenticate yourself.

```bash
# Check existing login
acli jira auth status
```

### Fetch order (try in sequence; stop when you have a usable description)

1. **Atlassian CLI** (preferred):

```bash
acli jira workitem view ECP-XXX --json \
  --fields summary,description,status,issuetype,priority,comment
```

- For maximum field coverage: `--fields '*navigable'` or `--fields '*all'` (slower; use if acceptance criteria live in custom fields).
- Parse JSON output; convert ADF/rich-text description fields to plain text for analysis.
- If the command errors with auth failures, run `acli jira auth login` (see above) and retry once.

2. Tell the user the issue cannot be found if you cannot load it.

### Context enrichment (optional, do not block)

When the ticket references implementation areas, skim related code or docs in this repo (`api/`, `portal/`, `parent-portal/`, etc.) to make steps and test data concrete. Do not invent requirements not present in the ticket.

Record in the final report: **issue key**, **summary**, and **fetch method used** (`acli`, `browse`, or `user paste`).

## Step 1 — Analyse and plan

1. Extract functional requirements, business rules, roles, and out-of-scope items from the ticket.
2. Produce a short **test plan** (bullets): scope, modules, risk areas, assumptions.
3. Map each requirement to at least one planned scenario ID before drafting rows.

## Step 2 — Generate test scenarios

Cover all of the following where applicable:

- Positive scenarios
- Negative scenarios
- Edge cases
- Boundary conditions
- Validation scenarios
- Error handling scenarios

### Per-scenario fields (required)

| Field | Rules |
|-------|--------|
| **Test Scenario ID** | Unique; prefix with issue key, e.g. `ECP-319-TS-001` |
| **Test Scenario Title** | Short, action-oriented |
| **Scenario Type** | `Positive`, `Negative`, or `Edge` (use `Edge` for boundary/edge/validation/error cases) |
| **Preconditions** | System state, roles, data setup |
| **Test Steps** | Numbered steps (`1. … 2. …`); one cell in CSV |
| **Expected Result** | Observable, verifiable outcome |
| **Priority** | `High`, `Medium`, or `Low` |
| **Module/Feature Area** | e.g. Portal, API, Parent Portal |
| **Required Test Data** | Accounts, records, config; use `N/A` when none |

### Quality bar

- No duplicate scenarios (same intent/steps).
- Clear, concise wording; industry-standard QA practices.
- Reusable, maintainable scenarios.
- Complete requirement coverage from the ticket.

Target **at least** 8 scenarios for simple features and proportionally more for complex tickets; include **multiple** negative and edge cases.

## Step 3 — Export CSV

1. **Read the canonical header row** from [csv-format.md](csv-format.md). If `FrameWorkWithAgent/tests/csvfiles/Post_Migration_Actions_Test_Cases.csv` exists in the workspace, use **its exact header row** (overrides the default in `csv-format.md`).
2. Write UTF-8 CSV with comma separators. Quote fields that contain commas, quotes, or newlines; escape `"` as `""`.
3. **Output path:** `FrameWorkWithAgent/tests/csvfiles/{Feature_Name}_Test_Cases.csv`
   - Derive `{Feature_Name}` from the ticket summary: PascalCase words joined by underscores (e.g. `Post Migration Actions` → `Post_Migration_Actions`).
   - If the file already exists, **do not overwrite** without confirming; default to `{Feature_Name}_Test_Cases_{YYYY-MM-DD}.csv` or ask once.
4. Create `FrameWorkWithAgent/tests/csvfiles/` if missing.

## Step 4 — Agent 2: Functional Coverage Reviewer

Before delivering, perform an internal review **as Agent 2**:

- Verify all functional requirements from the ticket are covered.
- Verify sufficient negative and edge scenarios exist.
- Verify test data completeness and correctness.
- Check clarity, duplication, ambiguity, and completeness.

If gaps are found, **add or revise scenarios** and update the CSV before final output.

## Step 5 — Final report to the user

After review, include in the chat response (in addition to writing the CSV file):

### Coverage Summary

- Total scenarios by type (Positive / Negative / Edge)
- Requirements mapped vs. open assumptions

### Missing Scenarios

- List any gaps still accepted as out-of-scope or needing product clarification; if none, state “None identified.”

### Review Feedback

- Bullet list from Agent 2 (concise)

### Final Approval Status

- `Approved` — CSV written, review passed, no blocking gaps
- `Approved with caveats` — CSV written but assumptions or missing info documented
- `Blocked` — could not fetch ticket or insufficient description; no CSV (or partial draft only if user asked)

Also provide:

- Path to the created CSV file
- Link to Jira: `https://ngiris.atlassian.net/browse/ECP-XXX`

## Failure template

Use when the ticket cannot be loaded and the user has not pasted content:

```markdown
## Jira test scenarios — blocked

### Issue
- Key: ECP-XXX
- Fetch attempts: acli / browse / user paste

### What went wrong
- One short paragraph.

### Next step
- Install and authenticate [Atlassian CLI](https://developer.atlassian.com/cloud/acli/guides/how-to-get-started/): `acli jira auth login --web` or API token login for `ngiris.atlassian.net`, then re-run; or paste the ticket description.
```

## Operational notes

- This skill produces **manual QA scenario CSVs**, not Pest/PHPUnit automated tests (use `pest-testing` for code tests).
- Do not commit CSV files unless the user asks.
- For multiple tickets in one request, produce **one CSV per ticket** unless the user asks for a combined file.
