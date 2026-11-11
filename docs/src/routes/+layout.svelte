<script lang="ts">
  import '../styles/index.css';

  import {page} from '$app/state';
  import type {Snippet} from 'svelte';

  import Header from '#lib/components/Header.svelte';
  import NavList from '#lib/components/NavList.svelte';
  import Pager from '#lib/components/Pager.svelte';
  import SearchPalette from '#lib/components/SearchPalette.svelte';
  import Toc from '#lib/components/Toc.svelte';
  import TwoslashPopups from '#lib/components/TwoslashPopups.svelte';
  import {pageAt} from '#lib/nav.ts';
  import {theme} from '#lib/theme.svelte.ts';

  let {children}: {children: Snippet} = $props();

  let palette: SearchPalette | undefined = $state();
  let article: HTMLElement | undefined = $state();

  const route = $derived(page.route.id ?? '/');
  const current = $derived(pageAt(route));

  $effect(() => theme.start());
  $effect(() => {
    document.documentElement.dataset['theme'] = theme.dark ? 'dark' : 'light';
  });
</script>

<svelte:head>
  <title
    >{current && route !== '/'
      ? `${current.title} · ninja-keys`
      : 'ninja-keys'}</title
  >
</svelte:head>

<div class="@container">
  <Header onsearch={() => palette?.open()} />
  <div class="shell">
    <aside class="shell-rail" data-rail="nav">
      <NavList />
    </aside>
    <main class="flex min-w-0 flex-col gap-12 py-8" bind:this={article}>
      {@render children()}
      <Pager path={route} />
    </main>
    <aside class="shell-rail" data-rail="toc">
      <Toc {article} />
    </aside>
  </div>
</div>

<SearchPalette bind:this={palette} dark={theme.dark} />
<TwoslashPopups />
