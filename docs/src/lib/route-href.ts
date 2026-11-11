import {resolve} from '$app/paths';
import type {RouteId} from '$app/types';

/**
 * `resolve()` for a route held in a variable. `resolve` types its argument
 * by expanding the RouteId union into a tuple per route, and TypeScript
 * stops expanding past 25 members; no route here takes params, so each
 * resolves from the route alone.
 */
export const routeHref = resolve as (route: RouteId | string) => string;
