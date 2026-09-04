import {LitElement, html, TemplateResult, PropertyValues} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';
import {live} from 'lit/directives/live.js';
import {createRef, ref} from 'lit/directives/ref.js';
import {classMap} from 'lit/directives/class-map.js';
import hotkeys from 'hotkeys-js';

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
   * If true will register all hotkey for all actions
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
   * Show a modal
   */
  open(options: {parent?: string} = {}) {
    this._bump = true;
    this.visible = true;
    this._headerRef.value?.focusSearch();
    if (this._actionMatches.length > 0) {
      this._selected = this._actionMatches[0];
    }
    this.setParent(options.parent);
  }

  /**
   * Close modal
   */
  close() {
    this._bump = false;
    this.visible = false;
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
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._unregisterInternalHotkeys();
  }

  private _flattern(members: INinjaAction[], parent?: string): INinjaAction[] {
    let children: INinjaAction[] = [];
    if (!members) {
      members = [];
    }
    return (
      members
        .map((mem) => {
          const alreadyFlatternByUser =
            mem.children &&
            mem.children.some((value) => {
              return typeof value == 'string';
            });
          const m: INinjaAction = {...mem, parent: mem.parent || parent};
          if (alreadyFlatternByUser) {
            return m;
          } else {
            if (m.children && m.children.length > 0) {
              parent = mem.id;
              children = [
                ...children,
                ...(m.children as unknown as INinjaAction[]),
              ];
            }
            m.children = m.children
              ? m.children.map(
                  (c) => (c as unknown as INinjaAction).id ?? (c as string)
                )
              : [];
            return m;
          }
        })
        // `children` is filled by the .map() above, so the concat argument has to
        // be evaluated after it; a spread literal would read as if both halves
        // were independent of each other.
        // eslint-disable-next-line unicorn/prefer-spread
        .concat(
          children.length > 0 ? this._flattern(children, parent) : children
        )
    );
  }

  override update(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('data') && !this.disableHotkeys) {
      this._flatData = this._flattern(this.data);

      for (const action of this._flatData.filter((action) => !!action.hotkey)) {
        hotkeys(action.hotkey!, (event) => {
          event.preventDefault();
          if (action.handler) {
            action.handler(action);
          }
        });
      }
    }
    super.update(changedProperties);
  }

  private _registerInternalHotkeys() {
    if (this.openHotkey) {
      hotkeys(this.openHotkey, (event) => {
        event.preventDefault();
        if (this.visible) {
          this.close();
        } else {
          this.open();
        }
      });
    }

    if (this.selectHotkey) {
      hotkeys(this.selectHotkey, (event) => {
        if (!this.visible) {
          return;
        }
        event.preventDefault();
        this._actionSelected(this._actionMatches[this._selectedIndex]);
      });
    }

    if (this.goBackHotkey) {
      hotkeys(this.goBackHotkey, (event) => {
        if (!this.visible) {
          return;
        }
        if (!this._search) {
          event.preventDefault();
          this._goBack();
        }
      });
    }

    if (this.navigationDownHotkey) {
      hotkeys(this.navigationDownHotkey, (event) => {
        if (!this.visible) {
          return;
        }
        event.preventDefault();
        this._selected =
          this._selectedIndex >= this._actionMatches.length - 1
            ? this._actionMatches[0]
            : this._actionMatches[this._selectedIndex + 1];
      });
    }

    if (this.navigationUpHotkey) {
      hotkeys(this.navigationUpHotkey, (event) => {
        if (!this.visible) {
          return;
        }
        event.preventDefault();
        this._selected =
          this._selectedIndex === 0
            ? this._actionMatches.at(-1)
            : this._actionMatches[this._selectedIndex - 1];
      });
    }

    if (this.closeHotkey) {
      hotkeys(this.closeHotkey, () => {
        if (!this.visible) {
          return;
        }
        this.close();
      });
    }
  }

  private _unregisterInternalHotkeys() {
    if (this.openHotkey) {
      hotkeys.unbind(this.openHotkey);
    }

    if (this.selectHotkey) {
      hotkeys.unbind(this.selectHotkey);
    }

    if (this.goBackHotkey) {
      hotkeys.unbind(this.goBackHotkey);
    }

    if (this.navigationDownHotkey) {
      hotkeys.unbind(this.navigationDownHotkey);
    }

    if (this.navigationUpHotkey) {
      hotkeys.unbind(this.navigationUpHotkey);
    }

    if (this.closeHotkey) {
      hotkeys.unbind(this.closeHotkey);
    }
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

    // Plain case-insensitive substring match. Compiling the raw search text
    // into a RegExp made every metacharacter meaningful, so a lone "(" or "*"
    // threw SyntaxError out of render(), and a user searching for a title that
    // genuinely contains "(" could not find it.
    const search = this._search.toLowerCase();
    const actionMatches = this._flatData.filter((action) => {
      const matcher =
        action.title.toLowerCase().includes(search) ||
        !!action.keywords?.toLowerCase().includes(search);

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
