import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the real browser client with a synthetic Storage backend only.
// No Auth users, network traffic, object writes or public deployments.
const source=fs.readFileSync(new URL('../supabase-client.js',import.meta.url),'utf8');
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
class SyntheticFile { constructor(type,size){this.type=type;this.size=size;} }
const uploads=[], publicReads=[], removals=[];
let storageError=null, removalData=true, serial=0;
const storage={
  from(bucket){return {
    async upload(path,file,options){
      uploads.push({bucket,path,file,options});
      return {data:storageError?null:{path},error:storageError};
    },
    getPublicUrl(path){
      publicReads.push({bucket,path});
      return {data:{publicUrl:'https://unconfigured-staging.invalid/storage/v1/object/public/'+bucket+'/'+path}};
    },
    async remove(paths){
      removals.push({bucket,paths});
      return {data:removalData?paths.map(name=>({name})):[],error:null};
    }
  };}
};
const client={auth:{onAuthStateChange(){}},storage};
function runtime(crypto){
  const window={
    supabase:{createClient:()=>client},
    location:{href:'https://origen-cultural-staging.pages.dev/'},
    dispatchEvent(){}
  };
  if(crypto)window.crypto=crypto;
  class Clock extends Date { static now(){return 1770000000000;} }
  vm.runInNewContext(source,{window,File:SyntheticFile,URL,Date:Clock,console},{
    filename:'supabase-client.js'});
  return window.ORIGEN_API;
}
const api=runtime({randomUUID:()=>
  `00000000-0000-4000-8000-${(++serial).toString(16).padStart(12,'0')}`});
const pic=new SyntheticFile('image/webp',1024);
const clip=new SyntheticFile('video/mp4',1024*1024);

await assert.rejects(api.upload('post-media-intake',pic,'photo'),/iniciar sesión/);
api.cache.session={user:{id:A}};
await assert.rejects(api.upload('post-media',pic,'blocked'),/pausada hasta su revisión segura/);
await assert.rejects(api.upload('post-media-intake',pic,'no-profile'),/Agente Cultural autorizado/);
api.cache.profile={id:A,role:'explorer'};
await assert.rejects(api.upload('post-media-intake',pic,'explorer'),/Agente Cultural autorizado/);
api.cache.profile={id:B,role:'creator'};
await assert.rejects(api.upload('post-media-intake',pic,'other-creator'),/Agente Cultural autorizado/);
assert.equal(uploads.length,0,'Browser cannot bypass creator gate to public or private media');
api.cache.profile={id:A,role:'creator'};

const first=await api.upload('post-media-intake',pic,'post-1');
const duplicate=await api.upload('post-media-intake',pic,'post-1');
assert.equal(first.kind,'private-media-intake');
assert.equal(first.bucket,'post-media-intake');
assert.equal(first.ownerId,A);
assert.ok(Object.isFrozen(first));
assert.notEqual(first.path,duplicate.path,'Same-millisecond file paths must be unique');
assert.equal(serial,2);
assert.match(first.path,new RegExp('^'+A+'/1770000000000-[a-f0-9]{32}-post-1\\.webp$'));
assert.equal(publicReads.length,0,'Private media must NEVER create/get public URLs');
assert.equal(uploads[0].options.upsert,false);
assert.equal(uploads[0].options.cacheControl,'60');
assert.equal(uploads[0].options.contentType,'image/webp');
const video=await api.upload('post-media-intake',clip,'video');
assert.ok(video.path.endsWith('.mp4'));
assert.equal(publicReads.length,0);

const avatar=await api.upload('avatars',pic,'avatar');
const cover=await api.upload('covers',pic,'cover');
assert.ok(avatar.includes('/avatars/'+A+'/'));
assert.ok(cover.includes('/covers/'+A+'/'));
assert.equal(publicReads.length,2,'Only avatars and covers may return a public URL');
assert.equal(uploads.at(-2).options.cacheControl,'3600');
assert.equal(uploads.at(-1).options.cacheControl,'3600');

const before=uploads.length;
for(const [bucket,file] of [
  ['post-media-intake',new SyntheticFile('image/jpeg',0)],
  ['post-media-intake',new SyntheticFile('application/pdf',1024)],
  ['post-media-intake',new SyntheticFile('video/mp4',51*1024*1024)],
  ['avatars',clip],['not-a-bucket',pic]
]) {
  await assert.rejects(api.upload(bucket,file,'bad'),/no permitido|límite|Formato|Destino|archivo/i);
  assert.equal(uploads.length,before);
}
storageError=Error('Synthetic Storage failure');
await assert.rejects(api.upload('post-media-intake',pic,'failure'),/Synthetic Storage failure/);
assert.equal(publicReads.length,2);
storageError=null;

assert.equal(await api.discardPrivateMedia(first),true);
assert.equal(removals.at(-1).bucket,'post-media-intake');
assert.equal(removals.at(-1).paths[0],first.path);
const removedCount=removals.length;
for(const bad of [null,{},avatar,
  {...JSON.parse(JSON.stringify(first)),bucket:'post-media'},
  {...JSON.parse(JSON.stringify(first)),path:B+'/'+first.path.split('/')[1]},
  {...JSON.parse(JSON.stringify(first)),path:A+'/../image.webp'},
  {...JSON.parse(JSON.stringify(first)),path:A+'/not-a-safe-path'}
]) {
  assert.equal(await api.discardPrivateMedia(bad),false);
}
assert.equal(removals.length,removedCount,'Forged cleanup requests never reach Storage');
api.cache.session={user:{id:B}};
assert.equal(await api.discardPrivateMedia(first),false,'Another account cannot remove A intake');
assert.equal(removals.length,removedCount);
api.cache.session={user:{id:A}};
removalData=false;
assert.equal(await api.discardPrivateMedia(first),false,'Empty Storage remove response does not prove deletion');
removalData=true;

const noCrypto=runtime(null);
noCrypto.cache.session={user:{id:A}};
noCrypto.cache.profile={id:A,role:'creator'};
const beforeNoCrypto=uploads.length;
await assert.rejects(noCrypto.upload('post-media-intake',pic,'no-crypto'),
  /HTTPS y un navegador actualizado/);
assert.equal(uploads.length,beforeNoCrypto);
const fallback=runtime({getRandomValues(array){array.fill(0xa5);return array;}});
fallback.cache.session={user:{id:A}};
fallback.cache.profile={id:A,role:'creator'};
const oldBrowser=await fallback.upload('post-media-intake',pic,'fallback');
assert.match(oldBrowser.path,/-(?:a5){16}-fallback\.webp$/);
assert.equal(publicReads.length,2);

console.log('PASS Cultural media uploads only to private creator-owned intake, never public post-media.');
console.log('PASS Private receipts cannot expose public URLs; owner-only cleanup rejects forged or incomplete results.');
console.log('PASS Existing avatar/cover URLs, MIME limits, cryptographic paths and account isolation preserved.');
