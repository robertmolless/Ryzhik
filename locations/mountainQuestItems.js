'use strict';

const MTN_QUEST_ITEMS = {
  trailRibbon: {
    id: 'trailRibbon',
    name: 'Ленточка-метка',
    icon: '🎀',
    desc: 'Красная ленточка. Соня использует их как метки на горных тропах.',
    rare: false,
  },
  mountainWindFlower: {
    id: 'mountainWindFlower',
    name: 'Ветреный цветок',
    icon: '🌺',
    desc: 'Редкий горный цветок. Цветёт только утром и вечером.',
    rare: true,
  },
  mountainMemoryLeaf: {
    id: 'mountainMemoryLeaf',
    name: 'Горный лист памяти',
    icon: '🍃',
    desc: 'Особый лист, который Соня подарила Рыжику в память о горных тропах.',
    rare: true,
  },
};

// One ribbon pickup per sub-zone
const MTN_RIBBON_PS = [
  { id: 'mq_ribbon_ps', x: 308, y: 240, w: 28, h: 24, label: '🎀 Ленточка-метка', action: 'pickup', item: 'trailRibbon', blocking: false },
];
const MTN_RIBBON_SV = [
  { id: 'mq_ribbon_sv', x: 414, y: 156, w: 28, h: 24, label: '🎀 Ленточка-метка', action: 'pickup', item: 'trailRibbon', blocking: false },
];
const MTN_RIBBON_FM = [
  { id: 'mq_ribbon_fm', x: 198, y: 242, w: 28, h: 24, label: '🎀 Ленточка-метка', action: 'pickup', item: 'trailRibbon', blocking: false },
];

// Wind flower — only pickable morning/evening (enforced by pickup_windflower action)
const MTN_WINDFLOWER_OBJ = {
  id: 'mq_windflower', x: 342, y: 208, w: 36, h: 36,
  label: '🌺 Ветреный цветок', action: 'pickup_windflower', blocking: false,
};

if (typeof ITEMS !== 'undefined') Object.assign(ITEMS, MTN_QUEST_ITEMS);
if (typeof PINE_SLOPE_OBJECTS !== 'undefined') PINE_SLOPE_OBJECTS.push(...MTN_RIBBON_PS);
if (typeof STONE_VIEWPOINT_OBJECTS !== 'undefined') STONE_VIEWPOINT_OBJECTS.push(...MTN_RIBBON_SV);
if (typeof FLOWER_MEADOW_OBJECTS !== 'undefined') FLOWER_MEADOW_OBJECTS.push(...MTN_RIBBON_FM, MTN_WINDFLOWER_OBJ);
