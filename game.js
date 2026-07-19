const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const menu = document.getElementById("menu");
const finishOverlay = document.getElementById("finish");
const trackGrid = document.getElementById("trackGrid");
const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const nextBtn = document.getElementById("nextBtn");
const soundBtn = document.getElementById("soundBtn");

const ui = {
  trackName: document.getElementById("trackName"),
  time: document.getElementById("timeReadout"),
  relics: document.getElementById("relicReadout"),
  best: document.getElementById("bestReadout"),
  speed: document.getElementById("speedBar"),
  status: document.getElementById("statusText"),
  finishTitle: document.getElementById("finishTitle"),
  finishTime: document.getElementById("finishTime"),
  finishRelics: document.getElementById("finishRelics"),
  finishBonus: document.getElementById("finishBonus")
};

const tracks = [
  {name:"Great Wall Sprint", place:"China", sky:"#94cfe5", land:"#6c8e45", road:"#625b52", accent:"#cf3f32", length:4100, curves:[.1,.35,-.2,.55,-.55,.15], icon:"🏯"},
  {name:"Petra Canyon Run", place:"Jordan", sky:"#f2c58b", land:"#b65f42", road:"#755348", accent:"#f4a261", length:3900, curves:[-.25,.5,.22,-.5,.4,-.1], icon:"🏜️"},
  {name:"Machu Picchu Climb", place:"Peru", sky:"#8ed0c7", land:"#3c7c54", road:"#595f54", accent:"#b9d96f", length:4300, curves:[.2,-.6,.5,-.25,.65,-.4], icon:"⛰️"},
  {name:"Taj Moonlight Dash", place:"India", sky:"#8ea8d5", land:"#436078", road:"#494e5f", accent:"#f6d6a8", length:4000, curves:[.1,-.25,.45,-.45,.22,.35], icon:"🕌"},
  {name:"Colosseum Circuit", place:"Italy", sky:"#e6b778", land:"#8c7a57", road:"#55504d", accent:"#e86f51", length:3800, curves:[.45,-.45,.65,-.65,.3,-.15], icon:"🏛️"},
  {name:"Chichén Itzá Thunder", place:"Mexico", sky:"#73b6a3", land:"#47703d", road:"#4f5b50", accent:"#f2c14e", length:4200, curves:[-.1,.5,-.45,.25,.55,-.5], icon:"🗿"},
  {name:"Rio Skyline Rush", place:"Brazil", sky:"#6dc8e8", land:"#2c8057", road:"#444d51", accent:"#ffe066", length:4050, curves:[.3,-.2,.6,-.55,.15,-.35], icon:"🌴"}
];

let selectedTrack = 0;
let state = "menu";
let soundOn = true;
let last = performance.now();
let elapsed = 0;
let penalty = 0;
let distance = 0;
let lateral = 0;
let speed = 0;
let relics = [];
let hazards = [];
let boosts = [];
let particles = [];
let keys = {left:false,right:false,gas:false,brake:false};
let shake = 0;
let messageTimer = 0;
let audioCtx = null;

function makeMenu(){
  trackGrid.innerHTML = "";
  tracks.forEach((t,i)=>{
    const b=document.createElement("button");
    b.className="track-card"+(i===selectedTrack?" selected":"");
    b.innerHTML=`<strong>${t.icon} ${t.name}</strong><small>${t.place} · ${Math.round(t.length/1000)} km stage</small>`;
    b.onclick=()=>{selectedTrack=i;makeMenu();syncUI();};
    trackGrid.appendChild(b);
  });
}
makeMenu();

function bestKey(){ return "wondersRallyBest_"+selectedTrack; }
function getBest(){ return Number(localStorage.getItem(bestKey())||0); }
function setBest(v){ const b=getBest(); if(!b||v<b)localStorage.setItem(bestKey(),String(v)); }

