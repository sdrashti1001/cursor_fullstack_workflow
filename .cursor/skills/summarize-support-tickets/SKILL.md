---
name: summarize-support-tickets
description: "Use when triaging unassigned ECP board tickets with the Support label to find relevant tickets, decide whether the label should stay or be removed, and recommend a priority (Highest, High, Medium, Low)."
---

# ECP Support Prioritization

Use this skill when reviewing ECP board tickets that have the Support label and no assignee, or when you need to decide whether unassigned tickets should remain in Support triage.

## Scope

This skill applies only to ECP board tickets with the Support label and no active owner (assignee is empty/unassigned). If the item is not an ECP ticket, does not involve Support triage, or already has an assignee, do not force this workflow.

## Input handling

If the user provides a specific ticket key, triage that ticket only if it is unassigned.

If the user does not provide a key, first find the relevant ECP board tickets with the Support label and no assignee, then triage the returned set.

Always constrain ticket discovery to the user-specified created-date window.

If no window is specified, ask the user for a clear value before triage (for example: "last 7 days" or a date range like "2026-07-01 to 2026-07-14"). Do not continue with an assumed date range.

Use Jira JQL issue search as the first-choice discovery method.

Do not start with Atlassian global search/Rovo search for this workflow, because access may be denied.

Recommended baseline JQL for discovery:

`project = ECP AND labels = Support AND assignee is EMPTY AND created >= -Xd AND statusCategory != Done ORDER BY created DESC`

Replace `X` with the user-specified day window, or use explicit created date bounds when the user provides a fixed date range.

When searching, focus on active, unassigned support tickets and any closely related support-log enhancement or support issue that carries the Support label.

If a ticket is assigned while triaging, exclude it from this workflow and note that it is no longer in the unassigned queue.

## What to do

1. Read the ticket summary, description, comments, and any screenshots or evidence.
2. Determine whether the issue is actually a support issue or whether it should be handled elsewhere.
3. Recommend a priority: Highest, High, Medium, or Low.
4. State whether the Support label should stay or be removed.
5. Explain the recommendation in one short, concrete paragraph.

For multiple tickets, repeat the same decision for each ticket and sort the results by priority and urgency.

For each ticket, include a one-sentence summary of what the ticket is about.

## Priority rules

Use the following guidance. Choose the highest level whose criteria are clearly met by the ticket evidence.

- Low: minor or isolated issue, limited operational impact, and a reasonable workaround exists. Use this when the problem is inconvenient but does not materially block normal customer use.
- Medium: meaningful customer impact, but not an active operational risk. Use this as the default when the issue appears real, affects normal usage, and there is not enough evidence of broad impact, a hard block, or severe urgency.
- High: a customer is blocked from completing a core workflow, or the issue creates a strong operational burden that likely needs prompt action. Use this when impact is serious even if the number of affected customers is still unclear.
- Highest: severe incident, widespread service impact, or a critical issue affecting multiple customers, sensitive data, or essential service availability. Use this only when the ticket shows broad or critical impact that requires immediate attention.

If the ticket lacks enough evidence to justify High or Highest, do not infer severity. Default to Medium unless the ticket clearly fits Low.

## When to remove the Support label

Remove the Support label when the ticket is not a genuine support issue, for example:

- It is a feature request or enhancement rather than a problem report.
- It is clearly out of scope for ECP support handling.

Keep the Support label when the ticket describes a customer-reported defect, incident, data issue, access issue, or other support-owned problem on the ECP board.

## Decision criteria

Prioritize by combining these signals:

- Customer impact and urgency
- Whether a core workflow is blocked
- Number of customers affected
- Whether there is a workaround
- Whether the issue is isolated or widespread
- Whether there is a data, privacy, or security concern

If the evidence is mixed, default to Medium unless the ticket clearly meets High or Highest criteria.

## Output format

Return a readable Markdown list with one item per unassigned ticket. Do not use a table.

Use the same structure for every ticket:

```md
- ECP-1234
	Priority: High
	Summary: Parent cannot complete payment because the confirmation step fails.
	Support label: Keep
	Rationale: This blocks a core workflow and there is no clear workaround, so it should be treated as a prompt support priority.
```

Formatting rules:

- Return only the ticket list unless the user explicitly asks for extra commentary.
- Start each ticket with a top-level bullet containing the ticket key only.
- Put each field on its own indented line in this exact order: Priority, Summary, Support label, Rationale.
- Keep the summary to one sentence.
- Keep the rationale to one or two sentences and make it specific to impact, urgency, scope, and workaround evidence.
- Use `Keep` or `Remove` for the Support label decision.
- Use exactly one of `Highest`, `High`, `Medium`, or `Low` for priority.
- If only one ticket is triaged, still return a one-item list.

For multiple tickets, sort the list from highest priority to lowest priority. Within the same priority, put the more urgent or broadly impactful ticket first.

## Quality check

Before finishing, verify that the recommendation is:

- Consistent with the impact described in the ticket
- Limited to the ECP Support scope
- Specific enough that another reviewer could apply the same decision
