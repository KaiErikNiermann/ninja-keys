<!--
  A callout: a tinted block, no side bar. `tone` picks the tint.
-->
<script lang="ts">
  import type {Snippet} from 'svelte';

  interface Props {
    tone?: 'info' | 'warn';
    children: Snippet;
  }

  let {tone = 'info', children}: Props = $props();
</script>

<aside
  class="flex flex-col gap-2 rounded-md px-4 py-3 text-sm {tone === 'warn'
    ? 'bg-warn-soft'
    : 'bg-accent-soft'}"
>
  {@render children()}
</aside>
