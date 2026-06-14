/* =========================================================
   Garencito — Data Module
   Loads and saves data to the file system via API (when
   local server is running), with fallback to content.json
   (static hosting / GitHub Pages).
   ========================================================= */

const DataModule = (() => {
  const STORAGE_KEY = 'garencito_data';
  let currentData = null;
  let _apiAvailable = null; // cache after first check

  async function _apiFetch(url, opts) {
    try {
      const res = await fetch(url, opts);
      if (res.ok) return res;
      return null;
    } catch (_) { return null; }
  }

  async function _checkApi() {
    if (_apiAvailable !== null) return _apiAvailable;
    const res = await _apiFetch('/api/data');
    _apiAvailable = res !== null && res.ok;
    return _apiAvailable;
  }

  /**
   * Load default content from content.json
   */
  async function loadDefaultData() {
    try {
      const res = await fetch('data/content.json');
      if (!res.ok) throw new Error('Failed to load content.json');
      currentData = await res.json();
      console.log('DataModule: loaded from content.json');
      return cloneData(currentData);
    } catch (err) {
      console.warn('DataModule: could not fetch content.json, using embedded defaults:', err);
      currentData = getEmbeddedDefaults();
      console.log('DataModule: loaded from embedded defaults');
      return cloneData(currentData);
    }
  }

  /**
   * Save data to file via API, with localStorage fallback.
   */
  async function saveToStorage(data) {
    const toStore = data || currentData;
    // Try API (local server writes to data/content.json)
    if (await _checkApi()) {
      const res = await _apiFetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toStore)
      });
      if (res && res.ok) {
        currentData = toStore;
        console.log('DataModule: saved to file via API');
        return true;
      }
      console.warn('DataModule: API save failed, falling back to localStorage');
    }
    // Fallback: localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      currentData = toStore;
      console.log('DataModule: saved to localStorage (fallback)');
      return true;
    } catch (err) {
      console.error('Failed to save:', err);
      return false;
    }
  }

  /**
   * Load data: localStorage first (backward compat), then API/file.
   */
  async function loadFromStorage() {
    // 1) Try localStorage first (user's saved data)
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        currentData = JSON.parse(stored);
        console.log('DataModule: loaded from localStorage');
        // Migrate to file if API available (for persistence across deploys)
        if (await _checkApi()) {
          const res = await _apiFetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentData)
          });
          if (res && res.ok) {
            localStorage.removeItem(STORAGE_KEY);
            console.log('DataModule: migrated localStorage data to file');
          }
        }
        return cloneData(currentData);
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }
    // 2) Try API / file
    const apiRes = await _apiFetch('/api/data');
    if (apiRes && apiRes.ok) {
      currentData = await apiRes.json();
      console.log('DataModule: loaded from file via API');
      return cloneData(currentData);
    }
    return null;
  }

  /**
   * Initialize data.
   */
  async function init() {
    var loaded = await loadFromStorage();
    if (loaded) return loaded;
    console.log('DataModule: no stored data, loading defaults');
    return await loadDefaultData();
  }

  function getData() {
    return cloneData(currentData);
  }

  /**
   * Replace all data, persisting to file (or fallback).
   */
  async function setData(data) {
    var cloned = cloneData(data);
    var ok = await saveToStorage(cloned);
    if (ok) {
      currentData = cloned;
    } else {
      console.error('setData: failed to persist, data not updated');
    }
  }

  /**
   * Update specific section of data.
   */
  async function updateSection(section, value) {
    if (!currentData) return false;
    currentData[section] = cloneData(value);
    return await saveToStorage(currentData);
  }

  /**
   * Export data as JSON string.
   */
  function exportJSON() {
    if (!currentData) return '{}';
    return JSON.stringify(currentData, null, 2);
  }

  /**
   * Import data from JSON string.
   */
  async function importJSON(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.name) {
        return { success: false, message: 'El JSON debe contener al menos un nombre (name).' };
      }
      currentData = cloneData(parsed);
      var ok = await saveToStorage(currentData);
      return { success: ok, message: ok ? 'Datos importados correctamente.' : 'Error al guardar los datos.' };
    } catch (err) {
      return { success: false, message: 'El archivo no contiene JSON válido.' };
    }
  }

  /**
   * Reset to default data from content.json
   */
  async function resetData() {
    localStorage.removeItem(STORAGE_KEY);
    return await loadDefaultData();
  }

  function cloneData(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  function getEmbeddedDefaults() {
    return {
      name: 'Garencito',
      nickname: 'Garen',
      subtitle: 'Un alma pequeña con un corazón infinito',
      hero_phrase: 'Llegó sin hacer ruido y lo llenó todo',
      hero_image: 'assets/images/hero.svg',
      bio_title: 'El día que llegó',
      bio: 'Llegó una tarde de octubre, envuelto en una caja más grande que él. Tenía los ojos aún cerrados y un maullido tan frágil que parecía un susurro. Desde ese momento, algo cambió en la casa. Los rincones antes vacíos de repente tenían sentido.',
      bio_image: 'assets/images/gallery/bio.svg',
      essence: {
        title: 'Su esencia',
        description: 'Garencito es pura contradicción hermosa.',
        traits: [
          { icon: 'moon', title: 'Espíritu nocturno', description: 'Cuando el mundo se duerme, él despierta.' },
          { icon: 'heart', title: 'Corazón generoso', description: 'Su amor no pide nada a cambio.' },
          { icon: 'star', title: 'Explorador nato', description: 'Cada caja es una nave espacial.' },
          { icon: 'feather', title: 'Elegancia innata', description: 'Camina como si el suelo fuera suyo.' }
        ],
        favorites: {
          food: ['Atún fresco', 'Pollo desmenuzado'],
          places: ['La ventana', 'El sofá', 'Debajo de la cama'],
          activities: ['Mirar pájaros', 'Dormir en el teclado', 'Cazar luces']
        }
      },
      moments: [
        { id: 1, type: 'text', title: 'La siesta más épica', description: 'Se quedó dormido en una posición absurda.' }
      ],
      memories: [
        { id: 1, text: 'La primera vez que ronroneó en mi pecho, supe que había encontrado un hogar.' }
      ],
      gallery: [
        { id: 1, src: 'assets/images/gallery/photo1.svg', alt: 'Foto de Garencito', title: 'Atardecer', featured: true }
      ],
      footer: {
        signature: 'Hecho con ronroneos infinitos',
        credit: 'Garencito ∞ 2026'
      },
      settings: {
        show_bio: true,
        show_essence: true,
        show_moments: true,
        show_memories: true,
        show_gallery: true,
        primary_color: '#96A78D',
        secondary_color: '#B6CEB4',
        accent_color: '#D9E9CF'
      }
    };
  }

  return {
    init,
    getData,
    setData,
    updateSection,
    saveToStorage,
    loadFromStorage,
    hasStoredData,
    exportJSON,
    importJSON,
    resetData
  };
})();
