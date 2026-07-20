"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });

const els = {
  menu: document.getElementById("menu"),
  finish: document.getElementById("finish"),
  hud: document.getElementById("hud"),
  touch: document.getElementById("touchControls"),
  countdown: document.getElementById("countdown"),
  countdownNumber: document.querySelector("#countdown span"),
  grid: document.getElementById("trackGrid"),
  selectedTitle: document.getElementById("selectedTitle"),
  selectedDescription: document.getElementById("selectedDescription"),
  trackName: document.getElementById("trackName"),
  country: document.getElementById("countryLabel"),
  time: document.getElementById("timeReadout"),
  best: document.getElementById("bestReadout"),
  relics: document.getElementById("relicReadout"),
  speed: document.getElementById("speedReadout"),
  speedBar: document.getElementById("speedBar"),
  nitroBar: document.getElementById("nitroBar"),
  status: document.getElementById("statusText"),
  start: document.getElementById("startBtn"),
  retry: document.getElementById("retryBtn"),
  next: document.getElementById("nextBtn"),
  menuBtn: document.getElementById("menuBtn"),
  sound: document.getElementById("soundBtn"),
  fullscreen: document.getElementById("fullscreenBtn"),
  steeringWheel: document.getElementById("steeringWheel"),
  wheelFace: document.getElementById("wheelFace"),
  steeringStatus: document.getElementById("steeringStatus"),
  gas: document.getElementById("gasBtn"),
  brake: document.getElementById("brakeBtn"),
  nitro: document.getElementById("nitroBtn"),
  finishTitle: document.getElementById("finishTitle"),
  finishTime: document.getElementById("finishTime"),
  finishRelics: document.getElementById("finishRelics"),
  finishBonus: document.getElementById("finishBonus"),
  finishSpeed: document.getElementById("finishSpeed")
};

const tracks = [
  {
    name: "Great Wall Run", country: "CHINA", image: "assets/great-wall.jpg", focus: "center 44%",
    description: "Thread the mountain ridges beside the Great Wall of China.",
    length: 5400, road: [54,56,60], shoulder: [169,58,38], accent: "#e44e38", skyTint: "rgba(28,74,96,.16)",
    curves: [.08,.34,-.18,.48,-.5,.18,.32,-.25]
  },
  {
    name: "Petra Canyon", country: "JORDAN", image: "assets/petra-cinematic.jpg", focus: "center 50%",
    description: "Blast through sandstone canyons toward Petra's Treasury.",
    length: 5200, road: [59,48,45], shoulder: [175,92,58], accent: "#ff944e", skyTint: "rgba(119,50,20,.16)",
    curves: [-.18,.42,.2,-.55,.48,-.22,.3,-.4]
  },
  {
    name: "Machu Picchu Climb", country: "PERU", image: "assets/machu-picchu.jpg", focus: "center 46%",
    description: "Climb into the Andes and race above the Lost City of the Incas.",
    length: 5600, road: [50,53,50], shoulder: [77,114,59], accent: "#b7e268", skyTint: "rgba(30,71,60,.14)",
    curves: [.22,-.58,.5,-.28,.62,-.44,.25,-.12]
  },
  {
    name: "Taj Midnight", country: "INDIA", image: "assets/taj-mahal.jpg", focus: "center 44%",
    description: "A moonlit sprint along the reflecting pools of the Taj Mahal.",
    length: 5100, road: [47,50,62], shoulder: [68,87,99], accent: "#e7d6b6", skyTint: "rgba(18,31,80,.24)",
    curves: [.1,-.28,.44,-.46,.22,.34,-.18,.4]
  },
  {
    name: "Colosseum Circuit", country: "ITALY", image: "assets/colosseum.jpg", focus: "center 52%",
    description: "Power through Rome on a technical circuit beside the Colosseum.",
    length: 5000, road: [54,52,51], shoulder: [151,109,72], accent: "#f06c48", skyTint: "rgba(88,52,12,.1)",
    curves: [.46,-.46,.66,-.62,.34,-.18,.52,-.4]
  },
  {
    name: "Kukulcán Storm", country: "MEXICO", image: "assets/chichen-itza.jpg", focus: "center 45%",
    description: "Race beneath tropical skies toward the pyramid of Kukulcán.",
    length: 5450, road: [49,56,52], shoulder: [73,116,61], accent: "#ffd251", skyTint: "rgba(24,75,56,.12)",
    curves: [-.12,.48,-.42,.28,.55,-.52,.18,.35]
  },
  {
    name: "Rio Skyline", country: "BRAZIL", image: "assets/rio-cinematic.jpg", focus: "center 50%",
    description: "Charge up Corcovado beneath Christ the Redeemer and the Rio sky.",
    length: 5300, road: [45,52,57], shoulder: [45,119,74], accent: "#ffe45d", skyTint: "rgba(11,83,122,.12)",
    curves: [.3,-.22,.58,-.54,.18,-.34,.46,-.2]
  }
];

const images = tracks.map(track => {
  const image = new Image();
  image.src = track.image;
  return image;
});

