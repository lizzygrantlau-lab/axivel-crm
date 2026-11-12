const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createTaskState}=require('./task-flow.cjs');
const now=()=>Date.parse('2026-11-11T12:00:00Z');
function waiting(){return createTaskState({stage:2,assignedOwner:'Laura',returnWait:{until:'2026-11-13T02:59:59.999Z',outcome:null},contacts:[{id:'p1',name:'Ana',number:'123'}],comments:[{id:'c1',stage:1,text:'Contato inicial'}]},15,now)}
test('prorroga o retorno sem perder dados e rejeita prazo anterior',()=>{const flow=waiting();assert.throws(()=>flow.update({action:'extendReturnWait',stage:2,date:'2026-11-12'}));const s=flow.update({action:'extendReturnWait',stage:2,date:'2026-11-14'});assert.equal(s.stage,2);assert.equal(s.returnWait.until,'2026-11-15T02:59:59.999Z');assert.equal(s.contacts[0].name,'Ana');assert.equal(s.comments[0].text,'Contato inicial')});
test('ação removida de nova mensagem não altera o fluxo',()=>{const flow=waiting();assert.throws(()=>flow.update({action:'retryContact',stage:2}));assert.equal(flow.getState().stage,2)});
test('resposta encaminha a conversa virtual para Samanta',()=>{const flow=waiting();const s=flow.update({action:'recordResponse',stage:2});assert.equal(s.stage,4);assert.equal(s.assignedOwner,'Samanta');assert.equal(s.returnWait.outcome,'response')});
test('as duas escolhas são gravadas e recuperadas no fluxo da empresa',async()=>{
 const {companyFlow}=require('./company-flow.cjs');
 for(const [action,expectedStage] of [['extendReturnWait',2],['recordResponse',4]]){
  const rows=[{id:'original',lead_id:'empresa',tipo:'fluxo_prospeccao',dados:{revision:1,state:waiting().getState()}}];
  const request=async(endpoint,options={})=>{if(options.method==='POST'){const row=JSON.parse(options.body);rows.push(row);return Response.json([row])}return Response.json([{id:'empresa',codigo:'TESTE',nome:'Teste',historico:rows,tarefas:[]}])};
  const args={url:'https://example.supabase.co',key:'fixture',code:'TESTE',request,now};
  const input={action,stage:2,...(action==='extendReturnWait'?{date:'2026-11-14'}:{})};
  const result=await companyFlow({...args,input});const reloaded=await companyFlow(args);
  assert.equal(result.stage,expectedStage);assert.equal(reloaded.stage,expectedStage);assert.equal(reloaded.contacts[0].name,'Ana');assert.equal(reloaded.comments[0].text,'Contato inicial');
  if(action==='extendReturnWait')assert.equal(reloaded.returnWait.until,'2026-11-15T02:59:59.999Z');
  if(action==='recordResponse')assert.equal(reloaded.assignedOwner,'Samanta');
 }
});
test('um novo prazo impede que o prazo anterior reabra a abordagem',()=>{const flow=waiting();const saved=flow.update({action:'extendReturnWait',stage:2,date:'2026-11-14'});const later=createTaskState(saved,15,()=>Date.parse('2026-11-13T12:00:00Z'));assert.equal(later.tick().stage,2)});
