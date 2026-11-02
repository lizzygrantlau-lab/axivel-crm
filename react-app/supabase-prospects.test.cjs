const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadProspects,saveProspect,validateCompanyChanges}=require('./supabase-prospects.cjs');
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
 const saved=await saveProspect({url,key:'fixture',code:'EMPRESA-B',updatedAt:'2026-11-02T10:00:00.123456+00:00',changes:{nome:' Empresa B ',cnpj:'08.067.458/0001-70',telefone:''},request:async(endpoint,options)=>{
  assert.equal(endpoint.searchParams.get('codigo'),'eq.EMPRESA-B');assert.equal(endpoint.searchParams.get('ativo'),'eq.true');
  assert.equal(endpoint.searchParams.get('atualizado_em'),'eq.2026-11-02T10:00:00.123456+00:00');
  assert.equal(options.method,'PATCH');assert.equal(options.headers.Prefer,'return=representation');
  assert.deepEqual(JSON.parse(options.body),{nome:'Empresa B',telefone:'',cnpj:'08067458000170'});
  return {ok:true,json:async()=>[{nome:'Empresa B',cnpj:'08067458000170',telefone:'',atualizado_em:'2026-11-02T11:00:00+00:00'}]};
 }});
 assert.equal(saved.updatedAt,'2026-11-02T11:00:00+00:00');assert.equal(saved.cnpj,'08067458000170');
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
test('cadastro consulta somente a empresa solicitada e retorna suas próprias tarefas',async()=>{
 const rows=await loadProspects({url,key:'fixture',code:'EMPRESA-B',request:async endpoint=>{
  assert.equal(endpoint.searchParams.get('codigo'),'eq.EMPRESA-B');
  assert.ok(endpoint.searchParams.get('select').includes('tarefas('));assert.ok(endpoint.searchParams.get('select').includes(',cnpj,'));
  return {ok:true,json:async()=>[{id:'b',codigo:'EMPRESA-B',nome:'Empresa B',tipo:'lead',cnpj:'08067458000170',telefone:'1234',enderecos:['Rua B'],tarefas:[{id:'t-b',titulo:'Contato B',status:'pendente',etapa_codigo:2,prazo:'2026-11-10',equipe:{nome:'Samanta'}}]}]};
 }});
 assert.equal(rows.length,1);assert.equal(rows[0].id,'EMPRESA-B');assert.equal(rows[0].telefone,'1234');assert.equal(rows[0].cnpj,'08067458000170');
 assert.deepEqual(rows[0].enderecos,['Rua B']);assert.equal(rows[0].tarefas[0].id,'t-b');assert.equal(rows[0].tarefas[0].owner,'Samanta');
 await assert.rejects(loadProspects({url,key:'fixture',code:'../EMPRESA-A'}),/Código/);
});
