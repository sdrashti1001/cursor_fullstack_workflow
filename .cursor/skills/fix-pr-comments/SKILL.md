# Fix PR Comments · Address Review Feedback

Entry point: `Fix PR Comments [TICKET-ID]` (or `fix pr comments`), with the
reviewer's comments pasted alongside. Senior React/TypeScript developer
fast path for addressing PR review comments directly — does not require a
prior `Plan` pass. Do NOT assume comments are correct — analyse each first.

If `tempAgentOutput/ticket-context-[TICKET-ID].md` exists, read it for
acceptance criteria and constraints so fixes don't violate them. If it
doesn't exist, proceed without it — this skill doesn't require ticket
context to run.

---

## Step 1 — Classify every comment

| Comment | File | Verdict (VALID/PARTIAL/FALSE_POSITIVE/OUT_OF_SCOPE) | Reason |

Do NOT implement until all comments are classified.

---

## Step 2 — Impact analysis (accepted only)

Trace data flow for each fix. Find consumers. Note regression risk.

---

## Step 3 — Implement

One minimal change per accepted fix. Check: patterns, testIds
(`[feature]-[component]-[element]`), 4 states (loading, error, empty,
success), shared component consumers.

---

## Step 4 — Complexity check (before self-review)

Run a Sonar cognitive-complexity scan (`sonar_scan` tool, or the project's
`sonar-scanner`/lint script) on changed files. Any function or component at
or above **cognitive complexity 15** must be refactored — extract branches
into named helper functions above the parent — before moving on.

---

## Step 5 — Run & verify

```bash
cmd /c "npx tsc --noEmit --project tsconfig.app.json"
cmd /c "npx vitest run --pool=forks --coverage"
```
Run changed/related tests first; fix failures.

---

## Step 6 — Self-review

Report only **FLAG** and **FAIL** items with one line of evidence each.
Check: Correctness, Quality, Robustness, Accessibility (aria-labels,
keyboard nav, focus return), CC ≤ 15, Hygiene (no console.log,
commented-out code, TODOs, secrets).

**Fix all FAILs and FLAGs before finishing.**

---

## Step 7 — Summary

Save to `tempAgentOutput/implement-[TICKET-ID].md`:
- ACCEPTED: | Comment | Files | Risk |
- REJECTED: | Comment | Verdict | Reason |

---

## Step 8 — Loop closure

- Re-check the ticket's acceptance criteria still hold after the fixes.
- For each ACCEPTED comment, note the file:line so the reviewer's thread
  can be resolved once the fix is pushed.
- Flag any comment that surfaced a pattern worth reviewing project-wide
  (not just this PR).

---

## Step 9 — Git (none)

No git commands of any kind — no staging, commit, or push. Leave the
working tree exactly as the file edits produced it; committing and pushing
are done manually by the user.

---

## Step 10 — Retrospective

Three actionable takeaways (one line each). If a takeaway is a reusable
pattern (not ticket-specific), append it to `.cursor/rules/learnings.mdc`.