function formatTime(ms){
  const total=Math.max(0,ms);
  const min=Math.floor(total/60000);
  const sec=Math.floor((total%60000)/1000);
  const milli=Math.floor(total%1000);
  return `${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}.${String(milli).padStart(3,"0")}`;
}

function syncUI(){
  const t=tracks[selectedTrack];
  ui.trackName.textContent=t.name;
  ui.relics.textContent=`${relics.filter(r=>r.collected).length} / ${relics.length}`;
  const best=getBest();
  ui.best.textContent=best?formatTime(best):"--:--.---";
}

function rand(seed){
  const x=Math.sin(seed*999.17)*43758.5453;
  return x-Math.floor(x);
}

function resetRace(){
  elapsed=0; penalty=0; distance=0; lateral=0; speed=0; shake=0;
  const t=tracks[selectedTrack];
  relics=[]; hazards=[]; boosts=[]; particles=[];
  for(let i=1;i<=8;i++) relics.push({d:i*t.length/9,l:(rand(i+selectedTrack*7)-.5)*1.35,collected:false});
  for(let i=1;i<=18;i++) hazards.push({d:170+i*t.length/20,l:(rand(i*3+selectedTrack*11)-.5)*1.5,hit:false});
  for(let i=1;i<=7;i++) boosts.push({d:300+i*t.length/8,l:(rand(i*5+2)-.5)*1.1,used:false});
  ui.status.textContent="3… 2… 1… GO!";
  messageTimer=1800;
  syncUI();
}

function startRace(){
  ensureAudio();
  resetRace();
  state="racing";
  menu.classList.remove("show");
  finishOverlay.classList.remove("show");
}

function finishRace(){
  state="finished";
  speed=0;
  const found=relics.filter(r=>r.collected).length;
  const bonus=found*1200;
  const finalTime=Math.max(1000,elapsed+penalty-bonus);
  setBest(finalTime);
  ui.finishTitle.textContent=found===relics.length?"Perfect relic run!":"Wonder conquered!";
  ui.finishTime.textContent=formatTime(finalTime);
  ui.finishRelics.textContent=`${found} / ${relics.length}`;
  ui.finishBonus.textContent=`-${(bonus/1000).toFixed(3)}s`;
  syncUI();
  finishOverlay.classList.add("show");
  tone(660,.12); setTimeout(()=>tone(880,.15),120);
}

startBtn.onclick=startRace;
retryBtn.onclick=startRace;
nextBtn.onclick=()=>{selectedTrack=(selectedTrack+1)%tracks.length;makeMenu();syncUI();finishOverlay.classList.remove("show");menu.classList.add("show");state="menu";};
soundBtn.onclick=()=>{soundOn=!soundOn;soundBtn.textContent=soundOn?"🔊":"🔇";};

function ensureAudio(){
  if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
}
function tone(freq,duration=.08){
  if(!soundOn)return;
  ensureAudio();
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.frequency.value=freq;o.type="triangle";
  g.gain.setValueAtTime(.08,audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);
  o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);
}

function inputFromKey(e,down){
  const k=e.key.toLowerCase();
  if(["arrowleft","a"].includes(k))keys.left=down;
  if(["arrowright","d"].includes(k))keys.right=down;
  if(["arrowup","w"].includes(k))keys.gas=down;
  if(["arrowdown","s"," "].includes(k))keys.brake=down;
  if(["arrowleft","arrowright","arrowup","arrowdown"," "].includes(k))e.preventDefault();
}
addEventListener("keydown",e=>inputFromKey(e,true));
addEventListener("keyup",e=>inputFromKey(e,false));

document.querySelectorAll("[data-control]").forEach(btn=>{
  const c=btn.dataset.control;
  const on=e=>{e.preventDefault();keys[c]=true;};
  const off=e=>{e.preventDefault();keys[c]=false;};
  btn.addEventListener("pointerdown",on);
  btn.addEventListener("pointerup",off);
  btn.addEventListener("pointercancel",off);
  btn.addEventListener("pointerleave",off);
});

