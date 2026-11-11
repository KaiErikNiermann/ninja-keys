/**
 * The site's search index, as the palette receives it from /search.json:
 * one entry per page, heading and API symbol, with `parent` ids forming the
 * menu tree (section, page, heading or API group, symbol).
 */

export const ENTRY_KINDS = [
  'section',
  'page',
  'heading',
  'group',
  'property',
  'method',
  'event',
  'slot',
  'part',
  'cssprop',
  'function',
  'const',
  'interface',
  'type',
  'member',
] as const;

export type EntryKind = (typeof ENTRY_KINDS)[number];

export interface SearchEntry {
  /** Unique; also what the palette's breadcrumbs show for a menu. */
  readonly id: string;
  readonly title: string;
  readonly kind: EntryKind;
  /** The nav section it belongs to: Start, Guide, Reference, Examples. */
  readonly section: string;
  /** Route without the base path, with a #fragment for headings. */
  readonly path: string;
  readonly parent?: string;
  readonly keywords?: string;
}
