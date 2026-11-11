/**
 * Every page of the site, in reading order. The sidebar, the page titles,
 * the previous/next links and the search palette all read this list.
 */

export interface NavPage {
  readonly title: string;
  /** Route without the base path, as `resolve()` takes it. */
  readonly path: string;
  /** One line for the palette and the overview cards. */
  readonly summary: string;
}

export interface NavSection {
  readonly title: string;
  readonly pages: readonly NavPage[];
}

export const NAV: readonly NavSection[] = [
  {
    title: 'Start',
    pages: [
      {
        title: 'Introduction',
        path: '/',
        summary: 'What ninja-keys is and what this fork adds',
      },
      {
        title: 'Installation',
        path: '/docs/installation',
        summary: 'npm, a CDN, and the optional catsearch peer',
      },
      {
        title: 'Quickstart',
        path: '/docs/quickstart',
        summary: 'A working palette in one HTML file',
      },
    ],
  },
  {
    title: 'Guide',
    pages: [
      {
        title: 'Actions and menus',
        path: '/docs/guide/actions',
        summary: 'The action model, flat and nested data, sections, icons',
      },
      {
        title: 'Hotkeys',
        path: '/docs/guide/hotkeys',
        summary: 'Action hotkeys, the palette keys, and their scope',
      },
      {
        title: 'Opening and events',
        path: '/docs/guide/events',
        summary: 'open(), close(), submit(), and the four events',
      },
      {
        title: 'Search',
        path: '/docs/guide/search',
        summary: 'The default search and the searcher contract',
      },
      {
        title: 'catsearch queries',
        path: '/docs/guide/catsearch',
        summary: 'The field query language, its fields and relations',
      },
      {
        title: 'Styling',
        path: '/docs/guide/styling',
        summary: 'The dark class, CSS properties, parts and the footer',
      },
      {
        title: 'Frameworks',
        path: '/docs/guide/frameworks',
        summary: 'Using the element from React, Vue, Svelte and SSR',
      },
      {
        title: 'Contributing',
        path: '/docs/guide/contributing',
        summary: 'Building, testing and documenting the library',
      },
    ],
  },
  {
    title: 'Reference',
    pages: [
      {
        title: 'API reference',
        path: '/api',
        summary: 'Every property, method, event, part and export',
      },
    ],
  },
  {
    title: 'Examples',
    pages: [
      {
        title: 'Basic palette',
        path: '/examples/basic',
        summary: 'Sections, icons, hotkeys and handlers',
      },
      {
        title: 'Nested menus',
        path: '/examples/nested',
        summary: 'A tree of menus, opened at any level',
      },
      {
        title: 'Theming',
        path: '/examples/theming',
        summary: 'Three looks from CSS properties and parts',
      },
      {
        title: 'Page-driven palette',
        path: '/examples/page-driven',
        summary: 'Type-ahead, submit() and the events',
      },
      {
        title: 'Ranked searcher',
        path: '/examples/ranked-searcher',
        summary: 'A searcher of your own, with a notice',
      },
      {
        title: 'Field queries',
        path: '/examples/field-queries',
        summary: 'catsearch over a command set',
      },
      {
        title: 'Query cookbook',
        path: '/examples/query-cookbook',
        summary: 'Custom fields and the queries worth knowing',
      },
    ],
  },
];

export const PAGES: readonly (NavPage & {readonly section: string})[] =
  NAV.flatMap((section) =>
    section.pages.map((page) => ({...page, section: section.title}))
  );

/** The page at `path`, ignoring a trailing slash. */
export function pageAt(path: string) {
  const bare = path.length > 1 ? path.replace(/\/$/, '') : path;
  return PAGES.find((page) => page.path === bare);
}
