---
name: diagnose-ticket
description: "Use when you need to diagnose a ticket by reading the issue and the relevant code, summarizing the likely cause, and estimating fix impact. If no ticket key is provided, ask for one before continuing. Do not make code or config changes."
argument-hint: "TICKET-KEY"
user-invocable: true
---

# Diagnose Ticket

Use this skill when the user wants a quick diagnosis of a ticket without implementing a fix.

## Input handling

- If the user provides a ticket key, diagnose that ticket only.
- If the user does not provide a ticket key, ask for one before doing anything else.
- Do not guess a ticket key or search broadly unless the user explicitly asks you to find a ticket.

## Procedure

1. Pull the ticket using the ticket key.
2. Read the title, description, comments, linked issues, and any attached evidence that is available.
3. Identify the most likely code path involved from the ticket evidence, then inspect the relevant implementation and any nearby tests or configuration.
4. Verify whether the code behavior matches the ticket symptom before deciding on the diagnosis.
5. Identify the most likely cause of the issue from both the ticket evidence and the code.
6. Estimate fix impact using one of these values:
   - Low: focused changes, usually a small change in one area.
   - Medium: a new UI change or user-flow tweak.
   - High: a significant refactor.
7. Do not fix the issue, propose code changes, or edit files.
8. If the evidence is thin, say so and give the best bounded diagnosis you can from what is available.

## Output format

Return a short Markdown response with these fields:

- Ticket: the ticket key
- Likely cause: one concise sentence
- Code evidence: one concise sentence about the implementation path or behavior that supports the diagnosis
- Fix impact: Low, Medium, or High
- Notes: optional brief caveat if the evidence is incomplete

## Guardrails

- Stay diagnostic only.
- Do not implement changes.
- Do not suggest a full solution plan beyond the likely cause and impact.
- If the ticket is inaccessible, say what could not be read and stop.
