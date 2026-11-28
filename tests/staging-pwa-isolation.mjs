import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Test the actual PWA registration branch in app.js, without running the app.
// This does not touch Cloudflare, any user session or browser CacheStorage.
const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const start = app.lastIndexOf("  if ('serviceWorker' in navigator && location.protocol !== 'file:')");
const end = app.lastIndexOf('\n})();');
assert.ok(start > 0 && end > start, 'Locate the actual PWA boot branch');
const code = app.slice(start, end);

async function exercise(config, protocol = 'https:', withCache = true) {
  const calls = [];
  let loaded = null;
  const registrations = [
    { unregister: async () => { calls.push('unregister:root'); return true; } },
    { unregister: async () => { calls.push('unregister:old'); return true; } }
  ];
  const sw = {
    getRegistrations: async () => {
      calls.push('enumerate-registrations');
      return registrations;
    },
    register: async name => {
      calls.push('register:' + name);
      return {};
    }
  };
  const window = {
    ORIGEN_CONFIG: config,
    addEventListener(type, callback) {
      assert.equal(type, 'load');
      loaded = callback;
    }
  };
  if (withCache) window.caches = {
    keys: async () => ['origen-cultural-v7', 'other-application', 'origen-cultural-v8'],
    delete: async key => { calls.push('cache-delete:' + key); return true; }
  };
  vm.runInNewContext('(function(){\n' + code + '\n})()', {
    window, navigator: {serviceWorker: sw}, location: {protocol},
    Promise, console: {warn: m => calls.push('warning:' + m)}
  }, {filename:'app.js service-worker startup'});
  if (loaded) loaded();
  // The actual production code intentionally uses asynchronous browser APIs.
  await new Promise(resolve => setImmediate(resolve));
  return {calls, hasLoadListener: Boolean(loaded)};
}

{
  const { calls, hasLoadListener } = await exercise({disableServiceWorker:true});
  assert.equal(hasLoadListener,true);
  assert.ok(!calls.some(x=>x.startsWith('register:')), 'Protected Staging must never register a new PWA worker');
  assert.ok(calls.includes('enumerate-registrations'));
  assert.ok(calls.includes('unregister:root'));
  assert.ok(calls.includes('unregister:old'));
  assert.ok(calls.includes('cache-delete:origen-cultural-v7'));
  assert.ok(calls.includes('cache-delete:origen-cultural-v8'));
  assert.ok(!calls.includes('cache-delete:other-application'), 'Never clear unrelated app cache');
}
{
  const {calls} = await exercise({disableServiceWorker:true}, 'https:', false);
  assert.ok(calls.includes('unregister:root'),'Private build still unregisters workers when CacheStorage is unavailable');
  assert.ok(!calls.some(x=>x.startsWith('register:')));
}
for (const config of [{}, {disableServiceWorker:false}, undefined]) {
  const {calls} = await exercise(config);
  assert.ok(calls.includes('register:service-worker.js'),
    'Normal public/local source must keep opt-in PWA operation unchanged');
  assert.ok(!calls.includes('enumerate-registrations'));
  assert.equal(calls.some(x=>x.startsWith('cache-delete:')),false);
}
{
  const {calls,hasLoadListener} = await exercise({disableServiceWorker:true},'file:');
  assert.equal(hasLoadListener,false);
  assert.deepEqual(calls,[]);
}
console.log('PASS Access-controlled ORIGEN staging unregisters old PWA workers and deletes only its offline caches.');
console.log('PASS Public/local PWA behaviour remains unchanged; no browser, network or service used.');
