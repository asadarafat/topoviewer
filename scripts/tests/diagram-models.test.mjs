import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import * as yaml from 'js-yaml';
const base='packages/topoviewer/content/examples/';
const read=p=>yaml.load(fs.readFileSync(p,'utf8'));
test('Kubernetes teaching diagrams do not assert selection of Deployments or direct Pod ownership',()=>{
 for(const folder of ['integration/endpoint-journey','integration/kubernetes-service-map']){
  const {graph}=read(base+folder+'/topology.yaml');const nodes=new Map(graph.nodes.map(n=>[n.id,n]));
  for(const link of graph.links){
   const source=nodes.get(link.source),target=nodes.get(link.target),name=link.labels.name??link.name??'';
   if(source.labels.object==='service'&&target.labels.object==='deployment'){
    assert.ok(!/selects|selector/i.test(name),`${folder}: Service cannot select a Deployment`);
    if((link.labels.relation??link.labels.link)==='template-match'){assert.equal(name,'template match');assert.equal(link.data.provenance,'inferred');}
   }
   if(source.labels.object==='deployment'&&target.labels.object==='pod'){
    assert.equal(name,'Pod association');assert.match(link.data.detail,/ReplicaSet/);
   }
  }
  const comparison=graph.links.find(e=>e.id==='try-eda-to-eda-api');assert.equal(comparison.labels.name,'shared selector');
 }
});
test('Grafana telemetry and mounted bundles cross the correct component boundaries',()=>{
 const {graph}=read(base+'integration/grafana-telemetry-call-flow/topology.yaml');
 const edge=(source,target)=>graph.links.find(e=>e.source===source&&e.target===target);
 assert.ok(edge('authoring-tool','mounted-bundle'));assert.ok(edge('mounted-bundle','plugin-backend'));
 assert.ok(edge('prometheus-http-api','grafana-datasource'));assert.ok(edge('grafana-datasource','plugin-frontend'));
 assert.equal(edge('prometheus-http-api','plugin-backend'),undefined);
 assert.equal(edge('authoring-tool','plugin-backend'),undefined);
 assert.ok(graph.regions.find(r=>r.id==='grafana-region').members.includes('grafana-datasource'));
 assert.ok(!graph.regions.find(r=>r.id==='backend-region').members.includes('grafana-datasource'));
});
test('physical spine/leaf fixtures contain the complete stated leaf-to-spine mesh',()=>{
 for(const file of [base+'authoring/clos-2spine-4leaf/topology.yaml',base+'edges/dense-clos-labels/topology.yaml',base+'integration/fabric-journey/topology.yaml','labs/grafana-topoviewer/topoviewer-bundles/st-clos/st-clos.topo.tv.yaml']){
  const {graph}=read(file);const spines=graph.nodes.filter(n=>/spine/i.test(n.id));const leaves=graph.nodes.filter(n=>/leaf/i.test(n.id));
  assert.ok(spines.length>0&&leaves.length>0,file);
  for(const s of spines)for(const l of leaves)assert.ok(graph.links.some(e=>(e.source===s.id&&e.target===l.id)||(e.target===s.id&&e.source===l.id)),`${file}: ${s.id} ↔ ${l.id}`);
 }
});
