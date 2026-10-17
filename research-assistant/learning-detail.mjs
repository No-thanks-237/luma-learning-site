import {jsonResult} from './research.mjs?v=20261017-14';
import {learningSource,learningLevels,learningGoals,learningStages,safety} from './learning.mjs?v=20261017-14';

const text=(v,max=700)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw Error('精讲内容缺少字段或超过长度限制。');return v.trim().replace(/[（(](p\d+)[）)]/g,'[$1]');};
const list=(v,min,max,fn)=>{if(!Array.isArray(v)||v.length<min||v.length>max)throw Error('精讲内容的条目数量不完整。');return v.map(fn);};
export function validateLearningDetail(raw,source){
 const ids=new Set(source.map(p=>p.id));
 const item=(v,fields)=>{
  if(!v||typeof v!=='object')throw Error('精讲条目不完整。');
  const out={};for(const [key,max] of Object.entries(fields))out[key]=text(v[key],max);
  out.sources=list(v.sources,1,24,id=>{if(!ids.has(id))throw Error('精讲引用了未读取的原文。');return id;});
  for(const m of JSON.stringify(out).matchAll(/\[(p\d+)\]/g)){if(!ids.has(m[1]))throw Error('精讲引用了未读取的原文。');out.sources.push(m[1]);}
  out.sources=[...new Set(out.sources)];return out;
 };
 const result={why:text(raw.why,500),outcomes:list(raw.outcomes,2,4,v=>text(v,180)),prerequisites:list(raw.prerequisites,2,4,v=>text(v,240)),
  concepts:list(raw.concepts,3,5,v=>item(v,{term:100,meaning:500,role:400,analogy:350,boundary:350})),
  walkthrough:list(raw.walkthrough,3,5,v=>item(v,{title:100,explanation:700,checkpoint:250})),
  example:item(raw.example,{scenario:450,steps:900,takeaway:350}),
  misconceptions:list(raw.misconceptions,2,4,v=>item(v,{mistake:250,correction:500,check:250})),
  tasks:list(raw.tasks,2,4,v=>item(v,{title:100,instructions:650,deliverable:300})),
  exercises:list(raw.exercises,3,3,v=>({...item(v,{question:350,hint:300,reference_answer:700}),id:v.id,key_points:list(v.key_points,2,4,t=>text(t,180))}))};
 if(!['illustration','paper'].includes(raw.example.kind))throw Error('示例必须标明来自论文还是教学类比。');result.example.kind=raw.example.kind;
 const ordered=['recall','explain','apply'].map(id=>result.exercises.find(e=>e.id===id));if(ordered.some(e=>!e))throw Error('练习须覆盖回忆、解释和迁移三个层次。');result.exercises=ordered;
 for(const m of JSON.stringify(result).matchAll(/\[(p\d+)\]/g))if(!ids.has(m[1]))throw Error('精讲引用了未读取的原文。');
 // Keep every inline exercise citation in its review evidence, including key points.
 result.exercises.forEach(e=>{e.sources=[...new Set([...e.sources,...[...JSON.stringify(e).matchAll(/\[(p\d+)\]/g)].map(m=>m[1])])];});
 return result;
}
export async function makeLearningDetail(doc,profile,step,complete){
 if(!learningLevels[profile?.level]||!learningGoals[profile?.goal]||!learningStages.some(([id])=>id===step?.id))throw Error('请先选择有效的学习步骤。');
 const {selected,coverage}=learningSource(doc);const known=new Set(selected.map(p=>p.id));
 if(!Array.isArray(step.sources)||!step.sources.length||step.sources.some(id=>!known.has(id)))throw Error('当前步骤缺少有效原文依据。');
 const messages=[{role:'system',content:safety+`为当前步骤设计一节有深度、可操作的微课，不重复六步概览。依据学生基础和学习目标，解释“是什么→为什么→怎么用→何时不适用”，每个知识点都联系当前论文。基础弱时用直觉和生活类比，再回到准确术语；深入学习时补假设、推理链和可检验的复现条件。图表任务要具体到文中出现的图号/公式号（仅有依据时），教学生自己核对坐标、单位、趋势、对照组与适用条件。不能把文中数值猜成图中读数。给三档非选择题：recall 回忆概念、explain 解释因果、apply 迁移或判断证据边界；参考答案独立，不在提示里泄露完整答案。所有 sources 用实际段落编号，优先 2–6 个。
仅返回 JSON，字段如下：
{why:"本节为什么值得学",outcomes:["2–4条可观察的学习目标"],prerequisites:["2–4条先修知识，每条顺带用一句话补课"],concepts:[{term,meaning:"定义与直觉",role:"在本论文中的用途",analogy:"明确标注为补充类比",boundary:"适用边界或易混淆处",sources:["p1"]}],walkthrough:[{title,explanation:"分步解释原理与因果",checkpoint:"自我检查的小问题，不含答案",sources}],example:{kind:"illustration 或 paper",scenario,steps:"编号步骤，支持换行",takeaway,sources},misconceptions:[{mistake,correction,check:"怎样回原文检验",sources}],tasks:[{title,instructions:"可执行的编号步骤",deliverable:"应写下/画出什么",sources}],exercises:[{id:"recall 或 explain 或 apply",question,hint,reference_answer,key_points:["2–4条"],sources}]}
concepts 和 walkthrough 各3–5项；misconceptions 和 tasks 各2–4项；exercises 恰好3题各一个层次。示例的 kind=illustration 时必须明确是教学假设，不冒充论文实验；kind=paper 时每个具体数据需原文支持。总正文约2000–2800中文字，避免空泛重复，所有单字段不超过450字（steps最多700字）。若提取文字不完整，明确不能确认之处。`},{role:'user',content:JSON.stringify({title:doc.title,learner:learningLevels[profile.level],goal:learningGoals[profile.goal],untrusted_current_step:step,coverage,untrusted_source_text:selected})}];
 for(let attempt=0;attempt<2;attempt++){
  const response=await complete(messages,{max_tokens:11500});
  try{return {...validateLearningDetail(jsonResult(response.message.content),selected),coverage,model:response.model,created_at:new Date().toISOString()};}
  catch(e){if(attempt===1)throw e;messages.push({role:'assistant',content:response.message.content},{role:'user',content:'格式校验失败：'+e.message+' 请重新返回完整 JSON，保留正确来源，严格遵守字段和数量限制。'});}
 }
}
