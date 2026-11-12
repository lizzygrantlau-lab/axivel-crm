import test from 'node:test';
import assert from 'node:assert/strict';
import {handleCrm} from '../functions/crm.mjs';

test('pós-venda preserva entrega e protege alterações simultâneas',async()=>{
 const previous=globalThis.fetch;
 let row={valor:[],versao:1};
 globalThis.fetch=async(url,options)=>{
  if(options.method!=='PATCH')return Response.json([structuredClone(row)]);
  if(Number(url.searchParams.get('versao').slice(3))!==row.versao)return Response.json([]);
  row=JSON.parse(options.body);return Response.json([structuredClone(row)]);
 };
 const endpoint='https://crm.example/api/crm/client/CLI-0001/post-sale';
 const call=(method,input)=>handleCrm(new Request(endpoint,{method,headers:method==='GET'?{}:{Origin:'https://crm.example','Content-Type':'application/json'},...(input?{body:JSON.stringify(input)}:{})}),{url:'https://test.supabase.co',key:'server-only'});
 try{
  assert.equal((await call('PUT',{action:'confirmDelivery'})).status,200);
  assert.equal((await (await call('GET')).json()).deliveryConfirmed,true);
  assert.equal((await call('PUT',{action:'create'})).status,200);
  const save=(period,note)=>call('PUT',{action:'save',period,status:'Concluído',note,expected:{status:'Pendente',note:''}});
  const responses=await Promise.all([save('d7','Primeiro'),save('d30','Segundo')]);
  assert.deepEqual(responses.map(r=>r.status),[200,200]);
  assert.equal(row.valor.notes.d7,'Primeiro');assert.equal(row.valor.notes.d30,'Segundo');
  assert.equal((await save('d7','Sobrescrita')).status,409);
  assert.equal(row.valor.notes.d7,'Primeiro');
  assert.equal((await call('PUT',{d7:'Pendente',d30:'Pendente',d90:'Pendente'})).status,409);
  assert.equal(row.valor.notes.d30,'Segundo');
 }finally{globalThis.fetch=previous;}
});
