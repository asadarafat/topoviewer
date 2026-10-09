import { describe, expect, it } from 'vitest';
import { authoringRegionBounds, authoringRegionDepth, planAuthoringRegionMove } from '../../src/core/authoringRegions';
import { compileTopoGraph } from '../../src/core/compiler';
import { lintTopoDocument } from '../../src/core/lint';
import type { TopoDocument } from '../../src/core/types';

function nestedRegions(): TopoDocument {
  return {
    layout: { mode: 'manual' },
    graph: {
      layers: [{ id: 'physical' }, { id: 'service' }],
      nodes: [{ id: 'a', layers: ['physical'], position: [100, 100] }],
      regions: [
        { id: 'outer', members: ['inner'], layers: ['physical'] },
        { id: 'inner', members: ['a'], layers: ['physical'] }
      ]
    }
  };
}

describe('region containment geometry', () => {
  it.each(['members', 'parent', 'both'] as const)('shares nested %s bounds between renderer and authoring', (relationship) => {
    const document = nestedRegions();
    const [outer, inner] = document.graph!.regions!;
    if (relationship !== 'members') inner.parent = outer.id;
    if (relationship === 'parent') outer.members = [];
    expect(lintTopoDocument(document, { requireNames: false }).filter((issue) => issue.severity === 'error')).toEqual([]);
    const graph = compileTopoGraph(document);
    const outerNode = graph.nodes.find((node) => node.id === 'region:outer');
    const bounds = authoringRegionBounds(document, 'outer');
    const innerBounds = authoringRegionBounds(document, 'inner')!;
    expect(outerNode).toBeDefined();
    expect(bounds).toEqual({
      ...outerNode!.position, width: outerNode!.style!.width, height: outerNode!.style!.height
    });
    expect(bounds).toEqual({
      x: innerBounds.x - 42, y: innerBounds.y - 42,
      width: innerBounds.width + 84, height: innerBounds.height + 84
    });
    expect(authoringRegionDepth(document, 'inner')).toBe(1);
    const move = planAuthoringRegionMove(document, 'outer', { x: bounds!.x + 15, y: bounds!.y + 20 });
    expect(move.updates).toEqual([
      expect.objectContaining({ path: ['graph', 'nodes', 0, 'position', 0], value: 115 }),
      expect.objectContaining({ path: ['graph', 'nodes', 0, 'position', 1], value: 120 })
    ]);
  });

  it('keeps explicit bounds authoritative while moving each nested region and shared member once', () => {
    const document = nestedRegions();
    const [outer, inner] = document.graph!.regions!;
    inner.parent = outer.id;
    inner.position = [50, 50];
    outer.members!.push('a');
    document.stylesheet = [{ selector: 'region[id = inner]', style: { width: 300, height: 200 } }];
    expect(authoringRegionBounds(document, 'inner')).toEqual({ x: 50, y: 50, width: 300, height: 200 });
    const bounds = authoringRegionBounds(document, 'outer')!;
    const plan = planAuthoringRegionMove(document, 'outer', { x: bounds.x + 15, y: bounds.y + 20 });
    expect(plan.updates).toHaveLength(4);
    expect(plan.updates).toContainEqual(expect.objectContaining({ path: ['graph', 'regions', 1, 'position', 0], value: 65 }));
    expect(plan.updates).toContainEqual(expect.objectContaining({ path: ['graph', 'nodes', 0, 'position', 0], value: 115 }));
  });

  it('excludes hidden child regions from the rendered hull', () => {
    const document = nestedRegions();
    document.graph!.regions![1].layers = ['service'];
    expect(compileTopoGraph(document, ['physical']).nodes.map((node) => node.id)).toEqual(['a']);
  });

  it.each(['self', 'parent', 'members', 'mixed'] as const)('diagnoses and bounds %s containment cycles', (kind) => {
    const document = nestedRegions();
    const [outer, inner] = document.graph!.regions!;
    if (kind === 'self') outer.members = ['outer'];
    if (kind === 'members') inner.members!.push('outer');
    if (kind === 'mixed') outer.parent = 'inner';
    if (kind === 'parent') {
      outer.members = [];
      outer.parent = 'inner';
      inner.parent = 'outer';
    }
    expect(lintTopoDocument(document, { requireNames: false })).toContainEqual(expect.objectContaining({
      code: 'region-containment-cycle', severity: 'error'
    }));
    expect(() => compileTopoGraph(document)).toThrow(/Region containment cycle/);
    expect(() => planAuthoringRegionMove(document, 'outer', { x: 200, y: 200 })).toThrow(/Region containment cycle/);
  });
});
