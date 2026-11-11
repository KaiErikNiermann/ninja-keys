<script lang="ts">
  import ApiMembers from '#lib/components/ApiMembers.svelte';
  import {ELEMENT_GROUPS} from '#lib/api.ts';
  import {elementAnchor, groupAnchor, moduleAnchor} from '#lib/anchors.ts';

  let {data} = $props();
  const {element, modules} = $derived(data.api);

  const KIND_LABEL = {
    function: 'function',
    const: 'const',
    interface: 'interface',
    type: 'type',
  } as const;
</script>

<article class="prose">
  <h1>API reference</h1>
  <p>
    Generated from the library at build time: the element's attributes, events,
    slot, parts and CSS properties from its
    <a href="https://github.com/webcomponents/custom-elements-manifest"
      >custom elements manifest</a
    >, and every type and signature from its TypeScript sources through TypeDoc.
    Each description is the doc comment in the source.
  </p>
</article>

<section class="flex flex-col gap-6">
  <header class="prose">
    <h2 id={elementAnchor(element.tag)}>
      <code>&lt;{element.tag}&gt;</code>
    </h2>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- the element's doc comment, rendered at build time -->
    {@html element.description}
    <p>
      Import <code>ninja-keys</code> once to define it. Properties marked with an
      attribute can be set from HTML as well.
    </p>
  </header>

  {#each ELEMENT_GROUPS as [key, heading] (key)}
    {#if element[key].length > 0}
      <div class="flex flex-col gap-2">
        <h3
          id={groupAnchor(element.tag, key)}
          class="font-ui text-lg font-semibold"
        >
          {heading}
        </h3>
        <ApiMembers members={element[key]} />
      </div>
    {/if}
  {/each}
</section>

{#each modules as module (module.specifier)}
  <section class="flex flex-col gap-6">
    <header class="prose">
      <h2 id={moduleAnchor(module.specifier)}>
        <code>{module.specifier}</code>
      </h2>
      <p>
        Exports of <code>import … from '{module.specifier}'</code>.
      </p>
    </header>
    {#each module.entries as entry (entry.anchor)}
      <div id={entry.anchor} class="flex flex-col gap-3">
        <h3 class="flex flex-wrap items-baseline gap-3 font-ui">
          <a
            href="#{entry.anchor}"
            class="font-mono text-lg font-medium text-ink no-underline hover:text-accent"
            >{entry.name}</a
          >
          <span
            class="text-xs font-normal tracking-label text-ink-dim uppercase"
            >{KIND_LABEL[entry.kind]}</span
          >
          {#if entry.source}
            <a href={entry.source} class="ms-auto text-xs font-normal">source</a
            >
          {/if}
        </h3>
        <div class="prose">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -- generated from the library's types at build time -->
          {@html entry.signature}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -- the library's own doc comments, rendered at build time -->
          {@html entry.description}
        </div>
        {#if entry.members.length > 0}
          <ApiMembers members={entry.members} />
        {/if}
      </div>
    {/each}
  </section>
{/each}
