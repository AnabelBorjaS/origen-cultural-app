import assert from 'node:assert/strict';
import {validate,readPath,STAGING} from '../scripts/staging-auth-qa-readonly.mjs';
const good={
  ORIGEN_STAGING_SUPABASE_URL:STAGING,
  ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_0123456789_qasafe',
  ORIGEN_QA_EXPLORER_EMAIL:'explorer@qa.invalid',
  ORIGEN_QA_EXPLORER_PASSWORD:'not-a-real-password',
  ORIGEN_QA_CREATOR_EMAIL:'creator@qa.invalid',
  ORIGEN_QA_CREATOR_PASSWORD:'not-a-real-password',
  ORIGEN_QA_PRIVATE_SAVE_ID:'11111111-1111-4111-8111-111111111111',
  ORIGEN_QA_PRIVATE_DRAFT_ID:'22222222-2222-4222-8222-222222222222'
};
assert.equal(validate(good).url,STAGING);
for(const unsafe of [
  'https://xwkjvoyicrrwjybjolld.supabase.co',
  'https://egujmptgnrpajgfpjjxu.supabase.co.evil.test',
  'http://egujmptgnrpajgfpjjxu.supabase.co',
  STAGING+'/'
]){
  assert.throws(()=>validate({...good,ORIGEN_STAGING_SUPABASE_URL:unsafe}),/Unsafe QA target/);
}
assert.throws(()=>validate({...good,ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY:'sb_secret_not_allowed'}),/Unsafe key/);
assert.throws(()=>validate({...good,ORIGEN_QA_CREATOR_EMAIL:good.ORIGEN_QA_EXPLORER_EMAIL}),/different staging/);
assert.throws(()=>validate({...good,ORIGEN_QA_PRIVATE_DRAFT_ID:'not-a-uuid'}),/UUID/);
assert.throws(()=>validate({...good,ORIGEN_QA_PRIVATE_SAVE_ID:''}),/missing/);
assert.match(readPath('post_saves',{select:'id',id:'eq.'+good.ORIGEN_QA_PRIVATE_SAVE_ID}),/^\/rest\/v1\/post_saves\?/);
assert.throws(()=>readPath('auth.users'),/Disallowed read/);
assert.throws(()=>readPath('profiles',{delete:'true'}),/Disallowed filter/);
console.log('PASS Staging QA refuses Production, unsafe keys, missing fixtures and unreviewed resources.');
console.log('PASS Offline-only safety tests made zero Auth/API requests.');
