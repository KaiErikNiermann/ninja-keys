# Search

How the palette decides what a search shows is replaceable. Out of the box it matches text; set the `searcher` property to rank results your way, query fields, add a line of help under the input, or offer completions.

## The default search

With no `searcher` set, the search text is read as a case-insensitive regular expression over each action's `title` and `keywords`. Text that is not a valid expression (a lone `(` or `[`) is matched as a plain substring instead, so typing never breaks the list.

- At the top level, a search looks through every level, so `dark` finds an action inside a Theme menu.
- Inside a menu, it looks only at that menu's own actions.
- An empty search shows the actions of the open menu (the top level when none is).

Matches keep the order of `data` and are grouped by section. This search is exported as `defaultSearcher`, for searchers that wrap it.

## The searcher contract

A searcher is a function from the search text to what the palette shows:

```ts
import type {Searcher} from '@appulsauce/ninja-keys';
// ---cut---
const searcher: Searcher = (search, actions, context) => {
  //                        ^?
  return {actions: [], notice: '', suggestions: []};
};
```

It receives:

- `search`: the text in the box.
- `actions`: every action, flattened, so a tree's children are ids and each child has its `parent`. The array is the same object until `data` is set again.
- `context.root`: the id of the open menu, or `undefined` at the top level.
- `context.cursor`: where the caret is in `search`, for completing the word under it.

It returns a [`SearchResult`](/api#SearchResult):

- `actions`: the actions to show, in the order to show them. The palette still groups them by section, in the order sections first appear.
- `notice` (optional): one line shown under the input, such as "no field called `foo`" or "Enter searches the web".
- `suggestions` (optional): completions, shown as chips under the input. Clicking one, or <kbd>Tab</kbd> for the first, replaces the search with its `search` text and puts the caret at its `cursor`.

The palette calls the searcher on every render, which is every keystroke and more. Keep it cheap: anything derived from `actions` alone (an index, a lookup by id) can be built once and cached on the array's identity.

```ts
import type {INinjaAction, Searcher} from '@appulsauce/ninja-keys';
// ---cut---
let indexed: readonly INinjaAction[] | undefined;
let byId = new Map<string, INinjaAction>();

const searcher: Searcher = (search, actions) => {
  if (actions !== indexed) {
    indexed = actions;
    byId = new Map(actions.map((a) => [a.id, a]));
  }
  const parentTitle = (a: INinjaAction) =>
    byId.get(a.parent ?? '')?.title ?? '';
  const query = search.toLowerCase();
  return {
    actions: actions.filter((a) =>
      `${parentTitle(a)} ${a.title}`.toLowerCase().includes(query)
    ),
  };
};
```

## Wrapping the default

To keep the default's matching and add to it, call `defaultSearcher` and change its result:

```ts
import {defaultSearcher} from '@appulsauce/ninja-keys';
import type {NinjaKeys, Searcher} from '@appulsauce/ninja-keys';
declare const ninja: NinjaKeys;
// ---cut---
const withHelp: Searcher = (search, actions, context) => {
  const result = defaultSearcher(search, actions, context);
  return {
    ...result,
    notice:
      result.actions.length === 0
        ? 'Nothing here. Enter searches the API.'
        : '',
  };
};

ninja.searcher = withHelp;
```

Pair a notice like that with a `selected` listener, which fires with no action when Enter is pressed on an empty list (see [Events](/docs/guide/events#selected-or-handler)).

## Searchers in these docs

- [Ranked searcher](/examples/ranked-searcher): prefix matches before word matches before substrings, with a notice.
- [catsearch queries](/docs/guide/catsearch): a field query language with completions, shipped as `@appulsauce/ninja-keys/catsearch`. This site's own search uses it; press <kbd>Ctrl</kbd> <kbd>K</kbd> and type `kind:event`.
