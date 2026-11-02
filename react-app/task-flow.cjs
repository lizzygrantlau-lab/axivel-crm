const fs = require('node:fs');
function createTaskFlow(file, lastStage = 16, now = () => Date.now()) {
 let savedState = {};
 if (fs.existsSync(file)) {
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(saved)) savedState = saved;
  else if (saved.length) throw new Error('Formato de tarefas existente não suportado.');
 }
 return createTaskState(savedState,lastStage,now,next=>fs.writeFileSync(file,JSON.stringify(next,null,2),'utf8'));
}
function createTaskState(initial = {}, lastStage = 16, now = () => Date.now(), save = () => {}) {
 let state = {stage:1, deadlines:{}, assignedOwner:'', returnWait:null, taskStatuses:{}, events:[], existingClient:null,comments:[],prospectTypes:{},...initial};
 function commit(next) { save(next); state=next; }
 function channel(stage=state.stage){return state.prospectTypes[stage]||(stage===3?state.prospectTypes[2]:null)||'WhatsApp';}
 function event(type,result,next,owner,prospectType) {return {...(prospectType?{prospectType}:{}),id:'FLOW-'+now()+'-'+state.events.length,stage:state.stage,createdAt:new Date(now()).toISOString(),date:new Date(now()).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}),type,result,next,owner};}
 function tick() {
  if (state.stage===3 && state.returnWait && !state.returnWait.outcome && Date.parse(state.returnWait.until)<=now()) {
   const previousChannel=state.prospectTypes[2]||state.prospectTypes[1]||'WhatsApp';
   const deadlines={...state.deadlines};for(const id of [1,2,3])delete deadlines[id];
   commit({...state,stage:1,assignedOwner:'Laura',deadlines,returnWait:{...state.returnWait,outcome:'timeout',previousChannel,endedAt:new Date(now()).toISOString()},taskStatuses:{...state.taskStatuses,3:'Sem retorno'},events:[event('Prazo encerrado sem retorno','O cliente não respondeu ao primeiro contato por '+previousChannel+'. Laura deve preparar uma nova abordagem por outro meio.','Preparar o tipo de prospecção','Laura',previousChannel),...state.events]});
   return state;
  }
  let next=state;
  while (next.stage < lastStage && !(next.stage===1&&next.returnWait?.outcome==='timeout') && ![2,3].includes(next.stage) && next.deadlines[next.stage] && Date.parse(next.deadlines[next.stage]) <= now()) next={...next,stage:next.stage+1,assignedOwner:''};
  if(next!==state)commit(next);
  return state;
 }
 function update(input) {
  tick();
  let next=state;
  if (input.action === 'comment') {
   if(input.stage!==state.stage)throw new Error('A etapa mudou. Confira a tarefa atual.');
   if(typeof input.text!=='string'||!input.text.trim()||input.text.length>5000)throw new Error('Informe um comentário de até 5000 caracteres.');
   if(!['Laura','Samanta','Ronaldo','IA'].includes(input.owner))throw new Error('Responsável inválido.');
   const comment={id:'COMMENT-'+now()+'-'+state.comments.length,stage:state.stage,date:new Date(now()).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}),text:input.text.trim(),owner:input.owner,prospectType:channel()};
   next={...state,comments:[comment,...state.comments],events:[event('Comentário da tarefa',comment.text,'Acompanhar tarefa',comment.owner,comment.prospectType),...state.events]};
  } else if (input.action === 'prospectType') {
   if(input.stage!==state.stage)throw new Error('A etapa mudou. Confira a tarefa atual.');
   if(!['WhatsApp','Instagram','Ligação telefônica','E-mail','Visita presencial'].includes(input.value))throw new Error('Tipo de prospecção inválido.');
   next={...state,prospectTypes:{...state.prospectTypes,[state.stage]:input.value}};
  } else if (input.action === 'qualifyClient') {
   if(input.stage!==state.stage || state.stage>4)throw new Error('A etapa mudou. Confira a tarefa atual.');
   if(typeof input.existingClient!=='boolean')throw new Error('Informe se a empresa já é cliente.');
   next={...state,existingClient:input.existingClient,events:[event('Qualificação da empresa',input.existingClient?'Laura confirmou que a empresa já é cliente.':'Laura confirmou que a empresa ainda não é cliente.','Definir próxima ação','Laura'),...state.events]};
  } else if (input.action === 'completeContact') {
   if(input.stage!==state.stage || ![2,3].includes(state.stage) || (state.returnWait&&!state.returnWait.outcome)) throw new Error('A etapa mudou. Confira a tarefa atual.');
   const date=input.date;
   if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw new Error('Informe uma data válida.');
   const until=new Date(date+'T23:59:59.999-03:00').toISOString();
   if(Date.parse(until)<=now())throw new Error('Escolha hoje ou uma data futura.');
   const taskStatuses={...state.taskStatuses};delete taskStatuses[3];
   next={...state,stage:3,assignedOwner:'Laura',taskStatuses,returnWait:{until,outcome:null},events:[event('Aguardando retorno do cliente','Primeiro contato concluído. Aguardando retorno até '+date.split('-').reverse().join('/')+'.','Aguardar resposta do cliente','Laura',channel()),...state.events]};
  } else if (input.action === 'recordResponse') {
   if(input.stage!==3||state.stage!==3||!state.returnWait||state.returnWait.outcome)throw new Error('A espera já terminou. Confira a tarefa atual.');
   next={...state,stage:5,assignedOwner:'Samanta',returnWait:{...state.returnWait,outcome:'response',endedAt:new Date(now()).toISOString()},taskStatuses:{...state.taskStatuses,3:'Concluído',4:'Não necessário'},events:[event('Resposta recebida','Resposta do cliente registrada; segundo contato dispensado.','Conversa virtual agendada','Samanta',channel()),...state.events]};
  } else if (input.action === 'deadline') {
   if (!Number.isInteger(input.id) || input.id < state.stage || input.id > lastStage || [2,3].includes(input.id)) throw new Error('O prazo de retorno é definido ao concluir o primeiro contato.');
   if (input.due !== '' && (typeof input.due !== 'string' || !Number.isFinite(Date.parse(input.due)) || Date.parse(input.due) <= now())) throw new Error('Informe uma data futura.');
   next = {...state, deadlines:{...state.deadlines, [input.id]:input.due}};
  } else if (input.action === 'advance') {
   if (input.stage !== state.stage) throw new Error('A etapa mudou. Confira a tarefa atual.');
   if ([2,3].includes(state.stage))throw new Error('Conclua o primeiro contato com uma data de retorno ou registre a resposta do cliente.');
   if(state.stage===1&&state.returnWait?.outcome==='timeout'&&(!state.prospectTypes[1]||state.prospectTypes[1]===state.returnWait.previousChannel))throw new Error('Escolha outro meio de contato. O cliente não respondeu ao contato por '+state.returnWait.previousChannel+'.');
   if (state.stage < lastStage) {
    const labels=['Cliente identificado pela IA','Preparar o tipo de prospecção','Primeiro contato enviado','Retorno do cliente','Segundo contato','Conversa virtual agendada','Agendar visita física','Visita realizada','Proposta apresentada','Negociação','Pedido-teste','Venda fechada','Pós-venda iniciado','Satisfação após 7 dias','Satisfação após 30 dias','Satisfação após 90 dias','Recompra ou relacionamento contínuo'];
    const owner=state.assignedOwner||(state.stage===0?'IA':state.stage<4?'Laura':state.stage<7||state.stage>=12?'Samanta':'Ronaldo');
    next = {...state, stage:state.stage+1, assignedOwner:'',taskStatuses:{...state.taskStatuses,[state.stage]:'Concluído'},events:[event('Etapa concluída',labels[state.stage]||'Etapa '+(state.stage+1),labels[state.stage+1]||'Próxima etapa',owner,channel()),...state.events],...(state.stage===1?{prospectTypes:{...state.prospectTypes,2:state.prospectTypes[1]||'WhatsApp'}}:{})};
   }
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
module.exports = {createTaskFlow,createTaskState};
