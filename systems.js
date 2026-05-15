'use strict';

/* ──────────────────────────────────────────────
   TELEGRAM BRIDGE
   ────────────────────────────────────────────── */
class TelegramBridge {
  constructor() {
    this.twa = (typeof Telegram !== 'undefined' && Telegram.WebApp) ? Telegram.WebApp : null;
    this.available = !!this.twa;
    if (this.available) {
      this.twa.ready();
      this.twa.expand();
      this.twa.disableVerticalSwipes && this.twa.disableVerticalSwipes();
    }
  }
  get theme() {
    if (!this.available) return null;
    return this.twa.themeParams || null;
  }
  showMainButton(text, cb) {
    if (!this.available) return;
    this.twa.MainButton.setText(text);
    this.twa.MainButton.onClick(cb);
    this.twa.MainButton.show();
  }
  hideMainButton() {
    if (!this.available) return;
    this.twa.MainButton.offClick();
    this.twa.MainButton.hide();
  }
  showBackButton(cb) {
    if (!this.available) return;
    this.twa.BackButton.onClick(cb);
    this.twa.BackButton.show();
  }
  hideBackButton() {
    if (!this.available) return;
    this.twa.BackButton.offClick();
    this.twa.BackButton.hide();
  }
  vibrate(ms = 30) {
    if (navigator.vibrate) navigator.vibrate(ms);
    if (this.available && this.twa.HapticFeedback) {
      this.twa.HapticFeedback.impactOccurred('light');
    }
  }
  vibrateSuccess() {
    if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
    if (this.available && this.twa.HapticFeedback) {
      this.twa.HapticFeedback.notificationOccurred('success');
    }
  }
}

/* ──────────────────────────────────────────────
   AUDIO SYSTEM  (Web Audio API, procedural)
   ────────────────────────────────────────────── */
class AudioSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicNode = null;
    this.volSfx = 0.7;
    this.volMusic = 0.4;
    this.enabled = true;
    this._musicInterval = null;
    this._musicActive = false;
    this._init();
  }
  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain(); this.masterGain.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.connect(this.masterGain);
      this.musicGain = this.ctx.createGain(); this.musicGain.connect(this.masterGain);
      this.sfxGain.gain.value = this.volSfx;
      this.musicGain.gain.value = this.volMusic;
    } catch(e) { this.enabled = false; }
  }
  _resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  _tone(freq, type, dur, vol = 0.3, dest = null) {
    if (!this.enabled) return;
    this._resume();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.connect(g); g.connect(dest || this.sfxGain);
    osc.start(); osc.stop(this.ctx.currentTime + dur);
  }
  _noise(dur, vol = 0.1) {
    if (!this.enabled) return;
    this._resume();
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    src.buffer = buf;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    src.connect(g); g.connect(this.sfxGain);
    src.start();
  }
  meow() {
    if (!this.enabled) return; this._resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(650, t + 0.12);
    osc.frequency.linearRampToValueAtTime(500, t + 0.3);
    g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(g); g.connect(this.sfxGain); osc.start(t); osc.stop(t + 0.4);
  }
  purr() {
    if (!this.enabled) return; this._resume();
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this._tone(90 + i*8, 'sawtooth', 0.25, 0.08), i * 100);
    }
  }
  step() { this._noise(0.05, 0.04); }
  pickup() {
    this._tone(523, 'sine', 0.1, 0.2);
    setTimeout(() => this._tone(660, 'sine', 0.1, 0.2), 80);
    setTimeout(() => this._tone(784, 'sine', 0.15, 0.25), 160);
  }
  questDone() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => setTimeout(() => this._tone(f, 'sine', 0.2, 0.3), i * 120));
  }
  uiClick() { this._tone(440, 'sine', 0.06, 0.12); }
  uiClose() { this._tone(330, 'sine', 0.08, 0.1); }
  achievement() {
    [523,659,784,1047,1319].forEach((f,i) => setTimeout(() => this._tone(f,'triangle',0.18,0.28), i*100));
  }
  rain() {
    if (!this.enabled) return; this._resume();
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.15;
    const src = this.ctx.createBufferSource();
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 0.5;
    const g = this.ctx.createGain(); g.gain.value = 0.2;
    src.buffer = buf; src.loop = true;
    src.connect(f); f.connect(g); g.connect(this.musicGain);
    src.start();
    this._rainNode = src; this._rainGain = g;
  }
  stopRain() {
    if (this._rainNode) { try { this._rainNode.stop(); } catch(e){} this._rainNode = null; }
  }
  startMusic() {
    if (!this.enabled || this._musicInterval) return;
    this._musicActive = true;
    this._musicInterval = setInterval(() => this._playMusicPhrase(), 3000);
    this._playMusicPhrase();
  }
  stopMusic() {
    this._musicActive = false;
    if (this._musicInterval) { clearInterval(this._musicInterval); this._musicInterval = null; }
  }
  _playMusicPhrase() {
    if (!this.enabled || !this._musicActive) return;
    this._resume();
    const scale = [261, 293, 329, 349, 392, 440, 494, 523];
    const phrase = [];
    for (let i = 0; i < 4; i++) phrase.push(scale[Math.floor(Math.random() * scale.length)]);
    phrase.forEach((f, i) => {
      setTimeout(() => {
        if (!this._musicActive) return;
        this._tone(f, 'sine', 0.45, 0.06, this.musicGain);
        this._tone(f/2, 'sine', 0.5, 0.03, this.musicGain);
      }, i * 500);
    });
  }
  setVolSfx(v)   { this.volSfx = v / 100; if (this.sfxGain) this.sfxGain.gain.value = this.volSfx; }
  setVolMusic(v) { this.volMusic = v / 100; if (this.musicGain) this.musicGain.gain.value = this.volMusic; }
}

