/**
 * The API reference as pages receive it (built by `#lib/server/api.ts`).
 * HTML fields are rendered at build time from the library's own comments.
 */

export interface ApiMember {
  readonly name: string;
  /** Fragment id on the API page. */
  readonly anchor: string;
  /** Highlighted TypeScript, empty when the member has no type of its own. */
  readonly signature: string;
  readonly description: string;
  readonly default?: string;
  /** The HTML attribute that sets this property, when there is one. */
  readonly attribute?: string;
}

export interface ElementApi {
  readonly tag: string;
  readonly description: string;
  readonly properties: readonly ApiMember[];
  readonly methods: readonly ApiMember[];
  readonly events: readonly ApiMember[];
  readonly slots: readonly ApiMember[];
  readonly parts: readonly ApiMember[];
  readonly cssProperties: readonly ApiMember[];
}

export type ApiEntryKind = 'function' | 'const' | 'interface' | 'type';

export interface ApiEntry {
  readonly kind: ApiEntryKind;
  readonly name: string;
  readonly anchor: string;
  readonly signature: string;
  readonly description: string;
  /** Link to the declaration on GitHub. */
  readonly source: string;
  /** An interface's properties; empty otherwise. */
  readonly members: readonly ApiMember[];
}

export interface ApiModule {
  /** What to import it from: `@appulsauce/ninja-keys` or its `/catsearch`. */
  readonly specifier: string;
  readonly entries: readonly ApiEntry[];
}

export interface ApiReference {
  readonly element: ElementApi;
  readonly modules: readonly ApiModule[];
}

/** The element's member groups, in page order, with their headings. */
export const ELEMENT_GROUPS = [
  ['properties', 'Properties'],
  ['methods', 'Methods'],
  ['events', 'Events'],
  ['slots', 'Slots'],
  ['parts', 'Shadow parts'],
  ['cssProperties', 'CSS properties'],
] as const satisfies readonly (readonly [keyof ElementApi, string])[];
