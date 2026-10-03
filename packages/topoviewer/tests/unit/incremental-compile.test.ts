import { describe, expect, it } from 'vitest';
import {
  assertValidPositionOnlyFields,
  patchCompiledPositions,
  positionInsensitiveDocumentSignature,
  supportsPositionOnlyCompile
} from '../../src/core/incrementalCompile';
import type { CompiledGraph, TopoDocument } from '../../src/core/types';
import { compileTopoGraph } from '../../src/core/compiler';
import { compileRuntimeGraph } from '../../src/components/runtimeCompilation';

function document(position: [number, number] = [20, 40]): TopoDocument {
  return {
    layout: { mode: 'manual' },
    graph: {
      layers: [{ id: 'physical', labels: { name: 'Physical' } }],
      nodes: [
        { id: 'node-a', layers: ['physical'], position },
        { id: 'node-b', layers: ['physical'], position: [120, 40] }
      ],
      links: [{ id: 'link-a-b', source: 'node-a', target: 'node-b', layers: ['physical'] }]
    }
  };
}

describe('incremental position compilation', () => {
  it.each(['node[position.0 = "20"]', 'node[position ~= "20"]', 'node[position.x = "20"]'])(
    'fully recompiles position-dependent style selector %s', (selector) => {
      const initial = document();
      if (selector.includes('.x')) initial.graph!.nodes![0].position = { x: 20, y: 40 };
      initial.stylesheet = [{ selector, style: { width: 400 } }];
      const input = (value: TopoDocument) => ({
        attention: undefined, document: value,
        documentSignature: positionInsensitiveDocumentSignature(value),
        extensions: [],
        extensionContext: { document: value, selectedLayerIds: ['physical'], toggles: {} },
        layout: undefined, renderSignature: 'manual', selectedLayerIds: ['physical'], toggles: {}
      });
      const first = compileRuntimeGraph(input(initial));
      const moved = structuredClone(initial);
      moved.graph!.nodes![0].position = selector.includes('.x') ? { x: 80, y: 90 } : [80, 90];
      const updated = compileRuntimeGraph({ ...input(moved), previous: first.cache });
      expect(updated.result.ok).toBe(true);
      if (!updated.result.ok) return;
      expect(updated.result.value.positionOnlyCompile).toBe(false);
      expect(updated.result.value.baseCompiled.nodes).toEqual(compileTopoGraph(moved).nodes);
      expect(first.cache?.baseCompiled.nodes[0].style?.width).toBe(400);
      expect(updated.result.value.baseCompiled.nodes[0].style?.width).not.toBe(400);
    }
  );

  it('retains incremental eligibility for selectors whose position-like text is unrelated to geometry', () => {
    const value = document();
    value.stylesheet = [
      { selector: 'node[labels.position = "20"]', style: { width: 400 } },
      { selector: 'node[id = "position.0"]', style: { width: 400 } },
      { selector: 'node[positioning = "on"]', style: { width: 400 } }
    ];
    expect(supportsPositionOnlyCompile({ document: value, hasExtensions: false })).toBe(true);
  });

  it('fully recompiles when position adds or removes a leader-only callout box', () => {
    const initial = document();
    initial.diagram = { callouts: [{ id: 'note', layers: ['physical'], source: 'node-a', target: 'node-b' }] };
    const input = (value: TopoDocument) => ({
      attention: undefined,
      document: value,
      documentSignature: positionInsensitiveDocumentSignature(value),
      extensions: [],
      extensionContext: { document: value, selectedLayerIds: ['physical'], toggles: {} },
      layout: undefined,
      renderSignature: 'manual',
      selectedLayerIds: ['physical'],
      toggles: {}
    });
    const first = compileRuntimeGraph(input(initial));
    const positioned = structuredClone(initial);
    positioned.diagram!.callouts![0].position = [20, 40];
    const added = compileRuntimeGraph({ ...input(positioned), previous: first.cache });
    expect(added.result.ok).toBe(true);
    if (!added.result.ok) return;
    expect(added.result.value.positionOnlyCompile).toBe(false);
    expect(added.result.value.baseCompiled.nodes).toEqual(compileTopoGraph(positioned).nodes);
    expect(added.result.value.baseCompiled.nodes.some((node) => node.id === 'note')).toBe(true);
    const removed = compileRuntimeGraph({ ...input(initial), previous: added.cache });
    expect(removed.result.ok).toBe(true);
    if (!removed.result.ok) return;
    expect(removed.result.value.positionOnlyCompile).toBe(false);
    expect(removed.result.value.baseCompiled.nodes).toEqual(compileTopoGraph(initial).nodes);
    expect(removed.result.value.baseCompiled.nodes.some((node) => node.id === 'note')).toBe(false);
  });

  it('matches full compilation for omitted, deleted, filtered, and subpixel positions', () => {
    const initial = document();
    initial.graph!.nodes!.unshift({ id: 'filtered', layers: ['hidden'] });
    delete initial.graph!.nodes![2].position;
    const compiled = compileTopoGraph(initial);
    const moved = structuredClone(initial);
    moved.graph!.nodes![1].position = [20.125, 40.25];
    const patched = patchCompiledPositions(compiled, moved);
    expect(patched.nodes).toEqual(compileTopoGraph(moved).nodes);
    expect(patched.nodes.find((node) => node.id === 'node-b')?.position).toEqual({ x: 320, y: 120 });

    delete moved.graph!.nodes![1].position;
    expect(patchCompiledPositions(patched, moved).nodes).toEqual(compileTopoGraph(moved).nodes);
  });

  it('keeps the signature stable only for position changes', () => {
    const initial = document();
    const moved = document([80, 90]);
    const renamed = document();
    renamed.graph!.nodes![0].labels = { name: 'Renamed' };

    expect(positionInsensitiveDocumentSignature(moved)).toBe(positionInsensitiveDocumentSignature(initial));
    expect(positionInsensitiveDocumentSignature(renamed)).not.toBe(positionInsensitiveDocumentSignature(initial));
  });

  it('changes the signature when graph or annotation cardinality changes', () => {
    const initial = document();
    const withNode = structuredClone(initial);
    const withShape = structuredClone(initial);
    withNode.graph!.nodes!.push({ id: 'node-c', layers: ['physical'], position: [220, 40] });
    withShape.diagram = {
      shapes: [{ id: 'shape-a', position: [20, 120] }]
    };

    expect(positionInsensitiveDocumentSignature(withNode)).not.toBe(positionInsensitiveDocumentSignature(initial));
    expect(positionInsensitiveDocumentSignature(withShape)).not.toBe(positionInsensitiveDocumentSignature(initial));
  });

  it('patches changed positions without replacing unrelated nodes or edges', () => {
    const nodeA = { id: 'node-a', position: { x: 20, y: 40 }, data: { position: [20, 40] } };
    const nodeB = { id: 'node-b', position: { x: 120, y: 40 }, data: { position: [120, 40] } };
    const edge = { id: 'link-a-b', source: 'node-a', target: 'node-b', data: {} };
    const compiled = {
      nodes: [nodeA, nodeB],
      edges: [edge],
      selectedLayerIds: ['physical']
    } as CompiledGraph;

    const patched = patchCompiledPositions(compiled, document([80, 90]));

    expect(patched).not.toBe(compiled);
    expect(patched.nodes[0].position).toEqual({ x: 80, y: 90 });
    expect(patched.nodes[1]).toBe(nodeB);
    expect(patched.edges).toBe(compiled.edges);
  });

  it('validates position-only fields without rescanning unchanged graph semantics', () => {
    expect(() => assertValidPositionOnlyFields(document())).not.toThrow();
    const objectPosition = document();
    objectPosition.graph!.nodes![0].position = { x: 20, y: 40 };
    expect(() => assertValidPositionOnlyFields(objectPosition)).not.toThrow();

    const invalid = document();
    invalid.graph!.nodes![0].position = [Number.NaN, 40];
    expect(() => assertValidPositionOnlyFields(invalid)).toThrow(/invalid position/);
  });

  it('falls back when geometry or extension ownership is not position-local', () => {
    const manual = document();
    expect(supportsPositionOnlyCompile({ document: manual, hasExtensions: false })).toBe(true);
    expect(supportsPositionOnlyCompile({
      document: { ...manual, layout: { mode: 'force' } },
      hasExtensions: false
    })).toBe(false);
    expect(supportsPositionOnlyCompile({ document: manual, hasExtensions: true })).toBe(false);
    expect(supportsPositionOnlyCompile({
      document: {
        ...manual,
        graph: { ...manual.graph, regions: [{ id: 'region-a', members: ['node-a'] }] }
      },
      hasExtensions: false
    })).toBe(false);
  });
});
