/**
 * The API reference, generated from the library itself:
 *
 * - `custom-elements.json` (from `cem analyze`) for what only the element
 *   has: attributes, events, the slot, shadow parts and CSS properties;
 * - TypeDoc's JSON (`npm run api`) for TypeScript types: property and
 *   method signatures, functions, interfaces and type aliases.
 *
 * Both are read at build time; pages get plain data with HTML already
 * rendered.
 */

import type * as Cem from 'custom-elements-manifest/schema';
import {marked} from 'marked';
import type {JSONOutput} from 'typedoc';

import manifestJson from '../../../../custom-elements.json';
import typedocJson from '../api/typedoc.json';
import {highlight} from '../../../highlight.ts';
import {signatureText, typeText} from './types.ts';
import {anchorFor} from '../anchors.ts';
import type {
  ApiEntry,
  ApiMember,
  ApiModule,
  ApiReference,
  ElementApi,
} from '../api.ts';

const manifest = manifestJson as unknown as Cem.Package;
const project = typedocJson as unknown as JSONOutput.ProjectReflection;

if (!manifest.schemaVersion || !project.schemaVersion) {
  throw new Error('custom-elements.json or typedoc.json is not what it seems');
}

/** TypeDoc reflection kinds this page reads (typedoc's ReflectionKind). */
const Kind = {
  Variable: 32,
  Function: 64,
  Class: 128,
  Interface: 256,
  Property: 1024,
  Method: 2048,
  Accessor: 262_144,
  TypeAlias: 2_097_152,
} as const;

const markdown = (text: string | undefined): string =>
  text ? marked.parse(text, {async: false, gfm: true}) : '';

const commentText = (comment: JSONOutput.Comment | undefined): string =>
  (comment?.summary ?? []).map((part) => part.text).join('');

/** A TypeDoc comment as HTML: its summary, then any `@example` blocks. */
function commentHtml(comment: JSONOutput.Comment | undefined): string {
  const examples = (comment?.blockTags ?? [])
    .filter((tag) => tag.tag === '@example')
    .map((tag) => tag.content.map((part) => part.text).join(''));
  return markdown([commentText(comment), ...examples].join('\n\n'));
}

const code = async (source: string) => highlight(source, 'ts', 'notwoslash');

/* ---------------------------------------------------------------- element */

const elementDeclaration = (tag: string): Cem.CustomElementDeclaration => {
  const declarations = manifest.modules.flatMap(
    (module) => module.declarations ?? []
  );
  for (const declaration of declarations) {
    if (
      declaration.kind === 'class' &&
      'customElement' in declaration &&
      declaration.tagName === tag
    ) {
      return declaration;
    }
  }
  throw new Error(`<${tag}> is not in custom-elements.json`);
};

const reflectionNamed = (
  name: string
): JSONOutput.DeclarationReflection | undefined =>
  (project.children ?? [])
    .flatMap((module) => module.children ?? [])
    .find((child) => child.name === name);

const isPublic = (member: Cem.ClassMember): boolean =>
  !member.name.startsWith('_') &&
  member.privacy !== 'private' &&
  member.privacy !== 'protected' &&
  !member.static;

async function elementApi(tag: string, className: string): Promise<ElementApi> {
  const declaration = elementDeclaration(tag);
  const reflection = reflectionNamed(className);
  const typed = new Map(
    (reflection?.children ?? []).map((child) => [child.name, child])
  );
  const attributes = new Map(
    (declaration.attributes ?? []).map((a) => [a.fieldName ?? a.name, a])
  );
  const members = (declaration.members ?? []).filter((m) => isPublic(m));
  const scope = `${tag}-`;

  const properties = await Promise.all(
    members
      .filter((m): m is Cem.ClassField => m.kind === 'field')
      .map(async (field): Promise<ApiMember> => {
        const type = typed.get(field.name)?.type;
        const typeString = type ? typeText(type) : (field.type?.text ?? '');
        // `data` has an attribute in the manifest (Lit gives every property
        // one), but an array of actions with handlers is set as a property.
        const attribute =
          field.name === 'data' ? undefined : attributes.get(field.name)?.name;
        return {
          name: field.name,
          anchor: anchorFor(scope, field.name),
          signature: await code(`${field.name}: ${typeString}`),
          description: markdown(field.description),
          ...(field.default !== undefined && {default: field.default}),
          ...(attribute !== undefined && {attribute}),
        };
      })
  );

  const methods = await Promise.all(
    members
      .filter((m): m is Cem.ClassMethod => m.kind === 'method')
      .map(async (method): Promise<ApiMember> => {
        const signature = typed.get(method.name)?.signatures?.[0];
        const text = signature
          ? `${method.name}${signatureText(signature, ': ')}`
          : `${method.name}()`;
        return {
          name: method.name,
          anchor: anchorFor(scope, method.name),
          signature: await code(text),
          description: markdown(method.description),
        };
      })
  );

  const named = (
    items: readonly {name: string; description?: string; default?: string}[]
  ): ApiMember[] =>
    items.map((item) => ({
      name: item.name,
      anchor: anchorFor(scope, item.name),
      signature: '',
      description: markdown(item.description),
      ...(item.default !== undefined && {default: item.default}),
    }));

  return {
    tag,
    description: markdown(declaration.description),
    properties,
    methods,
    events: named(declaration.events ?? []),
    slots: named(declaration.slots ?? []),
    parts: named(declaration.cssParts ?? []),
    cssProperties: named(declaration.cssProperties ?? []),
  };
}

