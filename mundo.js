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
      languages: ['Español', 'Kichwa', 'Shuar', 'Achuar'],
      lat: -1.83, lng: -78.18, altitude: 1.8,
      creatorIds: ['pakarina', 'chawar', 'aji-de-piedra', 'yaruqui-vivo', 'danza-andina'],
      geoNames: ['Ecuador'],
      microhistorias: [
        {
          id: 'ec-1', cat: 'Artesanía · Identidad',
          txt: 'El llamado «sombrero Panamá» nace en Montecristi, Ecuador. Las tejedoras trabajan de madrugada para aprovechar la humedad que suaviza la paja toquilla y permite el tejido más fino.',
          src: 'UNESCO / Artesanas de Montecristi, Ecuador',
          href: '#explorar'
        },
        {
          id: 'ec-2', cat: 'Gastronomía · Ritual',
          txt: 'La colada morada se prepara en noviembre para honrar a los difuntos. Cada familia añade sus propias flores y frutas: la receta es también un mapa de memoria familiar y afecto.',
          src: 'Ministerio de Cultura del Ecuador / INPC',
          href: '#explorar'
        },
        {
          id: 'ec-3', cat: 'Lengua · Cosmovisión',
          txt: 'En kichwa, «Pachamama» no significa solo «Madre Tierra»: «pacha» es tiempo y espacio a la vez; «mama», madre. Nombrarla es reconocer que el universo entero es un ser vivo.',
          src: 'Academia de la Lengua Kichwa del Ecuador',
          href: '#explorar'
        },
        {
          id: 'ec-4', cat: 'Artesanía · Comunidad',
          txt: 'Las shigras son bolsas tejidas en fibra de cabuya por mujeres kichwas del Cotopaxi. Cada nudo y color cuenta una historia familiar que se transmite de generación en generación.',
          src: 'Comunidades Kichwa de Cotopaxi / INPC Ecuador',
          href: '#explorar'
        },
        {
          id: 'ec-5', cat: 'Tradición · Territorio',
          txt: 'El Inti Raymi kichwa no es una recreación turística: es una celebración viva del solsticio que comunidades de la Sierra practican sin interrupción desde antes de la conquista española.',
          src: 'Comunidad Kichwa Panzaleo / INPC Ecuador',
          href: '#mundo'
        }
      ]
    },
    australia: {
      key: 'australia', flag: '🇦🇺',
      name: 'Australia', continent: 'Oceanía',
      languages: ['Inglés (oficial)', 'Yolŋu Matha', 'Warlpiri', '+250 lenguas aborígenes'],
      lat: -25.27, lng: 133.77, altitude: 1.8,
      creatorIds: [],
      geoNames: ['Australia'],
      microhistorias: [
        {
          id: 'au-1', cat: 'Territorio · Ley Sagrada',
          txt: 'Los Anangu no fotografían ciertas zonas de Uluru porque consideran que hacerlo viola una ley espiritual viva, no una norma turística. Uluru no es un monumento: es un ser.',
          src: 'Tjukurpa Law / Anangu Pitjantjatjara Yankunytjatjara',
          href: '#explorar'
        },
        {
          id: 'au-2', cat: 'Música · Ceremonia',
          txt: 'El yidaki —conocido como didgeridoo— se toca con respiración circular continua. Requiere años de práctica y pertenece a ceremonias sagradas de los Yolŋu: no es música de entretenimiento.',
          src: 'Yolŋu Elders / Australian Institute of Aboriginal Studies',
          href: '#explorar'
        },
        {
          id: 'au-3', cat: 'Arte · Cosmología',
          txt: 'El arte puntillista aborigen no es decorativo: cada punto conecta mapas sagrados del Tiempo del Sueño, la cosmología que explica el origen del mundo para los Pueblos del Desierto.',
          src: 'Desart / Araluen Arts Centre, Australia Central',
          href: '#explorar'
        },
        {
          id: 'au-4', cat: 'Lengua · Tiempo',
          txt: 'Australia alberga más de 250 lenguas indígenas. Algunas no tienen tiempo lineal ni puntos cardinales fijos: cada lengua es también una manera distinta de concebir y habitar el mundo.',
          src: 'AIATSIS — Instituto Australiano de Estudios Aborígenes',
          href: '#explorar'
        },
        {
          id: 'au-5', cat: 'Tradición · Transmisión',
          txt: 'El Corroboree no es un espectáculo: es un encuentro ceremonial donde canto, danza y pintura corporal transmiten leyes y conocimientos de unas generaciones a otras, en comunidades específicas.',
          src: 'AIATSIS / Consejo de Ancianos Aborígenes',
          href: '#explorar'
        }
      ]
    },
    peru: {
      key: 'peru', flag: '🇵🇪',
      name: 'Perú', continent: 'América del Sur',
      languages: ['Español', 'Quechua', 'Aimara'],
      lat: -9.19, lng: -75.02, altitude: 1.8,
      creatorIds: [],
      geoNames: ['Peru', 'Perú'],
      microhistorias: [
        {
          id: 'pe-1', cat: 'Gastronomía · Biodiversidad',
          txt: 'Perú conserva más de 3.000 variedades de papa domesticadas hace 8.000 años en el altiplano andino. Cada variedad tiene nombre propio en quechua y propiedades distintas según la altitud.',
          src: 'Centro Internacional de la Papa (CIP) — Lima',
          href: '#explorar'
        },
        {
          id: 'pe-2', cat: 'Música · Danza',
          txt: 'La marinera norteña representa el cortejo entre dos personas usando solo un pañuelo blanco como intermediario. Su coreografía sin contacto fue declarada Patrimonio Cultural de la Nación en 1986.',
          src: 'MINCUL — Ministerio de Cultura del Perú',
          href: '#explorar'
        },
        {
          id: 'pe-3', cat: 'Artesanía · Historia Viva',
          txt: 'Los retablos ayacuchanos nacieron como altares portátiles para evangelizar. Hoy los artesanos los usan para narrar conflictos sociales, cosechas, fiestas y la historia reciente de sus comunidades.',
          src: 'Museo de Arte Popular — Ayacucho, Perú',
          href: '#explorar'
        },
        {
          id: 'pe-4', cat: 'Tradición · Sincretismo',
          txt: 'En Cusco, el Corpus Christi fusiona la procesión católica con el culto andino a los ancestros. Durante siglos, los pueblos indígenas llevaron a sus muertos junto a imágenes de santos.',
          src: 'UNSAAC — Universidad Nacional San Antonio Abad del Cusco',
          href: '#explorar'
        },
        {
          id: 'pe-5', cat: 'Lengua · Emoción',
          txt: 'En quechua, «llaki» es tristeza profunda y forma de amor al mismo tiempo. El idioma contiene maneras de sentir que el español no alcanza a nombrar con una sola palabra.',
          src: 'Academia Mayor de la Lengua Quechua — Cusco',
          href: '#explorar'
        }
      ]
    },
    bolivia: {
      key: 'bolivia', flag: '🇧🇴',
      name: 'Bolivia', continent: 'América del Sur',
      languages: ['Español', 'Quechua', 'Aimara', '+33 lenguas indígenas (todas co-oficiales)'],
      lat: -16.5, lng: -64.5, altitude: 1.8,
      creatorIds: [],
      geoNames: ['Bolivia'],
      microhistorias: [
        {
          id: 'bo-1', cat: 'Tradición · Deseo',
          txt: 'En las Alasitas se compran miniaturas de lo que se desea: casa, salud, título. El Ekeko, dios aymara de la abundancia, activa esos deseos a mediodía del 24 de enero.',
          src: 'UNESCO / Comunidades Aymara de La Paz',
          href: '#explorar'
        },
        {
          id: 'bo-2', cat: 'Artesanía · Cosmología',
          txt: 'Los tejidos jalq\'a de Potosí representan el ukhu pacha, el mundo interior poblado de seres caóticos sin forma definida. Su simbología no es decorativa: es una cartografía del cosmos aymara.',
          src: 'ASUR — Antropólogos del Sur Andino, Sucre',
          href: '#explorar'
        },
        {
          id: 'bo-3', cat: 'Gastronomía · Ritual Social',
          txt: 'La salteña boliviana no es una empanada. Su masa dulce y su caldo espeso la hacen única, y morderla sin derramar nada es un arte que define identidad en Bolivia.',
          src: 'Patrimonio Cultural Inmaterial de Bolivia',
          href: '#explorar'
        },
        {
          id: 'bo-4', cat: 'Música · Resistencia',
          txt: 'La saya afraboliviana nació en los Yungas para resistir y celebrar a la vez. Su ritmo, letras y danza son memoria viva de las comunidades afrobolivianas contra el olvido histórico.',
          src: 'Comunidad Afroboliviana de los Yungas / CADIC',
          href: '#explorar'
        },
        {
          id: 'bo-5', cat: 'Territorio · Sagrado',
          txt: 'Para comunidades quechua y aymara, el Salar de Uyuni no es un paisaje turístico: es un espacio sagrado donde el cielo y la tierra se encuentran y se vuelven uno.',
          src: 'Comunidades Quechua-Aymara de Potosí / CIPCA',
          href: '#explorar'
        }
      ]
    },
    mexico: {
      key: 'mexico', flag: '🇲🇽',
      name: 'México', continent: 'América del Norte',
      languages: ['Español', 'Náhuatl', 'Maya yucateco', 'Zapoteco', '+64 lenguas indígenas'],
      lat: 23.63, lng: -102.55, altitude: 1.8,
      creatorIds: [],
      geoNames: ['Mexico', 'México'],
      microhistorias: [
        {
          id: 'mx-1', cat: 'Gastronomía · Origen',
          txt: 'El chocolate no llegó a Europa desde América: fue al revés. Los mayas preparaban «xocolātl» siglos antes de la conquista —amargo, espumoso, con chile— en rituales, no como postre.',
          src: 'INAH — Instituto Nacional de Antropología e Historia',
          href: '#explorar'
        },
        {
          id: 'mx-2', cat: 'Artesanía · Sueño',
          txt: 'Los alebrijes nacieron en 1936 cuando Pedro Linares, enfermo y febril, soñó con criaturas que mezclaban animales reales. Al despertar los esculpió en papel y los pintó de colores imposibles.',
          src: 'Museo de Arte Popular de México — Ciudad de México',
          href: '#explorar'
        },
        {
          id: 'mx-3', cat: 'Tradición · Sincretismo',
          txt: 'El Día de los Muertos nació de la fusión de rituales nahuas con el catolicismo colonial. Cada ofrenda es un mapa de afectos: quién te amaba, qué comías, cómo eras.',
          src: 'UNESCO / INAH México',
          href: '#explorar'
        },
        {
          id: 'mx-4', cat: 'Música · Cuerpo',
          txt: 'En el son jarocho, la tarima de madera es un instrumento: el zapateado convierte el piso en percusión colectiva. El suelo mismo se vuelve voz de la comunidad veracruzana.',
          src: 'Casa de la Cultura Jarocha — Veracruz',
          href: '#explorar'
        },
        {
          id: 'mx-5', cat: 'Lengua · Pensamiento',
          txt: 'En náhuatl, «tlahtoa» significa hablar, pero también crear mundos. Para muchas comunidades nahuahablantes actuales, nombrar algo es traerlo a la existencia, no solo describirlo.',
          src: 'Instituto Nacional de Lenguas Indígenas (INALI)',
          href: '#explorar'
        }
      ]
    },
    japan: {
      key: 'japan', flag: '🇯🇵',
      name: 'Japón', continent: 'Asia',
      languages: ['Japonés', 'Ainu (lengua indígena en Hokkaido)'],
      lat: 36.2, lng: 138.25, altitude: 1.8,
      creatorIds: [],
      geoNames: ['Japan', 'Japón'],
      microhistorias: [
        {
          id: 'jp-1', cat: 'Artesanía · Filosofía',
          txt: 'El kintsugi no oculta las fracturas: las une con polvo de oro. La historia de cada pieza —sus roturas, sus reparaciones— se convierte en su mayor valor estético.',
          src: 'Museo Nacional de Kyoto / Tradición de la Escuela Raku',
          href: '#explorar'
        },
        {
          id: 'jp-2', cat: 'Tradición · Ancestros',
          txt: 'Durante el Obon, los espíritus de los ancestros regresan al hogar por tres días. Las familias encienden farolillos y bailan el Bon Odori para recibirlos y despedirlos con amor.',
          src: 'Ministerio de Educación de Japón / Tradición Budista Bon',
          href: '#explorar'
        },
        {
          id: 'jp-3', cat: 'Gastronomía · Ritual',
          txt: 'El matcha no es simplemente té molido: su preparación sigue el «Chado», un camino de siglos donde cada gesto, el cuenco, el agua y el silencio tienen un significado preciso.',
          src: 'Urasenke Tea School — Kyoto / Sen no Rikyū',
          href: '#explorar'
        },
        {
          id: 'jp-4', cat: 'Lengua · Silencio',
          txt: 'En japonés, «ma» (間) es el espacio vacío entre dos cosas, pero no es ausencia: es presencia activa. Existe en la música, la arquitectura, las relaciones humanas y la conversación.',
          src: 'Academia Japonesa / Ensayos de Arata Isozaki',
          href: '#explorar'
        },
        {
          id: 'jp-5', cat: 'Conocimiento · Territorio',
          txt: 'El «Satoyama» es el paisaje entre la aldea y la montaña. Comunidades japonesas lo gestionaron en equilibrio durante siglos: ni agricultura invasiva ni abandono. Un modelo vivo de coexistencia.',
          src: 'United Nations University — Tokyo / RIHN',
          href: '#explorar'
        }
      ]
    }
  };

  // Coordenadas de países para puntos de agentes
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
  let _mcIdx    = 0;          // active micro-story index
  let _mcTimer  = null;       // auto-advance interval

  /* ── LOCAL TOAST ────────────────────────────────────────────── */
  function _toast(msg) {
    if (typeof window.showToast === 'function') { window.showToast(msg); return; }
    const el = Object.assign(document.createElement('div'), { className: 'mc-toast-msg', textContent: msg });
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 400); }, 2800);
  }

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
    return 'rgba(7,10,13,0.30)';
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

  function getTerritoryLabels() {
    return Object.values(CULTURAL_DB).map(d => ({
      lat: d.lat,
      lng: d.lng,
      text: `${d.flag} ${d.name}`,
      countryKey: d.key
    }));
  }

  /* ── CARD RENDERING ─────────────────────────────────────────── */
  function renderCard(countryKey) {
    if (!_panel) return;
    const data     = CULTURAL_DB[countryKey];
    const creators = getCreatorsForKey(countryKey);
    const stories  = data.microhistorias || [];

    // Reset carousel state
    if (_mcTimer) { clearInterval(_mcTimer); _mcTimer = null; }
    _mcIdx = 0;

    const isFollowing = (() => {
      try { return JSON.parse(localStorage.getItem('oc-follows-territories') || '[]').includes(countryKey); }
      catch { return false; }
    })();

    const creatorHtml = creators.length
      ? `<div class="card-section card-section-creators">
          <p class="card-section-label">AGENTES CULTURALES EN ESTE TERRITORIO</p>
          <div class="card-creators">${creators.slice(0, 6).map(renderCreatorMini).join('')}</div>
        </div>`
      : `<div class="card-section card-section-creators">
          <p class="card-section-label">AGENTES CULTURALES EN ESTE TERRITORIO</p>
          <div class="card-empty-creators">
            <p>Sé el primero en registrarte desde ${data.name}.</p>
            <a href="#registro" class="btn" style="min-height:40px;padding:0 16px;font-size:11px;margin-top:10px">Crear perfil</a>
          </div>
        </div>`;

    _panel.innerHTML = `
      <div class="cultural-card" id="cultural-card-${countryKey}">

        <!-- HEADER -->
        <div class="card-header">
          <div class="card-flag">${data.flag}</div>
          <div class="card-header-info">
            <p class="eyebrow">${data.continent}</p>
            <h2 class="card-country-name">${data.name}</h2>
          </div>
          <button class="card-close" id="card-close" aria-label="Cerrar">×</button>
        </div>

        <!-- DISCLAIMER: múltiples identidades -->
        <p class="territory-disclaimer">
          <span class="td-icon">◈</span>
          ${data.name} alberga múltiples comunidades, identidades y expresiones culturales. Cada historia representa una voz, no a todas.
        </p>

        <!-- MICRO-STORY CAROUSEL -->
        <div class="micro-carousel" id="mc-carousel" data-mckey="${countryKey}">
          <div class="micro-card" id="mc-card">
            <!-- Injected by setMicroStory() -->
          </div>
          <div class="mc-nav" id="mc-nav" aria-label="Navegar historias">
            ${stories.map((_, i) =>
              `<button class="mc-dot${i === 0 ? ' active' : ''}" data-mcdot="${i}" aria-label="Historia ${i + 1}"></button>`
            ).join('')}
          </div>
        </div>

        <!-- ACTIONS ROW -->
        <div class="micro-actions">
          <button class="mc-action-btn" id="mc-save" data-mckey="${countryKey}" data-mcidx="0" title="Guardar en Pasaporte Cultural">
            <span class="mca-icon">💾</span><span class="mca-label">Guardar</span>
          </button>
          <button class="mc-action-btn" id="mc-share" data-mckey="${countryKey}" title="Compartir esta historia">
            <span class="mca-icon">↗</span><span class="mca-label">Compartir</span>
          </button>
          <button class="mc-action-btn${isFollowing ? ' on' : ''}" id="mc-follow" data-mcfollow="${countryKey}">
            <span class="mca-icon">${isFollowing ? '✓' : '+'}</span>
            <span class="mca-label">${isFollowing ? 'Siguiendo' : 'Seguir'}</span>
          </button>
          <a href="#explorar" class="mc-action-btn" title="Explorar perfiles culturales">
            <span class="mca-icon">👥</span><span class="mca-label">Perfiles</span>
          </a>
        </div>

        <!-- CREATORS -->
        ${creatorHtml}

        <!-- LENGUAS -->
        <div class="card-section">
          <p class="card-section-label">LENGUAS DE ESTE TERRITORIO</p>
          <div class="card-pills">${(data.languages||[]).map(l => `<span class="card-pill">${l}</span>`).join('')}</div>
        </div>

        <!-- SUGGEST / CORRECTION -->
        <div class="card-suggest">
          <a href="#" class="suggest-link" id="mc-suggest" data-mcsuggest="${countryKey}">
            ¿Tienes datos o encuentras un error? Sugiere o solicita corrección →
          </a>
        </div>

      </div>`;

    // Render first story
    setMicroStory(countryKey, 0);

    // Bind all interactions
    bindPanelButtons();
    bindCardInteractions(countryKey);

    document.getElementById('card-close')?.addEventListener('click', () => {
      if (_mcTimer) { clearInterval(_mcTimer); _mcTimer = null; }
      _selected = null;
      _panel.innerHTML = welcomeHtml();
      bindPanelButtons();
      if (_globe) {
        _globe.polygonCapColor(capColor);
        _globe.controls().autoRotate = _rotating;
      }
    });
  }

  /* Inject one micro-story into the card without re-rendering the whole panel */
  function setMicroStory(countryKey, idx) {
    const data = CULTURAL_DB[countryKey];
    const card = document.getElementById('mc-card');
    if (!card || !data) return;
    const h = data.microhistorias?.[idx];
    if (!h) return;

    card.innerHTML = `
      <div class="mc-inner">
        <p class="mc-category">${h.cat}</p>
        <h3 class="mc-sabias">¿Sabías que…?</h3>
        <blockquote class="mc-text">${h.txt}</blockquote>
        <a href="${h.href || '#explorar'}" class="mc-discover-btn">
          Descubre su origen <span aria-hidden="true">→</span>
        </a>
      </div>
      <footer class="mc-footer">
        <p class="mc-source">Fuente: <em>${h.src}</em></p>
      </footer>`;

    // Update dots
    document.querySelectorAll('.mc-dot').forEach((dot, i) =>
      dot.classList.toggle('active', i === idx));

    // Keep save-btn's idx in sync
    const saveBtn = document.getElementById('mc-save');
    if (saveBtn) saveBtn.dataset.mcidx = idx;
  }

  /* Wire carousel, save, share, follow, suggest */
  function bindCardInteractions(countryKey) {
    const data = CULTURAL_DB[countryKey];
    if (!data) return;
    const stories = data.microhistorias || [];

    /* ─ auto-advance ─ */
    function startTimer() {
      if (_mcTimer) clearInterval(_mcTimer);
      if (stories.length < 2) return;
      _mcTimer = setInterval(() => {
        _mcIdx = (_mcIdx + 1) % stories.length;
        setMicroStory(countryKey, _mcIdx);
      }, 8000);
    }
    startTimer();

    /* ─ dots ─ */
    document.querySelectorAll('.mc-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        _mcIdx = parseInt(dot.dataset.mcdot, 10);
        setMicroStory(countryKey, _mcIdx);
        startTimer();
      });
    });

    /* ─ pause on hover ─ */
    const carousel = document.getElementById('mc-carousel');
    carousel?.addEventListener('mouseenter', () => { if (_mcTimer) clearInterval(_mcTimer); });
    carousel?.addEventListener('mouseleave', startTimer);

    /* ─ save to Pasaporte Cultural ─ */
    document.getElementById('mc-save')?.addEventListener('click', e => {
      const btn  = e.currentTarget;
      const key  = btn.dataset.mckey;
      const idx  = parseInt(btn.dataset.mcidx || '0', 10);
      const d    = CULTURAL_DB[key];
      const h    = d?.microhistorias?.[idx];
      if (!h) return;

      const passport = (() => { try { return JSON.parse(localStorage.getItem('oc-passport') || '[]'); } catch { return []; } })();
      const entryId  = `${key}-${h.id}`;

      if (!passport.find(p => p.id === entryId)) {
        passport.push({
          id: entryId, type: 'microhistoria',
          country: d.name, flag: d.flag, continent: d.continent,
          category: h.cat, text: h.txt, source: h.src,
          savedAt: Date.now()
        });
        localStorage.setItem('oc-passport', JSON.stringify(passport));
        btn.querySelector('.mca-icon').textContent = '✓';
        btn.classList.add('on');
        _toast(`Historia guardada en tu Pasaporte Cultural ✓`);
        setTimeout(() => {
          btn.querySelector('.mca-icon').textContent = '💾';
          btn.classList.remove('on');
        }, 2800);
      } else {
        _toast('Ya guardaste esta historia en tu Pasaporte Cultural.');
      }
    });

    /* ─ share ─ */
    document.getElementById('mc-share')?.addEventListener('click', () => {
      const h    = stories[_mcIdx];
      const text = `¿Sabías que…? ${h?.txt || ''}\n\nDescúbrelo en ORIGEN Cultural`;
      const url  = `${location.origin}${location.pathname}#mundo`;
      if (navigator.share) {
        navigator.share({ title: `ORIGEN Cultural — ${data.name}`, text, url }).catch(() => {});
      } else {
        navigator.clipboard.writeText(`${text}\n${url}`).then(() =>
          _toast('Historia copiada al portapapeles ↗')
        ).catch(() => _toast('Comparte este enlace: ' + url));
      }
    });

    /* ─ follow territory ─ */
    document.getElementById('mc-follow')?.addEventListener('click', e => {
      const btn    = e.currentTarget;
      const key    = btn.dataset.mcfollow;
      const terrs  = (() => { try { return JSON.parse(localStorage.getItem('oc-follows-territories') || '[]'); } catch { return []; } })();
      const idx    = terrs.indexOf(key);
      const icon   = btn.querySelector('.mca-icon');
      const label  = btn.querySelector('.mca-label');
      if (idx === -1) {
        terrs.push(key);
        icon.textContent  = '✓';
        label.textContent = 'Siguiendo';
        btn.classList.add('on');
        _toast(`Ahora sigues ${data.name} 🌍`);
      } else {
        terrs.splice(idx, 1);
        icon.textContent  = '+';
        label.textContent = 'Seguir';
        btn.classList.remove('on');
      }
      localStorage.setItem('oc-follows-territories', JSON.stringify(terrs));
    });

    /* ─ suggest / correction ─ */
    document.getElementById('mc-suggest')?.addEventListener('click', e => {
      e.preventDefault();
      const session = (() => { try { return JSON.parse(localStorage.getItem('oc-session') || 'null'); } catch { return null; } })();
      if (!session) {
        _toast('Inicia sesión para sugerir datos o solicitar correcciones.');
        setTimeout(() => { window.location.hash = '#login'; }, 1400);
        return;
      }
      _toast('Gracias. Tu sugerencia llegará al equipo de ORIGEN Cultural para revisión.');
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
      <p>Haz clic en cualquier país del globo para descubrir su identidad cultural y los agentes registrados en Origen Cultural.</p>
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
    const territoryLabels = Object.values(CULTURAL_DB).map(d => ({
      lat: d.lat, lng: d.lng, text: `${d.flag} ${d.name}`, key: d.key
    }));

    _globe = Globe({ animateIn: true })
      .width(el.clientWidth || el.offsetWidth || 600)
      .height(el.clientHeight || el.offsetHeight || 600)
      .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
      .lineHoverPrecision(0)
      .atmosphereColor('rgba(200,169,126,0.58)')
      .atmosphereAltitude(0.20)
      .polygonsData(_geoData)
      .polygonAltitude(altitude)
      .polygonCapColor(capColor)
      .polygonSideColor(() => 'rgba(200,169,126,0.08)')
      .polygonStrokeColor(() => 'rgba(255,255,255,0.18)')
      .labelsData(territoryLabels)
      .labelLat('lat')
      .labelLng('lng')
      .labelText('text')
      .labelSize(1.15)
      .labelDotRadius(0.28)
      .labelColor(() => 'rgba(255,255,255,0.96)')
      .labelAltitude(0.022)
      .labelResolution(3)
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
        if (key) renderCard(key);
        else     unknownCountryCard(poly.properties?.ADMIN || poly.properties?.name || 'País');
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
      .labelsData(getTerritoryLabels())
      .labelLat('lat')
      .labelLng('lng')
      .labelText('text')
      .labelColor(() => '#F3E4CF')
      .labelSize(0.72)
      .labelDotRadius(0.18)
      .labelDotOrientation(() => 'bottom')
      .labelAltitude(0.035)
      .onLabelClick(d => {
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
        if (_panel) renderCard(btn.dataset.fc);
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

  return {
    init, destroy, toggleRotation, resetView, zoom, focusContinent, selectCountry,
    /* shared primitives for HeroGlobe */
    _db: CULTURAL_DB, _matchKey: matchKey,
    _loadGeo: loadGeo, _loadGlobeGL: loadGlobeGL, _hasWebGL: hasWebGL
  };
})();

/* ═══════════════════════════════════════════════════════════════
   HERO GLOBE — versión compacta para el landing
   Reutiliza GeoJSON y script globe.gl ya cargados por MundoCultural
═══════════════════════════════════════════════════════════════ */
window.HeroGlobe = (() => {
  'use strict';

  const MC         = () => window.MundoCultural;   // lazy ref para evitar orden de carga
  const matchKey   = feat => MC()._matchKey(feat);
  const getDB      = ()   => MC()._db;
  const loadGeo    = ()   => MC()._loadGeo();
  const loadGlobeGL= ()   => MC()._loadGlobeGL();
  const canWebGL   = ()   => MC()._hasWebGL();

  let _globe     = null;
  let _rotating  = true;
  let _hovered   = null;
  let _selected  = null;
  let _destroyed = false;
  let _geoData   = null;
  let _popup     = null;

  /* colors */
  function hCap(feat) {
    const key = matchKey(feat);
    if (feat === _selected) return 'rgba(200,169,126,0.95)';
    if (feat === _hovered)  return 'rgba(200,169,126,0.55)';
    if (key)                return 'rgba(200,169,126,0.22)';
    return 'rgba(7,10,13,0.30)';
  }
  function hAlt(feat) { return feat === _hovered ? 0.014 : 0.006; }

  /* stats for popup */
  function stats(key) {
    const db = getDB()[key];
    if (!db) return { creators: 0, posts: 0 };
    const allC     = window.ORIGEN_DATA?.creators || [];
    const seedC    = allC.filter(c => db.creatorIds.includes(c.id)).length;
    const users    = (() => { try { return Object.values(JSON.parse(localStorage.getItem('oc-users') || '{}')); } catch { return []; } })();
    const userC    = users.filter(u => (u.location || '').toLowerCase().includes(db.name.toLowerCase())).length;
    const seedP    = (window.ORIGEN_DATA?.posts || []).filter(p => db.creatorIds.includes(p.authorId)).length;
    const userP    = (() => { try { return JSON.parse(localStorage.getItem('oc-posts') || '[]'); } catch { return []; } })().filter(p => db.creatorIds.includes(p.authorId)).length;
    return { creators: seedC + userC, posts: seedP + userP };
  }

  /* popup */
  function showPopup(key) {
    if (!_popup) return;
    const db = getDB()[key];
    if (!db) { hidePopup(); return; }
    const { creators, posts } = stats(key);
    _popup.innerHTML = `
      <button class="hpop-close" id="hpop-close">×</button>
      <div class="hpop-flag">${db.flag}</div>
      <h3 class="hpop-name">${db.name}</h3>
      <p class="hpop-cont">${db.continent}</p>
      <div class="hpop-stats">
        <div class="hpop-stat"><strong>${creators || db.creatorIds.length}</strong><span>Agentes</span></div>
        <div class="hpop-stat"><strong>${posts}</strong><span>Publicaciones</span></div>
        <div class="hpop-stat"><strong>${db.microhistorias?.length || 0}</strong><span>Historias</span></div>
      </div>
      <a href="#mundo" class="hpop-btn" data-hpopkey="${key}">Explorar cultura →</a>`;
    _popup.hidden = false;
    document.getElementById('hpop-close')?.addEventListener('click', () => {
      hidePopup(); _selected = null;
      if (_globe) _globe.polygonCapColor(hCap);
    });
    _popup.querySelector('[data-hpopkey]')?.addEventListener('click', e => {
      e.preventDefault();
      window.location.hash = '#mundo';
      setTimeout(() => { try { window.MundoCultural.selectCountry(key); } catch {} }, 700);
    });
  }
  function hidePopup() { if (_popup) _popup.hidden = true; }

  /* low-perf fallback */
  function initFallback(el) {
    el.innerHTML = `<div class="hero-globe-fallback">
      <div class="hgf-emoji">🌍</div>
      <p>Explora el mundo cultural</p>
      <div class="hgf-countries">
        ${['🇪🇨 Ecuador','🇦🇺 Australia','🇵🇪 Perú','🇧🇴 Bolivia','🇲🇽 México','🇯🇵 Japón']
          .map(c => `<span class="hgf-tag">${c}</span>`).join('')}
      </div>
    </div>`;
  }

  /* init */
  async function init(container, popup) {
    _destroyed = false; _popup = popup;
    _selected = null; _hovered = null; _rotating = true;
    hidePopup();

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowPerf = !canWebGL() || (navigator.deviceMemory && navigator.deviceMemory < 2);
    if (lowPerf) { initFallback(container); return; }

    container.innerHTML = '<div class="hero-globe-loading"><div class="hero-globe-ring"></div></div>';
    try {
      const [geo] = await Promise.all([loadGeo(), loadGlobeGL()]);
      if (_destroyed) return;
      _geoData = geo;
      container.innerHTML = '';
      const territoryLabels = Object.values(getDB()).map(d => ({
        lat: d.lat, lng: d.lng, text: `${d.flag} ${d.name}`, key: d.key
      }));

      _globe = Globe({ animateIn: true })
        .width(container.clientWidth  || 640)
        .height(container.clientHeight || 640)
        .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg')
        .backgroundImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
        .lineHoverPrecision(0)
        .atmosphereColor('rgba(200,169,126,0.58)')
        .atmosphereAltitude(0.20)
        .polygonsData(_geoData)
        .polygonAltitude(hAlt)
        .polygonCapColor(hCap)
        .polygonSideColor(() => 'rgba(200,169,126,0.07)')
        .polygonStrokeColor(() => 'rgba(255,255,255,0.16)')
        .labelsData(territoryLabels)
        .labelLat('lat')
        .labelLng('lng')
        .labelText('text')
        .labelSize(1.05)
        .labelDotRadius(0.24)
        .labelColor(() => 'rgba(255,255,255,0.98)')
        .labelAltitude(0.022)
        .labelResolution(3)
        .polygonLabel(feat => {
          const n   = feat.properties?.ADMIN || feat.properties?.name || feat.properties?.NAME || '';
          const key = matchKey(feat);
          return `<div class="globe-tooltip">${key ? '⭐ ' : ''}${n}</div>`;
        })
        .onPolygonHover(poly => {
          if (_destroyed) return;
          _hovered = poly;
          _globe.polygonAltitude(hAlt).polygonCapColor(hCap);
          container.style.cursor = poly ? 'pointer' : 'grab';
        })
        .onPolygonClick(poly => {
          if (_destroyed) return;
          _selected = poly;
          _globe.polygonCapColor(hCap);
          const key = matchKey(poly);
          const db  = getDB();
          if (key) {
            showPopup(key);
            _globe.pointOfView({ lat: db[key].lat, lng: db[key].lng, altitude: 2.0 }, 700);
          } else {
            hidePopup();
          }
          _globe.controls().autoRotate = false;
          _rotating = false;
          _updatePauseBtn();
        })
        .labelsData(Object.values(getDB()).map(d => ({
          lat: d.lat,
          lng: d.lng,
          text: `${d.flag} ${d.name}`,
          countryKey: d.key
        })))
        .labelLat('lat')
        .labelLng('lng')
        .labelText('text')
        .labelColor(() => '#F3E4CF')
        .labelSize(0.66)
        .labelDotRadius(0.16)
        .labelDotOrientation(() => 'bottom')
        .labelAltitude(0.035)
        .onLabelClick(d => {
          const db = getDB();
          if (!d.countryKey || !db[d.countryKey]) return;
          _selected = null;
          showPopup(d.countryKey);
          _globe.pointOfView({ lat: db[d.countryKey].lat, lng: db[d.countryKey].lng, altitude: 2.0 }, 700);
          _globe.controls().autoRotate = false;
          _rotating = false;
          _updatePauseBtn();
        })
        (container);

      _globe.controls().autoRotate      = !prefersReduced;
      _globe.controls().autoRotateSpeed  = 0.30;
      _globe.controls().enableDamping    = true;
      _globe.controls().dampingFactor    = 0.08;
      _globe.controls().minDistance      = 130;
      _globe.controls().maxDistance      = 460;
      _rotating = !prefersReduced;

      /* centered to show Americas + Europe nicely */
      _globe.pointOfView({ lat: 5, lng: -20, altitude: 2.1 }, 0);

      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => {
          if (_globe && !_destroyed) _globe.width(container.clientWidth).height(container.clientHeight);
        });
        ro.observe(container);
        _globe._hRo = ro;
      }
    } catch(e) {
      console.warn('HeroGlobe error:', e);
      container.innerHTML = '';
      initFallback(container);
    }
  }

  function destroy() {
    _destroyed = true;
    hidePopup();
    if (_globe) {
      if (_globe._hRo) _globe._hRo.disconnect();
      try { _globe._destructor && _globe._destructor(); } catch {}
      _globe = null;
    }
    _geoData = null; _selected = null; _hovered = null;
  }

  function toggleRotation() {
    if (!_globe) return;
    _rotating = !_rotating;
    _globe.controls().autoRotate = _rotating;
    _updatePauseBtn();
  }

  function zoom(factor) {
    if (!_globe) return;
    const pov = _globe.pointOfView();
    _globe.pointOfView({ ...pov, altitude: Math.max(0.8, Math.min(5, pov.altitude * factor)) }, 400);
  }

  function _updatePauseBtn() {
    const btn = document.getElementById('hero-globe-pause');
    if (btn) btn.textContent = _rotating ? '⏸' : '▶';
  }

  return { init, destroy, toggleRotation, zoom };
})();
