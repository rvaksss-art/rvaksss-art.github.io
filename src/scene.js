import { engravedFace, polishedGlass } from './finishes.js';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const openingDuration = 4;
const poses = [
  new THREE.Vector3(.58, 1.32, -.12),
  new THREE.Vector3(-.82, .04, .25),
  new THREE.Vector3(.54, -1.28, .04),
];

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
    const inscription = engravedFace(group,'dial',.56);
    inscription.position.z = .052;
    const reverse = engravedFace(group,'dial',.71);
    reverse.rotation.y = Math.PI;
    reverse.position.z = -.052;
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
    const seal = engravedFace(layers[4],'seal',.415);
    seal.rotation.x = -Math.PI/2;
    seal.position.y = .042;
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
  for(let side=0;side<4;side++){
    const angle=side*Math.PI/2;
    const band=engravedFace(frames[0],'border',.56,.039);
    band.position.set(-Math.sin(angle)*.357,Math.cos(angle)*.357,.057);
    band.rotation.z=angle;
  }
  mesh(group,new THREE.OctahedronGeometry(.14),alloy);
  return (t,spread)=>{frames.forEach((f,i)=>{f.position.z=(i-1)*(.067+.11*spread);});group.rotation.y=-.38+Math.sin(t*.32)*.20;group.rotation.z=-.12;};
}

export function createScene(host, reduce) {
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(max-width:760px)').matches?1.4:1.7));
  renderer.setClearColor(0,0);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  host.append(renderer.domElement);
  const scene=new THREE.Scene();
  scene.environment=studioTexture();
  const camera=new THREE.PerspectiveCamera(33,1,.1,40);
  camera.position.z=9.85;
  const system=new THREE.Group();scene.add(system);
  scene.add(new THREE.HemisphereLight(0xf4ffee,0x456454,1.6));
  const key=new THREE.DirectionalLight(0xffefcf,2.6);key.position.set(-2,4,3);scene.add(key);

  const shell=new RoundedBoxGeometry(1.34,1.34,1.34,3,.065);
  const edges=new THREE.EdgesGeometry(new THREE.BoxGeometry(1.30,1.30,1.30));
  const modules=poses.map((pose,i)=>{
    const cube=new THREE.Group();system.add(cube);
    const glass=polishedGlass(i===0?0xdfc299:0xa4d7bd);
    mesh(cube,shell,glass).renderOrder=2;
    const outline=new THREE.LineBasicMaterial({transparent:true,opacity:.49});
    cube.add(new THREE.LineSegments(edges,outline));
    const mechanism=new THREE.Group();cube.add(mechanism);
    return {cube,pose,outline,update:buildMechanism(i,mechanism)};
  });

  let elapsed=0, last=0, frame=0, visible=false, paused=reduce.matches, lost=false;
  let targetX=0,targetY=0,dragging=false,lastX=0,lastY=0,yaw=0,pitch=0,displayPitch=0;
  const canvas=renderer.domElement;
  function draw(){if(!lost)renderer.render(scene,camera);}
  function compose(){
    const phase=reduce.matches?1:Math.min(elapsed/openingDuration,1);
    const spread=phase*phase*(3-2*phase);
    modules.forEach(({cube,pose,update},i)=>{
      cube.position.set(pose.x*(.29+.71*spread),pose.y*(.50+.5*spread),pose.z);
      cube.scale.setScalar(.76+.24*spread);
      cube.rotation.set(displayPitch+.29+.12*Math.sin(elapsed*.24+i),.48+i*.12+elapsed*(i===1?-.042:.046),.035*(i-1));
      update(elapsed,spread);
    });
  }
  function tick(now){
    frame=0;
    const delta=(now-last)/1000;last=now;elapsed+=delta;
    const response=1-Math.exp(-5*delta);
    displayPitch+=(pitch-displayPitch)*response;
    const scroll=Math.min(scrollY/Math.max(innerHeight,1),1);
    system.rotation.y+=(yaw+targetX*.15+scroll*.12-system.rotation.y)*response;
    system.rotation.x+=(targetY*.10-system.rotation.x)*response;
    compose();draw();frame=requestAnimationFrame(tick);
  }
  function schedule(){
    cancelAnimationFrame(frame);frame=0;
    if(visible&&!document.hidden&&!paused&&!lost){last=performance.now();frame=requestAnimationFrame(tick);}
  }
  function resize(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;
    renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();draw();}
  function theme(){const light=document.documentElement.dataset.theme==='light';
    modules.forEach(({outline},i)=>outline.color.set(light?(i===0?0x735531:0x315f49):(i===0?0xf5d19e:0xc7f2da)));draw();}
  compose();resize();theme();
  new ResizeObserver(resize).observe(host);
  new MutationObserver(theme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();}).observe(host);
  document.addEventListener('visibilitychange',schedule);
  // Keep one-finger page scrolling native until the stationary hold is recognised.
  let holdTimer;
  let fingerId=null, touchActive=false, originX=0, originY=0;
  function releaseFinger(){
    clearTimeout(holdTimer);
    fingerId=null;
    touchActive=false;
  }
  canvas.addEventListener('touchstart',event=>{
    releaseFinger();
    if(paused || event.touches.length!==1)return;
    const finger=event.touches[0];
    fingerId=finger.identifier;
    originX=lastX=finger.clientX;
    originY=lastY=finger.clientY;
    holdTimer=setTimeout(()=>{touchActive=true;},320);
  },{passive:true});
  canvas.addEventListener('touchmove',event=>{
    const finger=event.touches[0];
    if(paused || event.touches.length!==1 || finger.identifier!==fingerId || !event.cancelable){
      releaseFinger();return;
    }
    if(!touchActive){
      if(Math.hypot(finger.clientX-originX,finger.clientY-originY)>8)releaseFinger();
      return;
    }
    event.preventDefault();
    yaw+=(finger.clientX-lastX)*.008;
    pitch+=(finger.clientY-lastY)*.009;
    lastX=finger.clientX;lastY=finger.clientY;
  },{passive:false});
  canvas.addEventListener('touchend',releaseFinger,{passive:true});
  canvas.addEventListener('touchcancel',releaseFinger,{passive:true});
  canvas.addEventListener('contextmenu',event=>{if(fingerId!==null)event.preventDefault();});
  canvas.addEventListener('pointermove',e=>{
    if(paused||e.pointerType==='touch')return;
    const bounds=canvas.getBoundingClientRect();
    targetX=(e.clientX-bounds.left)/bounds.width*2-1;targetY=(e.clientY-bounds.top)/bounds.height*2-1;
    if(dragging){
      yaw+=(e.clientX-lastX)*.006;
      pitch+=(e.clientY-lastY)*.009;
      lastX=e.clientX;
      lastY=e.clientY;
    }
  });
  canvas.addEventListener('pointerdown',e=>{if(!paused&&e.isPrimary&&e.button===0&&e.pointerType!=='touch'){dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);}});
  canvas.addEventListener('lostpointercapture',()=>{dragging=false;});
  canvas.addEventListener('pointerleave',()=>{targetX=targetY=0;});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;schedule();host.parentElement.classList.remove('webgl-ready');});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;resize();host.parentElement.classList.add('webgl-ready');schedule();});
  host.parentElement.classList.add('webgl-ready');
  return {setPaused(value){paused=value;if(reduce.matches){elapsed=openingDuration;compose();draw();}schedule();}};
}
