/**
 * A made-up engine's documentation, four levels deep: idea, theme, topic,
 * page. Each entry carries fields of its own (kind, tags, updated, draft)
 * next to the ones ninja-keys reads.
 */

import type {INinjaAction} from '../../dist/interfaces/ininja-action.js';

export type Kind = 'idea' | 'theme' | 'topic' | 'page';

export interface DocAction extends INinjaAction {
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

const KINDS: readonly Kind[] = ['idea', 'theme', 'topic', 'page'];

const slug = (text: string) =>
  text
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '');

/** An entry and everything under it, as nested ninja-keys actions. */
function build(entry: Entry, depth: number, section?: string): DocAction {
  // Titles are unique here, and ninja-keys shows ids in its breadcrumbs.
  const id = slug(entry.title);
  const action: DocAction = {
    id,
    title: entry.title,
    kind: KINDS[Math.min(depth, KINDS.length - 1)] ?? 'page',
    tags: entry.tags ?? [],
    updated: entry.updated ?? 2025,
    draft: entry.draft ?? false,
    ...(entry.keywords === undefined ? {} : {keywords: entry.keywords}),
    ...(section === undefined ? {} : {section}),
    mdIcon:
      ['lightbulb', 'category', 'topic', 'article'].at(depth) ?? 'article',
  };
  if (entry.children) {
    // ninja-keys flattens nested children into ids itself.
    (action as {children?: unknown}).children = entry.children.map((child) =>
      build(child, depth + 1, section)
    );
  }
  return action;
}

const TREE: readonly Entry[] = [
  {
    title: 'Concepts',
    children: [
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
    ],
  },
  {
    title: 'Guides',
    children: [
      {
        title: 'Getting started',
        children: [
          {
            title: 'Setup',
            children: [
              {title: 'Install', updated: 2026},
              {title: 'Your first scene'},
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
    ],
  },
  {
    title: 'Reference',
    children: [
      {
        title: 'API',
        children: [
          {
            title: 'Modules',
            children: [
              {title: 'Renderer', tags: ['gpu']},
              {title: 'Audio engine'},
            ],
          },
        ],
      },
      {
        title: 'CLI',
        children: [
          {
            title: 'Commands',
            children: [
              {title: 'build', keywords: 'compile package'},
              {title: 'bake', tags: ['baking'], keywords: 'lightmaps'},
            ],
          },
        ],
      },
    ],
  },
];

export const DOCS: readonly DocAction[] = TREE.map((entry) =>
  build(entry, 0, entry.title)
);
