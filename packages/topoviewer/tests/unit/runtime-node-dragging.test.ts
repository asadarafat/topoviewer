import { describe, expect, it } from 'vitest';
import { withRuntimeNodeDragging } from '../../src/components/graphDecorators';
import { compileTopoGraph } from '../../src/core/compiler';

describe('runtime node dragging policy', () => {
  it('lets the global lock override compiled draggable nodes without losing individual locks on re-enable', () => {
    const compiled = compileTopoGraph({
      layout: { mode: 'manual' },
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'editable', layers: ['physical'], position: [0, 0] },
          { id: 'locked', layers: ['physical'], position: [100, 0] }
        ]
      },
      stylesheet: [{ selector: 'node[id = locked]', style: { draggable: false } }]
    }).nodes;
    expect(compiled.map((node) => node.draggable)).toEqual([true, false]);
    expect(withRuntimeNodeDragging(compiled, false).map((node) => node.draggable)).toEqual([false, false]);
    expect(withRuntimeNodeDragging(compiled, true).map((node) => node.draggable)).toEqual([true, false]);
    expect(withRuntimeNodeDragging(compiled, undefined)).toBe(compiled);
    expect(compiled.map((node) => node.draggable)).toEqual([true, false]);
  });
});
