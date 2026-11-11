import {readFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import adapter from '@sveltejs/adapter-static';
import {sveltekit} from '@sveltejs/kit/vite';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import {escapeSvelte, mdsvex, type MdsvexOptions} from 'mdsvex';
import rehypeSlug from 'rehype-slug';
import {defineConfig, type Plugin} from 'vite';

import {highlight} from './highlight.ts';

const root = path.dirname(fileURLToPath(import.meta.url));

const mdsvexOptions: MdsvexOptions = {
  extensions: ['.md'],
  highlight: {
    highlighter: async (code, lang, meta) =>
      `{@html \`${escapeSvelte(await highlight(code, lang, meta))}\`}`,
  },
  rehypePlugins: [rehypeSlug],
};

const QUERY = '?highlight';

/**
 * `import html from './file.ts?highlight'` gives the file as highlighted
 * HTML, so an example page shows the very module it runs.
 */
function highlightImports(): Plugin {
  return {
    name: 'ninja-docs:highlight',
    enforce: 'pre',
    async load(id) {
      if (!id.endsWith(QUERY)) return;
      const file = id.slice(0, -QUERY.length);
      this.addWatchFile(file);
      const html = await highlight(
        await readFile(file, 'utf8'),
        path.extname(file).slice(1),
        undefined
      );
      return `export default ${JSON.stringify(html)};`;
    },
  };
}

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

// The library and catsearch are linked from outside this directory; the dev
// server only serves files under the roots it is told about.
const linked = await Promise.all(
  ['node_modules/ninja-keys', 'node_modules/catsearch'].map((dir) =>
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
      paths: {base: basePath()},
      prerender: {handleHttpError: 'fail', handleMissingId: 'fail'},
    }),
  ],
  server: {
    port: 5175,
    fs: {allow: [root, ...linked]},
  },
});
