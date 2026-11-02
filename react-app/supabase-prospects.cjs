// Executado apenas pelo servidor local. Nunca enviar a chave ao navegador.
async function loadProspects({url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY,request=fetch,code}={}) {
 if(!url||!key)throw new Error('Conexão com o Supabase não configurada no servidor local.');
 const endpoint=new URL('/rest/v1/leads',url);
 if(endpoint.protocol!=='https:'||!endpoint.hostname.endsWith('.supabase.co'))throw new Error('Endereço do Supabase inválido.');
 endpoint.searchParams.set('select','id,codigo,nome,tipo,segmento,cidade,uf,observacoes,equipe(nome),analises_leads(prioridade,justificativa,fontes,criado_em),historico(tipo,score:dados->score,classe:dados->>classe),tarefas(id,titulo,status,prazo,etapa_codigo,observacoes,equipe(nome))'+(code?',cnpj,telefone,whatsapp,site,instagram,enderecos,atualizado_em':''));
 if(code){if(!/^[A-Za-z0-9_-]{1,100}$/.test(code))throw new Error('Código de empresa inválido.');endpoint.searchParams.set('codigo','eq.'+code);}
 endpoint.searchParams.set('ativo','eq.true');
 endpoint.searchParams.set('order','nome.asc,codigo.asc');
 const headers={apikey:key};
 if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
 const rows=[];
 // Paginar evita perder empresas quando a base ultrapassar o limite da API.
 for(let offset=0;;offset+=500){
  endpoint.searchParams.set('offset',String(offset));endpoint.searchParams.set('limit','500');
  const response=await request(endpoint,{headers,signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error('Não foi possível consultar os prospects no Supabase.');
  const page=await response.json();
  if(!Array.isArray(page))throw new Error('Resposta inválida ao carregar os prospects.');
  rows.push(...page);if(page.length<500)break;
 }
 return rows.map(row=>{
  const imported=(row.historico||[]).find(h=>h.tipo==='importacao_prospect_score');
  const analysis=[...(row.analises_leads||[])].sort((a,b)=>String(b.criado_em).localeCompare(String(a.criado_em)))[0];
  return {id:row.codigo||row.id,bancoId:row.id,nome:row.nome,tipo:row.tipo,jaCliente:row.tipo==='cliente'?true:null,segmento:row.segmento||'',cidade:row.cidade||'',uf:row.uf||'',responsavelAtual:row.equipe?.nome||'Não atribuído',score:imported?.score??null,classe:imported?.classe||'',prioridade:analysis?.prioridade||'',analise:analysis?.justificativa||'',observacoes:row.observacoes||'',fontes:(analysis?.fontes||[]).filter(link=>/^https?:\/\//i.test(link)),...(code?{updatedAt:row.atualizado_em,cnpj:row.cnpj||'',telefone:row.telefone||'',whatsapp:row.whatsapp||'',site:row.site||'',instagram:row.instagram||'',enderecos:row.enderecos||[]} :{}),tarefas:(row.tarefas||[]).map(t=>({id:t.id,label:t.titulo,status:t.status,due:t.prazo||'',owner:t.equipe?.nome||'Não atribuído',etapa:t.etapa_codigo,observacoes:t.observacoes||''})).sort((a,b)=>a.etapa-b.etapa)};
 }).sort((a,b)=>(b.score??-1)-(a.score??-1)||a.nome.localeCompare(b.nome,'pt-BR'));
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
function validateCompanyChanges(changes){
 const limits={nome:300,segmento:500,cidade:500,uf:2,telefone:20000,whatsapp:20000,site:20000,instagram:20000};
 if(!changes||typeof changes!=='object'||Array.isArray(changes)||!Object.keys(changes).length)throw invalid('Nenhuma alteração informada.');
 const allowed=[...Object.keys(limits),'cnpj','enderecos'];
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
 endpoint.searchParams.set('select','nome,cnpj,cidade,uf,segmento,telefone,whatsapp,site,instagram,enderecos,atualizado_em');
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
module.exports={loadProspects,saveProspect,validateCompanyChanges};
