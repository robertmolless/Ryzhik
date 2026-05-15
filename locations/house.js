'use strict';

const INDOOR_ITEMS = {
  vinyl:     { id:'vinyl',     name:'Виниловая пластинка', icon:'💿', desc:'Старый винил с любимой музыкой. Игорь обрадуется!', rare:true },
  houseKey:  { id:'houseKey',  name:'Старый ключ',         icon:'🗝️', desc:'Небольшой ключ. Может открыть сундук?', rare:true },
  catFig:    { id:'catFig',    name:'Фигурка кота',         icon:'🐈', desc:'Глиняная фигурка рыжего кота. Похожа на тебя!', rare:true },
  filmRoll:  { id:'filmRoll',  name:'Старая плёнка',        icon:'🎞️', desc:'Фотоплёнка из прошлого. Что на ней?', rare:true },
  warmScarf: { id:'warmScarf', name:'Тёплый шарф',          icon:'🧣', desc:'Уютный шарф. Сделает вечер ещё теплее.', rare:false },
  oldBadge:  { id:'oldBadge',  name:'Старый жетон',         icon:'🔖', desc:'Жетон с надписью «Дом». Кому он принадлежал?', rare:true },
  atticNote: { id:'atticNote', name:'Тайная записка',        icon:'📜', desc:'«Теплица открывается тем, кто принесёт лунный звон». Маг был прав!', rare:true },
  houseMap:  { id:'houseMap',  name:'Карта дома',           icon:'🗺️', desc:'Схема дома с отмеченными тайниками.', rare:true },
};

const INDOOR_QUESTS = [
  { id:'q_ind1',  title:'Войди в дом',          icon:'🏠', desc:'Рыжик чувствует что в доме что-то интересное. Пора заглянуть внутрь!', steps:['Подойди к двери дома','Войди в дом'],                              reward:{xp:15},                npc:null,       unlock:true  },
  { id:'q_ind2',  title:'Изучи гостиную',        icon:'🛋️', desc:'Гостиная полна интересных вещей. Рассмотри всё!',                      steps:['Найди фотографии в гостиной','Рассмотри гитару Лёхи'],            reward:{xp:20},                npc:null,       unlock:false },
  { id:'q_ind3',  title:'Найти ключ от сундука', icon:'🗝️', desc:'В доме есть сундук, но он заперт. Найди ключ!',                        steps:['Ищи ключ на кухне','Открой сундук на чердаке'],                   reward:{xp:25,item:'houseKey'}, npc:null,       unlock:false },
  { id:'q_ind4',  title:'Исследовать чердак',    icon:'🕯️', desc:'Чердак давно никто не проверял. Что там скрывается?',                  steps:['Поднимись на второй этаж','Найди тайник на чердаке'],             reward:{xp:30,item:'atticNote'},npc:null,       unlock:false },
  { id:'q_ind5',  title:'Найди виниловую пластинку',icon:'💿',desc:'Игорь говорил о потерянном виниле. Найди его в комнате Лёхи!',        steps:['Поговори с Игорем','Найди винил в комнате Лёхи'],                reward:{xp:20,trust:'igor'},   npc:'igor',     unlock:false },
  { id:'q_ind6',  title:'Вечером в гостиной',    icon:'🎵', desc:'Включи музыку вечером — может кто-то придёт?',                        steps:['Войди в дом вечером','Включи проигрыватель'],                     reward:{xp:18},                npc:null,       unlock:false },
  { id:'q_ind7',  title:'Старые фотографии',     icon:'📸', desc:'Настя хочет увидеть старые фото. Найди их в гостиной!',                steps:['Найди фотографии','Покажи Насте'],                                 reward:{xp:22,trust:'nastya'}, npc:'nastya',   unlock:false },
  { id:'q_ind8',  title:'Починить лампу',        icon:'💡', desc:'Лампа в гостиной не работает. Кристина поможет!',                     steps:['Поговори с Кристиной о лампе','Найди батарейки','Включи лампу'],  reward:{xp:25,trust:'kristina'},npc:'kristina', unlock:false },
  { id:'q_ind9',  title:'Карта тайников',        icon:'🗺️', desc:'В доме спрятана карта с тайниками. Найди её!',                        steps:['Найди карту дома','Отмети все тайники'],                          reward:{xp:30,item:'houseMap'}, npc:null,       unlock:false },
  { id:'q_ind10', title:'Тайна чердака',         icon:'🔮', desc:'Записка на чердаке — ключ к тайне теплицы!',                          steps:['Прочитай записку на чердаке','Поговори с Магом'],                 reward:{xp:40,trust:'mag'},    npc:'mag',      unlock:false },
];

