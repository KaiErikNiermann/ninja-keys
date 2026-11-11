# Opening and events

The palette can be driven from the page as well as from the keyboard: four methods open, close and run it, and four events say what happened. The [page-driven example](/examples/page-driven) uses all of them.

## Methods

```ts
import type {NinjaKeys} from 'ninja-keys';
declare const ninja: NinjaKeys;
// ---cut---
ninja.open(); // at the top level
ninja.open({parent: 'Theme'}); // inside the Theme menu
ninja.open({search: 'exp'}); // with "exp" already typed
await ninja.submit(); // run the selected action, as Enter does
ninja.setParent('Theme'); // move to a menu while open
ninja.close();
```

### Opening with a search

`open({search})` starts the search box with that text and searches it, as if it had been typed (without a `change` event: nothing was typed). It is for a page that opens the palette on a key press: pass on what the user typed while it was opening, instead of dropping it or letting it land in the page.

```ts
import type {NinjaKeys} from 'ninja-keys';
declare const ninja: NinjaKeys;
// ---cut---
// Any printable key on the page opens the palette with that key typed.
document.addEventListener('keydown', (event) => {
  const typing = event.target instanceof HTMLInputElement;
  if (typing || event.key.length !== 1 || event.ctrlKey || event.metaKey)
    return;
  event.preventDefault();
  ninja.open({search: event.key});
});
```

### Running an action from code

`submit()` does what Enter does: runs the selected action, or opens its menu. After `open({search})` the selected action is the first match, so the two together run "the best match for this text", like a browser's I'm-feeling-lucky. With the palette closed, or nothing matching, `submit()` does nothing. It waits for the element to apply a search set just before it, and its promise resolves once the action has run.

```ts
import type {NinjaKeys} from 'ninja-keys';
declare const ninja: NinjaKeys;
// ---cut---
const params = new URLSearchParams(location.search);
const command = params.get('run');
if (command) {
  ninja.open({search: command});
  await ninja.submit();
}
```

## Events

| Event      | When                                                            | `detail`                                                                                     |
| ---------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `change`   | the search text changes                                         | [`NinjaChangeDetail`](/api#NinjaChangeDetail): `search`, and the `actions` now shown         |
| `selected` | an action is chosen, or Enter is pressed with nothing to choose | [`NinjaSelectedDetail`](/api#NinjaSelectedDetail): `search`, and the `action` or `undefined` |
| `open`     | the palette becomes visible, however it was opened              | `null`                                                                                       |
| `close`    | the palette is hidden, however it was closed                    | `null`                                                                                       |

All four bubble and cross the shadow boundary (`composed`), so a listener on a parent element or the document hears them too.

The events are typed. `addEventListener` on a `NinjaKeys` knows each event's `detail`, so listeners need no cast:

```ts
import type {NinjaKeys} from 'ninja-keys';
declare const ninja: NinjaKeys;
// ---cut---
ninja.addEventListener('selected', (event) => {
  const {action, search} = event.detail;
  //     ^?
  if (!action) {
    // Enter on no match: hand the text to a server search.
    void fetch(`/api/search?q=${encodeURIComponent(search)}`);
  }
});
```

### `selected` or `handler`?

Both run when an action is chosen. Put an action's own behaviour in its `handler`; that keeps it next to the action and runs from its hotkey too (`selected` does not fire for a hotkey). Use `selected` for what is common to every choice, such as analytics, and for the case `handler` cannot see: Enter with no match.

### `open` and `close`

They fire once per change of visibility, whatever caused it: a method call, the open key, Escape, a click on the overlay, or an action that closed it. Use them to restore focus to where it was, pause something behind the palette, or track usage:

```ts
import type {NinjaKeys} from 'ninja-keys';
declare const ninja: NinjaKeys;
// ---cut---
let returnTo: Element | null = null;
ninja.addEventListener('open', () => {
  returnTo = document.activeElement;
});
ninja.addEventListener('close', () => {
  if (returnTo instanceof HTMLElement) returnTo.focus();
});
```

`visible` tells whether the palette is open right now.
