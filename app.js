(() => {
  const { creators, categories, impact } = window.ORIGEN_DATA;
  const app = document.getElementById('main-content');
  const toast = document.getElementById('toast');
  const searchDialog = document.getElementById('search-dialog');
  const state = {
    lang: localStorage.getItem('origen-lang') || 'es',
    favorites: new Set(JSON.parse(localStorage.getItem('origen-favorites') || '[]')),
    following: new Set(JSON.parse(localStorage.getItem('origen-following') || '[]')),
    activeCategory: 'Todos',
    query: ''
  };

  const copy = {
    es: {
      home: 'Inicio', explore: 'Explorar', passport: 'Pasaporte Cultural', impact: 'Impacto',
      tagline: 'Conectando al mundo con sus raíces culturales.',
      intro: 'La red social cultural global donde personas, comunidades, negocios y organizaciones muestran quiénes son, qué representan y qué ofrecen al mundo.',
      exploreCta: 'Explorar culturas', createCta: 'Crear Perfil Cultural',
      visible: 'Origen Cultural no vende cultura: hace visible a quienes la mantienen viva.',
      manifest: 'La cultura no es un producto más. Es identidad, memoria, conocimiento y futuro.',
      featured: 'Historias culturales destacadas', featuredBody: 'Descubre perfiles creados para presentar la cultura con contexto, belleza, dignidad y conexión directa.',
      seeAll: 'Ver todos', pilot: 'Piloto Ecuador · visión global',
      creatorsTitle: 'Cultura viva, contada por sus protagonistas', creatorsBody: 'Explora perfiles de personas, comunidades y negocios que preservan, practican, recrean y comparten cultura.',
      impactTitle: 'Construyendo una infraestructura cultural global', impactBody: 'El piloto valida perfiles, descubrimiento y contacto directo antes de escalar funcionalidades sociales y monetización ética.',
      joinTitle: 'Tu historia cultural merece ser encontrada.', joinBody: 'Crea una presencia digital premium, conserva el control de tu narrativa y conecta con exploradores y aliados alrededor del mundo.',
      follow: 'Seguir', following: 'Siguiendo', save: 'Guardar', saved: 'Guardado', profile: 'Ver perfil',
      searchPlaceholder: 'Busca por cultura, tradición, territorio o creador', noResults: 'No encontramos perfiles con esos criterios.',
      discover: 'Descubre culturas vivas', discoverSub: 'Busca por país, ciudad, categoría, tradición, oficio u oferta cultural.',
      passportTitle: 'Mi Pasaporte Cultural', passportSub: 'Una trayectoria personal de culturas descubiertas, perfiles guardados y aprendizajes compartidos.',
      creatorJoin: 'Creador Cultural', explorerJoin: 'Explorador Cultural', joinHeading: 'Empieza tu camino en Origen Cultural', joinIntro: 'Elige cómo deseas participar. Esta demostración guarda la información solo en tu navegador.',
      impactPage: 'Impacto con dignidad cultural', impactPageSub: 'Medimos crecimiento sin reducir la cultura a una transacción.',
    },
    en: {
      home: 'Home', explore: 'Explore', passport: 'Cultural Passport', impact: 'Impact',
      tagline: 'Connecting the world with its cultural roots.',
      intro: 'The global cultural social network where people, communities, businesses and organisations show who they are, what they represent and what they offer the world.',
      exploreCta: 'Explore cultures', createCta: 'Create Cultural Profile',
      visible: 'Origen Cultural does not sell culture: it makes visible those who keep it alive.',
      manifest: 'Culture is not just another product. It is identity, memory, knowledge and future.',
      featured: 'Featured cultural stories', featuredBody: 'Discover profiles designed to present culture with context, beauty, dignity and direct connection.',
      seeAll: 'View all', pilot: 'Ecuador pilot · global vision',
      creatorsTitle: 'Living culture, told by its protagonists', creatorsBody: 'Explore profiles of people, communities and businesses that preserve, practise, recreate and share culture.',
      impactTitle: 'Building global cultural infrastructure', impactBody: 'The pilot validates profiles, discovery and direct contact before scaling social features and ethical monetisation.',
      joinTitle: 'Your cultural story deserves to be found.', joinBody: 'Build a premium digital presence, keep control of your narrative and connect with explorers and allies around the world.',
      follow: 'Follow', following: 'Following', save: 'Save', saved: 'Saved', profile: 'View profile',
      searchPlaceholder: 'Search culture, tradition, territory or creator', noResults: 'No profiles match those criteria.',
      discover: 'Discover living cultures', discoverSub: 'Search by country, city, category, tradition, craft or cultural offering.',
      passportTitle: 'My Cultural Passport', passportSub: 'A personal journey of cultures discovered, profiles saved and learning shared.',
      creatorJoin: 'Cultural Creator', explorerJoin: 'Cultural Explorer', joinHeading: 'Start your journey in Origen Cultural', joinIntro: 'Choose how you want to participate. This demonstration stores information only in your browser.',
      impactPage: 'Impact with cultural dignity', impactPageSub: 'We measure growth without reducing culture to a transaction.',
    }
  };
  const t = key => copy[state.lang][key] || key;

  function saveState() {
    localStorage.setItem('origen-favorites', JSON.stringify([...state.favorites]));
    localStorage.setItem('origen-following', JSON.stringify([...state.following]));
  }
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }
  function verifiedBadge(c) { return c.verified ? '<span class="verified" title="Verificación Cultural">✓</span>' : ''; }
  function creatorCard(c) {
    const saved = state.favorites.has(c.id);
    return `<article class="creator-card">
      <div class="creator-card-image">
        <a href="#perfil/${c.id}" aria-label="${t('profile')}: ${c.name}"><img src="${c.image}" alt="${c.name}: ${c.category}" loading="lazy"></a>
        <button class="favorite-button ${saved ? 'active' : ''}" data-favorite="${c.id}" aria-label="${saved ? t('saved') : t('save')} ${c.name}" aria-pressed="${saved}">${saved ? '◆' : '◇'}</button>
      </div>
      <div class="creator-card-body">
        <div class="creator-meta"><span>${c.type}</span><span>${verifiedBadge(c)} ${c.location}</span></div>
        <h3><a href="#perfil/${c.id}">${c.name}</a></h3>
        <p>${c.short}</p>
        <div class="creator-tags">${c.tags.map(tag => `<span>${tag}</span>`).join('')}</div>
        <div class="creator-card-footer"><span>${Intl.NumberFormat(state.lang === 'es' ? 'es' : 'en').format(c.followers)} seguidores</span><a class="link-arrow" href="#perfil/${c.id}">${t('profile')}</a></div>
      </div>
    </article>`;
  }
  function footer() {
    return `<footer class="footer"><div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand"><img src="assets/logo-lockup.svg" alt="Origen Cultural"><p>${t('tagline')}<br><br>Una red social cultural para descubrir, seguir y valorar culturas vivas.</p></div>
        <div><h4>Explorar</h4><div class="footer-links"><a href="#explorar">Perfiles culturales</a><a href="#inicio">Historias</a><a href="#pasaporte">Pasaporte Cultural</a></div></div>
        <div><h4>Proyecto</h4><div class="footer-links"><a href="#impacto">Impacto</a><a href="#unirse">Unirse</a><a href="mailto:info.origencultural@gmail.com">Contacto</a></div></div>
        <div><h4>Social</h4><div class="footer-links"><a href="https://www.instagram.com/origen.cultural" target="_blank" rel="noreferrer">Instagram</a><a href="#">Facebook</a><a href="#">TikTok</a></div></div>
      </div>
      <div class="footer-bottom"><span>© 2026 Origen Cultural. Todos los derechos reservados.</span><span>Diseñado con dignidad cultural · Piloto Ecuador · Visión global</span></div>
    </div></footer>`;
  }
  function homeView() {
    const featured = creators.slice(0,5);
    return `<section class="hero">
      <div class="hero-copy"><p class="eyebrow">RED SOCIAL CULTURAL GLOBAL</p><h1>ORIGEN <span>CULTURAL</span></h1><p class="lead">${t('intro')}</p><div class="hero-actions"><a class="btn light" href="#explorar">${t('exploreCta')}</a><a class="btn secondary" style="border-color:#fff;color:#fff" href="#unirse">${t('createCta')}</a></div></div>
      <div class="hero-media"><img src="assets/images/embroidery.jpg" alt="Mujer bordando una pieza cultural"><div class="hero-caption">${t('pilot')}<br><strong>${t('visible')}</strong></div></div>
    </section>
    <section class="section manifesto"><div class="section-inner manifesto-grid"><p class="eyebrow">DECLARACIÓN FUNDACIONAL</p><div><p class="manifesto-quote">${t('manifest').replace('identidad, memoria, conocimiento y futuro', '<em>identidad, memoria, conocimiento y futuro</em>').replace('identity, memory, knowledge and future', '<em>identity, memory, knowledge and future</em>')}</p><p class="manifesto-copy">Origen Cultural nace para que la cultura se muestre con el valor que merece: con contexto, autonomía, belleza, pertenencia y proyección global.</p></div></div></section>
    <section class="section"><div class="section-inner"><div class="section-head"><div><p class="eyebrow">CURADURÍA CULTURAL</p><h2>${t('featured')}</h2></div><div><p>${t('featuredBody')}</p><a class="link-arrow" href="#explorar">${t('seeAll')}</a></div></div>
      <div class="story-grid">${featured.map(c => `<a class="story-card" href="#perfil/${c.id}"><img src="${c.image}" alt="${c.name}" loading="lazy"><div class="story-card-content"><div class="meta">${verifiedBadge(c)} ${c.category} · ${c.location}</div><h3>${c.name}</h3><p>${c.short}</p></div></a>`).join('')}</div>
    </div></section>
    <section class="section" style="background:var(--grey-2)"><div class="section-inner"><div class="section-head"><div><p class="eyebrow">EXPLORAR</p><h2>${t('creatorsTitle')}</h2></div><p>${t('creatorsBody')}</p></div><div class="creator-grid">${creators.slice(0,3).map(creatorCard).join('')}</div></div></section>
    <section class="section impact-band"><div class="section-inner"><div class="section-head"><div><p class="eyebrow">MVP · PILOTO ECUADOR</p><h2>${t('impactTitle')}</h2></div><p>${t('impactBody')}</p></div><div class="impact-grid">${impact.map(i => `<div class="impact-item"><strong>${i.value}</strong><span>${i.label}</span></div>`).join('')}</div></div></section>
    <section class="cta-panel"><img src="assets/images/mural.jpg" alt="Mural cultural comunitario"><div class="cta-content"><p class="eyebrow">CREADORES CULTURALES</p><h2>${t('joinTitle')}</h2><p>${t('joinBody')}</p><a class="btn light" href="#unirse">${t('createCta')}</a></div></section>${footer()}`;
  }
  function exploreView() {
    return `<section class="page-hero"><div class="section-inner"><p class="eyebrow">DIRECTORIO CULTURAL</p><h1>${t('discover')}</h1><p class="lead">${t('discoverSub')}</p></div></section>
    <section class="section"><div class="section-inner"><div class="search-toolbar"><input id="explore-search" class="search-input" type="search" placeholder="${t('searchPlaceholder')}" value="${state.query}"><button class="btn" id="clear-filters">Limpiar filtros</button></div><div class="category-strip" aria-label="Categorías">${categories.map(cat => `<button class="chip ${state.activeCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}</button>`).join('')}</div><div id="explore-grid" class="creator-grid"></div></div></section>${footer()}`;
  }
  function renderExploreResults() {
    const grid = document.getElementById('explore-grid'); if (!grid) return;
    const q = state.query.toLowerCase().trim();
    const filtered = creators.filter(c => {
      const categoryMatch = state.activeCategory === 'Todos' || c.category.toLowerCase().includes(state.activeCategory.toLowerCase().replace('artesanía','artesanía')) || c.tags.some(t => t.toLowerCase().includes(state.activeCategory.toLowerCase()));
      const queryMatch = !q || [c.name,c.type,c.category,c.location,c.short,...c.tags].join(' ').toLowerCase().includes(q);
      return categoryMatch && queryMatch;
    });
    grid.innerHTML = filtered.length ? filtered.map(creatorCard).join('') : `<div class="empty-state"><h3>${t('noResults')}</h3><p>Prueba con otra categoría o palabra clave.</p></div>`;
    bindFavoriteButtons();
  }
  function profileView(id) {
    const c = creators.find(x => x.id === id) || creators[0];
    const following = state.following.has(c.id);
    return `<section class="profile-hero"><img class="profile-cover" src="${c.cover}" alt="Territorio de ${c.name}"><div class="profile-hero-content"><img class="profile-avatar" src="${c.image}" alt="Perfil de ${c.name}"><div class="profile-title"><p class="eyebrow">${c.type} · ${c.location}</p><h1>${c.name} ${verifiedBadge(c)}</h1><p>${c.category} · ${Intl.NumberFormat().format(c.followers)} seguidores</p></div><div class="profile-actions"><button class="btn light" data-follow="${c.id}">${following ? t('following') : t('follow')}</button><button class="btn secondary" style="border-color:#fff;color:#fff" data-favorite="${c.id}">${state.favorites.has(c.id) ? t('saved') : t('save')}</button></div></div></section>
    <section class="profile-layout"><div><div class="profile-story"><p class="eyebrow">SU HISTORIA CULTURAL</p><h2>Una puerta directa a su identidad</h2><p>${c.story}</p><div class="creator-tags">${c.tags.map(tag => `<span>${tag}</span>`).join('')}</div></div><div style="margin-top:70px"><p class="eyebrow">PUBLICACIONES</p><h2>Historias compartidas</h2><div class="posts-grid">${c.posts.map(p => `<article class="post-card"><img src="${p.image}" alt="${p.title}"><div class="post-card-body"><h3>${p.title}</h3><p>${p.text}</p><a class="link-arrow" href="#perfil/${c.id}">Leer historia</a></div></article>`).join('')}</div></div></div>
      <aside class="profile-aside"><p class="eyebrow">PERFIL CULTURAL</p><dl><div><dt>Tipo</dt><dd>${c.type}</dd></div><div><dt>Ubicación</dt><dd>${c.location}</dd></div><div><dt>Verificación cultural</dt><dd>${c.verified ? 'Perfil verificado manualmente' : 'Verificación en proceso'}</dd></div><div><dt>Contacto</dt><dd>Conexión directa mediante canales propios.</dd></div></dl><div class="external-links">${Object.entries(c.links).map(([k,v]) => `<a href="${v}" target="_blank" rel="noreferrer"><span>${k}</span><span>↗</span></a>`).join('')}</div><p class="form-note" style="margin-top:20px">Origen Cultural no administra la venta ni se apropia de la historia del creador. El perfil conserva su autonomía narrativa y comercial.</p></aside></section>${footer()}`;
  }
  function passportView() {
    return `<section class="passport-page"><div class="passport-shell"><div class="section-head"><div><p class="eyebrow">TRAYECTORIA INTERCULTURAL</p><h1 style="font-size:clamp(48px,7vw,92px)">${t('passportTitle')}</h1></div><p>${t('passportSub')}</p></div><article class="passport-card"><div class="passport-head"><img class="passport-logo" src="assets/logo-lockup.svg" alt="Origen Cultural"><div class="passport-id">PASAPORTE CULTURAL<br>OC-EC-0001</div></div><div class="passport-person"><div class="avatar">AB</div><div><p class="eyebrow">EXPLORADORA CULTURAL</p><h2>Anabel Borja</h2><p>Brisbane, Australia · Origen: Ecuador</p></div></div><div class="passport-progress"><div class="progress-stat"><strong>${state.favorites.size}</strong><span>Perfiles guardados</span></div><div class="progress-stat"><strong>${state.following.size}</strong><span>Creadores seguidos</span></div><div class="progress-stat"><strong>01</strong><span>Cultura explorada</span></div></div></article><div class="level-section"><p class="eyebrow">NIVEL CULTURAL</p><h2>Semilla · Nivel 1</h2><div class="level-track"><div class="level-fill"></div></div><p>34% para alcanzar el nivel Caminante Cultural.</p><div class="badges"><div class="badge"><div class="badge-mark"><span>⌖</span></div><h3>Primer territorio</h3><p>Descubriste tu primer perfil cultural de Ecuador.</p></div><div class="badge"><div class="badge-mark"><span>◇</span></div><h3>Memoria guardada</h3><p>Guarda tres perfiles para desbloquear esta insignia.</p></div><div class="badge"><div class="badge-mark"><span>◎</span></div><h3>Conexión viva</h3><p>Sigue a cinco Creadores Culturales para desbloquearla.</p></div></div></div></div></section>${footer()}`;
  }
  function joinView() {
    return `<section class="page-hero"><div class="section-inner"><p class="eyebrow">UNIRSE AL ECOSISTEMA</p><h1>${t('joinHeading')}</h1><p class="lead">${t('joinIntro')}</p></div></section><section class="join-layout"><div><p class="eyebrow">DOS RUTAS · UNA RED</p><h2>¿Cómo quieres participar?</h2><p class="lead" style="font-size:17px">Como Creador Cultural puedes construir un perfil premium. Como Explorador Cultural puedes descubrir, seguir y guardar culturas vivas.</p><div class="values-grid" style="grid-template-columns:1fr"><div class="value-card"><span class="number">01</span><h3>Dignidad cultural</h3><p>Tu historia mantiene contexto, consentimiento y control.</p></div><div class="value-card"><span class="number">02</span><h3>Conexión directa</h3><p>La plataforma dirige a tus propios canales, sin comisión inicial.</p></div></div></div><form id="join-form"><div class="role-options"><label class="role-option"><input type="radio" name="role" value="creator" checked> <strong>${t('creatorJoin')}</strong><p>Persona, comunidad, negocio u organización.</p></label><label class="role-option"><input type="radio" name="role" value="explorer"> <strong>${t('explorerJoin')}</strong><p>Persona interesada en descubrir y aprender.</p></label></div><div class="form-grid" style="margin-top:24px"><div class="form-field"><label for="name">Nombre</label><input id="name" name="name" required autocomplete="name"></div><div class="form-field"><label for="email">Correo</label><input id="email" name="email" type="email" required autocomplete="email"></div><div class="form-field"><label for="country">País</label><input id="country" name="country" required></div><div class="form-field"><label for="category">Categoría cultural</label><select id="category" name="category"><option>Artesanía y tradiciones</option><option>Gastronomía</option><option>Música y danza</option><option>Territorio y patrimonio</option><option>Educación cultural</option><option>Otra</option></select></div><div class="form-field full"><label for="story">Cuéntanos brevemente tu historia cultural</label><textarea id="story" name="story" placeholder="¿Quién eres, qué representas y qué deseas compartir con el mundo?"></textarea></div><div class="form-field full"><label><input type="checkbox" required> Confirmo que tengo derecho y consentimiento para compartir esta información cultural.</label></div><div class="form-field full"><button class="btn" type="submit">Enviar solicitud de perfil</button><p class="form-note">Prototipo: la solicitud se guarda localmente para demostrar el flujo. La versión productiva se conectará a Supabase y a un proceso de revisión manual.</p></div></div></form></section>${footer()}`;
  }
  function impactView() {
    const values = [
      ['Dignidad cultural','La cultura se presenta con respeto, contexto y valor, no como espectáculo vacío.'],
      ['Autenticidad','La voz y la historia de cada Creador Cultural permanecen como eje central.'],
      ['Autonomía','Cada perfil conserva sus canales, decisiones, historia e identidad.'],
      ['Conexión global','La plataforma conecta culturas con públicos, aliados y oportunidades internacionales.'],
      ['Innovación ética','La tecnología apoya claridad y alcance sin inventar tradiciones.'],
      ['Soberanía narrativa','Cada creador decide qué mostrar, qué reservar y cómo ser contactado.']
    ];
    return `<section class="page-hero" style="background:var(--black);color:var(--white)"><div class="section-inner"><p class="eyebrow">PROPÓSITO · ÉTICA · ESCALA</p><h1>${t('impactPage')}</h1><p class="lead" style="color:#ccc">${t('impactPageSub')}</p></div></section><section class="section"><div class="section-inner"><div class="section-head"><div><p class="eyebrow">VALORES DE MARCA</p><h2>La cultura con el valor que merece</h2></div><p>Origen Cultural prioriza consentimiento, representación autónoma, contexto y conexión humana. La tecnología facilita el encuentro; no sustituye la voz cultural.</p></div><div class="values-grid">${values.map((v,i)=>`<article class="value-card"><span class="number">0${i+1}</span><h3>${v[0]}</h3><p>${v[1]}</p></article>`).join('')}</div></div></section><section class="section impact-band"><div class="section-inner"><div class="section-head"><div><p class="eyebrow">ROADMAP</p><h2>De un piloto curado a una red global</h2></div><p>Primero perfiles excelentes. Después, demanda real, funcionalidades sociales, monetización ética y expansión internacional.</p></div><div class="impact-grid"><div class="impact-item"><strong>0</strong><span>Preparación, identidad, formularios y criterios de verificación</span></div><div class="impact-item"><strong>1</strong><span>Piloto Ecuador con 20-50 Creadores Culturales</span></div><div class="impact-item"><strong>2</strong><span>MVP social: explorar, seguir, guardar y publicar</span></div><div class="impact-item"><strong>3+</strong><span>Monetización ética y expansión global</span></div></div></div></section>${footer()}`;
  }
  function demoUserProfile() {
    return `<section class="page-hero"><div class="section-inner"><p class="eyebrow">MI PERFIL CULTURAL</p><h1>Anabel Borja</h1><p class="lead">Exploradora Cultural · Ecuador → Australia · Fundadora de Origen Cultural</p></div></section><section class="profile-layout"><div><p class="eyebrow">IDENTIDAD CULTURAL</p><h2>Conectar culturas desde la comunicación</h2><p class="lead">Este perfil de demostración representa la ruta del Explorador Cultural. Reúne descubrimientos, perfiles guardados, conexiones y aprendizaje progresivo.</p><div class="creator-grid" style="grid-template-columns:repeat(2,1fr)">${creators.filter(c=>state.favorites.has(c.id)).map(creatorCard).join('') || '<div class="empty-state"><h3>Aún no tienes perfiles guardados</h3><p>Explora la red y guarda las historias que quieras volver a visitar.</p><a class="btn" href="#explorar">Explorar perfiles</a></div>'}</div></div><aside class="profile-aside"><p class="eyebrow">RESUMEN</p><dl><div><dt>Origen</dt><dd>Quito, Ecuador</dd></div><div><dt>Ubicación actual</dt><dd>Brisbane, Australia</dd></div><div><dt>Perfiles guardados</dt><dd>${state.favorites.size}</dd></div><div><dt>Creadores seguidos</dt><dd>${state.following.size}</dd></div></dl><div class="external-links"><a href="#pasaporte"><span>Mi Pasaporte Cultural</span><span>→</span></a><a href="#explorar"><span>Explorar culturas</span><span>→</span></a></div></aside></section>${footer()}`;
  }
  function bindFavoriteButtons() {
    document.querySelectorAll('[data-favorite]').forEach(btn => btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const id = btn.dataset.favorite;
      state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
      saveState(); showToast(state.favorites.has(id) ? 'Perfil guardado en tu Pasaporte Cultural' : 'Perfil eliminado de guardados');
      const route = currentRoute(); render(route, false);
    }));
  }
  function bindCommon() {
    bindFavoriteButtons();
    document.querySelectorAll('[data-follow]').forEach(btn => btn.addEventListener('click', () => {
      const id = btn.dataset.follow;
      state.following.has(id) ? state.following.delete(id) : state.following.add(id);
      saveState(); showToast(state.following.has(id) ? 'Ahora sigues este Perfil Cultural' : 'Dejaste de seguir este perfil');
      render(currentRoute(), false);
    }));
    const form = document.getElementById('join-form');
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      const entry = Object.fromEntries(new FormData(form));
      localStorage.setItem('origen-demo-application', JSON.stringify(entry));
      form.reset(); showToast('Solicitud guardada. Bienvenida/o a Origen Cultural.');
    });
  }
  function currentRoute() { return location.hash.replace(/^#\/?/, '') || 'inicio'; }
  function updateActive(route) {
    const base = route.startsWith('perfil/') ? 'explorar' : route;
    document.querySelectorAll('[data-route-link]').forEach(a => a.classList.toggle('active', a.dataset.routeLink === base));
  }
  function render(route = currentRoute(), scroll = true) {
    if (route === 'inicio') app.innerHTML = homeView();
    else if (route === 'explorar') app.innerHTML = exploreView();
    else if (route.startsWith('perfil/')) app.innerHTML = profileView(route.split('/')[1]);
    else if (route === 'pasaporte') app.innerHTML = passportView();
    else if (route === 'unirse') app.innerHTML = joinView();
    else if (route === 'impacto') app.innerHTML = impactView();
    else if (route === 'perfil-anabel') app.innerHTML = demoUserProfile();
    else app.innerHTML = homeView();
    updateActive(route); bindCommon();
    if (route === 'explorar') {
      renderExploreResults();
      document.getElementById('explore-search').addEventListener('input', e => { state.query = e.target.value; renderExploreResults(); });
      document.querySelectorAll('[data-category]').forEach(btn => btn.addEventListener('click', () => { state.activeCategory = btn.dataset.category; document.querySelectorAll('[data-category]').forEach(b=>b.classList.toggle('active',b===btn)); renderExploreResults(); }));
      document.getElementById('clear-filters').addEventListener('click', () => { state.query=''; state.activeCategory='Todos'; render('explorar',false); });
    }
    if (scroll) window.scrollTo({top:0, behavior:'instant'});
  }

  // Navigation and shell interactions
  window.addEventListener('hashchange', () => { closeDrawer(); render(); });
  document.getElementById('language-toggle').addEventListener('click', () => {
    state.lang = state.lang === 'es' ? 'en' : 'es'; localStorage.setItem('origen-lang', state.lang);
    document.getElementById('language-toggle').textContent = state.lang === 'es' ? 'EN' : 'ES';
    document.documentElement.lang = state.lang; render(currentRoute(), false); showToast(state.lang === 'es' ? 'Idioma cambiado a español' : 'Language changed to English');
  });
  document.getElementById('profile-button').addEventListener('click', () => location.hash = '#perfil-anabel');
  const drawer = document.getElementById('mobile-drawer'); const overlay = document.getElementById('drawer-overlay'); const menuBtn = document.getElementById('menu-button');
  function openDrawer(){ drawer.classList.add('open'); overlay.classList.add('open'); drawer.setAttribute('aria-hidden','false'); menuBtn.setAttribute('aria-expanded','true'); }
  function closeDrawer(){ drawer.classList.remove('open'); overlay.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); menuBtn.setAttribute('aria-expanded','false'); }
  menuBtn.addEventListener('click', openDrawer); document.getElementById('close-menu').addEventListener('click', closeDrawer); overlay.addEventListener('click', closeDrawer);
  document.getElementById('search-button').addEventListener('click', () => { searchDialog.showModal(); setTimeout(()=>document.getElementById('global-search').focus(),40); populateSearch(''); });
  const globalSearch = document.getElementById('global-search'); globalSearch.addEventListener('input', e => populateSearch(e.target.value));
  function populateSearch(query) {
    const q=query.toLowerCase().trim(); const results=creators.filter(c=>!q||[c.name,c.category,c.location,c.short,...c.tags].join(' ').toLowerCase().includes(q));
    document.getElementById('search-results').innerHTML=results.map(c=>`<a class="search-result" href="#perfil/${c.id}" onclick="document.getElementById('search-dialog').close()"><img src="${c.image}" alt=""><div><h4>${c.name} ${verifiedBadge(c)}</h4><p>${c.category} · ${c.location}</p></div><span class="link-arrow">Ver</span></a>`).join('') || `<div class="empty-state">${t('noResults')}</div>`;
  }
  document.getElementById('language-toggle').textContent = state.lang === 'es' ? 'EN' : 'ES';
  document.documentElement.lang = state.lang;
  render();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(()=>{}));
})();