const FURNITURE = [
  { id:'sofa',    floor:1, x:160, y:280, w:120, h:50, type:'sofa',    label:'Диван',           action:'sleep' },
  { id:'armchair',floor:1, x:320, y:270, w:60,  h:50, type:'armchair',label:'Кресло',          action:'sit' },
  { id:'tv',      floor:1, x:80,  y:185, w:90,  h:60, type:'tv',      label:'Телевизор',       action:'watch' },
  { id:'rug',     floor:1, x:150, y:300, w:160, h:80, type:'rug',     label:'Ковёр',           action:null },
  { id:'shelf',   floor:1, x:410, y:160, w:60,  h:120,type:'shelf',   label:'Книжная полка',   action:'examine' },
  { id:'guitar1', floor:1, x:440, y:240, w:30,  h:80, type:'guitar',  label:'Гитара Лёхи',     action:'listen' },
  { id:'lamp1',   floor:1, x:100, y:185, w:30,  h:60, type:'lamp',    label:'Лампа',           action:'lamp',    questId:'q_ind8' },
  { id:'photos',  floor:1, x:200, y:140, w:120, h:40, type:'photos',  label:'Старые фото',     action:'examine', questId:'q_ind2' },
  { id:'plant1',  floor:1, x:380, y:300, w:40,  h:60, type:'plant',   label:'Растение',        action:null },
  { id:'window1', floor:1, x:240, y:80,  w:120, h:60, type:'window',  label:'Окно',            action:null },
  { id:'table',   floor:1, x:550, y:260, w:100, h:70, type:'table',   label:'Стол',            action:'sit' },
  { id:'fridge',  floor:1, x:490, y:145, w:60,  h:100,type:'fridge',  label:'Холодильник',     action:'open' },
  { id:'catbowl', floor:1, x:540, y:370, w:40,  h:30, type:'bowl',    label:'Миска Рыжика',    action:'eat' },
  { id:'cabinet', floor:1, x:650, y:145, w:80,  h:80, type:'cabinet', label:'Кухонный шкафчик 🗝️', action:'open', item:'barnKey' },
  { id:'kettle',  floor:1, x:560, y:215, w:35,  h:35, type:'kettle',  label:'Чайник',          action:'examine' },
  { id:'window2', floor:1, x:680, y:80,  w:80,  h:60, type:'window',  label:'Окно кухни',      action:null },
  { id:'boxes1',  floor:1, x:770, y:200, w:80,  h:100,type:'boxes',   label:'Старые коробки',  action:'examine' },
  { id:'cobweb',  floor:1, x:810, y:150, w:40,  h:40, type:'cobweb',  label:'Паутина',         action:null },
  { id:'hidden1', floor:1, x:800, y:310, w:40,  h:40, type:'chest',   label:'Скрытая вещь',    action:'pickup', item:'oldBadge' },
  { id:'old_tin', floor:1, x:760, y:285, w:38,  h:38, type:'tin',     label:'Жестянка с ключом', action:'pickup', item:'houseKey' },
  { id:'exit_door', floor:1, x:5, y:195, w:55, h:120, type:'door',   label:'Выйти из дома 🚪', action:'exit_house' },
  { id:'stairs1', floor:1, x:50,  y:160, w:70,  h:100,type:'stairs',  label:'Наверх ↑',        action:'stairs_up' },
  { id:'bed',     floor:2, x:120, y:250, w:130, h:80, type:'bed',     label:'Кровать Лёхи',    action:'sleep' },
  { id:'guitar2', floor:2, x:280, y:230, w:30,  h:80, type:'guitar',  label:'Гитара',          action:'listen' },
  { id:'vinyl_pl',floor:2, x:200, y:175, w:70,  h:55, type:'player',  label:'Проигрыватель',   action:'listen', questId:'q_ind6', period:'evening' },
  { id:'poster1', floor:2, x:120, y:100, w:80,  h:80, type:'poster',  label:'Плакат рок-группы',action:'examine' },
  { id:'poster2', floor:2, x:220, y:100, w:80,  h:80, type:'poster',  label:'Плакат',          action:'examine' },
  { id:'headph',  floor:2, x:320, y:175, w:50,  h:40, type:'headphones',label:'Наушники',      action:'listen' },
  { id:'vinyl_c', floor:2, x:360, y:270, w:40,  h:40, type:'vinyl',   label:'Виниловая пластинка',action:'pickup', item:'vinyl' },
  { id:'lamp2',   floor:2, x:80,  y:195, w:30,  h:60, type:'lamp',    label:'Лампа',           action:'lamp' },
  { id:'boxes2',  floor:2, x:470, y:180, w:80,  h:90, type:'boxes',   label:'Старые коробки',  action:'examine' },
  { id:'boxes3',  floor:2, x:570, y:210, w:70,  h:80, type:'boxes',   label:'Коробки',         action:'examine' },
  { id:'chest',   floor:2, x:640, y:260, w:80,  h:60, type:'chest',   label:'Сундук',          action:'open_chest' },
  { id:'atticnote',floor:2,x:500, y:310, w:50,  h:40, type:'paper',   label:'Тайная записка',  action:'pickup', item:'atticNote', questId:'q_ind4' },
  { id:'filmroll',floor:2, x:690, y:200, w:35,  h:35, type:'film',    label:'Старая плёнка',   action:'pickup', item:'filmRoll' },
  { id:'dusty1',  floor:2, x:480, y:135, w:60,  h:30, type:'cobweb',  label:'Пыль',            action:null },
  { id:'dusty2',  floor:2, x:600, y:150, w:50,  h:25, type:'cobweb',  label:'Паутина',         action:null },
  { id:'balc_chair',floor:2,x:780, y:260, w:60, h:60, type:'armchair',label:'Кресло',          action:'sit' },
  { id:'lights',  floor:2, x:750, y:130, w:150, h:30, type:'lights',  label:'Гирлянды',        action:'examine' },
  { id:'balc_view',floor:2,x:820, y:185, w:70,  h:50, type:'window',  label:'Вид с балкона',   action:'examine' },
  { id:'stairs2', floor:2, x:50,  y:180, w:70,  h:100,type:'stairs',  label:'Вниз ↓',          action:'stairs_down' },
  { id:'guitar_strap',  floor:2, x:270, y:300, w:40,  h:20, type:'strap',   label:'Гитарный ремень', action:'pickup', item:'guitarStrap' },
  { id:'old_photo',     floor:2, x:660, y:300, w:40,  h:35, type:'paper',   label:'Старое фото',      action:'pickup', item:'oldPhoto' },
  { id:'house_map_pick',floor:2, x:520, y:320, w:45,  h:35, type:'paper',   label:'Карта дома',       action:'pickup', item:'houseMap' },
  { id:'batteries_box', floor:1, x:700, y:230, w:35,  h:30, type:'tin',     label:'Батарейки',        action:'pickup', item:'batteries' },
  { id:'cat_fig_item',  floor:1, x:380, y:310, w:30,  h:30, type:'catfig',  label:'Фигурка кота',     action:'pickup', item:'catFig' },
  { id:'cat_corner',    floor:1, x:195, y:330, w:50,  h:35, type:'catbed',  label:'Лежанка Рыжика 😴', action:'sleep' },
];

const INDOOR_NPC_SCHEDULE = {
  lyokha:  { floor:2, morning:null,              day:null,           evening:{x:200,y:240}, night:{x:120,y:260} },
  nastya:  { floor:1, morning:null,              day:{x:250,y:200},  evening:{x:200,y:200}, night:null },
  igor:    { floor:1, morning:null,              day:null,           evening:{x:440,y:240}, night:{x:380,y:260} },
  nena:    { floor:1, morning:{x:300,y:280},     day:{x:280,y:260},  evening:null,          night:null },
  danya:   { floor:2, morning:null,              day:{x:510,y:250},  evening:{x:490,y:230}, night:null },
};

class InteriorManager {
  constructor() {
    this.active = false;
    this.floor = 1;
    this.px = 400; this.py = 340;
    this.fadeAlpha = 0;
    this.fading = false;
    this.fadeDir = 0;
    this.pendingAction = null;
    this.fadeDone = false;
    this.lampOn = { lamp1:false, lamp2:false };
    this.tvOn = false;
    this.fridgeOpen = false;
    this.chestOpen = false;
    this.cabinetOpen = false;
    this.pickedItems = new Set();
    this.sitTarget = null;
    this.sitting = false;
  }
  get inHouse() { return this.active; }
  startEnter() {
    if (this.fading) return;
    this.fading = true; this.fadeDir = 1; this.fadeAlpha = 0;
    this.pendingAction = { type:'enter' };
  }
  startExit() {
    if (this.fading) return;
    this.fading = true; this.fadeDir = 1; this.fadeAlpha = 0;
    this.pendingAction = { type:'exit' };
  }
  goFloor(f) {
    if (this.fading) return;
    this.fading = true; this.fadeDir = 1; this.fadeAlpha = 0;
    this.pendingAction = { type:'floor', floor:f };
  }
  update(dt) {
    if (!this.fading) return;
    const speed = 3.5;
    this.fadeAlpha += this.fadeDir * speed * dt;
    if (this.fadeDir === 1 && this.fadeAlpha >= 1) {
      this.fadeAlpha = 1;
      if (this.pendingAction) {
        const a = this.pendingAction;
        this.pendingAction = null;
        if (a.type === 'enter') {
          this.active = true; this.floor = 1;
          this.px = 400; this.py = 340;
        } else if (a.type === 'exit') {
          this.active = false;
        } else if (a.type === 'floor') {
          this.floor = a.floor;
          this.px = 400; this.py = 300;
        }
      }
      this.fadeDir = -1;
    }
    if (this.fadeDir === -1 && this.fadeAlpha <= 0) {
      this.fadeAlpha = 0; this.fading = false;
    }
  }
  move(dx, dy, dt) {
    if (this.sitting) return;
    const speed = 120;
    let nx = this.px + dx * speed * dt;
    let ny = this.py + dy * speed * dt;
    const HW = 10, HH = 14;
    const floor = this.floor;
    const roomW = floor === 1 ? 880 : 910;
    nx = Math.max(HW, Math.min(roomW - HW, nx));
    ny = Math.max(80 + HH, Math.min(420 - HH, ny));
    const blocked = FURNITURE.filter(f => f.floor === floor && ['sofa','armchair','tv','fridge','cabinet','shelf','boxes','chest','bed','stairs','table'].includes(f.type));
    let bx = false, by = false;
    for (const f of blocked) {
      const ov1 = (nx - HW < f.x + f.w && nx + HW > f.x && this.py - HH < f.y + f.h && this.py + HH > f.y);
      if (ov1) bx = true;
      const ov2 = (this.px - HW < f.x + f.w && this.px + HW > f.x && ny - HH < f.y + f.h && ny + HH > f.y);
      if (ov2) by = true;
    }
    if (!bx) this.px = nx;
    if (!by) this.py = ny;
  }
  nearestFurniture() {
    const floor = this.floor;
    let best = null, bestD = 65;
    for (const f of FURNITURE) {
      if (f.floor !== floor || !f.action) continue;
      const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
      const d = Math.sqrt((cx - this.px) ** 2 + (cy - this.py) ** 2);
      if (d < bestD) { bestD = d; best = f; }
    }
    return best;
  }
  save() {
    return {
      active: this.active, floor: this.floor, px: this.px, py: this.py,
      lampOn: { ...this.lampOn }, tvOn: this.tvOn, fridgeOpen: this.fridgeOpen,
      chestOpen: this.chestOpen, cabinetOpen: this.cabinetOpen,
      pickedItems: [...this.pickedItems],
    };
  }
  load(s) {
    if (!s) return;
    this.active = s.active || false;
    this.floor = s.floor || 1;
    this.px = s.px || 400;
    this.py = s.py || 340;
    this.tvOn = s.tvOn || false;
    this.fridgeOpen = s.fridgeOpen || false;
    this.chestOpen = s.chestOpen || false;
    this.cabinetOpen = s.cabinetOpen || false;
    this.pickedItems = new Set(s.pickedItems || []);
    this.lampOn = s.lampOn || { lamp1:false, lamp2:false };
  }
}