/* ──────────────────────────────────────────────
   SAVE SYSTEM
   ────────────────────────────────────────────── */
class SaveSystem {
  constructor() { this.KEY = 'ryzhik_save_v2'; }
  hasSave() { return !!localStorage.getItem(this.KEY); }
  save(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); return true; }
    catch(e) { return false; }
  }
  load() {
    try { const d = localStorage.getItem(this.KEY); return d ? JSON.parse(d) : null; }
    catch(e) { return null; }
  }
  reset() { localStorage.removeItem(this.KEY); }
}

/* ──────────────────────────────────────────────
   TIME SYSTEM
   ────────────────────────────────────────────── */
class TimeSystem {
  constructor() {
    this.day = 1;
    this.hour = 6;
    this.minuteAccum = 0;
    this.realSecondsPerGameHour = 120;
  }
  get period() {
    if (this.hour >= 5  && this.hour < 10) return 'morning';
    if (this.hour >= 10 && this.hour < 17) return 'day';
    if (this.hour >= 17 && this.hour < 21) return 'evening';
    return 'night';
  }
  get periodRu() {
    return { morning:'Утро', day:'День', evening:'Вечер', night:'Ночь' }[this.period];
  }
  get icon() {
    return { morning:'🌅', day:'☀️', evening:'🌆', night:'🌙' }[this.period];
  }
  get skyColor() {
    const t = this.hour + (this.minuteAccum / this.realSecondsPerGameHour);
    if (t >= 5  && t < 8)  return this._lerp('#1a2a4a','#87ceeb',(t-5)/3);
    if (t >= 8  && t < 17) return '#87ceeb';
    if (t >= 17 && t < 20) return this._lerp('#87ceeb','#ff7755',(t-17)/3);
    if (t >= 20 && t < 22) return this._lerp('#ff7755','#1a1a3a',(t-20)/2);
    return '#0a0a20';
  }
  _lerp(c1, c2, t) {
    const p = v => parseInt(v,16);
    const r1=p(c1.slice(1,3)),g1=p(c1.slice(3,5)),b1=p(c1.slice(5,7));
    const r2=p(c2.slice(1,3)),g2=p(c2.slice(3,5)),b2=p(c2.slice(5,7));
    const ri=Math.round(r1+(r2-r1)*t), gi=Math.round(g1+(g2-g1)*t), bi=Math.round(b1+(b2-b1)*t);
    return `#${ri.toString(16).padStart(2,'0')}${gi.toString(16).padStart(2,'0')}${bi.toString(16).padStart(2,'0')}`;
  }
  update(dt) {
    this.minuteAccum += dt;
    while (this.minuteAccum >= this.realSecondsPerGameHour) {
      this.minuteAccum -= this.realSecondsPerGameHour;
      this.hour++;
      if (this.hour >= 24) { this.hour = 0; this.day++; return 'newday'; }
      return 'newhour';
    }
    return null;
  }
  isWeekend() { return this.day % 7 === 0 || this.day % 7 === 6; }
}

/* ──────────────────────────────────────────────
   WEATHER SYSTEM
   ────────────────────────────────────────────── */
