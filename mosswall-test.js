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
  const highSize = 2048;
  const smallScreen = matchMedia('(max-width: 700px)').matches;
  const clumpCount = smallScreen ? 6400 : 13800;
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

  function makeNoiseTables(seed, size) {
    const random = randomSource(seed);
    return [3, 6, 12, 24, 48, 96, 192, 384, 768].filter(grid => grid <= size / 2).map(grid => {
      const table = new Float32Array(grid * grid);
      for (let i = 0; i < table.length; i++) table[i] = random();
      return {size:grid, table};
    });
  }

  function tileNoise(tables, u, v) {
    const weights = [.32,.22,.16,.115,.078,.05,.031,.016,.008];
    let value = 0;
    let totalWeight = 0;
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
      totalWeight += weights[octave];
    }
    return Math.max(0, Math.min(1, value / totalWeight));
  }

  function buildMaps(size, seed = 71) {
    const tables = makeNoiseTables(seed, size);
    const colorPixels = new Uint8Array(size * size * 4);
    const heightPixels = new Uint8Array(size * size * 4);
    const normalPixels = new Uint8Array(size * size * 4);
    const heightValues = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      const v = y / size;
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const macro = tileNoise(tables, u, v);
        const fine = tileNoise(tables, (u * 2 + .31) % 1, (v * 2 + .07) % 1);
        const micro = tileNoise(tables, (u * 5 + .63) % 1, (v * 5 + .19) % 1);
        const clump = Math.max(0, Math.min(1, (macro * .64 + fine * .36 - .29) * 2.25));
        const pits = Math.max(0, Math.min(1, (macro - .42) * 1.9));
        const fiber = (micro - .5) * 27;
        const green = 20 + clump * 104 + pits * 18 + fiber;
        const i = (y * size + x) * 4;
        colorPixels[i] = Math.max(6, Math.min(255, 13 + clump * 32 + micro * 13));
        colorPixels[i + 1] = Math.max(12, Math.min(255, green));
        colorPixels[i + 2] = Math.max(5, Math.min(255, 9 + clump * 13 + pits * 8));
        colorPixels[i + 3] = 255;
        const h = Math.round(24 + clump * 196 + (micro - .5) * 48);
        heightValues[y * size + x] = h / 255;
        heightPixels[i] = heightPixels[i + 1] = heightPixels[i + 2] = h;
        heightPixels[i + 3] = 255;
      }
    }
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const left = heightValues[y * size + (x + size - 1) % size];
      const right = heightValues[y * size + (x + 1) % size];
      const up = heightValues[((y + size - 1) % size) * size + x];
      const down = heightValues[((y + 1) % size) * size + x];
      let nx = (left - right) * 5.2, ny = (up - down) * 5.2, nz = 1;
      const length = Math.hypot(nx, ny, nz); nx /= length; ny /= length; nz /= length;
      const i = (y * size + x) * 4;
      normalPixels[i] = Math.round((nx * .5 + .5) * 255);
      normalPixels[i + 1] = Math.round((ny * .5 + .5) * 255);
      normalPixels[i + 2] = Math.round((nz * .5 + .5) * 255);
      normalPixels[i + 3] = 255;
    }
    return {
      colorMap: new T.DataTexture(colorPixels, size, size, T.RGBAFormat),
      heightMap: new T.DataTexture(heightPixels, size, size, T.RGBAFormat),
      normalMap: new T.DataTexture(normalPixels, size, size, T.RGBAFormat)
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
    try {
      const worker = new Worker('mosswall-texture-worker.js?v=20261112-3');
      worker.onmessage = event => {
        const {size, color, height, normal} = event.data;
        const highColor = new T.DataTexture(new Uint8Array(color), size, size, T.RGBAFormat);
        const highHeight = new T.DataTexture(new Uint8Array(height), size, size, T.RGBAFormat);
        const highNormal = new T.DataTexture(new Uint8Array(normal), size, size, T.RGBAFormat);
        setupTexture(highColor, true);
        setupTexture(highHeight);
        setupTexture(highNormal);
        materials.forEach(material => {
          material.map = highColor;
          material.bumpMap = highHeight;
          material.displacementMap = highHeight;
          material.normalMap = highNormal;
          material.normalScale.set(.72, .72);
          material.bumpScale = .20;
          material.displacementScale = .10;
          material.needsUpdate = true;
        });
        status.textContent = '2048² · colour · bump · normal · displacement';
        worker.terminate();
      };
      worker.onerror = () => {
        status.textContent = 'Procedural moss maps · 256²';
        worker.terminate();
      };
      worker.postMessage({size:highSize});
    } catch (error) {
      status.textContent = 'Procedural moss maps · 256²';
    }
  }

  function createMossCushionGeometry() {
    const geometry = new T.IcosahedronGeometry(1, 3);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      const lobe = Math.sin(x * 13 + y * 7) * Math.sin(y * 11 - z * 8);
      const grain = Math.sin(z * 21 + x * 17) * Math.cos(y * 19 - x * 9);
      const radius = 1 + lobe * .075 + grain * .025;
      positions.setXYZ(i, x * radius, y * radius, z * radius);
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

    const wallGeometry = new T.PlaneGeometry(wallWidth, tileHeight, 180, 150);
    const wallMaterial = new T.MeshStandardMaterial({
      map: setupTexture(maps.colorMap, true),
      bumpMap: setupTexture(maps.heightMap),
      normalMap: setupTexture(maps.normalMap),
      displacementMap: maps.heightMap,
      normalScale: new T.Vector2(.72, .72),
      bumpScale: .22,
      displacementScale: .10,
      roughness: .94,
      metalness: 0,
      color: 0xcbd0bc,
      side: T.DoubleSide
    });
    materials.push(wallMaterial);
    const wall = new T.Mesh(wallGeometry, wallMaterial);
    wall.position.z = -.15;
    group.add(wall);

    const random = randomSource(seed);
    const mossMaterial = new T.MeshStandardMaterial({color:0xffffff,roughness:.91,vertexColors:true,side:T.DoubleSide});
    const moss = new T.InstancedMesh(createMossCushionGeometry(), mossMaterial, clumpCount);
    // A lightly jittered grid keeps cushions touching, like the reference's packed moss mat.
    const columns = Math.ceil(Math.sqrt(clumpCount * wallWidth / tileHeight));
    const rows = Math.ceil(clumpCount / columns);
    const cellX = wallWidth / columns, cellY = tileHeight / rows;
    for (let i = 0; i < clumpCount; i++) {
      const col = i % columns, row = Math.floor(i / columns);
      const sizeX = cellX * (.56 + random() * .27);
      const sizeY = cellY * (.56 + random() * .27);
      const px = -wallWidth / 2 + (col + .5 + (random() - .5) * .32) * cellX;
      const py = tileHeight / 2 - (row + .5 + (random() - .5) * .32) * cellY;
      temp.position.set(px, py, .13 + random() * .025);
      temp.rotation.set((random() - .5) * .18, (random() - .5) * .18, random() * Math.PI * 2);
      temp.scale.set(sizeX, sizeY, .12 + random() * .07);
      temp.updateMatrix();
      moss.setMatrixAt(i, temp.matrix);
      tint.setHSL(.215 + random() * .065, .56 + random() * .25, .13 + random() * .09);
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
    status.textContent = 'Moss surface · refining to 2048² maps';
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
