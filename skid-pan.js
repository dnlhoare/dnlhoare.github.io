(() => {
  const THREE = window.THREE;
  const $ = id => document.getElementById(id);
  const viewport = $('viewport');
  if (!THREE || !window.DriftPhysics) {
    $('loading').hidden = true;
    const error = $('webglError');
    error.textContent = !THREE ? 'Three.js did not load. Check your internet connection and reload.' : 'skid-pan-physics.js is missing. Keep the demo files together.';
    error.hidden = false;
    return;
  }
  const car = new window.DriftPhysics.DriftCar();
  const controls = { throttle: 0, brake: 0, steer: 0, handbrake: false };
  const tune = { mass: 1120, inertia: 2050, power: 6200, steering: 0.56, grip: 0.88 };
  const keys = new Set();
  const clamp = window.DriftPhysics.clamp;
  let scene, camera, renderer, carRig, wheelMeshes = [], rearSmoke, trailPositions, trailGeometry, trailLine;
  let lastTime = 0, elapsed = 0, trailAccum = 0;

  function material(color, roughness = 0.8, metalness = 0) { return new THREE.MeshStandardMaterial({ color, roughness, metalness }); }
  function box(parent, w, h, d, x, y, z, mat, radius = 0) {
    let geometry = new THREE.BoxGeometry(w, h, d);
    if (radius) geometry = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function cylinder(parent, radius, height, x, y, z, mat, segments = 40) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), mat);
    mesh.position.set(x, y, z); mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function makeCar() {
    carRig = new THREE.Group(); scene.add(carRig);
    const body = new THREE.Group(); carRig.add(body);
    box(body, 1.76, 0.43, 3.65, 0, 0.63, 0, material('#d73531', 0.3, 0.18));
    box(body, 1.53, 0.45, 1.72, 0, 0.99, -0.19, material('#c7d5d0', 0.2, 0.08));
    box(body, 1.42, 0.22, 0.34, 0, 0.88, -1.17, material('#b9d0ce', 0.2, 0.05));
    box(body, 1.7, 0.13, 0.2, 0, 0.89, 1.69, material('#252621', 0.42));
    box(body, 1.2, 0.11, 0.3, 0, 1.08, 1.51, material('#1c1d19', 0.38));
    box(body, 0.11, 0.12, 0.2, -0.5, 0.81, -1.84, material('#f2e4ba', 0.2));
    box(body, 0.11, 0.12, 0.2, 0.5, 0.81, -1.84, material('#f2e4ba', 0.2));
    box(body, 0.18, 0.11, 0.12, -0.58, 0.82, 1.85, material('#ff433b', 0.2));
    box(body, 0.18, 0.11, 0.12, 0.58, 0.82, 1.85, material('#ff433b', 0.2));
    const rubber = material('#181a18', 0.92), rim = material('#aeb2a7', 0.35, 0.65);
    for (const z of [-1.15, 1.15]) for (const x of [-0.91, 0.91]) {
      const pivot = new THREE.Group(); pivot.position.set(x, 0.39, z); body.add(pivot);
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.25, 20), rubber);
      tire.rotation.z = Math.PI / 2; tire.castShadow = true; pivot.add(tire);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.26, 12), rim); hub.rotation.z = Math.PI / 2; pivot.add(hub);
      wheelMeshes.push({ pivot, x, z, tire });
    }
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0xdeddd5, transparent: true, opacity: 0.48, depthWrite: false });
    rearSmoke = new THREE.Group(); scene.add(rearSmoke);
    for (let i=0;i<6;i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.16 + i*0.025, 8, 8), smokeMat.clone());
      p.visible = false; rearSmoke.add(p);
    }
  }
  function makePan() {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(500,500), material('#343c2d'));
    ground.rotation.x = -Math.PI/2; ground.position.y = -0.22; ground.receiveShadow = true; scene.add(ground);
    const pan = new THREE.Mesh(new THREE.CircleGeometry(43,128), material('#666b58', 0.96)); pan.rotation.x = -Math.PI/2; pan.position.y = -0.16; pan.receiveShadow = true; scene.add(pan);
    const pad = new THREE.Mesh(new THREE.CircleGeometry(38,128), material('#797b69', 0.98)); pad.rotation.x = -Math.PI/2; pad.position.y = -0.145; pad.receiveShadow = true; scene.add(pad);
    const lineMat = new THREE.MeshStandardMaterial({ color:'#c5c4ae', roughness:1, transparent:true, opacity:.5 });
    for (const radius of [15, 28, 38]) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(radius-.075,radius+.075,128),lineMat); ring.rotation.x=-Math.PI/2;ring.position.y=-.125;scene.add(ring);
    }
    const dashedMat = material('#c5c4ae');
    for (let a=0;a<32;a++) {
      const theta=a*Math.PI*2/32;
      const post=cylinder(scene,0.09,0.7,Math.cos(theta)*41,0.16,Math.sin(theta)*41,material('#e7e1cc'),8);
      post.position.y=.12;
      const cap=cylinder(scene,0.13,0.12,Math.cos(theta)*41,.53,Math.sin(theta)*41,material(a%2?'#e44936':'#f0e4c3'),8);
      cap.position.y=.53;
    }
    // Cones around a small practice circle.
    for(let i=0;i<14;i++) { const a=i*2*Math.PI/14; const x=Math.cos(a)*15.2,z=Math.sin(a)*15.2; const cone=new THREE.Mesh(new THREE.ConeGeometry(.35,.95,12),material(i%2?'#e7e0ce':'#e34432')); cone.position.set(x,.39,z);cone.castShadow=true;scene.add(cone); }
    // Outer flood lights give the scene depth while keeping the pad clear.
    for(const [x,z] of [[-46,-35],[46,-35],[-46,35],[46,35]]) {
      cylinder(scene,.18,10,x,4.8,z,material('#54594c'),12);
      const lamp=new THREE.Mesh(new THREE.SphereGeometry(.48,12,8),new THREE.MeshBasicMaterial({color:'#f5e9bd'})); lamp.position.set(x,9.9,z); scene.add(lamp);
    }
    // A restrained concrete-grid texture adds scale cues to the flat practice surface.
    const grid = new THREE.GridHelper(500,100,'#414738','#414738'); grid.position.y=-.205; grid.material.transparent=true; grid.material.opacity=.22; scene.add(grid);
  }
  function makeSkidLine() {
    trailPositions = new Float32Array(6000*3); trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute('position',new THREE.BufferAttribute(trailPositions,3)); trailGeometry.setDrawRange(0,0);
    trailLine = new THREE.LineSegments(trailGeometry,new THREE.LineBasicMaterial({color:'#252521',transparent:true,opacity:.65})); trailLine.position.y=.018; scene.add(trailLine);
  }
  function init() {
    try { renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'}); }
    catch(e) { $('loading').hidden=true; $('webglError').hidden=false; return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1,1.6)); renderer.setSize(viewport.clientWidth,viewport.clientHeight);
    renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.outputEncoding=THREE.sRGBEncoding; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.14;
    viewport.prepend(renderer.domElement);
    scene=new THREE.Scene();scene.background=new THREE.Color('#31382d');scene.fog=new THREE.Fog('#31382d',95,190);
    camera=new THREE.PerspectiveCamera(43,viewport.clientWidth/viewport.clientHeight,.1,300);
    camera.position.set(0,47,31);
    scene.add(new THREE.HemisphereLight('#e9edd9','#34392d',2.05));
    const sun=new THREE.DirectionalLight('#fff3d8',3.2);sun.position.set(-28,46,-18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-52;sun.shadow.camera.right=52;sun.shadow.camera.top=52;sun.shadow.camera.bottom=-52;sun.shadow.bias=-.00018;scene.add(sun);
    makePan();makeCar();makeSkidLine();
    camera.lookAt(0,0,0);$('loading').hidden=true;clearTimeout(window.skidPanBootWatchdog);
    new ResizeObserver(resize).observe(viewport);
    renderer.setAnimationLoop(animate);
  }
  function resize(){if(!renderer)return;const w=viewport.clientWidth,h=viewport.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
  function readInput(){
    const forwardSpeed=car.vx*Math.sin(car.heading)-car.vz*Math.cos(car.heading);
    const reversing=(keys.has('KeyS')||keys.has('ArrowDown'))&&forwardSpeed<1.2;
    controls.throttle=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(reversing?1:0);
    controls.steer=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
    controls.brake=(keys.has('KeyS')||keys.has('ArrowDown'))&&!reversing?1:0;
    controls.handbrake=keys.has('Space');
  }
  function updateHud(data,dt){
    const kmh=data.speed*3.6;const angle=data.angle*180/Math.PI;const rear=Math.abs(car.rearSlip*180/Math.PI);
    $('speed').textContent=String(Math.round(kmh)).padStart(3,'0');$('speedLarge').textContent=String(Math.round(kmh)).padStart(3,'0');
    $('angle').textContent=`${Math.round(angle)}°`;$('slip').textContent=`${Math.round(rear)}°`;$('lateralG').textContent=`${data.lateralG.toFixed(2)} G`;
    $('angleMeter').style.width=`${clamp(Math.abs(angle)/55,0,1)*100}%`;$('gMeter').style.width=`${clamp(data.lateralG/1.25,0,1)*100}%`;
    $('gear').textContent=kmh<1?'N':String(clamp(Math.floor(kmh/28)+1,1,5));
    if(kmh>3)$('statusText').textContent=controls.handbrake?'REAR AXLE LOCKED':'ON THE SKID PAN';else $('statusText').textContent='READY TO DRIVE';
  }
  function updateCarVisuals(dt,data){
    carRig.position.set(car.x,0,car.z);carRig.rotation.y=-car.heading;
    for(const w of wheelMeshes){if(w.z<0)w.pivot.rotation.y=-car.steer;w.tire.rotation.x-=data.speed*dt*2.4;}
    const lateral=Math.abs(car.rearSlip);
    rearSmoke.children.forEach((p,i)=>{const active=lateral>.17&&data.speed>7; p.visible=active;if(active){const t=(elapsed*.55+i*.16)%1; const x=(i%2?1:-1)*.92; const z=1.15+t*1.6; const worldX=car.x+Math.cos(car.heading)*x+Math.sin(car.heading)*z;const worldZ=car.z+Math.sin(car.heading)*x-Math.cos(car.heading)*z;p.position.set(worldX,.28+t*.65,worldZ);p.scale.setScalar(.6+t*1.45);p.material.opacity=(1-t)*.3;}});
    trailAccum+=dt;
    if(lateral>.2&&data.speed>8&&trailAccum>.035){trailAccum=0;const pos=trailGeometry.attributes.position;let n=trailGeometry.drawRange.count;for(const side of [-.72,.72]){if(n>=pos.count-2){n=0;}const x=car.x+Math.cos(car.heading)*side+Math.sin(car.heading)*1.13;const z=car.z+Math.sin(car.heading)*side-Math.cos(car.heading)*1.13;pos.setXYZ(n++,x,.022,z);}trailGeometry.setDrawRange(0,n);pos.needsUpdate=true;trailGeometry.computeBoundingSphere();}
  }
  function animate(now){const dt=Math.min((now-lastTime)/1000||0,0.035);lastTime=now;elapsed+=dt;readInput();
    if(dt>0){const data=car.step(controls,dt,tune);updateHud(data,dt);updateCarVisuals(dt,data);}
    const follow=1-Math.exp(-dt*3.1);const backX=-Math.sin(car.heading),backZ=Math.cos(car.heading);
    const desired=new THREE.Vector3(car.x+backX*10,43,car.z+backZ*10);camera.position.lerp(desired,follow);
    const lookAt=new THREE.Vector3(car.x,0,car.z);camera.lookAt(lookAt);
    renderer.render(scene,camera);
  }
  function reset(){car.reset();trailGeometry.setDrawRange(0,0);trailAccum=0;}
  window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='KeyR')reset();});
  window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
  $('resetButton').addEventListener('click',reset);
  $('tyreModel').addEventListener('change',e=>car.model=e.target.value);
  $('grip').addEventListener('input',e=>{tune.grip=Number(e.target.value)/100;$('gripValue').textContent=`${e.target.value}%`;});
  document.querySelectorAll('[data-control]').forEach(button=>{
    const control=button.dataset.control;const key={left:'ArrowLeft',right:'ArrowRight',throttle:'ArrowUp',brake:'ArrowDown',handbrake:'Space'}[control];
    button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);keys.add(key);button.classList.add('active');});
    const release=()=>{keys.delete(key);button.classList.remove('active');};button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  });
  init();
})();
