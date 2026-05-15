'use strict';

const NPC_PROKHOR_DATA = {
  id:'prokhor', name:'Прохор', emoji:'💪', color:'#cc8844',
  x:420, y:880, zone:'south_yard', human:true,
  trustLevels:['Незнакомец','Знакомый','Друг','Уважаемый'],
  schedule:{ morning:[420,880], day:[430,870], evening:[410,890], night:null },
  dialogues:{
    morning:['Рыжик. Иди сюда. Буду чинить забор.','Доброе утро, кот. Работы много.','Кофе? Нет. Работа? Да.','Держись подальше от инструментов.','Утро — время делать дела, не болтать.'],
    day:['Хм. Неплохой кот.','Помоги — стой рядом, будешь надзирать.','Этот забор сам себя не починит.','Ты хоть молоток держал, кот?','Молчишь — уважаю. Я тоже не болтливый.'],
    evening:['Устал. Но забор почти готов.','Хороший был день, кот.','Работа сделана — могу отдохнуть.','Твой уголок тоже смотрится неплохо.','Завтра доделаю. Сейчас — тишина.'],
    night:null
  },
  quest:'q_prokhor', questStage:0, appearance:'💪 большой, татуированные руки, строит и чинит',
  actions: ['Поговорить', 'Наблюдать за работой']
};

const NPC_PROKHOR_QUEST = {
  q1: {
    id: 'q_prokhor',
    title: 'Старый забор',
    item: 'tools',
    intro: 'Хм. Кот. Мне инструменты нужны. В сарае должны быть. Принесёшь?',
    hint: 'Инструменты в сарае. Войди в сарай и поищи.',
    thanks: 'Молодец. Теперь займёмся работой.',
  },
  q2: {
    id: 'q_prokhor2',
    title: 'Тяжёлая доска',
    item: 'plank',
    intro: 'Ещё нужна доска. В сарае или возле него должна быть. Принеси.',
    hint: 'Доска в сарае или рядом с ним. Поищи.',
    thanks: 'Хорошая доска. Теперь здесь станет лучше. Спасибо, кот.',
  },
};

const NPC_PROKHOR_STORIES = [
  {
    minTrust: 0,
    lines: [
      { speaker: 'npc',    text: 'Этот забор почти развалился после зимы.', emotion: 'neutral' },
      { speaker: 'npc',    text: 'Кто-то же должен был его чинить.', emotion: 'neutral' },
    ],
  },
  {
    minTrust: 1,
    lines: [
      { speaker: 'npc',    text: 'Барон сначала терпеть меня не мог.', emotion: 'neutral' },
      { speaker: 'npc',    text: 'А потом привык.', emotion: 'neutral' },
      { speaker: 'ryzhik', text: 'Мрр.', emotion: 'neutral' },
    ],
  },
  {
    minTrust: 2,
    lines: [
      { speaker: 'npc',    text: 'Люблю сидеть вечером возле костра.', emotion: 'happy' },
      { speaker: 'npc',    text: 'Когда всё вокруг становится тихим.', emotion: 'happy' },
      { speaker: 'npc',    text: 'В такие моменты дом будто снова оживает.', emotion: 'happy' },
    ],
  },
];

const NPC_PROKHOR_BEHAVIOR = {
  waypoints: {
    morning: [[415,885],[450,875]],
    day:     [[425,875],[405,895],[455,880],[420,905],[440,870]],
    evening: [[418,888],[442,882]]
  },
  idle: { morning:'work', day:'work', evening:'sit' }
};
