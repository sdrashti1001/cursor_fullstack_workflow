---
name: generate-sprint-digest
description: "Use when summarizing active sprint work in a short, easy-to-digest format with a paragraph overview plus ticket keys and one-line summaries."
---

# ECP Active Sprint Digest

Use this skill when the user wants a quick update on what is currently being worked on in active sprint(s).

## Scope

This skill focuses on non-subtask issues in active sprint(s) only.

It is intended for concise stakeholder updates, not deep technical analysis.

If there are no active sprints, return a short note saying no active sprint was found.

## Input handling

If the user provides a project, board, or team scope, use that scope.

If no scope is provided, default to ECP.

If multiple active sprints are found, include all of them and keep the response compact.

## Discovery method

Use Jira JQL issue search as the first-choice discovery method.

Do not start with Atlassian global search/Rovo search for this workflow.

Recommended baseline JQL:

`project = ECP AND sprint in openSprints() AND issuetype NOT IN subTaskIssueTypes() AND statusCategory != Done ORDER BY issuetype ASC, priority DESC, updated DESC`

If the user gives a different project key, replace `ECP` accordingly.

Optional expanded context query:

`project = ECP AND sprint in openSprints() AND issuetype NOT IN subTaskIssueTypes() ORDER BY issuetype ASC, statusCategory ASC, priority DESC, updated DESC`

## What to do

1. Find issues in active sprint(s).
2. Read each issue key, summary, status, and issue type.
3. Write one short paragraph (2 to 4 sentences) explaining current work themes.
4. Group results by issue type.
5. Provide ticket lists under each type with one-line summaries.

## Writing rules

Use plain, non-technical language where possible.

Keep the paragraph short and easy to digest.

Use present tense to describe ongoing work.

Avoid large blocks of text and avoid speculation.

## Output format

Return Markdown in this order:

1. Heading with sprint context.
2. Short paragraph describing what is being worked on.
3. Grouped ticket lists by issue type (for example: Bug, Story, Task).

Do not include subtasks in any section.

Each ticket item must include:

- Ticket key
- Short summary (one sentence)

Each issue-type section should only include tickets of that type.

Example:

- ECP-123: Improving parent evening booking reliability.
- ECP-456: Fixing communications sorting consistency.

## Quality check

Before finishing, verify that:

- All included items are from active sprint(s).
- Subtasks are excluded.
- The paragraph is short, clear, and digestible.
- Tickets are grouped correctly by issue type.
- Every listed item includes a ticket key and short summary.
- The final output is readable for non-technical stakeholders.
