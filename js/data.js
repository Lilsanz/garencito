/* =========================================================
   Garencito — Data Module
   Persists data via localStorage. Falls back to content.json
   or embedded defaults. Export/Import JSON for file backup.
   ========================================================= */

const DataModule = (() => {
  const STORAGE_KEY = 'garencito_data';
  let currentData = null;

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
      return cloneData(currentData);
    }
  }

  function saveToStorage(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data || currentData));
      if (data) currentData = data;
      return true;
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
      return false;
    }
  }

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        currentData = JSON.parse(stored);
        return cloneData(currentData);
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }
    return null;
  }

  async function init() {
    const stored = loadFromStorage();
    if (stored) {
      console.log('DataModule: loaded from localStorage');
      return stored;
    }
    console.log('DataModule: no stored data, loading defaults');
    return await loadDefaultData();
  }

  function getData() {
    return cloneData(currentData);
  }

  function setData(data) {
    var cloned = cloneData(data);
    if (saveToStorage(cloned)) {
      currentData = cloned;
    } else {
      console.error('setData: failed to persist, data not updated');
    }
  }

  function updateSection(section, value) {
    if (!currentData) return false;
    currentData[section] = cloneData(value);
    saveToStorage(currentData);
    return true;
  }

  function exportJSON() {
    if (!currentData) return '{}';
    return JSON.stringify(currentData, null, 2);
  }

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
