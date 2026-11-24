import { polishedGlass } from './finishes.js';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

import { advance, repel, collide, clamp } from './physics.js';

function metal(color, roughness = .3) {
  return new THREE.MeshStandardMaterial({color, roughness, metalness: .74});
}

function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const part = new THREE.Mesh(geometry, material);
  part.position.set(x, y, z);
  parent.add(part);
  return part;
}

// Reflections of three studio strip lights, shared by glass and polished metal.
function studioTexture() {
  const width = 128, height = 64;
  const data = new Float32Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width, v = y / height;
      const strip = (a, b, w, h) => Math.exp(-(((u-a)/w)**2 + ((v-b)/h)**2));
      const cool = 7 * strip(.17,.48,.024,.26) + 3 * strip(.73,.76,.16,.07);
      const warm = 6 * strip(.55,.46,.055,.23);
      data.set([.10+cool*.8+warm,.15+cool+warm*.75,.14+cool*.93+warm*.47,1], 4*(y*width+x));
    }
  }
  const map = new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.FloatType);
  map.mapping = THREE.EquirectangularReflectionMapping;
  map.needsUpdate = true;
  return map;
}

function buildMechanism(index, group) {
  const alloy = metal(index === 0 ? 0xcba678 : 0x94c6b1);
  const graphite = metal(0x354f49);
  const accent = new THREE.MeshStandardMaterial({
    color:index === 0 ? 0xfac186 : 0xb2f4d2,
    emissive:index === 0 ? 0xf69a51 : 0x75cba4, emissiveIntensity:.38, metalness:.48,roughness:.22
  });
  const ring = (radius, tube, material, z = 0) =>
    mesh(group,new THREE.TorusGeometry(radius,tube,10,64),material,0,0,z);
  if (index === 0) {
    // A calibrated dial with an eccentric indicator and a recessed centre.
    const dial = mesh(group,new THREE.CylinderGeometry(.44,.42,.10,64),graphite);
    dial.rotation.x = Math.PI/2;
    ring(.424,.026,alloy,.054);
    ring(.27,.015,accent,.067);
    const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(.014,.044,.012),alloy,24);
    const tick = new THREE.Object3D();
    for(let i=0;i<24;i++) {
      const angle = i*Math.PI/12;
      tick.position.set(.347*Math.cos(angle),.347*Math.sin(angle),.058);
      tick.rotation.z=angle-Math.PI/2;
      tick.updateMatrix();
      ticks.setMatrixAt(i,tick.matrix);
    }
    group.add(ticks);
    mesh(group,new THREE.SphereGeometry(.098,24,16),alloy,0,0,.065).scale.z=.55;
    mesh(group,new THREE.SphereGeometry(.037,16,12),accent,.27,0,.077);
    return (t, spread) => {group.rotation.z = .35+t*.13; group.rotation.x=.15+spread*.18;};
  }
  if (index === 1) {
    // The processor opens along a single axis, exposing the luminous substrate.
    const layers=[];
    for(let i=0;i<5;i++) {
      const side=[.73,.61,.69,.58,.5][i];
      layers.push(mesh(group,new RoundedBoxGeometry(side,.082,side,2,.035),[graphite,alloy,graphite,accent,alloy][i]));
    }
    return (t, spread) => {
      layers.forEach((layer,i)=>{layer.position.y=(i-2)*(.09+.07*spread);});
      group.rotation.y=.25+t*.10;
    };
  }
  // Three apertures telescope into a finished lens assembly.
  const frames=[];
  for(let i=0;i<3;i++) {
    const frame=new THREE.Shape();
    const contour=(p,r,b)=>{
      p.moveTo(-r+b,-r);p.lineTo(r-b,-r);p.quadraticCurveTo(r,-r,r,-r+b);
      p.lineTo(r,r-b);p.quadraticCurveTo(r,r,r-b,r);p.lineTo(-r+b,r);
      p.quadraticCurveTo(-r,r,-r,r-b);p.lineTo(-r,-r+b);p.quadraticCurveTo(-r,-r,-r+b,-r);
    };
    const r=.38-i*.054;
    contour(frame,r,.07);
    const hole=new THREE.Path();contour(hole,r-.05,.045);frame.holes.push(hole);
    frames.push(mesh(group,new THREE.ExtrudeGeometry(frame,{depth:.047,bevelSize:.009,bevelThickness:.009,bevelSegments:2}),[alloy,graphite,accent][i]));
  }
  mesh(group,new THREE.OctahedronGeometry(.14),alloy);
  return (t,spread)=>{frames.forEach((f,i)=>{f.position.z=(i-1)*(.067+.11*spread);});group.rotation.y=-.38+Math.sin(t*.32)*.20;group.rotation.z=-.12;};
}

