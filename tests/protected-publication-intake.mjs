import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  preparePrivatePublicationSubmission,bindPrivateSubmissionOwner
} from '../server/private-publication-contract.mjs';
import {createProtectedPublicationIntake} from '../server/protected-publication-intake.mjs';

// All accounts, file paths, tokens, statuses and database adapters are fake.
// No HTTP endpoint, real JWT, Supabase write, bucket promotion, public media,
// account creation or database permissions are exercised.
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const REQUEST='33333333-3333-4333-8333-333333333333';
const ITEM='44444444-4444-4444-8444-444444444444';
const auth='Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.synthetic';
const privatePath=user=>user+'/1770000000000-a'.repeat(0);
const image=A+'/1770000000000-'+('a'.repeat(32))+'-weaving.webp';
const image2=A+'/1770000000001-'+('b'.repeat(32))+'-heritage.jpg';
const clip=A+'/1770000000002-'+('c'.repeat(32))+'-community.mp4';
const base=()=>({
  idempotency_key:REQUEST,
  title:'Historia del tejido',
  description:'Una historia cultural compartida con autorización comunitaria.',
  type:'photo',
  media_paths:[image],
  contentPurpose:'heritage',
  category:'Artesanía tradicional',
  territory:'Quito',
  tags:['tejido','memoria'],
  cultural_profile_id:null,
  rightsAcknowledged:true,
  culturalAcknowledged:true
});

const prepared=preparePrivatePublicationSubmission(base());
assert.ok(Object.isFrozen(prepared)&&Object.isFrozen(prepared.media_paths));
assert.ok(Object.isFrozen(prepared.tags));
assert.deepEqual(prepared.media_paths,[image]);
assert.equal(bindPrivateSubmissionOwner(prepared,A).owner_id,A);
assert.throws(()=>bindPrivateSubmissionOwner(prepared,B),/another account/);
assert.throws(()=>bindPrivateSubmissionOwner(Object.freeze({...prepared}),A),/validated submission/);
assert.equal(preparePrivatePublicationSubmission({...base(),type:'video',media_paths:[clip]}).type,'video');
assert.equal(preparePrivatePublicationSubmission({...base(),type:'carousel',media_paths:[image,image2]}).media_paths.length,2);

let passed=0;
const reject=(input,pattern)=>{
  assert.throws(()=>preparePrivatePublicationSubmission(input),pattern);
  passed++;
};
for(const [modify,pattern] of [
  [{author_id:A},/Unsupported publication field/],
  [{owner_id:A},/Unsupported publication field/],
  [{bucket:'post-media'},/Unsupported publication field/],
  [{media_urls:['https://evil.example']},/Unsupported publication field/],
  [{is_published:true},/Unsupported publication field/],
  [{status:'published'},/Unsupported publication field/],
  [{rights_statement_version:'v900'},/Unsupported publication field/],
  [{approved_by:A},/Unsupported publication field/],
  [{rightsAcknowledged:'true'},/both cultural and content rights/i],
  [{culturalAcknowledged:false},/both cultural and content rights/i],
  [{idempotency_key:'bad'},/idempotency UUID/],
  [{type:'text'},/Unsupported cultural post type/],
  [{contentPurpose:'advertising'},/Unsupported cultural purpose/],
  [{title:'A'},/Title/],
  [{description:'tiny'},/Description/],
  [{description:'a'.repeat(5001)},/Description/],
  [{tags:['same','Same']},/Duplicate tags/],
  [{tags:Array(11).fill('x')},/small array/],
  [{media_paths:[]},/Between one and ten/],
  [{media_paths:[image,image]},/cannot appear twice/],
  [{media_paths:['https://example.com/'+image]},/Invalid private media/],
  [{media_paths:['post-media/'+image]},/Invalid private media/],
  [{media_paths:['post-media-intake/'+image]},/Invalid private media/],
  [{media_paths:[A+'/../evil.webp']},/Invalid private media/],
  [{media_paths:[A+'/%2e%2e/file.webp']},/Invalid private media/],
  [{media_paths:[A+'/1770000000000-'+('a'.repeat(32))+'-story.webp?token=x']},/Invalid private media/],
  [{media_paths:[A+'/1770000000000-'+('a'.repeat(32))+'-story.svg']},/Invalid private media/],
  [{media_paths:[A+'/1770000000000-'+('a'.repeat(32))+'-story.exe']},/Invalid private media/],
  [{media_paths:[image2],type:'video'},/Video posts/],
  [{media_paths:[clip],type:'photo'},/Photo posts/],
  [{media_paths:[image],type:'carousel'},/Carousels/],
  [{media_paths:[image,clip],type:'carousel'},/Carousels/],
  [{media_paths:[image,image2],type:'photo'},/Photo posts/],
  [{cultural_profile_id:'incorrect'},/cultural profile/]
]) reject({...base(),...modify},pattern);
reject(null,/plain object/);
reject([],/plain object/);
reject(Object.assign(Object.create(null),base()),/plain object/);

