import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import JSZip from 'jszip';
const bytes=await fs.readFile(new URL('../dist/life-lab.sb3',import.meta.url));
const zip=await JSZip.loadAsync(bytes,{checkCRC32:true});
const p=JSON.parse(await zip.file('project.json').async('string'));
test('SB3 all assets and block graph references valid',async()=>{
  const global=new Set(Object.keys(p.targets[0].variables));
  for(const t of p.targets){const vars=new Set([...global,...Object.keys(t.variables)]);
    for(const c of t.costumes){const s=zip.file(c.md5ext);assert(s,c.md5ext);assert.equal(crypto.createHash('md5').update(await s.async('nodebuffer')).digest('hex'),c.assetId);}
    for(const b of Object.values(t.blocks)){
      for(const ref of [b.next,b.parent])if(ref)assert(t.blocks[ref]);
      for(const value of Object.values(b.inputs))for(const ref of value.slice(1))if(typeof ref==='string')assert(t.blocks[ref],ref);
      if(b.fields.VARIABLE)assert(vars.has(b.fields.VARIABLE[1]));
    }
  }
});
test('no extensions, 280 cells below clone cap, SBC controls and defaults',()=>{
  assert.deepEqual(p.extensions,[]);assert.equal(p.targets[0].lists.l_cells[1].length,280);assert(280<300);
  assert.equal(p.targets[0].variables.v_规则[1],'S23/B3/C2');assert.equal(p.targets.find(t=>t.name==='细胞').costumes.length,8);
  for(const n of ['S0','S8','B0','B8','C2','C8','应用','取消'])assert(p.targets.some(t=>t.name===n+'按钮'));
  assert(!JSON.stringify(p).includes('http'));
});
test('version and deterministic SHA manifest',async()=>{
  const pkg=JSON.parse(await fs.readFile(new URL('../package.json',import.meta.url),'utf8'));
  const art=await fs.readFile(new URL('../src/art.mjs',import.meta.url),'utf8'),log=await fs.readFile(new URL('../CHANGELOG.md',import.meta.url),'utf8');
  assert(art.includes(pkg.version)&&log.includes(pkg.version));
  const m=JSON.parse(await fs.readFile(new URL('../dist/manifest.json',import.meta.url),'utf8'));assert.equal(m.sha256,crypto.createHash('sha256').update(bytes).digest('hex'));
});
