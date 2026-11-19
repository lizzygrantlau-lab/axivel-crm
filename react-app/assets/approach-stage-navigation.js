/* Navegação local das três etapas da abordagem. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(typeof document==='undefined')return;
 function setup(){document.querySelectorAll('.approach-task .approach-stage-nav').forEach(nav=>api.sync(nav))}
 document.addEventListener('click',event=>{const stage=event.target.closest('.approach-stage[data-approach-view]');if(!stage||stage.getAttribute('aria-disabled')==='true')return;api.select(stage.closest('.approach-stage-nav'),stage.dataset.approachView)});
 document.addEventListener('keydown',event=>{if(!['Enter',' '].includes(event.key))return;const stage=event.target.closest('.approach-stage[data-approach-view]');if(!stage||stage.getAttribute('aria-disabled')==='true')return;event.preventDefault();api.select(stage.closest('.approach-stage-nav'),stage.dataset.approachView)});
 const observer=new MutationObserver(setup);if(document.body)observer.observe(document.body,{childList:true,characterData:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})(globalThis,function(){
 function stages({preparationDone=false,sendDone=false,view='prepare'}={}){return [{view:'prepare',done:preparationDone,ready:true,enabled:true,active:view==='prepare'},{view:'send',done:sendDone,ready:preparationDone&&!sendDone,enabled:preparationDone,active:view==='send'},{view:'follow',done:false,ready:sendDone,enabled:sendDone,active:view==='follow'}]}
 function currentView(task){return ['prepare','send','follow'].find(view=>task.classList.contains('approach-view-'+view))||'prepare'}
 function stateFor(nav){const task=nav.closest('.approach-task');const [prepare]=nav.querySelectorAll(':scope > .approach-stage');return stages({preparationDone:prepare?.classList.contains('done')||false,sendDone:/Contato registrado/i.test(task?.querySelector('.send-status')?.textContent||''),view:currentView(task)})}
 function sync(nav){const state=stateFor(nav);nav.querySelectorAll(':scope > .approach-stage').forEach((element,index)=>{const stage=state[index];if(!stage)return;element.dataset.approachView=stage.view;element.setAttribute('role','button');element.setAttribute('tabindex',stage.enabled?'0':'-1');element.setAttribute('aria-disabled',String(!stage.enabled));element.setAttribute('aria-current',stage.active?'step':'false');element.classList.toggle('active',stage.active);element.classList.toggle('done',stage.done);element.classList.toggle('ready',stage.ready&&!stage.done)})}
 function select(nav,view){if(!nav)return;const stage=stateFor(nav).find(item=>item.view===view);if(!stage?.enabled)return;const task=nav.closest('.approach-task');['prepare','send','follow'].forEach(name=>task.classList.toggle('approach-view-'+name,name===view));sync(nav)}
 return {stages,sync,select};
});