function trackCurveAt(d){
  const t=tracks[selectedTrack];
  const seg=t.length/t.curves.length;
  const i=Math.floor(d/seg)%t.curves.length;
  const local=(d%seg)/seg;
  const next=(i+1)%t.curves.length;
  return t.curves[i]*(1-local)+t.curves[next]*local;
}

function update(dt){
  if(state!=="racing")return;
  elapsed+=dt;
  const accel=keys.gas?48:14;
  speed+=accel*dt/1000;
  speed-=speed*(keys.brake?1.6:.28)*dt/1000;
  speed=Math.max(0,Math.min(205,speed));

  const curve=trackCurveAt(distance);
  const steer=(keys.left?-1:0)+(keys.right?1:0);
  lateral+=steer*(1.25+speed/150)*dt/1000;
  lateral-=curve*speed*.0018*dt/16.67;

  if(Math.abs(lateral)>1.0){
    speed-=54*dt/1000;
    penalty+=dt*.12;
    if(messageTimer<=0){ui.status.textContent="Off-road: grip reduced";messageTimer=700;}
  }
  lateral=Math.max(-1.45,Math.min(1.45,lateral));
  distance+=speed*dt/1000;

  const checkObjects=(arr,type)=>{
    arr.forEach(o=>{
      if(o.collected||o.hit||o.used)return;
      const near=Math.abs(o.d-distance)<28;
      const aligned=Math.abs(o.l-lateral)<.23;
      if(near&&aligned){
        if(type==="relic"){
          o.collected=true; tone(820,.09); ui.status.textContent="Relic found: time bonus!"; messageTimer=1100;
        }else if(type==="hazard"){
          o.hit=true; speed*=.48; penalty+=1200; shake=18; tone(120,.15); ui.status.textContent="Hazard hit: +1.2 seconds"; messageTimer=1100;
        }else{
          o.used=true; speed=Math.min(220,speed+58); tone(1040,.1); ui.status.textContent="Boost gate!"; messageTimer=900;
          for(let i=0;i<24;i++)particles.push({x:canvas.width/2,y:canvas.height*.79,vx:(Math.random()-.5)*8,vy:-Math.random()*8,life:1});
        }
      }
    });
  };
  checkObjects(relics,"relic");checkObjects(hazards,"hazard");checkObjects(boosts,"boost");

  particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life-=dt/700;});
  particles=particles.filter(p=>p.life>0);
  if(messageTimer>0)messageTimer-=dt;
  else ui.status.textContent=`${Math.max(0,Math.round(tracks[selectedTrack].length-distance))} m to finish`;

  ui.time.textContent=formatTime(elapsed+penalty);
  ui.relics.textContent=`${relics.filter(r=>r.collected).length} / ${relics.length}`;
  ui.speed.style.width=`${Math.min(100,speed/205*100)}%`;

  if(distance>=tracks[selectedTrack].length)finishRace();
}

function draw(){
  const w=canvas.width,h=canvas.height;
  const t=tracks[selectedTrack];
  ctx.save();
  if(shake>0&&state==="racing"){
    ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
    shake*=.86;
  }
  const horizon=h*.33;
  ctx.fillStyle=t.sky;ctx.fillRect(0,0,w,horizon);
  drawBackdrop(t,w,horizon);
  ctx.fillStyle=t.land;ctx.fillRect(0,horizon,w,h-horizon);

  const curve=trackCurveAt(distance);
  const centerShift=curve*w*.22-lateral*w*.18;
  drawRoad(w,h,horizon,centerShift,t);
  drawObjects(w,h,horizon,centerShift,t);
  drawCar(w,h,t);
  drawParticles();
  drawProgress(w,h,t);
  if(state==="menu") drawAttractMode(w,h,t);
  ctx.restore();
}