class WeatherSystem {
  constructor(audio) {
    this.audio = audio;
    this.types = ['sunny','cloudy','rain','wind','fog','starry'];
    this.icons = { sunny:'☀️', cloudy:'⛅', rain:'🌧️', wind:'💨', fog:'🌫️', starry:'⭐' };
    this.current = 'sunny';
    this.particles = [];
    this.timer = 0;
    this.duration = 180;
  }
  get icon() { return this.icons[this.current] || '☀️'; }
  set(type) {
    if (this.current === 'rain' && type !== 'rain') this.audio.stopRain();
    this.current = type;
    this.particles = [];
    if (type === 'rain') this._startRain();
    else if (type === 'starry') this._startStars();
    else if (type === 'wind') this._startWind();
    else if (type === 'fog') this._startFog();
  }
  random(period) {
    const weights = period === 'night'
      ? { sunny:0, cloudy:15, rain:20, wind:15, fog:15, starry:35 }
      : { sunny:40, cloudy:25, rain:15, wind:10, fog:5, starry:5 };
    let r = Math.random() * 100, cum = 0;
    for (const [k, w] of Object.entries(weights)) { cum += w; if (r <= cum) return k; }
    return 'sunny';
  }
  _startRain() {
    for (let i = 0; i < 60; i++) this.particles.push({
      x: Math.random() * 4000, y: Math.random() * 3000,
      vy: 4 + Math.random() * 3, vx: -0.5 - Math.random(),
      life: 1
    });
    this.audio.rain();
  }
  _startStars() {
    for (let i = 0; i < 80; i++) this.particles.push({
      x: Math.random() * 4000, y: Math.random() * 800,
      size: 1 + Math.random() * 2,
      twinkle: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 2
    });
  }
  _startWind() {
    for (let i = 0; i < 30; i++) this.particles.push({
      x: Math.random() * 4000, y: 100 + Math.random() * 600,
      vx: 3 + Math.random() * 4, life: 1,
      len: 20 + Math.random() * 40
    });
  }
  _startFog() {
    for (let i = 0; i < 12; i++) this.particles.push({
      x: Math.random() * 4000, y: 200 + Math.random() * 400,
      w: 200 + Math.random() * 300, h: 60 + Math.random() * 80,
      alpha: 0.04 + Math.random() * 0.06, vx: 0.2 + Math.random() * 0.3
    });
  }
  update(dt, worldW, worldH, period = 'day') {
    this.timer += dt;
    if (this.timer > this.duration && Math.random() < 0.005) {
      this.timer = 0;
      const next = this.random(period);
      if (next !== this.current) this.set(next);
    }
    if (this.current === 'rain') {
      this.particles.forEach(p => { p.x += p.vx * 2; p.y += p.vy * 2; if (p.y > worldH) { p.y = -10; p.x = Math.random() * worldW; } });
    } else if (this.current === 'starry') {
      this.particles.forEach(p => { p.twinkle += dt * p.speed; });
    } else if (this.current === 'wind') {
      this.particles.forEach(p => { p.x += p.vx; if (p.x > worldW) p.x = -50; });
    } else if (this.current === 'fog') {
      this.particles.forEach(p => { p.x += p.vx; if (p.x > worldW + 300) p.x = -300; });
    }
  }
  draw(ctx, cam) {
    const cx = -cam.x, cy = -cam.y;
    if (this.current === 'rain') {
      ctx.strokeStyle = 'rgba(180,200,255,0.35)'; ctx.lineWidth = 1;
      this.particles.forEach(p => {
        const sx = p.x + cx, sy = p.y + cy;
        if (sx > -5 && sx < ctx.canvas.width + 5 && sy > -5 && sy < ctx.canvas.height + 5) {
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + p.vx * 4, sy + p.vy * 4); ctx.stroke();
        }
      });
    } else if (this.current === 'starry') {
      this.particles.forEach(p => {
        const sx = p.x + cx, sy = p.y + cy;
        const a = 0.4 + 0.6 * Math.abs(Math.sin(p.twinkle));
        ctx.fillStyle = `rgba(255,255,220,${a})`;
        ctx.beginPath(); ctx.arc(sx, sy, p.size, 0, Math.PI*2); ctx.fill();
      });
    } else if (this.current === 'wind') {
      ctx.strokeStyle = 'rgba(200,220,255,0.2)'; ctx.lineWidth = 1.5;
      this.particles.forEach(p => {
        const sx = p.x + cx, sy = p.y + cy;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - p.len, sy + 5); ctx.stroke();
      });
    } else if (this.current === 'fog') {
      this.particles.forEach(p => {
        const sx = p.x + cx, sy = p.y + cy;
        const grad = ctx.createRadialGradient(sx+p.w/2, sy+p.h/2, 0, sx+p.w/2, sy+p.h/2, p.w/2);
        grad.addColorStop(0, `rgba(200,210,220,${p.alpha})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(sx, sy, p.w, p.h);
      });
    }
  }
  moodMod() { return { sunny:1, cloudy:0.9, rain:0.8, wind:0.9, fog:0.85, starry:1.05 }[this.current] || 1; }
}
