'use strict';

const NPC_SONYA_DATA = {
  id:'sonya', name:'Соня', emoji:'🎒', color:'#44aaff',
  x:1020, y:190, zone:'forest_path', human:true,
  trustLevels:['Незнакомец','Знакомый','Друг','Лучший друг'],
  schedule:{ morning:[1020,190], day:[1040,200], evening:[1010,185], night:null },
  dialogues:{
    morning:['Рыжик! Иду в лес. Не отставай!','Знаю тут безопасную тропу через лес.','Утром лес особенно тихий и свежий.','Слышишь птиц? Это малиновка поёт!','С рюкзаком и хорошей компанией — красота.'],
    day:['Тут красиво, правда?','Через лес выйдем на поляну.','Я знаю все тропы в округе!','Вон та тропа ведёт к старым соснам.','Рыжик, ты умеешь ходить по лесу?'],
    evening:['Вечерний лес — это особенная красота...','Закат сквозь деревья. Волшебно.','Скоро стемнеет — пора возвращаться.','Я всегда нахожу дорогу домой.','Слышишь? Лягушки у пруда запели.'],
    night:null
  },
  quest:'q_sonya', questStage:0, appearance:'🎒 путешественница, спокойная, знает лес',
  actions: ['Идти вместе', 'Поговорить']
};

const NPC_SONYA_QUEST = {
  q1: {
    id: 'q_sonya',
    title: 'Лесная тропа',
    item: 'leaf',
    intro: 'Рыжик! Иду по лесной тропе и вижу редкие листья. Принеси мне один?',
    hint: 'Редкие листья лежат на лесной тропе и в саду. Поищи там!',
    thanks: 'Нашёл! Красивый редкий лист. Теперь я знаю эту тропу!',
  },
  q2: {
    id: 'q_sonya2',
    title: 'Походный компас',
    item: 'compass',
    intro: 'Потеряла свой компас... кажется, у забора или в доме. Без него я как без рук!',
    hint: 'Компас должен быть у старого забора или где-то во дворе.',
    thanks: 'Компас! Теперь никогда не потеряюсь. Спасибо, рыжий!',
  },
  q3: {
    id: 'q_sonya3',
    title: 'Потерянный компас',
    item: 'sonyaCompass',
    intro: 'Кажется, я потеряла свой старый компас возле лесной тропы. Без него я чувствую себя странно…',
    hint: 'Старый компас лежит у большого камня на лесной тропе, в правой части двора. Поищи там.',
    thanks: 'Нашёл! Спасибо, Рыжик. Знаешь… наверное, теперь я могу тебе кое-что показать.',
  },
};

const NPC_SONYA_STORIES = [
  {
    minTrust: 0,
    lines: [
      { speaker: 'npc',    text: 'Однажды в горах я попала в очень сильный туман.', emotion: 'neutral' },
      { speaker: 'npc',    text: 'Настолько густой, что не было видно даже дороги.', emotion: 'neutral' },
      { speaker: 'ryzhik', text: 'Мяу?..', emotion: 'curious' },
      { speaker: 'npc',    text: 'Тогда я поняла, насколько важна тишина и спокойствие.', emotion: 'happy' },
    ],
  },
  {
    minTrust: 1,
    lines: [
      { speaker: 'npc',    text: 'Лесную тропу возле дома я нашла случайно.', emotion: 'happy' },
      { speaker: 'npc',    text: 'Просто шла между деревьями и вдруг увидела проход.', emotion: 'neutral' },
      { speaker: 'npc',    text: 'С тех пор люблю гулять там вечером.', emotion: 'happy' },
    ],
  },
  {
    minTrust: 2,
    lines: [
      { speaker: 'npc',    text: 'Иногда ночью я просто смотрю на звёзды.', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Без музыки. Без разговоров.', emotion: 'neutral' },
      { speaker: 'npc',    text: 'Только тишина и ветер.', emotion: 'neutral' },
      { speaker: 'ryzhik', text: 'Мррр...', emotion: 'happy' },
    ],
  },
  {
    minTrust: 3,
    lines: [
      { speaker: 'npc',    text: 'Рыжик… я рада, что ты сходил со мной в горы.', emotion: 'happy' },
      { speaker: 'ryzhik', text: 'Мур-мур.', emotion: 'happy' },
      { speaker: 'npc',    text: 'Там наверху всё кажется таким маленьким.', emotion: 'nostalgic' },
      { speaker: 'npc',    text: 'Дом, двор, все хлопоты…', emotion: 'neutral' },
      { speaker: 'npc',    text: 'Но именно оттуда понимаешь, как сильно любишь это место.', emotion: 'happy' },
      { speaker: 'ryzhik', text: 'Мрр!', emotion: 'happy' },
    ],
  },
];

const NPC_SONYA_BEHAVIOR = {
  waypoints: {
    morning: [[1015,195],[1050,185],[1040,215]],
    day:     [[1035,205],[1005,195],[1060,185],[1030,225]],
    evening: [[1010,190],[1025,200]]
  },
  idle: { morning:'wander', day:'wander', evening:'sit' }
};
