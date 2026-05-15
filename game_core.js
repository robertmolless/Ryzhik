'use strict';

class Game {
  constructor() {
    this.telegram     = new TelegramBridge();
    this.audio        = new AudioSystem();
    this.save         = new SaveSystem();
    this.time         = new TimeSystem();
    this.weather      = new WeatherSystem(this.audio);

    this.camera       = new Camera();
    this.input        = new Input();
    this.player       = new Player();
    this.world        = new World();
    this.interior       = new InteriorManager();
    this.barn           = (typeof BarnManager !== 'undefined') ? new BarnManager() : null;
    this.militaryOffice = (typeof MilitaryOfficeManager !== 'undefined') ? new MilitaryOfficeManager() : null;
    this.mountains      = (typeof MountainsManager !== 'undefined') ? new MountainsManager() : null;
    this.inventory      = new Inventory();
    this.quests       = new QuestSystem();
    this.dialogue     = new DialogueSystem(this.audio, this.telegram);
    this.achievements = null;
    this.miniGame     = null;
    this.ambient      = new AmbientSystem();
    this.upgrades     = new Set();
    this.mobile       = null;
    this.flags        = { nickStoryComplete: false };

    this.running      = false;
    this.paused       = false;
    this.inMenu       = true;
    this.unlockedZones= ['yard','porch','garden','well','fence'];
    this.eventTimer   = 60;
    this.jumpCount    = 0;
    this.purrCount    = 0;
    this.collectedCount = 0;

    this.npcs = NPC_DATA.map(d => new NPC(d));

    this.canvas = document.getElementById('game-canvas');
    this.ctx    = this.canvas.getContext('2d');

    this._raf  = null;
    this._last = 0;

    this.ui = new UIManager(this);
    this.achievements = new AchievementSystem(this.ui, this.audio, this.telegram);
    this.miniGame     = new MiniGameSystem(this.audio, this.telegram);
    this.miniGame.game = this;

    this._resize();
    this._bindMenuButtons();
    this._bindGameButtons();
    initSplashFireflies();

    this._mobileEnterBtn = null;
    const mobileEnterBtn = document.createElement('button');
    mobileEnterBtn.id = 'btn-enter-house';
    mobileEnterBtn.className = 'act-btn';
    mobileEnterBtn.textContent = '🏠';
    mobileEnterBtn.style.cssText = 'display:none;position:fixed;right:90px;bottom:90px;z-index:200;font-size:22px;width:50px;height:50px;border-radius:50%;background:rgba(255,200,100,0.85);border:2px solid #c8860a;cursor:pointer;';
    mobileEnterBtn.addEventListener('touchstart', e => { e.preventDefault(); if (this.running && !this.paused) this._handleInteraction(); });
    mobileEnterBtn.addEventListener('click', () => { if (this.running && !this.paused) this._handleInteraction(); });
    document.body.appendChild(mobileEnterBtn);
    this._mobileEnterBtn = mobileEnterBtn;

    if (this.save.hasSave()) {
      document.getElementById('btn-continue').style.display = 'block';
      document.getElementById('btn-reset').style.display = 'block';
    }

    this._startLoop();
  }

