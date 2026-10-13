import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the actual browser client's upload() with mocked Storage.
// Never upload real media, create users, or contact Supabase.
const source=fs.readFileSync(new URL('../supabase-client.js',import.meta.url),'utf8');
const A='11111111-1111-4111-8111-111111111111';
class SyntheticFile {
  constructor(type,size) { this.type=type;this.size=size; }
}
const uploads=[];
const urls=[];
let storageError=null;
const storage={
  from(bucket) {
    return {
      async upload(path,file,options) {
        uploads.push({bucket,path,file,options});
        return {data:storageError?null:{path},error:storageError};
      },
      getPublicUrl(path) {
        urls.push({bucket,path});
        return {data:{publicUrl:'https://unconfigured-staging.invalid/storage/v1/object/public/'+bucket+'/'+path}};
      }
    };
  }
};
const client={
  auth:{onAuthStateChange(){}},
  storage
};
const window={
  supabase:{createClient:()=>client},
  location:{href:'https://origen-cultural-staging.pages.dev/'},
  dispatchEvent(){}
};
vm.runInNewContext(source,{window,File:SyntheticFile,URL,console},{filename:'supabase-client.js'});
const api=window.ORIGEN_API;
const pic=new SyntheticFile('image/webp',1024);
const clip=new SyntheticFile('video/mp4',1024*1024);

await assert.rejects(api.upload('post-media',pic,'photo'),/iniciar sesión/);
assert.equal(uploads.length,0);
api.cache.session={user:{id:A}};

const first=await api.upload('post-media',pic,'post-1');
assert.ok(first.includes('/post-media/'+A+'/'), 'Path must remain under the authenticated uploader');
assert.equal(uploads.at(-1).options.cacheControl,'60', 'Cultural photos need shorter browser cache TTL');
assert.equal(uploads.at(-1).options.upsert,false, 'Never overwrite a cultural object');
assert.equal(uploads.at(-1).options.contentType,'image/webp');

const second=await api.upload('post-media',clip,'post-2');
assert.ok(second.endsWith('.mp4'));
assert.equal(uploads.at(-1).options.cacheControl,'60', 'Cultural video cache must also be short');

await api.upload('avatars',pic,'profile');
assert.equal(uploads.at(-1).options.cacheControl,'3600', 'Only cultural posts have reduced cache TTL');
await api.upload('covers',pic,'cover');
assert.equal(uploads.at(-1).options.cacheControl,'3600');

const already=uploads.length;
for(const [bucket,file] of [
  ['post-media',new SyntheticFile('image/jpeg',0)],
  ['post-media',new SyntheticFile('application/pdf',1024)],
  ['post-media',new SyntheticFile('video/mp4',51*1024*1024)],
  ['avatars',clip],
  ['unknown-bucket',pic]
]) {
  await assert.rejects(api.upload(bucket,file,'unsafe'),/no permitido|límite permitido|límite|Formato|Destino|archivo/i);
  assert.equal(uploads.length,already,'Invalid file must be refused before Storage request');
}
storageError=new Error('Synthetic Storage failure');
await assert.rejects(api.upload('post-media',pic,'failure'),/Synthetic Storage failure/);
assert.equal(urls.length,already,'Storage failure must not manufacture a public URL');

console.log('PASS Cultural photos and videos use a 60-second browser cache TTL.');
console.log('PASS Profile media retains a one-hour TTL and uploads never overwrite objects.');
console.log('PASS Invalid uploads and Storage errors fail closed without real network requests.');
