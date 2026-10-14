// ORIGEN Cultural — server-only PRIVATE publication submission contract.
// Never imported into the static UI. It validates untrusted request shape;
// it does not prove copyright, community consent, media ownership or role.
// A trusted backend adapter MUST re-check every private file and creator role.
// No public media URLs, arbitrary Storage buckets, permissions decisions,
// publication flag, user ID or legal version may be supplied by a client.
export const POST_PURPOSES=Object.freeze([
  'education','history','technique','territory','language',
  'gastronomy','arts','heritage','community'
]);
const purposes=new Set(POST_PURPOSES);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const safeMediaPath=/^([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/([0-9]{10,16}-[a-f0-9]{32}-[a-z0-9_-]{1,64}\.(jpg|png|webp|mp4|webm|mov))$/i;
const allowed=new Set([
  'idempotency_key','title','description','type','media_paths','contentPurpose',
  'category','territory','tags','cultural_profile_id',
  'rightsAcknowledged','culturalAcknowledged'
]);
const img=new Set(['jpg','png','webp']);
const video=new Set(['mp4','webm','mov']);
const typeSet=new Set(['photo','carousel','video']);

function plainObject(v) {
  return !!v && typeof v==='object' && !Array.isArray(v) &&
    Object.getPrototypeOf(v)===Object.prototype;
}
function stringField(raw,label,min,max,{optional=false}={}) {
  if(optional && (raw===null || raw===undefined || raw==='')) return null;
  if(typeof raw!=='string') throw new Error(label+' must be a string.');
  const s=raw.trim();
  if([...s].length<min || [...s].length>max ||
     /[\u0000-\u001f\u007f]/.test(s)) {
    throw new Error(label+' has invalid length or control characters.');
  }
  return s;
}

export function preparePrivatePublicationSubmission(input) {
  if(!plainObject(input))throw new TypeError('Publication submission must be a plain object.');
  for(const key of Object.keys(input)) {
    if(!allowed.has(key))throw new Error('Unsupported publication field: '+key);
  }
  if(typeof input.idempotency_key!=='string'||!uuid.test(input.idempotency_key))
    throw new Error('A valid idempotency UUID is required.');
  if(input.rightsAcknowledged!==true || input.culturalAcknowledged!==true)
    throw new Error('Both cultural and content rights declarations are required.');
  if(!typeSet.has(input.type))throw new Error('Unsupported cultural post type.');
  if(!purposes.has(input.contentPurpose))throw new Error('Unsupported cultural purpose.');

  const title=stringField(input.title,'Title',3,240);
  const description=stringField(input.description,'Description',20,5000);
  const category=stringField(input.category,'Category',1,150,{optional:true});
  const territory=stringField(input.territory,'Territory',1,250,{optional:true});
  if(input.cultural_profile_id!=null &&
     (typeof input.cultural_profile_id!=='string'||!uuid.test(input.cultural_profile_id)))
    throw new Error('Invalid cultural profile reference.');

  if(!Array.isArray(input.tags)||input.tags.length>10)
    throw new Error('Tags must be a small array.');
  const tags=input.tags.map(tag=>stringField(tag,'Tag',1,40));
  if(new Set(tags.map(t=>t.toLowerCase())).size!==tags.length)
    throw new Error('Duplicate tags are not accepted.');

  if(!Array.isArray(input.media_paths)||input.media_paths.length<1||
     input.media_paths.length>10)
    throw new Error('Between one and ten private media files are required.');
  const media_paths=input.media_paths.map(path=>{
    if(typeof path!=='string'||path.length>200||!safeMediaPath.test(path))
      throw new Error('Invalid private media object path.');
    // Do not allow canonicalization of percent escapes, query strings,
    // URLs, path traversal or a copied public bucket path.
    return path.toLowerCase();
  });
  if(new Set(media_paths).size!==media_paths.length)
    throw new Error('A private media object cannot appear twice.');
  const extensions=media_paths.map(path=>safeMediaPath.exec(path)[3]);
  if(input.type==='photo' && (media_paths.length!==1||!img.has(extensions[0])))
    throw new Error('Photo posts require exactly one image.');
  if(input.type==='video' && (media_paths.length!==1||!video.has(extensions[0])))
    throw new Error('Video posts require exactly one video.');
  if(input.type==='carousel' && (media_paths.length<2||
      !extensions.every(ext=>img.has(ext))))
    throw new Error('Carousels require two to ten images.');

  // Server must still check actual Storage metadata, MIME, file ownership,
  // immutable content digest and pending status with a trusted DB transaction.
  // Never accept user-supplied rights statement versions or published flags.
  return Object.freeze({
    idempotency_key:input.idempotency_key.toLowerCase(),
    title, description, type:input.type, contentPurpose:input.contentPurpose,
    category, territory,
    cultural_profile_id:input.cultural_profile_id?.toLowerCase()||null,
    media_paths:Object.freeze(media_paths),
    tags:Object.freeze(tags),
    rightsAcknowledged:true,culturalAcknowledged:true
  });
}
export function bindPrivateSubmissionOwner(prepared,authenticatedUserId) {
  if(!plainObject(prepared) && !Object.isFrozen(prepared))
    throw new TypeError('A validated submission is required.');
  if(typeof authenticatedUserId!=='string'||!uuid.test(authenticatedUserId))
    throw new Error('Verified account identity required.');
  const owner=authenticatedUserId.toLowerCase();
  if(!Array.isArray(prepared.media_paths)||prepared.media_paths.length===0||
    !prepared.media_paths.every(path=>typeof path==='string' &&
      safeMediaPath.test(path) && path.split('/')[0]===owner))
    throw new Error('Private media belongs to another account or is invalid.');
  return Object.freeze({...prepared,owner_id:owner});
}
