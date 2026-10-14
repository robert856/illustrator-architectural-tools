const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const host=fs.readFileSync(__dirname+'/../ArchitecturalToolsPanel/jsx/host.jsx','utf8').replace(/^#target illustrator\s*/, '');
function fixture(){
  const placement={PLACEBEFORE:'before',PLACEATBEGINNING:'first',PLACEATEND:'last'};
  function item(type,parent){
    const obj={typename:type,note:'',parent,selected:false};
    if(parent)parent.pageItems.push(obj);
    obj.remove=function(){const i=this.parent.pageItems.indexOf(this);if(i>=0)this.parent.pageItems.splice(i,1)};
    obj.move=function(target,where){this.remove();const parent=where==='before'?target.parent:target;this.parent=parent;const i=where==='before'?parent.pageItems.indexOf(target):where==='first'?0:parent.pageItems.length;parent.pageItems.splice(i,0,this)};
    obj.translate=function(dx,dy){if(this.pageItems)this.pageItems.forEach(x=>x.translate(dx,dy));if(this.points)this.points=this.points.map(([x,y])=>[x+dx,y+dy]);if(this.position)this.position=[this.position[0]+dx,this.position[1]+dy];if(this.bounds)this.bounds=[this.bounds[0]+dx,this.bounds[1]+dy,this.bounds[2]+dx,this.bounds[3]+dy]};
    return obj;
  }
  function container(type,parent){
    const obj=item(type,parent);obj.pageItems=[];
    obj.groupItems={add:()=>container('GroupItem',obj)};
    obj.pathItems={add:()=>{const p=item('PathItem',obj);p.setEntirePath=points=>p.points=points;return p}};
    obj.textFrames={add:()=>{const t=item('TextFrame',obj);t.textRange={characterAttributes:{}};t.width=20;return t}};
    Object.defineProperty(obj,'visibleBounds',{get(){return [-100,500,900,-500]}});
    return obj;
  }
  const layer=container('Layer');const sibling=item('PathItem',layer);
  const source=item('PathItem',layer);source.note='user metadata';source.bounds=[10,100,82,28];
  Object.defineProperty(source,'visibleBounds',{get(){return this.bounds}});
  source.pathPoints=[{anchor:[10,28],leftDirection:[10,28]},{anchor:[82,28],rightDirection:[82,28]}];source.closed=false;
  const doc={selection:[source],tags:{getByName:()=>({})}};
  const ctx={app:{documents:[doc],activeDocument:doc},ElementPlacement:placement,RGBColor:function(){}};
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
  const positions=dimensions.map(d=>d.pageItems[0].points.map(p=>[...p]));
  assembly.translate(50,-20);
  assert.deepEqual(source.bounds,[60,80,132,8]);
  dimensions.forEach((d,i)=>assert.deepEqual(d.pageItems[0].points,positions[i].map(([x,y])=>[x+50,y-20])));
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
