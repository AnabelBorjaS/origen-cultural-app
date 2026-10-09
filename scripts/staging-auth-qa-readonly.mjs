// ORIGEN Staging A/B RLS check. READ-ONLY DATA API, no user creation.
import { pathToFileURL } from 'node:url';
export const STAGING='https://egujmptgnrpajgfpjjxu.supabase.co';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validate(env) {
  if(env.ORIGEN_STAGING_SUPABASE_URL!==STAGING) throw Error('Unsafe QA target; only isolated Staging accepted');
  if(!/^sb_publishable_[\w-]{10,}$/.test(env.ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY||'')) throw Error('Unsafe key; publishable Staging key required');
  const fields=['ORIGEN_QA_EXPLORER_EMAIL','ORIGEN_QA_EXPLORER_PASSWORD',
    'ORIGEN_QA_CREATOR_EMAIL','ORIGEN_QA_CREATOR_PASSWORD',
    'ORIGEN_QA_PRIVATE_SAVE_ID','ORIGEN_QA_PRIVATE_DRAFT_ID'];
  for(const key of fields) if(!env[key]) throw Error('Existing synthetic staging fixture missing: '+key);
  if(!UUID.test(env.ORIGEN_QA_PRIVATE_SAVE_ID)||!UUID.test(env.ORIGEN_QA_PRIVATE_DRAFT_ID)) throw Error('Invalid QA fixture UUID');
  if(env.ORIGEN_QA_EXPLORER_EMAIL===env.ORIGEN_QA_CREATOR_EMAIL) throw Error('Two different staging accounts required');
  return {
    url:STAGING,key:env.ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY,
    E:{email:env.ORIGEN_QA_EXPLORER_EMAIL,password:env.ORIGEN_QA_EXPLORER_PASSWORD},
    C:{email:env.ORIGEN_QA_CREATOR_EMAIL,password:env.ORIGEN_QA_CREATOR_PASSWORD},
    save:env.ORIGEN_QA_PRIVATE_SAVE_ID,draft:env.ORIGEN_QA_PRIVATE_DRAFT_ID
  };
}
export function readPath(table,params={}) {
  if(!['profiles','legal_acceptances','post_saves','cultural_posts','cultural_post_rights_events'].includes(table)) throw Error('Disallowed read');
  const search=new URLSearchParams();
  for(const [key,value] of Object.entries(params)) {
    if(!['select','id','user_id','limit'].includes(key)||typeof value!=='string') throw Error('Disallowed filter');
    search.set(key,value);
  }
  return '/rest/v1/'+table+'?'+search.toString();
}
async function request(cfg,path,token,method='GET',body) {
  const url=new URL(path,cfg.url);
  if(url.origin!==cfg.url||(method!=='GET'&&!(method==='POST'&&url.pathname==='/auth/v1/token'))) throw Error('Unsafe method or origin');
  const res=await fetch(url,{
    method,redirect:'error',signal:AbortSignal.timeout(12000),
    headers:{apikey:cfg.key,Authorization:'Bearer '+(token||cfg.key),'Content-Type':'application/json'},
    ...(body?{body:JSON.stringify(body)}:{})
  });
  let data=null;
  try{data=await res.json()}catch{}
  return {status:res.status,data};
}
async function login(cfg,creds) {
  const res=await request(cfg,'/auth/v1/token?grant_type=password',null,'POST',creds);
  if(res.status!==200||!res.data?.access_token||!UUID.test(res.data?.user?.id||'')) throw Error('Staging login failed for pre-existing QA account');
  return {uid:res.data.user.id,token:res.data.access_token};
}
export async function run(env=process.env) {
  const cfg=validate(env); // Fails BEFORE all network requests.
  const E=await login(cfg,cfg.E),C=await login(cfg,cfg.C);
  if(E.uid===C.uid) throw Error('Two distinct Auth IDs required');
  const get=(table,params,session)=>request(cfg,readPath(table,params),session?.token||null);
  async function rows(table,params,session) {
    const r=await get(table,params,session);
    if(r.status!==200||!Array.isArray(r.data)) throw Error('Read-only staging API denied expected '+table+' read');
    return r.data;
  }
  let passed=0;
  function check(name,valid) {
    if(!valid) throw Error('QA FAIL: '+name);
    passed++;
    console.log('PASS '+name);
  }
  for(const [role,s] of [['explorer',E],['creator',C]]) {
    const p=await rows('profiles',{select:'id,role',id:'eq.'+s.uid},s);
    check(role+' database role',p.length===1&&p[0].role===role&&p[0].id===s.uid);
    const legal=await rows('legal_acceptances',{select:'user_id,terms_version,privacy_version',user_id:'eq.'+s.uid},s);
    check(role+' own v1.2 legal receipt',legal.length===1&&legal[0].user_id===s.uid&&legal[0].terms_version==='v1.2'&&legal[0].privacy_version==='v1.2');
  }
  check('explorer cannot read creator legal receipt',(await rows('legal_acceptances',{select:'id',user_id:'eq.'+C.uid},E)).length===0);
  check('creator cannot read explorer legal receipt',(await rows('legal_acceptances',{select:'id',user_id:'eq.'+E.uid},C)).length===0);
  const s=await rows('post_saves',{select:'id,user_id',id:'eq.'+cfg.save},E);
  check('owner can see pre-seeded private save',s.length===1&&s[0].user_id===E.uid);
  check('other account cannot see private save',(await rows('post_saves',{select:'id',id:'eq.'+cfg.save},C)).length===0);
  const d=await rows('cultural_posts',{select:'id,author_id,is_published',id:'eq.'+cfg.draft},C);
  check('creator can see own unpublished post',d.length===1&&d[0].author_id===C.uid&&d[0].is_published===false);
  check('explorer cannot see creator draft',(await rows('cultural_posts',{select:'id',id:'eq.'+cfg.draft},E)).length===0);
  check('anonymous cannot see creator draft',(await rows('cultural_posts',{select:'id',id:'eq.'+cfg.draft},null)).length===0);
  const hidden=await get('cultural_post_rights_events',{select:'id',limit:'1'},E);
  check('private audit is inaccessible to Data API',[401,403,404].includes(hidden.status));
  console.log('STAGING READ-ONLY A/B QA '+passed+'/'+passed+' PASS');
  console.log('This does not validate write rejection, media withdrawal or Auth signup hook.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  run().catch(e=>{console.error('Staging QA STOPPED: '+e.message);process.exitCode=1;});
}
