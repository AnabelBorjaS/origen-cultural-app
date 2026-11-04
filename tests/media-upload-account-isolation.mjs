import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Synthetic uploads only: test the actual browser client while Storage is
// delayed. No Auth users, live API calls, Supabase writes or private media.
const source=fs.readFileSync(new URL('../supabase-client.js',import.meta.url),'utf8');
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const warning=[];
const pending=[];
const reads=[];
const uploads=[];
class FakeFile {
  constructor(){this.type='image/webp';this.size=1024;}
}
const storage={
  from(bucket){
    return {
      upload(path,file,options){
        uploads.push({bucket,path,options});
        return new Promise(resolve=>pending.push(resolve));
      },
      getPublicUrl(path){
        reads.push(path);
        return {data:{publicUrl:'https://unconfigured-staging.invalid/storage/v1/object/public/'+bucket+'/'+path}};
      }
    };
  }
};
let serial=0;
const window={
  supabase:{createClient:()=>({auth:{onAuthStateChange(){}},storage})},
  crypto:{randomUUID:()=>`00000000-0000-4000-8000-${(++serial).toString(16).padStart(12,'0')}`},
  location:{href:'https://origen-cultural-staging.pages.dev'},
  dispatchEvent(){}
};
vm.runInNewContext(source,{window,File:FakeFile,URL,console:{warn:v=>warning.push(v)}});
const api=window.ORIGEN_API;
const photo=new FakeFile();
api.cache.session={user:{id:A}};
api.cache.profile={id:A,role:'creator'};

// The object may have been written by the first account, but the new account
// must not receive a usable URL or any false claim of Storage deletion.
const stale=api.upload('post-media-intake',photo,'switch');
assert.equal(uploads.length,1);
assert.equal(uploads[0].path.startsWith(A+'/'),true);
api.cache.session={user:{id:B}};
api.cache.profile={id:B,role:'creator'};
pending.shift()({data:{path:uploads[0].path},error:null});
await assert.rejects(stale,/sesión cambió durante la subida/i);
assert.equal(reads.length,0,'No old-account media URL may be returned after switching');
assert.equal(warning.length,1,'Potential orphan must be acknowledged, not declared deleted');
assert.ok(!warning[0].includes(A),'Avoid exposing account identifiers in logs');

// Sign-out during the upload has the same fail-closed behavior.
api.cache.session={user:{id:A}};
api.cache.profile={id:A,role:'creator'};
const signOut=api.upload('post-media-intake',photo,'logout');
assert.equal(uploads.length,2);
api.cache.session=null;
pending.shift()({data:{path:uploads[1].path},error:null});
await assert.rejects(signOut,/sesión cambió durante la subida/i);
assert.equal(reads.length,0);
assert.equal(warning.length,2);

// Normal session remains supported, with a unique, owner-scoped object path.
api.cache.session={user:{id:B}};
api.cache.profile={id:B,role:'creator'};
const normal=api.upload('post-media-intake',photo,'safe');
assert.equal(uploads.length,3);
assert.equal(uploads[2].path.startsWith(B+'/'),true);
pending.shift()({data:{path:uploads[2].path},error:null});
const receipt=await normal;
assert.equal(receipt.kind,'private-media-intake');
assert.equal(receipt.bucket,'post-media-intake');
assert.equal(receipt.ownerId,B);
assert.equal(receipt.path,uploads[2].path);
assert.equal(reads.length,0,'Even successful private uploads must not expose public URLs');
assert.equal(warning.length,2);
assert.equal(uploads[2].options.upsert,false);
assert.equal(uploads[2].options.cacheControl,'60');

console.log('PASS Switching accounts or signing out during a media upload never hands a stale URL to the new session.');
console.log('PASS Possible private Storage orphan is acknowledged without fictitious cleanup.');
console.log('PASS Same-account private upload returns an opaque receipt, never a public URL.');
