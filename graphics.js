/* ============================================================
   РЫЖИК — graphics.js
   Cozy indie-style renderer: Stardew Valley / Spiritfarer vibe
   All canvas, no external assets, rich detail
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────
   GLOBAL RENDERING HELPERS
   ────────────────────────────────────────────── */
const GFX = {
  t: 0, // global animation time

  /* Smooth shadow drop */
  shadow(ctx, x, y, rx, ry, alpha = 0.22) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#2a1a00';
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  /* Soft glow ring */
  glow(ctx, x, y, r, color, alpha = 0.35) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color.replace(')', `,${alpha})`).replace('rgb', 'rgba'));
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  },

  /* Rounded rect */
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  },

  lerp(a, b, t) { return a + (b - a) * t; },
  clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },
};

/* ──────────────────────────────────────────────
   CAT RENDERER — Рыжик
   ────────────────────────────────────────────── */
function drawCat(ctx, opts = {}) {
  const {
    x = 0, y = 0, facing = 1, frame = 0, moving = false,
    jumping = false, jumpY = 0, emotion = null,
    actionAnim = null, t = 0,
    food = 80, mood = 80,
  } = opts;

  ctx.save();
  ctx.translate(x, y + jumpY);
  ctx.scale(facing, 1);

  const bob = moving ? Math.sin(t * 12) * 1.8 : Math.sin(t * 1.4) * 0.6;
  const tailAngle = Math.sin(t * (moving ? 5 : 2)) * (moving ? 0.5 : 0.22);
  const blink = Math.sin(t * 0.7) > 0.96;

  // ── Shadow ──
  GFX.shadow(ctx, 0, 22, 18, 6);

  // ── Tail ──
  ctx.save();
  ctx.translate(-10, 6 + bob);
  ctx.rotate(tailAngle);
  // Tail base → tip (thick to thin)
  for (let i = 0; i < 12; i++) {
    const p = i / 11;
    const tw = 6 * (1 - p * 0.7);
    const tx = -p * 8;
    const ty = -p * 32 + Math.sin(p * Math.PI + t * 3) * 8;
    ctx.fillStyle = p < 0.4 ? '#cc4400' : p < 0.8 ? '#dd6620' : '#f0a060';
    ctx.beginPath();
    ctx.ellipse(tx, ty, tw, tw * 0.7, p * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Tail tip (fluffy white)
  ctx.fillStyle = '#f8ddc0';
  ctx.beginPath(); ctx.ellipse(-8, -34 + Math.sin(t * 3) * 8, 7, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── Body ──
  // Main body oval
  const bodyGrad = ctx.createRadialGradient(2, -2 + bob, 4, 2, -2 + bob, 18);
  bodyGrad.addColorStop(0, '#f07030');
  bodyGrad.addColorStop(0.6, '#d85a18');
  bodyGrad.addColorStop(1, '#b84010');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 4 + bob, 15, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body stripe (tabby pattern)
  ctx.strokeStyle = 'rgba(100,30,0,0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-8, -1 + bob); ctx.lineTo(-4, 10 + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, -2 + bob); ctx.lineTo(7, 10 + bob); ctx.stroke();

  // Chest / belly (lighter)
  const bellyGrad = ctx.createRadialGradient(3, 6 + bob, 2, 3, 6 + bob, 10);
  bellyGrad.addColorStop(0, '#f8c080');
  bellyGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = bellyGrad;
  ctx.beginPath(); ctx.ellipse(3, 5 + bob, 8, 10, 0.1, 0, Math.PI * 2); ctx.fill();

  // ── Legs / paws ──
  const legSwing = moving ? Math.sin(t * 12) * 5 : 0;
  // Back paws
  ctx.fillStyle = '#c84010';
  ctx.beginPath(); ctx.ellipse(-8, 16 + bob + legSwing * 0.5, 5, 3.5, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(8, 16 + bob - legSwing * 0.5, 5, 3.5, -0.4, 0, Math.PI * 2); ctx.fill();
  // Front paws
  ctx.fillStyle = '#e06020';
  ctx.beginPath(); ctx.ellipse(-6, 14 + bob - legSwing * 0.3, 5, 3.5, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(6, 14 + bob + legSwing * 0.3, 5, 3.5, -0.3, 0, Math.PI * 2); ctx.fill();
  // Toe lines
  ctx.strokeStyle = 'rgba(100,30,0,0.35)'; ctx.lineWidth = 0.8;
  [[-8,16],[-6,14],[6,14],[8,16]].forEach(([lx,ly]) => {
    for (let t2=0;t2<3;t2++) {
      ctx.beginPath();
      ctx.moveTo(lx - 2 + t2 * 2, ly + bob + 1);
      ctx.lineTo(lx - 2 + t2 * 2, ly + bob + 3.5);
      ctx.stroke();
    }
  });

  // ── Head ──
  ctx.save();
  ctx.translate(6, -10 + bob);
  const headGrad = ctx.createRadialGradient(0, -2, 3, 0, -2, 14);
  headGrad.addColorStop(0, '#f07030');
  headGrad.addColorStop(0.7, '#d85a18');
  headGrad.addColorStop(1, '#c04808');
  ctx.fillStyle = headGrad;
  ctx.beginPath(); ctx.ellipse(0, 0, 13, 12, 0, 0, Math.PI * 2); ctx.fill();

  // Forehead stripe (tabby M)
  ctx.strokeStyle = 'rgba(100,30,0,0.3)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(-3, -4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, -8); ctx.lineTo(3, -4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, -4); ctx.stroke();

  // ── Ears ──
  // Left ear
  ctx.fillStyle = '#d85a18';
  ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(-14, -18); ctx.lineTo(-3, -11); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff9966';
  ctx.beginPath(); ctx.moveTo(-10, -7); ctx.lineTo(-13, -16); ctx.lineTo(-4, -11); ctx.closePath(); ctx.fill();
  // Right ear
  ctx.fillStyle = '#d85a18';
  ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(14, -18); ctx.lineTo(3, -11); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff9966';
  ctx.beginPath(); ctx.moveTo(10, -7); ctx.lineTo(13, -16); ctx.lineTo(4, -11); ctx.closePath(); ctx.fill();

  // ── Eyes ──
  if (!blink) {
    // Eye whites
    ctx.fillStyle = '#fff8f0';
    ctx.beginPath(); ctx.ellipse(-5, -2, 4.5, 5, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, -2, 4.5, 5, 0.1, 0, Math.PI * 2); ctx.fill();
    // Pupils (vertical slit)
    ctx.fillStyle = '#1a0a00';
    const pupilW = mood > 50 ? 2 : 3; // dilated at low mood
    ctx.beginPath(); ctx.ellipse(-5, -2, pupilW, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, -2, pupilW, 4, 0, 0, Math.PI * 2); ctx.fill();
    // Iris color
    ctx.fillStyle = 'rgba(100,200,80,0.6)';
    ctx.beginPath(); ctx.ellipse(-5, -2, 3.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a0a00';
    ctx.beginPath(); ctx.ellipse(-5, -2, pupilW, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, -2, pupilW, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    // Eye shine
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.arc(-6, -3.5, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -3.5, 1.3, 0, Math.PI * 2); ctx.fill();
  } else {
    // Blink
    ctx.strokeStyle = '#1a0a00'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-8, -2); ctx.quadraticCurveTo(-5, 0, -2, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3, -2); ctx.quadraticCurveTo(5, 0, 8, -2); ctx.stroke();
  }

  // ── Nose ──
  ctx.fillStyle = '#ff7799';
  ctx.beginPath(); ctx.moveTo(-2, 4); ctx.lineTo(2, 4); ctx.lineTo(0, 6); ctx.closePath(); ctx.fill();
  // Mouth
  ctx.strokeStyle = '#cc4466'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(-3, 8, -4, 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(3, 8, 4, 7); ctx.stroke();

  // ── Whiskers ──
  ctx.strokeStyle = 'rgba(255,250,230,0.85)'; ctx.lineWidth = 0.9;
  [[-1,3],[0,4],[1,5]].forEach(([wy, wo]) => {
    ctx.beginPath(); ctx.moveTo(-2, wy); ctx.lineTo(-16, wy - wo * 0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, wy); ctx.lineTo(16, wy - wo * 0.3); ctx.stroke();
  });

  ctx.restore(); // end head

  // ── Emotion bubble ──
  if (actionAnim) {
    ctx.save();
    ctx.translate(14, -28 + bob);
    // Bubble
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    GFX.roundRect(ctx, -14, -14, 28, 24, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(200,150,100,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    // Tail of bubble
    ctx.beginPath(); ctx.moveTo(-4, 10); ctx.lineTo(-8, 18); ctx.lineTo(4, 10); ctx.closePath(); ctx.fill();
    // Icon
    ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const emoMap = { meow: '💬', purr: '💕', pickup: '✨', sleep: '💤', happy: '😺', sad: '😿' };
    ctx.fillText(emoMap[actionAnim] || '❓', 0, 0);
    ctx.restore();
  }

  ctx.restore(); // end whole cat
}

/* ──────────────────────────────────────────────
   HUMAN NPC RENDERER
   ────────────────────────────────────────────── */
const NPC_STYLES = {
  lyokha:   { hair:'#e0cc80', shirt:'#b8d0e8', pants:'#6080a0', skin:'#f5c5a0', hairStyle:'medium', acc:null },
  igor:     { hair:'#1a1a1a', shirt:'#1a1a1a', pants:'#2a2a3a', skin:'#e8b890', hairStyle:'short',  acc:'chain' },
  nastya:   { hair:'#8b5a2b', shirt:'#c06050', pants:'#446688', skin:'#f8d0b0', hairStyle:'long',   acc:'camera' },
  liza:     { hair:'#ff80c0', shirt:'#e870c0', pants:'#6040c0', skin:'#f5c0b0', hairStyle:'wavy',   acc:'stars' },
  mag:      { hair:'#1a1a2a', shirt:'#2a1a4a', pants:'#1a1030', skin:'#c0a890', hairStyle:'long',   acc:'hat' },
  sonya:    { hair:'#c8a060', shirt:'#4a7040', pants:'#3a5060', skin:'#e8c0a0', hairStyle:'pony',   acc:'backpack' },
  nena:     { hair:'#2a1a10', shirt:'#8ab090', pants:'#4a6050', skin:'#e0b898', hairStyle:'curly',  acc:'glasses' },
  kristina: { hair:'#3a2a1a', shirt:'#2a2a3a', pants:'#1a1a2a', skin:'#e8c0b0', hairStyle:'short',  acc:'tattoo' },
  danya:    { hair:'#3a3a3a', shirt:'#4a70c0', pants:'#2a3a50', skin:'#f0c8a8', hairStyle:'hat',    acc:'glasses2' },
  prokhor:  { hair:'#2a2010', shirt:'#5a4030', pants:'#3a2a20', skin:'#c8a080', hairStyle:'bald',   acc:'mustache' },
};

function drawHumanNPC(ctx, opts = {}) {
  const { id = 'lyokha', x = 0, y = 0, t = 0, facing = 1, moving = false, trust = 0, emotion = null } = opts;
  const style = NPC_STYLES[id] || NPC_STYLES.lyokha;
  const bob = Math.sin(t * 1.6) * 1.5;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  // Shadow
  GFX.shadow(ctx, 0, 26, 14, 5, 0.2);

  // ── Shoes / feet ──
  ctx.fillStyle = '#2a1a0a';
  ctx.beginPath(); ctx.ellipse(-6, 26 + bob, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(6, 26 + bob, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();

  // ── Legs ──
  const legSwing = moving ? Math.sin(t * 10) * 4 : 0;
  ctx.fillStyle = style.pants;
  ctx.fillRect(-8, 10 + bob, 7, 16); // left
  ctx.fillRect(1, 10 + bob, 7, 16);  // right
  // Leg walk animation
  if (moving) {
    ctx.fillStyle = style.pants;
    ctx.save();
    ctx.translate(-4, 18 + bob); ctx.rotate(legSwing * 0.05);
    ctx.fillRect(-4, 0, 7, 8); ctx.restore();
    ctx.save();
    ctx.translate(4, 18 + bob); ctx.rotate(-legSwing * 0.05);
    ctx.fillRect(-3, 0, 7, 8); ctx.restore();
  }

  // ── Body / shirt ──
  ctx.fillStyle = style.shirt;
  // Torso trapezoid
  ctx.beginPath();
  ctx.moveTo(-9, -8 + bob); ctx.lineTo(9, -8 + bob);
  ctx.lineTo(11, 12 + bob); ctx.lineTo(-11, 12 + bob);
  ctx.closePath(); ctx.fill();
  // Shirt collar
  ctx.fillStyle = _lighten(style.shirt, 20);
  ctx.beginPath(); ctx.moveTo(-3, -8 + bob); ctx.lineTo(3, -8 + bob); ctx.lineTo(0, -4 + bob); ctx.closePath(); ctx.fill();
  // Shirt fold lines
  ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-5, -4 + bob); ctx.lineTo(-4, 10 + bob); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, -4 + bob); ctx.lineTo(4, 10 + bob); ctx.stroke();

  // ── Arms ──
  const armSwing = moving ? Math.sin(t * 10) * 5 : Math.sin(t * 1.8) * 2;
  // Left arm
  ctx.fillStyle = style.skin;
  ctx.save(); ctx.translate(-12, -2 + bob); ctx.rotate((-10 + armSwing) * Math.PI / 180);
  ctx.fillRect(-3, 0, 6, 16); ctx.restore();
  // Right arm
  ctx.save(); ctx.translate(12, -2 + bob); ctx.rotate((10 - armSwing) * Math.PI / 180);
  ctx.fillRect(-3, 0, 6, 16); ctx.restore();

  // Accessory in hand
  if (style.acc === 'camera') {
    ctx.save(); ctx.translate(16, 8 + bob);
    ctx.fillStyle = '#222'; ctx.fillRect(-5,-4,10,8); ctx.fillStyle='#666'; ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  if (style.acc === 'backpack') {
    ctx.save(); ctx.translate(-13, 0 + bob);
    ctx.fillStyle = '#3a5060'; ctx.fillRect(-8,-10,10,20); ctx.fillStyle='#2a4050'; ctx.fillRect(-7,-8,8,16);
    ctx.restore();
  }

  // ── Neck ──
  ctx.fillStyle = style.skin;
  ctx.fillRect(-3, -12 + bob, 6, 6);

  // ── Head ──
  ctx.save();
  ctx.translate(0, -20 + bob);
  // Head shape
  const headGrad = ctx.createRadialGradient(-2, -3, 2, 0, 0, 14);
  headGrad.addColorStop(0, _lighten(style.skin, 15));
  headGrad.addColorStop(1, style.skin);
  ctx.fillStyle = headGrad;
  ctx.beginPath(); ctx.ellipse(0, 0, 11, 13, 0, 0, Math.PI * 2); ctx.fill();

  // ── Hair ──
  _drawHair(ctx, style.hair, style.hairStyle, t);

  // ── Eyes ──
  const eyeY = -2;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(-4, eyeY, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(4, eyeY, 3, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a2a10';
  ctx.beginPath(); ctx.ellipse(-4, eyeY, 1.8, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(4, eyeY, 1.8, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath(); ctx.arc(-5, eyeY - 1, 0.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(3, eyeY - 1, 0.8, 0, Math.PI * 2); ctx.fill();

  // Eyelashes (female chars)
  if (['nastya','liza','nena','sonya','kristina'].includes(id)) {
    ctx.strokeStyle = '#1a0a00'; ctx.lineWidth = 0.8;
    for (let i=-2;i<=2;i++) { ctx.beginPath(); ctx.moveTo(-4+i,eyeY-3); ctx.lineTo(-4+i*1.2,eyeY-5); ctx.stroke(); }
    for (let i=-2;i<=2;i++) { ctx.beginPath(); ctx.moveTo(4+i,eyeY-3); ctx.lineTo(4+i*1.2,eyeY-5); ctx.stroke(); }
  }

  // Lips
  if (id === 'nastya') {
    ctx.fillStyle = '#cc3355';
    ctx.beginPath(); ctx.ellipse(0, 6, 4, 1.8, 0, 0, Math.PI); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 6, 4, 1, 0, Math.PI, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = _darken(style.skin, 20);
    ctx.beginPath(); ctx.ellipse(0, 6, 3, 1.2, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Accessories on head
  if (style.acc === 'glasses' || style.acc === 'glasses2') {
    const gc = style.acc === 'glasses2' ? '#cc4444' : '#222266';
    ctx.strokeStyle = gc; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(-4, eyeY, 3.5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(4, eyeY, 3.5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-0.5, eyeY); ctx.lineTo(0.5, eyeY); ctx.stroke();
  }
  if (style.acc === 'hat') {
    ctx.fillStyle = '#2a1a4a';
    ctx.fillRect(-13, -13, 26, 6);
    ctx.beginPath(); ctx.moveTo(-10,-13); ctx.lineTo(-8,-28); ctx.lineTo(8,-28); ctx.lineTo(10,-13); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a2a5a'; ctx.fillRect(-10,-14,20,3);
    // Hat band
    ctx.fillStyle = '#ffd844'; ctx.fillRect(-9,-16,18,3);
  }
  if (style.acc === 'mustache') {
    ctx.fillStyle = '#3a2a10';
    ctx.beginPath(); ctx.ellipse(-3, 5, 4, 2, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3, 5, 4, 2, 0.2, 0, Math.PI * 2); ctx.fill();
  }
  if (style.acc === 'chain') {
    // Implied by style, would need neck position — skip for head block
  }

  ctx.restore(); // end head

  // ── Trust badge ──
  if (trust >= 1) {
    const trustColors = ['','#aaaaaa','#44cc88','#ffd844'];
    const hearts = trust;
    ctx.save(); ctx.translate(0, -36 + bob);
    for (let i=0;i<hearts;i++) {
      ctx.fillStyle = trustColors[trust] || '#fff';
      ctx.font = '8px serif'; ctx.textAlign = 'center';
      ctx.fillText('♥', -6 + i * 6, 0);
    }
    ctx.restore();
  }

  // ── Emotion ──
  if (emotion) {
    const emoMap = { happy:'😊', sad:'😢', angry:'😠', surprise:'😲', sleep:'😴', laugh:'😄', awkward:'😅' };
    ctx.save();
    ctx.translate(15, -32 + bob);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    GFX.roundRect(ctx, -10,-10,20,20,6); ctx.fill();
    ctx.strokeStyle = 'rgba(200,200,200,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.font = '12px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(emoMap[emotion] || '💭', 0, 0);
    ctx.restore();
  }

  ctx.restore(); // end npc
}

function _drawHair(ctx, color, style, t) {
  ctx.fillStyle = color;
  switch (style) {
    case 'medium':
      // Layered bob
      ctx.beginPath(); ctx.ellipse(0, -8, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-11, -3, 5, 8, -0.3, 0, Math.PI); ctx.fill();
      ctx.beginPath(); ctx.ellipse(11, -3, 5, 8, 0.3, 0, Math.PI); ctx.fill();
      break;
    case 'long':
      ctx.beginPath(); ctx.ellipse(0, -8, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
      // Long strands
      for (let i=-3;i<=3;i++) {
        ctx.beginPath();
        ctx.moveTo(i*3.5, 6);
        ctx.quadraticCurveTo(i*4+Math.sin(t*1.5+i)*2, 18, i*3.5+Math.sin(t+i)*3, 28);
        ctx.lineWidth = 3; ctx.strokeStyle = color; ctx.stroke();
      }
      break;
    case 'short':
      ctx.beginPath(); ctx.ellipse(0, -9, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-10, -4, 4, 6, -0.4, 0, Math.PI); ctx.fill();
      ctx.beginPath(); ctx.ellipse(10, -4, 4, 6, 0.4, 0, Math.PI); ctx.fill();
      break;
    case 'wavy':
      ctx.beginPath(); ctx.ellipse(0, -8, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
      // Wavy sides
      for (let side=-1;side<=1;side+=2) {
        ctx.beginPath(); ctx.moveTo(side*11, -4);
        for (let i=0;i<5;i++) ctx.quadraticCurveTo(side*(12+Math.sin(i*1.5+t)*2), -4+i*6, side*(10+Math.sin(i*2+t+1)*3), -4+(i+1)*6);
        ctx.lineWidth = 5; ctx.strokeStyle = color; ctx.stroke();
      }
      break;
    case 'curly':
      ctx.beginPath(); ctx.ellipse(0, -8, 12, 11, 0, 0, Math.PI * 2); ctx.fill();
      // Curly blob sides
      for (let i=0;i<8;i++) {
        const a = (i/8)*Math.PI*2;
        ctx.beginPath(); ctx.arc(Math.cos(a)*11, -8+Math.sin(a)*10, 4, 0, Math.PI*2); ctx.fill();
      }
      break;
    case 'pony':
      ctx.beginPath(); ctx.ellipse(0, -8, 11, 9, 0, 0, Math.PI * 2); ctx.fill();
      // Ponytail
      ctx.beginPath(); ctx.moveTo(-8, -14);
      ctx.quadraticCurveTo(-16-Math.sin(t)*3, -8, -12, 8+Math.sin(t*1.5)*4);
      ctx.lineWidth = 8; ctx.strokeStyle = color; ctx.stroke();
      break;
    case 'hat':
      // Hat covers head, just visible front
      ctx.beginPath(); ctx.ellipse(0, -9, 11, 7, 0, 0, Math.PI * 2); ctx.fill();
      // Sideburns
      ctx.beginPath(); ctx.ellipse(-10, -2, 3, 5, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(10, -2, 3, 5, 0.3, 0, Math.PI * 2); ctx.fill();
      break;
    case 'bald':
      // Minimal stubble
      ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.ellipse(0, -9, 11, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      break;
  }
}

function _lighten(hex, amt) {
  try {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (n >> 16) + amt);
    const g = Math.min(255, ((n >> 8) & 0xff) + amt);
    const b = Math.min(255, (n & 0xff) + amt);
    return `rgb(${r},${g},${b})`;
  } catch(e) { return hex; }
}
function _darken(hex, amt) { return _lighten(hex, -amt); }

/* ──────────────────────────────────────────────
   WORLD RENDERING FUNCTIONS
   ────────────────────────────────────────────── */

/* === GRASS === */
function drawGrass(ctx, x, y, w, h, t) {
  // Base gradient ground
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#4a9a28');
  grad.addColorStop(0.3, '#3d8820');
  grad.addColorStop(0.7, '#327018');
  grad.addColorStop(1, '#285c10');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Darker patches for variation
  for (let i = 0; i < 18; i++) {
    const px = x + (i * 137.5 % w), py = y + (i * 97.3 % h);
    ctx.fillStyle = `rgba(20,60,5,${0.05 + (i%3)*0.04})`;
    ctx.beginPath(); ctx.ellipse(px, py, 30+i*7, 20+i*4, (i%5)*0.4, 0, Math.PI*2); ctx.fill();
  }

  // Lighter highlight patches
  for (let i = 0; i < 10; i++) {
    const px = x + (i * 213.7 % w), py = y + (i * 77.1 % h);
    ctx.fillStyle = `rgba(100,200,50,${0.04 + (i%2)*0.03})`;
    ctx.beginPath(); ctx.ellipse(px, py, 25+i*5, 15+i*3, (i%4)*0.5, 0, Math.PI*2); ctx.fill();
  }

  // Individual grass blades (in visible rows)
  ctx.save();
  const bladeSpacing = 22;
  const bladeRows = Math.min(5, Math.floor(h / 40));
  for (let row = 0; row < bladeRows; row++) {
    const gy = y + row * 40 + 20;
    if (gy < y || gy > y + h) continue;
    for (let gx = x; gx < x + w; gx += bladeSpacing + (row * 3)) {
      const wave = Math.sin(t * 1.8 + gx * 0.03 + row) * 2.5;
      const h2 = 8 + (row * 3) + Math.sin(gx * 0.07) * 3;
      const alpha = 0.4 + Math.sin(gx * 0.1) * 0.2;
      // Blade base (dark)
      ctx.strokeStyle = `rgba(20,70,5,${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.quadraticCurveTo(gx + wave, gy - h2 * 0.5, gx + wave * 1.5, gy - h2); ctx.stroke();
      // Blade highlight (light)
      ctx.strokeStyle = `rgba(120,210,60,${alpha * 0.5})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(gx + 1, gy); ctx.quadraticCurveTo(gx + wave + 1, gy - h2 * 0.5, gx + wave * 1.5 + 1, gy - h2); ctx.stroke();
    }
  }
  ctx.restore();
}

/* === PATHWAY === */
function drawPath(ctx, x, y, w, h, t) {
  // Dirt path with texture
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#8a6030');
  grad.addColorStop(0.15, '#c8a060');
  grad.addColorStop(0.5, '#d4aa70');
  grad.addColorStop(0.85, '#c8a060');
  grad.addColorStop(1, '#8a6030');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h);
  ctx.fill();
  // Pebbles
  ctx.fillStyle = 'rgba(100,80,40,0.25)';
  for (let i = 0; i < 20; i++) {
    const px = x + (i * 79.3 % w), py = y + (i * 43.7 % h);
    ctx.beginPath(); ctx.ellipse(px, py, 3+i%4, 2+i%3, (i%5)*0.6, 0, Math.PI*2); ctx.fill();
  }
  // Edge darkening
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(x, y, 8, h);
  ctx.fillRect(x + w - 8, y, 8, h);
}

/* === FLOWERS === */
function drawFlowers(ctx, flowers, t) {
  flowers.forEach(f => {
    const sway = Math.sin(t * 2.2 + f.phase) * 1.8;
    const wobble = Math.sin(t * 1.5 + f.phase + 1) * 0.08;

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(wobble);

    // Stem
    ctx.strokeStyle = '#3a8020'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sway * 0.3, -f.size * 1.5, sway, -f.size * 3); ctx.stroke();

    // Leaves
    ctx.fillStyle = '#4a9828';
    ctx.save(); ctx.translate(sway * 0.4, -f.size * 1.5);
    ctx.rotate(0.6 + wobble); ctx.beginPath(); ctx.ellipse(0, 0, f.size * 0.7, f.size * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Petals
    ctx.save(); ctx.translate(sway, -f.size * 3);
    const petalColors = [f.color, _lighten(f.color, 15), f.color, _lighten(f.color, 10)];
    for (let i = 0; i < 5; i++) {
      ctx.save(); ctx.rotate((i / 5) * Math.PI * 2 + wobble);
      ctx.fillStyle = petalColors[i % petalColors.length] || f.color;
      ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.ellipse(0, -f.size * 0.7, f.size * 0.4, f.size * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // Center
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffee44';
    ctx.beginPath(); ctx.arc(0, 0, f.size * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath(); ctx.arc(0, 0, f.size * 0.25, 0, Math.PI * 2); ctx.fill();

    ctx.restore(); // end flower
    ctx.restore();
  });
}

/* === TREES === */
function drawTree(ctx, x, y, size = 1, variant = 0, t = 0) {
  ctx.save();
  ctx.translate(x, y);

  const h = (60 + variant * 15) * size;
  const leafW = (40 + variant * 10) * size;
  const sway = Math.sin(t * 0.9 + x * 0.01) * 2 * size;

  // Shadow
  GFX.shadow(ctx, sway * 0.5, 5, 20 * size, 7 * size, 0.18);

  // Trunk
  const trunkGrad = ctx.createLinearGradient(-6 * size, 0, 6 * size, 0);
  trunkGrad.addColorStop(0, '#4a2a10');
  trunkGrad.addColorStop(0.4, '#7a4a20');
  trunkGrad.addColorStop(0.7, '#6a3a18');
  trunkGrad.addColorStop(1, '#3a1a08');
  ctx.fillStyle = trunkGrad;
  ctx.beginPath();
  ctx.moveTo(-5 * size, 0); ctx.lineTo(5 * size, 0);
  ctx.lineTo(4 * size, -h * 0.45); ctx.lineTo(-4 * size, -h * 0.45);
  ctx.closePath(); ctx.fill();
  // Trunk texture lines
  ctx.strokeStyle = 'rgba(30,10,0,0.25)'; ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(-5 * size + i * 2.5, 0); ctx.lineTo(-5 * size + i * 2.5, -h * 0.44); ctx.stroke();
  }
  // Root bumps
  ctx.fillStyle = '#5a3418';
  ctx.beginPath(); ctx.ellipse(-7 * size, 0, 4 * size, 2.5 * size, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(7 * size, 0, 4 * size, 2.5 * size, -0.3, 0, Math.PI * 2); ctx.fill();

  // Foliage — multi-layer
  const leafLayers = [
    { yOff: 0, r: leafW, dark: '#1e5a0a' },
    { yOff: -15 * size, r: leafW * 0.85, dark: '#2a7010' },
    { yOff: -30 * size, r: leafW * 0.7, dark: '#38881a' },
    { yOff: -45 * size, r: leafW * 0.5, dark: '#44a020' },
  ];
  leafLayers.forEach((layer, i) => {
    const ty = -h * 0.4 + layer.yOff + sway * (i * 0.2);
    const tl = ctx.createRadialGradient(sway * 0.2, ty - layer.r * 0.2, layer.r * 0.1, 0, ty, layer.r);
    tl.addColorStop(0, i === leafLayers.length - 1 ? '#80dd30' : _lighten(layer.dark, 25));
    tl.addColorStop(0.5, _lighten(layer.dark, 8));
    tl.addColorStop(1, layer.dark);
    ctx.fillStyle = tl;
    ctx.beginPath();
    // Irregular blob shape
    const sides = 9;
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      const jitter = 0.8 + Math.sin(j * 3.7 + variant) * 0.22;
      const r2 = layer.r * jitter;
      const px2 = Math.cos(a) * r2 + sway * 0.15 * i;
      const py2 = Math.sin(a) * r2 * 0.85 + ty;
      j === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2);
    }
    ctx.closePath(); ctx.fill();
  });

  // Top glow (sun-lit)
  ctx.fillStyle = 'rgba(180,255,80,0.12)';
  ctx.beginPath(); ctx.ellipse(sway * 0.3 - 8 * size, -h * 0.85, leafW * 0.3, leafW * 0.25, -0.4, 0, Math.PI * 2); ctx.fill();

  // Fruit (apple tree variant)
  if (variant === 2) {
    [[-10, -h * 0.55], [8, -h * 0.65], [-5, -h * 0.7], [12, -h * 0.5]].forEach(([fx, fy]) => {
      ctx.fillStyle = '#dd2222';
      ctx.beginPath(); ctx.arc(fx + sway * 0.1, fy, 4 * size, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff5544';
      ctx.beginPath(); ctx.arc(fx + sway * 0.1 - 1, fy - 1, 1.5 * size, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3a8020'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(fx + sway * 0.1, fy - 4 * size); ctx.lineTo(fx + sway * 0.1 + 2, fy - 7 * size); ctx.stroke();
    });
  }

  ctx.restore();
}

/* === HOUSE === */
function drawHouse(ctx, x, y, t, period = 'day') {
  ctx.save();
  ctx.translate(x, y);

  const W = 300, H = 210;
  const windowGlow = period === 'evening' || period === 'night';

  // ── Foundation shadow ──
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(-5, H + 5, W + 10, 12);

  // ── Main walls ──
  const wallGrad = ctx.createLinearGradient(0, 0, W, 0);
  wallGrad.addColorStop(0, '#c8a870');
  wallGrad.addColorStop(0.15, '#e8c888');
  wallGrad.addColorStop(0.6, '#d8b878');
  wallGrad.addColorStop(0.85, '#c0a060');
  wallGrad.addColorStop(1, '#a88848');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 60, W, H);

  // Wall horizontal board lines (siding)
  ctx.strokeStyle = 'rgba(80,50,10,0.12)'; ctx.lineWidth = 1;
  for (let iy = 70; iy < 60 + H; iy += 12) {
    ctx.beginPath(); ctx.moveTo(0, iy); ctx.lineTo(W, iy); ctx.stroke();
  }

  // ── Roof ──
  const roofGrad = ctx.createLinearGradient(0, 0, W, 0);
  roofGrad.addColorStop(0, '#6a2818');
  roofGrad.addColorStop(0.5, '#8c3a22');
  roofGrad.addColorStop(1, '#6a2818');
  ctx.fillStyle = roofGrad;
  ctx.beginPath();
  ctx.moveTo(-15, 62); ctx.lineTo(W / 2, 0); ctx.lineTo(W + 15, 62);
  ctx.closePath(); ctx.fill();
  // Roof shadow underside
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.moveTo(-15, 62); ctx.lineTo(W + 15, 62); ctx.lineTo(W + 5, 68); ctx.lineTo(-5, 68); ctx.closePath(); ctx.fill();
  // Roof ridge cap
  ctx.fillStyle = '#7a3020'; ctx.fillRect(W/2 - 8, 0, 16, 65);
  // Roof shingles (rows)
  ctx.strokeStyle = 'rgba(40,10,0,0.2)'; ctx.lineWidth = 1.5;
  for (let ry = 10; ry < 62; ry += 8) {
    const rxw = (ry / 62) * (W + 30) * 0.5;
    ctx.beginPath(); ctx.moveTo(W/2 - rxw, ry + 62 * 0.08); ctx.lineTo(W/2 + rxw, ry + 62 * 0.08); ctx.stroke();
  }

  // ── Chimney ──
  ctx.fillStyle = '#7a5030';
  ctx.fillRect(W * 0.65, -35, 22, 55);
  ctx.fillStyle = '#9a6040'; ctx.fillRect(W * 0.65 - 3, -37, 28, 7);
  // Chimney top bricks
  ctx.strokeStyle = 'rgba(50,20,0,0.3)'; ctx.lineWidth = 0.8;
  for (let ci = 0; ci < 4; ci++) {
    ctx.beginPath(); ctx.moveTo(W * 0.65, -35 + ci * 8); ctx.lineTo(W * 0.65 + 22, -35 + ci * 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W * 0.65 + 11, -35 + ci * 8); ctx.lineTo(W * 0.65 + 11, -35 + (ci + 1) * 8); ctx.stroke();
  }
  // Smoke puffs
  if (period === 'morning' || period === 'evening') {
    for (let si = 0; si < 4; si++) {
      const age = ((t * 0.3 + si * 0.7) % 2.8) / 2.8;
      const sy = -37 - age * 60 + Math.sin(age * Math.PI) * 15;
      const sx = W * 0.65 + 11 + Math.sin(t * 0.8 + si) * 6;
      const sr = (4 + age * 12) * 0.8;
      ctx.fillStyle = `rgba(200,195,185,${(1 - age) * 0.35})`;
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ── Windows ──
  const windows = [
    { x: 30, y: 80, w: 65, h: 55 },
    { x: 200, y: 80, w: 65, h: 55 },
    { x: 118, y: 80, w: 60, h: 45 }, // center smaller
  ];
  windows.forEach(win => {
    // Window frame
    ctx.fillStyle = '#7a5030';
    ctx.fillRect(win.x - 4, win.y - 4, win.w + 8, win.h + 8);
    GFX.roundRect(ctx, win.x - 4, win.y - 4, win.w + 8, win.h + 8, 4); ctx.fill();

    // Glass
    if (windowGlow) {
      // Warm interior light
      ctx.fillStyle = `rgba(255,200,80,${0.7 + Math.sin(t * 0.5) * 0.05})`;
      ctx.shadowColor = '#ff9933'; ctx.shadowBlur = 18;
    } else {
      ctx.fillStyle = '#b8d8f0';
    }
    GFX.roundRect(ctx, win.x, win.y, win.w, win.h, 3); ctx.fill();
    ctx.shadowBlur = 0;

    // Window cross-frame
    ctx.strokeStyle = '#7a5030'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(win.x + win.w / 2, win.y); ctx.lineTo(win.x + win.w / 2, win.y + win.h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(win.x, win.y + win.h / 2); ctx.lineTo(win.x + win.w, win.y + win.h / 2); ctx.stroke();

    // Glass reflection
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.moveTo(win.x + 4, win.y + 4); ctx.lineTo(win.x + win.w - 10, win.y + 4); ctx.lineTo(win.x + 4, win.y + win.h * 0.4); ctx.closePath(); ctx.fill();

    // Curtains
    ctx.fillStyle = windowGlow ? 'rgba(220,140,60,0.4)' : 'rgba(200,180,150,0.3)';
    ctx.fillRect(win.x, win.y, win.w * 0.25, win.h);
    ctx.fillRect(win.x + win.w * 0.75, win.y, win.w * 0.25, win.h);
  });

  // ── Door ──
  ctx.fillStyle = '#5a3010';
  GFX.roundRect(ctx, 118, 170, 64, 100, 6); ctx.fill();
  // Door panels
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2;
  ctx.strokeRect(122, 174, 26, 40); ctx.strokeRect(152, 174, 26, 40);
  ctx.strokeRect(122, 218, 56, 48);
  // Doorknob
  const kgr = ctx.createRadialGradient(135, 222, 1, 135, 222, 5);
  kgr.addColorStop(0, '#ffee88'); kgr.addColorStop(1, '#cc9922');
  ctx.fillStyle = kgr;
  ctx.beginPath(); ctx.arc(135, 222, 5, 0, Math.PI * 2); ctx.fill();
  // Door arch
  ctx.fillStyle = '#7a4020';
  ctx.beginPath(); ctx.arc(150, 170, 32, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5a3010';
  GFX.roundRect(ctx, 118, 155, 64, 20, 4); ctx.fill();

  // ── Porch / steps ──
  ctx.fillStyle = '#b89868';
  ctx.fillRect(95, 268, 110, 18);
  ctx.fillStyle = '#c8a878';
  ctx.fillRect(90, 282, 120, 12);
  // Porch boards
  ctx.strokeStyle = 'rgba(80,40,0,0.15)'; ctx.lineWidth = 1;
  for (let bx = 90; bx < 210; bx += 18) { ctx.beginPath(); ctx.moveTo(bx, 268); ctx.lineTo(bx, 294); ctx.stroke(); }
  // Porch railings
  ctx.strokeStyle = '#9a7040'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(90, 270); ctx.lineTo(90, 268); ctx.lineTo(210, 268); ctx.lineTo(210, 270); ctx.stroke();
  for (let px = 95; px < 210; px += 15) { ctx.beginPath(); ctx.moveTo(px, 268); ctx.lineTo(px, 283); ctx.stroke(); }

  // ── Name sign ──
  ctx.fillStyle = '#6a4020';
  GFX.roundRect(ctx, 105, 30, 90, 22, 4); ctx.fill();
  ctx.strokeStyle = '#4a2a10'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#f0d080';
  ctx.font = 'bold 9px serif'; ctx.textAlign = 'center';
  ctx.fillText('Загородный дом', 150, 45);

  ctx.restore();
}

/* === BARN === */
function drawBarn(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y);
  const W = 140, H = 120;

  GFX.shadow(ctx, W/2, H + 8, 55, 10, 0.18);

  // Walls
  const wg = ctx.createLinearGradient(0, 0, W, 0);
  wg.addColorStop(0, '#6a2808'); wg.addColorStop(0.3, '#8b3a10'); wg.addColorStop(1, '#5a2206');
  ctx.fillStyle = wg; ctx.fillRect(0, 35, W, H);
  // Board lines
  ctx.strokeStyle = 'rgba(30,0,0,0.2)'; ctx.lineWidth = 1;
  for (let iy = 40; iy < 35 + H; iy += 14) { ctx.beginPath(); ctx.moveTo(0, iy); ctx.lineTo(W, iy); ctx.stroke(); }
  // Vertical boards
  for (let ix = 0; ix < W; ix += 18) { ctx.beginPath(); ctx.moveTo(ix, 35); ctx.lineTo(ix, 35 + H); ctx.stroke(); }

  // Roof
  const rg = ctx.createLinearGradient(0, 0, W, 0);
  rg.addColorStop(0, '#3a1808'); rg.addColorStop(0.5, '#5a2810'); rg.addColorStop(1, '#3a1808');
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.moveTo(-10, 37); ctx.lineTo(W/2, 0); ctx.lineTo(W+10, 37); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(20,0,0,0.3)'; ctx.lineWidth = 1.5;
  for (let ri = 0; ri < 6; ri++) {
    const ry = ri * 6;
    const rw = ((ry+37) / 37) * (W/2 + 10);
    ctx.beginPath(); ctx.moveTo(W/2 - rw, ry+37); ctx.lineTo(W/2 + rw, ry+37); ctx.stroke();
  }

  // Door (double)
  ctx.fillStyle = '#3a1808';
  ctx.fillRect(45, 90, 50, H - 55);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2;
  ctx.strokeRect(46, 91, 23, H - 57); ctx.strokeRect(70, 91, 23, H - 57);
  ctx.beginPath(); ctx.moveTo(70, 91); ctx.lineTo(70, 35 + H - 1); ctx.stroke();
  // Door X brace
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(46, 91); ctx.lineTo(68, 35+H-2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(68, 91); ctx.lineTo(46, 35+H-2); ctx.stroke();

  // Padlock
  ctx.fillStyle = '#cc9922'; ctx.beginPath(); ctx.arc(70, 125, 4, 0, Math.PI*2); ctx.fill();

  // Small hay window
  ctx.fillStyle = '#ffdd88';
  ctx.beginPath(); ctx.arc(W/2, 22, 12, Math.PI, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#5a2810'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(W/2, 22, 12, Math.PI, Math.PI*2); ctx.stroke();
  ctx.fillStyle = 'rgba(30,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(W/2, 10); ctx.lineTo(W/2, 22); ctx.lineTo(W/2-12, 22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W/2, 22); ctx.lineTo(W/2+12, 22); ctx.stroke();

  // Hay bale visible inside
  ctx.fillStyle = '#c8a040'; ctx.beginPath(); ctx.ellipse(W*0.3, 35+H-20, 15, 10, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#a88030'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W*0.3-15, 35+H-20); ctx.lineTo(W*0.3+15, 35+H-20); ctx.stroke();

  // Sign
  ctx.fillStyle = '#6a4020'; ctx.fillRect(W/2-20, 50, 40, 15);
  ctx.fillStyle = '#f0d080'; ctx.font = '8px serif'; ctx.textAlign = 'center';
  ctx.fillText('🏚️ Сарай', W/2, 62);

  ctx.restore();
}

/* === WELL === */
function drawWell(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y);
  GFX.shadow(ctx, 28, 58, 22, 7, 0.2);

  // Stone base
  const sg = ctx.createLinearGradient(0, 20, 56, 20);
  sg.addColorStop(0, '#7a7060'); sg.addColorStop(0.5, '#9a9080'); sg.addColorStop(1, '#6a6050');
  ctx.fillStyle = sg; ctx.fillRect(0, 20, 56, 40);
  // Stone texture
  ctx.strokeStyle = 'rgba(50,40,20,0.25)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(0, 38); ctx.lineTo(56, 38); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, 20); ctx.lineTo(14, 60); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(42, 20); ctx.lineTo(42, 60); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(28, 38); ctx.lineTo(28, 60); ctx.stroke();

  // Water inside
  const wt = Math.sin(t * 2) * 2;
  const wg = ctx.createLinearGradient(0, 0, 0, 20);
  wg.addColorStop(0, '#4488cc'); wg.addColorStop(1, '#224488');
  ctx.fillStyle = wg; ctx.fillRect(4, 22, 48, 18);
  ctx.fillStyle = 'rgba(150,220,255,0.3)';
  ctx.beginPath(); ctx.ellipse(28, 30 + wt, 18, 4, 0, 0, Math.PI*2); ctx.fill();

  // Posts
  ctx.fillStyle = '#8b6020'; ctx.fillRect(-2, -30, 8, 52); ctx.fillRect(50, -30, 8, 52);
  // Beam
  ctx.fillStyle = '#7a5018'; ctx.fillRect(-4, -32, 64, 8);
  // Rope
  ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(28, -24); ctx.lineTo(28, 20); ctx.stroke();
  // Bucket
  ctx.fillStyle = '#5a8060'; ctx.fillRect(18, 10, 20, 14);
  ctx.strokeStyle = '#3a6040'; ctx.lineWidth = 1.5; ctx.strokeRect(18, 10, 20, 14);
  ctx.fillStyle = '#4488cc'; ctx.fillRect(20, 12, 16, 6);
  // Handle
  ctx.strokeStyle = '#888866'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(28, 10, 10, Math.PI, Math.PI*2); ctx.stroke();

  ctx.restore();
}

/* === POND === */
function drawPond(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y);
  const W = 260, H = 180;

  // Shore shadow
  ctx.fillStyle = '#2a5010'; ctx.beginPath(); ctx.ellipse(W/2+5, H/2+5, W/2+5, H/2+5, 0, 0, Math.PI*2); ctx.fill();

  // Shore / bank
  const bankGrad = ctx.createRadialGradient(W/2, H/2, W/2-15, W/2, H/2, W/2+15);
  bankGrad.addColorStop(0, '#4a9020'); bankGrad.addColorStop(0.7, '#3d7a18'); bankGrad.addColorStop(1, '#2d5a10');
  ctx.fillStyle = bankGrad; ctx.beginPath(); ctx.ellipse(W/2, H/2, W/2+12, H/2+12, 0, 0, Math.PI*2); ctx.fill();

  // Sandy bank edge
  ctx.fillStyle = '#c8a860'; ctx.beginPath(); ctx.ellipse(W/2, H/2, W/2+4, H/2+4, 0, 0, Math.PI*2); ctx.fill();

  // Water gradient
  const wg = ctx.createRadialGradient(W/2-20, H/2-15, 10, W/2, H/2, W/2);
  wg.addColorStop(0, '#5599dd'); wg.addColorStop(0.4, '#3377bb'); wg.addColorStop(0.8, '#1a5599'); wg.addColorStop(1, '#0d3366');
  ctx.fillStyle = wg; ctx.beginPath(); ctx.ellipse(W/2, H/2, W/2, H/2, 0, 0, Math.PI*2); ctx.fill();

  // Water surface ripples
  ctx.strokeStyle = 'rgba(180,230,255,0.25)'; ctx.lineWidth = 1.5;
  for (let ri = 0; ri < 6; ri++) {
    const rphase = (t * 0.8 + ri * 1.1) % (Math.PI * 2);
    const rr = 20 + ri * 25 + Math.sin(rphase) * 8;
    const ra = 0.3 - ri * 0.04;
    ctx.globalAlpha = ra * Math.abs(Math.sin(rphase));
    ctx.beginPath(); ctx.ellipse(W/2 + ri*3, H/2, rr, rr * 0.4, 0, 0, Math.PI*2); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Highlight (sun reflection)
  const hlg = ctx.createRadialGradient(W/2-30, H/2-25, 5, W/2-30, H/2-25, 60);
  hlg.addColorStop(0, 'rgba(255,255,255,0.25)'); hlg.addColorStop(1, 'transparent');
  ctx.fillStyle = hlg; ctx.beginPath(); ctx.ellipse(W/2, H/2, W/2, H/2, 0, 0, Math.PI*2); ctx.fill();

  // Lily pads
  [[W*0.3, H*0.4], [W*0.6, H*0.6], [W*0.5, H*0.3], [W*0.7, H*0.45]].forEach(([lx, ly]) => {
    ctx.fillStyle = '#2a6a10'; ctx.beginPath(); ctx.ellipse(lx, ly, 10, 7, Math.random() * 0.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ff8899'; ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI*2); ctx.fill(); // flower
    ctx.strokeStyle = '#1a5008'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(lx, ly - 7); ctx.lineTo(lx, ly); ctx.stroke();
  });

  // Reeds on bank edge
  const reedPositions = [[W*0.05, H*0.3], [W*0.08, H*0.45], [W*0.12, H*0.6], [W*0.9, H*0.4], [W*0.88, H*0.55], [W*0.5, H*0.88], [W*0.4, H*0.9]];
  reedPositions.forEach(([rx, ry]) => {
    const rsway = Math.sin(t * 1.5 + rx * 0.05) * 3;
    ctx.strokeStyle = '#5a7a30'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(rx, ry); ctx.quadraticCurveTo(rx + rsway, ry - 20, rx + rsway * 1.5, ry - 38); ctx.stroke();
    ctx.fillStyle = '#3a4a18';
    ctx.beginPath(); ctx.ellipse(rx + rsway * 1.5, ry - 38, 3.5, 8, 0, 0, Math.PI*2); ctx.fill();
  });

  // Ducks
  [[W*0.35, H*0.5], [W*0.45, H*0.55]].forEach(([dx, dy]) => {
    const dbob = Math.sin(t * 1.5 + dx) * 2;
    ctx.fillStyle = '#f8f0d8';
    ctx.beginPath(); ctx.ellipse(dx, dy + dbob, 12, 8, 0.1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(dx+10, dy-5+dbob, 7, 6, -0.2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#f0a020';
    ctx.beginPath(); ctx.moveTo(dx+16, dy-5+dbob); ctx.lineTo(dx+20, dy-4+dbob); ctx.lineTo(dx+16, dy-2+dbob); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(dx+13, dy-7+dbob, 1.5, 0, Math.PI*2); ctx.fill();
    // Wing detail
    ctx.strokeStyle = '#d8d0b8'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(dx-2, dy+1+dbob, 8, 4, 0.1, 0, Math.PI); ctx.stroke();
  });

  ctx.restore();
}

/* === GREENHOUSE === */
function drawGreenhouse(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y);
  const W = 220, H = 220;

  GFX.shadow(ctx, W/2, H+8, 85, 14, 0.2);

  // Frame (rusty metal)
  ctx.strokeStyle = '#6a7a5a'; ctx.lineWidth = 4;
  // Main panels
  for (let px = 0; px < 5; px++) {
    const fx = px * (W/4);
    ctx.beginPath(); ctx.moveTo(fx, 0); ctx.lineTo(fx, H); ctx.stroke();
  }
  for (let py = 0; py < 5; py++) {
    ctx.beginPath(); ctx.moveTo(0, py*(H/4)); ctx.lineTo(W, py*(H/4)); ctx.stroke();
  }

  // Glass panels (slightly fogged, overgrown)
  for (let px = 0; px < 4; px++) {
    for (let py = 0; py < 4; py++) {
      const gx = px * (W/4) + 2, gy = py * (H/4) + 2, gw = W/4 - 4, gh = H/4 - 4;
      // Alternating dirt/clean
      const dirt = (px + py) % 3 === 0;
      const moss = (px * 7 + py * 3) % 5 === 0;
      ctx.fillStyle = dirt
        ? `rgba(120,100,60,${0.2 + Math.random()*0.05})`
        : moss
          ? 'rgba(60,100,30,0.35)'
          : `rgba(180,230,200,${0.15 + Math.sin(t*0.5+px+py)*0.05})`;
      ctx.fillRect(gx, gy, gw, gh);
      // Glass shine
      if (!dirt) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(gx+2, gy+2, gw*0.4, gh*0.3);
      }
    }
  }

  // Outline frame
  ctx.strokeStyle = '#4a5a3a'; ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, W, H);

  // Roof
  ctx.fillStyle = 'rgba(160,200,160,0.2)';
  ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(W/2, -45); ctx.lineTo(W+5, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#5a6a4a'; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(W/2, -45); ctx.lineTo(W+5, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, -45); ctx.stroke();
  for (let ri = 1; ri < 4; ri++) {
    const rw = ri * (W/2+5)/4;
    ctx.strokeStyle = '#4a5a3a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(W/2-rw, -ri*11+0); ctx.lineTo(W/2+rw, -ri*11+0); ctx.stroke();
  }

  // Interior plants glow
  const pg = ctx.createRadialGradient(W/2, H/2, 10, W/2, H/2, H*0.6);
  pg.addColorStop(0, 'rgba(80,200,80,0.12)'); pg.addColorStop(1, 'transparent');
  ctx.fillStyle = pg; ctx.fillRect(0, 0, W, H);

  // Vines on frame
  ctx.strokeStyle = '#3a7a20'; ctx.lineWidth = 2;
  for (let vi = 0; vi < 5; vi++) {
    const vx = vi * (W/4);
    const vsway = Math.sin(t * 0.8 + vi) * 4;
    ctx.beginPath();
    ctx.moveTo(vx, 0);
    for (let vy = 0; vy < H; vy += 20) {
      ctx.quadraticCurveTo(vx + vsway + (vy%40===0?6:-6), vy+10, vx + vsway*0.5, vy+20);
    }
    ctx.stroke();
    // Leaves
    for (let vy = 0; vy < H; vy += 35) {
      if ((vi + vy/35) % 2 === 0) {
        ctx.fillStyle = '#4a9a20'; ctx.save();
        ctx.translate(vx + vsway*0.5 + 8, vy + 15);
        ctx.rotate(0.4); ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }
    }
  }

  // Door
  ctx.fillStyle = '#4a5a3a';
  GFX.roundRect(ctx, W/2-20, H-55, 40, 55, 4); ctx.fill();
  ctx.strokeStyle = '#2a3a1a'; ctx.lineWidth = 1.5; ctx.stroke();
  // Door glass
  ctx.fillStyle = 'rgba(160,220,160,0.3)';
  ctx.fillRect(W/2-16, H-50, 32, 45);
  // Padlock
  ctx.fillStyle = '#8a7040'; ctx.beginPath(); ctx.arc(W/2, H-25, 4, 0, Math.PI*2); ctx.fill();

  // Label
  ctx.fillStyle = '#2a4a1a';
  GFX.roundRect(ctx, W/2-50, H-10, 100, 18, 4); ctx.fill();
  ctx.fillStyle = '#a0c870'; ctx.font = '9px serif'; ctx.textAlign = 'center';
  ctx.fillText('🌿 Заброшенная теплица', W/2, H+3);

  ctx.restore();
}

/* === FENCE === */
function drawFence(ctx, ox, y, worldW, t) {
  ctx.save();
  const postColor = '#8a6020';
  const boardColor = '#a07830';
  const shadowColor = 'rgba(40,20,0,0.25)';

  // Shadow line
  ctx.fillStyle = shadowColor;
  ctx.fillRect(ox, y + 22, worldW, 6);

  for (let fx = ox; fx < ox + worldW; fx += 24) {
    const isPost = (fx - ox) % 96 < 4;
    // Plank
    ctx.fillStyle = isPost ? postColor : boardColor;
    // Slightly vary plank color
    const brightness = 0.9 + ((fx * 37) % 30) / 100;
    ctx.globalAlpha = brightness;
    ctx.fillRect(fx, y, 5, 24);
    ctx.globalAlpha = 1;

    // Top (pointed)
    ctx.fillStyle = isPost ? postColor : boardColor;
    ctx.beginPath(); ctx.moveTo(fx, y); ctx.lineTo(fx + 2.5, y - 6); ctx.lineTo(fx + 5, y); ctx.closePath(); ctx.fill();

    // Grain lines
    ctx.strokeStyle = 'rgba(50,20,0,0.15)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(fx + 1.5, y); ctx.lineTo(fx + 1.5, y + 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx + 3.5, y); ctx.lineTo(fx + 3.5, y + 22); ctx.stroke();
  }

  // Horizontal rails
  const railGrad = ctx.createLinearGradient(ox, y + 7, ox, y + 12);
  railGrad.addColorStop(0, '#c09040'); railGrad.addColorStop(1, '#8a6020');
  ctx.fillStyle = railGrad;
  ctx.fillRect(ox, y + 7, worldW, 5);
  ctx.fillRect(ox, y + 16, worldW, 4);

  // Moss/lichen on posts
  ctx.fillStyle = 'rgba(50,100,20,0.15)';
  for (let fx = ox; fx < ox + worldW; fx += 96) {
    ctx.beginPath(); ctx.ellipse(fx + 2.5, y + 15, 6, 4, 0, 0, Math.PI*2); ctx.fill();
  }

  ctx.restore();
}

/* === WEATHER EFFECTS === */
function drawWeatherEffects(ctx, weather, cam, cw, ch, t) {
  const w = weather;
  if (w.current === 'rain') {
    // Raindrops
    ctx.strokeStyle = 'rgba(150,190,255,0.4)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 80; i++) {
      const seed = i * 137.5;
      const rx = ((seed * 7.3 + t * 180) % (cw + 60)) - 30;
      const ry = ((seed * 4.7 + t * 280) % (ch + 40)) - 20;
      const len = 8 + (seed % 7);
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + len); ctx.stroke();
    }
    // Puddles (static)
    ctx.fillStyle = 'rgba(80,120,200,0.2)';
    [[cw*0.2,ch*0.7],[cw*0.5,ch*0.8],[cw*0.75,ch*0.65]].forEach(([px,py]) => {
      ctx.beginPath(); ctx.ellipse(px, py, 30+Math.sin(t*3)*5, 8+Math.sin(t*2)*2, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(150,200,255,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(px, py, 10+Math.sin(t*4+px)*8, 3+Math.sin(t*3)*2, 0, 0, Math.PI*2); ctx.stroke();
    });
  }
  if (w.current === 'fog') {
    for (let i = 0; i < 5; i++) {
      const fx = ((t * 15 * (1+i*0.2) + i*cw/5) % (cw+400)) - 200;
      const fy = ch * (0.3 + i * 0.1);
      const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, 200+i*50);
      fg.addColorStop(0, `rgba(220,230,240,${0.08+i*0.01})`);
      fg.addColorStop(1, 'transparent');
      ctx.fillStyle = fg; ctx.fillRect(0, 0, cw, ch);
    }
  }
  if (w.current === 'wind') {
    ctx.strokeStyle = 'rgba(200,220,255,0.15)'; ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      const seed = i * 73.1;
      const wx = ((seed * 11 + t * 200) % (cw + 100)) - 50;
      const wy = seed * 4.7 % ch;
      const len = 40 + seed % 60;
      ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + len, wy + 3); ctx.stroke();
    }
  }
  if (w.current === 'starry') {
    // Additional shooting stars
    if (Math.sin(t * 0.3) > 0.98) {
      const ss = (t * 0.3) % 1;
      ctx.strokeStyle = 'rgba(255,255,200,0.7)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cw * 0.2, ch * 0.1); ctx.lineTo(cw * 0.4, ch * 0.25); ctx.stroke();
    }
  }
}

/* === LIGHTING OVERLAY === */
function drawLightingOverlay(ctx, cw, ch, period, t, cam, weatherType) {
  ctx.save();
  if (period === 'night') {
    // Deep blue-purple night filter
    const ng = ctx.createLinearGradient(0, 0, 0, ch);
    ng.addColorStop(0, 'rgba(5,5,40,0.55)');
    ng.addColorStop(1, 'rgba(15,10,50,0.45)');
    ctx.fillStyle = ng; ctx.fillRect(0, 0, cw, ch);
    // Moonlight shaft
    ctx.fillStyle = 'rgba(200,210,255,0.04)';
    ctx.beginPath(); ctx.moveTo(cw*0.75, 0); ctx.lineTo(cw*0.85, 0); ctx.lineTo(cw*0.65, ch); ctx.lineTo(cw*0.55, ch); ctx.closePath(); ctx.fill();
  } else if (period === 'evening') {
    // Warm golden hour
    const eg = ctx.createLinearGradient(0, 0, cw, ch);
    eg.addColorStop(0, 'rgba(255,120,40,0.12)');
    eg.addColorStop(0.5, 'rgba(255,160,60,0.08)');
    eg.addColorStop(1, 'rgba(100,40,80,0.15)');
    ctx.fillStyle = eg; ctx.fillRect(0, 0, cw, ch);
  } else if (period === 'morning') {
    // Cool morning mist
    ctx.fillStyle = 'rgba(200,230,255,0.07)'; ctx.fillRect(0, 0, cw, ch);
  }

  // Window light beams (evening/night)
  if (period === 'evening' || period === 'night') {
    const houseX = 150 - cam.x, houseY = 50 - cam.y;
    // Window positions relative to house
    const wins = [[houseX+30+32, houseY+80+27], [houseX+200+32, houseY+80+27]];
    wins.forEach(([wx, wy]) => {
      const wg = ctx.createRadialGradient(wx, wy, 5, wx, wy+40, 80);
      wg.addColorStop(0, 'rgba(255,200,80,0.2)');
      wg.addColorStop(1, 'transparent');
      ctx.fillStyle = wg; ctx.fillRect(0, 0, cw, ch);
      // Light beam cone
      ctx.fillStyle = 'rgba(255,200,80,0.06)';
      ctx.beginPath(); ctx.moveTo(wx-20, wy+30); ctx.lineTo(wx-50, wy+120); ctx.lineTo(wx+50, wy+120); ctx.lineTo(wx+20, wy+30); ctx.closePath(); ctx.fill();
    });
  }

  // Dust particles (day/morning)
  if (period === 'day' || period === 'morning') {
    ctx.fillStyle = 'rgba(255,240,180,0.45)';
    for (let i = 0; i < 15; i++) {
      const seed = i * 137.5;
      const dx = ((seed * 5.3 + t * 8) % cw);
      const dy = ((seed * 7.1 + t * 5 + Math.sin(t + seed) * 30) % (ch * 0.6));
      const ds = 1 + Math.sin(t * 2 + seed) * 0.5;
      const da = 0.2 + Math.sin(t * 1.5 + seed * 0.1) * 0.15;
      ctx.globalAlpha = da;
      ctx.beginPath(); ctx.arc(dx, dy, ds, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

/* === FIREFLIES === */
function drawFireflies(ctx, fireflies, cam, t) {
  fireflies.forEach((f, i) => {
    const sx = f.x - cam.x, sy = f.y - cam.y;
    if (sx < -20 || sx > ctx.canvas.width + 20 || sy < -20 || sy > ctx.canvas.height + 20) return;

    const pulse = 0.4 + 0.6 * Math.abs(Math.sin(f.phase));
    const size = 2.5 + Math.sin(f.phase * 1.3) * 0.8;

    // Outer glow
    const gg = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 6);
    gg.addColorStop(0, `rgba(160,255,80,${pulse * 0.5})`);
    gg.addColorStop(0.5, `rgba(100,220,60,${pulse * 0.2})`);
    gg.addColorStop(1, 'transparent');
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(sx, sy, size * 6, 0, Math.PI * 2); ctx.fill();

    // Core
    ctx.fillStyle = `rgba(210,255,120,${pulse})`;
    ctx.shadowColor = '#80ff40'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(sx, sy, size, 0, Math.PI * 2); ctx.fill();

    // Bright center
    ctx.fillStyle = `rgba(255,255,200,${pulse * 0.9})`;
    ctx.beginPath(); ctx.arc(sx, sy, size * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Trail
    ctx.strokeStyle = `rgba(160,255,80,${pulse * 0.15})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - f.vx * 0.2, sy - f.vy * 0.2); ctx.stroke();
  });
}

/* === COLLECTIBLE ITEMS === */
function drawCollectible(ctx, item, x, y, t) {
  const bob = Math.sin(t * 2.5 + x * 0.1) * 3;
  const spin = t * 0.8;
  const pulse = 0.6 + 0.4 * Math.sin(t * 3 + x);

  ctx.save();
  ctx.translate(x, y + bob);

  // Outer glow
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
  glow.addColorStop(0, 'rgba(255,220,80,0.5)');
  glow.addColorStop(0.5, 'rgba(255,180,40,0.2)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();

  // Sparkle stars
  ctx.fillStyle = `rgba(255,240,100,${pulse * 0.8})`;
  for (let si = 0; si < 4; si++) {
    const sa = spin + si * Math.PI / 2;
    const sr = 12 + Math.sin(t * 3 + si) * 2;
    ctx.beginPath(); ctx.arc(Math.cos(sa) * sr, Math.sin(sa) * sr, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  // Item icon (emoji on canvas)
  ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(255,200,50,0.6)'; ctx.shadowBlur = 6;
  ctx.fillText(item.icon[0] || '?', 0, 0);
  ctx.shadowBlur = 0;

  ctx.restore();
}

/* ──────────────────────────────────────────────
   DIALOGUE PORTRAIT RENDERER
   ────────────────────────────────────────────── */
function drawPortrait(ctx, id, mood = 'neutral') {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const cx = W / 2, cy = H / 2;

  if (id === 'ryzhik') {
    // Рыжик portrait — big head view
    const grad = ctx.createRadialGradient(cx-5, cy-5, 8, cx, cy, 40);
    grad.addColorStop(0, '#f07030'); grad.addColorStop(1, '#c04808');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.ellipse(cx, cy, 35, 32, 0, 0, Math.PI*2); ctx.fill();
    // Ears
    ctx.fillStyle = '#c04808';
    ctx.beginPath(); ctx.moveTo(cx-25, cy-20); ctx.lineTo(cx-32, cy-40); ctx.lineTo(cx-10, cy-25); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+25, cy-20); ctx.lineTo(cx+32, cy-40); ctx.lineTo(cx+10, cy-25); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff9966';
    ctx.beginPath(); ctx.moveTo(cx-24, cy-22); ctx.lineTo(cx-30, cy-37); ctx.lineTo(cx-12, cy-26); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+24, cy-22); ctx.lineTo(cx+30, cy-37); ctx.lineTo(cx+12, cy-26); ctx.closePath(); ctx.fill();
    // Eyes
    const eyeExp = { happy:[0.8,1.1], neutral:[1,1], sad:[0.7,0.9], surprised:[1.4,1.4] }[mood] || [1,1];
    ctx.fillStyle = '#fff8f0'; ctx.beginPath(); ctx.ellipse(cx-14, cy-6, 11*eyeExp[0], 12*eyeExp[1], 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff8f0'; ctx.beginPath(); ctx.ellipse(cx+14, cy-6, 11*eyeExp[0], 12*eyeExp[1], 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#88cc44'; ctx.beginPath(); ctx.ellipse(cx-14, cy-6, 8*eyeExp[0], 9*eyeExp[1], 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a0a00'; ctx.beginPath(); ctx.ellipse(cx-14, cy-6, 4, 8*eyeExp[1], 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#88cc44'; ctx.beginPath(); ctx.ellipse(cx+14, cy-6, 8*eyeExp[0], 9*eyeExp[1], 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a0a00'; ctx.beginPath(); ctx.ellipse(cx+14, cy-6, 4, 8*eyeExp[1], 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(cx-17, cy-9, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+11, cy-9, 3, 0, Math.PI*2); ctx.fill();
    // Nose & whiskers
    ctx.fillStyle = '#ff7799'; ctx.beginPath(); ctx.moveTo(cx-4,cy+6); ctx.lineTo(cx+4,cy+6); ctx.lineTo(cx,cy+9); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,250,230,0.8)'; ctx.lineWidth = 1.2;
    [[-2,4],[0,5],[1,6]].forEach(([wy]) => { ctx.beginPath(); ctx.moveTo(cx-4,cy+wy); ctx.lineTo(cx-22,cy+wy-2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx+4,cy+wy); ctx.lineTo(cx+22,cy+wy-2); ctx.stroke(); });
    // Mouth expression
    ctx.strokeStyle = '#cc4466'; ctx.lineWidth = 1.5;
    if (mood === 'happy') {
      ctx.beginPath(); ctx.moveTo(cx-8, cy+11); ctx.quadraticCurveTo(cx, cy+18, cx+8, cy+11); ctx.stroke();
    } else if (mood === 'sad') {
      ctx.beginPath(); ctx.moveTo(cx-8, cy+14); ctx.quadraticCurveTo(cx, cy+9, cx+8, cy+14); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(cx, cy+9); ctx.quadraticCurveTo(cx-5, cy+12, cx-7, cy+11); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy+9); ctx.quadraticCurveTo(cx+5, cy+12, cx+7, cy+11); ctx.stroke();
    }
    return;
  }

  // Human portraits
  const style = NPC_STYLES[id];
  if (!style) {
    ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '24px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('?', cx, cy);
    return;
  }

  // Background glow matching character color
  const bg = ctx.createRadialGradient(cx, cy, 5, cx, cy, W/2);
  bg.addColorStop(0, style.shirt + '44'); bg.addColorStop(1, 'transparent');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Shoulders/body hint
  ctx.fillStyle = style.shirt;
  ctx.beginPath(); ctx.ellipse(cx, H-5, 38, 20, 0, 0, Math.PI); ctx.fill();

  // Neck
  ctx.fillStyle = style.skin; ctx.fillRect(cx-8, cy+16, 16, 14);

  // Head
  const hg = ctx.createRadialGradient(cx-6, cy-5, 5, cx, cy, 30);
  hg.addColorStop(0, _lighten(style.skin, 20)); hg.addColorStop(1, style.skin);
  ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(cx, cy, 28, 32, 0, 0, Math.PI*2); ctx.fill();

  // Hair
  ctx.save(); ctx.translate(cx, cy); _drawHair(ctx, style.hair, style.hairStyle, 0); ctx.restore();

  // Eyes
  const eyeMoods = { happy: 0.7, neutral: 1, sad: 0.8, surprised: 1.3 };
  const em = eyeMoods[mood] || 1;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(cx-10, cy-4, 8, 9*em, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx+10, cy-4, 8, 9*em, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#2a1a08'; ctx.beginPath(); ctx.ellipse(cx-10, cy-4, 5, 7*em, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx+10, cy-4, 5, 7*em, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(cx-13, cy-6, 2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+7, cy-6, 2, 0, Math.PI*2); ctx.fill();

  // Accessories
  if (style.acc === 'glasses' || style.acc === 'glasses2') {
    const gc = style.acc === 'glasses2' ? '#cc4444' : '#222266';
    ctx.strokeStyle = gc; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx-10, cy-4, 9, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx+10, cy-4, 9, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx-1, cy-4); ctx.lineTo(cx+1, cy-4); ctx.stroke();
  }
  if (style.acc === 'hat') {
    ctx.fillStyle = '#2a1a4a'; ctx.fillRect(cx-30, cy-35, 60, 10);
    ctx.beginPath(); ctx.moveTo(cx-22, cy-35); ctx.lineTo(cx-16, cy-55); ctx.lineTo(cx+16, cy-55); ctx.lineTo(cx+22, cy-35); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd844'; ctx.fillRect(cx-22, cy-38, 44, 5);
  }
  if (style.acc === 'mustache') {
    ctx.fillStyle = '#3a2a10';
    ctx.beginPath(); ctx.ellipse(cx-8, cy+9, 10, 5, -0.2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx+8, cy+9, 10, 5, 0.2, 0, Math.PI*2); ctx.fill();
  }

  // Mouth
  ctx.strokeStyle = _darken(style.skin, 30); ctx.lineWidth = 2;
  if (mood === 'happy') { ctx.beginPath(); ctx.moveTo(cx-10, cy+14); ctx.quadraticCurveTo(cx, cy+22, cx+10, cy+14); ctx.stroke(); }
  else if (mood === 'sad') { ctx.beginPath(); ctx.moveTo(cx-10, cy+18); ctx.quadraticCurveTo(cx, cy+12, cx+10, cy+18); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(cx-8, cy+16); ctx.lineTo(cx+8, cy+16); ctx.stroke(); }

  // Lips for nastya
  if (id === 'nastya') {
    ctx.fillStyle = '#cc3355';
    ctx.beginPath(); ctx.ellipse(cx, cy+15, 8, 3, 0, 0, Math.PI); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy+15, 8, 2, 0, Math.PI, Math.PI*2); ctx.fill();
  }
}

