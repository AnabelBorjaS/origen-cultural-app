// ORIGEN Cultural — Supabase browser client
// Uses only the public project URL and publishable key. Never place service-role keys here.
(() => {
  'use strict';

  const PROJECT_URL = 'https://xwkjvoyicrrwjybjolld.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_iB0fDGrUAgykebiFgsmAqg_7Fx9FX0t';

  if (!window.supabase?.createClient) {
    console.error('[ORIGEN] Supabase library not loaded.');
    return;
  }

  const client = window.supabase.createClient(PROJECT_URL, PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  const cache = {
    session: null,
    profile: null,
    culturalProfiles: [],
    follows: [],
    favorites: [],
    posts: [],
    likes: [],
    saves: [],
    comments: []
  };

  const normaliseUser = (authUser, profile) => {
    if (!authUser) return null;
    const p = profile || {};
    return {
      id: authUser.id,
      email: authUser.email || '',
      name: p.display_name || authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'Usuario',
      display_name: p.display_name || '',
      accountType: p.role === 'creator' ? 'creator' : 'explorer',
      role: p.role || 'explorer',
      avatar: p.avatar_url || '',
      cover: p.cover_url || '',
      location: p.location || [p.city, p.country].filter(Boolean).join(', '),
      story: p.story || p.bio || '',
      categories: p.categories || [],
      links: p.links || {},
      createdAt: p.created_at || authUser.created_at
    };
  };

  async function loadMyProfile(authUser) {
    if (!authUser) return null;
    const { data, error } = await client.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
    if (error) throw error;
    cache.profile = data || null;
    return normaliseUser(authUser, data);
  }

  async function restoreSession() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    cache.session = data.session || null;
    if (!cache.session?.user) return null;
    return loadMyProfile(cache.session.user);
  }

  async function signIn(email, password) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    cache.session = data.session || null;
    return loadMyProfile(data.user);
  }

  async function signUp(payload) {
    const metadata = {
      display_name: payload.name || '',
      account_type: payload.accountType === 'creator' ? 'creator' : 'explorer',
      location: payload.location || '',
      story: payload.story || '',
      categories: payload.categories || [],
      links: payload.links || {}
    };
    const redirectTo = window.location.origin + window.location.pathname + '#login';
    const { data, error } = await client.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: { data: metadata, emailRedirectTo: redirectTo }
    });
    if (error) throw error;

    if (data.user) {
      // Trigger-created profile may take a moment to become visible.
      await new Promise(resolve => setTimeout(resolve, 250));
      const { error: legalError } = await client.from('legal_acceptances').insert({
        user_id: data.user.id,
        terms_version: 'v1.2',
        privacy_version: 'v1.2',
        community_guidelines_version: 'v1.2',
        cultural_rights_version: 'v1.2'
      });
      if (legalError && !String(legalError.message || '').includes('row-level')) {
        console.warn('[ORIGEN] Legal acceptance write:', legalError.message);
      }
    }

    return {
      user: data.user,
      session: data.session,
      requiresEmailConfirmation: !!data.user && !data.session
    };
  }

  async function signOut() {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    cache.session = null;
    cache.profile = null;
  }

  async function resetPassword(email) {
    const redirectTo = window.location.origin + window.location.pathname + '#restablecer';
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }

  async function updatePassword(password) {
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
  }

  async function updateMyProfile(changes) {
    const uid = cache.session?.user?.id || (await client.auth.getUser()).data.user?.id;
    if (!uid) throw new Error('Sesión no disponible.');
    const safe = {
      display_name: changes.name,
      avatar_url: changes.avatar,
      cover_url: changes.cover,
      location: changes.location,
      story: changes.story,
      categories: changes.categories || [],
      links: changes.links || {},
      updated_at: new Date().toISOString()
    };
    Object.keys(safe).forEach(k => safe[k] === undefined && delete safe[k]);
    const { data, error } = await client.from('profiles').update(safe).eq('id', uid).select('*').single();
    if (error) throw error;
    cache.profile = data;
    return normaliseUser(cache.session?.user || (await client.auth.getUser()).data.user, data);
  }

  async function listCulturalProfiles() {
    const { data, error } = await client.from('cultural_profiles').select('*').eq('is_published', true).order('name');
    if (error) throw error;
    cache.culturalProfiles = data || [];
    return cache.culturalProfiles;
  }

  async function findCulturalProfile(ref) {
    const { data, error } = await client.from('cultural_profiles')
      .select('*')
      .or(`id.eq.${ref},slug.eq.${ref}`)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function myFollows() {
    const uid = cache.session?.user?.id;
    if (!uid) return [];
    const { data, error } = await client.from('follows').select('cultural_profile_id').eq('user_id', uid);
    if (error) throw error;
    cache.follows = (data || []).map(x => x.cultural_profile_id);
    return cache.follows;
  }

  async function toggleFollow(culturalProfileId) {
    const uid = cache.session?.user?.id;
    if (!uid) throw new Error('Debes iniciar sesión.');
    const exists = cache.follows.includes(culturalProfileId);
    const query = exists
      ? client.from('follows').delete().eq('user_id', uid).eq('cultural_profile_id', culturalProfileId)
      : client.from('follows').insert({ user_id: uid, cultural_profile_id: culturalProfileId });
    const { error } = await query;
    if (error) throw error;
    await myFollows();
    return !exists;
  }

  async function myFavorites() {
    const uid = cache.session?.user?.id;
    if (!uid) return [];
    const { data, error } = await client.from('favorites').select('cultural_profile_id').eq('user_id', uid);
    if (error) throw error;
    cache.favorites = (data || []).map(x => x.cultural_profile_id);
    return cache.favorites;
  }

  async function toggleFavorite(culturalProfileId) {
    const uid = cache.session?.user?.id;
    if (!uid) throw new Error('Debes iniciar sesión.');
    const exists = cache.favorites.includes(culturalProfileId);
    const query = exists
      ? client.from('favorites').delete().eq('user_id', uid).eq('cultural_profile_id', culturalProfileId)
      : client.from('favorites').insert({ user_id: uid, cultural_profile_id: culturalProfileId });
    const { error } = await query;
    if (error) throw error;
    await myFavorites();
    return !exists;
  }

  async function submitClaim(payload) {
    const uid = cache.session?.user?.id;
    if (!uid) throw new Error('Debes iniciar sesión para reclamar un perfil.');
    const { data, error } = await client.from('profile_claims').insert({
      cultural_profile_id: payload.cultural_profile_id,
      claimant_user_id: uid,
      claimant_name: payload.claimant_name,
      relationship_role: payload.relationship_role,
      official_email: payload.official_email,
      official_url: payload.official_url || null,
      explanation: payload.explanation || null,
      authority_declaration: true
    }).select('id,status,created_at').single();
    if (error) throw error;
    return data;
  }

  async function report(payload) {
    const uid = cache.session?.user?.id || null;
    const { data, error } = await client.from('moderation_reports').insert({
      reporter_user_id: uid,
      target_type: payload.target_type,
      target_id: payload.target_id || null,
      reason: payload.reason,
      details: payload.details || null
    }).select('id').single();
    if (error) throw error;
    return data;
  }

  async function upload(bucket, file, nameHint='media') {
    const uid = cache.session?.user?.id;
    if (!uid) throw new Error('Debes iniciar sesión.');
    const ext = (file.name?.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase();
    const safe = nameHint.replace(/[^a-z0-9-_]/gi,'-').toLowerCase();
    const path = `${uid}/${Date.now()}-${safe}.${ext}`;
    const { error } = await client.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  client.auth.onAuthStateChange(async (_event, session) => {
    cache.session = session || null;
    if (session?.user) {
      try { cache.profile = (await client.from('profiles').select('*').eq('id', session.user.id).maybeSingle()).data || null; }
      catch (_) {}
    } else {
      cache.profile = null;
      cache.follows = [];
      cache.favorites = [];
    }
    window.dispatchEvent(new CustomEvent('origen-auth-change'));
  });

  window.ORIGEN_API = {
    client, cache, restoreSession, signIn, signUp, signOut,
    resetPassword, updatePassword, updateMyProfile,
    listCulturalProfiles, findCulturalProfile,
    myFollows, toggleFollow, myFavorites, toggleFavorite,
    submitClaim, report, upload, normaliseUser
  };
})();
