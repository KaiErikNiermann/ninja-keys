<script lang="ts">
  import Demo from '#lib/components/Demo.svelte';
  import setup from '#lib/examples/ranked-searcher.ts';
  import code from '#lib/examples/ranked-searcher.ts?highlight';
</script>

# Ranked searcher

The default search keeps the order of `data`. With many similar titles, the best match can end up far down the list. This searcher sorts instead: titles that start with the search first, then titles with a word that starts with it, then titles that merely contain it, then keyword matches.

<Demo
{setup}
sources={[{file: 'ranked-searcher.ts', html: code}]}
queries={[
{search: 'pa', note: 'Paste and Paste and match style first; Copy as path after'},
{search: 're', note: 'Reopen first, then Open recent (a word starts with it)'},
{search: 'paste', note: 'Compare with clipboard last, found by its keyword'},
{search: 'zzz', note: 'nothing matches: the notice says what Enter will do'},
]}
/>

## How it fits the contract

- The searcher returns `{actions, notice}`: [the contract](/docs/guide/search#the-searcher-contract) needs nothing more. The palette still groups the result by section, so ranking is within each section.
- On an empty search it hands over to `defaultSearcher`, so menus and the top level list exactly as before.
- The notice line under the input says what <kbd>Enter</kbd> will do when nothing matches, and the `selected` listener does it: `selected` fires with no action in that case.

Unlike the default, this one searches every level even inside a menu; filter by `context.root` (the open menu's id) to change that.
