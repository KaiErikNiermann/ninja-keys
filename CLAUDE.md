# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Build + serve + watch (full dev environment) |
| `npm run build` | Compile TypeScript (`tsc`) to `dist/` |
| `npm run bundle` | Build + Rollup bundle → `dist/ninja-keys.bundled.js` |
| `npm run lint` | Run lit-analyzer + ESLint |
| `npm run lint:eslint` | ESLint only (`src/**/*.ts`) |
| `npm run format` | Prettier format all files |
| `npm test` | Run tests via @web/test-runner |
| `npm run test:watch` | Run tests in watch mode |
| `npm run demo` | Compile, bundle, and serve demo from `docs/` |
| `npm run checksize` | Check minified gzip size of bundle |

Tests require `npm run build` first (they run against `dist/`).

## Architecture

ninja-keys is a framework-agnostic **Web Components** library (~1100 lines of TypeScript) that provides a keyboard shortcut command palette (Cmd+K interface). Built with **Lit 3** and **hotkeys-js**.

### Source Structure (`src/`)

Four Lit custom elements + shared styles:

- **`ninja-keys.ts`** — `<ninja-keys>` main component. Central orchestrator: manages modal visibility, hotkey registration/cleanup (via hotkeys-js), action data flattening (nested → flat), search filtering, keyboard navigation (up/down/enter/esc/backspace), and breadcrumb state for nested menus. Emits `change` and `selected` events.
- **`ninja-header.ts`** — `<ninja-header>` search input + breadcrumb navigation. Emits `change` (search input), `setParent` (breadcrumb click), and `close` events.
- **`ninja-action.ts`** — `<ninja-action>` individual action/menu item. Renders icon (Material Icons font or custom SVG), title, and hotkey badges. Has `ensureInView()` for scroll management. Emits `actionsSelected`.
- **`ninja-footer.ts`** — `<ninja-footer>` keyboard hint bar with slottable content.
- **`base-styles.ts`** — Shared CSS (Lit `css` tagged template) with CSS custom properties for theming and modal animations.
- **`interfaces/ininja-action.ts`** — `INinjaAction` interface: `id`, `title`, optional `hotkey`, `handler`, `mdIcon`, `icon`, `parent`, `keywords`, `children`, `section`.
- **`ninja-keys.test.ts`** — Tests using @open-wc/testing + @web/test-runner.

### Data Flow

Actions can be provided as a flat list (using `parent` field to reference parent IDs) or as a nested tree (using `children` arrays). `ninja-keys` flattens nested data on update. The `parent` property on the component tracks the current menu level for breadcrumb navigation.

### Build Pipeline

TypeScript → `dist/*.js` (ESM, with `.d.ts` declarations) → Rollup bundles to `dist/ninja-keys.bundled.js` (minified ESM with inlined dependencies).

### Package Exports

- `.` → `dist/ninja-keys.js` (main component)
- `./ninja-header` → `dist/ninja-header.js` (header component)
- ESM only (`"type": "module"`)

## Code Style

- **Prettier**: single quotes, no bracket spacing, trailing commas (es5), 2-space indent
- **ESLint 9**: flat config (`eslint.config.js`), `@typescript-eslint/no-explicit-any` is an error; unused vars prefixed with `_` are allowed
- **TypeScript 5**: strict mode, experimental decorators (Lit), target es2021/module es2022
- Lit components use `@customElement` decorator and `@property`/`@state` decorators for reactive properties

## CI & Hooks

- **GitHub Actions**: `lint.yml` and `test.yml` run on push/PR to main
- **Dependabot**: weekly npm + GitHub Actions updates with grouped PRs
- **Husky pre-push**: runs build + lint + test before push
