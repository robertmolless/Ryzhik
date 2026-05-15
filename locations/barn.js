'use strict';

const BARN_FURNITURE = [
  { id:'barn_exit',    x:10,  y:195, w:55, h:125, type:'barn_door',    label:'Выйти из сарая 🚪',     action:'exit_barn'  },
  { id:'barn_shelf1',  x:90,  y:145, w:100,h:115, type:'barn_shelf',   label:'Старая полка',           action:'examine'    },
  { id:'barn_bike',    x:215, y:175, w:95, h:110, type:'bike',          label:'Старый велосипед',       action:'examine'    },
  { id:'barn_lantern', x:105, y:155, w:50, h:80,  type:'barn_lantern', label:'Фонарь 🪔',              action:'examine'    },
  { id:'barn_workbench',x:340,y:185, w:130,h:95,  type:'workbench',    label:'Верстак 🔧',             action:'examine'    },
  { id:'barn_hay1',    x:510, y:250, w:85, h:65,  type:'haybale',      label:'Стог сена',              action:'examine'    },
  { id:'barn_hay2',    x:610, y:260, w:75, h:55,  type:'haybale',      label:'Стог сена',              action:null         },
  { id:'barn_cobweb',  x:700, y:165, w:50, h:50,  type:'cobweb',       label:null,                     action:null         },
  { id:'barn_boxes1',  x:680, y:205, w:90, h:80,  type:'boxes',        label:'Коробки',                action:'examine'    },
  { id:'cassette',     x:485, y:290, w:45, h:40,  type:'cassette_box', label:'📼 Кассета Лёхи',        action:'pickup', item:'cassette' },
];

class BarnManager {
  constructor() {
    this.active      = false;
    this.px          = 380;
    this.py          = 310;
    this.fadeAlpha   = 0;
    this.fading      = false;
    this.fadeDir     = 0;
    this.pendingAction = null;
    this.pickedItems = new Set();
  }
  get inBarn() { return this.active; }
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
    if (!this.fading) return;
    const speed = 3.5;
    this.fadeAlpha += this.fadeDir * speed * dt;
    if (this.fadeDir === 1 && this.fadeAlpha >= 1) {
      this.fadeAlpha = 1;
      if (this.pendingAction) {
        const a = this.pendingAction; this.pendingAction = null;
        if (a.type === 'enter') { this.active = true; this.px = 380; this.py = 310; }
        else if (a.type === 'exit') { this.active = false; }
      }
      this.fadeDir = -1;
    }
    if (this.fadeDir === -1 && this.fadeAlpha <= 0) {
      this.fadeAlpha = 0; this.fading = false;
    }
  }
  move(dx, dy, dt) {
    const speed = 110;
    let nx = this.px + dx * speed * dt;
    let ny = this.py + dy * speed * dt;
    const HW = 10, HH = 14;
    const roomW = 800;
    nx = Math.max(HW, Math.min(roomW - HW, nx));
    ny = Math.max(80 + HH, Math.min(420 - HH, ny));
    const solid = BARN_FURNITURE.filter(f => ['barn_door','barn_shelf','bike','workbench','haybale','boxes'].includes(f.type));
    let bx = false, by = false;
    for (const f of solid) {
      if (nx - HW < f.x + f.w && nx + HW > f.x && this.py - HH < f.y + f.h && this.py + HH > f.y) bx = true;
      if (this.px - HW < f.x + f.w && this.px + HW > f.x && ny - HH < f.y + f.h && ny + HH > f.y) by = true;
    }
    if (!bx) this.px = nx;
    if (!by) this.py = ny;
  }
  nearestFurniture() {
    let best = null, bestD = 65;
    for (const f of BARN_FURNITURE) {
      if (!f.action) continue;
      if (f.action === 'pickup' && this.pickedItems.has(f.id)) continue;
      const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
      const d = Math.sqrt((cx - this.px) ** 2 + (cy - this.py) ** 2);
      if (d < bestD) { bestD = d; best = f; }
    }
    return best;
  }
  save() {
    return { active: this.active, px: this.px, py: this.py, pickedItems: [...this.pickedItems] };
  }
  load(s) {
    if (!s) return;
    this.active      = s.active || false;
    this.px          = s.px    || 380;
    this.py          = s.py    || 310;
    this.pickedItems = new Set(s.pickedItems || []);
  }
}

