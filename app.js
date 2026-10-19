const mode = document.querySelector('#mode');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
let transitionTimer;
mode.addEventListener('click', () => {
  clearTimeout(transitionTimer);
  const active = document.body.classList.toggle('unleashed');
  mode.setAttribute('aria-pressed', String(active));
  mode.setAttribute('aria-label', active ? 'Return to reality mode' : 'Switch to anti-magic mode');
  document.querySelector('#mode-label').textContent = active ? 'REALITY' : 'ANTI-MAGIC';
  document.querySelector('#mode-status').textContent = active ? 'ANTI-MAGIC / SIGNAL UNSTABLE' : 'REALITY / 001';
  document.querySelector('meta[name="theme-color"]').content = active ? '#090909' : '#ffffff';
  if (!motion.matches) document.body.classList.add('switching');
  transitionTimer = setTimeout(() => document.body.classList.remove('switching'), 650);
  updateParticles();
});

// Horizontal label underlines connect diagonally to square markers.
// Their bounded, three-step motion follows the observed reference cadence.
const hero = document.querySelector('.hero');
const stage = document.querySelector('.book-stage');
const lineSvg = document.querySelector('#annotation-lines');
const labels = [...document.querySelectorAll('[data-line]')];
const offsets = [[[-12,-8],[-4,6],[8,-2]],[[8,4],[19,13],[28,7]],[[-12,2],[7,11],[16,-4]]];
let phase = 0;
function drawLines() {
  const root = hero.getBoundingClientRect(), book = stage.getBoundingClientRect();
  lineSvg.setAttribute('viewBox',`0 0 ${root.width} ${root.height}`);
  const anchors = [[.55,.24],[.31,.49],[.53,.74]];
  labels.forEach((label,i)=>{
    const rect=label.getBoundingClientRect(),o=motion.matches?[0,0]:offsets[i][phase];
    const targetX=book.left-root.left+book.width*anchors[i][0]+o[0];
    const targetY=book.top-root.top+book.height*anchors[i][1]+o[1];
    const left=rect.left-root.left,right=rect.right-root.left,y=rect.bottom-root.top;
    const from=i===1?left:right,bend=i===1?right:left;
    document.querySelector(`#line-${i}`).setAttribute('d',`M ${from.toFixed(1)} ${y.toFixed(1)} H ${bend.toFixed(1)} L ${targetX.toFixed(1)} ${targetY.toFixed(1)}`);
    const marker=document.querySelector(`#marker-${i}`);marker.setAttribute('x',(targetX-3.5).toFixed(1));marker.setAttribute('y',(targetY-3.5).toFixed(1));
  });
  lineSvg.dataset.phase=String(phase);
}
const grid = document.querySelector('.hero-grid');
for(const x of [0,25,50,75,100])for(const y of [0,33.333,66.667,100]){const mark=document.createElement('span');mark.className='grid-cross';mark.textContent='+';mark.style.left=x+'%';mark.style.top=y+'%';grid.appendChild(mark);}
new ResizeObserver(drawLines).observe(hero);
document.fonts.ready.then(drawLines);
motion.addEventListener('change',()=>{drawLines();updateParticles();});
setInterval(()=>{if(!motion.matches&&!document.hidden&&hero.getBoundingClientRect().bottom>0){phase=(phase+1)%3;drawLines();}},900);
drawLines();

