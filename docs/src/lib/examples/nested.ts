// Menus inside menus, written as a tree: `children` holds the child
// actions, and ninja-keys flattens it. An action with children opens its
// menu when chosen; Backspace on an empty search goes back up.
import '@appulsauce/ninja-keys';
import type {INinjaAction, NinjaKeys} from '@appulsauce/ninja-keys';

export default function setup(
  ninja: NinjaKeys,
  report: (message: string) => void,
  page: HTMLElement
): void {
  const pick = (choice: string) => () => report(choice);

  const tree: INinjaAction[] = [
    {
      id: 'Projects',
      title: 'Open project…',
      mdIcon: 'folder_open',
      children: [
        {id: 'atlas', title: 'atlas', handler: pick('Opened atlas')},
        {id: 'beacon', title: 'beacon', handler: pick('Opened beacon')},
        {id: 'cinder', title: 'cinder', handler: pick('Opened cinder')},
      ],
    },
    {
      id: 'Settings',
      title: 'Settings…',
      mdIcon: 'settings',
      children: [
        {
          id: 'Theme',
          title: 'Theme…',
          mdIcon: 'palette',
          children: [
            {id: 'light', title: 'Light', handler: pick('Light theme')},
            {id: 'dark', title: 'Dark', handler: pick('Dark theme')},
          ],
        },
        {
          id: 'Density',
          title: 'Density…',
          mdIcon: 'density_medium',
          children: [
            {id: 'compact', title: 'Compact', handler: pick('Compact')},
            {id: 'cozy', title: 'Cozy', handler: pick('Cozy')},
          ],
        },
      ],
    },
    {
      id: 'sign-out',
      title: 'Sign out',
      mdIcon: 'logout',
      handler: pick('Signed out'),
    },
  ];
  ninja.data = tree;

  // A button elsewhere on the page can open a menu directly.
  page
    .querySelector('[data-open="Theme"]')
    ?.addEventListener('click', () => ninja.open({parent: 'Theme'}));
}
