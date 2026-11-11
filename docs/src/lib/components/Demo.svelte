<!--
  A live example: its own <ninja-keys>, set up by an example module, with
  the module's source under it. The palette here opens from the button (or
  a query) only, so Ctrl/Cmd+K stays the site search.
-->
<script lang="ts" module>
  import type {NinjaKeys} from '@appulsauce/ninja-keys';

  /** What an example module's default export receives. */
  export type Setup = (
    ninja: NinjaKeys,
    report: (message: string) => void,
    page: HTMLElement
  ) => void;

  /** A file shown under the demo: its name and highlighted source. */
  export interface Source {
    readonly file: string;
    /** From `import html from '...?highlight'`. */
    readonly html: string;
  }

  export interface Query {
    readonly search: string;
    readonly note: string;
  }
</script>

<script lang="ts">
  import type {Snippet} from 'svelte';

  import Icon from './Icon.svelte';
  import {theme} from '#lib/theme.svelte.ts';

  interface Props {
    /** The example module's default export. */
    setup: Setup;
    /** The files that make this demo, shown under it in order. */
    sources?: readonly Source[];
    /** Queries to run, each a button that opens the palette with it. */
    queries?: readonly Query[];
    /** Classes for the element; `dark` follows the site unless `themed`. */
    themed?: string;
    /** Placeholder of the demo's input. */
    placeholder?: string;
    /** Extra page content the example drives (inputs, buttons). */
    children?: Snippet;
  }

  let {
    setup,
    sources = [],
    queries = [],
    themed = '',
    placeholder = 'Type a command or search...',
    children,
  }: Props = $props();

  let ninja: NinjaKeys | undefined = $state();
  let page: HTMLElement | undefined = $state();
  let log = $state<readonly string[]>([]);
  let ready: Promise<void> | undefined;

  const report = (message: string) => {
    log = [message, ...log].slice(0, 4);
  };

  $effect(() => {
    if (ninja === undefined || page === undefined || ready) return;
    const element = ninja;
    const area = page;
    ready = (async () => {
      await import('@appulsauce/ninja-keys');
      setup(element, report, area);
    })();
  });

  async function open(search?: string): Promise<void> {
    await ready;
    ninja?.open(search === undefined ? {} : {search});
  }

  const classes = $derived(themed || (theme.dark ? 'dark' : ''));
</script>

<figure class="flex flex-col overflow-hidden rounded-md border border-edge">
  <div class="flex flex-col gap-4 bg-raised p-4" bind:this={page}>
    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="flex h-8 items-center gap-2 rounded-md bg-accent px-3 font-ui text-sm font-medium text-on-accent hover:opacity-90"
        onclick={() => open()}
      >
        <Icon name="play" size={14} />
        Open the palette
      </button>
      {@render children?.()}
    </div>

    {#if queries.length > 0}
      <ul class="flex list-none flex-col gap-1 ps-0">
        {#each queries as query (query.search)}
          <li class="flex flex-wrap items-baseline gap-x-3">
            <button
              type="button"
              class="rounded-sm border border-edge bg-surface px-2 font-mono text-sm text-ink hover:border-accent"
              onclick={() => open(query.search)}>{query.search}</button
            >
            <span class="text-sm text-ink-dim">{query.note}</span>
          </li>
        {/each}
      </ul>
    {/if}

    <output
      class="flex min-h-6 flex-col font-mono text-sm text-ink-dim"
      aria-live="polite"
    >
      {#each log as line, index (index)}
        <span class={index === 0 ? 'text-ink' : ''}>{line}</span>
      {:else}
        <span>Handlers and events report here.</span>
      {/each}
    </output>
  </div>

  {#each sources as source (source.file)}
    <figcaption
      class="border-t border-edge px-4 py-1.5 font-mono text-xs text-ink-dim"
    >
      {source.file}
    </figcaption>
    <div class="demo-code">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- the example's own source, highlighted at build time -->
      {@html source.html}
    </div>
  {/each}

  <ninja-keys bind:this={ninja} class={classes} openHotkey="" {placeholder}
  ></ninja-keys>
</figure>

<style>
  /* The block sits flush in the frame, which draws the border. */
  .demo-code :global(.shiki) {
    border: 0;
    border-radius: 0;
  }
</style>
