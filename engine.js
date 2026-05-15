'use strict';

/* ──────────────────────────────────────────────
   CAMERA
   ────────────────────────────────────────────── */
class Camera {
  constructor() { this.x = 0; this.y = 0; this.targetX = 0; this.targetY = 0; this.smoothing = 0.13; this.shakeX = 0; this.shakeY = 0; this.shakeDur = 0; }
  follow(px, py, canvasW, canvasH, worldW, worldH) {
    this.targetX = px - canvasW / 2;
    this.targetY = py - canvasH / 2;
    this.targetX = Math.max(0, Math.min(worldW - canvasW, this.targetX));
    this.targetY = Math.max(0, Math.min(worldH - canvasH, this.targetY));
    const dist = Math.sqrt((this.targetX-this.x)**2 + (this.targetY-this.y)**2);
    const ease = Math.min(1, this.smoothing + dist * 0.0003);
    this.x += (this.targetX - this.x) * ease;
    this.y += (this.targetY - this.y) * ease;
  }
  shake(intensity = 6, dur = 0.3) { this.shakeX = (Math.random()-0.5)*intensity*2; this.shakeY = (Math.random()-0.5)*intensity; this.shakeDur = dur; }
}

/* ──────────────────────────────────────────────
   AMBIENT WORLD SYSTEM
   ────────────────────────────────────────────── */
class AmbientSystem {
  constructor() {
    this.birds   = [];
    this.leaves  = [];
    this.puddles = [];
    this._birdTimer = 0;
    this._leafTimer = 0;
    this._hasPuddles = false;
  }
  update(dt, time, weather) {
    const period = time.period;
    this._birdTimer -= dt;
    if (this._birdTimer <= 0 && (period === 'morning' || period === 'day') && this.birds.length < 8) {
      this._birdTimer = 10 + Math.random() * 15;
      const count = 2 + Math.floor(Math.random() * 3);
      const startY = 55 + Math.random() * 120;
      for (let i = 0; i < count; i++) {
        this.birds.push({
          x: -80, y: startY + i * 14 + (Math.random()-0.5)*6,
          speed: 48 + Math.random() * 30,
          phase: Math.random() * Math.PI * 2,
          size: 3.5 + Math.random() * 2.5
        });
      }
    }
    this.birds.forEach(b => { b.x += b.speed * dt; b.phase += dt * 9; });
    this.birds = this.birds.filter(b => b.x < 1300);

    this._leafTimer -= dt;
    if (this._leafTimer <= 0 && weather.current !== 'rain' && this.leaves.length < 14) {
      this._leafTimer = 2.5 + Math.random() * 4;
      this.leaves.push({
        x: 480 + Math.random() * 520,
        y: -15,
        vx: (Math.random()-0.5) * 22,
        vy: 18 + Math.random() * 28,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random()-0.5) * 2.5,
        color: ['#c8a020','#e08030','#cc6010','#88aa20','#b8941a','#d4b440'][Math.floor(Math.random()*6)],
        size: 4.5 + Math.random() * 4.5
      });
    }
    this.leaves.forEach(l => {
      l.x += (l.vx + Math.sin(GFX.t * 1.6 + l.y * 0.05) * 10) * dt;
      l.y += l.vy * dt;
      l.rot += l.rotV * dt;
    });
    this.leaves = this.leaves.filter(l => l.y < 750);

    if (weather.current === 'rain' && !this._hasPuddles) {
      this._hasPuddles = true;
      this.puddles = [
        { x:320, y:620, w:46, h:12, ph:0 },
        { x:510, y:695, w:38, h:10, ph:0.8 },
        { x:680, y:560, w:54, h:13, ph:1.6 },
        { x:205, y:745, w:42, h:11, ph:2.3 }
      ];
    }
    if (weather.current !== 'rain' && period === 'day' && this._hasPuddles) this._hasPuddles = false;
    this.puddles.forEach(p => p.ph += dt * 2.2);
  }
}

/* ──────────────────────────────────────────────
   INPUT
   ────────────────────────────────────────────── */
class Input {
  constructor() {
    this.keys = {};
    this.joyX = 0; this.joyY = 0;
    this.actionPressed = false;
    this.meowPressed = false;
    document.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'Space') { e.preventDefault(); this.meowPressed = true; }
      if (e.code === 'KeyE')  { this.actionPressed = true; }
    });
    document.addEventListener('keyup', e => { this.keys[e.code] = false; });
  }
  get dx() {
    let x = this.joyX;
    if (this.keys['ArrowLeft']  || this.keys['KeyA']) x -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) x += 1;
    return Math.max(-1, Math.min(1, x));
  }
  get dy() {
    let y = this.joyY;
    if (this.keys['ArrowUp']   || this.keys['KeyW']) y -= 1;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) y += 1;
    return Math.max(-1, Math.min(1, y));
  }
  consumeAction() { const v = this.actionPressed; this.actionPressed = false; return v; }
  consumeMeow()   { const v = this.meowPressed;   this.meowPressed   = false; return v; }
}

/* ──────────────────────────────────────────────
   MOBILE CONTROLS
   ────────────────────────────────────────────── */
class MobileControls {
  constructor(input, game) {
    this.input = input;
    this.game  = game;
    this.joyActive = false;
    this.joyId = null;
    this.joyOriginX = 0; this.joyOriginY = 0;
    this.knob = document.getElementById('joystick-knob');
    this.base = document.getElementById('joystick-base');
    this.zone = document.getElementById('joystick-zone');
    this._setupJoystick();
    this._setupButtons();
    this._preventScroll();
  }
  _preventScroll() {
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    document.addEventListener('wheel', e => e.preventDefault(), { passive: false });
  }
  _setupJoystick() {
    const onStart = e => {
      const t = e.touches ? e.touches[0] : e;
      const rect = this.base.getBoundingClientRect();
      this.joyOriginX = rect.left + rect.width / 2;
      this.joyOriginY = rect.top  + rect.height / 2;
      this.joyActive = true; this.joyId = t.identifier || 0;
      e.preventDefault();
    };
    const onMove = e => {
      if (!this.joyActive) return;
      const touches = e.touches || [e];
      let t = null;
      for (const touch of touches) { if ((touch.identifier || 0) === this.joyId) { t = touch; break; } }
      if (!t && touches[0]) t = touches[0];
      if (!t) return;
      const R = 38, dx = t.clientX - this.joyOriginX, dy = t.clientY - this.joyOriginY;
      const dist = Math.sqrt(dx*dx+dy*dy), clamp = Math.min(dist, R);
      const nx = dist ? dx/dist : 0, ny = dist ? dy/dist : 0;
      this.knob.style.transform = `translate(${nx*clamp}px,${ny*clamp}px)`;
      this.input.joyX = dist > 6 ? nx : 0;
      this.input.joyY = dist > 6 ? ny : 0;
      e.preventDefault();
    };
    const onEnd = e => {
      this.joyActive = false; this.joyId = null;
      this.knob.style.transform = '';
      this.input.joyX = 0; this.input.joyY = 0;
    };
    this.zone.addEventListener('touchstart', onStart, {passive:false});
    this.zone.addEventListener('touchmove',  onMove,  {passive:false});
    this.zone.addEventListener('touchend',   onEnd,   {passive:false});
    this.zone.addEventListener('mousedown',  onStart);
    window.addEventListener('mousemove', e => { if (this.joyActive) onMove(e); });
    window.addEventListener('mouseup',   onEnd);
  }
  _setupButtons() {
    const g = this.game;
    const tap = (id, fn) => {
      const el = document.getElementById(id);
      el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
    };
    tap('ab-action', () => { this.input.actionPressed = true; g.telegram.vibrate(20); });
    tap('ab-meow',   () => { this.input.meowPressed   = true; g.telegram.vibrate(15); });
    tap('ab-inv',    () => { g.ui.toggle('inventory-screen'); g.audio.uiClick(); });
    tap('ab-map',    () => { g.ui.toggle('map-screen'); g.audio.uiClick(); });
    tap('ab-quest',  () => { g.ui.toggle('quest-screen'); g.audio.uiClick(); });
    tap('ab-pause',  () => { g.togglePause(); g.audio.uiClick(); });
  }
}

