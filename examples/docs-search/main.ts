/**
 * The docs-search example: one <ninja-keys> over a four-level docs tree,
 * switchable between the default search and the catsearch query language
 * with fields of the example's own (kind, tag, updated, is:draft).
 */

import '../../dist/ninja-keys.js';
import {defaultSearcher} from '../../dist/ninja-keys.js';
import type {NinjaKeys, Searcher} from '../../dist/ninja-keys.js';
import {catsearchSearcher} from '../../dist/catsearch.js';
import {enumField, flagField, numberField, textField} from 'catsearch';

import {DOCS} from './docs.js';
import type {DocAction} from './docs.js';

function element<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (found === null) throw new Error(`no ${selector} in the page`);
  return found;
}

const SEARCHERS: ReadonlyMap<string, Searcher> = new Map(
  Object.entries({
    plain: defaultSearcher,
    fields: catsearchSearcher<DocAction>({
      fields: [
        enumField<DocAction>({
          name: 'kind',
          get: (a) => a.kind,
          choices: ['idea', 'theme', 'topic', 'page'],
          detail: 'idea, theme, topic or page',
        }),
        textField<DocAction>({name: 'tag', get: (a) => a.tags}),
        numberField<DocAction>({name: 'updated', get: (a) => a.updated}),
        flagField<DocAction>({
          name: 'is',
          flags: {draft: (a) => a.draft, published: (a) => !a.draft},
        }),
      ],
    }),
  })
);

const ninja = element<NinjaKeys>('ninja-keys');
const page = element<HTMLElement>('#page');

/** Show the chosen page with the path that leads to it. */
function show(action: DocAction): void {
  const byId = new Map(ninja._flatData.map((a) => [a.id, a as DocAction]));
  const path: string[] = [];
  for (
    let up = byId.get(action.parent ?? '');
    up;
    up = byId.get(up.parent ?? '')
  ) {
    path.unshift(up.title);
  }
  element('#page-path').textContent = path.join(' / ');
  element('#page-title').textContent = action.title;
  element('#page-meta').textContent = [
    action.kind,
    `updated ${action.updated}`,
    ...action.tags.map((t) => `#${t}`),
    ...(action.draft ? ['draft'] : []),
  ].join(' · ');
  page.hidden = false;
}

/** Leaf pages open in the page; everything else opens its submenu. */
function withHandlers(actions: readonly DocAction[]): DocAction[] {
  return actions.map((action) => {
    const children = action.children as unknown as DocAction[] | undefined;
    return children?.length
      ? {...action, children: withHandlers(children) as unknown as string[]}
      : {...action, handler: () => show(action)};
  });
}

ninja.data = withHandlers(DOCS);

const modes = [...document.querySelectorAll<HTMLButtonElement>('[data-mode]')];
const examples = element<HTMLElement>('#examples');

function setMode(mode: string): void {
  ninja.searcher = SEARCHERS.get(mode) ?? defaultSearcher;
  for (const button of modes) {
    button.setAttribute(
      'aria-pressed',
      String(button.dataset['mode'] === mode)
    );
  }
  examples.dataset['mode'] = mode;
}

for (const button of modes) {
  button.addEventListener('click', () =>
    setMode(button.dataset['mode'] ?? 'plain')
  );
}

for (const button of document.querySelectorAll<HTMLButtonElement>(
  '[data-query]'
)) {
  button.addEventListener('click', () => {
    setMode(
      button.closest<HTMLElement>('[data-for]')?.dataset['for'] ?? 'plain'
    );
    ninja.open({search: button.dataset['query'] ?? ''});
  });
}

element('#open').addEventListener('click', () => ninja.open());

// ninja-keys themes itself from a `dark` class; follow the page's scheme.
const dark = matchMedia('(prefers-color-scheme: dark)');
const follow = () => ninja.classList.toggle('dark', dark.matches);
dark.addEventListener('change', follow);
follow();

setMode('fields');
