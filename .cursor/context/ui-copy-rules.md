# UI Copy & Grammar Rules

Read this file when writing or modifying user-facing text in React components.

## Cardinality — always handle 0, 1, and 2+ separately
- Never hardcode a singular or plural word next to a dynamic value. Every noun, verb, and quantifier adjacent to a count must be wrapped in a ternary or helper.
- Check all three boundary cases: render the string for 0 items, 1 item, and 3 items.
- Guard: `"file"/"files"`, `"is"/"are"`, `"it"/"them"`, `"this"/"these"`, `"was"/"were"`, `"has"/"have"`.

## Oxford comma for 3+ item lists
- 1 item → `"A"`
- 2 items → `"A and B"`
- 3+ items → `"A, B, and C"` (Oxford comma before "and")
- Pattern:
  ```ts
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  const allButLast = items.slice(0, -1).join(", ");
  return `${allButLast}, and ${items[items.length - 1]}`;
  ```

## Empty / zero state copy
- A count of 0 must never produce `"0 files"` — show a dedicated empty-state message.

## Sentence consistency
- If one clause in a sentence is dynamic, audit every other clause for subject/verb agreement.

## Button and action labels
- Use imperative present tense: `"Download"`, `"Remove File"`, `"Upload"`.
- Disable + show a loading indicator during async actions.
- Confirmation dialogs: confirm button echoes the destructive action (`"Remove File"`, not `"OK"`).

## Error and warning messages
- Say what went wrong AND what the user should do next.
- Multiple error items → use a `<ul>`, not comma-separated text.
- Warn (amber) = user can proceed. Error (red) = user cannot.

## Banners and feedback
- One banner per concern. Do not stack success + error for the same action.
- Clear stale banners at the start of each new user action.

## Internationalisation readiness
- Never concatenate translated strings with runtime values mid-sentence.
- Do not hardcode currency symbols, date formats, or number separators.