let selectedTrack = 0;
let gameState = "menu";
let elapsed = 0;
let penalties = 0;
let distance = 0;
let speed = 0;
let topSpeed = 0;
let lateral = 0;
let lateralVelocity = 0;
let steering = 0;
let steeringTarget = 0;
let leftKeyDown = false;
let rightKeyDown = false;
let throttlePressed = false;
let braking = false;
let nitroPressed = false;
let nitro = 100;
let shake = 0;
let messageTimer = 0;
let countdownTimer = 0;
let countdownValue = 3;
let lastTime = performance.now();
let objects = [];
let particles = [];
let scenery = [];
let finishTimeValue = 0;
let engineAudio = null;
let soundOn = true;
let audioContext = null;
let engineOsc = null;
let engineGain = null;
let steerPointer = null;
let wheelHeld = false;
let wheelRotation = 0;
let wheelStartRotation = 0;
let wheelStartPointerX = 0;
const MAX_WHEEL_ROTATION = 135;
const WHEEL_DRAG_RANGE = 150;
const STEERING_DEAD_ZONE = 0.065;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = seed => {
  const x = Math.sin(seed * 137.271) * 43758.5453;
  return x - Math.floor(x);
};

function resizeCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(960, Math.round(rect.width * dpr));
  canvas.height = Math.max(540, Math.round(rect.height * dpr));
}
addEventListener("resize", resizeCanvas);
resizeCanvas();

