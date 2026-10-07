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
    publicProfiles: [],
    follows: [],
    favorites: [],
    posts: [],
    postsExhausted: false,
    postPageSize: 12,
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
      providerHeadline: p.links?._provider?.headline || '',
      services: p.links?._provider?.services || [],
      serviceDescription: p.links?._provider?.description || '',
      website: p.links?.web || '',
      publicEmail: p.links?.email || '',
      publicWhatsapp: p.links?.whatsapp || '',
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

  function authRedirect(hashRoute) {
    const url = new URL(window.location.href);
    const localHost = ['localhost', '127.0.0.1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !localHost) {
      throw new Error('ORIGEN Auth requires HTTPS outside local development.');
    }
    url.search = '';
    url.hash = hashRoute.startsWith('#') ? hashRoute : '#' + hashRoute;
    return url.toString();
  }

  async function signIn(email, password, captchaToken = null) {
    const credentials = { email, password };
    if (captchaToken) credentials.options = { captchaToken };
    const { data, error } = await client.auth.signInWithPassword(credentials);
    if (error) throw error;
    cache.session = data.session || null;
    return loadMyProfile(data.user);
  }

  async function signUp(payload) {
    if (!payload?.acceptedLegal) throw new Error('Debes aceptar los documentos esenciales de ORIGEN para crear tu cuenta.');
    const metadata = {
      display_name: payload.name || '',
      account_type: payload.accountType === 'creator' ? 'creator' : 'explorer',
      location: payload.location || '',
      story: payload.story || '',
      categories: payload.categories || [],
      links: {
        ...(payload.links || {}),
        _provider: payload.accountType === 'creator' ? {
          headline: payload.providerHeadline || '',
          services: payload.services || [],
          description: payload.serviceDescription || ''
        } : undefined
      },
      accepted_legal: true,
      terms_version: 'v1.2',
      privacy_version: 'v1.2',
      community_guidelines_version: 'v1.2',
      cultural_rights_version: 'v1.2'
    };
    const redirectTo = authRedirect('#login');
    const options = { data: metadata, emailRedirectTo: redirectTo };
    if (payload.captchaToken) options.captchaToken = payload.captchaToken;
    const { data, error } = await client.auth.signUp({
      email: payload.email,
      password: payload.password,
      options
    });
    if (error) throw error;



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

  async function resetPassword(email, captchaToken = null) {
    const redirectTo = authRedirect('#restablecer');
    const options = { redirectTo };
    if (captchaToken) options.captchaToken = captchaToken;
    const { error } = await client.auth.resetPasswordForEmail(email, options);
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
      links: {
        ...(changes.links || {}),
        _provider: changes.accountType === 'creator' ? {
          headline: changes.providerHeadline || '',
          services: changes.services || [],
          description: changes.serviceDescription || ''
        } : (changes.links?._provider || undefined)
      },
      updated_at: new Date().toISOString()
    };
    Object.keys(safe).forEach(k => safe[k] === undefined && delete safe[k]);
    const { data, error } = await client.from('profiles').update(safe).eq('id', uid).select('*').single();
    if (error) throw error;
    cache.profile = data;
    return normaliseUser(cache.session?.user || (await client.auth.getUser()).data.user, data);
  }

  async function listPublicProfiles() {
    const { data, error } = await client.from('profiles')
      .select('id,role,display_name,avatar_url,cover_url,country,city,bio,location,story,categories,links,created_at')
      .eq('role', 'creator')
      .order('created_at', { ascending: false });
    if (error) throw error;
    cache.publicProfiles = data || [];
    return cache.publicProfiles;
  }

  async function ensureCreatorCulturalProfile() {
    const uid = cache.session?.user?.id;
    if (!uid || cache.profile?.role !== 'creator') return null;

    const { data: existing, error: readError } = await client.from('cultural_profiles')
      .select('*')
      .eq('owner_id', uid)
      .maybeSingle();
    if (readError) throw readError;
    if (existing) return existing;

    const displayName = cache.profile?.display_name || cache.session.user.email?.split('@')[0] || 'Proveedor Cultural';
    const slugBase = displayName.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'proveedor';
    const row = {
      owner_id: uid,
      slug: `${slugBase}-${uid.slice(0,8)}`,
      name: displayName,
      creator_type: 'Proveedor Cultural',
      category: (cache.profile?.categories || [])[0] || 'Cultura',
      story: cache.profile?.story || cache.profile?.bio || null,
      location: cache.profile?.location || [cache.profile?.city, cache.profile?.country].filter(Boolean).join(', ') || null,
      cover_url: cache.profile?.cover_url || null,
      avatar_url: cache.profile?.avatar_url || null,
      website_url: cache.profile?.links?.web || null,
      status: 'pending',
      is_published: true
    };
    const { data, error } = await client.from('cultural_profiles').insert(row).select('*').single();
    if (error) throw error;
    cache.culturalProfiles.push(data);
    return data;
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


  function mapPostRow(p) {
    return {
      id: p.id,
      authorId: p.author_id,
      culturalProfileId: p.cultural_profile_id,
      type: p.post_type || 'text',
      media: p.media_urls || (p.image_url ? [p.image_url] : []),
      title: p.title || '',
      description: p.body || '',
      category: p.category || '',
      contentPurpose: p.content_purpose || '',
      territory: p.territory || '',
      tags: p.tags || [],
      timestamp: p.created_at,
      likes: p.like_count || 0,
      commentsCount: p.comment_count || 0,
      isEditorial: !!p.is_editorial,
      sourceLabel: p.source_label || '',
      sourceUrl: p.source_url || ''
    };
  }

  async function listPosts(reset = true) {
    const from = reset ? 0 : cache.posts.length;
    const to = from + cache.postPageSize - 1;
    const { data, error } = await client.from('cultural_posts')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    const mapped = (data || []).map(mapPostRow);
    cache.posts = reset ? mapped : [...cache.posts, ...mapped.filter(p => !cache.posts.some(x => x.id === p.id))];
    cache.postsExhausted = mapped.length < cache.postPageSize;
    return cache.posts;
  }

  async function loadMorePosts() {
    if (cache.postsExhausted) return cache.posts;
    return listPosts(false);
  }

  async function createPost(payload) {
    const uid = cache.session?.user?.id;
    if (!uid) throw new Error('Debes iniciar sesión.');
    const row = {
      cultural_profile_id: payload.cultural_profile_id || null,
      author_id: uid,
      title: payload.title || null,
      body: payload.description || '',
      image_url: payload.media?.[0] || null,
      post_type: payload.type || 'text',
      media_urls: payload.media || [],
      category: payload.category || null,
      content_purpose: payload.contentPurpose || null,
      territory: payload.territory || null,
      tags: payload.tags || [],
      is_published: true
    };
    const { data, error } = await client.from('cultural_posts').insert(row).select('*').single();
    if (error) throw error;
    await listPosts();
    return data;
  }

  async function deletePost(postId) {
    const { error } = await client.from('cultural_posts').delete().eq('id', postId);
    if (error) throw error;
    await listPosts();
  }

  async function loadPostInteractions() {
    const uid = cache.session?.user?.id;
    if (!uid) {
      cache.likes = [];
      cache.saves = [];
      cache.comments = [];
      return;
    }
    const [{ data: likes, error: lErr }, { data: saves, error: sErr }] = await Promise.all([
      client.from('post_likes').select('post_id').eq('user_id', uid),
      client.from('post_saves').select('post_id').eq('user_id', uid)
    ]);
    if (lErr) throw lErr;
    if (sErr) throw sErr;
    cache.likes = (likes || []).map(x => x.post_id);
    cache.saves = (saves || []).map(x => x.post_id);
  }

  async function toggleLike(postId) {
    const uid = cache.session?.user?.id;
    if (!uid) throw new Error('Debes iniciar sesión.');
    const exists = cache.likes.includes(postId);
    const query = exists
      ? client.from('post_likes').delete().eq('user_id', uid).eq('post_id', postId)
      : client.from('post_likes').insert({ user_id: uid, post_id: postId });
    const { error } = await query;
    if (error) throw error;
    await loadPostInteractions();
    await listPosts();
    return !exists;
  }

  async function toggleSavePost(postId) {
    const uid = cache.session?.user?.id;
    if (!uid) throw new Error('Debes iniciar sesión.');
    const exists = cache.saves.includes(postId);
    const query = exists
      ? client.from('post_saves').delete().eq('user_id', uid).eq('post_id', postId)
      : client.from('post_saves').insert({ user_id: uid, post_id: postId });
    const { error } = await query;
    if (error) throw error;
    await loadPostInteractions();
    return !exists;
  }

  async function listComments(postId) {
    const { data, error } = await client.from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    cache.comments = cache.comments.filter(c => c.post_id !== postId).concat(data || []);
    return data || [];
  }

  async function addComment(postId, body) {
    const uid = cache.session?.user?.id;
    if (!uid) throw new Error('Debes iniciar sesión.');
    const { data, error } = await client.from('post_comments')
      .insert({ user_id: uid, post_id: postId, body })
      .select('*')
      .single();
    if (error) throw error;
    await listComments(postId);
    await listPosts();
    return data;
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

  const UPLOAD_RULES = {
    avatars: {
      maxBytes: 5 * 1024 * 1024,
      mime: ['image/jpeg','image/png','image/webp']
    },
    covers: {
      maxBytes: 8 * 1024 * 1024,
      mime: ['image/jpeg','image/png','image/webp']
    },
    'post-media': {
      maxBytes: 50 * 1024 * 1024,
      mime: ['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime']
    }
  };

  function validateUpload(bucket, file) {
    const rules = UPLOAD_RULES[bucket];
    if (!rules) throw new Error('Destino de archivo no permitido.');
    if (!(file instanceof File)) throw new Error('Selecciona un archivo válido.');
    if (!rules.mime.includes(file.type)) {
      throw new Error('Formato no permitido. Usa JPG, PNG, WEBP, MP4, WEBM o MOV según el tipo de contenido.');
    }
    if (file.size <= 0 || file.size > rules.maxBytes) {
      const mb = Math.round(rules.maxBytes / 1024 / 1024);
      throw new Error(`El archivo supera el límite permitido de ${mb} MB.`);
    }
  }

  async function upload(bucket, file, nameHint='media') {
    const uid = cache.session?.user?.id;
    if (!uid) throw new Error('Debes iniciar sesión.');
    validateUpload(bucket, file);
    const extByMime = {
      'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp',
      'video/mp4':'mp4', 'video/webm':'webm', 'video/quicktime':'mov'
    };
    const ext = extByMime[file.type];
    const safe = nameHint.replace(/[^a-z0-9-_]/gi,'-').toLowerCase();
    const path = `${uid}/${Date.now()}-${safe}.${ext}`;
    const { error } = await client.storage.from(bucket).upload(path, file, {
      upsert: false,
      contentType: file.type,
      cacheControl: '3600'
    });
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
    listPublicProfiles, ensureCreatorCulturalProfile,
    listCulturalProfiles, findCulturalProfile,
    myFollows, toggleFollow, myFavorites, toggleFavorite,
    listPosts, loadMorePosts, createPost, deletePost, loadPostInteractions, toggleLike, toggleSavePost, listComments, addComment,
    submitClaim, report, upload, validateUpload, authRedirect, normaliseUser
  };
})();