// Low-density letter embers only run in anti-magic mode.
const embers=document.querySelector('#embers'), ink=embers.getContext('2d');
let particles=[], particleFrame=0,particleLast=0,particleClock=0;
let cursor={x:-1000,y:-1000};
function resizeEmbers(){const d=Math.min(window.devicePixelRatio,1.5);embers.width=innerWidth*d;embers.height=innerHeight*d;ink.setTransform(d,0,0,d,0,0);}
window.addEventListener('resize',resizeEmbers);resizeEmbers();
window.addEventListener('pointermove',event=>{cursor={x:event.clientX,y:event.clientY};},{passive:true});
function updateParticles(){
  const active=document.body.classList.contains('unleashed')&&!motion.matches&&!document.hidden;
  if(active&&!particleFrame){particleLast=0;particleFrame=requestAnimationFrame(paintParticles);}
  if(!active){cancelAnimationFrame(particleFrame);particleFrame=0;particles=[];ink.clearRect(0,0,innerWidth,innerHeight);}
}
function paintParticles(now){
  particleFrame=0;const dt=particleLast?Math.min((now-particleLast)/1000,.05):0;particleLast=now;particleClock+=dt;
  ink.clearRect(0,0,innerWidth,innerHeight);
  if(particleClock>.18&&particles.length<34){particleClock=0;const chars='WHIS/05<>*+_';particles.push({x:Math.random()*innerWidth,y:innerHeight+12,vx:(Math.random()-.5)*15,vy:20+Math.random()*30,life:8,letter:chars[Math.floor(Math.random()*chars.length)]});}
  particles=particles.filter(p=>{p.life-=dt;if(p.life<=0)return false;const dx=p.x-cursor.x,dy=p.y-cursor.y,d=Math.hypot(dx,dy);if(d<85&&d>1){p.vx+=dx/d*dt*25;p.y+=dy/d*dt*25;}p.x+=p.vx*dt;p.y-=p.vy*dt;ink.globalAlpha=Math.min(p.life/3,.7);ink.fillStyle='#ff2d20';ink.font='11px monospace';ink.fillText(p.letter,p.x,p.y);return true;});
  ink.globalAlpha=1;if(document.body.classList.contains('unleashed')&&!motion.matches&&!document.hidden)particleFrame=requestAnimationFrame(paintParticles);
}
document.addEventListener('visibilitychange',updateParticles);

let lastTrigger;
function openDialog(dialog, trigger) { lastTrigger = trigger; dialog.showModal(); document.body.style.overflow = 'hidden'; }
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; lastTrigger?.focus(); });
});
const concepts = {
  portfolio: { title: 'Personal worlds', description: 'A bold, type-first portfolio concept. Switch the palette to give this little world a different personality.', html: '<div class="mini-page mini-portfolio"><div class="mini-nav"><b>YOUR NAME.</b><span>DESIGN / CREATE / REPEAT</span></div><h3>Good things start<br>with a blank page.</h3><p>A space for your work, your ideas, and the way you see the world.</p><div class="mini-swatches"><button aria-label="Use parchment palette" data-color="parchment"></button><button aria-label="Use violet palette" data-color="violet"></button></div></div>' },
  landing: { title: 'A proper entrance', description: 'An editorial landing page concept. One clear idea, room to breathe, and a little curiosity.', html: '<div class="mini-page mini-landing"><div class="mini-nav"><b>STILL STUDIO</b><span>A FICTIONAL DESIGN CONCEPT</span></div><h3>Less noise.<br>More meaning.</h3><p id="mini-detail">Thoughtful digital spaces for ideas that deserve a little room.</p><button id="mini-explore">EXPLORE THE IDEA ↗</button></div>' },
  gaming: { title: 'Beyond the lobby', description: 'A playful community homepage concept. Press ready to join this local demo lobby.', html: '<div class="mini-page mini-gaming"><div class="mini-nav"><b>PLAYER ONE_</b><span>DEMO LOBBY</span></div><h3>Find your party.</h3><p>A place for the people who make every match better.</p><button id="mini-ready" aria-pressed="false">READY UP +</button><p id="lobby-state" class="mini-game-state" aria-live="polite">0 / 4 PLAYERS READY</p></div>' }
};
document.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => {
  const concept = concepts[button.dataset.project];
  document.querySelector('#project-title').textContent = concept.title;
  document.querySelector('#project-description').textContent = concept.description;
  document.querySelector('#concept-stage').innerHTML = concept.html;
  document.querySelectorAll('[data-color]').forEach(swatch => swatch.addEventListener('click', () => document.querySelector('.mini-portfolio').classList.toggle('violet', swatch.dataset.color === 'violet')));
  document.querySelector('#mini-explore')?.addEventListener('click', event => { document.querySelector('#mini-detail').textContent = 'The idea: warm color, strong typography, honest copy, and one simple next step. A small website with a clear point of view.'; event.currentTarget.textContent = 'IDEA UNLOCKED ✓'; });
  document.querySelector('#mini-ready')?.addEventListener('click', event => { const ready = event.currentTarget.getAttribute('aria-pressed') !== 'true'; event.currentTarget.setAttribute('aria-pressed', String(ready)); event.currentTarget.textContent = ready ? 'READY ✓' : 'READY UP +'; document.querySelector('#lobby-state').textContent = ready ? '1 / 4 PLAYERS READY — YOU ARE IN.' : '0 / 4 PLAYERS READY'; });
  openDialog(document.querySelector('#project-dialog'), button);
}));