function drawBarnScene(ctx, opts) {
  const { px, py, t, period, barn, cw, ch } = opts;
  const roomW = 800;
  const camX = Math.max(0, Math.min(roomW - cw, px - cw / 2));

  ctx.save();

  const wallG = ctx.createLinearGradient(0, 0, 0, ch * 0.5);
  wallG.addColorStop(0, '#4a2e10'); wallG.addColorStop(1, '#2e1a08');
  ctx.fillStyle = wallG; ctx.fillRect(0, 0, cw, ch);

  ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1.5;
  for (let wy = 30; wy < ch * 0.52; wy += 22) { ctx.beginPath(); ctx.moveTo(0, wy); ctx.lineTo(cw, wy); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
  for (let bx2 = (60 - (camX % 60)) % 60; bx2 < cw; bx2 += 60) { ctx.beginPath(); ctx.moveTo(bx2, 0); ctx.lineTo(bx2, ch * 0.52); ctx.stroke(); }

  const floorY = ch * 0.52;
  for (let row = 0; row < 14; row++) {
    const fy = floorY + row * 26;
    const r = Math.min(120, 88 + row * 2), g = Math.min(80, 60 + row), b = Math.min(42, 30 + row);
    ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fillRect(0, fy, cw, 26);
    ctx.strokeStyle = `rgba(180,140,60,0.18)`; ctx.lineWidth = 1;
    for (let sx2 = (row * 37) % 30; sx2 < cw; sx2 += 30) {
      ctx.beginPath(); ctx.moveTo(sx2, fy + 6); ctx.quadraticCurveTo(sx2 + 8, fy + 2, sx2 + 15, fy + 8); ctx.stroke();
    }
  }

  ctx.fillStyle = '#1e0e04'; ctx.fillRect(0, 0, cw, 32);
  const beamStep = 160;
  for (let bx3 = 0; bx3 < roomW; bx3 += beamStep) {
    const sbx = bx3 - camX;
    if (sbx > -20 && sbx < cw + 20) { ctx.fillStyle = '#2e1a08'; ctx.fillRect(sbx, 0, 20, ch * 0.52); }
  }

  const behind = BARN_FURNITURE.filter(f => f.y + f.h < py);
  for (const f of behind) {
    const sx3 = f.x - camX;
    if (sx3 + f.w < -20 || sx3 > cw + 20) continue;
    ctx.save(); ctx.translate(sx3, f.y); _drawBarnFurnitureItem(ctx, f, t, barn); ctx.restore();
  }

  drawCat(ctx, { x: px - camX, y: py, facing: 1, frame: 0, moving: false, jumping: false, jumpY: 0, emotion: null, t: t, food: 80, mood: 80 });

  const inFront = BARN_FURNITURE.filter(f => f.y + f.h >= py);
  for (const f of inFront) {
    const sx4 = f.x - camX;
    if (sx4 + f.w < -20 || sx4 > cw + 20) continue;
    ctx.save(); ctx.translate(sx4, f.y); _drawBarnFurnitureItem(ctx, f, t, barn); ctx.restore();
  }

  const tints = { morning:'rgba(255,180,80,0.10)', day:'rgba(255,200,120,0.06)', evening:'rgba(180,60,10,0.20)', night:'rgba(8,4,15,0.58)' };
  ctx.fillStyle = tints[period] || tints.day; ctx.fillRect(0, 0, cw, ch);

  const lanX = 129 - camX, lanY = 210;
  if (lanX > -80 && lanX < cw + 80) {
    const intensity = period === 'night' ? 0.45 : period === 'evening' ? 0.30 : 0.12;
    const glow = ctx.createRadialGradient(lanX, lanY, 0, lanX, lanY, 130);
    glow.addColorStop(0, `rgba(255,180,40,${intensity})`); glow.addColorStop(0.5, `rgba(255,120,20,${intensity * 0.5})`); glow.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(lanX, lanY, 130, 0, Math.PI * 2); ctx.fill();
  }

  const doorRight = 60 - camX;
  if (doorRight > 0 && doorRight < cw) {
    const leakAlpha = period === 'night' ? 0.06 : 0.18;
    const dl = ctx.createLinearGradient(doorRight, 0, doorRight + 90, 0);
    dl.addColorStop(0, `rgba(220,240,180,${leakAlpha})`); dl.addColorStop(1, 'rgba(220,240,180,0)');
    ctx.fillStyle = dl; ctx.fillRect(doorRight, ch * 0.08, 90, ch * 0.84);
  }

  ctx.fillStyle = 'rgba(255,220,160,0.5)'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'left';
  ctx.fillText('🏚️ Сарай', 12, 22);
  ctx.restore();

  if (barn.fadeAlpha > 0) {
    ctx.fillStyle = `rgba(0,0,0,${barn.fadeAlpha})`; ctx.fillRect(0, 0, cw, ch);
  }
}

function _drawBarnFurnitureItem(ctx, f, t, barn) {
  switch (f.type) {
    case 'barn_door':    _drawBarnDoor(ctx, f, t); break;
    case 'barn_shelf':   _drawBarnShelf(ctx, f, t); break;
    case 'bike':         _drawBike(ctx, f, t); break;
    case 'barn_lantern': _drawBarnLantern(ctx, f, t); break;
    case 'workbench':    _drawWorkbench(ctx, f, t); break;
    case 'haybale':      _drawHaybale(ctx, f, t); break;
    case 'cobweb':       _drawBarnCobweb(ctx, f, t); break;
    case 'boxes':        _drawBarnBoxes(ctx, f, t); break;
    case 'cassette_box': _drawCassetteBox(ctx, f, t, barn.pickedItems.has(f.id)); break;
    default: break;
  }
}

function _drawBarnDoor(ctx, f, t) {
  const w = f.w, h = f.h;
  ctx.fillStyle = '#5a3010'; GFX.roundRect(ctx, 0, 0, w, h, 2); ctx.fill();
  const dg = ctx.createLinearGradient(0, 0, w, 0);
  dg.addColorStop(0, '#7a4820'); dg.addColorStop(1, '#6a3818');
  ctx.fillStyle = dg; GFX.roundRect(ctx, 3, 3, w - 6, h - 3, 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1.5;
  for (let py2 = 20; py2 < h - 4; py2 += 28) { ctx.beginPath(); ctx.moveTo(4, py2); ctx.lineTo(w - 4, py2); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(40,20,5,0.4)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(5, 5); ctx.lineTo(w - 5, h - 5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w - 5, 5); ctx.lineTo(5, h * 0.6); ctx.stroke();
  ctx.fillStyle = '#c0a040'; ctx.beginPath(); ctx.arc(w - 10, h * 0.45, 5, 0, Math.PI * 2); ctx.fill();
  const flick = 0.12 + Math.sin(t * 1.7) * 0.03;
  ctx.fillStyle = `rgba(180,230,120,${flick})`; ctx.fillRect(0, h * 0.08, 3, h * 0.84);
  ctx.fillStyle = 'rgba(255,240,180,0.65)'; ctx.font = '9px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('🚪 Выход', w / 2, h * 0.18);
}

function _drawBarnShelf(ctx, f, t) {
  const w = f.w, h = f.h;
  ctx.fillStyle = '#5a3010'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#7a4820';
  [h * 0.25, h * 0.55, h * 0.82].forEach(sy => {
    ctx.fillRect(0, sy, w, 8);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.5;
    for (let gx = 5; gx < w; gx += 12) { ctx.beginPath(); ctx.moveTo(gx, sy); ctx.lineTo(gx + 4, sy + 7); ctx.stroke(); }
  });
  ctx.fillStyle = '#808080'; ctx.fillRect(8, h * 0.1, 14, 20);
  ctx.fillStyle = '#c06020'; ctx.fillRect(28, h * 0.08, 12, 22);
  ctx.fillStyle = '#606060'; ctx.fillRect(46, h * 0.12, 8, 16);
  ctx.fillStyle = '#a04010'; ctx.fillRect(60, h * 0.09, 15, 21);
  ctx.fillStyle = '#888'; ctx.fillRect(10, h * 0.41, 20, 12);
  ctx.fillStyle = '#c0c0c0'; ctx.fillRect(36, h * 0.40, 10, 14);
}

function _drawBike(ctx, f, t) {
  const w = f.w, h = f.h, cx = w / 2, cy = h * 0.55, r = Math.min(w, h) * 0.28;
  ctx.strokeStyle = '#555'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx - r * 0.85, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + r * 0.85, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
    const lx = cx - r * 0.85, ly = cy;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + Math.cos(a) * r * 0.9, ly + Math.sin(a) * r * 0.9); ctx.stroke();
    const rx = cx + r * 0.85, ry = cy;
    ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + Math.cos(a) * r * 0.9, ry + Math.sin(a) * r * 0.9); ctx.stroke();
  }
  ctx.fillStyle = '#aaa';
  ctx.beginPath(); ctx.arc(cx - r * 0.85, cy, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.85, cy, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a4020'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - r * 0.85, cy); ctx.lineTo(cx, cy - r * 0.6); ctx.lineTo(cx + r * 0.85, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - r * 0.6); ctx.lineTo(cx - r * 0.3, cy - r * 1.1); ctx.stroke();
  ctx.strokeStyle = '#666'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - r * 0.3 - 12, cy - r * 1.1); ctx.lineTo(cx - r * 0.3 + 12, cy - r * 1.1); ctx.stroke();
  ctx.fillStyle = '#4a2a10'; GFX.roundRect(ctx, cx - 15, cy - r * 1.05, 30, 8, 4); ctx.fill();
  ctx.fillStyle = 'rgba(160,60,10,0.12)'; ctx.fillRect(0, 0, w, h);
}

