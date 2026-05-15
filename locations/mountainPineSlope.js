'use strict';

const PINE_SLOPE_ITEMS = {
  pineCone:        { id:'pineCone',        name:'Сосновая шишка',   icon:'🌲', desc:'Упала с высокой сосны на склоне. Пахнет смолой и хвоей.',      rare:false },
  silverLeaf:      { id:'silverLeaf',      name:'Серебристый лист', icon:'🍃', desc:'Лист с серебристым отливом. Горный сувенир.',                  rare:false },
  mountainFeather: { id:'mountainFeather', name:'Горное перышко',   icon:'🪶', desc:'Лёгкое перышко, найденное в тайнике у корней старой сосны.',   rare:true  },
};

const PINE_SLOPE_OBJECTS = [
  { id:'ps_exit',   x:38,  y:228, w:55,  h:70,  type:'trail_sign',  label:'← Вернуться к горной тропе', action:'exit_subzone',  blocking:false },
  { id:'ps_pine1',  x:268, y:98,  w:62,  h:118, type:'pine_trunk',  label:'🌲 Старая сосна',             action:'examine',       blocking:false },
  { id:'ps_pine2',  x:386, y:82,  w:58,  h:128, type:'pine_trunk',  label:'🌲 Раскидистая сосна',        action:'examine',       blocking:false },
  { id:'ps_pine3',  x:152, y:126, w:52,  h:112, type:'pine_trunk',  label:'🌲 Молодая сосна',            action:'examine',       blocking:false },
  { id:'ps_fence_l', x:178, y:186, w:68,  h:14,  type:'rope_fence',  label:null,                          action:null,            blocking:true  },
  { id:'ps_fence_r', x:336, y:186, w:86,  h:14,  type:'rope_fence',  label:null,                          action:null,            blocking:true  },
  { id:'ps_rock1',  x:88,  y:256, w:50,  h:38,  type:'rock',        label:null,                          action:null,            blocking:true  },
  { id:'ps_rock2',  x:515, y:240, w:52,  h:40,  type:'rock',        label:null,                          action:null,            blocking:true  },
  { id:'ps_rock3',  x:155, y:308, w:30,  h:22,  type:'rock',        label:null,                          action:null,            blocking:true  },
  { id:'ps_rock4',  x:488, y:178, w:28,  h:20,  type:'rock',        label:null,                          action:null,            blocking:true  },
  { id:'ps_cone1',  x:218, y:278, w:32,  h:24,  type:'pinecone',    label:'🌲 Сосновая шишка',           action:'pickup', item:'pineCone',       blocking:false },
  { id:'ps_cone2',  x:462, y:298, w:32,  h:24,  type:'pinecone',    label:'🌲 Сосновая шишка',           action:'pickup', item:'pineCone',       blocking:false },
  { id:'ps_leaf',   x:342, y:248, w:28,  h:20,  type:'silver_leaf', label:'🍃 Серебристый лист',         action:'pickup', item:'silverLeaf',     blocking:false },
  { id:'ps_cache',  x:295, y:288, w:52,  h:38,  type:'cache',       label:'🕳️ Тайник у корней',         action:'open_cache',    blocking:false },
  { id:'ps_wind',   x:195, y:175, w:80,  h:60,  type:'wind_area',   label:'🌬️ Послушать ветер',         action:'listen_wind',   blocking:false },
  { id:'ps_path',   x:432, y:222, w:68,  h:48,  type:'narrow_path', label:'🥾 Узкая тропа',              action:'walk_path',     blocking:false },
];

const _psWindPool = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 34 + 10) % 620,
  y: 55 + (i * 23) % 260,
  len: 14 + (i % 5) * 3,
  phase: (i * 0.72) % (Math.PI * 2),
  spd: 36 + (i % 7) * 5,
}));

