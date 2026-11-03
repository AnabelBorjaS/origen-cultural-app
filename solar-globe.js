// ORIGEN Cultural — solar globe illumination, private beta.
// No geolocation, telemetry, user account or external paid API.
// Texture sources are the pinned three-globe example assets. The automatic
// image blends real day/night hemispheres using NOAA solar approximations.
// A lightweight static day texture remains the fail-closed visual fallback.
window.OrigenSolarGlobe = (() => {
  'use strict';

  const DAY = 'https://cdn.jsdelivr.net/npm/three-globe@2.45.3/example/img/earth-blue-marble.jpg';
  const NIGHT = 'https://cdn.jsdelivr.net/npm/three-globe@2.45.3/example/img/earth-night.jpg';
  const PREF = 'origen-globe-illumination';
  const VALID = new Set(['auto', 'day', 'night']);
  const W = 1024;
  const H = 512;
  const UPDATE_MS = 15 * 60 * 1000;
  const RAD = Math.PI / 180;
  const DEG = 180 / Math.PI;
  const active = new Set();
  let cachedTextures = null;
  let texturePromise = null;
  let lastComposite = null;
  let lastBucket = -1;
  let timer = null;
  let sequence = 0;
  let solarAvailable = true;

  function readMode() {
    try {
      const v = window.localStorage.getItem(PREF);
      return VALID.has(v) ? v : 'auto';
    } catch { return 'auto'; }
  }
  let currentMode = readMode();

  function normalizeLon(lon) {
    return ((lon + 180) % 360 + 360) % 360 - 180;
  }

  // NOAA/GML "General Solar Position Calculations" for approximate solar
  // declination and equation of time. Coordinates use east-positive longitude.
  // This represents the Sun's Earth-facing position, not a person's timezone.
  function solarSubpoint(at = new Date()) {
    const date = new Date(at);
    if (!Number.isFinite(date.getTime())) throw new RangeError('Invalid solar date');
    const year = date.getUTCFullYear();
    const days = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
    const dayNo = Math.floor((Date.UTC(year, date.getUTCMonth(), date.getUTCDate()) -
      Date.UTC(year, 0, 1)) / 86400000) + 1;
    const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes() +
      date.getUTCSeconds() / 60 + date.getUTCMilliseconds() / 60000;
    const gamma = 2 * Math.PI / days * (dayNo - 1 + (utcMinutes / 60 - 12) / 24);
    const equationMinutes = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
    const declination = 0.006918 - 0.399912 * Math.cos(gamma) +
      0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) +
      0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) +
      0.00148 * Math.sin(3 * gamma);
    return Object.freeze({
      latitude: declination * DEG,
      longitude: normalizeLon(180 - (utcMinutes + equationMinutes) / 4)
    });
  }

  function cosineZenith(lat, lon, subsolar) {
    const phi = lat * RAD;
    const delta = subsolar.latitude * RAD;
    const hour = (lon - subsolar.longitude) * RAD;
    return Math.sin(phi) * Math.sin(delta) +
      Math.cos(phi) * Math.cos(delta) * Math.cos(hour);
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      let finished = false;
      const timeout = setTimeout(() => fail(), 12000);
      const fail = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        reject(new Error('Globe image unavailable'));
      };
      img.onload = () => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        resolve(img);
      };
      img.onerror = fail;
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  }

  function pixels(img) {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(img, 0, 0, W, H);
    return ctx.getImageData(0, 0, W, H).data;
  }

  function prepareTextures() {
    if (cachedTextures) return Promise.resolve(cachedTextures);
    if (!texturePromise) {
      texturePromise = Promise.all([loadImage(DAY), loadImage(NIGHT)])
        .then(([day, night]) => {
          cachedTextures = { day: pixels(day), night: pixels(night) };
          return cachedTextures;
        })
        .catch(err => {
          texturePromise = null; // allow retry when a future page is opened
          throw err;
        });
    }
    return texturePromise;
  }

  function composeAuto(tex, at) {
    const sun = solarSubpoint(at);
    const sinD = Math.sin(sun.latitude * RAD);
    const cosD = Math.cos(sun.latitude * RAD);
    const result = document.createElement('canvas');
    result.width = W;
    result.height = H;
    const ctx = result.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    const output = ctx.createImageData(W, H);
    const dst = output.data;
    const lonCos = new Float64Array(W);
    for (let x = 0; x < W; x++) {
      const lon = (x + 0.5) / W * 360 - 180;
      lonCos[x] = Math.cos((lon - sun.longitude) * RAD);
    }
    for (let y = 0; y < H; y++) {
      const lat = 90 - (y + 0.5) / H * 180;
      const phi = lat * RAD;
      const constant = Math.sin(phi) * sinD;
      const wave = Math.cos(phi) * cosD;
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const cosine = constant + wave * lonCos[x];
        // A narrow ~9-degree twilight band: smooth, not a harsh divider.
        const t = Math.max(0, Math.min(1, (cosine + 0.08) / 0.16));
        const dayWeight = t * t * (3 - 2 * t);
        const nightWeight = 1 - dayWeight;
        dst[i] = tex.day[i] * dayWeight + tex.night[i] * nightWeight;
        dst[i + 1] = tex.day[i + 1] * dayWeight + tex.night[i + 1] * nightWeight;
        dst[i + 2] = tex.day[i + 2] * dayWeight + tex.night[i + 2] * nightWeight;
        dst[i + 3] = 255;
      }
    }
    ctx.putImageData(output, 0, 0);
    // Lossy compression reduces WebGL upload and browser memory use.
    return result.toDataURL('image/jpeg', 0.85);
  }

  function syncControls() {
    document.querySelectorAll('[data-globe-light]').forEach(button => {
      const selected = button.dataset.globeLight === currentMode;
      button.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('[data-globe-light-status]').forEach(el => {
      const english = String(document.documentElement.lang || 'es').startsWith('en');
      el.textContent = currentMode === 'auto'
        ? solarAvailable
          ? (english ? 'Approximate real-time sunlight · UTC' : 'Luz solar aproximada en tiempo real · UTC')
          : (english ? 'Automatic lighting unavailable · showing day view' : 'Iluminación automática no disponible · vista diurna')
        : currentMode === 'day'
          ? (english ? 'Day view selected' : 'Vista diurna seleccionada')
          : (english ? 'Night view selected' : 'Vista nocturna seleccionada');
    });
  }

  async function refresh() {
    const mine = ++sequence;
    syncControls();
    if (!active.size) return;
    if (currentMode !== 'auto') {
      const url = currentMode === 'night' ? NIGHT : DAY;
      active.forEach(globe => globe.globeImageUrl(url));
      return;
    }
    // Avoid a texture recomputation while the tab is in the background.
    if (document.hidden) return;
    const bucket = Math.floor(Date.now() / UPDATE_MS);
    if (lastComposite && lastBucket === bucket) {
      active.forEach(globe => globe.globeImageUrl(lastComposite));
      return;
    }
    try {
      const tex = await prepareTextures();
      if (mine !== sequence || currentMode !== 'auto') return;
      const composed = composeAuto(tex, new Date());
      if (mine !== sequence || currentMode !== 'auto') return;
      lastBucket = bucket;
      lastComposite = composed;
      solarAvailable = true;
      active.forEach(globe => globe.globeImageUrl(composed));
      syncControls();
    } catch (err) {
      if (mine !== sequence || currentMode !== 'auto') return;
      solarAvailable = false;
      active.forEach(globe => globe.globeImageUrl(DAY));
      syncControls();
    }
  }

  function setMode(mode) {
    if (!VALID.has(mode)) return false;
    currentMode = mode;
    try { window.localStorage.setItem(PREF, mode); } catch {}
    refresh();
    return true;
  }

  function register(globe) {
    if (!globe || typeof globe.globeImageUrl !== 'function') return () => {};
    active.add(globe);
    refresh();
    if (!timer) {
      timer = setInterval(() => { if (active.size) refresh(); }, UPDATE_MS);
    }
    return () => {
      active.delete(globe);
      if (!active.size && timer) { clearInterval(timer); timer = null; }
    };
  }

  function bindControls() {
    document.querySelectorAll('[data-globe-light]').forEach(button => {
      button.addEventListener('click', () => setMode(button.dataset.globeLight));
    });
    syncControls();
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && active.size && currentMode === 'auto') refresh();
  });

  return Object.freeze({
    DAY, NIGHT, solarSubpoint, cosineZenith, getMode: () => currentMode,
    setMode, register, bindControls
  });
})();
