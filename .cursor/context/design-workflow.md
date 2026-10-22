# Design workflow

Read when the ticket references a design — Figma link, prototype/HTML URL, or an
attached image. The goal is to convert the design into a **text spec once**, then
never touch the original again.

## Source priority — use the highest available

| Rank | Source | Why | How |
|------|--------|-----|-----|
| 1 | **HTML / prototype URL** | Exact values, cheap (text not pixels) | Fetch the page. Read markup structure + CSS. |
| 2 | **Figma via Figma Dev Mode MCP** | Structured layers, spacing, tokens | Use the MCP tool. |
| 3 | **Figma URL, no MCP** | Agent cannot open it | Say so. Ask for an exported image or Dev Mode inspect values. Do not pretend to have read it. |
| 4 | **Image attachment** | Expensive, lossy, inconsistent between passes | Interpret **once**, at plan time. |

If both a prototype URL and a screenshot of the same screen exist, **use the
prototype and ignore the screenshot.**

## The one-pass rule

Interpret the design exactly once, during `plan`, and write
`tempAgentOutput/ui-references/[TICKET-ID].md`.

From then on `implement` and `review` read **that markdown file only**. Never
re-attach the image, never re-fetch the prototype, never re-open Figma. This is
where the token saving comes from — the design gets paid for once per ticket
instead of once per prompt.

If the file already exists, update it. Never create a duplicate.

## Extracting from an HTML prototype

Fetch the page and record:
- DOM structure — sections, nesting, repeated blocks
- Actual class names and CSS values (spacing, colour, radius, font size/weight)
- States present in the markup (disabled, error, empty, loading)
- Copy — exact strings, so `ui-copy-rules.md` can be applied

Do **not** copy the prototype's CSS into the project. It is a reference for
*values*, not a source of code.

## Extracting from an image

Capture, in this order: page/layout structure → component hierarchy →
spacing, alignment, sizing → typography and hierarchy → colours, borders,
shadows, radius → icons and placement → visible text → states shown →
inferable responsive behaviour.

If an image is referenced but you cannot actually see its contents, state
exactly:
`Image could not be inspected — only Jira metadata/reference was available.`
Never infer a design from a filename or URL.

## Translation — design values → this codebase

This is the step that matters. A design spec is not an implementation plan until
each element maps to something that already exists.

| Design shows | Map to |
|---|---|
| A modal / drawer | `components/ui/dialog` (Headless UI) — never a hand-rolled overlay |
| A data table | `components/ReactTable` (TanStack Table) |
| A toast / snackbar | `useToasts()` in portal, `sonner` in parent-portal |
| An icon | `@fortawesome/react-fontawesome` or `@heroicons/react` |
| `16px` gap | Tailwind scale (`gap-4`) — never an arbitrary value if a scale step fits |
| A hex colour | The nearest existing Tailwind/theme token. Flag it if there is no match rather than hardcoding. |
| Conditional styling | `cn()` from `utils` |

Rules:
- **Never write custom CSS** to match a design. Tailwind utilities only.
- **Never build a component that already exists.** Grep first; name what you
  found in the spec's "reusable" section.
- Where the design conflicts with an existing project pattern, **follow the
  project pattern** and note the discrepancy in Implementation notes.
- Where the design conflicts with the ticket's written requirements, **the
  ticket wins**. Note the discrepancy.
- Reproduce the design as closely as practical, but do not invent details the
  design does not show. Say what was unclear.

## Spec format

```markdown
# UI Reference — [TICKET-ID]

## Source
Type: prototype URL | Figma (MCP) | image
Location: [url or attachment name]
Fidelity: exact values | approximate from image | partial

## Page structure
## Components
## Layout
Spacing | alignment | sizing | responsive behaviour
## Styling
Colors (→ token) | Typography | Borders | Shadows | Radius
## Content
Exact copy strings
## Interaction / states
Which of loading / error / empty / success are shown, and what each looks like
## Implementation notes
- Existing components reusable: [named]
- Components to create: [named, with why nothing existing fits]
- Tailwind mappings: [design value → class]
- Details to preserve:
## Gaps
- What the design does not specify (states not shown, responsive behaviour, etc.)
- Conflicts with ticket requirements or project patterns
```
