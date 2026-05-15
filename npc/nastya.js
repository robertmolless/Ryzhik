'use strict';

const NPC_NASTYA_DATA = {
  id:'nastya', name:'Настя', emoji:'🌸', color:'#ff88aa',
  x:870, y:185, zone:'garden', human:true,
  trustLevels:['Незнакомец','Знакомый','Друг','Лучший друг'],
  schedule:{ morning:[870,185], day:[890,195], evening:[855,180], night:null },
  dialogues:{
    morning:['Доброе утро! Рыжик, ты такой фотогеничный!','Снимаю утреннюю росу. Красота!','Утренний свет — лучший для фото!','Смотри, цветок распустился!','Тихое утро — мой любимый момент.'],
    day:['Смотри какие цветы! Сфоткаю!','Делаю альбом воспоминаний об этом месте.','Хочу сфоткать тебя рядом с цветами!','Этот сад такой красивый — снимаю всё!','Рыжик, замри! Идеальный кадр!'],
    evening:['Вечерний свет идеален для фото...','Мечтаю поймать светлячков на камеру.','Закат в саду — просто сказка.','Сделала пятьсот фото сегодня, ха-ха.','Ты фотогеничный кот, Рыжик, серьёзно.'],
    night:null
  },
  quest:'q_nastya', questStage:0, appearance:'🌸 фотограф, зелёные глаза, тёплая кофта',
  actions: ['Позировать для фото', 'Поговорить']
};

const NPC_NASTYA_QUEST = {
  q1: {
    id: 'q_nastya',
    title: 'Фото со светлячками',
    item: null,
    period: 'evening',
    intro: 'Рыжик! Хочу сфотографировать светлячков вечером. Приходи ко мне вечером на поляну!',
    hint: 'Это фото получится только вечером! Приходи попозже.',
    thanks: 'Невероятные снимки! Ты такой фотогеничный, Рыжик!',
  },
  q2: {
    id: 'q_nastya2',
    title: 'Старые фотографии',
    item: 'filmRoll',
    intro: 'Говорят, в доме спрятана старая плёнка. Поищи на чердаке, на втором этаже?',
    hint: 'Старая плёнка должна быть на чердаке, на втором этаже дома.',
    thanks: 'Старая плёнка! Проявлю и украшу гостиную этими снимками!',
  },
};

const NPC_NASTYA_STORIES = [
  {
    minTrust: 0,
    lines: [
      { speaker: 'npc',    text: 'Я начала фотографировать светлячков совершенно случайно.', emotion: 'happy' },
      { speaker: 'npc',    text: 'Однажды вечером увидела, как они летают возле травы.', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'И всё вокруг выглядело как сон.', emotion: 'nostalgic' },
      { speaker: 'ryzhik', text: 'Мур?..', emotion: 'curious' },
      { speaker: 'npc',    text: 'С тех пор каждое лето пытаюсь поймать этот момент снова.', emotion: 'happy' },
    ],
  },
  {
    minTrust: 1,
    lines: [
      { speaker: 'npc',    text: 'Как-то раз я сидела ночью возле пруда почти до утра.', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Было так тихо, что слышно было только сверчков.', emotion: 'neutral' },
      { speaker: 'npc',    text: 'И воду.', emotion: 'neutral' },
      { speaker: 'ryzhik', text: 'Мрр...', emotion: 'happy' },
      { speaker: 'npc',    text: 'Иногда тишина успокаивает лучше любых слов.', emotion: 'happy' },
    ],
  },
  {
    minTrust: 2,
    lines: [
      { speaker: 'npc',    text: 'Мне нравится запах старого дома.', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Дерево, пыль, тёплый воздух…', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Кажется, будто стены помнят всё, что здесь происходило.', emotion: 'neutral' },
      { speaker: 'ryzhik', text: 'Мяу.', emotion: 'neutral' },
      { speaker: 'npc',    text: 'Наверное, поэтому здесь так уютно.', emotion: 'happy' },
    ],
  },
];

const NPC_NASTYA_BEHAVIOR = {
  waypoints: {
    morning: [[865,190],[895,185],[875,210]],
    day:     [[885,200],[845,175],[915,195],[870,220],[855,185]],
    evening: [[860,183],[875,195]]
  },
  idle: { morning:'camera', day:'camera', evening:'sit' }
};
