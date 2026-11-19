const {test}=require('node:test');
const assert=require('node:assert/strict');
const {normalizeCommercialContacts,normalizePhone,groupCommercialContacts}=require('./contact-view-model.cjs');

test('normaliza compradores e contatos antigos sem modificar os registros de origem',()=>{
 const buyers=[{id:'buyer-1',nome:'  Bianca  ',telefone:' (51) 99999-5050 ',canal:'WhatsApp',observacoes:' Compras ',confirmado:true,extra:'preservado'}];
 const flowContacts=[{id:'CONTACT-1',name:'  Carla ',role:'Gerente',method:'E-mail',number:' carla@loja.test ',notes:' Contato antigo ',confirmed:false,createdAt:'2026-11-19T12:00:00.000Z'}];
 const before=structuredClone({buyers,flowContacts});

 const contacts=normalizeCommercialContacts({buyers,flowContacts});

 assert.deepEqual(contacts,[
  {source:'buyer',id:'buyer-1',key:'buyer:buyer-1',name:'Bianca',role:'Comprador',method:'WhatsApp',number:'(51) 99999-5050',notes:'Compras',confirmed:true,original:{...buyers[0]}},
  {source:'flow',id:'CONTACT-1',key:'flow:CONTACT-1',name:'Carla',role:'Gerente',method:'E-mail',number:'carla@loja.test',notes:'Contato antigo',confirmed:false,original:{...flowContacts[0]}}
 ]);
 assert.deepEqual({buyers,flowContacts},before);
});

test('preserva identificadores distintos e confirmação quando os contatos têm o mesmo telefone',()=>{
 const contacts=normalizeCommercialContacts({
  buyers:[{id:'buyer-9',nome:'Bianca',telefone:'51999995050',canal:'WhatsApp',observacoes:'',confirmado:true}],
  flowContacts:[{id:'CONTACT-9',name:'Bianca',role:'Compras',method:'WhatsApp',number:'51999995050',notes:'Registro antigo',confirmed:false}]
 });

 assert.equal(contacts.length,2);
 assert.deepEqual(contacts.map(contact=>[contact.source,contact.id,contact.key,contact.confirmed]),[
  ['buyer','buyer-9','buyer:buyer-9',true],
  ['flow','CONTACT-9','flow:CONTACT-9',false]
 ]);
});

test('aceita listas ausentes e mantém campos antigos opcionais compatíveis',()=>{
 assert.deepEqual(normalizeCommercialContacts(),[]);
 assert.deepEqual(normalizeCommercialContacts({buyers:null,flowContacts:[{id:'legacy',name:'Ana'}]}),[
  {source:'flow',id:'legacy',key:'flow:legacy',name:'Ana',role:'',method:'',number:'',notes:'',confirmed:false,original:{id:'legacy',name:'Ana'}}
 ]);
});

test('agrupa visualmente buyer e flow pelo telefone normalizado, preservando as duas referências',()=>{
 const groups=groupCommercialContacts({
  buyers:[{id:'buyer-1',nome:'Bianca',telefone:'+55 (51) 99999-5050',confirmado:true}],
  flowContacts:[{id:'flow-1',name:'Bianca',number:'(51) 99999-5050',confirmed:false}]
 });

 assert.equal(groups.length,1);
 assert.equal(groups[0].duplicate,true);
 assert.equal(groups[0].phoneNormalized,'51999995050');
 assert.deepEqual(groups[0].sources,['buyer','flow']);
 assert.deepEqual(groups[0].ids,[{source:'buyer',id:'buyer-1'},{source:'flow',id:'flow-1'}]);
 assert.equal(groups[0].contacts[0].confirmed,true);
 assert.equal(groups[0].contacts[1].confirmed,false);
});

test('normaliza telefones com formatações diferentes sem usar o nome como critério',()=>{
 assert.equal(normalizePhone('+55 (51) 99999-5050'),'51999995050');
 assert.equal(normalizePhone('51 99999 5050'),'51999995050');
 assert.equal(groupCommercialContacts({
  buyers:[{id:'buyer-2',nome:'Ana',telefone:'51999995050'}],
  flowContacts:[{id:'flow-2',name:'Outra pessoa',number:'5551999995050'}]
 })[0].duplicate,true);
});

test('não agrupa contatos sem telefone, mesmo quando o nome coincide',()=>{
 const groups=groupCommercialContacts({
  buyers:[{id:'buyer-3',nome:'Bianca'}],
  flowContacts:[{id:'flow-3',name:'Bianca',number:''}]
 });
 assert.equal(groups.length,2);
 assert.deepEqual(groups.map(group=>group.duplicate),[false,false]);
});

test('mantém contatos distintos separados e não modifica os registros originais',()=>{
 const buyers=[{id:'buyer-4',nome:'Ana',telefone:'51911112222',confirmado:true}];
 const flowContacts=[{id:'flow-4',name:'Bruna',number:'51933334444',confirmed:true}];
 const before=structuredClone({buyers,flowContacts});
 const groups=groupCommercialContacts({buyers,flowContacts});
 assert.equal(groups.length,2);
 assert.deepEqual(groups.map(group=>group.duplicate),[false,false]);
 assert.deepEqual({buyers,flowContacts},before);
});
