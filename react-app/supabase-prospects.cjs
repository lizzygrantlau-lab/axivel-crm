// Executado apenas pelo servidor local. Nunca enviar a chave ao navegador.
async function loadProspects({url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY,request=fetch,code}={}) {
 if(!url||!key)throw new Error('Conexão com o Supabase não configurada no servidor local.');
 const endpoint=new URL('/rest/v1/leads',url);
 if(endpoint.protocol!=='https:'||!endpoint.hostname.endsWith('.supabase.co'))throw new Error('Endereço do Supabase inválido.');
 const baseSelect='id,codigo,nome,tipo,segmento,cidade,uf,situacao_comercial_axivel,perfil_revenda,observacoes,equipe(nome),analises_leads(prioridade,justificativa,fontes,criado_em),historico(tipo,score:dados->score,classe:dados->>classe,dados),tarefas(id,titulo,status,prazo,etapa_codigo,observacoes,equipe(nome))'; const detailSelect=',cnpj,telefone,whatsapp,site,instagram,observacoes_contatos,produtos_publico,perfil_produtos,vende_bolsas_mochilas,enderecos,compradores,origens,origem_detalhe,atualizado_em'; endpoint.searchParams.set('select',baseSelect+(code?detailSelect:',origens,origem_detalhe')); const selectWithoutOrigins=endpoint.searchParams.get('select').replace(',origens,origem_detalhe',''); const selectWithoutBuyers=selectWithoutOrigins.replace(',compradores',''); let buyersSupported=true; let originsSupported=true;
 if(code){if(!/^[A-Za-z0-9_-]{1,100}$/.test(code))throw new Error('Código de empresa inválido.');endpoint.searchParams.set('codigo','eq.'+code);}
 endpoint.searchParams.set('ativo','eq.true');
 endpoint.searchParams.set('order','nome.asc,codigo.asc');
 const headers={apikey:key};
 if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
 const rows=[];
 // Paginar evita perder empresas quando a base ultrapassar o limite da API.
 for(let offset=0;;offset+=500){
  endpoint.searchParams.set('offset',String(offset));endpoint.searchParams.set('limit','500');
  let response=await request(endpoint,{headers,signal:AbortSignal.timeout(12000)});
  if(!response.ok){let detail='';try{detail=typeof response.text==='function'?await response.text():JSON.stringify(await response.json())}catch{}if(/origens|origem_detalhe/i.test(detail)&&originsSupported){originsSupported=false;endpoint.searchParams.set('select',selectWithoutOrigins);response=await request(endpoint,{headers,signal:AbortSignal.timeout(12000)});if(!response.ok){try{detail=typeof response.text==='function'?await response.text():JSON.stringify(await response.json())}catch{}}}if(!response.ok&&/compradores/i.test(detail)&&buyersSupported){buyersSupported=false;endpoint.searchParams.set('select',selectWithoutBuyers);response=await request(endpoint,{headers,signal:AbortSignal.timeout(12000)})}}
  if(!response.ok)throw new Error('Não foi possível consultar os prospects no Supabase.');
  const page=await response.json();
  if(!Array.isArray(page))throw new Error('Resposta inválida ao carregar os prospects.');
  rows.push(...page);if(page.length<500)break;
 }
 return rows.map(row=>{
  const imported=(row.historico||[]).find(h=>h.tipo==='importacao_prospect_score');
  const latestFlow=(row.historico||[]).filter(h=>h.tipo==='fluxo_prospeccao'&&Number.isInteger(h.dados?.revision)&&h.dados?.state).sort((a,b)=>b.dados.revision-a.dados.revision)[0]?.dados;
  const analysis=[...(row.analises_leads||[])].sort((a,b)=>String(b.criado_em).localeCompare(String(a.criado_em)))[0];
  const tarefas=(row.tarefas||[]).filter(t=>t.etapa_codigo!==2).map(t=>({id:t.id,label:t.etapa_codigo===1?'Preparar a abordagem':t.titulo,status:t.status,due:t.prazo||'',owner:t.equipe?.nome||'Não atribuído',etapa:t.etapa_codigo>=3?t.etapa_codigo-1:t.etapa_codigo,observacoes:t.observacoes||''})).sort((a,b)=>a.etapa-b.etapa);
  const situacaoComercialAxivel=row.situacao_comercial_axivel||(row.tipo==='cliente'?'ja_cliente':'ainda_nao_cliente');
  return {id:row.codigo||row.id,bancoId:row.id,nome:row.nome,tipo:row.tipo,jaCliente:situacaoComercialAxivel==='ja_cliente'?true:null,situacaoComercialAxivel,perfilRevenda:row.perfil_revenda||'nao_identificado',segmento:row.segmento||'',cidade:row.cidade||'',uf:row.uf||'',responsavelAtual:row.equipe?.nome||'Não atribuído',score:imported?.score??null,classe:imported?.classe||'',prioridade:analysis?.prioridade||'',analise:analysis?.justificativa||'',observacoes:row.observacoes||'',fontes:(analysis?.fontes||[]).filter(link=>/^https?:\/\//i.test(link)),origens:originsSupported&&Array.isArray(row.origens)?row.origens:[],origemDetalhe:originsSupported&&typeof row.origem_detalhe==='string'?row.origem_detalhe:'',...(code?{updatedAt:row.atualizado_em,cnpj:row.cnpj||'',telefone:row.telefone||'',whatsapp:row.whatsapp||'',site:row.site||'',instagram:row.instagram||'',observacoesContatos:row.observacoes_contatos||'',produtosPublico:row.produtos_publico||'',perfilProdutos:row.perfil_produtos||'',vendeBolsasMochilas:row.vende_bolsas_mochilas||'',enderecos:row.enderecos||[],compradores:buyersSupported&&Array.isArray(row.compradores)?row.compradores:[],buyersSupported,originsSupported} :{}),tarefas,...(latestFlow?{flow:latestFlow.state,flowRevision:latestFlow.revision,tarefas:require('./company-flow.cjs').flowTasks(latestFlow.state)}:{})};
 }).sort((a,b)=>Number(b.id==='CLI-TESTE')-Number(a.id==='CLI-TESTE')||(b.score??-1)-(a.score??-1)||a.nome.localeCompare(b.nome,'pt-BR'));
}
function invalid(message,status=400){const error=new Error(message);error.status=status;return error;}
function normalizeCnpj(value){
 if(value===null||value==='')return null;
 if(typeof value!=='string')throw invalid('Informe um CNPJ válido ou deixe o campo vazio.');
 const clean=value.replace(/[.\/\-\s]/g,'').toUpperCase();
 if(!clean)return null;
 if(!/^[A-Z0-9]{12}\d{2}$/.test(clean))throw invalid('O CNPJ deve ter 14 posições, sem contar a pontuação.');
 return clean;
}
function validateBuyers(value){
 if(!Array.isArray(value)||value.length>100)throw invalid('Informe uma lista válida de compradores.');
 const ids=new Set();
 return value.map(buyer=>{
  if(!buyer||typeof buyer!=='object'||Array.isArray(buyer))throw invalid('Comprador inválido.');
  const allowed=['id','nome','telefone','canal','observacoes','confirmado'];
  if(Object.keys(buyer).some(key=>!allowed.includes(key)))throw invalid('Comprador inválido.');
  if(typeof buyer.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(buyer.id)||ids.has(buyer.id))throw invalid('Identificação do comprador inválida.');
  ids.add(buyer.id);
  if(typeof buyer.nome!=='string'||!buyer.nome.trim()||buyer.nome.length>200||typeof buyer.telefone!=='string'||!buyer.telefone.trim()||buyer.telefone.length>200||typeof buyer.canal!=='string'||!['WhatsApp','Ligação telefônica','Instagram','E-mail','Visita presencial','Outro'].includes(buyer.canal)||typeof buyer.observacoes!=='string'||buyer.observacoes.length>2000||typeof buyer.confirmado!=='boolean')throw invalid('Dados do comprador inválidos.');
  return {id:buyer.id,nome:buyer.nome.trim(),telefone:buyer.telefone.trim(),canal:buyer.canal,observacoes:buyer.observacoes.trim(),confirmado:buyer.confirmado};
 });
}
function validateCompanyChanges(changes){
 const limits={nome:300,segmento:500,cidade:500,uf:2,telefone:20000,whatsapp:20000,site:20000,instagram:20000,observacoes_contatos:20000,produtos_publico:20000,perfil_produtos:20000,vende_bolsas_mochilas:500,situacao_comercial_axivel:50,perfil_revenda:50,origem_detalhe:20000};
 if(!changes||typeof changes!=='object'||Array.isArray(changes)||!Object.keys(changes).length)throw invalid('Nenhuma alteração informada.');
 const allowed=[...Object.keys(limits),'cnpj','enderecos','compradores','origens'];
 if(Object.keys(changes).some(key=>!allowed.includes(key)))throw invalid('O pedido contém campos que não podem ser editados no cadastro.');
 const result={};
 for(const [field,limit]of Object.entries(limits))if(Object.hasOwn(changes,field)){
  if(typeof changes[field]!=='string'||changes[field].length>limit)throw invalid('Valor inválido para '+field+'.');
  result[field]=changes[field].trim();
 }
 if(Object.hasOwn(result,'nome')&&!result.nome)throw invalid('Informe o nome da empresa.');
 if(Object.hasOwn(result,'uf')){
  result.uf=result.uf.toUpperCase();
  if(result.uf&&!['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].includes(result.uf))throw invalid('Selecione uma UF válida.');
  result.uf=result.uf||null;
 }
 if(Object.hasOwn(changes,'cnpj'))result.cnpj=normalizeCnpj(changes.cnpj);
 if(Object.hasOwn(result,'situacao_comercial_axivel')&&!['ja_cliente','ainda_nao_cliente'].includes(result.situacao_comercial_axivel))throw invalid('Situação comercial inválida.');
 if(Object.hasOwn(result,'perfil_revenda')&&!['revendedor_atual','revendedor_potencial','nao_identificado'].includes(result.perfil_revenda))throw invalid('Perfil de revenda inválido.');
 if(Object.hasOwn(changes,'origens')){if(!Array.isArray(changes.origens)||changes.origens.some(value=>typeof value!=='string'||!['indicacao_ia','indicacao_proprietarios','lista_vendedor','pesquisa_manual','outros'].includes(value)))throw invalid('Origem da empresa inválida.');result.origens=[...new Set(changes.origens)];}
 if(Object.hasOwn(changes,'enderecos')){
  if(!Array.isArray(changes.enderecos)||changes.enderecos.length>100)throw invalid('Informe uma lista válida de endereços.');
  const fields=['unidade','endereco','cidade','tipo','confianca','observacoes'];
  result.enderecos=changes.enderecos.map(address=>{
   if(typeof address==='string'){if(!address.trim()||address.length>10000)throw invalid('Endereço inválido.');return address.trim();}
   if(!address||typeof address!=='object'||Array.isArray(address)||Object.keys(address).some(k=>!fields.includes(k)&&k!=='cnpj'))throw invalid('Unidade inválida.');
   const unit={};
   for(const field of fields)if(Object.hasOwn(address,field)){
    if(typeof address[field]!=='string'||address[field].length>10000)throw invalid('Dados da unidade inválidos.');
    unit[field]=address[field].trim();
   }
   if(!unit.endereco)throw invalid('Informe o endereço de cada unidade ou remova a unidade vazia.');
   if(Object.hasOwn(address,'cnpj'))unit.cnpj=normalizeCnpj(address.cnpj);
   return unit;
  });
 }
 if(Object.hasOwn(changes,'compradores'))result.compradores=validateBuyers(changes.compradores);
 return result;
}
async function saveProspect({url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY,request=fetch,code,changes,updatedAt}={}){
 if(typeof code!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(code))throw invalid('Código de empresa inválido.');
 if(typeof updatedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(updatedAt)||!Number.isFinite(Date.parse(updatedAt)))throw invalid('Atualize o cadastro antes de editar.');
 const data=validateCompanyChanges(changes);
 if(!url||!key)throw new Error('Conexão com o banco não configurada.');
 const endpoint=new URL('/rest/v1/leads',url);
 if(endpoint.protocol!=='https:'||!endpoint.hostname.endsWith('.supabase.co'))throw new Error('Endereço do Supabase inválido.');
 endpoint.searchParams.set('codigo','eq.'+code);endpoint.searchParams.set('ativo','eq.true');endpoint.searchParams.set('atualizado_em','eq.'+updatedAt);
 endpoint.searchParams.set('select','id,nome,cnpj,cidade,uf,segmento,telefone,whatsapp,site,instagram,observacoes_contatos,produtos_publico,perfil_produtos,vende_bolsas_mochilas,situacao_comercial_axivel,perfil_revenda,enderecos'+(Object.hasOwn(data,'compradores')?',compradores':'')+(Object.hasOwn(data,'origens')?',origens,origem_detalhe':'')+',atualizado_em');
 const headers={apikey:key,'Content-Type':'application/json',Prefer:'return=representation'};
 if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
 const response=await request(endpoint,{method:'PATCH',headers,body:JSON.stringify(data),signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new Error('Não foi possível salvar o cadastro no Supabase.');
 const rows=await response.json();
 if(!Array.isArray(rows))throw new Error('Resposta inválida ao salvar o cadastro.');
 if(rows.length!==1)throw invalid('Este cadastro foi alterado em outro dispositivo ou não está mais ativo. Cancele a edição e abra novamente para revisar os dados atuais.',409);
 const {atualizado_em,...saved}=rows[0];
 return {...saved,updatedAt:atualizado_em};
}
async function startProspect({url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY,request=fetch,code}={}){
 if(typeof code!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(code))throw invalid('Código de empresa inválido.');
 const [company]=await loadProspects({url,key,request,code});
 if(!code||!company)throw invalid('Empresa não encontrada na lista ativa.',404);
 if(code==='CLI-0001')throw invalid('Esta empresa já possui um fluxo de prospecção.',409);
 // IDs estáveis tornam a criação idempotente, inclusive entre computadores.
 const {createHash}=require('node:crypto');
 function stableId(kind){const hex=createHash('sha256').update('axivel/'+kind+'/'+company.bancoId).digest('hex');return hex.slice(0,8)+'-'+hex.slice(8,12)+'-5'+hex.slice(13,16)+'-a'+hex.slice(17,20)+'-'+hex.slice(20,32)}
 const taskId=stableId('inicio-prospeccao');
 if(company.tarefas.length&&!company.tarefas.some(task=>task.id===taskId))return company;
 const headers={apikey:key,'Content-Type':'application/json'};
 if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
 async function call(table,params,options={}){
  const endpoint=new URL('/rest/v1/'+table,url);
  for(const [name,value]of Object.entries(params))endpoint.searchParams.set(name,value);
  const response=await request(endpoint,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error('Não foi possível iniciar a prospecção no Supabase. Tente novamente.');
  return response.json();
 }
 const team=await call('equipe',{nome:'eq.Laura',ativo:'eq.true',select:'id'});
 if(team.length!==1)throw new Error('Responsável Laura não encontrado.');
 if(!company.tarefas.length)await call('tarefas',{on_conflict:'id'},{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify({id:taskId,lead_id:company.bancoId,etapa_codigo:1,responsavel_id:team[0].id,titulo:'Preparar a abordagem',status:'em_andamento'})});
 // Uma nova tentativa recupera também um histórico que tenha falhado após a tarefa.
 await call('historico',{on_conflict:'id'},{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify({id:stableId('historico-inicio'),lead_id:company.bancoId,autor_id:team[0].id,tipo:'prospeccao_iniciada',descricao:'Prospecção iniciada. Laura deve preparar o tipo de prospecção.',dados:{stage:1,owner:'Laura',next:'Preparar o tipo de prospecção'}})});
 return (await loadProspects({url,key,request,code}))[0];
}
async function saveProspectType({url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY,request=fetch,code,taskId,value}={}){
 const kinds=['WhatsApp','Instagram','Ligação telefônica','E-mail','Visita presencial'];
 if(!kinds.includes(value)||typeof taskId!=='string'||!/^[0-9a-f-]{36}$/i.test(taskId)||typeof code!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(code))throw invalid('Tipo de prospecção ou tarefa inválida.');
 if(code==='CLI-0001')throw invalid('Use o fluxo de tarefas desta empresa.',409);
 const [company]=await loadProspects({url,key,request,code});
 const task=company?.tarefas.find(task=>task.id===taskId);
 if(!task)throw invalid('Tarefa não encontrada nesta empresa.',404);
 if(task.etapa!==1||task.status!=='em_andamento')throw invalid('A preparação não está mais em andamento. Atualize o cadastro.',409);
 const endpoint=new URL('/rest/v1/tarefas',url);
 endpoint.searchParams.set('id','eq.'+taskId);endpoint.searchParams.set('lead_id','eq.'+company.bancoId);endpoint.searchParams.set('status','eq.em_andamento');endpoint.searchParams.set('etapa_codigo','eq.1');
 // Preservar as demais observações e recusar alterações concorrentes.
 endpoint.searchParams.set('observacoes',task.observacoes?'eq.'+task.observacoes:'is.null');
 const notes=task.observacoes.replace(/^Tipo de prospecção: [^\r\n]*(?:\r?\n|$)/m,'');
 const headers={apikey:key,'Content-Type':'application/json',Prefer:'return=representation'};
 if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
 const response=await request(endpoint,{method:'PATCH',headers,body:JSON.stringify({observacoes:'Tipo de prospecção: '+value+(notes?'\n'+notes:'')}),signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new Error('Não foi possível salvar o tipo de prospecção.');
 if((await response.json()).length!==1)throw invalid('A tarefa foi alterada em outro dispositivo. Atualize o cadastro.',409);
 return (await loadProspects({url,key,request,code}))[0];
}
async function createProspect({url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY,request=fetch,changes,allowDuplicate=false,retryCodeConflict=true}={}){
 if(!changes||typeof changes!=='object'||Array.isArray(changes))throw invalid('Informe os dados do cadastro.');
 const allowed=['nome','cnpj','segmento','cidade','uf','telefone','whatsapp','site','instagram','observacoes_contatos','produtos_publico','perfil_produtos','vende_bolsas_mochilas','situacao_comercial_axivel','perfil_revenda','enderecos','origens','origem_detalhe'];
 if(Object.keys(changes).some(field=>!allowed.includes(field)))throw invalid('O pedido contém campos que não podem ser cadastrados.');
 const data=validateCompanyChanges({...changes,nome:changes.nome});
 const segments=['Bolsas e acessórios','Roupas multimarcas','Calçados','Bazares e variedades','Papelarias','Outros'];
 const selectedSegments=String(data.segmento||'').split(',').map(value=>value.trim()).filter(Boolean);
 if(selectedSegments.some(value=>!segments.includes(value)))throw invalid('Selecione apenas segmentos válidos.');
 if(!data.nome)throw invalid('Informe o nome da empresa.');
 data.tipo='lead';data.ativo=true;data.situacao_comercial_axivel=data.situacao_comercial_axivel||'ainda_nao_cliente';data.perfil_revenda=data.perfil_revenda||'nao_identificado';data.enderecos=data.enderecos||[];
 if(!url||!key)throw new Error('Conexão com o banco não configurada.');
 const base=new URL('/rest/v1/leads',url);const headers={apikey:key,'Content-Type':'application/json'};if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
 if(data.cnpj){const duplicateUrl=new URL(base);duplicateUrl.searchParams.set('select','id,codigo,nome,cnpj');duplicateUrl.searchParams.set('cnpj','eq.'+data.cnpj);duplicateUrl.searchParams.set('ativo','eq.true');const duplicateResponse=await request(duplicateUrl,{headers,signal:AbortSignal.timeout(12000)});if(!duplicateResponse.ok)throw new Error('Não foi possível verificar o CNPJ no Supabase.');const duplicates=await duplicateResponse.json();if(duplicates.length&&!allowDuplicate){const error=invalid('Já existe uma empresa com este CNPJ. Confirme se deseja cadastrar mesmo assim.',409);error.duplicates=duplicates;throw error;}}
 const listUrl=new URL(base);listUrl.searchParams.set('select','codigo');listUrl.searchParams.set('codigo','like.CLI-*');listUrl.searchParams.set('order','codigo.desc');const listResponse=await request(listUrl,{headers,signal:AbortSignal.timeout(12000)});if(!listResponse.ok)throw new Error('Não foi possível gerar o código do cadastro.');const codes=await listResponse.json();const next=Math.max(0,...codes.map(row=>Number(String(row.codigo||'').match(/^CLI-(\d+)$/)?.[1]||0)))+1;const code='CLI-'+String(next).padStart(4,'0');
 const teamUrl=new URL('/rest/v1/equipe',url);teamUrl.searchParams.set('select','id');teamUrl.searchParams.set('nome','eq.Laura');teamUrl.searchParams.set('ativo','eq.true');const teamResponse=await request(teamUrl,{headers,signal:AbortSignal.timeout(12000)});if(!teamResponse.ok)throw new Error('Não foi possível localizar a responsável Laura.');const team=await teamResponse.json();if(team.length!==1)throw new Error('Responsável Laura não encontrado.');
 const payload={...data,codigo:code,responsavel_id:team[0].id};const insertResponse=await request(base,{method:'POST',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)});if(!insertResponse.ok){if(insertResponse.status===409&&retryCodeConflict)return createProspect({url,key,request,changes,allowDuplicate,retryCodeConflict:false});throw new Error('Não foi possível salvar o novo cadastro no Supabase.');}const rows=await insertResponse.json();if(!Array.isArray(rows)||rows.length!==1)throw new Error('Resposta inválida ao criar o cadastro.');return (await loadProspects({url,key,request,code}))[0];
}
const {randomUUID}=require('node:crypto');
async function resetProspect({url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY,request=fetch,code}={}){
 if(typeof code!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(code))throw invalid('Código de empresa inválido.');
 const [company]=await loadProspects({url,key,request,code});if(!company)throw invalid('Empresa não encontrada na lista ativa.',404);
 if(!url||!key)throw new Error('Conexão com o banco não configurada.');
 const headers={apikey:key,'Content-Type':'application/json'};if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
 const tasksUrl=new URL('/rest/v1/tarefas',url);tasksUrl.searchParams.set('select','id,etapa_codigo');tasksUrl.searchParams.set('lead_id','eq.'+company.bancoId);const tasksResponse=await request(tasksUrl,{headers,signal:AbortSignal.timeout(12000)});if(!tasksResponse.ok)throw new Error('Não foi possível verificar as tarefas no Supabase.');const tasks=await tasksResponse.json();if(tasks.some(task=>Number(task.etapa_codigo)>1))throw invalid('A prospecção já avançou além da preparação e não pode ser restaurada automaticamente.',409);
 const historyUrl=new URL('/rest/v1/historico',url);historyUrl.searchParams.set('select','id,tipo');historyUrl.searchParams.set('lead_id','eq.'+company.bancoId);const historyResponse=await request(historyUrl,{headers,signal:AbortSignal.timeout(12000)});if(!historyResponse.ok)throw new Error('Não foi possível verificar o histórico no Supabase.');const history=await historyResponse.json();if(history.some(event=>event.tipo==='fluxo_prospeccao'))throw invalid('A prospecção já possui alterações de fluxo e não pode ser restaurada automaticamente.',409);
 const taskIds=tasks.filter(task=>Number(task.etapa_codigo)===1).map(task=>task.id);if(taskIds.length){const endpoint=new URL('/rest/v1/tarefas',url);endpoint.searchParams.set('id','in.('+taskIds.join(',')+')');endpoint.searchParams.set('lead_id','eq.'+company.bancoId);const response=await request(endpoint,{method:'DELETE',headers:{...headers,Prefer:'return=representation'},signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error('Não foi possível remover a tarefa inicial no Supabase.');}
 const historyEndpoint=new URL('/rest/v1/historico',url);const historyId=randomUUID();const historyResponseInsert=await request(historyEndpoint,{method:'POST',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify({id:historyId,lead_id:company.bancoId,tipo:'prospeccao_cancelada',descricao:'Prospecção cancelada e devolvida à fila inicial.',dados:{situacao_comercial:company.situacaoComercialAxivel||'nao_identificado',destino:company.jaCliente===true?'clientes_aguardando_prospeccao':'prospeccoes_a_fazer'}}),signal:AbortSignal.timeout(12000)});if(!historyResponseInsert.ok)throw new Error('Não foi possível registrar o cancelamento no histórico.');
 return (await loadProspects({url,key,request,code}))[0];
}
module.exports={loadProspects,saveProspect,validateCompanyChanges,validateBuyers,startProspect,saveProspectType,createProspect,resetProspect};