/* ---------------------------------------------------------------- modules */

/** The import specifier a TypeDoc module is published under. */
const SPECIFIERS: Readonly<Record<string, string>> = {
  'ninja-keys': 'ninja-keys',
  catsearch: 'ninja-keys/catsearch',
};

async function interfaceMembers(
  declaration: JSONOutput.DeclarationReflection
): Promise<ApiMember[]> {
  return Promise.all(
    (declaration.children ?? []).map(async (child) => {
      const optional = child.flags.isOptional ? '?' : '';
      const readonly = child.flags.isReadonly ? 'readonly ' : '';
      const type = child.type ? typeText(child.type) : 'unknown';
      return {
        name: child.name,
        anchor: anchorFor(`${declaration.name}-`, child.name),
        signature: await code(`${readonly}${child.name}${optional}: ${type}`),
        description: commentHtml(child.comment),
      };
    })
  );
}

async function entry(
  declaration: JSONOutput.DeclarationReflection
): Promise<ApiEntry | undefined> {
  const {name} = declaration;
  const source = declaration.sources?.[0]?.url;
  // The symbol's own name, case and all: `/api#INinjaAction`.
  const base = {name, anchor: name, source: source ?? ''};

  switch (declaration.kind) {
    case Kind.Function: {
      const [signature] = declaration.signatures ?? [];
      if (!signature) return undefined;
      return {
        ...base,
        kind: 'function',
        signature: await code(
          `function ${name}${signatureText(signature, ': ')}`
        ),
        description: commentHtml(signature.comment),
        members: [],
      };
    }
    case Kind.Variable: {
      const type = declaration.type ? typeText(declaration.type) : 'unknown';
      return {
        ...base,
        kind: 'const',
        signature: await code(`const ${name}: ${type}`),
        description: commentHtml(declaration.comment),
        members: [],
      };
    }
    case Kind.Interface: {
      const generics = declaration.typeParameters?.length
        ? `<${declaration.typeParameters
            .map((p) => p.name + (p.type ? ` extends ${typeText(p.type)}` : ''))
            .join(', ')}>`
        : '';
      return {
        ...base,
        kind: 'interface',
        signature: await code(`interface ${name}${generics}`),
        description: commentHtml(declaration.comment),
        members: await interfaceMembers(declaration),
      };
    }
    case Kind.TypeAlias: {
      const type = declaration.type ? typeText(declaration.type) : 'unknown';
      return {
        ...base,
        kind: 'type',
        signature: await code(`type ${name} = ${type}`),
        description: commentHtml(declaration.comment),
        members: [],
      };
    }
    default: {
      // The element class is documented from the manifest instead.
      return undefined;
    }
  }
}

async function modules(): Promise<ApiModule[]> {
  return Promise.all(
    (project.children ?? []).map(async (module) => {
      const specifier = SPECIFIERS[module.name];
      if (!specifier) {
        throw new Error(
          `no import specifier for TypeDoc module ${module.name}`
        );
      }
      const entries = await Promise.all(
        (module.children ?? []).map((child) => entry(child))
      );
      return {
        specifier,
        entries: entries.filter((e): e is ApiEntry => e !== undefined),
      };
    })
  );
}

async function build(): Promise<ApiReference> {
  const element = await elementApi('ninja-keys', 'NinjaKeys');
  const all = await modules();
  // The main entry first, as the page reads top-down from the element.
  all.sort((a, b) => a.specifier.length - b.specifier.length);
  return {element, modules: all};
}

/** The whole reference, built once per build. */
export const apiReference = (() => {
  let built: Promise<ApiReference> | undefined;
  return () => (built ??= build());
})();
