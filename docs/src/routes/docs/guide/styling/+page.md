# Styling

The palette draws inside its shadow root, so page CSS does not leak into it. Three things reach in on purpose: a `dark` class, CSS custom properties, and shadow parts. The [theming example](/examples/theming) shows three looks built from them.

## Dark mode

Add the `dark` class to the element:

```html
<ninja-keys class="dark"></ninja-keys>
```

To follow the page or the system, toggle the class from script:

```ts
import type {NinjaKeys} from 'ninja-keys';
declare const ninja: NinjaKeys;
// ---cut---
const dark = matchMedia('(prefers-color-scheme: dark)');
const follow = () => ninja.classList.toggle('dark', dark.matches);
dark.addEventListener('change', follow);
follow();
```

## CSS custom properties

Every colour and most sizes are custom properties set on the element, so a rule on `ninja-keys` (or a class on it) overrides them:

```css
ninja-keys {
  --ninja-width: min(40rem, 100vw - 2rem);
  --ninja-top: 12vh;
  --ninja-accent-color: rebeccapurple;
  --ninja-font-family: inherit;
}
```

The [API reference](/api#ninja-keys-cssproperties) lists all of them with their defaults. The ones people change most:

| Property                      | Default           | For                                   |
| ----------------------------- | ----------------- | ------------------------------------- |
| `--ninja-width`               | `640px`           | the palette's width                   |
| `--ninja-top`                 | `20%`             | its distance from the top             |
| `--ninja-font-size`           | `16px`            | the base every size scales from       |
| `--ninja-font-family`         | inherited         | the font                              |
| `--ninja-accent-color`        | purple            | caret, selection bar, focused chips   |
| `--ninja-modal-background`    | white             | the panel                             |
| `--ninja-overflow-background` | translucent white | the overlay over the page             |
| `--ninja-backdrop-filter`     | `none`            | e.g. `blur(4px)` behind the overlay   |
| `--ninja-actions-height`      | `300px`           | the list's maximum height             |
| `--ninja-z-index`             | `1`               | raise it above your own fixed headers |

To match a site's theme, point the properties at the site's own variables, as this site does:

```css
ninja-keys {
  --ninja-text-color: var(--color-ink);
  --ninja-modal-background: var(--color-surface);
  --ninja-accent-color: var(--color-accent);
  --ninja-secondary-text-color: var(--color-ink-dim);
}
```

The variables resolve in the page's scope, so the palette follows the site's light and dark themes without its own `dark` class.

## Shadow parts

For anything the properties do not cover, style the parts with `::part()`:

| Part                  | Is                                                       |
| --------------------- | -------------------------------------------------------- |
| `actions-list`        | the scrolling list                                       |
| `ninja-action`        | each row                                                 |
| `ninja-selected`      | the selected row (it also has `ninja-action`)            |
| `ninja-icon`          | a Material icon                                          |
| `ninja-input`         | the search input                                         |
| `ninja-input-wrapper` | the box around the input                                 |
| `ninja-search-hint`   | the line under the input with completions and the notice |
| `ninja-suggestion`    | one completion chip                                      |
| `ninja-notice`        | the searcher's notice                                    |

```css
ninja-keys::part(actions-list) {
  padding: 0.5rem;
}

ninja-keys::part(ninja-action) {
  border-radius: 0.5rem;
  border-inline-start: none;
}

ninja-keys::part(ninja-selected) {
  background: color-mix(in oklch, currentColor 8%, transparent);
}

ninja-keys::part(ninja-input)::placeholder {
  font-style: italic;
}
```

`::part()` is supported in every current browser.

## The footer

The footer with key hints is a slot. Put your own content in it, or an empty element to remove it:

```html
<ninja-keys>
  <div slot="footer">Enter to run · Esc to close</div>
</ninja-keys>
```

Slotted content is in the page, not the shadow root, so page CSS styles it directly.

## Custom icons

SVG icons in an action's `icon` take the `ninja-icon` class to be sized by `--ninja-icon-size` and coloured by `--ninja-icon-color`; give the SVG `stroke="currentColor"` or `fill="currentColor"` so the colour applies. See [Actions and menus](/docs/guide/actions#icons).
