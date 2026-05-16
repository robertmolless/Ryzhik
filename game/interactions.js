'use strict';

Game.prototype._interactFurniture = function(f) {
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
              console.log('[Pickup] trying', 'barnKey');
              const added = this.inventory.add('barnKey');
              if (added) { interior.pickedItems.add(f.id); this.collectedCount++; console.log('[Pickup] added', 'barnKey'); this.ui.notify('🔑 В кухонном шкафчике нашёлся ключ от сарая!'); this._checkQuestItem('barnKey'); }
              else { console.log('[Pickup] inventory full', 'barnKey'); this.ui.notify('🎒 Инвентарь полон. Освободи место.'); }
            } else { this.ui.notify('📦 Шкафчик открыт — ключ уже был взят.'); }
          } else if (f.item && !interior.pickedItems.has(f.id)) {
            console.log('[Pickup] trying', f.item);
            const added = this.inventory.add(f.item);
            if (added) { interior.pickedItems.add(f.id); this.collectedCount++; console.log('[Pickup] added', f.item); const idata = ITEMS[f.item]; this.ui.notify(`🔑 В кухонном шкафчике нашёлся ${idata ? idata.name : f.item}!`); this._checkQuestItem(f.item); if (f.item === 'houseKey' && this.quests.isActive('q_ind3')) this._onQuestAdvance('q_ind3'); }
            else { console.log('[Pickup] inventory full', f.item); this.ui.notify('🎒 Инвентарь полон. Освободи место.'); }
          } else { this.ui.notify('📦 Шкафчик пустой — ключ уже взят.'); }
        } else { this.ui.notify('📦 Шкафчик уже открыт.'); }
      } else { this.ui.notify('📦 Открыто!'); }
      break;
    case 'pickup':
      if (!interior.pickedItems.has(f.id) && f.item) {
        console.log('[Pickup] trying', f.item);
        const added = this.inventory.add(f.item);
        if (added) {
          interior.pickedItems.add(f.id); this.collectedCount++;
          console.log('[Pickup] added', f.item);
          const idata = ITEMS[f.item];
          this.ui.notify(`✨ Нашёл: ${idata ? idata.name : f.item}!`);
          this.player.playAction('pickup'); this.audio.pickup(); this.telegram.vibrate(25);
          this._checkQuestItem(f.item);
          if (this.collectedCount >= 10) this.achievements.unlock('ach08');
          if (this.collectedCount >= 15) this.achievements.unlock('ach16');
        } else { console.log('[Pickup] inventory full', f.item); this.ui.notify('🎒 Инвентарь полон. Освободи место.'); }
      } else { this.ui.notify('💭 Рыжик уже взял всё интересное здесь.'); }
      break;
    case 'examine': {
      const examineTexts = {
        painting:'🖼️ Красивая картина. Горный пейзаж. Похоже, нарисован вручную.',
        bookshelf:'📚 Книги стоят ровно. «Кошки и их характер», «Сад круглый год»...',
        window:'🌤️ Из окна виден двор. Рыжик любит тут сидеть.',
        fireplace:'🔥 Камин потух. Пепел ещё тёплый.',
        chest:'📦 Старый сундук. Немного скрипит.',
        wardrobe:'👔 Шкаф с одеждой. Пахнет лавандой.',
        piano:'🎹 Старое пианино. Несколько клавиш не звучат.',
        attic_hatch:'🪜 Люк на чердак. Наверное, там что-то интересное!'
      };
      this.ui.notify(examineTexts[f.id] || `💭 ${f.label}... Интересно.`);
      if (f.questId && this.quests.isActive(f.questId)) this._onQuestAdvance(f.questId);
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
};

