'use strict';

Game.prototype._talkToNPC = function(npc) {
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
  if (npc.id === 'sonya' && typeof this._sonyaMtnBranchAvailable === 'function' && this._sonyaMtnBranchAvailable() && (this.flags.sonyaMtnStage || 0) > 0) {
    choices.unshift({ text: '🏔️ Горные дела', action: () => this._handleSonyaMountainBranch(npc) });
  }
  if (this.inventory.items.length > 0) choices.push({ text: '🎁 Отдать предмет', action: () => this._handleGiveItem(npc) });
  choices.push({ text: '👋 Пока', action: () => { this.player.mood = Math.min(100, this.player.mood + 2); }});
  this.dialogue.startWithChoices(npc, greeting, choices);
  if (this.quests.isActive('q03')) {
    const metCount = this.npcs.filter(n => n.questStage >= 1).length;
    if (metCount >= 3) this._onQuestAdvance('q03');
  }
};

Game.prototype._handleQuestDialogue = function(npc) {
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
};

Game.prototype._handleCasualChat = function(npc) {
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
};

Game.prototype._handleGiveItem = function(npc) {
  const def=NPC_QUEST_DEFS[npc.id], qs=npc.questStage||0;
  let neededItem=null;
  if (def&&qs===1) neededItem=def.q1.item;
  if (def&&qs===2) neededItem=def.q2.item;
  const items=this.inventory.items.filter(i=>i.qty>0);
  if (!items.length) { this.ui.notify('🎒 Инвентарь пуст!'); return; }
  const choices=items.slice(0,3).map(i=>{ const idata=ITEMS[i.id]; const label=idata?`${idata.icon?.[0]||'?'} ${idata.name}`:i.id; const isNeeded=i.id===neededItem; return { text:isNeeded?`${label} ✨`:label, action:()=>this._doGiveItem(npc,i.id,neededItem) }; });
  choices.push({ text:'🔙 Назад', action:()=>{} });
  this.dialogue.startWithChoices(npc,'Что отдать?',choices);
};

Game.prototype._doGiveItem = function(npc, itemId, neededItem) {
  if (itemId===neededItem) { this._handleQuestDialogue(npc); }
  else { const idata=ITEMS[itemId]; const name=idata?idata.name:itemId; this.dialogue.start(npc,[`Спасибо, но ${name} мне сейчас не нужен...`]); }
};
