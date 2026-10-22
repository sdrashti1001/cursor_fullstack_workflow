---
name: package-deployment
description: >-
  Builds a release branch from staging by merging REVIEWED-ECP-* branches for
  Jira tickets, validates each reviewed branch against staging and Jira ticket
  scope, and surfaces deploy risk across this monorepo: deep analysis for the
  Laravel `api/` app (config, migrations with plain-English table summaries,
  Kernel schedule, Artisan commands including unscheduled ones), plus a lighter
  pass on React static apps (`portal/`, `pupil-portal/`, `parent-portal/`,
  `teacher-app/`) destined for S3. Use when the user mentions package
  deployment, release packaging, merging tickets for release, REVIEWED-ECP-
  branches, or applying this skill.
disable-model-invocation: true
---

# Package deployment (release branch)

## Purpose

Prepare a **release branch** from `staging` that merges **only** `REVIEWED-ECP-{N}` branches for the requested Jira issues. Validate each reviewed branch against `staging` and against the **Jira ticket scope**, detect merge conflicts early, and report deploy surfaces and risk before production.

## Output format (required)

Deliver the **final report as Markdown in the chat response** — use the success or failure template headings below. Do **not** wrap the report in a fenced code block unless the user explicitly asks for copy-paste raw markdown.

## Repository layout (this monorepo)

| Path | Role | Deploy / analysis depth |
|------|------|---------------------------|
| **`api/`** | Laravel API | **Primary.** Schema, queries, jobs, config, scheduler, and Artisan commands drive release risk (performance, data integrity, ops coordination). |
| **`portal/`**, **`pupil-portal/`**, **`parent-portal/`**, **`teacher-app/`** | React SPAs | **Static assets** — built and published to **S3**. Still report what changed and a **short** UI-oriented risk note; do **not** treat front-end churn as equivalent to API risk. |

Git operations use the **repository root**. Scoped diffs use the path prefixes above.

### Risk weighting (required)

- **`api/`** changes anchor the assessment: migrations, N+1 or heavy endpoints, new queues/schedules, auth/payments, config, and anything that affects **server load or data**.
- **Front-end** changes matter for **UX and regressions** (styling, broken flows) and are usually **fire-and-forget** after S3 deploy. They **typically do not** drive the numeric or narrative “severity” of the release the way API work does.
- **Exception — call out explicitly** when a UI diff suggests **abnormal API load**: e.g. new or tighter polling, `useEffect` / loops that may call the API repeatedly, batch fan-out, or obvious **request storms**. Those blur into API/incident risk and deserve a **named bullet** in the risk summary even though the edit lives under a React app.

When writing the **risk summary**, bias bullets toward **`api/`**; include **at most one** front-end aggregate bullet unless a concrete API-load or ship-blocking UI issue appears in the diffs.

## Required inputs

1. **Jira issues** — one or more ticket URLs or keys, for example:
   - `https://ngiris.atlassian.net/browse/ECP-319`
   - `ECP-303`
2. **Release branch name** — must be `release/{date}` (example: `release/2026-05-13`). Use the authoritative calendar date from the session when the engineer does not supply one; if both URL list and date are missing, **ask once** for URLs and the date segment.

Normalize issue keys to uppercase `ECP-\d+`. Ignore URL noise; extract the key from each line.

## Branch conventions (this repository)

For each issue key `ECP-123`:

| Branch | Meaning |
|--------|---------|
| `REVIEWED-ECP-123` | Engineer-approved code from the PR process — **this is what merges into the release** |
| `ECP-123` | Optional ticket branch; may be deleted after merge. **Do not use for validation or merging in this workflow.** |

Base branch for the release is **`staging`**.

## Preconditions

- Git repo is this project root (or the path the user indicates).
- Run `git fetch --all --prune` (or equivalent) so `staging` and `REVIEWED-ECP-*` refs exist locally before branching or diffs.
- Jira access via Atlassian MCP (`getJiraIssue`) for ticket scope verification.

If `staging` is missing locally after fetch, **stop** with a clear failure report.

## Workflow (execute in order)

