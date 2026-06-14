/* =========================================================
   Garencito — Admin Panel Script (v3)
   Full CRUD for gallery, bio, comments, and settings.
   ========================================================= */

let adminData = null;

(async function initAdmin() {
  try {
    adminData = await DataModule.init();
    renderAdmin();
    attachEventListeners();
  } catch (err) {
    console.error('Admin init failed:', err);
    showAlert('error', 'Error al cargar los datos.');
  }
})();

function renderAdmin() {
  if (!adminData) return;

  const headerTitle = document.querySelector('.admin-header__title');
  if (headerTitle) headerTitle.textContent = `⬡ ${adminData.name || 'Garencito'} · Admin`;
  document.title = `Administrar — ${adminData.name || 'Garencito'}`;

  setVal('adminName', adminData.name);
  setVal('adminNickname', adminData.nickname);
  setVal('adminSubtitle', adminData.subtitle);
  setVal('adminPhrase', adminData.hero_phrase);
  setVal('adminHeroImage', adminData.hero_image);
  setVal('adminBioTitle', adminData.bio_title);
  setVal('adminBio', adminData.bio);
  setVal('adminBioImage', adminData.bio_image);

  setVal('adminFooterSignature', adminData.footer?.signature);
  setVal('adminFooterCredit', adminData.footer?.credit);

  const s = adminData.settings || {};
  setToggle('adminShowBio', s.show_bio !== false);
  setToggle('adminShowGallery', s.show_gallery !== false);
  setVal('adminColorPrimary', s.primary_color || '#96A78D');
  setVal('adminColorSecondary', s.secondary_color || '#B6CEB4');
  setVal('adminColorAccent', s.accent_color || '#D9E9CF');

  renderGalleryList(adminData.gallery || []);
  renderVideosList(adminData.videos || []);
  renderCommentsList();
  initImageAdjusters();
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? '';
}

function setToggle(id, checked) {
  const el = document.getElementById(id);
  if (el) el.setAttribute('aria-checked', checked ? 'true' : 'false');
}

function getVal(id) {
  return document.getElementById(id)?.value?.trim() || '';
}

function isToggled(id) {
  const el = document.getElementById(id);
  return el ? el.getAttribute('aria-checked') === 'true' : true;
}

function textareaToList(text) {
  return text.split('\n').map(s => s.trim()).filter(Boolean);
}

function attachEventListeners() {
  document.getElementById('adminSaveAll')?.addEventListener('click', saveAll);
  document.getElementById('adminExport')?.addEventListener('click', exportData);
  document.getElementById('adminImportBtn')?.addEventListener('click', () => {
    document.getElementById('adminImportFile').click();
  });
  document.getElementById('adminImportFile')?.addEventListener('change', importData);
  document.getElementById('adminReset')?.addEventListener('click', resetData);

  document.getElementById('adminAddGallery')?.addEventListener('click', () => openModal('gallery'));
  document.getElementById('adminAddVideo')?.addEventListener('click', () => openModal('video'));
  document.getElementById('adminClearComments')?.addEventListener('click', clearAllComments);

  document.getElementById('adminResetPet')?.addEventListener('click', () => {
    localStorage.removeItem('garencito_pet_count');
    showAlert('info', 'Contador de caricias reiniciado en este navegador.');
  });

  document.querySelectorAll('.admin-toggle__switch').forEach(sw => {
    sw.addEventListener('click', () => {
      const checked = sw.getAttribute('aria-checked') === 'true';
      sw.setAttribute('aria-checked', (!checked).toString());
    });
  });

  document.querySelectorAll('.admin-modal__close, .admin-modal__btn--cancel').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  document.getElementById('adminModalSave')?.addEventListener('click', saveModalItem);

  document.getElementById('adminModal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  ['adminColorPrimary', 'adminColorSecondary', 'adminColorAccent'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', e => {
      const root = document.documentElement;
      if (id === 'adminColorPrimary') {
        root.style.setProperty('--c-primary', e.target.value);
        root.style.setProperty('--c-primary-dim', hexToRgba(e.target.value, 0.3));
        root.style.setProperty('--c-primary-rgb', hexToRgbStr(e.target.value));
      }
      if (id === 'adminColorSecondary') root.style.setProperty('--c-secondary', e.target.value);
      if (id === 'adminColorAccent') root.style.setProperty('--c-accent', e.target.value);
    });
  });
}

