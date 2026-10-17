import {partitionPapers} from './paper-trash.mjs?v=20261017-14';
import {makeLearningDetail} from './learning-detail.mjs?v=20261017-14';
import {createSelectionTranslator} from './selection-translator.mjs?v=20261017-14';
window.YanbanSelectionTranslator=createSelectionTranslator;
import {makeLearningPlan,reviewLearningAnswer} from './learning.mjs?v=20261017-14';
import {createPageTranslator} from './page-translator.mjs';
window.YanbanPageTranslator=createPageTranslator;
import {createFragments,placeFragment} from './pdf-fragments.mjs?v=20261017-14';
import {initCloud} from './cloud.mjs?v=20261017-14';
import {createWorkspace,scopeKey} from './workspace-store.mjs?v=20261017-14';
import {createSettings,savedKeyName} from './key-settings.mjs';
import * as pdfjs from './vendor/pdfjs/build/pdf.mjs';
import {answer,translate,translateSelection,readingCard} from './research.mjs?v=20261017-14';
pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs/build/pdf.worker.mjs',import.meta.url).href;
const realFetch=window.fetch.bind(window), jobs=new Map(), urls=new Map();
const modelSettings=createSettings();
const cloud=await initCloud(realFetch);
window.YANBAN_SCOPE=cloud.scope;window.YanbanCloud=cloud;
// One editing tab per account and origin prevents stale in-memory cards overwriting each other.
if(navigator.locks){
 const acquired=await new Promise(resolve=>{navigator.locks.request('yanban-editor-'+(cloud.scope||'guest'),{ifAvailable:true},lock=>{resolve(Boolean(lock));if(lock)return new Promise(()=>{});}).catch(()=>resolve(true));});
 if(!acquired){document.body.innerHTML='<main style="max-width:560px;margin:15vh auto;padding:32px;font-family:system-ui"><h1>研伴已在另一个标签页打开</h1><p>请回到原标签页继续编辑，或关闭它后刷新本页。这样可以避免两份笔记互相覆盖。</p><button onclick="location.reload()">重新打开</button></main>';throw Error('另一个标签页正在编辑此研究空间');}
}
const workspace=createWorkspace(localStorage,cloud.scope);window.YanbanWorkspace=workspace;
const database=new Promise((resolve,reject)=>{const req=indexedDB.open(scopeKey('yanban-public-papers-v1',cloud.scope),2);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('papers'))req.result.createObjectStore('papers',{keyPath:'id'});if(!req.result.objectStoreNames.contains('metadata'))req.result.createObjectStore('metadata',{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(Error('浏览器未允许本地论文存储，请检查隐私设置。'));req.onblocked=()=>reject(Error('旧页面仍占用论文库，请关闭其他研伴标签页后刷新。'));});
async function db(method,arg,storeName='papers'){const databaseConnection=await database;return new Promise((resolve,reject)=>{const tx=databaseConnection.transaction(storeName,['put','delete'].includes(method)?'readwrite':'readonly'),store=tx.objectStore(storeName),request=arg===undefined?store[method]():store[method](arg);tx.oncomplete=()=>resolve(request.result);tx.onerror=()=>reject(Error('论文保存失败，浏览器存储空间可能不足。'));tx.onabort=()=>reject(Error('论文保存未完成。'));});}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});}
async function documentFor(id){const record=await db('get',id);if(!record)throw Error('当前浏览器中找不到这篇论文，请重新导入。');return record.document;}
function pdfURL(record){if(!urls.has(record.id))urls.set(record.id,URL.createObjectURL(record.blob));return urls.get(record.id);}
function gateway(signal){
 const config=modelSettings.active();
 return async(messages,options={})=>{
  if(!config.api_key)throw Error('请在模型设置中填写你自己的 DeepSeek API Key。');
  if(signal?.aborted)throw Error('请求已取消。');
  let response;
  try{response=await realFetch('https://api.deepseek.com/chat/completions',{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json',Authorization:'Bearer '+config.api_key},body:JSON.stringify({model:config.model,messages,temperature:0.2,max_tokens:options.max_tokens||2500,stream:false,thinking:{type:'disabled'},...(options.tools?{tools:options.tools,tool_choice:'auto'}:{})}),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(120000)]):AbortSignal.timeout(120000)});}catch(error){throw Error(error.name==='TimeoutError'?'模型响应超时，请稍后重试。':'无法连接 DeepSeek，请检查网络或浏览器跨域限制。');}
  if(!response.ok)throw Error(response.status===401||response.status===403?'DeepSeek 拒绝了认证，请检查自己的 API Key。':response.status===429?'DeepSeek 限流或额度不足，请查看账户余额。':'DeepSeek 请求失败（'+response.status+'），请检查型号或稍后重试。');
  const data=await response.json(),choice=data.choices?.[0];
  if(choice?.finish_reason==='length')throw Error('模型输出超过长度上限，请缩小问题后重试。');
  if(!choice?.message||typeof choice.message!=='object')throw Error('模型返回的结果无法识别。');
  const message={role:'assistant',content:typeof choice.message.content==='string'?choice.message.content:''};
  if(Array.isArray(choice.message.tool_calls))message.tool_calls=choice.message.tool_calls;
  return {message,model:data.model||config.model,usage:data.usage||{}};
 };
}
async function parsePDF(file,job){
 let task;
 try{
  if(!(file instanceof Blob)||!file.size||file.size>20*1024*1024)throw Error('请选择 20 MB 以内的 PDF。');
  const buffer=await file.arrayBuffer();if(new TextDecoder().decode(buffer.slice(0,5))!=='%PDF-')throw Error('文件内容不是有效 PDF。');
  task=pdfjs.getDocument({data:new Uint8Array(buffer),isEvalSupported:false,cMapUrl:new URL('./vendor/pdfjs/cmaps/',import.meta.url).href,cMapPacked:true,standardFontDataUrl:new URL('./vendor/pdfjs/standard_fonts/',import.meta.url).href,wasmUrl:new URL('./vendor/pdfjs/wasm/',import.meta.url).href});
  task.onPassword=()=>{task.destroy();job.state='error';job.error='请先移除 PDF 密码保护后重新导入。';};
  const pdf=await task.promise;if(pdf.numPages>100)throw Error('第一版最多支持 100 页。');
  const paragraphs=[],emptyPages=[];let extractedChars=0;
  for(let number=1;number<=pdf.numPages;number++){
   job.message=`正在浏览器内提取第 ${number}/${pdf.numPages} 页文字…`;
   const page=await pdf.getPage(number),content=await page.getTextContent();
   let line='',block='',previousY=null;
   const flush=()=>{if(block.trim()){extractedChars+=block.trim().length;if(extractedChars>1000000)throw Error('PDF 提取文字过多，请拆分后导入。');paragraphs.push({id:'p'+(paragraphs.length+1),page:number,text:block.trim(),kind:'text'});}block='';};
   const addLine=()=>{if(line.trim()){if(block.length+line.length>1600)flush();block+=line.trim()+'\n';line='';}};
   const before=paragraphs.length;
   for(const item of content.items){if(typeof item.str!=='string')continue;const y=item.transform?.[5];if(previousY!==null&&y!==undefined&&Math.abs(previousY-y)>3){addLine();if(Math.abs(previousY-y)>22)flush();}line+=item.str+' ';previousY=y;if(item.hasEOL)addLine();}
   addLine();flush();if(before===paragraphs.length)emptyPages.push(number);page.cleanup();
   await new Promise(r=>setTimeout(r,0));
  }
  if(!paragraphs.length)throw Error('没有提取到文字，可能是扫描件。目前尚不支持扫描页 OCR，请使用带文字层的 PDF。');
  let metadata;try{metadata=await pdf.getMetadata();}catch(_){}
  const id=crypto.randomUUID(),title=typeof metadata?.info?.Title==='string'&&metadata.info.Title.trim()?metadata.info.Title.trim():file.name.replace(/\.pdf$/i,'');
  const document={id,title,filename:file.name,page_count:pdf.numPages,created_at:new Date().toISOString(),parser:'PDF.js 浏览器基础文本提取',warnings:['公开版按 PDF 文字层提取，不等同于 Docling 版面解析；多栏阅读顺序、图表与公式请对照原 PDF。',...(emptyPages.length?['没有提取到文字的页面：'+emptyPages.join('、')]:[])],paragraphs};
  await db('put',{id,document,blob:file});window.dispatchEvent(new Event('yanban-data-change'));job.state='ready';job.document_id=id;job.message='解析完成。论文已保存在本机，登录后会自动同步到云端。';
 }catch(error){job.state='error';job.error=job.error||error.message;job.message=job.error;}
 finally{if(task)await task.destroy().catch(()=>{});}
}
window.fetch=async(input,options={})=>{
 const url=new URL(typeof input==='string'?input:input.url,location.href);
 if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return realFetch(input,options);
 const path=url.pathname,method=(options.method||'GET').toUpperCase();
 try{
  const body=typeof options.body==='string'?JSON.parse(options.body):options.body;
  if(path==='/api/status')return json({service:'yanban',version:'public-0.12',...modelSettings.public(),configured:modelSettings.public().has_api_key,csrf_token:'browser-only',parser:{available:true,default_engine:'pdfjs'},storage:'browser'});
  if(path==='/api/config')return json(method==='POST'?modelSettings.update(body):modelSettings.public());
  if(path==='/api/config/test'){const result=await gateway(options.signal)([{role:'user',content:'只回复 OK'}],{max_tokens:16});return json({ok:true,model:result.model,message:'已通过你的浏览器连接 DeepSeek。'});}
  if(path==='/api/documents'&&method==='GET'){const records=await db('getAll');const documents=records.map(({document:d})=>({id:d.id,title:d.title,filename:d.filename,page_count:d.page_count,paragraph_count:d.paragraphs.length,created_at:d.created_at,parser:d.parser,warnings:d.warnings})).sort((a,b)=>b.created_at.localeCompare(a.created_at));return json(partitionPapers(documents,workspace.all()));}
  if(path==='/api/documents'&&method==='POST'){const id=crypto.randomUUID(),job={id,state:'parsing',message:'正在浏览器中检查 PDF…'};jobs.set(id,job);parsePDF(body.get('file'),job);return json({job_id:id});}
  if(path.startsWith('/api/jobs/')){const job=jobs.get(path.split('/').pop());if(!job)throw Error('解析任务已失效，请重新导入。');return json(job);}
  if(path.startsWith('/api/documents/')){const id=path.split('/')[3],record=await db('get',id);if(!record)throw Error('当前浏览器中找不到该论文。');return path.endsWith('/file')?new Response(record.blob,{headers:{'Content-Type':'application/pdf'}}):json({...record.document,file_url:pdfURL(record)});}
  if(path==='/api/learning-plan')return json(await makeLearningPlan(await documentFor(body.document_id),body.profile,gateway(options.signal)));
  if(path==='/api/learning-detail')return json(await makeLearningDetail(await documentFor(body.document_id),body.profile,body.step,gateway(options.signal)));
  if(path==='/api/learning-review')return json(await reviewLearningAnswer(await documentFor(body.document_id),body.step,body.answer,gateway(options.signal)));
  if(['/api/chat','/api/translate','/api/reading-card'].includes(path)){
   const doc=await documentFor(body.document_id),complete=gateway(options.signal);
   if(path==='/api/chat')return json(await answer(doc,body.question,body.history||[],body.selected_paragraph_ids||[],complete));
   if(path==='/api/translate')return json(body.selection?await translateSelection(doc,body.selection,complete):await translate(doc,body.paragraph_ids,complete));
   return json(await readingCard(doc,complete));
  }
  return json({detail:{code:'not_found',message:'功能接口不存在。'}},404);
 }catch(error){return json({detail:{code:'public_error',message:error instanceof SyntaxError?'模型或请求返回了无效 JSON，请重试。':error.message}},400);}
};
const fragmentCache=new Map();
async function fragmentsFor(id,page){
 const key=id+':'+page;
 if(!fragmentCache.has(key)){
  const promise=db('get',id).then(record=>{if(!record)throw Error('找不到原 PDF');return createFragments(pdfjs,record,page);});
  fragmentCache.set(key,promise);promise.catch(()=>fragmentCache.delete(key));
  if(fragmentCache.size>3)fragmentCache.delete(fragmentCache.keys().next().value);
 }
 return fragmentCache.get(key);
}
window.YanbanPDF={
 async fragments(id,page,root,merge=false){
  const initial=root.querySelector('[data-original-id], [data-pdf-equation]');
  const data=await fragmentsFor(id,page);if(!root.isConnected||!initial?.isConnected)return;
  for(const notice of data.notices){const host=root.querySelector('[data-original-id="'+notice.id+'"]');if(host){host.textContent=notice.text;host.classList.add('pdf-license-notice');host.dataset.formulaSource='notice';}}
  for(const host of root.querySelectorAll('[data-pdf-equation]')){
   const [source,index]=host.dataset.pdfEquation.split(':');const formula=data.formulas.find(f=>f.ids[0]===source&&f.index===Number(index));
   if(formula)placeFragment(data,formula,host,false);
  }
  for(const group of data.groups){
   const hosts=group.ids.map(id=>root.querySelector('[data-original-id="'+id+'"]')).filter(Boolean);
   if(!hosts.length)continue;
   const host=hosts[0];placeFragment(data,group,host);host.dataset.sourceIds=group.ids.join(',');
   if(merge&&hosts.length>1){
    const first=host.closest('.paper-paragraph');first.dataset.sourceIds=group.ids.join(',');
    for(const other of hosts.slice(1)){
     const panel=other.closest('.paper-paragraph');
     const anchor=document.createElement('span');anchor.id=panel.id;anchor.className='paragraph-anchor';first.prepend(anchor);
     const translation=panel.querySelector('.translation');if(translation)first.insertBefore(translation,first.querySelector('.paragraph-controls'));
     panel.remove();
    }
    first.querySelector('.paragraph-source').textContent=group.ids.join(' · ')+' · 第 '+page+' 页';
    const translate=first.querySelector('[data-translate-paragraph]');if(translate){delete translate.dataset.translateParagraph;translate.dataset.translateGroup=group.ids.join(',');translate.textContent='翻译这组原文';}
   }
  }
 },
 async mount(id,page,host,{zoom=1}={}){
  const record=await db('get',id);if(!record)throw Error('找不到原 PDF。');
  const task=pdfjs.getDocument({data:new Uint8Array(await record.blob.arrayBuffer()),isEvalSupported:false,cMapUrl:new URL('./vendor/pdfjs/cmaps/',import.meta.url).href,cMapPacked:true,standardFontDataUrl:new URL('./vendor/pdfjs/standard_fonts/',import.meta.url).href,wasmUrl:new URL('./vendor/pdfjs/wasm/',import.meta.url).href});
  try{
   const pdf=await task.promise,p=await pdf.getPage(page);if(!host.isConnected)return;
   const base=p.getViewport({scale:1}),scale=Math.max(.4,(host.clientWidth||700)/base.width*zoom),viewport=p.getViewport({scale});
   const sheet=document.createElement('div');sheet.className='pdf-sheet';sheet.style.cssText=`width:${viewport.width}px;height:${viewport.height}px;--scale-factor:${scale};--total-scale-factor:${scale};--user-unit:1;`;
   const canvas=document.createElement('canvas'),layer=document.createElement('div');layer.className='textLayer';sheet.append(canvas,layer);host.replaceChildren(sheet);
   const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.floor(viewport.width*ratio);canvas.height=Math.floor(viewport.height*ratio);canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
   await p.render({canvasContext:canvas.getContext('2d'),viewport,transform:ratio!==1?[ratio,0,0,ratio,0,0]:null}).promise;
   const content=await p.getTextContent(),textLayer=new pdfjs.TextLayer({textContentSource:content,container:layer,viewport});await textLayer.render();
   const compact=s=>s.replace(/\s+/g,''),paragraphs=record.document.paragraphs.filter(p=>p.page===page);let position=0;
   const boundaries=paragraphs.map(p=>{const start=position;position+=compact(p.text).length;return {id:p.id,start,end:position};});
   const source=paragraphs.map(p=>compact(p.text)).join('');position=0;
   for(const div of textLayer.textDivs){const text=compact(div.textContent);if(!text)continue;const start=source.indexOf(text,position);if(start<0)continue;const item=boundaries.find(b=>start>=b.start&&start<b.end);if(item)div.dataset.pdfParagraph=item.id;position=start+text.length;}
  }finally{await task.destroy();}
 },
 async render(id,page,canvas){
  const record=await db('get',id);if(!record)throw Error('找不到原 PDF。');
  const task=pdfjs.getDocument({data:new Uint8Array(await record.blob.arrayBuffer()),isEvalSupported:false,cMapUrl:new URL('./vendor/pdfjs/cmaps/',import.meta.url).href,cMapPacked:true,standardFontDataUrl:new URL('./vendor/pdfjs/standard_fonts/',import.meta.url).href,wasmUrl:new URL('./vendor/pdfjs/wasm/',import.meta.url).href});
  try{const pdf=await task.promise,p=await pdf.getPage(page),base=p.getViewport({scale:1}),scale=Math.min(2,1600/base.width),viewport=p.getViewport({scale});canvas.width=viewport.width;canvas.height=viewport.height;await p.render({canvasContext:canvas.getContext('2d'),viewport}).promise;}finally{await task.destroy();}
 }
};
window.YANBAN_PUBLIC=true;
let cacheWrites=Promise.resolve();
window.YanbanTranslations={
 async load(id){const r=await db('get','translations-v1:'+id,'metadata');return new Map(Object.entries(r?.values||{}).filter(([key,value])=>/^p\d+$/.test(key)&&typeof value==='string'));},
 save(id,key,text){const write=cacheWrites.catch(()=>{}).then(async()=>{const cacheId='translations-v1:'+id;const old=await db('get',cacheId,'metadata');await db('put',{id:cacheId,values:{...old?.values,[key]:text}},'metadata');});cacheWrites=write;return write;}
};
window.YanbanRepository={learningAll:async()=>(await db('getAll',undefined,'metadata')).filter(r=>r.id.startsWith('learning-v1:')),putLearning:(id,value)=>db('put',{id:'learning-v1:'+id,value},'metadata'),all:()=>db('getAll'),put:r=>db('put',r),readSyncBase:async()=>(await db('get','sync-base','metadata'))?.entries,saveSyncBase:entries=>db('put',{id:'sync-base',entries},'metadata'),saveConflictBackup:backup=>db('put',{id:'conflict-backup',...backup},'metadata')};
window.YanbanLearningStore={async load(id){return (await db('get','learning-v1:'+id,'metadata'))?.value||null;},async save(id,value){await db('put',{id:'learning-v1:'+id,value},'metadata');window.dispatchEvent(new Event('yanban-data-change'));}};
await import('./learning-ui.mjs?v=20261017-14');
await import('./app.js?v=20261017-14');
await import('./workspace-ui.mjs?v=20261017-14');

document.querySelector('#forget-public-key').addEventListener('click',()=>{
 const message=document.querySelector('#settings-result');
 try{modelSettings.clear();document.querySelector('#model-key').value='';document.querySelector('#model-remember').checked=false;document.querySelector('[data-action=refresh-connection]').click();message.textContent='Key 已清除，当前页面与本浏览器保存的副本均已删除。';message.classList.remove('error');}
 catch(error){message.textContent=error.message;message.classList.add('error');}
 message.hidden=false;
});
window.addEventListener('storage',event=>{if(event.key===savedKeyName||event.key===null){modelSettings.sync();document.querySelector('[data-action=refresh-connection]').click();}});

await window.YanbanApp.ready;
await import('./auto-sync-ui.mjs?v=20261017-14');