export function createScene(host) {
  const instrument = host.parentElement;
  let renderer, cssOnly=false;
  try { renderer=new THREE.WebGLRenderer({alpha:true, antialias:true, powerPreference:'low-power'}); }
  catch { cssOnly=true; renderer={domElement:document.createElement('canvas'),setPixelRatio(){},setClearColor(){},setSize(){},render(){}}; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 761 ? 1.4 : 1.7));
  renderer.setClearColor(0,0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const canvas = renderer.domElement;
  const layer = document.createElement('div'); layer.className = 'floating-cubes';
  layer.classList.toggle('css-glass',cssOnly);
  layer.append(canvas); document.body.append(layer);
  canvas.setAttribute('aria-hidden','true');
  const scene = new THREE.Scene(); scene.environment = studioTexture();
  const camera = new THREE.OrthographicCamera(0,innerWidth,0,-innerHeight,.1,3000);
  camera.position.z = 1500;
  scene.add(new THREE.HemisphereLight(0xf4ffee,0x456454,1.6));
  const key = new THREE.DirectionalLight(0xffefcf,2.6); key.position.set(-200,400,800); scene.add(key);
  const shell = new RoundedBoxGeometry(1.34,1.34,1.34,3,.065);
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.30,1.30,1.30));
  const names = ['BUSINESS','SYSTEM','PRODUCT'];
  const modules = names.map((name,i)=>{
    const cube=new THREE.Group(); scene.add(cube);
    const glass=polishedGlass(i===0?0xdfc299:0xa4d7bd);
    mesh(cube,shell,glass).renderOrder=2;
    const outline=new THREE.LineBasicMaterial({transparent:true,opacity:.46});
    cube.add(new THREE.LineSegments(edges,outline));
    const mechanism=new THREE.Group(); cube.add(mechanism);
    const button=document.createElement('button'); button.className='cube-handle';
    button.innerHTML=`<i class="glass-solid" aria-hidden="true"><i class="glass-core core-${i}"></i>${Array.from({length:6},()=>'<i class="glass-face"></i>').join('')}</i><span>${name}</span>`; button.type='button';
    button.setAttribute('aria-describedby','cube-help'); layer.append(button);
    return {cube,glass,outline,button,update:buildMechanism(i,mechanism),x:0,y:0,vx:0,vy:0,r:60,spin:0,angle:i*.4,tilt:.3};
  });
  const help=document.createElement('p'); help.id='cube-help'; help.className='cube-help';
  const controls=document.createElement('div'); controls.className='cube-controls';
  const pause=document.createElement('button'); pause.type='button'; pause.setAttribute('aria-pressed','false');
  controls.append(help,pause); instrument.append(controls);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=reduced.matches, lost=false, frame=0, last=0, elapsed=0, active=null, pointer=null;
  let rectangles=[], links=[], dirty=true, width=innerWidth, height=innerHeight, headerBottom=76, home=[], bounds={left:0,right:innerWidth,top:0,bottom:innerHeight}, lastScroll=scrollY, heroOnScreen=true;
  function labels(){
    const en=document.documentElement.lang==='en';
    help.textContent=en?'Drag & throw · touch: hold':'Потяни и отпусти · на телефоне: удерживай';
    pause.textContent=paused?(en?'Resume motion':'Продолжить'):(en?'Pause motion':'Пауза');
    pause.setAttribute('aria-pressed',String(paused));
    modules.forEach((b,i)=>b.button.setAttribute('aria-label',`${names[i]}. ${en?'Drag to throw. Arrow keys to move, Space to spin, Escape to reset.':'Перетащите и бросьте. Стрелки — перемещение, пробел — вращение, Escape — вернуть.'}`));
  }
  function measure(){
    const area=instrument.getBoundingClientRect();
    const hero=document.querySelector('.hero').getBoundingClientRect();
    const header=document.querySelector('.header').getBoundingClientRect();
    headerBottom=Math.max(12,header.bottom+12);
    heroOnScreen=hero.bottom>0&&hero.top<height;
    layer.hidden=!heroOnScreen;
    layer.style.clipPath=`inset(${Math.max(0,hero.top)}px ${Math.max(0,width-hero.right)}px ${Math.max(0,height-hero.bottom)}px ${Math.max(0,hero.left)}px)`;
    bounds={left:hero.left,right:hero.right,top:hero.top,bottom:hero.bottom};
    const small=width<761;
    home=small?[[.22,.28],[.72,.28],[.48,.56]]:[[.68,.23],[.28,.49],[.67,.76]];
    home=home.map(([x,y])=>({x:area.left+area.width*x,y:area.top+area.height*y}));
    rectangles=[...document.querySelectorAll('.hero h1,.eyebrow,.intro,.hero-scroll,.selection-heading,.portal h3,.portal p,.card-top,.card-bottom,.project-options,.footer,.cube-controls')]
      .map(el=>el.getBoundingClientRect()).filter(r=>r.bottom>0&&r.top<height);
    links=[...document.querySelectorAll('.wrap a,.wrap button')].map(el=>el.getBoundingClientRect()).filter(r=>r.bottom>0&&r.top<height);
    dirty=false;
  }
  function reset(){measure();modules.forEach((b,i)=>{b.x=home[i].x;b.y=home[i].y;b.vx=b.vy=b.spin=0;b.angle=.48+i*.24;b.tilt=.3;});}
  function size(){
    width=innerWidth;height=innerHeight;lastScroll=scrollY;
    renderer.setSize(width,height,false);camera.right=width;camera.bottom=-height;camera.updateProjectionMatrix();
    dirty=true;reset();render(0);
  }
  function render(dt){
    if(dirty)measure();
    if(!heroOnScreen)return;
    const mobile=width<761;
    modules.forEach((b,i)=>{
      const side=mobile?72:Math.min(133,width*.106);
      b.r=side*.72;
      const resting=paused;
      if(b!==active&&!resting){
        // Gentle current; no fixed orbit. Return toward the margins after a throw.
        b.vx+=Math.sin(elapsed*.43+i*2.1)*9*dt;
        b.vy+=Math.cos(elapsed*.36+i*1.7)*8*dt;
        const targetX=home[i].x;
        const targetY=home[i].y;
        b.vx+=(targetX-b.x)*.22*dt; b.vy+=(targetY-b.y)*.16*dt;
        for(const rect of rectangles)repel(b,rect,dt);
        advance(b,dt,bounds);
        b.angle+=((i===1?-.07:.065)+b.spin)*dt;
        b.spin*=Math.exp(-1.15*dt);
        b.tilt+=(.32+Math.sin(elapsed*.3+i)*.12-b.tilt)*dt;
      }
      const over=rectangles.some(r=>b.x+b.r>r.left&&b.x-b.r<r.right&&b.y+b.r>r.top&&b.y-b.r<r.bottom);
      const coversLink=links.some(r=>b.x+side/2>r.left&&b.x-side/2<r.right&&b.y+side/2>r.top&&b.y-side/2<r.bottom);
      b.button.style.pointerEvents=(over||coversLink)&&b!==active?'none':'auto';
      b.button.style.setProperty('--cube-side',`${side}px`);
      b.button.querySelector('.glass-solid').style.transform=`rotateX(${b.tilt}rad) rotateY(${b.angle}rad) rotateZ(${Math.sin(b.angle*.4)*.12}rad)`;
      b.button.style.width=b.button.style.height=`${Math.max(44,side)}px`;
      b.button.style.transform=`translate3d(${b.x-side/2}px,${b.y-side/2}px,0)`;
      b.cube.position.set(b.x,-b.y,0); b.cube.scale.setScalar(side/1.34);
      b.cube.rotation.set(b.tilt,b.angle,Math.sin(b.angle*.4)*.12);
      b.update(elapsed,1);
    });
    if(!paused)for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)if(modules[i]!==active&&modules[j]!==active)collide(modules[i],modules[j]);
    if(!lost&&!cssOnly)renderer.render(scene,camera);
  }
  function tick(now){
    frame=0; const dt=Math.min((now-last)/1000,.033);last=now;
    if(!paused)elapsed+=dt;
    render(dt);
    if(!paused&&!document.hidden&&!lost)frame=requestAnimationFrame(tick);
  }
  function schedule(){cancelAnimationFrame(frame);frame=0;if(document.hidden||lost)return;last=performance.now();frame=requestAnimationFrame(tick);}
  function end(event){
    if(!pointer||event.pointerId!==pointer.id)return;
    clearTimeout(pointer.timer);
    if(active&&(event.type!=='pointerup'||performance.now()-pointer.time>110||paused))active.vx=active.vy=active.spin=0;
    if(active)active.button.classList.remove('is-grabbed');
    const button=pointer.b.button,id=pointer.id;active=null;pointer=null;
    if(button.hasPointerCapture(id))button.releasePointerCapture(id);
    schedule();
  }
  modules.forEach(b=>{
    b.button.addEventListener('pointerdown',event=>{
      if(pointer||!event.isPrimary||event.button!==0)return;
      event.preventDefault();
      pointer={id:event.pointerId,b,x:event.clientX,y:event.clientY,time:performance.now(),ox:event.clientX-b.x,oy:event.clientY-b.y,scrolling:false};
      b.button.setPointerCapture(event.pointerId);
      const grab=()=>{if(!pointer||pointer.scrolling)return;active=b;b.vx=b.vy=b.spin=0;b.button.classList.add('is-grabbed');};
      if(event.pointerType==='touch')pointer.timer=setTimeout(grab,190);else grab();
    });
    b.button.addEventListener('pointermove',event=>{
      if(!pointer||pointer.id!==event.pointerId)return;
      const now=performance.now(),dt=Math.max(.008,(now-pointer.time)/1000);
      const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
      if(!active){
        if(Math.hypot(dx,dy)>3){pointer.scrolling=true;clearTimeout(pointer.timer);}
        if(pointer.scrolling)window.scrollBy(0,-dy);
      }else{
        b.x=clamp(event.clientX-pointer.ox,bounds.left+b.r,bounds.right-b.r);
        b.y=clamp(event.clientY-pointer.oy,bounds.top+b.r,bounds.bottom-b.r);
        b.vx=clamp(dx/dt,-1600,1600);b.vy=clamp(dy/dt,-1600,1600);
        b.spin=clamp((pointer.ox*dy-pointer.oy*dx)/Math.max(b.r*b.r,1)/dt,-7,7);
        b.angle+=dx*.009;b.tilt+=dy*.006;
      }
      pointer.x=event.clientX;pointer.y=event.clientY;pointer.time=now;
      if(paused)render(0);
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])b.button.addEventListener(type,end);
    b.button.addEventListener('contextmenu',event=>event.preventDefault());
    b.button.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Escape'].includes(event.key))return;
      event.preventDefault();
      if(event.key==='Escape')reset();
      if(event.key===' '){b.angle+=.6;b.spin=1.5;}
      const step=event.shiftKey?48:18;
      if(event.key==='ArrowLeft')b.x-=step;if(event.key==='ArrowRight')b.x+=step;
      if(event.key==='ArrowUp')b.y-=step;if(event.key==='ArrowDown')b.y+=step;
      advance(b,0,bounds);
      render(0);schedule();
    });
  });
  pause.addEventListener('click',()=>{paused=!paused;labels();schedule();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;labels();schedule();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&pointer)end({pointerId:pointer.id,type:'pointercancel'});schedule();});
  window.addEventListener('blur',()=>{if(pointer)end({pointerId:pointer.id,type:'pointercancel'});});
  window.addEventListener('resize',size);
  window.addEventListener('scroll',()=>{
    const shift=scrollY-lastScroll;lastScroll=scrollY;
    modules.forEach(b=>{b.y-=shift;});
    dirty=true;
    if(paused)render(0);
  }, {passive:true});
  new ResizeObserver(()=>{dirty=true;schedule();}).observe(document.querySelector('.hero'));
  function theme(){
    const light=document.documentElement.dataset.theme==='light';
    modules.forEach(({outline},i)=>outline.color.set(light?(i===0?0x735531:0x315f49):(i===0?0xf5d19e:0xc7f2da)));
    dirty=true;labels();schedule();
  }
  new MutationObserver(theme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','lang']});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();cssOnly=true;layer.classList.add('css-glass');schedule();});
  canvas.addEventListener('webglcontextrestored',()=>{cssOnly=false;layer.classList.remove('css-glass');size();schedule();});
  labels();size();theme();instrument.classList.add('webgl-ready');
}
