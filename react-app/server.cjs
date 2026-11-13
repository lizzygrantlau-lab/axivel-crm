const http = require('http'); const fs = require('fs'); const path = require('path');
const root = __dirname; const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.jsx':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const envFile=path.join(root,'..','.env.local');
if(fs.existsSync(envFile))process.loadEnvFile(envFile);
const {loadProspects,saveProspect,startProspect,saveProspectType,createProspect,resetProspect}=require('./supabase-prospects.cjs');
const {companyFlow,tickCompanyFlows}=require('./company-flow.cjs');
const onlineCrm=import('../netlify/functions/crm.mjs');
const taskFlow = require('./synced-task-flow.cjs').createSyncedTaskFlow({url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SECRET_KEY});
let checkingTasks=false;
async function checkTasks(){if(checkingTasks)return;checkingTasks=true;try{await taskFlow.tick();await tickCompanyFlows()}catch{console.error('Não foi possível sincronizar os prazos com o Supabase.')}finally{checkingTasks=false;}}
setInterval(checkTasks,60000).unref();
checkTasks();
function sendJson(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
function body(req,limit=262144){return new Promise((resolve,reject)=>{let raw='',tooLarge=false;req.on('data',c=>{if(raw.length+c.length>limit)tooLarge=true;else if(!tooLarge)raw+=c});req.on('end',()=>{if(tooLarge){const e=new Error('Conteúdo muito grande.');e.status=413;return reject(e)}try{resolve(raw?JSON.parse(raw):{})}catch{const e=new Error('JSON inválido.');e.status=400;reject(e)}});req.on('error',reject)})}
http.createServer(async(req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);
 if(p.startsWith('/api/crm/')){
  const origin=req.headers.origin;
  if(!['127.0.0.1:4173','localhost:4173'].includes(req.headers.host)||(origin&&!['http://127.0.0.1:4173','http://localhost:4173'].includes(origin)))return sendJson(res,403,{error:'Origem inválida.'});
 }
 const companyFlowMatch=p.match(/^\/api\/crm\/prospects\/([A-Za-z0-9_-]{1,100})\/tasks$/);
 if(companyFlowMatch){
  if(!['GET','PUT'].includes(req.method))return sendJson(res,405,{error:'Método não permitido.'});
  if(req.method==='PUT'&&!req.headers['content-type']?.startsWith('application/json'))return sendJson(res,400,{error:'Envie os dados como JSON.'});
  try{return sendJson(res,200,await companyFlow({code:companyFlowMatch[1],input:req.method==='PUT'?await body(req):undefined}));}
  catch(error){return sendJson(res,error.status||503,{error:error.status?error.message:'Não foi possível salvar a tarefa no Supabase. Tente novamente.'});}
 }
 const typeMatch=p.match(/^\/api\/crm\/prospects\/([A-Za-z0-9_-]{1,100})\/tasks\/([0-9a-f-]{36})\/type$/i);
 if(typeMatch){
  if(req.method!=='PUT')return sendJson(res,405,{error:'Método não permitido.'});
  if(!req.headers['content-type']?.startsWith('application/json'))return sendJson(res,400,{error:'Envie os dados como JSON.'});
  try{const input=await body(req);if(!input||Object.keys(input).some(k=>k!=='value'))return sendJson(res,400,{error:'Dados inválidos.'});return sendJson(res,200,await saveProspectType({code:typeMatch[1],taskId:typeMatch[2],value:input.value}));}
  catch(error){return sendJson(res,error.status||503,{error:error.status?error.message:'Não foi possível salvar o tipo de prospecção. Tente novamente.'});}
 }
 const startMatch=p.match(/^\/api\/crm\/prospects\/([A-Za-z0-9_-]{1,100})\/start$/);
 if(startMatch){
  if(req.method!=='POST')return sendJson(res,405,{error:'Método não permitido.'});
  if(!req.headers['content-type']?.startsWith('application/json'))return sendJson(res,400,{error:'Envie os dados como JSON.'});
  try{const input=await body(req);if(!input||Array.isArray(input)||typeof input!=='object'||Object.keys(input).length)return sendJson(res,400,{error:'Dados inválidos.'});return sendJson(res,200,await startProspect({code:startMatch[1]}));}
  catch(error){return sendJson(res,error.status||503,{error:error.status?error.message:'Não foi possível iniciar a prospecção no Supabase. Tente novamente.'});}
 }
 const resetMatch=p.match(/^\/api\/crm\/prospects\/([A-Za-z0-9_-]{1,100})\/reset$/);
 if(resetMatch){
  if(req.method!=='POST')return sendJson(res,405,{error:'Método não permitido.'});
  if(!req.headers['content-type']?.startsWith('application/json'))return sendJson(res,400,{error:'Envie os dados como JSON.'});
  try{const input=await body(req);if(!input||Array.isArray(input)||typeof input!=='object'||Object.keys(input).length)return sendJson(res,400,{error:'Dados inválidos.'});return sendJson(res,200,await resetProspect({code:resetMatch[1]}));}
  catch(error){return sendJson(res,error.status||503,{error:error.status?error.message:'Não foi possível restaurar a prospecção no Supabase. Tente novamente.'});}
 }
 if(p==='/api/crm/prospects'&&req.method==='POST'){
  if(!req.headers['content-type']?.startsWith('application/json'))return sendJson(res,400,{error:'Envie os dados como JSON.'});
  try{const input=await body(req);const created=await createProspect({changes:input?.changes,allowDuplicate:input?.allowDuplicate===true});return sendJson(res,201,created);}
  catch(error){return sendJson(res,error.status||503,{error:error.message||'Não foi possível criar o cadastro no Supabase.',...(error.duplicates?{duplicates:error.duplicates}: {})});}
 }
 if(p==='/api/crm/prospects'||/^\/api\/crm\/prospects\/[A-Za-z0-9_-]{1,100}$/.test(p)){
  // A lista é disponibilizada somente para a página deste servidor em loopback.
  const allowedHosts=['127.0.0.1:4173','localhost:4173'];
  const origin=req.headers.origin;
  if(!allowedHosts.includes(req.headers.host)||(origin&&!['http://127.0.0.1:4173','http://localhost:4173'].includes(origin))){res.writeHead(403);return res.end();}
  if(req.method==='PUT'&&p!=='/api/crm/prospects'){
   if(!req.headers['content-type']?.startsWith('application/json'))return sendJson(res,400,{error:'Envie os dados como JSON.'});
   try{const input=await body(req);return sendJson(res,200,await saveProspect({code:p.split('/').pop(),changes:input?.changes,updatedAt:input?.updatedAt}));}
   catch(error){return sendJson(res,error.status||503,{error:error.status?error.message:'Não foi possível salvar o cadastro no Supabase. Tente novamente.'});}
  }
  if(req.method!=='GET'){res.writeHead(405,{Allow:'GET, PUT'});return res.end();}
  try{
   const code=p==='/api/crm/prospects'?undefined:p.split('/').pop();
   const items=await loadProspects({code});let result=items;
   if(code){
    result=items.find(item=>item.id===code);
    if(!result){res.writeHead(404,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify({error:'Empresa não encontrada na lista ativa.'}));}
   }
   res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify(result));
  }
  catch{res.writeHead(503,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify({error:'Não foi possível carregar a base do Supabase. Verifique a conexão do servidor e tente novamente.'}));}
 }
 if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
 if(p==='/api/crm/client/CLI-0001/tasks'&&req.method==='GET'){try{return sendJson(res,200,await taskFlow.tick())}catch{return sendJson(res,503,{error:'Não foi possível sincronizar as tarefas com o Supabase. Verifique a conexão e tente novamente.'})}}
 if(p==='/api/crm/client/CLI-0001/tasks'&&req.method==='PUT'){try{return sendJson(res,200,await taskFlow.update(await body(req)))}catch(error){return sendJson(res,error.status||503,{error:error.status?error.message:'Não foi possível salvar a tarefa no Supabase. Verifique a conexão e tente novamente.'})}}
 if(/^\/api\/crm\/client\/CLI-0001(?:\/(?:activities|post-sale))?$/.test(p)){
  try{
   const origin=`http://${req.headers.host}`;
   const headers={...req.headers,origin:req.headers.origin||origin};
   const input=['GET','HEAD'].includes(req.method)?undefined:JSON.stringify(await body(req));
   const request=new Request(new URL(req.url,origin),{method:req.method,headers,...(input===undefined?{}:{body:input})});
   const response=await (await onlineCrm).handleCrm(request,{url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SECRET_KEY});
   res.writeHead(response.status,Object.fromEntries(response.headers));return res.end(await response.text());
  }catch(error){return sendJson(res,error.status||503,{error:'Não foi possível acessar os dados no Supabase.'});}
 }
 if(p==='/'){p='/index.html';} const file=path.join(root,p);if(!file.startsWith(root+path.sep)||p.split(/[\\/]/).some(part=>part.startsWith('.'))||path.extname(file)==='.cjs'){res.writeHead(403);return res.end();}fs.readFile(file,(e,d)=>{if(e){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(d)});
}).listen(4173,'127.0.0.1',()=>console.log('Axivel React local server: http://127.0.0.1:4173'));
