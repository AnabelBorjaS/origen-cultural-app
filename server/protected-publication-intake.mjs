// ORIGEN Cultural — UNDPELOYED protected intake-review submission boundary.
// Server-only; NO HTTP handler, DB client, public Storage copies, secrets,
// direct INSERT into cultural_posts, or promotion to publicly accessible media.
// A returned acknowledgement means "request accepted for review" at most,
// never "post published", "content approved" or "ownership proven".
import {
  preparePrivatePublicationSubmission, bindPrivateSubmissionOwner
} from './private-publication-contract.mjs';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const bearer=/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/;

export function createProtectedPublicationIntake(adapters) {
  if(!adapters || typeof adapters.verifyAccessToken!=='function' ||
     typeof adapters.recordPendingIfTrustedCreator!=='function')
    throw new TypeError('Trusted authentication and private atomic request storage are required.');

  return Object.freeze({
    async submit({authorization,submission}={}) {
      // Reject untrusted publication flags, arbitrary paths, consent versions,
      // cross-account object URLs and excessive payload before contacting DB.
      const validated=preparePrivatePublicationSubmission(submission);
      if(typeof authorization!=='string'||authorization.length>8192)
        throw new Error('Authenticated cultural agent required.');
      const token=bearer.exec(authorization);
      if(!token)throw new Error('Authenticated cultural agent required.');
      let identity;
      try {
        identity=await adapters.verifyAccessToken(token[1]);
      } catch {
        throw new Error('Unable to verify cultural agent session.');
      }
      if(!identity||typeof identity.id!=='string'||!uuid.test(identity.id)||
         identity.is_anonymous===true)
        throw new Error('Authenticated cultural agent required.');
      // JWT validity is NOT proof of current creator role, owner rights or
      // Storage object state. The backend adapter MUST re-check all of these
      // from trusted DB/Storage under an idempotent, private pending-request
      // transaction, check live role (not user_metadata or stale JWT claims),
      // check media ownership + content hashes and consent versions.
      const request=bindPrivateSubmissionOwner(validated,identity.id);
      let result;
      try {
        result=await adapters.recordPendingIfTrustedCreator({
          userId:identity.id.toLowerCase(),request
        });
      } catch {
        throw new Error('Unable to record private cultural review request.');
      }
      if(!result || result.recorded!==true ||
        typeof result.requestId!=='string'||!uuid.test(result.requestId)||
        result.state!=='pending_review' ||
        typeof result.replayed!=='boolean') {
        throw new Error('Unable to record private cultural review request.');
      }
      // Do not echo private media paths or expose report/private moderation data.
      return Object.freeze({
        accepted:true,requestId:result.requestId.toLowerCase(),
        state:'pending_review',replayed:result.replayed
      });
    }
  });
}
