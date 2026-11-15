'use strict';
const S=require('./_shared');
module.exports=async function(req,res){
 if(req.method!=='POST'){S.respond(res,405,{error:'Use POST'});return}
 const user=S.session(req);if(!user){S.respond(res,401,{error:'Faça login no GitHub para publicar'});return}
 const ownOrigin='https://'+req.headers.host;
 if(req.headers.origin!==ownOrigin||req.headers['x-tjes-csrf']!==S.csrf(req)){S.respond(res,403,{error:'Requisição não autorizada'});return}
 try{
  const payload=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!payload||!Number.isSafeInteger(payload.expectedVersion)||payload.expectedVersion<1)throw Error('Versão base obrigatória');
  const library=payload.library;S.validLibrary(library);
  const body=JSON.stringify(library,null,2)+'\n';
  if(Buffer.byteLength(body,'utf8')>3.8*1024*1024)throw Error('Biblioteca excede limite de publicação');
  const branch=await S.github('/repos/'+S.OWNER+'/'+S.REPO+'/git/ref/heads/main',user.token);
  const current=await S.github('/repos/'+S.OWNER+'/'+S.REPO+'/contents/versao.json?ref=main',user.token);
  const manifest=JSON.parse(Buffer.from(current.content.replace(/\\s/g,''),'base64').toString('utf8'));
  if(manifest.contentVersion!==payload.expectedVersion){S.respond(res,409,{error:'A base foi atualizada por outra pessoa. Atualize a página e revise as alterações.',currentVersion:manifest.contentVersion});return}
  const next={...manifest,contentVersion:manifest.contentVersion+1,recordCount:library.records.length,publishedOn:new Date().toISOString().slice(0,10)};
  const orig=await S.github('/repos/'+S.OWNER+'/'+S.REPO+'/git/commits/'+branch.object.sha,user.token);
  const blob=await S.github('/repos/'+S.OWNER+'/'+S.REPO+'/git/blobs',user.token,'POST',{content:body,encoding:'utf-8'});
  const versionBlob=await S.github('/repos/'+S.OWNER+'/'+S.REPO+'/git/blobs',user.token,'POST',{content:JSON.stringify(next,null,2)+'\n',encoding:'utf-8'});
  const tree=await S.github('/repos/'+S.OWNER+'/'+S.REPO+'/git/trees',user.token,'POST',{base_tree:orig.tree.sha,tree:[{path:'biblioteca-tjes.json',mode:'100644',type:'blob',sha:blob.sha},{path:'versao.json',mode:'100644',type:'blob',sha:versionBlob.sha}]});
  const commit=await S.github('/repos/'+S.OWNER+'/'+S.REPO+'/git/commits',user.token,'POST',{message:'Publicar base de conhecimento v'+next.contentVersion+' por '+user.login,tree:tree.sha,parents:[branch.object.sha]});
  await S.github('/repos/'+S.OWNER+'/'+S.REPO+'/git/refs/heads/main',user.token,'PATCH',{sha:commit.sha,force:false});
  S.respond(res,200,{ok:true,version:next.contentVersion,commit:commit.sha,recordCount:library.records.length});
 }catch(error){S.respond(res,error.status===409?409:error.status===403?403:error.status===422?409:400,{error:String(error.message||error)})}
};
