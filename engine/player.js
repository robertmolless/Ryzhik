'use strict';

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
