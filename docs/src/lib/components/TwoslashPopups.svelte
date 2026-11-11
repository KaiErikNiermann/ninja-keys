<!--
  Hover types for twoslash code blocks. Twoslash draws each popup inside
  its <pre>, which scrolls sideways and so clips anything that leaves it;
  this shows a copy of the hovered token's popup in a fixed layer instead.
-->
<script lang="ts">
  const GAP = 6;
  const EDGE = 8;
  const HIDE_DELAY = 120;

  let popup: HTMLDivElement | undefined = $state();
  let content = $state('');
  let anchor = $state<DOMRect | null>(null);
  let token: Element | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  // Placed once its width is known, kept inside the viewport.
  const position = $derived.by(() => {
    if (!anchor || !popup) return '';
    const width = popup.offsetWidth;
    const left = Math.max(
      EDGE,
      Math.min(anchor.left, innerWidth - width - EDGE)
    );
    return `inset-block-start: ${anchor.bottom + GAP}px; inset-inline-start: ${left}px`;
  });

  function show(target: Element): void {
    const source = target.querySelector('.twoslash-popup-container');
    if (!source) return;
    clearTimeout(hideTimer);
    token = target;
    content = source.outerHTML;
    anchor = target.getBoundingClientRect();
  }

  function hideSoon(): void {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      anchor = null;
      token = null;
    }, HIDE_DELAY);
  }

  function over(event: PointerEvent): void {
    if (!(event.target instanceof Element)) return;
    if (popup?.contains(event.target)) {
      clearTimeout(hideTimer);
      return;
    }
    const target = event.target.closest('pre .twoslash-hover');
    if (target && target !== token) show(target);
    else if (!target && token) hideSoon();
  }
</script>

<svelte:document onpointerover={over} onscroll={hideSoon} />

<div
  bind:this={popup}
  class="twoslash twoslash-floating"
  role="tooltip"
  hidden={anchor === null}
  style={position}
  onpointerleave={hideSoon}
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- a copy of twoslash markup the build itself produced -->
  {@html content}
</div>

<style>
  .twoslash-floating {
    position: fixed;
    z-index: 15;
    max-inline-size: min(40rem, 100vi - 1rem);
  }

  .twoslash-floating[hidden] {
    display: none;
  }

  .twoslash-floating :global(.twoslash-popup-container) {
    position: static;
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }

  /* Sizes are set, never relative: twoslash's own sheet draws the docs at
     0.8em of the code, which came to 11px. The type reads like the code
     blocks (mono, --text-sm); the docs like body text at the same size. */
  .twoslash-floating :global(.twoslash-popup-code) {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: var(--text-sm--line-height);
  }

  .twoslash-floating :global(.twoslash-popup-docs) {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    line-height: var(--text-sm--line-height);
  }

  .twoslash-floating :global(.twoslash-popup-docs code) {
    font-family: var(--font-mono);
    font-size: var(--code-size);
  }

  /* The JSDoc tags: on NinjaKeys these are the manifest's @fires and
     @cssprop lists, dozens of lines the API page already shows. */
  .twoslash-floating :global(.twoslash-popup-docs-tags) {
    display: none;
  }

  :global(pre .twoslash-popup-container) {
    display: none;
  }
</style>
