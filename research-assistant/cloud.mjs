import {scopeKey,mergeEntries,same} from './workspace-store.mjs?v=20261017-14';
export async function initCloud(fetcher){
 const config=window.YANBAN_CLOUD_CONFIG||{};
 const configured=Boolean(config.url&&config.publishableKey);
 const client=configured?window.supabase.createClient(config.url,config.publishableKey,{global:{fetch:(input,options={})=>fetcher(input,{...options,signal:options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(90000)]):AbortSignal.timeout(90000)})},auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}}):null;
 let session=null,error='';
 try{if(client){const result=await client.auth.getSession();if(result.error)throw result.error;session=result.data.session;}}catch(e){error=e.message;}
 const scope=session?.user.id||'';
 let busy=false,pending=null;
 const message=text=>window.dispatchEvent(new CustomEvent('yanban-cloud-status',{detail:text}));
 const check=result=>{if(result.error)throw result.error;return result.data;};
 const safeError=e=>e?.message||'云服务暂时无法连接，请稍后重试。';
 const api={configured,scope,email:session?.user.email||'',error,
  async loginGitHub(){if(!client)throw Error('站点尚未配置云服务。');check(await client.auth.signInWithOAuth({provider:'github',options:{redirectTo:location.origin+location.pathname}}));},
  async login(email,password){if(!client)throw Error('站点尚未配置云服务。');check(await client.auth.signInWithPassword({email,password}));location.reload();},
  async signup(email,password){if(!client)throw Error('站点尚未配置云服务。');const data=check(await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}}));if(data.session)location.reload();return '注册申请已提交，请查看邮箱中的确认邮件；已注册账号请直接登录。';},
  async logout(){check(await client.auth.signOut({scope:'local'}));location.reload();},
  get pending(){return pending;},
  get busy(){return busy;},
  async sync(repository,workspace,preference='',{background=false}={}){
   if(!client||!scope)throw Error('请先登录，再同步论文和笔记。');
   if(busy)throw Error('同步正在进行，请稍候。');
   const run=async()=>{
    busy=true;if(!background)document.body.classList.add('cloud-busy');message('正在核对云端版本…');
    let locked=[];const lock=()=>{if(locked.length)return;locked=[...document.body.children].filter(el=>el.id!=='cloud-overlay').map(el=>[el,el.inert]);locked.forEach(([el])=>el.inert=true);};if(!background)lock();
    try{
     const me=check(await client.auth.getUser());if(me.user.id!==scope)throw Error('账号已切换，请刷新页面。');
     const cardKey=scopeKey('yanban-public-reading-cards-v1',scope),baseKey=scopeKey('yanban-cloud-base-v1',scope);
     await window.YanbanLearning?.flush();
     const localRecords=await repository.all();
     const learningRecords=await repository.learningAll();
     const learningSnapshot=JSON.stringify(learningRecords);
     workspace.ensureFresh();
     const cardSnapshot=localStorage.getItem(cardKey),workspaceSnapshot=JSON.stringify(workspace.all());
     const unchanged=async()=>{workspace.ensureFresh();return !(background&&(window.YanbanApp?.isBusy()||window.YanbanAutoSync?.isEditing?.()))&&JSON.stringify(await repository.learningAll())===learningSnapshot&&localStorage.getItem(cardKey)===cardSnapshot&&JSON.stringify(workspace.all())===workspaceSnapshot;};
     const cards=JSON.parse(cardSnapshot||'{}');
     const local={...workspace.all()};
     for(const record of learningRecords)local['learning:'+record.id.slice('learning-v1:'.length)]=record.value;
     for(const record of localRecords)local['doc:'+record.id]=record.document;
     for(const [id,item] of Object.entries(cards)){if(id==='demo')continue;for(const [field,text] of Object.entries(item.card||{}))local['card:'+id+':'+field]=text;local['excerpts:'+id]=item.excerpts||[];}
     let base=await repository.readSyncBase();if(!base){try{base=JSON.parse(localStorage.getItem(baseKey)||'{}');}catch(_){base={};}}
     const row=check(await client.from('yanban_workspaces').select('revision,entries').eq('user_id',scope).maybeSingle());
     const remote=row?.entries||{};
     const result=mergeEntries(base,local,remote,preference);
     if(result.conflicts.length&&!preference){pending={conflicts:result.conflicts,createdAt:new Date().toISOString()};throw Error('检测到 '+result.conflicts.length+' 项同时修改。请选择保留哪个版本；两份内容可先下载备份。');}
     if(result.conflicts.length){await repository.saveConflictBackup({local,remote,createdAt:new Date().toISOString()});}
     const merged=result.merged;
     const recordMap=new Map(localRecords.map(r=>[r.id,r]));
     const fetched=[];
     // Download all missing files before changing local data. PDF paths are immutable IDs.
     for(const [key,doc] of Object.entries(merged))if(key.startsWith('doc:')&&!recordMap.has(doc.id)){
      message('正在下载论文：'+doc.title);const blob=check(await client.storage.from('yanban-papers').download(scope+'/'+doc.id+'.pdf'));
      fetched.push({id:doc.id,document:doc,blob});
     }
     for(const [key,doc] of Object.entries(merged))if(key.startsWith('doc:')&&!remote[key]){
      const record=recordMap.get(doc.id);if(!record)throw Error('本机缺少论文文件，请重新导入。');
      message('正在上传论文：'+doc.title);
      const uploaded=await client.storage.from('yanban-papers').upload(scope+'/'+doc.id+'.pdf',record.blob,{contentType:'application/pdf',upsert:false});
      if(uploaded.error&&!['409','Duplicate'].includes(String(uploaded.error.statusCode))&&!/already exists|duplicate/i.test(uploaded.error.message))throw uploaded.error;
     }
     message('正在保存笔记与分类…');
     if(!await unchanged())return {deferred:true};
     if(!same(merged,remote))check(await client.rpc('yanban_save_workspace',{expected_revision:row?.revision||0,new_entries:merged}));
     // A new edit during the request must survive. Rebase on what this request read,
     // so our own upload is not mistaken for another device's conflicting edit.
     if(!same(merged,local))lock();
     if(!await unchanged()){await repository.saveSyncBase(local);return {deferred:true};}
     if(same(merged,local)){await repository.saveSyncBase(merged);localStorage.removeItem(baseKey);pending=null;message('同步完成 · '+new Date().toLocaleTimeString());return {changed:false};}
     for(const record of fetched)await repository.put(record);
     const nextWorkspace={},nextCards={demo:cards.demo};
     for(const [key,value] of Object.entries(merged)){
      if(key.startsWith('doc:'))continue;
      if(key.startsWith('learning:')){await repository.putLearning(key.slice(9),value);continue;}
      if(key.startsWith('card:')){const split=key.lastIndexOf(':'),id=key.slice(5,split),field=key.slice(split+1);nextCards[id]??={card:{},excerpts:[]};nextCards[id].card[field]=value;}
      else if(key.startsWith('excerpts:')){const id=key.slice(9);nextCards[id]??={card:{},excerpts:[]};nextCards[id].excerpts=value;}
      else nextWorkspace[key]=value;
     }
     // Base is saved last: if a local write fails, next sync can safely retry.
     localStorage.setItem(cardKey,JSON.stringify(nextCards));workspace.replace(nextWorkspace,{silent:true});
     await repository.saveSyncBase(merged);
     localStorage.removeItem(baseKey);
     pending=null;window.dispatchEvent(new Event('yanban-sync-complete'));message('同步完成 · '+new Date().toLocaleTimeString());return {changed:true};
    }catch(e){const text=/revision_conflict/.test(e.message)?'另一台设备刚更新了资料，请再次同步；本机内容已保留。':safeError(e);message(text);throw Error(text);}
    finally{busy=false;document.body.classList.remove('cloud-busy');locked.forEach(([el,was])=>el.inert=was);}
   };
   if(navigator.locks)return navigator.locks.request('yanban-cloud-sync-'+scope,{ifAvailable:true},lock=>{if(!lock)throw Error('另一个标签页正在同步，请稍候。');return run();});
   return run();
  }
 };
 if(client)client.auth.onAuthStateChange((event,newSession)=>{if(['SIGNED_OUT','SIGNED_IN'].includes(event)&&(newSession?.user.id||'')!==scope){document.body.classList.add('cloud-busy');setTimeout(()=>location.reload(),0);}});
 return api;
}