Game.prototype._interactBarnFurniture = function(f) {
  const barn = this.barn;
  switch (f.action) {
    case 'exit_barn': barn.startExit(); this.audio.uiClick(); this.ui.notify('🌿 Рыжик выходит из сарая...'); break;
    case 'pickup':
      if (!barn.pickedItems.has(f.id) && f.item) {
        console.log('[Pickup] trying', f.item);
        const added = this.inventory.add(f.item);
        if (added) {
          barn.pickedItems.add(f.id); this.collectedCount++;
          console.log('[Pickup] added', f.item);
          const iname = ITEMS[f.item] ? ITEMS[f.item].name : f.item;
          this.ui.notify(`✨ Рыжик нашёл: ${iname}!`);
          this.player.playAction('pickup'); this.audio.pickup(); this.telegram.vibrate(25);
          this._checkQuestItem(f.item);
          if (f.item === 'cassette' && this.quests.isActive('q_lyokha')) setTimeout(() => this.ui.notify('📼 Кассета Лёхи! Верни её ему.'), 1500);
          if (this.collectedCount >= 10) this.achievements.unlock('ach08');
          if (this.collectedCount >= 15) this.achievements.unlock('ach16');
        } else { console.log('[Pickup] inventory full', f.item); this.ui.notify('🎒 Инвентарь полон. Освободи место.'); }
      } else { this.ui.notify('💭 Рыжик уже взял всё интересное здесь.'); }
      break;
    case 'sit': this.ui.notify('😺 Рыжик запрыгивает на тюк сена! Тепло и колко...'); this.player.energy = Math.min(100, this.player.energy + 5); this.player.playAction('purr'); break;
    case 'examine': {
      const t = { b_shelf1:'🔧 Полка с инструментами. Молоток, гвозди, пила... всё покрыто пылью.', b_shelf2:'📦 Старые банки с краской. Пахнет скипидаром.', b_bike:'🚲 Старый велосипед. Давно не ездил — ручки облезли, но колёса целые!', b_lantern:'🔦 Старый керосиновый фонарь. Маслом ещё пахнет.', b_workbench:'🪚 Верстак с инструментами. Здесь точно что-то чинили.', b_boxes:'📦 Коробки с запчастями. Пыль и время.' };
      this.ui.notify(t[f.id] || `💭 ${f.label}... Интересно.`); break;
    }
    default: break;
  }
};

