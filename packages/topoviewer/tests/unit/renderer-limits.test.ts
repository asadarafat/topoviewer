import { describe, expect, it } from 'vitest';
import { compileTopoGraph } from '../../src/core/compiler';
import { rendererLimitUsage, rendererLimitViolations } from '../../src/core/limits';
import type { TopoDocument } from '../../src/core/types';

describe('expanded renderer limits', () => {
  it('bounds generated pins before expanding a small source graph', () => {
    const document: TopoDocument = {
      layout: { mode: 'manual' },
      graph: {
        layers: [{ id: 'l' }],
        nodes: [{ id: 'node', layers: ['l'], pins: Array.from({ length: 1500 }, (_, index) => ({ id: String(index) })) }]
      }
    };
    expect(rendererLimitUsage(document)).toMatchObject({ nodes: 1, pins: 1500 });
    expect(() => compileTopoGraph(document)).toThrow(/pins exceeds renderer limit/);
    document.limits = { maxPins: 1500 };
    expect(compileTopoGraph(document).nodes).toHaveLength(1501);
  });

  it('counts absolute anchors and regions independently of graph nodes', () => {
    const document: TopoDocument = {
      graph: { regions: [{ id: 'r1' }, { id: 'r2' }] },
      diagram: {
        connectors: [{ id: 'c', sourcePosition: [0, 0], targetPosition: [1, 1] }],
        callouts: [{ id: 'a', sourcePosition: [0, 0], targetPosition: [1, 1], pins: [{ id: 'p' }] }]
      },
      limits: { maxRegions: 1, maxPins: 4 }
    };
    expect(rendererLimitUsage(document)).toMatchObject({ regions: 2, pins: 5 });
    expect(rendererLimitViolations(document)).toEqual(expect.arrayContaining([
      'regions exceeds renderer limit: 2 > 1', 'pins exceeds renderer limit: 5 > 4'
    ]));
  });

  it('counts every inherited child path segment instead of one per child path', () => {
    const document: TopoDocument = {
      graph: {
        paths: [
          { id: 'parent', sequence: ['a', 'b', 'c', 'd'] },
          { id: 'child', parent: 'parent', source: 'a', target: 'd' }
        ]
      },
      limits: { maxPathSegments: 5 }
    };
    expect(rendererLimitUsage(document)).toMatchObject({ pathSegments: 6, edges: 6 });
    expect(rendererLimitViolations(document)).toContain('path segments exceeds renderer limit: 6 > 5');
    document.graph!.paths![1].sequence = ['a', 'd'];
    expect(rendererLimitUsage(document)).toMatchObject({ pathSegments: 6, edges: 6 });
  });

  it('budgets unresolved carried paths that still contribute endpoint links to force layout', () => {
    const document: TopoDocument = {
      layout: { mode: 'force' },
      graph: {
        layers: [{ id: 'l' }],
        nodes: [{ id: 'a', layers: ['l'] }, { id: 'b', layers: ['l'] }],
        paths: [
          { id: 'parent', sequence: ['a', 'b'], layers: ['l'] },
          { id: 'child', parent: 'parent', source: 'a', target: 'b', layers: ['l'] },
          ...Array.from({ length: 1600 }, (_, index) => ({
            id: `unresolved-${index}`, parent: 'child', source: 'a', target: 'b', layers: ['l']
          }))
        ]
      }
    };
    expect(rendererLimitUsage(document).pathSegments).toBe(1602);
    expect(() => compileTopoGraph(document)).toThrow(/path segments exceeds renderer limit/);
  });
});
