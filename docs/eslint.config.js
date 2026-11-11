import css from '@eslint/css';
import js from '@eslint/js';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import svelte from 'eslint-plugin-svelte';
import unicorn from 'eslint-plugin-unicorn';
import {defineConfig} from 'eslint/config';
import globals from 'globals';
import {tailwind4} from 'tailwind-csstree';
import ts from 'typescript-eslint';

const code = ['**/*.{js,mjs,ts,svelte}'];

export default defineConfig([
  {
    ignores: [
      'build/',
      '.svelte-kit/',
      'node_modules/',
      '.lint/',
      'src/lib/api/typedoc.json',
    ],
  },
  {files: code, extends: [js.configs.recommended]},
  {files: code, extends: [ts.configs.strict]},
  {files: code, extends: [sonarjs.configs.recommended]},
  {files: code, extends: [security.configs.recommended]},
  {files: code, extends: [unicorn.configs.recommended]},
  {files: ['**/*.svelte'], extends: [svelte.configs.recommended]},
  {
    files: code,
    languageOptions: {globals: {...globals.browser, ...globals.node}},
    rules: {
      // Ids, events and elements read better short: `el`, `e`, `props`.
      'unicorn/prevent-abbreviations': 'off',
      // The DOM speaks null (querySelector, closest).
      'unicorn/no-null': 'off',
      // Svelte components and SvelteKit route files have fixed names.
      'unicorn/filename-case': 'off',
      // Both fight the JSDoc/TSDoc block style the library's own sources
      // use (`/** ... */` with leading asterisks, one-line `/** x */`).
      'unicorn/no-asterisk-prefix-in-documentation-comments': 'off',
      'unicorn/single-line-block-comment-style': 'off',
      // `Props` is the name Svelte's docs and tooling use for a component's
      // props interface.
      'unicorn/name-replacements': 'off',
      // Internal links go through routeHref (resolve() with a looser type,
      // see route-href.ts), which the rule cannot see through; the prerender
      // crawl fails the build on any link that does not resolve.
      'svelte/no-navigation-without-resolve': 'off',
      // Indexing a Record by a key typed as its own key union is what the
      // type checker is for; the rule cannot see types and flags all of it.
      'security/detect-object-injection': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
    },
  },
  {
    // SvelteKit's route options (`prerender`, `ssr`) have fixed names.
    files: ['src/routes/**/*.ts'],
    rules: {'unicorn/consistent-boolean-name': 'off'},
  },
  {
    // Build tooling: reads the site's own files, and Vite's plugin hooks
    // take their context as `this`.
    files: ['vite.config.ts', 'highlight.ts'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
      'unicorn/no-this-outside-of-class': 'off',
    },
  },
  {
    // A component's or a rune module's state is its top-level `let`s;
    // assigning them from handlers is how Svelte works.
    files: ['**/*.svelte', '**/*.svelte.ts'],
    rules: {'unicorn/no-top-level-assignment-in-function': 'off'},
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
      },
    },
  },
  {
    files: ['**/*.css'],
    language: 'css/css',
    plugins: {css},
    extends: ['css/recommended'],
    languageOptions: {customSyntax: tailwind4},
    rules: {
      'css/use-baseline': [
        'error',
        {
          available: 'newly',
          allowProperties: ['text-box', 'text-box-trim', 'text-box-edge'],
          // Firefox has no `pretty` yet; it falls back to normal wrapping.
          allowPropertyValues: {
            'text-wrap': ['pretty'],
            'text-wrap-style': ['pretty'],
          },
        },
      ],
      'css/no-important': 'error',
      'css/prefer-logical-properties': 'error',
      'css/use-layers': ['error', {requireImportLayers: false}],
      'css/selector-complexity': ['error', {maxCompounds: 2, maxTypes: 1}],
      'css/no-invalid-properties': ['error', {allowUnknownVariables: true}],
      'css/no-duplicate-imports': 'error',
      'css/relative-font-units': ['error', {allowUnits: ['rem', 'em']}],
      'css/font-family-fallbacks': 'error',
    },
  },
  {
    // The examples' stylesheet is CSS a reader copies into their own page,
    // which has no layer order of its own to fit into.
    files: ['src/lib/examples/*.css'],
    language: 'css/css',
    rules: {'css/use-layers': 'off'},
  },
]);
