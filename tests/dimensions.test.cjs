const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const host=fs.readFileSync(__dirname+'/../ArchitecturalToolsPanel/jsx/host.jsx','utf8').replace(/^#target illustrator\s*/, '');
function fixture(){
  const placement={PLACEBEFORE:'before',PLACEATBEGINNING:'first',PLACEATEND:'last'};
  function item(type,parent){
    const obj={typename:type,note:'',parent,selected:false};
    const tags=[];obj.tags={add:()=>{const t={};tags.push(t);return t},getByName:name=>{const t=tags.find(t=>t.name===name);if(!t)throw Error('Missing tag');return t}};
    obj.zOrder=function(){this.move(this.parent,'first')};
    if(parent)parent.pageItems.push(obj);
    obj.remove=function(){const i=this.parent.pageItems.indexOf(this);if(i>=0)this.parent.pageItems.splice(i,1)};
    obj.move=function(target,where){this.remove();const parent=where==='before'?target.parent:target;this.parent=parent;const i=where==='before'?parent.pageItems.indexOf(target):where==='first'?0:parent.pageItems.length;parent.pageItems.splice(i,0,this)};
    obj.translate=function(dx,dy){if(this.pageItems)this.pageItems.forEach(x=>x.translate(dx,dy));if(this.points)this.points=this.points.map(([x,y])=>[x+dx,y+dy]);if(this.position)this.position=[this.position[0]+dx,this.position[1]+dy];if(this.bounds)this.bounds=[this.bounds[0]+dx,this.bounds[1]+dy,this.bounds[2]+dx,this.bounds[3]+dy]};
    return obj;
  }
  function container(type,parent){
    const obj=item(type,parent);obj.pageItems=[];
    obj.groupItems={add:()=>container('GroupItem',obj)};
    obj.pathItems={add:()=>{const p=item('PathItem',obj);p.setEntirePath=points=>p.points=points;return p},rectangle:(top,left,width,height)=>{const p=item('PathItem',obj);p.bounds=[left,top,left+width,top-height];return p}};
    obj.textFrames={add:()=>{const t=item('TextFrame',obj);t.textRange={characterAttributes:{}};t.width=20;Object.defineProperty(t,'geometricBounds',{get(){const [x,y]=this.position;return [x,y,x+20,y-10]}});return t}};
    Object.defineProperty(obj,'visibleBounds',{get(){return [-100,500,900,-500]}});
    return obj;
  }
  const layer=container('Layer');const sibling=item('PathItem',layer);
  const source=item('PathItem',layer);source.note='user metadata';source.bounds=[10,100,82,28];
  Object.defineProperty(source,'geometricBounds',{get(){return this.bounds}});
  source.stroked=true;source.strokeWidth=0.75;
  Object.defineProperty(source,'visibleBounds',{get(){const [l,t,r,b]=this.bounds;const half=this.stroked?this.strokeWidth/2:0;return [l-half,t+half,r+half,b-half]}});
  source.pathPoints=[{anchor:[10,28],leftDirection:[10,28]},{anchor:[82,28],rightDirection:[82,28]}];source.closed=false;
  const doc={selection:[source],tags:{getByName:()=>({})}};
  const ctx={app:{documents:[doc],activeDocument:doc},ElementPlacement:placement,ZOrderMethod:{BRINGTOFRONT:'front'},RGBColor:function(){}};
  vm.runInNewContext(host,ctx);
  return {api:ctx.RJWArch,doc,source,layer,sibling};
}
test('width and height share one assembly and move with the source',()=>{
  const {api,doc,source,layer,sibling}=fixture();
  assert.match(api.dimension('48','horizontal','0.3'),/^Dimensioned 48"/);
  const assembly=source.parent;
  assert.equal(assembly.parent,layer);assert.deepEqual(layer.pageItems,[sibling,assembly]);
  assert.equal(assembly.selected,true);assert.equal(source.note,'user metadata');
  doc.selection=[assembly];
  assert.match(api.dimension('48','vertical','0.3'),/^Dimensioned 48"/);
  assert.equal(source.parent,assembly);assert.equal(assembly.pageItems.length,3);
  const dimensions=assembly.pageItems.filter(x=>x!==source);
  const positions=dimensions.map(d=>d.pageItems.find(p=>p.points).points.map(p=>[...p]));
  assembly.translate(50,-20);
  assert.deepEqual(source.bounds,[60,80,132,8]);
  dimensions.forEach((d,i)=>assert.deepEqual(d.pageItems.find(p=>p.points).points,positions[i].map(([x,y])=>[x+50,y-20])));
  doc.selection=[source];assert.match(api.dimension('48','horizontal','0.3'),/^Dimensioned 48"/);
  assert.equal(assembly.pageItems.length,4);
});
test('straight-line dimensions resolve the original path from the selected group',()=>{
  const {api,doc,source}=fixture();
  assert.match(api.dimension('48','line','0.3'),/^Dimensioned 48"/);
  doc.selection=[source.parent];
  assert.match(api.dimension('48','line','0.3'),/^Dimensioned 48"/);
});
test('invalid geometry leaves source hierarchy untouched',()=>{
  const {api,source,layer}=fixture();source.closed=true;
  assert.match(api.dimension('48','line','0.3'),/^Error: Select a single open/);
  assert.equal(source.parent,layer);assert.equal(layer.pageItems.length,2);
});
test('failed drawing removes partial dimensions',()=>{
  const {api,source,layer}=fixture();
  const add=layer.groupItems.add;
  layer.groupItems.add=()=>{const g=add();g.textFrames.add=()=>{throw Error('Text creation failed')};return g};
  assert.equal(api.dimension('48','horizontal','0.3'),'Error: Text creation failed');
  assert.equal(source.parent,layer);assert.equal(layer.pageItems.length,2);
});
test('failed attachment restores original source position',()=>{
  const {api,source,layer,sibling}=fixture();
  const add=layer.groupItems.add;let calls=0;
  layer.groupItems.add=()=>{const g=add();if(++calls===1)g.move=()=>{throw Error('Cannot attach')};return g};
  assert.equal(api.dimension('48','horizontal','0.3'),'Error: Cannot attach');
  assert.equal(source.parent,layer);assert.deepEqual(layer.pageItems,[sibling,source]);
});
test('width is below the box and height is to the right; centered labels have white padding',()=>{
  const {api,doc,source}=fixture();
  api.dimension('48','horizontal','0.3');
  const assembly=source.parent;
  let group=assembly.pageItems.find(x=>x!==source);
  const points=group.pageItems.find(p=>p.points).points;
  assert.ok(points.every(p=>p[1]<source.bounds[3]));
  const text=group.pageItems.find(p=>p.typename==='TextFrame');
  const mask=group.pageItems.find(p=>p.name==='Dimension label background');
  const b=text.geometricBounds;
  assert.equal((b[1]+b[3])/2,points[0][1]);
  assert.deepEqual(mask.bounds,[b[0]-3,b[1]+3,b[2]+3,b[3]-3]);
  assert.equal(mask.fillColor.red,255);assert.equal(mask.stroked,false);
  assert.ok(group.pageItems.indexOf(text)<group.pageItems.indexOf(mask));
  doc.selection=[assembly];api.dimension('48','vertical','0.3');
  group=assembly.pageItems[0];
  assert.ok(group.pageItems.find(p=>p.points).points.every(p=>p[0]>source.bounds[2]));
});
test('reposition replaces only the chosen dimension and preserves scale after moving artwork',()=>{
  const {api,doc,source}=fixture();api.dimension('48','horizontal','0.3');
  const assembly=source.parent;doc.selection=[assembly];api.dimension('24','vertical','0.3');
  const vertical=assembly.pageItems[0];doc.selection=[assembly];assembly.translate(30,50);
  const bounds=[...source.bounds];
  assert.match(api.reposition('horizontal','0.6'),/^Dimensioned 48"/);
  assert.deepEqual(source.bounds,bounds);assert.ok(assembly.pageItems.includes(vertical));
  assert.equal(assembly.pageItems.length,3);
  const horizontal=assembly.pageItems[0];const y=horizontal.pageItems.find(p=>p.points).points[0][1];
  assert.ok(Math.abs(y-(bounds[3]-43.2))<1e-8);
  doc.selection=[horizontal.pageItems.find(p=>p.typename==='TextFrame')];
  assert.match(api.reposition('vertical','0.1'),/^Dimensioned 48"/);
  assert.equal(assembly.pageItems.length,3);
});
test('reposition rejects invalid offsets and ambiguous dimensions without deleting artwork',()=>{
  const {api,doc,source}=fixture();api.dimension('48','horizontal','0.3');
  const assembly=source.parent;doc.selection=[assembly];api.dimension('48','horizontal','0.5');doc.selection=[assembly];
  assert.match(api.reposition('horizontal','0.4'),/^Error: More than one/);
  assert.match(api.reposition('horizontal','-1'),/^Error: Dimensions must be positive/);
  assert.equal(assembly.pageItems.length,3);
});
test('failed reposition retains the previous dimension',()=>{
  const {api,doc,source}=fixture();api.dimension('48','horizontal','0.3');
  const assembly=source.parent,original=assembly.pageItems[0];doc.selection=[assembly];
  const add=assembly.groupItems.add;
  assembly.groupItems.add=()=>{const g=add();g.textFrames.add=()=>{throw Error('Text creation failed')};return g};
  assert.equal(api.reposition('horizontal','0.6'),'Error: Text creation failed');
  assert.deepEqual(assembly.pageItems,[original,source]);
});
test('panel sends chosen mode and offset to the reposition command',()=>{
  const html=fs.readFileSync(__dirname+'/../ArchitecturalToolsPanel/index.html','utf8');
  const elements={};
  for(const id of ['save','rectangle','horizontal','vertical','line','reposition','moveMode','offset','status'])elements[id]={};
  elements.moveMode.value='vertical';elements.offset.value='0.75';
  let expression;
  vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],{
    document:{getElementById:id=>elements[id]},window:{__adobe_cep__:{evalScript:(s,cb)=>{expression=s;cb('Updated')}}}
  });
  elements.reposition.onclick();
  assert.equal(expression,'RJWArch.reposition("vertical","0.75")');
  assert.equal(elements.status.textContent,'Updated');
});
test('created rectangles measure exactly at every panel scale, excluding stroke',()=>{
  for(const scale of [12,16,24,48,96]){
    for(const width of [24,36]){
      const {api,doc,source}=fixture();
      doc.artboards=Object.assign([{artboardRect:[0,792,612,0]}],{getActiveArtboardIndex:()=>0});
      doc.pathItems={rectangle:(top,left,w,h)=>{source.bounds=[left,top,left+w,top-h];return source}};
      assert.match(api.rectangle(String(scale),String(width),'34 1/2'),/^Created/);
      doc.selection=[source];
      assert.ok(api.dimension(String(scale),'horizontal','0.3').startsWith('Dimensioned '+width+'" at'));
      doc.selection=[source.parent];
      assert.ok(api.dimension(String(scale),'vertical','0.3').startsWith('Dimensioned 34 1/2" at'));
    }
  }
});
test('extension lines start 3 pt beyond the visible stroke and have stronger weights',()=>{
  for(const mode of ['horizontal','vertical','line']){
    const {api,source}=fixture();source.strokeWidth=4;
    assert.match(api.dimension('48',mode,'0.3'),/^Dimensioned/);
    const group=source.parent.pageItems[0];
    const paths=group.pageItems.filter(p=>p.points);
    assert.equal(paths[0].strokeWidth,0.625);
    assert.equal(paths[1].strokeWidth,0.625);assert.equal(paths[3].strokeWidth,1.25);
    assert.ok(paths.slice(0,3).every(p=>p.strokeWidth===paths[3].strokeWidth/2));
    if(mode==='horizontal')assert.equal(paths[1].points[0][1],source.visibleBounds[3]-3);
    else if(mode==='vertical')assert.equal(paths[1].points[0][0],source.visibleBounds[2]+3);
    else assert.equal(paths[1].points[0][1],source.pathPoints[0].anchor[1]+5);
  }
});
test('tiny offsets fail without drawing extensions through the source',()=>{
  const {api,source,layer}=fixture();
  assert.match(api.dimension('48','horizontal','0.01'),/^Error: Increase the dimension offset/);
  assert.equal(source.parent,layer);assert.equal(layer.pageItems.length,2);
});
