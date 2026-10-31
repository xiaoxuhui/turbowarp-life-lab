import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {step,pattern,xy,N,ruleText} from '../src/core.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const req=createRequire(new URL('../../turbowarp-codex-bridge/package.json',import.meta.url));
const {chromium}=createRequire(req.resolve('@playwright/mcp/package.json'))('playwright');
const cfg=JSON.parse(await fs.readFile(new URL('../../turbowarp-codex-bridge/config/playwright.json',import.meta.url),'utf8'));
const report={startedAt:new Date().toISOString(),checks:[],states:[],errors:[],console:[]};
const browser=await chromium.launch({...cfg.browser.launchOptions,headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'zh-CN'});
page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(['warning','error'].includes(m.type()))report.console.push({level:m.type(),text:m.text()});});
const check=(name,detail)=>{report.checks.push({name,status:'PASS',detail});console.log('PASS '+name);};
// Scratch variables may store numeric literals as strings. Compare their numeric
// values, as Scratch arithmetic does, while preserving raw values in the report.
async function state(label){const s=await page.evaluate(()=>{const v=vm.runtime.getTargetForStage().variables;const rawVars=Object.fromEntries(Object.values(v).filter(v=>v.type!=='list').map(v=>[v.name,v.value]));return {cells:[...v.l_cells.value].map(Number),rawVars,vars:Object.fromEntries(Object.entries(rawVars).map(([n,x])=>[n,typeof x==='number'||typeof x==='string'&&x.trim()!==''&&Number.isFinite(Number(x))?Number(x):x])),clones:vm.runtime.targets.filter(t=>!t.isOriginal).length,compileErrors:window.__lifeErrors};});assert.equal(s.cells.length,N);assert.equal(s.vars.活细胞,s.cells.filter(n=>n===1).length);assert.equal(s.vars.规则,ruleText(Number(s.vars.B),Number(s.vars.S),Number(s.vars.C)));if(label)report.states.push({label,...s});return s;}
async function idle(){await page.waitForFunction(()=>Number(vm.runtime.getTargetForStage().variables.v_忙碌.value)===0,{},{timeout:20000});}
async function coordinates(x,y){const r=await page.locator('canvas').first().boundingBox();assert(r);return {x:r.x+(x+240)/480*r.width,y:r.y+(180-y)/360*r.height};}
async function point(x,y){const p=await coordinates(x,y);await page.mouse.click(p.x,p.y,{delay:90});await page.waitForTimeout(70);await idle();}
async function tool(name){const p=await page.evaluate(n=>{const t=vm.runtime.targets.find(t=>t.getName()===n+'按钮');if(!t||!t.visible)throw Error('not visible '+n);return {x:t.x,y:t.y};},name);await point(p.x,p.y);}
async function cell(id){const p=xy(id);await point(p.x,p.y);}
async function clearBoard(){await tool('清空');await tool('清空');assert((await state()).cells.every(v=>v===0));}
async function one(){const before=await state();await tool('单步');const after=await state();try{assert.equal(after.vars.代数,before.vars.代数+1,'single-step generation must advance exactly once');assert.deepEqual(after.cells,step(before.cells,{B:Number(before.vars.B),S:Number(before.vars.S),C:Number(before.vars.C),wrap:before.vars.环绕===1}),'native one generation vs independent model');}catch(e){report.states.push({label:'failed step before',...before},{label:'failed step after',...after});throw e;}return after;}
async function fixture(cells){await page.evaluate(b=>{const v=vm.runtime.getTargetForStage().variables;v.l_cells.value=b;v.v_代数.value=0;},cells);await tool('速度');}
async function initialize(){
  const previous=await page.evaluate(()=>Number(vm.runtime.getTargetForStage().variables.v_启动序号.value));
  await page.locator('img[class*="green-flag_green-flag"]').click();
  // A saved project already contains the previous ready count and idle value.
  // Require a new boot sequence before trusting those values for this load.
  await page.waitForFunction(previous=>{const v=vm.runtime.getTargetForStage().variables;return Number(v.v_启动序号.value)>previous&&Number(v.v_已建格子.value)===280&&Number(v.v_忙碌.value)===0;},previous,{timeout:30000});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await idle();
}
try{
  await page.goto('https://turbowarp.org/editor',{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.vm?.runtime?.targets.some(t=>!t.isStage&&t.getCostumes().length>0));await page.locator('img[class*="sprite-selector-item_sprite-image"]').first().waitFor({state:'visible'});
  const b64=(await fs.readFile(path.join(root,'dist/life-lab.sb3'))).toString('base64');
  await page.evaluate(async b=>{await vm.loadProject(Uint8Array.from(atob(b),c=>c.charCodeAt(0)).buffer);vm.setEditingTarget(vm.runtime.targets.find(t=>t.getName()==='生命引擎').id);window.__lifeErrors=[];vm.on('COMPILE_ERROR',(_t,e)=>window.__lifeErrors.push(String(e)));},b64);
  await initialize();let s=await state('initial');assert.deepEqual(s.cells,pattern('滑翔机'));assert.equal(s.clones,280);assert.equal(s.vars.运行,0);check('U01 加载原生 SB3、280 格、默认 SBC 规则');
  for(let i=0;i<4;i++)await one();assert.deepEqual((await state('glider four')).cells,pattern('滑翔机',9,6));check('U02 滑翔机四代逐格匹配参考并平移');
  await tool('闪烁器');const blink=(await state()).cells;await one();await one();assert.deepEqual((await state()).cells,blink);await tool('蟾蜍');const toad=(await state()).cells;await one();await one();assert.deepEqual((await state()).cells,toad);check('U02/U09 闪烁器和蟾蜍周期 2');
  const beforeExpiry=(await state()).cells;await tool('清空');await page.waitForTimeout(3300);assert.deepEqual((await state()).cells,beforeExpiry);assert.equal(await page.evaluate(()=>vm.runtime.targets.find(t=>t.getName()==='清空按钮').currentCostume),0);await tool('清空');assert.deepEqual((await state()).cells,beforeExpiry);await tool('速度');check('U09 清空确认超时复位，不会误清空');
  const beforeClear=(await state()).cells;await tool('清空');assert.deepEqual((await state()).cells,beforeClear);await tool('速度');await tool('清空');assert.deepEqual((await state()).cells,beforeClear);await tool('清空');assert((await state()).cells.every(v=>v===0));check('U09 清空二次确认及其他按钮取消确认');
  await cell(42);assert.equal((await state()).cells[42],1);await cell(42);assert.equal((await state()).cells[42],0);check('U04 单格点击绘制和擦除');
  const quick=await coordinates(xy(42).x,xy(42).y);for(const expected of [1,0,1,0]){await page.mouse.click(quick.x,quick.y);await page.waitForTimeout(100);await idle();assert.equal((await state()).cells[42],expected);}check('U04 短于 VM 帧的快速点击也能响应');
  const start=await coordinates(xy(44).x,xy(44).y);await page.mouse.move(start.x,start.y);await page.mouse.down();await page.waitForTimeout(80);for(let i=45;i<=48;i++){const p=await coordinates(xy(i).x,xy(i).y);await page.mouse.move(p.x,p.y);await page.waitForTimeout(80);}await page.mouse.up();await page.waitForTimeout(100);assert((await state()).cells.slice(44,49).every(v=>v===1));
  await page.mouse.move(start.x,start.y);await page.mouse.down();await page.waitForTimeout(80);for(let i=45;i<=48;i++){const p=await coordinates(xy(i).x,xy(i).y);await page.mouse.move(p.x,p.y);await page.waitForTimeout(80);}await page.mouse.up();await page.waitForTimeout(100);assert((await state()).cells.slice(44,49).every(v=>v===0));check('U04 拖画及整笔固定擦除值');
  await tool('规则');await tool('S0');await tool('B6');await tool('C4');s=await state('rule draft');assert.equal(s.vars.S,12);assert.equal(s.vars.B,8);assert.equal(s.vars.C,2);assert.equal(s.vars.PC,4);await tool('取消');assert.equal((await state()).vars.规则,'S23/B3/C2');check('U05 独立 S/B/C 草稿且取消不提交');
  await tool('规则');await tool('HighLife');await tool('应用');assert.equal((await state()).vars.规则,'S23/B36/C2');
  const six=Array(N).fill(0);for(const i of [84,85,86,104,106,124])six[i]=1;await fixture(six);assert.equal((await one()).cells[105],1);assert.equal(step(six)[105],0);check('U06 HighLife 的 6 邻居出生真实生效');
  await tool('规则');await tool('Seeds');await tool('应用');assert.equal((await state()).vars.规则,'S/B2/C2');await tool('滑翔机');await one();check('U05/U06 Seeds 预设及空存活集合');
  await tool('规则');await tool('康威');await tool('S2');await tool('S3');await tool('B3');await tool('B0');await tool('应用');assert.equal((await state()).vars.规则,'S/B0/C2');await clearBoard();assert((await one()).cells.every(v=>v===1));check('U06 B0 在空棋盘同时出生全部 280 格');
  await tool('规则');await tool('B0');await tool('应用');assert.equal((await state()).vars.规则,'S/B/C2');assert((await one()).cells.every(v=>v===0));check('U06 空出生/存活集合令棋盘熄灭');
  await tool('规则');await tool('Brian脑');await tool('应用');assert.equal((await state()).vars.规则,'S/B2/C3');await tool('随机');await one();await one();check('U07 C3 运行、衰退与参考逐格一致');
  await tool('规则');await tool('B2');await tool('C8');await tool('应用');const singleton=Array(N).fill(0);singleton[105]=1;await fixture(singleton);
  for(let expected=2;expected<=7;expected++){s=await one();assert.equal(s.cells[105],expected);}assert.equal((await one()).cells[105],0);check('U07 C8 状态 1→2→…→7→0 完整衰退链');
  singleton[105]=7;await fixture(singleton);await tool('规则');await tool('C2');await tool('应用');assert.equal((await state()).cells[105],0);check('U07 降低 C 清理超出状态并保留合法状态');
  await tool('规则');await tool('康威');await tool('应用');const edge=Array(N).fill(0);for(const i of [19,39,0])edge[i]=1;await fixture(edge);const fixed=(await one()).cells;await tool('边界');await fixture(edge);const wrapped=(await one()).cells;assert.notDeepEqual(fixed,wrapped);await tool('边界');check('U08 固定/环绕边界产生不同且正确的演化');
  const speeds=new Set();for(let i=0;i<3;i++){await tool('速度');speeds.add((await state()).vars.速度);}assert.deepEqual([...speeds].sort((a,b)=>a-b),[1,3,6]);check('U03 速度三档切换');
  await tool('滑翔机');await page.keyboard.press('Space',{delay:80});await page.waitForFunction(()=>vm.runtime.getTargetForStage().variables.v_代数.value>=2,{},{timeout:15000});await page.keyboard.press('Space',{delay:80});await page.waitForTimeout(150);s=await state('paused');assert.equal(s.vars.运行,0);const generation=s.vars.代数;await page.waitForTimeout(500);assert.equal((await state()).vars.代数,generation);await page.keyboard.press('n',{delay:80});await page.waitForTimeout(150);assert.equal((await state()).vars.代数,generation+1);check('U03 自动运行、空格暂停及 N 单步');
  await tool('运行');await cell(0);assert.equal((await state()).vars.运行,0);check('U04 绘图自动暂停运行');
  await tool('规则');await tool('HighLife');await tool('C4');await tool('应用');await tool('随机');s=await state('save candidate');assert(s.vars.活细胞>0&&s.vars.活细胞<N);await one();s=await state('saved');const expected=s.cells,rule=s.vars.规则,gen=s.vars.代数;
  const saved=await page.evaluate(async()=>{let s='';for(const n of new Uint8Array(await(await vm.saveProjectSb3()).arrayBuffer()))s+=String.fromCharCode(n);return btoa(s);});await fs.writeFile(path.join(root,'dist/life-lab-saved.sb3'),Buffer.from(saved,'base64'));
  for(let reload=0;reload<4;reload++){
    await page.evaluate(async b=>{await vm.loadProject(Uint8Array.from(atob(b),c=>c.charCodeAt(0)).buffer);vm.setEditingTarget(vm.runtime.targets.find(t=>t.getName()==='生命引擎').id);},saved);await initialize();s=await state('reloaded '+reload);assert.deepEqual(s.cells,expected);assert.equal(s.vars.规则,rule);assert.equal(s.vars.代数,gen);assert.equal(s.vars.运行,0);await one();
  }check('U09/U10 随机填充、连续四次重载后首个单步及规则/细胞保持');
  await tool('规则');await tool('康威');await page.screenshot({path:path.join(root,'evidence/editor-rule-panel.png')});await tool('应用');await tool('滑翔机');
  await page.locator('img[title="全屏模式"]').click();await page.screenshot({path:path.join(root,'evidence/desktop-stage.png')});await tool('规则');await page.screenshot({path:path.join(root,'evidence/desktop-rules.png')});await tool('取消');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);await cell(0);assert.equal((await state()).cells[0],1);await tool('规则');await tool('S0');await tool('应用');assert.equal((await state()).vars.规则,'S023/B3/C2');await page.screenshot({path:path.join(root,'evidence/mobile-stage.png')});check('U11 窄屏绘图与规则面板实际点击');
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await tool('规则');await tool('康威');await tool('应用');await tool('滑翔机');await page.screenshot({path:path.join(root,'evidence/final-stage.png')});s=await state('final');assert.equal(s.compileErrors.length,0);assert.equal(report.errors.length,0);check('U12 无页面或 VM 编译异常');report.status='PASS';
}catch(e){report.status='FAIL';report.error={message:e.message,stack:e.stack};console.error(e);process.exitCode=1;await page.screenshot({path:path.join(root,'evidence/failure.png')}).catch(()=>{});}
finally{report.finishedAt=new Date().toISOString();const data=JSON.stringify(report,null,2);await fs.writeFile(path.join(root,'evidence/editor-test.json'),data);await fs.writeFile(path.join(root,'evidence',`editor-test-${report.startedAt.replace(/[:.]/g,'-')}.json`),data);await browser.close();console.log(JSON.stringify({status:report.status,checks:report.checks.length,error:report.error?.message}));}
