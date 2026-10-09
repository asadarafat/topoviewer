import { describe, expect, it } from 'vitest';
import { lintTopoDocument } from '../../src/core/lint';
import { matchingRules, rewriteSelectorObjectId, selectorIsValid, selectorMatches, selectorObjectIdReferences } from '../../src/core/selector';
import { styleExactIdSelector, styleSelectorIsValid } from '../../src/core/styleAuthoringSelectors';

describe('selector grammar and matching', () => {
  const node = { id: 'b', labels: { name: 'Edge router', role: 'leaf', protocols: 'ospf bgp' }, layers: ['physical', 'service'] };

  it.each([
    'node[id="a"', 'node garbage', 'node[id!="a"]', 'node[id="a"] garbage',
    'node[id="a"] OR node', 'node, link', 'node[id="a"][', 'node[id="a]',
    'node[id=]', 'node[id==a]', 'node[labels.role]', 'node[id="a" extra]',
    'nodeGroup', '[id="b"]'
  ])('rejects the entire malformed selector %s instead of applying a broader rule', (selector) => {
    expect(selectorIsValid(selector)).toBe(false);
    expect(styleSelectorIsValid(selector)).toBe(false);
    expect(selectorMatches('node', node, selector)).toBe(false);
    expect(matchingRules('node', node, [{ selector, style: { backgroundColor: 'red' } }])).toEqual([]);
    const issues = lintTopoDocument({ stylesheet: [{ selector, style: { backgroundColor: 'red' } }] });
    expect(issues).toContainEqual(expect.objectContaining({
      code: 'invalid-selector', severity: 'error', path: 'stylesheet[0].selector'
    }));
    expect(issues.some((issue) => issue.code === 'unused-selector')).toBe(false);
  });

  it.each([
    'node', ' node [ labels.role = leaf ] [layers ~= service] ',
    'node[labels.name = "Edge router"]', "node[labels.role = 'leaf']",
    'node[labels.protocols ~= bgp]', 'node[layers = physical]'
  ])('preserves supported matching for %s', (selector) => {
    expect(selectorIsValid(selector)).toBe(true);
    expect(styleSelectorIsValid(selector)).toBe(true);
    expect(selectorMatches('node', node, selector)).toBe(true);
  });

  it('round-trips quoted IDs through authoring, matching, references and rename', () => {
    const id = ' edge-"01\\port] ';
    const renamed = ' edge-"02\\port] ';
    const selector = styleExactIdSelector('node', id);
    expect(styleSelectorIsValid(selector)).toBe(true);
    expect(selectorMatches('node', { id }, selector)).toBe(true);
    expect(selectorMatches('node', { id: 'other' }, selector)).toBe(false);
    expect(selectorObjectIdReferences(selector)).toEqual([{ kind: 'node', id }]);
    const next = rewriteSelectorObjectId(selector, 'node', id, renamed);
    expect(next).toBe(styleExactIdSelector('node', renamed));
    expect(selectorMatches('node', { id: renamed }, next)).toBe(true);
    expect(rewriteSelectorObjectId(`${selector} invalid`, 'node', id, renamed)).toBe(`${selector} invalid`);
  });
});
