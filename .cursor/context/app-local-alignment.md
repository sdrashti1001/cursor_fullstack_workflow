# App-local alignment (ALPG)

**Blocking gate** for `plan`, `implement`, `review`, **and `fix-comments`**. Read
when touching `portal/`, `parent-portal/`, `pupil-portal/`, or `teacher-app/`.
When a reviewer comment names a reference file ("look at `AllPurchases.tsx`"),
that file becomes the A1 reference and A6 must pass against it before the comment
is marked fixed.

## Core rule

**The owning app is the only style guide.**

| You edit | Patterns come from | Never use as default precedent |
|----------|-------------------|--------------------------------|
| `portal/` | `portal/src/…` only | `parent-portal/`, other apps, “monorepo in general” |
| `parent-portal/` | `parent-portal/src/…` only | `portal/`, other apps |
| `pupil-portal/` | `pupil-portal/src/…` only | Other apps |
| `teacher-app/` | `teacher-app/src/…` only | Other apps |

Cross-app behaviour may be copied **only after** re-finding the equivalent in
the **owning** app (API module, container folder, hook style). Router/store
versions differ — see `learnings.mdc`.

Shared docs (`frontend-conventions.md`, `api-calls.md`) state ideals; when they
conflict with a **named reference file in the same app**, the reference file wins
and drift should be flagged, not copied forward.

---

## ALPG · App Local Pattern Gate

Run **before** marking plan/implement/review complete. Any **FAIL** blocks
merge-ready output until fixed or explicitly escalated to the user.

### A0 — Owning app

From plan `APPS:` or diff paths. One ticket may touch multiple apps — run ALPG
**per app** separately.

### A1 — Name a reference **per concern** (same app, same domain)

One ticket spans several pattern domains. Naming a single "UI reference" is not
enough — a list page also has an API layer, money display, filters, and nav. For
**each concern the diff touches**, name the nearest existing sibling in the
**owning app** and record its full path. Minimum set, add rows as needed:

| Concern (if touched) | Reference to mirror | Example |
|----------------------|---------------------|---------|
| **API module / hooks** | the `src/api/*` module for a similar domain | `api/parents-evenings.ts` |
| **List / index page** | an existing list container (params, pagination, filters) | `containers/.../AllPurchases.tsx` |
| **Filter bar** | the filter component of that list reference | whatever `AllPurchases` uses |
| **Money display** | the global price util | `formatPrice(pence / 100)` |
| **Nav / feature flag** | an existing hide-flag in the nav map | `ShopNavigation.jsx` sibling entry |
| **Dialog / toast / table** | `components/ui/*` building block the reference uses | — |

Grep `src/api` and `src/containers` in the **owning app only**. A concern with
no named reference is a **plan gap** — say so, do not invent a pattern for it.
Record the table in the plan, implement, and review artifacts.

### A2 — File tree (structure)

Inspect **new** files in the diff under the owning app.

| Check | FAIL when |
|-------|-----------|
| **Util sprawl** | More than **one** new non-test module whose primary role is helpers/constants (`*Utils*`, `*helpers*`, `*Api*`, `*Guards*`, `*Display*`, bare `constants.ts`) per feature folder |
| **Single-consumer module** | New exported module (excluding tests/fixtures) imported from **only one** production file — inline or merge into that file instead |
| **HTTP outside `src/api/`** | New `fetcher` / `instance.get` / `instance.post` / axios calls under `containers/` or `components/` |
| **New top-level container** | New `containers/<Name>/` when the ticket extends an existing feature and nothing else will import it — extend the existing folder unless **≥2** call sites are named in the plan |
| **Hook placement** | New data hooks under `components/` when the app’s sibling features use `src/api/` + component-local UI state |
| **Feature root** | Any file other than `index`, `types`, `utils` at a feature folder root — components and hooks belong under `components/` |
| **Unused / single-field export** | An exported function that is never imported, or that only wraps a single field access (`xDisplayName(a) => a.full_name`) — delete it or read the field inline |

**Allowed without FAIL:** Sonar-driven extract into the **same** file or the
feature’s single `utils.ts`; test fixtures co-located if shared by **≥2** test
files.

### A3 — API (School Spider / laroute)

In the owning app, new or changed backend calls must match the **API reference**
from A1.

