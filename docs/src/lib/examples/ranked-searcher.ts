// A searcher of your own: rank titles that start with the search above
// those with a word that does, above those that only contain it, and
// keywords last. When nothing matches, a notice says what Enter will do,
// and the `selected` event (which fires with no action) does it.
import 'ninja-keys';
import {defaultSearcher} from 'ninja-keys';
import type {INinjaAction, NinjaKeys, Searcher} from 'ninja-keys';

/** Lower is better; undefined is no match. */
function rank(action: INinjaAction, search: string): number | undefined {
  const title = action.title.toLowerCase();
  if (title.startsWith(search)) return 0;
  if (title.split(/\s+/).some((word) => word.startsWith(search))) return 1;
  if (title.includes(search)) return 2;
  if (action.keywords?.toLowerCase().includes(search)) return 3;
  return undefined;
}

export const rankedSearcher: Searcher = (search, actions, context) => {
  const query = search.trim().toLowerCase();
  // An empty box lists the open menu, exactly as the default does.
  if (!query) return defaultSearcher(search, actions, context);

  const ranked = actions
    .map((action) => ({action, score: rank(action, query)}))
    .filter(
      (entry): entry is {action: INinjaAction; score: number} =>
        entry.score !== undefined
    )
    .toSorted((a, b) => a.score - b.score);

  return {
    actions: ranked.map((entry) => entry.action),
    notice:
      ranked.length === 0
        ? `Nothing here. Enter searches the web for “${search}”.`
        : '',
  };
};

export default function setup(
  ninja: NinjaKeys,
  report: (message: string) => void
): void {
  const titles = [
    'Paste',
    'Paste and match style',
    'Copy as path',
    'Compare with clipboard',
    'Open recent',
    'Reopen closed tab',
    'Split editor',
  ];
  ninja.data = titles.map((title) => ({
    id: title,
    title,
    keywords: title.includes('clipboard') ? 'pasteboard' : '',
    handler: () => report(`Ran "${title}"`),
  }));
  ninja.searcher = rankedSearcher;

  ninja.addEventListener('selected', ({detail}) => {
    if (!detail.action) report(`Web search for "${detail.search}"`);
  });
}
