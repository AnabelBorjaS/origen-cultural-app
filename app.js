// ORIGEN Cultural — Red Social Cultural
// Supabase-backed beta architecture
(() => {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
     SEED DATA
  ═══════════════════════════════════════════════════════════ */
  const { creators, categories, impact } = window.ORIGEN_DATA;
  const SEED_POSTS = window.ORIGEN_DATA.posts || [];

  /* ═══════════════════════════════════════════════════════════
     DOM REFS
  ═══════════════════════════════════════════════════════════ */
  const $app    = document.getElementById('main-content');
  const $toast  = document.getElementById('toast');
  const $search = document.getElementById('search-dialog');
  const $report = document.getElementById('report-dialog');
  const $deletePost = document.getElementById('delete-post-dialog');

  /* ═══════════════════════════════════════════════════════════
     STATE
  ═══════════════════════════════════════════════════════════ */
  const state = {
    lang: localStorage.getItem('origen-lang') || 'es',
    activeCategory: 'Todos',
    query: '',
    regStep: 1,
    regData: {},
    createData: { type: 'photo', media: [], files: [], tags: [], contentPurpose: 'education', videoDurationSeconds: null },
    openComments: new Set(),
    carIdx: {},
    editAvatar: null,
    editCover: null,
    editAvatarPreview: null,
    editCoverPreview: null,
    user: null,
    authReady: false,
    feedLoading: false,
    publicStoryPost: null,
    // Ephemeral same-tab return path, never persisted or supplied to redirects.
    authReturnRoute: null,
    wellbeingMinutes: Number(localStorage.getItem('origen-wellbeing-minutes') || 120),
    wellbeingElapsedMs: 0,
    wellbeingLastTick: Date.now(),
    wellbeingNextPromptMs: null,
  };

  // Account-specific drafts must never survive a successful sign-out or
  // a switch to another user on the same browser/device.
  function releasePreview(url) {
    if (typeof url === 'string' && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  function clearAccountDrafts() {
    for (const url of [
      ...(state.createData.media || []),
      state.regData.avatar,
      state.regData.cover,
      state.editAvatarPreview,
      state.editCoverPreview
    ]) releasePreview(url);

    clearTimeout(bindCreatePost._prev);
    state.createData = { type: 'photo', media: [], files: [], tags: [], contentPurpose: 'education' };
    state.regStep = 1;
    state.regData = {}; // includes the unpersisted signup password
    state.authReturnRoute = null; // never reuse another account's redirect
    state.editAvatar = null;
    state.editCover = null;
    state.editAvatarPreview = null;
    state.editCoverPreview = null;
    state.openComments.clear();
    state.carIdx = {};
    // A moderation form opened for account A must never remain available
    // with its complaint text or target after a switch to account B.
    if ($report?.open) $report.close();
    document.getElementById('report-form')?.reset();
    if ($report) { delete $report.dataset.targetId; delete $report.dataset.targetType; }
    const reportStatus = document.getElementById('report-status');
    if (reportStatus) reportStatus.textContent = '';
  }

  /* ═══════════════════════════════════════════════════════════
     COPY / i18n
  ═══════════════════════════════════════════════════════════ */
  const copy = {
    es: {
      tagline: 'Conectando al mundo con sus raíces culturales.',
      intro: 'La red social cultural global donde personas, comunidades, negocios y organizaciones muestran quiénes son, qué representan y qué ofrecen al mundo.',
      exploreCta: 'Explorar culturas', createCta: 'Crear Perfil Cultural',
      visible: 'Origen Cultural no vende cultura: hace visible a quienes la mantienen viva.',
      manifest: 'La cultura no es un producto más. Es identidad, memoria, conocimiento y futuro.',
      featured: 'Historias culturales destacadas',
      featuredBody: 'Descubre perfiles creados para presentar la cultura con contexto, belleza, dignidad y conexión directa.',
      seeAll: 'Ver todos', pilot: 'Piloto Ecuador · visión global',
      creatorsTitle: 'Cultura viva, contada por sus protagonistas',
      creatorsBody: 'Explora perfiles de personas, comunidades y negocios que preservan, practican, recrean y comparten cultura.',
      impactTitle: 'Construyendo una infraestructura cultural global',
      impactBody: 'El piloto valida perfiles, descubrimiento y contacto directo antes de escalar funcionalidades sociales y monetización ética.',
      follow: 'Seguir', following: 'Siguiendo', save: 'Guardar', saved: 'Guardado', profile: 'Ver perfil',
      searchPlaceholder: 'Busca por cultura, tradición, territorio o agente cultural',
      noResults: 'No encontramos perfiles con esos criterios.',
      discover: 'Descubre culturas vivas',
      discoverSub: 'Busca por país, ciudad, categoría, tradición, oficio u oferta cultural.',
      passportTitle: 'Mi Pasaporte Cultural',
      passportSub: 'Una trayectoria personal de culturas descubiertas, perfiles guardados y aprendizajes compartidos.',
      impactPage: 'Impacto con dignidad cultural',
      impactPageSub: 'Medimos crecimiento sin reducir la cultura a una transacción.',
    },
    en: {
      tagline: 'Connecting the world with its cultural roots.',
      intro: 'The global cultural social network where people, communities, businesses and organisations show who they are, what they represent and what they offer the world.',
      exploreCta: 'Explore cultures', createCta: 'Create Cultural Profile',
      visible: 'Origen Cultural does not sell culture: it makes visible those who keep it alive.',
      manifest: 'Culture is not just another product. It is identity, memory, knowledge and future.',
      featured: 'Featured cultural stories',
      featuredBody: 'Discover profiles designed to present culture with context, beauty, dignity and direct connection.',
      seeAll: 'View all', pilot: 'Ecuador pilot · global vision',
      creatorsTitle: 'Living culture, told by its protagonists',
      creatorsBody: 'Explore profiles of people, communities and businesses that preserve, practise, recreate and share culture.',
      impactTitle: 'Building global cultural infrastructure',
      impactBody: 'The pilot validates profiles, discovery and direct contact before scaling social features and ethical monetisation.',
      follow: 'Follow', following: 'Following', save: 'Save', saved: 'Saved', profile: 'View profile',
      searchPlaceholder: 'Search culture, tradition, territory or cultural agent',
      noResults: 'No profiles match those criteria.',
      discover: 'Discover living cultures',
      discoverSub: 'Search by country, city, category, tradition, craft or cultural offering.',
      passportTitle: 'My Cultural Passport',
      passportSub: 'A personal journey of cultures discovered, profiles saved and learning shared.',
      impactPage: 'Impact with cultural dignity',
      impactPageSub: 'We measure growth without reducing culture to a transaction.',
    }
  };
  const t = k => (copy[state.lang] || copy.es)[k] || k;
  const l = (spanish, english) => state.lang === 'es' ? spanish : english;
  const SEED_PROFILE_COPY_EN = Object.freeze({
    pakarina: { type: 'Craft collective', category: 'Craft and tradition', short: 'Editorial pilot reference about embroidery and textile making connected to Yaruquí.', story: 'This is an ORIGEN pilot reference profile. An authorised representative must review, correct or adopt its content before it can be presented as official.', tags: ['Embroidery', 'Textiles', 'Living memory'] },
    chawar: { type: 'Cultural enterprise', category: 'Ancestral foodways', short: 'Editorial pilot reference about Andean agave and traditional practices connected to the territory.', story: 'This is an ORIGEN pilot reference profile. An authorised representative must review, correct or adopt its content before it can be presented as official.', tags: ['Andean agave', 'Foodways', 'Territory'] },
    'aji-de-piedra': { type: 'Cultural business', category: 'Traditional food', short: 'Editorial pilot reference about traditional food connected to Yaruquí.', story: 'This is an ORIGEN pilot reference profile. An authorised representative must review, correct or adopt its content before it can be presented as official.', tags: ['Traditional cooking', 'Recipes', 'Hospitality'] },
    'pushkana-runa': { type: 'Intercultural centre', category: 'Culture, embroidery and dance', short: 'Editorial pilot reference about intercultural activities related to embroidery, dance and cultural research.', story: 'This is an ORIGEN pilot reference profile. An authorised representative must review, correct or adopt its content before it can be presented as official.', tags: ['Intercultural practice', 'Embroidery', 'Dance'] }
  });
  const localizedSeedProfile = profile => state.lang === 'en' && profile && SEED_PROFILE_COPY_EN[profile.id] ? { ...profile, ...SEED_PROFILE_COPY_EN[profile.id] } : profile;

  /* ═══════════════════════════════════════════════════════════
     UTILS
  ═══════════════════════════════════════════════════════════ */
  function showToast(msg, ms = 2800) {
    $toast.textContent = msg;
    $toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => $toast.classList.remove('show'), ms);
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function esc(s) { const d = document.createElement('div'); d.textContent = String(s || ''); return d.innerHTML; }
  function safeExternalUrl(value) {
    try {
      const raw = String(value || '').trim();
      if (!raw) return '';
      if (/^mailto:/i.test(raw)) return raw;
      const u = new URL(raw, window.location.origin);
      if (!['http:','https:'].includes(u.protocol)) return '';
      return u.href;
    } catch {
      return '';
    }
  }
  function safeMediaUrl(value) {
    try {
      const raw = String(value || '').trim();
      if (!raw) return '';
      if (/^blob:/i.test(raw)) return raw;
      if (/^data:image\/(?:png|jpe?g|webp);base64,/i.test(raw)) return raw;
      const u = new URL(raw, window.location.href);
      if (!['http:','https:'].includes(u.protocol)) return '';
      return u.href;
    } catch {
      return '';
    }
  }
  function timeAgo(ts) {
    const s = (Date.now() - new Date(ts).getTime()) / 1000;
    if (s < 60)     return 'ahora';
    if (s < 3600)   return `${~~(s / 60)}m`;
    if (s < 86400)  return `${~~(s / 3600)}h`;
    if (s < 604800) return `${~~(s / 86400)}d`;
    return new Date(ts).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  }
  async function resizeImg(file, maxW = 900, q = 0.78) {
    return new Promise(resolve => {
      const r = new FileReader();
      r.onload = e => {
        const img = new Image();
        img.onload = () => {
          const sc = Math.min(1, maxW / img.width);
          const c  = document.createElement('canvas');
          c.width  = img.width  * sc;
          c.height = img.height * sc;
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', q));
        };
        img.src = e.target.result;
      };
      r.readAsDataURL(file);
    });
  }

  /* ═══════════════════════════════════════════════════════════
     AUTH
  ═══════════════════════════════════════════════════════════ */
  const me     = () => state.user;
  const isAuth = () => !!me();

  const captchaRuntime = {
    scriptPromise: null,
    widgets: new Map(),
    tokens: new Map()
  };

  function turnstileEnabled() {
    return !!String(window.ORIGEN_CONFIG?.turnstileSiteKey || '').trim();
  }

  function captchaSlot(action) {
    if (!turnstileEnabled()) return '';
    return `<div class="form-field full turnstile-field">
      <div id="turnstile-${action}" data-turnstile-action="${action}"></div>
      <p id="turnstile-${action}-status" class="form-note" role="status" aria-live="polite"></p>
    </div>`;
  }

  function loadTurnstile() {
    if (!turnstileEnabled()) return Promise.resolve(false);
    if (window.turnstile) return Promise.resolve(true);
    if (captchaRuntime.scriptPromise) return captchaRuntime.scriptPromise;

    captchaRuntime.scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-origen-turnstile]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true), { once: true });
        existing.addEventListener('error', () => reject(new Error('Turnstile no pudo cargarse.')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.origenTurnstile = 'true';
      script.addEventListener('load', () => resolve(true), { once: true });
      script.addEventListener('error', () => reject(new Error('Turnstile no pudo cargarse.')), { once: true });
      document.head.appendChild(script);
    });
    return captchaRuntime.scriptPromise;
  }

  async function mountTurnstile(action) {
    if (!turnstileEnabled()) return null;
    const container = document.getElementById(`turnstile-${action}`);
    if (!container) return null;
    const status = document.getElementById(`turnstile-${action}-status`);

    try {
      await loadTurnstile();
      const oldId = captchaRuntime.widgets.get(action);
      if (oldId !== undefined && window.turnstile?.remove) {
        try { window.turnstile.remove(oldId); } catch (_) {}
      }
      captchaRuntime.tokens.delete(action);
      const widgetId = window.turnstile.render(container, {
        sitekey: String(window.ORIGEN_CONFIG.turnstileSiteKey).trim(),
        action,
        theme: 'auto',
        size: 'flexible',
        language: state.lang === 'es' ? 'es' : 'en',
        'response-field': false,
        callback: token => {
          captchaRuntime.tokens.set(action, token);
          if (status) status.textContent = '';
        },
        'expired-callback': () => {
          captchaRuntime.tokens.delete(action);
          if (status) status.textContent = state.lang === 'es'
            ? 'La verificación expiró. Complétala nuevamente.'
            : 'Verification expired. Please complete it again.';
        },
        'error-callback': () => {
          captchaRuntime.tokens.delete(action);
          if (status) status.textContent = state.lang === 'es'
            ? 'No pudimos completar la verificación anti-bot.'
            : 'We could not complete the anti-bot verification.';
        }
      });
      captchaRuntime.widgets.set(action, widgetId);
      return widgetId;
    } catch (error) {
      if (status) status.textContent = error?.message || (state.lang === 'es'
        ? 'No pudimos cargar la verificación anti-bot.'
        : 'We could not load anti-bot verification.');
      return null;
    }
  }

  function requireCaptchaToken(action) {
    if (!turnstileEnabled()) return null;
    const token = captchaRuntime.tokens.get(action);
    if (!token) {
      throw new Error(state.lang === 'es'
        ? 'Completa la verificación anti-bot para continuar.'
        : 'Complete the anti-bot verification to continue.');
    }
    return token;
  }

  function resetTurnstile(action) {
    if (!turnstileEnabled()) return;
    captchaRuntime.tokens.delete(action);
    const widgetId = captchaRuntime.widgets.get(action);
    if (widgetId !== undefined && window.turnstile?.reset) {
      try { window.turnstile.reset(widgetId); } catch (_) {}
    }
  }

  async function doLogin(email, pw, captchaToken = null) {
    if (!window.ORIGEN_API) throw new Error('Servicio de autenticación no disponible.');
    const previousUid = state.user?.id || null;
    const user = await window.ORIGEN_API.signIn(email, pw, captchaToken);
    if (user?.id && user.id !== previousUid) clearAccountDrafts();
    state.user = user;
    await Promise.allSettled([
      window.ORIGEN_API.listCulturalProfiles(),
      window.ORIGEN_API.myFollows(),
      window.ORIGEN_API.myFavorites()
    ]);
    return user;
  }

  async function doRegister(data) {
    if (!window.ORIGEN_API) return { ok: false, error: 'Servicio de autenticación no disponible.' };

    // The Auth account is created before any optional profile media is uploaded.
    // Do not offer a retry of signUp after a post-registration upload failure.
    let result;
    try {
      result = await window.ORIGEN_API.signUp(data);
    } catch (error) {
      return { ok: false, error: error.message || 'No pudimos crear tu cuenta.' };
    }

    let setupWarning = null;
    if (result.session) {
      state.user = null;
      try {
        state.user = await window.ORIGEN_API.restoreSession();
        if (!state.user) throw new Error('New account session is not ready.');

        const uploaded = [];
        try {
          let avatar = state.user.avatar || '';
          let cover = state.user.cover || '';
          if (data.avatarFile instanceof File) {
            avatar = await window.ORIGEN_API.upload('avatars', data.avatarFile, 'avatar');
            uploaded.push(avatar);
          }
          if (data.coverFile instanceof File) {
            cover = await window.ORIGEN_API.upload('covers', data.coverFile, 'cover');
            uploaded.push(cover);
          }
          if (avatar || cover) {
            state.user = await window.ORIGEN_API.updateMyProfile({
              name: state.user?.name || data.name,
              location: data.location || state.user?.location,
              country: data.country || state.user?.country,
              city: data.city || state.user?.city,
              cityGeonameId: data.cityGeonameId || state.user?.cityGeonameId,
              citySubcountry: data.citySubcountry || state.user?.citySubcountry,
              culturalIdentity: data.culturalIdentity || state.user?.culturalIdentity,
              story: data.story || state.user?.story,
              categories: data.categories || state.user?.categories || [],
              links: data.links || state.user?.links || {},
              accountType: data.accountType,
              providerHeadline: data.providerHeadline || '',
              services: data.services || [],
              serviceDescription: data.serviceDescription || '',
              avatar,
              cover
            });
          }
        } catch (error) {
          setupWarning = 'media';
          console.warn('[ORIGEN] Optional registration media setup incomplete:', error);
          // Roll back newly uploaded files only; never delete existing profile media.
          if (uploaded.length) {
            const cleanup = await Promise.allSettled(
              uploaded.map(url => window.ORIGEN_API.removeOwnMedia(url))
            );
            if (cleanup.some(item => item.status !== 'fulfilled' || item.value !== true)) {
              console.warn('[ORIGEN] Registration media cleanup incomplete.');
            }
          }
        }
      } catch (error) {
        setupWarning = 'profile';
        console.warn('[ORIGEN] Post-signup profile setup incomplete:', error);
      }

      if (state.user) {
        await Promise.allSettled([
          window.ORIGEN_API.listCulturalProfiles(),
          window.ORIGEN_API.listPublicProfiles(),
          window.ORIGEN_API.ensureCreatorCulturalProfile(),
          window.ORIGEN_API.myFollows(),
          window.ORIGEN_API.myFavorites(),
          window.ORIGEN_API.listPosts(),
          window.ORIGEN_API.loadPostInteractions()
        ]);
      }
    }

    return { ok: true, ...result, setupWarning, profileReady: !result.session || !!state.user };
  }

  async function doLogout() {
    try {
      if (!window.ORIGEN_API) throw new Error('Authentication service unavailable.');
      await window.ORIGEN_API.signOut();
    } catch (error) {
      console.error('[ORIGEN] Sign-out failed:', error);
      showToast(state.lang === 'es'
        ? 'No se pudo cerrar sesión. Inténtalo de nuevo.'
        : 'Could not sign out. Please try again.');
      return;
    }
    clearAccountDrafts();
    state.user = null;
    updateShell();
    go('inicio');
  }

  function refreshSession() {}

  function remoteFollowRefs() {
    const api = window.ORIGEN_API;
    if (!api || !state.user) return [];
    return (api.cache.follows || []).map(id => {
      const p = api.cache.culturalProfiles.find(x => x.id === id);
      return p?.owner_id || p?.slug || id;
    });
  }

  function remoteFavoriteRefs() {
    const api = window.ORIGEN_API;
    if (!api || !state.user) return [];
    return (api.cache.favorites || []).map(id => {
      const p = api.cache.culturalProfiles.find(x => x.id === id);
      return p?.owner_id || p?.slug || id;
    });
  }

  async function culturalProfileId(ref) {
    const api = window.ORIGEN_API;
    if (!api) return null;
    let p = (api.cache.culturalProfiles || []).find(x => x.id === ref || x.slug === ref || x.owner_id === ref);
    if (!p) {
      await api.listCulturalProfiles();
      p = (api.cache.culturalProfiles || []).find(x => x.id === ref || x.slug === ref || x.owner_id === ref);
    }
    return p?.id || null;
  }

  function normalisePublicProvider(row) {
    if (!row) return null;
    const links = row.links || {};
    return {
      id: row.id,
      name: row.display_name || 'Agente Cultural',
      type: 'Agente Cultural',
      accountType: 'creator',
      category: (row.categories || [])[0] || 'Cultura',
      categories: row.categories || [],
      location: row.location || [row.city, row.city_subcountry, row.country].filter(Boolean).join(', '),
      country: row.country || '',
      city: row.city || '',
      cityGeonameId: row.city_geoname_id || '',
      citySubcountry: row.city_subcountry || '',
      culturalIdentity: row.cultural_identity || '',
      verified: false,
      profileStatus: 'pending',
      image: row.avatar_url || '',
      avatar: row.avatar_url || '',
      cover: row.cover_url || '',
      short: links?._provider?.headline || row.bio || 'Perfil cultural en ORIGEN',
      story: row.story || row.bio || '',
      tags: row.categories || [],
      links,
      providerHeadline: links?._provider?.headline || '',
      services: links?._provider?.services || [],
      serviceDescription: links?._provider?.description || '',
      website: links?.web || '',
      publicEmail: links?.email || '',
      publicWhatsapp: links?.whatsapp || '',
      followers: window.ORIGEN_API?.cache?.culturalProfiles?.find(cp => cp.owner_id === row.id)?.follower_count || 0,
      posts: [],
      _kind: 'user'
    };
  }

  function directoryProfiles() {
    const dynamic = (window.ORIGEN_API?.cache?.publicProfiles || []).map(normalisePublicProvider).filter(Boolean);
    const seen = new Set(dynamic.map(p => p.id));
    return [...dynamic, ...creators.filter(p => !seen.has(p.id))];
  }

  /* ═══════════════════════════════════════════════════════════
     PROFILES
  ═══════════════════════════════════════════════════════════ */
  function getProfile(id) {
    const c = creators.find(x => x.id === id);
    if (c) return { ...c, _kind: 'creator' };
    if (state.user && state.user.id === id) return { ...state.user, _kind: 'user' };
    const publicRow = (window.ORIGEN_API?.cache?.publicProfiles || []).find(x => x.id === id);
    if (publicRow) return normalisePublicProvider(publicRow);
    return null;
  }
  function avatarEl(profile, sz = 'md') {
    if (!profile) return `<div class="ava ava-${sz} ava-init">OC</div>`;
    const init = (profile.name || 'OC').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const src  = profile.avatar || profile.image;
    if (!src) return `<div class="ava ava-${sz} ava-init">${init}</div>`;
    return `<div class="ava ava-${sz}"><img src="${esc(safeMediaUrl(src) || 'assets/logo-mark.svg')}" alt="${esc(profile.name)}" data-avatar-fallback="${encodeURIComponent(init)}"></div>`;
  }
  // Trust labels are deliberately derived from controlled profile states.
  // An account/role alone never establishes identity, cultural authority,
  // community representation or endorsement by ORIGEN.
  function profileTrustInfo(profile) {
    const es = state.lang === 'es';
    const L = (spanish, english) => es ? spanish : english;
    const isReference = profile?.referenceProfile === true || profile?.profileStatus === 'reference';
    if (isReference) return {
      kind: 'reference',
      short: L('Referencia editorial', 'Editorial reference'),
      label: L('Perfil de referencia · no oficial', 'Reference profile · not official'),
      description: L(
        'Este perfil es una referencia editorial creada por ORIGEN. No está administrado ni verificado por la persona, comunidad u organización mencionada. Su aparición aquí no indica una alianza o representación oficial.',
        'This is an editorial reference created by ORIGEN. The person, community or organisation named has not managed or verified it. Inclusion does not imply a partnership or official representation.'
      )
    };
    if (profile?.profileStatus === 'verified' && profile?.verified === true) return {
      kind: 'verified',
      short: L('Verificación registrada', 'Verification recorded'),
      label: L('Perfil con verificación registrada', 'Profile with recorded verification'),
      description: L(
        'ORIGEN ha registrado una verificación para este perfil. Esto no certifica todo su contenido ni constituye una recomendación comercial.',
        'ORIGEN has recorded verification for this profile. This does not certify all content or constitute a commercial endorsement.'
      )
    };
    return {
      kind: 'unverified',
      short: L('Cuenta sin verificar', 'Unverified account'),
      label: L('Cuenta autogestionada · sin verificar', 'Self-managed account · unverified'),
      description: L(
        'Esta cuenta fue creada por un usuario. ORIGEN no ha verificado su identidad ni su autoridad para representar a una comunidad, negocio u organización. Revisa sus afirmaciones antes de compartir información o contactar.',
        'A user created this account. ORIGEN has not verified their identity or authority to represent a community, business or organisation. Check claims before sharing information or making contact.'
      )
    };
  }
  function profileTrustChip(profile) {
    const trust = profileTrustInfo(profile);
    return `<span class="profile-trust-chip profile-trust-${trust.kind}">${esc(trust.short)}</span>`;
  }
  function profileTrustNotice(profile) {
    const trust = profileTrustInfo(profile);
    const isReference = trust.kind === 'reference';
    const claimLink = isReference && profile?.claimable === true
      ? `<a href="#reclamar/${encodeURIComponent(profile.id)}">${state.lang === 'es' ? 'Solicitar gestión de este perfil' : 'Request management of this profile'} →</a>`
      : '';
    return `<aside class="profile-trust-notice profile-trust-${trust.kind}" aria-label="${esc(trust.label)}">
      <div>${profileTrustChip(profile)}<strong>${esc(trust.label)}</strong></div>
      <p>${esc(trust.description)}</p>
      <div class="profile-trust-links">${claimLink}<a href="#solicitar-revision/${profile?.referenceProfile === true || profile?.profileStatus === 'reference' ? 'perfil' : 'usuario'}/${encodeURIComponent(profile.id)}">${state.lang === 'es' ? 'Solicitar corrección o revisión' : 'Request correction or review'} →</a><a href="#confianza">${state.lang === 'es' ? 'Centro de confianza' : 'Trust Center'} →</a></div>
    </aside>`;
  }
  function verBadge(p) {
    return profileTrustInfo(p).kind === 'verified'
      ? `<span class="verified" title="${state.lang === 'es' ? 'Verificación registrada' : 'Verification recorded'}" aria-label="${state.lang === 'es' ? 'Verificación registrada' : 'Verification recorded'}">✓</span>`
      : '';
  }

  /* ═══════════════════════════════════════════════════════════
     POSTS
  ═══════════════════════════════════════════════════════════ */
  function allPosts() {
    const remote = window.ORIGEN_API?.cache?.posts || [];
    return [...remote, ...SEED_POSTS].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
  function feedPosts() {
    const user    = me();
    const all     = allPosts();
    if (!user) return all.slice(0, 10);
    const follows = remoteFollowRefs();
    const mine    = all.filter(p => p.authorId === user.id || follows.includes(p.authorId));
    const disc    = all.filter(p => p.authorId !== user.id && !follows.includes(p.authorId));
    return [...mine, ...disc];
  }

  /* ═══════════════════════════════════════════════════════════
     SOCIAL LINKS COMPONENT
  ═══════════════════════════════════════════════════════════ */
  function socialLinksHtml(profile) {
    if (!profile.links || !Object.keys(profile.links).length) return '';
    const icons = { instagram:'IG', facebook:'FB', tiktok:'TK', youtube:'YT', linkedin:'LI', whatsapp:'WA', email:'✉', web:'↗' };
    const allowed = new Set(['instagram','facebook','tiktok','youtube','linkedin','whatsapp','email','web']);
    const entries = Object.entries(profile.links)
      .filter(([k]) => allowed.has(k))
      .map(([k, v]) => [k, safeExternalUrl(v)])
      .filter(([, v]) => !!v);
    if (!entries.length) return '';
    return `<div class="external-links">${entries.map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener noreferrer"><span>${icons[k] || k}</span><span>${esc(k)}</span><span>↗</span></a>`).join('')}</div>`;
  }

  function contentPurposeLabel(value) {
    return ({
      education: state.lang === 'es' ? 'Educación cultural' : 'Cultural education',
      history: state.lang === 'es' ? 'Historia y memoria' : 'History and memory',
      technique: state.lang === 'es' ? 'Técnica / proceso' : 'Technique / process',
      territory: state.lang === 'es' ? 'Territorio' : 'Territory',
      language: state.lang === 'es' ? 'Lengua' : 'Language',
      gastronomy: state.lang === 'es' ? 'Gastronomía' : 'Gastronomy',
      arts: state.lang === 'es' ? 'Artes / expresión' : 'Arts / expression',
      heritage: state.lang === 'es' ? 'Patrimonio' : 'Heritage',
      community: state.lang === 'es' ? 'Comunidad' : 'Community',
      agent_discovery: state.lang === 'es' ? 'Descubrimiento de Agente Cultural' : 'Cultural Agent discovery',
      explorer_experience: state.lang === 'es' ? 'Experiencia de Explorador Cultural' : 'Cultural Explorer experience'
    })[value] || '';
  }

  /* ═══════════════════════════════════════════════════════════
     POST CARD COMPONENT
  ═══════════════════════════════════════════════════════════ */
  function postCard(post) {
    const user   = me();
    const author = getProfile(post.authorId);
    if (!author) return '';

    const liked      = !!(user && (window.ORIGEN_API?.cache?.likes || []).includes(post.id));
    const totalLikes = post.likes || 0;

    const coms = (window.ORIGEN_API?.cache?.comments || [])
      .filter(x => x.post_id === post.id)
      .map(x => ({ id:x.id, authorId:x.user_id, text:x.body, ts:x.created_at }));

    const saved = !!(user && (window.ORIGEN_API?.cache?.saves || []).includes(post.id));

    const myFollows  = user ? remoteFollowRefs() : [];
    const following  = myFollows.includes(post.authorId);
    const isOwn      = !!(user && user.id === post.authorId);

    const showComs = state.openComments.has(post.id);
    const shareable = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(post.id));
    const cidx     = Math.min(state.carIdx[post.id] || 0, (post.media || []).length - 1 || 0);

    /* media */
    let media = '';
    if ((post.type === 'photo' || post.type === 'carousel') && post.media && post.media.length) {
      const isCarousel = post.type === 'carousel' && post.media.length > 1;
      media = `<div class="post-media${isCarousel ? ' is-carousel' : ''}" data-pid="${esc(post.id)}">
        <img src="${esc(safeMediaUrl(post.media[cidx]))}" alt="${esc(post.title)}" loading="lazy">
        ${isCarousel ? `
          <div class="car-dots">${post.media.map((_, i) => `<button class="car-dot${i === cidx ? ' on' : ''}" data-car="${esc(post.id)}" data-ci="${i}" aria-label="Imagen ${i + 1}"></button>`).join('')}</div>
          ${cidx > 0 ? `<button class="car-btn car-l" data-car="${esc(post.id)}" data-cdir="-1" aria-label="Anterior">‹</button>` : ''}
          ${cidx < post.media.length - 1 ? `<button class="car-btn car-r" data-car="${esc(post.id)}" data-cdir="1" aria-label="Siguiente">›</button>` : ''}
          <span class="car-count">${cidx + 1} / ${post.media.length}</span>
        ` : ''}
      </div>`;
    } else if (post.type === 'video' && post.media && post.media.length) {
      media = `<div class="post-media"><video controls muted playsinline preload="metadata" src="${esc(safeMediaUrl(post.media[0]))}" aria-label="${esc(post.title || 'Video cultural')}"></video></div>`;
    }

    const authorHref = author._kind === 'creator' ? `#perfil/${author.id}` : `#usuario/${author.id}`;

    return `<article class="post-card${post.type === 'text' ? ' post-text' : ''}" data-pid="${esc(post.id)}">
      <div class="post-head">
        <a class="post-author-link" href="${esc(authorHref)}">
          ${avatarEl(author, 'sm')}
          <div class="post-author-info">
            <strong>${esc(author.name)} ${verBadge(author)}</strong>
            <span>${esc(author.type || author.accountType || 'Origen Cultural')}${post.territory ? ' · ' + esc(post.territory) : ''} · ${timeAgo(post.timestamp)}</span>
          </div>
        </a>
        <div class="post-head-r">
          ${user && !isOwn && !following ? `<button class="btn-follow-sm" data-fuser="${esc(post.authorId)}">+ Seguir</button>` : ''}
          ${user && !isOwn && following  ? `<button class="btn-follow-sm on" data-fuser="${esc(post.authorId)}">Siguiendo</button>` : ''}
          <button class="post-more-btn" data-pmore="${esc(post.id)}" aria-label="Más opciones">···</button>
        </div>
      </div>
      ${media}
      <div class="post-body${post.type === 'text' ? ' post-text-body' : ''}">
        <div class="post-context-chips">
          ${post.category ? `<span class="post-cat">${esc(post.category)}</span>` : ''}
          ${post.contentPurpose ? `<span class="post-purpose">${esc(contentPurposeLabel(post.contentPurpose))}</span>` : ''}
        </div>
        <h3 class="post-title">${shareable ? `<a href="#publicacion/${encodeURIComponent(post.id)}" aria-label="${state.lang === 'es' ? 'Abrir historia cultural' : 'Open cultural story'}: ${esc(post.title)}">${esc(post.title)}</a>` : esc(post.title)}</h3>
        <p class="post-desc">${esc(post.description)}</p>
        ${post.type === 'video' && post.audioAttribution ? `<p class="post-audio-credit"><strong>${L('Crédito de audio','Audio credit')}:</strong> ${esc(post.audioAttribution)}</p>` : ''}
        ${post.tags && post.tags.length ? `<div class="post-tags">${post.tags.map(tg => `<span>#${esc(tg)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="post-actions">
        <button class="pact like-btn${liked ? ' on' : ''}" data-like="${esc(post.id)}" ${!user ? 'data-needs-auth' : ''} aria-label="Me gusta">
          ${liked ? '♥' : '♡'}<span>${totalLikes}</span>
        </button>
        <button class="pact com-btn" data-tcoms="${esc(post.id)}" aria-label="Comentarios">
          ◎<span>${coms.length}</span>
        </button>
        <button class="pact save-btn${saved ? ' on' : ''}" data-save="${esc(post.id)}" ${!user ? 'data-needs-auth' : ''} aria-label="${saved ? 'Guardado' : 'Guardar'}">
          ${saved ? '◆' : '◇'}
        </button>
        ${shareable ? `<button class="pact share-btn" data-share="${esc(post.id)}" aria-label="${state.lang === 'es' ? 'Compartir esta historia' : 'Share this story'}">↗</button>` : ''}
        <button class="pact report-btn" data-report="${post.id}" aria-label="Reportar" style="margin-left:auto">⚑</button>
      </div>
      <div class="post-rights-link"><a href="#solicitar-revision/post/${encodeURIComponent(post.id)}">${state.lang === 'es' ? '¿Uso no autorizado? Solicitar revisión' : 'Unauthorised use? Request a review'}</a></div>
      ${showComs ? commentBlock(post.id, coms) : ''}
    </article>`;
  }

  function commentBlock(postId, coms) {
    const user = me();
    return `<div class="com-section" id="coms-${esc(postId)}">
      ${coms.slice(-10).map(c => {
        const a = getProfile(c.authorId);
        return `<div class="com-row">
          ${avatarEl(a, 'xs')}
          <div class="com-bubble">
            <strong>${esc(a ? a.name : 'Usuario')}</strong>
            <p>${esc(c.text)}</p>
            <time>${timeAgo(c.ts)}</time>
          </div>
        </div>`;
      }).join('')}
      ${user
        ? `<form class="com-form" data-cf="${esc(postId)}">
            ${avatarEl(user, 'xs')}
            <input type="text" name="text" placeholder="Añade un comentario..." required autocomplete="off">
            <button type="submit" aria-label="Publicar">→</button>
          </form>`
        : `<p class="com-login"><a href="#login">Inicia sesión</a> para comentar.</p>`}
    </div>`;
  }

  /* ═══════════════════════════════════════════════════════════
     STORIES ROW
  ═══════════════════════════════════════════════════════════ */
  function storiesRow() {
    const user     = me();
    const myFollow = user ? remoteFollowRefs() : [];
    const all      = directoryProfiles().slice(0, 14);
    return `<div class="stories-row"><div class="stories-scroll">
      ${user ? `<a class="story-item" href="#mi-perfil">
        <div class="story-ring own">${avatarEl(user, 'story')}</div>
        <span>Yo</span>
      </a>` : ''}
      ${all.map(a => {
        const isCreator = !!creators.find(c => c.id === a.id);
        const href      = isCreator ? `#perfil/${a.id}` : `#usuario/${a.id}`;
        const ring      = myFollow.includes(a.id) ? ' following' : '';
        return `<a class="story-item" href="${esc(href)}">
          <div class="story-ring${ring}">${avatarEl(a, 'story')}</div>
          <span>${esc((a.name || '').split(' ')[0])}</span>
        </a>`;
      }).join('')}
    </div></div>`;
  }

  /* ═══════════════════════════════════════════════════════════
     CREATOR CARD (directory)
  ═══════════════════════════════════════════════════════════ */
  function creatorCard(c) {
    c = localizedSeedProfile(c);
    const favs  = remoteFavoriteRefs();
    const saved = favs.includes(c.id);
    const href  = c._kind === 'user' ? `#usuario/${c.id}` : `#perfil/${c.id}`;
    const image = c.image || c.avatar || 'assets/logo-mark.svg';
    return `<article class="creator-card">
      <div class="creator-card-image">
        <a href="${esc(href)}" aria-label="${esc(t('profile'))}: ${esc(c.name)}"><img src="${esc(safeMediaUrl(image) || 'assets/logo-mark.svg')}" alt="${esc(c.name)}: ${esc(c.category)}" loading="lazy"></a>
        <button class="favorite-button ${saved ? 'active' : ''}" data-favorite="${esc(c.id)}" aria-pressed="${saved}">${saved ? '◆' : '◇'}</button>
      </div>
      <div class="creator-card-body">
        <div class="creator-meta"><span>${esc(c.type)}</span><span>${verBadge(c)} ${esc(c.location)}</span></div>
        ${c.culturalIdentity ? `<p class="form-note">${state.lang === 'es' ? 'Comparte:' : 'Shares:'} ${esc(c.culturalIdentity)}</p>` : ''}
        <h3><a href="${esc(href)}">${esc(c.name)}</a></h3>
        <div class="creator-trust-label">${profileTrustChip(c)}</div>
        <p>${esc(c.short)}</p>
        <div class="creator-tags">${(c.tags || []).map(tg => `<span>${esc(tg)}</span>`).join('')}</div>
        <div class="creator-card-footer"><span>${Intl.NumberFormat(state.lang === 'es' ? 'es' : 'en').format(c.followers || 0)} ${state.lang === 'es' ? 'seguidores' : 'followers'}</span><a class="link-arrow" href="${esc(href)}">${t('profile')}</a></div>
      </div>
    </article>`;
  }

  /* ═══════════════════════════════════════════════════════════
     FOOTER
  ═══════════════════════════════════════════════════════════ */
  function footer() {
    const es = state.lang === 'es';
    return `<footer class="footer"><div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand"><img src="assets/logo-lockup.svg" alt="Origen Cultural"><p>${t('tagline')}<br><br>${es ? 'Una red social cultural para descubrir, seguir y valorar culturas vivas.' : 'A cultural social network to discover, follow and celebrate living cultures.'}</p></div>
        <div><h4>${es ? 'Explorar' : 'Explore'}</h4><div class="footer-links"><a href="#explorar">${es ? 'Perfiles culturales' : 'Cultural profiles'}</a><a href="#feed">${es ? 'Feed cultural' : 'Cultural feed'}</a><a href="#pasaporte">${es ? 'Pasaporte Cultural' : 'Cultural Passport'}</a></div></div>
        <div><h4>${es ? 'Proyecto' : 'Project'}</h4><div class="footer-links"><a href="#impacto">${es ? 'Impacto' : 'Impact'}</a><a href="#confianza">${es ? 'Centro de confianza' : 'Trust Center'}</a><a href="#registro">${es ? 'Unirse' : 'Join'}</a><a href="mailto:info.origencultural@gmail.com">${es ? 'Contacto' : 'Contact'}</a></div></div>
        <div><h4>Social</h4><div class="footer-links"><a href="https://www.instagram.com/origen.cultural" target="_blank" rel="noreferrer">Instagram</a><a href="#">Facebook</a><a href="#">TikTok</a></div></div>
      </div>
      <div class="footer-bottom"><span>© 2026 Origen Cultural. ${es ? 'Todos los derechos reservados.' : 'All rights reserved.'}</span><span>${es ? 'Beta controlada · Datos sincronizados con Supabase' : 'Controlled beta · Data synced with Supabase'}</span></div>
    </div></footer>`;
  }

  function enhanceAccessibility() {
    let seq = 0;
    document.querySelectorAll('.form-field').forEach(field => {
      const label = field.querySelector(':scope > label');
      const control = field.querySelector(':scope > input, :scope > textarea, :scope > select');
      if (!label || !control) return;
      if (!control.id) control.id = `origen-field-${++seq}`;
      label.setAttribute('for', control.id);
    });

    document.querySelectorAll('input[placeholder="Añade un comentario..."]').forEach(input => {
      if (!input.getAttribute('aria-label')) {
        input.setAttribute('aria-label', state.lang === 'es' ? 'Añadir comentario' : 'Add comment');
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     SHELL / NAV
  ═══════════════════════════════════════════════════════════ */
  function updateStaticLanguage() {
    const es = state.lang === 'es';
    const setText = (selector, esText, enText) => {
      const el = document.querySelector(selector);
      if (el) el.textContent = es ? esText : enText;
    };

    setText('#skip-link', 'Saltar al contenido', 'Skip to content');
    const pageDescription = document.querySelector('meta[name="description"]');
    if (pageDescription) pageDescription.content = es ? 'Origen Cultural: red social cultural global para descubrir, seguir y valorar culturas vivas.' : 'Origen Cultural: a global cultural social network to discover, follow and celebrate living cultures.';
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.content = es ? 'Conectando al mundo con sus raíces culturales.' : 'Connecting the world with its cultural roots.';
    setText('#connection-status-text',
      'Parece que estás sin conexión. El registro, las publicaciones y los cambios de cuenta requieren internet.',
      'You appear to be offline. Registration, posting and account changes require internet.');
    setText('#drawer-manifesto',
      'La cultura no es un producto más. Es identidad, memoria, conocimiento y futuro.',
      'Culture is not just another product. It is identity, memory, knowledge and future.');
    setText('#search-eyebrow', 'DESCUBRIR', 'DISCOVER');
    setText('#search-title', 'Busca cultura viva', 'Search living culture');
    setText('#delete-post-eyebrow', 'PUBLICACIÓN', 'POST');
    setText('#delete-post-title', 'Eliminar publicación', 'Delete post');
    setText('#delete-post-copy',
      'Esta acción eliminará la publicación de ORIGEN y limpiará su media gestionada cuando pertenezca a tu cuenta.',
      'This will remove the post from ORIGEN and clean its managed media when it belongs to your account.');
    setText('#delete-post-cancel', 'Cancelar', 'Cancel');
    setText('#delete-post-confirm', 'Eliminar publicación', 'Delete post');
    setText('#report-eyebrow', 'SEGURIDAD Y COMUNIDAD', 'SAFETY & COMMUNITY');
    setText('#report-title', 'Reportar contenido', 'Report content');
    setText('#report-copy',
      'Cuéntanos qué ocurre. ORIGEN revisará el reporte sin transferir automáticamente ninguna sanción.',
      'Tell us what happened. ORIGEN will review the report without automatically applying a penalty.');
    setText('#report-reason-label', 'Motivo *', 'Reason *');
    setText('#report-details-label', 'Contexto adicional (opcional)', 'Additional context (optional)');
    setText('#report-cancel', 'Cancelar', 'Cancel');
    setText('#report-submit', 'Enviar reporte', 'Submit report');
    setText('#wellbeing-eyebrow', 'BIENESTAR DIGITAL', 'DIGITAL WELLBEING');
    setText('#wellbeing-title', 'Una pausa también es parte del viaje.', 'A pause is part of the journey too.');
    setText('#wellbeing-copy',
      'Has llegado al objetivo diario de bienestar de ORIGEN. Puedes tomar un descanso, continuar un poco más o desactivar este recordatorio.',
      'You have reached ORIGEN’s daily wellbeing target. You can take a break, continue a little longer, or disable this reminder.');
    setText('[data-wellbeing="break"]', 'Tomar un descanso', 'Take a break');
    setText('[data-wellbeing="snooze"]', 'Seguir 15 minutos', 'Continue 15 minutes');
    setText('[data-wellbeing="off"]', 'Desactivar recordatorios', 'Turn off reminders');
    setText('#wellbeing-note',
      'ORIGEN no usa rachas ni recompensas por permanecer conectado.',
      'ORIGEN does not use streaks or rewards for staying connected.');

    const reportReason = document.getElementById('report-reason');
    if (reportReason) {
      const labels = state.lang === 'es'
        ? {
            '': 'Selecciona un motivo',
            cultural_rights: 'Derechos culturales / conocimiento sensible',
            harassment: 'Acoso, odio o amenazas',
            impersonation: 'Suplantación o identidad falsa',
            spam: 'Spam, fraude o contenido engañoso',
            copyright: 'Copyright / propiedad intelectual',
            other: 'Otro'
          }
        : {
            '': 'Select a reason',
            cultural_rights: 'Cultural rights / sensitive knowledge',
            harassment: 'Harassment, hate or threats',
            impersonation: 'Impersonation or false identity',
            spam: 'Spam, fraud or misleading content',
            copyright: 'Copyright / intellectual property',
            other: 'Other'
          };
      [...reportReason.options].forEach(option => { option.textContent = labels[option.value] || option.value; });
    }

    const search = document.getElementById('global-search');
    if (search) {
      search.placeholder = es
        ? 'Busca tradición, territorio, oficio o agente cultural...'
        : 'Search tradition, territory, craft or cultural agent...';
      search.setAttribute('aria-label', es ? 'Buscar cultura viva' : 'Search living culture');
    }

    document.getElementById('brand-home')?.setAttribute(
      'aria-label',
      es ? 'Origen Cultural, inicio' : 'Origen Cultural, home'
    );
    document.querySelector('.desktop-nav')?.setAttribute('aria-label', es ? 'Navegación principal' : 'Primary navigation');
    document.querySelector('.mobile-drawer nav')?.setAttribute('aria-label', es ? 'Navegación móvil' : 'Mobile navigation');
    document.getElementById('mobile-drawer')?.setAttribute('aria-label', es ? 'Menú de navegación' : 'Navigation menu');
    document.querySelector('.bottom-nav')?.setAttribute('aria-label', es ? 'Navegación inferior' : 'Bottom navigation');
  }

  function updateShell() {
    updateStaticLanguage();
    const user       = me();
    const dNav       = document.querySelector('.desktop-nav');
    const dDrawer    = document.querySelector('.mobile-drawer nav');
    const dBottom    = document.querySelector('.bottom-nav');
    const profileBtn = document.getElementById('profile-button');
    const langBtn    = document.getElementById('language-toggle');
    const es         = state.lang === 'es';

    document.documentElement.lang = state.lang;
    if (langBtn) {
      langBtn.textContent = es ? 'EN' : 'ES';
      langBtn.setAttribute('aria-label', es ? 'Cambiar idioma a inglés' : 'Switch language to Spanish');
    }
    document.getElementById('menu-button')?.setAttribute('aria-label', es ? 'Abrir menú' : 'Open menu');
    document.getElementById('close-menu')?.setAttribute('aria-label', es ? 'Cerrar menú' : 'Close menu');
    document.getElementById('search-button')?.setAttribute('aria-label', es ? 'Buscar' : 'Search');
    profileBtn?.setAttribute('aria-label', user
      ? (es ? 'Abrir mi perfil' : 'Open my profile')
      : (es ? 'Iniciar sesión' : 'Sign in'));

    if (user) {
      if (dNav) dNav.innerHTML = `
        <a href="#feed"      data-route-link="feed">Feed</a>
        <a href="#explorar"  data-route-link="explorar">${es ? 'Explorar' : 'Explore'}</a>
        <a href="#mundo"     data-route-link="mundo">${es ? 'Mundo Cultural' : 'Cultural World'}</a>
        <a href="#crear" data-route-link="crear">${es ? 'Crear' : 'Create'}</a>
        <a href="#guardados" data-route-link="guardados">${es ? 'Guardados' : 'Saved'}</a>
        ${user.role === 'admin' ? `<a href="#moderacion" data-route-link="moderacion">${es ? 'Moderación' : 'Moderation'}</a>` : ''}`;
      if (dDrawer) dDrawer.innerHTML = `
        <a href="#feed">Feed</a><a href="#explorar">${es ? 'Explorar' : 'Explore'}</a>
        <a href="#mundo">${es ? 'Mundo Cultural' : 'Cultural World'}</a>
        <a href="#crear">${es ? 'Crear publicación' : 'Create post'}</a>
        <a href="#guardados">${es ? 'Guardados' : 'Saved'}</a><a href="#mi-perfil">${es ? 'Mi perfil' : 'My profile'}</a>
        ${user.role === 'admin' ? `<a href="#moderacion">${es ? 'Moderación' : 'Moderation'}</a>` : ''}`;
      if (dBottom) dBottom.innerHTML = `<a href="#feed" data-route-link="feed"><span aria-hidden="true">⌂</span><small>Feed</small></a>
            <a href="#explorar" data-route-link="explorar"><span aria-hidden="true">⌕</span><small>${es ? 'Explorar' : 'Explore'}</small></a>
            <a class="create-action" href="#crear" data-route-link="crear"><span aria-hidden="true">＋</span><small>${es ? 'Crear' : 'Create'}</small></a>
            <a href="#mundo" data-route-link="mundo"><span aria-hidden="true">🌍</span><small>${es ? 'Mundo' : 'World'}</small></a>
            <a href="#mi-perfil" data-route-link="mi-perfil"><span aria-hidden="true">○</span><small>${es ? 'Perfil' : 'Profile'}</small></a>`;
      if (profileBtn) {
        const init = (user.name || 'OC').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        if (user.avatar) {
          profileBtn.style.backgroundImage = `url(${user.avatar})`;
          profileBtn.style.backgroundSize  = 'cover';
          profileBtn.textContent = '';
        } else {
          profileBtn.style.backgroundImage = '';
          profileBtn.textContent = init;
        }
        profileBtn.onclick = () => go('mi-perfil');
      }
    } else {
      if (dNav) dNav.innerHTML = `
        <a href="#inicio"   data-route-link="inicio">${es ? 'Inicio' : 'Home'}</a>
        <a href="#explorar" data-route-link="explorar">${es ? 'Explorar' : 'Explore'}</a>
        <a href="#mundo"    data-route-link="mundo">${es ? 'Mundo Cultural' : 'Cultural World'}</a>
        <a href="#pasaporte" data-route-link="pasaporte">${es ? 'Pasaporte Cultural' : 'Cultural Passport'}</a>
        <a href="#impacto"  data-route-link="impacto">${es ? 'Impacto' : 'Impact'}</a>`;
      if (dDrawer) dDrawer.innerHTML = `
        <a href="#inicio">${es ? 'Inicio' : 'Home'}</a><a href="#explorar">${es ? 'Explorar' : 'Explore'}</a>
        <a href="#mundo">${es ? 'Mundo Cultural' : 'Cultural World'}</a>
        <a href="#pasaporte">${es ? 'Pasaporte Cultural' : 'Cultural Passport'}</a>
        <a href="#impacto">${es ? 'Impacto' : 'Impact'}</a><a href="#registro">${es ? 'Crear Perfil Cultural' : 'Create Cultural Profile'}</a>`;
      if (dBottom) dBottom.innerHTML = `
        <a href="#inicio"   data-route-link="inicio"><span aria-hidden="true">⌂</span><small>${es ? 'Inicio' : 'Home'}</small></a>
        <a href="#explorar" data-route-link="explorar"><span aria-hidden="true">⌕</span><small>${es ? 'Explorar' : 'Explore'}</small></a>
        <a class="create-action" href="#registro" data-route-link="registro"><span aria-hidden="true">＋</span><small>${es ? 'Crear' : 'Create'}</small></a>
        <a href="#mundo"    data-route-link="mundo"><span aria-hidden="true">🌍</span><small>${es ? 'Mundo' : 'World'}</small></a>
        <a href="#login"    data-route-link="login"><span aria-hidden="true">○</span><small>${es ? 'Entrar' : 'Sign in'}</small></a>`;
      if (profileBtn) {
        profileBtn.style.backgroundImage = '';
        profileBtn.textContent = '○';
        profileBtn.onclick = () => go('login');
      }
    }

    const r    = currentRoute();
    const base = r.startsWith('perfil/') || r.startsWith('usuario/') ? 'explorar' : r;
    document.querySelectorAll('[data-route-link]').forEach(a => {
      const active = a.dataset.routeLink === base;
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  /* ═══════════════════════════════════════════════════════════
     VIEWS
  ═══════════════════════════════════════════════════════════ */

  /* ── LANDING ─────────────────────────────────────────────── */
  function landingView() {
    const es = state.lang === 'es';
    const featured = directoryProfiles().slice(0, 5).map(localizedSeedProfile);
    const manifesto = t('manifest');
    const manifestoEmphasis = es ? 'identidad, memoria, conocimiento y futuro' : 'identity, memory, knowledge and future';
    return `
    <!-- HERO GLOBE -->
    <section class="hero-globe-section">
      <div class="hero-globe-copy">
        <p class="eyebrow">${es ? 'RED SOCIAL CULTURAL GLOBAL' : 'GLOBAL CULTURAL SOCIAL NETWORK'}</p>
        <div class="hero-wordmark">
          <span class="hwm-origen">ORIGEN</span>
          <span class="hwm-cultural">CULTURAL</span>
        </div>
        <p class="hero-tagline">${t('tagline')}</p>
        <p class="hero-desc">${t('intro')}</p>
        <div class="hero-globe-actions">
          <a class="btn light hga-primary" href="#mundo">🌍&nbsp; ${es ? 'Explorar el mundo cultural' : 'Explore the cultural world'}</a>
          <a class="btn hga-outline" href="#registro">${es ? 'Compartir mi cultura' : 'Share my culture'}</a>
        </div>
        <a href="#login" class="hero-login-link">${es ? '¿Ya tienes cuenta? Entrar →' : 'Already have an account? Sign in →'}</a>
        <div class="hero-globe-stats">
          <div class="hero-gstat"><strong>6</strong><span>${es ? 'Territorios explorables' : 'Territories to explore'}</span></div>
          <div class="hero-gstat-div"></div>
          <div class="hero-gstat"><strong>4</strong><span>${es ? 'Perfiles de referencia' : 'Reference profiles'}</span></div>
          <div class="hero-gstat-div"></div>
          <div class="hero-gstat"><strong>Beta</strong><span>${es ? 'Controlada' : 'Controlled pilot'}</span></div>
        </div>
      </div>
      <div class="hero-globe-right">
        <div class="hero-globe-container" id="hero-globe-container"></div>
        <div class="hero-globe-popup" id="hero-globe-popup" hidden></div>
        <div class="hero-globe-ui">
          <div class="hero-globe-ctrl-bar">
            <button id="hero-globe-pause" class="hero-ctrl-btn" title="${es ? 'Pausar / Reanudar rotación' : 'Pause / Resume rotation'}" aria-label="${es ? 'Pausar o reanudar rotación' : 'Pause or resume rotation'}">⏸</button>
            <button id="hero-globe-zoom-in" class="hero-ctrl-btn" title="${es ? 'Acercar' : 'Zoom in'}" aria-label="${es ? 'Acercar globo' : 'Zoom in on globe'}">+</button>
            <button id="hero-globe-zoom-out" class="hero-ctrl-btn" title="${es ? 'Alejar' : 'Zoom out'}" aria-label="${es ? 'Alejar globo' : 'Zoom out on globe'}">−</button>
          </div>
          <a href="#mundo" class="hero-mundo-link">${es ? 'Mundo Cultural completo' : 'Explore the full Cultural World'} →</a>
        </div>
        <p class="hero-globe-hint">${es ? 'Toca un país para explorar su cultura' : 'Select a country to explore its culture'}</p>
        <div class="hero-globe-territories">
          ${[['ecuador','🇪🇨','Ecuador'],['australia','🇦🇺','Australia'],['peru','🇵🇪',es ? 'Perú' : 'Peru'],['bolivia','🇧🇴','Bolivia'],['mexico','🇲🇽',es ? 'México' : 'Mexico'],['japan','🇯🇵',es ? 'Japón' : 'Japan']]
            .map(([k,f,n]) => `<button class="hgt-pill" data-hgt="${k}" title="${es ? 'Ver' : 'Explore'} ${n}">${f} ${n}</button>`).join('')}
        </div>
      </div>
    </section>

    <!-- MANIFESTO -->
    <section class="section manifesto">
      <div class="section-inner manifesto-grid">
        <p class="eyebrow">${es ? 'DECLARACIÓN FUNDACIONAL' : 'FOUNDING STATEMENT'}</p>
        <div>
          <p class="manifesto-quote">${manifesto.replace(manifestoEmphasis, `<em>${manifestoEmphasis}</em>`)}</p>
          <p class="manifesto-copy">${es ? 'Origen Cultural nace para que la cultura se muestre con el valor que merece: con contexto, autonomía, belleza, pertenencia y proyección global.' : 'Origen Cultural exists so culture can be seen for what it is worth: presented with context, autonomy, beauty, belonging and a global outlook.'}</p>
        </div>
      </div>
    </section>

    <!-- CURADURÍA -->
    <section class="section">
      <div class="section-inner">
        <div class="section-head">
          <div><p class="eyebrow">${es ? 'CURADURÍA CULTURAL' : 'CULTURAL CURATION'}</p><h2>${t('featured')}</h2></div>
          <div><p>${t('featuredBody')}</p><a class="link-arrow" href="#explorar">${t('seeAll')}</a></div>
        </div>
        <div class="story-grid">${featured.map(c => `<a class="story-card" href="${esc('#perfil/' + c.id)}"><img src="${esc(safeMediaUrl(c.image) || 'assets/logo-mark.svg')}" alt="${esc(c.name)}" loading="lazy"><div class="story-card-content"><div class="meta">${verBadge(c)} ${esc(c.category)} · ${esc(c.location)}</div><h3>${esc(c.name)}</h3><p>${esc(c.short)}</p></div></a>`).join('')}</div>
      </div>
    </section>

    <!-- CREADORES -->
    <section class="section" style="background:var(--grey-2)">
      <div class="section-inner">
        <div class="section-head"><div><p class="eyebrow">${es ? 'EXPLORAR' : 'EXPLORE'}</p><h2>${t('creatorsTitle')}</h2></div><p>${t('creatorsBody')}</p></div>
        <div class="creator-grid">${directoryProfiles().slice(0, 3).map(creatorCard).join('')}</div>
      </div>
    </section>

    <!-- IMPACTO -->
    <section class="section impact-band">
      <div class="section-inner">
        <div class="section-head"><div><p class="eyebrow">${es ? 'MVP · PILOTO ECUADOR' : 'MVP · ECUADOR PILOT'}</p><h2>${t('impactTitle')}</h2></div><p>${t('impactBody')}</p></div>
        <div class="impact-grid">${impact.map((i, index) => { const labels = ['Pilot reference profiles', 'Country in initial validation', 'Shared web backend and future apps', 'Profiles subject to consent and verification']; return `<div class="impact-item"><strong>${i.value}</strong><span>${es ? i.label : (labels[index] || i.label)}</span></div>`; }).join('')}</div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-panel">
      <img src="assets/images/mural.jpg" alt="${es ? 'Mural cultural' : 'Cultural mural'}">
      <div class="cta-content">
        <p class="eyebrow">${es ? 'AGENTES CULTURALES' : 'CULTURAL AGENTS'}</p>
        <h2>${es ? 'Tu historia cultural merece ser encontrada.' : 'Your cultural story deserves to be found.'}</h2>
        <p>${es ? 'Crea una presencia digital premium, conserva el control de tu narrativa y conecta con exploradores y aliados alrededor del mundo.' : 'Create a considered digital presence, stay in control of your story, and connect with explorers and partners around the world.'}</p>
        <a class="btn light" href="#registro">${es ? 'Empezar ahora' : 'Get started'}</a>
      </div>
    </section>
    ${footer()}`;
  }

  /* ── PUBLIC CULTURAL STORY (NO ACCOUNT REQUIRED) ─────────── */
  function publicStoryView() {
    const es = state.lang === 'es';
    return `<section class="section public-story-section"><div class="section-inner public-story-layout">
      <div class="public-story-heading">
        <p class="eyebrow">${es ? 'HISTORIA CULTURAL' : 'CULTURAL STORY'}</p>
        <h1>${es ? 'Una historia para descubrir y compartir' : 'A story to discover and share'}</h1>
        <p class="lead">${es ? 'Conoce a su Agente Cultural y explora otras historias reales.' : 'Meet its Cultural Agent and explore more real stories.'}</p>
      </div>
      <div id="public-story-content" role="status" aria-live="polite">
        <p>${es ? 'Buscando historia pública…' : 'Loading public story…'}</p>
      </div>
      <p><a class="btn secondary" href="#explorar">${es ? 'Descubrir Agentes Culturales' : 'Discover Cultural Agents'} →</a></p>
    </div></section>${footer()}`;
  }

  async function bindPublicStory(route) {
    const container = document.getElementById('public-story-content');
    if (!container) return;
    const es = state.lang === 'es';
    const showNotFound = () => {
      container.innerHTML = `<div class="empty-feed" role="status">
        <h2>${es ? 'Historia no disponible' : 'Story unavailable'}</h2>
        <p>${es ? 'Esta historia no existe, no es pública o ha sido retirada.' : 'This story does not exist, is not public, or has been removed.'}</p>
      </div>`;
    };
    const id = route.slice('publicacion/'.length);
    try {
      const post = await window.ORIGEN_API?.getPublicPost(id);
      if (!container.isConnected || currentRoute() !== route) return;
      if (!post) { showNotFound(); return; }
      // Profiles come from published and creator-only public data.
      // If a profile was unavailable on first load, refresh that list once.
      if (!getProfile(post.authorId)) {
        await window.ORIGEN_API?.listPublicProfiles();
        if (!container.isConnected || currentRoute() !== route) return;
      }
      const card = postCard(post);
      if (!card) { showNotFound(); return; }
      container.removeAttribute('role');
      container.removeAttribute('aria-live');
      const visitorInvite = !isAuth() ? `<aside class="public-story-join" aria-label="${es ? 'Conectar con esta historia' : 'Connect with this story'}">
        <p>${es
          ? '¿Quieres guardar esta historia o seguir a su Agente Cultural? Puedes leerla sin cuenta.'
          : 'Want to save this story or follow its Cultural Agent? Reading does not require an account.'}</p>
        <a class="btn" data-story-login href="#login">${es ? 'Iniciar sesión para interactuar' : 'Sign in to interact'}</a>
      </aside>` : '';
      container.innerHTML = card + visitorInvite;
      state.publicStoryPost = post;
      // Only preserve a validated, currently visible cultural permalink. No
      // automatic follows, saves or post writes after sign-in.
      container.addEventListener('click', event => {
        if (isAuth() || currentRoute() !== route) return;
        const action = event.target.closest('[data-story-login], [data-needs-auth], .com-login a[href="#login"]');
        if (action && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
          state.authReturnRoute = 'publicacion/' + id;
        }
      }, true);
      bindPostInteractions();
      bindFollowButtons();
      bindFeedVideos();
    } catch (_) {
      if (!container.isConnected || currentRoute() !== route) return;
      container.innerHTML = `<div class="empty-feed" role="alert">
        <h2>${es ? 'No se pudo cargar la historia' : 'Could not load this story'}</h2>
        <p>${es ? 'Comprueba tu conexión e inténtalo de nuevo.' : 'Check your connection and try again.'}</p>
      </div>`;
    }
  }

  /* ── FEED ────────────────────────────────────────────────── */
  function feedView() {
    const es = state.lang === 'es';
    if (!isAuth()) return loginView();
    const posts = feedPosts();
    const user  = me();
    const myFollows = remoteFollowRefs();
    return `<div class="feed-layout">
      ${storiesRow()}
      <div class="feed-col">
        <div class="feed-hdr">
          <h2>${es ? 'Feed cultural' : 'Cultural feed'}</h2>
          <a class="btn" href="#crear" style="min-height:38px;padding:0 20px;font-size:11px;letter-spacing:.1em">＋ ${es ? 'Publicar' : 'Post'}</a>
        </div>
        <div id="feed-posts">
          ${posts.length
            ? posts.map(postCard).join('')
            : `<div class="empty-feed"><p>${es ? 'Sigue agentes culturales para ver su contenido aquí.' : 'Follow Cultural Agents to see their posts here.'}</p><a class="btn" href="#explorar">${es ? 'Explorar agentes culturales' : 'Explore Cultural Agents'}</a></div>`}
          ${posts.length ? `<div id="feed-sentinel" class="feed-sentinel${window.ORIGEN_API?.cache?.postsExhausted ? ' done' : ''}" aria-live="polite"></div>` : ''}
        </div>
      </div>
      <aside class="feed-aside">
        <div class="aside-card">
          <p class="eyebrow">${es ? 'DESCUBRIR' : 'DISCOVER'}</p>
          <h3>${es ? 'Agentes culturales' : 'Cultural Agents'}</h3>
          ${directoryProfiles().slice(0, 4).map(c => `<div class="aside-row">
            <a href="${esc('#perfil/' + c.id)}">${avatarEl(c, 'sm')}</a>
            <div class="aside-row-info"><a href="${esc('#perfil/' + c.id)}"><strong>${esc(c.name)}</strong></a><p>${esc(c.category)}</p></div>
            <button class="btn-follow-sm${myFollows.includes(c.id) ? ' on' : ''}" data-fuser="${esc(c.id)}">${myFollows.includes(c.id) ? (es ? 'Siguiendo' : 'Following') : (es ? '+ Seguir' : '+ Follow')}</button>
          </div>`).join('')}
          <a class="link-arrow" href="#explorar" style="display:block;margin-top:18px;font-size:12px">${es ? 'Ver todos' : 'View all'} →</a>
        </div>
        <div class="aside-card">
          <p class="eyebrow">${es ? 'CATEGORÍAS' : 'CATEGORIES'}</p>
          ${categories.slice(1).map(cat => { const names = { Artesanía: 'Crafts', Gastronomía: 'Food', Territorio: 'Territory', 'Música y danza': 'Music and dance', Comunidad: 'Community' }; return `<a href="#explorar" class="aside-cat">${es ? cat : (names[cat] || cat)}</a>`; }).join('')}
        </div>
        <div class="aside-card">
          <p class="eyebrow">${es ? 'MI PERFIL' : 'MY PROFILE'}</p>
          <div class="aside-row">
            ${avatarEl(user, 'sm')}
            <div class="aside-row-info"><strong>${esc(user.name)}</strong><p>${user.accountType === 'creator' ? (es ? 'Agente Cultural' : 'Cultural Agent') : (es ? 'Explorador Cultural' : 'Cultural Explorer')}</p></div>
          </div>
          <a href="#mi-perfil" class="link-arrow" style="display:block;margin-top:12px;font-size:12px">${es ? 'Ver mi perfil' : 'View my profile'} →</a>
        </div>
      </aside>
    </div>`;
  }

  /* ── EXPLORE ─────────────────────────────────────────────── */
  function exploreView() {
    const es = state.lang === 'es';
    return `<section class="page-hero">
      <div class="section-inner">
        <p class="eyebrow">${es ? 'DIRECTORIO CULTURAL' : 'CULTURAL DIRECTORY'}</p>
        <h1>${t('discover')}</h1>
        <p class="lead">${t('discoverSub')}</p>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        <div class="search-toolbar">
          <input id="explore-search" class="search-input" type="search" placeholder="${t('searchPlaceholder')}" value="${esc(state.query)}">
          <button class="btn" id="clear-filters">${es ? 'Limpiar filtros' : 'Clear filters'}</button>
        </div>
        <div class="category-strip" aria-label="${es ? 'Categorías' : 'Categories'}">
          ${categories.map(cat => { const labels = { Todos: 'All', Artesanía: 'Crafts', Gastronomía: 'Food', Territorio: 'Territory', 'Música y danza': 'Music and dance', Comunidad: 'Community' }; return `<button class="chip ${state.activeCategory === cat ? 'active' : ''}" data-category="${cat}">${es ? cat : (labels[cat] || cat)}</button>`; }).join('')}
        </div>
        <div id="explore-grid" class="creator-grid"></div>
      </div>
    </section>
    ${footer()}`;
  }
  function renderExploreGrid() {
    const grid = document.getElementById('explore-grid'); if (!grid) return;
    const q = state.query.toLowerCase().trim();
    const filtered = directoryProfiles().filter(c => {
      const catOk = state.activeCategory === 'Todos' || c.category.toLowerCase().includes(state.activeCategory.toLowerCase()) || c.tags.some(tg => tg.toLowerCase().includes(state.activeCategory.toLowerCase()));
      const qOk   = !q || [c.name, c.type, c.category, c.location, c.culturalIdentity, c.short, ...c.tags].join(' ').toLowerCase().includes(q);
      return catOk && qOk;
    });
    grid.innerHTML = filtered.length
      ? filtered.map(creatorCard).join('')
      : `<div class="empty-state"><h3>${t('noResults')}</h3><p>${state.lang === 'es' ? 'Prueba con otra categoría o palabra clave.' : 'Try another category or keyword.'}</p></div>`;
    bindFavorites();
  }

  /* ── CREATOR PROFILE ─────────────────────────────────────── */
  function creatorProfileView(id) {
    const c = localizedSeedProfile(creators.find(x => x.id === id));
    if (!c) return `<section class="section"><div class="section-inner"><h2>${state.lang === 'es' ? 'Perfil no encontrado' : 'Profile not found'}</h2><a class="btn" href="#explorar">${state.lang === 'es' ? 'Volver a explorar' : 'Back to explore'}</a></div></section>`;
    const user = me();
    const myFollows = user ? remoteFollowRefs() : [];
    const isFollowing = myFollows.includes(c.id);
    const favs  = remoteFavoriteRefs();
    const isSaved = favs.includes(c.id);
    const cPosts = allPosts().filter(p => p.authorId === c.id);
    return `<section class="profile-hero">
      <img class="profile-cover" src="${esc(safeMediaUrl(c.cover))}" alt="${state.lang === 'es' ? 'Portada de' : 'Cover image for'} ${esc(c.name)}">
      <div class="profile-hero-content">
        <img class="profile-avatar" src="${esc(safeMediaUrl(c.image))}" alt="${esc(c.name)}">
        <div class="profile-title">
          <p class="eyebrow">${esc(c.type)} · ${esc(c.location)}</p>
          <h1>${esc(c.name)} ${verBadge(c)}</h1>
          <p>${esc(c.category)} · ${Intl.NumberFormat(state.lang === 'es' ? 'es' : 'en').format(c.followers)} ${state.lang === 'es' ? 'seguidores' : 'followers'}</p>
        </div>
        <div class="profile-actions">
          <button class="btn light" data-fuser="${esc(c.id)}">${isFollowing ? t('following') : t('follow')}</button>
          <button class="btn" style="border-color:rgba(255,255,255,.4);color:#fff;background:rgba(255,255,255,.1)" data-favorite="${esc(c.id)}">${isSaved ? t('saved') : t('save')}</button>
        </div>
      </div>
    </section>
    <section class="profile-layout">
      <div>
        ${profileTrustNotice(c)}
        <div class="profile-story">
          <p class="eyebrow">${state.lang === 'es' ? 'SU HISTORIA CULTURAL' : 'THEIR CULTURAL STORY'}</p>
          <h2>${state.lang === 'es' ? 'Una puerta directa a su identidad' : 'A direct window into their identity'}</h2>
          <p>${esc(c.story)}</p>
          <div class="creator-tags">${c.tags.map(tg => `<span>${esc(tg)}</span>`).join('')}</div>
        </div>
        <div style="margin-top:60px">
          <p class="eyebrow">${state.lang === 'es' ? 'PUBLICACIONES' : 'POSTS'} (${cPosts.length || c.posts.length})</p>
          ${cPosts.length
            ? `<div id="creator-posts" style="margin-top:20px">${cPosts.map(postCard).join('')}</div>`
            : `<div class="posts-grid" style="margin-top:20px">${c.posts.map(p => `<article class="post-card"><div class="post-media"><img src="${esc(safeMediaUrl(p.image))}" alt="${esc(p.title)}" loading="lazy"></div><div class="post-body"><h3 class="post-title">${esc(p.title)}</h3><p class="post-desc">${esc(p.text)}</p></div></article>`).join('')}</div>`}
        </div>
      </div>
      <aside class="profile-aside">
        <p class="eyebrow">${state.lang === 'es' ? 'PERFIL CULTURAL' : 'CULTURAL PROFILE'}</p>
        <dl>
          <div><dt>${state.lang === 'es' ? 'Tipo' : 'Type'}</dt><dd>${esc(c.type)}</dd></div>
          <div><dt>${state.lang === 'es' ? 'Ubicación' : 'Location'}</dt><dd>${esc(c.location)}</dd></div>
          <div><dt>${state.lang === 'es' ? 'Estado del perfil' : 'Profile status'}</dt><dd>${esc(profileTrustInfo(c).label)}</dd></div>
        </dl>
        ${socialLinksHtml(c)}
        <p class="form-note" style="margin-top:20px">${state.lang === 'es' ? 'Origen Cultural no administra ventas ni se apropia de la historia del creador.' : 'Origen Cultural does not manage sales or claim ownership of a creator’s story.'}</p>
      </aside>
    </section>
    ${footer()}`;
  }

  function claimProfileView(id) {
    const c = creators.find(x => x.id === id);
    const es = state.lang === 'es';
    const L = (esText, enText) => es ? esText : enText;
    if (!c) return `<section class="section"><div class="section-inner"><h2>${L('Perfil no encontrado','Profile not found')}</h2><a href="#explorar" class="btn">${L('Volver','Back')}</a></div></section>`;
    const user = me();
    if (!user) return `<div class="auth-page"><div class="auth-card"><a href="#inicio" class="auth-brand"><img src="assets/logo-lockup.svg" alt="Origen Cultural"></a><h2>${L('Reclamar','Claim')} ${esc(c.name)}</h2><p class="auth-sub">${L('Para proteger a las comunidades y evitar suplantaciones, primero debes iniciar sesión.','To protect communities and prevent impersonation, you must sign in first.')}</p><a class="btn" href="#login" style="width:100%;text-align:center">${L('Iniciar sesión','Sign in')}</a><p class="auth-alt"><a href="#registro">${L('Crear cuenta ORIGEN','Create an ORIGEN account')}</a></p></div></div>`;
    return `<section class="page-hero"><div class="section-inner"><p class="eyebrow">${L('RECLAMACIÓN DE PERFIL','PROFILE CLAIM')}</p><h1>${L('¿Representas a','Do you represent')} ${esc(c.name)}?</h1><p class="lead">${L('La gestión no se transfiere automáticamente. ORIGEN revisará que tengas autoridad para representar a esta persona, comunidad, negocio u organización.','Management is not transferred automatically. ORIGEN will review whether you have authority to represent this person, community, business or organisation.')}</p></div></section><section class="section"><div class="section-inner" style="max-width:820px"><form id="claim-form" class="form-grid" data-profile-ref="${esc(c.id)}"><div class="form-field"><label>${L('Tu nombre completo *','Your full name *')}</label><input name="claimant_name" value="${esc(user.name || '')}" required autocomplete="name"></div><div class="form-field"><label>${L('Cargo o relación *','Role or relationship *')}</label><input name="relationship_role" required placeholder="${L('Fundadora, gerente, representante autorizado…','Founder, manager, authorised representative…')}"></div><div class="form-field"><label>${L('Correo oficial *','Official email *')}</label><input type="email" name="official_email" value="${esc(user.email || '')}" required autocomplete="email"></div><div class="form-field"><label>${L('Web o red social oficial','Official website or social profile')}</label><input name="official_url" inputmode="url" placeholder="https://"></div><div class="form-field full"><label>${L('¿Cómo podemos verificar tu autoridad? *','How can we verify your authority? *')}</label><textarea name="explanation" rows="4" required maxlength="6000"></textarea></div><div class="form-field full"><label><input type="checkbox" name="authority" required> ${L('Declaro que estoy autorizado/a para solicitar la gestión de este perfil.','I declare that I am authorised to request management of this profile.')}</label></div><div id="claim-status" class="form-field full" role="status" aria-live="polite"></div><div class="form-field full"><button class="btn" type="submit" style="width:100%">${L('Enviar solicitud para revisión','Submit claim for review')}</button></div></form></div></section>${footer()}`;
  }

  /* ── USER PROFILE ────────────────────────────────────────── */
  function userProfileView(id) {
    const es = state.lang === 'es';
    const user    = me();
    const profile = (user && user.id === id) ? user : normalisePublicProvider((window.ORIGEN_API?.cache?.publicProfiles || []).find(x => x.id === id));
    if (!profile) return `<div class="section"><div class="section-inner" style="padding:80px 20px;text-align:center"><h2>${es ? 'Perfil no encontrado' : 'Profile not found'}</h2><a href="#feed" class="btn" style="margin-top:20px">${es ? 'Volver' : 'Back'}</a></div></div>`;
    const myFollows = user ? remoteFollowRefs() : [];
    const isMe      = !!(user && user.id === id);
    const following = myFollows.includes(id);
    const ownedCultural = (window.ORIGEN_API?.cache?.culturalProfiles || []).find(cp => cp.owner_id === id);
    const follCount = ownedCultural?.follower_count || 0;
    const followCount = isMe ? remoteFollowRefs().length : 0;
    const uPosts = allPosts().filter(p => p.authorId === id);
    return `<section class="profile-hero">
      ${profile.cover
        ? `<img class="profile-cover" src="${esc(safeMediaUrl(profile.cover))}" alt="${es ? 'Portada' : 'Cover'}">`
        : `<div class="profile-cover-blank"></div>`}
      <div class="profile-hero-content">
        ${avatarEl(profile, 'lg')}
        <div class="profile-title">
          <p class="eyebrow">${profile.accountType === 'creator' ? (es ? 'Agente Cultural' : 'Cultural Agent') : (es ? 'Explorador Cultural' : 'Cultural Explorer')}${profile.location ? ' · ' + esc(profile.location) : ''}</p>
          <h1>${esc(profile.name)}</h1>
          <p>${follCount} ${es ? 'seguidores' : 'followers'} · ${followCount} ${es ? 'siguiendo' : 'following'} · ${uPosts.length} ${es ? 'publicaciones' : 'posts'}</p>
        </div>
        <div class="profile-actions">
          ${isMe
            ? `<a class="btn light" href="#editar-perfil">${es ? 'Editar perfil' : 'Edit profile'}</a>`
            : `<button class="btn light" data-fuser="${esc(id)}">${following ? t('following') : t('follow')}</button>`}
        </div>
      </div>
    </section>
    <section class="profile-layout">
      <div>
        ${profile.accountType === 'creator' ? profileTrustNotice(profile) : ''}
        ${profile.story ? `<div class="profile-story"><p class="eyebrow">${es ? 'HISTORIA CULTURAL' : 'CULTURAL STORY'}</p><p>${esc(profile.story)}</p></div>` : ''}
        ${profile.accountType === 'creator' ? `<section class="provider-professional"><div class="provider-prof-head"><div><p class="eyebrow">PERFIL PROFESIONAL CULTURAL</p><h2>${esc(profile.providerHeadline || 'Servicios y conocimiento cultural')}</h2></div>${profile.website ? `<a class="btn secondary" href="${esc(safeExternalUrl(profile.website))}" target="_blank" rel="noopener noreferrer">Visitar sitio web ↗</a>` : ''}</div>${profile.serviceDescription ? `<p class="provider-prof-copy">${esc(profile.serviceDescription)}</p>` : ''}${profile.services && profile.services.length ? `<div class="service-grid">${profile.services.map(service => `<div class="service-chip">${esc(service)}</div>`).join('')}</div>` : `<p class="form-note">Añade tus servicios, talleres, experiencias o conocimientos desde “Editar perfil”.</p>`}<div class="provider-contact-row">${profile.publicEmail ? `<a href="mailto:${esc(profile.publicEmail)}">✉ ${esc(profile.publicEmail)}</a>` : ''}${profile.publicWhatsapp ? `<span>WhatsApp: ${esc(profile.publicWhatsapp)}</span>` : ''}</div></section>` : ''}
        ${profile.categories && profile.categories.length ? `<div class="creator-tags" style="margin:18px 0">${profile.categories.map(cat => `<span>${esc(cat)}</span>`).join('')}</div>` : ''}
        <div style="margin-top:40px">
          <p class="eyebrow">${es ? 'PUBLICACIONES' : 'POSTS'} (${uPosts.length})</p>
          ${uPosts.length
            ? `<div style="margin-top:20px">${uPosts.map(postCard).join('')}</div>`
            : `<div class="empty-state" style="margin-top:20px;border:1px dashed #ddd;padding:40px;text-align:center">
                <p>${es ? 'Aún no hay publicaciones.' : 'No posts yet.'}</p>
                ${isMe ? `<a class="btn" href="#crear" style="margin-top:14px">${es ? 'Crear primera publicación' : 'Create your first post'}</a>` : ''}
              </div>`}
        </div>
      </div>
      <aside class="profile-aside">
        <p class="eyebrow">${es ? 'PERFIL CULTURAL' : 'CULTURAL PROFILE'}</p>
        <dl>
          <div><dt>${es ? 'Tipo' : 'Type'}</dt><dd>${profile.accountType === 'creator' ? (es ? 'Agente Cultural' : 'Cultural Agent') : (es ? 'Explorador Cultural' : 'Cultural Explorer')}</dd></div>
          ${profile.culturalIdentity ? `<div><dt>${es ? 'Cultura que comparte' : 'Culture shared'}</dt><dd>${esc(profile.culturalIdentity)}</dd></div>` : ''}
          ${profile.location ? `<div><dt>${es ? 'Dónde se encuentra' : 'Based in'}</dt><dd>${esc(profile.location)}</dd></div>` : ''}
          ${profile.categories && profile.categories.length ? `<div><dt>${es ? 'Categorías' : 'Categories'}</dt><dd>${profile.categories.map(esc).join(', ')}</dd></div>` : ''}
        </dl>
        ${socialLinksHtml(profile)}
        ${isMe ? `<a href="#editar-perfil" class="btn secondary" style="width:100%;margin-top:20px;text-align:center">Editar perfil</a>
                  <a href="mailto:info.origencultural@gmail.com?subject=ORIGEN%20-%20Solicitud%20de%20privacidad%20o%20eliminaci%C3%B3n%20de%20cuenta" class="text-button privacy-request-link" style="display:block;width:100%;margin-top:14px;text-align:center">${es ? 'Solicitar privacidad / eliminación de cuenta' : 'Request privacy support or account deletion'}</a>
                  <button id="logout-btn-aside" class="btn" style="width:100%;margin-top:10px;background:transparent;color:#888;border-color:#ddd">${es ? 'Cerrar sesión' : 'Sign out'}</button>` : ''}
      </aside>
    </section>
    ${footer()}`;
  }
  function myProfileView() {
    const user = me();
    if (!user) { go('login'); return ''; }
    return userProfileView(user.id);
  }

  /* ── SAVED ───────────────────────────────────────────────── */
  function savedView() {
    const es = state.lang === 'es';
    const user = me();
    if (!user) { go('login'); return ''; }
    const saves = window.ORIGEN_API?.cache?.saves || [];
    const saved = allPosts().filter(p => saves.includes(p.id));
    return `<section class="page-hero">
      <div class="section-inner">
        <p class="eyebrow">${es ? 'MI COLECCIÓN' : 'MY COLLECTION'}</p>
        <h1>${es ? 'Guardados' : 'Saved'}</h1>
        <p class="lead">${saved.length} ${es ? 'publicaciones guardadas' : 'saved posts'}</p>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${saved.length
          ? `<div class="saved-grid">${saved.map(postCard).join('')}</div>`
          : `<div class="empty-state"><h3>${es ? 'Aún no guardaste publicaciones' : 'No saved posts yet'}</h3><p>${es ? 'Guarda publicaciones del feed para verlas aquí.' : 'Save posts from your feed to see them here.'}</p><a class="btn" href="#feed" style="margin-top:20px">${es ? 'Ir al feed' : 'Go to feed'}</a></div>`}
      </div>
    </section>
    ${footer()}`;
  }

  /* ── CREATE POST ─────────────────────────────────────────── */
  function createPostView() {
    const user = me();
    const es = state.lang === 'es';
    const L = (s, e) => es ? s : e;
    if (!user) { go('login'); return ''; }
    if (!['creator','explorer'].includes(user.accountType)) { go('feed'); return ''; }
    const d = state.createData;
    // Purely a display/UX gate: Supabase Storage + Postgres RLS remain the
    // authoritative security boundary. Never show a false "published" state.
    const culturalPublishingReady = window.ORIGEN_API?.culturalPublishingReady === true;
    const explorerPublishingReady = window.ORIGEN_API?.explorerPublishingReady === true;
    const isProvider = user.accountType === 'creator';
    const isExplorer = user.accountType === 'explorer';
    const accountPublishingReady = isExplorer ? explorerPublishingReady : culturalPublishingReady;
    const types = [['photo',L('◫ Foto','◫ Photo')],['carousel',L('⊟ Carrusel','⊟ Carousel')],['video',L('▷ Video','▷ Video')]];
    const CATS  = [['Artesanía y tradición','Crafts and tradition'],['Gastronomía ancestral','Ancestral gastronomy'],['Música y danza','Music and dance'],['Territorio y patrimonio','Territory and heritage'],['Arte y cultura','Art and culture'],['Educación cultural','Cultural education'],['Comunidad','Community']];
    const CREATOR_PURPOSES = [
      ['education',L('Educación cultural','Cultural education')],
      ['history',L('Historia y memoria','History and memory')],
      ['technique',L('Técnica / proceso','Technique / process')],
      ['territory',L('Territorio','Territory')],
      ['language',L('Lengua','Language')],
      ['gastronomy',L('Gastronomía','Gastronomy')],
      ['arts',L('Artes / expresión','Arts / expression')],
      ['heritage',L('Patrimonio','Heritage')],
      ['community',L('Comunidad','Community')]
    ];
    const EXPLORER_PURPOSES = [
      ['agent_discovery',L('Descubrir o recomendar un Agente Cultural','Discover or recommend a Cultural Agent')],
      ['explorer_experience',L('Compartir mi experiencia como Explorador Cultural','Share my experience as a Cultural Explorer')]
    ];
    const PURPOSES = isExplorer ? EXPLORER_PURPOSES : CREATOR_PURPOSES;
    if (!PURPOSES.some(([value]) => value === d.contentPurpose)) d.contentPurpose = PURPOSES[0][0];
    const hasMedia = d.media && d.media.length > 0;

    return `<section class="page-hero" style="min-height:220px">
      <div class="section-inner">
        <p class="eyebrow">${L('NUEVA PUBLICACIÓN','NEW POST')}</p>
        <h1>${isExplorer ? L('Compartir un descubrimiento cultural','Share a cultural discovery') : L('Compartir cultura','Share culture')}</h1>
        ${isExplorer ? `<p class="lead">${L('Comparte una experiencia que ayude a descubrir Agentes Culturales o cuenta lo que aprendiste como Explorador. Puedes usar una foto, un carrusel o un video de hasta 90 segundos.','Share an experience that helps people discover Cultural Agents, or tell what you learned as an Explorer. Use a photo, carousel or video up to 90 seconds.')}</p>` : ''}
      </div>
    </section>
    <div class="create-layout">
      <div class="create-form-wrap">
        <div class="create-type-strip">
          ${types.map(([v, label]) => `<button class="create-type-btn${d.type === v ? ' active' : ''}" data-ctype="${v}">${label}</button>`).join('')}
        </div>
        ${d.type !== 'text' ? `
          <div class="upload-zone wide" id="post-media-zone">
            ${hasMedia
              ? `<div class="post-media-preview">${d.media.map((src, i) => `<div class="preview-thumb${d.type === 'video' ? ' preview-video' : ''}">${d.type === 'video'
                ? `<video src="${esc(safeMediaUrl(src))}" controls muted playsinline preload="metadata" aria-label="Vista previa del video"></video>`
                : `<img src="${esc(safeMediaUrl(src))}" alt="Vista previa de imagen ${i + 1}">`}
                <button class="remove-media" data-rmidx="${i}" type="button" aria-label="Quitar archivo ${i + 1}">×</button></div>`).join('')}${d.type === 'carousel' ? `<button class="preview-add" id="add-more-media" type="button">＋</button>` : ''}</div>`
              : `<div class="upload-placeholder"><span>+</span><p>${d.type === 'video' ? L('Selecciona un video','Select a video') : d.type === 'carousel' ? L('Selecciona fotos (puedes elegir varias)','Select photos (you can choose multiple)') : L('Selecciona una foto','Select a photo')}</p><small>${L('Haz clic para subir','Click to upload')}</small></div>`}
            <input type="file" id="post-media-input" accept="${d.type === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp'}" ${d.type === 'carousel' ? 'multiple' : ''} style="display:none">
          </div>${d.type === 'video' ? `<p id="post-video-duration-status" class="form-note" role="status" aria-live="polite">${state.createData.videoDurationSeconds ? L(`Duración: ${Math.round(state.createData.videoDurationSeconds)} s (máximo 90 s).`, `Duration: ${Math.round(state.createData.videoDurationSeconds)} s (90 s maximum).`) : L('Máximo 90 segundos. Verificaremos la duración antes de publicar.','Maximum 90 seconds. Duration will be checked before publishing.')}</p>` : ''}` : ''}
        <form class="form-grid" id="create-form">
          ${isProvider ? `<div class="form-field full cultural-feed-note"><p class="eyebrow">${L('FEED CULTURAL Y EDUCATIVO','CULTURAL AND EDUCATIONAL FEED')}</p><p>${L('Comparte conocimiento, contexto, técnicas, historias o territorio mediante foto, carrusel o video. Los servicios pueden presentarse en tu perfil profesional; evita publicidad genérica en el feed.','Share knowledge, context, techniques, stories or territory through a photo, carousel or video. Present services on your professional profile; avoid generic advertising in the feed.')}</p></div>` : ''}
          ${isExplorer ? `<div class="form-field full explorer-post-note"><p>${L('Las publicaciones de Exploradores se centran en descubrir Agentes Culturales y compartir experiencias culturales propias. No sustituyen ni verifican el perfil del Agente.','Explorer posts focus on discovering Cultural Agents and sharing personal cultural experiences. They do not replace or verify an Agent’s profile.')}</p></div>` : ''}
          <div class="form-field full"><label>${L('Título *','Title *')}</label><input name="title" required placeholder="${L('Un título que invite a descubrir','A title that invites discovery')}" value="${esc(d.title || '')}"></div>
          <div class="form-field full"><label>${L('Descripción *','Description *')}</label><textarea name="description" rows="4" required placeholder="${L('Comparte el contexto, la historia o el significado cultural...','Share the context, story or cultural meaning...')}">${esc(d.description || '')}</textarea></div>
          <div class="form-field"><label>${L('Categoría cultural','Cultural category')}</label><select name="category">${CATS.map(([v,label]) => `<option value="${v}"${d.category === v ? ' selected' : ''}>${es ? v : label}</option>`).join('')}</select></div>
          <div class="form-field"><label>${isExplorer ? L('Propósito de la publicación *','Post purpose *') : L('Propósito cultural *','Cultural purpose *')}</label><select name="contentPurpose" required>${PURPOSES.map(([value,label]) => `<option value="${value}"${(d.contentPurpose || PURPOSES[0][0]) === value ? ' selected' : ''}>${label}</option>`).join('')}</select></div>
          <div class="form-field"><label>${L('Territorio','Territory')}</label><input name="territory" placeholder="${L('Ciudad, región o país','City, region or country')}" value="${esc(d.territory || '')}"></div>
          <div class="form-field full"><label>${L('Etiquetas','Tags')} <small style="color:#888;font-weight:400">${L('(separadas por coma)','(comma-separated)')}</small></label><input name="tags" placeholder="${L('Bordado, Ecuador, Memoria','Embroidery, Ecuador, Memory')}" value="${esc((d.tags || []).join(', '))}"></div>
          <fieldset class="post-cultural-safety form-field full" aria-describedby="post-safety-intro">
            <legend>${state.lang === 'es' ? 'Responsabilidad cultural antes de publicar' : 'Cultural responsibility before publishing'}</legend>
            <p id="post-safety-intro">${state.lang === 'es'
              ? (d.type === 'video' ? 'Confirma los derechos de contenido y culturales, además de los derechos de audio del video. Tu declaración no equivale a una verificación oficial de ORIGEN.' : 'Confirma ambos puntos para cada publicación. Tu declaración no equivale a una verificación oficial de ORIGEN.')
              : (d.type === 'video' ? 'Confirm content and cultural rights, plus the video audio rights. Your declaration is not an official verification by ORIGEN.' : 'Confirm both statements for each post. Your declaration is not an official verification by ORIGEN.')}</p>
            <label class="post-safety-check">
              <input type="checkbox" name="rightsAcknowledged" data-post-attestation="rightsAcknowledged" required ${d.rightsAcknowledged ? 'checked' : ''}>
              <span>${state.lang === 'es'
                ? 'Tengo derecho o autorización para compartir los textos, fotografías, videos y testimonios de esta publicación, incluidas las imágenes de otras personas y menores cuando corresponda.'
                : 'I own or have permission to share this post’s text, photos, videos and testimonies, including images of other people and minors where applicable.'}</span>
            </label>
            <label class="post-safety-check">
              <input type="checkbox" name="culturalAcknowledged" data-post-attestation="culturalAcknowledged" required ${d.culturalAcknowledged ? 'checked' : ''}>
              <span>${state.lang === 'es'
                ? 'He comprobado que tengo autorización para divulgar cualquier conocimiento cultural que requiera consentimiento comunitario y que no revelo información sagrada, restringida o privada sin permiso.'
                : 'I have confirmed permission to share any cultural knowledge requiring community consent, and I am not disclosing sacred, restricted or private information without permission.'}</span>
            </label>
            ${d.type === 'video' ? `
              <div class="form-field full audio-rights-fields">
                <label>${state.lang === 'es' ? 'Derechos del audio del video *' : 'Video audio rights *'}
                  <select name="audioRightsSource" required>
                    <option value="">${state.lang === 'es' ? 'Selecciona una opción' : 'Select an option'}</option>
                    <option value="no_music"${d.audioRightsSource === 'no_music' ? ' selected' : ''}>${state.lang === 'es' ? 'No incluye música ni una grabación musical de terceros' : 'No music or third-party music recording'}</option>
                    <option value="original"${d.audioRightsSource === 'original' ? ' selected' : ''}>${state.lang === 'es' ? 'Música original propia, con permisos de intérpretes si corresponde' : 'My original music, with performer permissions where needed'}</option>
                    <option value="licensed"${d.audioRightsSource === 'licensed' ? ' selected' : ''}>${state.lang === 'es' ? 'Tengo permiso para la composición y la grabación' : 'I have permission for both the composition and recording'}</option>
                    <option value="community_permission"${d.audioRightsSource === 'community_permission' ? ' selected' : ''}>${state.lang === 'es' ? 'Música tradicional/comunitaria con permisos y consentimiento cultural pertinentes' : 'Traditional/community music with relevant rights and cultural consent'}</option>
                  </select>
                </label>
                <label>${state.lang === 'es' ? 'Crédito de audio (artista/grupo y canción o fuente)' : 'Audio credit (artist/group and song or source)'}
                  <input name="audioAttribution" maxlength="240" value="${esc(d.audioAttribution || '')}" placeholder="${state.lang === 'es' ? 'Ej.: Grupo Andino — título de la canción' : 'e.g. Andean Group — song title'}">
                </label>
                <p class="form-note">${state.lang === 'es'
                  ? 'Para música con permiso o tradicional/comunitaria, indica el crédito autorizado. Conserva una autorización verificable: ORIGEN puede solicitarla. Dar crédito no reemplaza los permisos. Un tema tradicional o de dominio público no libera automáticamente su arreglo ni su grabación; las bibliotecas de Spotify o Instagram tampoco autorizan su uso en ORIGEN.'
                  : 'For licensed or traditional/community music, enter the authorised credit. Keep verifiable permission; ORIGEN may request it. Credit does not replace permission. A traditional or public-domain song does not automatically clear its arrangement or recording; Spotify or Instagram libraries do not authorise use on ORIGEN.'}</p>
                <label class="post-safety-check">
                  <input type="checkbox" name="audioRightsAcknowledged" data-post-attestation="audioRightsAcknowledged" required ${d.audioRightsAcknowledged ? 'checked' : ''}>
                  <span>${state.lang === 'es'
                    ? 'Confirmo que tengo autorización para publicar en ORIGEN la composición y la grabación que incluya este video en los territorios donde se muestre. Si corresponde, también tengo el consentimiento de intérpretes y custodios culturales. Conservaré la evidencia del permiso.'
                    : 'I confirm I am authorised to publish the composition and recording in this video on ORIGEN in the territories where it is shown. Where relevant, I also have performer and cultural custodian consent. I will keep evidence of permission.'}</span>
                </label>
                <p class="form-note">${state.lang === 'es' ? 'Esta declaración no es una licencia de ORIGEN ni una verificación independiente. Si no tienes permisos, elimina o silencia la música antes de publicar.' : 'This declaration is not an ORIGEN licence or independent verification. If you do not have permission, remove or mute the music before publishing.'}</p>
              </div>
            ` : ''}
            <p class="post-safety-help">${state.lang === 'es'
              ? 'Si no puedes confirmar ambos puntos, no publiques todavía. Solicita permiso o retira ese contenido.'
              : 'If you cannot confirm both statements, do not publish yet. Request permission or remove that content.'}
              <a href="#confianza">${state.lang === 'es' ? 'Centro de confianza' : 'Trust Center'}</a>.
            </p>
            <p id="post-safety-error" class="post-safety-error" role="alert" aria-live="assertive" hidden></p>
          </fieldset>
          <div class="form-field full">
            ${!accountPublishingReady ? `<p id="post-publication-paused" class="form-note" role="status" aria-live="polite">${state.lang === 'es'
              ? 'La publicación está temporalmente pausada para todos los perfiles mientras verificamos la recepción privada y los derechos culturales. Puedes preparar una vista previa en este dispositivo, pero tus archivos y textos NO se enviarán ni guardarán en ORIGEN.'
              : 'Publishing is temporarily paused for all account types while private intake and cultural rights are verified. You can prepare a preview on this device, but your files and text will NOT be submitted or saved to ORIGEN.'}</p>` : ''}
            <button class="btn" type="submit" style="width:100%" ${accountPublishingReady ? '' : 'disabled aria-disabled="true"'}>${accountPublishingReady
              ? (state.lang === 'es' ? 'Publicar →' : 'Publish →')
              : (state.lang === 'es' ? 'Publicación en preparación' : 'Publishing not available yet')}</button>
            ${accountPublishingReady ? `<p class="form-note" style="margin-top:12px">${L('Tu publicación se guardará en ORIGEN y quedará vinculada a tu cuenta.','Your post will be saved to ORIGEN and linked to your account.')}</p>` : ''}
          </div>
        </form>
      </div>
      <div class="create-preview-wrap">
        <p class="eyebrow" style="margin-bottom:16px">${L('VISTA PREVIA','PREVIEW')}</p>
        <div id="create-live-preview">
          ${d.title || hasMedia
            ? postCard({ id:'_prev', authorId: user.id, type: d.type, media: d.media || [], title: d.title || L('Título','Title'), description: d.description || '', category: d.category || '', contentPurpose: d.contentPurpose || 'education', territory: d.territory || '', tags: d.tags || [], timestamp: new Date().toISOString(), likes: 0 })
            : `<div style="padding:40px;text-align:center;border:1px dashed #ccc;color:#888"><p>${L('La vista previa aparecerá aquí.','Your preview will appear here.')}</p></div>`}
        </div>
      </div>
    </div>`;
  }

  /* ── EDIT PROFILE ────────────────────────────────────────── */
  function editProfileView() {
    const user = me();
    const es = state.lang === 'es';
    const L = (s, e) => es ? s : e;
    if (!user) { go('login'); return ''; }
    const CATS = [['Artesanía y tradición','Crafts and tradition'],['Gastronomía ancestral','Ancestral gastronomy'],['Música y danza','Music and dance'],['Territorio y patrimonio','Territory and heritage'],['Arte y cultura','Art and culture'],['Educación cultural','Cultural education'],['Comunidad','Community']];
    const userCats = user.categories || [];
    return `<section class="page-hero" style="min-height:200px">
      <div class="section-inner">
        <p class="eyebrow">${L('MI CUENTA','MY ACCOUNT')}</p>
        <h1>${L('Editar perfil','Edit profile')}</h1>
      </div>
    </section>
    <div class="edit-wrap">
      <div class="upload-section">
        <div class="upload-zone" id="edit-avatar-zone">
          ${user.avatar ? `<img src="${esc(safeMediaUrl(user.avatar))}" class="edit-avatar-preview" alt="Avatar">` : avatarEl(user, 'lg')}
          <input type="file" id="edit-avatar-input" accept="image/jpeg,image/png,image/webp" style="display:none">
          <button class="btn" type="button" data-file-trigger="edit-avatar-input">${L('Cambiar foto','Change photo')}</button>
        </div>
        <div class="upload-zone wide" id="edit-cover-zone">
          ${user.cover
            ? `<img src="${esc(safeMediaUrl(user.cover))}" class="edit-cover-preview" alt="Portada">`
            : `<div class="upload-placeholder"><span>+</span><p>${L('Foto de portada','Cover photo')}</p></div>`}
          <input type="file" id="edit-cover-input" accept="image/jpeg,image/png,image/webp" style="display:none">
          <button class="btn secondary" type="button" data-file-trigger="edit-cover-input">${L('Cambiar portada','Change cover')}</button>
        </div>
      </div>
      <form class="form-grid" id="edit-form">
        <div class="form-field"><label>${L('Nombre','Name')}</label><input name="name" value="${esc(user.name || '')}"></div>
        ${locationFieldsMarkup(user, L, false)}
        ${user.accountType === 'creator' ? `<div class="form-field full"><label>${L('Cultura, comunidad o tradición que compartes','Culture, community or tradition you share')}</label><input name="culturalIdentity" maxlength="180" value="${esc(user.culturalIdentity || '')}" placeholder="${L('Ej. danza andina ecuatoriana','e.g. Ecuadorian Andean dance')}"><small class="form-note">${L('Describe tu actividad; no implica representar oficialmente a toda una comunidad.','Describe your activity; this does not imply official representation of an entire community.')}</small></div>` : ''}
        <div class="form-field full"><label>${L('Tu historia cultural','Your cultural story')}</label><textarea name="story" rows="4" placeholder="${L('¿Quién eres, qué representas y qué deseas compartir?','Who are you, what do you represent, and what would you like to share?')}">${esc(user.story || '')}</textarea></div>
        <div class="form-field full">
          <label>${L('Categorías culturales','Cultural categories')}</label>
          <div class="cat-chips">${CATS.map(([cat, label]) => `<button type="button" class="chip${userCats.includes(cat) ? ' active' : ''}" data-cat="${cat}">${es ? cat : label}</button>`).join('')}</div>
        </div>
        ${user.accountType === 'creator' ? `<p class="eyebrow" style="grid-column:1/-1;margin-bottom:4px">${L('PERFIL PROFESIONAL CULTURAL','CULTURAL PROFESSIONAL PROFILE')}</p><div class="form-field full"><label>${L('Titular profesional','Professional headline')}</label><input name="providerHeadline" maxlength="180" value="${esc(user.providerHeadline || '')}" placeholder="${L('Ej. Talleres de bordado tradicional y educación cultural','E.g. Traditional embroidery workshops and cultural education')}"></div><div class="form-field full"><label>${L('Servicios / oferta cultural','Services / cultural offering')}</label><input name="services" value="${esc((user.services || []).join(', '))}" placeholder="${L('Talleres, piezas por encargo, demostraciones, charlas','Workshops, commissions, demonstrations, talks')}"></div><div class="form-field full"><label>${L('Descripción de servicios','Service description')}</label><textarea name="serviceDescription" rows="3" maxlength="4000" placeholder="${L('Explica qué ofreces, para quién y cómo pueden contactarte.','Describe what you offer, who it is for, and how people can contact you.')}">${esc(user.serviceDescription || '')}</textarea></div>` : ''}
        <p class="eyebrow" style="grid-column:1/-1;margin-bottom:4px">${L('REDES Y CONTACTO','SOCIAL LINKS AND CONTACT')}</p>
        ${[['instagram','Instagram'],['facebook','Facebook'],['tiktok','TikTok'],['youtube','YouTube'],['linkedin','LinkedIn'],['whatsapp','WhatsApp'],['email',L('Correo','Email')],['web',L('Sitio web','Website')]].map(([k, label]) =>
          `<div class="form-field"><label>${label}</label><input name="${k}" value="${esc(user.links && user.links[k] ? user.links[k] : '')}" placeholder="${L('URL o usuario','URL or username')}"></div>`).join('')}
        <div class="form-field full">
          <button class="btn" type="submit" style="width:100%">${L('Guardar cambios','Save changes')}</button>
        </div>
      </form>
      <button id="logout-btn" class="btn secondary" style="width:100%;margin-top:16px;color:#666;border-color:#ddd">${L('Cerrar sesión','Sign out')}</button>
    </div>`;
  }

  /* ── REGISTER WIZARD ─────────────────────────────────────── */

  function cityOptionsMarkup(country, selectedId, L) {
    const directory = window.ORIGEN_LOCATIONS;
    if (!directory?.ready) return '<option value="">' + L('Cargando ciudades…','Loading cities…') + '</option>';
    if (!country) return '<option value="">' + L('Selecciona primero un país','Choose a country first') + '</option>';
    return '<option value="">' + L('Selecciona una ciudad','Choose a city') + '</option>' +
      directory.cities(country).map(city => '<option value="' + esc(city.id) + '"' +
        (String(city.id) === String(selectedId || '') ? ' selected' : '') + '>' +
        esc(city.name) + (city.region ? ' — ' + esc(city.region) : '') + '</option>').join('');
  }

  function locationFieldsMarkup(data, L, required) {
    const countries = window.ORIGEN_LOCATIONS?.countries?.() || [];
    const req = required ? ' required' : '';
    return '<div class="form-field"><label>' + L('País donde vives o realizas actividades','Country where you live or run activities') +
      (required ? ' *' : '') + '</label><select name="country" data-initial-country="' + esc(data.country || '') + '"' + req + '>' +
      '<option value="">' + L('Selecciona un país','Choose a country') + '</option>' +
      countries.map(country => '<option value="' + esc(country) + '"' + (country === data.country ? ' selected' : '') + '>' + esc(country) + '</option>').join('') +
      '</select></div><div class="form-field"><label>' + L('Ciudad','City') + (required ? ' *' : '') +
      '</label><select name="cityGeonameId" data-initial-city="' + esc(data.cityGeonameId || '') + '"' + req + (data.country ? '' : ' disabled') + '>' +
      cityOptionsMarkup(data.country, data.cityGeonameId, L) + '</select><small class="form-note">' +
      L('Elige dónde vive el Agente Cultural o dónde puedes encontrar sus actividades.','Choose where the Cultural Agent is based or where you can attend their activities.') + '</small></div>';
  }

  function selectedLocation(form) {
    const country = form?.elements?.country?.value || '';
    const city = window.ORIGEN_LOCATIONS?.findCity(form?.elements?.cityGeonameId?.value);
    if (!country || !city || city.country !== country) {
      return { country: '', city: '', cityGeonameId: null, citySubcountry: '', location: '' };
    }
    return { country, city: city.name, cityGeonameId: Number(city.id), citySubcountry: city.region,
      location: [city.name, city.region, country].filter(Boolean).join(', ') };
  }

  function bindLocationSelects(form) {
    const country = form?.elements?.country, city = form?.elements?.cityGeonameId;
    const directory = window.ORIGEN_LOCATIONS;
    if (!country || !city || !directory) return;
    const L = (esText, enText) => state.lang === 'es' ? esText : enText;
    const refresh = () => {
      if (!directory.ready) return;
      const wantedCountry = country.value || country.dataset.initialCountry || '';
      const wantedCity = city.value || city.dataset.initialCity || '';
      const availableCountries = directory.countries();
      country.innerHTML = '<option value="">' + L('Selecciona un país','Choose a country') + '</option>' +
        availableCountries.map(name => '<option value="' + esc(name) + '">' + esc(name) + '</option>').join('');
      country.value = availableCountries.includes(wantedCountry) ? wantedCountry : '';
      city.disabled = !country.value;
      city.innerHTML = cityOptionsMarkup(country.value, wantedCity, L);
      country.dataset.initialCountry = '';
      city.dataset.initialCity = '';
    };
    country.addEventListener('change', () => {
      city.dataset.initialCity = '';
      city.disabled = !country.value;
      city.innerHTML = cityOptionsMarkup(country.value, '', L);
    });
    void directory.load().then(loaded => {
      if (loaded && form.isConnected) refresh();
      else if (!loaded && form.isConnected) {
        city.disabled = false;
        city.innerHTML = '<option value="">' + L('No se pudo cargar la lista de ciudades. Recarga la página.','Could not load the city list. Reload the page.') + '</option>';
      }
    });
  }

  function registerView() {
    const step  = state.regStep;
    const d     = state.regData;
    const es    = state.lang === 'es';
    const L     = (esText, enText) => es ? esText : enText;
    const steps = es
      ? ['Tipo de cuenta','Datos básicos','Foto y portada','Tu historia','Redes sociales']
      : ['Account type','Basic details','Photo and cover','Your story','Social links'];
    const CATS  = [
      ['Artesanía y tradición','Crafts and tradition'],
      ['Gastronomía ancestral','Ancestral gastronomy'],
      ['Música y danza','Music and dance'],
      ['Territorio y patrimonio','Territory and heritage'],
      ['Arte y cultura','Art and culture'],
      ['Educación cultural','Cultural education'],
      ['Comunidad','Community']
    ];

    const progress = `<div class="wizard-progress" aria-label="${L('Progreso de registro','Registration progress')}">
      <div class="wizard-steps">
        ${steps.map((_, i) => `
          <div class="wstep${i + 1 === step ? ' active' : i + 1 < step ? ' done' : ''}" ${i + 1 === step ? 'aria-current="step"' : ''}>
            ${i + 1 < step ? '✓' : i + 1}
          </div>
          ${i < steps.length - 1 ? `<div class="wline${i + 1 < step ? ' done' : ''}"></div>` : ''}
        `).join('')}
      </div>
      <p class="wizard-label">${L('Paso','Step')} ${step} ${L('de','of')} ${steps.length} · ${steps[step - 1]}</p>
    </div>`;

    let body = '';
    if (step === 1) {
      body = `<div class="atype-grid">
        <button class="atype-card${d.accountType === 'creator' ? ' selected' : ''}" data-atype="creator" aria-pressed="${d.accountType === 'creator'}">
          <span class="atype-icon" aria-hidden="true">◈</span>
          <h3>${L('Agente Cultural','Cultural Agent')}</h3>
          <p>${L(
            'Persona, comunidad, negocio u organización que preserva, enseña, comparte u ofrece servicios vinculados a la cultura.',
            'A person, community, business or organisation that preserves, teaches, shares or offers culture-related services.'
          )}</p>
        </button>
        <button class="atype-card${d.accountType === 'explorer' ? ' selected' : ''}" data-atype="explorer" aria-pressed="${d.accountType === 'explorer'}">
          <span class="atype-icon" aria-hidden="true">◎</span>
          <h3>${L('Explorador Cultural','Cultural Explorer')}</h3>
          <p>${L(
            'Persona interesada en descubrir, aprender y conectar con culturas vivas del mundo.',
            'A person interested in discovering, learning about and connecting with living cultures around the world.'
          )}</p>
        </button>
      </div>`;
    } else if (step === 2) {
      body = `<form class="form-grid" id="reg-basic">
        <div class="form-field"><label>${L('Nombre completo *','Full name *')}</label><input name="name" required autocomplete="name" value="${esc(d.name || '')}"></div>
        <div class="form-field"><label>${L('Correo electrónico *','Email address *')}</label><input type="email" name="email" required autocomplete="email" value="${esc(d.email || '')}"></div>
        <div class="form-field"><label>${L('Contraseña *','Password *')}</label><input type="password" name="password" required minlength="8" autocomplete="new-password"></div>
        ${locationFieldsMarkup(d, L, true)}
      </form>`;
    } else if (step === 3) {
      body = `<div class="upload-section">
        <div class="upload-zone" id="reg-avatar-zone">
          ${d.avatar ? `<img src="${esc(safeMediaUrl(d.avatar))}" class="edit-avatar-preview" alt="${L('Foto de perfil','Profile photo')}">` : `<div class="upload-placeholder"><span aria-hidden="true">+</span><p>${L('Foto de perfil','Profile photo')}</p><small>${L('Opcional','Optional')}</small></div>`}
          <input type="file" id="reg-avatar-input" accept="image/jpeg,image/png,image/webp" style="display:none">
          <button class="btn" type="button" data-file-trigger="reg-avatar-input">${L('Subir foto de perfil','Upload profile photo')}</button>
        </div>
        <div class="upload-zone wide" id="reg-cover-zone">
          ${d.cover ? `<img src="${esc(safeMediaUrl(d.cover))}" class="edit-cover-preview" alt="${L('Portada','Cover image')}">` : `<div class="upload-placeholder"><span aria-hidden="true">+</span><p>${L('Foto de portada','Cover image')}</p><small>${L('Opcional','Optional')}</small></div>`}
          <input type="file" id="reg-cover-input" accept="image/jpeg,image/png,image/webp" style="display:none">
          <button class="btn secondary" type="button" data-file-trigger="reg-cover-input">${L('Subir portada','Upload cover')}</button>
        </div>
        <p class="form-note" style="width:100%;max-width:760px">${L(
          'Tus imágenes son opcionales. Si tu correo requiere confirmación antes de iniciar sesión, por seguridad podrás añadirlas desde “Editar perfil” después de confirmar tu cuenta.',
          'Images are optional. If your email requires confirmation before sign-in, you can safely add them from “Edit profile” after confirming your account.'
        )}</p>
      </div>`;
    } else if (step === 4) {
      body = `<form class="form-grid" id="reg-story">
        ${d.accountType === 'creator' ? `<div class="form-field full"><label>${L('Cultura, comunidad o tradición que compartes *','Culture, community or tradition you share *')}</label><input name="culturalIdentity" required maxlength="180" value="${esc(d.culturalIdentity || '')}" placeholder="${L('Ej. danza andina ecuatoriana','e.g. Ecuadorian Andean dance')}"><small class="form-note">${L('Describe lo que compartes; esto no implica representar oficialmente a toda una comunidad.','Describe what you share; this does not mean you officially represent an entire community.')}</small></div>` : ''}<div class="form-field full"><label>${L('Tu historia cultural','Your cultural story')}</label><textarea name="story" rows="4" placeholder="${L('¿Quién eres, qué representas y qué deseas compartir con el mundo?','Who are you, what do you represent, and what would you like to share with the world?')}">${esc(d.story || '')}</textarea></div>
        <div class="form-field full">
          <label>${L('Categorías culturales','Cultural categories')}</label>
          <div class="cat-chips">${CATS.map(([value,enLabel]) => `<button type="button" class="chip${(d.categories || []).includes(value) ? ' active' : ''}" data-cat="${value}" aria-pressed="${(d.categories || []).includes(value)}">${es ? value : enLabel}</button>`).join('')}</div>
        </div>
        ${d.accountType === 'creator' ? `<div class="form-field full"><label>${L('¿Qué ofreces como Agente Cultural?','What do you offer as a Cultural Agent?')}</label><input name="providerHeadline" maxlength="180" value="${esc(d.providerHeadline || '')}" placeholder="${L('Ej. Talleres de bordado tradicional y educación cultural','e.g. Traditional embroidery workshops and cultural education')}"></div><div class="form-field full"><label>${L('Servicios / oferta cultural','Services / cultural offering')}</label><input name="services" value="${esc((d.services || []).join(', '))}" placeholder="${L('Talleres, artesanía, demostraciones, charlas','Workshops, crafts, demonstrations, talks')}"></div><div class="form-field full"><label>${L('Descripción de tus servicios','Service description')}</label><textarea name="serviceDescription" rows="3" maxlength="4000" placeholder="${L('Describe cómo aportas valor cultural y cómo pueden conocerte o contratarte.','Describe the cultural value you provide and how people can learn more or work with you.')}">${esc(d.serviceDescription || '')}</textarea></div>` : ''}
      </form>`;
    } else if (step === 5) {
      const socialLabels = [['instagram','Instagram'],['facebook','Facebook'],['tiktok','TikTok'],['youtube','YouTube'],['linkedin','LinkedIn'],['whatsapp','WhatsApp'],['email',L('Correo electrónico','Email address')],['web',L('Sitio web','Website')]];
      body = `<form class="form-grid" id="reg-social">
        <p class="form-note full" style="grid-column:1/-1">${L(
          'Añade tus redes sociales para que las personas puedan contactarte directamente. Todo es opcional.',
          'Add social links so people can contact you directly. Everything here is optional.'
        )}</p>
        ${socialLabels.map(([k, label]) => `<div class="form-field"><label>${label}</label><input name="${k}" value="${esc(d.links && d.links[k] ? d.links[k] : '')}" placeholder="${L('URL o usuario','URL or username')}"></div>`).join('')}
        ${captchaSlot('signup')}
        <div class="form-field full legal-consent">
          <label class="legal-check" for="reg-accepted-legal">
            <input id="reg-accepted-legal" type="checkbox" name="acceptedLegal" required ${d.acceptedLegal ? 'checked' : ''}>
            <span>${L('Acepto los','I accept ORIGEN’s')} ${L('Términos de Uso, Privacidad, Normas de Comunidad y Derechos Culturales v1.2','Terms of Use, Privacy, Community Guidelines and Cultural Rights v1.2')}${es ? ' de ORIGEN.' : '.'}</span>
          </label>
          <p class="form-note"><a href="#confianza" target="_blank" rel="noopener noreferrer">${L('Leer los documentos en el Centro de confianza (nueva pestaña)','Read the documents in the Trust Center (new tab)')}</a></p>
        </div>
      </form>`;
    }

    return `<div class="auth-page">
      <div class="auth-card wide">
        <a href="#inicio" class="auth-brand"><img src="assets/logo-lockup.svg" alt="Origen Cultural"></a>
        ${progress}
        <div class="wizard-body">${body}</div>
        <div id="reg-error" class="form-error" role="alert" aria-live="assertive" style="display:none"></div>
        <div class="wizard-nav">
          ${step > 1 ? `<button class="btn secondary" id="reg-back">← ${L('Atrás','Back')}</button>` : '<div></div>'}
          <button class="btn" id="reg-next">${step < 5 ? L('Siguiente →','Next →') : L('Crear mi perfil','Create my profile')}</button>
        </div>
        <p class="auth-alt">${L('¿Ya tienes cuenta?','Already have an account?')} <a href="#login">${L('Iniciar sesión','Sign in')}</a></p>
      </div>
    </div>`;
  }

  /* ── LOGIN ───────────────────────────────────────────────── */
  function loginView() {
    const es = state.lang === 'es';
    return `<div class="auth-page">
      <div class="auth-card">
        <a href="#inicio" class="auth-brand"><img src="assets/logo-lockup.svg" alt="Origen Cultural"></a>
        <h2>${es ? 'Bienvenida de vuelta' : 'Welcome back'}</h2>
        <p class="auth-sub">${es ? 'Inicia sesión en tu cuenta de Origen Cultural' : 'Sign in to your Origen Cultural account'}</p>
        <form class="form-grid" id="login-form">
          <div class="form-field full"><label>${es ? 'Correo electrónico' : 'Email address'}</label><input type="email" name="email" required autocomplete="email"></div>
          <div class="form-field full"><label>${es ? 'Contraseña' : 'Password'}</label><input type="password" name="password" required autocomplete="current-password"></div>
          <div id="login-error" role="alert" aria-live="assertive" style="display:none;grid-column:1/-1"><p style="color:#c0392b;font-size:13px">${es ? 'Correo o contraseña incorrectos.' : 'Incorrect email or password.'}</p></div>
          ${captchaSlot('login')}
          <div class="form-field full"><button class="btn" type="submit" style="width:100%">${es ? 'Entrar' : 'Sign in'}</button></div>
        </form>
        <p class="auth-alt"><a href="#recuperar">${es ? '¿Olvidaste tu contraseña?' : 'Forgot your password?'}</a></p>
        <p class="auth-alt">${es ? '¿No tienes cuenta?' : "Don't have an account?"} <a href="#registro">${es ? 'Crear perfil cultural' : 'Create cultural profile'}</a></p>
        <p class="auth-alt"><a href="#explorar" style="color:#888">${es ? 'Explorar sin cuenta' : 'Explore without an account'} →</a></p>
      </div>
    </div>`;
  }

  function recoverPasswordView() {
    const es = state.lang === 'es';
    return `<div class="auth-page"><div class="auth-card">
      <a href="#inicio" class="auth-brand"><img src="assets/logo-lockup.svg" alt="Origen Cultural"></a>
      <h2>${es ? 'Recuperar contraseña' : 'Reset your password'}</h2>
      <p class="auth-sub">${es ? 'Te enviaremos un enlace seguro para restablecerla.' : 'We will send you a secure password-reset link.'}</p>
      <form class="form-grid" id="recover-form">
        <div class="form-field full"><label>${es ? 'Correo electrónico' : 'Email address'}</label><input type="email" name="email" required autocomplete="email"></div>
        <div id="recover-status" class="form-field full" role="status" aria-live="polite"></div>
        ${captchaSlot('recovery')}
        <div class="form-field full"><button class="btn" type="submit" style="width:100%">${es ? 'Enviar enlace' : 'Send reset link'}</button></div>
      </form>
      <p class="auth-alt"><a href="#login">← ${es ? 'Volver a iniciar sesión' : 'Back to sign in'}</a></p>
    </div></div>`;
  }

  function resetPasswordView() {
    const es = state.lang === 'es';
    return `<div class="auth-page"><div class="auth-card">
      <a href="#inicio" class="auth-brand"><img src="assets/logo-lockup.svg" alt="Origen Cultural"></a>
      <h2>${es ? 'Nueva contraseña' : 'New password'}</h2>
      <p class="auth-sub">${es ? 'Crea una contraseña nueva para tu cuenta ORIGEN.' : 'Create a new password for your ORIGEN account.'}</p>
      <form class="form-grid" id="reset-password-form">
        <div class="form-field full"><label>${es ? 'Nueva contraseña' : 'New password'}</label><input type="password" name="password" minlength="8" required autocomplete="new-password"></div>
        <div id="reset-status" class="form-field full" role="status" aria-live="polite"></div>
        <div class="form-field full"><button class="btn" type="submit" style="width:100%">${es ? 'Guardar nueva contraseña' : 'Save new password'}</button></div>
      </form>
    </div></div>`;
  }

  /* ── PASSPORT ────────────────────────────────────────────── */
  function passportView() {
    const es = state.lang === 'es';
    const user = me();
    const favs = remoteFavoriteRefs();
    const foll = remoteFollowRefs();
    const name = user ? user.name : (es ? 'Explorador Cultural' : 'Cultural Explorer');
    const init = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    const collectedRefs = new Set([...favs, ...foll]);
    const collected = directoryProfiles().filter(p => collectedRefs.has(p.id) || collectedRefs.has(p.slug));
    const countries = [...new Set(collected.map(p => p.country || (p.location || '').split(',').pop()?.trim()).filter(Boolean))];
    const cultures = [...new Set(collected.flatMap(p => p.categories || [p.category]).filter(Boolean))];

    const score = collected.length + (countries.length * 2) + cultures.length;
    const levels = [
      { name:es ? 'Semilla' : 'Seed', min:0, next:3 },
      { name:es ? 'Caminante Cultural' : 'Cultural Wayfinder', min:3, next:7 },
      { name:es ? 'Cartógrafo Cultural' : 'Cultural Cartographer', min:7, next:12 },
      { name:es ? 'Explorador Global' : 'Global Explorer', min:12, next:20 },
      { name:es ? 'Conector Cultural' : 'Cultural Connector', min:20, next:null }
    ];
    const level = [...levels].reverse().find(l => score >= l.min) || levels[0];
    const progress = level.next ? Math.max(0, Math.min(100, Math.round(((score - level.min) / (level.next - level.min)) * 100))) : 100;

    const badge = (unlocked, mark, title, body) => `
      <div class="badge${unlocked ? ' unlocked' : ' locked'}">
        <div class="badge-mark"><span>${unlocked ? mark : '○'}</span></div>
        <h3>${title}</h3>
        <p>${body}</p>
      </div>`;

    return `<section class="passport-page"><div class="passport-shell">
      <div class="section-head"><div><p class="eyebrow">${es ? 'COLECCIÓN CULTURAL GLOBAL' : 'GLOBAL CULTURAL COLLECTION'}</p><h1 style="font-size:clamp(48px,7vw,92px)">${t('passportTitle')}</h1></div><p>${es ? 'Tu Pasaporte Cultural crece cuando descubres, guardas y sigues cultura viva. El progreso premia aprendizaje y diversidad, no tiempo de pantalla.' : 'Your Cultural Passport grows as you discover, save and follow living culture. Progress celebrates learning and diversity, not screen time.'}</p></div>

      <article class="passport-card">
        <div class="passport-head"><img class="passport-logo" src="assets/logo-lockup.svg" alt="Origen Cultural"><div class="passport-id">${es ? 'PASAPORTE CULTURAL<br>COLECCIÓN PERSONAL' : 'CULTURAL PASSPORT<br>PERSONAL COLLECTION'}</div></div>
        <div class="passport-person"><div class="avatar">${init}</div><div><p class="eyebrow">${user && user.accountType === 'creator' ? (es ? 'AGENTE CULTURAL' : 'CULTURAL AGENT') : (es ? 'EXPLORADOR CULTURAL' : 'CULTURAL EXPLORER')}</p><h2>${esc(name)}</h2><p>${user && user.location ? esc(user.location) : (es ? 'Explorando cultura viva alrededor del mundo' : 'Exploring living culture around the world')}</p></div></div>
        <div class="passport-progress">
          <div class="progress-stat"><strong>${collected.length}</strong><span>${es ? 'Perfiles en tu colección' : 'Profiles in your collection'}</span></div>
          <div class="progress-stat"><strong>${countries.length}</strong><span>${es ? 'Países descubiertos' : 'Countries discovered'}</span></div>
          <div class="progress-stat"><strong>${cultures.length}</strong><span>${es ? 'Categorías culturales' : 'Cultural categories'}</span></div>
        </div>
      </article>

      <div class="level-section">
        <p class="eyebrow">${es ? 'NIVEL DE EXPLORACIÓN' : 'EXPLORATION LEVEL'}</p>
        <h2>${level.name}</h2>
        <div class="level-track"><div class="level-fill" style="width:${progress}%"></div></div>
        <p>${level.next ? (es ? `${progress}% hacia el siguiente nivel. Cada nueva cultura, territorio o categoría suma a tu recorrido.` : `${progress}% to the next level. Every new culture, territory or category adds to your journey.`) : (es ? 'Has alcanzado el nivel más alto de esta primera colección.' : 'You have reached the highest level in this first collection.')}</p>

        <div class="collection-strip">
          <div><strong>${countries.length || 0}</strong><span>${es ? 'Sellos de país' : 'Country stamps'}</span></div>
          <div><strong>${cultures.length || 0}</strong><span>${es ? 'Colecciones temáticas' : 'Themed collections'}</span></div>
          <div><strong>${favs.length}</strong><span>${es ? 'Memorias guardadas' : 'Saved memories'}</span></div>
        </div>

        ${countries.length ? `<div class="passport-stamps"><p class="eyebrow">${es ? 'MIS SELLOS' : 'MY STAMPS'}</p><div class="creator-tags">${countries.map(country => { const names = { Perú: 'Peru', México: 'Mexico', Japón: 'Japan' }; return `<span>⌖ ${esc(!es ? (names[country] || country) : country)}</span>`; }).join('')}</div></div>` : ''}

        <div class="badges">
          ${badge(collected.length >= 1, '⌖', es ? 'Primer descubrimiento' : 'First discovery', collected.length >= 1 ? (es ? 'Guardaste o seguiste tu primer perfil cultural.' : 'You saved or followed your first cultural profile.') : (es ? 'Descubre y guarda tu primer perfil cultural.' : 'Discover and save your first cultural profile.'))}
          ${badge(collected.length >= 3, '◇', es ? 'Coleccionista curioso' : 'Curious collector', collected.length >= 3 ? (es ? 'Ya reuniste tres perfiles culturales.' : 'You have collected three cultural profiles.') : (es ? 'Reúne tres perfiles culturales en tu Pasaporte.' : 'Collect three cultural profiles in your Passport.'))}
          ${badge(countries.length >= 2, '◎', es ? 'Cruce de fronteras' : 'Crossing borders', countries.length >= 2 ? (es ? 'Tu colección ya conecta al menos dos países.' : 'Your collection now connects at least two countries.') : (es ? 'Descubre cultura de al menos dos países.' : 'Discover culture from at least two countries.'))}
        </div>

        <div class="passport-philosophy">
          <p class="eyebrow">${es ? 'JUGAR SIN PERDER EL EQUILIBRIO' : 'PLAY IN BALANCE'}</p>
          <p>${es ? 'ORIGEN puede usar colecciones, niveles, sellos y retos culturales. No premiamos permanecer conectado más tiempo y evitamos castigar al usuario por tomarse días de descanso.' : 'ORIGEN may use collections, levels, stamps and cultural challenges. We do not reward longer screen time or penalise people for taking a break.'}</p>
        </div>
      </div>
    </div></section>${footer()}`;
  }

  /* ── IMPACT ──────────────────────────────────────────────── */
  function impactView() {
    const es = state.lang === 'es';
    const values = es ? [
      ['Dignidad cultural','La cultura se presenta con respeto, contexto y valor, no como espectáculo vacío.'],
      ['Autenticidad','La voz y la historia de cada Agente Cultural permanecen como eje central.'],
      ['Autonomía','Cada perfil conserva sus canales, decisiones, historia e identidad.'],
      ['Conexión global','La plataforma conecta culturas con públicos, aliados y oportunidades internacionales.'],
      ['Innovación ética','La tecnología apoya claridad y alcance sin inventar tradiciones.'],
      ['Soberanía narrativa','Cada creador decide qué mostrar, qué reservar y cómo ser contactado.']
    ] : [
      ['Cultural dignity','Culture is presented with respect, context and value, not as an empty spectacle.'],
      ['Authenticity','Each Cultural Agent’s voice and story remain at the centre.'],
      ['Autonomy','Every profile keeps control of its channels, decisions, story and identity.'],
      ['Global connection','The platform connects cultures with audiences, partners and international opportunities.'],
      ['Ethical innovation','Technology supports clarity and reach without inventing traditions.'],
      ['Narrative sovereignty','Each creator decides what to share, what to keep private and how to be contacted.']
    ];
    return `<section class="page-hero" style="background:var(--black);color:var(--white)">
      <div class="section-inner"><p class="eyebrow">${es ? 'PROPÓSITO · ÉTICA · ESCALA' : 'PURPOSE · ETHICS · SCALE'}</p><h1>${t('impactPage')}</h1><p class="lead" style="color:#ccc">${t('impactPageSub')}</p></div>
    </section>
    <section class="section"><div class="section-inner">
      <div class="section-head"><div><p class="eyebrow">${es ? 'VALORES DE MARCA' : 'BRAND VALUES'}</p><h2>${es ? 'La cultura con el valor que merece' : 'Culture with the value it deserves'}</h2></div><p>${es ? 'Origen Cultural prioriza consentimiento, representación autónoma, contexto y conexión humana.' : 'Origen Cultural prioritises consent, self-representation, context and human connection.'}</p></div>
      <div class="values-grid">${values.map((v, i) => `<article class="value-card"><span class="number">0${i + 1}</span><h3>${v[0]}</h3><p>${v[1]}</p></article>`).join('')}</div>
    </div></section>
    <section class="section impact-band"><div class="section-inner">
      <div class="section-head"><div><p class="eyebrow">ROADMAP</p><h2>${es ? 'De historias auténticas a una comunidad global' : 'From authentic stories to a global community'}</h2></div><p>${es ? 'Primero crecemos con Agentes que comparten cultura y Exploradores que descubren, siguen y comparten historias libremente. La publicidad pagada solo tendría sentido después de lograr una audiencia real.' : 'We begin by growing with Cultural Agents who share culture and Explorers who freely discover, follow and share stories. Paid promotion would only make sense after building a real audience.'}</p></div>
      <div class="impact-grid">
        <div class="impact-item"><strong>0</strong><span>${es ? 'Preparación, identidad y criterios de verificación' : 'Preparation, identity and verification criteria'}</span></div>
        <div class="impact-item"><strong>1</strong><span>${es ? 'Piloto Ecuador: hasta 10 Agentes Culturales voluntarios, después de aprobar seguridad y consentimiento' : 'Ecuador pilot: up to 10 volunteer Cultural Agents, after safety and consent approval'}</span></div>
        <div class="impact-item"><strong>2</strong><span>${es ? 'Comunidad orgánica: publicar historias culturales, descubrir Agentes, seguir, guardar y compartir sin pagar' : 'Organic community: publish cultural stories, discover Agents, follow, save and share for free'}</span></div>
        <div class="impact-item"><strong>3+</strong><span>${es ? 'Futuro: promociones pagadas opcionales; después, posibles comisiones acordadas por ventas derivadas a webs oficiales' : 'Future: optional paid promotion, followed by possible commissions agreed for sales referred to official websites'}</span></div>
      </div>
    </div></section>${footer()}`;
  }

  /* ── TRUST CENTER ───────────────────────────────────────── */
  function trustCenterView() {
    const trust = window.ORIGEN_TRUST;
    const es = state.lang === 'es';
    const L = (s, e) => es ? s : e;
    if (!trust) return `<section class="section"><div class="section-inner"><h2>${L('Centro de confianza no disponible','Trust Center unavailable')}</h2></div></section>`;
    const sections = es ? trust.sections : (trust.sections_en || trust.sections);
    return `<section class="page-hero trust-hero"><div class="section-inner">
      <p class="eyebrow">${L('CONFIANZA · PRIVACIDAD · CULTURA','TRUST · PRIVACY · CULTURE')}</p>
      <h1>${L('Centro de confianza','Trust Center')}</h1>
      <p class="lead">${L('Lo esencial para entender cómo ORIGEN cuida tu cuenta, tus datos, el contenido cultural y la comunidad.','Learn how ORIGEN cares for your account, data, cultural content and community.')}</p>
      <div class="trust-meta"><span>${esc(trust.version)}</span><span>${esc(trust.updated)}</span></div>
    </div></section>
    <section class="section trust-section"><div class="section-inner trust-layout">
      <aside class="trust-nav">${sections.map(s => `<a href="#trust-${s.id}">${esc(s.title)}</a>`).join('')}</aside>
      <div class="trust-content">
        <div class="trust-status"><strong>${L('Estado beta','Beta status')}</strong><p>${esc(es ? trust.status : (trust.status_en || trust.status))}</p></div>
        ${sections.map(s => `<article class="trust-card" id="trust-${s.id}"><p class="eyebrow">${esc(s.title)}</p>${s.body.map(p => `<p>${esc(p)}</p>`).join('')}</article>`).join('')}
        <article class="trust-card trust-contact"><p class="eyebrow">${L('CONTACTO','CONTACT')}</p><h2>${L('Ayuda, reportes y solicitudes','Help, reports and requests')}</h2><p><a href="#solicitar-revision">${L('Solicitar corrección o retirada sin crear cuenta','Request a correction or removal without an account')}</a></p><p><a href="mailto:${esc(trust.contact)}">${esc(trust.contact)}</a></p></article>
      </div>
    </div></section>${footer()}`;
  }

  /* ── PUBLIC RIGHTS / CONTENT REVIEW REQUEST ──────────────── */
  function rightsRequestView(route) {
    const es = state.lang === 'es';
    const L = (spanish, english) => es ? spanish : english;
    const routeMatch = /^solicitar-revision\/(post|perfil|usuario)\/([^/?#]+)$/.exec(route);
    const resourceType = routeMatch?.[1] || '';
    const resourceId = (routeMatch?.[2] || '').slice(0, 180);
    const sourceReference = resourceType
      ? resourceType + ': ' + resourceId
      : '';
    return `<section class="page-hero rights-hero">
      <div class="section-inner">
        <p class="eyebrow">${L('CUIDADO DE LA CULTURA Y LAS PERSONAS','PROTECTING CULTURE AND PEOPLE')}</p>
        <h1>${L('Solicitar revisión de contenido','Request a content review')}</h1>
        <p class="lead">${L(
          '¿Aparece tu imagen, tu obra o el conocimiento de tu comunidad sin autorización? Puedes solicitar revisión o corrección sin crear una cuenta.',
          'Is your image, work or community knowledge being shared without permission? You can request a review or correction without creating an account.'
        )}</p>
      </div>
    </section>
    <section class="section"><div class="section-inner rights-layout">
      <div class="rights-context">
        <h2>${L('¿Cómo funciona?','How it works')}</h2>
        <p>${L(
          'Describe el contenido y por qué te preocupa. Prepararemos un correo dirigido a ORIGEN, pero no se enviará nada desde la web.',
          'Describe the content and why it concerns you. We will prepare an email to ORIGEN, but nothing is sent from this website.'
        )}</p>
        <p>${L(
          'Tu aplicación de correo debe abrirse y tendrás que pulsar Enviar. Si no tienes correo configurado, escríbenos directamente a',
          'Your email app must open and you must press Send. If you do not have email configured, contact us directly at'
        )} <a href="mailto:info.origencultural@gmail.com">info.origencultural@gmail.com</a>.</p>
        <p>${L(
          'Evita incluir contraseñas, documentos de identidad, datos privados de menores o conocimiento cultural restringido en tu mensaje inicial.',
          'Do not include passwords, identity documents, children’s private information or restricted cultural knowledge in the initial message.'
        )}</p>
        <p>${L(
          'Las solicitudes requieren revisión humana. Enviar un mensaje no garantiza la retirada automática ni la verificación de la autoría.',
          'Requests require human review. Sending a message does not guarantee automatic removal or verification of ownership.'
        )}</p>
        <a href="#confianza">${L('Conocer las normas de ORIGEN','Read ORIGEN’s guidelines')} →</a>
      </div>
      <form class="form-grid rights-form" id="rights-review-form">
        <div class="form-field full"><label for="rights-reason">${L('¿Qué deseas revisar? *','What needs review? *')}</label>
          <select id="rights-reason" name="reason" required>
            <option value="">${L('Selecciona una opción','Select an option')}</option>
            <option value="image_permission">${L('Imagen o testimonio usado sin permiso','Photo or testimony used without permission')}</option>
            <option value="cultural_knowledge">${L('Conocimiento cultural sensible o sin autorización','Sensitive or unauthorised cultural knowledge')}</option>
            <option value="copyright">${L('Derechos de autor u obra original','Copyright or original work')}</option>
            <option value="representation">${L('Representación incorrecta de una persona o comunidad','Incorrect representation of a person or community')}</option>
            <option value="privacy">${L('Privacidad y datos personales','Privacy or personal data')}</option>
            <option value="other">${L('Otro motivo de revisión','Other review concern')}</option>
          </select>
        </div>
        <div class="form-field full"><label for="rights-reference">${L('Publicación, perfil o enlace relacionado','Related post, profile or link')}</label>
          <input id="rights-reference" name="reference" maxlength="500" value="${esc(sourceReference)}" placeholder="${L('Ej. enlace o nombre del perfil','e.g. link or profile name')}">
        </div>
        <div class="form-field full"><label for="rights-description">${L('Explícanos brevemente tu solicitud *','Briefly describe your request *')}</label>
          <textarea id="rights-description" name="description" rows="5" required minlength="15" maxlength="2500" placeholder="${L('Qué contenido es, qué derecho o consentimiento te preocupa y qué corrección solicitas.','What content is involved, your concern about rights or consent, and what correction you request.')}"></textarea>
        </div>
        <div class="form-field full"><button type="submit" class="btn">${L('Preparar correo de solicitud','Prepare review email')} →</button></div>
        <div id="rights-email-ready" class="rights-email-ready form-field full" aria-live="polite" hidden>
          <p>${L(
            'Tu solicitud está preparada, pero todavía NO se ha enviado. Abre tu aplicación de correo y pulsa Enviar.',
            'Your request is prepared but has NOT been sent. Open your email app and press Send.'
          )}</p>
          <a id="rights-email-link" class="btn secondary">${L('Abrir correo para enviarlo','Open email to send it')} ↗</a>
        </div>
      </form>
    </div></section>${footer()}`;
  }

  function bindRightsRequest() {
    const form = document.getElementById('rights-review-form');
    const ready = document.getElementById('rights-email-ready');
    const mail = document.getElementById('rights-email-link');
    if (!form || !ready || !mail) return;
    const resetPrepared = () => {
      ready.hidden = true;
      mail.removeAttribute('href');
    };
    form.addEventListener('input', resetPrepared);
    form.addEventListener('change', resetPrepared);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = new FormData(form);
      const reason = String(values.get('reason') || '');
      const reference = String(values.get('reference') || '').trim().slice(0, 500);
      const description = String(values.get('description') || '').trim().slice(0, 2500);
      if (!description || description.length < 15) {
        document.getElementById('rights-description')?.focus();
        return;
      }
      const reasons = {
        image_permission: 'Image / testimony permissions',
        cultural_knowledge: 'Cultural knowledge and community consent',
        copyright: 'Copyright / original work',
        representation: 'Incorrect representation',
        privacy: 'Personal data and privacy',
        other: 'Other'
      };
      if (!Object.hasOwn(reasons, reason)) return;
      const body = [
        'ORIGEN Cultural - content review request',
        '',
        'Reason: ' + reasons[reason],
        'Reference: ' + (reference || 'Not provided'),
        'Request details:',
        description,
        '',
        'Please reply to this email to discuss the request.',
        'This request was prepared by the website and is sent only when the sender presses Send in their email app.'
      ].join('\n');
      mail.href = 'mailto:info.origencultural@gmail.com?subject='
        + encodeURIComponent('ORIGEN - Content review request')
        + '&body=' + encodeURIComponent(body);
      ready.hidden = false;
      mail.focus();
    });
  }

  /* ═══════════════════════════════════════════════════════════
     ROUTER
  ═══════════════════════════════════════════════════════════ */
  function currentRoute() { return location.hash.replace(/^#\/?/, '') || (isAuth() ? 'feed' : 'inicio'); }
  function go(route)       { location.hash = '#' + route; }

  // Restricted moderation inbox: READ ONLY until a reviewed, auditable
  // moderator-decision service exists. Supabase RLS remains authoritative.
  function moderationQueueView() {
    const es = state.lang === 'es';
    if (!state.authReady) {
      return `<section class="page-container" role="status">${es ? 'Cargando sesión…' : 'Loading session…'}</section>`;
    }
    if (!me() || me()?.role !== 'admin') {
      return `<section class="page-container"><h1>${es ? 'Acceso restringido' : 'Restricted access'}</h1>
        <p>${es ? 'Esta sección está disponible únicamente para moderadores autorizados.' :
          'This section is available only to authorised moderators.'}</p>
        <a href="#inicio">${es ? 'Volver al inicio' : 'Back to home'}</a></section>`;
    }
    return `<section class="page-container" aria-labelledby="moderation-queue-title">
      <p class="eyebrow">${es ? 'SEGURIDAD Y COMUNIDAD' : 'SAFETY & COMMUNITY'}</p>
      <h1 id="moderation-queue-title">${es ? 'Reportes para revisión' : 'Reports for review'}</h1>
      <p>${es
        ? 'Bandeja privada de solo lectura, limitada a los 50 reportes más recientes. No envía avisos ni aplica sanciones.'
        : 'Private read-only inbox, limited to the 50 most recent reports. It does not notify users or apply sanctions.'}</p>
      <p>${es
        ? 'Los datos pueden ser sensibles. No los compartas fuera del proceso de moderación.'
        : 'Reports may contain sensitive information. Do not share them outside moderation.'}</p>
      <div id="moderation-queue" aria-live="polite" aria-busy="true"></div>
    </section>`;
  }

  async function bindModerationQueue() {
    const root = document.getElementById('moderation-queue');
    const uid = me()?.id || null;
    if (!root || !uid || me()?.role !== 'admin') return;
    const es = state.lang === 'es';
    root.textContent = es ? 'Consultando reportes…' : 'Loading reports…';
    try {
      const reports = await window.ORIGEN_API.listModerationReports(uid);
      if (me()?.id !== uid || me()?.role !== 'admin' ||
          currentRoute() !== 'moderacion' || !root.isConnected) return;
      root.replaceChildren();
      if (!reports.length) {
        root.textContent = es ? 'No hay reportes para mostrar.' : 'No reports to display.';
        return;
      }
      for (const report of reports) {
        const item = document.createElement('article');
        item.className = 'card';
        item.style.marginBlock = '16px';
        item.style.padding = '20px';

        const title = document.createElement('h2');
        title.textContent = String(report.reason || (es ? 'Sin motivo' : 'No reason'));
        item.appendChild(title);

        const metadata = document.createElement('p');
        metadata.textContent = [
          String(report.status || ''),
          String(report.target_type || ''),
          String(report.target_id || ''),
          String(report.created_at || '')
        ].join(' · ');
        metadata.style.overflowWrap = 'anywhere';
        item.appendChild(metadata);

        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = es ? 'Ver contexto reportado' : 'View report context';
        details.appendChild(summary);
        const content = document.createElement('p');
        // Untrusted user-submitted details MUST remain inert text, not HTML.
        content.textContent = String(report.details || (es ? 'Sin contexto adicional.' : 'No additional context.'));
        content.style.whiteSpace = 'pre-wrap';
        content.style.overflowWrap = 'anywhere';
        details.appendChild(content);
        item.appendChild(details);
        root.appendChild(item);
      }
    } catch (_) {
      if (me()?.id !== uid || currentRoute() !== 'moderacion' || !root.isConnected) return;
      root.textContent = es
        ? 'No fue posible consultar los reportes. Verifica tu sesión y permisos.'
        : 'Could not load reports. Check your session and permissions.';
    } finally {
      if (me()?.id === uid && currentRoute() === 'moderacion' && root.isConnected) {
        root.setAttribute('aria-busy', 'false');
      }
    }
  }

  let _prevRoute = '';

  function render(route, scroll = true) {
    route = route !== undefined ? route : currentRoute();
    refreshSession();

    // Keep permalink stories isolated from the general paginated feed cache.
    state.publicStoryPost = null;

    // Destroy globes when leaving their sections
    if (_prevRoute === 'mundo'  && route !== 'mundo'  && window.MundoCultural) window.MundoCultural.destroy();
    if (_prevRoute === 'inicio' && route !== 'inicio' && window.HeroGlobe)     window.HeroGlobe.destroy();
    _prevRoute = route;

    let html = '';
    if      (route === 'inicio')                  html = isAuth() ? feedView()            : landingView();
    else if (route === 'feed')                    html = feedView();
    else if (route.startsWith('publicacion/'))     html = publicStoryView();
    else if (route === 'explorar')                html = exploreView();
    else if (route === 'mundo')                   html = mundoView();
    else if (route.startsWith('perfil/'))         html = creatorProfileView(route.split('/')[1]);
    else if (route.startsWith('reclamar/'))        html = claimProfileView(route.split('/')[1]);
    else if (route.startsWith('usuario/'))        html = userProfileView(route.split('/')[1]);
    else if (route === 'mi-perfil')               html = myProfileView();
    else if (route === 'editar-perfil')           html = editProfileView();
    else if (route === 'guardados')               html = savedView();
    else if (route === 'crear')                   html = createPostView();
    else if (route === 'registro')                html = registerView();
    else if (route === 'login')                   html = loginView();
    else if (route === 'recuperar')               html = recoverPasswordView();
    else if (route === 'restablecer')             html = resetPasswordView();
    else if (route === 'pasaporte')               html = passportView();
    else if (route === 'impacto')                 html = impactView();
    else if (route === 'confianza')                html = trustCenterView();
    else if (route === 'moderacion')               html = moderationQueueView();
    else if (route === 'solicitar-revision' || route.startsWith('solicitar-revision/')) html = rightsRequestView(route);
    else                                          html = isAuth() ? feedView() : landingView();

    $app.innerHTML = html;
    updateShell();
    enhanceAccessibility();
    bindAll(route);
    if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /* ═══════════════════════════════════════════════════════════
     EVENT BINDING
  ═══════════════════════════════════════════════════════════ */
  function bindAll(route) {
    bindPostInteractions();
    bindFavorites();
    if (document.getElementById('feed-posts')) bindFeedExperience();
    if (route === 'explorar')      bindExplore();
    if (route.startsWith('publicacion/')) bindPublicStory(route);
    if (route.startsWith('reclamar/')) bindClaimProfile();
    if (route === 'registro')      bindRegister();
    if (route === 'solicitar-revision' || route.startsWith('solicitar-revision/')) bindRightsRequest();
    if (route === 'login')         bindLogin();
    if (route === 'recuperar')     bindRecoverPassword();
    if (route === 'restablecer')   bindResetPassword();
    if (route === 'crear')         bindCreatePost();
    if (route === 'editar-perfil') bindEditProfile();
    if (route === 'moderacion')    bindModerationQueue();
    if (route === 'mundo')         bindMundo();
    if (route === 'inicio')        bindLanding();
    bindFollowButtons();
    bindLogoutBtn();
  }

  /* ── MUNDO CULTURAL ─────────────────────────────────────────── */
  function mundoView() {
    const es = state.lang === 'es';
    const continents = ['Todos','América del Sur','América del Norte','Asia','Oceanía','Europa','África'];
    const featured   = [
      { key:'ecuador',   flag:'🇪🇨', name:'Ecuador'   },
      { key:'australia', flag:'🇦🇺', name:'Australia'  },
      { key:'peru',      flag:'🇵🇪', name:'Perú'       },
      { key:'bolivia',   flag:'🇧🇴', name:'Bolivia'    },
      { key:'mexico',    flag:'🇲🇽', name:'México'     },
      { key:'japan',     flag:'🇯🇵', name:'Japón'      },
    ];
    return `
      <div class="mundo-page">
        <div class="mundo-header">
          <p class="eyebrow">${es ? 'EXPLORACIÓN CULTURAL' : 'CULTURAL EXPLORATION'}</p>
          <h1 class="mundo-title">${es ? 'Mundo Cultural' : 'Cultural World'}</h1>
          <p class="mundo-lead">${es ? 'Descubre culturas vivas alrededor del planeta. Gira el globo, selecciona un territorio y conecta con sus agentes culturales.' : 'Discover living cultures around the world. Rotate the globe, select a territory and connect with its cultural agents.'}</p>
        </div>
        <div class="mundo-body">
          <div class="mundo-globe-wrap">
            <div id="globe-container"></div>
            <div class="globe-ui-top">
              <div class="continent-pills">
                ${continents.map((c, i) => { const names = { Todos: 'All', 'América del Sur': 'South America', 'América del Norte': 'North America', Asia: 'Asia', Oceanía: 'Oceania', Europa: 'Europe', África: 'Africa' }; return `<button class="cont-pill${i===0?' active':''}" data-cont="${c}">${es ? c : names[c]}</button>`; }).join('')}
              </div>
            </div>
            <div class="globe-ui-bottom">
              <div class="globe-controls">
                <button id="globe-zoom-in" class="globe-ctrl" title="${es ? 'Acercar' : 'Zoom in'}" aria-label="${es ? 'Acercar globo' : 'Zoom in on globe'}">+</button>
                <button id="globe-pause" class="globe-ctrl" title="${es ? 'Pausar rotación' : 'Pause rotation'}" aria-label="${es ? 'Pausar o reanudar rotación' : 'Pause or resume rotation'}">⏸</button>
                <button id="globe-reset" class="globe-ctrl" title="${es ? 'Vista inicial' : 'Reset view'}" aria-label="${es ? 'Restablecer vista del globo' : 'Reset globe view'}">⟳</button>
                <button id="globe-zoom-out" class="globe-ctrl" title="${es ? 'Alejar' : 'Zoom out'}" aria-label="${es ? 'Alejar globo' : 'Zoom out on globe'}">−</button>
              </div>
              <p class="globe-hint">${es ? 'Gira · Acerca · Toca un país' : 'Rotate · Zoom in · Select a country'}</p>
            </div>
          </div>
          <aside class="mundo-panel" id="mundo-panel">
            <div class="panel-welcome">
              <div class="panel-welcome-icon">◎</div>
              <h3>${es ? 'Selecciona un territorio' : 'Select a territory'}</h3>
              <p>${es ? 'Haz clic en cualquier país del globo para descubrir su identidad cultural y los agentes culturales registrados en Origen Cultural.' : 'Select a country on the globe to discover its cultural identity and the cultural agents registered with Origen Cultural.'}</p>
              <p class="eyebrow" style="margin-top:28px">${es ? 'TERRITORIOS DISPONIBLES' : 'AVAILABLE TERRITORIES'}</p>
              <div class="featured-countries">
                ${featured.map(f => `<button class="featured-country" data-fc="${f.key}"><span>${f.flag}</span><span>${f.name}</span></button>`).join('')}
              </div>
            </div>
          </aside>
        </div>
      </div>`;
  }

  /* ── LANDING / HERO GLOBE ───────────────────────────────────── */
  function bindLanding() {
    const container = document.getElementById('hero-globe-container');
    const popup     = document.getElementById('hero-globe-popup');
    if (!container || typeof HeroGlobe === 'undefined') return;

    HeroGlobe.init(container, popup);

    document.getElementById('hero-globe-pause')?.addEventListener('click',
      () => HeroGlobe.toggleRotation());
    document.getElementById('hero-globe-zoom-in')?.addEventListener('click',
      () => HeroGlobe.zoom(0.7));
    document.getElementById('hero-globe-zoom-out')?.addEventListener('click',
      () => HeroGlobe.zoom(1.4));

    /* territory pills */
    document.querySelectorAll('[data-hgt]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.hgt;
        const db  = window.MundoCultural?._db?.[key];
        if (!db || !popup) return;
        /* reuse HeroGlobe popup logic by dispatching a fake click */
        /* Actually: navigate to #mundo and select country */
        window.location.hash = '#mundo';
        setTimeout(() => { try { window.MundoCultural.selectCountry(key); } catch {} }, 600);
      });
    });

    /* scroll to next section on mobile hint tap */
    document.querySelector('.hero-globe-hint')?.addEventListener('click', () => {
      document.querySelector('.manifesto')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  function bindMundo() {
    const globeEl = document.getElementById('globe-container');
    const panelEl = document.getElementById('mundo-panel');
    if (!globeEl || !panelEl || typeof MundoCultural === 'undefined') return;

    MundoCultural.init(globeEl, panelEl);

    document.getElementById('globe-pause')?.addEventListener('click',    () => MundoCultural.toggleRotation());
    document.getElementById('globe-reset')?.addEventListener('click',    () => MundoCultural.resetView());
    document.getElementById('globe-zoom-in')?.addEventListener('click',  () => MundoCultural.zoom(0.7));
    document.getElementById('globe-zoom-out')?.addEventListener('click', () => MundoCultural.zoom(1.4));

    document.querySelectorAll('.cont-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cont-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        MundoCultural.focusContinent(btn.dataset.cont);
      });
    });

    panelEl.querySelectorAll('[data-fc]').forEach(btn => {
      btn.addEventListener('click', () => MundoCultural.selectCountry(btn.dataset.fc));
    });
  }

  /* Post interactions (like, comment, save, share, report, carousel) */
  function bindPostInteractions(root = document) {
    /* likes */
    root.querySelectorAll('[data-like]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!isAuth()) { showToast('Inicia sesión para dar me gusta.'); go('login'); return; }
        const pid = btn.dataset.like;
        try {
          await window.ORIGEN_API.toggleLike(pid);
          rerenderPost(pid);
        } catch (error) {
          showToast(error.message || 'No pudimos actualizar el me gusta.');
        }
      });
    });

    /* toggle comments */
    root.querySelectorAll('[data-tcoms]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pid = btn.dataset.tcoms;
        if (state.openComments.has(pid)) {
          state.openComments.delete(pid);
        } else {
          state.openComments.add(pid);
          try { await window.ORIGEN_API.listComments(pid); } catch (_) {}
        }
        rerenderPost(pid);
      });
    });

    /* saves */
    root.querySelectorAll('[data-save]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!isAuth()) { showToast('Inicia sesión para guardar publicaciones.'); go('login'); return; }
        const pid = btn.dataset.save;
        try {
          const added = await window.ORIGEN_API.toggleSavePost(pid);
          showToast(added ? 'Publicación guardada.' : 'Publicación eliminada de guardados.');
          rerenderPost(pid);
        } catch (error) {
          showToast(error.message || 'No pudimos actualizar tus guardados.');
        }
      });
    });

    /* share: always link to the exact public story, never a generic feed */
    root.querySelectorAll('[data-share]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.share || '';
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return;
        const url = window.location.origin + window.location.pathname + '#publicacion/' + encodeURIComponent(id);
        const es = state.lang === 'es';
        if (navigator.share) {
          try {
            await navigator.share({ title: es ? 'Historia cultural · ORIGEN' : 'Cultural story · ORIGEN', url });
            return;
          } catch (error) {
            if (error?.name === 'AbortError') return; // User cancelled.
          }
        }
        try {
          if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
          await navigator.clipboard.writeText(url);
          showToast(es ? 'Enlace de esta historia copiado.' : 'Story link copied.');
        } catch (_) {
          showToast((es ? 'Enlace para compartir: ' : 'Share this link: ') + url);
        }
      });
    });

    /* report */
    root.querySelectorAll('[data-report]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!isAuth()) {
          go('solicitar-revision/post/' + encodeURIComponent(btn.dataset.report || ''));
          return;
        }
        if (!$report) return;
        const form = document.getElementById('report-form');
        form?.reset();
        $report.dataset.targetType = 'post';
        $report.dataset.targetId = btn.dataset.report || '';
        const status = document.getElementById('report-status');
        if (status) status.textContent = '';
        updateStaticLanguage();
        $report.showModal();
        requestAnimationFrame(() => document.getElementById('report-reason')?.focus());
      });
    });

    /* more (···) */
    root.querySelectorAll('[data-pmore]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid  = btn.dataset.pmore;
        const user = me();
        const post = displayedPost(pid);
        if (user && post && post.authorId === user.id) {
          if (!$deletePost) return;
          $deletePost.dataset.postId = pid;
          const status = document.getElementById('delete-post-status');
          if (status) status.textContent = '';
          updateStaticLanguage();
          $deletePost.showModal();
          requestAnimationFrame(() => document.getElementById('delete-post-cancel')?.focus());
        } else {
          showToast('Reportar o guardar este perfil para no ver más contenido similar.');
        }
      });
    });

    /* carousel navigation */
    root.querySelectorAll('[data-cdir]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const pid  = btn.dataset.car;
        const dir  = parseInt(btn.dataset.cdir, 10);
        const post = displayedPost(pid);
        if (!post) return;
        const cur  = state.carIdx[pid] || 0;
        state.carIdx[pid] = Math.max(0, Math.min(post.media.length - 1, cur + dir));
        rerenderPost(pid);
      });
    });
    root.querySelectorAll('[data-car][data-ci]').forEach(dot => {
      dot.addEventListener('click', e => {
        e.stopPropagation();
        state.carIdx[dot.dataset.car] = parseInt(dot.dataset.ci, 10);
        rerenderPost(dot.dataset.car);
      });
    });

    /* comment forms */
    root.querySelectorAll('[data-cf]').forEach(form => {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const pid = form.dataset.cf;
        const text = new FormData(form).get('text').trim();
        if (!text || !isAuth()) return;
        try {
          await window.ORIGEN_API.addComment(pid, text);
          rerenderPost(pid);
        } catch (error) {
          showToast(error.message || 'No pudimos publicar el comentario.');
        }
      });
    });

    /* needs-auth buttons */
    root.querySelectorAll('[data-needs-auth]').forEach(btn => {
      btn.addEventListener('click', e => {
        if (!isAuth()) { e.stopPropagation(); showToast('Inicia sesión para interactuar.'); go('login'); }
      }, true);
    });
  }

  function bindFeedExperience() {
    bindFeedVideos();

    const sentinel = document.getElementById('feed-sentinel');
    if (!sentinel || window.ORIGEN_API?.cache?.postsExhausted) return;

    const observer = new IntersectionObserver(async entries => {
      if (!entries.some(entry => entry.isIntersecting) || state.feedLoading) return;
      state.feedLoading = true;
      sentinel.setAttribute('aria-busy', 'true');
      const y = window.scrollY;
      try {
        await window.ORIGEN_API.loadMorePosts();
        render(currentRoute(), false);
        requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
      } catch (error) {
        showToast(error.message || 'No pudimos cargar más publicaciones.');
      } finally {
        state.feedLoading = false;
      }
    }, { rootMargin: '500px 0px', threshold: 0.01 });

    observer.observe(sentinel);
  }

  function bindFeedVideos() {
    const videos = [...document.querySelectorAll('.post-media video')];
    if (!videos.length) return;

    const pauseOthers = active => {
      videos.forEach(video => { if (video !== active && !video.paused) video.pause(); });
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          pauseOthers(video);
          video.muted = true;
          const playPromise = video.play();
          if (playPromise?.catch) playPromise.catch(() => {});
        } else if (!video.paused) {
          video.pause();
        }
      });
    }, { threshold: [0, .3, .7, 1] });

    videos.forEach(video => observer.observe(video));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) videos.forEach(video => video.pause());
    }, { once: true });
  }

  /* Re-render a single post card in place */
  // Permalinks may refer to posts older than the paginated feed.
  function displayedPost(pid) {
    if (currentRoute() === 'publicacion/' + pid && state.publicStoryPost?.id === pid) return state.publicStoryPost;
    return allPosts().find(post => post.id === pid) || null;
  }

  function rerenderPost(pid) {
    const card = document.querySelector(`[data-pid="${pid}"]`);
    const post = displayedPost(pid);
    if (!card || !post) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = postCard(post);
    const newCard = tmp.firstElementChild;
    if (!newCard) return;
    card.replaceWith(newCard);
    // Rebind ONLY this card: global rebinding duplicates events on other posts.
    bindPostInteractions(newCard);
    bindFollowButtons(newCard);
  }

  /* Favorites (directory profiles) */
  function bindFavorites() {
    document.querySelectorAll('[data-favorite]').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.preventDefault(); e.stopPropagation();
        if (!isAuth()) { showToast('Inicia sesión para guardar perfiles.'); go('login'); return; }
        const ref = btn.dataset.favorite;
        try {
          const id = await culturalProfileId(ref);
          if (!id) throw new Error('Perfil cultural no encontrado.');
          const exists = window.ORIGEN_API.cache.favorites.includes(id);
          const uid = me().id;
          const query = exists
            ? window.ORIGEN_API.client.from('favorites').delete().eq('user_id', uid).eq('cultural_profile_id', id)
            : window.ORIGEN_API.client.from('favorites').insert({ user_id: uid, cultural_profile_id: id });
          const { error } = await query;
          if (error) throw error;
          await window.ORIGEN_API.myFavorites();
          showToast(exists ? 'Perfil eliminado de guardados.' : 'Perfil guardado en tu Pasaporte Cultural.');
          render(currentRoute(), false);
        } catch (error) {
          showToast(error.message || 'No pudimos actualizar tus guardados.');
        }
      });
    });
  }

  /* Follow buttons (user or creator) */
  function bindFollowButtons(root = document) {
    root.querySelectorAll('[data-fuser]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!isAuth()) { showToast('Inicia sesión para seguir.'); go('login'); return; }
        const ref = btn.dataset.fuser;
        try {
          const id = await culturalProfileId(ref);
          if (!id) {
            showToast('Este seguimiento todavía no está disponible para este tipo de perfil.');
            return;
          }
          const exists = window.ORIGEN_API.cache.follows.includes(id);
          const uid = me().id;
          const query = exists
            ? window.ORIGEN_API.client.from('follows').delete().eq('user_id', uid).eq('cultural_profile_id', id)
            : window.ORIGEN_API.client.from('follows').insert({ user_id: uid, cultural_profile_id: id });
          const { error } = await query;
          if (error) throw error;
          await window.ORIGEN_API.myFollows();
          btn.textContent = exists ? '+ Seguir' : 'Siguiendo';
          btn.classList.toggle('on', !exists);
          showToast(exists ? 'Dejaste de seguir este perfil.' : '¡Ahora sigues este perfil cultural!');
        } catch (error) {
          showToast(error.message || 'No pudimos actualizar el seguimiento.');
        }
      });
    });
  }

  /* Logout */
  function bindLogoutBtn() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', doLogout);
    const logoutAside = document.getElementById('logout-btn-aside');
    if (logoutAside) logoutAside.addEventListener('click', doLogout);
  }

  /* Explore */
  function bindExplore() {
    renderExploreGrid();
    const searchEl = document.getElementById('explore-search');
    if (searchEl) searchEl.addEventListener('input', e => { state.query = e.target.value; renderExploreGrid(); });
    document.querySelectorAll('[data-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeCategory = btn.dataset.category;
        document.querySelectorAll('[data-category]').forEach(b => b.classList.toggle('active', b === btn));
        renderExploreGrid();
      });
    });
    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) clearBtn.addEventListener('click', () => { state.query = ''; state.activeCategory = 'Todos'; render('explorar', false); });
  }

  function bindClaimProfile() {
    const form = document.getElementById('claim-form');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const status = document.getElementById('claim-status');
      const submit = form.querySelector('button[type="submit"]');
      if (submit) { submit.disabled = true; submit.textContent = state.lang === 'es' ? 'Enviando…' : 'Submitting…'; }
      try {
        const profileId = await culturalProfileId(form.dataset.profileRef);
        if (!profileId) throw new Error(state.lang === 'es' ? 'No encontramos el perfil de referencia en la base de datos.' : 'We could not find the reference profile in the database.');
        const fd = Object.fromEntries(new FormData(form));
        await window.ORIGEN_API.submitClaim({ cultural_profile_id: profileId, claimant_name: fd.claimant_name, relationship_role: fd.relationship_role, official_email: fd.official_email, official_url: fd.official_url, explanation: fd.explanation, authority_declaration: fd.authority === 'on' });
        if (status) status.textContent = state.lang === 'es' ? 'Solicitud recibida. Estado: pendiente de revisión.' : 'Claim received. Status: pending review.';
        if (submit) submit.textContent = state.lang === 'es' ? 'Solicitud enviada' : 'Claim submitted';
        showToast(state.lang === 'es' ? 'Solicitud de reclamación enviada.' : 'Profile claim submitted.');
      } catch (error) {
        if (status) status.textContent = error.message || (state.lang === 'es' ? 'No pudimos enviar la solicitud.' : 'We could not submit the claim.');
        if (submit) { submit.disabled = false; submit.textContent = state.lang === 'es' ? 'Enviar solicitud para revisión' : 'Submit claim for review'; }
      }
    });
  }
  /* Login */
  function bindLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;
    void mountTurnstile('login');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const { email, password } = Object.fromEntries(new FormData(form));
      const submit = form.querySelector('button[type="submit"]');
      if (submit) { submit.disabled = true; submit.textContent = state.lang === 'es' ? 'Entrando…' : 'Signing in…'; }
      try {
        const captchaToken = requireCaptchaToken('login');
        // Capture before doLogin clears account drafts on account switch.
        const returnRoute = state.authReturnRoute;
        await doLogin(email, password, captchaToken);
        state.authReturnRoute = null;
        updateShell();
        go(returnRoute || 'feed');
      } catch (error) {
        const err = document.getElementById('login-error');
        if (err) {
          err.style.display = 'block';
          const p = err.querySelector('p');
          if (p) p.textContent = error.message || (state.lang === 'es' ? 'No pudimos iniciar sesión.' : 'We could not sign you in.');
        }
      } finally {
        resetTurnstile('login');
        if (submit) { submit.disabled = false; submit.textContent = state.lang === 'es' ? 'Entrar' : 'Sign in'; }
      }
    });
  }


  function bindRecoverPassword() {
    const form = document.getElementById('recover-form');
    if (!form) return;
    void mountTurnstile('recovery');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const email = new FormData(form).get('email');
      const status = document.getElementById('recover-status');
      try {
        const captchaToken = requireCaptchaToken('recovery');
        await window.ORIGEN_API.resetPassword(email, captchaToken);
        if (status) status.textContent = state.lang === 'es' ? 'Revisa tu correo. Si existe una cuenta, recibirás un enlace de recuperación.' : 'Check your email. If an account exists, you will receive a recovery link.';
      } catch (error) {
        if (status) status.textContent = error.message || (state.lang === 'es' ? 'No pudimos enviar el enlace.' : 'We could not send the recovery link.');
      } finally {
        resetTurnstile('recovery');
      }
    });
  }

  function bindResetPassword() {
    const form = document.getElementById('reset-password-form');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const password = new FormData(form).get('password');
      const status = document.getElementById('reset-status');
      try {
        await window.ORIGEN_API.updatePassword(password);
        if (status) status.textContent = state.lang === 'es' ? 'Contraseña actualizada. Ya puedes continuar.' : 'Password updated. You can continue now.';
        setTimeout(() => go('feed'), 900);
      } catch (error) {
        if (status) status.textContent = error.message || (state.lang === 'es' ? 'No pudimos actualizar la contraseña.' : 'We could not update the password.');
      }
    });
  }

  // Preserve unfinished registration inputs when people move backwards on
  // mobile. No localStorage/sessionStorage persistence for passwords or files.
  function saveRegisterStepDraft(step) {
    const formId = step === 2 ? 'reg-basic' : step === 4 ? 'reg-story' : step === 5 ? 'reg-social' : null;
    const form = formId && document.getElementById(formId);
    if (!form) return;
    const fields = Object.fromEntries(new FormData(form));
    if (step === 2) {
      for (const key of ['name', 'email', 'password', 'country', 'cityGeonameId']) {
        if (key in fields) state.regData[key] = fields[key];
      }
      Object.assign(state.regData, selectedLocation(form));
    } else if (step === 4) {
      Object.assign(state.regData, fields);
      state.regData.services = fields.services
        ? fields.services.split(',').map(item => item.trim()).filter(Boolean)
        : [];
    } else if (step === 5) {
      const links = {};
      for (const key of ['instagram','facebook','tiktok','youtube','linkedin','whatsapp','email','web']) {
        if (fields[key]) links[key] = fields[key];
      }
      state.regData.links = links;
      state.regData.acceptedLegal = fields.acceptedLegal === 'on';
    }
  }

  /* Register wizard */
  function bindRegister() {
    // Password is kept only in the current in-memory wizard, not in the HTML
    // template, URL or persistent browser storage.
    const previousPassword = document.querySelector('#reg-basic [name="password"]');
    if (previousPassword && state.regData.password) previousPassword.value = state.regData.password;
    if (state.regStep === 2) {
      bindLocationSelects(document.getElementById('reg-basic'));
    }
    if (state.regStep === 5) void mountTurnstile('signup');
    /* account type selection */
    document.querySelectorAll('[data-atype]').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('[data-atype]').forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-pressed','false'); });
        card.classList.add('selected');
        card.setAttribute('aria-pressed','true');
        state.regData.accountType = card.dataset.atype;
      });
    });

    /* category chips */
    document.querySelectorAll('[data-cat]').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        chip.setAttribute('aria-pressed', chip.classList.contains('active') ? 'true' : 'false');
        const cat  = chip.dataset.cat;
        if (!state.regData.categories) state.regData.categories = [];
        const idx  = state.regData.categories.indexOf(cat);
        if (idx === -1) state.regData.categories.push(cat);
        else            state.regData.categories.splice(idx, 1);
      });
    });

    /* photo uploads (step 3) */
    const regAvatarInput = document.getElementById('reg-avatar-input');
    if (regAvatarInput) {
      regAvatarInput.addEventListener('change', async e => {
        const file = e.target.files[0]; if (!file) return;
        try {
          window.ORIGEN_API.validateUpload('avatars', file);
        } catch (error) {
          const message = document.getElementById('reg-error');
          if (message) { message.textContent = error.message; message.style.display = 'block'; }
          e.target.value = '';
          return;
        }
        releasePreview(state.regData.avatar);
        state.regData.avatarFile = file;
        state.regData.avatar = URL.createObjectURL(file);
        render('registro', false);
      });
    }
    const regCoverInput = document.getElementById('reg-cover-input');
    if (regCoverInput) {
      regCoverInput.addEventListener('change', async e => {
        const file = e.target.files[0]; if (!file) return;
        try {
          window.ORIGEN_API.validateUpload('covers', file);
        } catch (error) {
          const message = document.getElementById('reg-error');
          if (message) { message.textContent = error.message; message.style.display = 'block'; }
          e.target.value = '';
          return;
        }
        releasePreview(state.regData.cover);
        state.regData.coverFile = file;
        state.regData.cover = URL.createObjectURL(file);
        render('registro', false);
      });
    }

    /* back */
    const backBtn = document.getElementById('reg-back');
    if (backBtn) backBtn.addEventListener('click', () => {
      saveRegisterStepDraft(state.regStep);
      state.regStep--;
      render('registro');
    });

    /* next / submit */
    const nextBtn = document.getElementById('reg-next');
    if (!nextBtn) return;
    // Enter on a mobile keyboard should advance the wizard, not submit the
    // native form and reload the page (which would discard private drafts).
    for (const formId of ['reg-basic', 'reg-story', 'reg-social']) {
      const form = document.getElementById(formId);
      if (!form) continue;
      form.addEventListener('submit', event => {
        event.preventDefault();
        if (!nextBtn.disabled) nextBtn.click();
      });
      // Multi-input forms without a native submit button do not always
      // submit on Enter. Support mobile keyboard "Go" explicitly on the
      // first two steps, while keeping Enter inside textareas as a newline
      // and requiring an intentional final legal-confirmation button press.
      if (formId !== 'reg-social') form.addEventListener('keydown', event => {
        if (event.key !== 'Enter' || event.isComposing ||
            !(event.target instanceof HTMLInputElement)) return;
        event.preventDefault();
        if (!nextBtn.disabled) nextBtn.click();
      });
    }
    nextBtn.addEventListener('click', async () => {
      if (nextBtn.disabled) return;
      const step = state.regStep;
      const errEl = document.getElementById('reg-error');

      if (step === 1) {
        if (!state.regData.accountType) { if (errEl) { errEl.textContent = state.lang === 'es' ? 'Selecciona un tipo de cuenta.' : 'Select an account type.'; errEl.style.display = 'block'; } return; }
        if (errEl) errEl.style.display = 'none';
        state.regStep++; render('registro');
      } else if (step === 2) {
        const form = document.getElementById('reg-basic');
        if (!form || !form.reportValidity()) return;
        saveRegisterStepDraft(2);
        state.regStep++; render('registro');
      } else if (step === 3) {
        state.regStep++; render('registro');
      } else if (step === 4) {
        const form = document.getElementById('reg-story');
        if (form) saveRegisterStepDraft(4);
        state.regStep++; render('registro');
      } else if (step === 5) {
        const form = document.getElementById('reg-social');
        if (!form || !form.reportValidity()) return;
        saveRegisterStepDraft(5);
        if (!state.regData.acceptedLegal) {
          if (errEl) { errEl.textContent = state.lang === 'es' ? 'Debes aceptar los documentos esenciales de ORIGEN para crear tu cuenta.' : 'You must accept ORIGEN’s essential documents to create your account.'; errEl.style.display = 'block'; }
          return;
        }
        try {
          state.regData.captchaToken = requireCaptchaToken('signup');
        } catch (error) {
          if (errEl) { errEl.textContent = error.message; errEl.style.display = 'block'; }
          return;
        }
        nextBtn.disabled = true;
        nextBtn.textContent = state.lang === 'es' ? 'Creando cuenta…' : 'Creating account…';
        const result = await doRegister(state.regData);
        if (result.ok) {
          resetTurnstile('signup');
          const requiresConfirmation = result.requiresEmailConfirmation;
          releasePreview(state.regData.avatar);
          releasePreview(state.regData.cover);
          state.regStep = 1; state.regData = {};
          if (requiresConfirmation) {
            showToast(state.lang === 'es' ? 'Revisa tu correo para confirmar tu cuenta.' : 'Check your email to confirm your account.');
            go('login');
          } else if (!result.profileReady) {
            showToast(state.lang === 'es'
              ? 'Cuenta creada. No pudimos terminar de cargar tu perfil; inicia sesión para completarlo.'
              : 'Account created. Profile setup was interrupted; sign in to complete it.');
            go('login');
          } else {
            showToast(result.setupWarning === 'media'
              ? (state.lang === 'es'
                ? 'Cuenta creada. No se pudieron guardar las imágenes; puedes subirlas después desde Editar perfil.'
                : 'Account created. Images were not saved; you can upload them later from Edit profile.')
              : (state.lang === 'es' ? '¡Bienvenida/o a ORIGEN Cultural!' : 'Welcome to ORIGEN Cultural!'));
            updateShell(); go('feed');
          }
        } else {
          resetTurnstile('signup');
          if (errEl) { errEl.textContent = result.error; errEl.style.display = 'block'; }
          nextBtn.disabled = false;
          nextBtn.textContent = state.lang === 'es' ? 'Crear mi perfil' : 'Create my profile';
        }
      }
    });
  }

  // Update only the preview, never the active editor. Replacing the form
  // on each keystroke used to blur text fields and interrupt cultural stories.
  function updateCreatePostPreview() {
    const preview = document.getElementById('create-live-preview');
    const user = me();
    if (!preview || !user || !['creator','explorer'].includes(user.accountType)) return;
    const d = state.createData;
    const hasMedia = (d.media || []).length > 0;
    preview.innerHTML = d.title || hasMedia
      ? postCard({
          id: '_prev', authorId: user.id, type: d.type,
          media: d.media || [], title: d.title || 'Título',
          description: d.description || '', category: d.category || '',
          contentPurpose: d.contentPurpose || 'education',
          territory: d.territory || '', tags: d.tags || [],
          timestamp: new Date().toISOString(), likes: 0
        })
      : '<div class="create-preview-empty"><p>La vista previa aparecerá aquí.</p></div>';
  }

  /* Create post */
  function bindCreatePost() {
    const currentUser = me();
    if (!currentUser || !['creator','explorer'].includes(currentUser.accountType)) return;
    /* type buttons */
    document.querySelectorAll('[data-ctype]').forEach(btn => {
      btn.addEventListener('click', () => {
        for (const url of state.createData.media || []) releasePreview(url);
        state.createData.type = btn.dataset.ctype;
        state.createData.rightsAcknowledged = false;
        state.createData.culturalAcknowledged = false;
        state.createData.audioRightsAcknowledged = false;
        state.createData.audioRightsSource = '';
        state.createData.audioAttribution = '';
        state.createData.videoDurationSeconds = null;
        state.createData.media = [];
        state.createData.files = [];
        render('crear', false);
      });
    });

    /* media upload zone click */
    const mediaZone  = document.getElementById('post-media-zone');
    const mediaInput = document.getElementById('post-media-input');
    if (mediaZone && mediaInput) {
      mediaZone.addEventListener('click', e => {
        if (e.target.closest('video, video *, [data-rmidx], #add-more-media')) return;
        mediaInput.click();
      });
      mediaInput.addEventListener('change', async e => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        state.createData.rightsAcknowledged = false;
        state.createData.culturalAcknowledged = false;
        state.createData.audioRightsAcknowledged = false;
        state.createData.audioRightsSource = '';
        state.createData.audioAttribution = '';
        state.createData.videoDurationSeconds = null;
        if (state.createData.type === 'video') {
          for (const url of state.createData.media || []) releasePreview(url);
          state.createData.files = [files[0]];
          state.createData.media = [URL.createObjectURL(files[0])];
        } else if (state.createData.type === 'carousel') {
          state.createData.files = [...(state.createData.files || []), ...files];
          state.createData.media = [...(state.createData.media || []), ...files.map(file => URL.createObjectURL(file))];
        } else {
          for (const url of state.createData.media || []) releasePreview(url);
          state.createData.files = [files[0]];
          state.createData.media = [URL.createObjectURL(files[0])];
        }
        render('crear', false);
      });
    }

    // The browser checks metadata for an early user-facing limit. A trusted
    // publication service must independently inspect the media before publish.
    const videoPreview = mediaZone?.querySelector('video');
    const durationStatus = document.getElementById('post-video-duration-status');
    if (videoPreview && durationStatus) {
      const checkVideoDuration = () => {
        const seconds = Number(videoPreview.duration);
        if (Number.isFinite(seconds) && seconds > 0) {
          state.createData.videoDurationSeconds = seconds;
          durationStatus.textContent = seconds <= 90
            ? (state.lang === 'es' ? `Duración: ${Math.round(seconds)} s (máximo 90 s).` : `Duration: ${Math.round(seconds)} s (90 s maximum).`)
            : (state.lang === 'es' ? `El video dura ${Math.round(seconds)} s. El máximo es 90 s.` : `This video is ${Math.round(seconds)} s long. The maximum is 90 s.`);
          durationStatus.setAttribute('data-duration-valid', String(seconds <= 90));
        } else {
          state.createData.videoDurationSeconds = null;
          durationStatus.textContent = state.lang === 'es'
            ? 'No pudimos verificar la duración. Selecciona un video compatible de máximo 90 segundos.'
            : 'We could not verify the duration. Select a supported video no longer than 90 seconds.';
          durationStatus.setAttribute('data-duration-valid', 'false');
        }
      };
      videoPreview.addEventListener('loadedmetadata', checkVideoDuration);
      if (videoPreview.readyState >= 1) checkVideoDuration();
    }

    /* add more media (carousel) */
    const addMore = document.getElementById('add-more-media');
    if (addMore) addMore.addEventListener('click', e => { e.stopPropagation(); mediaInput && mediaInput.click(); });

    /* remove media thumbnail */
    document.querySelectorAll('[data-rmidx]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.rmidx, 10);
        const [preview] = state.createData.media.splice(idx, 1);
        state.createData.videoDurationSeconds = null;
        state.createData.rightsAcknowledged = false;
        state.createData.culturalAcknowledged = false;
        state.createData.audioRightsAcknowledged = false;
        state.createData.audioRightsSource = '';
        state.createData.audioAttribution = '';
        releasePreview(preview);
        if (state.createData.files) state.createData.files.splice(idx, 1);
        render('crear', false);
      });
    });

    /* form inputs → update preview */
    const form = document.getElementById('create-form');
    if (!form) return;
    const resetPostAttestations = () => {
      state.createData.rightsAcknowledged = false;
      state.createData.culturalAcknowledged = false;
      state.createData.audioRightsAcknowledged = false;
      form.querySelectorAll('[data-post-attestation]').forEach(input => { input.checked = false; });
    };
    form.querySelectorAll('[data-post-attestation]').forEach(input => {
      input.addEventListener('change', () => {
        state.createData[input.name] = input.checked === true;
        const error = document.getElementById('post-safety-error');
        if (error) { error.textContent = ''; error.hidden = true; }
      });
    });
    const audioSourceInput = form.querySelector('[name="audioRightsSource"]');
    const audioAttributionInput = form.querySelector('[name="audioAttribution"]');
    const updateAudioAttributionRequirement = () => {
      if (audioAttributionInput) audioAttributionInput.required = ['licensed','community_permission'].includes(audioSourceInput?.value || '');
    };
    audioSourceInput?.addEventListener('change', () => {
      resetPostAttestations();
      state.createData.audioRightsSource = audioSourceInput.value;
      updateAudioAttributionRequirement();
    });
    audioAttributionInput?.addEventListener('input', () => {
      resetPostAttestations();
      state.createData.audioAttribution = audioAttributionInput.value;
    });
    updateAudioAttributionRequirement();
    ['title','description','category','contentPurpose','territory','tags'].forEach(field => {
      const el = form.querySelector(`[name="${field}"]`);
      if (el) el.addEventListener('input', () => {
        // Any content change requires a fresh, explicit permissions check.
        resetPostAttestations();
        state.createData[field] = field === 'tags'
          ? el.value.split(',').map(s => s.trim()).filter(Boolean)
          : el.value;
        // Keep focus/caret and in-progress edits intact, even after a pause.
        clearTimeout(bindCreatePost._prev);
        bindCreatePost._prev = setTimeout(updateCreatePostPreview, 120);
      });
    });

    /* submit */
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const user = me(); if (!user) return;
      // Programmatic form submission and stale DOM must fail closed too.
      // This UX switch cannot authorize real Storage or DB writes.
      const publishingReady = user.accountType === 'explorer'
        ? window.ORIGEN_API?.explorerPublishingReady === true
        : window.ORIGEN_API?.culturalPublishingReady === true;
      if (!publishingReady) {
        const message = state.lang === 'es'
          ? 'La publicación aún no está disponible. Tu vista previa permanece solo en este dispositivo; ningún contenido se ha enviado a ORIGEN.'
          : 'Publishing is not available yet. Your preview remains only on this device; no content has been sent to ORIGEN.';
        const error = document.getElementById('post-safety-error');
        if (error) { error.hidden = false; error.textContent = message; }
        showToast(message);
        return;
      }
      const fd = Object.fromEntries(new FormData(form));
      const isVideoPost = state.createData.type === 'video';
      const audioSource = String(fd.audioRightsSource || '');
      const audioNeedsCredit = ['licensed','community_permission'].includes(audioSource);
      const missingAudioCredit = audioNeedsCredit && !String(fd.audioAttribution || '').trim();
      if (fd.rightsAcknowledged !== 'on' || fd.culturalAcknowledged !== 'on' || (isVideoPost && fd.audioRightsAcknowledged !== 'on')) {
        const error = document.getElementById('post-safety-error');
        if (error) {
          error.hidden = false;
          error.textContent = state.lang === 'es'
            ? 'Antes de publicar, confirma tus permisos de contenido y tu responsabilidad cultural.'
            : 'Before publishing, confirm your content permissions and cultural responsibilities.';
        }
        const missing = form.querySelector('[name="rightsAcknowledged"]:not(:checked), [name="culturalAcknowledged"]:not(:checked)');
        const missingAudio = isVideoPost ? form.querySelector('[name="audioRightsAcknowledged"]:not(:checked)') : null;
        if (missing) missing.focus();
        else if (missingAudio) missingAudio.focus();
        return; // Must run before uploads or any database write.
      }
      if (isVideoPost && (!['no_music','original','licensed','community_permission'].includes(audioSource) || missingAudioCredit)) {
        const error = document.getElementById('post-safety-error');
        if (error) {
          error.hidden = false;
          error.textContent = state.lang === 'es'
            ? 'Selecciona el origen del audio y añade el crédito autorizado para la música de terceros antes de subir el video.'
            : 'Choose the audio source and add the authorised credit for third-party music before uploading the video.';
        }
        const field = !audioSource ? form.querySelector('[name="audioRightsSource"]') : form.querySelector('[name="audioAttribution"]');
        if (field) field.focus();
        return; // Validate rights metadata before uploading files.
      }
      if (user.accountType === 'creator' && state.createData.type === 'text') {
        showToast('El feed de Agentes Culturales requiere foto, carrusel o video.'); return;
      }
      if (!fd.contentPurpose) {
        showToast('Selecciona el propósito cultural de la publicación.'); return;
      }
      if (state.createData.type !== 'text' && (!state.createData.files || !state.createData.files.length)) {
        showToast('Por favor sube al menos una imagen o video.'); return;
      }
      if (isVideoPost && (!Number.isFinite(state.createData.videoDurationSeconds) || state.createData.videoDurationSeconds <= 0 || state.createData.videoDurationSeconds > 90)) {
        const message = state.lang === 'es'
          ? 'El video debe tener una duración verificable de máximo 90 segundos.'
          : 'The video must have a verifiable duration of 90 seconds or less.';
        const status = document.getElementById('post-video-duration-status');
        if (status) status.textContent = message;
        showToast(message);
        return; // Duration must be known before any upload begins.
      }
      const submit = form.querySelector('button[type="submit"]');
      if (submit) { submit.disabled = true; submit.textContent = 'Publicando…'; }
      const uploaded = [];
      // A failed upload before any DB request is safe to clean up. Once a
      // cultural post INSERT is attempted, an interrupted network response
      // cannot prove that the server did not commit the post. Preserve media
      // rather than risk deleting files attached to a successfully saved story.
      let postInsertAttempted = false;
      const filesToUpload = [...(state.createData.files || [])];
      try {
        for (let i = 0; i < filesToUpload.length; i++) {
          if (me()?.id !== user.id) throw new Error('La sesión cambió durante la subida.');
          uploaded.push(await window.ORIGEN_API.upload('post-media', filesToUpload[i], `post-${i+1}`));
        }
        if (me()?.id !== user.id) throw new Error('La sesión cambió; publicación cancelada antes de enviarse.');
        postInsertAttempted = true;
        await window.ORIGEN_API.createPost({
          type: state.createData.type,
          media: uploaded,
          title: fd.title,
          description: fd.description,
          category: fd.category,
          contentPurpose: fd.contentPurpose,
          territory: fd.territory,
          rightsAcknowledged: true,
          culturalAcknowledged: true,
          audioRightsAcknowledged: isVideoPost,
          audioRightsSource: isVideoPost ? audioSource : null,
          audioAttribution: isVideoPost ? String(fd.audioAttribution || '').trim() || null : null,
          tags: fd.tags ? fd.tags.split(',').map(s => s.trim()).filter(Boolean) : []
        }, user.id);
        if (me()?.id !== user.id) return; // Do not mutate another account's draft or UI.
        for (const url of state.createData.media || []) releasePreview(url);
        state.createData = { type: 'photo', media: [], files: [], tags: [], contentPurpose: 'education', videoDurationSeconds: null };
        showToast('¡Publicación creada!');
        go('feed');
      } catch (error) {
        if (!postInsertAttempted) {
          // The database write has NOT started; newly uploaded files are
          // unattached. Wait for cleanup before telling the user its status.
          if (uploaded.length) {
            const results = await Promise.allSettled(
              uploaded.map(url => window.ORIGEN_API.removeOwnMedia(url))
            );
            if (results.some(result => result.status !== 'fulfilled' || result.value !== true)) {
              console.warn('ORIGEN post upload cleanup incomplete before post insert.');
            }
          }
          showToast(error.message || 'No pudimos crear la publicación.');
          if (submit) { submit.disabled = false; submit.textContent = 'Publicar →'; }
        } else {
          // A database error or lost response does not always prove that an
          // INSERT was not committed. Never delete uploaded cultural media.
          // Stop an automatic retry, which could create a duplicate story.
          const warning = state.lang === 'es'
            ? 'No pudimos confirmar si tu publicación se guardó. No hemos borrado las fotos o videos. Revisa tu feed antes de volver a intentarlo.'
            : 'We could not confirm whether your post was saved. We have not deleted your photos or videos. Check your feed before trying again.';
          const inline = document.getElementById('post-safety-error');
          if (inline) { inline.hidden = false; inline.textContent = warning; }
          console.warn('ORIGEN post insert outcome uncertain; uploaded media preserved for review.');
          showToast(warning);
          if (submit) {
            submit.disabled = true;
            submit.textContent = state.lang === 'es' ? 'Revisa tu feed' : 'Check your feed';
          }
        }
      }
    });
  }

  /* Edit profile */
  function bindEditProfile() {
    bindLocationSelects(document.getElementById('edit-form'));
    /* category chips */
    const userCats = { list: me() ? (me().categories || []) : [] };
    document.querySelectorAll('[data-cat]').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        const cat = chip.dataset.cat;
        const idx = userCats.list.indexOf(cat);
        if (idx === -1) userCats.list.push(cat); else userCats.list.splice(idx, 1);
      });
    });

    /* avatar / cover upload: listen on persistent zones so rebuilt file inputs keep working */
    const avaZone = document.getElementById('edit-avatar-zone');
    if (avaZone) avaZone.addEventListener('change', e => {
      if (!(e.target instanceof HTMLInputElement) || e.target.id !== 'edit-avatar-input') return;
      const file = e.target.files?.[0]; if (!file) return;
      releasePreview(state.editAvatarPreview);
      state.editAvatar = file;
      const preview = URL.createObjectURL(file);
      state.editAvatarPreview = preview;
      avaZone.innerHTML = `<img src="${esc(safeMediaUrl(preview))}" class="edit-avatar-preview" alt="Avatar"><input type="file" id="edit-avatar-input" accept="image/jpeg,image/png,image/webp" style="display:none"><button class="btn" type="button" data-file-trigger="edit-avatar-input">Cambiar foto</button>`;
    });

    const covZone = document.getElementById('edit-cover-zone');
    if (covZone) covZone.addEventListener('change', e => {
      if (!(e.target instanceof HTMLInputElement) || e.target.id !== 'edit-cover-input') return;
      const file = e.target.files?.[0]; if (!file) return;
      releasePreview(state.editCoverPreview);
      state.editCover = file;
      const preview = URL.createObjectURL(file);
      state.editCoverPreview = preview;
      covZone.innerHTML = `<img src="${esc(safeMediaUrl(preview))}" class="edit-cover-preview" alt="Portada"><input type="file" id="edit-cover-input" accept="image/jpeg,image/png,image/webp" style="display:none"><button class="btn secondary" type="button" data-file-trigger="edit-cover-input">Cambiar portada</button>`;
    });

    /* form submit */
    const form = document.getElementById('edit-form');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const user = me(); if (!user) return;
      const fd   = Object.fromEntries(new FormData(form));
      const links = {};
      ['instagram','facebook','tiktok','youtube','linkedin','whatsapp','email','web'].forEach(k => { if (fd[k]) links[k] = fd[k]; });
      const newAvatarFile = state.editAvatar instanceof File ? state.editAvatar : null;
      const newCoverFile = state.editCover instanceof File ? state.editCover : null;
      const uploaded = [];
      try {
        let avatar = user.avatar;
        let cover = user.cover;
        if (newAvatarFile) {
          if (me()?.id !== user.id) throw new Error('La sesión cambió durante la edición.');
          avatar = await window.ORIGEN_API.upload('avatars', newAvatarFile, 'avatar');
          uploaded.push(avatar);
        }
        if (newCoverFile) {
          if (me()?.id !== user.id) throw new Error('La sesión cambió durante la edición.');
          cover = await window.ORIGEN_API.upload('covers', newCoverFile, 'cover');
          uploaded.push(cover);
        }
        if (me()?.id !== user.id) throw new Error('La sesión cambió; no se guardaron los cambios del perfil.');
        const previousAvatar = user.avatar;
        const previousCover = user.cover;
        const updated = await window.ORIGEN_API.updateMyProfile({
          name: fd.name || user.name,
          ...selectedLocation(form),
          culturalIdentity: fd.culturalIdentity || '',
          story: fd.story,
          categories: userCats.list,
          links,
          accountType: user.accountType,
          providerHeadline: fd.providerHeadline || '',
          services: fd.services ? fd.services.split(',').map(s => s.trim()).filter(Boolean) : [],
          serviceDescription: fd.serviceDescription || '',
          avatar,
          cover
        }, user.id);
        if (me()?.id !== user.id) return; // Save may have succeeded for the prior user.
        state.user = updated;

        const cleanup = [];
        if (newAvatarFile && previousAvatar && previousAvatar !== avatar) {
          cleanup.push(window.ORIGEN_API.removeOwnMedia(previousAvatar));
        }
        if (newCoverFile && previousCover && previousCover !== cover) {
          cleanup.push(window.ORIGEN_API.removeOwnMedia(previousCover));
        }
        if (cleanup.length) {
          Promise.allSettled(cleanup).then(results => {
            if (results.some(result => result.status !== 'fulfilled' || result.value !== true)) {
              console.warn('ORIGEN media cleanup incomplete; new profile media remains saved.');
            }
          });
        }

        releasePreview(state.editAvatarPreview);
        releasePreview(state.editCoverPreview);
        state.editAvatar = null; state.editCover = null;
        state.editAvatarPreview = null; state.editCoverPreview = null;
        showToast('¡Perfil actualizado!');
        go('mi-perfil');
      } catch (error) {
        // If one upload succeeded but the second upload/save failed, prevent
        // storage from accumulating unreferenced profile photos/cover images.
        if (uploaded.length) {
          const results = await Promise.allSettled(uploaded.map(url => window.ORIGEN_API.removeOwnMedia(url)));
          if (results.some(item => item.status !== 'fulfilled' || item.value !== true)) {
            console.warn('[ORIGEN] Unreferenced profile media cleanup incomplete.');
          }
        }
        if (me()?.id === user.id) showToast(error.message || 'No pudimos actualizar tu perfil.');
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     GLOBAL SHELL EVENTS (search, drawer, language)
  ═══════════════════════════════════════════════════════════ */
  const drawer   = document.getElementById('mobile-drawer');
  const overlay  = document.getElementById('drawer-overlay');
  const menuBtn  = document.getElementById('menu-button');
  const closeBtn = document.getElementById('close-menu');

  let drawerPreviousFocus = null;
  const drawerFocusable = () => [...drawer.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter(el => !el.hasAttribute('inert'));

  function openDrawer() {
    drawerPreviousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : menuBtn;
    drawer.classList.add('open');
    overlay.classList.add('open');
    drawer.removeAttribute('inert');
    drawer.setAttribute('aria-hidden','false');
    menuBtn.setAttribute('aria-expanded','true');
    requestAnimationFrame(() => (closeBtn || drawerFocusable()[0])?.focus());
  }

  function closeDrawer(restoreFocus = true) {
    const wasOpen = drawer.classList.contains('open');
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    drawer.setAttribute('aria-hidden','true');
    drawer.setAttribute('inert','');
    menuBtn.setAttribute('aria-expanded','false');
    if (restoreFocus && wasOpen) (drawerPreviousFocus || menuBtn)?.focus();
  }

  menuBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', () => closeDrawer(true));
  if (overlay) overlay.addEventListener('click', () => closeDrawer(true));

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drawer.classList.contains('open')) {
      event.preventDefault();
      closeDrawer(true);
    }
  });

  drawer.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = drawerFocusable();
    if (!focusable.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.getElementById('language-toggle').addEventListener('click', () => {
    state.lang = state.lang === 'es' ? 'en' : 'es';
    localStorage.setItem('origen-lang', state.lang);
    document.getElementById('language-toggle').textContent = state.lang === 'es' ? 'EN' : 'ES';
    document.documentElement.lang = state.lang;
    render(currentRoute(), false);
    showToast(state.lang === 'es' ? 'Idioma cambiado a español' : 'Language changed to English');
  });

  function initDigitalWellbeing() {
    const dialog = document.getElementById('wellbeing-dialog');
    if (!dialog) return;

    // Migrate the earlier 30-minute experimental default to the new 120-minute daily target.
    const stored = Number(localStorage.getItem('origen-wellbeing-minutes'));
    if (!stored || stored === 30) {
      state.wellbeingMinutes = 120;
      localStorage.setItem('origen-wellbeing-minutes', '120');
    }

    const pauseAllVideos = () => document.querySelectorAll('video').forEach(v => v.pause());
    const todayKey = () => new Date().toISOString().slice(0, 10);

    const readDaily = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('origen-wellbeing-daily') || '{}');
        if (saved.date !== todayKey()) return { date: todayKey(), activeMs: 0, nextPromptMs: state.wellbeingMinutes * 60 * 1000 };
        return {
          date: saved.date,
          activeMs: Math.max(0, Number(saved.activeMs) || 0),
          nextPromptMs: Math.max(Number(saved.nextPromptMs) || 0, state.wellbeingMinutes * 60 * 1000)
        };
      } catch {
        return { date: todayKey(), activeMs: 0, nextPromptMs: state.wellbeingMinutes * 60 * 1000 };
      }
    };

    const writeDaily = daily => {
      localStorage.setItem('origen-wellbeing-daily', JSON.stringify(daily));
    };

    let daily = readDaily();
    state.wellbeingNextPromptMs = daily.nextPromptMs;
    state.wellbeingLastTick = Date.now();

    dialog.querySelector('[data-wellbeing="break"]')?.addEventListener('click', () => {
      pauseAllVideos();
      dialog.close();
      daily.nextPromptMs = daily.activeMs + 30 * 60 * 1000;
      state.wellbeingNextPromptMs = daily.nextPromptMs;
      writeDaily(daily);
      showToast('Contenido en pausa. Vuelve cuando quieras.');
    });

    dialog.querySelector('[data-wellbeing="snooze"]')?.addEventListener('click', () => {
      dialog.close();
      daily.nextPromptMs = daily.activeMs + 15 * 60 * 1000;
      state.wellbeingNextPromptMs = daily.nextPromptMs;
      writeDaily(daily);
    });

    dialog.querySelector('[data-wellbeing="off"]')?.addEventListener('click', () => {
      state.wellbeingMinutes = 0;
      localStorage.setItem('origen-wellbeing-minutes', '0');
      dialog.close();
      showToast('Recordatorios de bienestar desactivados.');
    });

    setInterval(() => {
      const now = Date.now();

      if (daily.date !== todayKey()) {
        daily = { date: todayKey(), activeMs: 0, nextPromptMs: state.wellbeingMinutes * 60 * 1000 };
      }

      if (document.visibilityState === 'visible' && state.wellbeingMinutes > 0) {
        daily.activeMs += Math.max(0, Math.min(now - state.wellbeingLastTick, 60000));
        if (!dialog.open && daily.activeMs >= daily.nextPromptMs) {
          pauseAllVideos();
          dialog.showModal();
        }
        writeDaily(daily);
      }

      state.wellbeingLastTick = now;
    }, 30000);
  }

  function initDeletePostDialog() {
    if (!$deletePost) return;
    const close = () => {
      if ($deletePost.open) $deletePost.close();
      $deletePost.dataset.postId = '';
      const status = document.getElementById('delete-post-status');
      if (status) status.textContent = '';
    };

    document.getElementById('delete-post-close')?.addEventListener('click', close);
    document.getElementById('delete-post-cancel')?.addEventListener('click', close);
    document.getElementById('delete-post-confirm')?.addEventListener('click', async () => {
      const postId = $deletePost.dataset.postId || '';
      const status = document.getElementById('delete-post-status');
      const confirmBtn = document.getElementById('delete-post-confirm');
      if (!postId) return;
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = state.lang === 'es' ? 'Eliminando…' : 'Deleting…';
      }
      const initiatingUserId = me()?.id || null;
      try {
        const deletion = await window.ORIGEN_API.deletePost(postId);
        // Never show account A's deletion result in account B's interface.
        if (!initiatingUserId || me()?.id !== initiatingUserId) return;
        close();
        if (deletion?.mediaCleanup === 'incomplete') {
          showToast(state.lang === 'es'
            ? 'Publicación retirada. No se pudo confirmar la eliminación de todos sus archivos públicos; contacta a info.origencultural@gmail.com.'
            : 'Post removed. Some public media may still be accessible; contact info.origencultural@gmail.com.', 11000);
        } else {
          showToast(state.lang === 'es' ? 'Publicación eliminada.' : 'Post deleted.');
        }
        render(currentRoute(), false);
      } catch (error) {
        if (status) status.textContent = error?.message || (state.lang === 'es'
          ? 'No pudimos eliminar la publicación.'
          : 'We could not delete the post.');
      } finally {
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.textContent = state.lang === 'es' ? 'Eliminar publicación' : 'Delete post';
        }
      }
    });
  }

  function initReportDialog() {
    if (!$report) return;
    const form = document.getElementById('report-form');
    const close = () => {
      if ($report.open) $report.close();
      const status = document.getElementById('report-status');
      if (status) status.textContent = '';
    };

    document.getElementById('report-close')?.addEventListener('click', close);
    document.getElementById('report-cancel')?.addEventListener('click', close);

    form?.addEventListener('submit', async event => {
      event.preventDefault();
      const reason = document.getElementById('report-reason')?.value || '';
      const details = document.getElementById('report-details')?.value || '';
      const status = document.getElementById('report-status');
      const submit = document.getElementById('report-submit');
      if (!reason) {
        if (status) status.textContent = state.lang === 'es' ? 'Selecciona un motivo.' : 'Select a reason.';
        return;
      }
      const submittingUserId = me()?.id;
      if (!submittingUserId) {
        if (status) status.textContent = state.lang === 'es'
          ? 'Inicia sesión nuevamente antes de enviar el reporte.'
          : 'Sign in again before submitting the report.';
        return;
      }

      if (submit) {
        submit.disabled = true;
        submit.textContent = state.lang === 'es' ? 'Enviando…' : 'Submitting…';
      }
      try {
        await window.ORIGEN_API.report({
          target_type: $report.dataset.targetType || 'post',
          target_id: $report.dataset.targetId || '',
          reason,
          details: details.trim().slice(0, 6000)
        }, submittingUserId);
        if (me()?.id !== submittingUserId) return;
        close();
        showToast(state.lang === 'es'
          ? 'Reporte recibido. Gracias por ayudarnos a cuidar ORIGEN.'
          : 'Report received. Thank you for helping keep ORIGEN safe.');
      } catch (error) {
        if (me()?.id !== submittingUserId) return;
        if (status) status.textContent = error?.message || (state.lang === 'es'
          ? 'No pudimos enviar el reporte.'
          : 'We could not submit the report.');
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.textContent = state.lang === 'es' ? 'Enviar reporte' : 'Submit report';
        }
      }
    });
  }

  function bindCspSafeDelegates() {
    document.addEventListener('click', event => {
      const target = event.target;
      const fileTrigger = target?.closest?.('[data-file-trigger]');
      if (fileTrigger) {
        const input = document.getElementById(fileTrigger.dataset.fileTrigger);
        if (input instanceof HTMLInputElement && input.type === 'file') input.click();
      }

      const searchResult = target?.closest?.('[data-close-search]');
      if (searchResult) {
        if ($search?.open) $search.close();
        if (searchResult.hasAttribute('data-clear-comments')) state.openComments.clear();
      }
    });

    document.addEventListener('error', event => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement) || !img.dataset.avatarFallback) return;
      const parent = img.parentElement;
      if (!parent) return;
      parent.classList.add('ava-init');
      try {
        parent.textContent = decodeURIComponent(img.dataset.avatarFallback);
      } catch {
        parent.textContent = 'OC';
      }
    }, true);
  }

  /* Global search */
  const globalSearch = document.getElementById('global-search');
  if (globalSearch) {
    globalSearch.addEventListener('input', e => populateSearch(e.target.value));
    document.getElementById('search-button').addEventListener('click', () => {
      $search.showModal();
      setTimeout(() => globalSearch.focus(), 40);
      populateSearch('');
    });
  }
  function populateSearch(query) {
    const q = query.toLowerCase().trim();
    const results = directoryProfiles().filter(c => !q || [c.name, c.category, c.location, c.short, ...(c.tags || [])].join(' ').toLowerCase().includes(q));
    const resPosts = allPosts().filter(p => q && [p.title, p.description, ...(p.tags || [])].join(' ').toLowerCase().includes(q)).slice(0, 4);
    const $res = document.getElementById('search-results');
    if (!$res) return;
    $res.innerHTML = [
      ...results.map(c => { const href = c._kind === 'user' ? `#usuario/${c.id}` : `#perfil/${c.id}`; return `<a class="search-result" href="${esc(href)}" data-close-search><div class="ava ava-sm"><img src="${esc(safeMediaUrl(c.image || c.avatar) || 'assets/logo-mark.svg')}" alt=""></div><div><h4>${esc(c.name)} ${verBadge(c)}</h4><p>${esc(c.category)} · ${esc(c.location)}</p>${profileTrustChip(c)}</div><span class="link-arrow">Ver</span></a>`; }),
      ...resPosts.map(p => { const a = getProfile(p.authorId); return `<a class="search-result" href="#feed" data-close-search data-clear-comments><div class="ava ava-sm ava-init">${p.type === 'text' ? 'T' : '◫'}</div><div><h4>${esc(p.title)}</h4><p>${a ? esc(a.name) : ''} · ${timeAgo(p.timestamp)}</p></div><span class="link-arrow">Ver</span></a>`; })
    ].join('') || `<div class="empty-state">${t('noResults')}</div>`;
  }

  /* ═══════════════════════════════════════════════════════════
     HASH CHANGE → RENDER
  ═══════════════════════════════════════════════════════════ */
  window.addEventListener('hashchange', () => {
    closeDrawer(false);
    render(currentRoute());
  });

  /* ═══════════════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════════════ */
  // navigator.onLine only reflects the browser's connectivity indicator;
  // it does not claim that ORIGEN's server is reachable. No polling/tracking.
  function updateConnectionStatus() {
    const notice = document.getElementById('connection-status');
    if (notice) notice.hidden = navigator.onLine !== false;
  }
  window.addEventListener('offline', updateConnectionStatus);
  window.addEventListener('online', updateConnectionStatus);
  updateConnectionStatus();

  document.documentElement.lang = state.lang;

  // Ignore delayed callbacks from an earlier Auth event or initial load.
  // In particular an old profile response must not restore account A after
  // account B has signed in or another tab has signed out.
  let authUiGeneration = 0;

  async function initApp() {
    const generation = ++authUiGeneration;
    try {
      const restored = await window.ORIGEN_API?.restoreSession() || null;
      if (generation !== authUiGeneration) return;
      state.user = restored;

      const tasks = [
        window.ORIGEN_API?.listCulturalProfiles(),
        window.ORIGEN_API?.listPublicProfiles(),
        window.ORIGEN_API?.listPosts()
      ];
      if (state.user) {
        tasks.push(
          window.ORIGEN_API?.ensureCreatorCulturalProfile(),
          window.ORIGEN_API?.myFollows(),
          window.ORIGEN_API?.myFavorites(),
          window.ORIGEN_API?.loadPostInteractions()
        );
      }
      await Promise.allSettled(tasks);
      if (generation !== authUiGeneration) return;
    } catch (error) {
      if (generation !== authUiGeneration) return;
      console.error('[ORIGEN] Startup error:', error);
      state.user = null;
    } finally {
      if (generation === authUiGeneration) {
        state.authReady = true;
        render(currentRoute());
      }
    }
  }

  window.addEventListener('origen-auth-change', async () => {
    const generation = ++authUiGeneration;
    try {
      const previousUid = state.user?.id || null;
      const previousRole = state.user?.role || null;
      const refreshedUser = await window.ORIGEN_API?.restoreSession() || null;
      if (generation !== authUiGeneration) return;

      const nextUid = refreshedUser?.id || null;
      const nextRole = refreshedUser?.role || null;
      const roleChanged = !!previousUid && previousUid === nextUid && previousRole !== nextRole;
      if (previousUid && (previousUid !== nextUid || roleChanged)) clearAccountDrafts();
      state.user = refreshedUser;
      if (roleChanged) {
        // A reviewer can lose admin rights without switching account IDs.
        // Immediately destroy the already-rendered private moderation inbox
        // before any slower network cache refresh; updating navigation alone
        // would leave confidential report text visible in the DOM.
        render(currentRoute(), false);
      }
      if (state.user) {
        await Promise.allSettled([
          window.ORIGEN_API?.ensureCreatorCulturalProfile(),
          window.ORIGEN_API?.listCulturalProfiles(),
          window.ORIGEN_API?.listPublicProfiles(),
          window.ORIGEN_API?.myFollows(),
          window.ORIGEN_API?.myFavorites(),
          window.ORIGEN_API?.listPosts(),
          window.ORIGEN_API?.loadPostInteractions()
        ]);
      }
      if (generation !== authUiGeneration) return;

      if (!state.authReady) {
        // INITIAL_SESSION may arrive while initApp is still loading.
        state.authReady = true;
        render(currentRoute(), false);
        return;
      }

      // Sign-out in a different tab must remove privileged UI content too,
      // not only the navigation links. Switching accounts must re-render it.
      if (previousUid && previousUid !== nextUid) {
        if (!nextUid) go('inicio');
        else render(currentRoute(), false);
        return;
      }
      updateShell();
    } catch (error) {
      if (generation !== authUiGeneration) return;
      console.error('[ORIGEN] Auth refresh error:', error);
    }
  });

  initDeletePostDialog();
  initReportDialog();
  bindCspSafeDelegates();
  initDigitalWellbeing();
  initApp();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      // Staging is access-controlled: offline app-shell caches must not
      // preserve a private preview after the browser leaves Cloudflare Access.
      // Release builds set this flag explicitly; local/public source retains
      // normal PWA registration when the flag is absent.
      if (window.ORIGEN_CONFIG?.disableServiceWorker === true) {
        navigator.serviceWorker.getRegistrations().then(registrations =>
          Promise.all(registrations.map(registration => registration.unregister()))
        ).catch(() => console.warn('[ORIGEN] Could not clear staging service workers.'));
        if (window.caches) {
          window.caches.keys().then(keys => Promise.all(
            keys.filter(key => key.startsWith('origen-cultural-v'))
              .map(key => window.caches.delete(key))
          )).catch(() => console.warn('[ORIGEN] Could not clear staging offline caches.'));
        }
        return;
      }
      navigator.serviceWorker.register('service-worker.js').catch(error => {
        console.warn('[ORIGEN] Service worker registration failed:', error);
      });
    });
  }

})();
