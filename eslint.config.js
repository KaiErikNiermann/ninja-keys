import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import sonarjs from 'eslint-plugin-sonarjs';
import security from 'eslint-plugin-security';
import unicorn from 'eslint-plugin-unicorn';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  sonarjs.configs.recommended,
  security.configs.recommended,
  unicorn.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    rules: {
      'no-prototype-builtins': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      // `el`, `e`, `mem`, `c` are the idiomatic spellings in web-component and
      // DOM code, and 17 of the 18 hits were `el`/`e` in the test file. Renaming
      // them buys nothing, and the rule cannot tell a local from a public
      // property, so autofixing it risks rewriting the component's API surface.
      'unicorn/prevent-abbreviations': 'off',

      // The DOM is null-based: querySelector, Element#closest and event details
      // all return null, and the tests assert against it. Forcing `undefined`
      // would mean translating at every boundary.
      'unicorn/no-null': 'off',

      // Suggests Array#toReversed(), which is ES2023. tsconfig targets es2021
      // with lib es2022, so it is not available; the one `reverse()` in
      // _listenerParentPath mutates a local array it just built.
      'unicorn/no-array-reverse': 'off',

      // Reindents the inside of tagged templates, but in Lit an `html` template's
      // leading and trailing whitespace becomes real text nodes: it rewrote
      // `html`<span class="ninja-icon">${mdIcon}</span>`` into a form with a
      // newline on each side, which changes inline layout. It also fights
      // prettier's own embedded-template formatting.
      'unicorn/template-indent': 'off',

      // Worth it for a short if/else, but the multi-line case produced a ternary
      // spanning two `.map()` callbacks in ninja-action's hotkey rendering, which
      // is strictly harder to read than the branch it replaced.
      'unicorn/prefer-ternary': ['error', 'only-single-line'],

      // A TODO is a deliberate, reviewable marker; flagging every one of them
      // as an error just pressures people into deleting the marker rather than
      // doing the work. The one in ninja-keys.ts tracks a real follow-up.
      'sonarjs/todo-tag': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // Build/tooling configs run in node, not the browser. web-dev-server.config.mjs
    // was absent from this list and uses `process`, which only surfaced once
    // linting covered more than src/.
    files: ['*.js', '*.mjs', '*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*_test.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'docs/**',
      'dist/**',
      'custom-elements.json',
      // local tooling state, not project source
      '.remember/**',
      '.serena/**',
      '.claude/**',
    ],
  }
);
