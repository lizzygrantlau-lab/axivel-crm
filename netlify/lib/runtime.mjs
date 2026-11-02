import flow from '../../react-app/task-flow.cjs';
import {isDeepStrictEqual} from 'node:util';

export function runtimeStore({url,key,request=fetch}) {
 if(!url||!key)throw new Error('Conexão online não configurada.');
 const base=new URL('/rest/v1/crm_runtime',url);
 if(base.protocol!=='https:'||!base.hostname.endsWith('.supabase.co'))throw new Error('Endereço do banco inválido.');
 const headers={apikey:key,'Content-Type':'application/json'};
 if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
 async function read(name) {
  const endpoint=new URL(base);endpoint.searchParams.set('chave','eq.'+name);endpoint.searchParams.set('select','valor,versao');
  const response=await request(endpoint,{headers,signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error('Falha ao consultar o estado online.');
  const rows=await response.json();if(rows.length!==1)throw new Error('Estado online ainda não inicializado.');
  return rows[0];
 }
 async function transact(name,transform) {
  for(let attempt=0;attempt<4;attempt++) {
   const row=await read(name);const next=transform(structuredClone(row.valor));
   if(isDeepStrictEqual(next,row.valor))return next;
   const endpoint=new URL(base);endpoint.searchParams.set('chave','eq.'+name);endpoint.searchParams.set('versao','eq.'+row.versao);
   const response=await request(endpoint,{method:'PATCH',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify({valor:next,versao:row.versao+1}),signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw new Error('Falha ao salvar o estado online.');
   if((await response.json()).length)return next;
  }
  const error=new Error('Outra pessoa atualizou a tarefa. Atualize a tela e tente novamente.');error.status=409;throw error;
 }
 async function tasks(input,now=()=>Date.now()) {
  return transact('CLI-0001/tasks',state=>{
   const engine=flow.createTaskState(state,16,now);
   try{return input?engine.update(input):engine.tick();}
   catch(error){error.status=409;throw error;}
  });
 }
 return {read,transact,tasks};
}
