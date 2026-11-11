<!--
  The site's one icon shim: names to lucide components, so a change of icon
  library is this file.
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

  export type IconName = keyof typeof ICONS;
</script>

<script lang="ts">
  interface Props {
    name: IconName;
    size?: number;
  }

  let {name, size = 16}: Props = $props();
  const Glyph = $derived(ICONS[name]);
</script>

<Glyph {size} aria-hidden="true" strokeWidth={1.75} />
