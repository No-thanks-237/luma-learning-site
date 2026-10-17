// Protect visibly fragmented PDF math during translation, without guessing its meaning.
export function equationSegments(text){
 const lines=text.split('\n'),segments=[];let offset=0,start=-1,parts=[];
 const flush=()=>{const value=parts.join('\n');if(parts.length>=2&&/[=∑√∫⎡⎤]/.test(value)||/[\x00-\x08\x0e-\x1f]/.test(value))segments.push({start,end:start+value.length,text:value});parts=[];start=-1;};
 for(const line of lines){
  const mathematical=line.trim()&&!/[A-Za-z]{3,}|[\u4e00-\u9fff]/.test(line);
  if(mathematical){if(start<0)start=offset;parts.push(line);}else flush();
  offset+=line.length+1;
 }
 flush();return segments;
}
export function protectEquations(text,id){
 const segments=equationSegments(text);let result=text;
 for(let i=segments.length-1;i>=0;i--){const s=segments[i];result=result.slice(0,s.start)+'⟦PDF:'+id+':'+i+'⟧'+result.slice(s.end);}
 return {text:result,segments};
}
