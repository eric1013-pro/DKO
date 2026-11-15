/* DKO 월드 모듈 (월드에 들어갈 때만 받아요) */
(function(){
const {BrickIc,C0,Coin,EQ_PRICE,EQ_S,EQ_SHIELD,EQ_T,EQ_TC,EQ_VAL,ICONS,Icon,PX_HEROES,PfpView,PixelChar,R,STICKER,StickerTray,VX_ISO,VoxelStage,WCF,W_BIG,W_CAT,W_CDECO,W_CR,W_DECO_MAX,W_EXP_COST,W_LAND_MAX,W_LM,W_LMS,W_LONG,W_LV_ROOF,W_MINE_CAP,W_MINE_RATE,W_OB,W_OB_TIME,W_PROTECT,W_SC,W_START,W_START_BRICKS,W_SW,W_SZ,W_TABS,W_TILE,W_WALK,ago,avatarOf,coinsOf,dayKey,dispName,dkoAsk,eqId,eqName,eqParse,haptic,heroAv,hh,html,isOnline,isSuperM,lmC,lmDoor,lsGet,lsSet,ownsHero,rpgEqLook,rpgNeed,rpgOf,rpgStats,rr,seed,useEffect,useMemo,useRef,useState,vxDraw,wBack,wBrick,wCells,wCube,wDrawChar,wEase,wFmtT,wHash,wLandCost,wName,wRad,wShade,wShadow,wSpeedCost,wStealCost,wStr,wSz}=window.__DKO;
/* 칸 크기가 커진 예전 섬: 겹치거나 땅 밖으로 나간 건물을 가장 가까운 빈 곳으로 옮겨요 */
function wFit(items,R,land){
  const ok=(x,y)=>Math.hypot(x,y)<=R-.15||(land&&land.has(x+','+y));
  const occ=new Set(); const pos=new Map(); let moved=false;
  const fits=(it,x,y)=>wCells(it,x,y).every(([a,b])=>ok(a,b)&&!occ.has(a+','+b));
  const order=[...items].sort((a,b)=>((b.t==='hall')-(a.t==='hall'))||((W_SZ[b.t]?1:0)-(W_SZ[a.t]?1:0)));
  for(const it of order){ let x=it.x, y=it.y;
    if(!fits(it,x,y)){ let best=null, bd=1e9; const r=Math.ceil(R)+2; for(let a=-r;a<=r;a++) for(let b=-r;b<=r;b++){ if(!fits(it,a,b)) continue; const d=Math.hypot(a-x,b-y); if(d<bd){ bd=d; best=[a,b]; } } if(best){ x=best[0]; y=best[1]; moved=true; } }
    wCells(it,x,y).forEach(([a,b])=>occ.add(a+','+b)); pos.set(it.i,x===it.x&&y===it.y?it:{...it,x,y}); }
  return {items:items.map(o=>pos.get(o.i)),moved};
}
/* 섬 문서 정리: 예전(v19) 데이터도 그대로 열려요 */
function wNorm(s){
  if(!s) return null;
  let items=(s.items||[]).map((it,k)=>({...it,i:it.i||('o'+k),lv:it.lv==null?1:it.lv}));
  let mig=false;
  if(!items.some(it=>it.t==='hall')){ items=items.filter(it=>!(it.x===0&&it.y===0)); items.unshift({i:'hall',t:'hall',x:-2,y:-2,lv:1}); mig=true; }
  if(!s.fv) items=items.map(it=>it.t==='hall'&&it.x===0&&it.y===0?{...it,x:-2,y:-2}:it);
  if(!items.some(it=>it.t==='mine')&&s.bricks==null){ const spot=[[2,-1],[-2,1],[1,2],[-1,-2]].find(([x,y])=>!items.some(it=>it.x===x&&it.y===y)); if(spot){ items.push({i:'mine0',t:'mine',x:spot[0],y:spot[1],lv:1,c:Date.now()}); mig=true; } }
  const land=Array.isArray(s.land)?s.land:[];
  const fit=wFit(items,wRad(s.exp||0),new Set(land.map(e=>e.k))); items=fit.items;
  const hall=items.find(it=>it.t==='hall');
  return {...s,items,land,exp:s.exp||0,bricks:s.bricks==null?W_START_BRICKS:s.bricks,cleared:s.cleared||[],clr:s.clr||null,hallLv:hall?hall.lv||1:1,_mig:mig||fit.moved||s.bricks==null||!s.fv};
}
const wBuilders=I=>1+I.items.filter(it=>it.t==='hut'&&it.lv>=1).length;
const wBusy=(I,now)=>I.items.filter(it=>it.up&&it.up.end>now).length;
const wCount=(I,t)=>I.items.filter(it=>it.t===t).length;
const wDecoCount=I=>I.items.filter(it=>{ const C=W_CAT[it.t]; return C&&(C.cat==='deco'||C.cat==='gem'); }).length;
const wMaxOf=(t,hl)=>{ const C=W_CAT[t]; if(!C) return 0; if(C.uniq) return 1; if(C.max) return C.max[Math.min(5,hl)]; if(C.max1) return hl>=(C.req||1)?C.max1:0; return hl>=(C.req||1)?99:0; };
const wMineStock=(it,now)=>{ if(it.t!=='mine'||it.lv<1) return 0; const lv=it.lv; const age=(now-(it.c||now))/3600000; return Math.min(W_MINE_CAP[lv],Math.floor(age*W_MINE_RATE[lv])); };
/* 장애물은 섬이 바뀔 때만 다시 계산해요 (매 프레임 X) */
const W_OBC=new Map();
function wObstacles(I,uid){ const k=uid+'|'+(I.exp||0)+'|'+(I.cleared||[]).length+'|'+I.items.map(it=>it.i+it.x+','+it.y+(it.r?'r':'')).join(';'); const h=W_OBC.get(uid); if(h&&h.k===k) return h.v; const v=wObstaclesRaw(I,uid); W_OBC.set(uid,{k,v}); return v; }
function wObstaclesRaw(I,uid){
  const R=wRad(I.exp); const seed=wStr(uid); const out=[]; const occ=new Set(); I.items.forEach(it=>wCells(it).forEach(([a,b])=>occ.add(a+','+b))); const cl=new Set(I.cleared||[]);
  const r=Math.ceil(R);
  for(let x=-r;x<=r;x++) for(let y=-r;y<=r;y++){
    const d=Math.hypot(x,y); if(d<3||d>R-.7) continue; const k=x+','+y; if(occ.has(k)||cl.has(k)) continue;
    const h=wHash(x+seed,y-seed,11); if(h<.8) continue;
    const t=h>.96?'ob_rock':h>.91?'ob_tree':h>.85?'ob_stump':'ob_weed'; out.push({k,x,y,t});
  }
  return out;
}

/* 세계 만들기: 섬 목록 → 타일 지도 */
function buildWorld(isl){
  const T=new Map(); const key=(x,y)=>x+','+y;
  const put=(x,y,o)=>{ const k=key(x,y); const cur=T.get(k); if(cur&&cur.t!=='bridge'&&o.t==='bridge') return; T.set(k,{x,y,...o}); };
  const rivX=y=>1.5*Math.sin(y*0.3)+1.2;
  for(let x=-14;x<=14;x++) for(let y=-14;y<=14;y++){
    const d=Math.sqrt(x*x+y*y*1.08)+(wHash(x,y,7)-.5)*1.1;
    if(d>=W_CR) continue;
    const inRiver=Math.abs(x-rivX(y))<1.05&&d<W_CR-.5;
    const bridge=inRiver&&(y===-10||y===-5||y===0||y===5||y===10);
    if(inRiver&&!bridge) continue;
    const plaza=Math.hypot(x+7,y)<3.3;
    put(x,y,{t:bridge?'bridge':d>W_CR-1.1?'sand':plaza?'stone':'grass',isl:'center'});
  }
  /* v26.4 길: 광장에서 명소 문 앞까지 돌길을 깔아요 (다리로만 강을 건너요) */
  { const bl=new Set(); W_LM.forEach(l=>{ for(let i=0;i<3;i++) for(let j=0;j<3;j++) bl.add(key(l.x+i,l.y+j)); });
    const PATH=new Set(); const goal=key(-7,0);
    W_LM.forEach(l=>{ const [dx,dy]=lmDoor(l); const s0=key(dx,dy); if(!T.has(s0)) return; const prev=new Map([[s0,null]]); const q=[[dx,dy]]; let h=0, hit=null;
      while(h<q.length&&h<4000){ const [x,y]=q[h++]; const k=key(x,y); if(k===goal||(PATH.has(k)&&k!==s0)){ hit=k; break; }
        for(const [ax,ay] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+ax, ny=y+ay, kk=key(nx,ny); if(prev.has(kk)||bl.has(kk)) continue; const t0=T.get(kk); if(!t0) continue; prev.set(kk,k); q.push([nx,ny]); } }
      let cur=hit; while(cur){ PATH.add(cur); cur=prev.get(cur); } });
    PATH.forEach(k=>{ const t0=T.get(k); if(t0&&(t0.t==='grass'||t0.t==='sand')) t0.t='path'; }); }
  const L=[]; const n=isl.length;
  const cnt0=Math.min(12,Math.max(n,6)); const R0=Math.max(35,cnt0*3.6); const R1=R0+22;
  isl.forEach((s,i)=>{
    const ring=i<12?0:1; const k=ring?i-12:i; const cnt=ring?Math.max(1,n-12):cnt0;
    const a=-Math.PI*0.75+k*(2*Math.PI/cnt)+(ring?Math.PI/cnt:0); const R=ring?R1:R0; const ir=wRad(s.exp);
    const cx=Math.round(Math.cos(a)*R), cy=Math.round(Math.sin(a)*R);
    L.push({...s,cx,cy,r:ir});
    const rr=Math.ceil(ir)+1;
    for(let x=-rr;x<=rr;x++) for(let y=-rr;y<=rr;y++){
      const d=Math.hypot(x,y)+(wHash(cx+x,cy+y,3)-.5)*.9; if(d>=ir+.4) continue;
      put(cx+x,cy+y,{t:d>ir-.6?'sand':'grass',isl:s.uid,d:Math.hypot(x,y)});
    }
    const len=Math.hypot(cx,cy); const ux=cx/len,uy=cy/len;
    const sx=(ring?R0*ux:(W_CR-.8)*ux), sy=(ring?R0*uy:(W_CR-.8)*uy); const ex=cx-ux*(ir-.5), ey=cy-uy*(ir-.5);
    const steps=Math.ceil(Math.hypot(ex-sx,ey-sy)*3);
    let lx=null,ly=null; for(let j=0;j<=steps;j++){ const px=Math.round(sx+(ex-sx)*j/steps), py=Math.round(sy+(ey-sy)*j/steps); if(lx!==null&&px!==lx&&py!==ly&&!T.has(key(px,ly))) put(px,ly,{t:'bridge',isl:null}); if(!T.has(key(px,py))) put(px,py,{t:'bridge',isl:null}); lx=px; ly=py; }
  });
  /* 산 땅: 먼저 산 순서대로 덮어써요 (가운데 섬 · 다른 섬 본부 근처는 무시) */
  const C=[]; L.forEach(l=>(l.land||[]).forEach(e=>{ const [dx,dy]=String(e.k).split(',').map(Number); if(isFinite(dx)&&isFinite(dy)) C.push({gx:l.cx+dx,gy:l.cy+dy,uid:l.uid,at:e.at||0}); }));
  C.sort((a,b)=>a.at-b.at).forEach(e=>{ if(Math.hypot(e.gx,e.gy)<W_CR+1.5) return; const cur=T.get(key(e.gx,e.gy)); if(cur&&cur.isl==='center') return;
    if(cur&&cur.isl&&cur.isl!==e.uid){ const o=L.find(l=>l.uid===cur.isl); if(o&&Math.hypot(e.gx-o.cx+.5,e.gy-o.cy+.5)<W_PROTECT) return; }
    T.set(key(e.gx,e.gy),{x:e.gx,y:e.gy,t:'grass',isl:e.uid,d:99,land:1}); });
  /* v26.8 막힌 길 고치기: 광장에서 못 가는 섬 · 명소 문이 있으면 가장 짧은 물길에 다리를 놓아요 (대각선 틈도 메워요) */
  { const st=key(-7,0); const reach=new Set(); const flood=from=>{ const q=[from]; reach.add(from); for(let h=0;h<q.length;h++){ const [x,y]=q[h].split(',').map(Number); for(const [ax,ay] of [[1,0],[-1,0],[0,1],[0,-1]]){ const kk=key(x+ax,y+ay); if(reach.has(kk)||!T.has(kk)) continue; reach.add(kk); q.push(kk); } } };
    if(T.has(st)) flood(st);
    const goals=[...L.map(l=>[l.cx,l.cy]),...W_LM.map(l=>lmDoor(l))];
    let B=0; T.forEach(t=>{ B=Math.max(B,Math.abs(t.x),Math.abs(t.y)); }); B+=3;
    goals.forEach(([gx,gy])=>{ const g0=key(gx,gy); if(!T.has(g0)||reach.has(g0)) return;
      const prev=new Map([[g0,null]]); const dq=[[gx,gy]]; let hit=null;
      while(dq.length){ const [x,y]=dq.shift(); const k0=key(x,y); if(reach.has(k0)){ hit=k0; break; }
        for(const [ax,ay] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+ax, ny=y+ay; if(Math.abs(nx)>B||Math.abs(ny)>B) continue; const kk=key(nx,ny); if(prev.has(kk)) continue; prev.set(kk,k0); if(T.has(kk)) dq.unshift([nx,ny]); else dq.push([nx,ny]); } }
      let cur=hit; while(cur){ if(!T.has(cur)){ const [x,y]=cur.split(',').map(Number); T.set(cur,{x,y,t:'bridge',isl:null}); } cur=prev.get(cur); }
      flood(st); }); }
  return {T,L,key};
}
function wNightK(){ if(window.__wDay) return 0; const t=Date.now(); if(wNightK.t&&t-wNightK.t<5000) return wNightK.v; const d=new Date(); const hr=d.getHours()+d.getMinutes()/60; wNightK.t=t; wNightK.v=hr>=19.5||hr<5.5?1:hr>=18.5?(hr-18.5):hr<6.5?(6.5-hr):0; return wNightK.v; }
function wDuskK(){ const d=new Date(); const hr=d.getHours()+d.getMinutes()/60; return hr>=16.5&&hr<19.5?Math.sin((hr-16.5)/3*Math.PI):0; }
try{ window.__wDay=localStorage.getItem('dko-wday')==='day'; }catch(e){}

/* ── 아이템 그리기: (ox,oy)=타일 위 가운데, u=복셀 한 칸 ── */
function wDrawItem(g,t,ox,oy,u,tm,seed,lv){
  lv=lv||1; const C=(...a)=>wCube(g,ox,oy,u,...a);
  const v=wHash(seed||0,7,1); const roof=W_LV_ROOF[lv]||W_LV_ROOF[1];
  switch(t){
    case 'tree': wShadow(g,ox,oy+u*1.2,u*7,u*3.4); C(-1,-1,0,2,2,6,'#8A5A34'); C(-4,-4,5,8,8,5,v>.5?'#4FB86A':'#3FA65C'); C(-3,-3,10,6,6,3,v>.5?'#6ED487':'#59C377'); break;
    case 'pine': wShadow(g,ox,oy+u*1.2,u*5.5,u*2.8); C(-1,-1,0,2,2,4,'#7A4E2C'); C(-4,-4,3,8,8,3,'#2F8F5B'); C(-3,-3,6,6,6,3,'#37A066'); C(-2,-2,9,4,4,3,'#43B676'); C(-1,-1,12,2,2,2,'#58C98A'); break;
    case 'bush': wShadow(g,ox,oy+u,u*5,u*2.5); C(-3,-3,0,6,6,3,'#4CAF62'); C(-2,-1,3,4,3,1.5,'#66C97D'); break;
    case 'flower': { const cols=['#FF6B8A','#FFD166','#FF9A4D','#B98CFF','#7CC8FF']; for(let i=0;i<5;i++){ const a=wHash(seed,i,2), b=wHash(seed,i,5); const fx=-3+a*5, fy=-3+b*5; C(fx,fy,0,.6,.6,1.6,'#3E9A52'); C(fx-.4,fy-.4,1.6,1.4,1.4,1.2,cols[(i+Math.floor(v*5))%5]); } break; }
    case 'rock': wShadow(g,ox,oy+u,u*5,u*2.4); C(-3,-2,0,5,4,3,'#9AA3AE'); C(-1,-3,0,3,3,4,'#B5BDC6'); break;
    case 'mush': wShadow(g,ox,oy+u,u*4,u*2); C(-.7,-.7,0,1.4,1.4,3,'#F4EADC'); C(-2.5,-2.5,3,5,5,1.6,'#E5383B'); C(-1,-2,4.6,1,1,.4,'#FFFFFF'); C(1,0,4.6,1,1,.4,'#FFFFFF'); break;
    case 'house': { const k=1+(lv-1)*.08; wShadow(g,ox,oy+u*2,u*10*k,u*5*k); C(-5,-4,0,10,8,7,'#F2E3C6');
      if(lv>=2){ C(-4.4,-3.4,7,8.8,6.8,4,'#EADBBE'); C(-2,3.4,8.2,2.2,.3,1.8,'#8ED6FF',{l:'#BDEBFF',r:'#6CB8E6',t:'#8ED6FF'}); }
      const rz=lv>=2?11:7; C(-6,-5,rz,12,10,1.2,wShade(roof,-0.1)); C(-5,-4,rz+1.2,10,8,1.2,roof); C(-4,-3,rz+2.4,8,6,1.2,wShade(roof,.1)); C(-2.5,-1.5,rz+3.6,5,3,1.2,wShade(roof,.2));
      C(5,-1,0,.3,2.2,4,'#6A4024'); C(-2,4,2.5,2.4,.3,2.2,'#8ED6FF',{l:'#BDEBFF',r:'#6CB8E6',t:'#8ED6FF'});
      if(lv>=3){ C(2,-3,rz+2.4,1.4,1.4,4,'#9AA3AE'); const ph=(tm*.7+v)%1; g.fillStyle='rgba(230,236,244,'+(1-ph)*.7+')'; const p=[ox+(2.7+1.7)*u*1,oy-(rz+6.4+ph*5)*u]; g.beginPath(); g.arc(p[0]-u*2+ph*u*3,p[1]+u*2,u*(1+ph*1.6),0,Math.PI*2); g.fill(); }
      break; }
    case 'tent': wShadow(g,ox,oy+u*1.5,u*7,u*3.4); C(-4,-3,0,8,6,2,'#FF7A2E'); C(-3.4,-2.6,2,6.8,5.2,2,'#FF8F4D'); C(-2.6,-2,4,5.2,4,1.6,'#FFA36B'); C(-1.6,-1.4,5.6,3.2,2.8,1.2,'#FFB98A'); C(4,-1,0,.3,2,3,'#7A2400'); break;
    case 'tower': { const hh=10+lv*2; wShadow(g,ox,oy+u*1.5,u*6,u*3); C(-2.5,-2.5,0,5,5,hh,'#A9876A'); C(-2.6,-2.6,hh*.35,5.2,5.2,.6,'#8A6A50'); C(-3.5,-3.5,hh,7,7,1.5,'#8A5A34'); C(-3,-3,hh+1.5,6,6,2,roof); C(-1.5,-1.5,hh+3.5,3,3,1.6,wShade(roof,.15)); C(.5,-3,hh+4,.3,.3,4,'#4A3020'); const wv=Math.sin(tm*4+seed)*.5; C(.8,-3,hh+6+wv*.2,.2,2.4,1.6,'#FF5A1A',{l:'#FF7A2E',r:'#E04A0A',t:'#FF8F4D'}); break; }
    case 'shop': { wShadow(g,ox,oy+u*2,u*9,u*4.5); C(-4,-4,0,8,8,6,'#FFF4E6'); C(-4.6,-4.6,6,9.2,9.2,1,lv>=2?roof:'#2F7FE0'); if(lv>=3) C(-3,-3,7,6,6,2.4,'#FFF4E6'), C(-3.4,-3.4,9.4,6.8,6.8,.8,roof);
      for(let i=0;i<4;i++) C(4,-4+i*2,3.4,1.6,1,.6,i%2?'#FFFFFF':'#FF5A1A'); C(4,-2,0,.3,2.6,3,'#5A3A20'); C(-1.5,4,1.5,3,.3,2.4,'#BDEBFF',{l:'#DDF4FF',r:'#8FCDEE',t:'#BDEBFF'}); break; }
    case 'lamp': { C(-.4,-.4,0,.8,.8,8,'#3A3F4A'); C(-1.2,-1.2,8,2.4,2.4,1.6,'#FFD27A',{t:'#FFF0C2',l:'#FFD27A',r:'#F0B04A'}); g.fillStyle='rgba(255,210,122,.16)'; g.beginPath(); g.arc(ox,oy-u*9,u*6+Math.sin(tm*2+seed)*u*.6,0,Math.PI*2); g.fill(); break; }
    case 'bench': wShadow(g,ox,oy+u,u*5,u*2); C(-3,-1,0,.6,2,2,'#5A3A20'); C(2.4,-1,0,.6,2,2,'#5A3A20'); C(-3.2,-1.2,2,6.4,2.4,.6,'#B07A4A'); C(-3.2,-1.6,2.6,6.4,.5,2,'#9A6638'); break;
    case 'fence': for(let i=0;i<3;i++) C(-3+i*2.6,-.3,0,.6,.6,3.2,'#D9B98A'); C(-3,-.2,1.2,6,.4,.5,'#C9A574'); C(-3,-.2,2.4,6,.4,.5,'#C9A574'); break;
    case 'fountain': { wShadow(g,ox,oy+u*1.5,u*8,u*4); C(-4,-4,0,8,8,1.6,'#B5BDC6'); C(-3,-3,1.6,6,6,.2,'#4AA8F2',{t:'#7CC8FF'}); C(-.7,-.7,1.6,1.4,1.4,4,'#CDD4DC'); C(-1.6,-1.6,5.6,3.2,3.2,.8,'#B5BDC6');
      for(let i=0;i<6;i++){ const ph=(tm*1.6+i/6)%1; const a=i*Math.PI/3; const px=Math.cos(a)*ph*2.6, py=Math.sin(a)*ph*2.6, pz=6.4+Math.sin(ph*Math.PI)*3; const p=[ox+(px-py)*u,oy+(px+py)*u*.5-pz*u]; g.fillStyle='rgba(180,230,255,'+(1-ph)+')'; g.fillRect(p[0]-u*.4,p[1]-u*.4,u*.8,u*.8); } break; }
    case 'crystal': { wShadow(g,ox,oy+u*1,u*5,u*2.4); C(-2.6,-2.6,0,5.2,5.2,1.2,'#3A3F5C'); const fy=Math.sin(tm*2+seed)*.6; const P2=(a,b,c2)=>[ox+(a-b)*u,oy+(a+b)*u*.5-c2*u];
      const top=P2(0,0,13+fy), mid=[P2(-2.4,0,7+fy),P2(0,2.4,7+fy),P2(2.4,0,7+fy)], bot=P2(0,0,2.4+fy);
      g.save(); g.shadowColor='#C77DFF'; g.shadowBlur=u*4;
      const fc=(a,b,c2,col)=>{ g.fillStyle=col; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c2); g.closePath(); g.fill(); };
      fc(top,mid[0],mid[1],'#D9B8FF'); fc(top,mid[1],mid[2],'#9D6BFF'); fc(bot,mid[0],mid[1],'#8A4FE8'); fc(bot,mid[1],mid[2],'#5E2FC0'); g.restore();
      g.fillStyle='rgba(255,255,255,.75)'; g.beginPath(); g.moveTo(...top); g.lineTo(...P2(-.8,.4,9.5+fy)); g.lineTo(...P2(-.3,.8,10+fy)); g.closePath(); g.fill();
      for(let i=0;i<4;i++){ const a=tm*1.4+i*1.57; const p=P2(Math.cos(a)*3.4,Math.sin(a)*3.4,8+Math.sin(a*2)*2); g.fillStyle='rgba(230,200,255,'+(.5+.4*Math.sin(a*3))+')'; g.fillRect(p[0]-u*.4,p[1]-u*.4,u*.8,u*.8); } break; }
    case 'statue': case 'gold': { const gd=t==='gold'; wShadow(g,ox,oy+u*1.5,u*6,u*3); C(-3,-3,0,6,6,2.4,gd?'#3A2E1A':'#2A2A31'); C(-2.2,-1.2,2.4,4.4,2.4,7,gd?'#F2B33D':'#FF5A1A',gd?{t:'#FFE08A',l:'#F5C24F',r:'#C98A1A'}:{t:'#FF8F4D',l:'#FF6A24',r:'#C93800'});
      g.save(); g.fillStyle=gd?'#7A4E00':'#fff'; g.font='italic 900 '+Math.max(6,u*2.2)+'px Koverwatch,sans-serif'; g.textAlign='center'; g.translate(ox-u*.6,oy-u*4.6); g.transform(1,.5,0,1,0,0); g.fillText('DKO',0,0); g.restore();
      if(gd){ for(let i=0;i<3;i++){ const ph=(tm*.8+i/3)%1; g.fillStyle='rgba(255,240,180,'+Math.sin(ph*Math.PI)+')'; const sx=ox+(wHash(i,seed,4)-.5)*u*8, sy=oy-u*(4+ph*8); g.fillRect(sx-u*.4,sy-u*1.2,u*.8,u*2.4); g.fillRect(sx-u*1.2,sy-u*.4,u*2.4,u*.8); } }
      break; }
    case 'fire': { wShadow(g,ox,oy+u*.6,u*4,u*2); C(-2.4,-.5,0,4.8,1,1,'#6A4024'); C(-.5,-2.4,0,1,4.8,1,'#7A4E2C');
      for(let i=0;i<5;i++){ const ph=(tm*1.8+i/5)%1; const p=[ox+(wHash(i,1,9)-.5)*u*2,oy-u*(1.5+ph*5)]; g.fillStyle=ph<.4?'rgba(255,230,140,'+(1-ph)+')':'rgba(255,110,40,'+(1-ph)+')'; const s=u*(1.6-ph); g.fillRect(p[0]-s/2,p[1]-s/2,s,s); } break; }
    case 'crate': wShadow(g,ox,oy+u,u*4,u*2); C(-2,-2,0,4,4,4,'#C9965A'); C(-2,-2,0,4,4,.4,'#8A5A34'); C(-2,-2,3.6,4,4,.4,'#8A5A34'); break;
    case 'barrel': wShadow(g,ox,oy+u,u*3.6,u*1.8); C(-1.6,-1.6,0,3.2,3.2,4.4,'#9A6638'); C(-1.7,-1.7,1,3.4,3.4,.5,'#4A4F5A'); C(-1.7,-1.7,3.2,3.4,3.4,.5,'#4A4F5A'); break;
    case 'flag': { C(-.3,-.3,0,.6,.6,10,'#E6ECF4'); const wv=Math.sin(tm*4+seed); C(.3,-.3,7+wv*.15,.2,4,3,'#FF5A1A',{l:'#FF7A2E',r:'#E04A0A',t:'#FF8F4D'}); break; }
    case 'sakura': { wShadow(g,ox,oy+u*1.2,u*7,u*3.4); C(-1,-1,0,2,2,6,'#7A4A3A'); C(-4,-4,5,8,8,4.4,'#FFB3C7'); C(-3,-3,9.4,6,6,2.6,'#FFCFDC'); C(-2,-4.6,6,3,1,2,'#FF9AB4');
      for(let i=0;i<5;i++){ const ph=(tm*.35+i/5+v)%1; const px=ox+(wHash(i,seed,6)-.5)*u*12+Math.sin(ph*9+i)*u*1.5, py=oy-u*(11-ph*11); g.fillStyle='rgba(255,170,195,'+(1-ph*.6)+')'; g.fillRect(px,py,u*.9,u*.6); } break; }
    case 'neon': { C(-4,-.5,0,1,1,9,'#2A2A31'); C(3,-.5,0,1,1,9,'#2A2A31'); C(-4,-.5,9,8,1,1,'#2A2A31'); const fl=.7+.3*Math.sin(tm*6+seed); const nc='rgba(255,90,180,'+fl+')';
      g.save(); g.shadowColor='#FF5AB4'; g.shadowBlur=u*3; C(-3.4,.5,1,.4,.2,8,'#FF5AB4',{l:nc,r:nc,t:nc}); C(3.2,.5,1,.4,.2,8,'#FF5AB4',{l:nc,r:nc,t:nc}); C(-3.4,.5,8.6,7,.2,.4,'#5AE0FF',{l:'#5AE0FF',r:'#5AE0FF',t:'#5AE0FF'}); g.restore(); break; }
    case 'arcade': { wShadow(g,ox,oy+u,u*4,u*2); C(-2,-2,0,4,4,7,'#3A2A6A'); C(-2.1,-2.1,7,4.2,4.2,1.4,'#FF5A1A'); const sc=['#5AE0FF','#FF5AB4','#8CFF7A'][Math.floor(tm*3+seed)%3]; C(-1.4,2,3.6,2.8,.15,2.6,sc,{l:sc,r:sc,t:sc}); C(-1.4,2,2.4,2.8,1,.6,'#2A1E4A'); C(-.6,2.6,3,.4,.4,.8,'#FF3B3B'); break; }
    case 'payload': { wShadow(g,ox,oy+u*1.2,u*7,u*3.2); const b=Math.sin(tm*2+seed)*.15; C(-4,-2.5,1,8,5,3,'#C8CDD6'); C(-3.6,-2.1,4,7.2,4.2,1,'#FF5A1A'); C(-1.5,-1.5,5,3,3,2.4+b,'#5AE0FF',{t:'#BDF4FF',l:'#7FE8FF',r:'#3BB8D8'});
      [[-3,-3],[2,-3],[-3,2.4],[2,2.4]].forEach(([x,y])=>C(x,y,0,1.2,.6,1.4,'#2A2A31')); break; }
    case 'balloon': { const fy=Math.sin(tm*1.2+seed)*1.2; wShadow(g,ox,oy+u,u*4,u*2,.14); C(-1.5,-1.5,6+fy,3,3,2,'#8A5A34'); for(let i=0;i<4;i++) C(-1.4+(i%2)*2.6,-1.4+Math.floor(i/2)*2.6,8+fy,.2,.2,3,'#5A3A20');
      C(-4,-4,11+fy,8,8,7,'#FF5A1A'); C(-3,-3,18+fy,6,6,1.6,'#FF8F4D'); C(-4.1,-.6,12+fy,8.2,1.2,5,'#FFFFFF'); C(-.6,-4.1,12+fy,1.2,8.2,5,'#FFD166'); break; }
    case 'lantern': { C(-.3,-.3,0,.6,.6,5,'#5A3A20'); const gl=.75+.25*Math.sin(tm*3+seed); C(-1.4,-1.4,5,2.8,2.8,3.2,'#FF7A5A',{t:'#FFB08A',l:'rgba(255,140,100,'+gl+')',r:'rgba(230,90,60,'+gl+')'}); C(-1.6,-1.6,8.2,3.2,3.2,.5,'#3A2A20'); g.fillStyle='rgba(255,170,110,.14)'; g.beginPath(); g.arc(ox,oy-u*6.6,u*4.5,0,Math.PI*2); g.fill(); break; }
    case 'pumpkin': { wShadow(g,ox,oy+u,u*4.6,u*2.2); C(-2.4,-2.4,0,4.8,4.8,3.6,'#FF8A1A',{t:'#FFA94D',l:'#F57C10',r:'#D9650A'}); C(-.4,-.4,3.6,.8,.8,1.2,'#3E8A3A'); const bl=Math.sin(tm*5+seed)>-.6?'#FFE27A':'#FFB020'; C(-1.6,2.4,1.6,.8,.12,.8,bl,{l:bl,r:bl,t:bl}); C(.6,2.4,1.6,.8,.12,.8,bl,{l:bl,r:bl,t:bl}); C(-1.2,2.4,.6,2.4,.12,.5,bl,{l:bl,r:bl,t:bl}); break; }
    case 'snowman': { wShadow(g,ox,oy+u,u*4.4,u*2.2); C(-2.2,-2.2,0,4.4,4.4,3.6,'#F4F8FF',{t:'#FFFFFF',l:'#E6EEF8',r:'#CFDBEA'}); C(-1.6,-1.6,3.6,3.2,3.2,2.8,'#F4F8FF',{t:'#FFFFFF',l:'#E6EEF8',r:'#CFDBEA'}); C(-1.7,-1.7,5.6,3.4,3.4,.5,'#E5383B'); C(-.2,1.6,4.6,.5,1.4,.4,'#FF8A1A'); C(-1.2,-1.2,6.4,2.4,2.4,1.6,'#2A2A31'); C(-1.6,-1.6,6.4,3.2,3.2,.3,'#2A2A31'); break; }
    case 'mailbox': { C(-.3,-.3,0,.6,.6,3.4,'#3A3F4A'); C(-1.4,-1.8,3.4,2.8,3.6,2.4,'#E5383B',{t:'#FF6B6B',l:'#E5383B',r:'#B8242A'}); C(-1.3,-1.7,5.8,2.6,3.4,.4,'#C82D33'); if(Math.sin(tm*.8+seed)>.3) C(-.6,1.8,4.4,1.2,.15,.8,'#FFFFFF',{l:'#fff',r:'#E6ECF4',t:'#fff'}); C(1.4,-1.2,4.8,.2,.2,1.6,'#FFD166'); break; }
    case 'windmill': { wShadow(g,ox,oy+u*1.4,u*6,u*3); C(-2.4,-2.4,0,4.8,4.8,8,'#F2E3C6'); C(-2.8,-2.8,8,5.6,5.6,1,'#B5523A'); C(-2,-2,9,4,4,1,'#C9653F'); C(-.6,2.4,2.6,1.2,.2,2,'#6A4024');
      { const hx=ox+u*.2, hy=oy-u*7.4+u*1.4; const a0=tm*1.6+seed; g.save(); g.translate(hx,hy); for(let i=0;i<4;i++){ const a=a0+i*Math.PI/2; g.save(); g.rotate(a); g.fillStyle=i%2?'#FFFFFF':'#E6ECF4'; g.fillRect(-u*.5,0,u*1,u*6); g.fillStyle='rgba(0,0,0,.12)'; g.fillRect(-u*.5,u*5.4,u*1,u*.6); g.restore(); } g.fillStyle='#5A3A20'; g.beginPath(); g.arc(0,0,u*.8,0,Math.PI*2); g.fill(); g.restore(); } break; }
    case 'gacha': { wShadow(g,ox,oy+u,u*4.4,u*2.2); C(-2,-2,0,4,4,3.6,'#E5383B',{t:'#FF6B6B',l:'#E5383B',r:'#B8242A'}); C(-1.9,-1.9,3.6,3.8,3.8,3.6,'#CFEFFF',{t:'rgba(220,245,255,.9)',l:'rgba(190,232,255,.75)',r:'rgba(150,210,240,.75)'}); 
      for(let i=0;i<5;i++){ const cc=['#FFD166','#FF5AB4','#5AE0FF','#8CFF7A','#B98CFF'][i]; const bx=-1.2+(i%3)*1.1, by=-1.2+Math.floor(i/3)*1.4; C(bx,by,3.8+(i%2)*.8,.9,.9,.9,cc); }
      C(-2.1,-2.1,7.2,4.2,4.2,.6,'#E5383B'); C(-.5,2,1.4,1,.2,1,'#FFD166'); break; }
    case 'xtree': { wShadow(g,ox,oy+u*1.2,u*6,u*3); C(-.8,-.8,0,1.6,1.6,2,'#7A4E2C'); C(-4,-4,2,8,8,3,'#1F7A45'); C(-3,-3,5,6,6,3,'#26904F'); C(-2,-2,8,4,4,3,'#2EA65B'); C(-1,-1,11,2,2,2,'#38BA68'); C(-.6,-.6,13,1.2,1.2,1.2,'#FFD166',{t:'#FFF0B0',l:'#FFD166',r:'#E0A81A'});
      for(let i=0;i<10;i++){ const on=Math.floor(tm*2.5+i)%2===0; const a=i*2.3+seed, r=1.5+(i%4)*.7, z=3+i*.95; const px=Math.cos(a)*r, py=Math.sin(a)*r; const p=[ox+(px-py)*u,oy+(px+py)*u*.5-z*u]; g.fillStyle=on?['#FF5A5A','#FFD166','#5AE0FF','#FF8AE0'][i%4]:'rgba(255,255,255,.25)'; g.beginPath(); g.arc(p[0],p[1],u*.42,0,Math.PI*2); g.fill(); } break; }
    case 'lighthouse': { wShadow(g,ox,oy+u*1.4,u*5.6,u*2.8); for(let i=0;i<4;i++) C(-2+i*.15,-2+i*.15,i*3,4-i*.3,4-i*.3,3,i%2?'#E5383B':'#FFFFFF',i%2?{t:'#FF6B6B',l:'#E5383B',r:'#B8242A'}:{t:'#fff',l:'#F4F6FA',r:'#D5DCE6'}); C(-1.6,-1.6,12,3.2,3.2,2,'#FFE9A8',{t:'#FFF6D0',l:'#FFE9A8',r:'#F2C94C'}); C(-2,-2,14,4,4,.8,'#2A2A31');
      { const a=tm*1.2+seed; const cx=ox, cy=oy-u*13; const L=u*22; g.save(); const gr=g.createLinearGradient(cx,cy,cx+Math.cos(a)*L,cy+Math.sin(a)*L*.5); gr.addColorStop(0,'rgba(255,240,180,.45)'); gr.addColorStop(1,'rgba(255,240,180,0)'); g.fillStyle=gr; g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx+Math.cos(a-.18)*L,cy+Math.sin(a-.18)*L*.5); g.lineTo(cx+Math.cos(a+.18)*L,cy+Math.sin(a+.18)*L*.5); g.closePath(); g.fill(); g.restore(); } break; }
    case 'portal': { wShadow(g,ox,oy+u*1.2,u*6,u*3); C(-3.4,-.6,0,1.2,1.2,9,'#3A2A6A'); C(2.2,-.6,0,1.2,1.2,9,'#3A2A6A'); C(-3.4,-.6,9,6.8,1.2,1.2,'#3A2A6A'); C(-3.6,-.8,10.2,7.2,1.6,.5,'#B98CFF');
      { const cx=ox+u*.3, cy=oy-u*5.2; g.save(); g.translate(cx,cy); g.scale(1,1.15); for(let i=0;i<5;i++){ const r=u*(3.2-i*.55); g.strokeStyle=['#B98CFF','#7B5CFF','#5AE0FF','#FF5AB4','#FFFFFF'][i]; g.globalAlpha=.85-i*.1; g.lineWidth=u*.55; g.beginPath(); g.arc(0,0,r,tm*(2+i*.6)+i,tm*(2+i*.6)+i+Math.PI*1.4); g.stroke(); } g.globalAlpha=1; g.restore();
        g.save(); g.shadowColor='#B98CFF'; g.shadowBlur=u*5; g.fillStyle='rgba(200,170,255,.35)'; g.beginPath(); g.ellipse(cx,cy,u*2.6,u*3.2,0,0,Math.PI*2); g.fill(); g.restore(); } break; }
    case 'hall': { const k=lv; wShadow(g,ox,oy+u*2.4,u*12,u*6);
      C(-6,-6,0,12,12,1.4,'#9AA3AE'); C(-5.4,-5.4,1.4,10.8,10.8,5+k,'#F4E9D6');
      for(let i=0;i<3;i++){ C(-5.5,-5.5+i*4.2,1.4,.2,1.4,5+k,'#D9C9AA'); }
      C(-1.4,5.4,1.4,2.8,.3,3.6,'#6A4024'); C(-.9,5.6,4.2,1.8,.2,.8,'#FF5A1A');
      const rz=6.4+k; C(-6.4,-6.4,rz,12.8,12.8,1.2,wShade(roof,-.12)); C(-5.2,-5.2,rz+1.2,10.4,10.4,1.4,roof); C(-3.8,-3.8,rz+2.6,7.6,7.6,1.4,wShade(roof,.1)); C(-2.2,-2.2,rz+4,4.4,4.4,1.4,wShade(roof,.2));
      if(k>=3){ [[-6.8,-6.8],[4.4,-6.8],[-6.8,4.4],[4.4,4.4]].forEach(([x,y])=>{ C(x,y,0,2.4,2.4,rz+2,'#E8DCC4'); C(x-.3,y-.3,rz+2,3,3,1.2,roof); }); }
      if(k>=4){ C(-1.6,-1.6,rz+5.4,3.2,3.2,2.2,'#F2B33D',{t:'#FFE08A',l:'#F5C24F',r:'#C98A1A'}); }
      const top=rz+(k>=4?7.6:5.4); C(-.25,-.25,top,.5,.5,5,'#E6ECF4'); const wv=Math.sin(tm*4)*.2; C(.25,-.25,top+2.6+wv,.2,4,2.4,'#FF5A1A',{l:'#FF7A2E',r:'#E04A0A',t:'#FF8F4D'});
      if(k>=5){ const gl=.6+.4*Math.sin(tm*3); g.save(); g.shadowColor='#5AE0FF'; g.shadowBlur=u*4; C(-.9,-.9,top+5.4+Math.sin(tm*2)*.5,1.8,1.8,2.6,'#5AE0FF',{t:'rgba(220,250,255,'+gl+')',l:'#7FE8FF',r:'#3BB8D8'}); g.restore(); }
      break; }
    case 'mine': { const k=lv; wShadow(g,ox,oy+u*1.8,u*9,u*4.5); C(-4.5,-4,0,9,8,4+k*.4,'#B5523A'); for(let i=0;i<3;i++) C(-4.6,-3.6+i*2.6,1+i%2,9.2,.4,.4,'#8E3A26');
      C(-3.8,-3.4,4+k*.4,7.6,6.8,1,'#7A3424'); C(1.2,-2.6,5+k*.4,2,2,3+k*1.2,'#9A4A34'); C(-2.6,4,0,3.4,.3,2.6,'#2A1E1A');
      const ch=8+k*1.6; for(let i=0;i<3;i++){ const ph=(tm*.6+i/3)%1; g.fillStyle='rgba(220,224,232,'+((1-ph)*.6)+')'; const p=[ox+(2.2+2.2)*u*.5+ph*u*2.5,oy-(ch+ph*6)*u]; g.beginPath(); g.arc(p[0],p[1],u*(.8+ph*1.4),0,Math.PI*2); g.fill(); }
      C(-4,4.4,0,1.6,1.2,1,'#D96A4A'); C(-2.2,4.6,0,1.6,1.2,1,'#D96A4A'); C(-3.1,4.5,1,1.6,1.2,1,'#E07A58'); if(k>=3) C(4.6,-1,0,2,3,1.6,'#6A4024');
      break; }
    case 'hut': { wShadow(g,ox,oy+u*1.6,u*7,u*3.5); C(-3.5,-3,0,7,6,5,'#C9965A'); C(-4,-3.5,5,8,7,1,'#8A5A34'); C(-3,-2.5,6,6,5,1.2,'#A87344'); C(-1.6,3,0,2.2,.3,3,'#5A3A20');
      C(-.8,-.8,7.2,1.6,1.6,1,'#FFC233',{t:'#FFE08A',l:'#FFC233',r:'#D99A10'}); C(2.6,-2.6,0,.4,.4,4,'#7A4E2C'); C(2.2,-2.8,3,1.4,.4,1.6,'#9AA3AE'); break; }
    case 'sign': C(-.3,-.3,0,.6,.6,3.4,'#7A4E2C'); C(-2.4,-.3,3,4.8,.4,2.4,'#C9965A'); break;
    /* ── 2×1 긴 장식 ── */
    case 'bench2': wShadow(g,ox,oy+u,u*9,u*3); [-7,-.4,5.6].forEach(x=>C(x,-1,0,.7,2,2,'#5A3A20')); C(-7.6,-1.2,2,15.2,2.4,.6,'#B07A4A'); C(-7.6,-1.6,2.6,15.2,.5,2.2,'#9A6638'); C(-7.6,-1.6,4.6,15.2,.5,.3,'#C98A56'); break;
    case 'fence2': [-7.6,-3.8,0,3.8,7.6].forEach(x=>C(x-.3,-.3,0,.6,.6,3.4,'#D9B98A')); C(-7.6,-.2,1.2,15.2,.4,.5,'#C9A574'); C(-7.6,-.2,2.5,15.2,.4,.5,'#C9A574'); break;
    case 'tent2': wShadow(g,ox,oy+u*1.5,u*11,u*4); C(-7.5,-3.5,0,15,7,2,'#FF7A2E'); C(-7,-3,2,14,6,2,'#FF8F4D'); C(-6.5,-2.4,4,13,4.8,1.6,'#FFA36B'); C(-6,-1.4,5.6,12,2.8,1.2,'#FFB98A'); C(7.5,-1.2,0,.3,2.4,3.2,'#7A2400'); C(-7.5,-3.6,0,.3,7.2,.3,'#C94A10'); break;
    case 'payload2': { wShadow(g,ox,oy+u*1.4,u*11,u*3.8); const bb=Math.sin(tm*2+seed)*.15; C(-7.5,-2.8,1.2,15,5.6,3,'#C8CDD6'); C(-7,-2.4,4.2,14,4.8,.8,'#FF5A1A');
      C(-3.5,-1.6,5,3.2,3.2,2.6+bb,'#5AE0FF',{t:'#BDF4FF',l:'#7FE8FF',r:'#3BB8D8'}); C(2,-1.2,5,2.4,2.4,1.6,'#3A4152'); [[-6.5,-3.2],[-1,-3.2],[4.5,-3.2],[-6.5,2.6],[-1,2.6],[4.5,2.6]].forEach(([x,y])=>C(x,y,0,1.6,.6,1.6,'#2A2A31')); break; }
    case 'neon2': { C(-7.5,-.5,0,1.2,1,10,'#2A2A31'); C(6.3,-.5,0,1.2,1,10,'#2A2A31'); C(-7.5,-.5,10,15,1,1.2,'#2A2A31'); const fl=.7+.3*Math.sin(tm*6+seed); const nc='rgba(255,90,180,'+fl+')';
      g.save(); g.shadowColor='#FF5AB4'; g.shadowBlur=u*3; C(-6.8,.5,1,.4,.2,9,'#FF5AB4',{l:nc,r:nc,t:nc}); C(6.6,.5,1,.4,.2,9,'#FF5AB4',{l:nc,r:nc,t:nc}); C(-6.8,.5,9.6,13.8,.2,.5,'#5AE0FF',{l:'#5AE0FF',r:'#5AE0FF',t:'#5AE0FF'}); g.restore(); break; }
    /* ── 가운데 섬 명소 (2×2) ── */
    case 'lm_shop': wShadow(g,ox,oy+u*3,u*16,u*7); C(-7,-6.5,0,14,13,1,'#C9CED6'); C(-6.5,-6,1,13,12,7,'#FFF4E6'); C(-6.5,-6,1,13,12,.6,'#E8D9C2');
      for(let i=0;i<6;i++) C(6.5,-6+i*2,5.2,2.2,2,.8,i%2?'#FFFFFF':'#FF5A1A'); for(let i=0;i<6;i++) C(-6.5+i*2.17,6,5.2,2.17,2.2,.8,i%2?'#FFFFFF':'#FF5A1A');
      C(6.5,-1.2,1,.3,2.4,4,'#6A4024'); C(-5,6,2,4,.3,3,'#BDEBFF',{l:'#DDF4FF',r:'#8FCDEE',t:'#BDEBFF'}); C(1,6,2,4,.3,3,'#BDEBFF',{l:'#DDF4FF',r:'#8FCDEE',t:'#BDEBFF'});
      C(-7,-6.5,8,14,13,1,'#E8420A'); C(-5.5,-5,9,11,10,1,'#FF7A2E'); C(-3,-.6,10,6,1.2,3.2,'#FFC233',{t:'#FFE08A',l:'#FFD24D',r:'#D99A10'}); C(-1.2,-.3,11,2.4,.2,1.4,'#8A3A00'); break;
    case 'lm_chat': { wShadow(g,ox,oy+u*3,u*15,u*7); C(-7,-6.5,0,14,13,.8,'#D9C9AA'); C(-6,-6,.8,9,9,7,'#E9FFF4'); C(-6.4,-6.4,7.8,9.8,9.8,1.2,'#139A63'); C(-5.2,-5.2,9,7.4,7.4,1,'#3FCB86');
      C(3,-5,.8,.3,4,3.4,'#BDEBFF',{l:'#DDF4FF',r:'#8FCDEE',t:'#BDEBFF'}); C(-4.5,3,.8,4,.3,4,'#6A4024');
      [[4.5,2.5],[0,4.8]].forEach(([x,y])=>{ C(x-.2,y-.2,.8,.4,.4,4,'#5A3A20'); C(x-1.2,y-1.2,3,2.4,2.4,.4,'#F2F5FA'); C(x-2,y-2,4.8,4,4,.6,'#FF6B8A'); C(x-1.2,y-1.2,5.4,2.4,2.4,.4,'#FF9AB4'); });
      const by=Math.sin(tm*2)*.5; C(-3.4,-3.4,12+by,5.4,.6,3.4,'#FFFFFF',{l:'#FFFFFF',r:'#DDE6F0',t:'#F2F5FA'}); C(-1.4,-3,11.2+by,1.2,.4,.9,'#FFFFFF',{l:'#FFFFFF',r:'#DDE6F0',t:'#F2F5FA'}); [0,1,2].forEach(i=>C(-2.6+i*1.5,-2.82,13.4+by,.8,.1,.8,'#139A63',{l:'#139A63',r:'#139A63',t:'#139A63'})); break; }
    case 'lm_comm': { wShadow(g,ox,oy+u*3,u*15,u*7); C(-7,-7,0,14,14,.8,'#C9CED6'); C(-6,-6,.8,12,12,.4,'#D4D9E0');
      [[-6,-6],[5,-6],[-6,5],[5,5]].forEach(([x,y])=>C(x,y,1.2,1,1,7.4,'#F2F5FA')); C(-7,-7,8.6,14,14,1,'#2563EB'); C(-5.6,-5.6,9.6,11.2,11.2,1,'#3B82F6'); C(-3.6,-3.6,10.6,7.2,7.2,1,'#60A5FA'); C(-1.4,-1.4,11.6,2.8,2.8,1.2,'#FFD166');
      C(-4,-1,1.2,8,.8,6,'#8A5A34'); C(-3.6,-.2,1.6,7.2,.1,5.2,'#F2E3C6',{l:'#F2E3C6',r:'#D9C9AA',t:'#F2E3C6'}); const nc=['#FF6B8A','#FFD166','#7CD957','#7CC2FF','#B98CFF','#FF9A4D'];
      for(let i=0;i<6;i++) C(-3.2+(i%3)*2.4,-.1,2.2+Math.floor(i/3)*2.4,1.8,.08,1.8,nc[i],{l:nc[i],r:nc[i],t:nc[i]}); break; }
    case 'lm_locker': { wShadow(g,ox,oy+u*3,u*15,u*7); C(-7,-6.5,0,14,13,.8,'#F2D5E3'); C(-6.5,-6,.8,13,12,7.4,'#FFF0F6');
      for(let i=0;i<6;i++) C(6.5,-6+i*2,6.2,2.2,2,.8,i%2?'#FFFFFF':'#FF5AA8'); C(-6.8,-6.3,8.2,13.6,12.6,.8,'#D02A7A'); C(-5,-4.5,9,10,9,1.4,'#FF8FC4');
      C(-5,6,1.6,7,.3,4.6,'#FFE3F0',{l:'#FFE8F3',r:'#F7C6DC',t:'#FFE3F0'}); C(-2.6,6.3,1.6,2,.2,3.6,'#FF5AA8'); C(-2.2,6.3,5.2,1.2,.2,1,'#F4C9A0'); C(6.5,-1.2,.8,.3,2.4,4.2,'#8A3A5A');
      C(-1.2,-1.2,10.4,2.4,2.4,1,'#FFD166'); [[-1.2,-1.2],[.7,-1.2],[-1.2,.7],[.7,.7]].forEach(([x,y])=>C(x,y,11.4,.5,.5,.9,'#FFD166')); break; }
    case 'lm_slime': case 'lm_hell': { const hell=t==='lm_hell'; wShadow(g,ox,oy+u*2.6,u*14,u*6.5);
      C(-7,-4,0,14,8,1.2,hell?'#2A1416':'#9AA6B0'); C(-6,-3,1.2,12,6,.6,hell?'#3A1C1E':'#B8C2CA');
      const pc=hell?['#4A1E22','#2A0E10']:['#7CE07A','#3FAE3A'];
      C(-6.5,-1.4,1.8,2.8,2.8,11,pc[0],hell?{t:'#6A2A2E',l:'#3A1418',r:'#2A0C10'}:{t:'#B8F5B0',l:'#8EE88A',r:'#4FBF4A'}); C(3.7,-1.4,1.8,2.8,2.8,11,pc[0],hell?{t:'#6A2A2E',l:'#3A1418',r:'#2A0C10'}:{t:'#B8F5B0',l:'#8EE88A',r:'#4FBF4A'});
      C(-7,-1.8,12.8,14,3.6,2.2,hell?'#3A1418':'#5FD06A',hell?{t:'#5A2226',l:'#3A1418',r:'#260A0C'}:{t:'#9CF09A',l:'#6FDB72',r:'#3FAE3A'});
      if(hell){ C(-7.6,-1,14,1.6,2,3,'#E6D6C0'); C(6,-1,14,1.6,2,3,'#E6D6C0'); C(-1.4,-1.9,13.6,2.8,.2,2.4,'#E6DCC8'); C(-1,-2,14.2,.7,.1,.7,'#1A0A0A',{l:'#1A0A0A',r:'#1A0A0A',t:'#1A0A0A'}); C(.3,-2,14.2,.7,.1,.7,'#1A0A0A',{l:'#1A0A0A',r:'#1A0A0A',t:'#1A0A0A'}); }
      else { [[-6,0],[4.5,0]].forEach(([x])=>{ const by=Math.abs(Math.sin(tm*3+x))*1.2; C(x+.2,-1,12.8+by+2.2,2,2,1.2,'#8EF08A',{t:'#C8FFC0',l:'#9CF09A',r:'#5FCB5A'}); }); }
      const P2=(a,b,c2)=>[ox+(a-b)*u,oy+(a+b)*u*.5-c2*u]; const q=[P2(-3.7,0,1.8),P2(3.7,0,1.8),P2(3.7,0,12.8),P2(-3.7,0,12.8)];
      const gr=g.createLinearGradient(...P2(0,0,12.8),...P2(0,0,1.8)); if(hell){ gr.addColorStop(0,'#FF6B3D'); gr.addColorStop(.5,'#C81E1E'); gr.addColorStop(1,'#3A0408'); } else { gr.addColorStop(0,'#C8FFE0'); gr.addColorStop(.5,'#3FDB9A'); gr.addColorStop(1,'#0E7A5A'); }
      g.save(); g.globalAlpha=.88; g.fillStyle=gr; g.beginPath(); g.moveTo(...q[0]); q.slice(1).forEach(p=>g.lineTo(...p)); g.closePath(); g.fill(); g.clip();
      for(let i=0;i<10;i++){ const a=tm*(hell?2.2:1.6)+i*.63, r=.6+((i*.29+tm*.25)%1)*3.2; const p=P2(Math.cos(a)*r,0,7.3+Math.sin(a)*r*1.3); g.fillStyle=hell?'rgba(255,200,120,'+(.35+.4*Math.sin(a*2))+')':'rgba(255,255,255,'+(.35+.4*Math.sin(a*2))+')'; g.fillRect(p[0]-u*.4,p[1]-u*.4,u*.8,u*.8); }
      if(hell){ const p=P2(0,0,7.3); g.globalAlpha=.55+.25*Math.sin(tm*3); g.fillStyle='#1A0204'; g.beginPath(); g.arc(p[0],p[1]-u*.6,u*1.9,0,Math.PI*2); g.fill(); g.fillRect(p[0]-u*1.2,p[1]+u*.8,u*2.4,u*1.2); g.fillStyle='#FF5A2A'; g.fillRect(p[0]-u*1.1,p[1]-u*.9,u*.8,u*.8); g.fillRect(p[0]+u*.3,p[1]-u*.9,u*.8,u*.8); }
      g.restore();
      if(hell){ for(let i=0;i<2;i++){ const x=i?5:-5.4, f=1+Math.sin(tm*9+i*2)*.25; C(x,-.6,15,1.2,1.2,1.6*f,'#FF5A1A',{t:'#FFB04A',l:'#FF7A2A',r:'#E8420A'}); C(x+.3,-.3,15+1.6*f,.6,.6,1*f,'#FFD54A',{t:'#FFF2A0',l:'#FFE070',r:'#F2B020'}); } }
      else { const hp=Math.abs(Math.sin(tm*4))*1.6; [[-4,3.8],[3,4.2]].forEach(([x,y],i)=>{ const h2=i?Math.abs(Math.sin(tm*4+1.4))*1.6:hp; C(x,y,1.2+h2,1.8,1.8,1.4,'#8EF08A',{t:'#C8FFC0',l:'#9CF09A',r:'#5FCB5A'}); C(x+.4,y+1.8,1.9+h2,.3,.05,.4,'#1A1F2C',{l:'#1A1F2C',r:'#1A1F2C',t:'#1A1F2C'}); C(x+1.1,y+1.8,1.9+h2,.3,.05,.4,'#1A1F2C',{l:'#1A1F2C',r:'#1A1F2C',t:'#1A1F2C'}); }); }
      break; }
    case 'lm_story': { wShadow(g,ox,oy+u*2.6,u*15,u*6.8); C(-7.5,-4.5,0,15,9,1,'#B9A27E'); C(-6.8,-3.8,1,13.6,7.6,.5,'#E8D7B0');
      /* 펼친 동화책 표지 두 장이 기둥이 돼요 */
      C(-7,-1.6,1.5,3,3.2,12,'#B5323C',{t:'#E2545E',l:'#C8414A',r:'#8E2430'}); C(4,-1.6,1.5,3,3.2,12,'#2F6FD8',{t:'#5B9BF8',l:'#3F7FE6',r:'#2457B0'});
      C(-6.7,-1.8,2,2.4,.2,11,'#FFF6DE',{l:'#FFF6DE',r:'#F0E2BE',t:'#FFF6DE'}); C(4.3,-1.8,2,2.4,.2,11,'#FFF6DE',{l:'#FFF6DE',r:'#F0E2BE',t:'#FFF6DE'});
      C(-7.4,-2,13.4,14.8,4,1.8,'#FFF2D0',{t:'#FFFBEA',l:'#FFF2D0',r:'#E6D2A6'}); C(-7.6,-2.1,15.2,15.2,4.2,.4,'#D9A93A'); C(-1.2,-2.2,15.6,2.4,4.4,1.6,'#FFD54A',{t:'#FFF0A0',l:'#FFD54A',r:'#D9A93A'});
      const P2=(a,b,c2)=>[ox+(a-b)*u,oy+(a+b)*u*.5-c2*u]; const q=[P2(-4,0,1.5),P2(4,0,1.5),P2(4,0,13.4),P2(-4,0,13.4)];
      const gr=g.createLinearGradient(...P2(0,0,13.4),...P2(0,0,1.5)); gr.addColorStop(0,'#FFF6C8'); gr.addColorStop(.5,'#FFC46A'); gr.addColorStop(1,'#E0731A');
      g.save(); g.globalAlpha=.9; g.fillStyle=gr; g.beginPath(); g.moveTo(...q[0]); q.slice(1).forEach(p=>g.lineTo(...p)); g.closePath(); g.fill(); g.clip();
      for(let i=0;i<12;i++){ const a=tm*1.2+i*.52, r=.6+((i*.27+tm*.2)%1)*3.4; const p=P2(Math.cos(a)*r,0,7.4+Math.sin(a)*r*1.4); g.fillStyle='rgba(255,255,255,'+(.4+.4*Math.sin(a*2))+')'; g.beginPath(); g.arc(p[0],p[1],u*.45,0,Math.PI*2); g.fill(); } g.restore();
      for(let i=0;i<4;i++){ const a=tm*.8+i*1.57; const p=P2(Math.cos(a)*6,Math.sin(a)*3,17+Math.sin(tm*2+i)*1.2); g.fillStyle='#FFE58A'; g.save(); g.translate(p[0],p[1]); g.rotate(tm+i); g.beginPath(); for(let j=0;j<5;j++){ const r2=j%2?u*.5:u*1.2; const aa=j/5*Math.PI*2; g.lineTo(Math.cos(aa)*u*1.2,Math.sin(aa)*u*1.2); g.lineTo(Math.cos(aa+Math.PI/5)*u*.5,Math.sin(aa+Math.PI/5)*u*.5); } g.closePath(); g.fill(); g.restore(); }
      C(-6.6,3.2,1.5,1.4,1.4,1.2,'#F5E6C8'); C(-7,2.8,2.7,2.2,2.2,1,'#E5383B',{t:'#F05454'}); C(5.2,3.2,1.5,1.2,1.2,1,'#F5E6C8'); C(4.9,2.9,2.5,1.8,1.8,.9,'#FF9A4D',{t:'#FFB86B'}); break; }
    case 'lm_town': { wShadow(g,ox,oy+u*2.4,u*13,u*6); C(-7,-3,0,14,6,1,'#8A8FA6'); C(-6.5,-1.2,1,2.4,2.4,11,'#6A6F86'); C(4.1,-1.2,1,2.4,2.4,11,'#6A6F86'); C(-7,-1.6,12,14,3.2,1.6,'#5A5F76'); C(-1,-1.7,13.6,2,3.4,1.4,'#B48CFF');
      const t=tm*1.6; const ps=(a,b,c)=>[ox+(a-b)*u,oy+(a+b)*u*.5-c*u]; const k=g.createLinearGradient(...ps(0,0,11),...ps(0,0,1)); k.addColorStop(0,'rgba(180,140,255,.95)'); k.addColorStop(1,'rgba(90,60,220,.9)');
      g.fillStyle=k; g.beginPath(); const q=[ps(-4.1,0,1),ps(4.1,0,1),ps(4.1,0,12),ps(-4.1,0,12)]; g.moveTo(...q[0]); q.slice(1).forEach(p=>g.lineTo(...p)); g.closePath(); g.fill();
      for(let i=0;i<8;i++){ const a=t+i*.8, r=1+((i*.37+tm*.3)%1)*3; const p=ps(Math.cos(a)*r,0,6.5+Math.sin(a)*r*1.2); g.fillStyle='rgba(255,255,255,'+(.4+.5*Math.sin(a*2))+')'; g.fillRect(p[0]-u*.35,p[1]-u*.35,u*.7,u*.7); } break; }
    case 'lm_stadium': { wShadow(g,ox,oy+u*3,u*17,u*7.5); C(-8,-8,0,16,16,1,'#B5BDC6'); C(-5.6,-5.6,1,11.2,11.2,.4,'#59B36A');
      C(-8,-8,1,16,2.4,3,'#E8EDF4'); C(-8,-8,1,2.4,16,3,'#E8EDF4'); C(-8,-8,4,16,1.2,2,'#D4DAE4'); C(-8,-8,4,1.2,16,2,'#D4DAE4'); C(-8,5.6,1,16,2.4,1.6,'#E8EDF4'); C(5.6,-8,1,2.4,16,1.6,'#E8EDF4');
      for(let i=0;i<6;i++) C(-7+i*2.4,-7.6,3.2,1.6,.4,.6,['#FF5A1A','#3B82F6','#FFD166'][i%3]);
      C(-3.5,-7.8,6,7,.6,4,'#1E2330'); const sc=['#FFD54A','#FF8A3D','#5AE0FF'][Math.floor(tm*1.5)%3]; C(-3,-7.15,6.5,6,.05,3,sc,{l:sc,r:sc,t:sc});
      [[-7.8,-7.8],[6.8,-7.8],[-7.8,6.8]].forEach(([x,y])=>{ C(x,y,1,.6,.6,11,'#9AA3AE'); C(x-.7,y-.7,12,2,2,.8,'#FFF6D6',{t:'#FFFFFF',l:'#FFF6D6',r:'#F0E2A8'}); });
      C(-.3,-.3,1.4,.6,.6,2.2,'#FFFFFF'); C(-1.2,-1.2,3.6,2.4,2.4,1.6,'#F2C230',{t:'#FFE08A',l:'#F5C24F',r:'#C98A1A'}); break; }
    case 'lm_pass': { wShadow(g,ox,oy+u*3,u*13,u*6); C(-6,-6,0,12,12,2.4,'#5A3FB0'); C(-6.2,-6.2,2.4,12.4,12.4,.5,'#F2C230'); C(-4.2,-4.2,2.9,8.4,8.4,9,'#7B5CFF'); C(-4.3,-4.3,7,8.6,8.6,.5,'#F2C230');
      [3.5,8.5].forEach(z=>{ C(-1,4.2,z,2,.2,1.8,'#FFE08A',{l:'#FFE08A',r:'#F0C040',t:'#FFE08A'}); C(4.2,-1,z,.2,2,1.8,'#FFE08A',{l:'#FFE08A',r:'#F0C040',t:'#FFE08A'}); });
      C(-5,-5,11.9,10,10,1.2,'#4A2F96'); C(-3.4,-3.4,13.1,6.8,6.8,1.4,'#6A4BC4'); C(-1.8,-1.8,14.5,3.6,3.6,1.4,'#8E6CF0');
      const fy=Math.sin(tm*2)*.8, rot=tm*1.4; const c0=[ox,oy-u*(20+fy)]; const R=u*2.6; g.save(); g.translate(c0[0],c0[1]); g.scale(Math.cos(rot)*.8+.2*Math.sign(Math.cos(rot)||1),1);
      g.fillStyle='#FFD54A'; g.beginPath(); g.moveTo(0,-R*1.3); g.lineTo(R,0); g.lineTo(0,R*1.3); g.lineTo(-R,0); g.closePath(); g.fill(); g.fillStyle='#FFF3B0'; g.beginPath(); g.moveTo(0,-R*1.3); g.lineTo(R*.5,-R*.1); g.lineTo(0,R*.2); g.lineTo(-R*.5,-R*.1); g.closePath(); g.fill(); g.restore();
      g.fillStyle='rgba(255,213,74,.18)'; g.beginPath(); g.arc(c0[0],c0[1],u*5,0,Math.PI*2); g.fill(); break; }
    case 'lm_arena': { wShadow(g,ox,oy+u*3,u*16,u*7); C(-8,-8,0,16,16,1.2,'#B5BDC6'); C(-6,-6,1.2,12,12,.3,'#F2DFA6');
      C(-8,-8,1.2,16,1.8,5.6,'#E8DCC4'); C(-8,-8,1.2,1.8,16,5.6,'#E8DCC4'); for(let i=0;i<5;i++){ C(-7+i*3.2,-6.3,2.2,1.4,.1,2.6,'#8A7A5E'); C(-6.3,-7+i*3.2,2.2,.1,1.4,2.6,'#8A7A5E'); }
      C(-8,6.2,1.2,6,1.8,3,'#E8DCC4'); C(2,6.2,1.2,6,1.8,3,'#E8DCC4'); C(6.2,-8,1.2,1.8,6,3,'#E8DCC4'); C(6.2,2,1.2,1.8,6,3,'#E8DCC4');
      const wv=Math.sin(tm*4)*.2; C(-7.6,-7.6,6.8,.5,.5,5,'#E6ECF4'); C(-7.1,-7.6,9.6+wv,3.6,.2,2,'#E5383B',{l:'#F05454',r:'#B82828',t:'#F05454'}); C(-7.6,-7.6,6.8,.5,.5,5,'#E6ECF4'); C(-7.6,-7.1,9.6-wv,.2,3.6,2,'#3B82F6',{l:'#5B9BF8',r:'#2563EB',t:'#5B9BF8'});
      C(-2.5,8,2,1.8,.2,3,'#E5383B'); C(.7,8,2,1.8,.2,3,'#3B82F6'); C(8,-2.5,2,.2,1.8,3,'#E5383B'); C(8,.7,2,.2,1.8,3,'#3B82F6');
      C(-.8,-.8,1.5,1.6,1.6,1.4,'#FFD166'); break; }

    case 'ob_weed': { for(let i=0;i<6;i++){ const a=wHash(seed,i,3), b=wHash(seed,i,8); C(-3+a*5,-3+b*5,0,.5,.5,1.8+a*1.6,i%2?'#6FA84A':'#5B9A3C'); } break; }
    case 'ob_stump': wShadow(g,ox,oy+u,u*4.4,u*2.2); C(-2.2,-2.2,0,4.4,4.4,2.2,'#7A5236'); C(-1.8,-1.8,2.2,3.6,3.6,.3,'#D9B98A'); C(2,-.5,0,1.6,1,.8,'#6A4428'); C(-3,1,0,1.4,1,.7,'#6A4428'); break;
    case 'ob_tree': wShadow(g,ox,oy+u*1.4,u*8,u*4); C(-1.4,-1.4,0,2.8,2.8,7,'#5E3E26'); C(-1.4,-3.4,4,1,2,1,'#5E3E26'); C(-5,-5,6,10,10,5,'#2E6E44'); C(-4,-4,11,8,8,3,'#3A7E50'); C(-2,-2,14,4,4,1.6,'#4A8E5E'); break;
    case 'ob_rock': wShadow(g,ox,oy+u*1.4,u*7,u*3.4); C(-4,-3,0,7,6,4,'#7E8794'); C(-2,-4,0,5,4,6,'#959EAA'); C(-1,-3,6,3,3,1.2,'#6A9A4E'); C(1,1,0,3,3,2.4,'#8A939F'); break;
  }
}
function wScaffold(g,ox,oy,u,tm,h){
  const C=(...a)=>wCube(g,ox,oy,u,...a); const W='#C9965A', P='#8A6A50';
  [[-5.6,-5.6],[4.8,-5.6],[-5.6,4.8],[4.8,4.8]].forEach(([x,y])=>C(x,y,0,.7,.7,h,P));
  for(let z=3;z<h;z+=4){ C(-5.6,-5.6,z,11.1,.5,.4,W); C(-5.6,4.9,z,11.1,.5,.4,W); C(-5.6,-5.6,z,.5,11.1,.4,W); C(4.9,-5.6,z,.5,11.1,.4,W); }
  for(let i=0;i<3;i++){ const ph=(tm*2.2+i/3)%1; if(ph>.35) continue; g.fillStyle='rgba(255,220,120,'+(1-ph/.35)+')'; const sx=ox+(wHash(i,Math.floor(tm*2.2),2)-.5)*u*10, sy=oy-u*(2+wHash(i,Math.floor(tm*2.2),5)*h); g.fillRect(sx-u*.5,sy-u*.5,u,u); }
}

/* 지형은 한 번 만들어 두고 다시 써요 (로딩 화면에서 미리 만들어요) */
const W_BCACHE={k:'',v:null};
const wKeyOf=isl=>isl.map(s=>s.uid+':'+s.exp+':'+s.land.length+':'+(s.land.length?s.land[s.land.length-1].at:0)).join(',');
function buildWorldC(isl){ const k=wKeyOf(isl); if(W_BCACHE.k===k&&W_BCACHE.v) return W_BCACHE.v; const v=buildWorld(isl.map(s=>({uid:s.uid,name:s.name,createdAt:s.createdAt,exp:s.exp,land:s.land}))); W_BCACHE.k=k; W_BCACHE.v=v; return v; }
function wWarm(c){ try{ const raw=[...(c.islands||[])].sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)).slice(0,24); buildWorldC(raw.map(wNorm)); }catch(e){} }
/* ═════════ 월드 화면 ═════════ */
const W_ICP={}; const wIcon=n=>W_ICP[n]||(W_ICP[n]=new Path2D(ICONS[n]||ICONS.star||''));
function WorldBeta({c,onClose}){
  const cv=useRef(null); const S=useRef(null);
  const [mode,setMode]=useState('view'); const [sel,setSel]=useState(null); const [shop,setShop]=useState(false); const [stab,setStab]=useState('res');
  const [card,setCard]=useState(null); const [ghost,setGhost]=useState(null); const [,tick]=useState(0); const [hint,setHint]=useState(true);
  const [cloud,setCloud]=useState('in'); const [info,setInfo]=useState(null); const [nm,setNm]=useState(null); const [rank,setRank]=useState(false); const [msn,setMsn]=useState(false); const [emo,setEmo]=useState(false); const visRef=useRef({});
  const [lm,setLm]=useState(null); const [lsel,setLsel]=useState(null); const [ppl,setPpl]=useState(false);
  const [dg,setDg]=useState(null); const [tp,setTp]=useState(null); const [chat,setChat]=useState(false); const [edit,setEdit]=useState(null); const [cedit,setCedit]=useState(null);
  const [welcome,setWelcome]=useState(false); const [ctext,setCtext]=useState(''); const logRef=useRef(new Map()); const cRef=useRef(c); cRef.current=c;
  const [wset,setWset]=useState(false); const [near,setNear]=useState(null); const [door,setDoor]=useState(null); const [hallIn,setHallIn]=useState(false); const [npcT,setNpcT]=useState(null); const [ctl,setCtl]=useState(wCtl());
  useEffect(()=>{ if(!npcT) return; const t=setTimeout(()=>setNpcT(null),6500); return ()=>clearTimeout(t); },[npcT&&npcT.k]);
  useEffect(()=>{ const f=()=>{ setCtl(wCtl()); const s=S.current; if(s) s.fps30=wFps()==='30'; }; window.addEventListener('dko-wset',f); wBgm('world'); return ()=>{ window.removeEventListener('dko-wset',f); window.DKOSfx&&window.DKOSfx.bgmStop(); }; },[]);
  const rpg=rpgOf(c.me);
  const now=Date.now();
  const raw=useMemo(()=>[...(c.islands||[])].sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)).slice(0,24),[c.islands]);
  const isl=useMemo(()=>raw.map(wNorm),[raw]);
  const mine=isl.find(x=>x.uid===c.uid);
  const wKey=wKeyOf(isl);
  const W=useMemo(()=>buildWorldC(isl),[wKey]);
  const online=isl.filter(I=>I.uid!==c.uid&&I.here&&I.here.at&&now-I.here.at<65000);
  useEffect(()=>{ if(c.ready&&!isSuperM(c.me)&&!(c.islands||[]).some(x=>x.uid===c.uid)) c.createIsland(); },[c.ready,(c.islands||[]).length]);
  useEffect(()=>{ const t=setTimeout(()=>setCloud('open'),650); const t2=setTimeout(()=>setCloud(null),1900); return ()=>{ clearTimeout(t); clearTimeout(t2); }; },[]);
  useEffect(()=>{ const t=setInterval(()=>tick(x=>x+1),1000); return ()=>clearInterval(t); },[]);
  const leave=(then)=>{ setCloud('close'); setTimeout(()=>{ onClose(); if(typeof then==='function') then(); },620); };
  /* 저장 */
  const save=(patch,msg)=>c.saveIsland(patch,msg);
  const dayD=I=>I&&I.daily&&I.daily.d===dayKey()?I.daily:{d:dayKey()};
  const mark=(k,extra)=>{ if(!mine) return extra||{}; const D=dayD(mine); if(D[k]) return extra||{}; return {...(extra||{}),daily:{...D,[k]:1}}; };
  /* 접속 표시: 월드에 있는 동안 20초마다 · 도착할 때 위치를 알려요 */
  const pingAt=useRef(0);
  const sendHere=force=>{ const s=S.current; if(!s||!c.islandPing||s.paused) return; const t=Date.now(); if(!force&&t-pingAt.current<2500) return; pingAt.current=t; const h={at:t,x:Math.round(s.me.x*10)/10,y:Math.round(s.me.y*10)/10}; if(s.me.say&&t-s.me.say.at<60000) h.say=s.me.say; c.islandPing({here:h}); };
  useEffect(()=>{ if(!mine) return; const t0=setTimeout(()=>sendHere(true),900); const iv=setInterval(()=>sendHere(true),20000); return ()=>{ clearTimeout(t0); clearInterval(iv); }; },[!!mine]);
  useEffect(()=>()=>{ c.islandPing&&c.islandPing({here:null}); },[]);
  /* 예전 섬 정리 · 다 지은 건물 마무리 */
  const done=useRef(new Set());
  useEffect(()=>{ if(!mine) return; const t=Date.now(); let ch=false; const fx=[]; const D=done.current;
    const items=mine.items.map(it=>{ if(it.up&&it.up.end<=t&&!D.has(it.i+':'+it.up.end)){ D.add(it.i+':'+it.up.end); ch=true; fx.push(it); const n={...it,lv:it.up.to}; delete n.up; if(n.t==='mine') n.c=t; return n; } return it; });
    let patch=null;
    if(ch) patch={items};
    if(mine.clr&&mine.clr.end<=t&&!D.has('clr:'+mine.clr.k+':'+mine.clr.end)){ D.add('clr:'+mine.clr.k+':'+mine.clr.end); const ob=W_OB[mine.clr.t]||W_OB.ob_weed; const gain=ob.get[0]+Math.floor(wHash(t%997,3,1)*(ob.get[1]-ob.get[0]));
      patch={...(patch||{}),clr:null,cleared:[...mine.cleared,mine.clr.k],bricks:(patch&&patch.bricks!=null?patch.bricks:mine.bricks)+gain};
      const s=S.current; if(s){ const L=s.W.L.find(l=>l.uid===c.uid); const [x,y]=mine.clr.k.split(',').map(Number); if(L){ s.fx.push({k:'txt',gx:L.cx+x,gy:L.cy+y,at:performance.now(),txt:'+'+gain,ic:'brick'}); s.fx.push({k:'dust',gx:L.cx+x,gy:L.cy+y,at:performance.now()}); } }
      if(wHash(t%991,7,2)<.15){ c.worldCoins&&c.worldCoins(3,'장애물에서 D-Coin 3개를 찾았어요!'); } }
    if(mine._mig&&!D.has('mig')){ D.add('mig'); patch=patch?{bricks:mine.bricks,fv:1,...patch,items:patch.items||items}:{items,bricks:mine.bricks,fv:1}; }
    if(patch){ save(patch); const s=S.current; if(s&&fx.length){ const L=s.W.L.find(l=>l.uid===c.uid); fx.forEach(it=>{ const [w,h]=wSz(it); s.pop[it.i]=performance.now(); if(L){ s.fx.push({k:'burst',gx:L.cx+it.x+(w-1)/2,gy:L.cy+it.y+(h-1)/2,at:performance.now()}); s.fx.push({k:'txt',gx:L.cx+it.x+(w-1)/2,gy:L.cy+it.y+(h-1)/2,at:performance.now(),txt:it.up.to>1?'Lv.'+it.up.to+' 완성!':'완성!'}); } }); haptic(20); c.notify(fx.length===1?wName(fx[0].t)+(fx[0].up.to>1?' Lv.'+fx[0].up.to+' 업그레이드 완료!':' 완성!'):'건물 '+fx.length+'개 완성!'); } }
  });
  /* D-ROP에서 받은 벽돌은 들어오자마자 섬으로 · 장식은 상점 선물함으로 */
  const gift=(c.me&&c.me.wGift)||{}; const giftN=Object.values(gift.items||{}).reduce((s0,n)=>s0+(n>0?n:0),0);
  useEffect(()=>{ if(!mine||!(gift.bricks>0)||done.current.has('gb:'+gift.bricks)) return; done.current.add('gb:'+gift.bricks); const n=gift.bricks;
    c.takeWorldGift({bricks:1}).then(ok=>{ if(!ok) return; save({bricks:mine.bricks+n}); const s=S.current; if(s) s.fx.push({k:'txt',gx:s.me.x,gy:s.me.y,at:performance.now(),txt:'+'+n,ic:'brick'}); c.notify('D-ROP 선물 · 벽돌 '+n.toLocaleString()+'개가 섬에 들어왔어요!'); haptic(14); }); },[!!mine,gift.bricks]);
  useEffect(()=>{ if(giftN&&mine&&!done.current.has('gn')){ done.current.add('gn'); setTimeout(()=>c.notify('D-ROP 선물 장식 '+giftN+'개 · 상점 → 선물에서 놓을 수 있어요'),900); } },[giftN,!!mine]);
  /* 이웃이 내 가장자리 땅을 샀다면: 값의 절반을 벽돌로 받아요 */
  useEffect(()=>{ if(!mine) return; const seen=mine.soldSeen||0; let sum=0, n=0, mx=seen;
    isl.forEach(I=>{ if(I.uid===c.uid) return; I.land.forEach(e=>{ if(e.from===c.uid&&(e.at||0)>seen){ sum+=Math.floor((e.p||0)/2); n++; mx=Math.max(mx,e.at); } }); });
    if(n&&!done.current.has('sold:'+mx)){ done.current.add('sold:'+mx); save({soldSeen:mx,bricks:mine.bricks+sum}); c.notify('이웃이 내 섬 가장자리 '+n+'칸을 샀어요 · 벽돌 +'+sum); } },[wKey,!!mine]);

  useEffect(()=>{
    const el=cv.current; const g=el.getContext('2d'); let raf=0, dead=false;
    const s=S.current={W,isl,cam:{x:W_START[0],y:W_START[1],z:.62},tz:1,me:{x:W_START[0],y:W_START[1],path:[],yaw:0,ty:0,walk:false,v:0,ph:0},drag:null,fx:[],pop:{},rise:null,trise:{},ghost:null,sel:null,mode:'view',members:c.members,meM:c.me,uid:c.uid,olc:new Map(),blk:new Set(),ospot:{},landC:[],lsel:null,lmHit:[],mark:null};
    const dpr=Math.min(2,window.devicePixelRatio||1);
    const size=()=>{ const r=el.getBoundingClientRect(); el.width=Math.round(r.width*dpr); el.height=Math.round(r.height*dpr); s.vw=r.width; s.vh=r.height; };
    size(); const ro=new ResizeObserver(size); ro.observe(el);
    const iso=(x,y)=>[(x-y)*WCF.TW/2,(x+y)*WCF.TH/2];
    const scr=(x,y)=>{ const [ix,iy]=iso(x,y); const [cx,cy]=iso(s.cam.x,s.cam.y); return [(ix-cx)*s.cam.z+s.vw/2,(iy-cy)*s.cam.z+s.vh/2]; };
    const unscr=(px,py)=>{ const [cx,cy]=iso(s.cam.x,s.cam.y); const ix=(px-s.vw/2)/s.cam.z+cx, iy=(py-s.vh/2)/s.cam.z+cy; const a=ix/(WCF.TW/2), b=iy/(WCF.TH/2); return [(a+b)/2,(b-a)/2]; };
    s.scr=scr;
    /* 길찾기: 8방향(모서리는 못 깎아요) → 직선으로 펴기 */
    const blocked=(x,y)=>{ const k=x+','+y; return !s.W.T.has(k)||s.blk.has(k); };
    const DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    const bfs=(sx,sy,tx,ty)=>{ const k=(x,y)=>x+','+y; const q=[[sx,sy]]; const prev=new Map([[k(sx,sy),null]]); let n=0;
      while(q.length&&n++<12000){ const [x,y]=q.shift(); if(x===tx&&y===ty){ const p=[]; let cur=k(x,y); while(cur){ const [a,b]=cur.split(',').map(Number); p.unshift([a,b]); cur=prev.get(cur); } return p; }
        for(const [dx,dy] of DIRS){ const nx=x+dx, ny=y+dy, kk=k(nx,ny); if(prev.has(kk)||blocked(nx,ny)) continue; if(dx&&dy&&(blocked(x+dx,y)||blocked(x,y+dy))) continue; prev.set(kk,k(x,y)); q.push([nx,ny]); } } return null; };
    const los=(a,b)=>{ const d=Math.hypot(b[0]-a[0],b[1]-a[1]); const n=Math.ceil(d*5); for(let i=1;i<n;i++){ const x=a[0]+(b[0]-a[0])*i/n, y=a[1]+(b[1]-a[1])*i/n; for(const [ox,oy] of [[0,0],[.28,.28],[-.28,-.28],[.28,-.28],[-.28,.28]]) if(blocked(Math.round(x+ox),Math.round(y+oy))) return false; } return true; };
    const smooth=p=>{ if(p.length<3) return p; const o=[p[0]]; let i=0; while(i<p.length-1){ let j=p.length-1; while(j>i+1&&!los(p[i],p[j])) j--; o.push(p[j]); i=j; } return o; };
    const safe=(tx,ty)=>{ if(!blocked(tx,ty)) return [tx,ty]; let best=null, bd=1e9; for(let r=1;r<=4&&!best;r++) for(let x=tx-r;x<=tx+r;x++) for(let y=ty-r;y<=ty+r;y++){ if(blocked(x,y)) continue; const d=Math.hypot(x-tx,y-ty)+Math.hypot(x-s.me.x,y-s.me.y)*.15; if(d<bd){ bd=d; best=[x,y]; } } return best; };
    s.safe=safe;
    const route=(fx0,fy0,tx,ty)=>{ const t=safe(tx,ty); if(!t) return null; const p=bfs(Math.round(fx0),Math.round(fy0),t[0],t[1]); if(!p) return null; return smooth([[fx0,fy0],...p.slice(1)]).slice(1); };
    s.route=route;
    s.go=(tx,ty)=>{ const m=s.me; const p=route(m.x,m.y,tx,ty); if(p&&p.length){ m.path=p; const e=p[p.length-1]; s.mark={x:e[0],y:e[1],at:performance.now()}; return true; } return false; };
    s.jump=(x,y,z)=>{ const t=safe(Math.round(x),Math.round(y))||[x,y]; s.me.x=t[0]; s.me.y=t[1]; s.me.path=[]; s.me.v=0; s.follow=true; s.mark=null; if(z) s.tz=z; s.arrive&&s.arrive(); };
    let last=performance.now(); s.follow=true;
    const step=(o,vmax,dt)=>{ const [tx,ty]=o.path[0]; const dx=tx-o.x, dy=ty-o.y, d=Math.hypot(dx,dy);
      let rem=d; for(let i=1;i<o.path.length;i++) rem+=Math.hypot(o.path[i][0]-o.path[i-1][0],o.path[i][1]-o.path[i-1][1]);
      const want=Math.min(vmax,1.3+rem*3); o.v=(o.v||0)+(want-(o.v||0))*Math.min(1,dt*8); const sp=o.v*dt;
      if(d<=sp){ o.x=tx; o.y=ty; o.path.shift(); } else { o.x+=dx/d*sp; o.y+=dy/d*sp; }
      o.ph=(o.ph||0)+sp*4.4; o.walk=true; if(d>.02) o.ty=Math.atan2(-dx,dy); if(!o.path.length){ o.v=0; return true; } return false; };
    const turn=(o,dt,k)=>{ let dy=o.ty-o.yaw; while(dy>Math.PI) dy-=Math.PI*2; while(dy<-Math.PI) dy+=Math.PI*2; o.yaw+=dy*Math.min(1,dt*k); };
    /* 슬라임 섬 · 헬바운드에 가 있는 동안 월드는 완전히 쉬어요 */
    s.wake=()=>{ if(s.sleep&&!dead){ s.sleep=false; last=performance.now(); raf=requestAnimationFrame(frame); } };
    s.fps30=wFps()==='30';
    const frame=now=>{ if(dead) return; if(s.paused){ s.sleep=true; return; } if(s.fps30&&now-last<31){ raf=requestAnimationFrame(frame); return; } const dt=Math.min(.05,(now-last)/1000); last=now; const tm=now/1000;
      const m=s.me; m.walk=false;
      /* 조이스틱: 길찾기 없이 바로 그 방향으로 (막히면 벽을 따라 미끄러져요) */
      const J=s.joy; if(J&&(Math.abs(J[0])>.12||Math.abs(J[1])>.12)){ m.path=[]; s.mark=null; const mag=Math.min(1,Math.hypot(J[0],J[1])); const [wx,wy]=wJoyDir(J[0],J[1]); const want=4.4*mag; m.v=(m.v||0)+(want-(m.v||0))*Math.min(1,dt*9); const sp=m.v*dt;
        const nx=m.x+wx*sp, ny=m.y+wy*sp; const ok=(x,y)=>!blocked(Math.round(x),Math.round(y)); if(ok(nx,ny)){ m.x=nx; m.y=ny; } else if(ok(nx,m.y)) m.x=nx; else if(ok(m.x,ny)) m.y=ny; m.ty=Math.atan2(-wx,wy); m.walk=true; m.ph=(m.ph||0)+sp*4.4; s.follow=true; s.jmoved=now; }
      else if(m.path.length){ if(step(m,4.6,dt)){ s.mark=null; s.arrive&&s.arrive(); } }
      else if(s.jmoved&&now-s.jmoved>400){ s.jmoved=0; s.arrive&&s.arrive(); }
      turn(m,dt,12);
      if(m.walk&&now-(s.stepAt||0)>(m.v>3?260:340)){ s.stepAt=now; wSfx('step',.8); s.fx.push({k:'step',gx:m.x,gy:m.y,at:now}); }
      { let nk=null, nd=1.7; for(const l of W_LM){ const [dx,dy]=lmDoor(l); const d=Math.hypot(dx-m.x,dy-m.y); if(d<nd){ nd=d; nk=l.k; } } if(nk!==s.lmNear){ s.lmNear=nk; s.onNear&&s.onNear(nk); } }
      for(const n of s.fnpc||[]){ n.walk=false; if(n.talk&&now<n.talk){ n.ty=Math.atan2(-(m.x-n.x),m.y-n.y); turn(n,dt,8); continue; } if(n.path&&n.path.length){ step(n,1.4,dt); turn(n,dt,7); continue; }
        if(n.wait>0){ n.wait-=dt; if(n.wait<=0){ const D=n.def; for(let i=0;i<8;i++){ const tx=Math.round(D.home[0]+(Math.random()*2-1)*D.r), ty=Math.round(D.home[1]+(Math.random()*2-1)*D.r); if(!blocked(tx,ty)){ n.path=route(n.x,n.y,tx,ty)||[]; break; } } if(!n.path.length) n.wait=1.5; } continue; }
        n.wait=2.5+Math.random()*4; }
      for(const n of s.npcs||[]){ n.walk=false; if(n.path&&n.path.length){ step(n,1.7,dt); turn(n,dt,8); continue; }
        if(n.wait>0){ n.wait-=dt; if(n.wait<=0){ const t=pick(); n.path=route(n.x,n.y,t.x,t.y)||[]; if(!n.path.length) n.wait=1; } continue; }
        n.wait=2+Math.random()*4; if(Math.random()<.35) n.wave=now+1500; }
      for(const o of s.olc.values()){ o.walk=false; if(o.path&&o.path.length) step(o,4.2,dt); turn(o,dt,10); }
      if(s.follow&&!s.drag){ s.cam.x+=(m.x-s.cam.x)*Math.min(1,dt*4); s.cam.y+=(m.y-s.cam.y)*Math.min(1,dt*4); }
      s.cam.z+=(s.tz-s.cam.z)*Math.min(1,dt*(s.cam.z<.8?2.4:8));
      draw(tm,now); raf=requestAnimationFrame(frame); };
    /* 말풍선: 월드 채팅 · 감정 표현 */
    const bubble=(x,y,t,u)=>{ const tx=String(t).slice(0,40); g.font='800 '+Math.max(11,Math.round(u*2.6))+'px "NEXON Kart Gothic",sans-serif'; const w=Math.min(220,g.measureText(tx).width+18), h=Math.max(22,u*5);
      g.fillStyle='rgba(255,255,255,.96)'; rr(g,x-w/2,y-h,w,h,h/2); g.fill(); g.beginPath(); g.moveTo(x-5,y-1); g.lineTo(x,y+6); g.lineTo(x+5,y-1); g.fill(); g.fillStyle='#1A1F2C'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(tx,x,y-h/2+1,w-12); };
    const diamond=(gx,gy,w,h)=>{ const a=scr(gx-.5,gy-.5), b=scr(gx+w-.5,gy-.5), c2=scr(gx+w-.5,gy+h-.5), d=scr(gx-.5,gy+h-.5); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.lineTo(c2[0],c2[1]); g.lineTo(d[0],d[1]); g.closePath(); };
    const drawIt=(t,px,py,u,tm,seed,lv,r,sc)=>{ g.save(); g.translate(px,py); if(sc!==1) g.scale(sc,sc); W_SW.on=!!r; wDrawItem(g,t,0,0,u,tm,seed,lv); W_SW.on=false; g.restore(); };
    const itType=(it,w,h)=>W_LONG.has(it.t)&&w*h===2?it.t+'2':it.t;
    const draw=(tm,pnow)=>{ const z=s.cam.z; const t=Date.now(); g.setTransform(dpr,0,0,dpr,0,0);
      if(!s.bgG||s.bgH!==s.vh){ s.bgH=s.vh; const gr=g.createLinearGradient(0,0,0,s.vh); gr.addColorStop(0,'#6FD0EC'); gr.addColorStop(.55,'#43AEDD'); gr.addColorStop(1,'#2E8FCB'); s.bgG=gr; } g.fillStyle=s.bgG; g.fillRect(0,0,s.vw,s.vh);
      g.strokeStyle='rgba(255,255,255,.2)'; g.lineWidth=1.4; for(let i=0;i<30;i++){ const wx=(wHash(i,3,4)*s.vw*1.4+tm*12*(1+i%3))%(s.vw+80)-40, wy=wHash(i,8,2)*s.vh; g.beginPath(); g.moveTo(wx,wy); g.quadraticCurveTo(wx+8,wy-3,wx+16,wy); g.stroke(); }
      for(let i=0;i<16;i++){ const k=(tm*.35+wHash(i,6,1))%1; const x=wHash(i,1,9)*s.vw, y=wHash(i,2,9)*s.vh; g.fillStyle='rgba(255,255,255,'+(Math.sin(k*Math.PI)*.7)+')'; const r2=1+Math.sin(k*Math.PI)*1.6; g.fillRect(x-r2,y-.5,r2*2,1); g.fillRect(x-.5,y-r2,1,r2*2); }
      const HW=WCF.TW/2*z, HH=WCF.TH/2*z, SIDE=10*z;
      /* 땅(타일): 화면보다 조금 넓게 한 번 그려 두고 옮겨 써요. 확대 · 솟아오르는 중일 때만 매번 그려요 (화질은 그대로) */
      const drawTiles=(ctx,ox,oy,W2,H2)=>{
      const R=s.rise; const rp=R?Math.min(1,(pnow-R.at)/1400):1; if(R&&rp>=1) s.rise=null;
      if(s.tsW!==s.W){ s.tsW=s.W; s.tsL=[...s.W.T.values()].sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.x-b.x); }
      for(const T of s.tsL){ const [ix,iy]=iso(T.x,T.y); let px=ix*z+ox, py=iy*z+oy; if(px<-HW*2||px>W2+HW*2||py<-HH*2-40||py>H2+HH*2+SIDE+60) continue;
        let al=1; if(R&&T.isl===R.uid&&T.d>R.r0-.2){ const k=wBack(Math.max(0,Math.min(1,rp*1.6-(T.d-R.r0)*.25))); py+=(1-k)*80*z; al=Math.min(1,k*1.5); if(al<=0) continue; }
        const tr=s.trise[T.x+','+T.y]; if(tr){ const k=(pnow-tr)/900; if(k>=1) delete s.trise[T.x+','+T.y]; else { const e=wBack(Math.max(0,k)); py+=(1-e)*60*z; al=Math.min(1,Math.max(0,k*2)); } }
        ctx.globalAlpha=al;
        const col=W_TILE[T.t]||W_TILE.grass; const alt=((T.x+T.y)&1)?col[0]:wShade(col[0],-0.04);
        const isB=T.t==='bridge'; const side=isB?3*z:SIDE;
        const front=!s.W.T.has((T.x+1)+','+T.y), left=!s.W.T.has(T.x+','+(T.y+1));
        if(front){ ctx.fillStyle=isB?'#7A4E2C':'#9A6A44'; ctx.beginPath(); ctx.moveTo(px+HW,py); ctx.lineTo(px,py+HH); ctx.lineTo(px,py+HH+side); ctx.lineTo(px+HW,py+side); ctx.closePath(); ctx.fill(); }
        if(left){ ctx.fillStyle=isB?'#8A5A34':'#B07E52'; ctx.beginPath(); ctx.moveTo(px-HW,py); ctx.lineTo(px,py+HH); ctx.lineTo(px,py+HH+side); ctx.lineTo(px-HW,py+side); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle=alt; ctx.beginPath(); ctx.moveTo(px,py-HH); ctx.lineTo(px+HW,py); ctx.lineTo(px,py+HH); ctx.lineTo(px-HW,py); ctx.closePath(); ctx.fill();
        if(isB){ ctx.strokeStyle='rgba(90,58,32,.45)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(px-HW*.5,py-HH*.5); ctx.lineTo(px+HW*.5,py+HH*.5); ctx.stroke(); }
        if(T.t==='grass'&&wHash(T.x,T.y,11)>.82){ ctx.fillStyle=wShade(col[0],-0.15); ctx.fillRect(px-2*z,py-1*z,2*z,3*z); ctx.fillRect(px+3*z,py+1*z,2*z,2*z); }
        if(T.t==='grass'&&wHash(T.x,T.y,23)>.93){ ctx.fillStyle=['#FFFFFF','#FFD6E8','#FFF2A0'][Math.floor(wHash(T.x,T.y,4)*3)]; ctx.fillRect(px-5*z,py,1.6*z,1.6*z); ctx.fillRect(px+4*z,py-2*z,1.6*z,1.6*z); }
        if(T.t==='path'){ ctx.fillStyle='rgba(160,120,70,.22)'; for(let i=0;i<4;i++){ const a=wHash(T.x,T.y,i*3+1), b=wHash(T.x,T.y,i*3+2); ctx.beginPath(); ctx.ellipse(px+(a-.5)*HW*1.1,py+(b-.5)*HH*1.1,2.6*z,1.5*z,0,0,Math.PI*2); ctx.fill(); } ctx.fillStyle='rgba(255,255,255,.28)'; ctx.fillRect(px-HW*.3,py-HH*.35,2*z,1*z); }
        if((front||left)&&!isB&&T.t!=='bridge'){ ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=2*z; ctx.beginPath(); if(front){ ctx.moveTo(px+HW,py+side+2*z); ctx.lineTo(px,py+HH+side+2*z); } if(left){ ctx.moveTo(px-HW,py+side+2*z); ctx.lineTo(px,py+HH+side+2*z); } ctx.stroke(); }
        if((s.mode==='place'||s.mode==='move')&&T.isl===s.uid&&T.t!=='bridge'){ ctx.strokeStyle='rgba(255,255,255,.28)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(px,py-HH); ctx.lineTo(px+HW,py); ctx.lineTo(px,py+HH); ctx.lineTo(px-HW,py); ctx.closePath(); ctx.stroke(); }
        if(s.mode==='land'&&T.isl===s.uid){ ctx.fillStyle='rgba(255,138,61,.16)'; ctx.beginPath(); ctx.moveTo(px,py-HH); ctx.lineTo(px+HW,py); ctx.lineTo(px,py+HH); ctx.lineTo(px-HW,py); ctx.closePath(); ctx.fill(); }
        ctx.globalAlpha=1;
      }
      };
      { const MG=280; const [cx,cy]=iso(s.cam.x,s.cam.y); const anim=s.rise||Object.keys(s.trise).length||Math.abs(s.tz-s.cam.z)>.003||window.__wNoCache; const key=s.mode+'|'+s.uid;
        if(anim){ drawTiles(g,-cx*z+s.vw/2,-cy*z+s.vh/2,s.vw,s.vh); s.tc=null; }
        else { const tc=s.tc; const ok=tc&&tc.W===s.W&&tc.key===key&&tc.vw===s.vw&&tc.vh===s.vh&&Math.abs(tc.z-z)<1e-4&&Math.abs((tc.cx-cx)*z)<MG*.8&&Math.abs((tc.cy-cy)*z)<MG*.8;
          if(!ok){ const c2=(tc&&tc.cv)||document.createElement('canvas'); c2.width=Math.round((s.vw+MG*2)*dpr); c2.height=Math.round((s.vh+MG*2)*dpr); const x2=c2.getContext('2d'); x2.setTransform(dpr,0,0,dpr,0,0); x2.clearRect(0,0,s.vw+MG*2,s.vh+MG*2);
            drawTiles(x2,-cx*z+s.vw/2+MG,-cy*z+s.vh/2+MG,s.vw+MG*2,s.vh+MG*2); s.tc={cv:c2,cx,cy,z,W:s.W,key,vw:s.vw,vh:s.vh}; }
          const T2=s.tc; g.drawImage(T2.cv,(T2.cx-cx)*z-MG,(T2.cy-cy)*z-MG,s.vw+MG*2,s.vh+MG*2); } }
      /* 땅 넓히기 후보 칸 */
      if(s.mode==='land'){ const pl=.5+.5*Math.sin(tm*4);
        for(const o of s.landC){ const [px,py]=scr(o.x,o.y); if(px<-HW||px>s.vw+HW||py<-HH||py>s.vh+HH) continue; const on=s.lsel&&s.lsel.k===o.k; const lift=on?-4*z:0;
          g.beginPath(); g.moveTo(px,py-HH*.86+lift); g.lineTo(px+HW*.86,py+lift); g.lineTo(px,py+HH*.86+lift); g.lineTo(px-HW*.86,py+lift); g.closePath();
          g.fillStyle=o.steal?'rgba(255,80,60,'+(on?.5:.18+pl*.1)+')':'rgba(255,255,255,'+(on?.55:.14+pl*.1)+')'; g.fill();
          g.setLineDash(on?[]:[4*z,3*z]); g.lineWidth=on?2.4:1.4; g.strokeStyle=o.steal?'#FFD54A':'rgba(255,255,255,.9)'; g.stroke(); g.setLineDash([]); } }
      /* 목적지 표시 */
      if(s.mark){ const [px,py]=scr(s.mark.x,s.mark.y); const k=((pnow-s.mark.at)/900)%1; g.strokeStyle='rgba(255,255,255,'+(.85-k*.6)+')'; g.lineWidth=2; g.beginPath(); g.ellipse(px,py,HW*(.25+k*.35),HH*(.25+k*.35),0,0,Math.PI*2); g.stroke(); g.fillStyle='rgba(255,138,61,.55)'; g.beginPath(); g.ellipse(px,py,HW*.16,HH*.16,0,0,Math.PI*2); g.fill(); }
      const ents=[]; const u=WCF.TW*z/17;
      s.isl.forEach(I=>{ const L=s.W.L.find(l=>l.uid===I.uid); if(!L) return;
        I.items.forEach(it=>{ const [w,h]=wSz(it); const gx=L.cx+it.x, gy=L.cy+it.y; ents.push({d:gx+gy+(w-1)/2+(h-1)/2,k:'i',it,gx,gy,w,h,own:I.uid===s.uid,seed:wStr(it.i)}); });
        wObstacles(I,I.uid).forEach(o=>{ const gx=L.cx+o.x, gy=L.cy+o.y; const T=s.W.T.get(gx+','+gy); if(!T||T.isl!==I.uid) return; ents.push({d:gx+gy,k:'ob',o,gx,gy,own:I.uid===s.uid,clr:I.clr&&I.clr.k===o.k?I.clr:null}); });
        ents.push({d:L.cx+L.cy+L.r+2,k:'name',gx:L.cx+L.r*.7,gy:L.cy+L.r*.7,I});
        const os=s.ospot[I.uid]; if(I.uid!==s.uid&&os&&!s.olc.has(I.uid)) ents.push({d:os[0]+os[1]+.05,k:'owner',gx:os[0],gy:os[1],uid:I.uid});
        I.items.forEach(it=>{ if(it.up&&it.up.end>t){ const [w,h]=wSz(it); ents.push({d:L.cx+it.x+L.cy+it.y+w+h-1.1,k:'builder',gx:L.cx+it.x+w-.4,gy:L.cy+it.y+h-.25,it}); } });
      });
      W_CDECO.forEach(([x,y,t2],i)=>{ const [w,h]=wSz({t:t2}); ents.push({d:x+y+(w-1)/2+(h-1)/2,k:'i',it:{t:t2,lv:1,i:'c'+i},gx:x,gy:y,w,h,seed:i*13}); });
      W_LM.forEach(l=>ents.push({d:l.x+l.y+2.9,k:'lm',l,gx:l.x+1,gy:l.y+1}));
      ents.push({d:s.me.x+s.me.y+.05,k:'me',gx:s.me.x,gy:s.me.y});
      (s.npcs||[]).forEach(n=>ents.push({d:n.x+n.y+.04,k:'npc',gx:n.x,gy:n.y,n}));
      (s.fnpc||[]).forEach(n=>ents.push({d:n.x+n.y+.04,k:'fn',gx:n.x,gy:n.y,n})); s.npcHit=[];
      for(const [uid,o] of s.olc) ents.push({d:o.x+o.y+.045,k:'ol',gx:o.x,gy:o.y,o});
      if(s.ghost){ const [w,h]=wSz(s.ghost); ents.push({d:s.ghost.gx+s.ghost.gy+(w-1)/2+(h-1)/2+.01,k:'ghost',gx:s.ghost.gx,gy:s.ghost.gy,w,h,gh:s.ghost}); }
      ents.sort((a,b)=>a.d-b.d);
      const labels=[]; s.lmHit=[];
      for(const e of ents){ const big=e.w>1||e.h>1; const cx=e.gx+((e.w||1)-1)/2, cy=e.gy+((e.h||1)-1)/2; const [px,py]=scr(cx,cy); const pad=big?260*z:160; if(px<-pad||px>s.vw+pad||py<-pad-60||py>s.vh+pad) continue;
        if(e.k==='i'){ const it=e.it; if(s.mode==='move'&&s.sel&&s.sel.i===it.i&&e.own) continue;
          const isSel=e.own&&s.sel&&s.sel.i===it.i; const sc0=W_SC[it.t]||1;
          if(isSel){ const pl=.5+.5*Math.sin(tm*6); g.strokeStyle='rgba(255,255,255,'+(.55+pl*.4)+')'; g.lineWidth=2.4; diamond(e.gx,e.gy,e.w,e.h); g.stroke(); }
          const building=it.up&&it.up.end>t; const pop=s.pop[it.i]; let sc=1;
          if(pop){ const k=(pnow-pop)/700; if(k>=1) delete s.pop[it.i]; else sc=wBack(k)*.25+.75+Math.sin(k*Math.PI)*.12; }
          if(isSel) sc*=1+Math.sin(tm*6)*.02;
          if(building&&it.lv===0){ g.save(); g.translate(px,py); g.scale(sc*sc0,sc*sc0); C0(g,u,tm); g.restore(); }
          else drawIt(itType(it,e.w,e.h),px,py,u,tm,e.seed,it.lv||1,it.r,sc*sc0);
          if(building){ const hk=Math.sqrt(sc0); wScaffold(g,px,py,u*sc0,tm,it.t==='hall'?14:W_BIG.has(it.t)?11:7); const tot=it.up.end-(it.up.st||it.up.end-1000); const p=Math.max(0,Math.min(1,1-(it.up.end-t)/Math.max(1,tot)));
            const by=py-u*(it.t==='hall'?22:18)*sc0; const bw=Math.max(54,u*13), bh=Math.max(7,u*1.6);
            g.fillStyle='rgba(10,16,30,.7)'; rr(g,px-bw/2-2,by-2,bw+4,bh+4,(bh+4)/2); g.fill(); g.fillStyle='#7CD957'; rr(g,px-bw/2,by,bw*p,bh,bh/2); g.fill();
            g.font='800 '+Math.max(10,u*2.3)+'px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.textBaseline='bottom'; g.fillStyle='#fff'; g.strokeStyle='rgba(0,0,0,.55)'; g.lineWidth=3; const tx=wFmtT((it.up.end-t)/1000); g.strokeText(tx,px,by-3); g.fillText(tx,px,by-3); }
          if(e.own&&it.t==='mine'&&it.lv>=1&&!building){ const st=wMineStock(it,t); if(st>=10){ const bb=Math.sin(tm*4)*u*.6; const bx=px, by=py-u*24+bb; g.fillStyle='#fff'; g.beginPath(); g.arc(bx,by,u*3.2,0,Math.PI*2); g.fill(); g.beginPath(); g.moveTo(bx-u*1.2,by+u*2.8); g.lineTo(bx,by+u*4.4); g.lineTo(bx+u*1.2,by+u*2.8); g.fill(); wBrick(g,bx,by,u*.9); } }
        }
        else if(e.k==='lm'){ const l=e.l; const [qx,qy]=scr(l.x+1,l.y+1); const near=s.lmNear===l.k; const bb=near?1+Math.sin(tm*5)*.012:1; drawIt('lm_'+l.k,qx,qy,u,tm,3,1,false,W_LMS*bb); if(near){ wLmDoorGlow(g,qx,qy,u*W_LMS,tm,l); } labels.push({l,x:qx,y:qy-u*W_LMS*(l.k==='pass'?27:l.k==='town'?20:l.k==='story'?24:l.dg?22:17)}); s.lmHit.push({k:l.k,x:qx,y:qy-u*7*W_LMS,r:Math.max(40,u*14)}); }
        else if(e.k==='ob'){ let sc=1; if(e.clr){ const k=1-Math.max(0,(e.clr.end-t)/W_OB_TIME); sc=1-k*.55; const sh=Math.sin(tm*30)*u*.4*(1-k); g.save(); g.translate(px+sh,py); g.scale(sc,sc); wDrawItem(g,e.o.t,0,0,u,tm,wStr(e.o.k),1); g.restore();
            if(Math.floor(tm*8)%2===0){ g.fillStyle='rgba(230,210,170,.7)'; g.beginPath(); g.arc(px+(wHash(Math.floor(tm*8),1,1)-.5)*u*8,py-u*2,u*1.4,0,Math.PI*2); g.fill(); }
            const bw=Math.max(46,u*11); g.fillStyle='rgba(10,16,30,.7)'; rr(g,px-bw/2-2,py-u*16-2,bw+4,10,5); g.fill(); g.fillStyle='#FFC233'; rr(g,px-bw/2,py-u*16,bw*k,6,3); g.fill(); }
          else { const isSel=e.own&&s.sel&&s.sel.ob===e.o.k; if(isSel){ g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=2.4; diamond(e.gx,e.gy,1,1); g.stroke(); } wDrawItem(g,e.o.t,px,py,u,tm,wStr(e.o.k),1); } }
        else if(e.k==='name'){ const nm0=(e.I.name||'').slice(0,12); g.font='900 '+Math.max(10,Math.round(u*2.4))+'px "NEXON Kart Gothic",sans-serif'; const tw=g.measureText(nm0).width+18; const y=py+u*2;
          g.fillStyle='rgba(255,247,230,.95)'; rr(g,px-tw/2,y,tw,u*4.2,u*1.2); g.fill(); g.fillStyle='#C9965A'; g.fillRect(px-tw/2,y+u*4.2-2,tw,2); g.fillStyle='#3A2410'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(nm0,px,y+u*2.2);
          g.fillStyle='#FF5A1A'; g.font='900 '+Math.max(9,Math.round(u*1.9))+'px "NEXON Kart Gothic",sans-serif'; g.fillText('본부 Lv.'+e.I.hallLv,px,y+u*5.6); }
        else if(e.k==='owner'){ const m2=(s.members||[]).find(x=>x.uid===e.uid); if(m2){ const zz=!isOnline(m2);
            if(zz){ const br=1+Math.sin(tm*1.6+e.gx)*.025; g.save(); g.translate(px,py); g.scale(1,br); g.translate(-px,-py); wDrawChar(g,px,py+u*.6,u*.95,avatarOf(m2),.45,0,false,dispName(m2)+' · 쿨쿨',false,{}); g.restore(); wSleepZ(g,px,py,u,tm,e.gx); }
            else wDrawChar(g,px,py,u*.95,avatarOf(m2),Math.sin(tm*.6+e.gx)*.8+.4,tm+e.gx,false,dispName(m2),false,{wave:Math.sin(tm*.5+e.gx)>.92}); } }
        else if(e.k==='builder') wDrawChar(g,px,py,u*.7,{base:'robot',color:'orange'},-2.4,tm,false,null,false,{hammer:true,hat:true});
        else if(e.k==='me'){ const em=s.me.emote&&pnow<s.me.emote; const hop=em?Math.abs(Math.sin((s.me.emote-pnow)/1400*Math.PI*3))*u*3:0; const bob=s.me.walk?Math.abs(Math.sin(s.me.ph*.5))*u*.7:Math.sin(tm*2)*u*.12; wDrawChar(g,px,py-hop-bob,u*.95,avatarOf(s.meM),em?0.4:s.me.yaw,tm,s.me.walk,dispName(s.meM),true,{wave:em,ph:s.me.ph,eq:rpgEqLook(rpgOf(s.meM))}); if(em&&s.me.emoji){ g.font=(u*5)+'px sans-serif'; g.textAlign='center'; g.fillText(s.me.emoji,px,py-u*22-hop); }  if(s.me.say&&Date.now()-s.me.say.at<7000) wBubble(g,px,py-u*21,s.me.say,u); }
        else if(e.k==='npc'){ const n=e.n; wDrawChar(g,px,py-(n.walk?Math.abs(Math.sin(n.ph*.5))*u*.6:0),u*.9,avatarOf(n.m),n.yaw,tm+n.x,n.walk,dispName(n.m),false,{wave:n.wave>pnow,ph:n.ph}); }
        else if(e.k==='fn'){ const n=e.n, D=n.def; wDrawChar(g,px,py-(n.walk?Math.abs(Math.sin(n.ph*.5))*u*.6:Math.sin(tm*2+n.x)*u*.12),u*.92,D.av,n.yaw,tm+n.x,n.walk,null,false,{ph:n.ph,wave:n.talk>pnow});
          const tg=D.n; g.font='900 '+Math.max(10,Math.round(u*2.4))+'px "NEXON Kart Gothic",sans-serif'; const tw=g.measureText(tg).width+20, th=Math.max(16,u*3.6), ty=py-u*17; g.fillStyle='rgba(255,252,244,.96)'; rr(g,px-tw/2,ty-th/2,tw,th,th/2); g.fill(); g.fillStyle=D.c; g.beginPath(); g.arc(px-tw/2+8,ty,3.4,0,Math.PI*2); g.fill(); g.fillStyle='#3A2410'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(tg,px+4,ty+1);
          if(D.gift&&!s.npcGot){ const by=py-u*23+Math.sin(tm*4)*u*.6; g.fillStyle='#FFD54A'; g.beginPath(); g.arc(px,by,u*2.2,0,Math.PI*2); g.fill(); g.fillStyle='#7A4E00'; g.font='900 '+Math.round(u*3)+'px sans-serif'; g.fillText('!',px,by+1); }
          if(n.say&&pnow<n.talk) wBubble(g,px,py-u*(D.gift&&!s.npcGot?27:21),{t:n.say},u);
          s.npcHit.push({id:D.id,x:px,y:py-u*8,r:Math.max(30,u*8)}); }
        else if(e.k==='ol'){ const o=e.o; wDrawChar(g,px,py-(o.walk?Math.abs(Math.sin(o.ph*.5))*u*.7:0),u*.95,avatarOf(o.m),o.yaw,tm+o.x,o.walk,dispName(o.m),false,{ph:o.ph,on:true,eq:rpgEqLook(rpgOf(o.m))}); if(o.say&&Date.now()-o.say.at<7000) wBubble(g,px,py-u*21,o.say,u); }
        else if(e.k==='ghost'){ const gh=e.gh; g.fillStyle=gh.ok?'rgba(124,217,87,.45)':'rgba(255,70,70,.45)'; diamond(e.gx,e.gy,e.w,e.h); g.fill(); g.strokeStyle=gh.ok?'rgba(200,255,180,.9)':'rgba(255,170,170,.9)'; g.lineWidth=2; g.stroke();
          g.save(); g.globalAlpha=.55+.25*Math.sin(tm*5); drawIt(itType(gh,e.w,e.h),px,py-u*(1+Math.sin(tm*5)*.6),u,tm,1,gh.lv||1,gh.r,W_SC[gh.t]||1); g.restore(); }
      }
      /* 나비 · 꽃잎 · 구름 그림자 (동화 느낌) */
      { const [c0x,c0y]=scr(-3,0); for(let i=0;i<7;i++){ const a=tm*.35+i*.9, rr2=(5+i*1.3)*WCF.TW*z*.5; const x=c0x+Math.cos(a)*rr2, y=c0y+Math.sin(a*1.3)*rr2*.45-u*6; if(x<-20||x>s.vw+20||y<-20||y>s.vh+20) continue; const fl=Math.abs(Math.sin(tm*14+i))*u*1.4+u*.3; g.fillStyle=['#FFD6E8','#FFF2A0','#CDEBFF','#E6D6FF'][i%4]; g.beginPath(); g.ellipse(x-fl*.6,y,fl,u*1.1,0,0,Math.PI*2); g.ellipse(x+fl*.6,y,fl,u*1.1,0,0,Math.PI*2); g.fill(); }
        if(z<1.3){ for(let i=0;i<3;i++){ const x=((wHash(i,4,7)*s.vw*1.6+tm*(9+i*4))%(s.vw+400))-200, y=wHash(i,9,7)*s.vh*.8; const NK=wNightK(); g.fillStyle='rgba(30,70,110,'+(.06*(1-NK*.6))+')'; g.beginPath(); g.ellipse(x+40,y+70,120,34,0,0,Math.PI*2); g.fill(); g.fillStyle=NK>.5?'rgba(196,204,255,.16)':'rgba(255,255,255,.42)'; g.beginPath(); for(const [dx,dy,r3] of [[0,0,36],[34,6,28],[-32,8,26],[12,-14,26],[0,10,30]]){ g.moveTo(x+dx+r3,y+dy); g.arc(x+dx,y+dy,r3,0,Math.PI*2); } g.fill(); } } }
      /* 명소 이름표 (늘 맨 위) */
      for(const L0 of labels){ const {l}=L0; const bob=Math.sin(tm*2+l.x)*u*.5; const x=L0.x, y=L0.y+bob; const gs=Math.max(22,u*6.2);
        g.save(); g.shadowColor='rgba(0,0,0,.35)'; g.shadowBlur=6; g.shadowOffsetY=3; const gg=g.createLinearGradient(x,y-gs/2,x,y+gs/2); gg.addColorStop(0,l.c[0]); gg.addColorStop(1,l.c[1]); g.fillStyle=gg; rr(g,x-gs/2,y-gs/2,gs,gs,gs*.3); g.fill(); g.restore();
        g.fillStyle='rgba(255,255,255,.28)'; rr(g,x-gs/2+2,y-gs/2+2,gs-4,gs*.42,gs*.26); g.fill(); g.strokeStyle='rgba(0,0,0,.25)'; g.lineWidth=2; rr(g,x-gs/2,y-gs/2,gs,gs,gs*.3); g.stroke();
        g.save(); g.translate(x-gs*.32,y-gs*.32); g.scale(gs*.64/24,gs*.64/24); g.strokeStyle='#fff'; g.lineWidth=2.4; g.lineCap='round'; g.lineJoin='round'; g.stroke(wIcon(l.ic)); g.restore();
        if(z>.55){ g.font='900 '+Math.max(10,Math.round(u*2.3))+'px "NEXON Kart Gothic",sans-serif'; const tw=g.measureText(l.n).width+14, th=Math.max(16,u*3.6); const ty=y+gs/2+4;
          g.fillStyle='rgba(12,14,24,.72)'; rr(g,x-tw/2,ty,tw,th,th/2); g.fill(); g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(l.n,x,ty+th/2+1); }
        s.lmHit.push({k:l.k,x,y,r:gs*.9}); }
      /* 땅 값 말풍선 */
      if(s.mode==='land'&&s.lsel){ const [px,py]=scr(s.lsel.x,s.lsel.y); const txt=(s.lsel.cost||0).toLocaleString(); g.font='900 13px "NEXON Kart Gothic",sans-serif'; const tw=g.measureText(txt).width+34; const y=py-HH-30-Math.sin(tm*4)*2;
        g.fillStyle=s.lsel.steal?'#FFD54A':'#fff'; rr(g,px-tw/2,y,tw,24,12); g.fill(); g.beginPath(); g.moveTo(px-5,y+23); g.lineTo(px,y+30); g.lineTo(px+5,y+23); g.fill(); wBrick(g,px-tw/2+13,y+10,2.4); g.fillStyle='#3A2410'; g.textAlign='left'; g.textBaseline='middle'; g.fillText(txt,px-tw/2+24,y+13); }
      /* 낮 · 노을 · 밤 */
      const night=wNightK(); const dusk=window.__wDay?0:wDuskK();
      if(dusk>0){ g.fillStyle='rgba(255,120,60,'+(dusk*.16)+')'; g.fillRect(0,0,s.vw,s.vh); }
      if(night>0){ const ng=g.createLinearGradient(0,0,0,s.vh); ng.addColorStop(0,'rgba(40,34,124,'+(night*.40)+')'); ng.addColorStop(.6,'rgba(26,40,110,'+(night*.30)+')'); ng.addColorStop(1,'rgba(14,44,96,'+(night*.24)+')'); g.fillStyle=ng; g.fillRect(0,0,s.vw,s.vh);
        { const mx=s.vw*.78, my=150; const mg=g.createRadialGradient(mx,my,0,mx,my,70); mg.addColorStop(0,'rgba(255,246,200,'+(.5*night)+')'); mg.addColorStop(1,'rgba(255,246,200,0)'); g.fillStyle=mg; g.fillRect(mx-70,my-70,140,140); g.fillStyle='rgba(255,248,214,'+(.95*night)+')'; g.beginPath(); g.arc(mx,my,15,0,Math.PI*2); g.fill(); g.fillStyle='rgba(220,226,255,'+(.25*night)+')'; g.beginPath(); g.arc(mx-5,my-3,3,0,Math.PI*2); g.arc(mx+5,my+5,2.2,0,Math.PI*2); g.fill(); }
        g.globalCompositeOperation='lighter'; for(const e of ents){ if(!(e.k==='lm'||(e.k==='i'&&e.it&&['lamp','fire','neon','house','hall','shop'].includes(e.it.t)))) continue; const cx=e.gx+((e.w||1)-1)/2+(e.k==='lm'?.5:0), cy=e.gy+((e.h||1)-1)/2+(e.k==='lm'?.5:0); const [px,py]=scr(cx,cy); if(px<-80||px>s.vw+80||py<-80||py>s.vh+80) continue;
          const rg=g.createRadialGradient(px,py-u*7,0,px,py-u*7,u*12); rg.addColorStop(0,'rgba(255,190,110,'+(.35*night)+')'); rg.addColorStop(1,'rgba(255,190,110,0)'); g.fillStyle=rg; g.fillRect(px-u*12,py-u*19,u*24,u*24); }
        g.globalCompositeOperation='source-over';
        for(let i=0;i<40;i++){ const x=wHash(i,9,9)*s.vw, y=wHash(i,5,5)*s.vh*.5; const tw=.5+.5*Math.sin(tm*2+i); g.fillStyle='rgba(255,255,255,'+(night*.7*tw)+')'; g.fillRect(x,y,i%7?1.6:2.4,i%7?1.6:2.4); } }
      /* 효과 */
      s.fx=s.fx.filter(f=>pnow-f.at<1600);
      for(const f of s.fx){ const [px,py]=scr(f.gx,f.gy); const k=(pnow-f.at)/1600;
        if(f.k==='txt'){ const y=py-u*16-k*u*14; g.globalAlpha=1-Math.max(0,k-.6)/.4; g.font='900 '+Math.max(14,u*3.6)+'px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.lineWidth=4; g.strokeStyle='rgba(40,20,0,.75)'; g.strokeText(f.txt,px+(f.ic?u*2:0),y); g.fillStyle='#FFE08A'; g.fillText(f.txt,px+(f.ic?u*2:0),y); if(f.ic==='brick') wBrick(g,px-g.measureText(f.txt).width/2-u*1.4,y,u*.9); g.globalAlpha=1; }
        else if(f.k==='burst'){ for(let i=0;i<22;i++){ const a=i/22*Math.PI*2+wHash(i,2,2), sp=(u*6+wHash(i,4,4)*u*10)*wEase(k*1.4); const x=px+Math.cos(a)*sp, y=py-u*8+Math.sin(a)*sp*.6+k*k*u*30;
            g.fillStyle=['#FF5A1A','#FFC233','#7CD957','#5AE0FF','#FF6B8A','#FFFFFF'][i%6]; g.globalAlpha=1-k; const s2=u*(1.4-k); g.fillRect(x-s2/2,y-s2/2,s2,s2); } g.globalAlpha=1;
          g.strokeStyle='rgba(255,255,255,'+(1-k)+')'; g.lineWidth=3*(1-k); g.beginPath(); g.ellipse(px,py,HW*(.6+k*1.4),HH*(.6+k*1.4),0,0,Math.PI*2); g.stroke(); }
        else if(f.k==='step'){ if(k>.35) continue; const kk=k/.35; g.fillStyle='rgba(240,228,200,'+((1-kk)*.6)+')'; g.beginPath(); g.arc(px-u*1.2,py-kk*u*1.5,u*(.8+kk*.8),0,Math.PI*2); g.arc(px+u*1.2,py-kk*u*1.2,u*(.6+kk*.6),0,Math.PI*2); g.fill(); }
        else if(f.k==='dust'){ for(let i=0;i<10;i++){ const a=i/10*Math.PI*2; const sp=u*8*wEase(k); g.fillStyle='rgba(235,220,190,'+(1-k)*.8+')'; g.beginPath(); g.arc(px+Math.cos(a)*sp,py-u*2+Math.sin(a)*sp*.5-k*u*4,u*(2-k),0,Math.PI*2); g.fill(); } }
        else if(f.k==='bricks'){ for(let i=0;i<8;i++){ const kk=Math.max(0,Math.min(1,(k*1.6-i*.06))); const sx=px, sy=py-u*14; const tx=f.tx, ty=f.ty; const x=sx+(tx-sx)*wEase(kk)+Math.sin(kk*Math.PI)*(i-4)*u*1.6, y=sy+(ty-sy)*wEase(kk)-Math.sin(kk*Math.PI)*u*12; if(kk>0&&kk<1) wBrick(g,x,y,u*.8); } }
      }
    };
    raf=requestAnimationFrame(frame);
    if(/^file:|localhost/.test(location.href)){ window.__wb=s; s.obs=wObstacles; }
    /* 가운데 섬을 돌아다니는 크루원들 (접속 중이 아닌 크루원) */
    const cTiles=[...s.W.T.values()].filter(t=>t.isl==='center'&&t.t!=='bridge'); const pick=()=>{ for(let i=0;i<20;i++){ const t=cTiles[Math.floor(Math.random()*cTiles.length)]; if(!s.blk.has(t.x+','+t.y)) return t; } return cTiles[0]; };
    s.pick=pick;
    s.npcs=(c.members||[]).filter(m=>m.uid!==c.uid&&!m.banned&&isOnline(m)).sort(()=>Math.random()-.5).slice(0,4).map(m=>{ const t=pick(); return {m,x:t.x,y:t.y,path:[],yaw:Math.random()*6,ty:0,wait:1+Math.random()*3,wave:0,ph:0,v:0}; });
    s.fnpc=W_NPC.map(D=>({def:D,x:D.home[0],y:D.home[1],path:[],yaw:Math.random()*6,ty:0,wait:1+Math.random()*3,ph:0,v:0,talk:0,say:null,li:0}));
    s.npcGot=lsGet(npcGiftKey(),'')==='1';
    const pts=new Map();
    const down=e=>{ el.setPointerCapture(e.pointerId); pts.set(e.pointerId,[e.clientX,e.clientY]); if(pts.size===1) s.drag={x:e.clientX,y:e.clientY,cx:s.cam.x,cy:s.cam.y,moved:false}; else if(pts.size===2){ const [a,b]=[...pts.values()]; s.pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),z:s.tz}; } };
    const move=e=>{ if(!pts.has(e.pointerId)) return; pts.set(e.pointerId,[e.clientX,e.clientY]);
      if(pts.size===2&&s.pinch){ const [a,b]=[...pts.values()]; const d=Math.hypot(a[0]-b[0],a[1]-b[1]); s.tz=Math.max(.42,Math.min(2.4,s.pinch.z*d/s.pinch.d)); if(s.drag) s.drag.moved=true; return; }
      const D=s.drag; if(!D) return; const dx=e.clientX-D.x, dy=e.clientY-D.y; if(Math.hypot(dx,dy)>6){ D.moved=true; s.follow=false; }
      if(D.moved){ const z=s.cam.z; const a=(-dx/z)/(WCF.TW/2), b=(-dy/z)/(WCF.TH/2); s.cam.x=D.cx+(a+b)/2; s.cam.y=D.cy+(b-a)/2; } };
    const up=e=>{ pts.delete(e.pointerId); if(pts.size<2) s.pinch=null; const D=s.drag; if(pts.size===0) s.drag=null; if(!D||D.moved) return;
      const r=el.getBoundingClientRect(); const sx=e.clientX-r.left, sy=e.clientY-r.top; const [wx,wy]=unscr(sx,sy); const tx=Math.round(wx), ty=Math.round(wy);
      s.onTap&&s.onTap(tx,ty,s.W.T.get(tx+','+ty),sx,sy); };
    const wheel=e=>{ e.preventDefault(); s.tz=Math.max(.42,Math.min(2.4,s.tz*(e.deltaY>0?.9:1.1))); };
    el.addEventListener('pointerdown',down); el.addEventListener('pointermove',move); el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up); el.addEventListener('wheel',wheel,{passive:false});
    return ()=>{ dead=true; cancelAnimationFrame(raf); ro.disconnect(); el.removeEventListener('pointerdown',down); el.removeEventListener('pointermove',move); el.removeEventListener('pointerup',up); el.removeEventListener('pointercancel',up); el.removeEventListener('wheel',wheel); };
  },[]);
  /* 크루원 섬 방문 보상: 섬마다 하루 한 번 벽돌 +15 */
  useEffect(()=>{ const s=S.current; if(!s||!mine) return; const T=s.W.T.get(Math.round(s.me.x)+','+Math.round(s.me.y)); if(!T||!T.isl||T.isl==='center'||T.isl===c.uid) return;
    const day=dayKey(); const V=mine.visits&&mine.visits.d===day?mine.visits:{d:day,ids:[]}; if(V.ids.includes(T.isl)||visRef.current[T.isl]===day) return; visRef.current[T.isl]=day;
    const o=isl.find(x=>x.uid===T.isl); save(mark('visit',{visits:{d:day,ids:[...V.ids,T.isl]},bricks:mine.bricks+15})); s.fx.push({k:'txt',gx:s.me.x,gy:s.me.y,at:performance.now(),txt:'+15',ic:'brick'}); c.notify((o?o.name:'크루원 섬')+' 방문 보상 · 벽돌 +15'); haptic(12); });
  /* 땅 넓히기 후보: 내 땅과 맞닿은 바다 · 다리 · 이웃 섬 가장자리 */
  const landC=useMemo(()=>{ if(!mine) return []; const T=W.T; const out=new Map(); const itemAt=new Set();
    isl.forEach(I=>{ const L=W.L.find(l=>l.uid===I.uid); if(L) I.items.forEach(it=>wCells(it).forEach(([a,b])=>itemAt.add((L.cx+a)+','+(L.cy+b)))); });
    for(const t of T.values()){ if(t.isl!==c.uid) continue; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const x=t.x+dx, y=t.y+dy, k=x+','+y; if(out.has(k)) continue; const u2=T.get(k);
      if(u2&&u2.isl===c.uid) continue; if(Math.hypot(x,y)<W_CR+1.5) continue; if(u2&&u2.isl==='center') continue;
      if(u2&&u2.isl){ const o=W.L.find(l=>l.uid===u2.isl); if(!o||Math.hypot(x-o.cx+.5,y-o.cy+.5)<W_PROTECT||itemAt.has(k)) continue; out.set(k,{x,y,k,steal:u2.isl}); }
      else out.set(k,{x,y,k,water:!u2}); } }
    return [...out.values()]; },[W,c.uid,!!mine,isl]);
  /* 렌더 상태 동기화 */
  useEffect(()=>{ const s=S.current; if(!s) return; s.W=W; s.isl=isl; s.mode=mode; s.members=c.members; s.meM=c.me; s.ghost=ghost; s.sel=sel; s.landC=landC; s.lsel=lsel;
    s.arrive=()=>sendHere(); s.onNear=k=>setNear(k);
    const blk=new Set(); const add=(x,y)=>{ const t0=W.T.get(x+','+y); if(t0&&(t0.t==='bridge'||t0.t==='path')) return; blk.add(x+','+y); };
    isl.forEach(I=>{ const L=W.L.find(l=>l.uid===I.uid); if(!L) return; I.items.forEach(it=>{ if(W_WALK.has(it.t)) return; wCells(it).forEach(([a,b])=>add(L.cx+a,L.cy+b)); }); wObstacles(I,I.uid).forEach(o=>{ if(o.t!=='ob_weed') add(L.cx+o.x,L.cy+o.y); }); });
    W_LM.forEach(l=>{ for(let i=0;i<3;i++) for(let j=0;j<3;j++) add(l.x+i,l.y+j); }); W_CDECO.forEach(([x,y,t])=>{ if(!W_WALK.has(t)) wCells({t},x,y).forEach(([a,b])=>add(a,b)); });
    s.blk=blk;
    isl.forEach(I=>{ const L=W.L.find(l=>l.uid===I.uid); if(!L) return; const sp=[[0,2],[1,2],[-1,2],[2,1],[2,0],[2,2],[-2,2],[0,3],[1,3],[3,0],[2,-1],[-3,0]].map(([a,b])=>[L.cx+a,L.cy+b]).find(([x,y])=>{ const T=W.T.get(x+','+y); return T&&T.isl===I.uid&&!blk.has(x+','+y); }); s.ospot[I.uid]=sp||[L.cx+2,L.cy+2]; });
    /* 접속 중인 크루원: 알려 준 위치까지 걸어가요 */
    const live=new Set();
    online.forEach(I=>{ const m=(c.members||[]).find(x=>x.uid===I.uid); if(!m) return; live.add(I.uid); const h=I.here; let o=s.olc.get(I.uid);
      if(!o){ o={x:h.x,y:h.y,tx:h.x,ty:h.y,path:[],yaw:0,ty0:0,ph:0,v:0,m}; o.ty=0; s.olc.set(I.uid,o); }
      o.m=m; o.say=h.say||null; if(o.tx!==h.x||o.ty0!==h.y){ o.tx=h.x; o.ty0=h.y; if(Math.hypot(h.x-o.x,h.y-o.y)>40){ o.x=h.x; o.y=h.y; o.path=[]; } else o.path=(s.route&&s.route(o.x,o.y,Math.round(h.x),Math.round(h.y)))||[[h.x,h.y]]; } });
    for(const k of [...s.olc.keys()]) if(!live.has(k)) s.olc.delete(k);
    if(s.npcs) s.npcs=s.npcs.filter(n=>!live.has(n.m.uid));
  });

  const myL=()=>S.current&&S.current.W.L.find(l=>l.uid===c.uid);
  const freeAt=(lx,ly,except,shape)=>{ if(!mine) return false; const L=myL(); if(!L) return false; const s=S.current;
    const occ=new Set(); mine.items.forEach(it=>{ if(it.i===except) return; wCells(it).forEach(([a,b])=>occ.add(a+','+b)); }); const obs=new Set(wObstacles(mine,c.uid).map(o=>o.k));
    return wCells(shape||{t:'tree'},lx,ly).every(([a,b])=>{ const T=s.W.T.get((L.cx+a)+','+(L.cy+b)); return T&&T.isl===c.uid&&T.t!=='bridge'&&!occ.has(a+','+b)&&!obs.has(a+','+b); }); };
  const findFree=shape=>{ for(let r=1;r<16;r++) for(let x=-r;x<=r;x++) for(let y=-r;y<=r;y++) if(Math.max(Math.abs(x),Math.abs(y))===r&&freeAt(x,y,null,shape)) return [x,y]; return null; };
  const spot=uid=>{ const s=S.current; const L=s&&s.W.L.find(l=>l.uid===uid); if(!L) return null; return s.ospot[uid]||[L.cx+2,L.cy+2]; };
  const goIsland=(uid,z)=>{ const p=spot(uid); if(p) S.current.jump(p[0],p[1],z||1.05); setCard(null); setSel(null); setLm(null); };
  const goMine=()=>goIsland(c.uid);
  const goCenter=()=>{ const s=S.current; s.jump(W_START[0],W_START[1],1); setCard(null); setSel(null); setLm(null); };
  const openLm=k=>{ const s=S.current; const l=W_LM.find(x=>x.k===k); if(!l||!s) return; const fr=[[l.x+1,l.y+3],[l.x,l.y+3],[l.x+2,l.y+3],[l.x+3,l.y+1],[l.x-1,l.y+1],[l.x+1,l.y-1]].sort((a,b)=>Math.hypot(a[0]-s.me.x,a[1]-s.me.y)-Math.hypot(b[0]-s.me.x,b[1]-s.me.y));
    for(const [x,y] of fr){ if(s.go(x,y)) break; } s.follow=true; setLm(k); setSel(null); setCard(null); haptic(8); };
  const enterLm=l=>{ haptic(14); if(l.dg){ startDg(l.dg); return; } const s=S.current; if(s){ const [cx2,cy2]=lmC(l); s.follow=false; s.cam.x+=(cx2-s.cam.x)*.5; s.cam.y+=(cy2-s.cam.y)*.5; s.tz=Math.min(2.2,s.cam.z*1.6); } wSfx('door'); setDoor(l); setLm(null); setTimeout(()=>{ onClose(); l.go(c); },950); };
  /* 주민 NPC와 이야기 · 우체부 피피는 하루 한 번 선물 */
  const talkNpc=id=>{ const s=S.current; if(!s) return; const n=(s.fnpc||[]).find(x=>x.def.id===id); if(!n) return; const D=n.def; n.say=D.lines[n.li++%D.lines.length]; n.talk=performance.now()+4600; n.path=[]; wSfx('npc'); haptic(8);
    setNpcT({id,t:n.say,k:Date.now()}); setLm(null); setSel(null);
    if(D.gift&&!s.npcGot&&mine){ s.npcGot=true; lsSet(npcGiftKey(),'1'); saveBricks(60); s.fx.push({k:'txt',gx:n.x,gy:n.y,at:performance.now(),txt:'+60',ic:'brick'}); wSfx('gem'); c.notify(D.n+'의 선물 · 벽돌 60개!'); }
    const tx=Math.round(n.x+1), ty=Math.round(n.y+1); s.follow=true; if(Math.hypot(s.me.x-n.x,s.me.y-n.y)>2.2) s.go(tx,ty); };
  /* 포털: 화면이 소용돌이로 덮이고 다른 세계로 넘어가요 */
  const startDg=async k=>{ if(tp) return; const D0=DG[k]; if(rpg.lv<D0.lv&&!(await dkoAsk(D0.n+'은(는) 추천 Lv.'+D0.lv+' 이상이에요. 지금 Lv.'+rpg.lv+' 이에요. 그래도 갈까요?'))) return;
    setLm(null); setSel(null); setCard(null); setChat(false); setTp({k,dir:'in',key:Date.now()}); haptic([20,40,60]); wSfx('tp');
    setTimeout(()=>{ const s=S.current; if(s) s.paused=true; setDg(k); },750); setTimeout(()=>setTp(null),1600); };
  const exitDg=()=>{ const k=dg; setTp({k,dir:'out',key:Date.now()}); wSfx('tp'); setTimeout(()=>wBgm('world'),700); setTimeout(()=>{ setDg(null); const s=S.current; if(s){ s.paused=false; s.wake&&s.wake(); const l=W_LM.find(x=>x.dg===k); if(l) s.jump(l.x+1,l.y+4,1); sendHere(true); } },750); setTimeout(()=>setTp(null),1600); };
  const saveBricks=n=>{ const cc=cRef.current; const I=(cc.islands||[]).find(x=>x.uid===cc.uid); const b0=I?(I.bricks==null?W_START_BRICKS:I.bricks):0; return cc.saveIsland({bricks:b0+n}); };
  /* 월드 채팅: 접속한 크루의 말풍선을 모아 보여 줘요 */
  const sendSay=(t,emo)=>{ t=String(t||'').trim().slice(0,60); if(!t) return; const s=S.current; s.me.say={t,at:Date.now()}; if(emo){ s.me.emote=performance.now()+1400; s.me.emoji=t; } pingAt.current=0; sendHere(true); c.sendMessage(t,'world'); setCtext(''); haptic(8); tick(x=>x+1); };
  const sendStk=id=>{ const s=S.current; s.me.say={st:id,t:'',at:Date.now()}; s.me.emote=performance.now()+1200; s.me.emoji=null; pingAt.current=0; sendHere(true); c.sendSticker(id,'world'); haptic(10); tick(x=>x+1); };
  isl.forEach(I=>{ const h=I.here; if(h&&h.say&&h.say.t&&I.uid!==c.uid){ const k=I.uid+':'+h.say.at; if(!logRef.current.has(k)) logRef.current.set(k,{uid:I.uid,t:h.say.t,at:h.say.at}); } });
  const log=[...logRef.current.values()].sort((a,b)=>a.at-b.at).slice(-40);
  /* 새 단장 환영: 타운 → 월드 */
  useEffect(()=>{ if(!mine) return; let seen=false; try{ seen=localStorage.getItem('dko-world26')==='1'; }catch(e){} if(!seen&&!rpg.welcome) setTimeout(()=>setWelcome(true),1700); },[!!mine]);
  const takeWelcome=()=>{ try{ localStorage.setItem('dko-world26','1'); }catch(e){} setWelcome(false); if(rpg.welcome) return;
    c.saveRpg(r=>({welcome:true,inv:{...r.inv,weapon_b:(r.inv.weapon_b||0)+1,shield_b:(r.inv.shield_b||0)+1},eq:{...r.eq,weapon:r.eq.weapon||'weapon_b',shield:r.eq.shield||'shield_b'}}),'오픈 선물 · 브론즈 소드와 브론즈 방패를 장착했어요!');
    saveBricks(500); const s=S.current; if(s) s.fx.push({k:'burst',gx:s.me.x,gy:s.me.y,at:performance.now()}); haptic([20,40,80]); };
  /* 장비 사기 (월드 상점 → 장비) */
  const buyEq=(slot,ti)=>{ const T=EQ_T[ti]; const price=EQ_PRICE[slot][ti]; const id=eqId(slot,T.k);
    if(!price){ c.notify('골드 장비는 헬바운드 보스만 떨어뜨려요.','err'); return; } if(ti>=1&&mine.hallLv<2){ c.notify('실버 장비는 섬 본부 Lv.2부터 살 수 있어요.','err'); return; }
    pay({b:price},()=>{ save({bricks:bricks-price}); c.saveRpg(r=>({inv:{...r.inv,[id]:(r.inv[id]||0)+1},eq:r.eq[slot]?r.eq:{...r.eq,[slot]:id}}),eqName(id)+'을(를) 샀어요!'); haptic(14); }); };
  const startLand=()=>{ if(!mine) return; setMode('land'); setSel(null); setCard(null); setLm(null); setLsel(null); setHint(false); const L=myL(); if(L) S.current.jump(L.cx+2,L.cy+2,.72); };
  const endLand=()=>{ setMode('view'); setLsel(null); };
  /* 탭 처리 */
  useEffect(()=>{ const s=S.current; if(!s) return;
    s.onTap=(tx,ty,T,sx,sy)=>{
      const L=myL();
      if(mode==='land'){ const k=tx+','+ty; const o=landC.find(x=>x.k===k); if(o){ const n=mine.land.length; setLsel({...o,cost:o.steal?wStealCost(n):wLandCost(n)}); haptic(6); } else setLsel(null); return; }
      if(mode==='place'||mode==='move'){ if(!L||!T||T.isl!==c.uid) return; setGhost(g=>{ if(!g) return g; const [w,h]=wSz(g); const lx=tx-L.cx-Math.floor((w-1)/2), ly=ty-L.cy-Math.floor((h-1)/2); return {...g,gx:L.cx+lx,gy:L.cy+ly,lx,ly,ok:freeAt(lx,ly,mode==='move'&&sel?sel.i:null,g)}; }); haptic(4); return; }
      const nh=(s.npcHit||[]).filter(h=>Math.hypot(h.x-sx,h.y-sy)<h.r).sort((a,b)=>Math.hypot(a.x-sx,a.y-sy)-Math.hypot(b.x-sx,b.y-sy))[0]; if(nh){ talkNpc(nh.id); return; }
      const hit=(s.lmHit||[]).filter(h=>Math.hypot(h.x-sx,h.y-sy)<h.r).sort((a,b)=>Math.hypot(a.x-sx,a.y-sy)-Math.hypot(b.x-sx,b.y-sy))[0];
      if(hit){ openLm(hit.k); return; }
      const lmT=W_LM.find(l=>tx>=l.x&&tx<=l.x+2&&ty>=l.y&&ty<=l.y+2); if(lmT){ openLm(lmT.k); return; }
      if(T&&T.isl===c.uid&&mine&&L){ const lx=tx-L.cx, ly=ty-L.cy; const it=mine.items.find(x=>wCells(x).some(([a,b])=>a===lx&&b===ly)); const ob=wObstacles(mine,c.uid).find(o=>o.x===lx&&o.y===ly);
        if(it){ if(it.t==='mine'&&it.lv>=1&&!(it.up&&it.up.end>Date.now())&&wMineStock(it,Date.now())>=1&&(!sel||sel.i!==it.i)){ collect(it); } setSel({i:it.i}); setCard(null); setLm(null); haptic(8); return; }
        if(ob){ setSel({ob:ob.k}); setCard(null); setLm(null); haptic(8); return; } }
      setSel(null); setLm(null);
      if(T){ const owner=isl.find(I=>I.uid!==c.uid&&T.isl===I.uid); setCard(null); if(owner){ const p=s.ospot[owner.uid]; if(p&&Math.hypot(p[0]-tx,p[1]-ty)<1.6) setCard(owner.uid); } }
      s.follow=true; s.go(tx,ty);
    }; });

  /* 행동 */
  const bricks=mine?mine.bricks:0; const coins=coinsOf(c.me);
  const builders=mine?wBuilders(mine):1, busy=mine?wBusy(mine,now):0;
  const pay=(cost,cb)=>{ if(cost.b&&bricks<cost.b){ c.notify('벽돌이 '+(cost.b-bricks)+'개 모자라요. 벽돌 공방에서 모아 보세요.','err'); return; }
    if(cost.d){ if(coins<cost.d){ c.notify('D-Coin이 '+(cost.d-coins)+'개 모자라요.','err'); return; } c.worldCoins(-cost.d).then(ok=>{ if(ok) cb(); }); return; } cb(); };
  const collect=it=>{ const st=wMineStock(it,Date.now()); if(st<1) return; const items=mine.items.map(x=>x.i===it.i?{...x,c:Date.now()}:x); save(mark('col',{items,bricks:bricks+st})); haptic(12);
    const s=S.current, L=myL(); if(s&&L){ const el=document.querySelector('.wb20-res .bk'); const r=el?el.getBoundingClientRect():{left:30,top:40,width:20,height:20}; s.fx.push({k:'bricks',gx:L.cx+it.x+.5,gy:L.cy+it.y+.5,at:performance.now(),tx:r.left+r.width/2,ty:r.top+r.height/2}); s.fx.push({k:'txt',gx:L.cx+it.x+.5,gy:L.cy+it.y+.5,at:performance.now(),txt:'+'+st,ic:'brick'}); } };
  const startPlace=(t,isGift)=>{ if(!mine) return; const C=W_CAT[t]; const hl=mine.hallLv;
    if(isGift){ const sh={t}; const f=findFree(sh); if(!f){ c.notify('놓을 빈 땅이 없어요. 땅을 넓히거나 장애물을 치워 보세요.','err'); return; } const [lx,ly]=f; const L=myL(); setShop(false); setSel(null); setLm(null); setMode('place'); setGhost({t,gx:L.cx+lx,gy:L.cy+ly,lx,ly,ok:true,gift:true}); S.current.jump(L.cx+lx+1,L.cy+ly+1); return; }
    if(wCount(mine,t)>=wMaxOf(t,hl)){ c.notify(C.req&&hl<C.req?'섬 본부 '+C.req+'레벨이 필요해요.':'지금은 더 지을 수 없어요. 본부를 올려 보세요.','err'); return; }
    if((C.cat==='deco'||C.cat==='gem')&&wDecoCount(mine)>=W_DECO_MAX[hl]){ c.notify('장식은 본부 '+hl+'레벨에서 '+W_DECO_MAX[hl]+'개까지예요.','err'); return; }
    if(C.time&&busy>=builders){ c.notify('건축가가 모두 일하는 중이에요. 끝나거나 시간을 단축하면 지을 수 있어요.','err'); return; }
    if(C.b&&bricks<C.b){ c.notify('벽돌이 '+(C.b-bricks)+'개 모자라요.','err'); return; } if(C.d&&coins<C.d){ c.notify('D-Coin이 '+(C.d-coins)+'개 모자라요.','err'); return; }
    const sh={t}; const f=findFree(sh); if(!f){ c.notify('놓을 빈 땅이 없어요. 땅을 넓히거나 장애물을 치워 보세요.','err'); return; } const [lx,ly]=f; const L=myL(); setShop(false); setSel(null); setLm(null); setMode('place'); setGhost({t,gx:L.cx+lx,gy:L.cy+ly,lx,ly,ok:true});
    S.current.jump(L.cx+lx+1,L.cy+ly+1); };
  const confirmPlace=()=>{ const gh=ghost; if(!gh||!gh.ok) return; const C=W_CAT[gh.t];
    if(mode==='move'){ const items=mine.items.map(x=>x.i===sel.i?{...x,x:gh.lx,y:gh.ly,r:gh.r?1:0}:x); save({items}); S.current.pop[sel.i]=performance.now(); setMode('view'); setGhost(null); haptic(10); return; }
    if(gh.gift){ c.takeWorldGift({item:gh.t}).then(ok=>{ if(!ok){ c.notify('선물함에 그 장식이 없어요.','err'); return; } const id=gh.t+Date.now().toString(36); const rr0=gh.r?{r:1}:{};
        save({items:[...mine.items,{i:id,t:gh.t,x:gh.lx,y:gh.ly,lv:1,...rr0}]},wName(gh.t)+'을(를) 놓았어요!'); const s=S.current; const [w,h]=wSz(gh); s.pop[id]=performance.now(); s.fx.push({k:'burst',gx:gh.gx+(w-1)/2,gy:gh.gy+(h-1)/2,at:performance.now()}); setMode('view'); setGhost(null); setSel({i:id}); haptic(14); }); return; }
    pay({b:C.b||0,d:C.d||0},()=>{ const id=gh.t+Date.now().toString(36); const t=Date.now(); const rr0=gh.r?{r:1}:{};
      const it=C.time?{i:id,t:gh.t,x:gh.lx,y:gh.ly,lv:0,...rr0,up:{to:1,st:t,end:t+C.time*1000}}:{i:id,t:gh.t,x:gh.lx,y:gh.ly,lv:1,...rr0};
      if(gh.t==='mine'&&!C.time) it.c=t;
      save({items:[...mine.items,it],bricks:bricks-(C.b||0)},C.time?wName(gh.t)+' 공사를 시작했어요!':null);
      const s=S.current; const [w,h]=wSz(gh); s.pop[id]=performance.now(); s.fx.push({k:'dust',gx:gh.gx+(w-1)/2,gy:gh.gy+(h-1)/2,at:performance.now()}); if(!C.time) s.fx.push({k:'burst',gx:gh.gx+(w-1)/2,gy:gh.gy+(h-1)/2,at:performance.now()});
      setMode('view'); setGhost(null); setSel({i:id}); haptic(14); }); };
  const cancelPlace=()=>{ setMode('view'); setGhost(null); };
  const rotGhost=()=>setGhost(g0=>{ if(!g0) return g0; const n={...g0,r:!g0.r}; n.ok=freeAt(n.lx,n.ly,mode==='move'&&sel?sel.i:null,n); return n; });
  const selIt=sel&&sel.i&&mine?mine.items.find(x=>x.i===sel.i):null;
  const selOb=sel&&sel.ob&&mine?wObstacles(mine,c.uid).find(o=>o.k===sel.ob):null;
  const canRot=t=>{ const s0=W_SZ[t]; return !!s0&&s0[0]!==s0[1]; };
  const rotate=it=>{ const n={...it,r:it.r?0:1}; if(!freeAt(it.x,it.y,it.i,n)){ c.notify('돌릴 자리가 없어요. 옮기기로 자리를 바꿔 보세요.','err'); return; } save({items:mine.items.map(x=>x.i===it.i?n:x)}); S.current.pop[it.i]=performance.now(); haptic(8); };
  const upgrade=it=>{ const C=W_CAT[it.t]; const to=it.lv+1; const cost=C.up[to], tm=C.ut[to];
    if(it.t!=='hall'&&C.lvMax>1&&to>mine.hallLv){ c.notify('섬 본부를 Lv.'+to+'로 먼저 올려 주세요.','err'); return; }
    if(busy>=builders){ c.notify('건축가가 모두 일하는 중이에요.','err'); return; }
    pay({b:cost},()=>{ const t=Date.now(); const items=mine.items.map(x=>x.i===it.i?{...x,up:{to,st:t,end:t+tm*1000},...(x.t==='mine'?{c:t}:{})}:x);
      const extra=it.t==='mine'?wMineStock(it,t):0;
      save({items,bricks:bricks-cost+extra},wName(it.t)+' Lv.'+to+' 업그레이드를 시작했어요!'); setInfo(null); haptic(14);
      const L=myL(); if(L) S.current.fx.push({k:'dust',gx:L.cx+it.x,gy:L.cy+it.y,at:performance.now()}); }); };
  const speed=async it=>{ const rem=(it.up.end-Date.now())/1000; const d=wSpeedCost(rem);
    if(!(await dkoAsk('D-Coin '+d+'개로 남은 '+wFmtT(rem)+'을(를) 바로 끝낼까요?'))) return;
    pay({d},()=>{ const items=mine.items.map(x=>x.i===it.i?{...x,up:{...x.up,end:Date.now()-1}}:x); save({items}); }); };
  const remove=async it=>{ const C=W_CAT[it.t]; if(C.cat!=='deco'&&C.cat!=='gem') return; if(!(await dkoAsk(wName(it.t)+'을(를) 치울까요? '+(C.b?'벽돌 '+Math.floor(C.b/2)+'개를 돌려받아요.':'스페셜 장식은 돌려받을 수 없어요.')))) return;
    save({items:mine.items.filter(x=>x.i!==it.i),bricks:bricks+(C.b?Math.floor(C.b/2):0)}); const L=myL(); if(L) S.current.fx.push({k:'dust',gx:L.cx+it.x,gy:L.cy+it.y,at:performance.now()}); setSel(null); };
  const clearOb=o=>{ if(mine.clr&&mine.clr.end>Date.now()){ c.notify('지금 다른 장애물을 치우는 중이에요.','err'); return; } const ob=W_OB[o.t];
    pay({b:ob.cost},()=>{ save(mark('ob',{bricks:bricks-ob.cost,clr:{k:o.k,t:o.t,end:Date.now()+W_OB_TIME}})); setSel(null); haptic(10); }); };
  const expand=()=>{ setInfo(null); startLand(); };
  const landN=mine?mine.land.length:0, landMax=mine?W_LAND_MAX[Math.min(5,mine.hallLv)]:0;
  const buyLand=async o=>{ if(!o||!mine) return; if(landN>=landMax){ c.notify('본부 Lv.'+mine.hallLv+'에서는 땅을 '+landMax+'칸까지 넓힐 수 있어요. 본부를 올려 보세요.','err'); return; }
    const cost=o.steal?wStealCost(landN):wLandCost(landN); const owner=o.steal&&isl.find(I=>I.uid===o.steal);
    if(o.steal&&!(await dkoAsk((owner?owner.name:'이웃 섬')+'의 가장자리 한 칸을 벽돌 '+cost.toLocaleString()+'개에 살까요? 판 사람은 절반을 벽돌로 받아요.'))) return;
    const L=myL(); if(!L) return; const k=(o.x-L.cx)+','+(o.y-L.cy);
    pay({b:cost},()=>{ const e={k,at:Date.now()}; if(o.steal){ e.from=o.steal; e.p=cost; }
      save({land:[...mine.land,e],bricks:bricks-cost},o.steal?(owner?owner.name:'이웃 섬')+'에서 땅 한 칸을 샀어요!':'땅이 한 칸 넓어졌어요!');
      const s=S.current; s.trise[o.k]=performance.now(); s.fx.push({k:'burst',gx:o.x,gy:o.y,at:performance.now()+300}); setLsel(null); haptic(16); }); };
  const rename=()=>{ const v=(nm||'').trim().slice(0,14); if(!v) return; save({name:v},'섬 이름을 바꿨어요.'); setNm(null); };
  const locName=h=>{ const s=S.current; if(!h||!s) return ''; if(h.zone&&DG[h.zone]) return DG[h.zone].n+'에서 사냥 중'; const T=s.W.T.get(Math.round(h.x)+','+Math.round(h.y)); const l=W_LM.find(l=>Math.hypot(l.x+1-h.x,l.y+1-h.y)<3.6); if(l) return l.n+' 앞';
    if(!T) return '바다 위'; if(T.isl==='center') return '가운데 섬'; if(!T.isl) return '다리 위'; if(T.isl===c.uid) return '내 섬'; const o=isl.find(I=>I.uid===T.isl); return o?o.name:'크루 섬'; };

  const cs=card&&isl.find(x=>x.uid===card); const cm=card&&c.members.find(x=>x.uid===card);
  const C0d=selIt&&W_CAT[selIt.t]; const inProg=selIt&&selIt.up&&selIt.up.end>now;
  const canUp=selIt&&C0d&&C0d.lvMax>1&&selIt.lv<C0d.lvMax&&!inProg&&selIt.lv>=1;
  const lmD=lm&&W_LM.find(x=>x.k===lm);
  const totStock=mine?mine.items.filter(it=>it.t==='mine'&&!(it.up&&it.up.end>now)).reduce((s0,it)=>s0+wMineStock(it,now),0):0;
  const meHere=S.current?{x:S.current.me.x,y:S.current.me.y}:null;
  return ReactDOM.createPortal(html`<div className="wb20">
    <canvas ref=${cv} className="wb20-cv" aria-label="DKO 월드"></canvas>
    <div className="wb20-top">
      <button className="wb20-ib tap" onClick=${leave} aria-label="나가기"><${Icon} n="chevL" s=${20} w=${2.4}/></button>
      <div className="wb20-tt"><b>DKO 월드</b><span>섬 ${isl.length}개 · ${(()=>{ const h=new Date().getHours(); return h>=19||h<6?'밤':h>=17?'노을':'낮'; })()}</span></div>
      <button className="wb20-ib tap wo26-btn" onClick=${()=>setPpl(true)} aria-label="접속 중인 크루"><${Icon} n="users" s=${18}/><em>${online.length+1}</em></button>
      <button className="wb20-ib tap wb23-msn" onClick=${()=>setMsn(true)} aria-label="오늘의 섬 미션"><${Icon} n="target" s=${18}/>${mine&&!dayD(mine).got&&['col','ob','visit'].every(k=>dayD(mine)[k])?html`<i></i>`:null}</button>
      <button className="wb20-ib tap" onClick=${()=>setRank(true)} aria-label="섬 랭킹"><${Icon} n="trophy" s=${18}/></button>
      <button className="wb20-ib tap" onClick=${()=>setWset(true)} aria-label="월드 설정"><${Icon} n="gear" s=${18}/></button>
      <div className="wb20-res">
        <span className="bk"><${BrickIc} s=${18}/><b>${bricks.toLocaleString()}</b></span>
        <span className="dc"><${Coin} s=${16}/><b>${coins.toLocaleString()}</b></span>
        <span className="bd" title="건축가"><${Icon} n="tool" s=${14} w=${2.4}/><b>${builders-busy}/${builders}</b></span>
      </div>
    </div>
    ${hint&&mode==='view'&&!sel&&!lm?html`<div className="wb20-hint" onClick=${()=>setHint(false)}><b>섬을 키우고, 가운데 섬 명소로 놀러 가요!</b> 명소를 누르면 걸어가서 상점 · 채팅 · 커뮤니티로 들어가요. 땅 넓히기로 바다까지 섬을 키울 수 있어요.<${Icon} n="x" s=${14}/></div>`:null}
    ${mode==='view'&&!sel&&!lm&&!dg?html`<div className="wd26">
      ${totStock>=10?html`<button className="wd26-col tap" onClick=${()=>{ const t=Date.now(); const items=mine.items.map(x=>x.t==='mine'&&x.lv>=1&&!(x.up&&x.up.end>t)?{...x,c:t}:x); save({items,bricks:bricks+totStock}); haptic(14); const s=S.current, L=myL(); if(s&&L) s.fx.push({k:'txt',gx:L.cx,gy:L.cy,at:performance.now(),txt:'+'+totStock,ic:'brick'}); c.notify('벽돌 '+totStock+'개를 모았어요!'); }}><${BrickIc} s=${18}/>모두 모으기 <b>+${totStock}</b></button>`:null}
      <div className="wd26-bar">
        <button className="wd26-b tap" onClick=${()=>{ if(giftN) setStab('gift'); setShop(true); haptic(8); }}><span className="wd26-i"><${Icon} n="bag" s=${20} w=${2.2}/>${giftN?html`<em className="wd26-gf">${giftN}</em>`:null}</span><small>상점</small></button>
        <button className="wd26-b tap" onClick=${()=>{ setPpl(true); haptic(6); }}><span className="wd26-i"><${Icon} n="map" s=${20} w=${2.2}/>${online.length?html`<em className="wd26-on">${online.length}</em>`:null}</span><small>위치</small></button>
        <button className="wd26-shop tap" onClick=${()=>{ goMine(); haptic(10); }}><span className="wd26-si"><${Icon} n="home" s=${30} w=${2.3}/></span><b>내 섬</b></button>
        <button className="wd26-b tap" onClick=${()=>{ setEdit('menu'); haptic(6); }}><span className="wd26-i"><${Icon} n="edit" s=${19} w=${2.2}/></span><small>편집</small></button>
        <button className=${'wd26-b tap'+(chat?' on':'')} onClick=${()=>{ setChat(!chat); haptic(6); }}><span className="wd26-i"><${Icon} n="chat" s=${20} w=${2.2}/></span><small>채팅</small></button>
      </div>
    </div>`:null}
    ${chat&&mode==='view'&&!dg?html`<${WChat} c=${c} onSay=${sendSay} onSticker=${sendStk} onClose=${()=>setChat(false)} where=${(online.length+1)+'명 · 말풍선으로 떠요'}/>`:null}
    ${ctl==='joy'&&mode==='view'&&!dg&&!chat&&!hallIn?html`<${Joy} onMove=${(x,y)=>{ const s=S.current; if(s) s.joy=[x,y]; }}/>`:null}
    ${near&&mode==='view'&&!dg&&!lm&&!sel&&!chat?(()=>{ const l=W_LM.find(x=>x.k===near); return l?html`<button className="wnr30 tap" key=${l.k} style=${{'--g1':l.c[0],'--g2':l.c[1]}} onClick=${()=>enterLm(l)}><span className="gi30"><${Icon} n=${l.ic} s=${18} w=${2.3}/></span><b>${l.n}</b><em>${l.dg?'포털 타기':'들어가기'}<${Icon} n="chev" s=${14} w=${2.8}/></em></button>`:null; })():null}
    ${npcT&&mode==='view'&&!wset&&!chat&&!shop&&!edit&&!ppl&&!msn&&!rank&&!hallIn&&!cedit&&!info?(()=>{ const D=W_NPC.find(x=>x.id===npcT.id); return D?html`<div className="wnp30" key=${npcT.k} style=${{'--n':D.c}} onClick=${()=>talkNpc(D.id)}><span className="wnp30-n">${D.n}</span><p>${npcT.t}</p><small>눌러서 다음 이야기</small><button className="tap" onClick=${e=>{ e.stopPropagation(); setNpcT(null); }} aria-label="닫기"><${Icon} n="x" s=${14} w=${2.8}/></button></div>`:null; })():null}
    ${wset?html`<${WSet} onClose=${()=>setWset(false)}/>`:null}
    ${door?html`<${WDoor} l=${door}/>`:null}
    ${hallIn?html`<${HallRoom} c=${c} I=${mine} onClose=${()=>setHallIn(false)}/>`:null}
    ${edit==='menu'?html`<div className="wb20-shade" onClick=${()=>setEdit(null)}><div className="wbs we26" onClick=${e=>e.stopPropagation()}>
      <div className="wbs-h"><b>편집</b><span className="wbs-sub">내 땅 또는 캐릭터</span><button className="wbi-x tap" onClick=${()=>setEdit(null)} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
      <div className="we26-g">
        <button className="we26-c tap ch" onClick=${()=>{ setEdit(null); setCedit('eq'); }}><span className="gi30" style=${{'--g1':'#FFB15C','--g2':'#E8420A'}}><${Icon} n="sword" s=${24} w=${2.2}/></span><b>캐릭터</b><small>스킨 · 장비(소드 · 헬름 · 아머 · 그리브 · 방패)</small></button>
        <button className="we26-c tap" onClick=${()=>{ setEdit(null); startLand(); }}><span className="gi30" style=${{'--g1':'#8EE06A','--g2':'#2F9A3A'}}><${Icon} n="expand" s=${22} w=${2.2}/></span><b>땅 넓히기</b><small>바다 · 이웃 가장자리</small></button>
        <button className="we26-c tap" onClick=${()=>{ setEdit(null); setStab('build'); setShop(true); }}><span className="gi30" style=${{'--g1':'#7CC2FF','--g2':'#2563EB'}}><${Icon} n="tool" s=${22} w=${2.2}/></span><b>짓기 · 꾸미기</b><small>건물 · 장식 놓기</small></button>
        <button className="we26-c tap" onClick=${()=>{ setEdit(null); goMine(); const h=mine&&mine.items.find(x=>x.t==='hall'); if(h){ setSel({i:h.i}); setInfo({i:h.i}); } }}><span className="gi30" style=${{'--g1':'#C29BFF','--g2':'#6A3FD8'}}><${Icon} n="home" s=${22} w=${2.2}/></span><b>내 섬 정보</b><small>본부 · 섬 이름</small></button>
        <button className="we26-c tap" onClick=${()=>{ setEdit(null); setHallIn(true); }}><span className="gi30" style=${{'--g1':'#FFD27A','--g2':'#E0731A'}}><${Icon} n="exit" s=${22} w=${2.2}/></span><b>마을회관 들어가기</b><small>트로피 · 장비 · 섬 기록</small></button>
      </div></div></div>`:null}
    ${cedit?html`<${CharEdit} c=${c} tab=${cedit} onClose=${()=>setCedit(null)}/>`:null}
    ${lmD&&mode==='view'?html`<div className="wlm26" key=${lmD.k} style=${{'--g1':lmD.c[0],'--g2':lmD.c[1]}}>
      <span className="gi30 wlm26-ic"><${Icon} n=${lmD.ic} s=${26} w=${2.2}/></span>
      <div className="wlm26-t"><em>DKO 월드 명소</em><b>${lmD.n}</b><small>${lmD.d}</small></div>
      <button className="wlm26-go tap" onClick=${()=>enterLm(lmD)}>들어가기</button>
      <button className="wlm26-x tap" onClick=${()=>setLm(null)} aria-label="닫기"><${Icon} n="x" s=${15} w=${2.8}/></button>
    </div>`:null}
    ${mode==='land'?html`<div className="wl26">
      <div className="wl26-top"><span className="gi30 wl26-ti" style=${{'--g1':'#FFB15C','--g2':'#E8420A'}}><${Icon} n="expand" s=${18} w=${2.3}/></span><div className="wl26-tt"><b>땅 넓히기</b><small>내 땅 ${landN}/${landMax}칸 · 본부 Lv.${mine?mine.hallLv:1}</small></div><button className="wl26-x tap" onClick=${endLand}>완료</button></div>
      <div className="wl26-bot">${lsel?html`<div className=${'wl26-sel'+(lsel.steal?' st':'')} key=${lsel.k}>
          <div className="wl26-st"><b>${lsel.steal?((isl.find(I=>I.uid===lsel.steal)||{}).name||'이웃 섬')+' 가장자리':lsel.water?'바다 한 칸':'다리 한 칸'}</b><small>${lsel.steal?'이웃 땅이라 4배 비싸요 · 판 사람은 절반을 벽돌로 받아요':'내 땅과 맞닿은 곳만 넓힐 수 있어요'}</small></div>
          <button className=${'wl26-buy tap'+(bricks<lsel.cost||landN>=landMax?' off':'')} onClick=${()=>buyLand(lsel)}><${BrickIc} s=${18}/>${lsel.cost.toLocaleString()}</button></div>`
        :html`<div className="wl26-tip"><span><i className="w"></i>바다 · 다리</span><span><i className="s"></i>이웃 섬 가장자리</span><small>빛나는 칸을 눌러 골라요 · 가운데 섬과 본부 근처는 못 사요</small></div>`}</div>
    </div>`:null}
    ${(mode==='place'||mode==='move')&&ghost?html`<div className="wb20-place">
      <div className="wb20-pt"><b>${mode==='move'?'옮길 곳을 눌러요':wName(ghost.t)+' 놓을 곳을 눌러요'}</b><span>${(()=>{ const [w,h]=wSz(ghost); return w+'×'+h+'칸 · '; })()}${ghost.ok?'여기에 놓을 수 있어요':'빈 땅이 아니에요'}</span></div>
      ${canRot(ghost.t)?html`<button className="wb20-x tap wb26-rot" onClick=${rotGhost} aria-label="돌리기"><${Icon} n="reset" s=${22} w=${2.6}/></button>`:null}
      <button className="wb20-x tap" onClick=${cancelPlace} aria-label="취소"><${Icon} n="x" s=${24} w=${3}/></button>
      <button className=${'wb20-ok tap'+(ghost.ok?'':' off')} onClick=${confirmPlace} aria-label="확인"><${Icon} n="check" s=${26} w=${3.2}/></button>
    </div>`:null}
    ${mode==='view'&&selIt&&C0d?html`<div className="wb20-rib" key=${selIt.i}>
      <div className="wb20-rh"><b>${wName(selIt.t)}</b>${C0d.lvMax>1||selIt.t==='hall'?html`<em>Lv.${selIt.lv}</em>`:null}<span className="wb26-sz">${wSz(selIt).join('×')}</span>${inProg?html`<span className="wb20-busy">공사 중 · ${wFmtT((selIt.up.end-now)/1000)}</span>`:null}</div>
      <div className="wb20-rb">
        <button className="tap" onClick=${()=>setInfo({i:selIt.i})}><i className="ic-info"><${Icon} n="info" s=${22} w=${2.3}/></i><small>정보</small></button>
        ${canUp?html`<button className="tap up" onClick=${()=>setInfo({i:selIt.i,up:1})}><i><${Icon} n="up" s=${24} w=${2.6}/></i><small><${BrickIc} s=${12}/>${C0d.up[selIt.lv+1]}</small></button>`:null}
        ${inProg?html`<button className="tap gem" onClick=${()=>speed(selIt)}><i><${Icon} n="bolt" s=${22} w=${2.4}/></i><small><${Coin} s=${12}/>${wSpeedCost((selIt.up.end-now)/1000)}</small></button>`:null}
        ${selIt.t==='mine'&&selIt.lv>=1&&!inProg?html`<button className="tap" onClick=${()=>collect(selIt)}><i><${BrickIc} s=${22}/></i><small>${wMineStock(selIt,now)}/${W_MINE_CAP[selIt.lv]}</small></button>`:null}
        ${selIt.t==='hall'?html`<button className="tap up" onClick=${()=>{ setSel(null); setHallIn(true); }}><i><${Icon} n="exit" s=${22} w=${2.3}/></i><small>들어가기</small></button>`:null}
        ${selIt.t==='hall'&&!inProg?html`<button className="tap" onClick=${()=>{ setSel(null); startLand(); }}><i><${Icon} n="expand" s=${22} w=${2.3}/></i><small>땅 넓히기</small></button>`:null}
        ${canRot(selIt.t)&&!inProg?html`<button className="tap" onClick=${()=>rotate(selIt)}><i><${Icon} n="reset" s=${21} w=${2.4}/></i><small>돌리기</small></button>`:null}
        ${selIt.t!=='hall'&&!inProg?html`<button className="tap" onClick=${()=>{ setMode('move'); setGhost({t:selIt.t,lv:selIt.lv,r:!!selIt.r,gx:myL().cx+selIt.x,gy:myL().cy+selIt.y,lx:selIt.x,ly:selIt.y,ok:true}); }}><i><${Icon} n="move" s=${22} w=${2.3}/></i><small>옮기기</small></button>`:null}
        ${(C0d.cat==='deco'||C0d.cat==='gem')?html`<button className="tap red" onClick=${()=>remove(selIt)}><i><${Icon} n="trash" s=${20} w=${2.3}/></i><small>치우기</small></button>`:null}
      </div>
    </div>`:null}
    ${mode==='view'&&selOb?html`<div className="wb20-rib" key=${selOb.k}>
      <div className="wb20-rh"><b>${W_OB[selOb.t].n}</b><span className="wb20-busy">치우면 벽돌 ${W_OB[selOb.t].get[0]}~${W_OB[selOb.t].get[1]}개</span></div>
      <div className="wb20-rb">${mine.clr&&mine.clr.k===selOb.k?html`<span className="wb20-note">치우는 중…</span>`:html`<button className="tap up" onClick=${()=>clearOb(selOb)}><i><${Icon} n="axe" s=${22} w=${2.3}/></i><small><${BrickIc} s=${12}/>${W_OB[selOb.t].cost}</small></button>`}</div>
    </div>`:null}
    ${info&&mine?html`<${WInfo} c=${c} I=${mine} info=${info} now=${now} onClose=${()=>setInfo(null)} onUp=${upgrade} onExp=${expand} nm=${nm} setNm=${setNm} rename=${rename}/>`:null}
    ${shop&&mine?html`<${WShop} I=${mine} tab=${stab} setTab=${setStab} coins=${coins} busy=${busy} builders=${builders} onPick=${startPlace} onClose=${()=>setShop(false)} gift=${gift} rpg=${rpg} onEq=${buyEq}/>`:null}
    ${cs&&mode==='view'?html`<div className="wb20-card" onClick=${e=>e.stopPropagation()}>
      ${cm?html`<${PfpView} m=${cm} s=${44}/>`:null}<div className="wb20-cb"><b>${cs.name}</b><span>${cm?dispName(cm):''} · 본부 Lv.${cs.hallLv} · ♥ ${Object.keys(cs.likes||{}).length}</span></div>
      <button className=${'wb20-like tap'+(!!(cs.likes||{})[c.uid]?' on':'')} onClick=${()=>c.likeIsland(cs)} aria-label="좋아요"><${Icon} n="heart" s=${18} fill=${(cs.likes||{})[c.uid]?'currentColor':'none'}/></button>
      ${cm?html`<button className="wb20-ib tap" onClick=${()=>c.openProfile(cm.uid)} aria-label="프로필"><${Icon} n="user" s=${17}/></button>`:null}
      <button className="wb20-ib tap" onClick=${()=>setCard(null)} aria-label="닫기"><${Icon} n="x" s=${17}/></button>
    </div>`:null}
    ${ppl?html`<div className="wb20-shade" onClick=${()=>setPpl(false)}><div className="wbs wo26" onClick=${e=>e.stopPropagation()}>
      <div className="wbs-h"><b>위치</b><span className="wbs-sub"><i className="wo26-dot"></i>${online.length+1}명 접속 중</span><button className="wbi-x tap" onClick=${()=>setPpl(false)} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
      <div className="wo26-pl">
        <button className="wo26-p tap" onClick=${()=>{ goCenter(); setPpl(false); }}><span className="gi30" style=${{'--g1':'#FFD54A','--g2':'#E8900A'}}><${Icon} n="plaza" s=${18} w=${2.3}/></span><b>가운데 섬</b></button>
        <button className="wo26-p tap" onClick=${()=>{ goMine(); setPpl(false); }}><span className="gi30" style=${{'--g1':'#FFB15C','--g2':'#E8420A'}}><${Icon} n="home" s=${18} w=${2.3}/></span><b>내 섬</b></button>
        ${W_LM.map(l=>html`<button key=${l.k} className=${'wo26-p tap'+(l.dg?' dg':'')} onClick=${()=>{ setPpl(false); if(l.dg) startDg(l.dg); else openLm(l.k); }}><span className="gi30" style=${{'--g1':l.c[0],'--g2':l.c[1]}}><${Icon} n=${l.ic} s=${18} w=${2.3}/></span><b>${l.n.replace(' 포털','')}</b>${l.dg?html`<em>${DG[l.dg].lv>1?'Lv.'+DG[l.dg].lv+'+':'쉬움'}</em>`:null}</button>`)}
      </div>
      <div className="wo26-sec">지금 접속 중</div>
      <div className="wo26-l">
        <div className="wo26-r me"><span className="wo26-av"><${PfpView} m=${c.me} s=${40}/><i></i></span><span className="wo26-t"><b>${dispName(c.me)}<em>나</em></b><small>${locName(meHere)}</small></span></div>
        ${online.map(I=>{ const m=c.members.find(x=>x.uid===I.uid); if(!m) return null; return html`<div key=${I.uid} className="wo26-r"><span className="wo26-av"><${PfpView} m=${m} s=${40}/><i></i></span><span className="wo26-t"><b>${dispName(m)}</b><small>${locName(I.here)}</small></span>
          ${I.here.zone?html`<button className="wo26-go tap" onClick=${()=>{ setPpl(false); startDg(I.here.zone); }}>따라가기</button>`:html`<button className="wo26-go tap" onClick=${()=>{ S.current.jump(I.here.x+1,I.here.y+1,1.1); setPpl(false); setLm(null); setSel(null); }}>옆으로</button>`}
          <button className="wo26-go alt tap" onClick=${()=>{ goIsland(I.uid); setPpl(false); }}>섬 가기</button></div>`; })}
        ${!online.length?html`<p className="wo26-none">지금은 나만 있어요. 크루원이 들어오면 여기 바로 보여요.</p>`:null}
      </div>
      <div className="wo26-sec">크루 섬 둘러보기</div>
      <div className="wo26-l">${isl.filter(I=>I.uid!==c.uid&&!online.some(o=>o.uid===I.uid)).map(I=>{ const m=c.members.find(x=>x.uid===I.uid); return html`<div key=${I.uid} className="wo26-r off">${m?html`<span className="wo26-av"><${PfpView} m=${m} s=${36}/></span>`:null}<span className="wo26-t"><b>${I.name}</b><small>${m?dispName(m)+' · ':''}본부 Lv.${I.hallLv}${I.here&&I.here.at?' · '+ago(I.here.at)+' 접속':''}</small></span>
        <button className="wo26-go alt tap" onClick=${()=>{ goIsland(I.uid); setPpl(false); }}>가기</button></div>`; })}</div>
    </div></div>`:null}
    ${msn&&mine?(()=>{ const D=dayD(mine); const all=['col','ob','visit'].every(k=>D[k]); return html`<div className="wb20-shade" onClick=${()=>setMsn(false)}><div className="wbi" onClick=${e=>e.stopPropagation()}>
      <div className="wbi-h"><b>오늘의 섬 미션</b><button className="wbi-x tap" onClick=${()=>setMsn(false)} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
      <div className="wbi-b"><div className="wm23">${[['col','벽돌 공방에서 벽돌 모으기','home'],['ob','장애물 하나 치우기','axe'],['visit','크루원 섬에 놀러 가기','globe']].map(([k,t,ic])=>html`<div key=${k} className=${'wm23-r'+(D[k]?' ok':'')}><span className="wm23-ic"><${Icon} n=${D[k]?'check':ic} s=${18} w=${2.6}/></span><b>${t}</b><em>${D[k]?'완료':'진행 중'}</em></div>`)}</div>
        <button className=${'wbi-go tap'+(all&&!D.got?'':' off')} onClick=${()=>{ if(!all||D.got) return; save({daily:{...D,got:1},bricks:mine.bricks+80}); c.worldCoins(3,'섬 미션 완료! 벽돌 80 · D-Coin 3'); setMsn(false); }}>${D.got?'오늘 보상 받음':html`<${BrickIc} s=${20}/>80 + D-Coin 3 받기`}</button>
        <p className="wbi-d" style=${{marginTop:'10px'}}>매일 0시에 새로 시작해요.</p></div></div></div>`; })():null}
    ${rank?html`<div className="wb20-shade" onClick=${()=>setRank(false)}><div className="wbs" onClick=${e=>e.stopPropagation()}>
      <div className="wbs-h"><b>섬 랭킹</b><span className="wbs-sub">본부 레벨 · 건물 · 땅 · 좋아요</span><button className="wbi-x tap" onClick=${()=>setRank(false)} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
      <div className="wr21">${[...isl].map(I=>({I,sc:I.hallLv*100+I.items.length*5+Object.keys(I.likes||{}).length*20+(I.exp||0)*60+I.land.length*12})).sort((a,b)=>b.sc-a.sc).map(({I,sc},i)=>{ const m=c.members.find(x=>x.uid===I.uid);
        return html`<button key=${I.uid} className=${'wr21-r tap'+(I.uid===c.uid?' me':'')} onClick=${()=>{ goIsland(I.uid,1); setRank(false); }}>
          <span className="wr21-n">${i+1}</span>${m?html`<${PfpView} m=${m} s=${34}/>`:null}<span className="wr21-t"><b>${I.name}</b><small>본부 Lv.${I.hallLv} · 건물 ${I.items.length} · 땅 +${I.land.length} · ♥ ${Object.keys(I.likes||{}).length}</small></span><em>${sc.toLocaleString()}</em></button>`; })}</div>
      <p className="wr21-tip">크루원 섬에 놀러 가면 섬마다 하루 한 번 벽돌 15개를 받아요.</p></div></div>`:null}
    ${dg?html`<${Dungeon} key=${dg} c=${c} kind=${dg} onExit=${exitDg} saveBricks=${saveBricks}/>`:null}
    ${tp?html`<div className=${'tp26 k-'+tp.k+' '+tp.dir} key=${tp.key} aria-hidden="true"><i className="tp26-sw"></i><i className="tp26-ring"></i><div className="tp26-t"><em>${DG[tp.k].e}</em><b>${tp.dir==='in'?DG[tp.k].n+'(으)로 이동 중':'DKO 월드로 돌아가는 중'}</b></div></div>`:null}
    ${welcome?html`<div className="wo27" onClick=${e=>e.stopPropagation()}><div className="wo27-c">
      <div className="wo27-art"><span className="wo27-old"><em>DKO</em><b>TOWN</b></span><span className="wo27-ar"><${Icon} n="chev" s=${26} w=${3}/></span><span className="wo27-new"><em>DKO</em><b>WORLD</b></span>
        ${Array.from({length:18}).map((_,i)=>html`<i key=${i} className="wo27-cf" style=${{'--i':i,'--x':((i*53)%100)+'%','--c':['#FFD54A','#FF6B8A','#7CF0B5','#7CC2FF','#FF8A3D','#C29BFF'][i%6]}}></i>`)}</div>
      <em className="wo27-em">GRAND OPEN</em><b className="wo27-t">DKO 타운이 DKO 월드로 새로 태어났어요</b>
      <ul className="wo27-l"><li><span className="gi30" style=${{'--g1':'#8EE06A','--g2':'#2F9A3A'}}><${Icon} n="home" s=${16} w=${2.4}/></span>내 섬을 짓고 바다까지 땅을 넓혀요</li>
        <li><span className="gi30" style=${{'--g1':'#7CF0B5','--g2':'#139A63'}}><${Icon} n="swords" s=${16} w=${2.4}/></span>슬라임 섬 · 헬바운드 포털에서 사냥해요</li>
        <li><span className="gi30" style=${{'--g1':'#FFD54A','--g2':'#C98A00'}}><${Icon} n="shield" s=${16} w=${2.4}/></span>브론즈 · 실버 · 골드 장비로 강해져요</li>
        <li><span className="gi30" style=${{'--g1':'#7CC2FF','--g2':'#2563EB'}}><${Icon} n="chat" s=${16} w=${2.4}/></span>크루와 말풍선 채팅 · 따라가기</li></ul>
      <div className="wo27-gift"><b>오픈 선물</b><span>브론즈 소드 · 브론즈 방패 · 벽돌 500</span></div>
      <button className="wo27-go tap" onClick=${takeWelcome}>선물 받고 시작하기</button></div></div>`:null}
    ${cloud?html`<div className=${'wcl wcl-'+cloud} aria-hidden="true">${Array.from({length:14}).map((_,i)=>html`<i key=${i} style=${{'--i':i,'--a':(i/14*360)+'deg','--s':(.8+wHash(i,1,1)*.7).toFixed(2)}}></i>`)}<b className="wcl-t">DKO 월드</b></div>`:null}
  </div>`,document.body);
}
/* 정보 · 업그레이드 · 넓히기 시트 */
function WInfo({c,I,info,now,onClose,onUp,onExp,nm,setNm,rename}){
  const it=I.items.find(x=>x.i===info.i); if(!it) return null; const C=W_CAT[it.t]; const nx=it.lv+1; const canUp=C.lvMax>1&&it.lv<C.lvMax;
  const stats=[];
  if(it.t==='mine'){ stats.push(['시간당 생산',W_MINE_RATE[it.lv],canUp?W_MINE_RATE[nx]:null]); stats.push(['저장 용량',W_MINE_CAP[it.lv],canUp?W_MINE_CAP[nx]:null]); }
  if(it.t==='hall'){ stats.push(['장식 한도',W_DECO_MAX[it.lv],canUp?W_DECO_MAX[nx]:null]); stats.push(['벽돌 공방',W_CAT.mine.max[it.lv],canUp?W_CAT.mine.max[nx]:null]); stats.push(['오두막',W_CAT.house.max[it.lv],canUp?W_CAT.house.max[nx]:null]); }
  const lock=it.t!=='hall'&&canUp&&nx>I.hallLv;
  return html`<div className="wb20-shade" onClick=${onClose}><div className="wbi" onClick=${e=>e.stopPropagation()}>
    <div className="wbi-h"><b>${info.exp?'섬 넓히기':info.up?wName(it.t)+' 업그레이드':wName(it.t)}</b><button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="wbi-art"><${WItemIcon} t=${it.t} lv=${info.up&&canUp?nx:Math.max(1,it.lv)} big=${true}/>${info.up&&canUp?html`<span className="wbi-lv">Lv.${it.lv} → <b>Lv.${nx}</b></span>`:html`<span className="wbi-lv">Lv.${it.lv}</span>`}</div>
    ${info.exp?html`<div className="wbi-b">
      <p className="wbi-d">본부 레벨에 맞춰 섬을 한 칸씩 넓힐 수 있어요. 새 땅에는 장애물이 생겨요.</p>
      <div className="wbi-exp">${[0,1,2].map(k=>html`<span key=${k} className=${k<I.exp?'on':k===I.exp?'nx':''}><i></i>${k+1}단계<small>본부 Lv.${k+2}</small></span>`)}</div>
      ${I.exp>=WCF.MAX_EXP?html`<p className="wbi-max">최대로 넓혔어요!</p>`:html`<button className=${'wbi-go tap'+(I.hallLv<I.exp+2?' off':'')} onClick=${onExp}>${I.hallLv<I.exp+2?'본부 Lv.'+(I.exp+2)+' 필요':html`<${BrickIc} s=${20}/>${W_EXP_COST[I.exp].toLocaleString()} · 넓히기`}</button>`}
    </div>`:html`<div className="wbi-b">
      <p className="wbi-d">${C.ds||C.d2||''}</p>
      ${stats.length?html`<div className="wbi-st">${stats.map(([k,a,b])=>html`<div key=${k}><span>${k}</span><b>${a}${info.up&&b!=null&&b!==a?html` <em>→ ${b}</em>`:null}</b></div>`)}</div>`:null}
      ${it.t==='hall'&&!info.up?html`<div className="wbi-name">${nm==null?html`<button className="link" onClick=${()=>setNm(I.name)}><${Icon} n="edit" s=${14}/>섬 이름 바꾸기 · ${I.name}</button>`:html`<div className="row g6"><input className="inp" value=${nm} onChange=${e=>setNm(e.target.value.slice(0,14))} placeholder="섬 이름"/><button className="wbi-mini tap" onClick=${rename}>저장</button></div>`}</div>`:null}
      ${info.up&&canUp?html`<div className="wbi-cost"><span><${Icon} n="clock" s=${15}/>${wFmtT(C.ut[nx])}</span></div>
        <button className=${'wbi-go tap'+(lock?' off':'')} onClick=${()=>!lock&&onUp(it)}>${lock?'본부 Lv.'+nx+' 필요':html`<${BrickIc} s=${20}/>${C.up[nx].toLocaleString()} · 업그레이드`}</button>`:null}
      ${!info.up&&canUp&&!(it.up&&it.up.end>now)?html`<button className="wbi-go ghost tap" onClick=${()=>{ onClose(); setTimeout(()=>document.querySelector('.wb20-rb .up')&&document.querySelector('.wb20-rb .up').click(),60); }}>업그레이드 보기</button>`:null}
    </div>`}
  </div></div>`;
}
/* 상점 */
function WShop({I,tab,setTab,coins,busy,builders,onPick,onClose,gift,rpg,onEq}){
  const hl=I.hallLv; const gl=Object.entries((gift&&gift.items)||{}).filter(([k,n])=>n>0&&W_CAT[k]);
  if(tab==='gift'&&!gl.length) tab='res';
  const list=tab==='gift'||tab==='eq'?[]:Object.entries(W_CAT).filter(([k,v])=>v.cat===tab&&k!=='hall');
  return html`<div className="wb20-shade" onClick=${onClose}><div className="wbs" onClick=${e=>e.stopPropagation()}>
    <div className="wbs-h"><b>상점</b><span className="wbs-sub"><${BrickIc} s=${16}/>${I.bricks.toLocaleString()}<i></i><${Coin} s=${14}/>${coins.toLocaleString()}<i></i>건축가 ${builders-busy}/${builders}</span><button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="wbs-tabs">${gl.length?html`<button className=${'tap gift'+(tab==='gift'?' on':'')} onClick=${()=>setTab('gift')}>선물<em>${gl.reduce((s,[,n])=>s+n,0)}</em></button>`:null}${W_TABS.map(([k,l])=>html`<button key=${k} className=${'tap'+(tab===k?' on':'')+(k==='gem'?' gem':'')} onClick=${()=>setTab(k)}>${l}</button>`)}${rpg?html`<button className=${'tap eqt'+(tab==='eq'?' on':'')} onClick=${()=>setTab('eq')}>장비</button>`:null}</div>
    ${tab==='eq'&&rpg?html`<div className="wbs-cap">사냥할 때 쓰는 장비 · 실버는 본부 Lv.2부터 · 골드는 헬바운드 보스 전리품</div><div className="ws26-eq">${EQ_S.map(S2=>html`<div key=${S2.k} className="ws26-r"><div className="ws26-rh"><${Icon} n=${S2.ic} s=${16} w=${2.3}/><b>${S2.n}</b><small>${S2.sub}</small></div>
      <div className="ws26-g">${EQ_T.map((T,ti)=>{ const id=eqId(S2.k,T.k); const n=rpg.inv[id]||0; const pr=EQ_PRICE[S2.k][ti]; const lock=ti>=1&&I.hallLv<2&&pr; const val=S2.k==='shield'?'막기 '+Math.round(EQ_SHIELD.block[ti]*100)+'%':(S2.k==='weapon'?'공격 +':'방어 +')+EQ_VAL[S2.k][ti];
        return html`<button key=${id} className=${'ws26-c tap t-'+T.k+(pr?'':' drop')+(lock?' lock':'')} onClick=${()=>onEq(S2.k,ti)}><span className="ws26-gem"><${Icon} n=${S2.ic} s=${20} w=${2.2}/></span><b>${T.n}</b><small>${val}</small>${n?html`<em className="ws26-n">보유 ${n}</em>`:null}
          <span className="ws26-p">${pr?html`<${BrickIc} s=${13}/>${pr.toLocaleString()}`:'보스 전리품'}</span></button>`; })}</div></div>`)}</div>`:null}
    ${tab==='gift'?html`<div className="wbs-cap">D-ROP에서 받은 장식이에요 · 공짜로 놓을 수 있어요</div><div className="wbs-grid">${gl.map(([k,n],i)=>html`<button key=${k} className="wbs-c tap gem gf" style=${{'--d':(i*35)+'ms'}} onClick=${()=>onPick(k,true)}>
        <span className="wbs-art"><${WItemIcon} t=${k}/><i className="wbs-sz">${wSz({t:k}).join('×')}</i></span><b>${W_CAT[k].n}</b><span className="wbs-meta"><em>×${n}</em></span><span className="wbs-p gf">무료로 놓기</span></button>`)}</div>`:null}
    ${tab==='deco'||tab==='gem'?html`<div className="wbs-cap">장식 ${wDecoCount(I)}/${W_DECO_MAX[hl]} · 본부 레벨이 오르면 더 놓을 수 있어요</div>`:null}
    <div className="wbs-grid">${list.map(([k,C],i)=>{ const mx=wMaxOf(k,hl), n=wCount(I,k); const lock=(C.req&&hl<C.req)||C.drop; const full=!lock&&mx<99&&n>=mx;
      return html`<button key=${k} className=${'wbs-c tap'+(lock?' lock':'')+(full?' full':'')+(C.d?' gem':'')} style=${{'--d':(i*35)+'ms'}} onClick=${()=>!lock&&!full&&onPick(k)}>
        <span className="wbs-art"><${WItemIcon} t=${k}/><i className="wbs-sz">${wSz({t:k}).join('×')}</i></span>
        <b>${C.n}</b>
        <span className="wbs-meta">${mx<99&&!lock?html`<em>${n}/${mx}</em>`:null}${C.time?html`<em><${Icon} n="clock" s=${11} w=${2.4}/>${wFmtT(C.time)}</em>`:null}</span>
        ${C.drop?html`<span className="wbs-lock"><${Icon} n="gift" s=${13} w=${2.4}/>D-ROP ${['레어','에픽','레전더리','얼티밋'][C.gr]||''}</span>`:lock?html`<span className="wbs-lock"><${Icon} n="lock" s=${13} w=${2.4}/>본부 Lv.${C.req}</span>`:full?html`<span className="wbs-lock">최대</span>`:html`<span className=${'wbs-p'+(C.d?' d':'')}>${C.d?html`<${Coin} s=${14}/>${C.d}`:html`<${BrickIc} s=${15}/>${C.b}`}</span>`}
      </button>`; })}</div>
  </div></div>`;
}
function WItemIcon({t,lv,big}){ const r=useRef(null); const S0=big?120:64;
  useEffect(()=>{ const el=r.current; const d=2; el.width=S0*d; el.height=S0*d; const g=el.getContext('2d'); g.setTransform(d,0,0,d,0,0);
    const cx=S0/2, cy=S0*.72, hw=S0*.42, hh=hw/2;
    g.fillStyle='#5FBF66'; g.beginPath(); g.moveTo(cx+hw,cy); g.lineTo(cx,cy+hh); g.lineTo(cx,cy+hh+S0*.06); g.lineTo(cx+hw,cy+S0*.06); g.fill(); g.fillStyle='#4CA857'; g.beginPath(); g.moveTo(cx-hw,cy); g.lineTo(cx,cy+hh); g.lineTo(cx,cy+hh+S0*.06); g.lineTo(cx-hw,cy+S0*.06); g.fill();
    g.fillStyle='#7ED67F'; g.beginPath(); g.moveTo(cx,cy-hh); g.lineTo(cx+hw,cy); g.lineTo(cx,cy+hh); g.lineTo(cx-hw,cy); g.closePath(); g.fill();
    const tall={hall:1,tower:1,balloon:1,house:1,mine:1,shop:1}; const u=S0/(tall[t]?32:22);
    wDrawItem(g,t,cx,cy,u,1.3,3,lv||1); },[t,lv]);
  return html`<canvas ref=${r} style=${{width:S0+'px',height:S0+'px'}} aria-hidden="true"></canvas>`; }
function WorldThumb({me}){ const r=useRef(null);
  useEffect(()=>{ const el=r.current; let raf=0, dead=false; const d=Math.min(2,window.devicePixelRatio||1);
    const draw=now=>{ if(dead) return; const tm=now/1000; const W=el.clientWidth||300, H=el.clientHeight||120; if(el.width!==Math.round(W*d)){ el.width=Math.round(W*d); el.height=Math.round(H*d); }
      const g=el.getContext('2d'); g.setTransform(d,0,0,d,0,0); g.clearRect(0,0,W,H);
      const cx=W*.62, cy=H/2+8, hw=Math.min(15,W/22), hh=hw/2; const tiles=[];
      for(let x=-4;x<=4;x++) for(let y=-4;y<=4;y++){ if(Math.hypot(x,y)+(wHash(x,y,5)-.5)*.9<4.2) tiles.push([x,y]); }
      const has=new Set(tiles.map(t=>t+'')); const fl=Math.sin(tm*1.5)*1.4;
      tiles.sort((a,b)=>(a[0]+a[1])-(b[0]+b[1])).forEach(([x,y])=>{ const px=cx+(x-y)*hw, py=cy+(x+y)*hh+fl; const sand=Math.hypot(x,y)>3.4;
        if(!has.has([x+1,y]+'')){ g.fillStyle='#9A6A44'; g.beginPath(); g.moveTo(px+hw,py); g.lineTo(px,py+hh); g.lineTo(px,py+hh+6); g.lineTo(px+hw,py+6); g.fill(); }
        if(!has.has([x,y+1]+'')){ g.fillStyle='#B07E52'; g.beginPath(); g.moveTo(px-hw,py); g.lineTo(px,py+hh); g.lineTo(px,py+hh+6); g.lineTo(px-hw,py+6); g.fill(); }
        g.fillStyle=sand?'#F2DFA6':((x+y)&1?'#7ED67F':'#76CD78'); g.beginPath(); g.moveTo(px,py-hh); g.lineTo(px+hw,py); g.lineTo(px,py+hh); g.lineTo(px-hw,py); g.closePath(); g.fill(); });
      const at=(x,y)=>[cx+(x-y)*hw,cy+(x+y)*hh+fl]; const u=hw/8.5;
      [[-2,-1,'pine'],[-1,-2,'tree'],[0,0,'hall'],[2,1,'fire'],[-2,2,'sakura'],[1,-2,'mine'],[0,3,'lamp']].sort((a,b)=>(a[0]+a[1])-(b[0]+b[1])).forEach(([x,y,t],i)=>{ const [px,py]=at(x,y); wDrawItem(g,t,px,py,u*1.2,tm,i,2); });
      const [qx,qy]=at(1.4,1.2); wDrawChar(g,qx,qy,u*1.3,avatarOf(me),Math.sin(tm)*.7+.5,tm,false,null,false);
      raf=requestAnimationFrame(draw); };
    raf=requestAnimationFrame(draw); return ()=>{ dead=true; cancelAnimationFrame(raf); }; },[]);
  return html`<canvas ref=${r} className="wbh20-cv" aria-hidden="true"></canvas>`; }


/* ═════════ v26 DKO 월드 RPG: 슬라임 섬(쉬움) · 헬바운드(보통) ═════════
   포털을 타면 다른 세계로 넘어가요. 이동은 땅을 눌러서, 전투는 공격 · 방패 버튼 두 개만.
   전리품(벽돌 · D-Coin · 장비 · 경험치)은 나갈 때와 45초마다 서버에 저장돼요. */
const DG={
  slime:{n:'슬라임 섬',e:'SLIME ISLAND',lv:1,R:24,col:['#7CF0B5','#139A63'],bg:['#2AA6C9','#136F9A'],
    tile:{g:['#A6E8A0','#93DB8E'],s:['#E9F5B8','#D9EAA0'],m:['#C5EFC0','#B5E5B0']},
    mobs:[['slime',14],['bslime',7]],boss:[['kslime',0,-17]],deco:['tree','pine','bush','mush','rock','flower'],holes:'pool'},
  hell:{n:'헬바운드',e:'HELLBOUND',lv:5,R:33,col:['#FF6B4A','#8A0E1E'],bg:['#5A0A0A','#1A0306'],
    tile:{g:['#4A2B2E','#41252A'],s:['#5C3034','#52292D'],m:['#6A2E22','#5E281E']},
    mobs:[['imp',12],['mslime',9],['skel',8]],boss:[['hound',19,-9],['golem',-17,15]],deco:['spike','obsid','bones','skull','fire'],holes:'lava'},
  /* v26.4 스토리 모드: 1-1 → 1-4가 한 맵으로 이어져요. 구역을 깨면 다음 문이 열려요 */
  story:{n:'동화 숲',e:'FAIRY FOREST · 1장',lv:1,R:0,col:['#FFD27A','#E0731A'],bg:['#86D9EE','#4AA6D2'],story:1,
    tile:{g:['#9BE08F','#8DD683'],s:['#F4E3B2','#EAD59C'],m:['#B5E9A4','#A7E096'],p:['#F0E0BE','#E6D2AA']},
    mobs:[],boss:[],deco:['tree','pine','mush','flower','bush','rock','sakura','tree','flower'],holes:'pool',
    areas:[{id:'1-1',n:'숲 입구',c:[0,0],r:6.4,mobs:[['slime',4],['mush',2]]},{id:'1-2',n:'버섯 골짜기',c:[16,-3],r:6.8,mobs:[['mush',4],['bslime',3]]},
      {id:'1-3',n:'반딧불 호수',c:[32,1],r:7.2,mobs:[['mush',3],['wisp',4],['gmush',1]]},{id:'1-4',n:'버섯왕의 정원',c:[49,-2],r:9.2,mobs:[['mking',1]],boss:1}]}
};
const MOB={
  slime:{n:'슬라임',hp:30,atk:5,spd:1.25,xp:6,b:[8,15],c:['#8EF08A','#3FAE3A'],sz:1,kind:'slime',eq:[.015,'b']},
  bslime:{n:'블루 슬라임',hp:48,atk:8,spd:1.45,xp:10,b:[12,22],c:['#8CD2FF','#2F7FE0'],sz:1.15,kind:'slime',eq:[.03,'b']},
  kslime:{n:'킹 슬라임',hp:560,atk:16,spd:1.05,xp:95,b:[160,260],c:['#C9A8FF','#6A3FD8'],sz:2.5,kind:'slime',boss:1,slam:1,eq:[1,'b',.2,'s'],coin:[8,14],re:75},
  imp:{n:'임프',hp:70,atk:13,spd:2.2,xp:16,b:[20,35],c:['#FF5A4A','#8A0E1E'],sz:1,kind:'imp',eq:[.02,'s']},
  mslime:{n:'마그마 슬라임',hp:95,atk:15,spd:1.35,xp:18,b:[24,40],c:['#FFB04A','#D02A0A'],sz:1.25,kind:'slime',eq:[.03,'s']},
  skel:{n:'해골 기사',hp:140,atk:19,spd:1.55,xp:26,b:[30,50],c:['#EDE6D6','#9A8E78'],sz:1.1,kind:'skel',eq:[.05,'s']},
  hound:{n:'헬하운드',hp:950,atk:26,spd:2.3,xp:230,b:[400,600],c:['#3A1A1E','#FF5A1A'],sz:2.1,kind:'hound',boss:1,dash:1,eq:[1,'s',.25,'g'],coin:[15,25],re:90},
  golem:{n:'용암 골렘',hp:1350,atk:32,spd:.95,xp:320,b:[500,800],c:['#3E3434','#FF7A1A'],sz:2.7,kind:'golem',boss:1,slam:1,eq:[1,'s',.35,'g'],coin:[20,30],re:110},
  mush:{n:'버섯 병정',hp:62,atk:9,spd:1.3,xp:12,b:[12,22],c:['#E5383B','#F5E6C8'],sz:1.05,kind:'mush',eq:[.02,'b']},
  wisp:{n:'반딧불 정령',hp:46,atk:11,spd:1.9,xp:14,b:[14,24],c:['#B8F5FF','#3AA8E0'],sz:.95,kind:'wisp',eq:[.02,'b']},
  gmush:{n:'대장 버섯',hp:420,atk:15,spd:1.1,xp:90,b:[120,180],c:['#B48CFF','#F5E6C8'],sz:1.9,kind:'mush',mini:1,slam:1,eq:[.5,'s']},
  mking:{n:'버섯왕',hp:1600,atk:22,spd:1.15,xp:320,b:[400,620],c:['#FFB020','#FFF2D6'],sz:2.9,kind:'mush',boss:1,slam:1,summon:1,crown:1,eq:[1,'s',.4,'g'],coin:[12,20]}
};
const STORY_CHEST=['wood','wood','silver','gold'];
const rRand=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
/* 맵 만들기: 섬 모양 · 구멍(연못/용암) · 장애물 · 보스 자리 */
function dgBuild(kind){
  const D=DG[kind]; if(D.story) return dgBuildStory(kind);
  const T=new Map(); const blk=new Set(); const obs=[]; const H=[]; const R=D.R; const sd=kind==='hell'?71:13;
  for(let x=-R-2;x<=R+2;x++) for(let y=-R-2;y<=R+2;y++){
    const d=Math.sqrt(x*x+y*y*1.05)+(wHash(x,y,sd)-.5)*3.2+Math.sin(Math.atan2(y,x)*5+sd)*1.6;
    if(d>R) continue;
    /* 구멍: 섬 곳곳의 연못 · 용암 줄기 */
    const n1=Math.sin(x*.21+sd)*Math.cos(y*.19-sd*.3)+Math.sin((x+y)*.11)*.6;
    const hole=kind==='hell'?Math.abs(Math.sin(x*.14+y*.05)*7-y*.35+Math.cos(y*.2)*3)<1.15&&Math.hypot(x,y)>5:n1>1.05&&Math.hypot(x,y)>5;
    if(hole){ H.push([x,y]); continue; }
    const edge=d>R-1.4; const m=wHash(x,y,sd+2)>.86;
    T.set(x+','+y,{x,y,t:edge?'s':m?'m':'g'});
  }
  /* 보스 둥지 · 시작점은 평평하게 */
  const flat=(cx,cy,r,t)=>{ for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++) for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++) if(Math.hypot(x-cx,y-cy)<=r) T.set(x+','+y,{x,y,t:t||'m'}); };
  flat(0,0,4.2,'m'); D.boss.forEach(([,bx,by])=>{ flat(bx,by,5.2,'m'); /* 둥지까지 가는 길 */ const n=Math.ceil(Math.hypot(bx,by)); for(let i=0;i<=n;i++){ const x=Math.round(bx*i/n), y=Math.round(by*i/n); flat(x,y,1.2,T.has(x+','+y)?T.get(x+','+y).t:'g'); } });
  /* 장애물 */
  for(const t of T.values()){ if(Math.hypot(t.x,t.y)<6) continue; if(D.boss.some(([,bx,by])=>Math.hypot(t.x-bx,t.y-by)<6.5)) continue; const h=wHash(t.x,t.y,sd+9);
    if(h>.91){ const o=D.deco[Math.floor(wHash(t.x,t.y,sd+4)*D.deco.length)]; obs.push({x:t.x,y:t.y,t:o}); if(o!=='flower'&&o!=='bones') blk.add(t.x+','+t.y); } }
  return {T,blk,obs,kind,D,H:H.filter(([x,y])=>T.has((x-1)+','+y)||T.has(x+','+(y-1))||T.has((x+1)+','+y)||T.has(x+','+(y+1))||true),gates:[]};
}
/* 동화 숲: 구역(원) 네 개를 굽은 길로 잇고, 길 가운데에 문을 세워요 */
function dgBuildStory(kind){
  const D=DG[kind]; const T=new Map(); const blk=new Set(); const obs=[]; const H=[]; const sd=29; const A=D.areas; const P=new Set();
  const put=(x,y,t)=>{ const k=x+','+y; if(!T.has(k)||t==='p') T.set(k,{x,y,t}); };
  A.forEach((a,i)=>{ const [cx,cy]=a.c, r=a.r; for(let x=Math.floor(cx-r-2);x<=cx+r+2;x++) for(let y=Math.floor(cy-r-2);y<=cy+r+2;y++){
    const d=Math.hypot(x-cx,(y-cy)*1.05)+(wHash(x,y,sd+i)-.5)*2.2+Math.sin(Math.atan2(y-cy,x-cx)*4+i)*.9; if(d>r) continue;
    const pond=i===2&&Math.hypot(x-cx-3.2,y-cy+3)<2.3; if(pond){ H.push([x,y]); continue; }
    put(x,y,d>r-1.2?'s':wHash(x,y,sd+5)>.85?'m':'g'); } });
  const gates=[];
  for(let i=0;i<A.length-1;i++){ const [ax,ay]=A[i].c, [bx,by]=A[i+1].c; const n=Math.ceil(Math.hypot(bx-ax,by-ay)*2);
    for(let j=0;j<=n;j++){ const t=j/n; const x=ax+(bx-ax)*t, y=ay+(by-ay)*t+Math.sin(t*Math.PI)*(i%2?2.2:-2.2);
      for(let ox=-2;ox<=2;ox++) for(let oy=-2;oy<=2;oy++){ if(Math.hypot(ox,oy)>2.2) continue; const X=Math.round(x+ox), Y=Math.round(y+oy); put(X,Y,Math.hypot(ox,oy)<1.2?'p':'g'); if(Math.hypot(ox,oy)<1.2) P.add(X+','+Y); } }
    /* 문: 두 구역 사이 한가운데, 길을 가로질러요 */
    const mx=Math.round((ax+bx)/2), my=(ay+by)/2+(i%2?2.2:-2.2); const cells=[]; for(let y=Math.floor(my-3);y<=Math.ceil(my+3);y++){ const k=mx+','+y; if(T.has(k)){ cells.push([mx,y]); blk.add(k); } }
    gates.push({i,x:mx,y:my,cells,open:false,at:0}); }
  /* 구역 가운데 길(시작 → 끝) */
  for(const k of P){ const t=T.get(k); if(t) t.t='p'; }
  for(const t of T.values()){ const k=t.x+','+t.y; if(P.has(k)) continue; if(A.some(a=>Math.hypot(t.x-a.c[0],t.y-a.c[1])<3.4)) continue; if(gates.some(gt=>Math.abs(t.x-gt.x)<2&&Math.abs(t.y-gt.y)<4)) continue;
    const near=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>P.has((t.x+dx)+','+(t.y+dy))); if(near) continue; const h=wHash(t.x,t.y,sd+9);
    if(h>.84){ const o=D.deco[Math.floor(wHash(t.x,t.y,sd+4)*D.deco.length)]; obs.push({x:t.x,y:t.y,t:o}); if(o!=='flower') blk.add(k); } }
  return {T,blk,obs,kind,D,H,gates,story:1};
}
/* ── 몬스터 복셀 ── */
function mobBoxes(m,P){ const M=MOB[m.t]; const B=[]; const b=(x0,y0,z0,x1,y1,z1,col,tag)=>B.push([x0,y0,z0,x1,y1,z1,col,tag,'b']); const dec=(fy,x0,z0,x1,z1,col)=>b(x0,fy,z0,x1,fy+.06,z1,col,'dec');
  const C=M.c, fl=P.hit>0?'#FFFFFF':null, k=M.kind; const sq=1+Math.sin(P.t*6+m.id)*.06*(P.mv?1.6:1);
  const blink=((P.t+m.id*1.7)%3.6)<.13;
  if(k==='slime'){ const h=4.6*sq, w=3.1/Math.sqrt(sq); b(-w,-w,0,w,w,h*.55,fl||C[1]); b(-w+.5,-w+.5,h*.55,w-.5,w-.5,h*.85,fl||C[0]); b(-w+1.3,-w+1.3,h*.85,w-1.3,w-1.3,h,fl||C[0]);
    if(blink){ dec(w-.5,-1.6,h*.5,-.6,h*.56,'#1A1F2C'); dec(w-.5,.6,h*.5,1.6,h*.56,'#1A1F2C'); }
    else { dec(w-.5,-1.6,h*.42,-.6,h*.66,'#1A1F2C'); dec(w-.5,.6,h*.42,1.6,h*.66,'#1A1F2C'); dec(w-.44,-1.4,h*.56,-1.1,h*.64,'#FFFFFF'); dec(w-.44,.8,h*.56,1.1,h*.64,'#FFFFFF'); }
    dec(w-.46,-w+.9,h*.62,-w+1.5,h*.76,'#FFFFFF'); dec(w-.46,-.5,h*.3,.5,h*.36,'#1A1F2C');
    if(m.t==='kslime'){ b(-1.8,-1.8,h,1.8,1.8,h+.8,'#FFD54A'); [[-1.8,-1.8],[1.1,-1.8],[-1.8,1.1],[1.1,1.1]].forEach(([x,y])=>b(x,y,h+.8,x+.7,y+.7,h+1.7,'#FFD54A')); }
    if(m.t==='mslime') b(-.6,-.6,h,.6,.6,h+.5+Math.abs(Math.sin(P.t*5))*.6,'#FFE08A'); }
  else if(k==='mush'){ const bob=P.mv?Math.abs(Math.sin(P.t*10+m.id))*.35:Math.sin(P.t*2+m.id)*.1; const l=P.mv?Math.sin(P.t*12+m.id)*.5:0;
    b(-1.3,-.6+l,0,-.3,.6+l,1.2,'#7A4E2C'); b(.3,-.6-l,0,1.3,.6-l,1.2,'#7A4E2C');
    b(-1.5,-1.3,1.2+bob,1.5,1.3,4.6+bob,fl||C[1]); b(-1.6,-1.4,2+bob,1.6,1.4,2.5+bob,fl||'#E8D6B0');
    const eh=blink?.12:.75; dec(1.32,-.95,3.1+bob,-.3,3.1+eh+bob,'#1A1F2C'); dec(1.32,.3,3.1+bob,.95,3.1+eh+bob,'#1A1F2C'); if(!blink){ dec(1.36,-.8,3.55+bob,-.55,3.75+bob,'#FFFFFF'); dec(1.36,.45,3.55+bob,.7,3.75+bob,'#FFFFFF'); }
    dec(1.33,-1.3,2.85+bob,-.95,3.05+bob,'#FF9AA8'); dec(1.33,.95,2.85+bob,1.3,3.05+bob,'#FF9AA8');
    b(-2.9,-2.9,4.4+bob,2.9,2.9,5.5+bob,fl||C[0]); b(-2.3,-2.3,5.5+bob,2.3,2.3,6.5+bob,fl||C[0]); b(-1.3,-1.3,6.5+bob,1.3,1.3,7.1+bob,fl||C[0]);
    [[-1.9,-1.4],[.5,-2.1],[1.1,.5],[-1.2,1.2]].forEach(([x,y])=>b(x,y,6.5+bob,x+.9,y+.9,6.62+bob,'#FFFFFF')); b(2.6,-1,4.6+bob,2.95,.2,5.3+bob,'#FFFFFF'); b(-.6,2.6,4.6+bob,.6,2.95,5.3+bob,'#FFFFFF');
    if(!M.boss&&!M.mini){ const sw=P.atk?Math.sin(P.atk*Math.PI)*1.6:0; b(1.7,-.2,1.3+sw,2.1,.2,6+sw,'#8A5A34'); b(1.55,-.4,6+sw,2.25,.4,7+sw,'#D8DEE6'); }
    if(M.mini){ b(-3.2,-.5,2.4+bob,-1.6,.5,3.6+bob,'#8A5A34'); b(-3.6,-1.6,1.4+bob,-3.1,1.6,4.8+bob,'#B48CFF'); }
    if(M.crown){ b(-1.5,-1.5,7.1+bob,1.5,1.5,7.6+bob,'#FFD54A'); [[-1.5,-1.5],[.9,-1.5],[-1.5,.9],[.9,.9]].forEach(([x,y])=>b(x,y,7.6+bob,x+.6,y+.6,8.4+bob,'#FFD54A')); b(-.35,1.45,7.2+bob,.35,1.55,7.5+bob,'#E5383B'); } }
  else if(k==='wisp'){ const fz=1.6+Math.sin(P.t*3+m.id)*.55; const tl=Math.sin(P.t*6+m.id)*.4;
    b(-.45+tl,-3.1,fz+.9,.45+tl,-2.3,fz+1.5,C[1]); b(-.7,-2.4,fz+.6,.7,-1.3,fz+1.8,C[1]);
    b(-1.3,-1.3,fz,1.3,1.3,fz+2.6,fl||C[0]); b(-1.6,-.8,fz+.6,1.6,.8,fz+2,fl||C[0]); b(-.8,-.8,fz+2.6,.8,.8,fz+3.1,fl||'#FFFFFF');
    const eh=blink?.1:.6; dec(1.32,-.8,fz+1.3,-.25,fz+1.3+eh,'#0B3A5A'); dec(1.32,.25,fz+1.3,.8,fz+1.3+eh,'#0B3A5A'); }
  else if(k==='imp'){ const f=Math.sin(P.t*14)*.5; b(-1.4,-1,1.6,1.4,1,4,fl||C[0]); b(-1.6,-1.4,4,1.6,1.4,6.6,fl||C[0]); b(-1.6,-1.4,0,-.5,1,1.6,C[1]); b(.5,-1.4,0,1.6,1,1.6,C[1]);
    b(-1.5,-.3,6.6,-.9,.3,7.8,'#2A0A0A'); b(.9,-.3,6.6,1.5,.3,7.8,'#2A0A0A'); b(-4.2,-1.6-f,3.2,-1.4,-1.3,5.6,C[1]); b(1.4,-1.6-f,3.2,4.2,-1.3,5.6,C[1]);
    dec(1.4,-1.1,4.9,-.3,5.6,'#FFE08A'); dec(1.4,.3,4.9,1.1,5.6,'#FFE08A'); b(-.25,-2.6,1.4,.25,-1,1.8,C[1]); }
  else if(k==='skel'){ b(-1.7,-.6,0,-.4,.6,2.6,'#D8CFBC'); b(.4,-.6,0,1.7,.6,2.6,'#D8CFBC'); b(-2.1,-1.3,2.6,2.1,1.3,5.6,fl||'#3A3A44'); b(-2.2,-1.4,4.4,2.2,1.4,5.8,'#6A6E7A'); b(-2,-1.9,5.6,2,1.9,8.6,fl||C[0]);
    dec(1.9,-1.3,6.6,-.4,7.5,'#1A1A20'); dec(1.9,.4,6.6,1.3,7.5,'#1A1A20'); dec(1.96,-1,6.9,-.6,7.2,'#FF3A2A'); dec(1.96,.6,6.9,1,7.2,'#FF3A2A');
    const sw=P.atk?Math.sin(P.atk*Math.PI)*2:0; b(2.2,-.4,3+sw,3,.4,5.6,'#D8CFBC'); b(2.35,.2,4+sw,2.85,4.8,4.5+sw,'#B5BDC6'); b(-3.2,-1.6,2.8,-2.2,1.6,5.8,'#5A3A2A'); }
  else if(k==='hound'){ const r=P.mv?Math.sin(P.t*14)*.8:0; [[-2.4,-3.4],[1.2,-3.4],[-2.4,2.2],[1.2,2.2]].forEach(([x,y],i)=>b(x,y+(i%2?r:-r),0,x+1.2,y+1.2+(i%2?r:-r),2.6,C[0]));
    b(-2.6,-3.8,2.4,2.6,3.6,5.4,fl||C[0]); b(-2.7,-3.9,4.8,2.7,3.7,5.6,C[1]); b(-2,2.8,3.2,2,6.8,6.6,fl||C[0]); b(-1.4,6.6,3.4,1.4,8.2,5.2,fl||C[0]);
    dec(6.86,-1.5,5.4,-.5,6,C[1]); dec(6.86,.5,5.4,1.5,6,C[1]); b(-1.9,3.4,6.6,-.9,4.4,8,C[0]); b(.9,3.4,6.6,1.9,4.4,8,C[0]); b(-.5,-5.4,4.4,.5,-3.6,5.2,C[1]);
    for(let i=0;i<3;i++){ const z=6+Math.abs(Math.sin(P.t*8+i))*1.4; b(-1+i*.7,-1+i*1.6,5.6,-.4+i*.7,-.4+i*1.6,z,'#FF8A1A'); } }
  else if(k==='golem'){ const s=P.atk?Math.sin(P.atk*Math.PI)*2.4:0; b(-3,-1.6,0,-.6,1.6,4,C[0]); b(.6,-1.6,0,3,1.6,4,C[0]); b(-3.8,-2.4,4,3.8,2.4,10,fl||C[0]); b(-2.6,-2.5,6,2.6,-2.3,9,C[1]);
    dec(2.4,-2.6,5,2.6,9.4,'#2A2020'); dec(2.46,-1.6,6.4,1.6,8.6,C[1]); b(-2.6,-2,10,2.6,2,13,fl||C[0]); dec(2,-1.6,11,-.6,12,'#FFE08A'); dec(2,.6,11,1.6,12,'#FFE08A');
    b(-6,-1.4,4.6+s,-3.8,1.4,9.6+s,C[0]); b(3.8,-1.4,4.6+s,6,1.4,9.6+s,C[0]); b(-6.1,-1.5,4+s,-3.7,1.5,5+s,C[1]); b(3.7,-1.5,4+s,6.1,1.5,5+s,C[1]); }
  return B; }
/* ── 장애물(지옥 전용 포함) ── */
function dgDrawObs(g,t,ox,oy,u,tm,seed){ const C=(...a)=>wCube(g,ox,oy,u,...a);
  switch(t){
    case 'spike': wShadow(g,ox,oy+u,u*4,u*2); C(-2.4,-2.4,0,4.8,4.8,1.2,'#2A1A1C'); C(-1.4,-1.4,1.2,2.8,2.8,3,'#3A2226'); C(-.8,-.8,4.2,1.6,1.6,3,'#4A2A2E'); C(-.3,-.3,7.2,.6,.6,2,'#E6D6C0'); break;
    case 'obsid': wShadow(g,ox,oy+u,u*4,u*2); C(-2,-2,0,4,4,8,'#2A2236',{t:'#5A4A7A',l:'#3A2E4E',r:'#1E1828'}); C(-1.4,-1.4,8,2.8,2.8,2.6,'#3A2E4E',{t:'#7A6AA0',l:'#4A3E62',r:'#2A2238'}); break;
    case 'bones': C(-2,-.4,0,4,.8,.6,'#E6DCC8'); C(-.4,-2,0,.8,4,.6,'#D8CFBC'); C(-2.4,-.6,0,.8,1.2,.9,'#F2EADA'); break;
    case 'skull': wShadow(g,ox,oy+u,u*4,u*2); C(-3,-3,0,6,6,2,'#3A2226'); C(-2,-2,2,4,4,3.6,'#E6DCC8'); C(-1.4,1.95,3.2,1,.2,1.2,'#1A1010',{l:'#1A1010',r:'#1A1010',t:'#1A1010'}); C(.4,1.95,3.2,1,.2,1.2,'#1A1010',{l:'#1A1010',r:'#1A1010',t:'#1A1010'}); break;
    case 'fire': { wShadow(g,ox,oy+u,u*3,u*1.5); C(-2,-2,0,4,4,1,'#3A2226'); const f=1+Math.sin(tm*9+seed)*.3; C(-1.2,-1.2,1,2.4,2.4,2*f,'#FF5A1A',{t:'#FFB04A',l:'#FF7A2A',r:'#E8420A'}); C(-.6,-.6,1+2*f,1.2,1.2,1.4*f,'#FFD54A',{t:'#FFF2A0',l:'#FFE070',r:'#F2B020'}); break; }
    default: wDrawItem(g,t,ox,oy,u,tm,seed,1);
  } }
/* ── 전투 화면 ── */
function Dungeon({c,kind,onExit,getBricks,saveBricks}){
  const D=DG[kind]; const cv=useRef(null); const S=useRef(null);
  const [hud,setHud]=useState({hp:1,mhp:1,lv:1,xp:0,need:1,cdA:0,cdS:0,shield:false,boss:null,loot:{b:0,k:0,c:0,eq:[]},dead:false,lvup:0});
  const [toast,setToast]=useState(null); const [sum,setSum]=useState(null);
  const [chat,setChat]=useState(false); const [chest,setChest]=useState(null); const [stg,setStg]=useState(null); const [ctl,setCtl]=useState(wCtl()); const [ar,setAr]=useState(null);
  useEffect(()=>{ wBgm(D.story?'story':kind); const f=()=>setCtl(wCtl()); window.addEventListener('dko-wset',f); return ()=>window.removeEventListener('dko-wset',f); },[]);
  const rpg0=rpgOf(c.me);
  useEffect(()=>{
    const el=cv.current, g=el.getContext('2d'); let raf=0, dead=false; const dpr=Math.min(2,window.devicePixelRatio||1);
    const M=dgBuild(kind); const st=rpgStats(rpg0); const SP=D.story?[-3,1]:[0,2];
    const s=S.current={M,cam:{x:SP[0],y:SP[1],z:.9},tz:1,me:{x:SP[0],y:SP[1],path:[],yaw:0,ty:0,walk:false,v:0,ph:0,hp:st.hp,swing:0,blockT:0,lastHit:-9,dead:0,tgt:null},mobs:[],fx:[],drops:[],cdA:0,cdS:0,dying:[],
      portal:D.story?[-5,-1.5]:[0,-1.2],spawnPt:SP.slice(),stage:D.story?{ai:-1,spawned:{},cleared:{},t0:{},hurt:{},deaths:{}}:null,
      rpg:{...rpg0},st,loot:{b:0,k:0,c:0,eq:[],xp:0},nid:1,boss:{},last:performance.now(),save:performance.now(),others:new Map()};
    const blocked=(x,y)=>{ const k=x+','+y; return !M.T.has(k)||M.blk.has(k); };
    const DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    const bfs=(sx,sy,tx,ty)=>{ const k=(x,y)=>x+','+y; const q=[[sx,sy]]; let h=0; const prev=new Map([[k(sx,sy),null]]);
      while(h<q.length&&h<9000){ const [x,y]=q[h++]; if(x===tx&&y===ty){ const p=[]; let cur=k(x,y); while(cur){ const [a,b2]=cur.split(',').map(Number); p.unshift([a,b2]); cur=prev.get(cur); } return p; }
        for(const [dx,dy] of DIRS){ const nx=x+dx, ny=y+dy, kk=k(nx,ny); if(prev.has(kk)||blocked(nx,ny)) continue; if(dx&&dy&&(blocked(x+dx,y)||blocked(x,y+dy))) continue; prev.set(kk,k(x,y)); q.push([nx,ny]); } } return null; };
    const los=(a,b2)=>{ const d=Math.hypot(b2[0]-a[0],b2[1]-a[1]); const n=Math.ceil(d*5); for(let i=1;i<n;i++){ const x=a[0]+(b2[0]-a[0])*i/n, y=a[1]+(b2[1]-a[1])*i/n; for(const [ox,oy] of [[0,0],[.28,.28],[-.28,-.28],[.28,-.28],[-.28,.28]]) if(blocked(Math.round(x+ox),Math.round(y+oy))) return false; } return true; };
    const smooth=p=>{ if(p.length<3) return p; const o=[p[0]]; let i=0; while(i<p.length-1){ let j=p.length-1; while(j>i+1&&!los(p[i],p[j])) j--; o.push(p[j]); i=j; } return o; };
    const safe=(tx,ty)=>{ if(!blocked(tx,ty)) return [tx,ty]; for(let r=1;r<=4;r++){ let best=null,bd=1e9; for(let x=tx-r;x<=tx+r;x++) for(let y=ty-r;y<=ty+r;y++){ if(blocked(x,y)) continue; const d=Math.hypot(x-tx,y-ty); if(d<bd){ bd=d; best=[x,y]; } } if(best) return best; } return null; };
    const route=(fx0,fy0,tx,ty)=>{ const t=safe(tx,ty); if(!t) return null; const p=bfs(Math.round(fx0),Math.round(fy0),t[0],t[1]); if(!p) return null; return smooth([[fx0,fy0],...p.slice(1)]).slice(1); };
    s.go=(x,y)=>{ const p=route(s.me.x,s.me.y,x,y); if(p&&p.length){ s.me.path=p; const e=p[p.length-1]; s.mark={x:e[0],y:e[1],at:performance.now()}; return true; } return false; };
    /* 몬스터 */
    const tiles=[...M.T.values()];
    const spawn=(t,x,y,home,ar0,delay)=>{ const B=MOB[t]; const m={id:s.nid++,t,x,y,hx:home?home[0]:x,hy:home?home[1]:y,hp:B.hp,mhp:B.hp,yaw:Math.random()*6,ty:0,v:0,path:[],wait:Math.random()*2,atk:0,cd:0,hit:0,aggro:false,slamT:0,dashT:0,boss:!!B.boss,mini:!!B.mini,born:performance.now()+(delay||0),ar:ar0==null?null:ar0};
      s.mobs.push(m); return m; };
    /* 스토리: 구역에 들어가면 몬스터가 땅에서 솟아나요 */
    const spawnArea=i=>{ const A=D.areas[i], S0=s.stage; if(S0.spawned[i]) return; S0.spawned[i]=1; S0.t0[i]=performance.now(); S0.hurt[i]=0; S0.deaths[i]=0; S0.ai=i; let j=0;
      A.mobs.forEach(([t,n])=>{ for(let q=0;q<n;q++){ let p=null; for(let k=0;k<40&&!p;k++){ const a=Math.random()*6.28, r=(MOB[t].boss?Math.min(k*.25,3):1.5+Math.random()*(A.r-2.6)); const x=Math.round(A.c[0]+Math.cos(a)*r+(MOB[t].boss?2:0)), y=Math.round(A.c[1]+Math.sin(a)*r); if(!blocked(x,y)&&Math.hypot(x-s.me.x,y-s.me.y)>2.6) p=[x,y]; }
        if(p){ const m=spawn(t,p[0],p[1],A.c,i,j*140); m.aggro=!!MOB[t].boss||Math.random()<.5; j++; } } });
      if(!j){ setTimeout(()=>clearArea(i),600); }
      setAr({id:A.id,n:A.n,boss:!!A.boss,k:Date.now()}); if(A.boss){ wSfx('roar'); wBgm('boss'); s.shake=.8; } else wSfx('pop'); };
    const clearArea=i=>{ const A=D.areas[i], S0=s.stage; if(S0.cleared[i]) return; S0.cleared[i]=1; const now=performance.now(); const sec=(now-S0.t0[i])/1000;
      const stars=S0.deaths[i]?1:(sec<(A.boss?150:A.mobs.some(([t])=>MOB[t].mini)?90:55)&&S0.hurt[i]<s.st.hp*.6)?3:2;
      const r=s.rpg; const old=r.story||{best:0,stars:{},clears:0}; r.story={best:Math.max(old.best||0,i+1),stars:{...(old.stars||{}),[A.id]:Math.max((old.stars||{})[A.id]||0,stars)},clears:(old.clears||0)+(i===D.areas.length-1?1:0)};
      const gt=M.gates[i]; if(gt&&!gt.open){ gt.open=true; gt.at=now; gt.cells.forEach(([x,y])=>M.blk.delete(x+','+y)); setTimeout(()=>wSfx('gate'),500); s.shake=.5; }
      const tier=i===D.areas.length-1?(stars===3?'legend':'gold'):(STORY_CHEST[i]==='wood'&&stars===3?'silver':STORY_CHEST[i]);
      s.drops.push({k:'chest',tier,stars,label:A.id,x:A.c[0]+(A.boss?2:0),y:A.c[1],at:now,z:1}); s.spawnPt=[A.c[0],A.c[1]];
      wSfx('clear'); haptic([30,40,80]); setAr({id:A.id,n:A.n,clear:1,stars,k:Date.now()}); if(A.boss){ wBgm('story'); s.stage.done=1; } };
    const freeSpot=()=>{ for(let i=0;i<40;i++){ const t=tiles[Math.floor(Math.random()*tiles.length)]; if(M.blk.has(t.x+','+t.y)) continue; if(Math.hypot(t.x-s.me.x,t.y-s.me.y)<9) continue; if(Math.hypot(t.x,t.y)<7) continue; if(D.boss.some(([,bx,by])=>Math.hypot(t.x-bx,t.y-by)<7)) continue; return t; } return null; };
    const fill=()=>{ D.mobs.forEach(([t,n])=>{ const have=s.mobs.filter(m=>m.t===t).length; for(let i=have;i<n;i++){ const p=freeSpot(); if(p) spawn(t,p.x,p.y); } });
      D.boss.forEach(([t,bx,by])=>{ if(!s.mobs.some(m=>m.t===t)&&!(s.boss[t]>performance.now())) spawn(t,bx,by,[bx,by]); }); };
    fill(); s.fillAt=performance.now()+6000;
    const iso=(x,y)=>[(x-y)*WCF.TW/2,(x+y)*WCF.TH/2];
    const size=()=>{ const r=el.getBoundingClientRect(); el.width=Math.round(r.width*dpr); el.height=Math.round(r.height*dpr); s.vw=r.width; s.vh=r.height; s.tc=null; };
    size(); const ro=new ResizeObserver(size); ro.observe(el);
    const scr=(x,y)=>{ const [ix,iy]=iso(x,y); const [cx,cy]=iso(s.cam.x,s.cam.y); return [(ix-cx)*s.cam.z+s.vw/2,(iy-cy)*s.cam.z+s.vh/2]; };
    const unscr=(px,py)=>{ const [cx,cy]=iso(s.cam.x,s.cam.y); const ix=(px-s.vw/2)/s.cam.z+cx, iy=(py-s.vh/2)/s.cam.z+cy; const a=ix/(WCF.TW/2), b2=iy/(WCF.TH/2); return [(a+b2)/2,(b2-a)/2]; };
    s.scr=scr;
    const TL=D.tile;
    /* 땅은 화면보다 조금 넓게 한 번 그려 두고 옮겨 써요 (화질은 그대로, 매 프레임 수천 칸을 다시 안 그려요) */
    const MG=260;
    const drawTiles=(ctx,ox,oy,z)=>{ const HW=WCF.TW/2*z, HH=WCF.TH/2*z, SIDE=9*z;
      const list=tiles.filter(T=>{ const [ix,iy]=iso(T.x,T.y); const px=ix*z+ox, py=iy*z+oy; return px>-HW*2&&px<s.vw+MG*2+HW*2&&py>-HH*2-SIDE&&py<s.vh+MG*2+HH*2+SIDE; }).sort((a,b2)=>(a.x+a.y)-(b2.x+b2.y)||a.x-b2.x);
      /* 연못 · 용암: 절벽 아래로 물(용암)이 고여 있어요 */
      const lava=D.holes==='lava'; for(const [hx,hy] of (M.H||[])){ const [ix,iy]=iso(hx,hy); const px=ix*z+ox, py=iy*z+oy+SIDE*.55; if(px<-HW*2||px>s.vw+MG*2+HW*2||py<-HH*2||py>s.vh+MG*2+HH*2) continue;
        ctx.fillStyle=lava?(((hx+hy)&1)?'#FF6A1A':'#F25A12'):(((hx+hy)&1)?'#5FC9E6':'#56C0DF'); ctx.beginPath(); ctx.moveTo(px,py-HH); ctx.lineTo(px+HW,py); ctx.lineTo(px,py+HH); ctx.lineTo(px-HW,py); ctx.closePath(); ctx.fill();
        if(lava){ if(wHash(hx,hy,3)>.6){ ctx.fillStyle='rgba(60,10,0,.35)'; ctx.beginPath(); ctx.ellipse(px+(wHash(hx,hy,5)-.5)*HW,py,4*z,2*z,0,0,Math.PI*2); ctx.fill(); } }
        else if(wHash(hx,hy,7)>.78){ ctx.fillStyle='#4FB86A'; ctx.beginPath(); ctx.ellipse(px+(wHash(hx,hy,2)-.5)*HW*.8,py+(wHash(hx,hy,4)-.5)*HH*.8,4.4*z,2.4*z,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#FF9AC8'; ctx.fillRect(px-1*z,py-1.4*z,2*z,2*z); } }
      for(const T of list){ const [ix,iy]=iso(T.x,T.y); const px=ix*z+ox, py=iy*z+oy; const col=TL[T.t]||TL.g; const alt=((T.x+T.y)&1)?col[0]:col[1];
        const front=!M.T.has((T.x+1)+','+T.y), left=!M.T.has(T.x+','+(T.y+1));
        if(front){ ctx.fillStyle=kind==='hell'?'#2A1416':'#7A5A3E'; ctx.beginPath(); ctx.moveTo(px+HW,py); ctx.lineTo(px,py+HH); ctx.lineTo(px,py+HH+SIDE); ctx.lineTo(px+HW,py+SIDE); ctx.closePath(); ctx.fill(); }
        if(left){ ctx.fillStyle=kind==='hell'?'#3A1C1E':'#9A7450'; ctx.beginPath(); ctx.moveTo(px-HW,py); ctx.lineTo(px,py+HH); ctx.lineTo(px,py+HH+SIDE); ctx.lineTo(px-HW,py+SIDE); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle=alt; ctx.beginPath(); ctx.moveTo(px,py-HH); ctx.lineTo(px+HW,py); ctx.lineTo(px,py+HH); ctx.lineTo(px-HW,py); ctx.closePath(); ctx.fill();
        if(wHash(T.x,T.y,5)>.85){ ctx.fillStyle=kind==='hell'?'rgba(255,90,40,.18)':'rgba(40,120,40,.18)'; ctx.fillRect(px-2*z,py-z,2*z,3*z); ctx.fillRect(px+3*z,py+z,2*z,2*z); }
        if(kind!=='hell'&&T.t==='g'&&wHash(T.x,T.y,13)>.72){ ctx.strokeStyle='rgba(60,140,60,.55)'; ctx.lineWidth=1.2*z; const gx2=px+(wHash(T.x,T.y,2)-.5)*HW, gy2=py+(wHash(T.x,T.y,3)-.5)*HH; ctx.beginPath(); ctx.moveTo(gx2-2*z,gy2); ctx.lineTo(gx2-1*z,gy2-3*z); ctx.moveTo(gx2,gy2); ctx.lineTo(gx2+.5*z,gy2-4*z); ctx.moveTo(gx2+2*z,gy2); ctx.lineTo(gx2+2.5*z,gy2-2.6*z); ctx.stroke(); }
        if(kind!=='hell'&&T.t==='g'&&wHash(T.x,T.y,17)>.94){ ctx.fillStyle=['#FFFFFF','#FFD6E8','#FFF2A0','#C9E6FF'][Math.floor(wHash(T.x,T.y,8)*4)]; ctx.fillRect(px-3*z,py-1*z,2*z,2*z); ctx.fillRect(px+2*z,py+1*z,2*z,2*z); }
        if(T.t==='p'){ ctx.fillStyle='rgba(150,110,60,.22)'; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.ellipse(px+(wHash(T.x,T.y,i+20)-.5)*HW,py+(wHash(T.x,T.y,i+30)-.5)*HH,2.6*z,1.4*z,0,0,Math.PI*2); ctx.fill(); } }
        if(kind==='hell'&&wHash(T.x,T.y,19)>.86){ ctx.strokeStyle='rgba(255,110,40,.55)'; ctx.lineWidth=1.2*z; ctx.beginPath(); const a=wHash(T.x,T.y,1)*6; ctx.moveTo(px-Math.cos(a)*HW*.5,py-Math.sin(a)*HH*.5); ctx.lineTo(px,py+1*z); ctx.lineTo(px+Math.cos(a+.6)*HW*.45,py+Math.sin(a+.6)*HH*.45); ctx.stroke(); } } };
    const tileLayer=()=>{ const z=s.cam.z; const [cx,cy]=iso(s.cam.x,s.cam.y); const tc=s.tc;
      const ok=tc&&Math.abs(tc.z-z)<1e-4&&Math.abs((tc.cx-cx)*z)<MG*.8&&Math.abs((tc.cy-cy)*z)<MG*.8;
      if(!ok){ const c2=(tc&&tc.cv)||document.createElement('canvas'); c2.width=Math.round((s.vw+MG*2)*dpr); c2.height=Math.round((s.vh+MG*2)*dpr); const x2=c2.getContext('2d'); x2.setTransform(dpr,0,0,dpr,0,0); x2.clearRect(0,0,s.vw+MG*2,s.vh+MG*2);
        drawTiles(x2,-cx*z+s.vw/2+MG,-cy*z+s.vh/2+MG,z); s.tc={cv:c2,cx,cy,z}; }
      const T2=s.tc; g.drawImage(T2.cv,(T2.cx-cx)*z-MG,(T2.cy-cy)*z-MG,s.vw+MG*2,s.vh+MG*2); };
    const say=(t)=>{ setToast({t,k:Date.now()}); };
    const addXp=n=>{ const r=s.rpg; r.xp+=n; s.loot.xp+=n; let up=false; while(r.xp>=rpgNeed(r.lv)){ r.xp-=rpgNeed(r.lv); r.lv++; up=true; } if(up){ s.st=rpgStats(r); s.me.hp=s.st.hp; say('레벨 업! Lv.'+r.lv+' · 체력이 가득 찼어요'); haptic([20,30,60]); s.fx.push({k:'lv',x:s.me.x,y:s.me.y,at:performance.now()}); wSfx('lvl'); } };
    const dropLoot=m=>{ const B=MOB[m.t]; const n=rRand(B.b[0],B.b[1]); const k=Math.max(1,Math.min(6,Math.round(n/12)));
      for(let i=0;i<k;i++) s.drops.push({k:'b',n:Math.round(n/k),x:m.x+(Math.random()-.5)*1.4,y:m.y+(Math.random()-.5)*1.4,at:performance.now(),z:1});
      if(B.coin) s.drops.push({k:'c',n:rRand(B.coin[0],B.coin[1]),x:m.x,y:m.y+.5,at:performance.now(),z:1});
      const e=B.eq; if(e){ for(let i=0;i<e.length;i+=2){ if(Math.random()<e[i]){ const slot=EQ_S[Math.floor(Math.random()*EQ_S.length)].k; s.drops.push({k:'e',id:eqId(slot,e[i+1]),x:m.x+.4,y:m.y-.4,at:performance.now(),z:1}); } } } };
    const hurtMob=(m,dmg,crit)=>{ m.hp-=dmg; m.hit=.18; m.aggro=true; const kb=m.boss?.15:.55; const dx=m.x-s.me.x, dy=m.y-s.me.y, d=Math.hypot(dx,dy)||1; const nx=m.x+dx/d*kb, ny=m.y+dy/d*kb; if(!blocked(Math.round(nx),Math.round(ny))){ m.x=nx; m.y=ny; }
      s.fx.push({k:'num',x:m.x,y:m.y,at:performance.now(),t:String(dmg),crit,col:crit?'#FFD54A':'#FFFFFF'}); s.fx.push({k:'spk',x:m.x,y:m.y,at:performance.now(),crit,c:MOB[m.t].c[0]}); wSfx(crit?'crit':'hit');
      const B0=MOB[m.t]; if(B0.summon&&!m.sum1&&m.hp<m.mhp*.55){ m.sum1=1; summon(m); } if(B0.summon&&!m.sum2&&m.hp<m.mhp*.25){ m.sum2=1; summon(m); }
      if(m.hp<=0){ const now=performance.now(); s.mobs=s.mobs.filter(x=>x!==m); s.dying.push({m,at:now}); s.loot.k++; s.rpg.kills=(s.rpg.kills||0)+1; addXp(MOB[m.t].xp); dropLoot(m); s.fx.push({k:'poof',x:m.x,y:m.y,at:now,c:MOB[m.t].c[0],big:m.boss||m.mini}); wSfx(MOB[m.t].kind==='slime'?'slime':'pop');
        if(m.boss&&!D.story){ s.boss[m.t]=now+(MOB[m.t].re||80)*1000; s.drops.push({k:'chest',tier:m.t==='kslime'?'silver':'gold',x:m.x,y:m.y,at:now,z:1}); }
        if(m.boss){ s.rpg.boss=(s.rpg.boss||0)+1; say(MOB[m.t].n+' 처치! 보물 상자가 떨어졌어요'); haptic([30,40,80]); }
        if(!D.story&&s.loot.k>0&&s.loot.k%25===0) s.drops.push({k:'chest',tier:'wood',x:m.x,y:m.y,at:now,z:1});
        if(D.story&&m.ar!=null&&!s.mobs.some(x=>x.ar===m.ar)) clearArea(m.ar); } };
    const summon=m=>{ for(let i=0;i<3;i++){ const a=i/3*6.28+Math.random(); const x=Math.round(m.x+Math.cos(a)*3), y=Math.round(m.y+Math.sin(a)*3); if(!blocked(x,y)){ const q=spawn('mush',x,y,[m.hx,m.hy],m.ar,i*160); q.aggro=true; } } say(MOB[m.t].n+'이(가) 부하를 불렀어요!'); wSfx('roar'); s.shake=.6; };
    s.attack=()=>{ const me=s.me; if(me.dead||s.cdA>0) return; let best=null, bd=1e9; for(const m of s.mobs){ const d=Math.hypot(m.x-me.x,m.y-me.y)-(MOB[m.t].sz-1)*.5; if(d<bd){ bd=d; best=m; } }
      if(best&&bd>2.1&&bd<16){ me.tgt=best; const p=route(me.x,me.y,Math.round(best.x),Math.round(best.y)); if(p&&p.length){ p.pop(); me.path=p; } return; }
      s.cdA=.5; me.swing=1; me.tgt=null; if(best) me.ty=Math.atan2(-(best.x-me.x),best.y-me.y); wSfx('swing');
      setTimeout(()=>{ if(dead) return; const fx=-Math.sin(me.ty), fy=Math.cos(me.ty); let n=0;
        for(const m of [...s.mobs]){ const dx=m.x-me.x, dy=m.y-me.y, d=Math.hypot(dx,dy); const reach=2+(MOB[m.t].sz-1)*.55; if(d>reach) continue; if(d>.6&&(dx*fx+dy*fy)/d<-.25) continue;
          const crit=Math.random()<.12; const dmg=Math.max(1,Math.round(s.st.atk*(.85+Math.random()*.3)*(crit?1.8:1))); hurtMob(m,dmg,crit); n++; }
        haptic(n?14:6); s.fx.push({k:'arc',x:me.x,y:me.y,yaw:me.ty,at:performance.now()}); },140); };
    s.block=()=>{ const me=s.me; if(me.dead||!s.st.shield||s.cdS>0) return; me.blockT=s.st.dur; s.cdS=s.st.cd; haptic(10); wSfx('shield'); s.fx.push({k:'shup',x:me.x,y:me.y,at:performance.now()}); };
    const hurtMe=(dmg,src)=>{ const me=s.me; if(me.dead) return; let d=dmg*100/(100+s.st.def*5); if(me.blockT>0){ d*=1-s.st.block; s.fx.push({k:'blk',x:me.x,y:me.y,at:performance.now()}); wSfx('block'); } else wSfx('hurt'); d=Math.max(1,Math.round(d)); if(s.stage&&s.stage.ai>=0) s.stage.hurt[s.stage.ai]=(s.stage.hurt[s.stage.ai]||0)+d;
      me.hp-=d; me.lastHit=performance.now(); s.fx.push({k:'num',x:me.x,y:me.y,at:performance.now(),t:'-'+d,col:'#FF5A5A'}); s.shake=Math.min(1,(s.shake||0)+.4); haptic(18);
      if(me.hp<=0){ me.hp=0; me.dead=performance.now(); me.path=[]; const lost=Math.floor(s.loot.b*.3); s.loot.b-=lost; wSfx('die'); if(s.stage&&s.stage.ai>=0) s.stage.deaths[s.stage.ai]=(s.stage.deaths[s.stage.ai]||0)+1; say('쓰러졌어요… 아직 저장 안 된 벽돌 '+lost+'개를 잃었어요'); } };
    /* 다른 크루원(같은 세계에 있는 사람) */
    s.syncOthers=list=>{ const live=new Set(); list.forEach(o=>{ live.add(o.uid); let e=s.others.get(o.uid); if(!e){ e={x:o.x,y:o.y,yaw:0,ty:0,ph:0,walk:false,m:o.m}; s.others.set(o.uid,e); } e.m=o.m; e.tx=o.x; e.tY=o.y; e.say=o.say||null; }); for(const k of [...s.others.keys()]) if(!live.has(k)) s.others.delete(k); };
    let last=performance.now();
    const step=(o,vmax,dt)=>{ const [tx,ty]=o.path[0]; const dx=tx-o.x, dy=ty-o.y, d=Math.hypot(dx,dy); const want=Math.min(vmax,1.3+d*3+o.path.length); o.v=(o.v||0)+(want-(o.v||0))*Math.min(1,dt*8); const sp=o.v*dt;
      if(d<=sp){ o.x=tx; o.y=ty; o.path.shift(); } else { o.x+=dx/d*sp; o.y+=dy/d*sp; } o.ph=(o.ph||0)+sp*4.4; o.walk=true; if(d>.02) o.ty=Math.atan2(-dx,dy); if(!o.path.length) o.v=0; };
    const turn=(o,dt,k)=>{ let d=o.ty-o.yaw; while(d>Math.PI) d-=Math.PI*2; while(d<-Math.PI) d+=Math.PI*2; o.yaw+=d*Math.min(1,dt*k); };
    const frame=now=>{ if(dead) return; const dt=Math.min(.05,(now-last)/1000); last=now; const tm=now/1000; const me=s.me;
      s.cdA=Math.max(0,s.cdA-dt); s.cdS=Math.max(0,s.cdS-dt); me.swing=Math.max(0,me.swing-dt/.32); me.blockT=Math.max(0,me.blockT-dt);
      if(me.dead){ if(now-me.dead>3000){ me.dead=0; me.hp=s.st.hp; me.x=s.spawnPt[0]; me.y=s.spawnPt[1]; me.path=[]; say(D.story?'마지막으로 깬 구역에서 다시 일어났어요':'포털 앞에서 다시 일어났어요'); } }
      else if(s.freeze){ me.walk=false; }
      else { me.walk=false; const J=s.joy;
        if(J&&(Math.abs(J[0])>.12||Math.abs(J[1])>.12)){ me.path=[]; me.tgt=null; const mag=Math.min(1,Math.hypot(J[0],J[1])); const [wx,wy]=wJoyDir(J[0],J[1]); const want=4.4*s.st.spd*mag; me.v=(me.v||0)+(want-(me.v||0))*Math.min(1,dt*9); const sp=me.v*dt;
          const nx=me.x+wx*sp, ny=me.y+wy*sp; const ok=(x,y)=>!blocked(Math.round(x),Math.round(y)); if(ok(nx,ny)){ me.x=nx; me.y=ny; } else if(ok(nx,me.y)) me.x=nx; else if(ok(me.x,ny)) me.y=ny; me.ty=Math.atan2(-wx,wy); me.walk=true; me.ph+=sp*4.4; }
        else if(me.path.length) step(me,4.4*s.st.spd,dt); turn(me,dt,12);
        if(me.walk&&now-(s.stepAt||0)>300){ s.stepAt=now; wSfx('step',.7); s.fx.push({k:'step',x:me.x,y:me.y,at:now}); }
        if(D.story){ D.areas.forEach((A,i)=>{ if(!s.stage.spawned[i]&&Math.hypot(me.x-A.c[0],me.y-A.c[1])<A.r-1.2) spawnArea(i); }); }
        if(me.tgt&&!me.path.length){ if(s.mobs.includes(me.tgt)&&Math.hypot(me.tgt.x-me.x,me.tgt.y-me.y)<2.4){ const t2=me.tgt; me.tgt=null; me.ty=Math.atan2(-(t2.x-me.x),t2.y-me.y); s.attack(); } else me.tgt=null; }
        if(now-me.lastHit>4000&&me.hp<s.st.hp) me.hp=Math.min(s.st.hp,me.hp+s.st.hp*.03*dt*3); }
      /* 몬스터 */
      for(const m of (s.freeze?[]:s.mobs)){ const B=MOB[m.t]; if(m.born>now) continue; if(now-m.born<450){ m.mv=false; continue; } m.hit=Math.max(0,m.hit-dt); m.cd=Math.max(0,m.cd-dt); m.mv=false; const d=Math.hypot(me.x-m.x,me.y-m.y); const reach=.95+(B.sz-1)*.55;
        if(!me.dead&&d<(m.boss?7.5:5.2)) m.aggro=true; if(me.dead||d>(m.boss?12:9)||Math.hypot(m.x-m.hx,m.y-m.hy)>(m.boss?9:14)) { if(m.aggro&&(me.dead||d>(m.boss?12:9))) m.aggro=false; }
        if(m.atk>0){ m.atk+=dt/.5; if(m.atk>=1){ m.atk=0; if(!me.dead&&d<reach+.5) hurtMe(B.atk,m); } continue; }
        if(m.slamT>0){ m.slamT-=dt; if(m.slamT<=0){ s.fx.push({k:'slam',x:m.x,y:m.y,at:now,r:2.8}); s.shake=1; wSfx('slam'); if(!me.dead&&d<2.9) hurtMe(Math.round(B.atk*1.6),m); m.cd=1.2; } continue; }
        if(m.dashT>0){ m.dashT-=dt; if(m.dashT<=0){ m.dashing=.45; } continue; }
        if(m.dashing>0){ m.dashing-=dt; const sp=11*dt; const nx=m.x+m.dx*sp, ny=m.y+m.dy*sp; if(!blocked(Math.round(nx),Math.round(ny))){ m.x=nx; m.y=ny; } m.mv=true; if(!me.dead&&Math.hypot(me.x-m.x,me.y-m.y)<1.6&&!m.dhit){ m.dhit=1; hurtMe(Math.round(B.atk*1.3),m); } if(m.dashing<=0) m.cd=1.5; continue; }
        if(m.aggro&&!me.dead){ m.ty=Math.atan2(-(me.x-m.x),me.y-m.y);
          if(B.slam&&m.cd<=0&&d<4&&Math.random()<dt*.9){ m.slamT=1; m.cd=4.5; continue; }
          if(B.dash&&m.cd<=0&&d>3&&d<8&&Math.random()<dt*.8){ m.dashT=.7; m.dx=(me.x-m.x)/d; m.dy=(me.y-m.y)/d; m.dhit=0; m.cd=4; continue; }
          if(d<reach){ if(m.cd<=0){ m.atk=.001; m.cd=1.1+Math.random()*.5; } }
          else { const sp=B.spd*dt; const nx=m.x+(me.x-m.x)/d*sp, ny=m.y+(me.y-m.y)/d*sp; if(!blocked(Math.round(nx),Math.round(m.y))) m.x=nx; if(!blocked(Math.round(m.x),Math.round(ny))) m.y=ny; m.mv=true; } }
        else { if(m.path&&m.path.length){ const [tx,ty]=m.path[0]; const dx=tx-m.x, dy=ty-m.y, dd=Math.hypot(dx,dy); const sp=B.spd*.55*dt; if(dd<=sp){ m.x=tx; m.y=ty; m.path.shift(); } else { m.x+=dx/dd*sp; m.y+=dy/dd*sp; m.ty=Math.atan2(-dx,dy); } m.mv=true; }
          else { m.wait-=dt; if(m.wait<=0){ m.wait=2+Math.random()*4; const a=Math.random()*6.28, r=1+Math.random()*3.5; const tx=Math.round(m.hx+Math.cos(a)*r), ty=Math.round(m.hy+Math.sin(a)*r); if(!blocked(tx,ty)) m.path=[[tx,ty]]; } } }
        turn(m,dt,8); }
      if(now>s.fillAt){ s.fillAt=now+5000; fill(); }
      /* 전리품 줍기 */
      for(const p of s.drops){ const d=Math.hypot(p.x-me.x,p.y-me.y); const age=(now-p.at)/1000; p.z=Math.max(0,1-age*2.5);
        if(!me.dead&&age>.5&&d<2.6){ p.x+=(me.x-p.x)*Math.min(1,dt*7); p.y+=(me.y-p.y)*Math.min(1,dt*7); }
        if(!me.dead&&age>.5&&d<.5){ p.got=1; if(p.k==='b'){ s.loot.b+=p.n; s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:'+'+p.n,col:'#FFE08A',ic:'b'}); } else if(p.k==='c'){ s.loot.c+=p.n; s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:'+'+p.n+' D',col:'#FFB04A'}); } else if(p.k==='e'){ s.loot.eq.push(p.id); s.rpg.inv={...s.rpg.inv,[p.id]:(s.rpg.inv[p.id]||0)+1}; say(eqName(p.id)+' 획득!'); haptic([20,30,50]); wSfx('gem'); }
          else if(p.k==='chest'){ const got=chestRoll(p.tier,{stars:p.stars}); s.loot.b+=got.b; s.loot.c+=got.c; got.eq.forEach(id=>{ s.loot.eq.push(id); s.rpg.inv={...s.rpg.inv,[id]:(s.rpg.inv[id]||0)+1}; }); if(got.xp) addXp(got.xp); s.freeze=true; me.path=[];
            setChest({tier:p.tier,got,stars:p.stars,title:p.label?p.label+' 클리어!':'전리품 상자',k:now}); }
          if(p.k==='b'||p.k==='c') wSfx('pick'); } }
      s.drops=s.drops.filter(p=>!p.got&&now-p.at<60000);
      for(const o of s.others.values()){ if(o.tx!=null){ const dx=o.tx-o.x, dy=o.tY-o.y, d=Math.hypot(dx,dy); if(d>20){ o.x=o.tx; o.y=o.tY; } else if(d>.05){ const sp=Math.min(d,4*dt); o.x+=dx/d*sp; o.y+=dy/d*sp; o.ty=Math.atan2(-dx,dy); o.walk=true; o.ph+=sp*4.4; } else o.walk=false; turn(o,dt,8); } }
      s.cam.x+=(me.x-s.cam.x)*Math.min(1,dt*5); s.cam.y+=(me.y-s.cam.y)*Math.min(1,dt*5); s.cam.z+=(s.tz-s.cam.z)*Math.min(1,dt*6);
      draw(tm,now);
      if(now-(s.hudAt||0)>100){ s.hudAt=now; const bm=s.mobs.filter(m=>(m.boss||m.mini)&&m.aggro)[0];
        if(!D.story){ if(bm&&bm.boss&&!s.bossOn){ s.bossOn=1; wBgm('boss'); wSfx('roar'); } else if(!bm&&s.bossOn){ s.bossOn=0; wBgm(kind); } }
        setHud({stage:D.story?{ai:s.stage.ai,left:s.mobs.filter(m=>m.ar===s.stage.ai).length,cl:Object.keys(s.stage.cleared).length,done:!!s.stage.done}:null,hp:Math.max(0,me.hp),mhp:s.st.hp,lv:s.rpg.lv,xp:s.rpg.xp,need:rpgNeed(s.rpg.lv),cdA:s.cdA/.5,cdS:s.st.cd?s.cdS/s.st.cd:0,blocking:me.blockT>0,shield:s.st.shield,boss:bm?{n:MOB[bm.t].n,hp:bm.hp/bm.mhp}:null,loot:{...s.loot,b:s.loot.b+((s.saved||{}).b||0),c:s.loot.c+((s.saved||{}).c||0),k:s.loot.k+((s.saved||{}).k||0),eq:s.loot.eq.slice()},dead:!!me.dead}); }
      raf=requestAnimationFrame(frame); };
    const draw=(tm,now)=>{ const z=s.cam.z; g.setTransform(dpr,0,0,dpr,0,0);
      /* 배경: 연못물 · 용암이 천천히 일렁여요 */
      const bg=g.createLinearGradient(0,0,0,s.vh); bg.addColorStop(0,D.bg[0]); bg.addColorStop(1,D.bg[1]); g.fillStyle=bg; g.fillRect(0,0,s.vw,s.vh);
      if(kind==='hell'){ for(let i=0;i<8;i++){ const x=(wHash(i,2,2)*s.vw+Math.sin(tm*.4+i)*40), y=(wHash(i,5,5)*s.vh+Math.cos(tm*.3+i)*30); const rg=g.createRadialGradient(x,y,0,x,y,180); rg.addColorStop(0,'rgba(255,110,30,'+(.35+.15*Math.sin(tm*1.2+i))+')'); rg.addColorStop(1,'rgba(255,60,0,0)'); g.fillStyle=rg; g.fillRect(x-180,y-180,360,360); } }
      else { g.strokeStyle='rgba(255,255,255,.14)'; g.lineWidth=1.3; for(let i=0;i<26;i++){ const wx=(wHash(i,3,4)*s.vw*1.4+tm*10*(1+i%3))%(s.vw+80)-40, wy=wHash(i,8,2)*s.vh; g.beginPath(); g.moveTo(wx,wy); g.quadraticCurveTo(wx+8,wy-3,wx+16,wy); g.stroke(); } }
      const sh=s.shake||0; if(sh>0){ s.shake=Math.max(0,sh-.06); g.translate((Math.random()-.5)*sh*8,(Math.random()-.5)*sh*6); }
      tileLayer();
      const u=WCF.TW*z/17; const HW=WCF.TW/2*z, HH=WCF.TH/2*z;
      /* 스토리: 아직 안 간 구역 이름표 · 열린 문 쪽 안내 화살표 */
      if(D.story){ D.areas.forEach((A,i)=>{ if(s.stage.spawned[i]) return; const [px,py]=scr(A.c[0],A.c[1]); if(px<-120||px>s.vw+120||py<-120||py>s.vh+120) return; const bob=Math.sin(tm*2+i)*u;
          g.fillStyle='rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(px,py,HW*3,HH*3,0,0,Math.PI*2); g.fill(); g.strokeStyle='rgba(255,255,255,.55)'; g.setLineDash([6,5]); g.lineWidth=2; g.stroke(); g.setLineDash([]);
          g.font='900 '+Math.max(14,u*4.4)+'px "Koverwatch","NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.lineWidth=5; g.strokeStyle='rgba(60,40,10,.6)'; g.strokeText(A.id,px,py-u*10+bob); g.fillStyle=A.boss?'#FFD54A':'#FFFFFF'; g.fillText(A.id,px,py-u*10+bob);
          g.font='800 '+Math.max(10,u*2.4)+'px "NEXON Kart Gothic",sans-serif'; g.lineWidth=3; g.strokeText(A.n,px,py-u*6+bob); g.fillStyle='#FFF6DE'; g.fillText(A.n,px,py-u*6+bob); });
        const nx=M.gates.find(gt=>gt.open&&!s.stage.spawned[gt.i+1]); if(nx){ const [px,py]=scr(nx.x,nx.y); const k=(tm*1.6)%1; g.fillStyle='rgba(255,213,74,'+(1-k)+')'; g.beginPath(); g.moveTo(px,py-u*12+k*u*4); g.lineTo(px+u*3,py-u*16+k*u*4); g.lineTo(px-u*3,py-u*16+k*u*4); g.closePath(); g.fill(); } }
      if(s.mark&&s.me.path.length){ const [px,py]=scr(s.mark.x,s.mark.y); const k=((now-s.mark.at)/900)%1; g.strokeStyle='rgba(255,255,255,'+(.85-k*.6)+')'; g.lineWidth=2; g.beginPath(); g.ellipse(px,py,HW*(.25+k*.35),HH*(.25+k*.35),0,0,Math.PI*2); g.stroke(); }
      /* 보스 공격 예고 */
      for(const m of s.mobs){ if(m.slamT>0){ const [px,py]=scr(m.x,m.y); const k=1-m.slamT; g.fillStyle='rgba(255,40,40,'+(.12+k*.25)+')'; g.strokeStyle='rgba(255,80,60,.9)'; g.lineWidth=2; g.beginPath(); g.ellipse(px,py,HW*2.8,HH*2.8,0,0,Math.PI*2); g.fill(); g.stroke(); g.fillStyle='rgba(255,60,40,.35)'; g.beginPath(); g.ellipse(px,py,HW*2.8*k,HH*2.8*k,0,0,Math.PI*2); g.fill(); }
        if(m.dashT>0){ const [ax,ay]=scr(m.x,m.y), [bx,by]=scr(m.x+m.dx*5,m.y+m.dy*5); g.strokeStyle='rgba(255,80,40,.75)'; g.lineWidth=HH*1.4; g.lineCap='round'; g.beginPath(); g.moveTo(ax,ay); g.lineTo(bx,by); g.stroke(); g.lineCap='butt'; } }
      const ents=[];
      for(const o of M.obs){ const [px,py]=scr(o.x,o.y); if(px<-80||px>s.vw+80||py<-120||py>s.vh+60) continue; ents.push({d:o.x+o.y,k:'o',o,px,py}); }
      for(const m of s.mobs){ const [px,py]=scr(m.x,m.y); if(px<-120||px>s.vw+120||py<-160||py>s.vh+80) continue; ents.push({d:m.x+m.y+.03,k:'m',m,px,py}); }
      for(const p of s.drops){ const [px,py]=scr(p.x,p.y); ents.push({d:p.x+p.y+.01,k:'p',p,px,py}); }
      for(const [uid,o] of s.others){ const [px,py]=scr(o.x,o.y); ents.push({d:o.x+o.y+.04,k:'x',o,px,py}); }
      { const [px,py]=scr(s.portal[0],s.portal[1]); ents.push({d:s.portal[0]+s.portal[1],k:'portal',px,py}); }
      for(const gt of M.gates||[]){ const [px,py]=scr(gt.x,gt.y); if(px<-200||px>s.vw+200||py<-200||py>s.vh+200) continue; ents.push({d:gt.x+gt.y,k:'gate',gt,px,py}); }
      for(const dm of s.dying){ const [px,py]=scr(dm.m.x,dm.m.y); ents.push({d:dm.m.x+dm.m.y+.02,k:'dm',dm,px,py}); }
      { const [px,py]=scr(s.me.x,s.me.y); ents.push({d:s.me.x+s.me.y+.05,k:'me',px,py}); }
      ents.sort((a,b2)=>a.d-b2.d);
      const eqL=rpgEqLook(s.rpg);
      for(const e of ents){ const {px,py}=e;
        if(e.k==='o') dgDrawObs(g,e.o.t,px,py,u,tm,(e.o.x*7+e.o.y)&255);
        else if(e.k==='portal'){ const col=D.col; const t=tm*2; g.save(); wCube(g,px,py,u,-5,-1,0,2,2,11,kind==='hell'?'#2A1416':'#5A6E7A'); wCube(g,px,py,u,3,-1,0,2,2,11,kind==='hell'?'#2A1416':'#5A6E7A'); wCube(g,px,py,u,-5,-1,11,10,2,2,kind==='hell'?'#3A1C1E':'#6A7E8A');
          const P2=(a,b2,c2)=>[px+(a-b2)*u,py+(a+b2)*u*.5-c2*u]; const gr=g.createLinearGradient(...P2(0,0,11),...P2(0,0,0)); gr.addColorStop(0,col[0]); gr.addColorStop(1,col[1]); g.globalAlpha=.75+.15*Math.sin(t); g.fillStyle=gr; g.beginPath(); const q=[P2(-3,0,0),P2(3,0,0),P2(3,0,11),P2(-3,0,11)]; g.moveTo(...q[0]); q.slice(1).forEach(p=>g.lineTo(...p)); g.closePath(); g.fill(); g.globalAlpha=1;
          g.font='900 '+Math.max(10,u*2.4)+'px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.fillStyle='rgba(10,12,20,.7)'; const tw=g.measureText('DKO 월드로').width+14; rr(g,px-tw/2,py-u*18,tw,u*3.6,u*1.8); g.fill(); g.fillStyle='#fff'; g.textBaseline='middle'; g.fillText('DKO 월드로',px,py-u*16.2); g.restore(); }
        else if(e.k==='gate'){ const gt=e.gt; const k=gt.open?Math.min(1,(now-gt.at)/900):0; if(k>=1&&gt.open){ const ends=[gt.cells[0],gt.cells[gt.cells.length-1]]; ends.forEach(([x,y])=>{ const [qx,qy]=scr(x,y); wCube(g,qx,qy,u,-2,-2,0,4,4,9,'#B9A27E',{t:'#E8D7B0',l:'#CDB68E',r:'#9E8662'}); wCube(g,qx,qy,u,-2.5,-2.5,9,5,5,1.4,'#8A6A44'); }); continue; }
          for(const [x,y] of gt.cells){ const [qx,qy]=scr(x,y); const sink=wEase(k)*9; g.save(); if(k>0){ g.globalAlpha=1-k*.6; } wCube(g,qx,qy+sink*u*.6,u,-1.2,-3,0,2.4,6,Math.max(.5,10-sink),'#8A5A34',{t:'#A06C42',l:'#9A6A40',r:'#6E4426'}); wCube(g,qx,qy+sink*u*.6,u,-1.5,-3.2,Math.max(.5,10-sink)-.6,3,6.4,1,'#5E3A1E'); g.restore();
            if(!gt.open&&wHash(x,y,3)>.5){ g.fillStyle='#4FB86A'; g.beginPath(); g.ellipse(qx+u*1.2,qy-u*6,u*1.6,u*1,0,0,Math.PI*2); g.fill(); } }
          if(!gt.open){ const bob=Math.sin(tm*3)*u*.6; g.fillStyle='rgba(20,14,8,.78)'; rr(g,e.px-u*7,e.py-u*20+bob,u*14,u*5,u*2.5); g.fill(); g.fillStyle='#FFE08A'; g.font='900 '+Math.max(10,u*2.4)+'px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('🔒 '+D.areas[gt.i].id+' 깨면 열려요',e.px,e.py-u*17.5+bob); }
          else { g.globalAlpha=1-k; g.fillStyle='rgba(255,230,140,'+(.6*(1-k))+')'; g.beginPath(); g.ellipse(e.px,e.py,u*10*(1+k),u*5*(1+k),0,0,Math.PI*2); g.fill(); g.globalAlpha=1; } }
        else if(e.k==='dm'){ const dm=e.dm, m=dm.m, B=MOB[m.t]; const k=(now-dm.at)/320; if(k>=1) continue; const sc=B.sz; g.save(); g.translate(px,py); g.scale(sc*(1+k*.5),sc*(1-k*.85)); g.globalAlpha=1-k*.4; vxDraw(g,0,0,u*.9,mobBoxes(m,{t:tm,hit:.1,mv:false,atk:0}),m.yaw,VX_ISO); g.restore(); }
        else if(e.k==='m'){ const m=e.m, B=MOB[m.t]; if(m.born>now) continue; const bk=Math.min(1,(now-m.born)/450); const sc=B.sz*(bk<1?wBack(bk):1);
          if(bk<1){ g.strokeStyle='rgba(255,255,255,'+(1-bk)+')'; g.lineWidth=2.5; g.beginPath(); g.ellipse(px,py,HW*(.4+bk*.9)*B.sz,HH*(.4+bk*.9)*B.sz,0,0,Math.PI*2); g.stroke(); for(let i=0;i<6;i++){ const a=i/6*6.28; g.fillStyle='rgba(140,110,70,'+(.7*(1-bk))+')'; g.fillRect(px+Math.cos(a)*u*4*bk-u*.6,py+Math.sin(a)*u*2*bk-u*2*bk,u*1.2,u*1.2); } }
          if(B.kind==='wisp'){ const rg=g.createRadialGradient(px,py-u*6,0,px,py-u*6,u*10); rg.addColorStop(0,'rgba(170,240,255,.55)'); rg.addColorStop(1,'rgba(170,240,255,0)'); g.fillStyle=rg; g.fillRect(px-u*10,py-u*16,u*20,u*20); }
          wShadow(g,px,py+u*.3,u*3.4*sc,u*1.6*sc,.3); g.save(); g.translate(px,py); g.scale(sc,sc); vxDraw(g,0,0,u*.9,mobBoxes(m,{t:tm,hit:m.hit,mv:m.mv,atk:m.atk}),m.yaw,VX_ISO); g.restore();
          if(m.atk>0||m.slamT>0||m.dashT>0){ g.fillStyle='#FF3A2A'; g.font='900 '+Math.max(14,u*4)+'px sans-serif'; g.textAlign='center'; g.fillText('!',px,py-u*(10*sc+4)); }
          if(m.hp<m.mhp||m.aggro){ const bw=Math.max(34,u*8*Math.min(sc,1.6)), by=py-u*(9*sc+2); g.fillStyle='rgba(10,10,16,.7)'; rr(g,px-bw/2-2,by-2,bw+4,8,4); g.fill(); g.fillStyle=m.boss?'#FF5A3D':'#7CD957'; rr(g,px-bw/2,by,bw*Math.max(0,m.hp/m.mhp),4,2); g.fill();
            if(m.boss||m.mini){ g.font='900 '+Math.max(10,u*2.2)+'px "NEXON Kart Gothic",sans-serif'; g.fillStyle='#fff'; g.textAlign='center'; g.fillText(B.n,px,by-8); } } }
        else if(e.k==='p'){ const p=e.p; const bob=Math.sin(tm*5+p.x)*u*.6-p.z*u*6; if(p.k==='b') wBrick(g,px,py-u*2+bob,u*.7); else if(p.k==='c'){ g.fillStyle='#FFB04A'; g.beginPath(); g.arc(px,py-u*3+bob,u*1.6,0,Math.PI*2); g.fill(); g.fillStyle='#FFE08A'; g.beginPath(); g.arc(px-u*.4,py-u*3.4+bob,u*.6,0,Math.PI*2); g.fill(); }
          else if(p.k==='chest'){ const T=CHEST[p.tier]||CHEST.wood; const gl=.5+.5*Math.sin(tm*4); g.save(); g.globalCompositeOperation='lighter'; const rg=g.createRadialGradient(px,py-u*3,0,px,py-u*3,u*12); rg.addColorStop(0,'rgba(255,230,150,'+(.35+gl*.25)+')'); rg.addColorStop(1,'rgba(255,230,150,0)'); g.fillStyle=rg; g.fillRect(px-u*12,py-u*15,u*24,u*24); g.restore();
            const by2=bob*.6; wShadow(g,px,py+u*.6,u*4,u*2); wCube(g,px,py-by2,u,-2.6,-1.8,0,5.2,3.6,3,T.c[1],{t:T.c[0],l:T.c[0],r:T.c[1]}); wCube(g,px,py-by2,u,-2.8,-2,3,5.6,4,1.6,T.c[0],{t:T.g,l:T.c[0],r:T.c[1]}); wCube(g,px,py-by2,u,-.5,1.75,1.8,1,.3,1.6,'#FFD54A',{t:'#FFF0A0',l:'#FFD54A',r:'#C99A1A'});
            for(let i=0;i<3;i++){ const a=tm*2+i*2.1; g.fillStyle='rgba(255,250,220,'+(.5+.5*Math.sin(a*1.5))+')'; g.fillRect(px+Math.cos(a)*u*4-u*.4,py-u*8+Math.sin(a)*u*2-by2-u*.4,u*.8,u*.8); } }
          else { const T=EQ_TC[eqParse(p.id).t]||EQ_TC.b; g.save(); g.shadowColor=T[0]; g.shadowBlur=u*4; g.fillStyle=T[0]; g.beginPath(); g.moveTo(px,py-u*7+bob); g.lineTo(px+u*2,py-u*4+bob); g.lineTo(px,py-u*1+bob); g.lineTo(px-u*2,py-u*4+bob); g.closePath(); g.fill(); g.restore(); g.fillStyle=T[2]; g.fillRect(px-u*.5,py-u*5.4+bob,u,u); } }
        else if(e.k==='x'){ const o=e.o; wDrawChar(g,px,py-(o.walk?Math.abs(Math.sin(o.ph*.5))*u*.6:0),u*.95,avatarOf(o.m),o.yaw,tm+o.x,o.walk,dispName(o.m),false,{ph:o.ph,on:true,eq:rpgEqLook(rpgOf(o.m))}); if(o.say&&Date.now()-o.say.at<7000) wBubble(g,px,py-u*21,o.say,u); }
        else if(e.k==='me'){ const me=s.me; if(me.dead){ g.globalAlpha=.45; } const bob=me.walk?Math.abs(Math.sin(me.ph*.5))*u*.6:0; wDrawChar(g,px,py-bob,u*.95,avatarOf(c.me),me.yaw,tm,me.walk,null,true,{ph:me.ph,eq:eqL,swing:me.swing,block:me.blockT>0}); g.globalAlpha=1;
          if(me.blockT>0) wHexShield(g,px,py-u*7.5,u,tm,me.blockT/s.st.dur,(eqL.shield||'b'));
          if(me.say&&Date.now()-me.say.at<7000) wBubble(g,px,py-u*21,me.say,u); }
      }
      /* 효과 */
      s.fx=s.fx.filter(f=>now-f.at<1100);
      for(const f of s.fx){ const [px,py]=scr(f.x,f.y); const k=(now-f.at)/1100;
        if(f.k==='num'){ g.globalAlpha=1-Math.max(0,k-.6)/.4; g.font='900 '+(f.crit?Math.max(18,u*5):Math.max(13,u*3.4))+'px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.lineWidth=4; g.strokeStyle='rgba(20,10,0,.75)'; const y=py-u*14-k*u*10; g.strokeText(f.t,px,y); g.fillStyle=f.col; g.fillText(f.t,px,y); g.globalAlpha=1; }
        else if(f.k==='arc'){ if(k>.45) continue; const kk=k/.45; const fx=-Math.sin(f.yaw), fy=Math.cos(f.yaw); const [qx,qy]=scr(f.x+fx*1.1,f.y+fy*1.1); const T=EQ_TC[eqL.weapon]||['#FFFFFF','#C8D0DA']; const a0=Math.PI*(1.05+kk*.2), a1=Math.PI*(1.95+kk*.2);
          g.save(); g.globalAlpha=1-kk; g.fillStyle=T[0]; g.beginPath(); g.ellipse(qx,qy-u*4,HW*1.25,HH*1.25,0,a0,a1); g.ellipse(qx,qy-u*4.6,HW*.95,HH*.9,0,a1,a0,true); g.closePath(); g.fill(); g.strokeStyle='#FFFFFF'; g.lineWidth=2; g.beginPath(); g.ellipse(qx,qy-u*4,HW*1.25,HH*1.25,0,a0,a1); g.stroke(); g.restore(); }
        else if(f.k==='spk'){ if(k>.35) continue; const kk=k/.35; g.strokeStyle=f.crit?'rgba(255,220,90,'+(1-kk)+')':'rgba(255,255,255,'+(1-kk)+')'; g.lineWidth=(f.crit?3:2)*(1-kk)+.5; for(let i=0;i<(f.crit?10:7);i++){ const a=i/(f.crit?10:7)*6.28+f.at; const r0=u*(1+kk*3), r1=u*(2.4+kk*(f.crit?7:5)); g.beginPath(); g.moveTo(px+Math.cos(a)*r0,py-u*5+Math.sin(a)*r0*.7); g.lineTo(px+Math.cos(a)*r1,py-u*5+Math.sin(a)*r1*.7); g.stroke(); }
          if(f.crit){ g.fillStyle='rgba(255,240,160,'+(1-kk)+')'; g.beginPath(); g.arc(px,py-u*5,u*(2.5-kk*1.5),0,Math.PI*2); g.fill(); } }
        else if(f.k==='shup'){ if(k>.5) continue; const kk=k/.5; g.strokeStyle='rgba(160,220,255,'+(1-kk)+')'; g.lineWidth=3; g.beginPath(); for(let i=0;i<=6;i++){ const a=i/6*6.28+Math.PI/6; const r=u*(4+kk*8); const x=px+Math.cos(a)*r, y=py-u*7.5+Math.sin(a)*r*.9; i?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); }
        else if(f.k==='step'){ if(k>.35) continue; const kk=k/.35; g.fillStyle=(kind==='hell'?'rgba(120,70,60,':'rgba(240,228,200,')+((1-kk)*.55)+')'; g.beginPath(); g.arc(px-u*1.2,py-kk*u*1.5,u*(.8+kk*.8),0,Math.PI*2); g.arc(px+u*1.2,py-kk*u*1.2,u*(.6+kk*.6),0,Math.PI*2); g.fill(); }
        else if(f.k==='poof'){ for(let i=0;i<(f.big?24:12);i++){ const a=i/12*Math.PI*2+wHash(i,2,2); const sp=u*(f.big?14:7)*wEase(k*1.4); g.fillStyle=i%3?f.c:'#FFFFFF'; g.globalAlpha=1-k; const s2=u*(1.4-k); g.fillRect(px+Math.cos(a)*sp-s2/2,py-u*4+Math.sin(a)*sp*.6-s2/2,s2,s2); } g.globalAlpha=1; }
        else if(f.k==='slam'){ g.strokeStyle='rgba(255,140,60,'+(1-k)+')'; g.lineWidth=6*(1-k); g.beginPath(); g.ellipse(px,py,HW*f.r*(.5+k),HH*f.r*(.5+k),0,0,Math.PI*2); g.stroke(); }
        else if(f.k==='blk'){ g.strokeStyle='rgba(200,240,255,'+(1-k)+')'; g.lineWidth=3; g.beginPath(); g.arc(px,py-u*7,u*(8+k*6),0,Math.PI*2); g.stroke(); }
        else if(f.k==='lv'){ g.strokeStyle='rgba(255,213,74,'+(1-k)+')'; g.lineWidth=4; for(let i=0;i<3;i++){ g.beginPath(); g.ellipse(px,py-u*i*4*k,HW*(.6+k),HH*(.6+k),0,0,Math.PI*2); g.stroke(); } } }
      s.dying=s.dying.filter(d=>now-d.at<330);
      g.setTransform(dpr,0,0,dpr,0,0);
      /* 분위기 입자: 지옥 불티 · 슬라임 섬 물방울 · 동화 숲 꽃잎과 반딧불 */
      for(let i=0;i<22;i++){ const sp=.06+wHash(i,3,3)*.08; const k=(tm*sp+wHash(i,1,1))%1; const x=(wHash(i,2,2)*s.vw+Math.sin(tm*.7+i)*30+s.vw)%s.vw;
        if(kind==='hell'){ const y=s.vh*(1-k); g.fillStyle='rgba(255,'+(120+Math.floor(wHash(i,4,4)*100))+',40,'+(Math.sin(k*Math.PI)*.8)+')'; g.fillRect(x,y,2.2,2.2); }
        else if(kind==='story'){ if(i%2){ const y=s.vh*k; g.fillStyle=['rgba(255,182,206,','rgba(255,240,170,','rgba(200,240,170,'][i%3]+(Math.sin(k*Math.PI)*.75)+')'; g.save(); g.translate(x,y); g.rotate(tm*2+i); g.fillRect(-3,-1.5,6,3); g.restore(); } else { const y=wHash(i,6,6)*s.vh+Math.sin(tm+i)*20; const gl=.5+.5*Math.sin(tm*3+i*2); g.fillStyle='rgba(255,250,170,'+(gl*.8)+')'; g.beginPath(); g.arc(x,y,1.6+gl,0,Math.PI*2); g.fill(); } }
        else { const y=s.vh*(1-k); g.strokeStyle='rgba(255,255,255,'+(Math.sin(k*Math.PI)*.5)+')'; g.lineWidth=1.2; g.beginPath(); g.arc(x,y,2+wHash(i,5,5)*3,0,Math.PI*2); g.stroke(); } }
      if(s.me.hp<s.st.hp*.3&&!s.me.dead){ const a=.18+.12*Math.sin(tm*6); const vg=g.createRadialGradient(s.vw/2,s.vh/2,s.vh*.3,s.vw/2,s.vh/2,s.vh*.75); vg.addColorStop(0,'rgba(255,0,0,0)'); vg.addColorStop(1,'rgba(200,0,0,'+a+')'); g.fillStyle=vg; g.fillRect(0,0,s.vw,s.vh); }
    };
    raf=requestAnimationFrame(frame);
    if(/^file:|localhost/.test(location.href)) window.__dg=s;
    /* 이동: 땅을 누르면 걸어가요 (몬스터를 누르면 쫓아가서 공격) */
    let dn=null;
    const down=e=>{ dn={x:e.clientX,y:e.clientY,t:performance.now()}; };
    const up=e=>{ if(!dn) return; const moved=Math.hypot(e.clientX-dn.x,e.clientY-dn.y)>10; dn=null; if(moved||s.me.dead) return; const r=el.getBoundingClientRect(); const sx=e.clientX-r.left, sy=e.clientY-r.top;
      const hit=s.mobs.map(m=>{ const [px,py]=scr(m.x,m.y); return {m,d:Math.hypot(px-sx,py-(sy+u0()*5*MOB[m.t].sz))}; }).sort((a,b2)=>a.d-b2.d)[0];
      if(hit&&hit.d<Math.max(30,u0()*7*MOB[hit.m.t].sz)){ s.me.tgt=hit.m; const p=route(s.me.x,s.me.y,Math.round(hit.m.x),Math.round(hit.m.y)); if(p&&p.length){ p.pop(); s.me.path=p; } else s.attack(); return; }
      const [wx,wy]=unscr(sx,sy); s.me.tgt=null; s.go(Math.round(wx),Math.round(wy)); };
    const u0=()=>WCF.TW*s.cam.z/17;
    const wheel=e=>{ e.preventDefault(); s.tz=Math.max(.6,Math.min(1.8,s.tz*(e.deltaY>0?.9:1.1))); };
    el.addEventListener('pointerdown',down); el.addEventListener('pointerup',up); el.addEventListener('wheel',wheel,{passive:false});
    return ()=>{ dead=true; cancelAnimationFrame(raf); ro.disconnect(); el.removeEventListener('pointerdown',down); el.removeEventListener('pointerup',up); el.removeEventListener('wheel',wheel); };
  },[]);
  /* 저장: 경험치 · 레벨 · 장비 가방은 회원 문서, 벽돌은 내 섬, D-Coin은 지갑 */
  const commit=(final)=>{ const s=S.current; if(!s) return Promise.resolve(); const L=s.loot; const r=s.rpg;
    const b=L.b, cn=L.c; L.b=0; L.c=0; const eq=L.eq.slice(); L.eq=[]; const xp=L.xp, k=L.k; L.xp=0; L.k=0;
    const jobs=[c.saveRpg(()=>({lv:r.lv,xp:r.xp,inv:r.inv,kills:r.kills||0,boss:r.boss||0,...(r.story?{story:r.story}:{})}))];
    if(b) jobs.push(saveBricks(b)); if(cn) jobs.push(c.worldCoins(cn));
    s.saved=(s.saved||{b:0,c:0,eq:[],xp:0,k:0}); s.saved.b+=b; s.saved.c+=cn; s.saved.eq.push(...eq); s.saved.xp+=xp; s.saved.k+=k;
    return Promise.all(jobs).catch(()=>{}); };
  useEffect(()=>{ const iv=setInterval(()=>commit(false),45000); return ()=>clearInterval(iv); },[]);
  /* 같은 세계 접속자 표시 + 내 위치 알리기 */
  useEffect(()=>{ const s=S.current; if(!s) return; const list=(c.islands||[]).filter(I=>I.uid!==c.uid&&I.here&&I.here.zone===kind&&Date.now()-I.here.at<65000).map(I=>({uid:I.uid,x:I.here.x,y:I.here.y,say:I.here.say,m:c.members.find(m=>m.uid===I.uid)})).filter(o=>o.m); s.syncOthers(list); });
  const ping=()=>{ const s=S.current; if(s&&c.islandPing){ const h={at:Date.now(),x:Math.round(s.me.x*10)/10,y:Math.round(s.me.y*10)/10,zone:kind}; if(s.me.say&&Date.now()-s.me.say.at<60000) h.say=s.me.say; c.islandPing({here:h}); } };
  useEffect(()=>{ const t=setTimeout(ping,600); const iv=setInterval(ping,15000); return ()=>{ clearTimeout(t); clearInterval(iv); }; },[]);
  const sayD=(t,emo)=>{ t=String(t||'').trim().slice(0,60); if(!t) return; const s=S.current; if(!s) return; s.me.say={t,at:Date.now()}; ping(); c.sendMessage(t,'world'); };
  const stkD=id=>{ const s=S.current; if(!s) return; s.me.say={st:id,t:'',at:Date.now()}; ping(); c.sendSticker(id,'world'); };
  const leave=()=>{ commit(true).then(()=>{}); const s=S.current; const sv=s&&s.saved; setSum(sv||{b:0,c:0,eq:[],xp:0,k:0}); };
  useEffect(()=>{ if(!toast) return; const t=setTimeout(()=>setToast(null),2400); return ()=>clearTimeout(t); },[toast&&toast.k]);
  const H=hud; const pct=x=>Math.max(0,Math.min(100,x*100))+'%';
  return html`<div className=${'dg26 k-'+kind}>
    <canvas ref=${cv} className="dg26-cv" aria-label=${D.n}></canvas>
    <div className="dg26-top">
      <button className="dg26-x tap" onClick=${leave} aria-label="나가기"><${Icon} n="exit" s=${18} w=${2.4}/></button>
      <div className="dg26-me"><div className="dg26-nm"><em>Lv.${H.lv}</em><b>${D.n}</b></div>
        <div className="dg26-hp"><i style=${{width:pct(H.hp/H.mhp)}}></i><span>${Math.ceil(H.hp)} / ${H.mhp}</span></div>
        <div className="dg26-xp"><i style=${{width:pct(H.xp/H.need)}}></i></div></div>
      <div className="dg26-loot"><span><${BrickIc} s=${15}/>${H.loot.b}</span><span><${Icon} n="swords" s=${13} w=${2.4}/>${H.loot.k}</span>${H.loot.c?html`<span><${Coin} s=${13}/>${H.loot.c}</span>`:null}</div>
      <button className=${'dg30-chat tap'+(chat?' on':'')} onClick=${()=>setChat(!chat)} aria-label="채팅"><${Icon} n="chat" s=${18} w=${2.3}/></button>
    </div>
    ${H.stage?html`<div className="st30-hud"><div className="st30-dots">${D.areas.map((A,i)=>html`<i key=${A.id} className=${(i<H.stage.cl?'ok':i===H.stage.ai?'cur':'')+(A.boss?' boss':'')}>${A.boss?html`<${Icon} n="crown" s=${10} w=${2.6}/>`:i+1}</i>`)}</div>
      <b>${H.stage.done?'1장 클리어!':H.stage.ai<0?'숲 입구로 들어가요':D.areas[H.stage.ai].id+' '+D.areas[H.stage.ai].n}</b>${H.stage.ai>=0&&!H.stage.done?html`<small>${H.stage.left?'남은 몬스터 '+H.stage.left:'다음 문이 열렸어요 →'}</small>`:null}</div>`:null}
    ${ar?html`<div className=${'st30-ban'+(ar.clear?' clr':'')+(ar.boss?' boss':'')} key=${ar.k} onAnimationEnd=${()=>setAr(null)}><em>${ar.clear?'STAGE CLEAR':ar.boss?'BOSS STAGE':'STAGE'}</em><b>${ar.id} ${ar.n}</b>${ar.clear?html`<span className="st30-stars">${[0,1,2].map(i=>html`<${Icon} key=${i} n="star" s=${22} w=${2} fill=${i<ar.stars?'currentColor':'none'}/>`)}</span>`:null}</div>`:null}
    ${chat?html`<${WChat} c=${c} onSay=${sayD} onSticker=${stkD} onClose=${()=>setChat(false)} where=${D.n+'에서 · 말풍선으로 떠요'}/>`:null}
    ${ctl==='joy'&&!chat&&!sum?html`<${Joy} onMove=${(x,y)=>{ const s=S.current; if(s) s.joy=[x,y]; }}/>`:null}
    ${chest?html`<${ChestOpen} key=${chest.k} tier=${chest.tier} got=${chest.got} stars=${chest.stars} title=${chest.title} onDone=${()=>{ setChest(null); const s=S.current; if(s) s.freeze=false; commit(false); }}/>`:null}
    ${H.boss?html`<div className="dg26-boss" key=${H.boss.n}><b>${H.boss.n}</b><div><i style=${{width:pct(H.boss.hp)}}></i></div></div>`:null}
    ${toast?html`<div className="dg26-toast" key=${toast.k}>${toast.t}</div>`:null}
    ${H.dead?html`<div className="dg26-dead"><b>쓰러졌어요</b><small>잠시 뒤 포털 앞에서 다시 일어나요</small></div>`:null}
    <div className="dg26-btns">
      <button className=${'dg26-sh tap'+(H.shield?'':' lock')+(H.blocking?' on':'')} onPointerDown=${e=>{ e.preventDefault(); if(!H.shield){ setToast({t:'방패를 장착하면 쓸 수 있어요 · 편집 → 캐릭터 → 장비',k:Date.now()}); return; } S.current&&S.current.block(); }} aria-label="방패">
        <span className=${'dg30-crest t-'+((rpgEqLook(rpgOf(c.me)).shield)||'b')}><i className="dg26-cd" style=${{'--p':H.cdS}}></i><${Icon} n=${H.shield?'shield':'lock'} s=${24} w=${2.4}/></span>${H.cdS>0?html`<em>${Math.ceil(H.cdS*(rpgStats(rpgOf(c.me)).cd||1))}</em>`:null}</button>
      <button className="dg26-at tap" onPointerDown=${e=>{ e.preventDefault(); S.current&&S.current.attack(); }} aria-label="공격"><i className="dg26-cd" style=${{'--p':H.cdA}}></i><${Icon} n="sword" s=${38} w=${2.3}/></button>
    </div>
    ${sum?html`<div className="dg26-sum"><div className="dg26-sc">
      <em>${D.e}</em><b>모험 결과</b>
      <div className="dg26-sg"><div><${BrickIc} s=${22}/><b>${sum.b.toLocaleString()}</b><small>벽돌 · 내 섬으로</small></div><div><${Icon} n="swords" s=${20}/><b>${sum.k}</b><small>처치</small></div><div><${Icon} n="star" s=${20}/><b>${sum.xp}</b><small>경험치</small></div>${sum.c?html`<div><${Coin} s=${20}/><b>${sum.c}</b><small>D-Coin</small></div>`:null}</div>
      ${sum.eq.length?html`<div className="dg26-eq">${sum.eq.map((id,i)=>html`<span key=${i} className=${'t-'+eqParse(id).t}>${eqName(id)}</span>`)}</div>`:null}
      <button className="tap" onClick=${onExit}>DKO 월드로 돌아가기</button></div></div>`:null}
  </div>`;
}
/* ── 장비 · 스킨 편집 ── */
function CharEdit({c,onClose,tab:t0}){
  const [tab,setTab]=useState(t0||'eq'); const me=c.me; const r=rpgOf(me); const st=rpgStats(r); const [sel,setSel]=useState('weapon');
  const owned=Object.entries(r.inv).filter(([id,n])=>n>0).map(([id])=>id);
  const equip=id=>{ const {slot}=eqParse(id); c.saveRpg(x=>({eq:{...x.eq,[slot]:x.eq[slot]===id?null:id}})); haptic(10); };
  const heroes=[{id:'robot',n:'DKO 로봇'},...PX_HEROES.filter(h=>!h.hidden&&ownsHero(me,h.id)).map(h=>({id:h.id,n:h.n}))];
  const av=avatarOf(me);
  const T0=(slot)=>{ const id=r.eq[slot]; return id?eqParse(id).t:null; };
  return html`<div className="wb20-shade" onClick=${onClose}><div className="wbs ce26" onClick=${e=>e.stopPropagation()}>
    <div className="wbs-h"><b>캐릭터 편집</b><span className="wbs-sub">Lv.${r.lv} · 공격 ${st.atk} · 방어 ${st.def} · 체력 ${st.hp}</span><button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="ce26-stage"><${VoxelStage} av=${av} w=${200} h=${200} eq=${rpgEqLook(r)}/></div>
    <div className="wbs-tabs"><button className=${'tap'+(tab==='skin'?' on':'')} onClick=${()=>setTab('skin')}>스킨</button><button className=${'tap'+(tab==='eq'?' on':'')} onClick=${()=>setTab('eq')}>장비</button></div>
    ${tab==='skin'?html`<div className="ce26-sk">${heroes.map(h=>{ const on=(av.base||'robot')===h.id; return html`<button key=${h.id} className=${'ce26-h tap'+(on?' on':'')} onClick=${()=>{ if(!on) c.saveAvatar({...av,base:h.id,var:h.id==='robot'?av.var:0}); }}>
        <span><${PixelChar} av=${h.id==='robot'?{...av,base:'robot'}:heroAv(h.id)} scale=${3}/></span><b>${h.n}</b>${on?html`<em>사용 중</em>`:null}</button>`; })}
      <button className="ce26-more tap" onClick=${()=>{ onClose(); c.openLocker&&c.openLocker('char'); }}><${Icon} n="shirt" s=${18}/>파츠 · 색 꾸미기는 꾸미기에서</button></div>`
    :html`<div className="ce26-eq">
      <div className="ce26-slots">${EQ_S.map(S2=>{ const t=T0(S2.k); return html`<button key=${S2.k} className=${'ce26-sl tap'+(sel===S2.k?' on':'')+(t?' t-'+t:'')} onClick=${()=>setSel(S2.k)}><span><${Icon} n=${S2.ic} s=${20} w=${2.2}/></span><b>${S2.n}</b><small>${t?EQ_T.find(x=>x.k===t).n:'비어 있음'}</small></button>`; })}</div>
      <p className="ce26-d">${(EQ_S.find(x=>x.k===sel)||{}).sub} · ${sel==='shield'?'공격 버튼 옆 방패 버튼으로 잠깐 피해를 막아요':sel==='weapon'?'공격력이 올라가요':sel==='greaves'?'방어 + 이동 속도가 올라가요':'받는 피해가 줄어요'}</p>
      <div className="ce26-inv">${EQ_T.map(T=>{ const id=eqId(sel,T.k); const n=r.inv[id]||0; const on=r.eq[sel]===id; const val=sel==='shield'?'막기 '+Math.round(EQ_SHIELD.block[EQ_T.indexOf(T)]*100)+'% · '+EQ_SHIELD.cd[EQ_T.indexOf(T)]+'초':(sel==='weapon'?'공격 +':'방어 +')+EQ_VAL[sel][EQ_T.indexOf(T)];
        return html`<button key=${id} className=${'ce26-it tap t-'+T.k+(n?'':' no')+(on?' on':'')} onClick=${()=>n&&equip(id)}><span className="ce26-gem"><${Icon} n=${(EQ_S.find(x=>x.k===sel)||{}).ic} s=${22} w=${2.2}/></span><b>${eqName(id)}</b><small>${val}</small><em>${on?'장착 중':n?'장착하기':T.k==='g'?'보스 전리품':'상점 · 전리품'}</em></button>`; })}</div>
      <p className="ce26-tip">장비는 월드 상점 → 장비에서 사거나, 슬라임 섬 · 헬바운드 몬스터가 떨어뜨려요. 골드는 헬바운드 보스만 줘요.</p>
    </div>`}
  </div></div>`;
}

/* ═════════ v26.4 DKO 월드 대개편: NPC · 문 들어가기 · 마을회관 안 · 채팅 · 설정 · 조이스틱 · 전리품 상자 ═════════ */
const wCtl=()=>lsGet('dko-wctl','touch');
const wFps=()=>lsGet('dko-wfps','60');
const wSfx=(k,v)=>{ try{ window.DKOSfx&&window.DKOSfx.fx(k,v); }catch(e){} };
const wBgm=k=>{ try{ window.DKOSfx&&window.DKOSfx.bgm(k); }catch(e){} };
/* 가운데 섬 주민(NPC): 집 근처를 거닐고, 누르면 말을 걸어요 */
const W_NPC=[
  {id:'sera',n:'안내원 세라',av:{base:'sera'},home:[-5,-1],r:2,c:'#FF8FB0',lines:['DKO 월드에 온 걸 환영해요!','명소 문 앞에 서면 문이 반짝여요. 눌러서 들어가 보세요.','내 섬은 아래 가운데 집 버튼으로 바로 가요.','동화 숲 포털에서 스토리 모드를 할 수 있어요!']},
  {id:'toby',n:'상인 토비',av:{base:'gear'},home:[-9,-5],r:2,c:'#FFB15C',lines:['어서 와요! DKO 상점은 바로 뒤예요.','오늘의 특가 봤어요? 금방 사라져요!','벽돌은 공방에서 모으는 게 제일 빨라요.','새 건물 크기는 상점에서 2×2처럼 보여 줘요.']},
  {id:'pipi',n:'우체부 피피',av:{base:'robot',color:'pink'},home:[-8,5],r:3,c:'#7CC2FF',gift:1,lines:['편지 왔어요~ 오늘 선물은 벽돌이에요!','크루원 섬에 놀러 가면 섬마다 벽돌을 줘요.','채팅 카페에선 월드 채팅도 같이 볼 수 있어요.']},
  {id:'owl',n:'박사 아울',av:{base:'owl'},home:[9,8],r:2,c:'#C29BFF',lines:['동화 숲 1-4에는 거대한 버섯왕이 살아요.','보스가 땅을 내려치기 전에 빨간 원이 나타나요. 방패를 드세요!','상자는 별을 많이 받을수록 좋은 게 나와요.']},
  {id:'guard',n:'경비 로봇',av:{base:'robot',color:'orange'},home:[10,-6],r:2,c:'#FF6B4A',lines:['헬바운드는 Lv.5부터 추천해요.','지옥 포털 근처는 뜨거우니 조심!','골드 장비는 헬바운드 보스가 떨어뜨려요.']},
  {id:'mia',n:'꽃집 미아',av:{base:'nova'},home:[3,10],r:2,c:'#7CF0B5',lines:['꽃밭은 밟아도 괜찮아요. 금방 다시 펴요.','벚꽃나무는 스페셜 장식이에요. 밤에 더 예뻐요.','섬을 꾸미면 랭킹 점수가 올라가요.']}
];
const npcGiftKey=()=>'dko-npc-gift-'+dayKey();
/* 명소 문 앞: 문이 열리듯 빛나는 효과 */
function wLmDoorGlow(g,ox,oy,u,tm,l){ const k=.5+.5*Math.sin(tm*4); g.save(); g.globalCompositeOperation='lighter';
  const x=ox-u*1.4, y=oy+u*4.8; const rg=g.createRadialGradient(x,y,0,x,y,u*9); rg.addColorStop(0,'rgba(255,230,160,'+(.45+k*.25)+')'); rg.addColorStop(1,'rgba(255,200,120,0)'); g.fillStyle=rg; g.beginPath(); g.ellipse(x,y,u*9,u*5,0,0,Math.PI*2); g.fill();
  g.restore(); for(let i=0;i<5;i++){ const a=tm*1.5+i*1.26; const r=u*(4+((tm*.6+i*.2)%1)*4); g.fillStyle='rgba(255,245,200,'+(.7-((tm*.6+i*.2)%1)*.7)+')'; g.fillRect(x+Math.cos(a)*r-u*.35,y-u*2-((tm*.6+i*.2)%1)*u*8-u*.35,u*.7,u*.7); } }
/* 자는 크루원: Z z z */
function wSleepZ(g,x,y,u,tm,seed){ for(let i=0;i<3;i++){ const k=((tm*.45+i/3+seed*.13)%1); g.globalAlpha=Math.sin(k*Math.PI)*.9; g.font='900 '+Math.round(u*(2+i*.6+k*1.2))+'px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  g.lineWidth=3; g.strokeStyle='rgba(30,40,80,.6)'; const tx=x+u*(3+k*5)+i*u, ty=y-u*(19+k*9); g.strokeText(i===2?'Z':'z',tx,ty); g.fillStyle='#DDE8FF'; g.fillText(i===2?'Z':'z',tx,ty); } g.globalAlpha=1; }
/* 말풍선 안의 이모티콘 그림 */
const W_STK={}; const wStkImg=id=>{ const S0=STICKER[id]; if(!S0) return null; let im=W_STK[id]; if(!im){ im=new Image(); im.src=S0.src; W_STK[id]=im; } return im.complete&&im.naturalWidth?im:null; };
function wBubble(g,x,y,say,u){ if(say&&say.st){ const im=wStkImg(say.st); const sz=Math.max(46,u*11); g.fillStyle='rgba(255,255,255,.96)'; rr(g,x-sz/2-5,y-sz-10,sz+10,sz+10,14); g.fill(); g.beginPath(); g.moveTo(x-5,y-1); g.lineTo(x,y+6); g.lineTo(x+5,y-1); g.fill();
    if(im){ g.imageSmoothingEnabled=false; g.drawImage(im,x-sz/2,y-sz-5,sz,sz); g.imageSmoothingEnabled=true; } return; }
  const tx=String(say.t||'').slice(0,40); g.font='800 '+Math.max(11,Math.round(u*2.6))+'px "NEXON Kart Gothic",sans-serif'; const w=Math.min(220,g.measureText(tx).width+20), h=Math.max(22,u*5);
  g.fillStyle='rgba(255,255,255,.97)'; rr(g,x-w/2,y-h,w,h,h/2); g.fill(); g.beginPath(); g.moveTo(x-5,y-1); g.lineTo(x,y+6); g.lineTo(x+5,y-1); g.fill(); g.fillStyle='#1A1F2C'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(tx,x,y-h/2+1,w-12); }

/* 월드 채팅: 월드 · 전체 채팅을 골라 보고, 직접 만든 이모티콘도 보내요 (채팅 탭 '월드'와 같은 방) */
function WChat({c,onSay,onSticker,onClose,where}){
  const [tab,setTab]=useState(()=>lsGet('dko-wchat','world')); const [txt,setTxt]=useState(''); const [tray,setTray]=useState(false); const L=useRef(null);
  const room=tab==='all'?'all':'world'; const pick=k=>{ setTab(k); lsSet('dko-wchat',k); haptic(6); };
  const msgs=useMemo(()=>c.messages.filter(m=>(m.room||'all')===room&&!m.deleted&&!m.sys).sort((a,b)=>a.createdAt-b.createdAt).slice(-40),[c.messages,room]);
  useEffect(()=>{ const el=L.current; if(el) el.scrollTop=el.scrollHeight; },[msgs.length,tab]);
  const send=e=>{ e&&e.preventDefault(); const v=txt.trim(); if(!v) return; setTxt(''); if(room==='world') onSay(v); else c.sendMessage(v,'all'); haptic(8); };
  return html`<div className="wc26 wc30" onClick=${e=>e.stopPropagation()} onPointerDown=${e=>e.stopPropagation()}>
    <div className="wc26-h"><div className="wc30-tabs"><button className=${'tap'+(tab==='world'?' on':'')} onClick=${()=>pick('world')}><${Icon} n="globe" s=${13} w=${2.4}/>월드</button><button className=${'tap'+(tab==='all'?' on':'')} onClick=${()=>pick('all')}><${Icon} n="chat" s=${13} w=${2.4}/>전체 채팅</button></div>
      <small>${tab==='world'?(where||'말풍선으로 떠요'):'메인 채팅방과 같아요'}</small><button className="tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${15} w=${2.8}/></button></div>
    <div className="wc26-l" ref=${L}>${msgs.length?msgs.map(x=>{ const m=c.members.find(y=>y.uid===x.uid); const me=x.uid===c.uid; return html`<div key=${x.id} className=${'wc26-m'+(me?' me':'')+(x.sticker?' st':'')}>${!me?html`<b>${m?dispName(m):x.nick}</b>`:null}${x.sticker&&STICKER[x.sticker]?html`<img src=${STICKER[x.sticker].src} alt="" className="wc30-st"/>`:html`<span>${x.text}</span>`}</div>`; })
      :html`<p className="wc26-e">${tab==='world'?'월드에 있는 크루에게 인사해 보세요! 쓴 말은 머리 위 말풍선으로 떠요.':'메인 채팅이 조용해요.'}</p>`}</div>
    ${tray?html`<div className="wc30-tray"><${StickerTray} me=${c.me} ownedOnly=${true} onPick=${id=>{ setTray(false); if(room==='world') onSticker(id); else c.sendSticker(id,'all'); }} onClose=${()=>setTray(false)} onLocked=${()=>c.notify('상점에서 이모티콘을 사면 여기서도 쓸 수 있어요.')}/></div>`:null}
    <div className="wc26-emo">${['👋','🎉','❤️','😂','🔥','👍','😮','🙏'].map(x=>html`<button key=${x} className="tap" onClick=${()=>{ if(room==='world') onSay(x,true); else c.sendMessage(x,'all'); }}>${x}</button>`)}</div>
    <form className="wc26-f" onSubmit=${send}><button type="button" className=${'wc30-stb tap'+(tray?' on':'')} onClick=${()=>setTray(!tray)} aria-label="내 이모티콘"><${Icon} n="smile" s=${19} w=${2.2}/></button><input value=${txt} maxLength=${60} placeholder=${tab==='world'?'월드에 한마디':'메인 채팅에 보내기'} onInput=${e=>setTxt(e.target.value)} enterKeyHint="send"/><button className="tap" type="submit" disabled=${!txt.trim()} aria-label="보내기"><${Icon} n="send" s=${18} w=${2.4}/></button></form>
  </div>`;
}
/* 월드 설정: 조작 · 소리 · 부드러움 */
function WSet({onClose}){
  const [sky,setSky]=useState(()=>lsGet('dko-wday','auto')); useEffect(()=>{ window.__wDay=sky==='day'; },[sky]);
  const [ctl,setCtl]=useState(wCtl()); const [fps,setFps]=useState(wFps()); const [bgm,setBgm]=useState(lsGet('dko-bgm','on')!=='off'); const [sfx,setSfx]=useState(lsGet('dko-sfx','on')!=='off'); const [vol,setVol]=useState(()=>{ const n=Number(lsGet('dko-bgmv','0.55')); return isFinite(n)?n:.55; });
  const Opt=({v,cur,set,k,ic,t,d})=>html`<button className=${'ws30-o tap'+(cur===v?' on':'')} onClick=${()=>{ set(v); lsSet(k,v); haptic(8); window.dispatchEvent(new Event('dko-wset')); }}><span className="ws30-oi"><${Icon} n=${ic} s=${20} w=${2.2}/></span><b>${t}</b><small>${d}</small></button>`;
  return html`<div className="wb20-shade" onClick=${onClose}><div className="wbs ws30" onClick=${e=>e.stopPropagation()}>
    <div className="wbs-h"><b>월드 설정</b><span className="wbs-sub">조작 · 소리 · 화면</span><button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="ws30-lb">이동 방법</div>
    <div className="ws30-g"><${Opt} v="touch" cur=${ctl} set=${setCtl} k="dko-wctl" ic="target" t="터치" d="땅을 눌러 걸어가요"/><${Opt} v="joy" cur=${ctl} set=${setCtl} k="dko-wctl" ic="pad" t="조이스틱" d="왼쪽 아래 스틱으로 움직여요"/></div>
    <div className="ws30-lb">하늘</div>
    <div className="ws30-g"><${Opt} v="auto" cur=${sky} set=${setSky} k="dko-wday" ic="moon" t="실제 시간" d="저녁엔 노을, 밤엔 별빛"/><${Opt} v="day" cur=${sky} set=${setSky} k="dko-wday" ic="sun" t="항상 낮" d="언제나 맑은 낮"/></div>
    <div className="ws30-lb">부드러움</div>
    <div className="ws30-g"><${Opt} v="60" cur=${fps} set=${setFps} k="dko-wfps" ic="bolt" t="부드럽게" d="초당 60번 그려요"/><${Opt} v="30" cur=${fps} set=${setFps} k="dko-wfps" ic="vibe" t="절전" d="배터리 · 발열을 줄여요"/></div>
    <div className="ws30-lb">소리</div>
    <div className="ws30-r"><span><${Icon} n="music" s=${17}/>배경 음악</span><button className=${'sw'+(bgm?' on':'')} onClick=${()=>{ const v=!bgm; setBgm(v); lsSet('dko-bgm',v?'on':'off'); window.DKOSfx&&window.DKOSfx.bgmRefresh(); }} aria-label="배경 음악"></button></div>
    ${bgm?html`<div className="ws30-r"><span>크기</span><input type="range" min="0" max="1" step="0.05" value=${vol} onInput=${e=>{ const n=Number(e.target.value); setVol(n); window.DKOSfx&&window.DKOSfx.bgmVol(n); }} aria-label="배경 음악 크기"/></div>`:null}
    <div className="ws30-r"><span><${Icon} n="spark" s=${17}/>효과음</span><button className=${'sw'+(sfx?' on':'')} onClick=${()=>{ const v=!sfx; setSfx(v); lsSet('dko-sfx',v?'on':'off'); if(v) wSfx('pick'); }} aria-label="효과음"></button></div>
  </div></div>`;
}
/* 조이스틱: 왼쪽 아래 · 엄지로 밀면 그 방향으로 걸어요 */
function Joy({onMove}){
  const ref=useRef(null); const [k,setK]=useState(null);
  const at=e=>{ const r=ref.current.getBoundingClientRect(); const cx=r.left+r.width/2, cy=r.top+r.height/2; let dx=e.clientX-cx, dy=e.clientY-cy; const R=r.width/2-8; const d=Math.hypot(dx,dy); if(d>R){ dx=dx/d*R; dy=dy/d*R; } setK([dx,dy]); onMove(dx/R,dy/R); };
  const down=e=>{ e.preventDefault(); e.stopPropagation(); ref.current.setPointerCapture(e.pointerId); at(e); };
  const move=e=>{ if(!k) return; e.preventDefault(); at(e); };
  const up=e=>{ setK(null); onMove(0,0); };
  return html`<div className=${'wj30'+(k?' on':'')} ref=${ref} onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up}><i className="wj30-r"></i><i className="wj30-k" style=${k?{transform:'translate('+k[0]+'px,'+k[1]+'px)'}:null}></i></div>`;
}
/* 화면 방향(dx,dy) → 월드 방향 */
const wJoyDir=(dx,dy)=>{ const a=dx/(WCF.TW/2), b=dy/(WCF.TH/2); let x=(a+b)/2, y=(b-a)/2; const d=Math.hypot(x,y)||1; return [x/d,y/d]; };
/* 문 열고 들어가기 */
function WDoor({l,dir}){ return html`<div className=${'wdr30 '+(dir||'in')} style=${{'--g1':l.c[0],'--g2':l.c[1]}} aria-hidden="true"><i className="wdr30-l"></i><i className="wdr30-r"></i><i className="wdr30-lt"></i>
  <div className="wdr30-t"><span className="gi30"><${Icon} n=${l.ic} s=${26} w=${2.2}/></span><b>${l.n}</b><small>${dir==='out'?'밖으로 나가는 중':'안으로 들어가는 중'}</small></div></div>`; }
/* 내 마을회관 안: 아늑한 방에서 섬 기록 · 장비 · 트로피를 봐요 */
function HallRoom({c,I,onClose}){
  const cv=useRef(null); const [out,setOut]=useState(false); const R=rpgOf(c.me); const st=rpgStats(R); const lv=I?I.hallLv:1;
  const close=()=>{ setOut(true); wSfx('door'); setTimeout(onClose,420); };
  useEffect(()=>{ wSfx('door'); const el=cv.current, g=el.getContext('2d'); let raf=0, dead=false; const dpr=Math.min(2,window.devicePixelRatio||1);
    const me={x:4.5,y:5,tx:4.5,ty:5,yaw:.4,walk:false,ph:0}; let W0=0,H0=0;
    const size=()=>{ const r=el.getBoundingClientRect(); el.width=Math.round(r.width*dpr); el.height=Math.round(r.height*dpr); W0=r.width; H0=r.height; }; size(); const ro=new ResizeObserver(size); ro.observe(el);
    const uR0=()=>Math.min(W0/19.5,H0/13); const O=()=>[W0/2,H0*.56-4.5*uR0()];
    const P=(x,y)=>{ const uR=uR0(), [ox,oy]=O(); return [ox+(x-y)*uR, oy+(x+y)*uR*.5]; };
    const night=wNightK()>.5;
    const tap=e=>{ const r=el.getBoundingClientRect(); const sx=e.clientX-r.left, sy=e.clientY-r.top; const uR=uR0(), [ox,oy]=O(); const a=(sx-ox)/uR, b=(sy-oy)/(uR*.5); const x=(a+b)/2, y=(b-a)/2; me.tx=Math.max(1.2,Math.min(8.4,x)); me.ty=Math.max(1.6,Math.min(8.4,y)); };
    el.addEventListener('pointerup',tap);
    let last=performance.now();
    const frame=now=>{ if(dead) return; const dt=Math.min(.05,(now-last)/1000); last=now; const tm=now/1000; const uR=uR0(); const u=uR/8.5;
      const dx=me.tx-me.x, dy=me.ty-me.y, d=Math.hypot(dx,dy); me.walk=d>.05; if(me.walk){ const sp=Math.min(d,2.4*dt); me.x+=dx/d*sp; me.y+=dy/d*sp; me.ph+=sp*9; me.yaw=Math.atan2(-dx,dy); }
      g.setTransform(dpr,0,0,dpr,0,0); const bg=g.createLinearGradient(0,0,0,H0); bg.addColorStop(0,'#3A2A1E'); bg.addColorStop(1,'#140E0A'); g.fillStyle=bg; g.fillRect(0,0,W0,H0);
      const [ox,oy]=O(); const C=(...a)=>wCube(g,ox,oy,uR,...a);
      /* 벽 · 바닥 */
      C(-.16,-.16,0,.16,9.16,2.8,'#F2E2C4',{l:'#F5E8CE',r:'#E2D0AC',t:'#FFF4E0'}); C(0,-.16,0,9,.16,2.8,'#F2E2C4',{l:'#E6D4B0',r:'#EADAB8',t:'#FFF4E0'});
      for(let i=0;i<9;i++){ C(-.17,i+.45,.4,.02,.1,2.2,'#E6D2AE'); C(i+.45,-.17,.4,.1,.02,2.2,'#DCC8A2'); }
      for(let x=0;x<9;x++) for(let y=0;y<9;y++) C(x,y,0,1,1,.05,(x+y)%2?'#C99A64':'#BE8D58',{t:(x+y)%2?'#DDB07A':'#D2A26C'});
      C(-.17,-.17,0,.18,9.17,.22,'#8A5A34'); C(0,-.17,0,9,.18,.22,'#8A5A34');
      /* 창문 */
      [2,5.4].forEach(x=>{ C(x,-.18,1.1,1.5,.04,1.05,night?'#1C2850':'#A8DCFF',{l:night?'#24346A':'#BCE6FF',r:night?'#1C2850':'#A8DCFF',t:'#fff'}); C(x+.7,-.2,1.1,.08,.04,1.05,'#FFFFFF'); C(x,-.2,1.6,1.5,.04,.06,'#FFFFFF'); C(x-.08,-.22,1.02,1.66,.1,.1,'#8A5A34'); C(x-.08,-.22,2.15,1.66,.1,.1,'#8A5A34'); });
      if(night){ const p=P(2.6,-.2); g.fillStyle='rgba(255,240,180,.9)'; g.beginPath(); g.arc(p[0],p[1]-uR*1.8,uR*.12,0,Math.PI*2); g.fill(); }
      /* 벽난로 */
      C(-.18,5.6,0,.62,1.8,1.6,'#B5A08A',{t:'#D4C2AA',l:'#C2AE96',r:'#9E8A74'}); C(.02,6,0,.44,1,.8,'#2A1A12',{l:'#2A1A12',r:'#1A100A',t:'#2A1A12'}); { const f=1+Math.sin(tm*9)*.18; C(.12,6.2,.04,.28,.6,.34*f,'#FF7A1A',{t:'#FFC04A',l:'#FF8A2A',r:'#E8520A'}); C(.18,6.35,.04,.14,.3,.5*f,'#FFD54A',{t:'#FFF2A0',l:'#FFE070',r:'#F2B020'}); }
      C(-.2,5.5,1.6,.72,2,.12,'#8A5A34');
      /* 책장 */
      C(.02,1.2,0,.5,1.9,2.1,'#7A4E2C',{t:'#8A5A34',l:'#8A5A34',r:'#5E3A1E'}); for(let i=0;i<3;i++) for(let j=0;j<5;j++) C(.2,1.32+j*.34,.25+i*.62,.3,.26,.42,['#E5383B','#3B82F6','#FFD166','#3DDC97','#B48CFF'][(i*5+j)%5]);
      /* 트로피 선반 */
      C(3.6,.02,1.3,1.6,.3,.06,'#8A5A34'); const tr=Math.min(5,Math.max(1,(R.boss||0)+1)); for(let i=0;i<tr;i++){ const gold=i<(R.boss||0); C(3.7+i*.3,.06,1.36,.2,.18,.24,gold?'#FFD54A':'#C8CDD6',{t:gold?'#FFF0A0':'#EEF2F8'}); }
      /* 장비 거치대 */
      const look=rpgEqLook(R); const tc=t=>t?(EQ_TC[t]||EQ_TC.b)[0]:'#5A5F6E';
      C(7.6,.6,0,.08,.08,1.6,'#6A4A2E'); C(7.1,.55,1.5,1.1,.18,.08,'#6A4A2E'); C(7.35,.48,.6,.6,.32,.85,tc(look.armor),{t:'#fff'}); C(7.43,.48,1.5,.44,.32,.32,tc(look.helm)); C(8.4,.9,0,.06,.06,1.5,tc(look.weapon),{t:'#fff'}); C(6.7,.7,.05,.1,.5,.7,tc(look.shield));
      /* 러그 · 테이블 · 화분 */
      C(2.6,3.4,.05,3.4,2.6,.02,'#D8485A',{t:'#D8485A'}); C(2.9,3.7,.07,2.8,2,.01,'#FFD166',{t:'#F2C25A'}); C(3.2,4,.08,2.2,1.4,.01,'#D8485A',{t:'#C83E50'});
      C(5.9,2.2,0,1,1,.55,'#8A5A34',{t:'#A06C42'}); C(6.25,2.5,.55,.3,.3,.2,'#FFFFFF'); C(6.3,2.55,.75,.2,.2,.08,'#8A5A34');
      C(8.1,7.9,0,.5,.5,.35,'#C9965A'); C(7.95,7.75,.35,.8,.8,.45,'#4FB86A',{t:'#6ED487'}); C(8.1,7.9,.8,.5,.5,.3,'#59C377');
      C(1.2,8.2,0,1.6,.6,.45,'#3B82F6',{t:'#5B9BF8'}); C(1.2,8.55,.45,1.6,.25,.5,'#2F6FD8');
      /* 나 */
      const uc=uR/5.6; const [px,py]=P(me.x,me.y); wDrawChar(g,px,py-(me.walk?Math.abs(Math.sin(me.ph*.5))*uc*.6:Math.sin(tm*2)*uc*.15),uc*.95,avatarOf(c.me),me.walk?me.yaw:me.yaw*.98,tm,me.walk,null,true,{ph:me.ph,eq:look});
      /* 불빛 */
      const fp=P(.3,6.5); const rg=g.createRadialGradient(fp[0],fp[1]-uR,0,fp[0],fp[1]-uR,uR*7); rg.addColorStop(0,'rgba(255,170,80,'+(.2+.05*Math.sin(tm*7))+')'); rg.addColorStop(1,'rgba(255,170,80,0)'); g.fillStyle=rg; g.fillRect(0,0,W0,H0);
      raf=requestAnimationFrame(frame); };
    raf=requestAnimationFrame(frame);
    return ()=>{ dead=true; cancelAnimationFrame(raf); ro.disconnect(); el.removeEventListener('pointerup',tap); }; },[]);
  const items=I?I.items:[];
  return html`<div className=${'hr30'+(out?' out':'')} onClick=${e=>e.stopPropagation()}>
    <canvas ref=${cv} className="hr30-cv" aria-label="마을회관 안"></canvas>
    <div className="hr30-top"><button className="wb20-ib tap" onClick=${close} aria-label="나가기" data-swipe-back="1"><${Icon} n="chevL" s=${20} w=${2.4}/></button><div className="wb20-tt"><b>${I?I.name:'내 섬'} 마을회관</b><span>본부 Lv.${lv} · 바닥을 눌러 걸어 봐요</span></div></div>
    <div className="hr30-card">
      <div className="hr30-st"><span><b>${lv}</b><small>본부</small></span><span><b>${items.length}</b><small>건물 · 장식</small></span><span><b>${I?I.land.length:0}</b><small>넓힌 땅</small></span><span><b>${Object.keys((I&&I.likes)||{}).length}</b><small>좋아요</small></span></div>
      <div className="hr30-st"><span><b>Lv.${R.lv}</b><small>모험 레벨</small></span><span><b>${(R.kills||0).toLocaleString()}</b><small>처치</small></span><span><b>${R.boss||0}</b><small>보스 트로피</small></span><span><b>${(R.story&&R.story.best)||0}/4</b><small>동화 숲</small></span></div>
      <div className="hr30-eq">${EQ_S.map(sl=>{ const id=R.eq[sl.k]; const t=id?eqParse(id).t:null; return html`<span key=${sl.k} className=${'t-'+(t||'none')}><${Icon} n=${sl.ic} s=${15} w=${2.3}/><small>${id?eqName(id):sl.n+' 없음'}</small></span>`; })}</div>
      <p className="hr30-tip">공격력 ${st.atk} · 체력 ${st.hp} · 방어 ${st.def}${st.shield?' · 방패 막기 '+Math.round(st.block*100)+'%':''}</p>
    </div>
  </div>`;
}
/* 전리품 상자: 등급별로 흔들리다 열리고, 받은 것이 하나씩 튀어나와요 */
const CHEST={wood:{n:'나무 상자',c:['#C98A4E','#7A4E2C'],g:'#FFE0B8'},silver:{n:'은빛 상자',c:['#E6EBF2','#8E98A8'],g:'#FFFFFF'},gold:{n:'황금 상자',c:['#FFD54A','#C98A00'],g:'#FFF6C2'},legend:{n:'전설 상자',c:['#C29BFF','#5A32C8'],g:'#F0E2FF'}};
function chestRoll(tier,ctx){ const r=Math.random; const o={b:0,c:0,eq:[],xp:0};
  if(tier==='wood'){ o.b=rRand(40,80); o.xp=12; if(r()<.12) o.eq.push(eqId(EQ_S[Math.floor(r()*EQ_S.length)].k,'b')); }
  else if(tier==='silver'){ o.b=rRand(130,220); o.c=r()<.5?rRand(1,3):0; o.xp=30; if(r()<.45) o.eq.push(eqId(EQ_S[Math.floor(r()*EQ_S.length)].k,r()<.35?'s':'b')); }
  else if(tier==='gold'){ o.b=rRand(320,520); o.c=rRand(3,6); o.xp=70; if(r()<.7) o.eq.push(eqId(EQ_S[Math.floor(r()*EQ_S.length)].k,r()<.25?'g':'s')); }
  else { o.b=rRand(800,1100); o.c=rRand(8,12); o.xp=150; o.eq.push(eqId(EQ_S[Math.floor(r()*EQ_S.length)].k,'g')); if(r()<.5) o.eq.push(eqId(EQ_S[Math.floor(r()*EQ_S.length)].k,'s')); }
  if(ctx&&ctx.stars){ o.b=Math.round(o.b*(1+(ctx.stars-1)*.25)); } return o; }
function ChestOpen({tier,got,title,stars,onDone}){
  const T=CHEST[tier]||CHEST.wood; const [ph,setPh]=useState(0);
  useEffect(()=>{ const a=setTimeout(()=>{ setPh(1); wSfx('chest'); haptic([20,40,80]); },1100); return ()=>clearTimeout(a); },[]);
  const items=[got.b?{ic:'brick',t:'벽돌 '+got.b.toLocaleString()}:null,got.c?{ic:'coin',t:'D-Coin '+got.c}:null,got.xp?{ic:'star',t:'경험치 '+got.xp}:null,...got.eq.map(id=>({ic:'eq',t:eqName(id),tier:eqParse(id).t}))].filter(Boolean);
  return html`<div className=${'ch30 t-'+tier+(ph?' open':'')} style=${{'--c1':T.c[0],'--c2':T.c[1],'--cg':T.g}} onClick=${e=>{ e.stopPropagation(); if(ph) onDone(); }}>
    <div className="ch30-rays"></div>
    <div className="ch30-in">
      ${title?html`<em className="ch30-ti">${title}</em>`:null}
      ${stars!=null?html`<div className="ch30-stars">${[0,1,2].map(i=>html`<${Icon} key=${i} n="star" s=${30} w=${2} fill=${i<stars?'currentColor':'none'}/>`)}</div>`:null}
      <div className="ch30-box"><i className="ch30-lid"></i><i className="ch30-body"></i><i className="ch30-lock"></i><i className="ch30-glow"></i></div>
      <b className="ch30-n">${T.n}</b>
      ${ph?html`<div className="ch30-items">${items.map((x,i)=>html`<span key=${i} className=${'ch30-it'+(x.tier?' t-'+x.tier:'')} style=${{'--d':(i*120+150)+'ms'}}>${x.ic==='brick'?html`<${BrickIc} s=${18}/>`:x.ic==='coin'?html`<${Coin} s=${16}/>`:html`<${Icon} n=${x.ic==='eq'?'shield':'star'} s=${16} w=${2.4}/>`}${x.t}</span>`)}</div><small className="ch30-tap">눌러서 계속</small>`:html`<small className="ch30-tap">상자가 열려요…</small>`}
    </div></div>`;
}
/* 방패: 육각 에너지 막 (장비 등급 색) + 도는 빛줄기 */
function wHexShield(g,x,y,u,tm,k,tier){ const T=EQ_TC[tier]||EQ_TC.b; const R=u*7.4; g.save(); g.globalAlpha=.4+.5*k;
  const hex=(r,rot)=>{ g.beginPath(); for(let i=0;i<=6;i++){ const a=i/6*6.2832+rot; const px=x+Math.cos(a)*r, py=y+Math.sin(a)*r*1.12; i?g.lineTo(px,py):g.moveTo(px,py); } g.closePath(); };
  const rg=g.createRadialGradient(x,y,R*.15,x,y,R); rg.addColorStop(0,'rgba(170,225,255,.04)'); rg.addColorStop(1,'rgba(170,225,255,.34)'); g.fillStyle=rg; hex(R,Math.PI/6); g.fill(); g.strokeStyle=T[0]; g.lineWidth=2.6; g.stroke();
  g.strokeStyle='rgba(255,255,255,.9)'; g.lineWidth=3; for(let i=0;i<3;i++){ const a=tm*2.6+i*2.094; g.beginPath(); g.ellipse(x,y,R*1.02,R*1.14,0,a,a+.55); g.stroke(); }
  g.globalAlpha=(.16+.14*Math.sin(tm*6))*k+.1; g.strokeStyle='#D6F1FF'; g.lineWidth=1; for(let i=0;i<6;i++){ const a=i/6*6.2832+Math.PI/6; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*R,y+Math.sin(a)*R*1.12); g.stroke(); } hex(R*.52,Math.PI/6); g.stroke();
  g.restore(); }

window.__DKOW={WorldBeta,WItemIcon,WorldThumb,warm:typeof wWarm==="function"?wWarm:null};
})();
