import { describe, expect, it } from 'vitest';
import { nodeShapeBoundaryPoint } from '../../src/core/nodeShapeBoundary';

const box = { x: 10, y: 20, width: 200, height: 100 };
describe('visible node outline attachment', () => {
  it('attaches triangle sides to their slope, not the invisible rectangle', () => {
    expect(nodeShapeBoundaryPoint('triangle', undefined, box, { x: 210, y: 70 }, 'right')).toEqual({ x: 160, y: 70 });
    expect(nodeShapeBoundaryPoint('triangle', undefined, box, { x: 10, y: 70 }, 'left')).toEqual({ x: 60, y: 70 });
  });
  it('reprojects displaced parallel links on the triangle and ellipse outlines', () => {
    expect(nodeShapeBoundaryPoint('triangle', undefined, box, { x: 210, y: 45 }, 'right')).toEqual({ x: 135, y: 45 });
    const ellipse = nodeShapeBoundaryPoint('ellipse', undefined, box, { x: 210, y: 45 }, 'right');
    expect(((ellipse.x - 110) / 100) ** 2 + ((ellipse.y - 70) / 50) ** 2).toBeCloseTo(1, 10);
  });
  it('respects a custom polygon inset and slanted rhomboid', () => {
    expect(nodeShapeBoundaryPoint('polygon', '10,10 90,10 90,90 10,90', box, { x: 210, y: 70 }, 'right')).toEqual({ x: 190, y: 70 });
    expect(nodeShapeBoundaryPoint('rhomboid', undefined, box, { x: 210, y: 70 }, 'right')).toEqual({ x: 182, y: 70 });
  });
  it('uses the rendered cubic barrel rather than its bounding box', () => {
    expect(nodeShapeBoundaryPoint('barrel', undefined, box, { x: 210, y: 70 }, 'right').x).toBeCloseTo(201, 1);
    expect(nodeShapeBoundaryPoint('bottomRoundRectangle', undefined, box, { x: 210, y: 115 }, 'right').x).toBeLessThan(210);
  });
  it('keeps rectangular center attachments and follows rounded corners', () => {
    expect(nodeShapeBoundaryPoint('rectangle', undefined, box, { x: 210, y: 70 }, 'right')).toEqual({ x: 210, y: 70 });
    expect(nodeShapeBoundaryPoint('roundRectangle', undefined, box, { x: 210, y: 20 }, 'right')).toEqual({ x: 184, y: 20 });
  });
  it('attaches outside an inset custom polygon to an actual boundary vertex', () => {
    expect(nodeShapeBoundaryPoint('polygon', '10,10 90,10 90,90 10,90', box, { x: 210, y: 20 }, 'right')).toEqual({ x: 190, y: 30 });
  });
});
