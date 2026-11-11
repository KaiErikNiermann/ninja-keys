<script lang="ts">
  import type {ApiMember} from '#lib/api.ts';

  interface Props {
    members: readonly ApiMember[];
  }

  let {members}: Props = $props();
</script>

<dl class="flex flex-col divide-y divide-edge border-y border-edge">
  {#each members as member (member.anchor)}
    <div id={member.anchor} class="flex flex-col gap-2 py-4">
      <dt class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <a
          href="#{member.anchor}"
          class="font-mono text-sm font-medium text-ink no-underline hover:text-accent"
          >{member.name}</a
        >
        {#if member.attribute}
          <span class="font-ui text-xs text-ink-dim"
            >attribute <code class="font-mono">{member.attribute}</code></span
          >
        {/if}
        {#if member.default !== undefined}
          <span class="font-ui text-xs text-ink-dim"
            >default <code class="font-mono">{member.default}</code></span
          >
        {/if}
      </dt>
      <dd class="prose flex flex-col gap-2">
        {#if member.signature}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -- built from the library's own types at build time -->
          {@html member.signature}
        {/if}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- the library's own doc comments, rendered at build time -->
        {@html member.description}
      </dd>
    </div>
  {/each}
</dl>
