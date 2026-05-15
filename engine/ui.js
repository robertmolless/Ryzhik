'use strict';

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