  _resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width  = w;
    this.canvas.height = h;
  }

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
  }

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
    document.getElementById('dialogue-box').onclick = () => {
      if (this.dialogue.active) { this.dialogue.advance(); }
    };
    this.canvas.addEventListener('click', e => {
      if (this.dialogue.active) { this.dialogue.advance(); }
    });
    window.addEventListener('resize', () => this._resize());
  }

  _newGame() {
    this.player       = new Player();
    this.inventory    = new Inventory();
    this.quests       = new QuestSystem();
    this.time         = new TimeSystem();
    this.weather      = new WeatherSystem(this.audio);
    this.npcs         = NPC_DATA.map(d => new NPC(d));
    this.interior     = new InteriorManager();
    this.barn         = (typeof BarnManager !== 'undefined') ? new BarnManager() : null;
    this.militaryOffice = (typeof MilitaryOfficeManager !== 'undefined') ? new MilitaryOfficeManager() : null;
    this.mountains    = (typeof MountainsManager !== 'undefined') ? new MountainsManager() : null;
    this.upgrades     = new Set();
    this.achievements = new AchievementSystem(this.ui, this.audio, this.telegram);
    this.unlockedZones= ['yard','porch','garden','well','fence'];
    this.miniGame     = new MiniGameSystem(this.audio, this.telegram);
    this.miniGame.game= this;
    this.ui           = new UIManager(this);
    this.achievements.ui = this.ui;
    this.dialogue     = new DialogueSystem(this.audio, this.telegram);
    this.world        = new World();
    this.flags        = { nickStoryComplete: false };
    this.ambient      = new AmbientSystem();
    this.weather.set('sunny');
    this._startPlaying();
    setTimeout(() => {
      this.ui.notify('🐱 Добро пожаловать, Рыжик!');
      setTimeout(() => this.ui.notify('💡 Используй джойстик для движения'), 2500);
      const lastDay = localStorage.getItem('ryzhik_lastday');
      const today = new Date().toDateString();
      if (lastDay !== today) { localStorage.setItem('ryzhik_lastday', today); setTimeout(() => this.ui.showDailyReward(this), 4000); }
    }, 800);
  }

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
      if (d.npc_stages) {
        d.npc_stages.forEach(([id, stage]) => {
          const npc = this.npcs.find(n => n.id === id);
          if (npc) npc.questStage = stage;
        });
      }
      if (d.npc_stories) {
        d.npc_stories.forEach(([id, idx]) => {
          const npc = this.npcs.find(n => n.id === id);
          if (npc) npc.storyIndex = idx || 0;
        });
      }
      if (d.weather) this.weather.set(d.weather);
      if (d.interior && this.interior) this.interior.load(d.interior);
      if (d.barn     && this.barn)     this.barn.load(d.barn);
      if (d.militaryOffice && this.militaryOffice) this.militaryOffice.load(d.militaryOffice);
      if (d.mountains && this.mountains) this.mountains.load(d.mountains);
      if (d.flags) this.flags = Object.assign({ nickStoryComplete: false }, d.flags);
      this._startPlaying();
      this.ui.notify('✅ Прогресс загружен!');
    } catch(e) {
      console.warn('Load error:', e);
      this._newGame();
    }
  }

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
      npc_stages:    this.npcs.map(n => [n.id, n.questStage || 0]),
      npc_stories:   this.npcs.map(n => [n.id, n.storyIndex || 0]),
      weather:       this.weather.current,
      interior:      this.interior ? this.interior.save() : null,
      barn:          this.barn     ? this.barn.save()     : null,
      militaryOffice: this.militaryOffice ? this.militaryOffice.save() : null,
      mountains:      this.mountains      ? this.mountains.save()      : null,
      flags:         this.flags || {},
    });
  }

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

  togglePause() {
    this.paused = !this.paused;
    document.getElementById('pause-screen').style.display = this.paused ? 'flex' : 'none';
    if (!this.paused && this.ui.openScreen === 'pause-screen') this.ui.openScreen = null;
    this.audio.uiClick();
  }

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

  _update(dt) {
    if (this.ui.isAnyOpen() || this.dialogue.active || this.miniGame.active) return;

    const timeEvt = this.time.update(dt);
    if (timeEvt === 'newday') {
      this.ui.showEvent('🌅', `Наступил день ${this.time.day}!`);
      this._saveGame();
      const lastDay = localStorage.getItem('ryzhik_lastday');
      const today = new Date().toDateString();
      if (lastDay !== today) { localStorage.setItem('ryzhik_lastday',today); setTimeout(()=>this.ui.showDailyReward(this),2000); }
    }

    if (this.interior) this.interior.update(dt);
    if (this.barn)     this.barn.update(dt);
    if (this.militaryOffice) this.militaryOffice.update(dt);
    if (this.mountains) this.mountains.update(dt);

    if (this.interior && this.interior.active) {
      this.interior.move(this.input.dx, this.input.dy, dt);
      const near = this.interior.nearestFurniture();
      const hint = document.getElementById('interact-hint');
      if (near) {
        if (hint) { hint.style.display = 'block'; hint.textContent = `[E] ${near.label}`; }
        const al = document.getElementById('action-label'); if (al) al.textContent = `[E] ${near.label}`;
      } else {
        if (hint) hint.style.display = 'none';
        const al = document.getElementById('action-label'); if (al) al.textContent = '';
      }
      if (this.input.consumeAction()) this._handleInteraction();
      if (this.input.consumeMeow()) { this.player.playAction('meow'); this.audio.meow(); }
      this.ui.updateStats(this.player);
      this.ui.updateTime(this.time);
      this.ui.updateWeather(this.weather);
      this.ui.updateQuestTracker(this.quests);
      if (this._mobileEnterBtn) { this._mobileEnterBtn.style.display = 'block'; this._mobileEnterBtn.textContent = '🚪'; }
      return;
    }

    if (this.barn && this.barn.active) {
      this.barn.move(this.input.dx, this.input.dy, dt);
      const barnNear = this.barn.nearestFurniture();
      const hintEl = document.getElementById('interact-hint');
      if (barnNear) {
        if (hintEl) { hintEl.style.display = 'block'; hintEl.textContent = `[E] ${barnNear.label}`; }
        const al = document.getElementById('action-label'); if (al) al.textContent = `[E] ${barnNear.label}`;
      } else {
        if (hintEl) hintEl.style.display = 'none';
        const al = document.getElementById('action-label'); if (al) al.textContent = '';
      }
      if (this.input.consumeAction()) this._handleInteraction();
      if (this.input.consumeMeow()) { this.player.playAction('meow'); this.audio.meow(); }
      this.ui.updateStats(this.player);
      this.ui.updateTime(this.time);
      this.ui.updateWeather(this.weather);
      this.ui.updateQuestTracker(this.quests);
      if (this._mobileEnterBtn) { this._mobileEnterBtn.style.display = 'block'; this._mobileEnterBtn.textContent = '🚪'; }
      return;
    }

    if (this.militaryOffice && this.militaryOffice.active) {
      this.militaryOffice.move(this.input.dx, this.input.dy, dt);
      const hintEl = document.getElementById('interact-hint');
      const al = document.getElementById('action-label');
      const milNear = this.militaryOffice.nearestFurniture();
      const nearNick = this.militaryOffice.nearNick();
      const nearCert = this.militaryOffice.nearCertificate();
      const nickForHint = this.npcs.find(n => n.id === 'nick');
      const nickQS = (nickForHint && nickForHint.questStage) || 0;
      let milHint = null;
      if (milNear) { if (milNear.action !== 'pickup_nick' || nickQS >= 3) { milHint = `[E] ${milNear.label}`; } }
      if (nearNick && !this.flags.nickStoryComplete) milHint = '[E] ☕ Поговорить с Ником';
      if (nearCert) milHint = '[E] 📄 Поднять потерянную справку';
      if (hintEl) { if (milHint) { hintEl.style.display = 'block'; hintEl.textContent = milHint; } else { hintEl.style.display = 'none'; } }
      if (al) al.textContent = milHint || '';
      if (this.input.consumeAction()) this._handleInteraction();
      if (this.input.consumeMeow()) { this.player.playAction('meow'); this.audio.meow(); }
      this.ui.updateStats(this.player);
      this.ui.updateTime(this.time);
      this.ui.updateWeather(this.weather);
      this.ui.updateQuestTracker(this.quests);
      if (this._mobileEnterBtn) { this._mobileEnterBtn.style.display = 'block'; this._mobileEnterBtn.textContent = '🚪'; }
      return;
    }

    if (this.mountains && this.mountains.active) {
      this.mountains.move(this.input.dx, this.input.dy, dt);
      const hintEl = document.getElementById('interact-hint');
      const al = document.getElementById('action-label');
      let mtnHint = null;
      if (this.mountains.nearSonya()) mtnHint = '[E] 🎒 Поговорить с Соней';
      if (this.mountains.nearUpperViewpoint() && this.quests.isActive('q_sonya_mtn3')) mtnHint = '[E] ⛰️ Смотровая площадка';
      const mtnNear = this.mountains.nearestObject();
      if (mtnNear && !mtnHint) mtnHint = `[E] ${mtnNear.label}`;
      if (hintEl) { if (mtnHint) { hintEl.style.display = 'block'; hintEl.textContent = mtnHint; } else { hintEl.style.display = 'none'; } }
      if (al) al.textContent = mtnHint || '';
      if (this.input.consumeAction()) this._handleInteraction();
      if (this.input.consumeMeow()) { this.player.playAction('meow'); this.audio.meow(); }
      this.ui.updateStats(this.player);
      this.ui.updateTime(this.time);
      this.ui.updateWeather(this.weather);
      this.ui.updateQuestTracker(this.quests);
      if (this._mobileEnterBtn) { this._mobileEnterBtn.style.display = 'block'; this._mobileEnterBtn.textContent = '🚪'; }
      return;
    }

    this.player.update(dt, this.input, this.world);
    this.camera.follow(this.player.x, this.player.y, this.canvas.width, this.canvas.height, this.world.width, this.world.height);
    this.world.update(dt, this.weather, this.time);
    this.weather.update(dt, this.world.width, this.world.height, this.time.period);
    if (this.ambient) this.ambient.update(dt, this.time, this.weather);
    this.npcs.forEach(npc => npc.update(dt, this.time.period));

    const nickNPC = this.npcs.find(n => n.id === 'nick');
    if (nickNPC && !(this.flags && this.flags.nickStoryComplete)) { nickNPC.visible = false; }

    this.eventTimer -= dt;
    if (this.eventTimer <= 0) {
      this.eventTimer = 90 + Math.random() * 120;
      this._triggerRandomEvent();
    }

    if (this.input.consumeMeow()) {
      this.player.playAction('meow');
      this.audio.meow();
      this.telegram.vibrate(20);
      this.purrCount++;
      this.achievements.unlock('ach01');
      if (this.purrCount >= 20) this.achievements.unlock('ach15');
      const igor = this.npcs.find(n => n.id === 'igor');
      if (igor && igor.visible && igor.distTo(this.player.x, this.player.y) < 80) {
        if (this.quests.isActive('q_concert')) { this.quests.advanceStep('q_concert'); this.ui.notify('🎵 Мяу-концерт начинается!'); }
      }
    }

    if (this.input.consumeAction()) { this._handleInteraction(); }

    if (this.player.jumpCount > this.jumpCount) {
      this.jumpCount = this.player.jumpCount;
      if (this.jumpCount >= 50) this.achievements.unlock('ach12');
    }

    this._checkProximity();
    this._checkAchievements();
    this.ui.updateStats(this.player);
    this.ui.updateTime(this.time);
    this.ui.updateWeather(this.weather);
    this.ui.updateQuestTracker(this.quests);

    const mmCanvas = document.getElementById('minimap-canvas');
    if (mmCanvas) {
      const mmCtx = mmCanvas.getContext('2d');
      this.world.drawMinimap(mmCtx, this.camera.x, this.camera.y, this.player.x, this.player.y, this.npcs, ZONES);
      if (this.mountains) {
        const mmSx = mmCanvas.width / this.world.width, mmSy = mmCanvas.height / this.world.height;
        mmCtx.save(); mmCtx.globalAlpha = this.mountains.unlockedFlag ? 1.0 : 0.35;
        mmCtx.font = `${Math.max(6, Math.floor(mmCanvas.width * 0.065))}px serif`; mmCtx.textAlign = 'center';
        mmCtx.fillText('⛰️', 1320 * mmSx, 100 * mmSy); mmCtx.globalAlpha = 1; mmCtx.restore();
      }
    }
  }

  _handleInteraction() {
    if (this.dialogue.active) { this.dialogue.advance(); return; }

    if (this.mountains && this.mountains.active) {
      if (this.mountains.nearSonya()) { const sonya = this.npcs.find(n => n.id === 'sonya'); this._handleMountainSonyaDialogue(sonya); return; }
      if (this.mountains.nearUpperViewpoint() && this.quests.isActive('q_sonya_mtn3')) { const sonya = this.npcs.find(n => n.id === 'sonya'); this._triggerMountainVista(sonya); return; }
      const obj = this.mountains.nearestObject();
      if (obj) {
        if (obj.action === 'exit_mountains') { this.mountains.startExit(); this.audio.uiClick(); this.ui.notify('🌲 Рыжик спускается с тропы...'); return; }
        if (obj.action === 'pickup' && obj.item && !this.mountains.pickedItems.has(obj.id)) {
          this.mountains.pickedItems.add(obj.id);
          const added = this.inventory.add(obj.item);
          if (added) {
            const idata = ITEMS[obj.item];
            this.player.playAction('pickup'); this.audio.pickup(); this.telegram.vibrate(25);
            this.ui.notify(`✨ Подобрал: ${idata ? idata.icon[0] + ' ' + idata.name : obj.item}`);
            this._checkQuestItem(obj.item);
          }
          return;
        }
        if (obj.action === 'viewpoint_upper') { this.ui.notify('🏔️ Отсюда виден весь дом. Красивый вид!'); return; }
        if (obj.action === 'sit') { this.ui.notify('🪵 Рыжик устраивается на лавочке. Хорошее место.'); return; }
        if (obj.action === 'examine') {
          const t = { mt_viewpoint:'⛰️ С площадки видно весь дом и деревья далеко внизу.', mt_campfire:'🔥 Остывший костёр. Кто-то сидел здесь совсем недавно.' };
          this.ui.notify(t[obj.id] || '🔍 Интересное место.'); return;
        }
      }
      return;
    }

    if (this.militaryOffice && this.militaryOffice.active) {
      if (this.militaryOffice.nearCertificate()) {
        this.militaryOffice.certPickedUp = true;
        this.inventory.add('nickCertificate'); this.audio.pickup(); this.telegram.vibrate(25);
        this.ui.notify('📄 Подобрал: Потерянная справка Ника!'); this._checkQuestItem('nickCertificate'); return;
      }
      const nickForPick = this.npcs.find(n => n.id === 'nick');
      if (nickForPick && (nickForPick.questStage || 0) >= 3) {
        const near = this.militaryOffice.nearestFurniture();
        if (near && near.action === 'pickup_nick') {
          this.militaryOffice.pickedMilItems.add(near.id); this.inventory.add(near.item);
          this.audio.pickup(); this.telegram.vibrate(25);
          const idata = ITEMS[near.item];
          this.ui.notify(`✨ Подобрал: ${idata ? idata.icon[0] + ' ' + idata.name : near.item}`); return;
        }
      }
      if (this.militaryOffice.nearNick()) {
        const nick = this.npcs.find(n => n.id === 'nick');
        if (nick && !this.flags.nickStoryComplete) { this._talkToNPC(nick); return; }
      }
      const near = this.militaryOffice.nearestFurniture();
      if (near) {
        if (near.action === 'exit_mil') { this.militaryOffice.startExit(); this.audio.uiClick(); this.ui.notify('🚪 Рыжик выходит из военкомата...'); return; }
        const t = { mo_desk:'📄 На столе горы бумаг. Всё в строгом беспорядке.', mo_boxes:'📦 Коробки набиты документами с 90-х годов.', mo_fan:'🌀 Вентилятор гудит. Кажется, он сдул несколько бумаг.', mo_papers:'📄 Бумаги со стола. Кто-то давно не убирался.' };
        if (near.action === 'examine') { this.ui.notify(t[near.id] || '🔍 Ничего особенного.'); return; }
      }
      return;
    }

    if (this.barn && this.barn.active) {
      const near = this.barn.nearestFurniture();
      if (near) { this._interactBarnFurniture(near); return; }
      if (this.barn.px < 80) { this.barn.startExit(); this.audio.uiClick(); this.ui.notify('🌿 Рыжик выходит из сарая...'); }
      return;
    }

    if (this.interior && this.interior.active) {
      const near = this.interior.nearestFurniture();
      if (near) { this._interactFurniture(near); return; }
      const indoorNpc = this._findNearestIndoorNPC();
      if (indoorNpc) { this._talkToNPC(indoorNpc); return; }
      return;
    }

    if (this.interior && !this.interior.active && !this.barn?.active) {
      if (this.player.x > 250 && this.player.x < 350 && this.player.y > 230 && this.player.y < 270) {
        this.interior.startEnter(); this.audio.uiClick(); this.ui.notify('🏠 Рыжик входит в дом...');
        if (this.quests.isActive('q_ind1')) this._onQuestAdvance('q_ind1');
        return;
      }
    }

    const item = this.world.collectibles.find(c => !c.collected && Math.sqrt((c.x-this.player.x)**2+(c.y-this.player.y)**2) < 50);
    if (item) {
      item.collected = true;
      const added = this.inventory.add(item.item);
      if (added) {
        const idata = ITEMS[item.item];
        this.player.playAction('pickup'); this.audio.pickup(); this.telegram.vibrate(25);
        this.ui.notify(`✨ Подобрал: ${idata.icon[0]} ${idata.name}`);
        this.collectedCount++;
        if (this.collectedCount >= 10) this.achievements.unlock('ach08');
        if (this.collectedCount >= 15) this.achievements.unlock('ach16');
        this._checkQuestItem(item.item);
      }
      return;
    }

    const npc = this.npcs.find(n => n.visible && n.distTo(this.player.x, this.player.y) < 70);
    if (npc) { this._talkToNPC(npc); return; }

    if (this.player.x > 600 && this.player.x < 688 && this.player.y > 445 && this.player.y < 615) {
      if (this.quests.isActive('q_fish')) { this.miniGame.start('fishing', this); this.quests.advanceStep('q_fish'); return; }
      this.miniGame.start('fishing', this); return;
    }

    if (this.militaryOffice && !this.militaryOffice.active) {
      const atMilDoor = this.player.x > 55 && this.player.x < 110 && this.player.y > 1130 && this.player.y < 1195;
      if (atMilDoor) { this.militaryOffice.startEnter(); this.audio.uiClick(); this.ui.notify('📋 Рыжик заходит в военкомат...'); return; }
    }

    if (this.mountains && !this.mountains.active) {
      const atMtnEntry = this.player.x > 1265 && this.player.x < 1385 && this.player.y > 45 && this.player.y < 175;
      if (atMtnEntry) {
        if (this.mountains.unlockedFlag) { this.mountains.startEnter(); this.audio.uiClick(); this.ui.notify('⛰️ Рыжик идёт по горной тропе...'); }
        else { this.ui.notify('⛰️ Тропа завалена ветками. Поговори с Соней — она знает путь.'); }
        return;
      }
    }

    if (this.player.x > 30 && this.player.x < 260 && this.player.y > 330 && this.player.y < 490) {
      if (!this.unlockedZones.includes('barn')) {
        if (this.inventory.has('barnKey')) {
          this.unlockedZones.push('barn');
          if (this.quests.isActive('q02')) this._onQuestAdvance('q02');
          this.ui.notify('🏚️ Сарай открыт ключом! Нажми снова, чтобы войти.'); return;
        } else { this.ui.notify('🔒 Сарай заперт. Найди ключ — он в кухонном шкафчике в доме!'); return; }
      }
      if (this.barn) { this.barn.startEnter(); this.audio.uiClick(); this.ui.notify('🏚️ Рыжик заходит в сарай...'); }
      return;
    }

    if (this.player.x > 1055 && this.player.x < 1112 && this.player.y > 188 && this.player.y < 415) {
      if (!this.unlockedZones.includes('greenhouse')) {
        if (this.inventory.has('moonBell')) {
          this.unlockedZones.push('greenhouse'); this.achievements.unlock('ach14');
          this.ui.notify('🌿 Теплица открыта! Магия колокольчика...');
          while (this.quests.isActive('q_greenhouse')) {
            const r = this.quests.advanceStep('q_greenhouse');
            if (r === 'complete') {
              const q = QUESTS.find(x => x.id === 'q_greenhouse');
              if (q && q.reward.xp) { this.player.glory += q.reward.xp; this.ui.notify(`⭐ +${q.reward.xp} Слава`); }
              this.ui.notify('✅ Квест выполнен: Открыть теплицу!'); this.audio.questDone(); break;
            }
          }
          const finalItem = this.world.collectibles.find(c => c.id === 'c_final' && !c.collected);
          if (finalItem) { finalItem.collected = true; this.inventory.add('sunBell'); this.collectedCount++; this.ui.notify('🔔✨ Солнечный колокольчик найден!'); this._checkQuestItem('sunBell'); }
          return;
        } else { this.ui.notify('🔒 Теплица закрыта. Маг говорил о колокольчике луны...'); return; }
      }
      return;
    }

    this.player.playAction('purr');
    this.audio.purr();
  }

  _interactFurniture(f) {
    const interior = this.interior;
    const period = this.time.period;
    if (f.period && f.period !== period) {
      const when = f.period === 'evening' ? 'вечером' : 'ночью';
      this.ui.notify(`💭 Это работает только ${when}...`); return;
    }
    switch (f.action) {
      case 'sit':
        interior.sitting = !interior.sitting;
        if (interior.sitting) { this.ui.notify(`😺 Рыжик удобно устроился на ${f.label.toLowerCase()}!`); this.player.energy = Math.min(100, this.player.energy + 5); }
        else { this.ui.notify('🐾 Рыжик встаёт...'); }
        this.player.playAction('purr'); break;
      case 'sleep': this._showSleepMenu(); break;
      case 'watch':
        interior.tvOn = !interior.tvOn;
        this.ui.notify(interior.tvOn ? '📺 Телевизор включён! Что-то интересное...' : '📺 Телевизор выключен.'); break;
      case 'listen':
        if (f.id === 'vinyl_pl' || f.label === 'Проигрыватель') { this.ui.notify('🎵 Тихая музыка наполняет комнату...'); }
        else { this.ui.notify('🎵 Рыжик тихо мурлычет в такт!'); }
        this.player.mood = Math.min(100, this.player.mood + 10);
        if (f.questId && this.quests.isActive(f.questId)) this._onQuestAdvance(f.questId);
        if (f.id === 'guitar1' && this.quests.isActive('q_ind2')) this._onQuestAdvance('q_ind2');
        break;
      case 'lamp': {
        const lampId = f.id;
        interior.lampOn[lampId] = !interior.lampOn[lampId];
        this.ui.notify(interior.lampOn[lampId] ? '💡 Лампа включена! Как уютно...' : '💡 Лампа выключена.');
        if (f.questId && this.quests.isActive(f.questId)) this._onQuestAdvance(f.questId);
        break;
      }
      case 'open':
        if (f.id === 'fridge') {
          interior.fridgeOpen = !interior.fridgeOpen;
          this.ui.notify(interior.fridgeOpen ? '🧊 Холодильник открыт! Тут яблоки и кефир.' : '🧊 Холодильник закрыт.');
        } else if (f.id === 'cabinet') {
          if (!interior.cabinetOpen) {
            interior.cabinetOpen = true;
            if (f.item === 'barnKey') {
              if (!this.unlockedZones.includes('barn') && !this.inventory.has('barnKey')) {
                interior.pickedItems.add(f.id); this.inventory.add('barnKey'); this.collectedCount++;
                this.ui.notify('🔑 В кухонном шкафчике нашёлся ключ от сарая!'); this._checkQuestItem('barnKey');
              } else { this.ui.notify('📦 Шкафчик открыт — ключ уже был взят.'); }
            } else if (f.item && !interior.pickedItems.has(f.id)) {
              interior.pickedItems.add(f.id); this.inventory.add(f.item); this.collectedCount++;
              const idata = ITEMS[f.item]; this.ui.notify(`🔑 В кухонном шкафчике нашёлся ${idata ? idata.name : f.item}!`);
              this._checkQuestItem(f.item);
              if (f.item === 'houseKey' && this.quests.isActive('q_ind3')) this._onQuestAdvance('q_ind3');
            } else { this.ui.notify('📦 Шкафчик открыт — внутри пусто.'); }
          } else { interior.cabinetOpen = false; this.ui.notify('📦 Шкафчик закрыт.'); }
        }
        break;
      case 'open_chest':
        if (!interior.chestOpen) {
          if (this.inventory.has('houseKey')) {
            interior.chestOpen = true; this.inventory.remove('houseKey');
            this.ui.notify('🗝️ Сундук открыт ключом! Там что-то старое...'); this.player.glory += 20;
            if (this.quests.isActive('q_ind3')) this._onQuestAdvance('q_ind3');
          } else { this.ui.notify('🔒 Сундук заперт. Нужен ключ — может быть в кухне?'); }
        } else { this.ui.notify('📦 Сундук уже открыт.'); }
        break;
      case 'pickup':
        if (!interior.pickedItems.has(f.id) && f.item) {
          interior.pickedItems.add(f.id); this.inventory.add(f.item); this.collectedCount++;
          const iname = ITEMS[f.item] ? ITEMS[f.item].name : f.item;
          this.ui.notify(`✨ Рыжик подобрал: ${iname}!`); this._checkQuestItem(f.item);
          if (f.questId && this.quests.isActive(f.questId)) this._onQuestAdvance(f.questId);
          if (f.item === 'houseKey' && this.quests.isActive('q_ind3')) this._onQuestAdvance('q_ind3');
          if (this.collectedCount >= 10) this.achievements.unlock('ach08');
          if (this.collectedCount >= 15) this.achievements.unlock('ach16');
        } else { this.ui.notify('💭 Рыжик уже взял всё интересное здесь.'); }
        break;
      case 'examine': {
        const msgs = {
          shelf:'📚 Книги, старые журналы, пара кассет... Всё пыльное, но уютное.',
          photos:'📸 Старые фотографии. Радостные лица, летний двор, молодой Лёха с гитарой...',
          boxes1:'📦 Старые коробки с вещами. Большинство пустые, но пахнут прошлым.',
          boxes2:'📦 Коробки забиты старыми журналами и пластинками.',
          boxes3:'📦 Тут что-то тяжёлое... вроде инструменты.',
          poster1:'🤘 Плакат рок-группы. Лёха явно фанат!',
          poster2:'🎸 Ещё один плакат. Автограф на нём!',
          headph:'🎧 Наушники. Если надеть — мир исчезнет.',
          kettle:'☕ Чайник ещё тёплый. Кто-то недавно пил чай.',
          balc_view:'🌅 Вид с балкона: сад, деревья, закатное небо. Красота!',
          lights:'✨ Гирлянды украшают балкон. Вечером светятся особенно красиво.',
        };
        this.ui.notify(msgs[f.id] || `💭 ${f.label}... интересно.`);
        if (f.id === 'photos' && this.quests.isActive('q_ind2')) this._onQuestAdvance('q_ind2');
        if (f.id === 'photos' && this.quests.isActive('q_ind7')) this._onQuestAdvance('q_ind7');
        break;
      }
      case 'eat':
        if (this.player.food < 100) { this.player.food = Math.min(100, this.player.food + 25); this.ui.notify('🥣 Рыжик поел из своей миски! Вкусно!'); }
        else { this.ui.notify('🥣 Рыжик сыт и доволен!'); }
        break;
      case 'stairs_up':
        if (this.interior.floor === 1) { this.interior.goFloor(2); this.ui.notify('🪜 Рыжик поднимается на второй этаж...'); if (this.quests.isActive('q_ind4')) this._onQuestAdvance('q_ind4'); }
        break;
      case 'stairs_down':
        if (this.interior.floor === 2) { this.interior.goFloor(1); this.ui.notify('🪜 Рыжик спускается вниз...'); }
        break;
      case 'exit_house':
        interior.startExit(); this.audio.uiClick(); this.ui.notify('🌿 Рыжик выходит из дома...'); break;
      default: break;
    }
  }

  _interactBarnFurniture(f) {
    const barn = this.barn;
    switch (f.action) {
      case 'exit_barn': barn.startExit(); this.audio.uiClick(); this.ui.notify('🌿 Рыжик выходит из сарая...'); break;
      case 'pickup':
        if (!barn.pickedItems.has(f.id) && f.item) {
          barn.pickedItems.add(f.id); this.inventory.add(f.item); this.collectedCount++;
          const iname = ITEMS[f.item] ? ITEMS[f.item].name : f.item;
          this.ui.notify(`✨ Рыжик нашёл: ${iname}!`);
          this.player.playAction('pickup'); this.audio.pickup(); this.telegram.vibrate(25);
          this._checkQuestItem(f.item);
          if (f.item === 'cassette' && this.quests.isActive('q_lyokha')) setTimeout(() => this.ui.notify('📼 Кассета Лёхи! Верни её ему.'), 1500);
          if (this.collectedCount >= 10) this.achievements.unlock('ach08');
          if (this.collectedCount >= 15) this.achievements.unlock('ach16');
        } else { this.ui.notify('💭 Рыжик уже взял всё интересное здесь.'); }
        break;
      case 'sit': this.ui.notify('😺 Рыжик запрыгивает на тюк сена! Тепло и колко...'); this.player.energy = Math.min(100, this.player.energy + 5); this.player.playAction('purr'); break;
      case 'examine': {
        const t = { b_shelf1:'🔧 Полка с инструментами. Молоток, гвозди, пила... всё покрыто пылью.', b_shelf2:'📦 Старые банки с краской. Пахнет скипидаром.', b_bike:'🚲 Старый велосипед. Давно не ездил — ручки облезли, но колёса целые!', b_lantern:'🔦 Старый керосиновый фонарь. Маслом ещё пахнет.', b_workbench:'🪚 Верстак с инструментами. Здесь точно что-то чинили.', b_boxes:'📦 Коробки с запчастями. Пыль и время.' };
        this.ui.notify(t[f.id] || `💭 ${f.label}... Интересно.`); break;
      }
      default: break;
    }
  }

  _findNearestIndoorNPC() {
    if (typeof INDOOR_NPC_SCHEDULE === 'undefined') return null;
    const period = this.time.period, floor = this.interior.floor;
    let best = null, bestD = 70;
    for (const [npcId, sched] of Object.entries(INDOOR_NPC_SCHEDULE)) {
      if (sched.floor !== floor) continue;
      const pos = sched[period]; if (!pos) continue;
      const npc = this.npcs.find(n => n.id === npcId); if (!npc) continue;
      const d = Math.sqrt((pos.x - this.interior.px) ** 2 + (pos.y - this.interior.py) ** 2);
      if (d < bestD) { bestD = d; best = npc; }
    }
    return best;
  }

  get QUEST_ITEM_REQUIREMENTS() {
    return {
      'q_lyokha':   { 1: { item:'cassette',  msg:'📼 Сначала найди кассету Лёхи в сарае!' } },
      'q_igor':     { 1: { item:'pick',       msg:'🎸 Медиатор Игоря ещё там, у пруда...' } },
      'q_nena':     { 1: { item:'diary',      msg:'📄 Поищи потерянную страницу Нэны.' } },
      'q_kristina': { 1: { item:'flashPart',  msg:'🔦 Найди сначала деталь для фонарика.' } },
    };
  }

  _talkToNPC(npc) {
    npc.showEmotion('happy');
    this.audio.uiClick();
    const def = (typeof NPC_QUEST_DEFS !== 'undefined') ? NPC_QUEST_DEFS[npc.id] : null;
    const qs  = npc.questStage || 0;
    const period = this.time.period;
    const greetLines = npc.dialogues?.[period] || npc.dialogues?.day || [];
    const greeting = greetLines.length ? greetLines[Math.floor(Math.random() * greetLines.length)] : `${npc.name} смотрит на тебя.`;
    const choices = [];
    const questStageLimit = (def && def.q3) ? 4 : 3;
    if (def && qs < questStageLimit) choices.push({ text: '📜 Задание', action: () => this._handleQuestDialogue(npc) });
    choices.push({ text: '💬 Поговорить', action: () => this._handleCasualChat(npc) });
    if (this.inventory.items.length > 0) choices.push({ text: '🎁 Отдать предмет', action: () => this._handleGiveItem(npc) });
    choices.push({ text: '👋 Пока', action: () => { this.player.mood = Math.min(100, this.player.mood + 2); }});
    this.dialogue.startWithChoices(npc, greeting, choices);
    if (this.quests.isActive('q03')) {
      const metCount = this.npcs.filter(n => n.questStage >= 1).length;
      if (metCount >= 3) this._onQuestAdvance('q03');
    }
  }

  _handleQuestDialogue(npc) {
    const period = this.time.period;
    const def = NPC_QUEST_DEFS[npc.id]; if (!def) return;
    const qs = npc.questStage || 0;

    if (npc.id === 'nick') {
      if (qs === 0) {
        this.dialogue.startWithChoices(npc, def.q1.intro, [
          { text:'🐾 Помогу!', action: () => { npc.questStage=1; npc.trust=Math.min(3,npc.trust+1); this.quests.unlock(def.q1.id); this.ui.notify(`📋 Новый квест: ${def.q1.title}`); }},
          { text:'💬 Может, потом...', action: () => { this.player.mood=Math.min(100,this.player.mood+3); }},
        ]); return;
      }
      if (qs === 1) {
        if (this.inventory.has(def.q1.item)) { this.dialogue.start(npc, [def.q1.thanks], () => { this.inventory.remove(def.q1.item); npc.questStage=2; npc.trust=Math.min(3,npc.trust+1); this._giveQuestReward(def.q1,npc); this.quests.unlock(def.q2.id); setTimeout(()=>this.ui.notify(`📋 Новый квест от ${npc.name}: ${def.q2.title}`),2000); }); }
        else { this.dialogue.start(npc, [def.q1.hint]); } return;
      }
      if (qs === 2) {
        if (this.inventory.has(def.q2.item)) { this.dialogue.start(npc, [def.q2.thanks], () => { this.inventory.remove(def.q2.item); npc.questStage=3; npc.trust=Math.min(3,npc.trust+1); this._giveQuestReward(def.q2,npc); this.quests.unlock(def.q3.id); setTimeout(()=>this.ui.notify(`📋 Новый квест от ${npc.name}: ${def.q3.title}`),2000); }); }
        else { this.dialogue.start(npc, [def.q2.hint]); } return;
      }
      if (qs === 3) {
        const q3=def.q3; const hasMug=this.inventory.has('nickMug'),hasScarf=this.inventory.has('nickScarf'),hasBackpack=this.inventory.has('nickBackpack'),hasCassette=this.inventory.has('nickCassette');
        const hasAll=hasMug&&hasScarf&&hasBackpack&&hasCassette;
        if (hasAll) { this.dialogue.start(npc,[q3.thanks],()=>{ ['nickMug','nickScarf','nickBackpack','nickCassette'].forEach(i=>this.inventory.remove(i)); npc.questStage=4; npc.trust=3; this._giveQuestReward(q3,npc); this._triggerNickCutscene(); }); }
        else {
          const missing=[];
          if(!hasMug) missing.push('кружку ☕'); if(!hasScarf) missing.push('шарф 🧣'); if(!hasBackpack) missing.push('рюкзак 🎒'); if(!hasCassette) missing.push('кассету 📼');
          this.dialogue.start(npc,[q3.intro,`Не хватает: ${missing.join(', ')}.`]);
        }
        return;
      }
      this.dialogue.start(npc,['Наконец-то у костра… спасибо, Рыжик.']); return;
    }

    if (qs === 0) {
      this.dialogue.startWithChoices(npc, def.q1.intro, [
        { text:'🐾 Помогу!', action: () => { npc.questStage=1; npc.trust=Math.min(3,npc.trust+1); this.quests.unlock(def.q1.id); this.ui.notify(`📋 Новый квест: ${def.q1.title}`); this.achievements.unlock('ach02'); }},
        { text:'💬 Может, потом...', action: () => { this.player.mood=Math.min(100,this.player.mood+3); }},
      ]);
    } else if (qs === 1) {
      const q1=def.q1;
      if (q1.period && q1.period !== period) { this.dialogue.start(npc,[q1.hint]); return; }
      const hasItem=q1.item?this.inventory.has(q1.item):true, enoughItems=!q1.itemCount||this.inventory.count(q1.item)>=q1.itemCount;
      if (hasItem && enoughItems) { this.dialogue.start(npc,[q1.thanks],()=>{ if(q1.item){if(q1.itemCount){for(let i=0;i<q1.itemCount;i++)this.inventory.remove(q1.item);}else this.inventory.remove(q1.item);} npc.questStage=2; npc.trust=Math.min(3,npc.trust+1); this._giveQuestReward(def.q1,npc); this.quests.unlock(def.q2.id); setTimeout(()=>this.ui.notify(`📋 Новый квест от ${npc.name}: ${def.q2.title}`),2000); }); }
      else { this.dialogue.start(npc,[q1.hint]); }
    } else if (qs === 2) {
      const q2=def.q2;
      if (q2.period && q2.period !== period) { this.dialogue.start(npc,[q2.hint]); return; }
      const hasItem=q2.item?this.inventory.has(q2.item):true;
      if (hasItem) { this.dialogue.start(npc,[q2.thanks],()=>{ if(q2.item)this.inventory.remove(q2.item); npc.questStage=3; npc.trust=Math.min(3,npc.trust+1); this._giveQuestReward(def.q2,npc); this.achievements.unlock('ach02'); this._checkAllFriends(); if(def.q3){this.quests.unlock(def.q3.id);setTimeout(()=>this.ui.notify(`📋 Новый квест от ${npc.name}: ${def.q3.title}`),2000);}else if(npc.id==='sonya'){setTimeout(()=>this._unlockMountains(npc),1200);} }); }
      else { this.dialogue.start(npc,[q2.intro,q2.hint]); }
    } else if (qs === 3) {
      if (!def.q3) { this.dialogue.start(npc,['Спасибо за всё! ❤️']); return; }
      const q3=def.q3;
      if (q3.period && q3.period !== period) { this.dialogue.start(npc,[q3.hint]); return; }
      const hasItem3=q3.item?this.inventory.has(q3.item):true;
      if (hasItem3) { this.dialogue.start(npc,[q3.thanks],()=>{ if(q3.item)this.inventory.remove(q3.item); npc.questStage=4; npc.trust=Math.min(3,npc.trust+1); this._giveQuestReward(def.q3,npc); this.achievements.unlock('ach02'); this._checkAllFriends(); if(npc.id==='sonya'){setTimeout(()=>this._unlockMountains(npc),1200);} }); }
      else { this.dialogue.start(npc,[q3.intro,q3.hint]); }
    }
  }

  _handleCasualChat(npc) {
    const period=this.time.period;
    const lines=npc.dialogues?.[period]||npc.dialogues?.day||[];
    const line=lines.length?lines[Math.floor(Math.random()*lines.length)]:'...';
    if (!npc.storyIndex) npc.storyIndex=0;
    const stories=(typeof NPC_STORIES!=='undefined')?(NPC_STORIES[npc.id]||[]):[];
    const idx=npc.storyIndex, story=stories[idx], canTell=story&&npc.trust>=story.minTrust;
    if (canTell) {
      this.dialogue.startWithChoices(npc,line,[
        { text:'📖 Расскажи', action:()=>{ this.dialogue.startStory(npc,story.lines,()=>{ npc.storyIndex++; npc.trust=Math.min(3,npc.trust+1); this.player.mood=Math.min(100,this.player.mood+8); this.ui.notify(`💬 ${npc.name} рассказал кое-что важное`); }); }},
        { text:'😺 Просто мяукнул', action:()=>{ this.player.mood=Math.min(100,this.player.mood+3); }},
      ]);
    } else {
      const extra=(npc.questStage||0)>=3?' ❤️':'';
      this.dialogue.start(npc,[line+extra],()=>{ this.player.mood=Math.min(100,this.player.mood+5); });
    }
  }

  _handleGiveItem(npc) {
    const def=NPC_QUEST_DEFS[npc.id], qs=npc.questStage||0;
    let neededItem=null;
    if (def&&qs===1) neededItem=def.q1.item;
    if (def&&qs===2) neededItem=def.q2.item;
    const items=this.inventory.items.filter(i=>i.qty>0);
    if (!items.length) { this.ui.notify('🎒 Инвентарь пуст!'); return; }
    const choices=items.slice(0,3).map(i=>{ const idata=ITEMS[i.id]; const label=idata?`${idata.icon?.[0]||'?'} ${idata.name}`:i.id; const isNeeded=i.id===neededItem; return { text:isNeeded?`${label} ✨`:label, action:()=>this._doGiveItem(npc,i.id,neededItem) }; });
    choices.push({ text:'🔙 Назад', action:()=>{} });
    this.dialogue.startWithChoices(npc,'Что отдать?',choices);
  }

  _doGiveItem(npc,itemId,neededItem) {
    if (itemId===neededItem) { this._handleQuestDialogue(npc); }
    else { const idata=ITEMS[itemId]; const name=idata?idata.name:itemId; this.dialogue.start(npc,[`Спасибо, но ${name} мне сейчас не нужен...`]); }
  }

  _showSleepMenu() {
    const hour=this.time.hour;
    const opts=[{ text:'☀️ Спать до утра (6:00)',h:6 },{ text:'🌤 Спать до полудня (12:00)',h:12 },{ text:'🌇 Спать до вечера (18:00)',h:18 },{ text:'🌙 Спать до ночи (22:00)',h:22 }];
    const available=opts.filter(o=>o.h!==hour);
    const choices=available.map(o=>({ text:o.text, action:()=>this._sleepUntil(o.h) }));
    choices.push({ text:'❌ Отмена', action:()=>{} });
    const sleepNPC={ name:'🛏️ Кровать', emoji:'😴', color:'#8888ff', trust:0 };
    this.dialogue.startWithChoices(sleepNPC,'Свернуться клубочком и поспать?',choices);
  }

  _sleepUntil(targetHour) {
    const current=this.time.hour;
    let hoursSlept;
    if (targetHour>current) { hoursSlept=targetHour-current; }
    else { hoursSlept=(24-current)+targetHour; this.time.day++; }
    this.time.hour=targetHour; this.time.minuteAccum=0;
    const restFactor=Math.min(1,hoursSlept/8);
    this.player.energy=Math.min(100,this.player.energy+Math.round(50*restFactor));
    this.player.mood=Math.min(100,this.player.mood+Math.round(20*restFactor));
    this.player.food=Math.max(0,this.player.food-Math.round(10*restFactor));
    this.player.playAction('purr');
    this.ui.notify(`😴 Рыжик поспал ${hoursSlept} ч. Сейчас ${this.time.periodRu} ${targetHour}:00`);
    const newPeriod=this.time.period;
    this.npcs.forEach(npc=>{ const sched=npc.schedule?.[newPeriod]; if(sched&&Array.isArray(sched)&&sched.length>=2){npc.x=sched[0];npc.y=sched[1];}else if(sched&&typeof sched==='object'&&sched.x!==undefined){npc.x=sched.x;npc.y=sched.y;} });
    if (newPeriod==='night') this.weather.set(this.weather.random('night'));
  }

  _giveQuestReward(questDef,npc) {
    const q=QUESTS.find(x=>x.id===questDef.id); const reward=q?q.reward:{};
    if (reward.xp) { this.player.glory+=reward.xp; this.ui.notify(`⭐ +${reward.xp} Слава`); }
    if (reward.item) { this.inventory.add(reward.item); this.ui.notify(`🎁 Получено: ${ITEMS[reward.item]?.name||reward.item}`); }
    if (reward.zone) { if(!this.unlockedZones.includes(reward.zone)){this.unlockedZones.push(reward.zone);this.ui.notify(`🗺️ Открыта новая зона!`);} }
    if (reward.trust&&npc) npc.trust=Math.min(3,npc.trust+2);
    if (reward.event==='concert') this.ui.showEvent('🎵','Вечерний концерт начинается!');
    if (reward.event==='finale') this._triggerFinale();
    if (reward.upgrade) { this.upgrades.add(reward.upgrade); this.ui.notify('✨ Улучшение получено!'); }
    if (q) {
      if (this.quests.isActive(q.id)) { let safeLimit=10; while(this.quests.isActive(q.id)&&safeLimit-->0){const r=this.quests.advanceStep(q.id);if(r==='complete')break;} }
      this.ui.notify(`✅ Квест выполнен: ${q.title}!`); this.audio.questDone(); this.telegram.vibrateSuccess();
    }
  }

  _onQuestAdvance(qid) {
    const result=this.quests.advanceStep(qid);
    if (result==='complete') {
      const q=QUESTS.find(x=>x.id===qid);
      this.ui.notify(`✅ Квест выполнен: ${q.title}!`); this.audio.questDone(); this.telegram.vibrateSuccess();
      if (q.reward) {
        if (q.reward.item) { this.inventory.add(q.reward.item); this.ui.notify(`🎁 Получено: ${ITEMS[q.reward.item]?.icon[0]} ${ITEMS[q.reward.item]?.name}`); }
        if (q.reward.xp)   { this.player.glory+=q.reward.xp; this.ui.notify(`⭐ +${q.reward.xp} Слава`); }
        if (q.reward.zone) { if(!this.unlockedZones.includes(q.reward.zone)){this.unlockedZones.push(q.reward.zone);this.ui.notify(`🗺️ Новая зона: ${ZONES.find(z=>z.id===q.reward.zone)?.name||q.reward.zone}`);} }
        if (q.reward.trust){ const npc=this.npcs.find(n=>n.id===q.reward.trust);if(npc)npc.trust=Math.min(3,npc.trust+2); }
        if (q.reward.event==='finale') this._triggerFinale();
        if (q.reward.event==='party')  this.ui.showEvent('🎉','Праздник во дворе! Все собрались вместе!');
        if (q.reward.event==='concert') this.ui.showEvent('🎵','Мяу-концерт начинается!');
      }
      const doneCount=this.quests.completed.size;
      if (doneCount>=2) { this.quests.unlock('q_nastya'); this.quests.unlock('q_liza'); }
      if (doneCount>=3) { this.quests.unlock('q_explore'); this.quests.unlock('q_fish'); }
      if (doneCount>=4) { this.quests.unlock('q_sonya'); this.quests.unlock('q_nena'); }
      if (doneCount>=5) { this.quests.unlock('q_kristina'); this.quests.unlock('q_danya'); }
      if (doneCount>=6) { this.quests.unlock('q_mag'); this.quests.unlock('q_attic'); }
      if (doneCount>=7) { this.quests.unlock('q_cellar'); this.quests.unlock('q_shiny'); }
      if (doneCount>=8) { this.quests.unlock('q_firefly'); this.quests.unlock('q_concert'); }
      if (doneCount>=4) { this.quests.unlock('q_notes'); }
      if (doneCount>=10) { this.quests.unlock('q_greenhouse'); this.achievements.unlock('ach09'); }
      if (doneCount>=12) { this.quests.unlock('q_party'); }
      if (doneCount>=14) { this.quests.unlock('q_secret'); }
      if (doneCount>=16) { this.quests.unlock('q_finale'); }
      if (doneCount>=1) { this.quests.unlock('q_ind2'); this.quests.unlock('q_ind6'); }
      if (doneCount>=3) { this.quests.unlock('q_ind3'); this.quests.unlock('q_ind9'); }
      if (doneCount>=5) { this.quests.unlock('q_ind4'); this.quests.unlock('q_ind5'); }
      if (doneCount>=7) { this.quests.unlock('q_ind7'); this.quests.unlock('q_ind8'); }
      if (doneCount>=9) { this.quests.unlock('q_ind10'); }
    } else if (result==='advance') {
      const q=QUESTS.find(x=>x.id===qid);
      this.ui.notify(`📋 ${q.title}: ${this.quests.currentStep(qid)}`);
    }
  }

  _checkQuestItem(itemId) {
    const checks={ 'bowl':'q01','barnKey':'q02','flashPart':'q_kristina','sticker':'q_liza','moonBell':'q_mag','sunBell':'q_secret','letter':'q_notes' };
    const qid=checks[itemId]; if(qid&&this.quests.isActive(qid)) this._onQuestAdvance(qid);
    if (itemId==='sticker') { const cnt=this.inventory.count('sticker'); if(cnt>=5&&this.quests.isActive('q_liza')) this._onQuestAdvance('q_liza'); }
    if (itemId==='moonBell'&&this.quests.isActive('q_greenhouse')) { if((this.quests.progress['q_greenhouse']||0)===0) this._onQuestAdvance('q_greenhouse'); }
    const shiny=['coin','pebble','bell','leaf','button','acorn','ribbon','moonBell'];
    if (shiny.includes(itemId)) { const total=shiny.reduce((s,i)=>s+this.inventory.count(i),0); if(total>=5&&this.quests.isActive('q_shiny'))this._onQuestAdvance('q_shiny'); if(total>=10)this.achievements.unlock('ach08'); }
    if (itemId==='sunBell') { this.achievements.unlock('ach11'); setTimeout(()=>this._triggerFinale(),2000); }
  }

  _checkProximity() {
    if (this.interior&&this.interior.active) return;
    let hint=null;
    if (this.player.x>240&&this.player.x<360&&this.player.y>220&&this.player.y<270) hint='[E] Войти в дом 🏠';
    if (this._mobileEnterBtn) { const nearDoor=this.player.x>240&&this.player.x<360&&this.player.y>220&&this.player.y<270; this._mobileEnterBtn.style.display=nearDoor?'block':'none'; this._mobileEnterBtn.textContent='🏠'; }
    const item=this.world.collectibles.find(c=>!c.collected&&Math.sqrt((c.x-this.player.x)**2+(c.y-this.player.y)**2)<50);
    if (item&&!hint) { const idata=ITEMS[item.item]; hint=`Поднять ${idata.icon[0]} ${idata.name}`; }
    const npc=this.npcs.find(n=>n.visible&&n.distTo(this.player.x,this.player.y)<70);
    if (npc&&!hint) hint=`Поговорить с ${npc.name}`;
    if (!hint&&this.player.x>600&&this.player.x<688&&this.player.y>445&&this.player.y<615) hint='🎣 Порыбачить [E]';
    if (!hint&&this.player.x>30&&this.player.x<260&&this.player.y>330&&this.player.y<490) { if(!this.unlockedZones.includes('barn')){hint=this.inventory.has('barnKey')?'[E] 🏚️ Открыть сарай ключом':'🔒 Сарай закрыт — ищи ключ в кухонном шкафчике';}else{hint='[E] Войти в сарай 🏚️';} }
    if (!hint&&this.player.x>1055&&this.player.x<1112&&this.player.y>188&&this.player.y<415) { if(!this.unlockedZones.includes('greenhouse')){hint=this.inventory.has('moonBell')?'🌿 Открыть теплицу [E]':'🔒 Теплица закрыта — нужен колокольчик луны';}else{hint='🌿 Теплица (открыта)';} }
    if (!hint&&this.militaryOffice&&!this.militaryOffice.active) { const atMilDoor=this.player.x>55&&this.player.x<110&&this.player.y>1130&&this.player.y<1195; if(atMilDoor)hint='[E] 📋 Войти в военкомат'; }
    if (!hint&&this.mountains&&!this.mountains.active) { const atMtnEntry=this.player.x>1265&&this.player.x<1385&&this.player.y>45&&this.player.y<175; if(atMtnEntry){hint=this.mountains.unlockedFlag?'[E] ⛰️ Войти на горную тропу':'⛰️ Тропа завалена ветками. Возможно, Соня знает путь.';} }
    this.ui.setInteractHint(hint);
  }

  _triggerRandomEvent() {
    if (Math.random()>0.4) return;
    const evt=RANDOM_EVENTS[Math.floor(Math.random()*RANDOM_EVENTS.length)];
    this.ui.showEvent(evt.icon,evt.text);
    if (evt.effect.weather) this.weather.set(evt.effect.weather);
    if (evt.effect.mood)    this.player.mood=Math.min(100,this.player.mood+evt.effect.mood);
    if (evt.effect.food)    this.player.food=Math.min(100,this.player.food+evt.effect.food);
    if (evt.effect.item)    this.inventory.add(evt.effect.item);
  }

  _checkAchievements() {
    if (this.time.period==='night') this.achievements.unlock('ach10');
    if (this.unlockedZones.length>=5)  this.achievements.unlock('ach04');
    if (this.unlockedZones.length>=14) this.achievements.unlock('ach18');
    if (this.quests.completed.size>=20) this.achievements.unlock('ach19');
    if (this.player.glory>=200) this.achievements.unlock('ach20');
    const lyokha=this.npcs.find(n=>n.id==='lyokha'); if(lyokha&&lyokha.trust>=3)this.achievements.unlock('ach05');
    const igor=this.npcs.find(n=>n.id==='igor'); if(igor&&igor.trust>=3)this.achievements.unlock('ach06');
    if (this.unlockedZones.includes('secret_path')) this.achievements.unlock('ach07');
    if (this.unlockedZones.includes('greenhouse')) this.achievements.unlock('ach14');
    if (this.unlockedZones.includes('garden')&&this.unlockedZones.includes('pond')) this.achievements.unlock('ach13');
  }

  _checkAllFriends() {
    const allFriends=this.npcs.every(n=>n.trust>=2);
    if (allFriends) this.achievements.unlock('ach17');
  }

  getNPCQuest(npcId) {
    const npc=this.npcs.find(n=>n.id===npcId), def=NPC_QUEST_DEFS[npcId];
    if (!npc||!def) return null;
    const qs=npc.questStage||0;
    return { npcId,questStage:qs,activeQuest:qs===1?def.q1:qs===2?def.q2:null,isFriend:qs>=3,q1:def.q1,q2:def.q2 };
  }

  startNPCQuest(npcId) {
    const npc=this.npcs.find(n=>n.id===npcId), def=NPC_QUEST_DEFS[npcId];
    if (!npc||!def||npc.questStage!==0) return false;
    npc.questStage=1; npc.trust=Math.min(3,npc.trust+1); this.quests.unlock(def.q1.id); this.ui.notify(`📋 Новый квест: ${def.q1.title}`); return true;
  }

  canCompleteNPCQuest(npcId) {
    const npc=this.npcs.find(n=>n.id===npcId), def=NPC_QUEST_DEFS[npcId];
    if (!npc||!def) return false;
    const qs=npc.questStage||0;
    if (qs===1){const q=def.q1;const hasItem=q.item?this.inventory.has(q.item):true;const enough=!q.itemCount||this.inventory.count(q.item)>=q.itemCount;const rightPeriod=!q.period||q.period===this.time.period;return hasItem&&enough&&rightPeriod;}
    if (qs===2){const q=def.q2;const hasItem=q.item?this.inventory.has(q.item):true;const rightPeriod=!q.period||q.period===this.time.period;return hasItem&&rightPeriod;}
    return false;
  }

  completeNPCQuest(npcId) {
    const npc=this.npcs.find(n=>n.id===npcId), def=NPC_QUEST_DEFS[npcId];
    if (!npc||!def||!this.canCompleteNPCQuest(npcId)) return false;
    const qs=npc.questStage||0;
    if (qs===1){const q=def.q1;if(q.item){if(q.itemCount){for(let i=0;i<q.itemCount;i++)this.inventory.remove(q.item);}else this.inventory.remove(q.item);}npc.questStage=2;npc.trust=Math.min(3,npc.trust+1);this._giveQuestReward(q,npc);this.quests.unlock(def.q2.id);setTimeout(()=>this.ui.notify(`📋 Новый квест от ${npc.name}: ${def.q2.title}`),2000);return true;}
    if (qs===2){const q=def.q2;if(q.item)this.inventory.remove(q.item);npc.questStage=3;npc.trust=3;this._giveQuestReward(q,npc);this._checkAllFriends();return true;}
    return false;
  }

  getNPCDialogue(npcId) {
    const npc=this.npcs.find(n=>n.id===npcId), def=NPC_QUEST_DEFS[npcId], period=this.time.period;
    if (!npc||!def){const lines=npc?.dialogues?.[period]||npc?.dialogues?.day||['...'];return lines[Math.floor(Math.random()*lines.length)];}
    const qs=npc.questStage||0;
    if (qs===0) return def.q1.intro;
    if (qs===1) return this.canCompleteNPCQuest(npcId)?def.q1.thanks:def.q1.hint;
    if (qs===2) return this.canCompleteNPCQuest(npcId)?def.q2.thanks:def.q2.hint;
    const lines=npc.dialogues?.[period]||npc.dialogues?.day||[];
    return lines.length?lines[Math.floor(Math.random()*lines.length)]:`${npc.name} рад тебя видеть! ❤️`;
  }

  _triggerFinale() {
    this.ui.showEvent('🔔','Звенит Солнечный колокольчик! Двор наполняется светлячками...');
    this.weather.set('starry'); this.player.mood=100; this.player.food=100; this.player.energy=100;
    this.achievements.unlock('ach11'); this.achievements.unlock('ach20');
    setTimeout(()=>{ this.ui.notify('🏡 Все собрались у дома! Двор снова уютный!'); setTimeout(()=>{ this.ui.notify('🐱 Рыжик обрёл настоящий дом. Конец первой главы!'); this.npcs.forEach(n=>{n.trust=3;n.showEmotion('happy');}); this.audio.questDone(); },4000); },4000);
  }

  _drawMountainEntrance(ctx, cam) {
    const EX=1325, EY=110, unlocked=this.mountains&&this.mountains.unlockedFlag, t=(typeof GFX!=='undefined'&&GFX.t)?GFX.t:0;
    ctx.save(); ctx.translate(-cam.x,-cam.y);
    const peaks=[{bx:EX-62,bw:88,bh:105},{bx:EX-18,bw:110,bh:132},{bx:EX+52,bw:84,bh:98}];
    ctx.fillStyle='rgba(140,155,175,0.55)';
    peaks.forEach(p=>{ ctx.beginPath(); ctx.moveTo(p.bx,EY+35); ctx.lineTo(p.bx+p.bw*0.5,EY+35-p.bh); ctx.lineTo(p.bx+p.bw,EY+35); ctx.closePath(); ctx.fill(); });
    ctx.fillStyle='rgba(240,244,255,0.75)';
    peaks.forEach(p=>{ const tx=p.bx+p.bw*0.5,ty=EY+35-p.bh; ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(tx-13,ty+28); ctx.lineTo(tx+13,ty+28); ctx.closePath(); ctx.fill(); });
    [[EX-70,EY+12,58],[EX+58,EY+8,64],[EX-50,EY+22,44],[EX+42,EY+25,40]].forEach(([px,py,ph])=>{ ctx.fillStyle='#1c4a22'; ctx.beginPath(); ctx.moveTo(px,py-ph); ctx.lineTo(px-ph*0.36,py); ctx.lineTo(px+ph*0.36,py); ctx.closePath(); ctx.fill(); ctx.fillStyle='#0e2c12'; ctx.beginPath(); ctx.moveTo(px,py-ph); ctx.lineTo(px-ph*0.22,py-ph*0.42); ctx.lineTo(px+ph*0.22,py-ph*0.42); ctx.closePath(); ctx.fill(); ctx.fillStyle='#3a2010'; ctx.fillRect(px-3,py,6,8); });
    const pg=ctx.createLinearGradient(EX,EY+35,EX,EY+85);
    pg.addColorStop(0,'#8a7862'); pg.addColorStop(1,'#bba880'); ctx.fillStyle=pg;
    ctx.beginPath(); ctx.moveTo(EX-24,EY+35); ctx.lineTo(EX+24,EY+35); ctx.lineTo(EX+32,EY+85); ctx.lineTo(EX-32,EY+85); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#998870'; [[EX-8,EY+55,4,3],[EX+10,EY+65,5,3],[EX-4,EY+78,3,2]].forEach(([rx,ry,rw,rh])=>{ ctx.beginPath(); ctx.ellipse(rx,ry,rw,rh,0,0,Math.PI*2); ctx.fill(); });
    [[EX-42,EY+48,18,11],[EX+36,EY+52,15,9],[EX-26,EY+72,11,7],[EX+28,EY+70,9,6]].forEach(([rx,ry,rw,rh])=>{ const rg=ctx.createRadialGradient(rx-2,ry-2,1,rx,ry,rw); rg.addColorStop(0,'#909090'); rg.addColorStop(1,'#555'); ctx.fillStyle=rg; ctx.beginPath(); ctx.ellipse(rx,ry,rw,rh,0,0,Math.PI*2); ctx.fill(); });
    if (!unlocked) {
      ctx.save();
      for (let i=0;i<6;i++){ const by=EY+36+i*8,ang=(i%2===0?1:-1)*0.28; ctx.save(); ctx.translate(EX,by); ctx.rotate(ang); ctx.strokeStyle='#5a3a10'; ctx.lineWidth=3.5; ctx.beginPath(); ctx.moveTo(-28,0); ctx.lineTo(28,0); ctx.stroke(); ctx.strokeStyle='#3d2508'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(-12,0); ctx.lineTo(-18,-7); ctx.moveTo(12,0); ctx.lineTo(18,6); ctx.stroke(); ctx.restore(); }
      ctx.restore();
      ctx.fillStyle='rgba(60,15,5,0.82)'; ctx.beginPath(); GFX.roundRect(ctx,EX-28,EY+10,56,18,5); ctx.fill();
      ctx.fillStyle='#ffaa55'; ctx.font='bold 8px system-ui'; ctx.textAlign='center'; ctx.fillText('🚫 закрыто',EX,EY+22);
    } else {
      const og=ctx.createRadialGradient(EX,EY+55,0,EX,EY+55,32); og.addColorStop(0,'rgba(255,210,100,0.18)'); og.addColorStop(1,'rgba(255,210,100,0)'); ctx.fillStyle=og; ctx.fillRect(EX-34,EY+35,68,54);
    }
    for (let i=0;i<4;i++){ const fx=EX-35+i*24+Math.sin(t*0.35+i*1.2)*7,fy=EY+28+Math.cos(t*0.28+i*0.9)*4,fa=0.07+Math.sin(t*0.45+i)*0.03; const fg=ctx.createRadialGradient(fx,fy,0,fx,fy,20); fg.addColorStop(0,`rgba(210,220,255,${fa})`); fg.addColorStop(1,'rgba(210,220,255,0)'); ctx.fillStyle=fg; ctx.fillRect(fx-22,fy-16,44,32); }
    const sx=EX+55,sy=EY+52; ctx.fillStyle='#5a3a10'; ctx.fillRect(sx-2,sy-30,3,32); ctx.fillStyle='#c89030'; ctx.beginPath(); GFX.roundRect(ctx,sx,sy-38,56,16,3); ctx.fill(); ctx.fillStyle='#1a0a00'; ctx.font='bold 7px system-ui'; ctx.textAlign='left'; ctx.fillText('⛰️ К холмам →',sx+4,sy-28);
    ctx.fillStyle=unlocked?'rgba(20,10,0,0.82)':'rgba(40,40,60,0.75)'; ctx.globalAlpha=unlocked?0.95:0.65; ctx.beginPath(); GFX.roundRect(ctx,EX-48,EY-50,96,18,5); ctx.fill(); ctx.fillStyle=unlocked?'#ffcc88':'#aaaacc'; ctx.font='bold 8px system-ui'; ctx.textAlign='center'; ctx.fillText(unlocked?'⛰️ Горная тропа':'⛰️ Горная тропа 🔒',EX,EY-38); ctx.globalAlpha=1;
    if (unlocked){ const leafEmojis=['🍃','🌿']; for(let i=0;i<3;i++){const lx=EX-50+((t*18+i*40)%120),ly=EY-20+Math.sin(t*0.9+i*1.4)*18; ctx.save(); ctx.globalAlpha=0.55; ctx.font='9px serif'; ctx.textAlign='center'; ctx.fillText(leafEmojis[i%2],lx,ly); ctx.globalAlpha=1; ctx.restore();} }
    ctx.restore();
  }

  _unlockMountains(sonya) {
    if (!this.mountains||this.mountains.unlockedFlag) return;
    const lines=[{speaker:'npc',text:'Знаешь… наверное, теперь я могу показать тебе одно место.',emotion:'happy'},{speaker:'ryzhik',text:'Мяу?..', emotion:'curious'},{speaker:'npc',text:'За лесом начинается старая тропа к холмам.',emotion:'neutral'},{speaker:'npc',text:'Я редко туда кого-то вожу.',emotion:'nostalgic'},{speaker:'npc',text:'Но тебе, кажется, можно доверять.',emotion:'happy'}];
    this.dialogue.startStory(sonya,lines,()=>{ this.mountains.unlockedFlag=true; this.quests.unlock('q_sonya_mtn1'); if(!this.unlockedZones.includes('mountains'))this.unlockedZones.push('mountains'); setTimeout(()=>{ this.ui.notify('⛰️ Открыта новая глава: «Тропа в горы»'); setTimeout(()=>this.ui.notify('⛰️ Открыт проход в горы'),2500); },500); });
  }

  _handleMountainSonyaDialogue(sonya) {
    if (!sonya) return; sonya.showEmotion('happy'); this.audio.uiClick();
    if (this.quests.isActive('q_sonya_mtn1')) { this.dialogue.start(sonya,['Рыжик! Ты добрался! Смотри как тут красиво. Вон там — лучший обзор с площадки.'],()=>{ sonya.trust=Math.min(3,sonya.trust+1); this._giveQuestReward({id:'q_sonya_mtn1'},sonya); this.quests.unlock('q_sonya_mtn2'); setTimeout(()=>this.ui.notify('📋 Новый квест: Горный цветок'),1500); }); return; }
    if (this.quests.isActive('q_sonya_mtn2')) { if(this.inventory.has('mountainFlower')){this.dialogue.start(sonya,['Горный цветок! Именно такой растёт здесь. Прохладный ветер им нравится.'],()=>{ this.inventory.remove('mountainFlower'); sonya.trust=Math.min(3,sonya.trust+1); this._giveQuestReward({id:'q_sonya_mtn2'},sonya); this.quests.unlock('q_sonya_mtn3'); setTimeout(()=>this.ui.notify('📋 Новый квест: Вид сверху'),1500); });}else{this.dialogue.start(sonya,['Горный цветок? Он растёт ближе к большим камням. Поищи там!']);} return; }
    if (this.quests.isActive('q_sonya_mtn3')) { if(this.inventory.has('smoothStone')){this.dialogue.start(sonya,['Нашёл гладкий камень! Теперь пойдём к верхней площадке. Там лучший вид на дом.']);}else{this.dialogue.start(sonya,['Поднимись выше! Там лучший вид. И найди гладкий камень — он лежит у площадки.']);} return; }
    const mountainLines=[{speaker:'npc',text:'Раньше я часто приходила сюда одна.',emotion:'nostalgic'},{speaker:'npc',text:'Когда становилось слишком шумно.',emotion:'neutral'},{speaker:'npc',text:'Здесь всегда только ветер, облака и тишина.',emotion:'neutral'},{speaker:'ryzhik',text:'Мрр...',emotion:'happy'},{speaker:'npc',text:'Наверное, поэтому мне нравится это место.',emotion:'happy'}];
    this.dialogue.startStory(sonya,mountainLines);
  }

  _triggerMountainVista(sonya) {
    if (!sonya) return;
    const lines=[{speaker:'npc',text:'Когда смотришь отсюда вниз, дом кажется совсем маленьким.',emotion:'nostalgic'},{speaker:'ryzhik',text:'Мрр...',emotion:'happy'},{speaker:'npc',text:'Но почему-то именно отсюда он больше всего похож на дом.',emotion:'happy'},{speaker:'npc',text:'В горах всегда так.',emotion:'neutral'},{speaker:'npc',text:'Поднимаешься выше — и начинаешь лучше понимать, куда хочешь вернуться.',emotion:'nostalgic'}];
    this.dialogue.startStory(sonya,lines,()=>{ this.inventory.remove('smoothStone'); sonya.trust=3; this._giveQuestReward({id:'q_sonya_mtn3'},sonya); this.achievements.unlock('ach_mtn'); this.player.mood=Math.min(100,this.player.mood+15); setTimeout(()=>this.ui.notify('⛰️ Достижение: Друг гор!'),1000); });
  }

  _triggerNickCutscene() {
    if (!this.flags) this.flags={};
    if (this.militaryOffice&&this.militaryOffice.active) this.militaryOffice.startExit();
    this.flags.nickStoryComplete=true;
    const nick=this.npcs.find(n=>n.id==='nick');
    if (nick) { nick.wx=340; nick.wy=700; nick.schedule={morning:[340,700],day:[360,680],evening:[340,700],night:[330,710]}; }
    const overlay=document.createElement('div');
    overlay.style.cssText='position:fixed;inset:0;background:#000;opacity:0;z-index:999;transition:opacity 1s;pointer-events:none;';
    document.body.appendChild(overlay);
    setTimeout(()=>{ overlay.style.opacity='1'; },50);
    setTimeout(()=>{
      this.camera.x=100; this.camera.y=50; this.time.hour=20; this.weather.set('starry');
      setTimeout(()=>{ overlay.style.opacity='0'; setTimeout(()=>{
        overlay.remove();
        const lyokha=this.npcs.find(n=>n.id==='lyokha'),igor=this.npcs.find(n=>n.id==='igor'),liza=this.npcs.find(n=>n.id==='liza'),prokhor=this.npcs.find(n=>n.id==='prokhor'),nickNPC=this.npcs.find(n=>n.id==='nick');
        const lines=[{speaker:'lyokha',text:'Ну наконец-то ты добрался.'},{speaker:'nick',text:'Я думал, этот военкомат меня никогда не отпустит…'},{speaker:'igor',text:'Садись ближе к костру. Сегодня без бумажек.'},{speaker:'liza',text:'Я даже гирлянду специально включила!'},{speaker:'prokhor',text:'Вот теперь двор снова полный.'},{speaker:'ryzhik',text:'Мяу!'}];
        const npcsMap={lyokha,igor,liza,prokhor,nick:nickNPC};
        let li=0;
        const showLine=()=>{ if(li>=lines.length){this.ui.notify('🔥 Ник наконец добрался до костра!');this.player.mood=100;return;} const line=lines[li++]; const speakerNPC=line.speaker==='ryzhik'?{name:'Рыжик',emoji:'🐱',color:'#f07030',id:'ryzhik'}:(npcsMap[line.speaker]||nickNPC); const dlgLine={speaker:line.speaker==='ryzhik'?'ryzhik':'npc',text:line.text,emotion:'happy'}; this.dialogue.startStory(speakerNPC,[dlgLine],showLine); };
        showLine();
        this.ui.showEvent('🔥','Ник наконец добрался до дома!');
      },800);},1500);
    },1200);
  }

  _drawMenu() { }

  _draw() {
    const ctx=this.ctx;
    GFX.t=performance.now()/1000;
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    if (this.interior&&this.interior.active) { drawHouseScene(ctx,{floor:this.interior.floor,px:this.interior.px,py:this.interior.py,t:GFX.t,period:this.time.period,interior:this.interior,npcs:this.npcs,cw:this.canvas.width,ch:this.canvas.height}); return; }
    if (this.barn&&this.barn.active) { if(typeof drawBarnScene==='function'){drawBarnScene(ctx,{px:this.barn.px,py:this.barn.py,t:GFX.t,period:this.time.period,barn:this.barn,cw:this.canvas.width,ch:this.canvas.height});} return; }
    if (this.militaryOffice&&this.militaryOffice.active) { if(typeof drawMilitaryOfficeScene==='function'){const nickNPC=this.npcs.find(n=>n.id==='nick');drawMilitaryOfficeScene(ctx,{px:this.militaryOffice.px,py:this.militaryOffice.py,t:GFX.t,period:this.time.period,mil:this.militaryOffice,nickNPC,cw:this.canvas.width,ch:this.canvas.height});} return; }
    if (this.mountains&&this.mountains.active) { if(typeof drawMountainScene==='function'){const sonyaNPC=this.npcs.find(n=>n.id==='sonya');drawMountainScene(ctx,{px:this.mountains.px,py:this.mountains.py,t:GFX.t,period:this.time.period,mtn:this.mountains,sonyaNPC,cw:this.canvas.width,ch:this.canvas.height});} return; }
    this.world.draw(ctx,this.camera,this.time,this.weather,this.ambient);
    if (this.mountains) this._drawMountainEntrance(ctx,this.camera);
    const camOffset={x:-this.camera.x,y:-this.camera.y};
    this.npcs.forEach(npc=>npc.draw(ctx,camOffset,this.time.period));
    ctx.save(); ctx.translate(-this.camera.x,-this.camera.y); this.player.draw(ctx); ctx.restore();
    const fadeA=Math.max(this.interior?this.interior.fadeAlpha:0,this.barn?this.barn.fadeAlpha:0,this.militaryOffice?this.militaryOffice.fadeAlpha:0,this.mountains?this.mountains.fadeAlpha:0);
    if (fadeA>0){ctx.fillStyle=`rgba(0,0,0,${fadeA})`;ctx.fillRect(0,0,this.canvas.width,this.canvas.height);}
  }
}

