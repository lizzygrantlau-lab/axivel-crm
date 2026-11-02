const fs = require('node:fs');
function createTaskFlow(file, lastStage = 16, now = () => Date.now()) {
 let state = {stage:1, deadlines:{}, assignedOwner:'', returnWait:null, taskStatuses:{}, events:[], existingClient:null};
 if (fs.existsSync(file)) {
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(saved)) state = {...state,...saved};
  else if (saved.length) throw new Error('Formato de tarefas existente não suportado.');
 }
 function commit(next) { fs.writeFileSync(file, JSON.stringify(next, null, 2), 'utf8'); state=next; }
 function event(type,result,next,owner) {return {id:'FLOW-'+now()+'-'+state.events.length,createdAt:new Date(now()).toISOString(),date:new Date(now()).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}),type,result,next,owner};}
 function tick() {
  if (state.stage===3 && state.returnWait && !state.returnWait.outcome && Date.parse(state.returnWait.until)<=now()) {
   commit({...state,stage:4,assignedOwner:'Samanta',returnWait:{...state.returnWait,outcome:'timeout',endedAt:new Date(now()).toISOString()},taskStatuses:{...state.taskStatuses,3:'Sem retorno'},events:[event('Prazo encerrado sem retorno','O cliente não respondeu até a data limite.','Segundo contato','Samanta'),...state.events]});
   return state;
  }
  let next=state;
  while (next.stage < lastStage && ![2,3].includes(next.stage) && next.deadlines[next.stage] && Date.parse(next.deadlines[next.stage]) <= now()) next={...next,stage:next.stage+1,assignedOwner:''};
  if(next!==state)commit(next);
  return state;
 }
 function update(input) {
  tick();
  let next=state;
  if (input.action === 'qualifyClient') {
   if(input.stage!==state.stage || state.stage>4)throw new Error('A etapa mudou. Confira a tarefa atual.');
   if(typeof input.existingClient!=='boolean')throw new Error('Informe se a empresa já é cliente.');
   next={...state,existingClient:input.existingClient,events:[event('Qualificação da empresa',input.existingClient?'Laura confirmou que a empresa já é cliente.':'Laura confirmou que a empresa ainda não é cliente.','Definir próxima ação','Laura'),...state.events]};
  } else if (input.action === 'completeContact') {
   if(input.stage!==state.stage || ![2,3].includes(state.stage) || state.returnWait) throw new Error('A etapa mudou. Confira a tarefa atual.');
   const date=input.date;
   if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw new Error('Informe uma data válida.');
   const until=new Date(date+'T23:59:59.999-03:00').toISOString();
   if(Date.parse(until)<=now())throw new Error('Escolha hoje ou uma data futura.');
   next={...state,stage:3,assignedOwner:'Laura',returnWait:{until,outcome:null},events:[event('Aguardando retorno do cliente','Primeiro contato concluído. Aguardando retorno até '+date.split('-').reverse().join('/')+'.','Aguardar resposta do cliente','Laura'),...state.events]};
  } else if (input.action === 'recordResponse') {
   if(input.stage!==3||state.stage!==3||!state.returnWait||state.returnWait.outcome)throw new Error('A espera já terminou. Confira a tarefa atual.');
   next={...state,stage:5,assignedOwner:'Samanta',returnWait:{...state.returnWait,outcome:'response',endedAt:new Date(now()).toISOString()},taskStatuses:{...state.taskStatuses,3:'Concluído',4:'Não necessário'},events:[event('Resposta recebida','Resposta do cliente registrada; segundo contato dispensado.','Conversa virtual agendada','Samanta'),...state.events]};
  } else if (input.action === 'deadline') {
   if (!Number.isInteger(input.id) || input.id < state.stage || input.id > lastStage || [2,3].includes(input.id)) throw new Error('O prazo de retorno é definido ao concluir o primeiro contato.');
   if (input.due !== '' && (typeof input.due !== 'string' || !Number.isFinite(Date.parse(input.due)) || Date.parse(input.due) <= now())) throw new Error('Informe uma data futura.');
   next = {...state, deadlines:{...state.deadlines, [input.id]:input.due}};
  } else if (input.action === 'advance') {
   if (input.stage !== state.stage) throw new Error('A etapa mudou. Confira a tarefa atual.');
   if ([2,3].includes(state.stage))throw new Error('Conclua o primeiro contato com uma data de retorno ou registre a resposta do cliente.');
   if (state.stage < lastStage) next = {...state, stage:state.stage+1, assignedOwner:''};
  } else if (input.action === 'assign') {
   if (input.stage !== state.stage) throw new Error('A etapa mudou. Confira a tarefa atual.');
   if (state.stage===3)throw new Error('Laura permanece responsável enquanto aguarda o retorno do cliente.');
   if (!['Laura','Samanta','Ronaldo'].includes(input.owner)) throw new Error('Responsável inválido.');
   next = {...state, assignedOwner:input.owner};
  } else throw new Error('Ação inválida.');
  commit(next); return state;
 }
 return {tick, update};
}
module.exports = {createTaskFlow};
