'use strict';

/* ──────────────────────────────────────────────
   GAME DATA: ITEMS
   ────────────────────────────────────────────── */
const ITEMS = {
  bowl:     { id:'bowl',     name:'Миска',         icon:'🥣', desc:'Любимая миска Рыжика. Из неё так вкусно есть!', rare:false },
  fish:     { id:'fish',     name:'Рыбка',          icon:'🐟', desc:'Свежая рыбка. Рыжик будет в восторге!', rare:false },
  apple:    { id:'apple',    name:'Яблоко',         icon:'🍎', desc:'Сочное яблоко из сада.', rare:false },
  yarn:     { id:'yarn',     name:'Клубок',         icon:'🧶', desc:'Пушистый клубок. Так и хочется поиграть!', rare:false },
  barnKey:  { id:'barnKey',  name:'Ключ от сарая',  icon:'🗝️', desc:'Ржавый ключ. Открывает замок на сарае.', rare:true },
  coin:     { id:'coin',     name:'Старая монета',  icon:'🪙', desc:'Старинная монета. Возможно, что-то стоит.', rare:true },
  pebble:   { id:'pebble',   name:'Камешек',        icon:'🫧', desc:'Блестящий камешек. Рыжик любит блестящее!', rare:false },
  letter:   { id:'letter',   name:'Письмо',         icon:'✉️', desc:'Старое письмо. Что в нём написано?', rare:true },
  seeds:    { id:'seeds',    name:'Семена',         icon:'🌱', desc:'Семена цветов. Можно посадить в огороде.', rare:false },
  ribbon:   { id:'ribbon',   name:'Ленточка',       icon:'🎀', desc:'Красивая ленточка.', rare:false },
  bell:     { id:'bell',     name:'Колокольчик',    icon:'🔔', desc:'Тихо звенит на ветру. Очень уютный звук.', rare:true },
  leaf:     { id:'leaf',     name:'Редкий лист',    icon:'🍃', desc:'Необычный лист с прожилками золота.', rare:true },
  button:   { id:'button',   name:'Пуговица',       icon:'🔘', desc:'Старинная пуговица с красивым узором.', rare:false },
  dryCat:   { id:'dryCat',   name:'Сухой корм',     icon:'🫙', desc:'Любимый корм Рыжика. Восстанавливает сытость.', rare:false },
  acorn:    { id:'acorn',    name:'Звёздный жёлудь', icon:'🌰', desc:'Необычный жёлудь, сверкает в темноте.', rare:true },
  sunBell:  { id:'sunBell',  name:'Солнечный колокольчик', icon:'🔔✨', desc:'Символ тепла и дружбы. Главная тайна теплицы!', rare:true },
  cassette: { id:'cassette', name:'Кассета Лёхи',   icon:'📼', desc:'Старая кассета с любимой музыкой Лёхи. Он точно обрадуется!', rare:false },
  pick:     { id:'pick',     name:'Медиатор Игоря', icon:'🎸', desc:'Медиатор Игоря. Потерял где-то у пруда.', rare:false },
  diary:    { id:'diary',    name:'Странная запись', icon:'📄', desc:'Потерянная страница из блокнота Нэны.', rare:false },
  flashPart:{ id:'flashPart',name:'Деталь фонарика',icon:'🔦', desc:'Деталь для ремонта фонарика Кристины.', rare:false },
  sticker:  { id:'sticker',  name:'Наклейка',       icon:'⭐', desc:'Яркая наклейка Лизы. Надо собрать все!', rare:false },
  photo:    { id:'photo',    name:'Фото со светлячками', icon:'📸', desc:'Волшебная ночная фотография, сделанная Настей.', rare:true },
  moonBell: { id:'moonBell', name:'Колокольчик луны', icon:'🌙', desc:'Мистический колокольчик. Маг говорил о нём.', rare:true },
  trailMap: { id:'trailMap', name:'Карта тропы',    icon:'🗺️', desc:'Карта лесной тропы, нарисованная Соней.', rare:true },
  treasure: { id:'treasure', name:'Коробка сокровищ', icon:'📦', desc:'Коробка с удивительными штуками от Дани.', rare:true },
  toyMouse: { id:'toyMouse', name:'Игрушечная мышь',icon:'🐭', desc:'Мягкая игрушечная мышка. Отличная игрушка!', rare:false },
  feather:  { id:'feather',  name:'Перо',           icon:'🪶', desc:'Красивое перо, найденное во дворе.', rare:false },
  guitarStrap: { id:'guitarStrap', name:'Гитарный ремень',    icon:'🎸', desc:'Кожаный ремень от гитары Лёхи. Нашёл!', rare:false },
  batteries:   { id:'batteries',   name:'Батарейки',           icon:'🔋', desc:'Старые батарейки. Кристине пригодятся!', rare:false },
  compass:     { id:'compass',     name:'Компас',              icon:'🧭', desc:'Старый компас Сони. Найден!', rare:false },
  plank:       { id:'plank',       name:'Доска',               icon:'🪵', desc:'Крепкая деревянная доска для Прохора.', rare:false },
  tools:       { id:'tools',       name:'Инструменты',         icon:'🔨', desc:'Набор инструментов. Прохор ждёт!', rare:false },
  oldPhoto:    { id:'oldPhoto',    name:'Старая фотография',   icon:'📸', desc:'Пожелтевшее фото. Настя ищет такое!', rare:false },
  nickCertificate:  { id:'nickCertificate',  name:'Потерянная справка',   icon:'📄', desc:'Мятая справка Ника, которую сдуло вентилятором.', rare:false },
  milStamp:         { id:'milStamp',         name:'Военная печать',       icon:'🔏', desc:'Круглая печать военкомата. Без неё ни одна бумага не имеет силы.', rare:false },
  sonyaCompass:     { id:'sonyaCompass',     name:'Старый компас Сони',   icon:'🧭', desc:'Немного потёртый компас Сони. Стрелка всё ещё тянется к северу.', rare:false },
  nickMug:          { id:'nickMug',          name:'Кружка Ника',          icon:'☕', desc:'Любимая кружка Ника. Без кофе — никуда.', rare:false },
  nickScarf:        { id:'nickScarf',        name:'Шарф Ника',            icon:'🧣', desc:'Тёплый шарф. Без него в дорогу не выйдет.', rare:false },
  nickBackpack:     { id:'nickBackpack',     name:'Рюкзак Ника',          icon:'🎒', desc:'Потрёпанный рюкзак Ника. Всё своё ношу с собой.', rare:false },
  nickCassette:     { id:'nickCassette',     name:'Кассета Ника',         icon:'📼', desc:'Любимая кассета Ника. Без музыки — никуда.', rare:false },
};
if (typeof INDOOR_ITEMS !== 'undefined') Object.assign(ITEMS, INDOOR_ITEMS);
if (typeof MOUNTAIN_ITEMS !== 'undefined') Object.assign(ITEMS, MOUNTAIN_ITEMS);

