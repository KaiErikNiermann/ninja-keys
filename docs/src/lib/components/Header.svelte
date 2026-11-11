<script lang="ts">
  import {onMount} from 'svelte';
  import {afterNavigate} from '$app/navigation';
  import {asset, resolve} from '$app/paths';

  import Icon from './Icon.svelte';
  import NavList from './NavList.svelte';
  import {theme, type ThemeChoice} from '#lib/theme.svelte.ts';

  interface Props {
    /** Opens the search palette. */
    onsearch: () => void;
  }

  let {onsearch}: Props = $props();

  const THEME_LABEL: Readonly<Record<ThemeChoice, string>> = {
    light: 'Theme: light (switch to dark)',
    dark: 'Theme: dark (switch to system)',
    system: 'Theme: system (switch to light)',
  };
  const THEME_ICON = {light: 'sun', dark: 'moon', system: 'system'} as const;

  let menu: HTMLDetailsElement | undefined = $state();
  afterNavigate(() => {
    if (menu) menu.open = false;
  });

  // The key the palette opens with, as this platform writes it. Read after
  // hydration: the prerendered page cannot know the platform.
  let isMac = $state(false);
  onMount(() => {
    isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  });
</script>

<header
  class="sticky top-0 z-10 flex h-(--header-height) items-center gap-3 border-b border-edge bg-surface px-4"
>
  <details bind:this={menu} class="relative @3xl:hidden">
    <summary
      class="grid size-8 cursor-pointer list-none place-items-center rounded-sm text-ink-dim hover:bg-raised"
      aria-label="Menu"
      title="Menu"
    >
      <Icon name="menu" />
    </summary>
    <div
      class="absolute top-full mt-2 max-h-(--menu-max-height) w-(--sidebar-width) overflow-y-auto rounded-md border border-edge bg-surface p-3 shadow-(--shadow-pop)"
    >
      <NavList />
    </div>
  </details>

  <a
    href={resolve('/')}
    class="flex items-center gap-2 font-ui text-base font-semibold text-ink no-underline"
  >
    <img src={asset('favicon.svg')} alt="" class="size-6" />
    ninja-keys
  </a>

  <button
    type="button"
    class="ms-auto flex h-8 min-w-0 items-center gap-2 rounded-md border border-edge bg-raised ps-2.5 pe-1.5 font-ui text-sm text-ink-dim hover:text-ink @xl:w-64"
    onclick={onsearch}
  >
    <Icon name="search" size={14} />
    <span class="truncate">Search</span>
    <kbd
      class="ms-auto rounded-sm border border-edge bg-surface px-1.5 font-mono text-xs"
      >{isMac ? '⌘' : 'Ctrl'} K</kbd
    >
  </button>

  <button
    type="button"
    class="grid size-8 place-items-center rounded-sm text-ink-dim hover:bg-raised hover:text-ink"
    aria-label={THEME_LABEL[theme.choice]}
    title={THEME_LABEL[theme.choice]}
    onclick={() => theme.next()}
  >
    <Icon name={THEME_ICON[theme.choice]} />
  </button>

  <a
    href="https://github.com/KaiErikNiermann/ninja-keys"
    class="font-ui text-sm text-ink-dim no-underline hover:text-ink">GitHub</a
  >
</header>
