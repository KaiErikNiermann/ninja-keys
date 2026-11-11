<script lang="ts">
  import Demo from '#lib/components/Demo.svelte';
  import setup from '#lib/examples/nested.ts';
  import code from '#lib/examples/nested.ts?highlight';
</script>

# Nested menus

Menus three levels deep, written as a tree. Choosing **Settings…** opens its menu; the breadcrumb above the input names where you are, and <kbd>Backspace</kbd> on an empty search goes back up. A search at the top level still finds every level: type `cozy`.

<Demo {setup} sources={[{file: 'nested.ts', html: code}]}>
<button type="button" data-open="Theme" class="h-8 rounded-md border border-edge bg-surface px-3 font-ui text-sm hover:border-accent" >Open the Theme menu</button>
</Demo>

The second button calls `ninja.open({parent: 'Theme'})`, opening the palette straight into a menu: the pattern for a menu's own hotkey, or a settings link elsewhere on the page.

The same menus as a flat list, where each child names its menu in `parent`, behave identically; [Actions and menus](/docs/guide/actions#menus) has both forms side by side.