/* ──────────────────────────────────────────────
   GAME DATA: QUESTS
   ────────────────────────────────────────────── */
const QUESTS = [
  { id:'q01', title:'Найти миску Рыжика', icon:'🥣', desc:'Рыжик потерял свою миску после зимы. Нужно найти её во дворе!', steps:['Осмотри двор','Найди миску у крыльца'], reward:{item:'bowl',xp:10}, npc:null, unlock:true },
  { id:'q02', title:'Ключ от сарая', icon:'🗝️', desc:'В сарае что-то интересное, но он заперт. Ключ, наверное, в доме — поищи в кухонном шкафчике!', steps:['Найди ключ от сарая (в доме)','Открой сарай с ключом'], reward:{xp:20,zone:'barn'}, npc:null, unlock:true },
  { id:'q03', title:'Познакомиться с соседями', icon:'👥', desc:'Поговори с жителями двора и узнай, кто тут живёт.', steps:['Поговори с 3 персонажами'], reward:{xp:15}, npc:null, unlock:true },

  { id:'q_lyokha', title:'Старая кассета', icon:'📼', desc:'Лёха потерял любимую кассету в сарае. Войди в сарай, найди кассету и верни её Лёхе!', steps:['Поговори с Лёхой о кассете','Верни кассету Лёхе'], reward:{xp:20,trust:'lyokha'}, npc:'lyokha', unlock:true },
  { id:'q_igor', title:'Пропавший медиатор', icon:'🎸', desc:'Игорь потерял свой любимый медиатор где-то у пруда. Нужно найти!', steps:['Поговори с Игорем','Верни медиатор Игорю'], reward:{xp:18,trust:'igor'}, npc:'igor', unlock:true },
  { id:'q_nastya', title:'Фото со светлячками', icon:'📸', desc:'Настя мечтает сделать ночную фотографию со светлячками.', steps:['Поговори с Настей','Дождись ночи','Найди место со светлячками','Помоги сделать фото'], reward:{item:'photo',xp:22,trust:'nastya'}, npc:'nastya', unlock:false },
  { id:'q_liza', title:'Потерянные наклейки', icon:'⭐', desc:'Лиза потеряла наклейки по всему двору. Собери все 5!', steps:['Поговори с Лизой','Собери 5 наклеек по двору','Верни наклейки Лизе'], reward:{xp:18,trust:'liza'}, npc:'liza', unlock:false },
  { id:'q_mag', title:'Колокольчик луны', icon:'🌙', desc:'Маг рассказывает о мистическом колокольчике луны. Найди его ночью!', steps:['Встреть Мага ночью','Выслушай легенду','Найди колокольчик на поляне'], reward:{xp:28,trust:'mag'}, npc:'mag', unlock:false },
  { id:'q_sonya', title:'Лесная тропа', icon:'🌲', desc:'Соня знает тайную тропу через лес. Пройди её вместе с ней.', steps:['Поговори с Соней','Иди вместе по лесной тропе','Найди выход на поляну'], reward:{item:'trailMap',xp:22,trust:'sonya',zone:'forest_path'}, npc:'sonya', unlock:false },
  { id:'q_nena', title:'Странные записи', icon:'📓', desc:'Нэна нашла странные записи о доме, но потеряла страницу. Помоги найти!', steps:['Поговори с Нэной','Верни страницу Нэне'], reward:{xp:20,trust:'nena'}, npc:'nena', unlock:false },
  { id:'q_kristina', title:'Сломанный фонарик', icon:'🔦', desc:'Кристина пытается починить фонарик, но не хватает детали.', steps:['Поговори с Кристиной','Найди деталь фонарика','Помоги починить'], reward:{xp:22,trust:'kristina',upgrade:'corner'}, npc:'kristina', unlock:false },
  { id:'q_danya', title:'Коробка сокровищ', icon:'📦', desc:'Даня хочет собрать особую коробку сокровищ. Помоги найти компоненты!', steps:['Поговори с Даней','Найди 3 необычных предмета','Принеси Дане'], reward:{item:'treasure',xp:22,trust:'danya'}, npc:'danya', unlock:false },

  { id:'q_explore', title:'Исследуй окрестности', icon:'🔍', desc:'Рыжик чувствует — где-то есть тайный проход. Найди его!', steps:['Исследуй забор','Найди тайную тропу'], reward:{xp:20,zone:'secret_path'}, npc:null, unlock:false },
  { id:'q_attic', title:'Исследовать чердак', icon:'🪜', desc:'На чердаке давно никто не бывал. Что там?', steps:['Найди лестницу','Поднимись на чердак','Осмотри чердак'], reward:{item:'letter',xp:25,zone:'attic'}, npc:null, unlock:false },
  { id:'q_cellar', title:'Открыть подвал', icon:'🚪', desc:'Подвал закрыт. Что там скрывается?', steps:['Найди ключ от подвала','Открой подвал','Исследуй'], reward:{xp:25,item:'coin',zone:'cellar'}, npc:null, unlock:false },
  { id:'q_fish', title:'Рыбалка у пруда', icon:'🎣', desc:'У пруда можно поймать вкусную рыбку!', steps:['Иди к пруду','Порыбачь (мини-игра)','Поймай рыбку'], reward:{item:'fish',xp:15}, npc:null, unlock:false },
  { id:'q_shiny', title:'Коллекция блестяшек', icon:'💎', desc:'Рыжик любит блестящие вещи. Собери 5 штук!', steps:['Найди 5 блестящих предметов'], reward:{xp:20,item:'ribbon'}, npc:null, unlock:false },
  { id:'q_firefly', title:'Найти светлячков', icon:'✨', desc:'Ночью в саду появились светлячки!', steps:['Дождись ночи','Выйди в сад','Поймай светлячка (мини-игра)'], reward:{xp:20,item:'acorn'}, npc:null, unlock:false },
  { id:'q_concert', title:'Вечерний мяу-концерт', icon:'🎵', desc:'Рыжик хочет устроить концерт! Позови Лёху и Игоря.', steps:['Пригласи Лёху и Игоря','Выйди на крыльцо вечером','Мяукни 3 раза'], reward:{xp:25,event:'concert'}, npc:null, unlock:false },
  { id:'q_notes', title:'Записки старого хозяина', icon:'📝', desc:'В доме спрятаны старые письма прежнего хозяина. Найди их!', steps:['Найди письмо во дворе','Прочитай все записки'], reward:{xp:35}, npc:null, unlock:false },
  { id:'q_greenhouse', title:'Открыть теплицу', icon:'🌿', desc:'Заброшенная теплица закрыта уже много лет.', steps:['Найди ключ от теплицы','Расчисти вход','Войди в теплицу'], reward:{xp:40,zone:'greenhouse'}, npc:'mag', unlock:false },
  { id:'q_party', title:'Праздник во дворе', icon:'🎉', desc:'Пора устроить праздник! Укрась двор с Лизой и собери всех.', steps:['Помоги Лизе украсить двор','Позови всех','Устрой праздник'], reward:{xp:50,event:'party'}, npc:null, unlock:false },
  { id:'q_secret', title:'Тайна старой теплицы', icon:'🔮', desc:'Что скрывает заброшенная теплица? Разгадай тайну!', steps:['Войди в теплицу','Найди Солнечный колокольчик','Узнай историю дома'], reward:{item:'sunBell',xp:60}, npc:null, unlock:false },
  { id:'q_finale', title:'Финал: Вернуть уют дому', icon:'🏡', desc:'Рыжик почти всё сделал! Собери всех и верни дому уют.', steps:['Завершить основные квесты','Собрать всех у дома вечером','Позвонить в Солнечный колокольчик'], reward:{xp:100,event:'finale'}, npc:null, unlock:false },

  { id:'q_lyokha2',   title:'Вечерняя песня',       icon:'🎸', desc:'Лёха хочет сыграть вечером — найди гитарный ремень.', steps:['Найди гитарный ремень на втором этаже','Отдай ремень Лёхе'],       reward:{xp:25,event:'concert'},  npc:'lyokha', unlock:false },
  { id:'q_igor2',     title:'Мяу-концерт',           icon:'🎵', desc:'Игорь зовёт на вечерний концерт!',                   steps:['Приди к Игорю вечером','Поддержи концерт мяуканьем'],             reward:{xp:25,trust:'igor'},     npc:'igor',   unlock:false },
  { id:'q_nastya2',   title:'Старые фотографии',     icon:'📸', desc:'Настя ищет старую плёнку в доме.',                   steps:['Найди старую плёнку на чердаке','Отдай Насте'],                   reward:{xp:20,trust:'nastya'},   npc:'nastya', unlock:false },
  { id:'q_liza2',     title:'Украшение уголка',       icon:'🐈', desc:'Лиза хочет украсить кошачий уголок фигуркой.',       steps:['Найди фигурку кота в доме','Отдай Лизе'],                         reward:{xp:22,upgrade:'corner'}, npc:'liza',   unlock:false },
  { id:'q_mag2',      title:'Загадка теплицы',        icon:'🔮', desc:'Маг ищет записку о теплице.',                         steps:['Найди записку на чердаке','Отдай Магу'],                          reward:{xp:35,zone:'greenhouse'},npc:'mag',    unlock:false },
  { id:'q_sonya2',    title:'Походный компас',        icon:'🧭', desc:'Соня потеряла компас.',                               steps:['Найди компас у забора','Отдай Соне'],                              reward:{xp:25,item:'trailMap'},  npc:'sonya',  unlock:false },
  { id:'q_sonya3',    title:'Потерянный компас',      icon:'🧭', desc:'Соня потеряла свой старый компас возле лесной тропы.',steps:['Найди старый компас у лесной тропы','Верни компас Соне'],           reward:{xp:30,trust:'sonya'},    npc:'sonya',  unlock:false },
  { id:'q_nena2',     title:'Карта дома',             icon:'🗺️', desc:'Нэна хочет карту дома.',                              steps:['Найди карту дома','Отдай Нэне'],                                   reward:{xp:25,item:'houseMap'},  npc:'nena',   unlock:false },
  { id:'q_kristina2', title:'Починить лампу',         icon:'💡', desc:'Кристина чинит лампу в гостиной.',                    steps:['Найди батарейки','Отдай Кристине'],                               reward:{xp:25,trust:'kristina'}, npc:'kristina',unlock:false },
  { id:'q_danya2',    title:'Игрушка для Рыжика',     icon:'🐭', desc:'Даня мастерит игрушку из старого жетона.',            steps:['Найди старый жетон в доме','Отдай Дане'],                         reward:{xp:20,item:'toyMouse'},  npc:'danya',  unlock:false },
  { id:'q_prokhor',   title:'Старый забор',           icon:'🔨', desc:'Прохор просит инструменты из сарая.',                 steps:['Найди инструменты в сарае','Отдай Прохору'],                      reward:{xp:20},                  npc:'prokhor',unlock:true  },
  { id:'q_prokhor2',  title:'Тяжёлая доска',          icon:'🪵', desc:'Прохор просит доску для починки забора.',             steps:['Найди доску в сарае','Отдай Прохору'],                            reward:{xp:25,zone:'secret_path'},npc:'prokhor',unlock:false },
  { id:'q_nick1',  title:'Потерянная справка',     icon:'📄', desc:'Ник потерял справку в военкомате.',                   steps:['Найди справку у вентилятора','Отдай Нику'],                       reward:{xp:20},                  npc:'nick',   unlock:true  },
  { id:'q_nick2',  title:'Очень важная печать',    icon:'🔏', desc:'Военная печать закатилась за коробки у входа в военкомат.',    steps:['Найди военную печать у входа в военкомат','Отдай Нику'],          reward:{xp:25},                  npc:'nick',   unlock:false },
  { id:'q_nick3',  title:'Побег к костру',         icon:'🔥', desc:'Ник собирает вещи, чтобы наконец выбраться из военкомата.',  steps:['Найди кружку Ника','Найди шарф Ника','Найди рюкзак','Найди кассету','Отдай всё Нику'], reward:{xp:40,event:'nick_free'},npc:'nick',   unlock:false },
];
if (typeof INDOOR_QUESTS !== 'undefined') QUESTS.push(...INDOOR_QUESTS);
if (typeof MOUNTAIN_QUESTS !== 'undefined') QUESTS.push(...MOUNTAIN_QUESTS);

