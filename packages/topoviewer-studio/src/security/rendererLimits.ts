import { rendererLimitViolations, type TopoDocument } from 'topoviewer';

// Studio owns this ceiling; imported YAML may lower it but cannot raise it.
// The dense authoring fixture uses 1,000 nodes and 2,500 links.
export const studioRendererLimits = {
  maxNodes: 1500,
  maxEdges: 3000,
  maxPathSegments: 1600,
  maxLabels: 2000,
  maxCallouts: 250,
  maxShapes: 500,
  maxTexts: 500,
  maxPins: 1200,
  maxRegions: 250,
  maxImageBytes: 750_000
} as const;

export function studioRendererLimitViolations(document: TopoDocument): string[] {
  const limits = Object.fromEntries(Object.entries(studioRendererLimits).map(([key, maximum]) => {
    const requested = document.limits?.[key as keyof typeof document.limits];
    return [key, typeof requested === 'number' ? Math.min(requested, maximum) : maximum];
  }));
  return rendererLimitViolations({ ...document, limits });
}
