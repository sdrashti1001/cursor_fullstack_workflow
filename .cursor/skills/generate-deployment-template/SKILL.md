---
name: generate-deployment-template
description: "Use when you need to read ECP board tickets in Awaiting Staging Deployment and output a filled deployment template for Confluence, using N/A for any missing information."
---

# Awaiting Staging Deployment Table

Use this skill when the user asks for ECP board tickets that are ready for staging deployment and wants details presented in the deployment template format.

## Objective

- Find ECP tickets in Awaiting Staging Deployment (plus any extra keys the user names).
- For each ticket, determine **what has changed** — not just what the bug/feature is.
- Output a single deployment template with all returned tickets filled in, as formatted text ready to paste into Confluence.
- If any field value is missing, output `N/A`.

## Discovery rules

1. Use Jira JQL issue search as the primary and preferred route.
2. Keep scope to the ECP board using `project = ECP`.
3. Run this primary JQL first:

`project = ECP AND status = "Awaiting Staging Deployment" ORDER BY updated DESC`

4. If the primary query returns no issues, run this secondary JQL:

`project = ECP AND labels = "Awaiting Staging Deployment" ORDER BY updated DESC`

5. Use `maxResults: 10` unless the user asks for more.
6. Do not request issue counts.
7. Do not use Rovo search for this workflow unless the user explicitly asks for it.
8. If the user names additional ticket keys (e.g. `ECP-552`), include them even when not in Awaiting Staging Deployment. Deduplicate keys.

## Required Jira fields

Request these fields in JQL / `getJiraIssue` results:

- key
- summary
- status
- priority
- assignee
- reporter
- created
- updated
- labels
- description
- comment (include `comment` in the fields array to fetch issue comments)

## Determining what changed (per ticket)

For each ticket `ECP-{N}`, build the **Notes** column as deployment-oriented change bullets. Use this order of precedence:

### 1. Jira comments (preferred when present)

Read comments (newest first). Look for explicit deployment or change notes, for example:

- Comments from the assignee or reviewer describing what was done
- Phrases like "changes", "deploy notes", "this release", "merged", "fix:", "added", "removed"
- QA sign-off comments summarising behaviour changes

When a comment clearly states what changed, prefer that wording (lightly edited for clarity). Do not copy long comment threads verbatim.

### 2. Git diff vs `staging`

Run from the **repository root** after `git fetch --all --prune`.

Branch conventions (same as package deployment):

| Branch | Use |
|--------|-----|
| `REVIEWED-ECP-{N}` | Preferred — reviewed, PR-approved work |
| `ECP-{N}` | Fallback when no reviewed branch exists |

Commands (try reviewed branch first):

```bash
git diff --stat staging...REVIEWED-ECP-{N}
git diff staging...REVIEWED-ECP-{N} -- api portal pupil-portal parent-portal teacher-app
```

If `REVIEWED-ECP-{N}` does not exist locally or on the remote after fetch, repeat with `ECP-{N}`.

From the diff, summarise **what changed for deployers**, not file lists. Focus on:

- Behaviour fixes ("resolves …", "restores …")
- New jobs, queues, or async processing
- API endpoint or query changes
- Migrations, config, env, or scheduler changes
- Front-end user-visible changes
- One-off Artisan commands or scripts that must be run

Keep each bullet to one line. Aim for 1–4 bullets per ticket.

### 3. Fallback when git and comments are thin

If no branch exists and comments do not describe the change:

- Write at least one bullet in the form: `Resolves issue where [concise problem from summary/description].`
- Do not invent implementation detail. Use `N/A` only if even the problem cannot be stated.

### Guardrails for change bullets

- Describe **what changed**, not the original support ticket narrative.
- Do not list raw file paths or `git diff --stat` output in the template.
- Do not invent migrations, env vars, or scripts unless the diff or comments show them.
- When diff shows migrations, config, or manual commands, add a bullet and reflect that in the Impact Rating section.

