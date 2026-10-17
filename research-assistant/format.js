/* Small, text-first Markdown renderer. Model HTML is always rendered as text. */
(() => {
  'use strict';
  const node = (tag, text) => { const el=document.createElement(tag); if(text!==undefined)el.textContent=text;return el; };
  let mathTokens=[];
  function protectMath(text){
    mathTokens=[];
    text=text.replace(/⟦PDF:(p\d+):(\d+)⟧/g,(_,id,index)=>{const token=mathTokens.push({source:id+':'+index,display:true})-1;return '\n\uE000'+token+'\uE001\n';});
    // Repair delimiters only, never globally replace \\ (matrix/aligned row breaks).
    text=text.replace(/\\\\([()[\]])/g,'\\$1');
    return text.replace(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\\\(([\s\S]*?)\\\)|(?<![\\\d])\$(?!\s)([^$\n]*?\S)\$(?!\d)|\\begin\{((?:align|equation|gather)\*?)\}([\s\S]*?)\\end\{\6\}/g,(whole,code,a,b,c,d,env,body)=>{
      if(code){
        const fenced=code.match(/^(?:```|~~~)(?:math|latex|tex)\s*\n([\s\S]*?)\n(?:```|~~~)$/i);
        if(!fenced)return code;
        a=fenced[1];
      }
      if(env)a=/^align/.test(env)?'\\begin{aligned}'+body+'\\end{aligned}':/^gather/.test(env)?'\\begin{gathered}'+body+'\\end{gathered}':body;
      const display=a!==undefined||b!==undefined;
      const tex=(a??b??c??d).replace(/\\\\(?=(?:frac|dfrac|tfrac|sqrt|sum|prod|int|iint|lim|left|right|begin|end|operatorname|mathrm|mathbf|mathit|mathcal|mathbb|text|overline|underline|hat|bar|vec|dot|ddot|boxed|quad|qquad|cdot|times|pm|mp|leq|geq|neq|approx|equiv|infty|partial|nabla|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|xi|pi|rho|sigma|tau|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Sigma|Phi|Psi|Omega)\b)/g,'\\');
      const id=mathTokens.push({tex,display})-1;
      return (display?'\n':'')+'\uE000'+id+'\uE001'+(display?'\n':'');
    });
  }
  function math(parent,id){
    const item=mathTokens[Number(id)];if(!item)return;
    const el=node('span');el.className=item.display?'math-block':'math-inline';
    if(item.source){el.dataset.pdfEquation=item.source;el.textContent='原文公式 · 正在还原排版…';parent.append(el);return;}
    const options={displayMode:item.display,throwOnError:true,trust:false,strict:'ignore',maxSize:12,maxExpand:1000,output:'htmlAndMathml'};
    try{
      if(!window.katex)throw Error('公式组件未加载');
      try{window.katex.render(item.tex,el,options);}
      catch(first){
        // A second JSON escaping layer is common; repair commands only after parsing fails.
        const repaired=item.tex.replace(/\\\\(?=[a-zA-Z])/g,'\\');
        if(repaired===item.tex)throw first;window.katex.render(repaired,el,options);
      }
    }
    catch(_){el.className+=' math-fallback';el.replaceChildren();const details=node('details'),label=node('summary','此公式格式不完整 · 查看原始表达式');details.append(label,node('code',item.tex));el.append(details);}
    parent.append(el);
  }
  function inline(parent, text, allowed, depth=0) {
    if(depth>8){parent.append(document.createTextNode(text));return;}
    const pattern=/(`+)([^`\n]+)\1|\*\*([^\n]+?)\*\*|__([^\n]+?)__|\*([^*\n]+)\*|\[([^\]\n]+)\]\(([^\s)]+)\)|\[(p\d+)\]|\uE000(\d+)\uE001/g;
    let last=0,match;
    while((match=pattern.exec(text))){
      parent.append(document.createTextNode(text.slice(last,match.index)));
      if(match[9]!==undefined)math(parent,match[9]);
      else if(match[1])parent.append(node('code',match[2]));
      else if(match[3]||match[4]||match[5]){const el=node(match[5]?'em':'strong');inline(el,match[3]||match[4]||match[5],allowed,depth+1);parent.append(el);}
      else if(match[6]){
        let url;try{url=new URL(match[7]);}catch(_){}
        if(url&&['https:','http:'].includes(url.protocol)){
          const link=node('a');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';inline(link,match[6],new Set(),depth+1);parent.append(link);
        }else parent.append(document.createTextNode(match[0]));
      }else if(allowed.has(match[8])){
        const button=node('button','['+match[8]+']');button.type='button';button.className='inline-citation';button.dataset.liveCite=match[8];button.setAttribute('aria-label','查看原文 '+match[8]);parent.append(button);
      }else parent.append(document.createTextNode(match[0]));
      last=pattern.lastIndex;
    }
    parent.append(document.createTextNode(text.slice(last)));
  }
  function blocks(parent, lines, allowed, depth=0){
    const cells=line=>line.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());
    const divider=line=>line.includes('|')&&cells(line).every(x=>/^:?-{3,}:?$/.test(x));
    const special=line=>/^\uE000\d+\uE001$/.test(line.trim())||/^\s*(?:#{1,6}\s|>|```|~~~|[-*+]\s|\d+[.)]\s|(?:---+|\*\*\*+)\s*$)/.test(line);
    for(let i=0;i<lines.length;){
      const line=lines[i];if(!line.trim()){i++;continue;}
      const formula=line.trim().match(/^\uE000(\d+)\uE001$/);if(formula&&mathTokens[Number(formula[1])]?.display){math(parent,formula[1]);i++;continue;}
      const fence=line.match(/^\s*(`{3,}|~{3,})(.*)$/);
      if(fence){
        const body=[];i++;while(i<lines.length&&!new RegExp('^\\s*'+fence[1][0]+'{'+fence[1].length+',}\\s*$').test(lines[i]))body.push(lines[i++]);
        if(i<lines.length)i++;
        const pre=node('pre'),code=node('code',body.join('\n'));pre.append(code);parent.append(pre);continue;
      }
      const heading=line.match(/^\s*(#{1,6})\s+(.+?)\s*#*$/);
      if(heading){const el=node('h'+Math.min(heading[1].length+1,6));inline(el,heading[2],allowed);parent.append(el);i++;continue;}
      if(/^\s*(?:---+|\*\*\*+)\s*$/.test(line)){parent.append(node('hr'));i++;continue;}
      if(/^\s*>/.test(line)&&depth<8){const body=[];while(i<lines.length&&/^\s*>/.test(lines[i]))body.push(lines[i++].replace(/^\s*>\s?/,''));const quote=node('blockquote');blocks(quote,body,allowed,depth+1);parent.append(quote);continue;}
      if(i+1<lines.length&&line.includes('|')&&divider(lines[i+1])){
        const wrap=node('div');wrap.className='answer-table';const table=node('table'),thead=node('thead'),tr=node('tr');
        for(const cell of cells(line)){const th=node('th');th.scope='col';inline(th,cell,allowed);tr.append(th);}thead.append(tr);table.append(thead);i+=2;
        const tbody=node('tbody');while(i<lines.length&&lines[i].includes('|')&&lines[i].trim()){
          const row=node('tr');for(const cell of cells(lines[i++])){const td=node('td');inline(td,cell,allowed);row.append(td);}tbody.append(row);
        }table.append(tbody);wrap.append(table);parent.append(wrap);continue;
      }
      const list=line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
      if(list){
        const ordered=/^\d/.test(list[2]),ul=node(ordered?'ol':'ul');if(ordered)ul.start=parseInt(list[2],10);
        while(i<lines.length){
          const item=lines[i].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
          if(!item||/^\d/.test(item[2])!==ordered||item[1].length!==list[1].length)break;
          const li=node('li');inline(li,item[3],allowed);i++;
          const nested=[];while(i<lines.length&&lines[i].trim()&&/^\s+/.test(lines[i])&&lines[i].match(/^\s*/)[0].length>list[1].length)nested.push(lines[i++].slice(list[1].length+2));
          if(nested.length&&depth<8)blocks(li,nested,allowed,depth+1);else if(nested.length)li.append(document.createTextNode(nested.join('\n')));
          ul.append(li);
        }parent.append(ul);continue;
      }
      const paragraph=node('p');inline(paragraph,line,allowed);i++;
      while(i<lines.length&&lines[i].trim()&&!special(lines[i])&&!(i+1<lines.length&&divider(lines[i+1]))){paragraph.append(node('br'));inline(paragraph,lines[i++],allowed);}
      parent.append(paragraph);
    }
  }
  window.YanbanFormat={text(text){const root=node('span');inline(root,protectMath(String(text??'')),new Set());return root.innerHTML;},render(text,ids=[]){const root=node('div');blocks(root,protectMath(String(text??'').replace(/\r\n?/g,'\n')).split('\n'),new Set(ids));return root.innerHTML;}};
})();
