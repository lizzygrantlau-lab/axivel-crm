const {test}=require('node:test');
const assert=require('node:assert/strict');
const {saveProspectType}=require('./supabase-prospects.cjs');
const taskId='11111111-1111-4111-a111-111111111111';
function fixture(status='em_andamento'){
 let notes='Orientação preservada',writes=0;
 return {writes:()=>writes,options:{url:'https://test.supabase.co',key:'fixture',code:'CLI-TESTE',taskId,value:'E-mail',request:async(endpoint,options)=>{
  if(options.method==='PATCH'){
   assert.equal(endpoint.searchParams.get('id'),'eq.'+taskId);assert.equal(endpoint.searchParams.get('lead_id'),'eq.empresa-teste');assert.equal(endpoint.searchParams.get('status'),'eq.em_andamento');assert.equal(endpoint.searchParams.get('observacoes'),'eq.'+notes);
   notes=JSON.parse(options.body).observacoes;writes++;return Response.json([{id:taskId}]);
  }
  return Response.json([{id:'empresa-teste',codigo:'CLI-TESTE',nome:'CLIENTE TESTE',tarefas:[{id:taskId,titulo:'Preparar o tipo de prospecção',etapa_codigo:1,status,observacoes:notes,equipe:{nome:'Laura'}}]}]);
 }}};
}
test('salva o canal só na tarefa da empresa selecionada, preserva observações e substitui canal anterior',async()=>{
 const db=fixture();let result=await saveProspectType(db.options);
 assert.equal(result.tarefas[0].observacoes,'Tipo de prospecção: E-mail\nOrientação preservada');
 result=await saveProspectType({...db.options,value:'WhatsApp'});
 assert.equal(result.tarefas[0].observacoes,'Tipo de prospecção: WhatsApp\nOrientação preservada');assert.equal(db.writes(),2);
});
test('recusa tarefa de outra empresa, etapa encerrada e canal inválido sem gravar',async()=>{
 const db=fixture();await assert.rejects(saveProspectType({...db.options,taskId:'22222222-2222-4222-a222-222222222222'}),e=>e.status===404);
 await assert.rejects(saveProspectType({...db.options,value:'inválido'}),e=>e.status===400);
 const done=fixture('concluida');await assert.rejects(saveProspectType(done.options),e=>e.status===409);
 assert.equal(db.writes(),0);assert.equal(done.writes(),0);
});
