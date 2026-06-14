/* ════════════════════════════════════════════════════════════
   Garencito v2 — Complex Animations Module
   Parallax · Scroll Sequences · 3D Tilt · Morph · Touch
   ════════════════════════════════════════════════════════════ */

const AnimationsModule = (() => {
  /* ─── CUSTOM CURSOR (desktop only) ─── */
  function initCursor() {
    const cursor = document.getElementById('cursor');
    if (!cursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const inner = cursor.querySelector('.cursor__inner');
    let mx = 0, my = 0;
    let cx = 0, cy = 0;
    let rafId = null;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.opacity = '1';
      if (!rafId) rafId = requestAnimationFrame(tick);
    });

    document.addEventListener('mouseleave', () => {
      cursor.style.opacity = '0';
    });

    function tick() {
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      rafId = null;
    }

    // Hover effects on interactive elements
    document.querySelectorAll('a, button, .gallery__item, .essence__card, .moments__card, .pet__area')
      .forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('cursor--active'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--active'));
      });
  }

  /* ─── PROGRESS BAR ─── */
  function initProgress() {
    const bar = document.getElementById('progress');
    if (!bar) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          bar.style.width = docHeight > 0 ? `${(scrollTop / docHeight) * 100}%` : '0%';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ─── PARALLAX HERO ─── */
  function initHeroParallax() {
    const layers = document.querySelectorAll('.hero__layer');
    const hero = document.getElementById('hero');
    if (!layers.length || !hero) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = hero.getBoundingClientRect();
          const progress = 1 - (rect.bottom / (window.innerHeight + rect.height));
          const clamped = Math.max(0, Math.min(1, progress));

          layers.forEach((layer) => {
            const depth = parseFloat(layer.dataset.depth) || 0;
            const y = clamped * 150 * depth;
            const scale = 1 - clamped * 0.08 * depth;
            layer.style.transform = `translateY(${y}px) scale(${scale})`;
          });

          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ─── SCROLL REVEAL (IntersectionObserver) ─── */
  function initScrollReveal() {
    const els = document.querySelectorAll('[data-anim]');
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = entry.target.dataset.animDelay || 0;
            setTimeout(() => {
              entry.target.classList.add('is-visible');
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    els.forEach((el) => observer.observe(el));
  }

  /* ─── 3D TILT ON CARDS ─── */
  function initTilt() {
    const cards = document.querySelectorAll('.moments__card');
    if (!cards.length) return;

    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
          `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-2px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg) translateY(0)';
      });

      // Touch support
      let touchStartX, touchStartY;
      card.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
      }, { passive: true });

      card.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        const rect = card.getBoundingClientRect();
        const x = (t.clientX - rect.left) / rect.width - 0.5;
        const y = (t.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
          `perspective(600px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
      }, { passive: true });

      card.addEventListener('touchend', () => {
        card.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg)';
      }, { passive: true });
    });
  }

  /* ─── MOBILE NAV ACTIVE STATE ─── */
  function initMobileNav() {
    const links = document.querySelectorAll('.nav-mobile__link');
    const sections = document.querySelectorAll('section[id]');
    if (!links.length || !sections.length) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          let current = 'hero';
          const scrollY = window.scrollY + 120;

          sections.forEach((sec) => {
            const top = sec.offsetTop;
            const bottom = top + sec.offsetHeight;
            if (scrollY >= top && scrollY < bottom) {
              current = sec.id;
            }
          });

          links.forEach((link) => {
            const section = link.dataset.section;
            link.classList.toggle('is-active', section === current);
          });

          // Desktop nav too
          document.querySelectorAll('.nav-desktop__link').forEach((link) => {
            const section = link.dataset.section;
            link.classList.toggle('is-active', section === current);
          });

          // Desktop scrolled state
          const navDesktop = document.getElementById('navDesktop');
          if (navDesktop) {
            navDesktop.classList.toggle('nav-desktop--scrolled', window.scrollY > 60);
          }

          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ─── SMOOTH ANCHOR SCROLL ─── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId === '#') return;
        const target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();

        const offset = window.innerWidth >= 768 ? 80 : 20;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ─── SUBTLE BACKGROUND PARTICLES ─── */
  function initParticles() {
    const wrapper = document.getElementById('app-wrapper');
    if (!wrapper) return;

    let container = document.getElementById('bgParticles');
    if (!container) {
      container = document.createElement('div');
      container.id = 'bgParticles';
      container.style.cssText = 'position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden';
      wrapper.insertBefore(container, wrapper.firstChild);
    }

    const colors = ['#96A78D', '#B6CEB4', '#D9E9CF', '#8BA87D', '#C4D8C0'];
    const count = Math.min(18, Math.floor(window.innerWidth / 60));

    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'bg-particle';
      const size = 2 + Math.random() * 4;
      p.style.cssText = `
        left:${Math.random() * 100}%;top:${Math.random() * 100}%;
        width:${size}px;height:${size}px;
        background:${colors[i % colors.length]};
        opacity:${0.04 + Math.random() * 0.06};
        animation-duration:${20 + Math.random() * 30}s;
        animation-delay:${Math.random() * -40}s;
      `;
      container.appendChild(p);
    }
  }

  /* ─── HERO SCROLL INDICATOR FADE ─── */
  function initHeroScrollFade() {
    const indicator = document.getElementById('heroScroll');
    if (!indicator) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const opacity = Math.max(0, 1 - window.scrollY / 120);
          indicator.style.opacity = opacity;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ─── DEVICE MOTION 3D PARALLAX ─── */
  function initDeviceMotion() {
    const wrapper = document.getElementById('app-wrapper');
    if (!wrapper) return;
    if (!window.DeviceOrientationEvent) return;

    let beta = 0, gamma = 0;
    let targetBeta = 0, targetGamma = 0;
    let rafId = null;
    let enabled = false;

    function handleOrientation(event) {
      targetBeta = event.beta || 0;
      targetGamma = event.gamma || 0;
    }

    function startMotion() {
      if (enabled) return;
      enabled = true;

      function tick() {
        beta += (targetBeta - beta) * 0.08;
        gamma += (targetGamma - gamma) * 0.08;

        const x = -gamma * 0.15;
        const y = -beta * 0.1;
        const rx = -gamma * 0.03;
        const ry = beta * 0.02;

        wrapper.style.transform =
          `rotateX(${ry}deg) rotateY(${rx}deg) translateX(${x}px) translateY(${y}px)`;

        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    }

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const requestPermission = () => {
        DeviceOrientationEvent.requestPermission()
          .then(state => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
              startMotion();
            }
          })
          .catch(() => {});
        document.removeEventListener('touchstart', requestPermission);
        document.removeEventListener('click', requestPermission);
      };
      document.addEventListener('touchstart', requestPermission);
      document.addEventListener('click', requestPermission);
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
      startMotion();
    }
  }

  /* ─── GALLERY ITEMS HOVER TILT (desktop) ─── */
  function initGalleryTilt() {
    const items = document.querySelectorAll('.gallery__item');
    if (!items.length || !window.matchMedia('(hover: hover)').matches) return;

    items.forEach((item) => {
      item.addEventListener('mousemove', (e) => {
        const rect = item.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        item.style.transform = `perspective(600px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) scale(1.02)`;
      });

      item.addEventListener('mouseleave', () => {
        item.style.transform = '';
      });
    });
  }

  /* ─── INIT ALL ─── */
  function init() {
    initCursor();
    initProgress();
    initScrollReveal();
    initMobileNav();
    initSmoothScroll();
    initParticles();
    initHeroScrollFade();
    initGalleryTilt();
    initDeviceMotion();
  }

  /* ─── Refresh after dynamic content ─── */
  function refresh() {
    initScrollReveal();
    initGalleryTilt();
  }

  return {
    init,
    refresh
  };
})();
