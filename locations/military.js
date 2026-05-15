'use strict';

const MILITARY_FURNITURE = [
  { id:'mo_exit',     x:10,  y:200, w:55, h:120, type:'mil_door',  label:'Выйти из военкомата 🚪', action:'exit_mil'    },
  { id:'mo_desk',     x:280, y:140, w:180,h:80,  type:'desk',      label:'Стол с бумагами 📄',     action:'examine'     },
  { id:'mo_boxes',    x:450, y:250, w:90, h:90,  type:'boxes',     label:'Коробки с документами',  action:'examine'     },
  { id:'mo_fan',      x:450, y:88,  w:60, h:60,  type:'mil_fan',   label:'Старый вентилятор',      action:'examine'     },
  { id:'mo_papers',   x:200, y:310, w:80, h:30,  type:'papers',    label:'Бумаги на полу 📄',       action:'examine'     },
  { id:'mo_mug',      x:282, y:222, w:32, h:32,  type:'nick_item', label:'☕ Кружка Ника',         action:'pickup_nick', item:'nickMug'      },
  { id:'mo_scarf',    x:100, y:222, w:36, h:32,  type:'nick_item', label:'🧣 Шарф Ника',           action:'pickup_nick', item:'nickScarf'    },
  { id:'mo_backpack', x:478, y:342, w:44, h:44,  type:'nick_item', label:'🎒 Рюкзак Ника',         action:'pickup_nick', item:'nickBackpack' },
  { id:'mo_cassette', x:410, y:288, w:36, h:32,  type:'nick_item', label:'📼 Кассета Ника',        action:'pickup_nick', item:'nickCassette' },
];

class MilitaryOfficeManager {
  constructor() {
    this.active         = false;
    this.px             = 100;
    this.py             = 280;
    this.fadeAlpha      = 0;
    this.fading         = false;
    this.fadeDir        = 0;
    this.pendingAction  = null;
    this.certPickedUp   = false;
    this.pickedMilItems = new Set();
  }
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
        if (a.type === 'enter') { this.active = true; this.px = 100; this.py = 280; }
        else if (a.type === 'exit') { this.active = false; }
      }
      this.fadeDir = -1;
    }
    if (this.fadeDir === -1 && this.fadeAlpha <= 0) { this.fadeAlpha = 0; this.fading = false; }
  }
  move(dx, dy, dt) {
    const speed = 110;
    let nx = this.px + dx * speed * dt, ny = this.py + dy * speed * dt;
    const HW = 10, HH = 14;
    nx = Math.max(HW, Math.min(540 - HW, nx));
    ny = Math.max(80 + HH, Math.min(420 - HH, ny));
    const solid = MILITARY_FURNITURE.filter(f => ['desk','boxes'].includes(f.type));
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
    for (const f of MILITARY_FURNITURE) {
      if (!f.action) continue;
      if (f.action === 'pickup_nick' && this.pickedMilItems.has(f.id)) continue;
      const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
      const d = Math.sqrt((cx - this.px) ** 2 + (cy - this.py) ** 2);
      if (d < bestD) { bestD = d; best = f; }
    }
    return best;
  }
  nearNick() { return Math.sqrt((this.px - 370) ** 2 + (this.py - 200) ** 2) < 150; }
  nearCertificate() { return !this.certPickedUp && Math.sqrt((this.px - 420) ** 2 + (this.py - 260) ** 2) < 70; }
  save() {
    return { active: this.active, px: this.px, py: this.py, certPickedUp: this.certPickedUp, pickedMilItems: [...this.pickedMilItems] };
  }
  load(s) {
    if (!s) return;
    this.active         = s.active         || false;
    this.px             = s.px             || 100;
    this.py             = s.py             || 280;
    this.certPickedUp   = s.certPickedUp   || false;
    this.pickedMilItems = new Set(s.pickedMilItems || []);
  }
}

