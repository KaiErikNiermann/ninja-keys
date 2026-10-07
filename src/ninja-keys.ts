import {LitElement, html, TemplateResult, PropertyValues} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';
import {live} from 'lit/directives/live.js';
import {createRef, ref} from 'lit/directives/ref.js';
import {classMap} from 'lit/directives/class-map.js';
import hotkeys, {KeyHandler} from 'hotkeys-js';

import './ninja-header.js';
import './ninja-action.js';
import {INinjaAction} from './interfaces/ininja-action.js';
import {NinjaHeader} from './ninja-header.js';
import {NinjaAction} from './ninja-action.js';
import {footerHtml} from './ninja-footer.js';
import {baseStyles} from './base-styles.js';

@customElement('ninja-keys')
export class NinjaKeys extends LitElement {
  static override readonly styles = [baseStyles];

  /**
   * Search placeholder text
   */
  @property({type: String}) placeholder = 'Type a command or search...';

  /**
   * If true, the hotkeys declared by actions are not registered. The palette's
   * own navigation keys stay bound.
   */
  @property({type: Boolean}) disableHotkeys = false;

  /**
   * Show or hide breadcrumbs on header
   */
  @property({type: Boolean}) hideBreadcrumbs = false;

  /**
   * Open or hide shorcut
   */
  @property() openHotkey = 'cmd+k,ctrl+k';

  /**
   * Navigation Up hotkey
   */
  @property() navigationUpHotkey = 'up,shift+tab';

  /**
   * Navigation Down hotkey
   */
  @property() navigationDownHotkey = 'down,tab';

  /**
   * Close hotkey
   */
  @property() closeHotkey = 'esc';

  /**
   * Go back on one level if has parent menu
   */
  @property() goBackHotkey = 'backspace';

  /**
   * Select action and execute handler or open submenu
   */
  @property() selectHotkey = 'enter'; // enter,space

  /**
   * Show or hide breadcrumbs on header
   */
  @property({type: Boolean}) hotKeysJoinedView = false;

  /**
   * Disable load material icons font on connect
   * If you use custom icons.
   * Set this attribute to prevent load default icons font
   */
  @property({type: Boolean}) noAutoLoadMdIcons = false;

  /**
   * Array of actions
   */
  @property({
    type: Array,
    hasChanged() {
      // Forced to trigger changed event always.
      // Because of a lot of framework pattern wrap object with an Observer, like vue2.
      // That's why object passed to web component always same and no render triggered. Issue #9
      return true;
    },
  })
  data = [] as Array<INinjaAction>;

  /**
   * Public methods
   */

  /**
   * Show a modal.
   *
   * `search` starts the search box with that text, as if typed: a host that
   * opens the palette on a key press can pass on what the user typed while
   * it was opening, instead of dropping it or letting it reach the page.
   */
  open(options: {parent?: string; search?: string} = {}) {
    const wasVisible = this.visible;
    this._bump = true;
    this.visible = true;
    if (!wasVisible) this._announce('open');
    this._headerRef.value?.focusSearch();
    if (this._actionMatches.length > 0) {
      this._selected = this._actionMatches[0];
    }
    this.setParent(options.parent);
    if (options.search) {
      const search = options.search;
      this._search = search;
      // The header may not have rendered yet (opened straight after creation).
      void this.updateComplete.then(() => this._headerRef.value?.setSearch(search));
    }
  }

  /**
   * Run the selected action, as Enter does: after open({search}), the
   * first match. Does nothing while closed or when nothing matches.
   */
  submit() {
    if (!this.visible) {
      return;
    }
    const action = this._actionMatches[this._selectedIndex];
    if (action) {
      this._actionSelected(action);
    }
  }

  /**
   * Close modal
   */
  close() {
    const wasVisible = this.visible;
    this._bump = false;
    this.visible = false;
    if (wasVisible) this._announce('close');
  }

  /**
   * Fired once per change of visibility, whatever caused it (a method call,
   * a hotkey, Escape, an overlay click, an action), so a host can restore
   * focus or tear down whatever it opened the palette in.
   */
  private _announce(type: 'open' | 'close') {
    this.dispatchEvent(new CustomEvent(type, {bubbles: true, composed: true}));
  }

