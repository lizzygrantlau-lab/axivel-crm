import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../functions/crm.mjs';

globalThis.Netlify={env:{get:key=>key==='SUPABASE_URL'?'https://test.supabase.co':'server-secret'}};
const target='https://axivel-crm.netlify.app';
test('bloqueia gravações vindas de outra origem antes de consultar o banco',async()=>{
 const response=await handler(new Request(target+'/api/crm/client/CLI-0001/tasks',{method:'PUT',headers:{Origin:'https://outro.example','Content-Type':'application/json'},body:'{"action":"advance","stage":1}'}));
 assert.equal(response.status,403);
});
test('bloqueia formulários comuns, métodos e rotas desconhecidos',async()=>{
 assert.equal((await handler(new Request(target+'/api/crm/client/CLI-0001/tasks',{method:'POST',headers:{Origin:target,'Content-Type':'text/plain'},body:'{}'}))).status,403);
 assert.equal((await handler(new Request(target+'/api/crm/prospects',{method:'DELETE',headers:{Origin:target,'Content-Type':'application/json'}}))).status,405);
 assert.equal((await handler(new Request(target+'/api/crm/client/OUTRA/tasks'))).status,404);
});
test('JSON inválido não consulta nem modifica o banco',async()=>{
 const response=await handler(new Request(target+'/api/crm/client/CLI-0001/tasks',{method:'PUT',headers:{Origin:target,'Content-Type':'application/json'},body:'{'}));
 assert.equal(response.status,400);
});
test('falhas do banco não expõem detalhes nem a chave do servidor',async()=>{
 const previous=globalThis.fetch;
 globalThis.fetch=async()=>{throw new Error('server-secret');};
 try{
  const response=await handler(new Request(target+'/api/crm/prospects'));
  assert.equal(response.status,503);assert.ok(!(await response.text()).includes('server-secret'));
 }finally{globalThis.fetch=previous;}
});

test('edição do cadastro bloqueia origem externa e usa o código da URL',async()=>{
 const response=await handler(new Request(target+'/api/crm/prospects/EMPRESA-B',{method:'PUT',headers:{Origin:'https://outro.example','Content-Type':'application/json'},body:'{}'}));
 assert.equal(response.status,403);
 const previous=globalThis.fetch;let calls=0;
 globalThis.fetch=async(endpoint,options)=>{
  calls++;assert.equal(endpoint.searchParams.get('codigo'),'eq.EMPRESA-B');
  assert.deepEqual(JSON.parse(options.body),{nome:'Empresa B'});
  return Response.json([{nome:'Empresa B',atualizado_em:'2026-11-02T12:00:00Z'}]);
 };
 try{
  const saved=await handler(new Request(target+'/api/crm/prospects/EMPRESA-B',{method:'PUT',headers:{Origin:target,'Content-Type':'application/json'},body:JSON.stringify({code:'EMPRESA-A',changes:{nome:'Empresa B'},updatedAt:'2026-11-02T00:00:00Z'})}));
  assert.equal(saved.status,200);assert.equal(calls,1);assert.equal((await saved.json()).nome,'Empresa B');
 }finally{globalThis.fetch=previous;}
});
