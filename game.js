/* ============================================================
   РЫЖИК: ТАЙНА ЗАГОРОДНОГО ДОМА — game.js
   Full game engine, mobile-first, Telegram WebApp ready
   ============================================================ */

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
    this._musicInterval = setInterval(() => this._playMusicPhrase(), 3000);
    this._playMusicPhrase();
  }
  stopMusic() {
    if (this._musicInterval) { clearInterval(this._musicInterval); this._musicInterval = null; }
  }
  _playMusicPhrase() {
    if (!this.enabled) return; this._resume();
    const scale = [261, 293, 329, 349, 392, 440, 494, 523];
    const phrase = [];
    for (let i = 0; i < 4; i++) phrase.push(scale[Math.floor(Math.random() * scale.length)]);
    phrase.forEach((f, i) => {
      setTimeout(() => {
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
    this.hour = 6; // 0-23
    this.minuteAccum = 0;
    this.realSecondsPerGameHour = 120; // 2 min real = 1 game hour
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
    this.particles = []; // rain/fog/wind particles
    this.timer = 0;
    this.duration = 180; // seconds before possible change
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

/* ──────────────────────────────────────────────
   GAME DATA: ITEMS
   ────────────────────────────────────────────── */
const ITEMS = {
  bowl:     { id:'bowl',     name:'Миска',         icon:'🥣', desc:'Любимая миска Рыжика. Из неё так вкусно есть!', rare:false },
  fish:     { id:'fish',     name:'Рыбка',          icon:'🐟', desc:'Свежая рыбка. Рыжик будет в восторге!', rare:false },
  apple:    { id:'apple',    name:'Яблоко',         icon:'🍎', desc:'Сочное яблоко из сада.', rare:false },
  yarn:     { id:'yarn',     name:'Клубок',         icon:'🧶', desc:'Пушистый клубок. Так и хочется поиграть!', rare:false },
  barnKey:  { id:'barnKey',  name:'Ключ от сарая',  icon:'🗝️', desc:'Ржавый ключ. Открывает замок на сарае.', rare:true },
  coin:     { id:'coin',     name:'Старая монета',  icon:'🪙', desc:'Старинная монета. Возможно, что-то стоит.', rare:true },
  pebble:   { id:'pebble',   name:'Камешек',        icon:'🫧', desc:'Блестящий камешек. Рыжик любит блестящее!', rare:false },
  letter:   { id:'letter',   name:'Письмо',         icon:'✉️', desc:'Старое письмо. Что в нём написано?', rare:true },
  seeds:    { id:'seeds',    name:'Семена',         icon:'🌱', desc:'Семена цветов. Можно посадить в огороде.', rare:false },
  ribbon:   { id:'ribbon',   name:'Ленточка',       icon:'🎀', desc:'Красивая ленточка.', rare:false },
  bell:     { id:'bell',     name:'Колокольчик',    icon:'🔔', desc:'Тихо звенит на ветру. Очень уютный звук.', rare:true },
  leaf:     { id:'leaf',     name:'Редкий лист',    icon:'🍃', desc:'Необычный лист с прожилками золота.', rare:true },
  button:   { id:'button',   name:'Пуговица',       icon:'🔘', desc:'Старинная пуговица с красивым узором.', rare:false },
  dryCat:   { id:'dryCat',   name:'Сухой корм',     icon:'🫙', desc:'Любимый корм Рыжика. Восстанавливает сытость.', rare:false },
  acorn:    { id:'acorn',    name:'Звёздный жёлудь', icon:'🌰', desc:'Необычный жёлудь, сверкает в темноте.', rare:true },
  sunBell:  { id:'sunBell',  name:'Солнечный колокольчик', icon:'🔔✨', desc:'Символ тепла и дружбы. Главная тайна теплицы!', rare:true },
  cassette: { id:'cassette', name:'Кассета Лёхи',   icon:'📼', desc:'Старая кассета с любимой музыкой Лёхи. Он точно обрадуется!', rare:false },
  pick:     { id:'pick',     name:'Медиатор Игоря', icon:'🎸', desc:'Медиатор Игоря. Потерял где-то у пруда.', rare:false },
  diary:    { id:'diary',    name:'Странная запись', icon:'📄', desc:'Потерянная страница из блокнота Нэны.', rare:false },
  flashPart:{ id:'flashPart',name:'Деталь фонарика',icon:'🔦', desc:'Деталь для ремонта фонарика Кристины.', rare:false },
  sticker:  { id:'sticker',  name:'Наклейка',       icon:'⭐', desc:'Яркая наклейка Лизы. Надо собрать все!', rare:false },
  photo:    { id:'photo',    name:'Фото со светлячками', icon:'📸', desc:'Волшебная ночная фотография, сделанная Настей.', rare:true },
  moonBell: { id:'moonBell', name:'Колокольчик луны', icon:'🌙', desc:'Мистический колокольчик. Маг говорил о нём.', rare:true },
  trailMap: { id:'trailMap', name:'Карта тропы',    icon:'🗺️', desc:'Карта лесной тропы, нарисованная Соней.', rare:true },
  treasure: { id:'treasure', name:'Коробка сокровищ', icon:'📦', desc:'Коробка с удивительными штуками от Дани.', rare:true },
  toyMouse: { id:'toyMouse', name:'Игрушечная мышь',icon:'🐭', desc:'Мягкая игрушечная мышка. Отличная игрушка!', rare:false },
  feather:  { id:'feather',  name:'Перо',           icon:'🪶', desc:'Красивое перо, найденное во дворе.', rare:false },
};

/* ──────────────────────────────────────────────
   GAME DATA: QUESTS
   ────────────────────────────────────────────── */
const QUESTS = [
  // Стартовые квесты
  { id:'q01', title:'Найти миску Рыжика', icon:'🥣', desc:'Рыжик потерял свою миску после зимы. Нужно найти её во дворе!', steps:['Осмотри двор','Найди миску у крыльца'], reward:{item:'bowl',xp:10}, npc:null, unlock:true },
  { id:'q02', title:'Ключ от сарая', icon:'🗝️', desc:'В сарае что-то интересное, но он заперт. Найди ключ — ищи у колодца!', steps:['Найди ключ от сарая (у колодца)','Открой сарай с ключом'], reward:{xp:20,zone:'barn'}, npc:null, unlock:true },
  { id:'q03', title:'Познакомиться с соседями', icon:'👥', desc:'Поговори с жителями двора и узнай, кто тут живёт.', steps:['Поговори с 3 персонажами'], reward:{xp:15}, npc:null, unlock:true },

  // Квесты персонажей
  { id:'q_lyokha', title:'Старая кассета', icon:'📼', desc:'Лёха потерял любимую кассету где-то в сарае. Открой сарай и верни её Лёхе!', steps:['Поговори с Лёхой о кассете','Верни кассету Лёхе'], reward:{xp:20,trust:'lyokha'}, npc:'lyokha', unlock:true },
  { id:'q_igor', title:'Пропавший медиатор', icon:'🎸', desc:'Игорь потерял свой любимый медиатор где-то у пруда. Нужно найти!', steps:['Поговори с Игорем','Верни медиатор Игорю'], reward:{xp:18,trust:'igor'}, npc:'igor', unlock:true },
  { id:'q_nastya', title:'Фото со светлячками', icon:'📸', desc:'Настя мечтает сделать ночную фотографию со светлячками.', steps:['Поговори с Настей','Дождись ночи','Найди место со светлячками','Помоги сделать фото'], reward:{item:'photo',xp:22,trust:'nastya'}, npc:'nastya', unlock:false },
  { id:'q_liza', title:'Потерянные наклейки', icon:'⭐', desc:'Лиза потеряла наклейки по всему двору. Собери все 5!', steps:['Поговори с Лизой','Собери 5 наклеек по двору','Верни наклейки Лизе'], reward:{xp:18,trust:'liza'}, npc:'liza', unlock:false },
  { id:'q_mag', title:'Колокольчик луны', icon:'🌙', desc:'Маг рассказывает о мистическом колокольчике луны. Найди его ночью!', steps:['Встреть Мага ночью','Выслушай легенду','Найди колокольчик на поляне'], reward:{xp:28,trust:'mag'}, npc:'mag', unlock:false },
  { id:'q_sonya', title:'Лесная тропа', icon:'🌲', desc:'Соня знает тайную тропу через лес. Пройди её вместе с ней.', steps:['Поговори с Соней','Иди вместе по лесной тропе','Найди выход на поляну'], reward:{item:'trailMap',xp:22,trust:'sonya',zone:'forest_path'}, npc:'sonya', unlock:false },
  { id:'q_nena', title:'Странные записи', icon:'📓', desc:'Нэна нашла странные записи о доме, но потеряла страницу. Помоги найти!', steps:['Поговори с Нэной','Верни страницу Нэне'], reward:{xp:20,trust:'nena'}, npc:'nena', unlock:false },
  { id:'q_kristina', title:'Сломанный фонарик', icon:'🔦', desc:'Кристина пытается починить фонарик, но не хватает детали.', steps:['Поговори с Кристиной','Найди деталь фонарика','Помоги починить'], reward:{xp:22,trust:'kristina',upgrade:'corner'}, npc:'kristina', unlock:false },
  { id:'q_danya', title:'Коробка сокровищ', icon:'📦', desc:'Даня хочет собрать особую коробку сокровищ. Помоги найти компоненты!', steps:['Поговори с Даней','Найди 3 необычных предмета','Принеси Дане'], reward:{item:'treasure',xp:22,trust:'danya'}, npc:'danya', unlock:false },

  // Общие квесты
  { id:'q_explore', title:'Исследуй окрестности', icon:'🔍', desc:'Рыжик чувствует — где-то есть тайный проход. Найди его!', steps:['Исследуй забор','Найди тайную тропу'], reward:{xp:20,zone:'secret_path'}, npc:null, unlock:false },
  { id:'q_attic', title:'Исследовать чердак', icon:'🪜', desc:'На чердаке давно никто не бывал. Что там?', steps:['Найди лестницу','Поднимись на чердак','Осмотри чердак'], reward:{item:'letter',xp:25,zone:'attic'}, npc:null, unlock:false },
  { id:'q_cellar', title:'Открыть подвал', icon:'🚪', desc:'Подвал закрыт. Что там скрывается?', steps:['Найди ключ от подвала','Открой подвал','Исследуй'], reward:{xp:25,item:'coin',zone:'cellar'}, npc:null, unlock:false },
  { id:'q_fish', title:'Рыбалка у пруда', icon:'🎣', desc:'У пруда можно поймать вкусную рыбку!', steps:['Иди к пруду','Порыбачь (мини-игра)','Поймай рыбку'], reward:{item:'fish',xp:15}, npc:null, unlock:false },
  { id:'q_shiny', title:'Коллекция блестяшек', icon:'💎', desc:'Рыжик любит блестящие вещи. Собери 5 штук!', steps:['Найди 5 блестящих предметов'], reward:{xp:20,item:'ribbon'}, npc:null, unlock:false },
  { id:'q_firefly', title:'Найти светлячков', icon:'✨', desc:'Ночью в саду появились светлячки!', steps:['Дождись ночи','Выйди в сад','Поймай светлячка (мини-игра)'], reward:{xp:20,item:'acorn'}, npc:null, unlock:false },
  { id:'q_concert', title:'Вечерний мяу-концерт', icon:'🎵', desc:'Рыжик хочет устроить концерт! Позови Лёху и Игоря.', steps:['Пригласи Лёху и Игоря','Выйди на крыльцо вечером','Мяукни 3 раза'], reward:{xp:25,event:'concert'}, npc:null, unlock:false },
  { id:'q_notes', title:'Записки старого хозяина', icon:'📝', desc:'Митрич говорит, что прежний хозяин оставил письма. Найди их и верни Митричу!', steps:['Поговори с Митричем','Верни ему найденное письмо'], reward:{xp:35}, npc:'mitrych', unlock:false },
  { id:'q_greenhouse', title:'Открыть теплицу', icon:'🌿', desc:'Заброшенная теплица закрыта уже много лет.', steps:['Найди ключ от теплицы','Расчисти вход','Войди в теплицу'], reward:{xp:40,zone:'greenhouse'}, npc:'mag', unlock:false },
  { id:'q_party', title:'Праздник во дворе', icon:'🎉', desc:'Пора устроить праздник! Укрась двор с Лизой и собери всех.', steps:['Помоги Лизе украсить двор','Позови всех','Устрой праздник'], reward:{xp:50,event:'party'}, npc:null, unlock:false },
  { id:'q_secret', title:'Тайна старой теплицы', icon:'🔮', desc:'Что скрывает заброшенная теплица? Разгадай тайну!', steps:['Войди в теплицу','Найди Солнечный колокольчик','Узнай историю дома'], reward:{item:'sunBell',xp:60}, npc:null, unlock:false },
  { id:'q_finale', title:'Финал: Вернуть уют дому', icon:'🏡', desc:'Рыжик почти всё сделал! Собери всех и верни дому уют.', steps:['Завершить основные квесты','Собрать всех у дома вечером','Позвонить в Солнечный колокольчик'], reward:{xp:100,event:'finale'}, npc:null, unlock:false },
];

/* ──────────────────────────────────────────────
   GAME DATA: ACHIEVEMENTS
   ────────────────────────────────────────────── */
const ACHIEVEMENTS = [
  { id:'ach01', name:'Первый мяу',           icon:'😺', desc:'Мяукни впервые!', secret:false },
  { id:'ach02', name:'Первый друг',          icon:'🤝', desc:'Подружись с первым персонажем.', secret:false },
  { id:'ach03', name:'Рыбак',                icon:'🎣', desc:'Поймай рыбку у пруда.', secret:false },
  { id:'ach04', name:'Исследователь',        icon:'🔍', desc:'Открой 5 зон карты.', secret:false },
  { id:'ach05', name:'Друг Лёхи',           icon:'🎸', desc:'Достигни макс. доверия с Лёхой.', secret:false },
  { id:'ach06', name:'Рок-кот',             icon:'🤘', desc:'Подружись с Игорем.', secret:false },
  { id:'ach07', name:'Тайный кот',           icon:'🕵️', desc:'Найди тайную кошачью тропу.', secret:true },
  { id:'ach08', name:'Коллекционер',         icon:'💎', desc:'Собери 10 предметов в инвентарь.', secret:false },
  { id:'ach09', name:'Герой двора',          icon:'🏅', desc:'Выполни 10 квестов.', secret:false },
  { id:'ach10', name:'Ночной охотник',       icon:'🌙', desc:'Активно играй ночью.', secret:false },
  { id:'ach11', name:'Солнечный кот',        icon:'☀️', desc:'Найди Солнечный колокольчик.', secret:false },
  { id:'ach12', name:'Мастер прыжков',       icon:'🤸', desc:'Прыгни 50 раз.', secret:false },
  { id:'ach13', name:'Знаток сада',          icon:'🌸', desc:'Исследуй весь сад.', secret:false },
  { id:'ach14', name:'Хранитель теплицы',    icon:'🌿', desc:'Открой заброшенную теплицу.', secret:false },
  { id:'ach15', name:'Лучший мурлыка',       icon:'💕', desc:'Используй мурчание 20 раз.', secret:false },
  { id:'ach16', name:'Полный инвентарь',     icon:'🎒', desc:'Набери 15 предметов.', secret:false },
  { id:'ach17', name:'Все друзья',           icon:'👥', desc:'Подружись со всеми жителями.', secret:false },
  { id:'ach18', name:'Все зоны открыты',     icon:'🗺️', desc:'Открой все зоны карты.', secret:false },
  { id:'ach19', name:'Все квесты выполнены', icon:'✅', desc:'Пройди все квесты!', secret:false },
  { id:'ach20', name:'Настоящий хозяин двора',icon:'👑', desc:'Достигни максимальной кошачьей славы!', secret:false },
];

/* ──────────────────────────────────────────────
   GAME DATA: UPGRADES
   ────────────────────────────────────────────── */
const UPGRADES = [
  { id:'pillow',  name:'Подушка',       icon:'🛏️', cost:5,  desc:'Мягкая подушка для отдыха. +10 энергии.' },
  { id:'bowl_up', name:'Новая миска',   icon:'🥣', cost:3,  desc:'Красивая миска. +5 сытости каждый день.' },
  { id:'awning',  name:'Навес',         icon:'⛱️', cost:8,  desc:'Защищает от дождя.' },
  { id:'carpet',  name:'Коврик',        icon:'🪡', cost:4,  desc:'Уютный коврик.' },
  { id:'toy',     name:'Игрушка',       icon:'🐭', cost:3,  desc:'Весёлая игрушка. +5 настроения.' },
  { id:'lamp',    name:'Фонарик',       icon:'🔦', cost:6,  desc:'Освещает ночью.' },
  { id:'flowers', name:'Цветы',         icon:'🌸', cost:5,  desc:'Красивые цветы рядом. +5 настроения.' },
  { id:'sign',    name:'Табличка',      icon:'🪧', cost:2,  desc:'Табличка «Кошачий уголок».' },
  { id:'box',     name:'Коробка',       icon:'📦', cost:3,  desc:'Любимая коробка! +5 настроения.' },
  { id:'house',   name:'Мини-домик',    icon:'🏠', cost:15, desc:'Настоящий домик для Рыжика! Максимальный уют.' },
];

/* ──────────────────────────────────────────────
   GAME DATA: NPC
   ────────────────────────────────────────────── */
const NPC_DATA = [
  {
    id:'lyokha', name:'Лёха', emoji:'👱', color:'#aaddff',
    x:340, y:310, zone:'porch', human:true,
    trustLevels:['Незнакомец','Знакомый','Друг','Лучший друг'],
    schedule:{ morning:[350,300], day:[360,290], evening:[340,310], night:[330,320] },
    dialogues:{
      morning:['Доброе утро, Рыжик! Покормить тебя?','Тихое утро... люблю такие.','Кофе есть, всё хорошо.','Хорошо, когда утром так тихо.','Рыжик, ты уже исследовал двор?'],
      day:['Привет, рыжий! Как дела?','Тут тихо — мне нравится.','Знаешь, этот дом хранит много тайн...','Надо бы прибраться, но лень.','Слушаю музыку, мешать не буду.'],
      evening:['Эй, Рыжик. Посиди рядом.','Закат красивый сегодня...','Сыграю что-нибудь тихое на гитаре.','Вечером всегда спокойнее. Люблю это.','Поставил старую пластинку. Слышишь?'],
      night:['Не спишь? Я тоже.','Звёзды сегодня яркие.','Потерял кассету... не видел?','Ночью этот двор выглядит иначе.','Рыжик, ты хороший кот. Правда.']
    },
    quest:'q_lyokha', appearance:'👱 блондин, oversized кофта, спокойный взгляд',
    actions: ['Поговорить', 'Покормить Рыжика', 'Послушать гитару']
  },
  {
    id:'igor', name:'Игорь', emoji:'🤘', color:'#ff4444',
    x:550, y:480, zone:'yard', human:true,
    trustLevels:['Незнакомец','Знакомый','Друг','Лучший друг'],
    schedule:{ morning:null, day:[540,470], evening:[550,480], night:[540,490] },
    dialogues:{
      morning:null,
      day:['Рыжик! Рок-мяу! 🤘','Репетирую новый трек в гараже.','Этот риф просто огонь!','Ты чувствуешь ритм, кот?','Медиатор... кажется у пруда потерял.'],
      evening:['Сегодня мини-концерт на крыльце!','Потерял медиатор... вроде у пруда был.','Слышишь этот бит? Сверчки рокеры!','Играю для всех — и для тебя, Рыжик!','Рок — это не музыка, это состояние души.'],
      night:['Ночные прогулки — самое то!','Слышишь? Сверчки играют! Это рок!','Ночью вдохновение приходит само.','Пишу новую песню. Про кота и звёзды.','Ты, Рыжик, мой лучший слушатель!']
    },
    quest:'q_igor', appearance:'🤘 чёрная куртка, цепочка, эмоциональный',
    actions: ['Поговорить', 'Послушать концерт']
  },
  {
    id:'nastya', name:'Настя', emoji:'🌸', color:'#ff88aa',
    x:700, y:320, zone:'garden', human:true,
    trustLevels:['Незнакомец','Знакомый','Друг','Лучший друг'],
    schedule:{ morning:[700,320], day:[720,310], evening:[690,330], night:null },
    dialogues:{
      morning:['Доброе утро! Рыжик, ты такой фотогеничный!','Снимаю утреннюю росу. Красота!','Утренний свет — лучший для фото!','Смотри, цветок распустился!','Тихое утро — мой любимый момент.'],
      day:['Смотри какие цветы! Сфоткаю!','Делаю альбом воспоминаний об этом месте.','Хочу сфоткать тебя рядом с цветами!','Этот сад такой красивый — снимаю всё!','Рыжик, замри! Идеальный кадр!'],
      evening:['Вечерний свет идеален для фото...','Мечтаю поймать светлячков на камеру.','Закат в саду — просто сказка.','Сделала пятьсот фото сегодня, ха-ха.','Ты фотогеничный кот, Рыжик, серьёзно.'],
      night:null
    },
    quest:'q_nastya', appearance:'🌸 фотограф, зелёные глаза, тёплая кофта',
    actions: ['Позировать для фото', 'Поговорить']
  },
  {
    id:'liza', name:'Лиза', emoji:'💕', color:'#ff66ff',
    x:420, y:400, zone:'yard', human:true,
    trustLevels:['Незнакомец','Знакомый','Друг','Лучший друг'],
    schedule:{ morning:[430,390], day:[420,400], evening:[430,410], night:null },
    dialogues:{
      morning:['Утро! Пора украшать двор!','Рыжик, принёс наклейки? 😸','Я уже придумала новый дизайн двора!','Цветы, блёстки, гирлянды — будет класс!','Доброе утро, пушистый!'],
      day:['Рыжик! Смотри что я принесла!','Двор нужно украсить!','Потеряла свои наклейки везде...','Помоги мне найти наклейки? Плиз!','Ты самый лучший кот на свете!'],
      evening:['Вечеринка на дворе! Ты идёшь?','Твой уголок надо наклейками обклеить!','Зажгли гирлянду — красиво, правда?','Рыжик, ты украшение этого двора!','Этот вечер просто идеальный!'],
      night:null
    },
    quest:'q_liza', appearance:'💕 розовые волосы, хаотичная энергия',
    actions: ['Поговорить', 'Помочь украсить двор']
  },
  {
    id:'mag', name:'Маг', emoji:'🧙', color:'#8844ff',
    x:900, y:350, zone:'clearing', human:true,
    trustLevels:['Незнакомец','Знакомый','Друг','Доверенный'],
    schedule:{ morning:null, day:null, evening:[900,350], night:[880,360] },
    dialogues:{
      morning:null, day:null,
      evening:['Рыжик... Ты чувствуешь магию этого места?','Теплица хранит тайну. Найди колокольчик.','Легенда гласит — здесь живёт дух дома...','Звёзды уже выходят... Слышишь?','Я вижу то, что другие не замечают.'],
      night:['В темноте видно то, что скрыто днём.','Колокольчик луны зовёт... Слышишь?','Ищи, Рыжик. Ты близко к разгадке.','Этот дом был полон жизни... когда-то.','Иногда я сам исчезаю. Не ищи — найду тебя сам.']
    },
    quest:'q_mag', appearance:'🧙 загадочный, появляется ночью, знает тайны теплицы',
    actions: ['Выслушать легенду', 'Спросить о теплице']
  },
  {
    id:'sonya', name:'Соня', emoji:'🎒', color:'#44aaff',
    x:900, y:280, zone:'forest_path', human:true,
    trustLevels:['Незнакомец','Знакомый','Друг','Лучший друг'],
    schedule:{ morning:[900,280], day:[920,270], evening:[910,290], night:null },
    dialogues:{
      morning:['Рыжик! Иду в лес. Не отставай!','Знаю тут безопасную тропу через лес.','Утром лес особенно тихий и свежий.','Слышишь птиц? Это малиновка поёт!','С рюкзаком и хорошей компанией — красота.'],
      day:['Тут красиво, правда?','Через лес выйдем на поляну.','Я знаю все тропы в округе!','Вон та тропа ведёт к старым соснам.','Рыжик, ты умеешь ходить по лесу?'],
      evening:['Вечерний лес — это особенная красота...','Закат сквозь деревья. Волшебно.','Скоро стемнеет — пора возвращаться.','Я всегда нахожу дорогу домой.','Слышишь? Лягушки у пруда запели.'],
      night:null
    },
    quest:'q_sonya', appearance:'🎒 путешественница, спокойная, знает лес',
    actions: ['Идти вместе', 'Поговорить']
  },
  {
    id:'nena', name:'Нэна', emoji:'📓', color:'#aaffaa',
    x:650, y:420, zone:'yard', human:true,
    trustLevels:['Незнакомец','Знакомый','Друг','Лучший друг'],
    schedule:{ morning:[640,410], day:[650,420], evening:[640,430], night:null },
    dialogues:{
      morning:['Утро! Уже записываю наблюдения...','Рыжик, ты опять сделал что-то странное?','Блокнот полон интересных записей!','Сегодня видела необычную бабочку.','Записываю всё — это важно для истории места.'],
      day:['Рыжик, ты сделал это снова? Записываю!','Странные события тут каждый день...','Потеряла страницу из блокнота...','Здесь столько всего необычного — я не успеваю!','Ты такой загадочный кот, Рыжик.'],
      evening:['Вечером тут происходит кое-что интересное...','Ты очень интересный кот, Рыжик.','Записала ещё одно странное наблюдение.','Вечерний двор хранит свои тайны.','Рыжик, ты помогаешь мне писать историю этого места!'],
      night:null
    },
    quest:'q_nena', appearance:'📓 очки, блокнот, наблюдательная',
    actions: ['Поговорить', 'Помочь с записями']
  },
  {
    id:'kristina', name:'Кристина', emoji:'🔧', color:'#4488cc',
    x:480, y:460, zone:'yard', human:true,
    trustLevels:['Незнакомец','Знакомый','Друг','Лучший друг'],
    schedule:{ morning:[470,450], day:[480,460], evening:[490,470], night:null },
    dialogues:{
      morning:['Утро. Уже вижу, что надо чинить...','Рыжик, не мешай, работаю.','Руки не отдыхают — всегда есть работа.','Кофе, отвёртка, план. Готова.','Ты умеешь чинить вещи, Рыжик?'],
      day:['Нужно починить забор...','Рыжик. Ты мне помогаешь? Стой тут.','Ищу деталь для фонарика. Не видел?','Двор держится на мне. Буквально.','Сломанные вещи — это просто загадки.'],
      evening:['Закончила ремонт. Двор стал лучше!','Фонарик почти готов...','Всё починено. Можно отдохнуть.','Смотри, как блестит! Это я сделала.','Твой уголок тоже немного починила, кот.'],
      night:null
    },
    quest:'q_kristina', appearance:'🔧 тёмная одежда, татуировки, чинит вещи',
    actions: ['Помочь с ремонтом', 'Поговорить']
  },
  {
    id:'danya', name:'Даня', emoji:'🕶️', color:'#ffaa44',
    x:560, y:400, zone:'yard', human:true,
    trustLevels:['Незнакомец','Знакомый','Друг','Лучший друг'],
    schedule:{ morning:null, day:[560,400], evening:[550,410], night:null },
    dialogues:{
      morning:null,
      day:['Рыжик! Смотри что я нашёл!','Из этого можно скрафтить кое-что...','Собираю штуки для коробки сокровищ!','Вот гайка. Вот пружина. Вот шедевр!','Всё ненужное — на самом деле нужное.'],
      evening:['Смастерил тебе игрушку! Лови!','Рыжик, ты лучший! Держи штуку.','Сегодня сделал три вещи из мусора!','Главное — не выбрасывать, а думать!','Ты, Рыжик, тоже артефакт. Редкий кот.'],
      night:null
    },
    quest:'q_danya', appearance:'🕶️ красные очки, странные устройства, крафтит',
    actions: ['Поговорить', 'Получить игрушку']
  },
  {
    id:'prokhor', name:'Прохор', emoji:'💪', color:'#cc8844',
    x:300, y:500, zone:'fence', human:true,
    trustLevels:['Незнакомец','Знакомый','Друг','Уважаемый'],
    schedule:{ morning:[300,500], day:[310,490], evening:[320,510], night:null },
    dialogues:{
      morning:['Рыжик. Иди сюда. Буду чинить забор.','Доброе утро, кот. Работы много.','Кофе? Нет. Работа? Да.','Держись подальше от инструментов.','Утро — время делать дела, не болтать.'],
      day:['Хм. Неплохой кот.','Помоги — стой рядом, будешь надзирать.','Этот забор сам себя не починит.','Ты хоть молоток держал, кот?','Молчишь — уважаю. Я тоже не болтливый.'],
      evening:['Устал. Но забор почти готов.','Хороший был день, кот.','Работа сделана — могу отдохнуть.','Твой уголок тоже смотрится неплохо.','Завтра доделаю. Сейчас — тишина.'],
      night:null
    },
    quest:null, appearance:'💪 большой, татуированные руки, строит и чинит',
    actions: ['Поговорить', 'Наблюдать за работой']
  },
  {
    id:'mitrych', name:'Митрич', emoji:'👴', color:'#cc9966',
    x:350, y:270, zone:'porch', human:true,
    trustLevels:['Незнакомец','Знакомый','Знакомый','Уважаемый'],
    schedule:{ morning:[350,270], day:[340,280], evening:[360,265], night:null },
    dialogues:{
      morning:['Ааа, кот рыжий. Хорошая примета.','Давно тут живу. Всё помню.','Утро доброе, Рыжик. Садись, расскажу.','Дом этот строил ещё мой дед.','Молодёжь спит, а мы уже на ногах.'],
      day:['В этом доме много историй, кот.','Раньше тут яблони стояли вдоль дорожки.','Хозяин старый письма оставлял. Интересно...','Если найдёшь письмо — принеси мне, кот.','Я много знаю, да некому рассказать.'],
      evening:['Вечером вспоминается молодость...','Этот двор раньше был шумным. Полным жизни.','Рыжик, ты тут хозяин теперь.','Луна большая сегодня. К теплу.','Скоро расскажу тебе главную тайну дома.'],
      night:null
    },
    quest:'q_notes', appearance:'👴 старый житель, помнит историю дома, степенный',
    actions: ['Поговорить', 'Послушать историю']
  },
  {
    id:'baron', name:'Барон', emoji:'🐕', color:'#cc8833',
    x:488, y:350, zone:'yard', human:false,
    trustLevels:['Чужой','Знакомый','Приятель','Друг'],
    schedule:{ morning:[488,350], day:[460,360], evening:[500,340], night:[488,350] },
    dialogues:{
      morning:['Гав! (Доброе утро, кот!)','Гав-гав! (Интересный запах у тебя)'],
      day:['Вуф! (Побегаем?)','Гав! (Я охраняю двор!)','Вуф-вуф! (Не трогай мою косточку)'],
      evening:['Гав? (Ты куда, кот?)','Вуф! (Хорошо сегодня погуляли)'],
      night:['Тихо... (Рыжик, не шуми)','Гав! (Кто там?!)']
    },
    quest:null, appearance:'🐕 дворовой пёс, добродушный, охраняет территорию',
    actions: ['Погладить', 'Поиграть']
  },
];

/* ──────────────────────────────────────────────
   WORLD MAP ZONES
   ────────────────────────────────────────────── */
const ZONES = [
  { id:'yard',        name:'Двор',               color:'#4a8c2a', x:0,    y:0,    w:500,  h:500,  icon:'🏡', unlocked:true  },
  { id:'porch',       name:'Крыльцо',             color:'#8b6914', x:200,  y:-100, w:200,  h:200,  icon:'🚪', unlocked:true  },
  { id:'garden',      name:'Огород и сад',        color:'#2d6e15', x:500,  y:0,    w:400,  h:500,  icon:'🌿', unlocked:true  },
  { id:'barn',        name:'Сарай',               color:'#6b4226', x:-200, y:100,  w:200,  h:250,  icon:'🏚️', unlocked:false },
  { id:'well',        name:'Колодец',             color:'#444488', x:-200, y:-100, w:150,  h:150,  icon:'🪣', unlocked:true  },
  { id:'fence',       name:'Забор',               color:'#5c4a32', x:0,    y:500,  w:500,  h:100,  icon:'🪵', unlocked:true  },
  { id:'pond',        name:'Пруд',                color:'#2244aa', x:600,  y:400,  w:300,  h:250,  icon:'🏊', unlocked:false },
  { id:'forest_path', name:'Лесная тропинка',     color:'#1a4a0a', x:900,  y:0,    w:250,  h:600,  icon:'🌲', unlocked:false },
  { id:'clearing',    name:'Поляна',              color:'#3a7a1a', x:900,  y:-200, w:300,  h:300,  icon:'🌼', unlocked:false },
  { id:'greenhouse',  name:'Заброшенная теплица', color:'#2a5a2a', x:1100, y:200,  w:250,  h:250,  icon:'🌿', unlocked:false },
  { id:'attic',       name:'Чердак',              color:'#554433', x:200,  y:-300, w:200,  h:150,  icon:'🪜', unlocked:false },
  { id:'cellar',      name:'Подвал',              color:'#332211', x:200,  y:400,  w:200,  h:150,  icon:'🕯️', unlocked:false },
  { id:'roof',        name:'Крыша',               color:'#883322', x:100,  y:-400, w:300,  h:100,  icon:'🏠', unlocked:false },
  { id:'secret_path', name:'Тайная кошачья тропа',color:'#1a3a1a', x:950,  y:600,  w:150,  h:200,  icon:'🐱', unlocked:false },
];

/* ──────────────────────────────────────────────
   RANDOM EVENTS
   ────────────────────────────────────────────── */
const RANDOM_EVENTS = [
  { id:'guests',    text:'Приехали гости!',                icon:'🚗', effect:{ mood:10 } },
  { id:'rain',      text:'Начинается дождь',               icon:'🌧️', effect:{ weather:'rain' } },
  { id:'box',       text:'Появилась новая коробка!',        icon:'📦', effect:{ mood:5 } },
  { id:'guitar',    text:'Лёха играет на гитаре во дворе!', icon:'🎸', effect:{ mood:10 } },
  { id:'concert',   text:'Игорь устроил мини-концерт!',    icon:'🤘', effect:{ mood:15 } },
  { id:'photo',     text:'Настя сфотографировала закат!',   icon:'📸', effect:{ mood:5 } },
  { id:'party',     text:'Лиза украсила двор наклейками!',  icon:'💕', effect:{ mood:10 } },
  { id:'barn_noise',text:'В сарае что-то шуршит...',       icon:'🏚️', effect:{} },
  { id:'fireflies', text:'Ночью появились светлячки!',     icon:'✨', effect:{ mood:15 } },
  { id:'prokhor',   text:'Прохор починил часть забора!',    icon:'💪', effect:{ mood:5 } },
  { id:'danya_toy', text:'Даня смастерил новую штуку!',    icon:'🕶️', effect:{ mood:5 } },
];

/* ──────────────────────────────────────────────
   CAMERA
   ────────────────────────────────────────────── */
class Camera {
  constructor() { this.x = 0; this.y = 0; this.targetX = 0; this.targetY = 0; this.smoothing = 0.1; }
  follow(px, py, canvasW, canvasH, worldW, worldH) {
    this.targetX = px - canvasW / 2;
    this.targetY = py - canvasH / 2;
    this.targetX = Math.max(0, Math.min(worldW - canvasW, this.targetX));
    this.targetY = Math.max(0, Math.min(worldH - canvasH, this.targetY));
    this.x += (this.targetX - this.x) * this.smoothing;
    this.y += (this.targetY - this.y) * this.smoothing;
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
    const btn = id => document.getElementById(id);
    btn('ab-action').addEventListener('click', () => { this.input.actionPressed = true; g.telegram.vibrate(20); });
    btn('ab-meow').addEventListener('click',   () => { this.input.meowPressed   = true; g.telegram.vibrate(15); });
    btn('ab-inv').addEventListener('click',    () => { g.ui.toggle('inventory-screen'); g.audio.uiClick(); });
    btn('ab-map').addEventListener('click',    () => { g.ui.toggle('map-screen'); g.audio.uiClick(); });
    btn('ab-quest').addEventListener('click',  () => { g.ui.toggle('quest-screen'); g.audio.uiClick(); });
    btn('ab-pause').addEventListener('click',  () => { g.togglePause(); g.audio.uiClick(); });
  }
}

/* ──────────────────────────────────────────────
   PLAYER (Рыжик)
   ────────────────────────────────────────────── */
class Player {
  constructor() {
    this.x = 320; this.y = 360;
    this.w = 36;  this.h = 36;
    this.speed = 120; // px/sec
    this.facing = 1; // 1=right, -1=left
    this.moving = false;
    // Анимация
    this.frame = 0; this.frameTime = 0; this.frameRate = 0.18;
    this.tailAngle = 0; this.tailTime = 0;
    this.actionAnim = null; this.actionTime = 0;
    this.jumpY = 0; this.jumpVel = 0; this.jumping = false;
    this.jumpCount = 0;
    // Статы
    this.food    = 80;
    this.energy  = 100;
    this.mood    = 90;
    this.clean   = 100;
    this.curiosity = 60;
    this.glory   = 0;
    this.purrCount = 0;
    // Хронометраж статов
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
    // Анимация ходьбы
    if (this.moving) {
      this.frameTime += dt;
      if (this.frameTime >= this.frameRate) { this.frameTime = 0; this.frame = (this.frame + 1) % 4; }
    } else { this.frame = 0; }
    // Хвост
    this.tailTime += dt * (this.moving ? 4 : 1.5);
    this.tailAngle = Math.sin(this.tailTime) * (this.moving ? 0.6 : 0.25);
    // Прыжок
    if (this.jumping) {
      this.jumpVel += 600 * dt;
      this.jumpY += this.jumpVel * dt;
      if (this.jumpY >= 0) { this.jumpY = 0; this.jumpVel = 0; this.jumping = false; this.jumpCount++; }
    }
    // Стат-деградация
    this._statTimer += dt;
    if (this._statTimer >= 30) {
      this._statTimer = 0;
      this.food   = Math.max(0, this.food - 2);
      this.energy = Math.max(0, this.energy - 1);
      this.clean  = Math.max(0, this.clean - 1);
      if (this.food < 30) this.mood = Math.max(0, this.mood - 3);
    }
    // Действие-анимация
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
    // ctx is already translated to world space by caller
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
    this.trust = 0; // 0-3
    this.visible = true;
    this.facing = 1;
    this.animTime = 0;
    this.bobY = 0;
    this.emotion = null; this.emotionTime = 0;
    this.moveTimer = 0; this.moveTarget = null;
  }
  get trustLabel() { return this.trustLevels[Math.min(this.trust, this.trustLevels.length-1)]; }
  distTo(px, py) { return Math.sqrt((this.wx-px)**2 + (this.wy-py)**2); }
  update(dt, period) {
    this.animTime += dt;
    this.bobY = Math.sin(this.animTime * 1.8) * 2;
    // Эмоции
    if (this.emotion) { this.emotionTime -= dt; if (this.emotionTime <= 0) this.emotion = null; }
    // Движение по расписанию (простая)
    this.moveTimer += dt;
    if (this.moveTimer > 5 && this.schedule) {
      this.moveTimer = 0;
      const pos = this.schedule[period];
      if (pos) {
        this.moveTarget = { x: pos[0] + (Math.random()-0.5)*40, y: pos[1] + (Math.random()-0.5)*40 };
        this.visible = true;
      } else {
        this.visible = false; // персонаж отсутствует в это время суток
      }
    }
    if (this.moveTarget) {
      const dx = this.moveTarget.x - this.wx, dy = this.moveTarget.y - this.wy;
      const d = Math.sqrt(dx*dx+dy*dy);
      if (d < 3) { this.moveTarget = null; }
      else {
        if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
        const s = 30 * dt; this.wx += dx/d*s; this.wy += dy/d*s;
      }
    }
  }
  showEmotion(e) { this.emotion = e; this.emotionTime = 2; }
  draw(ctx, period) {
    if (!this.visible) return;
    ctx.save();
    ctx.translate(this.wx, this.wy + this.bobY);
    // Тень
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.ellipse(0, 18, 14, 5, 0, 0, Math.PI*2); ctx.fill();
    // Тело персонажа
    if (this.human) {
      this._drawHuman(ctx);
    } else {
      this._drawAnimal(ctx);
    }
    // Эмоция
    if (this.emotion) {
      const emoMap = { happy:'😊', sad:'😢', angry:'😠', surprise:'😲', sleep:'😴', laugh:'😄', awkward:'😅' };
      ctx.font = '16px serif'; ctx.textAlign = 'center';
      ctx.fillText(emoMap[this.emotion] || '💭', 0, -46);
    }
    // Имя
    ctx.fillStyle = this.color || '#fff';
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3;
    ctx.strokeText(this.name, 0, -38);
    ctx.fillText(this.name, 0, -38);
    ctx.restore();
  }
  _drawHuman(ctx) {
    // Тело
    ctx.fillStyle = this.color || '#888';
    ctx.fillRect(-10, -20, 20, 28);
    // Голова
    ctx.fillStyle = '#f5c5a0';
    ctx.beginPath(); ctx.ellipse(0, -26, 10, 12, 0, 0, Math.PI*2); ctx.fill();
    // Эмодзи-символ персонажа
    ctx.font = '22px serif'; ctx.textAlign = 'center';
    ctx.fillText(this.emoji, 0, -19);
  }
  _drawAnimal(ctx) {
    ctx.font = '28px serif'; ctx.textAlign = 'center';
    ctx.fillText(this.emoji, 0, -10);
  }
}

/* ──────────────────────────────────────────────
   WORLD
   ────────────────────────────────────────────── */
class World {
  constructor() {
    this.width  = 1600;
    this.height = 1200;
    this.tileSize = 32;
    this._buildObjects();
    this.clouds = [];
    for (let i = 0; i < 8; i++) this.clouds.push({
      x: Math.random() * this.width, y: 20 + Math.random() * 120,
      w: 80 + Math.random() * 120, speed: 5 + Math.random() * 10
    });
    this.waterAnim = 0;
    this.flowers = [];
    for (let i = 0; i < 40; i++) this.flowers.push({
      x: 500 + Math.random() * 400, y: 100 + Math.random() * 400,
      color: ['#ff6699','#ffcc44','#ff44aa','#44aaff','#ffffff'][Math.floor(Math.random()*5)],
      size: 3 + Math.random() * 5, phase: Math.random()*Math.PI*2
    });
    this.fireflies = [];
    this.collectibles = []; // {x,y,item,id,collected}
    this._spawnCollectibles();
  }
  _buildObjects() {
    // Непроходимые прямоугольники: {x,y,w,h}
    this.solids = [
      // Дом
      { x:150, y:50,  w:300, h:200 },
      // Сарай (только стены, без проёма у двери)
      { x:50,  y:350, w:120, h:100 },
      // Колодец
      { x:80,  y:200, w:50,  h:50  },
      // Пруд — только вода (берег проходим для рыбалки)
      { x:685, y:468, w:185, h:138 },
      // Теплица
      { x:1100,y:200, w:200, h:200 },
    ];
    // Забор НЕ является препятствием — кот свободно перелезает
  }
  _spawnCollectibles() {
    const items = [
      { x:350, y:380, item:'bowl',     id:'c01' },
      { x:620, y:300, item:'apple',    id:'c02' },
      { x:640, y:280, item:'apple',    id:'c03' },
      { x:580, y:320, item:'seeds',    id:'c04' },
      // barnKey — у колодца (доступно с начала, квест отправляет к колодцу)
      { x:148, y:268, item:'barnKey',  id:'c05' },
      { x:380, y:460, item:'coin',     id:'c08' },
      // Рыбка — на западном берегу пруда (доступно)
      { x:635, y:512, item:'fish',     id:'c09' },
      { x:900, y:450, item:'leaf',     id:'c10' },
      { x:450, y:520, item:'pebble',   id:'c11' },
      { x:500, y:530, item:'pebble',   id:'c12' },
      { x:300, y:580, item:'letter',   id:'c13' },
      { x:120, y:240, item:'seeds',    id:'c14' },
      { x:1050,y:300, item:'acorn',    id:'c15' },
      { x:250, y:260, item:'button',   id:'c16' },
      { x:700, y:410, item:'pebble',   id:'c17' },
      { x:900, y:622, item:'bell',     id:'c18' },
      // Кассета — у двери сарая (появится после открытия через авто-выдачу)
      { x:184, y:458, item:'cassette', id:'c19' },
      // Медиатор Игоря — на берегу пруда (доступно после снятия забора)
      { x:632, y:490, item:'pick',     id:'c20' },
      { x:660, y:340, item:'diary',    id:'c21' },
      { x:350, y:440, item:'flashPart',id:'c22' },
      { x:420, y:290, item:'sticker',  id:'c23' },
      { x:500, y:260, item:'sticker',  id:'c24' },
      { x:600, y:380, item:'sticker',  id:'c25' },
      { x:700, y:290, item:'sticker',  id:'c26' },
      { x:320, y:320, item:'sticker',  id:'c27' },
      { x:820, y:200, item:'feather',  id:'c28' },
      { x:790, y:210, item:'yarn',     id:'c29' },
      { x:950, y:380, item:'moonBell', id:'c30' },
      { x:1200,y:320, item:'sunBell',  id:'c_final' },
    ];
    this.collectibles = items.map(i => ({ ...i, collected: false }));
  }
  isSolid(x, y, w = 0, h = 0) {
    const hw = w / 2, hh = h / 2;
    for (const s of this.solids) {
      if (x + hw > s.x && x - hw < s.x + s.w && y + hh > s.y && y - hh < s.y + s.h) return true;
    }
    return false;
  }
  currentZone(px, py) {
    for (const z of ZONES) {
      const zx = z.x + 600, zy = z.y + 500; // world-space offset
      if (px > zx && px < zx + z.w && py > zy && py < zy + z.h) return z;
    }
    return ZONES[0];
  }
  update(dt, weather, time) {
    this.waterAnim += dt * 1.2;
    this.clouds.forEach(c => { c.x += c.speed * dt; if (c.x > this.width + 200) c.x = -200; });
    // Светлячки (ночью)
    if (time.period === 'night' && this.fireflies.length < 30) {
      this.fireflies.push({
        x: 500 + Math.random() * 600, y: 100 + Math.random() * 500,
        vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*10,
        phase: Math.random()*Math.PI*2, life: 8 + Math.random()*8
      });
    } else if (time.period !== 'night') this.fireflies = [];
    this.fireflies.forEach(f => {
      f.x += f.vx * dt; f.y += f.vy * dt; f.phase += dt * 3; f.life -= dt;
    });
    this.fireflies = this.fireflies.filter(f => f.life > 0);
  }
  draw(ctx, cam, time, weather) {
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    const ox = -cam.x, oy = -cam.y;
    const t = GFX.t;

    // ── Sky gradient ──
    const skyG = ctx.createLinearGradient(0, 0, 0, ch);
    const sc = time.skyColor;
    if (time.period === 'night') {
      skyG.addColorStop(0, '#010118'); skyG.addColorStop(0.6, '#05082a'); skyG.addColorStop(1, '#0a1018');
    } else if (time.period === 'evening') {
      skyG.addColorStop(0, '#1a1040'); skyG.addColorStop(0.35, '#c04830'); skyG.addColorStop(0.7, '#f08830'); skyG.addColorStop(1, '#ffa840');
    } else if (time.period === 'morning') {
      skyG.addColorStop(0, '#1a2a4a'); skyG.addColorStop(0.4, '#8090c8'); skyG.addColorStop(0.8, '#d0b888'); skyG.addColorStop(1, '#f0d880');
    } else {
      skyG.addColorStop(0, '#4a88cc'); skyG.addColorStop(0.5, '#78b4e8'); skyG.addColorStop(1, '#a8d0f0');
    }
    ctx.fillStyle = skyG; ctx.fillRect(0, 0, cw, ch);

    // ── Sun / Moon ──
    if (time.period === 'day' || time.period === 'morning') {
      const sunProg = (time.hour - 5) / 13;
      const sx = cw * (0.08 + sunProg * 0.84), sy = 55 - Math.sin(sunProg * Math.PI) * 30;
      // Sun corona
      for (let ri = 3; ri >= 0; ri--) {
        const rg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 30 + ri * 22);
        rg.addColorStop(0, `rgba(255,240,100,${0.18 - ri*0.04})`); rg.addColorStop(1, 'transparent');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(sx, sy, 30+ri*22, 0, Math.PI*2); ctx.fill();
      }
      // Sun disc
      const sg = ctx.createRadialGradient(sx-6, sy-6, 3, sx, sy, 26);
      sg.addColorStop(0, '#ffffd0'); sg.addColorStop(0.5, '#ffe850'); sg.addColorStop(1, '#ffcc00');
      ctx.fillStyle = sg; ctx.shadowColor='#ffdd44'; ctx.shadowBlur=20;
      ctx.beginPath(); ctx.arc(sx, sy, 26, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    } else if (time.period === 'night' || time.period === 'evening') {
      // Moon
      const moonX = cw * 0.78, moonY = 48;
      const mg = ctx.createRadialGradient(moonX-4, moonY-4, 3, moonX, moonY, 22);
      mg.addColorStop(0, '#f8f8ee'); mg.addColorStop(0.7, '#d8d8c8'); mg.addColorStop(1, '#b8b8a8');
      ctx.fillStyle = mg; ctx.shadowColor='#aaaacc'; ctx.shadowBlur=18;
      ctx.beginPath(); ctx.arc(moonX, moonY, 22, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
      // Moon craters
      ctx.fillStyle='rgba(180,180,168,0.4)';
      [[moonX+6,moonY+4,4],[moonX-5,moonY-6,3],[moonX+4,moonY-8,2.5]].forEach(([cx2,cy2,r])=>{ctx.beginPath();ctx.arc(cx2,cy2,r,0,Math.PI*2);ctx.fill();});
      // Stars
      for (let si=0; si<120; si++) {
        const seed = si * 137.5;
        const starX = (seed * 7.3) % cw, starY = (seed * 4.7) % (ch*0.55);
        const alpha = 0.3 + 0.7 * Math.abs(Math.sin(t*0.5 + seed * 0.1));
        const starR = 0.8 + (seed % 3) * 0.5;
        ctx.fillStyle = `rgba(255,255,240,${alpha})`;
        ctx.beginPath(); ctx.arc(starX, starY, starR, 0, Math.PI*2); ctx.fill();
      }
    }

    // ── Parallax clouds ──
    this.clouds.forEach(c => {
      const px = c.x + ox * 0.25; // slower parallax
      const alpha = time.period === 'night' ? 0.15 : (time.period === 'evening' ? 0.6 : 0.75);
      const ccolor = time.period === 'evening'
        ? `rgba(255,170,100,${alpha})`
        : time.period === 'night'
          ? `rgba(80,90,140,${alpha})`
          : `rgba(255,255,255,${alpha})`;
      // Fluffy layered cloud
      ctx.fillStyle = ccolor;
      ctx.beginPath(); ctx.arc(px, c.y, c.w * 0.22, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(px - c.w*0.18, c.y + 6, c.w * 0.18, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + c.w*0.2, c.y + 8, c.w * 0.17, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + c.w*0.08, c.y + 3, c.w * 0.25, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(px - c.w*0.07, c.y + 8, c.w * 0.2, 0, Math.PI*2); ctx.fill();
      // Cloud shadow (bottom)
      ctx.fillStyle = `rgba(0,0,0,${0.05 * alpha})`;
      ctx.beginPath(); ctx.ellipse(px + 3, c.y + c.w * 0.2 + 4, c.w * 0.38, c.w * 0.08, 0, 0, Math.PI*2); ctx.fill();
    });

    // ── Ground / Grass ──
    drawGrass(ctx, ox, oy, this.width, this.height, t);

    // ── Dirt path ──
    drawPath(ctx, 220+ox, 200+oy, 80, 560, t);
    drawPath(ctx, 300+ox, 450+oy, 360, 80, t);

    // ── Structures ──
    drawHouse(ctx, 150+ox, 50+oy, t, time.period);
    drawBarn(ctx, 50+ox, 350+oy, t);
    drawWell(ctx, 80+ox, 200+oy, t);

    // ── Trees (varied sizes and types) ──
    [[580,80,1.2,0],[620,100,1,1],[560,120,0.9,2],[750,80,1.3,0],[780,60,1.1,1],
     [820,100,1,2],[900,50,1.4,0],[550,400,0.9,1],[580,420,1,2],[680,120,1.1,0],[950,400,0.8,1]
    ].forEach(([tx,ty,sz,vr],i) => drawTree(ctx, tx+ox, ty+oy, sz, vr, t+i*0.3));

    // ── Flowers ──
    drawFlowers(ctx, this.flowers, t);

    // ── Pond ──
    drawPond(ctx, 650+ox, 450+oy, t);

    // ── Greenhouse ──
    drawGreenhouse(ctx, 1100+ox, 200+oy, t);

    // ── Fence ──
    drawFence(ctx, ox, 500+oy, this.width, t);

    // ── Collectible items ──
    this.collectibles.filter(c => !c.collected).forEach(c => {
      const item = ITEMS[c.item]; if (!item) return;
      drawCollectible(ctx, item, c.x+ox, c.y+oy, t);
    });

    // ── Fireflies ──
    drawFireflies(ctx, this.fireflies, cam, t);

    // ── Weather ──
    drawWeatherEffects(ctx, weather, cam, cw, ch, t);

    // ── Lighting overlay (must be last) ──
    drawLightingOverlay(ctx, cw, ch, time.period, t, cam, weather.current);
  }


  drawMinimap(ctx, camX, camY, playerX, playerY, npcs, zones) {
    const mw = ctx.canvas.width, mh = ctx.canvas.height;
    const sx = mw / this.width, sy = mh / this.height;
    // Фон
    ctx.fillStyle = '#1a3a0a';
    ctx.fillRect(0, 0, mw, mh);
    // Зоны
    ZONES.forEach(z => {
      if (!z.unlocked) return;
      ctx.fillStyle = z.color + '88';
      ctx.fillRect((z.x + 600) * sx, (z.y + 500) * sy, z.w * sx, z.h * sy);
    });
    // Трава (базовая)
    ctx.fillStyle = 'rgba(60,120,20,0.6)';
    ctx.fillRect(0, 0, mw, mh);
    // Дом
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(150*sx, 50*sy, 300*sx, 200*sy);
    // Пруд
    ctx.fillStyle = '#4488cc';
    ctx.beginPath(); ctx.ellipse(775*sx, 540*sy, 120*sx, 80*sy, 0, 0, Math.PI*2); ctx.fill();
    // NPC точки
    npcs.forEach(n => {
      if (!n.visible) return;
      ctx.fillStyle = n.color || '#fff';
      ctx.beginPath(); ctx.arc(n.wx*sx, n.wy*sy, 3, 0, Math.PI*2); ctx.fill();
    });
    // Камера
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.5;
    // Игрок
    ctx.fillStyle = '#ff6600';
    ctx.beginPath(); ctx.arc(playerX*sx, playerY*sy, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(playerX*sx, playerY*sy, 2, 0, Math.PI*2); ctx.fill();
  }
  drawBigmap(ctx, unlockedZones, playerX, playerY, npcs) {
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    const sx = cw / this.width, sy = ch / this.height;
    ctx.fillStyle = '#1a3a0a'; ctx.fillRect(0,0,cw,ch);
    ctx.fillStyle = '#3a7a1a'; ctx.fillRect(0,0,cw,ch);
    ZONES.forEach(z => {
      const zx = (z.x+600)*sx, zy = (z.y+500)*sy, zw = z.w*sx, zh = z.h*sy;
      if (unlockedZones.includes(z.id)) {
        ctx.fillStyle = z.color;
        ctx.fillRect(zx,zy,zw,zh);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
        ctx.strokeRect(zx,zy,zw,zh);
        ctx.font = `${Math.max(10,zw*0.15)}px serif`; ctx.textAlign = 'center';
        ctx.fillText(z.icon, zx+zw/2, zy+zh/2);
        ctx.font = '9px system-ui'; ctx.fillStyle = '#fff';
        ctx.fillText(z.name, zx+zw/2, zy+zh/2+12);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(zx,zy,zw,zh);
        ctx.font = '14px serif'; ctx.textAlign = 'center';
        ctx.fillText('🔒', zx+zw/2, zy+zh/2);
      }
    });
    // Дом
    ctx.fillStyle = '#d4b896'; ctx.fillRect(150*sx,50*sy,300*sx,180*sy);
    ctx.fillStyle = '#8b3a2a';
    ctx.beginPath(); ctx.moveTo(150*sx,50*sy); ctx.lineTo(300*sx,30*sy); ctx.lineTo(450*sx,50*sy); ctx.closePath(); ctx.fill();
    // Пруд
    ctx.fillStyle = '#4488cc';
    ctx.beginPath(); ctx.ellipse(775*sx, 540*sy, 120*sx, 80*sy, 0, 0, Math.PI*2); ctx.fill();
    // NPC
    npcs.forEach(n => {
      if (!n.visible) return;
      ctx.fillStyle = n.color || '#fff';
      ctx.font = '14px serif'; ctx.textAlign = 'center';
      ctx.fillText(n.emoji, n.wx*sx, n.wy*sy);
    });
    // Игрок
    ctx.fillStyle = '#ff6600';
    ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(playerX*sx, playerY*sy, 6, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '12px serif'; ctx.textAlign = 'center';
    ctx.fillText('😺', playerX*sx, playerY*sy);
  }
}


/* ──────────────────────────────────────────────
   INVENTORY SYSTEM
   ────────────────────────────────────────────── */
class Inventory {
  constructor() {
    this.slots = 20;
    this.items = []; // {id, item, qty}
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
    // Filled
    this.items.forEach(slot => {
      const div = document.createElement('div');
      div.className = 'inv-slot';
      div.innerHTML = `<span class="inv-icon">${slot.item.icon[0]||'?'}</span><span class="inv-name">${slot.item.name}</span>`;
      if (slot.qty > 1) div.innerHTML += `<span style="font-size:9px;color:#f4873a">×${slot.qty}</span>`;
      div.onclick = () => {
        info.innerHTML = `<b>${slot.item.icon[0]} ${slot.item.name}</b><br>${slot.item.desc}${slot.item.rare?'<span style="color:#ffd844"> ★ Редкий</span>':''}`;
        // Use food items
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
        // Use quest items near NPCs
        const questItemNpc = {
          'cassette':'lyokha', 'pick':'igor', 'diary':'nena',
          'flashPart':'kristina', 'sticker':'liza', 'letter':'mitrych',
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
              const questMap = { 'cassette':'q_lyokha','pick':'q_igor','diary':'q_nena','flashPart':'q_kristina','sticker':'q_liza','letter':'q_notes' };
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
    // Empty
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
    this.active    = new Set(['q01','q02','q03','q_lyokha','q_igor']); // стартовые
    this.completed = new Set();
    this.progress  = {}; // id -> stepIndex
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
  }
  start(npc, lines, onEnd = null) {
    this.npc    = npc;
    this.lines  = lines;
    this.lineIdx= 0;
    this.active = true;
    this.onEnd  = onEnd;
    this.choices= null;
    this._render();
    this.audio.uiClick();
    this.telegram.vibrate(15);
  }
  startWithChoices(npc, text, choices) {
    this.npc    = npc;
    this.lines  = [text];
    this.lineIdx= 0;
    this.active = true;
    this.choices= choices;
    this._render();
  }
  advance() {
    if (!this.active) return;
    if (this.choices && this.lineIdx >= this.lines.length - 1) return; // choices shown
    this.lineIdx++;
    if (this.lineIdx >= this.lines.length) {
      this.close();
      return;
    }
    this._render();
    this.audio.uiClick();
  }
  _render() {
    const box  = document.getElementById('dialogue-box');
    const port = document.getElementById('dlg-portrait');
    const name = document.getElementById('dlg-name');
    const text = document.getElementById('dlg-text');
    const chEl = document.getElementById('dlg-choices');
    const hint = document.getElementById('dlg-tap-hint');
    const trust= document.getElementById('dlg-trust');

    box.style.display = 'flex';
    if (this.npc) {
      name.textContent = this.npc.name;
      name.style.color = this.npc.color || '#f4873a';
      trust.textContent = this.npc.trustLabel;
      // Canvas portrait
      let portCanvas = port.querySelector('canvas');
      if (!portCanvas) {
        portCanvas = document.createElement('canvas');
        portCanvas.width = 80; portCanvas.height = 80;
        portCanvas.style.cssText = 'width:68px;height:68px;border-radius:50%;';
        port.innerHTML = '';
        port.appendChild(portCanvas);
      }
      const pCtx = portCanvas.getContext('2d');
      pCtx.clearRect(0, 0, 80, 80);
      // BG circle
      const bgg = pCtx.createRadialGradient(40,40,5,40,40,40);
      const nc = this.npc.color || '#f4873a';
      bgg.addColorStop(0, nc + '33'); bgg.addColorStop(1, nc + '11');
      pCtx.fillStyle = bgg; pCtx.beginPath(); pCtx.arc(40,40,40,0,Math.PI*2); pCtx.fill();
      const npcId = this.npc.id === 'ryzhik' ? 'ryzhik' : (this.npc.human ? this.npc.id : null);
      if (npcId) {
        drawPortrait(pCtx, npcId, 'neutral');
      } else {
        // Animal — emoji on colored bg
        pCtx.font = '38px serif'; pCtx.textAlign='center'; pCtx.textBaseline='middle';
        pCtx.fillText(this.npc.emoji, 40, 42);
      }
      port.style.borderColor = this.npc.color || '#f4873a';
    }
    text.textContent = this.lines[this.lineIdx] || '';
    chEl.innerHTML = '';
    if (this.choices && this.lineIdx >= this.lines.length - 1) {
      hint.style.display = 'none';
      this.choices.forEach(ch => {
        const btn = document.createElement('button');
        btn.className = 'dlg-choice';
        btn.textContent = ch.text;
        btn.onclick = () => { this.audio.uiClick(); this.close(); if (ch.action) ch.action(); };
        chEl.appendChild(btn);
      });
    } else {
      hint.style.display = 'block';
    }
  }
  close() {
    this.active = false;
    document.getElementById('dialogue-box').style.display = 'none';
    if (this.onEnd) this.onEnd();
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
    // Refresh content
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
    const tl = document.getElementById('time-label'); if (tl) tl.textContent = time.periodRu;
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
    // Touch/click
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
      const bx = s.basket.x;
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
      // Вода
      ctx.fillStyle = '#1a4488'; ctx.fillRect(0,H/2,W,H/2);
      ctx.strokeStyle='rgba(100,200,255,0.3)'; ctx.lineWidth=1;
      for (let i=0;i<5;i++) { ctx.beginPath(); ctx.moveTo(0,H/2+20+i*20); ctx.lineTo(W,H/2+25+i*18); ctx.stroke(); }
      // Поплавок
      if (s.phase !== 'wait') {
        ctx.fillStyle=s.phase==='bite'?'#ff4444':'#ff8800';
        ctx.beginPath(); ctx.arc(W/2+Math.sin(s.timer)*30, s.barY, 10, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle='#888'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(50,30); ctx.lineTo(W/2+Math.sin(s.timer)*30, s.barY); ctx.stroke();
      }
      // Удочка
      ctx.strokeStyle='#8b6914'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(30,H-20); ctx.lineTo(50,30); ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font='13px system-ui'; ctx.textAlign='center';
      ctx.fillText(s.message, W/2, 25);
      ctx.fillText(`Попытки: ${s.attempts}  Улов: ${s.score}`, W/2, H-10);
    } else if (this.active === 'butterfly') {
      const b = s.butterfly;
      ctx.fillStyle='#1a3a0a'; ctx.fillRect(0,0,W,H);
      // Цветы фона
      for (let i=0;i<8;i++) { ctx.fillStyle=['#ff6699','#ffcc44','#ff44aa'][i%3]; ctx.beginPath(); ctx.arc(40+i*35,H-15+Math.sin(i)*5,8,0,Math.PI*2); ctx.fill(); }
      // Бабочка
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
      // Звёзды
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
      // Линия попадания
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

/* ──────────────────────────────────────────────
   MAIN GAME CLASS
   ────────────────────────────────────────────── */
class Game {
  constructor() {
    // Systems
    this.telegram     = new TelegramBridge();
    this.audio        = new AudioSystem();
    this.save         = new SaveSystem();
    this.time         = new TimeSystem();
    this.weather      = new WeatherSystem(this.audio);

    // Game objects
    this.camera       = new Camera();
    this.input        = new Input();
    this.player       = new Player();
    this.world        = new World();
    this.inventory    = new Inventory();
    this.quests       = new QuestSystem();
    this.dialogue     = new DialogueSystem(this.audio, this.telegram);
    this.achievements = null; // init after ui
    this.miniGame     = null;
    this.upgrades     = new Set();
    this.mobile       = null;

    // State
    this.running      = false;
    this.paused       = false;
    this.inMenu       = true;
    this.unlockedZones= ['yard','porch','garden','well','fence'];
    this.eventTimer   = 60;
    this.jumpCount    = 0;
    this.purrCount    = 0;
    this.collectedCount = 0;

    // NPC
    this.npcs = NPC_DATA.map(d => new NPC(d));

    // Canvas
    this.canvas = document.getElementById('game-canvas');
    this.ctx    = this.canvas.getContext('2d');

    // Timing
    this._raf  = null;
    this._last = 0;

    // Init UI after all systems
    this.ui = new UIManager(this);
    this.achievements = new AchievementSystem(this.ui, this.audio, this.telegram);
    this.miniGame     = new MiniGameSystem(this.audio, this.telegram);
    this.miniGame.game = this;

    // Setup
    this._resize();
    this._bindMenuButtons();
    this._bindGameButtons();
    initSplashFireflies();

    // Check save
    if (this.save.hasSave()) {
      document.getElementById('btn-continue').style.display = 'block';
      document.getElementById('btn-reset').style.display = 'block';
    }

    // Start loop (for splash animation)
    this._startLoop();
  }

  /* ── RESIZE ── */
  _resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width  = w;
    this.canvas.height = h;
  }

  /* ── MENU BUTTONS ── */
  _bindMenuButtons() {
    document.getElementById('btn-new-game').onclick = () => {
      this.audio.uiClick(); this.audio._resume();
      this._newGame();
    };
    document.getElementById('btn-continue').onclick = () => {
      this.audio.uiClick(); this.audio._resume();
      this._loadGame();
    };
    document.getElementById('btn-reset').onclick = () => {
      if (confirm('Сбросить весь прогресс?')) {
        this.save.reset();
        document.getElementById('btn-continue').style.display = 'none';
        document.getElementById('btn-reset').style.display = 'none';
        this.ui.notify('Прогресс сброшен.');
        this.audio.uiClick();
      }
    };
    document.getElementById('btn-about').onclick = () => {
      document.getElementById('about-screen').style.display = 'flex'; this.audio.uiClick();
    };
    document.getElementById('btn-settings-menu').onclick = () => {
      document.getElementById('settings-screen').style.display = 'flex'; this.audio.uiClick();
    };
    // Close about/settings from menu (they have ov-x buttons already set up in UIManager)
  }

  /* ── GAME BUTTONS ── */
  _bindGameButtons() {
    document.getElementById('btn-resume').onclick = () => { this.togglePause(); };
    document.getElementById('btn-save').onclick   = () => { this._saveGame(); this.ui.notify('💾 Сохранено!'); this.audio.questDone(); };
    document.getElementById('btn-ach').onclick    = () => { this.ui.open('ach-screen'); };
    document.getElementById('btn-upgrade').onclick= () => { this.ui.open('upgrade-screen'); };
    document.getElementById('btn-settings-pause').onclick = () => { this.ui.open('settings-screen'); };
    document.getElementById('btn-to-menu').onclick= () => {
      this._saveGame();
      this.togglePause();
      this._goToMenu();
    };
    // Keyboard
    document.addEventListener('keydown', e => {
      if (!this.running || this.paused) {
        if (e.code === 'Escape' && this.running) this.togglePause();
        return;
      }
      if (e.code === 'Escape') { this.togglePause(); return; }
      if (e.code === 'KeyI')   { this.ui.toggle('inventory-screen'); this.audio.uiClick(); }
      if (e.code === 'KeyQ')   { this.ui.toggle('quest-screen');     this.audio.uiClick(); }
      if (e.code === 'KeyM')   { this.ui.toggle('map-screen');       this.audio.uiClick(); }
    });
    // Dialogue tap
    document.getElementById('dialogue-box').onclick = () => {
      if (this.dialogue.active) { this.dialogue.advance(); }
    };
    // Canvas tap (collect items, close dialogues)
    this.canvas.addEventListener('click', e => {
      if (this.dialogue.active) { this.dialogue.advance(); }
    });
    window.addEventListener('resize', () => this._resize());
  }

  /* ── NEW GAME ── */
  _newGame() {
    this.player       = new Player();
    this.inventory    = new Inventory();
    this.quests       = new QuestSystem();
    this.time         = new TimeSystem();
    this.weather      = new WeatherSystem(this.audio);
    this.npcs         = NPC_DATA.map(d => new NPC(d));
    this.upgrades     = new Set();
    this.achievements = new AchievementSystem(this.ui, this.audio, this.telegram);
    this.unlockedZones= ['yard','porch','garden','well','fence'];
    this.miniGame     = new MiniGameSystem(this.audio, this.telegram);
    this.miniGame.game= this;
    this.ui           = new UIManager(this);
    this.achievements.ui = this.ui;
    this.dialogue     = new DialogueSystem(this.audio, this.telegram);
    this.world        = new World();
    this.weather.set('sunny');
    this._startPlaying();
    // Welcome
    setTimeout(() => {
      this.ui.notify('🐱 Добро пожаловать, Рыжик!');
      setTimeout(() => this.ui.notify('💡 Используй джойстик для движения'), 2500);
      // Check daily reward
      const lastDay = localStorage.getItem('ryzhik_lastday');
      const today = new Date().toDateString();
      if (lastDay !== today) { localStorage.setItem('ryzhik_lastday', today); setTimeout(() => this.ui.showDailyReward(this), 4000); }
    }, 800);
  }

  /* ── LOAD GAME ── */
  _loadGame() {
    const d = this.save.load();
    if (!d) { this._newGame(); return; }
    try {
      this.player.x = d.px || 320; this.player.y = d.py || 360;
      this.player.food = d.food ?? 80; this.player.energy = d.energy ?? 100;
      this.player.mood = d.mood ?? 90; this.player.clean = d.clean ?? 100;
      this.player.glory = d.glory || 0;
      this.time.day  = d.day  || 1;
      this.time.hour = d.hour || 6;
      this.unlockedZones = d.zones || ['yard','porch','garden','well','fence'];
      if (d.inventory) d.inventory.forEach(i => this.inventory.add(i.id, i.qty));
      if (d.quests_active)    d.quests_active.forEach(id => this.quests.active.add(id));
      if (d.quests_done)      d.quests_done.forEach(id => this.quests.completed.add(id));
      if (d.achievements)     d.achievements.forEach(id => this.achievements.unlocked.add(id));
      if (d.upgrades)         d.upgrades.forEach(id => this.upgrades.add(id));
      if (d.npc_trust) {
        d.npc_trust.forEach(([id, trust]) => {
          const npc = this.npcs.find(n => n.id === id);
          if (npc) npc.trust = trust;
        });
      }
      if (d.weather) this.weather.set(d.weather);
      this._startPlaying();
      this.ui.notify('✅ Прогресс загружен!');
    } catch(e) {
      console.warn('Load error:', e);
      this._newGame();
    }
  }

  /* ── SAVE ── */
  _saveGame() {
    this.save.save({
      px: this.player.x, py: this.player.y,
      food: this.player.food, energy: this.player.energy,
      mood: this.player.mood, clean: this.player.clean,
      glory: this.player.glory,
      day: this.time.day, hour: this.time.hour,
      zones: this.unlockedZones,
      inventory: this.inventory.items.map(i => ({ id: i.id, qty: i.qty })),
      quests_active: [...this.quests.active],
      quests_done:   [...this.quests.completed],
      achievements:  [...this.achievements.unlocked],
      upgrades:      [...this.upgrades],
      npc_trust:     this.npcs.map(n => [n.id, n.trust]),
      weather:       this.weather.current,
    });
  }

  /* ── START PLAYING ── */
  _startPlaying() {
    document.getElementById('splash-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    this.canvas.style.display = 'block';
    this.inMenu  = false;
    this.running = true;
    this.paused  = false;
    if (!this.mobile) {
      this.mobile = new MobileControls(this.input, this);
    }
    this.audio.startMusic();
    this.camera.x = Math.max(0, this.player.x - this.canvas.width / 2);
    this.camera.y = Math.max(0, this.player.y - this.canvas.height / 2);
    this.telegram.showBackButton(() => this._goToMenu());
  }

  /* ── GO TO MENU ── */
  _goToMenu() {
    this.running = false;
    this.inMenu  = true;
    document.getElementById('splash-screen').style.display = 'flex';
    document.getElementById('hud').style.display = 'none';
    if (this.save.hasSave()) {
      document.getElementById('btn-continue').style.display = 'block';
      document.getElementById('btn-reset').style.display = 'block';
    }
    this.audio.stopMusic();
    this.audio.stopRain();
    this.telegram.hideBackButton();
  }

  /* ── PAUSE ── */
  togglePause() {
    this.paused = !this.paused;
    document.getElementById('pause-screen').style.display = this.paused ? 'flex' : 'none';
    if (!this.paused && this.ui.openScreen === 'pause-screen') this.ui.openScreen = null;
    this.audio.uiClick();
  }

  /* ── MAIN LOOP ── */
  _startLoop() {
    const loop = (ts) => {
      this._raf = requestAnimationFrame(loop);
      const dt = Math.min((ts - this._last) / 1000, 0.1);
      this._last = ts;
      if (this.inMenu) { this._drawMenu(); return; }
      if (!this.running || this.paused) return;
      this._update(dt);
      this._draw();
    };
    this._raf = requestAnimationFrame(loop);
  }

  /* ── UPDATE ── */
  _update(dt) {
    if (this.ui.isAnyOpen() || this.dialogue.active || this.miniGame.active) return;

    // Time
    const timeEvt = this.time.update(dt);
    if (timeEvt === 'newday') {
      this.ui.showEvent('🌅', `Наступил день ${this.time.day}!`);
      this._saveGame();
      const lastDay = localStorage.getItem('ryzhik_lastday');
      const today = new Date().toDateString();
      if (lastDay !== today) { localStorage.setItem('ryzhik_lastday',today); setTimeout(()=>this.ui.showDailyReward(this),2000); }
    }

    // Player
    this.player.update(dt, this.input, this.world);

    // Camera
    this.camera.follow(this.player.x, this.player.y, this.canvas.width, this.canvas.height, this.world.width, this.world.height);

    // World
    this.world.update(dt, this.weather, this.time);

    // Weather
    this.weather.update(dt, this.world.width, this.world.height, this.time.period);

    // NPCs
    this.npcs.forEach(npc => npc.update(dt, this.time.period));

    // Events timer
    this.eventTimer -= dt;
    if (this.eventTimer <= 0) {
      this.eventTimer = 90 + Math.random() * 120;
      this._triggerRandomEvent();
    }

    // Input: meow
    if (this.input.consumeMeow()) {
      this.player.playAction('meow');
      this.audio.meow();
      this.telegram.vibrate(20);
      this.purrCount++;
      this.achievements.unlock('ach01');
      if (this.purrCount >= 20) this.achievements.unlock('ach15');
      // Meow near Igor triggers concert quest
      const igor = this.npcs.find(n => n.id === 'igor');
      if (igor && igor.visible && igor.distTo(this.player.x, this.player.y) < 80) {
        if (this.quests.isActive('q_concert')) {
          this.quests.advanceStep('q_concert');
          this.ui.notify('🎵 Мяу-концерт начинается!');
        }
      }
    }

    // Input: action / interaction
    if (this.input.consumeAction()) {
      this._handleInteraction();
    }

    // Jump count achievement
    if (this.player.jumpCount > this.jumpCount) {
      this.jumpCount = this.player.jumpCount;
      if (this.jumpCount >= 50) this.achievements.unlock('ach12');
    }

    // Proximity checks
    this._checkProximity();

    // Achievement checks
    this._checkAchievements();

    // UI updates
    this.ui.updateStats(this.player);
    this.ui.updateTime(this.time);
    this.ui.updateWeather(this.weather);
    this.ui.updateQuestTracker(this.quests);

    // Minimap
    const mmCanvas = document.getElementById('minimap-canvas');
    if (mmCanvas) {
      const mmCtx = mmCanvas.getContext('2d');
      this.world.drawMinimap(mmCtx, this.camera.x, this.camera.y, this.player.x, this.player.y, this.npcs, ZONES);
    }
  }

  /* ── INTERACTION ── */
  _handleInteraction() {
    if (this.dialogue.active) { this.dialogue.advance(); return; }

    // Check collectibles first
    const item = this.world.collectibles.find(c => !c.collected && Math.sqrt((c.x-this.player.x)**2+(c.y-this.player.y)**2) < 50);
    if (item) {
      item.collected = true;
      const added = this.inventory.add(item.item);
      if (added) {
        const idata = ITEMS[item.item];
        this.player.playAction('pickup');
        this.audio.pickup();
        this.telegram.vibrate(25);
        this.ui.notify(`✨ Подобрал: ${idata.icon[0]} ${idata.name}`);
        this.collectedCount++;
        if (this.collectedCount >= 10) this.achievements.unlock('ach08');
        if (this.collectedCount >= 15) this.achievements.unlock('ach16');
        this._checkQuestItem(item.item);
      }
      return;
    }

    // Check NPC
    const npc = this.npcs.find(n => n.visible && n.distTo(this.player.x, this.player.y) < 70);
    if (npc) {
      this._talkToNPC(npc);
      return;
    }

    // Special locations

    // Пруд — рыбалка (на берегу)
    if (this.player.x > 600 && this.player.x < 688 && this.player.y > 445 && this.player.y < 615) {
      if (this.quests.isActive('q_fish')) {
        this.miniGame.start('fishing', this);
        this.quests.advanceStep('q_fish');
        return;
      }
      this.miniGame.start('fishing', this);
      return;
    }

    // Сарай — открыть ключом
    if (this.player.x > 30 && this.player.x < 260 && this.player.y > 330 && this.player.y < 490) {
      if (!this.unlockedZones.includes('barn')) {
        if (this.inventory.has('barnKey')) {
          // Открываем сарай
          if (this.quests.isActive('q02')) {
            this._onQuestAdvance('q02');
          }
          if (!this.unlockedZones.includes('barn')) {
            this.unlockedZones.push('barn');
            this.ui.notify('🏚️ Сарай открыт ключом!');
          }
          // Авто-выдача кассеты Лёхи из сарая
          const cassette = this.world.collectibles.find(c => c.id === 'c19' && !c.collected);
          if (cassette) {
            cassette.collected = true;
            this.inventory.add('cassette');
            this.collectedCount++;
            this.ui.notify('📼 Нашёл кассету Лёхи в сарае! Верни её Лёхе.');
          }
          return;
        } else {
          this.ui.notify('🔒 Сарай заперт. Найди ключ — ищи у колодца!');
          return;
        }
      }
      return;
    }

    // Теплица — открыть колокольчиком луны
    if (this.player.x > 1055 && this.player.x < 1112 && this.player.y > 188 && this.player.y < 415) {
      if (!this.unlockedZones.includes('greenhouse')) {
        if (this.inventory.has('moonBell')) {
          this.unlockedZones.push('greenhouse');
          this.achievements.unlock('ach14');
          this.ui.notify('🌿 Теплица открыта! Магия колокольчика...');
          // Завершаем квест на теплицу
          while (this.quests.isActive('q_greenhouse')) {
            const r = this.quests.advanceStep('q_greenhouse');
            if (r === 'complete') {
              const q = QUESTS.find(x => x.id === 'q_greenhouse');
              if (q && q.reward.xp) {
                this.player.glory += q.reward.xp;
                this.ui.notify(`⭐ +${q.reward.xp} Слава`);
              }
              this.ui.notify('✅ Квест выполнен: Открыть теплицу!');
              this.audio.questDone();
              break;
            }
          }
          // Авто-сбор Солнечного колокольчика
          const finalItem = this.world.collectibles.find(c => c.id === 'c_final' && !c.collected);
          if (finalItem) {
            finalItem.collected = true;
            this.inventory.add('sunBell');
            this.collectedCount++;
            this.ui.notify('🔔✨ Солнечный колокольчик найден!');
            this._checkQuestItem('sunBell');
          }
          return;
        } else {
          this.ui.notify('🔒 Теплица закрыта. Маг говорил о колокольчике луны...');
          return;
        }
      }
      return;
    }

    // Purr if nothing
    this.player.playAction('purr');
    this.audio.purr();
  }

  /* ── NPC TALK ── */
  _talkToNPC(npc) {
    const period = this.time.period;
    const lines  = npc.dialogues[period];
    if (!lines || lines.length === 0) {
      this.dialogue.start(npc, ['...', `${npc.name} молчит.`]);
      return;
    }
    const line = lines[Math.floor(Math.random() * lines.length)];
    npc.showEmotion('happy');
    this.audio.uiClick();

    // Quest-specific dialogue
    if (npc.quest && this.quests.isActive(npc.quest)) {
      const q = QUESTS.find(x => x.id === npc.quest);
      const step = this.quests.currentStep(npc.quest);
      const choices = [
        { text: `💬 ${step ? 'О квесте: ' + step : 'Поговорить'}`, action: () => {
          npc.trust = Math.min(3, npc.trust + 1);
          this._onQuestAdvance(npc.quest);
          this.achievements.unlock('ach02');
        }},
        { text: '🐾 Просто погладить', action: () => {
          this.player.mood = Math.min(100, this.player.mood + 5);
          this.audio.purr();
          this.ui.notify(`${npc.name} рад!`);
        }},
      ];
      this.dialogue.startWithChoices(npc, line, choices);
    } else {
      // Regular dialogue
      const extra = npc.trust >= 2 ? [`${npc.name} смотрит на тебя тепло.`] : [];
      this.dialogue.start(npc, [line, ...extra], () => {
        npc.trust = Math.min(3, npc.trust + 1);
        if (npc.trust >= 2) this._checkAllFriends();
      });
    }
    this.achievements.unlock('ach02');
    // Check "meet 3 characters" quest
    if (this.quests.isActive('q03')) {
      const metCount = this.npcs.filter(n => n.trust >= 1).length;
      if (metCount >= 3) {
        this._onQuestAdvance('q03');
      }
    }
  }

  /* ── QUEST ADVANCE ── */
  _onQuestAdvance(qid) {
    const result = this.quests.advanceStep(qid);
    if (result === 'complete') {
      const q = QUESTS.find(x => x.id === qid);
      this.ui.notify(`✅ Квест выполнен: ${q.title}!`);
      this.audio.questDone();
      this.telegram.vibrateSuccess();
      if (q.reward) {
        if (q.reward.item) { this.inventory.add(q.reward.item); this.ui.notify(`🎁 Получено: ${ITEMS[q.reward.item]?.icon[0]} ${ITEMS[q.reward.item]?.name}`); }
        if (q.reward.xp)   { this.player.glory += q.reward.xp; this.ui.notify(`⭐ +${q.reward.xp} Слава`); }
        if (q.reward.zone) { if (!this.unlockedZones.includes(q.reward.zone)) { this.unlockedZones.push(q.reward.zone); this.ui.notify(`🗺️ Новая зона: ${ZONES.find(z=>z.id===q.reward.zone)?.name||q.reward.zone}`); } }
        if (q.reward.trust){ const npc = this.npcs.find(n=>n.id===q.reward.trust); if(npc) npc.trust = Math.min(3, npc.trust+2); }
        if (q.reward.event === 'finale') this._triggerFinale();
        if (q.reward.event === 'party')  this.ui.showEvent('🎉','Праздник во дворе! Все собрались вместе!');
        if (q.reward.event === 'concert') this.ui.showEvent('🎵','Мяу-концерт начинается!');
      }
      // Unlock follow-up quests based on progress
      const doneCount = this.quests.completed.size;
      if (doneCount >= 2) { this.quests.unlock('q_nastya'); this.quests.unlock('q_liza'); }
      if (doneCount >= 3) { this.quests.unlock('q_explore'); this.quests.unlock('q_fish'); }
      if (doneCount >= 4) { this.quests.unlock('q_sonya'); this.quests.unlock('q_nena'); }
      if (doneCount >= 5) { this.quests.unlock('q_kristina'); this.quests.unlock('q_danya'); }
      if (doneCount >= 6) { this.quests.unlock('q_mag'); this.quests.unlock('q_attic'); }
      if (doneCount >= 7) { this.quests.unlock('q_cellar'); this.quests.unlock('q_shiny'); }
      if (doneCount >= 8) { this.quests.unlock('q_firefly'); this.quests.unlock('q_concert'); }
      if (doneCount >= 4) { this.quests.unlock('q_notes'); }
      if (doneCount >= 10) { this.quests.unlock('q_greenhouse'); this.achievements.unlock('ach09'); }
      if (doneCount >= 12) { this.quests.unlock('q_party'); }
      if (doneCount >= 14) { this.quests.unlock('q_secret'); }
      if (doneCount >= 16) { this.quests.unlock('q_finale'); }
    } else if (result === 'advance') {
      const q = QUESTS.find(x => x.id === qid);
      this.ui.notify(`📋 ${q.title}: ${this.quests.currentStep(qid)}`);
    }
  }

  /* ── CHECK QUEST ITEM ── */
  _checkQuestItem(itemId) {
    const checks = {
      'bowl': 'q01', 'barnKey': 'q02',
      // cassette/pick/diary/letter сдаются через инвентарь ("Отдать NPC"), не через _checkQuestItem
      'flashPart': 'q_kristina',
      'sticker': 'q_liza', 'moonBell': 'q_mag',
      'sunBell': 'q_secret',
    };
    const qid = checks[itemId];
    if (qid && this.quests.isActive(qid)) {
      this._onQuestAdvance(qid);
    }
    if (itemId === 'sticker') {
      const cnt = this.inventory.count('sticker');
      if (cnt >= 5 && this.quests.isActive('q_liza')) {
        this._onQuestAdvance('q_liza');
      }
    }
    // Колокольчик луны → сдвигаем квест на теплицу ("Найди ключ от теплицы")
    if (itemId === 'moonBell' && this.quests.isActive('q_greenhouse')) {
      if ((this.quests.progress['q_greenhouse'] || 0) === 0) {
        this._onQuestAdvance('q_greenhouse');
      }
    }
    const shiny = ['coin','pebble','bell','leaf','button','acorn','ribbon','moonBell'];
    if (shiny.includes(itemId)) {
      const total = shiny.reduce((s,i) => s + this.inventory.count(i), 0);
      if (total >= 5 && this.quests.isActive('q_shiny')) { this._onQuestAdvance('q_shiny'); }
      if (total >= 10) { this.achievements.unlock('ach08'); }
    }
    if (itemId === 'sunBell') {
      this.achievements.unlock('ach11');
      setTimeout(() => this._triggerFinale(), 2000);
    }
  }

  /* ── PROXIMITY CHECKS ── */
  _checkProximity() {
    let hint = null;
    // Items
    const item = this.world.collectibles.find(c => !c.collected && Math.sqrt((c.x-this.player.x)**2+(c.y-this.player.y)**2) < 50);
    if (item) {
      const idata = ITEMS[item.item];
      hint = `Поднять ${idata.icon[0]} ${idata.name}`;
    }
    // NPCs
    const npc = this.npcs.find(n => n.visible && n.distTo(this.player.x, this.player.y) < 70);
    if (npc) hint = `Поговорить с ${npc.name}`;
    // Пруд (берег)
    if (!hint && this.player.x > 600 && this.player.x < 688 && this.player.y > 445 && this.player.y < 615) {
      hint = '🎣 Порыбачить [E]';
    }
    // Сарай
    if (!hint && this.player.x > 30 && this.player.x < 260 && this.player.y > 330 && this.player.y < 490) {
      if (!this.unlockedZones.includes('barn')) {
        hint = this.inventory.has('barnKey') ? '🏚️ Открыть сарай [E]' : '🔒 Сарай закрыт — ищи ключ у колодца';
      } else {
        hint = '🏚️ Сарай (открыт)';
      }
    }
    // Теплица (снаружи, у западной стены)
    if (!hint && this.player.x > 1055 && this.player.x < 1112 && this.player.y > 188 && this.player.y < 415) {
      if (!this.unlockedZones.includes('greenhouse')) {
        hint = this.inventory.has('moonBell') ? '🌿 Открыть теплицу [E]' : '🔒 Теплица закрыта — нужен колокольчик луны';
      } else {
        hint = '🌿 Теплица (открыта)';
      }
    }
    this.ui.setInteractHint(hint);
  }

  /* ── RANDOM EVENTS ── */
  _triggerRandomEvent() {
    if (Math.random() > 0.4) return; // 40% chance each check
    const evt = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    this.ui.showEvent(evt.icon, evt.text);
    if (evt.effect.weather) this.weather.set(evt.effect.weather);
    if (evt.effect.mood)    this.player.mood = Math.min(100, this.player.mood + evt.effect.mood);
    if (evt.effect.food)    this.player.food = Math.min(100, this.player.food + evt.effect.food);
    if (evt.effect.item)    this.inventory.add(evt.effect.item);
  }

  /* ── ACHIEVEMENT CHECKS ── */
  _checkAchievements() {
    if (this.time.period === 'night') this.achievements.unlock('ach10');
    if (this.unlockedZones.length >= 5)  this.achievements.unlock('ach04');
    if (this.unlockedZones.length >= 14) this.achievements.unlock('ach18');
    if (this.quests.completed.size >= 20) this.achievements.unlock('ach19');
    if (this.player.glory >= 200) this.achievements.unlock('ach20');
    const lyokha = this.npcs.find(n=>n.id==='lyokha');
    if (lyokha && lyokha.trust >= 3) this.achievements.unlock('ach05');
    const igor = this.npcs.find(n=>n.id==='igor');
    if (igor && igor.trust >= 3) this.achievements.unlock('ach06');
    if (this.unlockedZones.includes('secret_path')) this.achievements.unlock('ach07');
    if (this.unlockedZones.includes('greenhouse')) this.achievements.unlock('ach14');
    if (this.unlockedZones.includes('garden') && this.unlockedZones.includes('pond')) this.achievements.unlock('ach13');
  }

  _checkAllFriends() {
    const allFriends = this.npcs.every(n => n.trust >= 2);
    if (allFriends) this.achievements.unlock('ach17');
  }

  /* ── FINALE ── */
  _triggerFinale() {
    this.ui.showEvent('🔔','Звенит Солнечный колокольчик! Двор наполняется светлячками...');
    this.weather.set('starry');
    this.player.mood = 100; this.player.food = 100; this.player.energy = 100;
    this.achievements.unlock('ach11');
    this.achievements.unlock('ach20');
    setTimeout(() => {
      this.ui.notify('🏡 Все собрались у дома! Двор снова уютный!');
      setTimeout(() => {
        this.ui.notify('🐱 Рыжик обрёл настоящий дом. Конец первой главы!');
        this.npcs.forEach(n => { n.trust = 3; n.showEmotion('happy'); });
        this.audio.questDone();
      }, 4000);
    }, 4000);
  }

  /* ── MENU DRAW ── */
  _drawMenu() {
    // Just animate splash cats/stars in canvas (optional)
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
    // Not needed — splash is CSS/HTML, canvas hidden in menu
  }

  /* ── MAIN DRAW ── */
  _draw() {
    const ctx = this.ctx;
    GFX.t = performance.now() / 1000; // update global time
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // World (includes sky, ground, structures, weather, lighting)
    this.world.draw(ctx, this.camera, this.time, this.weather);
    // NPCs (screen coords passed via cam offset)
    const camOffset = { x: -this.camera.x, y: -this.camera.y };
    this.npcs.forEach(npc => npc.draw(ctx, camOffset, this.time.period));
    // Player (world-space translate)
    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);
    this.player.draw(ctx);
    ctx.restore();
  }
}

/* ──────────────────────────────────────────────
   FIX NPC draw signature
   ────────────────────────────────────────────── */
NPC.prototype.draw = function(ctx, cam, period) {
  if (!this.visible) return;
  const sx = this.wx + cam.x, sy = this.wy + cam.y;
  const cw = ctx.canvas.width, ch = ctx.canvas.height;
  if (sx < -80 || sx > cw+80 || sy < -80 || sy > ch+80) return;
  
  if (this.human) {
    drawHumanNPC(ctx, {
      id: this.id, x: sx, y: sy, t: GFX.t,
      facing: this.facing,
      moving: !!this.moveTarget,
      trust: this.trust, emotion: this.emotion,
    });
    // Name badge
    ctx.save();
    const bw = this.name.length * 6 + 12;
    ctx.fillStyle='rgba(20,10,0,0.75)';
    GFX.roundRect(ctx, sx - bw/2, sy - 52, bw, 16, 4); ctx.fill();
    ctx.fillStyle = this.color||'#fff'; ctx.font='bold 10px system-ui'; ctx.textAlign='center';
    ctx.fillText(this.name, sx, sy - 40);
    ctx.restore();
  } else {
    // Animal NPC — draw with emoji + glow
    ctx.save();
    ctx.translate(sx, sy + this.bobY);
    GFX.shadow(ctx, 0, 18, 14, 5, 0.18);
    ctx.font = '30px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.shadowColor='rgba(0,0,0,0.4)'; ctx.shadowBlur=6;
    ctx.fillText(this.emoji, 0, -8);
    ctx.shadowBlur=0;
    if (this.emotion) {
      const emoMap={happy:'😊',sad:'😢',angry:'😠',surprise:'😲',sleep:'😴',laugh:'😄',awkward:'😅'};
      ctx.font='16px serif'; ctx.fillText(emoMap[this.emotion]||'💭',12,-30);
    }
    // Name badge
    const bw = this.name.length * 6 + 12;
    ctx.fillStyle='rgba(20,10,0,0.75)';
    GFX.roundRect(ctx, -bw/2, -52, bw, 16, 4); ctx.fill();
    ctx.fillStyle = this.color||'#fff'; ctx.font='bold 10px system-ui'; ctx.textAlign='center';
    ctx.fillText(this.name, 0, -40);
    // Trust hearts
    if (this.trust > 0) {
      const tColors=['','#aaa','#44cc88','#ffd844'];
      ctx.font='9px serif'; ctx.fillStyle = tColors[this.trust]||'#fff';
      for(let i=0;i<this.trust;i++) ctx.fillText('♥',-6+i*6,-54);
    }
    ctx.restore();
  }
};
;

/* ──────────────────────────────────────────────
   BOOT
   ────────────────────────────────────────────── */
window.addEventListener('load', () => {
  window.game = new Game();
});

