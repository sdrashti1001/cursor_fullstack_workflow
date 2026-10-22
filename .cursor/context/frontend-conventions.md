# Frontend conventions

House style for `portal/`, `parent-portal/`, `pupil-portal/`, `teacher-app/`.
Read when authoring or reviewing React/TypeScript. **App-local source of truth:**
the nearest reference feature **in the same app** (see
`.cursor/context/app-local-alignment.md`). When this file and that reference
disagree, follow the reference and flag the drift.

## Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase | `Button.tsx`, `PupilForm.jsx` |
| Hooks | camelCase, `use` prefix | `useRouter.ts` |
| API modules | kebab-case | `pupils.js`, `group-conversations.ts` |
| Context | kebab-case + `-context` | `auth-context.jsx` |
| Utils | kebab-case | `dates.js`, `constants.ts` |
| Variables / functions | camelCase | `currentUser`, `handleSubmit` |
| Types / components | PascalCase | `UserProfile` |
| Constants | UPPER_SNAKE_CASE | `API_URL` |

## TypeScript

- New files: `.ts` / `.tsx`. Touching an existing `.jsx`? Convert it gradually.
- `import type` for type-only imports.
- No `any`, no `@ts-ignore`, no `as unknown as X` unless there is genuinely no
  alternative — and say so if you use one.

## Import order

1. React and external libraries
2. Aliased imports (components, hooks, api)
3. Types (`import type`)
4. Relative imports
5. Styles

## Components

Standard shape — typed props interface, **default export**:

```tsx
interface MyComponentProps {
  title: string;
  onClose: () => void;
}

export default function MyComponent({ title, onClose }: MyComponentProps) {
  const [state, setState] = useState(null);
  // …
}
```

Prefer **compositional** over prop-heavy:

```tsx
// ✅
<Dialog>
  <DialogTitle>Title</DialogTitle>
  <DialogBody>Content</DialogBody>
  <DialogActions>Buttons</DialogActions>
</Dialog>

// ❌
<Dialog title="Title" content="Content" actions={<>Buttons</>} />
```

Contain dialog state inside the button that opens it, rather than lifting it to
the parent screen:

```tsx
export function InviteButton({ staff }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Invite</Button>
      <Dialog open={open} onClose={() => setOpen(false)}>…</Dialog>
    </>
  );
}
```

Folder layout:

```
containers/Feature/
├── components/     # feature-specific components
├── context/        # feature-specific context
├── index.jsx       # main container/page
└── Loadable.jsx    # lazy-loading wrapper
```

**Only `index`, `types`, `utils` (plus `Loadable`/`context`) live at the feature
root.** Every other component or hook goes under `components/`. A feature `utils`
is for genuinely shared helpers — not a dumping ground of one-liners; inline a
helper used in one place and delete any that are unused.

## Styling

Tailwind first — always prefer utility classes over custom CSS. Use `cn()` from
`utils` for conditional classes:

```tsx
<div className={cn('base-classes', isActive && 'active-classes', className)} />
```

Prettier: 80 cols, 2-space indent, single quotes, semicolons, trailing commas
everywhere. The Tailwind plugin sorts classes — do not hand-order them.

**Visual fidelity — match the app, not the export:**

- **No hardcoded hex colours.** Use the app's Tailwind tokens. Off-palette
  badges, alerts, and borders read as "not our style" / "AI-generated" in review.
- **Reuse existing component styles** (badges, tables, banners). Do not invent a
  new visual treatment when a sibling screen already has one.
- **Match the reference screen's table/container variant.** The standard table
  is not designed for white backgrounds — pick the variant the nearest reference
  uses, don't force the default.
- **Portal dropdowns/popovers out of modals.** A dropdown inside a modal (or on
  the last row of a list) must render outside its container, never clipped —
  check the bottom/last-row case.
- **Page header:** use the shared Header + actions pattern (ref
  `Payments/Vouchers/index.tsx`), not a hand-rolled per-page header.
- **Don't build UI that isn't in the prototype.** Extra icons, decorative
  elements, or explanatory paragraphs under a table are clutter. If you think
  the prototype should change, raise it with the designer/PM — don't ship the
  change unasked. Don't duplicate a visible button in helper text.

## Data fetching (TanStack Query)

> **Import path:** use `@tanstack/react-query`. The examples in
> `.cursor/agents/frontend.md` still show the legacy `react-query` (v3) path,
> but its own tech-stack section and every test mock use TanStack Query 5.
> Match whatever the app you're editing actually imports — check a neighbouring
> hook before writing a new one.

```ts
export const usePupils = (params = {}, config?) => {
  const school = useCurrentSchoolId();
  return useQuery(
    ['pupils', school, params],
    () => fetcher('schools.pupils.index', { school, ...params }),
    config,
  );
};

export const useCreatePupil = (config?) => {
  const school = useCurrentSchoolId();
  const queryClient = useQueryClient();
  return useMutation(data => creator('schools.pupils.store', { data, school }), {
    ...config,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries(['pupils']);
      config?.onSuccess?.(data, variables, context);
    },
  });
};
```