/* ──────────────────────────────────────────────
   PLAYER (Рыжик)
   ────────────────────────────────────────────── */
class Player {
  constructor() {
    this.x = 320; this.y = 360;
    this.w = 36;  this.h = 36;
    this.speed = 120;
    this.facing = 1;
    this.moving = false;
    this.frame = 0; this.frameTime = 0; this.frameRate = 0.18;
    this.tailAngle = 0; this.tailTime = 0;
    this.actionAnim = null; this.actionTime = 0;
    this.jumpY = 0; this.jumpVel = 0; this.jumping = false;
    this.jumpCount = 0;
    this.food    = 80;
    this.energy  = 100;
    this.mood    = 90;
    this.clean   = 100;
    this.curiosity = 60;
    this.glory   = 0;
    this.purrCount = 0;
    this._statTimer = 0;
  }
  get speedMod() {
    let s = 1;
    if (this.energy < 20) s *= 0.5;
    else if (this.energy < 50) s *= 0.75;
    return s;
  }
  update(dt, input, world) {
    let dx = input.dx, dy = input.dy;
    this.moving = (Math.abs(dx) + Math.abs(dy)) > 0.1;
    if (this.moving) {
      if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
      const spd = this.speed * this.speedMod * dt;
      const nx = this.x + dx * spd, ny = this.y + dy * spd;
      if (!world.isSolid(nx, this.y, this.w, this.h)) this.x = nx;
      if (!world.isSolid(this.x, ny, this.w, this.h)) this.y = ny;
      this.x = Math.max(this.w/2, Math.min(world.width - this.w/2, this.x));
      this.y = Math.max(this.h/2, Math.min(world.height - this.h/2, this.y));
    }
    if (this.moving) {
      this.frameTime += dt;
      if (this.frameTime >= this.frameRate) { this.frameTime = 0; this.frame = (this.frame + 1) % 4; }
    } else { this.frame = 0; }
    this.tailTime += dt * (this.moving ? 4 : 1.5);
    this.tailAngle = Math.sin(this.tailTime) * (this.moving ? 0.6 : 0.25);
    if (this.jumping) {
      this.jumpVel += 600 * dt;
      this.jumpY += this.jumpVel * dt;
      if (this.jumpY >= 0) { this.jumpY = 0; this.jumpVel = 0; this.jumping = false; this.jumpCount++; }
    }
    this._statTimer += dt;
    if (this._statTimer >= 30) {
      this._statTimer = 0;
      this.food   = Math.max(0, this.food - 2);
      this.energy = Math.max(0, this.energy - 1);
      this.clean  = Math.max(0, this.clean - 1);
      if (this.food < 30) this.mood = Math.max(0, this.mood - 3);
    }
    if (this.actionAnim) {
      this.actionTime -= dt;
      if (this.actionTime <= 0) this.actionAnim = null;
    }
  }
  jump() {
    if (!this.jumping) { this.jumping = true; this.jumpVel = -280; this.jumpY = 0; }
  }
  playAction(anim) { this.actionAnim = anim; this.actionTime = 0.6; }
  draw(ctx) {
    drawCat(ctx, {
      x: this.x, y: this.y,
      facing: this.facing,
      frame: this.frame,
      moving: this.moving,
      jumping: this.jumping,
      jumpY: this.jumpY,
      actionAnim: this.actionAnim,
      t: GFX.t,
      food: this.food,
      mood: this.mood,
    });
  }
}

/* ──────────────────────────────────────────────
   NPC CLASS
   ────────────────────────────────────────────── */
