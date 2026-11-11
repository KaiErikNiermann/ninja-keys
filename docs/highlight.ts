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

import type {ElementContent} from 'hast';
import {fromHtml} from 'hast-util-from-html';
import {Check, Copy, X} from 'lucide-static';
import {marked} from 'marked';
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

/** Markdown as hast nodes, for the doc comments in hover popups. */
function markdownNodes(html: string): ElementContent[] {
  return fromHtml(html, {fragment: true}).children.filter(
    (node): node is ElementContent => node.type !== 'doctype'
  );
}

const twoslash = transformerTwoslash({
  // The transformer compares these after its own alias map, which turns
  // `typescript` into `ts`; listing shiki's full names matched nothing and
  // silently skipped every block.
  langs: ['ts', 'js'],
  langAlias: {typescript: 'ts', javascript: 'js'},
  explicitTrigger: false,
  // A snippet that does not type-check is a bug in the docs: fail the build.
  // `notwoslash` in a fence's meta skips the check (its default trigger).
  throws: true,
  // Doc comments are Markdown; without these the popups show it raw.
  rendererRich: {
    renderMarkdown: (markdown) =>
      markdownNodes(marked.parse(markdown, {async: false, gfm: true})),
    renderMarkdownInline: (markdown) =>
      markdownNodes(marked.parseInline(markdown, {async: false})),
  },
  twoslashOptions: {
    compilerOptions: {
      target: ts.ScriptTarget.ES2023,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      lib: ['lib.es2023.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
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

export interface HighlightOptions {
  /** The rest of the fence's info string; `notwoslash` skips the check. */
  readonly meta?: string | null;
  /** Add a copy button (CodeCopy.svelte handles its clicks). */
  readonly copy?: boolean;
}

/** One glyph per state of the copy button; CSS shows the current one. */
const glyph = (svg: string, state: string) =>
  svg.replace('<svg', () => `<svg data-glyph="${state}" aria-hidden="true"`);

const COPY_BUTTON = `<button type="button" class="code-copy" aria-label="Copy code" title="Copy code">${glyph(Copy, 'idle')}${glyph(Check, 'done')}${glyph(X, 'failed')}</button>`;

/** `code` as highlighted HTML, in a block with a copy button by default. */
export async function highlight(
  code: string,
  lang: string | null | undefined,
  {meta, copy = true}: HighlightOptions = {}
): Promise<string> {
  const highlighter = await shared();
  const html = highlighter.codeToHtml(code.trimEnd(), {
    lang: languageOf(lang),
    themes: THEMES,
    defaultColor: false,
    meta: meta ? {__raw: meta} : {},
    transformers: [twoslash],
  });
  return copy ? `<div class="code-block">${html}${COPY_BUTTON}</div>` : html;
}
