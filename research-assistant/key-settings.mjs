export const savedKeyName='yanban-public-saved-key-v1';
const metadataKey='yanban-public-model-v1';
const validKey=k=>typeof k==='string'&&k.length>0&&k.length<=4096&&!/[\s\x00-\x1f]/.test(k);
export function createSettings(getStorage=()=>localStorage){
 let state={provider:'deepseek',base_url:'https://api.deepseek.com',model:'deepseek-flash',api_key:'',remember:false};
 function readSaved(){
  const record=JSON.parse(getStorage().getItem(savedKeyName)||'null');
  return record?.version===1&&validKey(record.api_key)?record.api_key:'';
 }
 try{const old=JSON.parse(getStorage().getItem(metadataKey)||'{}');if(typeof old.model==='string'&&old.model.trim()&&old.model.length<=180&&!/[\x00-\x1f]/.test(old.model))state.model=old.model;}catch(_){}
 try{state.api_key=readSaved();state.remember=!!state.api_key;}catch(_){}
 const publicConfig=()=>({provider:state.provider,base_url:state.base_url,model:state.model,has_api_key:!!state.api_key,remember:state.remember,key_storage:state.api_key?(state.remember?'browser-local':'session'):'none'});
 function update(body){
  if(!body||body.provider!=='deepseek'||body.base_url!=='https://api.deepseek.com')throw Error('公开版只连接 DeepSeek 官方接口。');
  if(typeof body.model!=='string'||!body.model.trim()||body.model.length>180||/[\x00-\x1f]/.test(body.model))throw Error('模型编号无效。');
  const supplied=String(body.api_key||'').trim();if(supplied&&!validKey(supplied))throw Error('API Key 格式不正确。');
  const next={...state,model:body.model.trim(),api_key:body.clear_key?'':supplied||state.api_key};
  next.remember=!!next.api_key&&!body.clear_key&&(typeof body.remember==='boolean'?body.remember:state.remember);
  try{
   if(next.remember)getStorage().setItem(savedKeyName,JSON.stringify({version:1,api_key:next.api_key}));
   else getStorage().removeItem(savedKeyName);
  }catch(_){throw Error(next.remember?'浏览器未能保存 Key，请取消勾选“记住 API Key”后重试，或检查浏览器存储设置。':'浏览器未能删除保存的 Key，配置未更改；请检查浏览器存储设置后重试。');}
  state=next;
  try{getStorage().setItem(metadataKey,JSON.stringify({model:state.model}));}catch(_){}
  return publicConfig();
 }
 return {active:()=>({...state}),public:publicConfig,update,
  clear:()=>update({...state,clear_key:true,remember:false}),
  sync:()=>{if(state.remember){try{state.api_key=readSaved();state.remember=!!state.api_key;}catch(_){state.api_key='';state.remember=false;}}}
 };
}