class NPC {
  constructor(data) {
    Object.assign(this, data);
    this.wx = data.x; this.wy = data.y;
    this.trust = 0;
    this.questStage = data.questStage || 0;
    this.visible = true;
    this.facing = 1;
    this.animTime = 0;
    this.bobY = 0;
    this.emotion = null; this.emotionTime = 0;
    this.moveTimer = 0; this.moveTarget = null;
    this.idleActivity = 'wander';
  }
  get trustLabel() { return this.trustLevels[Math.min(this.trust, this.trustLevels.length-1)]; }
  distTo(px, py) { return Math.sqrt((this.wx-px)**2 + (this.wy-py)**2); }
  update(dt, period) {
    this.animTime += dt;
    this.bobY = Math.sin(this.animTime * 1.8) * 2;
    if (this.emotion) { this.emotionTime -= dt; if (this.emotionTime <= 0) this.emotion = null; }
    if (this.id === 'nick' && (this.questStage || 0) < 4) {
      this.visible = false;
      return;
    }
    this.moveTimer += dt;
    const beh = (typeof NPC_BEHAVIORS !== 'undefined') ? NPC_BEHAVIORS[this.id] : null;
    if (this.moveTimer > 4 && this.schedule) {
      this.moveTimer = 0;
      const pos = this.schedule[period];
      if (pos) {
        this.visible = true;
        if (beh && beh.waypoints && beh.waypoints[period]) {
          const pts = beh.waypoints[period];
          const pt = pts[Math.floor(Math.random() * pts.length)];
          this.moveTarget = { x: pt[0] + (Math.random()-0.5)*12, y: pt[1] + (Math.random()-0.5)*12 };
        } else {
          this.moveTarget = { x: pos[0] + (Math.random()-0.5)*38, y: pos[1] + (Math.random()-0.5)*38 };
        }
        this.idleActivity = beh && beh.idle && beh.idle[period] ? beh.idle[period] : 'wander';
      } else {
        this.visible = false;
      }
    }
    if (this.moveTarget) {
      const dx = this.moveTarget.x - this.wx, dy = this.moveTarget.y - this.wy;
      const d = Math.sqrt(dx*dx+dy*dy);
      if (d < 4) { this.moveTarget = null; }
      else {
        if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
        const spd = Math.min(d * 2, 38) * dt;
        this.wx += dx/d*spd; this.wy += dy/d*spd;
      }
    }
    if (!this.emotion && this.idleActivity && Math.random() < dt * 0.06) {
      const actEmo = { guitar:'happy', camera:'happy', notebook:'surprise', tools:'awkward', tinker:'happy', work:'awkward', meditate:'sleep', sit:'sleep', wave:'happy' };
      if (actEmo[this.idleActivity]) this.showEmotion(actEmo[this.idleActivity]);
    }
  }
  showEmotion(e) { this.emotion = e; this.emotionTime = 2; }
  draw(ctx, period) {
    if (!this.visible) return;
    ctx.save();
    ctx.translate(this.wx, this.wy + this.bobY);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(0, 18, 14, 5, 0, 0, Math.PI*2); ctx.fill();
    if (this.human) {
      this._drawHuman(ctx);
    } else {
      this._drawAnimal(ctx);
    }
    if (this.emotion) {
      const emoMap = { happy:'😊', sad:'😢', angry:'😠', surprise:'😲', sleep:'😴', laugh:'😄', awkward:'😅' };
      ctx.font = '16px serif'; ctx.textAlign = 'center';
      ctx.fillText(emoMap[this.emotion] || '💭', 0, -46);
    }
    ctx.fillStyle = this.color || '#fff';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3;
    ctx.strokeText(this.name, 0, -38);
    ctx.fillText(this.name, 0, -38);
    ctx.restore();
  }
  _drawHuman(ctx) {
    ctx.fillStyle = this.color || '#888';
    ctx.fillRect(-10, -20, 20, 28);
    ctx.fillStyle = '#f5c5a0';
    ctx.beginPath(); ctx.ellipse(0, -26, 10, 12, 0, 0, Math.PI*2); ctx.fill();
    ctx.font = '22px serif'; ctx.textAlign = 'center';
    ctx.fillText(this.emoji, 0, -19);
  }
  _drawAnimal(ctx) {
    ctx.font = '28px serif'; ctx.textAlign = 'center';
    ctx.fillText(this.emoji, 0, -10);
  }
}

/* ──────────────────────────────────────────────
   INVENTORY SYSTEM
   ────────────────────────────────────────────── */
class Inventory {
  constructor() {
    this.slots = 20;
    this.items = [];
  }
  add(itemId, qty = 1) {
    const existing = this.items.find(i => i.id === itemId);
    if (existing) { existing.qty += qty; return true; }
    if (this.items.length >= this.slots) return false;
    this.items.push({ id: itemId, item: ITEMS[itemId], qty });
    return true;
  }
  remove(itemId, qty = 1) {
    const idx = this.items.findIndex(i => i.id === itemId);
    if (idx < 0) return false;
    this.items[idx].qty -= qty;
    if (this.items[idx].qty <= 0) this.items.splice(idx, 1);
    return true;
  }
  has(itemId) { return this.items.some(i => i.id === itemId); }
  count(itemId) { const i = this.items.find(x => x.id === itemId); return i ? i.qty : 0; }
  render(containerId, infoId, game) {
    const grid = document.getElementById(containerId);
    const info = document.getElementById(infoId);
    grid.innerHTML = '';
    this.items.forEach(slot => {
      const div = document.createElement('div');
      div.className = 'inv-slot';
      div.innerHTML = `<span class="inv-icon">${slot.item.icon[0]||'?'}</span><span class="inv-name">${slot.item.name}</span>`;
      if (slot.qty > 1) div.innerHTML += `<span style="font-size:9px;color:#f4873a">×${slot.qty}</span>`;
      div.onclick = () => {
        info.innerHTML = `<b>${slot.item.icon[0]} ${slot.item.name}</b><br>${slot.item.desc}${slot.item.rare?'<span style="color:#ffd844"> ★ Редкий</span>':''}`;
        if (slot.id === 'dryCat' || slot.id === 'fish' || slot.id === 'apple') {
          const btn = document.createElement('button');
          btn.textContent = 'Использовать'; btn.className = 'mg-btn';
          btn.style.marginTop = '6px';
          btn.onclick = () => {
            game.player.food = Math.min(100, game.player.food + (slot.id === 'fish' ? 25 : slot.id === 'apple' ? 15 : 20));
            game.player.mood = Math.min(100, game.player.mood + 5);
            game.inventory.remove(slot.id);
            game.audio.pickup();
            game.ui.notify('😋 Вкусно! Сытость восстановлена.');
            game.ui.renderInventory();
          };
          info.appendChild(btn);
        }
        const questItemNpc = {
          'cassette':'lyokha', 'pick':'igor', 'diary':'nena',
          'flashPart':'kristina', 'sticker':'liza',
        };
        if (questItemNpc[slot.id]) {
          const nearNpc = game.npcs.find(n => n.id === questItemNpc[slot.id] && n.visible && n.distTo(game.player.x, game.player.y) < 100);
          if (nearNpc) {
            const giveBtn = document.createElement('button');
            giveBtn.textContent = `Отдать ${nearNpc.name}`; giveBtn.className = 'mg-btn';
            giveBtn.style.marginTop = '6px';
            giveBtn.onclick = () => {
              game.inventory.remove(slot.id);
              game.audio.questDone();
              nearNpc.trust = Math.min(3, nearNpc.trust + 1);
              nearNpc.showEmotion('happy');
              const questMap = { 'cassette':'q_lyokha','pick':'q_igor','diary':'q_nena','flashPart':'q_kristina','sticker':'q_liza' };
              if (questMap[slot.id] && game.quests.isActive(questMap[slot.id])) game._onQuestAdvance(questMap[slot.id]);
              game.ui.notify(`✨ ${nearNpc.name} рад(а)!`);
              game.ui.renderInventory();
            };
            info.appendChild(giveBtn);
          }
        }
        game.audio.uiClick();
        document.querySelectorAll('.inv-slot').forEach(s => s.classList.remove('selected'));
        div.classList.add('selected');
      };
      grid.appendChild(div);
    });
    const empty = this.slots - this.items.length;
    for (let i = 0; i < Math.min(empty, 6); i++) {
      const div = document.createElement('div'); div.className = 'inv-slot empty'; div.innerHTML = '<span class="inv-icon">·</span>';
      grid.appendChild(div);
    }
  }
}

