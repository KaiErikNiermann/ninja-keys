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

  // Below the wide layout the sidebar is a drawer under the header, toggled
  // from the menu button. Leaving the page closes it, and so does following a
  // link in it: a link to the page already open navigates nowhere.
  let isMenuOpen = $state(false);
  let toggle: HTMLButtonElement | undefined = $state();
  afterNavigate(() => {
    isMenuOpen = false;
  });

  function closeMenu(event: KeyboardEvent) {
    if (!isMenuOpen || event.key !== 'Escape') return;
    isMenuOpen = false;
    toggle?.focus();
  }

  function followLink(event: MouseEvent) {
    if (event.target instanceof Element && event.target.closest('a')) {
      isMenuOpen = false;
    }
  }

  // The key the palette opens with, as this platform writes it. Read after
  // hydration: the prerendered page cannot know the platform.
  let isMac = $state(false);
  onMount(() => {
    isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  });
</script>

<svelte:window onkeydown={closeMenu} />

<header
  class="sticky top-0 z-10 flex h-(--header-height) items-center gap-3 border-b border-edge bg-surface px-4"
>
  <button
    bind:this={toggle}
    type="button"
    class="grid size-8 shrink-0 place-items-center rounded-sm text-ink-dim hover:bg-raised hover:text-ink @3xl:hidden"
    aria-label={isMenuOpen ? 'Close menu' : 'Menu'}
    title={isMenuOpen ? 'Close menu' : 'Menu'}
    aria-expanded={isMenuOpen}
    aria-controls="nav-drawer"
    onclick={() => (isMenuOpen = !isMenuOpen)}
  >
    <Icon name={isMenuOpen ? 'close' : 'menu'} />
  </button>

  {#if isMenuOpen}
    <div class="@3xl:hidden">
      <button
        type="button"
        class="fixed inset-x-0 top-(--header-height) bottom-0 cursor-default bg-surface/80 backdrop-blur-sm"
        aria-label="Close menu"
        tabindex="-1"
        onclick={() => (isMenuOpen = false)}
      ></button>
      <!-- A click that reaches an <a> inside closes the drawer; the links
           themselves are plain, so keyboard activation sends a click too. -->
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div
        id="nav-drawer"
        class="fixed start-0 top-(--header-height) bottom-0 w-(--drawer-width) overflow-y-auto overscroll-contain border-e border-edge bg-surface p-4"
        onclick={followLink}
      >
        <NavList />
      </div>
    </div>
  {/if}

  <a
    href={resolve('/')}
    class="flex shrink-0 items-center gap-2 font-ui text-base font-semibold whitespace-nowrap text-ink no-underline"
    aria-label="ninja-keys"
  >
    <img src={asset('favicon.svg')} alt="" class="size-6" />
    <!-- With the nav in a drawer, the logo alone leaves room for search. -->
    <span class="hidden @3xl:inline" aria-hidden="true">ninja-keys</span>
  </a>

  <button
    type="button"
    class="ms-auto flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border border-edge bg-raised ps-2.5 pe-1.5 font-ui text-sm text-ink-dim hover:text-ink @xl:w-64 @xl:flex-none"
    onclick={onsearch}
  >
    <Icon name="search" size={14} />
    <span class="truncate">Search</span>
    <kbd
      class="ms-auto hidden rounded-sm border border-edge bg-surface px-1.5 font-mono text-xs whitespace-nowrap @xl:inline"
      >{isMac ? '⌘' : 'Ctrl'} K</kbd
    >
  </button>

  <button
    type="button"
    class="grid size-8 shrink-0 place-items-center rounded-sm text-ink-dim hover:bg-raised hover:text-ink"
    aria-label={THEME_LABEL[theme.choice]}
    title={THEME_LABEL[theme.choice]}
    onclick={() => theme.next()}
  >
    <Icon name={THEME_ICON[theme.choice]} />
  </button>

  <a
    href="https://github.com/KaiErikNiermann/ninja-keys"
    class="grid size-8 shrink-0 place-items-center rounded-sm text-ink-dim hover:bg-raised hover:text-ink"
    aria-label="GitHub repository"
    title="GitHub repository"
  >
    <Icon name="github" />
  </a>
</header>
