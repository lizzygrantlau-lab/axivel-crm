const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadProspects,saveProspect,validateCompanyChanges,createProspect,resetProspect}=require('./supabase-prospects.cjs');
const url='https://example.supabase.co';
test('conserva score zero, contas separadas, cliente confirmado e fontes seguras sem retornar credenciais',async()=>{
 const key='sb_secret_fixture';
 const rows=await loadProspects({url,key,request:async(endpoint,options)=>{
  assert.equal(options.headers.apikey,key);assert.equal(options.headers.Authorization,undefined);
  assert.equal(endpoint.searchParams.get('ativo'),'eq.true');
  return {ok:true,json:async()=>[
   {id:'a',codigo:'A',nome:'Tere',tipo:'lead',historico:[{tipo:'importacao_prospect_score',score:89,classe:'A'}]},
   {id:'b',codigo:'B',nome:'Tere',tipo:'cliente',historico:[{tipo:'importacao_prospect_score',score:0,classe:'D'}],analises_leads:[{criado_em:'2026-11-02',fontes:['https://example.com','javascript:alert(1)']}]}
  ]};
 }});
 assert.equal(rows.length,2);assert.equal(rows[0].jaCliente,null);assert.equal(rows[1].jaCliente,true);
 assert.equal(rows[1].score,0);assert.deepEqual(rows[1].fontes,['https://example.com']);
 assert.ok(!JSON.stringify(rows).includes(key));
});

