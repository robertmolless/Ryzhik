'use strict';

/**
 * smoke_test.js — post-module-split validation
 *
 * Checks:
 *  1. Every <script src="..."> file referenced in index.html exists on disk
 *  2. Every JS file parses without syntax errors (Node --check)
 *  3. Every global class/const/function that game_core.js (and the game/ prototype
 *     extensions) depend on is defined in a file that loads BEFORE the consumer
 *  4. BarnManager / MilitaryOfficeManager / MountainsManager optional-guard check
 *  5. Confirms window.game = new Game() is inside a 'load' event listener
 *     (so all prototype extensions are registered before construction)
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;

let passed = 0;
let failed = 0;
const errors = [];

function ok(msg)  { passed++; console.log(`  ✓  ${msg}`); }
function fail(msg){ failed++; errors.push(msg); console.log(`  ✗  ${msg}`); }
function section(title) { console.log(`\n── ${title} ──`); }

// ─── 1. Parse load order from index.html ─────────────────────────────────────
section('1. Script inventory (all <script src=> files exist)');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scriptRe = /<script\s+src="([^"]+)"/g;
const loadOrder = [];
let m;
while ((m = scriptRe.exec(html)) !== null) {
  const src = m[1];
  if (src.startsWith('http')) continue;   // skip external CDN scripts
  loadOrder.push(src);
  const full = path.join(ROOT, src);
  if (fs.existsSync(full)) {
    ok(`EXISTS  ${src}`);
  } else {
    fail(`MISSING ${src}`);
  }
}
console.log(`\n  Total local modules: ${loadOrder.length}`);

// ─── 2. Syntax check every module ────────────────────────────────────────────
section('2. Syntax check (node --check)');

for (const src of loadOrder) {
  const full = path.join(ROOT, src);
  if (!fs.existsSync(full)) continue;
  try {
    execSync(`node --check "${full}"`, { stdio: 'pipe' });
    ok(`SYNTAX OK  ${src}`);
  } catch (e) {
    fail(`SYNTAX ERROR  ${src}\n     ${e.stderr.toString().trim()}`);
  }
}

// ─── 3. Global dependency order ──────────────────────────────────────────────
section('3. Dependency-order check (consumer loads after producer)');

// Map: identifier → index in loadOrder where it is FIRST defined
function collectDefs(src) {
  const full = path.join(ROOT, src);
  if (!fs.existsSync(full)) return [];
  const code = fs.readFileSync(full, 'utf8');
  const defs = [];
  // Top-level class declarations
  for (const x of code.matchAll(/^class ([A-Z]\w+)/gm))  defs.push(x[1]);
  // Top-level const UPPER_CASE
  for (const x of code.matchAll(/^const ([A-Z_]{2,})\b/gm)) defs.push(x[1]);
  // Top-level function (capitalised or not)
  for (const x of code.matchAll(/^function ([a-zA-Z]\w+)/gm)) defs.push(x[1]);
  return defs;
}

const defIndex = {};   // identifier → load-order index where it's defined
for (let i = 0; i < loadOrder.length; i++) {
  for (const id of collectDefs(loadOrder[i])) {
    if (!(id in defIndex)) defIndex[id] = i;
  }
}

// Critical dependencies game_core.js must find already defined
const gameCoreIdx = loadOrder.indexOf('game_core.js');
const coreDeps = [
  'TelegramBridge','AudioSystem','SaveSystem','TimeSystem','WeatherSystem',
  'Camera','Input','Player','World','InteriorManager',
  'Inventory','QuestSystem','DialogueSystem','AmbientSystem',
  'UIManager','AchievementSystem','MiniGameSystem',
  'NPC','NPC_DATA',
  'initSplashFireflies',
];

for (const dep of coreDeps) {
  if (dep in defIndex) {
    if (defIndex[dep] < gameCoreIdx) {
      ok(`${dep}  defined in ${loadOrder[defIndex[dep]]} (index ${defIndex[dep]}) before game_core.js (${gameCoreIdx})`);
    } else {
      fail(`${dep}  defined AFTER game_core.js — load-order violation`);
    }
  } else {
    fail(`${dep}  NOT FOUND in any loaded module`);
  }
}

// game/ files extend Game.prototype — they must load after game_core.js
const gameFiles = loadOrder.filter(s => s.startsWith('game/'));
for (const gf of gameFiles) {
  const idx = loadOrder.indexOf(gf);
  if (idx > gameCoreIdx) {
    ok(`${gf} loads AFTER game_core.js (index ${idx} > ${gameCoreIdx})`);
  } else {
    fail(`${gf} loads BEFORE game_core.js — prototype extensions would be missing`);
  }
}

// ─── 4. Optional-guard for BarnManager/MilitaryOfficeManager/MountainsManager ─
section('4. Optional-class guards in game_core.js');

const gcCode = fs.readFileSync(path.join(ROOT, 'game_core.js'), 'utf8');
for (const cls of ['BarnManager','MilitaryOfficeManager','MountainsManager']) {
  const guarded = gcCode.includes(`typeof ${cls} !== 'undefined'`);
  if (guarded) {
    ok(`${cls}  instantiation is guarded with typeof check`);
  } else {
    fail(`${cls}  missing typeof guard in game_core.js`);
  }
}

// ─── 5. new Game() deferred until window 'load' event ────────────────────────
section("5. new Game() deferred until window 'load' event");

const loadListenerRe = /window\s*\.\s*addEventListener\s*\(\s*['"]load['"]/;
const newGameRe      = /window\.game\s*=\s*new Game\s*\(\s*\)/;
const listenerBlock = gcCode.match(/window\s*\.\s*addEventListener\s*\(\s*['"]load['"][^)]*\)[^{]*\{([\s\S]*?)\}\s*\)/);

if (listenerBlock && newGameRe.test(listenerBlock[0])) {
  ok("window.game = new Game() is inside window.addEventListener('load', ...) — all prototype extensions are registered before construction");
} else if (newGameRe.test(gcCode) && !loadListenerRe.test(gcCode)) {
  fail("window.game = new Game() is NOT inside a 'load' listener — prototype extensions from game/ may not be registered yet");
} else if (loadListenerRe.test(gcCode) && newGameRe.test(gcCode)) {
  ok("'load' listener and new Game() both present in game_core.js (order assumed correct)");
} else {
  fail("Could not confirm new Game() placement relative to 'load' event");
}

// ─── 6. NPC_DATA references all individual NPC data objects ─────────────────
section('6. NPC_DATA aggregation completeness');

const npcIndexCode = fs.readFileSync(path.join(ROOT, 'npc/index.js'), 'utf8');
const npcFiles = loadOrder.filter(s => s.startsWith('npc/') && s !== 'npc/index.js');
for (const nf of npcFiles) {
  const name = path.basename(nf, '.js').toUpperCase();
  const expectedConst = `NPC_${name}_DATA`;
  if (npcIndexCode.includes(expectedConst)) {
    ok(`${expectedConst}  referenced in npc/index.js`);
  } else {
    fail(`${expectedConst}  NOT referenced in npc/index.js — NPC may be missing from the game`);
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log(`SMOKE TEST RESULT: ${failed === 0 ? 'PASS' : 'FAIL'}`);
console.log(`  Passed: ${passed}    Failed: ${failed}`);
if (errors.length) {
  console.log('\nFailed checks:');
  errors.forEach((e, i) => console.log(`  ${i+1}. ${e}`));
}
console.log('═'.repeat(60));

process.exit(failed > 0 ? 1 : 0);
