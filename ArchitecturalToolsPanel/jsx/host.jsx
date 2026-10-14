#target illustrator
var RJWArch = RJWArch || {};
(function(){
  function doc(){if(app.documents.length===0)throw Error('Open an Illustrator document first.');return app.activeDocument;}
  function parseInches(value){var s=String(value).replace(/^\s+|\s+$/g,'').replace(/,/g,'').replace(/in(ch(es)?)?|["“”]/gi,'').replace(/\s+/g,' ');if(!s)throw Error('Enter a dimension.');var parts=s.split(' '),total=0;for(var i=0;i<parts.length;i++){var p=parts[i],m=p.match(/^([+-]?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);if(m){var den=Number(m[2]);if(!den)throw Error('Invalid fraction.');total+=Number(m[1])/den;}else{var n=Number(p);if(!isFinite(n))throw Error('Invalid dimension: '+value);total+=n;}}if(!(total>0))throw Error('Dimensions must be positive.');return total;}
  function scaleVal(s){var n=Number(s);if([96,48,24,16,12].join(',').indexOf(String(n))<0 || (n!==96&&n!==48&&n!==24&&n!==16&&n!==12))throw Error('Invalid scale.');return n;}
  function layer(d){var l;try{l=d.layers.getByName('RJW Architectural Dimensions');}catch(e){l=d.layers.add();l.name='RJW Architectural Dimensions';}if(l.locked)throw Error('Unlock the RJW Architectural Dimensions layer.');return l;}
  function color(){var c=new RGBColor();c.red=35;c.green=35;c.blue=35;return c;}
  function strokeLine(group,x1,y1,x2,y2,weight){var p=group.pathItems.add();p.setEntirePath([[x1,y1],[x2,y2]]);p.filled=false;p.stroked=true;p.strokeColor=color();p.strokeWidth=weight;return p;}
  function txt(group,s,x,y){var t=group.textFrames.add();t.contents=s;t.textRange.characterAttributes.size=10;t.textRange.characterAttributes.fillColor=color();t.position=[x,y];return t;}
  function formatInches(inches){var rounded=Math.round(inches*16)/16;var whole=Math.floor(rounded+1e-7),num=Math.round((rounded-whole)*16);if(num===16){whole++;num=0;}if(!num)return whole+'"';function gcd(a,b){return b?gcd(b,a%b):a;}var g=gcd(num,16);return (whole?whole+' ':'')+(num/g)+'/'+(16/g)+'"';}
  function save(d,s){try{var tag=d.tags.getByName('RJW_ARCH_SCALE');tag.value=String(s);}catch(e){try{var t=d.tags.add();t.name='RJW_ARCH_SCALE';t.value=String(s);}catch(ignored){/* scale supplied from panel remains authoritative */}}}
  RJWArch.saveScale=function(s){try{var d=doc();s=scaleVal(s);save(d,s);return 'Scale set to 1:'+s+'. (Panel scale controls generated artwork.)';}catch(e){return 'Error: '+e.message;}};
  RJWArch.rectangle=function(s,w,h){try{var d=doc();s=scaleVal(s);w=parseInches(w);h=parseInches(h);var aw=w*72/s,ah=h*72/s;var ab=d.artboards[d.artboards.getActiveArtboardIndex()].artboardRect;var x=ab[0]+36,y=ab[1]-36;var r=d.pathItems.rectangle(y,x,aw,ah);r.filled=false;r.stroked=true;r.strokeWidth=0.75;r.strokeColor=color();d.selection=null;r.selected=true;save(d,s);return 'Created '+formatInches(w)+' × '+formatInches(h)+' at 1:'+s+'.';}catch(e){return 'Error: '+e.message;}};
  RJWArch.dimension=function(s,mode,offset){try{var d=doc();s=scaleVal(s);var off=parseInches(offset)*72;if(!d.selection||d.selection.length!==1)throw Error('Select exactly one object or straight line.');var obj=d.selection[0],bounds=obj.visibleBounds;var l=bounds[0],t=bounds[1],r=bounds[2],b=bounds[3];var x1,y1,x2,y2,axis;
    if(mode==='horizontal'){x1=l;y1=b;x2=r;y2=b;axis='h';}else if(mode==='vertical'){x1=r;y1=b;x2=r;y2=t;axis='v';}else if(mode==='line'){if(obj.typename!=='PathItem'||obj.pathPoints.length!==2||obj.closed)throw Error('Select a single open straight path with two anchors.');var a=obj.pathPoints[0],z=obj.pathPoints[1];if(Math.abs(a.leftDirection[0]-a.anchor[0])>0.01||Math.abs(a.leftDirection[1]-a.anchor[1])>0.01||Math.abs(z.rightDirection[0]-z.anchor[0])>0.01||Math.abs(z.rightDirection[1]-z.anchor[1])>0.01)throw Error('Curved paths are not supported.');x1=a.anchor[0];y1=a.anchor[1];x2=z.anchor[0];y2=z.anchor[1];axis='line';}else throw Error('Unknown dimension mode.');
    var dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);if(len<0.01)throw Error('Selected geometry has zero length.');var ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
    if(axis==='h'){nx=0;ny=1;}if(axis==='v'){nx=1;ny=0;}if(axis==='line' && ny<0){nx=-nx;ny=-ny;}
    var a1x=x1+nx*off,a1y=y1+ny*off,a2x=x2+nx*off,a2y=y2+ny*off;
    var group=layer(d).groupItems.add();group.name='Dimension '+formatInches(len*s/72);var over=6,tick=8,gap=3;
    strokeLine(group,a1x-ux*over,a1y-uy*over,a2x+ux*over,a2y+uy*over,0.5);
    strokeLine(group,x1-nx*gap,y1-ny*gap,a1x+nx*over,a1y+ny*over,0.5);
    strokeLine(group,x2-nx*gap,y2-ny*gap,a2x+nx*over,a2y+ny*over,0.5);
    for(var i=0;i<2;i++){var px=i?a2x:a1x,py=i?a2y:a1y;strokeLine(group,px-ux*tick/2-nx*tick/2,py-uy*tick/2-ny*tick/2,px+ux*tick/2+nx*tick/2,py+uy*tick/2+ny*tick/2,1.0);}
    var label=formatInches(len*s/72),tx=(a1x+a2x)/2,ty=(a1y+a2y)/2;var textItem=txt(group,label,tx,ty+12);try{textItem.left=tx-textItem.width/2;}catch(ignore){}d.selection=null;group.selected=true;save(d,s);return 'Dimensioned '+label+' at 1:'+s+'.';
  }catch(e){return 'Error: '+e.message;}};
})();
