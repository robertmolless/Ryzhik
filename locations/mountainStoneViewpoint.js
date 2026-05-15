'use strict';

const STONE_VIEWPOINT_ITEMS = {
  oldBell:    { id:'oldBell',    name:'Старый колокольчик', icon:'🔔', desc:'Ржавый колокольчик с горной обзорной площадки. Тихо позванивает.',  rare:true  },
  tinyLantern:{ id:'tinyLantern',name:'Маленький фонарик',  icon:'🔦', desc:'Карманный фонарик, найденный на краю скалы.',                       rare:false },
};

const STONE_VIEWPOINT_OBJECTS = [
  { id:'sv_exit',      x:38,  y:228, w:55,  h:70,  type:'trail_sign', label:'← Вернуться к горной тропе', action:'exit_subzone',   blocking:false },
  { id:'sv_boulder1',  x:350, y:148, w:78,  h:62,  type:'boulder',    label:'🪨 Большой валун',            action:'examine',        blocking:true  },
  { id:'sv_boulder2',  x:450, y:128, w:68,  h:56,  type:'boulder',    label:'🪨 Сросшиеся камни',         action:'examine',        blocking:true  },
  { id:'sv_rock1',     x:86,  y:246, w:52,  h:40,  type:'rock',       label:null,                          action:null,             blocking:true  },
  { id:'sv_rock2',     x:516, y:254, w:50,  h:38,  type:'rock',       label:null,                          action:null,             blocking:true  },
  { id:'sv_rock3',     x:130, y:130, w:42,  h:34,  type:'rock',       label:null,                          action:null,             blocking:true  },
  { id:'sv_bench',     x:242, y:218, w:84,  h:36,  type:'bench',      label:'🪵 Лавочка',                  action:'sit',            blocking:false },
  { id:'sv_flags',     x:192, y:154, w:215, h:22,  type:'flags',      label:'🎌 Флажки',                   action:'touch_flags',    blocking:false },
  { id:'sv_oldSign',   x:152, y:176, w:50,  h:64,  type:'sign',       label:'🪵 Старый указатель',         action:'examine',        blocking:false },
  { id:'sv_campfire',  x:406, y:236, w:54,  h:50,  type:'campfire',   label:'🔥 Небольшой костёр',         action:'examine',        blocking:false },
  { id:'sv_viewDown',  x:228, y:132, w:82,  h:48,  type:'viewpoint',  label:'🌅 Посмотреть вниз',          action:'camera_scene',   blocking:false },
  { id:'sv_lantern',   x:334, y:202, w:40,  h:50,  type:'lantern',    label:'🔦 Зажечь фонарь',            action:'light_lantern',  blocking:false },
  { id:'sv_bell',      x:396, y:226, w:32,  h:26,  type:'bell',       label:'🔔 Старый колокольчик',       action:'pickup', item:'oldBell',     blocking:false },
  { id:'sv_lanternPick',x:140,y:196, w:32,  h:30,  type:'lantern_p',  label:'🔦 Маленький фонарик',        action:'pickup', item:'tinyLantern', blocking:false },
  { id:'sv_smoothSt',  x:298, y:278, w:30,  h:24,  type:'smooth_s',   label:'🪨 Гладкий камень',           action:'pickup', item:'smoothStone', blocking:false },
];

const _svWindPool = Array.from({ length: 14 }, (_, i) => ({
  x: (i * 42 + 20) % 640,
  y: 40 + (i * 27) % 240,
  len: 18 + (i % 4) * 5,
  phase: (i * 0.85) % (Math.PI * 2),
  spd: 42 + (i % 6) * 6,
}));

