/* ============================================================
   FIVE LETTER — interactions
   ============================================================ */

(function () {
  'use strict';

  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header + scroll progress ---------- */

  const header = $('#siteHeader');
  const bar = $('#scrollBar');

  let ticking = false;

  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle('is-scrolled', y > 24);

    if (bar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(y / max, 1) : 0;
      bar.style.transform = `scaleX(${progress})`;
    }

    setActiveLink(y);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  /* ---------- Active nav link ---------- */

  const navLinks = $$('.nav-desktop a');
  const navTargets = navLinks
    .map((link) => {
      const id = link.getAttribute('href');
      const section = id && id.length > 1 ? $(id) : null;
      return section ? { link, section } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.section.offsetTop - b.section.offsetTop);

  function setActiveLink(y) {
    if (!navTargets.length) return;
    const line = y + window.innerHeight * 0.42;
    let current = null;
    navTargets.forEach((item) => {
      const top = item.section.offsetTop;
      const bottom = top + item.section.offsetHeight;
      if (line >= top && line < bottom) current = item;
    });
    navLinks.forEach((link) => {
      link.classList.remove('is-active');
      link.removeAttribute('aria-current');
    });
    if (current) {
      current.link.classList.add('is-active');
      current.link.setAttribute('aria-current', 'true');
    }
  }

  /* ---------- Mobile menu ---------- */

  const menu = $('#mobileMenu');
  const menuToggle = $('#menuToggle');
  const menuClose = $('#menuClose');
  const menuLinks = $$('[data-menu-link]');
  const pageRegions = [$('main'), $('.site-footer'), $('.site-header')].filter(Boolean);
  let lastFocused = null;

  function openMenu() {
    lastFocused = document.activeElement;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    pageRegions.forEach((el) => { el.inert = true; });
    if (menuClose) menuClose.focus();
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    pageRegions.forEach((el) => { el.inert = false; });
    if (lastFocused) lastFocused.focus();
  }

  if (menuToggle) menuToggle.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);
  menuLinks.forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu();
  });

  /* ---------- Scroll reveal ---------- */

  const revealEls = $$('[data-reveal]');

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Count-up stats ---------- */

  const counters = $$('.count[data-count]');

  function countUp(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    if (prefersReduced) {
      el.textContent = String(target);
      return;
    }
    const duration = 1500;
    const start = performance.now();
    const from = 0;

    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(from + (target - from) * eased));
      if (t < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  if (counters.length) {
    window.setTimeout(() => counters.forEach(countUp), 800);
  }

  /* ---------- Service hover preview ---------- */

  const preview = $('#servicePreview');
  const previewImg = preview ? preview.querySelector('img') : null;
  const serviceRows = $$('.service-row');
  const canHover = window.matchMedia('(hover: hover) and (min-width: 981px)');

  if (preview && previewImg && canHover.matches) {
    let px = 0;
    let py = 0;
    let raf = null;

    function movePreview() {
      preview.style.left = `${px}px`;
      preview.style.top = `${py}px`;
      raf = null;
    }

    serviceRows.forEach((row) => {
      row.addEventListener('pointerenter', (e) => {
        const src = row.dataset.img;
        if (src) previewImg.src = src;
        preview.classList.add('is-on');
        px = e.clientX;
        py = e.clientY;
        movePreview();
      });

      row.addEventListener('pointermove', (e) => {
        px = e.clientX;
        py = e.clientY;
        if (!raf) raf = window.requestAnimationFrame(movePreview);
      });

      row.addEventListener('pointerleave', () => {
        preview.classList.remove('is-on');
      });
    });
  }

  /* ---------- Video lightbox ---------- */

  const lightbox = $('#lightbox');
  const lightboxVideo = $('#lightboxVideo');
  const lightboxTitle = $('#lightboxTitle');
  const lightboxClose = $('#lightboxClose');
  let lightboxTrigger = null;

  function openLightbox(id, title) {
    if (!lightbox || !lightboxVideo || !id) return;
    lightboxTrigger = document.activeElement;
    lightboxTitle.textContent = title || 'Now playing';
    lightboxVideo.innerHTML =
      `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="${title || 'Film'}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    document.body.classList.add('menu-open');
    if (typeof lightbox.showModal === 'function') {
      lightbox.showModal();
    } else {
      lightbox.setAttribute('open', '');
    }
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    if (lightbox.open && typeof lightbox.close === 'function') {
      lightbox.close();
    } else {
      lightbox.removeAttribute('open');
    }
    if (lightboxVideo) lightboxVideo.innerHTML = '';
    document.body.classList.remove('menu-open');
    if (lightboxTrigger) lightboxTrigger.focus();
  }

  $$('[data-video]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox(trigger.dataset.video, trigger.dataset.title);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);

  if (lightbox) {
    lightbox.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeLightbox();
    });
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    lightbox.addEventListener('close', () => {
      if (lightboxVideo) lightboxVideo.innerHTML = '';
      document.body.classList.remove('menu-open');
    });
  }

  /* ---------- Copy email ---------- */

  const copyBtn = $('#copyEmail');
  const toast = $('#toast');
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-on');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-on'), 2200);
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const email = copyBtn.dataset.email || 'osama@fiveletter.in';
      const label = copyBtn.querySelector('.copy-label');
      try {
        await navigator.clipboard.writeText(email);
      } catch (err) {
        const tmp = document.createElement('textarea');
        tmp.value = email;
        tmp.style.position = 'fixed';
        tmp.style.opacity = '0';
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand('copy'); } catch (e) { /* noop */ }
        document.body.removeChild(tmp);
      }
      if (label) {
        label.textContent = 'Copied';
        window.setTimeout(() => { label.textContent = 'Copy'; }, 2200);
      }
      showToast('Email copied — talk soon.');
    });
  }

  /* ---------- Footer year ---------- */

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Init ---------- */

  onScroll();
})();