function drawMilitaryOfficeScene(ctx, opts) {
  const { px, py, t, period, mil, nickNPC, cw, ch } = opts;
  const NICK_X = 370, NICK_Y = 200, roomW = 560;
  const camX = Math.max(0, Math.min(roomW - cw, px - cw / 2));

  ctx.save();
  ctx.translate(-camX, 0);

  ctx.fillStyle = '#555560'; ctx.fillRect(0, 0, roomW, ch);
  ctx.fillStyle = '#7a7a70'; ctx.fillRect(0, 100, roomW, ch - 100);

  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
  for (let gx = 0; gx < roomW; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 100); ctx.lineTo(gx, ch); ctx.stroke(); }
  for (let gy = 100; gy < ch; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(roomW, gy); ctx.stroke(); }

  ctx.fillStyle = '#5a3010'; ctx.fillRect(10, 200, 55, 120);
  ctx.fillStyle = '#7a4820'; ctx.fillRect(13, 203, 49, 114);
  ctx.fillStyle = '#c0a040'; ctx.beginPath(); ctx.arc(52, 263, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,180,0.8)'; ctx.font = 'bold 9px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('ВЫХОД', 37, 222);

  const cabColors = ['#5a5a6a','#484858','#525262'];
  for (let ci = 0; ci < 3; ci++) {
    const cx2 = 60 + ci * 72;
    ctx.fillStyle = cabColors[ci % cabColors.length]; ctx.fillRect(cx2, 85, 65, 80);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
    for (let di = 0; di < 3; di++) {
      ctx.strokeRect(cx2 + 4, 88 + di * 24, 57, 20);
      ctx.fillStyle = '#c0b870'; ctx.fillRect(cx2 + 26, 96 + di * 24, 13, 5);
    }
  }

  ctx.fillStyle = '#3a2810'; ctx.fillRect(280, 140, 180, 80);
  ctx.fillStyle = '#4a3418'; ctx.fillRect(280, 140, 180, 10);
  ctx.fillStyle = '#f0e8d0';
  ctx.fillRect(295, 148, 50, 35); ctx.fillRect(360, 145, 60, 40); ctx.fillRect(420, 150, 30, 28);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.5;
  for (let li = 0; li < 5; li++) {
    ctx.beginPath(); ctx.moveTo(297, 155 + li * 5); ctx.lineTo(340, 155 + li * 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(362, 152 + li * 5); ctx.lineTo(415, 152 + li * 5); ctx.stroke();
  }
  ctx.fillStyle = '#888880'; ctx.fillRect(455, 143, 4, 30);
  ctx.fillStyle = '#a0a090'; ctx.beginPath(); ctx.ellipse(455, 143, 15, 8, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,180,0.5)'; ctx.beginPath(); ctx.ellipse(455, 155, 12, 7, -0.5, 0, Math.PI * 2); ctx.fill();

  const boxY = [250, 278, 306], boxColors = ['#6a5030','#5a4228','#4a3420'];
  for (let bi = 0; bi < 3; bi++) {
    ctx.fillStyle = boxColors[bi]; ctx.fillRect(450, boxY[bi], 90, 30);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.strokeRect(450, boxY[bi], 90, 30);
    ctx.fillStyle = 'rgba(200,170,100,0.4)'; ctx.fillRect(470, boxY[bi], 50, 5);
  }

  const fanX = 470, fanY = 105;
  ctx.save(); ctx.translate(fanX, fanY);
  ctx.fillStyle = '#404040'; ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.stroke();
  ctx.save(); ctx.rotate(t * 3);
  ctx.fillStyle = 'rgba(180,180,190,0.7)';
  for (let bl = 0; bl < 4; bl++) { ctx.save(); ctx.rotate(bl * Math.PI / 2); ctx.beginPath(); ctx.ellipse(12, 0, 10, 5, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  ctx.restore();
  ctx.fillStyle = '#666'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  [[150,330],[220,310],[300,380],[340,320]].forEach(([ppx, ppy]) => {
    ctx.save(); ctx.translate(ppx, ppy); ctx.rotate(Math.sin(ppx * 0.1) * 0.4);
    ctx.fillStyle = '#e8e0cc'; ctx.fillRect(-15, -8, 30, 20);
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 0.5;
    for (let li = 0; li < 3; li++) { ctx.beginPath(); ctx.moveTo(-10, -2 + li * 5); ctx.lineTo(10, -2 + li * 5); ctx.stroke(); }
    ctx.restore();
  });

  ctx.fillStyle = '#8a6030'; ctx.fillRect(310, 85, 100, 60);
  ctx.fillStyle = '#a08040'; ctx.fillRect(313, 88, 94, 54);
  const noticeColors = ['#f0e8d0','#d0e8f0','#f0d8d0'];
  [[318,93,35,20],[360,91,40,18],[318,117,40,18],[365,115,35,20]].forEach(([nx,ny,nw,nh], i) => {
    ctx.fillStyle = noticeColors[i % noticeColors.length]; ctx.fillRect(nx, ny, nw, nh);
    ctx.fillStyle = '#c04040'; ctx.beginPath(); ctx.arc(nx + nw / 2, ny, 3, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.font = '7px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('ОБЪЯВЛЕНИЯ', 360, 150);

  if (!mil.certPickedUp) {
    const certX = 420, certY = 260, pulse = Math.sin(t * 2.5) * 0.3 + 0.7;
    const grd = ctx.createRadialGradient(certX, certY, 2, certX, certY, 28);
    grd.addColorStop(0, `rgba(255,220,80,${0.45 * pulse})`); grd.addColorStop(1, 'rgba(255,220,80,0)');
    ctx.fillStyle = grd; ctx.fillRect(certX - 30, certY - 30, 60, 60);
    ctx.save(); ctx.translate(certX, certY); ctx.rotate(Math.sin(t * 0.6) * 0.08 - 0.18); ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#f5f0d8'; ctx.fillRect(-12, -16, 26, 32);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; ctx.strokeRect(-12, -16, 26, 32);
    ctx.strokeStyle = 'rgba(0,0,80,0.25)'; ctx.lineWidth = 0.8;
    for (let li = 0; li < 4; li++) { ctx.beginPath(); ctx.moveTo(-7, -8 + li * 7); ctx.lineTo(9, -8 + li * 7); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.restore();
    const distToCert = Math.sqrt((px - certX) ** 2 + (py - certY) ** 2);
    if (distToCert < 70) {
      ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.3; ctx.font = '13px serif'; ctx.textAlign = 'center';
      ctx.fillText('📄', certX, certY - 22 + Math.sin(t * 2) * 3); ctx.globalAlpha = 1; ctx.restore();
    }
  }

  if (nickNPC && (nickNPC.questStage || 0) >= 3) {
    const nickItems = [
      { id:'mo_mug',      picked: mil.pickedMilItems.has('mo_mug'),      x:305, y:155, label:'☕' },
      { id:'mo_scarf',    picked: mil.pickedMilItems.has('mo_scarf'),    x:118, y:232, label:'🧣' },
      { id:'mo_backpack', picked: mil.pickedMilItems.has('mo_backpack'), x:500, y:362, label:'🎒' },
      { id:'mo_cassette', picked: mil.pickedMilItems.has('mo_cassette'), x:428, y:298, label:'📼' },
    ];
    const furnitureCenters = { mo_mug:{px:298,py:238}, mo_scarf:{px:118,py:238}, mo_backpack:{px:500,py:364}, mo_cassette:{px:428,py:304} };
    for (const ni of nickItems) {
      if (ni.picked) continue;
      const pulse = Math.sin(t * 2.2 + ni.x * 0.01) * 0.3 + 0.7;
      const fc = furnitureCenters[ni.id];
      const dist = Math.sqrt((px - fc.px) ** 2 + (py - fc.py) ** 2);
      const grd = ctx.createRadialGradient(ni.x, ni.y, 2, ni.x, ni.y, 22);
      grd.addColorStop(0, `rgba(255,200,60,${0.4 * pulse})`); grd.addColorStop(1, 'rgba(255,200,60,0)');
      ctx.fillStyle = grd; ctx.fillRect(ni.x - 24, ni.y - 24, 48, 48);
      ctx.save(); ctx.font = '16px serif'; ctx.textAlign = 'center';
      ctx.globalAlpha = 0.85 + Math.sin(t * 1.6 + ni.x) * 0.12;
      ctx.fillText(ni.label, ni.x, ni.y + 6 + Math.sin(t * 1.4 + ni.x * 0.02) * 3);
      ctx.globalAlpha = 1; ctx.restore();
      if (dist < 65) {
        ctx.save(); ctx.globalAlpha = 0.6 + Math.sin(t * 3) * 0.3;
        ctx.font = '10px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe080';
        ctx.fillText('[E]', ni.x, ni.y - 18 + Math.sin(t * 2) * 2); ctx.globalAlpha = 1; ctx.restore();
      }
    }
  }

  if (nickNPC) {
    drawHumanNPC(ctx, { id:'nick', x:NICK_X, y:NICK_Y, t, facing:-1, moving:false, trust:nickNPC.trust, emotion:nickNPC.emotion });
    ctx.save();
    const badgeW = 36;
    ctx.fillStyle = 'rgba(20,10,0,0.75)';
    GFX.roundRect(ctx, NICK_X - badgeW / 2, NICK_Y - 52, badgeW, 16, 4); ctx.fill();
    ctx.fillStyle = '#ffcc88'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Ник', NICK_X, NICK_Y - 40);
    ctx.restore();
    const distToNick = Math.sqrt((px - NICK_X) ** 2 + (py - NICK_Y) ** 2);
    if (distToNick < 150) {
      ctx.font = '18px serif'; ctx.textAlign = 'center';
      ctx.fillText('💬', NICK_X, NICK_Y - 66 + Math.sin(t * 1.8) * 3);
    }
  }

  ctx.save();
  drawCat(ctx, { x: px, y: py, facing: 1, t: t, moving: false, food: 80, mood: 80 });
  ctx.restore();

  const tints = { morning:'rgba(255,180,80,0.07)', day:'rgba(0,0,0,0)', evening:'rgba(180,60,10,0.15)', night:'rgba(8,4,20,0.50)' };
  const tint = tints[period] || tints.day;
  if (tint !== 'rgba(0,0,0,0)') { ctx.fillStyle = tint; ctx.fillRect(0, 0, roomW, ch); }

  ctx.fillStyle = 'rgba(30,20,10,0.7)'; ctx.fillRect(0, 0, roomW, 32);
  ctx.fillStyle = 'rgba(200,190,160,0.9)'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'left';
  ctx.fillText('📋 Военкомат', 12, 22);

  ctx.restore();

  if (mil.fadeAlpha > 0) {
    ctx.fillStyle = `rgba(0,0,0,${mil.fadeAlpha})`; ctx.fillRect(0, 0, cw, ch);
  }
}