const calls={auth:0,record:0};
const records=new Map();
let authenticated=A,anonymous=false,creator=true,failDb=false;
const boundary=createProtectedPublicationIntake({
  async verifyAccessToken(token){
    calls.auth++;
    assert.ok(token.startsWith('eyJhb'));
    return authenticated ? {id:authenticated,is_anonymous:anonymous} : null;
  },
  async recordPendingIfTrustedCreator({userId,request}){
    calls.record++;
    assert.equal(userId,A);
    assert.equal(request.owner_id,A);
    assert.equal(request.rightsAcknowledged,true);
    assert.equal(request.culturalAcknowledged,true);
    assert.ok(request.media_paths.every(path=>path.startsWith(A+'/')));
    if(failDb)throw Error('private reviewer secret / data');
    if(!creator)throw Error('revoked live role');
    if(!records.has(request.idempotency_key))records.set(request.idempotency_key,ITEM);
    return {recorded:true,requestId:records.get(request.idempotency_key),
      state:'pending_review',replayed:calls.record>1};
  }
});
const accepted=await boundary.submit({authorization:auth,submission:base()});
assert.deepEqual(accepted,{accepted:true,requestId:ITEM,state:'pending_review',replayed:false});
assert.ok(Object.isFrozen(accepted));
assert.ok(!Object.keys(accepted).includes('media_paths'));
assert.ok(!Object.keys(accepted).includes('published'));
const replay=await boundary.submit({authorization:auth,submission:base()});
assert.equal(replay.requestId,accepted.requestId);
assert.equal(replay.replayed,true);
assert.equal(records.size,1,'Idempotent submission must not create a duplicate record');

const before=calls.auth;
await assert.rejects(boundary.submit({authorization:auth,submission:{...base(),status:'published'}}),
  /Unsupported publication field/);
assert.equal(calls.auth,before,'Reject malicious fields before verification or storage');
await assert.rejects(boundary.submit({authorization:'Bearer an-opaque-token',submission:base()}),
  /Authenticated cultural agent/);
await assert.rejects(boundary.submit({authorization:'Basic bad',submission:base()}),
  /Authenticated cultural agent/);
await assert.rejects(boundary.submit({authorization:auth,submission:{...base(),media_paths:[
  B+'/1770000000000-'+('a'.repeat(32))+'-weaving.webp']}}),/another account/);
assert.equal(calls.record,2,'Cross-account media must never reach trusted publication backend');
anonymous=true;
await assert.rejects(boundary.submit({authorization:auth,submission:base()}),
  /Authenticated cultural agent/);
anonymous=false;
authenticated=null;
await assert.rejects(boundary.submit({authorization:auth,submission:base()}),
  /Authenticated cultural agent/);
authenticated=A;
creator=false;
await assert.rejects(boundary.submit({authorization:auth,submission:base()}),
  /Unable to record private cultural review request/);
creator=true;
failDb=true;
await assert.rejects(boundary.submit({authorization:auth,submission:base()}),
  /Unable to record private cultural review request/);
failDb=false;
const incomplete=createProtectedPublicationIntake({
  verifyAccessToken:async()=>({id:A}),
  recordPendingIfTrustedCreator:async()=>({recorded:true,requestId:ITEM,state:'published',replayed:false})
});
await assert.rejects(incomplete.submit({authorization:auth,submission:base()}),
  /Unable to record private cultural review request/);
assert.throws(()=>createProtectedPublicationIntake({verifyAccessToken:async()=>({id:A})}),
  /Trusted authentication/);

// Deployment guard: these files are not exposed through the static builder,
// and there is no process env, HTTP listener, privileged key, or Storage copy.
const serverSrc=fs.readFileSync(new URL('../server/protected-publication-intake.mjs',import.meta.url),'utf8');
assert.ok(!/Deno\.serve|createClient\(|\.copy\(|getPublicUrl\(|listen\(/.test(serverSrc));
assert.ok(!/service_role|sb_secret_|SUPABASE_SERVICE_ROLE_KEY/.test(serverSrc.replace(/^\s*\/\/.*$/gm,'')));
console.log('PASS '+passed+' malformed, cross-owner and privilege-field submissions rejected.');
console.log('PASS JWT-shaped bearer required; verified owner and pending-only server adapter boundary.');
console.log('PASS Replay is idempotent; reviewer/backend failures never disclose protected details.');
console.log('PASS No public post, Storage copy, credential or deployed handler was created.');
