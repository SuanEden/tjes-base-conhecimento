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
  assert.match(r.id,/^SATE\d{4}$/i);
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
