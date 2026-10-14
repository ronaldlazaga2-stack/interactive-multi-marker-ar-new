/**
 * HIRO AR — script.js (v10 — Minecraft-style walking animation)
 *
 * Position authority — all applied inside gameLoopTick:
 *   jumpY[name]        ← written by jump animation rAF only
 *   modelPositions     ← written by joystick movement
 *   walkPhase/Blend    ← written by walking system
 *   rotations[name]    ← lerped toward joystick heading while walking;
 *                        incremented by Rotate buttons; cleared by Reset
 *
 * Limb pivot IDs (in index.html):
 *   robot-arm-l / robot-arm-r / robot-leg-l / robot-leg-r
 *   mecha-arm-l / mecha-arm-r / mecha-leg-l / mecha-leg-r
 */
'use strict';

/* ---- DOM ---- */
const splash     = document.getElementById('splash');
const startBtn   = document.getElementById('start-btn');
const statusIcon = document.getElementById('status-icon');
const statusText = document.getElementById('status-text');
const arHud        = document.getElementById('ar-hud');
const arStatusIcon = document.getElementById('ar-status-icon');
const arStatusText = document.getElementById('ar-status-text');
const stopBtn      = document.getElementById('stop-btn');
const arScene    = document.getElementById('ar-scene');
const arControls = document.getElementById('ar-controls');
const joyZone    = document.getElementById('joystick-zone');
const joyHint    = document.getElementById('joystick-hint');
const modelBtns      = document.querySelectorAll('.model-btn');
const btnRotateLeft  = document.getElementById('btn-rotate-left');
const btnReset       = document.getElementById('btn-reset');
const btnRotateRight = document.getElementById('btn-rotate-right');
const btnJump        = document.getElementById('btn-jump');

/* ---- Constants ---- */
const VIDEO_READY_TIMEOUT_MS = 15000;
const VIDEO_POLL_INTERVAL_MS = 200;
const MOVE_SPEED      = 0.045;
const MAX_MOVE        = 0.85;
const JOY_DEAD        = 0.06;
const ROTATE_STEP     = 30;
const TURN_SPEED      = 0.12;
const JUMP_HEIGHT     = 0.45;
const JUMP_DURATION   = 650;
const WALK_SWING      = 34;
const WALK_PHASE_RATE = 8.5;
const BOB_HEIGHT      = 0.018;
const WALK_BLEND_RATE = 7;
const JOY_MAX_DIST    = 35;

/* ---- State ---- */
let selectedModel = 'robot';
let markerVisible = false;
let arIsRunning   = false;
const modelPositions = { robot: {x:0,z:0}, mecha: {x:0,z:0} };
const rotations      = { robot: 0, mecha: 0 };
const jumpY          = { robot: 0, mecha: 0 };
const jump           = { robot:{rafId:null,startTs:null}, mecha:{rafId:null,startTs:null} };
const walkPhase      = { robot: 0, mecha: 0 };
const walkBlend      = { robot: 0, mecha: 0 };
let gameLoopId = null, lastTs = 0;

/* ---- Joystick state ---- */
let joyDX=0, joyDY=0, joyActive=false, joyPtr=null;

/* ---- Camera-fix state ---- */
let videoReadyTimer=null, videoPollTimer=null,
    domObserver=null, videoStyleObs=null, wrapperStyleObs=null;

/* ---- Helpers ---- */
function clamp(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }
function lerpAngle(a,b,t){ let d=((b-a)%360+540)%360-180; return a+d*t; }
function getEntity(n){ return document.getElementById(n==='robot'?'model-robot':'model-mecha'); }
function getLimb(m,p){ return document.getElementById(`${m}-${p}`); }

function resetLimbs(name){
  ['arm-l','arm-r','leg-l','leg-r'].forEach(p=>{
    const el=getLimb(name,p);
    if(el) el.setAttribute('rotation',{x:0,y:0,z:0});
  });
  walkPhase[name]=0; walkBlend[name]=0;
}

function applyWalkAnim(name, blend){
  const aL=getLimb(name,'arm-l'), aR=getLimb(name,'arm-r');
  const lL=getLimb(name,'leg-l'), lR=getLimb(name,'leg-r');
  if(!aL||!aR||!lL||!lR) return;
  const swing = WALK_SWING * Math.sin(walkPhase[name]) * blend;
  aL.setAttribute('rotation',{x: swing, y:0, z:0});
  aR.setAttribute('rotation',{x:-swing, y:0, z:0});
  lL.setAttribute('rotation',{x:-swing, y:0, z:0});
  lR.setAttribute('rotation',{x: swing, y:0, z:0});
}

