// ORIGEN Cultural — server-side moderation review recommendation contract.
// This file is intentionally NOT loaded by app.js or the public web bundle.
// It validates untrusted event data but it is NOT an authorization system,
// moderation backend, content-removal service, or appeal/notification handler.
//
// Required later: authenticate server-side Supabase JWT, re-check admin role
// from trusted database state, fetch the actual report, add reviewer_user_id
// from that verified identity and insert via a restricted server-only service.
export const REVIEW_EVENT_KINDS = Object.freeze([
  'review_started',
  'information_requested',
  'recommended_correction',
  'recommended_restriction',
  'recommended_dismissal',
  'escalated_for_review',
  'appeal_received',
  'appeal_reconsidered'
]);

const validKinds = new Set(REVIEW_EVENT_KINDS);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const permitted = new Set(['report_id', 'idempotency_key', 'event_kind', 'rationale']);

export function prepareReviewRecommendation(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.getPrototypeOf(input) !== Object.prototype) {
    throw new TypeError('A plain review recommendation object is required.');
  }
  // Avoid IDOR and privilege escalation by rejecting any client-supplied
  // reviewer identity, status, target, storage path or enforcement flags.
  for (const key of Object.keys(input)) {
    if (!permitted.has(key)) {
      throw new Error('Unsupported moderation field: ' + key);
    }
  }
  if (typeof input.report_id !== 'string' || !uuid.test(input.report_id)) {
    throw new Error('A valid report UUID is required.');
  }
  if (typeof input.idempotency_key !== 'string' || !uuid.test(input.idempotency_key)) {
    throw new Error('A valid unique idempotency UUID is required.');
  }
  if (typeof input.event_kind !== 'string' || !validKinds.has(input.event_kind)) {
    throw new Error('Unsupported moderation recommendation type.');
  }
  if (typeof input.rationale !== 'string') {
    throw new Error('Moderation recommendation requires a written rationale.');
  }
  const rationale = input.rationale.trim();
  const length = [...rationale].length;
  if (length < 20 || length > 2000) {
    throw new Error('Review rationale must contain 20–2000 characters.');
  }
  // Only the four non-enforcing columns leave this module. An authorized
  // server MUST derive the reviewer ID; the client must never supply it.
  return Object.freeze({
    report_id: input.report_id.toLowerCase(),
    idempotency_key: input.idempotency_key.toLowerCase(),
    event_kind: input.event_kind,
    rationale
  });
}
