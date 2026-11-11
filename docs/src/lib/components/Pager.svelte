<script lang="ts">
  import Icon from './Icon.svelte';
  import {PAGES, pageAt} from '#lib/nav.ts';
  import {routeHref} from '#lib/route-href.ts';

  interface Props {
    /** The current route, without the base path. */
    path: string;
  }

  let {path}: Props = $props();

  const index = $derived(PAGES.findIndex((p) => p === pageAt(path)));
  const previous = $derived(index > 0 ? PAGES[index - 1] : null);
  const next = $derived(index === -1 ? null : PAGES[index + 1]);
</script>

{#if previous || next}
  <nav
    aria-label="Previous and next page"
    class="flex flex-wrap gap-4 border-t border-edge pt-6 font-ui"
  >
    {#if previous}
      <a
        href={routeHref(previous.path)}
        class="flex min-w-48 flex-1 flex-col gap-1 rounded-md border border-edge p-3 no-underline hover:border-accent"
      >
        <span class="flex items-center gap-1 text-xs text-ink-dim"
          ><Icon name="arrow-left" size={12} /> Previous</span
        >
        <span class="text-sm font-medium">{previous.title}</span>
      </a>
    {/if}
    {#if next}
      <a
        href={routeHref(next.path)}
        class="flex min-w-48 flex-1 flex-col items-end gap-1 rounded-md border border-edge p-3 text-end no-underline hover:border-accent"
      >
        <span class="flex items-center gap-1 text-xs text-ink-dim"
          >Next <Icon name="arrow-right" size={12} /></span
        >
        <span class="text-sm font-medium">{next.title}</span>
      </a>
    {/if}
  </nav>
{/if}
