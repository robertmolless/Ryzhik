'use strict';

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
