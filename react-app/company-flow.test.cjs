const {test}=require('node:test');
const assert=require('node:assert/strict');
const {companyFlow}=require('./company-flow.cjs');
function fixture(){
 const rows=new Map();let fail=false;
 const options={url:'https://test.supabase.co',key:'fixture',code:'CLI-TESTE',now:()=>Date.parse('2026-11-02T20:00:00Z'),request:async(endpoint,options={})=>{
  if(options.method==='POST'){
   assert.equal(endpoint.pathname,'/rest/v1/historico');assert.equal(options.headers.Prefer,'resolution=ignore-duplicates,return=representation');
   const row=JSON.parse(options.body);assert.equal(row.lead_id,'teste-id');
   if(fail){fail=false;return Response.json({}, {status:503})}
   if(rows.has(row.id))return Response.json([]);rows.set(row.id,row);return Response.json([row]);
  }
  assert.equal(endpoint.searchParams.get('codigo'),'eq.CLI-TESTE');
  return Response.json([{id:'teste-id',codigo:'CLI-TESTE',nome:'CLIENTE TESTE',tipo:'lead',historico:[...rows.values()],tarefas:[{id:'preparacao-original',etapa_codigo:1,titulo:'Preparar o tipo de prospecção',status:'em_andamento',observacoes:'Tipo de prospecção: E-mail',equipe:{nome:'Laura'}}]}]);
 }};
 return {options,rows,fail:()=>{fail=true}};
}
test('preparação usa canal já salvo, conclui uma vez e abre primeiro contato na própria empresa',async()=>{
 const db=fixture(),first=await companyFlow(db.options);assert.equal(first.prospectTypes[1],'E-mail');assert.equal(db.rows.size,0);
 const results=await Promise.allSettled([1,2].map(()=>companyFlow({...db.options,input:{action:'advance',stage:1}})));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(db.rows.size,1);
 const saved=await companyFlow(db.options);assert.equal(saved.stage,2);assert.equal(saved.prospectTypes[2],'E-mail');assert.equal(saved.events[0].stage,1);assert.equal(saved.taskStatuses[1],'Concluído');
});
test('primeiro contato aguarda prazo, timeout volta para Laura, e resposta antecipada impede avanço posterior',async()=>{
 const db=fixture();await companyFlow({...db.options,input:{action:'advance',stage:1}});
 const waiting=await companyFlow({...db.options,input:{action:'completeContact',stage:2,date:'2026-11-03'}});assert.equal(waiting.stage,3);
 const rowCount=db.rows.size;await companyFlow(db.options);assert.equal(db.rows.size,rowCount);
 const timed=await companyFlow({...db.options,now:()=>Date.parse('2026-11-04T12:00:00Z')});assert.equal(timed.stage,1);assert.equal(timed.returnWait.outcome,'timeout');assert.equal(timed.assignedOwner,'Laura');
 const other=fixture();await companyFlow({...other.options,input:{action:'advance',stage:1}});await companyFlow({...other.options,input:{action:'completeContact',stage:2,date:'2026-11-03'}});
 await companyFlow({...other.options,input:{action:'recordResponse',stage:3}});
 const answered=await companyFlow({...other.options,now:()=>Date.parse('2026-11-04T12:00:00Z')});assert.equal(answered.stage,5);assert.equal(answered.taskStatuses[4],'Não necessário');
});
test('falha de gravação não avança, e canal e comentário permanecem após reabrir',async()=>{
 const db=fixture();db.fail();await assert.rejects(companyFlow({...db.options,input:{action:'advance',stage:1}}));assert.equal((await companyFlow(db.options)).stage,1);
 await companyFlow({...db.options,input:{action:'prospectType',stage:1,value:'WhatsApp'}});
 await companyFlow({...db.options,input:{action:'comment',stage:1,text:'Teste de abordagem',owner:'Laura'}});
 const state=await companyFlow(db.options);assert.equal(state.prospectTypes[1],'WhatsApp');assert.equal(state.comments[0].text,'Teste de abordagem');assert.equal(state.events[0].prospectType,'WhatsApp');
});

test('Samanta agenda a visita e a conclusão libera a realização para Ronaldo',()=>{
 const {createTaskState}=require('./task-flow.cjs');
 const {flowTasks}=require('./company-flow.cjs');
 const engine=createTaskState({stage:5});
 const scheduling=engine.update({action:'advance',stage:5});
 assert.equal(scheduling.stage,6);assert.equal(flowTasks(scheduling)[6].owner,'Samanta');
 const visit=engine.update({action:'advance',stage:6});
 assert.equal(visit.stage,7);assert.equal(flowTasks(visit)[7].owner,'Ronaldo');assert.equal(visit.events[0].owner,'Samanta');
 const proposal=engine.update({action:'advance',stage:7});
 assert.equal(proposal.events[0].owner,'Ronaldo');
});
