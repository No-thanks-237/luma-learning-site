// Debounce selection edits, abort superseded calls, and only publish the latest result.
export function createSelectionTranslator({translate,onChange=()=>{},delay=300,cacheLimit=30}){
 let current=null,timer=null;const cache=new Map();
 const snapshot=()=>current?{input:current.input,status:current.status,text:current.text||'',error:current.error||''}:{input:null,status:'idle',text:'',error:''};
 const emit=()=>onChange(snapshot());
 function cancel(){clearTimeout(timer);timer=null;current?.controller.abort();current=null;emit();}
 function select(input,{force=false,immediate=false}={}){
  const key=JSON.stringify(input);
  if(!force&&current?.key===key&&['waiting','running','done'].includes(current.status))return;
  cancel();const run={input:structuredClone(input),key,controller:new AbortController(),status:'waiting'};current=run;
  if(!force&&cache.has(key)){run.text=cache.get(key);run.status='done';emit();return;}
  emit();
  async function execute(){
   if(current!==run)return;run.status='running';emit();
   try{const text=await translate(run.input,run.controller.signal);if(current!==run||run.controller.signal.aborted)return;if(typeof text!=='string'||!text.trim())throw Error('没有收到有效译文，请重试。');run.text=text;run.status='done';cache.delete(key);cache.set(key,text);while(cache.size>cacheLimit)cache.delete(cache.keys().next().value);}
   catch(error){if(current!==run||run.controller.signal.aborted)return;run.error=error.message;run.status='error';}
   if(current===run)emit();
  }
  if(immediate)void execute();else timer=setTimeout(execute,delay);
 }
 return {select,cancel,snapshot};
}
