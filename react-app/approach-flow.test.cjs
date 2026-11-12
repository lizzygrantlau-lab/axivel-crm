const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createTaskState}=require('./task-flow.cjs');
const now=()=>Date.parse('2026-11-11T12:00:00Z');
function send(engine,action,values={}){return engine.update({stage:1,action,...values})}
function start(){const engine=createTaskState({stage:1},15,now);send(engine,'checklistPrepare',{requestId:'prepare'});send(engine,'savePerson',{requestId:'person',name:'Pessoa',number:'123',role:''});send(engine,'contactMade',{requestId:'contact',contactId:'person',method:'E-mail'});return engine}
test('cadastrar pessoa não registra contato, e repetição não duplica',()=>{
 const engine=createTaskState({stage:1},15,now);send(engine,'checklistPrepare',{requestId:'prepare'});const input={requestId:'person',name:'Pessoa',number:'123',role:''};send(engine,'savePerson',input);const state=send(engine,'savePerson',input);
 assert.equal(state.contacts.length,1);assert.equal(state.approach.step,1);assert.equal(state.contactActions,undefined);
});
test('sem resposta aguarda até prazo e depois reabre preparação',()=>{
 const engine=start();const state=send(engine,'contactResult',{requestId:'result',result:'sem_resposta',notes:'',date:'2026-11-12'});
 assert.equal(state.stage,2);assert.equal(state.contactActions[0].result,'sem_resposta');assert.equal(engine.update({stage:1,action:'contactResult',requestId:'result'}).contactActions.length,1);
 const later=createTaskState(state,15,()=>Date.parse('2026-11-14T12:00:00Z')).tick();assert.equal(later.stage,1);assert.equal(later.approach.step,0);assert.equal(later.contacts.length,1);assert.equal(later.taskStatuses[1],undefined);
});
test('resposta recebida libera conversa e mantém histórico anterior',()=>{
 const old={stage:1,events:[{id:'old',type:'Histórico anterior'}],contacts:[]};const engine=createTaskState(old,15,now);
 send(engine,'checklistPrepare');send(engine,'savePerson',{requestId:'person',name:'Pessoa',number:'123'});send(engine,'contactMade',{requestId:'contact',contactId:'person',method:'WhatsApp'});
 const state=send(engine,'contactResult',{result:'resposta',notes:'Respondeu'});assert.equal(state.stage,4);assert.equal(state.taskStatuses[3],'Não necessário');assert.equal(state.events.at(-1).id,'old');assert.equal(state.contactActions[0].notes,'Respondeu');
});
test('não aceita contato sem pessoa nem prazo inválido',()=>{
 const engine=createTaskState({stage:1},15,now);send(engine,'checklistPrepare');assert.throws(()=>send(engine,'contactMade',{contactId:'inexistente',method:'WhatsApp'}));
 const active=start();assert.throws(()=>send(active,'contactResult',{result:'sem_resposta',notes:'',date:'2026-02-31'}));assert.equal(active.tick().stage,1);
});
test('fluxo de empresa preserva etapa salva ao ler e aplica ação na primeira tentativa',async()=>{
 const {companyFlow}=require('./company-flow.cjs');const rows=[{id:'legacy',lead_id:'company',tipo:'fluxo_prospeccao',dados:{revision:1,state:{stage:1,events:[{id:'old',type:'Anterior'}]}}}];
 const request=async(endpoint,options={})=>{if(options.method==='POST'){const row=JSON.parse(options.body);rows.push(row);return Response.json([row])}return Response.json([{id:'company',codigo:'EMPRESA',nome:'Empresa',historico:rows,tarefas:[]}])};
 const args={url:'https://example.supabase.co',key:'fixture',code:'EMPRESA',request,now};
 const result=await companyFlow({...args,input:{action:'checklistPrepare',stage:1,requestId:'prep'}});assert.equal(result.approach.step,1);assert.equal(result.events.at(-1).id,'old');
 const again=await companyFlow(args);assert.equal(again.stage,1);assert.equal(again.approach.step,1);
});
test('operações concorrentes no fluxo compartilhado preservam dados e não duplicam',async()=>{
 const {runtimeStore}=await import('../netlify/lib/runtime.mjs');let row={valor:{stage:1,events:[]},versao:1};
 const request=async(endpoint,options)=>{if(options.method!=='PATCH')return Response.json([structuredClone(row)]);if(Number(endpoint.searchParams.get('versao').slice(3))!==row.versao)return Response.json([]);row=JSON.parse(options.body);return Response.json([row])};
 const store=runtimeStore({url:'https://test.supabase.co',key:'test',request});await store.tasks({action:'checklistPrepare',stage:1,requestId:'prep'},now);
 await Promise.all([store.tasks({action:'savePerson',stage:1,requestId:'person',name:'Pessoa',number:'123'},now),store.tasks({action:'comment',stage:1,requestId:'comment',owner:'Laura',text:'Nota'},now)]);
 const saved=await store.tasks(undefined,now);assert.equal(saved.contacts.length,1);assert.equal(saved.comments.length,1);assert.equal(saved.approach.step,1);
});
