# 生命规则实验室 · TurboWarp

可修改 S/B/C 规则的康威生命游戏，原生 Scratch 积木实现，无自定义扩展。项目独立于 `D:\soft\conway-life-game`，不会覆盖原来的网页版本。

## 打开与操作

在 TurboWarp 编辑器选择「文件 → 从电脑中上传」，载入 `dist/life-lab.sb3`，点绿旗开始，默认暂停。

- 棋盘是 20×14 格。点击画出/擦除细胞，按住拖动可连续画；从活细胞或衰退格起笔会整笔擦除。绘图会暂停运行并将代数归零。
- 「运行」或空格开始/暂停；「单步」或 N 推进一代。
- 「速度」切换目标 1 / 3 / 6 代每秒；实际速度受电脑和宿主影响。
- 「固定边界」可切换为环绕边界；切换会暂停并重置代数。
- 「随机」按约 25% 密度填充活细胞。「清空」须在 3 秒内再点一次，过时或其他操作会取消确认。
- 底部滑翔机、闪烁器、蟾蜍替换棋盘并暂停，保留当前规则。自定义规则下这些图案的行为可能不同。

## S / B / C

点「规则」打开设置，数字亮起表示已选择，再点取消选择。可单独修改每一项，或选择康威、HighLife、Seeds、Brian脑预设。「应用规则」提交，「取消修改」丢弃草稿。

默认 **S23/B3/C2**：有 2 或 3 个活邻居时存活，有 3 个活邻居时出生，总计 2 个状态。

- S：活细胞保留所需的邻居数；允许空集合。
- B：空白格出生所需的邻居数；允许空集合和 B0。B0 仅在这个有限棋盘内产生新细胞。
- C：总状态数 2–8。0 是空白，1 是活细胞；C>2 时，死亡细胞依次经过 2…C-1 的衰退状态再归零。仅状态 1 计入邻居，衰退格期间不能再次出生。

规则采用 [Golly Generations](https://golly.sourceforge.io/Help/Algorithms/Generations.html) 的多状态语义，显示为带字母的 S…/B…/C… 写法。修改规则会保留细胞并将代数归零；减少 C 时，超出新范围的状态清零。

## 保存

通过编辑器文件菜单保存为 `.sb3`。重新加载后点绿旗，将保留细胞、规则、代数、速度和边界，并暂停。停止按钮会停止输入与模拟，需再次点绿旗继续。

- `dist/life-lab.sb3`：默认康威滑翔机，推荐开始使用。
- `dist/life-lab-saved.sb3`：实际 VM 保存并重新载入验证的自定义多状态示例。
- `dist/project.json`：可检查的积木数据。
- `dist/manifest.json`、`dist/checksums.json`：体积和 SHA-256。
- `evidence/editor-test.json`：最新真实浏览器测试结果及细胞/变量快照。早期失败记录也保留。
- `doc/第一版本测试报告.md`：结果和验证边界。

## 本机重建

```powershell
Set-Location D:\soft\turbowarp-life-lab
node src/build-project.mjs
node --test tests/*.test.mjs
node scripts/test-editor.mjs
```

本机复用已有 Node、JSZip 3.10.1 和旁边 `turbowarp-codex-bridge` 的 Playwright/Chromium 配置；不需要新增 MCP。Node 完整路径：`C:\Users\25133\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`。依赖可通过现有 pnpm 使用锁文件及离线缓存恢复：`install --frozen-lockfile --offline --ignore-scripts --store-dir D:\soft\turbowarp-codex-bridge\.pnpm-store`。迁移电脑须调整测试依赖和浏览器路径。

没有修改系统 PATH、注册表或 Codex 配置。Windows 执行沙箱内可能禁止项目链接和浏览器启动；经工具授权后测试仍保留 Chromium 沙箱。运行作品本身只需载入 SB3，无需 Node。

原生作品没有无限地图、缩放或 JSON/RLE 导入；无需后台服务。源码公开在 <https://github.com/xiaoxuhui/turbowarp-life-lab>，原 SB3 与编辑器工作流保留。

## 离线网页与大厅

`web-dist/index.html` 使用固定版本 TurboWarp Packager 封装现有 SB3，运行不依赖网络。网页在作品处于完整状态时自动保存棋盘、规则、代数及速度；重新进入时恢复并暂停。损坏存档不会自动覆盖，可先备份再从初始作品重新开始。

安装锁定依赖后，`node scripts/build-web.mjs` 生成网页并校验原 SB3 摘要；`node --test tests/*.test.mjs` 运行单元测试，`node scripts/test-web.cjs` 使用相邻 Bridge 的 Playwright 和浏览器运行交互测试，也可用 `TURBOWARP_BRIDGE` 与 `CHROME_PATH` 指定路径。自有代码采用 MIT 许可，打包运行时保留第三方许可，详见 `web-dist/THIRD_PARTY_NOTICES.md`。大厅接入按独立资源发行，不制作独立 APK。
