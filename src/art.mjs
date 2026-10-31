export const svg=(body,w=480,h=360)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><style>text{font-family:'Microsoft YaHei','Noto Sans SC',sans-serif}</style>${body}</svg>`;
const text=(x,y,s,size=12,color='#c8dae8',anchor='start')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${s}</text>`;
const header=`<rect width="480" height="360" fill="#101e31"/><rect x="9" y="8" width="462" height="34" rx="10" fill="#203850"/>${text(22,32,'生命规则实验室',19,'#f0fff9')}${text(454,30,'S / B / C · v0.1.0',11,'#9bc6cb','end')}`;
export const boardArt=svg(header+`<rect x="8" y="75" width="98" height="238" rx="10" fill="#192d43"/><rect x="126" y="82" width="324" height="228" rx="6" fill="#2d465b"/>${text(14,334,'图案',12)}${text(12,353,'拖画/擦除 · 空格运行 · N 单步 · 1 活细胞 / 2+ 衰退',10,'#83a7be')}`);
export const ruleArt=svg(header+`${text(24,107,'S 存活：活细胞有多少个活邻居时保留？',13)}${text(24,172,'B 出生：空白格有多少个活邻居时变活？',13)}${text(24,237,'C 状态数：2 为生/死；3–8 加入衰退状态',13)}${text(240,350,'仅绿色的状态 1 计入邻居 · 应用后才生效',11,'#83a7be','middle')}`);
export const palette=['#1b3046','#7be0b5','#e49dba','#c98cb6','#ab80ad','#8d76a2','#706894','#555d84'];
export const cellArt=n=>svg(`<rect x="0" y="0" width="14" height="14" rx="2" fill="${palette[n]}"/>`,14,14);
export const buttonArt=(label,active=false,w=92,h=30)=>svg(`<rect x="1" y="1" width="${w-2}" height="${h-2}" rx="7" fill="${active?'#2c796b':'#29465e'}" stroke="${active?'#8be8c6':'#42637a'}"/>${text(w/2,h/2+4,label,w<40?17:12,active?'#eefff8':'#d0e2ed','middle')}`,w,h);
