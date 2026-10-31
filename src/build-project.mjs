import JSZip from 'jszip';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {pattern,shapes,N} from './core.mjs';
import {boardArt,ruleArt,cellArt,buttonArt,svg} from './art.mjs';
import {ScratchBuilder,expr,cmd,V,L,length,arg,set,change,clear,push,replace,add,sub,mul,div,mod,eq,gt,and,not,math,join,repeat,iff,wait,forever,broadcast,variableId,listId} from './scratch-builder.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const c=new ScratchBuilder('life');
const or=(a,b)=>expr('operator_or',{OPERAND1:a,OPERAND2:b});
const bit=(m,n)=>mod(math('floor',div(m,L('weights',add(n,1)))),2);
const X=id=>add(-104,mul(mod(sub(id,1),20),16));
const Y=id=>sub(88,mul(math('floor',div(sub(id,1),20)),16));
const goto=(x,y)=>cmd('motion_gotoxy',{X:x,Y:y});
const blank=()=>[clear('cells'),repeat(N,[push('cells',0)])];
const vars={代数:0,活细胞:5,规则:'S23/B3/C2',B:8,S:12,C:2,PB:8,PS:12,PC:2,环绕:0,速度:3,运行:0,视图:0,忙碌:0,动作:0,时刻:0,清空时刻:-10,拖画:0,笔值:1,上格:0,格:0,i:0,j:0,r:0,col:0,dx:0,dy:0,nr:0,nc:0,邻居:0,当前:0,结果:0,ruleB:'',ruleS:'',已建格子:0};
c.define('更新规则文本',[],[
  set('ruleS',''),set('ruleB',''),set('i',0),repeat(9,[iff(eq(bit(V('S'),V('i')),1),[set('ruleS',join(V('ruleS'),V('i')))]),iff(eq(bit(V('B'),V('i')),1),[set('ruleB',join(V('ruleB'),V('i')))]),change('i',1)]),
  set('规则',join('S',join(V('ruleS'),join('/B',join(V('ruleB'),join('/C',V('C')))))))
],[20,20]);
c.define('统计细胞',[],[set('活细胞',0),set('i',1),repeat(N,[iff(eq(L('cells',V('i')),1),[change('活细胞',1)]),change('i',1)])],[450,20]);
c.define('下一代',[],[
  clear('next'),set('i',1),repeat(N,[
    set('r',math('floor',div(sub(V('i'),1),20))),set('col',mod(sub(V('i'),1),20)),set('邻居',0),set('dy',-1),
    repeat(3,[set('dx',-1),repeat(3,[
      iff(not(and(eq(V('dx'),0),eq(V('dy'),0))),[
        set('nr',add(V('r'),V('dy'))),set('nc',add(V('col'),V('dx'))),
        iff(eq(V('环绕'),1),[set('nr',mod(V('nr'),14)),set('nc',mod(V('nc'),20))]),
        iff(and(and(gt(V('nr'),-1),gt(14,V('nr'))),and(gt(V('nc'),-1),gt(20,V('nc')))),[
          iff(eq(L('cells',add(add(mul(V('nr'),20),V('nc')),1)),1),[change('邻居',1)])
        ])
      ]),change('dx',1)
    ]),change('dy',1)]),
    set('当前',L('cells',V('i'))),set('结果',0),
    iff(eq(V('当前'),0),[set('结果',bit(V('B'),V('邻居')))],[
      iff(eq(V('当前'),1),[
        iff(eq(bit(V('S'),V('邻居')),1),[set('结果',1)],[iff(gt(V('C'),2),[set('结果',2)])])
      ],[set('结果',mod(add(V('当前'),1),V('C')))])
    ]),push('next',V('结果')),change('i',1)
  ]),clear('cells'),set('i',1),repeat(N,[push('cells',L('next',V('i'))),change('i',1)]),change('代数',1)
],[850,20]);
c.define('载入图案',['种类'],[
  ...blank(),set('运行',0),set('代数',0),
  ...Object.values(shapes).map((shape,i)=>iff(eq(arg('种类'),i+1),shape.map(([x,y])=>replace('cells',(y+5)*20+x+8+1,1))))
],[1350,20]);
c.define('处理按钮',[],[
  iff(eq(V('视图'),0),[
    iff(eq(V('动作'),1),[set('运行',sub(1,V('运行'))),set('时刻',expr('sensing_timer'))]),
    iff(eq(V('动作'),2),[set('运行',0),c.call('下一代')]),
    iff(eq(V('动作'),3),[set('运行',0),set('代数',0),clear('cells'),repeat(N,[set('结果',0),iff(eq(expr('operator_random',{FROM:1,TO:4}),1),[set('结果',1)]),push('cells',V('结果'))])]),
    iff(eq(V('动作'),4),[
      set('运行',0),iff(gt(3,sub(expr('sensing_timer'),V('清空时刻'))),[...blank(),set('代数',0),set('清空时刻',-10)],[set('清空时刻',expr('sensing_timer'))])
    ],[set('清空时刻',-10)]),
    iff(eq(V('动作'),5),[set('运行',0),set('PB',V('B')),set('PS',V('S')),set('PC',V('C')),set('视图',1)]),
    iff(eq(V('动作'),6),[iff(eq(V('速度'),1),[set('速度',3)],[iff(eq(V('速度'),3),[set('速度',6)],[set('速度',1)])])]),
    iff(eq(V('动作'),7),[set('运行',0),set('环绕',sub(1,V('环绕'))),set('代数',0)]),
    iff(and(gt(V('动作'),10),gt(14,V('动作'))),[c.call('载入图案',sub(V('动作'),10))])
  ],[
    iff(and(gt(V('动作'),99),gt(109,V('动作'))),[set('j',sub(V('动作'),100)),iff(eq(bit(V('PS'),V('j')),1),[change('PS',mul(-1,L('weights',add(V('j'),1))))],[change('PS',L('weights',add(V('j'),1)))])]),
    iff(and(gt(V('动作'),109),gt(119,V('动作'))),[set('j',sub(V('动作'),110)),iff(eq(bit(V('PB'),V('j')),1),[change('PB',mul(-1,L('weights',add(V('j'),1))))],[change('PB',L('weights',add(V('j'),1)))])]),
    iff(and(gt(V('动作'),121),gt(129,V('动作'))),[set('PC',sub(V('动作'),120))]),
    ...[[201,8,12,2],[202,72,12,2],[203,4,0,2],[204,4,0,3]].map(([id,B,S,C])=>iff(eq(V('动作'),id),[set('PB',B),set('PS',S),set('PC',C)])),
    iff(eq(V('动作'),301),[
      set('B',V('PB')),set('S',V('PS')),set('C',V('PC')),set('i',1),repeat(N,[iff(not(gt(V('C'),L('cells',V('i')))),[replace('cells',V('i'),0)]),change('i',1)]),set('代数',0),set('视图',0)
    ]),iff(eq(V('动作'),302),[set('视图',0)])
  ])
],[1900,20]);
c.define('显示面板',[],[
  iff(eq(V('视图'),0),[cmd('looks_switchbackdropto',{BACKDROP:'棋盘'}),...['代数','活细胞','规则'].map(n=>cmd('data_showvariable',{}, {VARIABLE:[n,variableId(n)]}))],[cmd('looks_switchbackdropto',{BACKDROP:'规则设置'}),...['代数','活细胞','规则'].map(n=>cmd('data_hidevariable',{}, {VARIABLE:[n,variableId(n)]}))])
],[2500,20]);
const render=()=>[c.call('统计细胞'),c.call('更新规则文本'),c.call('显示面板'),broadcast('重绘')];
const mouseInside=and(and(gt(expr('sensing_mousex'),-112),gt(208,expr('sensing_mousex'))),and(gt(expr('sensing_mousey'),-128),gt(96,expr('sensing_mousey'))));
c.hat('event_whenflagclicked',{},[
  cmd('looks_hide'),set('忙碌',1),set('运行',0),set('视图',0),set('清空时刻',-10),set('拖画',0),set('上格',0),set('已建格子',0),
  iff(not(eq(length('cells'),N)),[c.call('载入图案',1)]),broadcast('建格子'),wait(0),...render(),set('忙碌',0),
  forever([
    iff(and(eq(V('忙碌'),0),eq(V('视图'),0)),[
      iff(and(gt(V('清空时刻'),-1),gt(sub(expr('sensing_timer'),V('清空时刻')),3)),[
        set('忙碌',1),set('清空时刻',-10),broadcast('重绘'),set('忙碌',0)
      ]),
      iff(expr('sensing_mousedown'),[
        iff(mouseInside,[
          set('格',add(add(math('floor',div(add(expr('sensing_mousex'),112),16)),mul(math('floor',div(sub(96,expr('sensing_mousey')),16)),20)),1)),
          iff(eq(V('拖画'),0),[set('笔值',1),iff(gt(L('cells',V('格')),0),[set('笔值',0)]),set('拖画',1)]),
          iff(not(eq(V('格'),V('上格'))),[
            set('忙碌',1),set('运行',0),set('代数',0),set('清空时刻',-10),replace('cells',V('格'),V('笔值')),set('上格',V('格')),...render(),set('忙碌',0)
          ])
        ])
      ],[set('拖画',0),set('上格',0)]),
      iff(and(eq(V('运行'),1),not(gt(div(1,V('速度')),sub(expr('sensing_timer'),V('时刻'))))),[
        set('忙碌',1),c.call('下一代'),...render(),set('时刻',expr('sensing_timer')),set('忙碌',0)
      ])
    ]),wait(.02)
  ])
],[20,1300]);
c.hat('event_whenbroadcastreceived',{BROADCAST_OPTION:['按钮','msg_按钮']},[c.call('处理按钮'),...render(),set('忙碌',0)],[600,1300]);
for(const [key,action] of [['space',1],['n',2]])c.hat('event_whenkeypressed',{KEY_OPTION:[key,null]},[iff(and(eq(V('忙碌'),0),eq(V('视图'),0)),[set('忙碌',1),set('动作',action),broadcast('按钮')])],[1000+action*300,1300]);