/* ──────────────────────────────────────────────
   GAME DATA: ACHIEVEMENTS
   ────────────────────────────────────────────── */
const ACHIEVEMENTS = [
  { id:'ach01', name:'Первый мяу',           icon:'😺', desc:'Мяукни впервые!', secret:false },
  { id:'ach02', name:'Первый друг',          icon:'🤝', desc:'Подружись с первым персонажем.', secret:false },
  { id:'ach03', name:'Рыбак',                icon:'🎣', desc:'Поймай рыбку у пруда.', secret:false },
  { id:'ach04', name:'Исследователь',        icon:'🔍', desc:'Открой 5 зон карты.', secret:false },
  { id:'ach05', name:'Друг Лёхи',           icon:'🎸', desc:'Достигни макс. доверия с Лёхой.', secret:false },
  { id:'ach06', name:'Рок-кот',             icon:'🤘', desc:'Подружись с Игорем.', secret:false },
  { id:'ach07', name:'Тайный кот',           icon:'🕵️', desc:'Найди тайную кошачью тропу.', secret:true },
  { id:'ach08', name:'Коллекционер',         icon:'💎', desc:'Собери 10 предметов в инвентарь.', secret:false },
  { id:'ach09', name:'Герой двора',          icon:'🏅', desc:'Выполни 10 квестов.', secret:false },
  { id:'ach10', name:'Ночной охотник',       icon:'🌙', desc:'Активно играй ночью.', secret:false },
  { id:'ach11', name:'Солнечный кот',        icon:'☀️', desc:'Найди Солнечный колокольчик.', secret:false },
  { id:'ach12', name:'Мастер прыжков',       icon:'🤸', desc:'Прыгни 50 раз.', secret:false },
  { id:'ach13', name:'Знаток сада',          icon:'🌸', desc:'Исследуй весь сад.', secret:false },
  { id:'ach14', name:'Хранитель теплицы',    icon:'🌿', desc:'Открой заброшенную теплицу.', secret:false },
  { id:'ach15', name:'Лучший мурлыка',       icon:'💕', desc:'Используй мурчание 20 раз.', secret:false },
  { id:'ach16', name:'Полный инвентарь',     icon:'🎒', desc:'Набери 15 предметов.', secret:false },
  { id:'ach17', name:'Все друзья',           icon:'👥', desc:'Подружись со всеми жителями.', secret:false },
  { id:'ach18', name:'Все зоны открыты',     icon:'🗺️', desc:'Открой все зоны карты.', secret:false },
  { id:'ach19', name:'Все квесты выполнены', icon:'✅', desc:'Пройди все квесты!', secret:false },
  { id:'ach20', name:'Настоящий хозяин двора',icon:'👑', desc:'Достигни максимальной кошачьей славы!', secret:false },
  { id:'ach_mtn', name:'Друг гор', icon:'⛰️', desc:'Пройди все квесты Сони в горах.', secret:false },
];

