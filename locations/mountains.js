'use strict';

const MOUNTAIN_ITEMS = {
  mountainFlower: { id:'mountainFlower', name:'Горный цветок',  icon:'🌼', desc:'Редкий цветок с горной тропы. Растёт только там, где холодный ветер.',  rare:true  },
  trailRibbon:    { id:'trailRibbon',    name:'Лента с тропы',  icon:'🎀', desc:'Выцветшая лента, привязанная к указателю на горной тропе.',              rare:false },
  smoothStone:    { id:'smoothStone',    name:'Гладкий камень', icon:'🪨', desc:'Камень, отполированный горным ветром. Приятно держать в лапках.',         rare:false },
};

const MOUNTAIN_QUESTS = [
  { id:'q_sonya_mtn1', title:'Тропа в горы',  icon:'⛰️', desc:'Соня показывает горную тропу. Войди в горы и найди её у смотровой площадки.', steps:['Войди в горы','Найди Соню у площадки','Поговори с ней'],                     reward:{ xp:25, trust:'sonya' }, npc:'sonya', unlock:false },
  { id:'q_sonya_mtn2', title:'Горный цветок', icon:'🌼', desc:'На тропе растут редкие цветы. Найди горный цветок у больших камней и отдай Соне.', steps:['Найди горный цветок','Отдай Соне'],                                       reward:{ xp:30, trust:'sonya' }, npc:'sonya', unlock:false },
  { id:'q_sonya_mtn3', title:'Вид сверху',    icon:'🏔️', desc:'Поднимись к верхней площадке, найди гладкий камень и посиди с Соней у края.',    steps:['Найди гладкий камень','Поднимись к верхней площадке','Посиди с Соней'], reward:{ xp:40, trust:'sonya', event:'mountain_vista' }, npc:'sonya', unlock:false },
];

const MOUNTAIN_OBJECTS = [
  { id:'mt_exit',      x:50,  y:205, w:60,  h:95,  type:'trail_sign',      label:'Вернуться к лесу 🌲',  action:'exit_mountains',  blocking:false },
  { id:'mt_ribbon',    x:150, y:150, w:30,  h:60,  type:'ribbon_pole',     label:'🎀 Лента с тропы',       action:'pickup',     item:'trailRibbon',    blocking:false },
  { id:'mt_viewpoint', x:325, y:130, w:105, h:78,  type:'viewpoint',       label:'⛰️ Смотровая площадка', action:'examine',         blocking:false },
  { id:'mt_bench',     x:335, y:198, w:78,  h:36,  type:'bench',           label:'🪵 Деревянная лавочка', action:'sit',             blocking:true  },
  { id:'mt_campfire',  x:210, y:218, w:52,  h:52,  type:'campfire',        label:'🔥 Маленький костёр',   action:'examine',         blocking:false },
  { id:'mt_flower',    x:420, y:250, w:40,  h:42,  type:'flower',          label:'🌼 Горный цветок',       action:'pickup',     item:'mountainFlower', blocking:false },
  { id:'mt_stone',     x:460, y:112, w:48,  h:32,  type:'smooth_stone',    label:'🪨 Гладкий камень',      action:'pickup',     item:'smoothStone',    blocking:false },
  { id:'mt_upper',     x:430, y:90,  w:88,  h:62,  type:'upper_viewpoint', label:'🏔️ Верхняя площадка',  action:'viewpoint_upper', blocking:false },
  { id:'mt_rock1',     x:255, y:145, w:68,  h:58,  type:'rock', label:null, action:null, blocking:true  },
  { id:'mt_rock2',     x:140, y:255, w:78,  h:62,  type:'rock', label:null, action:null, blocking:true  },
  { id:'mt_rock3',     x:490, y:172, w:62,  h:52,  type:'rock', label:null, action:null, blocking:true  },
];

