const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadProspects}=require('./supabase-prospects.cjs');
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
