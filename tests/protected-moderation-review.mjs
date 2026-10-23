import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createProtectedReviewBoundary } from '../server/protected-moderation-review.mjs';

const reviewer='11111111-1111-4111-8111-111111111111';
const report='22222222-2222-4222-8222-222222222222';
const requestKey='33333333-3333-4333-8333-333333333333';
const event='44444444-4444-4444-8444-444444444444';
const signedToken='aaa.bbb.ccc'; // Synthetic placeholder; NOT an actual JWT.
const clean={
  report_id:report, idempotency_key:requestKey,
  event_kind:'review_started',
  rationale:'Review requested for potential cultural rights concern.'
};
let authCalls=0, writeCalls=0, inputToken='', stored=null;
let user={id:reviewer,is_anonymous:false};
let recordResponse={recorded:true,eventId:event};
let authFailure=false, writeFailure=false;
const boundary=createProtectedReviewBoundary({
  async verifyAccessToken(token){
    authCalls++;inputToken=token;
    if(authFailure) throw new Error('confidential auth error with token');
    return user;
  },
  async recordIfActiveAdmin(data){
    writeCalls++;stored=data;
    if(writeFailure) throw new Error('sensitive database contents');
    return recordResponse;
  }
});
assert.throws(()=>createProtectedReviewBoundary({}),/mandatory/i);
const success=await boundary.record({
  authorization:'Bearer '+signedToken, submission:clean
});
assert.deepEqual(success,{recorded:true,eventId:event});
assert.ok(Object.isFrozen(success));
assert.equal(authCalls,1);
assert.equal(writeCalls,1);
assert.equal(inputToken,signedToken);
assert.equal(stored.reviewerId,reviewer);
assert.deepEqual(stored.recommendation,clean);
assert.ok(!('authorization' in stored));
assert.ok(!('role' in stored));
assert.ok(!('reporter_user_id' in stored));
assert.ok(!('is_published' in stored));

const oldAuth=authCalls,oldWrites=writeCalls;
for(const invalid of [
  {...clean,reviewer_user_id:reviewer},
  {...clean,reporter_user_id:reviewer},
  {...clean,status:'resolved'},
  {...clean,delete_post:true},
  {...clean,storage_path:'post-media/a/secret'},
  {...clean,event_kind:'ban_user'},
  {...clean,rationale:'too short'},
  {...clean,report_id:'not-a-real-uuid'},
  {...clean,idempotency_key:'bad'}
]) {
  await assert.rejects(boundary.record({authorization:'Bearer '+signedToken,submission:invalid}));
}
assert.equal(authCalls,oldAuth, 'Malformed payloads rejected before any JWT call');
assert.equal(writeCalls,oldWrites, 'Malformed payloads rejected before any DB call');

for(const authorization of [
  undefined, null, '', 'Basic aaaa', 'Bearer ', 'Bearer malformed',
  'Bearer aaa.bbb', 'Bearer a.b.c extra', 'bearer a.b.c',
  'Bearer '+('a'.repeat(9000))
]) {
  await assert.rejects(boundary.record({authorization,submission:clean}),/authenticated reviewer session/);
}
assert.equal(authCalls,oldAuth, 'Invalid bearer headers rejected without Auth traffic');
assert.equal(writeCalls,oldWrites);

for(const identity of [
  null,{}, {id:'not-a-uuid'},
  {id:reviewer,is_anonymous:true}
]) {
  user=identity;
  await assert.rejects(boundary.record({authorization:'Bearer '+signedToken,submission:clean}),/authenticated reviewer session/);
}
assert.equal(writeCalls,oldWrites,'Unverified or anonymous identities never reach ledger adapter');
user={id:reviewer,is_anonymous:false, role:'admin',
  user_metadata:{role:'admin'},app_metadata:{role:'admin'}};
authFailure=true;
await assert.rejects(boundary.record({authorization:'Bearer '+signedToken,submission:clean}),
  /session could not be verified/);
authFailure=false;
assert.equal(writeCalls,oldWrites);
writeFailure=true;
await assert.rejects(boundary.record({authorization:'Bearer '+signedToken,submission:clean}),
  error=> !/sensitive database|secret|token/.test(error.message) && /Unable to authorise/.test(error.message));
writeFailure=false;

for (const bad of [{recorded:false,eventId:event},{recorded:true,eventId:'invalid'},null]) {
  recordResponse=bad;
  await assert.rejects(boundary.record({authorization:'Bearer '+signedToken,submission:clean}),
    /Unable to authorise/);
}
recordResponse={recorded:true,eventId:event};
const content=fs.readFileSync(new URL('../server/protected-moderation-review.mjs',import.meta.url),'utf8');
assert.ok(!/process\.env|Deno\.env|fetch\(|createClient\(|service_role|sb_secret_/.test(
  content.replace(/^\/\/.*$/gm,'')),
  'No database secret or direct network interface may be embedded');
assert.ok(!/deletePost|removeMedia|updatePost/.test(content),
  'Review boundary must not automatically enforce content removal');
const build=fs.readFileSync(new URL('../scripts/build-static.mjs',import.meta.url),'utf8');
assert.match(build,/const runtimeEntries = \[/);
assert.ok(!build.match(/runtimeEntries\s*=\s*\[[\s\S]*?\];/)[0].includes('server/'),
  'Server-only module must stay out of deployed static website');

console.log('PASS Server-only moderation boundary validates JWT via trusted adapter.');
console.log('PASS All permission-changing payloads and unverified/anonymous users fail closed.');
console.log('PASS Admin/report/idempotency checks remain atomic in restricted DB adapter; no public write API.');
console.log('PASS No secrets, live traffic, real users, report changes or moderation removals.');
