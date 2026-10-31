import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const r=await read('evidence/editor-test.json');
assert.equal(r.status,'PASS');assert.equal(r.checks.length,23);assert.equal(r.errors.length,0);
const manifest=await read('dist/manifest.json');
const sums=[];
for(const name of ['life-lab.sb3','life-lab-saved.sb3']){
  const bytes=await fs.readFile(path.join(root,'dist',name));const zip=await JSZip.loadAsync(bytes,{checkCRC32:true});
  const p=JSON.parse(await zip.file('project.json').async('string'));assert.equal(p.targets.length,44);assert.equal(p.targets[0].lists.l_cells[1].length,280);
  assert.deepEqual(p.extensions,[]);for(const t of p.targets)for(const c of t.costumes){const bytes=await zip.file(c.md5ext).async('nodebuffer');assert.equal(crypto.createHash('md5').update(bytes).digest('hex'),c.assetId);}
  sums.push({name,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
assert.equal(sums[0].sha256,manifest.sha256);
await fs.writeFile(path.join(root,'dist/checksums.json'),JSON.stringify(sums,null,2)+'\n');
const report=`# 第一版本测试报告 v0.1.0

日期：2026-11-01，Asia/Shanghai。主验收结论：PASS。

## 实际运行

- Node ${process.version}；既有 Chromium 153.0.8010.12 / Playwright MCP 依赖中的 Playwright；浏览器沙箱保持开启。
- node src/build-project.mjs：${manifest.bytes} 字节，${manifest.blocks} 个原生积木，44 个原始目标；无扩展，280 个细胞克隆。
- node --test tests/*.test.mjs：11 PASS / 0 FAIL。包括全部 512 个 S/B 掩码与 0–8 邻居数、C2–8 衰退、同步演化、固定/环绕边界、图案周期、B0，以及 SB3 图结构、资产 MD5/CRC 和版本校验。
- node scripts/test-editor.mjs：23 PASS / 0 FAIL。开始 ${r.startedAt}，结束 ${r.finishedAt}。
- node scripts/finalize-report.mjs：两个交付 SB3 均通过 ZIP CRC、44 目标、280 格和全部造型 MD5 校验，校验和写入 dist/checksums.json。

## 交互证据

使用真实鼠标点击、短于 VM 帧的快速点击、拖动和键盘保持 80ms。每次单步将全部 280 格与独立 JS 参考模型比对，同时要求代数恰好加一。状态保留原始变量和数值归一后的变量，避免 Scratch 的数字字符串造成误判。测试棋盘内计算仍为原生积木，不调用 JS 参考求值。

${r.checks.map((c,i)=>`${i+1}. PASS — ${c.name}`).join('\n')}

边界、6 邻居和特定衰退状态用明确的 fixture 构造，其余主要流程使用真实操作。随机内容不依赖固定图案，使用实际随机结果逐格验证下一代。滑翔机、闪烁器和蟾蜍另有精确预期。

## 发现与修复

保留所有带时间戳的早期 JSON，不将失败记录删除或改成成功：初始测试把 Scratch 字符串数字当作严格数字；其后保存重载测试曾误用存档里上次的就绪标志，导致在新启动结束前点击。改用新的启动序号、280 克隆和空闲条件后，连续四次重载首个单步均通过。视口从窄屏恢复到桌面也等待实际渲染帧后再点击。

产品侧增加了清空确认超时后的视觉复位，以及细胞点击事件帽，避免轮询漏掉短点击。拖画轮询与点击帽用同一格号去重，真实点击和拖画回归均通过。

## 视觉与补充检查

1440×1000 桌面和 390×844 窄屏截图见 evidence/desktop-stage.png、desktop-rules.png、mobile-stage.png；人工检查布局和规则按钮，无裁切或遮挡。窄屏使用鼠标按缩放坐标操作，没有宣称验证真实触摸硬件。

原生 Codex Playwright MCP 已实际加载 SB3、点击绿旗并读取启动序号/280 格/活细胞 5，记录 evidence/native-initial.json。补充的原生 browser_press_key 短按键调用未取得预期状态，保留在 evidence/native-keyboard-attempt.json（FAIL，不用作成功验收）。键盘产品验收以隔离 SDK 页面中的真实按键（保持 80ms）和代数断言为依据。

最终隔离页面 0 页面异常、0 VM 编译异常。浏览器 Canvas2D 的 readback 性能提示可能出现；它不是逻辑或编译错误。

## 边界

20×14 有限棋盘，C 仅 2–8；没有无限缩放、RLE/JSON 导入、浏览器自动保存。1/3/6 代每秒是目标值，未做跨机器性能保证。未测真实触摸硬件、Scratch 官网导入或桌面离线版；仅声明 TurboWarp 在线编辑器及项目结构已验证。未修改其他作品或 Codex 配置，未推送或发布。
`;
await fs.writeFile(path.join(root,'doc/第一版本测试报告.md'),report);
await fs.writeFile(path.join(root,'doc/阶段性总结-v0.1.0.md'),'# 阶段性总结 v0.1.0\n\n已完成原生 SBC 生命规则实验室，支持 C2–8、20×14 棋盘、规则草稿面板、拖画擦除、同步模拟、边界、速度和 SB3 保存重载。11 项单元/结构检查与 23 项隔离浏览器交互检查通过。原生 MCP 启动验证通过；额外原生键盘断言的失败保留并与主验收区分。未修改原项目，没有发布。\n');
for(const name of ['实施计划.md','需求与测试用例.md','设计文档.md']){
  const p=path.join(root,'doc',name);let t=await fs.readFile(p,'utf8');t=t.replaceAll('COMPLETE','VERIFIED').replace('状态：PENDING','状态：VERIFIED');
  if(name==='实施计划.md'&&!t.includes('验证证据：2026-11-01'))t+='\n验证证据：2026-11-01；完整单元/结构检查 11 PASS，浏览器检查 23 PASS。命令与逐项结果见第一版本测试报告.md，原始数据见 evidence/editor-test.json，构建及资产结果见 dist/manifest.json 与 checksums.json。\n';
  await fs.writeFile(p,t);
}
console.log(JSON.stringify({status:'PASS',unitTests:11,browserChecks:r.checks.length,artifacts:sums},null,2));
