const assert=require('node:assert/strict');
const fs=require('node:fs');
const test=require('node:test');
const {groupCommercialContacts}=require('./contact-view-model.cjs');

test('Perfil Comercial combina compradores do cadastro e contatos da prospecção',()=>{
 const groups=groupCommercialContacts({
  buyers:[{id:'buyer-1',nome:'Bianca',telefone:'5551999995050',canal:'WhatsApp',confirmado:true}],
  flowContacts:[{id:'flow-1',name:'Bianca',number:'(51) 99999-5050',method:'WhatsApp',confirmed:false,notes:'Contato registrado em Preparar'}]
 });
 assert.equal(groups.length,1);
 assert.equal(groups[0].duplicate,true);
 assert.deepEqual(groups[0].sources,['buyer','flow']);
 assert.deepEqual(groups[0].ids,[{source:'buyer',id:'buyer-1'},{source:'flow',id:'flow-1'}]);
 assert.equal(groups[0].contacts[0].confirmed,true);
 assert.equal(groups[0].contacts[1].confirmed,false);
});

test('contato antigo sem correspondente permanece visível e não vira comprador geral',()=>{
 const groups=groupCommercialContacts({flowContacts:[{id:'flow-old',name:'SAC',number:'5130000000',method:'Ligação telefônica',notes:'Telefone geral'}]});
 assert.equal(groups.length,1);
 assert.equal(groups[0].duplicate,false);
 assert.equal(groups[0].contacts[0].source,'flow');
});

test('CompanyBuyers recebe as duas origens e usa o modelo visual',()=>{
 const source=fs.readFileSync(require.resolve('./app.jsx'),'utf8');
 assert.match(source,/flowContacts=\{company\.flow\?\.contacts\}/);
 assert.match(source,/groupCommercialContacts/);
});

test('Preparar reconhece compradores do Perfil Comercial e preserva escolha manual',()=>{
 const source=fs.readFileSync(require.resolve('./app.jsx'),'utf8');
 assert.match(source,/company\?\.compradores\|\|\[\]/);
 assert.match(source,/commercialContactsForApproach/);
 assert.match(source,/onChange=\{\(\)=>setCommercialContact\('nao_possui'\)\}/);
 assert.match(source,/confirmedBuyerSelection\(contacts,selectedBuyerId\)/);
});

test('Enviar reutiliza o contato selecionado do Perfil Comercial',()=>{
 const source=fs.readFileSync(require.resolve('./app.jsx'),'utf8');
 assert.match(source,/availableContacts=\[\]/);
 assert.match(source,/availableContacts\.length\?availableContacts/);
 assert.match(source,/availableContacts=\{commercialContactsForApproach\(company,flow\.contacts\|\|\[\]\)\}/);
});

test('a caixa inteira do comprador pode ser clicada e o selecionado recebe estado visual',()=>{
 const source=fs.readFileSync(require.resolve('./app.jsx'),'utf8');
 const styles=fs.readFileSync(require.resolve('./overview.css'),'utf8');
 assert.match(source,/commercial-buyer [^>]+onClick=\{\(\)=>\{setSelectedBuyerId\(contact\.id\)/);
 assert.match(styles,/commercial-buyer\.selected\{border-color:#75b98b;background:#e8f6ec/);
});
