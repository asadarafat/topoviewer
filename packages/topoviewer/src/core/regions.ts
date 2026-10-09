import type { Bounds, GraphNode, GraphRegion } from './types';

export const regionLayoutKeys = [
  'padding',
  'paddingX',
  'paddingY',
  'headerPadding',
  'nodeWidth',
  'nodeHeight',
  'minWidth',
  'minHeight',
  'parentPadding',
  'parentPaddingX',
  'parentPaddingY'
] as const;

export type RegionLayoutKey = typeof regionLayoutKeys[number];
export type RegionLayoutStyle = Partial<Record<RegionLayoutKey, unknown>>;
export type RegionBoundsStyle = RegionLayoutStyle & {
  height?: unknown;
  width?: unknown;
};

export interface RegionBoundsPolicy {
  headerPadding: number;
  minHeight: number;
  minWidth: number;
  nodeHeight: number;
  nodeWidth: number;
  paddingX: number;
  paddingY: number;
  parentPaddingX: number;
  parentPaddingY: number;
}

type RegionMemberNode = Pick<GraphNode, 'id' | 'position'> & {
  regionBoundsWidth?: number;
  regionBoundsHeight?: number;
};

export function normalizePosition(position: GraphNode['position'] | GraphRegion['position']): { x: number; y: number } {
  if (Array.isArray(position)) return { x: Number(position[0] || 0), y: Number(position[1] || 0) };
  if (position && typeof position === 'object') return { x: Number(position.x || 0), y: Number(position.y || 0) };
  return { x: 0, y: 0 };
}

function positiveDimension(value: unknown): number | undefined {
  const dimension = Number(value);
  return Number.isFinite(dimension) && dimension > 0 ? dimension : undefined;
}