  /**
   * Navigate to group of actions
   * @param parent id of parent group/action
   */
  setParent(parent?: string) {
    // An empty id means "back to root", same as omitting the argument.
    this._currentRoot = parent || undefined;
    // this.breadcrumbs = [];
    this._selected = undefined;
    this._search = '';
    this._headerRef.value?.setSearch('');
  }

  /**
   * Show or hide element
   */
  @state() visible = false;
  /**
   * Temproray used for animation effect. TODO: change to animate logic
   */
  @state()
  private _bump = true;

  @state()
  private _actionMatches = [] as Array<INinjaAction>;

  @state()
  private _search = '';

  @state()
  private _currentRoot?: string;

  /**
   * Array of actions in flat structure
   */
  @state() _flatData = [] as Array<INinjaAction>;

  @state()
  private get breadcrumbs() {
    const path: string[] = [];
    let parentAction = this._selected?.parent;
    if (parentAction) {
      path.push(parentAction);
      while (parentAction) {
        const action = this._flatData.find((a) => a.id === parentAction);
        if (action?.parent) {
          path.push(action.parent);
        }
        parentAction = action ? action.parent : undefined;
      }
    }
    return path.reverse();
  }

  @state()
  private _selected?: INinjaAction;

  override connectedCallback() {
    super.connectedCallback();

    if (!this.noAutoLoadMdIcons) {
      const fontAlreadyLoaded =
        document.querySelector('link[href*="Material+Icons"]') ||
        document.querySelector('link[href*="material-icons"]');
      if (!fontAlreadyLoaded) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
        document.head.append(link);
      }
    }