const zip=new JSZip(),date=new Date('2026-01-01T00:00:00Z');
function costume(name,s,cx,cy){const assetId=crypto.createHash('md5').update(s).digest('hex'),md5ext=assetId+'.svg';zip.file(md5ext,s,{date});return {name,assetId,md5ext,dataFormat:'svg',bitmapResolution:1,rotationCenterX:cx,rotationCenterY:cy};}
const base={variables:{},lists:{},broadcasts:{},blocks:{},comments:{},currentCostume:0,costumes:[],sounds:[],volume:100};
const sprite=(name,b,costumes,x,y,layerOrder,visible=true,variables={})=>({...base,isStage:false,name,blocks:b,costumes,x,y,layerOrder,visible,variables,size:100,direction:90,draggable:false,rotationStyle:"don't rotate"});
const stage={...base,isStage:true,name:'舞台',variables:Object.fromEntries(Object.entries(vars).map(([n,v])=>[variableId(n),[n,v]])),lists:{l_cells:['cells',pattern('滑翔机')],l_next:['next',[]],l_weights:['weights',Array.from({length:9},(_,i)=>2**i)]},broadcasts:Object.fromEntries(['按钮','建格子','重绘'].map(n=>['msg_'+n,n])),costumes:[costume('棋盘',boardArt,240,180),costume('规则设置',ruleArt,240,180)],layerOrder:0,tempo:60,videoTransparency:50,videoState:'off',textToSpeechLanguage:null};
const controller=sprite('生命引擎',c.blocks,[costume('隐藏',svg('<circle cx="1" cy="1" r="1" fill="white"/>',2,2),1,1)],0,0,1,false);
const cells=new ScratchBuilder('cell');
cells.hat('event_whenbroadcastreceived',{BROADCAST_OPTION:['建格子','msg_建格子']},[cmd('looks_hide'),set('格号',1),repeat(N,[goto(X(V('格号')),Y(V('格号'))),cmd('control_create_clone_of',{CLONE_OPTION:{primitive:[10,'_myself_']}}),change('格号',1)]),set('格号',0)],[20,20]);
cells.hat('control_start_as_clone',{},[cmd('looks_switchcostumeto',{COSTUME:add(L('cells',V('格号')),1)}),cmd('looks_show'),change('已建格子',1)],[400,20]);
cells.hat('event_whenbroadcastreceived',{BROADCAST_OPTION:['重绘','msg_重绘']},[iff(gt(V('格号'),0),[iff(eq(V('视图'),0),[cmd('looks_switchcostumeto',{COSTUME:add(L('cells',V('格号')),1)}),cmd('looks_show')],[cmd('looks_hide')])])],[20,350]);
const grid=sprite('细胞',cells.blocks,Array.from({length:8},(_,i)=>costume('状态'+i,cellArt(i),7,7)),0,0,2,false,{v_格号:['格号',0]});