Track **steps completed** in memory for the final report (numbered list).

### 1. Resolve release branch

- If `release/{date}` **does not** exist on the remote (or locally after fetch): create it from `staging`:
  - `git checkout staging && git pull` (if using tracking branch)
  - `git checkout -b release/{date}` from current `staging` tip
- If it **already** exists**: `git checkout release/{date}` and `git pull` to update; continue from that tip for merges **unless** the user asked for a fresh branch — in that case confirm before rewriting history.

Do not delete or reset an existing release branch without explicit user instruction.

### 2. Per-issue checks (before merging)

For each `ECP-{N}`:

#### 2a. Reviewed branch presence

- `REVIEWED-ECP-{N}` must exist after fetch (local or `origin/REVIEWED-ECP-{N}`).
- If missing, **abort** (do not merge partial sets unless the user explicitly narrows the ticket list).
- **Do not** require `ECP-{N}`. If the source branch was removed after merge, that is expected.

#### 2b. Diff vs `staging` (footprint)

Run from repository root:

```bash
git diff --stat staging...REVIEWED-ECP-{N}
git diff --name-status staging...REVIEWED-ECP-{N} -- api portal pupil-portal parent-portal teacher-app
```

Record per ticket:

- File count and line churn (`--stat`)
- Which monorepo areas changed (`api/`, `portal/`, etc.)
- Whether the diff is empty vs `staging` (already merged — **flag**; do not merge unless the user accepts)

**Do not** compare `ECP-{N}` to `REVIEWED-ECP-{N}`.

#### 2c. Ticket scope verification (high level)

**Goal:** confirm the `staging...REVIEWED-ECP-{N}` diff plausibly contains **only** work described in the Jira ticket — not a full code audit, but a sanity gate before merge.

**For each ticket, perform these steps and record the outcome in the final report:**

1. **Fetch Jira** via `getJiraIssue` (`cloudId`: `ngiris.atlassian.net` or resolved cloud ID). Request at minimum: `summary`, `description`, `comment`, `issuetype`, `labels`, `components`.
2. **Derive expected scope** — 1–3 bullets from the ticket (summary, description, acceptance criteria, relevant comments). State the **surfaces** you expect to change, e.g.:
   - “Portal — Guardians/Pupils bulk-delete button visibility”
   - “API — communications send confirmation message copy”
   - Not file paths — behaviour / feature area only.
3. **Derive actual scope** from the git diff (step 2b) — 1–3 bullets grouped by monorepo area. Note test-only files in the same area as the feature (acceptable). Call out paths that look **unrelated** to the ticket, e.g.:
   - `.cursor/`, unrelated apps, broad refactors, composer.lock-only churn without ticket mention
   - Changes under a different product area than the ticket describes
4. **Compare and assign a verdict:**

| Verdict | When to use |
|---------|-------------|
| **Pass** | Diff areas align with ticket; only co-located tests/helpers; scope is proportionate |
| **Flag** | Possible unrelated paths, missing expected surface (ticket says API but diff is portal-only, or vice versa), or scope much broader than the ticket implies |
| **Skip** | Jira unavailable — state what could not be read; rely on diff summary only |

5. **Default on Flag:** **do not auto-abort** — include the flag in the report with a short rationale and continue merging unless the user has asked to stop on scope mismatch, or the diff contains clearly unrelated high-risk `api/` work (migrations, auth, payments, scheduler) with no ticket mention.

**Check performed (document in report):** For each ticket, the report must show **Expected scope** (from Jira), **Actual scope** (from `staging...REVIEWED-ECP-{N}`), and **Verdict** with one-line rationale.

### 3. Merge reviewed branches into the release branch

- Checkout `release/{date}` at the latest tip from step 1.
- Merge each `REVIEWED-ECP-{N}` in **deterministic order** (sort keys lexicographically) unless the user specified merge order.
- For each merge: `git merge --no-ff REVIEWED-ECP-{N} -m "Merge REVIEWED-ECP-{N} into release/{date}"` (or team convention).