async function saveAll() {
  if (!adminData) return;

  const updates = {
    name: getVal('adminName'),
    nickname: getVal('adminNickname'),
    subtitle: getVal('adminSubtitle'),
    hero_phrase: getVal('adminPhrase'),
    hero_image: getVal('adminHeroImage'),
    bio_title: getVal('adminBioTitle'),
    bio: getVal('adminBio'),
    bio_image: getVal('adminBioImage'),
    hero_img_fit: document.getElementById('heroImgFit')?.value || 'cover',
    hero_img_pos_x: parseInt(document.getElementById('heroImgPosX')?.value) || 50,
    hero_img_pos_y: parseInt(document.getElementById('heroImgPosY')?.value) || 50,
    bio_img_fit: document.getElementById('bioImgFit')?.value || 'cover',
    bio_img_pos_x: parseInt(document.getElementById('bioImgPosX')?.value) || 50,
    bio_img_pos_y: parseInt(document.getElementById('bioImgPosY')?.value) || 50,
    footer: {
      signature: getVal('adminFooterSignature'),
      credit: getVal('adminFooterCredit')
    },
    videos: adminData.videos || [],
    settings: {
      show_bio: isToggled('adminShowBio'),
      show_gallery: isToggled('adminShowGallery'),
      show_videos: isToggled('adminShowVideos'),
      primary_color: getVal('adminColorPrimary'),
      secondary_color: getVal('adminColorSecondary'),
      accent_color: getVal('adminColorAccent')
    }
  };

  Object.assign(adminData, updates);
  await DataModule.setData(adminData);
  showAlert('success', 'Todo guardado correctamente.');
}

/* ---- Gallery ---- */
function renderGalleryList(gallery) {
  const container = document.getElementById('adminGalleryList');
  if (!container) return;

  if (!gallery.length) {
    container.innerHTML = '<div class="admin-empty">No hay fotos en la galería</div>';
    return;
  }

  container.innerHTML = gallery.map((g, i) => `
    <div class="admin-card-item">
      <div class="admin-card-item__content">
        <div class="admin-card-item__title">${g.title || 'Sin título'}</div>
        <div class="admin-card-item__preview">${g.src || ''}</div>
      </div>
      <div class="admin-card-item__actions">
        <button class="admin-card-item__btn admin-card-item__btn--edit" data-edit="gallery" data-index="${i}">Editar</button>
        <button class="admin-card-item__btn admin-card-item__btn--delete" data-delete="gallery" data-index="${i}">Eliminar</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('[data-edit="gallery"]').forEach(btn => {
    btn.addEventListener('click', () => openModal('gallery', parseInt(btn.dataset.index)));
  });
  container.querySelectorAll('[data-delete="gallery"]').forEach(btn => {
    btn.addEventListener('click', () => deleteGalleryItem(parseInt(btn.dataset.index)));
  });
}

/* ---- Comments ---- */
function renderCommentsList() {
  const container = document.getElementById('adminCommentsList');
  if (!container) return;

  if (typeof CommentsModule === 'undefined' || !CommentsModule.getAll) {
    container.innerHTML = '<div class="admin-empty">Error: comments.js no está cargado</div>';
    return;
  }
  const comments = CommentsModule.getAll();

  if (!comments.length) {
    container.innerHTML = '<div class="admin-empty">No hay mensajes en el libro de visitas</div>';
    return;
  }

  container.innerHTML = comments.slice().reverse().map(c => {
    const date = new Date(c.fecha);
    const dateStr = date.toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    return `
      <div class="admin-card-item">
        <div class="admin-card-item__content">
          <div class="admin-card-item__title">${c.nombre} ${c.apellido}</div>
          <div class="admin-card-item__preview">${c.mensaje}</div>
          <div style="font-size:.6875rem;color:var(--c-text-muted);margin-top:4px">${dateStr}</div>
        </div>
        <div class="admin-card-item__actions">
          <button class="admin-card-item__btn admin-card-item__btn--delete" data-comment-id="${c.id}">Eliminar</button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('[data-comment-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('¿Eliminar este mensaje?')) {
        CommentsModule.remove(parseInt(btn.dataset.commentId, 10));
        renderCommentsList();
        showAlert('info', 'Mensaje eliminado.');
      }
    });
  });
}

