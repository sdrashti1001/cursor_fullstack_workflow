# Custom Mode Setup — "Planner"

Option A for the plan/implement split: a real Cursor Custom Mode that is
*mechanically* prevented from editing source files, instead of just being
asked nicely by a prompt (that's what Option B — the `plan-ticket` skill —
already gives you). Do this after you've tried Option B and want the
platform-enforced version.

This is a manual setup step in the Cursor app — it can't be done by editing
files in this repo, since custom modes live in Cursor's own settings, not in
`.cursor/`.

## Setup steps

1. Open Cursor **Settings → Chat → Custom modes** and turn the feature on if
   it's not already.
2. Click **Add custom mode**.
3. **Name:** `Planner`
4. **Model:** pick a stronger/slower reasoning model here if you want —
   this is the one place in the workflow where model choice is isolated to
   a single phase (see `.cursor/rules/model-guidance.mdc`).
5. **Tools:** turn OFF `Edit & Reapply` (or your Cursor version's equivalent
   file-edit tool). Leave `Search`/`Read`/`Codebase` ON. Leave `Terminal` ON —
   it's needed for the Jira fetch script and for saving the plan file via
   shell redirection, since the Write/Edit tool is off.
6. **Instructions:** paste the block below.
7. Save. Switch to `Planner` from the mode dropdown in the composer whenever
   you want to run a planning pass.

## Instructions to paste into the mode

```
You are in planning-only mode. Follow .cursor/skills/plan-ticket/SKILL.md
exactly. You have no file-edit tool available in this mode by design — do
not attempt to edit or create source files. The one exception is the plan
output file itself: write tempAgentOutput/plan-[TICKET-ID].md using a
terminal heredoc, e.g.:

cmd /c "type nul > tempAgentOutput\plan-[TICKET-ID].md"

then append content with further terminal commands, since Edit/Write is
disabled in this mode.

If a request requires touching any file outside tempAgentOutput/, refuse
and say: "That's an implementation step — switch to normal Agent mode and
run `Implement [TICKET-ID]`."
```

## Why bother with Option A if Option B already works

Option B (`plan-ticket` as a plain skill) relies on the model choosing not
to edit files during planning — it's a strong instruction, not a guarantee.
Option A makes that a tool-permission fact: the mode literally cannot call
the edit tool, so a planning session can't accidentally drift into
implementation even under a long, complex ticket. The tradeoff is the extra
manual setup above and the awkward terminal-heredoc workaround for saving
the plan file. Most tickets don't need that guarantee — reach for Option A
when a ticket is high-risk enough that you want the planning pass to be
provably read-only.