function _sv_sky(ctx, W, H, period) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (period === 'morning')      { g.addColorStop(0,'#4a6890'); g.addColorStop(0.45,'#82a8c8'); g.addColorStop(1,'#b8d2e8'); }
  else if (period === 'evening') { g.addColorStop(0,'#241a48'); g.addColorStop(0.45,'#724058'); g.addColorStop(1,'#c07258'); }
  else if (period === 'night')   { g.addColorStop(0,'#020408'); g.addColorStop(0.5,'#080c1e'); g.addColorStop(1,'#10122a'); }
  else                           { g.addColorStop(0,'#305888'); g.addColorStop(0.45,'#5e90b8'); g.addColorStop(1,'#90bcd8'); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function _sv_stars(ctx, t, W, H) {
  ctx.save();
  for (let i = 0; i < 40; i++) {
    const sx = (i * 157 % W), sy = (i * 101 % (H * 0.42));
    const a  = 0.30 + 0.60 * Math.sin(t * 1.05 + i * 0.62);
    ctx.globalAlpha = a;
    ctx.fillStyle = i % 8 === 0 ? '#ffe080' : i % 5 === 0 ? '#c8d8ff' : '#ffffff';
    ctx.beginPath(); ctx.arc(sx, sy, i % 9 === 0 ? 1.8 : 1.1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.restore();
}

function _sv_moon(ctx, W, H) {
  const mx=W*0.80, my=H*0.08, mr=16;
  ctx.save();
  const mg = ctx.createRadialGradient(mx, my, 0, mx, my, mr*2.5);
  mg.addColorStop(0,'rgba(215,222,255,0.16)'); mg.addColorStop(1,'rgba(215,222,255,0)');
  ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr*2.5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(225,232,255,0.85)'; ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(200,210,245,0.22)'; ctx.beginPath(); ctx.arc(mx-4, my-4, 5, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function _sv_clouds(ctx, t, W, H, period) {
  if (period === 'night') return;
  ctx.save(); ctx.globalAlpha = 0.42;
  [{ bx:0.08, by:H*0.12, r:30, spd:6.5, ph:0 },{ bx:W*0.44, by:H*0.09, r:22, spd:4.5, ph:W*0.4 },{ bx:W*0.72, by:H*0.15, r:26, spd:5.8, ph:W*0.2 }].forEach(c => {
    const x = ((c.bx + t * c.spd) % (W + 180)) - 90;
    ctx.fillStyle = period === 'evening' ? 'rgba(210,158,170,0.55)' : 'rgba(205,220,235,0.58)';
    ctx.beginPath();
    ctx.arc(x, c.by, c.r, 0, Math.PI*2);
    ctx.arc(x+c.r*0.82, c.by-c.r*0.18, c.r*0.72, 0, Math.PI*2);
    ctx.arc(x-c.r*0.72, c.by-c.r*0.14, c.r*0.62, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.restore();
}

function _sv_distantLandscape(ctx, W, H, period) {
  const haze = period === 'night' ? 'rgba(12,12,28,0.72)' : period === 'evening' ? 'rgba(58,28,60,0.50)' : 'rgba(82,100,140,0.40)';
  const ridge= period === 'night' ? 'rgba(10,10,24,0.78)' : period === 'evening' ? 'rgba(42,18,46,0.60)' : 'rgba(62,80,115,0.50)';

  ctx.fillStyle = haze;
  ctx.beginPath(); ctx.moveTo(0, H*0.42);
  [[0.12,0.25],[0.24,0.16],[0.38,0.28],[0.52,0.14],[0.66,0.26],[0.80,0.17],[0.93,0.29],[1,0.24],[1,0.42]].forEach(([rx,ry]) => ctx.lineTo(W*rx, H*ry));
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = ridge;
  ctx.beginPath(); ctx.moveTo(0, H*0.56);
  [[0.15,0.40],[0.28,0.46],[0.42,0.34],[0.56,0.44],[0.70,0.36],[0.84,0.44],[0.96,0.38],[1,0.42],[1,0.56]].forEach(([rx,ry]) => ctx.lineTo(W*rx, H*ry));
  ctx.closePath(); ctx.fill();

  if (period !== 'night') {
    ctx.save(); ctx.globalAlpha = 0.22;
    ctx.fillStyle = 'rgba(245,230,195,1)';
    const houseX = W*0.28, houseY = H*0.59, houseW=18, houseH=12;
    ctx.fillRect(houseX, houseY, houseW, houseH);
    ctx.fillStyle = 'rgba(180,60,50,0.5)';
    ctx.beginPath(); ctx.moveTo(houseX-2, houseY); ctx.lineTo(houseX+houseW*0.5, houseY-8); ctx.lineTo(houseX+houseW+2, houseY); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.10;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#3a5228';
      ctx.beginPath(); ctx.moveTo(houseX-28+i*18, houseY+2); ctx.lineTo(houseX-22+i*18, houseY-14); ctx.lineTo(houseX-16+i*18, houseY+2); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  if (period === 'night') {
    ctx.save(); ctx.globalAlpha = 0.35;
    ctx.fillStyle='#ffe880'; ctx.beginPath(); ctx.arc(W*0.28+5, H*0.60, 2, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1; ctx.restore();
  }
}

function _sv_panoramaHaze(ctx, t, W, H, period) {
  const alpha = period === 'morning' ? 0.18 : period === 'evening' ? 0.12 : 0.06;
  if (alpha < 0.03) return;
  ctx.save(); ctx.globalAlpha = alpha;
  const hc = period === 'evening' ? 'rgba(180,120,100,1)' : 'rgba(190,205,225,1)';
  [[0.14,0.54,0.22,0.052,0.0],[0.46,0.50,0.25,0.044,1.6],[0.74,0.53,0.18,0.040,3.0]].forEach(([bx,by,rx,ry,ph]) => {
    const ox = Math.sin(t*0.28+ph)*10;
    ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(W*bx+ox, H*by, W*rx, H*ry, 0, 0, Math.PI*2); ctx.fill();
  });
  ctx.restore();
}

function _sv_ground(ctx, W, H, period) {
  const gTop = period === 'night' ? '#141820' : period === 'evening' ? '#2a3030' : '#3a4838';
  const gBot = period === 'night' ? '#0c1018' : period === 'evening' ? '#1c2022' : '#282e28';
  const pC   = period === 'night' ? '#181c22' : period === 'evening' ? '#303840' : '#484e58';
  const g = ctx.createLinearGradient(0, H*0.52, 0, H);
  g.addColorStop(0, gTop); g.addColorStop(1, gBot);
  ctx.fillStyle = g; ctx.fillRect(0, H*0.52, W, H*0.48);
  ctx.fillStyle = pC;
  [[0.12,0.62,72,14],[0.42,0.70,90,16],[0.72,0.66,82,15],[0.88,0.74,65,12]].forEach(([bx,by,rw,rh]) => {
    ctx.beginPath(); ctx.ellipse(W*bx, H*by, rw, rh, 0.14, 0, Math.PI*2); ctx.fill();
  });
}

function _sv_platform(ctx, W, H, period) {
  const pC = period === 'night' ? '#20223a' : period === 'evening' ? '#3a3858' : '#585878';
  const eC = period === 'night' ? '#181a30' : period === 'evening' ? '#2e2c4a' : '#484868';
  const rC = period === 'night' ? '#3a384e' : period === 'evening' ? '#5a5870' : '#787898';
  ctx.fillStyle = pC;
  ctx.beginPath();
  ctx.moveTo(W*0.15, H*0.56); ctx.lineTo(W*0.85, H*0.56);
  ctx.lineTo(W*0.90, H*0.48); ctx.lineTo(W*0.10, H*0.48);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = eC;
  ctx.beginPath(); ctx.moveTo(W*0.10, H*0.48); ctx.lineTo(W*0.20, H*0.33); ctx.lineTo(W*0.80, H*0.33); ctx.lineTo(W*0.90, H*0.48); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rC; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W*0.22, H*0.35); ctx.lineTo(W*0.78, H*0.35); ctx.stroke();
  for (let rx = W*0.24; rx <= W*0.76; rx += 25) { ctx.beginPath(); ctx.moveTo(rx, H*0.35); ctx.lineTo(rx, H*0.48); ctx.stroke(); }
}

function _sv_boulders(ctx, W, H, period) {
  const base = period === 'night' ? '#1a1c2e' : period === 'evening' ? '#342e4a' : '#585875';
  const hi   = period === 'night' ? '#20223a' : period === 'evening' ? '#42406a' : '#727290';
  const shadow='rgba(0,0,0,0.22)';
  [[W*0.62,H*0.48,78,60],[W*0.77,H*0.44,68,54],[W*0.24,H*0.52,42,34],[W*0.52,H*0.54,28,22]].forEach(([bx,by,rw,rh]) => {
    ctx.fillStyle = shadow; ctx.beginPath(); ctx.ellipse(bx, by+rh*0.55, rw*0.88, rh*0.22, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = base;   ctx.beginPath(); ctx.ellipse(bx, by, rw, rh, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = hi;     ctx.beginPath(); ctx.ellipse(bx-rw*0.24, by-rh*0.28, rw*0.26, rh*0.18, -0.35, 0, Math.PI*2); ctx.fill();
    const crack = period === 'night' ? 'rgba(0,0,0,0.18)' : 'rgba(30,28,48,0.15)';
    ctx.strokeStyle = crack; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(bx-rw*0.12, by-rh*0.30); ctx.lineTo(bx+rw*0.08, by+rh*0.18); ctx.stroke();
  });
}

function _sv_bench(ctx, W, H, period, szState) {
  const bx=W*0.42, by=H*0.54, bw=84, bh=14;
  const wT = period === 'night' ? '#36280e' : '#886028';
  const wS = period === 'night' ? '#261c08' : '#684818';
  const leg= period === 'night' ? '#1e1408' : '#583810';
  const used = szState.benchUsed;
  ctx.fillStyle = wT; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = wS; ctx.fillRect(bx, by+bh, bw, 5);
  ctx.strokeStyle = wS; ctx.lineWidth = 1.4;
  [bx+22, bx+42, bx+62].forEach(lx => { ctx.beginPath(); ctx.moveTo(lx, by); ctx.lineTo(lx, by+bh); ctx.stroke(); });
  ctx.fillStyle = leg;
  [[bx+10, by+bh+5],[bx+bw-10, by+bh+5]].forEach(([lx,ly]) => ctx.fillRect(lx-3, ly, 6, 15));
  ctx.strokeStyle = period === 'night' ? '#282018' : '#9a7848'; ctx.lineWidth = 1.4; ctx.setLineDash([4,3]);
  ctx.beginPath(); ctx.moveTo(bx+14, by-8); ctx.bezierCurveTo(bx+28, by-19, bx+54, by-15, bx+bw-14, by-7); ctx.stroke();
  ctx.setLineDash([]);
  if (used) {
    ctx.save(); ctx.globalAlpha = 0.36; ctx.font = '18px serif'; ctx.textAlign = 'center';
    ctx.fillText('🐱', bx+bw*0.5, by-6); ctx.restore();
  }
}

function _sv_flagRopes(ctx, t, W, H, period) {
  const pC = period === 'night' ? '#28200e' : '#685820';
  const rC = period === 'night' ? 'rgba(68,56,28,0.72)' : 'rgba(138,115,52,0.82)';
  const poles = [W*0.32, W*0.48, W*0.64];
  const pY = H * 0.46, pH = H * 0.10;
  ctx.fillStyle = pC;
  poles.forEach(px => { ctx.fillRect(px-3, pY-pH, 5, pH); });
  ctx.strokeStyle = rC; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < poles.length; i++) {
    const sag = Math.sin(t*0.62+i*0.88)*2+5;
    if (i===0) ctx.moveTo(poles[i], pY-pH+4);
    else { const mx=(poles[i-1]+poles[i])*0.5; ctx.quadraticCurveTo(mx, pY-pH+4+sag, poles[i], pY-pH+4); }
  }
  ctx.stroke();
  const colors=['#e04040','#40a0e0','#e0c030','#60d060','#e060c0'];
  for (let s=0; s<poles.length-1; s++) {
    for (let f=0; f<4; f++) {
      const t0=f/4+0.02, t1=t0+0.10;
      const ix=poles[s]*(1-t0)+poles[s+1]*t0, iy=pY-pH+4+(t0*(1-t0))*20;
      const fx=poles[s]*(1-t0)+poles[s+1]*t0, fy=iy;
      const fw=Math.cos(t*(1.4+f*0.2))*1.8+6, fh=7;
      const ang=Math.sin(t*(0.9+f*0.15)+s+f)*0.22;
      ctx.save(); ctx.translate(ix, iy); ctx.rotate(ang);
      ctx.fillStyle = colors[(s*4+f)%colors.length];
      ctx.fillRect(-fw*0.5, 0, fw, fh);
      ctx.restore();
    }
  }
}

function _sv_oldSign(ctx, W, H, period) {
  const sx=W*0.26, sy=H*0.44, sw=50, sh=62;
  const pC = period === 'night' ? '#2c1e12' : '#6a4c22';
  ctx.strokeStyle = pC; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(sx+sw*0.5, sy+sh); ctx.lineTo(sx+sw*0.5, sy); ctx.stroke();
  const bC = period === 'night' ? '#22180c' : '#5a4020';
  ctx.fillStyle = bC;
  if (ctx.roundRect) ctx.roundRect(sx, sy+5, sw, 26, 4); else ctx.rect(sx, sy+5, sw, 26);
  ctx.fill();
  ctx.strokeStyle = period === 'night' ? '#3c2c1a' : '#8a6038'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = period === 'night' ? '#887060' : '#d4a060';
  ctx.font = 'bold 7px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('⛰️', sx+sw*0.5, sy+12);
  ctx.fillText('?', sx+sw*0.5, sy+22);
}

function _sv_campfire(ctx, t, W, H, period) {
  const cx=W*0.69, cy=H*0.56;
  ctx.save();
  ctx.strokeStyle = period==='night'?'#381808':'#5a2e10'; ctx.lineWidth=4; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(cx-13, cy+7); ctx.lineTo(cx+8, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+13, cy+7); ctx.lineTo(cx-8, cy); ctx.stroke();
  ctx.fillStyle='#e03800'; ctx.beginPath(); ctx.arc(cx,cy+4,6,0,Math.PI*2); ctx.fill();
  const f1=Math.sin(t*8.2)*0.14+0.86, f2=Math.sin(t*11+1)*0.12+0.88;
  [[0,20,'#ff6600',7,f2],[0,26,'#ff8800',5.5,f1],[0,32,'#ffc800',4,f1*0.92]].forEach(([ox,h,c,r,fl]) => {
    ctx.fillStyle=c; ctx.globalAlpha=fl*0.9;
    ctx.beginPath(); ctx.ellipse(cx+ox, cy-h*fl, r, h*fl*0.50, 0, 0, Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha=1;
  const grd=ctx.createRadialGradient(cx,cy,2,cx,cy,36);
  grd.addColorStop(0,'rgba(255,110,0,0.22)'); grd.addColorStop(1,'rgba(255,75,0,0)');
  ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(cx,cy,36,0,Math.PI*2); ctx.fill();
  if (period!=='day') {
    ctx.strokeStyle='rgba(195,195,195,0.16)'; ctx.lineWidth=2.5;
    const sm=Math.sin(t*1.6)*7;
    ctx.beginPath(); ctx.moveTo(cx,cy-20); ctx.bezierCurveTo(cx+sm,cy-34,cx-sm,cy-48,cx+sm*0.5,cy-60); ctx.stroke();
  }
  ctx.restore();
}

function _sv_lantern(ctx, W, H, period, szState) {
  const lx=W*0.57, ly=H*0.51;
  const on = szState.lanternOn || (period==='evening'||period==='night');
  const pC = period==='night'?'#282018':'#685840';
  ctx.save();
  ctx.strokeStyle=pC; ctx.lineWidth=2; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(lx, ly-28); ctx.lineTo(lx, ly); ctx.stroke();
  ctx.fillStyle = on ? '#c09040' : (period==='night'?'#1e1a10':'#484030');
  ctx.beginPath(); ctx.rect(lx-10, ly-22, 20, 20); ctx.fill();
  ctx.strokeStyle=period==='night'?'#3e3020':'#887050'; ctx.lineWidth=1.5; ctx.stroke();
  if (on) {
    const lg=ctx.createRadialGradient(lx,ly-12,0,lx,ly-12,40);
    lg.addColorStop(0,'rgba(255,200,80,0.28)'); lg.addColorStop(1,'rgba(255,200,80,0)');
    ctx.fillStyle=lg; ctx.beginPath(); ctx.arc(lx,ly-12,40,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,220,100,0.72)';
    ctx.beginPath(); ctx.arc(lx,ly-12,5,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function _sv_pickups(ctx, t, szState, W, H) {
  const glow=0.5+0.5*Math.sin(t*3.0);
  const items=[
    { id:'sv_bell',        x:W*0.66, y:H*0.58, emoji:'🔔', shadow:'#b08838' },
    { id:'sv_lanternPick', x:W*0.24, y:H*0.49, emoji:'🔦', shadow:'#8898a8' },
    { id:'sv_smoothSt',    x:W*0.50, y:H*0.68, emoji:'🪨', shadow:'#a0a0b0' },
    { id:'mq_ribbon_sv',   x:W*0.71, y:H*0.42, emoji:'🎀', shadow:'#e06080' },
  ];
  items.forEach(p => {
    if (szState.pickedItems.has(p.id)) return;
    ctx.save(); ctx.shadowColor=p.shadow; ctx.shadowBlur=9+glow*6;
    ctx.font='20px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(p.emoji,p.x,p.y); ctx.restore();
  });
}

function _sv_exitSign(ctx, period, ch) {
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

function _sv_wind(ctx, t, W, H, period) {
  ctx.save(); ctx.globalAlpha=period==='night'?0.18:0.30;
  ctx.strokeStyle='rgba(200,215,230,0.88)'; ctx.lineWidth=1.4; ctx.lineCap='round';
  for (const w of _svWindPool) {
    const px=((w.x+t*w.spd)%(W+60))-30;
    const py=w.y+Math.sin(t*1.35+w.phase)*12;
    ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px-w.len,py+w.len*0.08); ctx.stroke();
  }
  ctx.restore();
}

function _sv_zoneLabel(ctx, W, H, period) {
  const bw=200, bh=23, bx=W*0.5-bw*0.5, by=13;
  ctx.fillStyle='rgba(8,6,4,0.74)';
  if (ctx.roundRect) ctx.roundRect(bx,by,bw,bh,6); else ctx.rect(bx,by,bw,bh);
  ctx.fill();
  ctx.fillStyle=period==='night'?'#aab6ca':'#ffe8be';
  ctx.font='bold 10.5px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('🪨 Каменная обзорная площадка', W*0.5, by+bh*0.5);
}

function _sv_valleyFireflies(ctx, t, W, H) {
  ctx.save();
  for (let i=0; i<10; i++) {
    const fx=W*(0.05+i*0.09+(Math.sin(t*0.38+i*1.2))*0.03);
    const fy=H*(0.60+Math.cos(t*0.30+i*0.8)*0.04);
    const fa=0.25+0.55*Math.sin(t*2.2+i*0.9);
    ctx.globalAlpha=fa;
    ctx.fillStyle='#c8e888';
    ctx.beginPath(); ctx.arc(fx,fy,1.8,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1; ctx.restore();
}

function drawStoneViewpointScene(ctx, { px, py, t, period, mtn, cw, ch }) {
  const W = 600;
  const rawCamX = Math.max(0, Math.min(Math.max(0, W - cw), px - cw * 0.5));
  const offsetX = W < cw ? (cw - W) * 0.5 : 0;
  ctx.save();
  ctx.translate(-rawCamX + offsetX, 0);

  _sv_sky(ctx, W, ch, period);
  if (period === 'night') { _sv_stars(ctx, t, W, ch); _sv_moon(ctx, W, ch); }
  _sv_clouds(ctx, t, W, ch, period);
  _sv_distantLandscape(ctx, W, ch, period);
  _sv_panoramaHaze(ctx, t, W, ch, period);
  _sv_ground(ctx, W, ch, period);
  _sv_platform(ctx, W, ch, period);
  _sv_boulders(ctx, W, ch, period);
  _sv_flagRopes(ctx, t, W, ch, period);
  _sv_oldSign(ctx, W, ch, period);

  const szState = mtn.subZoneState.stoneViewpoint;
  _sv_bench(ctx, W, ch, period, szState);
  _sv_campfire(ctx, t, W, ch, period);
  _sv_lantern(ctx, W, ch, period, szState);
  _sv_pickups(ctx, t, szState, W, ch);
  if (period === 'night') _sv_valleyFireflies(ctx, t, W, ch);
  _sv_exitSign(ctx, period, ch);

  if (typeof drawCat === 'function') {
    drawCat(ctx, { x: px, y: py * (ch / 400), t, moving: mtn.isMoving, food: 80, mood: 88 });
  }

  _sv_wind(ctx, t, W, ch, period);
  _sv_zoneLabel(ctx, W, ch, period);

  if (mtn.fadeAlpha > 0) {
    ctx.fillStyle = `rgba(0,0,0,${mtn.fadeAlpha})`;
    ctx.fillRect(-offsetX + rawCamX - 10, 0, cw + 20, ch);
  }
  ctx.restore();
}

if (typeof ITEMS !== 'undefined') Object.assign(ITEMS, STONE_VIEWPOINT_ITEMS);
