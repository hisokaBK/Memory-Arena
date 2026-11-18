(() => {
"use strict";

const $ = (id) => document.getElementById(id);
const DOM = {
  shell: $("app-shell"), setup: $("setup-screen"), gameScreen: $("game-screen"),
  themeButtons: [...document.querySelectorAll("[data-theme-choice]")],
  levelButtons: [...document.querySelectorAll("[data-level]")],
  themePreviewAnimes: $("animes-theme-preview"), themePreviewClassic: $("classic-theme-preview"),
  setupFeedback: $("setup-feedback"), previewHint: $("preview-hint"), start: $("start-button"),
  stage: $("board-stage"), board: $("card-board"), status: $("game-status"),
  gameTheme: $("game-theme-name"), gameLevel: $("game-level-name"),
  back: $("back-button"), restart: $("restart-button"), pause: $("pause-button"),
  pauseCover: $("pause-cover"), resume: $("resume-button"),
  score: $("score"), moves: $("moves"), pairs: $("pairs"), timer: $("timer"),
  best: $("best-score"), combo: $("combo-text"), progress: $("match-progress"),
  progressFill: $("match-progress-fill"),
  result: $("result-panel"), resultIcon: $("result-icon"),
  resultKicker: $("result-kicker"), resultTitle: $("result-title"),
  resultMessage: $("result-message"), resultScore: $("result-score"),
  resultMoves: $("result-moves"), resultTime: $("result-time"),
  resultRecord: $("result-record"), again: $("play-again-button"),
  change: $("change-level-button"), toast: $("toast"),
  sfx: $("sfx-toggle"), music: $("music-toggle")
};
const BACK = "./image/flip.jpg";
const LEVELS = {
  easy: {pairs:4,seconds:90,preview:5},
  medium: {pairs:6,seconds:110,preview:7},
  hard: {pairs:8,seconds:140,preview:9}
};
const BEST_KEY = "hisokagaym-memory-best-v2";
const EFFECTS_KEY = "hisokagaym-effects";
const MUSIC_KEY = "hisokagaym-music";

function safeRead(key, fallback = "") {
  try { return localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; }
}
function safeWrite(key, value) {
  try { localStorage.setItem(key,value); return true; } catch (_) { return false; }
}
function getBests() {
  try {
    const values = JSON.parse(safeRead(BEST_KEY,"{}"));
    return values && typeof values === "object" && !Array.isArray(values) ? values : {};
  } catch (_) { return {}; }
}
function formatTime(seconds) {
  const n = Math.ceil(Math.max(0,seconds));
  return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");
}
function shuffle(items) {
  const arr = [...items];
  for(let i=arr.length-1;i>0;i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}
let toastTimeout = null;
function toast(message,kind="info") {
  if(toastTimeout!==null) clearTimeout(toastTimeout);
  DOM.toast.textContent = message;
  DOM.toast.dataset.kind = kind;
  DOM.toast.hidden = false;
  toastTimeout = setTimeout(()=>{ DOM.toast.hidden = true; toastTimeout=null; },3100);
}

// Original SVG card art is embedded in this existing JS file. No extra files or
// third-party hotlinked images are needed. To use your own image packs later,
// replace each generated 'src' value below with './image/your-photo.jpg'.
function svgData(title, body, colors) {
  const [top,bottom,glow] = colors;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="560" viewBox="0 0 420 560">'+
    '<defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="'+top+'"/><stop offset="1" stop-color="'+bottom+'"/></linearGradient>'+
    '<radialGradient id="halo"><stop stop-color="'+glow+'" stop-opacity=".60"/><stop offset="1" stop-color="'+glow+'" stop-opacity="0"/></radialGradient></defs>'+
    '<rect width="420" height="560" fill="url(#bg)"/>'+
    '<circle cx="220" cy="235" r="205" fill="url(#halo)"/>'+
    '<path d="M0 410L420 305 M0 445L420 340 M0 475L420 370" stroke="'+glow+'" stroke-opacity=".13" stroke-width="6"/>'+
    '<g stroke-linecap="round" stroke-linejoin="round">'+body+'</g>'+
    '<rect x="14" y="468" width="392" height="76" rx="18" fill="#090f1c" opacity=".72"/>'+
    '<text x="210" y="519" text-anchor="middle" fill="#ffffff" font-size="30" font-family="Arial, sans-serif" font-weight="800">'+title+'</text>'+
    '</svg>';
  return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
}
const fantasyArt = [
  ["Fox Spirit",'<path d="M103 138L135 57L185 136L235 136L286 57L319 141L310 311Q210 402 110 311Z" fill="#f8fafc" stroke="#a4bde3" stroke-width="13"/><path d="M134 226L182 205L168 252L131 244Z M286 226L238 205L252 252L289 244Z" fill="#fc668a"/><path d="M210 260L193 287L227 287Z" fill="#4b335f"/><path d="M177 302Q210 322 243 302" fill="none" stroke="#9e6be3" stroke-width="10"/>'],
  ["Moon Blade",'<path d="M123 316L255 100L275 111L143 328Z" fill="#e3f3fa" stroke="#96c9ee" stroke-width="7"/><path d="M103 308L156 344" stroke="#fbd48f" stroke-width="18"/><path d="M130 332L90 388" stroke="#9351cd" stroke-width="17"/><path d="M303 110A90 90 0 1 1 257 267A110 110 0 1 0 303 110" fill="#ffe3ab" opacity=".9"/>'],
  ["Sakura",'<g fill="#fca4ca" stroke="#fae1f0" stroke-width="7"><ellipse cx="210" cy="167" rx="48" ry="85"/><ellipse cx="210" cy="167" rx="48" ry="85" transform="rotate(72 210 235)"/><ellipse cx="210" cy="167" rx="48" ry="85" transform="rotate(144 210 235)"/><ellipse cx="210" cy="167" rx="48" ry="85" transform="rotate(216 210 235)"/><ellipse cx="210" cy="167" rx="48" ry="85" transform="rotate(288 210 235)"/></g><circle cx="210" cy="235" r="34" fill="#ffe78b"/>'],
  ["Crystal",'<path d="M210 53L323 165L290 325L210 399L132 325L99 165Z" fill="#5fe7f8" stroke="#dcfaff" stroke-width="12"/><path d="M210 53V399M99 165H323M132 325L210 165L290 325" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="7"/>'],
  ["Ninja Star",'<path d="M210 75L248 178L341 130L293 222L365 278L257 278L210 386L166 278L59 278L126 222L79 130L172 178Z" fill="#cdd5e5" stroke="#8395ce" stroke-width="10"/><circle cx="210" cy="232" r="45" fill="#293047"/><circle cx="210" cy="232" r="18" fill="#f7c4dd"/>'],
  ["Dragon",'<path d="M100 345Q69 231 168 150Q144 108 182 75L211 118Q269 80 292 130L270 170Q332 199 328 271Q326 350 239 370L256 319Q192 345 167 278Q140 240 175 208Q208 187 235 214Q204 151 161 190Q107 245 148 329Z" fill="#64f3c9" stroke="#c1fff0" stroke-width="9"/><circle cx="244" cy="200" r="13" fill="#fc647a"/>'],
  ["Star Mage",'<path d="M210 66L244 178L361 178L264 248L302 365L210 294L114 365L153 248L57 178L175 178Z" fill="#ffda79" stroke="#fff0be" stroke-width="10"/><circle cx="210" cy="240" r="58" fill="#523684" stroke="#ffc1ef" stroke-width="10"/><path d="M210 177L221 224L269 240L221 252L210 301L197 252L152 240L197 224Z" fill="#fff"/>'],
  ["Storm Helm",'<path d="M112 293Q95 148 210 119Q325 148 308 293L271 341L242 272L176 272L148 341Z" fill="#c2cef6" stroke="#7d8dcc" stroke-width="11"/><path d="M142 231H278L244 254H177Z" fill="#161f39"/><path d="M210 104L184 166L214 166L179 232L264 150L230 150L250 104Z" fill="#fef090"/>']
];
const classicArt = [
  ["Water",'<path d="M210 65C171 137 101 227 101 289A109 109 0 0 0 319 289C319 225 248 134 210 65Z" fill="#68d9fa" stroke="#c6f5ff" stroke-width="12"/><path d="M149 264Q133 316 180 344" fill="none" stroke="#e2ffff" stroke-width="16"/>'],
  ["Flower",'<path d="M210 280V410" stroke="#4dba6b" stroke-width="18"/><path d="M209 365Q147 305 102 351Q148 411 209 378 M212 383Q269 311 319 350Q271 421 212 394" fill="#4abc79"/><g fill="#fa91c5" stroke="#ffe0f2" stroke-width="8"><circle cx="210" cy="145" r="65"/><circle cx="150" cy="207" r="65"/><circle cx="270" cy="207" r="65"/><circle cx="165" cy="283" r="55"/><circle cx="254" cy="283" r="55"/></g><circle cx="210" cy="224" r="60" fill="#ffe793" stroke="#fff4bf" stroke-width="7"/>'],
  ["Television",'<rect x="63" y="148" width="294" height="217" rx="29" fill="#1b3149" stroke="#d1e5fb" stroke-width="13"/><rect x="90" y="176" width="214" height="161" rx="11" fill="#79bff0"/><path d="M135 214L255 214L229 261L180 288Z" fill="#f3e7ba"/><circle cx="331" cy="217" r="8" fill="#fff"/><circle cx="331" cy="255" r="8" fill="#fff"/><path d="M166 365L151 395M252 365L268 395" stroke="#dae6f5" stroke-width="13"/>'],
  ["Camera",'<path d="M107 192L146 153H247L279 192H325Q347 192 347 215V345H73V215Q73 192 96 192Z" fill="#343b50" stroke="#edf1fb" stroke-width="12"/><circle cx="210" cy="263" r="74" fill="#779de2" stroke="#e2eeff" stroke-width="13"/><circle cx="210" cy="263" r="39" fill="#344b83"/><circle cx="108" cy="218" r="13" fill="#ffd58a"/>'],
  ["Coffee",'<path d="M109 190H283V356Q210 402 109 356Z" fill="#f7deaa" stroke="#fff4d6" stroke-width="12"/><path d="M285 216H314Q360 227 333 288Q320 311 285 308" fill="none" stroke="#f7deaa" stroke-width="24"/><path d="M150 170Q126 132 156 102 M208 168Q188 125 218 95 M264 168Q245 127 269 104" fill="none" stroke="#fff1dd" stroke-width="10"/>'],
  ["Bicycle",'<circle cx="113" cy="333" r="71" fill="none" stroke="#f4f7ff" stroke-width="14"/><circle cx="310" cy="333" r="71" fill="none" stroke="#f4f7ff" stroke-width="14"/><path d="M113 333L167 218L225 333H113 M225 333L271 222L310 333 M168 218H250 M251 203H289" stroke="#59d7a1" stroke-width="12" fill="none"/><path d="M154 205H184" stroke="#f8f1ff" stroke-width="14"/>'],
  ["Book",'<path d="M210 156Q153 110 85 146V357Q150 333 210 387Q270 333 335 357V146Q266 110 210 156Z" fill="#f1e2ba" stroke="#fff8e5" stroke-width="12"/><path d="M210 156V383" stroke="#a9997b" stroke-width="11"/><path d="M110 197Q146 178 180 205M110 249Q149 228 180 257M240 205Q280 179 309 198M240 255Q277 229 310 249" fill="none" stroke="#a9997b" stroke-width="9"/>'],
  ["Clock",'<circle cx="210" cy="255" r="145" fill="#f9ecd2" stroke="#e9cb94" stroke-width="15"/><circle cx="210" cy="255" r="12" fill="#555062"/><path d="M210 156V255L275 293" stroke="#555062" stroke-width="17" fill="none"/><path d="M210 130V153M210 358V380M84 255H108M312 255H335" stroke="#ab8f72" stroke-width="9"/>']
];
const fantasyPalettes = [
  ["#172b5a","#071833","#b386f2"],["#1a326d","#082048","#65baff"],
  ["#392657","#17173d","#fc8ccb"],["#152c64","#102551","#79ddf5"],
  ["#283566","#0b183c","#d4cfff"],["#154558","#092735","#75fce2"],
  ["#26315c","#111936","#ffcd88"],["#1c3b5d","#081a38","#9aaefb"]
];
const classicPalettes = [
  ["#1d5b7b","#0b3a50","#66dafa"],["#49653b","#163f34","#fda0cf"],
  ["#345c5c","#173840","#88e9f1"],["#3b6464","#1d3e4d","#a4d5ff"],
  ["#665334","#3d342b","#ffe6a6"],["#295b45","#16342e","#72e8af"],
  ["#466c60","#1d483e","#ffe1a6"],["#4c6352","#263c37","#f5ddb2"]
];
const animeAssets = [
  ["Girlchan","./image/girlchan.jpg"],["Kaneki","./image/kaniki.jpg"],
  ["Lofi","./image/lofi.jpg"],["Sukuna","./image/sokona.jpg"],
  ["Tanjiro","./image/tanjiro.jpg"],["Gojo","./image/gojo.jpg"],
  ["Itachi","./image/imiso.jpg"],["Zoro","./image/zoro.jpg"]
].map(([key,src])=>({key,src}));
const THEMES = {
  anime: {name:"Anime",assets:animeAssets},
  animes: {name:"Animes",assets:fantasyArt.map(([key,body],i)=>({
    key,src:svgData(key,body,fantasyPalettes[i])
  }))},
  classic: {name:"Classic",assets:classicArt.map(([key,body],i)=>({
    key,src:svgData(key,body,classicPalettes[i])
  }))}
};
const THEME_BACKS = {
  anime: BACK,
  animes: svgData("ANIMES",'<path d="M210 72L247 178L357 202L273 272L291 389L210 332L129 389L147 272L63 202L173 178Z" fill="#a9dfff" stroke="#ecf9ff" stroke-width="11"/>',["#182957","#071a39","#7aa8ff"]),
  classic: svgData("CLASSIC",'<path d="M210 106C143 106 97 152 97 219C97 291 154 347 210 376C266 347 323 291 323 219C323 152 277 106 210 106Z" fill="#b5e4ad" stroke="#f7f9cc" stroke-width="12"/><path d="M146 237L188 277L274 173" fill="none" stroke="#245444" stroke-width="20"/>',["#265240","#0e3024","#a1e3ac"])
};
DOM.themePreviewAnimes.src = THEMES.animes.assets[0].src;
DOM.themePreviewClassic.src = THEMES.classic.assets[1].src;

const game = {
  theme:"anime",level:"easy",phase:"setup",
  score:0,moves:0,matchedPairs:0,combo:0,first:null,locked:false,
  secondsLeft:LEVELS.easy.seconds,deadline:0,
  version:0,previewTimer:null,flipTimer:null,clockTimer:null,
  images:new Map(),loadingTheme:null,loadToken:0,deck:[]
};

const audio = (() => {
  let context=null,interval=null,step=0;
  const notes=[196,246.94,293.66,246.94,220,261.63,329.63,261.63];
  let effectsOn=safeRead(EFFECTS_KEY,"on")!=="off";
  let musicOn=safeRead(MUSIC_KEY,"off")==="on";
  function ctx() {
    const API=window.AudioContext||window.webkitAudioContext;
    if(!API)return null;
    if(!context){try{context=new API()}catch(_){return null}}
    if(context.state==="suspended")context.resume().catch(()=>{});
    return context;
  }
  function tone(frequency,seconds=.12,volume=.034,type="sine",delay=0) {
    const c=ctx();if(!c)return;
    const osc=c.createOscillator(),gain=c.createGain(),time=c.currentTime+delay;
    osc.type=type;osc.frequency.setValueAtTime(frequency,time);
    gain.gain.setValueAtTime(.0001,time);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),time+.016);
    gain.gain.exponentialRampToValueAtTime(.0001,time+seconds);
    osc.connect(gain);gain.connect(c.destination);
    osc.start(time);osc.stop(time+seconds+.02);
    osc.onended=()=>{osc.disconnect();gain.disconnect()};
  }
  function effect(name) {
    if(!effectsOn)return;
    if(name==="flip")tone(450,.07,.023,"triangle");
    if(name==="start"){tone(370,.15,.034);tone(555,.17,.031,"sine",.12)}
    if(name==="match"){tone(523,.14,.035);tone(783,.23,.035,"sine",.10)}
    if(name==="miss")tone(220,.21,.027,"triangle");
    if(name==="win")[523,659,784,1046].forEach((f,i)=>tone(f,.28,.046,"sine",i*.14));
    if(name==="lose"){tone(294,.24,.03);tone(196,.28,.03,"sine",.2)}
  }
  function tick() {
    if(!musicOn||document.hidden||game.phase!=="playing")return;
    tone(notes[step++%notes.length],1.1,.011,"sine");
  }
  function stopMusic(){if(interval!==null)clearInterval(interval);interval=null}
  function startMusic(){
    stopMusic();
    if(!musicOn||document.hidden||game.phase!=="playing")return;
    ctx();tick();interval=setInterval(tick,1450);
  }
  function update() {
    DOM.sfx.setAttribute("aria-pressed",String(effectsOn));
    DOM.sfx.innerHTML=effectsOn?"🔊 <span>Effects On</span>":"🔇 <span>Effects Off</span>";
    DOM.music.setAttribute("aria-pressed",String(musicOn));
    DOM.music.innerHTML=musicOn?"♫ <span>Music On</span>":"♫ <span>Music Off</span>";
    DOM.sfx.classList.toggle("is-active",effectsOn);
    DOM.music.classList.toggle("is-active",musicOn);
  }
  DOM.sfx.addEventListener("click",()=>{
    effectsOn=!effectsOn;safeWrite(EFFECTS_KEY,effectsOn?"on":"off");
    if(effectsOn)effect("flip");
    update();toast(effectsOn?"Sound effects enabled":"Sound effects muted");
  });
  DOM.music.addEventListener("click",()=>{
    musicOn=!musicOn;safeWrite(MUSIC_KEY,musicOn?"on":"off");
    if(musicOn)startMusic();else stopMusic();
    update();toast(musicOn?"Background music enabled":"Background music muted");
  });
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden)stopMusic();
    else if(game.phase==="playing")startMusic();
  });
  update();
  return{effect,stopMusic,startMusic,unlock:ctx};
})();

