<script lang="ts">
  import Demo from '#lib/components/Demo.svelte';
  import setup from '#lib/examples/field-queries.ts';
  import code from '#lib/examples/field-queries.ts?highlight';
</script>

# Field queries

An editor's commands searched with `catsearchSearcher()` and no configuration. Plain words work as they always did; the fields and relations below come built in. Click a query to open the palette with it, then edit it: completions for field names and values appear under the input, and <kbd>Tab</kbd> takes the first.

<Demo
{setup}
sources={[{file: 'field-queries.ts', html: code}]}
placeholder="Search, or try section:, has:, under.title:"
queries={[
{search: 'remote', note: 'plain words: titles and keywords, every level'},
{search: 'section:editor', note: 'one section'},
{search: 'has:hotkey', note: 'everything you can run without the palette'},
{search: 'delete under.title:git', note: 'a word, but only somewhere below Git'},
{search: 'parent.title:branches', note: 'exactly the contents of one menu'},
{search: 'remote -under.title:git', note: 'negation: the remote command outside Git'},
{search: 'section:view OR has:hotkey', note: 'alternatives'},
{search: 'sec', note: 'a half-typed field: see the completion, press Tab'},
]}
/>

## Which query for which question

**"Run the thing I know the shortcut for."** `has:hotkey` lists every action with one, which doubles as a cheat sheet of the app's shortcuts.

**"The delete in Git, not the other deletes."** A word plus a place: `delete under.title:git`. `under.` follows the menu tree upwards any number of levels, so it finds Delete branch inside Git › Branches. Use `parent.` instead when only the direct menu counts.

**"What is in that menu?"** `parent.title:branches` lists a menu's contents without opening it, and can be combined with anything else (`parent.title:branches has:hotkey`).

**"Everything except…"** A leading `-` negates any term: `-section:view` hides a section, and `-under.title:git` a whole menu's contents, from a busy result.

**"This or that."** `OR` (or `|`) between terms, or commas inside one field: `section:view,editor`.

Each field is listed in the [catsearch guide](/docs/guide/catsearch#the-language). For fields over properties of your own actions, see the [query cookbook](/examples/query-cookbook).
