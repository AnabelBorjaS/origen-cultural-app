import { stagingURL, STAGING_ROOT_HOST } from './staging-access.mjs';

// A private Pages site has at least three distinct externally reachable URL
// classes: the project root, a branch alias and an immutable commit preview.
// Auditing only one URL can leave another open to anonymous visitors.
// This parser never makes network requests or reads secrets.
export const EXPECTED_STAGING_BRANCH = 'reconcile-main-beta-2026-10-07';

function normalized(raw) {
  const url = stagingURL(raw);
  if (url.pathname !== '/') throw Error('Staging Access coverage requires the root path of each hostname.');
  return url;
}

export function selectStagingCoverage({root, branchAlias, deploymentPreview}) {
  if (![root,branchAlias,deploymentPreview].every(v=>typeof v==='string'&&v.trim())) {
    throw Error('Root, branch alias and immutable preview HTTPS URLs are all mandatory.');
  }
  const entries=[
    {name:'root',url:normalized(root)},
    {name:'branch-alias',url:normalized(branchAlias)},
    {name:'immutable-preview',url:normalized(deploymentPreview)}
  ];
  if (entries[0].url.hostname!==STAGING_ROOT_HOST) {
    throw Error('The root audit must target the base Cloudflare Pages staging hostname.');
  }
  const branchHost=EXPECTED_STAGING_BRANCH+'.'+STAGING_ROOT_HOST;
  if(entries[1].url.hostname!==branchHost) {
    throw Error('Branch alias must be the single approved ORIGEN beta branch.');
  }
  const hash=entries[2].url.hostname.slice(0,entries[2].url.hostname.length-('.'+STAGING_ROOT_HOST).length);
  if(!/^[a-z0-9]{8,64}$/.test(hash)) {
    throw Error('Immutable preview must use an actual Cloudflare Pages hash hostname.');
  }
  const hosts=entries.map(entry=>entry.url.hostname);
  if(new Set(hosts).size!==3)throw Error('Three distinct Pages hostnames are mandatory.');
  return Object.freeze(entries.map(e=>Object.freeze({
    name:e.name, url:e.url.origin+'/'
  })));
}
