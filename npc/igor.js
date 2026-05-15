'use strict';

const NPC_IGOR_DATA = {
  id:'igor', name:'Игорь', emoji:'🤘', color:'#ff4444',
  x:280, y:740, zone:'south_yard', human:true,
  trustLevels:['Незнакомец','Знакомый','Друг','Лучший друг'],
  schedule:{ morning:[280,740], day:[260,720], evening:[290,750], night:[270,760] },
  dialogues:{
    morning:['Ммм... рано ещё.','Рыжик... тихо. Репетиция была до рассвета.','Утро — не моё время, но раз ты тут...','Кофе... потом рок.','Почти проснулся. Дай пять минут.'],
    day:['Рыжик! Рок-мяу! 🤘','Репетирую новый трек в гараже.','Этот риф просто огонь!','Ты чувствуешь ритм, кот?','Медиатор... кажется у пруда потерял.'],
    evening:['Сегодня мини-концерт на крыльце!','Потерял медиатор... вроде у пруда был.','Слышишь этот бит? Сверчки рокеры!','Играю для всех — и для тебя, Рыжик!','Рок — это не музыка, это состояние души.'],
    night:['Ночные прогулки — самое то!','Слышишь? Сверчки играют! Это рок!','Ночью вдохновение приходит само.','Пишу новую песню. Про кота и звёзды.','Ты, Рыжик, мой лучший слушатель!']
  },
  quest:'q_igor', questStage:0, appearance:'🤘 чёрная куртка, цепочка, эмоциональный',
  actions: ['Поговорить', 'Послушать концерт']
};

const NPC_IGOR_QUEST = {
  q1: {
    id: 'q_igor',
    title: 'Пропавший медиатор',
    item: 'pick',
    intro: 'Рыжик! Потерял медиатор... кажется, у пруда уронил во время репетиции. Помоги найти!',
    hint: 'Медиатор должен быть у берега пруда. Поищи там!',
    thanks: 'ДА! ЭТО МОЙ МЕДИАТОР! Ты лучший, Рыжик! 🤘',
  },
  q2: {
    id: 'q_igor2',
    title: 'Мяу-концерт',
    item: null,
    period: 'evening',
    intro: 'Хочу устроить вечерний концерт! Ты будешь солировать? Приходи вечером — и мяукни три раза!',
    hint: 'Концерт только вечером! Приходи вечером.',
    thanks: 'Мяу-концерт состоялся! Лучший кот-вокалист! 🎸',
  },
};

const NPC_IGOR_STORIES = [
  {
    minTrust: 0,
    lines: [
      { speaker: 'npc',    text: 'Однажды я устроил ночной концерт прямо во дворе.', emotion: 'happy' },
      { speaker: 'npc',    text: 'Ну… как концерт. Просто слишком громко включил усилитель.', emotion: 'neutral' },
      { speaker: 'ryzhik', text: 'Мяу?!', emotion: 'surprised' },
      { speaker: 'npc',    text: 'Через пять минут вышел Прохор.', emotion: 'neutral' },
      { speaker: 'npc',    text: 'Очень злой Прохор.', emotion: 'neutral' },
      { speaker: 'npc',    text: 'Я думал, он меня убьёт.', emotion: 'neutral' },
      { speaker: 'ryzhik', text: 'Мрр...', emotion: 'curious' },
      { speaker: 'npc',    text: 'Но знаешь, что самое смешное?', emotion: 'happy' },
      { speaker: 'npc',    text: 'Через полчаса он уже сидел у костра и слушал музыку вместе с нами.', emotion: 'happy' },
    ],
  },
  {
    minTrust: 1,
    lines: [
      { speaker: 'npc',    text: 'У меня был любимый медиатор.', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Чёрный, с маленькой трещиной сбоку.', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Я таскал его вообще везде.', emotion: 'neutral' },
      { speaker: 'npc',    text: 'А потом сидел ночью возле пруда…', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'И уронил его прямо в траву.', emotion: 'sad' },
      { speaker: 'ryzhik', text: 'Мяу…', emotion: 'sad' },
      { speaker: 'npc',    text: 'Полночи искал.', emotion: 'sad' },
      { speaker: 'npc',    text: 'Без шансов.', emotion: 'sad' },
      { speaker: 'npc',    text: 'Наверное, он до сих пор где-то там.', emotion: 'nostalgic' },
    ],
  },
  {
    minTrust: 2,
    lines: [
      { speaker: 'npc',    text: 'Люблю гулять ночью под дождём.', emotion: 'neutral' },
      { speaker: 'ryzhik', text: 'Мрр?..', emotion: 'curious' },
      { speaker: 'npc',    text: 'Серьёзно. Особенно когда людей почти нет.', emotion: 'neutral' },
      { speaker: 'npc',    text: 'Музыка в наушниках, мокрый воздух, фонари…', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'И всё вокруг будто становится другим.', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Тише.', emotion: 'neutral' },
      { speaker: 'npc',    text: 'Иногда мне кажется, что ночью этот дом выглядит намного живее.', emotion: 'happy' },
    ],
  },
];

const NPC_IGOR_BEHAVIOR = {
  waypoints: {
    morning: [[275,745],[250,760]],
    day:     [[260,730],[295,745],[270,765],[285,720]],
    evening: [[235,190],[255,205]],
    night:   [[270,760],[280,745]]
  },
  idle: { morning:'sit', day:'wander', evening:'guitar', night:'wander' }
};