function _ps_sky(ctx, W, H, period) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (period === 'morning')      { g.addColorStop(0,'#4e6e96'); g.addColorStop(0.5,'#88aec6'); g.addColorStop(1,'#bcd6e6'); }
  else if (period === 'evening') { g.addColorStop(0,'#2e2252'); g.addColorStop(0.5,'#7a4858'); g.addColorStop(1,'#be7e5e'); }
  else if (period === 'night')   { g.addColorStop(0,'#040610'); g.addColorStop(0.5,'#0e1022'); g.addColorStop(1,'#16182e'); }
  else                           { g.addColorStop(0,'#385e96'); g.addColorStop(0.5,'#6696be'); g.addColorStop(1,'#9ec6de'); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function _ps_stars(ctx, t, W, H) {
  ctx.save();
  for (let i = 0; i < 35; i++) {
    const sx = (i * 179 % W), sy = (i * 113 % (H * 0.40));
    const a  = 0.35 + 0.55 * Math.sin(t * 1.1 + i * 0.68);
    ctx.globalAlpha = a;
    ctx.fillStyle = i % 5 === 0 ? '#ffe8a0' : '#ffffff';
    ctx.beginPath(); ctx.arc(sx, sy, i % 7 === 0 ? 1.6 : 1.1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.restore();
}

function _ps_distantPeaks(ctx, W, H, period) {
  const base = period === 'night' ? 'rgba(16,14,30,0.68)' : period === 'evening' ? 'rgba(68,30,68,0.52)' : 'rgba(88,108,148,0.44)';
  const snow = period === 'night' ? 'rgba(165,168,200,0.38)' : period === 'evening' ? 'rgba(185,148,168,0.55)' : 'rgba(215,228,240,0.68)';
  ctx.fillStyle = base;
  ctx.beginPath(); ctx.moveTo(0, H * 0.44);
  [[0.10,0.20],[0.22,0.10],[0.35,0.24],[0.50,0.08],[0.64,0.22],[0.78,0.12],[0.90,0.26],[1.0,0.18],[1,0.44]].forEach(([rx,ry]) => ctx.lineTo(W*rx, H*ry));
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = snow;
  [[0.22,0.10,0.055],[0.50,0.08,0.060],[0.78,0.12,0.050]].forEach(([rx,ry,w]) => {
    ctx.beginPath(); ctx.moveTo(W*rx, H*ry); ctx.lineTo(W*(rx-w), H*(ry+0.052)); ctx.lineTo(W*(rx+w), H*(ry+0.052)); ctx.closePath(); ctx.fill();
  });
}

function _ps_ground(ctx, W, H, period) {
  const gTop = period === 'night' ? '#121a0c' : period === 'evening' ? '#2e381c' : '#3a5226';
  const gBot = period === 'night' ? '#090e06' : period === 'evening' ? '#1e2810' : '#263e16';
  const g = ctx.createLinearGradient(0, H * 0.52, 0, H);
  g.addColorStop(0, gTop); g.addColorStop(1, gBot);
  ctx.fillStyle = g; ctx.fillRect(0, H * 0.52, W, H * 0.48);
  const nc = period === 'night' ? 'rgba(16,20,10,0.68)' : 'rgba(36,50,16,0.50)';
  ctx.fillStyle = nc;
  [[0.16,0.62,108,13],[0.40,0.68,88,11],[0.63,0.65,98,12],[0.84,0.72,78,10]].forEach(([bx,by,rw,rh]) => {
    ctx.beginPath(); ctx.ellipse(W*bx, H*by, rw, rh, -0.12, 0, Math.PI*2); ctx.fill();
  });
}

function _ps_path(ctx, W, H, period) {
  const pc = period === 'night' ? '#2e2420' : period === 'evening' ? '#5e4e3e' : '#8e7858';
  const ec = period === 'night' ? 'rgba(56,36,28,0.38)' : 'rgba(136,106,68,0.33)';
  ctx.strokeStyle = pc; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(W * 0.10, H * 0.96);
  ctx.bezierCurveTo(W * 0.16, H * 0.80, W * 0.24, H * 0.71, W * 0.32, H * 0.61);
  ctx.bezierCurveTo(W * 0.40, H * 0.52, W * 0.52, H * 0.48, W * 0.60, H * 0.45);
  ctx.bezierCurveTo(W * 0.70, H * 0.43, W * 0.78, H * 0.39, W * 0.80, H * 0.36);
  ctx.stroke();
  ctx.strokeStyle = ec; ctx.lineWidth = 13; ctx.setLineDash([10,8]); ctx.stroke(); ctx.setLineDash([]);
}

function _ps_fog(ctx, t, W, H, period) {
  const alpha = period === 'morning' ? 0.26 : period === 'night' ? 0.18 : 0.10;
  if (alpha < 0.04) return;
  const fc = period === 'night' ? 'rgba(155,160,195,1)' : 'rgba(192,208,222,1)';
  ctx.save(); ctx.globalAlpha = alpha;
  [[0.08,0.50,0.23,0.054,0.0],[0.38,0.47,0.26,0.046,1.5],[0.66,0.52,0.20,0.045,3.1],[0.86,0.48,0.18,0.040,2.0]].forEach(([bx,by,rx,ry,ph]) => {
    const ox = Math.sin(t * 0.31 + ph) * 12;
    ctx.fillStyle = fc; ctx.beginPath(); ctx.ellipse(W*bx+ox, H*by, W*rx, H*ry, 0, 0, Math.PI*2); ctx.fill();
  });
  ctx.restore();
}

function _ps_onePine(ctx, x, y, h, w, period, t, ph) {
  const trunk = period === 'night' ? '#18120a' : '#482e10';
  const c0    = period === 'night' ? '#0e1808' : period === 'evening' ? '#253020' : '#2d5126';
  const c1    = period === 'night' ? '#141e0c' : period === 'evening' ? '#333e28' : '#396434';
  const c2    = period === 'night' ? '#1a2412' : period === 'evening' ? '#3e4c2e' : '#48753e';
  const wob   = Math.sin(t * 1.7 + ph) * 3.2;
  ctx.fillStyle = trunk; ctx.fillRect(x - 5, y + 2, 10, 16);
  for (let tier = 0; tier < 4; tier++) {
    const ty = y - h * (0.20 + tier * 0.22);
    const tw = w * (1.08 - tier * 0.23);
    const ox = wob * (tier * 0.28);
    ctx.fillStyle = tier < 2 ? c0 : tier === 2 ? c1 : c2;
    ctx.beginPath();
    ctx.moveTo(x + ox,          ty - h * 0.11);
    ctx.lineTo(x - tw*0.5 + ox*0.55, ty + h * 0.10);
    ctx.lineTo(x + tw*0.5 + ox*0.55, ty + h * 0.10);
    ctx.closePath(); ctx.fill();
    if (tier === 3) {
      const shadow = period === 'night' ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.10)';
      ctx.fillStyle = shadow;
      ctx.beginPath(); ctx.ellipse(x + ox*0.5, ty + h*0.10, tw*0.48, 5, 0, 0, Math.PI*2); ctx.fill();
    }
  }
}

function _ps_pines(ctx, W, H, period, t) {
  const trees = [
    { x:W*0.04, y:H*0.54, h:H*0.38, w:H*0.145, ph:0.0  },
    { x:W*0.10, y:H*0.51, h:H*0.42, w:H*0.155, ph:1.1  },
    { x:W*0.17, y:H*0.55, h:H*0.36, w:H*0.135, ph:2.2  },
    { x:W*0.26, y:H*0.46, h:H*0.46, w:H*0.165, ph:0.7  },
    { x:W*0.45, y:H*0.42, h:H*0.50, w:H*0.175, ph:1.8  },
    { x:W*0.64, y:H*0.40, h:H*0.52, w:H*0.178, ph:3.0  },
    { x:W*0.77, y:H*0.44, h:H*0.48, w:H*0.168, ph:2.5  },
    { x:W*0.88, y:H*0.52, h:H*0.37, w:H*0.138, ph:0.4  },
    { x:W*0.95, y:H*0.56, h:H*0.34, w:H*0.125, ph:1.6  },
  ];
  trees.forEach(p => _ps_onePine(ctx, p.x, p.y, p.h, p.w, period, t, p.ph));
}

function _ps_ropeFence(ctx, W, H, period, t) {
  const pC = period === 'night' ? '#28180e' : '#685022';
  const rC = period === 'night' ? 'rgba(68,48,28,0.72)' : 'rgba(138,98,52,0.80)';
  // Two fence sections with a clear 90px gap in the centre (x≈246–336)
  const leftPoles  = [W*0.30, W*0.41];          // 180, 246
  const rightPoles = [W*0.56, W*0.64, W*0.70];  // 336, 384, 420
  const pY = H * 0.52, pH = H * 0.09;

  ctx.fillStyle = pC;
  [...leftPoles, ...rightPoles].forEach(px => {
    ctx.fillRect(px-3, pY-pH, 5, pH);
    ctx.fillRect(px-5, pY-pH-3, 9, 5);
  });

  const drawSection = (poles) => {
    ctx.strokeStyle = rC; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    [0.28, 0.56].forEach(frac => {
      const ry = pY - pH * frac;
      ctx.beginPath();
      for (let i = 0; i < poles.length; i++) {
        const sag = Math.sin(t * 0.55 + i * 0.82) * 2.5 + 4;
        if (i === 0) ctx.moveTo(poles[i], ry);
        else { const mx = (poles[i-1]+poles[i])*0.5; ctx.quadraticCurveTo(mx, ry+sag, poles[i], ry); }
      }
      ctx.stroke();
    });
  };
  drawSection(leftPoles);
  drawSection(rightPoles);
}

function _ps_rocks(ctx, W, H, period) {
  const base = period === 'night' ? '#1c1e28' : period === 'evening' ? '#363040' : '#646070';
  const hi   = period === 'night' ? '#222430' : period === 'evening' ? '#464058' : '#848098';
  [[0.16,0.62,50,37],[0.56,0.72,46,34],[0.88,0.68,42,31],[0.37,0.75,28,20],[0.73,0.78,26,19]].forEach(([bx,by,rw,rh]) => {
    ctx.fillStyle = base; ctx.beginPath(); ctx.ellipse(W*bx, H*by, rw, rh, 0.18, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = hi;   ctx.beginPath(); ctx.ellipse(W*bx-rw*0.22, H*by-rh*0.28, rw*0.23, rh*0.17, 0, 0, Math.PI*2); ctx.fill();
  });
}

function _ps_smallStones(ctx, W, H, period) {
  const sc = period === 'night' ? '#252230' : '#787080';
  [[0.22,0.78,5,3.5],[0.35,0.82,4.5,2.8],[0.50,0.76,5.2,3.2],[0.63,0.80,4,2.5],[0.76,0.84,5.8,3.2]].forEach(([bx,by,rw,rh]) => {
    ctx.fillStyle = sc; ctx.beginPath(); ctx.ellipse(W*bx, H*by, rw, rh, 0.3, 0, Math.PI*2); ctx.fill();
  });
}

function _ps_mushrooms(ctx, W, H, period) {
  if (period === 'day') return;
  const cap = period === 'night' ? '#a03028' : '#c84030';
  const stem= period === 'night' ? '#a8a090' : '#d8d0b8';
  [[0.23,0.72],[0.55,0.76],[0.80,0.73]].forEach(([bx,by]) => {
    const mx=W*bx, my=H*by;
    ctx.fillStyle=stem; ctx.fillRect(mx-4,my-10,8,12);
    ctx.fillStyle=cap; ctx.beginPath(); ctx.ellipse(mx,my-10,13,8,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.ellipse(mx-3,my-13,4,2.5,-0.2,0,Math.PI*2); ctx.fill();
  });
}

function _ps_spiderwebs(ctx, W, H, period) {
  if (period === 'night') return;
  const wc = 'rgba(200,205,215,0.28)';
  [[W*0.27+2, H*0.46, 28],[W*0.47+2, H*0.42, 22]].forEach(([cx,cy,r]) => {
    ctx.strokeStyle = wc; ctx.lineWidth = 0.8;
    for (let i = 0; i < 6; i++) {
      const a = (i/6)*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r*0.65); ctx.stroke();
    }
    for (let ring = 1; ring <= 3; ring++) {
      const rr = r * ring * 0.33;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (i/6)*Math.PI*2;
        if (i===0) ctx.moveTo(cx+Math.cos(a)*rr, cy+Math.sin(a)*rr*0.65);
        else ctx.lineTo(cx+Math.cos(a)*rr, cy+Math.sin(a)*rr*0.65);
      }
      ctx.stroke();
    }
  });
}

function _ps_sunbeams(ctx, t, W, H, period) {
  if (period !== 'morning' && period !== 'day') return;
  ctx.save(); ctx.globalAlpha = period === 'morning' ? 0.10 : 0.06;
  const beams = [[W*0.26, 0, W*0.14, H*0.52],[W*0.46, 0, W*0.32, H*0.52],[W*0.68, 0, W*0.55, H*0.48]];
  beams.forEach(([x1,y1,x2,y2], i) => {
    const wob = Math.sin(t*0.55+i*1.2)*0.02;
    const g = ctx.createLinearGradient(x1,y1,x2,y2);
    g.addColorStop(0,'rgba(255,240,180,0.55)'); g.addColorStop(1,'rgba(255,240,180,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x1-18+wob*W, y1); ctx.lineTo(x1+18+wob*W, y1);
    ctx.lineTo(x2+35, y2);       ctx.lineTo(x2-35, y2);
    ctx.closePath(); ctx.fill();
  });
  ctx.restore();
}

function _ps_pickups(ctx, t, szState, W, H) {
  const glow = 0.5 + 0.5 * Math.sin(t * 3.0);
  const items = [
    { id:'ps_cone1',    x:W*0.36, y:H*0.68, emoji:'🌲', shadow:'#a06030' },
    { id:'ps_cone2',    x:W*0.77, y:H*0.72, emoji:'🌲', shadow:'#a06030' },
    { id:'ps_leaf',     x:W*0.57, y:H*0.62, emoji:'🍃', shadow:'#88bb88' },
    { id:'mq_ribbon_ps',x:W*0.54, y:H*0.60, emoji:'🎀', shadow:'#e06080' },
  ];
  items.forEach(p => {
    if (szState.pickedItems.has(p.id)) return;
    ctx.save(); ctx.shadowColor = p.shadow; ctx.shadowBlur = 9 + glow * 6;
    ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.emoji, p.x, p.y); ctx.restore();
  });
}

function _ps_cache(ctx, t, szState, W, H, period) {
  if (szState.cacheOpened) {
    const cc = period === 'night' ? '#1e1810' : '#3e2c1a';
    ctx.fillStyle = cc;
    ctx.beginPath(); ctx.ellipse(W*0.52, H*0.72, 20, 12, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = period === 'night' ? '#2e2418' : '#5e3e28'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(W*0.52-18, H*0.72); ctx.lineTo(W*0.52+18, H*0.72); ctx.stroke();
    return;
  }
  const glow = 0.5 + 0.5 * Math.sin(t * 2.3);
  const cc = period === 'night' ? '#28201a' : '#58402e';
  ctx.save();
  ctx.fillStyle = cc; ctx.beginPath(); ctx.ellipse(W*0.52, H*0.72+6, 22, 13, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = period === 'night' ? '#483a2a' : '#8a6042'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(W*0.52-20, H*0.72+6); ctx.lineTo(W*0.52+20, H*0.72+6); ctx.stroke();
  ctx.shadowColor = '#c07840'; ctx.shadowBlur = 7 + glow * 6;
  ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🕳️', W*0.52, H*0.72 - 14); ctx.restore();
}

function _ps_exitSign(ctx, period) {
  const sx=40, signY=230, sw=52, sh=68;
  const pC = period === 'night' ? '#382618' : '#785223';
  ctx.strokeStyle = pC; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(sx+sw*0.5, signY+sh); ctx.lineTo(sx+sw*0.5, signY); ctx.stroke();
  const bC = period === 'night' ? '#28200e' : '#685028';
  ctx.fillStyle = bC;
  if (ctx.roundRect) ctx.roundRect(sx+2, signY+1, sw-4, 27, 5); else ctx.rect(sx+2, signY+1, sw-4, 27);
  ctx.fill();
  ctx.strokeStyle = period === 'night' ? '#483820' : '#a87a48'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = period === 'night' ? '#aaa090' : '#ffe8c0';
  ctx.font = 'bold 7.5px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('← Тропа', sx+sw*0.5, signY+14);
}

function _ps_wind(ctx, t, W, H, period) {
  ctx.save(); ctx.globalAlpha = period === 'night' ? 0.15 : 0.28;
  ctx.strokeStyle = 'rgba(195,210,225,0.88)'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
  for (const w of _psWindPool) {
    const px = ((w.x + t * w.spd) % (W + 60)) - 30;
    const py = w.y + Math.sin(t * 1.4 + w.phase) * 11;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - w.len, py + w.len * 0.09); ctx.stroke();
  }
  ctx.restore();
}

function _ps_zoneLabel(ctx, W, H, period) {
  const bw=164, bh=23, bx=W*0.5-bw*0.5, by=13;
  ctx.fillStyle='rgba(8,6,4,0.72)';
  if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 6); else ctx.rect(bx, by, bw, bh);
  ctx.fill();
  ctx.fillStyle = period === 'night' ? '#aab6ca' : '#ffe8be';
  ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🌲 Сосновый склон', W*0.5, by + bh*0.5);
}

function _ps_moonlight(ctx, t, W, H) {
  const g = ctx.createRadialGradient(W*0.72, 0, 0, W*0.72, 0, W*0.55);
  g.addColorStop(0,'rgba(180,185,220,0.08)'); g.addColorStop(1,'rgba(180,185,220,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H*0.60);
  const mx=W*0.72, my=H*0.06, mr=18;
  ctx.save();
  ctx.fillStyle='rgba(230,235,255,0.82)'; ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(180,185,220,0.28)'; ctx.beginPath(); ctx.arc(mx, my, mr+5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(180,185,220,0.10)'; ctx.beginPath(); ctx.arc(mx, my, mr+12, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawPineSlopeScene(ctx, { px, py, t, period, mtn, cw, ch }) {
  const W = 600;
  const rawCamX = Math.max(0, Math.min(Math.max(0, W - cw), px - cw * 0.5));
  const offsetX = W < cw ? (cw - W) * 0.5 : 0;
  ctx.save();
  ctx.translate(-rawCamX + offsetX, 0);
  ctx.scale(1, ch / 400);

  _ps_sky(ctx, W, 400, period);
  if (period === 'night') { _ps_stars(ctx, t, W, 400); _ps_moonlight(ctx, t, W, 400); }
  _ps_distantPeaks(ctx, W, 400, period);
  _ps_fog(ctx, t, W, 400, period);
  if (period === 'morning' || period === 'day') _ps_sunbeams(ctx, t, W, 400, period);
  _ps_ground(ctx, W, 400, period);
  _ps_path(ctx, W, 400, period);
  _ps_pines(ctx, W, 400, period, t);
  _ps_spiderwebs(ctx, W, 400, period);
  _ps_ropeFence(ctx, W, 400, period, t);
  _ps_rocks(ctx, W, 400, period);
  _ps_smallStones(ctx, W, 400, period);
  _ps_mushrooms(ctx, W, 400, period);

  const szState = mtn.subZoneState.pineSlope;
  _ps_cache(ctx, t, szState, W, 400, period);
  _ps_pickups(ctx, t, szState, W, 400);
  _ps_exitSign(ctx, period);

  if (typeof drawCat === 'function') {
    drawCat(ctx, { x: px, y: py, t, facing: mtn.facing, moving: mtn.isMoving, food: 80, mood: 88 });
  }

  _ps_wind(ctx, t, W, 400, period);
  _ps_zoneLabel(ctx, W, 400, period);

  if (mtn.fadeAlpha > 0) {
    ctx.fillStyle = `rgba(0,0,0,${mtn.fadeAlpha})`;
    ctx.fillRect(-offsetX + rawCamX - 10, 0, cw + 20, 400);
  }
  ctx.restore();
}

if (typeof ITEMS !== 'undefined') Object.assign(ITEMS, PINE_SLOPE_ITEMS);
