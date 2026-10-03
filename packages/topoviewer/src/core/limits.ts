import type { RendererLimits, TopoDocument } from './types';

export const DEFAULT_RENDERER_LIMITS: Required<RendererLimits> = {
  maxNodes: 1200,
  maxRegions: 250,
  maxPins: 1200,
  maxEdges: 2400,
  maxPathSegments: 1600,
  maxLabels: 2000,
  maxCallouts: 250,
  maxShapes: 500,
  maxTexts: 500,
  maxImageBytes: 750_000
};

export interface RendererLimitUsage {
  nodes: number;
  regions: number;
  pins: number;
  edges: number;
  pathSegments: number;
  labels: number;
  callouts: number;
  shapes: number;
  texts: number;
  imageBytes: number;
}

function encodedBytes(value: string): number {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value).length;
  return value.length;
}

function iconImageBytes(document: TopoDocument): number {
  return Object.values(document.icons || {}).reduce((total, icon) => {
    if (icon.svg) return total + encodedBytes(icon.svg);
    if (icon.src?.startsWith('data:')) return total + encodedBytes(icon.src);
    return total;
  }, 0);
}

export function rendererLimitUsage(document: TopoDocument): RendererLimitUsage {
  const graph = document.graph || {};
  const diagram = document.diagram || {};
  const nodes = graph.nodes?.length || 0;
  const links = graph.links?.length || 0;
  const pathsById = new Map((graph.paths || []).map((path) => [path.id, path]));
  const pathSegments = (graph.paths || []).reduce((total, path) => {
    const parent = path.parent && path.source && path.target ? pathsById.get(path.parent) : undefined;
    // Even an unresolved carried path contributes an endpoint link to layout.
    // Count it conservatively so malformed parent chains cannot bypass limits.
    return total + Math.max(path.parent ? 1 : 0, (path.sequence?.length || 1) - 1, (parent?.sequence?.length || 1) - 1);
  }, 0);
  const pins = [...(graph.nodes || []), ...(diagram.shapes || []), ...(diagram.callouts || [])]
    .reduce((total, owner) => total + (owner.pins?.length || 0), 0)
    + [...(diagram.connectors || []), ...(diagram.callouts || [])]
      .reduce((total, object) => total + Number(!!object.sourcePosition) + Number(!!object.targetPosition), 0);
  const labels = [
    ...(graph.nodes || []),
    ...(graph.links || []),
    ...(graph.paths || []),
    ...(graph.regions || []),
    ...(diagram.shapes || []),
    ...(diagram.callouts || []),
    ...(diagram.texts || [])
  ].filter((entity) => entity.labels?.name).length;

  return {
    nodes,
    regions: graph.regions?.length || 0,
    pins,
    edges: links + pathSegments + (diagram.connectors?.length || 0) + (diagram.callouts?.filter((callout) => callout.target || callout.targetPosition).length || 0),
    pathSegments,
    labels,
    callouts: diagram.callouts?.length || 0,
    shapes: diagram.shapes?.length || 0,
    texts: diagram.texts?.length || 0,
    imageBytes: iconImageBytes(document)
  };
}

export function effectiveRendererLimits(document: TopoDocument): Required<RendererLimits> {
  return {
    ...DEFAULT_RENDERER_LIMITS,
    ...(document.limits || {})
  };
}

export function rendererLimitViolations(document: TopoDocument): string[] {
  const usage = rendererLimitUsage(document);
  const limits = effectiveRendererLimits(document);
  const checks: Array<[keyof RendererLimitUsage, keyof Required<RendererLimits>, string]> = [
    ['nodes', 'maxNodes', 'nodes'],
    ['regions', 'maxRegions', 'regions'],
    ['pins', 'maxPins', 'pins'],
    ['edges', 'maxEdges', 'edges'],
    ['pathSegments', 'maxPathSegments', 'path segments'],
    ['labels', 'maxLabels', 'labels'],
    ['callouts', 'maxCallouts', 'callouts'],
    ['shapes', 'maxShapes', 'shapes'],
    ['texts', 'maxTexts', 'text objects'],
    ['imageBytes', 'maxImageBytes', 'embedded image bytes']
  ];

  return checks.flatMap(([usageKey, limitKey, label]) => (
    usage[usageKey] > limits[limitKey]
      ? [`${label} exceeds renderer limit: ${usage[usageKey]} > ${limits[limitKey]}`]
      : []
  ));
}

export function assertRendererLimits(document: TopoDocument): void {
  const violations = rendererLimitViolations(document);
  if (violations.length) {
    throw new Error(`TopoViewer renderer limits exceeded: ${violations.join('; ')}`);
  }
}