function _drawBarnLantern(ctx, f, t) {
  const w = f.w, h = f.h, cx = w / 2;
  ctx.fillStyle = '#5a5040'; ctx.fillRect(cx - 3, 0, 6, h * 0.4);
  ctx.strokeStyle = '#7a6050'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, h * 0.4, 8, Math.PI, 0); ctx.stroke();
  const lw = w * 0.7, lh = h * 0.5, lx = cx - lw / 2, ly = h * 0.38;
  ctx.fillStyle = '#4a3820'; GFX.roundRect(ctx, lx, ly, lw, lh, 4); ctx.fill();
  const glowAlpha = 0.55 + Math.sin(t * 2.3) * 0.1;
  ctx.fillStyle = `rgba(255,200,50,${glowAlpha})`; GFX.roundRect(ctx, lx + 4, ly + 6, lw - 8, lh - 10, 2); ctx.fill();
  ctx.strokeStyle = '#3a2810'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, ly + 6); ctx.lineTo(cx, ly + lh - 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(lx + 4, ly + lh / 2); ctx.lineTo(lx + lw - 4, ly + lh / 2); ctx.stroke();
  ctx.fillStyle = '#3a2810'; ctx.fillRect(lx + 2, ly - 4, lw - 4, 6);
  ctx.beginPath(); ctx.moveTo(cx - 5, ly + lh); ctx.lineTo(cx, ly + lh + 10); ctx.lineTo(cx + 5, ly + lh); ctx.fill();
  ctx.fillStyle = '#6a5040'; ctx.beginPath(); ctx.arc(cx, ly - 2, 4, 0, Math.PI * 2); ctx.fill();
}

