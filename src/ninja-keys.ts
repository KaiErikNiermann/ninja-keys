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
import {
  Searcher,
  SearchSuggestion,
  defaultSearcher,
  groupBySection,
} from './searcher.js';

export type {
  Searcher,
  SearchContext,
  SearchResult,
  SearchSuggestion,
} from './searcher.js';
export {defaultSearcher, groupBySection} from './searcher.js';
export type {INinjaAction} from './interfaces/ininja-action.js';

/**
 * A keyboard command palette: a modal list of actions, opened with a hotkey,
 * searched as you type, with nested menus and per-action hotkeys.
 *
 * @fires change - On every change of the search text. `detail` is
 *   `{search: string, actions: INinjaAction[]}`, the actions now shown.
 * @fires selected - When an action is chosen, or Enter is pressed with
 *   nothing to choose. `detail` is `{search: string, action?: INinjaAction}`.
 * @fires open - When the palette becomes visible, however it was opened.
 * @fires close - When the palette is hidden, however it was closed: a
 *   method, a hotkey, Escape, a click on the overlay, or an action.
 *
 * @slot footer - Replaces the key-hint footer; an empty element hides it.
 *
 * @csspart actions-list - The scrolling list that holds every action.
 * @csspart ninja-action - One action row.
 * @csspart ninja-selected - The selected action row.
 * @csspart ninja-icon - An action's Material icon.
 * @csspart ninja-input - The search input.
 * @csspart ninja-input-wrapper - The element around the search input.
 * @csspart ninja-search-hint - The line under the input holding a
 *   searcher's completions and notice.
 * @csspart ninja-suggestion - One completion chip.
 * @csspart ninja-notice - A searcher's notice.
 *
 * @cssprop [--ninja-width=640px] - Width of the palette.
 * @cssprop [--ninja-top=20%] - Distance from the top of the viewport.
 * @cssprop [--ninja-font-size=16px] - Base size every other size scales from.
 * @cssprop [--ninja-font-family=inherit] - Font of the palette.
 * @cssprop [--ninja-code-font-family=ui-monospace, monospace] - Font of
 *   completion chips.
 * @cssprop [--ninja-z-index=1] - Stacking order of the overlay.
 * @cssprop [--ninja-backdrop-filter=none] - Filter behind the overlay, such
 *   as `blur(4px)`.
 * @cssprop [--ninja-overflow-background=rgba(255, 255, 255, 0.5)] - The
 *   overlay over the page.
 * @cssprop [--ninja-modal-background=#fff] - Background of the palette.
 * @cssprop [--ninja-modal-shadow=rgb(0 0 0 / 50%) 0px 16px 70px] - Shadow of
 *   the palette.
 * @cssprop [--ninja-text-color=rgb(60, 65, 73)] - Text.
 * @cssprop [--ninja-accent-color=rgb(110, 94, 210)] - Caret, selection
 *   bar and focused chips.
 * @cssprop [--ninja-secondary-text-color=rgb(107, 111, 118)] - Hints, keys
 *   and breadcrumbs.
 * @cssprop [--ninja-secondary-background-color=rgb(239, 241, 244)] - Key
 *   badges, breadcrumbs and chips.
 * @cssprop [--ninja-selected-background=rgb(248, 249, 251)] - The selected
 *   row.
 * @cssprop [--ninja-selected-text-color=inherit] - Text of the selected row.
 * @cssprop [--ninja-placeholder-color=#8e8e8e] - Placeholder of the input.
 * @cssprop [--ninja-group-text-color=rgb(144, 149, 157)] - Section headers.
 * @cssprop [--ninja-icon-color=var(--ninja-secondary-text-color)] - Icons.
 * @cssprop [--ninja-icon-size=1.2em] - Icons.
 * @cssprop [--ninja-key-border-radius=0.25em] - Key badges, breadcrumbs and
 *   chips.
 * @cssprop [--ninja-separate-border=1px solid var(--ninja-secondary-background-color)] -
 *   Lines between the input, the list and the footer.
 * @cssprop [--ninja-actions-height=300px] - Maximum height of the list.
 * @cssprop [--ninja-footer-background=rgba(242, 242, 242, 0.4)] - The footer.
 */
@customElement('ninja-keys')
export class NinjaKeys extends LitElement {
  static override readonly styles = [baseStyles];

  /** Placeholder of the search input. */
  @property({type: String}) placeholder = 'Type a command or search...';

  /**
   * If true, the hotkeys declared by actions are not registered. The palette's
   * own navigation keys stay bound.
   */
  @property({type: Boolean}) disableHotkeys = false;

