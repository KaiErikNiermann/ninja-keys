// catsearch with fields of your own. Each doc page carries a kind, tags,
// a year and a draft flag next to the fields ninja-keys reads; declaring
// fields over them makes `kind:page tag:gpu updated:>=2026 -is:draft`
// a query, with completions for every name and value.
import 'ninja-keys';
import type {INinjaAction, NinjaKeys} from 'ninja-keys';
import {catsearchSearcher} from 'ninja-keys/catsearch';
import {enumField, flagField, numberField, textField} from 'catsearch';

type Kind = 'area' | 'topic' | 'page';

interface Doc extends INinjaAction {
  readonly kind: Kind;
  readonly tags: readonly string[];
  readonly updated: number;
  readonly draft: boolean;
}

interface Entry {
  readonly title: string;
  readonly tags?: readonly string[];
  readonly updated?: number;
  readonly draft?: boolean;
  readonly keywords?: string;
  readonly children?: readonly Entry[];
}

const KINDS: readonly Kind[] = ['area', 'topic', 'page'];

/** An entry and everything below it, as one nested action. */
function doc(entry: Entry, depth: number, section: string): Doc {
  return {
    id: entry.title,
    title: entry.title,
    section,
    kind: KINDS[Math.min(depth, KINDS.length - 1)] ?? 'page',
    tags: entry.tags ?? [],
    updated: entry.updated ?? 2025,
    draft: entry.draft ?? false,
    ...(entry.keywords !== undefined && {keywords: entry.keywords}),
    ...(entry.children && {
      children: entry.children.map((child) => doc(child, depth + 1, section)),
    }),
  };
}

const TREE: readonly Entry[] = [
  {
    title: 'Rendering',
    tags: ['gpu'],
    children: [
      {
        title: 'Lighting',
        children: [
          {
            title: 'Shadow maps',
            tags: ['gpu', 'quality'],
            keywords: 'pcf cascades',
            updated: 2026,
          },
          {
            title: 'Global illumination',
            tags: ['gpu', 'baking'],
            updated: 2024,
          },
          {title: 'Bloom', tags: ['post'], draft: true},
        ],
      },
      {
        title: 'Materials',
        children: [
          {
            title: 'PBR basics',
            tags: ['quality'],
            keywords: 'roughness metallic',
          },
          {title: 'Texture compression', tags: ['memory'], updated: 2026},
        ],
      },
    ],
  },
  {
    title: 'Audio',
    children: [
      {
        title: 'Mixing',
        children: [
          {title: 'Buses', updated: 2023},
          {title: 'Ducking and sidechains', keywords: 'compressor'},
        ],
      },
      {
        title: 'Spatial audio',
        children: [
          {title: 'HRTF', tags: ['quality']},
          {
            title: 'Occlusion',
            keywords: 'acoustic shadow',
            updated: 2026,
            draft: true,
          },
        ],
      },
    ],
  },
  {
    title: 'Performance',
    children: [
      {
        title: 'Profiling',
        children: [
          {title: 'GPU captures', tags: ['gpu'], updated: 2026},
          {title: 'Frame budget', keywords: 'ms fps'},
          {
            title: 'Shadow cost',
            tags: ['gpu'],
            keywords: 'cascades',
            draft: true,
          },
        ],
      },
    ],
  },
];

export const docsSearcher = catsearchSearcher<Doc>({
  fields: [
    enumField<Doc>({
      name: 'kind',
      get: (d) => d.kind,
      choices: KINDS,
      detail: 'area, topic or page',
    }),
    textField<Doc>({name: 'tag', get: (d) => d.tags}),
    numberField<Doc>({name: 'updated', get: (d) => d.updated}),
    flagField<Doc>({
      name: 'is',
      flags: {draft: (d) => d.draft, published: (d) => !d.draft},
    }),
  ],
});

export default function setup(
  ninja: NinjaKeys,
  report: (message: string) => void
): void {
  const open = (action: INinjaAction) => {
    const d = action as Doc;
    report(`${d.title}: ${d.kind}, ${d.updated}${d.draft ? ', draft' : ''}`);
  };
  const withHandlers = (d: Doc): Doc =>
    d.children?.length
      ? {
          ...d,
          children: (d.children as Doc[]).map((child) => withHandlers(child)),
        }
      : {...d, handler: open};

  ninja.data = TREE.map((entry) => withHandlers(doc(entry, 0, entry.title)));
  ninja.searcher = docsSearcher;
}
