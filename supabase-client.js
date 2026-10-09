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

  // Clear account-scoped in-memory data between users and on logout.
  function clearPrivateCache() {
    cache.profile = null;
    cache.follows = [];
    cache.favorites = [];
    cache.likes = [];
    cache.saves = [];
    cache.comments = [];
  }

  let authStateRevision = 0;
  let restoreRequestId = 0;

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
    // A request started by a previous user must not restore their profile.
    if (cache.session?.user?.id !== authUser.id) return null;
    cache.profile = data || null;
    return normaliseUser(authUser, data);
  }

  async function restoreSession() {
    const requestedRevision = authStateRevision;
    const requestId = ++restoreRequestId;
    const { data, error } = await client.auth.getSession();
    // An older getSession response cannot overwrite a newer auth event or
    // restore request (particularly after cross-tab sign-out).
    if (requestedRevision !== authStateRevision || requestId !== restoreRequestId) return null;
    if (error) throw error;
    const previousUid = cache.session?.user?.id || null;
    const nextUid = data.session?.user?.id || null;
    cache.session = data.session || null;
    if (!nextUid || nextUid !== previousUid) clearPrivateCache();
    if (!nextUid) return null;
    return loadMyProfile(data.session.user);
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
    const previousUid = cache.session?.user?.id || null;
    const credentials = { email, password };
    if (captchaToken) credentials.options = { captchaToken };
    const { data, error } = await client.auth.signInWithPassword(credentials);
    if (error) throw error;
    cache.session = data.session || null;
    if (data.user?.id !== previousUid) clearPrivateCache();
    return loadMyProfile(data.user);
  }

  async function signUp(payload) {
    if (payload?.acceptedLegal !== true) throw new Error('Debes aceptar los documentos esenciales de ORIGEN para crear tu cuenta.');
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
    clearPrivateCache();
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

  async function updateMyProfile(changes, expectedUserId = null) {
    const uid = cache.session?.user?.id || null;
    if (!uid || (expectedUserId && expectedUserId !== uid)) throw new Error('La sesión cambió; vuelve a iniciar sesión antes de guardar.');
    const initiatingAuthUser = cache.session.user;
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
    // The save may have succeeded while another account signed in. Never
    // put account A's profile back in account B's cache.
    if (cache.session?.user?.id === uid) cache.profile = data;
    return normaliseUser(initiatingAuthUser, data);
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

    const displayName = cache.profile?.display_name || cache.session.user.email?.split('@')[0] || 'Agente Cultural';
    const slugBase = displayName.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'proveedor';
    const row = {
      owner_id: uid,
      slug: `${slugBase}-${uid.slice(0,8)}`,
      name: displayName,
      creator_type: 'Agente Cultural',
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
    if (cache.session?.user?.id !== uid) return [];
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
    if (cache.session?.user?.id !== uid) return [];
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

  // Public permalink resolver: never rely on the paginated feed cache and
  // never request unpublished material. Database RLS remains authoritative.
  async function getPublicPost(postId) {
    const id = String(postId || '');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return null;
    }
    const { data, error } = await client.from('cultural_posts')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .maybeSingle();
    if (error) throw error;
    return data?.is_published === true ? mapPostRow(data) : null;
  }

  async function createPost(payload, expectedUserId = null) {
    const uid = cache.session?.user?.id;
    if (!uid || (expectedUserId && expectedUserId !== uid)) throw new Error('La sesión cambió; vuelve a iniciar sesión antes de publicar.');
    if (cache.profile?.role !== 'creator') {
      throw new Error('La publicación en el feed cultural está disponible para Agentes Culturales durante esta beta.');
    }
    // Client-side guard against accidental publication without the two
    // declarations. Not authoritative: browser code can be bypassed.
    // Backend evidence/enforcement must be implemented and tested in staging.
    if (payload?.rightsAcknowledged !== true || payload?.culturalAcknowledged !== true) {
      throw new Error('Confirma derechos de contenido y autorizaciones culturales antes de publicar.');
    }
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
      // Backend contract: these declarations must be checked and recorded
      // atomically by the isolated staging database, not trusted as proof.
      // Production lacks these columns: NEVER deploy this beta client there
      // before the approved, separately tested backend migration.
      rights_acknowledged: true,
      cultural_acknowledged: true,
      is_published: true
    };
    const { data, error } = await client.from('cultural_posts').insert(row).select('*').single();
    if (error) throw error;
    // A successful insert should not be reported as a failure just because
    // the user switched accounts while the response was in flight.
    if (cache.session?.user?.id === uid) await listPosts();
    return data;
  }

  async function deletePost(postId) {
    const uid = cache.session?.user?.id;
    if (!uid) throw new Error('Debes iniciar sesión.');

    const { data: existing, error: readError } = await client.from('cultural_posts')
      .select('id,author_id,media_urls,image_url')
      .eq('id', postId)
      .eq('author_id', uid)
      .maybeSingle();
    if (readError) throw readError;
    if (!existing) throw new Error('No tienes permiso para eliminar esta publicación.');

    // RLS is authoritative; enforce ownership in the client query as defense in depth.
    const { data: deleted, error } = await client.from('cultural_posts')
      .delete()
      .eq('id', postId)
      .eq('author_id', uid)
      .select('id');
    if (error) throw error;
    if (!deleted?.length) throw new Error('No se pudo eliminar la publicación.');

    // Public Storage object URLs remain reachable even when their post is
    // removed. Await all known managed-media deletions before describing the
    // outcome to the author. Also include legacy image_url, not just media_urls.
    const media = [...new Set([
      ...(Array.isArray(existing.media_urls) ? existing.media_urls : []),
      existing.image_url
    ].filter(Boolean))];
    const results = await Promise.allSettled(media.map(url => {
      // Removing a post must never delete an avatar or profile-cover asset,
      // even if a post row references one of the author's own media URLs.
      const parsed = parseManagedMediaUrl(url);
      return parsed?.bucket === 'post-media' ? removeOwnMedia(url) : false;
    }));
    const unresolvedMediaCount = results.filter(result =>
      result.status !== 'fulfilled' || result.value !== true
    ).length;
    if (unresolvedMediaCount) {
      console.warn('ORIGEN post removed; some public media cleanup could not be confirmed.');
    }

    // The database DELETE was already confirmed. A feed refresh failure must
    // not turn it into a false "post not deleted" response.
    if (cache.session?.user?.id === uid) {
      cache.posts = cache.posts.filter(post => post.id !== postId);
      try {
        await listPosts();
      } catch (_) {
        console.warn('ORIGEN feed refresh unavailable after confirmed post removal.');
      }
    }
    return {
      postDeleted: true,
      mediaCleanup: !media.length ? 'no-media' : unresolvedMediaCount ? 'incomplete' : 'completed',
      unresolvedMediaCount
    };
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
    // An old account's slow API reply must not repopulate private state.
    if (cache.session?.user?.id !== uid) return;
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
    if (payload?.authority_declaration !== true) {
      throw new Error('Authority declaration is required before submitting a profile claim.');
    }
    const { data, error } = await client.from('profile_claims').insert({
      cultural_profile_id: payload.cultural_profile_id,
      claimant_user_id: uid,
      claimant_name: payload.claimant_name,
      relationship_role: payload.relationship_role,
      official_email: payload.official_email,
      official_url: payload.official_url || null,
      explanation: payload.explanation || null,
      authority_declaration: payload.authority_declaration
    }).select('id,status,created_at').single();
    if (error) throw error;
    return data;
  }

  const REPORT_REASONS = new Set([
    'cultural_rights', 'harassment', 'impersonation',
    'spam', 'copyright', 'other'
  ]);

  async function report(payload, expectedUserId = null) {
    // In-app moderation reports require an authenticated, unchanged session.
    // The unauthenticated cultural rights route prepares a separate email;
    // it never inserts a moderation_reports row.
    const uid = cache.session?.user?.id || null;
    if (!uid || (expectedUserId && expectedUserId !== uid)) {
      throw new Error('La sesión cambió; inicia sesión para enviar el reporte.');
    }
    if (payload?.target_type !== 'post' ||
        typeof payload.target_id !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,180}$/.test(payload.target_id)) {
      throw new Error('Selecciona una publicación válida para reportar.');
    }
    if (!REPORT_REASONS.has(payload.reason)) {
      throw new Error('Selecciona un motivo de reporte válido.');
    }
    if (typeof payload.details !== 'string' || payload.details.length > 6000) {
      throw new Error('El contexto del reporte excede el límite permitido.');
    }
    const { data, error } = await client.from('moderation_reports').insert({
      reporter_user_id: uid,
      target_type: 'post',
      target_id: payload.target_id,
      reason: payload.reason,
      details: payload.details.trim() || null
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

  function parseManagedMediaUrl(publicUrl) {
    try {
      const raw = String(publicUrl || '').trim();
      if (!raw) return null;

      // URL() normalises dot segments before pathname checks. Reject encoded
      // separators/dots and traversal in the raw input before parsing.
      if (/(?:^|\/)\.{1,2}(?:\/|$)/.test(raw) || /%(?:2e|2f|5c)/i.test(raw)) return null;

      const url = new URL(raw);
      if (url.origin !== new URL(PROJECT_URL).origin || url.username || url.password) return null;
      const match = url.pathname.match(/^\/storage\/v1\/object\/public\/(avatars|covers|post-media)\/(.+)$/);
      if (!match) return null;

      // Managed uploads use exactly: user-id/timestamp-safe-name.extension.
      const path = decodeURIComponent(match[2]);
      const segments = path.split('/');
      if (segments.length !== 2 || segments.some(segment => !segment || segment === '.' || segment === '..' || segment.includes('\\'))) return null;
      return { bucket: match[1], path };
    } catch {
      return null;
    }
  }

  async function removeOwnMedia(publicUrl) {
    const uid = cache.session?.user?.id;
    if (!uid) throw new Error('Debes iniciar sesión.');
    const parsed = parseManagedMediaUrl(publicUrl);
    if (!parsed) return false;
    if (!parsed.path.startsWith(uid + '/')) {
      throw new Error('No puedes eliminar archivos que no pertenecen a tu cuenta.');
    }
    const { data, error } = await client.storage.from(parsed.bucket).remove([parsed.path]);
    if (error) throw error;
    // Storage may answer with data: [] and error: null when no object was
    // actually removed (e.g. an RLS denial). Never call that successful cleanup.
    // The documented response is a list of deleted FileObjects.
    return Array.isArray(data) && data.some(file =>
      file && (file.name === parsed.path || file.path === parsed.path)
    );
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

  client.auth.onAuthStateChange((event, session) => {
    // Never call Supabase APIs inside this callback: an async query here can
    // deadlock subsequent Auth/database calls while Supabase holds its lock.
    const previousUid = cache.session?.user?.id || null;
    const nextUid = session?.user?.id || null;
    // Token refreshes for the same account must not cancel a pending
    // getSession/profile restoration. Identity changes and sign-out do.
    if (previousUid !== nextUid || event === 'SIGNED_OUT') authStateRevision++;
    cache.session = session || null;
    if (!nextUid || nextUid !== previousUid) clearPrivateCache();

    // Refresh profile data outside the Auth callback/lock. Token refreshes do
    // not need to cause another full UI/database reload.
    if (['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED', 'PASSWORD_RECOVERY'].includes(event)) {
      setTimeout(() => window.dispatchEvent(new CustomEvent('origen-auth-change')), 0);
    }
  });

  window.ORIGEN_API = {
    client, cache, restoreSession, signIn, signUp, signOut,
    resetPassword, updatePassword, updateMyProfile,
    listPublicProfiles, ensureCreatorCulturalProfile,
    listCulturalProfiles, findCulturalProfile,
    myFollows, toggleFollow, myFavorites, toggleFavorite,
    listPosts, loadMorePosts, getPublicPost, createPost, deletePost, loadPostInteractions, toggleLike, toggleSavePost, listComments, addComment,
    submitClaim, report, upload, removeOwnMedia, parseManagedMediaUrl, validateUpload, authRedirect, normaliseUser
  };
})();
