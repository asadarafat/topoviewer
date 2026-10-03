import { describe, expect, it } from 'vitest';
import { buildProjection } from '../../src/session/projection';
import { studioRendererLimits } from '../../src/security/rendererLimits';

describe('Studio renderer ceilings', () => {
  it('rejects expanded graphs even when imported YAML raises its own limits', () => {
    const nodes = Array.from({ length: studioRendererLimits.maxNodes + 1 }, (_, index) => `    - id: n${index}`).join('\n');
    const result = buildProjection({
      topology: `graph:\n  nodes:\n${nodes}\n`,
      stylesheet: 'limits:\n  maxNodes: 100000\nlayout:\n  mode: manual\nstylesheet: []\n'
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: 'studio-renderer-limit' }));
  });

  it('allows a small graph with a portable larger ceiling without mutating its YAML', () => {
    const result = buildProjection({
      topology: 'graph:\n  nodes:\n    - id: n1\n',
      stylesheet: 'limits:\n  maxNodes: 100000\nlayout:\n  mode: manual\nstylesheet: []\n'
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.document.limits?.maxNodes).toBe(100000);
  });
});
