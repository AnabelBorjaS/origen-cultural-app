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
    createData: { type: 'photo', media: [], files: [], tags: [], contentPurpose: 'education' },
    openComments: new Set(),
    carIdx: {},
    editAvatar: null,
    editCover: null,
    editAvatarPreview: null,
    editCoverPreview: null,
    user: null,
    authReady: false,
    feedLoading: false,
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
            if (cleanup.some(item => item.status === 'rejected')) {
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
      location: row.location || [row.city, row.country].filter(Boolean).join(', '),
      country: row.country || '',
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
      education: 'Educación cultural',
      history: 'Historia y memoria',
      technique: 'Técnica / proceso',
      territory: 'Territorio',
      language: 'Lengua',
      gastronomy: 'Gastronomía',
      arts: 'Artes / expresión',
      heritage: 'Patrimonio',
      community: 'Comunidad'
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
    const cidx     = Math.min(state.carIdx[post.id] || 0, (post.media || []).length - 1 || 0);

    /* media */
    let media = '';
    if ((post.type === 'photo' || post.type === 'carousel') && post.media && post.media.length) {
      const isCarousel = post.type === 'carousel' && post.media.length > 1;
      media = `<div class="post-media${isCarousel ? ' is-carousel' : ''}" data-pid="${post.id}">
        <img src="${esc(safeMediaUrl(post.media[cidx]))}" alt="${esc(post.title)}" loading="lazy">
        ${isCarousel ? `
          <div class="car-dots">${post.media.map((_, i) => `<button class="car-dot${i === cidx ? ' on' : ''}" data-car="${post.id}" data-ci="${i}" aria-label="Imagen ${i + 1}"></button>`).join('')}</div>
          ${cidx > 0 ? `<button class="car-btn car-l" data-car="${post.id}" data-cdir="-1" aria-label="Anterior">‹</button>` : ''}
          ${cidx < post.media.length - 1 ? `<button class="car-btn car-r" data-car="${post.id}" data-cdir="1" aria-label="Siguiente">›</button>` : ''}
          <span class="car-count">${cidx + 1} / ${post.media.length}</span>
        ` : ''}
      </div>`;
    } else if (post.type === 'video' && post.media && post.media.length) {
      media = `<div class="post-media"><video controls muted playsinline preload="metadata" src="${esc(safeMediaUrl(post.media[0]))}" aria-label="${esc(post.title || 'Video cultural')}"></video></div>`;
    }

    const authorHref = author._kind === 'creator' ? `#perfil/${author.id}` : `#usuario/${author.id}`;

    return `<article class="post-card${post.type === 'text' ? ' post-text' : ''}" data-pid="${post.id}">
      <div class="post-head">
        <a class="post-author-link" href="${authorHref}">
          ${avatarEl(author, 'sm')}
          <div class="post-author-info">
            <strong>${esc(author.name)} ${verBadge(author)}</strong>
            <span>${esc(author.type || author.accountType || 'Origen Cultural')}${post.territory ? ' · ' + esc(post.territory) : ''} · ${timeAgo(post.timestamp)}</span>
          </div>
        </a>
        <div class="post-head-r">
          ${user && !isOwn && !following ? `<button class="btn-follow-sm" data-fuser="${post.authorId}">+ Seguir</button>` : ''}
          ${user && !isOwn && following  ? `<button class="btn-follow-sm on" data-fuser="${post.authorId}">Siguiendo</button>` : ''}
          <button class="post-more-btn" data-pmore="${post.id}" aria-label="Más opciones">···</button>
        </div>
      </div>
      ${media}
      <div class="post-body${post.type === 'text' ? ' post-text-body' : ''}">
        <div class="post-context-chips">
          ${post.category ? `<span class="post-cat">${esc(post.category)}</span>` : ''}
          ${post.contentPurpose ? `<span class="post-purpose">${esc(contentPurposeLabel(post.contentPurpose))}</span>` : ''}
        </div>
        <h3 class="post-title">${esc(post.title)}</h3>
        <p class="post-desc">${esc(post.description)}</p>
        ${post.tags && post.tags.length ? `<div class="post-tags">${post.tags.map(tg => `<span>#${esc(tg)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="post-actions">
        <button class="pact like-btn${liked ? ' on' : ''}" data-like="${post.id}" ${!user ? 'data-needs-auth' : ''} aria-label="Me gusta">
          ${liked ? '♥' : '♡'}<span>${totalLikes}</span>
        </button>
        <button class="pact com-btn" data-tcoms="${post.id}" aria-label="Comentarios">
          ◎<span>${coms.length}</span>
        </button>
        <button class="pact save-btn${saved ? ' on' : ''}" data-save="${post.id}" ${!user ? 'data-needs-auth' : ''} aria-label="${saved ? 'Guardado' : 'Guardar'}">
          ${saved ? '◆' : '◇'}
        </button>
        <button class="pact share-btn" data-share="${post.id}" aria-label="Compartir">↗</button>
        <button class="pact report-btn" data-report="${post.id}" aria-label="Reportar" style="margin-left:auto">⚑</button>
      </div>
      <div class="post-rights-link"><a href="#solicitar-revision/post/${encodeURIComponent(post.id)}">${state.lang === 'es' ? '¿Uso no autorizado? Solicitar revisión' : 'Unauthorised use? Request a review'}</a></div>
      ${showComs ? commentBlock(post.id, coms) : ''}
    </article>`;
  }

  function commentBlock(postId, coms) {
    const user = me();
    return `<div class="com-section" id="coms-${postId}">
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
        ? `<form class="com-form" data-cf="${postId}">
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
        return `<a class="story-item" href="${href}">
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
    const favs  = remoteFavoriteRefs();
    const saved = favs.includes(c.id);
    const href  = c._kind === 'user' ? `#usuario/${c.id}` : `#perfil/${c.id}`;
    const image = c.image || c.avatar || 'assets/logo-mark.svg';
    return `<article class="creator-card">
      <div class="creator-card-image">
        <a href="${href}" aria-label="${esc(t('profile'))}: ${esc(c.name)}"><img src="${esc(safeMediaUrl(image) || 'assets/logo-mark.svg')}" alt="${esc(c.name)}: ${esc(c.category)}" loading="lazy"></a>
        <button class="favorite-button ${saved ? 'active' : ''}" data-favorite="${c.id}" aria-pressed="${saved}">${saved ? '◆' : '◇'}</button>
      </div>
      <div class="creator-card-body">
        <div class="creator-meta"><span>${esc(c.type)}</span><span>${verBadge(c)} ${esc(c.location)}</span></div>
        <h3><a href="${href}">${esc(c.name)}</a></h3>
        <div class="creator-trust-label">${profileTrustChip(c)}</div>
        <p>${esc(c.short)}</p>
        <div class="creator-tags">${(c.tags || []).map(tg => `<span>${esc(tg)}</span>`).join('')}</div>
        <div class="creator-card-footer"><span>${Intl.NumberFormat('es').format(c.followers || 0)} seguidores</span><a class="link-arrow" href="${href}">${t('profile')}</a></div>
      </div>
    </article>`;
  }

  /* ═══════════════════════════════════════════════════════════
     FOOTER
  ═══════════════════════════════════════════════════════════ */
  function footer() {
    return `<footer class="footer"><div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand"><img src="assets/logo-lockup.svg" alt="Origen Cultural"><p>${t('tagline')}<br><br>Una red social cultural para descubrir, seguir y valorar culturas vivas.</p></div>
        <div><h4>Explorar</h4><div class="footer-links"><a href="#explorar">Perfiles culturales</a><a href="#feed">Feed cultural</a><a href="#pasaporte">Pasaporte Cultural</a></div></div>
        <div><h4>Proyecto</h4><div class="footer-links"><a href="#impacto">Impacto</a><a href="#confianza">Centro de confianza</a><a href="#registro">Unirse</a><a href="mailto:info.origencultural@gmail.com">Contacto</a></div></div>
        <div><h4>Social</h4><div class="footer-links"><a href="https://www.instagram.com/origen.cultural" target="_blank" rel="noreferrer">Instagram</a><a href="#">Facebook</a><a href="#">TikTok</a></div></div>
      </div>
      <div class="footer-bottom"><span>© 2026 Origen Cultural. Todos los derechos reservados.</span><span>Beta controlada · Datos sincronizados con Supabase</span></div>
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
        ${user.accountType === 'creator' ? `<a href="#crear" data-route-link="crear">${es ? 'Crear' : 'Create'}</a>` : ''}
        <a href="#guardados" data-route-link="guardados">${es ? 'Guardados' : 'Saved'}</a>`;
      if (dDrawer) dDrawer.innerHTML = `
        <a href="#feed">Feed</a><a href="#explorar">${es ? 'Explorar' : 'Explore'}</a>
        <a href="#mundo">${es ? 'Mundo Cultural' : 'Cultural World'}</a>
        ${user.accountType === 'creator' ? `<a href="#crear">${es ? 'Crear publicación' : 'Create post'}</a>` : ''}
        <a href="#guardados">${es ? 'Guardados' : 'Saved'}</a><a href="#mi-perfil">${es ? 'Mi perfil' : 'My profile'}</a>`;
      if (dBottom) dBottom.innerHTML = user.accountType === 'creator'
        ? `<a href="#feed" data-route-link="feed"><span aria-hidden="true">⌂</span><small>Feed</small></a>
            <a href="#explorar" data-route-link="explorar"><span aria-hidden="true">⌕</span><small>${es ? 'Explorar' : 'Explore'}</small></a>
            <a class="create-action" href="#crear" data-route-link="crear"><span aria-hidden="true">＋</span><small>${es ? 'Crear' : 'Create'}</small></a>
            <a href="#mundo" data-route-link="mundo"><span aria-hidden="true">🌍</span><small>${es ? 'Mundo' : 'World'}</small></a>
            <a href="#mi-perfil" data-route-link="mi-perfil"><span aria-hidden="true">○</span><small>${es ? 'Perfil' : 'Profile'}</small></a>`
        : `<a href="#feed" data-route-link="feed"><span aria-hidden="true">⌂</span><small>Feed</small></a>
            <a href="#explorar" data-route-link="explorar"><span aria-hidden="true">⌕</span><small>${es ? 'Explorar' : 'Explore'}</small></a>
            <a class="create-action" href="#pasaporte" data-route-link="pasaporte"><span aria-hidden="true">◇</span><small>${es ? 'Pasaporte' : 'Passport'}</small></a>
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
    const featured = directoryProfiles().slice(0, 5);
    return `
    <!-- HERO GLOBE -->
    <section class="hero-globe-section">
      <div class="hero-globe-copy">
        <p class="eyebrow">RED SOCIAL CULTURAL GLOBAL</p>
        <div class="hero-wordmark">
          <span class="hwm-origen">ORIGEN</span>
          <span class="hwm-cultural">CULTURAL</span>
        </div>
        <p class="hero-tagline">Conectando al mundo con sus raíces culturales</p>
        <p class="hero-desc">${t('intro')}</p>
        <div class="hero-globe-actions">
          <a class="btn light hga-primary" href="#mundo">🌍&nbsp; Explorar el mundo cultural</a>
          <a class="btn hga-outline" href="#registro">Compartir mi cultura</a>
        </div>
        <a href="#login" class="hero-login-link">¿Ya tienes cuenta? Entrar →</a>
        <div class="hero-globe-stats">
          <div class="hero-gstat"><strong>6</strong><span>Territorios explorables</span></div>
          <div class="hero-gstat-div"></div>
          <div class="hero-gstat"><strong>4</strong><span>Perfiles de referencia</span></div>
          <div class="hero-gstat-div"></div>
          <div class="hero-gstat"><strong>Beta</strong><span>Controlada</span></div>
        </div>
      </div>
      <div class="hero-globe-right">
        <div class="hero-globe-container" id="hero-globe-container"></div>
        <div class="hero-globe-popup" id="hero-globe-popup" hidden></div>
        <div class="hero-globe-ui">
          <div class="hero-globe-ctrl-bar">
            <button id="hero-globe-pause" class="hero-ctrl-btn" title="Pausar / Reanudar rotación" aria-label="Pausar o reanudar rotación">⏸</button>
            <button id="hero-globe-zoom-in" class="hero-ctrl-btn" title="Acercar" aria-label="Acercar globo">+</button>
            <button id="hero-globe-zoom-out" class="hero-ctrl-btn" title="Alejar" aria-label="Alejar globo">−</button>
          </div>
          <a href="#mundo" class="hero-mundo-link">Mundo Cultural completo →</a>
        </div>
        <p class="hero-globe-hint">Toca un país para explorar su cultura</p>
        <div class="hero-globe-territories">
          ${[['ecuador','🇪🇨','Ecuador'],['australia','🇦🇺','Australia'],['peru','🇵🇪','Perú'],['bolivia','🇧🇴','Bolivia'],['mexico','🇲🇽','México'],['japan','🇯🇵','Japón']]
            .map(([k,f,n]) => `<button class="hgt-pill" data-hgt="${k}" title="Ver ${n}">${f} ${n}</button>`).join('')}
        </div>
      </div>
    </section>

    <!-- MANIFESTO -->
    <section class="section manifesto">
      <div class="section-inner manifesto-grid">
        <p class="eyebrow">DECLARACIÓN FUNDACIONAL</p>
        <div>
          <p class="manifesto-quote">${t('manifest').replace('identidad, memoria, conocimiento y futuro', '<em>identidad, memoria, conocimiento y futuro</em>')}</p>
          <p class="manifesto-copy">Origen Cultural nace para que la cultura se muestre con el valor que merece: con contexto, autonomía, belleza, pertenencia y proyección global.</p>
        </div>
      </div>
    </section>

    <!-- CURADURÍA -->
    <section class="section">
      <div class="section-inner">
        <div class="section-head">
          <div><p class="eyebrow">CURADURÍA CULTURAL</p><h2>${t('featured')}</h2></div>
          <div><p>${t('featuredBody')}</p><a class="link-arrow" href="#explorar">${t('seeAll')}</a></div>
        </div>
        <div class="story-grid">${featured.map(c => `<a class="story-card" href="#perfil/${c.id}"><img src="${esc(safeMediaUrl(c.image) || 'assets/logo-mark.svg')}" alt="${esc(c.name)}" loading="lazy"><div class="story-card-content"><div class="meta">${verBadge(c)} ${esc(c.category)} · ${esc(c.location)}</div><h3>${esc(c.name)}</h3><p>${esc(c.short)}</p></div></a>`).join('')}</div>
      </div>
    </section>

    <!-- CREADORES -->
    <section class="section" style="background:var(--grey-2)">
      <div class="section-inner">
        <div class="section-head"><div><p class="eyebrow">EXPLORAR</p><h2>${t('creatorsTitle')}</h2></div><p>${t('creatorsBody')}</p></div>
        <div class="creator-grid">${directoryProfiles().slice(0, 3).map(creatorCard).join('')}</div>
      </div>
    </section>

    <!-- IMPACTO -->
    <section class="section impact-band">
      <div class="section-inner">
        <div class="section-head"><div><p class="eyebrow">MVP · PILOTO ECUADOR</p><h2>${t('impactTitle')}</h2></div><p>${t('impactBody')}</p></div>
        <div class="impact-grid">${impact.map(i => `<div class="impact-item"><strong>${i.value}</strong><span>${i.label}</span></div>`).join('')}</div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-panel">
      <img src="assets/images/mural.jpg" alt="Mural cultural">
      <div class="cta-content">
        <p class="eyebrow">AGENTES CULTURALES</p>
        <h2>Tu historia cultural merece ser encontrada.</h2>
        <p>Crea una presencia digital premium, conserva el control de tu narrativa y conecta con exploradores y aliados alrededor del mundo.</p>
        <a class="btn light" href="#registro">Empezar ahora</a>
      </div>
    </section>
    ${footer()}`;
  }

  /* ── FEED ────────────────────────────────────────────────── */
  function feedView() {
    if (!isAuth()) return loginView();
    const posts = feedPosts();
    const user  = me();
    const myFollows = remoteFollowRefs();
    return `<div class="feed-layout">
      ${storiesRow()}
      <div class="feed-col">
        <div class="feed-hdr">
          <h2>Feed cultural</h2>
          <a class="btn" href="#crear" style="min-height:38px;padding:0 20px;font-size:11px;letter-spacing:.1em">＋ Publicar</a>
        </div>
        <div id="feed-posts">
          ${posts.length
            ? posts.map(postCard).join('')
            : `<div class="empty-feed"><p>Sigue agentes culturales para ver su contenido aquí.</p><a class="btn" href="#explorar">Explorar agentes culturales</a></div>`}
          ${posts.length ? `<div id="feed-sentinel" class="feed-sentinel${window.ORIGEN_API?.cache?.postsExhausted ? ' done' : ''}" aria-live="polite"></div>` : ''}
        </div>
      </div>
      <aside class="feed-aside">
        <div class="aside-card">
          <p class="eyebrow">DESCUBRIR</p>
          <h3>Agentes culturales</h3>
          ${directoryProfiles().slice(0, 4).map(c => `<div class="aside-row">
            <a href="#perfil/${c.id}">${avatarEl(c, 'sm')}</a>
            <div class="aside-row-info"><a href="#perfil/${c.id}"><strong>${esc(c.name)}</strong></a><p>${esc(c.category)}</p></div>
            <button class="btn-follow-sm${myFollows.includes(c.id) ? ' on' : ''}" data-fuser="${c.id}">${myFollows.includes(c.id) ? 'Siguiendo' : '+ Seguir'}</button>
          </div>`).join('')}
          <a class="link-arrow" href="#explorar" style="display:block;margin-top:18px;font-size:12px">Ver todos →</a>
        </div>
        <div class="aside-card">
          <p class="eyebrow">CATEGORÍAS</p>
          ${categories.slice(1).map(cat => `<a href="#explorar" class="aside-cat">${cat}</a>`).join('')}
        </div>
        <div class="aside-card">
          <p class="eyebrow">MI PERFIL</p>
          <div class="aside-row">
            ${avatarEl(user, 'sm')}
            <div class="aside-row-info"><strong>${esc(user.name)}</strong><p>${user.accountType === 'creator' ? 'Agente Cultural' : 'Explorador Cultural'}</p></div>
          </div>
          <a href="#mi-perfil" class="link-arrow" style="display:block;margin-top:12px;font-size:12px">Ver mi perfil →</a>
        </div>
      </aside>
    </div>`;
  }

  /* ── EXPLORE ─────────────────────────────────────────────── */
  function exploreView() {
    return `<section class="page-hero">
      <div class="section-inner">
        <p class="eyebrow">DIRECTORIO CULTURAL</p>
        <h1>${t('discover')}</h1>
        <p class="lead">${t('discoverSub')}</p>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        <div class="search-toolbar">
          <input id="explore-search" class="search-input" type="search" placeholder="${t('searchPlaceholder')}" value="${esc(state.query)}">
          <button class="btn" id="clear-filters">Limpiar filtros</button>
        </div>
        <div class="category-strip" aria-label="Categorías">
          ${categories.map(cat => `<button class="chip ${state.activeCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}</button>`).join('')}
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
      const qOk   = !q || [c.name, c.type, c.category, c.location, c.short, ...c.tags].join(' ').toLowerCase().includes(q);
      return catOk && qOk;
    });
    grid.innerHTML = filtered.length
      ? filtered.map(creatorCard).join('')
      : `<div class="empty-state"><h3>${t('noResults')}</h3><p>Prueba con otra categoría o palabra clave.</p></div>`;
    bindFavorites();
  }

  /* ── CREATOR PROFILE ─────────────────────────────────────── */
  function creatorProfileView(id) {
    const c = creators.find(x => x.id === id);
    if (!c) return `<section class="section"><div class="section-inner"><h2>Perfil no encontrado</h2><a class="btn" href="#explorar">Volver a explorar</a></div></section>`;
    const user = me();
    const myFollows = user ? remoteFollowRefs() : [];
    const isFollowing = myFollows.includes(c.id);
    const favs  = remoteFavoriteRefs();
    const isSaved = favs.includes(c.id);
    const cPosts = allPosts().filter(p => p.authorId === c.id);
    return `<section class="profile-hero">
      <img class="profile-cover" src="${esc(safeMediaUrl(c.cover))}" alt="Portada de ${esc(c.name)}">
      <div class="profile-hero-content">
        <img class="profile-avatar" src="${esc(safeMediaUrl(c.image))}" alt="${esc(c.name)}">
        <div class="profile-title">
          <p class="eyebrow">${esc(c.type)} · ${esc(c.location)}</p>
          <h1>${esc(c.name)} ${verBadge(c)}</h1>
          <p>${esc(c.category)} · ${Intl.NumberFormat('es').format(c.followers)} seguidores</p>
        </div>
        <div class="profile-actions">
          <button class="btn light" data-fuser="${c.id}">${isFollowing ? t('following') : t('follow')}</button>
          <button class="btn" style="border-color:rgba(255,255,255,.4);color:#fff;background:rgba(255,255,255,.1)" data-favorite="${c.id}">${isSaved ? t('saved') : t('save')}</button>
        </div>
      </div>
    </section>
    <section class="profile-layout">
      <div>
        ${profileTrustNotice(c)}
        <div class="profile-story">
          <p class="eyebrow">SU HISTORIA CULTURAL</p>
          <h2>Una puerta directa a su identidad</h2>
          <p>${esc(c.story)}</p>
          <div class="creator-tags">${c.tags.map(tg => `<span>${esc(tg)}</span>`).join('')}</div>
        </div>
        <div style="margin-top:60px">
          <p class="eyebrow">PUBLICACIONES (${cPosts.length || c.posts.length})</p>
          ${cPosts.length
            ? `<div id="creator-posts" style="margin-top:20px">${cPosts.map(postCard).join('')}</div>`
            : `<div class="posts-grid" style="margin-top:20px">${c.posts.map(p => `<article class="post-card"><div class="post-media"><img src="${esc(safeMediaUrl(p.image))}" alt="${esc(p.title)}" loading="lazy"></div><div class="post-body"><h3 class="post-title">${esc(p.title)}</h3><p class="post-desc">${esc(p.text)}</p></div></article>`).join('')}</div>`}
        </div>
      </div>
      <aside class="profile-aside">
        <p class="eyebrow">PERFIL CULTURAL</p>
        <dl>
          <div><dt>Tipo</dt><dd>${esc(c.type)}</dd></div>
          <div><dt>Ubicación</dt><dd>${esc(c.location)}</dd></div>
          <div><dt>${state.lang === 'es' ? 'Estado del perfil' : 'Profile status'}</dt><dd>${esc(profileTrustInfo(c).label)}</dd></div>
        </dl>
        ${socialLinksHtml(c)}
        <p class="form-note" style="margin-top:20px">Origen Cultural no administra ventas ni se apropia de la historia del creador.</p>
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
    const user    = me();
    const profile = (user && user.id === id) ? user : normalisePublicProvider((window.ORIGEN_API?.cache?.publicProfiles || []).find(x => x.id === id));
    if (!profile) return `<div class="section"><div class="section-inner" style="padding:80px 20px;text-align:center"><h2>Perfil no encontrado</h2><a href="#feed" class="btn" style="margin-top:20px">Volver</a></div></div>`;
    const myFollows = user ? remoteFollowRefs() : [];
    const isMe      = !!(user && user.id === id);
    const following = myFollows.includes(id);
    const ownedCultural = (window.ORIGEN_API?.cache?.culturalProfiles || []).find(cp => cp.owner_id === id);
    const follCount = ownedCultural?.follower_count || 0;
    const followCount = isMe ? remoteFollowRefs().length : 0;
    const uPosts = allPosts().filter(p => p.authorId === id);
    return `<section class="profile-hero">
      ${profile.cover
        ? `<img class="profile-cover" src="${esc(safeMediaUrl(profile.cover))}" alt="Portada">`
        : `<div class="profile-cover-blank"></div>`}
      <div class="profile-hero-content">
        ${avatarEl(profile, 'lg')}
        <div class="profile-title">
          <p class="eyebrow">${profile.accountType === 'creator' ? 'Agente Cultural' : 'Explorador Cultural'}${profile.location ? ' · ' + esc(profile.location) : ''}</p>
          <h1>${esc(profile.name)}</h1>
          <p>${follCount} seguidores · ${followCount} siguiendo · ${uPosts.length} publicaciones</p>
        </div>
        <div class="profile-actions">
          ${isMe
            ? `<a class="btn light" href="#editar-perfil">Editar perfil</a>`
            : `<button class="btn light" data-fuser="${id}">${following ? t('following') : t('follow')}</button>`}
        </div>
      </div>
    </section>
    <section class="profile-layout">
      <div>
        ${profile.accountType === 'creator' ? profileTrustNotice(profile) : ''}
        ${profile.story ? `<div class="profile-story"><p class="eyebrow">HISTORIA CULTURAL</p><p>${esc(profile.story)}</p></div>` : ''}
        ${profile.accountType === 'creator' ? `<section class="provider-professional"><div class="provider-prof-head"><div><p class="eyebrow">PERFIL PROFESIONAL CULTURAL</p><h2>${esc(profile.providerHeadline || 'Servicios y conocimiento cultural')}</h2></div>${profile.website ? `<a class="btn secondary" href="${esc(safeExternalUrl(profile.website))}" target="_blank" rel="noopener noreferrer">Visitar sitio web ↗</a>` : ''}</div>${profile.serviceDescription ? `<p class="provider-prof-copy">${esc(profile.serviceDescription)}</p>` : ''}${profile.services && profile.services.length ? `<div class="service-grid">${profile.services.map(service => `<div class="service-chip">${esc(service)}</div>`).join('')}</div>` : `<p class="form-note">Añade tus servicios, talleres, experiencias o conocimientos desde “Editar perfil”.</p>`}<div class="provider-contact-row">${profile.publicEmail ? `<a href="mailto:${esc(profile.publicEmail)}">✉ ${esc(profile.publicEmail)}</a>` : ''}${profile.publicWhatsapp ? `<span>WhatsApp: ${esc(profile.publicWhatsapp)}</span>` : ''}</div></section>` : ''}
        ${profile.categories && profile.categories.length ? `<div class="creator-tags" style="margin:18px 0">${profile.categories.map(cat => `<span>${esc(cat)}</span>`).join('')}</div>` : ''}
        <div style="margin-top:40px">
          <p class="eyebrow">PUBLICACIONES (${uPosts.length})</p>
          ${uPosts.length
            ? `<div style="margin-top:20px">${uPosts.map(postCard).join('')}</div>`
            : `<div class="empty-state" style="margin-top:20px;border:1px dashed #ddd;padding:40px;text-align:center">
                <p>Aún no hay publicaciones.</p>
                ${isMe ? `<a class="btn" href="#crear" style="margin-top:14px">Crear primera publicación</a>` : ''}
              </div>`}
        </div>
      </div>
      <aside class="profile-aside">
        <p class="eyebrow">PERFIL CULTURAL</p>
        <dl>
          <div><dt>Tipo</dt><dd>${profile.accountType === 'creator' ? 'Agente Cultural' : 'Explorador Cultural'}</dd></div>
          ${profile.location ? `<div><dt>Ubicación</dt><dd>${esc(profile.location)}</dd></div>` : ''}
          ${profile.categories && profile.categories.length ? `<div><dt>Categorías</dt><dd>${profile.categories.map(esc).join(', ')}</dd></div>` : ''}
        </dl>
        ${socialLinksHtml(profile)}
        ${isMe ? `<a href="#editar-perfil" class="btn secondary" style="width:100%;margin-top:20px;text-align:center">Editar perfil</a>
                  <a href="mailto:info.origencultural@gmail.com?subject=ORIGEN%20-%20Solicitud%20de%20privacidad%20o%20eliminaci%C3%B3n%20de%20cuenta" class="text-button privacy-request-link" style="display:block;width:100%;margin-top:14px;text-align:center">Solicitar privacidad / eliminación de cuenta</a>
                  <button id="logout-btn-aside" class="btn" style="width:100%;margin-top:10px;background:transparent;color:#888;border-color:#ddd">Cerrar sesión</button>` : ''}
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
    const user = me();
    if (!user) { go('login'); return ''; }
    const saves = window.ORIGEN_API?.cache?.saves || [];
    const saved = allPosts().filter(p => saves.includes(p.id));
    return `<section class="page-hero">
      <div class="section-inner">
        <p class="eyebrow">MI COLECCIÓN</p>
        <h1>Guardados</h1>
        <p class="lead">${saved.length} publicación${saved.length !== 1 ? 'es' : ''} guardada${saved.length !== 1 ? 's' : ''}</p>
      </div>
    </section>
    <section class="section">
      <div class="section-inner">
        ${saved.length
          ? `<div class="saved-grid">${saved.map(postCard).join('')}</div>`
          : `<div class="empty-state"><h3>Aún no guardaste publicaciones</h3><p>Guarda publicaciones del feed para verlas aquí.</p><a class="btn" href="#feed" style="margin-top:20px">Ir al feed</a></div>`}
      </div>
    </section>
    ${footer()}`;
  }

  /* ── CREATE POST ─────────────────────────────────────────── */
  function createPostView() {
    const user = me();
    if (!user) { go('login'); return ''; }
    if (user.accountType !== 'creator') {
      const es = state.lang === 'es';
      return `<section class="page-hero"><div class="section-inner">
        <p class="eyebrow">${es ? 'BETA ORIGEN' : 'ORIGEN BETA'}</p>
        <h1>${es ? 'El feed cultural es para Agentes Culturales' : 'The cultural feed is for Cultural Agents'}</h1>
        <p class="lead">${es
          ? 'Como Explorador Cultural puedes descubrir, seguir, guardar, aprender y conectar con Agentes Culturales. La publicación de contenido para Exploradores no forma parte de esta beta.'
          : 'As a Cultural Explorer you can discover, follow, save, learn and connect with Cultural Agents. Publishing content as an Explorer is not part of this beta.'}</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:24px">
          <a class="btn" href="#explorar">${es ? 'Explorar cultura' : 'Explore culture'}</a>
          <a class="btn secondary" href="#pasaporte">${es ? 'Mi Pasaporte Cultural' : 'My Cultural Passport'}</a>
        </div>
      </div></section>${footer()}`;
    }
    const d = state.createData;
    const isProvider = true;
    const types = isProvider
      ? [['photo','◫ Foto'],['carousel','⊟ Carrusel'],['video','▷ Video']]
      : [['photo','◫ Foto'],['carousel','⊟ Carrusel'],['video','▷ Video'],['text','Ⅱ Texto']];
    const CATS  = ['Artesanía y tradición','Gastronomía ancestral','Música y danza','Territorio y patrimonio','Arte y cultura','Educación cultural','Comunidad'];
    const PURPOSES = [
      ['education','Educación cultural'],
      ['history','Historia y memoria'],
      ['technique','Técnica / proceso'],
      ['territory','Territorio'],
      ['language','Lengua'],
      ['gastronomy','Gastronomía'],
      ['arts','Artes / expresión'],
      ['heritage','Patrimonio'],
      ['community','Comunidad']
    ];
    const hasMedia = d.media && d.media.length > 0;

    return `<section class="page-hero" style="min-height:220px">
      <div class="section-inner">
        <p class="eyebrow">NUEVA PUBLICACIÓN</p>
        <h1>Compartir cultura</h1>
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
              : `<div class="upload-placeholder"><span>+</span><p>${d.type === 'video' ? 'Selecciona un video' : d.type === 'carousel' ? 'Selecciona fotos (puedes elegir varias)' : 'Selecciona una foto'}</p><small>Haz clic para subir</small></div>`}
            <input type="file" id="post-media-input" accept="${d.type === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp'}" ${d.type === 'carousel' ? 'multiple' : ''} style="display:none">
          </div>` : ''}
        <form class="form-grid" id="create-form">
          ${isProvider ? `<div class="form-field full cultural-feed-note"><p class="eyebrow">FEED CULTURAL Y EDUCATIVO</p><p>Comparte conocimiento, contexto, técnicas, historias o territorio mediante foto, carrusel o video. Los servicios pueden presentarse en tu perfil profesional; evita publicidad genérica en el feed.</p></div>` : ''}
          <div class="form-field full"><label>Título *</label><input name="title" required placeholder="Un título que invite a descubrir" value="${esc(d.title || '')}"></div>
          <div class="form-field full"><label>Descripción *</label><textarea name="description" rows="4" required placeholder="Comparte el contexto, la historia o el significado cultural...">${esc(d.description || '')}</textarea></div>
          <div class="form-field"><label>Categoría cultural</label><select name="category">${CATS.map(c => `<option${d.category === c ? ' selected' : ''}>${c}</option>`).join('')}</select></div>
          <div class="form-field"><label>Propósito cultural *</label><select name="contentPurpose" required>${PURPOSES.map(([value,label]) => `<option value="${value}"${(d.contentPurpose || 'education') === value ? ' selected' : ''}>${label}</option>`).join('')}</select></div>
          <div class="form-field"><label>Territorio</label><input name="territory" placeholder="Ciudad, región o país" value="${esc(d.territory || '')}"></div>
          <div class="form-field full"><label>Etiquetas <small style="color:#888;font-weight:400">(separadas por coma)</small></label><input name="tags" placeholder="Bordado, Ecuador, Memoria" value="${esc((d.tags || []).join(', '))}"></div>
          <fieldset class="post-cultural-safety form-field full" aria-describedby="post-safety-intro">
            <legend>${state.lang === 'es' ? 'Responsabilidad cultural antes de publicar' : 'Cultural responsibility before publishing'}</legend>
            <p id="post-safety-intro">${state.lang === 'es'
              ? 'Confirma ambos puntos para cada publicación. Tu declaración no equivale a una verificación oficial de ORIGEN.'
              : 'Confirm both statements for each post. Your declaration is not an official verification by ORIGEN.'}</p>
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
            <p class="post-safety-help">${state.lang === 'es'
              ? 'Si no puedes confirmar ambos puntos, no publiques todavía. Solicita permiso o retira ese contenido.'
              : 'If you cannot confirm both statements, do not publish yet. Request permission or remove that content.'}
              <a href="#confianza">${state.lang === 'es' ? 'Centro de confianza' : 'Trust Center'}</a>.
            </p>
            <p id="post-safety-error" class="post-safety-error" role="alert" aria-live="assertive" hidden></p>
          </fieldset>
          <div class="form-field full">
            <button class="btn" type="submit" style="width:100%">${state.lang === 'es' ? 'Publicar →' : 'Publish →'}</button>
            <p class="form-note" style="margin-top:12px">Tu publicación se guardará en ORIGEN y quedará vinculada a tu cuenta.</p>
          </div>
        </form>
      </div>
      <div class="create-preview-wrap">
        <p class="eyebrow" style="margin-bottom:16px">VISTA PREVIA</p>
        <div id="create-live-preview">
          ${d.title || hasMedia
            ? postCard({ id:'_prev', authorId: user.id, type: d.type, media: d.media || [], title: d.title || 'Título', description: d.description || '', category: d.category || '', contentPurpose: d.contentPurpose || 'education', territory: d.territory || '', tags: d.tags || [], timestamp: new Date().toISOString(), likes: 0 })
            : `<div style="padding:40px;text-align:center;border:1px dashed #ccc;color:#888"><p>La vista previa aparecerá aquí.</p></div>`}
        </div>
      </div>
    </div>`;
  }

  /* ── EDIT PROFILE ────────────────────────────────────────── */
  function editProfileView() {
    const user = me();
    if (!user) { go('login'); return ''; }
    const CATS = ['Artesanía y tradición','Gastronomía ancestral','Música y danza','Territorio y patrimonio','Arte y cultura','Educación cultural','Comunidad'];
    const userCats = user.categories || [];
    return `<section class="page-hero" style="min-height:200px">
      <div class="section-inner">
        <p class="eyebrow">MI CUENTA</p>
        <h1>Editar perfil</h1>
      </div>
    </section>
    <div class="edit-wrap">
      <div class="upload-section">
        <div class="upload-zone" id="edit-avatar-zone">
          ${user.avatar ? `<img src="${esc(safeMediaUrl(user.avatar))}" class="edit-avatar-preview" alt="Avatar">` : avatarEl(user, 'lg')}
          <input type="file" id="edit-avatar-input" accept="image/jpeg,image/png,image/webp" style="display:none">
          <button class="btn" type="button" data-file-trigger="edit-avatar-input">Cambiar foto</button>
        </div>
        <div class="upload-zone wide" id="edit-cover-zone">
          ${user.cover
            ? `<img src="${esc(safeMediaUrl(user.cover))}" class="edit-cover-preview" alt="Portada">`
            : `<div class="upload-placeholder"><span>+</span><p>Foto de portada</p></div>`}
          <input type="file" id="edit-cover-input" accept="image/jpeg,image/png,image/webp" style="display:none">
          <button class="btn secondary" type="button" data-file-trigger="edit-cover-input">Cambiar portada</button>
        </div>
      </div>
      <form class="form-grid" id="edit-form">
        <div class="form-field"><label>Nombre</label><input name="name" value="${esc(user.name || '')}"></div>
        <div class="form-field"><label>Ubicación</label><input name="location" value="${esc(user.location || '')}" placeholder="Ciudad, País"></div>
        <div class="form-field full"><label>Tu historia cultural</label><textarea name="story" rows="4" placeholder="¿Quién eres, qué representas y qué deseas compartir?">${esc(user.story || '')}</textarea></div>
        <div class="form-field full">
          <label>Categorías culturales</label>
          <div class="cat-chips">${CATS.map(cat => `<button type="button" class="chip${userCats.includes(cat) ? ' active' : ''}" data-cat="${cat}">${cat}</button>`).join('')}</div>
        </div>
        ${user.accountType === 'creator' ? `<p class="eyebrow" style="grid-column:1/-1;margin-bottom:4px">PERFIL PROFESIONAL CULTURAL</p><div class="form-field full"><label>Titular profesional</label><input name="providerHeadline" maxlength="180" value="${esc(user.providerHeadline || '')}" placeholder="Ej. Talleres de bordado tradicional y educación cultural"></div><div class="form-field full"><label>Servicios / oferta cultural</label><input name="services" value="${esc((user.services || []).join(', '))}" placeholder="Talleres, piezas por encargo, demostraciones, charlas"></div><div class="form-field full"><label>Descripción de servicios</label><textarea name="serviceDescription" rows="3" maxlength="4000" placeholder="Explica qué ofreces, para quién y cómo pueden contactarte.">${esc(user.serviceDescription || '')}</textarea></div>` : ''}
        <p class="eyebrow" style="grid-column:1/-1;margin-bottom:4px">REDES Y CONTACTO</p>
        ${[['instagram','Instagram'],['facebook','Facebook'],['tiktok','TikTok'],['youtube','YouTube'],['linkedin','LinkedIn'],['whatsapp','WhatsApp'],['email','Correo'],['web','Sitio web']].map(([k, label]) =>
          `<div class="form-field"><label>${label}</label><input name="${k}" value="${esc(user.links && user.links[k] ? user.links[k] : '')}" placeholder="URL o usuario"></div>`).join('')}
        <div class="form-field full">
          <button class="btn" type="submit" style="width:100%">Guardar cambios</button>
        </div>
      </form>
      <button id="logout-btn" class="btn secondary" style="width:100%;margin-top:16px;color:#666;border-color:#ddd">Cerrar sesión</button>
    </div>`;
  }

  /* ── REGISTER WIZARD ─────────────────────────────────────── */
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
        <div class="form-field"><label>${L('País y ciudad *','Country and city *')}</label><input name="location" required placeholder="${L('Quito, Ecuador','Brisbane, Australia')}" value="${esc(d.location || '')}"></div>
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
        <div class="form-field full"><label>${L('Tu historia cultural','Your cultural story')}</label><textarea name="story" rows="4" placeholder="${L('¿Quién eres, qué representas y qué deseas compartir con el mundo?','Who are you, what do you represent, and what would you like to share with the world?')}">${esc(d.story || '')}</textarea></div>
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
          <label class="legal-check">
            <input type="checkbox" name="acceptedLegal" required ${d.acceptedLegal ? 'checked' : ''}>
            <span>${L('Acepto los','I accept ORIGEN’s')} <a href="#confianza">${L('Términos de Uso, Privacidad, Normas de Comunidad y Derechos Culturales v1.2','Terms of Use, Privacy, Community Guidelines and Cultural Rights v1.2')}</a>${es ? ' de ORIGEN.' : '.'}</span>
          </label>
          <p class="form-note">${L('Puedes revisar el Centro de confianza antes de crear tu cuenta.','You can review the Trust Center before creating your account.')}</p>
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
    const user = me();
    const favs = remoteFavoriteRefs();
    const foll = remoteFollowRefs();
    const name = user ? user.name : 'Explorador Cultural';
    const init = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    const collectedRefs = new Set([...favs, ...foll]);
    const collected = directoryProfiles().filter(p => collectedRefs.has(p.id) || collectedRefs.has(p.slug));
    const countries = [...new Set(collected.map(p => p.country || (p.location || '').split(',').pop()?.trim()).filter(Boolean))];
    const cultures = [...new Set(collected.flatMap(p => p.categories || [p.category]).filter(Boolean))];

    const score = collected.length + (countries.length * 2) + cultures.length;
    const levels = [
      { name:'Semilla', min:0, next:3 },
      { name:'Caminante Cultural', min:3, next:7 },
      { name:'Cartógrafo Cultural', min:7, next:12 },
      { name:'Explorador Global', min:12, next:20 },
      { name:'Conector Cultural', min:20, next:null }
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
      <div class="section-head"><div><p class="eyebrow">COLECCIÓN CULTURAL GLOBAL</p><h1 style="font-size:clamp(48px,7vw,92px)">${t('passportTitle')}</h1></div><p>Tu Pasaporte Cultural crece cuando descubres, guardas y sigues cultura viva. El progreso premia aprendizaje y diversidad, no tiempo de pantalla.</p></div>

      <article class="passport-card">
        <div class="passport-head"><img class="passport-logo" src="assets/logo-lockup.svg" alt="Origen Cultural"><div class="passport-id">PASAPORTE CULTURAL<br>COLECCIÓN PERSONAL</div></div>
        <div class="passport-person"><div class="avatar">${init}</div><div><p class="eyebrow">${user && user.accountType === 'creator' ? 'AGENTE CULTURAL' : 'EXPLORADOR CULTURAL'}</p><h2>${esc(name)}</h2><p>${user && user.location ? esc(user.location) : 'Explorando cultura viva alrededor del mundo'}</p></div></div>
        <div class="passport-progress">
          <div class="progress-stat"><strong>${collected.length}</strong><span>Perfiles en tu colección</span></div>
          <div class="progress-stat"><strong>${countries.length}</strong><span>Países descubiertos</span></div>
          <div class="progress-stat"><strong>${cultures.length}</strong><span>Categorías culturales</span></div>
        </div>
      </article>

      <div class="level-section">
        <p class="eyebrow">NIVEL DE EXPLORACIÓN</p>
        <h2>${level.name}</h2>
        <div class="level-track"><div class="level-fill" style="width:${progress}%"></div></div>
        <p>${level.next ? `${progress}% hacia el siguiente nivel. Cada nueva cultura, territorio o categoría suma a tu recorrido.` : 'Has alcanzado el nivel más alto de esta primera colección.'}</p>

        <div class="collection-strip">
          <div><strong>${countries.length || 0}</strong><span>Sellos de país</span></div>
          <div><strong>${cultures.length || 0}</strong><span>Colecciones temáticas</span></div>
          <div><strong>${favs.length}</strong><span>Memorias guardadas</span></div>
        </div>

        ${countries.length ? `<div class="passport-stamps"><p class="eyebrow">MIS SELLOS</p><div class="creator-tags">${countries.map(country => `<span>⌖ ${esc(country)}</span>`).join('')}</div></div>` : ''}

        <div class="badges">
          ${badge(collected.length >= 1, '⌖', 'Primer descubrimiento', collected.length >= 1 ? 'Guardaste o seguiste tu primer perfil cultural.' : 'Descubre y guarda tu primer perfil cultural.')}
          ${badge(collected.length >= 3, '◇', 'Coleccionista curioso', collected.length >= 3 ? 'Ya reuniste tres perfiles culturales.' : 'Reúne tres perfiles culturales en tu Pasaporte.')}
          ${badge(countries.length >= 2, '◎', 'Cruce de fronteras', countries.length >= 2 ? 'Tu colección ya conecta al menos dos países.' : 'Descubre cultura de al menos dos países.')}
        </div>

        <div class="passport-philosophy">
          <p class="eyebrow">JUGAR SIN PERDER EL EQUILIBRIO</p>
          <p>ORIGEN puede usar colecciones, niveles, sellos y retos culturales. No premiamos permanecer conectado más tiempo y evitamos castigar al usuario por tomarse días de descanso.</p>
        </div>
      </div>
    </div></section>${footer()}`;
  }

  /* ── IMPACT ──────────────────────────────────────────────── */
  function impactView() {
    const values = [
      ['Dignidad cultural','La cultura se presenta con respeto, contexto y valor, no como espectáculo vacío.'],
      ['Autenticidad','La voz y la historia de cada Agente Cultural permanecen como eje central.'],
      ['Autonomía','Cada perfil conserva sus canales, decisiones, historia e identidad.'],
      ['Conexión global','La plataforma conecta culturas con públicos, aliados y oportunidades internacionales.'],
      ['Innovación ética','La tecnología apoya claridad y alcance sin inventar tradiciones.'],
      ['Soberanía narrativa','Cada creador decide qué mostrar, qué reservar y cómo ser contactado.']
    ];
    return `<section class="page-hero" style="background:var(--black);color:var(--white)">
      <div class="section-inner"><p class="eyebrow">PROPÓSITO · ÉTICA · ESCALA</p><h1>${t('impactPage')}</h1><p class="lead" style="color:#ccc">${t('impactPageSub')}</p></div>
    </section>
    <section class="section"><div class="section-inner">
      <div class="section-head"><div><p class="eyebrow">VALORES DE MARCA</p><h2>La cultura con el valor que merece</h2></div><p>Origen Cultural prioriza consentimiento, representación autónoma, contexto y conexión humana.</p></div>
      <div class="values-grid">${values.map((v, i) => `<article class="value-card"><span class="number">0${i + 1}</span><h3>${v[0]}</h3><p>${v[1]}</p></article>`).join('')}</div>
    </div></section>
    <section class="section impact-band"><div class="section-inner">
      <div class="section-head"><div><p class="eyebrow">ROADMAP</p><h2>De historias auténticas a una comunidad global</h2></div><p>Primero crecemos con Agentes que comparten cultura y Exploradores que descubren, siguen y comparten historias libremente. La publicidad pagada solo tendría sentido después de lograr una audiencia real.</p></div>
      <div class="impact-grid">
        <div class="impact-item"><strong>0</strong><span>Preparación, identidad y criterios de verificación</span></div>
        <div class="impact-item"><strong>1</strong><span>Piloto Ecuador: hasta 10 Agentes Culturales voluntarios, después de aprobar seguridad y consentimiento</span></div>
        <div class="impact-item"><strong>2</strong><span>Comunidad orgánica: publicar historias culturales, descubrir Agentes, seguir, guardar y compartir sin pagar</span></div>
        <div class="impact-item"><strong>3+</strong><span>Futuro: promociones pagadas opcionales; después, posibles comisiones acordadas por ventas derivadas a webs oficiales</span></div>
      </div>
    </div></section>${footer()}`;
  }

  /* ── TRUST CENTER ───────────────────────────────────────── */
  function trustCenterView() {
    const trust = window.ORIGEN_TRUST;
    if (!trust) return `<section class="section"><div class="section-inner"><h2>Centro de confianza no disponible</h2></div></section>`;
    return `<section class="page-hero trust-hero"><div class="section-inner">
      <p class="eyebrow">CONFIANZA · PRIVACIDAD · CULTURA</p>
      <h1>Centro de confianza</h1>
      <p class="lead">Lo esencial para entender cómo ORIGEN cuida tu cuenta, tus datos, el contenido cultural y la comunidad.</p>
      <div class="trust-meta"><span>${esc(trust.version)}</span><span>${esc(trust.updated)}</span></div>
    </div></section>
    <section class="section trust-section"><div class="section-inner trust-layout">
      <aside class="trust-nav">${trust.sections.map(s => `<a href="#trust-${s.id}">${esc(s.title)}</a>`).join('')}</aside>
      <div class="trust-content">
        <div class="trust-status"><strong>Estado beta</strong><p>${esc(trust.status)}</p></div>
        ${trust.sections.map(s => `<article class="trust-card" id="trust-${s.id}"><p class="eyebrow">${esc(s.title)}</p>${s.body.map(p => `<p>${esc(p)}</p>`).join('')}</article>`).join('')}
        <article class="trust-card trust-contact"><p class="eyebrow">CONTACTO</p><h2>Ayuda, reportes y solicitudes</h2><p><a href="#solicitar-revision">${state.lang === 'es' ? 'Solicitar corrección o retirada sin crear cuenta' : 'Request correction or removal without an account'}</a></p><p><a href="mailto:${esc(trust.contact)}">${esc(trust.contact)}</a></p></article>
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

  let _prevRoute = '';

  function render(route, scroll = true) {
    route = route !== undefined ? route : currentRoute();
    refreshSession();

    // Destroy globes when leaving their sections
    if (_prevRoute === 'mundo'  && route !== 'mundo'  && window.MundoCultural) window.MundoCultural.destroy();
    if (_prevRoute === 'inicio' && route !== 'inicio' && window.HeroGlobe)     window.HeroGlobe.destroy();
    _prevRoute = route;

    let html = '';
    if      (route === 'inicio')                  html = isAuth() ? feedView()            : landingView();
    else if (route === 'feed')                    html = feedView();
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
    if (route.startsWith('reclamar/')) bindClaimProfile();
    if (route === 'registro')      bindRegister();
    if (route === 'solicitar-revision' || route.startsWith('solicitar-revision/')) bindRightsRequest();
    if (route === 'login')         bindLogin();
    if (route === 'recuperar')     bindRecoverPassword();
    if (route === 'restablecer')   bindResetPassword();
    if (route === 'crear')         bindCreatePost();
    if (route === 'editar-perfil') bindEditProfile();
    if (route === 'mundo')         bindMundo();
    if (route === 'inicio')        bindLanding();
    bindFollowButtons();
    bindLogoutBtn();
  }

  /* ── MUNDO CULTURAL ─────────────────────────────────────────── */
  function mundoView() {
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
          <p class="eyebrow">EXPLORACIÓN CULTURAL</p>
          <h1 class="mundo-title">Mundo Cultural</h1>
          <p class="mundo-lead">Descubre culturas vivas alrededor del planeta. Gira el globo, selecciona un territorio y conecta con sus agentes culturales.</p>
        </div>
        <div class="mundo-body">
          <div class="mundo-globe-wrap">
            <div id="globe-container"></div>
            <div class="globe-ui-top">
              <div class="continent-pills">
                ${continents.map((c, i) => `<button class="cont-pill${i===0?' active':''}" data-cont="${c}">${c}</button>`).join('')}
              </div>
            </div>
            <div class="globe-ui-bottom">
              <div class="globe-controls">
                <button id="globe-zoom-in" class="globe-ctrl" title="Acercar" aria-label="Acercar globo">+</button>
                <button id="globe-pause" class="globe-ctrl" title="Pausar rotación" aria-label="Pausar o reanudar rotación">⏸</button>
                <button id="globe-reset" class="globe-ctrl" title="Vista inicial" aria-label="Restablecer vista del globo">⟳</button>
                <button id="globe-zoom-out" class="globe-ctrl" title="Alejar" aria-label="Alejar globo">−</button>
              </div>
              <p class="globe-hint">Gira · Acerca · Toca un país</p>
            </div>
          </div>
          <aside class="mundo-panel" id="mundo-panel">
            <div class="panel-welcome">
              <div class="panel-welcome-icon">◎</div>
              <h3>Selecciona un territorio</h3>
              <p>Haz clic en cualquier país del globo para descubrir su identidad cultural y los agentes culturales registrados en Origen Cultural.</p>
              <p class="eyebrow" style="margin-top:28px">TERRITORIOS DISPONIBLES</p>
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
  function bindPostInteractions() {
    /* likes */
    document.querySelectorAll('[data-like]').forEach(btn => {
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
    document.querySelectorAll('[data-tcoms]').forEach(btn => {
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
    document.querySelectorAll('[data-save]').forEach(btn => {
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

    /* share */
    document.querySelectorAll('[data-share]').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = window.location.href.split('#')[0] + '#feed';
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => showToast('Enlace copiado al portapapeles.'));
        else showToast('Comparte este enlace: ' + url);
      });
    });

    /* report */
    document.querySelectorAll('[data-report]').forEach(btn => {
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
    document.querySelectorAll('[data-pmore]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid  = btn.dataset.pmore;
        const user = me();
        const post = allPosts().find(p => p.id === pid);
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
    document.querySelectorAll('[data-cdir]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const pid  = btn.dataset.car;
        const dir  = parseInt(btn.dataset.cdir, 10);
        const post = allPosts().find(p => p.id === pid);
        if (!post) return;
        const cur  = state.carIdx[pid] || 0;
        state.carIdx[pid] = Math.max(0, Math.min(post.media.length - 1, cur + dir));
        rerenderPost(pid);
      });
    });
    document.querySelectorAll('[data-car][data-ci]').forEach(dot => {
      dot.addEventListener('click', e => {
        e.stopPropagation();
        state.carIdx[dot.dataset.car] = parseInt(dot.dataset.ci, 10);
        rerenderPost(dot.dataset.car);
      });
    });

    /* comment forms */
    document.querySelectorAll('[data-cf]').forEach(form => {
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
    document.querySelectorAll('[data-needs-auth]').forEach(btn => {
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
  function rerenderPost(pid) {
    const card = document.querySelector(`[data-pid="${pid}"]`);
    if (!card) return;
    const post = allPosts().find(p => p.id === pid);
    if (!post) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = postCard(post);
    const newCard = tmp.firstElementChild;
    card.replaceWith(newCard);
    // Rebind on the new card only
    const bindOn = (sel, ev, handler) => newCard.querySelectorAll(sel).forEach(el => el.addEventListener(ev, handler));
    const pid2 = pid;
    bindOn('[data-like]', 'click', () => document.querySelector(`[data-pid="${pid2}"] [data-like]`) && document.querySelector(`[data-pid="${pid2}"] [data-like]`).dispatchEvent && null);
    // Re-run full bind to pick up new elements
    bindPostInteractions();
    bindFollowButtons();
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
  function bindFollowButtons() {
    document.querySelectorAll('[data-fuser]').forEach(btn => {
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
        await doLogin(email, password, captchaToken);
        updateShell();
        go('feed');
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
      for (const key of ['name', 'email', 'password', 'location']) {
        if (key in fields) state.regData[key] = fields[key];
      }
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
    if (!preview || !user || user.accountType !== 'creator') return;
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
    if (!currentUser || currentUser.accountType !== 'creator') return;
    /* type buttons */
    document.querySelectorAll('[data-ctype]').forEach(btn => {
      btn.addEventListener('click', () => {
        for (const url of state.createData.media || []) releasePreview(url);
        state.createData.type = btn.dataset.ctype;
        state.createData.rightsAcknowledged = false;
        state.createData.culturalAcknowledged = false;
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

    /* add more media (carousel) */
    const addMore = document.getElementById('add-more-media');
    if (addMore) addMore.addEventListener('click', e => { e.stopPropagation(); mediaInput && mediaInput.click(); });

    /* remove media thumbnail */
    document.querySelectorAll('[data-rmidx]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.rmidx, 10);
        const [preview] = state.createData.media.splice(idx, 1);
        state.createData.rightsAcknowledged = false;
        state.createData.culturalAcknowledged = false;
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
      form.querySelectorAll('[data-post-attestation]').forEach(input => { input.checked = false; });
    };
    form.querySelectorAll('[data-post-attestation]').forEach(input => {
      input.addEventListener('change', () => {
        state.createData[input.name] = input.checked === true;
        const error = document.getElementById('post-safety-error');
        if (error) { error.textContent = ''; error.hidden = true; }
      });
    });
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
      const fd = Object.fromEntries(new FormData(form));
      if (fd.rightsAcknowledged !== 'on' || fd.culturalAcknowledged !== 'on') {
        const error = document.getElementById('post-safety-error');
        if (error) {
          error.hidden = false;
          error.textContent = state.lang === 'es'
            ? 'Antes de publicar, confirma tus permisos de contenido y tu responsabilidad cultural.'
            : 'Before publishing, confirm your content permissions and cultural responsibilities.';
        }
        const missing = form.querySelector('[name="rightsAcknowledged"]:not(:checked), [name="culturalAcknowledged"]:not(:checked)');
        if (missing) missing.focus();
        return; // Must run before uploads or any database write.
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
      const submit = form.querySelector('button[type="submit"]');
      if (submit) { submit.disabled = true; submit.textContent = 'Publicando…'; }
      const uploaded = [];
      const filesToUpload = [...(state.createData.files || [])];
      try {
        for (let i = 0; i < filesToUpload.length; i++) {
          if (me()?.id !== user.id) throw new Error('La sesión cambió durante la subida.');
          uploaded.push(await window.ORIGEN_API.upload('post-media', filesToUpload[i], `post-${i+1}`));
        }
        if (me()?.id !== user.id) throw new Error('La sesión cambió; publicación cancelada antes de enviarse.');
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
          tags: fd.tags ? fd.tags.split(',').map(s => s.trim()).filter(Boolean) : []
        }, user.id);
        if (me()?.id !== user.id) return; // Do not mutate another account's draft or UI.
        for (const url of state.createData.media || []) releasePreview(url);
        state.createData = { type: 'photo', media: [], files: [], tags: [], contentPurpose: 'education' };
        showToast('¡Publicación creada!');
        go('feed');
      } catch (error) {
        if (uploaded.length) {
          Promise.allSettled(uploaded.map(url => window.ORIGEN_API.removeOwnMedia(url))).then(results => {
            if (results.some(result => result.status === 'rejected')) {
              console.warn('ORIGEN post upload cleanup incomplete after failed post creation.');
            }
          });
        }
        showToast(error.message || 'No pudimos crear la publicación.');
        if (submit) { submit.disabled = false; submit.textContent = 'Publicar →'; }
      }
    });
  }

  /* Edit profile */
  function bindEditProfile() {
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
          location: fd.location,
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
            if (results.some(result => result.status === 'rejected')) {
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
          if (results.some(item => item.status === 'rejected')) {
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
      try {
        await window.ORIGEN_API.deletePost(postId);
        close();
        showToast(state.lang === 'es' ? 'Publicación eliminada.' : 'Post deleted.');
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
      ...results.map(c => { const href = c._kind === 'user' ? `#usuario/${c.id}` : `#perfil/${c.id}`; return `<a class="search-result" href="${href}" data-close-search><div class="ava ava-sm"><img src="${esc(safeMediaUrl(c.image || c.avatar) || 'assets/logo-mark.svg')}" alt=""></div><div><h4>${esc(c.name)} ${verBadge(c)}</h4><p>${esc(c.category)} · ${esc(c.location)}</p>${profileTrustChip(c)}</div><span class="link-arrow">Ver</span></a>`; }),
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
      const refreshedUser = await window.ORIGEN_API?.restoreSession() || null;
      if (generation !== authUiGeneration) return;

      const nextUid = refreshedUser?.id || null;
      if (previousUid && previousUid !== nextUid) clearAccountDrafts();
      state.user = refreshedUser;
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
      navigator.serviceWorker.register('service-worker.js').catch(error => {
        console.warn('[ORIGEN] Service worker registration failed:', error);
      });
    });
  }

})();
