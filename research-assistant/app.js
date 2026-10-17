(() => {
  'use strict';
  const DATA = window.DEMO_DATA;
  const scoped = key => window.YANBAN_SCOPE?key+':'+window.YANBAN_SCOPE:key;
  const KEY = scoped('yanban-public-demo-v1');
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const paths = {
    layout:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M9 9h12"/>',
    library:'<path d="M4 4v16M8 4v16M12 4v16M16 5l4 14M3 20h10"/>',
    notebook:'<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M8 3v18M3 7h4M3 12h4M3 17h4M11 8h6M11 12h6"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',
    file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.2"/>',
    expand:'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
    left:'<path d="m14 6-6 6 6 6"/>',right:'<path d="m10 6 6 6-6 6"/>',
    spark:'<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3Z"/><path d="M20 2v4M18 4h4"/>',
    translate:'<path d="M3 5h12M9 3v2M6 5c0 5 3 8 7 10M13 5c0 5-4 9-9 11M13 21l4-10 4 10M14.5 17h5"/>',
    bookmark:'<path d="M6 3h12v18l-6-4-6 4V3Z"/>',
    flask:'<path d="M9 3h6M10 3v6l-6 10a1.4 1.4 0 0 0 1.2 2h13.6a1.4 1.4 0 0 0 1.2-2L14 9V3M7 15h10"/>',
    layers:'<path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>',
    link:'<path d="m10 13 4-4M8 15l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M16 9l1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(1 1) scale(.9)"/>',
    'up-right':'<path d="M6 18 18 6M7 6h11v11"/>',
    'arrow-up':'<path d="M12 19V5M6 11l6-6 6 6"/>',
    'check-circle':'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    book:'<path d="M12 6c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V5c-4-1-7-1-10 1ZM12 6v15"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    upload:'<path d="M12 16V3M7 8l5-5 5 5M4 15v6h16v-6"/>',
    download:'<path d="M12 3v13M7 11l5 5 5-5M4 16v5h16v-5"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    bulb:'<path d="M9 18h6M10 21h4M8 14c-6-5-2-12 4-12s10 7 4 12l-1 2H9l-1-2Z"/>',
    copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V3H3v13h5"/>',
    settings:'<path d="M4 7h16M4 17h16M8 4v6M16 14v6"/>'
  };
  const formatText = text => window.YanbanFormat.text(text);
  const renderMath = text => window.YanbanFormat.render(text);
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;
  const hydrateIcons = (root = document) => $$('[data-icon]', root).forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  const defaultCard = {problem:'',method:'',evidence:'',limitations:'',questions:''};
  let persisted = {};
  try { const saved = JSON.parse(localStorage.getItem(KEY) || '{}'); if (saved && typeof saved === 'object') persisted = saved; } catch (_) {}
  const knownSections = DATA.sections.map(section => section.id);
  const state = {
    section: knownSections.includes(persisted.section) ? persisted.section : 'abstract',
    visited: Array.isArray(persisted.visited) ? persisted.visited.filter(id => knownSections.includes(id)) : [],
    bilingual: false, zoom: 1, tab: 'chat', doc: 'demo', selected: null,
    card: Object.fromEntries(Object.keys(defaultCard).map(key => [key, typeof persisted.card?.[key] === 'string' ? persisted.card[key] : ''])),
    excerpts: Array.isArray(persisted.excerpts) ? persisted.excerpts.slice(0,50).flatMap((item,index) => {if(!item || typeof item.text!=='string')return [];const match=paragraphById(item.paragraph);return match?[{id:`restored-${index}`,paragraph:match.paragraph.id,section:match.section.id,label:match.section.label,text:item.text.slice(0,20000)}]:[];}) : [],
    quizAnswer: Number.isInteger(persisted.quizAnswer) && persisted.quizAnswer >= 0 && persisted.quizAnswer < DATA.quiz.options.length ? persisted.quizAnswer : null,
    messages: [], localFile: null, busy: false, requestId: 0
  };
  let toastTimer, saveTimer, importRequestId = 0;
  let storageWarningShown = false;
  let lastSaveSucceeded = true;
  let cardSnapshot;
  const LIVE_KEY = scoped('yanban-public-reading-cards-v1');
  const ACTIVE_KEY = scoped('yanban-public-active-document-v1');
  const live = {connected:false, checking:true, configured:false, csrf:'', config:null, documents:[], document:null, page:1, pdfView:false, translations:new Map(), translationErrors:new Map(), translationBusy:new Set(), cards:{}, epoch:0, history:[], settingsBusy:false, uploadBusy:false, cardBusy:false, visited:new Set()};
  try {const saved=JSON.parse(localStorage.getItem(LIVE_KEY)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))live.cards=saved;}catch(_){}
  live.cards.demo = {card:{...state.card},excerpts:[...state.excerpts]};
  cardSnapshot=localStorage.getItem(LIVE_KEY);
  function toast(message) { const node = $('#toast'); node.textContent = message; node.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => {node.hidden = true;}, 3400); }
  function persist() {
    lastSaveSucceeded = true;
    try {
      if(localStorage.getItem(LIVE_KEY)!==cardSnapshot)throw Error('stale cards');
      if(state.doc==='demo')localStorage.setItem(KEY, JSON.stringify({section:state.section,visited:state.visited,card:state.card,excerpts:state.excerpts,quizAnswer:state.quizAnswer}));
      live.cards[documentKey()]={card:{...state.card},excerpts:[...state.excerpts]};
      const nextCards=JSON.stringify(live.cards);localStorage.setItem(LIVE_KEY,nextCards);if(cardSnapshot!==nextCards)window.dispatchEvent(new Event('yanban-data-change'));cardSnapshot=nextCards;
    }
    catch (_) {lastSaveSucceeded = false; if (!storageWarningShown) {toast('浏览器未允许浏览器保存，请及时导出读书卡。'); storageWarningShown = true;} }
    $('#save-status').textContent = lastSaveSucceeded ? '浏览器保存' : '未能保存，请导出';
    updateNoteCount();
    return lastSaveSucceeded;
  }
  function updateNoteCount() { $('#note-count').textContent = Object.values(state.card).some(Boolean) || state.excerpts.length ? '1' : '0'; }
  function renderOutline() {
    if(state.doc==='live'){renderLiveOutline();return;}
    $('#outline').innerHTML = DATA.sections.map((s,i) => `<button data-section="${s.id}" class="${state.doc === 'demo' && state.section === s.id ? 'active' : ''}" ${state.doc === 'demo' && state.section === s.id ? 'aria-current="location"' : ''}><span class="outline-number">${String(i+1).padStart(2,'0')}</span><span>${escape(s.label)}</span>${state.visited.includes(s.id) ? '<span class="visited" title="已浏览"></span>' : ''}</button>`).join('');
    $('#progress-count').textContent = `${state.visited.length} / ${DATA.sections.length} 节`;
    $('#progress-fill').style.width = `${state.visited.length / DATA.sections.length * 100}%`;
  }
  function figure() {
    return `<figure class="paper-figure"><div class="figure-heading">A SIMPLE RAG WORKFLOW</div><div class="rag-flow"><div class="flow-node">${icon('search')}<span>Retrieve</span><small>Find relevant passages</small></div><span class="flow-arrow">→</span><div class="flow-node emphasis">${icon('layers')}<span>Ground</span><small>Read the evidence</small></div><span class="flow-arrow">→</span><div class="flow-node">${icon('spark')}<span>Generate</span><small>Explain with context</small></div></div><figcaption class="figure-caption">Figure 1. A conceptual workflow: retrieve relevant sources, read the evidence, and compose an answer. Illustration only.</figcaption></figure>`;
  }
  function renderPaper() {
    if(state.doc==='live'){renderLivePaper();return;}
    const page = $('#paper-page');page.classList.remove('real-paper');
    const local = state.doc === 'local';
    $('[data-view="pdf"]').hidden=true;
    $('.paper-disclaimer').textContent='本文为原创教学示例，不对应真实发表论文。';
    $('[data-tab="concepts"]').textContent='基础概念';
    $('.demo-notice').innerHTML=`${icon('flask')}<span>${local?'本地预览 · 未解析':'示例模式 · 回复为预置教学内容'}</span>`;
    renderSuggestions();
    $('.composer-hint span:last-child').textContent=local?'未连接模型':'示例回复可回到原文核对';
    $('.paper-disclaimer').hidden = local;
    $('.page-navigation').hidden = local;
    $$('.segmented-control button').forEach(b => { b.disabled = local; });
    $$('.reader-tools button').filter(b => b.dataset.action !== 'focus').forEach(b => {b.disabled = local;});
    $('#top-doc-title').textContent = local ? state.localFile.name : '理解检索增强生成';
    $('.paper-nav-card').dataset.action='demo';$('.paper-nav-card strong').textContent='理解检索增强生成';$('.paper-nav-card small').textContent='原创教学示例 · 4 个章节';
    $('#context-label').textContent = local ? '本地 PDF · 仅预览' : '基于当前教学示例';
    $('#reader-context').textContent = local ? '本地 PDF / 文件仅在此浏览器预览' : '教学示例 / 点击段落，即可翻译或提问';
    $('#prompt-suggestions').hidden = local || state.messages.length > 0;
    $('.understanding-entry').hidden = local;
    page.classList.toggle('local-pdf', local);
    if (local) {
      page.innerHTML = `<div class="local-file-message">已打开你的 PDF。本原型暂未解析此文件；右侧不会使用教学示例来回答这篇论文的问题。<br><button class="text-button" data-action="demo">返回教学示例，体验翻译和问答 ${icon('right')}</button></div><iframe class="local-pdf-frame" title="本地 PDF 预览" src="${state.localFile.url}"></iframe>`;
      $('#page-counter').textContent = 'PDF';
      renderOutline();
      return;
    }
    const section = DATA.sections.find(s => s.id === state.section);
    const index = DATA.sections.indexOf(section);
    if (!state.visited.includes(section.id)) state.visited.push(section.id);
    page.style.setProperty('--reader-scale',state.zoom);
    page.innerHTML = `<div class="paper-topline"><span>RESEARCH NOTES</span><span>VOL. 01 / READING PRIMER</span></div><span class="paper-tag">A GUIDED READING EXAMPLE</span><h1>Retrieval-Augmented<br>Generation: A Reading Primer</h1><p class="paper-chinese-title">检索增强生成：一份入门阅读指南</p><div class="paper-metadata"><span>研伴原创教学材料</span><i></i><span>Research foundations</span><i></i><span>2026</span></div><div class="paper-section-heading"><span>${String(index+1).padStart(2,'0')}</span><h2>${escape(section.label === '摘要' ? 'Abstract' : section.title)}</h2></div>${section.paragraphs.map((p,i) => `<div class="paper-paragraph" id="${p.id}" data-paragraph="${p.id}" tabindex="0" aria-label="第 ${i+1} 段，按回车选择"><p class="original">${formatText(p.text)}</p>${state.bilingual ? `<p class="translation">${escape(p.translation)}</p>` : ''}<div class="paragraph-controls"><button data-translate-paragraph="${p.id}">翻译本段</button><button data-save-paragraph="${p.id}">保存摘录</button></div></div>${index < 2 && i === 0 ? figure() : ''}`).join('')}<div class="takeaway">${icon('bulb')}<div><strong>READING NOTE · 阅读提示</strong><p>${escape(section.takeaway)}</p></div></div><div class="paper-footer"><span>YANBAN · ORIGINAL TEACHING MATERIAL</span><span>${String(index+1).padStart(2,'0')}</span></div>`;
    $('#page-counter').textContent = `${String(index+1).padStart(2,'0')} / 04`;
    $('#section-footer').textContent = `${section.label} · ${index+1} / 4`;
    $('[data-action="prev"]').disabled = index === 0;
    $('[data-action="next"]').disabled = index === DATA.sections.length - 1;
    $('#zoom-label').textContent = `${Math.round(state.zoom*100)}%`;
    $$('[data-view]').forEach(b => {const active = (b.dataset.view === 'bilingual') === state.bilingual;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
    renderOutline(); persist();
  }
  function setSection(id, paragraph) {
    if (!knownSections.includes(id)) return;
    if (state.doc !== 'demo') switchToDemo();
    state.section = id; clearSelection(); renderPaper();
    if (state.tab === 'translate') renderTranslation();
    if (paragraph) {
      const target = document.getElementById(paragraph);
      if (target) {target.classList.add('citation-highlight');target.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(() => target.classList.remove('citation-highlight'),3500);}
    } else $('#reader-scroll').scrollTop = 0;
  }
  function paragraphById(id) { for (const section of DATA.sections) {const paragraph = section.paragraphs.find(p => p.id === id);if (paragraph) return {paragraph,section};} return null; }
  function selectParagraph(id, selectedText = '') {
    if(state.doc==='live'){selectLiveParagraph(id,selectedText);return;}
    if (state.doc !== 'demo') return;
    const match = paragraphById(id); if (!match) return;
    state.selected = {id, text: selectedText || match.paragraph.text};
    $$('.paper-paragraph').forEach(el => el.classList.toggle('selected',el.id === id));
    $('#selection-label').textContent = selectedText ? '已选择原文片段' : '已选择整段';
    $('#selection-bar').hidden = false;
    if (state.tab === 'translate') renderTranslation();
  }
  function clearSelection() {selectionTranslator.cancel();state.selected = null;$('#selection-bar').hidden = true;$$('.paper-paragraph.selected').forEach(el => el.classList.remove('selected'));if(state.doc==='live')$('#context-label').textContent='基于当前论文检索';if(state.tab==='translate')renderTranslation();}
  function currentParagraph() {return paragraphById(state.selected?.id || DATA.sections.find(s => s.id === state.section).paragraphs[0].id);}
  function setTab(tab) {
    state.tab = tab;
    $$('[data-tab]').forEach(b => {const active = b.dataset.tab === tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex = active ? 0 : -1;});
    $('#chat-view').hidden = tab !== 'chat'; $('#translate-view').hidden = tab !== 'translate'; $('#concepts-view').hidden = tab !== 'concepts';
    if($('#notebook-view'))$('#notebook-view').hidden=tab!=='notebook';
    $('.composer-area').hidden=tab==='notebook'||(state.doc==='live'&&tab==='concepts')||(state.doc==='live'&&state.bilingual&&tab==='translate');
    if(tab==='notebook')window.dispatchEvent(new Event('yanban-notebook-open'));
    if (tab === 'translate') renderTranslation();
    if (tab === 'concepts') renderConcepts();
    $('#assistant-body').scrollTop = 0;
  }
  function renderTranslation() {
    if(state.doc==='live'){renderLiveTranslation();return;}
    const root = $('#translate-view');
    if (state.doc === 'local') {root.innerHTML = '<p class="tab-intro">当前 PDF 仅支持本地预览，尚未连接解析和翻译服务。返回教学示例可体验双语阅读。</p><button class="button secondary" data-action="demo">打开教学示例</button>';return;}
    const {paragraph,section} = currentParagraph();
    root.innerHTML = `<p class="tab-intro">${state.selected ? '当前选中段落' : '先看当前章节的第一段，也可以在左侧选择其他段落。'}<br>本原型展示整段预置译文，以保留上下文。</p><div class="translation-card"><div class="source"><small>ORIGINAL · ${escape(section.label)}</small><p>${escape(paragraph.text)}</p></div><div class="translated"><small>中文译文 · 教学示例</small><p>${escape(paragraph.translation)}</p></div></div><button class="citation-chip" data-cite-section="${section.id}" data-cite-paragraph="${paragraph.id}">${icon('link')}回到这段原文 ${icon('up-right')}</button><div style="margin-top:18px"><button class="button secondary" data-save-paragraph="${paragraph.id}">${icon('bookmark')}保存原文摘录</button></div>`;
  }
  function renderConcepts() {
    const root = $('#concepts-view');
    if(state.doc==='live'){window.YanbanLearning.mount(root,{document:live.document,page:()=>live.page,selection:()=>state.selected,api,requireModel,ask:submitLiveQuestion,notify:toast});return;}
    if (state.doc === 'local') {root.innerHTML = '<p class="tab-intro">尚未解析当前 PDF，因此没有为它提取术语。返回教学示例后可体验基础概念卡片。</p><button class="button secondary" data-action="demo">打开教学示例</button>';return;}
    root.innerHTML = '<p class="tab-intro">读懂这篇示例所需的几个基础概念。<br>点击展开，在上下文中理解它们。</p>' + DATA.glossary.map((g,i)=>`<details class="concept-card" ${i===0?'open':''}><summary><span><strong>${escape(g.term)}</strong><small>${escape(g.zh)}</small></span><span>+</span></summary><p>${escape(g.definition)}</p></details>`).join('');
  }
  function messageHeader() {return `<div class="message-header"><span>${icon('spark')}</span><strong>研伴</strong><small>示例回答</small></div>`;}
  function renderWelcome() {
    const root = $('#messages');
    if(state.doc==='live'){renderLiveWelcome();return;}
    if (state.doc === 'local') {root.innerHTML = `<div class="message"><div class="message-header"><span>${icon('file')}</span><strong>本地预览已打开</strong></div><h3>${escape(state.localFile.name)}</h3><p>文件只在你的浏览器中打开，未上传到服务器。</p><p>这一版还没有接入 PDF 解析和模型服务，因此不会分析这个文件。你可以返回教学示例，体验完整的研读流程。</p><button class="button secondary" data-action="demo">体验教学示例 ${icon('right')}</button></div>`;return;}
    root.innerHTML = `<div class="message welcome-message">${messageHeader()}<h3 class="welcome-lead">一篇论文，<br>从读懂开始。</h3><p>我们从这份 RAG 入门示例出发，一起理清<span class="welcome-em">研究问题、方法与证据</span>。</p><div class="welcome-summary"><strong>这次阅读的小目标</strong><p>理解“先检索，再生成”的过程，并分清<span class="welcome-em">找到引用</span>和<span class="welcome-em">获得可靠结论</span>之间的关系。</p></div><p>你可以直接提问，也可以选中左侧的一段原文，让我陪你逐段理解。</p><button class="citation-chip" data-cite-section="abstract" data-cite-paragraph="abstract-1">${icon('link')}从摘要第一段开始 ${icon('up-right')}</button></div>`;
  }
  function appendUser(text) {const node = document.createElement('div');node.className = 'message user';node.textContent = text;$('#messages').appendChild(node);}
  function appendAnswer(key, fallbackText) {
    const node = document.createElement('div');node.className = 'message';
    const response = DATA.responses[key];
    if (!response) {node.innerHTML = messageHeader()+`<p>${escape(fallbackText)}</p>`;}
    else {
      node.innerHTML = messageHeader()+`<h3>${escape(response.title)}</h3>${response.paragraphs.map(p=>`<p>${escape(p)}</p>`).join('')}<button class="citation-chip" data-cite-section="${response.citation.section}" data-cite-paragraph="${response.citation.paragraph}">${icon('link')}${escape(response.citation.label)} ${icon('up-right')}</button><div class="response-followup">${escape(response.followup)}</div><div class="message-actions"><button data-action="notes">${icon('notebook')}整理到读书卡</button><button data-action="quiz">${icon('check-circle')}检查理解</button></div>`;
    }
    $('#messages').appendChild(node);
  }
  function chooseResponse(text) {
    if (/引用|证据|citation|可靠|正确|来源/i.test(text)) return 'citation';
    if (/局限|限制|风险|limitations|缺点/i.test(text)) return 'limitations';
    if (/翻译|translation/i.test(text)) return 'translation';
    if (/检索|生成|retrieval|top.?k|rag|区别|原理/i.test(text)) return 'retrieval';
    if (/核心|概述|摘要|介绍|思路|梳理|讲了什么|overview|研究问题/i.test(text)) return 'overview';
    return null;
  }
  function scrollChat() { const body=$('#assistant-body');body.scrollTo({top:body.scrollHeight,behavior:'smooth'}); }
  async function submitQuestion(supplied) {
    if(state.doc==='live'){await submitLiveQuestion(supplied);return;}
    const input = $('#question-input'); const text = (supplied || input.value).trim();
    if (!text || state.busy) return;
    if (text.length>2000) {toast('原型中每次问题最多 2000 字。');return;}
    input.value='';setTab('chat');setMobile('assistant');appendUser(text);state.messages.push(text);$('#prompt-suggestions').hidden=true;
    if (state.doc === 'local') {appendAnswer(null,'当前 PDF 尚未解析，无法根据它回答。请返回教学示例体验，或在后续接入真实模型后继续。');scrollChat();return;}
    const key=chooseResponse(text);
    state.busy=true;$('#send-button').disabled=true;
    const requestId=++state.requestId;
    const loading=document.createElement('div');loading.className='loading-message';loading.innerHTML='<span></span><span></span><span></span>展示预置教学回应';$('#messages').appendChild(loading);scrollChat();
    await new Promise(resolve=>setTimeout(resolve,360));
    loading.remove();
    if (requestId!==state.requestId) return;
    appendAnswer(key,'这是交互原型，尚未连接实时模型，这个问题暂无对应的预置回复。你可以试试“梳理核心思路”“检索和生成有什么区别”或“有引用就代表答案正确吗”。');
    state.busy=false;$('#send-button').disabled=false;scrollChat();
  }
  function resetChat() {state.requestId++;state.busy=false;state.messages=[];$('#send-button').disabled=false;$('#question-input').value='';renderWelcome();$('#prompt-suggestions').hidden=state.doc!=='demo';}
  function switchToDemo() {importRequestId++;persist();live.epoch++;live.cardBusy=false;state.doc='demo';window.dispatchEvent(new CustomEvent('yanban-document-change',{detail:'demo'}));loadDocumentNotes();rememberActive('demo');clearSelection();resetChat();renderPaper();setTab(state.tab);closeDialog('library-dialog');}
  function addExcerpt(id) {
    if(state.doc==='live'){addLiveExcerpt(id);return;}
    if(state.doc!=='demo'){toast('当前 PDF 尚未解析；摘录功能可在教学示例中体验。');return;}
    const match=paragraphById(id);if(!match)return;
    const text=state.selected?.id===id?state.selected.text:match.paragraph.text;
    if(state.excerpts.some(item=>item.text===text)){toast('这段原文已经保存在读书卡中。');return;}
    if(state.excerpts.length>=50){toast('当前示例最多保存 50 条摘录。');return;}
    state.excerpts.push({id:`excerpt-${Date.now()}-${Math.random().toString(16).slice(2,8)}`,paragraph:id,section:match.section.id,label:match.section.label,text});const saved=persist();renderNotes();toast(saved?'已保存到读书卡 · 原文摘录':'已加入当前读书卡，但浏览器保存失败，请及时导出。');
  }
  const cardFields=[['problem','研究问题','这篇材料在解释什么问题？'],['method','方法与思路','用自己的话写下核心过程。'],['evidence','关键证据','哪些原文支持你的理解？'],['limitations','成立条件与局限','哪些结论需要更多证据？'],['questions','我的疑问与下一步','记下还没读懂的地方。']];
  function renderNotes() {
    $('.notes-source>span:nth-child(2)').textContent=state.doc==='live'?live.document.title||live.document.filename:state.doc==='local'?state.localFile.name+' · 仅预览':'理解检索增强生成 · 教学示例';
    const fillButton=$('[data-action="fill-notes"]');fillButton.innerHTML=icon('spark')+(state.doc==='live'?(live.cardBusy?'正在整理…':'AI 填写空白栏目'):'填入示例读书卡');fillButton.disabled=state.doc==='local'||live.cardBusy;
    $('#notes-fields').innerHTML=cardFields.map(([key,label,placeholder],i)=>`<div class="notes-field"><label for="note-${key}"><span>${String(i+1).padStart(2,'0')}</span>${label}</label><div class="model-answer card-math-preview" data-card-preview="${key}">${renderMath(state.card[key])||'<p>尚未填写</p>'}</div><details class="card-edit"><summary>编辑内容 / LaTeX</summary><textarea id="note-${key}" data-note="${key}" placeholder="${placeholder}" maxlength="10000">${escape(state.card[key])}</textarea></details></div>`).join('');
    $('#excerpt-count').textContent=`${state.excerpts.length} 条`;
    $('#excerpts-list').innerHTML=state.excerpts.length?state.excerpts.map(item=>`<div class="excerpt"><p>${escape(item.text)}</p><div><button ${state.doc==='live'?`data-live-cite="${escape(item.paragraph)}"`:`data-cite-section="${escape(item.section)}" data-cite-paragraph="${escape(item.paragraph)}"`} data-close-notes="true">${escape(item.label)} · 原文 ${escape(item.paragraph)}</button><button data-delete-excerpt="${escape(item.id)}" aria-label="删除这条摘录">移除</button></div></div>`).join(''):'<div class="empty-state">在论文中选中一段原文，点击“摘录”，这里就会留下可回溯的阅读线索。</div>';
  }
  function fillNotes() {
    if(state.doc==='live'){fillLiveNotes();return;}
    if(state.doc!=='demo')return;
    let filled=0;for(const key of Object.keys(defaultCard)){if(!state.card[key].trim()){state.card[key]=DATA.readingCard[key];filled++;}}
    persist();renderNotes();toast(!lastSaveSucceeded?'已填入当前页面，但未能保存，请导出备份。':filled?'已填入空白栏目，保留了你已有的笔记。':'读书卡已有内容，未覆盖你的笔记。');
  }
  function exportNotes() {
    if(state.doc!=='demo'){exportLiveNotes();return;}
    const text=['# 研伴读书卡','',`论文：${DATA.title}`,'','> 原创教学示例，非真实发表论文。示例回答为预置内容；以下笔记可由使用者编辑。','',...cardFields.flatMap(([key,label])=>[`## ${label}`,'',state.card[key].trim()||'尚未填写。','']),'## 原文摘录','',...state.excerpts.flatMap(item=>[item.text,'',`来源：教学示例 / ${item.label} / 段落 ${item.paragraph}`,'']),'---','由研伴交互原型导出。'];
    const blob=new Blob(['\ufeff'+text.join('\n')],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='研伴-检索增强生成-读书卡.md';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('读书卡已导出为 Markdown。');
  }
  function renderQuiz() {
    const quiz=DATA.quiz;const answered=state.quizAnswer!==null;const correct=state.quizAnswer===quiz.correctIndex;
    $('#quiz-content').innerHTML=`<p class="quiz-question">${escape(quiz.question)}</p><div class="quiz-options">${quiz.options.map((option,i)=>`<button class="quiz-option ${state.quizAnswer===i?'chosen':''} ${answered&&i===quiz.correctIndex?'correct':''}" data-answer="${i}" ${answered?'disabled':''}><span>${String.fromCharCode(65+i)}</span>${escape(option)}</button>`).join('')}</div>${answered?`<div class="quiz-feedback" role="status"><strong>${correct?'这个判断有依据。':'再想想“定位”与“验证”的区别。'}</strong>${escape(quiz.explanation)}</div>`:''}<div class="quiz-footer"><span>本题使用预设参考答案，不代表掌握度评估。</span>${answered?'<button class="text-button" data-action="reset-quiz">重新思考</button>':''}</div>`;
  }
  function openDialog(id) {
    if(id==='notes-dialog')renderNotes();
    if(id==='quiz-dialog'){if(state.doc!=='demo'){toast('预设理解检查仅针对教学示例。');return;}renderQuiz();}
    if(id==='library-dialog'){renderLocalFileEntry();renderServerLibrary();if(live.connected)refreshDocuments();}
    if(id==='settings-dialog')renderSettings();
    const dialog=document.getElementById(id);if(!dialog.open)dialog.showModal();
  }
  function closeDialog(id) {document.getElementById(id)?.close();}
  function renderLocalFileEntry(){ $('#local-paper-entry').innerHTML=state.localFile?`<div class="library-section-label" style="margin-top:22px">本次打开的文件</div><button class="library-paper" data-action="local"><span class="library-cover">${icon('file')}</span><span class="library-paper-info"><span class="tag">仅本地预览</span><strong>${escape(state.localFile.name)}</strong><span>${(state.localFile.size/1024/1024).toFixed(2)} MB · 刷新后需重新选择</span></span>${icon('right')}</button>`:'';}
  async function importPDF(file){
    if(!file)return;
    if(live.checking){toast('正在初始化阅读组件，请稍后再导入。');return;}
    if(live.connected){await uploadLivePDF(file);return;}
    const thisImport=++importRequestId;
    if(file.size>20*1024*1024){toast('请选择不超过 20 MB 的 PDF。');return;}
    if(!/\.pdf$/i.test(file.name)){toast('请选择 PDF 文件。');return;}
    try {
      const header=await file.slice(0,5).text();if(thisImport!==importRequestId)return;if(header!=='%PDF-'){toast('文件内容不是有效的 PDF。');return;}
      persist();live.epoch++;const previous=state.localFile;state.localFile={name:file.name,size:file.size,url:URL.createObjectURL(file),key:`local-${file.name}-${file.size}-${file.lastModified}`};state.doc='local';loadDocumentNotes();
      clearSelection();resetChat();renderPaper();setTab('chat');setMobile('reader');closeDialog('library-dialog');$('#paper-count').textContent='2';
      if(previous)URL.revokeObjectURL(previous.url);
      toast('PDF 已在本地打开，尚未进行 AI 解析。');
    }catch(_){toast('无法读取这个文件，请重新选择 PDF。');}
  }
  function setMobile(view){if(view==='assistant'){document.body.classList.remove('focus-mode');$('[data-action="focus"]').setAttribute('aria-pressed','false');}document.body.classList.toggle('mobile-assistant',view==='assistant');$$('[data-mobile]').forEach(b=>b.classList.toggle('active',b.dataset.mobile===view));}
  const actions={
    workspace(){setMobile('reader');},library(){openDialog('library-dialog');},notes(){openDialog('notes-dialog');},about(){openDialog('about-dialog');},settings(){openDialog('settings-dialog');},'test-model'(){saveModel(true);},'refresh-connection'(){checkConnection(false);},demo(){switchToDemo();setMobile('reader');},local(){if(!state.localFile)return;persist();live.epoch++;state.doc='local';loadDocumentNotes();clearSelection();resetChat();renderPaper();setTab('chat');setMobile('reader');closeDialog('library-dialog');},
    prev(){if(state.doc==='live'){setLivePage(live.page-1);return;}const i=knownSections.indexOf(state.section);if(i>0)setSection(knownSections[i-1]);},next(){if(state.doc==='live'){setLivePage(live.page+1);return;}const i=knownSections.indexOf(state.section);if(i<knownSections.length-1)setSection(knownSections[i+1]);},
    'zoom-fit'(){state.zoom=1;renderPaper();},'zoom-in'(){state.zoom=Math.min(2.5,Math.round((state.zoom+.1)*10)/10);renderPaper();},'zoom-out'(){state.zoom=Math.max(.8,Math.round((state.zoom-.1)*10)/10);renderPaper();},focus(){const on=document.body.classList.toggle('focus-mode');$('[data-action="focus"]').setAttribute('aria-pressed',String(on));if(state.doc==='live')renderPaper();},
    'clear-selection':clearSelection,'page-translation'(){clearSelection();setTab('translate');},
    'translate-selection'(){if(!state.selected)return;setTab('translate');setMobile('assistant');if(state.doc==='live'){if(state.selected.fragment)translateLiveSelection();else translateLiveParagraph(state.selected.id);}},
    'explain-selection'(){if(!state.selected)return;if(state.doc==='live'){submitQuestion('请用适合科研新手的语言解释选中段落，说明其中的关键概念，并区分原文内容和补充背景。');return;}const {section}=currentParagraph();submitQuestion(section.id==='abstract'?'帮我梳理这篇示例的核心思路':section.id==='method'?'解释检索与生成的方法':section.id==='evidence'?'有引用就代表答案正确吗？':'解释这篇示例的局限');},
    'save-selection'(){if(state.selected)addExcerpt(state.selected.id);},'fill-notes':fillNotes,'export-notes':exportNotes,quiz(){openDialog('quiz-dialog');},'reset-quiz'(){state.quizAnswer=null;persist();renderQuiz();}
  };
  document.addEventListener('click',event=>{
    const target=event.target.closest('button,a,label');if(!target)return;
    if(target.matches('a.brand')){event.preventDefault();actions.workspace();return;}
    if(target.dataset.action){actions[target.dataset.action]?.();return;}
    if(target.dataset.close){closeDialog(target.dataset.close);return;}
    if(target.dataset.liveDocument){loadLiveDocument(target.dataset.liveDocument);return;}
    if(target.dataset.livePage){setLivePage(Number(target.dataset.livePage));return;}
    if(target.dataset.liveCite){if(target.dataset.closeNotes)closeDialog('notes-dialog');jumpLiveCitation(target.dataset.liveCite);return;}
    if(target.dataset.translateGroup){const ids=target.dataset.translateGroup.split(',');selectLiveParagraph(ids[0],ids.map(id=>liveParagraph(id).text).join('\n'));state.selected.ids=ids;state.selected.fragment=true;live.selectionTranslation=null;setTab('translate');if(!/[A-Za-z]{3,}/.test(state.selected.text)){live.selectionTranslation={source:state.selected.text,text:'这组公式已按上方原文排版保留。可在对话中询问符号含义和推导。'};renderLiveTranslation();}else translateLiveSelection();return;}
    if(target.dataset.liveTranslate){translateLiveParagraph(target.dataset.liveTranslate);return;}
    if(target.dataset.section){setSection(target.dataset.section);return;}
    if(target.dataset.pageTranslate){if(target.dataset.pageTranslate==='pause')pageTranslator.cancel();else startPageTranslation();return;}
    if(target.dataset.view){pageTranslator.cancel();state.bilingual=target.dataset.view==='bilingual';live.pdfView=state.doc==='live';clearSelection();renderPaper();if(state.bilingual){setTab('translate');startPageTranslation();}else setTab('chat');return;}
    if(target.dataset.tab){setTab(target.dataset.tab);return;}
    if(target.dataset.mobile){setMobile(target.dataset.mobile);return;}
    if(target.dataset.prompt){submitQuestion(target.dataset.prompt);return;}
    if(target.dataset.citeSection){if(target.dataset.closeNotes)closeDialog('notes-dialog');setSection(target.dataset.citeSection,target.dataset.citeParagraph);setMobile('reader');return;}
    if(target.dataset.translateParagraph){selectParagraph(target.dataset.translateParagraph);setTab('translate');setMobile('assistant');if(state.doc==='live')translateLiveParagraph(target.dataset.translateParagraph);return;}
    if(target.dataset.saveParagraph){addExcerpt(target.dataset.saveParagraph);return;}
    if(target.dataset.deleteExcerpt){state.excerpts=state.excerpts.filter(item=>item.id!==target.dataset.deleteExcerpt);persist();renderNotes();return;}
    if(target.dataset.answer!==undefined){state.quizAnswer=Number(target.dataset.answer);persist();renderQuiz();}
  });
  $('#paper-page').addEventListener('mouseup',event=>{
    if(event.target.closest('button'))return;
    const selection=window.getSelection();
    if(state.doc==='live'&&selection&&!selection.isCollapsed&&selection.rangeCount){
      const range=selection.getRangeAt(0),paper=$('#paper-page');
      if(paper.contains(range.startContainer)&&paper.contains(range.endContainer)){
        if(live.pdfView){
          const fragments=[],ids=[];
          for(const el of $$('.textLayer span[data-pdf-paragraph]',paper)){
            if(!range.intersectsNode(el))continue;const part=document.createRange();part.selectNodeContents(el);
            if(el.contains(range.startContainer))part.setStart(range.startContainer,range.startOffset);
            if(el.contains(range.endContainer))part.setEnd(range.endContainer,range.endOffset);
            const text=part.toString().trim();if(text){fragments.push(text);if(!ids.includes(el.dataset.pdfParagraph))ids.push(el.dataset.pdfParagraph);}
          }
          if(fragments.length){showSelectedFragment(ids,fragments.join(' '));return;}
        }
        const fragments=[],ids=[];
        for(const el of $$('.paper-paragraph .original',paper)){
          if(!range.intersectsNode(el))continue;
          const part=document.createRange();part.selectNodeContents(el);
          if(el.contains(range.startContainer))part.setStart(range.startContainer,range.startOffset);
          if(el.contains(range.endContainer))part.setEnd(range.endContainer,range.endOffset);
          const text=part.toString().trim();if(text){fragments.push(text);ids.push(...(el.dataset.sourceIds||el.closest('[data-paragraph]').dataset.paragraph).split(','));}
        }
        if(fragments.length){showSelectedFragment(ids,fragments.join('\n'));return;}
      }
    }
    if(state.doc==='live'&&state.selected?.fragment&&(!selection||selection.isCollapsed)){clearSelection();return;}
    const paragraph=event.target.closest('[data-paragraph]');if(paragraph)selectParagraph(paragraph.dataset.paragraph);
  });
  $('#paper-page').addEventListener('keyup',event=>{if(event.shiftKey&&event.key.startsWith('Arrow'))event.target.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));});
  $('#paper-page').addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.matches('[data-paragraph]')){event.preventDefault();selectParagraph(event.target.dataset.paragraph);}});
  $('#send-button').addEventListener('click',()=>submitQuestion());
  $('#question-input').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();submitQuestion();}});
  $('#notes-fields').addEventListener('input',event=>{const key=event.target.dataset.note;if(!Object.hasOwn(defaultCard,key))return;state.card[key]=event.target.value;$('[data-card-preview="'+key+'"]').innerHTML=renderMath(event.target.value);const saved=persist();$('#save-status').textContent=saved?'已保存':'暂未保存';clearTimeout(saveTimer);saveTimer=setTimeout(()=>{$('#save-status').textContent=lastSaveSucceeded?'浏览器保存':'请导出备份';},1500);});
  $$('.file-input').forEach(input=>input.addEventListener('change',()=>{importPDF(input.files[0]);input.value='';}));
  const dropzone=$('#upload-dropzone');
  dropzone.addEventListener('dragover',event=>{event.preventDefault();dropzone.classList.add('dragover');});dropzone.addEventListener('dragleave',()=>dropzone.classList.remove('dragover'));dropzone.addEventListener('drop',event=>{event.preventDefault();dropzone.classList.remove('dragover');importPDF(event.dataTransfer.files[0]);});
  $$('.modal').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}}));
  const tabButtons=$$('[data-tab]');tabButtons.forEach(button=>{const tab=button.dataset.tab;button.id=`tab-${tab}`;button.setAttribute('aria-controls',`${tab}-view`);const panel=$(`#${tab}-view`);panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const index=tabButtons.indexOf(button);const next=event.key==='Home'?0:event.key==='End'?tabButtons.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabButtons.length)%tabButtons.length;setTab(tabButtons[next].dataset.tab);tabButtons[next].focus();});});
  document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();document.body.classList.remove('focus-mode');setMobile('assistant');$('#question-input').focus();}if(event.key==='Escape')clearSelection();});
  window.addEventListener('beforeunload',()=>{if(state.localFile)URL.revokeObjectURL(state.localFile.url);});
  function documentKey(){return state.doc==='live'?`document:${live.document.id}`:state.doc==='local'?state.localFile.key:'demo';}
  function loadDocumentNotes(){
    const saved=live.cards[documentKey()]||{};
    state.card=Object.fromEntries(Object.keys(defaultCard).map(key=>[key,typeof saved.card?.[key]==='string'?saved.card[key].slice(0,10000):'']));
    state.excerpts=Array.isArray(saved.excerpts)?saved.excerpts.slice(0,50).flatMap((item,index)=>{
      if(!item||typeof item.text!=='string')return [];
      if(state.doc==='live'){const paragraph=liveParagraph(item.paragraph);return paragraph?[{id:`restored-${index}`,paragraph:paragraph.id,page:paragraph.page,label:`第 ${paragraph.page} 页`,text:item.text.slice(0,20000)}]:[];}
      if(state.doc==='demo'){const match=paragraphById(item.paragraph);return match?[{id:`restored-${index}`,paragraph:match.paragraph.id,section:match.section.id,label:match.section.label,text:item.text.slice(0,20000)}]:[];}
      return [];
    }):[];
    updateNoteCount();
  }
  function rememberActive(id){try{localStorage.setItem(ACTIVE_KEY,id);}catch(_) {}}
  function liveParagraph(id){return live.document?.paragraphs.find(p=>p.id===id);}
  function liveCurrentParagraph(){return liveParagraph(state.selected?.id)||live.document?.paragraphs.find(p=>p.page===live.page)||live.document?.paragraphs[0];}
  function parserLabel(value){return String(value||'').toLowerCase().includes('pypdf')?'基础文本提取 · pypdf':String(value||'').toLowerCase().includes('docling')?'Docling 结构化解析':String(value||'解析器未知');}
  function renderSuggestions(){
    const suggestions=state.doc==='live'?[['这篇论文在解决什么问题？请引用原文。','梳理研究问题'],['请按步骤解释这篇论文的方法，并指出关键假设。','读懂研究方法'],['哪些证据支持论文结论？有哪些局限？','检查证据与局限']]:[['这篇论文的核心思路是什么？','先帮我梳理核心思路'],['检索和生成有什么区别？','检索和生成有什么区别？'],['有引用就代表答案正确吗？','有引用就代表答案正确吗？']];
    $('#prompt-suggestions').innerHTML='<div class="suggestion-label">可以从这里开始</div>'+suggestions.map(([q,label])=>`<button data-prompt="${escape(q)}">${icon('spark')}${label}${icon('up-right')}</button>`).join('');
  }
  function renderLiveOutline(){
    const doc=live.document;
    $('#outline').innerHTML=Array.from({length:doc.page_count},(_,i)=>i+1).map(page=>`<button data-live-page="${page}" class="${page===live.page?'active':''}" ${page===live.page?'aria-current="location"':''}><span class="outline-number">${String(page).padStart(2,'0')}</span><span>第 ${page} 页</span>${live.visited.has(page)?'<span class="visited" title="已浏览"></span>':''}</button>`).join('');
    $('#progress-count').textContent=`${live.visited.size} / ${doc.page_count} 页`;
    $('#progress-fill').style.width=`${live.visited.size/Math.max(doc.page_count,1)*100}%`;
  }
  function renderLivePaper(){
    const doc=live.document, page=$('#paper-page');live.visited.add(live.page);
    $('.paper-disclaimer').hidden=false;
    live.pdfView=true;$('.paper-disclaimer').textContent='完整原页 · 图表与公式均保留，可放大阅读';
    $('.page-navigation').hidden=false;
    $('[data-view="pdf"]').hidden=true;
    $$('[data-view]').forEach(button=>{button.disabled=false;const active=button.dataset.view===(state.bilingual?'bilingual':'original');button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});
    $$('.reader-tools button').forEach(button=>{button.disabled=false;});
    $('#top-doc-title').textContent=doc.title||doc.filename;
    $('.paper-nav-card').dataset.action='workspace';$('.paper-nav-card strong').textContent=doc.title||doc.filename;$('.paper-nav-card small').textContent=`当前论文 · ${doc.page_count} 页`;
    $('#reader-context').textContent=state.bilingual?'完整原文在左 · 本页中文在右 · 点击译文出处可定位原文':'完整 PDF 原文 · 可放大、划选翻译或记笔记';
    $('#context-label').textContent=state.selected?`已选 ${state.selected.id} · 结合原文`:'基于当前论文检索';
    $('.composer-hint span:last-child').textContent='相关片段会发送至模型服务';
    $('[data-tab="concepts"]').textContent='学习引导';
    $('.demo-notice').innerHTML=`${icon(live.configured?'link':'lock')}<span>${live.configured?'真实论文 · 回答请核对原文':'PDF 已解析 · 配置模型后可翻译和问答'}</span>${live.configured?'':'<button data-action="settings">配置模型</button>'}`;
    $('.understanding-entry').hidden=true;
    renderSuggestions();$('#prompt-suggestions').hidden=state.messages.length>0;
    page.classList.add('local-pdf','real-paper');
    page.innerHTML='<div class="pdf-page-host"><p class="pdf-loading">正在载入完整原页…</p></div>';
    const host=page.querySelector('.pdf-page-host');
    live.pdfReady=window.YanbanPDF.mount(doc.id,live.page,host,{zoom:state.zoom}).catch(e=>{if(host.isConnected)host.textContent='原页显示失败：'+e.message;});
    if(state.bilingual&&state.tab==='translate')renderLiveTranslation();
    $('#page-counter').textContent=`${String(live.page).padStart(2,'0')} / ${String(doc.page_count).padStart(2,'0')}`;
    $('#section-footer').textContent=`第 ${live.page} / ${doc.page_count} 页`;$('[data-action="prev"]').innerHTML=icon('left')+'上一页';$('[data-action="next"]').innerHTML='下一页'+icon('right');
    $('[data-action="prev"]').disabled=live.page<=1;$('[data-action="next"]').disabled=live.page>=doc.page_count;
    $('#zoom-label').textContent=`${Math.round(state.zoom*100)}%`;renderLiveOutline();
  }
  function setLivePage(page){if(state.doc!=='live'||page<1||page>live.document.page_count)return;pageTranslator.cancel();live.page=page;clearSelection();renderLivePaper();if(state.tab==='translate')renderTranslation();$('#reader-scroll').scrollTop=0;if(state.tab==='translate')$('#assistant-body').scrollTop=0;if(state.bilingual)startPageTranslation();}
  async function jumpLiveCitation(id){
    const paragraph=liveParagraph(id);if(state.doc!=='live'||!paragraph){toast('此引用不在当前论文中。');return;}
    if(live.page!==paragraph.page)setLivePage(paragraph.page);
    const docId=live.document.id;await live.pdfReady;
    if(live.document.id!==docId||live.page!==paragraph.page)return;
    const nodes=$$('.textLayer [data-pdf-paragraph]').filter(n=>n.dataset.pdfParagraph===id);
    nodes.forEach(n=>n.classList.add('pdf-citation-highlight'));
    nodes[0]?.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});
    setTimeout(()=>nodes.forEach(n=>n.classList.remove('pdf-citation-highlight')),3500);setMobile('reader');
  }
  function selectLiveParagraph(id,text=''){
    const paragraph=liveParagraph(id);if(!paragraph)return;selectionTranslator.cancel();state.selected={id,text:text||paragraph.text};
    $$('.paper-paragraph').forEach(el=>el.classList.toggle('selected',el.dataset.paragraph===id));
    $('#selection-label').textContent=`已选 ${id}${text?' 片段':' 整段'}`;$('#selection-bar').hidden=false;$('#context-label').textContent=`已选 ${id} · 结合原文`;
    if(state.tab==='translate')renderLiveTranslation();
  }
  const selectionTranslator=window.YanbanSelectionTranslator({
    async translate(input,signal){
      const result=await api('/api/translate',{method:'POST',signal,body:{document_id:input.documentId,selection:{text:input.text,paragraph_ids:input.ids}}});
      return result.translations?.[0]?.text;
    },
    onChange(result){
      live.selectionBusy=['waiting','running'].includes(result.status);live.selectionStatus=result.status;
      if(!result.input){live.selectionTranslation=null;live.selectionError='';return;}
      const input=result.input;
      if(state.doc!=='live'||live.document.id!==input.documentId||live.epoch!==input.epoch||state.selected?.text!==input.text)return;
      live.selectionTranslation=result.status==='done'?{source:input.text,text:result.text}:null;live.selectionError=result.error;
      if(state.tab==='translate')renderLiveTranslation();
    }
  });
  function showSelectedFragment(ids,text){
    ids=[...new Set(ids)];
    if(state.selected?.fragment&&state.selected.text===text&&JSON.stringify(state.selected.ids)===JSON.stringify(ids)){
      setTab('translate');setMobile('assistant');return;
    }
    selectLiveParagraph(ids[0],text);state.selected.ids=ids;state.selected.fragment=true;
    setTab('translate');setMobile('assistant');
    if(live.configured)translateLiveSelection(false);else renderLiveTranslation();
  }
  function translateLiveSelection(force=true){
    if(force&&live.selectionBusy)return;
    if(!state.selected?.fragment||!requireModel())return;
    const selected=state.selected;
    selectionTranslator.select({documentId:live.document.id,epoch:live.epoch,ids:selected.ids,text:selected.text,model:live.config?.model,baseURL:live.config?.base_url},{force,immediate:force});
  }
  function renderLiveTranslation(){
    if(state.bilingual&&!state.selected){renderBilingualPage();return;}
    if(state.selected?.fragment){
      const selected=state.selected,translated=live.selectionTranslation?.source===selected.text?live.selectionTranslation.text:'';
      $('#translate-view').innerHTML=`${state.bilingual?'<button class="back-page-translation" data-action="page-translation">← 返回本页译文</button>':''}<div class="selection-heading"><span class="eyebrow">SELECTED PASSAGE</span><h3>翻译你选中的语段</h3><p>${selected.text.length} 字符 · ${selected.ids.length} 个段落</p></div><div class="translation-card"><div class="source"><small>选中原文</small><div class="selected-original">${/[\x00-\x08\x0e-\x1f∑⎡⎤]/.test(selected.text)?`<div data-original-id="${escape(selected.ids[0])}"><span class="formula-loading">正在还原原文排版…</span></div>`:`<p>${escape(selected.text)}</p>`}</div></div><div class="translated"><small>中文译文</small>${translated?window.YanbanFormat.render(translated):`<p role="status">${live.selectionBusy?(live.selectionStatus==='waiting'?'选文已就绪，正在准备翻译…':'正在翻译选中的语段…'):live.selectionError?'本次翻译未完成，可重试。':live.configured?'正在准备自动翻译…':'配置 API Key 后即可自动翻译选文。'}</p>`}</div></div><button class="button primary" id="translate-fragment" ${live.selectionBusy?'disabled':''}>${live.selectionBusy?'正在翻译…':translated?'重新翻译选文':live.configured?'重试翻译':'配置模型并翻译'}</button>${live.selectionError?`<p class="inline-error">${escape(live.selectionError)}</p>`:''}`;
      $('#translate-fragment').onclick=()=>translateLiveSelection(true);window.YanbanPDF?.fragments?.(live.document.id,liveParagraph(selected.ids[0]).page,$('#translate-view')).catch(()=>{});return;
    }

    const paragraph=liveCurrentParagraph(),root=$('#translate-view');
    if(!paragraph){root.innerHTML='<p class="tab-intro">当前论文没有可翻译的文本，请先查看解析提示。</p>';return;}
    const translation=live.translations.get(paragraph.id),busy=live.translationBusy.has(paragraph.id);
    root.innerHTML=`${state.bilingual?'<button class="back-page-translation" data-action="page-translation">← 返回本页译文</button>':''}<p class="tab-intro">翻译当前整段以保留上下文。只有点击翻译时才会发送该段原文至模型服务。</p><div class="translation-card"><div class="source"><small>ORIGINAL · 第 ${paragraph.page} 页 · ${escape(paragraph.id)}</small><div data-original-id="${escape(paragraph.id)}"><span class="formula-loading">正在还原原文排版…</span></div></div><div class="translated"><small>中文译文 · ${translation?'模型生成，请核对':'等待生成'}</small>${translation?`<div class="model-answer">${renderMath(translation)}</div>`:`<p>${busy?'正在翻译，请稍候…':'尚未翻译这一段。'}</p>`}</div></div>${live.translationErrors.has(paragraph.id)?`<p class="inline-error">${escape(live.translationErrors.get(paragraph.id))}</p>`:''}<div class="translation-actions"><button class="button primary" data-live-translate="${escape(paragraph.id)}" ${busy?'disabled':''}>${icon('translate')}${busy?'正在翻译…':translation?'重新翻译本段':'翻译这一段'}</button><button class="citation-chip" data-live-cite="${escape(paragraph.id)}">${icon('link')}原文</button></div>`;
    window.YanbanPDF?.fragments?.(live.document.id,paragraph.page,root).catch(()=>{const n=root.querySelector('.formula-loading');if(n)n.textContent='原文排版暂不可用，请查看左侧原页。';});
  }
  function renderBilingualPage(){
    const root=$('#translate-view'),key=live.document.id+':'+live.page;
    if(root.querySelector('.bilingual-page')?.dataset.pageKey!==key){
      const paragraphs=live.document.paragraphs.filter(p=>p.page===live.page&&!/^Authorized licensed use/.test(p.text));
      root.innerHTML=`<section class="bilingual-page" data-page-key="${escape(key)}"><header class="bilingual-heading"><span>中英对照</span><h3>第 ${live.page} 页 · 中文译文</h3><p>图表、公式与英文原文完整保留在左侧。译文由模型生成，请结合原文核对。</p></header><div id="page-translation-status" class="bilingual-note" role="status"></div>${paragraphs.length?paragraphs.map(p=>`<article class="bilingual-paragraph"><button class="translation-source" data-live-cite="${escape(p.id)}" title="定位左侧原文">${escape(p.id)} <span>查看原文 ↗</span></button><div class="translation untranslated" data-translation-id="${escape(p.id)}">等待自动翻译…</div></article>`).join(''):'<p>本页没有提取到文字，图表仍可在左侧完整查看。</p>'}</section>`;
    }
    updatePageTranslations();
  }
  function renderLiveWelcome(){
    const doc=live.document;
    $('#messages').innerHTML=`<div class="message welcome-message"><div class="message-header"><span>${icon('file')}</span><strong>论文已准备好</strong><small>${escape(parserLabel(doc.parser))}</small></div><h3 class="welcome-lead">从原文出发，<br>把问题问清楚。</h3><p>${escape(doc.title||doc.filename)}</p><div class="welcome-summary"><strong>${doc.page_count} 页 · ${doc.paragraphs.length} 个解析段落</strong><p>选中左侧一段原文开始，或提一个问题。研伴会检索相关片段，再调用模型解释，并附上可定位的出处。</p></div><p>论文存在当前浏览器。你主动提问或翻译时，相关文字会发送到所选模型服务。</p>${live.configured?'':'<button class="button primary" data-action="settings">配置 API Key，开始问答</button><p>还没有 Key 也可以阅读、摘录和编辑读书卡。</p>'}</div>`;
  }
  async function api(path,{method='GET',body,timeout=180000,signal}={}){
    if(!live.connected)throw new Error('阅读组件尚未就绪，请刷新网页后重试。');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
    const headers={Accept:'application/json'};if(method!=='GET')headers['X-Yanban-Token']=live.csrf;
    let payload=body;if(body!==undefined&&!(body instanceof FormData)){headers['Content-Type']='application/json';payload=JSON.stringify(body);}
    try{const response=await fetch(path,{method,headers,body:payload,credentials:'same-origin',signal:signal?AbortSignal.any([signal,controller.signal]):controller.signal,cache:'no-store'});let data;try{data=await response.json();}catch(_){throw new Error('请求没有返回有效结果，请刷新后重试。');}if(!response.ok){const detail=data?.detail;throw new Error(typeof detail==='string'?detail:detail?.message||`请求失败（${response.status}）`);}return data;}
    catch(error){if(error.name==='AbortError')throw new Error('请求等待超时。请稍后重试，避免连续重复发起模型调用。');if(error instanceof TypeError)throw new Error('无法完成请求，请检查网络并刷新网页。');throw error;}
    finally{clearTimeout(timer);}
  }
  async function checkConnection(restore=false){
    live.checking=true;renderConnection();const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7000);
    try{
      if(!/^https?:$/.test(location.protocol))throw new Error('offline');
      const response=await fetch('/api/status',{signal:controller.signal,headers:{Accept:'application/json'},cache:'no-store'});const status=await response.json();
      if(!response.ok||status.service!=='yanban'||typeof status.csrf_token!=='string')throw new Error('offline');
      live.connected=true;live.configured=Boolean(status.configured);live.csrf=status.csrf_token;live.config={provider:status.provider,model:status.model,base_url:status.base_url,has_api_key:live.configured,key_storage:'none'};
      try{live.config=await api('/api/config');live.configured=Boolean(live.config.has_api_key);}catch(_){}
      await refreshDocuments();
      if(restore){let active;try{active=localStorage.getItem(ACTIVE_KEY);}catch(_){}if(active&&active!=='demo'&&live.documents.some(doc=>doc.id===active))await loadLiveDocument(active);}
    }catch(_){live.connected=false;live.configured=false;live.csrf='';}
    finally{clearTimeout(timer);live.checking=false;renderConnection();if($('#settings-dialog').open)renderSettings();if(state.doc==='live'){renderLivePaper();if(!state.messages.length)renderLiveWelcome();}}
  }
  function renderConnection(){
    const badge=$('#connection-badge');badge.classList.toggle('connected',live.connected);badge.innerHTML=`<span></span>${live.checking?'检查连接':live.connected?live.configured?'模型已配置':'配置模型':'静态体验版'}`;
    $('#parser-options').hidden=!live.connected;
    $('#upload-caption').textContent=live.connected?'在浏览器解析 · 最大 20 MB / 100 页':'仅在浏览器预览 · 最大 20 MB';
    $('#upload-note').innerHTML=live.checking?'正在初始化阅读组件。':live.connected?'PDF 在本机解析与保存，不需要模型 Key。此集成版未启用账号云同步。发起 AI 任务时，相关文字发送给 DeepSeek。':'浏览器功能尚未就绪，请刷新网页后重试。';
    $$('.file-input').forEach(input=>input.disabled=live.checking||live.uploadBusy);
  }
  const modelChoices={deepseek:[['deepseek-flash','DeepSeek V4.1 Flash（推荐）'],['deepseek-v4-pro','DeepSeek V4 Pro'],['deepseek-v4-flash','V4 Flash 旧编号（实际调用 V4.1 Flash）'],['deepseek-v4-flash-vision-exp','V4 Flash Vision 旧编号（实际调用 V4.1 Flash）']],qwen:[['qwen-plus','Qwen Plus']]};
  function renderModelPicker(provider,model){
    const choices=modelChoices[provider]||[],picker=$('#model-choice');
    picker.replaceChildren(...choices.map(([id,label])=>new Option(label,id)),new Option('其他型号（手动填写）','__custom__'));
    picker.value=choices.some(([id])=>id===model)?model:'__custom__';
    $('#model-name').value=model;
    updateModelChoice(false);
  }
  function updateModelChoice(clearKnown=true){
    const choice=$('#model-choice').value,manual=choice==='__custom__',input=$('#model-name');
    if(!manual)input.value=choice;
    else if(clearKnown&&(modelChoices[$('#model-provider').value]||[]).some(([id])=>id===input.value))input.value='';
    $('#custom-model-field').hidden=!manual;input.disabled=!manual;input.required=manual;
    const legacy=$('#model-provider').value==='deepseek'&&['deepseek-v4-flash','deepseek-v4-flash-vision-exp'].includes(choice);
    $('#model-choice-help').textContent=manual?'填写服务商提供的准确模型编号，不能自行命名。':legacy?'兼容旧编号：官方实际提供 V4.1 Flash，并按 Flash 计费，不会切回旧模型。选择后点击“保存配置”。':`模型编号：${choice}。选择后点击“保存配置”，后续提问和翻译会使用所选型号。`;
  }
  function renderSettings(){
    $('#model-fields').disabled=!live.connected||live.settingsBusy;
    $('#settings-connection').classList.toggle('offline',!live.connected);
    $('#settings-connection').innerHTML=live.checking?'正在检查本地连接。':live.connected?`浏览器模式已就绪 · ${live.configured?'已配置模型密钥':'尚未配置密钥；可以先解析 PDF'}`:'当前是静态体验页面，不能接收 API Key。请运行本地启动脚本，再打开 <a href="http://127.0.0.1:4317" target="_blank" rel="noopener noreferrer">http://127.0.0.1:4317 ↗</a> 配置。';
    if(live.config){$('#model-provider').value=['qwen','deepseek','custom'].includes(live.config.provider)?live.config.provider:'custom';$('#model-url').value=live.config.base_url||'';$('#model-name').value=live.config.model||'';$('#model-remember').checked=live.config.key_storage==='browser-local';}
    renderModelPicker($('#model-provider').value,$('#model-name').value);
    $('#model-key').value='';$('#model-key').placeholder=live.configured?'已配置 · 同一服务留空保留密钥':'粘贴此模型服务的 API Key';
    const labels={'browser-local':'Key 已记住：保存在当前浏览器，刷新或重新打开网页后自动恢复。取消勾选并保存可删除本地副本。','windows-dpapi':'密钥由 Windows 加密，保存在当前浏览器后端。',session:'密钥仅保存在当前页面内存；刷新或关闭页面后需重新填写。',environment:'正在使用本地环境变量中的密钥。',none:'尚未保存模型密钥。'};
    $('#key-storage-status').textContent=live.connected?labels[live.config?.key_storage]||'密钥仅保存在当前页面内存。':'请不要把密钥发到聊天或写进网页文件。';
  }
  function settingsResult(message,error=false){const node=$('#settings-result');node.textContent=message;node.hidden=false;node.classList.toggle('error',error);}
  async function saveModel(test){
    if(!live.connected||live.settingsBusy)return;if(!$('#settings-form').reportValidity())return;
    const payload={provider:$('#model-provider').value,base_url:$('#model-url').value.trim(),model:$('#model-name').value.trim(),remember:$('#model-remember').checked};
    const key=$('#model-key').value.trim();if(key)payload.api_key=key;
    live.settingsBusy=true;$('#model-fields').disabled=true;settingsResult(test?'正在保存并测试连接…':'正在保存配置…');
    try{live.config=await api('/api/config',{method:'POST',body:payload});live.configured=Boolean(live.config.has_api_key);$('#model-key').value='';if(test){const result=await api('/api/config/test',{method:'POST',body:{}});settingsResult(result.message||`连接成功 · ${result.model||live.config.model}`);}else{settingsResult(live.configured?'配置已保存。现在可以对已解析论文提问或翻译。':'模型地址已保存；填写 API Key 后可使用问答和翻译。');}}
    catch(error){settingsResult(error.message,true);}
    finally{payload.api_key=undefined;live.settingsBusy=false;$('#model-key').value='';renderConnection();renderSettings();if(state.bilingual&&live.configured)startPageTranslation();if(state.selected?.fragment&&live.configured)translateLiveSelection(false);if(state.doc==='live'){renderLivePaper();if(!state.messages.length)renderLiveWelcome();}}
  }
  function requireModel(){if(live.connected&&live.configured)return true;toast('先在“模型与连接”中配置 API Key。PDF 阅读、摘录和手动笔记不需要 Key。');openDialog('settings-dialog');return false;}
  async function refreshDocuments(){
    try{const result=await api('/api/documents',{timeout:15000});live.trashedDocuments=result.trashed_documents||[];live.documents=Array.isArray(result.documents)?result.documents:[];renderServerLibrary();$('#paper-count').textContent=String(1+live.documents.length+(state.localFile?1:0));}
    catch(error){if($('#library-dialog').open)toast(error.message);}
  }
  function renderServerLibrary(){
    if(window.YanbanLibrary){window.YanbanLibrary(live.documents);return;}
    $('#server-paper-list').innerHTML=live.documents.length?'<div class="library-section-label">保存在当前浏览器的论文</div>'+live.documents.map(doc=>`<button class="library-paper server-paper" data-live-document="${escape(doc.id)}"><span class="library-cover">${icon('file')}</span><span class="library-paper-info"><span class="tag">${escape(parserLabel(doc.parser))}</span><strong>${escape(doc.title||doc.filename)}</strong><span>${Number(doc.page_count)||0} 页 · ${Number(doc.paragraph_count)||0} 个段落</span></span>${icon('right')}</button>`).join(''):'';
  }
  async function loadLiveDocument(id){
    pageTranslator.cancel();const epoch=++live.epoch;persist();state.requestId++;state.busy=false;$('#send-button').disabled=false;live.translationBusy.clear();live.cardBusy=false;$$('.loading-message').forEach(node=>node.remove());
    try{const doc=await api(`/api/documents/${encodeURIComponent(id)}`);if(epoch!==live.epoch)return;
      if(!Array.isArray(doc.paragraphs)||!Number.isInteger(doc.page_count)||doc.page_count<1||doc.page_count>100)throw new Error('论文解析结果不完整，请重新导入。');
      live.document=doc;live.page=1;live.pdfView=true;live.translations=await window.YanbanTranslations.load(doc.id).catch(()=>new Map());if(epoch!==live.epoch)return;live.translationErrors=new Map();live.translationBusy=new Set();live.history=[];live.visited=new Set();live.cardBusy=false;
      state.doc='live';window.dispatchEvent(new CustomEvent('yanban-document-change',{detail:doc.id}));state.bilingual=false;state.selected=null;loadDocumentNotes();rememberActive(doc.id);clearSelection();resetChat();renderPaper();setTab('chat');setMobile('reader');closeDialog('library-dialog');renderNotes();
    }catch(error){if(epoch===live.epoch){toast(error.message);renderNotes();if(state.doc==='live'){renderLivePaper();if(state.tab==='translate')renderLiveTranslation();}}}
  }
  function jobMessage(message,error=false){const node=$('#job-status');node.hidden=false;node.textContent=message;node.classList.toggle('error',error);}
  async function uploadLivePDF(file){
    if(live.uploadBusy){toast('有一篇论文正在解析，请等待完成。');return;}
    if(file.size>20*1024*1024){toast('请选择不超过 20 MB 的 PDF。');return;}
    if(!/\.pdf$/i.test(file.name)){toast('请选择 PDF 文件。');return;}
    const epoch=live.epoch;live.uploadBusy=true;renderConnection();openDialog('library-dialog');
    try{
      if(await file.slice(0,5).text()!=='%PDF-')throw new Error('文件内容不是有效的 PDF。');
      const engine=$('#parser-engine').value,form=new FormData();form.append('file',file);form.append('engine',engine);form.append('ocr',String(engine==='docling'&&$('#parser-ocr').checked));
      jobMessage(`正在把 ${file.name} 在浏览器内解析…`);const result=await api('/api/documents',{method:'POST',body:form});
      const start=Date.now();let finished=false;
      while(Date.now()-start<15*60*1000){
        const job=await api(`/api/jobs/${encodeURIComponent(result.job_id)}`,{timeout:20000});
        jobMessage(job.message||job.stage||'正在解析，请稍候…');
        if(job.state==='error')throw new Error(job.error||job.message||'解析失败，请确认文件包含可提取文字。');
        if(job.state==='ready'&&job.document_id){finished=true;await refreshDocuments();jobMessage('解析完成。可以按页阅读、摘录，或配置模型后提问。');if(epoch===live.epoch)await loadLiveDocument(job.document_id);else toast('新论文解析完成，可在“我的论文”中打开。');break;}
        await new Promise(resolve=>setTimeout(resolve,1600));
      }
      if(!finished)jobMessage('解析仍在进行，请保持当前页面打开，稍后查看论文库。');
    }catch(error){jobMessage(error.message,true);toast(error.message);}
    finally{live.uploadBusy=false;renderConnection();}
  }
  let pageTranslationContext=null;
  const pageTranslator=window.YanbanPageTranslator({
    async translate(paragraph,signal){
      if(!/[A-Za-z]{3,}/.test(paragraph.text))return '公式按上方原式保留。';
      if(/^Authorized licensed use/.test(paragraph.text))return '原文授权说明，保留英文原件。';
      const result=await api('/api/translate',{method:'POST',signal,body:{document_id:pageTranslationContext.documentId,paragraph_ids:[paragraph.id]}});
      const translated=result.translations?.find(t=>t.paragraph_id===paragraph.id);if(!translated)throw Error('没有收到该段译文');return translated.text;
    },
    save(id,text){return window.YanbanTranslations.save(pageTranslationContext.documentId,id,text);},
    onChange(){updatePageTranslations();}
  });
  function startPageTranslation(){
    if(state.doc!=='live'||!state.bilingual)return;
    pageTranslator.cancel();
    pageTranslationContext={documentId:live.document.id,page:live.page,epoch:live.epoch};
    if(!live.configured){updatePageTranslations();return;}
    pageTranslator.start(live.document.paragraphs.filter(p=>p.page===live.page),live.translations);
  }
  function updatePageTranslations(){
    if(state.doc!=='live'||!state.bilingual)return;
    const status=pageTranslator.snapshot(),same=pageTranslationContext?.documentId===live.document.id&&pageTranslationContext?.page===live.page;
    const paragraphs=live.document.paragraphs.filter(p=>p.page===live.page),done=paragraphs.filter(p=>live.translations.has(p.id)).length;
    const banner=$('#page-translation-status');
    if(banner){
      const running=same&&status.status==='running';
      const message=done===paragraphs.length?'本页译文已就绪':!live.configured?'配置 API Key 后自动翻译本页':running?'正在自动翻译本页':status.status==='error'?'部分段落未完成，可重试':'翻译已暂停';
      banner.innerHTML=`<div><strong>${message}</strong><span>${done} / ${paragraphs.length} 段 · 已译内容保存在当前浏览器</span></div>${done===paragraphs.length?'':!live.configured?'<button data-action="settings">配置模型</button>':`<button data-page-translate="${running?'pause':'resume'}">${running?'暂停':status.status==='error'?'重试未完成段落':'继续翻译'}</button>`}`;
    }
    for(const el of $$('[data-translation-id]')){
      const id=el.dataset.translationId,text=live.translations.get(id),error=live.translationErrors.get(id)||(same?status.errors.get(id):'');
      el.closest('.bilingual-paragraph')?.classList.toggle('formula-only',text==='公式按上方原式保留。');
      const value=text||error||(same&&status.busy.has(id)?'正在翻译…':live.configured?'等待自动翻译…':'配置模型后自动翻译');
      if(el.dataset.renderedValue===value)continue;el.dataset.renderedValue=value;
      el.className='translation '+(text?'model-answer':'untranslated');
      el.innerHTML=text==='公式按上方原式保留。'?'公式见左侧原页':text?renderMath(text):error?`<span>翻译未完成：${escape(error)}</span> <button data-live-translate="${escape(id)}">重试本段</button>`:escape(value);
      if(text&&el.querySelector('[data-pdf-equation]'))window.YanbanPDF.fragments(live.document.id,live.page,el).catch(()=>{});
    }
    if(state.tab==='translate'&&state.selected)renderLiveTranslation();
  }
  async function translateLiveParagraph(id){
    if(state.doc!=='live'||!requireModel()||(live.translationBusy.has(id)||pageTranslator.snapshot().busy.has(id)))return;
    const paragraph=liveParagraph(id);if(!paragraph)return;
    const epoch=live.epoch,documentId=live.document.id;live.translationBusy.add(id);live.translationErrors.delete(id);selectLiveParagraph(id);setTab('translate');setMobile('assistant');
    try{const result=await api('/api/translate',{method:'POST',body:{document_id:documentId,paragraph_ids:[id],target_language:'zh'}});if(epoch!==live.epoch||state.doc!=='live')return;const translated=result.translations?.find(item=>item.paragraph_id===id);if(!translated||typeof translated.text!=='string')throw new Error('模型没有返回这段的译文，请重试。');live.translations.set(id,translated.text);await window.YanbanTranslations.save(documentId,id,translated.text);}
    catch(error){if(epoch===live.epoch){live.translationErrors.set(id,error.message);toast(error.message);}}
    finally{if(epoch===live.epoch){live.translationBusy.delete(id);updatePageTranslations();renderLiveTranslation();}}
  }
  function citationsHTML(citations){return (Array.isArray(citations)?citations:[]).filter(item=>liveParagraph(item.paragraph_id)).map(item=>{const paragraph=liveParagraph(item.paragraph_id);return `<button class="citation-chip" data-live-cite="${escape(paragraph.id)}" title="${escape(paragraph.text.slice(0,200))}">${icon('link')}第 ${paragraph.page} 页 · ${escape(paragraph.id)} ${icon('up-right')}</button>`;}).join('');}
  function traceHTML(trace){if(!Array.isArray(trace)||!trace.length)return '';return `<details class="execution-trace"><summary>查看实际执行记录 · ${trace.length} 步</summary><ol>${trace.map(item=>`<li><span>${escape(item.label||item.step)}</span><small>${escape(item.status)}</small></li>`).join('')}</ol><p>记录工具执行步骤，不展示模型内部推理。</p></details>`;}
  function appendLiveAnswer(result){
    const node=document.createElement('div');node.className='message';
    const allowed=new Map((Array.isArray(result.citations)?result.citations:[]).filter(c=>liveParagraph(c.paragraph_id)).map(c=>[c.paragraph_id,c]));
    const answer=window.YanbanFormat.render(result.answer||'没有生成可显示的回答。',[...allowed.keys()]);
    node.innerHTML=`<div class="message-header"><span>${icon('spark')}</span><strong>研伴</strong><small>${escape(result.model||live.config?.model||'模型回答')}</small></div><div class="model-answer">${answer}</div><div class="answer-citations">${citationsHTML(result.citations)}</div>${Array.isArray(result.warnings)&&result.warnings.length?`<div class="answer-warnings">${result.warnings.map(w=>`<p>${escape(w)}</p>`).join('')}</div>`:''}${traceHTML(result.trace)}<div class="response-followup">引用可定位来源；请核对原文是否真的支持该结论。</div>`;
    $('#messages').appendChild(node);
  }
  async function submitLiveQuestion(supplied){
    const input=$('#question-input'),question=(supplied||input.value).trim();if(!question||state.busy)return;if(question.length>4000){toast('请将单次问题控制在 4000 字以内。');return;}if(!requireModel())return;
    const epoch=live.epoch,requestId=++state.requestId,documentId=live.document.id,selected=state.selected?(state.selected.ids||[state.selected.id]):[];
    const history=live.history.slice(-12);input.value='';setTab('chat');setMobile('assistant');appendUser(question);state.messages.push(question);$('#prompt-suggestions').hidden=true;state.busy=true;$('#send-button').disabled=true;
    const loading=document.createElement('div');loading.className='loading-message';loading.innerHTML='<span></span><span></span><span></span>正在检索并调用模型，可能需要一会儿，请勿重复提交';$('#messages').appendChild(loading);scrollChat();
    try{const result=await api('/api/chat',{method:'POST',timeout:650000,body:{document_id:documentId,question,history,selected_paragraph_ids:selected}});if(epoch!==live.epoch||requestId!==state.requestId||state.doc!=='live')return;appendLiveAnswer(result);live.history.push({role:'user',content:question},{role:'assistant',content:String(result.answer||'')});}
    catch(error){if(epoch===live.epoch&&requestId===state.requestId){const node=document.createElement('div');node.className='message inline-error';node.textContent=error.message;$('#messages').appendChild(node);}}
    finally{loading.remove();if(epoch===live.epoch&&requestId===state.requestId){state.busy=false;$('#send-button').disabled=false;scrollChat();}}
  }
  function addLiveExcerpt(id){
    const paragraph=liveParagraph(id);if(!paragraph)return;const text=state.selected?.id===id?state.selected.text:paragraph.text;
    if(state.excerpts.some(item=>item.text===text)){toast('这段原文已保存在当前读书卡中。');return;}if(state.excerpts.length>=50){toast('每篇论文最多保存 50 条摘录。');return;}
    state.excerpts.push({id:`excerpt-${Date.now()}-${Math.random().toString(16).slice(2,8)}`,paragraph:id,page:paragraph.page,label:`第 ${paragraph.page} 页`,text});const saved=persist();renderNotes();toast(saved?'已保存到这篇论文的读书卡。':'已加入当前读书卡，请导出以免丢失。');
  }
  async function fillLiveNotes(){
    if(live.cardBusy||!requireModel())return;
    if(Object.values(state.card).every(value=>value.trim())){toast('所有栏目已有内容，未调用模型或覆盖笔记。');return;}
    const epoch=live.epoch;live.cardBusy=true;renderNotes();toast('正在分段阅读全文并汇总读书卡；全文阅读比单次问答耗时更长，请勿重复提交。');
    try{const result=await api('/api/reading-card',{method:'POST',timeout:650000,body:{document_id:live.document.id}});if(epoch!==live.epoch||state.doc!=='live')return;let count=0;for(const key of Object.keys(defaultCard)){if(!state.card[key].trim()&&typeof result.card?.[key]==='string'){state.card[key]=result.card[key].slice(0,10000);count++;}}
      const saved=persist();toast(saved?`已填写 ${count} 个空白栏目，保留已有笔记；请核对后编辑。`:'已填写当前读书卡，请导出备份。');
      const coverage=result.coverage;
      appendLiveAnswer({answer:coverage?`### 全文读书卡已生成\n已覆盖 **${coverage.read_pages}/${coverage.total_pages} 页**、**${coverage.read_paragraphs}/${coverage.total_paragraphs} 个有文字的段落**，共 ${coverage.chunks} 个阅读分段。\n\n覆盖范围为 PDF 已提取的文字。仅填写原先空白栏目，请核对引用并修改为自己的理解。`:'读书卡草稿已生成。未提供覆盖统计，请核对阅读范围。',citations:result.citations,trace:result.trace,model:result.model,warnings:result.warnings});
    }catch(error){if(epoch===live.epoch)toast(error.message);}
    finally{if(epoch===live.epoch){live.cardBusy=false;renderNotes();}}
  }
  function exportLiveNotes(){
    const doc=state.doc==='live'?live.document:null,title=doc?.title||doc?.filename||state.localFile?.name||'论文';
    const content=['# 研伴读书卡','',`论文：${title}`,'',doc?`解析方式：${parserLabel(doc.parser)}；共 ${doc.page_count} 页。`:'本地 PDF 预览，尚未解析。','', '> 笔记可包含模型草稿，请自行核对原文。引用能够定位来源，不代表结论已验证。','',...cardFields.flatMap(([key,label])=>[`## ${label}`,'',state.card[key].trim()||'尚未填写。','']),'## 原文摘录','',...state.excerpts.flatMap(item=>[item.text,'',`来源：第 ${item.page} 页 / 段落 ${item.paragraph}`,'']),'---','由研伴导出。'].join('\n');
    const url=URL.createObjectURL(new Blob(['\ufeff'+content],{type:'text/markdown;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download=`研伴-${title.replace(/[<>:"/\\|?*]/g,'_').slice(0,80)}-读书卡.md`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('读书卡已导出为 Markdown。');
  }
  $('#settings-form').addEventListener('submit',event=>{event.preventDefault();saveModel(false);});
  $('#model-provider').addEventListener('change',()=>{const defaults={qwen:['https://dashscope.aliyuncs.com/compatible-mode/v1','qwen-plus'],deepseek:['https://api.deepseek.com','deepseek-flash']};const provider=$('#model-provider').value,pair=defaults[provider];if(pair)$('#model-url').value=pair[0];renderModelPicker(provider,pair?pair[1]:'');$('#model-key').value='';});
  $('#model-choice').addEventListener('change',()=>updateModelChoice());
  $('#parser-engine').addEventListener('change',()=>{$('#parser-ocr').disabled=true;if($('#parser-ocr').disabled)$('#parser-ocr').checked=false;});
  $('#settings-dialog').addEventListener('close',()=>{$('#model-key').value='';});
  window.YanbanApp={
    current:()=>({id:state.doc==='live'?live.document.id:'demo',title:live.document?.title||DATA.title,page:live.page,selection:state.selected,kind:state.doc}),
    documents:()=>live.documents,
    trashedDocuments:()=>live.trashedDocuments||[],
    async afterPaperRemoval(id){if(state.doc==='live'&&live.document.id===id)switchToDemo();await refreshDocuments();openDialog('library-dialog');},
    open:loadLiveDocument,refresh:refreshDocuments,notify:toast,
    notebook(){setTab('notebook');setMobile('assistant');},
    async syncRefresh(){cardSnapshot=localStorage.getItem(LIVE_KEY);live.cards=JSON.parse(cardSnapshot||'{}');loadDocumentNotes();renderNotes();await refreshDocuments();if(state.doc==='live'&&!live.documents.some(d=>d.id===live.document.id))switchToDemo();},
    isBusy:()=>window.YanbanLearning?.isBusy()||state.busy||live.cardBusy||live.uploadBusy||live.translationBusy.size||pageTranslator.snapshot().status==='running'||live.selectionBusy
  };
  window.addEventListener('yanban-sync-complete',()=>window.YanbanApp.syncRefresh());
  window.addEventListener('yanban-document-change',()=>{});
  hydrateIcons();renderPaper();renderWelcome();renderNotes();setTab('chat');updateNoteCount();window.YanbanApp.ready=checkConnection(true);
})();
