import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import * as yaml from 'js-yaml';
const converter = new URL('../../packages/topoviewer/content/examples/integration/kubernetes-service-map/convert-eda-kubernetes-inventory.mjs',import.meta.url);
const object = (kind,name,namespace='a',extra={}) => ({kind,metadata:{name,namespace,uid:`${namespace}-${name}`,labels:{app:'api'}},...extra});
function convert(files){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'topoviewer-kube-'));
 try {for(const [file,items] of Object.entries(files))fs.writeFileSync(path.join(dir,file),JSON.stringify({items}));const out=path.join(dir,'topology.yaml');execFileSync(process.execPath,[converter.pathname,dir,out]);return yaml.load(fs.readFileSync(out,'utf8'));}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
}
test('selectors target same-namespace Pods; template correspondence never proves ownership',()=>{
 const svc=object('Service','api','a',{spec:{selector:{app:'api'}}});
 const dep=object('Deployment','api','a',{spec:{selector:{matchLabels:{app:'api'}},template:{metadata:{labels:{app:'api'}}}}});
 const d=convert({'services.json':[svc,object('Service','no-selector')],'deployments.json':[dep,{...dep,metadata:{...dep.metadata,namespace:'b',uid:'b-api'}}],'pods.json':[object('Pod','api'),object('Pod','foreign','b')]});
 assert.deepEqual(d.graph.links.map(e=>[e.labels.link,e.target]),[['selector','pod-a-api'],['template-match','deploy-a-api']]);
 assert.equal(d.graph.nodes.find(n=>n.id==='svc-a-api').labels.status,'unknown');
 assert.equal(d.graph.nodes.find(n=>n.id==='deploy-a-api').labels.status,'unknown');
});
test('ownership follows captured UIDs through ReplicaSets, without fabricated domain containment',()=>{
 const owner=(kind,name,uid)=>[{kind,name,uid,controller:true}];
 const dep=object('Deployment','api');
 const rs=object('ReplicaSet','api-rs');rs.metadata.ownerReferences=owner('Deployment','api','a-api');
 const pod=object('Pod','api-pod');pod.metadata.ownerReferences=owner('ReplicaSet','api-rs','a-api-rs');
 const top1=object('NetworkTopology','one'),top2=object('NetworkTopology','two'),tn=object('TopoNode','leaf');tn.metadata.ownerReferences=owner('NetworkTopology','one','a-one');
 const d=convert({'deployments.json':[dep],'replicasets.json':[rs],'pods.json':[pod],'domain.json':[top1,top2,tn]});
 assert.deepEqual(d.graph.links.map(e=>[e.source,e.target]),[['deploy-a-api','rs-a-api-rs'],['rs-a-api-rs','pod-a-api-pod'],['cr-networktopology-a-one','cr-toponode-a-leaf']]);
 assert.ok(d.graph.links.every(e=>e.data.provenance==='metadata.ownerReferences'));
});
test('Running is not Ready, missing status is unknown, and zero replicas is scaled down',()=>{
 const pod=(name,status)=>object('Pod',name,'a',{status});
 const dep=(name,spec,status)=>object('Deployment',name,'a',{metadata:{name,namespace:'a',generation:2},spec,status});
 const d=convert({'pods.json':[pod('running',{phase:'Running'}),pod('unready',{phase:'Running',conditions:[{type:'Ready',status:'False'}]}),pod('ready',{conditions:[{type:'Ready',status:'True'}]})],'deployments.json':[dep('off',{replicas:0},{}),dep('old',{replicas:2},{observedGeneration:1,availableReplicas:2}),dep('ok',{replicas:2},{observedGeneration:2,availableReplicas:2})]});
 const status=Object.fromEntries(d.graph.nodes.map(n=>[n.id,n.labels.status]));
 assert.deepEqual(status,{'deploy-a-off':'scaled-down','deploy-a-old':'unknown','deploy-a-ok':'ready','pod-a-running':'unknown','pod-a-unready':'not-ready','pod-a-ready':'ready'});
});

test('multirow inventory families have distinct positions and dotted names retain identity',()=>{
 const services=Array.from({length:24},(_,i)=>object('Service',`svc-${i}`));
 services.push(object('Service','api.v1'),object('Service','api-v1'));
 const d=convert({'services.json':services,'deployments.json':[object('Deployment','api')],'replicasets.json':[object('ReplicaSet','api-rs')],'pods.json':[object('Pod','api-pod')]});
 assert.equal(new Set(d.graph.nodes.map(n=>n.id)).size,d.graph.nodes.length);
 const servicesBottom=Math.max(...d.graph.nodes.filter(n=>n.labels.object==='service').map(n=>n.position[1]));
 assert.ok(d.graph.nodes.find(n=>n.labels.object==='deployment').position[1]>servicesBottom+150);
 assert.equal(new Set(d.graph.nodes.map(n=>n.position.join(','))).size,d.graph.nodes.length);
});

test('absent namespace evidence cannot establish selection or namespaced ownership',()=>{
 const svc=object('Service','api','a',{spec:{selector:{app:'api'}}});delete svc.metadata.namespace;
 const pod=object('Pod','api-pod');delete pod.metadata.namespace;
 const dep=object('Deployment','api');delete dep.metadata.namespace;
 pod.metadata.ownerReferences=[{kind:'Deployment',name:'api',uid:'a-api',controller:true}];
 const d=convert({'services.json':[svc],'deployments.json':[dep],'pods.json':[pod]});
 assert.deepEqual(d.graph.links,[]);
});
