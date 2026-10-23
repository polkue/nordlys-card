import * as acorn from 'acorn'; import * as walk from 'acorn-walk'; import fs from 'fs';
const src = fs.readFileSync(process.argv[2],'utf8');
const ast = acorn.parse(src,{ecmaVersion:'latest',sourceType:'script',locations:true});
const out=[];
walk.full(ast, n=>{ if(n.type==='Literal' && typeof n.value==='string') out.push({s:n.start,e:n.end,line:n.loc.start.line,v:n.value}); });
fs.writeFileSync(process.argv[3], JSON.stringify(out));
