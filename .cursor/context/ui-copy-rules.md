# UI copy & grammar rules

Read during review, and while writing any user-facing string.

## Cardinality — handle 0, 1, and 2+ separately

Never hardcode a singular or plural word next to a dynamic value. Every noun,
verb, and quantifier adjacent to a count must be wrapped.

Render the string for 0, 1, and 3 items and read each aloud before raising a PR.

| Word | Guard |
|------|-------|
| file / files | `count === 1 ? 'file' : 'files'` |
| is / are | `count === 1 ? 'is' : 'are'` |
| it / them | `count === 1 ? 'it' : 'them'` |
| this file / these files | wrap accordingly |
| was / were, has / have | wrap accordingly |

If one clause in a sentence is dynamic, audit **every other clause in the same
sentence** for agreement — subject/verb, determiner/noun, pronoun reference.

## Oxford comma on 3+ item lists

- 1 → `"A"`
- 2 → `"A and B"` (no comma)
- 3+ → `"A, B, and C"`

Never `"A, B and C"` — ambiguous about whether "B and C" is one compound item.

```ts
if (items.length === 0) return '';
if (items.length === 1) return items[0];
if (items.length === 2) return `${items[0]} and ${items[1]}`;
const allButLast = items.slice(0, -1).join(', ');
return `${allButLast}, and ${items[items.length - 1]}`;
```

## Empty state

A count of 0 must never produce `"0 files"` as the only message. Show dedicated
empty-state copy: `"No files uploaded yet"`, not `"0 files are required"`.

## Buttons and actions

- Imperative present tense: `"Download"`, `"Remove File"`, `"Upload"` — never
  `"Downloading"` or `"File Removal"`.
- Disable and show a loading indicator during async actions. Never leave the
  label unchanged while in-flight.
- Confirmation dialogs: the confirm button echoes the destructive action
  (`"Remove File"`, not `"OK"`).

## Errors and warnings

- Say what went wrong **and** what to do next: `"Could not upload file. Please
  try again."` — not `"Error."`
- Multiple error items → `<ul>`. Never comma-concatenate into one sentence.
- Warn (amber) when the user can still proceed; error (red) when they cannot.

## Banners

- Exactly one banner per concern. Never stack a success and an error banner for
  the same action.
- Clear stale error/warning banners at the start of each new user action.
- After a successful async action, clear the error banner.

## Internationalisation

`parent-portal` ships i18next; treat all four apps as i18n-bound.

- Never concatenate a translated string with a runtime value mid-sentence — word
  order differs by language. Design copy so the dynamic value sits at the start
  or the end.
- Never hardcode currency symbols, date formats, or number separators inline.
