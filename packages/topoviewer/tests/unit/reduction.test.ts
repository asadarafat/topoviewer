import { describe, expect, it } from 'vitest';
import { buildAttentionIndex, deriveAggregateGraph, type TopoDocument } from '../../src';
import { attentionFixture } from './attention-fixture';
import { compileTopoGraph } from '../../src/core/compiler';

describe('deriveAggregateGraph', () => {
  it('preserves distinct link layer memberships and counts when collapsing nodes', () => {
    const document: TopoDocument = {
      layout: { mode: 'manual' },
      graph: {
        layers: [{ id: 'physical' }, { id: 'service' }],
        nodes: ['a', 'b', 'c'].map((id, index) => ({ id, layers: ['physical', 'service'], position: [index * 100, 0] })),
        regions: [{ id: 'site', members: ['a', 'b'], layers: ['physical', 'service'] }],
        links: [
          { id: 'physical-a', source: 'a', target: 'c', layers: ['physical'] },
          { id: 'service-a', source: 'a', target: 'c', layers: ['service'] },
          { id: 'physical-b', source: 'b', target: 'c', layers: ['physical'] },
          { id: 'shared-a', source: 'a', target: 'c', layers: ['physical', 'service'] },
          { id: 'shared-b', source: 'b', target: 'c', layers: ['service', 'physical'] },
          { id: 'unlayered', source: 'b', target: 'c', layers: [] }
        ]
      }
    };
    const options = { groups: [{ id: 'site', by: 'region' as const, regionId: 'site' }] };
    const result = deriveAggregateGraph(document, buildAttentionIndex(document), options).document;
    const links = result.graph!.links!;
    expect(links).toHaveLength(4);
    expect(new Set(links.map((link) => link.id)).size).toBe(4);
    expect(links.map((link) => ({ layers: link.layers, members: link.data?.members }))).toEqual([
      { layers: ['physical'], members: ['physical-a', 'physical-b'] },
      { layers: ['service'], members: ['service-a'] },
      { layers: ['physical', 'service'], members: ['shared-a', 'shared-b'] },
      { layers: [], members: ['unlayered'] }
    ]);
    expect(compileTopoGraph(result, ['service']).edges.map((edge) => edge.data?.members)).toEqual([
      ['service-a'], ['shared-a', 'shared-b']
    ]);
    expect(compileTopoGraph(result, ['physical']).edges.map((edge) => edge.data?.members)).toEqual([
      ['physical-a', 'physical-b'], ['shared-a', 'shared-b']
    ]);
    const reversed = { ...document, graph: { ...document.graph, links: [...document.graph!.links!].reverse() } };
    expect(deriveAggregateGraph(reversed, buildAttentionIndex(reversed), options).document.graph!.links!.map((link) => link.id).sort())
      .toEqual(links.map((link) => link.id).sort());
  });

  it('retains all layers when parallel grouping explicitly combines layers', () => {
    const document: TopoDocument = {
      graph: {
        nodes: [{ id: 'a' }, { id: 'b' }],
        links: [
          { id: 'physical', source: 'a', target: 'b', layers: ['physical'] },
          { id: 'service', source: 'a', target: 'b', layers: ['service'] }
        ]
      }
    };
    const result = deriveAggregateGraph(document, buildAttentionIndex(document), { groups: [], linkGrouping: { by: ['endpoints'] } });
    expect(result.document.graph?.links).toEqual([expect.objectContaining({
      layers: ['physical', 'service'], data: expect.objectContaining({ count: 2, members: ['physical', 'service'] })
    })]);
  });

  it('collapses region members into an aggregate node without mutating the source document', () => {
    const document = attentionFixture();
    const before = JSON.stringify(document);
    const index = buildAttentionIndex(document);

    const result = deriveAggregateGraph(document, index, {
      groups: [{ id: 'fra', by: 'region', regionId: 'region-fra', label: 'Frankfurt aggregate' }]
    });

    expect(JSON.stringify(document)).toBe(before);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]).toMatchObject({
      id: 'fra',
      aggregateNodeId: 'aggregate:fra',
      by: 'region',
      sourceId: 'region-fra',
      childCount: 2,
      linkCount: 1,
      severitySummary: { critical: 1, major: 1 }
    });

    const nodes = result.document.graph?.nodes || [];
    expect(nodes.map((node) => node.id)).toEqual(['aggregate:fra', 'access-1']);
    expect(nodes.find((node) => node.id === 'aggregate:fra')?.data).toMatchObject({
      isAggregate: true,
      aggregateBy: 'region',
      members: ['core-1', 'dist-1'],
      childCount: 2
    });

    expect(result.document.graph?.links?.map((link) => [link.id, link.source, link.target])).toEqual([]);
    expect(result.document.graph?.paths?.find((path) => path.id === 'lsp-critical')?.sequence).toEqual(['aggregate:fra', 'access-1']);
    expect(result.document.graph?.paths?.find((path) => path.id === 'stitched-vpn')).toMatchObject({
      source: 'access-1',
      target: 'aggregate:fra'
    });
    expect(result.document.graph?.regions?.map((region) => region.id)).toEqual([]);
    expect(result.document.stylesheet?.some((rule) => rule.selector === 'node[isAggregate="true"]')).toBe(true);
  });

  it('keeps collapsed aggregate nodes visible in the member layers', () => {
    const document: TopoDocument = {
      graph: {
        layers: [
          { id: 'control-plane', labels: { name: 'Control plane' } },
          { id: 'topology-runtime', labels: { name: 'Topology runtime' } }
        ],
        nodes: [
          { id: 'svc-api', labels: { name: 'API service' }, layers: ['control-plane'], position: [100, 100] },
          { id: 'deploy-api', labels: { name: 'API deployment' }, layers: ['control-plane'], position: [220, 100] },
          { id: 'toponode-leaf1', labels: { name: 'leaf1' }, layers: ['topology-runtime'], position: [100, 260] }
        ],
        links: [
          { id: 'svc-deploy', source: 'svc-api', target: 'deploy-api', layers: ['control-plane'] }
        ],
        regions: [
          {
            id: 'api-region',
            labels: { name: 'API region' },
            members: ['svc-api', 'deploy-api'],
            layers: ['control-plane']
          }
        ]
      }
    };
    const index = buildAttentionIndex(document);

    const result = deriveAggregateGraph(document, index, {
      groups: [{ id: 'api-region', by: 'region', regionId: 'api-region', label: 'API region' }]
    });

    expect(result.document.graph?.nodes?.find((node) => node.id === 'aggregate:api-region')?.layers).toEqual(['control-plane']);
    expect(result.document.graph?.nodes?.map((node) => node.id)).toEqual(['aggregate:api-region', 'toponode-leaf1']);
  });

  it('collapses parent-child nodes and label-defined groups', () => {
    const document = attentionFixture();
    const index = buildAttentionIndex(document);

    const parentResult = deriveAggregateGraph(document, index, {
      groups: [{ id: 'dist-children', by: 'parent', parentId: 'dist-1' }]
    });
    expect(parentResult.groups[0].memberIds).toEqual(['access-1']);
    expect(parentResult.document.graph?.nodes?.map((node) => node.id)).toEqual([
      'aggregate:dist-children',
      'core-1',
      'dist-1'
    ]);

    const labelResult = deriveAggregateGraph(document, index, {
      groups: [{ id: 'access-role', by: 'label', key: 'role', value: 'access' }]
    });
    expect(labelResult.groups[0]).toMatchObject({
      by: 'label',
      sourceId: 'role:access',
      childCount: 1
    });
    expect(labelResult.document.graph?.nodes?.map((node) => node.id)).toEqual([
      'aggregate:access-role',
      'core-1',
      'dist-1'
    ]);
  });

  it('honors expanded group state by leaving unrelated layout inputs stable', () => {
    const document = attentionFixture();
    const index = buildAttentionIndex(document);

    const result = deriveAggregateGraph(document, index, {
      groups: [{ id: 'fra', by: 'region', regionId: 'region-fra' }],
      expandedGroupIds: ['fra']
    });

    expect(result.groups).toEqual([]);
    expect(result.document.graph?.nodes).toEqual(document.graph?.nodes);
    expect(result.document.graph?.links).toEqual(document.graph?.links);
    expect(result.document.graph?.paths).toEqual(document.graph?.paths);
  });

  it('groups parallel links by threshold while preserving member references', () => {
    const document = {
      version: '1.0',
      graph: {
        layers: [{ id: 'transport', labels: { name: 'Transport' } }],
        nodes: [
          { id: 'a', labels: { name: 'A' }, layers: ['transport'] },
          { id: 'b', labels: { name: 'B' }, layers: ['transport'] }
        ],
        links: [
          { id: 'a-b-1', source: 'a', target: 'b', layers: ['transport'] },
          { id: 'a-b-2', source: 'a', target: 'b', layers: ['transport'] },
          { id: 'b-a-3', source: 'b', target: 'a', layers: ['transport'] }
        ]
      }
    };
    const index = buildAttentionIndex(document);

    const grouped = deriveAggregateGraph(document, index, {
      groups: [],
      linkGrouping: {
        threshold: 2,
        by: ['endpoints', 'layer']
      }
    });

    expect(grouped.linkGroups).toHaveLength(1);
    expect(grouped.linkGroups[0]).toMatchObject({
      id: 'endpoints-a-b-layer-transport',
      aggregateLinkId: 'aggregate-link-group:endpoints-a-b-layer-transport',
      expanded: false,
      source: 'a',
      target: 'b',
      count: 3,
      memberIds: ['a-b-1', 'a-b-2', 'b-a-3']
    });
    expect(grouped.document.graph?.links).toEqual([
      expect.objectContaining({
        id: 'aggregate-link-group:endpoints-a-b-layer-transport',
        labels: expect.objectContaining({ name: '3 links' }),
        data: expect.objectContaining({
          isLinkAggregate: true,
          members: ['a-b-1', 'a-b-2', 'b-a-3']
        })
      })
    ]);

    const expanded = deriveAggregateGraph(document, index, {
      groups: [],
      linkGrouping: {
        threshold: 2,
        by: ['endpoints', 'layer'],
        expandedGroupIds: ['endpoints-a-b-layer-transport']
      }
    });
    expect(expanded.linkGroups).toEqual([
      expect.objectContaining({
        id: 'endpoints-a-b-layer-transport',
        expanded: true,
        memberIds: ['a-b-1', 'a-b-2', 'b-a-3']
      })
    ]);
    expect(expanded.document.graph?.links?.map((link) => link.id)).toEqual(['a-b-1', 'a-b-2', 'b-a-3']);
    expect(expanded.document.graph?.links?.[0]?.data).toMatchObject({
      isExpandedLinkAggregateMember: true,
      linkAggregateCollapseControl: true,
      linkAggregateGroupId: 'endpoints-a-b-layer-transport'
    });
  });

  it('limits link grouping to an explicit selector without capturing sibling links', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical', labels: { name: 'Physical' } }],
        nodes: [{ id: 'a' }, { id: 'b' }],
        links: [
          { id: 'ordinary-1', source: 'a', target: 'b', layers: ['physical'] },
          { id: 'ordinary-2', source: 'a', target: 'b', layers: ['physical'] },
          { id: 'parallel-1', source: 'a', target: 'b', labels: { link: 'parallel' }, layers: ['physical'] },
          { id: 'parallel-2', source: 'a', target: 'b', labels: { link: 'parallel' }, layers: ['physical'] },
          { id: 'parallel-3', source: 'a', target: 'b', labels: { link: 'parallel' }, layers: ['physical'] }
        ]
      }
    };
    const grouped = deriveAggregateGraph(document, buildAttentionIndex(document), {
      groups: [],
      linkGrouping: {
        by: ['endpoints', 'layer'],
        selector: 'link[labels.link = "parallel"]',
        threshold: 2
      }
    });

    expect(grouped.linkGroups).toEqual([
      expect.objectContaining({ memberIds: ['parallel-1', 'parallel-2', 'parallel-3'] })
    ]);
    expect(grouped.document.graph?.links?.map((link) => link.id)).toEqual([
      'ordinary-1',
      'ordinary-2',
      'aggregate-link-group:endpoints-a-b-layer-physical'
    ]);
  });

  it('does not group parent-link carrier relationships as parallel links', () => {
    const document: TopoDocument = {
      graph: {
        nodes: [{ id: 'a' }, { id: 'b' }],
        links: [
          { id: 'carrier', source: 'a', target: 'b' },
          { id: 'child', source: 'a', target: 'b', parent: 'carrier' }
        ]
      },
      stylesheet: [{ selector: 'link[id = "carrier"]', style: { pipe: true } }]
    };
    const grouped = deriveAggregateGraph(document, buildAttentionIndex(document), {
      groups: [],
      linkGrouping: { threshold: 2, by: ['endpoints', 'layer'] }
    });

    expect(grouped.linkGroups).toHaveLength(0);
    expect(grouped.document.graph?.links?.map((link) => link.id)).toEqual(['carrier', 'child']);
  });
});
