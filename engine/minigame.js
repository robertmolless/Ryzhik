'use strict';

class MiniGameSystem {
  constructor(audio, telegram) {
    this.audio    = audio;
    this.telegram = telegram;
    this.active   = null;
    this.canvas   = null;
    this.ctx      = null;
    this.state    = {};
    this.raf      = null;
  }
  start(type, game) {
    this.active = type;
    this.game   = game;
    const scr = document.getElementById('minigame-screen');
    scr.style.display = 'flex';
    document.getElementById('mg-title').textContent = {
      fishing:'🎣 Рыбалка', butterfly:'🦋 Поймай бабочку',
      apples:'🍎 Собери яблоки', fireflies:'✨ Светлячки ночью',
      meow:'🎵 Мяу-концерт'
    }[type] || 'Мини-игра';
    this.canvas = document.getElementById('mg-canvas');
    this.ctx    = this.canvas.getContext('2d');
    this._init(type);
    document.getElementById('mg-close').onclick = () => { this.stop(); };
    this.canvas.onclick = e => { const r = this.canvas.getBoundingClientRect(); this._click(e.clientX-r.left, e.clientY-r.top); };
    this.canvas.ontouchstart = e => { e.preventDefault(); const t=e.touches[0], r=this.canvas.getBoundingClientRect(); this._click(t.clientX-r.left,t.clientY-r.top); };
    cancelAnimationFrame(this.raf);
    const loop = () => { this._update(); this._draw(); this.raf = requestAnimationFrame(loop); };
    loop();
  }
  stop() {
    cancelAnimationFrame(this.raf); this.raf = null; this.active = null;
    document.getElementById('minigame-screen').style.display = 'none';
    document.getElementById('mg-ui').innerHTML = '';
  }
  _init(type) {
    const W = this.canvas.width, H = this.canvas.height;
    if (type === 'fishing') {
      this.state = { phase:'wait', timer:0, barY:H/2, catchTimer:0, score:0, attempts:5, message:'Нажми чтобы закинуть удочку!' };
    } else if (type === 'butterfly') {
      const butterfly = { x:W/2, y:H/2, vx:(Math.random()-0.5)*3, vy:(Math.random()-0.5)*3, phase:0, caught:false };
      this.state = { butterfly, score:0, timeLeft:15, message:'Поймай бабочку!' };
    } else if (type === 'apples') {
      this.state = { apples:[], basket:{x:W/2,w:60}, score:0, timeLeft:20, speed:1.5, message:'Лови яблоки!' };
      for (let i=0;i<5;i++) this.state.apples.push({x:Math.random()*W,y:-20-i*40,speed:1+Math.random()});
    } else if (type === 'fireflies') {
      this.state = { flies:[], caught:0, goal:8, timeLeft:20, message:'Лови светлячков!' };
      for (let i=0;i<12;i++) this.state.flies.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5)*40,vy:(Math.random()-0.5)*30,phase:Math.random()*6.28,alive:true});
    } else if (type === 'meow') {
      this.state = { notes:[], score:0, timeLeft:20, nextNote:1, message:'Нажимай на ноты вовремя!' };
    }
    this._lastTime = performance.now();
  }
  _update() {
    const now = performance.now(), dt = Math.min((now-this._lastTime)/1000, 0.1);
    this._lastTime = now;
    const s = this.state, W = this.canvas.width, H = this.canvas.height;
    if (this.active === 'fishing') {
      if (s.phase === 'wait') { /* nothing */ }
      else if (s.phase === 'fishing') {
        s.timer += dt;
        s.barY = H/2 + Math.sin(s.timer*1.2)*40;
        if (s.timer > 1.5 + Math.random()*2) {
          s.phase = 'bite'; s.catchTimer = 1.5; s.message = '🐟 КЛЮЁТ! Нажимай!';
          this.audio.uiClick();
        }
      } else if (s.phase === 'bite') {
        s.catchTimer -= dt;
        if (s.catchTimer <= 0) { s.phase = 'miss'; s.attempts--; s.message = 'Сорвалась! Ещё раз...'; setTimeout(()=>{if(s.attempts>0)s.phase='wait'; else this._mgEnd('fishing');},1000); }
      }
    } else if (this.active === 'butterfly') {
      s.timeLeft -= dt;
      if (s.timeLeft <= 0) this._mgEnd('butterfly');
      const b = s.butterfly;
      b.phase += dt * 4; b.x += b.vx; b.y += b.vy;
      b.vx += (Math.random()-0.5)*0.5; b.vy += (Math.random()-0.5)*0.5;
      b.vx = Math.max(-4,Math.min(4,b.vx)); b.vy = Math.max(-4,Math.min(4,b.vy));
      if (b.x < 20 || b.x > W-20) b.vx *= -1;
      if (b.y < 20 || b.y > H-20) b.vy *= -1;
    } else if (this.active === 'apples') {
      s.timeLeft -= dt;
      if (s.timeLeft <= 0) this._mgEnd('apples');
      s.apples.forEach(a => { a.y += a.speed * (1 + s.score*0.05); if (a.y > H) { a.y = -20; a.x = Math.random()*W; } });
    } else if (this.active === 'fireflies') {
      s.timeLeft -= dt;
      if (s.timeLeft <= 0 || s.caught >= s.goal) this._mgEnd('fireflies');
      s.flies.forEach(f => {
        if (!f.alive) return;
        f.x += f.vx*dt; f.y += f.vy*dt; f.phase += dt*3;
        if (f.x<10||f.x>W-10) f.vx*=-1; if (f.y<10||f.y>H-10) f.vy*=-1;
      });
    } else if (this.active === 'meow') {
      s.timeLeft -= dt; s.nextNote -= dt;
      if (s.timeLeft <= 0) this._mgEnd('meow');
      if (s.nextNote <= 0) {
        s.nextNote = 0.8 + Math.random()*0.8;
        s.notes.push({ x:50+Math.random()*(this.canvas.width-100), y:20, life:1.5+Math.random()*0.5, hit:false });
      }
      s.notes.forEach(n => { n.y += 80*dt; n.life -= dt; });
      s.notes = s.notes.filter(n => n.life > 0);
    }
  }
  _click(cx, cy) {
    const s = this.state;
    const H = this.canvas.height;
    if (this.active === 'fishing') {
      if (s.phase === 'wait') { s.phase = 'fishing'; s.timer = 0; s.message = 'Ждём...'; }
      else if (s.phase === 'bite') {
        s.score++; s.phase = 'catch'; s.message = `🐟 Поймал! Счёт: ${s.score}`;
        this.audio.pickup(); this.telegram.vibrate(30);
        setTimeout(()=>{ if(s.attempts>0){s.phase='wait';s.message='Снова? Нажми!';}else this._mgEnd('fishing'); },800);
      }
    } else if (this.active === 'butterfly') {
      const b = s.butterfly, d = Math.sqrt((cx-b.x)**2+(cy-b.y)**2);
      if (d < 30) { s.score++; s.message=`🦋 Поймал! ×${s.score}`; this.audio.pickup(); this.telegram.vibrate(25); b.x=Math.random()*this.canvas.width; b.y=Math.random()*(H-40)+20; }
    } else if (this.active === 'apples') {
      const bsk = s.basket; bsk.x = cx;
      s.apples.forEach(a => {
        if (Math.abs(a.x-cx)<bsk.w/2&&Math.abs(a.y-H+20)<20) { s.score++; a.y=-20; a.x=Math.random()*this.canvas.width; s.message=`🍎 Поймал! ×${s.score}`; this.audio.pickup(); }
      });
    } else if (this.active === 'fireflies') {
      s.flies.forEach(f => {
        if (!f.alive) return;
        const d = Math.sqrt((cx-f.x)**2+(cy-f.y)**2);
        if (d<22) { f.alive=false; s.caught++; s.message=`✨ ${s.caught}/${s.goal}`; this.audio.pickup(); this.telegram.vibrate(20); }
      });
    } else if (this.active === 'meow') {
      let hit=false;
      s.notes.forEach(n => { if(!n.hit&&Math.abs(cx-n.x)<28&&Math.abs(cy-n.y)<28){n.hit=true;s.score++;hit=true;this.audio.uiClick();} });
      if (hit) { s.message=`🎵 +1! Счёт: ${s.score}`; this.telegram.vibrate(15); }
    }
  }
  _draw() {
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height, s = this.state;
    const t = performance.now()/1000;
    ctx.clearRect(0,0,W,H);
    const bg = ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#1a2a1a'); bg.addColorStop(1,'#0a1a0a');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    const ui = document.getElementById('mg-ui');
    if (this.active === 'fishing') {
      ctx.strokeStyle='#a07830'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(W/2,30); ctx.lineTo(W/2,s.barY); ctx.stroke();
      ctx.fillStyle='#4488cc'; ctx.beginPath(); ctx.ellipse(W/2,s.barY,8,5,0,0,Math.PI*2); ctx.fill();
      const wg = ctx.createLinearGradient(0,H*0.6,0,H); wg.addColorStop(0,'rgba(30,80,160,0.7)'); wg.addColorStop(1,'rgba(20,60,120,0.9)');
      ctx.fillStyle=wg; ctx.fillRect(0,H*0.6,W,H*0.4);
      for(let i=0;i<6;i++){ ctx.strokeStyle=`rgba(100,180,255,${0.08+Math.sin(t*0.8+i)*0.04})`; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(0,H*0.62+i*12+Math.sin(t*1.1+i)*4); ctx.lineTo(W,H*0.62+i*12+Math.cos(t*0.9+i)*4); ctx.stroke(); }
      if(s.phase==='bite'){ const bc=`rgba(255,80,30,${0.5+Math.sin(t*8)*0.4})`; ctx.fillStyle=bc; ctx.beginPath(); ctx.arc(W/2,s.barY,14,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.font='bold 11px system-ui'; ctx.textAlign='center'; ctx.fillText('🐟',W/2,s.barY+4); }
      ctx.fillStyle='#ffcc88'; ctx.font='bold 14px system-ui'; ctx.textAlign='center'; ctx.fillText(s.message,W/2,50);
      ui.innerHTML=`<span style="color:#f4873a">Попытки: ${s.attempts} | Рыб: ${s.score}</span>`;
    } else if (this.active === 'butterfly') {
      for(let i=0;i<12;i++){ const fx=50+i*80+Math.sin(t*0.4+i)*30,fy=30+i*22+Math.cos(t*0.5+i)*20; ctx.fillStyle=`rgba(200,255,200,${0.04+Math.random()*0.02})`; ctx.beginPath(); ctx.arc(fx,fy,40,0,Math.PI*2); ctx.fill(); }
      const b=s.butterfly,bph=b.phase;
      ctx.save(); ctx.translate(b.x,b.y);
      const bc1='rgba(200,100,220,0.8)',bc2='rgba(220,150,240,0.6)';
      ctx.fillStyle=bc1; ctx.beginPath(); ctx.ellipse(-12*Math.abs(Math.cos(bph/2)),0,16,10,Math.sin(bph)*0.4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=bc1; ctx.beginPath(); ctx.ellipse(12*Math.abs(Math.cos(bph/2)),0,16,10,-Math.sin(bph)*0.4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=bc2; ctx.beginPath(); ctx.ellipse(-8*Math.abs(Math.cos(bph/2)),4,10,7,Math.sin(bph)*0.4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=bc2; ctx.beginPath(); ctx.ellipse(8*Math.abs(Math.cos(bph/2)),4,10,7,-Math.sin(bph)*0.4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#442244'; ctx.beginPath(); ctx.ellipse(0,0,3,8,0,0,Math.PI*2); ctx.fill();
      ctx.restore();
      const tl=Math.ceil(s.timeLeft);
      ctx.fillStyle='#ffcc88'; ctx.font='bold 14px system-ui'; ctx.textAlign='center'; ctx.fillText(s.message,W/2,30);
      ui.innerHTML=`<span style="color:#f4873a">Время: ${tl}с | Поймано: ${s.score}</span>`;
    } else if (this.active === 'apples') {
      for(let i=0;i<8;i++){ ctx.fillStyle=`rgba(20,120,20,${0.06+Math.sin(t*0.3+i)*0.02})`; ctx.beginPath(); ctx.arc(i*W/7,H*0.4+Math.sin(t*0.5+i)*30,55,0,Math.PI*2); ctx.fill(); }
      s.apples.forEach(a=>{ ctx.font='26px serif'; ctx.textAlign='center'; ctx.fillText('🍎',a.x,a.y); });
      const bsk=s.basket;
      ctx.fillStyle='rgba(160,100,40,0.85)'; ctx.beginPath(); ctx.roundRect(bsk.x-bsk.w/2,H-30,bsk.w,20,6); ctx.fill();
      ctx.strokeStyle='#c8a060'; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle='#ffcc88'; ctx.font='bold 14px system-ui'; ctx.textAlign='center'; ctx.fillText(s.message,W/2,30);
      ui.innerHTML=`<span style="color:#f4873a">Время: ${Math.ceil(s.timeLeft)}с | Яблок: ${s.score}</span>`;
    } else if (this.active === 'fireflies') {
      ctx.fillStyle='rgba(20,30,60,0.7)'; ctx.fillRect(0,0,W,H);
      for(let i=0;i<20;i++){ const sx=Math.sin(t*0.2+i*0.8)*W,sy=Math.cos(t*0.15+i*1.1)*H; ctx.fillStyle=`rgba(100,200,255,${0.01+Math.random()*0.01})`; ctx.beginPath(); ctx.arc((sx+W)/2,(sy+H)/2,80,0,Math.PI*2); ctx.fill(); }
      s.flies.forEach(f=>{ if(!f.alive)return; const a=0.5+Math.sin(f.phase)*0.4; const fg=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,14); fg.addColorStop(0,`rgba(200,255,100,${a})`); fg.addColorStop(1,'rgba(100,200,50,0)'); ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(f.x,f.y,14,0,Math.PI*2); ctx.fill(); ctx.fillStyle=`rgba(220,255,150,${a*0.9})`; ctx.beginPath(); ctx.arc(f.x,f.y,4,0,Math.PI*2); ctx.fill(); });
      ctx.fillStyle='rgba(200,230,255,0.85)'; ctx.font='bold 14px system-ui'; ctx.textAlign='center'; ctx.fillText(s.message,W/2,30);
      ui.innerHTML=`<span style="color:#aaffaa">Поймано: ${s.caught}/${s.goal} | Время: ${Math.ceil(s.timeLeft)}с</span>`;
    } else if (this.active === 'meow') {
      for(let i=0;i<5;i++){ ctx.strokeStyle=`rgba(255,180,80,${0.1+Math.sin(t*0.5+i)*0.05})`; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,i*H/4); ctx.lineTo(W,i*H/4+Math.sin(t*0.8+i)*20); ctx.stroke(); }
      s.notes.forEach(n=>{ const a=Math.min(1,n.life*2); const ng=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,22); ng.addColorStop(0,`rgba(255,200,50,${a})`); ng.addColorStop(1,`rgba(255,150,20,0)`); ctx.fillStyle=ng; ctx.beginPath(); ctx.arc(n.x,n.y,22,0,Math.PI*2); ctx.fill(); ctx.font='bold 18px serif'; ctx.textAlign='center'; ctx.fillText('🎵',n.x,n.y+6); });
      ctx.fillStyle='#ffcc88'; ctx.font='bold 14px system-ui'; ctx.textAlign='center'; ctx.fillText(s.message,W/2,30);
      ui.innerHTML=`<span style="color:#f4873a">Время: ${Math.ceil(s.timeLeft)}с | Ноты: ${s.score}</span>`;
    }
  }
  _mgEnd(type) {
    const s = this.state;
    let reward = null, msg = '';
    if (type === 'fishing' && s.score > 0) { reward='fish'; msg=`🐟 Поймал ${s.score} рыбки!`; this.game.achievements.unlock('ach03'); }
    else if (type === 'fishing') msg='Не повезло сегодня...';
    else if (type === 'butterfly' && s.score > 0) { reward='feather'; msg=`🦋 Поймал ${s.score} бабочек!`; }
    else if (type === 'apples' && s.score >= 3) { reward='apple'; msg=`🍎 Собрал ${s.score} яблок!`; }
    else if (type === 'fireflies' && s.caught >= s.goal) { reward='acorn'; msg='✨ Всех поймал!'; this.game.achievements.unlock('ach10'); }
    else if (type === 'meow' && s.score >= 5) { reward='pebble'; msg=`🎵 Отличный концерт! ${s.score} нот!`; }
    if (reward && this.game) { this.game.inventory.add(reward); this.game.ui.notify(`🎁 Получено: ${ITEMS[reward].icon[0]} ${ITEMS[reward].name}`); }
    if (msg && this.game) this.game.ui.notify(msg);
    setTimeout(() => this.stop(), 1200);
  }
}