const main=['运行','单步','随机','清空','规则','速度','边界'].map((label,i)=>({name:label,id:i+1,x:-184,y:88-i*34,w:92,h:29,view:0,labels:i===0?['运行','暂停']:i===3?['清空','再次确认']:i===5?['速度 1 / 秒','速度 3 / 秒','速度 6 / 秒']:i===6?['固定边界','环绕边界']:[label]}));
const patterns=Object.keys(shapes).map((label,i)=>({name:label,id:i+11,x:-57+i*103,y:-149,w:94,h:26,view:0,labels:[label]}));
const digits=['S','B'].flatMap((kind,k)=>Array.from({length:9},(_,i)=>({name:kind+i,id:100+k*10+i,x:-168+i*42,y:52-k*64,w:34,h:34,view:1,labels:[String(i),String(i)+'✓'],selected:bit(V(kind==='S'?'PS':'PB'),i)})));
const states=Array.from({length:7},(_,i)=>({name:'C'+(i+2),id:122+i,x:-126+i*42,y:-76,w:34,h:34,view:1,labels:[String(i+2),String(i+2)+'✓'],selected:eq(V('PC'),i+2)}));
const presets=['康威','HighLife','Seeds','Brian脑'].map((label,i)=>({name:label,id:201+i,x:-174+i*116,y:110,w:104,h:27,view:1,labels:[label]}));
export const definitions=[...main,...patterns,...digits,...states,...presets,{name:'应用',id:301,x:-77,y:-130,w:126,h:32,view:1,labels:['应用规则']},{name:'取消',id:302,x:77,y:-130,w:126,h:32,view:1,labels:['取消修改']}];
const buttons=definitions.map((def,i)=>{
  const b=new ScratchBuilder('btn'+i),show=eq(V('视图'),def.view);
  b.hat('event_whenthisspriteclicked',{},[iff(and(eq(V('忙碌'),0),show),[set('忙碌',1),set('动作',def.id),broadcast('按钮')])],[20,20]);
  const choice=def.id===1?add(V('运行'),1):def.id===4?add(1,not(gt(sub(expr('sensing_timer'),V('清空时刻')),3))):def.id===6?add(1,add(eq(V('速度'),3),mul(2,eq(V('速度'),6)))):def.id===7?add(V('环绕'),1):def.selected?add(def.selected,1):1;
  b.hat('event_whenbroadcastreceived',{BROADCAST_OPTION:['重绘','msg_重绘']},[iff(show,[cmd('looks_switchcostumeto',{COSTUME:choice}),cmd('looks_show')],[cmd('looks_hide')])],[20,300]);
  return sprite(def.name+'按钮',b.blocks,def.labels.map((s,j)=>costume(s,buttonArt(s,j>0,def.w,def.h),def.w/2,def.h/2)),def.x,def.y,i+3,def.view===0);
});
const monitor=(n,x)=>({id:variableId(n),mode:'default',opcode:'data_variable',params:{VARIABLE:n},spriteName:null,value:vars[n],width:0,height:0,x,y:50,visible:true,sliderMin:0,sliderMax:100,isDiscrete:true});
const project={targets:[stage,controller,grid,...buttons],monitors:[monitor('代数',10),monitor('规则',112),monitor('活细胞',356)],extensions:[],meta:{semver:'3.0.0',vm:'0.2.0',agent:'TurboWarp SBC Life Lab 0.1.0'}};
controller.comments.guide={blockId:null,x:20,y:-160,width:500,height:130,minimized:false,text:'S=存活，B=出生，C=总状态数。状态1才计邻居；2+是衰退态。双缓冲 cells/next 同步演化。280个显示克隆；鼠标轮询支持拖画。所有算法为原生积木，无自定义扩展。'};
export async function build(){zip.file('project.json',JSON.stringify(project),{date});const bytes=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});await fs.writeFile(path.join(root,'dist/life-lab.sb3'),bytes);await fs.writeFile(path.join(root,'dist/project.json'),JSON.stringify(project,null,2));const manifest={version:'0.1.0',bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),targets:project.targets.length,blocks:project.targets.reduce((n,t)=>n+Object.keys(t.blocks).length,0)};await fs.writeFile(path.join(root,'dist/manifest.json'),JSON.stringify(manifest,null,2));console.log(manifest);return bytes;}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build();
