import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const config=JSON.parse(fs.readFileSync('web/config.json','utf8'));
const project=JSON.parse(fs.readFileSync('dist/project.json','utf8'));
const stage=project.targets.find(target=>target.isStage);
const variables=Object.fromEntries(Object.entries({...stage.variables,...stage.lists}).map(([id,value])=>[id,{value:value[1]}]));
const element=()=>({setAttribute(){},after(){},addEventListener(){},hidden:false,textContent:''});
const document={createElement:element,body:{append(){}},addEventListener(){}};
const window={__hallConfig:config,scaffolding:{vm:{runtime:{getTargetForStage:()=>({variables})}},start(){}},addEventListener(){}};
vm.runInNewContext(fs.readFileSync('web/adapter.js','utf8'),{window,document});
const data=()=>({schemaVersion:1,id:config.id,contract:config.id+'-dynamic-v1',values:window.hall.read()});
test('original SB3 initial state satisfies its hall contract',()=>assert.doesNotThrow(()=>window.hall.validate(data())));
test('wrong game or storage contract cannot overwrite this game',()=>{const a=data();a.id='wrong';assert.throws(()=>window.hall.validate(a));const b=data();b.contract='wrong';assert.throws(()=>window.hall.validate(b));});
if(config.kind==='life'){
 test('invalid dimensions, cell states and rule masks are rejected',()=>{const a=data();a.values.l_cells.pop();assert.throws(()=>window.hall.validate(a));const b=data();b.values.l_cells[0]=99;assert.throws(()=>window.hall.validate(b));const c=data();c.values.v_B=512;assert.throws(()=>window.hall.validate(c));});
}else{
 test('inconsistent transition rules or encoded states are rejected',()=>{const a=data();a.values.l_RW.pop();assert.throws(()=>window.hall.validate(a));const b=data();b.values.v_状态编码='invalid';assert.throws(()=>window.hall.validate(b));});
 test('maximum 8192 cell tape is accepted and 8193 rejected',()=>{const a=data();a.values.l_tape=Array(8192).fill(a.values.v_空白);a.values.v_左端=0;a.values.v_读写头=0;assert.doesNotThrow(()=>window.hall.validate(a));a.values.l_tape.push(a.values.v_空白);assert.throws(()=>window.hall.validate(a));});
}