| Check | FAIL when |
|-------|-----------|
| **Laroute first** | New code builds URLs with `API_URL`, `` `/v1/schools/` ``, or `*ApiPath()` helpers while an existing hook in `src/api/` uses `fetcher('schools.*', …)` for the same action |
| **Centralise** | New query/mutation hooks added under `containers/` instead of extending the domain `src/api/*` module |
| **Route names** | `fetcher`/`creator`/`updater`/`deleter` first argument is not a laroute key — unless plan documents **no laroute key exists**, BE ticket id, and interim behaviour |
| **Containers don’t call HTTP** | Components import hooks from `api` (or app alias), not raw URL builders |
| **Module minimalism** | The `src/api/*` module has more than a list/index call, a detail call, and the feature's action calls — e.g. param-building or filter helpers live here |
| **Param ownership** | A hook builds, normalises, defaults, or filters its params instead of taking them and sending as-is — params (filter/page/sort) are the calling component's job so the hook stays reusable |

Client-side **app routes** (`react-router` paths, `buildUrl` for in-app links)
are not API calls — but duplicate link builders should still follow the UI
reference.

### A4 — UI / filing

| Check | FAIL when |
|-------|-----------|
| **Prototype / HTML / Figma** | New UI invents components or layout that the UI reference solves with existing `components/` / `components/ui/` building blocks |
| **Styling** | New screen diverges from UI reference’s Tailwind patterns (spacing, headers, tables, empty states) without ticket AC requiring it |
| **Dialog / toast** | Toasts or navigation inside `api/` hooks; legacy `Modal` where UI reference uses `components/ui/dialog` |

### A6 — In-file shape match (not just filing)

A2–A4 check **where** files and HTTP live. They do **not** catch a file that is
in the right place but internally shaped nothing like its sibling — which is how
a bespoke `buildQueryParams` mapper or a hand-rolled filter flow passes "looks
aligned" while being exactly what a reviewer rejects.

For each **list page, API module, or form** in the diff, produce a short
**side-by-side** against its A1 reference and confirm the *internal* structure
matches — a yes/no is not acceptable, show the two shapes:

| Aspect | Reference does | This file does | Match? |
|--------|----------------|----------------|--------|
| What the hook receives | `useX(Object.fromEntries(searchParams), …)` | … | |
| Where filter→param mapping lives | filter bar writes API params; index passes through | … | |
| Page / limit | from URL, not re-parsed in the page | … | |
| Config passed to hook | `config?.onSuccess` | … | |

**FAIL** when the diff introduces a translation/normalisation layer the
reference does not have (param mappers, cross-field filter rules, default-param
injection, re-parsing). The fix is to move that logic into the filter
bar/URL/BE so the page becomes a pass-through — **not** to tidy the mapper. Any
A6 FAIL is **HIGH**, and "it's domain-specific" is not a valid justification
unless the reference sibling also has an equivalent one-liner.

### A5 — Honesty bar (reviews)

- **Do not** answer “is this aligned?” with “mostly” or “matches some repo
  drift” as PASS.
- **Repo drift** in unrelated files is not permission to add more drift.
- If ALPG fails, rating is **FAIL** (usually **HIGH**), with reference path and
  fix (merge files, move HTTP to `api/`, use laroute key).

---

## Required output (copy into artifacts)

### Plan (`## App-local alignment`)

```markdown
## App-local alignment
- Owning app(s): [portal | parent-portal | …]
- References per concern (A1 table): [concern → path, one row per concern touched]
- New non-component modules planned: [list or “none”]
- Laroute keys (new/changed): [schools.* …] or “none” / “blocked on BE”
```

### Implement / review / fix-comments

Table:

| Check | PASS/FAIL | Evidence |
|-------|-----------|----------|
| A1 References per concern | | paths |
| A2 File tree | | importer counts / file list |
| A3 API / laroute | | grep or route keys |
| A4 UI | | vs UI reference |
| A6 In-file shape match | | side-by-side vs reference |

---

## Quick grep (owning app directory only)

From repo root, replace `<app>`:

```bash
# New path builders (investigate every hit in the diff)
rg "API_URL|/v1/schools/|ApiPath\\(" <app>/src --glob "*.{ts,tsx,js,jsx}"

# HTTP in containers (should be empty for new work)
rg "fetcher\\(|instance\\.(get|post|put|delete)" <app>/src/containers --glob "*.{ts,tsx}"

# Laroute-style API modules (use as reference)
rg "fetcher\\('schools\\." <app>/src/api --glob "*.{ts,tsx,js}"
```

---

## Themes from team feedback (keep ALPG strict)

- Senior skim: too many small util/constant files; prefer one `utils.ts` or
  inline when single-use.
- Prefer **laroute keys** over hand-built API path helpers.
- **Once-over** against **this app’s** existing feature before human PR review.
- Don’t add **new containers/files** unless reuse in **≥2** places (or ticket
  explicitly needs a new route-level feature).
- Prototypes/HTML are **reference only** — match owning app components and
  screens, not the export markup.
