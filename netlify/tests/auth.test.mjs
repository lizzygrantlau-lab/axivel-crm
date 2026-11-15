import test from 'node:test';
import assert from 'node:assert/strict';
import auth from '../../react-app/auth.cjs';
import taskFlow from '../../react-app/task-flow.cjs';
import {runtimeStore} from '../lib/runtime.mjs';
import handler,{handleAuthenticatedCrm} from '../functions/crm.mjs';

const base='https://crm.example';
const credentials={url:'https://test.supabase.co',key:'test-server-key'};
const actor={id:'user-laura',name:'Laura',owner:'Laura',teamId:'team-laura'};
const send=(path,input,cookie)=>new Request(base+'/api/crm/'+path,{method:input?'POST':'GET',headers:{...(input?{Origin:base,'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(input?{body:JSON.stringify(input)}:{})});

test('API de produção exige sessão e não consulta dados sem login',async()=>{
 const old=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;throw Error('segredo')};
 globalThis.Netlify={env:{get:key=>key==='SUPABASE_URL'?credentials.url:credentials.key}};
 try{
  assert.equal((await handler(send('prospects'))).status,401);
  assert.equal((await handler(send('client/CLI-0001/tasks',{action:'advance',stage:1}))).status,401);
  assert.deepEqual(await (await handler(send('auth/session'))).json(),{user:null});
  assert.equal(calls,0);
  const cross=new Request(base+'/api/crm/auth/login',{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/json'},body:'{}'});
  assert.equal((await handler(cross)).status,403);
 }finally{globalThis.fetch=old}
});

test('login usa hash, cookie protegido, revogação e expiração no servidor',async()=>{
 const old=globalThis.fetch;const sessions=new Map();let limited=false;
 const hash=await auth.passwordHash('test-password-only');
 const row={id:actor.id,nome:'Laura',login:'laura',equipe_id:actor.teamId,ativo:true,senha_hash:hash,equipe:{nome:'Laura',ativo:true}};
 globalThis.fetch=async(endpoint,options={})=>{
  const u=new URL(endpoint),table=u.pathname.split('/').pop();
  if(table==='crm_limitar_login')return Response.json(!limited);
  if(table==='crm_usuarios')return Response.json([row]);
  if(table==='crm_sessoes'){
   if(options.method==='POST'){const data=JSON.parse(options.body);sessions.set(data.token_hash,data);return new Response(null,{status:201})}
   const key=u.searchParams.get('token_hash')?.slice(3);
   if(options.method==='DELETE'){sessions.delete(key);return new Response(null,{status:204})}
   const session=sessions.get(key);return Response.json(session&&Date.parse(session.expira_em)>Date.now()?[session]:[]);
  }
  throw Error('consulta inesperada');
 };
 try{
  assert.equal((await handleAuthenticatedCrm(send('auth/login',{login:'Laura',password:'wrong'}),credentials)).status,401);
  const response=await handleAuthenticatedCrm(send('auth/login',{login:'LAURA',password:'test-password-only'}),credentials);
  assert.equal(response.status,200);const cookie=response.headers.get('set-cookie');
  assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);assert.match(cookie,/Secure/);
  const body=await response.json();assert.equal(body.user.name,'Laura');assert.equal(body.user.owner,'Laura');
  assert.ok(!JSON.stringify(body).includes(hash));assert.equal(body.token,undefined);
  const saved=[...sessions.values()][0];assert.ok(!cookie.includes(saved.token_hash));
  assert.equal((await (await handleAuthenticatedCrm(send('auth/session',null,cookie),credentials)).json()).user.name,'Laura');
  row.ativo=false;assert.equal(await auth.authStore(credentials).user(cookie.split(';')[0].split('=')[1]),null);row.ativo=true;
  saved.expira_em='2000-01-01T00:00:00Z';assert.equal((await (await handleAuthenticatedCrm(send('auth/session',null,cookie),credentials)).json()).user,null);
  const logout=await handleAuthenticatedCrm(send('auth/logout',{},cookie),credentials);
  assert.equal(logout.status,200);assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);assert.equal(sessions.size,0);
  limited=true;assert.equal((await handleAuthenticatedCrm(send('auth/login',{login:'Laura',password:'test-password-only'}),credentials)).status,429);
 }finally{globalThis.fetch=old}
});

test('somente o responsável altera a tarefa e autor real substitui identidade enviada pelo navegador',()=>{
 const initial={stage:1,assignedOwner:'Laura',events:[],comments:[]};
 const other=taskFlow.createTaskState(initial,15,Date.now,()=>{},{...actor,id:'user-ronaldo',owner:'Ronaldo',name:'Ronaldo'});
 assert.throws(()=>other.update({action:'comment',stage:1,text:'teste',owner:'Laura'}),error=>error.status===403);
 assert.equal(other.getState().comments.length,0);
 const own=taskFlow.createTaskState(initial,15,Date.now,()=>{},actor);
 const saved=own.update({action:'comment',stage:1,text:'Registro de teste',owner:'Ronaldo',actorId:'forjado',actorName:'Ronaldo'});
 assert.equal(saved.comments[0].owner,'Laura');assert.equal(saved.comments[0].actorId,actor.id);assert.equal(saved.events[0].actorName,'Laura');
 const before=saved.events[0];
 const assigned=own.update({action:'assign',stage:1,owner:'Samanta'});
 assert.equal(assigned.events[0].actorId,actor.id);assert.equal(assigned.events[0].owner,'Samanta');
 assert.deepEqual(assigned.events[1],before);
 assert.throws(()=>own.update({action:'comment',stage:1,text:'Não pode mais',owner:'Laura'}),error=>error.status===403);
});

test('Samantha usa a mesma responsável do fluxo, sem duplicar a equipe',()=>{
 assert.equal(auth.normalizeLogin(' Samantha '),'samantha');assert.equal(auth.normalizeLogin('Samanta'),'samantha');
 assert.doesNotThrow(()=>auth.authorizeTask({stage:5},{...actor,owner:'Samanta'}));
 assert.throws(()=>auth.authorizeTask({stage:6},{...actor,owner:'Samanta'}),e=>e.status===403);
 assert.doesNotThrow(()=>auth.authorizeTask({stage:6},{...actor,owner:'Ronaldo'}));
});


test('permissão é revalidada dentro da gravação concorrente do fluxo compartilhado',async()=>{
 const state={stage:1,assignedOwner:'Laura',comments:[],events:[]};let writes=0;
 const request=async(url,options)=>{if(options.method==='PATCH'){writes++;return Response.json([])}return Response.json([{valor:state,versao:1}])};
 const store=runtimeStore({...credentials,request,actor:{...actor,owner:'Ronaldo',name:'Ronaldo'}});
 await assert.rejects(store.tasks({action:'comment',stage:1,text:'Não autorizado',owner:'Laura'}),error=>error.status===403);
 assert.equal(writes,0);assert.equal(state.comments.length,0);
});
