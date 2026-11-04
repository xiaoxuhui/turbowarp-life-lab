(()=>{
 'use strict';
 const {id,kind,clones}=window.__hallConfig,vm=window.scaffolding.vm,key=id+'.state.v1';
 const fields=kind==='life'?['v_代数','v_活细胞','v_规则','v_B','v_S','v_C','v_PB','v_PS','v_PC','v_环绕','v_速度','l_cells']:['v_空白','v_初始','v_停机','v_初始纸带','v_当前状态','v_步数','v_读写头','v_左端','v_状态','v_结果','v_速度','v_初始编码','v_停机编码','v_状态编码','l_tape','l_RQ','l_RX','l_RN','l_RW','l_RD','l_KQ','l_KX','l_KN','l_规则表（下方按钮编辑）'];
 const clone=x=>JSON.parse(JSON.stringify(x)),stage=()=>vm.runtime.getTargetForStage(),scalar=x=>typeof x==='string'&&x.length<=1024||typeof x==='number'&&Number.isFinite(x)||typeof x==='boolean';
 const status=document.createElement('div');status.id='hall-status';status.setAttribute('role','status');status.textContent='正在恢复作品…';document.body.append(status);
 const restart=document.createElement('button');restart.id='hall-restart';restart.type='button';restart.textContent='备份坏档并重新开始';restart.hidden=true;status.after(restart);
 let ready=false,locked=false,last='',initial=null,booting=false;
 function read(){const vars=stage().variables;return Object.fromEntries(fields.map(k=>{if(!vars[k])throw Error('缺少字段 '+k);return [k,clone(vars[k].value)]}));}
 function validate(data){
  if(!data||data.schemaVersion!==1||data.id!==id||data.contract!==id+'-dynamic-v1'||!data.values||JSON.stringify(Object.keys(data.values).sort())!==JSON.stringify([...fields].sort()))throw Error('存档格式不匹配');
  const v=data.values;
  for(const k of fields){const x=v[k];if(k.startsWith('l_')){if(!Array.isArray(x)||x.length>8192||!x.every(scalar))throw Error('列表无效');}else if(!scalar(x))throw Error('数据无效');}
  if(kind==='life'){
   const C=Number(v.v_C),B=Number(v.v_B),S=Number(v.v_S);
   const digits=mask=>Array.from({length:9},(_,i)=>(mask&(1<<i))?String(i):'').join(''),pb=Number(v.v_PB),ps=Number(v.v_PS),pc=Number(v.v_PC);
   if(!Number.isInteger(C)||C<2||C>8||!Number.isInteger(B)||B<0||B>511||!Number.isInteger(S)||S<0||S>511||!Number.isInteger(pb)||pb<0||pb>511||!Number.isInteger(ps)||ps<0||ps>511||!Number.isInteger(pc)||pc<2||pc>8||v.v_规则!==`S${digits(S)}/B${digits(B)}/C${C}`||!Number.isSafeInteger(Number(v.v_代数))||Number(v.v_代数)<0||![0,1].includes(Number(v.v_环绕))||![1,3,6].includes(Number(v.v_速度))||v.l_cells.length!==280||v.l_cells.some(x=>!Number.isInteger(Number(x))||Number(x)<0||Number(x)>=C)||Number(v.v_活细胞)!==v.l_cells.filter(x=>Number(x)===1).length)throw Error('生命棋盘数据无效');
  }else{
   const rules=['l_RQ','l_RX','l_RN','l_RW','l_RD','l_KQ','l_KX','l_KN','l_规则表（下方按钮编辑）'].map(k=>v[k].length);
   const glyphs=[...Array.from({length:94},(_,i)=>String.fromCharCode(i+33)),'□','λ','ε'];
   const token=(s,max)=>typeof s==='string'&&s.length>0&&s.length<=max&&[...s].every(ch=>glyphs.includes(ch)&&![',',';','-','>'].includes(ch));
   const code=s=>'@'+[...s].map(ch=>String(102+glyphs.indexOf(ch))).join('');
   const left=Number(v.v_左端),head=Number(v.v_读写头),speed=Number(v.v_速度),result=Number(v.v_结果);
   if(!token(v.v_空白,1)||!token(v.v_初始,12)||!token(v.v_停机,12)||!token(v.v_当前状态,12)||typeof v.v_初始纸带!=='string'||v.v_初始纸带.length>128||[...v.v_初始纸带].some(ch=>!token(ch,1))||!v.l_tape.length||v.l_tape.length>8192||v.l_tape.some(x=>!token(x,1))||rules.some(n=>n!==rules[0])||rules[0]>64||!Number.isSafeInteger(Number(v.v_步数))||Number(v.v_步数)<0||!Number.isSafeInteger(left)||!Number.isSafeInteger(head)||head<left||head>=left+v.l_tape.length||!Number.isInteger(speed)||speed<1||speed>60||![0,1,2,3].includes(result)||(result===1)!==(v.v_当前状态===v.v_停机)||v.v_初始编码!==code(v.v_初始)||v.v_停机编码!==code(v.v_停机)||v.v_状态编码!==code(v.v_当前状态))throw Error('图灵机数据无效');
   for(let i=0;i<rules[0];i++){const q=v.l_RQ[i],x=v.l_RX[i],n=v.l_RN[i],w=v.l_RW[i],d=v.l_RD[i],line=`${q},${x}->${n},${w},${d}`;if(!token(q,12)||!token(x,1)||!token(n,12)||!token(w,1)||!['L','R','N'].includes(d)||v.l_KQ[i]!==code(q)||v.l_KX[i]!==code(x)||v.l_KN[i]!==code(n)||![line,'  '+line,'▶ '+line].includes(v['l_规则表（下方按钮编辑）'][i]))throw Error('图灵机规则无效');}
  }return data;
 }
 function idle(){const v=stage()?.variables;return v&&Number(v.v_忙碌.value)===0&&(kind!=='life'||Number(v.v_拖画.value)===0&&Number(v.v_视图.value)===0);}
 function save(){if(!ready||locked||!idle())return false;try{const data=validate({schemaVersion:1,id,contract:id+'-dynamic-v1',values:read()}),raw=JSON.stringify(data);if(raw!==last){localStorage.setItem(key,raw);last=raw;}status.textContent='进度保存在本机，重进后暂停';return true;}catch(e){status.textContent='暂时无法保存，请保留当前页面';return false;}}
 const start=window.scaffolding.start.bind(window.scaffolding);
 window.scaffolding.start=()=>{if(booting)return;booting=true;let saved=null;try{const raw=localStorage.getItem(key);if(raw!==null){if(raw.length>500000)throw Error('存档过大');saved=validate(JSON.parse(raw));}}catch(e){locked=true;restart.hidden=false;status.textContent='已有存档无法恢复，原数据已保留';}
  start();(async()=>{const deadline=performance.now()+30000;while((!idle()||Number(stage()?.variables?.v_已建格子?.value)!==clones)&&performance.now()<deadline)await new Promise(r=>setTimeout(r,50));if(!idle()||Number(stage().variables.v_已建格子.value)!==clones)throw Error('作品初始化超时');
   initial=validate({schemaVersion:1,id,contract:id+'-dynamic-v1',values:read()});if(saved&&!locked){for(const [k,value] of Object.entries(saved.values))stage().variables[k].value=clone(value);stage().variables.v_运行.value=0;stage().variables.v_忙碌.value=0;if(kind==='life'){stage().variables.v_视图.value=0;stage().variables.v_拖画.value=0;}else if(Number(stage().variables.v_结果.value)===0)stage().variables.v_状态.value='已恢复；当前暂停';vm.runtime.startHats('event_whenbroadcastreceived',{BROADCAST_OPTION:'重绘'});}
   ready=true;window.hall.ready=true;if(!locked)save();setInterval(save,500);
  })().catch(e=>{locked=true;status.textContent='作品恢复失败，原存档已保留';window.hall.error=String(e)});
 };
 restart.addEventListener('click',()=>{if(!ready||!initial||!window.confirm('保留原始坏档副本，并从初始作品重新开始？'))return;try{const raw=localStorage.getItem(key);if(raw!==null){let backup=id+'.recovery.'+Date.now(),n=0;while(localStorage.getItem(backup)!==null)backup=id+'.recovery.'+Date.now()+'.'+(++n);localStorage.setItem(backup,raw);}for(const [k,value] of Object.entries(initial.values))stage().variables[k].value=clone(value);stage().variables.v_运行.value=0;stage().variables.v_忙碌.value=0;if(kind==='life'){stage().variables.v_视图.value=0;stage().variables.v_拖画.value=0;}vm.runtime.startHats('event_whenbroadcastreceived',{BROADCAST_OPTION:'重绘'});locked=false;restart.hidden=true;last='';save();}catch(e){status.textContent='无法备份并恢复，原存档已保留';}});
 window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
 window.hall={ready:false,save,key,validate,read,get locked(){return locked}};
})();
