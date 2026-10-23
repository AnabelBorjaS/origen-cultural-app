import assert from 'node:assert/strict';
import fs from 'node:fs';
import { prepareReviewRecommendation, REVIEW_EVENT_KINDS } from '../server/moderation-review-contract.mjs';

// Validate the REAL server-only contract, not a reimplementation.
// No database, moderation reports, tokens, users or Storage objects are used.
const report='11111111-1111-4111-8111-111111111111';
const key='22222222-2222-4222-8222-222222222222';
const good={
  report_id: report,
  idempotency_key: key,
  event_kind:'review_started',
  rationale:'Human reviewer needs more evidence before a decision.'
};
const result=prepareReviewRecommendation(good);
assert.equal(result.report_id,report);
assert.equal(result.idempotency_key,key);
assert.equal(result.event_kind,'review_started');
assert.equal(result.rationale,good.rationale);
assert.ok(Object.isFrozen(result));
assert.deepEqual(Object.keys(result).sort(),Object.keys(good).sort());
assert.equal('reviewer_user_id' in result,false);
assert.equal('status' in result,false);
assert.equal('storage_path' in result,false);
assert.equal('is_published' in result,false);
assert.equal('target_id' in result,false);

for(const kind of REVIEW_EVENT_KINDS) {
  const recommendation=prepareReviewRecommendation({...good,event_kind:kind});
  assert.equal(recommendation.event_kind,kind);
}
const proposedSQL=fs.readFileSync(new URL('../supabase/proposals/ORIGEN_MODERATION_CASE_EVENTS_LEDGER_REVIEW_ONLY.sql',import.meta.url),'utf8');
const eventCheck=proposedSQL.match(/event_kind text NOT NULL CHECK \(event_kind IN \(([\s\S]*?)\)\)/);
assert.ok(eventCheck,'Schema must contain a constrained event-kind list');
const sqlKinds=[...eventCheck[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
assert.deepEqual(REVIEW_EVENT_KINDS,sqlKinds,'API allowlist must match DB proposal exactly');
assert.match(proposedSQL,/REVOKE ALL ON TABLE private\.moderation_case_events\s+FROM PUBLIC, anon, authenticated, service_role/i);
assert.match(proposedSQL,/FORCE ROW LEVEL SECURITY/);
assert.match(proposedSQL,/BEFORE UPDATE OR DELETE/);
assert.match(proposedSQL,/ON DELETE RESTRICT/);

for(const input of [null,undefined,[],Object.create(null),new Date(), 'x']) {
  assert.throws(()=>prepareReviewRecommendation(input),/plain review recommendation/i);
}
assert.throws(()=>prepareReviewRecommendation({}),/valid report UUID/i,
  'A plain object with required fields missing must fail validation');
for(const invalid of [
  {report_id:'not-a-uuid'},
  {report_id:'00000000-0000-0000-0000-000000000000'},
  {idempotency_key:'other'},
  {event_kind:'remove_post'},
  {event_kind:'auto_ban'},
  {event_kind:'resolved'},
  {rationale:''},
  {rationale:'short'},
  {rationale:'a'.repeat(2001)},
  {rationale:8},
  {reporter_user_id:report},
  {reviewer_user_id:report},
  {target_id:report},
  {storage_path:'post-media/user/data'},
  {status:'resolved'},
  {is_published:false},
  {is_editorial:true},
  {__proto_marker:true}
]) {
  assert.throws(()=>prepareReviewRecommendation({...good,...invalid}),undefined,
    'Must reject unsafe moderation input: '+JSON.stringify(invalid).slice(0,110));
}
assert.equal(prepareReviewRecommendation({...good,rationale:'  '+good.rationale+'  '}).rationale,good.rationale);
assert.doesNotThrow(()=>prepareReviewRecommendation({...good,rationale:'c'.repeat(2000)}));
assert.doesNotThrow(()=>prepareReviewRecommendation({...good,rationale:'🌍'.repeat(20)}));
assert.ok(!/fetch\(|\.from\(|\.rpc\(|\.insert\(|\.update\(/.test(
  fs.readFileSync(new URL('../server/moderation-review-contract.mjs',import.meta.url),'utf8')),
  'A validation-only module must not perform network/database actions');

const builder=fs.readFileSync(new URL('../scripts/build-static.mjs',import.meta.url),'utf8');
assert.ok(builder.includes('const allowlist') || builder.includes('const files'),
  'Build must be inspected before making server code public');
console.log('PASS Moderation recommendation contract matches private SQL schema.');
console.log('PASS Forged reviewers, status changes and content-removal fields are rejected.');
console.log('PASS Recommendation builder is non-executing and leaves reviewer authorization to server.');