/* ──────────────────────────────────────────────
   QUEST SYSTEM
   ────────────────────────────────────────────── */
class QuestSystem {
  constructor() {
    this.active    = new Set(['q01','q02','q03','q_lyokha','q_igor','q_ind1']);
    this.completed = new Set();
    this.progress  = {};
    QUESTS.forEach(q => { if (q.unlock) this.active.add(q.id); });
    this.active.forEach(id => { this.progress[id] = 0; });
  }
  isActive(id) { return this.active.has(id); }
  isDone(id)   { return this.completed.has(id); }
  currentStep(id) {
    const q = QUESTS.find(q => q.id === id);
    if (!q) return null;
    const step = this.progress[id] || 0;
    return q.steps[step] || null;
  }
  advanceStep(id) {
    const q = QUESTS.find(x => x.id === id);
    if (!q || !this.active.has(id)) return false;
    this.progress[id] = (this.progress[id] || 0) + 1;
    if (this.progress[id] >= q.steps.length) {
      this.active.delete(id);
      this.completed.add(id);
      return 'complete';
    }
    return 'advance';
  }
  unlock(id) {
    if (!this.active.has(id) && !this.completed.has(id)) {
      this.active.add(id);
      this.progress[id] = 0;
    }
  }
  getActive()    { return QUESTS.filter(q => this.active.has(q.id)); }
  getCompleted() { return QUESTS.filter(q => this.completed.has(q.id)); }
  get mainQuest() {
    const a = this.getActive();
    return a.length > 0 ? a[0] : (this.getCompleted().slice(-1)[0] || null);
  }
  render(listId, tabState, game) {
    const list = document.getElementById(listId);
    list.innerHTML = '';
    const quests = tabState === 'active' ? this.getActive() : this.getCompleted();
    if (quests.length === 0) {
      list.innerHTML = `<div style="text-align:center;opacity:0.5;padding:20px">${tabState==='active'?'Нет активных квестов!':'Квесты ещё не выполнены'}</div>`;
      return;
    }
    quests.forEach(q => {
      const div = document.createElement('div');
      div.className = 'quest-card ' + (tabState === 'active' ? 'active-q' : 'done-q');
      const step = this.currentStep(q.id);
      div.innerHTML = `
        <div class="qc-title">${q.icon} ${q.title}</div>
        <div class="qc-desc">${q.desc}</div>
        ${step ? `<div class="qc-step">▶ ${step}</div>` : tabState==='done'?'<div class="qc-step" style="color:#88ffaa">✓ Выполнено!</div>':''}
        ${q.reward ? `<div style="font-size:10px;color:#aaa;margin-top:4px">Награда: ${q.reward.item ? ITEMS[q.reward.item]?.icon[0]+' ' : ''}${q.reward.xp ? '⭐'+q.reward.xp : ''}</div>` : ''}
      `;
      list.appendChild(div);
    });
  }
}

/* ──────────────────────────────────────────────
   DIALOGUE SYSTEM
   ────────────────────────────────────────────── */
class DialogueSystem {
  constructor(audio, telegram) {
    this.audio    = audio;
    this.telegram = telegram;
    this.active   = false;
    this.npc      = null;
    this.lines    = [];
    this.lineIdx  = 0;
    this.choices  = null;
    this.onEnd    = null;
    this._typing  = false;
    this._typeTimer = null;
    this._fullText  = '';
    this._textEl    = null;
    this._hintEl    = null;
  }
  start(npc, lines, onEnd = null) {
    this.npc    = npc;
    this.lines  = lines.map(l => typeof l === 'string' ? { speaker: 'npc', text: l, emotion: 'neutral' } : l);
    this.lineIdx= 0;
    this.active = true;
    this.onEnd  = onEnd;
    this.choices= null;
    this._show();
    this._renderLine();
    this.audio.uiClick();
    this.telegram.vibrate(15);
  }
  startWithChoices(npc, text, choices) {
    this.npc    = npc;
    this.lines  = [{ speaker: 'npc', text, emotion: 'neutral' }];
    this.lineIdx= 0;
    this.active = true;
    this.choices= choices;
    this.onEnd  = null;
    this._show();
    this._renderLine();
  }
  startStory(npc, lines, onEnd = null) {
    this.start(npc, lines, onEnd);
  }
  advance() {
    if (!this.active) return;
    if (this._typing) {
      this._skipTyping();
      return;
    }
    if (this.choices && this.lineIdx >= this.lines.length - 1) return;
    this.lineIdx++;
    if (this.lineIdx >= this.lines.length) {
      this.close();
      return;
    }
    this._renderLine();
    this.audio.uiClick();
  }
  close() {
    this._stopTyping();
    this.active = false;
    document.getElementById('dialogue-box').style.display = 'none';
    if (this.onEnd) { const fn = this.onEnd; this.onEnd = null; fn(); }
  }
  _show() {
    document.getElementById('dialogue-box').style.display = 'flex';
  }
  _renderLine() {
    const line = this.lines[this.lineIdx];
    if (!line) return;
    const isRyzhik = line.speaker === 'ryzhik';
    const emotion  = line.emotion || 'neutral';
    const box   = document.getElementById('dialogue-box');
    const port  = document.getElementById('dlg-portrait');
    const nameEl= document.getElementById('dlg-name');
    const trust = document.getElementById('dlg-trust');
    const chEl  = document.getElementById('dlg-choices');
    const hint  = document.getElementById('dlg-tap-hint');
    this._textEl = document.getElementById('dlg-text');
    this._hintEl = hint;
    chEl.innerHTML = '';
    if (isRyzhik) {
      nameEl.textContent = 'Рыжик';
      nameEl.style.color = '#f07030';
      trust.textContent  = '';
      this._drawPortrait(port, 'ryzhik', emotion, '#f07030');
      port.style.borderColor = '#f07030';
      box.classList.add('dlg-ryzhik-speaking');
    } else {
      const npc = this.npc;
      nameEl.textContent = npc ? npc.name : '';
      nameEl.style.color = npc ? (npc.color || '#f4873a') : '#f4873a';
      trust.textContent  = npc ? (npc.trustLabel || '') : '';
      this._drawPortrait(port, npc ? npc.id : null, emotion, npc ? npc.color : '#f4873a');
      port.style.borderColor = npc ? (npc.color || '#f4873a') : '#f4873a';
      box.classList.remove('dlg-ryzhik-speaking');
    }
    const isLast = this.lineIdx >= this.lines.length - 1;
    if (this.choices && isLast) {
      hint.style.display = 'none';
      this._typeText(line.text, () => {
        this.choices.forEach(ch => {
          const btn = document.createElement('button');
          btn.className = 'dlg-choice';
          btn.textContent = ch.text;
          btn.onclick = () => { this.audio.uiClick(); this.close(); if (ch.action) ch.action(); };
          chEl.appendChild(btn);
        });
      });
    } else {
      hint.style.display = 'block';
      hint.textContent = isRyzhik ? '😺 Нажми чтобы продолжить' : 'Тапни или нажми ⚡ для продолжения';
      this._typeText(line.text, null);
    }
  }
  _drawPortrait(portEl, npcId, emotion, color) {
    let canvas = portEl.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = 80; canvas.height = 80;
      canvas.style.cssText = 'width:68px;height:68px;border-radius:50%;';
      portEl.innerHTML = '';
      portEl.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 80, 80);
    const nc = color || '#f4873a';
    const bgg = ctx.createRadialGradient(40,40,5,40,40,40);
    bgg.addColorStop(0, nc + '44'); bgg.addColorStop(1, nc + '11');
    ctx.fillStyle = bgg; ctx.beginPath(); ctx.arc(40,40,40,0,Math.PI*2); ctx.fill();
    if (npcId && typeof drawPortrait === 'function') {
      const moodMap = { neutral:'neutral', happy:'happy', sad:'sad', curious:'neutral', surprised:'surprised', nostalgic:'sad' };
      drawPortrait(ctx, npcId, moodMap[emotion] || 'neutral');
    } else if (this.npc && this.npc.emoji) {
      ctx.font = '38px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(this.npc.emoji, 40, 42);
    }
  }
  _typeText(text, onDone) {
    this._stopTyping();
    this._fullText = text;
    this._typing   = true;
    this._textEl.textContent = '';
    this._textEl.innerHTML = '<span class="dlg-cursor">▊</span>';
    let i = 0;
    const cursor = this._textEl.querySelector('.dlg-cursor');
    this._typeTimer = setInterval(() => {
      i++;
      this._textEl.textContent = text.slice(0, i);
      if (cursor && i < text.length) {
        this._textEl.appendChild(cursor);
      }
      if (i >= text.length) {
        this._stopTyping();
        this._typing = false;
        if (cursor && cursor.parentNode) cursor.parentNode.removeChild(cursor);
        if (onDone) onDone();
      }
    }, 28);
  }
  _skipTyping() {
    this._stopTyping();
    this._typing = false;
    if (this._textEl) this._textEl.textContent = this._fullText;
    if (this.choices && this.lineIdx >= this.lines.length - 1) {
      const chEl = document.getElementById('dlg-choices');
      chEl.innerHTML = '';
      this.choices.forEach(ch => {
        const btn = document.createElement('button');
        btn.className = 'dlg-choice';
        btn.textContent = ch.text;
        btn.onclick = () => { this.audio.uiClick(); this.close(); if (ch.action) ch.action(); };
        chEl.appendChild(btn);
      });
    }
  }
  _stopTyping() {
    if (this._typeTimer) { clearInterval(this._typeTimer); this._typeTimer = null; }
  }
}