**On merge conflict**: **do not** resolve automatically. Run `git merge --abort` if appropriate to return to a clean state, or leave the repo in conflicted state **only** if the user must inspect — prefer abort and a clean tree. Failure output must list **conflicting files** and **which merge step** failed.

### 4. Post-merge analysis (only if all merges succeeded)

Run from **repository root** with `release/{date}` checked out and merged.

Complete the **`api/`** subsections below in full whenever those paths change. Then run the **front-end** subsection so the report reflects the whole monorepo.

#### Config and environment hints

**Paths**: `api/config/`, and `api/.env.example` when present.

1. **File-level change set**:

```bash
git diff --name-status staging...HEAD -- api/config api/.env.example
```

Interpret status codes for the report:

| Code | Report bucket |
|------|----------------|
| `A` | **New** — file did not exist on `staging` |
| `D` | **Removed** — file existed on `staging` but not on the release branch |
| `M` | **Changed** — file exists on both sides with edits |
| `R` / `C` | Treat as **removed** old path + **new** new path (or **changed** if same logical file); spell out both paths |

If the command prints nothing, there are no path changes under these roots.

2. **Extract what changed** (required whenever any `A`, `D`, or `M` row exists):

```bash
git diff staging...HEAD -- api/config api/.env.example
```

- For **new** (`A`) files: list **meaningful config keys**, env var names referenced, toggles, or service identifiers. If the file is mostly structural, one line on what it configures plus path.
- For **removed** (`D`) files: path and what configuration surface disappears (infer from name/diff when possible).
- For **changed** (`M`) files: **added** keys, **removed** keys, **modified** values (quote old → new only when short and safe; otherwise “value updated for key X”).

Remind the reader that changes here may require **production environment variables or config** before deploy.

#### Database migrations

**Path**: `api/database/migrations/`

```bash
git diff --name-status staging...HEAD -- api/database/migrations
```

1. List migration files that are **new** on the release branch relative to `staging` (`A` in name-status). Note that **`php artisan migrate`** (or the team’s migration process) may be required.
2. For **each new migration file**, open the file on `HEAD` and produce a **plain-English** summary that names **tables** (and key columns/indexes when obvious), for example:
   - “Adds a nullable `foo` column to the `communications` table.”
   - “Creates the `announcement_schools` pivot table linking announcements and schools.”
   - “Adds an index on `message_reads.conversation_id`.”
3. If there are **modified** migrations (`M`) vs `staging` (should be rare), call that out explicitly as **high risk** (migrations may already have run in some environments); summarize what changed in the file.
4. If there are **no** new or changed rows under this path, state that no migration file changes were introduced vs `staging`.

#### Console schedule (`app/Console/Kernel.php`)

**Path**: `api/app/Console/Kernel.php`

```bash
git diff --name-status staging...HEAD -- api/app/Console/Kernel.php
```

When the file changed (`M` or equivalent):

```bash
git diff staging...HEAD -- api/app/Console/Kernel.php
```

Report:

- **New scheduled work**: each new `$schedule->command('…')`, `$schedule->job(…)`, chained modifiers that change **when** or **how often** something runs (`daily`, `hourly`, `everyMinute`, `onOneServer`, `between`, `runInBackground`, `withoutOverlapping`, `onSuccess` callbacks, etc.).
- **Changed schedule**: same logical task but different cadence, environment guard (`production` / `!isProduction()`), or entrypoint — call out whether **production cron / Laravel scheduler** behavior changes.
- **Removed** schedule lines: note that a recurring process may **stop** in production unless something else replaces it.

**Operational meaning**: new or materially changed scheduled tasks often imply **new background processes**, **integrations**, **notifications**, or **data jobs**. Flag items that likely need **coordination outside this team** (third-party APIs, finance/comms, infra, school-facing side effects).

Also diff **`api/routes/console.php`** if present — closure-based `Artisan::command(…)` definitions are first-class console entrypoints:

```bash
git diff --name-status staging...HEAD -- api/routes/console.php
git diff staging...HEAD -- api/routes/console.php
```

#### Artisan commands (classes and closures)

**Goal**: surface **new or changed application-defined commands** and highlight commands that are **not** wired into the scheduler (manual, one-off, utility, or potentially **release-critical** if someone must run them during the window).

