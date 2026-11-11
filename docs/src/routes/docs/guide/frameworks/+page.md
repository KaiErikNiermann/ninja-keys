# Frameworks

`<ninja-keys>` is a standard custom element, so it works anywhere an element does. Two things differ between frameworks: how a value reaches a **property** rather than an attribute, and where the import runs when pages render on a server.

## What to pass as what

- `data` and `searcher` must be **properties**: an array of actions with functions in it, and a function, cannot be attributes.
- Everything else (`placeholder`, `openHotkey`, `hideBreadcrumbs`, …) works either way. As attributes, names are lowercase: `openhotkey`, `hidebreadcrumbs`.
- The element fires plain DOM events (`selected`, `change`, `open`, `close`), not framework events; listen with whatever the framework uses for DOM events.

## Plain HTML and TypeScript

```ts
import '@appulsauce/ninja-keys';
import type {INinjaAction} from '@appulsauce/ninja-keys';
declare const actions: INinjaAction[];
// ---cut---
const ninja = document.querySelector('ninja-keys');
if (ninja) {
  ninja.data = actions;
  ninja.addEventListener('selected', (event) => {
    console.log(event.detail.action?.id);
  });
}
```

## React

React 19 sets properties on custom elements when the element has them, so `data` can be passed as a prop. Import the element in an effect if the component also renders on a server.

```tsx
import {useEffect, useRef} from 'react';
import type {INinjaAction, NinjaKeys, NinjaSelectedDetail} from '@appulsauce/ninja-keys';

export function CommandPalette({actions}: {actions: INinjaAction[]}) {
  const ref = useRef<NinjaKeys>(null);

  useEffect(() => {
    void import('@appulsauce/ninja-keys');
    const ninja = ref.current;
    const onSelected = (event: CustomEvent<NinjaSelectedDetail>) =>
      console.log(event.detail.action?.id);
    ninja?.addEventListener('selected', onSelected);
    return () => ninja?.removeEventListener('selected', onSelected);
  }, []);

  return <ninja-keys ref={ref} data={actions} placeholder="Search" />;
}
```

In TypeScript, declare the tag for JSX once:

```tsx
import type {NinjaKeys} from '@appulsauce/ninja-keys';
import type {DetailedHTMLProps, HTMLAttributes} from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ninja-keys': DetailedHTMLProps<HTMLAttributes<NinjaKeys>, NinjaKeys> &
        Partial<
          Pick<
            NinjaKeys,
            'data' | 'placeholder' | 'openHotkey' | 'hideBreadcrumbs'
          >
        >;
    }
  }
}
```

With React 18 and earlier, set `data` through the ref (`ref.current.data = actions`) instead: they pass everything to custom elements as attributes.

## Vue

Tell the compiler the tag is a custom element, then bind `data` as a property with `.prop`:

```ts notwoslash
// vite.config.ts
vue({
  template: {compilerOptions: {isCustomElement: (tag) => tag === 'ninja-keys'}},
});
```

```vue
<script setup lang="ts">
import '@appulsauce/ninja-keys';
import type {INinjaAction, NinjaSelectedDetail} from '@appulsauce/ninja-keys';

const actions: INinjaAction[] = [{id: 'home', title: 'Go home'}];
const onSelected = (event: CustomEvent<NinjaSelectedDetail>) =>
  console.log(event.detail.action?.id);
</script>

<template>
  <ninja-keys
    :data.prop="actions"
    placeholder="Search"
    @selected="onSelected"
  />
</template>
```

The element re-renders every time `data` is assigned, even with the same array, so Vue's reactive proxies around the array do not hide changes from it.

## Svelte

Svelte sets a property when the element has it, so plain attributes work once the element is defined. Import it in the browser only if the page is server-rendered:

```svelte
<script lang="ts">
  import type {INinjaAction, NinjaKeys} from '@appulsauce/ninja-keys';
  import {onMount} from 'svelte';

  let {actions}: {actions: INinjaAction[]} = $props();
  let ninja: NinjaKeys | undefined = $state();

  onMount(() => {
    void import('@appulsauce/ninja-keys');
  });

  $effect(() => {
    if (ninja) ninja.data = actions;
  });
</script>

<ninja-keys bind:this={ninja} placeholder="Search"></ninja-keys>
```

This site is SvelteKit, and its search palette is built this way: `src/lib/components/SearchPalette.svelte` in the repository.

## Server rendering

The element touches `HTMLElement` and `document` when it is defined, which do not exist on a server. Render the tag as part of the page (it is empty until defined), and load the module in the browser: in an effect, `onMount`, or a client-only component. Until the module loads, a page can hide slotted content with `ninja-keys:not(:defined) { display: none; }`.