/* ──────────────────────────────────────────────
   GAME DATA: UPGRADES
   ────────────────────────────────────────────── */
const UPGRADES = [
  { id:'pillow',  name:'Подушка',       icon:'🛏️', cost:5,  desc:'Мягкая подушка для отдыха. +10 энергии.' },
  { id:'bowl_up', name:'Новая миска',   icon:'🥣', cost:3,  desc:'Красивая миска. +5 сытости каждый день.' },
  { id:'awning',  name:'Навес',         icon:'⛱️', cost:8,  desc:'Защищает от дождя.' },
  { id:'carpet',  name:'Коврик',        icon:'🪡', cost:4,  desc:'Уютный коврик.' },
  { id:'toy',     name:'Игрушка',       icon:'🐭', cost:3,  desc:'Весёлая игрушка. +5 настроения.' },
  { id:'lamp',    name:'Фонарик',       icon:'🔦', cost:6,  desc:'Освещает ночью.' },
  { id:'flowers', name:'Цветы',         icon:'🌸', cost:5,  desc:'Красивые цветы рядом. +5 настроения.' },
  { id:'sign',    name:'Табличка',      icon:'🪧', cost:2,  desc:'Табличка «Кошачий уголок».' },
  { id:'box',     name:'Коробка',       icon:'📦', cost:3,  desc:'Любимая коробка! +5 настроения.' },
  { id:'house',   name:'Мини-домик',    icon:'🏠', cost:15, desc:'Настоящий домик для Рыжика! Максимальный уют.' },
];