Game.prototype._handleMountainSubZone = function() {
  const mtn = this.mountains;
  const zone = mtn.currentSubZone;
  const szState = mtn.subZoneState[zone];
  const obj = mtn.nearestSubObject();
  if (!obj) { this.player.playAction('purr'); return; }

  switch (obj.action) {
    case 'exit_subzone':
      mtn.exitSubZone(); this.audio.uiClick();
      this.ui.notify('⛰️ Рыжик возвращается на горную тропу...'); break;

    case 'pickup':
      if (!szState.pickedItems.has(obj.id) && obj.item) {
        console.log('[Pickup] trying', obj.item);
        const added = this.inventory.add(obj.item);
        if (added) {
          szState.pickedItems.add(obj.id); this.collectedCount++;
          console.log('[Pickup] added', obj.item);
          const idata = ITEMS[obj.item];
          this.player.playAction('pickup'); this.audio.pickup(); this.telegram.vibrate(25);
          this.ui.notify(`✨ Подобрал: ${idata ? idata.icon[0]+' '+idata.name : obj.item}`);
          this._checkQuestItem(obj.item);
          if (this.collectedCount >= 10) this.achievements.unlock('ach08');
          if (this.collectedCount >= 15) this.achievements.unlock('ach16');
        } else { console.log('[Pickup] inventory full', obj.item); this.ui.notify('🎒 Инвентарь полон. Освободи место.'); }
      } else { this.ui.notify('💭 Здесь уже ничего нет.'); }
      break;

    case 'examine': {
      szState.inspected.add(obj.id);
      const examineTexts = {
        ps_pine1:'🌲 Старая сосна скрипит на ветру. Смола пахнет сладко и тягуче.',
        ps_pine2:'🌲 Раскидистые ветви качаются — кто-то прячется там наверху?',
        ps_pine3:'🌲 Молодая сосна. Шишки только завязались — ещё зелёные.',
        sv_boulder1:'🪨 Огромный валун, тёплый от солнца. Рыжик трётся о него лапкой.',
        sv_boulder2:'🪨 Два сросшихся камня. Похожи на ворота в другой мир.',
        sv_oldSign:'🪵 Старый деревянный указатель. Надпись почти стёрлась временем.',
        sv_campfire:'🔥 Небольшое кострище. Угли ещё чуть тёплые.',
        sv_viewDown:'🌅 Отсюда видно весь двор и дом далеко внизу. Красиво!',
        fm_flowers:'🌸 Цветы качаются на лёгком ветерке. Тонкий аромат.',
        fm_stream:'💧 Прозрачный ручеёк журчит по камням. Вода ледяная.',
        fm_moss:'🌿 Мягкий мох. Рыжик утопает в нём лапками — приятно!',
      };
      this.ui.notify(examineTexts[obj.id] || `💭 ${obj.label}...`); break;
    }

    case 'sit':
      szState.benchUsed = true;
      this.ui.notify('🪵 Рыжик устраивается на лавочке. Вид потрясающий!');
      this.player.energy = Math.min(100, this.player.energy + 8);
      this.player.mood   = Math.min(100, this.player.mood   + 10);
      this.player.playAction('purr'); break;

    case 'open_cache':
      if (!szState.cacheOpened) {
        console.log('[Pickup] trying', 'mountainFeather');
        const addedF = this.inventory.add('mountainFeather');
        if (addedF) {
          szState.cacheOpened = true; this.collectedCount++;
          console.log('[Pickup] added', 'mountainFeather');
          this.player.playAction('pickup'); this.audio.pickup(); this.telegram.vibrate(30);
          this.ui.notify('🪶 В тайнике у корней нашлось горное перышко!');
          this._checkQuestItem('mountainFeather');
        } else { console.log('[Pickup] inventory full', 'mountainFeather'); this.ui.notify('🎒 Инвентарь полон. Освободи место.'); }
      } else { this.ui.notify('💭 Тайник пуст.'); }
      break;

    case 'listen_wind':
      this.player.mood = Math.min(100, this.player.mood + 6);
      this.ui.notify('🌬️ Рыжик слушает ветер в соснах. Тихий-тихий звук...');
      this.player.playAction('purr'); break;

    case 'walk_path':
      this.ui.notify('🥾 Узкая тропа уходит вдаль. Рыжик осторожно идёт по ней.');
      this.player.energy = Math.max(0, this.player.energy - 3); break;

    case 'touch_flags':
      this.ui.notify('🎌 Флажки трепещут на ветру. Разноцветные, потрёпанные временем.');
      this.player.mood = Math.min(100, this.player.mood + 5); break;

    case 'light_lantern': {
      const sv = mtn.subZoneState.stoneViewpoint;
      sv.lanternOn = !sv.lanternOn;
      this.ui.notify(sv.lanternOn ? '🔦 Маленький фонарь зажёгся! Тепло и уютно.' : '🔦 Фонарь погашен.'); break;
    }

    case 'camera_scene':
      this.ui.notify('📸 Рыжик замирает у края площадки. Закат окрашивает всё в золото...');
      this.player.mood = Math.min(100, this.player.mood + 15);
      this.player.playAction('purr'); break;

    case 'catch_butterfly':
      if (szState.butterflyCaught) {
        this.ui.notify('🦋 Бабочки улетели. Но сегодня одну удалось поймать!');
      } else {
        szState.butterflyCaught = true;
        this.ui.notify('🦋 Рыжик поймал бабочку! Нежно подержал в лапках и отпустил...');
        this.player.mood = Math.min(100, this.player.mood + 12);
        this.player.playAction('purr');
      } break;

    case 'listen_stream':
      this.player.mood   = Math.min(100, this.player.mood   + 8);
      this.player.energy = Math.min(100, this.player.energy + 5);
      this.ui.notify('💧 Рыжик слушает ручеёк. Журчание воды успокаивает...');
      this.player.playAction('purr'); break;

    case 'collect_petals':
      if (!szState.inspected.has('petals')) {
        szState.inspected.add('petals');
        this.ui.notify('🌸 Рыжик собирает лепестки в лапки. Приятно и нежно!');
        this.player.mood = Math.min(100, this.player.mood + 7);
      } else { this.ui.notify('🌸 Лепестки уже собраны.'); }
      break;

    case 'find_hidden':
      if (!szState.pickedItems.has('fm_hidden')) {
        console.log('[Pickup] trying', 'warmPebble');
        const addedP = this.inventory.add('warmPebble');
        if (addedP) {
          szState.pickedItems.add('fm_hidden'); this.collectedCount++;
          console.log('[Pickup] added', 'warmPebble');
          this.player.playAction('pickup'); this.audio.pickup(); this.telegram.vibrate(25);
          this.ui.notify('🪨 В высокой траве нашёлся тёплый камень!');
          this._checkQuestItem('warmPebble');
        } else { console.log('[Pickup] inventory full', 'warmPebble'); this.ui.notify('🎒 Инвентарь полон. Освободи место.'); }
      } else { this.ui.notify('💭 Здесь уже ничего нет.'); }
      break;

    case 'pickup_windflower': {
      const period = this.time.period;
      if (period !== 'morning' && period !== 'evening') {
        this.ui.notify('🌺 Цветок закрыт. Приходи утром или вечером...');
        break;
      }
      if (!szState.pickedItems.has(obj.id)) {
        console.log('[Pickup] trying', 'mountainWindFlower');
        const addedW = this.inventory.add('mountainWindFlower');
        if (addedW) {
          szState.pickedItems.add(obj.id); this.collectedCount++;
          console.log('[Pickup] added', 'mountainWindFlower');
          this.player.playAction('pickup'); this.audio.pickup(); this.telegram.vibrate(25);
          this.ui.notify('🌺 Рыжик нашёл ветреный цветок! Пахнет свежим горным ветром.');
          this._checkQuestItem('mountainWindFlower');
        } else { console.log('[Pickup] inventory full', 'mountainWindFlower'); this.ui.notify('🎒 Инвентарь полон. Освободи место.'); }
      } else {
        this.ui.notify('🌺 Цветок уже сорван. Он снова вырастет позже.');
      }
      break;
    }

    default:
      this.ui.notify(`💭 ${obj.label}...`); break;
  }
};

Game.prototype._findNearestIndoorNPC = function() {
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
};