  /** Hide the breadcrumb row above the input that shows the open menu. */
  @property({type: Boolean}) hideBreadcrumbs = false;

  /**
   * Opens the palette, or closes it when open. Any hotkeys-js key list;
   * an empty string binds no key, for a palette opened only by `open()`.
   */
  @property() openHotkey = 'cmd+k,ctrl+k';

  /** Moves the selection up, wrapping at the top. */
  @property() navigationUpHotkey = 'up,shift+tab';

  /**
   * Moves the selection down, wrapping at the bottom. While the searcher
   * offers completions, Tab takes the first instead.
   */
  @property() navigationDownHotkey = 'down,tab';

  /** Closes the palette. */
  @property() closeHotkey = 'esc';

  /** Goes up one menu level, when the search box is empty. */
  @property() goBackHotkey = 'backspace';

  /**
   * Chooses the selected action: runs its handler, or opens its menu. With
   * nothing selected it still fires `selected`, with no action.
   */
  @property() selectHotkey = 'enter';

  /**
   * Show an action's hotkey as one badge (`ctrl+n`) rather than a badge per
   * key.
   */
  @property({type: Boolean}) hotKeysJoinedView = false;

  /**
   * Do not add the Material Icons stylesheet from Google Fonts to the page
   * on connect. Set it when the actions use `icon` rather than `mdIcon`, or
   * when the page loads the font itself.
   */
  @property({type: Boolean}) noAutoLoadMdIcons = false;

  /**
   * The actions, as a flat list (children name their menu in `parent`) or
   * a tree (menus hold their children in `children`). Assign a new array to
   * change it; the hotkeys are rebound each time.
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
   * Decides which actions a search shows, and may add a notice and
   * completions under the search box. The default is the regular-expression
   * match over `title` and `keywords`; `ninja-keys/catsearch` provides a
   * field query language (`section:guides under.title:rendering`).
   */
  @property({attribute: false}) searcher: Searcher = defaultSearcher;

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
      void this.updateComplete.then(() =>
        this._headerRef.value?.setSearch(search)
      );
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
    this._cursor = undefined;
    this._headerRef.value?.setSearch('');
  }

  /** Whether the palette is open. Read it; use open() and close() to change it. */
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

  /** The caret in the search box, or undefined for the end of the text. */
  @state()
  private _cursor?: number;

  /** The searcher's completions from the last render. */
  private _suggestions: readonly SearchSuggestion[] = [];

  @state()
  private _currentRoot?: string;

  /** `data` flattened: every action at every level, children as ids. */
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

      const nested = (m.children ?? []) as INinjaAction[];
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
      // While the searcher offers completions, Tab completes instead of
      // moving down, as it does in a shell; the arrow keys still move.
      const [suggestion] = this._suggestions;
      if (event?.key === 'Tab' && suggestion) {
        this._takeSuggestion(suggestion);
        return;
      }
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

    const result = this.searcher(this._search, this._flatData, {
      root: this._currentRoot,
      // open({search}) and a cleared box leave no caret; read those as the end.
      cursor: Math.min(this._cursor ?? Infinity, this._search.length),
    });
    this._suggestions = result.suggestions ?? [];
    const notice = result.notice ?? '';
    const sections = groupBySection(result.actions);

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
            exportparts="ninja-input,ninja-input-wrapper,ninja-search-hint,ninja-suggestion,ninja-notice"
            ${ref(this._headerRef)}
            .placeholder=${this.placeholder}
            .hideBreadcrumbs=${this.hideBreadcrumbs}
            .breadcrumbs=${this.breadcrumbs}
            .notice=${notice}
            .suggestions=${this._suggestions}
            @change=${this._handleInput}
            @suggestionTaken=${(event: CustomEvent<SearchSuggestion>) =>
              this._takeSuggestion(event.detail)}
            @caret=${(event: CustomEvent<{cursor: number}>) => {
              this._cursor = event.detail.cursor;
            }}
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

  /** Take a completion as if it had been typed: it fires `change` too. */
  private _takeSuggestion(suggestion: SearchSuggestion) {
    this._headerRef.value?.setSearch(suggestion.search, suggestion.cursor);
    this._headerRef.value?.focusSearch();
    this._selected = undefined;
    void this._searchChanged(suggestion.search, suggestion.cursor);
  }

  private _handleInput(event: CustomEvent<{search: string; cursor?: number}>) {
    void this._searchChanged(event.detail.search, event.detail.cursor);
  }

  private async _searchChanged(search: string, cursor?: number) {
    this._search = search;
    this._cursor = cursor;
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
