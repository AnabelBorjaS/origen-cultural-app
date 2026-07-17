// ═══════════════════════════════════════════════════════════════
//  ORIGEN Cultural — Globo Cultural
//  globe.gl (carga dinámica) + fallback CSS para bajo rendimiento
// ═══════════════════════════════════════════════════════════════
window.MundoCultural = (() => {
  'use strict';

  /* ── BASE DE DATOS CULTURAL ─────────────────────────────────── */
  const CULTURAL_DB = {
    ecuador: {
      key: 'ecuador', flag: '🇪🇨',
      name: 'Ecuador', continent: 'América del Sur',
      capital: 'Quito', population: '18 millones',
      languages: ['Español', 'Kichwa', 'Shuar', 'Achuar'],
      traditions: ['Inti Raymi — Fiesta del Sol', 'Carnaval de Guaranda', 'Fiesta del Yamor', 'Pase del Niño Viajero'],
      gastronomy: ['Ceviche de camarón', 'Llapingachos', 'Cuy asado', 'Fanesca', 'Hornado pastuzo', 'Colada morada'],
      music: ['Pasillo', 'Sanjuanito', 'Tonada', 'Pasacalle', 'Albazo'],
      celebrations: ['Inti Raymi (junio)', 'Carnaval (febrero)', 'Día de los Difuntos (noviembre)', 'Fundación de Quito (agosto)'],
      crafts: ['Bordado a mano de Yaruquí', 'Sombrero de paja toquilla', 'Cerámica de Cotacachi', 'Tejido de totora', 'Shigra'],
      curiosities: [
        'Primer país del mundo en reconocer los Derechos de la Naturaleza en su Constitución (2008).',
        'Posee 4 mundos naturales: Costa, Sierra, Amazonía y las Islas Galápagos.',
        'El famoso «sombrero Panamá» es en realidad originario de Montecristi, Ecuador.',
        'La Mitad del Mundo: el país toma su nombre por la línea ecuatorial que lo atraviesa.'
      ],
      lat: -1.83, lng: -78.18, altitude: 1.8,
      creatorIds: ['pakarina', 'chawar', 'aji-de-piedra', 'yaruqui-vivo', 'danza-andina'],
      geoNames: ['Ecuador']
    },
    australia: {
      key: 'australia', flag: '🇦🇺',
      name: 'Australia', continent: 'Oceanía',
      capital: 'Canberra', population: '26 millones',
      languages: ['Inglés (oficial)', 'Yolŋu Matha', 'Warlpiri', '+250 lenguas aborígenes'],
      traditions: ['Corroboree (ceremonias aborígenes)', 'ANZAC Day', 'Australia Day', 'Naidoc Week'],
      gastronomy: ['Vegemite', 'Tim Tam', 'Meat pie', 'Pavlova', 'Barramundi a la parrilla', 'Lamington'],
      music: ['Didgeridoo (yidaki)', 'Rock australiano', 'Música country', 'Música de los Pueblos del Desierto'],
      celebrations: ['Australia Day (enero)', 'ANZAC Day (abril)', 'Melbourne Cup (noviembre)', 'Sydney New Year'],
      crafts: ['Arte puntillista aborigen', 'Dot painting', 'Boomerang artesanal', 'Cestería de Pueblos Originarios'],
      curiosities: [
        'Los pueblos aborígenes australianos tienen la cultura continua más antigua del mundo: más de 65.000 años.',
        'Uluru (Ayers Rock) es uno de los lugares más sagrados del mundo para los Anangu.',
        'Australia tiene más especies animales únicas que cualquier otro continente.',
        'El didgeridoo es el instrumento de viento continuo más antiguo del mundo.'
      ],
      lat: -25.27, lng: 133.77, altitude: 1.8,
      creatorIds: [],
      geoNames: ['Australia']
    },
    peru: {
      key: 'peru', flag: '🇵🇪',
      name: 'Perú', continent: 'América del Sur',
      capital: 'Lima', population: '33 millones',
      languages: ['Español', 'Quechua', 'Aimara'],
      traditions: ['Inti Raymi en Cusco', 'Fiesta de la Candelaria en Puno (UNESCO)', 'Semana Santa de Ayacucho', 'Corpus Christi cusqueño'],
      gastronomy: ['Ceviche (Patrimonio UNESCO)', 'Lomo saltado', 'Ají de gallina', 'Cuy al horno', 'Chicha morada', 'Papa a la Huancaína'],
      music: ['Marinera norteña', 'Huayno andino', 'Vals peruano', 'Festejo afroperuano', 'Landó'],
      celebrations: ['Inti Raymi (junio)', 'Candelaria de Puno (febrero)', 'Corpus Christi (junio)', 'Fiestas Patrias (julio)'],
      crafts: ['Textiles andinos de alpaca', 'Retablos ayacuchanos', 'Cerámica de Quinua', 'Mates burilados de Huancayo', 'Tapices de Sarhua'],
      curiosities: [
        'Machu Picchu fue construida en el siglo XV por el Imperio Inca y es Maravilla del Mundo Moderno.',
        'El Perú tiene la mayor biodiversidad de papa del mundo: más de 3.000 variedades.',
        'El ceviche peruano está reconocido como Patrimonio Cultural de la Nación.',
        'La Amazonía peruana alberga el 13% de todos los bosques tropicales del planeta.'
      ],
      lat: -9.19, lng: -75.02, altitude: 1.8,
      creatorIds: [],
      geoNames: ['Peru', 'Perú']
    },
    bolivia: {
      key: 'bolivia', flag: '🇧🇴',
      name: 'Bolivia', continent: 'América del Sur',
      capital: 'Sucre (constitucional) / La Paz (sede de gobierno)', population: '12 millones',
      languages: ['Español', 'Quechua', 'Aimara', '+33 lenguas indígenas (todas co-oficiales)'],
      traditions: ['Carnaval de Oruro (Patrimonio UNESCO)', 'Tinku (ritual de encuentro)', 'Alasitas (miniaturas del Ekeko)', 'Gran Poder de La Paz'],
      gastronomy: ['Salteña', 'Silpancho', 'Pique macho', 'Sopa de maní', 'Api morado', 'Thimpu'],
      music: ['Saya afraboliviana', 'Cueca boliviana', 'Taquirari', 'Morenada', 'Caporales'],
      celebrations: ['Carnaval de Oruro (febrero)', 'Alasitas (enero)', 'Gran Poder (junio)', 'Día de los Muertos (noviembre)'],
      crafts: ['Tejidos de los Jalq\'a', 'Máscaras del Carnaval de Oruro', 'Cerámica de Tiwanaku', 'Sombreros bombín', 'Aguayos'],
      curiosities: [
        'Bolivia reconoce 36 idiomas oficiales en su Constitución, más que cualquier otro país del mundo.',
        'El Salar de Uyuni es el espejo natural más grande del planeta: 10.000 km² de sal.',
        'La Paz es la capital administrativa más alta del mundo, a 3.640 metros sobre el nivel del mar.',
        'El Carnaval de Oruro es considerado «Obra Maestra del Patrimonio Oral» por la UNESCO.'
      ],
      lat: -16.5, lng: -64.5, altitude: 1.8,
      creatorIds: [],
      geoNames: ['Bolivia']
    },
    mexico: {
      key: 'mexico', flag: '🇲🇽',
      name: 'México', continent: 'América del Norte',
      capital: 'Ciudad de México', population: '130 millones',
      languages: ['Español', 'Náhuatl', 'Maya yucateco', 'Zapoteco', 'Mixteco', '+64 lenguas indígenas'],
      traditions: ['Día de los Muertos (UNESCO)', 'Guelaguetza de Oaxaca', 'Día de la Virgen de Guadalupe', 'Posadas navideñas'],
      gastronomy: ['Tacos', 'Mole negro', 'Tamales', 'Pozole', 'Chiles en nogada', 'Mezcal', 'Chocolate'],
      music: ['Mariachi (Patrimonio UNESCO)', 'Son jarocho', 'Cumbia', 'Corridos', 'Marimba chiapaneca'],
      celebrations: ['Día de los Muertos (nov)', 'Guelaguetza (julio)', 'Independencia (sept)', 'Día de los Reyes (enero)'],
      crafts: ['Talavera de Puebla (UNESCO)', 'Alebrijes de Oaxaca', 'Huipil bordado', 'Barro negro de San Bartolo', 'Arte huichol'],
      curiosities: [
        'México tiene 35 sitios declarados Patrimonio de la Humanidad por la UNESCO.',
        'El chocolate, el aguacate, el tomate, el maíz y el cacao son originarios de México.',
        'La Catrina, símbolo del Día de los Muertos, fue creada por el grabador José Guadalupe Posada.',
        'Teotihuacán significa «El lugar donde los hombres se convierten en dioses» en náhuatl.'
      ],
      lat: 23.63, lng: -102.55, altitude: 1.8,
      creatorIds: [],
      geoNames: ['Mexico', 'México']
    },
    japan: {
      key: 'japan', flag: '🇯🇵',
      name: 'Japón', continent: 'Asia',
      capital: 'Tokio', population: '125 millones',
      languages: ['Japonés', 'Ainu (lengua indígena en Hokkaido)'],
      traditions: ['Hanami (contemplar los cerezos)', 'Matsuri (festivales locales)', 'Obon (festival de ancestros)', 'Shichi-Go-San'],
      gastronomy: ['Sushi', 'Ramen', 'Tempura', 'Matcha', 'Wagyu', 'Sake', 'Mochi'],
      music: ['Gagaku (música cortesana imperial)', 'Koto (cítara de 13 cuerdas)', 'Shamisen', 'Taiko (tambor)', 'J-Pop'],
      celebrations: ['Hanami (marzo-abril)', 'Obon (agosto)', 'Año Nuevo — Oshōgatsu (enero)', 'Hinamatsuri (marzo)'],
      crafts: ['Kintsugi (cerámica reparada con oro)', 'Origami', 'Ikebana (arreglo floral)', 'Cerámica Raku', 'Kimono'],
      curiosities: [
        'El Kintsugi convierte las fracturas en belleza, reparando cerámica rota con polvo de oro: la imperfección como arte.',
        'Japón tiene 23 sitios UNESCO y es el país con más restaurantes con estrellas Michelin del mundo.',
        'El haiku captura un momento único en solo 17 sílabas, una de las formas poéticas más precisas de la humanidad.',
        'La práctica del «Ikigai» (razón de ser) es considerada una de las claves de la longevidad japonesa.'
      ],
      lat: 36.2, lng: 138.25, altitude: 1.8,
      creatorIds: [],
      geoNames: ['Japan', 'Japón']
    }
  };

  // Coordenadas de países para puntos de creadores
  const COUNTRY_COORDS = {
    ecuador:   { lat: -1.83,  lng: -78.18 },
    australia: { lat: -25.27, lng: 133.77 },
    peru:      { lat: -9.19,  lng: -75.02 },
    bolivia:   { lat: -16.5,  lng: -64.5  },
    mexico:    { lat: 23.63,  lng: -102.55 },
    japan:     { lat: 36.2,   lng: 138.25 },
  };

  const CONTINENT_VIEWS = {
    'Todos':             { lat: 10,   lng: 0,      altitude: 2.5 },
    'América del Sur':   { lat: -15,  lng: -65,    altitude: 2.0 },
    'América del Norte': { lat: 35,   lng: -100,   altitude: 2.0 },
    'Asia':              { lat: 35,   lng: 100,    altitude: 2.0 },
    'Oceanía':           { lat: -25,  lng: 134,    altitude: 2.0 },
    'Europa':            { lat: 50,   lng: 15,     altitude: 2.0 },
    'África':            { lat: 5,    lng: 20,     altitude: 2.0 },
  };

  /* ── GEO NAME MATCHING ──────────────────────────────────────── */
  const NAME_MAP = {};
  Object.values(CULTURAL_DB).forEach(c => {
    c.geoNames.forEach(n => { NAME_MAP[n.toLowerCase()] = c.key; });
  });

  function matchKey(feature) {
    const admin = (feature.properties?.ADMIN || feature.properties?.name || feature.properties?.NAME || '').toLowerCase();
    return NAME_MAP[admin] || null;
  }

  /* ── STATE ──────────────────────────────────────────────────── */
  let _globe    = null;
  let _panel    = null;
  let _hovered  = null;
  let _selected = null;
  let _rotating = true;
  let _geoData  = null;
  let _destroyed = false;

  /* ── WEBGL DETECTION ────────────────────────────────────────── */
  function hasWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch { return false; }
  }

  /* ── LOAD GLOBE.GL DYNAMICALLY ──────────────────────────────── */
  let _globeScriptPromise = null;
  function loadGlobeGL() {
    if (_globeScriptPromise) return _globeScriptPromise;
    if (window.Globe) return (_globeScriptPromise = Promise.resolve());
    _globeScriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/globe.gl@2.30.0/dist/globe.gl.min.js';
      s.crossOrigin = 'anonymous';
      s.onload  = resolve;
      s.onerror = () => reject(new Error('Globe.gl no pudo cargarse.'));
      document.head.appendChild(s);
    });
    return _globeScriptPromise;
  }

  /* ── FETCH GEOJSON ──────────────────────────────────────────── */
  let _geoPromise = null;
  function loadGeo() {
    if (_geoPromise) return _geoPromise;
    _geoPromise = fetch(
      'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
    ).then(async r => {
      // world-atlas uses TopoJSON; we need topojson-client
      const topo = await r.json();
      // Inline micro-converter (only the arc/geometry we need)
      return topoToGeo(topo);
    }).catch(() =>
      // Fallback: fetch GeoJSON directly
      fetch('https://cdn.jsdelivr.net/gh/holtzy/D3-graph-gallery@master/DATA/world.geojson')
        .then(r => r.json())
        .then(g => g.features)
    );
    return _geoPromise;
  }

  /* Minimal TopoJSON → GeoJSON converter for the countries object */
  function topoToGeo(topo) {
    // If it already looks like GeoJSON features, return as-is
    if (Array.isArray(topo.features)) return topo.features;

    const obj = topo.objects.countries || topo.objects[Object.keys(topo.objects)[0]];
    const arcs = topo.arcs;
    const tf   = topo.transform;

    function decodeArc(arcIdx) {
      const reversed = arcIdx < 0;
      const arc = arcs[reversed ? ~arcIdx : arcIdx];
      let [x, y] = [0, 0];
      const pts = arc.map(([dx, dy]) => {
        x += dx; y += dy;
        const lnSrc = tf ? x * tf.scale[0] + tf.translate[0] : x;
        const ltSrc = tf ? y * tf.scale[1] + tf.translate[1] : y;
        return [lnSrc, ltSrc];
      });
      return reversed ? pts.slice().reverse() : pts;
    }

    function buildGeom(geom) {
      if (!geom || !geom.type) return null;
      if (geom.type === 'GeometryCollection') {
        return geom.geometries.map(buildGeom).filter(Boolean);
      }
      const ring = idx => decodeArc(idx);
      if (geom.type === 'Polygon') {
        return { type:'Polygon', coordinates: geom.arcs.map(a => a.flatMap(ring)) };
      }
      if (geom.type === 'MultiPolygon') {
        return { type:'MultiPolygon', coordinates: geom.arcs.map(poly => poly.map(a => a.flatMap(ring))) };
      }
      return null;
    }

    return (obj.geometries || []).map(g => ({
      type: 'Feature',
      properties: g.properties || {},
      id: g.id,
      geometry: buildGeom(g)
    })).filter(f => f.geometry);
  }

  /* ── COLORS ─────────────────────────────────────────────────── */
  function capColor(feat) {
    const key = matchKey(feat);
    if (feat === _selected) return 'rgba(200,169,126,0.92)';
    if (feat === _hovered)  return 'rgba(200,169,126,0.58)';
    if (key)                return 'rgba(200,169,126,0.22)';
    return 'rgba(18,18,18,0.72)';
  }
  function altitude(feat) {
    return feat === _hovered ? 0.016 : 0.006;
  }

  /* ── CREATOR DATA ───────────────────────────────────────────── */
  function getCreatorsForKey(countryKey) {
    const db   = CULTURAL_DB[countryKey];
    if (!db) return [];
    const all  = (window.ORIGEN_DATA?.creators || []);
    const users = (() => { try { return JSON.parse(localStorage.getItem('oc-users') || '{}'); } catch { return {}; } })();
    const seed = all.filter(c => db.creatorIds.includes(c.id)).map(c => ({ ...c, _kind: 'creator' }));
    const usr  = Object.values(users).filter(u => {
      const loc = (u.location || '').toLowerCase();
      return loc.includes(db.name.toLowerCase()) || loc.includes(countryKey);
    }).map(u => ({ ...u, _kind: 'user' }));
    return [...seed, ...usr];
  }

  function getCreatorPoints() {
    const all = window.ORIGEN_DATA?.creators || [];
    return all.map(c => {
      const country = Object.values(CULTURAL_DB).find(d => d.creatorIds.includes(c.id));
      if (!country) return null;
      const coords = COUNTRY_COORDS[country.key];
      return {
        lat:   coords.lat + (Math.random() - 0.5) * 2,
        lng:   coords.lng + (Math.random() - 0.5) * 2,
        size:  0.03,
        color: '#C8A97E',
        label: c.name,
        creatorId: c.id,
        countryKey: country.key
      };
    }).filter(Boolean);
  }

  /* ── CARD RENDERING ─────────────────────────────────────────── */
  function renderCard(countryKey) {
    if (!_panel) return;
    const data     = CULTURAL_DB[countryKey];
    const creators = getCreatorsForKey(countryKey);

    const section = (label, items) => items.length ? `
      <div class="card-section">
        <p class="card-section-label">${label}</p>
        <div class="card-pills">${items.map(i => `<span class="card-pill">${i}</span>`).join('')}</div>
      </div>` : '';

    const creatorHtml = creators.length
      ? `<div class="card-section">
          <p class="card-section-label">CREADORES CULTURALES</p>
          <div class="card-creators">${creators.slice(0, 6).map(renderCreatorMini).join('')}</div>
        </div>`
      : `<div class="card-section">
          <p class="card-section-label">CREADORES CULTURALES</p>
          <div class="card-empty-creators">
            <p>Sé el primero en registrarte desde ${data.name}.</p>
            <a href="#registro" class="btn" style="min-height:40px;padding:0 16px;font-size:11px;margin-top:10px">Crear perfil</a>
          </div>
        </div>`;

    _panel.innerHTML = `
      <div class="cultural-card">
        <div class="card-header">
          <div class="card-flag">${data.flag}</div>
          <div>
            <p class="eyebrow">${data.continent}</p>
            <h2 class="card-country-name">${data.name}</h2>
            <p class="card-meta">${data.capital} · ${data.population}</p>
          </div>
          <button class="card-close" id="card-close" aria-label="Cerrar">×</button>
        </div>

        ${section('LENGUAS', data.languages)}
        ${section('TRADICIONES', data.traditions)}
        ${section('GASTRONOMÍA', data.gastronomy)}
        ${section('MÚSICA', data.music)}
        ${section('CELEBRACIONES', data.celebrations)}
        ${section('ARTESANÍA', data.crafts)}

        <div class="card-section">
          <p class="card-section-label">SABÍAS QUE…</p>
          <ul class="card-curiosities">${data.curiosities.map(c => `<li>${c}</li>`).join('')}</ul>
        </div>

        ${creatorHtml}

        <div class="card-actions">
          <a href="#explorar" class="btn secondary" style="min-height:40px;padding:0 14px;font-size:11px">Explorar directorio</a>
          <a href="#feed"     class="btn"           style="min-height:40px;padding:0 14px;font-size:11px">Ver feed</a>
        </div>
      </div>`;

    document.getElementById('card-close')?.addEventListener('click', () => {
      _selected = null;
      _panel.innerHTML = welcomeHtml();
      bindPanelButtons();
      if (_globe) {
        _globe.polygonCapColor(capColor);
        _globe.controls().autoRotate = _rotating;
      }
    });
  }

  function renderCreatorMini(c) {
    const init = (c.name || 'OC').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const src  = c.avatar || c.image;
    const href = c._kind === 'creator' ? `#perfil/${c.id}` : `#usuario/${c.id}`;
    const avHtml = src
      ? `<img src="${src}" alt="${c.name}" style="width:44px;height:44px;border-radius:50%;object-fit:cover">`
      : `<div style="width:44px;height:44px;border-radius:50%;background:var(--black);color:var(--sand);display:grid;place-items:center;font-size:13px;font-weight:700">${init}</div>`;

    const followsMap = (() => { try { return JSON.parse(localStorage.getItem('oc-follows') || '{}'); } catch { return {}; } })();
    const session    = (() => { try { return JSON.parse(localStorage.getItem('oc-session') || 'null'); } catch { return null; } })();
    const isFollowing = session && (followsMap[session.id] || []).includes(c.id);

    return `<div class="creator-mini">
      <a href="${href}">${avHtml}</a>
      <div class="creator-mini-info">
        <a href="${href}"><strong>${c.name}</strong></a>
        <span>${c.type || c.accountType || ''}</span>
      </div>
      <button class="btn-follow-sm${isFollowing ? ' on' : ''}" data-mundo-follow="${c.id}" data-kind="${c._kind}">${isFollowing ? 'Siguiendo' : '+ Seguir'}</button>
    </div>`;
  }

  function welcomeHtml() {
    const highlighted = ['Ecuador', 'Australia', 'Perú', 'Bolivia', 'México', 'Japón'];
    const keys        = ['ecuador', 'australia', 'peru', 'bolivia', 'mexico', 'japan'];
    const flags       = ['🇪🇨','🇦🇺','🇵🇪','🇧🇴','🇲🇽','🇯🇵'];
    return `<div class="panel-welcome">
      <div class="panel-welcome-icon">◎</div>
      <h3>Selecciona un territorio</h3>
      <p>Haz clic en cualquier país del globo para descubrir su identidad cultural y los creadores registrados en Origen Cultural.</p>
      <p class="eyebrow" style="margin-top:28px">TERRITORIOS DISPONIBLES</p>
      <div class="featured-countries">
        ${highlighted.map((n, i) => `
          <button class="featured-country" data-fc="${keys[i]}">
            <span>${flags[i]}</span><span>${n}</span>
          </button>`).join('')}
      </div>
    </div>`;
  }

  function bindPanelButtons() {
    _panel.querySelectorAll('[data-fc]').forEach(btn => {
      btn.addEventListener('click', () => selectCountry(btn.dataset.fc));
    });
    _panel.querySelectorAll('[data-mundo-follow]').forEach(btn => {
      btn.addEventListener('click', () => {
        const session = (() => { try { return JSON.parse(localStorage.getItem('oc-session') || 'null'); } catch { return null; } })();
        if (!session) { window.location.hash = '#login'; return; }
        const tid = btn.dataset.mundoFollow;
        const follows = (() => { try { return JSON.parse(localStorage.getItem('oc-follows') || '{}'); } catch { return {}; } })();
        if (!follows[session.id]) follows[session.id] = [];
        const idx = follows[session.id].indexOf(tid);
        if (idx === -1) { follows[session.id].push(tid); btn.textContent = 'Siguiendo'; btn.classList.add('on'); }
        else            { follows[session.id].splice(idx, 1); btn.textContent = '+ Seguir';  btn.classList.remove('on'); }
        localStorage.setItem('oc-follows', JSON.stringify(follows));
      });
    });
  }

  function unknownCountryCard(name) {
    if (!_panel) return;
    _panel.innerHTML = `<div class="cultural-card">
      <div class="card-header">
        <div class="card-flag">🌍</div>
        <div><h2 class="card-country-name">${name}</h2><p class="card-meta">Territorio sin datos culturales registrados aún.</p></div>
        <button class="card-close" id="card-close" aria-label="Cerrar">×</button>
      </div>
      <div class="card-section">
        <p>Este territorio todavía no tiene una ficha cultural en Origen Cultural. Puedes ser el primero en registrar un perfil desde aquí.</p>
        <a href="#registro" class="btn" style="min-height:44px;padding:0 18px;font-size:11px;margin-top:16px;display:inline-flex">Registrar perfil cultural</a>
      </div>
    </div>`;
    document.getElementById('card-close')?.addEventListener('click', () => {
      _selected = null;
      _panel.innerHTML = welcomeHtml();
      bindPanelButtons();
    });
  }

  /* ── GLOBE INITIALIZATION ───────────────────────────────────── */
  async function initGlobe(el) {
    const [geo] = await Promise.all([loadGeo(), loadGlobeGL()]);
    if (_destroyed) return;
    _geoData = geo;

    const points = getCreatorPoints();

    _globe = Globe({ animateIn: true })
      .width(el.clientWidth || el.offsetWidth || 600)
      .height(el.clientHeight || el.offsetHeight || 600)
      .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg')
      .backgroundImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
      .lineHoverPrecision(0)
      .atmosphereColor('rgba(200,169,126,0.25)')
      .atmosphereAltitude(0.15)
      .polygonsData(_geoData)
      .polygonAltitude(altitude)
      .polygonCapColor(capColor)
      .polygonSideColor(() => 'rgba(200,169,126,0.08)')
      .polygonStrokeColor(() => '#2a2a2a')
      .polygonLabel(feat => {
        const n   = feat.properties?.ADMIN || feat.properties?.name || feat.properties?.NAME || '';
        const key = matchKey(feat);
        return `<div class="globe-tooltip">${feat === _selected ? '◈ ' : key ? '⭐ ' : ''}${n}</div>`;
      })
      .onPolygonHover(poly => {
        if (_destroyed) return;
        _hovered = poly;
        _globe.polygonAltitude(altitude).polygonCapColor(capColor);
        el.style.cursor = poly ? 'pointer' : 'grab';
      })
      .onPolygonClick(poly => {
        if (_destroyed) return;
        _selected = poly;
        _globe.polygonCapColor(capColor);
        const key = matchKey(poly);
        if (key) { renderCard(key); bindPanelButtons(); }
        else     { unknownCountryCard(poly.properties?.ADMIN || poly.properties?.name || 'País'); }
        _globe.controls().autoRotate = false;
        _rotating = false;
        updatePauseBtn();
        // fly to selected country
        const c = CULTURAL_DB[key];
        if (c) _globe.pointOfView({ lat: c.lat, lng: c.lng, altitude: c.altitude }, 800);
      })
      .pointsData(points)
      .pointAltitude('size')
      .pointRadius(0.35)
      .pointColor('color')
      .pointLabel(d => `<div class="globe-tooltip">🏛 ${d.label}</div>`)
      .onPointClick(d => {
        if (d.countryKey) selectCountry(d.countryKey);
      })
      (el);

    /* controls */
    _globe.controls().autoRotate         = true;
    _globe.controls().autoRotateSpeed    = 0.35;
    _globe.controls().enableDamping      = true;
    _globe.controls().dampingFactor      = 0.1;
    _globe.controls().minDistance        = 110;
    _globe.controls().maxDistance        = 500;

    /* initial view: Ecuador */
    _globe.pointOfView({ lat: -1.83, lng: -78.18, altitude: 2.2 }, 0);

    /* resize observer */
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        if (_globe && !_destroyed) {
          _globe.width(el.clientWidth).height(el.clientHeight);
        }
      });
      ro.observe(el);
      _globe._ro = ro;
    }
  }

  /* ── FALLBACK: SIMPLE CARD GRID ─────────────────────────────── */
  function initFallback(el) {
    el.innerHTML = `<div class="fallback-globe">
      <div class="fallback-banner">
        <span class="globe-icon">🌍</span>
        <p>Vista simplificada · Tu dispositivo no soporta el globo 3D o la conexión es limitada</p>
      </div>
      <div class="fallback-grid">
        ${Object.values(CULTURAL_DB).map(c => `
          <button class="fallback-country-btn" data-fc="${c.key}">
            <span class="fallback-flag">${c.flag}</span>
            <strong>${c.name}</strong>
            <span>${c.continent}</span>
          </button>`).join('')}
      </div>
    </div>`;
    el.querySelectorAll('[data-fc]').forEach(btn => {
      btn.addEventListener('click', () => {
        el.querySelectorAll('[data-fc]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (_panel) { renderCard(btn.dataset.fc); bindPanelButtons(); }
      });
    });
    // Auto-select Ecuador
    setTimeout(() => { el.querySelector('[data-fc="ecuador"]')?.click(); }, 100);
  }

  /* ── PUBLIC CONTROLS ────────────────────────────────────────── */
  function toggleRotation() {
    if (!_globe) return;
    _rotating = !_rotating;
    _globe.controls().autoRotate = _rotating;
    updatePauseBtn();
  }
  function resetView() {
    if (_globe) _globe.pointOfView({ lat: 10, lng: 0, altitude: 2.5 }, 900);
  }
  function zoom(factor) {
    if (!_globe) return;
    const pov = _globe.pointOfView();
    _globe.pointOfView({ ...pov, altitude: Math.max(0.5, Math.min(6, pov.altitude * factor)) }, 400);
  }
  function focusContinent(name) {
    const view = CONTINENT_VIEWS[name] || CONTINENT_VIEWS['Todos'];
    if (_globe) _globe.pointOfView(view, 900);
  }
  function selectCountry(key) {
    const data = CULTURAL_DB[key];
    if (!data) return;
    renderCard(key);
    bindPanelButtons();
    if (_globe) {
      // Find matching feature
      const feat = _geoData && _geoData.find(f => matchKey(f) === key);
      if (feat) { _selected = feat; _globe.polygonCapColor(capColor); }
      _globe.pointOfView({ lat: data.lat, lng: data.lng, altitude: data.altitude }, 900);
      _globe.controls().autoRotate = false;
      _rotating = false;
      updatePauseBtn();
    }
  }
  function updatePauseBtn() {
    const btn = document.getElementById('globe-pause');
    if (btn) btn.textContent = _rotating ? '⏸' : '▶';
  }

  /* ── LOADING OVERLAY ────────────────────────────────────────── */
  function showLoader(el) {
    el.innerHTML = `<div class="globe-loader">
      <div class="globe-loader-ring"></div>
      <p>Cargando Globo Cultural…</p>
    </div>`;
  }
  function hideLoader(el) {
    const loader = el.querySelector('.globe-loader');
    if (loader) loader.remove();
  }

  /* ── INIT ───────────────────────────────────────────────────── */
  async function init(globeEl, panelEl) {
    _destroyed = false;
    _panel     = panelEl;
    _selected  = null;
    _hovered   = null;
    _rotating  = true;

    _panel.innerHTML = welcomeHtml();
    bindPanelButtons();

    const lowPerf = !hasWebGL() || (navigator.deviceMemory && navigator.deviceMemory < 2);

    if (lowPerf) {
      initFallback(globeEl);
    } else {
      showLoader(globeEl);
      try {
        await initGlobe(globeEl);
        hideLoader(globeEl);
      } catch (err) {
        console.warn('Globe.gl error, using fallback:', err);
        globeEl.innerHTML = '';
        initFallback(globeEl);
      }
    }
  }

  function destroy() {
    _destroyed = true;
    if (_globe) {
      if (_globe._ro) _globe._ro.disconnect();
      try { _globe._destructor && _globe._destructor(); } catch {}
      _globe = null;
    }
    _panel    = null;
    _selected = null;
    _hovered  = null;
    _geoData  = null;
  }

  return { init, destroy, toggleRotation, resetView, zoom, focusContinent, selectCountry };
})();
