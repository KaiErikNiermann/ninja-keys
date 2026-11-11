// catsearch over an editor's commands, with no configuration: the
// built-in fields (title, keyword, section, has) and the menu relations
// (parent., under.) are enough for most palettes.
import '@appulsauce/ninja-keys';
import type {INinjaAction, NinjaKeys} from '@appulsauce/ninja-keys';
import {catsearchSearcher} from '@appulsauce/ninja-keys/catsearch';

export default function setup(
  ninja: NinjaKeys,
  report: (message: string) => void
): void {
  const run = (action: INinjaAction) => report(`Ran "${action.title}"`);

  const commands: INinjaAction[] = [
    {
      id: 'git',
      title: 'Git',
      section: 'Git',
      mdIcon: 'merge',
      children: [
        {
          id: 'commit',
          title: 'Commit',
          hotkey: 'alt+c',
          keywords: 'save snapshot',
          handler: run,
        },
        {id: 'push', title: 'Push', keywords: 'upload remote', handler: run},
        {
          id: 'pull',
          title: 'Pull',
          keywords: 'download remote fetch',
          handler: run,
        },
        {
          id: 'branches',
          title: 'Branches',
          children: [
            {id: 'branch-new', title: 'New branch', handler: run},
            {
              id: 'branch-switch',
              title: 'Switch branch',
              hotkey: 'alt+b',
              handler: run,
            },
            {
              id: 'branch-delete',
              title: 'Delete branch',
              keywords: 'remove',
              handler: run,
            },
          ],
        },
      ],
    },
    {
      id: 'format',
      title: 'Format document',
      section: 'Editor',
      hotkey: 'alt+f',
      keywords: 'prettier',
      handler: run,
    },
    {
      id: 'rename',
      title: 'Rename symbol',
      section: 'Editor',
      keywords: 'refactor',
      handler: run,
    },
    {
      id: 'fold',
      title: 'Fold all',
      section: 'Editor',
      keywords: 'collapse',
      handler: run,
    },
    {
      id: 'zen',
      title: 'Zen mode',
      section: 'View',
      keywords: 'focus distraction',
      handler: run,
    },
    {id: 'minimap', title: 'Toggle minimap', section: 'View', handler: run},
    {
      id: 'remote-ssh',
      title: 'Connect to host',
      section: 'Remote',
      keywords: 'ssh remote',
      handler: run,
    },
  ];

  ninja.data = commands;
  ninja.searcher = catsearchSearcher();
}
