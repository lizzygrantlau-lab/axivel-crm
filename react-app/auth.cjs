const {randomBytes,createHash,scrypt:derive,timingSafeEqual}=require('node:crypto');
const {promisify}=require('node:util');
const scrypt=promisify(derive);
const COOKIE='axivel_session';
const digest=value=>createHash('sha256').update(value).digest('hex');
const fail=(message,status)=>Object.assign(new Error(message),{status});
const normalizeLogin=value=>String(value||'').trim().toLowerCase().replace(/^samanta$/,'samantha');
async function passwordHash(password){const salt=randomBytes(24).toString('hex');return 'scrypt:'+salt+':'+(await scrypt(password,salt,64)).toString('hex');}
async function verifyPassword(password,encoded){
 const [,salt,hash]=String(encoded||'').split(':');
 if(!/^[a-f0-9]{48}$/.test(salt||'')||!/^[a-f0-9]{128}$/.test(hash||''))return false;
 return timingSafeEqual(await scrypt(password,salt,64),Buffer.from(hash,'hex'));
}
const safeUser=row=>({id:row.id,name:row.nome,login:row.login,teamId:row.equipe_id,owner:row.equipe.nome});
function authStore({url,key,request=fetch,now=()=>Date.now()}){
 const headers={apikey:key,'Content-Type':'application/json'};
 if(key?.startsWith('eyJ'))headers.Authorization='Bearer '+key;
 async function call(table,params={},options={}){
  const endpoint=new URL('/rest/v1/'+table,url);
  for(const [name,value]of Object.entries(params))endpoint.searchParams.set(name,value);
  const response=await request(endpoint,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw fail('Não foi possível verificar o acesso. Tente novamente.',503);
  const text=await response.text();return text?JSON.parse(text):null;
 }
 async function login(input){
  const login=normalizeLogin(input.login),password=input.password;
  if(!/^[a-z]{1,40}$/.test(login)||typeof password!=='string'||!password||password.length>200)throw fail('Usuário ou senha incorretos.',401);
  if(!await call('rpc/crm_limitar_login',{}, {method:'POST',body:JSON.stringify({chave_login:digest(login)})}))throw fail('Muitas tentativas. Aguarde 15 minutos e tente novamente.',429);
  const rows=await call('crm_usuarios',{login:'eq.'+login,select:'*,equipe!inner(nome,ativo)'});
  const row=rows[0];
  if(!row||!row.ativo||!row.equipe?.ativo||!await verifyPassword(password,row.senha_hash))throw fail('Usuário ou senha incorretos.',401);
  const token=randomBytes(32).toString('hex');
  await call('crm_sessoes',{}, {method:'POST',body:JSON.stringify({token_hash:digest(token),usuario_id:row.id,expira_em:new Date(now()+12*60*60*1000).toISOString()})});
  return {user:safeUser(row),token};
 }
 async function user(token){
  if(!/^[a-f0-9]{64}$/.test(token||''))return null;
  const sessions=await call('crm_sessoes',{token_hash:'eq.'+digest(token),expira_em:'gt.'+new Date(now()).toISOString(),select:'usuario_id'});
  if(!sessions.length)return null;
  const rows=await call('crm_usuarios',{id:'eq.'+sessions[0].usuario_id,ativo:'eq.true',select:'id,nome,login,equipe_id,ativo,equipe!inner(nome,ativo)'});
  return rows[0]?.ativo&&rows[0]?.equipe?.ativo?safeUser(rows[0]):null;
 }
 async function logout(token){if(/^[a-f0-9]{64}$/.test(token||''))await call('crm_sessoes',{token_hash:'eq.'+digest(token)},{method:'DELETE'});}
 return {login,user,logout};
}
function sessionToken(req){return (req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';}
function sessionCookie(req,token){return COOKIE+'='+token+'; Path=/api/crm; HttpOnly; SameSite=Strict'+(new URL(req.url).protocol==='https:'?'; Secure':'')+(!token?'; Max-Age=0':'');}
const owners=['IA','Laura','Laura','Samanta','Samanta','Samanta','Ronaldo','Ronaldo','Ronaldo','Ronaldo','Ronaldo','Samanta','Samanta','Samanta','Samanta','Samanta'];
function authorizeTask(state,actor){
 if(!actor)return;
 const owner=state.assignedOwner||owners[state.stage];
 if(owner!==actor.owner)throw fail('Esta tarefa é de '+owner+'. Entre com o usuário responsável.',403);
}
module.exports={authStore,passwordHash,verifyPassword,normalizeLogin,sessionToken,sessionCookie,authorizeTask};