test('salva só campos cadastrais da empresa ativa com controle de edição concorrente',async()=>{
 const saved=await saveProspect({url,key:'fixture',code:'EMPRESA-B',updatedAt:'2026-11-02T10:00:00.123456+00:00',changes:{nome:' Empresa B ',cnpj:'08.067.458/0001-70',telefone:'',observacoes_contatos:'Prefere WhatsApp pela manhã',produtos_publico:'Bolsas para mulheres',perfil_produtos:'Casual, faixa média',vende_bolsas_mochilas:'Sim',situacao_comercial_axivel:'ainda_nao_cliente',perfil_revenda:'revendedor_potencial'},request:async(endpoint,options)=>{
  assert.equal(endpoint.searchParams.get('codigo'),'eq.EMPRESA-B');assert.equal(endpoint.searchParams.get('ativo'),'eq.true');
  assert.equal(endpoint.searchParams.get('atualizado_em'),'eq.2026-11-02T10:00:00.123456+00:00');
  assert.equal(options.method,'PATCH');assert.equal(options.headers.Prefer,'return=representation');
  assert.deepEqual(JSON.parse(options.body),{nome:'Empresa B',telefone:'',cnpj:'08067458000170',observacoes_contatos:'Prefere WhatsApp pela manhã',produtos_publico:'Bolsas para mulheres',perfil_produtos:'Casual, faixa média',vende_bolsas_mochilas:'Sim',situacao_comercial_axivel:'ainda_nao_cliente',perfil_revenda:'revendedor_potencial'});
  return {ok:true,json:async()=>[{nome:'Empresa B',cnpj:'08067458000170',telefone:'',atualizado_em:'2026-11-02T11:00:00+00:00'}]};
 }});
 assert.equal(saved.updatedAt,'2026-11-02T11:00:00+00:00');assert.equal(saved.cnpj,'08067458000170');
});
test('aceita somente valores independentes para situação comercial e perfil de revenda',()=>{
 assert.deepEqual(validateCompanyChanges({situacao_comercial_axivel:'ja_cliente',perfil_revenda:'revendedor_atual'}),{situacao_comercial_axivel:'ja_cliente',perfil_revenda:'revendedor_atual'});
 assert.throws(()=>validateCompanyChanges({situacao_comercial_axivel:'potencial_revendedor'}),/Situação comercial/);
 assert.throws(()=>validateCompanyChanges({perfil_revenda:'cliente'}),/Perfil de revenda/);
});
test('endereço de cada unidade preserva observações e confiança sem aceitar campos arbitrários',()=>{
 const unit={unidade:'Filial',cnpj:null,endereco:'Rua A, 10',cidade:'Feliz, RS',tipo:'Loja',confianca:'alta',observacoes:'Confirmar complemento'};
 assert.deepEqual(validateCompanyChanges({enderecos:[unit]}).enderecos,[unit]);
 assert.throws(()=>validateCompanyChanges({enderecos:[{...unit,lead_id:'outra'}]}),/Unidade inválida/);
 assert.throws(()=>validateCompanyChanges({enderecos:[{endereco:''}]}),/endereço/);
 assert.deepEqual(validateCompanyChanges({enderecos:[]}),{enderecos:[]});
});
test('rejeita campos de fluxo, valores inválidos e cadastros desatualizados antes de gravar',async()=>{
 for(const changes of [{tipo:'cliente'},{score:100},{id:'outro'},{responsavel_id:'outro'},{observacoes:'apagar pesquisa'},{nome:' '},{cnpj:'123'},{uf:'XX'},{telefone:123},{enderecos:'Rua A'}])assert.throws(()=>validateCompanyChanges(changes));
 await assert.rejects(saveProspect({url,key:'fixture',code:'EMPRESA-B',updatedAt:'inválido',changes:{nome:'B'}}),/Atualize/);
 await assert.rejects(saveProspect({url,key:'fixture',code:'../A',updatedAt:'2026-11-02T00:00:00Z',changes:{nome:'B'}}),/Código/);
 await assert.rejects(saveProspect({url,key:'fixture',code:'EMPRESA-B',updatedAt:'2026-11-02T00:00:00Z',changes:{nome:'B'},request:async()=>({ok:true,json:async()=>[]})}),error=>error.status===409);
});
test('pagina bases maiores sem truncar registros',async()=>{
 const offsets=[];
 const rows=await loadProspects({url,key:'fixture',request:async(endpoint)=>{
  const offset=Number(endpoint.searchParams.get('offset'));offsets.push(offset);
  return {ok:true,json:async()=>Array.from({length:offset===0?500:1},(_,i)=>({id:String(offset+i),nome:'Empresa',tipo:'lead'}))};
 }});
 assert.equal(rows.length,501);assert.deepEqual(offsets,[0,500]);
});
test('falhas da API não vazam credenciais nem viram lista vazia',async()=>{
 await assert.rejects(loadProspects({url,key:'fixture',request:async()=>({ok:false,status:401})}),/consultar os prospects/);
 await assert.rejects(loadProspects({url,key:'fixture',request:async()=>({ok:true,json:async()=>({error:'fixture'})})}),/Resposta inválida/);
 await assert.rejects(loadProspects({url:'https://example.com',key:'fixture'}),/Endereço/);
});
test('cria lead completo com código sequencial, Laura e sem tarefas de prospecção',async()=>{
 const calls=[];
 const created=await createProspect({url,key:'fixture',changes:{nome:'Nova Loja',segmento:'Bolsas e acessórios, Calçados',cidade:'Novo Hamburgo',uf:'RS',situacao_comercial_axivel:'ainda_nao_cliente',perfil_revenda:'nao_identificado',enderecos:[]},request:async(endpoint,options={})=>{
  calls.push({endpoint,options});
  if(options.method==='POST'){assert.equal(endpoint.pathname,'/rest/v1/leads');const body=JSON.parse(options.body);assert.equal(body.codigo,'CLI-0002');assert.equal(body.tipo,'lead');assert.equal(body.responsavel_id,'team-laura');return {ok:true,json:async()=>[{id:'new-id',codigo:'CLI-0002'}]};}
  if(endpoint.pathname.endsWith('/equipe'))return {ok:true,json:async()=>[{id:'team-laura'}]};
  if(endpoint.searchParams.get('select')==='codigo')return {ok:true,json:async()=>[{codigo:'CLI-0001'}]};
  return {ok:true,json:async()=>[{id:'new-id',codigo:'CLI-0002',nome:'Nova Loja',tipo:'lead',segmento:'Bolsas e acessórios, Calçados',cidade:'Novo Hamburgo',uf:'RS',tarefas:[]}]};
 }});
 assert.equal(created.id,'CLI-0002');assert.equal(created.tarefas.length,0);assert.equal(calls.filter(call=>call.options.method==='POST').length,1);
});
test('recusa segmento fora da lista permitida antes de acessar o banco',async()=>{
 await assert.rejects(createProspect({url,key:'fixture',changes:{nome:'Loja inválida',segmento:'Eletrônicos'},request:async()=>{throw new Error('não deveria consultar')}}),/segmentos válidos/);
});
test('avisa CNPJ duplicado antes de permitir confirmação explícita',async()=>{
 const error=await createProspect({url,key:'fixture',changes:{nome:'Outra Loja',cnpj:'08.067.458/0001-70'},request:async endpoint=>{
  assert.equal(endpoint.searchParams.get('cnpj'),'eq.08067458000170');return {ok:true,json:async()=>[{id:'existing',codigo:'CLI-0001',nome:'F4 Acessórios',cnpj:'08067458000170'}]};
 }}).then(()=>null,reason=>reason);
 assert.equal(error.status,409);assert.deepEqual(error.duplicates,[{id:'existing',codigo:'CLI-0001',nome:'F4 Acessórios',cnpj:'08067458000170'}]);
});
test('cadastro consulta somente a empresa solicitada e retorna suas próprias tarefas',async()=>{
 const rows=await loadProspects({url,key:'fixture',code:'EMPRESA-B',request:async endpoint=>{
  assert.equal(endpoint.searchParams.get('codigo'),'eq.EMPRESA-B');
  assert.ok(endpoint.searchParams.get('select').includes('tarefas('));assert.ok(endpoint.searchParams.get('select').includes(',cnpj,'));
  return {ok:true,json:async()=>[{id:'b',codigo:'EMPRESA-B',nome:'Empresa B',tipo:'lead',cnpj:'08067458000170',telefone:'1234',enderecos:['Rua B'],tarefas:[{id:'t-b',titulo:'Contato B',status:'pendente',etapa_codigo:3,prazo:'2026-11-10',equipe:{nome:'Samanta'}}]}]};
 }});
 assert.equal(rows.length,1);assert.equal(rows[0].id,'EMPRESA-B');assert.equal(rows[0].telefone,'1234');assert.equal(rows[0].cnpj,'08067458000170');
 assert.deepEqual(rows[0].enderecos,['Rua B']);assert.equal(rows[0].tarefas[0].id,'t-b');assert.equal(rows[0].tarefas[0].owner,'Samanta');
 await assert.rejects(loadProspects({url,key:'fixture',code:'../EMPRESA-A'}),/Código/);
});
test('cancela prospecção inicial removendo tarefa e registrando cancelamento',async()=>{
 const deleted=[];let leadReads=0;let cancellation;
 const result=await resetProspect({url,key:'fixture',code:'CLI-1001',request:async(endpoint,options={})=>{
  if(endpoint.pathname==='/rest/v1/leads'){leadReads++;return {ok:true,json:async()=>[{id:'lead-1',codigo:'CLI-1001',nome:'Famosa',tipo:'lead',tarefas:[],historico:[]} ]};}
  if(endpoint.pathname==='/rest/v1/tarefas'&&options.method==='DELETE'){deleted.push('task');return {ok:true,json:async()=>[]};}
  if(endpoint.pathname==='/rest/v1/historico'&&options.method==='POST'){cancellation=JSON.parse(options.body);return {ok:true,json:async()=>[cancellation]};}
  if(endpoint.pathname==='/rest/v1/tarefas')return {ok:true,json:async()=>[{id:'task-1',etapa_codigo:1}]};
  if(endpoint.pathname==='/rest/v1/historico')return {ok:true,json:async()=>[{id:'history-1',tipo:'prospeccao_iniciada'}]};
  throw new Error('endpoint inesperado '+endpoint);
 }});
 assert.equal(result.id,'CLI-1001');assert.equal(leadReads,2);assert.deepEqual(deleted,['task']);assert.equal(cancellation.tipo,'prospeccao_cancelada');assert.equal(cancellation.dados.destino,'prospeccoes_a_fazer');
});
test('não cancela quando a prospecção já avançou de etapa',async()=>{
 const calls=[];const error=await resetProspect({url,key:'fixture',code:'CLI-1001',request:async(endpoint,options={})=>{
  calls.push(options.method||'GET');
  if(endpoint.pathname==='/rest/v1/leads')return {ok:true,json:async()=>[{id:'lead-1',codigo:'CLI-1001',nome:'Famosa',tarefas:[],historico:[]} ]};
  if(endpoint.pathname==='/rest/v1/tarefas')return {ok:true,json:async()=>[{id:'task-3',etapa_codigo:3}]};
  throw new Error('não deveria consultar histórico');
 }}).then(()=>null,reason=>reason);
 assert.equal(error.status,409);assert.equal(calls.includes('DELETE'),false);
});
test('cancela cliente AXIVEL e registra destino na fila de clientes',async()=>{
 let cancellation;
 const result=await resetProspect({url,key:'fixture',code:'CLI-CLIENTE',request:async(endpoint,options={})=>{
  if(endpoint.pathname==='/rest/v1/leads')return {ok:true,json:async()=>[{id:'lead-client',codigo:'CLI-CLIENTE',nome:'Cliente AXIVEL',situacao_comercial_axivel:'ja_cliente',tarefas:[],historico:[]} ]};
  if(endpoint.pathname==='/rest/v1/tarefas'&&options.method==='DELETE')return {ok:true,json:async()=>[]};
  if(endpoint.pathname==='/rest/v1/tarefas')return {ok:true,json:async()=>[{id:'task-client',etapa_codigo:1}]};
  if(endpoint.pathname==='/rest/v1/historico'&&options.method==='POST'){cancellation=JSON.parse(options.body);return {ok:true,json:async()=>[cancellation]};}
  if(endpoint.pathname==='/rest/v1/historico')return {ok:true,json:async()=>[{id:'history-client',tipo:'prospeccao_iniciada'}]};
  throw new Error('endpoint inesperado '+endpoint);
 }});
 assert.equal(result.id,'CLI-CLIENTE');assert.equal(cancellation.dados.destino,'clientes_aguardando_prospeccao');
});
