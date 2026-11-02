const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
process.loadEnvFile(path.join(root,'.env.local'));
async function main(){
 const key=process.env.SUPABASE_SECRET_KEY;
 const endpoint=new URL('/rest/v1/crm_runtime',process.env.SUPABASE_URL);
 const headers={apikey:key,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates'};
 if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
 const directory=path.join(root,'react-app/data/axivel/CRM/F4 Acessórios - CLI-0001');
 const files={tasks:'tarefas.json',activities:'atividades.json','post-sale':'pos-venda.json',client:'cliente.json'};
 const rows=Object.entries(files).map(([kind,file])=>({chave:'CLI-0001/'+kind,valor:JSON.parse(fs.readFileSync(path.join(directory,file),'utf8')),versao:1}));
 if(!rows.find(row=>row.chave.endsWith('/tasks')).valor.stage)throw new Error('Estado local de tarefas inválido.');
 const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(rows)});
 if(!response.ok)throw new Error('Não foi possível inicializar os documentos online: HTTP '+response.status);
 const check=await fetch(endpoint,{headers});if(!check.ok)throw new Error('Falha na verificação.');
 const saved=await check.json();if(saved.length!==4)throw new Error('Contagem de documentos inesperada.');
 console.log('Estado online inicializado: 4 documentos. Dados existentes preservados.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
