import {createAutoSync} from './auto-sync.mjs?v=20261017-14';
const app=window.YanbanApp,cloud=window.YanbanCloud,ws=window.YanbanWorkspace;
if(cloud.scope&&cloud.configured){
 const labels={waiting:'等待自动同步',syncing:'正在同步…',synced:'已同步',offline:'离线 · 已存本机',error:'暂未同步 · 将重试',conflict:'同步冲突 · 请处理'};
 const notify=s=>{
  const button=document.querySelector('#cloud-sync-indicator');if(button){button.textContent=labels[s.state];button.dataset.syncState=s.state;button.setAttribute('aria-live','polite');button.title=s.error||'点击查看账号与自动同步状态';}
  const text=s.state==='synced'?'已同步到云端 · '+new Date(s.lastSynced).toLocaleTimeString():s.state==='offline'?'当前离线，修改已保存在本机；恢复网络后自动同步。':s.state==='error'?'暂未同步，修改仍在本机；会自动重试。'+s.error:s.state==='conflict'?'两台设备修改了同一份内容。请在账号面板选择保留版本，两份记录均可下载备份。':s.state==='syncing'?'正在后台同步，编辑内容仍会先保存到本机。':'修改已保存在本机，稍后自动同步。';
  window.YanbanAutoSyncMessage=text;
  const message=document.querySelector('#cloud-message');if(message)message.textContent=text;
  const conflicts=document.querySelector('#sync-conflicts');if(conflicts)conflicts.hidden=s.state!=='conflict';
  for(const selector of ['#notebook-save-state','[data-learn-status]']){const el=document.querySelector(selector);if(el&&!el.textContent.includes('保存失败'))el.textContent=text;}
  window.dispatchEvent(new CustomEvent('yanban-auto-sync-status',{detail:s}));
 };
 let editingUntil=0;
 const controller=createAutoSync({sync:preference=>cloud.sync(window.YanbanRepository,ws,preference,{background:!preference}),online:()=>navigator.onLine!==false,blocked:()=>app.isBusy()||cloud.busy||Date.now()<editingUntil,conflicted:()=>!!cloud.pending,notify});
 controller.isEditing=()=>Date.now()<editingUntil;
 window.YanbanAutoSync=controller;
 window.addEventListener('yanban-workspace-change',()=>controller.changed());
 window.addEventListener('yanban-data-change',()=>controller.changed());
 document.addEventListener('input',e=>{if(e.target.matches('#notebook-editor,#learning-answer,#lesson-question,[data-exercise-answer],[data-note]'))editingUntil=Date.now()+2000;});
 window.addEventListener('online',()=>controller.wake());window.addEventListener('offline',()=>controller.wake());
 window.addEventListener('focus',()=>{if(!document.hidden)controller.wake();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)controller.wake();});
 controller.start();
}
