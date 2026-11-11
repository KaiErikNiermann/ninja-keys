<script lang="ts">
  import Demo from '#lib/components/Demo.svelte';
  import setup from '#lib/examples/query-cookbook.ts';
  import code from '#lib/examples/query-cookbook.ts?highlight';
</script>

# Query cookbook

A documentation tree, three levels deep (area, topic, page), where each page carries data the palette never shows: a kind, tags, the year it was last updated, and whether it is a draft. Four fields declared over those properties turn them into queries, and catsearch completes their names and values from the actions themselves. This is the shape of a docs site's search, a settings screen, or a file tree.

<Demo
{setup}
sources={[{file: 'query-cookbook.ts', html: code}]}
placeholder="Try kind:, tag:, updated:, is:"
queries={[
{search: 'shadow', note: 'plain words still search titles and keywords'},
{search: 'kind:page', note: 'only leaves, no areas or topics'},
{search: 'under.title:rendering kind:page', note: 'every page below one area'},
{search: 'tag:gpu updated:>=2026', note: 'recent GPU material'},
{search: 'updated:2023..2024', note: 'a range: what may be out of date'},
{search: 'is:draft', note: 'unfinished pages, for an editor'},
{search: 'parent.title:profiling -is:draft', note: 'published pages in one topic'},
{search: '(tag:baking OR kw:cascades) under.title:rendering', note: 'grouped alternatives within an area'},
{search: 'tag:none kind:page', note: 'pages nobody has tagged yet'},
{search: 'kind:page under.', note: 'a half-typed path: the completions show what can follow'},
]}
/>

## The fields

```ts
import type {INinjaAction} from 'ninja-keys';
interface Doc extends INinjaAction {
  readonly kind: 'area' | 'topic' | 'page';
  readonly tags: readonly string[];
  readonly updated: number;
  readonly draft: boolean;
}
// ---cut---
import {catsearchSearcher} from 'ninja-keys/catsearch';
import {enumField, flagField, numberField, textField} from 'catsearch';

const searcher = catsearchSearcher<Doc>({
  fields: [
    enumField<Doc>({
      name: 'kind',
      get: (d) => d.kind,
      choices: ['area', 'topic', 'page'],
    }),
    textField<Doc>({name: 'tag', get: (d) => d.tags}),
    numberField<Doc>({name: 'updated', get: (d) => d.updated}),
    flagField<Doc>({
      name: 'is',
      flags: {draft: (d) => d.draft, published: (d) => !d.draft},
    }),
  ],
});
```

Choose the field kind by the question people will ask of it:

| Kind          | Use for                                       | Because                                                                                                     |
| ------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `enumField`   | a fixed set of values: kind, status, type     | it matches whole values, so `kind:page` never matches "pager"; `choices` completes values no action has yet |
| `textField`   | free text and lists: tags, authors, paths     | it matches substrings, and `get` can return an array                                                        |
| `numberField` | dates, sizes, counts, priorities              | it takes ranges: `2023..2024`, `>=2026`, `<10`                                                              |
| `flagField`   | yes/no states with names: draft, pinned, read | several named predicates under one key: `is:draft`, `is:published`                                          |

## Recipes

**Narrow, then search.** Put the structural part first and the words last: `under.title:audio kind:page occlusion`. The completions keep up while you type the words.

**Find stale content.** `updated:<2025 -is:draft` lists published pages not touched since 2024: a review queue.

**Find gaps.** `none` matches an empty field: `tag:none` for untagged pages, `section:none` for actions outside any section.

**Scope to the open menu.** Inside a menu, a query searches only below it, so opening Rendering and typing `kind:page` lists Rendering's pages without saying `under.`.

**Link to a search.** A query is text, so a link can carry one: read it from the URL and pass it to `open({search})` (see the [page-driven example](/examples/page-driven)).

Every operator is in the [catsearch guide](/docs/guide/catsearch#the-language).
