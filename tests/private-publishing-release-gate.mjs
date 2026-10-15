import assert from 'node:assert/strict';
import fs from 'node:fs';

// Static release invariant for the controlled private pilot. It guards the
// deliberate NO-GO state, not actual Supabase RLS or HTTP endpoint security.
const read = path => fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const client=read('supabase-client.js');
const app=read('app.js');
const ledger=read('supabase/proposals/ORIGEN_PRIVATE_PUBLICATION_REQUEST_LEDGER_REVIEW_ONLY.sql');
const blocker=read('supabase/proposals/ORIGEN_STAGING_DISABLE_DIRECT_POST_INSERT_REVIEWED.sql');
const intake=read('supabase/proposals/ORIGEN_STAGING_PRIVATE_INTAKE_FOUNDATION.sql');
const boundary=read('server/protected-publication-intake.mjs');

assert.match(client,/culturalPublishingReady:\s*false/,
  'Client must default to disabled publishing until privileged server review exists');
assert.match(client,/if\s*\(bucket\s*===\s*'post-media'\)\s*\{\s*throw new Error/,
  'Frontend must refuse direct uploads to publicly readable cultural media');
assert.match(client,/bucket\s*===\s*'post-media-intake'/);
assert.match(app,/culturalPublishingReady\s*!==\s*true/,
  'Forced DOM form submission must remain blocked during NO-GO');
assert.match(app,/post-publication-paused/);
assert.match(blocker,/ALTER POLICY "creator posts own insert"/);
assert.match(blocker,/WITH CHECK \(false\)/,
  'Direct cultural post INSERT must remain denied on Staging');
assert.match(intake,/post-media-intake','Private cultural intake must be provisioned');
assert.match(intake,/VALUES\s*\(\s*'post-media-intake','post-media-intake',FALSE/,
  'Private intake bucket must not be publicly downloadable');
assert.match(ledger,/ALTER TABLE private\.cultural_publication_requests FORCE ROW LEVEL SECURITY/);
assert.match(ledger,/REVOKE ALL ON TABLE private\.cultural_publication_requests/);
assert.match(ledger,/UNIQUE\(actor_id,idempotency_key\)/,
  'Pending review request must be idempotent by verified account');
assert.match(ledger,/status='pending_review'/);
assert.match(ledger,/ROLLBACK;\s*$/,
  'Undeployed private ledger proposal MUST finish in ROLLBACK');
assert.doesNotMatch(ledger,/\nCOMMIT;\s*$/);
assert.doesNotMatch(boundary,/Deno\.serve\s*\(|\.copy\s*\(|getPublicUrl\s*\(|\.insert\s*\(/,
  'Pending-review boundary must not be a deployment or publish content');
assert.match(boundary,/recordPendingIfTrustedCreator/);
assert.doesNotMatch(boundary,/process\.env|Deno\.env|getServiceRoleKey|sb_secret_/,
  'No runtime credentials may enter checked-in publication boundary');

console.log('PASS: private cultural publishing remains default-disabled in the browser.');
console.log('PASS: reviewed Staging policies deny direct publishing, public upload and private ledger access.');
console.log('PASS: private ledger review SQL rolls back; backend has no publishing or secret-bearing runtime.');
