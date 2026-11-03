// Deterministic, offline tests for ORIGEN solar day/night calculations.
// Does NOT load images, open a browser, use GPS or make network requests.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../solar-globe.js', import.meta.url), 'utf8');
const saved = new Map();
const fakeDocument = { addEventListener() {}, querySelectorAll() { return []; }, hidden: false };
const sandbox = {
  window: { localStorage: {
    getItem(key) { return saved.get(key) ?? null; },
    setItem(key, val) { saved.set(key, val); }
  }},
  document: fakeDocument,
  Image: class {},
  Math, Date, Set, Number, Object, String, Promise,
  setTimeout, clearTimeout, setInterval, clearInterval
};
vm.runInNewContext(source, sandbox, { filename: 'solar-globe.js' });
const cycle = sandbox.window.OrigenSolarGlobe;
assert.ok(cycle && typeof cycle.solarSubpoint === 'function');
const near = (value, target, tolerance) => Math.abs(value - target) <= tolerance;

const springNoon = cycle.solarSubpoint('2026-03-20T12:00:00Z');
assert.ok(near(springNoon.latitude, 0, 3), 'March equinox Sun should be near equator');
assert.ok(near(springNoon.longitude, 0, 9), 'Noon UTC Sun should be near Greenwich');
assert.ok(cycle.cosineZenith(0, springNoon.longitude, springNoon) > 0.98,
  'Near-solar-noon equator must be bright at equinox');
assert.ok(cycle.cosineZenith(0, springNoon.longitude + 180, springNoon) < -0.98,
  'Antipode must be dark at equinox');

const winterNoon = cycle.solarSubpoint('2026-12-21T12:00:00Z');
assert.ok(near(winterNoon.latitude, -23.44, 3), 'December solstice Sun should be south');
const summerNoon = cycle.solarSubpoint('2026-06-21T12:00:00Z');
assert.ok(near(summerNoon.latitude, 23.44, 3), 'June solstice Sun should be north');

const midnight = cycle.solarSubpoint('2026-03-20T00:00:00Z');
assert.ok(Math.abs(midnight.longitude) > 170, 'Midnight UTC Sun should face opposite meridian');
assert.throws(() => cycle.solarSubpoint('not-a-date'), /Invalid solar date/);

assert.equal(cycle.getMode(), 'auto');
assert.equal(cycle.setMode('night'), true);
assert.equal(cycle.getMode(), 'night');
assert.equal(saved.get('origen-globe-illumination'), 'night');
assert.equal(cycle.setMode('day'), true);
assert.equal(cycle.getMode(), 'day');
assert.equal(cycle.setMode('auto'), true);
assert.equal(cycle.setMode('unknown'), false, 'Unknown modes must not be accepted');
assert.equal(cycle.getMode(), 'auto');

assert.ok(source.includes('cdn.jsdelivr.net/npm/three-globe@2.45.3/'),
  'Globe textures must come from pinned CDN examples');
assert.ok(!/navigator\.geolocation|geolocation\.getCurrentPosition|watchPosition/.test(source),
  'Day/night lighting must never request visitor location');
console.log('PASS — ORIGEN sunrise/terminator UTC geometry, opt-in modes and no geolocation.');
