'use strict';

class World {
  constructor() {
    this.width  = 1600;
    this.height = 1200;
    this.tileSize = 32;
    this._buildObjects();
    this.clouds = [];
    for (let i = 0; i < 8; i++) this.clouds.push({
      x: Math.random() * this.width, y: 20 + Math.random() * 120,
      w: 80 + Math.random() * 120, speed: 5 + Math.random() * 10
    });
    this.waterAnim = 0;
    this.flowers = [];
    for (let i = 0; i < 40; i++) this.flowers.push({
      x: 500 + Math.random() * 400, y: 100 + Math.random() * 400,
      color: ['#ff6699','#ffcc44','#ff44aa','#44aaff','#ffffff'][Math.floor(Math.random()*5)],
      size: 3 + Math.random() * 5, phase: Math.random()*Math.PI*2
    });
    this.fireflies = [];
    this.collectibles = [];
    this._spawnCollectibles();
  }
  _buildObjects() {
    this.solids = [
      { x:150, y:50,  w:300, h:200 },
      { x:50,  y:350, w:120, h:100 },
      { x:80,  y:200, w:50,  h:50  },
      { x:685, y:468, w:185, h:138 },
      { x:1100,y:200, w:200, h:200 },
    ];
  }
  _spawnCollectibles() {
    const items = [
      { x:350, y:380, item:'bowl',     id:'c01' },
      { x:620, y:300, item:'apple',    id:'c02' },
      { x:640, y:280, item:'apple',    id:'c03' },
      { x:580, y:320, item:'seeds',    id:'c04' },
      { x:380, y:460, item:'coin',     id:'c08' },
      { x:635, y:512, item:'fish',     id:'c09' },
      { x:900, y:450, item:'leaf',     id:'c10' },
      { x:450, y:520, item:'pebble',   id:'c11' },
      { x:500, y:530, item:'pebble',   id:'c12' },
      { x:300, y:580, item:'letter',   id:'c13' },
      { x:120, y:240, item:'seeds',    id:'c14' },
      { x:1050,y:300, item:'acorn',    id:'c15' },
      { x:250, y:260, item:'button',   id:'c16' },
      { x:700, y:410, item:'pebble',   id:'c17' },
      { x:900, y:622, item:'bell',     id:'c18' },
      { x:632, y:490, item:'pick',     id:'c20' },
      { x:660, y:340, item:'diary',    id:'c21' },
      { x:350, y:440, item:'flashPart',id:'c22' },
      { x:420, y:290, item:'sticker',  id:'c23' },
      { x:500, y:260, item:'sticker',  id:'c24' },
      { x:600, y:380, item:'sticker',  id:'c25' },
      { x:700, y:290, item:'sticker',  id:'c26' },
      { x:320, y:320, item:'sticker',  id:'c27' },
      { x:820, y:200, item:'feather',  id:'c28' },
      { x:790, y:210, item:'yarn',     id:'c29' },
      { x:950, y:380, item:'moonBell', id:'c30' },
      { x:1200,y:320, item:'sunBell',  id:'c_final' },
      { x:260, y:700, item:'coin',     id:'c31' },
      { x:500, y:830, item:'ribbon',   id:'c32' },
      { x:680, y:740, item:'leaf',     id:'c33' },
      { x:840, y:880, item:'pebble',   id:'c34' },
      { x:370, y:970, item:'seeds',    id:'c35' },
      { x:1040,y:730, item:'feather',  id:'c36' },
      { x:1200,y:660, item:'acorn',    id:'c37' },
      { x:450, y:660, item:'button',   id:'c38' },
      { x:950, y:990, item:'bell',     id:'c39' },
      { x:1320,y:860, item:'pebble',   id:'c40' },
      { x:760, y:960, item:'apple',    id:'c41' },
      { x:620, y:890, item:'yarn',     id:'c42' },
      { x:1100,y:850, item:'coin',     id:'c43' },
      { x:180, y:850, item:'seeds',    id:'c44' },
      { x:185, y:615, item:'compass',  id:'c_compass' },
      { x:960,  y:330, item:'sonyaCompass', id:'c_sonya_compass' },
      { x:200, y:380, item:'tools',    id:'c_tools' },
      { x:230, y:430, item:'plank',    id:'c_plank' },
      { x:75,  y:1115, item:'milStamp', id:'c_milstamp' },
    ];
    this.collectibles = items.map(i => ({ ...i, collected: false }));
  }
  isSolid(x, y, w = 0, h = 0) {
    const hw = w / 2, hh = h / 2;
    for (const s of this.solids) {
      if (x + hw > s.x && x - hw < s.x + s.w && y + hh > s.y && y - hh < s.y + s.h) return true;
    }
    return false;
  }
  currentZone(px, py) {
    for (const z of ZONES) {
      const zx = z.x + 600, zy = z.y + 500;
      if (px > zx && px < zx + z.w && py > zy && py < zy + z.h) return z;
    }
    return ZONES[0];
  }
  update(dt, weather, time) {
    this.waterAnim += dt * 1.2;
    this.clouds.forEach(c => { c.x += c.speed * dt; if (c.x > this.width + 200) c.x = -200; });
    if (time.period === 'night' && this.fireflies.length < 30) {
      this.fireflies.push({
        x: 500 + Math.random() * 600, y: 100 + Math.random() * 500,
        vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*10,
        phase: Math.random()*Math.PI*2, life: 8 + Math.random()*8
      });
    } else if (time.period !== 'night') this.fireflies = [];
    this.fireflies.forEach(f => {
      f.x += f.vx * dt; f.y += f.vy * dt; f.phase += dt * 3; f.life -= dt;
    });
    this.fireflies = this.fireflies.filter(f => f.life > 0);
  }
  draw(ctx, cam, time, weather, ambient) {
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    const ox = -cam.x, oy = -cam.y;
    const t = GFX.t;

    const skyG = ctx.createLinearGradient(0, 0, 0, ch);
    if (time.period === 'night') {
      skyG.addColorStop(0, '#010118'); skyG.addColorStop(0.6, '#05082a'); skyG.addColorStop(1, '#0a1018');
    } else if (time.period === 'evening') {
      skyG.addColorStop(0, '#1a1040'); skyG.addColorStop(0.35, '#c04830'); skyG.addColorStop(0.7, '#f08830'); skyG.addColorStop(1, '#ffa840');
    } else if (time.period === 'morning') {
      skyG.addColorStop(0, '#1a2a4a'); skyG.addColorStop(0.4, '#8090c8'); skyG.addColorStop(0.8, '#d0b888'); skyG.addColorStop(1, '#f0d880');
    } else {
      skyG.addColorStop(0, '#4a88cc'); skyG.addColorStop(0.5, '#78b4e8'); skyG.addColorStop(1, '#a8d0f0');
    }
    ctx.fillStyle = skyG; ctx.fillRect(0, 0, cw, ch);

    if (time.period === 'day' || time.period === 'morning') {
      const sunProg = (time.hour - 5) / 13;
      const sx = cw * (0.08 + sunProg * 0.84), sy = 55 - Math.sin(sunProg * Math.PI) * 30;
      for (let ri = 3; ri >= 0; ri--) {
        const rg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 30 + ri * 22);
        rg.addColorStop(0, `rgba(255,240,100,${0.18 - ri*0.04})`); rg.addColorStop(1, 'transparent');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(sx, sy, 30+ri*22, 0, Math.PI*2); ctx.fill();
      }
      const sg = ctx.createRadialGradient(sx-6, sy-6, 3, sx, sy, 26);
      sg.addColorStop(0, '#ffffd0'); sg.addColorStop(0.5, '#ffe850'); sg.addColorStop(1, '#ffcc00');
      ctx.fillStyle = sg; ctx.shadowColor='#ffdd44'; ctx.shadowBlur=20;
      ctx.beginPath(); ctx.arc(sx, sy, 26, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    } else if (time.period === 'night' || time.period === 'evening') {
      const moonX = cw * 0.78, moonY = 48;
      const mg = ctx.createRadialGradient(moonX-4, moonY-4, 3, moonX, moonY, 22);
      mg.addColorStop(0, '#f8f8ee'); mg.addColorStop(0.7, '#d8d8c8'); mg.addColorStop(1, '#b8b8a8');
      ctx.fillStyle = mg; ctx.shadowColor='#aaaacc'; ctx.shadowBlur=18;
      ctx.beginPath(); ctx.arc(moonX, moonY, 22, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
      ctx.fillStyle='rgba(180,180,168,0.4)';
      [[moonX+6,moonY+4,4],[moonX-5,moonY-6,3],[moonX+4,moonY-8,2.5]].forEach(([cx2,cy2,r])=>{ctx.beginPath();ctx.arc(cx2,cy2,r,0,Math.PI*2);ctx.fill();});
      for (let si=0; si<120; si++) {
        const seed = si * 137.5;
        const starX = (seed * 7.3) % cw, starY = (seed * 4.7) % (ch*0.55);
        const alpha = 0.3 + 0.7 * Math.abs(Math.sin(t*0.5 + seed * 0.1));
        const starR = 0.8 + (seed % 3) * 0.5;
        ctx.fillStyle = `rgba(255,255,240,${alpha})`;
        ctx.beginPath(); ctx.arc(starX, starY, starR, 0, Math.PI*2); ctx.fill();
      }
    }

    this.clouds.forEach(c => {
      const px = c.x + ox * 0.25;
      const alpha = time.period === 'night' ? 0.15 : (time.period === 'evening' ? 0.6 : 0.75);
      const ccolor = time.period === 'evening'
        ? `rgba(255,170,100,${alpha})`
        : time.period === 'night'
          ? `rgba(80,90,140,${alpha})`
          : `rgba(255,255,255,${alpha})`;
      ctx.fillStyle = ccolor;
      ctx.beginPath(); ctx.arc(px, c.y, c.w * 0.22, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(px - c.w*0.18, c.y + 6, c.w * 0.18, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + c.w*0.2, c.y + 8, c.w * 0.17, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + c.w*0.08, c.y + 3, c.w * 0.25, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(px - c.w*0.07, c.y + 8, c.w * 0.2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = `rgba(0,0,0,${0.05 * alpha})`;
      ctx.beginPath(); ctx.ellipse(px + 3, c.y + c.w * 0.2 + 4, c.w * 0.38, c.w * 0.08, 0, 0, Math.PI*2); ctx.fill();
    });

    drawGrass(ctx, ox, oy, this.width, this.height, t);
    drawPath(ctx, 220+ox, 200+oy, 80, 560, t);
    drawPath(ctx, 300+ox, 450+oy, 360, 80, t);
    drawHouse(ctx, 150+ox, 50+oy, t, time.period);
    drawBarn(ctx, 50+ox, 350+oy, t);
    drawWell(ctx, 80+ox, 200+oy, t);

    [[580,80,1.2,0],[620,100,1,1],[560,120,0.9,2],[750,80,1.3,0],[780,60,1.1,1],
     [820,100,1,2],[900,50,1.4,0],[550,400,0.9,1],[580,420,1,2],[680,120,1.1,0],[950,400,0.8,1]
    ].forEach(([tx,ty,sz,vr],i) => drawTree(ctx, tx+ox, ty+oy, sz, vr, t+i*0.3));

    drawFlowers(ctx, this.flowers, t);
    drawPond(ctx, 650+ox, 450+oy, t);
    drawGreenhouse(ctx, 1100+ox, 200+oy, t);

    if (typeof drawMilitaryOffice === 'function') {
      drawMilitaryOffice(ctx, 30+ox, 1080+oy, t, time.period);
    }

    drawFence(ctx, ox, 500+oy, this.width, t);

    this.collectibles.filter(c => !c.collected).forEach(c => {
      const item = ITEMS[c.item]; if (!item) return;
      drawCollectible(ctx, item, c.x+ox, c.y+oy, t);
    });

    drawFireflies(ctx, this.fireflies, cam, t);

    if (ambient) {
      drawAmbientLeaves(ctx, ambient.leaves, cam, t);
      drawAmbientPuddles(ctx, ambient.puddles, cam, t);
    }

    drawWeatherEffects(ctx, weather, cam, cw, ch, t);

    if (ambient) drawAmbientBirds(ctx, ambient.birds, t);

    drawLightingOverlay(ctx, cw, ch, time.period, t, cam, weather.current);
  }

  drawMinimap(ctx, camX, camY, playerX, playerY, npcs, zones) {
    const mw = ctx.canvas.width, mh = ctx.canvas.height;
    const sx = mw / this.width, sy = mh / this.height;

    ctx.fillStyle = '#2a5a10'; ctx.fillRect(0, 0, mw, mh);

    ZONES.forEach(z => {
      const zx = (z.x+600)*sx, zy = (z.y+500)*sy, zw = z.w*sx, zh = z.h*sy;
      if (z.unlocked) {
        ctx.fillStyle = z.color + 'cc'; ctx.fillRect(zx, zy, zw, zh);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(zx, zy, zw, zh);
      }
    });

    ctx.fillStyle = '#c8a060'; ctx.globalAlpha = 0.6;
    ctx.fillRect(220*sx, 200*sy, 80*sx, 560*sy);
    ctx.fillRect(300*sx, 450*sy, 360*sx, 80*sy);
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#4488cc';
    ctx.beginPath(); ctx.ellipse(775*sx, 540*sy, 120*sx, 78*sy, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(100,180,255,0.4)';
    ctx.beginPath(); ctx.ellipse(760*sx, 525*sy, 70*sx, 45*sy, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#d4a060';
    ctx.fillRect(150*sx, 50*sy, 300*sx, 180*sy);
    ctx.fillStyle = '#a03820';
    ctx.beginPath(); ctx.moveTo(150*sx,50*sy); ctx.lineTo(300*sx,22*sy); ctx.lineTo(450*sx,50*sy); ctx.closePath(); ctx.fill();
    ctx.font = `${Math.max(7, mw*0.06)}px serif`; ctx.textAlign = 'center';
    ctx.fillText('🏠', 300*sx, 135*sy);

    ctx.fillStyle = '#6b4226';
    ctx.fillRect(50*sx, 350*sy, 120*sx, 100*sy);
    ctx.font = `${Math.max(6, mw*0.05)}px serif`;
    ctx.fillText('🏚️', 110*sx, 405*sy);

    ctx.fillStyle = '#7a7060';
    ctx.beginPath(); ctx.arc(107*sx, 225*sy, 15*sx, 0, Math.PI*2); ctx.fill();
    ctx.font = `${Math.max(5, mw*0.04)}px serif`;
    ctx.fillText('🪣', 107*sx, 227*sy);

    ctx.fillStyle = '#3a6a3a';
    ctx.fillRect(1100*sx, 200*sy, 200*sx, 200*sy);
    ctx.font = `${Math.max(6, mw*0.05)}px serif`;
    ctx.fillText('🌿', 1200*sx, 300*sy);

    ctx.fillStyle = '#888899';
    ctx.fillRect(Math.round(30*sx), Math.round(1080*sy), Math.round(100*sx), Math.round(8*sy));
    ctx.font = `${Math.max(6, mw*0.05)}px serif`;
    ctx.fillText('🏢', Math.round(80*sx), Math.round(1090*sy));

    npcs.forEach(n => {
      if (!n.visible) return;
      const nx = n.wx*sx, ny = n.wy*sy;
      ctx.fillStyle = n.color || '#fff';
      ctx.beginPath(); ctx.arc(nx, ny, Math.max(2.5, mw*0.022), 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.8;
      ctx.stroke();
      if (typeof NPC_QUEST_DEFS !== 'undefined' && NPC_QUEST_DEFS[n.id]) {
        const qs = n.questStage || 0;
        if (qs < 3) {
          ctx.font = `${Math.max(6, mw*0.05)}px serif`; ctx.textAlign = 'center';
          ctx.fillText(qs === 0 ? '❗' : '🔍', nx, ny - Math.max(4, mw*0.035));
        }
      }
    });

    const px = playerX*sx, py = playerY*sy;
    ctx.fillStyle = '#ff6600'; ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(px, py, Math.max(3, mw*0.028), 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(px, py, Math.max(1.5, mw*0.012), 0, Math.PI*2); ctx.fill();

    ctx.font = `${Math.max(6,mw*0.05)}px serif`; ctx.textAlign = 'center';
  }

  drawBigmap(ctx, unlockedZones, playerX, playerY, npcs) {
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    const sx = cw / this.width, sy = ch / this.height;
    ctx.fillStyle = '#1a3a0a'; ctx.fillRect(0,0,cw,ch);
    ctx.fillStyle = '#3a7a1a'; ctx.fillRect(0,0,cw,ch);
    ZONES.forEach(z => {
      const zx = (z.x+600)*sx, zy = (z.y+500)*sy, zw = z.w*sx, zh = z.h*sy;
      if (unlockedZones.includes(z.id)) {
        ctx.fillStyle = z.color;
        ctx.fillRect(zx,zy,zw,zh);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
        ctx.strokeRect(zx,zy,zw,zh);
        ctx.font = `${Math.max(10,zw*0.15)}px serif`; ctx.textAlign = 'center';
        ctx.fillText(z.icon, zx+zw/2, zy+zh/2);
        ctx.font = '9px system-ui'; ctx.fillStyle = '#fff';
        ctx.fillText(z.name, zx+zw/2, zy+zh/2+12);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(zx,zy,zw,zh);
        ctx.font = '14px serif'; ctx.textAlign = 'center';
        ctx.fillText('🔒', zx+zw/2, zy+zh/2);
      }
    });
    ctx.fillStyle = '#d4b896'; ctx.fillRect(150*sx,50*sy,300*sx,180*sy);
    ctx.fillStyle = '#8b3a2a';
    ctx.beginPath(); ctx.moveTo(150*sx,50*sy); ctx.lineTo(300*sx,30*sy); ctx.lineTo(450*sx,50*sy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4488cc';
    ctx.beginPath(); ctx.ellipse(775*sx, 540*sy, 120*sx, 80*sy, 0, 0, Math.PI*2); ctx.fill();
    npcs.forEach(n => {
      if (!n.visible) return;
      ctx.fillStyle = n.color || '#fff';
      ctx.font = '14px serif'; ctx.textAlign = 'center';
      ctx.fillText(n.emoji, n.wx*sx, n.wy*sy);
    });
    ctx.fillStyle = '#ff6600';
    ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(playerX*sx, playerY*sy, 6, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = '12px serif'; ctx.textAlign = 'center';
    ctx.fillText('😺', playerX*sx, playerY*sy);
  }
}
