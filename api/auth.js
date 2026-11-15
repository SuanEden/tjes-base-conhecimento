'use strict';
const crypto=require('node:crypto');
const S=require('./_shared');
module.exports=async function(req,res){
 const action=String(new URL(req.url,'https://local.invalid').searchParams.get('action')||'me');
 res.setHeader('Cache-Control','no-store');
 if(action==='logout'){res.setHeader('Set-Cookie',[S.cookie('tjes_session','',0),S.cookie('tjes_login_state','',0)]);res.writeHead(302,{Location:'/'}).end();return}
 if(action==='me'){const user=S.session(req);S.respond(res,200,user?{authenticated:true,login:user.login,csrf:S.csrf(req)}:{authenticated:false,configured:!!(process.env.GITHUB_CLIENT_ID&&process.env.GITHUB_CLIENT_SECRET&&process.env.SESSION_SECRET&&process.env.GITHUB_ALLOWED_USERS)});return}
 if(action==='start'){
  if(!process.env.GITHUB_CLIENT_ID||!process.env.GITHUB_CLIENT_SECRET||!process.env.GITHUB_ALLOWED_USERS){S.respond(res,503,{error:'Autenticação não configurada'});return}
  const state=crypto.randomBytes(24).toString('hex'),exp=Date.now()+600000;
  const origin=process.env.PUBLIC_BASE_URL;if(!origin||!/^https:\/\/[a-z0-9.-]+$/i.test(origin)){S.respond(res,503,{error:'PUBLIC_BASE_URL inválido'});return}const callback=origin+'/api/auth?action=callback';
  res.setHeader('Set-Cookie',S.cookie('tjes_login_state',S.encode({state,exp}),600));
  const q=new URLSearchParams({client_id:process.env.GITHUB_CLIENT_ID,redirect_uri:callback,scope:'public_repo read:user',state,allow_signup:'false'});
  res.writeHead(302,{Location:'https://github.com/login/oauth/authorize?'+q}).end();return;
 }
 if(action==='callback'){
  const u=new URL(req.url,'https://local.invalid'),code=u.searchParams.get('code'),state=u.searchParams.get('state');
  const saved=S.decode(S.cookies(req).tjes_login_state||'');
  if(!code||!state||!saved||saved.exp<Date.now()||saved.state!==state){S.respond(res,403,{error:'Sessão de autenticação inválida'});return}
  try{
   const tokenRes=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:process.env.GITHUB_CLIENT_ID,client_secret:process.env.GITHUB_CLIENT_SECRET,code})});
   const oauth=await tokenRes.json();if(!oauth.access_token)throw Error('Falha na autenticação GitHub');
   const profile=await S.github('/user',oauth.access_token);
   if(!S.authorizedLogin(profile.login)){S.respond(res,403,{error:'Usuário não autorizado para publicação'});return}
   const exp=Date.now()+8*3600000;
   res.setHeader('Set-Cookie',[S.cookie('tjes_login_state','',0),S.cookie('tjes_session',S.encode({token:oauth.access_token,login:profile.login,exp}),8*3600)]);
   res.writeHead(302,{Location:'/'}).end();
  }catch(err){S.respond(res,502,{error:'Login não concluído: '+err.message})}return;
 }
 S.respond(res,404,{error:'Ação desconhecida'});
};
