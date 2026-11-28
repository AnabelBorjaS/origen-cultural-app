import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {selectStagingCoverage,EXPECTED_STAGING_BRANCH} from '../scripts/staging-coverage.mjs';
import {STAGING_ROOT_HOST} from '../scripts/staging-access.mjs';

// Offline input verification: no Cloudflare requests, tokens, subscription
// changes, sessions, accounts or user content.
const root='https://'+STAGING_ROOT_HOST+'/';
const branchAlias='https://'+EXPECTED_STAGING_BRANCH+'.'+STAGING_ROOT_HOST+'/';
const preview='https://a1b2c3d4.'+STAGING_ROOT_HOST+'/';
const valid={root,branchAlias,deploymentPreview:preview};
const good=selectStagingCoverage(valid);
assert.deepEqual(good.map(e=>e.name),['root','branch-alias','immutable-preview']);
assert.deepEqual(good.map(e=>e.url),[root,branchAlias,preview]);
assert.ok(good.every(Object.isFrozen));
assert.ok(Object.isFrozen(good));

for(const bad of [
  {},
  {...valid,root:''},
  {...valid,branchAlias:''},
  {...valid,deploymentPreview:''},
  {...valid,root:branchAlias},
  {...valid,branchAlias:root},
  {...valid,deploymentPreview:branchAlias},
  {...valid,deploymentPreview:root},
  {...valid,deploymentPreview:'https://short.'+STAGING_ROOT_HOST},
  {...valid,deploymentPreview:'https://another-branch.'+STAGING_ROOT_HOST},
  {...valid,branchAlias:'https://main.'+STAGING_ROOT_HOST},
  {...valid,deploymentPreview:'https://evil.example'},
  {...valid,root:'http://'+STAGING_ROOT_HOST},
  {...valid,root:'https://user:password@'+STAGING_ROOT_HOST},
  {...valid,root:'https://'+STAGING_ROOT_HOST+'/private'},
  {...valid,root:'https://'+STAGING_ROOT_HOST+'/?token=abc'},
  {...valid,deploymentPreview:'https://'+STAGING_ROOT_HOST+'.evil.example'}
]) {
  assert.throws(()=>selectStagingCoverage(bad),undefined,
    'Missing or insecure Pages host must fail-closed: '+JSON.stringify(bad));
}

const script=fileURLToPath(new URL('../scripts/audit-staging-coverage.mjs',import.meta.url));
const env={
  ...process.env,
  ORIGEN_CF_ACCESS_CLIENT_ID:'TEST_ID',
  ORIGEN_CF_ACCESS_CLIENT_SECRET:'TEST_SECRET',
  ORIGEN_STAGING_AUDIT_MODE:'visual-only'
};
function cli(args,envPatch={}) {
  const p=spawnSync(process.execPath,[script,...args],{
    env:{...env,...envPatch},encoding:'utf8',timeout:12000
  });
  assert.equal(p.status,1,'Unsafe audit invocation must exit before making any request');
  assert.ok(!p.stdout.includes('Auditing Cloudflare Access'),
    'Fail invalid arguments before calling the HTTPS auditor');
  assert.ok(!p.stderr.includes('TEST_SECRET'), 'No secret may leak to error logs');
}
cli([root,branchAlias,'https://evil.example/']);
cli([root,branchAlias]);
cli([root,branchAlias,preview],{ORIGEN_CF_ACCESS_CLIENT_SECRET:''});
cli([root,branchAlias,preview],{ORIGEN_STAGING_AUDIT_MODE:''});
console.log('PASS Cloudflare Access audit requires root, beta branch alias and immutable hash preview.');
console.log('PASS Host allowlist blocks external URLs, duplicate targets and path/query injection.');
console.log('PASS Incomplete credentials, audit mode or URLs fail before any live request.');
