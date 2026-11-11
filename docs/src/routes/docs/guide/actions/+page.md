# Actions and menus

Everything in the palette is an action: a command that runs, a link, or a menu that holds more actions. The element's `data` property takes them as an array of [`INinjaAction`](/api#INinjaAction).

## The action

```ts
import type {INinjaAction} from 'ninja-keys';

const action: INinjaAction = {
  id: 'export-pdf', // unique; menus and breadcrumbs refer to it
  title: 'Export as PDF', // shown and searched
  section: 'File', // grouping heading
  keywords: 'print save', // searched, not shown
  hotkey: 'ctrl+shift+e', // works with the palette closed too
  mdIcon: 'picture_as_pdf', // a Material Icons name
  handler: (self) => {
    console.log(`running ${self.id}`);
  },
};
```

Only `id` and `title` are required. Every field is described in the [API reference](/api#INinjaAction).

## Handlers and keeping the palette open

`handler` runs when the action is chosen, with Enter, a click, or its hotkey, and receives the action itself. The palette closes afterwards. Return `{keepOpen: true}` to keep it open, for actions people repeat (zoom, next page) or ones that open a menu:

```ts
import type {INinjaAction} from 'ninja-keys';
// ---cut---
const zoomIn: INinjaAction = {
  id: 'zoom-in',
  title: 'Zoom in',
  handler: () => {
    document.documentElement.style.fontSize = '110%';
    return {keepOpen: true};
  },
};
```

An action with children and no handler opens its menu. One with neither fires the `selected` event and leaves the palette open, which is enough when the page handles `selected` itself (see [Opening and events](/docs/guide/events)).

## Sections

Actions with the same `section` are grouped under it as a heading. Sections appear in the order their first action does, so order `data` the way the groups should read. Actions without a section form one group with no heading, placed where the first of them is.

## Menus

A menu is an action with `children`. Choosing it opens the menu: the list shows its children, a breadcrumb names it above the input, and <kbd>Backspace</kbd> on an empty search goes back up. Menus nest to any depth. They can be written two ways.

As a tree, with `children` holding the child actions:

```ts
import type {INinjaAction} from 'ninja-keys';
// ---cut---
const tree: INinjaAction[] = [
  {
    id: 'Theme',
    title: 'Change theme…',
    children: [
      {id: 'light', title: 'Light'},
      {id: 'dark', title: 'Dark'},
    ],
  },
];
```

Or as a flat list, where each child names its menu in `parent` and the menu lists the children's ids:

```ts
import type {INinjaAction} from 'ninja-keys';
// ---cut---
const flat: INinjaAction[] = [
  {id: 'Theme', title: 'Change theme…', children: ['light', 'dark']},
  {id: 'light', title: 'Light', parent: 'Theme'},
  {id: 'dark', title: 'Dark', parent: 'Theme'},
];
```

The element flattens a tree into the second form itself, so pick whichever your data already is. A flat list suits data from a server or a database; a tree suits menus written by hand. A tree's children are given their `parent` from where they sit.

The breadcrumbs show the menu's `id`, so give menus readable ids (`'Theme'`, not `'menu-3'`).

### Opening a menu directly

`open({parent})` opens the palette inside a menu. A menu action's own hotkey can do it, so the hotkey jumps straight to the choices:

```ts
import type {INinjaAction, NinjaKeys} from 'ninja-keys';
declare const ninja: NinjaKeys;
// ---cut---
const theme: INinjaAction = {
  id: 'Theme',
  title: 'Change theme…',
  hotkey: 'alt+t',
  children: ['light', 'dark'],
  handler: () => {
    ninja.open({parent: 'Theme'});
    return {keepOpen: true};
  },
};
```

Search at the top level looks through every level, so `dark` finds the Dark action inside the Theme menu without opening it. Inside a menu, search looks only at that menu's own actions (the [catsearch searcher](/docs/guide/catsearch) searches everything below the menu instead).

## Icons

`mdIcon` takes a [Material Icons](https://fonts.google.com/icons) name. The element loads that font from Google Fonts when it connects, unless the page already links it or `noAutoLoadMdIcons` is set.

`icon` takes HTML instead, usually an SVG. Give it the `ninja-icon` class so it is sized and coloured like the built-in icons (`--ninja-icon-size`, `--ninja-icon-color`):

```ts
import type {INinjaAction} from 'ninja-keys';
// ---cut---
const search: INinjaAction = {
  id: 'search',
  title: 'Search projects…',
  icon: `<svg class="ninja-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
};
```

`icon` is rendered as HTML, unescaped. Build it only from markup you control, never from user input. This site's palette uses [lucide](https://lucide.dev) icons this way.

## Changing the actions

Assign a new array to `data` to change the actions; the element re-flattens it and rebinds every action hotkey, releasing the old ones. Mutating the array in place does not re-render it. Assigning the same array again does, which keeps frameworks that wrap data in proxies working.