    this._registerInternalHotkeys();
    this._registerActionHotkeys();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._unbindHotkeys(this._internalHotkeys);
    this._unbindHotkeys(this._actionHotkeys);
  }

  private _flattern(members: INinjaAction[], parent?: string): INinjaAction[] {
    if (!members) {
      return [];
    }

    // Descendants are appended after the whole level, so a nested tree still
    // flattens breadth-first. Each subtree is flattened against its own member:
    // the parent id used to be written to a variable shared by the level, which
    // handed every later sibling the previous sibling's id and filed the rest
    // of the menu under the first entry that had children.
    const descendants: INinjaAction[] = [];

    const level = members.map((mem) => {
      const m: INinjaAction = {...mem, parent: mem.parent || parent};
      // Children given as ids mean the caller passed an already flat list.
      if (m.children?.some((value) => typeof value === 'string')) {
        return m;
      }

      const nested = (m.children ?? []) as unknown as INinjaAction[];
      if (nested.length > 0) {
        descendants.push(...this._flattern(nested, m.id));
      }
      m.children = nested.map((child) => child.id);
      return m;
    });

    return [...level, ...descendants];
  }

  override update(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('data')) {
      // Flattening is what produces the rendered list, so it runs whether or
      // not action hotkeys are wanted. Gating it on `disableHotkeys` left the
      // component with an empty palette whenever that flag was set.
      this._flatData = this._flattern(this.data);
    }

    if (
      changedProperties.has('data') ||
      changedProperties.has('disableHotkeys')
    ) {
      this._registerActionHotkeys();
    }

    // Internal hotkeys were bound once, on connect. A host that sets them the
    // ordinary way — a property binding in a template — sets them after the
    // element is in the document, so the defaults stayed bound and the keys
    // asked for never worked.
    if (NinjaKeys._hotkeyProperties.some((key) => changedProperties.has(key))) {
      this._registerInternalHotkeys();
    }

    super.update(changedProperties);
  }

  private static readonly _hotkeyProperties = [
    'openHotkey',
    'selectHotkey',
    'goBackHotkey',
    'navigationUpHotkey',
    'navigationDownHotkey',
    'closeHotkey',
  ] as const;

  /**
   * Hotkeys this element bound, as [key, handler] pairs. Unbinding by key
   * alone drops every handler any code on the page registered for that key,
   * which is not this element's to take away, so each binding is released
   * with the handler it was made with.
   */
  private _internalHotkeys: Array<[string, KeyHandler]> = [];
  private _actionHotkeys: Array<[string, KeyHandler]> = [];

  private _bindHotkey(
    bindings: Array<[string, KeyHandler]>,
    key: string | undefined,
    handler: KeyHandler
  ) {
    if (!key) {
      return;
    }
    hotkeys(key, handler);
    bindings.push([key, handler]);
  }

  private _unbindHotkeys(bindings: Array<[string, KeyHandler]>) {
    for (const [key, handler] of bindings) {
      hotkeys.unbind(key, handler);
    }
    bindings.length = 0;
  }

  /**
   * Bind the hotkeys the actions declare, releasing the previous set first.
   * `data` is reassigned on every keystroke in some hosts, and each pass used
   * to leave its handlers bound, so one keypress ran every generation of them.
   */
  private _registerActionHotkeys() {
    this._unbindHotkeys(this._actionHotkeys);
    if (this.disableHotkeys) {
      return;
    }

    for (const action of this._flatData.filter((action) => !!action.hotkey)) {
      this._bindHotkey(this._actionHotkeys, action.hotkey, (event) => {
        // hotkeys.trigger() calls handlers with no arguments, so every handler
        // here has to work without an event to cancel.
        event?.preventDefault();
        if (action.handler) {
          action.handler(action);
        }
      });
    }
  }

  private _registerInternalHotkeys() {
    this._unbindHotkeys(this._internalHotkeys);
    const bind = (key: string, handler: KeyHandler) =>
      this._bindHotkey(this._internalHotkeys, key, handler);

    bind(this.openHotkey, (event) => {
      event?.preventDefault();
      if (this.visible) {
        this.close();
      } else {
        this.open();
      }
    });

    bind(this.selectHotkey, (event) => {
      if (!this.visible) {
        return;
      }
      event?.preventDefault();
      this._actionSelected(this._actionMatches[this._selectedIndex]);
    });

    bind(this.goBackHotkey, (event) => {
      if (!this.visible) {
        return;
      }
      if (!this._search) {
        event?.preventDefault();
        this._goBack();
      }
    });

    bind(this.navigationDownHotkey, (event) => {
      if (!this.visible) {
        return;
      }
      event?.preventDefault();
      this._selected =
        this._selectedIndex >= this._actionMatches.length - 1
          ? this._actionMatches[0]
          : this._actionMatches[this._selectedIndex + 1];
    });

    bind(this.navigationUpHotkey, (event) => {
      if (!this.visible) {
        return;
      }
      event?.preventDefault();
      this._selected =
        this._selectedIndex === 0
          ? this._actionMatches.at(-1)
          : this._actionMatches[this._selectedIndex - 1];
    });

    bind(this.closeHotkey, () => {
      if (!this.visible) {
        return;
      }
      this.close();
    });
  }

  private _actionFocused(index: INinjaAction, $event: MouseEvent) {
    // this.selectedIndex = index;
    this._selected = index;
    ($event.target as NinjaAction).ensureInView();
  }

  private _onTransitionEnd() {
    this._bump = false;
  }

  private _goBack() {
    const parent =
      this.breadcrumbs.length > 1 ? this.breadcrumbs.at(-2) : undefined;
    this.setParent(parent);
  }

  private _headerRef = createRef<NinjaHeader>();

  override render() {
    const classes = {
      bump: this._bump,
      'modal-content': true,
    };

    const menuClasses = {
      visible: this.visible,
      modal: true,
    };

    // Match on the search text as a regular expression, which is what this
    // component has always done, but fall back to a literal case-insensitive
    // substring when it does not parse as one. Building the RegExp
    // unconditionally meant a lone "(", "[", "*" or "+" — all ordinary
    // keystrokes in a command palette — threw SyntaxError out of render().
    //
    // No `g` flag: the pattern is reused across every action below, and `g`
    // makes test() carry lastIndex from one call to the next.
    const search = this._search;
    const lowercasedSearch = search.toLowerCase();
    let pattern: RegExp | undefined;
    try {
      // Building a pattern from the search box is this component's documented
      // behaviour, not an oversight. The SyntaxError path is handled below, and
      // the remaining risk the rule warns about is catastrophic backtracking —
      // self-inflicted, in the user's own tab, from text they typed themselves.
      // No trust boundary is crossed, so this is not escaped.
      // eslint-disable-next-line security/detect-non-literal-regexp
      pattern = new RegExp(search, 'i');
    } catch {
      pattern = undefined;
    }
    const matches = (value?: string) => {
      if (value === undefined) {
        return false;
      }
      return pattern
        ? pattern.test(value)
        : value.toLowerCase().includes(lowercasedSearch);
    };

    const actionMatches = this._flatData.filter((action) => {
      const matcher = matches(action.title) || matches(action.keywords);

      if (!this._currentRoot && this._search) {
        // global search for items on root
        return matcher;
      }

      return action.parent === this._currentRoot && matcher;
    });

    // Group by section, preserving first-seen section order. Push into the
    // existing bucket rather than rebuilding it per action, which the previous
    // reduce did and which made this quadratic in the number of matches.
    const sections = new Map<string | undefined, INinjaAction[]>();
    for (const action of actionMatches) {
      const bucket = sections.get(action.section);
      if (bucket) {
        bucket.push(action);
      } else {
        sections.set(action.section, [action]);
      }
    }

    this._actionMatches = [...sections.values()].flat();

    if (this._actionMatches.length > 0 && this._selectedIndex === -1) {
      this._selected = this._actionMatches[0];
    }
    if (this._actionMatches.length === 0) {
      this._selected = undefined;
    }

    const actionsList = (actions: INinjaAction[]) =>
      html` ${repeat(
        actions,
        (action) => action.id,
        (action) =>
          html`<ninja-action
            exportparts="ninja-action,ninja-selected,ninja-icon"
            .selected=${live(action.id === this._selected?.id)}
            .hotKeysJoinedView=${this.hotKeysJoinedView}
            @mouseover=${(event: MouseEvent) =>
              this._actionFocused(action, event)}
            @actionsSelected=${(event: CustomEvent<INinjaAction>) =>
              this._actionSelected(event.detail)}
            .action=${action}
          ></ninja-action>`
      )}`;

    const itemTemplates: TemplateResult[] = [];
    for (const [section, actions] of sections.entries()) {
      const header = section
        ? html`<div class="group-header">${section}</div>`
        : undefined;
      itemTemplates.push(html`${header}${actionsList(actions)}`);
    }

    return html`
      <div @click=${this._overlayClick} class=${classMap(menuClasses)}>
        <div class=${classMap(classes)} @animationend=${this._onTransitionEnd}>
          <ninja-header
            exportparts="ninja-input,ninja-input-wrapper"
            ${ref(this._headerRef)}
            .placeholder=${this.placeholder}
            .hideBreadcrumbs=${this.hideBreadcrumbs}
            .breadcrumbs=${this.breadcrumbs}
            @change=${this._handleInput}
            @setParent=${(event: CustomEvent<INinjaAction>) =>
              this.setParent(event.detail.parent)}
            @close=${this.close}
          >
          </ninja-header>
          <div class="modal-body">
            <div class="actions-list" part="actions-list">${itemTemplates}</div>
          </div>
          <slot name="footer"> ${footerHtml} </slot>
        </div>
      </div>
    `;
  }

  private get _selectedIndex(): number {
    if (!this._selected) {
      return -1;
    }
    return this._actionMatches.indexOf(this._selected);
  }

  private _actionSelected(action?: INinjaAction) {
    // fire selected event even when action is empty/not selected,
    // so possible handle api search for example
    this.dispatchEvent(
      new CustomEvent('selected', {
        detail: {search: this._search, action},
        bubbles: true,
        composed: true,
      })
    );

    if (!action) {
      return;
    }

    if (action.children && action.children?.length > 0) {
      this._currentRoot = action.id;
      this._search = '';
    }

    this._headerRef.value?.setSearch('');
    this._headerRef.value?.focusSearch();

    if (action.handler) {
      const result = action.handler(action);
      if (!result?.keepOpen) {
        this.close();
      }
    }

    this._bump = true;
  }

  private async _handleInput(event: CustomEvent<{search: string}>) {
    this._search = event.detail.search;
    await this.updateComplete;
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: {search: this._search, actions: this._actionMatches},
        bubbles: true,
        composed: true,
      })
    );
  }

  private _overlayClick(event: Event) {
    if ((event.target as HTMLElement)?.classList.contains('modal')) {
      this.close();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ninja-keys': NinjaKeys;
  }
}