function drawHouseScene(ctx, opts) {
  const { floor, px, py, t, period, interior, npcs, cw, ch } = opts;
  const roomW = floor === 1 ? 880 : 910;
  const camX = Math.max(0, Math.min(roomW - cw, px - cw / 2));

  ctx.save();
  const wallGrad = ctx.createLinearGradient(0, 0, 0, 200);
  wallGrad.addColorStop(0, '#f5ede0');
  wallGrad.addColorStop(1, '#e8d8c0');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, cw, ch);
  ctx.strokeStyle = 'rgba(180,160,130,0.08)';
  ctx.lineWidth = 1;
  for (let wx = 0; wx < cw; wx += 40) {
    ctx.beginPath(); ctx.moveTo(wx, 0); ctx.lineTo(wx, ch * 0.55); ctx.stroke();
  }
  ctx.fillStyle = '#d4c4a8';
  ctx.fillRect(0, 0, Math.max(0, 80 - camX), ch);
  const rightWallX = roomW - camX - 20;
  if (rightWallX < cw) {
    ctx.fillStyle = '#d4c4a8';
    ctx.fillRect(rightWallX, 0, cw - rightWallX, ch);
  }

  const floorY = ch * 0.52;
  for (let row = 0; row < 12; row++) {
    const fy = floorY + row * 28;
    const r = Math.min(200, 160 + row * 2);
    const g = Math.min(170, 115 + row * 2);
    const b = Math.min(90, 65 + row);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, fy, cw, 28);
    ctx.strokeStyle = `rgba(${r-20},${g-15},${b-10},0.35)`;
    ctx.lineWidth = 1;
    const plankW = 80 + (row % 3) * 20;
    for (let px2 = (row * 37) % plankW - plankW; px2 < cw; px2 += plankW) {
      ctx.beginPath(); ctx.moveTo(px2, fy); ctx.lineTo(px2, fy + 28); ctx.stroke();
    }
    ctx.strokeStyle = `rgba(${r-10},${g-8},${b-5},0.12)`;
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx < cw; gx += 15) {
      ctx.beginPath(); ctx.moveTo(gx, fy + 4); ctx.lineTo(gx + 5, fy + 24); ctx.stroke();
    }
  }

  _drawRoomLayout(ctx, floor, camX, floorY, t, cw, ch);

  const furnitureBehind = FURNITURE.filter(f => f.floor === floor && f.y + f.h < py);
  const furnitureInFront = FURNITURE.filter(f => f.floor === floor && f.y + f.h >= py);
  for (const f of furnitureBehind) _drawFurnitureItem(ctx, f, camX, t, interior, period);
  _drawDustParticles(ctx, t, cw, ch);
  _drawIndoorNPCs(ctx, floor, camX, t, period, npcs, py);

  const catSX = px - camX;
  const catSY = py;
  ctx.save();
  drawCat(ctx, {
    x: catSX, y: catSY,
    facing: 1, frame: 0, moving: false,
    jumping: false, jumpY: 0,
    emotion: interior.sitting ? 'happy' : null,
    t: t, food: 80, mood: 80,
  });
  ctx.restore();

  for (const f of furnitureInFront) _drawFurnitureItem(ctx, f, camX, t, interior, period);
  _drawLighting(ctx, floor, camX, t, period, interior, cw, ch);

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.font = 'bold 12px system-ui';
  ctx.textAlign = 'left';
  const roomLabel = floor === 1 ? '🏠 Первый этаж' : '🪜 Второй этаж';
  ctx.fillText(roomLabel, 12, 22);
  ctx.restore();

  if (interior.fadeAlpha > 0) {
    ctx.fillStyle = `rgba(0,0,0,${interior.fadeAlpha})`;
    ctx.fillRect(0, 0, cw, ch);
  }
}

function _drawRoomLayout(ctx, floor, camX, floorY, t, cw, ch) {
  ctx.save();
  if (floor === 1) {
    const divX = 465 - camX;
    if (divX > 0 && divX < cw) {
      ctx.fillStyle = '#c8b090';
      ctx.fillRect(divX, 60, 15, floorY - 60);
      ctx.fillStyle = '#f5ede0';
      ctx.beginPath();
      ctx.arc(divX + 7, floorY - 50, 30, Math.PI, 0, false);
      ctx.fillRect(divX - 23, floorY - 50, 60, 50);
      ctx.fill();
    }
    const div2X = 760 - camX;
    if (div2X > 0 && div2X < cw) {
      ctx.fillStyle = '#b8a080';
      ctx.fillRect(div2X, 60, 12, floorY - 60);
    }
    ctx.fillStyle = 'rgba(140,110,70,0.5)';
    ctx.font = 'italic 11px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Гостиная', 240 - camX, 75);
    ctx.fillText('Кухня', 630 - camX, 75);
    ctx.fillText('Кладовка', 815 - camX, 75);
  } else {
    const divX = 450 - camX;
    if (divX > 0 && divX < cw) {
      ctx.fillStyle = '#b0906a';
      ctx.fillRect(divX, 60, 12, floorY - 60);
    }
    const div2X = 745 - camX;
    if (div2X > 0 && div2X < cw) {
      ctx.fillStyle = '#888'; ctx.lineWidth = 2;
      for (let bx = div2X; bx < div2X + 160; bx += 14) {
        ctx.fillRect(bx, 80, 3, floorY - 80);
      }
      ctx.fillRect(div2X, 80, 160, 4);
    }
    const balcX = Math.max(0, 745 - camX);
    if (balcX < cw) {
      const skyG = ctx.createLinearGradient(balcX, 0, cw, 200);
      skyG.addColorStop(0, 'rgba(135,180,220,0.6)');
      skyG.addColorStop(1, 'rgba(200,230,255,0.4)');
      ctx.fillStyle = skyG;
      ctx.fillRect(balcX, 0, cw - balcX, floorY);
    }
    ctx.fillStyle = 'rgba(140,110,70,0.5)';
    ctx.font = 'italic 11px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('Комната Лёхи', 240 - camX, 75);
    ctx.fillText('Чердак', 600 - camX, 75);
    ctx.fillText('Балкон', 820 - camX, 75);
  }
  ctx.restore();
}

