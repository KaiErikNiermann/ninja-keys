# Change Log

## 1.3.0 (2026-11-11)

First release as `@appulsauce/ninja-keys`. The element is still `<ninja-keys>`.

### Search

- The `searcher` property replaces how the palette searches; `defaultSearcher` is the previous regex search (6129ee9)
- `@appulsauce/ninja-keys/catsearch` searches with field queries such as `section:git under.title:settings`, with completions under the input (3f28c10)
- An invalid regular expression in the search box falls back to a literal match instead of finding nothing (b2b6f46, 2d0a72d)

### API

- `open({search})` opens with a search already typed, and `submit()` runs the selected action as Enter does (91fa3e2, 3b837f3, 74c87a7)
- The element fires `open` and `close` events, and `change` and `selected` have typed details (79595c0, ed6672d)
- `children` accepts nested actions as well as ids (9a1185c)

### Fixes

- Action hotkeys are released on re-render and on disconnect, and internal hotkeys rebind when their properties change (0b74336, 28988dc)
- The action list renders when `disableHotkeys` is set, and nested actions stay under the parent they were declared on (25ce2cd, dad7b31)
- A hotkey handler run without an event no longer throws (4a97b38)
- The footer's key hints wrap on narrow screens (8d123a5)

### Maintenance

- Lit 3, TypeScript 5, ESLint 9 with sonarjs, unicorn and security, and a test suite on @web/test-runner (66e8ed0, d86ee5e, ed1202d, 13a416d)
- The package ships only `dist/` and `custom-elements.json`, and documentation moved to a docs site at https://kaierikniermann.github.io/ninja-keys/ (4a9b744, 9e9a3cb)

## 1.2.0 (2022-04-21)

- Clean up hotkeys on disconnect #20. Thanks to @excid3

- Export css variable of content `zIndex` #21
