'use strict';

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
