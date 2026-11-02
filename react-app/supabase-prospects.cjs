// Executado apenas pelo servidor local. Nunca enviar a chave ao navegador.
async function loadProspects({url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY,request=fetch,code}={}) {
 if(!url||!key)throw new Error('Conexão com o Supabase não configurada no servidor local.');
 const endpoint=new URL('/rest/v1/leads',url);
 if(endpoint.protocol!=='https:'||!endpoint.hostname.endsWith('.supabase.co'))throw new Error('Endereço do Supabase inválido.');
 endpoint.searchParams.set('select','id,codigo,nome,tipo,segmento,cidade,uf,observacoes,equipe(nome),analises_leads(prioridade,justificativa,fontes,criado_em),historico(tipo,score:dados->score,classe:dados->>classe),tarefas(id,titulo,status,prazo,etapa_codigo,observacoes,equipe(nome))'+(code?',cnpj,telefone,whatsapp,site,instagram,enderecos':''));
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
  return {id:row.codigo||row.id,bancoId:row.id,nome:row.nome,tipo:row.tipo,jaCliente:row.tipo==='cliente'?true:null,segmento:row.segmento||'',cidade:row.cidade||'',uf:row.uf||'',responsavelAtual:row.equipe?.nome||'Não atribuído',score:imported?.score??null,classe:imported?.classe||'',prioridade:analysis?.prioridade||'',analise:analysis?.justificativa||'',observacoes:row.observacoes||'',fontes:(analysis?.fontes||[]).filter(link=>/^https?:\/\//i.test(link)),...(code?{cnpj:row.cnpj||'',telefone:row.telefone||'',whatsapp:row.whatsapp||'',site:row.site||'',instagram:row.instagram||'',enderecos:row.enderecos||[]} :{}),tarefas:(row.tarefas||[]).map(t=>({id:t.id,label:t.titulo,status:t.status,due:t.prazo||'',owner:t.equipe?.nome||'Não atribuído',etapa:t.etapa_codigo,observacoes:t.observacoes||''})).sort((a,b)=>a.etapa-b.etapa)};
 }).sort((a,b)=>(b.score??-1)-(a.score??-1)||a.nome.localeCompare(b.nome,'pt-BR'));
}
module.exports={loadProspects};
