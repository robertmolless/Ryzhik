'use strict';

Game.prototype._triggerFinale = function() {
  this.ui.showEvent('🔔','Звенит Солнечный колокольчик! Двор наполняется светлячками...');
  this.weather.set('starry'); this.player.mood=100; this.player.food=100; this.player.energy=100;
  this.achievements.unlock('ach11'); this.achievements.unlock('ach20');
  setTimeout(()=>{ this.ui.notify('🏡 Все собрались у дома! Двор снова уютный!'); setTimeout(()=>{ this.ui.notify('🐱 Рыжик обрёл настоящий дом. Конец первой главы!'); this.npcs.forEach(n=>{n.trust=3;n.showEmotion('happy');}); this.audio.questDone(); },4000); },4000);
};

Game.prototype._unlockMountains = function(sonya) {
  if (!this.mountains||this.mountains.unlockedFlag) return;
  const lines=[{speaker:'npc',text:'Знаешь… наверное, теперь я могу показать тебе одно место.',emotion:'happy'},{speaker:'ryzhik',text:'Мяу?..', emotion:'curious'},{speaker:'npc',text:'За лесом начинается старая тропа к холмам.',emotion:'neutral'},{speaker:'npc',text:'Я редко туда кого-то вожу.',emotion:'nostalgic'},{speaker:'npc',text:'Но тебе, кажется, можно доверять.',emotion:'happy'}];
  this.dialogue.startStory(sonya,lines,()=>{ this.mountains.unlockedFlag=true; this.quests.unlock('q_sonya_mtn1'); if(!this.unlockedZones.includes('mountains'))this.unlockedZones.push('mountains'); setTimeout(()=>{ this.ui.notify('⛰️ Открыта новая глава: «Тропа в горы»'); setTimeout(()=>this.ui.notify('⛰️ Открыт проход в горы'),2500); },500); });
};

Game.prototype._handleMountainSonyaDialogue = function(sonya) {
  if (!sonya) return; sonya.showEmotion('happy'); this.audio.uiClick();
  if (this.quests.isActive('q_sonya_mtn1')) { this.dialogue.start(sonya,['Рыжик! Ты добрался! Смотри как тут красиво. Вон там — лучший обзор с площадки.'],()=>{ sonya.trust=Math.min(3,sonya.trust+1); this._giveQuestReward({id:'q_sonya_mtn1'},sonya); this.quests.unlock('q_sonya_mtn2'); setTimeout(()=>this.ui.notify('📋 Новый квест: Горный цветок'),1500); }); return; }
  if (this.quests.isActive('q_sonya_mtn2')) { if(this.inventory.has('mountainFlower')){this.dialogue.start(sonya,['Горный цветок! Именно такой растёт здесь. Прохладный ветер им нравится.'],()=>{ this.inventory.remove('mountainFlower'); sonya.trust=Math.min(3,sonya.trust+1); this._giveQuestReward({id:'q_sonya_mtn2'},sonya); this.quests.unlock('q_sonya_mtn3'); setTimeout(()=>this.ui.notify('📋 Новый квест: Вид сверху'),1500); });}else{this.dialogue.start(sonya,['Горный цветок? Он растёт ближе к большим камням. Поищи там!']);} return; }
  if (this.quests.isActive('q_sonya_mtn3')) { if(this.inventory.has('smoothStone')){this.dialogue.start(sonya,['Нашёл гладкий камень! Теперь пойдём к верхней площадке. Там лучший вид на дом.']);}else{this.dialogue.start(sonya,['Поднимись выше! Там лучший вид. И найди гладкий камень — он лежит у площадки.']);} return; }
  const mountainLines=[{speaker:'npc',text:'Раньше я часто приходила сюда одна.',emotion:'nostalgic'},{speaker:'npc',text:'Когда становилось слишком шумно.',emotion:'neutral'},{speaker:'npc',text:'Здесь всегда только ветер, облака и тишина.',emotion:'neutral'},{speaker:'ryzhik',text:'Мрр...',emotion:'happy'},{speaker:'npc',text:'Наверное, поэтому мне нравится это место.',emotion:'happy'}];
  this.dialogue.startStory(sonya,mountainLines);
};

