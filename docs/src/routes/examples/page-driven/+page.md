<script lang="ts">
  import Demo from '#lib/components/Demo.svelte';
  import setup from '#lib/examples/page-driven.ts';
  import code from '#lib/examples/page-driven.ts?highlight';
</script>

# Page-driven palette

The palette as part of a page's own UI rather than a hidden shortcut. The box below is an ordinary `<input>` on the page: typing in it opens the palette with what you typed, so no key is lost. The second button runs the best match for `rep` without showing a choice. Every event the element fires is reported under the buttons.

<Demo {setup} sources={[{file: 'page-driven.ts', html: code}]}>
<input name="jump" type="search" placeholder="Jump to…" autocomplete="off" class="h-8 w-48 rounded-md border border-edge bg-surface px-2 font-ui text-sm" />
<button type="button" name="lucky" class="h-8 rounded-md border border-edge bg-surface px-3 font-ui text-sm hover:border-accent" >Run the best match for “rep”</button>
</Demo>

## When this is useful

- **A search box in a header** that should behave like the palette, without building a second search: hand its text to `open({search})`.
- **Deep links that run a command**: read `?run=...` from the URL and call `open({search})` then `submit()`.
- **Restoring focus**: the `close` handler puts focus back in the page's box, so the keyboard user lands where they started.
- **Server search on no match**: `selected` fires with no action when <kbd>Enter</kbd> is pressed on an empty list, with the search text in `detail`.

[Opening and events](/docs/guide/events) covers each method and event.
