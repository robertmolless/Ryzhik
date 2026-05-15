'use strict';

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