function drawBackdrop(t,w,horizon){
  ctx.globalAlpha=.65;
  if(selectedTrack===0){
    ctx.fillStyle="#56713a";
    for(let x=0;x<w;x+=90){ctx.fillRect(x,horizon-40-(x%180?15:0),95,25);ctx.fillStyle="#374c2a";ctx.fillRect(x+15,horizon-62,18,22);ctx.fillStyle="#56713a";}
  }else if(selectedTrack===1){
    ctx.fillStyle="#8f4734";ctx.beginPath();ctx.moveTo(0,horizon);ctx.lineTo(180,horizon-120);ctx.lineTo(360,horizon);ctx.lineTo(580,horizon-85);ctx.lineTo(760,horizon);ctx.lineTo(w,horizon);ctx.closePath();ctx.fill();
  }else if(selectedTrack===2){
    ctx.fillStyle="#245642";ctx.beginPath();ctx.moveTo(0,horizon);ctx.lineTo(220,horizon-150);ctx.lineTo(430,horizon);ctx.lineTo(740,horizon-180);ctx.lineTo(1050,horizon);ctx.lineTo(w,horizon);ctx.closePath();ctx.fill();
  }else if(selectedTrack===3){
    ctx.fillStyle="#dce6ef";ctx.beginPath();ctx.arc(w*.5,horizon-46,42,Math.PI,0);ctx.fill();ctx.fillRect(w*.46,horizon-46,100,46);ctx.fillRect(w*.43,horizon-83,22,83);ctx.fillRect(w*.56,horizon-83,22,83);
  }else if(selectedTrack===4){
    ctx.fillStyle="#8e704d";ctx.beginPath();ctx.ellipse(w*.5,horizon-22,100,48,0,Math.PI,0);ctx.fill();ctx.fillRect(w*.42,horizon-22,200,45);
  }else if(selectedTrack===5){
    ctx.fillStyle="#7b8a56";ctx.beginPath();ctx.moveTo(w*.42,horizon);ctx.lineTo(w*.5,horizon-110);ctx.lineTo(w*.58,horizon);ctx.closePath();ctx.fill();
  }else{
    ctx.fillStyle="#2e6f68";ctx.beginPath();ctx.moveTo(0,horizon);ctx.lineTo(240,horizon-130);ctx.lineTo(420,horizon);ctx.lineTo(760,horizon-155);ctx.lineTo(1030,horizon);ctx.closePath();ctx.fill();
    ctx.fillStyle="#e9ecef";ctx.fillRect(w*.49,horizon-110,8,80);ctx.fillRect(w*.46,horizon-92,70,8);
  }
  ctx.globalAlpha=1;
}

function roadEdgesAt(y,horizon,w,centerShift){
  const p=(y-horizon)/(canvas.height-horizon);
  const half=55+p*p*w*.44;
  const center=w/2+centerShift*(1-p)*.95;
  return {left:center-half,right:center+half,center,p};
}

function drawRoad(w,h,horizon,centerShift,t){
  ctx.beginPath();
  const a=roadEdgesAt(horizon,horizon,w,centerShift),b=roadEdgesAt(h,horizon,w,centerShift);
  ctx.moveTo(a.left,horizon);ctx.lineTo(a.right,horizon);ctx.lineTo(b.right,h);ctx.lineTo(b.left,h);ctx.closePath();
  ctx.fillStyle=t.road;ctx.fill();

  for(let i=0;i<22;i++){
    const z=((i*170-distance*2.2)%370+370)%370;
    const p=z/370;
    const y=horizon+(1-p)*(h-horizon);
    const e=roadEdgesAt(y,horizon,w,centerShift);
    const dashW=3+(1-p)*11;
    const dashH=6+(1-p)*34;
    ctx.fillStyle="rgba(255,255,255,.72)";
    ctx.fillRect(e.center-dashW/2,y-dashH/2,dashW,dashH);
  }
  ctx.strokeStyle=t.accent;ctx.lineWidth=8;
  ctx.beginPath();ctx.moveTo(a.left,horizon);ctx.lineTo(b.left,h);ctx.moveTo(a.right,horizon);ctx.lineTo(b.right,h);ctx.stroke();
}

