# Quickstart

A working palette takes the element, a list of actions, and nothing else. This page builds one; the [basic example](/examples/basic) has the same thing running.

## Put the element on the page

Anywhere in the body; it draws nothing until it opens, and then covers the page.

```html
<ninja-keys placeholder="Type a command"></ninja-keys>
<script type="module" src="./main.ts"></script>
```

## Give it actions

`data` takes an array of actions. Each has an `id` and a `title`; a `handler` runs when it is chosen.

```ts
import 'ninja-keys';
import type {INinjaAction} from 'ninja-keys';

const actions: INinjaAction[] = [
  {
    id: 'home',
    title: 'Go home',
    section: 'Navigation',
    mdIcon: 'home',
    hotkey: 'alt+h',
    handler: () => {
      location.assign('/');
    },
  },
  {
    id: 'theme',
    title: 'Toggle dark mode',
    section: 'Appearance',
    mdIcon: 'dark_mode',
    keywords: 'light colour scheme',
    handler: () => {
      document.documentElement.classList.toggle('dark');
    },
  },
];

const ninja = document.querySelector('ninja-keys');
if (ninja) ninja.data = actions;
```

## Open it

Press <kbd>Ctrl</kbd> <kbd>K</kbd>, or <kbd>⌘</kbd> <kbd>K</kbd> on a Mac, to open and close it. Typing searches titles and keywords; the arrow keys move; <kbd>Enter</kbd> runs the selected action; <kbd>Esc</kbd> closes. The `hotkey` of each action works with the palette closed too: <kbd>Alt</kbd> <kbd>H</kbd> goes home from anywhere on the page.

From your own button:

```ts
import type {NinjaKeys} from 'ninja-keys';
declare const ninja: NinjaKeys;
// ---cut---
document.querySelector('#search-button')?.addEventListener('click', () => {
  ninja.open();
});
```

## Where next

- [Actions and menus](/docs/guide/actions): nested menus, sections, icons.
- [Hotkeys](/docs/guide/hotkeys): the palette's own keys and how to change them.
- [Search](/docs/guide/search): replace how the palette searches, or use [field queries](/docs/guide/catsearch).
- [Styling](/docs/guide/styling): dark mode, CSS properties and shadow parts.
- [Frameworks](/docs/guide/frameworks): React, Vue and Svelte.
