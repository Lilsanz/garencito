/* =========================================================
   Garencito — Data Module
   Handles content loading, saving, persistence via
   localStorage, and JSON import/export.
   ========================================================= */

const DataModule = (() => {
  const STORAGE_KEY = 'garencito_data';
  let currentData = null;

  /**
   * Load default content from the JSON file.
   * Falls back to the bundled default if fetch fails.
   */
  async function loadDefaultData() {
    try {
      const res = await fetch('data/content.json');
      if (!res.ok) throw new Error('Failed to load content.json');
      currentData = await res.json();
      console.log('DataModule: loaded from content.json, gallery:', (currentData.gallery || []).length);
      return cloneData(currentData);
    } catch (err) {
      console.warn('DataModule: could not fetch content.json, using embedded defaults:', err);
      currentData = getEmbeddedDefaults();
      console.log('DataModule: loaded from embedded defaults, gallery:', (currentData.gallery || []).length);
      return cloneData(currentData);
    }
  }

  /**
   * Save current data to localStorage.
   */
  function saveToStorage(data) {
    try {
      const toStore = data || currentData;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      currentData = toStore;
      return true;
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
      return false;
    }
  }

  /**
   * Load data from localStorage, or return null.
   */
  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        currentData = JSON.parse(stored);
        return cloneData(currentData);
      }
      return null;
    } catch (err) {
      console.warn('Failed to load from localStorage:', err);
      return null;
    }
  }

  /**
   * Check if data exists in localStorage.
   */
  function hasStoredData() {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  /**
   * Initialize data: prefer localStorage, fall back to defaults.
   */
  async function init() {
    if (hasStoredData()) {
      var loaded = loadFromStorage();
      if (loaded) {
        currentData = loaded;
        console.log('DataModule: loaded from localStorage, gallery:', (loaded.gallery || []).length);
        return cloneData(currentData);
      }
      console.warn('DataModule: stored data corrupted, reloading defaults');
      localStorage.removeItem(STORAGE_KEY);
    } else {
      console.log('DataModule: no stored data, loading defaults');
    }
    return await loadDefaultData();
  }

  /**
   * Get a clone of the current data.
   */
  function getData() {
    return cloneData(currentData);
  }

  /**
   * Replace all data (e.g. on import).
   */
  function setData(data) {
    var cloned = cloneData(data);
    if (saveToStorage(cloned)) {
      currentData = cloned;
    } else {
      console.error('setData: failed to persist to localStorage, data not updated');
    }
  }

  /**
   * Update specific section of data.
   */
  function updateSection(section, value) {
    if (!currentData) return false;
    currentData[section] = cloneData(value);
    saveToStorage(currentData);
    return true;
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
   * Returns { success: boolean, message: string }
   */
  function importJSON(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.name) {
        return { success: false, message: 'El JSON debe contener al menos un nombre (name).' };
      }
      currentData = cloneData(parsed);
      saveToStorage(currentData);
      return { success: true, message: 'Datos importados correctamente.' };
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

  /**
   * Deep clone helper.
   */
  function cloneData(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Embedded default data as fallback.
   */
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
