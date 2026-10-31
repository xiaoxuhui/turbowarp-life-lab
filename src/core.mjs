export const W=20,H=14,N=W*H;
export const xy=i=>({x:-104+(i%W)*16,y:88-Math.floor(i/W)*16});
export const mask=s=>[...s].reduce((m,n)=>m|(1<<Number(n)),0);
export const ruleText=(B=8,S=12,C=2)=>`S${Array.from({length:9},(_,n)=>S&(1<<n)?n:'').join('')}/B${Array.from({length:9},(_,n)=>B&(1<<n)?n:'').join('')}/C${C}`;
export function nextState(state,count,B,S,C){
  if(state===0)return (B>>count)&1;
  if(state===1)return (S>>count)&1?1:C===2?0:2;
  return (state+1)%C;
}
export function step(board,{B=8,S=12,C=2,wrap=false}={}){
  return board.map((s,i)=>{
    const x=i%W,y=Math.floor(i/W);let count=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(dx===0&&dy===0)continue;let xx=x+dx,yy=y+dy;
      if(wrap){xx=(xx+W)%W;yy=(yy+H)%H;}
      if(xx>=0&&xx<W&&yy>=0&&yy<H&&board[yy*W+xx]===1)count++;
    }
    return nextState(s,count,B,S,C);
  });
}
export const shapes={滑翔机:[[1,0],[2,1],[0,2],[1,2],[2,2]],闪烁器:[[0,1],[1,1],[2,1]],蟾蜍:[[1,0],[2,0],[3,0],[0,1],[1,1],[2,1]]};
export function pattern(name,ox=8,oy=5){const b=Array(N).fill(0);for(const [x,y] of shapes[name])b[(y+oy)*W+x+ox]=1;return b;}