function _drawWorkbench(ctx, f, t) {
  const w = f.w, h = f.h;
  const tg = ctx.createLinearGradient(0, 0, 0, h * 0.4);
  tg.addColorStop(0, '#8a5828'); tg.addColorStop(1, '#6a4018');
  ctx.fillStyle = tg; ctx.fillRect(0, 0, w, h * 0.35);
  ctx.fillStyle = '#5a3010'; ctx.fillRect(4, h * 0.35, w - 8, h * 0.65);
  ctx.fillStyle = '#4a2808'; ctx.fillRect(6, h * 0.55, 14, h * 0.45); ctx.fillRect(w - 20, h * 0.55, 14, h * 0.45);
  ctx.fillStyle = '#888'; ctx.fillRect(12, h * 0.05, 30, 6); ctx.fillRect(50, h * 0.03, 8, 10);
  ctx.fillStyle = '#aaa'; ctx.fillRect(65, h * 0.04, 20, 8);
  ctx.fillStyle = '#c06020'; ctx.fillRect(90, h * 0.03, 12, 12);
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.5;
  for (let gx = 10; gx < w; gx += 18) { ctx.beginPath(); ctx.moveTo(gx, 2); ctx.lineTo(gx + 3, h * 0.32); ctx.stroke(); }
}

