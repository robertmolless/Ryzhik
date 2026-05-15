'use strict';

const NPC_LYOKHA_DATA = {
  id:'lyokha', name:'Лёха', emoji:'👱', color:'#aaddff',
  x:340, y:310, zone:'porch', human:true,
  trustLevels:['Незнакомец','Знакомый','Друг','Лучший друг'],
  schedule:{ morning:[350,300], day:[360,290], evening:[340,310], night:[330,320] },
  dialogues:{
    morning:['Доброе утро, Рыжик! Покормить тебя?','Тихое утро... люблю такие.','Кофе есть, всё хорошо.','Хорошо, когда утром так тихо.','Рыжик, ты уже исследовал двор?'],
    day:['Привет, рыжий! Как дела?','Тут тихо — мне нравится.','Знаешь, этот дом хранит много тайн...','Надо бы прибраться, но лень.','Слушаю музыку, мешать не буду.'],
    evening:['Эй, Рыжик. Посиди рядом.','Закат красивый сегодня...','Сыграю что-нибудь тихое на гитаре.','Вечером всегда спокойнее. Люблю это.','Поставил старую пластинку. Слышишь?'],
    night:['Не спишь? Я тоже.','Звёзды сегодня яркие.','Потерял кассету... не видел?','Ночью этот двор выглядит иначе.','Рыжик, ты хороший кот. Правда.']
  },
  quest:'q_lyokha', questStage:0, appearance:'👱 блондин, oversized кофта, спокойный взгляд',
  actions: ['Поговорить', 'Покормить Рыжика', 'Послушать гитару']
};

const NPC_LYOKHA_QUEST = {
  q1: {
    id: 'q_lyokha',
    title: 'Старая кассета',
    item: 'cassette',
    intro: 'Рыжик, кажется, моя старая кассета осталась в сарае. Можешь поискать? Сарай закрыт, но ключ где-то в доме...',
    hint: 'Попробуй поискать в сарае. Войди туда — кассета должна быть там.',
    thanks: 'Это она! Спасибо, Рыжик! Я так переживал!',
  },
  q2: {
    id: 'q_lyokha2',
    title: 'Вечерняя песня',
    item: 'guitarStrap',
    intro: 'Хочу сыграть вечером у крыльца, но потерял ремень от гитары. Кажется, он на втором этаже в моей комнате...',
    hint: 'Поищи ремень на втором этаже, в моей комнате.',
    thanks: 'Ремень! Теперь сыграю сегодня вечером. Спасибо, рыжий!',
  },
};

const NPC_LYOKHA_STORIES = [
  {
    minTrust: 0,
    lines: [
      { speaker: 'npc',    text: 'Помнишь, как мы впервые встретились?.. Хотя ты тогда был совсем маленьким.', emotion: 'nostalgic' },
      { speaker: 'ryzhik', text: 'Мяу?..', emotion: 'curious' },
      { speaker: 'npc',    text: 'Шёл сильный дождь. Я сидел на крыльце, слушал как вода стучит по крыше…', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'И вдруг смотрю — возле ступенек сидит мокрый рыжий комок.', emotion: 'nostalgic' },
      { speaker: 'ryzhik', text: 'Мрр...', emotion: 'sad' },
      { speaker: 'npc',    text: 'Ты тогда дрожал так, будто весь мир был холодным.', emotion: 'sad' },
      { speaker: 'npc',    text: 'Я вынес тебе старую миску и немного еды.', emotion: 'neutral' },
      { speaker: 'npc',    text: 'А утром ты уже спал возле двери дома.', emotion: 'happy' },
      { speaker: 'ryzhik', text: 'Мур-мур.', emotion: 'happy' },
      { speaker: 'npc',    text: 'С тех пор мне кажется, будто этот дом выбрал тебя сам.', emotion: 'happy' },
    ],
  },
  {
    minTrust: 1,
    lines: [
      { speaker: 'npc',    text: 'Раньше летом здесь почти каждый вечер собирались люди.', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Мы сидели прямо на крыльце до глубокой ночи.', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Игорь вечно играл слишком громко…', emotion: 'neutral' },
      { speaker: 'npc',    text: 'Лиза таскала гирлянды и какие-то странные наклейки.', emotion: 'neutral' },
      { speaker: 'ryzhik', text: 'Мяу!', emotion: 'happy' },
      { speaker: 'npc',    text: 'А ты бегал между всеми и выпрашивал еду.', emotion: 'happy' },
      { speaker: 'npc',    text: 'Иногда возле забора появлялись светлячки.', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Музыка, тёплый воздух, костёр…', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Кажется, тогда этот двор был по-настоящему живым.', emotion: 'sad' },
    ],
  },
  {
    minTrust: 2,
    lines: [
      { speaker: 'npc',    text: 'Знаешь… мне всегда нравилось смотреть на закат возле дома.', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Особенно летом.', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Когда солнце медленно уходит за деревья…', emotion: 'neutral' },
      { speaker: 'npc',    text: 'И становится тихо-тихо.', emotion: 'neutral' },
      { speaker: 'ryzhik', text: 'Мррр...', emotion: 'happy' },
      { speaker: 'npc',    text: 'В такие моменты кажется, будто время ненадолго останавливается.', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Только ветер, запах травы и скрип старого крыльца.', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Наверное, поэтому я до сих пор люблю это место.', emotion: 'happy' },
    ],
  },
];

const NPC_LYOKHA_BEHAVIOR = {
  waypoints: {
    morning: [[290,725],[325,740]],
    day:     [[305,730],[275,750],[330,715],[310,760]],
    evening: [[240,170],[225,190],[255,185]],
    night:   [[280,165],[295,175]]
  },
  idle: { morning:'sit', day:'wander', evening:'guitar', night:'wander' }
};