## Output format

Return the filled template as **formatted text in the chat response** — do not wrap it in a fenced code block. The user copies it directly into Confluence, which renders markdown tables and links.

Use this template structure:

# Deployment Template

**Date:** [Date] | **Time:** 10:00 | **Platform:** School Spider

## What

| Ticket | Notes |
|---|---|
| [https://ngiris.atlassian.net/browse/ECP-1234](https://ngiris.atlassian.net/browse/ECP-1234) | * Resolves issue where payment callbacks time out.<br>* Added retry handling for failed callback processing. |
| [https://ngiris.atlassian.net/browse/ECP-5678](https://ngiris.atlassian.net/browse/ECP-5678) | * Fixes export voucher zip download failing on large exports.<br>* Moves voucher report generation to a queue to prevent timeouts. |

## Impact Rating

| Check | Change |
|---|---|
| Severity | LOW / MEDIUM / HIGH |
| Risk notes | [risk notes] |
| Deployment Method | Blue/Green |
| DB Migration Required | [Yes/No/N/A] |
| Scripts Required | [Yes/No/N/A] |
| Env Changes | [Yes/No/N/A] |

## Post-Release Checks

| Check | Change |
|---|---|
| Key user journeys smoke tested | [ ] Completed by ... |
| Error rates checked | [ ] Completed by ... |
| Latency Checked | [ ] Completed by ... |
| Throughput Checked | [ ] Completed by ... |
| Other (Please detail) | N/A |

When multiple tickets are returned, keep all tickets inside the same single deployment template in the `What` table, one row per ticket, in `updated DESC` order.

### Ticket column

- Always use a markdown hyperlink with the **full Jira URL as the link text** (not the ticket key alone), so Confluence renders a smart link to Jira:
  - `[https://ngiris.atlassian.net/browse/ECP-{N}](https://ngiris.atlassian.net/browse/ECP-{N})`
- Base URL is always `https://ngiris.atlassian.net/browse/`

### Notes column

- Use markdown bullet lines prefixed with `* ` (asterisk + space).
- Separate bullets inside the table cell with `<br>` so they render on separate lines.
- First bullet should usually state the user-facing fix or feature.
- Subsequent bullets should state implementation or operational changes (queue, migration, config, script, etc.) when known from comments or git diff.

## Field mapping

- Date: use the current date unless the user provides a deployment date.
- What > Ticket: hyperlinked full Jira URL (see above).
- What > Notes: change bullets from the **Determining what changed** section — not summary + description.
- Severity mapping from Jira priority:
	- `Sev 1`, `Sev 2`, `Highest`, `High` -> `HIGH`
	- `Sev 3`, `Medium` -> `MEDIUM`
	- `Sev 4`, `Low`, `Lowest` -> `LOW`
	- Unknown priority -> `MEDIUM`
- Severity (template-level): use the highest severity across all included tickets.
- Risk notes: one concise aggregate risk summary across all tickets, informed by git diffs where available (migrations, bulk data changes, auth/payments, parent-facing apps, export pipelines). If unclear use `N/A`.
- Deployment Method: always `Blue/Green`.
- DB Migration Required / Scripts Required / Env Changes: mark `Yes` when any included ticket's diff or comments explicitly require it; mark `No` when all tickets clearly do not; otherwise `N/A`.

## Missing information handling

- Never leave a template field empty.
- If a value is missing, null, unavailable, or cannot be inferred safely, write `N/A`.
- Notes must still contain at least one bullet where the ticket problem is known; reserve `N/A` for the whole Notes cell only when nothing can be stated.

## Behavior notes

- If no matching tickets are found after the primary and secondary JQL queries (and no extra keys were requested), return: `No ECP tickets found in Awaiting Staging Deployment.`
- Do not invent values.
- Sort tickets by `updated` descending before rendering the single template.
- Return the filled template as plain formatted text in the response — never inside a fenced code block.
