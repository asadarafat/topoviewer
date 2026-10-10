import {test,expect} from '@playwright/test';
test('floating and parallel links touch the visible shape, and round primitives retain their geometry',async({page})=>{
 await page.goto('/tests/fixtures/shape-boundary-runtime.html');
 await expect(page.locator('.react-flow__edge')).toHaveCount(20);
 await expect(page.locator('.topoviewer-node-geometry').first()).toBeVisible();
 const results=await page.evaluate(()=>{
  const checks=[];
  for(const edge of document.querySelectorAll('.react-flow__edge')){
   const path=edge.querySelector('.react-flow__edge-path');
   const id=edge.getAttribute('data-id');const shape=id.split('-link-')[0];
   for(const [col,end] of [[0,0],[1,path.getTotalLength()]]){
    const geometry=document.querySelector(`[data-id="${shape}-${col}"] .topoviewer-node-geometry-stroke-overlay`);
    const outline=geometry.querySelector('.topoviewer-node-geometry-shape');
    const p=path.getPointAtLength(end);const screen=new DOMPoint(p.x,p.y).matrixTransform(path.getScreenCTM());
    const local=screen.matrixTransform(outline.getScreenCTM().inverse());
    checks.push({id,endpoint:col,onOutline:outline.isPointInStroke(local),local:{x:local.x,y:local.y}});
   }
  }
  const primitives=['circle','square','sphere','cube'].map(shape=>{
   const svg=document.querySelector(`[data-id="primitive-${shape}"] svg.topoviewer-shape-geometry`);
   const m=svg.getScreenCTM();return {shape,scaleX:Math.hypot(m.a,m.b),scaleY:Math.hypot(m.c,m.d)};
  });
  return {checks,primitives};
 });
 expect(results.checks.filter(x=>!x.onOutline)).toEqual([]);
 for(const pin of results.checks.filter(x=>x.id==='triangle-link-pin')){expect(pin.local.x).toBeCloseTo(50,3);expect(Math.abs(pin.local.y)).toBeLessThan(1);}
 expect(new Set(results.checks.filter(x=>x.id.startsWith('triangle-link-')&&x.id!=='triangle-link-pin'&&x.endpoint===0).map(x=>x.local.y)).size).toBe(3);
 for(const primitive of results.primitives)expect(primitive.scaleX,primitive.shape).toBeCloseTo(primitive.scaleY,5);
});

test('authored label z-index controls paint order across the portal containers',async({page})=>{
 await page.goto('/tests/fixtures/label-layer-runtime.html');
 await expect(page.locator('.topoviewer-edge-label-center')).toHaveCount(2);
 const painted=await page.evaluate(()=>{
  for(const e of document.querySelectorAll('.topoviewer-edge-label,.topoviewer-edge-visible-path,.react-flow__edge-path'))e.style.pointerEvents='all';
  return [...document.querySelectorAll('.topoviewer-edge-label-center')].map(label=>{
   const r=label.getBoundingClientRect();const hit=document.elementsFromPoint(r.x+r.width/2,r.y+r.height/2).find(e=>e.classList.contains('topoviewer-edge-label')||e.matches('path'));
   return {text:label.textContent,labelOnTop:hit===label};
  });
 });
 expect(painted).toEqual([{text:'label above line',labelOnTop:true},{text:'label below line',labelOnTop:false}]);
});

test('direct North–West corridors stay clear of the East summary during drill-down',async({page})=>{
 await page.goto('/tests/fixtures/metro-routing-runtime.html');
 await expect(page.locator('.react-flow__node-network')).toHaveCount(3);
 const crossings=()=>page.evaluate(()=>{
  const body=document.querySelector('[data-id="aggregate:east-metro"] .topoviewer-node-geometry').getBoundingClientRect();
  const paths=[...document.querySelectorAll('.react-flow__edge')].filter(e=>{const id=decodeURIComponent(e.getAttribute('data-id'));return id.includes('north')&&id.includes('west');}).map(e=>e.querySelector('.react-flow__edge-path'));
  const hits=paths.flatMap(path=>Array.from({length:81},(_,i)=>{const p=path.getPointAtLength(path.getTotalLength()*i/80);return new DOMPoint(p.x,p.y).matrixTransform(path.getScreenCTM());}).filter(p=>p.x>body.left+2&&p.x<body.right-2&&p.y>body.top+2&&p.y<body.bottom-2));
  return {paths:paths.length,hits:hits.length};
 });
 expect(await crossings()).toEqual({paths:1,hits:0});
 await page.getByRole('button',{name:'Expand NORTH metro'}).click();
 await expect(page.locator('.react-flow__node-network')).toHaveCount(7);
 expect(await crossings()).toEqual({paths:2,hits:0});
});
