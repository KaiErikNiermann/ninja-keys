import {fixture, html, expect, waitUntil} from '@open-wc/testing';
import {NinjaKeys} from './ninja-keys.js';
import './ninja-keys.js';
import {INinjaAction} from './interfaces/ininja-action.js';

const sampleActions: INinjaAction[] = [
  {id: 'home', title: 'Open Home', hotkey: 'ctrl+h', section: 'Navigation'},
  {
    id: 'settings',
    title: 'Open Settings',
    hotkey: 'ctrl+s',
    section: 'Navigation',
  },
  {id: 'theme', title: 'Change Theme', section: 'Actions'},
  {
    id: 'parent1',
    title: 'Parent Menu',
    children: ['child1', 'child2'],
    section: 'Nested',
  },
  {id: 'child1', title: 'Child One', parent: 'parent1'},
  {id: 'child2', title: 'Child Two', parent: 'parent1'},
];

describe('ninja-keys', () => {
  it('renders the component', async () => {
    const el = await fixture<NinjaKeys>(
      html`<ninja-keys .data=${sampleActions}></ninja-keys>`
    );
    expect(el).to.be.instanceOf(NinjaKeys);
    expect(el.shadowRoot).to.exist;
  });

  it('is hidden by default', async () => {
    const el = await fixture<NinjaKeys>(
      html`<ninja-keys .data=${sampleActions}></ninja-keys>`
    );
    expect(el.visible).to.be.false;
    const modal = el.shadowRoot!.querySelector('.modal');
    expect(modal).to.exist;
    expect(modal!.classList.contains('visible')).to.be.false;
  });

  it('opens and closes via methods', async () => {
    const el = await fixture<NinjaKeys>(
      html`<ninja-keys .data=${sampleActions}></ninja-keys>`
    );

    el.open();
    await el.updateComplete;
    expect(el.visible).to.be.true;
    const modal = el.shadowRoot!.querySelector('.modal');
    expect(modal!.classList.contains('visible')).to.be.true;

    el.close();
    await el.updateComplete;
    expect(el.visible).to.be.false;
  });

  it('renders actions when opened', async () => {
    const el = await fixture<NinjaKeys>(
      html`<ninja-keys .data=${sampleActions}></ninja-keys>`
    );

    el.open();
    await el.updateComplete;

    const actions = el.shadowRoot!.querySelectorAll('ninja-action');
    // Only root-level actions (no parent) should be shown: home, settings, theme, parent1
    expect(actions.length).to.equal(4);
  });

  it('filters actions by search input', async () => {
    const el = await fixture<NinjaKeys>(
      html`<ninja-keys .data=${sampleActions}></ninja-keys>`
    );

    el.open();
    await el.updateComplete;

    // Simulate search input
    const header = el.shadowRoot!.querySelector('ninja-header');
    expect(header).to.exist;

    header!.dispatchEvent(
      new CustomEvent('change', {
        detail: {search: 'Home'},
        bubbles: false,
        composed: false,
      })
    );
    await el.updateComplete;

    const actions = el.shadowRoot!.querySelectorAll('ninja-action');
    expect(actions.length).to.equal(1);
  });

  it('navigates into child menu via setParent', async () => {
    const el = await fixture<NinjaKeys>(
      html`<ninja-keys .data=${sampleActions}></ninja-keys>`
    );

    el.open();
    await el.updateComplete;

    el.setParent('parent1');
    await el.updateComplete;

    const actions = el.shadowRoot!.querySelectorAll('ninja-action');
    expect(actions.length).to.equal(2); // child1, child2
  });

  it('fires selected event on action select', async () => {
    const el = await fixture<NinjaKeys>(
      html`<ninja-keys .data=${sampleActions}></ninja-keys>`
    );

    el.open();
    await el.updateComplete;

    let selectedDetail: {search: string; action?: INinjaAction} | null = null;
    el.addEventListener('selected', ((e: CustomEvent) => {
      selectedDetail = e.detail;
    }) as EventListener);

    // Click the first action
    const firstAction = el.shadowRoot!.querySelector('ninja-action');
    expect(firstAction).to.exist;
    firstAction!.click();
    await el.updateComplete;

    expect(selectedDetail).to.exist;
    expect(selectedDetail!.action).to.exist;
    expect(selectedDetail!.action!.id).to.equal('home');
  });

  it('fires change event on search', async () => {
    const el = await fixture<NinjaKeys>(
      html`<ninja-keys .data=${sampleActions}></ninja-keys>`
    );

    el.open();
    await el.updateComplete;

    let changeDetail: {search: string; actions: INinjaAction[]} | null = null;
    el.addEventListener('change', ((e: CustomEvent) => {
      changeDetail = e.detail;
    }) as EventListener);

    const header = el.shadowRoot!.querySelector('ninja-header');
    header!.dispatchEvent(
      new CustomEvent('change', {
        detail: {search: 'Theme'},
        bubbles: false,
        composed: false,
      })
    );

    await waitUntil(() => changeDetail !== null, 'change event should fire');
    expect(changeDetail!.search).to.equal('Theme');
  });

  it('respects placeholder attribute', async () => {
    const el = await fixture<NinjaKeys>(
      html`<ninja-keys
        placeholder="Search commands..."
        .data=${sampleActions}
      ></ninja-keys>`
    );

    el.open();
    await el.updateComplete;

    const header = el.shadowRoot!.querySelector('ninja-header');
    expect(header).to.exist;
    expect(header!.placeholder).to.equal('Search commands...');
  });

  it('renders section headers', async () => {
    const el = await fixture<NinjaKeys>(
      html`<ninja-keys .data=${sampleActions}></ninja-keys>`
    );

    el.open();
    await el.updateComplete;

    const headers = el.shadowRoot!.querySelectorAll('.group-header');
    expect(headers.length).to.be.greaterThan(0);
  });

  it('calls handler when action is selected', async () => {
    let handlerCalled = false;
    const actions: INinjaAction[] = [
      {
        id: 'test',
        title: 'Test Action',
        handler: () => {
          handlerCalled = true;
        },
      },
    ];

    const el = await fixture<NinjaKeys>(
      html`<ninja-keys .data=${actions}></ninja-keys>`
    );

    el.open();
    await el.updateComplete;

    const action = el.shadowRoot!.querySelector('ninja-action');
    action!.click();
    await el.updateComplete;

    expect(handlerCalled).to.be.true;
  });

  it('closes after handler unless keepOpen', async () => {
    const actionsKeepOpen: INinjaAction[] = [
      {
        id: 'keep',
        title: 'Keep Open',
        handler: () => ({keepOpen: true}),
      },
    ];
    const actionsClose: INinjaAction[] = [
      {
        id: 'close',
        title: 'Close After',
        handler: () => {},
      },
    ];

    // Test keepOpen
    const el1 = await fixture<NinjaKeys>(
      html`<ninja-keys .data=${actionsKeepOpen}></ninja-keys>`
    );
    el1.open();
    await el1.updateComplete;
    el1.shadowRoot!.querySelector('ninja-action')!.click();
    await el1.updateComplete;
    expect(el1.visible).to.be.true;

    // Test auto-close
    const el2 = await fixture<NinjaKeys>(
      html`<ninja-keys .data=${actionsClose}></ninja-keys>`
    );
    el2.open();
    await el2.updateComplete;
    el2.shadowRoot!.querySelector('ninja-action')!.click();
    await el2.updateComplete;
    expect(el2.visible).to.be.false;
  });
});
