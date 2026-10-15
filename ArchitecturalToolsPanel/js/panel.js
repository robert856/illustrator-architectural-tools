(function(){
  'use strict';
  function el(id){return document.getElementById(id);}
  var mode='width',side='down',aligned=false,busy=false;
  var toolIds={width:'toolWidth',height:'toolHeight',points:'toolPoints',chain:'toolChain'};
  var sideIds={left:'sideLeft',right:'sideRight',up:'sideUp',down:'sideDown'};
  var hints={width:'Select one object or dimensioned group.',height:'Select one object or dimensioned group.',points:'A + Shift-click two anchors, on the same or different objects.',chain:'A + Shift-click height or width breakpoints. Shared levels count once.'};
  function quoted(s){return '"'+String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r/g,'').replace(/\n/g,'')+'"';}
  function call(fn,args,outputId){
    var output=el(outputId||'status');
    if(busy)return;
    if(!window.__adobe_cep__){output.textContent='Open this panel inside Adobe Illustrator.';return;}
    busy=true;output.textContent='Working…';
    window.__adobe_cep__.evalScript('RJWArch.'+fn+'('+args.map(quoted).join(',')+')',function(result){
      busy=false;output.textContent=result||'No response from Illustrator.';
      if(!outputId)output.className=result && (result.indexOf('Error:')===0 || result==='EvalScript error.')?'error':'';
    });
  }
  function placement(){
    if(mode==='points' && aligned)return side==='up'||side==='left'?'aligned-left':'aligned-right';
    return {left:'vertical-left',right:'vertical-right',up:'horizontal-above',down:'horizontal-below'}[side];
  }
  function render(){
    Object.keys(toolIds).forEach(function(key){el(toolIds[key]).setAttribute('aria-pressed',String(mode===key));});
    Object.keys(sideIds).forEach(function(key){
      var button=el(sideIds[key]);
      button.disabled=(mode==='width' && (key==='left'||key==='right')) || (mode==='height' && (key==='up'||key==='down'));
      button.setAttribute('aria-pressed',String(side===key));
    });
    el('alignedRow').hidden=mode!=='points';el('aligned').setAttribute('aria-pressed',String(aligned));
    el('hint').textContent=hints[mode];el('selectionStatus').textContent='Check selection';
  }
  Object.keys(toolIds).forEach(function(key){el(toolIds[key]).onclick=function(){
    mode=key;
    if(mode==='width' && side!=='up' && side!=='down')side='down';
    if(mode==='height' && side!=='left' && side!=='right')side='right';
    if(mode==='chain')side='right';
    render();
  };});
  Object.keys(sideIds).forEach(function(key){el(sideIds[key]).onclick=function(){if(this.disabled)return;side=key;render();};});
  el('aligned').onclick=function(){aligned=!aligned;render();};
  function step(delta){
    var value=Number(el('offset').value);
    if(!isFinite(value)||value<=0){el('status').textContent='Enter a positive offset in inches.';return;}
    el('offset').value=Math.max(0.05,Math.round((value+delta)*100)/100).toFixed(2);
  }
  el('offsetMinus').onclick=function(){step(-0.05);};
  el('offsetPlus').onclick=function(){step(0.05);};
  el('create').onclick=function(){
    var scale=el('scale').value,offset=el('offset').value;
    if(mode==='points')call('dimensionPoints',[scale,placement(),offset]);
    else if(mode==='chain')call('dimensionChain',[scale,placement(),offset]);
    else call('dimension',[scale,mode==='width'?'horizontal':'vertical',offset,side]);
  };
  el('checkSelection').onclick=function(){call('selectionSummary',[mode,placement()],'selectionStatus');};
  el('save').onclick=function(){call('saveScale',[el('scale').value]);};
  el('rectangle').onclick=function(){call('rectangle',[el('scale').value,el('width').value,el('height').value]);};
  el('line').onclick=function(){call('dimension',[el('scale').value,'line',el('offset').value]);};
  el('reposition').onclick=function(){call('reposition',[mode==='height'?'vertical':'horizontal',el('offset').value]);};
  render();
})();