Game.prototype._triggerMountainVista = function(sonya) {
  if (!sonya) return;
  const lines=[{speaker:'npc',text:'Когда смотришь отсюда вниз, дом кажется совсем маленьким.',emotion:'nostalgic'},{speaker:'ryzhik',text:'Мрр...',emotion:'happy'},{speaker:'npc',text:'Но почему-то именно отсюда он больше всего похож на дом.',emotion:'happy'},{speaker:'npc',text:'В горах всегда так.',emotion:'neutral'},{speaker:'npc',text:'Поднимаешься выше — и начинаешь лучше понимать, куда хочешь вернуться.',emotion:'nostalgic'}];
  this.dialogue.startStory(sonya,lines,()=>{ this.inventory.remove('smoothStone'); sonya.trust=3; this._giveQuestReward({id:'q_sonya_mtn3'},sonya); this.achievements.unlock('ach_mtn'); this.player.mood=Math.min(100,this.player.mood+15); setTimeout(()=>this.ui.notify('⛰️ Достижение: Друг гор!'),1000); });
};

Game.prototype._triggerNickCutscene = function() {
  if (!this.flags) this.flags={};
  if (this.militaryOffice&&this.militaryOffice.active) this.militaryOffice.startExit();
  this.flags.nickStoryComplete=true;
  const nick=this.npcs.find(n=>n.id==='nick');
  if (nick) { nick.wx=340; nick.wy=700; nick.schedule={morning:[340,700],day:[360,680],evening:[340,700],night:[330,710]}; }
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:#000;opacity:0;z-index:999;transition:opacity 1s;pointer-events:none;';
  document.body.appendChild(overlay);
  setTimeout(()=>{ overlay.style.opacity='1'; },50);
  setTimeout(()=>{
    this.camera.x=100; this.camera.y=50; this.time.hour=20; this.weather.set('starry');
    setTimeout(()=>{ overlay.style.opacity='0'; setTimeout(()=>{
      overlay.remove();
      const lyokha=this.npcs.find(n=>n.id==='lyokha'),igor=this.npcs.find(n=>n.id==='igor'),liza=this.npcs.find(n=>n.id==='liza'),prokhor=this.npcs.find(n=>n.id==='prokhor'),nickNPC=this.npcs.find(n=>n.id==='nick');
      const lines=[{speaker:'lyokha',text:'Ну наконец-то ты добрался.'},{speaker:'nick',text:'Я думал, этот военкомат меня никогда не отпустит…'},{speaker:'igor',text:'Садись ближе к костру. Сегодня без бумажек.'},{speaker:'liza',text:'Я даже гирлянду специально включила!'},{speaker:'prokhor',text:'Вот теперь двор снова полный.'},{speaker:'ryzhik',text:'Мяу!'}];
      const npcsMap={lyokha,igor,liza,prokhor,nick:nickNPC};
      let li=0;
      const showLine=()=>{ if(li>=lines.length){this.ui.notify('🔥 Ник наконец добрался до костра!');this.player.mood=100;return;} const line=lines[li++]; const speakerNPC=line.speaker==='ryzhik'?{name:'Рыжик',emoji:'🐱',color:'#f07030',id:'ryzhik'}:(npcsMap[line.speaker]||nickNPC); const dlgLine={speaker:line.speaker==='ryzhik'?'ryzhik':'npc',text:line.text,emotion:'happy'}; this.dialogue.startStory(speakerNPC,[dlgLine],showLine); };
      showLine();
      this.ui.showEvent('🔥','Ник наконец добрался до дома!');
    },800);},1500);
  },1200);
};
