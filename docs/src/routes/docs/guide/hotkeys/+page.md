<script lang="ts">
  import Note from '#lib/components/Note.svelte';
</script>

# Hotkeys

There are two kinds of keys: the palette's own (open, move, choose, go back, close), and the ones actions declare in `hotkey`. Both are bound with [hotkeys-js](https://github.com/jaywcjlove/hotkeys-js), so both are written the same way.

## Writing a key

A key is a combination joined with `+`; alternatives are separated by commas.

| Written                                  | Means                                                  |
| ---------------------------------------- | ------------------------------------------------------ |
| `ctrl+k`                                 | Ctrl and K                                             |
| `cmd+k,ctrl+k`                           | ⌘ K or Ctrl K, so one string covers macOS and the rest |
| `alt+shift+p`                            | Alt, Shift and P                                       |
| `f2`                                     | F2 on its own                                          |
| `backspace`, `esc`, `enter`, `up`, `tab` | named keys                                             |

The modifiers are `shift`, `alt` (also `option`), `ctrl` (also `control`), and `cmd` (also `command`, `⌘`). hotkeys-js documents the full list of key names.

## The palette's keys

| Property               | Attribute              | Default        | Does                                                        |
| ---------------------- | ---------------------- | -------------- | ----------------------------------------------------------- |
| `openHotkey`           | `openhotkey`           | `cmd+k,ctrl+k` | opens, or closes when open                                  |
| `selectHotkey`         | `selecthotkey`         | `enter`        | runs the selected action, or opens its menu                 |
| `navigationUpHotkey`   | `navigationuphotkey`   | `up,shift+tab` | moves up, wrapping                                          |
| `navigationDownHotkey` | `navigationdownhotkey` | `down,tab`     | moves down, wrapping; with completions, Tab takes the first |
| `goBackHotkey`         | `gobackhotkey`         | `backspace`    | goes up a menu, when the search is empty                    |
| `closeHotkey`          | `closehotkey`          | `esc`          | closes                                                      |

Each can be set as an attribute or a property, before or after the element is on the page; the element rebinds the key when it changes.

```html
<ninja-keys
  openhotkey="cmd+p,ctrl+p"
  closehotkey="esc,cmd+p,ctrl+p"
></ninja-keys>
```

An empty `openHotkey` binds no key at all, for a palette that only opens from your own UI with `open()`. The demos on this site do that, so <kbd>Ctrl</kbd> <kbd>K</kbd> stays the site search.

## Action hotkeys

An action's `hotkey` runs its `handler` from anywhere on the page, with the palette open or closed, and is shown on the action's row. A menu's hotkey usually opens the palette at that menu (see [opening a menu directly](/docs/guide/actions#opening-a-menu-directly)).

`disableHotkeys` stops the element from binding action hotkeys; the row still shows them, and the palette's own keys stay bound. Use it when the page already binds those keys itself and the palette only lists them.

By default the row shows each key as its own badge (<kbd>ctrl</kbd> <kbd>n</kbd>); `hotKeysJoinedView` shows the combination as one (<kbd>ctrl+n</kbd>).

## Scope and conflicts

hotkeys-js keeps one table of bindings for the whole page. Some consequences worth knowing:

- Two `<ninja-keys>` elements on one page bind the same default open key, so one press opens both. Give all but one an empty `openHotkey`, or different keys.
- Two actions with the same `hotkey` both run.
- The element releases only the bindings it made, with the handlers it made them with, when its data changes or it leaves the page. Bindings your own code made for the same keys are left alone.
- hotkeys-js ignores key presses in the page's own `<input>`, `<textarea>` and `<select>` elements, so an action hotkey does not fire while someone types in a form. The palette's input sits in the element's shadow root, where the key event appears to come from `<ninja-keys>` itself, and that is how its navigation keys work while you type.

<Note>

Keys the browser or the system reserves (Ctrl W, Ctrl T, ⌘ Q) never reach the page. Prefer `alt+` combinations, or keys your app already owns.

</Note>
