/* ════════════════════════════════════════════════════════════
   Garencito — Comments Module
   Guestbook with name, last name & message stored in localStorage
   ════════════════════════════════════════════════════════════ */

const CommentsModule = (() => {
  const STORAGE_KEY = 'garencito_comments';

  function getAll() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function saveAll(comments) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
      return true;
    } catch {
      return false;
    }
  }

  function add(nombre, apellido, mensaje) {
    const comments = getAll();
    comments.push({
      id: Date.now(),
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      mensaje: mensaje.trim(),
      fecha: new Date().toISOString()
    });
    return saveAll(comments);
  }

  function remove(id) {
    const comments = getAll().filter(c => c.id !== id);
    return saveAll(comments);
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function render(container) {
    if (!container) return;
    const comments = getAll();

    if (!comments.length) {
      container.innerHTML = `
        <div class="comments__empty">
          <span class="comments__empty-icon" aria-hidden="true">✧</span>
          <p>Aún no hay mensajes. ¡Sé el primero en dejar una huella!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = comments.slice().reverse().map(c => {
      const date = new Date(c.fecha);
      const dateStr = date.toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
      return `
        <div class="comments__item">
          <div class="comments__item-header">
            <div class="comments__item-avatar" aria-hidden="true">
              ${(c.nombre.charAt(0) + c.apellido.charAt(0)).toUpperCase()}
            </div>
            <div>
              <div class="comments__item-name">${escapeHtml(c.nombre)} ${escapeHtml(c.apellido)}</div>
              <div class="comments__item-date">${dateStr}</div>
            </div>
          </div>
          <p class="comments__item-text">${escapeHtml(c.mensaje)}</p>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { getAll, add, remove, clearAll, render };
})();
