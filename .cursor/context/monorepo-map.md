# Monorepo map

Read this when you need to pick an app or run a command. Do not read it for
pure code-authoring work.

## Apps

| App | Path | Router | State | Notable |
|-----|------|--------|-------|---------|
| Staff Portal | `portal/` | React Router **5** | Zustand **3** | TanStack Query 5, TanStack Table, TipTap, `react-toast-notifications` |
| Parent App | `parent-portal/` | React Router **6** | Zustand **5** | Capacitor 7 (iOS/Android), i18next, `sonner`, framer-motion 12 |
| Pupil Portal | `pupil-portal/` | — | — | React + Vite + Vitest (same house patterns) |
| Teacher App | `teacher-app/` | — | — | React + Vite + Vitest (same house patterns) |
| API | `api/` | — | — | Laravel. Rules: `.cursor/rules/laravel-api.mdc` |

Shared across all four React apps: React 18, TypeScript (gradual migration from
JSX), Tailwind CSS 4, Vite, Headless UI + Radix UI, Vitest + React Testing
Library + jsdom.

**Router and Zustand versions differ between portal and parent-portal.** Never
copy a router or store pattern from one into the other without checking the
version first.

## Commands

Always `cd` into the owning app first. Wrap in `cmd /c "..."` on Windows.

```bash
cd portal && yarn test src/containers/Surveys/                    # directory
cd portal && yarn test src/containers/Surveys/components/X.test.tsx  # one file
cd portal && yarn lint
```

Substitute `parent-portal`, `pupil-portal`, or `teacher-app` as appropriate.

## ⚠️ Verify before relying on these

These were carried over and have **not** been confirmed against this repo's
`package.json` files. Check the app's `scripts` block the first time you need
each, then correct this file:

- Type-check command per app (assumed `npx tsc --noEmit`; there may be a
  `yarn typecheck` script instead)
- Whether a coverage script exists, and whether any coverage threshold is
  enforced in CI
- The exact Sonar invocation (`sonar_scan` MCP tool, `sonar-scanner` CLI, or an
  eslint rule run: `npx eslint --rule '{"sonarjs/cognitive-complexity": ["error", 15]}' <files>`).
  Sonar **is** enforced on this repo — only the command needs confirming.
- Whether the Snyk MCP tool (`snyk_code_scan`) is connected in this workspace

## Vitest setup files

| App | Setup |
|-----|-------|
| portal | `portal/vitest.setup.ts` (loads `portal/src/test/mocks.ts`) |
| parent-portal | `parent-portal/vitest.setup.ts` |
| pupil-portal | `pupil-portal/vitest.setup.ts` |
| teacher-app | `teacher-app/vitest.setup.ts` |

## Branches

- Long-lived: `staging`, `dev`, `main`
- Release packaging merges `REVIEWED-ECP-{N}` branches from `staging`
  (release-manager workflow — see `.cursor/skills/package-deployment/`)
- **Do not assume a base branch.** `plan` resolves it once and records it.
