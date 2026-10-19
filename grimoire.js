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
  ctx.fillStyle = dark ? '#202730' : '#64707d'; ctx.strokeStyle = '#9ca8b5'; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.save(); ctx.rotate(i * Math.PI * 2 / 5);
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.bezierCurveTo(-14, -36, -57, -66, -49, -103);
    ctx.bezierCurveTo(-42, -134, -12, -134, 0, -112);
    ctx.bezierCurveTo(12, -134, 42, -134, 49, -103);
    ctx.bezierCurveTo(57, -66, 14, -36, 0, -8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.beginPath(); ctx.moveTo(0, 5); ctx.quadraticCurveTo(45, 118, 25, 180); ctx.lineWidth = 7; ctx.stroke(); ctx.restore();
}
function coverTexture(back = false) {
  return texture(768, 1024, (ctx,w,h) => {
    const gradient = ctx.createRadialGradient(w*.5,h*.4,15,w*.5,h*.5,h*.7);
    gradient.addColorStop(0,'#292e36'); gradient.addColorStop(.55,'#191c22'); gradient.addColorStop(1,'#0b0d11');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
    // Fine leather grain, with no coarse blocks or painted-on cracks.
    for(let i=0;i<48000;i++){const a=.015+random()*.045;ctx.fillStyle=random()>.5?`rgba(175,184,199,${a})`:`rgba(0,0,0,${a})`;ctx.fillRect(random()*w,random()*h,.6+random()*1.3,.6+random()*1.3);}
    ctx.strokeStyle='#56606d';ctx.lineWidth=2;ctx.strokeRect(36,34,w-72,h-68);
    ctx.strokeStyle='#343b46';ctx.lineWidth=1;ctx.strokeRect(47,45,w-94,h-90);
    ctx.save();ctx.translate(w/2,h*.47);
    ctx.strokeStyle='#4f5967';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(0,0,224,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<40;i++){ctx.save();ctx.rotate(i*Math.PI*2/40);ctx.beginPath();ctx.moveTo(0,-230);ctx.lineTo(0,i%5===0?-241:-234);ctx.stroke();ctx.restore();}
    ctx.restore();
    // The front already has a modeled seal; avoid a second, misaligned clover beneath it.
    if(back)clover(ctx,w/2,h*.47,155);
    ctx.textAlign='center';ctx.fillStyle='#8895a5';ctx.font='24px Georgia';ctx.fillText('V',w/2,146);
    ctx.font='20px Georgia';ctx.fillText(back?'WHIS':'GRIMOIRE',w/2,820);
    ctx.font='10px monospace';ctx.fillStyle='#627080';ctx.fillText('B E Y O N D   T H E   L I M I T',w/2,852);
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
  const leather=new THREE.MeshStandardMaterial({color:0x141820,roughness:.88,metalness:.04});
  const face=new THREE.MeshStandardMaterial({map:cover,bumpMap:cover,bumpScale:.006,roughness:.84,metalness:.06});
  const backFace=new THREE.MeshStandardMaterial({map:back,bumpMap:back,bumpScale:.006,roughness:.84,metalness:.06});
  // Rounded, beveled covers catch the light along the book's silhouette.
  const outline=new THREE.Shape(),x=1.28,y=1.78,r=.085;
  outline.moveTo(-x+r,-y);outline.lineTo(x-r,-y);outline.quadraticCurveTo(x,-y,x,-y+r);
  outline.lineTo(x,y-r);outline.quadraticCurveTo(x,y,x-r,y);outline.lineTo(-x+r,y);
  outline.quadraticCurveTo(-x,y,-x,y-r);outline.lineTo(-x,-y+r);outline.quadraticCurveTo(-x,-y,-x+r,-y);
  const coverGeometry=new THREE.ExtrudeGeometry(outline,{depth:.07,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.035,bevelThickness:.025,curveSegments:10});
  coverGeometry.translate(0,0,-.035);
  const positions=coverGeometry.attributes.position,uvs=coverGeometry.attributes.uv;
  for(let i=0;i<uvs.count;i++)uvs.setXY(i,(positions.getX(i)+1.325)/2.65,(positions.getY(i)+1.825)/3.65);
  const frontCover=new THREE.Mesh(coverGeometry,[face,leather]);frontCover.position.z=.36;book.add(frontCover);
  const rearCover=new THREE.Mesh(coverGeometry,[backFace,leather]);rearCover.position.z=-.36;book.add(rearCover);
  const pages=texture(512,1024,(ctx,w,h)=>{ctx.fillStyle='#b0a184';ctx.fillRect(0,0,w,h);for(let i=0;i<210;i++){const y=i*h/210;ctx.strokeStyle=i%5===0?'#574f40':'#85765c';ctx.lineWidth=.7+random();ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y+random()*3);ctx.stroke();}for(let i=0;i<1300;i++){ctx.fillStyle='#493f2622';ctx.fillRect(random()*w,random()*h,random()*18,random()*3);}});
  const pageMaterial=new THREE.MeshStandardMaterial({map:pages,roughness:1,color:0xc8bba0});
  const pageBlock=new THREE.Mesh(new THREE.BoxGeometry(2.46,3.43,.61),pageMaterial);pageBlock.position.x=.035;book.add(pageBlock);
  const spine=new THREE.Mesh(new THREE.BoxGeometry(.17,3.63,.73),leather);spine.position.x=-1.25;book.add(spine);
  const metal=new THREE.MeshStandardMaterial({color:0x8794a5,metalness:.72,roughness:.4});
  const leafShape=new THREE.Shape();leafShape.moveTo(0,-.045);
  leafShape.bezierCurveTo(-.06,-.15,-.24,-.28,-.20,-.44);leafShape.bezierCurveTo(-.17,-.56,-.05,-.56,0,-.47);
  leafShape.bezierCurveTo(.05,-.56,.17,-.56,.20,-.44);leafShape.bezierCurveTo(.24,-.28,.06,-.15,0,-.045);
  const leafGeometry=new THREE.ExtrudeGeometry(leafShape,{depth:.012,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2,steps:1,curveSegments:16});
  const sealInk=new THREE.MeshStandardMaterial({color:0x3b485b,roughness:.46,metalness:.55});
  for(let i=0;i<5;i++){const leaf=new THREE.Mesh(leafGeometry,[sealInk,metal]);leaf.rotation.z=i*Math.PI*2/5;leaf.position.set(0,.1,.433);book.add(leaf);}
  // A fine metal ring surrounds the seal; corners remain unadorned.
  for(const z of [-.426,.426]){
    const seal=new THREE.Mesh(new THREE.TorusGeometry(.84,.009,6,96),metal);seal.position.set(0,.1,z);book.add(seal);
  }
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
  const anchorCells=[new THREE.Vector2(-999,-999),new THREE.Vector2(-999,-999),new THREE.Vector2(-999,-999)];
  const material=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{sceneMap:{value:target.texture},atlas:{value:atlas},resolution:{value:new THREE.Vector2(800,800)},time:{value:0},letterCount:{value:letters.length},ascii:{value:1},power:{value:0},glitch:{value:0},anchorCells:{value:anchorCells}},vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',fragmentShader:`
    uniform sampler2D sceneMap; uniform sampler2D atlas;
    uniform vec2 resolution; uniform float time; uniform float letterCount; uniform float ascii; uniform float power; uniform float glitch;
    uniform vec2 anchorCells[3];
    varying vec2 vUv;
    void main(){
      vec2 sampleUv=vUv; sampleUv.x+=glitch*.009*sin(floor(vUv.y*28.0)+time*19.0); vec4 original=texture2D(sceneMap,sampleUv);
      vec2 cells=resolution/vec2(10.0,13.0);
      // Original animation: fixed letter cells cycle as the dissolve wave passes.
      vec2 grid=floor(vUv*cells);vec2 cellUv=(grid+.5)/cells;
      vec4 shade=texture2D(sceneMap,cellUv);
      float id=mod(grid.x+grid.y*13.0+floor(time*2.0),letterCount);
      vec2 local=fract(vUv*cells);
      vec2 glyphUv=vec2((mod(id,16.0)+local.x)/16.0,1.0-(floor(id/16.0)+1.0-local.y)/4.0);
      float glyph=texture2D(atlas,glyphUv).r;
      float sweep=.5+.5*sin(vUv.x*7.0-vUv.y*3.0+time*.35);
      float blend=ascii*(.16+.80*smoothstep(.25,.80,sweep));
      float selected=0.0;
      for(int i=0;i<3;i++)selected=max(selected,1.0-step(.1,distance(grid,anchorCells[i])));
      blend=max(blend,selected*ascii*.98);
      float lum=dot(shade.rgb,vec3(.299,.587,.114));
      float solidLum=dot(original.rgb,vec3(.299,.587,.114));
      vec3 normalInk=vec3(.025,.055,.43)*(.65+lum*.4);
      vec3 errorInk=vec3(1.0,.04,.018)*(.30+lum*1.25);
      vec3 ink=mix(normalInk,errorInk,power);
      vec3 normalSolid=mix(vec3(.07,.073,.08),vec3(.54,.56,.60),clamp(solidLum*2.2,0.0,1.0));
      vec3 errorSolid=vec3(.80,.025,.012)*solidLum*1.35;
      original.rgb=mix(normalSolid,errorSolid,power);
      vec3 color=mix(original.rgb,ink*glyph,blend);
      float a=original.a*mix(1.0,.25+.75*glyph,blend);
      gl_FragColor=vec4(color,a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  screen.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
  let w=1,h=1;
  const raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2(),projected=new THREE.Vector3();
  const search=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[2,0],[-2,0],[0,2],[0,-2]];
  const surfacePoints=[[.45,1.12],[-.45,.05],[.2,-1.12]];
  function updateLetterAnchors(){
    const localCamera=book.worldToLocal(camera.position.clone());
    const faceZ=localCamera.z>=0?.45:-.45;
    const used=new Set();
    const anchors=surfacePoints.map(([x,y],i)=>{
      anchorCells[i].set(-999,-999);
      if(!ascii||!w||!h)return null;
      projected.set(x,y,faceZ).applyMatrix4(book.matrixWorld).project(camera);
      const gx=Math.floor((projected.x*.5+.5)*w/10),gy=Math.floor((projected.y*.5+.5)*h/13);
      for(const [dx,dy]of search){
        const cx=gx+dx,cy=gy+dy,px=(cx+.5)*10,py=h-(cy+.5)*13;
        if(px<6||px>w-6||py<8||py>h-8||used.has(`${cx},${cy}`))continue;
        const letter=letters[((cx+cy*13+Math.floor(elapsed*2))%letters.length+letters.length)%letters.length];
        if(!/[A-Z]/.test(letter))continue;
        ndc.set(px/w*2-1,1-py/h*2);raycaster.setFromCamera(ndc,camera);
        if(!raycaster.intersectObject(book,true).length)continue;
        used.add(`${cx},${cy}`);anchorCells[i].set(cx,cy);
        return {x:px,y:py,letter,cell:[cx,cy]};
      }
      return null;
    });
    host.dispatchEvent(new CustomEvent('grimoire:anchors',{detail:anchors}));
  }
  function resize(){w=host.clientWidth;h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);target.setSize(Math.round(w*renderer.getPixelRatio()),Math.round(h*renderer.getPixelRatio()));material.uniforms.resolution.value.set(w,h);camera.aspect=w/h;camera.position.z=w<450?7.2:8.2;camera.updateProjectionMatrix();if(host.dataset.ready === 'true')requestFrame();}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  let angle=-.42,targetAngle=angle,tilt=.12,targetTilt=tilt,paused=reducedMotion.matches,dragging=false,lastX=0,lastY=0,elapsed=0,lastFrame=0,raf=0,ascii=true,settleUntil=0;
  function updatePause(){pauseButton.textContent=paused?'↻ ROTATE':'Ⅱ PAUSE';pauseButton.setAttribute('aria-pressed',String(paused));host.dataset.paused=String(paused);}
  updatePause();
  pauseButton.addEventListener('click',()=>{paused=!paused;updatePause();lastFrame=0;requestFrame();});
  effectButton.addEventListener('click',()=>{ascii=!ascii;effectButton.textContent=ascii?'[ LETTERS ]':'[ SOLID ]';effectButton.setAttribute('aria-pressed',String(ascii));settleUntil=performance.now()+1400;requestFrame();});
  host.addEventListener('pointerdown',event=>{dragging=true;lastX=event.clientX;lastY=event.clientY;host.setPointerCapture(event.pointerId);host.classList.add('dragging');});
  host.addEventListener('pointermove',event=>{if(!dragging)return;targetAngle+=(event.clientX-lastX)*.007;targetTilt=THREE.MathUtils.clamp(targetTilt+(event.clientY-lastY)*.003,-.55,.55);lastX=event.clientX;lastY=event.clientY;settleUntil=performance.now()+1400;requestFrame();});
  function endDrag(){dragging=false;host.classList.remove('dragging');}
  host.addEventListener('pointerup',endDrag);host.addEventListener('pointercancel',endDrag);
  host.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();targetAngle+=event.key==='ArrowLeft'?-.18:.18;settleUntil=performance.now()+1400;requestFrame();}if(event.code==='Space'){event.preventDefault();paused=!paused;updatePause();requestFrame();}});
  reducedMotion.addEventListener('change',event=>{paused=event.matches;updatePause();requestFrame();});
  document.addEventListener('visibilitychange',()=>{lastFrame=0;if(!document.hidden)requestFrame();});
  const modeObserver=new MutationObserver(()=>{settleUntil=performance.now()+1400;requestFrame();});modeObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  function requestFrame(){if(!raf&&!document.hidden)raf=requestAnimationFrame(render);}
  function render(now){raf=0;const delta=lastFrame?Math.min((now-lastFrame)/1000,.05):0;lastFrame=now;
    if(!paused){elapsed+=delta;if(!dragging)targetAngle+=delta*.16;}
    const ease=reducedMotion.matches?1:1-Math.exp(-delta*9);
    angle=THREE.MathUtils.lerp(angle,targetAngle,ease);tilt=THREE.MathUtils.lerp(tilt,targetTilt,ease);
    const power=document.body.classList.contains('unleashed');
    book.rotation.set(tilt+(!paused?Math.sin(elapsed*.55)*.055:0),angle,-.12);
    book.position.y=!paused?Math.sin(elapsed*.8)*.07:0;
    material.uniforms.time.value=elapsed;material.uniforms.power.value=THREE.MathUtils.lerp(material.uniforms.power.value,power?1:0,ease);material.uniforms.ascii.value=THREE.MathUtils.lerp(material.uniforms.ascii.value,ascii?1:0,ease);material.uniforms.glitch.value=document.body.classList.contains('switching')&&!reducedMotion.matches?1:0;rim.intensity=power?4:2.7;
    renderer.setRenderTarget(target);renderer.render(scene,camera);updateLetterAnchors();renderer.setRenderTarget(null);renderer.render(screen,screenCamera);
    host.dataset.ready='true';host.dataset.angle=angle.toFixed(3);host.dataset.time=elapsed.toFixed(3);
    if((!paused||now<settleUntil)&&!document.hidden)requestFrame();
  }
  host.classList.add('loaded');requestFrame();
  window.addEventListener('pageshow',()=>{lastFrame=0;requestFrame();});
  window.addEventListener('pagehide',event=>{if(event.persisted)return;cancelAnimationFrame(raf);observer.disconnect();modeObserver.disconnect();renderer.dispose();target.dispose();});
}
try { init(); } catch(error) {
  host.classList.add('book-unavailable');host.dataset.ready='fallback';
  host.querySelector('.book-fallback').setAttribute('aria-hidden','false');
  pauseButton.hidden=true;effectButton.hidden=true;
  document.querySelector('#book-help').textContent='FIVE-LEAF GRIMOIRE / STILL EDITION';
  console.warn('The 3D grimoire is unavailable; displaying the illustrated cover.',error.message);
}



