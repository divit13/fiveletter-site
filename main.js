/* ============================================================
   FIVE LETTER — interactions & scroll direction
   Vanilla JS · Lenis · GSAP ScrollTrigger
   ============================================================ */

(function () {
  'use strict';

  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReduced = reducedQuery.matches;

  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const motion = !prefersReduced;

  if (hasGSAP) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.config({ ignoreMobileResize: true });
  }

  const html = document.documentElement;
  html.classList.toggle('has-motion', motion && hasGSAP);

  /* ------------------------------------------------------------
     Smooth scrolling
     ------------------------------------------------------------ */

  let lenis = null;

  if (motion && typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({
      autoRaf: false,
      lerp: 0.085,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      smoothWheel: true,
      syncTouch: false
    });

    if (hasGSAP) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => lenis.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => {
        lenis.raf(time);
        window.requestAnimationFrame(raf);
      };
      window.requestAnimationFrame(raf);
    }
  }

  function stopScroll() {
    if (lenis) lenis.stop();
  }
  function startScroll() {
    if (lenis) lenis.start();
  }

  function scrollToTarget(target) {
    if (!target) return;
    if (lenis) {
      lenis.scrollTo(target, { offset: 0, duration: 1.35 });
      return;
    }
    const y = target === document.body ? 0 : target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: motion ? 'smooth' : 'auto' });
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    if (menu && menu.classList.contains('is-open')) closeMenu(false);
    scrollToTarget(target);
  });

  /* ------------------------------------------------------------
     Header, progress, nav
     ------------------------------------------------------------ */

  const header = $('#siteHeader');
  const bar = $('#scrollBar');
  let lastY = window.scrollY || 0;
  let ticking = false;

  function onScrollFrame() {
    const y = window.scrollY || document.documentElement.scrollTop;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(y / max, 1) : 0;

    if (header) {
      header.classList.toggle('is-scrolled', y > 24);
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (y > 340 && goingDown && !(menu && menu.classList.contains('is-open'))) {
        header.classList.add('is-hidden');
      } else if (goingUp || y < 340) {
        header.classList.remove('is-hidden');
      }
    }

    if (bar) bar.style.transform = `scaleX(${progress})`;
    updateProcessActive();
    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScrollFrame);
    }
  }, { passive: true });

  const navLinks = $$('.nav-desktop a');

  function setActiveNav(activeLink) {
    navLinks.forEach((link) => {
      const isActive = link === activeLink;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  const navTargets = navLinks
    .map((link) => {
      const href = link.getAttribute('href');
      const section = href && href.length > 1 ? $(href) : null;
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  /* Process steps are activated by whichever sits closest to the viewport middle */
  const processListEl = $('.process-list');
  const processSteps = $$('[data-step]');

  function updateProcessActive() {
    if (!processListEl || !processSteps.length) return;
    const rect = processListEl.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    const middle = window.innerHeight * 0.5;
    let best = null;
    let bestDistance = Infinity;

    processSteps.forEach((step) => {
      const box = step.getBoundingClientRect();
      const center = box.top + box.height / 2;
      const distance = Math.abs(center - middle);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = step;
      }
    });

    processSteps.forEach((step) => {
      step.classList.toggle('is-active', step === best);
    });
  }

  if (hasGSAP && motion) {
    navTargets.forEach(({ link, section }) => {
      window.ScrollTrigger.create({
        trigger: section,
        start: 'top 45%',
        end: 'bottom 45%',
        onToggle: (self) => {
          if (self.isActive) setActiveNav(link);
        }
      });
    });
  } else {
    const updateNav = () => {
      const line = window.scrollY + window.innerHeight * 0.42;
      let current = null;
      navTargets.forEach((item) => {
        if (line >= item.section.offsetTop && line < item.section.offsetTop + item.section.offsetHeight) {
          current = item;
        }
      });
      setActiveNav(current ? current.link : null);
    };
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  }

  /* ------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------ */

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
    if (header) header.classList.remove('is-hidden');
    pageRegions.forEach((el) => { el.inert = true; });
    stopScroll();
    if (menuClose) menuClose.focus();
  }

  function closeMenu(restoreFocus = true) {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    pageRegions.forEach((el) => { el.inert = false; });
    startScroll();
    if (restoreFocus && lastFocused) lastFocused.focus();
  }

  if (menuToggle) menuToggle.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', () => closeMenu());
  menuLinks.forEach((link) => link.addEventListener('click', () => closeMenu(false)));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu && menu.classList.contains('is-open')) closeMenu();
  });

  /* ------------------------------------------------------------
     Count up
     ------------------------------------------------------------ */

  function countUp(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    if (prefersReduced) {
      el.textContent = String(target);
      return;
    }
    const duration = 1600;
    const start = performance.now();
    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  let statsStarted = false;
  function startStats() {
    if (statsStarted) return;
    statsStarted = true;
    $$('.count[data-count]').forEach((el, i) => {
      window.setTimeout(() => countUp(el), i * 90);
    });
  }

  /* ------------------------------------------------------------
     Loader
     ------------------------------------------------------------ */

  const loader = $('#loader');
  const loaderCount = $('#loaderCount');
  const loaderBar = $('#loaderBar');
  let introPlayed = false;

  function heroIntro() {
    if (introPlayed) return;
    introPlayed = true;
    startStats();
    if (!hasGSAP || !motion) return;

    const gsap = window.gsap;
    const lines = $$('.hero-title .line > span');

    gsap.set(lines, { yPercent: 116 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero-eyebrow', { opacity: 0, y: 14, duration: 0.8 }, 0)
      .to(lines, { yPercent: 0, duration: 1.2, stagger: 0.1, ease: 'power4.out' }, 0.06)
      .from('.collage-frame', { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.25, stagger: 0.11, ease: 'power3.inOut' }, 0.08)
      .from('.collage-frame img', { scale: 1.2, duration: 1.7, stagger: 0.11, ease: 'power3.out' }, 0.08)
      .from('.hero-foot', { opacity: 0, y: 26, duration: 0.95 }, 0.58)
      .from('.hero-stats dd', { opacity: 0, y: 14, duration: 0.7, stagger: 0.08 }, 0.72)
      .from('.hero-scroll', { opacity: 0, duration: 0.8 }, 0.95);
  }

  function removeLoader() {
    if (!loader) return;
    loader.classList.add('is-done');
    window.setTimeout(() => loader.classList.add('is-gone'), 1100);
    heroIntro();
  }

  function skipLoader() {
    if (!loader) { heroIntro(); return; }
    loader.classList.add('is-gone');
    heroIntro();
  }

  if (!motion) {
    skipLoader();
  } else if (!hasGSAP) {
    skipLoader();
  } else {
    let visited = false;
    try { visited = sessionStorage.getItem('fl-visited') === '1'; } catch (err) { visited = false; }

    if (visited) {
      skipLoader();
    } else {
      try { sessionStorage.setItem('fl-visited', '1'); } catch (err) { /* noop */ }
      const gsap = window.gsap;
      const counter = { value: 0 };
      const tl = gsap.timeline({ onComplete: removeLoader });

      tl.to(counter, {
        value: 100,
        duration: 1.25,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (loaderCount) loaderCount.textContent = String(Math.round(counter.value)).padStart(2, '0');
        }
      }, 0)
        .to(loaderBar, { scaleX: 1, duration: 1.25, ease: 'power2.inOut' }, 0)
        .to('.loader-dots i', { opacity: 1, stagger: 0.075, duration: 0.2 }, 0.15)
        .to({}, { duration: 0.12 });
    }
  }

  if (loader) {
    loader.addEventListener('transitionend', () => {
      if (loader.classList.contains('is-done')) loader.classList.add('is-gone');
    });
  }

  /* ------------------------------------------------------------
     Scroll-triggered motion
     ------------------------------------------------------------ */

  if (hasGSAP && motion) {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    /* Hero parallax */
    gsap.to('.hero-content', {
      yPercent: -7,
      opacity: 0.25,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-wrap',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    gsap.to('.hero-collage', {
      yPercent: 7,
      scale: 1.05,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-wrap',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    gsap.to('.hero-scrim', {
      opacity: 0.72,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-wrap',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    /* Hero collage follows the pointer, at different depths */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const frames = $$('.collage-frame').map((frame) => ({
        depth: parseFloat(frame.dataset.depth || '0.3'),
        x: gsap.quickTo(frame, 'x', { duration: 1.1, ease: 'power3' }),
        y: gsap.quickTo(frame, 'y', { duration: 1.1, ease: 'power3' })
      }));

      window.addEventListener('pointermove', (event) => {
        const nx = event.clientX / window.innerWidth - 0.5;
        const ny = event.clientY / window.innerHeight - 0.5;
        frames.forEach((frame) => {
          frame.x(nx * frame.depth * 28);
          frame.y(ny * frame.depth * 20);
        });
      }, { passive: true });
    }

    /* Generic reveals */
    const revealEls = $$('[data-reveal]');
    if (revealEls.length) {
      gsap.set(revealEls, { y: 32, opacity: 0 });
      ScrollTrigger.batch(revealEls, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.08,
            ease: 'power3.out',
            overwrite: true
          });
        }
      });
    }

    /* Statement — word by word */
    const statement = $('[data-statement]');
    if (statement) {
      const walker = document.createTreeWalker(statement, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) {
        if (walker.currentNode.nodeValue.trim()) textNodes.push(walker.currentNode);
      }
      textNodes.forEach((node) => {
        const frag = document.createDocumentFragment();
        node.nodeValue.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            const span = document.createElement('span');
            span.className = 'statement-word';
            span.textContent = part;
            frag.appendChild(span);
          }
        });
        node.parentNode.replaceChild(frag, node);
      });

      const words = $$('.statement-word', statement);
      gsap.set(words, { opacity: 0.15 });
      gsap.to(words, {
        opacity: 1,
        duration: 1,
        ease: 'none',
        stagger: 0.42,
        scrollTrigger: {
          trigger: statement,
          start: 'top 80%',
          end: 'bottom 58%',
          scrub: 0.7
        }
      });
    }

    /* Reel parallax */
    $$('[data-parallax]').forEach((wrap) => {
      const img = wrap.querySelector('img');
      if (!img) return;
      gsap.to(img, {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: {
          trigger: wrap,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    /* Services — crossfading media panel */
    const serviceRows = $$('.service-row');
    const serviceImgs = $$('.services-media-frame img');
    const serviceTag = $('#serviceTag');
    const serviceCount = $('#serviceCount');

    function activateService(index) {
      serviceRows.forEach((row, i) => {
        row.classList.toggle('is-active', i === index);
      });
      serviceImgs.forEach((img, i) => {
        img.classList.toggle('is-active', i === index);
      });
      if (serviceTag) serviceTag.textContent = serviceRows[index] ? serviceRows[index].querySelector('h3').textContent : '';
      if (serviceCount) serviceCount.textContent = String(index + 1).padStart(2, '0');
    }

    if (serviceRows.length) {
      gsap.from('.services-media-frame', {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 1.2,
        ease: 'power3.inOut',
        scrollTrigger: { trigger: '.services-shell', start: 'top 76%', once: true }
      });

      gsap.from(serviceRows, {
        y: 26,
        opacity: 0,
        duration: 0.9,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.service-list', start: 'top 82%', once: true }
      });

      serviceRows.forEach((row, i) => {
        row.addEventListener('pointerenter', () => activateService(i));
        row.addEventListener('focus', () => activateService(i));
        ScrollTrigger.create({
          trigger: row,
          start: 'top 60%',
          end: 'bottom 60%',
          onToggle: (self) => {
            if (self.isActive) activateService(i);
          }
        });
      });
    }

    /* Work — horizontal pin */
    const workTrack = $('#workTrack');
    const workBar = $('#workBar');
    const workCount = $('#workCount');

    if (workTrack) {
      const mm = gsap.matchMedia();

      mm.add('(min-width: 981px)', () => {
        const getDistance = () => Math.max(0, workTrack.scrollWidth - window.innerWidth);

        const tween = gsap.to(workTrack, {
          x: () => -getDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: '.work-pin',
            start: 'top top',
            end: () => '+=' + Math.max(240, getDistance()),
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (workBar) {
                workBar.style.transform = `scaleX(${Math.max(0.02, self.progress)})`;
              }
              if (workCount) {
                workCount.textContent = String(Math.min(4, Math.floor(self.progress * 4) + 1)).padStart(2, '0');
              }
            }
          }
        });

        $$('.film-card .film-media img').forEach((img) => {
          gsap.fromTo(img, { xPercent: -3 }, {
            xPercent: 3,
            ease: 'none',
            scrollTrigger: {
              trigger: img.closest('.film-card'),
              containerAnimation: tween,
              start: 'left right',
              end: 'right left',
              scrub: true
            }
          });
        });

        return () => {
          if (workBar) workBar.style.transform = 'scaleX(0.02)';
          if (workCount) workCount.textContent = '01';
        };
      });
    }

    /* Why — card stack */
    if (window.innerWidth > 980) {
      const cards = $$('.why-card');
      cards.forEach((card, i) => {
        ScrollTrigger.create({
          trigger: card,
          start: 'top 62%',
          end: 'bottom 62%',
          onToggle: (self) => card.classList.toggle('is-active', self.isActive)
        });
        if (i < cards.length - 1) {
          gsap.to(card, {
            scale: 0.955,
            ease: 'none',
            scrollTrigger: {
              trigger: cards[i + 1],
              start: 'top bottom',
              end: 'top 38%',
              scrub: true
            }
          });
        }
      });
    }

    /* Process — active step + rail */
    const processBar = $('#processBar');

    if (processBar) {
      gsap.fromTo(processBar, { scaleY: 0 }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.process-list',
          start: 'top 70%',
          end: 'bottom 55%',
          scrub: true
        }
      });
    }

    /* Founder photo parallax */
    gsap.fromTo('.founder-photo img', { yPercent: -5 }, {
      yPercent: 5,
      ease: 'none',
      scrollTrigger: {
        trigger: '.founder-photo',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });

    /* Contact title lines */
    gsap.from('.contact-title .line > span', {
      yPercent: 116,
      duration: 1.2,
      stagger: 0.1,
      ease: 'power4.out',
      scrollTrigger: { trigger: '.contact-title', start: 'top 80%', once: true }
    });

    gsap.from('.contact-badge', {
      rotate: -70,
      scale: 0.7,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.contact-title', start: 'top 75%', once: true }
    });

    /* Footer word drift */
    gsap.fromTo('.footer-word', { xPercent: -3.5 }, {
      xPercent: 3.5,
      ease: 'none',
      scrollTrigger: {
        trigger: '.site-footer',
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: true
      }
    });

    /* Marquee — speed reacts to scroll velocity */
    const marqueeTweens = [];
    $$('.marquee-track').forEach((track) => {
      track.style.animation = 'none';
      const duration = parseFloat(track.dataset.duration || '30');
      const tween = gsap.to(track, {
        xPercent: -50,
        repeat: -1,
        ease: 'none',
        duration
      });
      marqueeTweens.push(tween);
    });

    if (marqueeTweens.length) {
      let resetTimer = null;
      const onVelocity = (velocity) => {
        const boost = 1 + Math.min(Math.abs(velocity || 0) * 0.55, 4.5);
        marqueeTweens.forEach((tween) => tween.timeScale(boost));
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          marqueeTweens.forEach((tween) => tween.timeScale(1));
        }, 160);
      };

      if (lenis) {
        lenis.on('scroll', (e) => onVelocity(e.velocity));
      } else {
        let last = window.scrollY;
        window.addEventListener('scroll', () => {
          const now = window.scrollY;
          onVelocity(now - last);
          last = now;
        }, { passive: true });
      }
    }

    /* Keep pinned layouts honest after images/fonts land */
    window.addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  }

  /* ------------------------------------------------------------
     Service hover (kept for the no-motion fallback)
     ------------------------------------------------------------ */

  if (!hasGSAP || !motion) {
    const serviceRowsAll = $$('.service-row');
    const serviceImgsAll = $$('.services-media-frame img');
    const serviceTagAll = $('#serviceTag');
    const serviceCountAll = $('#serviceCount');

    serviceRowsAll.forEach((row, i) => {
      const activate = () => {
        serviceRowsAll.forEach((r, j) => r.classList.toggle('is-active', i === j));
        serviceImgsAll.forEach((img, j) => img.classList.toggle('is-active', i === j));
        if (serviceTagAll) serviceTagAll.textContent = row.querySelector('h3') ? row.querySelector('h3').textContent : '';
        if (serviceCountAll) serviceCountAll.textContent = String(i + 1).padStart(2, '0');
      };
      row.addEventListener('pointerenter', activate);
      row.addEventListener('focus', activate);
    });
  }

  /* ------------------------------------------------------------
     Video lightbox
     ------------------------------------------------------------ */

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
    stopScroll();
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
    if (!(menu && menu.classList.contains('is-open'))) startScroll();
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

  /* ------------------------------------------------------------
     Copy email
     ------------------------------------------------------------ */

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

  /* ------------------------------------------------------------
     Footer year + init
     ------------------------------------------------------------ */

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  onScrollFrame();
})();