function formatTime(ms) {
  const safe = Math.max(0, ms);
  const minutes = Math.floor(safe / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  const milliseconds = Math.floor(safe % 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

function bestKey() { return `wondersRallyDeluxe_${selectedTrack}`; }
function getBest() { return Number(localStorage.getItem(bestKey()) || 0); }
function saveBest(value) {
  const current = getBest();
  if (!current || value < current) localStorage.setItem(bestKey(), String(value));
}

function renderTrackCards() {
  els.grid.innerHTML = "";
  tracks.forEach((track, index) => {
    const button = document.createElement("button");
    button.className = `track-card${index === selectedTrack ? " selected" : ""}`;
    button.style.setProperty("--thumb", `url('${track.image}')`);
    button.style.setProperty("--focus", track.focus);
    button.innerHTML = `<span class="card-copy"><strong>${track.name}</strong><small>${track.country}</small></span>`;
    button.addEventListener("click", () => {
      selectedTrack = index;
      renderTrackCards();
      updateMenuCopy();
      drawFrame();
    });
    els.grid.appendChild(button);
  });
}

function updateMenuCopy() {
  const track = tracks[selectedTrack];
  els.selectedTitle.textContent = track.name;
  els.selectedDescription.textContent = track.description;
  els.trackName.textContent = track.name;
  els.country.textContent = track.country;
  const best = getBest();
  els.best.textContent = best ? formatTime(best) : "--:--.---";
}

function buildStage() {
  const track = tracks[selectedTrack];
  objects = [];
  scenery = [];
  particles = [];
  for (let i = 1; i <= 8; i++) {
    objects.push({ type: "relic", d: i * track.length / 9, lane: (rand(i + selectedTrack * 17) - .5) * 1.25, used: false });
  }
  for (let i = 1; i <= 16; i++) {
    objects.push({ type: "hazard", d: 300 + i * track.length / 18, lane: (rand(i * 4 + selectedTrack * 29) - .5) * 1.45, used: false });
  }
  for (let i = 1; i <= 8; i++) {
    objects.push({ type: "boost", d: 450 + i * track.length / 9, lane: (rand(i * 9 + selectedTrack * 7) - .5) * .95, used: false });
  }
  for (let i = 0; i < 80; i++) {
    scenery.push({ d: 120 + i * 92, side: rand(i * 11) > .5 ? 1 : -1, type: i % 4 });
  }
}

function startRace() {
  ensureAudio();
  elapsed = 0;
  penalties = 0;
  distance = 0;
  speed = 0;
  topSpeed = 0;
  lateral = 0;
  lateralVelocity = 0;
  steering = 0;
  steeringTarget = 0;
  wheelRotation = 0;
  steerPointer = null;
  wheelHeld = false;
  leftKeyDown = false;
  rightKeyDown = false;
  updateWheelVisual(0);
  throttlePressed = false;
  braking = false;
  nitroPressed = false;
  nitro = 100;
  shake = 0;
  messageTimer = 0;
  buildStage();
  gameState = "countdown";
  countdownTimer = 0;
  countdownValue = 3;
  els.menu.classList.remove("show");
  els.finish.classList.remove("show");
  els.hud.classList.remove("hidden");
  els.touch.classList.remove("hidden");
  els.countdown.classList.add("show");
  showCountdown(3);
  updateHUD();
}

function showCountdown(value) {
  els.countdownNumber.textContent = value === 0 ? "GO" : value;
  els.countdownNumber.style.animation = "none";
  void els.countdownNumber.offsetWidth;
  els.countdownNumber.style.animation = "countPop .72s both";
  tone(value === 0 ? 880 : 420 + (3 - value) * 100, value === 0 ? .2 : .08, value === 0 ? .12 : .07);
}

function finishRace() {
  gameState = "finished";
  speed = 0;
  stopEngine();
  const found = objects.filter(o => o.type === "relic" && o.used).length;
  const bonus = found * 900;
  finishTimeValue = Math.max(1000, elapsed + penalties - bonus);
  saveBest(finishTimeValue);
  els.finishTitle.textContent = found === 8 ? "PERFECT RELIC RUN" : "WONDER CONQUERED";
  els.finishTime.textContent = formatTime(finishTimeValue);
  els.finishRelics.textContent = `${found} / 8`;
  els.finishBonus.textContent = `-${(bonus / 1000).toFixed(3)}s`;
  els.finishSpeed.textContent = `${Math.round(topSpeed)} km/h`;
  els.hud.classList.add("hidden");
  els.touch.classList.add("hidden");
  els.finish.classList.add("show");
  tone(660, .15, .12);
  setTimeout(() => tone(880, .22, .14), 130);
}

function returnToMenu() {
  gameState = "menu";
  stopEngine();
  els.finish.classList.remove("show");
  els.hud.classList.add("hidden");
  els.touch.classList.add("hidden");
  els.menu.classList.add("show");
  updateMenuCopy();
}

function nextTrack() {
  selectedTrack = (selectedTrack + 1) % tracks.length;
  renderTrackCards();
  updateMenuCopy();
  startRace();
}

function ensureAudio() {
  if (!soundOn) return;
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
}

function startEngine() {
  if (!soundOn || engineOsc) return;
  ensureAudio();
  engineOsc = audioContext.createOscillator();
  const second = audioContext.createOscillator();
  engineGain = audioContext.createGain();
  const secondGain = audioContext.createGain();
  engineOsc.type = "sawtooth";
  second.type = "square";
  engineGain.gain.value = .018;
  secondGain.gain.value = .006;
  engineOsc.connect(engineGain).connect(audioContext.destination);
  second.connect(secondGain).connect(audioContext.destination);
  engineOsc.start();
  second.start();
  engineAudio = { second, secondGain };
}

function updateEngine() {
  if (!engineOsc || !audioContext) return;
  const now = audioContext.currentTime;
  const frequency = 46 + speed * .72 + (nitroPressed ? 38 : 0);
  engineOsc.frequency.setTargetAtTime(frequency, now, .05);
  engineAudio.second.frequency.setTargetAtTime(frequency * 1.97, now, .06);
  engineGain.gain.setTargetAtTime(gameState === "racing" ? .018 + speed / 260 * .025 : .002, now, .08);
}

function stopEngine() {
  if (!engineOsc) return;
  try { engineOsc.stop(); engineAudio.second.stop(); } catch (_) {}
  engineOsc = null;
  engineGain = null;
  engineAudio = null;
}

function tone(frequency, duration = .08, volume = .08) {
  if (!soundOn) return;
  ensureAudio();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function trackCurveAt(position) {
  const track = tracks[selectedTrack];
  const segmentLength = track.length / track.curves.length;
  const index = Math.floor(position / segmentLength) % track.curves.length;
  const local = (position % segmentLength) / segmentLength;
  const next = (index + 1) % track.curves.length;
  return lerp(track.curves[index], track.curves[next], local);
}

function roadCenterAt(p, curve, width) {
  const bend = curve * width * .52;
  return width * .5 + bend * (1 - p) * (1 - p) - lateral * width * .18 * p;
}

function updateGame(dt) {
  if (gameState === "countdown") {
    countdownTimer += dt;
    const next = 3 - Math.floor(countdownTimer / 760);
    if (next !== countdownValue && next >= 0) {
      countdownValue = next;
      showCountdown(next);
    }
    if (countdownTimer >= 3040) {
      gameState = "racing";
      els.countdown.classList.remove("show");
      startEngine();
      els.status.textContent = "HOLD ACCELERATOR TO LAUNCH";
      messageTimer = 1400;
    }
    return;
  }
  if (gameState !== "racing") return;

  elapsed += dt;
  const track = tracks[selectedTrack];

  if (!wheelHeld) steeringTarget = 0;
  const steeringResponse = wheelHeld ? 18 : 16;
  steering += (steeringTarget - steering) * (1 - Math.exp(-steeringResponse * dt / 1000));
  if (Math.abs(steeringTarget) < .001 && Math.abs(steering) < .006) steering = 0;
  if (!wheelHeld) {
    wheelRotation = steering * MAX_WHEEL_ROTATION;
    updateWheelVisual(wheelRotation);
  }

  const keyboardSteering = (rightKeyDown ? 1 : 0) - (leftKeyDown ? 1 : 0);
  const wheelSteering = Math.abs(steering) < STEERING_DEAD_ZONE ? 0 : steering;
  const combinedSteering = clamp(keyboardSteering + wheelSteering, -1, 1);
  const offRoad = Math.abs(lateral) > 1.0;
  const nitroActive = nitroPressed && throttlePressed && nitro > 1 && !braking;
  const maximumSpeed = nitroActive ? 310 : 242;

  if (braking) {
    speed -= (188 + speed * .48) * dt / 1000;
  } else if (throttlePressed) {
    const driveForce = (nitroActive ? 112 : 82) * Math.max(.08, 1 - speed / maximumSpeed);
    const rollingResistance = nitroActive ? 3 : 7;
    speed += (driveForce - rollingResistance) * dt / 1000;
  } else {
    speed -= (22 + speed * .085) * dt / 1000;
  }

  if (offRoad) {
    speed -= (62 + speed * .16) * dt / 1000;
    penalties += dt * .045;
    spawnDust(2);
    if (messageTimer <= 0) setStatus("OFF ROAD — TRACTION REDUCED", 700);
  }

  if (nitroActive) {
    nitro -= 25 * dt / 1000;
    spawnNitro(2);
  } else {
    nitro += 3.5 * dt / 1000;
  }
  nitro = clamp(nitro, 0, 100);
  speed = clamp(speed, 0, 310);
  topSpeed = Math.max(topSpeed, speed);

  const speedRatio = clamp(speed / 242, 0, 1.25);
  const roadGrip = offRoad ? .48 : 1;
  const nitroGrip = nitroActive ? .78 : 1;
  const brakeTurnAssist = braking ? 1.13 : 1;
  const steeringAuthority = (.44 + speedRatio * .72) * roadGrip * nitroGrip * brakeTurnAssist;
  const steeringIsNeutral = combinedSteering === 0;
  // Stability control cancels residual sideways motion and gently returns the car
  // toward the road center. Track curvature is visual only and never steers the car.
  const centerAssist = steeringIsNeutral ? clamp(-lateral * .22, -.12, .12) : 0;
  const desiredLateralVelocity = steeringIsNeutral ? centerAssist : combinedSteering * steeringAuthority;
  const gripResponse = offRoad ? 4.8 : (steeringIsNeutral ? 13.5 : 7.2);
  lateralVelocity += (desiredLateralVelocity - lateralVelocity) * (1 - Math.exp(-gripResponse * dt / 1000));
  if (steeringIsNeutral && Math.abs(lateralVelocity) < .0025) lateralVelocity = 0;
  lateral += lateralVelocity * dt / 1000;
  if (steeringIsNeutral && Math.abs(lateral) < .004 && Math.abs(lateralVelocity) < .004) {
    lateral = 0;
    lateralVelocity = 0;
  }

  if (Math.abs(lateral) > 1.38) {
    lateral = Math.sign(lateral) * 1.38;
    lateralVelocity *= -.16;
    speed *= .985;
  }

  distance += speed * .29 * dt / 1000;

  checkObjects();
  updateParticles(dt);
  updateEngine();
  if (messageTimer > 0) messageTimer -= dt;
  else if (speed < 3 && !throttlePressed) els.status.textContent = "HOLD ACCELERATOR TO MOVE";
  else els.status.textContent = `${Math.max(0, Math.round(track.length - distance))} M TO FINISH`;

  if (distance >= track.length) finishRace();
  updateHUD();
}

function setStatus(text, duration) {
  els.status.textContent = text;
  messageTimer = duration;
}

function checkObjects() {
  objects.forEach(object => {
    if (object.used) return;
    const close = Math.abs(object.d - distance) < 18 + speed * .025;
    const aligned = Math.abs(object.lane - lateral) < (object.type === "boost" ? .35 : .24);
    if (!close || !aligned) return;
    object.used = true;
    if (object.type === "relic") {
      setStatus("RELIC SECURED — TIME BONUS", 1050);
      tone(980, .12, .1);
      burst(30, "relic");
    } else if (object.type === "boost") {
      speed = Math.min(300, speed + 48);
      nitro = Math.min(100, nitro + 18);
      setStatus("BOOST GATE — NITRO CHARGED", 900);
      tone(1240, .1, .09);
      burst(34, "boost");
    } else {
      speed *= .5;
      penalties += 1100;
      shake = 24;
      setStatus("IMPACT — +1.1 SECONDS", 1100);
      tone(115, .18, .13);
      burst(28, "impact");
    }
  });
}

function burst(count, type) {
  for (let i = 0; i < count; i++) {
    particles.push({
      type,
      x: canvas.width * .5 + (Math.random() - .5) * 120,
      y: canvas.height * .72,
      vx: (Math.random() - .5) * 18,
      vy: -Math.random() * 16 - 2,
      life: 1,
      size: 3 + Math.random() * 8
    });
  }
}
function spawnDust(count) {
  for (let i = 0; i < count; i++) particles.push({type:"dust",x:canvas.width*(.5+lateral*.12)+(Math.random()-.5)*100,y:canvas.height*.83,vx:(Math.random()-.5)*5,vy:-Math.random()*4,life:.7,size:14+Math.random()*24});
}
function spawnNitro(count) {
  for (let i = 0; i < count; i++) particles.push({type:"nitro",x:canvas.width*.5+(Math.random()-.5)*55,y:canvas.height*.86,vx:(Math.random()-.5)*3,vy:Math.random()*9+5,life:.6,size:4+Math.random()*7});
}
function updateParticles(dt) {
  particles.forEach(p => {
    p.x += p.vx * dt / 16.67;
    p.y += p.vy * dt / 16.67;
    p.life -= dt / (p.type === "dust" ? 950 : 650);
    if (p.type === "dust") p.size += dt * .035;
  });
  particles = particles.filter(p => p.life > 0);
}

function updateHUD() {
  const found = objects.filter(o => o.type === "relic" && o.used).length;
  els.time.textContent = formatTime(elapsed + penalties);
  els.relics.textContent = `${found} / 8`;
  els.speed.textContent = Math.round(speed);
  els.speedBar.style.width = `${clamp(speed / 300 * 100, 0, 100)}%`;
  els.nitroBar.style.width = `${nitro}%`;
  const best = getBest();
  els.best.textContent = best ? formatTime(best) : "--:--.---";
}

function drawCoverImage(image, x, y, width, height, focusX = .5, focusY = .5) {
  if (!image.complete || !image.naturalWidth) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#44637b");
    gradient.addColorStop(1, "#17212a");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    return;
  }
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  if (imageRatio > targetRatio) sourceWidth = sourceHeight * targetRatio;
  else sourceHeight = sourceWidth / targetRatio;
  const sourceX = clamp((image.naturalWidth - sourceWidth) * focusX, 0, image.naturalWidth - sourceWidth);
  const sourceY = clamp((image.naturalHeight - sourceHeight) * focusY, 0, image.naturalHeight - sourceHeight);
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawBackground(width, height, track, curve) {
  const focusParts = track.focus.split(" ");
  const focusY = parseInt(focusParts[1] || "50", 10) / 100;
  const panX = clamp(.5 + curve * .05 - lateral * .025, .38, .62);
  drawCoverImage(images[selectedTrack], 0, 0, width, height * .72, panX, focusY);

  const grade = ctx.createLinearGradient(0, 0, 0, height * .72);
  grade.addColorStop(0, track.skyTint);
  grade.addColorStop(.63, "rgba(0,0,0,.02)");
  grade.addColorStop(1, "rgba(0,0,0,.68)");
  ctx.fillStyle = grade;
  ctx.fillRect(0, 0, width, height * .74);

  const haze = ctx.createLinearGradient(0, height * .27, 0, height * .55);
  haze.addColorStop(0, "rgba(255,255,255,0)");
  haze.addColorStop(1, "rgba(224,236,242,.25)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, height * .24, width, height * .34);
}

function drawRoad(width, height, track, curve) {
  const horizon = height * .47;
  const bottom = height * 1.03;
  const segments = 70;
  for (let i = 0; i < segments; i++) {
    const p0 = i / segments;
    const p1 = (i + 1) / segments;
    const y0 = lerp(horizon, bottom, p0 * p0);
    const y1 = lerp(horizon, bottom, p1 * p1);
    const half0 = lerp(width * .035, width * .53, p0 * p0);
    const half1 = lerp(width * .035, width * .53, p1 * p1);
    const center0 = roadCenterAt(p0, curve, width);
    const center1 = roadCenterAt(p1, curve, width);
    const stripe = ((i + Math.floor(distance / 10)) % 8) < 4;
    const roadShade = stripe ? track.road.map(v => v + 4) : track.road.map(v => v - 3);

    drawQuad(center0 - half0 * 1.09, y0, center0 + half0 * 1.09, y0, center1 + half1 * 1.09, y1, center1 - half1 * 1.09, y1, `rgb(${track.shoulder.join(",")})`);
    drawQuad(center0 - half0, y0, center0 + half0, y0, center1 + half1, y1, center1 - half1, y1, `rgb(${roadShade.join(",")})`);

    if (i % 6 < 3) {
      const laneWidth0 = lerp(.7, 8, p0 * p0);
      const laneWidth1 = lerp(.7, 8, p1 * p1);
      [-.34, .34].forEach(offset => {
        const x0 = center0 + half0 * offset;
        const x1 = center1 + half1 * offset;
        drawQuad(x0 - laneWidth0, y0, x0 + laneWidth0, y0, x1 + laneWidth1, y1, x1 - laneWidth1, y1, "rgba(238,241,232,.78)");
      });
    }

    if (i % 5 < 3) {
      const edge0 = lerp(1, 11, p0 * p0);
      const edge1 = lerp(1, 11, p1 * p1);
      drawQuad(center0 - half0 - edge0, y0, center0 - half0 + edge0, y0, center1 - half1 + edge1, y1, center1 - half1 - edge1, y1, track.accent);
      drawQuad(center0 + half0 - edge0, y0, center0 + half0 + edge0, y0, center1 + half1 + edge1, y1, center1 + half1 - edge1, y1, track.accent);
    }
  }

  const roadShade = ctx.createLinearGradient(0, horizon, 0, height);
  roadShade.addColorStop(0, "rgba(0,0,0,.38)");
  roadShade.addColorStop(.5, "rgba(0,0,0,0)");
  roadShade.addColorStop(1, "rgba(0,0,0,.18)");
  ctx.fillStyle = roadShade;
  ctx.fillRect(0, horizon, width, height - horizon);
}

function drawQuad(x1,y1,x2,y2,x3,y3,x4,y4,fill) {
  ctx.beginPath();
  ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.lineTo(x4,y4);ctx.closePath();
  ctx.fillStyle = fill;ctx.fill();
}

function projectObject(object, width, height, curve) {
  const ahead = object.d - distance;
  if (ahead < -25 || ahead > 720) return null;
  const depth = 1 - ahead / 720;
  const p = depth * depth;
  const horizon = height * .47;
  const y = lerp(horizon, height * .91, p);
  const half = lerp(width * .035, width * .50, p);
  const center = roadCenterAt(depth, curve, width);
  return {x:center + object.lane * half * .72,y,scale:.18 + p * 1.28,depth};
}

function drawScenery(width, height, curve, track) {
  scenery.forEach(item => {
    const fake = { d: item.d, lane: item.side * 1.68 };
    const p = projectObject(fake, width, height, curve);
    if (!p) return;
    const size = 10 + p.scale * 30;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = clamp(p.depth * 1.2, .1, 1);
    if (item.type === 0) {
      ctx.fillStyle = "#17271b";
      ctx.beginPath();ctx.moveTo(0,-size*2.4);ctx.lineTo(-size,size*.25);ctx.lineTo(size,size*.25);ctx.closePath();ctx.fill();
      ctx.fillStyle = "#3a2d20";ctx.fillRect(-size*.12,0,size*.24,size*.55);
    } else if (item.type === 1) {
      ctx.fillStyle = track.accent;ctx.fillRect(-size*.08,-size*1.8,size*.16,size*2.15);
      ctx.fillStyle = "rgba(255,255,255,.85)";ctx.beginPath();ctx.moveTo(0,-size*1.75);ctx.lineTo(item.side*size*.75,-size*1.45);ctx.lineTo(0,-size*1.15);ctx.closePath();ctx.fill();
    } else {
      ctx.fillStyle = "rgba(24,25,26,.9)";ctx.beginPath();ctx.arc(0,0,size*.45,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  });
}

function drawObjects(width, height, curve, track) {
  const visible = objects.filter(o => !o.used).map(o => ({...o,projection:projectObject(o,width,height,curve)})).filter(o=>o.projection).sort((a,b)=>a.d-b.d);
  visible.forEach(object => {
    const p = object.projection;
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.scale,p.scale);
    if (object.type === "relic") drawRelic();
    else if (object.type === "boost") drawBoostGate(track.accent);
    else drawHazard();
    ctx.restore();
  });
}

function drawRelic() {
  ctx.shadowColor = "#ffd567";ctx.shadowBlur = 22;
  const gradient = ctx.createLinearGradient(0,-25,0,25);gradient.addColorStop(0,"#fff7c7");gradient.addColorStop(.4,"#ffd15c");gradient.addColorStop(1,"#ae6413");
  ctx.fillStyle = gradient;ctx.beginPath();
  for(let i=0;i<8;i++){const a=-Math.PI/2+i*Math.PI/4;const r=i%2?10:24;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;ctx.strokeStyle="rgba(255,255,255,.8)";ctx.lineWidth=2;ctx.stroke();
}
function drawBoostGate(accent) {
  ctx.shadowColor = accent;ctx.shadowBlur=20;ctx.strokeStyle=accent;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-42,25);ctx.lineTo(-42,-42);ctx.lineTo(42,-42);ctx.lineTo(42,25);ctx.stroke();
  ctx.shadowBlur=0;ctx.fillStyle="#fff";ctx.font="900 16px system-ui";ctx.textAlign="center";ctx.fillText("BOOST",0,-52);
}
function drawHazard() {
  ctx.fillStyle="rgba(0,0,0,.38)";ctx.beginPath();ctx.ellipse(0,14,34,10,0,0,Math.PI*2);ctx.fill();
  const g=ctx.createLinearGradient(0,-25,0,25);g.addColorStop(0,"#7f746b");g.addColorStop(1,"#272421");ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-28,18);ctx.lineTo(-20,-9);ctx.lineTo(-4,-25);ctx.lineTo(23,-12);ctx.lineTo(30,18);ctx.closePath();ctx.fill();
}

function drawCar(width, height, track) {
  const carX = width * .5 + lateral * width * .09;
  const carY = height * .80;
  const scale = Math.min(width / 1600, height / 900) * 1.03;
  ctx.save();
  ctx.translate(carX, carY);
  ctx.scale(scale, scale);
  const visualSteering = clamp(((rightKeyDown ? 1 : 0) - (leftKeyDown ? 1 : 0)) + (Math.abs(steering) < STEERING_DEAD_ZONE ? 0 : steering), -1, 1);
  ctx.rotate(visualSteering * -.04);

  ctx.fillStyle="rgba(0,0,0,.5)";ctx.filter="blur(10px)";ctx.beginPath();ctx.ellipse(0,74,130,27,0,0,Math.PI*2);ctx.fill();ctx.filter="none";

  const body=ctx.createLinearGradient(-95,-80,95,80);body.addColorStop(0,"#121820");body.addColorStop(.28,track.accent);body.addColorStop(.62,"#a91818");body.addColorStop(1,"#0a0d12");
  ctx.fillStyle=body;ctx.beginPath();ctx.moveTo(-112,55);ctx.lineTo(-96,-25);ctx.quadraticCurveTo(-75,-75,-42,-88);ctx.lineTo(42,-88);ctx.quadraticCurveTo(76,-74,97,-24);ctx.lineTo(112,55);ctx.quadraticCurveTo(102,76,78,79);ctx.lineTo(-78,79);ctx.quadraticCurveTo(-102,76,-112,55);ctx.closePath();ctx.fill();

  const glass=ctx.createLinearGradient(0,-80,0,-25);glass.addColorStop(0,"#bdeaff");glass.addColorStop(.3,"#38576b");glass.addColorStop(1,"#111b24");
  ctx.fillStyle=glass;ctx.beginPath();ctx.moveTo(-42,-75);ctx.quadraticCurveTo(-18,-92,0,-92);ctx.quadraticCurveTo(18,-92,42,-75);ctx.lineTo(67,-28);ctx.lineTo(-67,-28);ctx.closePath();ctx.fill();
  ctx.strokeStyle="rgba(255,255,255,.3)";ctx.lineWidth=3;ctx.stroke();

  ctx.fillStyle="#080a0d";ctx.beginPath();ctx.roundRect(-101,45,202,28,9);ctx.fill();
  ctx.fillStyle="#ff2d2d";ctx.shadowColor="#ff1f1f";ctx.shadowBlur=18;ctx.beginPath();ctx.roundRect(-89,32,47,14,6);ctx.roundRect(42,32,47,14,6);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle="#e5edf4";ctx.beginPath();ctx.roundRect(-31,44,62,20,4);ctx.fill();ctx.fillStyle="#1a2028";ctx.font="900 12px system-ui";ctx.textAlign="center";ctx.fillText("WONDERS",0,59);

  ctx.fillStyle="#050608";ctx.beginPath();ctx.roundRect(-121,13,25,62,8);ctx.roundRect(96,13,25,62,8);ctx.fill();
  ctx.fillStyle="#10151c";ctx.fillRect(-100,-2,200,9);
  ctx.fillStyle="rgba(255,255,255,.22)";ctx.beginPath();ctx.moveTo(-70,-20);ctx.lineTo(-45,-65);ctx.lineTo(-37,-65);ctx.lineTo(-57,-20);ctx.closePath();ctx.fill();

  if (nitroPressed && throttlePressed && nitro > 0 && !braking) {
    [-24,24].forEach(x=>{
      const flame=ctx.createLinearGradient(0,70,0,125);flame.addColorStop(0,"#fff");flame.addColorStop(.25,"#5deaff");flame.addColorStop(1,"rgba(29,70,255,0)");ctx.fillStyle=flame;ctx.beginPath();ctx.moveTo(x-9,70);ctx.quadraticCurveTo(x,126+Math.random()*16,x+9,70);ctx.closePath();ctx.fill();
    });
  }
  ctx.restore();
}

function drawParticles() {
  particles.forEach(p=>{
    ctx.save();ctx.globalAlpha=clamp(p.life,0,1);
    if(p.type==="dust"){ctx.fillStyle="rgba(193,169,128,.38)";ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
    else if(p.type==="nitro"){ctx.fillStyle="#70ecff";ctx.shadowColor="#3caeff";ctx.shadowBlur=12;ctx.fillRect(p.x,p.y,p.size,p.size*3);}
    else if(p.type==="impact"){ctx.fillStyle="#ff7045";ctx.fillRect(p.x,p.y,p.size,p.size);}
    else{ctx.fillStyle=p.type==="relic"?"#ffe06b":"#71ecff";ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=12;ctx.fillRect(p.x,p.y,p.size,p.size*2);}
    ctx.restore();
  });
}

function drawSpeedEffects(width,height) {
  if(speed<180)return;
  const intensity=(speed-180)/120;
  ctx.save();ctx.globalAlpha=.14*intensity;ctx.strokeStyle="#dff8ff";ctx.lineWidth=2;
  for(let i=0;i<34;i++){
    const angle=(i/34)*Math.PI*2+distance*.01;const inner=80+rand(i)*220;const outer=inner+80+rand(i+8)*260;const cx=width*.5,cy=height*.62;
    ctx.beginPath();ctx.moveTo(cx+Math.cos(angle)*inner,cy+Math.sin(angle)*inner*.62);ctx.lineTo(cx+Math.cos(angle)*outer,cy+Math.sin(angle)*outer*.62);ctx.stroke();
  }
  ctx.restore();
}

function drawVignette(width,height) {
  const vignette=ctx.createRadialGradient(width*.5,height*.48,height*.18,width*.5,height*.5,height*.78);vignette.addColorStop(.55,"rgba(0,0,0,0)");vignette.addColorStop(1,"rgba(0,0,0,.58)");ctx.fillStyle=vignette;ctx.fillRect(0,0,width,height);
  const cinematic=ctx.createLinearGradient(0,0,0,height);cinematic.addColorStop(0,"rgba(0,0,0,.12)");cinematic.addColorStop(.16,"rgba(0,0,0,0)");cinematic.addColorStop(.88,"rgba(0,0,0,0)");cinematic.addColorStop(1,"rgba(0,0,0,.25)");ctx.fillStyle=cinematic;ctx.fillRect(0,0,width,height);
}

function drawMenuBackdrop(width,height,track) {
  drawCoverImage(images[selectedTrack],0,0,width,height,.5,parseInt(track.focus.split(" ")[1]||"50")/100);
  const overlay=ctx.createLinearGradient(0,0,width,0);overlay.addColorStop(0,"rgba(0,0,0,.8)");overlay.addColorStop(.58,"rgba(0,0,0,.15)");overlay.addColorStop(1,"rgba(0,0,0,.48)");ctx.fillStyle=overlay;ctx.fillRect(0,0,width,height);
  drawVignette(width,height);
}

function drawFrame() {
  const width=canvas.width,height=canvas.height,track=tracks[selectedTrack];
  ctx.save();
  if(shake>0){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.86;}
  if(gameState==="menu"||gameState==="finished") drawMenuBackdrop(width,height,track);
  else {
    const curve=trackCurveAt(distance);
    drawBackground(width,height,track,curve);
    drawRoad(width,height,track,curve);
    drawScenery(width,height,curve,track);
    drawObjects(width,height,curve,track);
    drawSpeedEffects(width,height);
    drawCar(width,height,track);
    drawParticles();
    drawVignette(width,height);
    const progress=clamp(distance/track.length,0,1);
    ctx.fillStyle="rgba(0,0,0,.52)";ctx.fillRect(width*.34,height*.03,width*.32,5);
    ctx.fillStyle=track.accent;ctx.fillRect(width*.34,height*.03,width*.32*progress,5);
  }
  ctx.restore();
}

function loop(now) {
  const dt=Math.min(42,now-lastTime);lastTime=now;
  updateGame(dt);drawFrame();requestAnimationFrame(loop);
}

function updateWheelVisual(rotation) {
  const centered = Math.abs(rotation) <= MAX_WHEEL_ROTATION * STEERING_DEAD_ZONE;
  els.wheelFace.style.transform = `rotate(${rotation.toFixed(2)}deg)`;
  els.steeringWheel.setAttribute("aria-valuenow", String(Math.round(rotation / MAX_WHEEL_ROTATION * 100)));
  els.steeringWheel.classList.toggle("centered", centered);
  if (els.steeringStatus) {
    els.steeringStatus.textContent = centered ? "CENTERED" : `${Math.round(Math.abs(rotation / MAX_WHEEL_ROTATION) * 100)}% ${rotation < 0 ? "LEFT" : "RIGHT"}`;
    els.steeringStatus.classList.toggle("turning", !centered);
  }
}

function setWheelFromPointer(event) {
  // Horizontal drag is substantially more stable than angle tracking on iPad,
  // where touch jitter and angle wrapping can create a false steering command.
  const deltaX = event.clientX - wheelStartPointerX;
  const rawRotation = wheelStartRotation + deltaX / WHEEL_DRAG_RANGE * MAX_WHEEL_ROTATION;
  wheelRotation = clamp(rawRotation, -MAX_WHEEL_ROTATION, MAX_WHEEL_ROTATION);
  const normalized = wheelRotation / MAX_WHEEL_ROTATION;
  steeringTarget = Math.abs(normalized) < STEERING_DEAD_ZONE ? 0 : normalized;
  updateWheelVisual(wheelRotation);
}

function releaseSteering(forceImmediate = false) {
  wheelHeld = false;
  steeringTarget = 0;
  steerPointer = null;
  if (forceImmediate) {
    steering = 0;
    wheelRotation = 0;
    lateralVelocity = 0;
    updateWheelVisual(0);
  }
}

els.steeringWheel.addEventListener("pointerdown", event => {
  event.preventDefault();
  event.stopPropagation();
  steerPointer = event.pointerId;
  wheelHeld = true;
  wheelStartPointerX = event.clientX;
  wheelStartRotation = wheelRotation;
  els.steeringWheel.setPointerCapture?.(event.pointerId);
});
els.steeringWheel.addEventListener("pointermove", event => {
  if (event.pointerId === steerPointer && wheelHeld) {
    event.preventDefault();
    setWheelFromPointer(event);
  }
});
els.steeringWheel.addEventListener("pointerup", event => {
  if (event.pointerId === steerPointer) releaseSteering();
});
els.steeringWheel.addEventListener("pointercancel", () => releaseSteering(true));
els.steeringWheel.addEventListener("lostpointercapture", () => releaseSteering());
addEventListener("pointerup", event => { if (event.pointerId === steerPointer) releaseSteering(); }, true);
addEventListener("pointercancel", event => { if (event.pointerId === steerPointer) releaseSteering(true); }, true);

function setHoldButton(element,setter) {
  const down=e=>{e.preventDefault();element.setPointerCapture?.(e.pointerId);setter(true);element.classList.add("pressed");};
  const up=e=>{e.preventDefault();setter(false);element.classList.remove("pressed");};
  element.addEventListener("pointerdown",down);element.addEventListener("pointerup",up);element.addEventListener("pointercancel",up);element.addEventListener("pointerleave",e=>{if(e.buttons===0)up(e);});
}
setHoldButton(els.gas, value => throttlePressed = value);
setHoldButton(els.brake, value => braking = value);
setHoldButton(els.nitro, value => nitroPressed = value);

addEventListener("keydown",event=>{
  const key=event.key.toLowerCase();
  if(key==="arrowleft"||key==="a")leftKeyDown=true;
  if(key==="arrowright"||key==="d")rightKeyDown=true;
  if(key==="arrowup"||key==="w")throttlePressed=true;
  if(key==="arrowdown"||key==="s"||key===" ")braking=true;
  if(key==="shift")nitroPressed=true;
  if(["arrowleft","arrowright","arrowup","arrowdown"," "].includes(key))event.preventDefault();
});
addEventListener("keyup",event=>{
  const key=event.key.toLowerCase();
  if(key==="arrowleft"||key==="a")leftKeyDown=false;
  if(key==="arrowright"||key==="d")rightKeyDown=false;
  if(key==="arrowup"||key==="w")throttlePressed=false;
  if(key==="arrowdown"||key==="s"||key===" ")braking=false;
  if(key==="shift")nitroPressed=false;
});

function resetActiveControls() {
  leftKeyDown=false;
  rightKeyDown=false;
  throttlePressed=false;
  braking=false;
  nitroPressed=false;
  releaseSteering(true);
  els.gas.classList.remove("pressed");
  els.brake.classList.remove("pressed");
  els.nitro.classList.remove("pressed");
}
addEventListener("blur",resetActiveControls);

els.start.addEventListener("click",startRace);
els.retry.addEventListener("click",startRace);
els.next.addEventListener("click",nextTrack);
els.menuBtn.addEventListener("click",returnToMenu);
els.sound.addEventListener("click",()=>{
  soundOn=!soundOn;els.sound.textContent=soundOn?"SOUND ON":"SOUND OFF";
  if(!soundOn)stopEngine();
});
els.fullscreen.addEventListener("click",async()=>{
  try {
    if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  }catch(_){ }
});

document.addEventListener("visibilitychange",()=>{
  if(document.hidden){resetActiveControls();stopEngine();}
  else if(gameState==="racing")startEngine();
});

renderTrackCards();
updateMenuCopy();
requestAnimationFrame(loop);