function clearAllComments() {
  if (!confirm('¿Borrar todos los mensajes del libro de visitas? Esta acción no se puede deshacer.')) return;
  CommentsModule.clearAll();
  renderCommentsList();
  showAlert('info', 'Todos los mensajes han sido borrados.');
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ---- Image Resize ---- */
function resizeImage(file, maxDim, quality, callback) {
  var reader = new FileReader();
  reader.onload = function (e) {
    var img = new Image();
    img.onload = function () {
      var w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        var ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ---- File Picker ---- */
function createFilePicker(container, targetInputId, accept) {
  if (!accept) accept = 'image/*';
  var isVideo = accept.indexOf('video') !== -1;

  container.innerHTML =
    '<button type="button" class="admin-file-picker__btn">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
        '<polyline points="17 8 12 3 7 8"/>' +
        '<line x1="12" y1="3" x2="12" y2="15"/>' +
      '</svg>' +
      (isVideo ? 'Subir video' : 'Subir foto') +
    '</button>' +
    '<input type="file" accept="' + accept + '" style="display:none">';

  var btn = container.querySelector('.admin-file-picker__btn');
  var fileInput = container.querySelector('input[type="file"]');

  btn.addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    var file = this.files[0];
    if (!file) return;

    if (isVideo) {
      // Video: fill suggested path, don't store data URL (too large)
      var textInput = document.getElementById(targetInputId);
      if (textInput) {
        textInput.value = 'assets/videos/' + file.name;
        textInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else {
      // Image: resize to 1920px max dimension, JPEG quality 0.85
      btn.textContent = 'Procesando...';
      btn.disabled = true;
      resizeImage(file, 1920, 0.85, function (dataUrl) {
        var textInput = document.getElementById(targetInputId);
        if (textInput) {
          textInput.value = dataUrl;
          textInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        btn.innerHTML =
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">' +
            '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
            '<polyline points="17 8 12 3 7 8"/>' +
            '<line x1="12" y1="3" x2="12" y2="15"/>' +
          '</svg>' +
          'Subir foto';
        btn.disabled = false;
      });
    }

    this.value = '';
  });
}

/* ---- Image Adjuster ---- */
function createImgAdjuster(container, opts) {
  const {
    src = '',
    fit = 'cover',
    posX = 50,
    posY = 50,
    hiddenInputs = null,
    srcInput = null
  } = opts || {};

  let state = { src, fit, posX, posY };

  function render() {
    const imgSrc = state.src || '';
    const imgStyle = 'object-fit:' + state.fit + ';object-position:' + state.posX + '% ' + state.posY + '%';

    container.innerHTML =
      '<div class="img-adjuster" data-fit="' + state.fit + '" data-pos-x="' + state.posX + '" data-pos-y="' + state.posY + '">' +
        '<div class="img-adjuster__preview">' +
          '<div class="img-adjuster__frame">' +
            '<img class="img-adjuster__img" src="' + escapeAttr(imgSrc) + '" alt="Preview" style="' + imgStyle + '" loading="lazy">' +
            '<div class="img-adjuster__crosshair" style="left:' + state.posX + '%;top:' + state.posY + '%"></div>' +
          '</div>' +
          '<div class="img-adjuster__hint">Haz clic en la imagen para ajustar el punto de foco</div>' +
        '</div>' +
        '<div class="img-adjuster__controls">' +
          '<div class="img-adjuster__fit-group">' +
            '<span class="img-adjuster__label">Ajuste:</span>' +
            '<button class="img-adjuster__fit-btn' + (state.fit === 'cover' ? ' is-active' : '') + '" data-fit="cover">Cubrir</button>' +
            '<button class="img-adjuster__fit-btn' + (state.fit === 'contain' ? ' is-active' : '') + '" data-fit="contain">Contener</button>' +
          '</div>' +
          '<div class="img-adjuster__coords">' +
            '<span class="img-adjuster__coord-label">Foco: ' + state.posX + '% ' + state.posY + '%</span>' +
            '<button class="img-adjuster__reset-btn">Restaurar</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      (hiddenInputs
        ? '<input type="hidden" id="' + hiddenInputs.fit + '" value="' + state.fit + '">' +
          '<input type="hidden" id="' + hiddenInputs.posX + '" value="' + state.posX + '">' +
          '<input type="hidden" id="' + hiddenInputs.posY + '" value="' + state.posY + '">'
        : '');

    attachEvents();
  }

  function attachEvents() {
    var frame = container.querySelector('.img-adjuster__frame');
    if (frame) {
      frame.addEventListener('click', function (e) {
        var rect = this.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        state.posX = Math.round(Math.min(100, Math.max(0, x)));
        state.posY = Math.round(Math.min(100, Math.max(0, y)));
        updateUI();
      });
    }

    container.querySelectorAll('.img-adjuster__fit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.fit = this.dataset.fit;
        updateUI();
      });
    });

    var resetBtn = container.querySelector('.img-adjuster__reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        state.posX = 50;
        state.posY = 50;
        state.fit = 'cover';
        updateUI();
      });
    }

    if (srcInput) {
      var srcEl = document.getElementById(srcInput);
      if (srcEl) {
        srcEl.addEventListener('input', function () {
          state.src = this.value;
          var img = container.querySelector('.img-adjuster__img');
          if (img) img.src = this.value || '';
        });
      }
    }
  }

  function updateUI() {
    var el = container.querySelector('.img-adjuster');
    var img = container.querySelector('.img-adjuster__img');
    var crosshair = container.querySelector('.img-adjuster__crosshair');
    var coordLabel = container.querySelector('.img-adjuster__coord-label');
    var fitBtns = container.querySelectorAll('.img-adjuster__fit-btn');

    if (el) {
      el.dataset.fit = state.fit;
      el.dataset.posX = state.posX;
      el.dataset.posY = state.posY;
    }
    if (img) {
      img.style.objectFit = state.fit;
      img.style.objectPosition = state.posX + '% ' + state.posY + '%';
    }
    if (crosshair) {
      crosshair.style.left = state.posX + '%';
      crosshair.style.top = state.posY + '%';
    }
    if (coordLabel) {
      coordLabel.textContent = 'Foco: ' + state.posX + '% ' + state.posY + '%';
    }
    fitBtns.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.fit === state.fit);
    });

    if (hiddenInputs) {
      var fitIn = document.getElementById(hiddenInputs.fit);
      var xIn = document.getElementById(hiddenInputs.posX);
      var yIn = document.getElementById(hiddenInputs.posY);
      if (fitIn) fitIn.value = state.fit;
      if (xIn) xIn.value = state.posX;
      if (yIn) yIn.value = state.posY;
    }
  }

  render();
}

