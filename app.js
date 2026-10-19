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

// Endpoints are supplied by the book renderer from visible ASCII glyph cells.
const hero = document.querySelector('.hero');
const bookView = document.querySelector('#grimoire-view');
const lineSvg = document.querySelector('#annotation-lines');
const labels = [...document.querySelectorAll('[data-line]')];
let letterAnchors=[];
function drawLines() {
  const root = hero.getBoundingClientRect(), book = bookView.getBoundingClientRect();
  lineSvg.setAttribute('viewBox',`0 0 ${root.width} ${root.height}`);
  labels.forEach((label,i)=>{
    const anchor=letterAnchors[i],path=document.querySelector(`#line-${i}`),marker=document.querySelector(`#marker-${i}`);
    path.parentElement.style.display=anchor?'':'none';
    if(!anchor)return;
    const rect=label.getBoundingClientRect();
    const targetX=book.left-root.left+anchor.x;
    const targetY=book.top-root.top+anchor.y;
    const left=rect.left-root.left,right=rect.right-root.left,y=rect.bottom-root.top;
    const from=i===1?left:right,bend=i===1?right:left;
    const edgeX=targetX+(bend>targetX?6:-6);
    path.setAttribute('d',`M ${from.toFixed(1)} ${y.toFixed(1)} H ${bend.toFixed(1)} L ${edgeX.toFixed(1)} ${targetY.toFixed(1)}`);
    marker.setAttribute('x',(targetX-6).toFixed(1));marker.setAttribute('y',(targetY-7.5).toFixed(1));
    marker.setAttribute('width','12');marker.setAttribute('height','15');marker.classList.remove('filled');
    marker.dataset.letter=anchor.letter;marker.dataset.cell=anchor.cell.join(',');
  });
}
bookView.addEventListener('grimoire:anchors',event=>{letterAnchors=event.detail;drawLines();});
new ResizeObserver(drawLines).observe(hero);
document.fonts.ready.then(drawLines);
motion.addEventListener('change',()=>{drawLines();updateParticles();});
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

// Keep the real text accessible and its space reserved while a visual layer decodes.
(() => {
  const targets=[...document.querySelectorAll('.section-label,.section-shell h2,.about-copy p,.work-heading p,.project > span:nth-child(2),.contact-email')];
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_#';
  const states=new Map();
  let frame=0,lastScrollY=window.scrollY,scrollDirection=0;
  for(const element of targets){
    const words=[];
    const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      const fragment=document.createDocumentFragment();
      for(const part of node.textContent.split(/(\s+)/)){
        if(!part.trim()){fragment.append(document.createTextNode(part));continue;}
        const word=document.createElement('span');word.className='decode-word';
        const original=document.createElement('span');original.className='decode-original';original.textContent=part;
        const visual=document.createElement('span');visual.className='decode-visual';visual.setAttribute('aria-hidden','true');visual.textContent=part;
        word.append(original,visual);fragment.append(word);words.push({word,visual,text:part});
      }
      node.replaceWith(fragment);
    }
    states.set(element,{words,start:0,lastTick:-1,active:false,inside:false});
    element.classList.add('decode-target');
  }
  function finish(element,state){
    state.active=false;element.classList.remove('decoding');element.dataset.decode='complete';
    for(const word of state.words){word.visual.textContent=word.text;word.word.classList.remove('unresolved');}
  }
  window.addEventListener('scroll',()=>{
    const y=window.scrollY,delta=y-lastScrollY;
    if(Math.abs(delta)<.5)return;
    scrollDirection=delta>0?1:-1;lastScrollY=y;
    // Reversing direction immediately restores clean text, including active reveals.
    if(scrollDirection<0){cancelAnimationFrame(frame);frame=0;for(const [el,state]of states)if(state.active)finish(el,state);}
  },{passive:true});
  function animate(now){
    frame=0;let active=false;
    for(const [element,state] of states){
      if(!state.active)continue;
      const elapsed=now-state.start;
      if(motion.matches||elapsed>=1100){finish(element,state);continue;}
      active=true;
      const tick=Math.floor(elapsed/48);if(tick===state.lastTick)continue;state.lastTick=tick;
      state.words.forEach((word,i)=>{
        const delay=(i/Math.max(1,state.words.length-1))*260;
        const progress=Math.max(0,Math.min(1,(elapsed-delay)/730));
        const resolved=Math.floor(progress*word.text.length);
        word.word.classList.toggle('unresolved',progress<1);
        word.visual.textContent=Array.from(word.text,(char,j)=>j<resolved||!/[\p{L}\p{N}]/u.test(char)?char:alphabet[(i*17+j*11+tick*7)%alphabet.length]).join('');
      });
    }
    if(active&&!document.hidden)frame=requestAnimationFrame(animate);
  }
  const reveals=new IntersectionObserver(entries=>{
    for(const entry of entries){
      const element=entry.target,state=states.get(element);
      if(entry.isIntersecting&&!state.inside){
        state.inside=true;
        if(motion.matches||scrollDirection!==1){finish(element,state);continue;}
        state.active=true;state.start=performance.now();state.lastTick=-1;
        element.classList.add('decoding');element.dataset.decode='running';
        if(!frame)frame=requestAnimationFrame(animate);
      }else if(!entry.isIntersecting){state.inside=false;finish(element,state);}
    }
  },{threshold:.18,rootMargin:'0px 0px -4% 0px'});
  targets.forEach(element=>reveals.observe(element));
  motion.addEventListener('change',()=>{if(motion.matches){cancelAnimationFrame(frame);frame=0;for(const [el,s]of states)finish(el,s);}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!frame)frame=requestAnimationFrame(animate);});
})();

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



