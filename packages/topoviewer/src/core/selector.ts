import type { GraphEntity, StyleRule } from './types';

interface SelectorCondition {
  field: string;
  op: '=' | '~=';
  value: string;
  start: number;
  end: number;
}

interface ParsedSelector {
  kind: string;
  conditions: SelectorCondition[];
}

export interface SelectorObjectIdReference {
  id: string;
  kind: string;
}

function selectorSpecificity(selector: string): number {
  const parsed = parseSelector(selector);
  return parsed?.conditions.reduce((score, condition) => (
    score + (condition.field === 'id' && condition.op === '=' ? 1000 : 10)
  ), 0) ?? 0;
}

const selectorKinds = new Set(['node', 'link', 'linkDirection', 'path', 'region', 'shape', 'callout', 'connector', 'text']);

function quotedValue(value: string): string {
  const escapes: Record<string, string> = { b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
  return value.replace(/\\(u[\da-fA-F]{4}|["'\\/bfnrt])/g, (_match, escaped: string) => (
    escaped.startsWith('u') ? String.fromCharCode(parseInt(escaped.slice(1), 16)) : escapes[escaped] ?? escaped
  ));
}

function parseSelector(selector = ''): ParsedSelector | undefined {
  const subject = selector.match(/^\s*([a-zA-Z][\w-]*)/);
  if (!subject || !selectorKinds.has(subject[1])) return undefined;
  const kind = subject[1];
  const conditions: SelectorCondition[] = [];
  const conditionPattern = /\[\s*([\w.-]+)\s*(=|~=)\s*(?:"((?:\\(?:u[\da-fA-F]{4}|["'\\/bfnrt])|[^"\\])*)"|'((?:\\(?:u[\da-fA-F]{4}|["'\\/bfnrt])|[^'\\])*)'|([^[\]"'=~!<>]+?))\s*\]/y;
  let cursor = subject[0].length;

  while (cursor < selector.length) {
    if (/\s/.test(selector[cursor])) {
      cursor += 1;
      continue;
    }
    conditionPattern.lastIndex = cursor;
    const match = conditionPattern.exec(selector);
    if (!match || (match[5] !== undefined && !match[5].trim())) return undefined;
    conditions.push({
      field: match[1],
      op: match[2] as '=' | '~=',
      value: match[5] !== undefined ? match[5].trim() : quotedValue(match[3] ?? match[4]),
      start: cursor,
      end: conditionPattern.lastIndex
    });
    cursor = conditionPattern.lastIndex;
  }

  return { kind, conditions };
}

export function selectorIsValid(selector: string): boolean {
  return parseSelector(selector) !== undefined;
}

export function selectorObjectIdReferences(selector: string): SelectorObjectIdReference[] {
  const parsed = parseSelector(selector);
  if (!parsed) return [];
  return parsed.conditions.flatMap((condition) => (
    condition.field === 'id' && condition.op === '=' ? [{ id: condition.value, kind: parsed.kind }] : []
  ));
}

export function selectorReferencesField(selector: string, field: string): boolean {
  return parseSelector(selector)?.conditions.some((condition) => (
    condition.field === field || condition.field.startsWith(`${field}.`)
  )) ?? false;
}

export function rewriteSelectorFieldValue(
  selector: string,
  kind: string | undefined,
  targetField: string,
  previousId: string,
  nextId: string
): string {
  const parsed = parseSelector(selector);
  if (!parsed || (kind && parsed.kind !== kind)) return selector;
  return parsed.conditions.reduceRight((result, condition) => (
    condition.field === targetField && condition.value === previousId
      ? result.slice(0, condition.start) + `[${condition.field} ${condition.op} ${JSON.stringify(nextId)}]` + result.slice(condition.end)
      : result
  ), selector);
}

export function rewriteSelectorObjectId(
  selector: string,
  kind: string,
  previousId: string,
  nextId: string
): string {
  return rewriteSelectorFieldValue(selector, kind, 'id', previousId, nextId);
}

function valueAt(entity: Record<string, unknown>, field: string): unknown {
  return field.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object') return (value as Record<string, unknown>)[key];
    return undefined;
  }, entity);
}

function styleSubject(entity: GraphEntity): Record<string, unknown> {
  return { ...(entity.data || {}), ...entity };
}

function conditionMatches(entity: Record<string, unknown>, condition: SelectorCondition): boolean {
  const actual = valueAt(entity, condition.field);

  if (condition.op === '~=') {
    return Array.isArray(actual)
      ? actual.map(String).includes(condition.value)
      : String(actual || '').split(/\s+/).includes(condition.value);
  }

  if (Array.isArray(actual)) return actual.map(String).includes(condition.value);
  return String(actual) === condition.value;
}

export function selectorMatches(kind: string, entity: GraphEntity, selector: string): boolean {
  const parsed = parseSelector(selector);
  if (!parsed || parsed.kind !== kind) return false;
  return parsed.conditions.every((condition) => conditionMatches(styleSubject(entity), condition));
}

export function matchingRules(kind: string, entity: GraphEntity, rules: StyleRule[] = []): StyleRule[] {
  return rules
    .map((rule, index) => ({ index, rule, specificity: selectorSpecificity(rule.selector) }))
    .filter(({ rule }) => selectorMatches(kind, entity, rule.selector))
    .sort((left, right) => left.specificity - right.specificity || left.index - right.index)
    .map(({ rule }) => rule);
}
