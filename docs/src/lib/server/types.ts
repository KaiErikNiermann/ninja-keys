/**
 * TypeScript types from TypeDoc's JSON, printed back as source text: the
 * signatures the API reference shows.
 */

import type {JSONOutput} from 'typedoc';

type SomeType = JSONOutput.SomeType;
type Signature = JSONOutput.SignatureReflection;
type Declaration = JSONOutput.DeclarationReflection;

/** Wrap in parentheses where a union or function would bind wrongly. */
const grouped = (type: SomeType): string => {
  const text = typeText(type);
  return type.type === 'union' ||
    type.type === 'intersection' ||
    (type.type === 'reflection' && type.declaration.signatures)
    ? `(${text})`
    : text;
};

const typeArguments = (args: readonly SomeType[] | undefined): string =>
  args?.length ? `<${args.map((arg) => typeText(arg)).join(', ')}>` : '';

/** One parameter: `name?: Type` or `...name: Type[]`. */
export function parameterText(parameter: JSONOutput.ParameterReflection) {
  const rest = parameter.flags.isRest ? '...' : '';
  const optional =
    parameter.flags.isOptional || parameter.defaultValue !== undefined
      ? '?'
      : '';
  const type = parameter.type ? `: ${typeText(parameter.type)}` : '';
  return `${rest}${parameter.name}${optional}${type}`;
}

const typeParameters = (
  parameters: readonly JSONOutput.TypeParameterReflection[] | undefined
): string =>
  parameters?.length
    ? `<${parameters
        .map(
          (p) =>
            p.name +
            (p.type ? ` extends ${typeText(p.type)}` : '') +
            (p.default ? ` = ${typeText(p.default)}` : '')
        )
        .join(', ')}>`
    : '';

/** `<T>(a: A, b: B)` and the return type, joined by `arrow`. */
export function signatureText(signature: Signature, arrow: ': ' | ' => ') {
  const parameters = (signature.parameters ?? []).map((p) => parameterText(p));
  const returns = signature.type ? typeText(signature.type) : 'void';
  return `${typeParameters(signature.typeParameters)}(${parameters.join(', ')})${arrow}${returns}`;
}

/** An object type's members, one per line when there are several. */
function objectText(declaration: Declaration): string {
  const members = (declaration.children ?? []).map((child) => {
    const optional = child.flags.isOptional ? '?' : '';
    const readonly = child.flags.isReadonly ? 'readonly ' : '';
    const type = child.type ? typeText(child.type) : 'unknown';
    return `${readonly}${child.name}${optional}: ${type}`;
  });
  return members.length === 0 ? '{}' : `{${members.join('; ')}}`;
}

function literalText(value: JSONOutput.LiteralType['value']): string {
  if (value === null) return 'null';
  if (typeof value === 'object') {
    return `${value.negative ? '-' : ''}${value.value}n`;
  }
  return JSON.stringify(value);
}

function predicateText(type: JSONOutput.PredicateType): string {
  if (!type.targetType) return `asserts ${type.name}`;
  const asserts = type.asserts ? 'asserts ' : '';
  return `${asserts}${type.name} is ${typeText(type.targetType)}`;
}

/** A function type when it has one signature, else an object type. */
function reflectionText(declaration: Declaration): string {
  const [signature, ...overloads] = declaration.signatures ?? [];
  return signature && overloads.length === 0
    ? signatureText(signature, ' => ')
    : objectText(declaration);
}

/** A type as it would be written in TypeScript. */
export function typeText(type: SomeType): string {
  switch (type.type) {
    case 'intrinsic':
    case 'unknown': {
      return type.name;
    }
    case 'literal': {
      return literalText(type.value);
    }
    case 'reference': {
      return type.name + typeArguments(type.typeArguments);
    }
    case 'array': {
      return `${grouped(type.elementType)}[]`;
    }
    case 'union': {
      return type.types.map((t) => typeText(t)).join(' | ');
    }
    case 'intersection': {
      return type.types.map((t) => grouped(t)).join(' & ');
    }
    case 'tuple': {
      return `[${(type.elements ?? []).map((t) => typeText(t)).join(', ')}]`;
    }
    case 'namedTupleMember': {
      return `${type.name}${type.isOptional ? '?' : ''}: ${typeText(type.element)}`;
    }
    case 'optional': {
      return `${typeText(type.elementType)}?`;
    }
    case 'rest': {
      return `...${typeText(type.elementType)}`;
    }
    case 'typeOperator': {
      return `${type.operator} ${typeText(type.target)}`;
    }
    case 'query': {
      return `typeof ${typeText(type.queryType)}`;
    }
    case 'indexedAccess': {
      return `${grouped(type.objectType)}[${typeText(type.indexType)}]`;
    }
    case 'predicate': {
      return predicateText(type);
    }
    case 'conditional': {
      return `${typeText(type.checkType)} extends ${typeText(type.extendsType)} ? ${typeText(type.trueType)} : ${typeText(type.falseType)}`;
    }
    case 'inferred': {
      return `infer ${type.name}`;
    }
    case 'templateLiteral': {
      const tail = type.tail
        .map(([t, text]) => `\${${typeText(t)}}${text}`)
        .join('');
      return `\`${type.head}${tail}\``;
    }
    case 'mapped': {
      return `{[${type.parameter} in ${typeText(type.parameterType)}]: ${typeText(type.templateType)}}`;
    }
    case 'reflection': {
      return reflectionText(type.declaration);
    }
  }
}
