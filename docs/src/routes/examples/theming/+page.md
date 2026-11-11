<script lang="ts">
  import '#lib/examples/theming.css';
  import Demo from '#lib/components/Demo.svelte';
  import setup from '#lib/examples/theming.ts';
  import code from '#lib/examples/theming.ts?highlight';
  import css from '#lib/examples/theming.css?highlight';
</script>

# Theming

One set of actions in three looks. Each look is a class on the element and a few lines of CSS: custom properties for colours and sizes, `::part()` for the rest. Nothing reaches into the shadow root any other way.

## Terminal

Monospace type, green on black, square key badges.

<Demo {setup} themed="terminal" />

## Glass

A frosted panel over a blurred page, with rounded rows from `::part(ninja-action)`.

<Demo {setup} themed="glass" />

## Compact

Smaller type, a shorter list, and no footer: an empty element in the `footer` slot replaces it.

<Demo {setup} themed="compact" {code} file="theming.ts" />

## The CSS

<div>{@html css}</div>

The full list of properties and parts, with defaults, is in the [API reference](/api#ninja-keys-cssproperties); [Styling](/docs/guide/styling) explains how they reach the palette.
