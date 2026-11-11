/**
 * Settings for `cem analyze`, which writes custom-elements.json: the
 * manifest editors read for completions and the docs site reads for its API
 * reference.
 */
export default {
  globs: ['src/**/*.ts'],
  exclude: ['src/**/*.test.ts'],
  litelement: true,
  plugins: [
    {
      name: 'drop-undocumented-events',
      // The analyzer names an event after the first argument of
      // `new CustomEvent(...)` when that is a variable, so NinjaKeys'
      // `_announce(type)` showed up as an event called `type`. An element
      // that declares its events with `@fires` gives each a description, so
      // there an event without one is such a guess. The inner elements
      // declare none, and keep everything the analyzer found.
      packageLinkPhase({customElementsManifest}) {
        for (const module of customElementsManifest.modules) {
          for (const declaration of module.declarations ?? []) {
            const events = declaration.events ?? [];
            if (events.some((event) => event.description)) {
              declaration.events = events.filter(
                (event) => event.description
              );
            }
          }
        }
      },
    },
  ],
};
