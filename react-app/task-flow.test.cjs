const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createTaskFlow}=require('./task-flow.cjs');
function fixture(t,saved={stage:1,deadlines:{},assignedOwner:''}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'axivel-wait-test-'));const file=path.join(dir,'tasks.json');
 fs.writeFileSync(file,JSON.stringify(saved));t.after(()=>{fs.unlinkSync(file);fs.rmdirSync(dir)});
 let clock=Date.parse('2026-11-02T15:00:00-03:00');
 let flow=createTaskFlow(file,16,()=>clock);
 return {get flow(){return flow},time(value){clock=Date.parse(value)},reload(){flow=createTaskFlow(file,16,()=>clock)},file};
}
test('concluir a abordagem exige uma data válida de retorno',t=>{
 const f=fixture(t);assert.throws(()=>f.flow.update({action:'advance',stage:1}));
 for(const date of ['', '2026-02-30','2026-11-01','invalid'])assert.throws(()=>f.flow.update({action:'completeContact',stage:1,date}));
 assert.equal(f.flow.tick().stage,1);
 const state=f.flow.update({action:'completeContact',stage:1,date:'2026-11-02'});
 assert.equal(state.stage,2);assert.equal(state.assignedOwner,'Laura');assert.equal(state.returnWait.until,'2026-11-03T02:59:59.999Z');
 assert.throws(()=>f.flow.update({action:'completeContact',stage:1,date:'2026-11-03'}));
});
test('waiting survives restart and cannot be bypassed by deadline, completion or reassignment',t=>{
 const f=fixture(t,{stage:1,deadlines:{1:'2020-01-01T00:00:00Z',2:'2020-01-01T00:00:00Z'},assignedOwner:''});
 assert.equal(f.flow.tick().stage,1);
 f.flow.update({action:'completeContact',stage:1,date:'2026-11-03'});f.reload();assert.equal(f.flow.tick().stage,2);
 assert.throws(()=>f.flow.update({action:'advance',stage:2}));assert.throws(()=>f.flow.update({action:'assign',stage:2,owner:'Samanta'}));assert.throws(()=>f.flow.update({action:'deadline',id:2,due:'2026-12-01T00:00:00Z'}));
 assert.equal(f.flow.tick().stage,2);assert.equal(f.flow.tick().events.length,1);
});
test('prazo vencido reabre abordagem e mantém histórico e canal',t=>{
 const f=fixture(t,{stage:1,prospectTypes:{1:'WhatsApp'}});
 f.flow.update({action:'completeContact',stage:1,date:'2026-11-03'});
 f.time('2026-11-03T23:59:59-03:00');assert.equal(f.flow.tick().stage,2);
 f.time('2026-11-04T00:00:00-03:00');f.reload();const state=f.flow.tick();
 assert.equal(state.stage,1);assert.equal(state.assignedOwner,'Laura');assert.equal(state.taskStatuses[2],'Sem retorno');assert.equal(state.returnWait.outcome,'timeout');assert.equal(state.returnWait.previousChannel,'WhatsApp');assert.equal(state.events.length,2);
 f.reload();assert.equal(f.flow.tick().events.length,2);
 assert.throws(()=>f.flow.update({action:'recordResponse',stage:2}));
 f.flow.update({action:'prospectType',stage:1,value:'Instagram'});
 f.flow.update({action:'completeContact',stage:1,date:'2026-11-05'});
 assert.equal(f.flow.tick().stage,2);assert.equal(f.flow.tick().returnWait.outcome,null);assert.equal(f.flow.tick().taskStatuses[2],undefined);
 f.time('2026-11-06T00:00:00-03:00');assert.equal(f.flow.tick().stage,1);assert.equal(f.flow.tick().returnWait.previousChannel,'Instagram');
});
test('resposta antecipada dispensa segundo contato e impede expiração posterior',t=>{
 const f=fixture(t,{stage:1,deadlines:{},assignedOwner:''});f.flow.update({action:'completeContact',stage:1,date:'2026-11-03'});
 const state=f.flow.update({action:'recordResponse',stage:2});assert.equal(state.stage,4);assert.equal(state.assignedOwner,'Samanta');assert.equal(state.taskStatuses[2],'Concluído');assert.equal(state.taskStatuses[3],'Não necessário');assert.equal(state.returnWait.outcome,'response');
 assert.throws(()=>f.flow.update({action:'recordResponse',stage:2}));f.time('2026-11-05T00:00:00-03:00');f.reload();assert.equal(f.flow.tick().stage,4);assert.equal(f.flow.tick().events.length,2);
});
test('other stage deadlines retain automatic advancement',t=>{
 const f=fixture(t,{stage:5,deadlines:{},assignedOwner:''});f.flow.update({action:'deadline',id:5,due:'2026-11-03T02:59:59.999Z'});f.time('2026-11-03T00:00:00-03:00');assert.equal(f.flow.tick().stage,6);
});
test('Laura records existing client qualification persistently without inventing contacts',t=>{
 const f=fixture(t);
 assert.throws(()=>f.flow.update({action:'qualifyClient',stage:1,existingClient:'yes'}));
 assert.throws(()=>f.flow.update({action:'qualifyClient',stage:2,existingClient:true}));
 f.flow.update({action:'qualifyClient',stage:1,existingClient:true});f.reload();
 assert.equal(f.flow.tick().existingClient,true);assert.equal(f.flow.tick().stage,1);
 assert.equal(f.flow.tick().events[0].type,'Qualificação da empresa');
});

