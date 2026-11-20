import * as THREE from 'three';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
export function createScene(host,reduce){
 const mobile=matchMedia('(max-width:760px)').matches;
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:!mobile,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.4:1.7));
 renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 host.append(renderer.domElement);
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(33,1,.1,60);camera.position.set(0,0,9.6);
 const system=new THREE.Group();scene.add(system);
 const ambient=new THREE.AmbientLight(0xb4d5c6,2.4);scene.add(ambient);
 const key=new THREE.DirectionalLight(0xdbffe0,4);key.position.set(3,5,4);scene.add(key);
 const warm=new THREE.PointLight(0xffd6a1,35,20);warm.position.set(-3,2,3);scene.add(warm);
 const rim=new THREE.DirectionalLight(0x60adbd,3);rim.position.set(-4,-2,1);scene.add(rim);
 const geometry=new THREE.BoxGeometry(1.38,1.38,1.38);
 const edges=new THREE.EdgesGeometry(geometry);
 const cubes=[];const materials=[];
 const bases=[new THREE.Vector3(.22,1.32,-.12),new THREE.Vector3(-.66,0,.35),new THREE.Vector3(.36,-1.31,0)];
 for(let i=0;i<3;i++){
  const group=new THREE.Group();group.position.copy(bases[i]);group.rotation.set(.28+i*.07,.55+i*.2,.08);system.add(group);
  const shell=new THREE.MeshPhysicalMaterial({color:i===0?0xb2c3a0:0x72b59a,metalness:.4,roughness:.23,transparent:true,opacity:.13,depthWrite:false,side:THREE.DoubleSide});
  group.add(new THREE.Mesh(geometry,shell));materials.push(shell);
  const line=new THREE.LineSegments(edges,new THREE.LineBasicMaterial({color:i===0?0xdacda6:0xa7e4c0,transparent:true,opacity:.72}));group.add(line);materials.push(line.material);
  const core=new THREE.Mesh(new THREE.BoxGeometry(.57,.57,.57),new THREE.MeshStandardMaterial({color:i===0?0x9b996c:0x397e60,metalness:.65,roughness:.25,emissive:0x173c27,emissiveIntensity:.2}));group.add(core);
  const inner=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.68,.68,.68)),new THREE.LineBasicMaterial({color:0xd9edc5,transparent:true,opacity:.55}));group.add(inner);
  // Corner joints and fine structural rails make the cubes legible in depth.
  const jointGeometry=new THREE.SphereGeometry(.022,6,4);const jointMaterial=new THREE.MeshBasicMaterial({color:0xe6f1cd});
  for(const x of [-.69,.69])for(const y of [-.69,.69])for(const z of [-.69,.69]){const joint=new THREE.Mesh(jointGeometry,jointMaterial);joint.position.set(x,y,z);group.add(joint);}
  for(let a=0;a<3;a++){const rail=new THREE.Mesh(new THREE.BoxGeometry(1.35,.014,.014),new THREE.MeshBasicMaterial({color:0xa0d1a5,transparent:true,opacity:.25}));if(a===1)rail.rotation.z=Math.PI/2;if(a===2)rail.rotation.y=Math.PI/2;group.add(rail);}
  cubes.push({group,core,inner});
 }
 const orbitGeometry=new THREE.BufferGeometry().setFromPoints(Array.from({length:161},(_,i)=>{const a=i/160*Math.PI*2;return new THREE.Vector3(Math.cos(a)*2.6,Math.sin(a)*2.6,0);}));
 const orbit=new THREE.LineLoop(orbitGeometry,new THREE.LineBasicMaterial({color:0x86b89a,transparent:true,opacity:.17}));orbit.rotation.set(1.15,.3,-.3);system.add(orbit);
 let light=document.documentElement.dataset.theme==='light';
 function theme(){light=document.documentElement.dataset.theme==='light';cubes.forEach(({group,core},i)=>{group.children[1].material.color.set(light?(i===0?0x806342:0x376d52):(i===0?0xdacda6:0xa7e4c0));core.material.color.set(light?0x80a58b:(i===0?0x9b996c:0x397e60));});draw();}
 const pointer={x:0,y:0};const state={spread:0,scroll:0};let active=true,paused=reduce.matches,id=0,last=0,time=0,drag=false,startX=0,dragAngle=0;
 function draw(){renderer.render(scene,camera);}
 function resize(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();draw();}
 new ResizeObserver(resize).observe(host);resize();
 function render(now){id=0;if(!active||document.hidden||paused)return;const dt=Math.min((now-last)/1000,.05);last=now;time+=dt;
  system.rotation.y+=(pointer.x*.18+dragAngle+state.scroll*.3-system.rotation.y)*.035;system.rotation.x+=(pointer.y*.12-system.rotation.x)*.035;
  cubes.forEach(({group,core,inner},i)=>{group.rotation.y=.55+i*.2+time*(i%2?-.09:.075);group.rotation.z=.08+Math.sin(time*.3+i)*.055;group.position.copy(bases[i]).multiplyScalar(1+state.spread*.28+state.scroll*.10);group.position.y+=Math.sin(time*.7+i*1.7)*.08;core.rotation.y=time*.18;inner.rotation.y=-time*.12;});orbit.rotation.z=time*.025;draw();id=requestAnimationFrame(render);
 }
 function start(){if(!id&&!paused&&active&&!document.hidden){last=performance.now();id=requestAnimationFrame(render);}}
 function stop(){cancelAnimationFrame(id);id=0;}
 new IntersectionObserver(entries=>{active=entries[0].isIntersecting;if(active)start();else stop();},{threshold:0}).observe(host);
 document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
 const canvas=renderer.domElement;
 canvas.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||reduce.matches||paused)return;const r=host.getBoundingClientRect();pointer.x=(e.clientX-r.left)/r.width*2-1;pointer.y=(e.clientY-r.top)/r.height*2-1;if(drag)dragAngle+=(e.clientX-startX)*.006;startX=e.clientX;});
 canvas.addEventListener('pointerleave',()=>{pointer.x=pointer.y=0;});
 canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;drag=true;startX=e.clientX;canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointerup',()=>{drag=false;});canvas.addEventListener('pointercancel',()=>{drag=false;});
 const explore=document.querySelector('#assemble');
 explore.addEventListener('click',()=>{const expanded=explore.getAttribute('aria-pressed')!=='true';explore.setAttribute('aria-pressed',String(expanded));gsap.to(state,{spread:expanded?1:0,duration:reduce.matches||paused?0:1.25,ease:'power3.inOut',onUpdate:()=>{if(paused){cubes.forEach(({group},i)=>group.position.copy(bases[i]).multiplyScalar(1+state.spread*.28));draw();}}});});
 const media=gsap.matchMedia();media.add('(prefers-reduced-motion: no-preference)',()=>{gsap.to(state,{scroll:1,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});});
 const themeObserver=new MutationObserver(theme);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});theme();
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stop();host.parentElement.classList.remove('webgl-ready');explore.hidden=true;});
 canvas.addEventListener('webglcontextrestored',()=>{host.parentElement.classList.add('webgl-ready');explore.hidden=false;resize();start();});
 host.parentElement.classList.add('webgl-ready');start();
 return {setPaused(value){paused=value;if(paused){stop();gsap.killTweensOf(state,'spread');draw();}else start();}};
}
