/**
 * Builds the search index at build time from the nav, the Markdown sources
 * of the pages (for their headings) and the API reference.
 */

import GithubSlugger from 'github-slugger';
import {Lexer, type Token, type Tokens} from 'marked';

import {elementAnchor, groupAnchor, moduleAnchor} from '../anchors.ts';
import {ELEMENT_GROUPS, type ApiReference} from '../api.ts';
import {NAV, type NavPage} from '../nav.ts';
import type {EntryKind, SearchEntry} from '../search/entries.ts';
import {apiReference} from './api.ts';

/** Every Markdown page's source, keyed by its file path under /src/routes. */
const SOURCES = import.meta.glob<string>('/src/routes/**/+page.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const sourceFor = (path: string): string | undefined =>
  SOURCES[`/src/routes${path === '/' ? '' : path}/+page.md`];

/** The text a run of inline tokens renders as, markup removed. */
function plainText(tokens: readonly Token[]): string {
  return tokens.map((token) => tokenText(token)).join('');
}

function tokenText(token: Token): string {
  if ('tokens' in token && token.tokens) return plainText(token.tokens);
  return 'text' in token ? token.text : '';
}

interface Heading {
  readonly text: string;
  readonly id: string;
  readonly depth: number;
}

/**
 * The headings of a Markdown page with the ids rehype-slug gives them: the
 * same slugger, fed every heading in order so duplicates number the same.
 */
export function headingsOf(markdown: string): Heading[] {
  const slugger = new GithubSlugger();
  return new Lexer()
    .lex(markdown)
    .filter((token): token is Tokens.Heading => token.type === 'heading')
    .map((token) => {
      const text = plainText(token.tokens).trim();
      return {text, id: slugger.slug(text), depth: token.depth};
    });
}

const API_KIND = {
  properties: 'property',
  methods: 'method',
  events: 'event',
  slots: 'slot',
  parts: 'part',
  cssProperties: 'cssprop',
} as const satisfies Record<(typeof ELEMENT_GROUPS)[number][0], EntryKind>;

const SECTION = 'Reference';
const apiPath = (anchor: string) => `/api#${anchor}`;

function elementEntries({element}: ApiReference, page: string): SearchEntry[] {
  const menu = `<${element.tag}>`;
  return [
    {
      id: menu,
      title: menu,
      kind: 'group',
      section: SECTION,
      path: apiPath(elementAnchor(element.tag)),
      parent: page,
    },
    ...ELEMENT_GROUPS.flatMap(([key, heading]): SearchEntry[] => {
      const group = `${menu} ${heading.toLowerCase()}`;
      return [
        {
          id: group,
          title: heading,
          kind: 'group',
          section: SECTION,
          path: apiPath(groupAnchor(element.tag, key)),
          parent: menu,
        },
        ...element[key].map((member): SearchEntry => ({
          id: `${group}: ${member.name}`,
          title: member.attribute
            ? `${member.name} (${member.attribute})`
            : member.name,
          kind: API_KIND[key],
          section: SECTION,
          path: apiPath(member.anchor),
          parent: group,
        })),
      ];
    }),
  ];
}

function moduleEntries({modules}: ApiReference, page: string): SearchEntry[] {
  return modules.flatMap(({specifier, entries}): SearchEntry[] => [
    {
      id: specifier,
      title: specifier,
      kind: 'group',
      section: SECTION,
      path: apiPath(moduleAnchor(specifier)),
      parent: page,
    },
    ...entries.flatMap((symbol): SearchEntry[] => {
      const id = `${specifier}: ${symbol.name}`;
      return [
        {
          id,
          title: symbol.name,
          kind: symbol.kind,
          section: SECTION,
          path: apiPath(symbol.anchor),
          parent: specifier,
        },
        ...symbol.members.map((member): SearchEntry => ({
          id: `${id}.${member.name}`,
          title: `${symbol.name}.${member.name}`,
          kind: 'member',
          section: SECTION,
          path: apiPath(member.anchor),
          parent: id,
        })),
      ];
    }),
  ]);
}

/** A page, then its h2 to h6 headings. */
function pageEntries(page: NavPage, section: string): SearchEntry[] {
  const source = sourceFor(page.path);
  const headings = source ? headingsOf(source) : [];
  return [
    {
      id: page.title,
      title: page.title,
      kind: 'page',
      section,
      path: page.path,
      parent: section,
      keywords: page.summary,
    },
    ...headings
      .filter((heading) => heading.depth >= 2)
      .map((heading): SearchEntry => ({
        id: `${page.title} #${heading.id}`,
        title: heading.text,
        kind: 'heading',
        section,
        path: `${page.path}#${heading.id}`,
        parent: page.title,
      })),
  ];
}

/** The whole index. Throws on a duplicate id: the palette needs them unique. */
export async function searchIndex(): Promise<SearchEntry[]> {
  const api = await apiReference();
  const entries = NAV.flatMap((section): SearchEntry[] => [
    {
      id: section.title,
      title: section.title,
      kind: 'section',
      section: section.title,
      path: section.pages[0]?.path ?? '/',
    },
    ...section.pages.flatMap((page) => [
      ...pageEntries(page, section.title),
      ...(page.path === '/api'
        ? [
            ...elementEntries(api, page.title),
            ...moduleEntries(api, page.title),
          ]
        : []),
    ]),
  ]);

  const seen = new Set<string>();
  for (const {id} of entries) {
    if (seen.has(id)) throw new Error(`duplicate search id: ${id}`);
    seen.add(id);
  }
  return entries;
}
