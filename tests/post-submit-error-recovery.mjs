import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Test the REAL post-submit handler extracted from app.js, not a reimplementation.
// No browser session, no Supabase requests and no real Storage objects.
const source = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const begin = source.indexOf("    form.addEventListener('submit', async e => {", source.indexOf('function bindCreatePost()'));
const endMarker = "\n    });\n  }\n\n  /* Edit profile */";
const end = source.indexOf(endMarker, begin);
assert.ok(begin > 0 && end > begin, 'Post submit handler must be extracted from actual app.js');
const handler = source.slice(begin, end + "\n    });".length);

const A = { id: '11111111-1111-4111-8111-111111111111', accountType: 'creator' };
function makeTest({ lang='es', files=1, consent=true, type='photo', audioConsent=true, audioSource='licensed', audioAttribution='Andean Group — Song title', uploadFailureAt=null,
  submitFailure=false, cleanupDeferred=false, postCreated=true, publishingEnabled=true } = {}) {
  const activity = [];
  const notifications = [];
  const submitButton = {disabled:false, textContent:'Publicar →'};
  const inline = {hidden:true, textContent:''};
  let onSubmit = null;
  let pendingCleanupResolve = null;
  const fileInputs = Array.from({length:files},(_,i)=>({name:'synthetic'+i}));
  const state = {
    lang, createData: {type, files:fileInputs, media:[], tags:[], contentPurpose:'education'}
  };
  const form = {
    addEventListener(name,fn) { assert.equal(name,'submit'); onSubmit=fn; },
    querySelector(selector) { return selector === 'button[type="submit"]' ? submitButton : null; }
  };
  class FormDataFake {
    *[Symbol.iterator]() {
      if(consent) {
        yield ['rightsAcknowledged','on'];
        yield ['culturalAcknowledged','on'];
      }
      if(type==='video' && audioConsent) yield ['audioRightsAcknowledged','on'];
      if(type==='video') {
        yield ['audioRightsSource',audioSource];
        yield ['audioAttribution',audioAttribution];
      }
      yield ['title','The community story'];
      yield ['description','Synthetic description'];
      yield ['category','Heritage'];
      yield ['contentPurpose','education'];
      yield ['territory','Ecuador'];
      yield ['tags','Culture'];
    }
  }
  const mockApi = {
    // Enable only in synthetic tests of legacy post-commit handling.
    // The checked-in runtime defaults to disabled, and Storage/Postgres RLS
    // are the real authorization boundary.
    culturalPublishingReady:publishingEnabled,
    async upload(bucket,file,name) {
      activity.push('upload:'+name);
      if(uploadFailureAt===name) throw Error('Mock media upload failed');
      return 'https://unconfigured-staging.invalid/storage/v1/object/public/post-media/'+A.id+'/'+name+'.webp';
    },
    async createPost(payload,uid) {
      activity.push('createPost');
      assert.equal(uid,A.id);
      assert.equal(payload.rightsAcknowledged,true);
      assert.equal(payload.culturalAcknowledged,true);
      if(type==='video') {
        assert.equal(payload.audioRightsAcknowledged,true);
        assert.equal(payload.audioRightsSource,audioSource);
        assert.equal(payload.audioAttribution,audioAttribution);
      }
      if(submitFailure) throw Error('Mock connection lost during INSERT');
      return postCreated ? { id:'post-confirmed' } : null;
    },
    async removeOwnMedia(url) {
      activity.push('remove');
      if(cleanupDeferred) {
        await new Promise(resolve => {pendingCleanupResolve=resolve;});
      }
      return true;
    }
  };
  const ctx = {
    form, FormData: FormDataFake, state, me:()=>A,
    document:{getElementById:id=>id==='post-safety-error'?inline:null},
    window:{ORIGEN_API:mockApi},
    releasePreview:url=>activity.push('release'),
    showToast:t=>notifications.push(t),
    go:route=>activity.push('go:'+route),
    console:{warn:message=>activity.push('warn')},
    Promise
  };
  vm.runInNewContext(handler,ctx,{filename:'app.js post submit section'});
  assert.equal(typeof onSubmit,'function');
  const invoke=()=>onSubmit({preventDefault() {activity.push('preventDefault');}});
  return {invoke,activity,notifications,submitButton,inline,state,getCleanupResolver:()=>pendingCleanupResolve};
}

