/** Bounds synchronous force-layout work even for direct provider/API callers. */
export const MAX_FORCE_LAYOUT_ITERATIONS = 1000;
const MAX_FORCE_PARAMETER = 1_000_000;
const MAX_FORCE_COORDINATE = 1_000_000_000_000;

export function forceLayoutParameter(name: string, value: number | undefined, fallback: number): number {
  const parameter = value ?? fallback;
  if (!Number.isFinite(parameter) || Math.abs(parameter) > MAX_FORCE_PARAMETER) {
    throw new Error(`Force layout ${name} must be finite and have an absolute value no greater than ${MAX_FORCE_PARAMETER}.`);
  }
  return parameter;
}

export function assertSafeForcePositions(positions: Iterable<{ x: number; y: number }>): void {
  for (const { x, y } of positions) {
    if (![x, y].every((value) => Number.isFinite(value) && Math.abs(value) <= MAX_FORCE_COORDINATE)) {
      throw new Error(`Force layout coordinates must be finite and have an absolute value no greater than ${MAX_FORCE_COORDINATE}.`);
    }
  }
}

export function forceLayoutIterations(value: number | undefined): number {
  const iterations = value ?? 180;
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > MAX_FORCE_LAYOUT_ITERATIONS) {
    throw new Error(`Force layout iterations must be an integer between 1 and ${MAX_FORCE_LAYOUT_ITERATIONS}.`);
  }
  return iterations;
}
