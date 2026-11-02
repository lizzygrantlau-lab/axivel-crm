function createSyncedTaskFlow(credentials) {
 let store;
 async function tasks(input) {
  store ||= import('../netlify/lib/runtime.mjs').then(({runtimeStore})=>runtimeStore(credentials));
  return (await store).tasks(input);
 }
 return {tick:()=>tasks(),update:input=>tasks(input)};
}
module.exports={createSyncedTaskFlow};