// In actual Staging the publication service is unavailable. Even a forced
// programmatic submit with complete consent cannot upload or write.
for (const lang of ['es','en']) {
  const h=makeTest({lang,publishingEnabled:false});
  await h.invoke();
  assert.ok(!h.activity.some(x=>x.startsWith('upload:')));
  assert.equal(h.activity.includes('createPost'),false);
  assert.equal(h.activity.includes('remove'),false);
  assert.equal(h.inline.hidden,false);
  assert.match(h.inline.textContent,lang==='es'?/no está disponible/:/not available yet/);
  assert.ok(h.notifications.length>0);
}

// Confirmed INSERT: submit, clear draft, go to feed; never remove uploaded media.
{
  const h=makeTest();
  await h.invoke();
  assert.ok(h.activity.includes('createPost'));
  assert.ok(h.activity.includes('go:feed'));
  assert.equal(h.activity.includes('remove'),false);
  assert.equal(h.submitButton.disabled,true);
  assert.ok(h.notifications.includes('¡Publicación creada!'));
  assert.equal(h.state.createData.files.length,0);
}

// Ambiguous outcome: uploads remain untouched, form cannot be resubmitted
// accidentally, and user gets an explicit bilingual review warning.
for (const lang of ['es','en']) {
  const h=makeTest({lang,submitFailure:true});
  await h.invoke();
  assert.equal(h.activity.includes('createPost'),true);
  assert.equal(h.activity.includes('remove'),false,
    'Once INSERT is attempted, NEVER delete media based on an ambiguous response');
  assert.equal(h.submitButton.disabled,true);
  assert.equal(h.inline.hidden,false);
  assert.match(h.inline.textContent, lang==='es' ? /Revisa tu feed/ : /Check your feed/);
  assert.ok(h.notifications.some(t=>/feed/.test(t)));
  assert.equal(h.activity.includes('go:feed'),false);
  assert.equal(h.state.createData.files.length,1,'Draft must stay intact for review');
}

// Pre-write failures: cleanup can happen, but must finish before notification.
{
  const h=makeTest({files:2,uploadFailureAt:'post-2',cleanupDeferred:true});
  let settled=false;
  const promise=h.invoke().then(()=>{settled=true;});
  for(let i=0;i<12 && !h.getCleanupResolver();i++) await new Promise(resolve=>setImmediate(resolve));
  assert.ok(h.getCleanupResolver(),'Cleanup should begin for unattached media');
  assert.equal(settled,false,'Cleanup must be awaited');
  assert.equal(h.notifications.length,0,'No early success/failure notification before cleanup');
  h.getCleanupResolver()();
  await promise;
  assert.equal(h.activity.includes('createPost'),false);
  assert.equal(h.activity.filter(x=>x==='remove').length,1);
  assert.equal(h.submitButton.disabled,false,'Safe-to-retry upload failures reopen the form');
  assert.ok(h.notifications.some(t=>/Mock media upload failed/.test(t)));
}

// Mandatory explicit rights acknowledgements block uploads before any DB write.
{
  const h=makeTest({consent:false});
  await h.invoke();
  assert.equal(h.activity.some(x=>x.startsWith('upload:')),false);
  assert.equal(h.activity.includes('createPost'),false);
  assert.equal(h.activity.includes('remove'),false);
}

// A video with missing audio declaration or incomplete source/credit is rejected before upload.
for (const options of [
  {type:'video',audioConsent:false},
  {type:'video',audioSource:''},
  {type:'video',audioAttribution:''}
]) {
  const h=makeTest(options);
  await h.invoke();
  assert.equal(h.activity.some(x=>x.startsWith('upload:')),false);
  assert.equal(h.activity.includes('createPost'),false);
  assert.equal(h.activity.includes('remove'),false);
  assert.equal(h.inline.hidden,false);
}
// Video audio rights declaration is included in the post only after validation.
{
  const h=makeTest({type:'video'});
  await h.invoke();
  assert.ok(h.activity.includes('createPost'));
  assert.ok(h.activity.includes('go:feed'));
}

console.log('PASS Ambiguous cultural-post INSERT preserves uploaded media and disables unsafe retry.');
console.log('PASS Pre-INSERT upload failure awaits orphan media cleanup before notifying.');
console.log('PASS Real submit-handler test confirms successful posts and strict cultural attestations.');
console.log('PASS Offline synthetic mocks; no users, APIs, storage deletion or paid services.');