export function unionBounds(boundsList: Array<Bounds | null | undefined>): Bounds | null {
  const validBounds = boundsList.filter(Boolean) as Bounds[];
  if (!validBounds.length) return null;
  const minX = Math.min(...validBounds.map((bounds) => bounds.x));
  const minY = Math.min(...validBounds.map((bounds) => bounds.y));
  const maxX = Math.max(...validBounds.map((bounds) => bounds.x + bounds.width));
  const maxY = Math.max(...validBounds.map((bounds) => bounds.y + bounds.height));
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function numberOrDefault(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function resolveRegionBoundsPolicy(
  style: RegionLayoutStyle = {},
  hasChildRegions = false
): RegionBoundsPolicy {
  const padding = numberOrDefault(style.padding, 88);
  const parentPadding = numberOrDefault(style.parentPadding, 42);
  return {
    headerPadding: numberOrDefault(style.headerPadding, hasChildRegions ? 88 : 0),
    minHeight: numberOrDefault(style.minHeight, 120),
    minWidth: numberOrDefault(style.minWidth, 180),
    nodeHeight: numberOrDefault(style.nodeHeight, 74),
    nodeWidth: numberOrDefault(style.nodeWidth, 88),
    paddingX: numberOrDefault(style.paddingX, padding),
    paddingY: numberOrDefault(style.paddingY, padding),
    parentPaddingX: numberOrDefault(style.parentPaddingX, parentPadding),
    parentPaddingY: numberOrDefault(style.parentPaddingY, parentPadding)
  };
}

function expandBounds(bounds: Bounds, paddingX: number, paddingY = paddingX): Bounds {
  return {
    x: bounds.x - paddingX,
    y: bounds.y - paddingY,
    width: bounds.width + paddingX * 2,
    height: bounds.height + paddingY * 2
  };
}

function regionMemberWidth(node: RegionMemberNode, fallback: number): number {
  return numberOrDefault(node.regionBoundsWidth, fallback);
}

function regionMemberHeight(node: RegionMemberNode, fallback: number): number {
  return numberOrDefault(node.regionBoundsHeight, fallback);
}

/** Both parent references and region-valued members describe containment. */
export function regionChildrenById(regions: readonly GraphRegion[]): Map<string, string[]> {
  const children = new Map(regions.map((region) => [region.id, new Set<string>()]));
  regions.forEach((region) => {
    if (region.parent) children.get(region.parent)?.add(region.id);
    (region.members || []).forEach((memberId) => {
      if (children.has(memberId)) children.get(region.id)?.add(memberId);
    });
  });
  return new Map([...children].map(([id, ids]) => [id, [...ids]]));
}

function regionTraversal(children: ReadonlyMap<string, readonly string[]>): { order: string[]; cycle?: string[] } {
  const complete = new Set<string>();
  const order: string[] = [];
  for (const rootId of children.keys()) {
    if (complete.has(rootId)) continue;
    const active = new Map<string, number>([[rootId, 0]]);
    const stack = [{ id: rootId, next: 0 }];
    while (stack.length) {
      const current = stack[stack.length - 1];
      const childIds = children.get(current.id) || [];
      if (current.next < childIds.length) {
        const childId = childIds[current.next++];
        const cycleStart = active.get(childId);
        if (cycleStart !== undefined) {
          return { order, cycle: [...stack.slice(cycleStart).map((entry) => entry.id), childId] };
        }
        if (!complete.has(childId)) {
          active.set(childId, stack.length);
          stack.push({ id: childId, next: 0 });
        }
      } else {
        active.delete(current.id);
        complete.add(current.id);
        order.push(current.id);
        stack.pop();
      }
    }
  }
  return { order };
}

export function regionContainmentCycle(regions: readonly GraphRegion[]): string[] | undefined {
  return regionTraversal(regionChildrenById(regions)).cycle;
}

export function regionContainmentOrder(children: ReadonlyMap<string, readonly string[]>): string[] {
  const result = regionTraversal(children);
  if (result.cycle) throw new Error(`Region containment cycle: ${result.cycle.join(' -> ')}.`);
  return result.order;
}

export function resolveExplicitRegionBounds(region: GraphRegion, style: RegionBoundsStyle = {}): Bounds | null {
  const styleWidth = positiveDimension(style.width);
  const styleHeight = positiveDimension(style.height);
  if (styleWidth === undefined || styleHeight === undefined) return null;
  const position = normalizePosition(region.position);
  return {
    x: position.x,
    y: position.y,
    width: styleWidth,
    height: styleHeight
  };
}

function regionBounds(
  region: GraphRegion,
  nodeById: Map<string, RegionMemberNode>,
  hasChildRegions: boolean,
  style: RegionBoundsStyle
): Bounds | null {
  const explicitBounds = resolveExplicitRegionBounds(region, style);
  if (explicitBounds) return explicitBounds;
  const nodes = (region.members || [])
    .map((id) => nodeById.get(id))
    .filter(Boolean) as RegionMemberNode[];

  if (!nodes.length) return null;

  const policy = resolveRegionBoundsPolicy(style, hasChildRegions);
  const points = nodes.map((node) => normalizePosition(node.position));
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs) - policy.paddingX;
  const minY = Math.min(...ys) - policy.paddingY - policy.headerPadding;
  const maxX = Math.max(...nodes.map((node) => {
    const point = normalizePosition(node.position);
    return point.x + regionMemberWidth(node, policy.nodeWidth);
  })) + policy.paddingX;
  const maxY = Math.max(...nodes.map((node) => {
    const point = normalizePosition(node.position);
    return point.y + regionMemberHeight(node, policy.nodeHeight);
  })) + policy.paddingY;

  return {
    x: minX,
    y: minY,
    width: Math.max(policy.minWidth, maxX - minX),
    height: Math.max(policy.minHeight, maxY - minY)
  };
}

export function buildRegionBoundsMap(
  regions: GraphRegion[],
  selectedLayerIds: Set<string> | undefined,
  nodeById: Map<string, RegionMemberNode>,
  styleByRegionId: ReadonlyMap<string, RegionBoundsStyle> = new Map()
): Map<string, Bounds> {
  const visibleRegions = selectedLayerIds
    ? regions.filter((region) => (region.layers || []).some((layerId) => selectedLayerIds.has(layerId)))
    : regions;
  const regionById = new Map(visibleRegions.map((region) => [region.id, region]));
  const childrenByParentId = regionChildrenById(visibleRegions);
  const boundsById = new Map<string, Bounds>();
  const deepestFirst = regionContainmentOrder(childrenByParentId);

  deepestFirst.forEach((regionId) => {
    const region = regionById.get(regionId)!;
    const style = styleByRegionId.get(region.id) || {};
    const explicitBounds = resolveExplicitRegionBounds(region, style);
    if (explicitBounds) {
      boundsById.set(region.id, explicitBounds);
      return;
    }
    const childIds = childrenByParentId.get(region.id) || [];
    const ownBounds = regionBounds(region, nodeById, childIds.length > 0, style);
    const childBounds = childIds.map((childId) => boundsById.get(childId));
    const mergedBounds = unionBounds([ownBounds, ...childBounds]);
    if (!mergedBounds) return;
    const policy = resolveRegionBoundsPolicy(style, childBounds.some(Boolean));
    boundsById.set(region.id, childBounds.some(Boolean)
      ? expandBounds(mergedBounds, policy.parentPaddingX, policy.parentPaddingY)
      : mergedBounds);
  });

  return boundsById;
}
