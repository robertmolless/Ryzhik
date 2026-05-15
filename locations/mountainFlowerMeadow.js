'use strict';

const FLOWER_MEADOW_ITEMS = {
  blueFlower: { id:'blueFlower', name:'Синий цветок',  icon:'💙', desc:'Редкий синий цветок с горной поляны. Лепестки как небо.',       rare:true  },
  warmPebble: { id:'warmPebble', name:'Тёплый камень', icon:'🪨', desc:'Гладкий камень, прогретый солнцем. Приятен на ощупь.',          rare:false },
};

const FLOWER_MEADOW_OBJECTS = [
  { id:'fm_exit',      x:38,  y:228, w:55,  h:70,  type:'trail_sign',   label:'← Вернуться к горной тропе', action:'exit_subzone',   blocking:false },
  { id:'fm_flowers',   x:125, y:195, w:78,  h:58,  type:'flower_patch', label:'🌸 Рассмотреть цветы',        action:'examine',        blocking:false },
  { id:'fm_butterfly', x:295, y:165, w:68,  h:60,  type:'butterfly',    label:'🦋 Поймать бабочку',          action:'catch_butterfly',blocking:false },
  { id:'fm_stream',    x:458, y:162, w:65,  h:110, type:'stream',       label:'💧 Послушать ручеёк',         action:'listen_stream',  blocking:true  },
  { id:'fm_petals',    x:335, y:228, w:62,  h:46,  type:'petals',       label:'🌸 Собрать лепестки',         action:'collect_petals', blocking:false },
  { id:'fm_moss',      x:235, y:255, w:64,  h:40,  type:'moss',         label:'🌿 Мягкий мох',               action:'examine',        blocking:false },
  { id:'fm_hidden',    x:385, y:275, w:52,  h:40,  type:'grass_hide',   label:'🌿 Поискать в траве',         action:'find_hidden',    blocking:false },
  { id:'fm_rock1',     x:85,  y:250, w:52,  h:40,  type:'rock',         label:null,                          action:null,             blocking:true  },
  { id:'fm_rock2',     x:514, y:146, w:54,  h:42,  type:'rock',         label:null,                          action:null,             blocking:true  },
  { id:'fm_rock3',     x:128, y:148, w:36,  h:28,  type:'rock',         label:null,                          action:null,             blocking:true  },
  { id:'fm_blueflower',x:192, y:276, w:36,  h:28,  type:'flower',       label:'💙 Синий цветок',             action:'pickup', item:'blueFlower',     blocking:false },
  { id:'fm_mtnflower', x:295, y:295, w:32,  h:26,  type:'flower',       label:'🌼 Горный цветок',            action:'pickup', item:'mountainFlower', blocking:false },
];

const _fmButterflyPool = Array.from({ length: 8 }, (_, i) => ({
  bx: 0.28 + (i%4)*0.08,
  by: 0.38 + Math.floor(i/4)*0.08,
  phase: i * 0.88,
  spd:   0.72 + i * 0.08,
  radius:18 + i * 5,
  color: ['#e070f0','#60b8f0','#f0b840','#88d888','#f06080','#80e0d0','#f0d060','#d080f0'][i],
}));

const _fmWindPool = Array.from({ length: 10 }, (_, i) => ({
  x: (i * 58 + 15) % 620,
  y: 80 + (i * 30) % 220,
  len: 12 + (i % 4) * 4,
  phase: (i * 0.78) % (Math.PI * 2),
  spd: 22 + (i % 5) * 5,
}));

