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
    user: null,
    authReady: false,
    feedLoading: false,
    wellbeingMinutes: Number(localStorage.getItem('origen-wellbeing-minutes') || 120),
    wellbeingElapsedMs: 0,
    wellbeingLastTick: Date.now(),
    wellbeingNextPromptMs: null,
  };

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

  async function doLogin(email, pw) {
    if (!window.ORIGEN_API) throw new Error('Servicio de autenticación no disponible.');
    const user = await window.ORIGEN_API.signIn(email, pw);
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
    try {
      const result = await window.ORIGEN_API.signUp(data);
      if (result.session) {
        state.user = await window.ORIGEN_API.restoreSession();
        let avatar = state.user?.avatar || '';
        let cover = state.user?.cover || '';
        if (data.avatarFile instanceof File) avatar = await window.ORIGEN_API.upload('avatars', data.avatarFile, 'avatar');
        if (data.coverFile instanceof File) cover = await window.ORIGEN_API.upload('covers', data.coverFile, 'cover');
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
      return { ok: true, ...result };
    } catch (error) {
      return { ok: false, error: error.message || 'No pudimos crear tu cuenta.' };
    }
  }

  async function doLogout() {
    try { await window.ORIGEN_API?.signOut(); } catch (_) {}
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
    return `<div class="ava ava-${sz}"><img src="${src}" alt="${esc(profile.name)}" onerror="this.parentElement.classList.add('ava-init');this.parentElement.textContent='${init}';"></div>`;
  }
  function verBadge(p) {
    const verified = p && (p.profileStatus === 'verified' || (p.verified && !p.referenceProfile));
    return verified ? '<span class="verified" title="Perfil verificado">✓</span>' : '';
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
        <img src="${post.media[cidx]}" alt="${esc(post.title)}" loading="lazy">
        ${isCarousel ? `
          <div class="car-dots">${post.media.map((_, i) => `<button class="car-dot${i === cidx ? ' on' : ''}" data-car="${post.id}" data-ci="${i}" aria-label="Imagen ${i + 1}"></button>`).join('')}</div>
          ${cidx > 0 ? `<button class="car-btn car-l" data-car="${post.id}" data-cdir="-1" aria-label="Anterior">‹</button>` : ''}
          ${cidx < post.media.length - 1 ? `<button class="car-btn car-r" data-car="${post.id}" data-cdir="1" aria-label="Siguiente">›</button>` : ''}
          <span class="car-count">${cidx + 1} / ${post.media.length}</span>
        ` : ''}
      </div>`;
    } else if (post.type === 'video' && post.media && post.media.length) {
      media = `<div class="post-media"><video controls muted playsinline preload="metadata" src="${post.media[0]}" aria-label="${esc(post.title || 'Video cultural')}"></video></div>`;
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
        <a href="${href}" aria-label="${t('profile')}: ${c.name}"><img src="${image}" alt="${c.name}: ${c.category}" loading="lazy"></a>
        <button class="favorite-button ${saved ? 'active' : ''}" data-favorite="${c.id}" aria-pressed="${saved}">${saved ? '◆' : '◇'}</button>
      </div>
      <div class="creator-card-body">
        <div class="creator-meta"><span>${c.type}</span><span>${verBadge(c)} ${c.location}</span></div>
        <h3><a href="${href}">${c.name}</a></h3>
        <p>${c.short}</p>
        <div class="creator-tags">${(c.tags || []).map(tg => `<span>${tg}</span>`).join('')}</div>
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
        <a href="#crear"     data-route-link="crear">${es ? 'Crear' : 'Create'}</a>
        <a href="#guardados" data-route-link="guardados">${es ? 'Guardados' : 'Saved'}</a>`;
      if (dDrawer) dDrawer.innerHTML = `
        <a href="#feed">Feed</a><a href="#explorar">${es ? 'Explorar' : 'Explore'}</a>
        <a href="#mundo">${es ? 'Mundo Cultural' : 'Cultural World'}</a>
        <a href="#crear">${es ? 'Crear publicación' : 'Create post'}</a>
        <a href="#guardados">${es ? 'Guardados' : 'Saved'}</a><a href="#mi-perfil">${es ? 'Mi perfil' : 'My profile'}</a>`;
      if (dBottom) dBottom.innerHTML = `
        <a href="#feed"      data-route-link="feed"><span aria-hidden="true">⌂</span><small>Feed</small></a>
        <a href="#explorar"  data-route-link="explorar"><span aria-hidden="true">⌕</span><small>${es ? 'Explorar' : 'Explore'}</small></a>
        <a class="create-action" href="#crear" data-route-link="crear"><span aria-hidden="true">＋</span><small>${es ? 'Crear' : 'Create'}</small></a>
        <a href="#mundo"     data-route-link="mundo"><span aria-hidden="true">🌍</span><small>${es ? 'Mundo' : 'World'}</small></a>
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
        <div class="story-grid">${featured.map(c => `<a class="story-card" href="#perfil/${c.id}"><img src="${c.image}" alt="${c.name}" loading="lazy"><div class="story-card-content"><div class="meta">${verBadge(c)} ${c.category} · ${c.location}</div><h3>${c.name}</h3><p>${c.short}</p></div></a>`).join('')}</div>
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
      <img class="profile-cover" src="${c.cover}" alt="Portada de ${esc(c.name)}">
      <div class="profile-hero-content">
        <img class="profile-avatar" src="${c.image}" alt="${esc(c.name)}">
        <div class="profile-title">
          <p class="eyebrow">${c.type} · ${c.location}</p>
          <h1>${esc(c.name)} ${verBadge(c)}</h1>
          <p>${c.category} · ${Intl.NumberFormat('es').format(c.followers)} seguidores</p>
        </div>
        <div class="profile-actions">
          <button class="btn light" data-fuser="${c.id}">${isFollowing ? t('following') : t('follow')}</button>
          <button class="btn" style="border-color:rgba(255,255,255,.4);color:#fff;background:rgba(255,255,255,.1)" data-favorite="${c.id}">${isSaved ? t('saved') : t('save')}</button>
        </div>
      </div>
    </section>
    <section class="profile-layout">
      <div>
        
        <div class="profile-story">
          <p class="eyebrow">SU HISTORIA CULTURAL</p>
          <h2>Una puerta directa a su identidad</h2>
          <p>${c.story}</p>
          <div class="creator-tags">${c.tags.map(tg => `<span>${tg}</span>`).join('')}</div>
        </div>
        <div style="margin-top:60px">
          <p class="eyebrow">PUBLICACIONES (${cPosts.length || c.posts.length})</p>
          ${cPosts.length
            ? `<div id="creator-posts" style="margin-top:20px">${cPosts.map(postCard).join('')}</div>`
            : `<div class="posts-grid" style="margin-top:20px">${c.posts.map(p => `<article class="post-card"><div class="post-media"><img src="${p.image}" alt="${esc(p.title)}" loading="lazy"></div><div class="post-body"><h3 class="post-title">${esc(p.title)}</h3><p class="post-desc">${esc(p.text)}</p></div></article>`).join('')}</div>`}
        </div>
      </div>
      <aside class="profile-aside">
        <p class="eyebrow">PERFIL CULTURAL</p>
        <dl>
          <div><dt>Tipo</dt><dd>${c.type}</dd></div>
          <div><dt>Ubicación</dt><dd>${c.location}</dd></div>
          <div><dt>Verificación</dt><dd>${c.verified ? 'Verificado manualmente' : 'En proceso'}</dd></div>
        </dl>
        ${socialLinksHtml(c)}
        <p class="form-note" style="margin-top:20px">Origen Cultural no administra ventas ni se apropia de la historia del creador.</p>
      </aside>
    </section>
    ${footer()}`;
  }

  function claimProfileView(id) {
    const c = creators.find(x => x.id === id);
    if (!c) return '<section class="section"><div class="section-inner"><h2>Perfil no encontrado</h2><a href="#explorar" class="btn">Volver</a></div></section>';
    const user = me();
    if (!user) return `<div class="auth-page"><div class="auth-card"><a href="#inicio" class="auth-brand"><img src="assets/logo-lockup.svg" alt="Origen Cultural"></a><h2>Reclamar ${esc(c.name)}</h2><p class="auth-sub">Para proteger a las comunidades y evitar suplantaciones, primero debes iniciar sesión.</p><a class="btn" href="#login" style="width:100%;text-align:center">Iniciar sesión</a><p class="auth-alt"><a href="#registro">Crear cuenta ORIGEN</a></p></div></div>`;
    return `<section class="page-hero"><div class="section-inner"><p class="eyebrow">RECLAMACIÓN DE PERFIL</p><h1>¿Representas a ${esc(c.name)}?</h1><p class="lead">La gestión no se transfiere automáticamente. ORIGEN revisará que tengas autoridad para representar a esta persona, comunidad, negocio u organización.</p></div></section><section class="section"><div class="section-inner" style="max-width:820px"><form id="claim-form" class="form-grid" data-profile-ref="${c.id}"><div class="form-field"><label>Tu nombre completo *</label><input name="claimant_name" value="${esc(user.name || '')}" required></div><div class="form-field"><label>Cargo o relación *</label><input name="relationship_role" required placeholder="Fundadora, gerente, representante autorizado…"></div><div class="form-field"><label>Correo oficial *</label><input type="email" name="official_email" value="${esc(user.email || '')}" required></div><div class="form-field"><label>Web o red social oficial</label><input name="official_url" placeholder="https://"></div><div class="form-field full"><label>¿Cómo podemos verificar tu autoridad? *</label><textarea name="explanation" rows="4" required></textarea></div><div class="form-field full"><label><input type="checkbox" name="authority" required> Declaro que estoy autorizado/a para solicitar la gestión de este perfil.</label></div><div id="claim-status" class="form-field full" aria-live="polite"></div><div class="form-field full"><button class="btn" type="submit" style="width:100%">Enviar solicitud para revisión</button></div></form></div></section>${footer()}`;
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
        ? `<img class="profile-cover" src="${profile.cover}" alt="Portada">`
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
    const d = state.createData;
    const isProvider = user.accountType === 'creator';
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
              ? `<div class="post-media-preview">${d.media.map((src, i) => `<div class="preview-thumb"><img src="${src}" alt=""><button class="remove-media" data-rmidx="${i}" type="button">×</button></div>`).join('')}${d.type === 'carousel' ? `<button class="preview-add" id="add-more-media" type="button">＋</button>` : ''}</div>`
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
          <div class="form-field full">
            <button class="btn" type="submit" style="width:100%">Publicar →</button>
            <p class="form-note" style="margin-top:12px">Tu publicación se guardará en ORIGEN y quedará vinculada a tu cuenta.</p>
          </div>
        </form>
      </div>
      <div class="create-preview-wrap">
        <p class="eyebrow" style="margin-bottom:16px">VISTA PREVIA</p>
        ${d.title || hasMedia
          ? postCard({ id:'_prev', authorId: user.id, type: d.type, media: d.media || [], title: d.title || 'Título', description: d.description || '', category: d.category || '', contentPurpose: d.contentPurpose || 'education', territory: d.territory || '', tags: d.tags || [], timestamp: new Date().toISOString(), likes: 0 })
          : `<div style="padding:40px;text-align:center;border:1px dashed #ccc;color:#888"><p>La vista previa aparecerá aquí.</p></div>`}
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
          ${user.avatar ? `<img src="${user.avatar}" class="edit-avatar-preview" alt="Avatar">` : avatarEl(user, 'lg')}
          <input type="file" id="edit-avatar-input" accept="image/jpeg,image/png,image/webp" style="display:none">
          <button class="btn" type="button" onclick="document.getElementById('edit-avatar-input').click()">Cambiar foto</button>
        </div>
        <div class="upload-zone wide" id="edit-cover-zone">
          ${user.cover
            ? `<img src="${user.cover}" class="edit-cover-preview" alt="Portada">`
            : `<div class="upload-placeholder"><span>+</span><p>Foto de portada</p></div>`}
          <input type="file" id="edit-cover-input" accept="image/jpeg,image/png,image/webp" style="display:none">
          <button class="btn secondary" type="button" onclick="document.getElementById('edit-cover-input').click()">Cambiar portada</button>
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
          ${d.avatar ? `<img src="${d.avatar}" class="edit-avatar-preview" alt="${L('Foto de perfil','Profile photo')}">` : `<div class="upload-placeholder"><span aria-hidden="true">+</span><p>${L('Foto de perfil','Profile photo')}</p><small>${L('Opcional','Optional')}</small></div>`}
          <input type="file" id="reg-avatar-input" accept="image/jpeg,image/png,image/webp" style="display:none">
          <button class="btn" type="button" onclick="document.getElementById('reg-avatar-input').click()">${L('Subir foto de perfil','Upload profile photo')}</button>
        </div>
        <div class="upload-zone wide" id="reg-cover-zone">
          ${d.cover ? `<img src="${d.cover}" class="edit-cover-preview" alt="${L('Portada','Cover image')}">` : `<div class="upload-placeholder"><span aria-hidden="true">+</span><p>${L('Foto de portada','Cover image')}</p><small>${L('Opcional','Optional')}</small></div>`}
          <input type="file" id="reg-cover-input" accept="image/jpeg,image/png,image/webp" style="display:none">
          <button class="btn secondary" type="button" onclick="document.getElementById('reg-cover-input').click()">${L('Subir portada','Upload cover')}</button>
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
      <div class="section-head"><div><p class="eyebrow">ROADMAP</p><h2>De un piloto curado a una red global</h2></div><p>Primero perfiles excelentes. Después, funcionalidades sociales, monetización ética y expansión internacional.</p></div>
      <div class="impact-grid">
        <div class="impact-item"><strong>0</strong><span>Preparación, identidad y criterios de verificación</span></div>
        <div class="impact-item"><strong>1</strong><span>Piloto Ecuador con 20-50 Agentes Culturales</span></div>
        <div class="impact-item"><strong>2</strong><span>Red social: feed, publicar, seguir, guardar</span></div>
        <div class="impact-item"><strong>3+</strong><span>Monetización ética y expansión global</span></div>
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
        <article class="trust-card trust-contact"><p class="eyebrow">CONTACTO</p><h2>Ayuda, reportes y solicitudes</h2><p><a href="mailto:${esc(trust.contact)}">${esc(trust.contact)}</a></p></article>
      </div>
    </div></section>${footer()}`;
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
      btn.addEventListener('click', async () => {
        if (!isAuth()) {
          showToast('Inicia sesión para enviar un reporte.');
          go('login');
          return;
        }
        const reason = window.prompt('¿Cuál es el motivo del reporte? Describe el problema brevemente.');
        if (!reason || !reason.trim()) return;
        const details = window.prompt('Puedes añadir más contexto (opcional).') || '';
        try {
          await window.ORIGEN_API.report({
            target_type: 'post',
            target_id: btn.dataset.report,
            reason: reason.trim().slice(0, 500),
            details: details.trim().slice(0, 6000)
          });
          showToast('Reporte recibido. Gracias por ayudarnos a cuidar ORIGEN.');
        } catch (error) {
          showToast(error.message || 'No pudimos enviar el reporte.');
        }
      });
    });

    /* more (···) */
    document.querySelectorAll('[data-pmore]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid  = btn.dataset.pmore;
        const user = me();
        const post = allPosts().find(p => p.id === pid);
        if (user && post && post.authorId === user.id) {
          if (confirm('¿Eliminar esta publicación?')) {
            window.ORIGEN_API.deletePost(pid)
              .then(() => { showToast('Publicación eliminada.'); render(currentRoute(), false); })
              .catch(error => showToast(error.message || 'No pudimos eliminar la publicación.'));
          }
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
      if (submit) { submit.disabled = true; submit.textContent = 'Enviando…'; }
      try {
        const profileId = await culturalProfileId(form.dataset.profileRef);
        if (!profileId) throw new Error('No encontramos el perfil de referencia en la base de datos.');
        const fd = Object.fromEntries(new FormData(form));
        await window.ORIGEN_API.submitClaim({ cultural_profile_id: profileId, claimant_name: fd.claimant_name, relationship_role: fd.relationship_role, official_email: fd.official_email, official_url: fd.official_url, explanation: fd.explanation });
        if (status) status.textContent = 'Solicitud recibida. Estado: pendiente de revisión.';
        if (submit) submit.textContent = 'Solicitud enviada';
        showToast('Solicitud de reclamación enviada.');
      } catch (error) {
        if (status) status.textContent = error.message || 'No pudimos enviar la solicitud.';
        if (submit) { submit.disabled = false; submit.textContent = 'Enviar solicitud para revisión'; }
      }
    });
  }
  /* Login */
  function bindLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const { email, password } = Object.fromEntries(new FormData(form));
      const submit = form.querySelector('button[type="submit"]');
      if (submit) { submit.disabled = true; submit.textContent = state.lang === 'es' ? 'Entrando…' : 'Signing in…'; }
      try {
        await doLogin(email, password);
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
        if (submit) { submit.disabled = false; submit.textContent = state.lang === 'es' ? 'Entrar' : 'Sign in'; }
      }
    });
  }


  function bindRecoverPassword() {
    const form = document.getElementById('recover-form');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const email = new FormData(form).get('email');
      const status = document.getElementById('recover-status');
      try {
        await window.ORIGEN_API.resetPassword(email);
        if (status) status.textContent = state.lang === 'es' ? 'Revisa tu correo. Si existe una cuenta, recibirás un enlace de recuperación.' : 'Check your email. If an account exists, you will receive a recovery link.';
      } catch (error) {
        if (status) status.textContent = error.message || (state.lang === 'es' ? 'No pudimos enviar el enlace.' : 'We could not send the recovery link.');
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

  /* Register wizard */
  function bindRegister() {
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
        state.regData.avatarFile = file;
        state.regData.avatar = URL.createObjectURL(file);
        render('registro', false);
      });
    }
    const regCoverInput = document.getElementById('reg-cover-input');
    if (regCoverInput) {
      regCoverInput.addEventListener('change', async e => {
        const file = e.target.files[0]; if (!file) return;
        state.regData.coverFile = file;
        state.regData.cover = URL.createObjectURL(file);
        render('registro', false);
      });
    }

    /* back */
    const backBtn = document.getElementById('reg-back');
    if (backBtn) backBtn.addEventListener('click', () => { state.regStep--; render('registro', false); });

    /* next / submit */
    const nextBtn = document.getElementById('reg-next');
    if (!nextBtn) return;
    nextBtn.addEventListener('click', async () => {
      const step = state.regStep;
      const errEl = document.getElementById('reg-error');

      if (step === 1) {
        if (!state.regData.accountType) { if (errEl) { errEl.textContent = state.lang === 'es' ? 'Selecciona un tipo de cuenta.' : 'Select an account type.'; errEl.style.display = 'block'; } return; }
        if (errEl) errEl.style.display = 'none';
        state.regStep++; render('registro', false);
      } else if (step === 2) {
        const form = document.getElementById('reg-basic');
        if (!form || !form.reportValidity()) return;
        const fd = Object.fromEntries(new FormData(form));
        Object.assign(state.regData, fd);
        state.regStep++; render('registro', false);
      } else if (step === 3) {
        state.regStep++; render('registro', false);
      } else if (step === 4) {
        const form = document.getElementById('reg-story');
        if (form) {
          const fd = Object.fromEntries(new FormData(form));
          Object.assign(state.regData, fd);
          state.regData.services = fd.services ? fd.services.split(',').map(s => s.trim()).filter(Boolean) : [];
        }
        state.regStep++; render('registro', false);
      } else if (step === 5) {
        const form = document.getElementById('reg-social');
        if (!form || !form.reportValidity()) return;
        const fd = Object.fromEntries(new FormData(form));
        const links = {};
        ['instagram','facebook','tiktok','youtube','linkedin','whatsapp','email','web'].forEach(k => { if (fd[k]) links[k] = fd[k]; });
        state.regData.links = links;
        state.regData.acceptedLegal = fd.acceptedLegal === 'on';
        if (!state.regData.acceptedLegal) {
          if (errEl) { errEl.textContent = state.lang === 'es' ? 'Debes aceptar los documentos esenciales de ORIGEN para crear tu cuenta.' : 'You must accept ORIGEN’s essential documents to create your account.'; errEl.style.display = 'block'; }
          return;
        }
        nextBtn.disabled = true;
        nextBtn.textContent = state.lang === 'es' ? 'Creando cuenta…' : 'Creating account…';
        const result = await doRegister(state.regData);
        if (result.ok) {
          const requiresConfirmation = result.requiresEmailConfirmation;
          state.regStep = 1; state.regData = {};
          if (requiresConfirmation) {
            showToast(state.lang === 'es' ? 'Revisa tu correo para confirmar tu cuenta.' : 'Check your email to confirm your account.');
            go('login');
          } else {
            showToast(state.lang === 'es' ? '¡Bienvenida/o a ORIGEN Cultural!' : 'Welcome to ORIGEN Cultural!');
            updateShell(); go('feed');
          }
        } else {
          if (errEl) { errEl.textContent = result.error; errEl.style.display = 'block'; }
          nextBtn.disabled = false;
          nextBtn.textContent = state.lang === 'es' ? 'Crear mi perfil' : 'Create my profile';
        }
      }
    });
  }

  /* Create post */
  function bindCreatePost() {
    /* type buttons */
    document.querySelectorAll('[data-ctype]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.createData.type  = btn.dataset.ctype;
        state.createData.media = [];
        render('crear', false);
      });
    });

    /* media upload zone click */
    const mediaZone  = document.getElementById('post-media-zone');
    const mediaInput = document.getElementById('post-media-input');
    if (mediaZone && mediaInput) {
      mediaZone.addEventListener('click', e => {
        if (e.target.closest('[data-rmidx]') || e.target.closest('#add-more-media')) return;
        mediaInput.click();
      });
      mediaInput.addEventListener('change', async e => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        if (state.createData.type === 'video') {
          state.createData.files = [files[0]];
          state.createData.media = [URL.createObjectURL(files[0])];
        } else if (state.createData.type === 'carousel') {
          state.createData.files = [...(state.createData.files || []), ...files];
          state.createData.media = [...(state.createData.media || []), ...files.map(file => URL.createObjectURL(file))];
        } else {
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
        state.createData.media.splice(idx, 1);
        if (state.createData.files) state.createData.files.splice(idx, 1);
        render('crear', false);
      });
    });

    /* form inputs → update preview */
    const form = document.getElementById('create-form');
    if (!form) return;
    ['title','description','category','contentPurpose','territory','tags'].forEach(field => {
      const el = form.querySelector(`[name="${field}"]`);
      if (el) el.addEventListener('input', () => {
        state.createData[field] = field === 'tags'
          ? el.value.split(',').map(s => s.trim()).filter(Boolean)
          : el.value;
        // Throttle preview re-render
        clearTimeout(bindCreatePost._prev);
        bindCreatePost._prev = setTimeout(() => render('crear', false), 350);
      });
    });

    /* submit */
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const user = me(); if (!user) return;
      const fd = Object.fromEntries(new FormData(form));
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
      try {
        const uploaded = [];
        for (let i = 0; i < (state.createData.files || []).length; i++) {
          uploaded.push(await window.ORIGEN_API.upload('post-media', state.createData.files[i], `post-${i+1}`));
        }
        await window.ORIGEN_API.createPost({
          type: state.createData.type,
          media: uploaded,
          title: fd.title,
          description: fd.description,
          category: fd.category,
          contentPurpose: fd.contentPurpose,
          territory: fd.territory,
          tags: fd.tags ? fd.tags.split(',').map(s => s.trim()).filter(Boolean) : []
        });
        state.createData = { type: 'photo', media: [], files: [], tags: [], contentPurpose: 'education' };
        showToast('¡Publicación creada!');
        go('feed');
      } catch (error) {
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

    /* avatar upload */
    const avaInput = document.getElementById('edit-avatar-input');
    if (avaInput) avaInput.addEventListener('change', async e => {
      const file = e.target.files[0]; if (!file) return;
      state.editAvatar = file;
      const preview = URL.createObjectURL(file);
      const zone = document.getElementById('edit-avatar-zone');
      if (zone) zone.querySelector('img, .ava') && (zone.innerHTML = `<img src="${preview}" class="edit-avatar-preview" alt="Avatar"><input type="file" id="edit-avatar-input" accept="image/jpeg,image/png,image/webp" style="display:none"><button class="btn" type="button" onclick="document.getElementById('edit-avatar-input').click()">Cambiar foto</button>`);
    });

    /* cover upload */
    const covInput = document.getElementById('edit-cover-input');
    if (covInput) covInput.addEventListener('change', async e => {
      const file = e.target.files[0]; if (!file) return;
      state.editCover = file;
      const preview = URL.createObjectURL(file);
      const zone = document.getElementById('edit-cover-zone');
      if (zone) zone.innerHTML = `<img src="${preview}" class="edit-cover-preview" alt="Portada"><input type="file" id="edit-cover-input" accept="image/jpeg,image/png,image/webp" style="display:none"><button class="btn secondary" type="button" onclick="document.getElementById('edit-cover-input').click()">Cambiar portada</button>`;
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
      try {
        let avatar = user.avatar;
        let cover = user.cover;
        if (state.editAvatar instanceof File) avatar = await window.ORIGEN_API.upload('avatars', state.editAvatar, 'avatar');
        if (state.editCover instanceof File) cover = await window.ORIGEN_API.upload('covers', state.editCover, 'cover');
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
        });
        state.user = updated;
        state.editAvatar = null; state.editCover = null;
        showToast('¡Perfil actualizado!');
        go('mi-perfil');
      } catch (error) {
        showToast(error.message || 'No pudimos actualizar tu perfil.');
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

  function openDrawer()  { drawer.classList.add('open'); overlay.classList.add('open'); drawer.setAttribute('aria-hidden','false'); menuBtn.setAttribute('aria-expanded','true'); }
  function closeDrawer() { drawer.classList.remove('open'); overlay.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); menuBtn.setAttribute('aria-expanded','false'); }

  menuBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay)  overlay.addEventListener('click', closeDrawer);

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
      ...results.map(c => { const href = c._kind === 'user' ? `#usuario/${c.id}` : `#perfil/${c.id}`; return `<a class="search-result" href="${href}" onclick="document.getElementById('search-dialog').close()"><div class="ava ava-sm"><img src="${c.image || c.avatar || 'assets/logo-mark.svg'}" alt=""></div><div><h4>${esc(c.name)} ${verBadge(c)}</h4><p>${c.category} · ${c.location}</p></div><span class="link-arrow">Ver</span></a>`; }),
      ...resPosts.map(p => { const a = getProfile(p.authorId); return `<a class="search-result" href="#feed" onclick="document.getElementById('search-dialog').close();state.openComments.clear()"><div class="ava ava-sm ava-init">${p.type === 'text' ? 'T' : '◫'}</div><div><h4>${esc(p.title)}</h4><p>${a ? esc(a.name) : ''} · ${timeAgo(p.timestamp)}</p></div><span class="link-arrow">Ver</span></a>`; })
    ].join('') || `<div class="empty-state">${t('noResults')}</div>`;
  }

  /* ═══════════════════════════════════════════════════════════
     HASH CHANGE → RENDER
  ═══════════════════════════════════════════════════════════ */
  window.addEventListener('hashchange', () => {
    closeDrawer();
    render(currentRoute());
  });

  /* ═══════════════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════════════ */
  document.documentElement.lang = state.lang;

  async function initApp() {
    try {
      state.user = await window.ORIGEN_API?.restoreSession() || null;
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
    } catch (error) {
      console.error('[ORIGEN] Startup error:', error);
      state.user = null;
    } finally {
      state.authReady = true;
      render(currentRoute());
    }
  }

  window.addEventListener('origen-auth-change', async () => {
    try {
      state.user = await window.ORIGEN_API?.restoreSession() || null;
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
      updateShell();
    } catch (error) {
      console.error('[ORIGEN] Auth refresh error:', error);
    }
  });

  initDigitalWellbeing();
  initApp();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
  }

})();