function projectObject(obj,horizon,w,centerShift){
  const ahead=obj.d-distance;
  if(ahead<-30||ahead>900)return null;
  const p=1-ahead/900;
  const y=horizon+p*p*(canvas.height-horizon);
  const e=roadEdgesAt(y,horizon,w,centerShift);
  const x=e.center+obj.l*(e.right-e.left)*.42;
  const s=.25+p*1.2;
  return{x,y,s,p};
}

function drawObjects(w,h,horizon,centerShift,t){
  const all=[
    ...relics.filter(o=>!o.collected).map(o=>({...o,type:"relic"})),
    ...hazards.filter(o=>!o.hit).map(o=>({...o,type:"hazard"})),
    ...boosts.filter(o=>!o.used).map(o=>({...o,type:"boost"}))
  ].sort((a,b)=>b.d-a.d);

  all.forEach(o=>{
    const p=projectObject(o,horizon,w,centerShift); if(!p)return;
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.s,p.s);
    if(o.type==="relic"){
      ctx.fillStyle="#ffd166";ctx.beginPath();
      for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5;const r=i%2?9:18;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}
      ctx.closePath();ctx.fill();ctx.strokeStyle="#fff4b0";ctx.lineWidth=2;ctx.stroke();
    }else if(o.type==="hazard"){
      ctx.fillStyle="#372f2b";ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#6f625b";ctx.fillRect(-14,-10,28,8);
    }else{
      ctx.strokeStyle=t.accent;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-30,18);ctx.lineTo(-30,-28);ctx.lineTo(30,-28);ctx.lineTo(30,18);ctx.stroke();
      ctx.fillStyle="#ffffff";ctx.font="bold 20px system-ui";ctx.textAlign="center";ctx.fillText("BOOST",0,-36);
    }
    ctx.restore();
  });
}

function drawCar(w,h,t){
  const x=w/2+lateral*w*.2,y=h*.79;
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle="rgba(0,0,0,.28)";ctx.beginPath();ctx.ellipse(0,28,62,16,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=t.accent;ctx.beginPath();ctx.roundRect(-50,-40,100,76,20);ctx.fill();
  ctx.fillStyle="#d9f0f7";ctx.beginPath();ctx.roundRect(-31,-29,62,28,10);ctx.fill();
  ctx.fillStyle="#17212b";ctx.fillRect(-45,25,20,16);ctx.fillRect(25,25,20,16);
  ctx.fillStyle="#fff6bf";ctx.fillRect(-38,-34,17,8);ctx.fillRect(21,-34,17,8);
  ctx.restore();
}

function drawParticles(){
  particles.forEach(p=>{ctx.globalAlpha=p.life;ctx.fillStyle="#fff2a8";ctx.fillRect(p.x,p.y,5,12);});ctx.globalAlpha=1;
}

function drawProgress(w,h,t){
  if(state!=="racing")return;
  const x=22,y=22,bw=260;
  ctx.fillStyle="rgba(7,11,16,.55)";ctx.beginPath();ctx.roundRect(x,y,bw,38,12);ctx.fill();
  ctx.fillStyle="rgba(255,255,255,.16)";ctx.fillRect(x+14,y+17,bw-28,5);
  ctx.fillStyle=t.accent;ctx.fillRect(x+14,y+17,(bw-28)*Math.min(1,distance/t.length),5);
  ctx.fillStyle="#fff";ctx.font="700 13px system-ui";ctx.fillText(`${Math.round(distance)} / ${t.length} m`,x+14,y+12);
}

function drawAttractMode(w,h,t){
  ctx.fillStyle="rgba(0,0,0,.12)";ctx.fillRect(0,0,w,h);
}

function loop(now){
  const dt=Math.min(40,now-last);last=now;
  update(dt);draw();requestAnimationFrame(loop);
}
syncUI();requestAnimationFrame(loop);