/* ──────────────────────────────────────────────
   WORLD MAP ZONES
   ────────────────────────────────────────────── */
const ZONES = [
  { id:'yard',        name:'Двор',               color:'#4a8c2a', x:0,    y:0,    w:500,  h:500,  icon:'🏡', unlocked:true  },
  { id:'porch',       name:'Крыльцо',             color:'#8b6914', x:200,  y:-100, w:200,  h:200,  icon:'🚪', unlocked:true  },
  { id:'garden',      name:'Огород и сад',        color:'#2d6e15', x:500,  y:0,    w:400,  h:500,  icon:'🌿', unlocked:true  },
  { id:'barn',        name:'Сарай',               color:'#6b4226', x:-200, y:100,  w:200,  h:250,  icon:'🏚️', unlocked:false },
  { id:'well',        name:'Колодец',             color:'#444488', x:-200, y:-100, w:150,  h:150,  icon:'🪣', unlocked:true  },
  { id:'fence',       name:'Забор',               color:'#5c4a32', x:0,    y:500,  w:500,  h:100,  icon:'🪵', unlocked:true  },
  { id:'pond',        name:'Пруд',                color:'#2244aa', x:600,  y:400,  w:300,  h:250,  icon:'🏊', unlocked:false },
  { id:'forest_path', name:'Лесная тропинка',     color:'#1a4a0a', x:900,  y:0,    w:250,  h:600,  icon:'🌲', unlocked:false },
  { id:'mountains',   name:'Горная тропа',        color:'#556688', x:730,  y:-430, w:200,  h:180,  icon:'⛰️', unlocked:false },
  { id:'clearing',    name:'Поляна',              color:'#3a7a1a', x:900,  y:-200, w:300,  h:300,  icon:'🌼', unlocked:false },
  { id:'greenhouse',  name:'Заброшенная теплица', color:'#2a5a2a', x:1100, y:200,  w:250,  h:250,  icon:'🌿', unlocked:false },
  { id:'attic',       name:'Чердак',              color:'#554433', x:200,  y:-300, w:200,  h:150,  icon:'🪜', unlocked:false },
  { id:'cellar',      name:'Подвал',              color:'#332211', x:200,  y:400,  w:200,  h:150,  icon:'🕯️', unlocked:false },
  { id:'roof',        name:'Крыша',               color:'#883322', x:100,  y:-400, w:300,  h:100,  icon:'🏠', unlocked:false },
  { id:'secret_path', name:'Тайная кошачья тропа',color:'#1a3a1a', x:950,  y:600,  w:150,  h:200,  icon:'🐱', unlocked:false },
];

