'use strict';

Game.prototype._showSleepMenu = function() {
  const hour=this.time.hour;
  const opts=[{ text:'☀️ Спать до утра (6:00)',h:6 },{ text:'🌤 Спать до полудня (12:00)',h:12 },{ text:'🌇 Спать до вечера (18:00)',h:18 },{ text:'🌙 Спать до ночи (22:00)',h:22 }];
  const available=opts.filter(o=>o.h!==hour);
  const choices=available.map(o=>({ text:o.text, action:()=>this._sleepUntil(o.h) }));
  choices.push({ text:'❌ Отмена', action:()=>{} });
  const sleepNPC={ name:'🛏️ Кровать', emoji:'😴', color:'#8888ff', trust:0 };
  this.dialogue.startWithChoices(sleepNPC,'Свернуться клубочком и поспать?',choices);
};

Game.prototype._sleepUntil = function(targetHour) {
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
};

Game.prototype._giveQuestReward = function(questDef, npc) {
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
};

Game.prototype._onQuestAdvance = function(qid) {
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
};

Game.prototype._checkQuestItem = function(itemId) {
  const checks={ 'bowl':'q01','barnKey':'q02','flashPart':'q_kristina','sticker':'q_liza','moonBell':'q_mag','sunBell':'q_secret','letter':'q_notes' };
  const qid=checks[itemId]; if(qid&&this.quests.isActive(qid)) this._onQuestAdvance(qid);
  if (itemId==='sticker') { const cnt=this.inventory.count('sticker'); if(cnt>=5&&this.quests.isActive('q_liza')) this._onQuestAdvance('q_liza'); }
  if (itemId==='moonBell'&&this.quests.isActive('q_greenhouse')) { if((this.quests.progress['q_greenhouse']||0)===0) this._onQuestAdvance('q_greenhouse'); }
  const shiny=['coin','pebble','bell','leaf','button','acorn','ribbon','moonBell'];
  if (shiny.includes(itemId)) { const total=shiny.reduce((s,i)=>s+this.inventory.count(i),0); if(total>=5&&this.quests.isActive('q_shiny'))this._onQuestAdvance('q_shiny'); if(total>=10)this.achievements.unlock('ach08'); }
  if (itemId==='sunBell') { this.achievements.unlock('ach11'); setTimeout(()=>this._triggerFinale(),2000); }
};