function _drawFurnitureItem(ctx, f, camX, t, interior, period) {
  const sx = f.x - camX;
  if (sx + f.w < -20 || sx > ctx.canvas.width + 20) return;
  ctx.save();
  ctx.translate(sx, f.y);
  switch (f.type) {
    case 'sofa':      _drawSofa(ctx, f, t); break;
    case 'armchair':  _drawArmchair(ctx, f, t); break;
    case 'tv':        _drawTV(ctx, f, t, interior.tvOn); break;
    case 'shelf':     _drawShelf(ctx, f, t); break;
    case 'guitar':    _drawGuitar(ctx, f, t); break;
    case 'lamp':      _drawLamp(ctx, f, t, interior.lampOn[f.id] || false); break;
    case 'photos':    _drawPhotos(ctx, f, t); break;
    case 'plant':     _drawPlant(ctx, f, t); break;
    case 'window':    _drawWindow(ctx, f, t, period); break;
    case 'table':     _drawTable(ctx, f, t); break;
    case 'fridge':    _drawFridge(ctx, f, t, interior.fridgeOpen); break;
    case 'bowl':      _drawBowl(ctx, f, t); break;
    case 'cabinet':   _drawCabinet(ctx, f, t, interior.cabinetOpen); break;
    case 'kettle':    _drawKettle(ctx, f, t); break;
    case 'bed':       _drawBed(ctx, f, t); break;
    case 'boxes':     _drawBoxes(ctx, f, t); break;
    case 'chest':     _drawChest(ctx, f, t, interior.chestOpen); break;
    case 'poster':    _drawPoster(ctx, f, t); break;
    case 'headphones':_drawHeadphones(ctx, f, t); break;
    case 'player':    _drawVinylPlayer(ctx, f, t, period); break;
    case 'vinyl':     _drawVinylDisc(ctx, f, t, interior.pickedItems.has(f.id)); break;
    case 'paper':     _drawPaper(ctx, f, t, interior.pickedItems.has(f.id)); break;
    case 'film':      _drawFilm(ctx, f, t, interior.pickedItems.has(f.id)); break;
    case 'stairs':    _drawStairs(ctx, f, t); break;
    case 'lights':    _drawLights(ctx, f, t, period); break;
    case 'cobweb':    _drawCobweb(ctx, f, t); break;
    case 'rug':       _drawRug(ctx, f, t); break;
    case 'door':      _drawInteriorDoor(ctx, f, t, interior.pickedItems); break;
    case 'tin':       _drawTin(ctx, f, t, interior.pickedItems.has(f.id)); break;
    case 'strap':     _drawStrap(ctx, f, t, interior.pickedItems.has(f.id)); break;
    case 'catfig':    _drawCatFig(ctx, f, t, interior.pickedItems.has(f.id)); break;
    default: break;
  }
  ctx.restore();
}