function initImageAdjusters() {
  if (!adminData) return;

  var heroContainer = document.getElementById('heroImgAdjuster');
  if (heroContainer) {
    createImgAdjuster(heroContainer, {
      src: document.getElementById('adminHeroImage')?.value || '',
      fit: adminData.hero_img_fit || 'cover',
      posX: adminData.hero_img_pos_x ?? 50,
      posY: adminData.hero_img_pos_y ?? 50,
      hiddenInputs: { fit: 'heroImgFit', posX: 'heroImgPosX', posY: 'heroImgPosY' },
      srcInput: 'adminHeroImage'
    });
  }
  var heroPicker = document.getElementById('heroFilePicker');
  if (heroPicker) createFilePicker(heroPicker, 'adminHeroImage');

  var bioContainer = document.getElementById('bioImgAdjuster');
  if (bioContainer) {
    createImgAdjuster(bioContainer, {
      src: document.getElementById('adminBioImage')?.value || '',
      fit: adminData.bio_img_fit || 'cover',
      posX: adminData.bio_img_pos_x ?? 50,
      posY: adminData.bio_img_pos_y ?? 50,
      hiddenInputs: { fit: 'bioImgFit', posX: 'bioImgPosX', posY: 'bioImgPosY' },
      srcInput: 'adminBioImage'
    });
  }
  var bioPicker = document.getElementById('bioFilePicker');
  if (bioPicker) createFilePicker(bioPicker, 'adminBioImage');
}

