'use strict';

Game.prototype._sonyaMtnBranchAvailable = function() {
  if (!this.mountains || !this.mountains.unlockedFlag) return false;
  const sonya = this.npcs.find(n => n.id === 'sonya');
  if (!sonya || sonya.questStage < 4) return false;
  // Branch opens after old mountain arc vista (ach_mtn) or once new arc is already in progress
  return this.achievements.unlocked.has('ach_mtn') || (this.flags.sonyaMtnStage || 0) > 0;
};

Game.prototype._handleSonyaMountainBranch = function(sonya) {
  if (!sonya) return;
  sonya.showEmotion('happy');
  this.audio.uiClick();
  const stage  = this.flags.sonyaMtnStage || 0;
  const period = this.time.period;
  const lines  = typeof SONYA_MTN_QUEST_LINES !== 'undefined' ? SONYA_MTN_QUEST_LINES : {};

  if (stage === 0) {
    this.dialogue.startWithChoices(sonya, lines.q1?.intro || 'Рыжик, поможешь собрать ленточки с горных троп?', [
      { text: '🎀 Конечно!', action: () => {
        this.flags.sonyaMtnStage = 1;
        this.quests.unlock('sonyaMtnQ1');
        this.ui.notify('📋 Новый квест: Горные ленточки');
        this.achievements.unlock('ach02');
      }},
      { text: '💬 Может, потом...', action: () => { this.player.mood = Math.min(100, this.player.mood + 2); } },
    ]);
    return;
  }

  if (stage === 1) {
    const count = this.inventory.count('trailRibbon');
    if (count >= 3) {
      this.dialogue.start(sonya, [lines.q1?.thanks || 'Все три! Спасибо, Рыжик.'], () => {
        for (let i = 0; i < 3; i++) this.inventory.remove('trailRibbon');
        this.flags.sonyaMtnStage = 2;
        sonya.trust = Math.min(3, sonya.trust + 1);
        this._giveQuestReward({ id: 'sonyaMtnQ1' }, sonya);
        this.quests.unlock('sonyaMtnQ2');
        setTimeout(() => this.ui.notify('📋 Новый квест: Гладкий камень'), 2000);
      });
    } else {
      this.dialogue.start(sonya, [`${lines.q1?.hint || 'Ищи ленточки на тропах.'} (${count}/3)`]);
    }
    return;
  }

  if (stage === 2) {
    if (this.inventory.has('smoothStone')) {
      this.dialogue.start(sonya, [lines.q2?.thanks || 'Нашёл камень! Спасибо.'], () => {
        this.inventory.remove('smoothStone');
        this.flags.sonyaMtnStage = 3;
        sonya.trust = Math.min(3, sonya.trust + 1);
        this._giveQuestReward({ id: 'sonyaMtnQ2' }, sonya);
        this.quests.unlock('sonyaMtnQ3');
        setTimeout(() => this.ui.notify('📋 Новый квест: Ветреный цветок'), 2000);
      });
    } else {
      this.dialogue.start(sonya, [lines.q2?.hint || 'Гладкий камень лежит у обзорной площадки.']);
    }
    return;
  }

  if (stage === 3) {
    if (this.inventory.has('mountainWindFlower')) {
      this.dialogue.start(sonya, [lines.q3?.thanks || 'Нашёл цветок! Потрясающе.'], () => {
        this.flags.sonyaMtnStage = 4;
        this._giveQuestReward({ id: 'sonyaMtnQ3' }, sonya);
        this.quests.unlock('sonyaMtnQ4');
        setTimeout(() => this.ui.notify('📋 Новый квест: Старый колокольчик'), 2000);
      });
    } else {
      const timeOk = period === 'morning' || period === 'evening';
      const msg = timeOk
        ? (lines.q3?.hint || 'Ищи ветреный цветок на цветочной поляне!')
        : 'Ветреный цветок цветёт только утром и вечером. Приходи тогда!';
      this.dialogue.start(sonya, [msg]);
    }
    return;
  }

  if (stage === 4) {
    if (this.inventory.has('oldBell')) {
      this.dialogue.start(sonya, [lines.q4?.thanks || 'Слышишь? Горы довольны.'], () => {
        this.flags.sonyaMtnStage = 5;
        this._giveQuestReward({ id: 'sonyaMtnQ4' }, sonya);
        this.quests.unlock('sonyaMtnQ5');
        setTimeout(() => this.ui.notify('📋 Последний квест: Горный закат'), 2000);
      });
    } else {
      this.dialogue.start(sonya, [lines.q4?.hint || 'Колокольчик висит у скалы на обзорной площадке.']);
    }
    return;
  }

  if (stage === 5) {
    const hasFlower = this.inventory.has('mountainWindFlower');
    const hasBell   = this.inventory.has('oldBell');
    if (period === 'evening' && hasFlower && hasBell) {
      this._triggerSonyaMountainFinale(sonya);
    } else {
      const parts = [];
      if (period !== 'evening') parts.push('дождись вечера');
      if (!hasFlower) parts.push('найди ветреный цветок 🌺');
      if (!hasBell)   parts.push('найди старый колокольчик 🔔');
      this.dialogue.start(sonya, [parts.length ? `Ещё нужно: ${parts.join(', ')}.` : 'Всё готово... почти.']);
    }
    return;
  }

  // stage 6: arc complete
  this.dialogue.start(sonya, ['Горы всегда будут нашими. Рыжик. ❤️'], () => {
    this.player.mood = Math.min(100, this.player.mood + 5);
  });
};

Game.prototype._triggerSonyaMountainFinale = function(sonya) {
  const lines = [
    { speaker: 'npc',    text: 'Смотри... закат окрашивает всё в оранжевый.',                emotion: 'happy' },
    { speaker: 'ryzhik', text: 'Мур...',                                                       emotion: 'happy' },
    { speaker: 'npc',    text: 'Помнишь, как я впервые привела тебя сюда?',                   emotion: 'nostalgic' },
    { speaker: 'npc',    text: 'Тогда я думала: ну и что, просто кот.',                       emotion: 'neutral' },
    { speaker: 'npc',    text: 'А ты оказался... другом. Настоящим.',                         emotion: 'happy' },
    { speaker: 'ryzhik', text: 'Мяу!',                                                         emotion: 'happy' },
    { speaker: 'npc',    text: 'Позвони в колокольчик. Говорят, это приносит удачу горам.',   emotion: 'nostalgic' },
    { speaker: 'ryzhik', text: '🔔 Динь!',                                                     emotion: 'happy' },
    { speaker: 'npc',    text: 'Вот и всё. Никаких слов. Просто горы и закат.',               emotion: 'happy' },
  ];
  this.dialogue.startStory(sonya, lines, () => {
    this.inventory.remove('mountainWindFlower');
    this.inventory.remove('oldBell');
    sonya.trust = 3;
    this.flags.sonyaMtnStage      = 6;
    this.flags.sonyaMtnArcComplete = true;
    this._giveQuestReward({ id: 'sonyaMtnQ5' }, sonya);
    this.achievements.unlock('ach_sonya_mtn');
    this.player.mood = Math.min(100, this.player.mood + 20);
    this.weather.set('starry');
    setTimeout(() => this.ui.notify('⛰️ Горная сюжетная линия Сони завершена!'), 1500);
    setTimeout(() => this.ui.showEvent('🌅', 'Горный закат с Соней — незабываемый момент.'), 3000);
  });
};
