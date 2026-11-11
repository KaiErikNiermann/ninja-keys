import {apiReference} from '#lib/server/api.ts';

export async function load() {
  return {api: await apiReference()};
}
