import GithubSlugger from 'github-slugger';

const slugger = new GithubSlugger();

/**
 * The fragment id of an API entry: `ninja-keys-open`, `--ninja-width`
 * (CSS properties keep their own dashes), `INinjaAction-hotkey`.
 */
export function anchorFor(scope: string, name: string): string {
  slugger.reset();
  return name.startsWith('--') ? name : `${scope}${slugger.slug(name)}`;
}

/** The heading of the element's section on the API page. */
export const elementAnchor = (tag: string) => `element-${tag}`;

/** The heading of one member group (`properties`, `events`, ...). */
export const groupAnchor = (tag: string, group: string) =>
  `${tag}-${slugOnce(group)}`;

/** The heading of one module's exports. */
export const moduleAnchor = (specifier: string) =>
  `module-${specifier.replaceAll('/', '-')}`;

function slugOnce(text: string): string {
  slugger.reset();
  return slugger.slug(text);
}
