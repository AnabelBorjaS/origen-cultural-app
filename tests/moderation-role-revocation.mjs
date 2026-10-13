import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Execute the real async Auth event callback from app.js using synthetic
// session roles and slow fake profile refreshes. No network or real users.
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const start=app.lastIndexOf("  window.addEventListener('origen-auth-change', async () => {");
const end=app.indexOf("\n  initDeletePostDialog();",start);
assert.ok(start>0&&end>start,'Cannot find the real ORIGEN Auth refresh callback');
const callbackSource=app.slice(start,end);
const UID='11111111-1111-4111-8111-111111111111';

function setup(current,next,slowRefresh=false) {
  const events={};
  const calls=[];
  let unblock;
  const task=slowRefresh
    ? new Promise(resolve=>{unblock=resolve;})
    : Promise.resolve();
  const state={user:current,authReady:true};
  let dom=current?.role==='admin'?'PRIVATE-REPORT-CONTENT':'ordinary';
  const fakeApi={
    restoreSession:async()=>next,
    ensureCreatorCulturalProfile:()=>task,
    listCulturalProfiles:()=>task,
    listPublicProfiles:()=>task,
    myFollows:()=>task,
    myFavorites:()=>task,
    listPosts:()=>task,
    loadPostInteractions:()=>task
  };
  const ctx={
    state,
    window:{ORIGEN_API:fakeApi,addEventListener:(type,fn)=>events[type]=fn},
    Promise,
    console:{error:(...args)=>calls.push('unexpected-error:'+args.join(' '))},
    clearAccountDrafts:()=>calls.push('clear-drafts'),
    currentRoute:()=> 'moderacion',
    render:(_route,scroll)=>{
      calls.push('rerender:'+String(scroll));
      dom=state.user?.role==='admin'?'PRIVATE-REPORT-CONTENT':'RESTRICTED';
    },
    go:(route)=>{
      calls.push('navigate:'+route);
      dom='PUBLIC-HOME';
    },
    updateShell:()=>calls.push('update-shell')
  };
  const program='(function(){ let authUiGeneration=0;\n'+callbackSource+'\n})()';
  vm.runInNewContext(program,ctx,{filename:'app.js auth listener'});
  assert.equal(typeof events['origen-auth-change'],'function');
  return {run:()=>events['origen-auth-change'](),state,calls,readDOM:()=>dom,unblock};
}

{
  const t=setup({id:UID,role:'admin'},{id:UID,role:'explorer'},true);
  const running=t.run();
  await Promise.resolve();
  // Clear sensitive data BEFORE the delayed network/cache tasks settle.
  assert.equal(t.readDOM(),'RESTRICTED','Same-user admin revocation must immediately erase report DOM');
  assert.ok(t.calls.includes('rerender:false'));
  assert.ok(t.calls.includes('clear-drafts'),'Changing role must clear private account drafts');
  t.unblock();
  await running;
  assert.equal(t.readDOM(),'RESTRICTED');
}
{
  const t=setup({id:UID,role:'explorer'},{id:UID,role:'admin'});
  await t.run();
  assert.equal(t.readDOM(),'PRIVATE-REPORT-CONTENT','Role gain can mount permitted admin view');
  assert.ok(t.calls.includes('rerender:false'));
}
{
  const t=setup({id:UID,role:'admin'},{id:UID,role:'admin'});
  await t.run();
  assert.equal(t.calls.some(x=>x.startsWith('rerender')),false,
    'Unchanged role should not duplicate private inbox reads');
  assert.ok(t.calls.includes('update-shell'));
}
{
  const t=setup({id:UID,role:'admin'},null);
  await t.run();
  assert.equal(t.readDOM(),'PUBLIC-HOME','Sign-out still navigates away');
  assert.ok(t.calls.includes('clear-drafts'));
}
console.log('PASS Same-user admin role revocation immediately destroys sensitive moderation DOM.');
console.log('PASS Slow refresh, promotion, unchanged role and sign-out remain isolated.');
console.log('PASS Real Auth callback, fake sessions only, no network or backend changes.');