class MountainsManager {
  constructor() {
    this.active        = false;
    this.px            = 90;
    this.py            = 295;
    this.fadeAlpha     = 0;
    this.fading        = false;
    this.fadeDir       = 0;
    this.pendingAction = null;
    this.isMoving      = false;
    this.pickedItems   = new Set();
    this.unlockedFlag  = false;
    this._t            = 0;
  }
  get inMountains() { return this.active; }
  startEnter() {
    if (this.fading) return;
    this.fading = true; this.fadeDir = 1; this.fadeAlpha = 0;
    this.pendingAction = { type:'enter' };
  }
  startExit() {
    if (this.fading) return;
    this.fading = true; this.fadeDir = 1; this.fadeAlpha = 0;
    this.pendingAction = { type:'exit' };
  }
  update(dt) {
    this._t += dt;
    if (!this.fading) return;
    this.fadeAlpha += this.fadeDir * 3.0 * dt;
    if (this.fadeDir === 1 && this.fadeAlpha >= 1) {
      this.fadeAlpha = 1;
      if (this.pendingAction) {
        const a = this.pendingAction; this.pendingAction = null;
        if (a.type === 'enter') { this.active = true; this.px = 90; this.py = 295; }
        else if (a.type === 'exit') { this.active = false; }
      }
      this.fadeDir = -1;
    }
    if (this.fadeDir === -1 && this.fadeAlpha <= 0) { this.fadeAlpha = 0; this.fading = false; }
  }
  move(dx, dy, dt) {
    this.isMoving = (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01);
    const speed = 115;
    let nx = this.px + dx * speed * dt, ny = this.py + dy * speed * dt;
    const HW = 10, HH = 14;
    nx = Math.max(50 + HW, Math.min(590 - HW, nx));
    ny = Math.max(72 + HH, Math.min(388 - HH, ny));
    let bx = false, by = false;
    for (const o of MOUNTAIN_OBJECTS) {
      if (!o.blocking) continue;
      if (nx - HW < o.x + o.w && nx + HW > o.x && this.py - HH < o.y + o.h && this.py + HH > o.y) bx = true;
      if (this.px - HW < o.x + o.w && this.px + HW > o.x && ny - HH < o.y + o.h && ny + HH > o.y) by = true;
    }
    if (!bx) this.px = nx;
    if (!by) this.py = ny;
  }
  nearestObject() {
    let best = null, bestD = 72;
    for (const o of MOUNTAIN_OBJECTS) {
      if (!o.action) continue;
      const cx = o.x + o.w * 0.5, cy = o.y + o.h * 0.5;
      const d = Math.hypot(cx - this.px, cy - this.py);
      if (d < bestD) { bestD = d; best = o; }
    }
    return best;
  }
  nearSonya() { return Math.hypot(this.px - 378, this.py - 172) < 95; }
  nearUpperViewpoint() {
    const vp = MOUNTAIN_OBJECTS.find(o => o.id === 'mt_upper');
    if (!vp) return false;
    return Math.hypot(this.px - (vp.x + vp.w * 0.5), this.py - (vp.y + vp.h * 0.5)) < 78;
  }
  save() {
    return { active: this.active, px: this.px, py: this.py, pickedItems: [...this.pickedItems], unlockedFlag: this.unlockedFlag };
  }
  load(s) {
    if (!s) return;
    this.active       = s.active       || false;
    this.px           = s.px           || 90;
    this.py           = s.py           || 295;
    this.pickedItems  = new Set(s.pickedItems || []);
    this.unlockedFlag = s.unlockedFlag || false;
  }
}

