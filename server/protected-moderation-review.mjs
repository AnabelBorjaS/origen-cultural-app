// ORIGEN Cultural — UNDEPLOYED protected moderation boundary.
// This module has NO HTTP listener, DB connection, secret, or Content/Storage
// update capability. It must never be included in the browser build.
//
// The runtime adapter must later provide:
// - verifyAccessToken(token): server-authoritative Supabase Auth verification;
// - recordIfActiveAdmin({reviewerId,recommendation}): SINGLE server-side
//   transaction that re-checks admin role in trusted profiles, report exists,
//   writes to restricted private ledger, and enforces idempotency atomically.
// Never split that transaction into separate frontend/db calls. No broad
// PUBLIC / authenticated EXECUTE grants or client service-role keys.
import { prepareReviewRecommendation } from './moderation-review-contract.mjs';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const bearer = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/;

export function createProtectedReviewBoundary(adapters) {
  if (!adapters || typeof adapters.verifyAccessToken !== 'function' ||
      typeof adapters.recordIfActiveAdmin !== 'function') {
    throw new TypeError('Trusted server authentication and atomic ledger adapters are mandatory.');
  }

  return Object.freeze({
    async record({authorization, submission} = {}) {
      // Validate input before Auth/backend work: browser cannot request
      // another reviewer, change a case status or silently remove content.
      const recommendation = prepareReviewRecommendation(submission);
      if (typeof authorization !== 'string' || authorization.length > 8192) {
        throw new Error('An authenticated reviewer session is required.');
      }
      const match = bearer.exec(authorization);
      if (!match) throw new Error('An authenticated reviewer session is required.');
      // A JWT-shaped string is NOT proof of Auth: verifyAccessToken must call
      // an actual trusted Auth provider, checking signature/expiry/revocation.
      let user;
      try {
        user = await adapters.verifyAccessToken(match[1]);
      } catch {
        throw new Error('Reviewer session could not be verified.');
      }
      if (!user || typeof user.id !== 'string' || !uuid.test(user.id) ||
          user.is_anonymous === true) {
        throw new Error('An authenticated reviewer session is required.');
      }
      // Never accept role from user_metadata, caller payload or mutable
      // client-side profile. recordIfActiveAdmin MUST check trusted current
      // database role and insert atomically (to avoid role-revocation races).
      let result;
      try {
        result = await adapters.recordIfActiveAdmin({
          reviewerId: user.id.toLowerCase(), recommendation
        });
      } catch {
        // Backend exceptions may contain sensitive case details: fail closed.
        throw new Error('Unable to authorise or record this review.');
      }
      if (!result || result.recorded !== true ||
          typeof result.eventId !== 'string' || !uuid.test(result.eventId)) {
        throw new Error('Unable to authorise or record this review.');
      }
      return Object.freeze({recorded:true,eventId:result.eventId.toLowerCase()});
    }
  });
}
