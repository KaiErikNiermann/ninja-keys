/** One entry in the palette: a command, a link, or a menu of more actions. */
export interface INinjaAction {
  /**
   * Unique across all actions. Child actions name their menu by it in
   * `parent`, and the breadcrumbs show it while that menu is open.
   */
  id: string;
  /** The text shown in the list, and searched. */
  title: string;
  /**
   * A shortcut that runs `handler` from anywhere on the page, written as
   * hotkeys-js takes it (`ctrl+n`, `cmd+shift+p`, `alt+1,alt+2` for either).
   * Shown on the action's row.
   */
  hotkey?: string;
  /**
   * Runs when the action is chosen, by Enter, a click or its hotkey. The
   * palette closes afterwards unless it returns `{keepOpen: true}`.
   */
  handler?: (action: INinjaAction) => {keepOpen?: boolean} | void;
  /** A Material Icons ligature name (`settings`, `dark_mode`). */
  mdIcon?: string;
  /**
   * HTML for a custom icon, usually an `<svg>`; give it the `ninja-icon`
   * class to size it like the built-in ones. Rendered unescaped, so never
   * put untrusted text in it.
   */
  icon?: string;
  /** The `id` of the menu this action is in, for a flat list. */
  parent?: string;
  /** More words to match, separated by spaces; not shown. */
  keywords?: string;
  /**
   * The menu this action opens: the ids of its children in a flat list, or
   * the child actions themselves in a tree. ninja-keys flattens a tree into
   * ids, so a searcher always sees ids.
   */
  children?: string[] | INinjaAction[];
  /** A heading the action is grouped under, in the order sections appear. */
  section?: string;
}
