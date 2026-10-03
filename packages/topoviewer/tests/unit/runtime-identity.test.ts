import { describe, expect, it } from 'vitest';
import { compileTopoGraph, rebuildRegionNodes } from '../../src/core/compiler';
import { compileTopoGraphResult } from '../../src/core/renderContract';
import { lintTopoDocument } from '../../src/core/lint';
import { applyTopoNodeChanges } from '../../src/components/regionDrag';
import { helperLineBoxFromNode } from '../../src/components/helperLines';
import { regionDragGroupRuntimeIds, sourceObjectId } from '../../src/components/runtimeGraph';
import type { TopoDocument } from '../../src/core/types';

const node = (id: string) => ({ id, layers: ['l'], position: [0, 0] as [number, number] });
const base = (): TopoDocument => ({ layout: { mode: 'manual' }, graph: { layers: [{ id: 'l' }], nodes: [node('n')] } });

describe('generated runtime identities', () => {
  it('keeps nodes and declared pins distinct and routes connectors to the intended object', () => {
    const document = base();
    document.graph!.nodes = [
      { ...node('n'), pins: [{ id: 'a' }] }, node('pin:n:a'),
      { ...node('n:b'), pins: [{ id: 'c' }] },
      { ...node('other'), pins: [{ id: 'source' }] }
    ];
    document.diagram = { connectors: [
      { id: 'to-pin', layers: ['l'], source: 'n', sourcePin: 'a', target: 'pin:n:a' },
      { id: 'absolute', layers: ['l'], sourcePosition: [5, 5], target: 'n' }
    ] };
    const compiled = compileTopoGraph(document);
    const pin = compiled.nodes.find((entry) => entry.type === 'pin' && entry.data.ownerId === 'n')!;
    expect(pin.id).not.toBe('pin:n:a');
    expect(compiled.nodes.find((entry) => entry.id === 'pin:n:a')?.type).toBe('network');
    expect(compiled.edges.find((entry) => entry.id === 'to-pin')).toMatchObject({ source: pin.id, target: 'pin:n:a' });
    expect(new Set(compiled.nodes.map((entry) => entry.id)).size).toBe(compiled.nodes.length);
    expect(helperLineBoxFromNode(pin)).toBeUndefined();
    expect(helperLineBoxFromNode(compiled.nodes.find((entry) => entry.id === 'pin:n:a')!)).toBeDefined();
  });

  it('disambiguates delimiter collisions and stays stable across input order and active layers', () => {
    const document = base();
    document.graph!.nodes = [
      { ...node('a'), pins: [{ id: 'b:c' }] },
      { ...node('a:b'), pins: [{ id: 'c' }] }
    ];
    const compiled = compileTopoGraph(document);
    const pins = compiled.nodes.filter((entry) => entry.type === 'pin');
    expect(new Set(pins.map((entry) => entry.id)).size).toBe(2);
    document.graph!.nodes.reverse();
    expect(compileTopoGraph(document).nodes.filter((entry) => entry.type === 'pin').map((entry) => entry.id).sort())
      .toEqual(pins.map((entry) => entry.id).sort());
    document.graph!.nodes[0].layers = ['hidden'];
    expect(compileTopoGraph(document).nodes.find((entry) => entry.type === 'pin')?.id).toBe(pins[0].id);
  });

  it('avoids source IDs impersonating the fallback namespace', () => {
    const document = base();
    document.graph!.nodes = [{ ...node('n'), pins: [{ id: 'a' }] }, node('pin:n:a')];
    const firstPin = compileTopoGraph(document).nodes.find((entry) => entry.type === 'pin')!;
    document.graph!.nodes.push(node(firstPin.id));
    const compiled = compileTopoGraph(document);
    expect(new Set(compiled.nodes.map((entry) => entry.id)).size).toBe(compiled.nodes.length);
    expect(compiled.nodes.find((entry) => entry.type === 'pin')?.id).not.toBe(firstPin.id);
  });

  it('keeps colliding path segments and callout leaders separate from source links', () => {
    const document = base();
    document.graph!.nodes!.push(node('target'));
    document.graph!.links = ['route:0', 'note:leader'].map((id) => ({ id, source: 'n', target: 'target', layers: ['l'] }));
    document.graph!.paths = [{ id: 'route', sequence: ['n', 'target'], layers: ['l'] }];
    document.diagram = { callouts: [{ id: 'note', layers: ['l'], body: 'Note', position: [20, 20], target: 'target' }] };
    const compiled = compileTopoGraph(document);
    expect(compiled.edges).toHaveLength(4);
    expect(new Set(compiled.edges.map((entry) => entry.id)).size).toBe(4);
    expect(compiled.edges.filter((entry) => sourceObjectId(entry) === 'route')).toHaveLength(1);
    expect(compiled.edges.filter((entry) => entry.id === 'note:leader')).toHaveLength(1);
    const leader = compiled.edges.find((entry) => entry.data?.objectKind === 'callout')!;
    expect(sourceObjectId(leader)).toBe('note');
    expect(leader.id).not.toBe('note:leader');
  });

  it('uses resolved region identities during dragging, rebuilds, and source selection', () => {
    const document = base();
    document.graph!.nodes!.push(node('region:r'));
    document.graph!.regions = [{ id: 'r', layers: ['l'], members: ['n'] }];
    const compiled = compileTopoGraph(document);
    const region = compiled.nodes.find((entry) => entry.type === 'region')!;
    expect(region.id).not.toBe('region:r');
    expect(sourceObjectId(region)).toBe('r');
    expect(regionDragGroupRuntimeIds(document, region.id)).toEqual(new Set([region.id, 'n']));
    expect(regionDragGroupRuntimeIds(document, 'region:r')).toEqual(new Set(['region:r']));
    const moved = applyTopoNodeChanges({
      changes: [{ id: region.id, type: 'position', position: { x: region.position.x + 10, y: region.position.y + 20 } }],
      currentNodes: compiled.nodes as never[], document, selectedLayerIds: ['l'], showRegions: true
    }) as unknown as typeof compiled.nodes;
    expect(moved.find((entry) => entry.id === 'n')?.position).toEqual({ x: 10, y: 20 });
    expect(moved.find((entry) => entry.id === 'region:r')?.position).toEqual({ x: 0, y: 0 });
    expect(moved.find((entry) => entry.type === 'region')?.id).toBe(region.id);
    expect(rebuildRegionNodes(document.graph!.regions!, new Set(['l']), compiled.nodes, document)[0].id).toBe(region.id);
  });

  it('rejects duplicate source identities and duplicate pins with structured diagnostics', () => {
    const document = base();
    document.graph!.nodes!.push(node('n'));
    expect(compileTopoGraphResult(document)).toMatchObject({ ok: false, diagnostics: [expect.objectContaining({ message: expect.stringContaining('duplicate source object id') })] });
    document.graph!.nodes = [{ ...node('n'), pins: [{ id: 'a' }, { id: 'a' }] }];
    expect(compileTopoGraphResult(document)).toMatchObject({ ok: false, diagnostics: [expect.objectContaining({ message: expect.stringContaining('duplicate generated object identity') })] });
    expect(lintTopoDocument(document, { requireNames: false })).toContainEqual(expect.objectContaining({ code: 'duplicate-pin', path: 'graph.nodes[0].pins[1].id' }));
  });

  it('does not promote nonexistent endpoints or hidden absolute anchors into render objects', () => {
    const document = base();
    document.diagram = { connectors: [
      { id: 'missing', layers: ['l'], source: 'n', target: 'missing-node' },
      { id: 'hidden', layers: ['hidden'], sourcePosition: [0, 0], targetPosition: [20, 20] }
    ] };
    const compiled = compileTopoGraph(document);
    expect(compiled.edges).toHaveLength(0);
    expect(compiled.nodes.map((entry) => entry.id)).toEqual(['n']);
  });

  it('separates absolute anchors from a same-named declared pin', () => {
    const document = base();
    document.diagram = { callouts: [{
      id: 'note', layers: ['l'], body: 'Note', position: [10, 10], target: 'n',
      pins: [{ id: 'source' }], sourcePosition: [20, 20]
    }] };
    const compiled = compileTopoGraph(document);
    const pins = compiled.nodes.filter((entry) => entry.type === 'pin');
    expect(pins).toHaveLength(2);
    expect(new Set(pins.map((entry) => entry.id)).size).toBe(2);
    const absolute = pins.find((entry) => !entry.parentId)!;
    expect(compiled.edges[0].source).toBe(absolute.id);
  });
});
