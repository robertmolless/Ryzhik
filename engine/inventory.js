'use strict';

class Inventory {
  constructor() {
    this.slots = 20;
    this.items = [];
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
    this.items.forEach(slot => {
      const div = document.createElement('div');
      div.className = 'inv-slot';
      div.innerHTML = `<span class="inv-icon">${slot.item.icon[0]||'?'}</span><span class="inv-name">${slot.item.name}</span>`;
      if (slot.qty > 1) div.innerHTML += `<span style="font-size:9px;color:#f4873a">×${slot.qty}</span>`;
      div.onclick = () => {
        info.innerHTML = `<b>${slot.item.icon[0]} ${slot.item.name}</b><br>${slot.item.desc}${slot.item.rare?'<span style="color:#ffd844"> ★ Редкий</span>':''}`;
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
        const questItemNpc = {
          'cassette':'lyokha', 'pick':'igor', 'diary':'nena',
          'flashPart':'kristina', 'sticker':'liza',
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
              const questMap = { 'cassette':'q_lyokha','pick':'q_igor','diary':'q_nena','flashPart':'q_kristina','sticker':'q_liza' };
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
    const empty = this.slots - this.items.length;
    for (let i = 0; i < Math.min(empty, 6); i++) {
      const div = document.createElement('div'); div.className = 'inv-slot empty'; div.innerHTML = '<span class="inv-icon">·</span>';
      grid.appendChild(div);
    }
  }
}
