const {createHash}=require('node:crypto');
const {isDeepStrictEqual}=require('node:util');
const {createTaskState}=require('./task-flow.cjs');
const stages=[['Cliente identificado pela IA','IA'],['Preparar o tipo de prospecção','Laura'],['Primeiro contato enviado','Laura'],['Retorno do cliente','Laura'],['Segundo contato','Samanta'],['Conversa virtual agendada','Samanta'],['Agendar visita física','Samanta'],['Visita realizada','Ronaldo'],['Proposta apresentada','Ronaldo'],['Negociação','Ronaldo'],['Pedido-teste','Ronaldo'],['Venda fechada','Ronaldo'],['Pós-venda iniciado','Samanta'],['Satisfação após 7 dias','Samanta'],['Satisfação após 30 dias','Samanta'],['Satisfação após 90 dias','Samanta'],['Recompra ou relacionamento contínuo','Samanta']];
function flowTasks(state){return stages.map(([label,owner],i)=>({id:i,etapa:i,label:i===3&&state.stage===3&&state.returnWait?'Aguardando retorno do cliente até '+new Date(state.returnWait.until).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}):label,owner:i===state.stage?(state.assignedOwner||owner):owner,status:state.taskStatuses[i]||(i===state.stage?(i===3?'Aguardando retorno':'Em andamento'):i<state.stage?'Concluído':'Pendente'),due:state.deadlines[i]||'',observacoes:''}))}
function initialFlow(company){
 const task=company.tarefas.find(t=>['em_andamento','Em andamento'].includes(t.status));
 if(!task){const error=new Error('Inicie a prospecção desta empresa antes de abrir a tarefa.');error.status=409;throw error}
 const kind=task.observacoes?.match(/^Tipo de prospecção: ([^\r\n]*)/m)?.[1];
 return createTaskState({stage:task.etapa,assignedOwner:task.owner,existingClient:company.jaCliente===true?true:null,prospectTypes:kind?{[task.etapa]:kind}:{}},16).tick();
}
async function companyFlow({url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY,request=fetch,code,input,now=()=>Date.now()}={}){
 if(typeof code!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(code)||code==='CLI-0001'){const e=new Error('Empresa inválida para este fluxo.');e.status=400;throw e}
 const {loadProspects}=require('./supabase-prospects.cjs');
 for(let attempt=0;attempt<4;attempt++){
  const [company]=await loadProspects({url,key,request,code});
  if(!company){const e=new Error('Empresa não encontrada.');e.status=404;throw e}
  const state=company.flow||initialFlow(company);
  const engine=createTaskState(structuredClone(state),16,now);
  // Persistir primeiro um prazo vencido, mesmo que a ação enviada tenha ficado antiga.
  let next=engine.tick();
  if(isDeepStrictEqual(next,state)&&input){try{next=engine.update(input)}catch(error){error.status=409;throw error}}
  if(isDeepStrictEqual(next,state))return state;
  const revision=(company.flowRevision||0)+1;
  // Cada versão possui uma chave única: apenas uma alteração concorrente pode vencer.
  const hex=createHash('sha256').update('axivel/flow/'+company.bancoId+'/'+revision).digest('hex');
  const id=hex.slice(0,8)+'-'+hex.slice(8,12)+'-5'+hex.slice(13,16)+'-a'+hex.slice(17,20)+'-'+hex.slice(20,32);
  const endpoint=new URL('/rest/v1/historico',url);endpoint.searchParams.set('on_conflict','id');
  const headers={apikey:key,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=representation'};
  if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
  const response=await request(endpoint,{method:'POST',headers,body:JSON.stringify({id,lead_id:company.bancoId,tipo:'fluxo_prospeccao',descricao:'Atualização do fluxo de prospecção: '+stages[next.stage][0],dados:{revision,state:next}}),signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error('Não foi possível salvar o fluxo no Supabase.');
  if((await response.json()).length)return next;
 }
 const error=new Error('Outra pessoa atualizou a tarefa. Atualize e tente novamente.');error.status=409;throw error;
}
async function tickCompanyFlows(credentials={}){
 const {loadProspects}=require('./supabase-prospects.cjs');
 const companies=await loadProspects(credentials);
 for(const company of companies)if(company.id!=='CLI-0001'&&company.flow)await companyFlow({...credentials,code:company.id});
}
module.exports={companyFlow,flowTasks,tickCompanyFlows};
