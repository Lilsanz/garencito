/* ════════════════════════════════════════════════════════════
   Garencito v3 — Main Site Script
   ════════════════════════════════════════════════════════════ */

(async () => {
  try {
    const data = await DataModule.init();
    applyTheme(data.settings);
    renderHero(data);
    renderBio(data);
    renderGallery(data);
    renderVideos(data);
    renderPet();
    renderComments();
    renderFooter(data);

    const navName = document.getElementById('navName');
    if (navName) navName.textContent = data.name || 'Garencito';
    document.title = `${data.name || 'Garencito'} — Universo de ternura`;

    initColorCycle(data.settings?.primary_color);
    AnimationsModule.init();
  } catch (err) {
    console.error('Init failed:', err);
  }
})();

function applyTheme(settings) {
  if (!settings) return;
  const r = document.documentElement;
  if (settings.primary_color) {
    r.style.setProperty('--c-primary', settings.primary_color);
    const rgb = hexToRgb(settings.primary_color);
    r.style.setProperty('--c-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    r.style.setProperty('--c-primary-dim', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
    r.style.setProperty('--c-primary-ghost', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)`);
  }
  if (settings.secondary_color) r.style.setProperty('--c-secondary', settings.secondary_color);
  if (settings.accent_color) r.style.setProperty('--c-accent', settings.accent_color);
}

function hexToRgb(hex) {
  return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
}

/* ─── HERO ─── */
function renderHero(data) {
  const img = document.getElementById('heroImage');
  if (img) {
    img.src = data.hero_image || 'assets/images/hero.svg';
    img.style.objectFit = data.hero_img_fit || 'cover';
    img.style.objectPosition = `${data.hero_img_pos_x ?? 50}% ${data.hero_img_pos_y ?? 50}%`;
  }

  const title = document.getElementById('heroName');
  if (title) title.textContent = data.name || 'Garencito';

  const sub = document.getElementById('heroSubtitle');
  if (sub) sub.textContent = data.subtitle || '';

  const phrase = document.getElementById('heroPhrase');
  if (phrase) phrase.textContent = data.hero_phrase || '';
}

/* ─── BIO ─── */
function renderBio(data) {
  if (data.settings?.show_bio === false) {
    const sec = document.getElementById('bio'); if (sec) sec.style.display = 'none';
    return;
  }

  const img = document.getElementById('bioImage');
  if (img) {
    img.src = data.bio_image || 'assets/images/gallery/bio.svg';
    img.style.objectFit = data.bio_img_fit || 'cover';
    img.style.objectPosition = `${data.bio_img_pos_x ?? 50}% ${data.bio_img_pos_y ?? 50}%`;
  }

  const tag = document.getElementById('bioTag');
  if (tag) tag.textContent = data.hero_phrase || 'Llegó sin hacer ruido';

  const title = document.getElementById('bioTitle');
  if (title) title.textContent = data.bio_title || 'El día que llegó';

  const text = document.getElementById('bioText');
  if (text) {
    const paragraphs = (data.bio || '').split('\n').filter(p => p.trim());
    if (paragraphs.length) {
      const first = paragraphs[0];
      text.innerHTML = `<p><span class="bio__dropcap">${first.charAt(0)}</span>${first.slice(1)}</p>` +
        paragraphs.slice(1).map(p => `<p>${p.trim()}</p>`).join('');
    } else {
      text.innerHTML = '<p>Una historia por contar...</p>';
    }
  }
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ─── PET ─── */
function renderPet() {
  const area = document.getElementById('petArea');
  if (!area) return;

  const charEl = document.getElementById('petCharacter');
  const faceEl = document.getElementById('petFace');
  const reactionEl = document.getElementById('petReaction');
  const counterEl = document.getElementById('petCounter');
  const msgEl = document.getElementById('petMessage');
  const floatingEl = document.getElementById('petFloating');

  const STORAGE_KEY = 'garencito_pet_count';
  let count = parseInt(localStorage.getItem(STORAGE_KEY)) || 0;

  const messages = [
    [0, 'Toca para darle amor ♥'],
    [1, '¡Qué bonito! ♥'],
    [10, 'Le encanta tu cariño'],
    [25, 'Está ronroneando muy feliz'],
    [50, 'Eres su persona favorita'],
    [100, '¡Eres el mejor humano del mundo!']
  ];

  function getMessage(c) {
    let msg = messages[0][1];
    for (let i = messages.length - 1; i >= 0; i--) {
      if (c >= messages[i][0]) { msg = messages[i][1]; break; }
    }
    return msg;
  }

  function updateUI() {
    if (counterEl) counterEl.textContent = count;
    if (msgEl) msgEl.textContent = getMessage(count);
    localStorage.setItem(STORAGE_KEY, count);
  }

  function spawnHearts() {
    if (!floatingEl) return;
    const heartCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < heartCount; i++) {
      const heart = document.createElement('span');
      heart.className = 'pet__heart';
      heart.textContent = '♥';
      heart.style.left = `${20 + Math.random() * 60}%`;
      heart.style.fontSize = `${1 + Math.random() * 1.2}rem`;
      heart.style.animationDuration = `${1.5 + Math.random() * 1}s`;
      floatingEl.appendChild(heart);
      setTimeout(() => heart.remove(), 3000);
    }
  }

  function handlePet(e) {
    if (e) e.preventDefault();
    count++;
    updateUI();
    spawnHearts();
    if (charEl) {
      charEl.style.transform = 'scale(1.15)';
      setTimeout(() => { if (charEl) charEl.style.transform = ''; }, 300);
    }
    if (reactionEl) {
      reactionEl.textContent = '♥';
      reactionEl.classList.add('is-visible');
      setTimeout(() => {
        reactionEl.classList.remove('is-visible');
        setTimeout(() => { if (reactionEl) reactionEl.textContent = ''; }, 200);
      }, 400);
    }
  }

  updateUI();
  let touched = false;
  area.addEventListener('touchstart', () => { touched = true; handlePet(); }, { passive: true });
  area.addEventListener('click', (e) => { if (touched) { touched = false; return; } handlePet(e); });
}

/* ─── GALLERY ─── */
function renderGallery(data) {
  if (data.settings?.show_gallery === false) {
    const sec = document.getElementById('gallery'); if (sec) sec.style.display = 'none';
    return;
  }

  const grid = document.getElementById('galleryGrid');
  if (grid) GalleryModule.render(grid, data.gallery || []);
}

/* ─── Helper ─── */
function escapeAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ─── VIDEOS ─── */
var _videoItems = [];

function renderVideos(data) {
  if (data.settings?.show_videos === false) {
    var sec = document.getElementById('videos'); if (sec) sec.style.display = 'none';
    return;
  }

  var grid = document.getElementById('videosGrid');
  if (!grid) return;

  var videos = data.videos || [];
  _videoItems = videos;

  if (!videos.length) {
    grid.innerHTML = '<div class="videos__error" style="grid-column:1/-1;">Aún no hay videos</div>';
    return;
  }

  var html = '';
  videos.forEach(function (v, i) {
    var src = v.src || '';
    var hasSrc = src && src !== '#' && src.indexOf('data:') === -1 && src.length < 500000;
    var title = escapeHtml(v.title || '');

    html += (
      '<div class="videos__item" data-video-index="' + i + '" role="button" tabindex="0" aria-label="Ver ' + escapeAttr(v.title || 'video') + '">' +
        (hasSrc
          ? '<video class="videos__item-video" src="' + escapeAttr(src) + '" preload="metadata" muted playsinline></video>' +
            '<div class="videos__item-overlay"></div>'
          : '<div class="videos__error" style="position:absolute;inset:0;">Sin video</div>') +
        '<div class="videos__item-play">' +
          '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
        '</div>' +
        (title ? '<div class="videos__item-title">' + title + '</div>' : '') +
      '</div>'
    );
  });

  grid.innerHTML = html;

  grid.querySelectorAll('.videos__item').forEach(function (el) {
    el.addEventListener('click', function () {
      var idx = parseInt(this.dataset.videoIndex, 10);
      openVideoPlayer(idx);
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openVideoPlayer(parseInt(this.dataset.videoIndex, 10)); }
    });
  });
}

function openVideoPlayer(index) {
  var item = _videoItems[index];
  if (!item) return;

  var player = document.getElementById('videoPlayer');
  var video = document.getElementById('videoPlayerVideo');
  var caption = document.getElementById('videoPlayerCaption');
  if (!player || !video || !caption) return;

  var src = item.src || '';
  var hasSrc = src && src !== '#' && src.indexOf('data:') === -1 && src.length < 500000;

  if (!hasSrc) return;

  video.src = src;
  caption.textContent = item.title || '';
  player.classList.add('video-player--open');
  document.body.style.overflow = 'hidden';

  var closeBtn = player.querySelector('.video-player__close');
  var backdrop = player.querySelector('.video-player__backdrop');

  function close() {
    player.classList.remove('video-player--open');
    video.pause();
    video.src = '';
    document.body.style.overflow = '';
    closeBtn.onclick = null;
    backdrop.onclick = null;
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
  }

  closeBtn.onclick = close;
  backdrop.onclick = close;
  document.addEventListener('keydown', onKey);

  video.play().catch(function () {});
}

/* ─── COMMENTS ─── */
function renderComments() {
  const list = document.getElementById('commentsList');
  if (list) CommentsModule.render(list);

  const form = document.getElementById('commentForm');
  if (!form) return;

  const nameInput = document.getElementById('commentName');
  const lastInput = document.getElementById('commentLastname');
  const msgInput = document.getElementById('commentMessage');
  const counter = document.getElementById('commentCounter');
  const success = document.getElementById('commentSuccess');

  msgInput?.addEventListener('input', () => {
    if (counter) counter.textContent = msgInput.value.length;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const nameErr = document.getElementById('commentNameError');
    if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
      nameErr.textContent = 'Mínimo 2 caracteres';
      nameErr.classList.add('is-visible'); nameInput.classList.add('is-error');
      valid = false;
    } else {
      nameErr.classList.remove('is-visible'); nameInput.classList.remove('is-error');
    }

    const lastErr = document.getElementById('commentLastnameError');
    if (!lastInput.value.trim() || lastInput.value.trim().length < 2) {
      lastErr.textContent = 'Mínimo 2 caracteres';
      lastErr.classList.add('is-visible'); lastInput.classList.add('is-error');
      valid = false;
    } else {
      lastErr.classList.remove('is-visible'); lastInput.classList.remove('is-error');
    }

    const msgErr = document.getElementById('commentMessageError');
    if (!msgInput.value.trim() || msgInput.value.trim().length < 5) {
      msgErr.textContent = 'Escribe un mensaje bonito (mín. 5 caracteres)';
      msgErr.classList.add('is-visible'); msgInput.classList.add('is-error');
      valid = false;
    } else {
      msgErr.classList.remove('is-visible'); msgInput.classList.remove('is-error');
    }

    if (!valid) return;

    CommentsModule.add(nameInput.value, lastInput.value, msgInput.value);
    success.classList.add('is-visible');
    form.reset();
    if (counter) counter.textContent = '0';
    if (list) CommentsModule.render(list);
    setTimeout(() => success.classList.remove('is-visible'), 5000);
  });
}

/* ─── FOOTER ─── */
function renderFooter(data) {
  const fn = document.getElementById('footerName');
  if (fn) fn.textContent = data.name || 'Garencito';

  const sig = document.getElementById('footerSignature');
  if (sig) sig.textContent = data.footer?.signature || 'Hecho con ronroneos infinitos';

  const credit = document.getElementById('footerCredit');
  if (credit) credit.textContent = data.footer?.credit || `${data.name || 'Garencito'} ∞ 2026`;
}

function lerpColor(a, b, t) {
  const ar = parseInt(a.slice(1,3), 16), ag = parseInt(a.slice(3,5), 16), ab = parseInt(a.slice(5,7), 16);
  const br = parseInt(b.slice(1,3), 16), bg = parseInt(b.slice(3,5), 16), bb = parseInt(b.slice(5,7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b2 = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b2.toString(16).padStart(2,'0')}`;
}

function initColorCycle(initialColor) {
  const palette = [
    initialColor || '#96A78D', '#A8BC9F', '#B6CEB4', '#C4D8C0', '#D9E9CF',
    '#C4D8C0', '#B6CEB4', '#A8BC9F'
  ];
  const r = document.documentElement;
  let cur = 0, nxt = 1, elapsed = 0;
  const DURATION = 28000;

  function tick() {
    elapsed += 16;
    const t = Math.min(1, elapsed / DURATION);
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const color = lerpColor(palette[cur % palette.length], palette[nxt % palette.length], eased);
    r.style.setProperty('--c-primary', color);
    const rgb = hexToRgb(color);
    r.style.setProperty('--c-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    r.style.setProperty('--c-primary-dim', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
    r.style.setProperty('--c-primary-ghost', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)`);
    if (t >= 1) { cur = nxt; nxt++; elapsed = 0; }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
