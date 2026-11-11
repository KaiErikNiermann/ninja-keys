<script lang="ts">
  import Note from '#lib/components/Note.svelte';
</script>

# Installation

ninja-keys is one custom element, `<ninja-keys>`, built with Lit. It has two runtime dependencies, `lit` and `hotkeys-js`, and works in any page or framework that can put an element in the DOM.

<Note tone="warn">

**This fork is not on npm yet.** The `ninja-keys` package on npm is upstream's 1.2.2 from 2022, which has none of what these docs add: the `searcher` property, `ninja-keys/catsearch`, `open({search})`, `submit()`, the `open` and `close` events, typed events, and the hotkey fixes. Until it is published, install it from a build of this repository, as below.

</Note>

## From a build of this repository

```bash
git clone https://github.com/KaiErikNiermann/ninja-keys.git
cd ninja-keys
npm ci
npm run build
```

Then, in your project:

```bash
npm install ../ninja-keys
```

npm links the folder, so a later `npm run build` there is picked up without reinstalling.

## From npm

Once published, it installs like any package:

```bash
npm install ninja-keys
```

## Import it

Importing the package defines the element, once, for the whole page:

```ts
import 'ninja-keys';
```

The same module exports the element's class and every type, for TypeScript:

```ts
import type {INinjaAction, NinjaKeys, Searcher} from 'ninja-keys';

const ninja = document.querySelector('ninja-keys');
//    ^?
```

`document.querySelector('ninja-keys')` is typed as `NinjaKeys | null` without a cast: the package declares the tag in `HTMLElementTagNameMap`.

## Without a build step

The package is ES modules, so a page with no bundler can load it from a CDN that resolves bare imports, such as esm.sh or unpkg's `?module`:

```html
<script type="module" src="https://unpkg.com/ninja-keys?module"></script>
<ninja-keys></ninja-keys>
```

Pin a version in the URL for anything you ship. Until this fork is published, that URL serves upstream's 1.2.2, as above.

## catsearch, for field queries

The [field query searcher](/docs/guide/catsearch) lives at `ninja-keys/catsearch` and is built on the [catsearch](https://github.com/KaiErikNiermann/textual-catsearch/tree/main/js) package. catsearch is an optional peer dependency: install it next to ninja-keys only if you use that searcher. The main entry never loads it.

```bash
npm install catsearch
```

catsearch is not on npm yet either; its repository builds the same way, from its `js/` folder.

## Icons

Actions can show a [Material Icons](https://fonts.google.com/icons) glyph by name (`mdIcon`). For that, the element adds the Material Icons stylesheet from Google Fonts to the page when it connects, unless the page already has one. Set `noAutoLoadMdIcons` to stop it, for example when you use your own SVG icons or must not load third-party fonts. See [Actions and menus](/docs/guide/actions#icons).
