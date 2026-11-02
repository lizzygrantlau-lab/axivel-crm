const http = require('http'); const fs = require('fs'); const path = require('path');
const root = __dirname; const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.jsx':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const envFile=path.join(root,'..','.env.local');
if(fs.existsSync(envFile))process.loadEnvFile(envFile);
const {loadProspects}=require('./supabase-prospects.cjs');
const crmRoot=path.join(root,'data','axivel','CRM'); const clientRoot=path.join(crmRoot,'F4 Acessórios - CLI-0001');
function ensureData(){ const defaults={
 'clientes.json':[{id:'CLI-0001',nome:'F4 Acessórios',segmento:'Bolsas e acessórios',cidade:'Novo Hamburgo',responsavelAtual:'Laura'}],
 'cliente.json':{id:'CLI-0001',nome:'F4 Acessórios',segmento:'Bolsas e acessórios',cidade:'Novo Hamburgo',enderecos:['Pedro Adams Filho, 5130 - Centro','Bartolomeu de Gusmão, 649 - Canudos'],telefone:'(51) 3066-4004',whatsapp:'(51) 99361-1581',site:'https://f4acessorios.com.br/loja-2/',responsavelAtual:'Laura'},
 'atividades.json':[], 'tarefas.json':[], 'pos-venda.json':[]};
 for(const [name,data] of Object.entries(defaults)){const file=path.join(name==='clientes.json'?crmRoot:clientRoot,name);if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify(data,null,2),'utf8');}}
ensureData();
const taskFlow = require('./task-flow.cjs').createTaskFlow(path.join(clientRoot,'tarefas.json'));
setInterval(()=>{try{taskFlow.tick()}catch(error){console.error('Falha ao ativar etapa:',error.message)}},1000).unref();
function sendJson(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end(JSON.stringify(data));}
function body(req){return new Promise((resolve,reject)=>{let raw='';req.on('data',c=>raw+=c);req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch(e){reject(e)}})})}
http.createServer(async(req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);
 if(p==='/api/crm/prospects'||/^\/api\/crm\/prospects\/[A-Za-z0-9_-]{1,100}$/.test(p)){
  // A lista é disponibilizada somente para a página deste servidor em loopback.
  const allowedHosts=['127.0.0.1:4173','localhost:4173'];
  const origin=req.headers.origin;
  if(!allowedHosts.includes(req.headers.host)||(origin&&!['http://127.0.0.1:4173','http://localhost:4173'].includes(origin))){res.writeHead(403);return res.end();}
  if(req.method!=='GET'){res.writeHead(405,{Allow:'GET'});return res.end();}
  try{
   const code=p==='/api/crm/prospects'?undefined:p.split('/').pop();
   const items=await loadProspects({code});let result=items;
   if(code){
    result=items.find(item=>item.id===code);
    if(!result){res.writeHead(404,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify({error:'Empresa não encontrada na lista ativa.'}));}
    if(code==='CLI-0001'){
     const local=JSON.parse(fs.readFileSync(path.join(clientRoot,'cliente.json')));
     for(const field of ['telefone','whatsapp','site','instagram','segmento'])if(!result[field])result[field]=local[field]||'';
     if(!result.enderecos.length)result.enderecos=local.enderecos||[];
    }
   }
   res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify(result));
  }
  catch{res.writeHead(503,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify({error:'Não foi possível carregar a base do Supabase. Verifique a conexão do servidor e tente novamente.'}));}
 }
 if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type'});return res.end();}
 if(p==='/api/crm/client/CLI-0001'&&req.method==='GET'){return sendJson(res,200,JSON.parse(fs.readFileSync(path.join(clientRoot,'cliente.json'))));}
 if(p==='/api/crm/client/CLI-0001/activities'&&req.method==='GET'){return sendJson(res,200,JSON.parse(fs.readFileSync(path.join(clientRoot,'atividades.json'))));}
 if(p==='/api/crm/client/CLI-0001/activities'&&req.method==='POST'){const item=await body(req);const file=path.join(clientRoot,'atividades.json');const list=JSON.parse(fs.readFileSync(file));list.unshift({...item,id:'ACT-'+Date.now(),createdAt:new Date().toISOString()});fs.writeFileSync(file,JSON.stringify(list,null,2));return sendJson(res,201,list[0]);}
 if(p==='/api/crm/client/CLI-0001'&&req.method==='PUT'){const item=await body(req);fs.writeFileSync(path.join(clientRoot,'cliente.json'),JSON.stringify(item,null,2));return sendJson(res,200,item);}
 if(p==='/api/crm/client/CLI-0001/tasks'&&req.method==='GET'){return sendJson(res,200,taskFlow.tick());}
 if(p==='/api/crm/client/CLI-0001/tasks'&&req.method==='PUT'){try{return sendJson(res,200,taskFlow.update(await body(req)))}catch(error){return sendJson(res,400,{error:error.message})}}
 if(p==='/api/crm/client/CLI-0001/post-sale'&&req.method==='GET'){return sendJson(res,200,JSON.parse(fs.readFileSync(path.join(clientRoot,'pos-venda.json'))));}
 if(p==='/api/crm/client/CLI-0001/post-sale'&&req.method==='PUT'){const item=await body(req);fs.writeFileSync(path.join(clientRoot,'pos-venda.json'),JSON.stringify(item,null,2));return sendJson(res,200,item);}
 if(p==='/'){p='/index.html';} const file=path.join(root,p);if(!file.startsWith(root+path.sep)||p.split(/[\\/]/).some(part=>part.startsWith('.'))||path.extname(file)==='.cjs'){res.writeHead(403);return res.end();}fs.readFile(file,(e,d)=>{if(e){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(d)});
}).listen(4173,'127.0.0.1',()=>console.log('Axivel React local server: http://127.0.0.1:4173'));