/* ──────────────────────────────────────────────
   ACHIEVEMENT SYSTEM
   ────────────────────────────────────────────── */
class AchievementSystem {
  constructor(ui, audio, telegram) {
    this.ui       = ui;
    this.audio    = audio;
    this.telegram = telegram;
    this.unlocked = new Set();
  }
  unlock(id) {
    if (this.unlocked.has(id)) return;
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return;
    this.unlocked.add(id);
    this._popup(ach);
    this.audio.achievement();
    this.telegram.vibrateSuccess();
  }
  check(id) { return this.unlocked.has(id); }
  _popup(ach) {
    const pop  = document.getElementById('ach-popup');
    const icon = document.getElementById('ach-pop-icon');
    const nm   = document.getElementById('ach-pop-name');
    icon.textContent = ach.icon;
    nm.textContent   = ach.name;
    pop.style.display = 'flex';
    if (pop._timer) clearTimeout(pop._timer);
    pop._timer = setTimeout(() => { pop.style.display = 'none'; }, 3800);
  }
  render(gridId) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';
    ACHIEVEMENTS.forEach(a => {
      const div = document.createElement('div');
      const done = this.unlocked.has(a.id);
      div.className = 'ach-card ' + (done ? 'unlocked' : 'locked');
      div.innerHTML = `<div class="ach-icon">${a.secret && !done ? '❓' : a.icon}</div><div class="ach-name">${a.secret && !done ? '???' : a.name}</div>`;
      div.title = done ? a.desc : (a.secret ? '???' : a.desc);
      grid.appendChild(div);
    });
  }
}

/* ──────────────────────────────────────────────
   UI MANAGER
   ────────────────────────────────────────────── */
