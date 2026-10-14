#target illustrator
var RJWArch = RJWArch || {};
(function(){
  function doc(){if(app.documents.length===0)throw Error('Open an Illustrator document first.');return app.activeDocument;}
  function parseInches(value){var s=String(value).replace(/^\s+|\s+$/g,'').replace(/,/g,'').replace(/in(ch(es)?)?|["“”]/gi,'').replace(/\s+/g,' ');if(!s)throw Error('Enter a dimension.');var parts=s.split(' '),total=0;for(var i=0;i<parts.length;i++){var p=parts[i],m=p.match(/^([+-]?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);if(m){var den=Number(m[2]);if(!den)throw Error('Invalid fraction.');total+=Number(m[1])/den;}else{var n=Number(p);if(!isFinite(n))throw Error('Invalid dimension: '+value);total+=n;}}if(!(total>0))throw Error('Dimensions must be positive.');return total;}
  function scaleVal(s){var n=Number(s);if([96,48,24,16,12].join(',').indexOf(String(n))<0 || (n!==96&&n!==48&&n!==24&&n!==16&&n!==12))throw Error('Invalid scale.');return n;}
  var assemblyNote='RJW_ARCH_ASSEMBLY_V1',dimensionNote='RJW_ARCH_DIMENSION_V1';
  function isAssembly(item){return item.typename==='GroupItem' && item.note===assemblyNote;}
  function sourceOf(item){
    if(!isAssembly(item))return item;
    var source=null;
    for(var i=0;i<item.pageItems.length;i++){
      var child=item.pageItems[i];
      if(child.parent!==item || child.note===dimensionNote)continue;
      if(source)throw Error('This dimension group contains extra artwork. Select the source object directly.');
      source=child;
    }
    if(!source)throw Error('The source artwork is missing from this dimension group.');
    return source;
  }
  function attachDimension(obj,group){
    var assembly=obj.parent;
    if(isAssembly(assembly)){
      group.move(assembly,ElementPlacement.PLACEATBEGINNING);
      return assembly;
    }
    assembly=obj.parent.groupItems.add();
    assembly.name='Dimensioned artwork';assembly.note=assemblyNote;
    try{
      // Replace the source at its existing stacking position and on its own layer.
      assembly.move(obj,ElementPlacement.PLACEBEFORE);
      obj.move(assembly,ElementPlacement.PLACEATEND);
      group.move(assembly,ElementPlacement.PLACEATBEGINNING);
    }catch(e){
      if(obj.parent===assembly)obj.move(assembly,ElementPlacement.PLACEBEFORE);
      assembly.remove();throw e;
    }
    return assembly;
  }
  function setTag(item,name,value){var tag=item.tags.add();tag.name=name;tag.value=String(value);}
  function getTag(item,name){try{return item.tags.getByName(name).value;}catch(e){return '';}}
  function labelBackground(group,textItem,x,y){
    var bounds=textItem.geometricBounds;
    textItem.translate(x-(bounds[0]+bounds[2])/2,y-(bounds[1]+bounds[3])/2);
    bounds=textItem.geometricBounds;
    var pad=3,background=group.pathItems.rectangle(bounds[1]+pad,bounds[0]-pad,bounds[2]-bounds[0]+2*pad,bounds[1]-bounds[3]+2*pad);
    var white=new RGBColor();white.red=255;white.green=255;white.blue=255;
    background.name='Dimension label background';background.filled=true;background.stroked=false;background.fillColor=white;background.fillOverprint=false;
    textItem.zOrder(ZOrderMethod.BRINGTOFRONT);
  }
  function color(){var c=new RGBColor();c.red=35;c.green=35;c.blue=35;return c;}
  function strokeLine(group,x1,y1,x2,y2,weight){var p=group.pathItems.add();p.setEntirePath([[x1,y1],[x2,y2]]);p.filled=false;p.stroked=true;p.strokeColor=color();p.strokeWidth=weight;return p;}
  function txt(group,s,x,y){var t=group.textFrames.add();t.contents=s;t.textRange.characterAttributes.size=10;t.textRange.characterAttributes.fillColor=color();t.position=[x,y];return t;}
  function formatInches(inches){var rounded=Math.round(inches*16)/16;var whole=Math.floor(rounded+1e-7),num=Math.round((rounded-whole)*16);if(num===16){whole++;num=0;}if(!num)return whole+'"';function gcd(a,b){return b?gcd(b,a%b):a;}var g=gcd(num,16);return (whole?whole+' ':'')+(num/g)+'/'+(16/g)+'"';}
  function save(d,s){try{var tag=d.tags.getByName('RJW_ARCH_SCALE');tag.value=String(s);}catch(e){try{var t=d.tags.add();t.name='RJW_ARCH_SCALE';t.value=String(s);}catch(ignored){/* scale supplied from panel remains authoritative */}}}
  RJWArch.saveScale=function(s){try{var d=doc();s=scaleVal(s);save(d,s);return 'Scale set to 1:'+s+'. (Panel scale controls generated artwork.)';}catch(e){return 'Error: '+e.message;}};
  RJWArch.rectangle=function(s,w,h){try{var d=doc();s=scaleVal(s);w=parseInches(w);h=parseInches(h);var aw=w*72/s,ah=h*72/s;var ab=d.artboards[d.artboards.getActiveArtboardIndex()].artboardRect;var x=ab[0]+36,y=ab[1]-36;var r=d.pathItems.rectangle(y,x,aw,ah);r.filled=false;r.stroked=true;r.strokeWidth=0.75;r.strokeColor=color();d.selection=null;r.selected=true;save(d,s);return 'Created '+formatInches(w)+' × '+formatInches(h)+' at 1:'+s+'.';}catch(e){return 'Error: '+e.message;}};
  function dimension(s,mode,offset,previous){try{var d=doc();s=scaleVal(s);var off=parseInches(offset)*72;if(!d.selection||d.selection.length!==1)throw Error('Select exactly one object or straight line.');var obj=sourceOf(previous?previous.parent:d.selection[0]),bounds=obj.geometricBounds;var l=bounds[0],t=bounds[1],r=bounds[2],b=bounds[3];var x1,y1,x2,y2,axis;
    if(mode==='horizontal'){x1=l;y1=b;x2=r;y2=b;axis='h';}else if(mode==='vertical'){x1=r;y1=b;x2=r;y2=t;axis='v';}else if(mode==='line'){if(obj.typename!=='PathItem'||obj.pathPoints.length!==2||obj.closed)throw Error('Select a single open straight path with two anchors.');var a=obj.pathPoints[0],z=obj.pathPoints[1];if(Math.abs(a.leftDirection[0]-a.anchor[0])>0.01||Math.abs(a.leftDirection[1]-a.anchor[1])>0.01||Math.abs(z.rightDirection[0]-z.anchor[0])>0.01||Math.abs(z.rightDirection[1]-z.anchor[1])>0.01)throw Error('Curved paths are not supported.');x1=a.anchor[0];y1=a.anchor[1];x2=z.anchor[0];y2=z.anchor[1];axis='line';}else throw Error('Unknown dimension mode.');
    var dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);if(len<0.01)throw Error('Selected geometry has zero length.');var ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
    if(axis==='h'){nx=0;ny=-1;}if(axis==='v'){nx=1;ny=0;}if(axis==='line' && ny<0){nx=-nx;ny=-ny;}
    // Measure paths without stroke, but leave the extension-line gap beyond the ink.
    var visible=obj.visibleBounds,clearance=0;
    if(axis==='h')clearance=Math.max(0,b-visible[3]);
    else if(axis==='v')clearance=Math.max(0,visible[2]-r);
    else if(obj.stroked)clearance=obj.strokeWidth/2;
    var gap=3+clearance;
    if(off<=gap)throw Error('Increase the dimension offset to leave a 3 pt gap outside the object stroke.');
    var a1x=x1+nx*off,a1y=y1+ny*off,a2x=x2+nx*off,a2y=y2+ny*off;
    var group=obj.parent.groupItems.add();group.note=dimensionNote;setTag(group,'RJW_ARCH_MODE',mode);setTag(group,'RJW_ARCH_SCALE',s);group.name='Dimension '+formatInches(len*s/72);var over=6,tick=8;
    strokeLine(group,a1x-ux*over,a1y-uy*over,a2x+ux*over,a2y+uy*over,0.75);
    strokeLine(group,x1+nx*gap,y1+ny*gap,a1x+nx*over,a1y+ny*over,0.75);
    strokeLine(group,x2+nx*gap,y2+ny*gap,a2x+nx*over,a2y+ny*over,0.75);
    for(var i=0;i<2;i++){var px=i?a2x:a1x,py=i?a2y:a1y;strokeLine(group,px-ux*tick/2-nx*tick/2,py-uy*tick/2-ny*tick/2,px+ux*tick/2+nx*tick/2,py+uy*tick/2+ny*tick/2,1.25);}
    var label=formatInches(len*s/72),tx=(a1x+a2x)/2,ty=(a1y+a2y)/2;var textItem=txt(group,label,tx,ty);labelBackground(group,textItem,tx,ty);var assembly=attachDimension(obj,group);if(previous)previous.remove();d.selection=null;assembly.selected=true;save(d,s);return 'Dimensioned '+label+' at 1:'+s+'. Move the group with the Selection tool (V).';
  }catch(e){if(group){try{group.remove();}catch(ignored){}}return 'Error: '+e.message;}}
  RJWArch.dimension=function(s,mode,offset){return dimension(s,mode,offset,null);};
  RJWArch.reposition=function(mode,offset){try{
    var d=doc();parseInches(offset);
    if(!d.selection || d.selection.length!==1)throw Error('Select one dimensioned group or one dimension inside it.');
    var selected=d.selection[0],target=null,item=selected;
    while(item && item.typename!=='Layer' && item.typename!=='Document'){
      if(item.note===dimensionNote){target=item;break;}item=item.parent;
    }
    if(!target){
      var assembly=isAssembly(selected)?selected:selected.parent;
      if(!assembly || !isAssembly(assembly))throw Error('Select a dimensioned group first.');
      for(var i=0;i<assembly.pageItems.length;i++){
        var child=assembly.pageItems[i];
        if(child.parent===assembly && child.note===dimensionNote && getTag(child,'RJW_ARCH_MODE')===mode){
          if(target)throw Error('More than one matching dimension. Select the desired dimension inside the group.');target=child;
        }
      }
    }
    if(!target)throw Error('No matching dimension found. Recreate dimensions made with an older panel version.');
    var savedMode=getTag(target,'RJW_ARCH_MODE'),savedScale=getTag(target,'RJW_ARCH_SCALE');
    if(!savedMode || !savedScale || !isAssembly(target.parent))throw Error('Recreate this dimension with the updated panel first.');
    return dimension(savedScale,savedMode,offset,target);
  }catch(e){return 'Error: '+e.message;}};
})();
