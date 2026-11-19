function text(value){return typeof value==='string'?value.trim():''}

function snapshot(record){return {...record}}

function buyerView(buyer){
 return {
  source:'buyer',
  id:buyer.id,
  key:'buyer:'+buyer.id,
  name:text(buyer.nome),
  role:'Comprador',
  method:text(buyer.canal),
  number:text(buyer.telefone),
  notes:text(buyer.observacoes),
  confirmed:buyer.confirmado===true,
  original:snapshot(buyer)
 };
}

function flowContactView(contact){
 return {
  source:'flow',
  id:contact.id,
  key:'flow:'+contact.id,
  name:text(contact.name),
  role:text(contact.role),
  method:text(contact.method),
  number:text(contact.number),
  notes:text(contact.notes),
  confirmed:contact.confirmed===true,
  original:snapshot(contact)
 };
}

function normalizeCommercialContacts({buyers=[],flowContacts=[]}={}){
 const safeBuyers=Array.isArray(buyers)?buyers:[];
 const safeFlowContacts=Array.isArray(flowContacts)?flowContacts:[];
 return [
  ...safeBuyers.filter(buyer=>buyer&&typeof buyer==='object'&&!Array.isArray(buyer)).map(buyerView),
  ...safeFlowContacts.filter(contact=>contact&&typeof contact==='object'&&!Array.isArray(contact)).map(flowContactView)
 ];
}

function normalizePhone(value){
 const digits=String(value??'').replace(/\D/g,'');
 if(!digits)return '';
 return digits.replace(/^55(?=\d{10,11}$)/,'');
}

function groupCommercialContacts({buyers=[],flowContacts=[]}={}){
 const contacts=normalizeCommercialContacts({buyers,flowContacts});
 const groups=[];

 for(const contact of contacts){
  const phoneNormalized=normalizePhone(contact.number);
  const match=phoneNormalized
   ? groups.find(group=>group.phoneNormalized===phoneNormalized&&group.contacts.some(item=>item.source!==contact.source))
   : undefined;

  if(match){
   match.contacts.push(contact);
  }else{
   groups.push({phoneNormalized,contacts:[contact]});
  }
 }

 return groups.map(group=>{
  const duplicate=group.contacts.length>1;
  return {
   key:duplicate?'duplicate:'+group.contacts.map(contact=>contact.key).join('|'):group.contacts[0].key,
   duplicate,
   phoneNormalized:group.phoneNormalized,
   sources:[...new Set(group.contacts.map(contact=>contact.source))],
   ids:group.contacts.map(contact=>({source:contact.source,id:contact.id})),
   display:group.contacts[0],
   contacts:group.contacts
  };
 });
}

module.exports={normalizeCommercialContacts,normalizePhone,groupCommercialContacts};
