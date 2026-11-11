<!--
  The site search: one <ninja-keys> over every page, heading and API symbol,
  searched with catsearch (`kind:event`, `under.title:guide`, ...).
-->
<script lang="ts">
  import {goto} from '$app/navigation';
  import type {NinjaKeys} from '@appulsauce/ninja-keys';

  import type {SearchEntry} from '#lib/search/entries.ts';
  import {theme} from '#lib/theme.svelte.ts';
  import {routeHref} from '#lib/route-href.ts';

  interface Props {
    dark: boolean;
  }

  let {dark}: Props = $props();

  let element: NinjaKeys | undefined = $state();
  let ready: Promise<void> | undefined;

  async function load(palette: NinjaKeys): Promise<void> {
    // The element and catsearch touch the DOM when defined, so they load in
    // the browser only; the pages themselves are prerendered.
    const [, {siteActions, siteSearcher}, response] = await Promise.all([
      import('@appulsauce/ninja-keys'),
      import('#lib/search/palette.ts'),
      fetch(routeHref('/search.json')),
    ]);
    if (!response.ok) {
      throw new Error(`search index: HTTP ${response.status}`);
    }
    const entries = (await response.json()) as SearchEntry[];
    palette.searcher = siteSearcher;
    palette.data = siteActions(entries, {
      navigate: (path) => void goto(routeHref(path)),
      setTheme: (choice) => theme.set(choice),
      openAt: (parent) => palette.open({parent}),
    });
  }

  $effect(() => {
    if (element && !ready) ready = load(element);
  });

  /** Open the palette, once it has loaded, optionally with a search typed. */
  export async function open(search?: string): Promise<void> {
    await ready;
    element?.open(search === undefined ? {} : {search});
  }
</script>

<ninja-keys
  bind:this={element}
  class={{dark}}
  placeholder="Search the docs, or a field: kind:event, under.title:guide"
  noAutoLoadMdIcons
>
  <div slot="footer" class="palette-footer">
    <span><kbd>↵</kbd> go</span>
    <span><kbd>Tab</kbd> complete</span>
    <span><kbd>Esc</kbd> close</span>
    <span class="ms-auto">ninja-keys + catsearch</span>
  </div>
</ninja-keys>

<style>
  /* The palette reads these from its host, so it follows the site's
     tokens in both themes. */
  ninja-keys {
    --ninja-width: min(42rem, 100vw - 2rem);
    --ninja-top: 12vh;
    --ninja-font-size: 1.125rem;
    --ninja-z-index: 20;
    --ninja-font-family: var(--font-ui);
    --ninja-code-font-family: var(--font-mono);
    --ninja-text-color: var(--color-ink);
    --ninja-accent-color: var(--color-accent);
    --ninja-modal-background: var(--color-surface);
    --ninja-overflow-background: color-mix(
      in oklch,
      var(--color-surface) 60%,
      transparent
    );
    --ninja-backdrop-filter: blur(4px);
    --ninja-secondary-background-color: var(--color-raised);
    --ninja-secondary-text-color: var(--color-ink-dim);
    --ninja-selected-background: var(--color-accent-soft);
    --ninja-selected-text-color: var(--color-ink);
    --ninja-group-text-color: var(--color-ink-dim);
    --ninja-footer-background: var(--color-raised);
    --ninja-placeholder-color: var(--color-ink-dim);
    --ninja-separate-border: var(--hairline);
    --ninja-modal-shadow: var(--shadow-pop);
    --ninja-actions-height: min(24rem, 55vh);
    --ninja-icon-size: 1em;
  }

  .palette-footer {
    display: flex;
    flex-wrap: wrap;
    gap: calc(var(--spacing) * 4);
    padding-block: calc(var(--spacing) * 2);
    padding-inline: calc(var(--spacing) * 4);
    border-block-start: var(--hairline);
    background: var(--color-raised);
    color: var(--color-ink-dim);
    font-family: var(--font-ui);
    font-size: var(--text-xs);
  }

  .palette-footer kbd {
    padding-inline: calc(var(--spacing) * 1);
    border: var(--hairline);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
  }
</style>
