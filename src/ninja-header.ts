import {LitElement, html, css, TemplateResult} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {ref, createRef} from 'lit/directives/ref.js';
import {SearchSuggestion} from './searcher.js';

@customElement('ninja-header')
export class NinjaHeader extends LitElement {
  static override readonly styles = css`
    :host {
      flex: 1;
      position: relative;
    }
    .search {
      padding: 1.25em;
      flex-grow: 1;
      flex-shrink: 0;
      margin: 0px;
      border: none;
      appearance: none;
      font-size: 1.125em;
      background: transparent;
      caret-color: var(--ninja-accent-color);
      color: var(--ninja-text-color);
      outline: none;
      font-family: var(--ninja-font-family);
    }
    .search::placeholder {
      color: var(--ninja-placeholder-color);
    }
    .breadcrumb-list {
      padding: 1em 4em 0 1em;
      display: flex;
      flex-direction: row;
      align-items: stretch;
      justify-content: flex-start;
      flex: initial;
    }

    .breadcrumb {
      background: var(--ninja-secondary-background-color);
      text-align: center;
      line-height: 1.2em;
      border-radius: var(--ninja-key-border-radius);
      border: 0;
      cursor: pointer;
      padding: 0.1em 0.5em;
      color: var(--ninja-secondary-text-color);
      margin-right: 0.5em;
      outline: none;
      font-family: var(--ninja-font-family);
    }

    .search-wrapper {
      display: flex;
      border-bottom: var(--ninja-separate-border);
    }

    .search-hint {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.375em;
      padding-block: 0.5em;
      padding-inline: 1.25em;
      border-block-end: var(--ninja-separate-border);
      font-size: 0.875em;
      color: var(--ninja-secondary-text-color);
    }

    .suggestion {
      display: inline-flex;
      align-items: baseline;
      gap: 0.375em;
      padding-block: 0.125em;
      padding-inline: 0.5em;
      border: 0;
      border-radius: var(--ninja-key-border-radius);
      background: var(--ninja-secondary-background-color);
      color: var(--ninja-text-color);
      font: inherit;
      cursor: pointer;
    }
    .suggestion:hover,
    .suggestion:focus-visible {
      outline: 1px solid var(--ninja-accent-color);
    }
    .suggestion-label {
      font-family: var(--ninja-code-font-family, ui-monospace, monospace);
    }
    .suggestion-detail,
    .tab-hint {
      color: var(--ninja-secondary-text-color);
      font-size: 0.85em;
    }
    .tab-hint {
      border: 1px solid var(--ninja-secondary-background-color);
      border-radius: var(--ninja-key-border-radius);
      padding-inline: 0.3em;
    }
    .notice {
      flex-basis: 100%;
      font-style: italic;
    }
  `;

  @property()
  placeholder = '';

  @property({type: Boolean})
  hideBreadcrumbs = false;

  @property()
  breadcrumbHome = 'Home';

  @property({type: Array})
  breadcrumbs: string[] = [];

  /** One line from the searcher about the query, shown under the input. */
  @property()
  notice = '';

  /** The searcher's completions, shown under the input; Tab takes the first. */
  @property({attribute: false})
  suggestions: readonly SearchSuggestion[] = [];

  private _inputRef = createRef<HTMLInputElement>();

  override render() {
    let breadcrumbs: TemplateResult<1> | '' = '';
    if (!this.hideBreadcrumbs) {
      const itemTemplates = [];
      for (const breadcrumb of this.breadcrumbs) {
        itemTemplates.push(
          html`<button
            tabindex="-1"
            @click=${() => this.selectParent(breadcrumb)}
            class="breadcrumb"
          >
            ${breadcrumb}
          </button>`
        );
      }
      breadcrumbs = html`<div class="breadcrumb-list">
        <button
          tabindex="-1"
          @click=${() => this.selectParent()}
          class="breadcrumb"
        >
          ${this.breadcrumbHome}
        </button>
        ${itemTemplates}
      </div>`;
    }

    return html`
      ${breadcrumbs}
      <div part="ninja-input-wrapper" class="search-wrapper">
        <input
          part="ninja-input"
          type="text"
          id="search"
          spellcheck="false"
          autocomplete="off"
          @input="${this._handleInput}"
          @keyup="${this._handleCaret}"
          @click="${this._handleCaret}"
          ${ref(this._inputRef)}
          placeholder="${this.placeholder}"
          class="search"
        />
      </div>
      ${this._renderHint()}
    `;
  }

  private _renderHint() {
    if (this.suggestions.length === 0 && !this.notice) {
      return '';
    }
    return html`<div part="ninja-search-hint" class="search-hint">
      ${this.suggestions.map(
        (suggestion, index) =>
          html`<button
            part="ninja-suggestion"
            class="suggestion"
            tabindex="-1"
            @click=${() => this._takeSuggestion(suggestion)}
          >
            <span class="suggestion-label">${suggestion.label}</span>
            ${suggestion.detail
              ? html`<span class="suggestion-detail"
                  >${suggestion.detail}</span
                >`
              : ''}
            ${index === 0 ? html`<kbd class="tab-hint">Tab</kbd>` : ''}
          </button>`
      )}
      ${this.notice
        ? html`<span part="ninja-notice" class="notice">${this.notice}</span>`
        : ''}
    </div>`;
  }

  /** Replace the text, putting the caret at `cursor` (the end when omitted). */
  setSearch(value: string, cursor?: number) {
    const input = this._inputRef.value;
    if (input) {
      input.value = value;
      const at = cursor ?? value.length;
      input.setSelectionRange(at, at);
    }
  }

  private _takeSuggestion(suggestion: SearchSuggestion) {
    this.dispatchEvent(
      new CustomEvent('suggestionTaken', {
        detail: suggestion,
        bubbles: false,
        composed: false,
      })
    );
  }

  /** Completions depend on the caret, which moves without an input event. */
  private _handleCaret() {
    const input = this._inputRef.value;
    if (!input) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent('caret', {
        detail: {cursor: input.selectionStart ?? input.value.length},
        bubbles: false,
        composed: false,
      })
    );
  }

  focusSearch() {
    requestAnimationFrame(() => this._inputRef.value?.focus());
  }

  private _handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent('change', {
        detail: {
          search: input.value,
          cursor: input.selectionStart ?? undefined,
        },
        bubbles: false,
        composed: false,
      })
    );
  }

  private selectParent(breadcrumb?: string) {
    this.dispatchEvent(
      new CustomEvent('setParent', {
        detail: {parent: breadcrumb},
        bubbles: true,
        composed: true,
      })
    );
  }

  override firstUpdated() {
    this.focusSearch();
  }

  _close() {
    this.dispatchEvent(
      new CustomEvent('close', {bubbles: true, composed: true})
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ninja-header': NinjaHeader;
  }
}
