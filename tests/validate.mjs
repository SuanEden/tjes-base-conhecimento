import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const library=JSON.parse(readFileSync(new URL('../biblioteca-tjes.json',import.meta.url),'utf8'));
const manifest=JSON.parse(readFileSync(new URL('../versao.json',import.meta.url),'utf8'));
test('Biblioteca tem formato e IDs únicos',()=>{
 assert.equal(library.version,1);
 assert.ok(Array.isArray(library.records));
 assert.ok(library.records.length>0&&library.records.length<=10000);
 const ids=new Set();
 for(const r of library.records){
  assert.match(r.id,/^[A-Z0-9_-]{2,32}$/i);
  assert.ok(!ids.has(r.id),'Duplicado: '+r.id);
  assert.equal(typeof r.text,'string');
  assert.ok(r.text.length<=100000);
  ids.add(r.id);
 }
});
test('Manifesto corresponde à biblioteca',()=>{
 assert.equal(manifest.schemaVersion,1);
 assert.ok(Number.isSafeInteger(manifest.contentVersion)&&manifest.contentVersion>=1);
 assert.equal(manifest.recordCount,library.records.length);
 assert.equal(manifest.dataFile,'biblioteca-tjes.json');
});

import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { Script } from 'node:vm';
const require=createRequire(import.meta.url);
const {validLibrary}=require('../api/_shared.js');
test('Backend aceita biblioteca válida e rejeita dados incompatíveis',()=>{
 assert.doesNotThrow(()=>validLibrary(library));
 const duplicate=library.records.map(r=>({...r}));
 duplicate[1].id=duplicate[0].id;
 assert.throws(()=>validLibrary({...library,records:duplicate}),/duplicado/);
 assert.throws(()=>validLibrary({...library,records:[]}),/Biblioteca inválida/);
 const invalid=library.records.map(r=>({...r}));
 invalid[0].id='@invalid';
 assert.throws(()=>validLibrary({...library,records:invalid}),/inválido/);
});
test('Conteúdo e manifesto identificam o mesmo blob Git',()=>{
 const bytes=readFileSync(new URL('../biblioteca-tjes.json',import.meta.url));
 const digest=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 assert.equal(digest,manifest.sourceBlobSha);
});
test('Interface do painel e serviços de API têm sintaxe válida',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(script,'script principal encontrado');
 assert.doesNotThrow(()=>new Script(script));
 for(const path of ['../api/_shared.js','../api/auth.js','../api/publish.js']){
  const js=readFileSync(new URL(path,import.meta.url),'utf8');
  assert.doesNotThrow(()=>new Script(js),path);
 }
});
test('Publicação exige integridade de origem e atualização atômica',()=>{
 const server=readFileSync(new URL('../api/publish.js',import.meta.url),'utf8');
 const client=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(server,/expectedDataSha/);
 assert.match(server,/currentData\.sha!==payload\.expectedDataSha/);
 assert.match(server,/force:false/);
 assert.match(client,/expectedDataSha:baseBlobSha/);
});