/* ---- Game loop ---- */
function startGameLoop(){ if(gameLoopId!==null)return; lastTs=0; gameLoopId=requestAnimationFrame(gameLoopTick); }
function stopGameLoop(){ if(gameLoopId!==null){cancelAnimationFrame(gameLoopId);gameLoopId=null;} lastTs=0; }

function gameLoopTick(ts){
  if(!arIsRunning){gameLoopId=null;return;}
  const dt = lastTs>0 ? Math.min((ts-lastTs)/1000,0.05) : 0.016;
  lastTs=ts;

  const rawMag = Math.sqrt(joyDX*joyDX+joyDY*joyDY);
  const joyMag = Math.min(rawMag,1);
  const isMoving = markerVisible && joyMag>JOY_DEAD;
  const nx = rawMag>0 ? joyDX/rawMag : 0;
  const nz = rawMag>0 ? joyDY/rawMag : 0;

  if(isMoving){
    const p=modelPositions[selectedModel], speed=MOVE_SPEED*joyMag;
    p.x=clamp(p.x+nx*speed,-MAX_MOVE,MAX_MOVE);
    p.z=clamp(p.z+nz*speed,-MAX_MOVE,MAX_MOVE);

    // ✅ FIXED: atan2(joyDX, joyDY) — no minus sign
    // joystick down (joyDY>0) → model faces toward camera (0°)
    // joystick up   (joyDY<0) → model faces away (180°)
    const targetFacing = Math.atan2(joyDX, joyDY) * (180 / Math.PI);
    rotations[selectedModel]=lerpAngle(rotations[selectedModel],targetFacing,TURN_SPEED);
  }

  if(isMoving){
    walkBlend[selectedModel]=Math.min(1,walkBlend[selectedModel]+WALK_BLEND_RATE*dt);
    walkPhase[selectedModel]+=WALK_PHASE_RATE*joyMag*dt;
  } else {
    walkBlend[selectedModel]=Math.max(0,walkBlend[selectedModel]-WALK_BLEND_RATE*dt);
    if(walkBlend[selectedModel]>0) walkPhase[selectedModel]+=WALK_PHASE_RATE*0.4*dt;
  }

  applyWalkAnim(selectedModel, walkBlend[selectedModel]);

  const bob = BOB_HEIGHT*Math.abs(Math.sin(walkPhase[selectedModel]))*walkBlend[selectedModel];

  if(joyHint) joyHint.textContent = (joyActive&&isMoving) ? 'Release to stop' : 'Move joystick to walk';

  const el=getEntity(selectedModel), p=modelPositions[selectedModel];
  if(el){
    el.setAttribute('position',{x:p.x, y:jumpY[selectedModel]+bob, z:p.z});
    el.setAttribute('rotation',{x:0, y:rotations[selectedModel], z:0});
  }
  gameLoopId=requestAnimationFrame(gameLoopTick);
}

/* ---- Jump ---- */
function cancelJump(name){
  const j=jump[name];
  if(j.rafId!==null){cancelAnimationFrame(j.rafId);j.rafId=null;j.startTs=null;}
  jumpY[name]=0;
  if(name===selectedModel) btnJump.classList.remove('jumping');
}
function cancelAllJumps(){cancelJump('robot');cancelJump('mecha');}
function startJump(){
  const name=selectedModel, j=jump[name];
  if(j.rafId!==null)return;
  j.startTs=performance.now(); btnJump.classList.add('jumping');
  function frame(now){
    const prog=Math.min((now-j.startTs)/JUMP_DURATION,1);
    jumpY[name]=JUMP_HEIGHT*Math.sin(prog*Math.PI);
    if(prog<1){j.rafId=requestAnimationFrame(frame);}
    else{jumpY[name]=0;j.rafId=null;j.startTs=null;btnJump.classList.remove('jumping');}
  }
  j.rafId=requestAnimationFrame(frame);
}

/* ---- Rotation buttons ---- */
function rotateLeft(){  rotations[selectedModel]-=ROTATE_STEP; }
function rotateRight(){ rotations[selectedModel]+=ROTATE_STEP; }

