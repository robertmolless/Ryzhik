'use strict';

class DialogueSystem {
  constructor(audio, telegram) {
    this.audio    = audio;
    this.telegram = telegram;
    this.active   = false;
    this.npc      = null;
    this.lines    = [];
    this.lineIdx  = 0;
    this.choices  = null;
    this.onEnd    = null;
    this._typing  = false;
    this._typeTimer = null;
    this._fullText  = '';
    this._textEl    = null;
    this._hintEl    = null;
  }
  start(npc, lines, onEnd = null) {
    this.npc    = npc;
    this.lines  = lines.map(l => typeof l === 'string' ? { speaker: 'npc', text: l, emotion: 'neutral' } : l);
    this.lineIdx= 0;
    this.active = true;
    this.onEnd  = onEnd;
    this.choices= null;
    this._show();
    this._renderLine();
    this.audio.uiClick();
    this.telegram.vibrate(15);
  }
  startWithChoices(npc, text, choices) {
    this.npc    = npc;
    this.lines  = [{ speaker: 'npc', text, emotion: 'neutral' }];
    this.lineIdx= 0;
    this.active = true;
    this.choices= choices;
    this.onEnd  = null;
    this._show();
    this._renderLine();
  }
  startStory(npc, lines, onEnd = null) {
    this.start(npc, lines, onEnd);
  }
  advance() {
    if (!this.active) return;
    if (this._typing) {
      this._skipTyping();
      return;
    }
    if (this.choices && this.lineIdx >= this.lines.length - 1) return;
    this.lineIdx++;
    if (this.lineIdx >= this.lines.length) {
      this.close();
      return;
    }
    this._renderLine();
    this.audio.uiClick();
  }
  close() {
    this._stopTyping();
    this.active = false;
    document.getElementById('dialogue-box').style.display = 'none';
    if (this.onEnd) { const fn = this.onEnd; this.onEnd = null; fn(); }
  }
  _show() {
    document.getElementById('dialogue-box').style.display = 'flex';
  }
  _renderLine() {
    const line = this.lines[this.lineIdx];
    if (!line) return;
    const isRyzhik = line.speaker === 'ryzhik';
    const emotion  = line.emotion || 'neutral';
    const box   = document.getElementById('dialogue-box');
    const port  = document.getElementById('dlg-portrait');
    const nameEl= document.getElementById('dlg-name');
    const trust = document.getElementById('dlg-trust');
    const chEl  = document.getElementById('dlg-choices');
    const hint  = document.getElementById('dlg-tap-hint');
    this._textEl = document.getElementById('dlg-text');
    this._hintEl = hint;
    chEl.innerHTML = '';
    if (isRyzhik) {
      nameEl.textContent = 'Рыжик';
      nameEl.style.color = '#f07030';
      trust.textContent  = '';
      this._drawPortrait(port, 'ryzhik', emotion, '#f07030');
      port.style.borderColor = '#f07030';
      box.classList.add('dlg-ryzhik-speaking');
    } else {
      const npc = this.npc;
      nameEl.textContent = npc ? npc.name : '';
      nameEl.style.color = npc ? (npc.color || '#f4873a') : '#f4873a';
      trust.textContent  = npc ? (npc.trustLabel || '') : '';
      this._drawPortrait(port, npc ? npc.id : null, emotion, npc ? npc.color : '#f4873a');
      port.style.borderColor = npc ? (npc.color || '#f4873a') : '#f4873a';
      box.classList.remove('dlg-ryzhik-speaking');
    }
    const isLast = this.lineIdx >= this.lines.length - 1;
    if (this.choices && isLast) {
      hint.style.display = 'none';
      this._typeText(line.text, () => {
        this.choices.forEach(ch => {
          const btn = document.createElement('button');
          btn.className = 'dlg-choice';
          btn.textContent = ch.text;
          btn.onclick = () => { this.audio.uiClick(); this.close(); if (ch.action) ch.action(); };
          chEl.appendChild(btn);
        });
      });
    } else {
      hint.style.display = 'block';
      hint.textContent = isRyzhik ? '😺 Нажми чтобы продолжить' : 'Тапни или нажми ⚡ для продолжения';
      this._typeText(line.text, null);
    }
  }
  _drawPortrait(portEl, npcId, emotion, color) {
    let canvas = portEl.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = 80; canvas.height = 80;
      canvas.style.cssText = 'width:68px;height:68px;border-radius:50%;';
      portEl.innerHTML = '';
      portEl.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 80, 80);
    const nc = color || '#f4873a';
    const bgg = ctx.createRadialGradient(40,40,5,40,40,40);
    bgg.addColorStop(0, nc + '44'); bgg.addColorStop(1, nc + '11');
    ctx.fillStyle = bgg; ctx.beginPath(); ctx.arc(40,40,40,0,Math.PI*2); ctx.fill();
    if (npcId && typeof drawPortrait === 'function') {
      const moodMap = { neutral:'neutral', happy:'happy', sad:'sad', curious:'neutral', surprised:'surprised', nostalgic:'sad' };
      drawPortrait(ctx, npcId, moodMap[emotion] || 'neutral');
    } else if (this.npc && this.npc.emoji) {
      ctx.font = '38px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(this.npc.emoji, 40, 42);
    }
  }
  _typeText(text, onDone) {
    this._stopTyping();
    this._fullText = text;
    this._typing   = true;
    this._textEl.textContent = '';
    this._textEl.innerHTML = '<span class="dlg-cursor">▊</span>';
    let i = 0;
    const cursor = this._textEl.querySelector('.dlg-cursor');
    this._typeTimer = setInterval(() => {
      i++;
      this._textEl.textContent = text.slice(0, i);
      if (cursor && i < text.length) {
        this._textEl.appendChild(cursor);
      }
      if (i >= text.length) {
        this._stopTyping();
        this._typing = false;
        if (cursor && cursor.parentNode) cursor.parentNode.removeChild(cursor);
        if (onDone) onDone();
      }
    }, 28);
  }
  _skipTyping() {
    this._stopTyping();
    this._typing = false;
    if (this._textEl) this._textEl.textContent = this._fullText;
    if (this.choices && this.lineIdx >= this.lines.length - 1) {
      const chEl = document.getElementById('dlg-choices');
      chEl.innerHTML = '';
      this.choices.forEach(ch => {
        const btn = document.createElement('button');
        btn.className = 'dlg-choice';
        btn.textContent = ch.text;
        btn.onclick = () => { this.audio.uiClick(); this.close(); if (ch.action) ch.action(); };
        chEl.appendChild(btn);
      });
    }
  }
  _stopTyping() {
    if (this._typeTimer) { clearInterval(this._typeTimer); this._typeTimer = null; }
  }
}
