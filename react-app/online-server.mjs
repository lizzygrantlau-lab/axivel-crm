import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,timingSafeEqual} from 'node:crypto';
import {handleCrm} from '../netlify/functions/crm.mjs';
import {runtimeStore} from '../netlify/lib/runtime.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.jsx':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png'};
const hash=value=>createHash('sha256').update(value).digest();
export function createOnlineServer({credentials,password,username='laura',publicUrl,api=handleCrm}) {
 if(!credentials.url||!credentials.key||!password||password.length<12)throw new Error('Configure Supabase e uma senha de acesso com pelo menos 12 caracteres.');
 const origin=new URL(publicUrl).origin;
 if(!origin.startsWith('https://')&&!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin))throw new Error('Endereço público inválido.');
 const expected=hash(username+':'+password);
 return http.createServer(async(req,res)=>{
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'same-origin'};
  const send=(status,body,extra={})=>{res.writeHead(status,{...headers,...extra});res.end(body);};
  if(req.url==='/healthz')return send(200,'ok',{'Content-Type':'text/plain'});
  const auth=req.headers.authorization||'';
  if(!auth.startsWith('Basic ')||!timingSafeEqual(expected,hash(Buffer.from(auth.slice(6),'base64').toString('utf8'))))return send(401,'Acesso restrito ao CRM Axivel.',{'WWW-Authenticate':'Basic realm="Axivel CRM", charset="UTF-8"','Content-Type':'text/plain; charset=utf-8'});
  try {
   let pathname=decodeURIComponent(new URL(req.url,origin).pathname);
   if(pathname.startsWith('/api/')) {
    const chunks=[];let bytes=0;
    for await(const chunk of req){bytes+=chunk.length;if(bytes>24000)return send(413,'Conteúdo muito grande.');chunks.push(chunk);}
    const request=new Request(new URL(req.url,origin),{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});
    const response=await api(request,credentials);
    res.writeHead(response.status,{...headers,...Object.fromEntries(response.headers)});return res.end(Buffer.from(await response.arrayBuffer()));
   }
   if(!['GET','HEAD'].includes(req.method))return send(405,'Método não permitido.');
   if(pathname==='/')pathname='/index.html';
   // A lista explícita impede servir arquivos de dados, testes, ambiente ou servidor.
   const allowed=['/index.html','/app.jsx','/styles.css','/overview.css'];
   const asset=pathname.startsWith('/assets/')&&!pathname.split(/[\\/]/).some(part=>part.startsWith('.'))&&['.svg','.png'].includes(path.extname(pathname));
   if(!allowed.includes(pathname)&&!asset)return send(404,'Não encontrado.');
   const file=path.resolve(root,'.'+pathname);
   if(!file.startsWith(root+path.sep))return send(404,'Não encontrado.');
   const content=await fs.readFile(file);
   return send(200,req.method==='HEAD'?undefined:content,{'Content-Type':mime[path.extname(file)]});
  }catch(error){return send(error.code==='ENOENT'?404:500,'Não foi possível atender à solicitação.');}
 });
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const credentials={url:process.env.SUPABASE_URL,key:process.env.SUPABASE_SECRET_KEY};
 const server=createOnlineServer({credentials,password:process.env.CRM_PASSWORD,publicUrl:process.env.RENDER_EXTERNAL_URL||process.env.CRM_PUBLIC_URL});
 const store=runtimeStore(credentials);
 let checking=false;
 async function checkDeadlines(){if(checking)return;checking=true;try{await store.tasks();}catch{console.error('Não foi possível verificar os prazos online.');}finally{checking=false;}}
 const timer=setInterval(checkDeadlines,60000);timer.unref();
 server.on('close',()=>clearInterval(timer));
 server.listen(Number(process.env.PORT)||10000,'0.0.0.0',()=>{console.log('Axivel CRM online.');checkDeadlines();});
}
