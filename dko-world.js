/* DKO 월드 모듈 (월드에 들어갈 때만 받아요) */
(function(){
const {BANNERS,BrickIc,C0,CB_TIPS,CH,CW,Coin,EQ_PRICE,EQ_SHIELD,EQ_T,EQ_TC,FX,GA,GA_SET,GChips,GE_DUST,GE_EL,GE_ELS,GE_EPIC,GE_FIX,GE_RK,GE_SELL,GE_SUB,GE_UP,GR_C,GR_N,GR_T,GW,GW_HIT,GoldIc,ICONS,Icon,PX_HEROES,PfpView,PixelChar,R,RAID,STICKER,StickerTray,TS,VX_ISO,VoxelStage,WCF,W_BIG,W_CAT,W_CDECO,W_CK,W_CR,W_CROP,W_DECO_MAX,W_EXP_COST,W_GOLD_RATE,W_HUB,W_LAND_MAX,W_LAND_SS_FROM,W_LM,W_LMS,W_LONG,W_LV_ROOF,W_MINE_CAP,W_MINE_RATE,W_OB,W_OB_TIME,W_PROTECT,W_SC,W_START,W_START_BRICKS,W_SW,W_SZ,W_TABS,W_TILE,W_WALK,ago,avatarOf,coinsOf,consentOpt,dayKey,dispName,dkoAsk,eqId,eqName,eqParse,gCap,gClone,gDef,gDrop,gDurMax,gElemOf,gEquipped,gFind,gIsW,gName,gNew,gSetOf,gSlotOf,gUpMul,gearOf,haptic,heroAv,hh,html,isOnline,isStealth,isSuperM,lmC,lmDoor,lsGet,lsSet,myLiveParty,ownsHero,partyLive,raidFmt,raidList,raidMineOf,raidShieldOf,rng,rpgEqLook,rpgNeed,rpgOf,rpgStats,rr,seed,useEffect,useMemo,useRef,useState,vxDraw,wBack,wBrick,wCells,wCropOf,wCube,wDrawChar,wEase,wFmtT,wGoldOf,wHash,wLandCost,wLandSS,wName,wPlotEnd,wPlotOf,wPlotWater,wRad,wShade,wShadow,wSpeedCost,wStealCost,wStr,wSz,wTag,wTopIsl,wWeek0,wWeekScore,wXmas}=window.__DKO;
/* 칸 크기가 커진 예전 섬: 겹치거나 땅 밖으로 나간 건물을 가장 가까운 빈 곳으로 옮겨요 */
function wFit(items,R,land){
  /* v29 노란 땅(가장자리 모래)도 내 땅: 설치 판정과 같은 기준 (R+.35 안쪽은 늘 땅이에요) */
  const ok=(x,y)=>Math.hypot(x,y)<=R+.35||(land&&land.has(x+','+y));
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
const wDecoCount=I=>I.items.filter(it=>{ const C=W_CAT[it.t]; return C&&(C.cat==='deco'||C.cat==='gem'||C.cat==='xmas'); }).length;
const wMaxOf=(t,hl)=>{ const C=W_CAT[t]; if(!C) return 0; if(C.uniq) return 1; if(C.max) return C.max[Math.min(C.max.length-1,hl)]; if(C.max1) return hl>=(C.req||1)?C.max1:0; return hl>=(C.req||1)?99:0; };
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
  /* v29.7 성 마을: 성(체비셰프 3칸까지는 언제나 땅) · 둥근 해자(앞쪽 두 문에만 다리) · 메인 스트리트 · 중앙 광장 */
  for(let x=-17;x<=17;x++) for(let y=-17;y<=17;y++){
    const d=Math.sqrt(x*x+y*y*1.08)+(wHash(x,y,7)-.5)*1.1;
    const kx=x-W_CK[0], ky=y-W_CK[1], cheb=Math.max(Math.abs(kx),Math.abs(ky)), p4=Math.pow(kx**4+ky**4,.25);
    if(d>=W_CR&&cheb>3) continue;
    if(cheb<=3){ const gate=cheb===3&&((kx===0&&ky===3)||(ky===0&&kx===3)); put(x,y,{t:'stone',isl:'center',cas:1,wall:cheb===3&&!gate?1:0}); continue; }
    if(p4>=4.4&&p4<=6.2&&kx+ky>=-1){ const br=(kx===0&&ky>0)||(ky===0&&kx>0); put(x,y,{t:br?'bridge':'moat',isl:'center'}); continue; }
    const blvd=Math.abs(x-y)<=1&&x+y>=-7&&x+y<=5;
    const hub=Math.hypot(x-W_HUB[0],y-W_HUB[1])<3.3;
    put(x,y,{t:blvd?'blvd':hub?'stone':d>W_CR-1.1?'sand':'grass',isl:'center'});
  }
  /* v26.4 길: 광장에서 명소 문 앞까지 돌길을 깔아요 (다리로만 강을 건너요) */
  { const bl=new Set(); W_LM.forEach(l=>{ for(let i=0;i<3;i++) for(let j=0;j<3;j++) bl.add(key(l.x+i,l.y+j)); }); W_CDECO.forEach(([x,y,t])=>{ if(!W_WALK.has(t)) wCells({t},x,y).forEach(([a,b])=>bl.add(key(a,b))); });
    const PATH=new Set(); const goal=key(0,0);
    W_LM.forEach(l=>{ const [dx,dy]=lmDoor(l); const s0=key(dx,dy); if(!T.has(s0)) return; const prev=new Map([[s0,null]]); const q=[[dx,dy]]; let h=0, hit=null;
      while(h<q.length&&h<4000){ const [x,y]=q[h++]; const k=key(x,y); if(k===goal||(PATH.has(k)&&k!==s0)){ hit=k; break; }
        for(const [ax,ay] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+ax, ny=y+ay, kk=key(nx,ny); if(prev.has(kk)||bl.has(kk)) continue; const t0=T.get(kk); if(!t0||t0.t==='moat') continue; prev.set(kk,k); q.push([nx,ny]); } }
      let cur=hit; while(cur){ PATH.add(cur); cur=prev.get(cur); } });
    PATH.forEach(k=>{ const t0=T.get(k); if(t0&&(t0.t==='grass'||t0.t==='sand')) t0.t='path'; }); }
  /* v29.5 거미줄 배치: 1~10번은 1차 링, 11번부터는 기존 섬의 바깥 슬롯을 BFS로 찾아 다리로 이어요 (web.js) */
  const L=[]; const n=isl.length; const WP=wWeb(n);
  isl.forEach((s,i)=>{
    const P0=WP[i]; const ir=wRad(s.exp); const cx=P0.cx, cy=P0.cy;
    L.push({...s,cx,cy,r:ir,par:P0.par,dep:P0.dep});
    const rr=Math.ceil(ir)+1;
    for(let x=-rr;x<=rr;x++) for(let y=-rr;y<=rr;y++){
      const d=Math.hypot(x,y)+(wHash(cx+x,cy+y,3)-.5)*.9; if(d>=ir+.4&&Math.hypot(x,y)>ir+.35) continue;
      put(cx+x,cy+y,{t:d>ir-.6?'sand':'grass',isl:s.uid,d:Math.hypot(x,y)});
    }
    let sx,sy,ex,ey;
    if(P0.par<0){ const len=Math.hypot(cx,cy), ux=cx/len, uy=cy/len; sx=(W_CR-.8)*ux; sy=(W_CR-.8)*uy; ex=cx-ux*(ir-.5); ey=cy-uy*(ir-.5); }
    else { const pp=WP[P0.par], pr=wRad(isl[P0.par].exp); const dx=cx-pp.cx, dy=cy-pp.cy, len=Math.hypot(dx,dy), ux=dx/len, uy=dy/len; sx=pp.cx+ux*(pr-.5); sy=pp.cy+uy*(pr-.5); ex=cx-ux*(ir-.5); ey=cy-uy*(ir-.5); }
    const steps=Math.ceil(Math.hypot(ex-sx,ey-sy)*3);
    let lx=null,ly=null; for(let j=0;j<=steps;j++){ const px=Math.round(sx+(ex-sx)*j/steps), py=Math.round(sy+(ey-sy)*j/steps); if(lx!==null&&px!==lx&&py!==ly&&!T.has(key(px,ly))) put(px,ly,{t:'bridge',isl:null}); if(!T.has(key(px,py))) put(px,py,{t:'bridge',isl:null}); lx=px; ly=py; }
  });
  /* 산 땅: 먼저 산 순서대로 덮어써요 (소셜 아일랜드 · 다른 섬 본부 근처는 무시) */
  const C=[]; L.forEach(l=>(l.land||[]).forEach(e=>{ const [dx,dy]=String(e.k).split(',').map(Number); if(isFinite(dx)&&isFinite(dy)) C.push({gx:l.cx+dx,gy:l.cy+dy,uid:l.uid,at:e.at||0}); }));
  C.sort((a,b)=>a.at-b.at).forEach(e=>{ if(Math.hypot(e.gx,e.gy)<W_CR+1.5) return; const cur=T.get(key(e.gx,e.gy)); if(cur&&cur.isl==='center') return;
    if(cur&&cur.isl&&cur.isl!==e.uid){ const o=L.find(l=>l.uid===cur.isl); if(o&&Math.hypot(e.gx-o.cx+.5,e.gy-o.cy+.5)<W_PROTECT) return; }
    T.set(key(e.gx,e.gy),{x:e.gx,y:e.gy,t:'grass',isl:e.uid,d:99,land:1}); });
  /* v26.8 막힌 길 고치기: 광장에서 못 가는 섬 · 명소 문이 있으면 가장 짧은 물길에 다리를 놓아요 (대각선 틈도 메워요) */
  { const st=key(0,0); const reach=new Set(); const flood=from=>{ const q=[from]; reach.add(from); for(let h=0;h<q.length;h++){ const [x,y]=q[h].split(',').map(Number); for(const [ax,ay] of [[1,0],[-1,0],[0,1],[0,-1]]){ const kk=key(x+ax,y+ay); if(reach.has(kk)||!T.has(kk)||T.get(kk).t==='moat'||T.get(kk).wall) continue; reach.add(kk); q.push(kk); } } };
    if(T.has(st)) flood(st);
    const goals=[...L.map(l=>[l.cx,l.cy]),...W_LM.map(l=>lmDoor(l))];
    let B=0; T.forEach(t=>{ B=Math.max(B,Math.abs(t.x),Math.abs(t.y)); }); B+=3;
    goals.forEach(([gx,gy])=>{ const g0=key(gx,gy); if(!T.has(g0)||reach.has(g0)) return;
      const prev=new Map([[g0,null]]); const dq=[[gx,gy]]; let hit=null;
      while(dq.length){ const [x,y]=dq.shift(); const k0=key(x,y); if(reach.has(k0)){ hit=k0; break; }
        for(const [ax,ay] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+ax, ny=y+ay; if(Math.abs(nx)>B||Math.abs(ny)>B) continue; const kk=key(nx,ny); if(prev.has(kk)) continue; prev.set(kk,k0); if(T.has(kk)&&T.get(kk).t!=='moat'&&!T.get(kk).wall) dq.unshift([nx,ny]); else dq.push([nx,ny]); } }
      let cur=hit; while(cur){ if(!T.has(cur)||T.get(cur).t==='moat'){ const [x,y]=cur.split(',').map(Number); T.set(cur,{x,y,t:'bridge',isl:null}); } cur=prev.get(cur); }
      flood(st); }); }
  /* v28.1 바닥 브러시 */
  L.forEach(l=>Object.entries(l.paint||{}).forEach(([k,b])=>{ if(!b||!W_TILE['p_'+b]) return; const [dx,dy]=k.split('_').map(Number); const t=T.get(key(l.cx+dx,l.cy+dy)); if(t&&t.isl===l.uid&&t.t!=='bridge') t.t='p_'+b; }));
  return {T,L,key};
}
function wNightK(){ if(window.__wDay) return 0; const t=Date.now(); if(wNightK.t&&t-wNightK.t<5000) return wNightK.v; const d=new Date(); const hr=d.getHours()+d.getMinutes()/60; wNightK.t=t; wNightK.v=hr>=19.5||hr<5.5?1:hr>=18.5?(hr-18.5):hr<6.5?(6.5-hr):0; return wNightK.v; }
function wDuskK(){ const d=new Date(); const hr=d.getHours()+d.getMinutes()/60; return hr>=16.5&&hr<19.5?Math.sin((hr-16.5)/3*Math.PI):0; }
try{ window.__wDay=localStorage.getItem('dko-wday')==='day'; }catch(e){}

/* ── 아이템 그리기: (ox,oy)=타일 위 가운데, u=복셀 한 칸 ── */
function wDrawItem(g,t,ox,oy,u,tm,seed,lv){
  lv=lv||1; const C=(...a)=>wCube(g,ox,oy,u,...a);
  if(W_DRAWX[t]){ W_DRAWX[t](g,ox,oy,u,tm,seed||0,lv,C); return; }
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
    /* ── 소셜 아일랜드 명소 (2×2) ── */
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
    case 'lm_dkoa': { wShadow(g,ox,oy+u*2.6,u*15,u*7); C(-7.5,-5,0,15,10,1,'#5E6480'); C(-7,-4.5,1,14,9,.6,'#8E94AC');
      /* 4원소 결정 기둥 + 대륙 문양 아치 */
      const EC=[['#E8C060','#8A5A12'],['#FF9A4A','#D0300A'],['#9CE4FF','#2F8FE0'],['#FFE45A','#9A5AE8']];
      [[-6.6,-4],[4.4,-4],[-6.6,2],[4.4,2]].forEach(([x,y],i)=>{ const b=Math.sin(tm*2+i)*.6; C(x,y,1.6,2.2,2.2,5+i%2,'#454A66',{t:'#6E7496'}); C(x+.4,y+.4,6.6+i%2+b,1.4,1.4,2.4,EC[i][0],{t:'#FFFFFF',l:EC[i][0],r:EC[i][1]}); });
      C(-6,-1.4,1.6,2.4,2.8,11,'#5E6480',{t:'#8E94AC',l:'#6E7496',r:'#454A66'}); C(3.6,-1.4,1.6,2.4,2.8,11,'#5E6480',{t:'#8E94AC',l:'#6E7496',r:'#454A66'}); C(-6.4,-1.8,12.6,12.8,3.6,2,'#454A66',{t:'#7CC8FF',l:'#5E6480',r:'#2E3350'});
      const P2=(a,b,c2)=>[ox+(a-b)*u,oy+(a+b)*u*.5-c2*u]; const q=[P2(-3.6,0,1.6),P2(3.6,0,1.6),P2(3.6,0,12.6),P2(-3.6,0,12.6)];
      const gr=g.createLinearGradient(...P2(0,0,12.6),...P2(0,0,1.6)); gr.addColorStop(0,'#C8F0FF'); gr.addColorStop(.5,'#7CC8FF'); gr.addColorStop(1,'#6A3FD8');
      g.save(); g.globalAlpha=.9; g.fillStyle=gr; g.beginPath(); g.moveTo(...q[0]); q.slice(1).forEach(p=>g.lineTo(...p)); g.closePath(); g.fill(); g.clip();
      for(let i=0;i<12;i++){ const a=tm*1.4+i*.52, r=.5+((i*.23+tm*.2)%1)*3.4; const p=P2(Math.cos(a)*r,0,7.1+Math.sin(a)*r*1.4); g.fillStyle=['rgba(232,192,96,.8)','rgba(255,154,74,.8)','rgba(156,228,255,.9)','rgba(255,228,90,.8)'][i%4]; g.fillRect(p[0]-u*.5,p[1]-u*.5,u,u); }
      g.restore(); break; }
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
function wWarm(c){ try{ const raw=[...(c.islands||[])].sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)).slice(0,80); buildWorldC(raw.map(wNorm)); }catch(e){} }
/* ═════════ 월드 화면 ═════════ */
const W_ICP={}; const wIcon=n=>W_ICP[n]||(W_ICP[n]=new Path2D(ICONS[n]||ICONS.star||''));
function WorldBeta({c,onClose}){
  const cv=useRef(null); const S=useRef(null);
  const [mode,setMode]=useState('view'); const [sel,setSel]=useState(null); const [shop,setShop]=useState(false); const [stab,setStab]=useState('res');
  const [card,setCard]=useState(null); const [ghost,setGhost]=useState(null); const [,tick]=useState(0); const [hint,setHint]=useState(true);
  const [cloud,setCloud]=useState('in'); const [info,setInfo]=useState(null); const [nm,setNm]=useState(null); const [rank,setRank]=useState(false); const [raidO,setRaidO]=useState(false); const [ptyO,setPtyO]=useState(false); const [lvUp,setLvUp]=useState(null); const [msn,setMsn]=useState(false); const [emo,setEmo]=useState(false); const visRef=useRef({});
  const [lm,setLm]=useState(null); const [lsel,setLsel]=useState(null); const [ppl,setPpl]=useState(false);
  const [dg,setDg]=useState(null); const [tp,setTp]=useState(null); const [chat,setChat]=useState(false); const [edit,setEdit]=useState(null); const [cedit,setCedit]=useState(null); const [bag,setBag]=useState(null); const [meO,setMeO]=useState(false); const [mailO,setMailO]=useState(false); const [sty,setSty]=useState(false); const [qtab,setQtab]=useState(()=>{ try{ return localStorage.getItem('dko-qtab')||'q'; }catch(e){ return 'q'; } }); const [pb,setPb]=useState('sand'); const pbR=useRef('sand'); pbR.current=pb;
  const [welcome,setWelcome]=useState(false); const [ctext,setCtext]=useState(''); const logRef=useRef(new Map()); const cRef=useRef(c); cRef.current=c;
  const [wset,setWset]=useState(false); const [near,setNear]=useState(null); const [door,setDoor]=useState(null); const [hallIn,setHallIn]=useState(false); const [npcT,setNpcT]=useState(null); const [npcAi,setNpcAi]=useState(null); const [ctl,setCtl]=useState(wCtl());
  const [gd,setGd]=useState(null); const [gbk,setGbk]=useState(null); const [qs,setQs]=useState(false); const [mapO,setMapO]=useState(false); const [ew,setEw]=useState(null); const [rtab,setRtab]=useState('isl'); const [mm,setMm0]=useState(()=>lsGet('dko-wmm','mini'));
  const setMm=v=>{ setMm0(v); lsSet('dko-wmm',v); };
  useEffect(()=>{ if(!npcT) return; const t=setTimeout(()=>setNpcT(null),6500); return ()=>clearTimeout(t); },[npcT&&npcT.k]);
  useEffect(()=>{ const f=()=>{ setCtl(wCtl()); const s=S.current; if(s){ s.fps30=wFps()==='30'; const k=wZoomK(); if(s.zk!==k){ s.tz=Math.max(.42,Math.min(2.4,s.tz*k/(s.zk||1))); s.zk=k; s.follow=true; } } }; window.addEventListener('dko-wset',f); wBgm('world'); return ()=>{ window.removeEventListener('dko-wset',f); window.DKOSfx&&window.DKOSfx.bgmStop(); }; },[]);
  const rpg=rpgOf(c.me);
  const now=Date.now();
  const raw=useMemo(()=>[...(c.islands||[])].sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)).slice(0,80),[c.islands]);
  const isl=useMemo(()=>raw.map(wNorm),[raw]);
  const mine=isl.find(x=>x.uid===c.uid);
  const wKey=wKeyOf(isl);
  const W=useMemo(()=>buildWorldC(isl),[wKey]);
  const online=isl.filter(I=>I.uid!==c.uid&&I.here&&I.here.at&&now-I.here.at<65000);
  /* v27.5 연말 시즌 · 이번 주 인기 섬 · DKO 전적 · 같은 파티 */
  const xmOn=useMemo(()=>wXmas(),[]);
  const topU=useMemo(()=>{ const t=wTopIsl(isl); return t?t.uid:null; },[isl]);
  const recM=useMemo(()=>{ const o={}; isl.forEach(I=>{ o[I.uid]=wRecOf(c,I.uid); }); return o; },[wKey,c.matches,c.duels]);
  const ptyS=useMemo(()=>wPartyUids(c),[c.parties,c.uid]);
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
  const sendHere=force=>{ const s=S.current; if(!s||!c.islandPing||s.paused) return; if(isStealth(c.me)||!consentOpt(c.me,'loc')) return; const t=Date.now(); if(!force&&t-pingAt.current<2500) return; pingAt.current=t; const h={at:t,x:Math.round(s.me.x*10)/10,y:Math.round(s.me.y*10)/10}; if(s.me.say&&t-s.me.say.at<60000) h.say=s.me.say; if(s.me.emo&&wEmoOn(s.me.emo)) h.emo={k:s.me.emo.k,at:s.me.emo.at}; c.islandPing({here:h}); };
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
      if(wHash(t%991,7,2)<.15){ c.worldGold&&c.worldGold(30,'장애물 밑에서 골드 30을 찾았어요!'); } }
    if(mine._mig&&!D.has('mig')){ D.add('mig'); patch=patch?{bricks:mine.bricks,fv:1,...patch,items:patch.items||items}:{items,bricks:mine.bricks,fv:1}; }
    if(patch){ save(patch); if(fx.length){ const f0=fx[fx.length-1]; setLvUp({t:f0.t,lv:f0.up.to,k:Date.now()}); wSfx('clear'); haptic([20,40,80]); } const s=S.current; if(s&&fx.length){ const L=s.W.L.find(l=>l.uid===c.uid); fx.forEach(it=>{ const [w,h]=wSz(it); s.pop[it.i]=performance.now(); if(L){ s.fx.push({k:'burst',gx:L.cx+it.x+(w-1)/2,gy:L.cy+it.y+(h-1)/2,at:performance.now()}); s.fx.push({k:'txt',gx:L.cx+it.x+(w-1)/2,gy:L.cy+it.y+(h-1)/2,at:performance.now(),txt:it.up.to>1?'Lv.'+it.up.to+' 완성!':'완성!'}); } }); haptic(20); const it0=fx[0]; wDyn({ic:'home',col:'#3FA8EE',lab:'건물 완성',t:fx.length===1?wName(it0.t)+(it0.up.to>1?' Lv.'+it0.up.to+' 업그레이드 완료!':' 완성!'):'건물 '+fx.length+'개 완성!',b:'눌러서 보러 가기',go:()=>{ const s2=S.current, L2=s2&&s2.W.L.find(l=>l.uid===c.uid); if(L2){ s2.jump(L2.cx+it0.x+1,L2.cy+it0.y+2,1.1); setSel({i:it0.i}); } },dur:4200}); } }
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
    const s=S.current={born:performance.now(),W,isl,cam:{x:W_START[0],y:W_START[1],z:.62},tz:wZoomK(),zk:wZoomK(),me:{x:W_START[0],y:W_START[1],path:[],yaw:0,ty:0,walk:false,v:0,ph:0},drag:null,fx:[],pop:{},rise:null,trise:{},ghost:null,sel:null,mode:'view',members:c.members,meM:c.me,uid:c.uid,olc:new Map(),blk:new Set(),ospot:{},landC:[],lsel:null,lmHit:[],mark:null};
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
    s.jump=(x,y,z)=>{ const t=safe(Math.round(x),Math.round(y))||[x,y]; s.me.x=t[0]; s.me.y=t[1]; s.me.path=[]; s.me.v=0; s.follow=true; s.mark=null; if(z) s.tz=z*wZoomK(); s.arrive&&s.arrive(); };
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
    const frame=now=>{ if(dead) return; if(s.paused){ s.sleep=true; return; } if(s.fps30&&now-last<31){ raf=requestAnimationFrame(frame); return; } const dt=Math.max(0,Math.min(.05,(now-last)/1000)); last=now; const tm=now/1000;
      const m=s.me; m.walk=false; const x0=m.x, y0=m.y;
      /* 조이스틱: 길찾기 없이 바로 그 방향으로 (막히면 벽을 따라 미끄러져요) */
      const J=s.joy; if(J&&(Math.abs(J[0])>.12||Math.abs(J[1])>.12)){ m.path=[]; s.mark=null; if(m.emo){ m.emo=null; s.emoOff=1; } const mag=Math.min(1,Math.hypot(J[0],J[1])); const [wx,wy]=wJoyDir(J[0],J[1]); const want=4.4*mag; m.v=(m.v||0)+(want-(m.v||0))*Math.min(1,dt*9); const sp=m.v*dt;
        const nx=m.x+wx*sp, ny=m.y+wy*sp; const ok=(x,y)=>!blocked(Math.round(x),Math.round(y)); if(ok(nx,ny)){ m.x=nx; m.y=ny; } else if(ok(nx,m.y)) m.x=nx; else if(ok(m.x,ny)) m.y=ny; m.ty=Math.atan2(-wx,wy); m.walk=true; m.ph=(m.ph||0)+sp*4.4; s.follow=true; s.jmoved=now; }
      else if(m.path.length){ if(m.emo){ m.emo=null; s.emoOff=1; } if(step(m,4.6,dt)){ s.mark=null; s.arrive&&s.arrive(); } }
      else if(s.jmoved&&now-s.jmoved>400){ s.jmoved=0; s.arrive&&s.arrive(); }
      { const dd=Math.hypot(m.x-x0,m.y-y0); if(dd>0&&dd<2){ s.wd=(s.wd||0)+dd; if(s.wd>=10){ s.wd-=10; wQ('walk',10); } } }
      turn(m,dt,12);
      if(m.walk&&now-(s.stepAt||0)>(m.v>3?260:340)){ s.stepAt=now; wSfx('step',.8); s.fx.push({k:'step',gx:m.x,gy:m.y,at:now}); }
      { let nk=null, nd=1.7; for(const l of W_LM){ const [dx,dy]=lmDoor(l); const d=Math.hypot(dx-m.x,dy-m.y); if(d<nd){ nd=d; nk=l.k; } } if(nk!==s.lmNear){ s.lmNear=nk; s.onNear&&s.onNear(nk); } }
      { let inP=null; const rx=Math.round(m.x), ry=Math.round(m.y); for(const l of W_LM){ if(l.dg&&rx===l.x+1&&(ry===l.y+1||ry===l.y+2)) inP=l; }
        if(inP&&s.ptIn!==inP.k&&s.mode==='view'&&now-(s.born||0)>2500){ s.ptIn=inP.k; m.path=[]; s.fx.push({k:'burst',gx:inP.x+1.5,gy:inP.y+1.5,at:now}); haptic([12,30]); s.startDg&&s.startDg(inP.dg); } else if(!inP&&s.ptIn&&Math.hypot(m.x-(W_LM.find(l=>l.k===s.ptIn)||{x:0}).x-1,m.y-(W_LM.find(l=>l.k===s.ptIn)||{y:0}).y-2)>2.2) s.ptIn=null; }
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
        if(T.t==='moat'){ wMoatTile(ctx,px,py,HW,HH,z,T,tm); ctx.globalAlpha=1; continue; }
        const nM=k=>{ const t1=s.W.T.get(k); return !t1||t1.t==='moat'; };
        const front=nM((T.x+1)+','+T.y), left=nM(T.x+','+(T.y+1));
        if(front){ ctx.fillStyle=isB?'#7A4E2C':'#9A6A44'; ctx.beginPath(); ctx.moveTo(px+HW,py); ctx.lineTo(px,py+HH); ctx.lineTo(px,py+HH+side); ctx.lineTo(px+HW,py+side); ctx.closePath(); ctx.fill(); }
        if(left){ ctx.fillStyle=isB?'#8A5A34':'#B07E52'; ctx.beginPath(); ctx.moveTo(px-HW,py); ctx.lineTo(px,py+HH); ctx.lineTo(px,py+HH+side); ctx.lineTo(px-HW,py+side); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle=alt; ctx.beginPath(); ctx.moveTo(px,py-HH); ctx.lineTo(px+HW,py); ctx.lineTo(px,py+HH); ctx.lineTo(px-HW,py); ctx.closePath(); ctx.fill();
        if(isB){ ctx.strokeStyle='rgba(90,58,32,.45)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(px-HW*.5,py-HH*.5); ctx.lineTo(px+HW*.5,py+HH*.5); ctx.stroke(); }
        if(T.t==='grass'&&wHash(T.x,T.y,11)>.82){ ctx.fillStyle=wShade(col[0],-0.15); ctx.fillRect(px-2*z,py-1*z,2*z,3*z); ctx.fillRect(px+3*z,py+1*z,2*z,2*z); }
        if(T.t==='grass'&&wHash(T.x,T.y,23)>.93){ ctx.fillStyle=['#FFFFFF','#FFD6E8','#FFF2A0'][Math.floor(wHash(T.x,T.y,4)*3)]; ctx.fillRect(px-5*z,py,1.6*z,1.6*z); ctx.fillRect(px+4*z,py-2*z,1.6*z,1.6*z); }
        if(s.xm&&(T.t==='grass'||T.t==='sand')&&wHash(T.x,T.y,31)>.58){ ctx.fillStyle='rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(px+(wHash(T.x,T.y,32)-.5)*HW*.7,py+(wHash(T.x,T.y,33)-.5)*HH*.7,HW*(.22+wHash(T.x,T.y,34)*.16),HH*(.2+wHash(T.x,T.y,35)*.14),0,0,Math.PI*2); ctx.fill(); }
        if(T.t==='blvd'||T.cas) wCobble(ctx,px,py,HW,HH,z,T);
        if(T.t==='path'){ ctx.fillStyle='rgba(160,120,70,.22)'; for(let i=0;i<4;i++){ const a=wHash(T.x,T.y,i*3+1), b=wHash(T.x,T.y,i*3+2); ctx.beginPath(); ctx.ellipse(px+(a-.5)*HW*1.1,py+(b-.5)*HH*1.1,2.6*z,1.5*z,0,0,Math.PI*2); ctx.fill(); } ctx.fillStyle='rgba(255,255,255,.28)'; ctx.fillRect(px-HW*.3,py-HH*.35,2*z,1*z); }
        if((front||left)&&!isB&&T.t!=='bridge'){ ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=2*z; ctx.beginPath(); if(front){ ctx.moveTo(px+HW,py+side+2*z); ctx.lineTo(px,py+HH+side+2*z); } if(left){ ctx.moveTo(px-HW,py+side+2*z); ctx.lineTo(px,py+HH+side+2*z); } ctx.stroke(); }
        if((s.mode==='place'||s.mode==='move')&&T.isl===s.uid&&T.t!=='bridge'){ ctx.strokeStyle='rgba(255,255,255,.28)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(px,py-HH); ctx.lineTo(px+HW,py); ctx.lineTo(px,py+HH); ctx.lineTo(px-HW,py); ctx.closePath(); ctx.stroke(); }
        if(s.mode==='paint'&&T.isl===s.uid&&T.t!=='bridge'){ ctx.strokeStyle='rgba(255,159,203,.55)'; ctx.lineWidth=1.2*z; ctx.beginPath(); ctx.moveTo(px,py-HH); ctx.lineTo(px+HW,py); ctx.lineTo(px,py+HH); ctx.lineTo(px-HW,py); ctx.closePath(); ctx.stroke(); }
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
        I.items.forEach(it=>{ const [w,h]=wSz(it); const gx=L.cx+it.x, gy=L.cy+it.y; ents.push({d:gx+gy+(w-1)/2+(h-1)/2,k:'i',it,gx,gy,w,h,own:I.uid===s.uid,seed:wStr(it.i),I}); });
        wObstacles(I,I.uid).forEach(o=>{ const gx=L.cx+o.x, gy=L.cy+o.y; const T=s.W.T.get(gx+','+gy); if(!T||T.isl!==I.uid) return; ents.push({d:gx+gy,k:'ob',o,gx,gy,own:I.uid===s.uid,clr:I.clr&&I.clr.k===o.k?I.clr:null}); });
        ents.push({d:L.cx+L.cy+L.r+2,k:'name',gx:L.cx+L.r*.7,gy:L.cy+L.r*.7,I});
        const os=s.ospot[I.uid]; if(I.uid!==s.uid&&os&&!s.olc.has(I.uid)) ents.push({d:os[0]+os[1]+.05,k:'owner',gx:os[0],gy:os[1],uid:I.uid});
        I.items.forEach(it=>{ if(it.up&&it.up.end>t){ const [w,h]=wSz(it); ents.push({d:L.cx+it.x+L.cy+it.y+w+h-1.1,k:'builder',gx:L.cx+it.x+w-.4,gy:L.cy+it.y+h-.25,it}); } });
      });
      wFootEnts(s,ents,t);
      wCDeco(s.xm,s.W).forEach(([x,y,t2],i)=>{ const [w,h]=wSz({t:t2}); ents.push({d:x+y+(w-1)/2+(h-1)/2,k:'i',it:{t:t2,lv:1,i:'c'+i},gx:x,gy:y,w,h,seed:i*13}); });
      W_LM.forEach(l=>ents.push({d:l.x+l.y+2.9,k:'lm',l,gx:l.x+1,gy:l.y+1}));
      ents.push({d:s.me.x+s.me.y+.05,k:'me',gx:s.me.x,gy:s.me.y});
      (s.npcs||[]).forEach(n=>ents.push({d:n.x+n.y+.04,k:'npc',gx:n.x,gy:n.y,n}));
      (s.fnpc||[]).forEach(n=>ents.push({d:n.x+n.y+.04,k:'fn',gx:n.x,gy:n.y,n})); s.npcHit=[];
      for(const [uid,o] of s.olc) ents.push({d:o.x+o.y+.045,k:'ol',gx:o.x,gy:o.y,o});
      if(s.ghost){ const [w,h]=wSz(s.ghost); ents.push({d:s.ghost.gx+s.ghost.gy+(w-1)/2+(h-1)/2+.01,k:'ghost',gx:s.ghost.gx,gy:s.ghost.gy,w,h,gh:s.ghost}); }
      ents.sort((a,b)=>a.d-b.d);
      const labels=[]; s.lmHit=[]; const meS={x:s.me.x,y:s.me.y,scr:scr(s.me.x,s.me.y)};
      for(const e of ents){ g.globalAlpha=1; const big=e.w>1||e.h>1; const cx=e.gx+((e.w||1)-1)/2, cy=e.gy+((e.h||1)-1)/2; const [px,py]=scr(cx,cy); const pad=big?260*z:160; if(px<-pad||px>s.vw+pad||py<-pad-60||py>s.vh+pad) continue;
        /* v29.6 내가 건물 뒤에 있으면 건물을 반투명하게 */ if(e.k==='i'||e.k==='lm'||e.k==='ob'){ const oa=wOccSmooth(s,e.k+(e.it?e.it.i+e.gx+','+e.gy:e.l?e.l.k:e.o?e.o.k+e.gx:''),wOccA(s,e,px,py,u,meS)); if(oa<.98) g.globalAlpha=oa; }
        if(e.k==='i'){ const it=e.it; if(s.mode==='move'&&s.sel&&s.sel.i===it.i&&e.own) continue;
          const isSel=e.own&&s.sel&&s.sel.i===it.i; const sc0=W_SC[it.t]||1;
          if(isSel){ const pl=.5+.5*Math.sin(tm*6); g.strokeStyle='rgba(255,255,255,'+(.55+pl*.4)+')'; g.lineWidth=2.4; diamond(e.gx,e.gy,e.w,e.h); g.stroke(); }
          const building=it.up&&it.up.end>t; const pop=s.pop[it.i]; let sc=1;
          if(pop){ const k=(pnow-pop)/700; if(k>=1) delete s.pop[it.i]; else sc=wBack(k)*.25+.75+Math.sin(k*Math.PI)*.12; }
          if(isSel) sc*=1+Math.sin(tm*6)*.02;
          if(building&&it.lv===0){ g.save(); g.translate(px,py); g.scale(sc*sc0,sc*sc0); C0(g,u,tm); g.restore(); }
          else { const hsk=it.t==='hall'&&e.I&&e.I.hsk&&e.I.hsk!=='none'&&W_HSK[e.I.hsk]; if(hsk) g.filter=hsk.f; drawIt(itType(it,e.w,e.h),px,py,u,tm,e.seed,it.lv||1,it.r,sc*sc0); if(hsk) g.filter='none'; }
          if(it.t==='farm'&&e.I&&!building) wFarmDraw(g,px,py,u,tm,e.I,it,e.own,t,!e.own&&wCanWater(e.I,it.i,s.uid,t));
          if(building){ const hk=Math.sqrt(sc0); wScaffold(g,px,py,u*sc0,tm,it.t==='hall'?14:W_BIG.has(it.t)?11:7); const tot=it.up.end-(it.up.st||it.up.end-1000); const p=Math.max(0,Math.min(1,1-(it.up.end-t)/Math.max(1,tot)));
            const by=py-u*(it.t==='hall'?22:18)*sc0; const bw=Math.max(54,u*13), bh=Math.max(7,u*1.6);
            g.fillStyle='rgba(10,16,30,.7)'; rr(g,px-bw/2-2,by-2,bw+4,bh+4,(bh+4)/2); g.fill(); g.fillStyle='#7CD957'; rr(g,px-bw/2,by,bw*p,bh,bh/2); g.fill();
            g.font='800 '+Math.max(10,u*2.3)+'px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.textBaseline='bottom'; g.fillStyle='#fff'; g.strokeStyle='rgba(0,0,0,.55)'; g.lineWidth=3; const tx=wFmtT((it.up.end-t)/1000); g.strokeText(tx,px,by-3); g.fillText(tx,px,by-3); }
          if(e.own&&it.t==='mine'&&it.lv>=1&&!building){ const st=wMineStock(it,t); if(st>=10){ const bb=Math.sin(tm*4)*u*.6; const bx=px, by=py-u*24+bb; g.fillStyle='#fff'; g.beginPath(); g.arc(bx,by,u*3.2,0,Math.PI*2); g.fill(); g.beginPath(); g.moveTo(bx-u*1.2,by+u*2.8); g.lineTo(bx,by+u*4.4); g.lineTo(bx+u*1.2,by+u*2.8); g.fill(); wBrick(g,bx,by,u*.9); } }
        }
        else if(e.k==='lm'){ const l=e.l; const [qx,qy]=scr(l.x+1,l.y+1); const near=s.lmNear===l.k; const bb=near?1+Math.sin(tm*5)*.012:1; drawIt('lm_'+l.k,qx,qy,u,tm,3,1,!!l.f,W_LMS*bb); if(l.dg) wPortalVeil(g,qx,qy,u*W_LMS,tm,l,near); if(near){ wLmDoorGlow(g,qx,qy,u*W_LMS,tm,l); } labels.push({l,x:qx,y:qy-u*W_LMS*(l.k==='pass'?58:l.k==='town'?20:l.k==='story'?24:l.dg?22:17)}); s.lmHit.push({k:l.k,x:qx,y:qy-u*7*W_LMS,r:Math.max(40,u*14)}); }
        else if(e.k==='ob'){ let sc=1; if(e.clr){ const k=1-Math.max(0,(e.clr.end-t)/W_OB_TIME); sc=1-k*.55; const sh=Math.sin(tm*30)*u*.4*(1-k); g.save(); g.translate(px+sh,py); g.scale(sc,sc); wDrawItem(g,e.o.t,0,0,u,tm,wStr(e.o.k),1); g.restore();
            if(Math.floor(tm*8)%2===0){ g.fillStyle='rgba(230,210,170,.7)'; g.beginPath(); g.arc(px+(wHash(Math.floor(tm*8),1,1)-.5)*u*8,py-u*2,u*1.4,0,Math.PI*2); g.fill(); }
            const bw=Math.max(46,u*11); g.fillStyle='rgba(10,16,30,.7)'; rr(g,px-bw/2-2,py-u*16-2,bw+4,10,5); g.fill(); g.fillStyle='#FFC233'; rr(g,px-bw/2,py-u*16,bw*k,6,3); g.fill(); }
          else { const isSel=e.own&&s.sel&&s.sel.ob===e.o.k; if(isSel){ g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=2.4; diamond(e.gx,e.gy,1,1); g.stroke(); } wDrawItem(g,e.o.t,px,py,u,tm,wStr(e.o.k),1); } }
        else if(e.k==='name'){ const nm0=(e.I.name||'').slice(0,12); g.font='900 '+Math.max(10,Math.round(u*2.4))+'px "NEXON Kart Gothic",sans-serif'; const tw=g.measureText(nm0).width+18; const y=py+u*2;
          g.fillStyle='rgba(255,247,230,.95)'; rr(g,px-tw/2,y,tw,u*4.2,u*1.2); g.fill(); g.fillStyle='#C9965A'; g.fillRect(px-tw/2,y+u*4.2-2,tw,2); g.fillStyle='#3A2410'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(nm0,px,y+u*2.2);
          g.fillStyle='#FF5A1A'; g.font='900 '+Math.max(9,Math.round(u*1.9))+'px "NEXON Kart Gothic",sans-serif'; g.fillText('본부 Lv.'+e.I.hallLv,px,y+u*5.6); wNameX(g,px,y,u,tm,e.I,s); }
        else if(e.k==='ft') wFootDraw(g,px,py,u,e);
        else if(e.k==='owner'){ const m2=(s.members||[]).find(x=>x.uid===e.uid); if(m2){ const zz=!isOnline(m2);
            if(zz){ const br=1+Math.sin(tm*1.6+e.gx)*.025; g.save(); g.translate(px,py); g.scale(1,br); g.translate(-px,-py); wDrawChar(g,px,py+u*.6,u*.95,avatarOf(m2),.45,0,false,dispName(m2)+' · 쿨쿨',false,{}); g.restore(); wSleepZ(g,px,py,u,tm,e.gx); }
            else wDrawChar(g,px,py,u*.95,avatarOf(m2),Math.sin(tm*.6+e.gx)*.8+.4,tm+e.gx,false,dispName(m2),false,{wave:Math.sin(tm*.5+e.gx)>.92}); } }
        else if(e.k==='builder') wDrawChar(g,px,py,u*.7,{base:'robot',color:'orange'},-2.4,tm,false,null,false,{hammer:true,hat:true});
        else if(e.k==='me'&&s.me.emo&&wEmoOn(s.me.emo)){ wDrawEmo(g,px,py,u*.95,tm,avatarOf(s.meM),s.me.yaw,dispName(s.meM),true,{ph:s.me.ph,eq:rpgEqLook(rpgOf(s.meM))},s.me.emo); if(s.me.say&&Date.now()-s.me.say.at<7000) wBubble(g,px,py-u*21,s.me.say,u); }
        else if(e.k==='me'){ const em=s.me.emote&&pnow<s.me.emote; const hop=em?Math.abs(Math.sin((s.me.emote-pnow)/1400*Math.PI*3))*u*3:0; const bob=s.me.walk?Math.abs(Math.sin(s.me.ph*.5))*u*.7:Math.sin(tm*2)*u*.12; wDrawChar(g,px,py-hop-bob,u*.95,avatarOf(s.meM),em?0.4:s.me.yaw,tm,s.me.walk,dispName(s.meM),true,{wave:em,ph:s.me.ph,eq:rpgEqLook(rpgOf(s.meM))}); if(em&&s.me.emoji){ g.font=(u*5)+'px sans-serif'; g.textAlign='center'; g.fillText(s.me.emoji,px,py-u*22-hop); }  if(s.me.say&&Date.now()-s.me.say.at<7000) wBubble(g,px,py-u*21,s.me.say,u); }
        else if(e.k==='npc'){ const n=e.n; wDrawChar(g,px,py-(n.walk?Math.abs(Math.sin(n.ph*.5))*u*.6:0),u*.9,avatarOf(n.m),n.yaw,tm+n.x,n.walk,dispName(n.m),false,{wave:n.wave>pnow,ph:n.ph}); }
        else if(e.k==='fn'){ const n=e.n, D=n.def; wDrawChar(g,px,py-(n.walk?Math.abs(Math.sin(n.ph*.5))*u*.6:Math.sin(tm*2+n.x)*u*.12),u*.92,D.av,n.yaw,tm+n.x,n.walk,null,false,{ph:n.ph,wave:n.talk>pnow});
          const tg=D.n; g.font='900 '+Math.max(10,Math.round(u*2.4))+'px "NEXON Kart Gothic",sans-serif'; const tw=g.measureText(tg).width+20, th=Math.max(16,u*3.6), ty=py-u*17; g.fillStyle='rgba(255,252,244,.96)'; rr(g,px-tw/2,ty-th/2,tw,th,th/2); g.fill(); g.fillStyle=D.c; g.beginPath(); g.arc(px-tw/2+8,ty,3.4,0,Math.PI*2); g.fill(); g.fillStyle='#3A2410'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(tg,px+4,ty+1);
          if(D.gift&&!s.npcGot){ const by=py-u*23+Math.sin(tm*4)*u*.6; g.fillStyle='#FFD54A'; g.beginPath(); g.arc(px,by,u*2.2,0,Math.PI*2); g.fill(); g.fillStyle='#7A4E00'; g.font='900 '+Math.round(u*3)+'px sans-serif'; g.fillText('!',px,by+1); }
          if(n.say&&pnow<n.talk) wBubble(g,px,py-u*(D.gift&&!s.npcGot?27:21),{t:n.say},u);
          s.npcHit.push({id:D.id,x:px,y:py-u*8,r:Math.max(30,u*8)}); }
        else if(e.k==='ol'&&!e.o.walk&&e.o.emo&&wEmoOn(e.o.emo)){ const o=e.o; wDrawEmo(g,px,py,u*.95,tm,avatarOf(o.m),o.yaw,dispName(o.m),false,{ph:o.ph,on:true,eq:rpgEqLook(rpgOf(o.m))},o.emo); if(s.pty&&s.pty.has(o.m.uid)) wPartyTag(g,px,py,u); if(o.say&&Date.now()-o.say.at<7000) wBubble(g,px,py-u*21,o.say,u); }
        else if(e.k==='ol'){ const o=e.o; if(s.pty&&s.pty.has(o.m.uid)) wPartyTag(g,px,py,u); wDrawChar(g,px,py-(o.walk?Math.abs(Math.sin(o.ph*.5))*u*.7:0),u*.95,avatarOf(o.m),o.yaw,tm+o.x,o.walk,dispName(o.m),false,{ph:o.ph,on:true,eq:rpgEqLook(rpgOf(o.m))}); if(o.say&&Date.now()-o.say.at<7000) wBubble(g,px,py-u*21,o.say,u); }
        else if(e.k==='ghost'){ const gh=e.gh; g.fillStyle=gh.ok?'rgba(124,217,87,.45)':'rgba(255,70,70,.45)'; diamond(e.gx,e.gy,e.w,e.h); g.fill(); g.strokeStyle=gh.ok?'rgba(200,255,180,.9)':'rgba(255,170,170,.9)'; g.lineWidth=2; g.stroke();
          g.save(); g.globalAlpha=.55+.25*Math.sin(tm*5); drawIt(itType(gh,e.w,e.h),px,py-u*(1+Math.sin(tm*5)*.6),u,tm,1,gh.lv||1,gh.r,W_SC[gh.t]||1); g.restore(); }
      }
      g.globalAlpha=1;
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
        g.globalCompositeOperation='lighter'; for(const e of ents){ if(!(e.k==='lm'||(e.k==='i'&&e.it&&['lamp','lamp2','fire','neon','house','hall','shop'].includes(e.it.t)))) continue; const cx=e.gx+((e.w||1)-1)/2+(e.k==='lm'?.5:0), cy=e.gy+((e.h||1)-1)/2+(e.k==='lm'?.5:0); const [px,py]=scr(cx,cy); if(px<-80||px>s.vw+80||py<-80||py>s.vh+80) continue;
          const rg=g.createRadialGradient(px,py-u*7,0,px,py-u*7,u*12); rg.addColorStop(0,'rgba(255,190,110,'+(.35*night)+')'); rg.addColorStop(1,'rgba(255,190,110,0)'); g.fillStyle=rg; g.fillRect(px-u*12,py-u*19,u*24,u*24); }
        g.globalCompositeOperation='source-over';
        for(let i=0;i<40;i++){ const x=wHash(i,9,9)*s.vw, y=wHash(i,5,5)*s.vh*.5; const tw=.5+.5*Math.sin(tm*2+i); g.fillStyle='rgba(255,255,255,'+(night*.7*tw)+')'; g.fillRect(x,y,i%7?1.6:2.4,i%7?1.6:2.4); } }
      if(s.xm) wSnowFx(g,s,tm); wEnvFx(g,s,tm);
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
    if(/^file:|localhost/.test(location.href)){ window.__wb=s; s.obs=wObstacles; s.talkNpc=id=>S.talk&&S.talk(id); }
    /* 소셜 아일랜드를 돌아다니는 크루원들 (접속 중이 아닌 크루원) */
    const cTiles=[...s.W.T.values()].filter(t=>t.isl==='center'&&t.t!=='bridge'); const pick=()=>{ for(let i=0;i<20;i++){ const t=cTiles[Math.floor(Math.random()*cTiles.length)]; if(!s.blk.has(t.x+','+t.y)) return t; } return cTiles[0]; };
    s.pick=pick;
    s.npcs=(c.members||[]).filter(m=>m.uid!==c.uid&&!m.banned&&isOnline(m)).sort(()=>Math.random()-.5).slice(0,4).map(m=>{ const t=pick(); return {m,x:t.x,y:t.y,path:[],yaw:Math.random()*6,ty:0,wait:1+Math.random()*3,wave:0,ph:0,v:0}; });
    s.fnpc=W_NPC.map(D=>({def:D,x:D.home[0],y:D.home[1],path:[],yaw:Math.random()*6,ty:0,wait:1+Math.random()*3,ph:0,v:0,talk:0,say:null,li:0}));
    s.npcGot=lsGet(npcGiftKey(),'')==='1';
    const pts=new Map();
    /* v27.5 캐릭터를 꾹 누르면(0.42초) 감정 휠 */
    const lpChk=e=>{ clearTimeout(s.lpT); if(s.mode!=='view'||!s.onLong) return; const r=el.getBoundingClientRect(); const sx=e.clientX-r.left, sy=e.clientY-r.top; const [mx,my]=scr(s.me.x,s.me.y); const u0=WCF.TW*s.cam.z/17;
      if(Math.hypot(sx-mx,sy-(my-u0*8))>Math.max(36,u0*9)) return; s.lpT=setTimeout(()=>{ const D=s.drag; if(D&&!D.moved){ D.moved=true; D.lp=true; haptic([12,30,14]); s.onLong(mx,my-u0*9); } },420); };
    const down=e=>{ el.setPointerCapture(e.pointerId); pts.set(e.pointerId,[e.clientX,e.clientY]); if(pts.size===1){ s.drag={x:e.clientX,y:e.clientY,cx:s.cam.x,cy:s.cam.y,moved:false}; lpChk(e); } else if(pts.size===2){ clearTimeout(s.lpT); const [a,b]=[...pts.values()]; s.pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),z:s.tz}; } };
    const move=e=>{ if(!pts.has(e.pointerId)) return; pts.set(e.pointerId,[e.clientX,e.clientY]);
      if(pts.size===2&&s.pinch){ const [a,b]=[...pts.values()]; const d=Math.hypot(a[0]-b[0],a[1]-b[1]); s.tz=Math.max(.42,Math.min(2.4,s.pinch.z*d/s.pinch.d)); if(s.drag) s.drag.moved=true; return; }
      const D=s.drag; if(!D||D.lp) return; const dx=e.clientX-D.x, dy=e.clientY-D.y; if(Math.hypot(dx,dy)>6){ D.moved=true; s.follow=false; clearTimeout(s.lpT); }
      if(D.moved){ const z=s.cam.z; const a=(-dx/z)/(WCF.TW/2), b=(-dy/z)/(WCF.TH/2); s.cam.x=D.cx+(a+b)/2; s.cam.y=D.cy+(b-a)/2; } };
    const up=e=>{ clearTimeout(s.lpT); pts.delete(e.pointerId); if(pts.size<2) s.pinch=null; const D=s.drag; if(pts.size===0) s.drag=null; if(!D||D.moved) return;
      const r=el.getBoundingClientRect(); const sx=e.clientX-r.left, sy=e.clientY-r.top; const [wx,wy]=unscr(sx,sy); const tx=Math.round(wx), ty=Math.round(wy);
      s.onTap&&s.onTap(tx,ty,s.W.T.get(tx+','+ty),sx,sy); };
    const wheel=e=>{ e.preventDefault(); s.tz=Math.max(.42,Math.min(2.4,s.tz*(e.deltaY>0?.9:1.1))); };
    el.addEventListener('pointerdown',down); el.addEventListener('pointermove',move); el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up); el.addEventListener('wheel',wheel,{passive:false});
    return ()=>{ dead=true; cancelAnimationFrame(raf); ro.disconnect(); el.removeEventListener('pointerdown',down); el.removeEventListener('pointermove',move); el.removeEventListener('pointerup',up); el.removeEventListener('pointercancel',up); el.removeEventListener('wheel',wheel); };
  },[]);
  /* 크루원 섬 방문 보상: 섬마다 하루 한 번 벽돌 +15 */
  useEffect(()=>{ const s=S.current; if(!s||!mine) return; const T=s.W.T.get(Math.round(s.me.x)+','+Math.round(s.me.y)); if(!T||!T.isl||T.isl==='center'||T.isl===c.uid) return;
    { const fk='ft:'+T.isl; if(Date.now()-(visRef.current[fk]||0)>3600000){ visRef.current[fk]=Date.now(); const o0=isl.find(x=>x.uid===T.isl); if(o0&&c.footIsland) c.footIsland(o0); } }
    const day=dayKey(); const V=mine.visits&&mine.visits.d===day?mine.visits:{d:day,ids:[]}; if(V.ids.includes(T.isl)||visRef.current[T.isl]===day) return; visRef.current[T.isl]=day;
    const o=isl.find(x=>x.uid===T.isl); save(mark('visit',{visits:{d:day,ids:[...V.ids,T.isl]},bricks:mine.bricks+15})); s.fx.push({k:'txt',gx:s.me.x,gy:s.me.y,at:performance.now(),txt:'+15',ic:'brick'}); wDyn({ic:'foot',col:'#FFB15C',lab:'섬 방문',t:(o?o.name:'크루원 섬')+'에 발자국을 남겼어요',b:'방문 보상 · 벽돌 +15 · 방명록도 남겨 봐요',gl:'방명록',go:()=>{ if(o){ closeAll(); setGbk(o.uid); } },dur:4200}); wQ('visit'); haptic(12); });
  /* 땅 넓히기 후보: 내 땅과 맞닿은 바다 · 다리 · 이웃 섬 가장자리 */
  const landC=useMemo(()=>{ if(!mine) return []; const T=W.T; const out=new Map(); const itemAt=new Set();
    isl.forEach(I=>{ const L=W.L.find(l=>l.uid===I.uid); if(L) I.items.forEach(it=>wCells(it).forEach(([a,b])=>itemAt.add((L.cx+a)+','+(L.cy+b)))); });
    for(const t of T.values()){ if(t.isl!==c.uid) continue; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const x=t.x+dx, y=t.y+dy, k=x+','+y; if(out.has(k)) continue; const u2=T.get(k);
      if(u2&&u2.isl===c.uid) continue; if(Math.hypot(x,y)<W_CR+1.5) continue; if(u2&&u2.isl==='center') continue;
      /* v29.5 거미줄 배치: 내 섬 자리(최대 반지름) 밖으로는 못 넓혀요 → 이웃 섬 · 다리와 안 겹쳐요 */
      { const ML=W.L.find(l=>l.uid===c.uid); if(ML&&Math.hypot(x-ML.cx,y-ML.cy)>WEB.RF-.6) continue; } if(u2&&u2.t==='bridge') continue;
      if(u2&&u2.isl){ const o=W.L.find(l=>l.uid===u2.isl); if(!o||Math.hypot(x-o.cx+.5,y-o.cy+.5)<W_PROTECT||itemAt.has(k)) continue; out.set(k,{x,y,k,steal:u2.isl}); }
      else out.set(k,{x,y,k,water:!u2}); } }
    return [...out.values()]; },[W,c.uid,!!mine,isl]);
  /* v29.1 월드 안에서는 확인 창도 월드 유리 스타일 · 바텀시트로 */
  useEffect(()=>{ const el=document.documentElement; el.classList.add('inw'); return ()=>el.classList.remove('inw'); },[]);
  /* 렌더 상태 동기화 */
  useEffect(()=>{ const s=S.current; if(!s) return; s.W=W; s.isl=isl; s.mode=mode; s.members=c.members; s.meM=c.me; s.ghost=ghost; s.sel=sel; s.landC=landC; s.lsel=lsel;
    s.arrive=()=>sendHere(); s.onNear=k=>setNear(k); s.xm=xmOn; s.top=topU; s.rec=recM; s.pty=ptyS; s.onLong=(x,y)=>{ setChat(false); setEw([x,y]); };
    const blk=new Set(); const add=(x,y)=>{ const t0=W.T.get(x+','+y); if(t0&&(t0.t==='bridge'||t0.t==='path')) return; blk.add(x+','+y); };
    isl.forEach(I=>{ const L=W.L.find(l=>l.uid===I.uid); if(!L) return; I.items.forEach(it=>{ if(W_WALK.has(it.t)) return; wCells(it).forEach(([a,b])=>add(L.cx+a,L.cy+b)); }); wObstacles(I,I.uid).forEach(o=>{ if(o.t!=='ob_weed') add(L.cx+o.x,L.cy+o.y); }); });
    /* v29.1 포털은 가운데 길이 열려 있어서 걸어 들어가면 바로 출발해요 */
    W_LM.forEach(l=>{ for(let i=0;i<3;i++) for(let j=0;j<3;j++){ if(l.dg&&i===1&&j>=1) continue; add(l.x+i,l.y+j); } }); wCDeco(xmOn,W).forEach(([x,y,t])=>{ if(!W_WALK.has(t)) wCells({t},x,y).forEach(([a,b])=>add(a,b)); });
    W.T.forEach(t0=>{ if(t0.t==='moat') blk.add(t0.x+','+t0.y); });
    s.blk=blk;
    isl.forEach(I=>{ const L=W.L.find(l=>l.uid===I.uid); if(!L) return; const sp=[[0,2],[1,2],[-1,2],[2,1],[2,0],[2,2],[-2,2],[0,3],[1,3],[3,0],[2,-1],[-3,0]].map(([a,b])=>[L.cx+a,L.cy+b]).find(([x,y])=>{ const T=W.T.get(x+','+y); return T&&T.isl===I.uid&&!blk.has(x+','+y); }); s.ospot[I.uid]=sp||[L.cx+2,L.cy+2]; });
    /* 접속 중인 크루원: 알려 준 위치까지 걸어가요 */
    const live=new Set();
    online.forEach(I=>{ const m=(c.members||[]).find(x=>x.uid===I.uid); if(!m) return; live.add(I.uid); const h=I.here; let o=s.olc.get(I.uid);
      if(!o){ o={x:h.x,y:h.y,tx:h.x,ty:h.y,path:[],yaw:0,ty0:0,ph:0,v:0,m}; o.ty=0; s.olc.set(I.uid,o); }
      o.m=m; o.say=h.say||null; o.emo=h.emo||null; if(o.tx!==h.x||o.ty0!==h.y){ o.tx=h.x; o.ty0=h.y; if(Math.hypot(h.x-o.x,h.y-o.y)>40){ o.x=h.x; o.y=h.y; o.path=[]; } else o.path=(s.route&&s.route(o.x,o.y,Math.round(h.x),Math.round(h.y)))||[[h.x,h.y]]; } });
    for(const k of [...s.olc.keys()]) if(!live.has(k)) s.olc.delete(k);
    if(s.npcs) s.npcs=s.npcs.filter(n=>!live.has(n.m.uid));
  });

  const myL=()=>S.current&&S.current.W.L.find(l=>l.uid===c.uid);
  const freeAt=(lx,ly,except,shape)=>{ if(!mine) return false; const L=myL(); if(!L) return false; const s=S.current;
    const occ=new Set(); mine.items.forEach(it=>{ if(it.i===except) return; wCells(it).forEach(([a,b])=>occ.add(a+','+b)); }); const obs=new Set(wObstacles(mine,c.uid).map(o=>o.k));
    return wCells(shape||{t:'tree'},lx,ly).every(([a,b])=>{ const T=s.W.T.get((L.cx+a)+','+(L.cy+b)); return T&&T.isl===c.uid&&T.t!=='bridge'&&(T.land||Math.hypot(a,b)<=wRad(mine.exp||0)+.35)&&!occ.has(a+','+b)&&!obs.has(a+','+b); }); };
  const findFree=shape=>{ for(let r=1;r<16;r++) for(let x=-r;x<=r;x++) for(let y=-r;y<=r;y++) if(Math.max(Math.abs(x),Math.abs(y))===r&&freeAt(x,y,null,shape)) return [x,y]; return null; };
  const spot=uid=>{ const s=S.current; const L=s&&s.W.L.find(l=>l.uid===uid); if(!L) return null; return s.ospot[uid]||[L.cx+2,L.cy+2]; };
  const goIsland=(uid,z)=>{ const p=spot(uid); if(p) S.current.jump(p[0],p[1],z||1.05); setCard(null); setSel(null); setLm(null); };
  const goMine=()=>goIsland(c.uid);
  const goCenter=()=>{ const s=S.current; s.jump(W_START[0],W_START[1],1); setCard(null); setSel(null); setLm(null); };
  const openLm=k=>{ const s=S.current; const l=W_LM.find(x=>x.k===k); if(!l||!s) return; const fr=[[l.x+1,l.y+3],[l.x,l.y+3],[l.x+2,l.y+3],[l.x+3,l.y+1],[l.x-1,l.y+1],[l.x+1,l.y-1]].sort((a,b)=>Math.hypot(a[0]-s.me.x,a[1]-s.me.y)-Math.hypot(b[0]-s.me.x,b[1]-s.me.y));
    for(const [x,y] of fr){ if(s.go(x,y)) break; } s.follow=true; setLm(k); setSel(null); setCard(null); haptic(8); };
  const enterLm=l=>{ haptic(14); if(l.dg){ startDg(l.dg); return; } const s=S.current; if(s){ const [cx2,cy2]=lmC(l); s.follow=false; s.cam.x+=(cx2-s.cam.x)*.5; s.cam.y+=(cy2-s.cam.y)*.5; s.tz=Math.min(2.2,s.cam.z*1.6); } wSfx('door'); setDoor(l); setLm(null); setTimeout(()=>{ onClose(); l.go(c); },950); };
  /* 주민 NPC와 이야기 · 우체부 피피는 하루 한 번 선물 */
  const talkNpc=id=>{ const s=S.current; if(!s) return; const n=(s.fnpc||[]).find(x=>x.def.id===id); if(!n) return; const D=n.def; const Q0=qState().Q; const q0=wNqOf(D.id); const ctx={q:q0,p:Q0.p,got:!!Q0.got[D.id],lv:wAffLv(((mine&&mine.aff)||{})[D.id])}; n.say=wNpcSay(D,n.li++,ctx); if(q0&&!ctx.got&&(Q0.p[q0.k]||0)>=q0.n) setTimeout(()=>claimQ(D.id),500); n.talk=performance.now()+4600; n.path=[]; wSfx('npc'); haptic(8);
    setNpcT({id,t:n.say,k:Date.now()}); setLm(null); setSel(null);
    if(D.gift&&!s.npcGot&&mine){ s.npcGot=true; lsSet(npcGiftKey(),'1'); saveBricks(60); s.fx.push({k:'txt',gx:n.x,gy:n.y,at:performance.now(),txt:'+60',ic:'brick'}); wSfx('gem'); c.notify(D.n+'의 선물 · 벽돌 60개!'); }
    const tx=Math.round(n.x+1), ty=Math.round(n.y+1); s.follow=true; if(Math.hypot(s.me.x-n.x,s.me.y-n.y)>2.2) s.go(tx,ty); };
  /* 포털: 화면이 소용돌이로 덮이고 다른 세계로 넘어가요 */
  S.talk=talkNpc;
  const startDg=async k=>{ if(tp) return; const D0=DG[k]; if(rpg.lv<D0.lv&&!(await dkoAsk(D0.n+'은(는) 추천 Lv.'+D0.lv+' 이상이에요. 지금 Lv.'+rpg.lv+' 이에요. 그래도 갈까요?'))) return;
    setLm(null); setSel(null); setCard(null); setChat(false); setTp({k,dir:'in',key:Date.now()}); haptic([20,40,60]); wSfx('tp');
    setTimeout(()=>{ const s=S.current; if(s) s.paused=true; setDg(k); },750); setTimeout(()=>setTp(null),1600); };
  if(S.current) S.current.startDg=startDg;
  const exitDg=()=>{ const k=dg; setTp({k,dir:'out',key:Date.now()}); wSfx('tp'); setTimeout(()=>wBgm('world'),700); setTimeout(()=>{ setDg(null); const s=S.current; if(s){ s.paused=false; s.wake&&s.wake(); const l=W_LM.find(x=>x.dg===k); if(l) s.jump(l.x+1,l.y+4,1); sendHere(true); } },750); setTimeout(()=>setTp(null),1600); };
  const saveBricks=n=>{ const cc=cRef.current; const I=(cc.islands||[]).find(x=>x.uid===cc.uid); const b0=I?(I.bricks==null?W_START_BRICKS:I.bricks):0; return cc.saveIsland({bricks:b0+n}); };
  /* ═══ v27.5 월드 대규모 업데이트 1부: 의뢰 · 텃밭 · 방명록 · 감정 · 지도 · 다이나믹 바 ═══ */
  const closeAll=()=>{ setBag(null); setMeO(false); setMailO(false); setSty(false); setShop(false); setPpl(false); setMsn(false); setRank(false); setRaidO(false); setPtyO(false); setWset(false); setEdit(null); setInfo(null); setGd(null); setGbk(null); setQs(false); setMapO(false); setCard(null); setLm(null); setSel(null); setEw(null); setNpcT(null); };
  /* NPC 의뢰: 하루 진행 상황을 모아 두었다가 잠깐 뒤에 한 번에 저장 */
  const qPend=useRef({}); const qT=useRef(0); const qSeen=useRef({});
  const qState=()=>{ const cc=cRef.current; const I=(cc.islands||[]).find(x=>x.uid===cc.uid); const Q=wNqDay(I); Object.entries(qPend.current).forEach(([k,n])=>{ Q.p[k]=(Q.p[k]||0)+n; }); return {Q,I}; };
  const qFlush=()=>{ const {Q,I}=qState(); if(!I) return; qPend.current={}; cRef.current.saveIsland({nq:Q}); };
  const claimQ=id=>{ const {Q,I}=qState(); if(!I) return; const D=W_NPC.find(x=>x.id===id); const q=wNqOf(id); if(!D||!q||Q.got[id]||(Q.p[q.k]||0)<q.n) return;
    const aff={...(I.aff||{})}; const p0=aff[id]||0, l0=wAffLv(p0); aff[id]=p0+20; const l1=wAffLv(aff[id]); const G=l1>l0?W_AFFG[l1]:null;
    qPend.current={}; clearTimeout(qT.current); let b=(I.bricks==null?W_START_BRICKS:I.bricks)+W_NQR[id]; if(G&&G.b) b+=G.b;
    cRef.current.saveIsland({nq:{...Q,got:{...Q.got,[id]:1}},aff,bricks:b});
    if(G&&G.d) cRef.current.worldGold(G.d*W_GOLD_RATE); if(G&&G.item&&cRef.current.giveWorldItem) cRef.current.giveWorldItem('n_'+id);
    const s=S.current; const n=s&&(s.fnpc||[]).find(x=>x.def.id===id); if(s){ const at=n?[n.x,n.y]:[s.me.x,s.me.y]; s.fx.push({k:'burst',gx:at[0],gy:at[1],at:performance.now()}); s.fx.push({k:'txt',gx:at[0],gy:at[1],at:performance.now(),txt:'+'+W_NQR[id],ic:'brick'}); if(n){ n.say=l1>l0?'우리 이제 '+W_AFFN[l1]+'예요! 선물 받아 줘요♪':'고마워요! 내일 또 부탁해도 될까요?'; n.talk=performance.now()+4200; } }
    wSfx('gem'); haptic([14,30,20]); cRef.current.repDaily&&cRef.current.repDaily('nq',5,6,'월드 주민 의뢰');
    wDyn({ic:'heart',col:D.c,lab:D.n,t:l1>l0?'호감도 UP! '+W_AFFN[l1]:'의뢰 완료 · 벽돌 +'+W_NQR[id],b:G?'선물: '+G.t+(G.item?' · 상점 → 선물에서 놓아요':''):'호감도 +20 · '+aff[id]+'/'+(W_AFF[l1+1]||'MAX'),dur:4400}); };
  useEffect(()=>{ const f=e=>{ const {k,n}=e.detail||{}; if(!k) return; qPend.current[k]=(qPend.current[k]||0)+(n||1); clearTimeout(qT.current); qT.current=setTimeout(qFlush,1500);
      const {Q}=qState(); W_NPC.forEach(D=>{ const q=wNqOf(D.id); if(!q||q.k!==k||Q.got[D.id]||qSeen.current[D.id]) return; if((Q.p[k]||0)>=q.n){ qSeen.current[D.id]=1; wDyn({id:'nq'+D.id,ic:'scroll',col:D.c,lab:'주민 의뢰',t:D.n+'의 의뢰 완료!',b:'눌러서 보상 받기 · 호감도 +20',gl:'받기',go:()=>claimQ(D.id),dur:5200}); } }); };
    window.addEventListener('dko-wq',f); return ()=>{ window.removeEventListener('dko-wq',f); clearTimeout(qT.current); if(Object.keys(qPend.current).length) qFlush(); }; },[]);
  const qReady=mine?W_NPC.some(D=>{ const q=wNqOf(D.id); const Q=wNqDay(mine); return q&&!Q.got[D.id]&&(Q.p[q.k]||0)>=q.n; }):false;
  const goNpc=id=>{ const s=S.current; const n=s&&(s.fnpc||[]).find(x=>x.def.id===id); if(!n) return; closeAll(); s.follow=true; if(Math.hypot(s.me.x-n.x,s.me.y-n.y)>12) s.jump(n.x+1,n.y+1,1.1); else s.go(Math.round(n.x+1),Math.round(n.y+1)); setTimeout(()=>talkNpc(id),900); };
  /* 텃밭 */
  const goPlot=pid=>{ const L=myL(); const it=mine&&mine.items.find(x=>x.i===pid); const s=S.current; if(!L||!it||!s) return; closeAll(); s.jump(L.cx+it.x+1,L.cy+it.y+1,1.15); };
  const plant=(pid,k)=>{ const C=wCropOf(k); if(!C||!mine) return; if(C.lv>mine.hallLv){ c.notify('본부 Lv.'+C.lv+'부터 심을 수 있어요.','err'); return; } if(wPlotOf(mine,pid)){ c.notify('이미 자라고 있어요.','err'); return; } if(mine.bricks<C.cost){ c.notify('벽돌이 '+(C.cost-mine.bricks)+'개 모자라요.','err'); return; }
    save({['garden.'+pid]:{c:k,at:Date.now()},bricks:mine.bricks-C.cost}); wQ('plant'); wSfx('pick'); haptic(10); const s=S.current, L=myL(), it=mine.items.find(x=>x.i===pid); if(s&&L&&it) s.fx.push({k:'dust',gx:L.cx+it.x,gy:L.cy+it.y,at:performance.now()}); };
  /* v28.1 수확한 작물은 요리 재료로도 들어와요 (작물당 2개 + 물 준 횟수) */
  const addPt=outs=>{ const add={}; outs.forEach(o=>{ if(!ING[o.C.k]) return; const n=2+Math.min(3,wPlotWater(mine,o.pid,(wPlotOf(mine,o.pid)||{}).at).length)+lifePerk(rpg,'fm'); add[o.C.k]=(add[o.C.k]||0)+n; }); if(!Object.keys(add).length) return; c.saveRpg(r=>{ const pt={...(r.pt||{})}; Object.entries(add).forEach(([k,n])=>pt[k]=(pt[k]||0)+n); return {pt,life:lifeAdd(r,'fm',outs.length)}; }); };
  const carpGifts=n=>{ if(!n) return; const got=[]; for(let i=0;i<n;i++){ const k=CARP_GIFT[Math.floor(Math.random()*CARP_GIFT.length)]; got.push(W_CAT[k].n); c.giveWorldItem(k); } wDyn({ic:'gift',col:'#C99A5A',lab:'목공소',t:'가구 상자 '+n+'개를 열었어요',b:got.join(' · ')+' → 상점 선물 탭',dur:3600}); };
  const harvest=pids=>{ if(!mine) return; const t=Date.now(); const outs=pids.map(pid=>{ const P=wPlotOf(mine,pid); const end=wPlotEnd(mine,pid); if(!P||t<end) return null; const C=wCropOf(P.c); const n=Math.min(3,wPlotWater(mine,pid,P.at).length); return {pid,C,gain:C.get+Math.round(C.get*.1*n),coin:C.coin||0}; }).filter(Boolean); if(!outs.length) return;
    const sum=outs.reduce((a,o)=>a+o.gain,0); const patch={bricks:mine.bricks+sum}; outs.forEach(o=>{ patch['garden.'+o.pid]=null; }); save(patch); addPt(outs);
    const coin=outs.reduce((a,o)=>a+o.coin,0)*W_GOLD_RATE; if(coin) c.worldGold(coin);
    const s=S.current, L=myL(); if(s&&L) outs.forEach(o=>{ const it=mine.items.find(x=>x.i===o.pid); if(!it) return; s.fx.push({k:'burst',gx:L.cx+it.x,gy:L.cy+it.y,at:performance.now()}); s.fx.push({k:'txt',gx:L.cx+it.x,gy:L.cy+it.y,at:performance.now(),txt:'+'+o.gain,ic:'brick'}); });
    wQ('harvest',outs.length); wSfx('gem'); haptic([12,24,16]);
    wDyn({ic:'sprout',col:'#7CD957',lab:'텃밭 수확',t:(outs.length===1?outs[0].C.n:'작물 '+outs.length+'개')+' 수확!',b:'벽돌 +'+sum.toLocaleString()+(coin?' · 골드 +'+coin.toLocaleString():''),dur:3200}); };
  /* v27.7 모두 모으기: 벽돌 공방 + 다 자란 텃밭을 한 번에 */
  const collectAll=()=>{ if(!mine) return; const t=Date.now(); const ms=mine.items.filter(x=>x.t==='mine'&&x.lv>=1&&!(x.up&&x.up.end>t)); const st=Math.round(ms.reduce((a,x)=>a+wMineStock(x,t),0)*(1+lifePerk(rpg,'bd',mine)));
    const outs=mine.items.filter(it=>it.t==='farm'&&wPlotEnd(mine,it.i)&&t>=wPlotEnd(mine,it.i)).map(it=>{ const P=wPlotOf(mine,it.i); if(!P) return null; const C=wCropOf(P.c); const n=Math.min(3,wPlotWater(mine,it.i,P.at).length); return {pid:it.i,it,C,gain:C.get+Math.round(C.get*.1*n),coin:C.coin||0}; }).filter(Boolean);
    if(st<1&&!outs.length&&!mine.items.some(x=>wCarpStock(x,t)>=1)){ c.notify('지금은 모을 게 없어요.'); return; }
    const sum=outs.reduce((a,o)=>a+o.gain,0); const ids=new Set(ms.filter(x=>wMineStock(x,t)>=1).map(x=>x.i)); const cps=mine.items.filter(x=>wCarpStock(x,t)>=1); cps.forEach(x=>ids.add(x.i)); const patch={items:mine.items.map(x=>ids.has(x.i)?{...x,c:t}:x),bricks:mine.bricks+st+sum}; outs.forEach(o=>{ patch['garden.'+o.pid]=null; }); save(patch); addPt(outs); carpGifts(cps.reduce((a,x)=>a+wCarpStock(x,t),0));
    const coin=outs.reduce((a,o)=>a+o.coin,0)*W_GOLD_RATE; if(coin) c.worldGold(coin);
    const s=S.current, L=myL(); if(s&&L){ ms.forEach(x=>{ if(ids.has(x.i)) s.fx.push({k:'burst',gx:L.cx+x.x+.5,gy:L.cy+x.y+.5,at:performance.now()}); }); outs.forEach(o=>s.fx.push({k:'burst',gx:L.cx+o.it.x,gy:L.cy+o.it.y,at:performance.now()})); s.fx.push({k:'txt',gx:L.cx,gy:L.cy,at:performance.now(),txt:'+'+(st+sum),ic:'brick'}); }
    if(st) wQ('col'); if(outs.length) wQ('harvest',outs.length); wSfx('gem'); haptic([12,24,16]);
    wDyn({ic:'sprout',col:'#FFB020',lab:'모두 모으기',t:[st?'벽돌 공방':null,outs.length?'작물 '+outs.length+'개':null].filter(Boolean).join(' · ')+' 수확!',b:'벽돌 +'+(st+sum).toLocaleString()+(coin?' · 골드 +'+coin.toLocaleString():''),dur:3200}); };
  const waterPlots=(I0,pids)=>{ const t=Date.now(); const L0=pids.filter(pid=>wCanWater(I0,pid,c.uid,t)).map(pid=>({pid,at:wPlotOf(I0,pid).at})); if(!L0.length){ wDyn({ic:'drop',col:'#3FA2F2',t:'지금은 물 줄 작물이 없어요',b:'자라는 작물마다 한 번씩 줄 수 있어요 (작물당 최대 3명)',dur:2800}); return; }
    c.waterIsland(I0,L0); if(I0.uid!==c.uid) c.worldGold(15*L0.length); wQ('water',L0.length); wSfx('pick'); haptic(12); const s=S.current, L=s&&s.W.L.find(l=>l.uid===I0.uid); if(s&&L) L0.forEach(o=>{ const it=I0.items.find(x=>x.i===o.pid); if(it) s.fx.push({k:'txt',gx:L.cx+it.x,gy:L.cy+it.y,at:performance.now(),txt:'물 주기!'}); });
    wDyn({ic:'drop',col:'#3FA2F2',lab:'물 주기',t:I0.name+' 텃밭에 물을 줬어요',b:'작물 '+L0.length+'개가 20% 더 빨리 자라요'+(I0.uid!==c.uid?' · 품앗이 골드 +'+(15*L0.length):''),dur:3000}); };
  const farmTap=(I0,fp,tx,ty)=>{ const s=S.current; const t=Date.now(); haptic(8);
    if(I0.uid===c.uid){ const end=wPlotEnd(I0,fp.i); if(end&&t>=end){ harvest([fp.i]); return; } setCard(null); setLm(null); if(sel&&sel.i===fp.i){ closeAll(); setGd({pid:fp.i}); return; } setSel({i:fp.i}); return; }
    if(wPlotOf(I0,fp.i)) waterPlots(I0,[fp.i]); else wDyn({ic:'sprout',col:'#7CD957',t:'아직 아무것도 심지 않은 텃밭이에요',dur:2200}); if(s){ s.follow=true; if(Math.hypot(s.me.x-tx,s.me.y-ty)>2) s.go(tx+1,ty+1); } };
  const myReady=(()=>{ const L=W.L.find(l=>l.uid===c.uid); if(!mine||!L) return []; return mine.items.filter(it=>{ if(it.t!=='farm') return false; const e=wPlotEnd(mine,it.i); return e&&now>=e; }).map(it=>[L.cx+it.x,L.cy+it.y]); })();
  /* 방명록 */
  const gbWrite=(I0,t)=>{ if(!c.guestWrite) return; c.guestWrite(I0,t); wQ('gb'); wSfx('pick'); haptic(10); wDyn({ic:'book',col:'#C29BFF',lab:'방명록',t:'한마디를 남겼어요',b:I0.name+'에 발자국과 함께 남아요',dur:2600}); };
  const gbDel=(I0,id)=>{ c.guestDel&&c.guestDel(I0,id); haptic(8); };
  const recClaim=g=>{ if(!mine||!(g>0)) return; save({lkAt:Date.now(),bricks:mine.bricks+g}); wSfx('gem'); haptic([12,24,16]); wDyn({ic:'swords',col:'#FF7A7A',lab:'DKO 전적 보상',t:'벽돌 +'+g.toLocaleString(),b:'내전 · 1대1 기록이 섬에 반영됐어요',dur:3400}); };
  /* 감정 표현 */
  const doEmo=k=>{ const s=S.current; if(!s) return; s.me.emo={k,at:Date.now()}; s.me.path=[]; s.mark=null; pingAt.current=0; sendHere(true); setEw(null); wQ('emote'); wSfx('pick'); haptic(10); };
  const openEmo=()=>{ const s=S.current; if(!s||!s.scr) return; const [x,y]=s.scr(s.me.x,s.me.y); const u0=WCF.TW*s.cam.z/17; closeAll(); setChat(false); setEw([x,y-u0*9]); };
  /* 지도: 빠른 이동 */
  const mapGo=(x,y)=>{ const s=S.current; if(!s) return; closeAll(); s.fx.push({k:'dust',gx:s.me.x,gy:s.me.y,at:performance.now()}); s.jump(x,y,1); s.fx.push({k:'burst',gx:s.me.x,gy:s.me.y,at:performance.now()}); wSfx('tp'); haptic([10,20,30]); };
  const quick=[{k:'c',n:'소셜 아일랜드',ic:'plaza',c:['#FFD54A','#E8900A'],go:()=>{ closeAll(); goCenter(); }},{k:'m',n:'내 섬',ic:'home',c:['#FFB15C','#E8420A'],go:()=>{ closeAll(); goMine(); }},
    ...W_LM.map(l=>({k:l.k,n:l.n.replace(' 포털',''),ic:l.ic,c:l.c,go:()=>{ closeAll(); if(l.dg) startDg(l.dg); else openLm(l.k); }}))];
  /* 키보드 */
  const onKey=code=>{ if(dg) return; const s=S.current; if(!s) return;
    if(code==='Escape'){ closeAll(); setChat(false); return; }
    if(code==='KeyM'){ const o=mapO; closeAll(); if(!o) setMapO(true); return; }
    if(code==='KeyQ'){ if(ew) setEw(null); else openEmo(); return; }
    if(code==='KeyG'){ closeAll(); setGd(true); return; }
    if(code==='KeyE'||code==='Space'||code==='Enter'){ if(sheetOpen||mode!=='view') return; const l=near&&W_LM.find(x=>x.k===near); if(l){ enterLm(l); return; } const n=(s.fnpc||[]).map(n=>({n,d:Math.hypot(n.x-s.me.x,n.y-s.me.y)})).sort((a,b)=>a.d-b.d)[0]; if(n&&n.d<2.8) talkNpc(n.n.def.id); } };
  /* 월드 다이나믹 바: 텃밭 다 자람 · 물 주기 · 방명록 · 크루 입장 · 파티 · DKO 전적 */
  const dySeen=useRef(null);
  useEffect(()=>{ if(!mine) return; let first=false; if(!dySeen.current){ let raw=null; try{ raw=localStorage.getItem('dko-gd-seen'); }catch(e){} first=!raw; try{ dySeen.current=new Set(JSON.parse(raw||'[]')); }catch(e){ dySeen.current=new Set(); } }
    const t=Date.now(); const S0=dySeen.current; let ch=false;
    mine.items.filter(x=>x.t==='farm').forEach(it=>{ const P=wPlotOf(mine,it.i); if(!P) return; const end=wPlotEnd(mine,it.i); const key='r:'+it.i+':'+P.at; const C=wCropOf(P.c);
      if(t>=end&&!S0.has(key)){ S0.add(key); ch=true; wDyn({id:key,ic:'sprout',col:'#7CD957',lab:'텃밭',t:C.n+' 다 자랐어요!',b:'눌러서 수확하러 가기',gl:'가기',go:()=>goPlot(it.i),dur:5200}); }
      wPlotWater(mine,it.i,P.at).forEach(([k])=>{ const wk='w:'+k+':'+P.at; if(S0.has(wk)) return; S0.add(wk); ch=true; if(first) return; const m0=c.members.find(x=>x.uid===k.slice(it.i.length+1)); wDyn({id:wk,ic:'drop',col:'#3FA2F2',lab:'물 주기',t:(m0?dispName(m0):'크루')+'님이 '+C.n+'에 물을 줬어요',b:'20% 더 빨리 자라요 · 수확 보너스 +10%',go:()=>goPlot(it.i),dur:3800}); }); });
    Object.entries(mine.gb||{}).forEach(([id,e])=>{ if(!e||!e.t||e.u===c.uid) return; const gk='gb:'+id; if(S0.has(gk)) return; S0.add(gk); ch=true; if(first||t-e.at>7*86400000) return; const m0=c.members.find(x=>x.uid===e.u); wDyn({id:gk,ic:'book',col:'#C29BFF',lab:'방명록',t:(m0?dispName(m0):'크루')+': '+String(e.t).slice(0,22),b:'내 섬 방명록에 한마디를 남겼어요',gl:'보기',go:()=>{ closeAll(); setGbk(c.uid); },dur:4600}); });
    (c.parties||[]).forEach(p=>{ if(!(p.participants||[]).some(x=>x.uid===c.uid)||!p.at) return; const pk='p:'+p.id+':'+p.at; if(S0.has(pk)) return; if(t>=p.at-5*60000&&t<p.at+30*60000){ S0.add(pk); ch=true; wDyn({id:pk,ic:'users',col:'#FF8A3D',lab:'파티',t:(p.title||'파티')+(t>=p.at?' 시작했어요!':' 곧 시작해요'),b:'눌러서 파티 로비로 가기',gl:'로비',go:()=>leave(()=>c.setLobby&&c.setLobby(p.id)),dur:6000}); } });
    if(ch){ try{ localStorage.setItem('dko-gd-seen',JSON.stringify([...S0].slice(-500))); }catch(e){} } });
  const olSeen=useRef(null); const olKey=online.map(I=>I.uid).sort().join(',');
  useEffect(()=>{ const ids=online.map(I=>I.uid); if(olSeen.current==null){ olSeen.current=new Set(ids); return; }
    ids.forEach(u=>{ if(olSeen.current.has(u)) return; olSeen.current.add(u); const m0=c.members.find(x=>x.uid===u); const I=online.find(x=>x.uid===u); const pt=ptyS.has(u); if(m0) wDyn({id:'ol'+u,ic:'users',col:pt?'#FF8A3D':'#3DDC84',lab:pt?'파티원':'크루',t:dispName(m0)+'님이 월드에 들어왔어요',b:'눌러서 옆으로 가기',go:()=>{ const s=S.current; if(s&&I&&I.here) s.jump(I.here.x+1,I.here.y+1,1.1); },dur:3600}); });
    [...olSeen.current].forEach(u=>{ if(!ids.includes(u)) olSeen.current.delete(u); }); },[olKey]);
  const recGain=mine?wRecGain(wRecOf(c,c.uid,mine.lkAt||Date.now()-7*86400000)):0; const recRef=useRef(0);
  useEffect(()=>{ if(recGain>recRef.current&&mine){ const first=recRef.current===0; recRef.current=recGain; setTimeout(()=>wDyn({id:'rec'+recGain,ic:'swords',col:'#FF7A7A',lab:'DKO 연동',t:first?'내전 · 1대1 전적 보상이 쌓였어요':'새 전적이 월드에 반영됐어요',b:'벽돌 +'+recGain.toLocaleString()+' 받으러 가기',gl:'받기',go:()=>{ closeAll(); setRtab('rec'); setRank(true); },dur:5200}),first?2600:0); } else if(recGain<recRef.current) recRef.current=recGain; },[recGain,!!mine]);
  useEffect(()=>{ if(!mine) return; let seen=false; try{ seen=localStorage.getItem('dko-w275')==='1'; }catch(e){} if(seen) return; const t=setTimeout(()=>{ try{ localStorage.setItem('dko-w275','1'); }catch(e){} wDyn({ic:'emote',col:'#FF8FB0',lab:'새 기능',t:'캐릭터를 꾹 누르면 감정 표현!',b:'PC는 WASD로 걷고 Q 감정 · M 지도 · E 들어가기',dur:6000}); },3400); return ()=>clearTimeout(t); },[!!mine]);
  useEffect(()=>{ document.documentElement.classList.toggle('dko-wopen',!dg); return ()=>document.documentElement.classList.remove('dko-wopen'); },[!!dg]);
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
  const buyGear=(k,el,r,price)=>{ if(gold<price){ c.notify('골드가 '+(price-gold).toLocaleString()+' 모자라요','err'); return; }
    const G=gearOf(rpg); if(G.it.length>=gCap(G)){ c.notify('가방이 가득 찼어요 · 남는 장비를 분해하거나 팔아요','err'); return; }
    c.worldGold(-price).then(ok=>{ if(!ok) return; let nm=''; c.saveRpg(x=>{ const N=gClone(gearOf(x)); const it=gNew(N,k,el,r); nm=GR_N[r]+' '+gName(it); N.it.push(it); return {gear:N}; }).then(()=>c.notify(nm+'을(를) 샀어요! 가방에서 장착해요')); wSfx('coin'); haptic(14); }); };
  const buyEq=(slot,ti)=>{ const T=EQ_T[ti]; const price=EQ_PRICE[slot][ti]; const id=eqId(slot,T.k);
    if(!price){ c.notify('골드 장비는 헬바운드 보스만 떨어뜨려요.','err'); return; } if(ti>=1&&mine.hallLv<2){ c.notify('실버 장비는 섬 본부 Lv.2부터 살 수 있어요.','err'); return; }
    pay({b:price},()=>{ save({bricks:bricks-price}); c.saveRpg(r=>({inv:{...r.inv,[id]:(r.inv[id]||0)+1},eq:r.eq[slot]?r.eq:{...r.eq,[slot]:id}}),eqName(id)+'을(를) 샀어요!'); haptic(14); }); };
  const startPaint=()=>{ if(!mine) return; if(mine.hallLv<3){ c.notify('바닥 브러시는 성 Lv.3부터예요','err'); return; } setMode('paint'); setSel(null); setCard(null); setLm(null); const L=myL(); if(L) S.current.jump(L.cx+2,L.cy+2,.8); };
  const paintAt=(tx,ty,T)=>{ const L=myL(); if(!L||!T||T.isl!==c.uid||T.t==='bridge') return; const b0=pbR.current; const B=W_BRUSH[b0]; if(B&&B.g&&!(mine.own||{})['br_'+b0]){ c.notify(B.n+' 브러시를 먼저 사요 (골드 '+B.g+')','err'); return; } const k=(tx-L.cx)+'_'+(ty-L.cy); save({['paint.'+k]:b0==='grass'?null:b0}); haptic(4); };
  const startLand=()=>{ if(!mine) return; setMode('land'); setSel(null); setCard(null); setLm(null); setLsel(null); setHint(false); const L=myL(); if(L) S.current.jump(L.cx+2,L.cy+2,.72); };
  const endLand=()=>{ setMode('view'); setLsel(null); };
  /* 탭 처리 */
  useEffect(()=>{ const s=S.current; if(!s) return;
    s.onTap=(tx,ty,T,sx,sy)=>{
      const L=myL();
      if(mode==='paint'){ paintAt(tx,ty,T); return; }
      if(mode==='land'){ const k=tx+','+ty; const o=landC.find(x=>x.k===k); if(o){ const n=mine.land.length; setLsel({...o,cost:o.steal?wStealCost(n):wLandCost(n)}); haptic(6); } else setLsel(null); return; }
      if(mode==='place'||mode==='move'){ if(!L||!T||T.isl!==c.uid) return; setGhost(g=>{ if(!g) return g; const [w,h]=wSz(g); const lx=tx-L.cx-Math.floor((w-1)/2), ly=ty-L.cy-Math.floor((h-1)/2); return {...g,gx:L.cx+lx,gy:L.cy+ly,lx,ly,ok:freeAt(lx,ly,mode==='move'&&sel?sel.i:null,g)}; }); haptic(4); return; }
      const nh=(s.npcHit||[]).filter(h=>Math.hypot(h.x-sx,h.y-sy)<h.r).sort((a,b)=>Math.hypot(a.x-sx,a.y-sy)-Math.hypot(b.x-sx,b.y-sy))[0]; if(nh){ talkNpc(nh.id); return; }
      const hit=(s.lmHit||[]).filter(h=>Math.hypot(h.x-sx,h.y-sy)<h.r).sort((a,b)=>Math.hypot(a.x-sx,a.y-sy)-Math.hypot(b.x-sx,b.y-sy))[0];
      if(hit){ openLm(hit.k); return; }
      const lmT=W_LM.find(l=>tx>=l.x&&tx<=l.x+2&&ty>=l.y&&ty<=l.y+2); if(lmT){ openLm(lmT.k); return; }
      if(T&&T.isl&&T.isl!=='center'){ const I0=isl.find(x=>x.uid===T.isl); const L0=I0&&s.W.L.find(l=>l.uid===I0.uid); const fp=L0&&I0.items.find(x=>x.t==='farm'&&x.x===tx-L0.cx&&x.y===ty-L0.cy); if(fp){ farmTap(I0,fp,tx,ty); return; } }
      if(T&&T.isl===c.uid&&mine&&L){ const lx=tx-L.cx, ly=ty-L.cy; const it=mine.items.find(x=>wCells(x).some(([a,b])=>a===lx&&b===ly)); const ob=wObstacles(mine,c.uid).find(o=>o.x===lx&&o.y===ly);
        if(it){ if(it.t==='mine'&&it.lv>=1&&!(it.up&&it.up.end>Date.now())&&wMineStock(it,Date.now())>=1&&(!sel||sel.i!==it.i)){ collect(it); } setSel({i:it.i}); setCard(null); setLm(null); haptic(8); return; }
        if(ob){ setSel({ob:ob.k}); setCard(null); setLm(null); haptic(8); return; } }
      setSel(null); setLm(null);
      if(T){ const owner=isl.find(I=>I.uid!==c.uid&&T.isl===I.uid); setCard(null); if(owner){ const p=s.ospot[owner.uid]; if(p&&Math.hypot(p[0]-tx,p[1]-ty)<1.6) setCard(owner.uid); } }
      s.follow=true; s.go(tx,ty);
    }; });

  /* 행동 */
  const bricks=mine?mine.bricks:0; const coins=coinsOf(c.me); const gold=wGoldOf(mine);
  const onSocial=()=>{ const s=S.current; if(!s) return false; const T0=s.W.T.get(Math.round(s.me.x)+','+Math.round(s.me.y)); return !!(T0&&T0.isl==='center'); };
  const builders=mine?wBuilders(mine):1, busy=mine?wBusy(mine,now):0;
  const pay=(cost,cb)=>{ if(cost.b&&bricks<cost.b){ c.notify('벽돌이 '+(cost.b-bricks)+'개 모자라요. 벽돌 공방에서 모아 보세요.','err'); return; }
    if(cost.g){ if(gold<cost.g){ c.notify('골드가 '+(cost.g-gold).toLocaleString()+' 모자라요. 의뢰 · 수확 · 던전에서 모아 보세요.','err'); return; } c.worldGold(-cost.g).then(ok=>{ if(ok) cb(); }); return; }
    if(cost.d){ if(!onSocial()){ c.notify('D-Coin 스페셜은 소셜 아일랜드 부티크에서만 살 수 있어요.','err'); return; } if(coins<cost.d){ c.notify('D-Coin이 '+(cost.d-coins)+'개 모자라요.','err'); return; } c.worldCoins(-cost.d).then(ok=>{ if(ok) cb(); }); return; } cb(); };
  const collect=it=>{ const st0=wMineStock(it,Date.now()); if(st0<1) return; const st=Math.round(st0*(1+lifePerk(rpg,'bd',mine))); const items=mine.items.map(x=>x.i===it.i?{...x,c:Date.now()}:x); save(mark('col',{items,bricks:bricks+st})); haptic(12); wQ('col');
    const s=S.current, L=myL(); if(s&&L){ const el=document.querySelector('.wb20-res .bk'); const r=el?el.getBoundingClientRect():{left:30,top:40,width:20,height:20}; s.fx.push({k:'bricks',gx:L.cx+it.x+.5,gy:L.cy+it.y+.5,at:performance.now(),tx:r.left+r.width/2,ty:r.top+r.height/2}); s.fx.push({k:'txt',gx:L.cx+it.x+.5,gy:L.cy+it.y+.5,at:performance.now(),txt:'+'+st,ic:'brick'}); } };
  const startPlace=(t,isGift)=>{ if(!mine) return; const C=W_CAT[t]; const hl=mine.hallLv;
    if(isGift){ const sh={t}; const f=findFree(sh); if(!f){ c.notify('놓을 빈 땅이 없어요. 땅을 넓히거나 장애물을 치워 보세요.','err'); return; } const [lx,ly]=f; const L=myL(); setShop(false); setSel(null); setLm(null); setMode('place'); setGhost({t,gx:L.cx+lx,gy:L.cy+ly,lx,ly,ok:true,gift:true}); S.current.jump(L.cx+lx+1,L.cy+ly+1); return; }
    if(wCount(mine,t)>=wMaxOf(t,hl)){ c.notify(C.req&&hl<C.req?'섬 본부 '+C.req+'레벨이 필요해요.':'지금은 더 지을 수 없어요. 본부를 올려 보세요.','err'); return; }
    if(C.cat==='xmas'&&!wXmas()){ c.notify('연말 장식은 시즌(11/15 ~ 1/6)에만 지을 수 있어요.','err'); return; }
    if((C.cat==='deco'||C.cat==='gem'||C.cat==='xmas')&&wDecoCount(mine)>=W_DECO_MAX[hl]){ c.notify('장식은 본부 '+hl+'레벨에서 '+W_DECO_MAX[hl]+'개까지예요.','err'); return; }
    if(C.time&&busy>=builders){ c.notify('건축가가 모두 일하는 중이에요. 끝나거나 시간을 단축하면 지을 수 있어요.','err'); return; }
    if(C.b&&bricks<C.b){ c.notify('벽돌이 '+(C.b-bricks)+'개 모자라요.','err'); return; } if(C.d&&!onSocial()){ c.notify('D-Coin 스페셜은 소셜 아일랜드 부티크에서만 살 수 있어요. 소셜 아일랜드로 가 보세요!','err'); return; } if(C.d&&coins<C.d){ c.notify('D-Coin이 '+(C.d-coins)+'개 모자라요.','err'); return; }
    const sh={t}; const f=findFree(sh); if(!f){ c.notify('놓을 빈 땅이 없어요. 땅을 넓히거나 장애물을 치워 보세요.','err'); return; } const [lx,ly]=f; const L=myL(); setShop(false); setSel(null); setLm(null); setMode('place'); setGhost({t,gx:L.cx+lx,gy:L.cy+ly,lx,ly,ok:true});
    S.current.jump(L.cx+lx+1,L.cy+ly+1); };
  const confirmPlace=()=>{ const gh=ghost; if(!gh||!gh.ok) return; const C=W_CAT[gh.t];
    if(mode==='move'){ const items=mine.items.map(x=>x.i===sel.i?{...x,x:gh.lx,y:gh.ly,r:gh.r?1:0}:x); save({items}); S.current.pop[sel.i]=performance.now(); setMode('view'); setGhost(null); haptic(10); return; }
    if(gh.gift){ c.takeWorldGift({item:gh.t}).then(ok=>{ if(!ok){ c.notify('선물함에 그 장식이 없어요.','err'); return; } const id=gh.t+Date.now().toString(36); const rr0=gh.r?{r:1}:{};
        save({items:[...mine.items,{i:id,t:gh.t,x:gh.lx,y:gh.ly,lv:1,...rr0}]},wName(gh.t)+'을(를) 놓았어요!'); const s=S.current; const [w,h]=wSz(gh); s.pop[id]=performance.now(); s.fx.push({k:'burst',gx:gh.gx+(w-1)/2,gy:gh.gy+(h-1)/2,at:performance.now()}); setMode('view'); setGhost(null); setSel({i:id}); haptic(14); wQ('build'); }); return; }
    pay({b:C.b||0,d:C.d||0},()=>{ const id=gh.t+Date.now().toString(36); const t=Date.now(); const rr0=gh.r?{r:1}:{};
      const it=C.time?{i:id,t:gh.t,x:gh.lx,y:gh.ly,lv:0,...rr0,up:{to:1,st:t,end:t+C.time*1000}}:{i:id,t:gh.t,x:gh.lx,y:gh.ly,lv:1,...rr0};
      if(gh.t==='mine'&&!C.time) it.c=t; if(gh.t==='carp') it.c=t+(C.time||0)*1000;
      save({items:[...mine.items,it],bricks:bricks-(C.b||0)},C.time?wName(gh.t)+' 공사를 시작했어요!':null);
      const s=S.current; const [w,h]=wSz(gh); s.pop[id]=performance.now(); s.fx.push({k:'dust',gx:gh.gx+(w-1)/2,gy:gh.gy+(h-1)/2,at:performance.now()}); if(!C.time) s.fx.push({k:'burst',gx:gh.gx+(w-1)/2,gy:gh.gy+(h-1)/2,at:performance.now()});
      setMode('view'); setGhost(null); setSel({i:id}); haptic(14); wQ('build'); }); };
  const cancelPlace=()=>{ setMode('view'); setGhost(null); };
  const rotGhost=()=>setGhost(g0=>{ if(!g0) return g0; const n={...g0,r:!g0.r}; n.ok=freeAt(n.lx,n.ly,mode==='move'&&sel?sel.i:null,n); return n; });
  const selIt=sel&&sel.i&&mine?mine.items.find(x=>x.i===sel.i):null;
  const selOb=sel&&sel.ob&&mine?wObstacles(mine,c.uid).find(o=>o.k===sel.ob):null;
  const canRot=t=>{ const s0=W_SZ[t]; return !!s0&&s0[0]!==s0[1]; };
  const rotate=it=>{ const n={...it,r:it.r?0:1}; if(!freeAt(it.x,it.y,it.i,n)){ c.notify('돌릴 자리가 없어요. 옮기기로 자리를 바꿔 보세요.','err'); return; } save({items:mine.items.map(x=>x.i===it.i?n:x)}); S.current.pop[it.i]=performance.now(); haptic(8); };
  const upgrade=it=>{ const C=W_CAT[it.t]; const to=it.lv+1; const cost=C.up[to], tm=C.ut[to];
    if(it.t!=='hall'&&C.lvMax>1&&to>mine.hallLv){ c.notify('섬 본부를 Lv.'+to+'로 먼저 올려 주세요.','err'); return; }
    if(busy>=builders){ c.notify('건축가가 모두 일하는 중이에요.','err'); return; }
    const uss=(C.uss&&C.uss[to])||0; if(uss&&(rpg.ss||0)<uss){ c.notify('본부 Lv.'+to+'에는 정령석 '+uss+'개가 필요해요 (지금 '+(rpg.ss||0)+'개) · 디코아 사당 · 수호자에서 얻어요','err'); return; }
    pay({b:cost,g:(C.ug&&C.ug[to])||0},()=>{ if(uss) c.saveRpg(r=>({ss:Math.max(0,(r.ss||0)-uss)})); const t=Date.now(); const items=mine.items.map(x=>x.i===it.i?{...x,up:{to,st:t,end:t+tm*1000},...(x.t==='mine'||x.t==='carp'?{c:t}:{})}:x);
      const extra=it.t==='mine'?wMineStock(it,t):0;
      save({items,bricks:bricks-cost+extra},wName(it.t)+' Lv.'+to+' 업그레이드를 시작했어요!'); setInfo(null); haptic(14);
      const L=myL(); if(L) S.current.fx.push({k:'dust',gx:L.cx+it.x,gy:L.cy+it.y,at:performance.now()}); }); };
  const speed=async it=>{ const rem=(it.up.end-Date.now())/1000; const g=wSpeedCost(rem)*W_GOLD_RATE;
    if(!(await dkoAsk('골드 '+g.toLocaleString()+'으로 남은 '+wFmtT(rem)+'을(를) 바로 끝낼까요?'))) return;
    pay({g},()=>{ const items=mine.items.map(x=>x.i===it.i?{...x,up:{...x.up,end:Date.now()-1}}:x); save({items}); }); };
  const remove=async it=>{ const C=W_CAT[it.t]; if(C.cat!=='deco'&&C.cat!=='gem'&&C.cat!=='xmas'&&it.t!=='farm') return; if(it.t==='farm'&&wPlotOf(mine,it.i)&&!(await dkoAsk('작물이 자라고 있어요. 텃밭을 치우면 작물도 사라져요. 그래도 치울까요?'))) return; if(!(await dkoAsk(wName(it.t)+'을(를) 치울까요? '+(C.b?'벽돌 '+Math.floor(C.b/2)+'개를 돌려받아요.':'스페셜 장식은 돌려받을 수 없어요.')))) return;
    save({items:mine.items.filter(x=>x.i!==it.i),bricks:bricks+(C.b?Math.floor(C.b/2):0)}); const L=myL(); if(L) S.current.fx.push({k:'dust',gx:L.cx+it.x,gy:L.cy+it.y,at:performance.now()}); setSel(null); };
  const clearOb=o=>{ if(mine.clr&&mine.clr.end>Date.now()){ c.notify('지금 다른 장애물을 치우는 중이에요.','err'); return; } const ob=W_OB[o.t];
    pay({b:ob.cost},()=>{ save(mark('ob',{bricks:bricks-ob.cost,clr:{k:o.k,t:o.t,end:Date.now()+W_OB_TIME}})); setSel(null); haptic(10); }); };
  const expand=()=>{ setInfo(null); startLand(); };
  const landN=mine?mine.land.length:0, landMax=mine?W_LAND_MAX[Math.min(10,mine.hallLv)]:0;
  const buyLand=async o=>{ if(!o||!mine) return; if(landN>=landMax){ c.notify('본부 Lv.'+mine.hallLv+'에서는 땅을 '+landMax+'칸까지 넓힐 수 있어요. 본부를 올려 보세요.','err'); return; }
    const cost=o.steal?wStealCost(landN):wLandCost(landN); const owner=o.steal&&isl.find(I=>I.uid===o.steal);
    const ssN=wLandSS(landN); if(ssN&&(rpg.ss||0)<ssN){ c.notify('땅을 '+W_LAND_SS_FROM+'칸 넘게 넓히려면 칸마다 정령석이 1개 필요해요 · 디코아 사당 · 수호자 · 전망대에서 얻어요','err'); return; }
    if(o.steal&&!(await dkoAsk((owner?owner.name:'이웃 섬')+'의 가장자리 한 칸을 벽돌 '+cost.toLocaleString()+'개에 살까요? 판 사람은 절반을 벽돌로 받아요.'))) return;
    const L=myL(); if(!L) return; const k=(o.x-L.cx)+','+(o.y-L.cy);
    pay({b:cost},()=>{ const e={k,at:Date.now()}; if(o.steal){ e.from=o.steal; e.p=cost; } if(ssN) c.saveRpg(r=>({ss:Math.max(0,(r.ss||0)-ssN)}));
      save({land:[...mine.land,e],bricks:bricks-cost},o.steal?(owner?owner.name:'이웃 섬')+'에서 땅 한 칸을 샀어요!':'땅이 한 칸 넓어졌어요!');
      const s=S.current; s.trise[o.k]=performance.now(); s.fx.push({k:'burst',gx:o.x,gy:o.y,at:performance.now()+300}); setLsel(null); haptic(16); }); };
  const rename=()=>{ const v=(nm||'').trim().slice(0,14); if(!v) return; save({name:v},'섬 이름을 바꿨어요.'); setNm(null); };
  const locName=h=>{ const s=S.current; if(!h||!s) return ''; if(h.zone&&DG[h.zone]) return DG[h.zone].n+'에서 사냥 중'; const T=s.W.T.get(Math.round(h.x)+','+Math.round(h.y)); const l=W_LM.find(l=>Math.hypot(l.x+1-h.x,l.y+1-h.y)<3.6); if(l) return l.n+' 앞';
    if(!T) return '바다 위'; if(T.isl==='center') return '소셜 아일랜드'; if(!T.isl) return '다리 위'; if(T.isl===c.uid) return '내 섬'; const o=isl.find(I=>I.uid===T.isl); return o?o.name:'크루 섬'; };

  const cs=card&&isl.find(x=>x.uid===card); const cm=card&&c.members.find(x=>x.uid===card);
  const C0d=selIt&&W_CAT[selIt.t]; const inProg=selIt&&selIt.up&&selIt.up.end>now;
  const canUp=selIt&&C0d&&C0d.lvMax>1&&selIt.lv<C0d.lvMax&&!inProg&&selIt.lv>=1;
  const lmD=lm&&W_LM.find(x=>x.k===lm);
  const totStock=mine?mine.items.filter(it=>it.t==='mine'&&!(it.up&&it.up.end>now)).reduce((s0,it)=>s0+wMineStock(it,now),0):0;
  const meHere=S.current?{x:S.current.me.x,y:S.current.me.y}:null;
  const mailN=wMailList(rpg,mine).length;
  const sheetOpen=!!(shop||ppl||msn||rank||wset||edit||info||cedit||hallIn||gd||gbk||qs||mapO||bag||sty||meO||mailO);
  const atHome=(()=>{ const s=S.current; if(!s||!s.W) return false; const T0=s.W.T.get(Math.round(s.me.x)+','+Math.round(s.me.y)); return !!(T0&&T0.isl===c.uid); })();
  const cookOk=atHome&&mine&&mine.items.some(x=>(x.t==='pot'||x.t==='potion')&&x.lv>=1)?{pot:mine.items.some(x=>x.t==='pot'&&x.lv>=1),potion:mine.items.some(x=>x.t==='potion'&&x.lv>=1)}:null;
  const tradeDone=O=>{ save({tb:{w:O.w,done:1}}); };
  useEffect(()=>{ if(mine&&!mine.futureHooks) save({futureHooks:W_FUTURE_HOOKS}); },[!!mine]);
  const smithOk=(()=>{ const s=S.current; if(!s||!s.W) return false; const T0=s.W.T.get(Math.round(s.me.x)+','+Math.round(s.me.y)); return !!(T0&&(T0.isl==='center'||T0.isl===c.uid)); })();
  const spendBricks=n=>{ if(!mine||bricks<n){ c.notify('벽돌이 '+(n-(bricks||0))+'개 모자라요','err'); return false; } save({bricks:bricks-n}); return true; };
  const G0=gearOf(rpg); const wNow=gFind(G0,G0.eq.w); const durLow=!!(wNow&&wNow.d<=gDurMax(wNow)*.2);
  return ReactDOM.createPortal(html`<div className="wb20">
    <canvas ref=${cv} className="wb20-cv" aria-label="DKO 월드"></canvas>
    ${!dg?html`<div className="wt69">
      <button className="wt69-b tap" onClick=${leave} aria-label="나가기"><${Icon} n="chevL" s=${20} w=${2.6}/></button>
      <button className="wq78-me tap" onClick=${()=>{ closeAll(); setMeO(true); haptic(6); }} aria-label="내 정보"><span className="wq78-av"><${PfpView} m=${c.me} s=${38}/><i className="wq78-xp"><i style=${{width:Math.min(100,rpg.xp/rpgNeed(rpg.lv)*100)+'%'}}></i></i></span><em className="wq78-lv">${rpg.lv}</em>${mailN?html`<i className="wq29-ml">${mailN}</i>`:null}<span className="wq78-nm"><b>${dispName(c.me)}</b><small>Lv.${rpg.lv} 모험가</small></span></button>
      <div className="wb20-res wt69-r">
        <span className="gd" onClick=${()=>{ closeAll(); setShop(true); haptic(6); }}>${(rpg.ss||0)>0?html`<span className="ss29" title="정령석" onClick=${e=>{ e.stopPropagation(); closeAll(); setStab('ss'); setShop(true); haptic(6); }}><${SsIc} s=${15}/><b>${rpg.ss}</b></span>`:null}<${GoldIc} s=${18}/><b>${gold>=100000?Math.floor(gold/1000).toLocaleString()+'K':gold.toLocaleString()}</b><i className="wq78-plus">+</i></span>
        ${mode==='view'?html`<button className="wml83-btn tap" onClick=${()=>{ closeAll(); setMailO(true); haptic(6); }} aria-label="우편함"><${Icon} n="mail" s=${17} w=${2.3}/>${mailN?html`<em>${mailN}</em>`:null}</button>`:null}
        ${edit||mode!=='view'||shop?html`<span className="bk wt77-in"><${BrickIc} s=${16}/><b>${bricks.toLocaleString()}</b></span><span className="bd wt77-in" title="건축가"><${Icon} n="tool" s=${13} w=${2.4}/><b>${builders-busy}/${builders}</b></span>`:null}
      </div>
    </div>`:null}
    ${!dg?html`<${WDyn} c=${c} area=${locName(meHere)||'DKO 월드'} sub=${((h=>h>=19||h<6?'밤':h>=17?'노을':'낮')(new Date().getHours()))+(xmOn?' · 연말':'')+' · '+(online.length+1)+'명'} hidden=${sheetOpen} wide=${mm==='off'} onIdle=${()=>{ closeAll(); setMapO(true); }}/>`:null}
    ${!dg&&mine&&!sheetOpen&&mode==='view'?html`<${WQTrack} I=${mine} tab=${qtab} setTab=${setQtab} onOpen=${()=>{ closeAll(); setQs(true); }}/>`:null}
    ${!dg?html`<button className=${'wq79-bag tap nomap'+(durLow?' warn':'')} onClick=${()=>{ closeAll(); setBag('bag'); haptic(6); }} aria-label="가방"><${Icon} n="bag" s=${20} w=${2.3}/>${durLow?html`<i className="dot"></i>`:null}<small>가방</small></button>`:null}
    ${!dg?html`<div className="wr69 up">
      <${WMapBtn} S=${S} ready=${myReady} n=${online.length+1} onOpen=${()=>{ closeAll(); setMapO(true); haptic(8); }}/>
      <button className="wr69-b tap" style=${{'--b1':'#FFB06A','--b2':'#E8640A'}} onClick=${()=>{ closeAll(); setPtyO(true); haptic(6); }} aria-label="파티"><${Icon} n="users" s=${19} w=${2.3}/>${(()=>{ const P0=wMyParty(c); return P0?html`<em className="on">${(P0.participants||[]).length}</em>`:null; })()}<small>파티</small></button>
      <button className="wr69-b tap" style=${{'--b1':'#FFE066','--b2':'#F29A12','--bt':'#4A2A00'}} onClick=${()=>{ closeAll(); setQs(true); haptic(6); }} aria-label="주민 의뢰"><${Icon} n="scroll" s=${19} w=${2.3}/>${qReady?html`<i className="dot"></i>`:null}<small>의뢰</small></button>
      <button className="wr69-b tap" style=${{'--b1':'#8CF06A','--b2':'#2FA83E'}} onClick=${()=>{ closeAll(); setMsn(true); haptic(6); }} aria-label="오늘의 섬 미션"><${Icon} n="target" s=${19} w=${2.3}/>${mine&&!dayD(mine).got&&['col','ob','visit'].every(k=>dayD(mine)[k])?html`<i className="dot"></i>`:null}<small>미션</small></button>
      <button className="wr69-b tap" style=${{'--b1':'#C59BFF','--b2':'#7044E0'}} onClick=${()=>{ closeAll(); setRank(true); haptic(6); }} aria-label="랭킹"><${Icon} n="trophy" s=${19} w=${2.3}/>${recGain>0?html`<i className="dot"></i>`:null}<small>랭킹</small></button>
      <button className="wr69-b tap" style=${{'--b1':'#FF9A7A','--b2':'#D8343E'}} onClick=${()=>{ closeAll(); setRaidO(true); haptic(6); }} aria-label="약탈 · 방어"><${Icon} n="swords" s=${19} w=${2.3}/>${mine&&mine.rNew?html`<em className="on">${mine.rNew}</em>`:null}<small>약탈</small></button>
      <button className="wr69-b tap" style=${{'--b1':'#C9D3E6','--b2':'#7C89A8'}} onClick=${()=>{ closeAll(); setWset(true); haptic(6); }} aria-label="월드 설정"><${Icon} n="gear" s=${19} w=${2.3}/><small>설정</small></button>
    </div>`:null}
    <${WKeys} on=${mode==='view'&&!dg&&!sheetOpen&&!ew} onMove=${(x,y)=>{ const s=S.current; if(s) s.joy=[x,y]; }} onKey=${onKey}/>
    ${mode==='view'&&!sel&&!lm&&!dg?html`<div className="wd26">
      <div className="wd82-row">${totStock>=1||myReady.length?html`<button className="wd26-col tap" onClick=${()=>collectAll()}><${Icon} n="sprout" s=${16} w=${2.4}/>모두 모으기 <b>${[totStock?'벽돌 +'+totStock:null,myReady.length?'작물 '+myReady.length:null].filter(Boolean).join(' · ')}</b></button>`:null}</div>
      <div className="wd26-bar">
        <button className="wd26-b tap" style=${{'--b1':'#FF8FB8','--b2':'#E0407A'}} onClick=${()=>{ closeAll(); if(giftN) setStab('gift'); setShop(true); haptic(8); }}><span className="wd26-i"><${Icon} n="bag" s=${20} w=${2.2}/>${giftN?html`<em className="wd26-gf">${giftN}</em>`:null}</span><small>상점</small></button>
        <button className="wd26-b tap" style=${{'--b1':'#9CEB6A','--b2':'#3AA83A'}} onClick=${()=>{ closeAll(); setGd(true); haptic(6); }}><span className="wd26-i"><${Icon} n="sprout" s=${20} w=${2.2}/>${myReady.length?html`<em className="wd26-on">${myReady.length}</em>`:null}</span><small>텃밭</small></button>
        <button className="wd26-shop tap" onClick=${()=>{ goMine(); haptic(10); }}><span className="wd26-si"><${Icon} n="home" s=${30} w=${2.3}/></span><b>내 섬</b></button>
        <button className="wd26-b tap" style=${{'--b1':'#7CD0FF','--b2':'#2F7FE6'}} onClick=${()=>{ closeAll(); setEdit('menu'); haptic(6); }}><span className="wd26-i"><${Icon} n="edit" s=${19} w=${2.2}/></span><small>편집</small></button>
        <button className=${'wd26-b tap'+(chat?' on':'')} style=${{'--b1':'#B9A2FF','--b2':'#6C4BDB'}} onClick=${()=>{ setChat(!chat); haptic(6); }}><span className="wd26-i"><${Icon} n="chat" s=${20} w=${2.2}/></span><small>채팅</small></button>
      </div>
    </div>`:null}
    ${chat&&mode==='view'&&!dg?html`<${WChat} c=${c} onSay=${sendSay} onSticker=${sendStk} onClose=${()=>setChat(false)} where=${(online.length+1)+'명 · 말풍선으로 떠요'}/>`:null}
    ${ctl==='joy'&&mode==='view'&&!dg&&!chat&&!hallIn&&!sel&&!lm&&!cs&&!sheetOpen&&!ew?html`<${Joy} onMove=${(x,y)=>{ const s=S.current; if(s) s.joy=[x,y]; }}/>`:null}
    ${near&&mode==='view'&&!dg&&!lm&&!sel&&!chat?(()=>{ const l=W_LM.find(x=>x.k===near); return l?html`<button className="wnr30 tap" key=${l.k} style=${{'--g1':l.c[0],'--g2':l.c[1]}} onClick=${()=>enterLm(l)}><span className="gi30"><${Icon} n=${l.ic} s=${18} w=${2.3}/></span><b>${l.n}</b><em>${l.dg?'포털 타기':'들어가기'}<${Icon} n="chev" s=${14} w=${2.8}/></em></button>`:null; })():null}
    ${npcT&&mode==='view'&&!wset&&!chat&&!shop&&!edit&&!ppl&&!msn&&!rank&&!hallIn&&!cedit&&!info?(()=>{ const D=W_NPC.find(x=>x.id===npcT.id); return D?html`<div className="wnp30" key=${npcT.k} style=${{'--n':D.c}} onClick=${()=>talkNpc(D.id)}><span className="wnp30-n">${D.n}</span><p>${npcT.t}</p><small>눌러서 다음 이야기</small><button className="wnp97-ai tap" onClick=${e=>{ e.stopPropagation(); setNpcT(null); setNpcAi(D.id); }}><${Icon} n="chat" s=${13} w=${2.6}/>대화하기</button><button className="tap" onClick=${e=>{ e.stopPropagation(); setNpcT(null); }} aria-label="닫기"><${Icon} n="x" s=${14} w=${2.8}/></button></div>`:null; })():null}
    ${wset?html`<${WSet} onClose=${()=>setWset(false)}/>`:null}
    ${door?html`<${WDoor} l=${door}/>`:null}
    ${hallIn?html`<${HallRoom} c=${c} I=${mine} onClose=${()=>setHallIn(false)}/>`:null}
    ${edit==='menu'?html`<div className="wb20-shade" onClick=${()=>setEdit(null)}><div className="wbs we26" onClick=${e=>e.stopPropagation()}>
      <div className="wbs-h"><b>편집</b><span className="wbs-sub">내 땅 또는 캐릭터</span><button className="wbi-x tap" onClick=${()=>setEdit(null)} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
      <div className="we26-g">
        <button className="we26-c tap ch" onClick=${()=>{ setEdit(null); setCedit('eq'); }}><span className="gi30" style=${{'--g1':'#FFB15C','--g2':'#E8420A'}}><${Icon} n="sword" s=${24} w=${2.2}/></span><b>캐릭터 · 가방</b><small>스킨 · 무기 7종 · 방어구 · 대장간</small></button>
        <button className="we26-c tap" onClick=${()=>{ setEdit(null); startLand(); }}><span className="gi30" style=${{'--g1':'#8EE06A','--g2':'#2F9A3A'}}><${Icon} n="expand" s=${22} w=${2.2}/></span><b>땅 넓히기</b><small>바다 · 이웃 가장자리</small></button>
        <button className="we26-c tap" onClick=${()=>{ setEdit(null); setStab('build'); setShop(true); }}><span className="gi30" style=${{'--g1':'#7CC2FF','--g2':'#2563EB'}}><${Icon} n="tool" s=${22} w=${2.2}/></span><b>짓기 · 꾸미기</b><small>건물 · 장식 놓기</small></button>
        <button className="we26-c tap" onClick=${()=>{ setEdit(null); goMine(); const h=mine&&mine.items.find(x=>x.t==='hall'); if(h){ setSel({i:h.i}); setInfo({i:h.i}); } }}><span className="gi30" style=${{'--g1':'#C29BFF','--g2':'#6A3FD8'}}><${Icon} n="home" s=${22} w=${2.2}/></span><b>내 섬 정보</b><small>본부 · 섬 이름</small></button>
        <button className="we26-c tap" onClick=${()=>{ setEdit(null); setGd(true); }}><span className="gi30" style=${{'--g1':'#B6EE7A','--g2':'#3E9A2A'}}><${Icon} n="sprout" s=${22} w=${2.2}/></span><b>텃밭</b><small>씨앗 심기 · 수확</small></button>
        <button className="we26-c tap" onClick=${()=>{ setEdit(null); setSty(true); }}><span className="gi30" style=${{'--g1':'#FF9FCB','--g2':'#D02A7A'}}><${Icon} n="palette" s=${22} w=${2.2}/></span><b>섬 꾸미기</b><small>바닥 브러시 · 환경 테마 · 성 스킨</small></button>
        <button className="we26-c tap" onClick=${()=>{ setEdit(null); setGbk(c.uid); }}><span className="gi30" style=${{'--g1':'#E2C2FF','--g2':'#8A4FE0'}}><${Icon} n="book" s=${22} w=${2.2}/></span><b>내 방명록</b><small>발자국 · 한마디</small></button>
        <button className="we26-c tap" onClick=${()=>{ setEdit(null); setHallIn(true); }}><span className="gi30" style=${{'--g1':'#FFD27A','--g2':'#E0731A'}}><${Icon} n="exit" s=${22} w=${2.2}/></span><b>마을회관 들어가기</b><small>트로피 · 장비 · 섬 기록</small></button>
      </div></div></div>`:null}
    ${cedit?html`<${CharEdit} c=${c} tab=${cedit} onBag=${()=>setBag('bag')} onClose=${()=>setCedit(null)}/>`:null}
    ${meO&&!dg?html`<${WMe} c=${c} I=${mine} onClose=${()=>setMeO(false)} onBag=${()=>setBag('bag')} mailN=${mailN} onMail=${()=>{ setMeO(false); setMailO(true); }}/>`:null}
    ${mailO&&!dg?html`<${WMail} c=${c} I=${mine} onClose=${()=>setMailO(false)}/>`:null}
    ${bag&&!dg?html`<${WBag} c=${c} startTab=${bag} smith=${smithOk} spendBricks=${spendBricks} onClose=${()=>setBag(null)} I=${mine} cookOk=${cookOk} onTrade=${tradeDone} onMap=${()=>setMapO(true)}/>`:null}
    ${sty&&mine&&!dg?html`<${WStyle} I=${mine} gold=${gold} hl=${mine.hallLv} say=${t=>c.notify(t)} onClose=${()=>setSty(false)} onBrush=${()=>{ setSty(false); startPaint(); }} onSave=${(kind,k,cost)=>{ const go=()=>{ save({[kind]:k,['own.'+kind+'_'+k]:true},(kind==='env'?W_ENV:W_HSK)[k].n+' 적용!'); haptic(12); }; if(cost){ if(gold<cost){ c.notify('골드가 '+(cost-gold).toLocaleString()+' 모자라요','err'); return; } c.worldGold(-cost).then(ok=>ok&&go()); } else go(); }}/>`:null}
    ${lmD&&mode==='view'?html`<div className="wlm26" key=${lmD.k} style=${{'--g1':lmD.c[0],'--g2':lmD.c[1]}}>
      <span className="gi30 wlm26-ic"><${Icon} n=${lmD.ic} s=${26} w=${2.2}/></span>
      <div className="wlm26-t"><em>DKO 월드 명소</em><b>${lmD.n}</b><small>${lmD.d}</small></div>
      <button className="wlm26-go tap" onClick=${()=>enterLm(lmD)}>들어가기</button>
      <button className="wlm26-x tap" onClick=${()=>setLm(null)} aria-label="닫기"><${Icon} n="x" s=${15} w=${2.8}/></button>
    </div>`:null}
    ${mode==='paint'?html`<div className="wl26 pt81"><div className="wl26-top"><span className="gi30 wl26-ti" style=${{'--g1':'#FF9FCB','--g2':'#D02A7A'}}><${Icon} n="palette" s=${18} w=${2.3}/></span><div className="wl26-tt"><b>바닥 칠하기</b><small>내 땅을 눌러서 칠해요 · 잔디는 지우개</small></div><button className="wl26-x tap" onClick=${()=>setMode('view')}>완료</button></div>
      <div className="wl26-bot"><div className="pt81-b">${Object.entries(W_BRUSH).map(([k,B])=>{ const has=!B.g||(mine&&(mine.own||{})['br_'+k]); return html`<button key=${k} className=${'tap'+(pb===k?' on':'')+(has?'':' lock')} style=${{'--c':B.c}} onClick=${()=>{ if(!has){ if(gold<B.g){ c.notify('골드가 '+(B.g-gold)+' 모자라요','err'); return; } c.worldGold(-B.g).then(ok=>{ if(ok){ save({['own.br_'+k]:true},B.n+' 브러시를 샀어요!'); setPb(k); } }); return; } setPb(k); haptic(5); }}><i></i><b>${B.n}</b>${has?null:html`<small>${B.g} G</small>`}</button>`; })}</div></div></div>`:null}
    ${mode==='land'?html`<div className="wl26">
      <div className="wl26-top"><span className="gi30 wl26-ti" style=${{'--g1':'#FFB15C','--g2':'#E8420A'}}><${Icon} n="expand" s=${18} w=${2.3}/></span><div className="wl26-tt"><b>땅 넓히기</b><small>내 땅 ${landN}/${landMax}칸 · 본부 Lv.${mine?mine.hallLv:1}</small></div><button className="wl26-x tap" onClick=${endLand}>완료</button></div>
      <div className="wl26-bot">${lsel?html`<div className=${'wl26-sel'+(lsel.steal?' st':'')} key=${lsel.k}>
          <div className="wl26-st"><b>${lsel.steal?((isl.find(I=>I.uid===lsel.steal)||{}).name||'이웃 섬')+' 가장자리':lsel.water?'바다 한 칸':'다리 한 칸'}</b><small>${lsel.steal?'이웃 땅이라 4배 비싸요 · 판 사람은 절반을 벽돌로 받아요':'내 땅과 맞닿은 곳만 넓힐 수 있어요'}</small></div>
          <button className=${'wl26-buy tap'+(bricks<lsel.cost||landN>=landMax?' off':'')} onClick=${()=>buyLand(lsel)}><${BrickIc} s=${18}/>${lsel.cost.toLocaleString()}${wLandSS(landN)?html`<i className="ss29-p"><${SsIc} s=${14}/>1</i>`:null}</button></div>`
        :html`<div className="wl26-tip"><span><i className="w"></i>바다 · 다리</span><span><i className="s"></i>이웃 섬 가장자리</span><small>빛나는 칸을 눌러 골라요 · 소셜 아일랜드와 본부 근처는 못 사요</small></div>`}</div>
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
        ${(selIt.t==='pot'||selIt.t==='potion')&&selIt.lv>=1&&!inProg?html`<button className="tap up" onClick=${()=>{ setSel(null); setBag('cook'); }}><i><${Icon} n="heart" s=${22} w=${2.3}/></i><small>${selIt.t==='pot'?'요리하기':'물약 만들기'}</small></button>`:null}
        ${selIt.t==='tbal'&&selIt.lv>=1&&!inProg?html`<button className="tap up" onClick=${()=>{ setSel(null); setBag('trade'); }}><i><${Icon} n="up2" s=${22} w=${2.3}/></i><small>무역 주문</small></button>`:null}
        ${selIt.t==='carp'&&selIt.lv>=1&&!inProg?html`<button className="tap" onClick=${()=>{ const t=Date.now(); const n=wCarpStock(selIt,t); if(!n){ c.notify('아직 가구 상자가 없어요 · 90분마다 하나씩 만들어져요'); return; } save({items:mine.items.map(x=>x.i===selIt.i?{...x,c:t}:x)}); carpGifts(n); }}><i><${Icon} n="gift" s=${22} w=${2.3}/></i><small>${wCarpStock(selIt,now)}/3</small></button>`:null}
        ${selIt.t==='hall'?html`<button className="tap up" onClick=${()=>{ setSel(null); setHallIn(true); }}><i><${Icon} n="exit" s=${22} w=${2.3}/></i><small>들어가기</small></button>`:null}
        ${selIt.t==='hall'&&!inProg?html`<button className="tap" onClick=${()=>{ setSel(null); startLand(); }}><i><${Icon} n="expand" s=${22} w=${2.3}/></i><small>땅 넓히기</small></button>`:null}
        ${canRot(selIt.t)&&!inProg?html`<button className="tap" onClick=${()=>rotate(selIt)}><i><${Icon} n="reset" s=${21} w=${2.4}/></i><small>돌리기</small></button>`:null}
        ${selIt.t!=='hall'&&!inProg?html`<button className="tap" onClick=${()=>{ setMode('move'); setGhost({t:selIt.t,lv:selIt.lv,r:!!selIt.r,gx:myL().cx+selIt.x,gy:myL().cy+selIt.y,lx:selIt.x,ly:selIt.y,ok:true}); }}><i><${Icon} n="move" s=${22} w=${2.3}/></i><small>옮기기</small></button>`:null}
        ${selIt.t==='farm'?html`<button className="tap up" onClick=${()=>{ const pid=selIt.i; closeAll(); setGd({pid}); }}><i><${Icon} n="sprout" s=${22} w=${2.4}/></i><small>${wPlotOf(mine,selIt.i)?'텃밭 보기':'씨앗 심기'}</small></button>`:null}${(C0d.cat==='deco'||C0d.cat==='gem'||C0d.cat==='xmas'||selIt.t==='farm')?html`<button className="tap red" onClick=${()=>remove(selIt)}><i><${Icon} n="trash" s=${20} w=${2.3}/></i><small>치우기</small></button>`:null}
      </div>
    </div>`:null}
    ${mode==='view'&&selOb?html`<div className="wb20-rib" key=${selOb.k}>
      <div className="wb20-rh"><b>${W_OB[selOb.t].n}</b><span className="wb20-busy">치우면 벽돌 ${W_OB[selOb.t].get[0]}~${W_OB[selOb.t].get[1]}개</span></div>
      <div className="wb20-rb">${mine.clr&&mine.clr.k===selOb.k?html`<span className="wb20-note">치우는 중…</span>`:html`<button className="tap up" onClick=${()=>clearOb(selOb)}><i><${Icon} n="axe" s=${22} w=${2.3}/></i><small><${BrickIc} s=${12}/>${W_OB[selOb.t].cost}</small></button>`}</div>
    </div>`:null}
    ${info&&mine?html`<${WInfo} c=${c} I=${mine} info=${info} now=${now} onClose=${()=>setInfo(null)} onUp=${upgrade} onExp=${expand} nm=${nm} setNm=${setNm} rename=${rename}/>`:null}
    ${shop&&mine?html`<${WShop} c=${c} I=${mine} tab=${stab} setTab=${setStab} gold=${gold} social=${onSocial()} onEx=${n=>c.exchangeGold(n)} onSocialGo=${()=>{ setShop(false); goCenter(); }} coins=${coins} busy=${busy} builders=${builders} onPick=${startPlace} onClose=${()=>setShop(false)} gift=${gift} rpg=${rpg} onEq=${buyGear} onBag=${()=>{ setShop(false); setBag('bag'); }}/>`:null}
    ${cs&&mode==='view'?(()=>{ const liked=!!(cs.likes||{})[c.uid]; const wp=cs.items.filter(it=>it.t==='farm'&&wCanWater(cs,it.i,c.uid,now)).map(it=>it.i); const gbN=Object.values(cs.gb||{}).filter(e=>e&&e.t).length; const ws=wWeekScore(cs);
      return html`<div className="wc69" key=${cs.uid} onClick=${e=>e.stopPropagation()}>
        <div className="wc69-h">${cm?html`<${PfpView} m=${cm} s=${44}/>`:null}<div className="wc69-t"><b>${cs.name}${topU===cs.uid?html`<em className="wc69-top"><${Icon} n="crown" s=${11} w=${2.6}/>이번 주 1위</em>`:null}</b><small>${cm?dispName(cm):''} · 본부 Lv.${cs.hallLv} · 이번 주 ${ws.sc}점</small></div>
          <button className="wc69-x tap" onClick=${()=>setCard(null)} aria-label="닫기"><${Icon} n="x" s=${16} w=${2.8}/></button></div>
        <div className="wc69-a">
          <button className=${'tap lk'+(liked?' on':'')} onClick=${()=>{ c.likeIsland(cs); if(!liked) wQ('like'); haptic(8); }}><${Icon} n="heart" s=${17} w=${2.4} fill=${liked?'currentColor':'none'}/><b>${Object.keys(cs.likes||{}).length}</b></button>
          <button className="tap gb" onClick=${()=>{ setCard(null); setGbk(cs.uid); }}><${Icon} n="book" s=${17} w=${2.3}/><b>방명록${gbN?' '+gbN:''}</b></button>
          <button className=${'tap wt'+(wp.length?'':' off')} onClick=${()=>waterPlots(cs,wp)}><${Icon} n="drop" s=${17} w=${2.3}/><b>물 주기${wp.length?' '+wp.length:''}</b></button>
          ${cm?html`<button className="tap pf" onClick=${()=>c.openProfile(cm.uid)} aria-label="프로필"><${Icon} n="user" s=${17} w=${2.3}/></button>`:null}
        </div></div>`; })():null}
    ${(mapO||ppl)?html`<${WMapSheet} S=${S} c=${c} ready=${myReady} quick=${quick} tab0=${ppl?'crew':'map'} crewN=${online.length+1} onClose=${()=>{ setMapO(false); setPpl(false); }} onGo=${mapGo}>
      <div className="wo26-pl">
        <button className="wo26-p tap" onClick=${()=>{ goCenter(); setPpl(false); setMapO(false); }}><span className="gi30" style=${{'--g1':'#FFD54A','--g2':'#E8900A'}}><${Icon} n="plaza" s=${18} w=${2.3}/></span><b>소셜 아일랜드</b></button>
        <button className="wo26-p tap" onClick=${()=>{ goMine(); setPpl(false); setMapO(false); }}><span className="gi30" style=${{'--g1':'#FFB15C','--g2':'#E8420A'}}><${Icon} n="home" s=${18} w=${2.3}/></span><b>내 섬</b></button>
        ${W_LM.map(l=>html`<button key=${l.k} className=${'wo26-p tap'+(l.dg?' dg':'')} onClick=${()=>{ setPpl(false); setMapO(false); if(l.dg) startDg(l.dg); else openLm(l.k); }}><span className="gi30" style=${{'--g1':l.c[0],'--g2':l.c[1]}}><${Icon} n=${l.ic} s=${18} w=${2.3}/></span><b>${l.n.replace(' 포털','')}</b>${l.dg?html`<em>${DG[l.dg].lv>1?'Lv.'+DG[l.dg].lv+'+':'쉬움'}</em>`:null}</button>`)}
      </div>
      <div className="wo26-sec">지금 접속 중</div>
      <div className="wo26-l">
        <div className="wo26-r me"><span className="wo26-av"><${PfpView} m=${c.me} s=${40}/><i></i></span><span className="wo26-t"><b>${dispName(c.me)}<em>나</em></b><small>${locName(meHere)}</small></span></div>
        ${online.map(I=>{ const m=c.members.find(x=>x.uid===I.uid); if(!m) return null; return html`<div key=${I.uid} className="wo26-r"><span className="wo26-av"><${PfpView} m=${m} s=${40}/><i></i></span><span className="wo26-t"><b>${dispName(m)}${ptyS.has(I.uid)?html`<em className="wo26-pt">파티</em>`:null}</b><small>${locName(I.here)}</small></span>
          ${I.here.zone?html`<button className="wo26-go tap" onClick=${()=>{ setPpl(false); setMapO(false); startDg(I.here.zone); }}>따라가기</button>`:html`<button className="wo26-go tap" onClick=${()=>{ S.current.jump(I.here.x+1,I.here.y+1,1.1); setPpl(false); setMapO(false); setLm(null); setSel(null); }}>옆으로</button>`}
          <button className="wo26-go alt tap" onClick=${()=>{ goIsland(I.uid); setPpl(false); setMapO(false); }}>섬 가기</button></div>`; })}
        ${!online.length?html`<p className="wo26-none">지금은 나만 있어요. 크루원이 들어오면 여기 바로 보여요.</p>`:null}
      </div>
      <div className="wo26-sec">크루 섬 둘러보기</div>
      <div className="wo26-l">${isl.filter(I=>I.uid!==c.uid&&!online.some(o=>o.uid===I.uid)).map(I=>{ const m=c.members.find(x=>x.uid===I.uid); return html`<div key=${I.uid} className="wo26-r off">${m?html`<span className="wo26-av"><${PfpView} m=${m} s=${36}/></span>`:null}<span className="wo26-t"><b>${I.name}</b><small>${m?dispName(m)+' · ':''}본부 Lv.${I.hallLv}${I.here&&I.here.at?' · '+ago(I.here.at)+' 접속':''}</small></span>
        <button className="wo26-go alt tap" onClick=${()=>{ goIsland(I.uid); setPpl(false); setMapO(false); }}>가기</button></div>`; })}</div>
    <//>`:null}
    ${msn&&mine?(()=>{ const D=dayD(mine); const all=['col','ob','visit'].every(k=>D[k]); return html`<div className="wb20-shade" onClick=${()=>setMsn(false)}><div className="wbi" onClick=${e=>e.stopPropagation()}>
      <div className="wbi-h"><b>오늘의 섬 미션</b><button className="wbi-x tap" onClick=${()=>setMsn(false)} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
      <div className="wbi-b"><div className="wm23">${[['col','벽돌 공방에서 벽돌 모으기','home'],['ob','장애물 하나 치우기','axe'],['visit','크루원 섬에 놀러 가기','globe']].map(([k,t,ic])=>html`<div key=${k} className=${'wm23-r'+(D[k]?' ok':'')}><span className="wm23-ic"><${Icon} n=${D[k]?'check':ic} s=${18} w=${2.6}/></span><b>${t}</b><em>${D[k]?'완료':'진행 중'}</em></div>`)}</div>
        <button className=${'wbi-go tap'+(all&&!D.got?'':' off')} onClick=${()=>{ if(!all||D.got) return; save({daily:{...D,got:1},bricks:mine.bricks+80}); c.worldGold(30,'섬 미션 완료! 벽돌 80 · 골드 30'); setMsn(false); }}>${D.got?'오늘 보상 받음':html`<${BrickIc} s=${20}/>80 + D-Coin 3 받기`}</button>
        <p className="wbi-d" style=${{marginTop:'10px'}}>매일 0시에 새로 시작해요.</p></div></div></div>`; })():null}
    ${ptyO?html`<${WPartyPanel} c=${c} S=${S} isl=${isl} onClose=${()=>setPtyO(false)} startDg=${startDg} goIsland=${uid=>{ goIsland(uid); setPtyO(false); }}/>`:null}
    ${lvUp?html`<${WLvUp} o=${lvUp} onDone=${()=>setLvUp(null)}/>`:null}
    ${npcAi?html`<${WNpcChat} c=${c} id=${npcAi} onClose=${()=>setNpcAi(null)}/>`:null}
    ${raidO?html`<${RaidSheet} c=${c} isl=${isl} mine=${mine} onGo=${I=>{ raidPrepare(c,I); setRaidO(false); startDg('raid'); }} onClose=${()=>setRaidO(false)}/>`:null}
    ${rank?html`<${WRank} c=${c} isl=${isl} mine=${mine} tab=${rtab} setTab=${setRtab} onGo=${uid=>{ goIsland(uid,1); setRank(false); }} onClaim=${recClaim} onClose=${()=>setRank(false)}/>`:null}
    ${gd&&mine?html`<${WGarden} I=${mine} now=${now} focus=${gd.pid||null} onClose=${()=>setGd(null)} onPlant=${plant} onHarvest=${harvest} onGo=${goPlot} onBuild=${()=>{ setGd(null); startPlace('farm'); }}/>`:null}
    ${gbk?(()=>{ const I0=isl.find(x=>x.uid===gbk); return I0?html`<${WGuest} c=${c} I=${I0} isOwner=${I0.uid===c.uid} onClose=${()=>setGbk(null)} onWrite=${t=>gbWrite(I0,t)} onDel=${id=>gbDel(I0,id)} onGo=${I0.uid!==c.uid?()=>{ setGbk(null); goIsland(I0.uid); }:null}/>`:null; })():null}
    ${qs&&mine?html`<${WQuest} I=${mine} onClose=${()=>setQs(false)} onClaim=${id=>claimQ(id)} onGo=${goNpc}/>`:null}
    ${ew&&!dg?html`<${WEmoWheel} at=${ew} onPick=${doEmo} onClose=${()=>setEw(null)}/>`:null}
    ${dg?html`<${Dungeon} key=${dg} c=${c} kind=${dg} onExit=${exitDg} saveBricks=${saveBricks}/>`:null}
    ${tp?html`<div className=${'tp26 k-'+tp.k+' '+tp.dir} key=${tp.key} aria-hidden="true"><i className="tp26-sw"></i><i className="tp26-ring"></i><div className="tp26-t"><em>${DG[tp.k].e}</em><b>${tp.dir==='in'?DG[tp.k].n+'(으)로 이동 중':'DKO 월드로 돌아가는 중'}</b></div></div>`:null}
    ${welcome?html`<div className="wo27" onClick=${e=>e.stopPropagation()}><div className="wo27-c">
      <div className="wo27-art"><span className="wo27-old"><em>DKO</em><b>TOWN</b></span><span className="wo27-ar"><${Icon} n="chev" s=${26} w=${3}/></span><span className="wo27-new"><em>DKO</em><b>WORLD</b></span>
        ${Array.from({length:18}).map((_,i)=>html`<i key=${i} className="wo27-cf" style=${{'--i':i,'--x':((i*53)%100)+'%','--c':['#FFD54A','#FF6B8A','#7CF0B5','#7CC2FF','#FF8A3D','#C29BFF'][i%6]}}></i>`)}</div>
      <em className="wo27-em">GRAND OPEN</em><b className="wo27-t">DKO 월드에 온 걸 환영해요</b>
      <ul className="wo27-l"><li><span className="gi30" style=${{'--g1':'#8EE06A','--g2':'#2F9A3A'}}><${Icon} n="home" s=${16} w=${2.4}/></span>내 섬을 짓고 땅을 넓혀 마을을 꾸며요</li>
        <li><span className="gi30" style=${{'--g1':'#7CF0B5','--g2':'#139A63'}}><${Icon} n="swords" s=${16} w=${2.4}/></span>포털을 걸어서 지나가면 던전 · 대륙 디코아로 떠나요</li>
        <li><span className="gi30" style=${{'--g1':'#FFD54A','--g2':'#C98A00'}}><${Icon} n="shield" s=${16} w=${2.4}/></span>7가지 무기 × 4원소 장비 · 사당을 풀어 정령석을 모아요</li>
        <li><span className="gi30" style=${{'--g1':'#7CC2FF','--g2':'#2563EB'}}><${Icon} n="chat" s=${16} w=${2.4}/></span>크루와 채팅 · 파티 핑 · 협동 사당</li></ul>
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
  if(it.t==='hall'){ const mx=(t0,l)=>wMaxOf(t0,l); stats.push(['장식 한도',W_DECO_MAX[it.lv],canUp?W_DECO_MAX[nx]:null]); stats.push(['벽돌 공방',mx('mine',it.lv),canUp?mx('mine',nx):null]); stats.push(['텃밭',mx('farm',it.lv),canUp?mx('farm',nx):null]); stats.push(['땅 넓히기',W_LAND_MAX[it.lv],canUp?W_LAND_MAX[nx]:null]);
    if(canUp&&W_CAT.hall.ug[nx]) stats.push(['업그레이드 골드',null,W_CAT.hall.ug[nx]]); if(canUp&&W_CAT.hall.uss&&W_CAT.hall.uss[nx]) stats.push(['정령석 필요',null,W_CAT.hall.uss[nx]+'개']); const UNL={3:'요리솥 · 바닥 브러시',5:'목공소 · 물약 공방 · 무역 열기구',7:'성 스킨 · 환경 테마',9:'+5 강화 · 황금 성채 · 무역 보상 +30%'}; if(canUp&&UNL[nx]) stats.push(['Lv.'+nx+' 해금',null,UNL[nx]]); }
  if(typeof RD_DEF!=='undefined'&&RD_DEF[it.t]){ const D0=RD_DEF[it.t]; stats.push(['공격력',D0.dmg[Math.min(5,it.lv)],canUp?D0.dmg[Math.min(5,nx)]:null]); stats.push(['사거리',D0.rng+'칸',null]); }
  const lock=it.t!=='hall'&&canUp&&nx>I.hallLv;
  return html`<div className="wb20-shade" onClick=${onClose}><div className="wbi" onClick=${e=>e.stopPropagation()}>
    <div className="wbi-h"><b>${info.exp?'섬 넓히기':info.up?wName(it.t)+' 업그레이드':wName(it.t)}</b><button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="wbi-art wbi96-art"><${WItemIcon} t=${it.t} lv=${info.up&&canUp?nx:Math.max(1,it.lv)} big=${true}/>${info.up&&canUp?html`<span className="wbi-lv">Lv.${it.lv} → <b>Lv.${nx}</b></span>`:html`<span className="wbi-lv">Lv.${it.lv}${C.lvMax>1?' / '+C.lvMax:''}</span>`}</div>
    ${C.lvMax>1&&!info.exp?html`<div className="wbi96-tr">${Array.from({length:C.lvMax},(_,i)=>html`<i key=${i} className=${(i<it.lv?'on':'')+(info.up&&i===it.lv?' nx':'')}>${i+1}</i>`)}</div>`:null}
    ${info.exp?html`<div className="wbi-b">
      <p className="wbi-d">본부 레벨에 맞춰 섬을 한 칸씩 넓힐 수 있어요. 새 땅에는 장애물이 생겨요.</p>
      <div className="wbi-exp">${[0,1,2].map(k=>html`<span key=${k} className=${k<I.exp?'on':k===I.exp?'nx':''}><i></i>${k+1}단계<small>본부 Lv.${k+2}</small></span>`)}</div>
      ${I.exp>=WCF.MAX_EXP?html`<p className="wbi-max">최대로 넓혔어요!</p>`:html`<button className=${'wbi-go tap'+(I.hallLv<I.exp+2?' off':'')} onClick=${onExp}>${I.hallLv<I.exp+2?'본부 Lv.'+(I.exp+2)+' 필요':html`<${BrickIc} s=${20}/>${W_EXP_COST[I.exp].toLocaleString()} · 넓히기`}</button>`}
    </div>`:html`<div className="wbi-b">
      <p className="wbi-d">${C.ds||C.d2||''}</p>
      ${stats.length?html`<div className="wbi-st">${stats.map(([k,a,b])=>html`<div key=${k}><span>${k}</span><b>${a}${info.up&&b!=null&&b!==a?html` <em>→ ${b}</em>`:null}</b></div>`)}</div>`:null}
      ${it.t==='hall'&&!info.up?html`<div className="wbi-name">${nm==null?html`<button className="link" onClick=${()=>setNm(I.name)}><${Icon} n="edit" s=${14}/>섬 이름 바꾸기 · ${I.name}</button>`:html`<div className="row g6"><input className="inp" value=${nm} onChange=${e=>setNm(e.target.value.slice(0,14))} placeholder="섬 이름"/><button className="wbi-mini tap" onClick=${rename}>저장</button></div>`}</div>`:null}
      ${info.up&&canUp?html`<div className="wbi-cost wbi96-cost"><span><${Icon} n="clock" s=${15}/>${wFmtT(C.ut[nx])}</span><span className=${(I.bricks||0)<C.up[nx]?'no':''}><${BrickIc} s=${15}/>${(I.bricks||0).toLocaleString()} / ${C.up[nx].toLocaleString()}</span>${C.ug&&C.ug[nx]?html`<span className=${wGoldOf(I)<C.ug[nx]?'no':''}><${GoldIc} s=${15}/>${wGoldOf(I).toLocaleString()} / ${C.ug[nx].toLocaleString()}</span>`:null}</div>
        <button className=${'wbi-go tap'+(lock?' off':'')} onClick=${()=>!lock&&onUp(it)}>${lock?'본부 Lv.'+nx+' 필요':html`<${BrickIc} s=${20}/>${C.up[nx].toLocaleString()}${C.uss&&C.uss[nx]?html` · <${SsIc} s=${16}/>${C.uss[nx]}`:null} · 업그레이드`}</button>`:null}
      ${!info.up&&canUp&&!(it.up&&it.up.end>now)?html`<button className="wbi-go ghost tap" onClick=${()=>{ onClose(); setTimeout(()=>document.querySelector('.wb20-rb .up')&&document.querySelector('.wb20-rb .up').click(),60); }}>업그레이드 보기</button>`:null}
    </div>`}
  </div></div>`;
}
/* 상점 */
function WShop({c,I,tab,setTab,coins,busy,builders,onPick,onClose,gift,rpg,onEq,onBag,gold,social,onEx,onSocialGo}){
  const hl=I.hallLv; const gl=Object.entries((gift&&gift.items)||{}).filter(([k,n])=>n>0&&W_CAT[k]);
  if(tab==='gift'&&!gl.length) tab='res';
  const list=tab==='gift'||tab==='eq'||tab==='ex'||tab==='ss'?[]:Object.entries(W_CAT).filter(([k,v])=>v.cat===tab&&k!=='hall');
  return html`<div className="wb20-shade" onClick=${onClose}><div className="wbs" onClick=${e=>e.stopPropagation()}>
    <div className="wbs-h"><b>상점</b><span className="wbs-sub"><${GoldIc} s=${16}/>${(gold||0).toLocaleString()}<i></i><${BrickIc} s=${16}/>${I.bricks.toLocaleString()}<i></i>건축가 ${builders-busy}/${builders}</span><button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="wbs-tabs">${gl.length?html`<button className=${'tap gift'+(tab==='gift'?' on':'')} onClick=${()=>setTab('gift')}>선물<em>${gl.reduce((s,[,n])=>s+n,0)}</em></button>`:null}${W_TABS.map(([k,l])=>html`<button key=${k} className=${'tap'+(tab===k?' on':'')+(k==='gem'?' gem':'')+(k==='xmas'?' xm':'')} onClick=${()=>setTab(k)}>${l}</button>`)}${rpg?html`<button className=${'tap eqt'+(tab==='eq'?' on':'')} onClick=${()=>setTab('eq')}>장비</button>`:null}${c&&rpg?html`<button className=${'tap sst'+(tab==='ss'?' on':'')} onClick=${()=>setTab('ss')}><${SsIc} s=${13}/>정령</button>`:null}<button className=${'tap ext'+(tab==='ex'?' on':'')} onClick=${()=>setTab('ex')}>환전소</button></div>
    ${tab==='ex'?html`<${WExchange} coins=${coins} gold=${gold} social=${social} onEx=${onEx} onGo=${onSocialGo}/>`:null}
    ${tab==='gem'?html`<div className=${'wbs-cap wx77-cap'+(social?' ok':'')}><${Icon} n=${social?'check':'lock'} s=${12} w=${2.6}/>${social?'소셜 아일랜드 부티크 · D-Coin으로 살 수 있어요':'D-Coin 스페셜은 소셜 아일랜드에서만 살 수 있어요'}${social?null:html`<button type="button" className="tap" onClick=${onSocialGo}>가기</button>`}</div>`:null}
    ${tab==='ss'&&c&&rpg?html`<${WSpiritShop} c=${c} rpg=${rpg}/>`:null}
    ${tab==='eq'&&rpg?html`<${WGearShop} I=${I} gold=${gold} onBuy=${onEq} onBag=${onBag}/>`:null}
    ${tab==='gift'?html`<div className="wbs-cap">D-ROP · 주민 선물로 받은 장식이에요 · 공짜로 놓을 수 있어요</div><div className="wbs-grid">${gl.map(([k,n],i)=>html`<button key=${k} className="wbs-c tap gem gf" style=${{'--d':(i*35)+'ms'}} onClick=${()=>onPick(k,true)}>
        <span className="wbs-art"><${WItemIcon} t=${k}/><i className="wbs-sz">${wSz({t:k}).join('×')}</i></span><b>${W_CAT[k].n}</b><span className="wbs-meta"><em>×${n}</em></span><span className="wbs-p gf">무료로 놓기</span></button>`)}</div>`:null}
    ${tab==='deco'||tab==='gem'||tab==='xmas'?html`<div className="wbs-cap">장식 ${wDecoCount(I)}/${W_DECO_MAX[hl]} · ${tab==='xmas'?(wXmas()?'연말 시즌 한정 · 1월 6일까지 지을 수 있어요':'연말 시즌(11/15 ~ 1/6)에 열려요'):'본부 레벨이 오르면 더 놓을 수 있어요'}</div>`:null}
    <div className="wbs-grid">${list.map(([k,C],i)=>{ const mx=wMaxOf(k,hl), n=wCount(I,k); const off=C.cat==='xmas'&&!wXmas(); const lock=(C.req&&hl<C.req)||C.drop||C.ss||off; const full=!lock&&mx<99&&n>=mx;
      return html`<button key=${k} className=${'wbs-c tap'+(lock?' lock':'')+(full?' full':'')+(C.d?' gem':'')} style=${{'--d':(i*35)+'ms'}} onClick=${()=>!lock&&!full&&onPick(k)}>
        <span className="wbs-art"><${WItemIcon} t=${k}/><i className="wbs-sz">${wSz({t:k}).join('×')}</i></span>
        <b>${C.n}</b>
        <span className="wbs-meta">${mx<99&&!lock?html`<em>${n}/${mx}</em>`:null}${C.time?html`<em><${Icon} n="clock" s=${11} w=${2.4}/>${wFmtT(C.time)}</em>`:null}</span>
        ${off?html`<span className="wbs-lock"><${Icon} n="snow" s=${13} w=${2.4}/>연말 시즌</span>`:C.ss?html`<span className="wbs-lock"><${SsIc} s=${13}/>정령 상점</span>`:C.npc?html`<span className="wbs-lock"><${Icon} n="heart" s=${13} w=${2.4}/>주민 선물</span>`:C.drop?html`<span className="wbs-lock"><${Icon} n="gift" s=${13} w=${2.4}/>D-ROP ${['레어','에픽','레전더리','얼티밋'][C.gr]||''}</span>`:lock?html`<span className="wbs-lock"><${Icon} n="lock" s=${13} w=${2.4}/>본부 Lv.${C.req}</span>`:full?html`<span className="wbs-lock">최대</span>`:html`<span className=${'wbs-p'+(C.d?' d':'')}>${C.d?html`<${Coin} s=${14}/>${C.d}`:html`<${BrickIc} s=${15}/>${C.b}`}</span>`}
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
   전리품(벽돌 · 골드 · 장비 · 경험치)은 나갈 때와 45초마다 서버에 저장돼요. */
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
  const D=DG[kind]; if(D.raid) return raidBuild(); if(D.dk) return dkBuild(); if(D.story) return dgBuildStory(kind);
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
  else if(k==='samurai'&&typeof samuraiBoxes==='function') samuraiBoxes(b,dec,M,P,fl,m);
  else if(k==='puff'&&typeof puffBoxes==='function') puffBoxes(b,dec,M,P,fl,m,blink);
  return B; }
/* ── 장애물(지옥 전용 포함) ── */
function dgDrawObs(g,t,ox,oy,u,tm,seed){ const C=(...a)=>wCube(g,ox,oy,u,...a);
  switch(t){
    /* v29.1 디코아 바닥 꾸밈 (밟고 지나가요) */
    case 'tuft': case 'tuftD': case 'tuftF': case 'tuftI': { const c0=t==='tuftF'?'#B0703A':t==='tuftI'?'#E6F4FF':t==='tuftD'?'#9AAE6A':'#5FBF5A', c1=t==='tuftF'?'#7A4420':t==='tuftI'?'#A8C8E8':t==='tuftD'?'#6E7E44':'#3E9A3E'; const w=Math.sin(tm*2+seed)*.25;
      C(-1.6+w,-.3,0,.5,.5,1.4,c0,{t:c0,l:c0,r:c1}); C(-.3,-.8+w,0,.5,.5,1.9,c0,{t:c0,l:c0,r:c1}); C(.9+w,.2,0,.5,.5,1.2,c0,{t:c0,l:c0,r:c1}); break; }
    case 'pebble': case 'pebbleF': case 'pebbleI': { const c0=t==='pebbleF'?'#4A3A3E':t==='pebbleI'?'#C8D8E8':'#A8A8A0'; C(-1.4,-.6,0,1.2,1,.5,c0); C(.4,.3,0,.9,.8,.4,c0); break; }
    case 'ember': { const f=.5+.5*Math.sin(tm*5+seed); C(-.4,-.4,0,.8,.8,.3,'#3A2226'); g.globalAlpha=.6+.4*f; C(-.25,-.25,.3,.5,.5,.3+f*.4,'#FF7A2A',{t:'#FFD070',l:'#FF8A3A',r:'#E8420A'}); g.globalAlpha=1; break; }
    case 'spark2': { const f=(tm*1.4+seed*.1)%1; g.globalAlpha=1-f; C(-.2,-.2,1+f*3,.4,.4,.4,'#FFE45A',{t:'#FFFFFF',l:'#FFE45A',r:'#C8A020'}); g.globalAlpha=1; C(-.9,-.5,0,1.1,.9,.4,'#8A8AA0'); break; }
    case 'spike': wShadow(g,ox,oy+u,u*4,u*2); C(-2.4,-2.4,0,4.8,4.8,1.2,'#2A1A1C'); C(-1.4,-1.4,1.2,2.8,2.8,3,'#3A2226'); C(-.8,-.8,4.2,1.6,1.6,3,'#4A2A2E'); C(-.3,-.3,7.2,.6,.6,2,'#E6D6C0'); break;
    case 'obsid': wShadow(g,ox,oy+u,u*4,u*2); C(-2,-2,0,4,4,8,'#2A2236',{t:'#5A4A7A',l:'#3A2E4E',r:'#1E1828'}); C(-1.4,-1.4,8,2.8,2.8,2.6,'#3A2E4E',{t:'#7A6AA0',l:'#4A3E62',r:'#2A2238'}); break;
    case 'bones': C(-2,-.4,0,4,.8,.6,'#E6DCC8'); C(-.4,-2,0,.8,4,.6,'#D8CFBC'); C(-2.4,-.6,0,.8,1.2,.9,'#F2EADA'); break;
    case 'skull': wShadow(g,ox,oy+u,u*4,u*2); C(-3,-3,0,6,6,2,'#3A2226'); C(-2,-2,2,4,4,3.6,'#E6DCC8'); C(-1.4,1.95,3.2,1,.2,1.2,'#1A1010',{l:'#1A1010',r:'#1A1010',t:'#1A1010'}); C(.4,1.95,3.2,1,.2,1.2,'#1A1010',{l:'#1A1010',r:'#1A1010',t:'#1A1010'}); break;
    case 'fire': { wShadow(g,ox,oy+u,u*3,u*1.5); C(-2,-2,0,4,4,1,'#3A2226'); const f=1+Math.sin(tm*9+seed)*.3; C(-1.2,-1.2,1,2.4,2.4,2*f,'#FF5A1A',{t:'#FFB04A',l:'#FF7A2A',r:'#E8420A'}); C(-.6,-.6,1+2*f,1.2,1.2,1.4*f,'#FFD54A',{t:'#FFF2A0',l:'#FFE070',r:'#F2B020'}); break; }
    default: if(t.startsWith('dkwall')){ const rg=t.slice(7); const c0={earth:['#B5A48A','#D2C4A8','#8A7A60'],fire:['#3E3446','#5A4E66','#2A2232'],ice:['#BFD6EA','#E6F2FC','#90AACA'],bolt:['#6E7496','#8E94B4','#4E5476']}[rg]||['#B8B2A2','#D2CCBC','#8E8778']; C(-2.4,-2.4,0,4.8,4.8,6,c0[0],{t:c0[1],l:c0[0],r:c0[2]}); C(-2.6,-2.6,6,5.2,5.2,1,c0[2],{t:c0[1]}); break; }
      wDrawItem(g,t,ox,oy,u,tm,seed,1);
  } }
/* ── 전투 화면 ── */
function Dungeon({c,kind,onExit,getBricks,saveBricks}){
  const D=DG[kind]; const cv=useRef(null); const S=useRef(null);
  const [hud,setHud]=useState({hp:1,mhp:1,lv:1,xp:0,need:1,cdA:0,cdS:0,shield:false,boss:null,loot:{b:0,k:0,c:0,eq:[]},dead:false,lvup:0});
  const [toast,setToast]=useState(null); const [sum,setSum]=useState(null); const [raidRes,setRaidRes]=useState(null); const [raidSv,setRaidSv]=useState(0);
  const [chat,setChat]=useState(false); const [chest,setChest]=useState(null); const [stg,setStg]=useState(null); const [ctl,setCtl]=useState(wCtl()); const [ar,setAr]=useState(null);
  const [entry,setEntry]=useState(null); const [cedit,setCedit]=useState(false); const [dmap,setDmap]=useState(false); const [dset,setDset]=useState(false); const [dbag,setDbag]=useState(false); const [lore,setLore]=useState(false); const [tab,setTab]=useState(null);
  useEffect(()=>{ wBgm(D.story?'story':kind); const f=()=>setCtl(wCtl()); window.addEventListener('dko-wset',f); return ()=>window.removeEventListener('dko-wset',f); },[]);
  const rpg0=rpgOf(c.me);
  useEffect(()=>{
    const el=cv.current, g=el.getContext('2d'); let raf=0, dead=false; const dpr=Math.min(2,window.devicePixelRatio||1);
    const M=dgBuild(kind); const rpgL={...rpg0,gear:gClone(gearOf(rpg0)),dk:JSON.parse(JSON.stringify(dkOf(rpg0)))}; const st=cbStats(rpgL); const SP=D.story?[-3,1]:(M.dk||M.raid)?M.spawn.slice():[0,2];
    const s=S.current={M,cam:{x:SP[0],y:SP[1],z:.9},tz:Math.min(1.8,wZoomK()>1?1.45:1),me:{x:SP[0],y:SP[1],path:[],yaw:0,ty:0,walk:false,v:0,ph:0,hp:st.hp,swing:0,blockT:0,lastHit:-9,dead:0,tgt:null},mobs:[],fx:[],drops:[],cdA:0,cdS:0,dying:[],
      portal:D.story?[-5,-1.5]:M.raid?[M.spawn[0],M.spawn[1]+1.6]:M.dk?[M.spawn[0],M.spawn[1]-3]:[0,-1.2],spawnPt:SP.slice(),stage:D.story?{ai:-1,spawned:{},cleared:{},t0:{},hurt:{},deaths:{}}:null,
      rpg:rpgL,ss0:rpgL.ss||0,st,loot:{b:0,k:0,c:0,eq:[],xp:0,ore:0},nid:1,boss:{},last:performance.now(),save:performance.now(),others:new Map(),freeze:true,alive:true};
    cbInit(s,cbEntry(),1); s.dk=s.rpg.dk; const DK=!!M.dk; const hAt=(x,y)=>DK?dkH(M,x,y):0; if(DK){ s.gl={st:dkStamMax(s.dk,s.rpg),max:dkStamMax(s.dk,s.rpg)}; s.me.z=hAt(SP[0],SP[1]); s.lastSafe=SP.slice(); s.temp={c:21,st:0,rg:'plain'}; }
    const blocked=(x,y)=>{ const k=x+','+y; return !M.T.has(k)||M.blk.has(k); };
    const DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
    const bfs=(sx,sy,tx,ty)=>{ const k=(x,y)=>x+','+y; const q=[[sx,sy]]; let h=0; const prev=new Map([[k(sx,sy),null]]);
      while(h<q.length&&h<9000){ const [x,y]=q[h++]; if(x===tx&&y===ty){ const p=[]; let cur=k(x,y); while(cur){ const [a,b2]=cur.split(',').map(Number); p.unshift([a,b2]); cur=prev.get(cur); } return p; }
        for(const [dx,dy] of DIRS){ const nx=x+dx, ny=y+dy, kk=k(nx,ny); if(prev.has(kk)||blocked(nx,ny)) continue; if(dx&&dy&&(blocked(x+dx,y)||blocked(x,y+dy))) continue; if(DK&&Math.abs(hAt(nx,ny)-hAt(x,y))>1) continue; prev.set(kk,k(x,y)); q.push([nx,ny]); } } return null; };
    const los=(a,b2)=>{ const d=Math.hypot(b2[0]-a[0],b2[1]-a[1]); const n=Math.ceil(d*5); for(let i=1;i<n;i++){ const x=a[0]+(b2[0]-a[0])*i/n, y=a[1]+(b2[1]-a[1])*i/n; for(const [ox,oy] of [[0,0],[.28,.28],[-.28,-.28],[.28,-.28],[-.28,.28]]) if(blocked(Math.round(x+ox),Math.round(y+oy))) return false; } return true; };
    const smooth=p=>{ if(p.length<3) return p; const o=[p[0]]; let i=0; while(i<p.length-1){ let j=p.length-1; while(j>i+1&&!los(p[i],p[j])) j--; o.push(p[j]); i=j; } return o; };
    const safe=(tx,ty)=>{ if(!blocked(tx,ty)) return [tx,ty]; for(let r=1;r<=4;r++){ let best=null,bd=1e9; for(let x=tx-r;x<=tx+r;x++) for(let y=ty-r;y<=ty+r;y++){ if(blocked(x,y)) continue; const d=Math.hypot(x-tx,y-ty); if(d<bd){ bd=d; best=[x,y]; } } if(best) return best; } return null; };
    const route=(fx0,fy0,tx,ty)=>{ const t=safe(tx,ty); if(!t) return null; const p=bfs(Math.round(fx0),Math.round(fy0),t[0],t[1]); if(!p) return null; return smooth([[fx0,fy0],...p.slice(1)]).slice(1); };
    s.go=(x,y)=>{ const p=route(s.me.x,s.me.y,x,y); if(p&&p.length){ s.me.path=p; const e=p[p.length-1]; s.mark={x:e[0],y:e[1],at:performance.now()}; return true; } return false; };
    /* 몬스터 */
    const tiles=[...M.T.values()];
    const spawn=(t,x,y,home,ar0,delay)=>{ const B=MOB[t]; const m={id:s.nid++,t,x,y,hx:home?home[0]:x,hy:home?home[1]:y,hp:B.hp,mhp:B.hp,yaw:Math.random()*6,ty:0,v:0,path:[],wait:Math.random()*2,atk:0,cd:0,hit:0,aggro:false,slamT:0,dashT:0,boss:!!B.boss,mini:!!B.mini,born:performance.now()+(delay||0),ar:ar0==null?null:ar0};
      cbMobInit(m,s.cb?s.cb.party:1); s.mobs.push(m); return m; };
    /* 스토리: 구역에 들어가면 몬스터가 땅에서 솟아나요 */
    const spawnArea=i=>{ const A=D.areas[i], S0=s.stage; if(S0.spawned[i]) return; S0.spawned[i]=1; S0.t0[i]=performance.now(); S0.hurt[i]=0; S0.deaths[i]=0; S0.ai=i; let j=0;
      A.mobs.forEach(([t,n])=>{ for(let q=0;q<n;q++){ let p=null; for(let k=0;k<40&&!p;k++){ const a=Math.random()*6.28, r=(MOB[t].boss?Math.min(k*.25,3):1.5+Math.random()*(A.r-2.6)); const x=Math.round(A.c[0]+Math.cos(a)*r+(MOB[t].boss?2:0)), y=Math.round(A.c[1]+Math.sin(a)*r); if(!blocked(x,y)&&Math.hypot(x-s.me.x,y-s.me.y)>2.6) p=[x,y]; }
        if(p){ const m=spawn(t,p[0],p[1],A.c,i,j*140); m.aggro=!!MOB[t].boss||Math.random()<.5; j++; } } });
      if(!j){ setTimeout(()=>clearArea(i),600); }
      setAr({id:A.id,n:A.n,boss:!!A.boss,k:Date.now()}); if(A.boss){ wSfx('roar'); wBgm('boss'); s.shake=.8; } else wSfx('pop'); };
    const clearArea=i=>{ const A=D.areas[i], S0=s.stage; if(S0.cleared[i]) return; S0.cleared[i]=1; wQ('stage'); const now=performance.now(); const sec=(now-S0.t0[i])/1000;
      const stars=S0.deaths[i]?1:(sec<(A.boss?150:A.mobs.some(([t])=>MOB[t].mini)?90:55)&&S0.hurt[i]<s.st.hp*.6)?3:2;
      const r=s.rpg; const old=r.story||{best:0,stars:{},clears:0}; r.story={best:Math.max(old.best||0,i+1),stars:{...(old.stars||{}),[A.id]:Math.max((old.stars||{})[A.id]||0,stars)},clears:(old.clears||0)+(i===D.areas.length-1?1:0)};
      const gt=M.gates[i]; if(gt&&!gt.open){ gt.open=true; gt.at=now; gt.cells.forEach(([x,y])=>M.blk.delete(x+','+y)); setTimeout(()=>wSfx('gate'),500); s.shake=.5; }
      const tier=i===D.areas.length-1?(stars===3?'legend':'gold'):(STORY_CHEST[i]==='wood'&&stars===3?'silver':STORY_CHEST[i]);
      s.drops.push({k:'chest',tier,stars,label:A.id,x:A.c[0]+(A.boss?2:0),y:A.c[1],at:now,z:1}); s.spawnPt=[A.c[0],A.c[1]];
      wSfx('clear'); haptic([30,40,80]); setAr({id:A.id,n:A.n,clear:1,stars,k:Date.now()}); if(A.boss){ wBgm('story'); s.stage.done=1; } };
    const freeSpot=()=>{ for(let i=0;i<40;i++){ const t=tiles[Math.floor(Math.random()*tiles.length)]; if(M.blk.has(t.x+','+t.y)) continue; if(Math.hypot(t.x-s.me.x,t.y-s.me.y)<9) continue; if(Math.hypot(t.x,t.y)<7) continue; if(D.boss.some(([,bx,by])=>Math.hypot(t.x-bx,t.y-by)<7)) continue; return t; } return null; };
    const fill=()=>{ if(DK){ dkFill(s,{spawn:(t,x,y,h)=>spawn(t,x,y,h)}); return; } D.mobs.forEach(([t,n])=>{ const have=s.mobs.filter(m=>m.t===t).length; for(let i=have;i<n;i++){ const p=freeSpot(); if(p) spawn(t,p.x,p.y); } });
      D.boss.forEach(([t,bx,by])=>{ if(!s.mobs.some(m=>m.t===t)&&!(s.boss[t]>performance.now())) spawn(t,bx,by,[bx,by]); }); };
    fill(); s.fillAt=performance.now()+6000;
    if(M.raid&&typeof raidInit==='function') raidInit(s,{spawn:(t,x,y,h,a,d)=>spawn(t,x,y,h,a,d)});
    const iso=(x,y)=>[(x-y)*WCF.TW/2,(x+y)*WCF.TH/2];
    const size=()=>{ const r=el.getBoundingClientRect(); el.width=Math.round(r.width*dpr); el.height=Math.round(r.height*dpr); s.vw=r.width; s.vh=r.height; s.tc=null; };
    size(); const ro=new ResizeObserver(size); ro.observe(el);
    const scr=(x,y,zz)=>{ const [ix,iy]=iso(x,y); const [cx,cy]=iso(s.cam.x,s.cam.y); const hz=DK?((zz==null?hAt(x,y):zz)-(s.cam.h||0))*DK_LV:0; return [(ix-cx)*s.cam.z+s.vw/2,(iy-cy-hz)*s.cam.z+s.vh/2]; };
    const unscr=(px,py)=>{ const [cx,cy0]=iso(s.cam.x,s.cam.y); const cy=cy0-(DK?(s.cam.h||0)*DK_LV:0); const ix=(px-s.vw/2)/s.cam.z+cx, iy=(py-s.vh/2)/s.cam.z+cy; const a=ix/(WCF.TW/2), b2=iy/(WCF.TH/2); return [(a+b2)/2,(b2-a)/2]; };
    s.scr=scr;
    const TL=D.tile;
    /* 땅은 화면보다 조금 넓게 한 번 그려 두고 옮겨 써요 (화질은 그대로, 매 프레임 수천 칸을 다시 안 그려요) */
    const MG=260;
    const drawTiles=(ctx,ox,oy,z)=>{ if(DK){ dkDrawTiles(ctx,s,ox,oy,z,s.vw,s.vh,MG); return; } const HW=WCF.TW/2*z, HH=WCF.TH/2*z, SIDE=9*z;
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
    const tileLayer=()=>{ const z=s.cam.z; const [cx,cy0]=iso(s.cam.x,s.cam.y); const cy=cy0-(DK?(s.cam.h||0)*DK_LV:0); const tc=s.tc;
      const ok=tc&&Math.abs(tc.z-z)<1e-4&&Math.abs((tc.cx-cx)*z)<MG*.8&&Math.abs((tc.cy-cy)*z)<MG*.8;
      if(!ok){ const c2=(tc&&tc.cv)||document.createElement('canvas'); c2.width=Math.round((s.vw+MG*2)*dpr); c2.height=Math.round((s.vh+MG*2)*dpr); const x2=c2.getContext('2d'); x2.setTransform(dpr,0,0,dpr,0,0); x2.clearRect(0,0,s.vw+MG*2,s.vh+MG*2);
        drawTiles(x2,-cx*z+s.vw/2+MG,-cy*z+s.vh/2+MG,z); s.tc={cv:c2,cx,cy,z}; }
      const T2=s.tc; g.drawImage(T2.cv,(T2.cx-cx)*z-MG,(T2.cy-cy)*z-MG,s.vw+MG*2,s.vh+MG*2); };
    const say=(t)=>{ setToast({t,k:Date.now()}); };
    const gotGear=(it,quiet)=>{ const G=s.rpg.gear; if(G.it.length>=gCap(G)){ const n=GE_DUST[it.r]; G.dust=(G.dust||0)+n; if(!quiet) say('가방이 가득 차서 '+gName(it)+'을(를) 강화 가루 '+n+'개로 분해했어요'); return; }
      G.it.push(it); s.loot.eq.push(it); if(!quiet){ say(GR_N[it.r]+' '+gName(it)+' 획득!'); haptic(it.r>=2?[30,40,80]:[20,30,50]); wSfx('gem'); if(it.r>=2) s.fx.push({k:'num',x:s.me.x,y:s.me.y,at:performance.now(),t:GR_N[it.r]+'!',col:GR_C[it.r]}); } };
    const addXp=n=>{ const r=s.rpg; r.xp+=n; s.loot.xp+=n; let up=false; while(r.xp>=rpgNeed(r.lv)){ r.xp-=rpgNeed(r.lv); r.lv++; up=true; } if(up){ s.st=cbStats(r); s.me.hp=s.st.hp; say('레벨 업! Lv.'+r.lv+' · 체력이 가득 찼어요'); haptic([20,30,60]); s.fx.push({k:'lv',x:s.me.x,y:s.me.y,at:performance.now()}); wSfx('lvl'); } };
    const dropLoot=m=>{ const B=MOB[m.t]; const n=rRand(B.b[0],B.b[1]); const k=Math.max(1,Math.min(6,Math.round(n/12)));
      for(let i=0;i<k;i++) s.drops.push({k:'b',n:Math.round(n/k),x:m.x+(Math.random()-.5)*1.4,y:m.y+(Math.random()-.5)*1.4,at:performance.now(),z:1});
      if(B.coin) s.drops.push({k:'c',n:rRand(B.coin[0],B.coin[1]),x:m.x,y:m.y+.5,at:performance.now(),z:1});
      /* v27.9 장비 드롭 (기획서 4-3 등급 확률표) · 광석 */
      const G=s.rpg.gear, ZE={story:'earth',hell:'fire'}[kind]||null, t0=performance.now();
      const n0=B.boss?(Math.random()<.5?2:1):B.mini?(Math.random()<.4?1:0):(Math.random()<.06?1:0);
      for(let i=0;i<n0;i++) s.drops.push({k:'e',it:gDrop(G,B.boss?'boss':B.mini?'elite':'mob',ZE),x:m.x+.4-i*.8,y:m.y-.4,at:t0,z:1});
      const on=B.boss?rRand(3,5):B.mini?2:(Math.random()<.12?1:0); if(on) s.drops.push({k:'o',n:on,x:m.x-.4,y:m.y+.3,at:t0,z:1});
      const ik=MOB_ING[m.t]; const ni=B.boss?3:B.mini?2:(Math.random()<.32?1:0); if(ik&&ni) s.drops.push({k:'i',ik,n:ni,x:m.x+.2,y:m.y+.5,at:t0,z:1});
      if(DK&&!B.boss&&Math.random()<.1){ const t=M.T.get(Math.round(m.x)+','+Math.round(m.y)); const rg=t?t.rg:'plain'; const ex=rg==='plain'||rg==='earth'?(Math.random()<.5?'sroot':'twig'):DK_SPEC[rg]?DK_SPEC[rg][Math.floor(Math.random()*2)]:null; if(ex) s.drops.push({k:'i',ik:ex,n:1,x:m.x-.3,y:m.y-.3,at:t0,z:1}); } };
    const hurtMob=(m,dmg,crit,o)=>{ o=o||{}; if(!s.mobs.includes(m)) return; if(DK&&crit>0) dkQProg(s,'crit',1); m.hp-=dmg; m.hit=.18; m.aggro=true; const kb=o.noElem?0:(o.kb!=null?o.kb:1)*(m.boss?.15:.55); const dx=m.x-s.me.x, dy=m.y-s.me.y; if(kb>0) phKnock(m,dx,dy,kb*8.5);
      s.fx.push({k:'num',x:m.x,y:m.y,at:performance.now(),t:String(dmg),crit,sm:o.sm,lab:crit===2?'초치명타':crit===1?'약점':null,col:o.col||(crit===2?'#FF9A2A':crit?'#FFD54A':'#FFFFFF')}); if(!o.sm) s.fx.push({k:'spk',x:m.x,y:m.y,at:performance.now(),crit,c:MOB[m.t].c[0]}); if(!o.sm) wSfx(crit?'crit':'hit');
      const B0=MOB[m.t]; if(B0.summon&&!m.sum1&&m.hp<m.mhp*.55){ m.sum1=1; summon(m); } if(B0.summon&&!m.sum2&&m.hp<m.mhp*.25){ m.sum2=1; summon(m); }
      if(m.hp<=0){ const now=performance.now(); s.mobs=s.mobs.filter(x=>x!==m); s.dying.push({m,at:now}); s.loot.k++; s.rpg.kills=(s.rpg.kills||0)+1; if(DK) dkOnKill(s,m,dkApi); if(M.raid) raidOnKill(s,m); else { wQ('kill'); addXp(MOB[m.t].xp); dropLoot(m); } s.fx.push({k:'poof',x:m.x,y:m.y,at:now,c:MOB[m.t].c[0],big:m.boss||m.mini}); wSfx(MOB[m.t].kind==='slime'?'slime':'pop');
        if(m.boss&&!D.story){ s.boss[m.t]=now+(MOB[m.t].re||80)*1000; s.drops.push({k:'chest',tier:m.t==='kslime'?'silver':'gold',x:m.x,y:m.y,at:now,z:1}); }
        if(m.boss){ s.rpg.boss=(s.rpg.boss||0)+1; ssGain(s,s.M&&s.M.dk?0:1,'보스 처치'); wQ('boss'); say(MOB[m.t].n+' 처치! 보물 상자가 떨어졌어요'); haptic([30,40,80]); }
        if(!D.story&&!M.raid&&s.loot.k>0&&s.loot.k%25===0) s.drops.push({k:'chest',tier:'wood',x:m.x,y:m.y,at:now,z:1});
        if(D.story&&m.ar!=null&&!s.mobs.some(x=>x.ar===m.ar)) clearArea(m.ar); } };
    const summon=m=>{ for(let i=0;i<3;i++){ const a=i/3*6.28+Math.random(); const x=Math.round(m.x+Math.cos(a)*3), y=Math.round(m.y+Math.sin(a)*3); if(!blocked(x,y)){ const q=spawn('mush',x,y,[m.hx,m.hy],m.ar,i*160); q.aggro=true; } } say(MOB[m.t].n+'이(가) 부하를 불렀어요!'); wSfx('roar'); s.shake=.6; };
    /* v27.8 전투 코어 연결 */
    const api={hurtMob:(m,d,cr,o)=>hurtMob(m,d,cr,o),route:(a1,b1,c1,d1)=>route(a1,b1,c1,d1),blocked:(x,y)=>blocked(x,y),say:t=>say(t)};
    const mobBlk=(m,x,y)=>DK?!dkMobOK(M,m,x,y):blocked(Math.round(x),Math.round(y));
    const vOK=m=>!DK||Math.abs((s.me.z||0)-hAt(m.x,m.y))<1.7;
    const dkApi={...api,spawn:(t,x,y,home)=>spawn(t,x,y,home),gotGear:it=>gotGear(it)};
    if(DK){ s.say=say; s.onAtk=o=>dkGimHit(s,o,dkApi); }
    s.cbFire=dir=>cbFire(s,dir,api); s.cbSwap=()=>cbSwap(s,api); s.cbEquipW=id=>{ const G=s.rpg.gear; if(!gFind(G,id)) return; if(G.eq.w===id) return; if(G.eq.w2===id){ cbSwap(s,api); return; } G.eq.w2=G.eq.w; G.eq.w=id; cbSyncGear(s); s.cb.atkN=0; say(gName(s.st.w)+' 장착 · '+GW_HIT[s.st.W.hit]); s.fx.push({k:'cbswap',x:s.me.x,y:s.me.y,at:performance.now(),el:s.cb.elem}); wSfx('shield'); haptic([8,16]); }; s.cbWhet=()=>cbWhet(s,api); s.cbSkill=dir=>{ if(DK&&s.me.air){ s.me.glide=!s.me.glide&&s.gl.st>1; if(s.me.glide){ s.me.vz=0; } haptic(8); return true; } return cbSkill(s,dir,api); }; s.cbGuard=on=>{ if(DK&&s.me.air) return; cbGuard(s,on); }; s.cbUlt=()=>cbUltGo(s,api);
    s.attack=()=>s.cbFire(null);
    /* v28.1 요리 먹기 */
    s.eat=i=>{ const o=eatApply(s.rpg,i); if(!o) return false; s.rpg.food=o.food; s.rpg.buf=o.buf; const k=s.me.hp/(s.st.hp||1); s.st=cbStats(s.rpg); s.me.hp=Math.min(s.st.hp,Math.round(s.st.hp*k)+(o.heal||0)); if(s.cb) s.cb.elem=s.st.wel||s.cb.elem0;
      s.fx.push({k:'num',x:s.me.x,y:s.me.y,at:performance.now(),t:o.heal?'+'+o.heal:o.f.n,col:'#7CF0B5'}); s.fx.push({k:'cbring',x:s.me.x,y:s.me.y,r:1.4,at:performance.now(),el:'ice'}); say(o.f.n+' 냠!'+(o.note?' · '+o.note:'')); wSfx('gem'); haptic([10,20,10]); return true; };
    s.dirFromScreen=(dx,dy)=>{ const [a1,b1]=wJoyDir(dx,dy); const n=Math.hypot(a1,b1)||1; return [a1/n,b1/n]; };
    s.dirToPoint=(cx,cy)=>{ const r=el.getBoundingClientRect(); const [wx,wy]=unscr(cx-r.left,cy-r.top+u0()*5+(DK?(s.me.z-(s.cam.h||0))*DK_LV*s.cam.z:0)); const dx=wx-s.me.x, dy=wy-s.me.y, n=Math.hypot(dx,dy)||1; return [dx/n,dy/n]; };
    /* 깨진 석판 */
    { const T0=CB_TABLET[kind]; if(T0){ const p=safe(T0.x,T0.y)||[T0.x,T0.y]; s.tablet={i:T0.i,x:p[0],y:p[1],read:false}; M.blk.add(p[0]+','+p[1]); } }
    const hurtMe=(dmg,src)=>{ const me=s.me; if(me.dead) return; const now0=performance.now(); const R0=cbHurtMe(s,dmg,src,now0); if(R0.miss){ s.fx.push({k:'num',x:me.x,y:me.y,at:now0,t:'회피',col:'#FFB0B0',sm:1}); return; }
      if(R0.blocked){ s.fx.push({k:'blk',x:me.x,y:me.y,at:now0}); wSfx('block'); } else wSfx('hurt'); let d=R0.d; if(d<=0) return; if(s.stage&&s.stage.ai>=0) s.stage.hurt[s.stage.ai]=(s.stage.hurt[s.stage.ai]||0)+d;
      me.hp-=d; me.lastHit=performance.now(); if(src&&src.x!=null&&!R0.blocked){ const big=!!src.bigHit; phKnock(me,me.x-src.x,me.y-src.y,big?7:3.2); } s.fx.push({k:'num',x:me.x,y:me.y,at:performance.now(),t:(R0.crit?'치명 ':'')+'-'+d,col:R0.crit?'#FF2A4A':'#FF5A5A'}); s.shake=Math.min(1,(s.shake||0)+.4); haptic(18);
      if(me.hp<=0){ me.hp=0; me.dead=performance.now(); me.path=[]; const lost=Math.floor(s.loot.b*.3); s.loot.b-=lost; wSfx('die'); if(s.stage&&s.stage.ai>=0) s.stage.deaths[s.stage.ai]=(s.stage.deaths[s.stage.ai]||0)+1; say('쓰러졌어요… 아직 저장 안 된 벽돌 '+lost+'개를 잃었어요'); } };
    /* 다른 크루원(같은 세계에 있는 사람) */
    s.syncOthers=list=>{ const live=new Set(); list.forEach(o=>{ live.add(o.uid); let e=s.others.get(o.uid); if(!e){ e={x:o.x,y:o.y,yaw:0,ty:0,ph:0,walk:false,m:o.m}; s.others.set(o.uid,e); } e.uid=o.uid; e.m=o.m; e.cb=o.cb||null; e.co=o.co||null; e.tx=o.x; e.tY=o.y; e.say=o.say||null; }); for(const k of [...s.others.keys()]) if(!live.has(k)) s.others.delete(k); };
    let last=performance.now();
    const step=(o,vmax,dt)=>{ const [tx,ty]=o.path[0]; const dx=tx-o.x, dy=ty-o.y, d=Math.hypot(dx,dy); const want=Math.min(vmax,1.3+d*3+o.path.length); o.v=(o.v||0)+(want-(o.v||0))*Math.min(1,dt*8); const sp=o.v*dt;
      if(d<=sp){ o.x=tx; o.y=ty; o.path.shift(); } else { o.x+=dx/d*sp; o.y+=dy/d*sp; } o.ph=(o.ph||0)+sp*4.4; o.walk=true; if(d>.02) o.ty=Math.atan2(-dx,dy); if(!o.path.length) o.v=0; };
    const turn=(o,dt,k)=>{ let d=o.ty-o.yaw; while(d>Math.PI) d-=Math.PI*2; while(d<-Math.PI) d+=Math.PI*2; o.yaw+=d*Math.min(1,dt*k); };
    const frame=now=>{ if(dead) return; const dt=Math.max(0,Math.min(.05,(now-last)/1000)); last=Math.max(last,now); const tm=now/1000; const me=s.me;
      if(s.cb&&s.cb.hold>now){ draw(tm,now); raf=requestAnimationFrame(frame); return; }
      s.cdA=Math.max(0,s.cdA-dt); s.cdS=Math.max(0,s.cdS-dt); me.swing=Math.max(0,me.swing-dt/.32); me.blockT=Math.max(0,me.blockT-dt);
      if(!s.freeze) cbTick(s,dt,now,api);
      if(s.tablet&&!s.tablet.read&&!me.dead&&Math.hypot(me.x-s.tablet.x,me.y-s.tablet.y)<1.9){ s.tablet.read=true; const ti=s.tablet.i; if(ti>=0){ s.rpg.lore={...(s.rpg.lore||{}),['t'+ti]:1}; s.loreNew=1; } setTab({i:ti,k:Date.now()}); wSfx('gem'); haptic([10,30,20]); }
      if(me.dead){ if(now-me.dead>3000){ me.dead=0; me.hp=s.st.hp; me.x=s.spawnPt[0]; me.y=s.spawnPt[1]; me.path=[]; if(DK){ me.z=hAt(me.x,me.y); me.air=false; } say(D.story?'마지막으로 깬 구역에서 다시 일어났어요':'포털 앞에서 다시 일어났어요'); } }
      else if(s.freeze){ me.walk=false; }
      else { me.walk=false; const J=s.joy;
        if(J&&(Math.abs(J[0])>.12||Math.abs(J[1])>.12)){ me.path=[]; me.tgt=null; const mag=Math.min(1,Math.hypot(J[0],J[1])); const [wx,wy]=wJoyDir(J[0],J[1]); const want=4.4*s.st.spd*mag; me.v=(me.v||0)+(want-(me.v||0))*Math.min(1,dt*9); const sp=me.v*dt;
          const gk=DK&&me.air&&me.glide?1.25*(dkShN(s.dk)>=9?1.15:1):1; const nx=me.x+wx*sp*gk, ny=me.y+wy*sp*gk; const ok=(x,y)=>DK?dkCanGo(s,x,y):!blocked(Math.round(x),Math.round(y)); if(ok(nx,ny)){ me.x=nx; me.y=ny; } else if(ok(nx,me.y)) me.x=nx; else if(ok(me.x,ny)) me.y=ny; me.ty=Math.atan2(-wx,wy); me.walk=true; me.ph+=sp*4.4; }
        else if(me.path.length&&!me.air) step(me,4.4*s.st.spd,dt); else if(DK&&me.air&&me.glide){ const fx=-Math.sin(me.ty), fy=Math.cos(me.ty); const nx=me.x+fx*2.2*dt, ny=me.y+fy*2.2*dt; if(dkCanGo(s,nx,ny)){ me.x=nx; me.y=ny; } } turn(me,dt,12);
        if(DK) dkTick(s,dt,now,dkApi);
        if(me.walk&&now-(s.stepAt||0)>300){ s.stepAt=now; wSfx('step',.7); s.fx.push({k:'step',x:me.x,y:me.y,at:now}); }
        if(D.story){ D.areas.forEach((A,i)=>{ if(!s.stage.spawned[i]&&Math.hypot(me.x-A.c[0],me.y-A.c[1])<A.r-1.2) spawnArea(i); }); }
        if(me.tgt&&!me.path.length){ if(s.mobs.includes(me.tgt)&&Math.hypot(me.tgt.x-me.x,me.tgt.y-me.y)<2.4){ const t2=me.tgt; me.tgt=null; me.ty=Math.atan2(-(t2.x-me.x),t2.y-me.y); s.attack(); } else me.tgt=null; }
        if(now-me.lastHit>4000&&me.hp<s.st.hp) me.hp=Math.min(s.st.hp,me.hp+s.st.hp*.03*dt*3); }
      if(M.raid&&typeof raidTick==='function'){ if(!s.say) s.say=say; raidTick(s,dt,now,{hurtMe,onEnd:r=>setRaidRes(r)}); }
      if(!s.freeze) phTick(s,dt,{mobBlk,meOK:(x,y)=>DK?dkCanGo(s,x,y):!blocked(Math.round(x),Math.round(y))});
      /* 몬스터 */
      for(const m of (s.freeze?[]:s.mobs)){ const B=MOB[m.t]; if(m.born>now) continue; if(B.fix){ m.hit=Math.max(0,m.hit-dt); continue; } if(now-m.born<450){ m.mv=false; continue; } m.hit=Math.max(0,m.hit-dt); m.cd=Math.max(0,m.cd-dt); m.mv=false; const d=Math.hypot(me.x-m.x,me.y-m.y); const reach=.95+(B.sz-1)*.55;
        if(cbMobLocked(m,now)){ m.atk=0; m.slamT=0; m.dashT=0; m.dashing=0; continue; } const AV=m.atkV||B.atk; const SPM=cbMobSpd(m,now);
        if(!me.dead&&d<(m.boss?7.5:5.2)) m.aggro=true; if(me.dead||d>(m.boss?12:9)||Math.hypot(m.x-m.hx,m.y-m.hy)>(m.boss?9:14)) { if(m.aggro&&(me.dead||d>(m.boss?12:9))) m.aggro=false; }
        if(m.flee&&!me.dead){ const sp=B.spd*dt; const ax=(m.x-me.x)/(d||1), ay=(m.y-me.y)/(d||1); const nx=m.x+ax*sp, ny=m.y+ay*sp; if(!mobBlk(m,nx,ny)){ m.x=nx; m.y=ny; } else { const nx2=m.x-ay*sp, ny2=m.y+ax*sp; if(!mobBlk(m,nx2,ny2)){ m.x=nx2; m.y=ny2; } } m.ty=Math.atan2(-ax,ay); m.mv=true; turn(m,dt,8); continue; }
        if(m.atk>0){ m.atk+=dt/.5; if(m.atk>=1){ m.atk=0; if(!me.dead&&d<reach+.5&&vOK(m)) hurtMe(AV,m); } continue; }
        if(m.slamT>0){ m.slamT-=dt; if(m.slamT<=0){ s.fx.push({k:'slam',x:m.x,y:m.y,at:now,r:2.8}); s.shake=1; wSfx('slam'); if(!me.dead&&d<2.9&&vOK(m)) (m.bigHit=1,hurtMe(Math.round(AV*1.6),m),m.bigHit=0); if(s.cb&&s.cb.turret&&Math.hypot(s.cb.turret.x-m.x,s.cb.turret.y-m.y)<2.9) s.cb.turret.hp-=Math.round(AV*1.6); m.cd=1.2; cbAfterSlam(m,now); } continue; }
        if(m.dashT>0){ m.dashT-=dt; if(m.dashT<=0){ m.dashing=.45; } continue; }
        if(m.dashing>0){ m.dashing-=dt; const sp=11*dt; const nx=m.x+m.dx*sp, ny=m.y+m.dy*sp; if(!mobBlk(m,nx,ny)){ m.x=nx; m.y=ny; } m.mv=true; if(!me.dead&&Math.hypot(me.x-m.x,me.y-m.y)<1.6&&!m.dhit&&vOK(m)){ m.dhit=1; (m.bigHit=1,hurtMe(Math.round(AV*1.3),m),m.bigHit=0); } if(m.dashing<=0){ m.cd=1.5; cbAfterDash(m,now); } continue; }
        if(m.aggro&&!me.dead){ m.ty=Math.atan2(-(me.x-m.x),me.y-m.y);
          if(B.slam&&m.cd<=0&&d<4&&Math.random()<dt*.9){ m.slamT=1; m.cd=4.5; continue; }
          if(B.dash&&m.cd<=0&&d>3&&d<8&&Math.random()<dt*.8){ m.dashT=.7; m.dx=(me.x-m.x)/d; m.dy=(me.y-m.y)/d; m.dhit=0; m.cd=4; continue; }
          if(d<reach){ if(m.cd<=0){ m.atk=.001; m.cd=(1.1+Math.random()*.5)/cbMobAtkMul(m,now); } }
          else { const sp=B.spd*SPM*dt; const nx=m.x+(me.x-m.x)/d*sp, ny=m.y+(me.y-m.y)/d*sp; if(!mobBlk(m,nx,m.y)) m.x=nx; if(!mobBlk(m,m.x,ny)) m.y=ny; m.mv=true; } }
        else { if(m.path&&m.path.length){ const [tx,ty]=m.path[0]; const dx=tx-m.x, dy=ty-m.y, dd=Math.hypot(dx,dy); const sp=B.spd*.55*dt; if(dd<=sp){ m.x=tx; m.y=ty; m.path.shift(); } else { m.x+=dx/dd*sp; m.y+=dy/dd*sp; m.ty=Math.atan2(-dx,dy); } m.mv=true; }
          else { m.wait-=dt; if(m.wait<=0){ m.wait=2+Math.random()*4; const a=Math.random()*6.28, r=1+Math.random()*3.5; const tx=Math.round(m.hx+Math.cos(a)*r), ty=Math.round(m.hy+Math.sin(a)*r); if(!mobBlk(m,tx,ty)) m.path=[[tx,ty]]; } } }
        turn(m,dt,8); }
      if(now>s.fillAt){ s.fillAt=now+5000; fill(); }
      /* 전리품 줍기 */
      for(const p of s.drops){ const d=Math.hypot(p.x-me.x,p.y-me.y); const age=(now-p.at)/1000; p.z=Math.max(0,1-age*2.5);
        if(!me.dead&&age>.5&&d<2.6){ p.x+=(me.x-p.x)*Math.min(1,dt*7); p.y+=(me.y-p.y)*Math.min(1,dt*7); }
        if(!me.dead&&age>.5&&d<.5){ p.got=1; if(p.k==='b'){ s.loot.b+=p.n; s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:'+'+p.n,col:'#FFE08A',ic:'b'}); } else if(p.k==='c'){ s.loot.c+=p.n; s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:'+'+(p.n*W_GOLD_RATE)+' G',col:'#FFC233'}); } else if(p.k==='e'){ gotGear(p.it); }
          else if(p.k==='i'){ s.rpg.pt={...(s.rpg.pt||{}),[p.ik]:((s.rpg.pt||{})[p.ik]||0)+p.n}; s.loot.ing=(s.loot.ing||0)+p.n; s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:ING[p.ik].n+' +'+p.n,col:ING[p.ik].c,sm:1}); wSfx('pick'); }
          else if(p.k==='o'){ s.rpg.gear.ore=(s.rpg.gear.ore||0)+p.n; s.loot.ore+=p.n; if(DK) dkQProg(s,'ore',p.n); s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:'광석 +'+p.n,col:'#C9D3E6',sm:1}); wSfx('coin'); }
          else if(p.k==='chest'){ const got=chestRoll(p.tier,{stars:p.stars}); s.loot.b+=got.b; s.loot.c+=got.c; got.eq=got.eq.map(t=>gDrop(s.rpg.gear,t,{story:'earth',hell:'fire'}[kind]||null)); got.eq.forEach(it=>gotGear(it,true)); if(got.xp) addXp(got.xp); { const sf=(s.ssFx||[]).filter(x=>now-x.at<6000); if(sf.length){ got.ss=sf.reduce((a,x)=>a+x.n,0); s.ssFx=[]; } } s.freeze=true; me.path=[];
            setChest({tier:p.tier,got,stars:p.stars,title:p.label?p.label+' 클리어!':'전리품 상자',k:now}); }
          if(p.k==='b'||p.k==='c') wSfx('pick'); } }
      s.drops=s.drops.filter(p=>!p.got&&now-p.at<60000);
      for(const o of s.others.values()){ if(o.tx!=null){ const dx=o.tx-o.x, dy=o.tY-o.y, d=Math.hypot(dx,dy); if(d>20){ o.x=o.tx; o.y=o.tY; } else if(d>.05){ const sp=Math.min(d,4*dt); o.x+=dx/d*sp; o.y+=dy/d*sp; o.ty=Math.atan2(-dx,dy); o.walk=true; o.ph+=sp*4.4; } else o.walk=false; turn(o,dt,8); } }
      s.cam.x+=(me.x-s.cam.x)*Math.min(1,dt*5); s.cam.y+=(me.y-s.cam.y)*Math.min(1,dt*5); if(DK){ s.cam.h=(s.cam.h==null?me.z:s.cam.h)+(me.z-(s.cam.h==null?me.z:s.cam.h))*Math.min(1,dt*4); } s.cam.z+=(s.tz-s.cam.z)*Math.min(1,dt*6);
      draw(tm,now);
      if(now-(s.hudAt||0)>100){ s.hudAt=now; const bm=s.mobs.filter(m=>(m.boss||m.mini)&&m.aggro)[0];
        if(!D.story){ if(bm&&bm.boss&&!s.bossOn){ s.bossOn=1; wBgm('boss'); wSfx('roar'); } else if(!bm&&s.bossOn){ s.bossOn=0; wBgm(kind); } }
        setHud({party:s.cb&&s.cb.mode==='crew'?[...s.others.values()].filter(o=>o.cb&&o.cb.m==='crew').map(o=>({uid:o.uid,nick:o.m?dispName(o.m):'',role:o.cb.r,hp:o.cb.hp})):[],stage:D.story?{ai:s.stage.ai,left:s.mobs.filter(m=>m.ar===s.stage.ai).length,cl:Object.keys(s.stage.cleared).length,done:!!s.stage.done}:null,hp:Math.max(0,me.hp),mhp:s.st.hp,lv:s.rpg.lv,xp:s.rpg.xp,need:rpgNeed(s.rpg.lv),cdA:s.cdA/.5,cdS:s.st.cd?s.cdS/s.st.cd:0,blocking:me.blockT>0,shield:s.st.shield,boss:bm?{n:MOB[bm.t].n,hp:bm.hp/bm.mhp}:null,loot:{...s.loot,b:s.loot.b+((s.saved||{}).b||0),c:s.loot.c+((s.saved||{}).c||0),k:s.loot.k+((s.saved||{}).k||0),eq:s.loot.eq.slice()},dead:!!me.dead,dk:DK?dkHudData(s,now):null});
        if(s.qDone&&s.qDone.length){ const L=s.qDone; s.qDone=[]; L.forEach(q=>{ c.worldGold(q.gold,'의뢰 완료 · '+q.n+' '+q.need+' · 골드 +'+q.gold.toLocaleString()); wSfx('clear'); }); } }
      raf=requestAnimationFrame(frame); };
    const draw=(tm,now)=>{ const z=s.cam.z; g.setTransform(dpr,0,0,dpr,0,0);
      /* 배경: 연못물 · 용암이 천천히 일렁여요 */
      const BGc=DK?(s.inSh?DK_RG.und.sky:['#5FC0E8','#2E86C0']):D.bg; const bg=g.createLinearGradient(0,0,0,s.vh); bg.addColorStop(0,BGc[0]); bg.addColorStop(1,BGc[1]); g.fillStyle=bg; g.fillRect(0,0,s.vw,s.vh);
      if(kind==='hell'){ for(let i=0;i<8;i++){ const x=(wHash(i,2,2)*s.vw+Math.sin(tm*.4+i)*40), y=(wHash(i,5,5)*s.vh+Math.cos(tm*.3+i)*30); const rg=g.createRadialGradient(x,y,0,x,y,180); rg.addColorStop(0,'rgba(255,110,30,'+(.35+.15*Math.sin(tm*1.2+i))+')'); rg.addColorStop(1,'rgba(255,60,0,0)'); g.fillStyle=rg; g.fillRect(x-180,y-180,360,360); } }
      else { g.strokeStyle='rgba(255,255,255,.14)'; g.lineWidth=1.3; for(let i=0;i<26;i++){ const wx=(wHash(i,3,4)*s.vw*1.4+tm*10*(1+i%3))%(s.vw+80)-40, wy=wHash(i,8,2)*s.vh; g.beginPath(); g.moveTo(wx,wy); g.quadraticCurveTo(wx+8,wy-3,wx+16,wy); g.stroke(); } }
      const sh=(s.shake||0)*(s.cb?s.cb.ctl.shake:1); if(!sh&&s.shake) s.shake=0; if(sh>0){ s.shake=Math.max(0,sh-.06); g.translate((Math.random()-.5)*sh*8,(Math.random()-.5)*sh*6); }
      tileLayer();
      cbDrawGround(g,s,scr,WCF.TW*z/17,WCF.TW/2*z,WCF.TH/2*z,now,tm);
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
      { const put=o=>{ const [px,py]=scr(o.x,o.y); if(px<-80||px>s.vw+80||py<-120||py>s.vh+60) return; ents.push({d:o.x+o.y,k:'o',o,px,py}); }; if(M.och) dkObsEach(s,put); else for(const o of M.obs) put(o); }
      for(const m of s.mobs){ const [px,py]=scr(m.x,m.y); if(px<-120||px>s.vw+120||py<-160||py>s.vh+80) continue; ents.push({d:m.x+m.y+.03,k:'m',m,px,py}); }
      for(const p of s.drops){ const [px,py]=scr(p.x,p.y); ents.push({d:p.x+p.y+.01,k:'p',p,px,py}); }
      for(const [uid,o] of s.others){ const [px,py]=scr(o.x,o.y); ents.push({d:o.x+o.y+.04,k:'x',o,px,py}); }
      { const [px,py]=scr(s.portal[0],s.portal[1]); ents.push({d:s.portal[0]+s.portal[1],k:'portal',px,py}); }
      if(s.tablet){ const [px,py]=scr(s.tablet.x,s.tablet.y); ents.push({d:s.tablet.x+s.tablet.y,k:'tab',px,py}); }
      for(const gt of M.gates||[]){ const [px,py]=scr(gt.x,gt.y); if(px<-200||px>s.vw+200||py<-200||py>s.vh+200) continue; ents.push({d:gt.x+gt.y,k:'gate',gt,px,py}); }
      for(const dm of s.dying){ const [px,py]=scr(dm.m.x,dm.m.y); ents.push({d:dm.m.x+dm.m.y+.02,k:'dm',dm,px,py}); }
      { const [px,py]=scr(s.me.x,s.me.y,DK?s.me.z:undefined); ents.push({d:s.me.x+s.me.y+.05,k:'me',px,py}); if(DK&&s.me.air){ const [gx,gy]=scr(s.me.x,s.me.y); g.fillStyle='rgba(10,20,40,.25)'; g.beginPath(); g.ellipse(gx,gy,u*4,u*2,0,0,Math.PI*2); g.fill(); } }
      if(DK) dkEnts(s,scr,ents,s.vw,s.vh);
      ents.sort((a,b2)=>a.d-b2.d);
      const eqL=rpgEqLook(s.rpg);
      for(const e of ents){ const {px,py}=e;
        if(e.k==='o'){ if(e.o.wi) wDrawItem(g,e.o.t,px,py,u,tm,(Math.round(e.o.x)*7+Math.round(e.o.y))&255,e.o.lv||1); else if(e.o.rb) raidRubble(g,px,py,u,e.o.w||1); else dgDrawObs(g,e.o.t==='dkwall'?'dkwall_'+e.o.rg:e.o.t,px,py,u,tm,(e.o.x*7+e.o.y)&255); }
        else if(e.k==='m'&&M.raid&&(MOB[e.m.t].fix||MOB[e.m.t].kind==='rav')){ if(e.m.born<=now) raidDrawMob(g,s,e.m,px,py,u,tm,now); }
        else if(e.k==='dkg'||e.k==='dkt'||e.k==='dks'||e.k==='dko'||e.k==='dkb') dkDrawEnt(g,e,s,u,tm,now);
        else if(e.k==='tab'){ const rd=s.tablet.read; const gl=.5+.5*Math.sin(tm*2.4); wShadow(g,px,py+u*.3,u*4,u*1.8,.3); wCube(g,px,py,u,-2.6,-1,0,5.2,2,1.2,'#8E8778',{t:'#A9A291'}); wCube(g,px,py,u,-2.2,-.6,1.2,4.4,1.2,9,'#B8B2A2',{t:'#D2CCBC'});
          g.strokeStyle='rgba(60,50,40,.55)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(px-u*1.5,py-u*9); g.lineTo(px+u*.4,py-u*6); g.lineTo(px-u*.6,py-u*3.4); g.stroke();
          if(!rd){ const rg=g.createRadialGradient(px,py-u*7,0,px,py-u*7,u*12); rg.addColorStop(0,'rgba(140,220,255,'+(.35*gl)+')'); rg.addColorStop(1,'rgba(140,220,255,0)'); g.fillStyle=rg; g.fillRect(px-u*12,py-u*19,u*24,u*24); g.fillStyle='rgba(170,235,255,'+(.6+.4*gl)+')'; g.font='900 '+Math.max(12,u*3)+'px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.fillText('석판',px,py-u*15-gl*u); } }
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
          cbDrawMob(g,s,m,px,py,u,HW,HH,now,tm);
          if(m.hp<m.mhp||m.aggro){ const bw=Math.max(34,u*8*Math.min(sc,1.6)), by=py-u*(9*sc+2); g.fillStyle='rgba(10,10,16,.7)'; rr(g,px-bw/2-2,by-2,bw+4,8,4); g.fill(); g.fillStyle=m.boss?'#FF5A3D':'#7CD957'; rr(g,px-bw/2,by,bw*Math.max(0,m.hp/m.mhp),4,2); g.fill();
            if(m.boss||m.mini){ g.font='900 '+Math.max(10,u*2.2)+'px "NEXON Kart Gothic",sans-serif'; g.fillStyle='#fff'; g.textAlign='center'; g.fillText(B.n,px,by-8); } } }
        else if(e.k==='p'){ const p=e.p; const bob=Math.sin(tm*5+p.x)*u*.6-p.z*u*6; if(p.k==='b') wBrick(g,px,py-u*2+bob,u*.7); else if(p.k==='c'){ g.fillStyle='#FFB04A'; g.beginPath(); g.arc(px,py-u*3+bob,u*1.6,0,Math.PI*2); g.fill(); g.fillStyle='#FFE08A'; g.beginPath(); g.arc(px-u*.4,py-u*3.4+bob,u*.6,0,Math.PI*2); g.fill(); }
          else if(p.k==='chest'){ const T=CHEST[p.tier]||CHEST.wood; const gl=.5+.5*Math.sin(tm*4); g.save(); g.globalCompositeOperation='lighter'; const rg=g.createRadialGradient(px,py-u*3,0,px,py-u*3,u*12); rg.addColorStop(0,'rgba(255,230,150,'+(.35+gl*.25)+')'); rg.addColorStop(1,'rgba(255,230,150,0)'); g.fillStyle=rg; g.fillRect(px-u*12,py-u*15,u*24,u*24); g.restore();
            const by2=bob*.6; wShadow(g,px,py+u*.6,u*4,u*2); wCube(g,px,py-by2,u,-2.6,-1.8,0,5.2,3.6,3,T.c[1],{t:T.c[0],l:T.c[0],r:T.c[1]}); wCube(g,px,py-by2,u,-2.8,-2,3,5.6,4,1.6,T.c[0],{t:T.g,l:T.c[0],r:T.c[1]}); wCube(g,px,py-by2,u,-.5,1.75,1.8,1,.3,1.6,'#FFD54A',{t:'#FFF0A0',l:'#FFD54A',r:'#C99A1A'});
            for(let i=0;i<3;i++){ const a=tm*2+i*2.1; g.fillStyle='rgba(255,250,220,'+(.5+.5*Math.sin(a*1.5))+')'; g.fillRect(px+Math.cos(a)*u*4-u*.4,py-u*8+Math.sin(a)*u*2-by2-u*.4,u*.8,u*.8); } }
          else if(p.k==='i'){ const I0=ING[p.ik]||{c:'#fff'}; g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(px,py,u*1.8,u*.9,0,0,6.28); g.fill(); g.fillStyle=I0.c; g.beginPath(); g.arc(px,py-u*3+bob,u*1.7,0,6.28); g.fill(); g.fillStyle='rgba(255,255,255,.6)'; g.fillRect(px-u*.8,py-u*4+bob,u*.7,u*.7); g.strokeStyle='#171A3C'; g.lineWidth=1.2; g.beginPath(); g.arc(px,py-u*3+bob,u*1.7,0,6.28); g.stroke(); }
          else if(p.k==='o'){ g.fillStyle='#8E98A8'; g.beginPath(); g.moveTo(px-u*1.8,py-u*1.2+bob); g.lineTo(px-u*.6,py-u*3.6+bob); g.lineTo(px+u*1.6,py-u*3+bob); g.lineTo(px+u*1.9,py-u*1+bob); g.lineTo(px,py-u*.2+bob); g.closePath(); g.fill(); g.fillStyle='#E6EBF2'; g.fillRect(px-u*.6,py-u*2.8+bob,u*1.1,u*.9); g.fillStyle='#7CC2FF'; g.fillRect(px+u*.5,py-u*1.8+bob,u*.7,u*.7); }
          else { const T=EQ_TC[GR_T[(p.it||{}).r||0]]||EQ_TC.c; g.save(); g.shadowColor=T[0]; g.shadowBlur=u*4; g.fillStyle=T[0]; g.beginPath(); g.moveTo(px,py-u*7+bob); g.lineTo(px+u*2,py-u*4+bob); g.lineTo(px,py-u*1+bob); g.lineTo(px-u*2,py-u*4+bob); g.closePath(); g.fill(); g.restore(); g.fillStyle=T[2]; g.fillRect(px-u*.5,py-u*5.4+bob,u,u); } }
        else if(e.k==='x'){ const o=e.o; wDrawChar(g,px,py-(o.walk?Math.abs(Math.sin(o.ph*.5))*u*.6:0),u*.95,avatarOf(o.m),o.yaw,tm+o.x,o.walk,dispName(o.m),false,{ph:o.ph,on:true,eq:rpgEqLook(rpgOf(o.m))}); if(o.say&&Date.now()-o.say.at<7000) wBubble(g,px,py-u*21,o.say,u); }
        else if(e.k==='me'){ const me=s.me; if(me.dead){ g.globalAlpha=.45; } const bob=me.walk?Math.abs(Math.sin(me.ph*.5))*u*.6:0; if(s.cb&&s.cb.iframe>now) g.globalAlpha=.55; wDrawChar(g,px,py-bob,u*.95,avatarOf(c.me),me.yaw,tm,me.walk,null,true,{ph:me.ph,eq:eqL,swing:me.swing,block:!!(s.cb&&s.cb.guard)}); g.globalAlpha=1;
          cbDrawMe(g,s,px,py,u,HW,HH,now,tm); if(DK) dkDrawMe(g,s,px,py,u,tm);
          if(me.say&&Date.now()-me.say.at<7000) wBubble(g,px,py-u*21,me.say,u); }
      }
      cbDrawProj(g,s,u); if(M.raid&&typeof raidDrawPost==='function') raidDrawPost(g,s,scr,u,tm,now); if(typeof coopDraw==='function') coopDraw(g,s,scr,u,HW,HH,now); if(DK){ if(s.inSh&&typeof shDrawPost==='function') shDrawPost(g,s,scr,u,tm,now,dpr); dkDrawLabels(g,s,scr,u,tm); const ck=dkClock(); if(!s.inSh&&(ck.night||ck.voidN)){ g.setTransform(dpr,0,0,dpr,0,0); g.fillStyle=ck.voidN?'rgba(70,20,110,.32)':'rgba(20,30,70,.28)'; g.fillRect(0,0,s.vw,s.vh); } }
      /* 효과 */
      s.fx=s.fx.filter(f=>now-f.at<1100);
      for(const f of s.fx){ const [px,py]=scr(f.x,f.y); const k=(now-f.at)/1100; if(k<0) continue;
        if(cbDrawFx(g,f,px,py,k,u,HW,HH,s)) continue;
        if(f.k==='num'){ g.globalAlpha=1-Math.max(0,k-.6)/.4; const big=f.crit===2?1.45:f.crit?1.2:f.sm?.75:1; const pop=k<.12?1+(.12-k)*4:1; g.font='900 '+Math.round(Math.max(13,u*3.4)*big*pop)+'px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.lineWidth=f.crit?5:4; g.strokeStyle=f.crit===2?'rgba(90,30,0,.85)':'rgba(20,10,0,.75)'; const y=py-u*14-k*u*10;
          if(f.lab){ g.save(); g.font='900 '+Math.max(10,u*2.3)+'px "NEXON Kart Gothic",sans-serif'; g.lineWidth=3; g.strokeText(f.lab,px,y-u*5); g.fillStyle=f.col; g.fillText(f.lab,px,y-u*5); g.restore(); }
          g.strokeText(f.t,px,y); g.fillStyle=f.col; g.fillText(f.t,px,y); g.globalAlpha=1; }
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
    const up=e=>{ if(!dn) return; const moved=Math.hypot(e.clientX-dn.x,e.clientY-dn.y)>10; dn=null; if(moved||s.me.dead) return; if(s.freeze) return;
      if(e.pointerType==='mouse'&&e.button===0){ document.documentElement.classList.add('cb-pc'); s.cbFire(s.dirToPoint(e.clientX,e.clientY)); return; }
      const r=el.getBoundingClientRect(); const sx=e.clientX-r.left, sy=e.clientY-r.top;
      const hit=s.mobs.map(m=>{ const [px,py]=scr(m.x,m.y); return {m,d:Math.hypot(px-sx,py-(sy+u0()*5*MOB[m.t].sz))}; }).sort((a,b2)=>a.d-b2.d)[0];
      if(hit&&hit.d<Math.max(30,u0()*7*MOB[hit.m.t].sz)){ s.me.tgt=hit.m; const p=route(s.me.x,s.me.y,Math.round(hit.m.x),Math.round(hit.m.y)); if(p&&p.length){ p.pop(); s.me.path=p; } else s.attack(); return; }
      const [wx,wy]=unscr(sx,sy); s.me.tgt=null; s.go(Math.round(wx),Math.round(wy)); };
    const u0=()=>WCF.TW*s.cam.z/17;
    const wheel=e=>{ e.preventDefault(); s.tz=Math.max(.6,Math.min(1.8,s.tz*(e.deltaY>0?.9:1.1))); };
    el.addEventListener('pointerdown',down); el.addEventListener('pointerup',up); el.addEventListener('wheel',wheel,{passive:false});
    return ()=>{ dead=true; s.alive=false; cancelAnimationFrame(raf); ro.disconnect(); el.removeEventListener('pointerdown',down); el.removeEventListener('pointerup',up); el.removeEventListener('wheel',wheel); };
  },[]);
  /* 저장: 경험치 · 레벨 · 장비 가방은 회원 문서, 벽돌 · 골드는 내 섬 */
  const M0dk=()=>!!(S.current&&S.current.M&&S.current.M.dk);
  const commit=(final)=>{ const s=S.current; if(!s) return Promise.resolve(); const L=s.loot; const r=s.rpg;
    const b=L.b, cn=L.c, ore=L.ore||0; L.b=0; L.c=0; L.ore=0; const eq=L.eq.slice(); L.eq=[]; const xp=L.xp, k=L.k; L.xp=0; L.k=0;
    const jobs=[c.saveRpg(()=>({lv:r.lv,xp:r.xp,inv:r.inv,gear:r.gear,pt:r.pt||{},food:r.food||[],rcp:r.rcp||[],buf:r.buf||null,kills:r.kills||0,boss:r.boss||0,...(r.story?{story:r.story}:{}),...(r.lore?{lore:r.lore}:{}),...(r.life?{life:r.life}:{}),...(r.ss!=null?{ss:r.ss}:{}),...(r.dk&&M0dk()?{dk:r.dk}:{})}))];
    if(b) jobs.push(saveBricks(b)); if(cn) jobs.push(c.worldGold(Math.round(cn*W_GOLD_RATE*(1+lifePerk(r,'hn')))));
    s.saved=(s.saved||{b:0,c:0,eq:[],xp:0,k:0,ore:0}); s.saved.ore=(s.saved.ore||0)+ore; s.saved.b+=b; s.saved.c+=cn; s.saved.eq.push(...eq); s.saved.xp+=xp; s.saved.k+=k;
    return Promise.all(jobs).catch(()=>{}); };
  useEffect(()=>{ const iv=setInterval(()=>commit(false),45000); return ()=>clearInterval(iv); },[]);
  /* 같은 세계 접속자 표시 + 내 위치 알리기 */
  useEffect(()=>{ const s=S.current; if(!s) return; const list=(c.islands||[]).filter(I=>I.uid!==c.uid&&I.here&&I.here.zone===kind&&Date.now()-I.here.at<65000).map(I=>({uid:I.uid,x:I.here.x,y:I.here.y,say:I.here.say,cb:I.here.cb||null,co:I.here.co||null,m:c.members.find(m=>m.uid===I.uid)})).filter(o=>o.m&&!DG[kind].raid); s.syncOthers(list); });
  /* 크루 원정 인원: 내 파티원 중 같은 던전에 있는 사람 */
  const pty=(()=>{ try{ return typeof myLiveParty==='function'?myLiveParty(c):null; }catch(e){ return null; } })(); const ptyU=new Set(((pty&&pty.participants)||[]).map(x=>x.uid));
  const mates=(c.islands||[]).filter(I=>I.uid!==c.uid&&ptyU.has(I.uid)&&I.here&&I.here.zone===kind&&Date.now()-I.here.at<65000);
  const pCount=Math.min(4,1+mates.length); if(S.current) S.current.ptyN=pCount;
  const start=E=>{ const s=S.current; if(!s) return; const n=E.mode==='crew'?pCount:1; cbInit(s,E,n); s.mobs.forEach(m=>{ const k=m.hp/(m.mhp||1); cbMobInit(m,n); m.hp=Math.max(1,Math.round(m.mhp*k)); }); s.freeze=false; setEntry(E); wSfx('gate'); haptic([12,30,20]); setTimeout(()=>ping(),200); };
  useEffect(()=>{ const s=S.current; if(s) s.freeze=!entry||cedit||!!chest||!!sum||dmap||dset||dbag; },[entry,cedit,chest,sum,dmap,dset,dbag]);
  useEffect(()=>{ if(!DG[kind].dk) return; const f=e=>{ if(e.code==='KeyM'&&!(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))){ setDmap(v=>!v); } }; window.addEventListener('keydown',f); return ()=>window.removeEventListener('keydown',f); },[]);
  const dkWarp=p=>{ const s=S.current; if(!s) return; const M=s.M; if(s.inSh&&typeof shClear==='function'){ s.inSh=null; s.sh=null; s.updraft=[]; s.rgNow=null; shClear(M); } let tx=p.x, ty=p.y; if(p.k==='tw') tx+=2; else if(p.k==='st') ty+=2; else if(p.k==='sh'){ const S0=p.o; tx=S0.e[0]; ty=S0.e[1]; } else if(p.k==='home'){ tx=M.spawn[0]; ty=M.spawn[1]; }
    s.me.x=tx; s.me.y=ty; s.me.z=dkH(M,tx,ty); s.me.air=false; s.me.path=[]; s.cam.x=tx; s.cam.y=ty; s.cam.h=s.me.z; s.tc=null; s.spawnPt=[tx,ty]; s.mobs=s.mobs.filter(m=>m.boss||m.camp!=null); s.fx.push({k:'cbring',x:tx,y:ty,r:2,at:performance.now(),el:'ice',big:1}); wSfx('gate'); haptic([20,30,50]); setDmap(false); };
  const ping=()=>{ const s=S.current; if(s&&c.islandPing){ const h={at:Date.now(),x:Math.round(s.me.x*10)/10,y:Math.round(s.me.y*10)/10,zone:kind}; if(s.cb&&entry) h.cb={r:s.cb.role,hp:Math.round(Math.max(0,s.me.hp)/s.st.hp*100),m:s.cb.mode}; if(s.me.say&&Date.now()-s.me.say.at<60000) h.say=s.me.say; const co=typeof coopOut==='function'?coopOut(s):null; if(co&&Object.keys(co).length) h.co=co; s.lastPing=Date.now(); c.islandPing({here:h}); } };
  if(S.current) S.current.pingNow=()=>{ const s=S.current; if(!s) return; clearTimeout(s.pingT); s.pingT=setTimeout(ping,120); };
  useEffect(()=>{ const t=setTimeout(ping,600); const iv=setInterval(()=>{ const s=S.current; if(!s) return; const busy=(s.others&&s.others.size>0)||(entry&&entry.mode==='crew'); if(busy||Date.now()-(s.lastPing||0)>14000) ping(); },entry&&entry.mode==='crew'?3000:4000); return ()=>{ clearTimeout(t); clearInterval(iv); }; },[entry]);
  const sayD=(t,emo)=>{ t=String(t||'').trim().slice(0,60); if(!t) return; const s=S.current; if(!s) return; s.me.say={t,at:Date.now()}; ping(); c.sendMessage(t,'world'); };
  const stkD=id=>{ const s=S.current; if(!s) return; s.me.say={st:id,t:'',at:Date.now()}; ping(); c.sendSticker(id,'world'); };
  /* v29.5 약탈: 끝나면 바로 정산 (리포트 버튼과 상관없이 저장) */
  useEffect(()=>{ if(!raidRes||raidSv) return; setRaidSv(1); Promise.resolve(c.raidCommit?c.raidCommit(raidRes):true).then(()=>commit(true)).finally(()=>setRaidSv(2)); },[raidRes]);
  const leave=()=>{ const s0=S.current; if(s0&&s0.raid){ if(s0.raid.ph==='fight'){ raidSettle(s0,'leave',{onEnd:r=>setRaidRes(r)}); return; } if(s0.raid.ph==='enter'){ onExit(); return; } if(raidRes) return; }
    commit(true).then(()=>{}); const s=S.current; const sv=s&&s.saved; setSum({...(sv||{b:0,c:0,eq:[],xp:0,k:0}),ss:s&&s.rpg?Math.max(0,(s.rpg.ss||0)-(s.ss0||0)):0}); };
  useEffect(()=>{ if(!toast) return; const t=setTimeout(()=>setToast(null),2400); return ()=>clearTimeout(t); },[toast&&toast.k]);
  const H=hud; const pct=x=>Math.max(0,Math.min(100,x*100))+'%';
  return html`<div className=${'dg26 k-'+kind}>
    <canvas ref=${cv} className="dg26-cv" aria-label=${D.n}></canvas>
    ${D.raid&&S.current&&S.current.raid&&entry&&!raidRes?html`<${RaidHud} R=${S.current.raid} now=${performance.now()}/>`:null}
    <div className="dg26-top">
      <button className="dg26-x tap" onClick=${leave} aria-label="나가기"><${Icon} n="exit" s=${18} w=${2.4}/></button>
      <div className="dg26-me"><div className="dg26-nm"><em>Lv.${H.lv}</em><b>${D.n}</b>${entry?html`<span className=${'cb-rb r-'+entry.role} style=${{'--e1':CB_ELEM[entry.elem].c[0]}}><${Icon} n=${CB_ROLE[entry.role].ic} s=${11} w=${2.6}/>${CB_ROLE[entry.role].n}<i></i>${CB_ELEM[entry.elem].n}</span>`:null}</div>
        <div className="dg26-hp"><i style=${{width:pct(H.hp/H.mhp)}}></i><span>${Math.ceil(H.hp)} / ${H.mhp}</span></div>
        <div className="dg26-xp"><i style=${{width:pct(H.xp/H.need)}}></i></div></div>
      <div className="dg26-loot"><span><${BrickIc} s=${15}/>${H.loot.b}</span><span><${Icon} n="swords" s=${13} w=${2.4}/>${H.loot.k}</span>${H.loot.c?html`<span><${Coin} s=${13}/>${H.loot.c}</span>`:null}</div>
      <button className=${'dg30-chat tap'+(chat?' on':'')} onClick=${()=>setChat(!chat)} aria-label="채팅"><${Icon} n="chat" s=${18} w=${2.3}/></button>
      <button className="dg30-chat tap" onClick=${()=>setLore(true)} aria-label="세계관 도감"><${Icon} n="book" s=${17} w=${2.3}/></button>
    </div>
    <${CbParty} list=${H.party}/>
    ${entry?html`<${CoopPingBtn} S=${S} dk=${!!H.dk} n=${(S.current&&S.current.others)?S.current.others.size:0}/>`:null}
    ${H.dk?html`<${DkHud} S=${S} H=${H.dk} onMap=${()=>setDmap(true)} onBag=${()=>setDbag(true)} onSetl=${()=>setDset(true)}/>`:null}
    ${dmap?html`<${DkMap} S=${S} c=${c} onClose=${()=>setDmap(false)} onWarp=${dkWarp} onBag=${()=>{ setDmap(false); setDbag(true); }}/>`:null}
    ${dbag?html`<${WBag} c=${c} dg=${S} smith=${!!(S.current&&S.current.atSetl)} onClose=${()=>setDbag(false)} onMap=${DG[kind].dk?()=>setDmap(true):null}/>`:null}
    ${dset?html`<${DkSetl} S=${S} c=${c} onClose=${()=>setDset(false)}/>`:null}
    ${H.stage?html`<div className="st30-hud"><div className="st30-dots">${D.areas.map((A,i)=>html`<i key=${A.id} className=${(i<H.stage.cl?'ok':i===H.stage.ai?'cur':'')+(A.boss?' boss':'')}>${A.boss?html`<${Icon} n="crown" s=${10} w=${2.6}/>`:i+1}</i>`)}</div>
      <b>${H.stage.done?'1장 클리어!':H.stage.ai<0?'숲 입구로 들어가요':D.areas[H.stage.ai].id+' '+D.areas[H.stage.ai].n}</b>${H.stage.ai>=0&&!H.stage.done?html`<small>${H.stage.left?'남은 몬스터 '+H.stage.left:'다음 문이 열렸어요 →'}</small>`:null}</div>`:null}
    ${ar?html`<div className=${'st30-ban'+(ar.clear?' clr':'')+(ar.boss?' boss':'')} key=${ar.k} onAnimationEnd=${()=>setAr(null)}><em>${ar.clear?'STAGE CLEAR':ar.boss?'BOSS STAGE':'STAGE'}</em><b>${ar.id} ${ar.n}</b>${ar.clear?html`<span className="st30-stars">${[0,1,2].map(i=>html`<${Icon} key=${i} n="star" s=${22} w=${2} fill=${i<ar.stars?'currentColor':'none'}/>`)}</span>`:null}</div>`:null}
    ${chat?html`<${WChat} c=${c} onSay=${sayD} onSticker=${stkD} onClose=${()=>setChat(false)} where=${D.n+'에서 · 말풍선으로 떠요'}/>`:null}
    <${WKeys} on=${!!entry&&!chat&&!sum&&!chest&&!cedit} onMove=${(x,y)=>{ const s=S.current; if(s) s.joy=[x,y]; }} onKey=${null}/>
    <${CombatPad} S=${S} role=${entry?entry.role:'dealer'} hidden=${!entry||chat||!!sum||!!chest||cedit||dmap||dset||dbag} onEdit=${()=>setCedit(true)}/>
    ${!entry&&!sum?html`<${CbEntry} c=${c} kind=${kind} party=${pCount} onStart=${start} onLore=${()=>setLore(true)}/>`:null}
    ${cedit?html`<${ControlEditor} onClose=${()=>setCedit(false)}/>`:null}
    ${lore?html`<${WLore} c=${c} got=${(S.current&&S.current.rpg&&S.current.rpg.lore)||rpgOf(c.me).lore||{}} onClose=${()=>setLore(false)}/>`:null}
    ${tab?html`<div className="cbt" key=${tab.k} onClick=${()=>setTab(null)}><div className="cbt-c"><em>${tab.i>=0?'깨진 석판 · '+CB_LORE.guard[tab.i][1]:'깨진 석판'}</em><p>${tab.i>=0?CB_LORE.guard[tab.i][4]:CB_TABLET0}</p><small>${tab.i>=0?'세계관 도감 · 수호자에 기록됐어요':'탭해서 닫기'}</small></div></div>`:null}
    ${chest?html`<${ChestOpen} key=${chest.k} tier=${chest.tier} got=${chest.got} stars=${chest.stars} title=${chest.title} onDone=${()=>{ setChest(null); const s=S.current; if(s) s.freeze=false; commit(false); }}/>`:null}
    ${H.boss?html`<div className="dg26-boss" key=${H.boss.n}><b>${H.boss.n}</b><div><i style=${{width:pct(H.boss.hp)}}></i></div></div>`:null}
    ${toast?html`<div className=${'dg26-toast'+(S.current&&S.current.dkBanner&&performance.now()-S.current.dkBanner.k<3600?' lo':'')} key=${toast.k}>${toast.t}</div>`:null}
    ${H.dead?html`<div className="dg26-dead"><b>쓰러졌어요</b><small>잠시 뒤 포털 앞에서 다시 일어나요</small></div>`:null}
    ${raidRes?html`<${RaidReport} res=${raidRes} saving=${raidSv<2} onDone=${onExit}/>`:null}
    ${sum?html`<div className="dg26-sum dg29-sum"><div className="dg26-sc dg29-sc">
      <div className="dg29-hd" style=${{'--g1':(D.col||['#5FB8FF','#2577E8'])[0],'--g2':(D.col||['#5FB8FF','#2577E8'])[1]}}><em>${D.e}</em><b>모험 결과</b><small>${D.n}</small></div>
      <div className="dg29-g">
        <div style=${{'--d':'80ms'}}><${BrickIc} s=${24}/><b>${sum.b.toLocaleString()}</b><small>벽돌 · 내 섬으로</small></div>
        <div style=${{'--d':'160ms'}}><${Icon} n="swords" s=${22}/><b>${sum.k}</b><small>처치</small></div>
        <div style=${{'--d':'240ms'}}><${Icon} n="star" s=${22}/><b>${sum.xp}</b><small>경험치</small></div>
        ${sum.c?html`<div style=${{'--d':'320ms'}}><${GoldIc} s=${24}/><b>${(sum.c*W_GOLD_RATE).toLocaleString()}</b><small>골드</small></div>`:null}
        ${sum.ss?html`<div className="ss" style=${{'--d':'400ms'}}><${SsIc} s=${24}/><b>${sum.ss}</b><small>정령석</small></div>`:null}
        ${sum.ore?html`<div style=${{'--d':'480ms'}}><${Icon} n="ore" s=${22}/><b>${sum.ore}</b><small>광석</small></div>`:null}</div>
      ${sum.eq.length?html`<div className="dg29-eq"><span className="dg29-lb">새 장비 ${sum.eq.length}</span>${sum.eq.map((it,i)=>html`<span key=${i} className=${'dg29-it t-'+GR_T[it.r]} style=${{'--d':(500+i*90)+'ms'}}><i><${Icon} n=${gDef(it).ic} s=${16} w=${2.4}/></i><b>${gName(it)}</b><small>${GR_N[it.r]}</small></span>`)}</div>`:null}
      <button className="tap dg29-go" onClick=${onExit}><${Icon} n="home" s=${18} w=${2.4}/>DKO 월드로 돌아가기</button></div></div>`:null}
  </div>`;
}
/* ── 장비 · 스킨 편집 ── */
function CharEdit({c,onClose,tab:t0,onBag}){
  const [tab,setTab]=useState(t0||'eq'); const me=c.me; const r=rpgOf(me); const st=cbStats(r); const [sel,setSel]=useState('weapon');
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
    :html`<div className="ce26-eq ce79">
      ${(()=>{ const E=gEquipped(gearOf(r)); return html`<div className="ce79-l">${[['w','주 무기'],['w2','보조 무기'],['h','투구'],['a','갑옷'],['g','각반']].map(([k,n])=>{ const x=E[k]; return html`<span key=${k} className=${'t-'+(x?GR_T[x.r]:'none')}><${Icon} n=${x?gDef(x).ic:'plus'} s=${15} w=${2.3}/><small>${n}</small><b>${x?gName(x):'비어 있음'}</b></span>`; })}</div>`; })()}
      <button className="ce79-go tap" onClick=${()=>{ onClose(); onBag&&onBag(); }}><${Icon} n="bag" s=${18} w=${2.4}/>가방 · 대장간 열기</button>
      <p className="ce26-tip">무기 7종 · 방어구 3부위 · 4등급(일반 · 희귀 · 영웅 · 전설)이에요. 던전 몬스터 · 보스 · 상자에서 나오고, 상점에서 일반 · 희귀 장비를 살 수 있어요.</p>
    </div>`}
  </div></div>`;
}

/* ═════════ v26.4 DKO 월드 대개편: NPC · 문 들어가기 · 마을회관 안 · 채팅 · 설정 · 조이스틱 · 전리품 상자 ═════════ */
const wCtl=()=>lsGet('dko-wctl','touch');
const wFps=()=>lsGet('dko-wfps','60');
/* v29.7 시점: 기본(넓게) · 캐릭터 중심(가까이 따라가요) */
const wZoomK=()=>lsGet('dko-wzoom','std')==='near'?1.65:1;
const wSfx=(k,v)=>{ try{ window.DKOSfx&&window.DKOSfx.fx(k,v); }catch(e){} };
const wBgm=k=>{ try{ window.DKOSfx&&window.DKOSfx.bgm(k); }catch(e){} };
/* 소셜 아일랜드 주민(NPC): 집 근처를 거닐고, 누르면 말을 걸어요 */
const W_NPC=[
  {id:'sera',n:'안내원 세라',av:{base:'sera'},home:[1,0],r:2,c:'#FF8FB0',lines:['처음이라면 던전에 들어갈 때 역할(탱커 · 딜러 · 힐러)과 원소를 골라 보세요!','공격 버튼을 짧게 누르면 자동 조준, 끌면 바닥에 사거리가 보여요.','DKO 월드에 온 걸 환영해요!','명소 문 앞에 서면 문이 반짝여요. 눌러서 들어가 보세요.','내 섬은 아래 가운데 집 버튼으로 바로 가요.','동화 숲 포털에서 스토리 모드를 할 수 있어요!']},
  {id:'toby',n:'상인 토비',av:{base:'gear'},home:[-4,-3],r:2,c:'#FFB15C',lines:['장비든 생산품이든 다 사요! 골드는 월드 어디서나 통한답니다.','D-Coin을 골드로 바꾸려면 상점 환전소로! 소셜 아일랜드에서만 열려요.','어서 와요! DKO 상점은 바로 뒤예요.','오늘의 특가 봤어요? 금방 사라져요!','벽돌은 공방에서 모으는 게 제일 빨라요.','새 건물 크기는 상점에서 2×2처럼 보여 줘요.']},
  {id:'pipi',n:'우체부 피피',av:{base:'robot',color:'pink'},home:[-1,2],r:3,c:'#7CC2FF',gift:1,lines:['삐빅. 저와 경비 로봇은 폭풍 유적 공학자가 만든 자동 인형이에요. 편지 배달은 자신 있어요!','편지 왔어요~ 오늘 선물은 벽돌이에요!','크루원 섬에 놀러 가면 섬마다 벽돌을 줘요.','채팅 카페에선 월드 채팅도 같이 볼 수 있어요.']},
  {id:'owl',n:'박사 아울',av:{base:'owl'},home:[8,5],r:2,c:'#C29BFF',lines:['나는 고대 기록관의 후예라네. 깨진 석판을 찾으면 내게… 아니, 세계관 도감에 적어 두게.','대균열이 난 날, 『이음』은 첨탑에 갇히길 거부했지. 다섯 번째 빛… 언젠간 다시 이어질 걸세.','던전마다 깨진 석판이 하나씩 묻혀 있다네. 가까이 가면 글자가 떠오르지.','동화 숲 1-4에는 거대한 버섯왕이 살아요.','보스가 땅을 내려치기 전에 빨간 원이 나타나요. 방패를 드세요!','상자는 별을 많이 받을수록 좋은 게 나와요.']},
  {id:'guard',n:'경비 로봇',av:{base:'robot',color:'orange'},home:[7,-3],r:2,c:'#FF6B4A',lines:['삐— 경고. 보스는 내려찍기나 돌진 직후 약점이 열립니다. 노란 경직 게이지를 채워도 열립니다.','지옥 몬스터에게 맞으면 화상을 입습니다. 힐러의 치유의 파동으로 지우십시오.','헬바운드는 Lv.5부터 추천해요.','지옥 포털 근처는 뜨거우니 조심!','골드 장비는 헬바운드 보스가 떨어뜨려요.']},
  {id:'mia',n:'꽃집 미아',av:{base:'nova'},home:[5,8],r:2,c:'#7CF0B5',lines:['꽃은 여백에 지워지지 않으려고 더 진하게 피어요. 예쁘죠?','꽃밭은 밟아도 괜찮아요. 금방 다시 펴요.','벚꽃나무는 스페셜 장식이에요. 밤에 더 예뻐요.','섬을 꾸미면 랭킹 점수가 올라가요.']}
];
const npcGiftKey=()=>'dko-npc-gift-'+dayKey();
/* 명소 문 앞: 문이 열리듯 빛나는 효과 */
function wLmDoorGlow(g,ox,oy,u,tm,l){ const k=.5+.5*Math.sin(tm*4); g.save(); g.globalCompositeOperation='lighter';
  const x=ox-u*1.4*(l&&l.f?-1:1), y=oy+u*4.8; const rg=g.createRadialGradient(x,y,0,x,y,u*9); rg.addColorStop(0,'rgba(255,230,160,'+(.45+k*.25)+')'); rg.addColorStop(1,'rgba(255,200,120,0)'); g.fillStyle=rg; g.beginPath(); g.ellipse(x,y,u*9,u*5,0,0,Math.PI*2); g.fill();
  g.restore(); for(let i=0;i<5;i++){ const a=tm*1.5+i*1.26; const r=u*(4+((tm*.6+i*.2)%1)*4); g.fillStyle='rgba(255,245,200,'+(.7-((tm*.6+i*.2)%1)*.7)+')'; g.fillRect(x+Math.cos(a)*r-u*.35,y-u*2-((tm*.6+i*.2)%1)*u*8-u*.35,u*.7,u*.7); } }
/* v29.1 걸어서 통과하는 포털: 바닥 소용돌이 + 빨려 드는 빛 알갱이 */
const wHexA=(h,a)=>{ const n=parseInt(h.slice(1),16); return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+Math.max(0,Math.min(1,a)).toFixed(3)+')'; };
function wPortalVeil(g,ox,oy,u,tm,l,near){ const x=ox-u*1.4, y=oy+u*4.6; const c0=l.c[0]; g.save(); g.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){ const k=(tm*.55+i/3)%1; g.strokeStyle=wHexA(c0,(1-k)*(near?.75:.45)); g.lineWidth=u*(.5-k*.3); g.beginPath(); g.ellipse(x,y,u*(6.5-k*5),u*(3.2-k*2.5),0,0,Math.PI*2); g.stroke(); }
  for(let i=0;i<10;i++){ const k=(tm*.45+i*.1)%1; const a=tm*2+i*.63; const r=u*(6-k*5.5); g.fillStyle=wHexA(i%2?'#FFFFFF':c0,(1-k)*.85); g.fillRect(x+Math.cos(a)*r-u*.3,y+Math.sin(a)*r*.5-u*.3-k*u*6,u*.6,u*.6); }
  if(near){ const rg=g.createRadialGradient(x,y,0,x,y,u*6); rg.addColorStop(0,wHexA(c0,.5)); rg.addColorStop(1,wHexA(c0,0)); g.fillStyle=rg; g.beginPath(); g.ellipse(x,y,u*6,u*3,0,0,Math.PI*2); g.fill(); }
  g.restore(); }
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
    <form className="wc26-f" onSubmit=${send}><button type="button" className=${'wc30-stb tap'+(tray?' on':'')} onClick=${()=>setTray(!tray)} aria-label="내 이모티콘"><${Icon} n="smile" s=${19} w=${2.2}/></button><input value=${txt} maxLength=${60} placeholder=${tab==='world'?'내 주변에 말하기':'메인 채팅에 보내기'} onInput=${e=>setTxt(e.target.value)} enterKeyHint="send"/><button className="tap" type="submit" disabled=${!txt.trim()} aria-label="보내기"><${Icon} n="send" s=${18} w=${2.4}/></button></form>
  </div>`;
}
/* 월드 설정: 조작 · 소리 · 부드러움 */
function WSet({onClose}){
  const [sky,setSky]=useState(()=>lsGet('dko-wday','auto')); useEffect(()=>{ window.__wDay=sky==='day'; },[sky]);
  const [ctl,setCtl]=useState(wCtl()); const [fps,setFps]=useState(wFps()); const [zm,setZm]=useState(lsGet('dko-wzoom','std')); const [bgm,setBgm]=useState(lsGet('dko-bgm','on')!=='off'); const [sfx,setSfx]=useState(lsGet('dko-sfx','on')!=='off'); const [vol,setVol]=useState(()=>{ const n=Number(lsGet('dko-bgmv','0.55')); return isFinite(n)?n:.55; });
  const Opt=({v,cur,set,k,ic,t,d})=>html`<button className=${'ws30-o tap'+(cur===v?' on':'')} onClick=${()=>{ set(v); lsSet(k,v); haptic(8); window.dispatchEvent(new Event('dko-wset')); }}><span className="ws30-oi"><${Icon} n=${ic} s=${20} w=${2.2}/></span><b>${t}</b><small>${d}</small></button>`;
  return html`<div className="wb20-shade" onClick=${onClose}><div className="wbs ws30" onClick=${e=>e.stopPropagation()}>
    <div className="wbs-h"><b>월드 설정</b><span className="wbs-sub">조작 · 소리 · 화면</span><button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="ws83-row"><div className="ws30-lb">이동 방법</div><div className="ws30-g"><${Opt} v="touch" cur=${ctl} set=${setCtl} k="dko-wctl" ic="target" t="터치" d="땅을 눌러 걸어가요"/><${Opt} v="joy" cur=${ctl} set=${setCtl} k="dko-wctl" ic="pad" t="조이스틱" d="왼쪽 아래 스틱으로 움직여요"/></div></div>
    <div className="ws83-row"><div className="ws30-lb">하늘</div><div className="ws30-g"><${Opt} v="auto" cur=${sky} set=${setSky} k="dko-wday" ic="moon" t="실제 시간" d="저녁엔 노을, 밤엔 별빛"/><${Opt} v="day" cur=${sky} set=${setSky} k="dko-wday" ic="sun" t="항상 낮" d="언제나 맑은 낮"/></div></div>
    <div className="ws83-row"><div className="ws30-lb">시점</div><div className="ws30-g"><${Opt} v="std" cur=${zm} set=${setZm} k="dko-wzoom" ic="map" t="기본 시점" d="섬과 주변을 넓게 봐요"/><${Opt} v="near" cur=${zm} set=${setZm} k="dko-wzoom" ic="user" t="캐릭터 중심" d="내 캐릭터를 크게 따라가요"/></div></div>
    <div className="ws83-row"><div className="ws30-lb">부드러움</div><div className="ws30-g"><${Opt} v="60" cur=${fps} set=${setFps} k="dko-wfps" ic="bolt" t="부드럽게" d="초당 60번 그려요"/><${Opt} v="30" cur=${fps} set=${setFps} k="dko-wfps" ic="vibe" t="절전" d="배터리 · 발열을 줄여요"/></div></div>
    <div className="ws30-lb ws83-lb">소리</div>
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
/* v27.5 화면 기준 이동: 조이스틱(또는 WASD)을 미는 방향 그대로, 어느 방향이든 화면에서 같은 빠르기로 움직여요.
   (예전엔 월드 칸 기준으로 맞춰서 위아래는 느리고 좌우는 빨랐어요) 대각선 칸 방향 = 1 */
const wJoyDir=(dx,dy)=>{ const d=Math.hypot(dx,dy)||1; const a=dx/d/(WCF.TW/2), b=dy/d/(WCF.TH/2); const K=33; return [(a+b)/2*K,(b-a)/2*K]; };
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
      <div className="hr30-eq">${(()=>{ const E=gEquipped(gearOf(R)); return [['w','무기','sword'],['h','투구','crown'],['a','갑옷','shieldck'],['g','각반','boot']].map(([k,n,ic])=>{ const it=E[k]; return html`<span key=${k} className=${'t-'+(it?GR_T[it.r]:'none')}><${Icon} n=${it?gDef(it).ic:ic} s=${15} w=${2.3}/><small>${it?gName(it):n+' 없음'}</small></span>`; }); })()}</div>
      <p className="hr30-tip">공격력 ${st.atk} · 체력 ${st.hp} · 방어 ${st.def}${st.shield?' · 방패 막기 '+Math.round(st.block*100)+'%':''}</p>
    </div>
  </div>`;
}
/* 전리품 상자: 등급별로 흔들리다 열리고, 받은 것이 하나씩 튀어나와요 */
const CHEST={wood:{n:'나무 상자',c:['#C98A4E','#7A4E2C'],g:'#FFE0B8'},silver:{n:'은빛 상자',c:['#E6EBF2','#8E98A8'],g:'#FFFFFF'},gold:{n:'황금 상자',c:['#FFD54A','#C98A00'],g:'#FFF6C2'},legend:{n:'전설 상자',c:['#C29BFF','#5A32C8'],g:'#F0E2FF'}};
function chestRoll(tier,ctx){ const r=Math.random; const o={b:0,c:0,eq:[],xp:0};
  /* v27.9: eq에는 등급 굴림표 이름이 들어가요 (던전에서 실제 장비로 바꿔요) */
  if(tier==='wood'){ o.b=rRand(40,80); o.xp=12; if(r()<.3) o.eq.push('mob'); }
  else if(tier==='silver'){ o.b=rRand(130,220); o.c=r()<.5?rRand(1,3):0; o.xp=30; o.eq.push('elite'); }
  else if(tier==='gold'){ o.b=rRand(320,520); o.c=rRand(3,6); o.xp=70; o.eq.push('elite'); if(r()<.5) o.eq.push('elite'); }
  else { o.b=rRand(800,1100); o.c=rRand(8,12); o.xp=150; o.eq.push('boss'); o.eq.push('shrine'); }
  if(ctx&&ctx.stars){ o.b=Math.round(o.b*(1+(ctx.stars-1)*.25)); } return o; }
function ChestOpen({tier,got,title,stars,onDone}){
  /* v29.1 보상 화면: 상자가 흔들리다 열리고(누르면 바로) 보상이 카드로 한 장씩 뒤집혀요 */
  const T=CHEST[tier]||CHEST.wood; const [ph,setPh]=useState(0); const tRef=useRef(0);
  const open=()=>{ if(ph) return; clearTimeout(tRef.current); setPh(1); wSfx('chest'); haptic([20,40,80]); };
  useEffect(()=>{ tRef.current=setTimeout(open,800); return ()=>clearTimeout(tRef.current); },[]);
  const items=[got.b?{ic:'brick',n:got.b.toLocaleString(),l:'벽돌'}:null,got.c?{ic:'coin',n:(got.c*W_GOLD_RATE).toLocaleString(),l:'골드'}:null,got.xp?{ic:'star',n:'+'+got.xp,l:'경험치'}:null,got.ss?{ic:'ss',n:'+'+got.ss,l:'정령석',tier:'ss'}:null,
    ...got.eq.map(it=>typeof it==='string'?null:({ic:'eq',n:gName(it),l:GR_N[it.r],tier:GR_T[it.r],gi:gDef(it).ic,el:gElemOf(it)}))].filter(Boolean);
  const best=items.some(x=>x.tier==='l')?'l':items.some(x=>x.tier==='e')?'e':'';
  return html`<div className=${'ch30 ch29 t-'+tier+(ph?' open':'')+(best?' best-'+best:'')} style=${{'--c1':T.c[0],'--c2':T.c[1],'--cg':T.g}} onClick=${e=>{ e.stopPropagation(); if(ph) onDone(); else open(); }}>
    <div className="ch30-rays"></div><div className="ch29-burst" aria-hidden="true">${ph?[0,1,2,3,4,5,6,7,8,9,10,11].map(i=>html`<i key=${i} style=${{'--a':i*30+'deg','--r':(60+(i%3)*24)+'px'}}></i>`):null}</div>
    <div className="ch30-in">
      ${title?html`<em className="ch30-ti">${title}</em>`:null}
      ${stars!=null?html`<div className="ch30-stars">${[0,1,2].map(i=>html`<${Icon} key=${i} n="star" s=${30} w=${2} fill=${i<stars?'currentColor':'none'}/>`)}</div>`:null}
      <div className="ch30-box"><i className="ch30-lid"></i><i className="ch30-body"></i><i className="ch30-lock"></i><i className="ch30-glow"></i></div>
      <b className="ch30-n">${T.n}</b>
      ${ph?html`<div className="ch29-cards">${items.map((x,i)=>html`<span key=${i} className=${'ch29-c'+(x.tier?' t-'+x.tier:'')} style=${{'--d':(i*110+120)+'ms','--ec':x.el&&GE_EL[x.el]?GE_EL[x.el].c:'transparent'}}>
          <span className="ch29-ic">${x.ic==='brick'?html`<${BrickIc} s=${26}/>`:x.ic==='coin'?html`<${GoldIc} s=${26}/>`:x.ic==='ss'?html`<${SsIc} s=${26}/>`:html`<${Icon} n=${x.ic==='eq'?(x.gi||'shield'):'star'} s=${24} w=${2.3}/>`}</span>
          <b>${x.n}</b><small>${x.l}</small></span>`)}</div><small className="ch30-tap">눌러서 계속</small>`:html`<small className="ch30-tap">눌러서 바로 열기</small>`}
    </div></div>`;
}
/* 방패: 육각 에너지 막 (장비 등급 색) + 도는 빛줄기 */
function wHexShield(g,x,y,u,tm,k,tier){ const T=EQ_TC[tier]||EQ_TC.b; const R=u*7.4; g.save(); g.globalAlpha=.4+.5*k;
  const hex=(r,rot)=>{ g.beginPath(); for(let i=0;i<=6;i++){ const a=i/6*6.2832+rot; const px=x+Math.cos(a)*r, py=y+Math.sin(a)*r*1.12; i?g.lineTo(px,py):g.moveTo(px,py); } g.closePath(); };
  const rg=g.createRadialGradient(x,y,R*.15,x,y,R); rg.addColorStop(0,'rgba(170,225,255,.04)'); rg.addColorStop(1,'rgba(170,225,255,.34)'); g.fillStyle=rg; hex(R,Math.PI/6); g.fill(); g.strokeStyle=T[0]; g.lineWidth=2.6; g.stroke();
  g.strokeStyle='rgba(255,255,255,.9)'; g.lineWidth=3; for(let i=0;i<3;i++){ const a=tm*2.6+i*2.094; g.beginPath(); g.ellipse(x,y,R*1.02,R*1.14,0,a,a+.55); g.stroke(); }
  g.globalAlpha=(.16+.14*Math.sin(tm*6))*k+.1; g.strokeStyle='#D6F1FF'; g.lineWidth=1; for(let i=0;i<6;i++){ const a=i/6*6.2832+Math.PI/6; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*R,y+Math.sin(a)*R*1.12); g.stroke(); } hex(R*.52,Math.PI/6); g.stroke();
  g.restore(); }

/* ═════════ v27.5 DKO 월드 초대규모 업데이트 · 1부 ═════════
   화면 기준 이동 + WASD · 원형 미니맵(빠른 이동) · 감정 휠 · 텃밭 · 방명록/발자국/이번 주 인기 섬
   크리스마스 장식 · NPC 의뢰와 호감도 · 월드 전용 다이나믹 바 · DKO(내전 · 1대1 · 파티) 연동 */

/* ── 이벤트 통로: 의뢰 진행 · 월드 다이나믹 바 ── */
const wQ=(k,n)=>{ try{ window.dispatchEvent(new CustomEvent('dko-wq',{detail:{k,n:n||1}})); }catch(e){} };
const wDyn=ev=>{ try{ window.dispatchEvent(new CustomEvent('dko-wdyn',{detail:ev})); }catch(e){} };

/* ── 키보드: WASD · 방향키로 걷고, E/스페이스로 들어가기 · Q 감정 · M 지도 ── */
function WKeys({on,onMove,onKey}){
  const R=useRef({}); R.current={on,onMove,onKey};
  useEffect(()=>{ const P=new Set(); const M={KeyW:'u',ArrowUp:'u',KeyS:'d',ArrowDown:'d',KeyA:'l',ArrowLeft:'l',KeyD:'r',ArrowRight:'r'};
    const upd=()=>{ let x=0,y=0; if(P.has('l')) x--; if(P.has('r')) x++; if(P.has('u')) y--; if(P.has('d')) y++; const d=Math.hypot(x,y); R.current.onMove(d?x/d:0,d?y/d:0); };
    const typing=e=>{ const t=e.target; return !!t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable); };
    const kd=e=>{ if(typing(e)||e.metaKey||e.ctrlKey||e.altKey) return; const k=M[e.code]; if(k){ if(!R.current.on) return; e.preventDefault(); if(!P.has(k)){ P.add(k); upd(); } return; } if(!e.repeat&&R.current.onKey) R.current.onKey(e.code,e); };
    const ku=e=>{ const k=M[e.code]; if(k&&P.has(k)){ P.delete(k); upd(); } };
    const bl=()=>{ if(P.size){ P.clear(); upd(); } };
    R.current.clear=bl;
    window.addEventListener('keydown',kd); window.addEventListener('keyup',ku); window.addEventListener('blur',bl);
    return ()=>{ window.removeEventListener('keydown',kd); window.removeEventListener('keyup',ku); window.removeEventListener('blur',bl); }; },[]);
  useEffect(()=>{ if(!on&&R.current.clear) R.current.clear(); },[on]);
  return null;
}

/* ── 감정 표현 ── d: 보여 주는 시간(ms) · 0이면 움직일 때까지 */
Object.assign(ICONS,{emq:'M9 9a3 3 0 1 1 4 2.8c-.7.3-1 .9-1 1.7V14 M12 17.5v.5',emsad:'M8 15c1-1.3 2.4-2 4-2s3 .7 4 2 M9 9.5h.01 M15 9.5h.01 M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0',emspin:'M20 12a8 8 0 1 1-3-6.2 M20 4v5h-5',emjump:'M12 3v12 M7 10l5 5 5-5 M5 21h14'});
const W_EMO=[{k:'wave',n:'손 흔들기',ic:'hand',d:2400},{k:'dance',n:'춤',ic:'music',d:3600},{k:'sit',n:'앉기',ic:'down2',d:0},{k:'heart',n:'하트',ic:'heart',d:2800},{k:'cheer',n:'만세',ic:'up',d:2200},{k:'sleep',n:'쿨쿨',ic:'moon',d:0},
  /* v29.1 새 감정 표현 */
  {k:'laugh',n:'깔깔',ic:'smile',d:2600},{k:'cry',n:'엉엉',ic:'emsad',d:3000},{k:'angry',n:'부글부글',ic:'flame',d:2400},{k:'think',n:'갸우뚱',ic:'emq',d:2600},{k:'spin',n:'빙글빙글',ic:'emspin',d:2400},{k:'jump',n:'콩콩',ic:'emjump',d:2400},{k:'star',n:'반짝반짝',ic:'star',d:2600},{k:'gg',n:'GG',ic:'flag',d:3000},{k:'bow',n:'꾸벅',ic:'down2',d:2000},{k:'clap',n:'짝짝',ic:'spark',d:2400}];
/* 감정 휠 퀵슬롯: 6칸을 내가 골라요 (이 기기에 저장) */
const W_EMO_DEF=['wave','dance','heart','cheer','laugh','sit'];
const wEmoSlots=()=>{ try{ const v=JSON.parse(localStorage.getItem('dko-emo-slots')||'null'); if(Array.isArray(v)&&v.length===6&&v.every(k=>W_EMO.some(e=>e.k===k))) return v; }catch(e){} return W_EMO_DEF; };
const wEmoSave=L=>{ try{ localStorage.setItem('dko-emo-slots',JSON.stringify(L)); }catch(e){} };
const wEmoOn=e=>{ if(!e||!e.k) return false; const D=W_EMO.find(x=>x.k===e.k); if(!D) return false; const el=Date.now()-e.at; return el>=0&&el<(D.d||120000); };
function wHeart(g,x,y,s,col){ g.fillStyle=col; g.beginPath(); g.moveTo(x,y+s*.42); g.bezierCurveTo(x-s*1.15,y-s*.35,x-s*.5,y-s*1.1,x,y-s*.45); g.bezierCurveTo(x+s*.5,y-s*1.1,x+s*1.15,y-s*.35,x,y+s*.42); g.fill(); }
function wDrawEmo(g,px,py,u,tm,av,yaw,name,isMe,ex,emo){
  const k=emo.k, el=Math.max(0,(Date.now()-emo.at)/1000); const E={...(ex||{})};
  if(k==='sit'||k==='sleep'){ g.save(); g.translate(px,py+u*.7); g.scale(1.08,.76); wDrawChar(g,0,0,u,av,k==='sleep'?.45:yaw,tm,false,null,false,{...E,wave:false}); g.restore();
    if(name) wTag(g,px,py-u*13.4,u,name,isMe,E.on); if(k==='sleep') wSleepZ(g,px-u*2,py+u*4,u,tm,3); return; }
  if(k==='dance'){ const b=el*2.6; const hop=Math.abs(Math.sin(b*Math.PI))*u*2.6; const spin=yaw+Math.sin(b*Math.PI)*1.3*((Math.floor(b)%2)?1:-1);
    wDrawChar(g,px,py-hop,u,av,spin,tm,true,name,isMe,{...E,ph:el*16,wave:Math.floor(b)%2===0});
    for(let i=0;i<3;i++){ const q=(el*.8+i/3)%1; g.globalAlpha=Math.sin(q*Math.PI); g.fillStyle=['#FF6B8A','#7CC2FF','#FFD54A'][i]; const nx=px+Math.sin(q*6+i*2)*u*4+(i-1)*u*4, ny=py-u*(18+q*11);
      g.beginPath(); g.ellipse(nx,ny,u*1.05,u*.78,-.4,0,Math.PI*2); g.fill(); g.fillRect(nx+u*.72,ny-u*3.4,u*.42,u*3.4); g.fillRect(nx+u*.72,ny-u*3.4,u*1.6,u*.5); } g.globalAlpha=1; return; }
  if(k==='heart'){ const hop=el<.5?Math.sin(el/.5*Math.PI)*u*1.6:0; wDrawChar(g,px,py-hop,u,av,.35,tm,false,name,isMe,{...E,wave:el<1.2});
    for(let i=0;i<4;i++){ if(el<.25*i) continue; const q=((el-.25*i)*.55)%1; g.globalAlpha=Math.max(0,Math.min(1,(1-q)*1.6)); wHeart(g,px+Math.sin(q*5+i*1.7)*u*4.2,py-u*(17+q*13),u*(1.3+q*.9),i%2?'#FF8FB0':'#FF3E6C'); } g.globalAlpha=1; return; }
  if(k==='cheer'){ const hop=Math.abs(Math.sin(el*Math.PI*1.8))*u*3.2; wDrawChar(g,px,py-hop,u,av,.4,tm,false,name,isMe,{...E,wave:true});
    for(let i=0;i<7;i++){ const a=i/7*Math.PI*2+el*2.4; const r=u*(6.5+Math.sin(el*7+i)*1.2); g.fillStyle=i%2?'#FFE08A':'#FFFFFF'; const x=px+Math.cos(a)*r, y=py-u*11-hop+Math.sin(a)*r*.55; g.fillRect(x-u*.55,y-u*.15,u*1.1,u*.3); g.fillRect(x-u*.15,y-u*.55,u*.3,u*1.1); } return; }
  /* v29.1 새 감정 */
  const T2=(t,x,y,col,sz)=>{ g.font='900 '+Math.round(u*(sz||3.2))+'px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.lineWidth=u*.7; g.strokeStyle='rgba(20,24,40,.85)'; g.strokeText(t,x,y); g.fillStyle=col; g.fillText(t,x,y); };
  if(k==='laugh'){ const hop=Math.abs(Math.sin(el*Math.PI*3))*u*1.2; wDrawChar(g,px,py-hop,u,av,.4+Math.sin(el*9)*.15,tm,false,name,isMe,{...E,wave:false});
    for(let i=0;i<3;i++){ const q=(el*.9+i/3)%1; g.globalAlpha=Math.sin(q*Math.PI); T2('ㅋ',px+(i-1)*u*4.2,py-u*(16+q*9),'#FFE08A'); } g.globalAlpha=1; return; }
  if(k==='cry'){ wDrawChar(g,px,py,u,av,.4,tm,false,name,isMe,{...E,wave:false}); for(let i=0;i<6;i++){ const q=(el*1.6+i/6)%1, sd=i%2?1:-1; g.globalAlpha=1-q; g.fillStyle='#7CC8FF'; g.beginPath(); g.ellipse(px+sd*u*(2.2+q*3),py-u*(12-q*9),u*.55,u*.8,0,0,Math.PI*2); g.fill(); } g.globalAlpha=1; return; }
  if(k==='angry'){ const sh=Math.sin(el*40)*u*.35; wDrawChar(g,px+sh,py,u,av,.4,tm,false,name,isMe,{...E,wave:false}); const p=.9+.2*Math.abs(Math.sin(el*7)); g.save(); g.translate(px+u*3.6,py-u*14.5); g.scale(p,p); g.strokeStyle='#FF3E4E'; g.lineWidth=u*.8; g.lineCap='round'; for(let i=0;i<4;i++){ g.rotate(Math.PI/2); g.beginPath(); g.moveTo(u*.5,u*.5); g.quadraticCurveTo(u*1.7,u*.4,u*1.6,u*1.8); g.stroke(); } g.restore();
    for(let i=0;i<2;i++){ const q=(el*1.2+i*.5)%1; g.globalAlpha=(1-q)*.8; g.fillStyle='#FFFFFF'; g.beginPath(); g.arc(px+(i?1:-1)*u*(2+q*2),py-u*(13+q*6),u*(.8+q*1.2),0,Math.PI*2); g.fill(); } g.globalAlpha=1; return; }
  if(k==='think'){ wDrawChar(g,px,py,u,av,.4+Math.sin(el*2)*.3,tm,false,name,isMe,{...E,wave:false}); const b=Math.sin(el*4)*u*.6; g.fillStyle='rgba(255,255,255,.95)'; g.beginPath(); g.arc(px+u*4,py-u*17+b,u*2.6,0,Math.PI*2); g.fill(); g.beginPath(); g.arc(px+u*1.6,py-u*13.4,u*.8,0,Math.PI*2); g.fill(); T2('?',px+u*4,py-u*17+b,'#6A3FD8',3.4); return; }
  if(k==='spin'){ wDrawChar(g,px,py-Math.abs(Math.sin(el*Math.PI*2))*u,u,av,yaw+el*14,tm,true,name,isMe,{...E,ph:el*20}); for(let i=0;i<8;i++){ const a=el*10+i*.785; g.globalAlpha=.5; g.fillStyle=i%2?'#7CC8FF':'#FFFFFF'; g.fillRect(px+Math.cos(a)*u*5-u*.3,py-u*6+Math.sin(a)*u*2.4-u*.3,u*.6,u*.6); } g.globalAlpha=1; return; }
  if(k==='jump'){ const ph=(el*2.2)%1; const hop=Math.sin(ph*Math.PI)*u*5; wDrawChar(g,px,py-hop,u,av,.4,tm,false,name,isMe,{...E,wave:ph<.5}); if(ph<.12){ g.globalAlpha=1-ph/.12; g.strokeStyle='rgba(255,255,255,.8)'; g.lineWidth=u*.5; g.beginPath(); g.ellipse(px,py+u*1.2,u*(3+ph*30),u*(1.2+ph*12),0,0,Math.PI*2); g.stroke(); g.globalAlpha=1; } return; }
  if(k==='star'){ wDrawChar(g,px,py,u,av,.4,tm,false,name,isMe,{...E,wave:true}); for(let i=0;i<6;i++){ const q=(el*.8+i/6)%1, a=i*1.05+el; const x=px+Math.cos(a)*u*(3+q*5), y=py-u*(11+q*8)+Math.sin(a)*u*2; g.globalAlpha=Math.sin(q*Math.PI); wStar5(g,x,y,u*(1+q*.6),i%2?'#FFE45A':'#FFFFFF'); } g.globalAlpha=1; return; }
  if(k==='gg'){ wDrawChar(g,px,py,u,av,.4,tm,false,name,isMe,{...E,wave:true}); const w=Math.sin(el*6)*u*.6; g.fillStyle='#5A3A2A'; g.fillRect(px+u*3.6,py-u*20,u*.5,u*10); g.fillStyle='#FF8A3D'; g.beginPath(); g.moveTo(px+u*4.1,py-u*20); g.lineTo(px+u*10+w,py-u*18.4); g.lineTo(px+u*4.1,py-u*16.4); g.closePath(); g.fill(); T2('GG',px+u*6.4,py-u*18.3,'#FFFFFF',2.2); return; }
  if(k==='bow'){ const q=Math.min(1,el*3)*(el<1.4?1:Math.max(0,1-(el-1.4)*3)); g.save(); g.translate(px,py); g.scale(1,1-q*.14); wDrawChar(g,0,0,u,av,.4,tm,false,null,false,{...E,wave:false}); g.restore(); if(name) wTag(g,px,py-u*13.4,u,name,isMe,E.on); return; }
  if(k==='clap'){ wDrawChar(g,px,py,u,av,.4,tm,false,name,isMe,{...E,wave:Math.floor(el*6)%2===0}); if(Math.floor(el*6)%2===0){ for(let i=0;i<4;i++){ const a=i*1.57+.78; g.strokeStyle='#FFE08A'; g.lineWidth=u*.5; g.beginPath(); g.moveTo(px+Math.cos(a)*u*2.4,py-u*9+Math.sin(a)*u*2.4); g.lineTo(px+Math.cos(a)*u*3.6,py-u*9+Math.sin(a)*u*3.6); g.stroke(); } } return; }
  wDrawChar(g,px,py,u,av,.4,tm,false,name,isMe,{...E,wave:true});
}
function wStar5(g,x,y,r,col){ g.fillStyle=col; g.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr=i%2?r*.45:r; g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr); } g.closePath(); g.fill(); }
/* 캐릭터를 꾹 누르면 펼쳐지는 원형 감정 휠 */
function WEmoWheel({at,onPick,onClose}){
  const vw=window.innerWidth||390, vh=window.innerHeight||800; const R=84; const [ed,setEd]=useState(false); const [sl,setSl]=useState(wEmoSlots); const [pick,setPick]=useState(0);
  const W6=sl.map(k=>W_EMO.find(e=>e.k===k)).filter(Boolean);
  if(ed) return html`<div className="we69" onPointerDown=${e=>{ if(e.target===e.currentTarget){ e.preventDefault(); setEd(false); } }}><div className="we29-ed" onPointerDown=${e=>e.stopPropagation()}>
    <div className="we29-h"><b>감정 휠 꾸미기</b><small>바꿀 칸을 고르고, 아래에서 감정을 눌러요</small></div>
    <div className="we29-sl">${W6.map((E,i)=>html`<button key=${i} type="button" className=${'tap'+(pick===i?' on':'')} onClick=${()=>setPick(i)}><${Icon} n=${E.ic} s=${18} w=${2.4}/><small>${E.n}</small></button>`)}</div>
    <div className="we29-all">${W_EMO.map(E=>html`<button key=${E.k} type="button" className=${'tap'+(sl.includes(E.k)?' in':'')} onClick=${()=>{ const L=sl.slice(); const j=L.indexOf(E.k); if(j>=0) L[j]=L[pick]; L[pick]=E.k; setSl(L); wEmoSave(L); setPick((pick+1)%6); haptic(6); }}><${Icon} n=${E.ic} s=${18} w=${2.4}/><small>${E.n}</small></button>`)}</div>
    <div className="we29-f"><button type="button" className="tap g" onClick=${()=>{ setSl(W_EMO_DEF); wEmoSave(W_EMO_DEF); }}>처음대로</button><button type="button" className="tap" onClick=${()=>setEd(false)}>완료</button></div></div></div>`;
  const x=Math.max(R+46,Math.min(vw-R-46,at[0])), y=Math.max(R+130,Math.min(vh-R-170,at[1]));
  return html`<div className="we69" onPointerDown=${e=>{ if(e.target===e.currentTarget){ e.preventDefault(); onClose(); } }}>
    <div className="we69-w" style=${{left:x+'px',top:y+'px'}}>
      <i className="we69-ring"></i>
      <button type="button" className="we69-c tap" onClick=${()=>setEd(true)} aria-label="감정 휠 꾸미기"><${Icon} n="edit" s=${18} w=${2.4}/><small>바꾸기</small></button>
      ${W6.map((E,i)=>{ const a=-Math.PI/2+i/W6.length*Math.PI*2; return html`<button key=${E.k} className=${'we69-b tap k-'+E.k} style=${{'--x':Math.round(Math.cos(a)*R)+'px','--y':Math.round(Math.sin(a)*R)+'px','--i':i}} onClick=${()=>onPick(E.k)}><span><${Icon} n=${E.ic} s=${20} w=${2.4}/></span><b>${E.n}</b></button>`; })}
    </div></div>`;
}

/* ── 미니맵 ── 월드 전체를 한 번 작게 그려 두고(섬이 바뀔 때만), 위에 나 · 크루 · 명소만 다시 그려요 */
function wMiniBase(s){ if(s.mmB&&s.mmB.W===s.W) return s.mmB;
  let a=1e9,b=-1e9,c0=1e9,d=-1e9; for(const T of s.W.T.values()){ const ix=T.x-T.y, iy=T.x+T.y; if(ix<a) a=ix; if(ix>b) b=ix; if(iy<c0) c0=iy; if(iy>d) d=iy; }
  const K=5, P=6; const w=Math.ceil((b-a+2)*K+P*2), h=Math.ceil((d-c0+2)*K/2+P*2); const cv=document.createElement('canvas'); cv.width=w*2; cv.height=h*2; const g=cv.getContext('2d'); g.setTransform(2,0,0,2,0,0);
  const toB=(x,y)=>[((x-y)-a+1)*K+P,((x+y)-c0+1)*K/2+P];
  const fromB=(bx,by)=>{ const s1=(bx-P)/K+a-1, s2=(by-P)*2/K+c0-1; return [(s1+s2)/2,(s2-s1)/2]; };
  const col=T=>T.t==='bridge'?'#C9965A':T.t==='path'?'#F3E3BE':T.t==='sand'?'#F6E4B0':T.t==='stone'?'#E4E0D6':T.isl===s.uid?'#FFC27A':T.isl==='center'?'#A4E894':'#7ED67F';
  const dia=(x,y,ex,c)=>{ g.fillStyle=c; g.beginPath(); g.moveTo(x,y-K/2-ex*.5); g.lineTo(x+K+ex,y); g.lineTo(x,y+K/2+ex*.5); g.lineTo(x-K-ex,y); g.closePath(); g.fill(); };
  for(const T of s.W.T.values()){ const [x,y]=toB(T.x,T.y); dia(x,y+1.2,1.6,'rgba(10,40,80,.28)'); }
  for(const T of s.W.T.values()){ const [x,y]=toB(T.x,T.y); dia(x,y,1.4,'rgba(255,255,255,.7)'); }
  for(const T of s.W.T.values()){ const [x,y]=toB(T.x,T.y); dia(x,y,.45,col(T)); }
  s.mmB={W:s.W,cv,w,h,toB,fromB}; return s.mmB;
}
function wMiniRender(cv,s,o){
  const B=wMiniBase(s); const d=2; const [W,H]=o.sz; if(cv.width!==Math.round(W*d)||cv.height!==Math.round(H*d)){ cv.width=Math.round(W*d); cv.height=Math.round(H*d); }
  const g=cv.getContext('2d'); g.setTransform(d,0,0,d,0,0); g.clearRect(0,0,W,H); g.save();
  if(o.round){ g.beginPath(); g.arc(W/2,H/2,W/2,0,Math.PI*2); g.clip(); }
  const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#63CBEC'); gr.addColorStop(1,'#2F8FCB'); g.fillStyle=gr; g.fillRect(0,0,W,H);
  g.strokeStyle='rgba(255,255,255,.18)'; g.lineWidth=1; for(let i=0;i<8;i++){ const y=(i+.5)*H/8; g.beginPath(); for(let x=0;x<=W;x+=8) g.lineTo(x,y+Math.sin(x*.12+i)*1.4); g.stroke(); }
  const sc=o.sc; const [bx,by]=B.toB(o.cx,o.cy); const ox=W/2-bx*sc, oy=H/2-by*sc;
  g.drawImage(B.cv,ox,oy,B.w*sc,B.h*sc);
  const P=(x,y)=>{ const [a,b]=B.toB(x,y); return [ox+a*sc,oy+b*sc]; };
  const big=!!o.big; const z=Math.max(.6,Math.min(1.6,sc*1.6));
  /* 섬 이름 · 이번 주 인기 섬 왕관 */
  if(big){ g.textAlign='center'; g.textBaseline='middle'; (s.W.L||[]).forEach(L=>{ const I=(s.isl||[]).find(i=>i.uid===L.uid); if(!I) return; const [x,y]=P(L.cx,L.cy+L.r*.9); const nm=(I.uid===s.uid?'내 섬':(I.name||'')).slice(0,9);
      g.font='800 10.5px "NEXON Kart Gothic",sans-serif'; const tw=g.measureText(nm).width+12; g.fillStyle=I.uid===s.uid?'rgba(232,66,10,.92)':'rgba(10,18,36,.66)'; rr(g,x-tw/2,y-8,tw,16,8); g.fill(); g.fillStyle='#fff'; g.fillText(nm,x,y+.5);
      if(s.top===I.uid){ const [cx,cy]=P(L.cx,L.cy); wCrown(g,cx,cy-4,7); } });
    const [x0,y0]=P(-4,-2); g.font='900 11px "NEXON Kart Gothic",sans-serif'; const t0='소셜 아일랜드'; const tw=g.measureText(t0).width+14; g.fillStyle='rgba(255,247,230,.95)'; rr(g,x0-tw/2,y0-9,tw,18,9); g.fill(); g.fillStyle='#3A2410'; g.fillText(t0,x0,y0+.5); }
  else if(s.top){ const L=(s.W.L||[]).find(l=>l.uid===s.top); if(L){ const [cx,cy]=P(L.cx,L.cy); wCrown(g,cx,cy-2,5); } }
  /* 명소 */
  W_LM.forEach(l=>{ const [x,y]=P(l.x+1,l.y+1); const r=big?7*z:3.6; g.fillStyle=l.c[1]; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); g.strokeStyle='#fff'; g.lineWidth=big?2:1.2; g.stroke();
    if(big&&r>6){ g.save(); g.translate(x-r*.62,y-r*.62); g.scale(r*1.24/24,r*1.24/24); g.strokeStyle='#fff'; g.lineWidth=2.6; g.lineCap='round'; g.lineJoin='round'; g.stroke(wIcon(l.ic)); g.restore(); } });
  /* 텃밭 다 자람 · 주민 */
  (o.ready||[]).forEach(([x,y])=>{ const [px,py]=P(x,y); const k=.5+.5*Math.sin(Date.now()/240); g.fillStyle='rgba(124,217,87,'+(.35+k*.4)+')'; g.beginPath(); g.arc(px,py,big?7:4.5,0,Math.PI*2); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(px,py,big?2.6:1.7,0,Math.PI*2); g.fill(); });
  if(big) (s.fnpc||[]).forEach(n=>{ const [x,y]=P(n.x,n.y); g.fillStyle=n.def.c; g.beginPath(); g.arc(x,y,3.4,0,Math.PI*2); g.fill(); g.strokeStyle='rgba(255,255,255,.9)'; g.lineWidth=1.2; g.stroke(); });
  /* 크루 */
  for(const ol of (s.olc?s.olc.values():[])){ const [x,y]=P(ol.x,ol.y); const pt=s.pty&&ol.m&&s.pty.has(ol.m.uid); g.fillStyle=pt?'#FF8A3D':'#3DDC84'; g.beginPath(); g.arc(x,y,big?5.2:3.4,0,Math.PI*2); g.fill(); g.strokeStyle='#fff'; g.lineWidth=big?2:1.4; g.stroke();
    if(big&&ol.m){ const nm=dispName(ol.m).slice(0,6); g.font='800 10px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.textBaseline='bottom'; g.lineWidth=3; g.strokeStyle='rgba(0,0,0,.45)'; g.strokeText(nm,x,y-7); g.fillStyle='#fff'; g.fillText(nm,x,y-7); } }
  /* 나: 바라보는 방향 화살표 */
  { const [mx,my]=P(s.me.x,s.me.y); const wx=-Math.sin(s.me.yaw), wy=Math.cos(s.me.yaw); const ang=Math.atan2((wx+wy)*16,(wx-wy)*32); const r=big?8:6;
    if(big){ const k=(Date.now()%1600)/1600; g.strokeStyle='rgba(255,90,26,'+(1-k)+')'; g.lineWidth=2; g.beginPath(); g.arc(mx,my,r+k*12,0,Math.PI*2); g.stroke(); }
    g.save(); g.translate(mx,my); g.rotate(ang); g.lineJoin='round'; g.fillStyle='#FF5A1A'; g.strokeStyle='#fff'; g.lineWidth=2.2; g.beginPath(); g.moveTo(r,0); g.lineTo(-r*.72,r*.74); g.lineTo(-r*.3,0); g.lineTo(-r*.72,-r*.74); g.closePath(); g.stroke(); g.fill(); g.restore(); }
  g.restore();
  if(o.round){ g.strokeStyle='rgba(255,255,255,.95)'; g.lineWidth=3; g.beginPath(); g.arc(W/2,H/2,W/2-1.5,0,Math.PI*2); g.stroke(); }
  return {ox,oy,sc,B};
}
function wCrown(g,x,y,s){ g.save(); g.fillStyle='#FFD54A'; g.strokeStyle='#8A5A00'; g.lineWidth=Math.max(1,s*.18); g.lineJoin='round'; g.beginPath(); g.moveTo(x-s,y+s*.55); g.lineTo(x-s*1.05,y-s*.45); g.lineTo(x-s*.45,y); g.lineTo(x,y-s*.75); g.lineTo(x+s*.45,y); g.lineTo(x+s*1.05,y-s*.45); g.lineTo(x+s,y+s*.55); g.closePath(); g.stroke(); g.fill(); g.fillStyle='#FF5A5A'; g.beginPath(); g.arc(x,y+s*.1,s*.2,0,Math.PI*2); g.fill(); g.restore(); }
/* 오른쪽 위 원형 미니맵: 누르면 큰 지도 · − 로 접기 */
function WMini({S,onOpen,onHide,top,ready}){
  const cv=useRef(null); const R=useRef({}); R.current={top,ready};
  useEffect(()=>{ let dead=false, t=0; const loop=()=>{ if(dead) return; const s=S.current, el=cv.current;
      if(s&&el&&!s.paused&&s.W){ try{ wMiniRender(el,s,{sz:[86,86],sc:.42,cx:s.me.x,cy:s.me.y,round:true,ready:R.current.ready}); }catch(e){} }
      t=setTimeout(loop,200); }; loop(); return ()=>{ dead=true; clearTimeout(t); }; },[]);
  return html`<div className="wm69">
    <button className="wm69-map tap" onClick=${onOpen} aria-label="지도 크게 보기"><canvas ref=${cv} style=${{width:'86px',height:'86px'}}></canvas><i className="wm69-n">N</i></button>
    <button className="wm69-min tap" onClick=${onHide} aria-label="미니맵 접기"><${Icon} n="minus" s=${13} w=${3.2}/></button>
  </div>`;
}
/* 큰 지도(바텀 시트): 두 손가락 · +/− 로 확대, 끌어서 둘러보기, 누르면 그곳으로 빠른 이동 */
function WMapSheet({S,c,onClose,onGo,quick,ready,tab0,crewN,children}){
  const [tab,setTab]=useState(tab0||'map'); const cv=useRef(null); const [z,setZ]=useState(1); const V=useRef(null); const dr=useRef(null); const zR=useRef(1); zR.current=z; const pin=useRef(null);
  useEffect(()=>{ let dead=false, t=0; const loop=()=>{ if(dead) return; const s=S.current, el=cv.current;
      if(s&&el&&s.W){ const r=el.getBoundingClientRect(); if(r.width>10){ const B=wMiniBase(s); const fit=Math.min(r.width/B.w,r.height/B.h)*.96; if(!V.current) V.current=B.fromB(B.w/2,B.h/2);
        try{ el.__m=wMiniRender(el,s,{sz:[r.width,r.height],sc:fit*zR.current,cx:V.current[0],cy:V.current[1],big:true,ready}); }catch(e){}
        const P=pin.current; if(P&&Date.now()-P.at<900&&el.__m){ const g=el.getContext('2d'); const [a,b]=el.__m.B.toB(P.x,P.y); const x=el.__m.ox+a*el.__m.sc, y=el.__m.oy+b*el.__m.sc; const k=(Date.now()-P.at)/900; g.strokeStyle='rgba(255,255,255,'+(1-k)+')'; g.lineWidth=3; g.beginPath(); g.arc(x,y,6+k*22,0,Math.PI*2); g.stroke(); } } }
      t=setTimeout(loop,60); }; loop(); return ()=>{ dead=true; clearTimeout(t); }; },[]);
  const zoom=f=>{ setZ(v=>Math.max(1,Math.min(4.5,v*f))); haptic(5); };
  const center=()=>{ const s=S.current; if(s){ V.current=[s.me.x,s.me.y]; if(zR.current<1.8) setZ(2.2); } haptic(6); };
  const pts=useRef(new Map());
  const down=e=>{ e.currentTarget.setPointerCapture(e.pointerId); pts.current.set(e.pointerId,[e.clientX,e.clientY]); if(pts.current.size===1) dr.current={x:e.clientX,y:e.clientY,v:V.current?[...V.current]:null,mv:false}; else if(pts.current.size===2){ const [a,b]=[...pts.current.values()]; dr.current={pinch:Math.hypot(a[0]-b[0],a[1]-b[1]),z:zR.current,mv:true}; } };
  const move=e=>{ if(!pts.current.has(e.pointerId)) return; pts.current.set(e.pointerId,[e.clientX,e.clientY]); const D=dr.current; if(!D) return; const el=cv.current; const m=el&&el.__m; if(!m) return;
    if(D.pinch&&pts.current.size===2){ const [a,b]=[...pts.current.values()]; setZ(Math.max(1,Math.min(4.5,D.z*Math.hypot(a[0]-b[0],a[1]-b[1])/D.pinch))); return; }
    const dx=e.clientX-D.x, dy=e.clientY-D.y; if(Math.hypot(dx,dy)>6) D.mv=true; if(!D.mv||!D.v) return; const [bx,by]=m.B.toB(D.v[0],D.v[1]); V.current=m.B.fromB(bx-dx/m.sc,by-dy/m.sc); };
  const up=e=>{ pts.current.delete(e.pointerId); const D=dr.current; if(pts.current.size) return; dr.current=null; if(!D||D.mv) return; const el=cv.current; const m=el&&el.__m; if(!m) return; const r=el.getBoundingClientRect();
    const [wx,wy]=m.B.fromB((e.clientX-r.left-m.ox)/m.sc,(e.clientY-r.top-m.oy)/m.sc); const s=S.current; const T=s&&s.W.T.get(Math.round(wx)+','+Math.round(wy)); if(!T){ haptic(4); return; }
    pin.current={x:Math.round(wx),y:Math.round(wy),at:Date.now()}; haptic(12); setTimeout(()=>onGo(Math.round(wx),Math.round(wy)),260); };
  return html`<div className="wb20-shade" onClick=${onClose}><div className=${'wbs w69s wmp69 t-'+tab} onClick=${e=>e.stopPropagation()}>
    <div className="wbs-h"><b>지도</b><span className="wbs-sub">${tab==='map'?'누르면 그곳으로 빠른 이동 · 꾹 누르면 미리보기':(crewN||1)+'명 접속 중'}</span><button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="wmp96-seg">${[['map','월드 지도','map'],['crew','장소 · 크루 위치','users']].map(([k,n,ic])=>html`<button key=${k} type="button" className=${'tap'+(tab===k?' on':'')} onClick=${()=>{ setTab(k); haptic(5); }}><${Icon} n=${ic} s=${14} w=${2.5}/>${n}${k==='crew'&&crewN?html`<em>${crewN}</em>`:null}</button>`)}</div>
    ${tab==='crew'?html`<div className="wmp96-crew ui-in">${children}</div>`:null}
    <div className="wmp69-m"><canvas ref=${cv} onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up} onWheel=${e=>zoom(e.deltaY>0?.85:1.18)}></canvas>
      <div className="wmp69-z"><button className="tap" onClick=${()=>zoom(1.4)} aria-label="확대"><${Icon} n="plus" s=${17} w=${3}/></button><button className="tap" onClick=${()=>zoom(1/1.4)} aria-label="축소"><${Icon} n="minus" s=${17} w=${3}/></button><button className="tap me" onClick=${center} aria-label="내 위치"><${Icon} n="compass" s=${17} w=${2.4}/></button></div>
      <div className="wmp69-lg"><span><i className="me"></i>나</span><span><i className="cr"></i>크루</span><span><i className="pt"></i>파티</span><span><i className="gd"></i>수확</span></div></div>
    <div className="wmp69-q">${quick.map(q=>html`<button key=${q.k} className="tap" onClick=${q.go}><span className="gi30" style=${{'--g1':q.c[0],'--g2':q.c[1]}}><${Icon} n=${q.ic} s=${15} w=${2.4}/></span>${q.n}</button>`)}</div>
  </div></div>`;
}

/* ── 월드 전용 다이나믹 바 ── 평소엔 지금 있는 곳 · 소식이 오면 펼쳐지고, 누르면 그 위치로 */
function WDyn({c,area,sub,hidden,wide,onIdle}){
  const [cur,setCur]=useState(null); const Q=useRef([]); const tm=useRef(0); const curR=useRef(null);
  const next=()=>{ const n=Q.current.shift()||null; curR.current=n; setCur(n); clearTimeout(tm.current); if(n) tm.current=setTimeout(next,n.dur||3800); };
  const push=ev=>{ if(!ev||!ev.t) return; if(ev.id&&(Q.current.some(x=>x.id===ev.id)||(curR.current&&curR.current.id===ev.id))) return; if(Q.current.length>6) Q.current.shift(); Q.current.push({...ev,k:Date.now()+Math.random()}); if(!curR.current) next(); };
  useEffect(()=>{ const f=e=>push(e.detail); window.addEventListener('dko-wdyn',f); return ()=>{ window.removeEventListener('dko-wdyn',f); clearTimeout(tm.current); }; },[]);
  const tk=useRef(c.toast&&c.toast.k);
  useEffect(()=>{ const t=c.toast; if(!t||t.k===tk.current) return; tk.current=t.k; const err=t.type==='err';
    push({ic:err?'alert':t.type==='ntf'?'bell':t.type==='gold'?'coin':'check',col:err?'#FF5468':t.type==='gold'?'#FFB020':'#3DDC84',t:t.msg,b:t.body||'',dur:t.body?4200:2800,err}); },[c.toast]);
  const A=cur;
  return html`<div className=${'wdy69'+(A?' on':'')+(A&&A.err?' err':'')+(hidden?' hid':'')+(wide?' wide':'')} style=${A?{'--c':A.col||'#3DDC84'}:null} role="status" onClick=${()=>{ if(A){ const go=A.go; next(); if(go){ haptic(10); go(); } } else if(onIdle) onIdle(); }}>
    ${A?html`<div className="wdy69-a" key=${A.k}><span className="wdy69-ic">${A.ic==='coin'?html`<${Coin} s=${17}/>`:html`<${Icon} n=${A.ic||'bell'} s=${16} w=${2.6}/>`}</span><span className="wdy69-t">${A.lab?html`<em>${A.lab}</em>`:null}<b>${A.t}</b>${A.b?html`<small>${A.b}</small>`:null}</span>${A.go?html`<span className="wdy69-go">${A.gl||'이동'}<${Icon} n="chev" s=${12} w=${3}/></span>`:null}<i className="wdy69-bar" style=${{animationDuration:(A.dur||3800)+'ms'}}></i></div>`
      :html`<div className="wdy69-i" key="idle"><span className="wdy69-pin"><${Icon} n="pin" s=${12} w=${2.8}/></span><b>${area}</b>${sub?html`<small>${sub}</small>`:null}</div>`}
  </div>`;
}

/* ── 텃밭 ── */
function WCropIc({k,s}){ const C=wCropOf(k); if(!C) return null; const [a,b]=C.c; const S0=s||28; const lf='#3FB65C', lf2='#2F9A4A'; let body=null;
  if(C.sh==='root') body=html`<path d="M12 9.6c-2.7 0-4.5 2-4.5 4.6 0 3.2 2.5 6.6 4.5 7.4 2-.8 4.5-4.2 4.5-7.4 0-2.6-1.8-4.6-4.5-4.6z" fill=${a}/><path d="M9.6 14.4h2M12.4 16.8h2M10.6 18.9h1.4" stroke=${b} stroke-width="1.1" stroke-linecap="round"/><path d="M12 10C10.6 6.4 8 4.9 6.1 5.5c.6 2.4 3 4 5.9 4.5zM12 10c1.4-3.6 4-5.1 5.9-4.5-.6 2.4-3 4-5.9 4.5z" fill=${lf}/><path d="M12 10V3.4" stroke=${lf2} stroke-width="1.6" stroke-linecap="round"/>`;
  else if(C.sh==='corn') body=html`<path d="M12 3.5c2.6 0 4.2 3.6 4.2 8.3S14.6 20.5 12 20.5 7.8 16.5 7.8 11.8 9.4 3.5 12 3.5z" fill=${a}/><path d="M9.6 7.5h4.8M8.9 10.5h6.2M8.9 13.5h6.2M9.4 16.5h5.2M12 4v16" stroke=${b} stroke-width=".9" opacity=".7"/><path d="M12 21c-3.8-.6-6-4.6-6.6-9.5 1.8 2.5 3.6 5.6 6.6 9.5zM12 21c3.8-.6 6-4.6 6.6-9.5-1.8 2.5-3.6 5.6-6.6 9.5z" fill=${lf}/>`;
  else if(C.sh==='berry') body=html`<path d="M12 21c-3.6-2.4-6.4-5.8-6.4-9 0-2.6 2.6-3.8 6.4-3.8s6.4 1.2 6.4 3.8c0 3.2-2.8 6.6-6.4 9z" fill=${a}/>${[[9,12],[12,11],[15,12],[10.5,15],[13.5,15],[12,18]].map(([x,y],i)=>html`<ellipse key=${i} cx=${x} cy=${y} rx=".55" ry=".8" fill="#FFE08A"/>`)}<path d="M12 9c-2-2.2-4.6-2.6-5.6-1.6 1.4.4 2.8 1.2 3.4 2.2-1-.1-2.2.2-2.8.8 2 .6 3.6.3 5-1.4 1.4 1.7 3 2 5 1.4-.6-.6-1.8-.9-2.8-.8.6-1 2-1.8 3.4-2.2-1-1-3.6-.6-5.6 1.6z" fill=${lf}/>`;
  else if(C.sh==='pump') body=html`<ellipse cx="12" cy="14.6" rx="8.4" ry="6.2" fill=${a}/><path d="M12 8.6c-1.8 0-2.6 2.8-2.6 6s.8 6 2.6 6 2.6-2.8 2.6-6-.8-6-2.6-6zM6.4 10.4c-1.4 1.6-1.6 6.6 0 8.4M17.6 10.4c1.4 1.6 1.6 6.6 0 8.4" stroke=${b} stroke-width="1.1" fill="none"/><path d="M12 8.8V5.2c0-.8 1-1.6 2-1.6" stroke="#6B8E23" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M13 6c1.6-1.8 4-1.6 4.8-.6-1.2 1-3 1.4-4.8.6z" fill=${lf}/>`;
  else if(C.sh==='melon') body=html`<circle cx="12" cy="13.4" r="8" fill=${a}/><path d="M12 5.4c-2.6 2.4-3 13.6 0 16M12 5.4c2.6 2.4 3 13.6 0 16M6 8.4c-1.6 3.2-1.4 7.8.6 10.6M18 8.4c1.6 3.2 1.4 7.8-.6 10.6" stroke=${b} stroke-width="1.5" fill="none"/><ellipse cx="9" cy="9.6" rx="2" ry="1.2" fill="#fff" opacity=".35" transform="rotate(-30 9 9.6)"/>`;
  else if(C.sh==='flower') body=html`<path d="M12 21v-6" stroke=${lf2} stroke-width="1.8" stroke-linecap="round"/><path d="M12 18c-2.4-.2-4-1.4-4.6-3 2 0 3.6.9 4.6 3z" fill=${lf}/>${[0,1,2,3,4].map(i=>{ const an=-Math.PI/2+i*Math.PI*2/5; const x=12+Math.cos(an)*4.2, y=9.6+Math.sin(an)*4.2; return html`<ellipse key=${i} cx=${x.toFixed(2)} cy=${y.toFixed(2)} rx="2.9" ry="2.2" fill=${a} transform=${'rotate('+(an*180/Math.PI).toFixed(1)+' '+x.toFixed(2)+' '+y.toFixed(2)+')'}/>`; })}<circle cx="12" cy="9.6" r="2.3" fill=${b}/>`;
  else body=html`<circle cx="12" cy="14" r="7.2" fill=${a}/><circle cx="12" cy="14" r="7.2" fill="none" stroke=${b} stroke-width="1" opacity=".5"/><ellipse cx="9.4" cy="11.4" rx="2.2" ry="1.4" fill="#fff" opacity=".4" transform="rotate(-30 9.4 11.4)"/><path d="M12 7.4V4.2" stroke="#7A4E2C" stroke-width="1.6" stroke-linecap="round"/><path d="M12.4 5.6c1.8-1.8 4.4-1.6 5.2-.6-1.4 1-3.4 1.4-5.2.6z" fill=${lf}/>`;
  return html`<svg className="wci69" viewBox="0 0 24 24" width=${S0} height=${S0} aria-hidden="true">${body}</svg>`;
}
const wFmtLeft=ms=>{ const s=Math.max(0,Math.ceil(ms/1000)); if(s<60) return s+'초'; const m=Math.ceil(s/60); if(m<60) return m+'분'; const h=Math.floor(m/60), mm=m%60; return h+'시간'+(mm?' '+mm+'분':''); };
/* 월드 위 텃밭 칸: 자라는 단계 · 다 자라면 반짝 · 물 줄 수 있으면 물방울 */
function wFarmDraw(g,px,py,u,tm,I,it,own,now,canW){
  const P=wPlotOf(I,it.i); const Pr=(x,y,z)=>[px+(x-y)*u,py+(x+y)*u*.5-z*u];
  if(!P){ if(own){ const b=Math.sin(tm*3+it.x)*u*.4; const [x,y]=Pr(0,0,4); g.globalAlpha=.85; g.fillStyle='rgba(255,255,255,.9)'; g.beginPath(); g.arc(x,y-u*2+b,u*1.9,0,Math.PI*2); g.fill(); g.strokeStyle='#5DAE48'; g.lineWidth=Math.max(1.5,u*.45); g.lineCap='round'; g.beginPath(); g.moveTo(x-u*.9,y-u*2+b); g.lineTo(x+u*.9,y-u*2+b); g.moveTo(x,y-u*2.9+b); g.lineTo(x,y-u*1.1+b); g.stroke(); g.globalAlpha=1; } return; }
  const C=wCropOf(P.c); const end=wPlotEnd(I,it.i); const k=Math.max(0,Math.min(1,(now-P.at)/Math.max(1,end-P.at))); const ready=now>=end; const wet=wPlotWater(I,it.i,P.at).length;
  if(wet){ g.fillStyle='rgba(40,60,110,.16)'; g.beginPath(); g.ellipse(px,py,u*6.4,u*3.2,0,0,Math.PI*2); g.fill(); }
  const spots=[[-2,-2],[2,-2],[-2,2],[2,2]]; const st=ready?3:k<.25?0:k<.6?1:2;
  spots.forEach(([sx,sy],i)=>{ const sw=Math.sin(tm*2.2+i+it.x)*u*.25; const [x,y]=Pr(sx,sy,.9);
    if(st===0){ g.fillStyle='#7A4E2C'; g.beginPath(); g.ellipse(x,y,u*1.1,u*.55,0,0,Math.PI*2); g.fill(); g.fillStyle='#6ED487'; g.beginPath(); g.ellipse(x-u*.5+sw*.3,y-u*.9,u*.55,u*.3,-.6,0,Math.PI*2); g.ellipse(x+u*.5+sw*.3,y-u*.9,u*.55,u*.3,.6,0,Math.PI*2); g.fill(); return; }
    const hgt=st===1?2.2:3.6; g.strokeStyle='#3E9A52'; g.lineWidth=Math.max(1,u*.35); g.beginPath(); g.moveTo(x,y); g.lineTo(x+sw,y-u*hgt); g.stroke();
    g.fillStyle=st===1?'#6ED487':'#4FB86A'; for(const [dx,dy,r] of [[-1,-.55,-.7],[1,-.75,.7],[-.6,-1,-.4],[.7,-1.05,.5]]){ g.beginPath(); g.ellipse(x+dx*u*(st===1?.8:1.15)+sw,y-u*hgt*(-dy)*.62-u*.4,u*(st===1?.75:1.05),u*.42,r,0,Math.PI*2); g.fill(); }
    if(st>=2){ const fr=st===3?1:.62; const fx=x+sw, fy=y-u*hgt*.95; const col=st===3?C.c[0]:'#9CCB6A';
      if(C.sh==='flower'){ for(let j=0;j<5;j++){ const an=j*1.2566+tm*.3; g.fillStyle=col; g.beginPath(); g.ellipse(fx+Math.cos(an)*u*.9*fr,fy+Math.sin(an)*u*.55*fr,u*.75*fr,u*.5*fr,an,0,Math.PI*2); g.fill(); } g.fillStyle=C.c[1]; g.beginPath(); g.arc(fx,fy,u*.45*fr,0,Math.PI*2); g.fill(); }
      else if(C.sh==='corn'){ g.fillStyle=col; g.beginPath(); g.ellipse(fx,fy,u*.6*fr,u*1.3*fr,.2,0,Math.PI*2); g.fill(); }
      else if(C.sh==='root'){ g.fillStyle=col; g.beginPath(); g.ellipse(x,y-u*.2,u*.9*fr,u*.55*fr,0,0,Math.PI*2); g.fill(); }
      else { const r=u*(C.sh==='pump'||C.sh==='melon'?1.35:1)*fr; g.fillStyle=col; g.beginPath(); g.arc(fx,fy+(C.sh==='pump'||C.sh==='melon'?u*1.6:0),r,0,Math.PI*2); g.fill(); g.fillStyle='rgba(255,255,255,.4)'; g.beginPath(); g.arc(fx-r*.35,fy-r*.35+(C.sh==='pump'||C.sh==='melon'?u*1.6:0),r*.3,0,Math.PI*2); g.fill(); } } });
  const [bx,by]=Pr(0,0,9);
  if(ready){ for(let i=0;i<4;i++){ const q=(tm*.8+i/4)%1; const a=i*1.7+tm; const x=px+Math.cos(a)*u*5, y=py-u*(3+q*6); g.fillStyle='rgba(255,247,190,'+(1-q)+')'; g.fillRect(x-u*.5,y-u*.12,u,u*.24); g.fillRect(x-u*.12,y-u*.5,u*.24,u); }
    if(own){ const b=Math.sin(tm*4+it.x)*u*.6; g.fillStyle='#fff'; g.beginPath(); g.arc(bx,by-u*2+b,u*2.6,0,Math.PI*2); g.fill(); g.beginPath(); g.moveTo(bx-u*.9,by+u*.4+b); g.lineTo(bx,by+u*1.6+b); g.lineTo(bx+u*.9,by+u*.4+b); g.fill();
      g.fillStyle=C.c[0]; g.beginPath(); g.arc(bx,by-u*2+b,u*1.3,0,Math.PI*2); g.fill(); g.fillStyle='#3FB65C'; g.beginPath(); g.ellipse(bx+u*.5,by-u*3.4+b,u*.7,u*.35,-.5,0,Math.PI*2); g.fill(); } }
  else if(canW){ const b=Math.sin(tm*4+it.x)*u*.6; g.fillStyle='rgba(255,255,255,.95)'; g.beginPath(); g.arc(bx,by-u*2+b,u*2.4,0,Math.PI*2); g.fill(); g.fillStyle='#3FA2F2'; g.beginPath(); g.moveTo(bx,by-u*3.6+b); g.quadraticCurveTo(bx+u*1.3,by-u*1.8+b,bx,by-u*1.1+b); g.quadraticCurveTo(bx-u*1.3,by-u*1.8+b,bx,by-u*3.6+b); g.fill(); }
  else if(own&&k>0){ const w=u*7, h=Math.max(3,u*.8); g.fillStyle='rgba(10,16,30,.55)'; rr(g,px-w/2,py+u*2.4,w,h,h/2); g.fill(); g.fillStyle='#7CD957'; rr(g,px-w/2,py+u*2.4,w*k,h,h/2); g.fill(); }
}
/* 텃밭 바텀 시트: 칸을 고르고 씨앗을 심어요 · 다 자란 건 한 번에 수확 */
function WGarden({I,now,focus,onClose,onPlant,onHarvest,onBuild,onGo}){
  const plots=I.items.filter(it=>it.t==='farm'); const [sel,setSel]=useState(()=>focus||(plots.find(p=>!wPlotOf(I,p.i))||plots[0]||{}).i||null);
  const xm=wXmas(); const crops=W_CROP.filter(C=>!C.xmas||xm); const readyL=plots.filter(p=>{ const e=wPlotEnd(I,p.i); return e&&now>=e; });
  const sp=sel&&wPlotOf(I,sel); const max=wMaxOf('farm',I.hallLv);
  return html`<div className="wb20-shade" onClick=${onClose}><div className="wbs w69s wg69" onClick=${e=>e.stopPropagation()}>
    <div className="wbs-h"><b>텃밭</b><span className="wbs-sub"><${Icon} n="sprout" s=${14} w=${2.4}/>${plots.length}/${max}칸 · 크루가 물을 주면 20%씩 빨라져요</span><button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="w69-body">
      ${!plots.length?html`<div className="wg69-empty"><span className="gi30" style=${{'--g1':'#8EE06A','--g2':'#2F9A3A'}}><${Icon} n="sprout" s=${30} w=${2.2}/></span><b>아직 텃밭이 없어요</b><small>텃밭을 지으면 씨앗을 심고 실제 시간으로 키울 수 있어요. 본부 레벨이 오를수록 칸과 작물이 늘어나요.</small><button className="wbi-go tap" onClick=${onBuild}><${BrickIc} s=${18}/>${W_CAT.farm.b} · 텃밭 짓기</button></div>`:html`
      ${readyL.length?html`<button className="wg69-all tap" onClick=${()=>onHarvest(readyL.map(p=>p.i))}><${Icon} n="sprout" s=${18} w=${2.4}/>다 자란 작물 ${readyL.length}개 모두 수확</button>`:null}
      <div className="wg69-plots">${plots.map((p,i)=>{ const P=wPlotOf(I,p.i); const end=wPlotEnd(I,p.i); const rd=end&&now>=end; const k=P?Math.max(0,Math.min(1,(now-P.at)/Math.max(1,end-P.at))):0; const wn=P?Math.min(3,wPlotWater(I,p.i,P.at).length):0;
        return html`<button key=${p.i} className=${'wg69-p tap'+(sel===p.i?' on':'')+(rd?' rd':'')+(P?'':' em')} onClick=${()=>{ setSel(p.i); if(rd) onHarvest([p.i]); }}>
          <span className="wg69-ring" style=${{'--k':(rd?1:k)}}>${P?html`<${WCropIc} k=${P.c} s=${30}/>`:html`<${Icon} n="plus" s=${20} w=${2.6}/>`}</span>
          <b>${P?wCropOf(P.c).n:(i+1)+'번 칸'}</b><small>${!P?'비어 있어요':rd?'수확하기!':wFmtLeft(end-now)+' 남음'}</small>${wn?html`<em className="wg69-w">${Array.from({length:wn}).map((_,j)=>html`<${Icon} key=${j} n="drop" s=${10} w=${2.6} fill="currentColor"/>`)}</em>`:null}</button>`; })}
        ${plots.length<max?html`<button className="wg69-p tap add" onClick=${onBuild}><span className="wg69-ring"><${Icon} n="plus" s=${20} w=${2.6}/></span><b>칸 늘리기</b><small><${BrickIc} s=${11}/>${W_CAT.farm.b}</small></button>`:null}</div>
      ${sel?html`<div className="wg69-sec">${sp?'자라는 중':'씨앗 고르기'}<span>${sp?'':'본부 Lv.'+I.hallLv+' · 벽돌 '+I.bricks.toLocaleString()}</span></div>
        ${sp?(()=>{ const C=wCropOf(sp.c); const end=wPlotEnd(I,sel); const rd=now>=end; const wn=Math.min(3,wPlotWater(I,sel,sp.at).length); return html`<div className="wg69-cur"><${WCropIc} k=${sp.c} s=${44}/><div><b>${C.n}</b><small>${rd?'다 자랐어요! 눌러서 수확해요':'다 자라기까지 '+wFmtLeft(end-now)}</small><small>크루 물 주기 ${wn}/3 · 수확 보너스 +${wn*10}%</small></div>${rd?html`<button className="wbi-mini tap" onClick=${()=>onHarvest([sel])}>수확</button>`:html`<button className="wbi-mini ghost tap" onClick=${()=>onGo(sel)}>보러 가기</button>`}</div>`; })()
        :html`<div className="wg69-seeds">${crops.map(C=>{ const lock=C.lv>I.hallLv; const poor=!lock&&I.bricks<C.cost; return html`<button key=${C.k} className=${'wg69-s tap'+(lock?' lock':'')+(poor?' poor':'')+(C.xmas?' xm':'')} onClick=${()=>!lock&&onPlant(sel,C.k)}>
            <${WCropIc} k=${C.k} s=${34}/><b>${C.n}</b><small><${Icon} n="clock" s=${10} w=${2.6}/>${wFmtLeft(C.sec*1000)}</small>
            <span className="wg69-gain"><${BrickIc} s=${11}/>+${C.get.toLocaleString()}${C.coin?html` · <${Coin} s=${10}/>${C.coin}`:null}</span>
            ${lock?html`<span className="wg69-lk"><${Icon} n="lock" s=${11} w=${2.6}/>본부 Lv.${C.lv}</span>`:html`<span className="wg69-c"><${BrickIc} s=${12}/>${C.cost}</span>`}</button>`; })}</div>`}`:null}
      `}
    </div></div></div>`;
}

/* ── 방명록 · 발자국 ── */
function WGuest({c,I,isOwner,onClose,onWrite,onDel,onGo}){
  const [t,setT]=useState(''); const m=c.members.find(x=>x.uid===I.uid); const w0=wWeek0(); const ws=wWeekScore(I,w0);
  const list=Object.entries(I.gb||{}).filter(([k,e])=>e&&e.t).map(([k,e])=>({id:k,...e})).sort((a,b)=>b.at-a.at).slice(0,60);
  const feet=Object.entries(I.foot||{}).filter(([u,at])=>typeof at==='number'&&u!==I.uid).sort((a,b)=>b[1]-a[1]).slice(0,12);
  const send=()=>{ const v=t.trim().slice(0,60); if(!v) return; onWrite(v); setT(''); };
  return html`<div className="wb20-shade" onClick=${onClose}><div className="wbs w69s wgb69" onClick=${e=>e.stopPropagation()}>
    <div className="wbs-h"><b>${isOwner?'내 섬 방명록':I.name+' 방명록'}</b><span className="wbs-sub">${m?dispName(m)+'의 섬':''}</span><button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="w69-body">
      <div className="wgb69-st"><span><${Icon} n="heart" s=${15} w=${2.4} fill="currentColor"/><b>${Object.keys(I.likes||{}).length}</b><small>좋아요</small></span><span><${Icon} n="foot" s=${15} w=${2.4}/><b>${Object.keys(I.foot||{}).filter(u=>u!==I.uid).length}</b><small>발자국</small></span><span><${Icon} n="book" s=${15} w=${2.4}/><b>${list.length}</b><small>방명록</small></span><span className="wk"><${Icon} n="crown" s=${15} w=${2.4}/><b>${ws.sc}</b><small>이번 주 점수</small></span></div>
      ${feet.length?html`<div className="wg69-sec">최근 다녀간 크루<span>발자국은 섬에 남아요</span></div><div className="wgb69-ft">${feet.map(([u,at])=>{ const mm=c.members.find(x=>x.uid===u); return mm?html`<span key=${u} className="wgb69-f"><${PfpView} m=${mm} s=${34}/><small>${ago(at)}</small></span>`:null; })}</div>`:null}
      <div className="wg69-sec">한마디<span>${isOwner?'내 섬에 남긴 글':'따뜻한 한마디를 남겨요'}</span></div>
      ${!isOwner?html`<div className="wgb69-in"><input className="inp" value=${t} maxLength=${60} placeholder="섬 정말 예뻐요! (60자)" onChange=${e=>setT(e.target.value)} onKeyDown=${e=>{ if(e.key==='Enter'){ e.preventDefault(); send(); } }}/><button className=${'wbi-mini tap'+(t.trim()?'':' off')} onClick=${send}><${Icon} n="send" s=${15} w=${2.4}/></button></div>`:null}
      <div className="wgb69-l">${list.length?list.map(e=>{ const mm=c.members.find(x=>x.uid===e.u); return html`<div key=${e.id} className="wgb69-r">${mm?html`<${PfpView} m=${mm} s=${36}/>`:html`<span className="wgb69-av"></span>`}<div><b>${mm?dispName(mm):'크루'}<small>${ago(e.at)}</small></b><p>${e.t}</p></div>${isOwner||e.u===c.uid?html`<button className="wgb69-x tap" onClick=${()=>onDel(e.id)} aria-label="지우기"><${Icon} n="trash" s=${14} w=${2.3}/></button>`:null}</div>`; })
        :html`<p className="wgb69-none">${isOwner?'아직 방명록이 비어 있어요. 크루가 놀러 오면 한마디를 남겨요.':'첫 번째 한마디를 남겨 보세요!'}</p>`}</div>
      ${!isOwner&&onGo?html`<button className="wbi-go ghost tap" onClick=${onGo}>섬 구경 가기</button>`:null}
    </div></div></div>`;
}
/* 섬 위 발자국: 사흘 안에 다녀간 크루가 섬 입구 쪽에 작게 남겨요 */
function wFootEnts(s,ents,now){ if(s.cam.z<.5) return; (s.isl||[]).forEach(I=>{ const F=I.foot; if(!F) return; const sp=s.ospot[I.uid]; const L=s.W.L.find(l=>l.uid===I.uid); if(!sp||!L) return;
  Object.entries(F).filter(([u,at])=>typeof at==='number'&&u!==I.uid&&now-at<3*86400000).sort((a,b)=>b[1]-a[1]).slice(0,6).forEach(([u,at],vi)=>{ const h=wStr(u); const a=(h%628)/100; const hue=h%360;
    for(let j=0;j<3;j++){ const r=1.4+j*.62+vi*.12; const gx=sp[0]+Math.cos(a)*r, gy=sp[1]+Math.sin(a)*r; const T=s.W.T.get(Math.round(gx)+','+Math.round(gy)); if(!T||T.isl!==I.uid) continue; ents.push({d:gx+gy-.45,k:'ft',gx,gy,col:'hsla('+hue+',70%,38%,'+Math.max(.18,.5-(now-at)/(3*86400000)*.3)+')',ang:a+Math.PI,j}); } }); }); }
function wFootDraw(g,px,py,u,e){ g.save(); g.translate(px,py); g.scale(1,.5); g.rotate(e.ang+(e.j%2?.25:-.25)); g.fillStyle=e.col; g.beginPath(); g.ellipse(0,0,u*.95,u*.6,0,0,Math.PI*2); g.fill(); for(let i=0;i<3;i++){ g.beginPath(); g.arc(u*1.25,(i-1)*u*.5,u*.26,0,Math.PI*2); g.fill(); } g.restore(); }

/* ── 섬 이름표 장식: 이번 주 인기 1위 왕관 · DKO 내전/1대1 전적 ── */
function wNameX(g,px,y,u,tm,I,s){
  const r=s.rec&&s.rec[I.uid]; if(r&&(r.mw||r.dw)){ const txt=(r.mw?'내전 '+r.mw+'승':'')+(r.mw&&r.dw?' · ':'')+(r.dw?'1대1 '+r.dw+'승':''); g.font='800 '+Math.max(9,Math.round(u*1.8))+'px "NEXON Kart Gothic",sans-serif'; const tw=g.measureText(txt).width+14, th=Math.max(14,u*3); const ty=y+u*7.4;
    g.fillStyle='rgba(28,20,60,.78)'; rr(g,px-tw/2,ty,tw,th,th/2); g.fill(); g.fillStyle='#FFD54A'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt,px,ty+th/2+.5); }
  if(s.top===I.uid){ const b=Math.sin(tm*2.4)*u*.5; const cy=y-u*3.4+b; const rg=g.createRadialGradient(px,cy,0,px,cy,u*7); rg.addColorStop(0,'rgba(255,220,100,.55)'); rg.addColorStop(1,'rgba(255,220,100,0)'); g.fillStyle=rg; g.fillRect(px-u*7,cy-u*7,u*14,u*14); wCrown(g,px,cy,Math.max(7,u*2.2));
    g.font='900 '+Math.max(9,Math.round(u*1.7))+'px "NEXON Kart Gothic",sans-serif'; const t2='이번 주 인기 1위'; const tw=g.measureText(t2).width+12, th=Math.max(13,u*2.8); g.fillStyle='#FFB020'; rr(g,px-tw/2,cy-u*2.4-th-2,tw,th,th/2); g.fill(); g.fillStyle='#3A2410'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(t2,px,cy-u*2.4-th/2-1.5); }
}
function wPartyTag(g,px,py,u){ g.font='900 '+Math.max(9,Math.round(u*1.8))+'px "NEXON Kart Gothic",sans-serif'; const t='파티'; const tw=g.measureText(t).width+12, th=Math.max(13,u*2.8); const y=py-u*21.5; g.fillStyle='#FF8A3D'; rr(g,px-tw/2,y-th/2,tw,th,th/2); g.fill(); g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(t,px,y+.5); }
/* DKO 기록: 내전(승/참가) · 1대1(승/참가) */
const wRecOf=(c,uid,since)=>{ let mw=0,mp=0,dw=0,dp=0; (c.matches||[]).forEach(mt=>{ if(since&&(mt.createdAt||0)<since) return; const inA=(mt.A||[]).some(x=>x.uid===uid), inB=(mt.B||[]).some(x=>x.uid===uid); if(!inA&&!inB) return; mp++; if((inA&&mt.winner==='A')||(inB&&mt.winner==='B')) mw++; });
  (c.duels||[]).forEach(d=>{ if(d.status!=='done'||d.sa==null) return; const t=d.confAt||d.recAt||d.createdAt||0; if(since&&t<since) return; if(d.a!==uid&&d.b!==uid) return; dp++; const win=d.sa>d.sb?d.a:d.sb>d.sa?d.b:null; if(win===uid) dw++; });
  return {mw,mp,dw,dp}; };
const wRecGain=r=>r.mw*60+(r.mp-r.mw)*20+r.dw*50+(r.dp-r.dw)*15;
const wPartyUids=c=>{ const S0=new Set(); const t=Date.now(); (c.parties||[]).forEach(p=>{ const ps=p.participants||[]; if(!ps.some(x=>x.uid===c.uid)) return; const at=p.at||0; const live=typeof partyLive==='function'?partyLive(p):false; if(!live&&!(at>t-3600000&&at-t<3*3600000)) return; ps.forEach(x=>{ if(x.uid&&x.uid!==c.uid) S0.add(x.uid); }); }); return S0; };

/* ── NPC 의뢰 · 호감도 ── */
const W_NQ={
  toby:[{k:'col',n:2,t:'벽돌 공방에서 벽돌 2번 모으기'},{k:'build',n:1,t:'섬에 건물이나 장식 1개 놓기'},{k:'harvest',n:2,t:'텃밭 작물 2번 수확하기'}],
  sera:[{k:'visit',n:2,t:'크루원 섬 2곳 놀러 가기'},{k:'emote',n:3,t:'감정 표현 3번 하기'},{k:'walk',n:150,t:'월드를 150칸 산책하기'}],
  pipi:[{k:'gb',n:1,t:'크루 섬 방명록에 한마디 남기기'},{k:'water',n:2,t:'크루 텃밭에 물 2번 주기'},{k:'like',n:1,t:'마음에 드는 섬에 좋아요 누르기'}],
  owl:[{k:'kill',n:15,t:'포털 너머 몬스터 15마리 사냥하기'},{k:'stage',n:1,t:'동화 숲 스테이지 1개 깨기'},{k:'kill',n:25,t:'몬스터 25마리 사냥하기'}],
  guard:[{k:'kill',n:20,t:'몬스터 20마리 물리치기'},{k:'boss',n:1,t:'보스 1마리 쓰러뜨리기'},{k:'walk',n:250,t:'섬 순찰 250칸 걷기'}],
  mia:[{k:'plant',n:2,t:'텃밭에 씨앗 2개 심기'},{k:'harvest',n:1,t:'다 자란 작물 1번 수확하기'},{k:'build',n:1,t:'섬을 장식 하나로 꾸미기'}]};
const W_NQR={toby:90,sera:70,pipi:80,owl:140,guard:150,mia:80};
const W_AFF=[0,20,50,100,170,260]; const W_AFFN=['처음 만남','아는 사이','친한 사이','단골','절친','단짝'];
const W_AFFG={1:{b:100,t:'벽돌 100개'},2:{item:1,t:'전용 장식'},3:{d:10,t:'골드 100'},4:{b:500,t:'벽돌 500개'},5:{d:30,t:'골드 300'}};
const wAffLv=p=>{ let l=0; W_AFF.forEach((v,i)=>{ if((p||0)>=v) l=i; }); return l; };
const wNqOf=id=>{ const L=W_NQ[id]; if(!L) return null; const d=dayKey(); return L[Math.floor(wHash(wStr(d),wStr(id),9)*L.length)%L.length]; };
const wNqDay=I=>{ const q=I&&I.nq; return q&&q.d===dayKey()?{d:q.d,p:{...(q.p||{})},got:{...(q.got||{})}}:{d:dayKey(),p:{},got:{}}; };
const W_NPCL={
  sera:{2:['요즘 섬이 점점 예뻐지는 게 보여요!','소셜 아일랜드 지도는 오른쪽 위 동그라미를 눌러 봐요.','캐릭터를 꾹 누르면 감정 표현을 할 수 있어요.'],3:['오늘도 와 줬네요! 기다리고 있었어요.','당신 덕분에 월드가 더 북적북적해졌어요.','우리 단짝이니까 비밀 하나: 밤엔 별이 더 반짝여요.']},
  toby:{2:['단골 손님께는 특별히 웃어 드리죠!','이번 주엔 연말 장식이 잘 팔려요.','텃밭 작물은 비쌀수록 오래 걸려요.'],3:['당신은 우리 가게 VIP예요!','최고의 손님에게 최고의 미소를!','장사는 신용, 우정은 영원!']},
  pipi:{2:['편지 배달하다 당신 섬 지나가면 기분 좋아요!','방명록에 글 남기면 섬 주인한테 바로 알려 줘요.','크루 텃밭에 물 주면 하루가 반짝!'],3:['당신 편지는 제일 먼저 배달할게요!','우리 우정은 등기 우편처럼 튼튼해요.','오늘 하늘이 당신 섬처럼 맑아요.']},
  owl:{2:['흐음, 실력이 늘었군요.','보스의 빨간 원은 피하는 게 상책이에요.','지식은 나눌수록 커지지요.'],3:['당신은 이제 제 최고의 제자예요.','곧 얼음 섬과 하늘섬 이야기를 들려줄게요.','부엉, 오늘도 멋진 모험을!']},
  guard:{2:['순찰 협조에 감사드립니다.','이상 없음! 당신 덕분이에요.','헬바운드 보스 조심하세요.'],3:['당신은 명예 경비대원입니다!','삐빅, 우정 지수 최대치.','언제든 든든하게 지켜 드릴게요.']},
  mia:{2:['꽃 냄새 맡으러 왔어요?','텃밭에 물 주는 건 사랑 주는 거예요.','포인세티아는 연말에만 심을 수 있어요.'],3:['당신 섬의 꽃이 제일 예뻐요!','우리 같이 꽃밭 만들어요.','오늘의 꽃말은 "변치 않는 우정"이에요.']}};
const wNpcSay=(D,li,ctx)=>{ const q=ctx.q; const p=q?Math.min(q.n,ctx.p[q.k]||0):0;
  if(q&&!ctx.got&&p>=q.n) return '의뢰 다 했네요! 정말 고마워요. 작은 보답이에요♪';
  if(q&&!ctx.got&&li%3===0) return '오늘 부탁이 있어요: '+q.t+' ('+p+'/'+q.n+')';
  const L=ctx.lv>=4?(W_NPCL[D.id]||{})[3]:ctx.lv>=2?(W_NPCL[D.id]||{})[2]:null; const all=L?[...L,...D.lines]:D.lines; return all[li%all.length]; };
/* 의뢰 바텀 시트 */
function WQuest({I,onClose,onClaim,onGo}){
  const Q=wNqDay(I); const aff=I.aff||{};
  return html`<div className="wb20-shade" onClick=${onClose}><div className="wbs w69s wq69" onClick=${e=>e.stopPropagation()}>
    <div className="wbs-h"><b>주민 의뢰</b><span className="wbs-sub">매일 0시에 새 의뢰 · 호감도가 오르면 선물</span><button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="w69-body"><div className="wq69-l">${W_NPC.map(D=>{ const q=wNqOf(D.id); if(!q) return null; const p=Math.min(q.n,Q.p[q.k]||0); const done=p>=q.n, got=!!Q.got[D.id]; const pts=aff[D.id]||0; const lv=wAffLv(pts); const nx=W_AFF[lv+1]; const G=W_AFFG[lv+1];
      return html`<div key=${D.id} className=${'wq69-r'+(got?' got':done?' done':'')} style=${{'--n':D.c}}>
        <span className="wq69-av"><i>${D.n.split(' ').pop().slice(0,1)}</i></span>
        <div className="wq69-t"><b>${D.n}<span className="wq69-h">${[0,1,2,3,4].map(i=>html`<${Icon} key=${i} n="heart" s=${11} w=${2.4} fill=${i<lv?'currentColor':'none'}/>`)}</span><em>${W_AFFN[lv]}</em></b>
          <small>${q.t}</small>
          <span className="wq69-bar"><i style=${{width:(p/q.n*100)+'%'}}></i></span>
          <span className="wq69-m"><span><${BrickIc} s=${11}/>${W_NQR[D.id]} · 호감도 +20</span>${nx!=null?html`<span>다음 선물 ${G?G.t:''} · ${pts}/${nx}</span>`:html`<span>호감도 최대!</span>`}</span></div>
        ${got?html`<span className="wq69-ok"><${Icon} n="check" s=${16} w=${3}/></span>`:done?html`<button className="wq69-go tap" onClick=${()=>onClaim(D.id)}>보상</button>`:html`<button className="wq69-go alt tap" onClick=${()=>onGo(D.id)}>찾아가기</button>`}
      </div>`; })}</div>
      <p className="wq69-tip">주민을 직접 눌러 이야기하면 그날의 부탁을 들려줘요. 호감도가 오르면 대사가 바뀌고 전용 장식을 선물해요.</p></div></div></div>`;
}

/* ── 랭킹 · 이번 주 인기 섬 · 크루 전적(DKO 연동) ── */
function WRank({c,isl,mine,tab,setTab,onGo,onClaim,onClose}){
  const w0=wWeek0(); const top=wTopIsl(isl);
  const since=mine?(mine.lkAt||Date.now()-7*86400000):Date.now(); const my=wRecOf(c,c.uid,since); const gain=wRecGain(my);
  const mem=useMemo(()=>(c.members||[]).filter(m=>!m.banned).map(m=>({m,r:wRecOf(c,m.uid)})).filter(x=>x.r.mp||x.r.dp).sort((a,b)=>(b.r.mw*2+b.r.dw)-(a.r.mw*2+a.r.dw)).slice(0,20),[c.members,c.matches,c.duels]);
  const feed=[...(c.matches||[]).map(mt=>({k:'m'+mt.id,t:mt.createdAt||0,x:'내전 '+(mt.size||'')+'대'+(mt.size||''),y:mt.winner==='D'?'무승부':(mt.winner==='A'?'BLUE':'RED')+' 승리',z:[...(mt.winner==='B'?mt.B:mt.A)||[]].map(x=>x.nick).slice(0,5).join(' · ')})),
    ...(c.duels||[]).filter(d=>d.status==='done'&&d.sa!=null).map(d=>({k:'d'+d.id,t:d.confAt||d.recAt||d.createdAt||0,x:'1대1',y:(d.aNick||'')+' '+d.sa+' : '+d.sb+' '+(d.bNick||''),z:d.sa>d.sb?(d.aNick||'')+' 승리':d.sb>d.sa?(d.bNick||'')+' 승리':'무승부'}))].sort((a,b)=>b.t-a.t).slice(0,8);
  return html`<div className="wb20-shade" onClick=${onClose}><div className="wbs w69s wrk69" onClick=${e=>e.stopPropagation()}>
    <div className="wbs-h"><b>랭킹</b><span className="wbs-sub">섬 · 인기 · 크루 전적</span><button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="wbs-tabs">${[['isl','섬 랭킹'],['hot','이번 주 인기'],['rec','크루 전적']].map(([k,l])=>html`<button key=${k} className=${'tap'+(tab===k?' on':'')} onClick=${()=>setTab(k)}>${l}</button>`)}</div>
    <div className="w69-body">
    ${tab==='isl'?html`<div className="wr21">${[...isl].map(I=>({I,sc:I.hallLv*100+I.items.length*5+Object.keys(I.likes||{}).length*20+(I.exp||0)*60+I.land.length*12})).sort((a,b)=>b.sc-a.sc).map(({I,sc},i)=>{ const m=c.members.find(x=>x.uid===I.uid);
        return html`<button key=${I.uid} className=${'wr21-r tap'+(I.uid===c.uid?' me':'')} onClick=${()=>onGo(I.uid)}>
          <span className="wr21-n">${i+1}</span>${m?html`<${PfpView} m=${m} s=${34}/>`:null}<span className="wr21-t"><b>${I.name}</b><small>본부 Lv.${I.hallLv} · 건물 ${I.items.length} · 땅 +${I.land.length} · ♥ ${Object.keys(I.likes||{}).length}</small></span><em>${sc.toLocaleString()}</em></button>`; })}</div>
      <p className="wr21-tip">크루원 섬에 놀러 가면 섬마다 하루 한 번 벽돌 15개를 받아요.</p>`:null}
    ${tab==='hot'?html`${top?(()=>{ const m=c.members.find(x=>x.uid===top.uid); const S0=wWeekScore(top,w0); return html`<button className="wh69 tap" onClick=${()=>onGo(top.uid)}><i className="wh69-sh"></i><span className="wh69-cr"><${Icon} n="crown" s=${22} w=${2.4}/></span>
        ${m?html`<${PfpView} m=${m} s=${56}/>`:null}<div><em>이번 주 인기 섬 TOP 1</em><b>${top.name}</b><small>${m?dispName(m):''} · ♥ ${S0.lk} · 발자국 ${S0.ft} · 방명록 ${S0.gb}</small></div><span className="wh69-sc">${S0.sc}<small>점</small></span></button>`; })()
        :html`<div className="wh69 none"><span className="wh69-cr"><${Icon} n="crown" s=${22} w=${2.4}/></span><div><em>이번 주 인기 섬 TOP 1</em><b>아직 없어요</b><small>좋아요 · 발자국 · 방명록을 받으면 점수가 올라가요</small></div></div>`}
      <div className="wr21">${[...isl].map(I=>({I,S0:wWeekScore(I,w0)})).filter(x=>x.S0.sc>0).sort((a,b)=>b.S0.sc-a.S0.sc).map(({I,S0},i)=>{ const m=c.members.find(x=>x.uid===I.uid); return html`<button key=${I.uid} className=${'wr21-r tap'+(I.uid===c.uid?' me':'')} onClick=${()=>onGo(I.uid)}><span className="wr21-n">${i+1}</span>${m?html`<${PfpView} m=${m} s=${34}/>`:null}<span className="wr21-t"><b>${I.name}</b><small>♥ ${S0.lk} · 발자국 ${S0.ft} · 방명록 ${S0.gb}</small></span><em>${S0.sc}</em></button>`; })}</div>
      <p className="wr21-tip">매주 월요일 0시에 새로 집계해요 · 좋아요 3점 · 발자국 2점 · 방명록 2점</p>`:null}
    ${tab==='rec'?html`<div className="wrc69"><span className="gi30" style=${{'--g1':'#FF7A7A','--g2':'#B0203A'}}><${Icon} n="swords" s=${20} w=${2.3}/></span><div><b>DKO 전적 보상</b><small>내전 승리 60 · 참가 20 · 1대1 승리 50 · 참가 15 벽돌</small><small>새 기록: 내전 ${my.mw}승 ${my.mp-my.mw}패 · 1대1 ${my.dw}승 ${my.dp-my.dw}패</small></div>
        <button className=${'wbi-mini tap'+(gain>0?'':' off')} onClick=${()=>gain>0&&onClaim(gain)}><${BrickIc} s=${14}/>${gain}</button></div>
      <div className="wg69-sec">크루 전적<span>DKO 내전 · 1대1 기록이 섬 이름표에 떠요</span></div>
      <div className="wr21">${mem.length?mem.map(({m,r},i)=>html`<div key=${m.uid} className=${'wr21-r'+(m.uid===c.uid?' me':'')}><span className="wr21-n">${i+1}</span><${PfpView} m=${m} s=${34}/><span className="wr21-t"><b>${dispName(m)}</b><small>내전 ${r.mw}승 / ${r.mp}전 · 1대1 ${r.dw}승 / ${r.dp}전</small></span><em>${r.mw*2+r.dw}</em></div>`):html`<p className="wgb69-none">아직 기록이 없어요. 내전이나 1대1을 하면 여기 쌓여요.</p>`}</div>
      ${feed.length?html`<div className="wg69-sec">최근 결과</div><div className="wrf69">${feed.map(f=>html`<div key=${f.k} className="wrf69-r"><em>${f.x}</em><b>${f.y}</b><small>${f.z} · ${ago(f.t)}</small></div>`)}</div>`:null}`:null}
    </div></div></div>`;
}

/* ── 크리스마스 · 텃밭 · NPC 선물 장식 그림 ── */
const W_DRAWX={
  farm:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*.6,u*7.6,u*3.8,.16); C(-4,-4,0,8,8,.8,'#9A6A44'); [-3.2,-.8,1.6].forEach(y=>C(-3.4,y,.8,6.8,1.5,.45,'#6B4226',{t:'#7A4E2C',l:'#5A3820',r:'#4A2E18'})); [[-4.3,-4.3],[3.6,-4.3],[-4.3,3.6],[3.6,3.6]].forEach(([x,y])=>C(x,y,0,.7,.7,2,'#D9A86A')); },
  xm_tree:(g,ox,oy,u,tm,seed)=>{ g.save(); g.translate(ox,oy); g.scale(.8,.8); wDrawItem(g,'xtree',0,0,u,tm,seed,1); g.restore(); },
  xm_big:(g,ox,oy,u,tm,seed)=>{ g.save(); g.translate(ox,oy); g.scale(1.9,1.9); wDrawItem(g,'xtree',0,0,u,tm,seed,1); g.restore(); const k=.5+.5*Math.sin(tm*3); const P=[ox,oy-u*28]; g.fillStyle='rgba(255,230,140,'+(.25+k*.25)+')'; g.beginPath(); g.arc(P[0],P[1],u*(3+k),0,Math.PI*2); g.fill(); },
  xm_gift:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*5.4,u*2.6); C(.6,-3.2,0,2.8,2.8,2,'#2E9A57'); C(1.75,-3.2,0,.5,2.8,2.05,'#FFFFFF'); C(-3.2,-2.4,0,3.2,3.2,2.8,'#E5383B'); C(-1.85,-2.4,0,.5,3.2,2.85,'#FFD54A'); C(-3.2,-1.05,0,3.2,.5,2.85,'#FFD54A'); C(-.8,.8,0,2.6,2.6,1.8,'#3B82F6'); C(.25,.8,0,.5,2.6,1.85,'#FFFFFF'); C(-2.8,-2,2.8,2.4,2.4,1.6,'#FFD54A'); C(-1.85,-2,2.8,.5,2.4,1.65,'#E5383B'); },
  xm_candy:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*.6,u*2.4,u*1.2); for(let i=0;i<9;i++) C(-.6,-.6,i,1.2,1.2,1,i%2?'#FFFFFF':'#E5383B'); C(.6,-.6,8,1.2,1.2,1,'#FFFFFF'); C(1.8,-.6,8,1.2,1.2,1,'#E5383B'); C(1.8,-.6,7,1.2,1.2,1,'#FFFFFF'); C(1.8,-.6,6,1.2,1.2,1,'#E5383B'); },
  xm_light:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*.6,u*2.4,u*1.2); C(-1,-1,0,2,2,.8,'#3A3F4C'); C(-.45,-.45,.8,.9,.9,9,'#2B2F3A'); C(-.9,-.9,9.8,1.8,1.8,.6,'#FFD54A');
    for(let i=0;i<8;i++){ const on=Math.floor(tm*3+i)%3!==0; const a=i*1.3+seed; const z=2+i; const px=Math.cos(a)*1.3, py=Math.sin(a)*1.3; const p=[ox+(px-py)*u,oy+(px+py)*u*.5-z*u]; g.fillStyle=on?['#FF5A5A','#FFD166','#5AE0FF','#7CF0B5'][i%4]:'rgba(255,255,255,.25)'; g.beginPath(); g.arc(p[0],p[1],u*.48,0,Math.PI*2); g.fill(); if(on){ g.fillStyle='rgba(255,240,200,.25)'; g.beginPath(); g.arc(p[0],p[1],u*1.1,0,Math.PI*2); g.fill(); } } },
  xm_snow:(g,ox,oy,u,tm,seed,lv,C)=>{ const o={t:'#FFFFFF',l:'#E6EEFA',r:'#C9D6EA'}; wShadow(g,ox,oy+u*.8,u*5,u*2.4,.12); C(-3.2,-3,0,6.4,6,1.2,'#F4F8FF',o); C(-2.2,-2.2,1.2,4.6,4.2,1.2,'#FFFFFF',o); C(-1,-1.2,2.4,2.2,2,.9,'#FFFFFF',o); },
  xm_deer:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*5,u*2.4); const b='#A8703F', d='#7A4E2C'; [[-2.2,-.8],[1,-.8],[-2.2,.4],[1,.4]].forEach(([x,y])=>C(x,y,0,.7,.6,3,d)); C(-2.6,-1,3,4.8,2,2.2,b); C(-2.9,-.4,4.4,.6,.6,.6,'#FFFFFF'); C(1.4,-.7,4.8,1.3,1.4,2.2,b); C(1.2,-1,6.8,2.4,2,1.7,b); C(3.5,-.35,7.2,.8,.8,.8,'#FF3B30',{t:'#FF7A6E',l:'#FF3B30',r:'#C42A20'}); C(1.5,-1.3,8.5,.4,.4,1.8,'#E8D2A6'); C(1.5,.4,8.5,.4,.4,1.8,'#E8D2A6'); C(.9,-1.3,9.8,.6,.4,.4,'#E8D2A6'); C(.9,.4,9.8,.6,.4,.4,'#E8D2A6');
    const k=.5+.5*Math.sin(tm*4); g.fillStyle='rgba(255,80,60,'+(.18+k*.25)+')'; g.beginPath(); g.arc(ox+(3.9+.05)*u,oy+(3.9)*u*.5-7.6*u,u*1.4,0,Math.PI*2); g.fill(); },
  xm_wreath2:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*9,u*3); const gr='#2E7D4F'; C(-7.6,-.8,0,1.6,1.6,8,gr); C(6,-.8,0,1.6,1.6,8,gr); C(-7.6,-.8,8,15.2,1.6,1.8,gr); for(let i=0;i<9;i++){ const x=-7+i*1.7; C(x,-.9,9.6,1,1.8,.6,'#3FA65C'); } C(-1,-1.1,6.8,2,.5,1.6,'#E5383B'); C(-.4,-1.15,5.6,.8,.5,1.2,'#E5383B');
    for(let i=0;i<10;i++){ const on=Math.floor(tm*2.5+i)%2===0; const x=-7+i*1.55; const p=[ox+(x+.8)*u,oy+(x+.8)*u*.5-9.8*u]; g.fillStyle=on?['#FFD166','#FF5A5A','#5AE0FF'][i%3]:'rgba(255,255,255,.3)'; g.beginPath(); g.arc(p[0],p[1],u*.42,0,Math.PI*2); g.fill(); } },
  xm_sleigh2:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*9,u*3); C(-6.5,-2.2,0,13,.5,.5,'#FFD54A'); C(-6.5,1.7,0,13,.5,.5,'#FFD54A'); C(-6,-2.2,.5,.5,4.4,1.2,'#C98A00'); C(5,-2.2,.5,.5,4.4,1.2,'#C98A00'); C(-6,-2.2,1.5,12,4.4,2.6,'#D7263D'); C(-6.4,-2.4,4.1,1.6,4.8,2.6,'#B81E31'); C(-4.4,-2.2,4.1,10.4,4.4,.4,'#8A1424');
    C(-2.4,-1.6,4.5,2.4,2.4,2.2,'#3B82F6'); C(.4,-1.4,4.5,2.4,2.2,1.6,'#2E9A57'); C(2.6,-1.6,4.5,1.8,2,2.6,'#FFD54A'); C(-1.4,-1.6,4.5,.4,2.4,2.25,'#FFFFFF'); },
  xm_ginger:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*1.5,u*7,u*3.4); const w='#B5703A'; C(-4,-4,0,8,8,6,w); C(-4.6,-4.6,6,9.2,9.2,1,'#FFFFFF',{t:'#FFFFFF',l:'#F2F2F2',r:'#DCDCDC'}); C(-3.6,-3.6,7,7.2,7.2,1.4,w); C(-2.6,-2.6,8.4,5.2,5.2,1.4,'#FFFFFF',{t:'#FFFFFF',l:'#F2F2F2',r:'#DCDCDC'}); C(-1.6,-1.6,9.8,3.2,3.2,1.4,w); C(-.6,-.6,11.2,1.2,1.2,1,'#E5383B');
    C(-1,4,0,2,.3,3.4,'#7A3E1A'); C(-3.4,4,3.2,1.6,.3,1.6,'#8ED6FF',{t:'#BDEBFF',l:'#8ED6FF',r:'#6CB8E6'}); C(1.8,4,3.2,1.6,.3,1.6,'#8ED6FF',{t:'#BDEBFF',l:'#8ED6FF',r:'#6CB8E6'}); for(let i=0;i<5;i++) C(-3.6+i*1.7,4.05,5.4,.8,.3,.5,['#FF5A5A','#7CF0B5','#FFD54A','#5AE0FF','#FF8AE0'][i]); },
  n_toby2:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*9,u*3); [[-6,-1.6],[5.2,-1.6],[-6,1],[5.2,1]].forEach(([x,y])=>C(x,y,0,.8,.8,4,'#7A4E2C')); C(-6.4,-2,2,13,3.6,1.6,'#C98A56'); C(-5,-1.4,3.6,2,2,1.4,'#FF4B3E'); C(-2.4,-1.4,3.6,2,2,1.2,'#FFD54A'); C(.2,-1.4,3.6,2,2,1.4,'#3FB65C'); C(2.8,-1.4,3.6,2,2,1,'#FF9A2E');
    for(let i=0;i<6;i++) C(-7+i*2.4,-2.4,7.4,2.4,4.4,.6,i%2?'#FFFFFF':'#2F7FE0'); C(-6.8,-2.4,4,.4,.4,3.4,'#5A3A20'); C(6.4,-2.4,4,.4,.4,3.4,'#5A3A20'); },
  n_sera:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*.6,u*3,u*1.4); C(-.5,-.5,0,1,1,8,'#8A5A34'); C(-3.6,-.4,5.6,4,.8,1.6,'#FF8FB0'); C(-.4,-.4,3.4,4.2,.8,1.6,'#7CC2FF'); C(-3,-.6,7.6,3.4,.8,.3,'#FFFFFF'); C(-1,-1,8,2,2,1,'#FFD54A'); },
  n_pipi:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*4.4,u*2.2); C(-2.6,-2.6,0,5.2,5.2,4,'#7CC2FF'); C(-2.8,-2.8,4,5.6,5.6,.6,'#2F7FE0'); C(-1.4,2.6,1.6,2.8,.3,1.2,'#1A3A6A'); const b=Math.sin(tm*3)*u*.3; for(let i=0;i<3;i++){ const p=[ox+(-1+i)*u*1.4,oy-u*(5.4+i*.3)+b]; g.fillStyle='#FFFFFF'; g.fillRect(p[0]-u*1.1,p[1]-u*.7,u*2.2,u*1.4); g.strokeStyle='#E5383B'; g.lineWidth=Math.max(1,u*.25); g.beginPath(); g.moveTo(p[0]-u*1.1,p[1]-u*.7); g.lineTo(p[0],p[1]); g.lineTo(p[0]+u*1.1,p[1]-u*.7); g.stroke(); } },
  n_owl:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*4.4,u*2.2); ['#C0392B','#2F7FE0','#3FA65C','#8E44AD','#E67E22'].forEach((col,i)=>C(-2.6+(i%2)*.3,-2+(i%2)*.2,i*1.1,5.2-(i%2)*.4,4,1.1,col)); C(-1,-1,5.5,2,2,2,'#A8805A'); C(-.6,-1.1,6.8,.5,.3,.5,'#FFFFFF'); C(.4,-1.1,6.8,.5,.3,.5,'#FFFFFF'); },
  n_guard:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*3.6,u*1.8); C(-1.6,-1.6,0,3.2,3.2,3,'#FF6B4A'); C(-1.4,-1.4,3,2.8,2.8,2.4,'#E8E8EE'); C(-1,1.4,3.6,2,.3,.9,'#2B2F3A'); const k=Math.floor(tm*2)%2; C(-.3,-.3,5.4,.6,.6,1.4,'#8E98A8'); C(-.5,-.5,6.8,1,1,1,k?'#FF3B30':'#FFD54A'); },
  n_mia:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*5,u*2.4); [[-2.8,-2.8,'#FF6B8A'],[.6,-2.6,'#FFD166'],[-2.6,.6,'#B98CFF'],[.8,.8,'#7CC8FF']].forEach(([x,y,col])=>{ C(x,y,0,2.2,2.2,1.6,'#C9653A'); C(x+.5,y+.5,1.6,1.2,1.2,1,'#3E9A52'); C(x+.2,y+.2,2.6,1.8,1.8,1,col); }); }
};
W_DRAWX.xm_wreath=(g,ox,oy,u,tm,seed,lv,C)=>{ g.save(); g.translate(ox,oy); g.scale(.55,.55); W_DRAWX.xm_wreath2(g,0,0,u,tm,seed,lv,(...a)=>wCube(g,0,0,u,...a)); g.restore(); };
W_DRAWX.xm_sleigh=(g,ox,oy,u,tm,seed,lv,C)=>{ g.save(); g.translate(ox,oy); g.scale(.55,.55); W_DRAWX.xm_sleigh2(g,0,0,u,tm,seed,lv,(...a)=>wCube(g,0,0,u,...a)); g.restore(); };
W_DRAWX.n_toby=(g,ox,oy,u,tm,seed,lv,C)=>{ g.save(); g.translate(ox,oy); g.scale(.55,.55); W_DRAWX.n_toby2(g,0,0,u,tm,seed,lv,(...a)=>wCube(g,0,0,u,...a)); g.restore(); };
/* 소셜 아일랜드 연말 장식 (시즌에만) */
const W_XDECO=[[-8,4,'xm_big'],[-7,5,'xm_gift'],[5,-9,'xm_snow'],[-9,3,'xm_light'],[3,-9,'xm_light'],[-12,4,'snowman'],[-6,6,'xm_candy'],[8,3,'xm_deer'],[2,-10,'xm_gift'],[-11,0,'xm_snow']];
/* v29.1 장식은 땅 위 · 길과 명소 밖에만 (배치를 바꿔도 길을 막지 않아요) */
const wCDecoC=new WeakMap();
const wCDeco=(xm,W)=>{ const L=xm?[...W_CDECO,...W_XDECO]:W_CDECO; if(!W) return L; const ck=wCDecoC.get(W); if(ck&&ck.xm===xm) return ck.L;
  const lm=new Set(); W_LM.forEach(l=>{ for(let i=0;i<(l.f?4:3);i++) for(let j=0;j<(l.f?3:4);j++) lm.add((l.x+i)+','+(l.y+j)); });
  const out=L.filter(([x,y,t])=>wCells({t},x,y).every(([a,b])=>{ const k=a+','+b; const t0=W.T.get(k); return t0&&t0.isl==='center'&&t0.t!=='path'&&t0.t!=='bridge'&&t0.t!=='moat'&&t0.t!=='blvd'&&!lm.has(k); }));
  /* 바닷가 둘레 숲 · 꽃밭: 길 · 다리 · 명소 주변 2칸은 비워 둬요 */
  const near=new Set(); W.T.forEach(t0=>{ if(t0.isl!=='center'&&t0.t!=='bridge') return; if(t0.t==='path'||t0.t==='bridge'||t0.t==='stone') for(let a=-2;a<=2;a++) for(let b=-2;b<=2;b++) if(Math.abs(a)+Math.abs(b)<=(t0.t==='bridge'?3:1)) near.add((t0.x+a)+','+(t0.y+b)); });
  lm.forEach(k=>{ const [x,y]=k.split(',').map(Number); for(let a=-1;a<=1;a++) for(let b=-1;b<=1;b++) near.add((x+a)+','+(y+b)); });
  const used=new Set(); out.forEach(([x,y,t])=>wCells({t},x,y).forEach(([a,b])=>{ for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) used.add((a+i)+','+(b+j)); }));
  const TR=['pine','tree','pine','bush','sakura','rock','tree','pine'], FL=['flower','flower','mush','bush'];
  W.T.forEach(t0=>{ if(t0.isl!=='center'||(t0.t!=='grass'&&t0.t!=='sand')) return; const k=t0.x+','+t0.y; if(near.has(k)||used.has(k)) return; const d=Math.sqrt(t0.x*t0.x+t0.y*t0.y*1.08); const h=wHash(t0.x*3+1,t0.y*5-2,29);
    if(t0.t==='grass'&&d>11.5&&h>.8){ const t=TR[Math.floor(wHash(t0.x,t0.y,31)*TR.length)]; out.push([t0.x,t0.y,t]); for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) used.add((t0.x+i)+','+(t0.y+j)); }
    else if(t0.t==='grass'&&h>.9){ out.push([t0.x,t0.y,FL[Math.floor(wHash(t0.x,t0.y,37)*FL.length)]]); used.add(k); }
    else if(t0.t==='sand'&&h>.93){ out.push([t0.x,t0.y,h>.97?'rock':'bush']); used.add(k); } });
  wCDecoC.set(W,{xm,L:out}); return out; };
/* 눈 내리는 밤 */
function wSnowFx(g,s,tm){ const W=s.vw, H=s.vh; g.fillStyle='rgba(255,255,255,.85)'; for(let i=0;i<60;i++){ const sp=18+wHash(i,3,3)*26; const y=((wHash(i,1,5)*H+tm*sp)%(H+20))-10; const x=(wHash(i,2,7)*W+Math.sin(tm*.8+i)*14+tm*6)%(W+20)-10; const r=.9+wHash(i,5,1)*1.8; g.globalAlpha=.35+wHash(i,4,4)*.5; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); } g.globalAlpha=1; }
/* 크루 텃밭에 물 줄 수 있나: 자라는 중 · 내가 이번 작물에 아직 안 줬고 · 3번 미만 */
const wCanWater=(I,pid,uid,now)=>{ if(!I||I.uid===uid) return false; const P=wPlotOf(I,pid); if(!P) return false; const end=wPlotEnd(I,pid); if(now>=end) return false; const W0=wPlotWater(I,pid,P.at); if(W0.length>=3) return false; return !W0.some(([k])=>k===pid+'_'+uid); };

/* ═════════ v27.7 소셜 아일랜드 환전소: D-Coin → 월드 골드 ═════════ */
function WExchange({coins,gold,social,onEx,onGo}){
  const [n,setN]=useState(10); const opts=[10,50,100,300].filter(v=>v<=Math.max(10,coins)); const ok=social&&coins>=n&&n>0;
  return html`<div className="wx77">
    <div className="wx77-card">
      <div className="wx77-side d"><small>내 D-Coin</small><b><${Coin} s=${18}/>${coins.toLocaleString()}</b></div>
      <span className="wx77-ar"><${Icon} n="chev" s=${18} w=${2.8}/></span>
      <div className="wx77-side g"><small>월드 골드</small><b><${GoldIc} s=${20}/>${(gold||0).toLocaleString()}</b></div>
    </div>
    <p className="wx77-rate">D-Coin 1 = 골드 ${W_GOLD_RATE} · 골드는 D-Coin으로 되돌릴 수 없어요</p>
    ${social?html`<div className="wx77-opts">${opts.map(v=>html`<button key=${v} type="button" className=${'tap'+(n===v?' on':'')} onClick=${()=>setN(v)}><b><${Coin} s=${13}/>${v}</b><small><${GoldIc} s=${12}/>${(v*W_GOLD_RATE).toLocaleString()}</small></button>`)}</div>
      <button type="button" className=${'wx77-go tap'+(ok?'':' off')} onClick=${()=>ok&&onEx(n)}><${GoldIc} s=${18}/>${coins>=n?'골드 '+(n*W_GOLD_RATE).toLocaleString()+'으로 바꾸기':'D-Coin이 모자라요'}</button>`
    :html`<div className="wx77-lock"><${Icon} n="lock" s=${22} w=${2.2}/><b>환전소는 소셜 아일랜드에 있어요</b><small>D-Coin은 소셜 아일랜드에서만 월드와 주고받을 수 있어요</small><button type="button" className="tap" onClick=${onGo}><${Icon} n="plaza" s=${15} w=${2.4}/>소셜 아일랜드로 가기</button></div>`}
  </div>`;
}

/* ═════════ v27.8 DKO 월드 전투 코어 (기획서 PART 2-2 · 3-1 · 3-2 · 3-3) ═════════
   · 정수 피해 공식: round(공격력 × 100/(100+방어력) × 치명타 × 버프)
   · 약점 2단계: 일반 약점(반경 0.45칸) 1.5배(딜러 1.6배) · 정밀 약점(0.18칸, 딜러 전용) 2.0배
   · 4원소 상태이상 (일반 몹 / 초대형 보스 보정 분리)
   · 궁극기 게이지 · 탱커/딜러/힐러 패시브 · 스킬 · 궁극기 · 솔로 보정 · 크루 원정 체력 배율 */
const CB_BASE_HP=220;
const CB_ROLE={
  tank:{n:'탱커',e:'TANK',ic:'shield',c:['#7CC2FF','#2563EB'],
    pas:['수호의 결계','보조 버튼을 누르고 있으면 받는 피해 -40% · 주변 5칸 몬스터가 나를 노려요 · 막을 때마다 궁극기 +6'],
    sk:['강화 보호막','짧게 탭 · 쿨 10초 · 반경 4.5칸 보호막 70 (5초). 방패/보호막으로 3번 막으면 다음 공격이 충격파(추가 45 · 1.2초 기절)'],
    ul:['불굴의 방벽','6초 동안 나와 주변 4칸 아군의 받는 피해 -60% · 상태이상 · 밀려남 면역'],
    solo:'솔로: 보호막 1.4배(98) · 충격파 1.5배(68)'},
  dealer:{n:'딜러',e:'DAMAGE',ic:'swords',c:['#FF8A8A','#D02A3A'],
    pas:['약점 포착','일반 약점 안에 정밀 중심점(2.0배 초치명타)이 보여요 · 약점 치명타 1.6배'],
    sk:['전술 회피','탭하거나 끌어서 그 방향으로 3.5칸 대쉬 · 쿨 6초 · 0.3초 무적'],
    ul:['약점 간파','7초 동안 반경 12칸 보스의 숨은 약점이 강제로 열려요 · 일반 몹 약점 원 +30%'],
    solo:'솔로: 초치명타 적중 시 최대 체력 5% 회복 · 회피 쿨 1초 단축'},
  healer:{n:'힐러',e:'SUPPORT',ic:'heart',c:['#7CF0B5','#139A63'],
    pas:['치유의 오라','반경 4.5칸 아군 초당 체력 +5'],
    sk:['치유의 파동','탭 · 쿨 9초 · 반경 5칸 체력 +55 · 화상 · 둔화 · 감전 · 빙결 해제'],
    ul:['생명의 성역','12초 동안 체력 180짜리 회복 터렛 설치 · 반경 5칸 초당 체력 +18'],
    solo:'솔로: 오라가 늘 나에게 · 터렛 범위 안에서 공격력 +20%'}
};
const CB_ELEM={
  earth:{n:'흙',e:'EARTH',k:'대지',c:['#E8C060','#8A5A12'],ic:'shield',mob:'강경직 + 방어력 -15% (4초)',boss:'경직 게이지 누적 +30%'},
  fire:{n:'불',e:'FIRE',k:'불',c:['#FF9A4A','#D0300A'],ic:'flame',mob:'화상 3초 · 초당 8 (최대 3중첩)',boss:'똑같이 화상'},
  ice:{n:'얼음',e:'ICE',k:'얼음',c:['#9CE4FF','#2F8FE0'],ic:'snow',mob:'둔화 -25% 3초 · 5타째 1.5초 완전 빙결',boss:'빙결 대신 동상 (공속 -20% · 경직 +20)'},
  bolt:{n:'번개',e:'BOLT',k:'번개',c:['#FFE45A','#9A5AE8'],ic:'bolt',mob:'주변 3칸 적 2명에게 15 피해 연쇄',boss:'보스와 소환물 사이로 연쇄'}
};
/* 몬스터 스케일 (기획서 4-3 진행 티어표): [체력, 공격력, 방어력] */
const CB_MOB={slime:[90,16,5],bslime:[120,18,5],kslime:[1400,30,10],mush:[160,24,15],wisp:[140,26,15],gmush:[380,38,15],mking:[3200,55,35],
  imp:[240,34,22],mslime:[270,34,22],skel:[540,52,22],hound:[3600,66,40],golem:[4200,70,45]};
const CB_FIRE_MOB=new Set(['imp','mslime','hound','golem']);
/* 약점 위치: f>0 앞 · f<0 등 · 0 정수리 (보스는 패턴 빈틈 · 경직 100 · 딜러 궁극기 때만 열려요) */
const CB_WP={slime:{f:-.5},bslime:{f:-.5},mush:{f:-.5},wisp:{f:-.45},imp:{f:-.5},mslime:{f:-.5},skel:{f:-.55},gmush:{f:-.55},
  kslime:{f:0,boss:1,n:'정수리 왕관'},mking:{f:0,boss:1,n:'황금 왕관'},hound:{f:-.6,boss:1,n:'등 뒤 불꽃 갈기'},golem:{f:.55,boss:1,n:'가슴 용암 핵'}};
const CB_PARTY=[1,1,1.6,2.2,2.8];
const CB_SWORD={atk:[30,36,43,50],spd:1.6,range:2.0,arc:Math.PI/2};
/* ── 조작 설정 (기기마다 저장) ── */
const CB_CTL_DEF={stick:'float',dz:.1,size:1,op:.92,hitstop:1,shake:1,aim:'near',pos:{atk:[24,36],sec:[130,30],ult:[112,140],mv:[110,120],sw:[34,142],wh:[200,104],fd:[206,34]}};
const cbCtl=()=>{ try{ const o=JSON.parse(localStorage.getItem('dko-cbctl')||'null')||{}; return {...CB_CTL_DEF,...o,pos:{...CB_CTL_DEF.pos,...(o.pos||{})}}; }catch(e){ return {...CB_CTL_DEF}; } };
const cbCtlSave=o=>{ try{ localStorage.setItem('dko-cbctl',JSON.stringify(o)); }catch(e){} try{ window.dispatchEvent(new Event('dko-cbctl')); }catch(e){} };
const cbEntry=()=>{ try{ return {mode:'solo',role:'dealer',elem:'fire',...(JSON.parse(localStorage.getItem('dko-cbentry')||'null')||{})}; }catch(e){ return {mode:'solo',role:'dealer',elem:'fire'}; } };
const cbEntrySave=o=>{ try{ localStorage.setItem('dko-cbentry',JSON.stringify(o)); }catch(e){} };

/* ── 내 능력치 (기본 체력 220 · 정수 · PART 4 장비) ── */
function cbStats(r){ const G=gearOf(r); const E=gEquipped(G); const set=gSetOf(G);
  const w=E.w, W=w?{...GW[w.k],k:w.k}:{...GW.sword,k:'sword'}; const blunt=!!(w&&w.d<=0);
  let def=0; [E.h,E.a,E.g].forEach(x=>{ if(x) def+=Math.round(GA[x.k].def[x.r]*gUpMul(x)); });
  const hp=CB_BASE_HP+(E.a?GA.armor.sv[E.a.r]:0)+(r.lv-1)*4+(set==='earth'?40:0)+(typeof dkHpBonus==='function'&&r.dk?dkHpBonus(dkOf(r)):0)+(typeof lifePerk==='function'?lifePerk(r,'pu'):0);
  const atk=Math.round((w?W.atk[w.r]*gUpMul(w):24)*(blunt?.5:1)*(set==='fire'?1.1:1))+Math.floor((r.lv-1)/2);
  const sh=r.eq&&r.eq.shield?({b:0,s:1,g:2})[eqParse(r.eq.shield).t]:-1;
  const BF=typeof bufOf==='function'?bufOf(r):null; const bi=BF?Math.max(0,Math.min(2,BF.lv-1)):0;
  const atkB=BF?(BF.t==='ATK'?1+[.1,.15,.2][bi]:BF.t==='WEAK'?.9:1):1, defB=BF&&BF.t==='DEF'?[15,25,35][bi]:0, spdB=BF&&BF.t==='SPD'?[.1,.14,.18][bi]:0;
  return {hp,atk:Math.round(atk*atkB),def:def+defB,buf:BF,spd:1+spdB+(E.g?GA.greaves.sv[E.g.r]/100:0)+(set==='bolt'?.05:0),block:sh>=0?Math.max(.4,EQ_SHIELD.block[sh]*.8):.4,shield:true,cd:0,dur:0,
    w,W,wel:gElemOf(w),blunt,aspd:W.spd*(w&&w.sub==='spd'?1.08:1),rng:W.rng+(w&&w.sub==='rng'?.5:0),crit:w&&w.sub==='crit'?.1:0,
    epic:!!(w&&w.r>=2&&!blunt),leg:!!(w&&w.r===3&&!blunt),durMax:w?gDurMax(w):0,critRed:E.h?GA.helm.sv[E.h.r]/100:0,hres:E.h?E.h.el:null,lavaRes:!!(E.g&&E.g.el==='fire'),set}; }
/* 장비가 바뀌면 (무뎌짐 · 스왑 · 숫돌) 능력치 다시 계산 */
function cbSyncGear(s){ const k=s.me.hp/(s.st.hp||1); s.st=cbStats(s.rpg); s.me.hp=Math.max(s.me.dead?0:1,Math.round(s.st.hp*k)); const cb=s.cb; if(cb){ cb.elem=s.st.wel||cb.elem0; cb.cdMax=Math.round(cb.cdBase*(s.st.set==='bolt'?.88:1)*10)/10; } }

/* ── 전투 상태 만들기 ── */
function cbInit(s,E,party){ const solo=(party||1)<2;
  s.cb={role:E.role,elem:E.elem,mode:E.mode,party:party||1,solo,ult:0,ultOn:0,ultT:0,cdSk:0,cdMax:E.role==='tank'?10:E.role==='dealer'?(solo?5:6):9,
    guard:false,blockN:0,shock:false,shieldHp:0,shieldT:0,iframe:0,dash:null,turret:null,scan:0,st:{},hold:0,aim:null,lastFire:0,feed:[],ctl:cbCtl(),healTick:0,
    elem0:E.elem,cdBase:E.role==='tank'?10:E.role==='dealer'?(solo?5:6):9,proj:[],fields:[],atkN:0,lastAtk:0,ocT:0,swapT:0};
  if(s.st&&s.rpg) cbSyncGear(s); }
const cbPartyMul=n=>CB_PARTY[Math.max(1,Math.min(4,n||1))];
function cbMobInit(m,party){ const V=CB_MOB[m.t]; if(!V) return m; const k=cbPartyMul(party); m.mhp=m.hp=Math.round(V[0]*k); m.atkV=V[1]; m.def=V[2]; m.st={}; m.stag=0; m.wpOpen=0; m.iceN=0; return m; }
const cbMobLocked=(m,now)=>{ const S=m.st||{}; return (S.frz>now)||(S.stun>now)||(m.stagT>now); };
const cbMobSpd=(m,now)=>{ const S=m.st||{}; return S.slow>now?.75:1; };
const cbMobDef=(m,now)=>{ const S=m.st||{}; return Math.round((m.def||0)*(S.ddn>now?.85:1)); };
/* 몬스터 공격 속도: 보스 동상(-20%) */
const cbMobAtkMul=(m,now)=>{ const S=m.st||{}; return S.chill>now?.8:1; };

/* 약점 좌표 */
function cbWpPos(m){ const W=CB_WP[m.t]||{f:-.5}; const sz=(MOB[m.t]&&MOB[m.t].sz)||1; const fx=-Math.sin(m.yaw||0), fy=Math.cos(m.yaw||0); const off=W.f*sz; return [m.x+fx*off,m.y+fy*off]; }
function cbWpOpen(s,m,now){ const W=CB_WP[m.t]; if(!W||!W.boss) return true; if(m.wpOpen>now) return true; const cb=s.cb; if(cb&&cb.role==='dealer'&&cb.ultOn>now&&Math.hypot(m.x-s.me.x,m.y-s.me.y)<12) return true; if(s.coScan&&s.coScan.end>now&&Math.hypot(m.x-s.coScan.x,m.y-s.coScan.y)<12) return true; return false; }
function cbWpR(s,m,now){ const W=CB_WP[m.t]; let r=W&&W.boss?.6:.45; if(s.cb&&s.cb.role==='dealer'&&s.cb.ultOn>now&&!(W&&W.boss)) r*=1.3; return r; }
/* 점과 광선 거리 (광선은 몸통에 닿는 곳에서 멈춰요) */
function cbRayDist(px,py,ax,ay,dx,dy,L){ let t=(px-ax)*dx+(py-ay)*dy; t=Math.max(0,Math.min(L,t)); const qx=ax+dx*t, qy=ay+dy*t; return Math.hypot(px-qx,py-qy); }
/* 치명타 판정: 0=없음 1=약점 2=정밀 */
function cbCritOf(s,m,ax,ay,dx,dy,now){ if(!cbWpOpen(s,m,now)) return 0; const [wx,wy]=cbWpPos(m); const dC=Math.hypot(m.x-ax,m.y-ay); const d=cbRayDist(wx,wy,ax,ay,dx,dy,Math.max(.2,dC+.15));
  const R=cbWpR(s,m,now); if(d>R) return 0; if(s.cb.role==='dealer'&&d<=.18*(R/.45)) return 2; return 1; }

/* ── 피해 계산 (정수) ── */
const cbDmg=(atk,def,crit,buff)=>Math.max(1,Math.round(atk*100/(100+Math.max(0,def))*crit*buff));
function cbBuff(s,now){ const cb=s.cb; let b=1; if(cb.role==='healer'&&cb.solo&&cb.turret&&cb.turret.end>now&&Math.hypot(s.me.x-cb.turret.x,s.me.y-cb.turret.y)<=5) b*=1.2; return b; }
function cbUlt(s,n){ const cb=s.cb; if(cb.ultOn>performance.now()) return; cb.ult=Math.min(100,cb.ult+n); }

/* ── 상태이상 걸기 ── */
function cbElemHit(s,m,dmg,now,api){ const cb=s.cb, E=cb.elem, boss=!!(MOB[m.t]&&MOB[m.t].boss); m.st=m.st||{};
  if(E==='fire'){ const n=Math.min(3,((m.st.burnT>now)?m.st.burnN||1:0)+1); m.st.burnN=n; m.st.burnT=now+3000; }
  else if(E==='ice'){ const ep=s.st&&s.st.epic; if(boss){ m.st.chill=now+3000; cbStag(s,m,ep?30:20,now,api); } else { m.st.slow=now+3000; m.iceN=(m.iceN||0)+1; if(m.iceN>=5){ m.iceN=0; m.st.frz=now+(ep?2000:1500); s.fx.push({k:'cbfrz',x:m.x,y:m.y,at:now}); } } }
  else if(E==='earth'){ if(!boss){ m.st.ddn=now+4000; m.atk=0; m.slamT=0; m.st.stun=Math.max(m.st.stun||0,now+350); } }
  else if(E==='bolt'){ cb.boltN=(cb.boltN||0)+1; const many=(s.st&&s.st.epic&&cb.boltN%4===0)||cb.ocT>now; const near=s.mobs.filter(o=>o!==m&&o.hp>0&&Math.hypot(o.x-m.x,o.y-m.y)<=3).sort((a,b)=>Math.hypot(a.x-m.x,a.y-m.y)-Math.hypot(b.x-m.x,b.y-m.y)).slice(0,many?3:2);
    near.forEach((o,i)=>{ s.fx.push({k:'cbzap',x:m.x,y:m.y,x2:o.x,y2:o.y,at:now+i*60}); setTimeout(()=>{ if(s.mobs.includes(o)) api.hurtMob(o,15,0,{noElem:1,col:'#FFE45A'}); },60+i*60); }); }
}
/* 보스 경직 게이지 */
function cbStag(s,m,n,now,api){ if(!(MOB[m.t]&&(MOB[m.t].boss||MOB[m.t].mini))) return; if(m.stagT>now) return; const k=s.cb.elem==='earth'?1.3:1; m.stag=Math.min(100,(m.stag||0)+n*k);
  if(m.stag>=100){ m.stag=0; m.stagT=now+3000; m.wpOpen=now+6000; m.atk=0; m.slamT=0; m.dashT=0; m.dashing=0; s.fx.push({k:'cbstag',x:m.x,y:m.y,at:now}); api.say(MOB[m.t].n+' 경직! 약점이 열렸어요 — '+(CB_WP[m.t]&&CB_WP[m.t].n||'약점')); wSfx('crit'); s.shake=Math.max(s.shake||0,.7); } }

/* ── 공격 (스마트 공격 스틱) ── dir: 화면이 아닌 월드 방향 [dx,dy] 또는 null(자동 조준) */
function cbPickTarget(s,now){ const me=s.me, pr=s.cb.ctl.aim; const L=s.mobs.filter(m=>m.born<=now&&Math.hypot(m.x-me.x,m.y-me.y)<9); if(!L.length) return null;
  const d=m=>Math.hypot(m.x-me.x,m.y-me.y);
  if(pr==='weak'){ const o=L.filter(m=>CB_WP[m.t]&&CB_WP[m.t].boss&&cbWpOpen(s,m,now)); if(o.length) return o.sort((a,b)=>d(a)-d(b))[0]; }
  if(pr==='low'){ const near=L.filter(m=>d(m)<5); if(near.length) return near.sort((a,b)=>a.hp-b.hp)[0]; }
  return L.sort((a,b)=>d(a)-d(b))[0]; }
/* 한 대 맞히기: 약점 판정 · 피해 · 궁극기 · 경직 · 원소 · 장비 효과 */
function cbAreaCrit(s,m,cx,cy,r,now){ if(!cbWpOpen(s,m,now)) return 0; const [wx,wy]=cbWpPos(m); return Math.hypot(wx-cx,wy-cy)<=r?1:0; }
function cbStrike(s,m,D,ax,ay,mul0,o,api,now){ const cb=s.cb, st=s.st, me=s.me; if(!s.mobs.includes(m)) return 0; o=o||{};
  const cr=o.area?cbAreaCrit(s,m,o.cx,o.cy,o.r,now):cbCritOf(s,m,ax,ay,D[0],D[1],now);
  let mul=cr===2?2:cr===1?(cb.role==='dealer'?1.6:1.5):1; if(cr&&st.crit) mul+=st.crit;
  const E=cb.elem; let buff=cbBuff(s,now)*(mul0||1); if(st.epic&&E==='fire'&&m.st&&m.st.burnT>now) buff*=1.15;
  const dmg=cbDmg(o.atk||st.atk,cbMobDef(m,now)*(st.epic&&E==='earth'?.8:1),mul,buff); api.hurtMob(m,dmg,cr,{});
  cbUlt(s,dmg*.4*(o.ultK||1)+(cr?3:0)); cbStag(s,m,dmg*.25*(st.epic&&E==='earth'?1.3:1),now,api);
  if(cr===2&&cb.role==='dealer'&&cb.solo){ const h=Math.round(st.hp*.05); me.hp=Math.min(st.hp,me.hp+h); s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:'+'+h,col:'#7CF0B5'}); }
  /* 전설 서리 창: 얼어 있거나 둔화된 적을 치면 얼음 폭발 */
  if(st.leg&&st.W.k==='spear'&&m.st&&(m.st.frz>now||m.st.slow>now||m.st.chill>now)&&!(m.iceB>now)){ m.iceB=now+600; s.fx.push({k:'cbice',x:m.x,y:m.y,at:now});
    [...s.mobs].filter(q=>q!==m&&Math.hypot(q.x-m.x,q.y-m.y)<=2).forEach(q=>api.hurtMob(q,cbDmg(55,cbMobDef(q,now),1,1),0,{noElem:1,col:'#9CE4FF'})); }
  if(s.mobs.includes(m)&&!o.noElem) cbElemHit(s,m,dmg,now,api);
  return cr||-1; }
/* 내구도: 공격 1번에 1 · 0이면 무뎌짐 (공격력 -50% · 영웅/전설 효과 정지) */
function cbWear(s,api){ const w=s.st.w; if(!w||w.d<=0) return; w.d--; const M=s.st.durMax;
  if(w.d===Math.floor(M*.2)) api.say('무기 내구도 20% · 숫돌(오른쪽 위)이나 대장간에서 고쳐요');
  if(w.d<=0){ api.say(gName(w)+'이(가) 무뎌졌어요! 공격력 -50%'); cbSyncGear(s); wSfx('block'); } }
function cbWhet(s,api){ const G=s.rpg.gear, w=s.st.w; if(!G||!w) return false; const M=s.st.durMax;
  if(!(G.stone>0)){ api.say('숫돌이 없어요 · 대장간에서 만들 수 있어요 (벽돌 2 + 광석 2)'); return false; }
  if(w.d>=M){ api.say('이미 날이 잘 서 있어요'); return false; }
  G.stone--; w.d=Math.min(M,w.d+Math.round(M*.4)); cbSyncGear(s); api.say('숫돌로 갈았어요 · 내구도 '+Math.round(w.d/M*100)+'%'); wSfx('gem'); haptic([10,20,10]); return true; }
/* 퀵 스왑: 주 무기 ↔ 보조 무기 */
function cbSwap(s,api){ const G=s.rpg.gear, cb=s.cb, now=performance.now(); if(!G||s.me.dead) return false;
  if(!G.eq.w2||!gFind(G,G.eq.w2)){ api.say('보조 무기가 없어요 · 가방에서 "보조 무기로"를 눌러 정해요'); return false; } if(cb.swapT>now) return false;
  const t=G.eq.w; G.eq.w=G.eq.w2; G.eq.w2=t; cbSyncGear(s); cb.swapT=now+700; s.cdA=Math.max(s.cdA,.2); cb.atkN=0;
  api.say(gName(s.st.w)+' · '+GW_HIT[s.st.W.hit]); s.fx.push({k:'cbswap',x:s.me.x,y:s.me.y,at:now,el:cb.elem}); wSfx('shield'); haptic([8,16]); return true; }
/* 앞쪽 일직선 파동 (전설 검기 · 용암 파동) */
function cbWave(s,D,len,wd,dmg,el,api,now,burn){ const me=s.me; s.fx.push({k:'cbwave',x:me.x,y:me.y,dx:D[0],dy:D[1],len,wd,el,at:now}); s.shake=Math.max(s.shake||0,.4*s.cb.ctl.shake);
  [...s.mobs].forEach(m=>{ const dx=m.x-me.x, dy=m.y-me.y; const t=dx*D[0]+dy*D[1]; if(t<0||t>len) return; if(Math.abs(dx*D[1]-dy*D[0])>wd/2+.4) return;
    api.hurtMob(m,cbDmg(dmg,cbMobDef(m,now),1,1),0,{noElem:1,col:GE_EL[el]?GE_EL[el].c:'#fff'}); if(s.mobs.includes(m)){ if(burn){ m.st=m.st||{}; m.st.burnN=Math.min(3,(m.st.burnT>now?m.st.burnN||1:0)+1); m.st.burnT=now+3000; } else cbElemHit(s,m,dmg,now,api); } }); }
/* 화살 */
function cbShoot(s,D,now){ const me=s.me, cb=s.cb; cb.proj.push({x:me.x+D[0]*.5,y:me.y+D[1]*.5,dx:D[0],dy:D[1],v:cb.fast?28:15,left:s.st.rng,fast:cb.fast,el:cb.elem,at:now}); cb.fast=false; }
function cbProjTick(s,dt,now,api){ const cb=s.cb; if(!cb.proj.length) return; const keep=[];
  for(const p of cb.proj){ let go=p.v*dt, hit=null; while(go>0&&!hit&&p.left>0){ const st=Math.min(.25,go); go-=st; p.left-=st; p.x+=p.dx*st; p.y+=p.dy*st;
      if(s.M.blk.has(Math.round(p.x)+','+Math.round(p.y))){ p.left=0; break; }
      for(const m of s.mobs){ if(m.born>now) continue; if(Math.hypot(m.x-p.x,m.y-p.y)<=.42*((MOB[m.t]&&MOB[m.t].sz)||1)){ hit=m; break; } } }
    if(hit){ const r=cbStrike(s,hit,[p.dx,p.dy],p.x-p.dx*1.5,p.y-p.dy*1.5,1,{},api,now); s.fx.push({k:'cbpop',x:p.x,y:p.y,at:now,el:p.el});
      if(p.fast){ s.fx.push({k:'cbring',x:hit.x,y:hit.y,r:1.2,at:now,el:p.el}); [...s.mobs].filter(m=>Math.hypot(m.x-hit.x,m.y-hit.y)<=1.2).forEach(m=>api.hurtMob(m,cbDmg(30,cbMobDef(m,now),1,1),0,{noElem:1,col:GE_EL[p.el]?GE_EL[p.el].c:'#fff'})); }
      if(r>0&&s.st.leg&&s.st.W.k==='bow') cb.fast=true; if(r) haptic(r>0?[8,14]:8); continue; }
    if(p.left>0) keep.push(p); }
  cb.proj=keep; }
/* 화면 쪽 방향으로 가장 가까운 적 */
function cbFindAlong(s,D,R,now){ const me=s.me; let best=null, bd=1e9; for(const m of s.mobs){ if(m.born>now) continue; const dx=m.x-me.x, dy=m.y-me.y, d=Math.hypot(dx,dy); if(d>R+.5||d<.01) continue; if((dx*D[0]+dy*D[1])/d<.9) continue; if(d<bd){ bd=d; best=m; } } return best; }

/* ── 공격 (스마트 공격 스틱) ── 무기 판정: 부채꼴 · 화살 · 착탄 · 관통 · 2연타 · 원형 강타 */
function cbFire(s,dir,api){ const me=s.me, cb=s.cb, st=s.st, W=st.W, now=performance.now(); if(me.dead||s.freeze) return false; if(s.cdA>0){ cb.queue=dir?{dir}:{auto:1}; return false; }
  let precise=!!dir; let D=dir; let tgt=null;
  if(!D){ const t=cbPickTarget(s,now); if(t){ const dx=t.x-me.x, dy=t.y-me.y, d=Math.hypot(dx,dy)||1; const reach=st.rng+((MOB[t.t].sz||1)-1)*.55;
      if(d>reach+.4&&d<9){ me.tgt=t; const p=api.route(me.x,me.y,Math.round(t.x),Math.round(t.y)); if(p&&p.length){ p.pop(); me.path=p; } return false; }
      tgt=t; D=[dx/d,dy/d]; } else D=[-Math.sin(me.ty),Math.cos(me.ty)]; }
  const n0=Math.hypot(D[0],D[1])||1; D=[D[0]/n0,D[1]/n0];
  const oc=cb.ocT>now; s.cdA=1/(st.aspd*(oc?1.25:1)); me.swing=1; me.tgt=null; me.ty=Math.atan2(-D[0],D[1]); wSfx('swing');
  cbWear(s,api);
  const shock=cb.shock; if(shock) cb.shock=false;
  cb.atkN=(cb.atkN||0)+1; const N=cb.atkN; const quake=st.leg&&W.k==='hammer'&&now-(cb.lastAtk||0)>=3000; cb.lastAtk=now;
  let tp=null; if(W.hit==='aoe'){ const t=tgt||cbFindAlong(s,D,st.rng,now); const L=t?Math.min(st.rng,Math.hypot(t.x-me.x,t.y-me.y)):st.rng*.7; tp=[me.x+D[0]*L,me.y+D[1]*L]; s.fx.push({k:'cbbolt',x:me.x,y:me.y,x2:tp[0],y2:tp[1],at:now,el:cb.elem}); }
  if(W.hit==='proj') cbShoot(s,D,now);
  const delay=W.hit==='proj'?20:W.hit==='ring'?170:W.hit==='aoe'?110:W.hit==='twin'?60:110;
  const melee=(t2,ca,reach,hitF)=>{ for(const m of [...s.mobs]){ if(m.born>t2) continue; const dx=m.x-me.x, dy=m.y-me.y, d=Math.hypot(dx,dy); if(d>reach+((MOB[m.t].sz||1)-1)*.55) continue; if(d>.6&&(dx*D[0]+dy*D[1])/d<ca) continue; hitF(m); } };
  setTimeout(()=>{ if(!s.alive) return; const t2=performance.now(); let hit=0, big=0; const H=(m,o)=>{ const r=cbStrike(s,m,D,me.x,me.y,1,o,api,t2); if(r){ hit++; if(r>0) big=Math.max(big,r); } };
    const sz=m=>((MOB[m.t].sz||1)-1)*.55;
    if(W.hit==='arc'||W.hit==='twin'){ const ca=Math.cos(W.arc*Math.PI/360); melee(t2,ca,st.rng,m=>H(m));
      if(W.hit==='twin') setTimeout(()=>{ if(!s.alive) return; const t3=performance.now(); melee(t3,ca,st.rng,m=>cbStrike(s,m,D,me.x,me.y,1,{},api,t3)); s.fx.push({k:'arc',x:me.x,y:me.y,yaw:me.ty+.35,at:t3,prec:precise,w:W.k}); },90); }
    else if(W.hit==='line'){ for(const m of [...s.mobs]){ if(m.born>t2) continue; const dx=m.x-me.x, dy=m.y-me.y; const t=dx*D[0]+dy*D[1]; if(t<-.3||t>st.rng+sz(m)) continue; if(Math.abs(dx*D[1]-dy*D[0])>W.wd/2+.35+sz(m)*.6) continue; H(m); }
      s.fx.push({k:'cbthrust',x:me.x,y:me.y,dx:D[0],dy:D[1],len:st.rng,at:t2,el:cb.elem}); }
    else if(W.hit==='ring'){ const R=W.rad*(quake?2:1); const cx=me.x+D[0]*1.1, cy=me.y+D[1]*1.1;
      for(const m of [...s.mobs]){ if(m.born>t2||Math.hypot(m.x-cx,m.y-cy)>R+sz(m)) continue; H(m,{area:1,cx,cy,r:R}); if(quake&&s.mobs.includes(m)&&!MOB[m.t].boss){ m.st=m.st||{}; m.st.stun=Math.max(m.st.stun||0,t2+1200); } }
      s.fx.push({k:'cbring',x:cx,y:cy,r:R,at:t2,el:cb.elem,big:1}); s.shake=Math.max(s.shake||0,(quake?.9:.45)*cb.ctl.shake); wSfx('slam');
      if(quake) s.fx.push({k:'num',x:me.x,y:me.y,at:t2,t:'대지 분쇄!',col:'#E8C060'}); }
    else if(W.hit==='aoe'){ const [cx,cy]=tp; for(const m of [...s.mobs]){ if(m.born>t2||Math.hypot(m.x-cx,m.y-cy)>W.rad+sz(m)) continue; H(m,{area:1,cx,cy,r:W.rad}); }
      s.fx.push({k:'cbring',x:cx,y:cy,r:W.rad,at:t2,el:cb.elem}); if(st.leg&&N%3===0){ cb.fields.push({x:cx,y:cy,end:t2+3000,el:cb.elem,tk:0}); } }
    if(s.onAtk) s.onAtk({D,el:cb.elem,hit:W.hit,rng:st.rng,tp,rad:(W.rad||0)*(quake?2:1),w:W.k});
    if(st.leg&&W.k==='sword'&&N%4===0) cbWave(s,D,4.5,.9,Math.round(st.atk*1.2),cb.elem,api,t2,false);
    if(st.leg&&W.k==='gsword'&&N%3===0) cbWave(s,D,5,1.2,45,'fire',api,t2,true);
    if(shock){ if(s.onAtk) s.onAtk({D,el:'earth',hit:'ring',rad:3,shock:1,w:W.k}); const k=cb.solo?1.5:1; s.fx.push({k:'cbshock',x:me.x,y:me.y,at:t2}); s.shake=Math.max(s.shake||0,.8*cb.ctl.shake); wSfx('slam');
      for(const m of [...s.mobs]){ if(Math.hypot(m.x-me.x,m.y-me.y)>3) continue; m.st=m.st||{}; m.st.stun=t2+1200; api.hurtMob(m,cbDmg(Math.round(45*k),cbMobDef(m,t2),1,1),0,{col:'#9CD2FF'}); cbStag(s,m,35,t2,api); } }
    const heavy=W.k==='hammer'||W.k==='gsword';
    if(hit&&cb.ctl.hitstop) cb.hold=t2+(big?60:40)*(heavy?1.5:1);
    haptic(hit?(big?[10,20,24]:heavy?20:14):6); if(W.hit==='arc'||W.hit==='twin') s.fx.push({k:'arc',x:me.x,y:me.y,yaw:me.ty,at:t2,prec:precise,w:W.k,wide:W.arc>100}); },delay);
  return true; }

/* ── 보조 버튼: 역할별 ── */
function cbGuard(s,on){ const cb=s.cb; if(cb.role!=='tank'||s.me.dead) return; cb.guard=!!on; if(on){ wSfx('shield'); s.fx.push({k:'shup',x:s.me.x,y:s.me.y,at:performance.now()}); } }
function cbSkill(s,dir,api){ const ok=cbSkill0(s,dir,api); if(ok&&s.st&&s.st.leg&&s.st.W.k==='dagger'){ s.cb.ocT=performance.now()+3000; api.say('과전류 질주! 공속 +25%'); } return ok; }
function cbSkill0(s,dir,api){ const cb=s.cb, me=s.me, now=performance.now(); if(me.dead||s.freeze) return false; if(cb.cdSk>0){ api.say(CB_ROLE[cb.role].sk[0]+' 준비 중 · '+Math.ceil(cb.cdSk)+'초'); return false; }
  if(cb.role==='tank'){ cb.shieldHp=Math.round(70*(cb.solo?1.4:1)); cb.shieldT=now+5000; cb.cdSk=cb.cdMax; s.fx.push({k:'cbbar',x:me.x,y:me.y,at:now}); if(typeof coopEv==='function'&&cb.mode==='crew') coopEv(s,'shield'); wSfx('shield'); haptic([10,20,14]); return true; }
  if(cb.role==='dealer'){ let D=dir; if(!D){ const t=cbPickTarget(s,now); D=t?[t.x-me.x,t.y-me.y]:[-Math.sin(me.ty),Math.cos(me.ty)]; } const n=Math.hypot(D[0],D[1])||1; D=[D[0]/n,D[1]/n];
    let L=0; for(let d=.25;d<=3.5;d+=.25){ if(api.blocked(Math.round(me.x+D[0]*d),Math.round(me.y+D[1]*d))) break; L=d; }
    cb.dash={sx:me.x,sy:me.y,dx:D[0],dy:D[1],L,t0:now,dur:180}; cb.iframe=now+300; me.path=[]; me.tgt=null; me.ty=Math.atan2(-D[0],D[1]); cb.cdSk=cb.cdMax; s.fx.push({k:'cbdash',x:me.x,y:me.y,x2:me.x+D[0]*L,y2:me.y+D[1]*L,at:now}); wSfx('swing'); haptic(12); return true; }
  if(cb.role==='healer'){ const h=55; me.hp=Math.min(s.st.hp,me.hp+h); cb.pst={}; s.fx.push({k:'cbpulse',x:me.x,y:me.y,at:now}); s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:'+'+h,col:'#7CF0B5'}); cbUlt(s,h/10*1.2); cb.cdSk=cb.cdMax; if(typeof coopEv==='function'&&cb.mode==='crew') coopEv(s,'pulse'); wSfx('lvl'); haptic([8,20,10]); return true; }
  return false; }
function cbUltGo(s,api){ const cb=s.cb, me=s.me, now=performance.now(); if(me.dead||s.freeze) return false; if(cb.ult<100){ api.say('궁극기 게이지가 아직 '+Math.floor(cb.ult)+'%예요'); return false; }
  cb.ult=0; s.shake=Math.max(s.shake||0,.6*cb.ctl.shake); haptic([20,40,60]); wSfx('roar');
  if(cb.role==='tank'){ cb.ultOn=now+6000; s.fx.push({k:'cbwall',x:me.x,y:me.y,at:now}); }
  else if(cb.role==='dealer'){ cb.ultOn=now+7000; cb.scan=now; s.fx.push({k:'cbscan',x:me.x,y:me.y,at:now}); }
  else { cb.ultOn=now+12000; cb.turret={x:me.x,y:me.y,hp:180,mhp:180,end:now+12000}; s.fx.push({k:'cbpulse',x:me.x,y:me.y,at:now}); }
  if(cb.mode==='crew') s.pingNow&&s.pingNow(); api.say(CB_ROLE[cb.role].ul[0]+'!'); return true; }

/* ── 내가 맞을 때 (피해 계산 · 보호막 · 막기) ── */
function cbHurtMe(s,raw,src,now){ const cb=s.cb, st=s.st; if(cb.iframe>now) return {d:0,miss:1}; let atk=raw;
  const crit=!!src&&Math.random()<.1; if(crit) atk*=1+.5*(1-(st.critRed||0));
  if(src&&st.set==='ice'&&src.st!==undefined){ src.st=src.st||{}; src.st.slow=Math.max(src.st.slow||0,now+2000); }
  let d=atk*100/(100+s.st.def); let blocked=false;
  if(cb.role==='tank'&&cb.guard){ d*=1-s.st.block; blocked=true; }
  if((cb.role==='tank'&&cb.ultOn>now)||s.coWall) d*=.4;
  d=Math.max(1,Math.round(d));
  if(cb.shieldHp>0&&cb.shieldT>now){ const a=Math.min(cb.shieldHp,d); cb.shieldHp-=a; d-=a; blocked=true; }
  if(cb.role==='tank'&&blocked){ cbUlt(s,6); cb.blockN=(cb.blockN||0)+1; if(cb.blockN>=3){ cb.blockN=0; cb.shock=true; s.fx.push({k:'num',x:s.me.x,y:s.me.y,at:now,t:'반격 준비!',col:'#9CD2FF'}); } }
  /* 지옥 몬스터는 화상을 입혀요 (탱커 궁극기 중엔 면역) */
  if(src&&CB_FIRE_MOB.has(src.t)&&!(cb.role==='tank'&&cb.ultOn>now)&&st.set!=='fire'){ cb.pst=cb.pst||{}; const n0=(cb.pst.burnT>now)?cb.pst.burnN||0:0; cb.pst.burnT=now+(st.hres==='fire'?2100:3000); cb.pst.burnN=Math.min(3,n0+1); }
  return {d,blocked,crit}; }

/* ── 매 프레임 ── */
function cbTick(s,dt,now,api){ const cb=s.cb, me=s.me; if(!cb) return;
  cb.cdSk=Math.max(0,cb.cdSk-dt); if(!me.dead&&cb.ultOn<=now) cbUlt(s,.5*dt);
  if(cb.queue&&s.cdA<=0){ const q=cb.queue; cb.queue=null; cbFire(s,q.dir||null,api); }
  cbProjTick(s,dt,now,api);
  if(cb.fields.length){ cb.fields=cb.fields.filter(f=>f.end>now); for(const f of cb.fields){ f.tk+=dt; if(f.tk>=.5){ f.tk-=.5; for(const m of [...s.mobs]) if(Math.hypot(m.x-f.x,m.y-f.y)<=1.5) api.hurtMob(m,9,0,{noElem:1,col:GE_EL[f.el]?GE_EL[f.el].c:'#fff',sm:1}); } } }
  /* 대쉬 */
  if(cb.dash){ const k=Math.min(1,(now-cb.dash.t0)/cb.dash.dur); const e=1-Math.pow(1-k,3); me.x=cb.dash.sx+cb.dash.dx*cb.dash.L*e; me.y=cb.dash.sy+cb.dash.dy*cb.dash.L*e; if(k>=1) cb.dash=null; }
  /* 힐러: 오라 · 터렛 */
  if(cb.role==='healer'&&!me.dead){ cb.healTick+=dt; if(cb.healTick>=1){ cb.healTick-=1; let h=5; if(cb.turret&&cb.turret.end>now&&Math.hypot(me.x-cb.turret.x,me.y-cb.turret.y)<=5) h+=18; if(me.hp<s.st.hp){ const a=Math.min(h,s.st.hp-me.hp); me.hp+=a; cbUlt(s,a/10*1.2); if(a>=5) s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:'+'+a,col:'#7CF0B5',sm:1}); } } }
  if(cb.turret&&(cb.turret.end<=now||cb.turret.hp<=0)) cb.turret=null;
  /* 내 상태이상 (화상) */
  const P=cb.pst||{}; if(P.burnT>now){ cb.pbt=(cb.pbt||0)+dt; if(cb.pbt>=1){ cb.pbt-=1; const d=8*(P.burnN||1); me.hp=Math.max(1,me.hp-d); s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:'-'+d,col:'#FF9A4A',sm:1}); } }
  /* 몬스터 상태이상: 화상 틱 */
  for(const m of s.mobs){ const S=m.st; if(!S) continue; if(S.burnT>now){ m.bt=(m.bt||0)+dt; if(m.bt>=1){ m.bt-=1; api.hurtMob(m,8*(S.burnN||1),0,{noElem:1,col:'#FF9A4A',sm:1}); } } }
  if(typeof coopTick==='function') coopTick(s,dt,now,api);
}
/* 몬스터 패턴 빈틈: 내려찍기 · 돌진이 끝나면 보스 약점이 잠깐 열려요 */
function cbAfterSlam(m,now){ if(CB_WP[m.t]&&CB_WP[m.t].boss) m.wpOpen=Math.max(m.wpOpen||0,now+2500); }
function cbAfterDash(m,now){ if(CB_WP[m.t]&&CB_WP[m.t].boss) m.wpOpen=Math.max(m.wpOpen||0,now+2000); }

/* ── 그리기: 땅 위 (조준 가이드 · 오라 · 터렛 · 스캔) ── */
function cbDrawGround(g,s,scr,u,HW,HH,now,tm){ const cb=s.cb; if(!cb) return; const me=s.me; const [px,py]=scr(me.x,me.y);
  if(cb.role==='healer'&&!me.dead){ g.save(); g.setLineDash([4,6]); g.strokeStyle='rgba(124,240,181,.55)'; g.lineWidth=1.6; g.beginPath(); cbEl(g,px,py,HW*4.5,HH*4.5,0,0,Math.PI*2); g.stroke(); g.restore(); }
  if(cb.turret){ const T=cb.turret; const [tx,ty]=scr(T.x,T.y); const k=.5+.5*Math.sin(tm*3); g.fillStyle='rgba(124,240,181,'+(.08+k*.05)+')'; g.beginPath(); cbEl(g,tx,ty,HW*5,HH*5,0,0,Math.PI*2); g.fill(); g.strokeStyle='rgba(124,240,181,.5)'; g.lineWidth=2; g.stroke(); }
  if(cb.role==='tank'&&cb.ultOn>now){ const k=(cb.ultOn-now)/6000; g.strokeStyle='rgba(124,194,255,'+(.35+.3*k)+')'; g.lineWidth=3; g.beginPath(); cbEl(g,px,py,HW*4,HH*4,0,0,Math.PI*2); g.stroke(); }
  if(cb.role==='dealer'&&cb.ultOn>now){ const k=((now-cb.scan)/900)%1; g.strokeStyle='rgba(255,70,70,'+(.6*(1-k))+')'; g.lineWidth=3; g.beginPath(); cbEl(g,px,py,HW*12*k,HH*12*k,0,0,Math.PI*2); g.stroke(); }
  /* 조준 가이드: 공격 스틱을 끌면 바닥에 사거리 부채꼴 */
  const A=cb.aim; if(A&&A.on){ const W=s.st.W||GW.sword; const R=s.st.rng||2; const ang=Math.atan2(A.d[1],A.d[0]); const dx=A.d[0], dy=A.d[1];
    g.fillStyle=A.cancel?'rgba(160,160,170,.18)':'rgba(255,255,255,.22)'; g.strokeStyle=A.cancel?'rgba(160,160,170,.6)':'rgba(255,255,255,.9)'; g.lineWidth=2; g.beginPath();
    const poly=P2=>{ P2.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y)); g.closePath(); g.fill(); g.stroke(); };
    const circ=(cx,cy,r)=>{ const [qx,qy]=scr(cx,cy); cbEl(g,qx,qy,HW*r,HH*r); g.fill(); g.stroke(); };
    if(W.hit==='arc'||W.hit==='twin'){ const arc=W.arc*Math.PI/180; const pts=[[px,py]]; for(let i=0;i<=16;i++){ const a=ang-arc/2+arc*i/16; pts.push(scr(me.x+Math.cos(a)*R,me.y+Math.sin(a)*R)); } poly(pts); }
    else if(W.hit==='line'||W.hit==='proj'){ const w=(W.hit==='line'?W.wd:.35)/2; const nx=-dy*w, ny=dx*w; poly([scr(me.x+nx,me.y+ny),scr(me.x+dx*R+nx,me.y+dy*R+ny),scr(me.x+dx*R-nx,me.y+dy*R-ny),scr(me.x-nx,me.y-ny)]); }
    else if(W.hit==='ring'){ circ(me.x+dx*1.1,me.y+dy*1.1,W.rad); }
    else if(W.hit==='aoe'){ circ(me.x+dx*R*.85,me.y+dy*R*.85,W.rad); }
    const [ex,ey]=scr(me.x+dx*R,me.y+dy*R); g.setLineDash([5,5]); g.beginPath(); g.moveTo(px,py); g.lineTo(ex,ey); g.stroke(); g.setLineDash([]); }
  /* 지팡이 장판 · 화살 */
  for(const f of cb.fields||[]){ const [qx,qy]=scr(f.x,f.y); const c=GE_EL[f.el]?GE_EL[f.el].c:'#fff'; const k=.5+.5*Math.sin(tm*8); g.globalAlpha=.22+k*.12; g.fillStyle=c; g.beginPath(); cbEl(g,qx,qy,HW*1.5,HH*1.5); g.fill(); g.globalAlpha=.8; g.strokeStyle=c; g.lineWidth=2; g.stroke(); g.globalAlpha=1; }
  if(A&&A.dash){ const [ex,ey]=scr(me.x+A.d[0]*3.5,me.y+A.d[1]*3.5); g.strokeStyle='rgba(255,138,138,.85)'; g.lineWidth=HH*.9; g.lineCap='round'; g.globalAlpha=.6; g.beginPath(); g.moveTo(px,py); g.lineTo(ex,ey); g.stroke(); g.globalAlpha=1; g.lineCap='butt'; } }
/* ── 그리기: 몬스터 위 (약점 · 상태이상 · 경직) ── */
function cbDrawMob(g,s,m,px,py,u,HW,HH,now,tm){ const cb=s.cb; if(!cb) return; const B=MOB[m.t]; const sz=B.sz||1; const W=CB_WP[m.t];
  const dme=Math.hypot(m.x-s.me.x,m.y-s.me.y); const open=cbWpOpen(s,m,now);
  if(open&&(dme<7||(W&&W.boss))){ const [wx,wy]=cbWpPos(m); const [qx,qy0]=s.scr(wx,wy); const qy=qy0-u*(W&&W.f===0?9*sz:4.5*sz); const R=cbWpR(s,m,now); const k=.5+.5*Math.sin(tm*6);
    const boss=W&&W.boss; g.strokeStyle=boss?'rgba(255,80,60,'+(.7+.3*k)+')':'rgba(255,214,90,'+(dme<3.5?.85:.4)+')'; g.lineWidth=boss?2.6:1.6; g.beginPath(); cbEl(g,qx,qy,HW*R*1.1,HH*R*1.1,0,0,Math.PI*2); g.stroke();
    if(cb.role==='dealer'){ g.fillStyle=boss?'#FF5040':'#FFD54A'; g.beginPath(); g.arc(qx,qy,Math.max(2,HH*.36),0,Math.PI*2); g.fill(); } }
  /* 상태이상 아이콘 */
  const S=m.st||{}; const ic=[]; if(S.burnT>now) ic.push(['#FF7A2A','🔥'+(S.burnN>1?S.burnN:'')]); if(S.frz>now) ic.push(['#9CE4FF','❄']); else if(S.slow>now||S.chill>now) ic.push(['#9CE4FF','≋']); if(S.ddn>now) ic.push(['#E8C060','▼']); if(S.stun>now||m.stagT>now) ic.push(['#FFE45A','✦']);
  if(ic.length){ g.font='900 '+Math.max(10,u*2.4)+'px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; ic.forEach(([c2,t],i)=>{ const x=px+(i-(ic.length-1)/2)*u*4, y=py-u*(13*sz+3); g.lineWidth=3; g.strokeStyle='rgba(0,0,0,.6)'; g.strokeText(t,x,y); g.fillStyle=c2; g.fillText(t,x,y); }); }
  if(m.glitch){ for(let i=0;i<5;i++){ const a=wHash(i,Math.floor(tm*8),m.id||1); g.fillStyle=i%2?'rgba(190,90,255,.55)':'rgba(90,240,255,.45)'; g.fillRect(px+(a-.5)*u*10*sz,py-u*(2+wHash(i,3,Math.floor(tm*8))*10*sz),u*2.2,u*.8); } }
  if(S.frz>now){ g.fillStyle='rgba(170,230,255,.35)'; g.beginPath(); cbEl(g,px,py-u*4*sz,HW*.7*sz,HH*1.6*sz,0,0,Math.PI*2); g.fill(); }
  /* 보스 경직 게이지 */
  if((B.boss||B.mini)&&m.stag>0&&!(m.stagT>now)){ const w=u*10*sz, h=Math.max(3,u*.8); const x=px-w/2, y=py+u*2; g.fillStyle='rgba(0,0,0,.45)'; g.fillRect(x,y,w,h); g.fillStyle='#FFE45A'; g.fillRect(x,y,w*m.stag/100,h); }
  if(m.stagT>now){ g.strokeStyle='rgba(255,228,90,'+(.5+.5*Math.sin(tm*14))+')'; g.lineWidth=2; for(let i=0;i<3;i++){ const a=tm*4+i*2.1; g.beginPath(); g.arc(px+Math.cos(a)*u*4*sz,py-u*12*sz+Math.sin(a)*u*1.2,u*.9,0,Math.PI*2); g.stroke(); } } }
/* ── 그리기: 내 캐릭터 위 (보호막 · 방벽 · 터렛) ── */
function cbDrawMe(g,s,px,py,u,HW,HH,now,tm){ const cb=s.cb; if(!cb) return; const me=s.me;
  if(cb.shieldHp>0&&cb.shieldT>now){ const k=.6+.4*Math.sin(tm*5); g.strokeStyle='rgba(124,194,255,'+k+')'; g.fillStyle='rgba(124,194,255,.12)'; g.lineWidth=2.4; g.beginPath(); cbEl(g,px,py-u*7,u*8,u*10,0,0,Math.PI*2); g.fill(); g.stroke(); }
  if(cb.guard){ wHexShield(g,px,py-u*7.5,u,tm,1,'s'); }
  if(cb.turret){ const T=cb.turret; const [tx,ty]=s.scr(T.x,T.y); const b=Math.sin(tm*3)*u; wCube(g,tx,ty,u,-1.6,-1.6,0,3.2,3.2,3,'#E8FFF2',{t:'#FFFFFF'}); g.fillStyle='#3DDC97'; g.beginPath(); g.arc(tx,ty-u*9+b,u*2.4,0,Math.PI*2); g.fill(); g.fillStyle='#fff'; g.fillRect(tx-u*.6,ty-u*10.6+b,u*1.2,u*3.2); g.fillRect(tx-u*1.6,ty-u*9.6+b,u*3.2,u*1.2);
    const w=u*9, k=(T.end-now)/12000; g.fillStyle='rgba(0,0,0,.4)'; g.fillRect(tx-w/2,ty-u*14,w,u*.9); g.fillStyle='#3DDC97'; g.fillRect(tx-w/2,ty-u*14,w*k,u*.9); } }
/* ── 그리기: 효과 ── */
function cbDrawFx(g,f,px,py,k,u,HW,HH,s){ if(f.k==='cbshock'){ g.strokeStyle='rgba(156,210,255,'+(1-k)+')'; g.lineWidth=6*(1-k)+1; g.beginPath(); cbEl(g,px,py,HW*3*(.3+k),HH*3*(.3+k),0,0,Math.PI*2); g.stroke(); return true; }
  if(f.k==='cbbar'||f.k==='cbwall'){ g.strokeStyle=(f.k==='cbwall'?'rgba(124,194,255,':'rgba(160,220,255,')+(1-k)+')'; g.lineWidth=3; g.beginPath(); cbEl(g,px,py,HW*(f.k==='cbwall'?4:4.5)*k,HH*(f.k==='cbwall'?4:4.5)*k,0,0,Math.PI*2); g.stroke(); return true; }
  if(f.k==='cbpulse'){ g.fillStyle='rgba(124,240,181,'+(.35*(1-k))+')'; g.beginPath(); cbEl(g,px,py,HW*5*k,HH*5*k,0,0,Math.PI*2); g.fill(); g.strokeStyle='rgba(124,240,181,'+(1-k)+')'; g.lineWidth=3; g.stroke(); return true; }
  if(f.k==='cbscan'){ return true; }
  const EC=f.el&&GE_EL[f.el]?GE_EL[f.el].c:'#FFFFFF';
  if(f.k==='cbring'){ if(k>.5) return true; const kk=k/.5; g.strokeStyle=EC; g.globalAlpha=1-kk; g.lineWidth=(f.big?5:3)*(1-kk)+1; g.beginPath(); cbEl(g,px,py,HW*f.r*(.6+.4*kk),HH*f.r*(.6+.4*kk)); g.stroke(); g.globalAlpha=(1-kk)*.25; g.fillStyle=EC; g.fill(); g.globalAlpha=1;
    if(f.big){ for(let i=0;i<8;i++){ const a=i/8*6.28; const r=f.r*(.5+kk*.6); g.fillStyle=i%2?'#8A5A12':EC; g.globalAlpha=1-kk; g.fillRect(px+Math.cos(a)*HW*r-u,py+Math.sin(a)*HH*r-u-u*4*kk*(1-kk)*4,u*2,u*2); } g.globalAlpha=1; } return true; }
  if(f.k==='cbwave'){ if(k>.55) return true; const kk=k/.55; const L=f.len*kk; const [ax,ay]=s.scr(f.x+f.dx*Math.max(0,L-1.6),f.y+f.dy*Math.max(0,L-1.6)); const [bx,by]=s.scr(f.x+f.dx*L,f.y+f.dy*L);
    g.save(); g.lineCap='round'; g.globalAlpha=1-kk*.6; g.strokeStyle=EC; g.lineWidth=HH*f.wd*1.6; g.beginPath(); g.moveTo(ax,ay-u*3); g.lineTo(bx,by-u*3); g.stroke(); g.strokeStyle='#fff'; g.lineWidth=HH*f.wd*.5; g.stroke(); g.restore(); return true; }
  if(f.k==='cbthrust'){ if(k>.25) return true; const kk=k/.25; const [bx,by]=s.scr(f.x+f.dx*f.len,f.y+f.dy*f.len); g.save(); g.lineCap='round'; g.globalAlpha=1-kk; g.strokeStyle=EC; g.lineWidth=u*2.2; g.beginPath(); g.moveTo(px,py-u*5); g.lineTo(px+(bx-px)*(.4+.6*kk),py-u*5+(by-py)*(.4+.6*kk)); g.stroke(); g.strokeStyle='#fff'; g.lineWidth=u*.8; g.stroke(); g.restore(); return true; }
  if(f.k==='cbbolt'){ if(k>.15) return true; const [bx,by]=s.scr(f.x2,f.y2); g.save(); g.globalAlpha=1-k/.15; g.strokeStyle=EC; g.lineWidth=u*1.6; g.beginPath(); g.moveTo(px,py-u*8); g.quadraticCurveTo((px+bx)/2,Math.min(py,by)-u*16,bx,by); g.stroke(); g.restore(); return true; }
  if(f.k==='cbpop'){ if(k>.3) return true; const kk=k/.3; g.fillStyle=EC; g.globalAlpha=1-kk; for(let i=0;i<6;i++){ const a=i/6*6.28; g.fillRect(px+Math.cos(a)*u*4*kk-u*.6,py-u*4+Math.sin(a)*u*3*kk-u*.6,u*1.2,u*1.2); } g.globalAlpha=1; return true; }
  if(f.k==='cbice'){ if(k>.5) return true; const kk=k/.5; g.strokeStyle='rgba(200,240,255,'+(1-kk)+')'; g.lineWidth=3; for(let i=0;i<8;i++){ const a=i/8*6.28; g.beginPath(); g.moveTo(px,py-u*4); g.lineTo(px+Math.cos(a)*HW*2*kk,py-u*4+Math.sin(a)*HH*2*kk); g.stroke(); } return true; }
  if(f.k==='cbswap'){ if(k>.4) return true; const kk=k/.4; g.strokeStyle=EC; g.globalAlpha=1-kk; g.lineWidth=3; g.beginPath(); g.arc(px,py-u*7,u*(5+kk*6),-1.2+kk*3,1.6+kk*3); g.stroke(); g.globalAlpha=1; return true; }
  if(f.k==='cbdash'){ if(k>.5) return true; const [bx,by]=s.scr(f.x2,f.y2); g.strokeStyle='rgba(255,170,170,'+(1-k*2)*.8+')'; g.lineWidth=HH*1.1*(1-k*2); g.lineCap='round'; g.beginPath(); g.moveTo(px,py-u*5); g.lineTo(bx,by-u*5); g.stroke(); g.lineCap='butt'; return true; }
  if(f.k==='cbzap'){ if(k<0||k>.4) return true; const [bx,by]=s.scr(f.x2,f.y2); g.strokeStyle='rgba(255,236,120,'+(1-k/.4)+')'; g.lineWidth=2.2; g.beginPath(); g.moveTo(px,py-u*5); const n=5; for(let i=1;i<=n;i++){ const t=i/n; g.lineTo(px+(bx-px)*t+(i<n?(Math.random()-.5)*u*4:0),py-u*5+(by-py)*t+(i<n?(Math.random()-.5)*u*4:0)); } g.stroke(); return true; }
  if(f.k==='cbfrz'){ g.strokeStyle='rgba(200,240,255,'+(1-k)+')'; g.lineWidth=2; for(let i=0;i<6;i++){ const a=i/6*6.28; g.beginPath(); g.moveTo(px,py-u*5); g.lineTo(px+Math.cos(a)*u*7*k,py-u*5+Math.sin(a)*u*5*k); g.stroke(); } return true; }
  if(f.k==='cbstag'){ g.fillStyle='rgba(255,228,90,'+(1-k)+')'; g.font='900 '+Math.max(14,u*4)+'px "Koverwatch","NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.fillText('BREAK!',px,py-u*(20+k*6)); return true; }
  return false; }

/* ═════════ PART 2 세계관 바이블 (도감 · 로딩 팁 · 석판) ═════════ */
const CB_LORE={
  terms:[['대균열','Severance','"대균열이 난 날, 대륙은 침묵했다."'],['테세라','Tessera','"테세라로 빚어진 디코아 대륙"'],['이음','Bond · Tether','"다섯 번째 원소, 『이음』의 잔향"'],['여백','Null','"연결을 잃은 땅을 지우는 여백"']],
  myth:[['테세라의 세계','태초의 단일 대륙 디코아(DKOA)의 산과 바다, 생명과 기억은 모두 ‘테세라’라 불리는 정교한 결정들이 빈틈없이 맞물려 이루어진 거대한 건축물이었다.'],
    ['네 개의 모순과 『이음』','디코아는 서로를 밀어내는 네 근원 법칙(흙 · 불 · 얼음 · 번개)으로 지탱되었다. 불은 얼음을 녹이고 번개는 흙을 쪼개는 이 모순된 세계가 무너지지 않은 건, 네 원소 사이의 틈을 채우며 모든 테세라를 붙들어 주던 보이지 않는 제5원소 『이음』 덕분이었다.'],
    ['대균열이 난 날','고대인들은 영원의 낙원을 세우겠다며 대륙 중앙 첨탑에 『이음』을 가두려 했다. 자유롭게 이어져야 할 『이음』은 감옥을 거부하며 산산조각 났고, 세계의 모든 연결이 끊어지는 《대균열》이 일어났다. 가장자리 땅은 수천 개의 섬으로 흩어졌고, 본토의 네 수호자는 자기 원소 하나로 세계를 붙잡으려다 끝내 폭주했다.'],
    ['여백과 다리','『이음』이 사라진 자리에 남은 것은 연결을 잃은 테세라를 백지로 지우는 ‘여백’이었다. 작은 섬들이 살아남은 단 하나의 이유는, 사람들이 소셜 아일랜드에 모여 각자의 섬을 다리로 묶고 다시 ‘이음’을 만들어 냈기 때문이다.']],
  guard:[['earth','거암 협곡','모놀리스 렉스','"…이제 조금은, 가벼워져도 되는가."','첫째의 흙은 무게로 땅을 붙들었으나, 이음 없는 무게는 스스로를 무너뜨렸다.'],
    ['fire','화산 지대','볼카누스','"식은 재 위에도… 다시 불을 붙일 손이 남아 있었군."','둘째의 불은 식어가는 세상을 구하려 했으나, 이음 없는 열기는 모든 형태를 녹였다.'],
    ['ice','서리 설원','크라이오스','"녹아내려도 괜찮은가… 기억은 얼리지 않아도 남는가."','셋째의 얼음은 웃음소리를 영원히 가두려 했으나, 이음 없는 보존은 숨결마저 멈추었다.'],
    ['bolt','폭풍 유적','볼트론 오메가','"신호 수신… 드디어, 누군가 다리를 건너왔군."','넷째의 번개는 흩어진 조각을 불렀으나, 다섯 번째 빛이 갈라진 날 응답은 끊어졌다.']],
  /* 테마 섬 기원 */
  isles:[['슬라임 섬','미완성 생점토와 젤 파편이 뭉쳐 떠오른 섬'],['동화 숲','아이들의 옛이야기를 품은 기억 결정과 흙의 숲'],['헬바운드','화산 태초 대장간 용광로 밑바닥의 파편'],['빙하 섬','얼음 도서관 외벽에서 떨어져 나온 파편 (곧 열려요)']]
};
/* 던전마다 놓인 깨진 석판 (가까이 가면 읽혀요) */
const CB_TABLET={story:{i:0,x:31,y:-3},hell:{i:1,x:-6,y:-5},slime:{i:-1,x:6,y:-4}};
const CB_TABLET0='대균열이 난 날, 네 원소는 서로를 잃었고 대륙은 섬이 되었다.';
function cbEl(g,x,y,a,b,r,s,e){ g.ellipse(x,y,Math.max(.01,+a||0),Math.max(.01,+b||0),r||0,s||0,e==null?Math.PI*2:e); }
/* 화살 그리기 (몬스터 위로) */
function cbDrawProj(g,s,u){ const cb=s.cb; if(!cb||!cb.proj||!cb.proj.length) return; for(const p of cb.proj){ const [ax,ay]=s.scr(p.x,p.y); const [bx,by]=s.scr(p.x-p.dx*.9,p.y-p.dy*.9); const c=GE_EL[p.el]?GE_EL[p.el].c:'#fff';
  g.save(); g.lineCap='round'; g.strokeStyle=c; g.globalAlpha=.45; g.lineWidth=u*2.4; g.beginPath(); g.moveTo(ax,ay-u*5); g.lineTo(bx,by-u*5); g.stroke(); g.globalAlpha=1; g.strokeStyle='#5A3A20'; g.lineWidth=u*.7; g.stroke(); g.fillStyle=p.fast?'#fff':c; g.beginPath(); g.arc(ax,ay-u*5,u*1.1,0,6.28); g.fill(); g.restore(); } }

/* ═════════ v27.8 전투 조작 UI (기획서 3-1 · 7-2) ═════════
   왼쪽: 아무 데나 누르면 생기는 유동형 이동 스틱 · 오른쪽: 탭(자동 조준) / 끌기(정밀 조준) 공격 스틱
   보조 버튼: 탱커(누르고 있기 = 방패 · 탭 = 강화 보호막) · 딜러(탭/끌기 = 대쉬) · 힐러(탭 = 치유의 파동)
   PC: WASD 이동 · 마우스 조준 + 클릭 공격 · Space 보조 · Shift 방패 · Q 궁극기  (키보드를 쓰면 터치 UI가 작아져요) */
function CombatPad({S,role,onEdit,hidden}){
  const [ctl,setCtl]=useState(cbCtl()); const root=useRef(null); const [wk,setWk]=useState(['sword','']); const wkR=useRef(''); const [fo,setFo]=useState(false); const [whl,setWhl]=useState(null); const whR=useRef(null); const [fdN,setFdN]=useState(0);
  useEffect(()=>{ const f=()=>setCtl(cbCtl()); window.addEventListener('dko-cbctl',f); return ()=>window.removeEventListener('dko-cbctl',f); },[]);
  const R=ctl; const sz=k=>((R.sz&&R.sz[k])||1)*R.size;
  /* 쿨다운 · 궁극기 게이지는 리액트 다시 그리기 없이 매 프레임 직접 바꿔요 */
  useEffect(()=>{ let raf=0; const loop=()=>{ const s=S.current, el=root.current; if(s&&s.cb&&el){ const cb=s.cb, now=performance.now();
      el.style.setProperty('--cA',(s.cdA*((s.st&&s.st.aspd)||1.6)*((s.cb&&s.cb.ocT>performance.now())?1.25:1)).toFixed(3)); el.style.setProperty('--cS',(cb.cdSk/cb.cdMax).toFixed(3)); el.style.setProperty('--uP',(cb.ultOn>now?1:cb.ult/100).toFixed(3));
      const st=s.st||{}; const w=st.w; const dr=w&&st.durMax?w.d/st.durMax:1; el.classList.toggle('dw-low',dr<=.2&&dr>0); el.classList.toggle('dw-0',dr<=0); el.classList.toggle('oc',cb.ocT>now); el.classList.toggle('air',!!(s.me&&s.me.air));
      const fn=(s.rpg&&s.rpg.food||[]).reduce((a,f)=>a+f.cnt,0); if(fn!==el._fn){ el._fn=fn; setFdN(fn); }
      const G=s.rpg&&s.rpg.gear; const w2=G&&G.eq.w2?gFind(G,G.eq.w2):null; const nW=G?G.it.filter(x=>gIsW(x.k)).length:0; const key=(w?w.k:'sword')+'|'+(w2?w2.k:'')+'|'+(G?G.stone||0:0)+'|'+(dr<=.2?1:0)+'|'+nW; if(key!==wkR.current){ wkR.current=key; setWk([w?w.k:'sword',w2?w2.k:'',G?G.stone||0:0,dr<=.2,nW]); }
      el.classList.toggle('u-ready',cb.ult>=100&&cb.ultOn<=now); el.classList.toggle('u-on',cb.ultOn>now); el.classList.toggle('g-on',!!cb.guard); el.classList.toggle('sh-ready',!!cb.shock);
      const t=el.querySelector('.cbp-sct'); if(t){ const v=cb.cdSk>0?String(Math.ceil(cb.cdSk)):''; if(t.textContent!==v) t.textContent=v; }
      const u=el.querySelector('.cbp-ut'); if(u){ const v=cb.ultOn>now?Math.ceil((cb.ultOn-now)/1000)+'s':cb.ult>=100?'':Math.floor(cb.ult)+'%'; if(u.textContent!==v) u.textContent=v; } }
    raf=requestAnimationFrame(loop); }; raf=requestAnimationFrame(loop); return ()=>cancelAnimationFrame(raf); },[]);
  /* ── 이동 스틱 ── */
  const mv=useRef(null);
  const mvDown=e=>{ if(e.pointerType==='mouse') return; e.preventDefault(); const z=e.currentTarget; try{ z.setPointerCapture(e.pointerId); }catch(er){} const b=z.querySelector('.cbp-mb'), k=z.querySelector('.cbp-mk'); const zr=z.getBoundingClientRect();
    let cx,cy; if(R.stick==='fixed'){ const br=b.getBoundingClientRect(); cx=br.left+br.width/2; cy=br.top+br.height/2; } else { cx=e.clientX; cy=e.clientY; b.style.left=(cx-zr.left)+'px'; b.style.top=(cy-zr.top)+'px'; b.style.bottom='auto'; b.classList.add('ft'); }
    mv.current={id:e.pointerId,cx,cy,b,k,R:52*sz('mv')}; z.classList.add('on'); mvMove(e); };
  const mvMove=e=>{ const M=mv.current; if(!M||M.id!==e.pointerId) return; e.preventDefault(); let dx=e.clientX-M.cx, dy=e.clientY-M.cy; const d=Math.hypot(dx,dy); if(d>M.R){ dx=dx/d*M.R; dy=dy/d*M.R; } M.k.style.transform='translate('+dx+'px,'+dy+'px)';
    const f=Math.min(1,d/M.R); const s=S.current; if(!s) return; if(f<R.dz){ s.joy=[0,0]; return; } const g=(f-R.dz)/(1-R.dz); s.joy=[dx/(d||1)*g,dy/(d||1)*g]; };
  const mvUp=e=>{ const M=mv.current; if(!M||M.id!==e.pointerId) return; mv.current=null; M.k.style.transform=''; const z=e.currentTarget; z.classList.remove('on'); if(R.stick!=='fixed'){ M.b.style.left=''; M.b.style.top=''; M.b.style.bottom=''; M.b.classList.remove('ft'); } const s=S.current; if(s) s.joy=[0,0]; };
  /* ── 공격 스틱 ── */
  const at=useRef(null);
  const atDown=e=>{ e.preventDefault(); e.stopPropagation(); const el=e.currentTarget; try{ el.setPointerCapture(e.pointerId); }catch(er){} const r=el.getBoundingClientRect(); at.current={id:e.pointerId,cx:r.left+r.width/2,cy:r.top+r.height/2,t0:performance.now(),aimed:false,R:r.width/2,k:el.querySelector('.cbp-ak'),el}; el.classList.add('on'); haptic(4); };
  const atMove=e=>{ const A=at.current; if(!A||A.id!==e.pointerId) return; e.preventDefault(); let dx=e.clientX-A.cx, dy=e.clientY-A.cy; const d=Math.hypot(dx,dy); const L=Math.min(d,A.R*.9); A.k.style.transform='translate('+(dx/(d||1)*L)+'px,'+(dy/(d||1)*L)+'px)';
    const f=d/A.R; const s=S.current; if(!s||!s.cb) return; if(f>=.15){ A.aimed=true; A.cancel=false; s.cb.aim={on:true,d:s.dirFromScreen(dx,dy),cancel:false}; A.el.classList.remove('cx'); } else if(A.aimed){ A.cancel=true; if(s.cb.aim) s.cb.aim.cancel=true; A.el.classList.add('cx'); } };
  const atUp=e=>{ const A=at.current; if(!A||A.id!==e.pointerId) return; at.current=null; A.k.style.transform=''; A.el.classList.remove('on','cx'); const s=S.current; if(!s||!s.cb) return; const aim=s.cb.aim; s.cb.aim=null;
    if(A.aimed){ if(!A.cancel&&aim) s.cbFire(aim.d); } else s.cbFire(null); };
  /* ── 보조 버튼 ── */
  const sc=useRef(null);
  const scDown=e=>{ e.preventDefault(); e.stopPropagation(); const el=e.currentTarget; try{ el.setPointerCapture(e.pointerId); }catch(er){} const r=el.getBoundingClientRect(); const s=S.current; sc.current={id:e.pointerId,cx:r.left+r.width/2,cy:r.top+r.height/2,R:r.width/2,t0:performance.now(),held:false,dir:null,el};
    el.classList.add('on'); if(role==='tank'){ sc.current.tm=setTimeout(()=>{ const C=sc.current; if(C&&C.id===e.pointerId){ C.held=true; s&&s.cbGuard(true); haptic(10); } },200); } };
  const scMove=e=>{ const C=sc.current; if(!C||C.id!==e.pointerId||role!=='dealer') return; const dx=e.clientX-C.cx, dy=e.clientY-C.cy; const s=S.current; if(!s||!s.cb) return; if(Math.hypot(dx,dy)>C.R*.3){ C.dir=s.dirFromScreen(dx,dy); s.cb.aim={dash:true,d:C.dir}; } };
  const scUp=e=>{ const C=sc.current; if(!C||C.id!==e.pointerId) return; sc.current=null; clearTimeout(C.tm); C.el.classList.remove('on'); const s=S.current; if(!s) return;
    if(role==='tank'){ if(C.held) s.cbGuard(false); else s.cbSkill(null); } else { if(s.cb) s.cb.aim=null; s.cbSkill(C.dir); } };
  /* ── PC: 키보드 · 마우스 ── */
  useEffect(()=>{ const H=document.documentElement; let spDown=0, spHeld=false, spT=0;
    const pc=()=>H.classList.add('cb-pc'); const touch=()=>H.classList.remove('cb-pc');
    const typing=t=>t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable);
    const kd=e=>{ if(typing(e.target)||e.repeat) return; const s=S.current; if(!s||!s.cb||hiddenR.current) return; const c2=e.code;
      if(['KeyW','KeyA','KeyS','KeyD','KeyJ','KeyK','KeyQ','Space','ShiftLeft','KeyR'].includes(c2)) pc();
      if(c2==='KeyR'){ e.preventDefault(); s.cbSwap(); return; } if(c2==='KeyE'){ setFo(v=>!v); return; } if(c2==='KeyF'){ s.cbWhet(); return; }
      if(c2==='KeyJ'){ e.preventDefault(); s.cbFire(s.cursor?s.dirToPoint(s.cursor[0],s.cursor[1]):null); }
      else if(c2==='KeyQ'){ e.preventDefault(); s.cbUlt(); }
      else if(c2==='ShiftLeft'||c2==='ShiftRight'){ if(role==='tank') s.cbGuard(true); }
      else if(c2==='Space'||c2==='KeyK'){ e.preventDefault(); if(role==='tank'&&c2==='Space'){ spDown=performance.now(); spHeld=false; spT=setTimeout(()=>{ spHeld=true; s.cbGuard(true); },200); } else s.cbSkill(role==='dealer'&&s.cursor?s.dirToPoint(s.cursor[0],s.cursor[1]):null); } };
    const ku=e=>{ const s=S.current; if(!s||!s.cb) return; const c2=e.code; if((c2==='ShiftLeft'||c2==='ShiftRight')&&role==='tank') s.cbGuard(false);
      if(c2==='Space'&&role==='tank'&&spDown){ clearTimeout(spT); spDown=0; if(spHeld) s.cbGuard(false); else s.cbSkill(null); } };
    const pm=e=>{ const s=S.current; if(!s) return; if(e.pointerType==='mouse'){ s.cursor=[e.clientX,e.clientY]; if(Math.abs(e.movementX)+Math.abs(e.movementY)>2) pc(); } else if(e.pointerType==='touch') touch(); };
    const ctx=e=>{ if(e.target&&e.target.closest&&e.target.closest('.dg26')){ e.preventDefault(); const s=S.current; if(s&&s.cb){ pc(); if(role==='tank'){ s.cbSkill(null); } else s.cbSkill(role==='dealer'?s.dirToPoint(e.clientX,e.clientY):null); } } };
    window.addEventListener('keydown',kd); window.addEventListener('keyup',ku); window.addEventListener('pointermove',pm,{passive:true}); window.addEventListener('contextmenu',ctx);
    return ()=>{ window.removeEventListener('keydown',kd); window.removeEventListener('keyup',ku); window.removeEventListener('pointermove',pm); window.removeEventListener('contextmenu',ctx); }; },[role]);
  const hiddenR=useRef(hidden); hiddenR.current=hidden;
  const P=R.pos; const st=(k,side)=>{ const p=P[k]; return {[side||'right']:p[0]+'px',bottom:'calc('+p[1]+'px + env(safe-area-inset-bottom,0px))','--s':sz(k)}; };
  const RL=CB_ROLE[role]||CB_ROLE.dealer;
  return html`<div ref=${root} className=${'cbp r-'+role+(hidden?' hid':'')} style=${{'--cbo':R.op}}>
    <div className="cbp-mz" onPointerDown=${mvDown} onPointerMove=${mvMove} onPointerUp=${mvUp} onPointerCancel=${mvUp}>
      <div className=${'cbp-mb'+(R.stick==='fixed'?' fx':'')} style=${{left:P.mv[0]+'px',bottom:'calc('+P.mv[1]+'px + env(safe-area-inset-bottom,0px))','--s':sz('mv')}}><i className="cbp-mk"></i></div></div>
    <button type="button" className="cbp-at" style=${st('atk')} onPointerDown=${atDown} onPointerMove=${atMove} onPointerUp=${atUp} onPointerCancel=${atUp} aria-label="공격 (탭: 자동 조준 · 끌기: 정밀 조준)">
      <i className="cbp-cd a"></i><span className="cbp-ak"><${Icon} n=${(GW[wk[0]]||GW.sword).ic} s=${30} w=${2.3}/></span><i className="cbp-dw"></i><kbd>J · 클릭</kbd></button>
    <button type="button" className=${'cbp-fd'+(fdN?'':' no')} style=${st('fd')} onPointerDown=${e=>{ e.preventDefault(); e.stopPropagation(); setFo(v=>!v); haptic(6); }} aria-label="요리"><${Icon} n="heart" s=${18} w=${2.4}/><b>${fdN}</b><kbd>E</kbd></button>
    ${fo?html`<div className="cbp-fl" onPointerDown=${e=>e.stopPropagation()}>${((S.current&&S.current.rpg&&S.current.rpg.food)||[]).length?S.current.rpg.food.map((f,i)=>html`<button key=${f.sig} type="button" className="tap" onPointerDown=${e=>{ e.preventDefault(); e.stopPropagation(); S.current.eat(i); setFo(false); }}><span style=${{'--c':ING_TAG[f.tag][1]}}><${Icon} n=${ING_TAG[f.tag][2]} s=${14} w=${2.4}/></span><div><b>${f.n} ×${f.cnt}</b><small>${f.d}</small></div></button>`):html`<p>요리가 없어요 · 섬 요리솥이나 디코아 정착지에서 만들어요</p>`}<button type="button" className="tap cbp-flx" onPointerDown=${e=>{ e.stopPropagation(); setFo(false); }}>닫기</button></div>`:null}
    ${wk[1]||wk[4]>1?html`<button type="button" className="cbp-sw" style=${st('sw')} onPointerDown=${e=>{ e.preventDefault(); e.stopPropagation(); try{ e.currentTarget.setPointerCapture(e.pointerId); }catch(_){}
        const s=S.current; if(!s) return; const G=s.rpg.gear; const L=G.it.filter(x=>gIsW(x.k)).sort((a,b)=>b.r-a.r).slice(0,8); const o={t0:performance.now(),x:e.clientX,y:e.clientY,L,sel:-1,open:false};
        o.tm=setTimeout(()=>{ if(L.length<2) return; o.open=true; setWhl({L,sel:-1}); haptic(12); },300); whR.current=o; }}
      onPointerMove=${e=>{ const o=whR.current; if(!o||!o.open) return; const dx=e.clientX-o.x, dy=e.clientY-o.y; if(Math.hypot(dx,dy)<24){ if(o.sel!==-1){ o.sel=-1; setWhl({L:o.L,sel:-1}); } return; } const a=(Math.atan2(dy,dx)+Math.PI*2.5)%(Math.PI*2); const i=Math.floor(a/(Math.PI*2)*o.L.length+.5)%o.L.length; if(i!==o.sel){ o.sel=i; setWhl({L:o.L,sel:i}); haptic(4); } }}
      onPointerUp=${e=>{ const o=whR.current; whR.current=null; if(!o) return; clearTimeout(o.tm); const s=S.current; if(!s) return; if(o.open){ setWhl(null); if(o.sel>=0) s.cbEquipW(o.L[o.sel].i); } else s.cbSwap(); }}
      onPointerCancel=${()=>{ const o=whR.current; whR.current=null; if(o) clearTimeout(o.tm); setWhl(null); }} aria-label="무기 바꾸기 (길게: 무기 휠)"><${Icon} n=${(GW[wk[1]||wk[0]]||GW.sword).ic} s=${20} w=${2.4}/><i><${Icon} n="swap" s=${11} w=${3}/></i><kbd>R</kbd></button>`:null}
    ${whl?html`<div className="cbw82"><div className="cbw82-r">${whl.L.map((x,i)=>{ const a=i/whl.L.length*Math.PI*2-Math.PI/2; const tr='translate('+Math.round(Math.cos(a)*96)+'px,'+Math.round(Math.sin(a)*96)+'px)'; const C2=[['#B9C1CE','#6E7887'],['#6CC0FF','#2160E0'],['#CD9BFF','#6A35D6'],['#FFD45A','#EE6A0A']][x.r]; return html`<button key=${x.i} type="button" className=${i===whl.sel?'on':''} style=${{transform:tr,'--t':tr,'--r1':C2[0],'--r2':C2[1]}}><${Icon} n=${GW[x.k].ic} s=${24} w=${2.3}/><small>${gName(x)}</small></button>`; })}
      <div className="cbw82-c"><b>${whl.sel>=0?gName(whl.L[whl.sel]):'무기 휠'}</b><small>${whl.sel>=0?GW_HIT[GW[whl.L[whl.sel].k].hit]:'손가락을 밀어서 골라요'}</small></div></div></div>`:null}
    ${wk[3]?html`<button type="button" className="cbp-wh" style=${st('wh')} onPointerDown=${e=>{ e.preventDefault(); e.stopPropagation(); const s=S.current; s&&s.cbWhet(); }} aria-label="숫돌로 갈기"><${Icon} n="stone" s=${17} w=${2.3}/><b>${wk[2]}</b><kbd>F</kbd></button>`:null}
    <button type="button" className="cbp-sc" style=${st('sec')} onPointerDown=${scDown} onPointerMove=${scMove} onPointerUp=${scUp} onPointerCancel=${scUp} aria-label=${RL.sk[0]}>
      <i className="cbp-cd s"></i><${Icon} n=${role==='tank'?'shield':role==='dealer'?'chev':'heart'} s=${22} w=${2.5}/><b className="cbp-sct"></b><kbd>${role==='tank'?'Space 길게/탭':'Space'}</kbd></button>
    <button type="button" className="cbp-ul" style=${st('ult')} onPointerDown=${e=>{ e.preventDefault(); e.stopPropagation(); const s=S.current; s&&s.cbUlt(); }} aria-label=${RL.ul[0]}>
      <i className="cbp-ug"></i><${Icon} n="star" s=${20} w=${2.4}/><b className="cbp-ut"></b><kbd>Q</kbd></button>
    <button type="button" className="cbp-ed tap" onClick=${onEdit} aria-label="조작 편집"><${Icon} n="gear" s=${16} w=${2.3}/></button>
  </div>`;
}

/* ═════════ 조작 편집 (버튼 위치 · 크기 · 투명도 · 스틱 · 데드존 · 히트스톱 · 흔들림 · 자동 조준) ═════════ */
function ControlEditor({onClose}){
  const [o,setO]=useState(cbCtl()); const [sel,setSel]=useState('atk'); const dr=useRef(null);
  const put=p=>setO(x=>({...x,...p})); const setPos=(k,v)=>setO(x=>({...x,pos:{...x.pos,[k]:v}})); const setSz=(k,v)=>setO(x=>({...x,sz:{...(x.sz||{}),[k]:v}}));
  const down=(k,e)=>{ e.preventDefault(); e.stopPropagation(); setSel(k); const p=o.pos[k]; dr.current={k,x0:e.clientX,y0:e.clientY,p0:p.slice(),id:e.pointerId}; try{ e.currentTarget.setPointerCapture(e.pointerId); }catch(er){} };
  const move=e=>{ const D=dr.current; if(!D||D.id!==e.pointerId) return; const dx=e.clientX-D.x0, dy=e.clientY-D.y0; const W=window.innerWidth, H=window.innerHeight;
    const nx=D.k==='mv'?Math.max(8,Math.min(W*.45,D.p0[0]+dx)):Math.max(8,Math.min(W*.6,D.p0[0]-dx)); const ny=Math.max(8,Math.min(H*.7,D.p0[1]-dy)); setPos(D.k,[Math.round(nx),Math.round(ny)]); };
  const up=e=>{ dr.current=null; };
  const L={atk:['공격','sword',92],sec:['보조','shield',66],ult:['궁극기','star',60],sw:['무기 교체','swap',50],fd:['요리','heart',48],mv:['이동 스틱','move',112]};
  const save=()=>{ cbCtlSave(o); haptic([8,20,10]); onClose(); };
  const S1=(o.sz&&o.sz[sel])||1;
  return html`<div className="cbe" onPointerMove=${move} onPointerUp=${up}>
    <div className="cbe-grid"></div>
    ${Object.entries(L).map(([k,[n,ic,b]])=>{ const p=o.pos[k]; const s0=((o.sz&&o.sz[k])||1)*o.size; return html`<div key=${k} className=${'cbe-b k-'+k+(sel===k?' on':'')} style=${{[k==='mv'?'left':'right']:p[0]+'px',bottom:p[1]+'px',width:b*s0+'px',height:b*s0+'px',opacity:o.op}} onPointerDown=${e=>down(k,e)}><${Icon} n=${ic} s=${22} w=${2.3}/><small>${n}</small></div>`; })}
    <div className="cbe-p">
      <div className="cbe-h"><b>조작 편집</b><small>버튼을 끌어서 옮겨요 · 고른 버튼: ${L[sel][0]}</small></div>
      <label className="cbe-r"><span>${L[sel][0]} 크기 <b>${Math.round(S1*100)}%</b></span><input type="range" min="80" max="130" step="5" value=${Math.round(S1*100)} onInput=${e=>setSz(sel,+e.target.value/100)}/></label>
      <label className="cbe-r"><span>투명도 <b>${Math.round(o.op*100)}%</b></span><input type="range" min="35" max="100" step="5" value=${Math.round(o.op*100)} onInput=${e=>put({op:+e.target.value/100})}/></label>
      <label className="cbe-r"><span>데드존 <b>${Math.round(o.dz*100)}%</b></span><input type="range" min="5" max="30" step="1" value=${Math.round(o.dz*100)} onInput=${e=>put({dz:+e.target.value/100})}/></label>
      <div className="cbe-r"><span>이동 스틱</span><${GChips} sm=${true} items=${[['float','유동형'],['fixed','고정형']]} value=${o.stick} onChange=${v=>put({stick:v})}/></div>
      <div className="cbe-r"><span>자동 조준</span><${GChips} sm=${true} items=${[['near','가까운 적'],['weak','약점 노출'],['low','체력 낮은 적']]} value=${o.aim} onChange=${v=>put({aim:v})}/></div>
      <div className="cbe-t"><label><input type="checkbox" checked=${!!o.hitstop} onChange=${e=>put({hitstop:e.target.checked?1:0})}/>히트스톱</label><label><input type="checkbox" checked=${!!o.shake} onChange=${e=>put({shake:e.target.checked?1:0})}/>화면 흔들림</label></div>
      <div className="cbe-a"><button type="button" className="tap" onClick=${()=>setO({...CB_CTL_DEF,pos:{...CB_CTL_DEF.pos}})}>기본값</button><button type="button" className="tap ghost2" onClick=${onClose}>취소</button><button type="button" className="tap go" onClick=${save}>저장</button></div>
    </div>
  </div>`;
}

/* ═════════ 출정 준비: 솔로 탐험 / 크루 원정 · 역할 · 원소 ═════════ */
function CbEntry({c,kind,party,onStart,onLore}){
  const D=DG[kind]; const [E,setE]=useState(cbEntry()); const set=(k,v)=>{ setE(o=>({...o,[k]:v})); haptic(6); };
  const tip=useMemo(()=>CB_TIPS[Math.floor(Math.random()*CB_TIPS.length)],[]);
  const R=CB_ROLE[E.role], EL=CB_ELEM[E.elem]; const crew=E.mode==='crew'; const n=crew?Math.max(1,party):1;
  const isle=(CB_LORE.isles.find(x=>x[0]===D.n)||[])[1];
  return html`<div className="cbn" style=${{'--g1':D.col[0],'--g2':D.col[1]}}>
    <div className="cbn-c">
      <div className="cbn-hd"><em>${D.e}</em><b>${D.n}</b>${isle?html`<small>${isle}</small>`:null}<button type="button" className="cbn-lore tap" onClick=${onLore}><${Icon} n="book" s=${14} w=${2.3}/>세계관</button></div>
      <div className="cbn-sec"><span>출정 방식</span><${GChips} cls="cbn-mode" items=${[['solo','솔로 탐험','user'],['crew','크루 원정 2~4인','users']]} value=${E.mode} onChange=${v=>set('mode',v)}/>
        <p className="cbn-n">${crew?(party>1?'같이 들어온 크루 '+party+'명 · 몬스터 체력 ×'+cbPartyMul(party):'아직 같이 들어온 크루가 없어요 · 파티원이 들어오면 몬스터 체력이 ×1.6 / 2.2 / 2.8로 늘어요'):'혼자 들어가면 역할마다 솔로 보정이 붙어요'}</p></div>
      <div className="cbn-sec"><span>역할</span><div className="cbn-roles">${Object.entries(CB_ROLE).map(([k,r],i)=>html`<button key=${k} type="button" className=${'cbn-r tap'+(E.role===k?' on':'')} style=${{'--r1':r.c[0],'--r2':r.c[1],'--d':i*60+'ms'}} onClick=${()=>set('role',k)}>
          <span className="cbn-ri"><${Icon} n=${r.ic} s=${22} w=${2.3}/></span><em>${r.e}</em><b>${r.n}</b><small>${r.sk[0]}</small></button>`)}</div>
        <div className="cbn-rd" key=${E.role}><p><b>패시브 · ${R.pas[0]}</b>${R.pas[1]}</p><p><b>스킬 · ${R.sk[0]}</b>${R.sk[1]}</p><p><b>궁극기 · ${R.ul[0]}</b>${R.ul[1]}</p>${!crew?html`<p className="solo">${R.solo}</p>`:null}</div></div>
      <div className="cbn-sec"><span>원소</span><div className="cbn-els">${Object.entries(CB_ELEM).map(([k,e])=>html`<button key=${k} type="button" className=${'cbn-e tap'+(E.elem===k?' on':'')} style=${{'--e1':e.c[0],'--e2':e.c[1]}} onClick=${()=>set('elem',k)}><i></i><b>${e.n}</b><small>${e.e}</small></button>`)}</div>
        <p className="cbn-n" key=${E.elem}><b style=${{color:EL.c[0]}}>${EL.n}</b> · 일반 몹: ${EL.mob} · 보스: ${EL.boss}</p></div>
      <p className="cbn-tip"><${Icon} n="spark" s=${13} w=${2.4}/>${tip}</p>
      <button type="button" className="cbn-go tap" onClick=${()=>{ cbEntrySave(E); onStart(E); }}><${Icon} n="swords" s=${18} w=${2.4}/>출정하기</button>
    </div></div>`;
}

/* ═════════ 세계관 도감 (PART 2) ═════════ */
function WLore({c,onClose,got}){
  const [t,setT]=useState('myth'); const G=got||{};
  return html`<div className="wl78" onClick=${onClose}><div className="wl78-c" onClick=${e=>e.stopPropagation()}>
    <div className="wl78-h"><em>DKOA CHRONICLE</em><b>세계관 도감</b><button type="button" className="tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${2.8}/></button></div>
    <${GChips} cls="wl78-t" sm=${true} items=${[['myth','창세 신화'],['elem','4원소'],['guard','수호자'],['isle','섬'],['ctl','조작법']]} value=${t} onChange=${setT}/>
    <div className="wl78-b" key=${t}>
    ${t==='myth'?html`<div className="wl78-terms">${CB_LORE.terms.map(x=>html`<div key=${x[0]}><b>${x[0]}</b><em>${x[1]}</em><small>${x[2]}</small></div>`)}</div>
      ${CB_LORE.myth.map((x,i)=>html`<section key=${i} className="wl78-p" style=${{'--d':i*70+'ms'}}><h4>${x[0]}</h4><p>${x[1]}</p></section>`)}`:null}
    ${t==='elem'?html`${Object.entries(CB_ELEM).map(([k,e],i)=>html`<section key=${k} className="wl78-e" style=${{'--e1':e.c[0],'--e2':e.c[1],'--d':i*60+'ms'}}><i></i><div><b>${e.n} <em>${e.e}</em></b><p>일반 몹 · ${e.mob}</p><p>초대형 보스 · ${e.boss}</p></div></section>`)}
      <p className="wl78-note">흙 · 불 · 얼음 · 번개는 서로를 밀어내요. 원소를 바꿔 가며 몬스터와 보스의 약점을 노려 보세요.</p>`:null}
    ${t==='guard'?html`${CB_LORE.guard.map(([k,z,n,line,tab],i)=>{ const e=CB_ELEM[k]; const has=G['t'+i]; return html`<section key=${k} className="wl78-g" style=${{'--e1':e.c[0],'--e2':e.c[1],'--d':i*70+'ms'}}><div className="wl78-gs"><${Icon} n="lock" s=${18} w=${2.4}/></div><div><small>${z}</small><b>${n}</b><q>${line}</q><p className=${has?'':'lk'}>${has?'석판 · '+tab:'깨진 석판을 찾으면 읽을 수 있어요'}</p></div></section>`; })}
      <p className="wl78-note">네 수호자는 대륙 디코아에서 만날 수 있어요. (곧 열려요)</p>`:null}
    ${t==='isle'?html`${CB_LORE.isles.map((x,i)=>html`<section key=${i} className="wl78-p" style=${{'--d':i*60+'ms'}}><h4>${x[0]}</h4><p>${x[1]}</p></section>`)}
      <section className="wl78-p"><h4>소셜 아일랜드</h4><p>최초 정착민들이 닻을 내리고 개인 섬들을 나무 다리로 묶자 여백의 침식이 멈췄어요. 모든 모험은 여기서 시작해요.</p></section>`:null}
    ${t==='ctl'?html`<div className="wl78-ctl">${[['이동','왼쪽 화면 아무 데나 누르고 끌기 · PC는 WASD'],['공격','오른쪽 칼 버튼: 짧게 탭 = 자동 조준 / 끌기 = 바닥에 사거리가 보이고 떼면 정밀 공격 / 끌었다가 가운데로 돌아와 떼면 취소 · PC는 마우스로 조준하고 클릭 또는 J'],['약점','적 등(보스는 빈틈)의 노란 원을 맞히면 1.5배, 딜러는 1.6배 · 딜러에게만 보이는 가운데 점을 맞히면 2.0배 초치명타'],['보조 버튼','탱커: 누르고 있으면 방패 · 짧게 탭하면 강화 보호막 / 딜러: 탭하거나 끌어서 대쉬 / 힐러: 탭하면 치유의 파동 · PC는 Space (탱커 방패는 Shift)'],['궁극기','별 버튼이 가득 차면 눌러요 · PC는 Q'],['편집','오른쪽 아래 톱니바퀴: 버튼 위치 · 크기 · 투명도 · 스틱 · 데드존 · 히트스톱 · 흔들림 · 자동 조준 우선순위']].map(([a,b],i)=>html`<div key=${i}><b>${a}</b><p>${b}</p></div>`)}</div>`:null}
    </div></div></div>`;
}
/* 파티원 체력바 (크루 원정) */
function CbParty({list}){ if(!list||!list.length) return null;
  return html`<div className="cbpt">${list.map(o=>html`<div key=${o.uid} className=${'cbpt-r r-'+(o.role||'dealer')}><span className="cbpt-i"><${Icon} n=${(CB_ROLE[o.role]||CB_ROLE.dealer).ic} s=${11} w=${2.6}/></span><b>${o.nick}</b><i><u style=${{width:Math.max(0,Math.min(100,o.hp==null?100:o.hp))+'%'}}></u></i></div>`)}</div>`; }

/* ═════════ v27.9 가방 · 대장간 (기획서 4-1 ~ 4-3 · 7-3) ═════════
   가방: 내 캐릭터 + 무기(주/보조) · 투구 · 갑옷 · 각반 슬롯 / 원소 · 종류 필터 그리드 / 상세 스탯 바 / 장착 · 보조 무기로 · 분해 · 일괄 판매
   대장간 (소셜 아일랜드 · 내 섬): 수리(골드) · +1~+5 강화(가루 + 골드) · 숫돌 만들기(벽돌 2 + 광석 2) */
function gStatRows(it){ if(!it) return []; const D=gDef(it);
  if(gIsW(it.k)){ const W=D; const atk=Math.round(W.atk[it.r]*gUpMul(it)); const M=gDurMax(it);
    return [['공격력',atk,135,atk+(it.up?' (+'+(it.up*5)+'%)':'')],['공속',W.spd*(it.sub==='spd'?1.08:1),3,(W.spd*(it.sub==='spd'?1.08:1)).toFixed(2)+'/초'],['사거리',W.rng+(it.sub==='rng'?.5:0),8,(W.rng+(it.sub==='rng'?.5:0))+'칸 · '+GW_HIT[W.hit]],['내구도',it.d,M,it.d+' / '+M+(it.d<=0?' · 무뎌짐':'')]]; }
  const def=Math.round(D.def[it.r]*gUpMul(it)); return [['방어력',def,28,String(def)],[D.sub,D.sv[it.r],D.sv[3],(it.k==='armor'?'+':'')+D.sv[it.r]+(D.su||'')]]; }

function GearCard({it,on,sel,onClick,tag}){ const el=gElemOf(it); const W=gIsW(it.k); const M=W?gDurMax(it):0;
  return html`<button type="button" className=${'gb79-it tap r'+it.r+(sel?' sel':'')+(on?' on':'')} onClick=${onClick}>
    <span className="gb79-ii" style=${{'--ec':el?GE_EL[el].c:'#AEB6C2'}}><${Icon} n=${gDef(it).ic} s=${24} w=${2.3}/></span>
    ${it.up?html`<em className="gb79-up">+${it.up}</em>`:null}${tag?html`<i className="gb79-tag">${tag}</i>`:null}
    ${el?html`<i className="gb79-el" style=${{background:GE_EL[el].c}}></i>`:null}
    ${W?html`<i className=${'gb79-du'+(it.d<=M*.2?' low':'')}><u style=${{width:Math.max(0,it.d/M*100)+'%'}}></u></i>`:null}
  </button>`; }

function WBag({c,onClose,smith,spendBricks,startTab,I,cookOk,onTrade,dg,onMap}){
  const R0=dg&&dg.current?dg.current.rpg:rpgOf(c.me); const [G,setG]=useState(()=>gClone(gearOf(R0))); const [tab,setTab]=useState(startTab||'bag');
  const [f,setF]=useState('all'); const [fe,setFe]=useState('all'); const [mode,setMode]=useState('perf'); const [upFx,setUpFx]=useState(null); const [srt,setSrt]=useState('grade'); const [role,setRole]=useState(()=>cbEntry().role||'dealer'); const [sel,setSel]=useState(()=>{ const g0=gearOf(R0); return g0.eq.w||null; }); const [busy,setBusy]=useState(false);
  const gold=wGoldOf((c.islands||[]).find(x=>x.uid===c.uid)||{});
  const E=gEquipped(G); const set=gSetOf(G); const it=gFind(G,sel);
  const persist=(N,msg)=>{ setG(N); if(dg&&dg.current){ const s=dg.current; s.rpg.gear=N; cbSyncGear(s); if(msg) c.notify(msg); return Promise.resolve(true); } setBusy(true); return c.saveRpg(()=>({gear:N}),msg).finally(()=>setBusy(false)); };
  /* 장비 프리셋 3칸 (사당 10곳 정화 시 4칸) */
  const preN=3+((dkShN(dkOf(R0))>=7)?1:0); const [pi,setPi]=useState(0);
  const savePre=()=>{ const N=gClone(G); N.pre=(N.pre||[]).slice(); N.pre[pi]={...N.eq}; persist(N,'프리셋 '+(pi+1)+'에 저장했어요'); haptic(10); };
  const loadPre=i=>{ setPi(i); const P0=(G.pre||[])[i]; if(!P0) return; const N=gClone(G); const eq={}; Object.entries(P0).forEach(([k,v])=>{ if(v&&gFind(N,v)) eq[k]=v; }); N.eq=eq; persist(N,'프리셋 '+(i+1)+' 장착'); haptic(10); wSfx('shield'); };
  const look=rpgEqLook({...R0,gear:G});
  const st=cbStats({...R0,gear:G});
  const isEq=x=>x&&Object.values(G.eq).includes(x.i);
  const tagOf=x=>G.eq.w===x.i?'주':G.eq.w2===x.i?'보조':isEq(x)?'착용':null;
  const list=G.it.filter(x=>(f==='all'||(f==='w'?gIsW(x.k):f==='a'?!gIsW(x.k):x.k===f))&&(fe==='all'||gElemOf(x)===fe))
    .sort(srt==='pow'?((a,b)=>gPow(b)-gPow(a)||(b.r-a.r)):((a,b)=>(isEq(b)-isEq(a))||(b.r-a.r)||((b.up||0)-(a.up||0))||(gIsW(b.k)-gIsW(a.k))));
  const cycleRole=()=>{ const K=Object.keys(CB_ROLE); const n=K[(K.indexOf(role)+1)%K.length]; setRole(n); cbEntrySave({...cbEntry(),role:n}); haptic(8); wSfx('shield'); };
  /* ── 동작 ── */
  const equip=(x,second)=>{ const N=gClone(G); const sl=gSlotOf(x);
    if(sl==='w'){ if(second){ if(N.eq.w===x.i) N.eq.w=N.eq.w2||null; N.eq.w2=N.eq.w2===x.i?null:x.i; } else { if(N.eq.w2===x.i) N.eq.w2=N.eq.w||null; N.eq.w=x.i; } }
    else N.eq[sl]=N.eq[sl]===x.i?null:x.i;
    haptic(10); wSfx('shield'); persist(N); };
  const dismantle=x=>{ if(isEq(x)) return c.notify('장착 중인 장비는 분해할 수 없어요','err'); const n=Math.round(GE_DUST[x.r]*(1+(x.up||0)*.5));
    dkoAsk(GR_N[x.r]+' '+gName(x)+'을(를) 분해할까요? 강화 가루 '+n+'개를 받아요.',{ok:'분해하기'}).then(ok=>{ if(!ok) return; const N=gClone(G); N.it=N.it.filter(y=>y.i!==x.i); N.dust=(N.dust||0)+n; N.sm=(N.sm||0)+1; setSel(null); wSfx('chest'); persist(N,'강화 가루 +'+n); }); };
  const sellCommon=()=>{ const L=G.it.filter(x=>x.r===0&&!isEq(x)); if(!L.length) return c.notify('팔 수 있는 일반 장비가 없어요'); const g0=L.length*GE_SELL[0];
    dkoAsk('장착하지 않은 일반 장비 '+L.length+'개를 골드 '+g0.toLocaleString()+'에 팔까요?',{ok:'일괄 판매'}).then(ok=>{ if(!ok) return; const N=gClone(G); const ids=new Set(L.map(x=>x.i)); N.it=N.it.filter(y=>!ids.has(y.i)); persist(N).then(()=>c.worldGold(g0,'일반 장비 '+L.length+'개 판매 · 골드 +'+g0.toLocaleString())); }); };
  const repair=x=>{ const M=gDurMax(x); if(x.d>=M) return c.notify('이미 내구도가 가득해요'); const pr=Math.round(GE_FIX[x.r]*(1-lifePerk(R0,'sm'))); if(gold<pr) return c.notify('골드가 '+(pr-gold)+' 모자라요','err');
    c.worldGold(-pr).then(ok=>{ if(!ok) return; const N=gClone(G); const y=gFind(N,x.i); y.d=M; N.sm=(N.sm||0)+1; wSfx('gem'); haptic([10,20,30]); persist(N,gName(x)+' 수리 완료 · 내구도 100%'); }); };
  const upCap=(I&&I.hallLv>=9)?5:4; const upCost=x=>{ const k=GE_RK[x.r]; const u=x.up||0; return u>=upCap?null:{dust:Math.round(GE_UP.dust[u]*k),gold:Math.round(GE_UP.gold[u]*k)}; };
  const enhance=x=>{ const C=upCost(x); if(!C) return; if((G.dust||0)<C.dust) return c.notify('강화 가루가 '+(C.dust-(G.dust||0))+'개 모자라요 · 남는 장비를 분해해 보세요','err'); if(gold<C.gold) return c.notify('골드가 '+(C.gold-gold)+' 모자라요','err');
    c.worldGold(-C.gold).then(ok=>{ if(!ok) return; const N=gClone(G); const y=gFind(N,x.i); y.up=(y.up||0)+1; N.dust-=C.dust; N.sm=(N.sm||0)+2; wSfx('lvl'); haptic([20,30,60]); setUpFx({it:{...y},k:Date.now()}); setTimeout(()=>setUpFx(null),2300); persist(N,gName(y)+' 강화 성공! (+'+y.up+')'); }); };
  const craftStone=()=>{ if((G.ore||0)<2) return c.notify('광석이 '+(2-(G.ore||0))+'개 모자라요 · 던전 몬스터가 떨어뜨려요','err');
    if(!spendBricks||!spendBricks(2)) return; const N=gClone(G); N.ore-=2; N.stone=(N.stone||0)+1; N.sm=(N.sm||0)+1; wSfx('chest'); persist(N,'숫돌을 만들었어요 · 던전에서 무기가 무뎌지면 써요'); };
  const fixAll=()=>{ const L=[E.w,E.w2].filter(x=>x&&x.d<gDurMax(x)); if(!L.length) return c.notify('수리할 무기가 없어요'); const pr=Math.round(L.reduce((a,x)=>a+GE_FIX[x.r],0)*(1-lifePerk(R0,'sm'))); if(gold<pr) return c.notify('골드가 '+(pr-gold)+' 모자라요','err');
    c.worldGold(-pr).then(ok=>{ if(!ok) return; const N=gClone(G); L.forEach(x=>{ const y=gFind(N,x.i); y.d=gDurMax(y); }); N.sm=(N.sm||0)+L.length; wSfx('gem'); persist(N,'착용 무기 '+L.length+'개 수리 완료'); }); };
  const slots=[['w','주 무기','sword'],['w2','보조 무기','swap'],['h','투구','crown'],['a','갑옷','shieldck'],['g','각반','boot']];
  const rows=gStatRows(it);
  return html`<div className="gb79" onClick=${onClose}>${upFx?html`<div className="gb96-upfx" key=${upFx.k} style=${{'--gc':GR_C[upFx.it.r]}} onClick=${e=>{ e.stopPropagation(); setUpFx(null); }}><div><i className="ray"></i><span className="gb96-sq big"><${Icon} n=${gDef(upFx.it).ic} s=${40} w=${2}/></span><em>강화 성공</em><b>${gName(upFx.it)} <strong>+${upFx.it.up}</strong></b><small>공격력 · 방어력 +${upFx.it.up*5}%</small></div></div>`:null}<div className=${"gb79-c t-"+tab} onClick=${e=>e.stopPropagation()}>
    <div className="gb79-h"><div className="gb79-tabs">${(dg?[['bag','가방','bag'],['smith','대장간','anvil']]:[['bag','가방','bag'],['smith','대장간','anvil'],['cook','요리','heart'],['trade','납품','coin']]).map(([k,n,ic])=>html`<button key=${k} type="button" className=${'tap'+(tab===k?' on':'')} onClick=${()=>{ setTab(k); haptic(6); }}><${Icon} n=${ic} s=${16} w=${2.4}/>${n}</button>`)}${onMap?html`<button type="button" className="tap map" onClick=${()=>{ onClose(); onMap(); }}><${Icon} n="map" s=${16} w=${2.4}/>지도</button>`:null}</div>
      <span className="gb79-res"><span title="강화 가루"><${Icon} n="dust" s=${14} w=${2.4}/>${G.dust||0}</span><span title="광석"><${Icon} n="ore" s=${14} w=${2.4}/>${G.ore||0}</span><span title="숫돌"><${Icon} n="stone" s=${14} w=${2.4}/>${G.stone||0}</span><span title="정령석" className="ss"><${SsIc} s=${14}/>${R0.ss||0}</span><span className="gd"><${GoldIc} s=${15}/>${gold.toLocaleString()}</span></span>
      <button type="button" className="gb79-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="gb79-b">
      <div className="gb79-l gb96-l">
        <div className="gb96-seg">${[['perf','성능 장비'],['look','외형 (룩변환)']].map(([k,n])=>html`<button key=${k} type="button" className=${'tap'+(mode===k?' on':'')} onClick=${()=>{ setMode(k); haptic(5); }}>${n}</button>`)}</div>
        <div className="gb96-show">
          <div className="gb96-col">${[['w','주 무기','sword'],['w2','보조 무기','swap'],['role','역할군','user']].map(([k,n,ic])=>k==='role'?html`<${G96Role} key="role" role=${role} onClick=${cycleRole}/>`:html`<${G96Slot} key=${k} x=${E[k]} n=${n} ic=${ic} sel=${it&&E[k]&&it.i===E[k].i} look=${mode==='look'} onClick=${()=>E[k]&&setSel(E[k].i)}/>`)}</div>
          <div className="gb96-stage" style=${{'--pc':set?GE_EL[set].c:E.w&&gElemOf(E.w)?GE_EL[gElemOf(E.w)].c:'#FF8A3D'}}><i className="gb96-ped"></i><${VoxelStage} av=${avatarOf(c.me)} w=${150} h=${170} eq=${look} rc=${hexRgb(set?GE_EL[set].c:E.w&&gElemOf(E.w)?GE_EL[gElemOf(E.w)].c:'#FF8A3D')}/><small className="gb96-hint">끌어서 돌려 보기</small></div>
          <div className="gb96-col">${[['h','투구','crown'],['a','갑옷','shieldck'],['g','각반','boot']].map(([k,n,ic])=>mode==='look'?html`<${G96Look} key=${k} k=${k} n=${n} ic=${ic} R0=${R0} c=${c}/>`:html`<${G96Slot} key=${k} x=${E[k]} n=${n} ic=${ic} sel=${it&&E[k]&&it.i===E[k].i} onClick=${()=>E[k]&&setSel(E[k].i)}/>`)}</div>
        </div>
        ${(()=>{ const cnt={}; [E.h,E.a,E.g].forEach(x=>{ if(x&&x.el) cnt[x.el]=(cnt[x.el]||0)+1; }); const best=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
          return set?html`<div className="gb96-set on" style=${{'--ec':GE_EL[set].c}}><i></i><b>${GE_EL[set].n} 3세트 발동</b><small>${GA_SET[set]}</small></div>`:best?html`<div className="gb96-set" style=${{'--ec':GE_EL[best[0]].c}}><i></i><b>${GE_EL[best[0]].n} 세트 ${best[1]}/3</b><small>같은 원소 방어구 3개 · ${GA_SET[best[0]]}</small></div>`:html`<div className="gb96-set none"><b>세트 효과 없음</b><small>투구 · 갑옷 · 각반을 같은 원소로 맞춰 보세요</small></div>`; })()}
        <div className="gb79-pre gb96-pre"><span>프리셋</span>${Array.from({length:4},(_,i)=>html`<button key=${i} type="button" className=${'tap'+(pi===i?' on':'')+(i>=preN?' lock':'')+((G.pre||[])[i]?' has':'')} onClick=${()=>i<preN?loadPre(i):c.notify('사당 7곳을 정화하면 4번째 칸이 열려요')}>${i>=preN?html`<${Icon} n="lock" s=${12} w=${2.6}/>`:i+1}</button>`)}<button type="button" className="tap sv" onClick=${savePre}><${Icon} n="check" s=${13} w=${3}/>저장</button></div>
        <div className="gb79-sum"><span><b>${st.hp}</b><small>체력</small></span><span><b>${st.atk}</b><small>공격력</small></span><span><b>${st.def}</b><small>방어력</small></span><span><b>${Math.round(st.spd*100)}%</b><small>이동</small></span></div>
      </div>
      <div className="gb79-r">
      ${tab==='cook'?html`<${WCook} R=${{...R0,ore:G.ore||0}} say=${t=>c.notify(t)} canCook=${!!cookOk} potion=${cookOk&&cookOk.potion} why=${'내 섬의 요리솥 근처에서 요리해요 (성 Lv.3에 요리솥) · 디코아 정착지에도 요리솥이 있어요'}
          onCommit=${(o,msg)=>{ const N={...G,ore:o.ore}; setG(N); c.saveRpg(r=>({pt:o.pt,food:o.food,rcp:o.rcp,gear:N,life:lifeAdd(r,'ck')}),msg); }}
          onEat=${i=>{ const o=eatApply(R0,i); if(!o) return; wSfx('gem'); haptic([10,20]); c.saveRpg(()=>({food:o.food,buf:o.buf}),o.f.n+' 냠! '+(o.note||'')); }}/>`:null}
      ${tab==='trade'?html`<${WTrade} R=${R0} uid=${c.uid} hl=${(I&&I.hallLv)||1} has=${!!(I&&I.items.some(x=>x.t==='tbal'&&x.lv>=1))} done=${!!(I&&I.tb&&I.tb.w===Math.floor(Date.now()/TB_WIN)&&I.tb.done)}
          onSell=${o=>{ let g0=0; Object.entries(o).forEach(([k,n])=>g0+=ING[k].p*n); g0=Math.round(g0*(1+lifePerk(R0,'tr'))); c.saveRpg(r=>{ const pt={...(r.pt||{})}; for(const [k,n] of Object.entries(o)){ if((pt[k]||0)<n) return null; pt[k]-=n; if(!pt[k]) delete pt[k]; } return {pt,life:lifeAdd(r,'tr')}; }).then(ok=>{ if(ok) c.worldGold(g0,'상인 토비에게 팔았어요 · 골드 +'+g0.toLocaleString()); }); }}
          onOrder=${O=>{ c.saveRpg(r=>{ const pt={...(r.pt||{})}; for(const [k,n] of Object.entries(O.need)){ if((pt[k]||0)<n) return null; pt[k]-=n; if(!pt[k]) delete pt[k]; } const g1=gClone(gearOf(r)); g1.dust=(g1.dust||0)+O.dust; return {pt,gear:g1,life:lifeAdd(r,'tr')}; }).then(ok=>{ if(!ok) return; setG(x=>({...x,dust:(x.dust||0)+O.dust})); onTrade&&onTrade(O); const OG=Math.round(O.gold*(1+lifePerk(R0,'tr'))); c.worldGold(OG,'무역 주문 완료! 골드 +'+OG.toLocaleString()+' · 강화 가루 +'+O.dust); if(O.gift){ const k=['fountain','statue','lamp','bench'][Math.floor(Math.random()*4)]; c.giveWorldItem(k); } wSfx('clear'); }); }}/>`:null}
      ${tab==='bag'||tab==='smith'?html`<div className="gb79-rr">
      ${tab==='bag'?html`
        <div className="gb96-f"><div className="gb96-pills">${[['all','전체'],['w','무기'],['a','방어구']].map(([k,n])=>html`<button key=${k} type="button" className=${'tap'+(f===k?' on':'')} onClick=${()=>{ setF(k); haptic(4); }}>${n}</button>`)}</div>
          <div className="gb96-pills el">${[['all','전체'],...GE_ELS.map(k=>[k,G96_EMO[k]])].map(([k,n])=>html`<button key=${k} type="button" className=${'tap'+(fe===k?' on':'')} style=${k!=='all'?{'--ec':GE_EL[k].c}:null} aria-label=${k==='all'?'모든 원소':GE_EL[k].n} onClick=${()=>{ setFe(k); haptic(4); }}>${n}</button>`)}</div>
          <div className="gb96-tools"><button type="button" className="tap" onClick=${()=>{ setSrt(srt==='grade'?'pow':'grade'); haptic(4); }}><${Icon} n="sort" s=${13} w=${2.6}/>${srt==='grade'?'등급순':'전투력순'}</button><button type="button" className="tap" onClick=${sellCommon}><${Icon} n="coin" s=${13} w=${2.6}/>일괄 판매</button></div></div>
        <div className="gb79-grid gb96-grid">${list.length?list.map((x,i)=>html`<${GearCard} key=${x.i} it=${x} on=${isEq(x)} sel=${sel===x.i} tag=${tagOf(x)} onClick=${()=>{ setSel(x.i); haptic(5); }}/>`):html`<p className="gb79-none">이 조건에 맞는 장비가 없어요</p>`}</div>
        <div className="gb79-cap">${G.it.length} / ${gCap(G)}칸 · 가득 차면 새 장비는 강화 가루가 돼요</div>`:html`
        ${smith?null:html`<div className="gb79-lock"><${Icon} n="lock" s=${16} w=${2.4}/>대장간은 소셜 아일랜드 · 내 섬에서 열려요. 지금은 둘러보기만 할 수 있어요.</div>`}
        <div className=${'gb79-sm'+(smith?'':' off')}>
          <button type="button" className="gb79-sb tap" onClick=${()=>smith&&fixAll()}><${Icon} n="anvil" s=${22} w=${2.2}/><b>착용 무기 모두 수리</b><small>일반 20 · 희귀 45 · 영웅 90 · 전설 150 골드</small></button>
          <button type="button" className="gb79-sb tap" onClick=${()=>smith&&craftStone()}><${Icon} n="stone" s=${22} w=${2.2}/><b>숫돌 만들기</b><small>벽돌 2 + 광석 2 · 던전에서 내구도 40% 즉시 회복</small></button>
          <p className="gb79-tip">강화는 장비를 고른 뒤 아래 [강화]를 눌러요. +1마다 공격력/방어력 +5% (최대 +5 · 25%). 강화 가루는 남는 장비를 분해해서 얻어요.</p>
        </div>`}
        ${it?html`<${G96Card} it=${it} G=${G} R0=${R0} E=${E} eqd=${isEq(it)} tab=${tab} busy=${busy} smith=${smith} c=${c}
            onEquip=${()=>equip(it,false)} onQuick=${()=>equip(it,true)} onRepair=${()=>repair(it)} onBreak=${()=>dismantle(it)} onUp=${()=>enhance(it)} upC=${upCost(it)} upCap=${upCap}/>`:html`<div className="gb79-d none"><p>장비를 고르면 자세한 능력치가 보여요</p></div>`}
      </div>`:null}
      </div>
    </div>
  </div></div>`;
}

/* ── 상점 · 장비 탭: 일반 / 희귀(본부 Lv.2) 기본 장비 ── */
const GSHOP={w:[['sword',300,1600],['bow',340,1800],['staff',320,1700]],a:[['helm',220,1200],['armor',300,1600],['greaves',220,1200]]};
function WGearShop({I,gold,onBuy,onBag}){ const [el,setEl]=useState('fire'); const hl=(I&&I.hallLv)||1;
  const card=([k,p0,p1],r)=>{ const D=gIsW(k)?GW[k]:GA[k]; const pr=r?p1:p0; const lock=r&&hl<2; const v=gIsW(k)?'공격 '+D.atk[r]+' · '+GW_HIT[D.hit]:'방어 '+D.def[r]+' · '+D.sub+' '+(k==='armor'?'+':'')+D.sv[r]+(D.su||'');
    return html`<button key=${k+r} type="button" className=${'gs79-c tap r'+r+(lock?' lock':'')} onClick=${()=>!lock&&onBuy(k,el,r,pr)}>
      <span className="gb79-ii" style=${{'--ec':GE_EL[el].c}}><${Icon} n=${D.ic} s=${24} w=${2.3}/></span><em style=${{color:GR_C[r]}}>${GR_N[r]}</em><b>${GE_EL[el].n} ${D.n}</b><small>${v}</small>
      <span className="gs79-p">${lock?html`<${Icon} n="lock" s=${12} w=${2.6}/>본부 Lv.2`:html`<${GoldIc} s=${14}/>${pr.toLocaleString()}`}</span></button>`; };
  return html`<div className="gs79">
    <div className="wbs-cap">무기 · 방어구는 원소를 골라서 사요 · 원소 전용 무기(화염 대검 · 서리 창 · 번개 쌍단검 · 대지 해머)와 영웅 · 전설은 던전 전리품이에요</div>
    <div className="gs79-el">${GE_ELS.map(k=>html`<button key=${k} type="button" className=${'tap'+(el===k?' on':'')} style=${{'--ec':GE_EL[k].c}} onClick=${()=>{ setEl(k); haptic(5); }}><i></i>${GE_EL[k].n}</button>`)}</div>
    <h5>무기</h5><div className="gs79-g">${GSHOP.w.map(x=>card(x,0))}${GSHOP.w.map(x=>card(x,1))}</div>
    <h5>방어구 <small>같은 원소 3부위 세트 · ${GA_SET[el]}</small></h5><div className="gs79-g">${GSHOP.a.map(x=>card(x,0))}${GSHOP.a.map(x=>card(x,1))}</div>
    <button type="button" className="gs79-bag tap" onClick=${onBag}><${Icon} n="bag" s=${18} w=${2.4}/>가방 · 대장간 열기</button>
  </div>`; }
try{ window.__gx={gNew,gearOf,gClone,cbSyncGear,cbStats,gDrop}; }catch(e){}

/* ════════ v29.6 장비 화면 고도화: 대칭 슬롯 · 상세 카드 · 스탯 비교 ════════ */
const G96_EMO={fire:'🔥',ice:'❄️',bolt:'⚡',earth:'🪨'};
const hexRgb=h=>{ const v=String(h||'#FF8A3D').replace('#',''); const n=parseInt(v.length===3?v.split('').map(x=>x+x).join(''):v,16); return ((n>>16)&255)+','+((n>>8)&255)+','+(n&255); };
const gPow=x=>{ if(!x) return 0; const D=gDef(x); return gIsW(x.k)?Math.round(D.atk[x.r]*gUpMul(x))*3:Math.round(D.def[x.r]*gUpMul(x))*8+(x.k==='armor'?D.sv[x.r]:0); };
const gSpdOf=x=>x&&gIsW(x.k)?+(GW[x.k].spd*(x.sub==='spd'?1.08:1)).toFixed(2):null;
const gRngOf=x=>x&&gIsW(x.k)?GW[x.k].rng+(x.sub==='rng'?.5:0):null;
function G96Slot({x,n,ic,sel,onClick,look}){ const el=x&&gElemOf(x); const M=x&&gIsW(x.k)?gDurMax(x):0; const gc=x?GR_C[x.r]:'rgba(255,255,255,.18)';
  return html`<button type="button" className=${'gb96-sl tap'+(x?' r'+x.r:' empty')+(sel?' sel':'')+(look?' dim':'')} style=${{'--gc':gc,'--ec':el?GE_EL[el].c:gc}} onClick=${onClick}>
    <span className="gb96-sq" key=${x?x.i:'e'}><i className="gb96-wave"></i><${Icon} n=${x?gDef(x).ic:ic} s=${22} w=${2.2}/>${x&&x.up?html`<em className="gb96-up">+${x.up}</em>`:null}${el?html`<i className="gb96-eb"></i>`:null}
      ${M?html`<i className=${'gb96-du'+(x.d<=M*.2?' low':'')}><u style=${{width:Math.max(0,x.d/M*100)+'%'}}></u></i>`:null}</span>
    <small>${n}</small><b className=${x?'':'no'}>${x?gName(x):'비어 있음'}</b></button>`; }
function G96Role({role,onClick}){ const R=CB_ROLE[role]||CB_ROLE.dealer;
  return html`<button type="button" className="gb96-sl tap role" style=${{'--gc':R.c[0],'--ec':R.c[1]}} onClick=${onClick}><span className="gb96-sq"><${Icon} n=${R.ic} s=${22} w=${2.3}/></span><small>역할군</small><b>${R.n} · 눌러서 바꾸기</b></button>`; }
function G96Look({k,n,ic,R0,c}){ const LK=(R0.look||{}); const v=LK[k]||''; const L2=['','none','c','r','e','l']; const lab={'':'성능대로',none:'숨김',c:'일반',r:'희귀',e:'영웅',l:'전설'}[v]; const ri={c:0,r:1,e:2,l:3}[v];
  return html`<button type="button" className=${'gb96-sl tap lk'+(v?' on':'')} style=${{'--gc':ri!=null?GR_C[ri]:'rgba(255,255,255,.3)','--ec':ri!=null?GR_C[ri]:'rgba(255,255,255,.3)'}} onClick=${()=>{ const nv=L2[(L2.indexOf(v)+1)%L2.length]; c.saveRpg(r=>({look:{...(r.look||{}),[k]:nv||null}})); haptic(5); }}>
    <span className="gb96-sq"><${Icon} n=${v==='none'?'eyeoff':ic} s=${22} w=${2.2}/></span><small>${n} 외형</small><b>${lab}</b></button>`; }
function G96Card({it,G,R0,E,eqd,tab,busy,smith,c,onEquip,onQuick,onRepair,onBreak,onUp,upC,upCap}){ const el=gElemOf(it); const W=gIsW(it.k); const M=W?gDurMax(it):0; const gc=GR_C[it.r]; const sl=gSlotOf(it);
  /* 스탯 비교: 이 장비를 끼면 어떻게 바뀌는지 */
  const cur=cbStats({...R0,gear:G}); const N=gClone(G); if(!eqd){ if(sl==='w') N.eq.w=it.i; else N.eq[sl]=it.i; } const nx=cbStats({...R0,gear:N}); const base=W?(G.eq.w2===it.i?E.w2:E.w):E[sl];
  const rows=[['공격력',cur.atk,nx.atk],['방어력',cur.def,nx.def],['체력',cur.hp,nx.hp]]; if(W){ rows.push(['공속',gSpdOf(base),gSpdOf(it),'/초']); rows.push(['사거리',gRngOf(base),gRngOf(it),'칸']); }
  const fx=n=>Number.isInteger(n)?n:(+n).toFixed(2).replace(/\.?0+$/,'');
  const fixP=Math.round(GE_FIX[it.r]*(1-lifePerk(R0,'sm')));
  return html`<div className=${'gb96-d r'+it.r} key=${it.i} style=${{'--gc':gc,'--ec':el?GE_EL[el].c:gc}}><i className="cn tl"></i><i className="cn tr"></i><i className="cn bl"></i><i className="cn br"></i>
    <div className="gb96-dh"><span className="gb96-sq big"><${Icon} n=${gDef(it).ic} s=${28} w=${2.2}/>${it.up?html`<em className="gb96-up">+${it.up}</em>`:null}</span>
      <div><div className="gb96-tags"><em style=${{color:gc,borderColor:gc}}>${GR_N[it.r]}</em>${el?html`<em className="el" style=${{color:GE_EL[el].c,borderColor:GE_EL[el].c}}>${G96_EMO[el]} ${GE_EL[el].n}</em>`:html`<em className="el">원소 없음</em>`}${eqd?html`<em className="on">장착 중</em>`:null}</div><b>${gName(it)}</b><small>${W?GW_HIT[GW[it.k].hit]:({h:'투구',a:'갑옷',g:'각반'})[sl]} · 전투력 ${gPow(it).toLocaleString()}</small></div></div>
    <div className="gb96-diff">${rows.map(([n,a,b,u2])=>{ if(a==null&&b==null) return null; const d=(b||0)-(a||0); return html`<div key=${n}><small>${n}</small><b>${b==null?'-':fx(b)}${u2||''}</b>${eqd||!d?html`<em className="z">${eqd?'현재':'±0'}</em>`:html`<em className=${d>0?'up':'dn'}>${d>0?'▲ +':'▼ '}${fx(Math.abs(d))}</em>`}</div>`; })}</div>
    ${W?html`<div className="gb96-dur"><small>내구도</small><i><u className=${it.d<=M*.2?'low':''} style=${{width:Math.max(0,it.d/M*100)+'%'}}></u></i><b>${it.d} / ${M}${it.d<=0?' · 무뎌짐':''}</b></div>`:null}
    <div className="gb96-blk">
      ${it.sub?html`<div className="b r1"><em>희귀 부옵션</em><span>${GE_SUB[it.sub]}</span></div>`:null}
      ${it.r>=2&&W&&el?html`<div className="b r2"><em>영웅 패시브</em><span>${GE_EPIC[el]}</span></div>`:null}
      ${it.r===3&&W?html`<div className="b r3"><em>전설 고유 효과 · ${GW[it.k].leg[0]}</em><span>${GW[it.k].leg[1]}</span></div>`:null}
      ${!W&&it.el?html`<div className="b"><em>원소 저항</em><span>${GA[it.k].res}</span></div><div className="b"><em>같은 원소 3세트</em><span>${GA_SET[it.el]}</span></div>`:null}
      ${W&&it.r<3?html`<div className="b dim"><em>전설 등급이면</em><span>${GW[it.k].leg[0]}</span></div>`:null}</div>
    <div className="gb96-act">${tab==='bag'?html`
      <button type="button" className=${'tap pri'+(eqd?' on':'')} disabled=${busy} onClick=${onEquip}><${Icon} n=${eqd?'x':'check'} s=${15} w=${2.8}/>${eqd&&G.eq.w2!==it.i?'해제':'장착'}</button>
      <button type="button" className=${'tap'+(G.eq.w2===it.i?' on':'')} disabled=${busy||!W} onClick=${onQuick}><${Icon} n="swap" s=${15} w=${2.6}/>${G.eq.w2===it.i?'퀵슬롯 해제':'퀵슬롯 등록'}</button>
      <button type="button" className="tap" disabled=${busy||!W||!smith||it.d>=M} onClick=${onRepair}><${Icon} n="anvil" s=${15} w=${2.4}/>${!W?'수리 없음':!smith?'대장간에서 수리':it.d>=M?'수리 완료':'수리 '+fixP+' G'}</button>
      <button type="button" className="tap warn" disabled=${busy||eqd} onClick=${onBreak}><${Icon} n="dust" s=${15} w=${2.4}/>분해 +${Math.round(GE_DUST[it.r]*(1+(it.up||0)*.5))}</button>`:html`
      <button type="button" className="tap" disabled=${busy||!smith||!W||it.d>=M} onClick=${onRepair}><${Icon} n="anvil" s=${15} w=${2.4}/>${W?'수리 · '+fixP+' G':'수리 없음'}</button>
      ${upC?html`<button type="button" className="tap pri" disabled=${busy||!smith} onClick=${onUp}><${Icon} n="up" s=${15} w=${2.8}/>강화 +${(it.up||0)+1} · 가루 ${upC.dust} · ${upC.gold.toLocaleString()} G</button>`:html`<button type="button" className="tap" disabled>${upCap<5&&(it.up||0)>=4?'+5는 성 Lv.9':'최대 강화 +'+upCap}</button>`}`}</div></div>`; }

/* ═════════ v28.0 대륙 디코아 (기획서 PART 5 · 6-4 일부) ═════════
   · 한 장의 대륙 지도: 중앙 평원 + 4원소 구역 · 7단 고저차(0 바다/강/용암 ~ 6 전망대)
   · 글라이더(낙하 1.5칸↑ 자동) · 상승 기류 · 5단계 온도
   · 필드 기믹 8종 · 사당 16개 · 정화 마일스톤 · 전망대 10개 · 정착지 4곳 · 4대 수호자
   · 무한 의뢰 · 돌발 이벤트 · 공허의 밤 · 젤다식 지도 · 나침반 바 */
const DK_R=172, DK_LV=10, DK_CELL=8; /* v29.7 3배 넓어졌어요 (100 → 172) */
const DK_SETN=['협곡 나무꾼 촌락','화산 대장간 캠프','설원 광산 기지','유적 발굴단 야영지','바위 협곡 전초기지','용암 강 전초기지','빙하 호수 전초기지','폭풍 첨탑 전초기지'];
const SH_ORDER=['sight','wind','weight','crack','furnace','ignite','gear','slide','circuit','reso'];
const DK_RG={
  plain:{n:'중앙 평원',e:'CENTRAL PLAINS',el:null,tier:1,temp:21,eq:'일반',sky:['#8ED8F2','#4AA6D2'],top:[['#9BE08F','#8DD683'],['#F4E3B2','#EAD59C']],side:'#7A5A3E',side2:'#5E4430'},
  earth:{n:'거암 협곡',e:'TITAN CANYON',el:'earth',tier:2,temp:19,eq:'일반 ~ 희귀',sky:['#F2D9A8','#C9925A'],top:[['#D9B98A','#CFAE7E'],['#B5D98A','#A9CF7E']],side:'#A0764A',side2:'#7A5434'},
  fire:{n:'화산 지대',e:'VOLCANIC FIELDS',el:'fire',tier:3,temp:38,eq:'희귀 ~ 영웅',sky:['#6A2A22','#2A0A0A'],top:[['#5E4C48','#56453F'],['#3E3446','#38303F']],side:'#3A2C2A',side2:'#241A1A'},
  ice:{n:'서리 설원',e:'FROST STEPPE',el:'ice',tier:4,temp:-6,eq:'영웅',sky:['#DDEBF8','#8FB0D6'],top:[['#F2F7FC','#E6EEF7'],['#CFE8F8','#C2DEF2']],side:'#9DB4CC',side2:'#7890AC'},
  und:{n:'지하 사당',e:'UNDERGROUND SHRINE',el:null,tier:1,temp:18,eq:'-',sky:['#1A1830','#07060F'],top:[['#3A3F5C','#353A55'],['#464B6C','#40456A']],side:'#23263C',side2:'#181A2A'},
  bolt:{n:'폭풍 유적',e:'STORM RUINS',el:'bolt',tier:5,temp:14,eq:'영웅 ~ 전설',sky:['#5A5E8A','#24264A'],top:[['#9AA0B8','#8E94AC'],['#7FB08A','#74A47E']],side:'#5E6480',side2:'#454A66'}
};
const DK_AX={ice:[-1,-1],fire:[1,-1],bolt:[1,1],earth:[-1,1]};
const DK_ORDER=['earth','fire','ice','bolt'];
/* 구역별 몬스터 (기획서 4-3 티어표) */
Object.assign(MOB,{
  pslime:{n:'초원 왕슬라임',hp:220,atk:26,spd:1.1,xp:40,b:[40,70],c:['#E6F07A','#8AB82A'],sz:1.7,kind:'slime',mini:1,slam:1},
  rmush:{n:'바위 버섯',hp:160,atk:24,spd:1.25,xp:22,b:[18,30],c:['#B98A5A','#EADBC0'],sz:1.05,kind:'mush'},
  pebble:{n:'자갈 골렘',hp:160,atk:24,spd:1.15,xp:22,b:[18,30],c:['#B5A48A','#7A6A50'],sz:.62,kind:'golem'},
  rgolem:{n:'협곡 수호석',hp:380,atk:38,spd:1,xp:70,b:[60,100],c:['#C9A878','#7A5A34'],sz:1.25,kind:'golem',mini:1,slam:1},
  monol:{n:'모놀리스 렉스',hp:3200,atk:55,spd:.9,xp:600,b:[700,1000],c:['#A8946E','#E8C060'],sz:3,kind:'golem',boss:1,slam:1,coin:[25,40],re:300},
  volca:{n:'볼카누스',hp:4200,atk:70,spd:2.2,xp:800,b:[800,1200],c:['#2A0E0E','#FF6A1A'],sz:2.7,kind:'hound',boss:1,dash:1,coin:[30,45],re:300},
  fslime:{n:'서리 슬라임',hp:310,atk:42,spd:1.3,xp:34,b:[24,40],c:['#DDF4FF','#5EAEE8'],sz:1.15,kind:'slime'},
  swisp:{n:'눈보라 정령',hp:310,atk:42,spd:1.8,xp:34,b:[24,40],c:['#FFFFFF','#8FC8F0'],sz:1,kind:'wisp'},
  fwolf:{n:'서리 늑대',hp:680,atk:64,spd:2.4,xp:110,b:[90,140],c:['#E6F0FA','#5EAEE8'],sz:1.35,kind:'hound',mini:1,dash:1},
  cryos:{n:'크라이오스',hp:5000,atk:82,spd:.9,xp:1000,b:[900,1300],c:['#CFEAFF','#3A8FE0'],sz:3.1,kind:'golem',boss:1,slam:1,coin:[35,50],re:300},
  simp:{n:'스파크 임프',hp:390,atk:52,spd:2.3,xp:44,b:[30,50],c:['#B48CFF','#3A1A6A'],sz:1,kind:'imp'},
  vskel:{n:'폭풍 기사',hp:390,atk:52,spd:1.6,xp:44,b:[30,50],c:['#C9CCE8','#7A6AD8'],sz:1.1,kind:'skel'},
  sgolem:{n:'폭풍 골렘',hp:850,atk:78,spd:1,xp:140,b:[110,170],c:['#6A6E9A','#FFE45A'],sz:1.4,kind:'golem',mini:1,slam:1},
  voltr:{n:'볼트론 오메가',hp:6200,atk:95,spd:1.1,xp:1300,b:[1100,1600],c:['#4A4E7A','#FFE45A'],sz:3.2,kind:'golem',boss:1,slam:1,dash:1,coin:[40,60],re:300},
  gob:{n:'보물 고블린',hp:600,atk:0,spd:3.2,xp:120,b:[200,300],c:['#FFD54A','#6A4A10'],sz:.9,kind:'imp',coin:[20,35]}
});
Object.assign(CB_MOB,{pslime:[220,26,5],rmush:[160,24,15],pebble:[160,24,15],rgolem:[380,38,15],monol:[3200,55,35],volca:[4200,70,45],fslime:[310,42,28],swisp:[310,42,28],fwolf:[680,64,28],cryos:[5000,82,55],
  simp:[390,52,35],vskel:[390,52,35],sgolem:[850,78,35],voltr:[6200,95,65],gob:[600,0,10]});
Object.assign(CB_WP,{monol:{f:.55,boss:1,n:'가슴 대지 핵'},volca:{f:-.6,boss:1,n:'등 뒤 용암 갈기'},cryos:{f:0,boss:1,n:'정수리 얼음 결정'},voltr:{f:.55,boss:1,n:'가슴 축전 코어'}});
['volca'].forEach(k=>CB_FIRE_MOB.add(k));
const DK_POOL={plain:[['slime',5],['bslime',3],['pslime',1]],earth:[['rmush',4],['pebble',4],['rgolem',1]],fire:[['imp',4],['mslime',3],['skel',1]],ice:[['fslime',4],['swisp',3],['fwolf',1]],bolt:[['simp',4],['vskel',3],['sgolem',1]]};
const DK_BOSS={earth:'monol',fire:'volca',ice:'cryos',bolt:'voltr'};
DG.dkoa={n:'대륙 디코아',e:'DKOA CONTINENT',lv:1,R:DK_R,col:['#7CC8FF','#6A3FD8'],bg:['#5FC0E8','#2E86C0'],dk:1,tile:{g:['#9BE08F','#8DD683']},mobs:[],boss:[],deco:[],holes:'pool'};

/* ── 지형 (v29.4 초대형 대륙: 반지름 100 · 소셜 아일랜드의 약 34배) ── */
const dkN=(x,y,s)=>{ const xi=Math.floor(x), yi=Math.floor(y), fx=x-xi, fy=y-yi; const a=wHash(xi,yi,s), b=wHash(xi+1,yi,s), c=wHash(xi,yi+1,s), d=wHash(xi+1,yi+1,s); const u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; };
const dkF=(x,y,s)=>(dkN(x,y,s)*.55+dkN(x*2.1,y*2.1,s+7)*.3+dkN(x*4.3,y*4.3,s+13)*.15);
const dkRot=(v,a)=>[v[0]*Math.cos(a)-v[1]*Math.sin(a),v[0]*Math.sin(a)+v[1]*Math.cos(a)];
const dkP=(rg,r,a)=>{ const A=DK_AX[rg]; const n=Math.hypot(A[0],A[1]); const v=dkRot([A[0]/n,A[1]/n],a||0); return [Math.round(v[0]*r),Math.round(v[1]*r)]; };
/* 구역 가중치: 경계가 칼같이 갈리지 않고 섞여요 (심리스) */
const DK_SC={bolt:45,earth:135,ice:225,fire:315};
function dkWts(x,y){ const r=Math.hypot(x,y); const rp=25+dkN(x*.05,y*.05,91)*10; let wp=r<rp-7?1:r>rp+7?0:1-(r-(rp-7))/14; wp=wp*wp*(3-2*wp);
  const deg=((Math.atan2(y,x)*180/Math.PI)+360+(dkN(x*.035,y*.035,93)-.5)*40)%360; const W={}; let tot=0;
  for(const k in DK_SC){ let d=Math.abs(deg-DK_SC[k]); if(d>180) d=360-d; const w=Math.max(0,1-d/62); W[k]=w*w; tot+=W[k]; }
  for(const k in W) W[k]=W[k]/(tot||1)*(1-wp); W.plain=wp; return W; }
function dkRegion(x,y){ const W=dkWts(x,y); let b='plain', bw=-1; for(const k in W) if(W[k]>bw){ bw=W[k]; b=k; } return b; }
function dkBuild(){
  const T=new Map(), blk=new Set(), obs=[], gim=[], WT=new Map(); const K=(x,y)=>x+','+y; const R=DK_R;
  const H=(x,y)=>{ const t=T.get(K(x,y)); return t?t.h:-1; };
  const [vx,vy]=dkP('fire',Math.round(R*.64));
  /* 1) 7단 고저차: 구역별 높이를 섞은 뒤 계단으로 나눠요 (0 바다 · 1 계곡/해변 · 2 평원 · 3~5 계단 절벽 · 6~7 봉우리/전망) */
  const hOf=(x,y,W)=>{ let h=0;
    if(W.plain>.01) h+=W.plain*(2.25+(dkF(x*.05,y*.05,11)-.5)*1.5+Math.max(0,dkF(x*.13,y*.13,12)-.72)*5);
    if(W.earth>.01){ const v=dkF(x*.042,y*.042,31); h+=W.earth*(1.6+Math.min(1,Math.max(0,(v-.25)*2.3))*4.3); }
    if(W.fire>.01){ const dc=Math.hypot(x-vx,y-vy); h+=W.fire*(2.1+Math.pow(Math.max(0,1-dc/(R*.36)),1.25)*5.6+(dkF(x*.08,y*.08,51)-.5)*1.2); }
    if(W.ice>.01){ const v=dkF(x*.048,y*.048,61); h+=W.ice*(2+Math.min(1,Math.max(0,(v-.3)*2))*3.2+(dkF(x*.15,y*.15,62)>.78?1:0)); }
    if(W.bolt>.01){ const m=dkF(x*.085,y*.085,71); h+=W.bolt*(2.3+(m>.6?1.6:0)+(m>.7?1.3:0)+(dkF(x*.04,y*.04,72)-.5)*1.2); }
    return h; };
  for(let x=-R-2;x<=R+2;x++) for(let y=-R-2;y<=R+2;y++){
    const d=Math.hypot(x,y*1.04)+(dkF(x*.045,y*.045,3)-.5)*14; if(d>R) continue;
    const W=dkWts(x,y); let rg='plain', bw=-1; for(const k in W) if(W[k]>bw){ bw=W[k]; rg=k; }
    let h=Math.max(1,Math.min(7,Math.round(hOf(x,y,W)))); const n2=dkF(x*.11,y*.11,21); let t=n2>({plain:.8,earth:.7,fire:.72,ice:.68,bolt:.62})[rg]?'b':'a'; let wat=false, lava=false;
    const r0=Math.hypot(x,y);
    if(W.plain>.5&&r0>8&&Math.hypot(x,y-5)>7){ const rv=Math.abs(Math.sin(x*.066+Math.cos(y*.042)*1.6)*15-y*.25); if(rv<1.1) wat=true; else if(dkF(x*.09,y*.09,14)<.19&&r0>13) wat=true; }
    if(W.earth>.5&&d>30){ const cv=Math.abs(dkN(x*.055,y*.055,41)-.5); if(cv<.028) wat=true; else if(cv<.08) h=1; }
    if(W.fire>.45){ const dc=Math.hypot(x-vx,y-vy), ang=Math.atan2(y-vy,x-vx); if(dc<5) lava=true; else if(dc<R*.38&&dc>8&&Math.abs(Math.sin(ang*3+dkN(x*.06,y*.06,51)*2))<.075) lava=true; }
    if(W.ice>.55&&d>30&&dkF(x*.07,y*.07,63)<.27) wat=true;
    if(W.bolt>.55&&d>30&&dkF(x*.11,y*.11,73)<.21) wat=true;
    if(d>R-3.5){ h=Math.min(h,1); t='s'; if(d>R-1.4) wat=true; lava=false; }
    if(wat||lava){ WT.set(K(x,y),{x,y,rg,lava:lava||(rg==='fire'&&!wat)}); continue; }
    T.set(K(x,y),{x,y,h,t,rg});
  }
  /* 뾰족한 한 칸 · 구덩이 다듬기 (움직임이 자연스럽게) */
  for(const t of T.values()){ const nb=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>H(t.x+dx,t.y+dy)).filter(v=>v>0); if(nb.length<4) continue; const mx=Math.max(...nb), mn=Math.min(...nb); if(t.h>=mx+2) t.h=mx+1; else if(t.h<=mn-2) t.h=mn-1; }
  /* 평원에 작은 언덕 · 바위 둔덕 (넓은 빈 평지 금지) */
  for(const t of T.values()){ if(t.rg!=='plain'||t.t==='s') continue; if(dkF(t.x*.21,t.y*.21,15)>.74&&Math.hypot(t.x,t.y-5)>8) t.h=Math.min(7,t.h+1); }
  /* v29.7 절벽 고원(메사): 구역마다 세 곳 · 3단 깎아지른 절벽 · 위엔 보물 · 폭포가 떨어져요 */
  const mesas=[]; DK_ORDER.forEach((rg,ri)=>[[.5,-.28],[.74,.32],[.88,-.82]].forEach(([r,a],j)=>{ const [mx,my]=dkP(rg,Math.round(R*r),a); const mr=8+wHash(mx,my,41)*6; let top=0;
    for(let x=Math.floor(mx-mr-4);x<=mx+mr+4;x++) for(let y=Math.floor(my-mr-4);y<=my+mr+4;y++){ const t=T.get(K(x,y)); if(!t) continue; const ed=mr+(dkF(x*.18,y*.18,44+ri)-.5)*7; const d=Math.hypot(x-mx,y-my); if(d>ed) continue; t.h=Math.min(7,Math.max(t.h,4)+(d<ed-2?3:2)); t.cl=1; if(t.t==='s') t.t='a'; top=Math.max(top,t.h); }
    mesas.push({i:ri*3+j,x:mx,y:my,r:mr,rg,top,ramp:j!==1}); }));
  const flat=(cx,cy,r,h,t)=>{ for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++) for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++){ if(Math.hypot(x-cx,y-cy)>r) continue; const k=K(x,y); WT.delete(k); const o=T.get(k); T.set(k,{x,y,h,t:t||(o?o.t:'a'),rg:o?o.rg:dkRegion(x,y)}); } };
  /* 길: 높이를 한 칸씩만 바꾸며 이어요 */
  const road=(ax,ay,bx,by,w)=>{ const n=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)*1.5)); const h0=Math.max(1,H(ax,ay)), h1=Math.max(1,H(bx,by)); let prev=h0;
    for(let i=0;i<=n;i++){ const t=i/n; const x=Math.round(ax+(bx-ax)*t), y=Math.round(ay+(by-ay)*t); let hh=Math.round(h0+(h1-h0)*t); hh=Math.max(prev-1,Math.min(prev+1,hh)); prev=hh;
      for(let ox=-w;ox<=w;ox++) for(let oy=-w;oy<=w;oy++){ if(Math.hypot(ox,oy)>w+.2) continue; const X=x+ox, Y=y+oy, k=K(X,Y); const o=T.get(k); if(o&&o.lock) continue; WT.delete(k); T.set(k,{x:X,y:Y,h:hh,t:'p',rg:o?o.rg:dkRegion(X,Y)}); blk.delete(k); } } };
  const spawn=[0,5]; flat(0,5,4.5,2,'p');
  /* 2) 관심 지점 */
  const towers=[[-16,-15],[18,16],...DK_ORDER.flatMap(rg=>[dkP(rg,R*.44,.42),dkP(rg,R*.6,-.4),dkP(rg,R*.74,.18),dkP(rg,R*.88,-.22)]),[-34,30],[36,-30],...DK_ORDER.flatMap(rg=>[dkP(rg,R*.3,.85),dkP(rg,R*.52,.8),dkP(rg,R*.67,-.75),dkP(rg,R*.8,.62),dkP(rg,R*.95,.02)])].map(([x,y],i)=>({i,x,y}));
  const setl=[...DK_ORDER.map((rg,i)=>{ const [x,y]=dkP(rg,Math.round(R*.4),-.15); return {i,rg,x,y}; }),...DK_ORDER.map((rg,i)=>{ const [x,y]=dkP(rg,Math.round(R*.7),.55); return {i:4+i,rg,x,y,out:1}; })];
  const guard=DK_ORDER.map((rg,i)=>{ const [x,y]=dkP(rg,Math.round(rg==='fire'?R*.73:R*.8),.08); return {i,rg,x,y,t:DK_BOSS[rg]}; });
  /* 지하 사당 입구 10곳 (필드엔 빛나는 석문만 있어요) */
  const shr=[{rg:'plain',x:-21,y:11},{rg:'plain',x:17,y:-18},...DK_ORDER.flatMap(rg=>[dkP(rg,R*.52,-.55),dkP(rg,R*.82,.5)].map(([x,y])=>({rg,x,y})))].map((o,i)=>({...o,i,id:'u'+i,k:SH_ORDER[i]}));
  setl.forEach(S=>flat(S.x,S.y,6,Math.max(2,H(S.x,S.y)),'p'));
  guard.forEach(G=>flat(G.x,G.y,7,G.rg==='fire'?4:G.rg==='ice'?4:3,'c'));
  shr.forEach(S=>{ const hb=Math.max(2,Math.min(5,H(S.x,S.y)>0?H(S.x,S.y):2)); flat(S.x,S.y,3.6,hb,'c'); S.h=hb; });
  DK_ORDER.forEach((rg,i)=>{ road(spawn[0],spawn[1],setl[i].x,setl[i].y,1); road(setl[i].x,setl[i].y,guard[i].x,guard[i].y,1); road(setl[i].x,setl[i].y,setl[4+i].x,setl[4+i].y,1); });
  /* 전망대: 나선 계단 (2 → 6) + 글라이더 전용 부유 바위 */
  const ring=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
  const floatRock=(fx,fy,h,r)=>{ for(let ox=-r;ox<=r;ox++) for(let oy=-r;oy<=r;oy++){ if(Math.abs(ox)+Math.abs(oy)>r) continue; const k=K(fx+ox,fy+oy); const o=T.get(k); if(o&&o.lock) continue; WT.delete(k); T.set(k,{x:fx+ox,y:fy+oy,h,t:'f',rg:dkRegion(fx,fy),lock:1,fl:o?o.h:0}); } };
  towers.forEach(tw=>{ flat(tw.x,tw.y,3.4,2,'p'); const hs=[3,3,4,4,5,5,5,5]; ring.forEach(([dx,dy],j)=>{ const k=K(tw.x+dx,tw.y+dy); T.set(k,{x:tw.x+dx,y:tw.y+dy,h:hs[j],t:'t',rg:dkRegion(tw.x,tw.y),lock:1}); }); T.set(K(tw.x,tw.y),{x:tw.x,y:tw.y,h:6,t:'t',rg:dkRegion(tw.x,tw.y),lock:1}); tw.h=6;
    const a=wHash(tw.x,tw.y,5)*6.28; const fx=Math.round(tw.x+Math.cos(a)*8), fy=Math.round(tw.y+Math.sin(a)*8); floatRock(fx,fy,5,1); tw.fl=[fx,fy]; });
  towers.forEach(tw=>road(spawn[0],spawn[1],Math.round(tw.x+2),Math.round(tw.y),0));
  /* 부유 바위 군도: 구역마다 두 곳 · 별 발판이나 전망대에서 활공해서 가요 */
  const isles=[]; DK_ORDER.forEach(rg=>[[.62,.95],[.66,-.95],[.42,.55],[.82,-.62],[.9,.78],[.55,-.3]].forEach(([r,a])=>{ const [x,y]=dkP(rg,Math.round(R*r),a); const L=[[0,0,7,2],[5,-3,6,1],[-4,4,6,1],[2,6,5,1]]; L.forEach(([dx,dy,h,rr])=>floatRock(x+dx,y+dy,h,rr)); isles.push({x,y,rg}); }));
  /* 사당 입구: 석문 + 승강기 발판 */
  shr.forEach(S=>{ const dir=Math.abs(S.x)>Math.abs(S.y)?[-Math.sign(S.x)||1,0]:[0,-Math.sign(S.y)||1]; S.dir=dir; const t0=T.get(K(S.x,S.y)); if(t0){ t0.t='g'; t0.lock=1; }
    const px=[-dir[1],dir[0]]; [[px[0],px[1]],[-px[0],-px[1]]].forEach(([dx,dy])=>{ blk.add(K(S.x+dx,S.y+dy)); }); S.e=[S.x+dir[0]*3,S.y+dir[1]*3]; gim.push({k:'shg',x:S.x,y:S.y,sh:S.id,shk:S.k,rg:S.rg,dir}); });
  shr.forEach(S=>{ const s0=S.rg==='plain'?{x:spawn[0],y:spawn[1]}:setl.find(x=>x.rg===S.rg); road(S.e[0],S.e[1],s0.x,s0.y,0); });
  /* 정착지 · 수호자 둥지 장식 */
  setl.forEach(S=>{ [[-3,-2,'house'],[3,-2,'house'],[-3,3,'tent'],[3,3,'hut'],[0,-3,'fire'],[2,0,'crate'],[-2,1,'barrel'],[-4,0,'lantern'],[4,1,'crate']].forEach(([dx,dy,t])=>{ obs.push({x:S.x+dx,y:S.y+dy,t,set:S.i}); if(t!=='fire') blk.add(K(S.x+dx,S.y+dy)); }); S.fire=[S.x,S.y-3]; });
  /* 필드 보물 퍼즐: 구역마다 3곳 */
  DK_ORDER.forEach((rg,ri)=>[[.56,1.05],[.86,-.85],[.7,-1.05],[.36,.62],[.47,-1.18],[.62,.12],[.78,.92],[.92,-.45],[.97,.66]].forEach(([r,a],j)=>{ const [x,y]=dkP(rg,Math.round(R*r),a); const hb=Math.max(2,H(x,y)>0?H(x,y):2); flat(x,y,2.6,hb,'c'); const id='t'+ri+j; const c={k:'chest',x,y,id,tier:'gold',grp:id}; gim.push(c); blk.add(K(x,y));
    const around=[[1,0],[-1,0],[0,1],[0,-1]]; const kind=rg==='earth'?'crack':rg==='ice'?'icewall':null;
    if(kind) around.forEach(([dx,dy])=>{ gim.push({k:kind,x:x+dx,y:y+dy,grp:id,hp:3}); blk.add(K(x+dx,y+dy)); });
    else { around.forEach(([dx,dy])=>{ gim.push({k:'door',x:x+dx,y:y+dy,grp:id,vault:1}); blk.add(K(x+dx,y+dy)); }); [[-2,-2],[2,2]].forEach(([dx,dy])=>gim.push({k:rg==='fire'?'torch':'totem',x:x+dx,y:y+dy,grp:id,hh:hb})); [[-2,-2],[2,2]].forEach(([dx,dy])=>blk.add(K(x+dx,y+dy))); }
    road(x+3,y,setl[ri].x,setl[ri].y,0); }));
  /* 화산 상승 기류 풀숲 */
  for(let i=0;i<54;i++){ const [x,y]=dkP('fire',Math.round(R*.3+i*2.1),(wHash(i,3,7)-.5)*1.1); const k=K(x,y); const t=T.get(k); if(t&&!blk.has(k)&&!t.lock) gim.push({k:'grass',x,y,grp:'f'+i}); }
  /* 부유 바위 위 보물 */
  towers.forEach((tw,i)=>{ const [fx,fy]=tw.fl; gim.push({k:'chest',x:fx,y:fy,id:'f'+i,tier:i%3===0?'gold':'silver',hh:5}); blk.add(K(fx,fy)); });
  isles.forEach((I,i)=>{ gim.push({k:'chest',x:I.x,y:I.y,id:'fi'+i,tier:'gold',hh:7}); blk.add(K(I.x,I.y)); });
  /* 폭풍 유적: 무너진 성벽 조각 · 협곡: 돌기둥 */
  for(let i=0;i<180;i++){ const a=(wHash(i,11,3)-.5)*1.5, r=R*(.3+wHash(i,12,3)*.6); const [x,y]=dkP('bolt',Math.round(r),a); const horiz=wHash(i,13,3)>.5; const n=2+Math.floor(wHash(i,14,3)*3);
    for(let j=0;j<n;j++){ const X=x+(horiz?j:0), Y=y+(horiz?0:j), k=K(X,Y); const t=T.get(k); if(!t||t.lock||t.t==='p'||t.t==='c'||blk.has(k)) continue; obs.push({x:X,y:Y,t:'dkwall',rg:'bolt',ruin:1}); blk.add(k); } }
  /* 장식: 숲 · 바위 군락은 뭉쳐서 (길은 막지 않게) · 낮은 풀/조약돌은 청크를 열 때 만들어요 */
  const DECO={plain:['tree','pine','bush','flower','rock','tree'],earth:['rock','pine','bush','rock'],fire:['obsid','spike','fire','bones'],ice:['pine','snowman','rock','crystal','pine'],bolt:['crystal','rock','lantern','bush']};
  for(const t of T.values()){ if(t.lock||t.t==='p'||t.t==='c'||t.t==='t'||t.t==='f'||t.t==='g') continue; const k=K(t.x,t.y); if(blk.has(k)) continue; if(Math.hypot(t.x-spawn[0],t.y-spawn[1])<6) continue; const hh=wHash(t.x,t.y,77);
    const grove=wHash(Math.floor((t.x+300)/7),Math.floor((t.y+300)/7),91)>.6; const thr=grove?.8:.95;
    if(hh>thr){ const L=DECO[t.rg]; const o=L[Math.floor(wHash(t.x,t.y,78)*L.length)]; obs.push({x:t.x,y:t.y,t:o}); if(o!=='flower'&&o!=='bones') blk.add(k); } }
  /* 중앙 하얀 첨탑 · 박사 아울 · 깨진 석판 4종 */
  flat(0,-2,3.2,2,'c'); for(let dx=-1;dx<=1;dx++) for(let dy=-3;dy<=-1;dy++) blk.add(K(dx,dy)); const spire={x:0,y:-2}; const owl={x:4,y:6}; blk.add(K(owl.x,owl.y));
  const tabs=guard.map((G,i)=>{ let tx=G.x+(G.x>0?-8:8), ty=G.y+(G.y>0?-8:8); flat(tx,ty,1.6,Math.max(2,H(tx,ty)>0?H(tx,ty):2),'c'); return {i,x:tx,y:ty}; });
  /* 별 발판: 밟으면 하늘 높이 튀어 올라 글라이더가 펴져요 (부유 군도 아래엔 꼭 하나) */
  for(const t of T.values()){ if(t.h<2||t.lock||blk.has(K(t.x,t.y))||Math.hypot(t.x-spawn[0],t.y-spawn[1])<8) continue; if(wHash(t.x*7+3,t.y*11-5,97)>.9984) gim.push({k:'starpad',x:t.x,y:t.y}); }
  isles.forEach(I=>{ for(let r=8;r<16;r++){ const a=wHash(I.x,I.y,9)*6.28; const x=Math.round(I.x+Math.cos(a)*r), y=Math.round(I.y+Math.sin(a)*r); const t=T.get(K(x,y)); if(t&&!t.lock&&!blk.has(K(x,y))&&t.h>=2){ gim.push({k:'starpad',x,y}); I.pad=[x,y]; break; } } });
  /* 메사 꼭대기 보물 · 오르막(두 곳은 경사로, 한 곳은 글라이더로만) · 폭포 + 웅덩이 */
  { const oK=new Set(obs.map(o=>K(o.x,o.y)));
    mesas.forEach(m=>{ const tt=T.get(K(m.x,m.y)); if(!tt) return; tt.t='c'; const hTop=tt.h; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[0,0]]){ const o=T.get(K(m.x+dx,m.y+dy)); if(o){ o.h=hTop; o.t='c'; o.cl=1; } }
      gim.push({k:'chest',x:m.x,y:m.y,id:'m'+m.i,tier:'gold',hh:hTop}); blk.add(K(m.x,m.y));
      if(m.ramp){ const a=wHash(m.x,m.y,7)*6.28; const sx=Math.round(m.x+Math.cos(a)*(m.r+7)), sy=Math.round(m.y+Math.sin(a)*(m.r+7)); if(T.has(K(sx,sy))) road(sx,sy,m.x+1,m.y,0); m.e=[sx,sy]; }
      else { for(let r=m.r+3;r<m.r+10;r++){ const a=wHash(m.x,m.y,8)*6.28+r*.3; const x=Math.round(m.x+Math.cos(a)*r), y=Math.round(m.y+Math.sin(a)*r); const t=T.get(K(x,y)); if(t&&!t.lock&&!t.cl&&!blk.has(K(x,y))&&t.h>=2){ gim.push({k:'starpad',x,y}); m.pad=[x,y]; break; } } }
      let nf=0; for(let ang=0;ang<6.28&&nf<2;ang+=.21){ const a=ang+wHash(m.i,3,5)*6.28; const ex=Math.round(m.x+Math.cos(a)*m.r), ey=Math.round(m.y+Math.sin(a)*m.r);
        for(const [dx,dy,f] of [[1,0,'f'],[0,1,'l']]){ const t=T.get(K(ex,ey)), b=T.get(K(ex+dx,ey+dy)); if(!t||!b||!t.cl||b.cl||t.lock||b.lock||b.t==='p'||b.t==='c'||t.h-b.h<3) continue; const bk=K(ex+dx,ey+dy); if(blk.has(bk)||oK.has(bk)) continue;
          t.wf=f; T.delete(bk); WT.set(bk,{x:ex+dx,y:ey+dy,rg:b.rg,fall:1}); [[dx,dy]].forEach(([qx,qy])=>{ const k2=K(ex+dx*2+qy,ey+dy*2+qx), t2=T.get(k2); if(t2&&!t2.lock&&!t2.cl&&t2.t!=='p'&&!blk.has(k2)&&!oK.has(k2)&&t2.h<=b.h+1){ T.delete(k2); WT.set(k2,{x:t2.x,y:t2.y,rg:b.rg,fall:1}); } }); nf++; ang+=1.2; break; } } }); }
  gim.forEach((g0,i)=>{ g0.id=g0.id||('g'+i); g0.h=g0.hh!=null?g0.hh:H(g0.x,g0.y); });
  /* 걸어서 못 가는 곳이 없도록: 스폰에서 BFS → 막힌 핵심 지점은 길을 깔아요 */
  const reach=()=>{ const seen=new Set([K(spawn[0],spawn[1])]); const q=[spawn]; let h0=0; while(h0<q.length){ const [x,y]=q[h0++]; const hc=H(x,y); for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, ny=y+dy, k=K(nx,ny); if(seen.has(k)||blk.has(k)) continue; const hn=H(nx,ny); if(hn<1||hn>hc+1||hn<hc-1) continue; seen.add(k); q.push([nx,ny]); } } return seen; };
  let S0=reach(); const must=[...tabs.map(t=>[t.x+1,t.y]),...guard.map(g=>[g.x,g.y]),...towers.map(t=>[t.x+2,t.y]),...shr.map(s=>s.e),...setl.map(s=>[s.x,s.y+2]),...mesas.filter(m=>m.e).map(m=>m.e),...isles.filter(I=>I.pad).map(I=>I.pad)];
  for(const [x,y] of must){ if(S0.has(K(x,y))) continue; let best=null, bd=1e9; for(const k of S0){ const i=k.indexOf(','); const a=+k.slice(0,i), b=+k.slice(i+1); const d=Math.hypot(a-x,b-y); if(d<bd){ bd=d; best=[a,b]; } } if(best){ road(best[0],best[1],x,y,0); S0=reach(); } }
  /* 청크 색인: 보이는 곳만 그려요 */
  const och=new Map(); const oset=new Set(); for(const o of obs){ const ck=(o.x>>4)+','+(o.y>>4); let L=och.get(ck); if(!L) och.set(ck,L=[]); L.push(o); oset.add(K(o.x,o.y)); }
  const W2=[...WT.values()];
  return {T,blk,obs,och,oset,dch:new Map(),kind:'dkoa',D:DG.dkoa,H:[],gates:[],dk:1,WT,water:W2,spawn,towers,setl,guard,shr,gim,spire,owl,tabs,isles,mesas};
}
/* 청크를 처음 볼 때 만드는 세부 장식 (밟고 지나갈 수 있는 풀 · 조약돌 · 꽃 · 버섯) */
const DK_GD={plain:['tuft','tuft','flower','pebble','tuft'],earth:['pebble','tuftD','pebble','tuftD'],fire:['ember','pebbleF','tuftF','ember'],ice:['tuftI','pebbleI','tuftI'],bolt:['tuft','pebble','spark2','tuft']};
function dkDetail(M,cx,cy){ const ck=cx+','+cy; let L=M.dch.get(ck); if(L) return L; L=[];
  for(let x=cx*16;x<cx*16+16;x++) for(let y=cy*16;y<cy*16+16;y++){ const k=x+','+y; const t=M.T.get(k); if(!t||t.u||t.lock||t.t==='p'||t.t==='c'||t.t==='t'||t.t==='g'||M.blk.has(k)||M.oset.has(k)) continue;
    const hh=wHash(x,y,79); if(hh<.2){ const G2=DK_GD[t.rg]||DK_GD.plain; L.push({x,y,t:G2[Math.floor(wHash(x,y,80)*G2.length)],walk:1}); } }
  M.dch.set(ck,L); return L; }
/* 화면 근처 청크의 장식만 돌아요 */
function dkObsEach(s,f){ const M=s.M; const z=s.cam.z; const rT=(s.vw/(WCF.TW*z)+s.vh/(WCF.TH*z))*.75+6; const r=Math.ceil(rT/16); const cx=Math.floor(s.cam.x/16), cy=Math.floor(s.cam.y/16);
  for(let dx=-r;dx<=r;dx++) for(let dy=-r;dy<=r;dy++){ const a=cx+dx, b=cy+dy; const L=M.och.get(a+','+b); if(L) for(const o of L) f(o); if(!s.inSh) for(const o of dkDetail(M,a,b)) f(o); } }

/* ── 높이 · 이동 ── */
const dkH=(M,x,y)=>{ const t=M.T.get(Math.round(x)+','+Math.round(y)); return t?t.h:0; };
/* v29.4 한 칸 높이차는 칸 가장자리에서 부드럽게 이어 걸어요 */
const dkHs=(M,x,y)=>{ const rx=Math.round(x), ry=Math.round(y); const h0=dkH(M,rx,ry); const fx=x-rx, fy=y-ry; let h=h0; const hx=M.T.get((rx+(fx>0?1:-1))+','+ry), hy=M.T.get(rx+','+(ry+(fy>0?1:-1)));
  const ex=Math.max(0,Math.abs(fx)-.2)/.3, ey=Math.max(0,Math.abs(fy)-.2)/.3; if(hx&&Math.abs(hx.h-h0)===1) h+=(hx.h-h0)*.5*ex*ex; if(hy&&Math.abs(hy.h-h0)===1) h+=(hy.h-h0)*.5*ey*ey; return h; };
/* 걸어서: 한 칸 오르기 · 몇 칸이든 내려가기 / 날 때: 지금 높이보다 낮은 곳만 */
function dkCanGo(s,nx,ny){ const M=s.M, me=s.me; const k=Math.round(nx)+','+Math.round(ny); if(!M.T.has(k)||M.blk.has(k)) return false; const h=M.T.get(k).h;
  if(me.air) return h<=me.z+.35; return h<=dkH(M,me.x,me.y)+1.05; }
const dkMobOK=(M,m,nx,ny)=>{ const k=Math.round(nx)+','+Math.round(ny); if(!M.T.has(k)||M.blk.has(k)) return false; return Math.abs(M.T.get(k).h-dkH(M,m.x,m.y))<=1; };

/* ── 저장 데이터 ── */
/* v29.4 대륙이 넓어져서 지도 안개 · 전망대 · 보물 · 핀은 새로 시작해요 (사당 · 정착지 · 수호자 기록은 그대로) */
const dkOf=r=>{ const d=(r&&r.dk)||{}; const nw=d.v===2; return {v:2,tw:nw?d.tw||{}:{},sh:d.sh||{},g:d.g||{},st:d.st||{},ch:nw?d.ch||{}:{},seen:nw?d.seen||'':'',q:d.q||null,pin:nw?d.pin||null:null,stp:nw?d.stp||[]:[],shb:d.shb||{}}; };
/* v29.4 사당은 10곳 (지하). 예전 필드 사당 16곳 기록은 10곳 기준으로 바꿔서 쳐 줘요 */
const DK_SHT=10;
const dkShU=D=>Object.keys(D.sh||{}).filter(k=>k[0]==='u').length;
const dkShN=D=>{ const K=Object.keys(D.sh||{}); const nu=K.filter(k=>k[0]==='u').length; return Math.min(DK_SHT,Math.max(nu,Math.round((K.length-nu)*10/16))); };
const dkStamMax=(D,r)=>{ const n=dkShN(D); return 100+(n>=1?25:0)+(n>=5?25:0)+(r&&typeof lifePerk==='function'?lifePerk(r,'ex'):0); };
const dkHpBonus=D=>{ const n=dkShN(D); return (n>=4?20:0)+(n>=8?20:0); };
const DK_MILE=[[1,'글라이더 최대 스태미나 +25'],[2,'가방 칸 +10'],[4,'최대 체력 +20'],[5,'글라이더 최대 스태미나 +25'],[7,'퀵스왑 프리셋 확장'],[8,'최대 체력 +20'],[9,'활강 속도 +15% · 상승 기류 가속'],[10,'전설 무기 확정 상자 · 프리즘 날개']];
/* 지도 안개: 8×8칸 셀 비트 */
const DK_GN=Math.ceil((DK_R*2+6)/DK_CELL);
const dkCellOf=(x,y)=>{ const cx=Math.floor((x+DK_R+3)/DK_CELL), cy=Math.floor((y+DK_R+3)/DK_CELL); return cx>=0&&cy>=0&&cx<DK_GN&&cy<DK_GN?cy*DK_GN+cx:-1; };
const dkSeenGet=(str,i)=>{ const c=parseInt(str.charAt(i>>2)||'0',16); return !!(c&(1<<(i&3))); };
const dkSeenSet=(str,i)=>{ const n=Math.ceil(DK_GN*DK_GN/4); let a=str.padEnd(n,'0').split(''); const j=i>>2; a[j]=(parseInt(a[j],16)|(1<<(i&3))).toString(16); return a.join(''); };
/* 게임 시간: 실제 1시간 = 디코아 하루 · 3일마다 21시 무렵 10분간 공허의 밤 */
function dkClock(){ const t=Date.now()/1000; const day=Math.floor(t/3600); const hh=((t%3600)/3600)*24; const night=hh>=19.5||hh<5; const voidN=day%3===2&&hh>=20; return {day,hh,night,voidN,txt:String(Math.floor(hh)).padStart(2,'0')+':'+String(Math.floor((hh%1)*60)).padStart(2,'0')}; }
/* 온도: 구역 기본값 + 높이 + 용암 근처 + 밤 */
const DK_TS=[[-2,'혹한','#7CC2FF'],[-1,'추위','#B8E2FF'],[0,'쾌적','#7CF0B5'],[1,'더위','#FFB04A'],[2,'작열','#FF5A3A']];
function dkTemp(s){ const M=s.M, me=s.me; const t=M.T.get(Math.round(me.x)+','+Math.round(me.y)); const rg=t?t.rg:'plain'; if(rg==='und'||s.inSh) return {c:18,st:0,rg:'und'}; const R=DK_RG[rg]; let c=R.temp-Math.max(0,(t?t.h:2)-2)*3.2;
  if(rg==='fire'){ let lava=false; for(let dx=-3;dx<=3&&!lava;dx++) for(let dy=-3;dy<=3;dy++){ const w=M.WT.get((Math.round(me.x)+dx)+','+(Math.round(me.y)+dy)); if(w&&w.lava){ lava=true; break; } } if(lava) c+=14; }
  const ck=dkClock(); if(ck.night) c-=6; if(ck.voidN) c-=3;
  let st=c<=-15?-2:c<=0?-1:c>=50?2:c>=35?1:0; const E=gEquipped(gearOf(s.rpg)); const set=gSetOf(gearOf(s.rpg));
  if(st>0&&E.a&&E.a.el==='fire') st--; if(st<0&&E.a&&E.a.el==='ice') st++;
  const BF=typeof bufOf==='function'?bufOf(s.rpg):null; if(BF){ const n=BF.lv>=2?2:1; if(st>0&&(BF.t==='HEAT'||BF.t==='TEMP')) st=Math.max(0,st-(BF.t==='TEMP'?1:n)); if(st<0&&(BF.t==='COLD'||BF.t==='TEMP')) st=Math.min(0,st+(BF.t==='TEMP'?1:n)); } if(st>0&&set==='fire') st=0; if(st<0&&set==='ice') st=0;
  return {c:Math.round(c),st,rg}; }

/* ── 기믹: 공격이 닿았을 때 ── */
function dkGimHit(s,o,api){ const M=s.M; if(!M||!M.dk) return; const me=s.me, now=performance.now(); const el=o.el; if(s.inSh&&typeof shHit==='function'&&shHit(s,o,api)) return true;
  const inArea=g0=>{ if(g0.done&&g0.k!=='statue') return false; const dz=Math.abs((g0.h||0)-(me.z||0)); if(o.hit!=='proj'&&o.hit!=='aoe'&&dz>1.6) return false;
    const dx=g0.x-me.x, dy=g0.y-me.y, d=Math.hypot(dx,dy);
    if(o.hit==='aoe'&&o.tp) return Math.hypot(g0.x-o.tp[0],g0.y-o.tp[1])<=1.9;
    if(o.hit==='ring') return Math.hypot(g0.x-(me.x+o.D[0]*1.1),g0.y-(me.y+o.D[1]*1.1))<=(o.rad||2)+.6;
    if(d>(o.rng||2)+.7) return false; if(d<.8) return true; const c=(dx*o.D[0]+dy*o.D[1])/d; return c>(o.hit==='proj'||o.hit==='line'?.9:.45); };
  let any=false;
  for(const g0 of M.gim){ if(!inArea(g0)) continue;
    if(g0.k==='crack'&&(el==='earth'||o.shock||o.w==='hammer')){ dkBreak(s,g0,'와르르! 금 간 벽이 무너졌어요'); any=true; }
    else if(g0.k==='icewall'&&el==='fire'){ g0.hp=(g0.hp||3)-1; s.fx.push({k:'cbpop',x:g0.x,y:g0.y,at:now,el:'fire'}); if(g0.hp<=0) dkBreak(s,g0,'얼음벽이 녹았어요'); else api.say('얼음이 녹고 있어요 · '+g0.hp+'번 더'); any=true; }
    else if(g0.k==='torch'&&el==='fire'&&!g0.lit){ g0.lit=1; g0.at=now; if(s.inSh&&typeof shSync==='function') shSync(s,g0.id,{lit:1}); s.fx.push({k:'cbring',x:g0.x,y:g0.y,r:1,at:now,el:'fire'}); wSfx('gem'); dkGroupCheck(s,g0.grp,api); any=true; }
    else if(g0.k==='totem'&&el==='bolt'){ g0.pw=now+(g0.win||5000); if(s.inSh&&typeof shSync==='function') shSync(s,g0.id,{pw:1}); s.fx.push({k:'cbzap',x:me.x,y:me.y,x2:g0.x,y2:g0.y,at:now}); dkGroupCheck(s,g0.grp,api); any=true; }
    else if(g0.k==='grass'&&el==='fire'&&!(g0.burn>now)){ g0.burn=now+6000; s.fx.push({k:'cbring',x:g0.x,y:g0.y,r:1.4,at:now,el:'fire'}); api.say('풀숲이 타올라요 · 위로 올라가는 바람!'); any=true; }
    else if(g0.k==='statue'&&(el==='earth'||o.w==='hammer')){ dkPush(s,g0,o.D,api); any=true; } }
  /* 얼음: 물을 치면 8초 동안 밟을 수 있어요 */
  if(el==='ice'){ const pts=o.hit==='aoe'&&o.tp?[o.tp]:[1,1.8,2.6,3.4].map(r=>[me.x+o.D[0]*Math.min(r,(o.rng||2)+.5),me.y+o.D[1]*Math.min(r,(o.rng||2)+.5)]);
    for(const [px,py] of pts){ for(const [ox,oy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){ const x=Math.round(px)+ox, y=Math.round(py)+oy, k=x+','+y; const w=M.WT.get(k); if(!w||w.lava||M.T.has(k)) continue;
      M.T.set(k,{x,y,h:1,t:'i',rg:w.rg,ice:now+8000}); s.ice=(s.ice||[]).concat([k]); s.tc=null; any=true; } } }
  if(any) s.tc=null; return any; }
function dkBreak(s,g0,msg){ const M=s.M; g0.done=1; g0.at=performance.now(); M.blk.delete(g0.x+','+g0.y); s.fx.push({k:'cbring',x:g0.x,y:g0.y,r:1.4,at:g0.at,el:g0.k==='icewall'?'ice':'earth',big:1}); s.shake=Math.max(s.shake||0,.5); wSfx('slam'); s.say&&s.say(msg); dkGroupCheck(s,g0.grp); }
function dkPush(s,g0,D,api){ const M=s.M; const ax=Math.abs(D[0])>Math.abs(D[1])?[Math.sign(D[0]),0]:[0,Math.sign(D[1])]; const nx=g0.x+ax[0], ny=g0.y+ax[1], k=nx+','+ny;
  if(!M.T.has(k)||M.blk.has(k)||Math.abs(M.T.get(k).h-g0.h)>0) { api&&api.say&&api.say('더 밀 수 없어요'); return; }
  M.blk.delete(g0.x+','+g0.y); g0.x=nx; g0.y=ny; M.blk.add(k); g0.at=performance.now(); wSfx('block'); s.shake=Math.max(s.shake||0,.25); dkGroupCheck(s,g0.grp,api); }
/* 무리 조건 확인 → 문 열기 · 상자 열기 */
function dkGroupCheck(s,grp,api){ if(!grp||grp[0]==='I') return; const M=s.M, now=performance.now(); const L=M.gim.filter(g0=>g0.grp===grp); if(!L.length) return;
  const pads=L.filter(g0=>g0.k==='pad'), torches=L.filter(g0=>g0.k==='torch'), totems=L.filter(g0=>g0.k==='totem'), blocks=L.filter(g0=>g0.k==='crack'||g0.k==='icewall');
  let ok=false; if(pads.length) ok=pads.every(p=>dkPadOn(s,p)); else if(torches.length) ok=torches.every(t=>t.lit); else if(totems.length) ok=totems.every(t=>t.pw>now); else if(blocks.length) ok=blocks.every(b=>b.done); else ok=true; if(s['coOpen_'+grp]) ok=true;
  const doors=L.filter(g0=>g0.k==='door'||(g0.k==='icewall'&&g0.sh!=null&&!blocks.length));
  if(ok){ L.forEach(g0=>{ if(g0.k==='door'&&!g0.done){ g0.done=1; g0.at=now; M.blk.delete(g0.x+','+g0.y); } }); if(!s['open_'+grp]){ s['open_'+grp]=1; wSfx('gate'); if(grp[0]==='s'&&s.others&&s.others.size&&typeof coopEv==='function') coopEv(s,'so',{g:grp}); s.say&&s.say(grp[0]==='s'?'봉인이 풀렸어요! 안쪽 결정으로 가요':grp[0]==='c'?'협동 발판 성공! 협동 보물이 열렸어요':'보물 금고가 열렸어요!'); s.shake=Math.max(s.shake||0,.4); }
    L.forEach(g0=>{ if(g0.k==='chest'&&!g0.free){ g0.free=1; M.blk.delete(g0.x+','+g0.y); } }); }
  else if(pads.length){ L.forEach(g0=>{ if(g0.k==='door'&&g0.done){ g0.done=0; M.blk.add(g0.x+','+g0.y); s['open_'+grp]=0; } }); } }
function dkPadOn(s,p){ const M=s.M; if(Math.round(s.me.x)===p.x&&Math.round(s.me.y)===p.y&&!s.me.air) return true; if(s.others) for(const o of s.others.values()){ if(Math.round(o.x)===p.x&&Math.round(o.y)===p.y) return true; } if(p.coop) return false; if(M.gim.some(g0=>g0.k==='statue'&&g0.x===p.x&&g0.y===p.y)) return true; const T2=s.cb&&s.cb.turret; if(T2&&Math.round(T2.x)===p.x&&Math.round(T2.y)===p.y) return true; return false; }

/* ── 매 프레임 (디코아 전용) ── */
function dkTick(s,dt,now,api){ const M=s.M, me=s.me, cb=s.cb; if(!M||!M.dk) return; const DKs=s.dk; const gh=dkH(M,me.x,me.y);
  /* 글라이더 */
  const GL=s.gl; const updU=s.updraft&&s.updraft.find(u=>u.end>now&&Math.hypot(u.x-me.x,u.y-me.y)<(u.r||1.6)); const upd=!!updU||M.gim.some(g0=>g0.k==='grass'&&g0.burn>now&&Math.hypot(g0.x-me.x,g0.y-me.y)<1.6); const upCap=updU&&updU.cap||5;
  if(!me.air){ if(upd&&!me.dead){ me.air=true; me.glide=true; me.fallFrom=me.z; s.say&&s.say('상승 기류! 글라이더를 펼쳤어요'); }
    else if(me.z>gh+1.4){ me.air=true; me.glide=GL.st>5; me.fallFrom=me.z; if(me.glide) wSfx('swing'); }
    else { const gs=dkHs(M,me.x,me.y); me.z+=(gs-me.z)*Math.min(1,dt*(gs>me.z?10:12)); } }
  if(!me.air&&!me.dead&&now>(s.starCd||0)){ const sp=M.gim.find(g0=>g0.k==='starpad'&&Math.round(me.x)===g0.x&&Math.round(me.y)===g0.y); if(sp){ s.starCd=now+1200; s.starT=now; me.air=true; me.glide=false; me.vz=15; me.fallFrom=me.z; me.path=[]; s.fx.push({k:'cbpop',x:sp.x,y:sp.y,at:now,el:'bolt'}); s.fx.push({k:'cbring',x:sp.x,y:sp.y,r:1.6,at:now,el:'bolt'}); wSfx('lvl'); haptic([10,24,40]); if(!s.starSaid){ s.starSaid=1; s.say&&s.say('별 발판! 높이 올라가면 글라이더가 저절로 펴져요'); } } }
  if(me.air&&s.starT&&!me.glide&&(me.vz||0)<0&&GL.st>5){ me.glide=true; me.fallFrom=me.z; s.starT=0; wSfx('swing'); }
  if(me.air){ if(upd){ me.z=Math.min(me.z+2.5*(dkShN(DKs)>=9?1.3:1)*(upCap>5?1.6:1)*dt,gh+upCap); me.glide=true; GL.air=0; }
    else if(me.glide&&GL.st>0){ me.z-=.6*dt; GL.st=Math.max(0,GL.st-12*dt); if(GL.st<=0){ me.glide=false; s.say&&s.say('스태미나가 다 떨어졌어요!'); } s.glideT=(s.glideT||0)+dt; }
    else { me.vz=(me.vz||0)-18*dt; me.z+=me.vz*dt; }
    if(me.z<=gh){ const drop=(me.fallFrom||gh)-gh; me.z=gh; me.air=false; me.vz=0; GL.cush=now+2000; if(!me.glide&&drop>=3){ const d=Math.round(12*(drop-2)); me.hp=Math.max(1,me.hp-d); s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:'낙하 -'+d,col:'#FF5A5A'}); s.shake=.6; wSfx('hurt'); } me.glide=false; } }
  else if(now>(GL.cush||0)) GL.st=Math.min(GL.max,GL.st+30*dt);
  /* 얼린 물이 녹아요 */
  if(s.ice&&s.ice.length){ const keep=[]; for(const k of s.ice){ const t=M.T.get(k); if(t&&t.ice<=now){ M.T.delete(k); s.tc=null; if(Math.round(me.x)+','+Math.round(me.y)===k&&!me.air){ me.hp=Math.max(1,me.hp-15); me.x=s.lastSafe[0]; me.y=s.lastSafe[1]; s.say&&s.say('얼음이 녹아 물에 빠졌어요!'); } } else if(t) keep.push(k); } s.ice=keep; }
  if(!me.air&&M.T.has(Math.round(me.x)+','+Math.round(me.y))&&!(M.T.get(Math.round(me.x)+','+Math.round(me.y)).ice)) s.lastSafe=[me.x,me.y];
  /* 압력 발판 · 토템 시간 */
  { const cp=M.gim.find(g0=>g0.coop&&g0.k==='pad'&&Math.round(me.x)===g0.x&&Math.round(me.y)===g0.y); const on=cp?cp.grp:null; if(on!==s.coPad){ s.coPad=on; if(on){ s.pingNow&&s.pingNow(); if(!(s.others&&s.others.size)) s.say&&s.say('협동 발판이에요 · 크루와 함께 두 발판을 동시에 밟아요'); } } }
  if(now-(s.padAt||0)>200){ s.padAt=now; const grps=new Set(M.gim.filter(g0=>g0.k==='pad'||g0.k==='totem').map(g0=>g0.grp)); grps.forEach(gp=>dkGroupCheck(s,gp,api)); }
  /* 석상 밀기: 석상 쪽으로 계속 걸으면 한 칸 */
  if(s.joy&&(Math.abs(s.joy[0])>.3||Math.abs(s.joy[1])>.3)&&!me.air){ const [wx,wy]=wJoyDir(s.joy[0],s.joy[1]); const tx=Math.round(me.x+wx*.75), ty=Math.round(me.y+wy*.75); const st=M.gim.find(g0=>g0.k==='statue'&&g0.x===tx&&g0.y===ty);
    if(st){ s.pushT=(s.pushT||0)+dt; if(s.pushT>.45){ s.pushT=0; dkPush(s,st,[wx,wy],api); } } else s.pushT=0; }
  /* 사당 결정 · 보물 · 전망대 · 정착지 */
  const near=(x,y,r)=>Math.hypot(x-me.x,y-me.y)<r;
  for(const g0 of M.gim){ if(g0.k==='core'&&!DKs.sh[g0.sh]&&near(g0.x,g0.y,1.2)&&!me.air) dkPurify(s,g0,api);
    if(g0.k==='chest'&&!DKs.ch[g0.id]&&(g0.free||!M.gim.some(o=>o.grp&&o.grp===g0.grp&&o!==g0&&o.k!=='chest'))&&near(g0.x,g0.y,1.3)&&Math.abs((g0.h||0)-me.z)<1.2){ DKs.ch[g0.id]=1; s.dkDirty=1; if(g0.coop) ssGain(s,2,'협동 보물'); else if(g0.tier==='gold') ssGain(s,1,'디코아 보물'); M.blk.delete(g0.x+','+g0.y); s.drops.push({k:'chest',tier:g0.tier,x:me.x,y:me.y,at:now-700,z:0,label:'디코아 보물'}); } }
  for(const tw of M.towers){ if(!DKs.tw[tw.i]&&Math.round(me.x)===tw.x&&Math.round(me.y)===tw.y&&Math.abs(me.z-6)<.6){ DKs.tw[tw.i]=1; s.dkDirty=1; ssGain(s,1,'전망대'); dkReveal(s,tw.x,tw.y,26); wSfx('clear'); haptic([30,40,80]); s.dkBanner={t:'전망대 '+(tw.i+1)+' 활성화',b:'주변 지도가 밝혀졌어요 · 워프할 수 있어요',k:now}; s.spawnPt=[tw.x+2,tw.y]; } }
  for(const S of M.setl){ if(DKs.st[S.i]) continue; const camp=s.mobs.filter(m=>m.camp===S.i); if(near(S.x,S.y,16)&&!s['camp'+S.i]){ s['camp'+S.i]=1; const P=DK_POOL[S.rg]; for(let j=0;j<6;j++){ const a=j/6*6.28; const x=Math.round(S.x+Math.cos(a)*3.5), y=Math.round(S.y+Math.sin(a)*3.5); if(!M.T.has(x+','+y)||M.blk.has(x+','+y)) continue; const t=j===0?P[2][0]:P[j%2][0]; const m=api.spawn(t,x,y,[S.x,S.y]); m.camp=S.i; m.aggro=true; } s['campT'+S.i]=now; s.dkBanner={t:DK_RG[S.rg].n+' 정착지',b:'몬스터 캠프를 물리치면 마을이 해방돼요',k:now}; }
    if(s['camp'+S.i]&&!s.mobs.some(m=>m.camp===S.i)&&camp.length===0&&s['campT'+S.i]&&now-s['campT'+S.i]>1500&&near(S.x,S.y,18)){ DKs.st[S.i]=1; s.dkDirty=1; wSfx('clear'); haptic([30,40,80]); s.dkBanner={t:'정착지 해방!',b:'무료 회복 · 수리 · 의뢰 게시판 · 워프가 열렸어요',k:now}; s.spawnPt=[S.x,S.y+2]; } }
  /* 해방된 정착지 모닥불: 회복 */
  s.atSetl=null; for(const S of M.setl){ if(DKs.st[S.i]&&near(S.x,S.y,4.5)){ s.atSetl=S; if(me.hp<s.st.hp){ me.hp=Math.min(s.st.hp,me.hp+s.st.hp*.12*dt); } } }
  /* 온도: 3초마다 */
  s.tAcc=(s.tAcc||0)+dt; if(s.tAcc>=1){ s.tAcc=0; s.temp=dkTemp(s); s.tDmg=(s.tDmg||0)+1; if(s.tDmg>=3){ s.tDmg=0; const st=s.temp.st; if(st&&!me.dead){ const d=Math.abs(st)===1?3:8; me.hp=Math.max(1,me.hp-d); s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:(st>0?'열기 ':'한기 ')+'-'+d,col:st>0?'#FF8A4A':'#9CD2FF',sm:1}); } }
    /* 지도 안개 · 구역 이름 */
    const ci=dkCellOf(me.x,me.y); if(ci>=0&&!dkSeenGet(DKs.seen,ci)){ DKs.seen=dkSeenSet(DKs.seen,ci); s.dkDirty=1; }
    const rg=s.temp.rg; if(rg!==s.rgNow){ if(s.rgNow) s.dkBanner={t:DK_RG[rg].n,b:'Tier '+DK_RG[rg].tier+' · 추천 '+DK_RG[rg].eq+' 장비'+(DK_RG[rg].el?' · '+GE_EL[DK_RG[rg].el].n+' 원소 땅':''),k:now,big:1}; s.rgNow=rg; }
    s.trail=(s.trail||[]); const L=s.trail[s.trail.length-1]; if(!L||Math.hypot(L[0]-me.x,L[1]-me.y)>3){ s.trail.push([me.x,me.y]); if(s.trail.length>300) s.trail.shift(); } }
  s.owlNear=Math.hypot(M.owl.x-me.x,M.owl.y-me.y)<2.6;
  for(const tb of M.tabs){ if(!(s.rpg.lore||{})['t'+tb.i]&&Math.hypot(tb.x-me.x,tb.y-me.y)<1.6){ s.rpg.lore={...(s.rpg.lore||{}),['t'+tb.i]:1}; s.dkDirty=1; wSfx('gem'); haptic([20,30,60]); s.dkBanner={t:'깨진 석판 발견',b:CB_LORE.guard[tb.i][2]+'의 기록 · 세계관 도감에서 읽어요',k:now,big:1}; } }
  if(typeof shTick==='function') shTick(s,dt,now,api);
  if(!s.inSh) dkEvents(s,dt,now,api); }
/* 박사 아울 힌트: 다음에 할 일 */
function dkOwlHint(s){ const D=s.dk, M=s.M; const nT=Object.keys(D.tw).length, nS=Object.keys(D.st).length, nH=dkShN(D), nG=Object.keys(D.g).length;
  if(!nT) return '어허, 처음 왔구먼! 저기 보이는 전망대 꼭대기에 올라가 보게. 지도가 밝혀지고 워프도 할 수 있다네.';
  if(!nS) return '구역 입구마다 정착지가 있지. 몬스터 캠프를 물리치면 마을이 해방되고 요리솥과 수리점을 쓸 수 있어.';
  if(nH<4) return '사당은 원소로 푸는 퍼즐이라네. 무게는 석상을, 열기는 불을, 정지는 얼음과 불을, 신호는 번개를 써 보게. 퀵스왑을 잊지 말고!';
  if(nG<1) return '수호자 둥지 근처에 깨진 석판이 있다더군. 먼저 읽어 두면 약점을 알 수 있지. 협곡의 모놀리스 렉스는 가슴의 대지 핵이 약점이야.';
  if(nG<4) return '정화된 수호자는 '+nG+'명… 하얀 첨탑의 홈에 빛이 하나씩 켜지고 있어. 나머지 수호자도 정화해 주게.';
  return '네 개의 홈이 모두 빛나는군… 그런데 다섯 번째 홈은 왜 비어 있을까? 소셜 아일랜드와 너희 섬들에서 무언가 날아오는 날이 올 걸세. 『이음』이라는 말, 기억해 두게.'; }
function dkReveal(s,x,y,r){ const D=s.dk; for(let dx=-r;dx<=r;dx+=DK_CELL/2) for(let dy=-r;dy<=r;dy+=DK_CELL/2){ if(Math.hypot(dx,dy)>r) continue; const ci=dkCellOf(x+dx,y+dy); if(ci>=0) D.seen=dkSeenSet(D.seen,ci); } s.dkDirty=1; }
function dkPurify(s,g0,api){ const D=s.dk, now=performance.now(); D.sh[g0.sh]=1; s.dkDirty=1; ssGain(s,3,'사당 정화'); const n=dkShN(D); const mile=DK_MILE.find(m=>m[0]===n);
  s.fx.push({k:'cbring',x:g0.x,y:g0.y,r:3,at:now,el:g0.rg,big:1}); wSfx('clear'); haptic([30,50,90]); s.shake=.5;
  s.dkBanner={t:(SH_INFO[g0.shk]?SH_INFO[g0.shk].n+' 정화! ':'사당 정화 ')+n+' / '+DK_SHT,b:mile?'정화 보상 · '+mile[1]:'다음 보상까지 '+((DK_MILE.find(m=>m[0]>n)||[DK_SHT])[0]-n)+'곳',k:now,big:1};
  if(n>=2&&!s.rpg.gear.capBk){ s.rpg.gear.capB=(s.rpg.gear.capB||0)+10; s.rpg.gear.capBk=1; }
  if(n>=DK_SHT&&!s.rpg.gear.lgdK){ s.rpg.gear.lgdK=1; const G=s.rpg.gear; const w=s.st.w; const it=gNew(G,w?w.k:'sword',w&&w.el||'fire',3); api.gotGear&&api.gotGear(it); }
  s.st=cbStats(s.rpg); s.gl.max=dkStamMax(D,s.rpg); s.spawnPt=[g0.x,g0.y]; s.drops.push({k:'chest',tier:'gold',x:s.me.x,y:s.me.y,at:now-700,z:0,label:'사당 정화'});
  const mates=s.others?[...s.others.values()].filter(o=>Math.hypot(o.x-g0.x,o.y-g0.y)<9).length:0; if(mates){ s.drops.push({k:'chest',tier:'silver',x:s.me.x+.6,y:s.me.y,at:now-500,z:0,label:'협동 정화 보너스'}); s.dkBanner={...s.dkBanner,b:s.dkBanner.b+' · 협동 보너스 상자 +1'}; } if(typeof shOnClear==='function') shOnClear(s,g0,api); }

/* ── 몬스터 채우기: 플레이어 주변 청크만 ── */
function dkFill(s,api){ const M=s.M, me=s.me, now=performance.now(); const ck=dkClock(); if(s.inSh) return;
  s.mobs.filter(m=>!m.boss&&m.camp==null&&!m.ev&&Math.hypot(m.x-me.x,m.y-me.y)>36).forEach(m=>{ s.mobs.splice(s.mobs.indexOf(m),1); });
  const near=s.mobs.filter(m=>!m.boss&&Math.hypot(m.x-me.x,m.y-me.y)<30).length; let want=Math.max(0,(ck.voidN?16:11)-near);
  for(let i=0;i<want*3&&want>0;i++){ const a=Math.random()*6.28, r=13+Math.random()*14; const x=Math.round(me.x+Math.cos(a)*r), y=Math.round(me.y+Math.sin(a)*r); const t=M.T.get(x+','+y); if(!t||M.blk.has(x+','+y)||t.lock||t.t==='p'||t.t==='c') continue;
    if(M.setl.some(S=>Math.hypot(S.x-x,S.y-y)<7)||Math.hypot(x-M.spawn[0],y-M.spawn[1])<9) continue;
    const P=DK_POOL[t.rg]; const tot=P.reduce((a2,p)=>a2+p[1],0); let q=Math.random()*tot, typ=P[0][0]; for(const [k,w] of P){ q-=w; if(q<0){ typ=k; break; } }
    const m=api.spawn(typ,x,y); if(ck.voidN&&Math.random()<.35){ m.glitch=1; m.mhp=m.hp=Math.round(m.mhp*1.5); } want--; }
  M.guard.forEach(G=>{ const alive=s.mobs.some(m=>m.t===G.t); if(!alive&&!(s.boss[G.t]>now)&&Math.hypot(G.x-me.x,G.y-me.y)<30){ const m=api.spawn(G.t,G.x,G.y,[G.x,G.y]); m.guard=G.i; } }); }

/* ── 돌발 이벤트 (10~15분마다) ── */
function dkEvents(s,dt,now,api){ const E=s.ev; if(!s.evAt) s.evAt=now+(4+Math.random()*3)*60000;
  if(!E&&now>s.evAt&&!s.me.dead&&!s.me.air){ const kinds=['horde','gob','mutant']; const k=kinds[Math.floor(Math.random()*3)]; const me=s.me; const t=s.M.T.get(Math.round(me.x)+','+Math.round(me.y)); const rg=t?t.rg:'plain'; const P=DK_POOL[rg]; const list=[];
    const put=(typ,r)=>{ for(let i=0;i<20;i++){ const a=Math.random()*6.28; const x=Math.round(me.x+Math.cos(a)*r), y=Math.round(me.y+Math.sin(a)*r); if(s.M.T.has(x+','+y)&&!s.M.blk.has(x+','+y)){ const m=api.spawn(typ,x,y); m.ev=1; m.aggro=true; list.push(m); return m; } } return null; };
    if(k==='horde'){ for(let i=0;i<8;i++) put(P[i%2][0],5+Math.random()*3); }
    else if(k==='gob'){ const m=put('gob',6); if(m){ m.flee=1; m.aggro=false; } }
    else { const m=put(P[2][0],6); if(m){ m.mhp=m.hp=Math.round(m.mhp*2); m.glitch=1; } }
    s.ev={k,end:now+(k==='gob'?30000:90000),n:list.length,list}; s.evAt=now+(10+Math.random()*5)*60000; wSfx('roar'); haptic([20,40,20]);
    s.dkBanner={t:k==='horde'?'돌발! 슬라임 대군':k==='gob'?'돌발! 보물 고블린':'돌발! 변이 정예',b:k==='horde'?'90초 안에 모두 물리쳐요':k==='gob'?'30초 안에 잡으면 큰 보상!':'붉게 빛나는 정예를 쓰러뜨려요',k:now,big:1}; }
  if(E){ const left=E.list.filter(m=>s.mobs.includes(m)); if(!left.length){ s.ev=null; s.drops.push({k:'chest',tier:E.k==='horde'?'silver':'gold',x:s.me.x,y:s.me.y,at:now-700,z:0,label:'돌발 이벤트'}); s.dkBanner={t:'돌발 이벤트 성공!',b:'보상 상자가 나왔어요',k:now}; wSfx('clear'); }
    else if(now>E.end){ s.ev=null; left.forEach(m=>{ if(m.t==='gob'){ s.mobs.splice(s.mobs.indexOf(m),1); s.fx.push({k:'poof',x:m.x,y:m.y,at:now,c:'#FFD54A'}); } }); s.dkBanner={t:'돌발 이벤트 실패',b:E.k==='gob'?'고블린이 도망쳤어요…':'시간이 다 됐어요',k:now}; } } }

/* ── 무한 의뢰 (매시간 바뀌어요) ── */
const DK_QT=[['kill','몬스터 처치',n=>n*12+8,'swords'],['crit','약점 치명타',n=>n*10+10,'target'],['ore','광석 줍기',n=>n*2+3,'ore'],['glide','글라이더 활공 (초)',n=>n*10+20,'up2'],['boss','정예 · 보스 처치',n=>1+(n>1?1:0),'crown']];
function dkQuests(si){ const hk=Math.floor(Date.now()/3600000); const out=[]; for(let j=0;j<3;j++){ const h=wHash(hk,si*7+j,99); const T=DK_QT[Math.floor(h*DK_QT.length)]; const lv=Math.floor(wHash(hk,si*7+j,98)*3); out.push({id:hk+'-'+si+'-'+j,k:T[0],n:T[1],need:T[2](lv),ic:T[3],gold:Math.round((T[2](lv)*(T[0]==='boss'?220:T[0]==='glide'?14:T[0]==='ore'?60:24)+100)/10)*10,si}); } return {hk,list:out}; }
function dkQProg(s,k,n){ const Q=s.dk.q; if(!Q||!Q.acc) return; let ch=false; for(const id of Object.keys(Q.acc)){ const q=Q.acc[id]; if(q.k!==k||q.done) continue; q.p=Math.min(q.need,(q.p||0)+n); ch=true; if(q.p>=q.need){ q.done=1; s.qDone=(s.qDone||[]).concat([q]); ssGain(s,1,'정착지 의뢰'); } } if(ch) s.dkDirty=1; }

/* ═════════ 지형 그리기 (보이는 칸만) ═════════ */
function dkDrawTiles(ctx,s,ox,oy,z,vw,vh,MG){ const M=s.M; const HW=WCF.TW/2*z, HH=WCF.TH/2*z, LV=DK_LV*z, BASE=9*z;
  const W0=vw+MG*2, H0=vh+MG*2; const [cx,cy]=[-ox/z,-oy/z]; /* 화면 왼쪽 위의 iso 좌표 */
  const sMin=Math.floor((cy-HH*2/z)/(WCF.TH/2))-2, sMax=Math.ceil((cy+H0/z)/(WCF.TH/2))+Math.ceil(10*DK_LV/(WCF.TH/2))+2;
  const dMin=Math.floor((cx-HW*2/z)/(WCF.TW/2))-2, dMax=Math.ceil((cx+W0/z)/(WCF.TW/2))+2;
  const shade=(hex,k)=>{ const n=parseInt(hex.slice(1),16); let r=(n>>16)&255, g=(n>>8)&255, b=n&255; r=Math.round(r*k); g=Math.round(g*k); b=Math.round(b*k); return 'rgb('+Math.min(255,r)+','+Math.min(255,g)+','+Math.min(255,b)+')'; };
  const tm=performance.now()/1000;
  for(let S=sMin;S<=sMax;S++){ for(let d=dMin;d<=dMax;d++){ if(((S+d)&1)!==0) continue; const x=(S+d)/2, y=(S-d)/2; const k=x+','+y; const T=M.T.get(k);
      const px=(x-y)*HW+ox, py=(x+y)*HH+oy;
      if(!T){ const w=M.WT.get(k); if(w){ const wy=py+LV*.35; ctx.fillStyle=w.lava?(((x+y)&1)?'#FF6A1A':'#F25A12'):w.rg==='ice'?(((x+y)&1)?'#7FC8EA':'#76BFE2'):(((x+y)&1)?'#4FB8E0':'#48B0D8'); ctx.beginPath(); ctx.moveTo(px,wy-HH); ctx.lineTo(px+HW,wy); ctx.lineTo(px,wy+HH); ctx.lineTo(px-HW,wy); ctx.closePath(); ctx.fill();
          if(w.fall){ ctx.strokeStyle='rgba(255,255,255,'+(.5+.3*Math.sin(tm*5+x+y))+')'; ctx.lineWidth=1.4*z; ctx.beginPath(); ctx.ellipse(px,wy,HW*(.45+.15*Math.sin(tm*3+x)),HH*(.45+.15*Math.sin(tm*3+x)),0,0,Math.PI*2); ctx.stroke(); }
          if(w.lava&&wHash(x,y,3)>.6){ ctx.fillStyle='rgba(255,220,120,.35)'; ctx.fillRect(px-2*z,wy-z,4*z,2*z); } else if(!w.lava&&wHash(x,y,4)>.8){ ctx.fillStyle='rgba(255,255,255,.35)'; ctx.fillRect(px-3*z,wy,6*z,1.2*z); } }
        continue; }
      const R=DK_RG[T.rg]||DK_RG.plain; const h=T.h, top=py-h*LV;
      let col; if(T.t==='p') col=T.rg==='fire'?['#7A6660','#73605A']:T.rg==='ice'?['#E3E9F2','#DAE1EC']:['#F0E0BE','#E6D2AA']; else if(T.t==='s') col=T.rg==='fire'?['#4A3A3A','#443434']:['#F4E3B2','#EAD59C']; else if(T.t==='c') col=T.rg==='fire'?['#6E5E6A','#665662']:T.rg==='ice'?['#DCE8F4','#D2E0EE']:T.rg==='bolt'?['#A9AFC7','#9FA5BD']:['#D8CFBC','#CFC5B0'];
      else if(T.t==='t') col=['#C9CED8','#BFC5D0']; else if(T.t==='f') col=T.rg==='ice'?['#EAF4FC','#DDEAF6']:T.rg==='fire'?['#6A5A58','#625250']:['#8FD07A','#86C670']; else if(T.t==='i') col=['#D8F2FF','#C8EAFF']; else if(T.t==='g') col=['#BFC8E8','#B4BEE0'];
      else if(T.u) col=(s.sh&&s.sh.lava!=null&&T.lv&&T.h<=s.sh.lava)?['#FF7A2A','#F2621A']:(SH_TOP[T.t]||SH_TOP.u)(T); else col=R.top[T.t==='b'?1:0];
      const alt=((x+y)&1)?col[0]:col[1];
      const nb=(ax,ay)=>{ const t2=M.T.get(ax+','+ay); return t2?t2.h:(M.WT.has(ax+','+ay)?-.35:-1.2); };
      let hf=nb(x+1,y), hl=nb(x,y+1); const sc=T.t==='t'?'#8E95A6':T.t==='i'?'#9CD2F0':T.u?(T.t==='uw'?'#3A3E5A':'#2A2D44'):R.side;
      if(T.t==='f'){ hf=Math.max(hf,h-1.4); hl=Math.max(hl,h-1.4); const sy=py-(T.fl||0)*LV+(T.fl?0:LV*.35); ctx.fillStyle=T.fl?R.top[0][((x+y)&1)]:'#4FB8E0'; ctx.beginPath(); ctx.moveTo(px,sy-HH); ctx.lineTo(px+HW,sy); ctx.lineTo(px,sy+HH); ctx.lineTo(px-HW,sy); ctx.closePath(); ctx.fill(); ctx.fillStyle='rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(px,sy,HW*.7,HH*.7,0,0,Math.PI*2); ctx.fill(); const base=top+HH+1.4*LV; ctx.fillStyle=shade(R.side2||R.side,.8); ctx.beginPath(); ctx.moveTo(px-HW*.9,base-HH*.9); ctx.lineTo(px+HW*.9,base-HH*.9); ctx.lineTo(px+HW*.1,base+LV*1.8); ctx.lineTo(px-HW*.2,base+LV*1.2); ctx.closePath(); ctx.fill(); }
      if(hf<h){ const H2=(h-hf)*LV; ctx.fillStyle=shade(sc,.82); ctx.beginPath(); ctx.moveTo(px+HW,top); ctx.lineTo(px,top+HH); ctx.lineTo(px,top+HH+H2); ctx.lineTo(px+HW,top+H2); ctx.closePath(); ctx.fill();
        if(h-hf>=2){ ctx.fillStyle='rgba(0,0,0,.1)'; for(let j=1;j<h-hf;j++){ ctx.fillRect(px,top+HH*.5+j*LV,HW,1.2*z); } } }
      if(hl<h){ const H2=(h-hl)*LV; ctx.fillStyle=sc; ctx.beginPath(); ctx.moveTo(px-HW,top); ctx.lineTo(px,top+HH); ctx.lineTo(px,top+HH+H2); ctx.lineTo(px-HW,top+H2); ctx.closePath(); ctx.fill();
        if(h-hl>=2){ ctx.fillStyle='rgba(255,255,255,.08)'; for(let j=1;j<h-hl;j++) ctx.fillRect(px-HW,top+HH*.5+j*LV,HW,1.2*z); } }
      if(T.wf){ const fr=T.wf==='f'; const hb=fr?hf:hl; if(hb<h){ const H2=(h-hb)*LV+LV*.35; const sx=fr?1:-1; ctx.save(); ctx.beginPath(); ctx.moveTo(px+sx*HW*.15,top+HH*.85); ctx.lineTo(px+sx*HW*.85,top+HH*.15); ctx.lineTo(px+sx*HW*.85,top+HH*.15+H2); ctx.lineTo(px+sx*HW*.15,top+HH*.85+H2); ctx.closePath(); ctx.clip();
          const gr=ctx.createLinearGradient(0,top,0,top+H2+HH); gr.addColorStop(0,'rgba(170,230,255,.95)'); gr.addColorStop(1,'rgba(90,190,240,.9)'); ctx.fillStyle=gr; ctx.fillRect(px-HW,top-HH,HW*2,H2+HH*3);
          ctx.fillStyle='rgba(255,255,255,.75)'; for(let i=0;i<7;i++){ const k=((tm*1.6+i/7+wHash(x,y,i)*.3)%1); const lx=px+sx*HW*(.2+i*.09); ctx.fillRect(lx-z,top+HH*.5+k*(H2+HH)-6*z,1.6*z,10*z); } ctx.restore();
          const by=top+HH*.5+H2+HH*.5; ctx.fillStyle='rgba(255,255,255,'+(.55+.25*Math.sin(tm*6+x))+')'; ctx.beginPath(); ctx.ellipse(px+sx*HW*.5,by,HW*.45,HH*.35,0,0,Math.PI*2); ctx.fill(); } }
      ctx.fillStyle=alt; ctx.beginPath(); ctx.moveTo(px,top-HH); ctx.lineTo(px+HW,top); ctx.lineTo(px,top+HH); ctx.lineTo(px-HW,top); ctx.closePath(); ctx.fill();
      if(T.cl&&!T.lock&&wHash(x,y,51)>.86){ ctx.fillStyle='rgba(90,80,70,.18)'; ctx.beginPath(); ctx.ellipse(px+(wHash(x,y,52)-.5)*HW*.8,top+(wHash(x,y,53)-.5)*HH*.8,3.2*z,1.8*z,0,0,Math.PI*2); ctx.fill(); }
      /* 높은 땅 가장자리 하이라이트 */
      if(hf<h||hl<h){ ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.lineWidth=1.2*z; ctx.beginPath(); if(hl<h){ ctx.moveTo(px-HW,top); ctx.lineTo(px,top+HH); } if(hf<h){ ctx.moveTo(px,top+HH); ctx.lineTo(px+HW,top); } ctx.stroke(); }
      if(T.t==='a'&&wHash(x,y,13)>.8){ if(T.rg==='plain'||T.rg==='earth'){ ctx.strokeStyle='rgba(60,140,60,.5)'; ctx.lineWidth=1.2*z; const gx2=px+(wHash(x,y,2)-.5)*HW, gy2=top+(wHash(x,y,3)-.5)*HH; ctx.beginPath(); ctx.moveTo(gx2-2*z,gy2); ctx.lineTo(gx2-1*z,gy2-3*z); ctx.moveTo(gx2,gy2); ctx.lineTo(gx2+.5*z,gy2-4*z); ctx.stroke(); }
        else if(T.rg==='fire'){ ctx.strokeStyle='rgba(255,110,40,.5)'; ctx.lineWidth=1.2*z; const a=wHash(x,y,1)*6; ctx.beginPath(); ctx.moveTo(px-Math.cos(a)*HW*.5,top-Math.sin(a)*HH*.5); ctx.lineTo(px,top+z); ctx.lineTo(px+Math.cos(a+.6)*HW*.45,top+Math.sin(a+.6)*HH*.45); ctx.stroke(); }
        else if(T.rg==='ice'){ ctx.fillStyle='rgba(160,200,235,.45)'; ctx.fillRect(px-3*z,top-z,2*z,2*z); ctx.fillRect(px+2*z,top+z,2*z,1.5*z); }
        else { ctx.strokeStyle='rgba(60,64,96,.35)'; ctx.lineWidth=1*z; ctx.strokeRect(px-HW*.35,top-HH*.35,HW*.7,HH*.5); } }
      if(T.t==='c'&&((x*3+y*5)&3)===0){ ctx.strokeStyle='rgba(0,0,0,.08)'; ctx.lineWidth=1*z; ctx.beginPath(); ctx.moveTo(px-HW*.5,top); ctx.lineTo(px+HW*.5,top); ctx.stroke(); }
      if(T.t==='p'&&wHash(x,y,21)>.6){ ctx.fillStyle='rgba(150,110,60,.18)'; ctx.beginPath(); ctx.ellipse(px+(wHash(x,y,22)-.5)*HW,top+(wHash(x,y,23)-.5)*HH,2.6*z,1.4*z,0,0,Math.PI*2); ctx.fill(); } } } }

/* ── 기믹 · 전망대 · 정착지 그리기 (엔티티 단계) ── */
function dkEnts(s,scr,ents,vw,vh){ const M=s.M; if(!M||!M.dk) return; const vis=(px,py)=>px>-140&&px<vw+140&&py>-200&&py<vh+120;
  for(const g0 of M.gim){ if(g0.done&&(g0.k==='crack'||g0.k==='icewall')&&performance.now()-g0.at>800) continue; if(g0.k==='chest'&&s.dk.ch[g0.id]) continue; const [px,py]=scr(g0.x,g0.y,g0.h); if(vis(px,py)) ents.push({d:g0.x+g0.y+(g0.k==='pad'||g0.k==='grass'?-.3:0),k:'dkg',g:g0,px,py}); }
  for(const tw of M.towers){ const [px,py]=scr(tw.x,tw.y,6); if(vis(px,py)) ents.push({d:tw.x+tw.y+.1,k:'dkt',tw,px,py}); }
  { const [px,py]=scr(M.spire.x,M.spire.y); if(vis(px,py)) ents.push({d:M.spire.x+M.spire.y+1.2,k:'dks',px,py}); }
  { const [px,py]=scr(M.owl.x,M.owl.y); if(vis(px,py)) ents.push({d:M.owl.x+M.owl.y,k:'dko',px,py}); }
  for(const tb of M.tabs){ const [px,py]=scr(tb.x,tb.y); if(vis(px,py)) ents.push({d:tb.x+tb.y,k:'dkb',tb,px,py}); } }
function dkDrawEnt(g,e,s,u,tm,now){ if(!(u>0)) return; const C=(...a)=>wCube(g,e.px,e.py,u,...a); const px=e.px, py=e.py;
  if(e.k==='dks'){ wShadow(g,px,py+u,u*14,u*7); C(-7,-7,0,14,14,1.4,'#C9CED8',{t:'#E8ECF2'}); C(-5,-5,1.4,10,10,2,'#E8ECF2',{t:'#FFFFFF'}); C(-3,-3,3.4,6,6,26,'#F2F5FA',{t:'#FFFFFF',l:'#F6F8FB',r:'#D6DCE6'}); C(-2,-2,29.4,4,4,6,'#FFFFFF',{t:'#FFFFFF',l:'#F6F8FB',r:'#DDE2EA'});
    const els=['earth','fire','ice','bolt']; const k=.5+.5*Math.sin(tm*2);
    els.forEach((el,i)=>{ const on=!!s.dk.g[i]; const c=GE_EL[el].c; const a=i*Math.PI/2+tm*.2; const x=Math.cos(a)*2.4, y=Math.sin(a)*2.4; const [qx,qy]=[px+(x-y)*u,py+(x+y)*u*.5-u*22];
      g.fillStyle=on?c:'rgba(120,130,150,.6)'; g.beginPath(); g.arc(qx,qy,u*1.4,0,6.28); g.fill(); if(on){ const rg=g.createRadialGradient(qx,qy,0,qx,qy,u*6); rg.addColorStop(0,c+'AA'); rg.addColorStop(1,c+'00'); g.fillStyle=rg; g.fillRect(qx-u*6,qy-u*6,u*12,u*12); } });
    g.strokeStyle='rgba(255,255,255,'+(.25+k*.35)+')'; g.lineWidth=2; g.setLineDash([3,3]); g.beginPath(); g.arc(px,py-u*31,u*1.8,0,6.28); g.stroke(); g.setLineDash([]); return; }
  if(e.k==='dko'){ wShadow(g,px,py+u*.6,u*4,u*2); const b=Math.sin(tm*3)*u*.4; C(-2,-2,0,4,4,1,'#7A5A34'); C(-1.6,-1.4,1,3.2,2.8,4.4,'#C9A25A',{t:'#E0BE7A',l:'#C9A25A',r:'#A8823E'}); C(-1.7,-1.5,5.4,3.4,3,2.6,'#B08A48',{t:'#D2AE6A'});
    g.fillStyle='#FFF4C8'; g.beginPath(); g.arc(px-u*.9,py-u*7.2+b,u*.8,0,6.28); g.arc(px+u*.9,py-u*7.2+b,u*.8,0,6.28); g.fill(); g.fillStyle='#171A3C'; g.fillRect(px-u*1.1,py-u*7.4+b,u*.45,u*.45); g.fillRect(px+u*.7,py-u*7.4+b,u*.45,u*.45);
    C(-.6,1.38,6.2,1.2,.2,.5,'#FFB020'); g.fillStyle='rgba(255,226,122,'+(.6+.4*Math.sin(tm*4))+')'; g.font='900 '+Math.max(11,u*2.6)+'px sans-serif'; g.textAlign='center'; g.fillText('?',px,py-u*12); return; }
  if(e.k==='dkb'){ const got=!!(s.rpg.lore||{})['t'+e.tb.i]; C(-2.2,-.8,0,4.4,1.6,5,'#8E94AC',{t:'#B8BED2',l:'#9AA0B8',r:'#6E7496'}); g.strokeStyle='rgba(30,34,52,.7)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(px-u*1.2,py-u*6); g.lineTo(px,py-u*3.4); g.lineTo(px-u*.6,py-u*1.6); g.stroke();
    if(!got){ const c=GE_EL[DK_ORDER[e.tb.i]].c; g.fillStyle=c; g.globalAlpha=.5+.4*Math.sin(tm*3); g.beginPath(); g.arc(px,py-u*7,u*1.1,0,6.28); g.fill(); g.globalAlpha=1; } return; }
  if(e.k==='dkt'){ const on=!!s.dk.tw[e.tw.i]; C(-1.6,-1.6,0,3.2,3.2,1,'#8E95A6'); C(-1,-1,1,2,2,6,on?'#7CC8FF':'#AEB6C2',{t:on?'#CFEAFF':'#DDE2EA'}); const k=.5+.5*Math.sin(tm*3);
    if(on){ const rg=g.createRadialGradient(px,py-u*8,0,px,py-u*8,u*14); rg.addColorStop(0,'rgba(124,200,255,'+(.35+.2*k)+')'); rg.addColorStop(1,'rgba(124,200,255,0)'); g.fillStyle=rg; g.fillRect(px-u*14,py-u*22,u*28,u*28); }
    C(-.7,-.7,7+k*.6,1.4,1.4,1.4,on?'#FFFFFF':'#E8C060',{t:on?'#FFFFFF':'#FFE08A'}); return; }
  const G0=e.g; const k=G0.k; const el=s.cb?s.cb.elem:null; if(typeof SH_DRAW!=='undefined'&&SH_DRAW[k]) return SH_DRAW[k](g,e,s,u,tm,now,C);
  if(k==='pad'&&G0.coop){ const on=dkPadOn(s,G0); const pl=.5+.5*Math.sin(tm*3); g.fillStyle=on?'#7CF0B5':'#B8892A'; g.beginPath(); g.ellipse(px,py,u*6,u*3,0,0,Math.PI*2); g.fill(); g.fillStyle=on?'#C8FFE0':'rgba(255,214,90,'+(.65+pl*.3)+')'; g.beginPath(); g.ellipse(px,py-u*.6,u*4.4,u*2.2,0,0,Math.PI*2); g.fill(); g.fillStyle='rgba(60,40,0,.75)'; g.font='900 '+Math.round(Math.max(9,u*2.6))+'px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('2인',px,py-u*.6); return; }
  if(k==='pad'){ const on=dkPadOn(s,G0); g.fillStyle=on?'#7CF0B5':'#8E8778'; g.beginPath(); g.ellipse(px,py,u*6,u*3,0,0,Math.PI*2); g.fill(); g.fillStyle=on?'#C8FFE0':'#B8B2A2'; g.beginPath(); g.ellipse(px,py-u*.6,u*4.4,u*2.2,0,0,Math.PI*2); g.fill(); return; }
  if(k==='starpad'){ const pl=.5+.5*Math.sin(tm*4+G0.x); g.save(); g.fillStyle='rgba(255,214,74,.25)'; g.beginPath(); g.ellipse(px,py,u*6,u*3,0,0,Math.PI*2); g.fill(); g.translate(px,py); g.scale(1,.5); g.rotate(tm*.8);
    g.fillStyle='#FFD54A'; g.strokeStyle='#B07A0A'; g.lineWidth=u*.6; g.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, r=i%2?u*2.2:u*4.8; g.lineTo(Math.cos(a)*r,Math.sin(a)*r); } g.closePath(); g.fill(); g.stroke(); g.fillStyle='rgba(255,255,255,'+(.5+pl*.4)+')'; g.beginPath(); g.arc(0,0,u*1.4,0,Math.PI*2); g.fill(); g.restore();
    for(let i=0;i<4;i++){ const q=(tm*.7+i/4)%1; g.globalAlpha=1-q; g.fillStyle=i%2?'#FFFFFF':'#FFE45A'; g.fillRect(px+Math.cos(i*1.6+tm)*u*3-u*.35,py-q*u*10-u*.35,u*.7,u*.7); } g.globalAlpha=1; return; }
  if(k==='grass'){ const b=G0.burn>now; for(let i=0;i<7;i++){ const ax=(wHash(G0.x,G0.y,i)-.5)*u*9, ay=(wHash(G0.x,G0.y,i+9)-.5)*u*4; const sw=Math.sin(tm*3+i)*u*.6; g.strokeStyle=b?'#FF8A2A':'#E8C04A'; g.lineWidth=u*.9; g.beginPath(); g.moveTo(px+ax,py+ay); g.lineTo(px+ax+sw,py+ay-u*(4+wHash(i,G0.x,3)*3)); g.stroke(); }
    if(b){ for(let i=0;i<10;i++){ const t=((tm*1.4+i*.1)%1); g.fillStyle='rgba(255,'+(140+Math.round(t*100))+',60,'+(1-t)+')'; g.fillRect(px+(wHash(i,4,G0.y)-.5)*u*8,py-u*(2+t*22),u*1.2,u*1.2); } g.strokeStyle='rgba(255,255,255,.35)'; g.lineWidth=u*.6; for(let i=0;i<3;i++){ const t=((tm*.9+i*.33)%1); g.beginPath(); g.ellipse(px,py-u*(4+t*18),u*(3-t*1.4),u*(1.2-t*.5),0,0,Math.PI*2); g.stroke(); } } return; }
  if(k==='statue'){ wShadow(g,px,py+u*.5,u*4,u*2); C(-2.4,-2.4,0,4.8,4.8,1.2,'#8E8778'); C(-1.8,-1.8,1.2,3.6,3.6,6,'#B8B2A2',{t:'#D2CCBC'}); C(-1.2,-1.2,7.2,2.4,2.4,2.4,'#A9A291'); C(-.4,1.18,7.8,.8,.1,.6,'#3A3530'); return; }
  if(k==='torch'){ C(-1.4,-1.4,0,2.8,2.8,3.6,'#5A4A48'); C(-1.8,-1.8,3.6,3.6,3.6,1,'#3A2E2C'); if(G0.lit){ const f=1+Math.sin(tm*9+G0.x)*.3; C(-1.1,-1.1,4.6,2.2,2.2,2*f,'#FF5A1A',{t:'#FFB04A',l:'#FF7A2A',r:'#E8420A'}); C(-.5,-.5,4.6+2*f,1,1,1.2*f,'#FFD54A',{t:'#FFF2A0'}); const rg=g.createRadialGradient(px,py-u*6,0,px,py-u*6,u*10); rg.addColorStop(0,'rgba(255,170,60,.35)'); rg.addColorStop(1,'rgba(255,170,60,0)'); g.fillStyle=rg; g.fillRect(px-u*10,py-u*16,u*20,u*20); }
    else { g.fillStyle='rgba(255,120,60,'+(.3+.3*Math.sin(tm*3))+')'; g.font='900 '+Math.max(10,u*2.6)+'px sans-serif'; g.textAlign='center'; g.fillText('🔥',px,py-u*8); } return; }
  if(k==='totem'){ const on=G0.pw>now; C(-1.2,-1.2,0,2.4,2.4,7,'#B87333',{t:'#E39A5A',l:'#C8823E',r:'#8A5426'}); C(-1.6,-1.6,7,3.2,3.2,1,on?'#FFE45A':'#6E5A3A',{t:on?'#FFF7B0':'#8A7A5A'});
    if(on){ const k2=(G0.pw-now)/5000; g.strokeStyle='rgba(255,236,120,'+(.5+.5*Math.sin(tm*20))+')'; g.lineWidth=2; g.beginPath(); for(let i=0;i<5;i++){ const a=tm*8+i*1.3; g.moveTo(px,py-u*8); g.lineTo(px+Math.cos(a)*u*4,py-u*8+Math.sin(a)*u*3); } g.stroke(); g.fillStyle='rgba(0,0,0,.4)'; g.fillRect(px-u*3,py-u*12,u*6,u*.8); g.fillStyle='#FFE45A'; g.fillRect(px-u*3,py-u*12,u*6*k2,u*.8); }
    else { g.fillStyle='rgba(255,228,90,.6)'; g.font='900 '+Math.max(10,u*2.4)+'px sans-serif'; g.textAlign='center'; g.fillText('⚡',px,py-u*10); } return; }
  if(k==='crack'||k==='icewall'){ const t=G0.done?Math.min(1,(now-G0.at)/800):0; g.save(); g.globalAlpha=1-t; const ice=k==='icewall'; const c=ice?['#BFE6FF','#E8F7FF','#8CC8EA']:['#A8946E','#C9B48A','#7A6A50']; C(-2.4,-2.4,0,4.8,4.8,8*(1-t*.6),c[0],{t:c[1],l:c[0],r:c[2]});
    if(ice){ g.fillStyle='rgba(255,255,255,.5)'; g.fillRect(px-u*1.5,py-u*7,u*.8,u*4); g.fillStyle='rgba(60,140,200,.5)'; g.font='900 '+Math.max(10,u*2.2)+'px sans-serif'; g.textAlign='center'; g.fillText('🔥×'+(G0.hp||3),px,py-u*11); }
    else { g.strokeStyle='rgba(40,30,20,.7)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(px-u*1.5,py-u*8); g.lineTo(px+u*.3,py-u*5); g.lineTo(px-u*.8,py-u*3); g.lineTo(px+u*.8,py-u*1); g.stroke(); } g.restore(); return; }
  if(k==='door'){ if(G0.done){ const t=Math.min(1,(now-G0.at)/700); if(t>=1) return; g.save(); g.globalAlpha=1-t; } C(-2.4,-1.2,0,4.8,2.4,9,'#5E6480',{t:'#8E94AC'}); C(-1.6,-1.3,2,3.2,.2,5,'#7CC8FF',{l:'#7CC8FF',r:'#5EA8E0',t:'#AEE0FF'}); if(G0.done) g.restore(); return; }
  if(k==='core'){ const done=!!s.dk.sh[G0.sh]; const b=Math.sin(tm*2.4)*u; const c=GE_EL[G0.rg]?GE_EL[G0.rg].c:'#7CC8FF'; C(-2,-2,0,4,4,1.2,'#5E6480'); g.save(); if(!done){ const rg=g.createRadialGradient(px,py-u*7,0,px,py-u*7,u*12); rg.addColorStop(0,c+'88'); rg.addColorStop(1,c+'00'); g.fillStyle=rg; g.fillRect(px-u*12,py-u*19,u*24,u*24); }
    g.fillStyle=done?'#E8F7FF':c; g.beginPath(); g.moveTo(px,py-u*12+b); g.lineTo(px+u*2.4,py-u*7+b); g.lineTo(px,py-u*2+b); g.lineTo(px-u*2.4,py-u*7+b); g.closePath(); g.fill(); g.fillStyle='rgba(255,255,255,.6)'; g.beginPath(); g.moveTo(px,py-u*12+b); g.lineTo(px+u*.8,py-u*7+b); g.lineTo(px,py-u*4+b); g.closePath(); g.fill(); g.restore(); return; }
  if(k==='chest'){ const lk=!(G0.free||!s.M.gim.some(o=>o.grp&&o.grp===G0.grp&&o!==G0&&o.k!=='chest')); const T=CHEST[G0.tier]||CHEST.wood; wShadow(g,px,py+u*.6,u*4,u*2); C(-2.6,-1.8,0,5.2,3.6,3,T.c[1],{t:T.c[0],l:T.c[0],r:T.c[1]}); C(-2.8,-2,3,5.6,4,1.6,T.c[0],{t:T.g,l:T.c[0],r:T.c[1]}); if(lk){ C(-.5,1.75,1.8,1,.3,1.6,'#5E6480'); } else { const gl=.5+.5*Math.sin(tm*4); g.fillStyle='rgba(255,240,170,'+(.4+gl*.4)+')'; g.fillRect(px-u*.4,py-u*9,u*.8,u*.8); } return; }
}
/* 정착지 해방 표시 · 수호자 둥지 깃발 */
function dkDrawLabels(g,s,scr,u,tm){ const M=s.M; if(!M||!M.dk) return; g.textAlign='center'; g.textBaseline='middle';
  const tag=(x,y,z,txt,col)=>{ const [px,py]=scr(x,y,z); if(px<-100||px>s.vw+100||py<-100||py>s.vh+100) return; g.font='900 '+Math.max(10,u*2.3)+'px "Black Han Sans","NEXON Kart Gothic",sans-serif'; const w=g.measureText(txt).width+u*3; g.fillStyle='rgba(23,26,60,.82)'; rr(g,px-w/2,py-u*2,w,u*4,u*2); g.fill(); g.fillStyle=col||'#fff'; g.fillText(txt,px,py); };
  M.setl.forEach(S=>tag(S.x,S.y-5,dkH(M,S.x,S.y)+4,(s.dk.st[S.i]?'🏕 ':'⚔ ')+DK_SETN[S.i],s.dk.st[S.i]?'#7CF0B5':'#FFB0B0'));
  if(!s.inSh) M.shr.forEach(S=>{ if(Math.hypot(S.x-s.me.x,S.y-s.me.y)<16){ const I=SH_INFO[S.k]; tag(S.x,S.y,S.h+7,(s.dk.sh[S.id]?'✓ ':'')+I.n+(s.dk.sh[S.id]?'':' · 지하 입구'),s.dk.sh[S.id]?'#7CF0B5':'#FFE27A'); } });
  M.guard.forEach(G=>{ if(Math.hypot(G.x-s.me.x,G.y-s.me.y)<24&&!s.mobs.some(m=>m.t===G.t)) tag(G.x,G.y,dkH(M,G.x,G.y)+4,(s.dk.g[G.i]?'정화된 ':'')+MOB[G.t].n+'의 둥지',s.dk.g[G.i]?'#7CF0B5':'#FF8A8A'); }); }
/* 글라이더 날개 · 스태미나 고리 */
function dkDrawMe(g,s,px,py,u,tm){ const me=s.me, GL=s.gl; if(!GL) return;
  if(me.air&&me.glide){ const fl=Math.sin(tm*6)*u*.6; const pr=dkShN(s.dk)>=10; const c1=pr?'#FF9AD8':'#FF8A3A', c2=pr?'#7CC8FF':'#FFD54A';
    g.save(); g.fillStyle=c1; g.beginPath(); g.moveTo(px,py-u*22); g.quadraticCurveTo(px-u*12,py-u*26+fl,px-u*14,py-u*19); g.lineTo(px,py-u*20); g.closePath(); g.fill(); g.fillStyle=c2; g.beginPath(); g.moveTo(px,py-u*22); g.quadraticCurveTo(px+u*12,py-u*26+fl,px+u*14,py-u*19); g.lineTo(px,py-u*20); g.closePath(); g.fill();
    g.strokeStyle='rgba(23,26,60,.6)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(px-u*8,py-u*20); g.lineTo(px-u*1.5,py-u*13); g.moveTo(px+u*8,py-u*20); g.lineTo(px+u*1.5,py-u*13); g.stroke(); g.restore(); }
  if(GL.st<GL.max-.5){ const k=GL.st/GL.max; const x=px+u*9, y=py-u*16; g.lineWidth=Math.max(3,u*1.2); g.strokeStyle='rgba(23,26,60,.55)'; g.beginPath(); g.arc(x,y,u*2.6,0,Math.PI*2); g.stroke(); g.strokeStyle=k<.25?'#FF5A5A':'#7CF07A'; g.beginPath(); g.arc(x,y,u*2.6,-Math.PI/2,-Math.PI/2+Math.PI*2*k); g.stroke(); } }

/* ═════════ 디코아 HUD: 나침반 바 · 온도 · 배너 · 이벤트 · 의뢰 ═════════ */
function DkHud({S,H,onMap,onSetl,onBag}){ const s=S.current; if(!s||!s.M||!s.M.dk||!H) return null; const T=H.temp||{c:20,st:0}; const TS=DK_TS.find(x=>x[0]===T.st)||DK_TS[2]; const ck=dkClock();
  return html`<div className=${'dk80'+(ck.voidN?' void':'')+(ck.night?' night':'')}>
    <div className="dk80-cmp">${(H.cmp||[]).map((m,i)=>html`<i key=${i} className=${'dk80-cm '+m.k} style=${{left:(50+m.a*50)+'%','--c':m.c||'#fff'}}><${Icon} n=${m.ic} s=${12} w=${2.6}/>${m.d!=null?html`<em>${m.d}</em>`:null}</i>`)}<b style=${{left:'50%'}}></b></div>
    <div className="dk80-chips"><span className="dk80-t" style=${{'--c':TS[2]}}><${Icon} n=${T.st<0?'snow':T.st>0?'flame':'sun'} s=${13} w=${2.4}/>${T.c}° · ${TS[1]}</span><span className="dk80-clk"><${Icon} n=${ck.night?'moon':'sun'} s=${12} w=${2.4}/>${ck.txt}${ck.voidN?' · 공허의 밤':''}</span></div>
    <button type="button" className="dk80-map tap" onClick=${onMap} aria-label="지도 (M)"><${Icon} n="map" s=${19} w=${2.3}/><small>지도</small></button>
    <button type="button" className="dk80-map dk82-bag tap" onClick=${onBag} aria-label="가방 (B)"><${Icon} n="bag" s=${19} w=${2.3}/><small>가방</small></button>
    ${H.sh?html`<div className=${'dk94-sh'+(H.sh.done?' done':'')} style=${{'--c':H.sh.c}}><em>${H.sh.coop?'협동 시험 · '+H.sh.n2+'명':'솔로 시험'}</em><b>${H.sh.n}</b><small>${H.sh.obj}</small>${H.sh.prog?html`<span className="dk94-pg"><i style=${{width:H.sh.prog*100+'%'}}></i></span>`:null}<button type="button" className="tap" onClick=${()=>{ const s2=S.current; s2&&s2.shExit&&s2.shExit(); }}>나가기</button></div>`:null}
    ${H.ev?html`<div className="dk80-ev"><b>${H.ev.t}</b><span>${H.ev.left}마리 · ${H.ev.sec}초</span></div>`:null}
    ${H.qs&&H.qs.length?html`<div className="dk80-qs">${H.qs.map(q=>html`<div key=${q.id} className=${q.done?'ok':''}><${Icon} n=${q.ic} s=${12} w=${2.4}/><span>${q.n}</span><b>${q.p||0}/${q.need}</b></div>`)}</div>`:null}
    ${H.setl?html`<button type="button" className="dk80-setl tap" onClick=${onSetl}><${Icon} n="home" s=${16} w=${2.4}/>정착지 · 수리 · 의뢰</button>`:null}
    ${H.owl?html`<div className="dk82-owl"><i>🦉</i><div><b>박사 아울</b><p>${H.owl}</p></div></div>`:null}
    ${H.ban?html`<div className=${'dk80-ban'+(H.ban.big?' big':'')} key=${H.ban.k}><b>${H.ban.t}</b><small>${H.ban.b}</small></div>`:null}
  </div>`; }
/* 나침반 표식: 화면 방향 기준 (-1 왼쪽 끝 ~ 1 오른쪽 끝) */
function dkCompass(s){ const M=s.M, me=s.me, D=s.dk; const out=[]; const [mx,my]=s.scr(me.x,me.y,me.z);
  const add=(x,y,ic,k,c,lim)=>{ const d=Math.hypot(x-me.x,y-me.y); if(lim&&d>lim) return; const [px,py]=s.scr(x,y); const a=Math.atan2(px-mx,-(py-my)); const v=Math.max(-1,Math.min(1,a/(Math.PI*.6))); out.push({a:v,ic,k,c,d:Math.round(d)}); };
  const seen=(x,y)=>{ const ci=dkCellOf(x,y); return ci>=0&&dkSeenGet(D.seen,ci); };
  if(D.pin) add(D.pin[0],D.pin[1],'pin','pin','#FF5A7A');
  const tw=M.towers.filter(t=>!D.tw[t.i]).sort((a,b)=>Math.hypot(a.x-me.x,a.y-me.y)-Math.hypot(b.x-me.x,b.y-me.y))[0]; if(tw) add(tw.x,tw.y,'up2','tw','#7CC8FF',70);
  if(s.inSh) return out;
  const sh=M.shr.filter(x=>!D.sh[x.id]&&seen(x.x,x.y)).sort((a,b)=>Math.hypot(a.x-me.x,a.y-me.y)-Math.hypot(b.x-me.x,b.y-me.y))[0]; if(sh) add(sh.x,sh.y,'spark','sh',(GE_EL[sh.rg]||{c:'#9CE4FF'}).c);
  const st=M.setl.filter(x=>!D.st[x.i]).sort((a,b)=>Math.hypot(a.x-me.x,a.y-me.y)-Math.hypot(b.x-me.x,b.y-me.y))[0]; if(st) add(st.x,st.y,'home','st','#FFE27A',60);
  return out; }

/* ═════════ 젤다식 지도 ═════════ */
const DK_STP=[['ping','파티 핑','flag','#5BE0A4'],['pin','핀','pin','#FF5A7A'],['star','별','star','#FFD54A'],['chest','보물','gift','#FFB15C'],['skull','위험','bolt','#FF5A5A'],['heart','요리','heart','#FF7DB0'],['q','궁금','spark','#9CE4FF']];
function DkMap({S,c,onClose,onWarp,onBag}){ const cv=useRef(null); const [foot,setFoot]=useState(false); const [stp,setStp]=useState('pin'); const [sel,setSel]=useState(null); const s=S.current; const M=s&&s.M; const D=s?s.dk:dkOf({}); const [,setV]=useState(0);
  const SC=4.2; const toMap=(x,y)=>[(x-y)*SC*.5,(x+y)*SC*.25];
  const pts=useMemo(()=>{ if(!M) return []; const L=[]; L.push({k:'home',x:M.spawn[0],y:M.spawn[1],n:'소셜 아일랜드 포털',warp:1,ic:'home',c:'#FFE27A'});
    M.towers.forEach(t=>L.push({k:'tw',x:t.x,y:t.y,n:'전망대 '+(t.i+1),warp:!!D.tw[t.i],ic:'up2',c:D.tw[t.i]?'#7CC8FF':'#AEB6C2',o:t}));
    M.setl.forEach(t=>L.push({k:'st',x:t.x,y:t.y,n:DK_SETN[t.i],warp:!!D.st[t.i],ic:'home',c:D.st[t.i]?'#7CF0B5':'#FF8A8A',o:t}));
    M.shr.forEach(t=>L.push({k:'sh',x:t.x,y:t.y,n:SH_INFO[t.k].n+' · '+DK_RG[t.rg].n,warp:!!D.sh[t.id],ic:'spark',c:D.sh[t.id]?'#7CF0B5':(GE_EL[t.rg]||{c:'#9CE4FF'}).c,o:t}));
    M.guard.forEach(t=>L.push({k:'g',x:t.x,y:t.y,n:MOB[t.t].n,ic:'crown',c:D.g[t.i]?'#7CF0B5':'#FF5A5A',o:t})); return L; },[M,s&&s.dkV]);
  const seen=(x,y)=>{ const ci=dkCellOf(x,y); return ci>=0&&dkSeenGet(D.seen,ci); };
  useEffect(()=>{ const el=cv.current; if(!el||!M) return; const r=el.getBoundingClientRect(); const dpr=Math.min(2,window.devicePixelRatio||1); el.width=r.width*dpr; el.height=r.height*dpr; const g=el.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0);
    const fit=Math.min(r.width/(DK_R*2*SC*.5*2+20),r.height/(DK_R*2*SC*.25*2+20))*2; const ox=r.width/2, oy=r.height/2; el._fit=fit; el._o=[ox,oy];
    g.fillStyle='#24406A'; g.fillRect(0,0,r.width,r.height); g.strokeStyle='rgba(255,255,255,.05)'; for(let i=0;i<r.width;i+=24){ g.beginPath(); g.moveTo(i,0); g.lineTo(i,r.height); g.stroke(); }
    const P=(x,y)=>{ const [a,b]=toMap(x,y); return [ox+a*fit,oy+b*fit]; }; const hw=SC*.5*fit, hh=SC*.25*fit;
    const shade=(hex,k)=>{ const n=parseInt(hex.slice(1),16); return 'rgb('+Math.min(255,Math.round(((n>>16)&255)*k))+','+Math.min(255,Math.round(((n>>8)&255)*k))+','+Math.min(255,Math.round((n&255)*k))+')'; };
    for(const w of M.WT.values()){ if(!seen(w.x,w.y)) continue; const [px,py]=P(w.x,w.y); g.fillStyle=w.lava?'#FF6A1A':'#4FB8E0'; g.fillRect(px-hw,py-hh,hw*2,hh*2); }
    for(const t of M.T.values()){ if(t.u) continue; const [px,py]=P(t.x,t.y); const sn=seen(t.x,t.y); const R=DK_RG[t.rg]; let col=t.t==='p'?'#F0E0BE':t.t==='t'?'#C9CED8':R.top[0][0]; col=shade(col,.62+t.h*.08);
      g.fillStyle=sn?col:'rgba(230,214,170,'+(.85-t.h*.03)+')'; g.fillRect(px-hw,py-hh,hw*2+.5,hh*2+.5); if(!sn&&((t.x+t.y)%3===0)){ g.fillStyle='rgba(160,130,80,.25)'; g.fillRect(px-hw*.4,py,hw*.8,hh*.6); } }
    /* 발자국 */
    if(foot&&s.trail){ g.fillStyle='rgba(255,255,255,.75)'; s.trail.forEach(([x,y])=>{ if(x>250) return; const [px,py]=P(x,y); g.beginPath(); g.arc(px,py,1.6,0,6.28); g.fill(); }); }
    /* 크루 위치 */
    for(const o of s.others.values()){ if(o.x>250) continue; const [px,py]=P(o.x,o.y); g.fillStyle='#7CF07A'; g.strokeStyle='#171A3C'; g.lineWidth=2; g.beginPath(); g.arc(px,py,5,0,6.28); g.fill(); g.stroke(); }
    if(D.pin){ const [px,py]=P(D.pin[0],D.pin[1]); g.fillStyle='#FF5A7A'; g.beginPath(); g.arc(px,py-8,6,Math.PI,0); g.lineTo(px,py); g.closePath(); g.fill(); g.strokeStyle='#171A3C'; g.lineWidth=2; g.stroke(); }
    const [mx,my]=P(s.inSh&&s.shRet?s.shRet[0]:s.me.x,s.inSh&&s.shRet?s.shRet[1]:s.me.y); g.fillStyle='#FFD54A'; g.strokeStyle='#171A3C'; g.lineWidth=2.5; g.beginPath(); g.moveTo(mx,my-9); g.lineTo(mx+7,my+6); g.lineTo(mx,my+2); g.lineTo(mx-7,my+6); g.closePath(); g.fill(); g.stroke();
  },[M,foot,s&&s.dkV]);
  const tapMap=e=>{ const el=cv.current; const r=el.getBoundingClientRect(); const px=e.clientX-r.left, py=e.clientY-r.top; const [ox,oy]=el._o, fit=el._fit; const a=(px-ox)/fit/(SC*.5), b=(py-oy)/fit/(SC*.25); const x=Math.round((a+b)/2), y=Math.round((b-a)/2);
    const hit=pts.filter(p=>p.k!=='g'||seen(p.x,p.y)).find(p=>Math.hypot(p.x-x,p.y-y)<3.2); if(hit&&stp==='pin'){ setSel(hit); return; }
    if(stp==='ping'){ if(typeof coopPing==='function') coopPing(s,x,y,'go'); c.notify(s.others&&s.others.size?'크루에게 파티 핑을 보냈어요':'파티 핑을 찍었어요 · 같은 곳의 크루에게 보여요'); setV(v=>v+1); return; }
    if(stp==='pin'){ s.dk.pin=[x,y]; } else { const L=(s.dk.stp||[]).slice(); const j=L.findIndex(q=>Math.hypot(q[0]-x,q[1]-y)<2.6); if(j>=0) L.splice(j,1); else { if(L.length>=16){ c.notify('스탬프는 16개까지 찍을 수 있어요 · 눌러서 지워 주세요'); return; } L.push([x,y,stp]); } s.dk.stp=L; } s.dkDirty=1; setSel(null); setV(v=>v+1); haptic(8); wSfx('pick'); };
  const [ox,oy]=(cv.current&&cv.current._o)||[0,0]; const fit=(cv.current&&cv.current._fit)||1;
  const tot=M?M.towers.length+M.shr.length+M.setl.length+M.guard.length:1; const got=M?Object.keys(D.tw).length+dkShU(D)+Object.keys(D.st).length+Object.keys(D.g).length:0;
  let seenN=0; for(let i=0;i<DK_GN*DK_GN;i++) if(dkSeenGet(D.seen,i)) seenN++; const pct=Math.round((got/tot*.7+Math.min(1,seenN/(DK_GN*DK_GN*.6))*.3)*1000)/10;
  const ck=dkClock(); const T=s&&s.temp?s.temp:{c:20,st:0};
  return html`<div className="dm80" onClick=${onClose}><div className="dm80-c" onClick=${e=>e.stopPropagation()}>
    <div className="dm80-h"><em>DKOA</em><b>대륙 디코아</b><span className="dm80-n">사당 ${dkShU(D)}/${M?M.shr.length:10} · 전망대 ${Object.keys(D.tw).length}/${M?M.towers.length:18} · 정착지 ${Object.keys(D.st).length}/4 · 수호자 ${Object.keys(D.g).length}/4</span>${onBag?html`<button type="button" className="tap dm82-bag" onClick=${onBag}><${Icon} n="bag" s=${16} w=${2.4}/>가방</button>`:null}<button type="button" className="tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="dm80-m"><canvas ref=${cv} onClick=${tapMap}></canvas>
      ${pts.filter(p=>p.k==='home'||seen(p.x,p.y)).map((p,i)=>{ const [a,b]=toMap(p.x,p.y); return html`<button type="button" key=${p.k+i} className=${'dm80-p k-'+p.k+(p.warp?' w':'')+(sel===p?' sel':'')} style=${{left:(ox+a*fit)+'px',top:(oy+b*fit)+'px','--c':p.c}} onClick=${e=>{ e.stopPropagation(); setSel(p); haptic(6); }}><${Icon} n=${p.ic} s=${12} w=${2.6}/></button>`; })}
      ${(D.stp||[]).map((q,i)=>{ const T=DK_STP.find(t=>t[0]===q[2])||DK_STP[1]; const [a,b]=toMap(q[0],q[1]); return html`<span key=${'s'+i} className="dm83-st" style=${{left:(ox+a*fit)+'px',top:(oy+b*fit)+'px','--c':T[3]}}><${Icon} n=${T[2]} s=${11} w=${2.8}/></span>`; })}
      ${(s&&s.pings||[]).filter(p=>performance.now()-p.at<8000).map((p,i)=>{ const P=CO_PG[p.k]||CO_PG.go; const [a,b]=toMap(p.x,p.y); return html`<span key=${'p'+i} className="dm83-pg" style=${{left:(ox+a*fit)+'px',top:(oy+b*fit)+'px','--c':P[1]}}><i></i><b>${P[0]} ${p.who}</b></span>`; })}
      <div className="dm80-bl"><b>${pct}%</b><small>달성률</small><span>${ck.txt}${ck.voidN?' · 공허의 밤':ck.night?' · 밤':''}</span><span>${T.c}°C</span></div>
      <div className="dm80-tools"><button type="button" className=${'tap'+(foot?' on':'')} onClick=${()=>setFoot(!foot)}><${Icon} n="foot" s=${14} w=${2.4}/>발자국</button><button type="button" className="tap" onClick=${()=>{ if(stp==='pin') s.dk.pin=null; else s.dk.stp=[]; s.dkDirty=1; setV(v=>v+1); }}><${Icon} n="x" s=${14} w=${2.6}/>${stp==='pin'?'핀 지우기':'스탬프 지우기'}</button></div>
      <div className="dm83-stp">${DK_STP.map(([k,n,ic,col])=>html`<button key=${k} type="button" className=${'tap'+(stp===k?' on':'')} style=${{'--c':col}} onClick=${e=>{ e.stopPropagation(); setStp(k); setSel(null); haptic(5); }} aria-label=${n}><i><${Icon} n=${ic} s=${13} w=${2.6}/></i><small>${n}</small></button>`)}</div>
      ${sel?html`<div className="dm80-sel"><b>${sel.n}</b><small>${sel.warp?'워프할 수 있어요':sel.k==='tw'?'꼭대기에 올라가면 활성화돼요':sel.k==='st'?'몬스터 캠프를 물리치면 해방돼요':sel.k==='sh'?'석문으로 들어가 지하 시험을 풀면 정화돼요':'4대 수호자'}</small>${sel.warp?html`<button type="button" className="tap" onClick=${()=>{ onWarp(sel); }}>워프</button>`:null}</div>`:html`<p className="dm80-tip">${stp==='pin'?'지도를 누르면 핀을 꽂아요 · 나침반 바에 표시돼요 · 파란 아이콘은 워프 지점':stp==='ping'?'지도를 누르면 그곳에 파티 핑을 보내요 · 같은 곳의 크루 화면에 8초 동안 떠요':'지도를 누르면 스탬프를 찍어요 · 찍힌 스탬프를 다시 누르면 지워져요 (최대 16개)'}</p>`}
    </div></div></div>`; }

/* ═════════ 정착지 메뉴: 수리 · 의뢰 게시판 ═════════ */
function DkSetl({S,c,onClose}){ const s=S.current; const S0=s&&s.atSetl; const [,setV]=useState(0); const [tab,setTab]=useState('main'); if(!s||!S0) return null; const D=s.dk; const G=s.rpg.gear; const E=gEquipped(G);
  const gold=wGoldOf((c.islands||[]).find(x=>x.uid===c.uid)||{}); const QB=dkQuests(S0.i); if(!D.q||D.q.hk!==QB.hk) D.q={hk:QB.hk,acc:{}};
  const fix=[E.w,E.w2].filter(x=>x&&x.d<gDurMax(x)); const pr=fix.reduce((a,x)=>a+GE_FIX[x.r],0);
  const repair=()=>{ if(!fix.length) return; if(gold<pr) return c.notify('골드가 '+(pr-gold)+' 모자라요','err'); c.worldGold(-pr).then(ok=>{ if(!ok) return; fix.forEach(x=>{ x.d=gDurMax(x); }); s.st=cbStats(s.rpg); s.dkDirty=1; wSfx('gem'); c.notify('무기를 고쳤어요 · 내구도 100%'); setV(v=>v+1); }); };
  const acc=q=>{ if(Object.keys(D.q.acc).length>=3&&!D.q.acc[q.id]) return c.notify('의뢰는 3개까지 받을 수 있어요','err'); D.q.acc[q.id]={...q,p:0}; s.dkDirty=1; haptic(10); setV(v=>v+1); };
  return html`<div className="ds80" onClick=${onClose}><div className="ds80-c" onClick=${e=>e.stopPropagation()}>
    <div className="ds80-h"><b>${DK_SETN[S0.i]}</b><small>모닥불 곁에 있으면 체력이 차올라요</small><button type="button" className="tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="ds80-tabs">${[['main','수리 · 의뢰'],['cook','요리솥'],['sell','특산 납품']].map(([k,n])=>html`<button key=${k} type="button" className=${'tap'+(tab===k?' on':'')} onClick=${()=>setTab(k)}>${n}</button>`)}</div>
    ${tab==='cook'?html`<${WCook} R=${{...s.rpg,ore:G.ore||0}} compact=${1} say=${t=>c.notify(t)} canCook=${true} onCommit=${(o,msg)=>{ s.rpg.pt=o.pt; s.rpg.food=o.food; s.rpg.rcp=o.rcp; s.rpg.life=lifeAdd(s.rpg,'ck'); G.ore=o.ore; s.dkDirty=1; c.notify(msg); setV(v=>v+1); }} onEat=${i=>{ s.eat(i); setV(v=>v+1); }}/>`:null}
    ${tab==='sell'?html`<div className="ds80-sell"><p>이 정착지는 <b>${DK_SPEC[S0.rg].map(k=>ING[k].n).join(' · ')}</b>을(를) 1.5배 값에 사요.</p>${Object.keys(s.rpg.pt||{}).filter(k=>ING[k]&&s.rpg.pt[k]>0).map(k=>{ const sp=DK_SPEC[S0.rg].includes(k); const pr=Math.round(ING[k].p*(sp?1.5:1)); return html`<div key=${k} className=${'tr81-r'+(sp?' sp':'')}><i style=${{background:ING[k].c}}></i><b>${ING[k].n}</b><small>${s.rpg.pt[k]}개 · 개당 ${pr} G${sp?' · 특산':''}</small><button type="button" className="tap" onClick=${()=>{ const n=s.rpg.pt[k]; const g0=pr*n; delete s.rpg.pt[k]; s.rpg.pt={...s.rpg.pt}; s.dkDirty=1; c.worldGold(g0,ING[k].n+' '+n+'개 납품 · 골드 +'+g0.toLocaleString()); wSfx('coin'); setV(v=>v+1); }}>전부 팔기</button></div>`; })}</div>`:null}
    ${tab==='main'?html`<button type="button" className="ds80-fix tap" onClick=${repair} disabled=${!fix.length}><${Icon} n="anvil" s=${20} w=${2.3}/><b>${fix.length?'착용 무기 수리 · '+pr+' G':'고칠 무기가 없어요'}</b></button>
    <h5>의뢰 게시판 <small>매시간 새로 붙어요 · 최대 3개</small></h5>
    <div className="ds80-q">${QB.list.map(q=>{ const A=D.q.acc[q.id]; return html`<div key=${q.id} className=${'ds80-qi'+(A?(A.done?' done':' on'):'')}><span><${Icon} n=${q.ic} s=${16} w=${2.4}/></span><div><b>${q.n} ${q.need}</b><small>보상 골드 ${q.gold.toLocaleString()}${A?' · '+(A.p||0)+'/'+q.need:''}</small></div>
      ${A?(A.done?html`<em>완료</em>`:html`<em>진행 중</em>`):html`<button type="button" className="tap" onClick=${()=>acc(q)}>수락</button>`}</div>`; })}</div>`:null}
  </div></div>`; }

/* 지도 · 수호자 처치 · 의뢰 보상 처리 (Dungeon 쪽에서 불러요) */
function dkOnKill(s,m,api){ if(!s.M||!s.M.dk) return; dkQProg(s,'kill',1); if(m.boss||m.mini) dkQProg(s,'boss',1);
  if(m.guard!=null){ const D=s.dk; if(!D.g[m.guard]){ D.g[m.guard]=1; s.dkDirty=1; ssGain(s,8,'수호자 정화'); s.rpg.lore={...(s.rpg.lore||{}),['t'+m.guard]:1}; s.dkBanner={t:MOB[m.t].n+' 정화!',b:'수호자 석판이 세계관 도감에 기록됐어요',k:performance.now(),big:1}; } s.drops.push({k:'e',it:gDrop(s.rpg.gear,'boss',DK_ORDER[m.guard]),x:m.x,y:m.y,at:performance.now(),z:1}); }
  if(m.glitch&&Math.random()<.25) s.drops.push({k:'e',it:gDrop(s.rpg.gear,Math.random()<.15?'boss':'elite',null),x:m.x+.3,y:m.y,at:performance.now(),z:1}); }
/* HUD에 넘길 값 (0.1초마다) */
function dkHudData(s,now){ const D=s.dk; if(s.glideT>=1){ dkQProg(s,'glide',Math.floor(s.glideT)); s.glideT%=1; }
  const ban=s.dkBanner&&now-s.dkBanner.k<3600?s.dkBanner:null; const E=s.ev; const qs=D.q&&D.q.acc?Object.values(D.q.acc).filter(q=>D.q.hk===Math.floor(Date.now()/3600000)):[];
  if(s.dkDirty&&now-(s.dkVAt||0)>1500){ s.dkVAt=now; s.dkV=(s.dkV||0)+1; s.dkDirty=0; }
  return {temp:s.temp,cmp:dkCompass(s),ev:E?{t:E.k==='horde'?'슬라임 대군':E.k==='gob'?'보물 고블린':'변이 정예',left:E.list.filter(m=>s.mobs.includes(m)).length,sec:Math.max(0,Math.ceil((E.end-now)/1000))}:null,qs,setl:!!s.atSetl&&!s.inSh,ban,owl:s.owlNear&&!s.inSh?dkOwlHint(s):null,sh:s.inSh&&typeof shHud==='function'?shHud(s,now):null}; }

/* ════════ v29.4 디코아 지하 사당 10곳 ════════
   · 필드엔 빛나는 석문(승강기)만 있어요. 밟으면 짧은 로딩(약 1초) → 독립된 지하 씬으로 들어가요.
   · 들어갈 때 같이 있는 크루 수를 보고 솔로 / 협동 퍼즐을 골라서 만들어요.
   · 지하 씬은 대륙 지도 밖(멀리 떨어진 좌표)에 그때그때 지어요. 나가면 들어온 석문 앞으로 돌아와요. */
const SH_INFO={
  sight:{n:'시야의 사당',el:'plain',c:'#9CE4FF',hint:['어둠 속 거울을 쳐서 돌려요 · 빛줄기를 결정에 닿게 해요','빛줄기 두 갈래가 동시에 결정에 닿아야 해요 · 양쪽 거울을 나눠 맡아요'],obj:'거울을 쳐서 빛을 결정으로'},
  wind:{n:'바람의 사당',el:'plain',c:'#B8F0C8',hint:['불로 마른 덤불을 태우면 상승 기류! 글라이더로 움직이는 고리 3개를 통과해요','한 명이 화로에 불을 계속 붙이고, 다른 크루가 큰 기류를 타고 높은 고리를 지나요'],obj:'활강해서 고리 통과'},
  weight:{n:'무게의 사당',el:'earth',c:'#E8C060',hint:['큰 석상은 2, 작은 석상과 나는 1 · 천칭 양쪽 무게를 똑같이 맞춰요','두 개의 천칭을 동시에 맞춰요 · 크루 몸무게도 1이에요'],obj:'천칭 양쪽 무게 맞추기'},
  crack:{n:'균열의 사당',el:'earth',c:'#D8A868',hint:['벽을 두드려 보세요 · 속이 빈 소리가 나는 가짜 벽을 대지 무기로 부숴요','위층 관찰대에 선 크루에게는 가짜 벽이 빛나 보여요 · 핑으로 알려 줘요'],obj:'가짜 벽을 찾아 부수기'},
  furnace:{n:'용광로의 사당',el:'fire',c:'#FF7A3D',hint:['용암이 차오르기 전에 올라가요 · 얼음으로 용암 틈을 막고 기류 분출구를 타요','밸브를 밟고 있으면 용암이 빠져요 · 번갈아 밟으며 함께 올라가요'],obj:'용암을 피해 꼭대기로'},
  ignite:{n:'점화의 사당',el:'fire',c:'#FFB04A',hint:['돌풍이 불을 꺼요 · 석상을 밀어 바람을 막고 화로 4개를 동시에 피워요','바람 방향이 바뀌어요 · 크루가 직접 바람막이가 돼요 (탱커는 더 넓게)'],obj:'화로 4개 동시 점화'},
  gear:{n:'시간 정지의 사당',el:'ice',c:'#9CD2FF',hint:['떨어지는 돌을 얼음으로 얼려 발판으로! 톱니의 중심을 얼리면 멈춰요','한 명이 레버 결정을 계속 얼려 톱니를 붙잡고, 다른 크루가 건너요'],obj:'얼려서 건너고 톱니 지나기'},
  slide:{n:'거울 얼음의 사당',el:'ice',c:'#CFEFFF',hint:['빙판은 벽에 닿을 때까지 미끄러져요 · 얼음 블록을 밀어 멈출 곳을 만들어요','크루가 빙판 위에 서서 멈춤 벽이 돼 줘요 · 금빛 바닥에 멈추면 성공'],obj:'금빛 바닥에 멈추기'},
  circuit:{n:'전류의 사당',el:'bolt',c:'#FFE45A',hint:['금속 큐브를 밀어 끊긴 전선을 이어요 · 물웅덩이도 전기가 통해요 · 번개로 발전기 시동','전력 토템 3개를 4초 안에 모두 번개로 쳐요'],obj:'회로를 잇고 시동 걸기'},
  reso:{n:'공명의 사당',el:'bolt',c:'#D8B0FF',hint:['대지 → 불 → 얼음 → 번개 순서로 기둥을 쳐요 · 퀵스왑으로 빠르게!','네 기둥을 동시에 깨워요 · 각자 다른 원소 기둥을 맡아요'],obj:'4원소 봉인 풀기'}};
const SH_EL=k=>({plain:'#9CE4FF',earth:'#E8C060',fire:'#FF7A3D',ice:'#9CD2FF',bolt:'#FFE45A'})[k]||'#9CE4FF';
const SH_TOP={u:()=>['#3A3F5C','#353A55'],uw:()=>['#5A5F80','#53587A'],ug:()=>['#6A7AB0','#6272A6'],us:()=>['#C8ECFF','#BCE4FA'],uq:()=>['#3E6E9E','#386696'],uwi:T=>T.pw?['#FFE45A','#F2D040']:['#8A6A48','#806242'],up:()=>['#8A7A5A','#827252'],uv:()=>['#6A3A2E','#62342A'],ur:()=>['#E8C060','#DEB654'],ui:()=>['#D8F2FF','#C8EAFF']};
const shK=(x,y)=>x+','+y;
/* ── 크루 동기화: 장치 상태를 짧은 목록으로 보내요 ── */
function shSync(s,id,v){ if(!s||!s.sh||!s.sh.coop) return; s.coN=(s.coN||0)+1; const L=((s.coSg&&s.coSg.L)||[]).filter(e=>s.coN-e.n<10); L.push({n:s.coN,sh:s.sh.id,id,v}); s.coSg={n:s.coN,L}; s.pingNow&&s.pingNow(); }
function shApply(s,e,nick){ const S=s.sh; if(!S||e.sh!==S.id) return; const M=s.M, now=performance.now(); if(e.id==='solve'){ shSolve(s,1); return; }
  const g0=M.gim.find(g=>g.id===e.id); if(!g0) return; const v=e.v||{};
  if(v.o!=null){ g0.o=v.o; g0.at=now; S.beamDirty=1; } if(v.got){ g0.got=1; } if(v.lit!=null){ g0.lit=v.lit; g0.litAt=now; } if(v.pw){ g0.pw=now+(g0.win||5000); } if(v.on){ g0.on=now+(v.on||5000); } if(v.brk){ shBreakWall(s,g0,1); } if(v.fz){ g0.fz=now+v.fz; }
  if(v.mv){ M.blk.delete(shK(g0.x,g0.y)); g0.x=v.mv[0]; g0.y=v.mv[1]; M.blk.add(shK(g0.x,g0.y)); g0.at=now; S.beamDirty=1; }
  if(v.st){ shStep(s,g0,v.st,1); } }
/* ── 로딩 화면 (0.8~1.2초) ── */
function shLoad(o,mid){ const el=document.createElement('div'); el.className='shl29'+(o.out?' out':''); el.style.setProperty('--c',o.c||'#9CE4FF');
  const esc=t=>String(t||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);
  el.innerHTML='<div class="shl29-g"><i></i><i></i><i></i><b></b></div><em>'+esc(o.e)+'</em><strong>'+esc(o.n)+'</strong><small>'+esc(o.hint)+'</small><span>'+esc(o.mode)+'</span>';
  document.body.appendChild(el); requestAnimationFrame(()=>el.classList.add('on'));
  setTimeout(()=>{ try{ mid(); }catch(e){ console.error(e); } },430); setTimeout(()=>el.classList.add('off'),820); setTimeout(()=>el.remove(),1200); }
/* ── 지하 씬 짓기 도우미 ── */
function shBuilder(M,i,k){ const BX=400+i*60, BY=400; const keys=[]; const G=[]; const el=SH_INFO[k].el;
  const put=(u,v,h,t,o)=>{ const x=BX+u, y=BY+v, kk=shK(x,y); M.T.set(kk,{x,y,h,t:t||'u',rg:'und',u:1,...(o||{})}); M.blk.delete(kk); M.WT.delete(kk); keys.push(kk); };
  const room=(u0,v0,u1,v1,h,t)=>{ for(let u=u0;u<=u1;u++) for(let v=v0;v<=v1;v++) put(u,v,h,t); };
  const hole=(u,v,lava)=>{ const x=BX+u, y=BY+v, kk=shK(x,y); M.T.delete(kk); M.WT.set(kk,{x,y,rg:'und',lava:!!lava,shI:1}); keys.push(kk); };
  const gim=(kk,u,v,o)=>{ const x=BX+u, y=BY+v; const t=M.T.get(shK(x,y)); const g0={k:kk,x,y,sc:i,id:'s'+i+'_'+G.length,h:t?t.h:2,...(o||{})}; G.push(g0); if(g0.blk) M.blk.add(shK(x,y)); return g0; };
  return {i,k,el,BX,BY,put,room,hole,gim,keys,G,W:(u,v)=>[BX+u,BY+v]}; }
/* 공통 틀: 바위벽 · 입구 홀(나가는 승강기) · 봉인문 · 정화 결정실 */
function shFrame(B,o){ const FH=o.fh||2, CH=o.ch||FH, Wd=o.w||9, V0=o.v0||-9, V1=o.v1||6, top=Math.max(FH,CH,o.top||0)+3;
  for(let u=-Wd-1;u<=Wd+1;u++) for(let v=-16;v<=12;v++) B.put(u,v,top,'uw');
  B.room(-2,8,2,11,FH,'u'); B.room(-1,V1+1,1,7,FH,'u'); B.put(0,10,FH,'ug');
  if(!o.noRoom) B.room(-Wd,V0,Wd,V1,o.rh!=null?o.rh:FH,'u');
  B.room(-3,-15,3,-11,CH,'u'); B.put(0,-10,CH,'u'); for(let v=V0-1;v>-10;v--) B.put(0,v,CH,'u');
  B.gim('door',0,-10,{grp:'S'+B.i,blk:1,h:CH}); B.gim('core',0,-14,{sh:'u'+B.i,rg:B.el==='plain'?'ice':B.el,shk:B.k,h:CH}); B.gim('shx',0,10,{h:FH});
  B.FH=FH; B.CH=CH; return B; }
/* 바위벽은 모두 막고, 바로 앞(아래쪽) 벽은 낮춰서 안쪽이 잘 보이게 해요 */
function shFinish(M,B){ const fl=(x,y)=>{ const t=M.T.get(shK(x,y)); return t&&t.t!=='uw'; };
  for(const kk of B.keys){ const t=M.T.get(kk); if(!t||t.t!=='uw') continue; M.blk.add(kk); if(fl(t.x-1,t.y)||fl(t.x,t.y-1)||fl(t.x-1,t.y-1)){ const nb=[[t.x-1,t.y],[t.x,t.y-1],[t.x-1,t.y-1]].map(([a,b])=>M.T.get(shK(a,b))).filter(q=>q&&q.t!=='uw').map(q=>q.h); t.h=Math.max(...nb)+1; t.low=1; } } }

/* ═════ 10개 퍼즐 ═════ */
const SH_PUZ={
/* 1) 시야: 거울 반사 */
sight:{build(B,co){ shFrame(B,{}); const E=(u,v,d)=>B.gim('emit',u,v,{dir:d,blk:1}); const Mi=(u,v,o,ok)=>B.gim('mirror',u,v,{o,ok,blk:1});
    if(!co){ E(-8,-6,[1,0]); Mi(-3,-6,0,1); Mi(-3,1,0,1); Mi(4,1,1,0); Mi(-6,3,0); Mi(1,-3,1); B.gim('lcry',4,-8,{need:1,blk:1}); }
    else { E(-8,-1,[1,0]); E(8,-1,[-1,0]); Mi(-4,-1,1,0); Mi(-4,-8,1,0); Mi(4,-1,0,1); Mi(4,-8,0,1); Mi(-1,3,0); Mi(2,3,1); B.gim('lcry',0,-8,{need:2,blk:1}); }
    [[-6,-3],[6,-4],[-1,-5],[2,4]].forEach(([u,v])=>B.put(u,v,B.FH+3,'uw')); },
  tick(s,dt,now,S){ if(S.beamDirty||!S.beams){ S.beamDirty=0; S.beams=shBeams(s); } const C=s.M.gim.find(g=>g.k==='lcry'&&g.sc===S.i); if(C){ const n=S.beams.filter(b=>b.hit===C).length; C.lit=n>=C.need; S.prog=Math.min(1,n/C.need); if(C.lit) shSolve(s); } },
  hit(s,o,S,api,hitG){ const L=hitG('mirror',2.4); if(!L.length) return false; L.forEach(m=>{ m.o=m.o?0:1; m.at=performance.now(); shSync(s,m.id,{o:m.o}); }); S.beamDirty=1; wSfx('block'); haptic(10); return true; },
  dark:1},
/* 2) 바람: 불 붙인 덤불의 상승 기류로 움직이는 고리 통과 */
wind:{build(B,co){ shFrame(B,{ch:7,top:7,rh:1}); const F=B.FH;
    B.room(-9,3,9,6,2,'u'); B.room(-9,-1,9,2,3,'u'); B.put(-9,3,2,'u'); B.put(9,3,2,'u'); [-9,9].forEach(u=>{ B.put(u,2,3,'u'); });
    B.room(-3,-9,3,-8,7,'u'); for(let v=-7;v<=-2;v++) for(let u=-9;u<=9;u++) B.put(u,v,1,'u');
    B.put(-9,-2,2,'u'); B.put(9,-2,2,'u'); B.put(-9,-1,3,'u');
    if(!co){ [[-5,0],[0,1],[5,0]].forEach(([u,v])=>B.gim('grass',u,v,{grp:'w'+u})); [[-5,-4,0,2.2,.9],[0,-6,1,1.6,1.3],[5,-4,0,2.2,1.1]].forEach(([u,v,ax,am,sp],j)=>B.gim('ring',u,v,{z:6.4+j*.3,ax,am,sp,ph:j*2})); }
    else { [[-5,0],[5,0]].forEach(([u,v])=>B.gim('grass',u,v,{grp:'w'+u})); B.gim('brz',-8,1,{blk:1}); B.gim('fan',0,0,{}); [[-6,-5,0,2.6,.8],[0,-7,1,1.2,1.1],[6,-5,0,2.6,1]].forEach(([u,v,ax,am,sp],j)=>B.gim('ring',u,v,{z:8.8+j*.4,ax,am,sp,ph:j*2})); } },
  tick(s,dt,now,S){ const me=s.me; const R=s.M.gim.filter(g=>g.k==='ring'&&g.sc===S.i); let got=0;
    R.forEach(r=>{ const w=Math.sin(now/1000*r.sp+r.ph)*r.am; r.px=r.x+(r.ax===0?w:0); r.py=r.y+(r.ax===1?w:0); if(r.got){ got++; return; }
      if(me.air&&Math.hypot(me.x-r.px,me.y-r.py)<1.15&&Math.abs(me.z-r.z)<1.4){ r.got=1; got++; shSync(s,r.id,{got:1}); wSfx('gem'); haptic([12,30]); s.fx.push({k:'cbring',x:r.px,y:r.py,r:1.6,at:now,el:'ice'}); s.say&&s.say('고리 통과! '+R.filter(q=>q.got).length+' / '+R.length); } });
    S.prog=got/R.length; if(got===R.length) shSolve(s);
    const B0=s.M.gim.find(g=>g.k==='brz'&&g.sc===S.i), FN=s.M.gim.find(g=>g.k==='fan'&&g.sc===S.i); if(B0&&FN){ const on=(B0.on||0)>now; FN.live=on; s.updraft=(s.updraft||[]).filter(u=>u.src!=='fan'); if(on) s.updraft.push({x:FN.x,y:FN.y,end:B0.on,r:1.9,cap:9,src:'fan'}); } },
  hit(s,o,S,api,hitG){ if(o.el!=='fire') return false; const L=hitG('brz',2.6); if(!L.length) return false; L.forEach(b=>{ b.on=performance.now()+8000; shSync(s,b.id,{on:8000}); }); wSfx('gem'); s.say&&s.say('화로가 타올라요 · 8초 동안 큰 기류!'); return true; }},
/* 3) 무게: 천칭 */
weight:{build(B,co){ shFrame(B,{}); const P=(u,v,sid,side)=>{ B.put(u,v,B.FH,'up'); B.gim('plate',u,v,{sid,side}); };
    const scale=(v,id)=>{ P(-4,v,id,'L'); P(-3,v,id,'L'); P(3,v,id,'R'); P(4,v,id,'R'); B.gim('scale',0,v,{sid:id,blk:1}); };
    if(!co){ scale(-4,'a'); B.gim('statue',-4,1,{w:2,blk:1}); B.gim('statue',3,1,{w:1,blk:1}); B.gim('statue',6,-1,{w:1,blk:1}); }
    else { scale(-4,'a'); scale(2,'b'); B.gim('sw',-4,-4,{w:2,blk:1}); B.gim('sw',-4,2,{w:1,blk:1}); B.gim('statue',6,-1,{w:1,blk:1}); } },
  tick(s,dt,now,S){ const M=s.M; const sc=[...new Set(M.gim.filter(g=>g.k==='plate'&&g.sc===S.i).map(g=>g.sc+g.sid))]; const ws={};
    const pl=[]; if(!s.me.air&&!s.me.dead) pl.push([Math.round(s.me.x),Math.round(s.me.y)]); if(s.others) for(const o of s.others.values()) pl.push([Math.round(o.x),Math.round(o.y)]);
    M.gim.filter(g=>g.k==='plate'&&g.sc===S.i).forEach(p=>{ const id=p.sid||p.sc; let w=pl.filter(q=>q[0]===p.x&&q[1]===p.y).length; M.gim.forEach(g=>{ if((g.k==='statue'||g.k==='sw')&&g.sc===S.i&&g.x===p.x&&g.y===p.y) w+=g.w||1; }); const o=ws[id]||(ws[id]={L:0,R:0}); o[p.side]+=w; p.wt=w; });
    let ok=true, nOk=0; M.gim.filter(g=>g.k==='scale'&&g.sc===S.i).forEach(g=>{ const W=ws[g.sid]||{L:0,R:0}; g.L=W.L; g.R=W.R; const b=W.L===W.R&&W.L>0; g.bal=b; if(b) nOk++; else ok=false; });
    const n=M.gim.filter(g=>g.k==='scale'&&g.sc===S.i).length; S.prog=nOk/n; if(ok){ S.balT=(S.balT||0)+dt; if(S.balT>1.2) shSolve(s); } else S.balT=0; }},
/* 4) 균열: 가짜 벽 미로 */
crack:{build(B,co){ shFrame(B,{v0:-9,v1:6}); const F=B.FH; const CW=7, CH=6; const U=cx=>-6+2*cx, V=cy=>-8+2*cy;
    const wall=new Set(); for(let u=-7;u<=7;u++) for(let v=-9;v<=3;v++) wall.add(u+','+v); const open=(u,v)=>wall.delete(u+','+v);
    const seen=new Set(); const st=[[3,CH-1]]; seen.add('3,'+(CH-1)); open(U(3),V(CH-1)); let r=0;
    while(st.length){ const [cx,cy]=st[st.length-1]; const nb=[[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>[cx+a,cy+b]).filter(([a,b])=>a>=0&&b>=0&&a<CW&&b<CH&&!seen.has(a+','+b));
      if(!nb.length){ st.pop(); continue; } const [nx,ny]=nb[Math.floor(wHash(B.i,r++,61)*nb.length)]; seen.add(nx+','+ny); open((U(cx)+U(nx))/2,(V(cy)+V(ny))/2); open(U(nx),V(ny)); st.push([nx,ny]); }
    open(0,3); open(0,-9);
    /* 길 찾기 → 길 위의 연결 칸 3곳을 가짜 벽으로 */
    const prev=new Map([['0,3',null]]); const q=[[0,3]]; while(q.length){ const [u,v]=q.shift(); if(u===0&&v===-9) break; for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){ const k2=(u+a)+','+(v+b); if(wall.has(k2)||prev.has(k2)||u+a<-7||u+a>7||v+b<-9||v+b>3) continue; prev.set(k2,u+','+v); q.push([u+a,v+b]); } }
    const path=[]; for(let k2='0,-9';k2;k2=prev.get(k2)) path.push(k2); const con=path.filter(k2=>{ const [u,v]=k2.split(',').map(Number); return ((u+6)%2!==0||(v+8)%2!==0)&&v<3&&v>-9; });
    const fakes=new Set(); [.2,.5,.8].forEach(f=>{ const k2=con[Math.floor(f*(con.length-1))]; if(k2) fakes.add(k2); });
    const cand=[...wall].filter(k2=>{ const [u,v]=k2.split(',').map(Number); return u>-7&&u<7&&v>-9&&v<3&&!path.includes(k2); }); for(let j=0;j<3&&cand.length;j++){ const k2=cand[Math.floor(wHash(B.i,j,62)*cand.length)]; wall.delete(k2); fakes.add(k2); }
    wall.forEach(k2=>{ const [u,v]=k2.split(',').map(Number); B.gim('mw',u,v,{blk:1}); }); fakes.forEach(k2=>{ const [u,v]=k2.split(',').map(Number); B.gim('mw',u,v,{blk:1,fake:1}); });
    if(co){ for(let v=-9;v<=3;v++){ B.put(-9,v,F+3,'ug'); B.put(-8,v,F+3,'ug'); } B.put(-9,6,F+1,'u'); B.put(-9,5,F+2,'u'); B.put(-9,4,F+3,'u'); B.put(-8,4,F+3,'u'); S_OBS.add(B.i); } else S_OBS.delete(B.i); },
  tick(s,dt,now,S){ if(S_OBS.has(S.i)){ const on=t=>t&&t.t==='ug'&&t.h>=4; const T0=s.M.T.get(shK(Math.round(s.me.x),Math.round(s.me.y))); let v=on(T0)&&!s.me.air; if(s.others) for(const o of s.others.values()){ if(on(s.M.T.get(shK(Math.round(o.x),Math.round(o.y))))) v=true; } S.reveal=v; }
    const D=s.M.gim.find(g=>g.k==='door'&&g.sc===S.i); if(D&&!D.done&&Math.round(s.me.x)===D.x&&Math.round(s.me.y)===D.y+1) shSolve(s);
    const F=s.M.gim.filter(g=>g.k==='mw'&&g.fake&&g.sc===S.i); S.prog=F.filter(g=>g.done).length/Math.max(1,F.length); },
  hit(s,o,S,api,hitG){ const L=hitG('mw',2.3); if(!L.length) return false; const now=performance.now(); const brk=o.el==='earth'||o.shock||o.w==='hammer';
    L.slice(0,1).forEach(w=>{ if(w.fake){ if(brk){ shBreakWall(s,w); shSync(s,w.id,{brk:1}); } else { w.kn=now; s.fx.push({k:'cbring',x:w.x,y:w.y,r:1.1,at:now,el:'ice'}); s.fx.push({k:'num',x:w.x,y:w.y,at:now,t:'텅… 속이 비었어요',col:'#9CE4FF',sm:1}); wSfx('pick'); } }
      else { s.fx.push({k:'num',x:w.x,y:w.y,at:now,t:brk?'꿈쩍도 안 해요':'퉁 · 꽉 찬 소리',col:'#B8B2A2',sm:1}); wSfx('block'); } }); return true; }},
/* 5) 용광로: 차오르는 용암 · 얼음 다리 · 기류 분출구 */
furnace:{build(B,co){ shFrame(B,{w:7,ch:9,top:9,noRoom:1}); for(let u=-7;u<=7;u++) for(let v=-9;v<=6;v++) B.hole(u,v,1);
    const P=[[0,6,2],[0,5,2],[0,4,3],[0,3,3],[0,2,4],[0,0,4],[1,0,4],[2,0,5],[3,0,5],[4,0,5],[4,-1,5],[4,-4,8],[3,-4,8],[2,-4,8],[0,-4,8],[0,-5,8],[0,-6,9],[0,-7,9],[0,-8,9],[0,-9,9],[-1,-6,9],[1,-6,9]];
    P.forEach(([u,v,h])=>B.put(u,v,h,'u',{lv:1})); B.put(4,-1,5,'uv',{lv:1}); B.gim('vent',4,-1,{cap:4}); B.put(-1,5,2,'u',{lv:1}); B.put(-2,5,2,'u',{lv:1});
    [[0,1,4],[1,-4,8]].forEach(([u,v,h])=>{ B.hole(u,v,1); const W=B.W(u,v); B.gim('igap',u,v,{h,blk:0}); });
    if(co){ B.put(-2,5,2,'up',{lv:1}); B.gim('valve',-2,5,{}); B.put(3,-4,8,'up',{lv:1}); B.gim('valve',3,-4,{}); } },
  tick(s,dt,now,S){ const M=s.M, me=s.me; const co=S.coop; const per=co?11000:18000, rise=co?8000:12000, top=co?8:5; const t=Date.now()%per;
    let L=t<rise?1+(top-1)*(t/rise):t<rise+2000?top:top-(top-1)*((t-rise-2000)/(per-rise-2000));
    const held=M.gim.some(g=>g.k==='valve'&&g.sc===S.i&&shOn(s,g)); if(held){ S.drain=Math.min(1,(S.drain||0)+dt/1.2); } else S.drain=Math.max(0,(S.drain||0)-dt/2); L=L-(L-1)*S.drain;
    const Li=Math.floor(L*2)/2; if(Li!==S.lava){ S.lava=Li; s.tc=null; }
    const T0=M.T.get(shK(Math.round(me.x),Math.round(me.y))); if(T0&&(T0.h>S.lava||!T0.lv)&&!me.air) S.safe=[Math.round(me.x),Math.round(me.y)];
    if(T0&&T0.lv&&T0.h<=S.lava&&!me.air&&!me.dead&&now>(S.burnCd||0)){ S.burnCd=now+900; me.hp=Math.max(1,me.hp-22); s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:'용암 -22',col:'#FF7A2A'}); wSfx('hurt'); s.shake=.4; const p=S.safe||B0(S); me.x=p[0]; me.y=p[1]; me.z=dkH(M,p[0],p[1]); me.path=[]; s.say&&s.say('용암에 닿았어요! 높은 곳으로'); }
    M.gim.filter(g=>g.k==='vent'&&g.sc===S.i).forEach(g=>{ const on=(Date.now()%5000)<2600; g.live=on; s.updraft=(s.updraft||[]).filter(u=>u.src!==g.id); if(on) s.updraft.push({x:g.x,y:g.y,end:now+200,r:1.2,cap:g.cap,src:g.id}); });
    S.prog=Math.max(0,Math.min(1,(dkH(M,me.x,me.y)-2)/7)); const D=M.gim.find(g=>g.k==='door'&&g.sc===S.i); if(D&&!D.done&&Math.abs(me.x-D.x)<1.2&&me.y<D.y+2.2&&me.z>8.5) shSolve(s); },
  hit(s,o,S,api,hitG){ if(o.el!=='ice') return false; const L=hitG('igap',3.4); if(!L.length) return false; const now=performance.now(); L.forEach(g=>{ shIceTile(s,g.x,g.y,g.h,6500); shSync(s,g.id,{fz:6500}); }); s.say&&s.say('용암 틈이 얼어붙었어요 · 6초!'); return false; }},
/* 6) 점화: 돌풍 속 화로 4개 */
ignite:{build(B,co){ shFrame(B,{w:8}); const T=(u,v)=>B.gim('torch',u,v,{grp:'I'+B.i,blk:1,h:B.FH}); T(-5,-5); T(5,-5); T(-5,2); T(5,2);
    if(!co){ B.put(-6,-5,B.FH+3,'uw'); B.put(4,2,B.FH+3,'uw'); B.gim('statue',2,-2,{w:2,blk:1}); B.gim('statue',-2,4,{w:2,blk:1}); }
    else { B.gim('statue',0,-2,{w:2,blk:1}); } },
  tick(s,dt,now,S){ const M=s.M; const per=S.coop?9000:7000; const t=Date.now()%per; const dir=S.coop&&Math.floor(Date.now()/per)%2?-1:1; S.wind={warn:t>per-1300,on:t<1900,dir};
    const TT=M.gim.filter(g=>g.k==='torch'&&g.sc===S.i);
    if(t<1900&&!S.gusted){ S.gusted=1; wSfx('swing'); let out=0; TT.forEach(g=>{ if(!g.lit) return; if(!shShield(s,g,dir)){ g.lit=0; out++; s.fx.push({k:'poof',x:g.x,y:g.y,at:now,c:'#B8B2A2'}); } }); if(out) s.say&&s.say('돌풍에 화로 '+out+'개가 꺼졌어요!'); }
    if(t>=1900) S.gusted=0; const full=TT.filter(g=>g.lit&&now-(g.litAt||g.at||0)>2200).length; S.prog=full/TT.length; if(full===TT.length) shSolve(s); },
  wind:1},
/* 7) 시간 정지: 떨어지는 돌 얼리기 · 톱니 */
gear:{build(B,co){ shFrame(B,{w:8}); for(let v=-4;v<=-1;v++) for(let u=-8;u<=8;u++){ const W=B.W(u,v); const kk=shK(W[0],W[1]); B.s_M.T.delete(kk); }
    [-1,-2,-3,-4].forEach((v,j)=>B.gim('fblock',0,v,{ph:j*.55,h:B.FH})); B.gim('gear',0,-7,{R:3.4,blk:1,co:co?1:0}); B.gim('pad',0,-9,{grp:'I'+B.i}); if(co) B.gim('lever',-6,2,{blk:1}); },
  tick(s,dt,now,S){ const M=s.M, me=s.me; const G=M.gim.find(g=>g.k==='gear'&&g.sc===S.i); if(G){ const fz=(G.fz||0)>now; if(!fz) G.a=(G.a||0)+dt*1.25; G.frz=fz;
      if(!fz&&!me.dead&&!me.air&&now>(S.gCd||0)){ for(let j=0;j<4;j++){ const a=G.a+j*Math.PI/2; const ax=Math.cos(a), ay=Math.sin(a); const dx=me.x-G.x, dy=me.y-G.y; const al=dx*ax+dy*ay, pp=Math.abs(-dx*ay+dy*ax); if(al>.4&&al<G.R+.3&&pp<.65){ S.gCd=now+900; me.hp=Math.max(1,me.hp-18); s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:'톱니 -18',col:'#9CD2FF'}); wSfx('hurt'); s.shake=.35; if(typeof phKnock==='function') phKnock(me,dx,dy,7); break; } } } }
    M.gim.filter(g=>g.k==='fblock'&&g.sc===S.i).forEach(g=>{ const T0=M.T.get(shK(g.x,g.y)); if(T0){ g.z=null; return; } const c=(Date.now()/1000/2.4+g.ph)%1; g.z=c<.7?S.FH+9-(c/.7)*12:null; });
    const P=M.gim.find(g=>g.k==='pad'&&g.sc===S.i); if(P&&dkPadOn(s,P)) shSolve(s); S.prog=Math.max(0,Math.min(1,(B0(S)[1]-me.y)/18)); },
  hit(s,o,S,api,hitG){ if(o.el!=='ice') return false; const now=performance.now(); let any=false;
    hitG('fblock',3.6).forEach(g=>{ if(g.z!=null&&g.z<S.FH+5&&g.z>S.FH-2.5){ shIceTile(s,g.x,g.y,S.FH,S.coop?5500:7000); g.z=null; shSync(s,g.id,{fz:S.coop?5500:7000}); any=true; } });
    if(any){ s.say&&s.say('돌이 얼어붙었어요 · 발판으로!'); wSfx('gem'); }
    const G=s.M.gim.find(g=>g.k==='gear'&&g.sc===S.i);
    if(G&&!S.coop&&hitG('gear',G.R+.8).length){ G.fz=now+5000; shSync(s,G.id,{fz:5000}); s.say&&s.say('톱니가 멈췄어요 · 5초!'); any=true; }
    if(G&&S.coop){ if(hitG('lever',2.6).length){ G.fz=now+3500; shSync(s,G.id,{fz:3500}); s.say&&s.say('레버 결정이 톱니를 붙잡았어요 · 3.5초'); any=true; } else if(hitG('gear',G.R+.8).length){ s.say&&s.say('톱니 중심이 보호막에 싸여 있어요 · 레버 결정을 얼려요'); } }
    return any; }},
/* 8) 거울 얼음: 미끄럼 퍼즐 */
slide:{build(B,co){ shFrame(B,{w:6,v0:-9,v1:6}); const rk=[[4,6],[8,8],[1,2],[5,1],[3,7],[6,5],[1,6]];
    for(let x=0;x<9;x++) for(let y=0;y<9;y++) B.put(x-4,y-9,B.FH,'us'); for(let v=-9;v<=-1;v++){ B.put(-5,v,B.FH+3,'uw'); B.put(5,v,B.FH+3,'uw'); B.put(-6,v,B.FH+3,'uw'); B.put(6,v,B.FH+3,'uw'); }
    rk.forEach(([x,y])=>B.gim('rock',x-4,y-9,{blk:1})); B.put(6-4,3-9,B.FH,'ur'); B.gim('goal',2,-6,{});
    if(!co){ B.gim('iblock',2-4,1-9,{blk:1}); B.gim('iblock',3-4,5-9,{blk:1}); } },
  tick(s,dt,now,S){ shSlideTick(s,dt,now,S); const G=s.M.gim.find(g=>g.k==='goal'&&g.sc===S.i); if(G&&!s.me.sl&&Math.round(s.me.x)===G.x&&Math.round(s.me.y)===G.y&&!S.solved){ shSolve(s); shMelt(s,S); } }},
/* 9) 전류: 금속 큐브 · 물웅덩이 회로 */
circuit:{build(B,co){ shFrame(B,{w:8}); const F=B.FH;
    if(!co){ for(let u=-6;u<=6;u++) B.put(u,-3,F,'uwi'); B.put(-2,-3,F,'u'); B.put(3,-3,F+3,'uw'); B.put(2,-2,F,'uwi'); B.put(2,-1,F,'uq'); B.put(3,-1,F,'u'); B.put(4,-1,F,'uq'); B.put(4,-2,F,'uwi');
      [[-4,2],[-5,3],[5,4],[6,3]].forEach(([u,v])=>B.put(u,v,F,'uq'));
      B.gim('gen',-7,-3,{blk:1}); B.gim('lamp',7,-3,{blk:1}); B.gim('statue',-2,1,{blk:1,w:1,metal:1}); B.gim('statue',3,2,{blk:1,w:1,metal:1}); }
    else { for(let u=-6;u<=6;u++) B.put(u,-3,F,'uwi'); for(let v=-6;v<=4;v++) B.put(0,v,F,'uwi'); B.gim('totem',-7,-6,{grp:'I'+B.i,win:4000,blk:1}); B.gim('totem',7,-6,{grp:'I'+B.i,win:4000,blk:1}); B.gim('totem',0,5,{grp:'I'+B.i,win:4000,blk:1}); B.gim('lamp',7,-3,{blk:1}); } },
  tick(s,dt,now,S){ const M=s.M; const TT=M.gim.filter(g=>g.k==='totem'&&g.sc===S.i); if(TT.length){ const n=TT.filter(g=>g.pw>now).length; S.prog=n/TT.length; if(n===TT.length){ shSolve(s); M.gim.forEach(g=>{ if(g.k==='lamp'&&g.sc===S.i) g.lit=1; }); } } },
  hit(s,o,S,api,hitG){ if(o.el!=='bolt') return false; const L=hitG('gen',3.4); if(!L.length) return false; const r=shCircuit(s,S); const now=performance.now(); S.zap={at:now,path:r.path,ok:r.ok};
    if(r.ok){ shSolve(s); s.M.gim.forEach(g=>{ if(g.k==='lamp'&&g.sc===S.i) g.lit=1; }); wSfx('gem'); s.say&&s.say('회로 연결! 등불이 켜졌어요'); } else { wSfx('block'); s.say&&s.say('찌릿… 회로가 끊겨 있어요'); }
    const me=s.me, T0=M_(s).T.get(shK(Math.round(me.x),Math.round(me.y))); if(T0&&T0.t==='uq'&&r.path.some(p=>p[0]===Math.round(me.x)&&p[1]===Math.round(me.y))){ me.hp=Math.max(1,me.hp-10); s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:'찌릿 -10',col:'#FFE45A'}); } return true; }},
/* 10) 공명: 4원소 봉인 */
reso:{build(B,co){ shFrame(B,{w:8}); const P=co?[[-7,-7,'earth'],[7,-7,'fire'],[-7,4,'ice'],[7,4,'bolt']]:[[-4,-5,'earth'],[4,-5,'fire'],[-4,2,'ice'],[4,2,'bolt']]; P.forEach(([u,v,el])=>B.gim('epil',u,v,{el,blk:1})); },
  tick(s,dt,now,S){ const L=s.M.gim.filter(g=>g.k==='epil'&&g.sc===S.i); if(S.coop){ const n=L.filter(g=>(g.on||0)>now).length; S.prog=n/4; S.seal=n; if(n===4) shSolve(s); }
    else { if(S.seq&&S.seq.length&&now-S.seqAt>6000){ S.seq=[]; s.say&&s.say('공명이 흩어졌어요 · 대지부터 다시'); wSfx('block'); } S.seal=(S.seq||[]).length; S.prog=S.seal/4; if(S.seal>=4) shSolve(s); } },
  hit(s,o,S,api,hitG){ const L=hitG('epil',2.6); if(!L.length||!o.el) return false; const now=performance.now(); const p=L[0];
    if(p.el!==o.el){ s.say&&s.say(GE_EL[p.el].n+' 원소로 쳐야 깨어나요'); return true; }
    if(S.coop){ p.on=now+6000; shSync(s,p.id,{on:6000}); s.fx.push({k:'cbring',x:p.x,y:p.y,r:1.6,at:now,el:p.el}); wSfx('gem'); return true; }
    const ORD=['earth','fire','ice','bolt']; S.seq=S.seq||[]; if(ORD[S.seq.length]===p.el){ S.seq.push(p.el); S.seqAt=now; p.on=now+6000; s.fx.push({k:'cbring',x:p.x,y:p.y,r:1.8,at:now,el:p.el,big:1}); wSfx('gem'); haptic([10,30]); s.say&&s.say('봉인 '+S.seq.length+' / 4 해제'); }
    else { S.seq=[]; L.forEach(g=>g.on=0); s.M.gim.forEach(g=>{ if(g.k==='epil'&&g.sc===S.i) g.on=0; }); s.say&&s.say('순서가 틀렸어요 · 대지 → 불 → 얼음 → 번개'); wSfx('block'); s.shake=.3; } return true; }}
};
const S_OBS=new Set();
const M_=s=>s.M;
const B0=S=>[400+S.i*60,409];
/* ── 공통 장치 처리 ── */
function shOn(s,g){ const X=g.x, Y=g.y; if(!s.me.air&&!s.me.dead&&Math.round(s.me.x)===X&&Math.round(s.me.y)===Y) return true; if(s.others) for(const o of s.others.values()) if(Math.round(o.x)===X&&Math.round(o.y)===Y) return true; return false; }
function shIceTile(s,x,y,h,ms){ const M=s.M, now=performance.now(); const kk=shK(x,y); if(M.T.has(kk)&&!M.T.get(kk).ice) return; M.T.set(kk,{x,y,h,t:'i',rg:'und',u:1,ice:now+ms}); s.ice=(s.ice||[]).filter(q=>q!==kk).concat([kk]); s.tc=null; s.fx.push({k:'cbring',x,y,r:1.1,at:now,el:'ice'}); }
function shBreakWall(s,g,quiet){ const M=s.M; if(g.done) return; g.done=1; g.at=performance.now(); M.blk.delete(shK(g.x,g.y)); s.fx.push({k:'cbring',x:g.x,y:g.y,r:1.4,at:g.at,el:'earth',big:1}); if(!quiet){ s.shake=Math.max(s.shake||0,.45); wSfx('slam'); s.say&&s.say('와르르! 가짜 벽이 무너졌어요'); } }
/* 바람막이: 바람이 오는 쪽 바로 옆에 벽 · 석상 · 크루가 있으면 안 꺼져요 */
function shShield(s,g,dir){ const M=s.M; const wx=g.x-dir, wy=g.y; const t=M.T.get(shK(wx,wy)); if(t&&t.t==='uw') return true;
  if(M.gim.some(o=>(o.k==='statue'||o.k==='sw')&&o.x===wx&&o.y===wy)) return true;
  const ps=[]; if(!s.me.dead) ps.push({x:s.me.x,y:s.me.y,tk:s.cb&&s.cb.role==='tank'}); if(s.others) for(const o of s.others.values()) ps.push({x:o.x,y:o.y,tk:o.cb&&o.cb.r==='tank'});
  return ps.some(p=>{ const dx=p.x-g.x, dy=p.y-g.y; return dx*dir<-.3&&Math.abs(dx)<(p.tk?2.6:1.6)&&Math.abs(dy)<(p.tk?1.6:.8); }); }
/* 빛줄기 계산 */
function shBeams(s){ const M=s.M, S=s.sh; const GM=new Map(); M.gim.forEach(g=>{ if(g.sc===S.i&&!g.done) GM.set(shK(g.x,g.y),g); }); const out=[];
  M.gim.filter(g=>g.k==='emit'&&g.sc===S.i).forEach(E=>{ let x=E.x, y=E.y, d=E.dir.slice(); const pts=[[x,y]]; let hit=null;
    for(let n=0;n<80;n++){ x+=d[0]; y+=d[1]; const t=M.T.get(shK(x,y)); const g=GM.get(shK(x,y)); if(g&&g.k==='mirror'){ pts.push([x,y]); d=g.o?[d[1],d[0]]:[-d[1],-d[0]]; continue; }
      if(g&&g.k==='lcry'){ pts.push([x,y]); hit=g; break; } if(!t||t.t==='uw'||(g&&g.blk)){ pts.push([x-d[0]*.5,y-d[1]*.5]); break; } }
    out.push({pts,hit}); }); return out; }
/* 회로: 발전기에서 전기가 통하는 칸(전선 · 물웅덩이 · 금속 큐브)을 따라가요 */
function shCircuit(s,S){ const M=s.M; const gen=M.gim.find(g=>g.k==='gen'&&g.sc===S.i), lamp=M.gim.find(g=>g.k==='lamp'&&g.sc===S.i); if(!gen||!lamp) return {ok:false,path:[]};
  const cube=new Set(M.gim.filter(g=>g.k==='statue'&&g.metal&&g.sc===S.i).map(g=>shK(g.x,g.y))); const cond=(x,y)=>{ const t=M.T.get(shK(x,y)); return cube.has(shK(x,y))||(t&&(t.t==='uwi'||t.t==='uq')); };
  const seen=new Set([shK(gen.x,gen.y)]); const q=[[gen.x,gen.y]]; const path=[]; let ok=false;
  while(q.length){ const [x,y]=q.shift(); path.push([x,y]); for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+a, ny=y+b, kk=shK(nx,ny); if(seen.has(kk)) continue; if(nx===lamp.x&&ny===lamp.y){ ok=true; path.push([nx,ny]); continue; } if(!cond(nx,ny)) continue; seen.add(kk); q.push([nx,ny]); } }
  M.T.forEach(t=>{ if(t.u&&t.t==='uwi'&&t.x>=400+S.i*60-20&&t.x<=400+S.i*60+20) t.pw=ok?1:0; }); s.tc=null; return {ok,path}; }
/* 미끄럼: 빙판에 들어서면 막힐 때까지 미끄러져요 */
function shSlideTick(s,dt,now,S){ const M=s.M, me=s.me; const cell=[Math.round(me.x),Math.round(me.y)]; const T0=M.T.get(shK(cell[0],cell[1])); const ice=t=>t&&t.t==='us';
  const blocked=(x,y)=>{ const t=M.T.get(shK(x,y)); if(!t||t.t==='uw'||M.blk.has(shK(x,y))) return true; if(Math.abs(t.h-(T0?T0.h:2))>1) return true; if(s.others) for(const o of s.others.values()) if(Math.round(o.x)===x&&Math.round(o.y)===y) return true; return false; };
  if(me.sl){ const L=me.sl; L.t+=dt*7.5; while(L.t>=1){ L.t-=1; L.from=L.to; const tt=M.T.get(shK(L.from[0],L.from[1])); const nx=L.from[0]+L.d[0], ny=L.from[1]+L.d[1];
      if(!ice(tt)||M.gim.some(g=>g.k==='goal'&&g.x===L.from[0]&&g.y===L.from[1])||blocked(nx,ny)){ me.x=L.from[0]; me.y=L.from[1]; me.sl=null; wSfx('block',.5); break; } L.to=[nx,ny]; }
    if(me.sl){ me.x=L.from[0]+(L.to[0]-L.from[0])*L.t; me.y=L.from[1]+(L.to[1]-L.from[1])*L.t; } me.path=[]; me.v=0; S.lp=[me.x,me.y]; return; }
  const lp=S.lp||[me.x,me.y]; const dx=me.x-lp[0], dy=me.y-lp[1]; S.lp=[me.x,me.y];
  if(ice(T0)&&!me.air&&(Math.abs(dx)>.004||Math.abs(dy)>.004)){ const d=Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)];
    /* 앞에 얼음 블록이 있으면 밀어요 */
    const bx=cell[0]+d[0], by=cell[1]+d[1]; const IB=M.gim.find(g=>g.k==='iblock'&&g.x===bx&&g.y===by&&g.sc===S.i); if(IB){ shPushIce(s,IB,d); me.x=cell[0]; me.y=cell[1]; S.lp=[me.x,me.y]; return; }
    if(blocked(bx,by)){ me.x=cell[0]; me.y=cell[1]; S.lp=[me.x,me.y]; return; } me.sl={from:cell,to:[bx,by],d,t:0}; me.x=cell[0]; me.y=cell[1]; wSfx('swing',.5); }
  /* 빙판 밖에서 블록 쪽으로 밀기 */
  else if(!ice(T0)&&s.joy&&(Math.abs(s.joy[0])>.3||Math.abs(s.joy[1])>.3)){ const [wx,wy]=wJoyDir(s.joy[0],s.joy[1]); const d=Math.abs(wx)>Math.abs(wy)?[Math.sign(wx),0]:[0,Math.sign(wy)]; const IB=M.gim.find(g=>g.k==='iblock'&&g.x===cell[0]+d[0]&&g.y===cell[1]+d[1]&&g.sc===S.i); if(IB){ S.pT=(S.pT||0)+dt; if(S.pT>.35){ S.pT=0; shPushIce(s,IB,d); } } else S.pT=0; } }
function shPushIce(s,g,d,quiet){ const M=s.M; let x=g.x, y=g.y; const S=s.sh;
  for(let n=0;n<12;n++){ const nx=x+d[0], ny=y+d[1], kk=shK(nx,ny); const t=M.T.get(kk); if(!t||t.t!=='us'||M.blk.has(kk)) break; if(M.gim.some(q=>q.k==='goal'&&q.x===nx&&q.y===ny)) break; if(Math.round(s.me.x)===nx&&Math.round(s.me.y)===ny) break; x=nx; y=ny; }
  if(x===g.x&&y===g.y){ if(!quiet) s.say&&s.say('더 밀 수 없어요'); return; } M.blk.delete(shK(g.x,g.y)); g.x=x; g.y=y; M.blk.add(shK(x,y)); g.at=performance.now(); if(!quiet){ wSfx('block'); s.shake=Math.max(s.shake||0,.2); shSync(s,g.id,{mv:[x,y]}); } }
function shMelt(s,S){ s.M.T.forEach(t=>{ if(t.u&&t.t==='us'&&Math.abs(t.x-(400+S.i*60))<12) t.t='u'; }); s.tc=null; s.say&&s.say('빙판이 녹아 길이 열렸어요!'); }
function shStep(){ }
/* ── 퍼즐 성공 → 봉인문 열기 ── */
function shSolve(s,remote){ const S=s.sh; if(!S||S.solved) return; S.solved=1; S.solvedAt=performance.now(); const M=s.M; M.gim.forEach(g=>{ if(g.sc===S.i&&g.k==='door'&&!g.done){ g.done=1; g.at=performance.now(); M.blk.delete(shK(g.x,g.y)); } });
  if(S.k==='slide') shMelt(s,S);
  wSfx('gate'); haptic([20,40,70]); s.shake=Math.max(s.shake||0,.4); s.dkBanner={t:'봉인 해제!',b:'안쪽 정화 결정으로 가요',k:performance.now()}; if(!remote) shSync(s,'solve',1); }
/* 정화 후: 돌아가는 승강기가 결정 옆에 생겨요 · 최고 기록 */
function shOnClear(s,g0,api){ const S=s.sh; if(!S) return; const M=s.M; const sec=Math.round((performance.now()-S.t0)/1000); const B=s.dk.shb||(s.dk.shb={}); const best=B[S.k]; if(!best||sec<best) B[S.k]=sec; s.dkDirty=1;
  ssGain(s,S.coop?2:1,'지하 사당 보너스'); M.gim.push({k:'shx',x:g0.x+2,y:g0.y+1,sc:S.i,id:'s'+S.i+'_x2',h:g0.h}); S.cleared=1;
  s.dkBanner={...s.dkBanner,b:(s.dkBanner&&s.dkBanner.b||'')+' · 기록 '+Math.floor(sec/60)+'분 '+(sec%60)+'초'+(best&&sec<best?' (최고 기록!)':'')}; }
/* ── 들어가기 · 나가기 ── */
function shEnter(s,G){ const M=s.M; const SH=M.shr.find(x=>x.id===G.sh); if(!SH||s.shBusy) return; const I=SH_INFO[SH.k]; const now=performance.now();
  const near=s.others?[...s.others.values()].filter(o=>Math.hypot(o.x-SH.x,o.y-SH.y)<12||(Math.abs(o.x-(400+SH.i*60))<14&&Math.abs(o.y-400)<20)).length:0;
  const coop=(s.ptyN||1)>1||near>0; const n2=Math.max(2,Math.min(4,Math.max(s.ptyN||1,near+1)));
  s.shBusy=1; s.me.path=[]; wSfx('tp'); haptic([20,40,60]);
  shLoad({n:I.n,e:'지하 사당 · '+(DK_RG[SH.rg]||DK_RG.plain).n,hint:I.hint[coop?1:0],mode:coop?'크루 '+n2+'명 · 협동 시험':'혼자 · 솔로 시험',c:I.c},()=>{
    shClear(M); const B=shBuilder(M,SH.i,SH.k); B.s_M=M; SH_PUZ[SH.k].build(B,coop); shFinish(M,B); B.G.forEach(g=>{ M.gim.push(g); if(g.blk) M.blk.add(shK(g.x,g.y)); }); M.shKeys=B.keys;
    s.sh={i:SH.i,id:SH.id,k:SH.k,coop,n2,t0:performance.now(),FH:B.FH,lava:null,prog:0}; s.inSh=SH.id; s.shRet=SH.e.slice(); s.shRetSp=s.spawnPt; const sp=[400+SH.i*60,409];
    s.spawnPt=sp.slice(); const me=s.me; me.x=sp[0]; me.y=sp[1]; me.z=dkH(M,sp[0],sp[1]); me.air=false; me.glide=false; me.vz=0; me.sl=null; me.ty=Math.PI; s.cam.x=me.x; s.cam.y=me.y; s.cam.h=me.z; s.tc=null; s.lastSafe=sp.slice();
    s.mobs=s.mobs.filter(m=>m.boss||m.camp!=null); s.updraft=[]; s.rgNow='und'; s.temp={c:18,st:0,rg:'und'}; s.dkBanner=null; s.shBusy=0; s.shArm=0; s.pingNow&&s.pingNow(); }); }
function shExitNow(s){ if(!s.inSh||s.shBusy) return; const M=s.M; const SH=M.shr.find(x=>x.id===s.inSh); const I=SH_INFO[SH.k]; s.shBusy=1; wSfx('tp');
  shLoad({n:'디코아 대륙',e:'지상으로',hint:s.sh&&s.sh.cleared?I.n+' 정화 완료!':'언제든 다시 도전할 수 있어요',mode:(DK_RG[SH.rg]||DK_RG.plain).n,c:I.c,out:1},()=>{
    const me=s.me; const p=s.shRet; me.x=p[0]; me.y=p[1]; me.z=dkH(M,p[0],p[1]); me.air=false; me.glide=false; me.sl=null; me.path=[]; s.cam.x=me.x; s.cam.y=me.y; s.cam.h=me.z; s.tc=null; s.spawnPt=s.shRetSp||p.slice(); s.lastSafe=p.slice();
    s.inSh=null; s.sh=null; s.updraft=[]; s.rgNow=null; s.shCd=performance.now()+2500; shClear(M); s.shBusy=0; s.pingNow&&s.pingNow(); }); }
function shClear(M){ if(M.shKeys) M.shKeys.forEach(kk=>{ M.T.delete(kk); M.WT.delete(kk); M.blk.delete(kk); }); M.shKeys=null; for(let i=M.gim.length-1;i>=0;i--) if(M.gim[i].sc!=null){ M.blk.delete(shK(M.gim[i].x,M.gim[i].y)); M.gim.splice(i,1); } }
/* ── 매 프레임 ── */
function shTick(s,dt,now,api){ const M=s.M, me=s.me; s.shExit=()=>shExitNow(s);
  if(!s.inSh){ if(me.air||me.dead||s.shBusy||now<(s.shCd||0)) return; const G=M.gim.find(g=>g.k==='shg'&&Math.round(me.x)===g.x&&Math.round(me.y)===g.y); if(G) shEnter(s,G); return; }
  const S=s.sh; if(!S||s.shBusy) return; const P=SH_PUZ[S.k]; if(P.tick) P.tick(s,dt,now,S);
  const X=M.gim.filter(g=>g.k==='shx'&&g.sc===S.i); const onX=X.some(g=>Math.round(me.x)===g.x&&Math.round(me.y)===g.y&&!me.air); if(!onX) s.shArm=1; else if(s.shArm) shExitNow(s); }
/* 공격이 장치에 닿았을 때 (참이면 원래 기믹 처리는 건너뛰어요) */
function shHit(s,o,api){ const S=s.sh; if(!S) return false; const P=SH_PUZ[S.k]; const me=s.me;
  const hitG=(k,rng)=>s.M.gim.filter(g=>g.k===k&&g.sc===S.i&&!g.done&&(()=>{ const dx=g.x-me.x, dy=g.y-me.y, d=Math.hypot(dx,dy);
    if(o.hit==='aoe'&&o.tp) return Math.hypot(g.x-o.tp[0],g.y-o.tp[1])<=Math.max(1.9,rng*.6); if(d>Math.max(rng,(o.rng||2)+.7)) return false; if(d<1.1) return true; const c=(dx*o.D[0]+dy*o.D[1])/d; return c>(o.hit==='proj'||o.hit==='line'?.82:.4); })()).sort((a,b)=>{ const da=Math.hypot(a.x-me.x-o.D[0]*.6,a.y-me.y-o.D[1]*.6), db=Math.hypot(b.x-me.x-o.D[0]*.6,b.y-me.y-o.D[1]*.6); return da-db; });
  if(S.k==='slide'){ const L=hitG('iblock',2.2); if(L.length){ const D=Math.abs(o.D[0])>Math.abs(o.D[1])?[Math.sign(o.D[0]),0]:[0,Math.sign(o.D[1])]; shPushIce(s,L[0],D); return true; } }
  return P.hit?P.hit(s,o,S,api,hitG):false; }
/* ── HUD ── */
function shHud(s,now){ const S=s.sh; if(!S) return null; const I=SH_INFO[S.k]; const best=(s.dk.shb||{})[S.k];
  return {n:I.n,obj:S.solved?(S.cleared?'정화 완료! 결정 옆 승강기로 나가요':'봉인 해제 · 정화 결정에 닿아요'):I.obj+(best?' · 최고 '+Math.floor(best/60)+':'+String(best%60).padStart(2,'0'):''),coop:S.coop,n2:S.n2,c:I.c,prog:S.solved?1:S.prog||0,done:!!S.solved}; }

/* ═════ 그리기 ═════ */
const SH_DRAW={
  shg(g,e,s,u,tm,now,C){ const G0=e.g; const px=e.px, py=e.py; const done=!!s.dk.sh[G0.sh]; const I=SH_INFO[G0.shk]; const c=I.c; const pr=[-G0.dir[1],G0.dir[0]]; const T=8.5;
    const pp=(a,b)=>[px+(a-b)*u*T,py+(a+b)*u*T*.5];
    const pl=.5+.5*Math.sin(tm*2.2+G0.x); g.save(); const rg=g.createRadialGradient(px,py,0,px,py,u*16); rg.addColorStop(0,c+(done?'55':'99')); rg.addColorStop(1,c+'00'); g.fillStyle=rg; g.beginPath(); g.ellipse(px,py,u*16,u*8,0,0,Math.PI*2); g.fill();
    g.strokeStyle=c; g.lineWidth=u*.8; g.globalAlpha=.5+pl*.4; for(let i=0;i<3;i++){ const k=((tm*.6+i/3)%1); g.beginPath(); g.ellipse(px,py,u*(2+k*5),u*(1+k*2.5),0,0,Math.PI*2); g.globalAlpha=(1-k)*.8; g.stroke(); } g.globalAlpha=1;
    /* 승강기 발판 */ g.fillStyle='#2A2E48'; g.beginPath(); g.ellipse(px,py,u*5.2,u*2.6,0,0,Math.PI*2); g.fill(); g.fillStyle=c; g.globalAlpha=.55+pl*.35; g.beginPath(); g.ellipse(px,py-u*.3,u*4,u*2,0,0,Math.PI*2); g.fill(); g.globalAlpha=1;
    g.save(); g.translate(px,py-u*.3); g.scale(1,.5); g.rotate(tm*.5); g.strokeStyle='rgba(255,255,255,.75)'; g.lineWidth=u*.5; for(let i=0;i<6;i++){ g.rotate(Math.PI/3); g.beginPath(); g.moveTo(u*1.2,0); g.lineTo(u*3.2,0); g.stroke(); } g.restore();
    /* 석문 기둥 두 개 + 상인방 */
    [1,-1].forEach(sg=>{ const [qx,qy]=pp(pr[0]*sg,pr[1]*sg); wCube(g,qx,qy,u,-1.8,-1.8,0,3.6,3.6,13,'#6A6E8A',{t:'#9AA0BC',l:'#7A7E9C',r:'#565A78'}); wCube(g,qx,qy,u,-1.5,-1.5,3,3,3,.6,c,{t:c,l:c,r:c}); wCube(g,qx,qy,u,-1.5,-1.5,8,3,3,.6,c,{t:c,l:c,r:c}); });
    { const [ax,ay]=pp(pr[0],pr[1]), [bx,by]=pp(-pr[0],-pr[1]); g.fillStyle='#7A7E9C'; g.strokeStyle='#4A4E6A'; g.lineWidth=1.2; g.beginPath(); g.moveTo(ax-u*2,ay-u*13); g.lineTo(bx+u*2,by-u*13); g.lineTo(bx+u*2,by-u*16.5); g.lineTo(ax-u*2,ay-u*16.5); g.closePath(); g.fill(); g.stroke();
      g.fillStyle=c; g.globalAlpha=.7+pl*.3; g.beginPath(); g.arc((ax+bx)/2,(ay+by)/2-u*14.8,u*1.3,0,Math.PI*2); g.fill(); g.globalAlpha=1; }
    for(let i=0;i<8;i++){ const k=((tm*.5+i/8)%1); g.fillStyle=i%2?'#FFFFFF':c; g.globalAlpha=(1-k)*.9; g.fillRect(px+Math.cos(i*2.4+tm)*u*3-u*.35,py-k*u*16,u*.7,u*.7); } g.globalAlpha=1;
    if(done){ g.fillStyle='#7CF0B5'; g.font='900 '+Math.max(11,u*3)+'px sans-serif'; g.textAlign='center'; g.fillText('✓',px,py-u*19); } g.restore(); },
  shx(g,e,s,u,tm){ const px=e.px, py=e.py; const pl=.5+.5*Math.sin(tm*3); g.fillStyle='#22263C'; g.beginPath(); g.ellipse(px,py,u*5,u*2.5,0,0,Math.PI*2); g.fill(); g.fillStyle='rgba(124,240,181,'+(.45+pl*.4)+')'; g.beginPath(); g.ellipse(px,py-u*.3,u*3.8,u*1.9,0,0,Math.PI*2); g.fill();
    for(let i=0;i<5;i++){ const k=((tm*.8+i/5)%1); g.fillStyle='rgba(200,255,224,'+(1-k)+')'; g.fillRect(px+Math.cos(i*1.3)*u*2.4-u*.3,py-k*u*12,u*.6,u*.6); } g.fillStyle='rgba(255,255,255,.9)'; g.font='900 '+Math.max(10,u*2.4)+'px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.fillText('▲ 지상으로',px,py-u*13); },
  emit(g,e,s,u,tm,now,C){ C(-2.4,-2.4,0,4.8,4.8,6,'#5A5E7A',{t:'#7A7E9C'}); const d=e.g.dir; g.fillStyle='#FFF6C8'; const [qx,qy]=[e.px+(d[0]-d[1])*u*2.6,e.py+(d[0]+d[1])*u*1.3-u*4]; g.beginPath(); g.arc(qx,qy,u*1.5,0,Math.PI*2); g.fill(); },
  mirror(g,e,s,u,tm,now,C){ const G0=e.g; C(-2,-2,0,4,4,1.2,'#5A5E7A'); const t=Math.min(1,(now-(G0.at||0))/250); const a=(G0.o?1:-1)*Math.PI/4; g.save(); g.translate(e.px,e.py-u*5);
    const ex=Math.cos(a)*u*4, ey=Math.sin(a)*u*2; g.strokeStyle='#E8F6FF'; g.lineWidth=u*1.6; g.beginPath(); g.moveTo(-ex,-ey); g.lineTo(ex,ey); g.stroke(); g.strokeStyle='rgba(124,200,255,.8)'; g.lineWidth=u*.6; g.beginPath(); g.moveTo(-ex,-ey-u*.6); g.lineTo(ex,ey-u*.6); g.stroke(); g.restore();
    if(t<1){ g.strokeStyle='rgba(255,255,255,'+(1-t)+')'; g.lineWidth=2; g.beginPath(); g.ellipse(e.px,e.py-u*5,u*5*(1+t),u*2.5*(1+t),0,0,Math.PI*2); g.stroke(); } },
  lcry(g,e,s,u,tm,now,C){ const lit=e.g.lit; C(-2,-2,0,4,4,1.6,'#5A5E7A'); const b=Math.sin(tm*2)*u*.5; g.fillStyle=lit?'#FFFFFF':'#7CA8D8'; g.beginPath(); g.moveTo(e.px,e.py-u*13+b); g.lineTo(e.px+u*2.8,e.py-u*7+b); g.lineTo(e.px,e.py-u*2+b); g.lineTo(e.px-u*2.8,e.py-u*7+b); g.closePath(); g.fill(); },
  ring(g,e,s,u,tm,now){ const r=e.g; if(r.px==null) return; const [px,py]=s.scr(r.px,r.py,r.z); g.save(); g.lineWidth=u*1.4; g.strokeStyle=r.got?'rgba(124,240,181,.55)':'#FFD54A'; g.beginPath(); g.ellipse(px,py,u*5,u*6.5,0,0,Math.PI*2); g.stroke(); g.strokeStyle=r.got?'rgba(255,255,255,.3)':'rgba(255,255,255,.8)'; g.lineWidth=u*.5; g.beginPath(); g.ellipse(px,py,u*4.2,u*5.7,0,0,Math.PI*2); g.stroke();
    const [sx,sy]=s.scr(r.px,r.py); g.fillStyle='rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(sx,sy,u*3,u*1.5,0,0,Math.PI*2); g.fill(); g.restore(); },
  brz(g,e,s,u,tm,now,C){ const on=(e.g.on||0)>now; C(-2.2,-2.2,0,4.4,4.4,4,'#5A4A48',{t:'#7A6A68'}); if(on){ const f=1+Math.sin(tm*9)*.3; C(-1.6,-1.6,4,3.2,3.2,3*f,'#FF6A1A',{t:'#FFC04A'}); } else { g.fillStyle='rgba(255,140,60,.7)'; g.font='900 '+Math.max(10,u*2.6)+'px sans-serif'; g.textAlign='center'; g.fillText('🔥',e.px,e.py-u*9); } },
  fan(g,e,s,u,tm,now){ const on=e.g.live; g.fillStyle=on?'rgba(200,255,230,.35)':'rgba(120,130,160,.35)'; g.beginPath(); g.ellipse(e.px,e.py,u*7,u*3.5,0,0,Math.PI*2); g.fill(); if(on){ g.strokeStyle='rgba(255,255,255,.5)'; g.lineWidth=u*.6; for(let i=0;i<4;i++){ const k=((tm*1.2+i/4)%1); g.beginPath(); g.ellipse(e.px,e.py-u*k*40,u*(5-k*2),u*(2.5-k),0,0,Math.PI*2); g.stroke(); } } },
  plate(g,e,s,u,tm){ const w=e.g.wt||0; g.fillStyle=w?'rgba(255,214,90,.45)':'rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(e.px,e.py,u*4.6,u*2.3,0,0,Math.PI*2); g.fill(); },
  scale(g,e,s,u,tm,now,C){ const G0=e.g; C(-1,-1,0,2,2,9,'#7A6A50',{t:'#A8946E'}); const d=Math.max(-2,Math.min(2,(G0.R||0)-(G0.L||0))); const a=d*.12; g.save(); g.translate(e.px,e.py-u*10); g.rotate(a);
    g.strokeStyle=G0.bal?'#7CF0B5':'#E8C060'; g.lineWidth=u*1.2; g.beginPath(); g.moveTo(-u*22,u*11); g.lineTo(u*22,-u*11); g.stroke(); g.restore(); g.fillStyle=G0.bal?'#7CF0B5':'#FFE27A'; g.font='900 '+Math.max(11,u*3)+'px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.fillText((G0.L||0)+' : '+(G0.R||0),e.px,e.py-u*15); },
  sw(g,e,s,u,tm,now,C){ C(-2.4,-2.4,0,4.8,4.8,3.2*(e.g.w||1),'#6A6458',{t:'#8E8778'}); g.fillStyle='#FFE27A'; g.font='900 '+Math.max(10,u*2.6)+'px sans-serif'; g.textAlign='center'; g.fillText(String(e.g.w||1),e.px,e.py-u*(4+3.2*(e.g.w||1))); },
  statue(g,e,s,u,tm,now,C){ if(e.g.metal) return SH_DRAW.mcube(g,e,s,u,tm,now,C); const w=e.g.w||2; const k=w>=2?1:.72; wShadow(g,e.px,e.py+u*.5,u*4*k,u*2*k); C(-2.4*k,-2.4*k,0,4.8*k,4.8*k,1.2,'#8E8778'); C(-1.8*k,-1.8*k,1.2,3.6*k,3.6*k,6*k,'#B8B2A2',{t:'#D2CCBC'}); C(-1.2*k,-1.2*k,1.2+6*k,2.4*k,2.4*k,2.4*k,'#A9A291'); C(-.4,1.18*k,1.8+6*k,.8,.1,.6,'#3A3530');
    if(e.g.sc!=null){ g.fillStyle='rgba(255,226,122,.9)'; g.font='900 '+Math.max(9,u*2.2)+'px sans-serif'; g.textAlign='center'; g.fillText('무게 '+w,e.px,e.py-u*(6+9*k)); } },
  mw(g,e,s,u,tm,now,C){ const G0=e.g; if(G0.done){ const t=Math.min(1,(now-G0.at)/700); if(t>=1) return; g.save(); g.globalAlpha=1-t; } const rev=G0.fake&&s.sh&&s.sh.reveal; C(-3.2,-3.2,0,6.4,6.4,7,rev?'#8A6A9A':'#6E6A5E',{t:rev?'#C8A0E8':'#9A9484',l:rev?'#9A7AB0':'#7E7A6C',r:rev?'#6A4A7A':'#5A564A'});
    if(G0.kn||rev){ g.strokeStyle=rev?'rgba(255,220,255,.9)':'rgba(40,30,20,.7)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(e.px-u*1.5,e.py-u*12); g.lineTo(e.px+u*.3,e.py-u*9); g.lineTo(e.px-u*.8,e.py-u*6); g.lineTo(e.px+u*.8,e.py-u*3); g.stroke(); } if(G0.done) g.restore(); },
  vent(g,e,s,u,tm){ const on=e.g.live; g.fillStyle=on?'rgba(255,160,80,.5)':'rgba(80,50,40,.6)'; g.beginPath(); g.ellipse(e.px,e.py,u*4,u*2,0,0,Math.PI*2); g.fill(); if(on){ for(let i=0;i<8;i++){ const k=((tm*1.6+i/8)%1); g.fillStyle='rgba(255,'+(160+Math.round(k*80))+',90,'+(1-k)+')'; g.fillRect(e.px+(wHash(i,2,3)-.5)*u*5,e.py-k*u*30,u*1.1,u*1.1); } } },
  valve(g,e,s,u,tm){ const on=shOn(s,e.g); g.fillStyle=on?'#7CF0B5':'#8A7A5A'; g.beginPath(); g.ellipse(e.px,e.py,u*4.6,u*2.3,0,0,Math.PI*2); g.fill(); g.strokeStyle='#3A3020'; g.lineWidth=u*.6; g.beginPath(); g.ellipse(e.px,e.py-u*.4,u*2.4,u*1.2,tm*(on?2:0),0,Math.PI*2); g.stroke(); g.fillStyle='rgba(255,255,255,.85)'; g.font='900 '+Math.max(9,u*2.2)+'px sans-serif'; g.textAlign='center'; g.fillText('밸브',e.px,e.py-u*5); },
  igap(g,e,s,u,tm){ const t=s.M.T.get(shK(e.g.x,e.g.y)); if(t) return; g.fillStyle='rgba(156,210,255,'+(.4+.3*Math.sin(tm*3))+')'; g.font='900 '+Math.max(10,u*2.6)+'px sans-serif'; g.textAlign='center'; g.fillText('❄',e.px,e.py-u*(e.g.h-1)*2.66-u*3); },
  fblock(g,e,s,u,tm){ const G0=e.g; if(G0.z==null) return; const [px,py]=s.scr(G0.x,G0.y,G0.z); wCube(g,px,py,u,-3,-3,0,6,6,4,'#8A8EA8',{t:'#B8BCD2',l:'#9A9EB8',r:'#6E7290'}); const [sx,sy]=s.scr(G0.x,G0.y,s.sh?s.sh.FH:2); g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(sx,sy,u*3,u*1.5,0,0,Math.PI*2); g.fill(); },
  gear(g,e,s,u,tm,now,C){ const G0=e.g; const fz=G0.frz; C(-2.4,-2.4,0,4.8,4.8,4,fz?'#BFE6FF':'#6A6E8A',{t:fz?'#E8F7FF':'#9AA0BC'}); for(let j=0;j<4;j++){ const a=(G0.a||0)+j*Math.PI/2; for(let r=1;r<=3;r++){ const x=Math.cos(a)*r, y=Math.sin(a)*r; const [qx,qy]=s.scr(G0.x+x,G0.y+y,(s.sh?s.sh.FH:2)+.2); wCube(g,qx,qy,u,-2,-2,0,4,4,2.4,fz?'#CFEFFF':'#8A8EA8',{t:fz?'#F2FBFF':'#C9CED8',l:fz?'#BFE6FF':'#9AA0BC',r:fz?'#9CD2F0':'#6E7290'}); } }
    if(fz){ g.fillStyle='rgba(156,210,255,.9)'; g.font='900 '+Math.max(10,u*2.6)+'px sans-serif'; g.textAlign='center'; g.fillText('❄ 정지 '+Math.ceil((G0.fz-now)/1000),e.px,e.py-u*9); } },
  lever(g,e,s,u,tm,now,C){ C(-1.6,-1.6,0,3.2,3.2,2,'#5A5E7A'); g.fillStyle='#9CD2FF'; g.beginPath(); g.moveTo(e.px,e.py-u*11); g.lineTo(e.px+u*2.2,e.py-u*6); g.lineTo(e.px,e.py-u*2); g.lineTo(e.px-u*2.2,e.py-u*6); g.closePath(); g.fill(); g.fillStyle='rgba(255,255,255,.85)'; g.font='900 '+Math.max(9,u*2.2)+'px sans-serif'; g.textAlign='center'; g.fillText('레버',e.px,e.py-u*13); },
  rock(g,e,s,u,tm,now,C){ C(-2.6,-2.6,0,5.2,5.2,5,'#8EA8C0',{t:'#C8DCEC',l:'#9EB8D0',r:'#7A94AC'}); },
  iblock(g,e,s,u,tm,now,C){ C(-2.8,-2.8,0,5.6,5.6,5.6,'#BFE6FF',{t:'#EAF8FF',l:'#CFEFFF',r:'#9CD2F0'}); g.fillStyle='rgba(255,255,255,.6)'; g.fillRect(e.px-u*1.6,e.py-u*9,u*.8,u*4); },
  goal(g,e,s,u,tm){ const pl=.5+.5*Math.sin(tm*3); g.strokeStyle='rgba(255,214,90,'+(.5+pl*.5)+')'; g.lineWidth=u*.7; g.beginPath(); g.ellipse(e.px,e.py,u*4.6,u*2.3,0,0,Math.PI*2); g.stroke(); g.fillStyle='rgba(255,236,150,.9)'; g.font='900 '+Math.max(10,u*2.6)+'px sans-serif'; g.textAlign='center'; g.fillText('★',e.px,e.py-u*4-pl*u*2); },
  gen(g,e,s,u,tm,now,C){ const z=s.sh&&s.sh.zap&&now-s.sh.zap.at<1600; C(-2.8,-2.8,0,5.6,5.6,6,'#4A4E6A',{t:'#6A6E8A'}); C(-1.6,-1.6,6,3.2,3.2,2,z?'#FFE45A':'#8A8EA8'); g.fillStyle='rgba(255,228,90,.8)'; g.font='900 '+Math.max(10,u*2.4)+'px sans-serif'; g.textAlign='center'; g.fillText('⚡ 발전기',e.px,e.py-u*12); },
  lamp(g,e,s,u,tm,now,C){ const lit=e.g.lit; C(-1,-1,0,2,2,8,'#4A4E6A'); C(-2,-2,8,4,4,3,lit?'#FFF2A0':'#6A6E8A',{t:lit?'#FFFFFF':'#8A8EA8'}); if(lit){ const rg=g.createRadialGradient(e.px,e.py-u*11,0,e.px,e.py-u*11,u*14); rg.addColorStop(0,'rgba(255,240,160,.5)'); rg.addColorStop(1,'rgba(255,240,160,0)'); g.fillStyle=rg; g.fillRect(e.px-u*14,e.py-u*25,u*28,u*28); } },
  mcube(g,e,s,u,tm,now,C){ wShadow(g,e.px,e.py+u*.5,u*4,u*2); C(-2.6,-2.6,0,5.2,5.2,5.2,'#8A94A8',{t:'#C9D2E0',l:'#9AA4B8',r:'#6A7488'}); g.strokeStyle='rgba(255,228,90,.7)'; g.lineWidth=1.2; g.strokeRect(e.px-u*1.6,e.py-u*8,u*3.2,u*2); },
  epil(g,e,s,u,tm,now,C){ const G0=e.g; const c=GE_EL[G0.el].c; const on=(G0.on||0)>now; C(-2,-2,0,4,4,12,'#4A4E6A',{t:'#6A6E8A'}); C(-2.2,-2.2,12,4.4,4.4,1.4,on?c:'#3A3E5A',{t:on?'#FFFFFF':c}); if(on){ const rg=g.createRadialGradient(e.px,e.py-u*14,0,e.px,e.py-u*14,u*12); rg.addColorStop(0,c+'AA'); rg.addColorStop(1,c+'00'); g.fillStyle=rg; g.fillRect(e.px-u*12,e.py-u*26,u*24,u*24); }
    g.fillStyle=c; g.font='900 '+Math.max(10,u*2.6)+'px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.fillText(GE_EL[G0.el].n,e.px,e.py-u*19); }
};
/* 화면 효과: 어둠 · 빛줄기 · 바람 · 전류 · 봉인 고리 */
let SH_DK=null;
function shDrawPost(g,s,scr,u,tm,now,dpr){ const S=s.sh; if(!S) return; const P=SH_PUZ[S.k]; const M=s.M;
  if(P.dark){ const W=Math.ceil(s.vw*dpr), H=Math.ceil(s.vh*dpr); if(!SH_DK) SH_DK=document.createElement('canvas'); if(SH_DK.width!==W||SH_DK.height!==H){ SH_DK.width=W; SH_DK.height=H; } const d=SH_DK.getContext('2d'); d.setTransform(dpr,0,0,dpr,0,0); d.globalCompositeOperation='source-over'; d.clearRect(0,0,s.vw,s.vh); d.fillStyle='rgba(6,6,16,.9)'; d.fillRect(0,0,s.vw,s.vh); d.globalCompositeOperation='destination-out';
    const hole=(x,y,z,r)=>{ const [px,py]=scr(x,y,z); const rg=d.createRadialGradient(px,py,0,px,py,r); rg.addColorStop(0,'rgba(0,0,0,1)'); rg.addColorStop(.6,'rgba(0,0,0,.85)'); rg.addColorStop(1,'rgba(0,0,0,0)'); d.fillStyle=rg; d.fillRect(px-r,py-r,r*2,r*2); };
    hole(s.me.x,s.me.y,s.me.z,u*30); if(s.others) for(const o of s.others.values()) hole(o.x,o.y,null,u*22); M.gim.forEach(gm=>{ if(gm.sc!==S.i) return; if(gm.k==='emit') hole(gm.x,gm.y,null,u*16); if(gm.k==='lcry') hole(gm.x,gm.y,null,gm.lit?u*40:u*10); if(gm.k==='shx'||gm.k==='core') hole(gm.x,gm.y,null,u*12); });
    (S.beams||[]).forEach(b=>b.pts.forEach(p=>hole(p[0],p[1],null,u*9))); g.save(); g.setTransform(1,0,0,1,0,0); g.drawImage(SH_DK,0,0); g.restore();
    (S.beams||[]).forEach(b=>{ g.save(); g.lineCap='round'; g.lineJoin='round'; const L=b.pts.map(p=>scr(p[0],p[1],(s.sh.FH||2)+1.6)); for(const [w,c] of [[u*3.2,'rgba(255,240,170,.25)'],[u*1.4,'rgba(255,248,210,.85)'],[u*.5,'#FFFFFF']]){ g.strokeStyle=c; g.lineWidth=w; g.beginPath(); L.forEach((p,j)=>j?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.stroke(); } g.restore(); }); }
  if(S.k==='ignite'&&S.wind&&(S.wind.on||S.wind.warn)){ g.save(); const n=S.wind.on?26:10; for(let i=0;i<n;i++){ const y0=(wHash(i,3,9)*1.1-.05)*s.vh; const k=((tm*(S.wind.on?1.8:.7)+wHash(i,4,9))%1); const x0=S.wind.dir>0?k*s.vw*1.2-s.vw*.1:s.vw*1.1-k*s.vw*1.2; g.strokeStyle='rgba(230,240,255,'+(S.wind.on?.55:.25)+')'; g.lineWidth=S.wind.on?2:1.2; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x0-S.wind.dir*(40+wHash(i,5,9)*50),y0+4); g.stroke(); }
    if(S.wind.warn&&!S.wind.on){ g.fillStyle='rgba(255,255,255,.9)'; g.font='900 16px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.fillText((S.wind.dir>0?'← ':'')+'돌풍이 와요!'+(S.wind.dir<0?' →':''),s.vw/2,s.vh*.3); } g.restore(); }
  if(S.k==='circuit'&&S.zap&&now-S.zap.at<1600){ const k=(now-S.zap.at)/1600; g.save(); g.strokeStyle=S.zap.ok?'rgba(255,240,120,'+(1-k)+')':'rgba(255,140,90,'+(1-k)+')'; g.lineWidth=2.4; g.beginPath(); S.zap.path.forEach((p,j)=>{ const [px,py]=scr(p[0]+(Math.random()-.5)*.3,p[1]+(Math.random()-.5)*.3,(S.FH||2)+.4); j?g.lineTo(px,py):g.moveTo(px,py); }); g.stroke(); g.restore(); }
  if(S.k==='reso'){ const D=M.gim.find(gm=>gm.k==='door'&&gm.sc===S.i); if(D&&!D.done){ const [px,py]=scr(D.x,D.y,(S.FH||2)+1.5); const ORD=['earth','fire','ice','bolt']; ORD.forEach((el,j)=>{ const on=j<(S.seal||0); g.strokeStyle=on?GE_EL[el].c:'rgba(255,255,255,.18)'; g.lineWidth=on?u*1.1:u*.6; g.beginPath(); g.ellipse(px,py-u*6,u*(5+j*2.4),u*(2.5+j*1.2),tm*(j%2?.4:-.4),0,Math.PI*2); g.stroke(); }); } }
  /* 먼지 · 반딧불 분위기 */
  g.save(); for(let i=0;i<14;i++){ const k=((tm*.05+wHash(i,7,S.i))%1); const x=wHash(i,8,S.i)*s.vw+Math.sin(tm*.6+i)*20, y=s.vh*(1-k); g.fillStyle=SH_INFO[S.k].c; g.globalAlpha=.25+.25*Math.sin(tm*2+i); g.fillRect(x,y,2,2); } g.restore(); }
if(/^file:|localhost/.test(location.href)) window.__sh={SH_PUZ,SH_INFO,shBeams,shCircuit,shSolve,shHit,shPushIce,shEnter,shExitNow};

/* ═════════ v28.1 내 섬 경영 · 자유 요리 · 납품 (기획서 PART 6) ═════════
   · 재료 태그 합산 요리: HEAL / COLD / HEAT / ATK / DEF / SPD / X(비식용)
   · 서로 다른 버프 태그 2종 이상 → 고효율 순수 회복 요리 · 비식용 1개라도 → 의문의 복셀 덩어리
   · 요리 버프 10분 · 전투 요리 슬롯 · 즐겨찾기 레시피 자동 저장
   · 상인 토비 매입 · 디코아 정착지 특산 1.5배 · 무역 열기구 대량 주문 · 목공소 가구 상자 · 물약 공방 */
const ING={
  radish:{n:'무',tag:'HEAL',c:'#F2C9DA',p:8},carrot:{n:'당근',tag:'HEAL',c:'#FF8A2B',p:14},potato:{n:'감자',tag:'HEAL',c:'#D9A86A',p:24},tomato:{n:'토마토',tag:'HEAL',c:'#FF4B3E',p:36},
  corn:{n:'옥수수',tag:'HEAL',c:'#FFD54A',p:52},straw:{n:'딸기',tag:'HEAL',c:'#FF3E5F',p:70},pumpkin:{n:'호박',tag:'HEAL',c:'#FF9A2E',p:100},melon:{n:'수박',tag:'HEAL',c:'#3FB65C',p:130},
  gapple:{n:'황금 사과',tag:'HEAL',c:'#FFC23A',p:200,big:1},star:{n:'별빛 꽃',tag:'SPD',c:'#B98CFF',p:260},poin:{n:'포인세티아',tag:'HEAL',c:'#E5383B',p:40},
  pepper:{n:'지옥고추',tag:'COLD',c:'#FF3A1A',p:40},mint:{n:'서리민트',tag:'HEAT',c:'#4FD8B8',p:40},
  mush:{n:'버섯',tag:'HEAL',c:'#E57060',p:12},sjelly:{n:'슬라임 젤리',tag:'SPD',c:'#7CE07A',p:16},meat:{n:'몬스터 고기',tag:'ATK',c:'#C85A4A',p:22},sroot:{n:'매운뿌리',tag:'ATK',c:'#E8742A',p:18},
  rroot:{n:'바위뿌리',tag:'DEF',c:'#A8946E',p:22},shell:{n:'단단한 껍질',tag:'DEF',c:'#BFB39A',p:26},fberry:{n:'화염열매',tag:'COLD',c:'#FF6A1A',p:30},ijelly:{n:'얼음젤리',tag:'HEAT',c:'#8CD8FF',p:30},
  bmush:{n:'번개버섯',tag:'SPD',c:'#F0D23A',p:34},twig:{n:'나뭇가지',tag:'X',c:'#8A5A34',p:2},ore:{n:'광석',tag:'X',c:'#8E98A8',p:0}
};
const ING_TAG={HEAL:['회복','#7CF0B5','heart'],COLD:['한파 저항','#FF8A4A','flame'],HEAT:['고온 저항','#5EC8FF','snow'],ATK:['공격 강화','#FF5A5A','sword'],DEF:['방어 강화','#C9A878','shield'],SPD:['기동 강화','#FFE45A','bolt'],X:['비식용','#8E98A8','x'],MIX:['고효율 회복','#7CF0B5','heart'],TEMP:['온도 저항','#B98CFF','sun'],WEAK:['배탈','#9A8E78','x']};
/* 몬스터 → 재료 */
const MOB_ING={slime:'sjelly',bslime:'sjelly',kslime:'sjelly',pslime:'sjelly',mush:'mush',rmush:'mush',gmush:'mush',mking:'mush',wisp:'ijelly',swisp:'ijelly',fslime:'ijelly',cryos:'mint',
  imp:'meat',hound:'meat',fwolf:'meat',gob:'meat',mslime:'fberry',volca:'fberry',golem:'fberry',skel:'shell',vskel:'shell',pebble:'rroot',rgolem:'rroot',monol:'rroot',simp:'bmush',sgolem:'bmush',voltr:'bmush'};
const DK_SPEC={earth:['rroot','sroot'],fire:['fberry','meat'],ice:['ijelly','mint'],bolt:['bmush','shell']};
const BUF_MIN=10;
const ingCnt=(pt,k,ore)=>k==='ore'?(ore||0):((pt||{})[k]||0);

/* ── 태그 합산 ── */
function cookResult(keys){ keys=keys.filter(k=>ING[k]); if(!keys.length) return null; const n=keys.length; const tags=keys.map(k=>ING[k].tag); const main=ING[keys[0]].n;
  if(tags.includes('X')) return {tag:'X',lv:1,heal:10,n:'의문의 복셀 덩어리',d:'체력 +10 · 무작위 버프 또는 배탈'};
  const buffs=[...new Set(tags.filter(t=>t!=='HEAL'))]; const heals=tags.filter(t=>t==='HEAL').length+keys.filter(k=>ING[k].big).length;
  if(buffs.length>=2){ const h=Math.min(320,70*n+20); return {tag:'MIX',lv:1,heal:h,n:(n>=4?'든든한 ':'')+'모둠 회복 스튜',d:'버프가 섞여 상쇄됐어요 · 체력 +'+h}; }
  if(!buffs.length){ const h=[50,90,130,170,200][Math.min(4,heals-1)]+(heals>n?40:0); const nm=n===1?main+' 구이':n===2?main+' 샐러드':n<=3?'모둠 '+main+' 덮밥':main+' 잔치 한상'; return {tag:'HEAL',lv:1,heal:h,n:nm,d:'체력 +'+h}; }
  const T=buffs[0]; const k=tags.filter(t=>t===T).length; const lv=k>=5?3:k>=3?2:1; const h=heals*20;
  const NM={ATK:['매콤 고기 꼬치','불맛 고기 볶음','전설의 용사 스테이크'],DEF:['든든한 바위 수프','단단 껍질 찜','전설의 철벽 냄비'],SPD:['톡톡 젤리 푸딩','번개 버섯 볶음','전설의 질풍 파르페'],
    COLD:['화끈 고추 스튜','화염 열매 찌개','전설의 용암 카레'],HEAT:['시원 민트 셔벗','얼음 젤리 빙수','전설의 만년설 빙수']}[T];
  return {tag:T,lv,heal:h,n:NM[lv-1],d:bufText(T,lv)+(h?' · 체력 +'+h:'')+' · '+BUF_MIN+'분'}; }
function bufText(T,lv){ const i=Math.max(0,Math.min(2,lv-1)); return T==='ATK'?'공격력 +'+[10,15,20][i]+'%':T==='DEF'?'방어력 +'+[15,25,35][i]:T==='SPD'?'이동 속도 +'+[10,14,18][i]+'%':T==='COLD'?'추위 '+(lv>=2?'2':'1')+'단계 막기':T==='HEAT'?'더위 '+(lv>=2?'2':'1')+'단계 막기':T==='TEMP'?'추위 · 더위 1단계 막기':T==='WEAK'?'공격력 -10%':''; }
/* 활성 버프 (cbStats · 온도에서 읽어요) */
const bufOf=r=>{ const B=r&&r.buf; return B&&B.end>Date.now()?B:null; };
const dishSig=keys=>keys.slice().sort().join('+');
/* 요리 적용: 재료 차감 · 접시 추가 · 즐겨찾기 */
function cookApply(R,keys){ const res=cookResult(keys); if(!res) return null; const pt={...(R.pt||{})}; let ore=R.ore||0;
  for(const k of keys){ if(k==='ore'){ if(ore<1) return null; ore--; } else { if(!(pt[k]>0)) return null; pt[k]--; if(!pt[k]) delete pt[k]; } }
  const food=(R.food||[]).map(x=>({...x})); const sig=res.tag+':'+res.n; const f=food.find(x=>x.sig===sig); if(f) f.cnt=Math.min(30,f.cnt+1); else { if(food.length>=12) return {err:'요리 칸이 가득 찼어요 (12종)'}; food.push({sig,n:res.n,tag:res.tag,lv:res.lv,heal:res.heal,d:res.d,cnt:1}); }
  let rcp=(R.rcp||[]).slice(); if(res.tag!=='X'){ const s0=dishSig(keys); rcp=[s0,...rcp.filter(x=>x!==s0)].slice(0,10); }
  return {pt,ore,food,rcp,res}; }
/* 먹기: 버프 갱신 · 회복량 돌려줘요 */
function eatApply(R,i){ const BM=BUF_MIN+(typeof lifePerk==='function'?lifePerk(R,'ck'):0); const food=(R.food||[]).map(x=>({...x})); const f=food[i]; if(!f) return null; f.cnt--; if(f.cnt<=0) food.splice(i,1); let buf=R.buf||null; let note='';
  if(f.tag==='X'){ if(Math.random()<.5){ const T=['ATK','DEF','SPD','COLD','HEAT'][Math.floor(Math.random()*5)]; buf={t:T,lv:1,end:Date.now()+BM*60000}; note='운 좋게 '+ING_TAG[T][0]+'!'; } else { buf={t:'WEAK',lv:1,end:Date.now()+3*60000}; note='배탈이 났어요… 3분 동안 공격력 -10%'; } }
  else if(f.tag!=='HEAL'&&f.tag!=='MIX'){ buf={t:f.tag,lv:f.lv,end:Date.now()+BM*60000}; note=bufText(f.tag,f.lv)+' · '+BM+'분'; }
  return {food,buf,heal:f.heal||0,f,note}; }

/* ═════ 요리솥 화면 ═════ */
function WCook({R,canCook,why,potion,onCommit,onEat,compact,say}){ const [pot,setPot]=useState([]); const [mode,setMode]=useState('cook');
  const pt=R.pt||{}; const avail=k=>ingCnt(pt,k,R.ore)-pot.filter(x=>x===k).length;
  const keys=Object.keys(ING).filter(k=>ingCnt(pt,k,R.ore)>0);
  const res=cookResult(pot); const add=k=>{ if(pot.length>=5||avail(k)<=0) return; setPot([...pot,k]); haptic(5); };
  const fill=sig=>{ const L=sig.split('+'); const need={}; L.forEach(k=>need[k]=(need[k]||0)+1); if(Object.entries(need).every(([k,n])=>ingCnt(pt,k,R.ore)>=n)){ setPot(L); haptic(8); } else (say||(()=>{}))('재료가 모자라요'); };
  const cook=()=>{ if(!canCook||!res) return; const o=cookApply(R,pot); if(!o) return; if(o.err){ (say||(()=>{}))(o.err); return; } setPot([]); wSfx('gem'); haptic([12,24,40]); onCommit(o,o.res.n+' 완성!'); };
  const POT=[{k:'hp',n:'회복 물약',need:{radish:2,sjelly:1},res:{tag:'HEAL',lv:1,heal:150,n:'회복 물약',d:'체력 +150'}},{k:'cure',n:'해독제',need:{mint:1,pepper:1},res:{tag:'TEMP',lv:1,heal:20,n:'해독제',d:'추위 · 더위 1단계 막기 · 10분'}}];
  const brew=P=>{ const pt2={...pt}; for(const [k,n] of Object.entries(P.need)){ if((pt2[k]||0)<n) return (say||(()=>{}))('재료가 모자라요'); pt2[k]-=n; if(!pt2[k]) delete pt2[k]; }
    const food=(R.food||[]).map(x=>({...x})); const sig=P.res.tag+':'+P.res.n; const f=food.find(x=>x.sig===sig); if(f) f.cnt++; else food.push({sig,...P.res,cnt:1}); wSfx('gem'); onCommit({pt:pt2,ore:R.ore,food,rcp:R.rcp||[]},P.n+' 완성!'); };
  return html`<div className=${'ck81'+(compact?' cp':'')}>
    ${potion?html`<div className="ck81-mode">${[['cook','요리솥'],['potion','물약 공방']].map(([k,n])=>html`<button key=${k} type="button" className=${'tap'+(mode===k?' on':'')} onClick=${()=>setMode(k)}>${n}</button>`)}</div>`:null}
    ${mode==='cook'?html`
    <div className="ck81-pot">${[0,1,2,3,4].map(i=>{ const k=pot[i]; return html`<button key=${i} type="button" className=${'ck81-sl tap'+(k?' on':'')} style=${k?{'--c':ING[k].c}:null} onClick=${()=>k&&setPot(pot.filter((_,j)=>j!==i))}>${k?html`<i></i><small>${ING[k].n}</small>`:html`<em>+</em>`}</button>`; })}</div>
    <div className=${'ck81-res'+(res?' t-'+res.tag:'')}>${res?html`<span className="ck81-ri" style=${{'--c':ING_TAG[res.tag][1]}}><${Icon} n=${ING_TAG[res.tag][2]} s=${20} w=${2.4}/></span><div><b>${res.n}</b><small>${res.d}</small></div>`:html`<p>재료를 1~5개 넣어요 · 같은 버프 재료를 많이 넣을수록 강해져요</p>`}
      <button type="button" className="ck81-go tap" disabled=${!res||!canCook} onClick=${cook}>요리하기</button></div>
    ${!canCook?html`<p className="ck81-why"><${Icon} n="lock" s=${12} w=${2.6}/>${why||'요리솥 근처에서만 요리할 수 있어요'}</p>`:null}
    ${(R.rcp||[]).length?html`<div className="ck81-fav"><span>즐겨찾기</span>${R.rcp.map(sig=>{ const r=cookResult(sig.split('+')); return r?html`<button key=${sig} type="button" className="tap" onClick=${()=>fill(sig)}>${r.n}</button>`:null; })}</div>`:null}
    <div className="ck81-ing">${keys.length?keys.map(k=>{ const I=ING[k]; const a=avail(k); return html`<button key=${k} type="button" className=${'ck81-it tap'+(a<=0?' no':'')} style=${{'--c':I.c}} onClick=${()=>add(k)}><i></i><b>${I.n}</b><small style=${{color:ING_TAG[I.tag][1]}}>${ING_TAG[I.tag][0]}</small><em>${a}</em></button>`; }):html`<p className="ck81-none">재료가 없어요 · 텃밭 수확 · 던전 · 디코아 몬스터에게서 얻어요</p>`}</div>`
    :html`<div className="ck81-pl">${POT.map(P=>{ const ok=Object.entries(P.need).every(([k,n])=>(pt[k]||0)>=n); return html`<div key=${P.k} className="ck81-pr"><div><b>${P.n}</b><small>${Object.entries(P.need).map(([k,n])=>ING[k].n+' '+n).join(' + ')} → ${P.res.d}</small></div><button type="button" className="tap" disabled=${!ok||!canCook} onClick=${()=>brew(P)}>만들기</button></div>`; })}</div>`}
    <h5>내 요리 <small>${(R.food||[]).length}/12종 · 전투 중엔 요리 버튼으로 먹어요</small></h5>
    <div className="ck81-food">${(R.food||[]).length?R.food.map((f,i)=>html`<div key=${f.sig} className="ck81-fd"><span className="ck81-ri" style=${{'--c':ING_TAG[f.tag][1]}}><${Icon} n=${ING_TAG[f.tag][2]} s=${16} w=${2.4}/></span><div><b>${f.n} <em>×${f.cnt}</em></b><small>${f.d}</small></div>${onEat?html`<button type="button" className="tap" onClick=${()=>onEat(i)}>먹기</button>`:null}</div>`):html`<p className="ck81-none">아직 만든 요리가 없어요</p>`}</div>
    ${R.buf&&R.buf.end>Date.now()?html`<p className="ck81-buf"><${Icon} n=${ING_TAG[R.buf.t][2]} s=${13} w=${2.4}/>지금 효과 · ${bufText(R.buf.t,R.buf.lv)} · ${Math.ceil((R.buf.end-Date.now())/60000)}분 남음</p>`:null}
  </div>`; }

/* ═════ 납품: 상인 토비 매입 · 무역 열기구 주문 ═════ */
const TB_WIN=4*3600000;
function tbOrder(uid,hl){ const w=Math.floor(Date.now()/TB_WIN); const pool=['carrot','potato','tomato','corn','straw','pepper','mint','mush','sjelly','meat','rroot','fberry','ijelly','shell','bmush','sroot'];
  const h=(i)=>wHash(w,String(uid).length*7+i,77); const a=pool[Math.floor(h(1)*pool.length)]; let b=pool[Math.floor(h(2)*pool.length)]; if(b===a) b=pool[(pool.indexOf(a)+3)%pool.length];
  const na=4+Math.floor(h(3)*7), nb=3+Math.floor(h(4)*5); const gold=Math.round(((ING[a].p*na+ING[b].p*nb)*2.4+150)*(hl>=9?1.3:1)/10)*10; return {w,need:{[a]:na,[b]:nb},gold,dust:6+Math.floor(h(5)*9),gift:h(6)<.3}; }
function WTrade({R,uid,hl,has,done,onSell,onOrder}){ const pt=R.pt||{}; const keys=Object.keys(pt).filter(k=>ING[k]&&pt[k]>0); const O=tbOrder(uid,hl); const ok=Object.entries(O.need).every(([k,n])=>(pt[k]||0)>=n);
  return html`<div className="tr81">
    ${has?html`<div className=${'tr81-o'+(done?' done':'')}><div className="tr81-oh"><${Icon} n="up2" s=${18} w=${2.4}/><b>무역 열기구 주문</b><small>${done?'이번 주문 완료 · 4시간마다 새 주문':'4시간마다 바뀌어요'}</small></div>
      <div className="tr81-need">${Object.entries(O.need).map(([k,n])=>html`<span key=${k} className=${(pt[k]||0)>=n?'ok':''} style=${{'--c':ING[k].c}}><i></i>${ING[k].n} ${pt[k]||0}/${n}</span>`)}</div>
      <div className="tr81-rw">보상 · 골드 ${O.gold.toLocaleString()} · 강화 가루 ${O.dust}${O.gift?' · 희귀 가구':''}${hl>=9?' (성 Lv.9 +30%)':''}</div>
      <button type="button" className="tap" disabled=${!ok||done} onClick=${()=>onOrder(O)}>${done?'완료':'납품하기'}</button></div>`
      :html`<p className="tr81-tip"><${Icon} n="lock" s=${12} w=${2.6}/>성 Lv.5에서 무역 열기구를 지으면 대량 주문을 받아요</p>`}
    <h5>상인 토비 매입 <small>언제든 이 값에 사 가요</small></h5>
    <div className="tr81-l">${keys.length?keys.map(k=>html`<div key=${k} className="tr81-r"><i style=${{background:ING[k].c}}></i><b>${ING[k].n}</b><small>${pt[k]}개 · 개당 ${ING[k].p} G</small><button type="button" className="tap" onClick=${()=>onSell({[k]:1})}>1개</button><button type="button" className="tap" onClick=${()=>onSell({[k]:pt[k]})}>전부</button></div>`):html`<p className="ck81-none">팔 재료가 없어요</p>`}</div>
  </div>`; }

/* ═════ 섬 건물 그림 ═════ */
W_DRAWX.pot=(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*6,u*3); [[-3,-3],[2.2,-3],[-3,2.2],[2.2,2.2]].forEach(([x,y])=>C(x,y,0,.8,.8,2.4,'#5A3A20')); C(-2.6,-2.6,1.2,5.2,5.2,1,'#2A2A33');
  C(-3.2,-3.2,2,6.4,6.4,3.6,'#3A3A46',{t:'#2A2A33',l:'#4A4A58',r:'#2E2E3A'}); C(-2.6,-2.6,5.5,5.2,5.2,.3,'#7CE07A',{t:'#9CF09A'}); const b=Math.sin(tm*4+seed);
  for(let i=0;i<3;i++){ const t=((tm*.7+i*.33)%1); g.fillStyle='rgba(255,255,255,'+(.5*(1-t))+')'; g.beginPath(); g.arc(ox+(i-1)*u*1.6,oy-u*(8+t*10),u*(1.2+t*1.4),0,6.28); g.fill(); }
  C(-1,-1,5.8+b*.2,.8,.8,.5,'#FFE08A'); C(-4.4,-.4,.6,1.4,.8,.8,'#FF7A2A',{t:'#FFD54A'}); };
W_DRAWX.potion=(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*1.6,u*9,u*4.5); C(-4.5,-4,0,9,8,6,'#E8DCF5',{t:'#F5EEFF',l:'#E8DCF5',r:'#C9B8E2'}); C(-5,-4.5,6,10,9,1.2,'#7A4FC8',{t:'#9A6FE8'}); C(-3.5,-3.5,7.2,7,7,1.6,'#6A3FD8',{t:'#8A5FF0'});
  C(-1.2,-1.2,8.8,2.4,2.4,2.4,'#A98BFF'); const k=.5+.5*Math.sin(tm*3); [['#FF5A7A',-3],['#7CE07A',-.5],['#5EC8FF',2]].forEach(([c,x])=>{ C(x,4.05,2,1.4,.2,2.2,c,{l:c,r:c,t:c}); }); g.fillStyle='rgba(185,140,255,'+(.25+k*.2)+')'; g.beginPath(); g.arc(ox,oy-u*12,u*3,0,6.28); g.fill(); };
W_DRAWX.carp=(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*1.6,u*9,u*4.5); C(-4.5,-4,0,9,8,5.5,'#C99A5A',{t:'#E0B474',l:'#C99A5A',r:'#A87A40'}); for(let i=0;i<4;i++) C(-4.6,-3.6+i*2,0,.2,1.4,5.5,'#8A5A34');
  C(-5,-4.5,5.5,10,9,1,'#7A4E2C'); C(-4,-3.5,6.5,8,7,1.6,'#6A3E20'); C(2,4.1,0,3,.6,1.2,'#B07E46'); C(2.4,4.1,1.2,2.2,.6,1,'#C9965A'); const s=Math.sin(tm*6)*.6; C(-3.6+s,4.1,2.2,2,.3,.4,'#C8D0DA'); };
W_DRAWX.tbal=(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*1.4,u*8,u*4); C(-4,-3,0,8,6,1.2,'#8A5A34'); C(-3,-2,1.2,6,4,1.8,'#C99A5A'); C(-2.6,-2.6,3,1.2,1.2,1,'#FFD54A'); C(1.2,-2.4,3,1.4,1.2,1.2,'#7CE07A');
  g.save(); g.translate(ox,oy-u*6); wDrawItem(g,'balloon',0,0,u*1.15,tm,seed,1); g.restore(); };
Object.assign(W_CAT,{
  pot:{n:'요리솥',cat:'res',lvMax:1,b:300,time:30,max:[0,0,0,1,1,1,1,1,1,1,1],req:3,ds:'재료 1~5개를 넣어 자유롭게 요리해요. 태그가 합쳐져 버프 요리가 돼요.'},
  carp:{n:'목공소',cat:'res',lvMax:1,b:900,time:120,max:[0,0,0,0,0,1,1,1,1,1,1],req:5,ds:'90분마다 가구 상자가 하나씩(최대 3) 만들어져요. 열면 장식 가구가 선물함에 들어가요.'},
  potion:{n:'물약 공방',cat:'res',lvMax:1,b:900,time:120,max:[0,0,0,0,0,1,1,1,1,1,1],req:5,ds:'회복 물약 · 해독제(추위 · 더위 막기)를 만들어요.'},
  tbal:{n:'무역 열기구',cat:'res',lvMax:1,b:1200,time:180,max:[0,0,0,0,0,1,1,1,1,1,1],req:5,ds:'4시간마다 대량 주문이 들어와요. 납품하면 골드 · 강화 가루 · 희귀 가구를 받아요.'}});
Object.assign(W_CAT,{ss_crys:{n:'정령 수정 무리',cat:'gem',ss:1,max1:99,d2:'정령 상점'},ss_arch:{n:'원소 아치',cat:'gem',ss:1,max1:99,d2:'정령 상점'},ss_spr:{n:'통통 버섯',cat:'gem',ss:1,max1:99,d2:'정령 상점'}});
Object.assign(W_SZ,{pot:[1,1],carp:[2,2],potion:[2,2],tbal:[2,2],ss_arch:[2,1]}); W_LONG.add('ss_arch'); Object.assign(W_SC,{carp:1.45,potion:1.45,tbal:1.3});
const CARP_MS=90*60000, CARP_GIFT=['bench','lamp','fence','barrel','crate','flower','bush','tent','fountain','statue'];
const wCarpStock=(it,now)=>it&&it.t==='carp'&&!(it.up&&it.up.end>now)?Math.min(3,Math.floor((now-(it.c||now))/CARP_MS)):0;

/* ═════ 꾸미기: 바닥 브러시 · 환경 테마 · 성 스킨 ═════ */
const W_BRUSH={grass:{n:'잔디',c:'#86DC85'},sand:{n:'모래',c:'#F6E4B0'},path:{n:'흙길',c:'#EEDDBA'},snow:{n:'설원',c:'#EEF4FA',g:300},obsid:{n:'화산 흑요석',c:'#4A3E5A',g:300},sakura:{n:'벚꽃 돌길',c:'#F6CADA',g:300},marble:{n:'고대 대리석',c:'#ECE8E0',g:300}};
Object.assign(W_TILE,{p_grass:W_TILE.grass,p_sand:W_TILE.sand,p_path:W_TILE.path,p_snow:['#F0F5FB','#E2EBF5'],p_obsid:['#4A3E5A','#3E3450'],p_sakura:['#F8D4E2','#F0C2D4'],p_marble:['#F0ECE4','#E2DCD0']});
const W_ENV={none:{n:'기본'},sunset:{n:'노을',g:800},aurora:{n:'오로라 밤하늘',g:1500},sakura:{n:'벚꽃비',g:1200}};
const W_HSK={none:{n:'기본',f:'none'},cookie:{n:'동화 과자집',f:'sepia(.55) saturate(1.6) hue-rotate(-12deg) brightness(1.06)',g:2000},hanok:{n:'한옥 기와',f:'grayscale(.55) contrast(1.15) brightness(.92)',g:2000},obsid:{n:'흑요석 요새',f:'brightness(.55) saturate(1.4) hue-rotate(230deg) contrast(1.2)',g:3000},neon:{n:'네온 사이버 기지',f:'hue-rotate(180deg) saturate(2.2) brightness(1.08)',g:3000},gold:{n:'황금 성채',f:'sepia(1) saturate(3) hue-rotate(-8deg) brightness(1.12)',g:7000,lv:9}};
function wEnvFx(g,s,tm){ const me=s.me; if(!me||!s.W) return; const T=s.W.T.get(Math.round(me.x)+','+Math.round(me.y)); if(!T||!T.isl||T.isl==='center') return; const L=s.W.L&&s.W.L.find(l=>l.uid===T.isl); const env=L&&L.env; if(!env||env==='none') return;
  if(env==='sunset'){ const gr=g.createLinearGradient(0,0,0,s.vh); gr.addColorStop(0,'rgba(255,120,80,.28)'); gr.addColorStop(.6,'rgba(255,170,90,.12)'); gr.addColorStop(1,'rgba(120,60,140,.12)'); g.fillStyle=gr; g.fillRect(0,0,s.vw,s.vh); }
  else if(env==='aurora'){ g.fillStyle='rgba(16,24,70,.32)'; g.fillRect(0,0,s.vw,s.vh); g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<3;i++){ g.beginPath(); for(let x=0;x<=s.vw;x+=20){ const y=60+i*34+Math.sin(x*.012+tm*.6+i)*26+Math.sin(x*.03+tm*.9)*8; x?g.lineTo(x,y):g.moveTo(x,y); } g.strokeStyle=['rgba(80,255,170,.22)','rgba(120,200,255,.18)','rgba(200,120,255,.16)'][i]; g.lineWidth=36-i*8; g.stroke(); } g.restore();
    for(let i=0;i<30;i++){ const x=wHash(i,3,3)*s.vw, y=wHash(i,8,8)*s.vh*.5; g.fillStyle='rgba(255,255,255,'+(.4+.4*Math.sin(tm*2+i))+')'; g.fillRect(x,y,1.6,1.6); } }
  else if(env==='sakura'){ for(let i=0;i<34;i++){ const sp=.3+wHash(i,1,1)*.4; const x=((wHash(i,2,2)*s.vw+tm*40*sp+Math.sin(tm+i)*30)%(s.vw+40))-20, y=((wHash(i,5,5)*s.vh+tm*60*sp)%(s.vh+40))-20; g.fillStyle=i%3?'rgba(255,190,215,.9)':'rgba(255,230,240,.9)'; g.save(); g.translate(x,y); g.rotate(tm*2+i); g.fillRect(-3,-2,6,4); g.restore(); } } }

/* ═════ 꾸미기 부티크 화면 (성 Lv.7) ═════ */
function WStyle({I,gold,hl,onSave,onBrush,onClose,say}){ const own=I.own||{}; const env=I.env||'none', hsk=I.hsk||'none';
  const pick=(kind,k,cost,lvReq)=>{ if(lvReq&&hl<lvReq) return (say||(()=>{}))('성 Lv.'+lvReq+'에서 열려요'); const has=!cost||own[kind+'_'+k]; onSave(kind,k,has?0:cost); };
  return html`<div className="wb20-shade" onClick=${onClose}><div className="wbs st81" onClick=${e=>e.stopPropagation()}>
    <div className="wbs-h"><b>섬 꾸미기</b><span className="wbs-sub">성 Lv.${hl} · 골드 ${gold.toLocaleString()}</span><button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="st81-b">
      <h5>바닥 브러시 <small>성 Lv.3 · 특별 브러시는 한 번 사면 계속 써요</small></h5>
      <button type="button" className="st81-go tap" disabled=${hl<3} onClick=${onBrush}><${Icon} n="palette" s=${18} w=${2.4}/>${hl<3?'성 Lv.3에서 열려요':'내 섬 바닥 칠하기'}</button>
      <h5>환경 테마 <small>성 Lv.7 · 내 섬에 들어오면 하늘이 바뀌어요</small></h5>
      <div className="st81-g">${Object.entries(W_ENV).map(([k,E])=>{ const has=!E.g||own['env_'+k]; return html`<button key=${k} type="button" className=${'tap'+(env===k?' on':'')+(hl<7&&k!=='none'?' lock':'')} onClick=${()=>pick('env',k,E.g,k==='none'?0:7)}><i className=${'st81-sw e-'+k}></i><b>${E.n}</b><small>${env===k?'사용 중':has?'보유':E.g.toLocaleString()+' G'}</small></button>`; })}</div>
      <h5>성 스킨 <small>성 Lv.7 · 황금 성채는 Lv.9</small></h5>
      <div className="st81-g">${Object.entries(W_HSK).map(([k,E])=>{ const has=!E.g||own['hsk_'+k]; const lv=k==='none'?0:E.lv||7; return html`<button key=${k} type="button" className=${'tap'+(hsk===k?' on':'')+(hl<lv?' lock':'')} onClick=${()=>pick('hsk',k,E.g,lv)}><i className="st81-sw h" style=${{filter:E.f}}></i><b>${E.n}</b><small>${hsk===k?'사용 중':has?'보유':E.g.toLocaleString()+' G'}</small></button>`; })}</div>
    </div></div></div>`; }
try{ window.__ck={cookResult,cookApply,eatApply,tbOrder}; }catch(e){}

/* ═════ v28.2 퀘스트 추적 (미니맵 아래 · 마비노기식) ═════ */
function WQTrack({I,tab,setTab,onOpen}){ const Q=wNqDay(I); const set=t=>{ setTab(t); try{ localStorage.setItem('dko-qtab',t); }catch(e){} };
  const L=W_NPC.map(D=>{ const q=wNqOf(D.id); if(!q) return null; const p=Math.min(q.n,Q.p[q.k]||0); return {id:D.id,n:D.n,c:D.c,t:q.t,p,need:q.n,ok:p>=q.n,got:!!Q.got[D.id]}; }).filter(x=>x&&!x.got);
  L.sort((a,b)=>(b.ok-a.ok)||((b.p/b.need)-(a.p/a.need)));
  if(tab==='off') return html`<div className="wq82"><div className="wq82-h"><button type="button" className="tap" onClick=${()=>set('q')}>의뢰 보기</button></div></div>`;
  return html`<div className="wq82"><div className="wq82-h"><button type="button" className="tap on" onClick=${onOpen}>의뢰 ${L.length}</button><button type="button" className="tap" onClick=${()=>set('off')} aria-label="접기">접기</button></div>
    ${L.slice(0,4).map((q,i)=>html`<button key=${q.id} type="button" className=${'wq82-i tap'+(i===0?' top':'')+(q.ok?' ok':'')} style=${{'--c':q.c}} onClick=${onOpen}><b>${q.n}</b><small>${q.ok?html`<em>보상 받기</em>`:html`• ${q.t} <em>${q.p}/${q.need}</em>`}</small></button>`)}
    ${!L.length?html`<div className="wq82-i ok"><b>오늘 의뢰 완료</b><small>0시에 새 의뢰가 와요</small></div>`:null}</div>`; }

/* ═════ v28.2 빙하 섬 (Sprint 1-5 · Tier 4) ═════ */
Object.assign(MOB,{fking:{n:'서리 거인 요툰',hp:5000,atk:82,spd:.95,xp:900,b:[900,1300],c:['#E6F4FF','#3A8FE0'],sz:2.9,kind:'golem',boss:1,slam:1,coin:[30,45],re:240},
  icrab:{n:'빙하 집게',hp:310,atk:42,spd:1.4,xp:34,b:[24,40],c:['#BFE6FF','#2F6FB0'],sz:1,kind:'imp'}});
Object.assign(CB_MOB,{fking:[5000,82,55],icrab:[310,42,28]}); Object.assign(CB_WP,{fking:{f:0,boss:1,n:'정수리 빙핵'}}); Object.assign(MOB_ING,{fking:'mint',icrab:'shell'});
DG.glacier={n:'빙하 섬',e:'GLACIER ISLE',lv:8,R:30,col:['#9CE4FF','#2F6FB0'],bg:['#CFE8F8','#7FA8D6'],
  tile:{g:['#EEF5FC','#E2ECF7'],s:['#D6E8F6','#C8DDF0'],m:['#B8D6EE','#A8CAE6']},
  mobs:[['fslime',11],['swisp',8],['icrab',8],['fwolf',3]],boss:[['fking',16,-10]],deco:['pine','snowman','crystal','rock'],holes:'pool'};
W_LM.push({k:'glacier',n:'빙하 섬 포털',d:'난이도 어려움 · 추천 Lv.8 · Tier 4 · 서리 거인 요툰',ic:'snow',x:11,y:2,c:['#9CE4FF','#2F6FB0'],dg:'glacier'});
W_DRAWX.lm_glacier=(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*2.6,u*14,u*6.5); C(-7,-4,0,14,8,1.2,'#9DB4CC'); C(-6,-3,1.2,12,6,.6,'#DDEBF8');
  [[-6.5,-1.4],[3.7,-1.4]].forEach(([x,y])=>{ C(x,y,1.8,2.8,2.8,10,'#CFEAFF',{t:'#FFFFFF',l:'#BFE0FA',r:'#8CC0E8'}); C(x+.6,y+.6,11.8,1.6,1.6,2.6,'#9CE4FF',{t:'#E8F8FF'}); });
  C(-6.8,-1.8,11.6,13.6,3.6,1.8,'#8CC0E8',{t:'#E8F8FF'}); const P2=(a,c2)=>[ox+a*u,oy+a*u*.5-c2*u]; const gr=g.createLinearGradient(...P2(0,11.6),...P2(0,1.8)); gr.addColorStop(0,'#FFFFFF'); gr.addColorStop(1,'#5EC8FF');
  g.save(); g.globalAlpha=.85; g.fillStyle=gr; g.beginPath(); g.moveTo(...P2(-3.6,1.8)); g.lineTo(...P2(3.6,1.8)); g.lineTo(...P2(3.6,11.6)); g.lineTo(...P2(-3.6,11.6)); g.closePath(); g.fill(); g.clip();
  for(let i=0;i<14;i++){ const t=((tm*.35+i*.07)%1); const p=P2((wHash(i,2,seed)-.5)*7,2+t*9.6); g.fillStyle='rgba(255,255,255,'+(1-t)+')'; g.fillRect(p[0]-u*.4,p[1]-u*.4,u*.8,u*.8); } g.restore(); };

/* ═════ PART 9 확장 백로그용 빈 훅 (군대 · 방어 · 트랩 · 파티 놀이터 · 크루 랜드마크 · 제5원소) ═════ */
const W_FUTURE_HOOKS={v:1,army:null,defense:null,traps:null,partyGames:null,crewLandmark:null,mvpStatue:null,fifthElement:null};
/* v29.1 정령 상점 장식 */
W_DRAWX.ss_crys=(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*.6,u*5,u*2.4); const pl=.5+.5*Math.sin(tm*2+seed); C(-2.6,-1.6,0,5.2,3.2,.8,'#6A6E84');
  [[-1.4,-.6,0,1.4,1.4,5,'#B48CFF'],[.4,-.4,0,1.2,1.2,3.6,'#D9C4FF'],[-.2,.6,0,1,1,2.6,'#8A5BEF'],[-2,.4,0,.9,.9,2.2,'#C9AEFF']].forEach(a=>C(...a));
  g.fillStyle='rgba(197,155,255,'+(.25+pl*.3)+')'; g.beginPath(); g.ellipse(ox,oy-u*4,u*4.2,u*3,0,0,Math.PI*2); g.fill(); };
W_DRAWX.ss_arch=(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*9,u*3); C(-5,-1,0,1.4,1.4,7,'#C9CED8'); C(3.6,-1,0,1.4,1.4,7,'#C9CED8'); C(-5,-1,7,10,1.4,1.4,'#E4E0D6');
  ['#E8C060','#FF6A1A','#9CE4FF','#B48CFF'].forEach((col,i)=>{ C(-3.6+i*1.9,-.8,7.2,1,1,1,col); }); };
W_DRAWX.ss_spr=(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*.4,u*4,u*2); const b=Math.abs(Math.sin(tm*3+seed))*u*.6; C(-.5,-.5,0,1,1,1.6,'#F5EEDC'); g.save(); g.translate(0,-b); C(-2.2,-2.2,1.6,4.4,4.4,1.6,'#FF6FA8',{t:'#FF9CC4',l:'#FF6FA8',r:'#D84A86'}); C(-1.2,-1.2,3.2,.8,.8,.3,'#FFFFFF'); C(.6,.2,3.2,.7,.7,.3,'#FFFFFF'); g.restore(); };

/* ════════ v28.2b PART 7 2차: 내 정보(능력치 · 생활 · 기록) · 우편함 ════════ */
Object.assign(ICONS,{mail:'M3 6h18v12H3z M3 7l9 6 9-6',pot:'M5 10h14v5a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z M3 10h18 M9 6c0-1 1-1 1-2 M14 6c0-1 1-1 1-2'});
/* 생활 스킬: 횟수만큼 숙련도가 올라요 (Lv.1~10) */
const LIFE_T=[0,3,8,15,25,40,60,90,130,180];
const LIFE_RK=['견습','견습','초급','초급','중급','중급','숙련','숙련','장인','명인'];
const LIFE_SK=[
  {k:'fm',n:'농사',ic:'sprout',c:['#9BE86E','#2FA83E'],m:1,d:'텃밭 수확',tip:'내 섬 텃밭에서 작물을 거두면 올라요'},
  {k:'ck',n:'요리',ic:'pot',c:['#FFB15C','#E8420A'],m:1,d:'요리 완성',tip:'요리솥(내 섬 · 디코아 정착지)에서 요리하면 올라요'},
  {k:'sm',n:'대장',ic:'anvil',c:['#C9D3E6','#6C7A96'],m:1,d:'강화 · 수리 · 분해',tip:'대장간에서 강화 · 수리 · 분해 · 숫돌을 만들면 올라요'},
  {k:'tr',n:'무역',ic:'coin',c:['#FFE066','#E8900A'],m:1,d:'판매 · 납품',tip:'상인 토비에게 팔거나 무역 주문을 납품하면 올라요'},
  {k:'bd',n:'건축',ic:'tool',c:['#8FD0FF','#2A86E8'],m:1,d:'섬에 놓은 건물 · 장식',tip:'내 섬에 건물과 장식을 놓으면 올라요'},
  {k:'hn',n:'사냥',ic:'sword',c:['#FF8A8A','#C81E1E'],m:4,d:'몬스터 처치',tip:'던전 · 디코아에서 몬스터를 물리치면 올라요'},
  {k:'ex',n:'탐험',ic:'compass',c:['#6FE3D6','#159A8C'],m:2,d:'디코아 탐사 구역',tip:'대륙 디코아를 돌아다니며 안개를 걷으면 올라요'},
  {k:'pu',n:'정화',ic:'spark',c:['#C59BFF','#7044E0'],m:.4,d:'사당 · 수호자 · 전망대',tip:'사당을 풀고 전망대에 오르고 수호자를 정화하면 올라요'},
];
const lifeAdd=(r,k,n=1)=>({...((r&&r.life)||{}),[k]:(((r&&r.life)||{})[k]||0)+n});
const dkSeenN=D=>{ let n=0; if(typeof DK_GN==='undefined') return 0; for(let i=0;i<DK_GN*DK_GN;i++) if(dkSeenGet(D.seen,i)) n++; return n; };
function lifeVals(r,I){ const L=(r&&r.life)||{}; const G=gearOf(r||{}); const D=dkOf(r||{});
  return {fm:L.fm||0,ck:L.ck||0,sm:G.sm||0,tr:L.tr||0,bd:I?(I.items||[]).filter(x=>x.t!=='hall').length:0,hn:(r&&r.kills)||0,ex:dkSeenN(D),pu:dkShN(D)+Object.keys(D.tw||{}).length+Object.keys(D.g||{}).length*4}; }
function lifeLv(v,m){ let lv=1; for(let i=0;i<LIFE_T.length;i++) if(v>=LIFE_T[i]*m) lv=i+1; const cur=LIFE_T[lv-1]*m, nx=lv<10?LIFE_T[lv]*m:null; return {lv,rk:LIFE_RK[lv-1],p:nx==null?1:(v-cur)/(nx-cur),left:nx==null?0:Math.ceil(nx-v)}; }

/* ── 우편함: 버전 선물 · 매일 출석 · 탐험 장려금 ── */
const MAIL_VER='28.3';
const ymd=(t=Date.now())=>{ const d=new Date(t); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
function wMailList(r,I){ const M=(r&&r.mail)||{}; const got=M.got||{}; const D=dkOf(r||{}); const out=[];
  const today=ymd(), yest=ymd(Date.now()-864e5); const st=M.last===yest?(M.st||0)+1:M.last===today?(M.st||1):1;
  if(M.last!==today){ const d7=st%7===0; out.push({id:'day',day:1,from:'안내원 세라',ic:'gift',c:['#FFD54A','#E8900A'],t:'오늘의 출석 선물'+(st>1?' · '+st+'일 연속':''),b:d7?'7일 연속 출석! 강화 가루도 같이 넣었어요.':'매일 월드에 들르면 선물이 와요. 연속으로 올수록 늘어나요.',g:60+10*Math.min(st-1,6),dust:d7?15:0,exp:'오늘 자정까지',st}); }
  if(!got.welcome) out.push({id:'welcome',from:'안내원 세라',ic:'mail',c:['#6FD3FF','#2A86E8'],t:'DKO 월드에 온 걸 환영해요',b:'섬을 꾸미고, 던전과 대륙 디코아를 모험해 보세요. 작은 여비를 보내요.',g:200,dust:10});
  if(!got['v'+MAIL_VER]) out.push({id:'v'+MAIL_VER,from:'THRE3RIC STUDIO',ic:'star',c:['#C59BFF','#7044E0'],t:'v'+MAIL_VER+' 우편함 오픈 기념 선물',b:'월드가 새 단장을 했어요! 내 정보 · 생활 숙련 · 우편함과 무기 휠 · 장비 프리셋 · 빙하 섬도 즐겨 주세요.',g:300,dust:20});
  const sh=dkShN(D); [3,5,8,10].forEach(n=>{ if(sh>=n&&!got['sh'+n]) out.push({id:'sh'+n,from:'박사 아울',ic:'spark',c:['#6FE3D6','#159A8C'],t:'탐험 장려금 · 사당 '+n+'곳 정화',b:'자네 덕분에 디코아가 조금씩 깨어나고 있네. 연구비를 조금 나눠 주지.',g:100+n*25,dust:n,ore:n>=8?2:0}); });
  const tw=Object.keys(D.tw||{}).length; if(tw>=10&&!got.tw10) out.push({id:'tw10',from:'박사 아울',ic:'compass',c:['#6FE3D6','#159A8C'],t:'전망대 10곳 완주 기념',b:'디코아의 지도가 모두 밝혀졌군! 대단한 탐험가일세.',g:500,dust:30});
  if(I&&(I.hallLv||1)>=5&&!got.h5) out.push({id:'h5',from:'건축가 길드',ic:'home',c:['#FFB15C','#E8420A'],t:'섬 본부 Lv.5 달성 축하',b:'이제 가공 건물을 지을 수 있어요. 건축가 길드에서 축하금을 보내요.',g:400,dust:0});
  return out; }
function mailClaim(c,ml){ if(!ml.length) return Promise.resolve(false); let g=0, dust=0, ore=0;
  return c.saveRpg(r=>{ const L=wMailList(r,(c.islands||[]).find(x=>x.uid===c.uid)); const ids=new Set(ml.map(x=>x.id)); const pick=L.filter(x=>ids.has(x.id)); if(!pick.length) return null;
    const M={...((r&&r.mail)||{})}; M.got={...(M.got||{})}; g=0; dust=0; ore=0;
    pick.forEach(x=>{ g+=x.g||0; dust+=x.dust||0; ore+=x.ore||0; if(x.day){ M.last=ymd(); M.st=x.st; } else M.got[x.id]=1; });
    const out={mail:M}; if(dust||ore){ const N=gClone(gearOf(r)); N.dust=(N.dust||0)+dust; N.ore=(N.ore||0)+ore; out.gear=N; } return out; })
  .then(ok=>{ if(!ok) return false; wSfx('chest'); haptic([10,30,60]); if(g) return c.worldGold(g,'우편 '+ml.length+'통 받기 · 골드 +'+g.toLocaleString()+(dust?' · 강화 가루 +'+dust:'')+(ore?' · 광석 +'+ore:'')).then(()=>true); c.notify('우편을 받았어요'); return true; }); }

function WMail({c,I,onClose}){
  const r=rpgOf(c.me); const L=wMailList(r,I); const [busy,setBusy]=useState(false); const [open,setOpen]=useState(null);
  const take=ml=>{ if(busy) return; setBusy(true); mailClaim(c,ml).finally(()=>setBusy(false)); };
  const sum=L.reduce((a,x)=>a+(x.g||0),0);
  return html`<div className="wb20-shade" onClick=${onClose}><div className="wbs wml83" onClick=${e=>e.stopPropagation()}>
    <div className="wbs-h"><b>우편함</b><span className="wbs-sub">${L.length?'받을 우편 '+L.length+'통':'새 우편이 없어요'}</span><button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="wml83-l">${L.length?L.map(x=>html`<div key=${x.id} className=${'wml83-r'+(open===x.id?' op':'')}>
        <button type="button" className="wml83-m tap" onClick=${()=>setOpen(open===x.id?null:x.id)}><span className="gi30" style=${{'--g1':x.c[0],'--g2':x.c[1]}}><${Icon} n=${x.ic} s=${18} w=${2.3}/></span>
          <span className="wml83-t"><small>${x.from}${x.exp?html` · <em>${x.exp}</em>`:null}</small><b>${x.t}</b><span className="wml83-rw"><i><${GoldIc} s=${13}/>${x.g.toLocaleString()}</i>${x.dust?html`<i><${Icon} n="dust" s=${12} w=${2.4}/>${x.dust}</i>`:null}${x.ore?html`<i><${Icon} n="ore" s=${12} w=${2.4}/>${x.ore}</i>`:null}</span></span></button>
        <button type="button" className="wml83-go tap" disabled=${busy} onClick=${()=>take([x])}>받기</button>
        ${open===x.id?html`<p className="wml83-b">${x.b}</p>`:null}</div>`)
      :html`<div className="wml83-e"><span><${Icon} n="mail" s=${30} w=${2}/></span><b>우편함이 비었어요</b><small>매일 출석 선물과 탐험 장려금이 여기로 와요</small></div>`}</div>
    ${L.length?html`<div className="wml83-f"><span>모두 받으면 <b><${GoldIc} s=${14}/>${sum.toLocaleString()}</b></span><button type="button" className="tap" disabled=${busy} onClick=${()=>take(L)}>모두 받기</button></div>`:null}
  </div></div>`;
}

/* ── 내 정보: 능력치 · 생활 · 기록 ── */
function WMe({c,I,onClose,onBag,startTab,mailN,onMail}){
  const [tab,setTab]=useState(startTab||'st'); const [sk,setSk]=useState(null); const r=rpgOf(c.me); const st=cbStats(r); const G=gearOf(r); const set=gSetOf(G); const E=gEquipped(G); const D=dkOf(r);
  const look=rpgEqLook(r); const need=rpgNeed(r.lv); const lv=lifeVals(r,I);
  const W=E.w; const wel=W&&gElemOf(W); const bf=bufOf(r);
  const S2=[['체력',st.hp,'heart'],['공격력',st.atk,'sword'],['방어력',st.def,'shield'],['이동 속도',Math.round(st.spd*100)+'%','bolt'],['치명타',Math.round((st.crit||0)*100)+'%','target'],['공격 속도',(st.aspd||1).toFixed(2)+'/초','vibe'],['사거리',(st.rng||1)+'칸','expand'],['막기',Math.round((st.block||0)*100)+'%','shieldck']];
  const totLv=LIFE_SK.reduce((a,s)=>a+lifeLv(lv[s.k],s.m).lv,0);
  const legN=G.it.filter(x=>x.r===3).length;
  const REC=[['몬스터 처치',(r.kills||0).toLocaleString(),'sword'],['보스 처치',r.boss||0,'crown'],['사당 정화',dkShN(D)+' / 10','spark'],['전망대',Object.keys(D.tw||{}).length+' / 10','compass'],['수호자 정화',Object.keys(D.g||{}).length+' / 4','medal'],['깨진 석판',Object.keys(r.lore||{}).filter(k=>/^t\d$/.test(k)).length+' / 4','book'],['찾은 레시피',(r.rcp||[]).length,'pot'],['전설 장비',legN,'star'],['섬 본부',(I&&I.hallLv?'Lv.'+I.hallLv:'—'),'home'],['가방',G.it.length+' / '+gCap(G),'bag']];
  return html`<div className="wb20-shade" onClick=${onClose}><div className="wbs wme83" onClick=${e=>e.stopPropagation()}>
    <div className="wbs-h"><b>내 정보</b><span className="wbs-sub">${dispName(c.me)} · Lv.${r.lv}</span>${onMail?html`<button type="button" className="wme29-ml tap" onClick=${onMail}><${Icon} n="mail" s=${15} w=${2.3}/>우편함${mailN?html`<em>${mailN}</em>`:null}</button>`:null}<button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="wme83-tabs">${[['st','능력치'],['life','생활'],['rec','기록']].map(([k,n])=>html`<button key=${k} type="button" className=${'tap'+(tab===k?' on':'')} onClick=${()=>{ setTab(k); haptic(5); }}>${n}</button>`)}</div>
    ${tab==='st'?html`<div className="wme83-st">
      <div className="wme83-hero"><div className="wme83-stage"><${VoxelStage} av=${avatarOf(c.me)} w=${132} h=${132} eq=${look}/></div>
        <div className="wme83-id"><small>모험가</small><b>${dispName(c.me)}</b><span className="wme83-lv"><em>Lv.${r.lv}</em><i><i style=${{width:Math.min(100,r.xp/need*100)+'%'}}></i></i><small>${r.xp} / ${need}</small></span>
          <span className="wme83-tags">${wel?html`<i style=${{'--ec':GE_EL[wel].c}}>${GE_EL[wel].n} 무기</i>`:null}${set?html`<i style=${{'--ec':GE_EL[set].c}}>${GE_EL[set].n} 3세트</i>`:null}${bf?html`<i className="bf">${bf.t==='WEAK'?'배탈 · 공격력 감소':bufText(bf.t,bf.lv)}</i>`:null}</span>
          <button type="button" className="wme83-bag tap" onClick=${()=>{ onClose(); onBag(); }}><${Icon} n="bag" s=${15} w=${2.4}/>장비 바꾸기</button></div></div>
      <div className="wme83-g">${S2.map(([n,v,ic])=>html`<div key=${n} className="wme83-s"><span><${Icon} n=${ic} s=${14} w=${2.3}/>${n}</span><b>${v}</b></div>`)}</div>
      ${set?html`<p className="wme83-set"><b>${GE_EL[set].n} 3세트</b> ${GA_SET[set]}</p>`:html`<p className="wme83-set dim">같은 원소 방어구 3개를 입으면 세트 효과가 생겨요</p>`}
    </div>`:null}
    ${tab==='life'?html`<div className="wme83-life">
      <div className="wme83-lh"><span>생활 숙련 합계</span><b>${totLv}</b><small>/ ${LIFE_SK.length*10}</small></div>
      <div className="wme83-lg">${LIFE_SK.map(s=>{ const v=lv[s.k]; const L2=lifeLv(v,s.m); return html`<button type="button" key=${s.k} className=${'wme83-sk tap'+(L2.lv>=9?' hi':'')+(sk===s.k?' sel':'')} onClick=${()=>setSk(sk===s.k?null:s.k)}>
        <span className="gi30" style=${{'--g1':s.c[0],'--g2':s.c[1]}}><${Icon} n=${s.ic} s=${20} w=${2.2}/></span>
        <b>${s.n}</b><em>${L2.rk} · Lv.${L2.lv}</em><i className="wme83-bar"><i style=${{width:Math.round(L2.p*100)+'%','--c':s.c[1]}}></i></i>
        <small>${s.d} ${Math.floor(v).toLocaleString()}${L2.left?' · 다음 '+L2.left:' · 최고'}</small>${L2.lv>=5?html`<i className="wme83-pk">혜택 ${L2.lv>=9?2:1}</i>`:null}</button>`; })}</div>
      ${sk?(()=>{ const s=LIFE_SK.find(x=>x.k===sk); const t=lifeTier(r,sk,I); const P=LIFE_PK[sk]; return html`<div className="wme83-pd"><p>${s.tip}</p>
        <div className="wme83-pl">${[5,9].map((L,i)=>html`<span key=${L} className=${t>i?'on':''}><em>Lv.${L}</em>${P[1](P[0][i])}${t>i?html`<b>적용 중</b>`:null}</span>`)}</div></div>`; })()
      :html`<p className="wme83-tip">생활 숙련은 하는 만큼 자라요. Lv.5 · Lv.9가 되면 혜택이 열려요. 칸을 눌러 보세요.</p>`}
    </div>`:null}
    ${tab==='rec'?html`<div className="wme83-rec">${REC.map(([n,v,ic])=>html`<div key=${n} className="wme83-rr"><span><${Icon} n=${ic} s=${15} w=${2.3}/>${n}</span><b>${v}</b></div>`)}</div>`:null}
  </div></div>`;
}

/* ── 생활 숙련 혜택: Lv.5 · Lv.9에 열려요 ── */
const LIFE_PK={fm:[[1,2],v=>'수확 재료 +'+v],ck:[[3,6],v=>'요리 버프 +'+v+'분'],sm:[[.2,.4],v=>'수리비 -'+Math.round(v*100)+'%'],tr:[[.1,.2],v=>'판매 · 주문 골드 +'+Math.round(v*100)+'%'],
  bd:[[.1,.2],v=>'벽돌 공방 수확 +'+Math.round(v*100)+'%'],hn:[[.1,.2],v=>'던전 골드 +'+Math.round(v*100)+'%'],ex:[[15,30],v=>'글라이더 스태미나 +'+v],pu:[[10,25],v=>'최대 체력 +'+v]};
function lifeVal1(r,k,I){ const L=(r&&r.life)||{}; if(k==='fm'||k==='ck'||k==='tr') return L[k]||0; if(k==='sm') return gearOf(r||{}).sm||0; if(k==='hn') return (r&&r.kills)||0;
  if(k==='bd') return I?(I.items||[]).filter(x=>x.t!=='hall').length:0; const D=dkOf(r||{}); if(k==='ex') return dkSeenN(D); return dkShN(D)+Object.keys(D.tw||{}).length+Object.keys(D.g||{}).length*4; }
function lifeTier(r,k,I){ const s=LIFE_SK.find(x=>x.k===k); const lv=lifeLv(lifeVal1(r,k,I),s.m).lv; return lv>=9?2:lv>=5?1:0; }
function lifePerk(r,k,I){ try{ const t=lifeTier(r,k,I); return t?LIFE_PK[k][0][t-1]:0; }catch(e){ return 0; } }
try{ window.__lf={lifePerk,lifeTier,wMailList,rpgOf}; }catch(e){}

/* ═════════ v29.1 정령석: 사당 · 수호자 · 전망대 · 보물 · 의뢰 · 보스에서만 얻는 월드 특수 재화 ═════════ */
function ssGain(s,n,why){ if(!s||!n||!s.rpg) return; s.rpg.ss=(s.rpg.ss||0)+n; s.dkDirty=1; s.ssFx=(s.ssFx||[]).concat([{n,why,at:performance.now()}]); try{ const me=s.me; s.fx&&s.fx.push({k:'num',x:me.x,y:me.y,at:performance.now()+200,t:'정령석 +'+n,col:'#C59BFF'}); }catch(e){} wSfx&&wSfx('gem'); }
function SsIc({s=16}){ return html`<svg className="ss29-ic" viewBox="0 0 24 24" width=${s} height=${s} aria-hidden="true"><path d="M12 2.5l6.5 6-6.5 13-6.5-13z" fill="#B48CFF"/><path d="M12 2.5l6.5 6H5.5z" fill="#E2D2FF"/><path d="M12 8.5l6.5 0-6.5 13z" fill="#7A4BE0"/></svg>`; }
/* 정령 상점 품목: 앱 꾸미기(월드 전용) · 섬 장식 · 강화 재료 */
const SS_SHOP=[
  {k:'frame:spirit',t:'app',n:'정령의 고리',d:'앱 프로필 테두리 · 보랏빛 정령이 돌아요',p:25,ic:'sparkle'},
  {k:'frame:dkoa',t:'app',n:'원소 수호 링',d:'앱 프로필 테두리 · 네 원소가 번갈아 빛나요',p:45,ic:'sparkle',need:g=>Object.keys(g||{}).length>=2,needT:'수호자 2명 정화'},
  {k:'banner:w-dkoa',t:'app',n:'대륙 디코아 배너',d:'앱 프로필 배너',p:15,ic:'image',bn:'w-dkoa'},
  {k:'banner:w-volcano',t:'app',n:'화산 지대 배너',d:'앱 프로필 배너',p:15,ic:'image',bn:'w-volcano'},
  {k:'banner:w-frost',t:'app',n:'서리 설원 배너',d:'앱 프로필 배너',p:15,ic:'image',bn:'w-frost'},
  {k:'banner:w-storm',t:'app',n:'폭풍 유적 배너',d:'앱 프로필 배너',p:15,ic:'image',bn:'w-storm'},
  {k:'banner:w-spire',t:'app',n:'원소 첨탑 배너',d:'앱 프로필 배너 · 첨탑의 다섯 홈',p:30,ic:'image',bn:'w-spire'},
  {k:'ss_crys',t:'deco',n:'정령 수정 무리',d:'내 섬 장식 · 밤에 은은히 빛나요',p:6},
  {k:'ss_arch',t:'deco',n:'원소 아치',d:'내 섬 장식(2×1) · 네 원소 보석',p:12},
  {k:'ss_spr',t:'deco',n:'통통 버섯',d:'내 섬 장식 · 밟으면 퐁 튀어요',p:5},
  {k:'dust30',t:'gear',n:'강화 가루 30',d:'대장간 강화 재료',p:4},
  {k:'stone3',t:'gear',n:'숫돌 3개',d:'던전에서 무뎌진 무기를 갈아요',p:3},
];
function WSpiritShop({c,rpg}){ const ss=rpg.ss||0; const own=k=>!!((c.me.owned||{})[k]); const D=dkOf(rpg); const [busy,setBusy]=useState(false);
  const buy=it=>{ if(busy) return; if(ss<it.p) return c.notify('정령석이 '+(it.p-ss)+'개 모자라요 · 디코아 사당 · 수호자 · 전망대에서 얻어요','err'); if(it.need&&!it.need(D.g)) return c.notify(it.needT+' 뒤에 살 수 있어요','err');
    setBusy(true); const done=()=>setBusy(false);
    if(it.t==='app') return c.ssBuyOwned(it.k,it.p,it.n).then(ok=>{ if(ok){ wSfx('clear'); haptic([20,40,60]); } }).finally(done);
    c.saveRpg(r=>{ const s0=r.ss||0; if(s0<it.p) return null; const o={ss:s0-it.p}; if(it.t==='gear'){ const N=gClone(gearOf(r)); if(it.k==='dust30') N.dust=(N.dust||0)+30; if(it.k==='stone3') N.stone=(N.stone||0)+3; o.gear=N; } return o; },it.n+' 획득!').then(ok=>{ if(ok&&it.t==='deco') c.giveWorldItem(it.k); if(ok){ wSfx('gem'); haptic([10,30]); } }).finally(done); };
  const G=[['app','앱 꾸미기','월드에서만 얻는 프로필 테두리 · 배너'],['deco','섬 장식','사면 상점 → 선물 칸에 들어가요'],['gear','강화 재료','']];
  return html`<div className="ssh29">
    <div className="ssh29-top"><span className="ssh29-gem"><${SsIc} s=${30}/></span><div><b>${ss}<small>정령석</small></b><p>사당 정화 +3 · 수호자 +8 · 전망대 · 디코아 금빛 보물 +1 · 협동 보물 +2 · 정착지 의뢰 +1 · 테마 섬 보스 +1</p></div></div>
    ${G.map(([t,h,sub])=>html`<section key=${t} className="ssh29-s"><div className="ssh29-h"><b>${h}</b>${sub?html`<small>${sub}</small>`:null}</div>
      <div className="ssh29-g">${SS_SHOP.filter(x=>x.t===t).map(it=>{ const o=it.t==='app'&&own(it.k); const lk=it.need&&!it.need(D.g); return html`<button key=${it.k} type="button" className=${'ssh29-c tap'+(o?' own':'')+(lk?' lk':'')} onClick=${()=>!o&&buy(it)}>
        <span className="ssh29-art">${it.bn?html`<i className="bn" style=${{background:(BANNERS.find(b=>b.id===it.bn)||{}).bg}}></i>`:it.k.startsWith('frame:')?html`<${PfpView} m=${{...c.me,frame:it.k.slice(6),owned:{...(c.me.owned||{}),[it.k]:true}}} s=${46}/>`:it.t==='deco'?html`<${WItemIcon} t=${it.k}/>`:html`<${Icon} n=${it.k==='dust30'?'dust':'stone'} s=${26} w=${2.2}/>`}</span>
        <b>${it.n}</b><small>${lk?it.needT+' 필요':it.d}</small><span className="ssh29-p">${o?'보유 중':html`<${SsIc} s=${14}/>${it.p}`}</span></button>`; })}</div></section>`)}
  </div>`; }

/* ════════ v28.5 크루 협동: 파티 핑 · 아군 버프 실시간 동기화 · 협동 사당 ════════
   내 상태는 섬 문서 here.co 로 보내고(이벤트가 생기면 바로), 받는 쪽은 받은 시각 기준으로 남은 시간을 계산해요. */
const CO_PG={go:['모여!','#5BE0A4','flag'],warn:['위험!','#FF5A5A','bolt'],loot:['보물!','#FFD54A','gift']};
/* 내 협동 상태 (ping 때 같이 보내요) */
function coopOut(s){ const cb=s.cb, me=s.me; if(!s) return null; const now=performance.now(); const o={};
  if(cb&&!me.dead){ o.r=cb.role; if(cb.role==='healer') o.a=1;
    if(cb.role==='tank'&&cb.ultOn>now) o.tw=Math.round(cb.ultOn-now);
    if(cb.role==='dealer'&&cb.ultOn>now) o.ds=Math.round(cb.ultOn-now);
    if(cb.role==='healer'&&cb.turret&&cb.turret.end>now) o.tu={x:Math.round(cb.turret.x*10)/10,y:Math.round(cb.turret.y*10)/10,rem:Math.round(cb.turret.end-now)}; }
  if(s.coEv) o.pq=s.coEv; if(s.coPg&&now-s.coPg.t<20000) o.pg={n:s.coPg.n,x:s.coPg.x,y:s.coPg.y,k:s.coPg.k};
  if(s.coSo) o.so=s.coSo; if(s.coSg) o.sg=s.coSg; return o; }
/* 이벤트(치유 파동 · 보호막 · 사당 봉인 해제)는 번호를 올리고 바로 보내요 */
function coopEv(s,k,extra){ if(!s) return; s.coN=(s.coN||0)+1; const me=s.me;
  if(k==='so') s.coSo={n:s.coN,...extra}; else s.coEv={n:s.coN,k,x:Math.round(me.x*10)/10,y:Math.round(me.y*10)/10};
  s.pingNow&&s.pingNow(); }
/* 파티 핑 찍기 (내 화면에도 표시) */
function coopPing(s,x,y,k){ if(!s) return; const now=performance.now(); s.coN=(s.coN||0)+1; s.coPg={n:s.coN,x:Math.round(x*10)/10,y:Math.round(y*10)/10,k,t:now};
  s.pings=(s.pings||[]).filter(p=>now-p.at<8000); s.pings.push({x,y,k,at:now,who:'나',mine:1}); wSfx('pick'); haptic([8,16]); s.pingNow&&s.pingNow(); }
/* 매 프레임: 크루가 보낸 효과 적용 */
function coopTick(s,dt,now,api){ const me=s.me; if(!s.others) return; s.coIn=s.coIn||{}; let wall=false, scan=null; const crew=!!(s.cb&&s.cb.mode==='crew'); const st=s.st;
  for(const o of s.others.values()){ const C=o.co; if(!C) continue; let I=s.coIn[o.uid];
    if(!I){ I=s.coIn[o.uid]={pq:C.pq?C.pq.n:0,pg:C.pg?C.pg.n:0,so:C.so?C.so.n:0,sg:C.sg?C.sg.n:0,ver:C,rx:now}; }
    /* v29.4 지하 사당 협동: 크루가 바꾼 장치 상태를 나에게도 */
    if(C.sg&&C.sg.n>(I.sg||0)){ const L=(C.sg.L||[]).filter(e=>e.n>(I.sg||0)); I.sg=C.sg.n; if(typeof shApply==='function') L.forEach(e=>shApply(s,e,nick)); }
    if(I.ver!==C){ I.ver=C; I.rx=now; } const age=now-I.rx; const nick=o.m?dispName(o.m):'크루';
    /* 파티 핑 */
    if(C.pg&&C.pg.n>I.pg){ I.pg=C.pg.n; s.pings=(s.pings||[]).filter(p=>now-p.at<8000); s.pings.push({x:C.pg.x,y:C.pg.y,k:C.pg.k,at:now,who:nick}); wSfx('pick'); haptic([10,20]); s.say&&s.say(nick+' · '+(CO_PG[C.pg.k]||CO_PG.go)[0]); }
    /* 협동 사당: 크루가 봉인을 풀면 근처에 있는 나도 열려요 */
    if(C.so&&C.so.n>I.so){ I.so=C.so.n; const M=s.M; const g=C.so.g; if(M&&M.dk&&g&&!s['open_'+g]){ const S0=M.shr[+g.slice(1)]; if(S0&&Math.hypot(S0.x-me.x,S0.y-me.y)<9){ M.gim.forEach(g0=>{ if(g0.grp===g&&g0.k==='door'&&!g0.done){ g0.done=1; g0.at=now; M.blk.delete(g0.x+','+g0.y); } if(g0.grp===g&&g0.k==='icewall'&&!g0.done){ g0.done=1; g0.at=now; M.blk.delete(g0.x+','+g0.y); } }); s['open_'+g]=1; s['coOpen_'+g]=1; wSfx('gate'); s.say&&s.say(nick+'님이 봉인을 풀었어요! 같이 결정으로 가요'); } } }
    if(!crew||me.dead||!st) { if(C.pq&&C.pq.n>I.pq) I.pq=C.pq.n; continue; }
    const d=Math.hypot(o.x-me.x,o.y-me.y);
    /* 치유의 오라 (초당 +5) · 생명의 성역 터렛 (초당 +18) */
    let h=0; if(C.a&&d<4.5) h+=5; if(C.tu&&C.tu.rem-age>0&&Math.hypot(C.tu.x-me.x,C.tu.y-me.y)<5) h+=18;
    if(h&&me.hp<st.hp){ I.ht=(I.ht||0)+dt; if(I.ht>=1){ I.ht-=1; const a=Math.min(h,st.hp-me.hp); me.hp+=a; if(a>=5) s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:'+'+a,col:'#7CF0B5',sm:1}); } }
    /* 불굴의 방벽 (받는 피해 -60%) · 약점 간파 */
    if(C.tw&&C.tw-age>0&&d<4.5) wall=true;
    if(C.ds&&C.ds-age>0) scan={x:o.x,y:o.y,end:now+C.ds-age};
    /* 순간 이벤트: 치유의 파동 · 강화 보호막 */
    if(C.pq&&C.pq.n>I.pq){ I.pq=C.pq.n; const e=C.pq; const de=Math.hypot(e.x-me.x,e.y-me.y);
      if(e.k==='pulse'&&de<5.5){ const a=Math.min(55,st.hp-me.hp); me.hp+=a; if(s.cb) s.cb.pst={}; s.fx.push({k:'cbpulse',x:e.x,y:e.y,at:now}); s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:'+'+a+' · '+nick,col:'#7CF0B5'}); }
      if(e.k==='shield'&&de<5&&s.cb){ s.cb.shieldHp=Math.max(s.cb.shieldHp||0,70); s.cb.shieldT=now+5000; s.fx.push({k:'cbbar',x:e.x,y:e.y,at:now}); s.fx.push({k:'num',x:me.x,y:me.y,at:now,t:'보호막 · '+nick,col:'#9CD2FF',sm:1}); } } }
  s.coWall=wall; s.coScan=scan; }
/* 핑 그리기: 기둥 + 고리, 화면 밖이면 가장자리 화살표 */
function coopDraw(g,s,scr,u,HW,HH,now){ if(!s.pings||!s.pings.length) return; s.pings=s.pings.filter(p=>now-p.at<8000);
  for(const p of s.pings){ const P=CO_PG[p.k]||CO_PG.go; const [px,py]=scr(p.x,p.y); const k=(now-p.at)/8000; const a=k>.8?(1-k)/.2:1; const pul=((now-p.at)%1200)/1200;
    const on=px>-20&&px<s.vw+20&&py>-40&&py<s.vh+20;
    if(on){ g.save(); g.globalAlpha=a; g.strokeStyle=P[1]; g.lineWidth=3; g.beginPath(); cbEl(g,px,py,HW*(1+pul*1.6),HH*(1+pul*1.6),0,0,Math.PI*2); g.globalAlpha=a*(1-pul); g.stroke(); g.globalAlpha=a;
      const grd=g.createLinearGradient(px,py-u*40,px,py); grd.addColorStop(0,'rgba(255,255,255,0)'); grd.addColorStop(1,P[1]); g.fillStyle=grd; g.fillRect(px-u*.9,py-u*40,u*1.8,u*40);
      g.fillStyle='rgba(22,26,34,.85)'; const tw=Math.max(54,u*15); g.beginPath(); g.roundRect?g.roundRect(px-tw/2,py-u*50,tw,u*8,u*4):g.rect(px-tw/2,py-u*50,tw,u*8); g.fill();
      g.fillStyle=P[1]; g.font='900 '+Math.round(Math.max(11,u*3))+'px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(P[0]+' '+p.who,px,py-u*46); g.restore(); }
    else { const cx=s.vw/2, cy=s.vh/2; const ang=Math.atan2(py-cy,px-cx); const R=Math.min(s.vw,s.vh)/2-34; const ex=cx+Math.cos(ang)*R*(s.vw/Math.min(s.vw,s.vh))*.92, ey=cy+Math.sin(ang)*R;
      const x0=Math.max(26,Math.min(s.vw-26,ex)), y0=Math.max(90,Math.min(s.vh-120,ey)); g.save(); g.globalAlpha=a; g.translate(x0,y0); g.rotate(ang); g.fillStyle=P[1]; g.strokeStyle='rgba(22,26,34,.9)'; g.lineWidth=2.5; g.beginPath(); g.moveTo(14,0); g.lineTo(-6,-9); g.lineTo(-2,0); g.lineTo(-6,9); g.closePath(); g.fill(); g.stroke(); g.restore(); } } }

/* 핑 버튼 (던전 · 디코아 상단) */
function CoopPingBtn({S,n,dk}){ const [o,setO]=useState(false);
  const go=k=>{ const s=S.current; if(!s) return; coopPing(s,s.me.x,s.me.y,k); setO(false); };
  return html`<span className=${'pg83'+(dk?' dk':'')}><button type="button" className=${'pg83-b tap'+(o?' on':'')} onClick=${()=>setO(!o)} aria-label="파티 핑"><${Icon} n="flag" s=${18} w=${2.3}/>${n?html`<i className="pg83-n">${n}</i>`:null}<small>핑</small></button>
    ${o?html`<div className="pg83-m">${Object.entries(CO_PG).map(([k,[t,c0,ic]])=>html`<button key=${k} type="button" className="tap" style=${{'--c':c0}} onClick=${()=>go(k)}><i><${Icon} n=${ic} s=${14} w=${2.6}/></i>${t}</button>`)}<small>${n?'같은 곳의 크루 '+n+'명에게 보여요':'주변에 크루가 없어요 · 나만 보여요'}</small></div>`:null}</span>`; }

/* ════════ v29.1 월드: 업화 대무사(헬바운드 새 보스) · 넉백 · 몸 겹침 막기 ════════ */
/* 헬바운드 세 번째 보스: 뚱뚱하고 거대한 무사 (등 뒤 깃발 매듭이 약점) */
Object.assign(MOB,{samurai:{n:'업화 대무사',hp:1700,atk:38,spd:1.1,xp:420,b:[650,950],c:['#2A1A1E','#E8B040'],sz:3.1,kind:'samurai',boss:1,slam:1,dash:1,eq:[1,'s',.45,'g'],coin:[28,40],re:130}});
Object.assign(CB_MOB,{samurai:[5200,76,48]}); Object.assign(CB_WP,{samurai:{f:-.6,boss:1,n:'등 뒤 깃발 매듭'}}); CB_FIRE_MOB.add('samurai');
if(typeof MOB_ING!=='undefined') MOB_ING.samurai='fberry';
DG.hell.boss.push(['samurai',-3,-24]);
{ const L=W_LM.find(l=>l.k==='hell'); if(L) L.d='난이도 보통 · 추천 Lv.5 · 헬하운드 · 용암 골렘 · 업화 대무사'; }
/* 복셀 모양: +y가 앞 */
function samuraiBoxes(b,dec,M,P,fl,m){ const C=M.c; const s=P.atk?Math.sin(P.atk*Math.PI):0; const br=Math.sin(P.t*2+m.id)*.18; const mv=P.mv?Math.sin(P.t*9)*.5:0;
  const RED=fl||'#B0202A', RED2=fl||'#86141E', GOLD='#E8B040', DARK=fl||'#2A1A1E';
  /* 다리 · 하카마 */
  b(-2.8,-1.3+mv,0,-.9,1.3+mv,3.2,DARK); b(.9,-1.3-mv,0,2.8,1.3-mv,3.2,DARK);
  b(-3.9,-2.8,2.4,3.9,2.8,5.2,fl||'#3A2226'); for(let i=0;i<4;i++){ const x=-3.6+i*1.9; b(x,2.7,2.6,x+1.5,3,5,RED2); }
  /* 큰 배 갑옷 */
  b(-4.6,-3.4,5,4.6,3.6,10.6+br,RED); b(-3.8,3.5,5.6,3.8,4.4,9.8+br,fl||'#C82A32');
  b(-4.7,-3.5,5.2,4.7,3.7,6,GOLD); dec(4.42,-3.6,7.6,3.6,7.9,GOLD); dec(4.42,-3.6,8.8,3.6,9.1,GOLD); dec(4.43,-.5,6.2,.5,9.6,GOLD);
  /* 어깨 판 */
  b(-6.6,-2.2,8.4+br,-4.4,2.2,11+br,RED); b(4.4,-2.2,8.4+br,6.6,2.2,11+br,RED); b(-6.7,-2.3,8.2+br,-4.3,2.3,8.6+br,GOLD); b(4.3,-2.3,8.2+br,6.7,2.3,8.6+br,GOLD);
  /* 팔: 오른손이 큰 칼을 쥐어요 */
  b(-6,-1,4.8,-4.4,1.2,8.4,DARK); b(4.4,-1+s*1.2,4.8,6,1.2+s*1.2,8.4,DARK);
  /* 머리: 가면 · 투구 · 초승달 뿔 */
  b(-2.2,-2,10.6+br,2.2,2.2,13.4+br,fl||'#3A2226'); b(-2,2.15,10.8+br,2,2.6,12.4+br,fl||'#1A1014');
  dec(2.62,-1.5,12.6+br,-.4,13.2+br,'#FFD54A'); dec(2.62,.4,12.6+br,1.5,13.2+br,'#FFD54A'); dec(2.63,-1.2,11.1+br,1.2,11.5+br,'#F2E8D0');
  b(-3.6,-3.4,13+br,3.6,3.4,13.7+br,RED); b(-2.6,-2.4,13.7+br,2.6,2.4,15.2+br,DARK);
  b(-3,1.9,15+br,-2.2,2.3,17.6+br,GOLD); b(2.2,1.9,15+br,3,2.3,17.6+br,GOLD); b(-3.4,1.9,14.6+br,-2.2,2.3,15.2+br,GOLD); b(2.2,1.9,14.6+br,3.4,2.3,15.2+br,GOLD); b(-.5,2.1,14.6+br,.5,2.6,16+br,'#FF5A2A');
  /* 등 뒤 깃발 (약점) */
  b(-.25,-4,8,.25,-3.5,21,'#5A3A2A'); const fw=Math.sin(P.t*4)*.4; b(-2.8+fw,-3.95,16.4,-.25,-3.75,20.6,fl||'#FFE8C0'); dec(-3.97,-2.3+fw,17.6,-.7+fw,19.4,'#B0202A');
  b(-1,-4.1,8.6,1,-3.4,9.6,GOLD);
  /* 큰 칼: 평소엔 어깨에 메고, 공격할 때 앞으로 휘둘러요 */
  if(s>0.02){ const z=7.2+ (1-s)*3; b(5.1,1.2,z,5.7,2.6,z+.6,'#3A2226'); b(5.2,2.6,z+.1,5.6,2.6+9*s+2,z+.5,'#E6ECF2'); b(5.15,2.6,z+.45,5.65,2.6+9*s+2,z+.6,'#9AA6B8'); }
  else { b(5,-.3,8.4,5.6,.3,10,'#3A2226'); b(5.05,-.2,10,5.55,.2,19,'#E6ECF2'); b(4.6,-.6,9.8,6,.6,10.2,GOLD); } }

/* ── 넉백 · 겹침 막기 ── */
function phKnock(o,dx,dy,str){ const d=Math.hypot(dx,dy)||1; o.kvx=dx/d*str; o.kvy=dy/d*str; o.kvT=.2; }
/* 매 프레임: 밀려나는 속도 처리 + 몬스터끼리 · 나와 몬스터가 겹치지 않게 살짝 밀어내요 */
function phTick(s,dt,A){ const me=s.me, L=s.mobs; if(!L) return;
  const mv=(o,ok,dx,dy)=>{ const nx=o.x+dx, ny=o.y+dy; if(ok(nx,ny)){ o.x=nx; o.y=ny; return true; } if(ok(nx,o.y)){ o.x=nx; return true; } if(ok(o.x,ny)){ o.y=ny; return true; } return false; };
  const meOK=(x,y)=>A.meOK(x,y), mOK=m=>(x,y)=>!A.mobBlk(m,x,y);
  const FX=m=>MOB[m.t]&&MOB[m.t].fix;
  for(const m of L){ if(m.kvT>0&&FX(m)) m.kvT=0; if(m.kvT>0){ const k=m.kvT/.2; mv(m,mOK(m),m.kvx*dt*k,m.kvy*dt*k); m.kvT-=dt; } }
  if(me.kvT>0&&!me.dead){ const k=me.kvT/.2; mv(me,meOK,me.kvx*dt*k,me.kvy*dt*k); me.kvT-=dt; }
  const R=m=>.36*((MOB[m.t]||{}).sz||1)+.1;
  for(let i=0;i<L.length;i++){ const a=L[i]; if(a.born>performance.now()) continue; const ra=R(a);
    for(let j=i+1;j<L.length;j++){ const b2=L[j]; const dx=b2.x-a.x, dy=b2.y-a.y; const rr=ra+R(b2); if(Math.abs(dx)>rr||Math.abs(dy)>rr) continue; const d=Math.hypot(dx,dy); if(d>=rr||d<1e-4) continue;
      const ov=(rr-d)*.5*Math.min(1,dt*10); if(FX(a)&&FX(b2)) continue; const wa=FX(a)?0:FX(b2)?1:a.boss?.15:b2.boss?.85:.5; const ux=dx/d, uy=dy/d; mv(a,mOK(a),-ux*ov*2*wa,-uy*ov*2*wa); mv(b2,mOK(b2),ux*ov*2*(1-wa),uy*ov*2*(1-wa)); }
    if(!me.dead&&!me.air){ const dx=me.x-a.x, dy=me.y-a.y; const rr=ra+.34; if(Math.abs(dx)<rr&&Math.abs(dy)<rr){ const d=Math.hypot(dx,dy); if(d<rr&&d>1e-4){ const ov=(rr-d)*Math.min(1,dt*12); const ux=dx/d, uy=dy/d; mv(me,meOK,ux*ov*(a.boss?1:.65),uy*ov*(a.boss?1:.65)); if(!a.boss&&!FX(a)) mv(a,mOK(a),-ux*ov*.35,-uy*ov*.35); } } } } }

/* ── 아기자기한 새 몬스터: 솜뭉치 3종 (콩콩 뛰어다녀요) ── */
Object.assign(MOB,{
  cpuff:{n:'솜뭉치',hp:120,atk:18,spd:1.45,xp:18,b:[12,22],c:['#FFFFFF','#FF9EC0'],sz:.9,kind:'puff'},
  spuff:{n:'눈뭉치',hp:280,atk:40,spd:1.35,xp:34,b:[24,40],c:['#EEF8FF','#7CC2FF'],sz:1,kind:'puff'},
  zpuff:{n:'찌릿 뭉치',hp:340,atk:50,spd:1.55,xp:44,b:[30,50],c:['#FFF6C8','#F2B020'],sz:1,kind:'puff'}});
Object.assign(CB_MOB,{cpuff:[120,18,5],spuff:[300,42,28],zpuff:[360,52,32]}); Object.assign(CB_WP,{cpuff:{f:-.5},spuff:{f:-.5},zpuff:{f:-.5}});
if(typeof MOB_ING!=='undefined') Object.assign(MOB_ING,{cpuff:'sjelly',spuff:'ijelly',zpuff:'sjelly'});
if(typeof DK_POOL!=='undefined'){ DK_POOL.plain.push(['cpuff',3]); DK_POOL.ice.push(['spuff',2]); DK_POOL.bolt.push(['zpuff',2]); }
function puffBoxes(b,dec,M,P,fl,m,blink){ const C=M.c; const hop=P.mv?Math.abs(Math.sin(P.t*9+m.id))*1.6:Math.abs(Math.sin(P.t*2.4+m.id))*.3; const sq=P.mv?1+Math.sin(P.t*18+m.id)*.06:1; const W0=fl||C[0];
  b(-1.4,-.6,hop,-.5,.6,hop+.7,C[1]); b(.5,-.6,hop,1.4,.6,hop+.7,C[1]);
  b(-2.4*sq,-2.2,hop+.6,2.4*sq,2.2,hop+3.8,W0); b(-2.9*sq,-1.6,hop+1.2,2.9*sq,1.6,hop+3.3,W0); b(-1.8,-2.6,hop+1.2,1.8,2.6,hop+3.4,W0); b(-1.8,-1.6,hop+3.6,1.8,1.6,hop+4.6,W0); b(-.9,-.9,hop+4.5,.9,.9,hop+5.1,W0);
  if(m.t==='zpuff'){ b(-.3,-.3,hop+5,.3,.3,hop+6.4,'#FFE45A'); b(-.3,-.3,hop+6.2,1.1,.3,hop+6.6,'#FFE45A'); }
  if(m.t==='spuff'){ b(-1.2,-1.2,hop+4.9,1.2,1.2,hop+5.3,'#FFFFFF'); }
  const eh=blink?.12:.9; dec(2.63,-1.3,hop+2.4,-.5,hop+2.4+eh,'#1A1F2C'); dec(2.63,.5,hop+2.4,1.3,hop+2.4+eh,'#1A1F2C');
  if(!blink){ dec(2.66,-1.1,hop+2.95,-.8,hop+3.2,'#FFFFFF'); dec(2.66,.7,hop+2.95,1,hop+3.2,'#FFFFFF'); }
  dec(2.64,-2.1,hop+1.8,-1.4,hop+2.2,C[1]); dec(2.64,1.4,hop+1.8,2.1,hop+2.2,C[1]); dec(2.64,-.35,hop+1.7,.35,hop+1.95,'#1A1F2C'); }

/* ════════ v29.5 거미줄(Spiderweb) 섬 배치 ════════
   · 1~10번 섬: 소셜 아일랜드를 둘러싼 1차 링 (고정된 10개 각도 · 사람이 늘어도 자리가 안 바뀌어요)
   · 11번부터: 이미 있는 섬들의 바깥쪽 빈 연결 슬롯을 BFS(깊이 → 먼저 생긴 순)로 찾아 다리로 이어요 → 2차 · 3차 … 링으로 무한히 넓어져요
   · 모든 섬은 최대로 커졌을 때의 반지름(WEB.RF)을 미리 잡아 두고, 섬 중심 사이 거리 · 다리와 다른 섬 · 다리끼리의 거리를 검사해서 겹치지 않아요
   · 같은 순서(가입 순)만 주면 어느 기기에서 계산해도 똑같은 좌표가 나와요 (순수 함수) */
const WEB={RF:12.5,GAP:3.5,R1:48,D:33,OFF:[0,.62,-.62,1.24,-1.24,1.86,-1.86],BR:2.4,MAXN:400};
const webMinC=()=>2*WEB.RF+WEB.GAP;
/* 점과 선분 거리 */
function webPS(px,py,ax,ay,bx,by){ const dx=bx-ax, dy=by-ay, L=dx*dx+dy*dy; let t=L?((px-ax)*dx+(py-ay)*dy)/L:0; t=Math.max(0,Math.min(1,t)); return Math.hypot(px-ax-t*dx,py-ay-t*dy); }
/* 선분끼리 거리 (교차하면 0) */
function webSS(a,b){ const cr=(o,p,q)=>(p[0]-o[0])*(q[1]-o[1])-(p[1]-o[1])*(q[0]-o[0]);
  const A1=[a[0],a[1]], A2=[a[2],a[3]], B1=[b[0],b[1]], B2=[b[2],b[3]];
  const d1=cr(B1,B2,A1), d2=cr(B1,B2,A2), d3=cr(A1,A2,B1), d4=cr(A1,A2,B2); if(((d1>0)!==(d2>0))&&((d3>0)!==(d4>0))) return 0;
  return Math.min(webPS(A1[0],A1[1],...B1,...B2),webPS(A2[0],A2[1],...B1,...B2),webPS(B1[0],B1[1],...A1,...A2),webPS(B2[0],B2[1],...A1,...A2)); }
/* n개 섬 자리 계산 → [{i,cx,cy,par,dep,ux,uy}] · par=-1은 소셜 아일랜드에 바로 붙은 섬 */
const WEB_C=new Map();
function wWeb(n){ n=Math.max(0,Math.min(WEB.MAXN,n|0)); const hit=WEB_C.get(n); if(hit) return hit;
  /* 앞 번호 섬의 자리는 뒤 번호에 영향을 받지 않아요 → 더 큰 결과가 있으면 잘라 써요 */
  for(const [k,v] of WEB_C) if(k>n){ const r=v.slice(0,n); WEB_C.set(n,r); return r; }
  const P=[], BR=[]; const minC=webMinC();
  const okPt=(x,y)=>{ if(Math.hypot(x,y)<W_CR+WEB.RF+5) return false; for(const q of P) if(Math.hypot(q.cx-x,q.cy-y)<minC) return false; return true; };
  const okSeg=(ax,ay,bx,by,par)=>{ for(let j=0;j<P.length;j++){ if(j===par) continue; const q=P[j]; if(webPS(q.cx,q.cy,ax,ay,bx,by)<WEB.RF+1.2) return false; }
    if(par>=0&&webPS(0,0,ax,ay,bx,by)<W_CR+WEB.RF*.5) return false;
    const seg=[ax,ay,bx,by]; for(const b of BR){ if(b.a===par||b.b===par) continue; if(webSS(seg,b.s)<WEB.BR) return false; } return true; };
  for(let i=0;i<Math.min(n,10);i++){ const a=-Math.PI*.75+Math.PI/10+i*2*Math.PI/10; /* v29.7 성(북쪽) 정면을 비켜 가요 */ const ux=Math.cos(a), uy=Math.sin(a); P.push({i,cx:Math.round(ux*WEB.R1),cy:Math.round(uy*WEB.R1),par:-1,dep:1,ux,uy}); BR.push({a:-1,b:i,s:[ux*W_CR,uy*W_CR,P[i].cx,P[i].cy]}); }
  for(let i=10;i<n;i++){ let put=null;
    /* BFS: 얕은 링부터, 같은 깊이면 먼저 생긴 섬부터 슬롯을 봐요 */
    const order=P.map((p,j)=>j).sort((a,b)=>P[a].dep-P[b].dep||a-b);
    for(let ext=0;ext<4&&!put;ext++){ const D=WEB.D+ext*6;
      for(const j of order){ const p=P[j]; const base=Math.atan2(p.uy,p.ux);
        for(const off of WEB.OFF){ const a=base+off; const ux=Math.cos(a), uy=Math.sin(a); const x=Math.round(p.cx+ux*D), y=Math.round(p.cy+uy*D);
          if(!okPt(x,y)) continue; if(!okSeg(p.cx,p.cy,x,y,j)) continue;
          /* 바깥으로 뻗는 방향만 (안쪽으로 되돌아오지 않게) */
          if(Math.hypot(x,y)<Math.hypot(p.cx,p.cy)+D*.35) continue;
          put={i,cx:x,cy:y,par:j,dep:p.dep+1,ux,uy}; break; }
        if(put) break; } }
    if(!put){ /* 마지막 수단: 바깥 나선에서 빈 자리 (이론상 거의 안 와요) */
      for(let r=WEB.R1+WEB.D;!put&&r<WEB.R1+WEB.D*40;r+=8) for(let k=0;k<36&&!put;k++){ const a=k/36*Math.PI*2+r*.01; const x=Math.round(Math.cos(a)*r), y=Math.round(Math.sin(a)*r); if(!okPt(x,y)) continue;
        let best=-1, bd=1e9; P.forEach((q,j)=>{ const d=Math.hypot(q.cx-x,q.cy-y); if(d<bd&&okSeg(q.cx,q.cy,x,y,j)){ bd=d; best=j; } }); if(best>=0) put={i,cx:x,cy:y,par:best,dep:P[best].dep+1,ux:(x-P[best].cx)/bd,uy:(y-P[best].cy)/bd}; } }
    P.push(put); BR.push({a:put.par,b:i,s:[P[put.par].cx,P[put.par].cy,put.cx,put.cy]}); }
  WEB_C.set(n,P); return P; }
/* 검사: 섬끼리 · 다리와 섬 · 다리끼리 겹침이 없는지 (테스트용) */
function wWebCheck(P){ const bad=[]; const minC=webMinC();
  for(let a=0;a<P.length;a++) for(let b=a+1;b<P.length;b++){ const d=Math.hypot(P[a].cx-P[b].cx,P[a].cy-P[b].cy); if(d<minC-.01) bad.push(['isl',a,b,d]); }
  const S=P.map((p,i)=>p.par<0?{a:-1,b:i,s:[p.ux*W_CR,p.uy*W_CR,p.cx,p.cy]}:{a:p.par,b:i,s:[P[p.par].cx,P[p.par].cy,p.cx,p.cy]});
  S.forEach((s0,k)=>P.forEach((q,j)=>{ if(j===s0.a||j===s0.b) return; const d=webPS(q.cx,q.cy,...s0.s); if(d<WEB.RF+1.2-.01) bad.push(['br-isl',k,j,d]); }));
  for(let x=0;x<S.length;x++) for(let y=x+1;y<S.length;y++){ const A=S[x], B=S[y]; if(A.a===B.a||A.a===B.b||A.b===B.a||A.b===B.b) continue; const d=webSS(A.s,B.s); if(d<WEB.BR-.01) bad.push(['br-br',x,y,d]); }
  return bad; }
if(/^file:|localhost/.test(location.href)) window.__web={wWeb,wWebCheck,WEB};

/* ════════ v29.5 클래시식 약탈 · 방어 (월드) ════════
   상태 머신: idle → (정찰: RaidSheet에서 상대 고르기) → enter(로딩 · 상대 섬 그대로 짓기) → fight(2분 30초 · 타워/AI 수비수 실시간 전투)
             → settle(자원 약탈 정산 · raids 문서 기록) → return(리포트 → 월드로 복귀)
   · 공격자는 별도 병력 없이 지금 장착한 무기 · 장비 · 역할 스킬 그대로 들어가요 (던전 전투 엔진 그대로)
   · 상대 섬엔 상대가 놓은 방어 시설과, 상대 아바타 · 장비로 움직이는 AI 수비수가 있어요
   · 자원 시설(본부 · 벽돌 공방 · 텃밭 · 저장고 · 가게)을 부술 때마다 상대 자원의 최대 25% 중 그 시설 몫을 바로 얻어요 */

/* ── 1) 방어 시설 (내 섬 편집 → 방어 탭) ── */
Object.assign(W_CAT,{
  cannon:{n:'기본 대포',cat:'def',lvMax:5,b:350,time:60,max:[0,1,2,2,3,3,4,4,5,5,6],up:[0,0,700,1900,4200,8500],ut:[0,0,300,1800,7200,21600],ds:'가장 기본 방어 시설. 가까이 온 침입자에게 포탄을 쏴요. (사거리 6)'},
  flame:{n:'화염탑',cat:'def',lvMax:5,b:600,time:120,max:[0,0,1,1,2,2,2,3,3,3,4],req:2,up:[0,0,1100,2800,6000,11000],ut:[0,0,600,2400,10800,28800],ds:'가까운 적을 계속 불태워요. 사거리는 짧지만 아파요. (사거리 3.5)'},
  frost:{n:'빙결탑',cat:'def',lvMax:5,b:700,time:150,max:[0,0,0,1,1,2,2,2,3,3,3],req:3,up:[0,0,1300,3200,6800,12500],ut:[0,0,900,3000,10800,28800],ds:'얼음 화살로 맞은 적을 느리게 만들어요. (사거리 5)'},
  zap:{n:'피뢰탑',cat:'def',lvMax:5,b:900,time:180,max:[0,0,0,0,1,1,2,2,2,3,3],req:4,up:[0,0,1600,3800,7600,14000],ut:[0,0,1200,3600,14400,36000],ds:'예고 후 강한 번개를 떨어뜨려요. 표시된 원에서 피하세요. (사거리 5.5)'},
  watch:{n:'감시탑',cat:'def',lvMax:5,b:450,time:90,max:[0,0,1,1,2,2,3,3,3,4,4],req:2,up:[0,0,900,2400,5200,9800],ut:[0,0,450,2000,7200,21600],ds:'멀리서 화살을 빠르게 쏴요. 사거리가 가장 길어요. (사거리 8)'},
  dwall:{n:'성벽',cat:'def',lvMax:5,b:30,time:3,max:[0,0,12,20,28,36,44,52,60,70,80],req:2,up:[0,0,80,220,520,1100],ut:[0,0,10,60,300,1200],ds:'침입자의 길을 막아요. 부수려면 시간이 걸려요.'},
  silo:{n:'자원 저장고',cat:'res',lvMax:5,b:400,time:60,max:[0,0,1,1,2,2,2,3,3,3,3],req:2,up:[0,0,800,2200,5000,9500],ut:[0,0,600,2400,10800,28800],ds:'골드와 벽돌을 모아 둬요. 약탈당하면 여기서 많이 빠져나가요 · 방어 시설로 지켜 주세요.'}
});
Object.assign(W_SZ,{silo:[2,2]});
if(!W_TABS.some(t=>t[0]==='def')) W_TABS.splice(2,0,['def','방어']);
const RD_DEF={cannon:{rng:6,cd:1.5,dmg:[0,20,27,36,46,58],pj:'ball',sp:7},flame:{rng:3.5,cd:.5,dmg:[0,8,11,15,19,24],pj:'flame'},frost:{rng:5,cd:1.6,dmg:[0,12,16,21,27,34],pj:'ice',sp:10,slow:1},zap:{rng:5.5,cd:3.4,dmg:[0,42,56,72,92,116],pj:'zap'},watch:{rng:8,cd:.75,dmg:[0,6,8,11,14,18],pj:'arrow',sp:15}};
const RD_HP={hall:900,mine:240,farm:150,silo:520,shop:280,house:220,tent:100,tower:320,hut:260,cannon:420,flame:380,frost:400,zap:360,watch:340,dwall:520};
/* 자원 몫 [벽돌, 골드] : 부술 때 상대 자원 풀(최대 25%)에서 이 비율만큼 */
const RD_LOOT={hall:[3,3],silo:[3,4],mine:[2,0],farm:[0,1.5],shop:[0,1]};
Object.assign(W_DRAWX,{
  cannon:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*5,u*2.5); const st=lv>=3?'#6A6E8A':lv>=2?'#8A8478':'#A89A86'; C(-3,-3,0,6,6,2.4,st,{t:wShade(st,.15)}); C(-2.2,-2.2,2.4,4.4,4.4,1.6,'#4A3A30'); C(-1,-.8,3.6,2,5,2,'#2A2A34',{t:'#4A4A58'}); C(-.7,4,3.9,1.4,.5,1.4,'#111'); if(lv>=2) C(-2.4,-2.4,2.3,4.8,.4,.5,'#E8B040'); },
  flame:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*4.6,u*2.3); C(-2.4,-2.4,0,4.8,4.8,8,'#B05A3A',{t:'#C86A48'}); C(-2.8,-2.8,8,5.6,5.6,1.2,'#5A3A30'); const f=1+Math.sin(tm*9+seed)*.25; C(-1.6,-1.6,9.2,3.2,3.2,2.4*f,'#FF6A1A',{t:'#FFC04A'}); C(-.8,-.8,11.4,1.6,1.6,1.4*f,'#FFE08A'); },
  frost:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*4.6,u*2.3); C(-2.4,-2.4,0,4.8,4.8,2,'#7A94AC'); C(-1.6,-1.6,2,3.2,3.2,6,'#BFE6FF',{t:'#EAF8FF',l:'#CFEFFF',r:'#9CD2F0'}); const b=Math.sin(tm*2+seed)*.4; C(-1,-1,8.6+b,2,2,3,'#E8F7FF',{t:'#FFFFFF',l:'#CFEFFF',r:'#9CD2F0'}); },
  zap:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*4.4,u*2.2); C(-2.2,-2.2,0,4.4,4.4,1.6,'#4A4E6A'); C(-.6,-.6,1.6,1.2,1.2,10,'#8A8EA8'); [3,5,7,9].forEach(z=>C(-1.6,-1.6,z,3.2,3.2,.5,'#C87A2A')); C(-1,-1,11.6,2,2,2,'#FFE45A',{t:'#FFF6B0'}); if(Math.sin(tm*13+seed)>.7){ g.strokeStyle='#FFF6B0'; g.lineWidth=1.4; g.beginPath(); g.moveTo(ox,oy-u*13); g.lineTo(ox+u*2,oy-u*10); g.lineTo(ox-u,oy-u*8); g.stroke(); } },
  watch:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*4.6,u*2.3); [[-2.4,-2.4],[1.6,-2.4],[-2.4,1.6],[1.6,1.6]].forEach(([x,y])=>C(x,y,0,.8,.8,9,'#8A5A34')); C(-2.8,-2.8,9,5.6,5.6,1,'#A87A4A'); C(-2.6,-2.6,10,5.2,.4,1.6,'#8A5A34'); C(-2.6,2.2,10,5.2,.4,1.6,'#8A5A34'); C(-3.2,-3.2,12.4,6.4,6.4,.8,'#C84A3A'); C(-2,-2,13.2,4,4,1.2,'#D85A48'); },
  dwall:(g,ox,oy,u,tm,seed,lv,C)=>{ const c=lv>=3?'#7A7E9C':lv>=2?'#A89A86':'#C9B898'; C(-4.25,-4.25,0,8.5,8.5,4.6,c,{t:wShade(c,.18),l:wShade(c,.05),r:wShade(c,-.12)}); C(-4.25,-4.25,4.6,2.6,2.6,1.2,wShade(c,.1)); C(1.65,1.65,4.6,2.6,2.6,1.2,wShade(c,.1)); },
  silo:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*2,u*9,u*4.5); C(-5,-5,0,10,10,6,'#C9965A',{t:'#D8A86A'}); C(-4.4,-4.4,6,8.8,8.8,2.4,'#E8B040',{t:'#FFD54A'}); C(-3,-3,8.4,6,6,2,'#F2C858'); C(-1.2,4.9,0,2.4,.3,3.4,'#5A3A20'); C(-4,4.9,3.6,8,.3,.8,'#8A5A34'); }
});
/* ── 2) 전투 맵 (상대 섬 그대로) ── */
Object.assign(MOB,{
  rs1:{n:'건물',hp:200,atk:0,spd:0,xp:0,b:[0,0],c:['#C9965A','#8A5A34'],sz:1.15,kind:'struct',fix:1,eq:[0,'b']},
  rs2:{n:'건물',hp:300,atk:0,spd:0,xp:0,b:[0,0],c:['#C9965A','#8A5A34'],sz:1.9,kind:'struct',fix:1,eq:[0,'b']},
  rs4:{n:'섬 본부',hp:900,atk:0,spd:0,xp:0,b:[0,0],c:['#E8B040','#8A5A34'],sz:3.3,kind:'struct',fix:1,eq:[0,'b']},
  rav:{n:'수비수',hp:300,atk:12,spd:2.05,xp:0,b:[0,0],c:['#FFD54A','#FF7A2E'],sz:1,kind:'rav',eq:[0,'b']}
});
DG.raid={n:'약탈전',e:'RAID',lv:1,R:0,raid:1,col:['#FF8A5A','#B0202A'],bg:['#3A9AC8','#1E6A9A'],tile:{g:['#86DC85','#6FCC72'],s:['#F6E4B0','#EDD69A'],m:['#9CE08F','#8DD683'],p:['#C9965A','#B07E46']},mobs:[],boss:[],deco:[],holes:'pool'};
let RAID_T=null;
function raidBuild(){ const T0=RAID_T; const T=new Map(), blk=new Set(), obs=[]; const K=(x,y)=>x+','+y; if(!T0) return {T,blk,obs,kind:'raid',D:DG.raid,H:[],gates:[],raid:1,rs:[]};
  const I=T0.I; const R=wRad(I.exp||0); const land=new Set((I.land||[]).map(e=>e.k)); const r=Math.ceil(R)+4;
  for(let x=-r;x<=r;x++) for(let y=-r;y<=r;y++){ const d=Math.hypot(x,y); if(d<=R+.35||land.has(K(x,y))) T.set(K(x,y),{x,y,t:d>R-.6&&!land.has(K(x,y))?'s':'g'}); }
  /* 선착장: 섬 아래쪽에 나무 다리 (여기로 들어와요) */
  const sy=Math.round(R)+1; for(let y=sy;y<=sy+4;y++) for(let x=-1;x<=1;x++) T.set(K(x,y),{x,y,t:'p'});
  const rs=[];
  (I.items||[]).forEach(it=>{ const C=W_CAT[it.t]; if(!C) return; const [w,h]=wSz(it); const cells=wCells(it); const cx=it.x+(w-1)/2, cy=it.y+(h-1)/2; const lv=it.lv||1;
    if(it.up&&it.up.end>Date.now()&&lv<1) return; cells.forEach(([a,b])=>blk.add(K(a,b)));
    if(C.cat==='deco'||C.cat==='gem'||C.cat==='xmas'){ obs.push({x:cx,y:cy,t:it.t,wi:1,lv,cells}); return; }
    const big=w*h>=16?'rs4':w*h>=4?'rs2':'rs1'; const hp0=(RD_HP[it.t]||180)*(it.t==='hall'?1+(lv-1)*.18:1+(lv-1)*.3); const D0=RD_DEF[it.t];
    rs.push({t:big,it,x:cx,y:cy,cells,hp:Math.round(hp0),def:D0?{...D0,lv:Math.min(5,lv),dmg:D0.dmg[Math.min(5,lv)]}:null,lw:RD_LOOT[it.t]||null,wall:it.t==='dwall'}); });
  return {T,blk,obs,kind:'raid',D:DG.raid,H:[],gates:[],raid:1,rs,spawn:[0,sy+3],R};
}
/* 시설 · 수비수 등장 */
function raidInit(s,A){ const M=s.M, T0=RAID_T; if(!T0) return; const I=T0.I; const now=performance.now();
  const B0=I.bricks==null?W_START_BRICKS:I.bricks, G0=wGoldOf(I);
  const pool={b:Math.min(RAID.CAPB,Math.floor(B0*RAID.LOOT)),g:Math.min(RAID.CAPG,Math.floor(G0*RAID.LOOT))};
  let Wb=0, Wg=0, tot=0; M.rs.forEach(o=>{ if(o.lw){ Wb+=o.lw[0]; Wg+=o.lw[1]; } if(!o.wall) tot+=o.hp; });
  M.rs.forEach((o,j)=>{ const m=A.spawn(o.t,o.x,o.y,null,null,j*25); m.mhp=m.hp=o.hp; m.atkV=0; m.def=o.wall?6:2; m.st={}; m.it=o.it; m.cells=o.cells; m.dfx=o.def; m.lw=o.lw; m.wall=o.wall; m.aggro=false; m.yaw=0; m.cd=1+Math.random();
    if(o.it.t==='mine') m.stock=Math.floor(wMineStock(o.it,Date.now())*.5); });
  /* AI 수비수: 상대 아바타 + 장착 장비 그대로 */
  let av=null; const dm=T0.dm; if(dm){ const r=rpgOf(dm); const st=cbStats(r); const hall=M.rs.find(o=>o.it.t==='hall'); const p=hall?[Math.round(hall.x),Math.round(hall.y+2.5)]:[0,0];
    let q=p; for(let k=0;k<30&&(M.blk.has(q[0]+','+q[1])||!M.T.has(q[0]+','+q[1]));k++) q=[p[0]+((k%5)-2),p[1]+Math.floor(k/5)-1];
    av=A.spawn('rav',q[0],q[1],q,null,600); av.mhp=av.hp=Math.round(st.hp*1.7); av.atkV=Math.round(st.atk*.6+6); av.def=4; av.st={}; av.dm=dm; av.dr=r; av.eqL=rpgEqLook(r); av.av=avatarOf(dm);
    const hit=st.W&&st.W.hit; av.rng=hit==='proj'||hit==='line'?5.2:0; av.el=st.wel||null; }
  s.raid={ph:'enter',to:T0.to,tn:I.name||'',nick:T0.dm?dispName(T0.dm):'',pool,Wb,Wg,tot,dn:0,loot:{b:0,g:0},pj:[],av:av?av.id:null,avDown:false,hallDown:false,kills:{},spd0:s.st.spd,t0:0,end:0,res:null}; }
/* 매 프레임 */
function raidTick(s,dt,now,A){ const R=s.raid; if(!R) return; const me=s.me;
  if(R.ph==='enter'){ if(!s.freeze){ R.ph='fight'; R.t0=now; R.end=now+RAID.T*1000; s.say&&s.say('약탈 시작! 2분 30초 · 자원 시설을 부수면 바로 약탈돼요'); wSfx('roar'); wBgm('boss'); } return; }
  if(R.ph!=='fight') return;
  /* 느려짐(빙결) */ s.st.spd=R.spd0*((me.slowT||0)>now?.55:1);
  /* 방어 시설: 사거리 안에 들어오면 쏴요 */
  for(const m of s.mobs){ const F=m.dfx; if(!F||m.born>now) continue; m.cd-=dt; if(me.dead) continue; const d=Math.hypot(me.x-m.x,me.y-m.y); if(d>F.rng||m.cd>0) continue; m.cd=F.cd;
    if(F.pj==='flame'){ A.hurtMe(F.dmg,{x:m.x,y:m.y}); for(let i=0;i<6;i++) R.pj.push({k:'fl',x:m.x,y:m.y,tx:me.x+(Math.random()-.5),ty:me.y+(Math.random()-.5),t:0,dur:.35+Math.random()*.15,z0:1.4,ar:0}); }
    else if(F.pj==='zap'){ R.pj.push({k:'zw',x:me.x,y:me.y,t:0,dur:.75,dmg:F.dmg,by:m}); }
    else R.pj.push({k:F.pj,x:m.x,y:m.y,tx:me.x,ty:me.y,t:0,dur:Math.max(.12,d/F.sp),dmg:F.dmg,slow:F.slow,by:m,z0:F.pj==='ball'?1.6:1.8,ar:F.pj==='ball'?2.4:.4}); }
  /* AI 수비수: 원거리면 거리를 두고 쏴요 */
  const av=R.av!=null?s.mobs.find(m=>m.id===R.av):null;
  if(av&&!me.dead){ const d=Math.hypot(me.x-av.x,me.y-av.y); if(av.rng){ av.flee=d<2.6; if(d<av.rng&&d>2.6){ av.aggro=false; av.ty=Math.atan2(-(me.x-av.x),me.y-av.y); av.cd2=(av.cd2||0)-dt; if(av.cd2<=0){ av.cd2=1.1; av.atk=.01; R.pj.push({k:'orb',x:av.x,y:av.y,tx:me.x,ty:me.y,t:0,dur:d/11,dmg:av.atkV,by:av,z0:1.4,ar:.3,el:av.el}); } } else av.aggro=true; } else if(d<9) av.aggro=true; }
  /* 투사체 */
  for(const p of R.pj){ p.t+=dt; if(p.t<p.dur) continue; p.done=1;
    if(p.k==='zw'){ s.fx.push({k:'slam',x:p.x,y:p.y,at:now,r:1.4}); s.shake=Math.max(s.shake||0,.5); wSfx('slam'); if(!me.dead&&Math.hypot(me.x-p.x,me.y-p.y)<1.4) A.hurtMe(p.dmg,{x:p.x,y:p.y-1}); }
    else if(p.k!=='fl'){ if(!me.dead&&Math.hypot(me.x-p.tx,me.y-p.ty)<.95){ if(p.k==='ice'){ me.slowT=now+2200; s.fx.push({k:'cbring',x:me.x,y:me.y,r:1,at:now,el:'ice'}); } A.hurtMe(p.dmg,p.by||{x:p.x,y:p.y}); } else s.fx.push({k:'spk',x:p.tx,y:p.ty,at:now,c:'#FFFFFF'}); } }
  R.pj=R.pj.filter(p=>!p.done);
  /* 끝나는 조건 */
  const leftRes=s.mobs.some(m=>m.lw&&!m.wall); const left=Math.max(0,R.end-now);
  if(me.dead) raidSettle(s,'down',A); else if(!left) raidSettle(s,'time',A); else if(!leftRes&&R.dn>0) raidSettle(s,'all',A); }
/* 시설이 무너졌을 때: 블록 풀기 · 약탈 */
function raidOnKill(s,m){ const R=s.raid; if(!R) return; const M=s.M, now=performance.now();
  if(m.cells) m.cells.forEach(([a,b])=>M.blk.delete(a+','+b));
  if(m.it){ M.obs.push({x:m.x,y:m.y,t:'rubble',rb:1,w:wSz(m.it)[0]}); if(!m.wall) R.dn+=m.mhp; R.kills[m.it.t]=(R.kills[m.it.t]||0)+1; if(m.it.t==='hall'){ R.hallDown=true; s.say&&s.say('본부 파괴! 별 하나 추가'); }
    let gb=0, gg=0; if(m.lw){ gb=R.Wb?Math.round(R.pool.b*m.lw[0]/R.Wb):0; gg=R.Wg?Math.round(R.pool.g*m.lw[1]/R.Wg):0; } if(m.stock) gb+=m.stock;
    if(gb||gg){ R.loot.b+=gb; R.loot.g+=gg; s.fx.push({k:'num',x:m.x,y:m.y,at:now,t:(gb?'+벽돌 '+gb:'')+(gb&&gg?' · ':'')+(gg?'+골드 '+gg:''),col:'#FFE08A'}); wSfx('coin'); haptic([10,20]); }
    s.fx.push({k:'poof',x:m.x,y:m.y,at:now,c:'#C9965A',big:1}); s.shake=Math.max(s.shake||0,.35); }
  if(m.dm){ R.avDown=true; const bb=Math.round(R.pool.b*.06), bg=Math.round(R.pool.g*.06); R.loot.b+=bb; R.loot.g+=bg; s.say&&s.say('수비수 '+R.nick+' 쓰러뜨림! 보너스 약탈 +6%'); } }
function raidPct(R){ return R.tot?Math.min(100,Math.round(R.dn/R.tot*100)):0; }
function raidSettle(s,why,A){ const R=s.raid; if(!R||R.ph!=='fight') return; R.ph='settle'; s.freeze=true; s.st.spd=R.spd0; const pct=raidPct(R); const stars=(pct>=50?1:0)+(R.hallDown?1:0)+(pct>=100?1:0);
  const dur=(performance.now()-R.t0)/1000; R.res={to:R.to,tn:R.tn,nick:R.nick,b:R.loot.b,g:R.loot.g,pct,stars,dur,why,kills:R.kills,av:R.avDown};
  wSfx(stars?'clear':'die'); haptic([30,40,80]); A.onEnd&&A.onEnd(R.res); }
/* ── 그리기 ── */
function raidDrawMob(g,s,m,px,py,u,tm,now){ const B=MOB[m.t];
  if(B.kind==='rav'){ const bob=m.mv?Math.abs(Math.sin(tm*9))*u*.6:0; g.save(); if(m.hit>0) g.filter='brightness(1.8)'; wDrawChar(g,px,py-bob,u*.95,m.av,m.yaw,tm,m.mv,null,false,{ph:tm*6,eq:m.eqL,swing:m.atk>0?Math.min(1,m.atk):0}); g.restore();
    g.font='900 '+Math.max(10,u*2.4)+'px "NEXON Kart Gothic",sans-serif'; g.textAlign='center'; g.lineWidth=3; g.strokeStyle='rgba(60,10,10,.8)'; const nm='수비수 · '+dispName(m.dm); g.strokeText(nm,px,py-u*20); g.fillStyle='#FFB0A0'; g.fillText(nm,px,py-u*20);
    raidBar(g,px,py-u*17,Math.max(40,u*9),m.hp/m.mhp,'#FF5A3D'); return; }
  const it=m.it; if(!it) return; g.save(); if(m.hit>0){ g.filter='brightness(1.7)'; g.translate((Math.random()-.5)*u,0); } wDrawItem(g,it.t,px,py,u,tm,(it.x*7+it.y)&255,it.lv||1); g.restore();
  if(m.dfx){ const d=Math.hypot(s.me.x-m.x,s.me.y-m.y); if(d<m.dfx.rng+2){ g.strokeStyle='rgba(255,80,60,'+(d<m.dfx.rng?.55:.2)+')'; g.setLineDash([5,5]); g.lineWidth=1.5; g.beginPath(); g.ellipse(px,py,WCF.TW/2*s.cam.z*m.dfx.rng,WCF.TH/2*s.cam.z*m.dfx.rng,0,0,Math.PI*2); g.stroke(); g.setLineDash([]); } }
  if(m.hp<m.mhp||m.lw) raidBar(g,px,py-u*(m.t==='rs4'?30:m.t==='rs2'?18:13),Math.max(34,u*(m.t==='rs4'?16:8)),m.hp/m.mhp,m.dfx?'#FF8A5A':m.lw?'#FFD54A':'#9AA6B8');
  if(m.lw&&!m.hit){ g.fillStyle='rgba(255,224,138,.95)'; g.font='900 '+Math.max(9,u*2.2)+'px sans-serif'; g.textAlign='center'; g.fillText(m.lw[0]&&m.lw[1]?'💰':m.lw[0]?'🧱':'🪙',px,py-u*(m.t==='rs4'?33:m.t==='rs2'?21:16)); } }
function raidBar(g,x,y,w,k,c){ g.fillStyle='rgba(10,10,16,.72)'; g.beginPath(); g.roundRect?g.roundRect(x-w/2-2,y-2,w+4,8,4):g.rect(x-w/2-2,y-2,w+4,8); g.fill(); g.fillStyle=c; g.beginPath(); g.roundRect?g.roundRect(x-w/2,y,w*Math.max(0,k),4,2):g.rect(x-w/2,y,w*Math.max(0,k),4); g.fill(); }
function raidDrawPost(g,s,scr,u,tm,now){ const R=s.raid; if(!R) return;
  for(const p of R.pj){ const k=Math.min(1,p.t/p.dur);
    if(p.k==='zw'){ const [px,py]=scr(p.x,p.y); g.strokeStyle='rgba(255,228,90,'+(.4+k*.6)+')'; g.fillStyle='rgba(255,228,90,'+(.08+k*.22)+')'; g.lineWidth=2; g.beginPath(); g.ellipse(px,py,WCF.TW/2*s.cam.z*1.4,WCF.TH/2*s.cam.z*1.4,0,0,Math.PI*2); g.fill(); g.stroke(); if(k>.85){ g.strokeStyle='#FFF6B0'; g.lineWidth=3; g.beginPath(); g.moveTo(px,py-u*60); g.lineTo(px+u*3,py-u*30); g.lineTo(px-u*2,py-u*14); g.lineTo(px,py); g.stroke(); } continue; }
    const x=p.x+(p.tx-p.x)*k, y=p.y+(p.ty-p.y)*k; const z=(p.z0||1.4)+Math.sin(k*Math.PI)*(p.ar||0); const [px,py]=scr(x,y); const pyz=py-z*u*6;
    if(p.k==='ball'){ g.fillStyle='#222'; g.beginPath(); g.arc(px,pyz,u*1.3,0,Math.PI*2); g.fill(); g.fillStyle='rgba(255,255,255,.5)'; g.beginPath(); g.arc(px-u*.4,pyz-u*.4,u*.4,0,Math.PI*2); g.fill(); }
    else if(p.k==='arrow'){ const [qx,qy]=scr(p.tx,p.ty); const a=Math.atan2(qy-py,qx-px); g.strokeStyle='#5A3A20'; g.lineWidth=2; g.beginPath(); g.moveTo(px-Math.cos(a)*u*3,pyz-Math.sin(a)*u*3); g.lineTo(px,pyz); g.stroke(); }
    else if(p.k==='ice'){ g.fillStyle='#CFEFFF'; g.beginPath(); g.arc(px,pyz,u*1.1,0,Math.PI*2); g.fill(); g.strokeStyle='#FFFFFF'; g.lineWidth=1; g.stroke(); }
    else if(p.k==='orb'){ const c=p.el&&GE_EL[p.el]?GE_EL[p.el].c:'#FF8AB0'; g.fillStyle=c; g.beginPath(); g.arc(px,pyz,u*1.2,0,Math.PI*2); g.fill(); }
    else if(p.k==='fl'){ g.fillStyle='rgba(255,'+Math.round(120+k*100)+',40,'+(1-k)+')'; g.beginPath(); g.arc(px,pyz,u*(1+k*1.4),0,Math.PI*2); g.fill(); } } }
function raidRubble(g,px,py,u,w){ const k=w>=4?2.6:w>=2?1.6:1; for(let i=0;i<7;i++){ const a=wHash(i,3,Math.round(px))*6.28, r=wHash(i,4,3)*3.6*k; wCube(g,px+Math.cos(a)*r*u,py+Math.sin(a)*r*u*.5,u,-1,-1,0,2,2,.8+wHash(i,5,2),i%2?'#8A7A68':'#A89A86'); } g.fillStyle='rgba(40,30,20,.25)'; g.beginPath(); g.ellipse(px,py,u*5*k,u*2.5*k,0,0,Math.PI*2); g.fill(); }
/* 화면 상단 약탈 현황 */
function RaidHud({R,now}){ if(!R) return null; const left=R.ph==='fight'?Math.max(0,R.end-now):RAID.T*1000; const sec=Math.ceil(left/1000); const pct=raidPct(R);
  return html`<div className=${'rd29-hud'+(sec<=20&&R.ph==='fight'?' low':'')}><div className="rd29-t"><${Icon} n="clock" s=${13} w=${2.6}/><b>${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}</b></div>
    <div className="rd29-p"><span><i style=${{width:pct+'%'}}></i></span><b>${pct}%</b><em>${[0,1,2].map(k=>html`<i key=${k} className=${(k===0&&pct>=50)||(k===1&&R.hallDown)||(k===2&&pct>=100)?'on':''}><${Icon} n="star" s=${12} w=${2.6}/></i>`)}</em></div>
    <div className="rd29-l"><span><${BrickIc} s=${14}/>${R.loot.b.toLocaleString()}</span><span><${GoldIc} s=${14}/>${R.loot.g.toLocaleString()}</span></div></div>`; }
/* 결과 리포트 */
function RaidReport({res,onDone,saving}){ const st=res.stars; const ttl=res.why==='down'?'쓰러졌어요':st>=3?'완벽한 약탈!':st?'약탈 성공':'약탈 실패';
  return html`<div className="rd29-rep"><div className=${'rd29-card s'+st}>
    <div className="rd29-stars">${[0,1,2].map(k=>html`<i key=${k} className=${k<st?'on':''} style=${{'--d':(k*.18+.2)+'s'}}><${Icon} n="star" s=${38} w=${2.4}/></i>`)}</div>
    <h2>${ttl}</h2><p>${res.tn||'상대 섬'} · 파괴율 <b>${res.pct}%</b> · ${Math.floor(res.dur/60)}분 ${Math.round(res.dur%60)}초</p>
    <div className="rd29-loot"><div><${BrickIc} s=${26}/><b>+${res.b.toLocaleString()}</b><small>벽돌</small></div><div><${GoldIc} s=${26}/><b>+${res.g.toLocaleString()}</b><small>골드</small></div></div>
    <div className="rd29-k">${Object.entries(res.kills||{}).map(([t,n])=>html`<span key=${t}>${(W_CAT[t]||{n:t}).n} ×${n}</span>`)}${res.av?html`<span className="av">수비수 처치</span>`:null}</div>
    <button className="tap rd29-go" disabled=${!!saving} onClick=${onDone}>${saving?'정산 중…':'내 섬으로 돌아가기'}</button></div></div>`; }
/* ── 3) 정찰 · 상대 고르기 · 방어 기록 ── */
function RaidSheet({c,isl,mine,onGo,onClose}){ const [tab,setTab]=useState('atk'); const now=Date.now(); const my=raidMineOf(c); const rpg=rpgOf(c.me);
  const myHall=mine?mine.hallLv:0; const can=my.ready&&my.wkLeft>0&&rpg.lv>=RAID.MINLV&&myHall>=RAID.HALL;
  const L=isl.filter(I=>I.uid!==c.uid).map(I=>{ const m=c.members.find(x=>x.uid===I.uid); const sh=raidShieldOf(c,I.uid); const def=(I.items||[]).filter(it=>W_CAT[it.t]&&W_CAT[it.t].cat==='def').length;
    const pb=Math.min(RAID.CAPB,Math.floor((I.bricks||0)*RAID.LOOT)), pg=Math.min(RAID.CAPG,Math.floor(wGoldOf(I)*RAID.LOOT)); return {I,m,sh,def,pb,pg,ok:!!m&&!m.banned&&!isSuperM(m)&&I.hallLv>=RAID.HALL}; }).filter(x=>x.ok).sort((a,b)=>(a.sh?1:0)-(b.sh?1:0)||(b.pb+b.pg)-(a.pb+a.pg));
  const logD=(mine&&Array.isArray(mine.rlog)?mine.rlog:[]).slice().reverse(); const logA=raidList(c).filter(r=>r.by===c.uid).sort((a,b)=>b.at-a.at).slice(0,20);
  useEffect(()=>{ if(tab==='def'&&mine&&mine.rNew) c.raidSeen&&c.raidSeen(); },[tab]);
  const why=!my.ready?'다음 약탈까지 '+raidFmt(my.cdEnd-now):!my.wkLeft?'이번 주 약탈을 모두 썼어요 (월요일에 초기화)':rpg.lv<RAID.MINLV?'Lv.'+RAID.MINLV+'부터 약탈할 수 있어요':myHall<RAID.HALL?'섬 본부 Lv.'+RAID.HALL+'부터 약탈할 수 있어요':'';
  return html`<div className="wb20-shade" onClick=${onClose}><div className="wbs rd29-sh" onClick=${e=>e.stopPropagation()}>
    <div className="wbs-h"><b>약탈 · 방어</b><span className="wbs-sub">이번 주 ${my.wkN}/${RAID.WK} · ${my.ready?'지금 공격 가능':'쿨타임 '+raidFmt(my.cdEnd-now)}</span><button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="wbs-tabs"><button className=${'tap'+(tab==='atk'?' on':'')} onClick=${()=>setTab('atk')}>공격할 섬</button><button className=${'tap'+(tab==='def'?' on':'')} onClick=${()=>setTab('def')}>방어 기록${mine&&mine.rNew?html`<em>${mine.rNew}</em>`:null}</button><button className=${'tap'+(tab==='log'?' on':'')} onClick=${()=>setTab('log')}>공격 기록</button></div>
    ${tab==='atk'?html`<div className="rd29-cap">${why?html`<b className="no">${why}</b>`:html`<b>내 무기 · 장비 · 역할 스킬 그대로 들어가요 · 2분 30초</b>`}<small>자원 시설을 부술 때마다 상대 자원의 최대 25%를 바로 약탈 · 약탈당한 섬은 12시간 보호막</small></div>
      <div className="rd29-list">${L.length?L.map(x=>html`<div key=${x.I.uid} className=${'rd29-r'+(x.sh?' sh':'')}><${PfpView} m=${x.m} s=${40}/><span className="rd29-n"><b>${x.I.name}</b><small>본부 Lv.${x.I.hallLv} · 방어 시설 ${x.def}개 · 전투력 Lv.${rpgOf(x.m).lv}</small><em><${BrickIc} s=${12}/>${x.pb.toLocaleString()} <${GoldIc} s=${12}/>${x.pg.toLocaleString()}</em></span>
        ${x.sh?html`<span className="rd29-shd"><${Icon} n="shield" s=${14} w=${2.4}/>${raidFmt(x.sh-now)}</span>`:html`<button className="tap rd29-atk" disabled=${!can} onClick=${()=>onGo(x.I)}><${Icon} n="swords" s=${15} w=${2.4}/>약탈</button>`}</div>`):html`<p className="rd29-e">공격할 수 있는 섬이 아직 없어요. (본부 Lv.${RAID.HALL} 이상인 크루 섬)</p>`}</div>`:null}
    ${tab==='def'?html`<div className="rd29-cap">${mine&&raidShieldOf(c,c.uid)?html`<b className="ok"><${Icon} n="shield" s=${14} w=${2.4}/>보호막 ${raidFmt(raidShieldOf(c,c.uid)-now)} 남음</b>`:html`<b>보호막 없음 · 방어 탭에서 시설을 늘려 보세요</b>`}</div>
      <div className="rd29-list">${logD.length?logD.map(r=>html`<div key=${r.id||r.at} className="rd29-r log"><span className=${'rd29-st s'+r.stars}>${r.stars}★</span><span className="rd29-n"><b>${r.nick||'크루'}님이 약탈했어요</b><small>${new Date(r.at).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})} · 파괴율 ${r.pct}%${r.av?' · 내 수비수 쓰러짐':''}</small><em className="neg"><${BrickIc} s=${12}/>-${(r.b||0).toLocaleString()} <${GoldIc} s=${12}/>-${(r.g||0).toLocaleString()}</em></span></div>`):html`<p className="rd29-e">아직 약탈당한 적이 없어요.</p>`}</div>`:null}
    ${tab==='log'?html`<div className="rd29-list">${logA.length?logA.map(r=>html`<div key=${r.id} className="rd29-r log"><span className=${'rd29-st s'+(r.stars||0)}>${r.stars||0}★</span><span className="rd29-n"><b>${r.tn||'크루 섬'}</b><small>${new Date(r.at).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})} · 파괴율 ${r.pct}%</small><em><${BrickIc} s=${12}/>+${((r.loot||{}).b||0).toLocaleString()} <${GoldIc} s=${12}/>+${((r.loot||{}).g||0).toLocaleString()}</em></span></div>`):html`<p className="rd29-e">아직 공격한 적이 없어요.</p>`}</div>`:null}
  </div></div>`; }
/* 정찰 → 진입 (상대 문서를 고정해서 넘겨요) */
function raidPrepare(c,I){ const raw=(c.islands||[]).find(x=>x.uid===I.uid)||I; RAID_T={to:I.uid,I:wNorm(raw),dm:c.members.find(m=>m.uid===I.uid)||null,at:Date.now()}; return RAID_T; }
if(/^file:|localhost/.test(location.href)) window.__raid={raidPrepare,raidBuild,RAID_T:()=>RAID_T};

/* ════════ v29.6 DKO 월드 UI 정리 · 파티 패널 · 건축물 고퀄리티 · 건물 뒤 반투명 ════════ */
/* ── 지도 버튼: 짧게 탭 = 전체 지도 · 꾹(0.3초) = 손 뗄 때까지 미리보기 ── */
function WMapBtn({S,ready,n,onOpen}){ const [peek,setPeek]=useState(false); const T=useRef(0); const P=useRef(false); const st=useRef(null);
  const down=e=>{ try{ e.currentTarget.setPointerCapture(e.pointerId); }catch(_){} st.current={x:e.clientX,y:e.clientY}; P.current=false; clearTimeout(T.current); T.current=setTimeout(()=>{ P.current=true; setPeek(true); haptic(12); },300); };
  const move=e=>{ const s0=st.current; if(!s0||P.current) return; if(Math.hypot(e.clientX-s0.x,e.clientY-s0.y)>12) clearTimeout(T.current); };
  const up=e=>{ clearTimeout(T.current); const was=P.current; P.current=false; st.current=null; if(was){ setPeek(false); return; } if(e.type==='pointerup') onOpen(); };
  useEffect(()=>()=>clearTimeout(T.current),[]);
  return html`<${React.Fragment}><button className="wr69-b tap mp" onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up} onContextMenu=${e=>e.preventDefault()} aria-label="지도 (꾹 누르면 미리보기)"><${Icon} n="map" s=${19} w=${2.3}/>${n>1?html`<em className="on">${n}</em>`:null}<small>지도</small></button>
    ${peek?html`<${WMapPeek} S=${S} ready=${ready}/>`:null}<//>`; }
function WMapPeek({S,ready}){ const cv=useRef(null);
  useEffect(()=>{ let dead=false, t=0; const loop=()=>{ if(dead) return; const s=S.current, el=cv.current; if(s&&el&&s.W){ const r=el.getBoundingClientRect(); if(r.width>10){ const B=wMiniBase(s); const fit=Math.min(r.width/B.w,r.height/B.h)*.94; try{ wMiniRender(el,s,{sz:[r.width,r.height],sc:fit*1.25,cx:s.me.x*.45,cy:s.me.y*.45,big:true,ready}); }catch(e){} } } t=setTimeout(loop,90); }; loop(); return ()=>{ dead=true; clearTimeout(t); }; },[]);
  return html`<div className="wpk96" aria-hidden="true"><div className="wpk96-c"><canvas ref=${cv}></canvas><b>지도 미리보기</b><small>손을 떼면 닫혀요 · 짧게 누르면 큰 지도</small></div></div>`; }

/* ── 파티 패널 ── */
const wMyParty=c=>(c.parties||[]).find(p=>!p.closed&&(p.participants||[]).some(x=>x.uid===c.uid))||null;
function WPartyPanel({c,S,isl,onClose,startDg,goIsland}){ const P=wMyParty(c); const now=Date.now();
  const open=(c.parties||[]).filter(p=>!p.closed&&p!==P&&(p.participants||[]).length<(p.maxMembers||5)).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0,8);
  const myZ=S.current&&S.current.dgk||null;
  const row=x=>{ const m=c.members.find(y=>y.uid===x.uid); const I=(c.islands||[]).find(y=>y.uid===x.uid); const h=I&&I.here&&now-I.here.at<65000?I.here:null; const cb=h&&h.cb; const R=cb&&CB_ROLE[cb.r]; const me=x.uid===c.uid;
    const st=me?'나':!h?'오프라인':h.zone?(DG[h.zone]?DG[h.zone].n:'던전'):'월드 접속 중'; const on=me||!!h; const hp=cb&&cb.hp!=null?cb.hp:null;
    return html`<div key=${x.uid} className=${'wp96-r'+(on?' on':'')}><span className="wp96-av">${m?html`<${PfpView} m=${m} s=${42}/>`:null}<i></i></span>
      <span className="wp96-t"><b>${m?dispName(m):x.nick||'크루'}${P&&P.uid===x.uid?html`<em className="host">방장</em>`:null}${(P&&(P.checked||{})[x.uid])?html`<em className="ok">합류</em>`:html`<em>대기</em>`}</b>
        <small>${R?html`<span className="wp96-role" style=${{'--rc':R.c[0]}}><${Icon} n=${R.ic} s=${11} w=${2.6}/>${R.n}</span>`:null}${st}</small>
        ${hp!=null?html`<span className="wp96-hp"><i style=${{width:Math.max(0,Math.min(100,hp))+'%',background:hp<30?'#FF5A5A':hp<60?'#FFB020':'#3DDC84'}}></i></span>`:null}</span>
      ${!me&&h?html`<button type="button" className="tap wp96-go" onClick=${()=>{ onClose(); if(h.zone) startDg(h.zone); else { S.current.jump(h.x+1,h.y+1,1.1); } }}>${h.zone?'따라가기':'옆으로'}</button>`:null}
      ${!me&&I?html`<button type="button" className="tap wp96-go alt" onClick=${()=>goIsland(x.uid)}>섬</button>`:null}</div>`; };
  return html`<div className="wb20-shade" onClick=${onClose}><div className="wbs wp96 ui-in" onClick=${e=>e.stopPropagation()}>
    <div className="wbs-h"><b>파티</b><span className="wbs-sub">${P?(P.participants||[]).length+'/'+(P.maxMembers||5)+'명 · '+(P.title||''):'지금 모집 중 '+open.length+'개'}</span><button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    ${P?html`<div className="wp96-hd"><span className="gi30" style=${{'--g1':'#FFB06A','--g2':'#E8640A'}}><${Icon} n="users" s=${18} w=${2.4}/></span><span><b>${P.title||'파티'}</b><small>${[P.game,P.mode,P.when].filter(Boolean).join(' · ')||'함께 출정하면 크루 원정 보너스'}</small></span></div>
      <div className="wp96-l">${(P.participants||[]).map(row)}</div>
      <div className="wp96-act"><button type="button" className="tap" onClick=${()=>{ onClose(); c.setWorld(false); setTimeout(()=>c.openRoom('pt:'+P.id),300); }}><${Icon} n="chat" s=${16} w=${2.4}/>파티 방</button>
        ${!(P.checked||{})[c.uid]?html`<button type="button" className="tap pri" onClick=${()=>c.checkParty(P)}><${Icon} n="check" s=${16} w=${2.6}/>합류 체크</button>`:null}
        <button type="button" className="tap warn" onClick=${()=>c.toggleParty(P)}><${Icon} n="exit" s=${16} w=${2.4}/>나가기</button></div>`
    :html`<p className="wp96-e">아직 들어간 파티가 없어요. 모집 중인 파티에 바로 참여하거나 새로 열어 보세요.</p>`}
    ${open.length?html`<div className="wo26-sec">모집 중</div><div className="wp96-l">${open.map(p=>{ const hm=c.members.find(m=>m.uid===p.uid); return html`<div key=${p.id} className="wp96-r on"><span className="wp96-av">${hm?html`<${PfpView} m=${hm} s=${38}/>`:null}</span><span className="wp96-t"><b>${p.title}</b><small>${hm?dispName(hm)+' · ':''}${(p.participants||[]).length}/${p.maxMembers||5}명</small></span><button type="button" className="tap wp96-go pri" onClick=${()=>c.toggleParty(p)}>참여</button></div>`; })}</div>`:null}
    <button type="button" className="tap wp96-new" onClick=${()=>{ onClose(); c.setWorld(false); setTimeout(()=>c.setSheet('party'),300); }}><${Icon} n="plus" s=${16} w=${2.8}/>새 파티 열기</button>
  </div></div>`; }

/* ── 건물 뒤에 있을 때 반투명 ── */
function wOccA(s,e,px,py,u,me){ if(!me) return 1; const k=e.k; if(k!=='i'&&k!=='lm'&&k!=='ob') return 1;
  const w=e.w||(k==='lm'?3:1), h=e.h||(k==='lm'?3:1); if(e.d<=me.x+me.y+.06) return 1;
  const t=e.it&&e.it.t; const tall=k==='lm'?(e.l&&e.l.k==='pass'?96:44):['ctur','ctur2'].includes(t)?36:['cwx','cwy','cgx','cgy','bnr'].includes(t)?16:t==='hall'?30:W_BIG&&W_BIG.has&&W_BIG.has(t)?20:['tree','pine','sakura','xtree','lighthouse','windmill','balloon','tower','watch','zap','flame','frost','lamp','lamp2','topi','xm_light'].includes(t)?16:k==='ob'?10:8;
  if(tall<=8&&w*h<2) return 1; const HW=WCF.TW/2*s.cam.z; const half=(w+h)/2*HW*.92;
  const [mx,my]=me.scr; if(Math.abs(mx-px)>half) return 1; if(my>py+HW*.5||my<py-u*tall) return 1; return .38; }
function wOccSmooth(s,key,a){ const M=s.occ||(s.occ=new Map()); const p=M.has(key)?M.get(key):1; const v=p+(a-p)*.22; M.set(key,v); return v; }

/* 레벨 장식: Lv.4 금테 깃발 · Lv.6 빛나는 결정 (높은 레벨일수록 화려하게) */
function wLvDeco(g,ox,oy,u,tm,lv,C,h,seed){ if(lv>=4){ const wv=Math.sin(tm*4+(seed||0))*.25; C(-.2,-.2,h,.4,.4,4,'#E6ECF4'); C(.2,-.2,h+2+wv,.2,2.6,1.6,lv>=6?'#B57CFF':'#FFD54A',{l:lv>=6?'#C99BFF':'#FFE08A',r:lv>=6?'#8A4FE0':'#E8B040',t:'#FFF2B0'}); }
  if(lv>=6){ const gl=.55+.45*Math.sin(tm*3+(seed||0)); g.save(); g.shadowColor='#B57CFF'; g.shadowBlur=u*3; C(-.7,-.7,h+4.4+Math.sin(tm*2)*.4,1.4,1.4,1.8,'#C99BFF',{t:'rgba(240,225,255,'+gl+')',l:'#D8B8FF',r:'#8A4FE0'}); g.restore(); } }
/* ── 건축물 다시 그리기 (더 촘촘한 디테일 · 그림자 · 창문 불빛) ── */
const wWin=(C,x,y,z,w,h,on,face)=>{ const lit=on?'#FFE6A0':'#8ED6FF'; if(face==='l') C(x,y,z,w,.25,h,lit,{l:on?'#FFF2C8':'#BDEBFF',r:lit,t:lit}); else C(x,y,z,.25,w,h,lit,{l:lit,r:on?'#FFD27A':'#6CB8E6',t:lit}); };
Object.assign(W_DRAWX,{
  hall:(g,ox,oy,u,tm,seed,lv,C)=>{ const k=lv; const roof=W_LV_ROOF[Math.min(10,lv)]||W_LV_ROOF[1]; const nt=wNightK()>.4; wShadow(g,ox,oy+u*2.6,u*13,u*6.4,.26);
    /* 돌 기단 · 계단 */ C(-6.6,-6.6,0,13.2,13.2,1.1,'#8E97A3',{t:'#AEB6C2'}); C(-6,-6,1.1,12,12,.5,'#C9CED8'); C(-1.8,6,0,3.6,1.4,.6,'#AEB6C2'); C(-1.4,6,.6,2.8,.8,.5,'#C9CED8');
    /* 벽 + 기둥 */ const H=5+k*.9; C(-5.4,-5.4,1.6,10.8,10.8,H,'#F4E9D6',{t:'#FBF4E8',l:'#F4E9D6',r:'#E2D3B8'});
    [-5.6,-.25,5.1].forEach(y=>C(5.15,y,1.6,.5,.5,H,'#D9C9AA')); [-5.6,-.25,5.1].forEach(x=>C(x,5.15,1.6,.5,.5,H,'#D9C9AA'));
    C(-5.5,-5.5,1.6+H*.45,11,11,.35,'#C8B494');
    /* 창문 (밤엔 켜져요) · 문 · 현관 등 */ [-3.8,1.6].forEach(y=>wWin(C,5.42,y,3.2,1.8,1.9+k*.15,nt,'r')); [-3.8,2.2].forEach(x=>{ if(x>1) wWin(C,x,5.42,3.2,1.8,1.9+k*.15,nt,'l'); });
    C(-1.4,5.42,1.6,2.8,.3,3.8,'#6A4024',{l:'#7A4E2C'}); C(-1.6,5.5,5.4,3.2,.4,.4,'#8A5A34'); C(-.15,5.6,3.2,.3,.2,.3,'#FFD54A');
    if(nt){ g.save(); g.globalCompositeOperation='lighter'; const rg=g.createRadialGradient(ox,oy-u*4,0,ox,oy-u*4,u*9); rg.addColorStop(0,'rgba(255,200,120,.32)'); rg.addColorStop(1,'rgba(255,200,120,0)'); g.fillStyle=rg; g.fillRect(ox-u*9,oy-u*13,u*18,u*18); g.restore(); }
    /* 지붕: 처마 · 기와 줄 · 용마루 */ const rz=1.6+H; C(-6.6,-6.6,rz,13.2,13.2,1,wShade(roof,-.18)); C(-5.8,-5.8,rz+1,11.6,11.6,1.3,roof); C(-4.4,-4.4,rz+2.3,8.8,8.8,1.3,wShade(roof,.08)); C(-3,-3,rz+3.6,6,6,1.3,wShade(roof,.16)); C(-1.6,-1.6,rz+4.9,3.2,3.2,1,wShade(roof,.24));
    for(let i=0;i<5;i++) C(-5.8+i*2.6,5.6,rz+1.15,.3,.3,1.1,wShade(roof,-.25));
    if(k>=3){ [[-7.2,-7.2],[4.6,-7.2],[-7.2,4.6],[4.6,4.6]].forEach(([x,y])=>{ C(x,y,0,2.6,2.6,rz+2.4,'#E8DCC4',{t:'#F4ECDC'}); C(x-.3,y-.3,rz+2.4,3.2,3.2,1,roof); C(x+.2,y+.2,rz+3.4,2.2,2.2,1.4,wShade(roof,.12)); if(nt) C(x+1.05,y+2.62,rz-1,.5,.1,.9,'#FFE6A0'); }); }
    if(k>=4){ C(-1.7,-1.7,rz+5.9,3.4,3.4,2.4,'#F2B33D',{t:'#FFE08A',l:'#F5C24F',r:'#C98A1A'}); C(-1,-1,rz+8.3,2,2,.8,'#FFE08A'); }
    const top=rz+(k>=4?9.1:5.9); C(-.25,-.25,top,.5,.5,5,'#E6ECF4'); const wv=Math.sin(tm*4+seed)*.25; C(.25,-.25,top+2.6+wv,.2,4,2.4,'#FF5A1A',{l:'#FF7A2E',r:'#E04A0A',t:'#FF8F4D'}); C(.25,1.2,top+3.2+wv,.22,1.4,1,'#FFFFFF');
    if(k>=5){ const gl=.6+.4*Math.sin(tm*3); g.save(); g.shadowColor='#5AE0FF'; g.shadowBlur=u*4; C(-.9,-.9,top+5.4+Math.sin(tm*2)*.5,1.8,1.8,2.6,'#5AE0FF',{t:'rgba(220,250,255,'+gl+')',l:'#7FE8FF',r:'#3BB8D8'}); g.restore(); }
    /* 화단 */ [[-5.9,6.3],[3.2,6.3]].forEach(([x,y])=>{ C(x,y,0,2.6,.9,.7,'#8A5A34'); for(let i=0;i<3;i++) C(x+.3+i*.8,y+.1,.7,.6,.6,.6,['#FF6B8A','#FFD166','#B98CFF'][(i+seed)%3]); }); },
  mine:(g,ox,oy,u,tm,seed,lv,C)=>{ const k=lv; wShadow(g,ox,oy+u*1.9,u*9.4,u*4.6,.24); const nt=wNightK()>.4;
    C(-4.7,-4.2,0,9.4,8.4,.6,'#7A6A58'); C(-4.5,-4,.6,9,8,3.8+k*.4,'#B5523A',{t:'#C8634A',r:'#9A4430'}); for(let i=0;i<4;i++) for(let j=0;j<3;j++) C(-4.55+(j%2)*1.4+i*2.3,4.02,1+j*1.2,1.9,.06,.9,'#C8634A');
    C(-4.6,-4.1,4.4+k*.4,9.2,8.2,.5,'#7A3424'); C(-3.8,-3.4,4.9+k*.4,7.6,6.8,.9,'#8E3A26');
    /* 가마 굴뚝 · 불빛 */ const ch=4.9+k*.4; C(1.2,-2.6,ch,2.2,2.2,3+k*1.2,'#9A4A34',{t:'#5A2418'}); C(1,-2.8,ch+3+k*1.2,2.6,2.6,.5,'#7A3424');
    C(-2.8,4.05,.6,3.6,.3,2.8,'#2A1E1A'); g.save(); g.globalAlpha=.65+.3*Math.sin(tm*5+seed); C(-2.4,4.1,.8,2.8,.2,1.6,'#FF8A3D',{l:'#FFB060'}); g.restore();
    for(let i=0;i<3;i++){ const ph=(tm*.6+i/3)%1; g.fillStyle='rgba(220,224,232,'+((1-ph)*.6)+')'; const p=[ox+(2.3)*u*.5+ph*u*2.5,oy-(ch+3+k*1.2+ph*6)*u]; g.beginPath(); g.arc(p[0],p[1],u*(.8+ph*1.4),0,Math.PI*2); g.fill(); }
    /* 벽돌 더미 · 손수레 */ [[-4.4,4.6,0],[-2.6,4.8,0],[-3.5,4.7,1]].forEach(([x,y,z])=>C(x,y,z,1.6,1.2,1,z?'#E07A58':'#D96A4A')); if(k>=2){ C(3.6,3.4,.4,2.4,1.4,1,'#8A5A34'); C(3.8,3.6,1.4,2,1,.5,'#D96A4A'); C(3.4,3.6,0,.5,.5,.5,'#3A2A20'); }
    if(k>=3) C(4.6,-1,0,2,3,1.6,'#6A4024'); if(nt) C(-4.52,-2,2.4,.06,1.4,1.2,'#FFE6A0'); wLvDeco(g,ox,oy,u,tm,lv,C,ch+3+k*1.2+.5,seed); },
  hut:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*1.7,u*7.4,u*3.7,.22); const nt=wNightK()>.4;
    C(-3.7,-3.2,0,7.4,6.4,.5,'#7A6A58'); C(-3.5,-3,.5,7,6,4.6,'#C9965A',{t:'#D8A86A',r:'#A87344'}); for(let i=0;i<4;i++) C(-3.52,-3+i*1.6,.5,.06,.3,4.6,'#A87344');
    C(-4.1,-3.6,5.1,8.2,7.2,.9,'#7A4E2C'); C(-3.3,-2.8,6,6.6,5.6,1,'#8A5A34'); C(-2.2,-1.8,7,4.4,3.6,1,'#A87344');
    C(-1.6,3.02,.5,2.2,.3,3,'#5A3A20',{l:'#6A4024'}); wWin(C,3.52,-1.6,2.4,1.5,1.4,nt,'r');
    C(-.8,-.8,8,1.6,1.6,1,'#FFC233',{t:'#FFE08A',l:'#FFC233',r:'#D99A10'}); C(2.6,-2.6,.5,.4,.4,4,'#7A4E2C'); C(2.2,-2.8,3.5,1.4,.4,1.6,'#9AA3AE');
    /* 연장 · 통나무 */ C(-3.2,3.4,0,2.6,.8,.8,'#8A5A34',{t:'#C9965A'}); C(-3,3.4,.8,2.2,.7,.7,'#7A4E2C',{t:'#B07A4A'}); C(2.4,3.3,0,.3,.3,2.6,'#5A3A20'); C(2.1,3.2,2.4,.9,.5,.5,'#9AA3AE'); },
  shop:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*2,u*9.4,u*4.7,.22); const roof=W_LV_ROOF[Math.min(10,lv)]||W_LV_ROOF[1]; const nt=wNightK()>.4;
    C(-4.3,-4.3,0,8.6,8.6,.5,'#AEB6C2'); C(-4,-4,.5,8,8,5.6,'#FFF4E6',{t:'#FFFAF2',r:'#EADBC6'});
    /* 진열창 · 간판 */ C(4.02,-3,.9,.25,3.6,3,nt?'#FFE6A0':'#BDEBFF',{l:'#DDF4FF',r:nt?'#FFD27A':'#8FCDEE',t:'#BDEBFF'}); C(4.05,-2.6,1.4,.2,.6,.6,'#FF8FB8'); C(4.05,-1.6,1.4,.2,.6,.6,'#FFD166');
    C(4,1.2,.5,.3,2.4,3.4,'#5A3A20',{r:'#6A4024'}); C(-1.6,4.02,1.8,3.2,.25,2.6,nt?'#FFE6A0':'#BDEBFF',{l:'#DDF4FF',t:'#BDEBFF'});
    C(-4.6,-4.6,6.1,9.2,9.2,.9,lv>=2?roof:'#2F7FE0'); if(lv>=3){ C(-3,-3,7,6,6,2.4,'#FFF4E6'); C(-3.4,-3.4,9.4,6.8,6.8,.8,roof); }
    for(let i=0;i<5;i++) C(4.1,-4+i*1.6,4.2,1.8,1.6,.5,i%2?'#FFFFFF':'#FF5A1A',{t:i%2?'#FFFFFF':'#FF7A3D'}); for(let i=0;i<5;i++) C(-4+i*1.6,4.1,4.2,1.6,1.8,.5,i%2?'#FFFFFF':'#FF5A1A',{t:i%2?'#FFFFFF':'#FF7A3D'});
    C(-1.8,-.4,7.0+(lv>=3?3.2:0),3.6,.4,1.6,'#FFD54A',{l:'#FFE08A'}); C(5,-3.5,0,1.4,1.4,1.2,'#C9965A'); C(5.1,-3.4,1.2,1.2,1.2,.4,'#FF8A3D'); wLvDeco(g,ox,oy,u,tm,lv,C,lv>=3?10.2:7,seed); },
  house:(g,ox,oy,u,tm,seed,lv,C)=>{ const k=1+(lv-1)*.08; const roof=W_LV_ROOF[Math.min(10,lv)]||W_LV_ROOF[1]; const nt=wNightK()>.4; wShadow(g,ox,oy+u*2,u*10*k,u*5*k,.22);
    C(-5.2,-4.2,0,10.4,8.4,.5,'#AEB6C2'); C(-5,-4,.5,10,8,6.6,'#F2E3C6',{t:'#FAF0DC',r:'#E2D0AE'}); for(let i=0;i<3;i++) C(-5.02,-4+i*2.8,.5,.06,.25,6.6,'#D9C29A');
    if(lv>=2){ C(-4.4,-3.4,7.1,8.8,6.8,4,'#EADBBE',{r:'#D8C6A2'}); wWin(C,-2,3.42,8.3,2.2,1.8,nt,'l'); }
    const rz=lv>=2?11.1:7.1; C(-6,-5,rz,12,10,1.2,wShade(roof,-.12)); C(-5,-4,rz+1.2,10,8,1.2,roof); C(-4,-3,rz+2.4,8,6,1.2,wShade(roof,.1)); C(-2.5,-1.5,rz+3.6,5,3,1.2,wShade(roof,.2));
    C(5.02,-1.1,.5,.3,2.2,3.8,'#6A4024',{r:'#7A4E2C'}); C(5.1,-1.3,4.3,.6,2.6,.3,'#8A5A34'); wWin(C,-2,4.02,2.6,2.4,2.2,nt,'l'); wWin(C,5.02,-3.4,2.6,1.6,2,nt,'r');
    C(-2.2,4.3,2.4,2.8,.6,.3,'#7A4E2C'); for(let i=0;i<3;i++) C(-2+i*.9,4.35,2.7,.6,.5,.5,['#FF6B8A','#FFD166','#7CC8FF'][(i+seed)%3]);
    if(lv>=3){ C(2,-3,rz+2.4,1.4,1.4,4,'#9AA3AE',{t:'#5A606C'}); const ph=(tm*.7)%1; g.fillStyle='rgba(230,236,244,'+(1-ph)*.7+')'; const p=[ox+(2.7+1.7)*u,oy-(rz+6.4+ph*5)*u]; g.beginPath(); g.arc(p[0]-u*2+ph*u*3,p[1]+u*2,u*(1+ph*1.6),0,Math.PI*2); g.fill(); } wLvDeco(g,ox,oy,u,tm,lv,C,rz+4.8,seed); },
  tower:(g,ox,oy,u,tm,seed,lv,C)=>{ const hh=10+Math.min(lv,5)*2; const roof=W_LV_ROOF[Math.min(10,lv)]||W_LV_ROOF[1]; wShadow(g,ox,oy+u*1.6,u*6.4,u*3.2,.24);
    C(-3,-3,0,6,6,.8,'#8E97A3'); C(-2.6,-2.6,.8,5.2,5.2,hh,'#B89A7A',{t:'#C9AA88',r:'#9A7E62'}); for(let z=2;z<hh;z+=2.6) C(-2.62,-2.62,z,5.24,5.24,.3,'#9A7E62'); wWin(C,2.62,-.6,hh*.55,1.2,1.6,wNightK()>.4,'r');
    C(-3.6,-3.6,hh+.8,7.2,7.2,1.4,'#8A5A34'); for(let i=0;i<4;i++){ C(-3.6+i*2.1,3.1,hh+2.2,1.2,.5,1,'#8A5A34'); C(3.1,-3.6+i*2.1,hh+2.2,.5,1.2,1,'#8A5A34'); }
    C(-3,-3,hh+2.2,6,6,2.2,roof); C(-1.8,-1.8,hh+4.4,3.6,3.6,1.8,wShade(roof,.15)); C(-.8,-.8,hh+6.2,1.6,1.6,1.2,wShade(roof,.25)); wLvDeco(g,ox,oy,u,tm,Math.max(4,lv),C,hh+7.4,seed); }
});
if(/^file:|localhost/.test(location.href)) window.__w296={wOccA};
Object.assign(ICONS,{sort:'M4 6h11 M4 12h7 M4 18h4 M17 8v12 M14 17l3 3 3-3'});
/* 방어 시설도 Lv.4~5 장식 */
['cannon','flame','frost','zap','watch'].forEach(t=>{ const f0=W_DRAWX[t]; if(!f0||f0.__lv) return; const f=(g,ox,oy,u,tm,seed,lv,C)=>{ f0(g,ox,oy,u,tm,seed,Math.min(3,lv),C); if(lv>=4) wLvDeco(g,ox,oy,u,tm,lv+1,C,t==='cannon'?5.6:t==='zap'?13.6:t==='watch'?14.4:12.4,seed); }; f.__lv=1; W_DRAWX[t]=f; });
/* 건물 업그레이드 완료 축하 */
function WLvUp({o,onDone}){ useEffect(()=>{ const t=setTimeout(onDone,2600); return ()=>clearTimeout(t); },[o.k]); const C=W_CAT[o.t]||{};
  return html`<div className="wlu96" onClick=${onDone}><div className="wlu96-c"><i className="wlu96-ray"></i><div className="wlu96-art"><${WItemIcon} t=${o.t} lv=${o.lv} big=${true}/></div><em>업그레이드 완료</em><b>${wName(o.t)}</b><span className="wlu96-lv">Lv.${o.lv-1} → <strong>Lv.${o.lv}</strong></span>${C.lvMax&&o.lv>=C.lvMax?html`<small>최고 레벨 달성!</small>`:null}
    <div className="wlu96-cf">${Array.from({length:16}).map((_,i)=>html`<s key=${i} style=${{'--a':(i*22.5)+'deg','--d':(i%4)*.05+'s','--c':['#FFD54A','#7CF0B5','#9CE4FF','#FF8FB8'][i%4]}}></s>`)}</div></div></div>`; }

/* ═════════ v29.7 소셜 아일랜드 · 디즈니풍 성 마을 ═════════
   · DKO 캐슬(본성 · 성벽 · 망루 · 해자) · 메인 스트리트 상점가 · 왕관 분수 광장 · 통일된 포털 아치
   · 모든 그림은 복셀 큐브(C)로만 그려요. 명소(lm_*)는 1.42배 스케일: 한 칸 ≈ 6, 장식은 한 칸 ≈ 8.5 */
const CS={WALL:'#F8F4EC',WALL2:'#FFFDF8',STONE:'#CFC8BA',STONE2:'#E2DCCF',GOLD:'#F2C230',ROOF:'#3F6FE0',ROOF2:'#5B8BF5',PINK:'#FF8FB8',WIN:'#2C3E78',GLASS:'#9FDBFF'};
const csGold={t:'#FFE08A',l:'#F5C24F',r:'#C98A1A'};
const csWin=c=>({l:c||'#3A5196',r:wShade(c||'#3A5196',-.2),t:c||'#3A5196'});
const csGlass={l:'#CFF0FF',r:'#8FCDEE',t:'#BDEBFF'};
/* 원뿔 지붕: 작아지는 큐브를 쌓아요 */
function csCone(C,cx,cy,z,r,h,col,n){ n=n||7; const hs=h/n; for(let i=0;i<n;i++){ const s=Math.max(.18,r*(1-i/n)); const c=wShade(col,i*.025); C(cx-s,cy-s,z+i*hs,s*2,s*2,hs+.02,c,{t:wShade(c,.18),l:c,r:wShade(c,-.22)}); }
  C(cx-.18,cy-.18,z+h,.36,.36,1.6,CS.GOLD,csGold); C(cx-.4,cy-.4,z+h+1.6,.8,.8,.8,CS.GOLD,csGold); }
/* 펄럭이는 삼각 깃발 */
function csFlag(C,cx,cy,z,tm,col,len){ len=len||3.6; C(cx-.1,cy-.1,z,.2,.2,4.4,'#E6ECF4'); const wv=Math.sin(tm*4+cx)*.25; for(let i=0;i<4;i++){ const w=len*(1-i*.22); C(cx+.1,cy-.05,z+2.4+i*.45+wv*(i/3),.15,w,.5,col,{l:col,r:wShade(col,-.2),t:wShade(col,.15)}); } }
/* 망루(원통처럼 보이는 탑) */
function csTower(C,cx,cy,z,r,h,tm,o){ o=o||{}; const w=r*2; C(cx-r-.3,cy-r-.3,z,w+.6,w+.6,1.2,CS.STONE);
  C(cx-r,cy-r,z+1.2,w,w,h,CS.WALL,{t:CS.WALL2,l:'#EFE9DD',r:'#D9D2C4'});
  for(let k=0;k<(o.win||2);k++){ const zz=z+3+k*(h-4)/Math.max(1,(o.win||2)); C(cx-.45,cy+r,zz,.9,.2,2.2,CS.WIN,csWin()); C(cx+r,cy-.45,zz,.2,.9,2.2,CS.WIN,csWin()); }
  C(cx-r-.25,cy-r-.25,z+1.2+h,w+.5,w+.5,.7,CS.GOLD,csGold);
  if(o.cren){ const m=Math.max(2,Math.round(w/1.4)); for(let i=0;i<m;i++){ const t=i/(m-1); C(cx-r+t*(w-.8),cy+r-.8,z+1.9+h,.8,.8,1,CS.WALL2); C(cx+r-.8,cy-r+t*(w-.8),z+1.9+h,.8,.8,1,CS.WALL2); } }
  const top=z+1.9+h; csCone(C,cx,cy,top,r+.7,o.rh||r*3.4,o.roof||CS.ROOF,o.n||7);
  if(o.flag) csFlag(C,cx,cy,top+(o.rh||r*3.4)+2.4,tm,o.flag);
  return top; }
/* 불꽃놀이 · 반짝임 (그 자리 화면 좌표) */
function csFireworks(g,u,tm,x0,y0,seed){ const P=[['#FFD54A','#FF8FB8'],['#7CC8FF','#FFFFFF'],['#C29BFF','#FFD54A'],['#7CF0B5','#FFFFFF']]; g.save(); g.globalCompositeOperation='lighter';
  for(let b=0;b<3;b++){ const per=9+b*1.7; const t=((tm+b*3.1+seed)%per)/per*per; if(t>2.4) continue; const cx=x0+(b-1)*u*14+Math.sin(b*7.3+Math.floor((tm+b*3.1)/per))*u*5, cy=y0-u*(8+b*5);
    const pal=P[(Math.floor((tm+b*3.1)/per)+b)%P.length];
    if(t<.5){ const k=t/.5; g.fillStyle='rgba(255,240,200,'+(1-k*.3)+')'; g.fillRect(cx-u*.3,cy+u*20*(1-k)-u*.3,u*.6,u*1.6); continue; }
    const k=(t-.5)/1.9; const R=u*(3+k*9); const n=16;
    for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+b; const px=cx+Math.cos(a)*R, py=cy+Math.sin(a)*R*.85+k*k*u*4; g.fillStyle=wHexA(pal[i%2],(1-k)*.95); g.fillRect(px-u*.4,py-u*.4,u*.8,u*.8); g.fillStyle=wHexA(pal[i%2],(1-k)*.35); g.fillRect(px-Math.cos(a)*u*1.4-u*.25,py-Math.sin(a)*u*1.2-u*.25,u*.5,u*.5); } }
  g.restore(); }
function csSparkle(g,u,tm,x0,y0,r,col,n){ g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<(n||8);i++){ const k=(tm*.35+i/(n||8))%1; const a=i*2.4+tm*.6; const x=x0+Math.cos(a)*r*u, y=y0-k*u*10+Math.sin(a)*r*u*.4; const s=u*(.35+.35*Math.sin(tm*6+i));
  g.fillStyle=wHexA(col||'#FFF2B0',Math.sin(k*Math.PI)*.9); g.fillRect(x-s,y-s*.25,s*2,s*.5); g.fillRect(x-s*.25,y-s,s*.5,s*2); } g.restore(); }

/* ── 본성(DKO 캐슬): 2단 성채 · 네 모서리 탑 · 중앙 첨탑 · 금빛 왕관 · 저녁 불꽃놀이 ── */
function csKeep(g,ox,oy,u,tm,seed,lv,C){ wShadow(g,ox,oy+u*4,u*24,u*11,.28);
  C(-10.5,-10.5,0,21,21,2,CS.STONE); C(-9.9,-9.9,2,19.8,19.8,.6,CS.STONE2);
  csTower(C,-7.6,-7.6,2.6,2.2,19,tm,{rh:9,flag:CS.PINK,cren:1});
  C(-8,-8,2.6,16,16,12.4,CS.WALL,{t:CS.WALL2,l:'#F1ECE2',r:'#DCD5C8'});
  for(let i=0;i<4;i++){ if(i===1||i===2) continue; C(-6.4+i*3.7,8,5.2,1.8,.25,3.6,CS.WIN,csWin()); C(-6.2+i*3.7,8,8.8,1.4,.25,.6,CS.WIN,csWin()); }
  for(let i=0;i<4;i++){ C(8,-6.4+i*3.7,5.2,.25,1.8,3.6,CS.WIN,csWin()); C(8,-6.2+i*3.7,8.8,.25,1.4,.6,CS.WIN,csWin()); }
  /* 큰 문 + 금테 · 장미창 */
  C(-2.6,8,2.6,5.2,.3,7.4,CS.GOLD,csGold); C(-2,8.05,2.6,4,.3,6.4,'#3A2A6A',{l:'#4A3A86',r:'#2A1E50',t:'#4A3A86'}); C(-1.4,8.05,9,2.8,.3,.8,'#3A2A6A',{l:'#4A3A86'}); C(-.15,8.1,2.6,.3,.3,6.4,CS.GOLD,csGold);
  C(8,-2,8,.3,4,4,CS.GOLD,csGold); C(8.05,-1.5,8.5,.3,3,3,CS.PINK,{l:CS.PINK,r:'#E8609A',t:CS.PINK}); C(8.1,-.3,8.5,.3,.6,3,'#FFFFFF',{r:'#FFF2F8'});
  C(-8.3,-8.3,15,16.6,16.6,.8,CS.GOLD,csGold);
  for(let i=0;i<7;i++){ C(-7.8+i*2.5,7,15.8,1.3,1,1.4,CS.WALL2); C(7,-7.8+i*2.5,15.8,1,1.3,1.4,CS.WALL2); }
  csTower(C,7.6,-7.6,2.6,2.2,17,tm,{rh:8.5,flag:CS.ROOF2,cren:1}); csTower(C,-7.6,7.6,2.6,2.2,17,tm,{rh:8.5,flag:CS.ROOF2,cren:1});
  /* 2층 성채 */
  C(-5.6,-5.6,15.8,11.2,11.2,9.6,CS.WALL2,{t:'#FFFFFF',l:'#F5F0E6',r:'#E0D9CC'});
  for(let i=0;i<3;i++){ C(-3.6+i*3,5.6,18.6,1.4,.25,3.4,CS.WIN,csWin()); C(5.6,-3.6+i*3,18.6,.25,1.4,3.4,CS.WIN,csWin()); }
  C(-5.9,-5.9,25.4,11.8,11.8,.7,CS.GOLD,csGold);
  [[-5,-5],[5,-5],[-5,5]].forEach(([x,y])=>csTower(C,x,y,25.4,1.3,6,tm,{rh:7,win:1,n:6}));
  /* 중앙 첨탑 */
  C(-3,-3,26.1,6,6,11,CS.WALL,{t:CS.WALL2,l:'#F3EEE4',r:'#DCD5C8'}); C(-1,3,28.6,2,.25,4.4,CS.WIN,csWin()); C(3,-1,28.6,.25,2,4.4,CS.WIN,csWin());
  C(-3.6,-3.6,37.1,7.2,7.2,.8,CS.GOLD,csGold); [[-3.4,2.6],[-1,2.6],[1.4,2.6],[2.6,-3.4],[2.6,-1],[2.6,1.4]].forEach(([x,y])=>C(x,y,37.9,.8,.8,1,CS.WALL2));
  csCone(C,0,0,38.9,4,17,CS.ROOF,9);
  /* 왕관 장식 · 깃발 */
  [[-1.6,-1.6],[1.1,-1.6],[-1.6,1.1],[1.1,1.1]].forEach(([x,y])=>C(x,y,39.4,.5,.5,1.4,CS.GOLD,csGold)); csFlag(C,0,0,58.5,tm,CS.PINK,4.6);
  csTower(C,7.6,7.6,2.6,2.6,21,tm,{rh:11,flag:CS.GOLD,cren:1,win:3});
  /* 반짝임 + 불꽃놀이 */
  const P=(a,b,c)=>[(a-b)*u,(a+b)*u*.5-c*u]; const [sx,sy]=P(0,0,48); csSparkle(g,u,tm,ox+sx,oy+sy,6,'#FFF2B0',10);
  const [fx,fy]=P(0,0,72); csFireworks(g,u,tm,ox+fx,oy+fy,seed); }

/* ── 성벽 · 성문 · 모서리 망루 (장식: 한 칸 ≈ 8.5) ── */
function csWall(C,sw,seed,gate,tm){ const S=sw?(x,y,z,w,d,h,c,o)=>C(y,x,z,d,w,h,c,o):C;
  const face=sw?{l:'#DCD5C8',r:'#F1ECE2'}:{l:'#F1ECE2',r:'#DCD5C8'};
  if(!gate){ S(-4.25,-1.9,0,8.5,3.8,2,CS.STONE); S(-4.25,-1.5,2,8.5,3,9,CS.WALL,{t:CS.WALL2,...face});
    for(let i=0;i<4;i++) S(-4.1+i*2.2,-1.5,11,1.3,3,1.6,CS.WALL2,{t:'#FFFFFF',...face});
    S(-4.25,1.5,7.6,8.5,.12,.4,CS.GOLD,csGold);
    if(seed%2===0){ const c=seed%4===0?CS.ROOF:CS.PINK; S(-1.1,1.55,3.6,2.2,.15,5,c,{l:c,r:wShade(c,-.2),t:c}); S(-1.1,1.6,8.2,2.2,.15,.5,CS.GOLD,csGold); S(-.4,1.65,5.4,.8,.12,.8,CS.GOLD,csGold); }
    else { S(-.5,1.5,5,1,.15,2.2,CS.WIN,csWin()); }
    return; }
  S(-4.25,-1.9,0,2.4,3.8,2,CS.STONE); S(1.85,-1.9,0,2.4,3.8,2,CS.STONE);
  S(-4.25,-1.6,2,2.2,3.2,11,CS.WALL,{t:CS.WALL2,...face}); S(2.05,-1.6,2,2.2,3.2,11,CS.WALL,{t:CS.WALL2,...face});
  S(-4.25,-1.6,10,8.5,3.2,3.2,CS.WALL2,{t:'#FFFFFF',...face}); S(-2.05,1.6,9.6,4.1,.15,.5,CS.GOLD,csGold);
  for(let i=0;i<5;i++) S(-1.7+i*.8,-.2,8.6+(i%2)*.4,.22,.22,1.2,'#5A5E6E');
  S(-1,1.62,10.6,2,.12,2,CS.ROOF,{l:CS.ROOF,r:wShade(CS.ROOF,-.2),t:CS.ROOF}); S(-.5,1.66,11,1,.12,1,CS.GOLD,csGold);
  for(let i=0;i<4;i++) S(-4.1+i*2.2,-1.6,13.2,1.3,3.2,1.4,CS.WALL2,{t:'#FFFFFF',...face});
  csCone((x,y,z,w,d,h,c,o)=>S(x,y,z,w,d,h,c,o),-3.15,0,14.6,1.6,6,CS.ROOF,5); csCone((x,y,z,w,d,h,c,o)=>S(x,y,z,w,d,h,c,o),3.15,0,14.6,1.6,6,CS.ROOF,5); }
Object.assign(W_DRAWX,{
  lm_pass:csKeep,
  cwx:(g,ox,oy,u,tm,seed,lv,C)=>csWall(C,false,seed,false,tm),
  cwy:(g,ox,oy,u,tm,seed,lv,C)=>csWall(C,true,seed,false,tm),
  cgx:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*7,u*3); csWall(C,false,seed,true,tm); },
  cgy:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*7,u*3); csWall(C,true,seed,true,tm); },
  ctur:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*7,u*3.5); csTower(C,0,0,0,3.3,17,tm,{rh:12,flag:seed%2?CS.PINK:CS.ROOF2,cren:1,win:2}); },
  ctur2:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u,u*8,u*4); const top=csTower(C,0,0,0,3.8,23,tm,{rh:15,flag:CS.GOLD,cren:1,win:3,n:9}); [[-1.2,-1.2],[.7,-1.2],[-1.2,.7],[.7,.7]].forEach(([x,y])=>C(x,y,top+15.6,.5,.5,1,CS.GOLD,csGold)); },
  lamp2:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*.4,u*2.6,u*1.3); C(-1.1,-1.1,0,2.2,2.2,.9,'#2E3550'); C(-.35,-.35,.9,.7,.7,9,'#2E3550',{t:'#3E4870',l:'#3A4466',r:'#232A40'}); C(-.9,-.15,8.2,1.8,.3,.3,'#2E3550');
    const fl=.85+.15*Math.sin(tm*5+seed); C(-1.1,-1.1,9.9,2.2,2.2,2.4,'#FFE7A0',{t:'#FFF4CF',l:'rgba(255,231,160,'+fl+')',r:'rgba(255,205,110,'+fl+')'}); C(-1.4,-1.4,12.3,2.8,2.8,.6,'#2E3550'); C(-.8,-.8,12.9,1.6,1.6,.6,'#2E3550'); C(-.2,-.2,13.5,.4,.4,.8,CS.GOLD,csGold); },
  topi:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*.6,u*3.6,u*1.8); C(-1.8,-1.8,0,3.6,3.6,2.2,'#E8DCC8',{t:'#F5EBDA'}); C(-1.9,-1.9,2,3.8,3.8,.3,CS.GOLD,csGold); C(-2.2,-2.2,2.3,4.4,4.4,3,'#3FAE5A'); C(-1.6,-1.6,5.3,3.2,3.2,2.6,'#4CC06A'); C(-.9,-.9,7.9,1.8,1.8,2,'#5BD07A'); C(-.3,-.3,9.9,.6,.6,.6,'#FF8FB8'); },
  hedge:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*.6,u*4.5,u*2); C(-3.8,-1.6,0,7.6,3.2,3.2,'#3FAE5A',{t:'#58C873'}); [-2.6,-.4,1.8].forEach((x,i)=>C(x,-.6,3.2,.9,.9,.6,['#FF8FB8','#FFFFFF','#FFD54A'][i])); },
  bnr:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*.4,u*2.4,u*1.2); C(-.9,-.9,0,1.8,1.8,1,CS.STONE); C(-.25,-.25,1,.5,.5,17,'#E6ECF4'); C(-.4,-.4,18,.8,.8,.8,CS.GOLD,csGold);
    const wv=Math.sin(tm*2.4+seed)*.3; C(.25,-1.6+wv*.2,9,.15,3.2,7.4,CS.ROOF,{l:CS.ROOF,r:'#2E58C0',t:CS.ROOF2}); C(.27,-1.6+wv*.2,15.4,.15,3.2,.5,CS.GOLD,csGold); C(.3,-.5+wv*.2,11.6,.12,1,1,CS.GOLD,csGold); },
  hubf:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*2,u*15,u*7.5);
    C(-7.4,-7.4,0,14.8,14.8,1.8,CS.STONE,{t:CS.STONE2}); C(-6.6,-6.6,1.8,13.2,13.2,.5,'#E8E2D4'); C(-5.9,-5.9,1.9,11.8,11.8,.5,'#6CC8F0',{t:'#8ED8F6'});
    C(-1.6,-1.6,2.4,3.2,3.2,5.4,'#F0EBE1'); C(-3.6,-3.6,7.8,7.2,7.2,.9,'#E6DFD0'); C(-3.1,-3.1,8.5,6.2,6.2,.25,'#8FDCFF',{t:'#B5EAFF'});
    C(-1.3,-1.3,8.7,2.6,2.6,2.2,CS.GOLD,csGold); C(-2,-2,10.9,4,4,1.3,CS.GOLD,csGold); [[-2,-2],[1.4,-2],[-2,1.4],[1.4,1.4],[-.3,-2],[-2,-.3]].forEach(([x,y])=>C(x,y,12.2,.6,.6,1.4,CS.GOLD,csGold));
    C(-.5,-.5,12.2,1,1,1,'#FF5A8A',{t:'#FF8FB0',l:'#FF5A8A',r:'#D93A6A'});
    const P=(a,b,c)=>[ox+(a-b)*u,oy+(a+b)*u*.5-c*u]; g.save(); g.globalCompositeOperation='lighter';
    for(let i=0;i<14;i++){ const k=(tm*.8+i/14)%1; const a=i/14*Math.PI*2; const r=3.2+k*2.6; const [x,y]=P(Math.cos(a)*r,Math.sin(a)*r,9+Math.sin(k*Math.PI)*3.4-k*6); g.fillStyle='rgba(190,235,255,'+(.85-k*.6)+')'; g.fillRect(x-u*.3,y-u*.3,u*.6,u*.6); }
    g.restore(); const [sx,sy]=P(0,0,14); csSparkle(g,u,tm,sx,sy,2.4,'#FFF2B0',6); },
});

/* ── 메인 스트리트 상점: 공통 2층 파사드(맨사드 지붕 · 차양 · 진열창 · 걸린 간판) + 건물마다 시그니처 ── */
function csStore(g,ox,oy,u,tm,C,o){ wShadow(g,ox,oy+u*3,u*17,u*8);
  const W=o.wall, R=o.roof, T=o.trim||'#FFFFFF';
  C(-8.4,-8,0,16.8,16,1,'#D6CFC2',{t:'#E6E0D4'});
  C(-7.6,-7.4,1,15.2,14.8,7.6,W,{t:wShade(W,.1),l:wShade(W,.04),r:wShade(W,-.12)});
  C(-6.6,7.4,1.6,4,.25,4.6,CS.GLASS,csGlass); C(2.6,7.4,1.6,4,.25,4.6,CS.GLASS,csGlass);
  C(-6.8,7.45,6.1,4.4,.2,.4,T); C(2.4,7.45,6.1,4.4,.2,.4,T);
  if(o.inside) o.inside();
  C(-2.2,7.4,1,4.4,.3,6.6,T); C(-1.6,7.45,1,3.2,.3,5.6,o.door||'#5A3A2A',{l:o.door||'#6A4632',r:'#3A2418',t:'#6A4632'}); C(.9,7.75,3.4,.3,.12,.3,CS.GOLD,csGold);
  for(let i=0;i<11;i++){ const c=i%2?'#FFFFFF':o.awn; C(-7.6+i*1.38,7.4,7.1,1.38,2.2,.45,c,{t:c,l:wShade(c,-.06),r:wShade(c,-.2)}); C(-7.6+i*1.38,9.4,6.5,1.38,.2,.6,c); }
  for(let i=0;i<3;i++){ C(7.6,-5.6+i*4,2.4,.25,2.6,3.6,CS.GLASS,csGlass); C(7.65,-5.8+i*4,5.9,.2,3,.35,T); }
  C(-7.9,-7.7,8.6,15.8,15.4,.9,T,{t:'#FFFFFF',l:wShade(T,-.05),r:wShade(T,-.16)});
  C(-7.2,-7,9.5,14.4,14,5.6,o.wall2||W,{t:wShade(o.wall2||W,.1),l:wShade(o.wall2||W,.02),r:wShade(o.wall2||W,-.14)});
  for(let i=0;i<3;i++){ C(-5.6+i*4.6,7,11,2.2,.25,2.8,CS.WIN,csWin('#4A5E9E')); C(-5.8+i*4.6,7.05,10.7,2.6,.3,.35,T); C(7.2,-5.6+i*4.6,11,.25,2.2,2.8,CS.WIN,csWin('#4A5E9E')); }
  C(-7.6,-7.4,15.1,15.2,14.8,.6,T);
  for(let i=0;i<4;i++){ const s=7.2-i*1.5; C(-s,-s+.2,15.7+i*1.3,s*2,s*2-.4,1.3,wShade(R,i*.04),{t:wShade(R,.18+i*.03),l:wShade(R,i*.03),r:wShade(R,-.2)}); }
  [[-3.6],[1.6]].forEach(([x])=>{ C(x,4.6,16.4,2,2,2.6,W); C(x+.4,6.6,16.9,1.2,.2,1.6,CS.WIN,csWin('#4A5E9E')); C(x-.2,4.4,19,2.4,2.4,.7,R); });
  C(4.2,-4.6,17,1.6,1.6,5,'#B7A08A'); C(4,-4.8,22,2,2,.6,'#8A7460');
  const sx=7.6, sy=4.2; C(sx,sy,7.6,1.6,.25,.25,'#3A2A20'); const sw=Math.sin(tm*1.6)*.1; C(sx+.3,sy+.05,4.6+sw,.25*0+2.6,.25,2.8,o.sign||o.awn,{l:wShade(o.sign||o.awn,.05),r:wShade(o.sign||o.awn,-.2),t:o.sign||o.awn}); C(sx+.9,sy-.02,5.4+sw,1.4,.2,1.3,'#FFFFFF');
  if(o.top) o.top(); }
const csLamps=(g,ox,oy,u,tm,pts)=>{ g.save(); g.globalCompositeOperation='lighter'; pts.forEach(([a,b,c],i)=>{ const x=ox+(a-b)*u, y=oy+(a+b)*u*.5-c*u; const fl=.5+.2*Math.sin(tm*3+i); const r=g.createRadialGradient(x,y,0,x,y,u*3); r.addColorStop(0,'rgba(255,220,140,'+fl+')'); r.addColorStop(1,'rgba(255,200,120,0)'); g.fillStyle=r; g.fillRect(x-u*3,y-u*3,u*6,u*6); }); g.restore(); };
Object.assign(W_DRAWX,{
  /* DKO 상점: 주황 차양 · 지붕 위 쇼핑백 간판 · 금화 */
  lm_shop:(g,ox,oy,u,tm,seed,lv,C)=>csStore(g,ox,oy,u,tm,C,{wall:'#FFF1DE',wall2:'#FFE6C7',roof:'#E8562A',awn:'#FF6A2E',trim:'#FFFFFF',sign:'#FF8A3D',
    inside:()=>{ C(-6,6.8,1.6,1,.5,1.6,'#FFD54A'); C(-4.6,6.8,1.6,1,.5,2.4,'#7CC8FF'); C(3.4,6.8,1.6,1.2,.5,1.2,'#FF8FB8'); },
    top:()=>{ const b=Math.sin(tm*2)*.4; C(-2.6,-2.6,22+b,5.2,3.6,4.6,'#FF6A2E',{t:'#FF9A5E',l:'#FF7A3E',r:'#D9481A'}); C(-1.4,-1.2,26.6+b,.4,.4,1.6,'#7A2A0A'); C(.9,-1.2,26.6+b,.4,.4,1.6,'#7A2A0A'); C(-1,-1.2,28+b,2.3,.4,.4,'#7A2A0A');
      C(-1,1,23+b,2,.2,2,CS.GOLD,csGold); C(-.5,1.05,23.5+b,1,.2,1,'#FFFFFF'); const k=(tm*.8)%1; C(3.4,-1,22+k*5,1.2,1.2,.3,CS.GOLD,{t:'rgba(255,224,138,'+(1-k)+')',l:'rgba(245,194,79,'+(1-k)+')',r:'rgba(201,138,26,'+(1-k)+')'}); }}),
  /* 꾸미기 부티크: 분홍 · 진열창 마네킹 · 리본 지붕 */
  lm_locker:(g,ox,oy,u,tm,seed,lv,C)=>csStore(g,ox,oy,u,tm,C,{wall:'#FFF0F6',wall2:'#FFE3F0',roof:'#D02A7A',awn:'#FF5AA8',trim:'#FFFFFF',sign:'#FF5AA8',door:'#B0306A',
    inside:()=>{ [-5.2,4].forEach(x=>{ C(x,6.6,1.6,.4,.4,2.2,'#8A5A6A'); C(x-.5,6.4,3.8,1.4,.8,1.8,'#FF8FC4'); C(x-.1,6.6,5.6,.6,.6,.6,'#F4C9A0'); }); },
    top:()=>{ C(-.8,-.8,22,1.6,1.6,1.6,'#FFD54A',csGold); const w=Math.sin(tm*2)*.3; C(-4.2,-.6,22.2+w,3.4,1.2,1.8,'#FF5AA8'); C(.8,-.6,22.2-w,3.4,1.2,1.8,'#FF5AA8'); C(-.6,-.6,21,1.2,1.2,1.2,'#FF5AA8'); csSparkle(g,u,tm,ox,oy-u*26,3,'#FFC6E2',5); }}),
  /* 채팅 카페: 민트 · 테라스 파라솔 · 김 나는 커피잔 간판 */
  lm_chat:(g,ox,oy,u,tm,seed,lv,C)=>csStore(g,ox,oy,u,tm,C,{wall:'#EAFFF4',wall2:'#D8F7E8',roof:'#139A63',awn:'#3FCB86',trim:'#FFFFFF',sign:'#3FCB86',door:'#2A6A4A',
    inside:()=>{ [[-6.6,8.6],[4.6,8.6]].forEach(([x,y])=>{ C(x+.8,y,1,.3,.3,3.6,'#5A3A20'); C(x,y-.5,3,1.8,1.4,.3,'#F2F5FA'); }); },
    top:()=>{ C(-2,-2,21.6,4,4,3.2,'#FFFFFF',{t:'#6A4024',l:'#FFFFFF',r:'#E6ECF4'}); C(2,-.6,22.4,1.2,.6,1.6,'#FFFFFF',{r:'#E6ECF4'}); C(-2.2,-2.2,21.4,4.4,4.4,.4,'#3FCB86');
      g.save(); g.globalCompositeOperation='lighter'; for(let i=0;i<3;i++){ const k=(tm*.5+i/3)%1; const x=ox+(Math.sin(k*6+i)*1.2)*u, y=oy-(26+k*8)*u; g.fillStyle='rgba(255,255,255,'+(.6-k*.6)+')'; g.beginPath(); g.arc(x,y,u*(.8+k*.9),0,Math.PI*2); g.fill(); } g.restore(); }}),
  /* 커뮤니티 홀: 파랑 · 기둥 현관 · 시계탑 */
  lm_comm:(g,ox,oy,u,tm,seed,lv,C)=>csStore(g,ox,oy,u,tm,C,{wall:'#EEF5FF',wall2:'#E0ECFF',roof:'#2563EB',awn:'#60A5FA',trim:'#FFFFFF',sign:'#3B82F6',door:'#23407A',
    inside:()=>{ [-7,-3.2,2.2,6.2].forEach(x=>C(x,8.4,1,.9,.9,6,'#FFFFFF',{r:'#E6ECF4'})); },
    top:()=>{ C(-2,-2,21.4,4,4,6,'#FFFFFF',{l:'#F3F6FA',r:'#DCE3EE'}); C(2,-1.4,23,.2,2.8,2.8,'#FFFFFF',{r:'#FFFDF5'}); const a=tm*.8; C(2.05,-.1,24.3,.2,.2,1.2,'#23407A'); C(2.08,-.1+Math.cos(a)*.6-.1,24.4+Math.sin(a)*.6,.18,.2,.2,'#E8420A');
      C(-2.4,-2.4,27.4,4.8,4.8,.5,CS.GOLD,csGold); csCone(C,0,0,27.9,2.6,6.5,'#2563EB',6); }}),
  /* e스포츠 스타디움: 원형 관중석 · 조명탑 · 트로피 */
  lm_stadium:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*3,u*18,u*8.5); C(-9,-9,0,18,18,1,'#C9CED6');
    for(let r=0;r<4;r++){ const s=8.4-r*.4; const z=1+r*2.2; C(-s,-s,z,s*2,s*2,2.2,r%2?'#F2F5FA':'#C98A00',{t:r%2?'#FFFFFF':'#FFD54A',l:r%2?'#E6ECF4':'#E0A21A',r:r%2?'#C9D2DE':'#A87300'}); }
    C(-6,-6,9.8,12,12,.4,'#7CD957',{t:'#86DC85'}); [-3,0,3].forEach(i=>C(-6+(i+3)*1.7,-6,10.2,.2,12,.05,'#FFFFFF',{t:'#FFFFFF'}));
    C(-2.4,7.8,1,4.8,.3,5,'#2A2A33'); C(-1.8,7.85,6,3.6,.2,.9,'#FFD54A',csGold);
    [[-8,-8],[6.8,-8],[-8,6.8],[6.8,6.8]].forEach(([x,y],i)=>{ C(x,y,1,1.2,1.2,17,'#5A6070'); const on=.7+.3*Math.sin(tm*3+i); C(x-.8,y-.8,18,2.8,2.8,1.6,'#FFFFFF',{t:'rgba(255,250,220,'+on+')',l:'rgba(255,245,200,'+on+')',r:'#C9CED6'}); });
    const b=Math.sin(tm*2)*.5; C(-1,-1,12+b,2,2,.8,CS.GOLD,csGold); C(-.4,-.4,12.8+b,.8,.8,1.6,CS.GOLD,csGold); C(-1.4,-1.4,14.4+b,2.8,2.8,2,CS.GOLD,csGold); C(-1.9,-.3,15+b,.5,.6,1,CS.GOLD,csGold); C(1.4,-.3,15+b,.5,.6,1,CS.GOLD,csGold);
    csSparkle(g,u,tm,ox,oy-u*16,3,'#FFE7A0',6); },
  /* 내전 아레나: 콜로세움 아치 · 붉은 깃발 · 교차한 검 */
  lm_arena:(g,ox,oy,u,tm,seed,lv,C)=>{ wShadow(g,ox,oy+u*3,u*18,u*8.5); C(-9,-9,0,18,18,1,'#C9B8A4');
    C(-8.2,-8.2,1,16.4,16.4,9,'#E8D7C2',{t:'#F2E4D2',l:'#E8D7C2',r:'#C9B49C'});
    for(let i=0;i<5;i++){ C(-7+i*3.1,8.2,2,1.8,.25,4,'#6A3A2A',{l:'#5A2E20'}); C(-7.2+i*3.1,8.25,6,2.2,.2,.5,'#F2E4D2'); C(8.2,-7+i*3.1,2,.25,1.8,4,'#6A3A2A',{r:'#4A2418'}); }
    C(-8.5,-8.5,10,17,17,.8,'#B0203A',{t:'#D93A50'}); C(-6.4,-6.4,10.8,12.8,12.8,.3,'#D9C6A8');
    for(let i=0;i<6;i++){ C(-8.2+i*3.1,7.4,10.8,1.4,.8,1.4,'#E8D7C2'); C(7.4,-8.2+i*3.1,10.8,.8,1.4,1.4,'#E8D7C2'); }
    [[-7.6,-7.6],[6.4,-7.6],[-7.6,6.4]].forEach(([x,y],i)=>{ C(x+.5,y+.5,10.8,.3,.3,7,'#5A3A20'); const wv=Math.sin(tm*4+i)*.2; C(x+.8,y+.5,15+wv,.2,2.6,2.2,'#FF5A6A',{l:'#FF5A6A',r:'#C9203A',t:'#FF7A8A'}); });
    C(-.3,-2.6,11.2,.6,5.2,.6,'#D9DEE6'); C(-2.6,-.3,11.2,5.2,.6,.6,'#D9DEE6'); C(-.6,-.6,11.1,1.2,1.2,1,CS.GOLD,csGold); C(-.4,-3.2,11.2,.8,.8,.6,'#8A5A34'); C(-3.2,-.4,11.2,.8,.8,.6,'#8A5A34'); },
});

/* ── 포털 아치: 모든 포털이 같은 문법(돌 받침 · 두 기둥 · 아치 · 소용돌이 막 · 테마 장식)으로 정리돼요 ── */
const CS_PT={
  slime:(C,tm)=>{ const b=Math.abs(Math.sin(tm*3))*.6; C(-2,-2,21+b,4,4,2.6-b*.4,'#7CF0B5',{t:'#B4F9D6',l:'#7CF0B5',r:'#3FCB86'}); C(-1.2,-1.2,23.6,2.4,2.4,.9,'#A6F7CF'); C(-1,2,22.2+b,.5,.12,.7,'#1A3A2A'); C(.6,2,22.2+b,.5,.12,.7,'#1A3A2A'); C(-.3,-.3,24.5,.6,.6,.8,CS.GOLD,csGold); },
  hell:(C,tm)=>{ for(let i=0;i<5;i++){ const f=Math.sin(tm*9+i*1.7)*.3; const s=2.2-i*.42; C(-s/2+f*.4,-s/2,20.6+i*1.2,s,s,1.3,['#8A0E1E','#E8321E','#FF6B4A','#FFA24A','#FFE07A'][i]); } },
  glacier:(C,tm)=>{ C(-.6,-.6,20.6,1.2,1.2,6.4,'#DFF5FF',{t:'#FFFFFF',l:'#CDEFFF',r:'#8FCDEE'}); C(-2.4,-.4,22.6,4.8,.8,.8,'#BDEBFF'); C(-.4,-2.4,22.6,.8,4.8,.8,'#BDEBFF'); C(-1.8,-.3,24.8,3.6,.6,.6,'#DFF5FF'); [-1.6,1.1].forEach(x=>C(x,-.3,20.6,.5,.6,2.6,'#9CE4FF')); },
  story:(C,tm)=>{ C(-2.8,-1.6,20.6,2.7,3.2,.5,'#FFF4D6',{t:'#FFFFFF'}); C(.1,-1.6,20.6,2.7,3.2,.5,'#FFF4D6',{t:'#FFFFFF'}); C(-.15,-1.6,20.4,.3,3.2,.6,'#C9965A'); C(-.3,-.3,21.1,.6,.6,2.6,'#8A5A34'); C(-1.6,-1.6,23.4,3.2,3.2,2.4,'#5BD07A',{t:'#7CE896'}); C(-.9,-.9,25.8,1.8,1.8,1.3,'#7CE896'); const b=Math.sin(tm*2)*.4; C(1.8,1.2,25+b,.6,.6,.6,'#FFE07A'); },
  dkoa:(C,tm)=>{ C(-.4,-.4,20.6,.8,.8,1,CS.GOLD,csGold); C(-1.8,-1.8,21.6,3.6,3.6,3.6,'#4A9EF0',{t:'#7CC8FF',l:'#4A9EF0',r:'#2E6FC0'}); const a=Math.floor(tm*2)%3; C(-1.8+a*.6,1.8,22.6,1.4,.12,1.2,'#5BD07A'); C(1.8,-1.4+a*.5,23,.12,1.4,1.4,'#5BD07A'); C(-2.2,-2.2,23.2,4.4,4.4,.3,CS.GOLD,csGold); },
  town:(C,tm)=>{ const on=Math.floor(tm*3)%2; C(-2,-2,20.6,4,4,3.4,'#2A2240',{t:'#3A3060'}); C(-1.4,2,21.4,2.8,.12,2,on?'#FF5AB4':'#5AE0FF'); C(2,-1.4,21.4,.12,2.8,2,on?'#5AE0FF':'#FF5AB4'); C(-.2,-.2,24,.4,.4,1.4,'#C9CED8'); C(-.6,-.6,25.4,1.2,1.2,1.2,'#FF5A6A'); },
};
function csPortal(k){ return (g,ox,oy,u,tm,seed,lv,C)=>{ const L=W_LM.find(x=>x.k===k); const c0=(L&&L.c[0])||'#7CC8FF', c1=(L&&L.c[1])||'#2E6FC0';
  wShadow(g,ox,oy+u*3,u*15,u*7.5);
  C(-8.8,-8.8,0,17.6,17.6,1,CS.STONE,{t:'#DAD3C5'}); C(-7.6,-7.6,1,15.2,15.2,.7,CS.STONE2,{t:'#EEE9DE'}); C(-5.6,-5.6,1.7,11.2,11.2,.15,c1,{t:wHexA(c1,.85)}); C(-4.8,-4.8,1.75,9.6,9.6,.15,c0,{t:wHexA(c0,.55)});
  C(-1.6,1.7,1.7,3.2,7,.2,'#F2EDE2',{t:'#F7F3EA'});
  [[-7.4,-7.4],[6,-7.4],[-7.4,6]].forEach(([x,y],i)=>{ const b=Math.sin(tm*2+i*2)*.6; C(x+.3,y+.3,1.7,.8,.8,1.2,CS.STONE); C(x,y,4+b,1.4,1.4,2.2,c0,{t:wShade(c0,.3),l:c0,r:c1}); });
  const pil=x=>{ C(x-.3,-1.9,1.7,3.2,3.8,1.4,CS.STONE); C(x,-1.6,3.1,2.6,3.2,13,'#F3EEE4',{t:'#FFFFFF',l:'#ECE6DA',r:'#D6CFC1'}); C(x+.8,1.62,5,1,.15,8,c1,{l:c1,r:c1,t:c1}); C(x+2.62,-.5,5,.15,1,8,c1,{l:wShade(c1,-.2),r:wShade(c1,-.2),t:c1}); C(x-.2,-1.8,15.6,3,3.6,.6,CS.GOLD,csGold); };
  pil(-7);
  /* 소용돌이 막: x-z 평면 위 타원 */
  { const P=(a,c)=>[ox+a*u,oy+a*u*.5-c*u]; g.save(); const [cx,cy]=P(0,9.4); g.translate(cx,cy); g.transform(1,.5,0,1,0,0);
    const R=u*4.6, Rz=u*6.8; const gr=g.createRadialGradient(0,0,0,0,0,Math.max(R,Rz)); gr.addColorStop(0,'rgba(255,255,255,.95)'); gr.addColorStop(.35,wHexA(c0,.9)); gr.addColorStop(1,wHexA(c1,.85));
    g.fillStyle=gr; g.beginPath(); g.ellipse(0,0,R,Rz,0,0,Math.PI*2); g.fill(); g.globalCompositeOperation='lighter';
    for(let i=0;i<3;i++){ g.strokeStyle='rgba(255,255,255,'+(.35-i*.08)+')'; g.lineWidth=u*.45; g.beginPath(); const a0=tm*(2.2+i*.4)+i*2.1; g.ellipse(0,0,R*(.85-i*.22),Rz*(.85-i*.22),0,a0,a0+Math.PI*1.1); g.stroke(); }
    for(let i=0;i<8;i++){ const k=(tm*.6+i/8)%1; const a=i*2.3+tm; g.fillStyle='rgba(255,255,255,'+(1-k)*.8+')'; g.fillRect(Math.cos(a)*R*(1-k)-u*.25,Math.sin(a)*Rz*(1-k)-u*.25,u*.5,u*.5); }
    g.restore(); }
  pil(4.4);
  C(-7.4,-1.8,16.2,14.4,3.6,2.4,'#F3EEE4',{t:'#FFFFFF',l:'#ECE6DA',r:'#D6CFC1'}); C(-7.4,1.82,16.6,14.4,.12,.4,CS.GOLD,csGold);
  C(-1.5,-2,15.6,3,4,4.4,c1,{t:wShade(c0,.2),l:c0,r:c1}); C(-.6,2.02,16.6,1.2,.12,2.2,'#FFFFFF');
  (CS_PT[k]||CS_PT.dkoa)(C,tm);
  const P2=(a,b,c)=>[ox+(a-b)*u,oy+(a+b)*u*.5-c*u]; const [sx,sy]=P2(0,0,14); csSparkle(g,u,tm,sx,sy,4,c0,7); }; }
['slime','hell','glacier','story','dkoa','town'].forEach(k=>{ W_DRAWX['lm_'+k]=csPortal(k); });

/* ── 땅: 해자 물 · 메인 스트리트 자갈 ── */
function wMoatTile(ctx,px,py,HW,HH,z,T,tm){ const dy=5*z; ctx.fillStyle='#2F86C0'; ctx.beginPath(); ctx.moveTo(px,py-HH); ctx.lineTo(px+HW,py); ctx.lineTo(px,py+HH); ctx.lineTo(px-HW,py); ctx.closePath(); ctx.fill();
  const c=((T.x+T.y)&1)?'#4FB3E6':'#47A9DE'; ctx.fillStyle=c; ctx.beginPath(); ctx.moveTo(px,py-HH+dy); ctx.lineTo(px+HW,py+dy); ctx.lineTo(px,py+HH+dy); ctx.lineTo(px-HW,py+dy); ctx.closePath(); ctx.fill();
  if(wHash(T.x,T.y,5)>.4){ ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.lineWidth=1.2*z; const a=(wHash(T.x,T.y,6)-.5)*HW*.8; ctx.beginPath(); ctx.moveTo(px+a-5*z,py+dy); ctx.quadraticCurveTo(px+a,py+dy-2*z,px+a+5*z,py+dy); ctx.stroke(); }
  if(wHash(T.x,T.y,9)>.86){ ctx.fillStyle='#5BD07A'; ctx.beginPath(); ctx.ellipse(px-HW*.25,py+dy+HH*.2,4*z,2*z,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#FF9AC4'; ctx.fillRect(px-HW*.25-1*z,py+dy+HH*.2-2*z,2*z,2*z); } }
function wCobble(ctx,px,py,HW,HH,z,T){ ctx.strokeStyle=T.cas?'rgba(150,140,120,.22)':'rgba(170,140,100,.24)'; ctx.lineWidth=1*z; ctx.beginPath();
  for(let i=1;i<3;i++){ const k=i/3; ctx.moveTo(px-HW+HW*k,py-HH*k); ctx.lineTo(px+HW*k,py+HH-HH*k); }
  for(let i=1;i<3;i++){ const k=i/3; ctx.moveTo(px-HW+HW*k,py+HH*k); ctx.lineTo(px+HW*k,py-HH+HH*k); } ctx.stroke();
  if(T.t==='blvd'&&Math.abs(T.x-T.y)===0){ ctx.fillStyle='rgba(208,64,96,.16)'; ctx.beginPath(); ctx.moveTo(px,py-HH*.6); ctx.lineTo(px+HW*.35,py-HH*.25); ctx.lineTo(px,py+HH*.6); ctx.lineTo(px-HW*.35,py+HH*.25); ctx.closePath(); ctx.fill(); } }

/* ═════════ v29.7 주민과 AI 대화 (Gemini · 서버 함수 dkoNpc) ═════════
   · 서버에 키가 있으면 진짜 AI가 캐릭터로 대답해요. 없거나(데모 · 키 미설정) 오늘 횟수를 다 쓰면 준비된 대사로 이어 가요 */
const W_NPC_Q={sera:['처음인데 뭐부터 하면 좋아요?','포털은 어떻게 들어가요?','역할은 뭘 고를까요?'],toby:['요즘 뭐가 잘 팔려요?','골드 모으는 팁 있어요?','D-Coin 환전은 어디서 해요?'],
  pipi:['오늘 편지 왔어요?','선물 받을 수 있어요?','누가 널 만들었어?'],owl:['대균열이 뭐예요?','이음은 누구예요?','석판은 어디서 찾아요?'],
  guard:['보스 잡는 요령 알려 줘요','화상은 어떻게 피해요?','경직 게이지가 뭐예요?'],mia:['섬 꾸미기 팁 있어요?','벚꽃나무는 어디서 나요?','제일 좋아하는 꽃은?']};
function WNpcChat({c,id,onClose}){ const D=W_NPC.find(x=>x.id===id)||W_NPC[0];
  const [L,setL]=useState(()=>[{r:'n',t:D.lines[0]}]); const [v,setV]=useState(''); const [busy,setBusy]=useState(false); const [mode,setMode]=useState(c.aiOk?'ai':'off'); const [left,setLeft]=useState(null);
  const li=useRef(1); const box=useRef(null); const inp=useRef(null);
  useEffect(()=>{ const b=box.current; if(b) b.scrollTop=b.scrollHeight; },[L.length,busy]);
  const canned=()=>{ const t=wNpcSay(D,li.current++,{q:null,p:{},got:true,lv:0}); return t; };
  const send=async txt=>{ const m=String(txt==null?v:txt).trim(); if(!m||busy) return; setV(''); haptic(8); const hist=L.slice(-6); setL(x=>[...x,{r:'u',t:m}]); setBusy(true);
    let rep=null; if(mode==='ai'&&c.npcAsk){ const r=await c.npcAsk(D.id,m,hist); if(r&&r.text){ rep=r.text; if(r.left!=null) setLeft(r.left); } else if(r&&r.err==='limit'){ setMode('limit'); } else if(r&&r.err==='off'){ setMode('off'); } else if(r&&r.err){ setMode('net'); } }
    else await new Promise(res=>setTimeout(res,520));
    setL(x=>[...x,{r:'n',t:rep||canned(),c:!rep}]); setBusy(false); wSfx('pop'); };
  const note=mode==='ai'?('AI 주민 · Gemini'+(left!=null?' · 오늘 '+left+'번 남음':'')):mode==='limit'?'오늘 AI 대화를 다 썼어요 · 내일 다시 열려요':mode==='net'?'연결이 불안정해서 준비된 대사로 대답해요':'AI 연결 전 · 준비된 대사로 대답해요';
  return html`<div className="wnc97-bg" onClick=${onClose}><div className="wnc97 wui-up" style=${{'--n':D.c}} onClick=${e=>e.stopPropagation()} role="dialog" aria-label=${D.n+'와 대화'}>
    <div className="wnc97-h"><span className="wnc97-av"><${Icon} n="chat" s=${18} w=${2.4}/></span><div><b>${D.n}</b><small className=${'wnc97-st '+mode}><i></i>${note}</small></div><button className="wbi-x tap" onClick=${onClose} aria-label="닫기"><${Icon} n="x" s=${18} w=${3}/></button></div>
    <div className="wnc97-l" ref=${box}>${L.map((m,i)=>html`<div key=${i} className=${'wnc97-m '+m.r}><p>${m.t}</p></div>`)}${busy?html`<div className="wnc97-m n"><p className="wnc97-dots"><i></i><i></i><i></i></p></div>`:null}</div>
    <div className="wnc97-q">${(W_NPC_Q[D.id]||[]).map(q=>html`<button key=${q} className="tap" disabled=${busy} onClick=${()=>send(q)}>${q}</button>`)}</div>
    <form className="wnc97-f" onSubmit=${e=>{ e.preventDefault(); send(); }}><input ref=${inp} value=${v} maxLength=${200} placeholder=${D.n.split(' ').pop()+'에게 말하기'} onInput=${e=>setV(e.target.value)} onKeyDown=${e=>e.stopPropagation()}/><button className="tap" type="submit" disabled=${busy||!v.trim()} aria-label="보내기"><${Icon} n="send" s=${18} w=${2.4}/></button></form>
  </div></div>`; }

window.__DKOW={WorldBeta,WItemIcon,WorldThumb,warm:typeof wWarm==="function"?wWarm:null};
})();