function initGalleryAdjuster(item) {
  var adjContainer = document.getElementById('galleryImgAdjuster');
  if (!adjContainer) return;
  createImgAdjuster(adjContainer, {
    src: item?.src || '',
    fit: item?.img_fit || 'cover',
    posX: item?.img_pos_x ?? 50,
    posY: item?.img_pos_y ?? 50,
    hiddenInputs: { fit: 'modalImgFit', posX: 'modalImgPosX', posY: 'modalImgPosY' },
    srcInput: 'modalGallerySrc'
  });

  var galleryPicker = document.getElementById('galleryFilePicker');
  if (galleryPicker) createFilePicker(galleryPicker, 'modalGallerySrc');
}

/* ---- Modal ---- */
function openModal(type, index = null) {
  const modal = document.getElementById('adminModal');
  const title = document.getElementById('adminModalTitle');
  const form = document.getElementById('adminModalForm');
  if (!modal || !title || !form) return;

  const collection = type === 'video' ? adminData?.videos : adminData?.gallery;
  const item = index !== null ? collection?.[index] : null;

  modal.dataset.editType = type;
  if (index !== null) { modal.dataset.editIndex = index; }
  else { delete modal.dataset.editIndex; }

  if (type === 'video') {
    title.textContent = (index !== null ? 'Editar' : 'Añadir') + ' video';
    form.innerHTML = buildVideoForm(item);
  } else {
    title.textContent = (index !== null ? 'Editar' : 'Añadir') + ' foto de galería';
    form.innerHTML = buildGalleryForm(item);
  }

  modal.classList.add('admin-modal--open');
  document.body.style.overflow = 'hidden';

  if (type === 'video') {
    var pickerEl = document.getElementById('videoFilePicker');
    if (pickerEl) createFilePicker(pickerEl, 'modalVideoSrc', 'video/*');
  } else {
    initGalleryAdjuster(item);
  }

  const firstInput = form.querySelector('input, textarea, select');
  setTimeout(() => firstInput?.focus(), 100);
}

function buildGalleryForm(item) {
  return `
    <div class="admin-form__group">
      <label class="admin-form__label" for="modalGalleryTitle">Título / pie de foto</label>
      <input class="admin-form__input" id="modalGalleryTitle" value="${escapeAttr(item?.title || '')}" placeholder="Ej: Atardecer">
    </div>
    <div class="admin-form__group">
      <label class="admin-form__label" for="modalGallerySrc">Ruta de imagen</label>
      <div style="display:flex;gap:8px;align-items:stretch;">
        <input class="admin-form__input" id="modalGallerySrc" value="${escapeAttr(item?.src || '')}" placeholder="assets/images/gallery/photo.jpg" style="flex:1;">
        <div id="galleryFilePicker" class="admin-file-picker" style="flex-shrink:0;"></div>
      </div>
    </div>
    <div id="galleryImgAdjuster" class="img-adjuster-wrap"></div>
    <div class="admin-form__group">
      <label class="admin-form__label" for="modalGalleryAlt">Texto alternativo</label>
      <input class="admin-form__input" id="modalGalleryAlt" value="${escapeAttr(item?.alt || '')}" placeholder="Descripción de la imagen">
    </div>
    <div class="admin-form__group">
      <label class="admin-form__label">
        <input type="checkbox" id="modalGalleryFeatured" ${item?.featured ? 'checked' : ''} style="accent-color:var(--c-primary);margin-right:0.5rem;">
        Destacada (ocupará más espacio)
      </label>
    </div>
  `;
}