/* ---- Reset ---- */
function snapThumbToCenter(animated){
  const t=document.getElementById('joystick-thumb'); if(!t)return;
  if(animated!==false){t.style.transition='transform 0.14s ease-out';setTimeout(()=>{if(t)t.style.transition='';},160);}
  t.style.transform='translate(-50%,-50%)';
}
function resetModel(){
  cancelJump(selectedModel);
  joyDX=0;joyDY=0;joyActive=false;joyPtr=null;
  snapThumbToCenter(true);
  modelPositions[selectedModel]={x:0,z:0};
  rotations[selectedModel]=0;
  resetLimbs(selectedModel);
}

/* ---- Model selection ---- */
function applyModelVisibility(){
  const r=document.getElementById('model-robot'), m=document.getElementById('model-mecha');
  if(r) r.setAttribute('visible',selectedModel==='robot');
  if(m) m.setAttribute('visible',selectedModel==='mecha');
}
function selectModel(name){
  if(name!==selectedModel){ resetLimbs(selectedModel); cancelJump(selectedModel); joyDX=0;joyDY=0; snapThumbToCenter(true); }
  selectedModel=name;
  modelBtns.forEach(b=>b.classList.toggle('active',b.dataset.model===name));
  applyModelVisibility(); refreshHud();
}

/* ---- HUD ---- */
function setSplashStatus(icon,text){statusIcon.textContent=icon;statusText.textContent=text;}
function refreshHud(){
  if(!arIsRunning)return;
  const label=selectedModel==='robot'?'Robot':'Mecha';
  if(markerVisible){arStatusIcon.textContent='🤖';arStatusText.textContent=`${label} on marker — use joystick to walk!`;}
  else{arStatusIcon.textContent='🔍';arStatusText.textContent=`${label} — point at Hiro marker.`;}
}

/* ---- Joystick ---- */
function initJoystick(){
  const base=document.getElementById('joystick-base'), thumb=document.getElementById('joystick-thumb');
  if(!base||!thumb)return;
  function moveThumb(e){
    const r=base.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
    let dx=e.clientX-cx, dy=e.clientY-cy;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(dist>JOY_MAX_DIST){dx=dx/dist*JOY_MAX_DIST;dy=dy/dist*JOY_MAX_DIST;}
    thumb.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
    joyDX=dx/JOY_MAX_DIST; joyDY=dy/JOY_MAX_DIST;
  }
  function onRelease(e){
    if(e.pointerId!==joyPtr)return;
    joyActive=false;joyPtr=null;joyDX=0;joyDY=0;snapThumbToCenter(true);
  }
  base.addEventListener('pointerdown',e=>{if(joyActive)return;e.preventDefault();joyActive=true;joyPtr=e.pointerId;base.setPointerCapture(e.pointerId);thumb.style.transition='';moveThumb(e);},{passive:false});
  base.addEventListener('pointermove',e=>{if(!joyActive||e.pointerId!==joyPtr)return;e.preventDefault();moveThumb(e);},{passive:false});
  base.addEventListener('pointerup',onRelease);
  base.addEventListener('pointercancel',onRelease);
  base.addEventListener('contextmenu',e=>e.preventDefault());
}

/* ---- Camera fix ---- */
function findArVideo(){return document.getElementById('arjs-video')||document.querySelector('video');}
function clearVideoWatcher(){if(videoReadyTimer){clearTimeout(videoReadyTimer);videoReadyTimer=null;}if(videoPollTimer){clearInterval(videoPollTimer);videoPollTimer=null;}}
function stopStyleObservers(){if(videoStyleObs){videoStyleObs.disconnect();videoStyleObs=null;}if(wrapperStyleObs){wrapperStyleObs.disconnect();wrapperStyleObs=null;}if(domObserver){domObserver.disconnect();domObserver=null;}}
function makeStyleStripper(el){el.removeAttribute('style');const obs=new MutationObserver(()=>{obs.disconnect();if(el.hasAttribute('style'))el.removeAttribute('style');obs.observe(el,{attributes:true,attributeFilter:['style']});});obs.observe(el,{attributes:true,attributeFilter:['style']});return obs;}
function attachVideoStyleFix(video){if(videoStyleObs){videoStyleObs.disconnect();videoStyleObs=null;}if(wrapperStyleObs){wrapperStyleObs.disconnect();wrapperStyleObs=null;}videoStyleObs=makeStyleStripper(video);const w=video.parentElement;if(w&&w!==document.body)wrapperStyleObs=makeStyleStripper(w);}
function watchForArVideo(){if(domObserver){domObserver.disconnect();domObserver=null;}const e=findArVideo();if(e){attachVideoStyleFix(e);return;}domObserver=new MutationObserver(()=>{const v=findArVideo();if(v){domObserver.disconnect();domObserver=null;attachVideoStyleFix(v);}});domObserver.observe(document.body,{childList:true,subtree:true});}
function waitForVideo(){videoReadyTimer=setTimeout(()=>{clearVideoWatcher();showSplashError('Camera startup timed out.');},VIDEO_READY_TIMEOUT_MS);videoPollTimer=setInterval(()=>{const v=findArVideo();if(!v)return;if(v.readyState>=2){clearVideoWatcher();refreshHud();}},VIDEO_POLL_INTERVAL_MS);}

