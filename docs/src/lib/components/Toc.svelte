<!--
  "On this page": the h2 and h3 headings of the article, read from the DOM
  after each navigation, with the one in view marked.
-->
<script lang="ts">
  import {afterNavigate} from '$app/navigation';

  interface Props {
    /** The element whose headings are listed. */
    article: HTMLElement | undefined;
  }

  let {article}: Props = $props();

  interface Heading {
    readonly id: string;
    readonly text: string;
    readonly level: 2 | 3;
  }

  let headings = $state<readonly Heading[]>([]);
  let active = $state('');

  function read(): void {
    headings = [...(article?.querySelectorAll('h2[id], h3[id]') ?? [])].map(
      (h) => ({
        id: h.id,
        text: h.textContent?.trim() ?? '',
        level: h.tagName === 'H2' ? 2 : 3,
      })
    );
  }

  afterNavigate(() => read());

  $effect(() => {
    if (!article || headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries.find((entry) => entry.isIntersecting);
        if (top) active = top.target.id;
      },
      {rootMargin: '0px 0px -70% 0px'}
    );
    for (const {id} of headings) {
      const element = document.querySelector(`#${CSS.escape(id)}`);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  });
</script>

{#if headings.length > 1}
  <nav aria-label="On this page" class="flex flex-col gap-2">
    <h2
      class="font-ui text-xs font-semibold tracking-label text-ink-dim uppercase"
    >
      On this page
    </h2>
    <ul class="flex flex-col gap-1 font-ui text-sm">
      {#each headings as heading (heading.id)}
        <li class={heading.level === 3 ? 'ps-3' : ''}>
          <a
            href="#{heading.id}"
            aria-current={active === heading.id ? 'location' : undefined}
            class="block text-ink-dim no-underline hover:text-ink aria-[current=location]:text-accent"
            >{heading.text}</a
          >
        </li>
      {/each}
    </ul>
  </nav>
{/if}
