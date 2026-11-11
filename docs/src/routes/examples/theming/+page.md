<script lang="ts">
  import '#lib/examples/theme-terminal.css';
  import '#lib/examples/theme-glass.css';
  import '#lib/examples/theme-compact.css';
  import Demo from '#lib/components/Demo.svelte';
  import setup from '#lib/examples/theming.ts';
  import code from '#lib/examples/theming.ts?highlight';
  import terminal from '#lib/examples/theme-terminal.css?highlight';
  import glass from '#lib/examples/theme-glass.css?highlight';
  import compact from '#lib/examples/theme-compact.css?highlight';
</script>

# Theming

One set of actions in three looks. Each look is a class on the element and a few lines of CSS: custom properties for colours and sizes, `::part()` for the rest. Nothing reaches into the shadow root any other way.

All three run the same setup; only the class differs:

<div>{@html code}</div>

## Terminal

Monospace type, green on black, square key badges. Only custom properties, plus one `::part()` rule for the placeholder.

<Demo {setup} themed="terminal" sources={[{file: 'theme-terminal.css', html: terminal}]} />

## Glass

A frosted panel over a blurred page: `--ninja-backdrop-filter` blurs what is behind the overlay, and `::part(ninja-action)` rounds the rows.

<Demo {setup} themed="glass" sources={[{file: 'theme-glass.css', html: glass}]} />

## Compact

Smaller type and a shorter list from three properties, and no footer: the setup puts an empty element in the `footer` slot when the element has this class.

<Demo {setup} themed="compact" sources={[{file: 'theme-compact.css', html: compact}]} />

The full list of properties and parts, with defaults, is in the [API reference](/api#ninja-keys-cssproperties); [Styling](/docs/guide/styling) explains how they reach the palette.
