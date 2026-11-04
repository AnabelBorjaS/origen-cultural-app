// ORIGEN Cultural — country and city choices
// City names and first-level regions: datasets/world-cities, sourced from GeoNames.
// CC BY 4.0; attribution: GeoNames and Lexman/Open Knowledge Foundation.
// This list covers cities above 15,000 inhabitants plus capitals; it is not exhaustive.
(() => {
  'use strict';
  const DATA_URL = 'https://cdn.jsdelivr.net/gh/datasets/world-cities@73c9f54ab9f305168c76d0802db151e30a157b28/data/world-cities.csv';
  let rows = [];
  let loadPromise;

  function parseCsvLine(line) {
    const fields = [];
    let value = '', quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') { value += '"'; i++; }
        else quoted = !quoted;
      } else if (ch === ',' && !quoted) {
        fields.push(value); value = '';
      } else value += ch;
    }
    fields.push(value);
    return fields;
  }

  function load() {
    if (loadPromise) return loadPromise;
    loadPromise = fetch(DATA_URL, { credentials: 'omit', cache: 'force-cache' }).then(async response => {
      if (!response.ok) throw new Error('City directory unavailable');
      const text = await response.text();
      const lines = text.split(/\r?\n/);
      const header = parseCsvLine(lines.shift() || '');
      const index = Object.fromEntries(header.map((name, i) => [name, i]));
      rows = lines.map(parseCsvLine).filter(row => row.length >= 4 && row[index.geonameid]).map(row => ({
        name: row[index.name], country: row[index.country], region: row[index.subcountry] || '',
        id: row[index.geonameid]
      }));
      window.dispatchEvent(new Event('origen-location-data-ready'));
      return true;
    }).catch(error => {
      loadPromise = null;
      console.warn('[ORIGEN] Country and city directory could not be loaded.', error);
      return false;
    });
    return loadPromise;
  }

  function countries() {
    return [...new Set(rows.map(row => row.country))].sort((a, b) => a.localeCompare(b, 'en'));
  }

  function cities(country) {
    return rows.filter(row => row.country === country)
      .sort((a, b) => a.name.localeCompare(b.name, 'en') || a.region.localeCompare(b.region, 'en'));
  }

  function findCity(id) { return rows.find(row => String(row.id) === String(id)) || null; }

  window.ORIGEN_LOCATIONS = { load, countries, cities, findCity, get ready() { return rows.length > 0; } };
})();