**Command class paths**: `api/app/Console/Commands/` (recursive).

```bash
git diff --name-status staging...HEAD -- api/app/Console/Commands
```

For **each** `A` / `M` / `D` / `R` / `C` row:

- **`A` (new class)**: path is a **new** command implementation. Read the class and extract the Artisan **signature** (e.g. `protected $signature = 'foo:bar {--option}'`). Summarize purpose in one line from class docblock or `handle()` when clear.
- **`M` (edited class)**: report signature if changed and summarize behavior delta from the diff when readable.
- **`D`**: command implementation removed — note if runbooks or ops relied on it.

**Whether a command is “automatically run”** (scheduler / registration):

1. Take the command name from the signature (string before `{` or first space).
2. On `HEAD`, check **`api/app/Console/Kernel.php`**:
   - `$schedule->command('name')` or `command("name")` including sub-commands with arguments (match the base command name).
   - `$schedule->job(new SomeJob)` — correlate to jobs if the diff introduces new scheduled jobs (mention job class).
   - Explicit entries in `protected $commands = […]` (uncommon here but must be checked).
3. Check **`api/routes/console.php`** for closure commands (`Artisan::command('name', …)`).
4. If the command **does not** appear in the scheduler or console routes as above, bucket it under **“Not scheduled — manual / ad-hoc”** and note why that matters: possible **utility**, **migration support**, **data fix**, **test-only**, or a **release-time action** someone must run intentionally.

**Framework and vendor commands** (e.g. `queue:prune-failed`, `migrate`) scheduled in `Kernel` are fine to mention briefly when newly scheduled; do **not** treat them as new app command classes.

Optional quick inventory after merges (from `api/`): `php artisan list` can help verify signatures and descriptions — use when ambiguity remains after reading files.

#### Horizon / queues (optional if touched)

If `api/config/horizon.php` or queue-related config appears in `api/config` name-status, mention in the risk summary that **worker / queue topology** may need ops alignment.

#### Front-end applications (static / S3)

**Paths**: `portal/`, `pupil-portal/`, `parent-portal/`, `teacher-app/` (each a React app built to static assets for S3).

1. **File-level change set** (one command covering all four roots):

```bash
git diff --name-status staging...HEAD -- portal pupil-portal parent-portal teacher-app
```

2. **Per-app footprint** when any row exists for that tree — optional but useful:

```bash
git diff --stat staging...HEAD -- portal
git diff --stat staging...HEAD -- pupil-portal
git diff --stat staging...HEAD -- parent-portal
git diff --stat staging...HEAD -- teacher-app
```

3. **Report content** (keep **brief**; this section is informational, not a second full Laravel audit):

   - Which apps have changes; approximate scope (e.g. “many files under `src/features/foo`”, “mostly assets”, “single component”).
   - **Typical risks** (only mention when plausible from paths or a quick skim of hunks): styling/layout regressions, routing, env-specific build config, **client behaviour that could stress the API** (polling, tight intervals, loops around fetches).
   - If **no rows**, state that there are no changes under these four directories vs `staging`.

Do **not** mirror the depth of the migrations or Kernel sections here unless a change clearly escalates risk (especially **API amplification**).

### 5. Risk summary (required on success)

Read the broader diff, for example:

```bash
git diff staging...HEAD --stat
```

Then provide a **short** narrative of deployment risks, **weighted to `api/`**: auth/payments, schema changes, feature flags, deletions, broad refactors, **new scheduled work**, **manual Artisan commands**, queue/Horizon, query/load behaviour, or anything that would worry an on-call engineer. Fold front-end notes in lightly per **Risk weighting** above. This is qualitative, based on the diff and the sections above.

## Success report template

Return as **Markdown in the chat** (not a code block). Use these headings verbatim; fill with real values.

## Release packaging — success

### Release branch
- `release/{date}` (full ref if useful, e.g. `origin/release/{date}`)

### Branches merged
- `REVIEWED-ECP-…` (list all, in merge order)

### Ticket scope verification

Per ticket — documents the check performed in workflow step 2c.

