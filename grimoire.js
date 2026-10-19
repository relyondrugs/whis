import * as THREE from './three.module.js';

const host = document.querySelector('#grimoire-view');
const pauseButton = document.querySelector('#book-pause');
const effectButton = document.querySelector('#book-effect');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function texture(width, height, paint) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  paint(canvas.getContext('2d'), width, height);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  return map;
}
let seed = 17;
function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
function clover(ctx, x, y, radius, dark = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(radius / 150, radius / 150);
  ctx.fillStyle = dark ? '#100f0c' : '#a19274'; ctx.strokeStyle = '#c3ae85'; ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    ctx.save(); ctx.rotate(i * Math.PI * 2 / 5);
    ctx.beginPath(); ctx.moveTo(0, 10); ctx.bezierCurveTo(-26, -35, -91, -66, -65, -116);
    ctx.bezierCurveTo(-46, -151, -12, -143, 0, -116);
    ctx.bezierCurveTo(12, -143, 46, -151, 65, -116);
    ctx.bezierCurveTo(91, -66, 26, -35, 0, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.beginPath(); ctx.moveTo(0, 5); ctx.quadraticCurveTo(45, 118, 25, 180); ctx.lineWidth = 7; ctx.stroke(); ctx.restore();
}
function coverTexture(back = false) {
  return texture(768, 1024, (ctx,w,h) => {
    const gradient = ctx.createRadialGradient(w*.5,h*.4,15,w*.5,h*.5,h*.7);
    gradient.addColorStop(0,'#716650'); gradient.addColorStop(.5,'#3e3a30'); gradient.addColorStop(1,'#1e211c');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
    for(let i=0;i<32000;i++){const a=random()*.18;ctx.fillStyle=random()>.5?`rgba(215,198,158,${a})`:`rgba(0,0,0,${a})`;ctx.fillRect(random()*w,random()*h,1+random()*4,1+random()*4);}
    ctx.strokeStyle='#a89b7a';ctx.lineWidth=5;ctx.strokeRect(34,32,w-68,h-64);
    ctx.lineWidth=1;ctx.strokeRect(46,44,w-92,h-88);ctx.strokeRect(59,57,w-118,h-114);
    ctx.strokeStyle='#75684c';ctx.lineWidth=2;
    for(const [x,y] of [[64,64],[w-64,64],[64,h-64],[w-64,h-64]]){
      ctx.save();ctx.translate(x,y);ctx.rotate(x>w/2?Math.PI/2:0);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(110,0);ctx.quadraticCurveTo(20,28,0,110);ctx.closePath();ctx.fillStyle='#85714e';ctx.fill();ctx.stroke();ctx.restore();
    }
    ctx.save();ctx.translate(w/2,h*.47);
    ctx.strokeStyle='#9b8b68';ctx.lineWidth=1;
    for(const r of [220,226,245]){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();}
    for(let i=0;i<50;i++){ctx.save();ctx.rotate(i*Math.PI*2/50);ctx.beginPath();ctx.moveTo(0,-227);ctx.lineTo(0,-240);ctx.stroke();ctx.restore();}
    ctx.restore();
    clover(ctx,w/2,h*.46,back?128:172);
    ctx.textAlign='center';ctx.fillStyle='#c7b68d';ctx.font='28px Georgia';ctx.fillText('V',w/2,146);
    ctx.font='23px Georgia';ctx.fillText(back?'WHIS':'GRIMOIRE',w/2,820);
    ctx.font='11px monospace';ctx.fillStyle='#a99c81';ctx.fillText('B E Y O N D   T H E   L I M I T',w/2,857);
    ctx.strokeStyle='#8f4b37';ctx.lineWidth=3;
    for(let i=0;i<17;i++){ctx.beginPath();let x=random()*w,y=random()*h;ctx.moveTo(x,y);for(let j=0;j<4;j++){x+=(random()-.5)*65;y+=random()*26;ctx.lineTo(x,y);}ctx.stroke();}
  });
}
function init() {
  const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.set(0,0,8.2);
  const book=new THREE.Group();scene.add(book);
  const cover=coverTexture(),back=coverTexture(true);
  const leather=new THREE.MeshStandardMaterial({color:0x423e32,roughness:.92,metalness:.12});
  const face=new THREE.MeshStandardMaterial({map:cover,roughness:.86,metalness:.13});
  const backFace=new THREE.MeshStandardMaterial({map:back,roughness:.86,metalness:.13});
  const coverGeometry=new THREE.BoxGeometry(2.65,3.65,.09);
  const frontCover=new THREE.Mesh(coverGeometry,[leather,leather,leather,leather,face,leather]);frontCover.position.z=.36;book.add(frontCover);
  const rearCover=new THREE.Mesh(coverGeometry,[leather,leather,leather,leather,leather,backFace]);rearCover.position.z=-.36;book.add(rearCover);
  const pages=texture(512,1024,(ctx,w,h)=>{ctx.fillStyle='#b0a184';ctx.fillRect(0,0,w,h);for(let i=0;i<210;i++){const y=i*h/210;ctx.strokeStyle=i%5===0?'#574f40':'#85765c';ctx.lineWidth=.7+random();ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y+random()*3);ctx.stroke();}for(let i=0;i<1300;i++){ctx.fillStyle='#493f2622';ctx.fillRect(random()*w,random()*h,random()*18,random()*3);}});
  const pageMaterial=new THREE.MeshStandardMaterial({map:pages,roughness:1,color:0xc8bba0});
  const pageBlock=new THREE.Mesh(new THREE.BoxGeometry(2.46,3.43,.61),pageMaterial);pageBlock.position.x=.035;book.add(pageBlock);
  const spine=new THREE.Mesh(new THREE.BoxGeometry(.17,3.63,.73),leather);spine.position.x=-1.25;book.add(spine);
  const metal=new THREE.MeshStandardMaterial({color:0xb29a69,metalness:.65,roughness:.55});
  for(const y of [-1.48,-.9,.9,1.48]){const band=new THREE.Mesh(new THREE.BoxGeometry(.205,.07,.77),metal);band.position.set(-1.25,y,0);book.add(band);}
  for(const z of [-.414,.414])for(const x of [-1.18,1.18])for(const y of [-1.68,1.68]){const stud=new THREE.Mesh(new THREE.SphereGeometry(.033,8,6),metal);stud.position.set(x,y,z);book.add(stud);}
  const bookmark=new THREE.Mesh(new THREE.BoxGeometry(.16,.55,.025),new THREE.MeshStandardMaterial({color:0x852f25,roughness:1}));bookmark.position.set(.7,-1.89,-.07);bookmark.rotation.z=-.12;book.add(bookmark);
  scene.add(new THREE.AmbientLight(0xd8cbb5,1.25));
  const key=new THREE.DirectionalLight(0xffeed0,3.8);key.position.set(-3,5,5);scene.add(key);
  const rim=new THREE.DirectionalLight(0xe76b51,2.7);rim.position.set(3,.8,-2);scene.add(rim);
  const fill=new THREE.DirectionalLight(0xd6ded4,2);fill.position.set(2,-1,5);scene.add(fill);

  const letters='WHIS/CREATE/PLAY/SURPASS/YOUR/LIMITS/BLACK/CLOVER/05/';
  const atlasCanvas=document.createElement('canvas');atlasCanvas.width=1024;atlasCanvas.height=256;
  const ac=atlasCanvas.getContext('2d');ac.fillStyle='#000';ac.fillRect(0,0,1024,256);ac.font='bold 52px monospace';ac.textAlign='center';ac.textBaseline='middle';ac.fillStyle='#fff';
  for(let i=0;i<letters.length;i++)ac.fillText(letters[i],(i%16)*64+32,Math.floor(i/16)*64+33);
  const atlas=new THREE.CanvasTexture(atlasCanvas);atlas.minFilter=THREE.LinearFilter;atlas.magFilter=THREE.LinearFilter;
  const target=new THREE.WebGLRenderTarget(800,800,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
  const screen=new THREE.Scene();const screenCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const material=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{sceneMap:{value:target.texture},atlas:{value:atlas},resolution:{value:new THREE.Vector2(800,800)},time:{value:0},letterCount:{value:letters.length},ascii:{value:1},power:{value:0},glitch:{value:0}},vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',fragmentShader:`
    uniform sampler2D sceneMap; uniform sampler2D atlas;
    uniform vec2 resolution; uniform float time; uniform float letterCount; uniform float ascii; uniform float power; uniform float glitch;
    varying vec2 vUv;
    void main(){
      vec2 sampleUv=vUv; sampleUv.x+=glitch*.009*sin(floor(vUv.y*28.0)+time*19.0); vec4 original=texture2D(sceneMap,sampleUv);
      vec2 cells=resolution/vec2(10.0,13.0);
      vec2 grid=floor(vUv*cells);vec2 cellUv=(grid+.5)/cells;
      vec4 shade=texture2D(sceneMap,cellUv);
      float id=mod(grid.x+grid.y*13.0+floor(time*2.0),letterCount);
      vec2 local=fract(vUv*cells);
      vec2 glyphUv=vec2((mod(id,16.0)+local.x)/16.0,1.0-(floor(id/16.0)+1.0-local.y)/4.0);
      float glyph=texture2D(atlas,glyphUv).r;
      float sweep=.5+.5*sin(vUv.x*7.0-vUv.y*3.0+time*.35);
      float blend=ascii*(.16+.80*smoothstep(.25,.80,sweep));
      float lum=dot(shade.rgb,vec3(.299,.587,.114)); float solidLum=dot(original.rgb,vec3(.299,.587,.114)); vec3 normalInk=vec3(.025,.055,.43)*(.65+lum*.4); vec3 errorInk=vec3(1.0,.013,.005)*(.25+lum*1.6); vec3 ink=mix(normalInk,errorInk,power); vec3 normalSolid=mix(vec3(.11,.13,.20),vec3(.92,.93,.98),clamp(solidLum*1.6,0.0,1.0)); vec3 errorSolid=vec3(1.0,.008,.003)*solidLum*1.8; original.rgb=mix(normalSolid,errorSolid,power);
      
      vec3 color=mix(original.rgb,ink*glyph,blend);
      float a=mix(original.a,max(original.a*.18,shade.a*glyph),blend);
      gl_FragColor=vec4(color,a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  screen.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
  let w=1,h=1;
  function resize(){w=host.clientWidth;h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);target.setSize(Math.round(w*renderer.getPixelRatio()),Math.round(h*renderer.getPixelRatio()));material.uniforms.resolution.value.set(w,h);camera.aspect=w/h;camera.position.z=w<450?7.2:8.2;camera.updateProjectionMatrix();if(host.dataset.ready === 'true')requestFrame();}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  let angle=-.36,tilt=.1,paused=reducedMotion.matches,visible=true,dragging=false,lastX=0,lastY=0,elapsed=0,lastFrame=0,raf=0,ascii=true;
  function updatePause(){pauseButton.textContent=paused?'↻ ROTATE':'Ⅱ PAUSE';pauseButton.setAttribute('aria-pressed',String(paused));host.dataset.paused=String(paused);}
  updatePause();
  pauseButton.addEventListener('click',()=>{paused=!paused;updatePause();lastFrame=0;requestFrame();});
  effectButton.addEventListener('click',()=>{ascii=!ascii;effectButton.textContent=ascii?'[ LETTERS ]':'[ SOLID ]';effectButton.setAttribute('aria-pressed',String(ascii));material.uniforms.ascii.value=ascii?1:0;requestFrame();});
  host.addEventListener('pointerdown',event=>{dragging=true;lastX=event.clientX;lastY=event.clientY;host.setPointerCapture(event.pointerId);host.classList.add('dragging');});
  host.addEventListener('pointermove',event=>{if(!dragging)return;angle+=(event.clientX-lastX)*.009;tilt=THREE.MathUtils.clamp(tilt+(event.clientY-lastY)*.003,-.55,.55);lastX=event.clientX;lastY=event.clientY;requestFrame();});
  function endDrag(){dragging=false;host.classList.remove('dragging');}
  host.addEventListener('pointerup',endDrag);host.addEventListener('pointercancel',endDrag);
  host.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();angle+=event.key==='ArrowLeft'?-.18:.18;requestFrame();}if(event.code==='Space'){event.preventDefault();paused=!paused;updatePause();requestFrame();}});
  reducedMotion.addEventListener('change',event=>{paused=event.matches;updatePause();requestFrame();});
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;lastFrame=0;if(visible)requestFrame();},{threshold:.01});intersection.observe(host);
  document.addEventListener('visibilitychange',()=>{lastFrame=0;if(!document.hidden)requestFrame();});
  const modeObserver=new MutationObserver(()=>{requestFrame();});modeObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  function requestFrame(){if(!raf&&!document.hidden&&visible)raf=requestAnimationFrame(render);}
  function render(now){raf=0;const delta=lastFrame?Math.min((now-lastFrame)/1000,.05):0;lastFrame=now;
    if(!paused&&!dragging){angle+=delta*.24;elapsed+=delta;}
    const power=document.body.classList.contains('unleashed');
    book.rotation.set(tilt+(!paused?Math.sin(elapsed*.55)*.055:0),angle,-.12);
    book.position.y=!paused?Math.sin(elapsed*.8)*.07:0;
    material.uniforms.time.value=elapsed;material.uniforms.power.value=power?1:0;material.uniforms.glitch.value=document.body.classList.contains('switching')&&!reducedMotion.matches?1:0;rim.intensity=power?5:2.7;
    renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(screen,screenCamera);
    host.dataset.ready='true';host.dataset.angle=angle.toFixed(3);
    if(!paused&&visible&&!document.hidden)requestFrame();
  }
  host.classList.add('loaded');requestFrame();
  window.addEventListener('pagehide',event=>{if(event.persisted)return;cancelAnimationFrame(raf);observer.disconnect();intersection.disconnect();modeObserver.disconnect();renderer.dispose();target.dispose();},{once:true});
}
try { init(); } catch(error) {
  host.classList.add('book-unavailable');host.dataset.ready='fallback';
  host.querySelector('.book-fallback').setAttribute('aria-hidden','false');
  pauseButton.hidden=true;effectButton.hidden=true;
  document.querySelector('#book-help').textContent='FIVE-LEAF GRIMOIRE / STILL EDITION';
  console.warn('The 3D grimoire is unavailable; displaying the illustrated cover.',error.message);
}



