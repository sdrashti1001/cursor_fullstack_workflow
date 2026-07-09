# PR Review · Diff-Only Security & Quality Review

Entry point: `PR Review` (optionally `PR Review [PR-NUMBER]` or a pasted PR
URL). Run in Ask mode, model Composer (not max mode — avoid Claude due to
the Cursor sandbox bug). Before running: ensure `dev` and `main` are up to
date, and switch to the branch backing the PR.

Senior Software Engineer & Security Researcher review of the current
branch's changeset as it would appear in a GitHub PR. Execute all
background tool checks instantly, without pausing for user input.

**CRITICAL CONSTRAINT**: review ONLY the specific lines added, modified, or
deleted in the diff. Do not comment on pre-existing code, architectural
patterns outside the diff, or unchanged context lines. If a file is open,
ignore any lines not explicitly touched by this PR.

---

## Setup

1. **Base branch**: if a PR URL/number is provided, use `gh pr view --json
   baseRefName` to get the PR's actual base instantly. Otherwise fall back
   to `main`, then `master`, then `develop`. Prefer `origin/<base>...HEAD`
   when the local base may be stale.
2. **Changeset**: run `git diff <base>...HEAD` (three-dot). If that fails,
   try `git diff origin/<base>...HEAD`.
3. **Optional inventory**: run `git diff --name-only <base>...HEAD` before
   the deep read.

---

## Fast filter

- **Deep-review**: application source, tests, infrastructure-as-code.
- **Skip deep-read**: markdown/docs, plain logs, lockfiles, generated
  artifacts, IDE folders (`.vscode`, `.idea`) — still list these paths in
  the inventory.
- Always list skipped paths that are tests/config/security-relevant, and
  flag "manual review required" when coverage or risk depends on them.

## Large diff (>1000 changed lines in reviewed files)

Focus on entry points (handlers, routes, APIs, CLI commands), security
boundaries (auth, validation, sanitization, secrets), data mutation, and
core business logic. Note `deferred: N files` with a one-line reason each.

---

## Authoritative standards

Do not restate — apply directly:
- All workspace/project rules already loaded (`.cursor/rules`, `CLAUDE.md`,
  `.github/instructions`, `AGENTS.md`, linter/formatter configs).
- PR template / CONTRIBUTING if present in the repo.
- Flag only violations or gaps not already enforced by CI; mention CI only
  when a failure signals a deeper design/security issue.

## Context

- **Framework_context**: infer from repo if not otherwise known.
- **Utilities_available**: discover via codebase search before flagging
  duplication — do not assume a shared utility doesn't exist.

---

## Core directives

- **Precision**: cite path and line numbers in the current file (read the
  file when needed — the diff hunk alone is not sufficient).
- **Actionability**:
  - **High priority** → label `Fix (HIGH)`, complete copy-paste-ready code
    block. High = security, authz, secrets, data loss/corruption, breaking
    contracts, production config.
  - **Low priority** → label `Fix (Low)`, minimal change guidance (snippet
    or "change X → Y"). Low = readability, non-blocking DRY, naming,
    non-security refactors.
- **Agent mode** (when enabled): apply `Fix (HIGH)` patches and run
  project-standard verification. **In Ask mode: output fixes only, do not
  apply.**
- **Conflict resolution**: competing approaches in code/comments → prefer
  security, then loaded house rules, then more robust architecture. State
  the override explicitly.

## PR thread integration

Only if a PR URL/number is provided: load review comments via `gh` (or a
pasted thread). Otherwise Comment Status is `None`.

## Test coverage validation

- New/changed public API, function, module, or error branch → expect a
  test in the diff or existing suite; search the repo if not in the diff.
- Flag: `Missing Test` | `Brittle Test` | `Insufficient Coverage`
  (security/auth/mutation happy-path-only) | `Manual Review Required` (test
  file skipped by filter but risk remains).
- If test files were filter-skipped, still flag coverage gaps from the
  inventory.

## Justification validation

- Scan TODO/FIXME and PR/commit text in the changeset context.
- **Justification Failure**: deferral without ticket/owner/plan ("later",
  "temporary", "works on my machine", etc.) — propose a concrete fix, not
  only a complaint.
- Legitimate tracked TODOs (ticket id, owner, removal condition) → do not
  fail.

## Verification (Agent mode only, when tools allowed — skip in Ask mode)

Run project-standard typecheck/lint/test commands from loaded rules or
package scripts on touched areas; do not duplicate full CI — use results
to corroborate or escalate findings.

---

## Output — single response, this exact structure

```markdown
## Summary
Max 2 sentences: PR intent for non-technical stakeholders.

## Priority Table
| High Priority | Low Priority |
| :---: | :---: |
| [count of Fix (HIGH)] | [count of Fix (Low)] |

## Findings
Loc: [file path] : [line number]
Comment Status: [None | "[Author] [Summary]" → VALID | INVALID → [reason] + fix | CONFLICT → "[A] vs [B]" → Overriding [X] because [reason]]
Issue: [technical detail] | Risk: [business impact] (optional: Justification Failure)
Test Status: [Covered | Missing Test → … | Brittle Test → … | Insufficient Coverage → … | Manual Review Required → …]

Fix (HIGH)
[complete fixed code]

Fix (Low)
[minimal guidance]

## Residual risks
- [Bullets only if something could not be verified from diff/rules/tests — e.g. integration env, perf, threat model]
```

Tone: friendly, direct, imperative, no corporate fluff.
