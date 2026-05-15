'use strict';

const NPC_LIZA_DATA = {
  id:'liza', name:'Лиза', emoji:'💕', color:'#ff66ff',
  x:540, y:790, zone:'south_yard', human:true,
  trustLevels:['Незнакомец','Знакомый','Друг','Лучший друг'],
  schedule:{ morning:[540,790], day:[520,800], evening:[555,780], night:null },
  dialogues:{
    morning:['Утро! Пора украшать двор!','Рыжик, принёс наклейки? 😸','Я уже придумала новый дизайн двора!','Цветы, блёстки, гирлянды — будет класс!','Доброе утро, пушистый!'],
    day:['Рыжик! Смотри что я принесла!','Двор нужно украсить!','Потеряла свои наклейки везде...','Помоги мне найти наклейки? Плиз!','Ты самый лучший кот на свете!'],
    evening:['Вечеринка на дворе! Ты идёшь?','Твой уголок надо наклейками обклеить!','Зажгли гирлянду — красиво, правда?','Рыжик, ты украшение этого двора!','Этот вечер просто идеальный!'],
    night:null
  },
  quest:'q_liza', questStage:0, appearance:'💕 розовые волосы, хаотичная энергия',
  actions: ['Поговорить', 'Помочь украсить двор']
};

const NPC_LIZA_QUEST = {
  q1: {
    id: 'q_liza',
    title: 'Потерянные наклейки',
    item: 'sticker',
    itemCount: 5,
    intro: 'Рыжик, я рассыпала наклейки по всему двору! Помоги собрать хотя бы 5?',
    hint: 'Наклейки везде по двору! Ищи — найдёшь 5 штук.',
    thanks: 'УРА! Все нашлись! Ты лучший кот на свете! 💕',
  },
  q2: {
    id: 'q_liza2',
    title: 'Украшение уголка',
    item: 'catFig',
    intro: 'Для кошачьего уголка нужна фигурка кота! Поищи в доме — там должна быть!',
    hint: 'Фигурка кота должна быть где-то в доме. Поищи!',
    thanks: 'Идеально! Уголок Рыжика теперь самый красивый! 🐈',
  },
};

const NPC_LIZA_STORIES = [
  {
    minTrust: 0,
    lines: [
      { speaker: 'npc',    text: 'Я просто обожаю украшать вещи.', emotion: 'happy' },
      { speaker: 'npc',    text: 'Коробки, стены, тетрадки… вообще всё.', emotion: 'happy' },
      { speaker: 'npc',    text: 'Иногда кажется, что мир слишком серый.', emotion: 'neutral' },
      { speaker: 'npc',    text: 'И ему нужно чуть больше цвета.', emotion: 'happy' },
      { speaker: 'ryzhik', text: 'Мяу!', emotion: 'happy' },
    ],
  },
  {
    minTrust: 1,
    lines: [
      { speaker: 'npc',    text: 'Первую коробку для тебя я сделала вообще из старой упаковки.', emotion: 'happy' },
      { speaker: 'npc',    text: 'Но ты почему-то сразу её полюбил.', emotion: 'happy' },
      { speaker: 'ryzhik', text: 'Мррр.', emotion: 'happy' },
      { speaker: 'npc',    text: 'Серьёзно, у тебя талант находить самые удобные коробки.', emotion: 'happy' },
    ],
  },
  {
    minTrust: 2,
    lines: [
      { speaker: 'npc',    text: 'Хочу однажды устроить здесь маленький фестиваль.', emotion: 'happy' },
      { speaker: 'npc',    text: 'Гирлянды, музыка, еда, костёр…', emotion: 'happy' },
      { speaker: 'npc',    text: 'Чтобы двор снова стал шумным и живым.', emotion: 'happy' },
      { speaker: 'ryzhik', text: 'Мяу!', emotion: 'happy' },
    ],
  },
];

const NPC_LIZA_BEHAVIOR = {
  waypoints: {
    morning: [[535,795],[565,800]],
    day:     [[515,805],[550,780],[535,825],[520,790],[560,800]],
    evening: [[545,785],[525,795]]
  },
  idle: { morning:'wave', day:'wave', evening:'wave' }
};
