# Contributing

How the library and this site are built, tested and documented, for anyone changing either.

## The library

The source is about 1,800 lines of TypeScript in `src/`: four Lit elements and the searchers.

| File              | Holds                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `ninja-keys.ts`   | `<ninja-keys>`: visibility, hotkeys, flattening `data`, keyboard navigation, menus, events |
| `ninja-header.ts` | the input, breadcrumbs, and the completion and notice line                                 |
| `ninja-action.ts` | one row: icon, title, hotkey badges                                                        |
| `ninja-footer.ts` | the default footer                                                                         |
| `searcher.ts`     | the `Searcher` contract, `defaultSearcher`, `groupBySection`                               |
| `catsearch.ts`    | `@appulsauce/ninja-keys/catsearch`                                                                     |
| `base-styles.ts`  | the shared styles and the `--ninja-*` defaults                                             |

### Commands

Run from the repository root.

| Command           | Does                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm run build`  | compiles `src/` to `dist/` with `tsc`                                                          |
| `pnpm test`       | runs the tests in a headless browser (@web/test-runner); build first, they run against `dist/` |
| `pnpm run lint`   | lit-analyzer and ESLint (typescript-eslint, sonarjs, unicorn, security)                        |
| `pnpm run analyze` | regenerates `custom-elements.json` from the source                                             |
| `pnpm run format` | Prettier                                                                                       |
| `pnpm run docs`   | builds the library and starts this site's dev server                                           |

The husky pre-push hook runs build, lint and test, then checks, lints and builds the docs site, whose code blocks compile against the library.

### Documenting a change

The [API reference](/api) is generated from the source, so documenting a change means writing its comments:

- A public property, method, interface field or exported function gets a doc comment. TypeDoc and the custom elements manifest both read it.
- An event, slot, shadow part or CSS property is declared on the `NinjaKeys` class with `@fires`, `@slot`, `@csspart` or `@cssprop` (with its default, `[--ninja-x=default]`). The manifest reads these; nothing else would know about them.
- Run `pnpm run analyze` and commit the regenerated `custom-elements.json` with the change. Editors read it for completions.

## This site

The site is in `docs/`: SvelteKit with mdsvex for the Markdown pages, Tailwind 4, prerendered to static HTML. It is a package in the repository's pnpm workspace and uses the library as `workspace:*`, so it always shows the current source.

```bash
pnpm install                    # the library and the site: one pnpm workspace
pnpm run docs                   # dev server on :5175
pnpm --dir docs run verify      # build the library, type-check, lint, build the site
```

### How a page is made

- Guide pages are Markdown, at `src/routes/docs/**/+page.md`. Root-relative links (`/docs/guide/search`) get the deploy's base path added at build.
- The sidebar, page titles, previous/next links and the site search all come from one list, `src/lib/nav.ts`; a new page goes there too.
- The API page reads `../custom-elements.json` and TypeDoc's JSON of `../src` (`pnpm --dir docs run api`), in `src/lib/server/api.ts`.
- The site search index is built at prerender from the nav, each Markdown page's headings and the API, and served as `/search.json`.

### Code blocks are compiled

Every `ts` and `js` block is type-checked by [twoslash](https://twoslash.netlify.app) against the real `@appulsauce/ninja-keys` and `catsearch` types when the site builds, and a block with a type error fails the build. That is also where the hover types in the blocks come from.

- Declarations a snippet needs but the reader does not go above a `// ---cut---` line, which hides them.
- `// ^?` under an identifier shows its type inline.
- A block that is deliberately not complete code takes `notwoslash` after the language on its opening fence.

### Examples run what they show

Each example is a module in `src/lib/examples/` whose default export sets up a palette. The example page imports it twice: once to run it in a `<Demo>`, and once with `?highlight` to show its source, highlighted and type-checked like any other block. So the code on the page is the code that ran. Example modules import only from packages (`ninja-keys`, `@appulsauce/ninja-keys/catsearch`, `catsearch`), since twoslash checks each file on its own.

### Checks

`pnpm --dir docs run lint` runs Prettier, ESLint (with `@eslint/css`), Stylelint and the principled-css semgrep rules (from a Poetry environment in `docs/.lint`). All colours, sizes and spaces in the site's CSS come from `src/styles/tokens.css`; Stylelint rejects a literal anywhere else.
