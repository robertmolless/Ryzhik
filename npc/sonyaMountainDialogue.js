'use strict';

const SONYA_MTN_STORIES = [
  {
    minTrust: 3,
    lines: [
      { speaker: 'npc',    text: 'Эти ленточки... я привязывала их, чтобы не заблудиться в тумане.',   emotion: 'neutral' },
      { speaker: 'ryzhik', text: 'Мяу?',                                                                emotion: 'curious' },
      { speaker: 'npc',    text: 'В горах туман приходит быстро. Особенно по утрам.',                   emotion: 'neutral' },
      { speaker: 'npc',    text: 'Ленточка на ветке — как маленький маяк. Мой маяк.',                   emotion: 'happy' },
      { speaker: 'npc',    text: 'Теперь и ты знаешь дорогу.',                                          emotion: 'happy' },
    ],
  },
  {
    minTrust: 3,
    lines: [
      { speaker: 'npc',    text: 'Тот гладкий камень я нашла здесь, когда мне было тринадцать.',        emotion: 'nostalgic' },
      { speaker: 'ryzhik', text: 'Мурр...',                                                              emotion: 'happy' },
      { speaker: 'npc',    text: 'Тогда я впервые поднялась сюда одна. Было страшно.',                  emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Но камень в руке был таким тёплым и надёжным.',                       emotion: 'neutral' },
      { speaker: 'npc',    text: 'Пусть лежит здесь. Его место — в горах.',                             emotion: 'happy' },
    ],
  },
  {
    minTrust: 3,
    lines: [
      { speaker: 'npc',    text: 'Ветреный цветок цветёт только утром и вечером.',                      emotion: 'happy' },
      { speaker: 'npc',    text: 'Днём слишком жарко. Ночью — слишком холодно.',                        emotion: 'neutral' },
      { speaker: 'ryzhik', text: 'Мяу!',                                                                emotion: 'curious' },
      { speaker: 'npc',    text: 'В этом и есть горная магия.',                                         emotion: 'happy' },
      { speaker: 'npc',    text: 'Не всё видно сразу. Надо приходить в нужное время.',                  emotion: 'nostalgic' },
    ],
  },
  {
    minTrust: 3,
    lines: [
      { speaker: 'npc',    text: 'Старый колокольчик оставил здесь путник много лет назад.',            emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Говорят, он звонит сам, когда горы довольны.',                        emotion: 'neutral' },
      { speaker: 'ryzhik', text: 'Мяу?',                                                                emotion: 'curious' },
      { speaker: 'npc',    text: 'Не знаю, правда ли это.',                                             emotion: 'neutral' },
      { speaker: 'npc',    text: 'Но когда я здесь одна — мне кажется, я его слышу.',                   emotion: 'nostalgic' },
    ],
  },
  {
    minTrust: 3,
    lines: [
      { speaker: 'npc',    text: 'Раньше горы были только моим местом.',                                emotion: 'nostalgic' },
      { speaker: 'ryzhik', text: 'Мур...',                                                               emotion: 'happy' },
      { speaker: 'npc',    text: 'А теперь — немного и твоим тоже.',                                    emotion: 'happy' },
      { speaker: 'npc',    text: 'Мне нравится это.',                                                   emotion: 'happy' },
      { speaker: 'ryzhik', text: 'Мрр!',                                                                emotion: 'happy' },
    ],
  },
];

const SONYA_MTN_QUEST_LINES = {
  q1: {
    intro:  'Рыжик, я оставила ленточки-метки на трёх горных тропах. Можешь собрать их?',
    hint:   'Ищи красные ленточки: на сосновом склоне, у площадки и на цветочной поляне.',
    thanks: 'Все три! Теперь ты знаешь горные тропы так же, как я. Спасибо!',
  },
  q2: {
    intro:  'На обзорной площадке лежит гладкий камень — круглый, тёплый. Принесёшь?',
    hint:   'Гладкий камень лежит у обзорной площадки, на каменном уступе.',
    thanks: 'Вот он... я забыла его здесь давным-давно. Рада, что он нашёлся.',
  },
  q3: {
    intro:  'Ветреный цветок растёт на цветочной поляне, но цветёт только утром и вечером. Принесёшь?',
    hint:   'Ветреный цветок на цветочной поляне. Он цветёт только утром и вечером!',
    thanks: 'Вот настоящее горное чудо! Как ты успел поймать нужный момент?',
  },
  q4: {
    intro:  'На обзорной площадке есть старый колокольчик. Принесёшь? Говорят, ночью его звук особенный.',
    hint:   'Колокольчик висит у скалы на обзорной площадке.',
    thanks: 'Слышишь? Он звенит. Горы довольны.',
  },
  q5: {
    hint: 'Приходи к Соне вечером с ветреным цветком и старым колокольчиком.',
  },
};

if (typeof NPC_SONYA_STORIES !== 'undefined') NPC_SONYA_STORIES.push(...SONYA_MTN_STORIES);
