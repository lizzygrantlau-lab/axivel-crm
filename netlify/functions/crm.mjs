import companyTasks from '../../react-app/company-flow.cjs';
import prospects from '../../react-app/supabase-prospects.cjs';
import {runtimeStore} from '../lib/runtime.mjs';

const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function inputJson(req,limit=24000){
 const raw=await req.text();let value;
 if(raw.length>limit){const error=new Error('Conteúdo muito grande.');error.status=413;throw error;}
 try{value=JSON.parse(raw)}catch{const error=new Error('JSON inválido.');error.status=400;throw error;}
 if(!value||typeof value!=='object'||Array.isArray(value)){const error=new Error('Dados inválidos.');error.status=400;throw error;}
 return value;
}
export default async function handler(req) {
 return handleCrm(req,{url:Netlify.env.get('SUPABASE_URL'),key:Netlify.env.get('SUPABASE_SECRET_KEY')});
}
export async function handleCrm(req,credentials) {
 const path=new URL(req.url).pathname;
 const writing=!['GET','HEAD'].includes(req.method);
 if(writing&&(req.headers.get('origin')!==new URL(req.url).origin||!req.headers.get('content-type')?.startsWith('application/json')))return json({error:'Origem inválida.'},403);
 if(!['GET','POST','PUT'].includes(req.method))return json({error:'Método não permitido.'},405);
 try {
  const companyFlowMatch=path.match(/^\/api\/crm\/prospects\/([A-Za-z0-9_-]{1,100})\/tasks$/);
  if(companyFlowMatch){
   if(!['GET','PUT'].includes(req.method))return json({error:'Método não permitido.'},405);
   return json(await companyTasks.companyFlow({...credentials,code:companyFlowMatch[1],input:req.method==='PUT'?await inputJson(req):undefined}));
  }
  const typeMatch=path.match(/^\/api\/crm\/prospects\/([A-Za-z0-9_-]{1,100})\/tasks\/([0-9a-f-]{36})\/type$/i);
  if(typeMatch){
   if(req.method!=='PUT')return json({error:'Método não permitido.'},405);
   const input=await inputJson(req);
   if(Object.keys(input).some(k=>k!=='value'))return json({error:'Dados inválidos.'},400);
   return json(await prospects.saveProspectType({...credentials,code:typeMatch[1],taskId:typeMatch[2],value:input.value}));
  }
  const startMatch=path.match(/^\/api\/crm\/prospects\/([A-Za-z0-9_-]{1,100})\/start$/);
  if(startMatch){
   if(req.method!=='POST')return json({error:'Método não permitido.'},405);
   const input=await inputJson(req);
   if(Object.keys(input).length)return json({error:'Dados inválidos.'},400);
   return json(await prospects.startProspect({...credentials,code:startMatch[1]}));
  }
  if(path==='/api/crm/prospects'||/^\/api\/crm\/prospects\/[A-Za-z0-9_-]{1,100}$/.test(path)) {
   const code=path==='/api/crm/prospects'?undefined:path.split('/').pop();
   if(req.method==='PUT'&&code){
    const input=await inputJson(req,262144);
    return json(await prospects.saveProspect({...credentials,code,changes:input.changes,updatedAt:input.updatedAt}));
   }
   if(req.method!=='GET')return json({error:'Método não permitido.'},405);
   const items=await prospects.loadProspects({...credentials,code});
   if(!code)return json(items);
   return items[0]?json(items[0]):json({error:'Empresa não encontrada na lista ativa.'},404);
  }
  const match=path.match(/^\/api\/crm\/client\/CLI-0001(?:\/(tasks|activities|post-sale))?$/);
  if(!match)return json({error:'Rota não encontrada.'},404);
  const store=runtimeStore(credentials),kind=match[1]||'client';
  let input;
  if(writing)input=await inputJson(req);
  if(kind==='tasks') {
   if(req.method==='POST')return json({error:'Método não permitido.'},405);
   return json(await store.tasks(input));
  }
  const name='CLI-0001/'+kind;
  if(req.method==='GET')return json((await store.read(name)).valor);
  if(kind==='activities'&&req.method==='POST') {
   const fields=['date','type','result','next','owner'];
   if(fields.some(k=>typeof input[k]!=='string'||input[k].length>5000))return json({error:'Atividade inválida.'},400);
   const item=Object.fromEntries(fields.map(k=>[k,input[k]]));item.id='ACT-'+crypto.randomUUID();item.createdAt=new Date().toISOString();
   await store.transact(name,list=>[item,...list]);return json(item,201);
  }
  if(kind==='post-sale'&&req.method==='PUT') {
   if(input.action){
    if(input.action==='confirmDelivery')return json(await store.transact(name,current=>({...(!Array.isArray(current)?current:{}),deliveryConfirmed:true})));
    if(input.action==='create')return json(await store.transact(name,current=>{
     const value=Array.isArray(current)?{}:current;
     if(!value.deliveryConfirmed){const error=new Error('Confirme a entrega antes de criar os acompanhamentos.');error.status=409;throw error;}
     return value.d7?value:{...value,d7:'Pendente',d30:'Pendente',d90:'Pendente',notes:{}};
    }));
    if(input.action==='save'){
     const {period,status,note,expected}=input;
     if(!['d7','d30','d90'].includes(period)||!['Pendente','Concluído','Requer atenção'].includes(status)||typeof note!=='string'||note.length>5000||!expected||typeof expected.status!=='string'||typeof expected.note!=='string')return json({error:'Acompanhamento inválido.'},400);
     return json(await store.transact(name,current=>{
      if(!current||Array.isArray(current)||current[period]!==expected.status||(current.notes?.[period]||'')!==expected.note){const error=new Error('Este acompanhamento foi alterado por outra pessoa. Atualize a tela e tente novamente.');error.status=409;throw error;}
      return {...current,[period]:status,notes:{...current.notes,[period]:note}};
     }));
    }
    return json({error:'Ação inválida.'},400);
   }
   return json({error:'Atualize a página para salvar o acompanhamento.'},409);
  }
  if(kind==='client'&&req.method==='PUT') {
   const allowed=['nome','segmento','cidade','telefone','whatsapp','site','instagram','responsavelAtual'];
   if(Object.keys(input).some(k=>!allowed.includes(k)&&!['id','enderecos'].includes(k))||allowed.some(k=>input[k]!==undefined&&(typeof input[k]!=='string'||input[k].length>5000)))return json({error:'Cadastro inválido.'},400);
   if(input.enderecos!==undefined&&(!Array.isArray(input.enderecos)||input.enderecos.some(a=>typeof a!=='string'||a.length>5000)))return json({error:'Endereços inválidos.'},400);
   return json(await store.transact(name,current=>({...current,...input,id:'CLI-0001'})));
  }
  return json({error:'Método não permitido.'},405);
 } catch(error) {
  return json({error:error.status?error.message:'Não foi possível acessar o servidor online. Tente novamente.'},error.status||503);
 }
}
export const config={path:'/api/crm/*'};