NPC.prototype.draw = function(ctx, cam, period) {
  if (!this.visible) return;
  const sx=this.wx+cam.x, sy=this.wy+cam.y;
  const cw=ctx.canvas.width, ch=ctx.canvas.height;
  if (sx<-80||sx>cw+80||sy<-80||sy>ch+80) return;
  if (this.human) {
    drawHumanNPC(ctx,{id:this.id,x:sx,y:sy,t:GFX.t,facing:this.facing,moving:!!this.moveTarget,trust:this.trust,emotion:this.emotion});
    ctx.save();
    const bw=this.name.length*6+12;
    ctx.fillStyle='rgba(20,10,0,0.75)'; GFX.roundRect(ctx,sx-bw/2,sy-52,bw,16,4); ctx.fill();
    ctx.fillStyle=this.color||'#fff'; ctx.font='bold 10px system-ui'; ctx.textAlign='center';
    ctx.fillText(this.name,sx,sy-40);
    if (typeof NPC_QUEST_DEFS!=='undefined'&&NPC_QUEST_DEFS[this.id]){const qs=this.questStage||0;const qIcons=['❗','🔍','🔍','❤️'];ctx.font='14px serif';ctx.textAlign='center';ctx.fillText(qIcons[Math.min(qs,3)],sx,sy-58);}
    ctx.restore();
  } else {
    ctx.save(); ctx.translate(sx,sy+this.bobY);
    GFX.shadow(ctx,0,18,14,5,0.18);
    ctx.font='30px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.shadowColor='rgba(0,0,0,0.4)'; ctx.shadowBlur=6; ctx.fillText(this.emoji,0,-8); ctx.shadowBlur=0;
    if (this.emotion){const emoMap={happy:'😊',sad:'😢',angry:'😠',surprise:'😲',sleep:'😴',laugh:'😄',awkward:'😅'};ctx.font='16px serif';ctx.fillText(emoMap[this.emotion]||'💭',12,-30);}
    const bw=this.name.length*6+12;
    ctx.fillStyle='rgba(20,10,0,0.75)'; GFX.roundRect(ctx,-bw/2,-52,bw,16,4); ctx.fill();
    ctx.fillStyle=this.color||'#fff'; ctx.font='bold 10px system-ui'; ctx.textAlign='center'; ctx.fillText(this.name,0,-40);
    if (this.trust>0){const tColors=['','#aaa','#44cc88','#ffd844'];ctx.font='9px serif';ctx.fillStyle=tColors[this.trust]||'#fff';for(let i=0;i<this.trust;i++)ctx.fillText('♥',-6+i*6,-54);}
    if (typeof NPC_QUEST_DEFS!=='undefined'&&NPC_QUEST_DEFS[this.id]){const qs=this.questStage||0;const qIcons=['❗','🔍','🔍','❤️'];ctx.font='14px serif';ctx.textAlign='center';ctx.fillText(qIcons[Math.min(qs,3)],0,-68);}
    ctx.restore();
  }
};

function detectIOSSafeArea() {
  const ua=navigator.userAgent;
  const isIOS=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  if (!isIOS) return;
  document.body.classList.add('ios-safe');
  const h=window.screen.height, w=window.screen.width, portraitH=Math.max(h,w);
  if (portraitH<=844) document.body.classList.add('compact-ios');
}

window.addEventListener('load', () => {
  detectIOSSafeArea();
  window.game = new Game();
});
