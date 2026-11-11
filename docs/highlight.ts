/**
 * Code highlighting for the whole site, run at build time: the fenced blocks
 * in Markdown pages (through mdsvex) and the example sources pages import
 * with `?highlight`.
 *
 * TypeScript and JavaScript go through twoslash, which type-checks each
 * snippet against the real `ninja-keys` and `catsearch` types and adds hover
 * types. A snippet that does not compile fails the build, so every one the
 * site shows is code that works. A preamble the reader does not need goes
 * above a `// ---cut---` line; a block that is deliberately not code (a
 * sketch with `...`) opts out with `notwoslash` after the language.
 */

import {createHighlighter, type Highlighter} from 'shiki';
import {transformerTwoslash} from '@shikijs/twoslash';
import ts from 'typescript';

const THEMES = {light: 'github-light', dark: 'github-dark'} as const;

const LANGUAGES = [
  'typescript',
  'javascript',
  'html',
  'css',
  'svelte',
  'vue',
  'tsx',
  'bash',
  'json',
] as const;

type Language = (typeof LANGUAGES)[number] | 'text';

const ALIASES: Readonly<Partial<Record<string, Language>>> = {
  ts: 'typescript',
  js: 'javascript',
  jsx: 'tsx',
  sh: 'bash',
  shell: 'bash',
};

const isLanguage = (name: string): name is Language =>
  name === 'text' || (LANGUAGES as readonly string[]).includes(name);

/** The shiki language for a fence's info string, `text` when unknown. */
export function languageOf(name: string | null | undefined): Language {
  const key = name?.toLowerCase() ?? '';
  const resolved = ALIASES[key] ?? key;
  return isLanguage(resolved) ? resolved : 'text';
}

const TWOSLASH_LANGUAGES: ReadonlySet<Language> = new Set<Language>([
  'typescript',
  'javascript',
]);

const twoslash = transformerTwoslash({
  langs: [...TWOSLASH_LANGUAGES],
  explicitTrigger: false,
  // A snippet that does not type-check is a bug in the docs: fail the build.
  throws: true,
  twoslashOptions: {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
      strict: true,
      exactOptionalPropertyTypes: true,
      noUncheckedIndexedAccess: true,
      skipLibCheck: true,
      allowImportingTsExtensions: true,
      noEmit: true,
    },
  },
});

/** One highlighter for the whole build, created on first use. */
const shared = (() => {
  let highlighter: Promise<Highlighter> | undefined;
  return () =>
    (highlighter ??= createHighlighter({
      themes: Object.values(THEMES),
      langs: [...LANGUAGES],
    }));
})();

/**
 * `code` as highlighted HTML. `meta` is the rest of the fence's info string;
 * `notwoslash` there skips type-checking.
 */
export async function highlight(
  code: string,
  lang: string | null | undefined,
  meta: string | null | undefined
): Promise<string> {
  const language = languageOf(lang);
  const isChecked =
    TWOSLASH_LANGUAGES.has(language) && !meta?.includes('notwoslash');
  const highlighter = await shared();
  return highlighter.codeToHtml(code.trimEnd(), {
    lang: language,
    themes: THEMES,
    defaultColor: false,
    transformers: isChecked ? [twoslash] : [],
  });
}
