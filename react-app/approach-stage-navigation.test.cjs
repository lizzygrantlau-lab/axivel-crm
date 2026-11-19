const {test}=require('node:test');
const assert=require('node:assert/strict');
const {stages}=require('./assets/approach-stage-navigation.js');

test('a preparação concluída libera o envio',()=>{
 const result=stages({preparationDone:true,view:'prepare'});
 assert.deepEqual(result.map(stage=>[stage.view,stage.done,stage.ready,stage.enabled]),[['prepare',true,true,true],['send',false,true,true],['follow',false,false,false]]);
});

test('o envio concluído libera o acompanhamento sem alterar a preparação',()=>{
 const result=stages({preparationDone:true,sendDone:true,view:'follow'});
 assert.deepEqual(result.map(stage=>[stage.view,stage.done,stage.ready,stage.enabled,stage.active]),[['prepare',true,true,true,false],['send',true,false,true,false],['follow',false,true,true,true]]);
});
