<script lang="ts">
  import {resolve} from '$app/paths';

  import Icon from '#lib/components/Icon.svelte';
  import {sitePalette} from '#lib/search/control.ts';

  const QUERIES = [
    ['kind:event', 'every event the element fires'],
    ['kind:cssprop color', 'the colour properties'],
    ['under.title:guide hotkey', 'hotkeys, in the guide only'],
    ['parent.title:methods', 'the element’s methods'],
  ] as const;

  const FORK = [
    [
      'A pluggable search',
      'The searcher property replaces how the palette matches, and can add a notice and completions under the input.',
      '/docs/guide/search',
    ],
    [
      'Field queries',
      '@appulsauce/ninja-keys/catsearch: section:git, under.title:settings, -is:draft, with completions as you type.',
      '/docs/guide/catsearch',
    ],
    [
      'Driving it from the page',
      'open({search}) with text already typed, submit() to run the first match, open and close events.',
      '/docs/guide/events',
    ],
    [
      'Types for everything',
      'Typed events with no casts, nested children that type-check, and every property documented.',
      '/api',
    ],
    [
      'Hotkey fixes',
      'Keys rebind when changed, are released when data changes or the element leaves, and never pile up.',
      '/docs/guide/hotkeys',
    ],
  ] as const;
</script>

<section class="flex flex-col gap-6 pt-6">
  <h1 class="font-ui text-2xl font-semibold tracking-tight">
    A command palette as one web component
  </h1>
  <p class="max-w-(--measure) text-lg text-ink-dim">
    <code class="font-mono text-ink">&lt;ninja-keys&gt;</code> gives any page a keyboard
    palette: nested menus, per-action hotkeys, a search you can replace, and a field
    query language. It works with any framework, or none.
  </p>
  <div class="flex flex-wrap gap-3">
    <a
      href={resolve('/docs/quickstart')}
      class="flex h-9 items-center gap-2 rounded-md bg-accent px-4 font-ui text-sm font-medium text-on-accent no-underline hover:opacity-90"
    >
      Get started <Icon name="arrow-right" size={14} />
    </a>
    <button
      type="button"
      class="flex h-9 items-center gap-2 rounded-md border border-edge px-4 font-ui text-sm font-medium hover:border-accent"
      onclick={() => sitePalette.open()}
    >
      <Icon name="search" size={14} /> Search these docs
    </button>
  </div>
</section>

<section class="flex flex-col gap-3">
  <h2 class="font-ui text-xl font-semibold">
    This site’s search is the palette
  </h2>
  <p class="max-w-(--measure) text-ink-dim">
    Press <kbd class="rounded-sm border border-edge px-1 font-mono text-sm"
      >Ctrl K</kbd
    >
    anywhere. It is ninja-keys with the catsearch searcher over every page, heading
    and API symbol, so it takes queries as well as words:
  </p>
  <ul class="flex flex-col gap-1.5">
    {#each QUERIES as [query, note] (query)}
      <li class="flex flex-wrap items-baseline gap-x-3">
        <button
          type="button"
          class="rounded-sm border border-edge bg-raised px-2 font-mono text-sm hover:border-accent"
          onclick={() => sitePalette.open(query)}>{query}</button
        >
        <span class="text-sm text-ink-dim">{note}</span>
      </li>
    {/each}
  </ul>
</section>

<section class="flex flex-col gap-4">
  <h2 class="font-ui text-xl font-semibold">What this fork adds</h2>
  <p class="max-w-(--measure) text-ink-dim">
    This is a maintained fork of
    <a href="https://github.com/ssleptsov/ninja-keys">ssleptsov/ninja-keys</a>,
    moved to Lit 3, with these additions:
  </p>
  <ul class="cards">
    {#each FORK as [title, text, path] (title)}
      <li>
        <a
          href={resolve(path)}
          class="flex h-full flex-col gap-1 rounded-md border border-edge p-4 text-ink no-underline hover:border-accent"
        >
          <span class="font-ui text-sm font-semibold">{title}</span>
          <span class="text-sm text-ink-dim">{text}</span>
        </a>
      </li>
    {/each}
  </ul>
</section>

<section class="flex flex-col gap-3">
  <h2 class="font-ui text-xl font-semibold">Start here</h2>
  <ul class="flex flex-col gap-1.5">
    <li>
      <a href={resolve('/docs/installation')}>Installation</a>
      <span class="text-ink-dim">from npm, a CDN, or a build of main</span>
    </li>
    <li>
      <a href={resolve('/examples/basic')}>Examples</a>
      <span class="text-ink-dim"
        >from a basic palette to field queries, each running on its page</span
      >
    </li>
    <li>
      <a href={resolve('/api')}>API reference</a>
      <span class="text-ink-dim">generated from the source</span>
    </li>
  </ul>
</section>
