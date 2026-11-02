const {test}=require('node:test');
const assert=require('node:assert/strict');
const {startProspect}=require('./supabase-prospects.cjs');
function fixture(){
 const tasks=new Map(),history=new Map(),writes=[];
 const company={id:'12345678-1234-4234-a234-123456789012',codigo:'EMPRESA-B',nome:'Empresa B',tipo:'lead'};
 let failHistory=false;
 async function request(endpoint,options={}){
  assert.equal(options.headers.apikey,'fixture');
  const table=endpoint.pathname.split('/').pop();
  if(options.method==='POST'){
   const value=JSON.parse(options.body);writes.push({table,value});
   assert.equal(value.lead_id,company.id);
   assert.equal(options.headers.Prefer,'resolution=ignore-duplicates,return=representation');
   if(table==='historico'&&failHistory){failHistory=false;return Response.json({}, {status:503})}
   const rows=table==='tarefas'?tasks:history;
   if(!rows.has(value.id))rows.set(value.id,value);
   return Response.json([rows.get(value.id)]);
  }
  if(table==='equipe')return Response.json([{id:'laura-id'}]);
  assert.equal(table,'leads');assert.equal(endpoint.searchParams.get('codigo'),'eq.EMPRESA-B');
  return Response.json([{...company,tarefas:[...tasks.values()].map(t=>({...t,equipe:{nome:'Laura'}}))}]);
 }
 return {options:{url:'https://test.supabase.co',key:'fixture',code:company.codigo,request},tasks,history,writes,failHistory:()=>{failHistory=true}};
}
test('inicia na empresa correta, com Laura, e cliques simultâneos não duplicam nem reiniciam tarefas',async()=>{
 const db=fixture();
 const results=await Promise.all([startProspect(db.options),startProspect(db.options)]);
 assert.equal(db.tasks.size,1);assert.equal(db.history.size,1);
 assert.equal(results[0].tarefas[0].owner,'Laura');assert.equal(results[1].tarefas[0].etapa,1);
 const task=[...db.tasks.values()][0];assert.equal(task.status,'em_andamento');assert.equal(task.titulo,'Preparar o tipo de prospecção');
 task.status='concluida';const count=db.writes.filter(w=>w.table==='tarefas').length;
 await startProspect(db.options);
 assert.equal(db.writes.filter(w=>w.table==='tarefas').length,count);assert.equal(task.status,'concluida');
});
test('nova tentativa recupera falha no histórico sem recriar a tarefa',async()=>{
 const db=fixture();db.failHistory();await assert.rejects(startProspect(db.options));
 assert.equal(db.tasks.size,1);assert.equal(db.history.size,0);
 await startProspect(db.options);assert.equal(db.tasks.size,1);assert.equal(db.history.size,1);
});
test('não altera um fluxo que já existe nem aceita empresa inativa ou código inválido',async()=>{
 const db=fixture();db.tasks.set('existente',{id:'existente',etapa_codigo:5,status:'em_andamento'});
 await startProspect(db.options);assert.equal(db.writes.length,0);
 await assert.rejects(startProspect({...db.options,code:'../A'}),/Código/);
 await assert.rejects(startProspect({...db.options,request:async()=>Response.json([])}),e=>e.status===404);
});
