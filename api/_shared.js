'use strict';
const crypto=require('node:crypto');
const OWNER='SuanEden',REPO='tjes-base-conhecimento';
const GH='https://api.github.com';
function secret(){const value=process.env.SESSION_SECRET||'';if(value.length<32)throw Error('SESSION_SECRET não configurado');return crypto.createHash('sha256').update(value).digest()}
function encode(value){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',secret(),iv),data=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),data]).toString('base64url')}
function decode(encoded){try{const bytes=Buffer.from(encoded,'base64url'),iv=bytes.subarray(0,12),tag=bytes.subarray(12,28),content=bytes.subarray(28),dec=crypto.createDecipheriv('aes-256-gcm',secret(),iv);dec.setAuthTag(tag);return JSON.parse(Buffer.concat([dec.update(content),dec.final()]).toString('utf8'))}catch{return null}}
function cookies(req){return Object.fromEntries(String(req.headers.cookie||'').split(';').map(p=>{const at=p.indexOf('=');return at<0?['','']:[p.slice(0,at).trim(),p.slice(at+1).trim()]}).filter(p=>p[0]))}
function cookie(name,value,maxAge){return name+'='+value+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+maxAge}
function authorizedLogin(login){const allowed=(process.env.GITHUB_ALLOWED_USERS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);return allowed.length>0&&allowed.includes(String(login||'').toLowerCase())}
function session(req){const obj=decode(cookies(req).tjes_session||'');if(!obj||!obj.token||!obj.login||!authorizedLogin(obj.login)||obj.exp<Date.now())return null;return obj}
function csrf(req){return crypto.createHmac('sha256',secret()).update(cookies(req).tjes_session||'').digest('hex')}
function respond(res,status,data){res.status(status).setHeader('Cache-Control','no-store').setHeader('Content-Type','application/json; charset=utf-8').end(JSON.stringify(data))}
async function github(path,token,method='GET',body){const response=await fetch(GH+path,{method,headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json','User-Agent':'TJES-knowledge-admin'},body:body===undefined?undefined:JSON.stringify(body)});const text=await response.text();let data;try{data=JSON.parse(text)}catch{data={message:text.slice(0,300)}};if(!response.ok){const error=Error('GitHub HTTP '+response.status+': '+String(data.message||''));error.status=response.status;throw error}return data}
function canonicalRecord(row){return row&&typeof row==='object'&&!Array.isArray(row)&&/^SATE\\d{4}$/i.test(row.id)&&typeof row.title==='string'&&row.title.length<=250&&typeof row.text==='string'&&row.text.length<=100000&&String(row.category||'').length<=250&&String(row.group||'').length<=250&&String(row.path||'').length<=500}
function validLibrary(payload){if(!payload||payload.version!==1||!Array.isArray(payload.records)||payload.records.length<1||payload.records.length>10000)throw Error('Biblioteca inválida');const seen=new Set();for(const row of payload.records){if(!canonicalRecord(row)||seen.has(row.id))throw Error('Artigo inválido ou código duplicado: '+String(row?.id||''));seen.add(row.id)}}
module.exports={OWNER,REPO,encode,decode,cookies,cookie,authorizedLogin,session,csrf,respond,github,validLibrary};
