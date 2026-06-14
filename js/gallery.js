/* ════════════════════════════════════════════════════════════
   Garencito v2 — Gallery Module
   Dynamic mosaic · Touch swipe · Fluid lightbox
   ════════════════════════════════════════════════════════════ */

const GalleryModule = (() => {
  let currentIndex = 0;
  let items = [];

  /* ─── RENDER GRID ─── */
  function render(container, data) {
    if (!container) return;
    items = data || [];

    if (!items.length) {
      container.innerHTML = `
        <div class="gallery__item" style="grid-column:1/-1;aspect-ratio:2/1;border-radius:var(--r-lg)">
          <div class="placeholder-img">Aún no hay fotos en la galería</div>
        </div>
      `;
      return;
    }

    let html = '';
    items.forEach((item, i) => {
      const cls = [
        'gallery__item',
        item.featured ? 'gallery__item--featured' : '',
        i % 5 === 2 ? 'gallery__item--featured' : '',
        'reveal'
      ].filter(Boolean).join(' ');

      var posX = item.img_pos_x ?? 50;
      var posY = item.img_pos_y ?? 50;
      var fit = item.img_fit || 'cover';

      html += `
        <div class="${cls}"
             data-index="${i}"
             role="button"
             tabindex="0"
             aria-label="Ver ${item.alt || item.title || 'foto'}"
             style="transition-delay:${(i % 8) * 0.08}s">
          <img class="gallery__image"
               src="${item.src}"
               alt="${item.alt || item.title || 'Foto de galería'}"
               style="object-fit:${fit};object-position:${posX}% ${posY}%"
               loading="lazy"
               onerror="this.outerHTML='<div class=\\'placeholder-img\\'>Sin imagen</div>'">
          <div class="gallery__item-overlay">
            <span class="gallery__item-title">${item.title || ''}</span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Events
    container.querySelectorAll('.gallery__item').forEach((el) => {
      const idx = parseInt(el.dataset.index, 10);
      el.addEventListener('click', () => openLightbox(idx));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(idx); }
      });
    });
  }

  /* ─── LIGHTBOX ─── */
  function openLightbox(index) {
    if (!items.length) return;
    currentIndex = index;

    const lb = document.getElementById('lightbox');
    if (!lb) return;

    const img = document.getElementById('lightboxImage');
    const caption = document.getElementById('lightboxCaption');
    const counter = document.getElementById('lightboxCounter');

    if (!img || !caption || !counter) return;

    updateLightbox(img, caption, counter);

    lb.classList.add('lightbox--open');
    document.body.style.overflow = 'hidden';

    // Events
    const closeBtn = lb.querySelector('.lightbox__close');
    const prevBtn = lb.querySelector('.lightbox__nav--prev');
    const nextBtn = lb.querySelector('.lightbox__nav--next');

    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigate(-1, img, caption, counter);
      if (e.key === 'ArrowRight') navigate(1, img, caption, counter);
    };

    closeBtn.onclick = closeLightbox;
    prevBtn.onclick = () => navigate(-1, img, caption, counter);
    nextBtn.onclick = () => navigate(1, img, caption, counter);
    document.addEventListener('keydown', onKey);

    // Click backdrop to close
    lb.querySelector('.lightbox__backdrop').onclick = closeLightbox;

    // Touch swipe
    let startX = 0, startY = 0;
    lb.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    lb.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        navigate(dx < 0 ? 1 : -1, img, caption, counter);
      }
    }, { passive: true });

    // Pinch-to-zoom
    let initialDist = 0;
    let currentScale = 1;
    lb.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        initialDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    lb.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        currentScale = Math.max(0.5, Math.min(3, currentScale + (dist - initialDist) * 0.01));
        img.style.transform = `scale(${currentScale})`;
        initialDist = dist;
      }
    }, { passive: true });

    lb.addEventListener('touchend', () => {
      if (currentScale <= 1) {
        img.style.transform = 'scale(1)';
        currentScale = 1;
      }
    }, { passive: true });

    // Store cleanup
    lb._cleanup = () => {
      document.removeEventListener('keydown', onKey);
      closeBtn.onclick = null;
      prevBtn.onclick = null;
      nextBtn.onclick = null;
      lb.querySelector('.lightbox__backdrop').onclick = null;
    };
  }

  function updateLightbox(img, caption, counter) {
    const item = items[currentIndex];
    if (!item) return;

    img.style.transform = 'scale(1)';
    img.src = item.src;
    img.alt = item.alt || item.title || 'Foto de galería';
    caption.textContent = item.title || '';
    counter.textContent = `${currentIndex + 1} / ${items.length}`;
  }

  function navigate(dir, img, caption, counter) {
    if (items.length <= 1) return;
    currentIndex = (currentIndex + dir + items.length) % items.length;
    updateLightbox(img, caption, counter);
  }

  function closeLightbox() {
    const lb = document.getElementById('lightbox');
    if (!lb) return;

    lb.classList.remove('lightbox--open');
    if (lb._cleanup) lb._cleanup();
    document.body.style.overflow = '';
  }

  return { render, openLightbox, closeLightbox };
})();