function _drawSofa(ctx, f, t) {
  const w = f.w, h = f.h;
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(4, h - 4, w - 4, 6);
  const backG = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  backG.addColorStop(0, '#c87840'); backG.addColorStop(1, '#a05820');
  ctx.fillStyle = backG;
  GFX.roundRect(ctx, 0, 0, w, h * 0.55, 6); ctx.fill();
  ctx.fillStyle = 'rgba(255,200,140,0.25)';
  GFX.roundRect(ctx, 6, 4, w - 12, 10, 3); ctx.fill();
  const seatG = ctx.createLinearGradient(0, h * 0.5, 0, h);
  seatG.addColorStop(0, '#b86830'); seatG.addColorStop(1, '#904810');
  ctx.fillStyle = seatG;
  GFX.roundRect(ctx, 0, h * 0.5, w, h * 0.5, 4); ctx.fill();
  ctx.fillStyle = '#a05820';
  GFX.roundRect(ctx, 0, 0, 14, h, 5); ctx.fill();
  GFX.roundRect(ctx, w - 14, 0, 14, h, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(80,40,10,0.3)'; ctx.lineWidth = 1.5;
  [w / 3, w * 2 / 3].forEach(tx => { ctx.beginPath(); ctx.moveTo(tx, 4); ctx.lineTo(tx, h * 0.48); ctx.stroke(); });
}
function _drawArmchair(ctx, f, t) {
  const w = f.w, h = f.h;
  ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(3, h - 3, w - 3, 5);
  const backG = ctx.createLinearGradient(0, 0, 0, h * 0.6);
  backG.addColorStop(0, '#b87848'); backG.addColorStop(1, '#906030');
  ctx.fillStyle = backG; GFX.roundRect(ctx, 0, 0, w, h * 0.6, 5); ctx.fill();
  ctx.fillStyle = '#986840'; GFX.roundRect(ctx, 0, h * 0.55, w, h * 0.45, 4); ctx.fill();
  ctx.fillStyle = '#885830'; GFX.roundRect(ctx, 0, 0, 10, h, 4); ctx.fill(); GFX.roundRect(ctx, w - 10, 0, 10, h, 4); ctx.fill();
}
function _drawTV(ctx, f, t, tvOn) {
  const w = f.w, h = f.h;
  ctx.fillStyle = '#4a3520'; ctx.fillRect(w / 2 - 8, h - 8, 16, 8); ctx.fillRect(w / 2 - 20, h - 3, 40, 4);
  const bodyG = ctx.createLinearGradient(0, 0, 0, h - 8);
  bodyG.addColorStop(0, '#2a2a2a'); bodyG.addColorStop(1, '#1a1a1a');
  ctx.fillStyle = bodyG; GFX.roundRect(ctx, 0, 0, w, h - 10, 5); ctx.fill();
  ctx.fillStyle = '#0a0a0a'; GFX.roundRect(ctx, 4, 4, w - 8, h - 20, 3); ctx.fill();
  if (tvOn) {
    const screenG = ctx.createLinearGradient(6, 6, w - 6, h - 22);
    screenG.addColorStop(0, '#1a4a8a'); screenG.addColorStop(0.5, '#2a6aaa'); screenG.addColorStop(1, '#1a3a6a');
    ctx.fillStyle = screenG; ctx.fillRect(6, 6, w - 12, h - 24);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 12; i++) { ctx.fillRect(8 + Math.floor(Math.sin(t * 3 + i) * (w - 16) * 0.5 + (w - 16) * 0.5), 8 + Math.floor(Math.cos(t * 2 + i) * (h - 28) * 0.3 + (h - 28) * 0.4), 2, 2); }
  } else {
    ctx.fillStyle = '#050508'; ctx.fillRect(6, 6, w - 12, h - 24);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath(); ctx.ellipse(w * 0.3, (h - 24) * 0.3 + 6, 8, 6, -0.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = tvOn ? '#44ff44' : '#330000';
  ctx.beginPath(); ctx.arc(w - 8, h - 15, 2, 0, Math.PI * 2); ctx.fill();
}
function _drawShelf(ctx, f, t) {
  const w = f.w, h = f.h;
  ctx.fillStyle = '#5c3a18'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#4a2e10'; ctx.fillRect(0, 0, 4, h); ctx.fillRect(w - 4, 0, 4, h);
  const shelfY = [h * 0.33, h * 0.66];
  shelfY.forEach(sy => { ctx.fillStyle = '#7a5030'; ctx.fillRect(0, sy, w, 4); });
  const bookColors = ['#c03020','#204080','#206040','#a08020','#802060','#406040','#804020'];
  let bx = 3;
  for (let b = 0; b < 7; b++) {
    const bw = 6 + (b % 3) * 2, bh = 18 + (b % 4) * 4, by = shelfY[b < 4 ? 0 : 1] - bh;
    ctx.fillStyle = bookColors[b % bookColors.length]; ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.5; ctx.strokeRect(bx, by, bw, bh);
    bx += bw + 2; if (bx > w - 8) bx = 3;
  }
}
function _drawGuitar(ctx, f, t) {
  const cx = f.w / 2;
  ctx.fillStyle = '#7a5020'; ctx.fillRect(cx - 3, -30, 6, f.h * 0.7);
  ctx.fillStyle = '#c87820';
  ctx.beginPath(); ctx.ellipse(cx, f.h * 0.45, 12, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, f.h * 0.75, 15, 18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a1a00'; ctx.beginPath(); ctx.arc(cx, f.h * 0.6, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,150,0.7)'; ctx.lineWidth = 0.5;
  for (let s = 0; s < 4; s++) { ctx.beginPath(); ctx.moveTo(cx - 3 + s * 2, -25); ctx.lineTo(cx - 3 + s * 2, f.h * 0.8); ctx.stroke(); }
  ctx.fillStyle = '#5a3010';
  for (let p = 0; p < 3; p++) { ctx.beginPath(); ctx.arc(cx - 8 + p * 8, -28, 3, 0, Math.PI * 2); ctx.fill(); }
}
function _drawLamp(ctx, f, t, on) {
  const cx = f.w / 2;
  if (on) {
    const glow = ctx.createRadialGradient(cx, f.h * 0.15, 0, cx, f.h * 0.15, 80);
    glow.addColorStop(0, 'rgba(255,220,100,0.35)'); glow.addColorStop(1, 'rgba(255,180,50,0)');
    ctx.fillStyle = glow; ctx.fillRect(cx - 80, f.h * 0.15 - 80, 160, 160);
  }
  ctx.fillStyle = '#5a3a18'; ctx.beginPath(); ctx.ellipse(cx, f.h - 4, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a5028'; ctx.fillRect(cx - 2, f.h * 0.35, 4, f.h * 0.6);
  ctx.fillStyle = on ? '#ffea80' : '#d4a840';
  ctx.beginPath(); ctx.moveTo(cx - 18, f.h * 0.35); ctx.lineTo(cx + 18, f.h * 0.35); ctx.lineTo(cx + 12, 0); ctx.lineTo(cx - 12, 0); ctx.closePath(); ctx.fill();
  if (on) {
    ctx.fillStyle = 'rgba(255,240,120,0.6)';
    ctx.beginPath(); ctx.moveTo(cx - 14, f.h * 0.33); ctx.lineTo(cx + 14, f.h * 0.33); ctx.lineTo(cx + 8, 3); ctx.lineTo(cx - 8, 3); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = on ? '#b88a20' : '#8a6020'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 18, f.h * 0.35); ctx.lineTo(cx + 18, f.h * 0.35); ctx.lineTo(cx + 12, 0); ctx.lineTo(cx - 12, 0); ctx.closePath(); ctx.stroke();
}
function _drawPhotos(ctx, f, t) {
  const w = f.w, h = f.h;
  [{ x: 0, w: 28, col: '#d4a040' },{ x: 32, w: 32, col: '#8080a0' },{ x: 68, w: 28, col: '#a06040' },{ x: 100, w: 20, col: '#406080' }].forEach(fd => {
    ctx.fillStyle = fd.col; ctx.fillRect(fd.x, 0, fd.w, h);
    ctx.fillStyle = '#f0e8d8'; ctx.fillRect(fd.x + 2, 2, fd.w - 4, h - 4);
    ctx.fillStyle = '#d4a060'; ctx.beginPath(); ctx.ellipse(fd.x + fd.w / 2, h * 0.35, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a3010'; ctx.font = '6px serif'; ctx.textAlign = 'center'; ctx.fillText('☺', fd.x + fd.w / 2, h * 0.42);
  });
}
function _drawPlant(ctx, f, t) {
  const cx = f.w / 2, bob = Math.sin(t * 0.8) * 1;
  ctx.fillStyle = '#c05a2a';
  ctx.beginPath(); ctx.moveTo(cx - 14, f.h); ctx.lineTo(cx + 14, f.h); ctx.lineTo(cx + 10, f.h - 24); ctx.lineTo(cx - 10, f.h - 24); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#a04820'; ctx.fillRect(cx - 12, f.h - 24, 24, 4);
  const leafColors = ['#2a6e20', '#3a8028', '#4a9030', '#206818'];
  [{ cpx: cx - 20, cpy: f.h - 50, ex: cx - 30, ey: f.h - 65 },{ cpx: cx + 20, cpy: f.h - 55, ex: cx + 32, ey: f.h - 70 },{ cpx: cx - 10, cpy: f.h - 60, ex: cx - 5, ey: f.h - 85 + bob },{ cpx: cx + 10, cpy: f.h - 58, ex: cx + 8, ey: f.h - 80 + bob },{ cpx: cx - 25, cpy: f.h - 40, ex: cx - 38, ey: f.h - 55 }].forEach((l, i) => {
    ctx.strokeStyle = leafColors[i % leafColors.length]; ctx.lineWidth = 5 - i * 0.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, f.h - 24); ctx.quadraticCurveTo(l.cpx, l.cpy, l.ex, l.ey); ctx.stroke();
  });
}
function _drawWindow(ctx, f, t, period) {
  const w = f.w, h = f.h;
  const glassAlpha = period === 'night' ? 0.15 : 0.4;
  const glassColor = period === 'night' ? 'rgba(30,30,80,' : 'rgba(180,220,255,';
  ctx.fillStyle = glassColor + glassAlpha + ')'; ctx.fillRect(4, 4, w - 8, h - 8);
  if (period !== 'night') {
    const lg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.8);
    lg.addColorStop(0, 'rgba(255,250,200,0.3)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, w + 60, h + 40);
  }
  ctx.strokeStyle = '#5a3a18'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, w - 4, h - 4);
  ctx.beginPath(); ctx.moveTo(w / 2, 2); ctx.lineTo(w / 2, h - 2); ctx.moveTo(2, h / 2); ctx.lineTo(w - 2, h / 2); ctx.stroke();
  const wave = Math.sin(t * 0.5) * 3;
  ctx.fillStyle = 'rgba(240,230,200,0.75)';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12, 0);
  for (let cy = 0; cy < h; cy += 8) ctx.lineTo(12 + Math.sin(cy * 0.3 + t * 0.4) * 4 + wave, cy);
  ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(w - 12, 0);
  for (let cy = 0; cy < h; cy += 8) ctx.lineTo(w - 12 - Math.sin(cy * 0.3 + t * 0.4 + 1) * 4 - wave, cy);
  ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
}
function _drawTable(ctx, f, t) {
  const w = f.w, h = f.h;
  ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(4, h - 3, w - 4, 5);
  const topG = ctx.createLinearGradient(0, 0, 0, 12);
  topG.addColorStop(0, '#c89050'); topG.addColorStop(1, '#a07030');
  ctx.fillStyle = topG; ctx.fillRect(0, 0, w, 12);
  ctx.fillStyle = '#8a5820'; ctx.fillRect(0, 10, w, 4);
  ctx.fillStyle = '#7a4818';
  [[4, 14], [w - 12, 14]].forEach(([lx, ly]) => ctx.fillRect(lx, ly, 8, h - ly));
  ctx.fillStyle = '#f0d0a0'; ctx.beginPath(); ctx.arc(w * 0.3, 4, 5, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#c09060'; ctx.fillRect(w * 0.3 - 5, 3, 10, 6);
}
function _drawFridge(ctx, f, t, open) {
  const w = f.w, h = f.h;
  const bodyG = ctx.createLinearGradient(0, 0, w, 0);
  bodyG.addColorStop(0, '#e8e8e8'); bodyG.addColorStop(1, '#d0d0d8');
  ctx.fillStyle = bodyG; GFX.roundRect(ctx, 0, 0, w, h, 4); ctx.fill();
  ctx.strokeStyle = '#b0b0b8'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(4, h * 0.4); ctx.lineTo(w - 4, h * 0.4); ctx.stroke();
  ctx.fillStyle = '#888898'; ctx.fillRect(w - 10, h * 0.15, 4, 15); ctx.fillRect(w - 10, h * 0.55, 4, 15);
  ctx.fillStyle = '#c0c0c8'; ctx.fillRect(2, 0, 4, h);
  if (open) {
    ctx.fillStyle = 'rgba(255,250,220,0.6)'; ctx.fillRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = '#a0d060'; ctx.beginPath(); ctx.arc(w * 0.3, h * 0.2, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(w * 0.55, h * 0.25, 12, 20);
  }
}
function _drawBowl(ctx, f, t) {
  const cx = f.w / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.ellipse(cx, f.h, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8c888'; ctx.beginPath(); ctx.arc(cx, f.h * 0.5, 16, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#d4b070'; ctx.beginPath(); ctx.ellipse(cx, f.h * 0.5, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c87840';
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(cx - 8 + i * 4, f.h * 0.48, 2, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#8a5820'; ctx.font = '6px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Рыжик', cx, f.h * 0.85);
}
function _drawCabinet(ctx, f, t, open) {
  const w = f.w, h = f.h;
  ctx.fillStyle = '#7a5030'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#6a4020'; ctx.fillRect(0, 0, 3, h); ctx.fillRect(w - 3, 0, 3, h); ctx.fillRect(0, 0, w, 3); ctx.fillRect(0, h - 3, w, 3);
  const dw = w / 2 - 2;
  if (open) {
    ctx.save(); ctx.translate(0, 0); ctx.transform(1, 0, -0.4, 1, 0, 0);
    ctx.fillStyle = '#8a6040'; ctx.fillRect(2, 2, dw, h - 4); ctx.restore();
    ctx.fillStyle = 'rgba(255,240,200,0.5)'; ctx.fillRect(dw + 4, 2, w - dw - 8, h - 4);
    ctx.fillStyle = '#c8a060'; ctx.fillRect(w * 0.6, h * 0.3, 8, 20);
    ctx.fillStyle = '#ff8844'; ctx.beginPath(); ctx.arc(w * 0.75, h * 0.35, 5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#8a6040'; ctx.fillRect(2, 2, dw, h - 4); ctx.fillRect(dw + 4, 2, w - dw - 6, h - 4);
    ctx.fillStyle = '#b89060';
    ctx.beginPath(); ctx.arc(dw, h / 2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(dw + 4, h / 2, 3, 0, Math.PI * 2); ctx.fill();
  }
}
function _drawKettle(ctx, f, t) {
  const cx = f.w / 2, cy = f.h / 2;
  const kg = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 15);
  kg.addColorStop(0, '#e0e0e8'); kg.addColorStop(1, '#9898a8');
  ctx.fillStyle = kg; ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b0b0b8';
  ctx.beginPath(); ctx.moveTo(cx + 10, cy - 4); ctx.lineTo(cx + 22, cy - 12); ctx.lineTo(cx + 24, cy - 8); ctx.lineTo(cx + 12, cy + 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#888898'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx - 16, cy, 8, -0.5, 0.5, false); ctx.stroke();
  ctx.fillStyle = '#c0c0c8'; ctx.beginPath(); ctx.ellipse(cx, cy - 13, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#a0a0a8'; ctx.beginPath(); ctx.arc(cx, cy - 16, 3, 0, Math.PI * 2); ctx.fill();
  const steamY = Math.sin(t * 2) * 3;
  ctx.strokeStyle = 'rgba(200,200,220,0.4)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 3, cy - 16); ctx.quadraticCurveTo(cx - 8, cy - 28 + steamY, cx - 3, cy - 38 + steamY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 3, cy - 16); ctx.quadraticCurveTo(cx + 8, cy - 26 + steamY, cx + 3, cy - 36 + steamY); ctx.stroke();
}
function _drawBed(ctx, f, t) {
  const w = f.w, h = f.h;
  ctx.fillStyle = '#7a4a1a'; ctx.fillRect(0, 0, w, h);
  GFX.roundRect(ctx, 0, 0, w, 22, 5); ctx.fill();
  ctx.fillStyle = '#f0ece4'; GFX.roundRect(ctx, 4, 20, w - 8, h - 28, 4); ctx.fill();
  const blankG = ctx.createLinearGradient(4, 30, 4, h - 8);
  blankG.addColorStop(0, '#5580c0'); blankG.addColorStop(1, '#3a5898');
  ctx.fillStyle = blankG; GFX.roundRect(ctx, 4, h * 0.45, w - 8, h * 0.45, 4); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
  for (let bx = 10; bx < w - 10; bx += 16) { ctx.beginPath(); ctx.moveTo(bx, h * 0.45); ctx.lineTo(bx, h - 8); ctx.stroke(); }
  ctx.fillStyle = '#f8f4ec'; GFX.roundRect(ctx, 8, 22, w - 16, 20, 4); ctx.fill();
  ctx.strokeStyle = '#d0c8b8'; ctx.lineWidth = 0.8; ctx.strokeRect(10, 24, w - 20, 16);
}
function _drawBoxes(ctx, f, t) {
  const w = f.w, h = f.h;
  [{ x:10, y:h*0.5, w:w*0.7, h:h*0.5, shade:'#c89050' },{ x:0, y:h*0.2, w:w*0.55, h:h*0.5, shade:'#b07840' },{ x:w*0.45, y:h*0.3, w:w*0.5, h:h*0.4, shade:'#d0a060' }].forEach(b => {
    ctx.fillStyle = b.shade; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = _lightenHex(b.shade, 15); ctx.fillRect(b.x, b.y, b.w, 5);
    ctx.strokeStyle = 'rgba(200,180,100,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(b.x, b.y + b.h * 0.5); ctx.lineTo(b.x + b.w, b.y + b.h * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(b.x + b.w / 2, b.y); ctx.lineTo(b.x + b.w / 2, b.y + b.h); ctx.stroke();
  });
}
function _drawChest(ctx, f, t, open) {
  const w = f.w, h = f.h;
  ctx.fillStyle = '#6a4018'; ctx.fillRect(0, h * 0.35, w, h * 0.65);
  ctx.fillStyle = '#888848';
  [[0, h * 0.35], [w - 8, h * 0.35], [0, h - 8], [w - 8, h - 8]].forEach(([cx, cy]) => ctx.fillRect(cx, cy, 8, 8));
  if (open) {
    ctx.save(); ctx.translate(0, h * 0.35); ctx.transform(1, 0, 0.3, -0.7, 0, 0);
    ctx.fillStyle = '#8a5828'; ctx.fillRect(0, 0, w, h * 0.35);
    ctx.fillStyle = '#6a4018'; ctx.fillRect(0, 0, w, 4); ctx.restore();
    const glow = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, 50);
    glow.addColorStop(0, 'rgba(255,220,80,0.5)'); glow.addColorStop(1, 'rgba(255,180,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w + 50, h + 50);
  } else {
    ctx.fillStyle = '#8a5828'; ctx.fillRect(0, 0, w, h * 0.38);
    ctx.fillStyle = '#6a4018'; ctx.fillRect(0, h * 0.35, w, 4);
  }
  ctx.fillStyle = '#b09040'; ctx.fillRect(w / 2 - 6, h * 0.4, 12, 10);
  ctx.beginPath(); ctx.arc(w / 2, h * 0.38, 5, Math.PI, 0); ctx.stroke();
}
function _drawPoster(ctx, f, t) {
  const w = f.w, h = f.h;
  ctx.fillStyle = '#2a1a0a'; ctx.fillRect(0, 0, w, h);
  const pg = ctx.createLinearGradient(2, 2, w - 2, h - 2);
  pg.addColorStop(0, '#1a0a2a'); pg.addColorStop(0.5, '#3a1a4a'); pg.addColorStop(1, '#2a0a3a');
  ctx.fillStyle = pg; ctx.fillRect(2, 2, w - 4, h - 4);
  ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(w * 0.6, 8); ctx.lineTo(w * 0.35, h * 0.5); ctx.lineTo(w * 0.55, h * 0.5); ctx.lineTo(w * 0.3, h - 8); ctx.stroke();
  ctx.fillStyle = 'rgba(255,220,80,0.6)';
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(4 + i * 12, h * 0.8, 2, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#ff4488'; ctx.font = `bold ${Math.floor(w * 0.15)}px sans-serif`; ctx.textAlign = 'center';
  ctx.fillText('ROCK', w / 2, h * 0.35);
}
function _drawInteriorDoor(ctx, f, t, pickedItems) {
  const w = f.w, h = f.h;
  ctx.fillStyle = '#8a6040'; GFX.roundRect(ctx, 0, 0, w, h, 3); ctx.fill();
  ctx.fillStyle = '#a07850'; GFX.roundRect(ctx, 4, 4, w - 8, h - 8, 2); ctx.fill();
  ctx.strokeStyle = 'rgba(60,30,10,0.15)'; ctx.lineWidth = 1;
  for (let gy = 8; gy < h - 8; gy += 20) { ctx.beginPath(); ctx.moveTo(6, gy); ctx.lineTo(w - 6, gy + 3); ctx.stroke(); }
  ctx.fillStyle = '#c8a040'; ctx.beginPath(); ctx.arc(w - 12, h / 2, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a6a20'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(w - 12, h / 2, 5, 0, Math.PI * 2); ctx.stroke();
  const flicker = Math.sin(t * 2.1) * 0.03 + 0.15;
  ctx.fillStyle = `rgba(200,240,150,${flicker})`; ctx.fillRect(0, h * 0.1, 4, h * 0.8);
  ctx.fillStyle = 'rgba(255,255,200,0.7)'; ctx.font = 'bold 9px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('🚪', w / 2, h * 0.25);
}
function _drawTin(ctx, f, t, picked) {
  const w = f.w, h = f.h;
  if (picked) {
    ctx.fillStyle = '#888'; GFX.roundRect(ctx, 4, 8, w - 8, h - 10, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; GFX.roundRect(ctx, 6, 10, w - 12, 6, 2); ctx.fill();
    return;
  }
  const tg = ctx.createLinearGradient(0, 0, w, 0);
  tg.addColorStop(0, '#708090'); tg.addColorStop(0.5, '#a0b0c0'); tg.addColorStop(1, '#708090');
  ctx.fillStyle = tg; GFX.roundRect(ctx, 2, 6, w - 4, h - 8, 4); ctx.fill();
  ctx.fillStyle = '#8090a0'; GFX.roundRect(ctx, 0, 4, w, 8, 3); ctx.fill();
  const glow = Math.sin(t * 1.8) * 0.2 + 0.5;
  ctx.fillStyle = `rgba(255,220,80,${glow})`; ctx.font = '10px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('🗝️', w / 2, h / 2 + 4);
}
function _drawHeadphones(ctx, f, t) {
  const cx = f.w / 2;
  ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, f.h * 0.4, 18, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.ellipse(cx - 18, f.h * 0.4, 8, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 18, f.h * 0.4, 8, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath(); ctx.ellipse(cx - 18, f.h * 0.4, 6, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 18, f.h * 0.4, 6, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#444'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, f.h * 0.4); ctx.quadraticCurveTo(cx + 5, f.h * 0.8, cx, f.h); ctx.stroke();
}
function _drawVinylPlayer(ctx, f, t, period) {
  const w = f.w, h = f.h;
  ctx.fillStyle = '#2a1a0a'; GFX.roundRect(ctx, 0, 0, w, h, 4); ctx.fill();
  ctx.fillStyle = '#3a2a1a'; GFX.roundRect(ctx, 2, 2, w - 4, h - 4, 3); ctx.fill();
  const pr = (h - 12) / 2, pc = { x: h / 2, y: h / 2 };
  const angle = period === 'evening' ? t * 2 : 0;
  ctx.save(); ctx.translate(pc.x, pc.y); ctx.rotate(angle);
  ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.arc(0, 0, pr, 0, Math.PI * 2); ctx.fill();
  for (let r = pr * 0.3; r < pr * 0.9; r += 4) { ctx.strokeStyle = `rgba(60,60,60,0.5)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = '#cc3030'; ctx.beginPath(); ctx.arc(0, 0, pr * 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff6040'; ctx.font = `bold ${Math.floor(pr * 0.25)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♪', 0, 0);
  ctx.restore();
  ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
  const armAngle = -0.3 + (period === 'evening' ? Math.sin(t * 0.2) * 0.05 : 0);
  ctx.save(); ctx.translate(w - 12, 8); ctx.rotate(armAngle);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-pr * 0.9, pr * 1.1); ctx.stroke();
  ctx.fillStyle = '#aaa'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ff4444'; ctx.beginPath(); ctx.arc(w - 10, h - 10, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#44aa44'; ctx.beginPath(); ctx.arc(w - 22, h - 10, 4, 0, Math.PI * 2); ctx.fill();
}
function _drawVinylDisc(ctx, f, t, picked) {
  if (picked) return;
  const cx = f.w / 2, cy = f.h / 2, r = Math.min(f.w, f.h) / 2 - 2;
  const rg = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, r);
  rg.addColorStop(0, 'rgba(200,200,255,0.4)'); rg.addColorStop(0.4, 'rgba(150,80,200,0.2)'); rg.addColorStop(0.7, 'rgba(80,180,100,0.15)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  for (let gr = r * 0.25; gr < r * 0.92; gr += 3) { ctx.strokeStyle = `rgba(80,80,90,0.5)`; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(cx, cy, gr, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffcc44'; ctx.beginPath(); ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(200,180,255,0.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2); ctx.stroke();
}
function _drawPaper(ctx, f, t, picked) {
  if (picked) return;
  const w = f.w, h = f.h, flutter = Math.sin(t * 1.5) * 1;
  ctx.save(); ctx.translate(0, flutter);
  ctx.fillStyle = '#f5eddc'; GFX.roundRect(ctx, 0, 0, w, h, 2); ctx.fill();
  ctx.strokeStyle = '#c8b890'; ctx.lineWidth = 1; ctx.strokeRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(80,60,20,0.4)';
  for (let ly = 6; ly < h - 4; ly += 5) { const lw = (w - 8) * (0.6 + Math.sin(ly) * 0.4); ctx.fillRect(4, ly, lw, 1.5); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,200,80,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(w / 2, h / 2, Math.max(w, h) * 0.55, 0, Math.PI * 2); ctx.stroke();
}
function _drawFilm(ctx, f, t, picked) {
  if (picked) return;
  const w = f.w, h = f.h;
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#333'; ctx.fillRect(2, 2, w - 4, h - 4);
  ctx.fillStyle = '#1a1a1a';
  for (let fy = 4; fy < h - 4; fy += 8) { ctx.fillRect(2, fy, 4, 5); ctx.fillRect(w - 6, fy, 4, 5); }
  for (let fx = 7; fx < w - 7; fx += 10) { ctx.fillStyle = `hsl(${fx * 20}, 30%, 25%)`; ctx.fillRect(fx, 4, 8, h - 8); }
  ctx.strokeStyle = 'rgba(255,180,50,0.5)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(w / 2, h / 2, Math.max(w, h) * 0.55, 0, Math.PI * 2); ctx.stroke();
}
function _drawStrap(ctx, f, t, picked) {
  if (picked) return;
  const w = f.w, h = f.h;
  ctx.fillStyle = '#8B4513'; ctx.fillRect(2, Math.floor(h * 0.35), w - 4, Math.floor(h * 0.3));
  ctx.strokeStyle = '#5a2d0c'; ctx.lineWidth = 1; ctx.strokeRect(2, Math.floor(h * 0.35), w - 4, Math.floor(h * 0.3));
  ctx.font = '10px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
  ctx.fillText('🎸', w / 2, h * 0.2);
  const sp = Math.sin(t * 2.5) * 0.5 + 0.5;
  ctx.fillStyle = `rgba(255,220,80,${sp * 0.7})`; ctx.font = '8px serif'; ctx.fillText('✨', w * 0.85, h * 0.15);
}
function _drawCatFig(ctx, f, t, picked) {
  if (picked) return;
  const w = f.w, h = f.h;
  ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐈', w / 2, h / 2);
  const sp = Math.sin(t * 2) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(255,200,80,${sp * 0.5})`; ctx.font = '8px serif'; ctx.fillText('✨', w * 0.8, h * 0.1);
}
function _drawStairs(ctx, f, t) {
  const w = f.w, h = f.h, stepCount = 6;
  for (let i = 0; i < stepCount; i++) {
    const sy = h * (1 - (i + 1) / stepCount), sw = w * (1 - i * 0.05), sh = h / stepCount;
    const shade = Math.floor(100 + i * 15);
    ctx.fillStyle = `rgb(${shade + 40},${shade + 20},${shade})`; ctx.fillRect((w - sw) / 2, sy, sw, sh);
    ctx.fillStyle = `rgb(${shade + 60},${shade + 40},${shade + 20})`; ctx.fillRect((w - sw) / 2, sy, sw, 3);
  }
  ctx.strokeStyle = '#8a5828'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(w - 8, h - 4); ctx.lineTo(w - 12, 4); ctx.stroke();
  ctx.fillStyle = 'rgba(255,220,100,0.8)'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(f.action === 'stairs_up' ? '▲' : '▼', w / 2, h * 0.4);
}
function _drawLights(ctx, f, t, period) {
  const w = f.w, h = f.h;
  ctx.strokeStyle = '#5a4020'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let lx = 0; lx <= w; lx += 5) {
    const sag = Math.sin(lx / w * Math.PI) * 6;
    if (lx === 0) ctx.moveTo(lx, h / 2 + sag); else ctx.lineTo(lx, h / 2 + sag);
  }
  ctx.stroke();
  const bulbCount = Math.floor(w / 20);
  for (let b = 0; b <= bulbCount; b++) {
    const bx = b * (w / bulbCount), by = h / 2 + Math.sin(bx / w * Math.PI) * 6;
    if (period === 'evening' || period === 'night') {
      const bg = ctx.createRadialGradient(bx, by + 8, 0, bx, by + 8, 16);
      bg.addColorStop(0, 'rgba(255,220,80,0.45)'); bg.addColorStop(1, 'rgba(255,180,0,0)');
      ctx.fillStyle = bg; ctx.fillRect(bx - 16, by, 32, 24);
      ctx.fillStyle = '#ffe060';
    } else { ctx.fillStyle = '#c8c8a0'; }
    ctx.beginPath(); ctx.ellipse(bx, by + 8, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#888858'; ctx.fillRect(bx - 2, by - 2, 4, 6);
  }
}
function _drawCobweb(ctx, f, t) {
  const cx = f.x > 400 ? 0 : f.w, cy = 0, threads = 6;
  ctx.strokeStyle = 'rgba(200,200,200,0.2)'; ctx.lineWidth = 0.5;
  for (let i = 0; i < threads; i++) {
    const angle = (i / threads) * Math.PI * 0.6, len = 30 + (i % 3) * 10;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len); ctx.stroke();
  }
  for (let r = 8; r < 35; r += 8) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 0.6); ctx.stroke(); }
}
function _drawRug(ctx, f, t) {
  const w = f.w, h = f.h;
  ctx.fillStyle = '#aa3030'; GFX.roundRect(ctx, 0, 0, w, h, 4); ctx.fill();
  ctx.strokeStyle = '#cc5050'; ctx.lineWidth = 3; ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.strokeStyle = '#dd8888'; ctx.lineWidth = 1;
  for (let rx = 12; rx < w - 12; rx += 16) { ctx.beginPath(); ctx.moveTo(rx, 8); ctx.lineTo(rx, h - 8); ctx.stroke(); }
  ctx.strokeStyle = '#ffaa88'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(w / 2, 8); ctx.lineTo(w - 8, h / 2); ctx.lineTo(w / 2, h - 8); ctx.lineTo(8, h / 2); ctx.closePath(); ctx.stroke();
}
function _drawDustParticles(ctx, t, cw, ch) {
  ctx.save();
  for (let i = 0; i < 14; i++) {
    const bx = (i * 71 + 50) % (cw - 40) + 20, by = 80 + (i * 53) % (ch * 0.45 - 80);
    const x = bx + Math.sin(t * 0.4 + i * 0.8) * 25, y = by + Math.cos(t * 0.3 + i * 1.1) * 12;
    const alpha = 0.08 + Math.sin(t * 0.7 + i) * 0.05;
    ctx.fillStyle = `rgba(200,180,150,${alpha})`; ctx.beginPath(); ctx.arc(x, y, 1.5 + Math.sin(t + i) * 0.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function _drawIndoorNPCs(ctx, floor, camX, t, period, npcs, playerY) {
  for (const [npcId, sched] of Object.entries(INDOOR_NPC_SCHEDULE)) {
    if (sched.floor !== floor) continue;
    const pos = sched[period]; if (!pos) continue;
    const npc = npcs.find(n => n.id === npcId); if (!npc) continue;
    const sx = pos.x - camX, sy = pos.y;
    ctx.save();
    drawHumanNPC(ctx, { id: npcId, x: sx, y: sy, t: t, facing: 1, trust: npc.trust, moving: false, emotion: null });
    const nameW = (npc.name || npcId).length * 6 + 12;
    ctx.fillStyle = 'rgba(20,10,0,0.75)'; GFX.roundRect(ctx, sx - nameW / 2, sy - 52, nameW, 16, 4); ctx.fill();
    ctx.fillStyle = npc.color || '#fff'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(npc.name || npcId, sx, sy - 40);
    ctx.restore();
  }
}
function _drawLighting(ctx, floor, camX, t, period, interior, cw, ch) {
  const tints = { morning: 'rgba(255,220,180,0.05)', day: 'rgba(255,255,220,0.03)', evening: 'rgba(255,180,80,0.12)', night: 'rgba(20,10,40,0.35)' };
  ctx.fillStyle = tints[period] || tints.day; ctx.fillRect(0, 0, cw, ch);
  [{ id:'lamp1', floor:1, x:115, y:210 },{ id:'lamp2', floor:2, x:95, y:225 }].forEach(ld => {
    if (ld.floor !== floor) return;
    if (!interior.lampOn[ld.id]) return;
    const lsx = ld.x - camX, lsy = ld.y;
    const glow = ctx.createRadialGradient(lsx, lsy, 0, lsx, lsy, 100);
    glow.addColorStop(0, 'rgba(255,220,80,0.22)'); glow.addColorStop(0.5, 'rgba(255,180,40,0.10)'); glow.addColorStop(1, 'rgba(255,140,0,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(lsx, lsy, 100, 0, Math.PI * 2); ctx.fill();
  });
  if (period === 'day' || period === 'morning') {
    const winData = floor === 1 ? [{ x:240, y:80, w:120 }, { x:680, y:80, w:80 }] : [{ x:120, y:100, w:80 }, { x:220, y:100, w:80 }];
    for (const wd of winData) {
      const wsx = wd.x - camX;
      const wg = ctx.createLinearGradient(wsx, wd.y, wsx, wd.y + 300);
      wg.addColorStop(0, 'rgba(255,250,200,0.12)'); wg.addColorStop(1, 'rgba(255,250,200,0)');
      ctx.fillStyle = wg; ctx.fillRect(wsx - 20, wd.y, wd.w + 40, 300);
    }
  }
}
function _lightenHex(hex, amt) {
  let n = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}
