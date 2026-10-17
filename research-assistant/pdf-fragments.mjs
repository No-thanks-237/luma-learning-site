import {equationSegments} from './pdf-equations.mjs';
// Original PDF pixels are the source of truth: never infer an equation from damaged text.
export function paragraphRegions(items, paragraphs) {
  const compact=s=>s.replace(/\s/g,'');
  let end=0;
  const ranges=paragraphs.map(p=>{const start=end;end+=compact(p.text).length;return {...p,start,end,items:[]};});
  const source=paragraphs.map(p=>compact(p.text)).join('');let cursor=0;
  for(const [index,item] of items.entries()){
    const text=compact(item.str||'');if(!text)continue;
    const start=source.indexOf(text,cursor);if(start<0)continue;
    const range=ranges.find(p=>start>=p.start&&start<p.end);
    if(range&&!/Authorized licensed use|Downloaded on|Restrictions apply/.test(item.str))range.items.push(index);cursor=start+text.length;
  }
  return ranges;
}

export async function createFragments(pdfjs, record, pageNumber) {
  const task=pdfjs.getDocument({data:new Uint8Array(await record.blob.arrayBuffer()),isEvalSupported:false,
    cMapUrl:new URL('./vendor/pdfjs/cmaps/',import.meta.url).href,cMapPacked:true,
    standardFontDataUrl:new URL('./vendor/pdfjs/standard_fonts/',import.meta.url).href,
    wasmUrl:new URL('./vendor/pdfjs/wasm/',import.meta.url).href});
  try{
    const pdf=await task.promise,page=await pdf.getPage(pageNumber),viewport=page.getViewport({scale:3});
    const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
    const content=await page.getTextContent(),regions=paragraphRegions(content.items,record.document.paragraphs.filter(p=>p.page===pageNumber));
    const bounds=index=>{
      const item=content.items[index],t=pdfjs.Util.transform(viewport.transform,item.transform),height=Math.hypot(t[2],t[3]);
      const style=content.styles[item.fontName],extended=/^[∑⎡⎢⎣⎤⎥⎦]$/.test(item.str);
      const ascent=extended?0:style?.ascent||.85,descent=extended?1.05:Math.abs(style?.descent||.18);
      return {x:t[4],y:t[5]-height*ascent,w:Math.max(2,item.width*viewport.scale),h:height*(ascent+descent)};
    };
    const union=boxes=>({x:Math.min(...boxes.map(b=>b.x)),y:Math.min(...boxes.map(b=>b.y)),right:Math.max(...boxes.map(b=>b.x+b.w)),bottom:Math.max(...boxes.map(b=>b.y+b.h))});
    const groups=[];
    for(const region of regions){
      if(!region.items.length)continue;
      const b=union(region.items.map(bounds));let previous=groups.at(-1);
      // A large equation may have been split at the upper/lower limit of a sum.
      // Merge only adjacent source fragments whose vertical extents overlap in the same column.
      const sameColumn=previous&&((previous.x+previous.right)/2<viewport.width/2)===((b.x+b.right)/2<viewport.width/2);
      if(previous&&sameColumn&&b.y<previous.bottom-2&&b.bottom>previous.y+2){
        previous.ids.push(region.id);previous.items.push(...region.items);
        Object.assign(previous,union([{x:previous.x,y:previous.y,w:previous.right-previous.x,h:previous.bottom-previous.y},{x:b.x,y:b.y,w:b.right-b.x,h:b.bottom-b.y}]));
      }else groups.push({...b,ids:[region.id],items:[...region.items]});
    }
    const formulas=[];
    for(const region of regions){
      const compact=s=>s.replace(/\s/g,'');
      equationSegments(region.text).forEach((segment,index)=>{
        const start=compact(region.text.slice(0,segment.start)).length,end=start+compact(segment.text).length;
        let cursor=0;const selected=[];
        for(const i of region.items){const length=compact(content.items[i].str).length;if(cursor<end&&cursor+length>start)selected.push(i);cursor+=length;}
        if(selected.length)formulas.push({...union(selected.map(bounds)),ids:[region.id],index,items:selected});
      });
    }
    const notices=regions.filter(r=>!r.items.length&&/Authorized licensed use|Downloaded on|Restrictions apply/.test(r.text)).map(r=>({id:r.id,text:r.text}));
    return {canvas,groups,formulas,notices,content,viewport};
  }finally{await task.destroy();}
}

export function placeFragment(data, group, host, selectable=true) {
  const pad=1,x=Math.max(0,Math.floor(group.x-pad)),y=Math.max(0,Math.floor(group.y-pad));
  const width=Math.min(data.canvas.width-x,Math.ceil(group.right+pad-x));
  const height=Math.min(data.canvas.height-y,Math.ceil(group.bottom+pad-y));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  canvas.getContext('2d').drawImage(data.canvas,x,y,width,height,0,0,width,height);
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label','原论文排版，公式和上下标保持原貌');
  const sheet=document.createElement('div');sheet.className='pdf-fragment';sheet.style.width=`calc(${width*.7}px * var(--reader-scale, 1))`;sheet.append(canvas);host.replaceChildren(sheet);
  host.dataset.formulaSource='pdf';
  // Text remains selectable without painting the PDF's broken Unicode glyph mapping.
  if(selectable){
    const layer=document.createElement('div');layer.className='fragment-text-layer';sheet.append(layer);
    for(const index of group.items){
      const item=data.content.items[index],t=item.transform,h=Math.hypot(t[2],t[3])*data.viewport.scale,ascent=data.content.styles[item.fontName]?.ascent||.85;
      const span=document.createElement('span');span.textContent=item.str+' ';
      span.style.cssText=`left:${(t[4]*data.viewport.scale-x)/width*100}%;top:${(data.viewport.height-t[5]*data.viewport.scale-h*ascent-y)/height*100}%;width:${item.width*data.viewport.scale/width*100}%;height:${h/height*100}%;font-size:${h*.7}px;`;
      layer.append(span);
    }
  }
}
