(() => {
  if (!window.THREE) {
    document.getElementById('textureStatus').textContent = 'Three.js could not load';
    return;
  }

  const T = window.THREE;
  const mount = document.getElementById('mossRender');
  const status = document.getElementById('textureStatus');
  const wallWidth = 18;
  const tileHeight = 15;
  const chunkCount = 4;
  const lowSize = 256;
  const highSize = 1024;
  const clumpCount = matchMedia('(max-width: 700px)').matches ? 900 : 1700;
  const chunks = [];
  const materials = [];
  const temp = new T.Object3D();
  const tint = new T.Color();
  let renderer;
  let scene;
  let camera;
  let scrollFrame = 0;
  let ready = false;

  function randomSource(seed) {
    let state = seed >>> 0;
    return () => {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function makeNoiseTables(seed) {
    const random = randomSource(seed);
    return [3, 6, 12, 24, 48, 96, 192].map(size => {
      const table = new Float32Array(size * size);
      for (let i = 0; i < table.length; i++) table[i] = random();
      return {size, table};
    });
  }

  function tileNoise(tables, u, v) {
    const weights = [.37,.24,.16,.105,.065,.038,.022];
    let value = 0;
    for (let octave = 0; octave < tables.length; octave++) {
      const {size, table} = tables[octave];
      const x = u * size, y = v * size;
      const ix = Math.floor(x), iy = Math.floor(y);
      const fx = x - ix, fy = y - iy;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const at = (px, py) => table[((py % size + size) % size) * size + (px % size + size) % size];
      const a = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * sx;
      const b = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * sx;
      value += (a + (b - a) * sy) * weights[octave];
    }
    return Math.max(0, Math.min(1, value));
  }

  function buildMaps(size, seed = 71) {
    const tables = makeNoiseTables(seed);
    const colorPixels = new Uint8Array(size * size * 4);
    const heightPixels = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      const v = y / size;
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const macro = tileNoise(tables, u, v);
        const fine = tileNoise(tables, (u * 2 + .31) % 1, (v * 2 + .07) % 1);
        const micro = tileNoise(tables, (u * 5 + .63) % 1, (v * 5 + .19) % 1);
        const clump = Math.max(0, Math.min(1, (macro * .67 + fine * .33 - .31) * 2.05));
        const pits = Math.max(0, Math.min(1, (macro - .43) * 1.7));
        const green = 20 + clump * 96 + pits * 19 + (micro - .5) * 20;
        const i = (y * size + x) * 4;
        colorPixels[i] = Math.max(8, Math.min(255, 17 + clump * 34 + micro * 15));
        colorPixels[i + 1] = Math.max(12, Math.min(255, green));
        colorPixels[i + 2] = Math.max(7, Math.min(255, 12 + clump * 15 + pits * 8));
        colorPixels[i + 3] = 255;
        const h = Math.round(28 + clump * 174 + (micro - .5) * 38);
        heightPixels[i] = heightPixels[i + 1] = heightPixels[i + 2] = h;
        heightPixels[i + 3] = 255;
      }
    }
    return {
      colorMap: new T.DataTexture(colorPixels, size, size, T.RGBAFormat),
      heightMap: new T.DataTexture(heightPixels, size, size, T.RGBAFormat)
    };
  }

  function setupTexture(texture, colorMap = false) {
    texture.wrapS = T.RepeatWrapping;
    texture.wrapT = T.RepeatWrapping;
    texture.magFilter = T.LinearFilter;
    texture.minFilter = T.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (colorMap) texture.encoding = T.sRGBEncoding;
    texture.needsUpdate = true;
    return texture;
  }

  function makeHighResInWorker() {
    const workerCode = `
      const randomSource=seed=>{let s=seed>>>0;return()=>{s+=0x6D2B79F5;let v=s;v=Math.imul(v^v>>>15,v|1);v^=v+Math.imul(v^v>>>7,v|61);return((v^v>>>14)>>>0)/4294967296}};
      const tablesFor=seed=>{const r=randomSource(seed);return[3,6,12,24,48,96,192].map(size=>{const table=new Float32Array(size*size);for(let i=0;i<table.length;i++)table[i]=r();return{size,table}})};
      const noise=(tables,u,v)=>{const weights=[.37,.24,.16,.105,.065,.038,.022];let value=0;for(let o=0;o<tables.length;o++){const{size,table}=tables[o],x=u*size,y=v*size,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),at=(px,py)=>table[((py%size+size)%size)*size+(px%size+size)%size],a=at(ix,iy)+(at(ix+1,iy)-at(ix,iy))*sx,b=at(ix,iy+1)+(at(ix+1,iy+1)-at(ix,iy+1))*sx;value+=(a+(b-a)*sy)*weights[o]}return Math.max(0,Math.min(1,value))};
      self.onmessage=({data})=>{const size=data.size,tables=tablesFor(71),c=new Uint8Array(size*size*4),h=new Uint8Array(size*size*4);for(let y=0;y<size;y++){const v=y/size;for(let x=0;x<size;x++){const u=x/size,macro=noise(tables,u,v),fine=noise(tables,(u*2+.31)%1,(v*2+.07)%1),micro=noise(tables,(u*5+.63)%1,(v*5+.19)%1),clump=Math.max(0,Math.min(1,(macro*.67+fine*.33-.31)*2.05)),pits=Math.max(0,Math.min(1,(macro-.43)*1.7)),green=20+clump*96+pits*19+(micro-.5)*20,i=(y*size+x)*4;c[i]=Math.max(8,Math.min(255,17+clump*34+micro*15));c[i+1]=Math.max(12,Math.min(255,green));c[i+2]=Math.max(7,Math.min(255,12+clump*15+pits*8));c[i+3]=255;const z=Math.round(28+clump*174+(micro-.5)*38);h[i]=h[i+1]=h[i+2]=z;h[i+3]=255}}self.postMessage({size,color:c.buffer,height:h.buffer},[c.buffer,h.buffer])};
    `;
    let url;
    try {
      url = URL.createObjectURL(new Blob([workerCode], {type:'text/javascript'}));
      const worker = new Worker(url);
      worker.onmessage = event => {
        const {size, color, height} = event.data;
        const highColor = new T.DataTexture(new Uint8Array(color), size, size, T.RGBAFormat);
        const highHeight = new T.DataTexture(new Uint8Array(height), size, size, T.RGBAFormat);
        setupTexture(highColor, true);
        setupTexture(highHeight);
        materials.forEach(material => {
          material.map = highColor;
          material.bumpMap = highHeight;
          material.displacementMap = highHeight;
          material.bumpScale = .28;
          material.displacementScale = .37;
          material.needsUpdate = true;
        });
        status.textContent = 'High resolution moss maps · 1024²';
        worker.terminate();
        URL.revokeObjectURL(url);
      };
      worker.onerror = () => {
        status.textContent = 'Procedural moss maps · 256²';
        worker.terminate();
        URL.revokeObjectURL(url);
      };
      worker.postMessage({size:highSize});
    } catch (error) {
      status.textContent = 'Procedural moss maps · 256²';
      if (url) URL.revokeObjectURL(url);
    }
  }

  function createClumpGeometry() {
    const geometry = new T.IcosahedronGeometry(1, 1);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      const bump = 1 + .11 * Math.sin(x * 8 + y * 5) * Math.cos(z * 7 - y * 3);
      positions.setXYZ(i, x * bump, y * bump, z * bump);
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  function ropeCurve(x) {
    return new T.CatmullRomCurve3([
      new T.Vector3(x, tileHeight / 2, .31),
      new T.Vector3(x, tileHeight * .25, .32),
      new T.Vector3(x, 0, .31),
      new T.Vector3(x, -tileHeight * .25, .32),
      new T.Vector3(x, -tileHeight / 2, .31)
    ]);
  }

  function makeChunk(row, seed, maps) {
    const group = new T.Group();
    group.position.y = -row * tileHeight;

    const wallGeometry = new T.PlaneGeometry(wallWidth, tileHeight, 100, 92);
    const wallMaterial = new T.MeshStandardMaterial({
      map: setupTexture(maps.colorMap, true),
      bumpMap: setupTexture(maps.heightMap),
      displacementMap: maps.heightMap,
      bumpScale: .21,
      displacementScale: .29,
      roughness: 1,
      metalness: 0,
      color: 0xcbd0bc,
      side: T.DoubleSide
    });
    materials.push(wallMaterial);
    const wall = new T.Mesh(wallGeometry, wallMaterial);
    wall.position.z = -.15;
    group.add(wall);

    const random = randomSource(seed);
    const moss = new T.InstancedMesh(createClumpGeometry(), new T.MeshStandardMaterial({color:0xffffff,roughness:.96,vertexColors:true}), clumpCount);
    for (let i = 0; i < clumpCount; i++) {
      const size = .055 + Math.pow(random(), 1.65) * .3;
      temp.position.set((random() - .5) * (wallWidth + .1), (random() - .5) * tileHeight, -.025 + random() * .26);
      temp.rotation.set(random() * Math.PI, random() * Math.PI * 2, random() * Math.PI);
      temp.scale.set(size * (.72 + random() * .72), size * (.33 + random() * .66), size * (.42 + random() * .78));
      temp.updateMatrix();
      moss.setMatrixAt(i, temp.matrix);
      tint.setHSL(.22 + random() * .075, .36 + random() * .34, .14 + random() * .2);
      moss.setColorAt(i, tint);
    }
    moss.instanceMatrix.needsUpdate = true;
    if (moss.instanceColor) moss.instanceColor.needsUpdate = true;
    group.add(moss);

    const led = new T.Color(document.getElementById('ledColor').value);
    const ropeCore = new T.MeshBasicMaterial({color:led});
    const ropeDiffusion = new T.MeshBasicMaterial({color:led,transparent:true,opacity:.24,depthWrite:false});
    [-wallWidth / 2 + .21, wallWidth / 2 - .21].forEach(x => {
      const curve = ropeCurve(x);
      group.add(new T.Mesh(new T.TubeGeometry(curve, 72, .12, 8, false), ropeDiffusion));
      group.add(new T.Mesh(new T.TubeGeometry(curve, 72, .034, 8, false), ropeCore));
    });
    group.userData.ropeCore = ropeCore;
    group.userData.ropeDiffusion = ropeDiffusion;
    scene.add(group);
    chunks.push(group);
  }

  function startRenderer() {
    try {
      renderer = new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
    } catch (error) {
      status.textContent = 'WebGL unavailable in this browser';
      return false;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    mount.appendChild(renderer.domElement);
    return true;
  }

  function installControls(lights) {
    const colorInput = document.getElementById('ledColor');
    const powerInput = document.getElementById('ledPower');
    const blurInput = document.getElementById('glassBlur');
    const glassPanel = document.getElementById('glassPanel');
    const blurOutput = document.getElementById('glassBlurValue');
    const applyLed = () => {
      const nextColor = new T.Color(colorInput.value);
      const power = Number(powerInput.value);
      document.getElementById('ledColorValue').textContent = colorInput.value;
      document.getElementById('ledPowerValue').textContent = power.toFixed(1);
      lights.forEach(light => { light.color.copy(nextColor); light.intensity = 4.5 * power; });
      chunks.forEach(chunk => {
        chunk.userData.ropeCore.color.copy(nextColor);
        chunk.userData.ropeDiffusion.color.copy(nextColor);
        chunk.userData.ropeDiffusion.opacity = .12 + power * .075;
      });
    };
    const applyBlur = () => {
      const value = Number(blurInput.value);
      glassPanel.style.setProperty('--blur', value + 'px');
      blurOutput.textContent = value + 'px';
    };
    colorInput.addEventListener('input', applyLed);
    powerInput.addEventListener('input', applyLed);
    blurInput.addEventListener('input', applyBlur);
    applyLed();
    applyBlur();
  }

  function addScrollContent() {
    const flow = document.getElementById('pageFlow');
    const sentinel = document.getElementById('scrollSentinel');
    let count = 0;
    const add = () => {
      for (let i = 0; i < 3; i++) {
        count++;
        const section = document.createElement('section');
        section.className = 'moss-chapter';
        section.innerHTML = '<div><p class="eyebrow">PROCEDURAL WALL / ' + String(count + 3).padStart(2, '0') + '</p><h2>Still growing.</h2><p>Scroll further. The geometry tiles behind the view while the continuous surface carries on.</p></div>';
        flow.insertBefore(section, sentinel);
      }
    };
    if (!('IntersectionObserver' in window)) {
      add();
      window.addEventListener('scroll', () => {
        if (window.scrollY + window.innerHeight > document.body.scrollHeight - 1400) add();
      }, {passive:true});
      return;
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) add();
    }, {rootMargin:'1200px 0px'});
    observer.observe(sentinel);
  }

  function updateScroll() {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      const travel = window.scrollY * .008;
      camera.position.y = -travel;
      camera.lookAt(0, -travel, -.2);
      const currentRow = Math.floor(travel / tileHeight);
      chunks.forEach((chunk, index) => {
        const row = currentRow + index - 1;
        chunk.position.y = -row * tileHeight;
      });
      scene.userData.leds.forEach(light => { light.position.y = camera.position.y + light.userData.offset; });
      const segment = Math.floor(window.scrollY / Math.max(window.innerHeight * .9, 1)) + 1;
      document.getElementById('scrollPosition').textContent = 'WALL SEGMENT ' + String(segment).padStart(2, '0');
      scrollFrame = 0;
    });
  }

  function init() {
    if (!startRenderer()) return;
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(47, window.innerWidth / window.innerHeight, .1, 150);
    camera.position.set(0, 0, 10.5);
    camera.lookAt(0, 0, -.2);
    scene.add(new T.HemisphereLight(0xd7e4bf, 0x141a12, 1.28));
    const wash = new T.DirectionalLight(0xc1d2a9, 1.05);
    wash.position.set(-3, 4, 9);
    scene.add(wash);
    const edgeFill = new T.DirectionalLight(0x91a578, .55);
    edgeFill.position.set(5, -1, 5);
    scene.add(edgeFill);

    const lights = [];
    for (const x of [-wallWidth / 2 + .23, wallWidth / 2 - .23]) {
      for (const offset of [-2.8, 2.8]) {
        const light = new T.PointLight(new T.Color(document.getElementById('ledColor').value), 6.3, 7.5, 1.65);
        light.position.set(x, offset, .4);
        light.userData.offset = offset;
        scene.add(light);
        lights.push(light);
      }
    }
    scene.userData.leds = lights;

    const maps = buildMaps(lowSize);
    for (let row = -1; row < chunkCount - 1; row++) makeChunk(row, 631 + row * 1207, maps);
    status.textContent = 'Moss surface · refining to 1024²';
    setTimeout(makeHighResInWorker, 400);
    installControls(lights);
    addScrollContent();
    window.addEventListener('scroll', updateScroll, {passive:true});
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    ready = true;
    status.textContent = 'Moss surface · 256² / refining';
    const render = () => {
      if (!ready) return;
      requestAnimationFrame(render);
      renderer.render(scene, camera);
    };
    render();
  }

  init();
})();
