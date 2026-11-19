const assert=require('node:assert/strict');
const fs=require('node:fs');
const test=require('node:test');

const source=fs.readFileSync(require.resolve('./app.jsx'),'utf8');
const start=source.indexOf('function buildApproachMessageV2');
const end=source.indexOf('function ApproachSend',start);
const helpers=new Function(`${source.slice(start,end)};return {buildApproachMessageV2,shouldUpdateGeneratedMessage,confirmedBuyerId,confirmedBuyerSelection}`)();

test('mensagem usa primeiro nome e dados do comprador confirmado selecionado',()=>{
 const text=helpers.buildApproachMessageV2({nome:'Loja Modelo',perfilRevenda:'revendedor_potencial'},'possui',{name:'Bianca da Silva',role:'Compradora',confirmed:true});
 assert.match(text,/Olá, Bianca!/);
 assert.match(text,/Como Compradora/);
 assert.doesNotMatch(text,/quem cuida das compras/i);
 assert.match(text,/Posso compartilhar nosso catálogo/i);
 assert.doesNotMatch(text,/Estou te enviando nosso catálogo/i);
});

test('Lojas Radam não seleciona Bianca enquanto o contato salvo não está confirmado',()=>{
 const contacts=[{id:'CONTACT-BIANCA',name:'Bianca',number:'51992319851',method:'WhatsApp',confirmed:false}];
 const selectedId=helpers.confirmedBuyerId(contacts);
 const selected=contacts.find(contact=>contact.id===selectedId&&contact.confirmed===true);
 const text=helpers.buildApproachMessageV2({nome:'Lojas Radam',vendeBolsasMochilas:'bolsas'},'possui',selected);
 assert.equal(selectedId,'');
 assert.match(text,/Olá, tudo bem\?/);
 assert.match(text,/quem cuida dessa área/i);
});

test('Lojas Radam usa Bianca ao selecioná-la explicitamente para a abordagem',()=>{
 const contacts=[{id:'CONTACT-BIANCA',name:'Bianca',number:'51992319851',method:'WhatsApp',confirmed:true}];
 const selected=contacts.find(contact=>contact.id==='CONTACT-BIANCA');
 const text=helpers.buildApproachMessageV2({nome:'Lojas Radam',vendeBolsasMochilas:'bolsas'},'possui',selected);
 assert.match(text,/Olá, Bianca!/);
 assert.doesNotMatch(text,/quem cuida dessa área/i);
 assert.match(text,/contato comercial cadastrado/i);
 assert.doesNotMatch(text,/contato comercial confirmado/i);
});

test('usa comprador pendente do Perfil Comercial sem marcá-lo como confirmado',()=>{
 const contact={source:'buyer',id:'BUYER-JANETE',name:'Janete',number:'51999999999',method:'WhatsApp',confirmed:false};
 const text=helpers.buildApproachMessageV2({nome:'Fatto Acessórios',segmento:'acessórios',perfilRevenda:'revendedor_atual'},'possui',contact);
 assert.match(text,/Olá, Janete!/);
 assert.match(text,/Fatto Acessórios/);
 assert.doesNotMatch(text,/responsável pelas compras/i);
 assert.equal(contact.confirmed,false);
});

test('adapta a abordagem a uma loja que já vende bolsas e mochilas',()=>{
 const text=helpers.buildApproachMessageV2({nome:'Lojas Radan',produtosPublico:'calçados, bolsas e mochilas',perfilRevenda:'revendedor_atual'},'nao_possui');
 assert.match(text,/já trabalha com bolsas e mochilas/i);
 assert.match(text,/alternativa para complementar o portfólio/i);
 assert.doesNotMatch(text,/exclusiv/i);
});

test('diferencia uma empresa com potencial de revenda sem inventar produtos',()=>{
 const text=helpers.buildApproachMessageV2({nome:'Loja Modelo',segmento:'moda feminina',perfilRevenda:'revendedor_potencial'},'nao_possui');
 assert.match(text,/ampliar o mix/i);
 assert.match(text,/moda feminina/i);
 assert.doesNotMatch(text,/já trabalha com bolsas/i);
});

test('pode mencionar o catálogo encaminhado somente quando ele está selecionado',()=>{
 const withoutCatalog=helpers.buildApproachMessageV2({nome:'Loja Modelo'},'nao_possui',null,false);
 const withCatalog=helpers.buildApproachMessageV2({nome:'Loja Modelo'},'nao_possui',null,true);
 assert.doesNotMatch(withoutCatalog,/Estou encaminhando nosso catálogo/i);
 assert.match(withoutCatalog,/posso compartilhar nosso catálogo/i);
 assert.match(withCatalog,/Estou encaminhando nosso catálogo/i);
});

test('escolha manual de possuir contato permanece estável quando o fluxo atualiza sem comprador confirmado',()=>{
 const contacts=[{id:'CONTACT-BIANCA',name:'Bianca',confirmed:false}];
 assert.equal(helpers.confirmedBuyerSelection(contacts,''),null);
 assert.equal(helpers.confirmedBuyerSelection([],''),null);
 assert.deepEqual(helpers.confirmedBuyerSelection([{id:'CONTACT-CONFIRMADO',name:'Bianca',confirmed:true}],'CONTACT-CONFIRMADO'),{commercialContact:'possui',selectedBuyerId:'CONTACT-CONFIRMADO'});
});

test('mensagem identifica responsável quando não há comprador selecionado',()=>{
 const text=helpers.buildApproachMessageV2({nome:'Loja Modelo'},'nao_possui',null);
 assert.match(text,/Olá, tudo bem\?/);
 assert.match(text,/indicar quem cuida dessa área/i);
 assert.doesNotMatch(text,/Bianca/);
});

test('mensagem editada ou salva não é substituída pela sugestão',()=>{
 assert.equal(helpers.shouldUpdateGeneratedMessage('Mensagem salva',false),false);
 assert.equal(helpers.shouldUpdateGeneratedMessage('',true),false);
 assert.equal(helpers.shouldUpdateGeneratedMessage('',false),true);
});