function drawMountainScene(ctx, { px, py, t, period, mtn, sonyaNPC, cw, ch }) {
  const ROOM_W = 600;
  const rawCamX = Math.max(0, Math.min(Math.max(0, ROOM_W - cw), px - cw * 0.5));
  const offsetX = ROOM_W < cw ? (cw - ROOM_W) * 0.5 : 0;

  ctx.save();
  ctx.translate(-rawCamX + offsetX, 0);

  _mtn_sky(ctx, ROOM_W, ch, period);
  _mtn_distant(ctx, ROOM_W, ch, period);
  _mtn_clouds(ctx, t, ROOM_W, ch, period);
  _mtn_fog(ctx, t, ROOM_W, ch, period);
  _mtn_ground(ctx, ROOM_W, ch, period);
  _mtn_pines(ctx, ROOM_W, ch, period);
  _mtn_poles(ctx, t, mtn, period);
  _mtn_rocks(ctx, ROOM_W, ch, period);
  _mtn_platform(ctx, period);
  _mtn_upper(ctx, period);
  _mtn_campfire(ctx, t, period);
  _mtn_pickups(ctx, t, mtn, period);
  _mtn_exit_sign(ctx, period);

  const showSonya = (period === 'morning' || period === 'day');
  if (showSonya && typeof drawHumanNPC === 'function') {
    drawHumanNPC(ctx, { id:'sonya', x:378, y:170, t, facing:-1, moving:false, trust: sonyaNPC ? sonyaNPC.trust : 1, emotion:'happy' });
    ctx.save();
    const bw = 52;
    ctx.fillStyle = 'rgba(20,10,0,0.78)';
    if (ctx.roundRect) ctx.roundRect(378 - bw * 0.5, 170 - 52, bw, 16, 4);
    else ctx.rect(378 - bw * 0.5, 170 - 52, bw, 16);
    ctx.fill();
    ctx.fillStyle = '#44aaff'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Соня', 378, 170 - 40);
    ctx.restore();
  }

  if (typeof drawCat === 'function') {
    drawCat(ctx, { x: px, y: py, t, moving: mtn.isMoving, food: 80, mood: 88 });
  }

  _mtn_wind(ctx, t, ROOM_W, ch, period);

  if (mtn.fadeAlpha > 0) {
    ctx.fillStyle = `rgba(0,0,0,${mtn.fadeAlpha})`;
    ctx.fillRect(-offsetX + rawCamX - 10, 0, cw + 20, ch);
  }

  ctx.restore();
}

