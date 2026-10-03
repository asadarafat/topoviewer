import type { CompiledGraph, LayoutConfig, PositionTuple, TopoDocument } from './types';
import { initialPositions } from './layout';
import { selectorReferencesField } from './selector';

function positionValue(value: PositionTuple | { x: number; y: number } | undefined) {
  if (Array.isArray(value)) return { x: Number(value[0] || 0), y: Number(value[1] || 0) };
  return {
    x: Number(value?.x || 0),
    y: Number(value?.y || 0)
  };
}

function validPosition(value: unknown): boolean {
  if (value === undefined) return true;
  if (Array.isArray(value)) {
    return value.length === 2 && value.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate));
  }
  if (!value || typeof value !== 'object') return false;
  const position = value as Record<string, unknown>;
  return typeof position.x === 'number'
    && Number.isFinite(position.x)
    && typeof position.y === 'number'
    && Number.isFinite(position.y);
}

export function assertValidPositionOnlyFields(document: TopoDocument): void {
  const objects = [
    ...(document.graph?.nodes || []).map((node) => ({ id: node.id, kind: 'node', position: node.position })),
    ...(document.diagram?.shapes || []).map((shape) => ({ id: shape.id, kind: 'shape', position: shape.position })),
    ...(document.diagram?.callouts || []).map((callout) => ({ id: callout.id, kind: 'callout', position: callout.position })),
    ...(document.diagram?.texts || []).map((text) => ({ id: text.id, kind: 'text', position: text.position }))
  ];
  const invalid = objects.find((object) => !validPosition(object.position));
  if (invalid) {
    throw new Error(`TopoViewer ${invalid.kind} "${invalid.id}" has an invalid position; expected two finite coordinates.`);
  }
}

function withoutPosition<T extends { position?: unknown }>(value: T): Omit<T, 'position'> {
  const { position: _position, ...remaining } = value;
  return remaining;
}

export function positionInsensitiveDocumentSignature(document: TopoDocument): string {
  const graph = document.graph;
  const diagram = document.diagram;
  return JSON.stringify({
    ...document,
    ...(graph ? {
      graph: {
        ...graph,
        nodes: (graph.nodes || []).map(withoutPosition)
      }
    } : {}),
    ...(diagram ? {
      diagram: {
        ...diagram,
        shapes: (diagram.shapes || []).map(withoutPosition),
        callouts: (diagram.callouts || []).map(withoutPosition),
        texts: (diagram.texts || []).map(withoutPosition)
      }
    } : {})
  });
}

export function supportsPositionOnlyCompile({
  document,
  hasExtensions,
  layoutOverride
}: {
  document: TopoDocument;
  hasExtensions: boolean;
  layoutOverride?: LayoutConfig;
}): boolean {
  const layout = { ...(document.layout || {}), ...(layoutOverride || {}) };
  return !hasExtensions
    && layout.mode === 'manual'
    && !(document.stylesheet || []).some((rule) => selectorReferencesField(rule.selector, 'position'))
    // Position creates/removes the box of an otherwise leader-only callout.
    // Those updates can change node/pin cardinality and leader endpoints.
    && !(document.diagram?.callouts || []).some((callout) => !callout.title && !callout.body && !callout.markdown)
    && !(document.graph?.regions || []).length
    && !(document.graph?.nodes || []).some((node) => !!node.parent)
    && !(document.attention?.aggregate?.groups || []).length
    && !document.attention?.links?.grouping;
}

export function patchCompiledPositions(graph: CompiledGraph, document: TopoDocument): CompiledGraph {
  const selectedLayers = new Set(graph.selectedLayerIds);
  const positions = initialPositions((document.graph?.nodes || []).filter((node) => (
    (node.layers || []).some((layer) => selectedLayers.has(layer))
  )));
  (document.diagram?.shapes || []).forEach((shape) => positions.set(shape.id, positionValue(shape.position)));
  (document.diagram?.callouts || []).forEach((callout) => positions.set(callout.id, positionValue(callout.position)));
  (document.diagram?.texts || []).forEach((text) => positions.set(text.id, positionValue(text.position)));
  const sourceById = new Map([
    ...(document.graph?.nodes || []), ...(document.diagram?.shapes || []),
    ...(document.diagram?.callouts || []), ...(document.diagram?.texts || [])
  ].map((object) => [object.id, object]));

  let changed = false;
  const nodes = graph.nodes.map((node) => {
    const nextPosition = positions.get(String(node.id || ''));
    const source = sourceById.get(node.id);
    if (!nextPosition || !source) return node;
    const sourceData = source.data && Object.prototype.hasOwnProperty.call(source.data, 'position') ? source.data : source;
    const hasPositionData = Object.prototype.hasOwnProperty.call(sourceData, 'position');
    const nextPositionData = sourceData.position;
    const samePositionData = JSON.stringify(node.data.position) === JSON.stringify(nextPositionData)
      && Object.prototype.hasOwnProperty.call(node.data, 'position') === hasPositionData;
    if (node.position.x === nextPosition.x && node.position.y === nextPosition.y && samePositionData) return node;
    changed = true;
    const data = { ...node.data };
    if (hasPositionData) data.position = nextPositionData as typeof data.position;
    else delete data.position;
    return { ...node, position: nextPosition, data };
  });
  return changed ? { ...graph, nodes } : graph;
}