function _fm_sky(ctx, W, H, period) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (period === 'morning')      { g.addColorStop(0,'#5078a8'); g.addColorStop(0.45,'#90bcd8'); g.addColorStop(1,'#c8dce8'); }
  else if (period === 'evening') { g.addColorStop(0,'#261e4e'); g.addColorStop(0.45,'#784860'); g.addColorStop(1,'#c8826a'); }
  else if (period === 'night')   { g.addColorStop(0,'#040610'); g.addColorStop(0.5,'#0a0c22'); g.addColorStop(1,'#12142e'); }
  else                           { g.addColorStop(0,'#4070a8'); g.addColorStop(0.45,'#74a8d0'); g.addColorStop(1,'#a8d0ea'); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function _fm_stars(ctx, t, W, H) {
  ctx.save();
  for (let i=0; i<32; i++) {
    const sx=(i*163%W), sy=(i*109%(H*0.40));
    const a=0.32+0.58*Math.sin(t*1.08+i*0.65);
    ctx.globalAlpha=a; ctx.fillStyle=i%6===0?'#ffd880':'#ffffff';
    ctx.beginPath(); ctx.arc(sx, sy, i%8===0?1.7:1.1, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1; ctx.restore();
}

function _fm_sunbeams(ctx, t, W, H) {
  ctx.save(); ctx.globalAlpha=0.08;
  [[W*0.3,0,W*0.18,H*0.54],[W*0.52,0,W*0.38,H*0.52],[W*0.72,0,W*0.58,H*0.50]].forEach(([x1,y1,x2,y2],i) => {
    const wob=Math.sin(t*0.48+i*1.1)*0.018;
    const g=ctx.createLinearGradient(x1,y1,x2,y2);
    g.addColorStop(0,'rgba(255,240,170,0.58)'); g.addColorStop(1,'rgba(255,240,170,0)');
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.moveTo(x1-16+wob*W,y1); ctx.lineTo(x1+16+wob*W,y1);
    ctx.lineTo(x2+38,y2);       ctx.lineTo(x2-38,y2);
    ctx.closePath(); ctx.fill();
  });
  ctx.restore();
}

function _fm_ground(ctx, W, H, period) {
  const gTop=period==='night'?'#121c0c':period==='evening'?'#2e3c1a':'#3e5a28';
  const gBot=period==='night'?'#0a1206':period==='evening'?'#202c10':'#2c4218';
  const g=ctx.createLinearGradient(0,H*0.50,0,H);
  g.addColorStop(0,gTop); g.addColorStop(1,gBot);
  ctx.fillStyle=g; ctx.fillRect(0,H*0.50,W,H*0.50);
  const mc=period==='night'?'rgba(14,22,8,0.52)':period==='evening'?'rgba(28,42,14,0.45)':'rgba(42,68,22,0.40)';
  ctx.fillStyle=mc;
  [[0.12,0.60,82,15],[0.36,0.66,90,14],[0.58,0.63,78,13],[0.80,0.68,70,12]].forEach(([bx,by,rw,rh]) => {
    ctx.beginPath(); ctx.ellipse(W*bx,H*by,rw,rh,-0.10,0,Math.PI*2); ctx.fill();
  });
}

function _fm_grass(ctx, t, W, H, period) {
  const gc=period==='night'?'#182210':period==='evening'?'#283a14':'#3a5a20';
  const gc2=period==='night'?'#1e2a12':period==='evening'?'#324818':'#4a7028';
  ctx.strokeStyle=gc; ctx.lineWidth=1.8; ctx.lineCap='round';
  for (let i=0; i<60; i++) {
    const gx=W*(0.04+i*0.0165), gy=H*0.50+2;
    const h=12+((i*7)%14);
    const wob=Math.sin(t*0.8+i*0.55)*3;
    ctx.strokeStyle=i%3===0?gc2:gc;
    ctx.beginPath(); ctx.moveTo(gx,gy); ctx.quadraticCurveTo(gx+wob,gy-h*0.55,gx+wob*0.4,gy-h); ctx.stroke();
  }
}

function _fm_flowers(ctx, t, W, H, period) {
  const flowerDefs=[
    { cx:0.16, cy:0.52, r:5,  petals:5, pc:'#f080a0', cc:'#ffe040', ph:0.0  },
    { cx:0.22, cy:0.54, r:4,  petals:5, pc:'#e0a0e0', cc:'#ffe040', ph:0.8  },
    { cx:0.30, cy:0.51, r:5,  petals:6, pc:'#f0c840', cc:'#ff8020', ph:1.5  },
    { cx:0.38, cy:0.53, r:4,  petals:5, pc:'#80c8f0', cc:'#ffe040', ph:2.2  },
    { cx:0.50, cy:0.52, r:6,  petals:6, pc:'#f0a060', cc:'#ffe040', ph:0.5  },
    { cx:0.58, cy:0.50, r:4,  petals:5, pc:'#a0d880', cc:'#ffe040', ph:3.1  },
    { cx:0.68, cy:0.52, r:5,  petals:5, pc:'#e080c0', cc:'#ff8020', ph:1.8  },
    { cx:0.76, cy:0.53, r:4,  petals:6, pc:'#80b8f8', cc:'#ffe040', ph:2.8  },
    { cx:0.85, cy:0.51, r:5,  petals:5, pc:'#f0e060', cc:'#ff8020', ph:0.3  },
    { cx:0.20, cy:0.62, r:4,  petals:5, pc:'#f0c0d8', cc:'#ffe040', ph:1.2  },
    { cx:0.42, cy:0.64, r:5,  petals:5, pc:'#80e8c8', cc:'#ffe040', ph:2.6  },
    { cx:0.62, cy:0.63, r:4,  petals:6, pc:'#f8d060', cc:'#ff6030', ph:0.9  },
    { cx:0.80, cy:0.65, r:5,  petals:5, pc:'#e090f0', cc:'#ffe040', ph:3.5  },
  ];
  const alpha=period==='night'?0.35:period==='evening'?0.70:1.0;
  ctx.save(); ctx.globalAlpha=alpha;
  flowerDefs.forEach(f => {
    const fx=W*f.cx, fy=H*f.cy;
    const wob=Math.sin(t*0.78+f.ph)*1.8;
    const stemC=period==='night'?'#182210':'#3a6020';
    ctx.strokeStyle=stemC; ctx.lineWidth=1.5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(fx,fy+f.r+8); ctx.lineTo(fx+wob,fy+f.r); ctx.stroke();
    for (let p=0; p<f.petals; p++) {
      const a=(p/f.petals)*Math.PI*2+wob*0.05;
      const px=fx+Math.cos(a)*f.r*1.5, py=fy+Math.sin(a)*f.r*1.5;
      ctx.fillStyle=f.pc; ctx.beginPath(); ctx.ellipse(px,py,f.r*0.8,f.r*0.55,a,0,Math.PI*2); ctx.fill();
    }
    ctx.fillStyle=f.cc; ctx.beginPath(); ctx.arc(fx,fy,f.r*0.5,0,Math.PI*2); ctx.fill();
  });
  ctx.restore();
}

function _fm_butterflies(ctx, t, szState) {
  const caught=szState.butterflyCaught;
  ctx.save();
  _fmButterflyPool.forEach((b, i) => {
    if (caught && i<3) return;
    const W=600;
    const bx=W*(b.bx+Math.cos(t*b.spd+b.phase)*b.radius/W);
    const by=155+Math.sin(t*(b.spd*0.7)+b.phase*1.2)*b.radius*0.55;
    if (bx<0||bx>W||by<60||by>300) return;
    const wing=Math.sin(t*8+b.phase)*0.35+0.65;
    const c=b.color;
    ctx.globalAlpha=0.78;
    ctx.fillStyle=c;
    ctx.save(); ctx.translate(bx,by);
    ctx.scale(wing,1); ctx.beginPath(); ctx.ellipse(-6,0,9,6,0.3,0,Math.PI*2); ctx.fill();
    ctx.scale(-1,1);   ctx.beginPath(); ctx.ellipse(-6,0,9,6,0.3,0,Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.fillStyle='rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.arc(bx,by,2,0,Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha=1; ctx.restore();
}

function _fm_stream(ctx, t, W, H, period) {
  const sx=W*0.78;
  const wC=period==='night'?'rgba(120,138,178,0.58)':period==='evening'?'rgba(100,120,168,0.62)':'rgba(100,150,200,0.65)';
  const sC=period==='night'?'rgba(165,178,212,0.30)':'rgba(195,222,240,0.40)';
  ctx.strokeStyle=wC; ctx.lineWidth=8; ctx.lineCap='round'; ctx.lineJoin='round';
  ctx.beginPath();
  ctx.moveTo(sx+Math.sin(t*0.38)*6, H*0.32);
  ctx.bezierCurveTo(sx-8+Math.sin(t*0.52)*5,H*0.38,sx+10,H*0.46,sx+Math.sin(t*0.44)*7,H*0.54);
  ctx.bezierCurveTo(sx-6,H*0.62,sx+8,H*0.70,sx,H*0.78);
  ctx.stroke();
  ctx.strokeStyle=sC; ctx.lineWidth=3;
  ctx.setLineDash([5,6]); ctx.stroke(); ctx.setLineDash([]);
  for (let i=0; i<8; i++) {
    const sy=H*(0.34+i*0.056);
    const sox=(Math.sin(t*1.8+i*1.0)*6);
    const a=0.12+0.22*Math.sin(t*2.0+i*0.7);
    ctx.save(); ctx.globalAlpha=a;
    ctx.fillStyle='rgba(215,235,255,1)';
    ctx.beginPath(); ctx.ellipse(sx+sox,sy,5,2,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

function _fm_moss(ctx, W, H, period) {
  const mc=period==='night'?'rgba(18,28,12,0.55)':period==='evening'?'rgba(28,42,16,0.50)':'rgba(50,80,30,0.45)';
  [[0.38,0.64,52,18],[0.55,0.68,42,15],[0.70,0.70,36,14],[0.20,0.70,44,16]].forEach(([bx,by,rw,rh]) => {
    ctx.fillStyle=mc; ctx.beginPath(); ctx.ellipse(W*bx,H*by,rw,rh,0.15,0,Math.PI*2); ctx.fill();
    const mc2=period==='night'?'rgba(20,32,14,0.35)':'rgba(60,95,35,0.30)';
    ctx.fillStyle=mc2; ctx.beginPath(); ctx.ellipse(W*bx-rw*0.25,H*by-rh*0.3,rw*0.55,rh*0.55,0.15,0,Math.PI*2); ctx.fill();
  });
}

function _fm_smallStones(ctx, W, H, period) {
  const sc=period==='night'?'#20222e':'#727080';
  [[0.14,0.76,5,3.2],[0.28,0.80,4.2,2.6],[0.48,0.74,5.5,3.4],[0.66,0.78,4,2.5],[0.82,0.82,5.2,3]].forEach(([bx,by,rw,rh]) => {
    ctx.fillStyle=sc; ctx.beginPath(); ctx.ellipse(W*bx,H*by,rw,rh,0.28,0,Math.PI*2); ctx.fill();
  });
}

function _fm_trees(ctx, W, H, period, t) {
  const trunk=period==='night'?'#161208':'#44300e';
  const lc1=period==='night'?'#102010':period==='evening'?'#2a3818':'#385030';
  const lc2=period==='night'?'#152514':period==='evening'?'#324422':'#4a6838';
  [[W*0.04,H*0.54,H*0.28,H*0.11,0.0],[W*0.09,H*0.51,H*0.32,H*0.13,1.2],[W*0.88,H*0.52,H*0.30,H*0.12,2.4],[W*0.94,H*0.55,H*0.26,H*0.10,0.6]].forEach(([x,y,h,w,ph]) => {
    const wob=Math.sin(t*1.6+ph)*2.8;
    ctx.fillStyle=trunk; ctx.fillRect(x-4,y+2,8,14);
    [[0,h*0.34,w*0.88,'#0'],[0,h*0.58,w*0.72,'#1'],[0,h*0.80,w*0.50,'#2']].forEach(([ox,ty,tw,ci],ti) => {
      ctx.fillStyle=ti===2?lc2:lc1;
      ctx.beginPath();
      ctx.moveTo(x+wob*ti*0.25,y-ty-h*0.12);
      ctx.lineTo(x-tw*0.5+wob*ti*0.15,y-ty+h*0.10);
      ctx.lineTo(x+tw*0.5+wob*ti*0.15,y-ty+h*0.10);
      ctx.closePath(); ctx.fill();
    });
  });
}

function _fm_petals(ctx, t, W, H, period) {
  ctx.save(); ctx.globalAlpha=period==='night'?0.20:period==='evening'?0.45:0.65;
  for (let i=0; i<12; i++) {
    const px=W*(0.10+(((t*18+i*52)%(W*0.85))/W));
    const py=H*(0.38+Math.sin(t*0.62+i*0.82)*0.10);
    const colors=['#f090b0','#f0d070','#b0e8f0','#e0a0f0','#90e0a0'];
    ctx.fillStyle=colors[i%colors.length];
    ctx.save(); ctx.translate(px,py); ctx.rotate(t*0.8+i*0.7);
    ctx.beginPath(); ctx.ellipse(0,0,4,2.5,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha=1; ctx.restore();
}

function _fm_pickups(ctx, t, szState, W, H) {
  const glow=0.5+0.5*Math.sin(t*3.0);
  const items=[
    { id:'fm_blueflower', x:W*0.32, y:H*0.68, emoji:'💙', shadow:'#6088e0' },
    { id:'fm_mtnflower',  x:W*0.50, y:H*0.72, emoji:'🌼', shadow:'#d8b838' },
    { id:'mq_ribbon_fm',  x:W*0.35, y:H*0.63, emoji:'🎀', shadow:'#e06080' },
    { id:'mq_windflower', x:W*0.60, y:H*0.57, emoji:'🌺', shadow:'#e02868' },
  ];
  items.forEach(p => {
    if (szState.pickedItems.has(p.id)) return;
    ctx.save(); ctx.shadowColor=p.shadow; ctx.shadowBlur=9+glow*6;
    ctx.font='20px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(p.emoji,p.x,p.y); ctx.restore();
  });
  if (!szState.pickedItems.has('fm_hidden')) {
    const gx=W*0.64, gy=H*0.68;
    ctx.save(); ctx.shadowColor='#a8a080'; ctx.shadowBlur=6+glow*5;
    ctx.font='16px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.globalAlpha=0.55+glow*0.30; ctx.fillText('🌿',gx,gy); ctx.restore();
  }
}

function _fm_fireflies(ctx, t, W, H) {
  ctx.save();
  for (let i=0; i<14; i++) {
    const fx=W*(0.08+((t*12+i*45)%(W*0.85))/W);
    const fy=H*(0.42+Math.sin(t*0.55+i*1.1)*0.14);
    const fa=0.20+0.62*Math.sin(t*2.5+i*0.9);
    ctx.globalAlpha=fa;
    ctx.fillStyle='#b8e868';
    ctx.beginPath(); ctx.arc(fx,fy,2.2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(180,230,100,0.28)';
    ctx.beginPath(); ctx.arc(fx,fy,6,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1; ctx.restore();
}

function _fm_exitSign(ctx, period, ch) {
  const sx=40, signY=230*(ch/400), sw=52, sh=68*(ch/400);
  const pC=period==='night'?'#382618':'#785222';
  ctx.strokeStyle=pC; ctx.lineWidth=4.5; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(sx+sw*0.5,signY+sh); ctx.lineTo(sx+sw*0.5,signY); ctx.stroke();
  ctx.fillStyle=period==='night'?'#26200e':'#645028';
  if (ctx.roundRect) ctx.roundRect(sx+2,signY+1,sw-4,27,5); else ctx.rect(sx+2,signY+1,sw-4,27);
  ctx.fill();
  ctx.fillStyle=period==='night'?'#aaa090':'#ffe8c0';
  ctx.font='bold 7.5px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('← Тропа',sx+sw*0.5,signY+14);
}

function _fm_wind(ctx, t, W, H, period) {
  ctx.save(); ctx.globalAlpha=period==='night'?0.10:0.18;
  ctx.strokeStyle='rgba(195,210,220,0.80)'; ctx.lineWidth=1.2; ctx.lineCap='round';
  for (const w of _fmWindPool) {
    const px=((w.x+t*w.spd)%(W+50))-25;
    const py=w.y+Math.sin(t*1.3+w.phase)*10;
    ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px-w.len,py+w.len*0.07); ctx.stroke();
  }
  ctx.restore();
}

function _fm_zoneLabel(ctx, W, H, period) {
  const bw=192, bh=23, bx=W*0.5-bw*0.5, by=13;
  ctx.fillStyle='rgba(8,6,4,0.72)';
  if (ctx.roundRect) ctx.roundRect(bx,by,bw,bh,6); else ctx.rect(bx,by,bw,bh);
  ctx.fill();
  ctx.fillStyle=period==='night'?'#aab6ca':'#ffe8be';
  ctx.font='bold 11px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('🌸 Цветочная горная поляна', W*0.5, by+bh*0.5);
}

function drawFlowerMeadowScene(ctx, { px, py, t, period, mtn, cw, ch }) {
  const W = 600;
  const rawCamX = Math.max(0, Math.min(Math.max(0, W - cw), px - cw * 0.5));
  const offsetX = W < cw ? (cw - W) * 0.5 : 0;
  ctx.save();
  ctx.translate(-rawCamX + offsetX, 0);

  _fm_sky(ctx, W, ch, period);
  if (period === 'night') _fm_stars(ctx, t, W, ch);
  else if (period === 'day' || period === 'morning') _fm_sunbeams(ctx, t, W, ch);

  _fm_ground(ctx, W, ch, period);
  _fm_trees(ctx, W, ch, period, t);
  _fm_grass(ctx, t, W, ch, period);
  _fm_moss(ctx, W, ch, period);
  _fm_flowers(ctx, t, W, ch, period);
  _fm_stream(ctx, t, W, ch, period);
  _fm_smallStones(ctx, W, ch, period);
  _fm_petals(ctx, t, W, ch, period);

  const szState = mtn.subZoneState.flowerMeadow;
  _fm_butterflies(ctx, t, szState);
  _fm_pickups(ctx, t, szState, W, ch);
  if (period === 'night') _fm_fireflies(ctx, t, W, ch);
  _fm_exitSign(ctx, period, ch);

  if (typeof drawCat === 'function') {
    drawCat(ctx, { x: px, y: py * (ch / 400), t, facing: mtn.facing, moving: mtn.isMoving, food: 80, mood: 88 });
  }

  _fm_wind(ctx, t, W, ch, period);
  _fm_zoneLabel(ctx, W, ch, period);

  if (mtn.fadeAlpha > 0) {
    ctx.fillStyle = `rgba(0,0,0,${mtn.fadeAlpha})`;
    ctx.fillRect(-offsetX + rawCamX - 10, 0, cw + 20, ch);
  }
  ctx.restore();
}

if (typeof ITEMS !== 'undefined') Object.assign(ITEMS, FLOWER_MEADOW_ITEMS);
