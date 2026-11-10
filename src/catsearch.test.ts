import {fixture, html, expect} from '@open-wc/testing';
import {enumField} from 'catsearch';
import {NinjaKeys} from './ninja-keys.js';
import './ninja-keys.js';
import {catsearchSearcher} from './catsearch.js';
import {INinjaAction} from './interfaces/ininja-action.js';
import {Searcher, defaultSearcher} from './searcher.js';

interface DocAction extends INinjaAction {
  kind?: string;
}

const docs: DocAction[] = [
  {
    id: 'rendering',
    title: 'Rendering',
    section: 'Guides',
    keywords: 'gpu',
    children: [
      {
        id: 'lighting',
        title: 'Lighting',
        kind: 'topic',
        children: [
          {id: 'shadows', title: 'Shadow maps', kind: 'page', keywords: 'pcf'},
          {id: 'bloom', title: 'Bloom', kind: 'page'},
        ],
      },
    ] as unknown as string[],
  },
  {
    id: 'audio',
    title: 'Audio',
    section: 'Guides',
    children: [
      {id: 'mixing', title: 'Mixing shadows', kind: 'page'},
    ] as unknown as string[],
  },
  {id: 'settings', title: 'Settings', section: 'App', hotkey: 'ctrl+,'},
];

const ids = (el: NinjaKeys) =>
  [...el.shadowRoot!.querySelectorAll('ninja-action')].map(
    (a) => (a as unknown as {action: INinjaAction}).action.id
  );

const header = (el: NinjaKeys) => el.shadowRoot!.querySelector('ninja-header')!;

async function typed(el: NinjaKeys, text: string) {
  const input = header(el).shadowRoot!.querySelector('input')!;
  input.value = text;
  input.setSelectionRange(text.length, text.length);
  input.dispatchEvent(new Event('input'));
  await el.updateComplete;
  await header(el).updateComplete;
}

async function palette(searcher: Searcher) {
  const el = await fixture<NinjaKeys>(
    html`<ninja-keys .data=${docs} .searcher=${searcher}></ninja-keys>`
  );
  el.open();
  await el.updateComplete;
  return el;
}

describe('searcher property', () => {
  it('defaults to the regular-expression search', async () => {
    const el = await fixture<NinjaKeys>(html`<ninja-keys></ninja-keys>`);
    expect(el.searcher).to.equal(defaultSearcher);
  });

  it('shows what a custom searcher returns, notice and completions', async () => {
    const el = await palette((search, actions) => ({
      actions: actions.filter((a) => a.id === 'settings'),
      notice: search ? 'only settings here' : '',
      suggestions: search ? [{label: 'is:app', search: 'is:app'}] : [],
    }));
    await typed(el, 'x');
    expect(ids(el)).to.deep.equal(['settings']);
    const hint = header(el).shadowRoot!.querySelector('.search-hint')!;
    expect(hint.querySelector('.notice')!.textContent).to.equal(
      'only settings here'
    );
    expect(hint.querySelector('.suggestion-label')!.textContent).to.equal(
      'is:app'
    );
  });

  it('draws no hint line when there is nothing to say', async () => {
    const el = await palette(defaultSearcher);
    await typed(el, 'set');
    expect(header(el).shadowRoot!.querySelector('.search-hint')).to.equal(null);
  });

  it('takes a completion on click, firing change with the new text', async () => {
    const el = await palette((search, actions) => ({
      actions,
      suggestions: search === 'a' ? [{label: 'abc', search: 'abc'}] : [],
    }));
    await typed(el, 'a');
    const changes: string[] = [];
    el.addEventListener('change', (e) =>
      changes.push((e as CustomEvent<{search: string}>).detail.search)
    );
    header(el)
      .shadowRoot!.querySelector<HTMLButtonElement>('.suggestion')!
      .click();
    await el.updateComplete;
    await el.updateComplete;
    const input = header(el).shadowRoot!.querySelector('input')!;
    expect(input.value).to.equal('abc');
    expect(changes).to.deep.equal(['abc']);
  });
});

describe('catsearchSearcher', () => {
  it('lists the root menu while the box is empty', async () => {
    const el = await palette(catsearchSearcher());
    expect(ids(el)).to.deep.equal(['rendering', 'audio', 'settings']);
  });

  it('searches titles and keywords with bare words, at every level', async () => {
    const el = await palette(catsearchSearcher());
    await typed(el, 'pcf');
    expect(ids(el)).to.deep.equal(['shadows']);
    await typed(el, 'shadow');
    expect(ids(el)).to.deep.equal(['shadows', 'mixing']);
  });

  it('finds a sub-sub-topic by an ancestor several levels up', async () => {
    const el = await palette(catsearchSearcher());
    await typed(el, 'under.title:rendering shadow');
    expect(ids(el)).to.deep.equal(['shadows']);
    await typed(el, 'parent.title:lighting');
    expect(ids(el)).to.deep.equal(['shadows', 'bloom']);
  });

  it('filters on section, flags and negation', async () => {
    const el = await palette(catsearchSearcher());
    await typed(el, 'has:hotkey');
    expect(ids(el)).to.deep.equal(['settings']);
    await typed(el, 'section:guides -title:audio');
    expect(ids(el)).to.deep.equal(['rendering']);
  });

  it('searches below the open menu only', async () => {
    const el = await palette(catsearchSearcher());
    el.setParent('audio');
    await el.updateComplete;
    await typed(el, 'shadow');
    expect(ids(el)).to.deep.equal(['mixing']);
  });

  it('searches fields of your own', async () => {
    const el = await palette(
      catsearchSearcher<DocAction>({
        fields: [
          enumField<DocAction>({name: 'kind', get: (a) => a.kind ?? null}),
        ],
      })
    );
    await typed(el, 'kind:page under.title:lighting');
    expect(ids(el)).to.deep.equal(['shadows', 'bloom']);
  });

  it('completes field names and values, and Tab takes the first', async () => {
    const el = await palette(catsearchSearcher());
    await typed(el, 'sec');
    const labels = () =>
      [...header(el).shadowRoot!.querySelectorAll('.suggestion-label')].map(
        (l) => l.textContent
      );
    expect(labels()).to.deep.equal(['section:']);

    const tab = new KeyboardEvent('keydown', {key: 'Tab', keyCode: 9});
    document.dispatchEvent(tab);
    await el.updateComplete;
    await header(el).updateComplete;
    const input = header(el).shadowRoot!.querySelector('input')!;
    expect(input.value).to.equal('section:');
    // Values rank by how many actions use them: two guides, one app.
    expect(labels()).to.deep.equal(['Guides', 'App']);
  });

  it('says what it made of a field it does not know', async () => {
    const el = await palette(catsearchSearcher());
    await typed(el, 'colour:red');
    const notice = header(el).shadowRoot!.querySelector('.notice');
    expect(notice?.textContent).to.contain('colour');
  });
});
