import companyTasks from '../../react-app/company-flow.cjs';
import {runtimeStore} from '../lib/runtime.mjs';
export default async function handler() {
 const store=runtimeStore({url:Netlify.env.get('SUPABASE_URL'),key:Netlify.env.get('SUPABASE_SECRET_KEY')});
 await store.tasks();
 await companyTasks.tickCompanyFlows({url:Netlify.env.get('SUPABASE_URL'),key:Netlify.env.get('SUPABASE_SECRET_KEY')});
 return new Response(null,{status:204});
}
// UTC: verificação a cada minuto; datas do fluxo continuam no fuso de São Paulo.
export const config={schedule:'* * * * *'};
