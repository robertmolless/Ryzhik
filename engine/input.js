'use strict';

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
