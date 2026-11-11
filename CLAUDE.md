# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

| Command | Purpose |
|---------|---------|
| `pnpm start` | Build + serve + watch (full dev environment) |
| `pnpm run build` | Compile TypeScript (`tsc`) to `dist/` |
| `pnpm run bundle` | Build + Rollup bundle → `dist/ninja-keys.bundled.js` |
| `pnpm run lint` | Run lit-analyzer + ESLint |
| `pnpm run lint:eslint` | ESLint only (`src/**/*.ts`) |
| `pnpm run format` | Prettier format all files |
| `pnpm test` | Run tests via @web/test-runner |
| `pnpm run test:watch` | Run tests in watch mode |
| `pnpm run docs` | Build the library and start the docs site dev server (`docs/`, SvelteKit) |
| `pnpm --dir docs run verify` | Docs: build library, type-check, lint (prettier/eslint/stylelint/semgrep), build site |
| `pnpm run checksize` | Check minified gzip size of bundle |
| `just` | Lists the Justfile recipes: the same commands plus versioning and release |
| `just version` / `just bump <kind>` / `just set-version X.Y.Z` / `just version-undo` | Show or rewrite the version in every place it is written (`scripts/version.ts`; `--dry-run` previews). `pnpm run lint` fails if they disagree |

Tests require `pnpm run build` first (they run against `dist/`).

## Architecture

ninja-keys is a framework-agnostic **Web Components** library (~1100 lines of TypeScript) that provides a keyboard shortcut command palette (Cmd+K interface). Built with **Lit 3** and **hotkeys-js**.

### Source Structure (`src/`)

Four Lit custom elements, the search layer and shared styles:

- **`ninja-keys.ts`** — `<ninja-keys>` main component. Central orchestrator: manages modal visibility, hotkey registration/cleanup (via hotkeys-js), action data flattening (nested → flat), search filtering, keyboard navigation (up/down/enter/esc/backspace), and breadcrumb state for nested menus. Emits `change` and `selected` events.
- **`ninja-header.ts`** — `<ninja-header>` search input + breadcrumb navigation. Emits `change` (search input), `setParent` (breadcrumb click), and `close` events.
- **`ninja-action.ts`** — `<ninja-action>` individual action/menu item. Renders icon (Material Icons font or custom SVG), title, and hotkey badges. Has `ensureInView()` for scroll management. Emits `actionsSelected`.
- **`ninja-footer.ts`** — `<ninja-footer>` keyboard hint bar with slottable content.
- **`searcher.ts`** — the `Searcher` contract (`searcher` property), `defaultSearcher` (regex over title + keywords) and `groupBySection`.
- **`catsearch.ts`** — `catsearchSearcher()`, the field query searcher built on the optional `catsearch` peer dependency (exported as `./catsearch`).
- **`base-styles.ts`** — Shared CSS (Lit `css` tagged template) with CSS custom properties for theming and modal animations.
- **`interfaces/ininja-action.ts`** — `INinjaAction` interface: `id`, `title`, optional `hotkey`, `handler`, `mdIcon`, `icon`, `parent`, `keywords`, `children`, `section`.
- **`ninja-keys.test.ts`**, **`catsearch.test.ts`** — Tests using @open-wc/testing + @web/test-runner.

### Data Flow

Actions can be provided as a flat list (using `parent` field to reference parent IDs) or as a nested tree (using `children` arrays). `ninja-keys` flattens nested data on update. The `parent` property on the component tracks the current menu level for breadcrumb navigation.

### Build Pipeline

TypeScript → `dist/*.js` (ESM, with `.d.ts` declarations) → Rollup bundles to `dist/ninja-keys.bundled.js` (minified ESM with inlined dependencies).

### Package Exports

- `.` → `dist/ninja-keys.js` (main component)
- `./ninja-header` → `dist/ninja-header.js` (header component)
- `./catsearch` → `dist/catsearch.js` (field query searcher; needs `catsearch` installed)
- ESM only (`"type": "module"`)

Published as `@appulsauce/ninja-keys` (fork of `ssleptsov/ninja-keys`; the tag stays `<ninja-keys>`). `files` limits the tarball to `dist/` and `custom-elements.json`. Package manager: pnpm (workspace: the library at the root, the docs site in `docs/`).

## Code Style

- **Prettier**: single quotes, no bracket spacing, trailing commas (es5), 2-space indent
- **ESLint 9**: flat config (`eslint.config.js`), `@typescript-eslint/no-explicit-any` is an error; unused vars prefixed with `_` are allowed
- **TypeScript 5**: strict mode, experimental decorators (Lit), target es2021/module es2022
- Lit components use `@customElement` decorator and `@property`/`@state` decorators for reactive properties

## CI & Hooks

- **GitHub Actions**: `lint.yml` and `test.yml` run on push/PR to main; `docs.yml` builds the docs site and deploys it to GitHub Pages from main
- **Dependabot**: weekly npm + GitHub Actions updates with grouped PRs
- **Husky pre-push**: runs build + lint + test, then the docs check, lint and build