/* ──────────────────────────────────────────────
   RANDOM EVENTS
   ────────────────────────────────────────────── */
const RANDOM_EVENTS = [
  { id:'guests',    text:'Приехали гости!',                icon:'🚗', effect:{ mood:10 } },
  { id:'rain',      text:'Начинается дождь',               icon:'🌧️', effect:{ weather:'rain' } },
  { id:'box',       text:'Появилась новая коробка!',        icon:'📦', effect:{ mood:5 } },
  { id:'guitar',    text:'Лёха играет на гитаре во дворе!', icon:'🎸', effect:{ mood:10 } },
  { id:'concert',   text:'Игорь устроил мини-концерт!',    icon:'🤘', effect:{ mood:15 } },
  { id:'photo',     text:'Настя сфотографировала закат!',   icon:'📸', effect:{ mood:5 } },
  { id:'party',     text:'Лиза украсила двор наклейками!',  icon:'💕', effect:{ mood:10 } },
  { id:'barn_noise',text:'В сарае что-то шуршит...',       icon:'🏚️', effect:{} },
  { id:'fireflies', text:'Ночью появились светлячки!',     icon:'✨', effect:{ mood:15 } },
  { id:'prokhor',   text:'Прохор починил часть забора!',    icon:'💪', effect:{ mood:5 } },
  { id:'danya_toy', text:'Даня смастерил новую штуку!',    icon:'🕶️', effect:{ mood:5 } },
];
