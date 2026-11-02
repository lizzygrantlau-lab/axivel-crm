const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createSyncedTaskFlow}=require('./synced-task-flow.cjs');
function fixture(initial={stage:1}) {
 let row={valor:initial,versao:1},writes=0,online=true;
 const request=async(endpoint,options)=>{
  if(!online)throw new Error('Sem conexão');
  if(options.method!=='PATCH')return Response.json([structuredClone(row)]);
  if(Number(endpoint.searchParams.get('versao').slice(3))!==row.versao)return Response.json([]);
  row=JSON.parse(options.body);
  // JSONB pode devolver as mesmas propriedades em outra ordem.
  row.valor=Object.fromEntries(Object.entries(row.valor).reverse());
  writes++;return Response.json([row]);
 };
 const credentials={url:'https://test.supabase.co',key:'test-only',request};
 return {a:createSyncedTaskFlow(credentials),b:createSyncedTaskFlow(credentials),writes:()=>writes,offline(){online=false;}};
}
test('dois computadores compartilham responsável, comentários e canal sem sobrescrever mudanças',async()=>{
 const f=fixture();
 await f.a.update({action:'assign',stage:1,owner:'Samanta'});
 assert.equal((await f.b.tick()).assignedOwner,'Samanta');
 await Promise.all([
  f.a.update({action:'comment',stage:1,text:'Análise da Laura',owner:'Laura'}),
  f.b.update({action:'prospectType',stage:1,value:'Instagram'})
 ]);
 const state=await f.b.tick();
 assert.equal(state.comments[0].text,'Análise da Laura');assert.equal(state.prospectTypes[1],'Instagram');
 assert.equal(state.events.filter(e=>e.type==='Comentário da tarefa').length,1);
 assert.deepEqual(await f.a.tick(),state);
});
test('consultas de sincronização não regravam dados só por ordem diferente das propriedades',async()=>{
 const f=fixture();await f.a.tick();const writes=f.writes();
 await f.a.tick();await f.b.tick();await f.a.tick();assert.equal(f.writes(),writes);
});
test('sem conexão, recusa alterações e não cria um estado local divergente',async()=>{
 const f=fixture();await f.a.tick();const writes=f.writes();f.offline();
 await assert.rejects(f.a.update({action:'advance',stage:1}));
 await assert.rejects(f.b.tick());assert.equal(f.writes(),writes);
});
test('comentário inválido e edição de uma etapa antiga não mudam a tarefa',async()=>{
 const f=fixture();await f.a.tick();const writes=f.writes();
 await assert.rejects(f.a.update({action:'comment',stage:1,text:' ',owner:'Laura'}));
 await assert.rejects(f.a.update({action:'prospectType',stage:0,value:'Instagram'}));
 assert.equal(f.writes(),writes);
});

test('a resposta nao cliente fica salva e compartilhada apos avancar de etapa',async()=>{
 const f=fixture();
 await f.a.update({action:'qualifyClient',stage:1,existingClient:false});
 assert.equal((await f.b.tick()).existingClient,false);
 await f.a.update({action:'advance',stage:1});
 const saved=await f.b.tick();
 assert.equal(saved.stage,2);assert.equal(saved.existingClient,false);
 assert.equal(saved.events.filter(e=>e.type==='Qualificação da empresa').length,1);
});
