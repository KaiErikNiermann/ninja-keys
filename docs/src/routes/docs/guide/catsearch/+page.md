<script lang="ts">
  import Note from '#lib/components/Note.svelte';
</script>

# catsearch queries

`@appulsauce/ninja-keys/catsearch` is a searcher that reads the search box as a query in a small language: plain words as before, plus fields (`section:git`), negation, alternatives, and paths up the menu tree (`under.title:settings`). Completions for field names and values appear under the input as you type. It is built on [catsearch](https://github.com/KaiErikNiermann/textual-catsearch/tree/main/js), the web port of the Python [textual-catsearch](https://github.com/KaiErikNiermann/textual-catsearch), which uses the same language in terminal apps.

```ts
import type {NinjaKeys} from '@appulsauce/ninja-keys';
declare const ninja: NinjaKeys;
// ---cut---
import {catsearchSearcher} from '@appulsauce/ninja-keys/catsearch';

ninja.searcher = catsearchSearcher();
```

Install `catsearch` next to `@appulsauce/ninja-keys` first (see [Installation](/docs/installation#catsearch-for-field-queries)). The main `@appulsauce/ninja-keys` entry never imports it.

## Why queries in a palette

A palette with a few dozen actions needs nothing more than words. Queries pay off when the list is long and structured, which is when a palette starts to stand in for navigation:

- **Many actions with the same words.** "Delete branch", "Delete file", "Delete row" all match `delete`; `delete parent.title:git` or `delete section:git` keeps the one you mean.
- **Deep trees.** Docs, settings, file trees. Search at the top level finds a leaf only by its own words; `under.title:rendering` lists everything below a branch, however deep.
- **Metadata people know.** Kind, tags, dates, status: `kind:page updated:>=2026 -is:draft` is one line instead of a filter UI (see [custom fields](#fields-of-your-own)).
- **Shareable searches.** A query is text, so it can go in a link and run through `open({search})`.

## The language

| Query                                      | Matches                                                           |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `commit push`                              | actions whose title or keywords contain both words                |
| `title:branch`                             | the title contains "branch"                                       |
| `keyword:remote`, `kw:remote`              | a keyword contains "remote"                                       |
| `section:git`                              | the section is Git; `section:git,editor` for either               |
| `section:none`                             | actions with no section                                           |
| `has:hotkey`, `has:children`, `has:parent` | actions with a hotkey, that open a menu, that are inside one      |
| `parent.title:branches`                    | actions directly inside the menu titled Branches                  |
| `under.title:git`                          | actions anywhere below Git, however deep                          |
| `-section:view`, `!section:view`           | negation                                                          |
| `a OR b`, `a \| b`                         | either; binds tighter than a space, so `a OR b c` is `(a OR b) c` |
| `(…)`, `-(…)`                              | grouping, and negating a group                                    |
| `title:"new branch"`                       | quotes make one value with spaces                                 |

Matching ignores case and accents. Different fields AND; the same field written twice ORs (`section:git section:editor` is `section:git,editor`). A path asks its question of the actions the relation leads to: `parent.has:hotkey` is "inside a menu that has a hotkey".

The parser never fails. An unknown field (a typo such as `secton:git`) is searched as text and reported on the notice line under the input; a half-typed `section:` constrains nothing yet. So every keystroke shows something sensible.

## How it behaves in the palette

- **An empty box** lists the open menu, exactly like the default search.
- **A query** searches every level below the open menu, not only its own actions. At the top level that is everything; inside Git it is everything under Git.
- **Completions** appear for the word under the caret: field names (`sec` offers `section:`), values from your actions (`section:` offers each section, most used first), and relations (`under.`). <kbd>Tab</kbd> takes the first; click any. Nothing is offered while the caret sits after a space, so a finished query has no row of chips under it.
- **Order** is the order of `data`, grouped by section.

<Note>

The completions come from the actions themselves, so `section:` offers exactly the sections you have and `kind:` (below) the kinds. The index behind them is rebuilt only when `data` is set again.

</Note>

## Fields of your own

Actions can carry properties of their own, and `catsearchSearcher` takes fields over them. Type the actions as an interface extending `INinjaAction` and build the fields with catsearch's constructors:

```ts
import type {INinjaAction, NinjaKeys} from '@appulsauce/ninja-keys';
declare const ninja: NinjaKeys;
// ---cut---
import {catsearchSearcher} from '@appulsauce/ninja-keys/catsearch';
import {enumField, flagField, numberField, textField} from 'catsearch';

interface Doc extends INinjaAction {
  kind: 'guide' | 'reference' | 'example';
  tags: string[];
  updated: number;
  draft: boolean;
}

ninja.searcher = catsearchSearcher<Doc>({
  fields: [
    enumField<Doc>({
      name: 'kind',
      get: (d) => d.kind,
      detail: 'guide, reference or example',
    }),
    textField<Doc>({name: 'tag', get: (d) => d.tags, aliases: ['t']}),
    numberField<Doc>({name: 'updated', get: (d) => d.updated}),
    flagField<Doc>({
      name: 'is',
      flags: {draft: (d) => d.draft, published: (d) => !d.draft},
    }),
  ],
});
// kind:guide tag:gpu updated:>=2026 -is:draft
```

| Constructor   | Matches                                                                 | Query                                  |
| ------------- | ----------------------------------------------------------------------- | -------------------------------------- |
| `textField`   | a substring, ignoring case and accents; `get` may return several values | `tag:gp`                               |
| `enumField`   | a whole value, ignoring case and accents                                | `kind:guide`                           |
| `numberField` | a number or a range                                                     | `updated:2024..2026`, `updated:>=2026` |
| `flagField`   | named yes/no predicates                                                 | `is:draft`                             |

Every field takes `aliases` and a `detail` shown beside its completions. A name or alias that clashes with a built-in field (`title`, `keyword`, `section`, `has`) makes the constructor throw, at once rather than at the first search.

The [query cookbook](/examples/query-cookbook) runs these fields over a docs tree, with a query for each kind of question.

## Options

`catsearchSearcher(options)` takes:

- `fields`: more fields, after the built-in ones.
- `relations`: more relations, after `parent` and `under`, built with catsearch's `relation()`. A relation follows from an action to other actions, such as "links to" or "same author".
- `limit`: how many completions to offer at once; 10 by default.

The full signatures are in the [API reference](/api#CatsearchOptions).