class UIManager {
  constructor(game) {
    this.game = game;
    this.openScreen = null;
    this._setupCloseButtons();
    this._setupQuestTabs();
    this._setupSettings();
  }
  _setupCloseButtons() {
    document.querySelectorAll('.ov-x[data-close]').forEach(btn => {
      btn.onclick = () => { this.close(btn.dataset.close); this.game.audio.uiClose(); };
    });
  }
  _setupQuestTabs() {
    this._questTab = 'active';
    document.querySelectorAll('.qtab').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.qtab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._questTab = btn.dataset.tab;
        this.game.quests.render('quest-list', this._questTab, this.game);
        this.game.audio.uiClick();
      };
    });
  }
  _setupSettings() {
    document.getElementById('vol-sfx').oninput   = e => this.game.audio.setVolSfx(+e.target.value);
    document.getElementById('vol-music').oninput  = e => this.game.audio.setVolMusic(+e.target.value);
    document.getElementById('chk-joystick').onchange = e => {
      const jz = document.getElementById('joystick-zone');
      jz.style.visibility = e.target.checked ? 'visible' : 'hidden';
    };
  }
  open(id) {
    if (this.openScreen && this.openScreen !== id) this.close(this.openScreen);
    document.getElementById(id).style.display = 'flex';
    this.openScreen = id;
    this.game.audio.uiClick();
    if (id === 'inventory-screen') this.renderInventory();
    if (id === 'quest-screen')     this.game.quests.render('quest-list', this._questTab, this.game);
    if (id === 'ach-screen')       this.game.achievements.render('ach-grid');
    if (id === 'map-screen')       this._renderBigmap();
    if (id === 'upgrade-screen')   this._renderUpgrades();
  }
  close(id) {
    document.getElementById(id).style.display = 'none';
    if (this.openScreen === id) this.openScreen = null;
    this.game.audio.uiClose();
  }
  toggle(id) { document.getElementById(id).style.display === 'none' ? this.open(id) : this.close(id); }
  isAnyOpen() { return !!this.openScreen; }
  renderInventory() { this.game.inventory.render('inv-grid', 'inv-info', this.game); }
  _renderBigmap() {
    const canvas = document.getElementById('bigmap-canvas');
    const ctx = canvas.getContext('2d');
    this.game.world.drawBigmap(ctx, this.game.unlockedZones, this.game.player.x, this.game.player.y, this.game.npcs);
    canvas.onclick = e => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width * this.game.world.width;
      const my = (e.clientY - rect.top)  / rect.height * this.game.world.height;
      ZONES.forEach(z => {
        const zx = z.x+600, zy = z.y+500;
        if (mx > zx && mx < zx+z.w && my > zy && my < zy+z.h) {
          document.getElementById('map-zone-info').textContent = `${z.icon} ${z.name}${this.game.unlockedZones.includes(z.id) ? '' : ' 🔒'}`;
        }
      });
    };
  }
  _renderUpgrades() {
    const grid = document.getElementById('upgrade-grid');
    grid.innerHTML = '';
    UPGRADES.forEach(u => {
      const owned = this.game.upgrades.has(u.id);
      const div = document.createElement('div');
      div.className = 'upg-card ' + (owned ? 'owned' : '');
      div.innerHTML = `<div class="upg-icon">${u.icon}</div><div class="upg-name">${u.name}</div><div class="upg-cost">${owned ? '✓ Куплено' : `Нужно: ${u.cost} ★`}</div>`;
      div.title = u.desc;
      if (!owned) {
        div.onclick = () => {
          if (this.game.player.glory >= u.cost) {
            this.game.player.glory -= u.cost;
            this.game.upgrades.add(u.id);
            this.game.audio.questDone();
            this.game.ui.notify(`✨ ${u.name} установлена!`);
            this._renderUpgrades();
          } else { this.game.ui.notify(`Нужно ${u.cost} ⭐ Слава`); this.game.audio.uiClose(); }
        };
      }
      grid.appendChild(div);
    });
  }
  notify(text, dur = 3000) {
    const cont = document.getElementById('notif-container');
    const el = document.createElement('div');
    el.className = 'notif'; el.textContent = text;
    cont.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, dur + 400);
  }
  updateStats(player) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.style.width = Math.max(0, Math.min(100, val)) + '%'; };
    set('sf-food', player.food);
    set('sf-energy', player.energy);
    set('sf-mood', player.mood);
    set('sf-clean', player.clean);
  }
  updateTime(time) {
    const ti = document.getElementById('time-icon'); if (ti) ti.textContent = time.icon;
    const h = time.hour; const hStr = `${h}:00`;
    const tl = document.getElementById('time-label'); if (tl) tl.textContent = `${time.periodRu} ${hStr}`;
    const dl = document.getElementById('day-label'); if (dl) dl.textContent = ` · День ${time.day}`;
  }
  updateWeather(weather) {
    const wi = document.getElementById('weather-icon'); if (wi) wi.textContent = weather.icon;
  }
  updateQuestTracker(quests) {
    const q = quests.mainQuest;
    const qn = document.getElementById('qt-name');
    const qs = document.getElementById('qt-step');
    if (q && qn) {
      qn.textContent = `${q.icon} ${q.title}`;
      qs.textContent = quests.currentStep(q.id) || '';
    }
  }
  setInteractHint(text) {
    const el = document.getElementById('interact-hint');
    if (!el) return;
    if (text) { el.textContent = text; el.style.display = 'block'; const al = document.getElementById('action-label'); if (al) al.textContent = text; }
    else { el.style.display = 'none'; const al = document.getElementById('action-label'); if (al) al.textContent = ''; }
  }
  showEvent(icon, text) {
    const ban = document.getElementById('event-banner');
    const ei = document.getElementById('ev-icon'); const et = document.getElementById('ev-text');
    ei.textContent = icon; et.textContent = text;
    ban.style.display = 'flex';
    if (ban._t) clearTimeout(ban._t);
    ban._t = setTimeout(() => { ban.style.display = 'none'; }, 4500);
  }
  showDailyReward(game) {
    const rewards = ['fish','apple','dryCat','pebble','seeds','button'];
    const item = rewards[Math.floor(Math.random() * rewards.length)];
    const itemData = ITEMS[item];
    const body = document.getElementById('daily-body');
    body.innerHTML = `<div style="font-size:48px">${itemData.icon[0]}</div><p>${itemData.name}</p><p style="font-size:12px;opacity:.6">${itemData.desc}</p>`;
    document.getElementById('daily-screen').style.display = 'flex';
    document.getElementById('btn-claim').onclick = () => {
      game.inventory.add(item);
      game.player.mood = Math.min(100, game.player.mood + 10);
      document.getElementById('daily-screen').style.display = 'none';
      game.audio.questDone();
      this.notify(`🎁 Получено: ${itemData.icon[0]} ${itemData.name}!`);
    };
  }
}

/* ──────────────────────────────────────────────
   MINI-GAME SYSTEM
   ────────────────────────────────────────────── */
