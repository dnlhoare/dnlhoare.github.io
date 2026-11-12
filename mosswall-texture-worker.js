const randomSource = seed => {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
};

function makeTables(seed, resolution) {
  const random = randomSource(seed);
  return [3,6,12,24,48,96,192,384,768].filter(size => size <= resolution / 2).map(size => {
    const values = new Float32Array(size * size);
    for (let i = 0; i < values.length; i++) values[i] = random();
    return {size, values};
  });
}

function noiseAt(tables, u, v) {
  const weights = [.32,.22,.16,.115,.078,.05,.031,.016,.008];
  let value = 0, weightSum = 0;
  for (let octave = 0; octave < tables.length; octave++) {
    const {size, values} = tables[octave];
    const x = u * size, y = v * size;
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const at = (px, py) => values[((py % size + size) % size) * size + (px % size + size) % size];
    const a = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * sx;
    const b = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * sx;
    value += (a + (b - a) * sy) * weights[octave];
    weightSum += weights[octave];
  }
  return value / weightSum;
}

self.onmessage = event => {
  const size = event.data.size;
  const tables = makeTables(71, size);
  const color = new Uint8Array(size * size * 4);
  const height = new Uint8Array(size * size * 4);
  const normal = new Uint8Array(size * size * 4);
  const heightValues = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const macro = noiseAt(tables, u, v);
      const fine = noiseAt(tables, (u * 2 + .31) % 1, (v * 2 + .07) % 1);
      const micro = noiseAt(tables, (u * 5 + .63) % 1, (v * 5 + .19) % 1);
      const clump = Math.max(0, Math.min(1, (macro * .64 + fine * .36 - .29) * 2.25));
      const pits = Math.max(0, Math.min(1, (macro - .42) * 1.9));
      const fiber = (micro - .5) * 27;
      const green = 20 + clump * 104 + pits * 18 + fiber;
      const i = (y * size + x) * 4;
      color[i] = Math.max(6, Math.min(255, 13 + clump * 32 + micro * 13));
      color[i + 1] = Math.max(12, Math.min(255, green));
      color[i + 2] = Math.max(5, Math.min(255, 9 + clump * 13 + pits * 8));
      color[i + 3] = 255;
      const h = Math.round(24 + clump * 196 + (micro - .5) * 48);
      heightValues[y * size + x] = h / 255;
      height[i] = height[i + 1] = height[i + 2] = h;
      height[i + 3] = 255;
    }
  }

  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const left = heightValues[y * size + (x + size - 1) % size];
    const right = heightValues[y * size + (x + 1) % size];
    const up = heightValues[((y + size - 1) % size) * size + x];
    const down = heightValues[((y + 1) % size) * size + x];
    let nx = (left - right) * 5.2, ny = (up - down) * 5.2, nz = 1;
    const length = Math.hypot(nx, ny, nz);
    nx /= length; ny /= length; nz /= length;
    const i = (y * size + x) * 4;
    normal[i] = Math.round((nx * .5 + .5) * 255);
    normal[i + 1] = Math.round((ny * .5 + .5) * 255);
    normal[i + 2] = Math.round((nz * .5 + .5) * 255);
    normal[i + 3] = 255;
  }

  self.postMessage({size, color:color.buffer, height:height.buffer, normal:normal.buffer}, [color.buffer, height.buffer, normal.buffer]);
};
