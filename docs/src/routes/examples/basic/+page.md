<script lang="ts">
  import Demo from '#lib/components/Demo.svelte';
  import setup from '#lib/examples/basic.ts';
  import code from '#lib/examples/basic.ts?highlight';
</script>

# Basic palette

Six actions in three sections, each with a Material icon; three have hotkeys. Open the palette and try:

- typing `re`: the Files section narrows to Open recent, matched on its keywords too (`reopen`);
- pressing <kbd>Enter</kbd> on Zoom in: the palette stays open, because its handler returns `{keepOpen: true}`;
- closing the palette and pressing <kbd>Alt</kbd> <kbd>N</kbd>: an action's hotkey works without the palette.

<Demo {setup} {code} file="basic.ts" />

This is the whole of the [Quickstart](/docs/quickstart). The fields are described in [Actions and menus](/docs/guide/actions).
