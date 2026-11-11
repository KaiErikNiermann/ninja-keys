<!--
  Copy buttons on code blocks. highlight.ts puts the button in each block's
  HTML at build time; this handles every click on one, from the document.
  The button's glyph reports the result: a check once the clipboard has the
  text, a cross (with the reason in its tooltip) when it failed.
-->
<script lang="ts">
  const DONE_FOR = 1500;
  const IDLE_TITLE = 'Copy code';

  /** What a block shows, without twoslash's hidden popups and query lines. */
  function codeOf(block: Element): string {
    const pre = block.querySelector('pre');
    if (!pre) return '';
    const copy = pre.cloneNode(true) as HTMLElement;
    for (const extra of copy.querySelectorAll(
      '.twoslash-popup-container, .twoslash-meta-line'
    )) {
      extra.remove();
    }
    return copy.textContent ?? '';
  }

  function settle(button: HTMLButtonElement, state: 'done' | 'failed') {
    button.dataset['state'] = state;
    if (state === 'done') {
      setTimeout(() => {
        if (button.dataset['state'] === 'done') delete button.dataset['state'];
      }, DONE_FOR);
    }
  }

  async function click(event: MouseEvent): Promise<void> {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>('.code-copy');
    const block = button?.closest('.code-block');
    if (!button || !block) return;
    try {
      await navigator.clipboard.writeText(codeOf(block));
      button.title = IDLE_TITLE;
      settle(button, 'done');
    } catch (error) {
      button.title = `Could not copy: ${error instanceof Error ? error.message : String(error)}`;
      settle(button, 'failed');
    }
  }
</script>

<svelte:document onclick={click} />