function buildVideoForm(item) {
  return (
    '<div class="admin-form__group">' +
      '<label class="admin-form__label" for="modalVideoTitle">Título del video</label>' +
      '<input class="admin-form__input" id="modalVideoTitle" value="' + escapeAttr(item?.title || '') + '" placeholder="Ej: Primer paseo">' +
    '</div>' +
    '<div class="admin-form__group">' +
      '<label class="admin-form__label" for="modalVideoSrc">Archivo de video</label>' +
      '<div style="display:flex;gap:8px;align-items:stretch;">' +
        '<input class="admin-form__input" id="modalVideoSrc" value="' + escapeAttr(item?.src || '') + '" placeholder="assets/videos/video.mp4" style="flex:1;">' +
        '<div id="videoFilePicker" class="admin-file-picker" style="flex-shrink:0;"></div>' +
      '</div>' +
      '<div style="font-size:.75rem;color:var(--c-text-dim);margin-top:4px;">Usa una ruta física (ej: <code>assets/videos/video.mp4</code>). No se admiten data URLs.</div>' +
    '</div>' +
    '<div class="admin-form__group">' +
      '<label class="admin-form__label" for="modalVideoDescription">Descripción</label>' +
      '<textarea class="admin-form__textarea" id="modalVideoDescription" rows="3" placeholder="Describe el video...">' + escapeAttr(item?.description || '') + '</textarea>' +
    '</div>'
  );
}

async function saveModalItem() {
  const modal = document.getElementById('adminModal');
  const editIndex = modal?.dataset.editIndex;
  const editType = modal?.dataset.editType || 'gallery';
  if (!adminData) return;

  if (editType === 'video') {
    await saveVideoItem(editIndex);
    return;
  }

  const item = {
    id: editIndex ? (adminData.gallery?.[editIndex]?.id || Date.now()) : Date.now(),
    src: getVal('modalGallerySrc'),
    alt: getVal('modalGalleryAlt'),
    title: getVal('modalGalleryTitle'),
    featured: document.getElementById('modalGalleryFeatured')?.checked || false,
    img_fit: document.getElementById('modalImgFit')?.value || 'cover',
    img_pos_x: parseInt(document.getElementById('modalImgPosX')?.value) || 50,
    img_pos_y: parseInt(document.getElementById('modalImgPosY')?.value) || 50
  };

  if (!adminData.gallery) adminData.gallery = [];
  if (editIndex) {
    adminData.gallery[editIndex] = item;
  } else {
    adminData.gallery.push(item);
  }

  await DataModule.setData(adminData);
  renderGalleryList(adminData.gallery);
  console.log('Gallery saved, total items:', adminData.gallery.length, 'saved type:', editType);
  showAlert('success', editIndex ? 'Foto actualizada.' : 'Foto añadida.');
  closeModal();
}

async function deleteGalleryItem(index) {
  if (!adminData?.gallery) return;
  if (!confirm('¿Eliminar esta foto?')) return;
  adminData.gallery.splice(index, 1);
  await DataModule.setData(adminData);
  renderGalleryList(adminData.gallery);
  showAlert('info', 'Foto eliminada.');
}

