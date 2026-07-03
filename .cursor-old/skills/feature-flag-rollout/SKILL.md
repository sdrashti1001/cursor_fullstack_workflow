# Feature Flag Rollout

Orthogonal to layer/work-type classification — use this alongside whichever
skill `solve-ticket` selected (fe/be/e2e × bugfix/new-feature) whenever the
ticket says "behind a flag", "feature flag", "rollout", "gate", or "kill
switch". This skill covers the flag-specific parts only; the underlying
feature/bugfix work still follows its own skill's steps.

## When adding a new flag

### Step 1 — Define the flag contract
- **Name**: exact flag key as it will exist in the flag provider.
- **Default state**: OFF unless the ticket says otherwise.
- **Scope**: global / per-org / per-user — confirm before implementing.
- **Both branches must be real code paths** — do not stub the OFF branch as
  a TODO. The OFF branch is what's currently live in production; treat it
  with the same care as the ON branch.

### Step 2 — Implement both branches
- Check the flag as close to the entry point as sensibly possible (route,
  top-level component) rather than scattering checks through shared
  utilities — a flag buried three layers deep is one nobody remembers to
  remove later.
- Never let the flag check leak into shared/reused code paths that both
  branches depend on — that reintroduces the coupling the flag was meant to
  isolate.

### Step 3 — Test both states explicitly
- One test suite run with the flag ON, one with it OFF. Do not assume
  symmetry — the OFF path is a regression risk, not a formality.
- If the ticket says "existing flow must be unaffected when OFF", that's a
  literal acceptance criterion — write a test that would fail if the OFF
  path changed at all.

### Step 4 — Note the cleanup debt
In the PR description, state explicitly: "Flag `[name]` — remove after
[condition: e.g. 100% rollout confirmed / by DATE]." This is not optional —
an un-tracked flag is technical debt that never gets removed.

## When removing a flag (post-rollout cleanup)

### Step 1 — Confirm it's safe to remove
- Confirm the flag is at 100% (or fully killed) in the flag provider, not
  just "probably fine" — ask if uncertain.

### Step 2 — Delete the losing branch, not just the check
- Remove the OFF (or ON, whichever lost) branch's code entirely, not just
  the `if (flag)` wrapper — dead branches left "just in case" are exactly
  the debt this cleanup exists to remove.
- Remove the flag from the provider/config once no code references it.

### Step 3 — Regression tests
- Run the full suite for the surviving path. Delete tests that only existed
  for the removed branch.

## Retrospective
One line: did this flag's scope/naming/cleanup note match this skill's
expectations? If not, append the gap to `.cursor/rules/learnings.mdc`.
