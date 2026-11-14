const fs = require('node:fs');
function createTaskFlow(file, lastStage = 15, now = () => Date.now()) {
 let savedState = {};
 if (fs.existsSync(file)) {
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(saved)) savedState = saved;
  else if (saved.length) throw new Error('Formato de tarefas existente não suportado.');
 }
 return createTaskState(savedState,lastStage,now,next=>fs.writeFileSync(file,JSON.stringify(next,null,2),'utf8'));
}
function createTaskState(initial = {}, lastStage = 15, now = () => Date.now(), save = () => {}) {
 let state = {stage:1, deadlines:{}, assignedOwner:'', returnWait:null, taskStatuses:{}, events:[], existingClient:null, qualificationStatus:null,comments:[],contacts:[],prospectTypes:{},...initial};
 function commit(next) { save(next); state=next; }
 function channel(stage=state.stage){return state.prospectTypes[stage]||(stage===2?state.prospectTypes[1]:null)||'WhatsApp';}
 function event(type,result,next,owner,prospectType) {return {...(prospectType?{prospectType}:{}),id:'FLOW-'+now()+'-'+state.events.length,stage:state.stage,createdAt:new Date(now()).toISOString(),date:new Date(now()).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}),type,result,next,owner};}
 function tick() {
  if (state.stage===2 && state.returnWait && !state.returnWait.outcome && Date.parse(state.returnWait.until)<=now()) {
   const previousChannel=state.prospectTypes[1]||'WhatsApp';
   const deadlines={...state.deadlines};for(const id of [1,2])delete deadlines[id];
   const taskStatuses={...state.taskStatuses,2:'Sem retorno'};delete taskStatuses[1];
   commit({...state,stage:1,approach:{version:1,step:0},assignedOwner:'Laura',deadlines,returnWait:{...state.returnWait,outcome:'timeout',previousChannel,endedAt:new Date(now()).toISOString()},taskStatuses,events:[event('Prazo encerrado sem retorno','O cliente não respondeu ao primeiro contato por '+previousChannel+'. Laura deve preparar uma nova abordagem por outro meio.','Preparar a abordagem','Laura',previousChannel),...state.events]});
   return state;
  }
  let next=state;
   while (next.stage < lastStage && !(next.stage===1&&next.returnWait?.outcome==='timeout') && ![1,2].includes(next.stage) && next.deadlines[next.stage] && Date.parse(next.deadlines[next.stage]) <= now()) next={...next,stage:next.stage+1,assignedOwner:''};
  if(next!==state)commit(next);
  return state;
 }
 function update(input) {
  tick();
  let next=state;
  if(input.requestId!==undefined&&(typeof input.requestId!=='string'||!input.requestId||input.requestId.length>100))throw new Error('Identificador de operação inválido.');
  if(input.requestId && (state.processedRequests||[]).includes(input.requestId))return state;
  if(['checklistPrepare','savePerson','contactMade','contactResult'].includes(input.action)){
   if(input.stage!==1||state.stage!==1)throw new Error('A etapa mudou. Confira a tarefa atual.');
   const step=state.approach?.step||0;
   const owner=state.assignedOwner||'Laura';
   if(input.action==='checklistPrepare'){
    if(step!==0)throw new Error('Esta ação já foi concluída.');
    next={...state,approach:{version:1,step:1},events:[event('Abordagem preparada','Preparação concluída.','Realizar o contato',owner),...state.events]};
   }else if(input.action==='savePerson'){
    if(step!==1)throw new Error('Confira a tarefa atual.');
    if(typeof input.name!=='string'||!input.name.trim()||input.name.length>200||typeof input.number!=='string'||!input.number.trim()||input.number.length>200)throw new Error('Informe o nome e o contato da pessoa.');
    const person={id:input.requestId||('PERSON-'+now()),name:input.name.trim(),number:input.number.trim(),role:typeof input.role==='string'?input.role.trim().slice(0,200):'',createdAt:new Date(now()).toISOString()};
    next={...state,contacts:[person,...state.contacts]};
   }else if(input.action==='contactMade'){
    if(step!==1)throw new Error('Confira a tarefa atual.');
    if(!state.contacts.some(c=>c.id===input.contactId))throw new Error('Selecione uma pessoa cadastrada.');
    if(!['WhatsApp','Instagram','Ligação telefônica','E-mail','Visita presencial','Confirmar contato comercial','Outro'].includes(input.method))throw new Error('Selecione o canal de contato.');
    if(state.returnWait?.outcome==='timeout'&&input.method===state.returnWait.previousChannel)throw new Error('Escolha outro meio de contato após a tentativa sem resposta.');
    const action={id:input.requestId||('ACTION-'+now()),contactId:input.contactId,method:input.method,owner,createdAt:new Date(now()).toISOString(),result:null};
    const person=state.contacts.find(c=>c.id===input.contactId);
    next={...state,approach:{version:1,step:2,actionId:action.id},contactActions:[action,...(state.contactActions||[])],prospectTypes:{...state.prospectTypes,1:input.method},events:[event('Contato realizado',person.name+' · '+input.method,'Registrar o resultado',owner,input.method),...state.events]};
   }else{
    if(step!==2)throw new Error('Confira a tarefa atual.');
    if(!['sem_resposta','resposta'].includes(input.result))throw new Error('Selecione o resultado do contato.');
    if(typeof input.notes!=='string'||input.notes.length>2000)throw new Error('Observação inválida.');
    if(input.result==='sem_resposta'&&(typeof input.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||!Number.isFinite(Date.parse(input.date))||new Date(input.date).toISOString().slice(0,10)!==input.date||Date.parse(input.date+'T23:59:59.999-03:00')<=now()))throw new Error('Escolha uma data válida para o retorno.');
    const actions=(state.contactActions||[]).map(a=>a.id===state.approach.actionId?{...a,result:input.result,notes:input.notes.trim(),resultAt:new Date(now()).toISOString()}:a);
    if(!actions.some(a=>a.id===state.approach.actionId))throw new Error('Contato realizado não encontrado.');
    const result=input.result==='resposta'?'Resposta recebida':'Sem resposta';
    const taskStatuses={...state.taskStatuses,1:'Concluído'};delete taskStatuses[2];if(input.result==='resposta'){taskStatuses[2]='Concluído';taskStatuses[3]='Não necessário'}
    next={...state,contactActions:actions,approach:{...state.approach,step:3},stage:input.result==='resposta'?4:2,assignedOwner:input.result==='resposta'?'Samanta':'Laura',returnWait:input.result==='resposta'?{outcome:'response',endedAt:new Date(now()).toISOString()}:{until:new Date(input.date+'T23:59:59.999-03:00').toISOString(),outcome:null},taskStatuses,events:[event(result,input.notes.trim()||result,input.result==='resposta'?'Conversa virtual agendada':'Aguardar retorno do cliente',owner),...state.events]};
   }
   if(input.requestId)next={...next,processedRequests:[...(next.processedRequests||[]),input.requestId].slice(-200)};
   commit(next);return state;
  }
  if (input.action === 'approachMessage') {
   if(input.stage!==state.stage)throw new Error('A etapa mudou. Confira a tarefa atual.');
   if(typeof input.text!=='string'||input.text.length>5000)throw new Error('A mensagem deve ter até 5000 caracteres.');
   const text=input.text.trim();
   next={...state,approachMessage:text,events:[event('Mensagem da abordagem',text,'Confirmar e registrar o envio',state.assignedOwner||'Laura',channel(1)),...state.events]};
  } else if (input.action === 'deleteComment') {
   if(input.stage!==state.stage)throw new Error('A etapa mudou. Confira a tarefa atual.');
   if(typeof input.commentId!=='string'||!input.commentId)throw new Error('Notificação inválida.');
   const comment=state.comments.find(item=>item.id===input.commentId);
   if(!comment)throw new Error('Notificação não encontrada.');
   next={...state,comments:state.comments.filter(item=>item.id!==input.commentId),events:state.events.filter(item=>!(item.type==='Comentário da tarefa'&&item.result===comment.text&&item.owner===comment.owner))};
  } else if (input.action === 'deleteContact') {
   if(input.stage!==state.stage)throw new Error('A etapa mudou. Confira a tarefa atual.');
   if(typeof input.contactId!=='string'||!state.contacts.some(contact=>contact.id===input.contactId))throw new Error('Contato não encontrado.');
   const removed=state.contacts.find(contact=>contact.id===input.contactId);
   next={...state,contacts:state.contacts.filter(contact=>contact.id!==input.contactId),events:[event('Contato removido',removed.name+' · '+removed.number,'Acompanhar relacionamento',input.owner||state.assignedOwner||'Laura'),...state.events]};
  } else if (input.action === 'updateContact') {
   if(input.stage!==state.stage)throw new Error('A etapa mudou. Confira a tarefa atual.');
   const fields=['name','role','method','number','notes'];
   if(typeof input.contactId!=='string'||!fields.every(field=>typeof input[field]==='string'))throw new Error('Preencha os dados do contato.');
   if(!input.name.trim()||!input.method.trim()||!input.number.trim())throw new Error('Informe nome, meio e número ou identificador do contato.');
   if(input.name.length>200||input.role.length>200||input.method.length>100||input.number.length>200||input.notes.length>2000)throw new Error('Os dados do contato excedem o limite permitido.');
   if(!state.contacts.some(contact=>contact.id===input.contactId))throw new Error('Contato não encontrado.');
   next={...state,contacts:state.contacts.map(contact=>contact.id===input.contactId?{...contact,name:input.name.trim(),role:input.role.trim(),method:input.method.trim(),number:input.number.trim(),notes:input.notes.trim(),confirmed:typeof input.confirmed==='boolean'?input.confirmed:contact.confirmed===true,updatedAt:new Date(now()).toISOString()}:contact)};
  } else if (input.action === 'comment') {
   if(input.stage!==state.stage)throw new Error('A etapa mudou. Confira a tarefa atual.');
   if(typeof input.text!=='string'||!input.text.trim()||input.text.length>5000)throw new Error('Informe um comentário de até 5000 caracteres.');
   if(!['Laura','Samanta','Ronaldo','IA'].includes(input.owner))throw new Error('Responsável inválido.');
   const createdAt=new Date(now()).toISOString();
   const comment={id:'COMMENT-'+now()+'-'+state.comments.length,stage:state.stage,createdAt,date:new Date(createdAt).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}),text:input.text.trim(),owner:input.owner,prospectType:channel()};
   next={...state,comments:[comment,...state.comments],events:[event('Comentário da tarefa',comment.text,'Acompanhar tarefa',comment.owner,comment.prospectType),...state.events]};
  } else if (input.action === 'contact') {
   if(input.stage!==state.stage)throw new Error('A etapa mudou. Confira a tarefa atual.');
   const fields=['name','role','method','number','notes'];
   if(!fields.every(field=>typeof input[field]==='string'))throw new Error('Preencha os dados do contato.');
   if(!input.name.trim()||!input.method.trim()||!input.number.trim())throw new Error('Informe nome, meio e número ou identificador do contato.');
   if(input.name.length>200||input.role.length>200||input.method.length>100||input.number.length>200||input.notes.length>2000)throw new Error('Os dados do contato excedem o limite permitido.');
   const contact={id:'CONTACT-'+now()+'-'+state.contacts.length,stage:state.stage,name:input.name.trim(),role:input.role.trim(),method:input.method.trim(),number:input.number.trim(),notes:input.notes.trim(),confirmed:input.confirmed===true,owner:input.owner,createdAt:new Date(now()).toISOString(),date:new Date(now()).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})};
   next={...state,contacts:[contact,...state.contacts],prospectTypes:{...state.prospectTypes,[state.stage]:contact.method},events:[event('Contato registrado',contact.name+' · '+contact.method+' · '+contact.number,'Acompanhar relacionamento',input.owner),...state.events]};
  } else if (input.action === 'prospectType') {
   if(input.stage!==state.stage)throw new Error('A etapa mudou. Confira a tarefa atual.');
   if(!['WhatsApp','Instagram','Ligação telefônica','E-mail','Visita presencial'].includes(input.value))throw new Error('Tipo de prospecção inválido.');
   next={...state,prospectTypes:{...state.prospectTypes,[state.stage]:input.value}};
  } else if (input.action === 'qualifyClient') {
   if(input.stage!==state.stage || state.stage>4)throw new Error('A etapa mudou. Confira a tarefa atual.');
   const validStatuses=['cliente','potencial_revendedor','pendente'];
   const status=typeof input.qualificationStatus==='string'?input.qualificationStatus:input.existingClient===true?'cliente':input.existingClient===false?'potencial_revendedor':null;
   if(!validStatuses.includes(status))throw new Error('Selecione uma opção de qualificação Axivel.');
   const labels={cliente:'já é cliente Axivel',potencial_revendedor:'é um potencial revendedor',pendente:'está com a situação pendente'};
   next={...state,existingClient:typeof input.qualificationStatus==='string'?status:status==='cliente',qualificationStatus:status,events:[event('Qualificação da empresa','Laura registrou que a empresa '+labels[status]+'.','Definir próxima ação','Laura'),...state.events]};
  } else if (input.action === 'completeContact') {
   if(input.stage!==state.stage || state.stage!==1 || (state.returnWait&&!state.returnWait.outcome)) throw new Error('A etapa mudou. Confira a tarefa atual.');
   const date=input.date;
   if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw new Error('Informe uma data válida.');
   const until=new Date(date+'T23:59:59.999-03:00').toISOString();
   if(Date.parse(until)<=now())throw new Error('Escolha hoje ou uma data futura.');
   const taskStatuses={...state.taskStatuses,1:'Concluído'};delete taskStatuses[2];
   next={...state,stage:2,assignedOwner:'Laura',taskStatuses,returnWait:{until,outcome:null},events:[event('Aguardando retorno do cliente','Primeiro contato concluído. Aguardando retorno até '+date.split('-').reverse().join('/')+'.','Aguardar resposta do cliente','Laura',channel()),...state.events]};
  } else if (input.action === 'extendReturnWait') {
   if(input.stage!==2||state.stage!==2||!state.returnWait||state.returnWait.outcome)throw new Error('A espera já terminou. Confira a tarefa atual.');
   const date=input.date;
   if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw new Error('Informe uma data válida.');
   const until=new Date(date+'T23:59:59.999-03:00').toISOString();
   if(Date.parse(until)<=now()||Date.parse(until)<=Date.parse(state.returnWait.until))throw new Error('Escolha uma data posterior ao prazo atual.');
   next={...state,returnWait:{...state.returnWait,until},events:[event('Prazo de retorno prorrogado','Aguardar retorno até '+date.split('-').reverse().join('/')+'.','Aguardar resposta do cliente',state.assignedOwner||'Laura'),...state.events]};
  } else if (input.action === 'scheduleFollowUp') {
   if(![4,5].includes(state.stage)||input.stage!==state.stage)throw new Error('A etapa mudou. Confira a tarefa atual.');
   const date=input.date;
   if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||Date.parse(date+'T23:59:59.999-03:00')<=now())throw new Error('Escolha uma data válida para acompanhar a tentativa.');
   const until=new Date(date+'T23:59:59.999-03:00').toISOString();
   next={...state,assignedOwner:'Samanta',scheduleWait:{stage:state.stage,until,createdAt:new Date(now()).toISOString()},taskStatuses:{...state.taskStatuses,[state.stage]:'Aguardando retorno'},events:[event('Tentativa de agendamento','Aguardar retorno sobre o agendamento '+(state.stage===5?'da visita física ':'da conversa virtual ')+'até '+date.split('-').reverse().join('/')+'.','Acompanhar tentativa de agendamento','Samanta'),...state.events]};
  } else if (input.action === 'stageFollowUp') {
   if(!Number.isInteger(input.stage)||input.stage!==state.stage||state.stage<3||[4,5].includes(state.stage)||state.stage>lastStage||state.taskStatuses[state.stage]==='Concluído')throw new Error('A etapa mudou. Confira a tarefa atual.');
   const date=input.date;
   if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||Date.parse(date+'T23:59:59.999-03:00')<=now())throw new Error('Escolha uma data válida para acompanhar a tentativa.');
   const owner=state.assignedOwner||(state.stage===3||state.stage>=11?'Samanta':'Ronaldo'),until=new Date(date+'T23:59:59.999-03:00').toISOString();
   next={...state,assignedOwner:owner,stageWait:{stage:state.stage,until,createdAt:new Date(now()).toISOString()},taskStatuses:{...state.taskStatuses,[state.stage]:'Aguardando retorno'},events:[event('Tentativa registrada','Aguardar acompanhamento até '+date.split('-').reverse().join('/')+'.','Acompanhar tarefa',owner),...state.events]};
  } else if (input.action === 'finishFinalStage') {
   if(input.stage!==lastStage||state.stage!==lastStage||state.taskStatuses[lastStage]==='Concluído')throw new Error('A etapa mudou ou já foi concluída.');
   const owner=state.assignedOwner||'Samanta';
   next={...state,taskStatuses:{...state.taskStatuses,[lastStage]:'Concluído'},events:[event('Última fase concluída','A última fase do fluxo foi concluída.','Fluxo concluído',owner),...state.events]};
  } else if (input.action === 'scheduleVisit' || input.action === 'updateVisitDetails') {
   const correcting=input.action==='updateVisitDetails';
   if((!correcting&&(input.stage!==5||state.stage!==5))||(correcting&&(input.stage!==6||state.stage!==6)))throw new Error('A etapa mudou. Confira a tarefa atual.');
   const {date,time,address,contactName,contactNumber}=input;
   if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw new Error('Informe uma data válida para a visita.');
   if(typeof time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('Informe um horário válido para a visita.');
   if(typeof address!=='string'||!address.trim()||address.length>2000)throw new Error('Informe o endereço completo da visita.');
   if(typeof contactName!=='string'||!contactName.trim()||contactName.length>200||typeof contactNumber!=='string'||!contactNumber.trim()||contactNumber.length>200)throw new Error('Informe a pessoa e o número de contato para a visita.');
   const visit={date,time,address:address.trim(),contactName:contactName.trim(),contactNumber:contactNumber.trim(),scheduledBy:'Samanta',scheduledAt:new Date(now()).toISOString()};
   next={...state,stage:6,assignedOwner:correcting?(state.assignedOwner||'Ronaldo'):'Ronaldo',visit,taskStatuses:{...state.taskStatuses,5:'Concluído'},events:[event(correcting?'Dados da visita atualizados':'Visita agendada','Visita em '+date.split('-').reverse().join('/')+' às '+time+' · '+visit.address,'Visita realizada','Samanta'),...state.events]};
  } else if (input.action === 'recordResponse') {
   if(input.stage!==2||state.stage!==2||!state.returnWait||state.returnWait.outcome)throw new Error('A espera já terminou. Confira a tarefa atual.');
   next={...state,stage:4,assignedOwner:'Samanta',returnWait:{...state.returnWait,outcome:'response',endedAt:new Date(now()).toISOString()},taskStatuses:{...state.taskStatuses,2:'Concluído',3:'Não necessário'},events:[event('Resposta recebida','Resposta do cliente registrada; segundo contato dispensado.','Conversa virtual agendada','Samanta',channel()),...state.events]};
  } else if (input.action === 'deadline') {
   if (!Number.isInteger(input.id) || input.id < state.stage || input.id > lastStage || [1,2].includes(input.id)) throw new Error('O prazo de retorno é definido ao concluir o primeiro contato.');
   if (input.due !== '' && (typeof input.due !== 'string' || !Number.isFinite(Date.parse(input.due)) || Date.parse(input.due) <= now())) throw new Error('Informe uma data futura.');
   next = {...state, deadlines:{...state.deadlines, [input.id]:input.due}};
  } else if (input.action === 'reopenPrevious') {
   if(input.stage!==state.stage||state.stage<=1)throw new Error('Não há uma etapa anterior para reabrir.');
   const previous=state.stage-1;
   const owner=previous<=2?'Laura':previous<=5?'Samanta':previous<=10?'Ronaldo':'Samanta';
   const taskStatuses={...state.taskStatuses};delete taskStatuses[state.stage];delete taskStatuses[previous];
   next={...state,stage:previous,assignedOwner:owner,taskStatuses,events:[event('Etapa reaberta','A etapa anterior foi reaberta para corrigir um avanço feito por engano.','Retomar etapa anterior',owner),...state.events]};
  } else if (input.action === 'advance') {
   if (input.stage !== state.stage) throw new Error('A etapa mudou. Confira a tarefa atual.');
   if (state.stage===2)throw new Error('Registre a resposta do cliente ou prorrogue o prazo de retorno.');
   if (state.stage===5)throw new Error('Informe a data, o horário e o endereço para encaminhar a visita.');
   if (state.stage===1)throw new Error('Conclua o primeiro contato com uma data de retorno ou registre a resposta do cliente.');
   if(state.stage===1&&state.returnWait?.outcome==='timeout'&&(!state.prospectTypes[1]||state.prospectTypes[1]===state.returnWait.previousChannel))throw new Error('Escolha outro meio de contato. O cliente não respondeu ao contato por '+state.returnWait.previousChannel+'.');
   if (state.stage < lastStage) {
    const labels=['Cliente identificado pela IA','Preparar a abordagem','Retorno do cliente','Segundo contato','Conversa virtual agendada','Agendar visita física','Visita realizada','Proposta apresentada','Negociação','Pedido-teste','Venda fechada','Pós-venda iniciado','Satisfação após 7 dias','Satisfação após 30 dias','Satisfação após 90 dias','Recompra ou relacionamento contínuo'];
    const owner=state.assignedOwner||(state.stage===0?'IA':state.stage<4?'Laura':state.stage<7||state.stage>=12?'Samanta':'Ronaldo');
    next = {...state, stage:state.stage+1, assignedOwner:'',taskStatuses:{...state.taskStatuses,[state.stage]:'Concluído'},events:[event('Etapa concluída',labels[state.stage]||'Etapa '+(state.stage+1),labels[state.stage+1]||'Próxima etapa',owner,channel()),...state.events]};
   }
  } else if (input.action === 'assign') {
   if (input.stage !== state.stage) throw new Error('A etapa mudou. Confira a tarefa atual.');
   if (state.stage===2)throw new Error('Laura permanece responsável enquanto aguarda o retorno do cliente.');
   if (!['Laura','Samanta','Ronaldo'].includes(input.owner)) throw new Error('Responsável inválido.');
   next = {...state, assignedOwner:input.owner,events:[event('Responsável alterado','Tarefa atribuída a '+input.owner,'Acompanhar tarefa',input.owner),...state.events]};
  } else throw new Error('Ação inválida.');
  if(input.requestId)next={...next,processedRequests:[...(next.processedRequests||[]),input.requestId].slice(-200)};
  commit(next); return state;
 }
 return {tick, update, getState:()=>state};
}
module.exports = {createTaskFlow,createTaskState};
