import test from 'node:test';
import assert from 'node:assert/strict';
import {runtimeStore} from './runtime.mjs';
function database(initial) {
 let row={valor:structuredClone(initial),versao:1},writes=0;
 const request=async(endpoint,options)=>{
  if(options.method!=='PATCH')return Response.json([structuredClone(row)]);
  if(Number(endpoint.searchParams.get('versao').slice(3))!==row.versao)return Response.json([]);
  row=JSON.parse(options.body);writes++;return Response.json([row]);
 };
 return {store:runtimeStore({url:'https://test.supabase.co',key:'server-only',request}),row:()=>row,writes:()=>writes};
}
test('duas conclusões simultâneas não avançam duas vezes',async()=>{
 const db=database({stage:2,events:[]});
 const results=await Promise.allSettled([1,2].map(()=>db.store.tasks({action:'completeContact',stage:2,date:'2026-11-05'},()=>Date.parse('2026-11-02T12:00:00Z'))));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(db.row().valor.stage,3);assert.equal(db.row().valor.events.length,1);assert.equal(db.writes(),1);
});
test('prazo vencido é persistido uma única vez',async()=>{
 const db=database({stage:3,returnWait:{until:'2026-11-06T02:59:59.999Z',outcome:null},events:[]});
 await Promise.all([db.store.tasks(undefined,()=>Date.parse('2026-11-06T03:00:00Z')),db.store.tasks(undefined,()=>Date.parse('2026-11-06T03:00:00Z'))]);
 assert.equal(db.row().valor.stage,1);assert.equal(db.row().valor.assignedOwner,'Laura');assert.equal(db.row().valor.returnWait.outcome,'timeout');assert.equal(db.row().valor.events.length,1);assert.equal(db.writes(),1);
});
test('resposta antecipada sobrevive à próxima verificação do prazo',async()=>{
 const db=database({stage:3,returnWait:{until:'2026-11-06T02:59:59.999Z',outcome:null},events:[]});
 await db.store.tasks({action:'recordResponse',stage:3},()=>Date.parse('2026-11-05T12:00:00Z'));
 const saved=await db.store.tasks(undefined,()=>Date.parse('2026-11-07T12:00:00Z'));
 assert.equal(saved.stage,5);assert.equal(saved.returnWait.outcome,'response');assert.equal(saved.taskStatuses[4],'Não necessário');assert.equal(db.writes(),1);
});
