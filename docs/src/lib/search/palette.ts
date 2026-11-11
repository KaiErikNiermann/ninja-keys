/**
 * The site's own palette: the search index as ninja-keys actions, searched
 * with catsearch, plus a few commands. It is the library used the way the
 * guide describes, so it doubles as an example.
 */

import type {INinjaAction, Searcher} from 'ninja-keys';
import {catsearchSearcher} from 'ninja-keys/catsearch';
import {enumField} from 'catsearch';
import {
  Box,
  Braces,
  Component,
  Copy,
  Dot,
  FileText,
  Folder,
  Hash,
  Moon,
  Palette,
  SquareDashed,
  SquareFunction,
  Sun,
  SunMoon,
  Type,
  Variable,
  Zap,
} from 'lucide-static';

import {ENTRY_KINDS, type EntryKind, type SearchEntry} from './entries.ts';

/** A palette action that knows what kind of thing it points at. */
export interface SiteAction extends INinjaAction {
  readonly kind: EntryKind | 'command';
}

/** A lucide SVG with the class ninja-keys sizes custom icons by. */
const icon = (svg: string) => svg.replace('class="', 'class="ninja-icon ');

const ICONS: Readonly<Record<EntryKind, string>> = {
  section: Folder,
  page: FileText,
  heading: Hash,
  group: Braces,
  property: Variable,
  method: SquareFunction,
  event: Zap,
  slot: SquareDashed,
  part: Component,
  cssprop: Palette,
  function: SquareFunction,
  const: Variable,
  interface: Box,
  type: Type,
  member: Dot,
};

export interface PaletteHooks {
  /** Go to a route (without the base path), with an optional #fragment. */
  readonly navigate: (path: string) => void;
  readonly setTheme: (choice: 'light' | 'dark' | 'system') => void;
  readonly openAt: (parent: string) => void;
}

/** The index and the commands as one flat list, menus listing children. */
export function siteActions(
  entries: readonly SearchEntry[],
  hooks: PaletteHooks
): SiteAction[] {
  const children = new Map<string, string[]>();
  for (const entry of entries) {
    if (entry.parent === undefined) continue;
    const list = children.get(entry.parent) ?? [];
    list.push(entry.id);
    children.set(entry.parent, list);
  }

  const fromIndex = entries.map((entry): SiteAction => {
    const under = children.get(entry.id) ?? [];
    // Sections and API groups are menus; everything else is a place to go.
    const isMenu = entry.kind === 'section' || entry.kind === 'group';
    return {
      id: entry.id,
      title: entry.title,
      kind: entry.kind,
      section: entry.section,
      icon: icon(ICONS[entry.kind]),
      children: under,
      ...(entry.parent !== undefined && {parent: entry.parent}),
      ...(entry.keywords !== undefined && {keywords: entry.keywords}),
      ...(!isMenu && {handler: () => hooks.navigate(entry.path)}),
    };
  });

  const themes = [
    ['Light', 'light', Sun],
    ['Dark', 'dark', Moon],
    ['System', 'system', SunMoon],
  ] as const;

  const commands: SiteAction[] = [
    {
      id: 'Theme',
      title: 'Change theme…',
      kind: 'command',
      section: 'Commands',
      hotkey: 'alt+t',
      icon: icon(SunMoon),
      children: themes.map(([title]) => `Theme: ${title}`),
      handler: () => {
        hooks.openAt('Theme');
        return {keepOpen: true};
      },
    },
    ...themes.map(([title, choice, svg]): SiteAction => ({
      id: `Theme: ${title}`,
      title: `${title} theme`,
      kind: 'command',
      section: 'Commands',
      parent: 'Theme',
      icon: icon(svg),
      handler: () => hooks.setTheme(choice),
    })),
    {
      id: 'Copy install command',
      title: 'Copy “npm i ninja-keys”',
      kind: 'command',
      section: 'Commands',
      keywords: 'install npm clipboard',
      icon: icon(Copy),
      handler: () => {
        void navigator.clipboard.writeText('npm i ninja-keys');
      },
    },
  ];

  return [...fromIndex, ...commands];
}

/** catsearch, plus a `kind:` field over what each entry is. */
export const siteSearcher: Searcher = catsearchSearcher<SiteAction>({
  fields: [
    enumField<SiteAction>({
      name: 'kind',
      get: (action) => action.kind,
      choices: [...ENTRY_KINDS, 'command'],
      detail: 'page, heading, event, cssprop, …',
    }),
  ],
});
