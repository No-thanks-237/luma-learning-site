export const trashKey=id=>'paper-trash:'+id;
export function partitionPapers(documents,entries){const active=[],trashed=[];for(const d of documents)(entries[trashKey(d.id)]?.deleted?trashed:active).push(d);return {documents:active,trashed_documents:trashed};}
export function setPaperTrashed(workspace,id,deleted){if(typeof id!=='string'||!id||id==='demo')throw Error('请选择已导入的论文。');workspace.set(trashKey(id),{deleted:Boolean(deleted),updated_at:new Date().toISOString()});}
