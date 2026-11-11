import {INinjaAction} from './interfaces/ininja-action.js';

/**
 * What a searcher knows besides the text and the actions: which menu is open
 * and where the caret is in the search box.
 */
export interface SearchContext {
  /** The id of the open submenu, or undefined at the root. */
  readonly root: string | undefined;
  /** The caret's offset in the search text, in UTF-16 code units. */
  readonly cursor: number;
}

/**
 * A completion for the search text. Taking it replaces the whole search with
 * `search` and puts the caret at `cursor` (the end when omitted).
 */
export interface SearchSuggestion {
  /** What the chip shows, such as `section:`. */
  readonly label: string;
  /** A hint shown dimmed beside the label. */
  readonly detail?: string;
  /** The whole search text after taking the completion. */
  readonly search: string;
  /** Where the caret goes in `search`; the end when omitted. */
  readonly cursor?: number;
}

export interface SearchResult {
  /** The actions to show, in the order to show them. */
  readonly actions: readonly INinjaAction[];
  /** One line about the query (a half-typed filter, an unknown field). */
  readonly notice?: string;
  /** Completions for the text under the caret. Tab takes the first. */
  readonly suggestions?: readonly SearchSuggestion[];
}

/**
 * Decides which actions a search shows. ninja-keys calls it on every render
 * with the flattened action list, so it should be cheap; cache anything
 * derived from `actions` by the array's identity, which only changes when
 * `data` is set.
 */
export type Searcher = (
  search: string,
  actions: readonly INinjaAction[],
  context: SearchContext
) => SearchResult;

/**
 * The search ninja-keys has always done: the text as a case-insensitive
 * regular expression over `title` and `keywords`, across every level at the
 * root and within the open submenu otherwise.
 */
export const defaultSearcher: Searcher = (search, actions, {root}) => {
  // Match on the search text as a regular expression, but fall back to a
  // literal case-insensitive substring when it does not parse as one.
  // Building the RegExp unconditionally meant a lone "(", "[", "*" or "+" —
  // all ordinary keystrokes in a command palette — threw SyntaxError out of
  // render().
  //
  // No `g` flag: the pattern is reused across every action below, and `g`
  // makes test() carry lastIndex from one call to the next.
  const lowercasedSearch = search.toLowerCase();
  let pattern: RegExp | undefined;
  try {
    // Building a pattern from the search box is this component's documented
    // behaviour, not an oversight. The SyntaxError path is handled below, and
    // the remaining risk the rule warns about is catastrophic backtracking —
    // self-inflicted, in the user's own tab, from text they typed themselves.
    // No trust boundary is crossed, so this is not escaped.
    // eslint-disable-next-line security/detect-non-literal-regexp
    pattern = new RegExp(search, 'i');
  } catch {
    pattern = undefined;
  }
  const matches = (value?: string) => {
    if (value === undefined) {
      return false;
    }
    return pattern
      ? pattern.test(value)
      : value.toLowerCase().includes(lowercasedSearch);
  };

  return {
    actions: actions.filter((action) => {
      const matcher = matches(action.title) || matches(action.keywords);
      if (!root && search) {
        // global search for items on root
        return matcher;
      }
      return action.parent === root && matcher;
    }),
  };
};

/**
 * Actions grouped by `section`, sections in the order they first appear.
 * Pushes into the existing bucket rather than rebuilding it per action, which
 * an earlier reduce did and which made this quadratic in the number of
 * matches.
 */
export function groupBySection(
  actions: readonly INinjaAction[]
): Map<string | undefined, INinjaAction[]> {
  const sections = new Map<string | undefined, INinjaAction[]>();
  for (const action of actions) {
    const bucket = sections.get(action.section);
    if (bucket) {
      bucket.push(action);
    } else {
      sections.set(action.section, [action]);
    }
  }
  return sections;
}
