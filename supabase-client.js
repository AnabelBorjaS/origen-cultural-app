// ORIGEN Cultural — Supabase browser client
// The publishable key is intentionally safe for public browser use; access is enforced by RLS.
(() => {
  'use strict';
  if (!window.supabase?.createClient) {
    console.error('Supabase JS no está disponible.');
    window.ORIGEN_SUPABASE = null;
    return;
  }

  window.ORIGEN_SUPABASE = window.supabase.createClient(
    'https://xwkjvoyicrrwjybjolld.supabase.co',
    'sb_publishable_iB0fDGrUAgykebiFgsmAqg_7Fx9FX0t',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
})();
