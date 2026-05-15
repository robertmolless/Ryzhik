'use strict';

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