class MiniGameSystem {
  constructor(audio, telegram) {
    this.audio    = audio;
    this.telegram = telegram;
    this.active   = null;
    this.canvas   = null;
    this.ctx      = null;
    this.state    = {};
    this.raf      = null;
  }
  start(type, game) {
    this.active = type;
    this.game   = game;
    const scr = document.getElementById('minigame-screen');
    scr.style.display = 'flex';
    document.getElementById('mg-title').textContent = {
      fishing:'🎣 Рыбалка', butterfly:'🦋 Поймай бабочку',
      apples:'🍎 Собери яблоки', fireflies:'✨ Светлячки ночью',
      meow:'🎵 Мяу-концерт'
    }[type] || 'Мини-игра';
    this.canvas = document.getElementById('mg-canvas');
    this.ctx    = this.canvas.getContext('2d');
    this._init(type);
    document.getElementById('mg-close').onclick = () => { this.stop(); };
    this.canvas.onclick = e => { const r = this.canvas.getBoundingClientRect(); this._click(e.clientX-r.left, e.clientY-r.top); };
    this.canvas.ontouchstart = e => { e.preventDefault(); const t=e.touches[0], r=this.canvas.getBoundingClientRect(); this._click(t.clientX-r.left,t.clientY-r.top); };
    cancelAnimationFrame(this.raf);
    const loop = () => { this._update(); this._draw(); this.raf = requestAnimationFrame(loop); };
    loop();
  }
  stop() {
    cancelAnimationFrame(this.raf); this.raf = null; this.active = null;
    document.getElementById('minigame-screen').style.display = 'none';
    document.getElementById('mg-ui').innerHTML = '';
  }
  _init(type) {
    const W = this.canvas.width, H = this.canvas.height;
    if (type === 'fishing') {
      this.state = { phase:'wait', timer:0, barY:H/2, catchTimer:0, score:0, attempts:5, message:'Нажми чтобы закинуть удочку!' };
    } else if (type === 'butterfly') {
      const butterfly = { x:W/2, y:H/2, vx:(Math.random()-0.5)*3, vy:(Math.random()-0.5)*3, phase:0, caught:false };
      this.state = { butterfly, score:0, timeLeft:15, message:'Поймай бабочку!' };
    } else if (type === 'apples') {
      this.state = { apples:[], basket:{x:W/2,w:60}, score:0, timeLeft:20, speed:1.5, message:'Лови яблоки!' };
      for (let i=0;i<5;i++) this.state.apples.push({x:Math.random()*W,y:-20-i*40,speed:1+Math.random()});
    } else if (type === 'fireflies') {
      this.state = { flies:[], caught:0, goal:8, timeLeft:20, message:'Лови светлячков!' };
      for (let i=0;i<12;i++) this.state.flies.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5)*40,vy:(Math.random()-0.5)*30,phase:Math.random()*6.28,alive:true});
    } else if (type === 'meow') {
      this.state = { notes:[], score:0, timeLeft:20, nextNote:1, message:'Нажимай на ноты вовремя!' };
    }
    this._lastTime = performance.now();
  }
  _update() {
    const now = performance.now(), dt = Math.min((now-this._lastTime)/1000, 0.1);
    this._lastTime = now;
    const s = this.state, W = this.canvas.width, H = this.canvas.height;
    if (this.active === 'fishing') {
      if (s.phase === 'wait') { /* nothing */ }
      else if (s.phase === 'fishing') {
        s.timer += dt;
        s.barY = H/2 + Math.sin(s.timer*1.2)*40;
        if (s.timer > 1.5 + Math.random()*2) {
          s.phase = 'bite'; s.catchTimer = 1.5; s.message = '🐟 КЛЮЁТ! Нажимай!';
          this.audio.uiClick();
        }
      } else if (s.phase === 'bite') {
        s.catchTimer -= dt;
        if (s.catchTimer <= 0) { s.phase = 'miss'; s.attempts--; s.message = 'Сорвалась! Ещё раз...'; setTimeout(()=>{if(s.attempts>0)s.phase='wait'; else this._mgEnd('fishing');},1000); }
      }
    } else if (this.active === 'butterfly') {
      s.timeLeft -= dt;
      if (s.timeLeft <= 0) this._mgEnd('butterfly');
      const b = s.butterfly;
      b.phase += dt * 4; b.x += b.vx; b.y += b.vy;
      b.vx += (Math.random()-0.5)*0.5; b.vy += (Math.random()-0.5)*0.5;
      b.vx = Math.max(-4,Math.min(4,b.vx)); b.vy = Math.max(-4,Math.min(4,b.vy));
      if (b.x < 20 || b.x > W-20) b.vx *= -1;
      if (b.y < 20 || b.y > H-20) b.vy *= -1;
    } else if (this.active === 'apples') {
      s.timeLeft -= dt;
      if (s.timeLeft <= 0) this._mgEnd('apples');
      s.apples.forEach(a => { a.y += a.speed * (1 + s.score*0.05); if (a.y > H) { a.y = -20; a.x = Math.random()*W; } });
    } else if (this.active === 'fireflies') {
      s.timeLeft -= dt;
      if (s.timeLeft <= 0 || s.caught >= s.goal) this._mgEnd('fireflies');
      s.flies.forEach(f => {
        if (!f.alive) return;
        f.x += f.vx*dt; f.y += f.vy*dt; f.phase += dt*3;
        if (f.x<10||f.x>W-10) f.vx*=-1; if (f.y<10||f.y>H-10) f.vy*=-1;
      });
    } else if (this.active === 'meow') {
      s.timeLeft -= dt; s.nextNote -= dt;
      if (s.timeLeft <= 0) this._mgEnd('meow');
      if (s.nextNote <= 0) {
        s.nextNote = 0.8 + Math.random()*0.8;
        s.notes.push({ x:50+Math.random()*(this.canvas.width-100), y:20, life:1.5+Math.random()*0.5, hit:false });
      }
      s.notes.forEach(n => { n.y += 80*dt; n.life -= dt; });
      s.notes = s.notes.filter(n => n.life > 0);
    }
  }
  _click(cx, cy) {
    const s = this.state;
    const H = this.canvas.height;
    if (this.active === 'fishing') {
      if (s.phase === 'wait') { s.phase = 'fishing'; s.timer = 0; s.message = 'Ждём...'; }
      else if (s.phase === 'bite') {
        s.score++; s.phase = 'catch'; s.message = `🐟 Поймал! Счёт: ${s.score}`;
        this.audio.pickup(); this.telegram.vibrate(30);
        setTimeout(()=>{ if(s.attempts>0){s.phase='wait';s.message='Снова? Нажми!';}else this._mgEnd('fishing'); },800);
      }
    } else if (this.active === 'butterfly') {
      const b = s.butterfly, d = Math.sqrt((cx-b.x)**2+(cy-b.y)**2);
      if (d < 30) { s.score++; s.message = `✅ Поймал! Нажми ещё`; b.x=Math.random()*this.canvas.width; b.y=Math.random()*H; b.vx=(Math.random()-0.5)*4; b.vy=(Math.random()-0.5)*4; this.audio.pickup(); this.telegram.vibrate(20); }
    } else if (this.active === 'apples') {
      s.apples.forEach(a => { if (Math.abs(a.x-cx)<30 && Math.abs(a.y-cy)<30) { s.score++; a.y=-20; a.x=Math.random()*this.canvas.width; this.audio.pickup(); this.telegram.vibrate(15); } });
      s.basket.x = Math.max(30, Math.min(this.canvas.width-30, cx));
    } else if (this.active === 'fireflies') {
      s.flies.forEach(f => {
        if (!f.alive) return;
        const d = Math.sqrt((cx-f.x)**2+(cy-f.y)**2);
        if (d < 25) { f.alive=false; s.caught++; s.message=`✨ ${s.caught}/${s.goal}`; this.audio.pickup(); this.telegram.vibrate(20); }
      });
    } else if (this.active === 'meow') {
      s.notes.forEach(n => {
        if (!n.hit && Math.abs(cx-n.x)<30 && Math.abs(n.y-H+30)<40) { n.hit=true; s.score++; this.audio.meow(); this.telegram.vibrate(10); }
      });
    }
  }
  _draw() {
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height, s = this.state;
    ctx.fillStyle = '#1a2a0a'; ctx.fillRect(0,0,W,H);
    if (this.active === 'fishing') {
      ctx.fillStyle = '#1a4488'; ctx.fillRect(0,H/2,W,H/2);
      ctx.strokeStyle='rgba(100,200,255,0.3)'; ctx.lineWidth=1;
      for (let i=0;i<5;i++) { ctx.beginPath(); ctx.moveTo(0,H/2+20+i*20); ctx.lineTo(W,H/2+25+i*18); ctx.stroke(); }
      if (s.phase !== 'wait') {
        ctx.fillStyle=s.phase==='bite'?'#ff4444':'#ff8800';
        ctx.beginPath(); ctx.arc(W/2+Math.sin(s.timer)*30, s.barY, 10, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle='#888'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(50,30); ctx.lineTo(W/2+Math.sin(s.timer)*30, s.barY); ctx.stroke();
      }
      ctx.strokeStyle='#8b6914'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(30,H-20); ctx.lineTo(50,30); ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font='13px system-ui'; ctx.textAlign='center';
      ctx.fillText(s.message, W/2, 25);
      ctx.fillText(`Попытки: ${s.attempts}  Улов: ${s.score}`, W/2, H-10);
    } else if (this.active === 'butterfly') {
      const b = s.butterfly;
      ctx.fillStyle='#1a3a0a'; ctx.fillRect(0,0,W,H);
      for (let i=0;i<8;i++) { ctx.fillStyle=['#ff6699','#ffcc44','#ff44aa'][i%3]; ctx.beginPath(); ctx.arc(40+i*35,H-15+Math.sin(i)*5,8,0,Math.PI*2); ctx.fill(); }
      const bw = Math.sin(b.phase)*18;
      ctx.fillStyle='rgba(255,150,50,0.9)';
      ctx.beginPath(); ctx.ellipse(b.x-10,b.y,20,12+bw,0.3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(b.x+10,b.y,20,12+bw,-0.3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#664400'; ctx.beginPath(); ctx.arc(b.x,b.y,5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff'; ctx.font='13px system-ui'; ctx.textAlign='center';
      ctx.fillText(`Счёт: ${s.score}  Время: ${Math.ceil(s.timeLeft)}с`, W/2, 20);
    } else if (this.active === 'apples') {
      ctx.fillStyle='#2d5a1b'; ctx.fillRect(0,0,W,H);
      s.apples.forEach(a => { ctx.font='22px serif'; ctx.textAlign='center'; ctx.fillText('🍎',a.x,a.y); });
      ctx.fillStyle='#8b4513'; ctx.fillRect(s.basket.x-40,H-20,80,20);
      ctx.fillStyle='#fff'; ctx.font='13px system-ui'; ctx.textAlign='center';
      ctx.fillText(`Яблоки: ${s.score}  Время: ${Math.ceil(s.timeLeft)}с`, W/2, 20);
    } else if (this.active === 'fireflies') {
      ctx.fillStyle='#0a0a20'; ctx.fillRect(0,0,W,H);
      for (let i=0;i<30;i++) { ctx.fillStyle=`rgba(255,255,200,${0.3+Math.random()*0.3})`; ctx.beginPath(); ctx.arc(Math.sin(i*37)*W/2+W/2,Math.cos(i*53)*H/2+H/2,1,0,Math.PI*2); ctx.fill(); }
      s.flies.forEach(f => {
        if (!f.alive) return;
        const a = 0.4+0.6*Math.abs(Math.sin(f.phase));
        ctx.fillStyle=`rgba(160,255,80,${a})`; ctx.shadowColor='#80ff40'; ctx.shadowBlur=10;
        ctx.beginPath(); ctx.arc(f.x,f.y,6,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
      });
      ctx.fillStyle='#aaffaa'; ctx.font='13px system-ui'; ctx.textAlign='center';
      ctx.fillText(`Поймано: ${s.caught}/${s.goal}  Время: ${Math.ceil(s.timeLeft)}с`, W/2, 20);
    } else if (this.active === 'meow') {
      ctx.fillStyle='#1a0a2a'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle='rgba(244,135,58,0.5)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(0,H-30); ctx.lineTo(W,H-30); ctx.stroke();
      s.notes.forEach(n => {
        const t = n.life; const col = n.hit ? '#88ff44' : `hsl(${t*120},80%,60%)`;
        ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=8;
        ctx.beginPath(); ctx.arc(n.x,n.y,18,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
        ctx.fillStyle='#fff'; ctx.font='bold 16px serif'; ctx.textAlign='center';
        ctx.fillText('🎵',n.x,n.y+6);
      });
      ctx.fillStyle='#ff88cc'; ctx.font='13px system-ui'; ctx.textAlign='center';
      ctx.fillText(`Ноты: ${s.score}  Время: ${Math.ceil(s.timeLeft)}с  Нажимай на ноты!`, W/2, 20);
    }
  }
  _mgEnd(type) {
    const s = this.state;
    let reward = null, msg = '';
    if (type === 'fishing' && s.score > 0)   { reward = 'fish';   msg = `🎣 Поймал ${s.score} рыбки!`; }
    if (type === 'butterfly' && s.score > 0) { reward = 'feather'; msg = `🦋 Поймал ${s.score} бабочек!`; }
    if (type === 'apples' && s.score >= 3)   { reward = 'apple';   msg = `🍎 Собрал ${s.score} яблок!`; }
    if (type === 'fireflies' && s.caught >= 4){ reward = 'acorn';  msg = `✨ Поймал ${s.caught} светлячков!`; }
    if (type === 'meow' && s.score >= 5)     { reward = 'ribbon';  msg = `🎵 Концерт удался! (${s.score} нот)`; }
    this.stop();
    if (reward) {
      this.game.inventory.add(reward);
      this.game.ui.notify(msg);
      this.audio.questDone();
      this.telegram.vibrateSuccess();
    } else {
      this.game.ui.notify('Попробуй ещё раз!');
    }
  }
}

/* ──────────────────────────────────────────────
   SPLASH SCREEN FIREFLIES animation
   ────────────────────────────────────────────── */
function initSplashFireflies() {
  const wrap = document.getElementById('splash-fireflies-wrap');
  if (!wrap) return;
  for (let i = 0; i < 22; i++) {
    const el = document.createElement('div');
    el.className = 'splash-ff';
    const x = 5 + Math.random() * 90;
    const y = 10 + Math.random() * 80;
    const fx = (Math.random() - 0.5) * 60;
    const fy = -30 - Math.random() * 60;
    const dur = 3 + Math.random() * 5;
    const delay = Math.random() * 5;
    el.style.cssText = `left:${x}%;top:${y}%;--fx:${fx}px;--fy:${fy}px;animation-duration:${dur}s;animation-delay:${delay}s;`;
    wrap.appendChild(el);
  }
}