function _mtn_sky(ctx, W, H, period) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  const palettes = { morning:['#5a7ab8','#8ab2d4','#cce0f0'], day:['#4468a8','#78a8cc','#b4d2e8'], evening:['#32285a','#885068','#cc8865'], night:['#080818','#121230','#202045'] };
  const [c0,c1,c2] = palettes[period] || palettes.day;
  g.addColorStop(0, c0); g.addColorStop(0.52, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function _mtn_distant(ctx, W, H, period) {
  const base  = period === 'evening' ? 'rgba(75,35,72,0.55)'   : period === 'night' ? 'rgba(18,18,48,0.7)'    : 'rgba(95,118,158,0.46)';
  const snow  = period === 'evening' ? 'rgba(195,155,175,0.6)' : period === 'night' ? 'rgba(175,175,215,0.4)' : 'rgba(218,232,242,0.72)';
  const ridge = period === 'evening' ? 'rgba(55,28,58,0.65)'   : period === 'night' ? 'rgba(14,14,34,0.75)'   : 'rgba(65,90,128,0.55)';

  ctx.fillStyle = base;
  ctx.beginPath(); ctx.moveTo(0, H*0.46);
  [[0.12,0.18],[0.25,0.08],[0.37,0.22],[0.51,0.05],[0.65,0.20],[0.77,0.10],[0.91,0.25],[1,0.18],[1,0.46]].forEach(([rx,ry]) => ctx.lineTo(W*rx, H*ry));
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = snow;
  [[0.25,0.08,0.06],[0.51,0.05,0.058],[0.77,0.10,0.048]].forEach(([rx,ry,w]) => {
    ctx.beginPath(); ctx.moveTo(W*rx, H*ry); ctx.lineTo(W*(rx-w), H*(ry+0.05)); ctx.lineTo(W*(rx+w), H*(ry+0.05)); ctx.closePath(); ctx.fill();
  });

  ctx.fillStyle = ridge;
  ctx.beginPath(); ctx.moveTo(0, H*0.60);
  [[0.14,0.36],[0.29,0.43],[0.44,0.29],[0.59,0.39],[0.74,0.31],[0.89,0.41],[1,0.36],[1,0.60]].forEach(([rx,ry]) => ctx.lineTo(W*rx, H*ry));
  ctx.closePath(); ctx.fill();
}

function _mtn_clouds(ctx, t, W, H, period) {
  if (period === 'night') return;
  ctx.save(); ctx.globalAlpha = 0.5;
  [{ bx:0.0, by:H*0.10, r:36, spd:8.5, phase:0 },{ bx:W*0.38, by:H*0.07, r:26, spd:5.5, phase:W*0.5 },{ bx:W*0.68, by:H*0.14, r:30, spd:6.8, phase:W*0.3 }].forEach(c => {
    const x = ((c.bx + t * c.spd) % (W + 200)) - 100;
    ctx.fillStyle = period === 'evening' ? 'rgba(220,170,180,0.55)' : 'rgba(208,222,238,0.6)';
    ctx.beginPath();
    ctx.arc(x, c.by, c.r, 0, Math.PI*2);
    ctx.arc(x+c.r*0.8, c.by-c.r*0.18, c.r*0.7, 0, Math.PI*2);
    ctx.arc(x-c.r*0.7, c.by-c.r*0.12, c.r*0.62, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.restore();
}

function _mtn_fog(ctx, t, W, H, period) {
  const alpha = period === 'morning' ? 0.22 : period === 'evening' ? 0.14 : 0.07;
  if (alpha < 0.01) return;
  ctx.save(); ctx.globalAlpha = alpha;
  [[0.10,0.53,0.22,0.05,0],[0.44,0.49,0.28,0.042,1.4],[0.74,0.55,0.19,0.05,3.0]].forEach(([bx,by,rx,ry,ph]) => {
    const ox = Math.sin(t * 0.38 + ph) * 11;
    ctx.fillStyle = 'rgba(198,213,228,1)';
    ctx.beginPath(); ctx.ellipse(W*bx + ox, H*by, W*rx, H*ry, 0, 0, Math.PI*2); ctx.fill();
  });
  ctx.restore();
}

function _mtn_ground(ctx, W, H, period) {
  const gTop = period === 'evening' ? '#384228' : period === 'night' ? '#181e10' : '#486838';
  const gBot = period === 'evening' ? '#283020' : period === 'night' ? '#0e1408' : '#385528';
  const path = period === 'evening' ? '#685848' : period === 'night' ? '#2e2018' : '#887060';
  const plat = period === 'evening' ? '#364030' : period === 'night' ? '#161c0e' : '#3e5630';

  const g = ctx.createLinearGradient(0, H*0.56, 0, H);
  g.addColorStop(0, gTop); g.addColorStop(1, gBot);
  ctx.fillStyle = g; ctx.fillRect(0, H*0.56, W, H*0.44);

  ctx.fillStyle = plat;
  ctx.beginPath(); ctx.moveTo(W*0.30, H*0.39); ctx.lineTo(W*0.32, H*0.56); ctx.lineTo(W*0.99, H*0.56); ctx.lineTo(W, H*0.43); ctx.lineTo(W*0.72, H*0.31); ctx.lineTo(W*0.52, H*0.39); ctx.closePath(); ctx.fill();

  ctx.strokeStyle = path; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(W*0.22, H*0.96);
  ctx.bezierCurveTo(W*0.28, H*0.80, W*0.38, H*0.72, W*0.35, H*0.60);
  ctx.bezierCurveTo(W*0.32, H*0.50, W*0.48, H*0.46, W*0.52, H*0.41);
  ctx.bezierCurveTo(W*0.57, H*0.35, W*0.68, H*0.32, W*0.76, H*0.28);
  ctx.stroke();

  ctx.strokeStyle = period === 'night' ? 'rgba(46,36,26,0.42)' : 'rgba(155,135,95,0.35)';
  ctx.lineWidth = 17; ctx.setLineDash([16,11]); ctx.stroke(); ctx.setLineDash([]);

  const pb = period === 'night' ? '#362e24' : '#aaa090';
  [[W*0.26,H*0.82],[W*0.34,H*0.68],[W*0.36,H*0.58],[W*0.48,H*0.47],[W*0.58,H*0.38],[W*0.70,H*0.31]].forEach(([x,y]) => {
    ctx.fillStyle = pb; ctx.beginPath(); ctx.ellipse(x, y, 4, 2.5, 0.3, 0, Math.PI*2); ctx.fill();
  });
}

function _mtn_pines(ctx, W, H, period) {
  const trunk = period === 'night' ? '#181208' : '#4a3018';
  const leaf  = period === 'evening' ? '#283820' : period === 'night' ? '#0e1808' : '#2e5228';
  const edge  = period === 'evening' ? '#384830' : period === 'night' ? '#182014' : '#3a6535';
  [{ x:W*0.03, y:H*0.56, h:H*0.36, w:H*0.13 },{ x:W*0.09, y:H*0.53, h:H*0.41, w:H*0.14 },{ x:W*0.16, y:H*0.57, h:H*0.33, w:H*0.12 },{ x:W*0.87, y:H*0.50, h:H*0.39, w:H*0.12 },{ x:W*0.93, y:H*0.55, h:H*0.33, w:H*0.11 }].forEach(p => {
    ctx.fillStyle = trunk; ctx.fillRect(p.x - 5, p.y - 10, 10, 18);
    for (let tier = 0; tier < 3; tier++) {
      const ty = p.y - p.h * (0.35 + tier * 0.24), tw = p.w * (1 - tier * 0.2);
      ctx.fillStyle = tier === 0 ? leaf : edge;
      ctx.beginPath(); ctx.moveTo(p.x, ty - p.h * 0.14); ctx.lineTo(p.x - tw*0.5, ty + p.h * 0.14); ctx.lineTo(p.x + tw*0.5, ty + p.h * 0.14); ctx.closePath(); ctx.fill();
    }
  });
}

function _mtn_poles(ctx, t, mtn, period) {
  const poleC = period === 'night' ? '#382820' : '#7a5828';
  const p1x = 165, p1top = 150, p1bot = 210;
  ctx.strokeStyle = poleC; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(p1x, p1bot); ctx.lineTo(p1x, p1top); ctx.stroke();
  if (!mtn.pickedItems.has('mt_ribbon')) {
    const wave = Math.sin(t * 2.6) * 6;
    ctx.save(); ctx.strokeStyle = '#e06080'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.shadowColor = '#ff80a0'; ctx.shadowBlur = 9;
    ctx.beginPath(); ctx.moveTo(p1x, p1top + 7); ctx.quadraticCurveTo(p1x + 15 + wave, p1top + 11, p1x + 22 + wave*0.7, p1top + 18); ctx.stroke();
    ctx.restore();
  }
  const p2x = 305, p2top = 175, p2bot = 215;
  ctx.strokeStyle = poleC; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(p2x, p2bot); ctx.lineTo(p2x, p2top); ctx.stroke();
  const wave2 = Math.sin(t * 2.5 + 1.2) * 5;
  ctx.strokeStyle = '#60a0e0'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(p2x, p2top + 5); ctx.quadraticCurveTo(p2x + 12 + wave2, p2top + 9, p2x + 18 + wave2*0.6, p2top + 15); ctx.stroke();
}

function _mtn_rocks(ctx, W, H, period) {
  const base = period === 'night' ? '#262836' : period === 'evening' ? '#464060' : '#787898';
  const hi   = period === 'night' ? '#2e304a' : period === 'evening' ? '#565070' : '#9898b8';
  [{ x:260,y:148,w:68,h:58 },{ x:145,y:258,w:78,h:62 },{ x:490,y:175,w:62,h:52 },{ x:382,y:243,w:32,h:22 },{ x:308,y:192,w:24,h:17 },{ x:445,y:265,w:28,h:20 }].forEach(r => {
    ctx.fillStyle = base; ctx.beginPath(); ctx.ellipse(r.x+r.w*0.5, r.y+r.h*0.5, r.w*0.5, r.h*0.5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = hi; ctx.beginPath(); ctx.ellipse(r.x+r.w*0.4, r.y+r.h*0.38, r.w*0.2, r.h*0.14, -0.4, 0, Math.PI*2); ctx.fill();
  });
  if (period !== 'night') {
    [[198,268],[352,258],[462,248]].forEach(([fx,fy]) => {
      ctx.fillStyle = '#ffe058'; ctx.beginPath(); ctx.arc(fx, fy, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 5; i++) { const a = (i/5)*Math.PI*2; ctx.beginPath(); ctx.arc(fx+Math.cos(a)*5, fy+Math.sin(a)*5, 2.5, 0, Math.PI*2); ctx.fill(); }
    });
  }
}

function _mtn_platform(ctx, period) {
  const pC = period === 'night' ? '#2a2840' : period === 'evening' ? '#444068' : '#686888';
  const eC = period === 'night' ? '#222035' : period === 'evening' ? '#343060' : '#585878';
  const rC = period === 'night' ? '#444265' : period === 'evening' ? '#6a6688' : '#868898';

  ctx.fillStyle = pC;
  ctx.beginPath(); ctx.moveTo(325, 208); ctx.lineTo(430, 208); ctx.lineTo(440, 198); ctx.lineTo(315, 198); ctx.closePath(); ctx.fill();
  ctx.fillStyle = eC; ctx.fillRect(325, 130, 105, 68);
  ctx.strokeStyle = rC; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(330, 134); ctx.lineTo(425, 134); ctx.stroke();
  for (let rx = 335; rx <= 420; rx += 18) { ctx.beginPath(); ctx.moveTo(rx, 134); ctx.lineTo(rx, 165); ctx.stroke(); }

  const bx=335, by=198, bw=78, bh=14;
  const wTop  = period === 'night' ? '#3a2810' : '#8a6030';
  const wSide = period === 'night' ? '#2a1808' : '#6a4018';
  const legC  = period === 'night' ? '#1e1208' : '#5a3015';
  ctx.fillStyle = wTop; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = wSide; ctx.fillRect(bx, by+bh, bw, 5);
  ctx.strokeStyle = wSide; ctx.lineWidth = 1.5;
  [bx+22, bx+42, bx+62].forEach(lx => { ctx.beginPath(); ctx.moveTo(lx, by); ctx.lineTo(lx, by+bh); ctx.stroke(); });
  ctx.fillStyle = legC;
  [[bx+9, by+bh+5],[bx+bw-9, by+bh+5]].forEach(([lx,ly]) => ctx.fillRect(lx-3, ly, 6, 14));
  ctx.strokeStyle = period === 'night' ? '#303028' : '#a08060';
  ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(bx+14, by-8); ctx.bezierCurveTo(bx+28, by-18, bx+52, by-14, bx+bw-14, by-7); ctx.stroke(); ctx.setLineDash([]);
}

function _mtn_upper(ctx, period) {
  const uvx=430, uvy=90, uvw=88, uvh=62;
  const pC = period === 'night' ? '#252240' : period === 'evening' ? '#3a3568' : '#5a5888';
  const eC = period === 'night' ? '#1e1b35' : period === 'evening' ? '#2c2858' : '#4a4878';
  const rC = period === 'night' ? '#484568' : period === 'evening' ? '#6a6888' : '#7a7898';

  ctx.fillStyle = pC;
  ctx.beginPath(); ctx.moveTo(uvx, uvy+uvh); ctx.lineTo(uvx+uvw, uvy+uvh); ctx.lineTo(uvx+uvw+12, uvy+uvh-10); ctx.lineTo(uvx+12, uvy+uvh-10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = eC; ctx.fillRect(uvx, uvy, uvw, uvh*0.55);

  ctx.strokeStyle = period === 'night' ? 'rgba(78,76,108,0.4)' : 'rgba(148,148,178,0.3)';
  ctx.lineWidth = 1;
  [[uvx+14,uvy+8,uvx+35,uvy+8],[uvx+44,uvy+5,uvx+70,uvy+5],[uvx+10,uvy+18,uvx+40,uvy+18],[uvx+50,uvy+20,uvx+uvw-8,uvy+20]].forEach(([x1,y1,x2,y2]) => {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });

  ctx.strokeStyle = rC; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(uvx+5, uvy+4); ctx.lineTo(uvx+uvw-5, uvy+4); ctx.stroke();
  for (let rx = uvx+10; rx <= uvx+uvw-10; rx += 20) { ctx.beginPath(); ctx.moveTo(rx, uvy+4); ctx.lineTo(rx, uvy+uvh*0.44); ctx.stroke(); }

  ctx.strokeStyle = period === 'night' ? '#4a4050' : '#907060'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(uvx+uvw-10, uvy+4); ctx.lineTo(uvx+uvw-10, uvy-22); ctx.stroke();
  ctx.fillStyle = '#e04040';
  ctx.beginPath(); ctx.moveTo(uvx+uvw-10, uvy-22); ctx.lineTo(uvx+uvw+5, uvy-15); ctx.lineTo(uvx+uvw-10, uvy-8); ctx.closePath(); ctx.fill();
}

function _mtn_campfire(ctx, t, period) {
  const cx=236, cy=238;
  ctx.save();
  ctx.strokeStyle = '#5a3010'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx-14, cy+8); ctx.lineTo(cx+9, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+14, cy+8); ctx.lineTo(cx-9, cy); ctx.stroke();
  ctx.fillStyle = '#ff4400'; ctx.beginPath(); ctx.arc(cx, cy+4, 7, 0, Math.PI*2); ctx.fill();
  const f1 = Math.sin(t*8)*0.14+0.86, f2 = Math.sin(t*11+1)*0.11+0.89;
  [[0,22,'#ff6600',8,f2],[0,28,'#ff8800',6,f1],[0,34,'#ffcc00',4,f1*0.9]].forEach(([ox,h,c,r,fl]) => {
    ctx.fillStyle = c; ctx.globalAlpha = fl*0.9;
    ctx.beginPath(); ctx.ellipse(cx+ox, cy-h*fl, r, h*fl*0.5, 0, 0, Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha = 1;
  const grd = ctx.createRadialGradient(cx,cy,2,cx,cy,38);
  grd.addColorStop(0,'rgba(255,115,0,0.22)'); grd.addColorStop(1,'rgba(255,80,0,0)');
  ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx,cy,38,0,Math.PI*2); ctx.fill();
  if (period !== 'day') {
    ctx.strokeStyle = 'rgba(200,200,200,0.17)'; ctx.lineWidth = 3;
    const sm = Math.sin(t*1.5)*8;
    ctx.beginPath(); ctx.moveTo(cx,cy-22); ctx.bezierCurveTo(cx+sm,cy-36,cx-sm,cy-50,cx+sm*0.5,cy-64); ctx.stroke();
  }
  ctx.restore();
}

function _mtn_pickups(ctx, t, mtn, period) {
  const glow = 0.5 + 0.5 * Math.sin(t * 3);
  if (!mtn.pickedItems.has('mt_flower')) {
    ctx.save(); ctx.shadowColor = '#ffe050'; ctx.shadowBlur = 12 + glow * 8;
    ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🌼', 440, 271); ctx.restore();
  }
  if (!mtn.pickedItems.has('mt_stone')) {
    ctx.save(); ctx.shadowColor = '#c0b0a0'; ctx.shadowBlur = 10 + glow * 6;
    ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🪨', 484, 128); ctx.restore();
  }
}

function _mtn_exit_sign(ctx, period) {
  const sx=50, sy=218, sw=58, sh=92;
  const poleC = period === 'night' ? '#3a2618' : '#7a5525';
  ctx.strokeStyle = poleC; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(sx+sw*0.5, sy+sh); ctx.lineTo(sx+sw*0.5, sy); ctx.stroke();
  const bC = period === 'night' ? '#2a2010' : '#6a5030';
  ctx.fillStyle = bC;
  if (ctx.roundRect) ctx.roundRect(sx+2, sy+1, sw-4, 30, 5); else ctx.rect(sx+2, sy+1, sw-4, 30);
  ctx.fill();
  ctx.strokeStyle = period === 'night' ? '#4a3820' : '#aa8050'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = period === 'night' ? '#aaa090' : '#ffe8c0';
  ctx.font = 'bold 8px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('← Лес', sx+sw*0.5, sy+16);
}

function _mtn_wind(ctx, t, W, H, period) {
  ctx.save(); ctx.globalAlpha = period === 'night' ? 0.18 : 0.32;
  ctx.strokeStyle = 'rgba(200,215,230,0.8)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const ph = (i / 12) * Math.PI * 2;
    const px = ((t * 54 + i * 48) % (W + 40)) - 20;
    const py = H * (0.34 + (i % 4) * 0.12) + Math.sin(t * 1.5 + ph) * 14;
    const len = 17 + Math.sin(t * 3 + ph) * 6;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - len, py + len * 0.11); ctx.stroke();
  }
  ctx.restore();
}
