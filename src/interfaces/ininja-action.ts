export interface INinjaAction {
  id: string;
  title: string;
  hotkey?: string;
  handler?: (action: INinjaAction) => {keepOpen?: boolean} | void;
  mdIcon?: string;
  icon?: string;
  parent?: string;
  keywords?: string;
  children?: string[];
  section?: string;
}
