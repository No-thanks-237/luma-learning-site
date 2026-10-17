// One scheduler for startup, local writes, reconnects and explicit conflict resolution.
export function createAutoSync({sync,online=()=>true,blocked=()=>false,conflicted=()=>false,notify=()=>{},setTimer=setTimeout,clearTimer=clearTimeout,now=Date.now,debounce=2000,poll=60000}){
 let timer=null,running=null,stopped=false,paused=false,revision=0,dirty=true,failures=0,lastSynced=0,state='waiting',error='';
 const snapshot=()=>({state,dirty,running:!!running,lastSynced,error});
 const emit=(next,reason='')=>{state=next;error=reason;notify(snapshot());};
 const schedule=delay=>{if(stopped||paused)return;clearTimer(timer);timer=setTimer(()=>{timer=null;run();},delay);};
 async function run(preference=''){
  if(stopped)return;if(running)return running;
  if(paused&&!preference)return;if(preference)paused=false;
  clearTimer(timer);timer=null;
  if(!online()){emit('offline');return;}
  if(blocked()){emit('waiting');schedule(debounce);return;}
  const started=revision;emit('syncing');
  running=Promise.resolve().then(async()=>{
   try{
    const result=await sync(preference);
    failures=0;lastSynced=now();
    if(revision!==started||result?.deferred){dirty=true;emit('waiting');schedule(debounce);}
    else{dirty=false;emit('synced');schedule(poll);}
    return result;
   }catch(e){
    dirty=true;
    if(conflicted()){paused=true;emit('conflict',e.message);}
    else if(!online())emit('offline',e.message);
    else{emit('error',e.message);schedule(Math.min(120000,5000*2**Math.min(failures++,5)));}
   }finally{running=null;}
  });
  return running;
 }
 return {
  snapshot,
  start(){if(stopped)return;emit('waiting');schedule(0);},
  changed(){if(stopped)return;dirty=true;revision++;if(paused){emit('conflict',error);return;}if(!online()){emit('offline');return;}if(!running){emit('waiting');schedule(debounce);}},
  wake(){if(stopped||paused)return;if(!online()){clearTimer(timer);emit('offline');return;}if(!running)schedule(0);},
  run,
  stop(){stopped=true;clearTimer(timer);timer=null;}
 };
}
