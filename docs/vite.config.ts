import {readFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import adapter from '@sveltejs/adapter-static';
import {sveltekit} from '@sveltejs/kit/vite';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import {escapeSvelte, mdsvex, type MdsvexOptions} from 'mdsvex';
import rehypeSlug from 'rehype-slug';
import type {Root} from 'hast';
import {visit} from 'unist-util-visit';
import {defineConfig, type Plugin} from 'vite';

import {highlight} from './highlight.ts';

const root = path.dirname(fileURLToPath(import.meta.url));

// SvelteKit wants `paths.base` empty or root-relative. BASE_PATH comes from
// the Pages workflow; a malformed value fails here instead of shipping a site
// whose links all break.
function basePath(): '' | `/${string}` {
  if (process.argv.includes('dev')) return '';
  const base = process.env['BASE_PATH'] ?? '';
  if (base === '' || base.startsWith('/')) return base as '' | `/${string}`;
  throw new Error(
    `BASE_PATH must be empty or start with "/", got ${JSON.stringify(base)}`
  );
}

const BASE = basePath();

/**
 * Markdown links are written from the site root (`/docs/guide/search`);
 * this puts the base path in front, so they work when the site is served
 * from a subfolder. The prerender crawl fails the build on any that break.
 */
function prefixLinks(tree: Root): void {
  visit(tree, 'element', (node) => {
    const href = node.properties['href'];
    if (typeof href === 'string' && /^\/(?!\/)/.test(href)) {
      node.properties['href'] = `${BASE}${href}`;
    }
  });
}

const rehypeBaseLinks = () => prefixLinks;

/**
 * Puts each table in a box that scrolls sideways on its own, so a table
 * wider than a phone does not make the whole page scroll. The table keeps
 * `display: table` (and its semantics); only the wrapper scrolls.
 */
function wrapTables(tree: Root): void {
  visit(tree, 'element', (node, index, parent) => {
    if (!parent || index === undefined || node.tagName !== 'table') return;
    parent.children[index] = {
      type: 'element',
      tagName: 'div',
      properties: {className: ['table-scroll']},
      children: [node],
    };
    return 'skip';
  });
}

const rehypeScrollTables = () => wrapTables;

const mdsvexOptions: MdsvexOptions = {
  extensions: ['.md'],
  highlight: {
    highlighter: async (code, lang, meta) =>
      `{@html \`${escapeSvelte(await highlight(code, lang, meta ? {meta} : {}))}\`}`,
  },
  rehypePlugins: [rehypeSlug, rehypeBaseLinks, rehypeScrollTables],
};

const QUERY = '?highlight';
const VIRTUAL = '\0highlight:';
// Ends the id in .js: an id ending in .css is CSS to Vite, virtual or not.
const SUFFIX = '.highlight.js';

/**
 * `import html from './file.ts?highlight'` gives the file as highlighted
 * HTML, so an example page shows the very module it runs. The import is
 * resolved to a virtual id, so no other plugin (Vite's CSS pipeline, for a
 * stylesheet) takes the file for its own.
 */
function highlightImports(): Plugin {
  return {
    name: 'ninja-docs:highlight',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (!source.endsWith(QUERY)) return;
      const file = await this.resolve(source.slice(0, -QUERY.length), importer);
      return file ? `${VIRTUAL}${file.id}${SUFFIX}` : undefined;
    },
    async load(id) {
      if (!id.startsWith(VIRTUAL)) return;
      const file = id.slice(VIRTUAL.length, -SUFFIX.length);
      this.addWatchFile(file);
      const html = await highlight(
        await readFile(file, 'utf8'),
        path.extname(file).slice(1)
      );
      return `export default ${JSON.stringify(html)};`;
    },
  };
}

// The library (a workspace link) and catsearch (in the workspace root's
// store) resolve outside this directory; the dev server only serves files
// under the roots it is told about.
const linked = await Promise.all(
  ['node_modules/@appulsauce/ninja-keys', 'node_modules/catsearch'].map((dir) =>
    realpath(path.join(root, dir))
  )
);

export default defineConfig({
  plugins: [
    highlightImports(),
    tailwindcss(),
    sveltekit({
      extensions: ['.svelte', '.md'],
      preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],
      // Runes for the site's own components; packages compile as they ship.
      dynamicCompileOptions: ({filename}) =>
        filename.startsWith(path.join(root, 'src') + path.sep)
          ? {runes: true}
          : undefined,
      adapter: adapter({
        pages: 'build',
        assets: 'build',
        fallback: '404.html',
        strict: true,
      }),
      paths: {base: BASE},
      prerender: {handleHttpError: 'fail', handleMissingId: 'fail'},
    }),
  ],
  server: {
    port: 5175,
    fs: {allow: [root, ...linked]},
  },
});