function cancelTimers() {
  game.version++;
  if(game.previewTimer!==null)clearInterval(game.previewTimer);
  if(game.flipTimer!==null)clearTimeout(game.flipTimer);
  if(game.clockTimer!==null)clearInterval(game.clockTimer);
  game.previewTimer=game.flipTimer=game.clockTimer=null;
  audio.stopMusic();
}
function updateSelection() {
  DOM.shell.dataset.theme=game.theme;
  DOM.themeButtons.forEach(b=>{
    const selected=b.dataset.themeChoice===game.theme;
    b.classList.toggle("is-selected",selected);
    b.setAttribute("aria-pressed",String(selected));
  });
  DOM.levelButtons.forEach(b=>{
    const selected=b.dataset.level===game.level;
    b.classList.toggle("is-selected",selected);
    b.setAttribute("aria-pressed",String(selected));
  });
  DOM.previewHint.textContent="You'll have "+LEVELS[game.level].preview+
    " seconds to memorize the cards before the timer starts.";
  DOM.gameTheme.textContent=THEMES[game.theme].name;
  DOM.gameLevel.textContent=game.level[0].toUpperCase()+game.level.slice(1);
  updateHud();
}
function loadOne(src) {
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=async()=>{
      if(typeof image.decode==="function"){
        try{await image.decode()}catch(_){/* loaded bitmap remains usable */}
      }
      resolve(image);
    };
    image.onerror=()=>reject(new Error("Could not load game image"));
    image.src=src;
  });
}
async function ensureAssets() {
  const theme=game.theme;
  const token=++game.loadToken;
  if(game.images.has(theme)) {
    DOM.start.disabled=false;
    DOM.setupFeedback.textContent="✓ Pictures ready. Choose a level and start.";
    return;
  }
  DOM.start.disabled=true;
  DOM.setupFeedback.textContent="Loading "+THEMES[theme].name+" pictures before playing…";
  const rawAssets=THEMES[theme].assets;
  let missing=0;
  const prepared=[];
  const loadedImages=[];
  await Promise.all([THEME_BACKS[theme],...rawAssets.map(a=>a.src)].map(async(src,i)=>{
    try {
      const image=await loadOne(src);
      loadedImages[i]=image;
      if(i)prepared[i-1]={...rawAssets[i-1]};
    }catch(e){
      if(!i) {
        // Missing back image is replaced by a generated, local SVG.
        const fallback=svgData("HISOKAGAYM",'<path d="M210 97L287 216L210 378L133 216Z" fill="#dc9cfb" stroke="#fff" stroke-width="12"/>',["#301348","#100a22","#af72fd"]);
        loadedImages[i]=await loadOne(fallback);
        prepared.back=fallback;
      }else {
        const asset=rawAssets[i-1];
        const fallback=svgData(asset.key,
          '<circle cx="210" cy="235" r="100" fill="#d9b4ef" stroke="#fff" stroke-width="12"/><path d="M210 170V250" stroke="#51306a" stroke-width="22"/><circle cx="210" cy="291" r="11" fill="#51306a"/>',
          ["#292249","#11172e","#a8b5f4"]);
        loadedImages[i]=await loadOne(fallback);
        prepared[i-1]={...asset,src:fallback};
      }
      missing++;
    }
  }));
  if(token!==game.loadToken||theme!==game.theme)return;
  const assets=rawAssets.map((asset,i)=>prepared[i]||{...asset});
  game.images.set(theme,{assets,back:prepared.back||THEME_BACKS[theme],images:loadedImages});
  DOM.start.disabled=false;
  DOM.setupFeedback.textContent=missing
    ? "✓ Ready with "+missing+" backup illustration(s). You can still play."
    : "✓ All pictures loaded. Ready to start!";
  if(missing)toast("Some pictures were unavailable, so backup art is being used.","warning");
}
function updateHud() {
  const level=LEVELS[game.level];
  DOM.score.textContent=String(game.score);
  DOM.moves.textContent=String(game.moves);
  DOM.pairs.textContent=game.matchedPairs+" / "+level.pairs;
  DOM.timer.textContent=formatTime(game.secondsLeft);
  DOM.timer.classList.toggle("is-urgent",game.secondsLeft<=15&&game.phase==="playing");
  const record=Number(getBests()[game.theme+"-"+game.level])||0;
  DOM.best.textContent=record>0?record.toLocaleString():"—";
  DOM.combo.textContent=game.combo>=2?"🔥 "+game.combo+"x combo":"";
  DOM.progress.setAttribute("aria-valuemax",String(level.pairs));
  DOM.progress.setAttribute("aria-valuenow",String(game.matchedPairs));
  DOM.progressFill.style.width=(100*game.matchedPairs/level.pairs)+"%";
}
function setStatus(message,kind="") {
  DOM.status.textContent=message;
  DOM.status.dataset.kind=kind;
  DOM.status.hidden=!message;
}
function updateLayout() {
  if(DOM.gameScreen.hidden||DOM.board.hidden)return;
  const columns=4,rows=Math.ceil(game.deck.length/columns);
  const availableWidth=DOM.stage.clientWidth-24;
  const availableHeight=DOM.stage.clientHeight-28;
  if(availableWidth<=0||availableHeight<=0)return;
  const gap=Math.max(4,Math.min(12,Math.floor(Math.min(availableHeight,availableWidth)/52)));
  const size=Math.max(12,Math.floor(Math.min(
    (availableWidth-gap*(columns-1))/columns,
    ((availableHeight-gap*(rows-1))/rows)*.75
  )));
  const height=Math.floor(size*4/3);
  DOM.board.style.gridTemplateColumns="repeat("+columns+", "+size+"px)";
  DOM.board.style.gridTemplateRows="repeat("+rows+", "+height+"px)";
  DOM.board.style.gap=gap+"px";
  DOM.board.style.width=(columns*size+gap*(columns-1))+"px";
  DOM.board.style.height=(rows*height+gap*(rows-1))+"px";
}
function createCard(asset,index,back) {
  const btn=document.createElement("button");btn.type="button";
  btn.className="memory-card";btn.dataset.key=asset.key;
  btn.setAttribute("aria-label","Card "+(index+1)+": hidden");
  btn.setAttribute("aria-pressed","false");
  const inner=document.createElement("span");inner.className="card-flipper";
  const reverse=document.createElement("span");reverse.className="card-face card-back";
  const backImage=document.createElement("img");backImage.src=back;backImage.alt="";
  backImage.draggable=false;reverse.append(backImage);
  const front=document.createElement("span");front.className="card-face card-front";
  const image=document.createElement("img");image.src=asset.src;image.alt=asset.key;
  image.draggable=false;front.append(image);inner.append(reverse,front);btn.append(inner);
  const card={key:asset.key,label:asset.key,element:btn,matched:false,faceUp:false};
  btn.addEventListener("click",()=>flipCard(card));
  return card;
}
function reveal(card){
  card.faceUp=true;
  card.element.classList.add("is-flipped");
  card.element.setAttribute("aria-pressed","true");
  card.element.setAttribute("aria-label","Revealed: "+card.label);
}
function hide(card){
  card.faceUp=false;
  card.element.classList.remove("is-flipped");
  card.element.setAttribute("aria-pressed","false");
  card.element.setAttribute("aria-label","Hidden card");
}
function showGame() {
  DOM.setup.hidden=true;
  DOM.gameScreen.hidden=false;
  DOM.result.hidden=true;
  DOM.pauseCover.hidden=true;
  DOM.board.hidden=false;
  DOM.restart.disabled=false;
  DOM.pause.disabled=true;
  updateSelection();
}
function newRound() {
  const pack=game.images.get(game.theme);
  if(!pack){toast("Pictures are still loading. Please try again.","warning");return}
  audio.unlock(); // Start/resume AudioContext synchronously within the user gesture.
  cancelTimers();
  game.score=0;game.moves=0;game.matchedPairs=0;game.combo=0;
  game.first=null;game.locked=true;game.secondsLeft=LEVELS[game.level].seconds;
  game.phase="preview";
  const deckAssets=shuffle(pack.assets).slice(0,LEVELS[game.level].pairs);
  const cards=shuffle([...deckAssets,...deckAssets]).map((asset,index)=>createCard(asset,index,pack.back));
  game.deck=cards;
  const fragment=document.createDocumentFragment();
  cards.forEach(card=>{reveal(card);fragment.append(card.element)});
  DOM.board.replaceChildren(fragment);
  DOM.board.className="card-board is-preview";
  showGame();
  DOM.pause.disabled=true;
  setStatus("Memorize these pictures!","preview");
  updateHud();
  updateLayout();
  const version=game.version;
  const previewDeadline=performance.now()+LEVELS[game.level].preview*1000;
  function previewTick(){
    if(version!==game.version||game.phase!=="preview")return;
    const left=Math.max(0,(previewDeadline-performance.now())/1000);
    if(left<=0) {
      clearInterval(game.previewTimer);
      game.previewTimer=null;
      game.phase="closing";
      setStatus("Cards hidden — get ready!","preview");
      cards.forEach(hide);
      DOM.board.classList.remove("is-preview");
      game.flipTimer=setTimeout(()=>{
        if(version!==game.version||game.phase!=="closing")return;
        game.phase="playing";game.locked=false;
        setStatus("Find the matching pairs","playing");
        DOM.pause.disabled=false;
        startClock();
        audio.effect("start");
        audio.startMusic();
      },520);
    } else setStatus("Memorize! "+Math.ceil(left)+"s remaining","preview");
  }
  previewTick();
  game.previewTimer=setInterval(previewTick,90);
}
function startClock() {
  if(game.clockTimer!==null)clearInterval(game.clockTimer);
  game.deadline=performance.now()+game.secondsLeft*1000;
  const version=game.version;
  game.clockTimer=setInterval(()=>{
    if(version!==game.version||game.phase!=="playing")return;
    game.secondsLeft=Math.max(0,(game.deadline-performance.now())/1000);
    updateHud();
    if(game.secondsLeft<=0)finish(false);
  },110);
}
function flipCard(card) {
  if(game.phase!=="playing"||game.locked||card.faceUp||card.matched)return;
  reveal(card);audio.effect("flip");
  if(!game.first){game.first=card;return}
  const first=game.first,second=card;
  game.first=null;game.moves++;game.locked=true;DOM.pause.disabled=true;
  const version=game.version;
  if(first.key===second.key){
    first.matched=true;second.matched=true;game.matchedPairs++;game.combo++;
    game.score+=100+Math.max(0,game.combo-1)*25;
    audio.effect("match");
    if(game.matchedPairs===LEVELS[game.level].pairs){
      game.secondsLeft=Math.max(0,(game.deadline-performance.now())/1000);
      clearInterval(game.clockTimer);game.clockTimer=null;
    }
    game.flipTimer=setTimeout(()=>{
      if(version!==game.version)return;
      first.element.classList.add("is-matched");second.element.classList.add("is-matched");
      first.element.disabled=true;second.element.disabled=true;
      game.locked=false;DOM.pause.disabled=false;
      if(game.matchedPairs===LEVELS[game.level].pairs)finish(true);
    },340);
  }else{
    game.combo=0;game.score=Math.max(0,game.score-15);
    audio.effect("miss");
    game.flipTimer=setTimeout(()=>{
      if(version!==game.version)return;
      hide(first);hide(second);game.locked=false;DOM.pause.disabled=false;
    },900);
  }
  updateHud();
}
function finish(won) {
  if(game.phase!=="playing")return;
  cancelTimers();
  game.phase=won?"won":"lost";game.locked=true;
  if(won)game.score+=Math.floor(Math.max(0,game.secondsLeft))*2;
  else game.secondsLeft=0;
  let record=false;
  if(won){
    const scores=getBests(),key=game.theme+"-"+game.level;
    if(game.score>(Number(scores[key])||0)){
      scores[key]=game.score;record=safeWrite(BEST_KEY,JSON.stringify(scores));
    }
  }
  updateHud();audio.effect(won?"win":"lose");
  DOM.board.hidden=true;DOM.result.hidden=false;DOM.pause.disabled=true;
  DOM.pauseCover.hidden=true;setStatus("");
  DOM.resultIcon.textContent=won?"🏆":"⌛";
  DOM.resultKicker.textContent=won?"VICTORY":"TIME'S UP";
  DOM.resultTitle.textContent=won?"You did it!":"Try again!";
  DOM.resultMessage.textContent=won
    ?"All "+LEVELS[game.level].pairs+" pairs cleared. Your memory is on fire!"
    :"You matched "+game.matchedPairs+" of "+LEVELS[game.level].pairs+" pairs.";
  DOM.resultScore.textContent=game.score.toLocaleString();
  DOM.resultMoves.textContent=String(game.moves);
  DOM.resultTime.textContent=formatTime(game.secondsLeft);
  DOM.resultRecord.textContent=record?"★ New personal best!":
    won?"Try again for an even higher score.":"Memorize the preview and beat the clock.";
  DOM.again.focus();
  toast(won?"Excellent! All pairs matched.":"Time's up. A new round is one click away.",won?"success":"warning");
}
function pauseToggle(){
  if(game.phase==="playing"&&!game.locked){
    game.secondsLeft=Math.max(0,(game.deadline-performance.now())/1000);
    if(game.clockTimer!==null)clearInterval(game.clockTimer);
    game.clockTimer=null;
    game.phase="paused";DOM.pauseCover.hidden=false;
    DOM.board.classList.add("is-paused");
    DOM.pause.textContent="▶ Resume";audio.stopMusic();
    setStatus("Paused","paused");updateHud();
  }else if(game.phase==="paused"){
    game.phase="playing";DOM.pauseCover.hidden=true;
    DOM.board.classList.remove("is-paused");
    DOM.pause.textContent="Ⅱ Pause";setStatus("Find the matching pairs","playing");
    startClock();audio.startMusic();
  }
}
function returnToSetup() {
  cancelTimers();
  game.phase="setup";game.locked=false;game.deck=[];
  DOM.gameScreen.hidden=true;DOM.setup.hidden=false;DOM.board.replaceChildren();
  DOM.board.hidden=true;DOM.result.hidden=true;DOM.pauseCover.hidden=true;
  DOM.pause.textContent="Ⅱ Pause";DOM.pause.disabled=true;
  game.secondsLeft=LEVELS[game.level].seconds;
  game.score=game.moves=game.matchedPairs=game.combo=0;
  updateSelection();ensureAssets();
  toast("Choose a theme or difficulty to begin another round.");
}
DOM.themeButtons.forEach(button=>button.addEventListener("click",()=>{
  const theme=button.dataset.themeChoice;
  if(!THEMES[theme]||theme===game.theme)return;
  game.theme=theme;updateSelection();ensureAssets();
}));
DOM.levelButtons.forEach(button=>button.addEventListener("click",()=>{
  const level=button.dataset.level;
  if(!LEVELS[level]||level===game.level)return;
  game.level=level;updateSelection();
}));
DOM.start.addEventListener("click",newRound);
DOM.restart.addEventListener("click",()=>{
  if(game.phase==="preview"||game.phase==="closing"||game.phase==="playing"||game.phase==="paused"){
    newRound();toast("New round started. Memorize the cards!");
  }
});
DOM.pause.addEventListener("click",pauseToggle);
DOM.resume.addEventListener("click",pauseToggle);
DOM.back.addEventListener("click",returnToSetup);
DOM.again.addEventListener("click",newRound);
DOM.change.addEventListener("click",returnToSetup);
window.addEventListener("resize",updateLayout);
if(typeof ResizeObserver!=="undefined")new ResizeObserver(updateLayout).observe(DOM.stage);
window.addEventListener("pagehide",cancelTimers);
updateSelection();
ensureAssets();
})();