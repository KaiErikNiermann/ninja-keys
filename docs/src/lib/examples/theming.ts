// The same actions under each look; the look is only the element's class
// (see theme-*.css). `compact` also replaces the footer through its slot.
import '@appulsauce/ninja-keys';
import type {NinjaKeys} from '@appulsauce/ninja-keys';

export default function setup(
  ninja: NinjaKeys,
  report: (message: string) => void
): void {
  const commands = [
    ['Deploy', 'rocket_launch', 'Releases'],
    ['Roll back', 'undo', 'Releases'],
    ['Open logs', 'receipt_long', 'Service'],
    ['Scale up', 'add', 'Service'],
    ['Scale down', 'remove', 'Service'],
  ] as const;
  ninja.data = commands.map(([title, mdIcon, section]) => ({
    id: title,
    title,
    mdIcon,
    section,
    handler: () => report(`${title} (${ninja.className})`),
  }));

  if (!ninja.classList.contains('compact')) return;
  // An empty element in the footer slot hides the key hints.
  const footer = document.createElement('div');
  footer.slot = 'footer';
  ninja.append(footer);
}
