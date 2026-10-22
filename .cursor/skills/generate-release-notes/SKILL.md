---
name: generate-release-notes
description: "Use when creating weekly release notes from Jira tickets in Done during a specified number of days, with one-line Feature or Bug Fix summaries."
---

# Weekly Release Notes

Use this skill when the user asks for release notes that summarize Jira tickets in Done from the requested number of days.

## Scope

This skill is for Jira-based summaries only.

Only include tickets whose status is Done.

Do not include tickets outside the requested day window.

## Input handling

If the user gives a number of days, use that exact value.

If no day window is provided, use the last 7 days ending today.

If a Jira project, board, app, or product scope is provided, include it in the query.

If no scope is provided, query across accessible Jira projects.

## Discovery method

Use Jira search only.

Build a JQL query that always includes Done status and the time window.

Base pattern:

`status = Done AND resolved >= -<days>d ORDER BY resolved DESC`

When scope is provided, append the relevant filter, for example:

`project = ABC AND status = Done AND resolved >= -<days>d ORDER BY resolved DESC`

Use Jira issue type to classify output as:

- Feature: Story, Feature, Epic, Task, Improvement (or equivalent non-bug delivery types)
- Bug Fix: Bug, Defect, Regression, Incident (or equivalent bug types)

## What to do

1. Determine the day window from user input (default 7).
2. Query Jira for tickets in Done resolved within that window.
3. For each ticket, determine if it is Feature or Bug Fix from issue type.
4. Write exactly one line per ticket.
5. Keep wording concise and customer-readable.

## Customer writing rules

Use plain language.

Avoid internal implementation details.

Summaries must be one line only per ticket.

Do not speculate beyond ticket summary/description.

## Output format

Return Markdown in this order:

1. Title with date range.
2. One flat bullet list of tickets.

Each bullet must be one line and include:

- Ticket key
- Type label: `Feature` or `Bug Fix`
- Short summary

Format:

`- ABC-123 | Feature | Parents can now update contact preferences from the profile page.`

If no tickets are found, return:

`No Done tickets found in the selected period.`

## Quality check

Before finishing, verify that:

- Every ticket is in Done.
- Every ticket is within the requested day window.
- Every line is a one-line summary.
- Every line is explicitly labeled `Feature` or `Bug Fix`.