| Ticket | Verdict | Expected scope (Jira) | Actual scope (`staging...REVIEWED`) | Rationale |
|--------|---------|-------------------------|-------------------------------------|-----------|
| ECP-… | Pass / Flag / Skip | … | … | … |

- If any **Flag** rows: bullet list of follow-ups for the engineer before production.
- If all **Pass**: one line stating all tickets aligned with Jira scope at a high level.

### Config (`api/config/`, `api/.env.example`)
- **New files** (paths): …
  - For each: bullets of **new** keys / env names / toggles (or one-line description).
- **Removed files** (paths): …
  - For each: what configuration **went away** (brief), if known.
- **Changed files** (paths): …
  - For each file: **Added** … | **Removed** … | **Modified** … (empty buckets may be omitted).
- (If no rows under these paths: “No config or `.env.example` changes for this release vs staging.”)

### Migrations (`api/database/migrations/`)
- **New migration files** (paths): …
- **Per migration (plain English)**: …
  - For each new file: tables affected + human summary (e.g. nullable column on `communications`, new pivot, new index).
- **Modified migrations** (if any): … — flag risk; summarize change.
- (If none: “No migration file changes vs staging.”)

### Console schedule (`api/app/Console/Kernel.php`, `api/routes/console.php`)
- **New scheduled tasks / commands / jobs**: … — cadence + “may need coordination outside team” when applicable.
- **Changed schedule** (timing, env guards, callbacks): … — note production impact.
- **Removed schedule lines**: … — note if something stops running.
- **Closure console routes** (`api/routes/console.php`): new/changed/removed Artisan closures: …
- (If no schedule/console route changes: “No scheduler or console-route changes vs staging.”)

### Artisan commands (`api/app/Console/Commands/`)
- **New command classes** (paths + signatures): …
- **Edited command classes** (paths + what changed): …
- **Removed command classes**: …
- **Not scheduled — manual / ad-hoc** (signature list): …
  - Brief note: possible utility, data fix, release-time run, or test-only — confirm whether anything must run in production this release.
- (If no command folder changes: “No new or changed command classes under `api/app/Console/Commands/` vs staging.”)

### Front-end apps (`portal/`, `pupil-portal/`, `parent-portal/`, `teacher-app/`)
- **Apps with changes**: … (list; “none” if no diff rows).
- **Scope note** (one line per changed app or one combined line): …
- **UI / S3 deploy risks** (short): regressions, build/config — and **API load** only if the diff warrants it.
- Explicit line when appropriate: “Front-end changes are **not weighted equally** with `api/` for this release risk call.”

### Risk summary
- 2–6 bullets from the `staging...HEAD` diff review, **dominated by `api/`** unless a front-end or cross-cutting issue (e.g. API storm from the client) earns its own bullet.

### Reminders
- Coordinate production env/config if config or `.env.example` changed.
- Run migration plan if new or changed migration files exist.
- Align **Laravel scheduler** (and server cron that invokes `schedule:run`) with new/changed/removed Kernel schedule entries.
- Review **manual Artisan commands** for release runbooks or one-off execution.
- Build and publish **React apps** to **S3** per team process when any of `portal/`, `pupil-portal/`, `parent-portal/`, or `teacher-app/` changed.
- Push `release/{date}` when ready: `git push -u origin release/{date}`

## Failure report template

On any abort (missing reviewed branch, merge conflict, missing `staging`, etc.):

## Release packaging — failed

### Steps completed
1. …
2. …
(n — stopped here)

### Failure point
- Step / action: …
- Command or check: …

### What went wrong (short)
- One tight paragraph an engineer can forward.

### Details
- Branches / keys involved, conflict paths, diff excerpts, or ticket scope flags as needed.

## Operational notes

- **Do not merge** raw `ECP-*` branches into the release branch in this workflow.
- **Do not** require or diff against `ECP-{N}` — only `REVIEWED-ECP-{N}` vs `staging` matters.
- If the user pastes duplicate URLs for the same key, dedupe keys before merging.
- After success, remind the user to **push** `release/{date}` if commits exist only locally.
