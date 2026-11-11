export interface INinjaAction {
  id: string;
  title: string;
  hotkey?: string;
  handler?: (action: INinjaAction) => {keepOpen?: boolean} | void;
  mdIcon?: string;
  icon?: string;
  parent?: string;
  keywords?: string;
  /**
   * The menu this action opens: the ids of its children in a flat list, or
   * the child actions themselves in a tree. ninja-keys flattens a tree into
   * ids, so a searcher always sees ids.
   */
  children?: string[] | INinjaAction[];
  section?: string;
}
