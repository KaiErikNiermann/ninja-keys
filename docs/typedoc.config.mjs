// TypeDoc reads the library's TypeScript API (functions, interfaces, types)
// into JSON for the API reference page. The element's attributes, events,
// parts and CSS properties come from ../custom-elements.json instead.
import {OptionDefaults} from 'typedoc';

/** @type {Partial<import('typedoc').TypeDocOptions>} */
export default {
  entryPoints: ['../src/ninja-keys.ts', '../src/catsearch.ts'],
  tsconfig: '../tsconfig.json',
  outputs: [{name: 'json', path: 'src/lib/api/typedoc.json'}],
  readme: 'none',
  excludePrivate: true,
  excludeProtected: true,
  excludeInternal: true,
  excludeExternals: true,
  // The custom-elements-manifest tags on NinjaKeys; the manifest reads them.
  blockTags: [
    ...OptionDefaults.blockTags,
    '@fires',
    '@slot',
    '@csspart',
    '@cssprop',
  ],
  // NinjaKeys inherits `styles` from LitElement, whose comment links to
  // Lit's `css`, which is outside these entry points and cannot resolve.
  validation: {invalidLink: false},
  treatWarningsAsErrors: true,
};
