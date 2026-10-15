const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function panel(bridge=true,delayed=false){
  const html=fs.readFileSync(__dirname+'/../ArchitecturalToolsPanel/index.html','utf8');
  const elements={};
  for(const match of html.matchAll(/id="([^"]+)"/g))elements[match[1]]={setAttribute(k,v){this[k]=v},value:'',disabled:false};
  Object.assign(elements.scale,{value:'48'});Object.assign(elements.offset,{value:'0.30'});
  Object.assign(elements.width,{value:'36'});Object.assign(elements.height,{value:'34 1/2'});
  const calls=[],callbacks=[];
  const window=bridge?{__adobe_cep__:{evalScript:(s,cb)=>{calls.push(s);if(delayed)callbacks.push(cb);else cb('OK')}}}:{};
  vm.runInNewContext(fs.readFileSync(__dirname+'/../ArchitecturalToolsPanel/js/panel.js','utf8'),{document:{getElementById:id=>elements[id]},window});
  return {elements,calls,callbacks,click:id=>{const button=elements[id];if(!button.disabled)button.onclick.call(button)}};
}
test('tool selection and side arrows dispatch object dimensions with correct side',()=>{
  const {elements,calls,click}=panel();
  assert.equal(elements.toolWidth['aria-pressed'],'true');assert.equal(elements.sideLeft.disabled,true);
  click('sideUp');click('create');assert.equal(calls.pop(),'RJWArch.dimension("48","horizontal","0.30","up")');
  click('toolHeight');assert.equal(elements.sideDown.disabled,true);click('sideLeft');click('create');
  assert.equal(calls.pop(),'RJWArch.dimension("48","vertical","0.30","left")');
  assert.equal(elements.toolWidth['aria-pressed'],'false');assert.equal(elements.toolHeight['aria-pressed'],'true');
});
test('two-point aligned mode and chain mode preserve valid placement choices',()=>{
  const {elements,calls,click}=panel();
  click('toolPoints');assert.equal(elements.alignedRow.hidden,false);click('aligned');click('sideUp');click('create');
  assert.equal(calls.pop(),'RJWArch.dimensionPoints("48","aligned-left","0.30")');
  click('toolChain');assert.equal(elements.alignedRow.hidden,true);click('create');
  assert.equal(calls.pop(),'RJWArch.dimensionChain("48","vertical-right","0.30")');
  click('sideDown');click('create');assert.equal(calls.pop(),'RJWArch.dimensionChain("48","horizontal-below","0.30")');
  click('checkSelection');assert.equal(calls.pop(),'RJWArch.selectionSummary("chain","horizontal-below")');
});
test('offset steppers retain decimal precision and do not edit existing art until Apply',()=>{
  const {elements,calls,click}=panel();click('offsetPlus');assert.equal(elements.offset.value,'0.35');
  click('offsetMinus');assert.equal(elements.offset.value,'0.30');assert.equal(calls.length,0);
  elements.offset.value='0.05';click('offsetMinus');assert.equal(elements.offset.value,'0.05');
  click('toolHeight');click('reposition');assert.equal(calls.pop(),'RJWArch.reposition("vertical","0.05")');
  elements.offset.value='bad';click('offsetPlus');assert.match(elements.status.textContent,/positive offset/);
});
test('rectangle, straight-path and saved-scale commands remain available',()=>{
  const {calls,click}=panel();click('rectangle');click('line');click('save');
  assert.deepEqual(calls,['RJWArch.rectangle("48","36","34 1/2")','RJWArch.dimension("48","line","0.30")','RJWArch.saveScale("48")']);
});
test('bridge errors and concurrent operations give feedback without duplicate creation',()=>{
  const {elements,calls,callbacks,click}=panel(true,true);click('create');click('create');
  assert.equal(calls.length,1);callbacks.shift()('Error: Select an object');assert.equal(elements.status.className,'error');
  click('create');assert.equal(calls.length,2);callbacks.shift()('Created');assert.equal(elements.status.className,'');
  const outside=panel(false);outside.click('create');assert.match(outside.elements.status.textContent,/inside Adobe Illustrator/);
});
