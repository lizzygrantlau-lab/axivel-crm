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
test('preparation advances normally; first contact requires a valid return date',t=>{
 const f=fixture(t);f.flow.update({action:'advance',stage:1});assert.equal(f.flow.tick().stage,2);
 assert.throws(()=>f.flow.update({action:'advance',stage:2}));
 for(const date of ['', '2026-02-30','2026-11-01','invalid'])assert.throws(()=>f.flow.update({action:'completeContact',stage:2,date}));
 assert.equal(f.flow.tick().stage,2);
 const state=f.flow.update({action:'completeContact',stage:2,date:'2026-11-02'});
 assert.equal(state.stage,3);assert.equal(state.assignedOwner,'Laura');assert.equal(state.returnWait.until,'2026-11-03T02:59:59.999Z');
 assert.throws(()=>f.flow.update({action:'completeContact',stage:2,date:'2026-11-03'}));
});
test('waiting survives restart and cannot be bypassed by deadline, completion or reassignment',t=>{
 const f=fixture(t,{stage:2,deadlines:{2:'2020-01-01T00:00:00Z',3:'2020-01-01T00:00:00Z'},assignedOwner:''});
 assert.equal(f.flow.tick().stage,2);
 f.flow.update({action:'completeContact',stage:2,date:'2026-11-03'});f.reload();assert.equal(f.flow.tick().stage,3);
 assert.throws(()=>f.flow.update({action:'advance',stage:3}));assert.throws(()=>f.flow.update({action:'assign',stage:3,owner:'Samanta'}));assert.throws(()=>f.flow.update({action:'deadline',id:3,due:'2026-12-01T00:00:00Z'}));
 assert.equal(f.flow.tick().stage,3);assert.equal(f.flow.tick().events.length,1);
});
test('timeout reopens preparation for Laura once and requires another channel',t=>{
 const f=fixture(t,{stage:2,deadlines:{1:'2020-01-01T00:00:00Z'},prospectTypes:{1:'WhatsApp',2:'WhatsApp'}});
 f.flow.update({action:'completeContact',stage:2,date:'2026-11-03'});
 f.time('2026-11-03T23:59:59-03:00');assert.equal(f.flow.tick().stage,3);
 f.time('2026-11-04T00:00:00-03:00');f.reload();const state=f.flow.tick();
 assert.equal(state.stage,1);assert.equal(state.assignedOwner,'Laura');assert.equal(state.taskStatuses[3],'Sem retorno');assert.equal(state.returnWait.outcome,'timeout');assert.equal(state.returnWait.previousChannel,'WhatsApp');assert.equal(state.deadlines[1],undefined);assert.equal(state.events.length,2);
 f.reload();assert.equal(f.flow.tick().stage,1);assert.equal(f.flow.tick().events.length,2);
 assert.throws(()=>f.flow.update({action:'recordResponse',stage:3}));
 assert.throws(()=>f.flow.update({action:'advance',stage:1}),/outro meio/);
 f.flow.update({action:'deadline',id:1,due:'2026-11-04T01:00:00-03:00'});f.time('2026-11-04T02:00:00-03:00');assert.equal(f.flow.tick().stage,1);
 f.flow.update({action:'prospectType',stage:1,value:'Instagram'});f.flow.update({action:'advance',stage:1});
 assert.equal(f.flow.tick().stage,2);assert.equal(f.flow.tick().prospectTypes[2],'Instagram');
 f.flow.update({action:'completeContact',stage:2,date:'2026-11-05'});f.reload();
 assert.equal(f.flow.tick().stage,3);assert.equal(f.flow.tick().returnWait.outcome,null);assert.equal(f.flow.tick().taskStatuses[3],undefined);
 assert.throws(()=>f.flow.update({action:'completeContact',stage:2,date:'2026-11-05'}));
 f.time('2026-11-06T00:00:00-03:00');assert.equal(f.flow.tick().stage,1);assert.equal(f.flow.tick().returnWait.previousChannel,'Instagram');
 f.flow.update({action:'prospectType',stage:1,value:'E-mail'});f.flow.update({action:'advance',stage:1});f.flow.update({action:'completeContact',stage:2,date:'2026-11-07'});
 const response=f.flow.update({action:'recordResponse',stage:3});assert.equal(response.stage,5);assert.equal(response.taskStatuses[4],'Não necessário');
 f.time('2026-11-08T00:00:00-03:00');assert.equal(f.flow.tick().stage,5);
});

test('early response skips second contact and disables the old timer',t=>{
 const f=fixture(t,{stage:2,deadlines:{},assignedOwner:''});f.flow.update({action:'completeContact',stage:2,date:'2026-11-03'});
 const state=f.flow.update({action:'recordResponse',stage:3});assert.equal(state.stage,5);assert.equal(state.assignedOwner,'Samanta');assert.equal(state.taskStatuses[3],'Concluído');assert.equal(state.taskStatuses[4],'Não necessário');assert.equal(state.returnWait.outcome,'response');
 assert.throws(()=>f.flow.update({action:'recordResponse',stage:3}));f.time('2026-11-05T00:00:00-03:00');f.reload();assert.equal(f.flow.tick().stage,5);assert.equal(f.flow.tick().events.length,2);
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

test('history preserves the prospecting channel used for each comment and completion',t=>{
 const f=fixture(t,{stage:5,prospectTypes:{5:'Ligação telefônica'},assignedOwner:'Samanta'});
 f.flow.update({action:'comment',stage:5,text:'O cliente respondeu que vai atender',owner:'Samanta'});
 f.flow.update({action:'prospectType',stage:5,value:'E-mail'});
 f.flow.update({action:'advance',stage:5});f.reload();
 const state=f.flow.tick();
 assert.equal(state.comments[0].prospectType,'Ligação telefônica');
 assert.equal(state.events.find(e=>e.type==='Comentário da tarefa').prospectType,'Ligação telefônica');
 assert.equal(state.events[0].type,'Etapa concluída');assert.equal(state.events[0].prospectType,'E-mail');
 assert.equal(state.events[0].stage,5);assert.equal(state.events.find(e=>e.type==='Comentário da tarefa').stage,5);
 assert.equal(state.events[0].result,'Conversa virtual agendada');assert.equal(state.events[0].owner,'Samanta');
});

test('return history keeps the original contact channel after a different retry',t=>{
 const f=fixture(t,{stage:2,prospectTypes:{2:'Instagram'}});
 f.flow.update({action:'completeContact',stage:2,date:'2026-11-03'});
 f.time('2026-11-04T00:00:00-03:00');f.flow.tick();
 f.flow.update({action:'prospectType',stage:1,value:'E-mail'});f.flow.update({action:'advance',stage:1});
 const state=f.flow.tick();
 assert.equal(state.events.find(e=>e.type==='Aguardando retorno do cliente').prospectType,'Instagram');
 assert.equal(state.events.find(e=>e.type==='Prazo encerrado sem retorno').prospectType,'Instagram');
 assert.equal(state.events[0].prospectType,'E-mail');
});

test('pending preparation can restart after the progress is reset',t=>{
 const f=fixture(t,{stage:1,taskStatuses:{1:'Pendente'},assignedOwner:'Laura'});
 assert.equal(f.flow.tick().taskStatuses[1],'Pendente');
 const state=f.flow.update({action:'advance',stage:1});
 assert.equal(state.stage,2);assert.equal(state.taskStatuses[1],'Concluído');
});
