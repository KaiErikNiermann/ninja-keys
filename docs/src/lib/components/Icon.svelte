<!--
  The site's one icon shim: names to lucide components, so a change of icon
  library is this file. lucide has no brand marks, so those come from
  simple-icons, drawn filled rather than stroked.
-->
<script lang="ts" module>
  import {
    ArrowLeft,
    ArrowRight,
    Check,
    Copy,
    ExternalLink,
    Menu,
    Moon,
    Play,
    Search,
    Sun,
    SunMoon,
    X,
  } from '@lucide/svelte';
  import {siGithub} from 'simple-icons';

  const ICONS = {
    'arrow-left': ArrowLeft,
    'arrow-right': ArrowRight,
    check: Check,
    copy: Copy,
    external: ExternalLink,
    menu: Menu,
    moon: Moon,
    play: Play,
    search: Search,
    sun: Sun,
    system: SunMoon,
    close: X,
  } as const;

  const BRANDS = {github: siGithub.path} as const;

  export type IconName = keyof typeof ICONS | keyof typeof BRANDS;

  const isBrand = (name: IconName): name is keyof typeof BRANDS =>
    Object.hasOwn(BRANDS, name);
</script>

<script lang="ts">
  interface Props {
    name: IconName;
    size?: number;
  }

  let {name, size = 16}: Props = $props();
</script>

{#if isBrand(name)}
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"><path d={BRANDS[name]} /></svg
  >
{:else}
  {@const Glyph = ICONS[name]}
  <Glyph {size} aria-hidden="true" strokeWidth={1.75} />
{/if}
