// A flat list of actions in three sections, with Material icons, hotkeys
// and handlers. `setup` gets this demo's <ninja-keys> and a `report`
// function that writes to the line above; on your page the element is
// `document.querySelector('ninja-keys')`.
import '@appulsauce/ninja-keys';
import type {INinjaAction, NinjaKeys} from '@appulsauce/ninja-keys';

export default function setup(
  ninja: NinjaKeys,
  report: (message: string) => void
): void {
  const actions: INinjaAction[] = [
    {
      id: 'new-file',
      title: 'New file',
      section: 'Files',
      mdIcon: 'note_add',
      hotkey: 'alt+n',
      handler: () => report('New file'),
    },
    {
      id: 'open-recent',
      title: 'Open recent…',
      section: 'Files',
      mdIcon: 'history',
      keywords: 'previous last reopen',
      handler: () => report('Open recent'),
    },
    {
      id: 'share',
      title: 'Share link',
      section: 'Files',
      mdIcon: 'link',
      hotkey: 'alt+s',
      handler: (action) => report(`${action.title}: copied`),
    },
    {
      id: 'zoom-in',
      title: 'Zoom in',
      section: 'View',
      mdIcon: 'zoom_in',
      hotkey: 'alt+=',
      handler: () => {
        report('Zoom in (the palette stays open)');
        // Keep the palette open for actions people repeat.
        return {keepOpen: true};
      },
    },
    {
      id: 'full-screen',
      title: 'Toggle full screen',
      section: 'View',
      mdIcon: 'fullscreen',
      handler: () => report('Full screen'),
    },
    {
      id: 'docs',
      title: 'Read the docs',
      section: 'Help',
      mdIcon: 'menu_book',
      keywords: 'manual guide',
      handler: () => report('Docs'),
    },
  ];
  ninja.data = actions;
}