Rules:
- **Hook names:** `usePupils`, `useCreatePupil` — not `usePupilsQuery` /
  `useCreatePupilMutation`. Match neighbouring `src/api/` modules in the same app.
- **Prefer TanStack Query directly** (`useQuery` / `useMutation`) with typed
  `onError` (see `api/payg.ts`). Avoid `useQueryWithGlobalError` in new code unless
  the surrounding feature already uses it.
- **Query options:** Rely on app-wide defaults in `main.jsx` (`staleTime`,
  `refetchOnWindowFocus`). Do not add per-hook `staleTime` unless there is a
  documented reason; mutations should `invalidateQueries` instead.
- **Money:** Display API pence with `formatPrice(amount / 100)` — not hybrid
  helpers that mix numeric pence and `*_formatted` strings.
- **No side effects in hooks** beyond query cache updates — toasts for mutation
  errors may live in the hook `onError` when that is the local pattern (`payg.ts`).
- Use laroute route names, never hardcoded URLs.
- Always handle `onError`.
- Always invalidate affected queries after a mutation.
- **Keep the module minimal:** an `src/api/*` module is a list/index call, a
  detail call, and the feature's action calls — nothing more. No path-building
  helpers when a laroute key exists; no `fetcher`/`mutation` wrapper functions —
  write the call inline in the hook.
- **Params belong to the caller, not the hook.** The hook takes `params` and
  sends them to the backend as-is. It never builds, normalises, defaults, or
  filters them — so a *different* feature can reuse it later. Filter/page/sort
  are passed in by the calling component straight from the URL
  (`Object.fromEntries(searchParams)`), never assembled in the hook or the index.
- **Do not change `services/fetcher.ts`** for a single feature unless platform
  owns the laroute failure mode; missing routes are an API/laroute deploy issue.

## Forms and validation

**Validation comes from the API**, not from client-side schemas:

```tsx
<Input name="email" value={form.email} onChange={handleChange} />
<ValidationErrors name="email" />
```

Standard submit shape: local `useState` form object → `mutation.mutate(form, {
onSuccess, onError })` → toast in the component.

## Key components

| Need | Use |
|------|-----|
| Dialog | `components/ui/dialog` (Headless UI) |
| Table | `components/ReactTable` (TanStack Table) |
| Toast — portal | `useToasts()` from `react-toast-notifications` |
| Toast — parent-portal | `sonner` |
| Icons | `@fortawesome/react-fontawesome`, `@heroicons/react` |

## Parent app specifics

- i18n via i18next: `const { t } = useTranslation(); <h1>{t('welcome.title')}</h1>`
- Runs on iOS/Android through Capacitor — mobile-first responsive, Capacitor
  APIs for native features.

## Robustness checklist

- Handle **loading, error, empty, success** for every fetch and submission.
- `useEffect` cleans up subscriptions, timers, listeners.
- Disable submit while in-flight — no double-submit.
- Use API response data as-is. Never redefine or duplicate backend values on the
  client.

## Accessibility

- `aria-label` on every interactive element without visible text, describing the
  action **and** its target: `"Remove file students.csv"`, not `"Remove"`.
- Everything keyboard-reachable.
- Focus returns to the trigger after a modal / drawer / popover closes.
- No `"click here"` link text.
- `role="alert"` on dynamically injected error/success banners.

## Reference docs

`docs/frontend/` in the repo: `api-calls.md`, `code-conventions.md`,
`common-patterns.md`, `forms-validation.md`, `state-management.md`,
`permissions.md`.

## Complexity

Every function and React component stays **below cognitive complexity 15**
(`sonarjs/cognitive-complexity`). Enforced by the Sonar gate in
`project-rules.mdc` — this is not advisory.

When a function exceeds it, extract branches into **named helper functions above
the parent**. Do not just add inline comments.

Patterns that inflate CC:
- Ternaries nested inside loops or other ternaries → extract to a named function
- Long `if / else if` chains inside `useMemo` / `useCallback` → extract as a
  module-level pure function
- Sort comparators with multiple guard `if`s → extract a named comparator

Note the tension with `.cursor/agents/laravel-simplifier.md`, which prefers
explicit readable code over compactness: the resolution is **extract, don't
compress**. Splitting a CC-18 function into three named helpers satisfies both.
Collapsing it into a dense one-liner satisfies neither.

---

## ⚠️ Unconfirmed — check with the team

- **testId format** `[feature]-[component]-[element]` on interactive elements and
  major containers. Carried over from sync.onboarding. This repo's tests use
  `getByTestId` but document no naming convention. Delete this block once
  confirmed either way.
