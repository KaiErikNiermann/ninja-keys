import {json} from '@sveltejs/kit';

import {searchIndex} from '#lib/server/search-index.ts';

export const prerender = true;

/** The palette's index, fetched once when the palette first loads. */
export async function GET() {
  return json(await searchIndex());
}
