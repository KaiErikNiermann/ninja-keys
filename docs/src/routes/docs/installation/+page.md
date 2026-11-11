<script lang="ts">
  import Note from '#lib/components/Note.svelte';
</script>

# Installation

ninja-keys is one custom element, `<ninja-keys>`, built with Lit. It has two runtime dependencies, `lit` and `hotkeys-js`, and works in any page or framework that can put an element in the DOM.

```bash
pnpm add @appulsauce/ninja-keys    # or: npm install @appulsauce/ninja-keys
```

<Note>

This is a maintained fork of [ninja-keys](https://github.com/ssleptsov/ninja-keys), published as `@appulsauce/ninja-keys`. The unscoped `ninja-keys` package on npm is upstream's 1.2.2 from 2022, which has none of what these docs add: the `searcher` property, `@appulsauce/ninja-keys/catsearch`, `open({search})`, `submit()`, the `open` and `close` events, typed events, and the hotkey fixes. Moving over is a change of import path; the element is still `<ninja-keys>`.

</Note>

## Import it

Importing the package defines the element, once, for the whole page:

```ts
import '@appulsauce/ninja-keys';
```

The same module exports the element's class and every type, for TypeScript:

```ts
import type {INinjaAction, NinjaKeys, Searcher} from '@appulsauce/ninja-keys';

const ninja = document.querySelector('ninja-keys');
//    ^?
```

`document.querySelector('ninja-keys')` is typed as `NinjaKeys | null` without a cast: the package declares the tag in `HTMLElementTagNameMap`.

## Without a build step

The package is ES modules, so a page with no bundler can load it from a CDN that resolves bare imports, such as esm.sh or unpkg's `?module`:

```html
<script type="module" src="https://esm.sh/@appulsauce/ninja-keys@1.3.0"></script>
<ninja-keys></ninja-keys>
```

Pin a version in the URL, as here, for anything you ship.

## catsearch, for field queries

The [field query searcher](/docs/guide/catsearch) lives at `@appulsauce/ninja-keys/catsearch` and is built on the [catsearch](https://github.com/KaiErikNiermann/textual-catsearch/tree/main/js) package. catsearch is an optional peer dependency: install it next to `@appulsauce/ninja-keys` only if you use that searcher. The main entry never loads it.

```bash
pnpm add catsearch    # or: npm install catsearch
```

## Unreleased changes

To try what is on `main` before a release, build the repository and install the folder:

```bash
git clone https://github.com/KaiErikNiermann/ninja-keys.git
cd ninja-keys && pnpm install && pnpm run build
cd ../your-project && pnpm add ../ninja-keys
```

## Icons

Actions can show a [Material Icons](https://fonts.google.com/icons) glyph by name (`mdIcon`). For that, the element adds the Material Icons stylesheet from Google Fonts to the page when it connects, unless the page already has one. Set `noAutoLoadMdIcons` to stop it, for example when you use your own SVG icons or must not load third-party fonts. See [Actions and menus](/docs/guide/actions#icons).
