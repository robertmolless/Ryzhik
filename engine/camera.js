'use strict';

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
