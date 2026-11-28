#!/usr/bin/env node
// Offline-specified, live HTTPS audit of *all three* Cloudflare Pages URL types.
// No URLs can be invented: the operator must paste the actual verified hosts.
// The existing verify-staging script separately probes anonymous and authorized
// access on each host, with redirect:'manual' and no token logging.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { accessHeaders } from './staging-access.mjs';
import { selectStagingCoverage } from './staging-coverage.mjs';

// Fail before starting any network request if credentials or inputs are
// incomplete. The access token stays only in the inherited environment;
// never include it in argv, stdout, exceptions or logs.
const headers=accessHeaders();
if(!headers['CF-Access-Client-Id']) {
  throw Error('Cloudflare Access service credentials are mandatory for private coverage audit.');
}
const [root,branchAlias,deploymentPreview,...extra]=process.argv.slice(2);
if(extra.length) throw Error('Usage: npm run audit:staging:coverage -- ROOT BRANCH_ALIAS IMMUTABLE_PREVIEW');
const entries=selectStagingCoverage({root,branchAlias,deploymentPreview});
const auditor=fileURLToPath(new URL('./verify-staging.mjs',import.meta.url));
const mode=process.env.ORIGEN_STAGING_AUDIT_MODE;
if(mode!=='visual-only'&&mode!=='auth-staging') {
  throw Error('Explicit ORIGEN_STAGING_AUDIT_MODE is required: visual-only or auth-staging.');
}
let failed=false;
for(const entry of entries) {
  console.log('\nAuditing Cloudflare Access '+entry.name+' (HTTPS host and assets): '+entry.url);
  const result=spawnSync(process.execPath,[auditor,entry.url],{
    stdio:'inherit',env:process.env,timeout:90000
  });
  if(result.error || result.status!==0) {
    console.error('FAILED Cloudflare Access audit: '+entry.name);
    failed=true;
  }
}
if(failed) {
  console.error('ORIGEN remains NO-GO: all root, alias and immutable previews must pass.');
  process.exitCode=1;
} else {
  console.log('PASS representative root, branch alias and immutable preview URLs.');
  console.log('NOTE: This is not proof that every historic preview alias is locked;');
  console.log('verify wildcard Access policy in the Cloudflare dashboard before inviting users.');
}
