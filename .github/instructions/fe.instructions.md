---
alwaysApply: true
applyTo: "src/**/*.{ts,tsx}"
description: Frontend React/TypeScript coding standards and UI copy rules
---

# Frontend Engineering Rules

## Component Standards

- testId format: `[feature]-[component]-[element]` on interactive elements and major containers only.
- Use API response data as-is — never redefine or duplicate backend values on the frontend.
- Handle loading, error, empty, and success states for every data-fetch and submission.
- useEffect must clean up subscriptions, timers, and event listeners.
- Disable submit buttons while in-flight. No double-submit.

## Accessibility

- `aria-label` on every interactive element without visible text.
- `aria-label` must describe the action AND its target: `"Remove file students.csv"` not just `"Remove"`.
- All interactions keyboard-navigable.
- Focus returns to trigger after modal/drawer/popover closes.
- Avoid `"click here"` or `"here"` as link text — use descriptive text that makes sense out of context.
- Status announcements for screen readers: use `role="alert"` on dynamically injected error/success banners.

## Testing Patterns

- Mock all hooks that call fetch/useSWR.
- `afterEach`: `cleanup()` + `vi.clearAllMocks()`.
- 5000ms timeout on every test.
- Mocks must match the actual API response shape — never invent data structures.

## UI Copy & Grammar

### Cardinality — always handle 0, 1, and 2+ separately
- Never hardcode a singular or plural word next to a dynamic value. Every noun, verb, and quantifier adjacent to a count must be wrapped in a ternary or helper.
- Check all three boundary cases mentally before raising a PR: render the string for 0 items, 1 item, and 3 items and read each aloud.
- Examples of what to guard:
  - `"file"` / `"files"` — wrap: `count === 1 ? "file" : "files"`
  - `"is"` / `"are"` — wrap: `count === 1 ? "is" : "are"`
  - `"it"` / `"them"` — wrap: `count === 1 ? "it" : "them"`
  - `"this file"` / `"these files"` — wrap accordingly
  - `"template"` / `"templates"` — wrap accordingly
  - `"was"` / `"were"` — wrap accordingly
  - `"has"` / `"have"` — wrap accordingly

### Oxford comma for 3+ item lists
- 1 item → `"A"`
- 2 items → `"A and B"` (no comma)
- 3+ items → `"A, B, and C"` (Oxford comma before "and")
- Never use `"A, B and C"` for 3+ items — it is ambiguous about whether "B and C" is a compound item.
- Use this exact pattern:
  ```ts
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  const allButLast = items.slice(0, -1).join(", ");
  return `${allButLast}, and ${items[items.length - 1]}`;
  ```

### Empty / zero state copy
- A count of 0 must never produce `"0 files"` as the only message — show a dedicated empty-state message instead.
- `"No files uploaded yet"` is more helpful than `"0 files are required"`.

### Sentence consistency across a single banner or paragraph
- If one clause in a sentence is dynamic (e.g. file count), audit every other clause in the same sentence for agreement — subject/verb, determiner/noun, pronoun reference.
- Read the full sentence for each cardinality case, not just the token you changed.

### Button and action labels
- Use imperative present tense: `"Download"`, `"Remove File"`, `"Upload"` — not `"Downloading"` or `"File Removal"`.
- Disable + show a loading indicator during async actions — never leave the label unchanged while the action is in-flight.
- Confirmation dialogs: the confirm button label must echo the destructive action (`"Remove File"`, not `"OK"`).

### Error and warning messages
- Say what went wrong **and** what the user should do next. `"Could not upload file. Please try again."` not just `"Error."`.
- When listing multiple error items, use a `<ul>` — never concatenate into a single sentence with commas.
- Distinguish warn (amber) from error (red): use warn when the user can still proceed, error when they cannot.

### Banners and feedback
- Show exactly one banner per concern. Do not stack a success banner and an error banner for the same action simultaneously.
- Clear stale banners (error, warning) at the start of each new user action so the UI reflects the current attempt, not history.
- After a successful async action, clear the error banner — do not leave both visible.

### Internationalisation readiness
- Never concatenate translated strings with runtime values mid-sentence — the word order differs by language. Design copy so the dynamic value can be placed at the start or end.
- Do not hardcode currency symbols, date formats, or number separators inline.