test('qualificacao Axivel aceita cliente, potencial revendedor e situacao pendente',t=>{
 const f=fixture(t);
 for(const status of ['cliente','potencial_revendedor','pendente']){
  const state=f.flow.update({action:'qualifyClient',stage:1,qualificationStatus:status});
  assert.equal(state.qualificationStatus,status);
  assert.equal(state.existingClient,status);
 }
});

test('history preserves the prospecting channel used for each comment and completion',t=>{
 const f=fixture(t,{stage:4,prospectTypes:{4:'Ligação telefônica'},assignedOwner:'Samanta'});
 f.flow.update({action:'comment',stage:4,text:'O cliente respondeu que vai atender',owner:'Samanta'});
 f.flow.update({action:'prospectType',stage:4,value:'E-mail'});
 f.flow.update({action:'advance',stage:4});f.reload();
 const state=f.flow.tick();
 assert.equal(state.comments[0].prospectType,'Ligação telefônica');
 assert.equal(state.events.find(e=>e.type==='Comentário da tarefa').prospectType,'Ligação telefônica');
 assert.equal(state.events[0].type,'Etapa concluída');assert.equal(state.events[0].prospectType,'E-mail');
 assert.equal(state.events[0].stage,4);assert.equal(state.events.find(e=>e.type==='Comentário da tarefa').stage,4);
 assert.equal(state.events[0].result,'Conversa virtual agendada');assert.equal(state.events[0].owner,'Samanta');
});

test('return history keeps the original contact channel after a different retry',t=>{
 const f=fixture(t,{stage:1,prospectTypes:{1:'Instagram'}});
 f.flow.update({action:'completeContact',stage:1,date:'2026-11-03'});
 f.time('2026-11-04T00:00:00-03:00');f.flow.tick();
 f.flow.update({action:'prospectType',stage:1,value:'E-mail'});f.flow.update({action:'completeContact',stage:1,date:'2026-11-05'});
 const state=f.flow.tick();
 assert.equal(state.events.filter(e=>e.type==='Aguardando retorno do cliente').at(-1).prospectType,'Instagram');
 assert.equal(state.events.find(e=>e.type==='Prazo encerrado sem retorno').prospectType,'Instagram');
 assert.equal(state.events[0].prospectType,'E-mail');
});

test('pending preparation can restart after the progress is reset',t=>{
 const f=fixture(t,{stage:1,taskStatuses:{1:'Pendente'},assignedOwner:'Laura'});
 assert.equal(f.flow.tick().taskStatuses[1],'Pendente');
 const state=f.flow.update({action:'completeContact',stage:1,date:'2026-11-03'});
 assert.equal(state.stage,2);assert.equal(state.taskStatuses[1],'Concluído');
});
