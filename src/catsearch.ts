/**
 * A field query language for ninja-keys, from the `catsearch` package.
 *
 * ```js
 * import {catsearchSearcher} from '@appulsauce/ninja-keys/catsearch';
 * ninja.searcher = catsearchSearcher();
 * ```
 *
 * Bare words still search titles and keywords, so an ordinary search reads
 * as before. On top of that the box takes fields (`section:guides`,
 * `keyword:gpu`, `has:hotkey`), negation (`-section:api`), alternatives
 * (`section:guides,api` or `a OR b`), and paths up the menu tree:
 * `parent.title:rendering` asks of an action's direct parent and
 * `under.title:rendering` of any ancestor, so a sub-sub-topic is one query
 * away. Completions for field names and values appear under the box.
 *
 * Actions may carry extra properties of your own; pass fields that read them
 * to search them (see {@link CatsearchOptions.fields}).
 */

import {
  Schema,
  activeSpan,
  apply,
  enumField,
  flagField,
  parse,
  relation,
  suggest,
  textField,
} from 'catsearch';
import type {Field, Relation, Vocabulary} from 'catsearch';

import {INinjaAction} from './interfaces/ininja-action.js';
import {SearchSuggestion, Searcher, defaultSearcher} from './searcher.js';

export interface CatsearchOptions<A extends INinjaAction> {
  /**
   * More fields over your actions, after the built-in ones. A name or alias
   * that clashes with a built-in field makes the Schema constructor throw.
   */
  readonly fields?: readonly Field<A>[];
  /** More relations, after `parent` and `under`. */
  readonly relations?: readonly Relation<A>[];
  /** How many completions to offer at once (default 10). */
  readonly limit?: number;
}

/** The field bare words search. Not offered as a completion: it is implied. */
const BARE = 'text';

const words = (text: string | undefined) =>
  text ? text.split(/\s+/).filter(Boolean) : [];

/** What the searcher derives from one action list, rebuilt when it changes. */
interface Index<A> {
  readonly actions: readonly INinjaAction[];
  readonly byId: ReadonlyMap<string, A>;
  readonly vocabulary: Vocabulary;
}

/**
 * A searcher that reads the search box as a catsearch query over the
 * actions. An empty box lists the open menu as the default searcher does; a
 * query searches every level below the open menu.
 */
export function catsearchSearcher<A extends INinjaAction = INinjaAction>(
  options: CatsearchOptions<A> = {}
): Searcher {
  let index: Index<A> | undefined;
  const byId = () => index?.byId ?? new Map<string, A>();

  const parentOf = (action: A): A | undefined =>
    action.parent ? byId().get(action.parent) : undefined;

  function* ancestors(action: A): Generator<A> {
    // A set guards against a cycle in hand-written `parent` ids.
    const seen = new Set<A>();
    for (let up = parentOf(action); up && !seen.has(up); up = parentOf(up)) {
      seen.add(up);
      yield up;
    }
  }

  const schema = new Schema<A>(
    [
      textField<A>({
        name: BARE,
        get: (a) => [a.title, ...words(a.keywords)],
        complete: false,
        detail: 'title or keyword',
      }),
      textField<A>({name: 'title', get: (a) => a.title}),
      textField<A>({
        name: 'keyword',
        get: (a) => words(a.keywords),
        aliases: ['kw'],
      }),
      enumField<A>({name: 'section', get: (a) => a.section ?? null}),
      flagField<A>({
        name: 'has',
        flags: {
          hotkey: (a) => Boolean(a.hotkey),
          children: (a) => (a.children?.length ?? 0) > 0,
          parent: (a) => Boolean(a.parent),
        },
      }),
      ...(options.fields ?? []),
    ],
    {
      bare: BARE,
      relations: [
        relation<A>({
          name: 'parent',
          follow: (a) => {
            const up = parentOf(a);
            return up ? [up] : [];
          },
          detail: 'the menu it is in',
        }),
        relation<A>({
          name: 'under',
          follow: (a) => ancestors(a),
          detail: 'any menu above it',
        }),
        ...(options.relations ?? []),
      ],
    }
  );
  const offered = [...schema.names].filter((name) => name !== BARE);
  const limit = options.limit ?? 10;

  const indexed = (actions: readonly INinjaAction[]): Index<A> => {
    if (index?.actions !== actions) {
      const rows = actions as readonly A[];
      index = {
        actions,
        byId: new Map(rows.map((a) => [a.id, a])),
        vocabulary: schema.vocabulary(rows),
      };
    }
    return index;
  };

  const completions = (
    search: string,
    cursor: number,
    vocabulary: Vocabulary
  ): SearchSuggestion[] => {
    const [start, end] = activeSpan(search, cursor);
    if (search.slice(start, end).trim() === '') {
      // Nothing typed under the caret: offering every field name would put
      // a row of chips under every finished query.
      return [];
    }
    return suggest(search, cursor, schema, vocabulary, {limit, fields: offered})
      .map((s) => ({
        label: s.label,
        detail: s.detail,
        search: apply(search, s),
        cursor: s.start + s.insert.length,
      }))
      .filter((s) => s.search !== search);
  };

  return (search, actions, context) => {
    const {vocabulary} = indexed(actions);
    if (search.trim() === '') {
      // Blank, not just empty: the default would read spaces as a pattern.
      return defaultSearcher('', actions, context);
    }

    const query = parse(search, schema);
    const rows = actions as readonly A[];
    const {root} = context;
    const inScope = root
      ? (a: A) => [...ancestors(a)].some((up) => up.id === root)
      : () => true;

    return {
      actions: rows.filter((a) => inScope(a) && query.matches(a)),
      notice: query.notice,
      suggestions: completions(search, context.cursor, vocabulary),
    };
  };
}
