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
 if(p.startsWith('/api/crm/')){
  try{
   const origin=`http://${req.headers.host}`;
   const input=['GET','HEAD'].includes(req.method)?undefined:JSON.stringify(await body(req));
   const request=new Request(new URL(req.url,origin),{method:req.method,headers:req.headers,...(input===undefined?{}:{body:input})});
   const response=await (await onlineCrm).handleAuthenticatedCrm(request,{url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SECRET_KEY});
   res.writeHead(response.status,Object.fromEntries(response.headers));return res.end(await response.text());
  }catch(error){return sendJson(res,error.status||503,{error:'Não foi possível acessar os dados no Supabase.'});}
 }
 if(p==='/'){p='/index.html';} if(!['/index.html','/app.jsx','/styles.css','/overview.css'].includes(p)&&!p.startsWith('/assets/')){res.writeHead(404);return res.end('Not found')} const file=path.join(root,p);if(!file.startsWith(root+path.sep)||p.split(/[\\/]/).some(part=>part.startsWith('.'))||path.extname(file)==='.cjs'){res.writeHead(403);return res.end();}fs.readFile(file,(e,d)=>{if(e){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(d)});
}).listen(4173,'127.0.0.1',()=>console.log('Axivel React local server: http://127.0.0.1:4173'));
