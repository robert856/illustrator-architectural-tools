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
  function drawDimension(parent,s,mode,p1,p2,q1,q2,nx,ny,gap){
    var group=parent.groupItems.add();
    try{
      group.note=dimensionNote;setTag(group,'RJW_ARCH_MODE',mode);setTag(group,'RJW_ARCH_SCALE',s);
      var dx=q2[0]-q1[0],dy=q2[1]-q1[1],len=Math.sqrt(dx*dx+dy*dy),ux=dx/len,uy=dy/len;
      var label=formatInches(len*s/72);group.name='Dimension '+label;
      var over=6,tick=8;
      strokeLine(group,q1[0]-ux*over,q1[1]-uy*over,q2[0]+ux*over,q2[1]+uy*over,0.625);
      strokeLine(group,p1[0]+nx*gap,p1[1]+ny*gap,q1[0]+nx*over,q1[1]+ny*over,0.625);
      strokeLine(group,p2[0]+nx*gap,p2[1]+ny*gap,q2[0]+nx*over,q2[1]+ny*over,0.625);
      for(var i=0;i<2;i++){
        var q=i?q2:q1;
        strokeLine(group,q[0]-ux*tick/2-nx*tick/2,q[1]-uy*tick/2-ny*tick/2,q[0]+ux*tick/2+nx*tick/2,q[1]+uy*tick/2+ny*tick/2,1.25);
      }
      var tx=(q1[0]+q2[0])/2,ty=(q1[1]+q2[1])/2;
      var textItem=txt(group,label,tx,ty);labelBackground(group,textItem,tx,ty);
      return group;
    }catch(e){group.remove();throw e;}
  }
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
    var group=drawDimension(obj.parent,s,mode,[x1,y1],[x2,y2],[a1x,a1y],[a2x,a2y],nx,ny,gap);
    var label=formatInches(len*s/72),assembly=attachDimension(obj,group);if(previous)previous.remove();d.selection=null;assembly.selected=true;save(d,s);return 'Dimensioned '+label+' at 1:'+s+'. Move the group with the Selection tool (V).';
  }catch(e){if(group){try{group.remove();}catch(ignored){}}return 'Error: '+e.message;}}
  RJWArch.dimension=function(s,mode,offset){return dimension(s,mode,offset,null);};
  var referenceNote='RJW_ARCH_POINT_REFERENCE_V1';
  function selectedAnchors(d,chain){
    var points=[],seen=[];
    function visit(item){
      if(item.note===dimensionNote)return;
      for(var k=0;k<seen.length;k++)if(seen[k]===item)return;
      seen.push(item);
      if(item.typename==='PathItem'){
        for(var i=0;i<item.pathPoints.length;i++){
          var point=item.pathPoints[i];
          if(point.selected===PathPointSelection.ANCHORPOINT){
            var a=point.anchor,clearance=item.stroked?item.strokeWidth/2:0;
            points.push({point:[a[0],a[1]],clearance:clearance});
          }
        }
      }else if(item.typename==='GroupItem' || item.typename==='CompoundPathItem'){
        var children=item.typename==='GroupItem'?item.pageItems:item.pathItems;
        for(var j=0;j<children.length;j++)visit(children[j]);
      }
    }
    if(d.selection)for(var i=0;i<d.selection.length;i++)visit(d.selection[i]);
    if((!chain && points.length!==2) || (chain && points.length<3))throw Error('Use Direct Selection (A) to select '+(chain?'at least three':'exactly two')+' anchors. Shift-click anchors on the same or different objects.');
    return points;
  }
  function pointDimension(s,placement,offset,points,parent,previous,returnGroup){
    var group;
    try{
      s=scaleVal(s);var off=parseInches(offset)*72;
      var p1=points[0].point,p2=points[1].point,nx,ny,q1,q2;
      var gap=3+Math.max(points[0].clearance,points[1].clearance);
      if(off<=gap)throw Error('Increase the dimension offset to leave a 3 pt gap outside the object stroke.');
      if(placement==='horizontal-below' || placement==='horizontal-above'){
        if(p1[0]>p2[0]){var swap=p1;p1=p2;p2=swap;}
        nx=0;ny=placement==='horizontal-below'?-1:1;
        var y=(ny<0?Math.min(p1[1],p2[1]):Math.max(p1[1],p2[1]))+ny*off;
        q1=[p1[0],y];q2=[p2[0],y];
      }else if(placement==='vertical-right' || placement==='vertical-left'){
        if(p1[1]>p2[1]){var swap=p1;p1=p2;p2=swap;}
        nx=placement==='vertical-right'?1:-1;ny=0;
        var x=(nx>0?Math.max(p1[0],p2[0]):Math.min(p1[0],p2[0]))+nx*off;
        q1=[x,p1[1]];q2=[x,p2[1]];
      }else if(placement==='aligned-left' || placement==='aligned-right'){
        // Canonical direction makes side independent of selection order.
        if(p1[0]>p2[0] || (p1[0]===p2[0] && p1[1]>p2[1])){var swap=p1;p1=p2;p2=swap;}
        var dx=p2[0]-p1[0],dy=p2[1]-p1[1],len=Math.sqrt(dx*dx+dy*dy);
        if(len<0.01)throw Error('The two points must be distinct.');
        var side=placement==='aligned-left'?1:-1;nx=-dy/len*side;ny=dx/len*side;
        q1=[p1[0]+nx*off,p1[1]+ny*off];q2=[p2[0]+nx*off,p2[1]+ny*off];
      }else throw Error('Choose a valid point dimension placement.');
      var dx=q2[0]-q1[0],dy=q2[1]-q1[1],len=Math.sqrt(dx*dx+dy*dy);
      if(len<0.01)throw Error('The selected points have zero distance in this direction. Choose another direction.');
      group=drawDimension(parent,s,'points',p1,p2,q1,q2,nx,ny,gap);
      setTag(group,'RJW_ARCH_PLACEMENT',placement);setTag(group,'RJW_ARCH_CLEARANCE',gap-3);
      // A nonprinting reference path follows native group transforms and survives save/reopen.
      var reference=group.pathItems.add();reference.setEntirePath([p1,p2]);reference.filled=false;reference.stroked=false;reference.note=referenceNote;reference.name='Dimension reference points (no stroke)';
      if(previous)previous.remove();
      var d=doc();d.selection=null;group.selected=true;save(d,s);
      if(returnGroup)return group;
      return 'Point dimension '+formatInches(len*s/72)+'. Separate annotation; source objects were not grouped or moved.';
    }catch(e){if(group){try{group.remove();}catch(ignored){}}return 'Error: '+e.message;}
  }
  RJWArch.dimensionPoints=function(s,placement,offset){try{
    var d=doc(),points=selectedAnchors(d);
    return pointDimension(s,placement,offset,points,d.activeLayer,null);
  }catch(e){return 'Error: '+e.message;}};
  RJWArch.dimensionChain=function(s,placement,offset){
    var chain;
    try{
      var d=doc(),points=selectedAnchors(d,true);s=scaleVal(s);var off=parseInches(offset)*72;
      var vertical=placement==='vertical-right' || placement==='vertical-left';
      var horizontal=placement==='horizontal-above' || placement==='horizontal-below';
      if(!vertical && !horizontal)throw Error('For a chain choose Vertical right/left or Horizontal above/below.');
      var axis=vertical?1:0,normalAxis=vertical?0:1;
      var sign=(placement==='vertical-right' || placement==='horizontal-above')?1:-1;
      points.sort(function(a,b){return a.point[axis]-b.point[axis];});
      var edge=points[0].point[normalAxis],clearance=0;
      for(var i=0;i<points.length;i++){
        edge=sign>0?Math.max(edge,points[i].point[normalAxis]):Math.min(edge,points[i].point[normalAxis]);
        clearance=Math.max(clearance,points[i].clearance);
        if(i && points[i].point[axis]-points[i-1].point[axis]<0.01)throw Error('Each chain anchor must have a different height (vertical) or width position (horizontal).');
      }
      if(off<=3+clearance)throw Error('Increase the dimension offset to leave a 3 pt gap outside the object stroke.');
      chain=d.activeLayer.groupItems.add();chain.name='Chain dimensions';
      for(var i=0;i<points.length-1;i++){
        var a=points[i],b=points[i+1];
        var localEdge=sign>0?Math.max(a.point[normalAxis],b.point[normalAxis]):Math.min(a.point[normalAxis],b.point[normalAxis]);
        var effectiveOffset=(off+sign*(edge-localEdge))/72;
        var result=pointDimension(s,placement,String(effectiveOffset),[a,b],chain,null,true);
        if(typeof result==='string')throw Error(result.replace(/^Error: /,''));
      }
      d.selection=null;chain.selected=true;
      return 'Created '+(points.length-1)+' aligned chain dimensions. Separate annotations; source objects were not moved.';
    }catch(e){if(chain){try{chain.remove();}catch(ignored){}}return 'Error: '+e.message;}
  };
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
    if(savedMode==='points'){
      var reference=null;
      for(var i=0;i<target.pageItems.length;i++)if(target.pageItems[i].parent===target && target.pageItems[i].note===referenceNote)reference=target.pageItems[i];
      if(!reference || reference.pathPoints.length!==2)throw Error('The point dimension reference is missing. Recreate this dimension.');
      var clearance=Number(getTag(target,'RJW_ARCH_CLEARANCE'));
      if(!isFinite(clearance) || clearance<0)throw Error('Invalid point dimension metadata. Recreate this dimension.');
      return pointDimension(savedScale,getTag(target,'RJW_ARCH_PLACEMENT'),offset,[{point:reference.pathPoints[0].anchor,clearance:clearance},{point:reference.pathPoints[1].anchor,clearance:clearance}],target.parent,target);
    }
    if(!savedMode || !savedScale || !isAssembly(target.parent))throw Error('Recreate this dimension with the updated panel first.');
    return dimension(savedScale,savedMode,offset,target);
  }catch(e){return 'Error: '+e.message;}};
})();
