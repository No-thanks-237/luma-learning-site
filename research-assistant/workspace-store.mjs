export function scopeKey(key,scope=''){return scope?key+':'+scope:key;}
export function createWorkspace(storage,scope=''){
 const key=scopeKey('yanban-workspace-v2',scope);
 let value={};try{value=JSON.parse(storage.getItem(key)||'{}');}catch(_){}
 if(!value||typeof value!=='object'||Array.isArray(value))value={};
 let snapshot=storage.getItem(key);
 const ensureFresh=()=>{if(storage.getItem(key)!==snapshot)throw Error('另一标签页更新了资料，请刷新后再编辑。');};
 const emit=()=>{if(typeof window!=='undefined')window.dispatchEvent(new Event('yanban-workspace-change'));};
 return {
  all:()=>structuredClone(value),
  get:id=>value[id],
  ensureFresh,
  set(id,data){ensureFresh();const next={...value,[id]:data};storage.setItem(key,JSON.stringify(next));snapshot=storage.getItem(key);value=next;emit();},
  replace(next,{silent=false}={}){ensureFresh();storage.setItem(key,JSON.stringify(next));snapshot=storage.getItem(key);value=structuredClone(next);if(!silent)emit();},
  list(prefix){return Object.entries(value).filter(([id,v])=>id.startsWith(prefix)&&v&&!v.deleted).map(([id,v])=>({id:id.slice(prefix.length),...v}));}
 };
}
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
export const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
export function mergeEntries(base,local,remote,preference=''){
 const merged={},conflicts=[];
 for(const key of new Set([...Object.keys(base),...Object.keys(local),...Object.keys(remote)])){
  const b=base[key],l=local[key],r=remote[key];let value;
  if(same(l,r))value=l;else if(same(l,b))value=r;else if(same(r,b))value=l;
  else{conflicts.push({key,local:l,remote:r});value=preference==='remote'?r:l;}
  if(value!==undefined)merged[key]=value;
 }
 return {merged,conflicts};
}
