<script lang="ts">
  import {page} from '$app/state';

  import {NAV} from '#lib/nav.ts';
  import {routeHref} from '#lib/route-href.ts';

  const current = $derived(page.url.pathname);
</script>

<nav aria-label="Documentation" class="flex flex-col gap-6">
  {#each NAV as section (section.title)}
    <div class="flex flex-col gap-1">
      <h2
        class="px-2 font-ui text-xs font-semibold tracking-label text-ink-dim uppercase"
      >
        {section.title}
      </h2>
      <ul class="flex flex-col">
        {#each section.pages as item (item.path)}
          {@const href = routeHref(item.path)}
          <li>
            <a
              {href}
              aria-current={current === href ? 'page' : undefined}
              class="block rounded-sm px-2 py-1 font-ui text-sm text-ink no-underline hover:bg-raised aria-[current=page]:bg-accent-soft aria-[current=page]:font-medium aria-[current=page]:text-accent"
            >
              {item.title}
            </a>
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</nav>
