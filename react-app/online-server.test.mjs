import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createOnlineServer} from './online-server.mjs';
const credentials={url:'https://example.supabase.co',key:'test-only-server-key'};
const password='test-only-password';
const authorization='Basic '+Buffer.from('laura:'+password).toString('base64');
async function fixture(t){
 const calls=[];
 const server=createOnlineServer({credentials,password,publicUrl:'https://crm.example',api:async(req,c)=>{calls.push({url:req.url,credentials:c});return Response.json({ok:true});}});
 server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
 return {base:'http://127.0.0.1:'+server.address().port,calls};
}
test('servidor online recusa iniciar sem proteção de acesso',()=>{
 assert.throws(()=>createOnlineServer({credentials,password:'',publicUrl:'https://crm.example'}));
 assert.throws(()=>createOnlineServer({credentials,password:'curta',publicUrl:'https://crm.example'}));
});
test('interface e dados exigem senha; saúde não divulga dados',async t=>{
 const f=await fixture(t);
 for(const url of ['/','/app.jsx','/api/crm/prospects'])assert.equal((await fetch(f.base+url)).status,401);
 assert.equal((await fetch(f.base+'/',{headers:{Authorization:'Basic '+Buffer.from('laura:senha-errada').toString('base64')}})).status,401);
 assert.equal(await (await fetch(f.base+'/healthz')).text(),'ok');
 assert.equal(f.calls.length,0);
});
test('entrega interface autenticada sem expor arquivos internos',async t=>{
 const f=await fixture(t),headers={Authorization:authorization};
 assert.equal((await fetch(f.base+'/',{headers})).status,200);
 for(const url of ['/.env.local','/data/axivel/CRM/clientes.json','/server.cjs','/online-server.mjs','/assets/%2e%2e/server.cjs'])assert.equal((await fetch(f.base+url,{headers})).status,404);
});
test('API usa origem pública configurada sem confiar no host enviado',async t=>{
 const f=await fixture(t);
 const response=await fetch(f.base+'/api/crm/prospects',{headers:{Authorization:authorization,Host:'outro.example'}});
 assert.equal(response.status,200);assert.equal(f.calls[0].url,'https://crm.example/api/crm/prospects');
 assert.deepEqual(f.calls[0].credentials,credentials);
 assert.ok(!(await response.text()).includes(credentials.key));
});