function _drawHaybale(ctx, f, t) {
  const w = f.w, h = f.h;
  const hg = ctx.createLinearGradient(0, 0, 0, h);
  hg.addColorStop(0, '#d4a840'); hg.addColorStop(1, '#a07820');
  ctx.fillStyle = hg; GFX.roundRect(ctx, 0, 0, w, h, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(200,160,40,0.5)'; ctx.lineWidth = 1.5;
  for (let hy = 6; hy < h - 4; hy += 9) { ctx.beginPath(); ctx.moveTo(4, hy + Math.sin(hy * 0.3) * 2); ctx.lineTo(w - 4, hy + Math.sin(hy * 0.5) * 3); ctx.stroke(); }
  ctx.strokeStyle = '#8a6010'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(w * 0.3, 0); ctx.lineTo(w * 0.3, h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.7, 0); ctx.lineTo(w * 0.7, h); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,170,50,0.7)'; ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const bx = (i * 37) % w;
    ctx.beginPath(); ctx.moveTo(bx, -2); ctx.quadraticCurveTo(bx + 5, -8, bx + 10, -4); ctx.stroke();
  }
}

function _drawBarnCobweb(ctx, f, t) {
  const cx = f.x > 400 ? 0 : f.w, cy = 0, threads = 6;
  ctx.strokeStyle = 'rgba(200,200,200,0.2)'; ctx.lineWidth = 0.5;
  for (let i = 0; i < threads; i++) {
    const angle = (i / threads) * Math.PI * 0.6, len = 30 + (i % 3) * 10;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len); ctx.stroke();
  }
  for (let r = 8; r < 35; r += 8) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 0.6); ctx.stroke(); }
}

function _drawBarnBoxes(ctx, f, t) {
  const w = f.w, h = f.h;
  [{ x:10, y:h*0.5, w:w*0.7, h:h*0.5, shade:'#c89050' },{ x:0, y:h*0.2, w:w*0.55, h:h*0.5, shade:'#b07840' },{ x:w*0.45, y:h*0.3, w:w*0.5, h:h*0.4, shade:'#d0a060' }].forEach(b => {
    ctx.fillStyle = b.shade; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(b.x, b.y, b.w, 5);
    ctx.strokeStyle = 'rgba(200,180,100,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(b.x, b.y + b.h * 0.5); ctx.lineTo(b.x + b.w, b.y + b.h * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(b.x + b.w / 2, b.y); ctx.lineTo(b.x + b.w / 2, b.y + b.h); ctx.stroke();
  });
}

function _drawCassetteBox(ctx, f, t, picked) {
  const w = f.w, h = f.h;
  if (picked) {
    ctx.fillStyle = 'rgba(100,70,30,0.3)'; GFX.roundRect(ctx, 2, 4, w - 4, h - 6, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(150,100,50,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    GFX.roundRect(ctx, 2, 4, w - 4, h - 6, 3); ctx.stroke(); ctx.setLineDash([]);
    return;
  }
  ctx.fillStyle = '#3a2810'; GFX.roundRect(ctx, 0, 6, w, h - 6, 4); ctx.fill();
  const cw2 = w * 0.75, ch2 = h * 0.55, cx = (w - cw2) / 2, cy = (h - ch2) / 2 + 4;
  ctx.fillStyle = '#1a1a2a'; GFX.roundRect(ctx, cx, cy, cw2, ch2, 3); ctx.fill();
  ctx.fillStyle = '#4a3080'; GFX.roundRect(ctx, cx + 3, cy + 3, cw2 - 6, ch2 * 0.55, 2); ctx.fill();
  ctx.fillStyle = '#cc8040'; ctx.font = `bold ${Math.floor(ch2 * 0.25)}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('TAPE', w / 2, cy + ch2 * 0.32);
  ctx.fillStyle = '#666';
  ctx.beginPath(); ctx.arc(cx + cw2 * 0.3, cy + ch2 * 0.72, ch2 * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + cw2 * 0.7, cy + ch2 * 0.72, ch2 * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.arc(cx + cw2 * 0.3, cy + ch2 * 0.72, ch2 * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + cw2 * 0.7, cy + ch2 * 0.72, ch2 * 0.09, 0, Math.PI * 2); ctx.fill();
  const sp = Math.sin(t * 2.5) * 0.4 + 0.6;
  ctx.fillStyle = `rgba(255,220,80,${sp * 0.7})`; ctx.font = '12px serif'; ctx.textAlign = 'center';
  ctx.fillText('✨', w * 0.8, cy - 4);
}