/* ---- Videos ---- */
function renderVideosList(videos) {
  const container = document.getElementById('adminVideosList');
  if (!container) return;

  if (!videos.length) {
    container.innerHTML = '<div class="admin-empty">No hay videos</div>';
    return;
  }

  container.innerHTML = videos.map(function (v, i) {
    var src = v.src || '';
    var isLarge = src.indexOf('data:') !== -1 || src.length > 500000;
    var warning = isLarge ? '<span class="admin-badge admin-badge--warn">⚠ Reemplazar (data URL)</span>' : '';
    return (
      '<div class="admin-card-item">' +
        '<div class="admin-card-item__content">' +
          '<div class="admin-card-item__title">' + escapeAttr(v.title || 'Sin título') + ' ' + warning + '</div>' +
          '<div class="admin-card-item__preview">' + escapeAttr(isLarge ? '⚠ ' + src.substr(0, 40) + '…' : src) + '</div>' +
        '</div>' +
        '<div class="admin-card-item__actions">' +
          '<button class="admin-card-item__btn admin-card-item__btn--edit" data-edit-video="' + i + '">Editar</button>' +
          '<button class="admin-card-item__btn admin-card-item__btn--delete" data-delete-video="' + i + '">Eliminar</button>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  container.querySelectorAll('[data-edit-video]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openModal('video', parseInt(this.dataset.editVideo, 10));
    });
  });
  container.querySelectorAll('[data-delete-video]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      deleteVideoItem(parseInt(this.dataset.deleteVideo, 10));
    });
  });
}

async function saveVideoItem(editIndex) {
  var src = getVal('modalVideoSrc');

  if (src.indexOf('data:') !== -1 || src.length > 500000) {
    showAlert('error', 'El video debe ser un archivo físico (ruta), no un data URL. Usa "Subir video" para sugerir la ruta.');
    return;
  }

  var item = {
    id: editIndex ? (adminData.videos?.[editIndex]?.id || Date.now()) : Date.now(),
    title: getVal('modalVideoTitle'),
    src: src,
    description: getVal('modalVideoDescription')
  };

  if (!adminData.videos) adminData.videos = [];
  if (editIndex) {
    adminData.videos[editIndex] = item;
  } else {
    adminData.videos.push(item);
  }

  await DataModule.setData(adminData);
  renderVideosList(adminData.videos);
  showAlert('success', editIndex ? 'Video actualizado.' : 'Video añadido.');
  closeModal();
}

async function deleteVideoItem(index) {
  if (!adminData?.videos) return;
  if (!confirm('¿Eliminar este video?')) return;
  adminData.videos.splice(index, 1);
  await DataModule.setData(adminData);
  renderVideosList(adminData.videos);
  showAlert('info', 'Video eliminado.');
}

/* ---- Export ---- */
function exportData() {
  const json = DataModule.exportJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `garencito-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showAlert('success', 'Archivo exportado.');
}

function importData(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (ev) => {
    const result = await DataModule.importJSON(ev.target.result);
    if (result.success) {
      adminData = DataModule.getData();
      renderAdmin();
      showAlert('success', result.message);
    } else {
      showAlert('error', result.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

async function resetData() {
  if (!confirm('¿Restaurar datos de fábrica? Se perderán todos los cambios personalizados.')) return;
  adminData = await DataModule.resetData();
  renderAdmin();
  showAlert('info', 'Datos restaurados a valores originales.');
}

/* ---- Alert ---- */
function showAlert(type, message) {
  const container = document.getElementById('adminAlerts');
  if (!container) return;

  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const alert = document.createElement('div');
  alert.className = `admin-alert admin-alert--${type}`;
  alert.innerHTML = `
    <span>${icons[type] || ''}</span>
    <span>${message}</span>
    <button class="admin-alert__close" aria-label="Cerrar">&times;</button>
  `;

  container.appendChild(alert);
  alert.querySelector('.admin-alert__close').addEventListener('click', () => alert.remove());

  setTimeout(() => {
    alert.style.opacity = '0';
    alert.style.transition = 'opacity 0.3s';
    setTimeout(() => alert.remove(), 300);
  }, 4000);
}

function closeModal() {
  const modal = document.getElementById('adminModal');
  if (!modal) return;
  modal.classList.remove('admin-modal--open');
  delete modal.dataset.editIndex;
  document.body.style.overflow = '';
}

/* ---- Helpers ---- */
function hexToRgba(hex, alpha) {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgbStr(hex) {
  const { r, g, b } = parseHex(hex);
  return `${r}, ${g}, ${b}`;
}

function parseHex(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}
