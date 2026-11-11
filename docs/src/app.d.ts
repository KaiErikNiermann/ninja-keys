// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {}
}

declare module '*.md' {
  import type {Component} from 'svelte';
  const content: Component;
  export default content;
  export const metadata: Readonly<Record<string, unknown>>;
}

/** A source file as highlighted, type-checked HTML (see highlight.ts). */
declare module '*?highlight' {
  const html: string;
  export default html;
}

export {};