/* ---- UI ---- */
function showArUI(){arScene.classList.remove('hidden');arHud.classList.remove('hidden');arControls.classList.remove('hidden');joyZone.classList.remove('hidden');}
function hideArUI(){arScene.classList.add('hidden');arHud.classList.add('hidden');arControls.classList.add('hidden');joyZone.classList.add('hidden');}

function showSplashError(msg){
  clearVideoWatcher();stopStyleObservers();stopGameLoop();cancelAllJumps();
  joyDX=0;joyDY=0;joyActive=false;joyPtr=null;
  hideArUI();splash.classList.remove('hidden');
  setSplashStatus('❌',msg);startBtn.disabled=false;startBtn.textContent='Retry Camera';
  arIsRunning=false;markerVisible=false;
}
function startAR(){
  if(!window.isSecureContext){setSplashStatus('🔒','Camera requires HTTPS.');return;}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){setSplashStatus('⚠️','Browser does not support camera.');return;}
  startBtn.disabled=true;startBtn.textContent='Starting…';
  setSplashStatus('🔄','Requesting camera permission…');
  splash.classList.add('hidden');showArUI();
  arStatusIcon.textContent='🔄';arStatusText.textContent='Starting AR…';
  arIsRunning=true;markerVisible=false;
  resetLimbs('robot');resetLimbs('mecha');
  applyModelVisibility();snapThumbToCenter(false);
  startGameLoop();watchForArVideo();waitForVideo();
}
function stopAR(){
  clearVideoWatcher();stopStyleObservers();stopGameLoop();cancelAllJumps();
  joyDX=0;joyDY=0;joyActive=false;joyPtr=null;
  resetLimbs('robot');resetLimbs('mecha');
  arIsRunning=false;markerVisible=false;
  hideArUI();snapThumbToCenter(false);
  splash.classList.remove('hidden');
  setSplashStatus('📷','Ready to start.');startBtn.disabled=false;startBtn.textContent='Start Camera';
}

/* ---- Marker ---- */
function attachMarkerEvents(){
  const m=document.getElementById('hiro-marker');if(!m)return;
  m.addEventListener('markerFound',()=>{markerVisible=true;refreshHud();});
  m.addEventListener('markerLost', ()=>{markerVisible=false;refreshHud();});
}
function attachSceneEvents(){
  if(!arScene)return;
  arScene.addEventListener('loaded',()=>{attachMarkerEvents();applyModelVisibility();});
  arScene.addEventListener('camera-error',e=>{showSplashError('Camera error: '+(e.detail&&e.detail.message?e.detail.message:'Check permissions.'));});
}

window.addEventListener('resize',()=>{if(!arIsRunning)return;const v=findArVideo();if(v)attachVideoStyleFix(v);});
window.addEventListener('orientationchange',()=>{if(!arIsRunning)return;setTimeout(()=>{const v=findArVideo();if(v)attachVideoStyleFix(v);},350);});
window.addEventListener('error',e=>{if(!e.filename)return;if(e.filename.includes('aframe'))setSplashStatus('❌','A-Frame failed to load.');else if(e.filename.includes('ar.js')||e.filename.includes('aframe-ar'))setSplashStatus('❌','AR.js failed to load.');});

/* ---- Boot ---- */
document.addEventListener('DOMContentLoaded',()=>{
  startBtn.addEventListener('click',startAR);
  stopBtn.addEventListener('click',stopAR);
  modelBtns.forEach(b=>b.addEventListener('click',()=>selectModel(b.dataset.model)));
  btnRotateLeft.addEventListener('click',rotateLeft);
  btnRotateRight.addEventListener('click',rotateRight);
  btnReset.addEventListener('click',resetModel);
  btnJump.addEventListener('click',startJump);
  initJoystick();
  attachSceneEvents();
  console.log('[AR] v10 — facing fix applied');
});