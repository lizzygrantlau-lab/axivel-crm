const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
require('node:child_process').execFileSync(process.execPath,['--test','react-app/*.test.cjs','react-app/*.test.mjs','netlify/lib/*.test.mjs','netlify/tests/*.test.mjs'],{cwd:root,stdio:'inherit'});
const target=path.join(root,'netlify-public');
fs.mkdirSync(target,{recursive:true});
// Publicar somente a interface e os recursos visuais, nunca dados ou código do servidor.
for(const file of ['index.html','app.jsx','styles.css','overview.css'])fs.copyFileSync(path.join(root,'react-app',file),path.join(target,file));
fs.cpSync(path.join(root,'react-app','assets'),path.join(target,'assets'),{recursive:true});
console.log('Interface preparada para o Netlify.');
