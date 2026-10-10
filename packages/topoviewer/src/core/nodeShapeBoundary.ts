import { pathToPolylinePoints } from './linkDirectionGeometry';
import { nodeShapeGeometry, type NodeShapeName } from './nodeShapes';
import type { Bounds } from './types';

type Point = { x: number; y: number };
type Side = 'left' | 'right' | 'top' | 'bottom';

/** Project a floating/parallel link endpoint onto the same outline the node renders.
 * Named port handles are deliberately handled by XYFlow instead of this function.
 */
export function nodeShapeBoundaryPoint(shape: NodeShapeName, polygonPoints: string | undefined, box: Bounds, point: Point, side: Side): Point {
  if (box.width <= 0 || box.height <= 0) return point;
  const horizontal = side === 'left' || side === 'right';
  const low = side === 'left' || side === 'top';
  const coordinate = Math.max(0, Math.min(100, horizontal
    ? (point.y - box.y) / box.height * 100
    : (point.x - box.x) / box.width * 100));
  const geometry = nodeShapeGeometry(shape, polygonPoints);
  let boundary: number;
  if (geometry.element === 'circle' || geometry.element === 'ellipse') {
    const extent = Math.sqrt(Math.max(0, 2500 - (coordinate - 50) ** 2));
    boundary = 50 + (low ? -extent : extent);
  } else if (geometry.element === 'rect') {
    const radius = Number(geometry.attributes.rx || 0);
    const distance = coordinate < radius ? radius - coordinate : coordinate > 100 - radius ? coordinate - (100 - radius) : 0;
    const inset = distance ? radius - Math.sqrt(Math.max(0, radius ** 2 - distance ** 2)) : 0;
    boundary = low ? inset : 100 - inset;
  } else {
    const vertices = geometry.element === 'path'
      ? pathToPolylinePoints(String(geometry.attributes.d), 64)
      : String(geometry.attributes.points).trim().split(/\s+/).map((pair) => {
        const [x, y] = pair.split(',').map(Number);
        return { x, y };
      });
    const hits: number[] = [];
    for (let index = 0; index < vertices.length; index += 1) {
      const a = vertices[index];
      const b = vertices[(index + 1) % vertices.length];
      const ac = horizontal ? a.y : a.x;
      const bc = horizontal ? b.y : b.x;
      const av = horizontal ? a.x : a.y;
      const bv = horizontal ? b.x : b.y;
      if (Math.abs(ac - bc) < 1e-9) {
        if (Math.abs(coordinate - ac) < 1e-9) hits.push(av, bv);
      } else if (coordinate >= Math.min(ac, bc) && coordinate <= Math.max(ac, bc)) {
        hits.push(av + (bv - av) * (coordinate - ac) / (bc - ac));
      }
    }
    const finiteHits = hits.filter(Number.isFinite);
    if (!finiteHits.length) {
      // Custom polygons need not span the full viewBox. Attach to their nearest
      // vertex rather than leaving the endpoint on an invisible rectangle.
      const candidates = vertices.filter(({ x, y }) => Number.isFinite(x) && Number.isFinite(y));
      if (!candidates.length) return point;
      const nearest = candidates.reduce((a, b) => {
        const aDistance = Math.abs((horizontal ? a.y : a.x) - coordinate);
        const bDistance = Math.abs((horizontal ? b.y : b.x) - coordinate);
        if (Math.abs(aDistance - bDistance) > 1e-9) return aDistance < bDistance ? a : b;
        const aExtent = horizontal ? a.x : a.y;
        const bExtent = horizontal ? b.x : b.y;
        return (low ? aExtent <= bExtent : aExtent >= bExtent) ? a : b;
      });
      return { x: box.x + nearest.x / 100 * box.width, y: box.y + nearest.y / 100 * box.height };
    }
    boundary = low ? Math.min(...finiteHits) : Math.max(...finiteHits);
  }
  return horizontal
    ? { x: box.x + boundary / 100 * box.width, y: box.y + coordinate / 100 * box.height }
    : { x: box.x + coordinate / 100 * box.width, y: box.y + boundary / 100 * box.height };
}
