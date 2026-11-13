(() => {
  if (!window.THREE) {
    document.getElementById('textureStatus').textContent = 'Three.js could not load';
    return;
  }

  const T = window.THREE;
  const mount = document.getElementById('mossRender');
  const status = document.getElementById('textureStatus');
  const wallWidth = 18;
  const wallHeight = 42;
  const cameraZ = 10.5;
  const maps = {};
  const scrollingMaps = [];
  let renderer, scene, camera, wallMaterial, wallMesh, scrollFrame = 0;
  let cursorLight, heightField, pointerOnPage = false;
  let ambientLight, washLight, fillLight;
  let lastTextureOffset = NaN;
  const pointerNdc = new T.Vector2();
  const pointerRaycaster = new T.Raycaster();
  const wallPlane = new T.Plane(new T.Vector3(0, 0, 1), .18);
  const wallHit = new T.Vector3();
  const lowPointUniform = {value:0};

  function startRenderer() {
    try {
      renderer = new T.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
    } catch (error) {
      status.textContent = 'WebGL unavailable in this browser';
      return false;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    mount.appendChild(renderer.domElement);
    return true;
  }

  function configureMap(texture, colorMap = false) {
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.magFilter = T.LinearFilter;
    texture.minFilter = T.LinearMipmapLinearFilter;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (colorMap) texture.encoding = T.sRGBEncoding;
    texture.needsUpdate = true;
    scrollingMaps.push(texture);
    lastTextureOffset = NaN;
    return texture;
  }

  function cacheHeightField(texture) {
    try {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const context = canvas.getContext('2d', {willReadFrequently:true});
      context.drawImage(texture.image, 0, 0, size, size);
      heightField = {data:context.getImageData(0, 0, size, size).data, width:size, height:size};
    } catch (error) {
      heightField = null;
    }
  }

  function sampleHeightAt(x, y) {
    if (!heightField || !maps.height) return .5;
    const texture = maps.height;
    texture.updateMatrix();
    const uv = new T.Vector2(x / wallWidth + .5, .5 - y / wallHeight).applyMatrix3(texture.matrix);
    const u = ((uv.x % 1) + 1) % 1;
    const v = ((uv.y % 1) + 1) % 1;
    const px = Math.min(heightField.width - 1, Math.floor(u * heightField.width));
    const py = Math.min(heightField.height - 1, Math.floor((1 - v) * heightField.height));
    return heightField.data[(py * heightField.width + px) * 4] / 255;
  }

  function updateCursorLight() {
    if (!cursorLight || !pointerOnPage) return;
    pointerRaycaster.setFromCamera(pointerNdc, camera);
    if (!pointerRaycaster.ray.intersectPlane(wallPlane, wallHit) ||
        Math.abs(wallHit.x) > wallWidth / 2 || Math.abs(wallHit.y) > wallHeight / 2) {
      cursorLight.visible = false;
      return;
    }
    const relief = wallMaterial ? wallMaterial.displacementScale : 0;
    const height = sampleHeightAt(wallHit.x, wallHit.y);
    cursorLight.position.set(wallHit.x, wallHit.y, wallMesh.position.z + height * relief + .12 + relief * .035);
    cursorLight.visible = true;
  }

  function setTextureScale(worldSize) {
    const repeatX = wallWidth / worldSize;
    const repeatY = wallHeight / worldSize;
    scrollingMaps.forEach(texture => {
      texture.repeat.set(repeatX, repeatY);
      texture.updateMatrix();
    });
    const output = document.getElementById('mossScaleValue');
    output.textContent = worldSize.toFixed(1) + 'm';
    updateTextureOffset();
  }

  function updateTextureOffset() {
    const worldTravel = window.scrollY * .008;
    const worldSize = Number(document.getElementById('mossScale').value);
    const cycles = worldTravel / worldSize;
    const wrappedCycles = ((cycles % 1) + 1) % 1;
    const offset = -wrappedCycles;
    if (Math.abs(offset - lastTextureOffset) < 0.000001) return;
    scrollingMaps.forEach(texture => {
      texture.offset.y = offset;
    });
    lastTextureOffset = offset;
  }

  function setCameraAngle(value) {
    if (!camera) return;
    const angle = value * Math.PI / 180;
    const targetZ = -.2;
    const distance = cameraZ - targetZ;
    const sine = Math.sin(angle);
    const cosine = Math.cos(angle);
    const frontClearance = .35 * sine * sine;
    camera.up.set(0, cosine, -sine);
    camera.position.set(0, sine * distance, targetZ + cosine * distance + frontClearance);
    camera.lookAt(0, 0, targetZ);
    document.getElementById('cameraAngleValue').textContent = (value > 0 ? '+' : '') + value + '°';
  }

  function setRelief(value) {
    if (!wallMaterial) return;
    wallMaterial.bumpScale = value * .72;
    wallMaterial.displacementScale = value * .62;
    document.getElementById('mossReliefValue').textContent = value.toFixed(2);
  }

  function setAmbient(value) {
    if (ambientLight) ambientLight.intensity = 1.55 * value;
    if (washLight) washLight.intensity = .95 * value;
    if (fillLight) fillLight.intensity = .62 * value;
    document.getElementById('ambientLightValue').textContent = value.toFixed(2);
  }

  function setLowPointDarkening(value) {
    lowPointUniform.value = value;
    document.getElementById('lowPointValue').textContent = value.toFixed(2);
  }

  function loadMaterial() {
    const loader = new T.TextureLoader();
    const base = 'assets/moss-pbr/ground_0014_';
    const load = (file, color = false) => new Promise((resolve, reject) => {
      loader.load(base + file, texture => resolve(configureMap(texture, color)), undefined, reject);
    });
    return Promise.all([
      load('color_2k.jpg', true),
      load('normal_opengl_2k.png'),
      load('height_2k.png'),
      load('roughness_2k.jpg'),
      load('ao_2k.jpg')
    ]).then(([color, normal, height, roughness, ao]) => {
      maps.color = color;
      maps.normal = normal;
      maps.height = height;
      maps.roughness = roughness;
      maps.ao = ao;
      cacheHeightField(height);
      wallMaterial.map = color;
      wallMaterial.normalMap = normal;
      wallMaterial.bumpMap = height;
      wallMaterial.displacementMap = height;
      wallMaterial.roughnessMap = roughness;
      wallMaterial.aoMap = ao;
      wallMaterial.onBeforeCompile = shader => {
        shader.uniforms.mossHeightMap = {value:height};
        shader.uniforms.mossHeightTransform = {value:height.matrix};
        shader.uniforms.mossLowPointDarkening = lowPointUniform;
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec2 vMossUv;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMossUv = uv;');
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform sampler2D mossHeightMap;\nuniform mat3 mossHeightTransform;\nuniform float mossLowPointDarkening;\nvarying vec2 vMossUv;')
          .replace('#include <color_fragment>', '#include <color_fragment>\nvec2 mossHeightUv = (mossHeightTransform * vec3(vMossUv, 1.0)).xy;\nfloat mossHeight = texture2D(mossHeightMap, mossHeightUv).r;\nfloat mossCrevice = 1.0 - smoothstep(0.30, 0.68, mossHeight);\ndiffuseColor.rgb *= max(0.08, 1.0 - mossCrevice * mossLowPointDarkening * 0.92);');
      };
      wallMaterial.needsUpdate = true;
      setTextureScale(Number(document.getElementById('mossScale').value));
      setRelief(Number(document.getElementById('mossRelief').value));
      setLowPointDarkening(Number(document.getElementById('lowPoint').value));
      status.textContent = '2K CC0 PBR · colour · normal · height · roughness · AO';
    }).catch(() => {
      status.textContent = 'Moss texture maps could not load';
    });
  }

  function makeRope(x, ledColor) {
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(x, 22, .34), new T.Vector3(x, 11, .33),
      new T.Vector3(x, 0, .34), new T.Vector3(x, -11, .33),
      new T.Vector3(x, -22, .34)
    ]);
    const diffuse = new T.MeshBasicMaterial({color:ledColor, transparent:true, opacity:.24, depthWrite:false});
    const core = new T.MeshBasicMaterial({color:ledColor});
    const group = new T.Group();
    group.add(new T.Mesh(new T.TubeGeometry(curve, 160, .15, 8, false), diffuse));
    group.add(new T.Mesh(new T.TubeGeometry(curve, 160, .038, 8, false), core));
    group.userData.diffuse = diffuse;
    group.userData.core = core;
    scene.add(group);
    return group;
  }

  function initScene() {
    if (!startRenderer()) return;
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(47, window.innerWidth / window.innerHeight, .1, 100);
    camera.position.set(0, 0, cameraZ);
    camera.lookAt(0, 0, -.2);
    ambientLight = new T.HemisphereLight(0xdce9ca, 0x27251a, 1.55);
    scene.add(ambientLight);
    washLight = new T.DirectionalLight(0xe0ebce, .95);
    washLight.position.set(-3, 5, 8);
    scene.add(washLight);
    fillLight = new T.DirectionalLight(0xb4c785, .62);
    fillLight.position.set(5, -2, 5);
    scene.add(fillLight);

    const geometry = new T.PlaneGeometry(wallWidth, wallHeight, 240, 560);
    geometry.setAttribute('uv2', new T.BufferAttribute(geometry.attributes.uv.array, 2));
    wallMaterial = new T.MeshStandardMaterial({
      color:0xffffff, roughness:.94, metalness:0, side:T.DoubleSide,
      displacementScale:.12, bumpScale:.07, aoMapIntensity:1.2
    });
    wallMesh = new T.Mesh(geometry, wallMaterial);
    wallMesh.position.z = -.18;
    scene.add(wallMesh);

    const ledColor = new T.Color(document.getElementById('ledColor').value);
    const ropes = [-wallWidth / 2 + .22, wallWidth / 2 - .22].map(x => makeRope(x, ledColor));
    const lights = [];
    for (const x of [-wallWidth / 2 + .3, wallWidth / 2 - .3]) {
      for (const y of [-5.4, 0, 5.4]) {
        const light = new T.PointLight(ledColor, 5.6, 13, 1.45);
        light.position.set(x, y, .55);
        light.userData.offset = y;
        scene.add(light);
        lights.push(light);
      }
    }
    cursorLight = new T.PointLight(new T.Color(document.getElementById('cursorLightColor').value), 18, 8, 2);
    cursorLight.visible = false;
    scene.add(cursorLight);

    function applyLed() {
      const color = new T.Color(document.getElementById('ledColor').value);
      const power = Number(document.getElementById('ledPower').value);
      document.getElementById('ledColorValue').textContent = document.getElementById('ledColor').value;
      document.getElementById('ledPowerValue').textContent = power.toFixed(1);
      lights.forEach(light => { light.color.copy(color); light.intensity = 4.5 * power; });
      ropes.forEach(rope => {
        rope.userData.core.color.copy(color);
        rope.userData.diffuse.color.copy(color);
        rope.userData.diffuse.opacity = .12 + power * .075;
      });
    }

    function applyBlur() {
      const value = Number(document.getElementById('glassBlur').value);
      document.documentElement.style.setProperty('--blur', value + 'px');
      document.getElementById('glassBlurValue').textContent = value + 'px';
    }

    function applyCursorLightColor() {
      const input = document.getElementById('cursorLightColor');
      cursorLight.color.set(input.value);
      document.getElementById('cursorLightColorValue').textContent = input.value;
    }

    document.getElementById('ledColor').addEventListener('input', applyLed);
    document.getElementById('ledPower').addEventListener('input', applyLed);
    document.getElementById('glassBlur').addEventListener('input', applyBlur);
    document.getElementById('cursorLightColor').addEventListener('input', applyCursorLightColor);
    document.getElementById('mossScale').addEventListener('input', event => setTextureScale(Number(event.target.value)));
    document.getElementById('mossRelief').addEventListener('input', event => setRelief(Number(event.target.value)));
    document.getElementById('ambientLight').addEventListener('input', event => setAmbient(Number(event.target.value)));
    document.getElementById('lowPoint').addEventListener('input', event => setLowPointDarkening(Number(event.target.value)));
    document.getElementById('cameraAngle').addEventListener('input', event => setCameraAngle(Number(event.target.value)));
    const controlsToggle = document.getElementById('controlsToggle');
    controlsToggle.addEventListener('click', () => {
      const expanded = controlsToggle.getAttribute('aria-expanded') === 'true';
      controlsToggle.setAttribute('aria-expanded', String(!expanded));
      controlsToggle.textContent = expanded ? 'Show settings' : 'Hide settings';
      document.body.classList.toggle('controls-hidden', expanded);
    });
    applyLed();
    applyBlur();
    applyCursorLightColor();
    setTextureScale(Number(document.getElementById('mossScale').value));
    setRelief(Number(document.getElementById('mossRelief').value));
    setAmbient(Number(document.getElementById('ambientLight').value));
    setLowPointDarkening(Number(document.getElementById('lowPoint').value));
    setCameraAngle(Number(document.getElementById('cameraAngle').value));
    loadMaterial();

    window.addEventListener('pointermove', event => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      pointerOnPage = true;
      updateCursorLight();
    }, {passive:true});
    window.addEventListener('pointerleave', () => {
      pointerOnPage = false;
      cursorLight.visible = false;
    }, {passive:true});

    const flow = document.getElementById('pageFlow');
    const sentinel = document.getElementById('scrollSentinel');
    let chapter = 0;
    const addChapters = () => {
      for (let i = 0; i < 3; i++) {
        chapter++;
        const section = document.createElement('section');
        section.className = 'moss-chapter';
        section.innerHTML = '<div><p class="eyebrow">TILEABLE PBR WALL / ' + String(chapter + 3).padStart(2, '0') + '</p><h2>Still growing.</h2><p>One continuous mapped surface carries on as its seamless texture scrolls behind the glass.</p></div>';
        flow.insertBefore(section, sentinel);
      }
    };
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) addChapters();
    }, {rootMargin:'1200px 0px'});
    observer.observe(sentinel);

    window.addEventListener('scroll', () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        const segment = Math.floor(window.scrollY / Math.max(window.innerHeight * .9, 1)) + 1;
        document.getElementById('scrollPosition').textContent = 'WALL SEGMENT ' + String(segment).padStart(2, '0');
        scrollFrame = 0;
      });
    }, {passive:true});

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const render = () => {
      requestAnimationFrame(render);
      updateTextureOffset();
      updateCursorLight();
      renderer.render(scene, camera);
    };
    render();
  }

  initScene();
})();
