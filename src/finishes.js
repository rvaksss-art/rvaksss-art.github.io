import * as THREE from 'three';

// Original geometric ornaments. Each decal follows a physical face of the mechanism.
export function engravedFace(parent, design, size, height = size) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = design === 'border' ? 64 : 512;
  const pen = canvas.getContext('2d');
  const path = (points, closed = false) => {
    pen.beginPath();
    points.forEach(([x,y], i) => i ? pen.lineTo(x,y) : pen.moveTo(x,y));
    if (closed) pen.closePath();
    pen.stroke();
  };
  pen.lineJoin = 'round';
  pen.lineCap = 'round';
  pen.lineWidth = 9;
  pen.strokeStyle = '#233c32';
  if (design === 'seal') {
    pen.translate(256,256);
    pen.strokeRect(-204,-204,408,408);
    for(let i=0;i<4;i++) {
      pen.rotate(Math.PI/2);
      path([[-159,-125],[-159,-158],[-95,-158],[-95,-113],[-128,-113],[-128,-135]]);
      path([[-18,-159],[0,-178],[18,-159],[0,-140]],true);
    }
    path([[0,-96],[96,0],[0,96],[-96,0]],true);
    path([[-48,0],[0,-48],[48,0],[0,48]],true);
  } else if (design === 'dial') {
    pen.translate(256,256);
    pen.strokeStyle = '#e7b77d';
    for(let i=0;i<8;i++){
      pen.save();pen.rotate(i*Math.PI/4);
      path([[-32,-129],[0,-167],[32,-129]]);
      path([[0,-144],[0,-106]]);
      pen.restore();
    }
  } else {
    pen.lineWidth = 6;
    for(let x=16;x<495;x+=60){
      path([[x,48],[x,16],[x+38,16],[x+38,39],[x+17,39],[x+17,29]]);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({map:texture, transparent:true, depthWrite:false,
    polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1});
  const engraving = new THREE.Mesh(new THREE.PlaneGeometry(size,height),material);
  // Draw ink over its opaque substrate, then composite the enclosing glass.
  engraving.renderOrder = 1;
  parent.add(engraving);
  return engraving;
}

export function polishedGlass(tint) {
  return new THREE.ShaderMaterial({
    uniforms:{tint:{value:new THREE.Color(tint)},visibility:{value:1}},
    transparent:true,depthWrite:false,
    vertexShader:`
      varying vec3 surfaceNormal;
      varying vec3 sightline;
      void main(){
        vec4 view = modelViewMatrix * vec4(position,1.);
        surfaceNormal = normalMatrix * normal;
        sightline = -view.xyz;
        gl_Position = projectionMatrix * view;
      }`,
    fragmentShader:`
      varying vec3 surfaceNormal;
      varying vec3 sightline;
      uniform vec3 tint;
      uniform float visibility;
      void main(){
        vec3 n = normalize(surfaceNormal);
        vec3 v = normalize(sightline);
        float rim = pow(1.-clamp(dot(n,v),0.,1.),3.);
        vec3 ray = reflect(-v,n);
        float ribbon = smoothstep(.92,.995,dot(ray,normalize(vec3(-.6,.7,.46))));
        gl_FragColor = vec4(mix(tint,vec3(1.),ribbon*.80),(.014+rim*.28+ribbon*.17)*visibility);
        #include <colorspace_fragment>
      }`
  });
}
