const assert=require('node:assert/strict');
const fs=require('node:fs');
const test=require('node:test');

const source=fs.readFileSync(require.resolve('./app.jsx'),'utf8');
const start=source.indexOf('function ProspectingCenter');
const end=source.indexOf('function CompanyContact',start);
const page=source.slice(start,end);

test('filtro de origem fica na página Cadastros e leads',()=>{
 assert.notEqual(start,-1);
 assert.match(page,/Origem da empresa/);
 assert.match(page,/multiple/);
 assert.match(page,/nao_informado/);
 assert.match(page,/origins.some/);
 assert.match(page,/setOrigins\(\[\]\)/);
});

test('Central de Prospecção mantém os quatro indicadores existentes',()=>{
 for(const label of ['Prospecções em andamento','Aguardando retorno','Prospecções a fazer','Clientes aguardando prospecção'])assert.ok(page.includes(label));
});
