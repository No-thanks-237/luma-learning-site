import {detailHTML,tutorHTML,detailAction,detailInput,detailChange,enrichData} from './learning-detail-ui.mjs?v=20261017-14';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stages=['研究问题','必备基础','核心方法','公式与图表','实验证据','局限与复述'];
const sessions=new Map();let active=null,mountSequence=0;
const blank=()=>({profile:{level:'beginner',goal:'overview'},plan:null,progress:{},answers:{},feedback:{},revealed:{},hints:{},step:0});
const allowedIds=doc=>doc.paragraphs.map(p=>p.id);
const renderText=(text,doc)=>window.YanbanFormat.render(text,allowedIds(doc));
function isCurrent(ctx){return active===ctx&&ctx.root.isConnected&&window.YanbanApp?.current().id===ctx.doc.id;}
function notice(ctx,text){if(isCurrent(ctx)){const el=ctx.root.querySelector('[data-learn-status]');if(el)el.textContent=text;}}
async function save(ctx){try{await window.YanbanLearningStore.save(ctx.doc.id,structuredClone(ctx.data));ctx.saveError='';notice(ctx,window.YanbanCloud?.scope?'已保存到本机 · 等待自动同步':'学习内容与作答已保存在当前浏览器');return true;}catch(e){ctx.saveError='保存失败：'+e.message+'。请复制重要作答备份。';notice(ctx,ctx.saveError);return false;}}
function selectedStep(ctx){return ctx.data.plan?.steps[ctx.data.step];}
function draw(ctx){
 if(!isCurrent(ctx))return;
 const {data,root,doc}=ctx,plan=data.plan,step=selectedStep(ctx),busy=ctx.busy;
 const done=plan?plan.steps.filter(s=>data.progress[s.id]).length:0;
 root.innerHTML=`<section class="learning-workspace"><header class="learning-heading"><span class="eyebrow">GUIDED READING</span><h3>把这篇论文，读成自己的理解</h3><p>从概念、方法到证据，带着任务读原文，用练习检验自己的理解。</p></header>
 <details class="learning-preferences" ${plan?'':'open'}><summary>${plan?'调整学习目标':'先确定你的起点'}</summary><label>我的专业基础<select data-learn-level ${busy?'disabled':''}><option value="beginner">刚开始科研 · 从基础讲起</option><option value="familiar">有专业基础 · 重点读方法</option><option value="advanced">深入研究 · 关注推导与复现</option></select></label><label>这次想做到<select data-learn-goal ${busy?'disabled':''}><option value="overview">读懂并能介绍这篇论文</option><option value="method">弄清方法、公式和图表</option><option value="reproduce">为复现做准备</option></select></label><button class="button primary" data-learn="generate" ${busy?'disabled':''}>${busy==='plan'?'正在阅读材料并设计学习路径…':plan?'按新目标生成另一条路径':'生成这篇论文的学习路径'}</button><p class="learning-cost">生成路径、评阅作答和追问会调用你的模型 API；阅读已生成内容不重复调用。不同目标的进度分别保存。</p></details>
 ${ctx.error?`<p class="learning-error" role="alert">${esc(ctx.error)}</p>`:''}
 ${plan?`<details class="learning-overview"><summary>论文概览与阅读范围</summary><div class="model-answer">${renderText(plan.summary,doc)}</div><small>${plan.coverage.partial?'依据各页文字摘选':'依据已提取文字'} · ${plan.coverage.read_pages}/${plan.coverage.total_pages} 页 · 图像需对照 PDF</small></details><div class="learning-progress"><strong>已自评完成 ${done} / 6 步</strong><span>完成由你确认，不等于能力认证</span><progress value="${done}" max="6" aria-label="学习完成进度"></progress></div><nav class="learning-steps" aria-label="学习步骤">${plan.steps.map((s,i)=>`<button data-learn="step" data-step="${i}" class="${i===data.step?'active':''}" aria-current="${i===data.step?'step':'false'}"><span>${data.progress[s.id]?'✓':String(i+1).padStart(2,'0')}</span>${esc(s.title)}</button>`).join('')}</nav>
 <article class="learning-lesson"><div class="learning-lesson-title"><span>STEP ${data.step+1}</span><h4>${esc(step.title)}</h4></div><p class="learning-goal">${esc(step.goal)}</p><div class="learning-task"><strong>先做这个阅读任务</strong><div>${renderText(step.read_task,doc)}</div><div class="learning-sources">${step.sources.map(id=>{const p=doc.paragraphs.find(p=>p.id===id);return `<button class="citation-chip" data-live-cite="${esc(id)}">第 ${p.page} 页 · ${esc(id)} ↗</button>`;}).join('')}</div></div><details class="learning-explanation" open><summary>一步步理解</summary><div class="model-answer">${renderText(step.explanation,doc)}</div></details>
 ${detailHTML(ctx,step)}<details class="learning-basic-practice" ${data.lessons?.[step.id]?'':'open'}><summary>基础理解题 · 保留你的原有作答</summary><div class="learning-check"><span class="eyebrow">CHECK YOUR UNDERSTANDING</span><h4>用自己的话说一遍</h4><div class="model-answer">${renderText(step.question,doc)}</div><label class="learning-answer-label" for="learning-answer">我的回答</label><textarea id="learning-answer" maxlength="4000" placeholder="先写你的理解，哪怕只有一两句话。不会的地方也可以直接写出来。" ${busy==='review'?'disabled':''}>${esc(data.answers[step.id]||'')}</textarea><div class="learning-check-actions"><button data-learn="hint">${data.hints[step.id]?'收起提示':'给我一个提示'}</button><button data-learn="reference">${data.revealed[step.id]?'收起参考答案':'查看参考答案'}</button></div>${data.hints[step.id]?`<div class="learning-hint"><strong>尝试从这里想</strong>${renderText(step.hint,doc)}</div>`:''}${data.revealed[step.id]?`<div class="learning-reference"><strong>参考答案 · 请对照原文</strong>${renderText(step.reference_answer,doc)}<strong>自查这几个要点</strong><ul>${step.key_points.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div>`:''}<button class="button primary" data-learn="review" ${busy?'disabled':''}>${busy==='review'?'正在对照原文评阅…':'请助手检查我的理解'}</button>${data.feedback[step.id]?feedbackHTML(ctx,step.id):''}</div>
 </details>${tutorHTML(ctx,step)}<div class="learning-bottom"><label><input type="checkbox" data-learn-complete ${data.progress[step.id]?'checked':''}> 我能解释并完成这一步的任务</label><div><button class="button secondary" data-learn="ask">这里还不懂，继续追问</button>${data.step<5?'<button class="button primary" data-learn="next">下一步 →</button>':'<span class="learning-finish">可以回看尚未掌握的步骤</span>'}</div></div></article>`:`<div class="learning-preview">${stages.map((t,i)=>`<div><span>0${i+1}</span><strong>${t}</strong><small>${['找准论文要解决的矛盾','补齐真正用到的术语','串起输入、步骤与输出','带着问题读符号和曲线','判断结论由什么支持','说清贡献与不确定之处'][i]}</small></div>`).join('')}</div><p class="learning-empty-note">生成后，先看六步路径，再按需打开每一步的精讲、实操、三档练习和本节答疑。</p>`}
 <div class="learning-quick"><strong>也可以从当前阅读位置开始</strong><button data-learn="page">帮我读懂当前页</button><button data-learn="selection">解释我选中的内容</button></div><p class="learning-storage" data-learn-status role="status">学习内容自动保存在当前浏览器，请保留原始 PDF 并定期导出笔记。</p></section>`;
 root.querySelector('[data-learn-level]').value=data.profile.level;root.querySelector('[data-learn-goal]').value=data.profile.goal;
 if(ctx.saveError)notice(ctx,ctx.saveError);
}
function feedbackHTML(ctx,id){const f=ctx.data.feedback[id],stale=f.answer!==ctx.data.answers[id];return `<section class="learning-feedback"><strong>${stale?'这是修改前的反馈，请重新评阅':({understood:'基本理解了关键点',partial:'还有需要补充的地方',misunderstood:'存在需要纠正的关键误解',unclear:'现有信息不足以判断'})[f.result.verdict]}</strong>${[['做得好的地方',f.result.strengths],['需要补充或核实',f.result.gaps],['接下来做什么',f.result.next_step]].map(([title,text])=>`<h5>${title}</h5><div class="model-answer">${renderText(text,ctx.doc)}</div>`).join('')}<small>模型评阅仅供学习参考，请核对原文。</small></section>`;}
async function run(ctx,kind,operation){if(ctx.busy)return;if(!ctx.options.requireModel())return;ctx.busy=kind;ctx.error='';draw(ctx);try{await operation();}catch(e){ctx.error=e.message;}finally{ctx.busy='';draw(ctx);}}
async function action(ctx,event){
 const b=event.target.closest('[data-learn]');if(!b||!isCurrent(ctx))return;
 const a=b.dataset.learn,d=ctx.data,s=selectedStep(ctx);
 if(await detailAction(ctx,b,{draw,save,run}))return;
 if(a==='step'||a==='next'){d.step=a==='next'?Math.min(5,d.step+1):Number(b.dataset.step);draw(ctx);save(ctx);ctx.root.closest('#assistant-body').scrollTop=0;return;}
 if(a==='hint'||a==='reference'){const key=a==='hint'?'hints':'revealed';d[key][s.id]=!d[key][s.id];draw(ctx);save(ctx);return;}
 if(a==='page'){const page=ctx.options.page();ctx.options.ask(`请为科研新手细讲当前论文第 ${page} 页：先说明这一页的作用，再解释关键概念、方法或公式，给出一个阅读任务和一个不公布答案的理解题。必须先读取该页相关段落并给出引用；图像细节无法从文字确认时请明确说明。`);return;}
 if(a==='selection'){if(!ctx.options.selection())return ctx.options.notify('请先在左侧原文划选一段内容。');ctx.options.ask('请像导师一样带我读懂所选内容：解释术语、前后逻辑、必要的补充背景，再给一个理解检查问题，先不公布答案。');return;}
 if(a==='ask'){ctx.options.ask(`我正在学习“${s.title}”。阅读任务：${s.read_task}\n问题：${s.question}\n请结合 ${s.sources.map(id=>'['+id+']').join(' ')} 先读取这些原文，用更简单的例子分步解释，区分论文内容和补充知识。我的理解：${(d.answers[s.id]||'还没有形成清晰理解').slice(0,1500)}`);return;}
 if(a==='generate'){
  const profile={level:ctx.root.querySelector('[data-learn-level]').value,goal:ctx.root.querySelector('[data-learn-goal]').value},key=profile.level+':'+profile.goal;
  if(d.plan&&d.profile.level===profile.level&&d.profile.goal===profile.goal){ctx.options.notify('当前目标的学习路径已生成，可直接继续学习。');return;}
  if(d.paths?.[key]){const paths={...d.paths};if(d.plan)paths[d.profile.level+':'+d.profile.goal]=snapshot(d);ctx.data={...blank(),...structuredClone(paths[key]),paths,profile};draw(ctx);save(ctx);return;}
  await run(ctx,'plan',async()=>{const result=await ctx.options.api('/api/learning-plan',{method:'POST',timeout:300000,body:{document_id:ctx.doc.id,profile}});const paths={...d.paths};if(d.plan)paths[d.profile.level+':'+d.profile.goal]=snapshot(d);ctx.data={...blank(),profile,plan:result,paths};await save(ctx);});return;
 }
 if(a==='review'){
  const answer=(d.answers[s.id]||'').trim();if(!answer)return ctx.options.notify('先写下你的理解，再让助手检查。');
  await run(ctx,'review',async()=>{const result=await ctx.options.api('/api/learning-review',{method:'POST',body:{document_id:ctx.doc.id,step:s,answer}});d.feedback[s.id]={answer,result};await save(ctx);});
 }
}
function snapshot(d){const {paths,...rest}=d;return structuredClone(rest);}
window.YanbanLearning={
 async flush(){for(const ctx of sessions.values()){if(ctx.saveTimer){clearTimeout(ctx.saveTimer);ctx.saveTimer=null;if(!await save(ctx))throw Error(ctx.saveError);}}},
 isBusy:()=>[...sessions.values()].some(s=>s.busy),
 async mount(root,options){
  const sequence=++mountSequence;
  const key=(window.YANBAN_SCOPE||'guest')+':'+options.document.id;
  let ctx=sessions.get(key);
  if(!ctx){ctx={root,doc:options.document,options,data:blank(),busy:'',error:''};sessions.set(key,ctx);active=ctx;root.innerHTML='<p class="tab-intro">正在读取这篇论文的学习进度…</p>';try{const saved=await window.YanbanLearningStore.load(ctx.doc.id);if(saved?.plan?.steps?.length===6)ctx.data={...blank(),...saved};}catch(e){ctx.error=e.message;}}
  if(sequence!==mountSequence||window.YanbanApp?.current().id!==options.document.id)return;
  ctx.root=root;ctx.options=options;active=ctx;
  root.onclick=e=>action(ctx,e);
  root.oninput=e=>{if(detailInput(ctx,e,save))return;if(e.target.id!=='learning-answer')return;const step=selectedStep(ctx);ctx.data.answers[step.id]=e.target.value;delete ctx.data.progress[step.id];const done=ctx.data.plan.steps.filter(s=>ctx.data.progress[s.id]).length;root.querySelector('.learning-progress strong').textContent='已自评完成 '+done+' / 6 步';root.querySelector('.learning-progress progress').value=done;const check=root.querySelector('[data-learn-complete]');if(check)check.checked=false;clearTimeout(ctx.saveTimer);ctx.saveTimer=setTimeout(()=>{ctx.saveTimer=null;save(ctx);},300);const feedback=root.querySelector('.learning-feedback>strong');if(feedback)feedback.textContent='回答已修改，请重新评阅';};
  root.onchange=e=>{if(detailChange(ctx,e,save))return;if(e.target.matches('[data-learn-complete]')){ctx.data.progress[selectedStep(ctx).id]=e.target.checked;draw(ctx);save(ctx);}};
  draw(ctx);
 }
};

window.addEventListener('yanban-sync-complete',()=>{const previous=active;for(const c of sessions.values())clearTimeout(c.saveTimer);sessions.clear();active=null;if(previous?.root.isConnected&&window.YanbanApp?.current().id===previous.doc.id)window.YanbanLearning.mount(previous.root,previous.options);});
