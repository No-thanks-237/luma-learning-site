// A bounded, cancellable queue. Completed paragraphs are reusable; failures require retry.
export function createPageTranslator({translate,save,onChange=()=>{},concurrency=2}){
 let current=null;
 const snapshot=()=>current?{status:current.status,total:current.items.length,done:current.items.filter(p=>current.values.has(p.id)).length,errors:new Map(current.errors),busy:new Set(current.busy)}:{status:'idle',total:0,done:0,errors:new Map(),busy:new Set()};
 const emit=()=>onChange(snapshot());
 function cancel(){if(current){current.status='paused';current.controller.abort();emit();}}
 async function start(items,values){
  cancel();const run={items,values,errors:new Map(),busy:new Set(),controller:new AbortController(),status:'running'};current=run;emit();
  const pending=items.filter(p=>!values.has(p.id));let next=0;
  async function worker(){
   while(current===run&&!run.controller.signal.aborted&&next<pending.length){
    const p=pending[next++];run.busy.add(p.id);emit();
    try{const text=await translate(p,run.controller.signal);if(current!==run||run.controller.signal.aborted)return;if(typeof text!=='string'||!text.trim())throw Error('模型未返回有效译文');values.set(p.id,text);await save(p.id,text);}
    catch(error){if(!run.controller.signal.aborted){run.errors.set(p.id,error.message);if(/认证|API Key|限流|额度/.test(error.message)){run.status='error';run.controller.abort();}}}
    finally{run.busy.delete(p.id);if(current===run)emit();}
   }
  }
  await Promise.all(Array.from({length:Math.min(concurrency,pending.length)},worker));
  if(current===run&&!run.controller.signal.aborted){run.status=run.errors.size?'error':'done';emit();}
 }
 return {start,cancel,snapshot};
}
