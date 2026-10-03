import type { TopoDocument } from './types';

type GeneratedKind = 'pin' | 'anchor' | 'region' | 'path' | 'leader';
export type RuntimeIdentity = (kind: GeneratedKind, parts: readonly string[], legacyId: string) => string;

/** Preserve familiar IDs unless a source ID or another generated object owns them. */
export function createRuntimeIdentity(document: TopoDocument): RuntimeIdentity {
  const graph = document.graph || {};
  const diagram = document.diagram || {};
  const sourceIds = new Set<string>();
  for (const object of [
    ...(graph.nodes || []), ...(graph.links || []), ...(graph.paths || []), ...(graph.regions || []),
    ...(diagram.shapes || []), ...(diagram.connectors || []), ...(diagram.callouts || []), ...(diagram.texts || [])
  ]) {
    if (sourceIds.has(object.id)) throw new Error(`TopoViewer duplicate source object id "${object.id}".`);
    sourceIds.add(object.id);
  }
  const legacyByKey = new Map<string, string>();
  const legacyCounts = new Map<string, number>();
  const keyOf = (kind: GeneratedKind, parts: readonly string[]) => JSON.stringify([kind, ...parts]);
  const add = (kind: GeneratedKind, parts: string[], legacyId: string) => {
    const key = keyOf(kind, parts);
    if (legacyByKey.has(key)) throw new Error(`TopoViewer duplicate generated object identity ${key}.`);
    legacyByKey.set(key, legacyId);
    legacyCounts.set(legacyId, (legacyCounts.get(legacyId) || 0) + 1);
  };
  for (const owner of [...(graph.nodes || []), ...(diagram.shapes || []), ...(diagram.callouts || [])]) {
    for (const pin of owner.pins || []) add('pin', [owner.id, pin.id], `pin:${owner.id}:${pin.id}`);
  }
  for (const object of [...(diagram.connectors || []), ...(diagram.callouts || [])]) {
    if (object.sourcePosition) add('anchor', [object.id, 'source'], `pin:${object.id}:source`);
    if (object.targetPosition) add('anchor', [object.id, 'target'], `pin:${object.id}:target`);
  }
  for (const region of graph.regions || []) add('region', [region.id], `region:${region.id}`);
  const paths = new Map((graph.paths || []).map((path) => [path.id, path]));
  for (const path of graph.paths || []) {
    const parent = path.parent && path.source && path.target ? paths.get(path.parent) : undefined;
    const segmentCount = Math.max(0, (path.sequence?.length || 1) - 1, (parent?.sequence?.length || 1) - 1);
    for (let index = 0; index < segmentCount; index += 1) {
      add('path', [path.id, String(index)], `${path.id}:${index}`);
    }
  }
  for (const callout of diagram.callouts || []) {
    if (callout.target || callout.targetPosition) add('leader', [callout.id], `${callout.id}:leader`);
  }
  let prefix = '@topoviewer:';
  const occupied = [...sourceIds, ...legacyCounts.keys()];
  while (occupied.some((id) => id.startsWith(prefix))) prefix = `@${prefix}`;
  return (kind, parts, legacyId) => {
    const key = keyOf(kind, parts);
    return !sourceIds.has(legacyId) && (legacyCounts.get(legacyId) || 0) <= 1
      ? legacyId
      : `${prefix}${encodeURIComponent(key)}`;
  };
}

export function assertUniqueRuntimeIds(objects: ReadonlyArray<Record<string, unknown>>, kind: string): void {
  const seen = new Set<unknown>();
  for (const object of objects) {
    if (seen.has(object.id)) throw new Error(`TopoViewer duplicate runtime ${kind} id "${object.id}".`);
    seen.add(object.id);
  }
}
