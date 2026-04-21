/* ═══════════════════════════════════════
   WINKY LUX — Gold Bullet Lip Colour
   Scroll-Driven Product Experience
   ═══════════════════════════════════════ */

(function () {
  'use strict';

  // ─── CONFIG ────────────────────────────────────────
  const FRAME_COUNT        = 97;
  const FRAME_SPEED        = 2.0;  // product animation completes at ~50% scroll
  const IMAGE_SCALE        = 0.87; // padded cover (avoids header clip)
  const BG_DEFAULT         = '#f6f4f1';

  // Scroll progress thresholds
  const OVERLAY_ENTER      = 0.54;
  const OVERLAY_LEAVE      = 0.75;
  const OVERLAY_MAX_OPACITY = 0.91;
  const MARQUEE_ENTER      = 0.33;
  const MARQUEE_LEAVE      = 0.82;
  const HEADER_DARK_ENTER  = OVERLAY_ENTER - 0.04;
  const HEADER_DARK_LEAVE  = OVERLAY_LEAVE + 0.04;

  // ─── DOM REFS ───────────────────────────────────────
  const loader       = document.getElementById('loader');
  const loaderBar    = document.getElementById('loader-bar');
  const loaderPct    = document.getElementById('loader-percent');
  const canvas       = document.getElementById('canvas');
  const canvasWrap   = document.getElementById('canvas-wrap');
  const ctx          = canvas.getContext('2d');
  const heroEl       = document.getElementById('hero');
  const scrollCont   = document.getElementById('scroll-container');
  const darkOverlay  = document.getElementById('dark-overlay');
  const marqWrap     = document.getElementById('marquee');
  const header       = document.getElementById('site-header');
  const orbitWrap    = document.getElementById('orbit-wrap');

  // ─── STATE ─────────────────────────────────────────
  const frames    = new Array(FRAME_COUNT).fill(null);
  let currentFrame = 0;
  let bgColor      = BG_DEFAULT;
  let bgCache      = {};       // { frameIndex: 'rgb(...)' }
  let gsapReady    = false;

  // ─── CANVAS SETUP ──────────────────────────────────
  function setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = window.innerWidth  * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ─── SAMPLE BG COLOR FROM CORNERS ──────────────────
  function sampleBgColor(img, frameIndex) {
    if (bgCache[frameIndex]) {
      bgColor = bgCache[frameIndex];
      return;
    }
    try {
      const off  = document.createElement('canvas');
      const ow   = Math.min(img.naturalWidth,  400);
      const oh   = Math.min(img.naturalHeight, 400);
      off.width  = ow;
      off.height = oh;
      const octx = off.getContext('2d');
      octx.drawImage(img, 0, 0, ow, oh);
      const corners = [
        octx.getImageData(2, 2, 1, 1).data,
        octx.getImageData(ow - 3, 2, 1, 1).data,
        octx.getImageData(2, oh - 3, 1, 1).data,
        octx.getImageData(ow - 3, oh - 3, 1, 1).data,
      ];
      let r = 0, g = 0, b = 0;
      corners.forEach(d => { r += d[0]; g += d[1]; b += d[2]; });
      const result = `rgb(${Math.round(r/4)},${Math.round(g/4)},${Math.round(b/4)})`;
      bgCache[frameIndex] = result;
      bgColor = result;
    } catch (e) {
      bgColor = BG_DEFAULT;
    }
  }

  // ─── DRAW FRAME ────────────────────────────────────
  function drawFrame(index) {
    const img = frames[index];
    if (!img || !img.complete || !img.naturalWidth) return;

    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // ─── FRAME PRELOADER ───────────────────────────────
  function loadFrames() {
    return new Promise((resolve) => {
      let loaded = 0;

      function onFrameLoad(i) {
        loaded++;
        const pct = Math.round((loaded / FRAME_COUNT) * 100);
        loaderBar.style.width   = pct + '%';
        loaderPct.textContent   = pct + '%';

        // Sample bg from frame 0 immediately for canvas fill
        if (i === 0) {
          sampleBgColor(frames[0], 0);
          drawFrame(0);
        }

        if (loaded === FRAME_COUNT) resolve();
      }

      for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        const idx = i;
        img.onload  = () => onFrameLoad(idx);
        img.onerror = () => onFrameLoad(idx);
        img.src = `frames/frame_${String(i + 1).padStart(4, '0')}.webp`;
        frames[i] = img;
      }
    });
  }

  // ─── HIDE LOADER ───────────────────────────────────
  function hideLoader() {
    loader.classList.add('hidden');
    setTimeout(() => { loader.style.display = 'none'; }, 750);
  }

  // ─── HERO WORD REVEAL ──────────────────────────────
  function animateHeroIn() {
    const words = document.querySelectorAll('.hero-heading .word');
    gsap.from(words, {
      y: 90,
      opacity: 0,
      stagger: 0.13,
      duration: 1.3,
      ease: 'power4.out',
      delay: 0.2,
    });
    gsap.from('.hero-tagline', {
      y: 24,
      opacity: 0,
      duration: 1.0,
      delay: 0.85,
      ease: 'power3.out',
    });
    gsap.from('.scroll-indicator', {
      opacity: 0,
      duration: 0.9,
      delay: 1.2,
      ease: 'power3.out',
    });
    gsap.from('.hero-side-text', {
      opacity: 0,
      duration: 0.9,
      delay: 1.4,
      ease: 'power3.out',
    });
    gsap.from('.hero-standalone .section-label', {
      opacity: 0,
      x: -20,
      duration: 0.9,
      delay: 0.1,
      ease: 'power3.out',
    });
  }

  // ─── SECTION POSITIONING ───────────────────────────
  // Positions each section so its center is visible at
  // the midpoint of its enter/leave scroll range.
  function positionSections() {
    const totalH = scrollCont.getBoundingClientRect().height;
    const viewH  = window.innerHeight;
    const scrollRange = totalH - viewH;

    document.querySelectorAll('.scroll-section').forEach(section => {
      const enterPct = parseFloat(section.dataset.enter) / 100;
      const leavePct = parseFloat(section.dataset.leave) / 100;
      const midPct   = (enterPct + leavePct) / 2;

      // Top of section in document coords = scrollY_at_mid + viewH/2 - sectionHeight/2
      // Since transform: translateY(-50%), we set top = scrollY_at_mid + viewH/2
      const scrollYAtMid = midPct * scrollRange;
      section.style.top       = (scrollYAtMid + viewH / 2) + 'px';
      section.style.transform = 'translateY(-50%)';
    });
  }

  // ─── SECTION ANIMATION FACTORY ─────────────────────
  function buildTimeline(section) {
    const type = section.dataset.animation;
    const isCTA = section.classList.contains('section-cta');

    const targets = section.querySelectorAll(
      '.section-label, .section-heading, .section-body, .section-note, ' +
      '.cta-label, .cta-heading, .cta-body, .cta-button, .stat'
    );

    const tl = gsap.timeline({ paused: true });

    switch (type) {
      case 'slide-left':
        tl.from(targets, {
          x: -75, opacity: 0,
          stagger: 0.13, duration: 0.95, ease: 'power3.out',
        });
        break;

      case 'slide-right':
        tl.from(targets, {
          x: 75, opacity: 0,
          stagger: 0.13, duration: 0.95, ease: 'power3.out',
        });
        break;

      case 'scale-up':
        tl.from(targets, {
          scale: 0.86, opacity: 0,
          stagger: 0.12, duration: 1.05, ease: 'power2.out',
        });
        break;

      case 'clip-reveal':
        tl.from(targets, {
          clipPath: 'inset(100% 0 0 0)',
          opacity: 0,
          stagger: 0.15, duration: 1.25, ease: 'power4.inOut',
        });
        break;

      case 'stagger-up':
        tl.from(targets, {
          y: 65, opacity: 0,
          stagger: 0.15, duration: 0.85, ease: 'power3.out',
        });
        break;

      case 'fade-up':
      default:
        tl.from(targets, {
          y: 55, opacity: 0,
          stagger: 0.13, duration: 0.95, ease: 'power3.out',
        });
        break;
    }

    return tl;
  }

  // ─── SECTION VISIBILITY CONTROLLER ────────────────
  function setupSections(masterST) {
    const sectionData = [];

    document.querySelectorAll('.scroll-section').forEach(section => {
      const enterPct  = parseFloat(section.dataset.enter) / 100;
      const leavePct  = parseFloat(section.dataset.leave) / 100;
      const isPersist = section.dataset.persist === 'true';
      const tl        = buildTimeline(section);

      sectionData.push({
        el: section, enterPct, leavePct, isPersist, tl,
        revealed: false,
      });
    });

    // Counter animations (for stats)
    document.querySelectorAll('.stat-number').forEach(el => {
      const target   = parseFloat(el.dataset.value);
      const decimals = parseInt(el.dataset.decimals || '0');
      gsap.fromTo(
        el,
        { textContent: 0 },
        {
          textContent: target,
          duration: 2.2,
          ease: 'power1.out',
          snap: { textContent: decimals === 0 ? 1 : 0.1 },
          scrollTrigger: {
            trigger: el.closest('.scroll-section'),
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
          onUpdate() {
            const v = parseFloat(el.textContent) || 0;
            el.textContent = v.toFixed(decimals);
          },
        }
      );
    });

    return sectionData;
  }

  // ─── MAIN GSAP SETUP ───────────────────────────────
  function setupGSAP() {
    gsap.registerPlugin(ScrollTrigger);

    // ── Lenis smooth scroll
    const lenis = new Lenis({
      duration:    1.2,
      easing:      (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // ── Position sections
    positionSections();

    // ── Hero entrance
    animateHeroIn();

    // ── Marquee scroll movement
    gsap.to('.marquee-text', {
      xPercent: -28,
      ease: 'none',
      scrollTrigger: {
        trigger: scrollCont,
        start: 'top top',
        end:   'bottom bottom',
        scrub: true,
      },
    });

    // ── Section animations setup
    const sectionData = setupSections();

    // ── MASTER scroll trigger (drives everything)
    ScrollTrigger.create({
      trigger: scrollCont,
      start:   'top top',
      end:     'bottom bottom',
      scrub:   true,
      onUpdate(self) {
        const p = self.progress;

        // ── Hero fade out
        const heroOpacity = Math.max(0, 1 - p * 18);
        heroEl.style.opacity = heroOpacity;

        // ── Canvas circle-wipe reveal
        const wipeP  = Math.min(1, Math.max(0, (p - 0.01) / 0.07));
        const radius = wipeP * 80;
        canvasWrap.style.clipPath = `circle(${radius}% at 50% 50%)`;

        // ── Frame scrub
        const accel = Math.min(p * FRAME_SPEED, 1);
        const idx   = Math.min(Math.floor(accel * FRAME_COUNT), FRAME_COUNT - 1);
        if (idx !== currentFrame) {
          currentFrame = idx;
          if (idx % 15 === 0 || idx === 0) sampleBgColor(frames[idx], idx);
          requestAnimationFrame(() => drawFrame(currentFrame));
        }

        // ── Dark overlay
        const fade = 0.04;
        let opa = 0;
        if      (p >= OVERLAY_ENTER - fade && p < OVERLAY_ENTER)
          opa = ((p - (OVERLAY_ENTER - fade)) / fade) * OVERLAY_MAX_OPACITY;
        else if (p >= OVERLAY_ENTER && p <= OVERLAY_LEAVE)
          opa = OVERLAY_MAX_OPACITY;
        else if (p > OVERLAY_LEAVE && p <= OVERLAY_LEAVE + fade)
          opa = OVERLAY_MAX_OPACITY * (1 - (p - OVERLAY_LEAVE) / fade);
        darkOverlay.style.opacity = opa;

        // ── Marquee fade
        let mOpa = 0;
        const mIn  = 0.05;
        const mOut = 0.05;
        if      (p >= MARQUEE_ENTER && p < MARQUEE_ENTER + mIn)
          mOpa = (p - MARQUEE_ENTER) / mIn;
        else if (p >= MARQUEE_ENTER + mIn && p <= MARQUEE_LEAVE - mOut)
          mOpa = 1;
        else if (p > MARQUEE_LEAVE - mOut && p <= MARQUEE_LEAVE)
          mOpa = 1 - (p - (MARQUEE_LEAVE - mOut)) / mOut;
        marqWrap.style.opacity = mOpa;

        // ── Orbit text fade — visible during product animation, hides before dark overlay
        const ORBIT_ENTER = 0.07;
        const ORBIT_LEAVE = 0.50;
        const ORBIT_FADE  = 0.05;
        let orbitOpa = 0;
        if      (p >= ORBIT_ENTER && p < ORBIT_ENTER + ORBIT_FADE)
          orbitOpa = (p - ORBIT_ENTER) / ORBIT_FADE;
        else if (p >= ORBIT_ENTER + ORBIT_FADE && p <= ORBIT_LEAVE - ORBIT_FADE)
          orbitOpa = 1;
        else if (p > ORBIT_LEAVE - ORBIT_FADE && p <= ORBIT_LEAVE)
          orbitOpa = 1 - (p - (ORBIT_LEAVE - ORBIT_FADE)) / ORBIT_FADE;
        orbitWrap.style.opacity = orbitOpa;

        // ── Header text colour
        const isHeaderDark = p > HEADER_DARK_ENTER && p < HEADER_DARK_LEAVE;
        if (isHeaderDark) header.classList.add('dark');
        else              header.classList.remove('dark');

        // ── Section visibility
        sectionData.forEach(sd => {
          const inRange = p >= sd.enterPct && p <= sd.leavePct;
          const past    = p > sd.leavePct;

          if (inRange || (sd.isPersist && past)) {
            sd.el.style.opacity = '1';
            sd.el.classList.add('is-visible');
            if (!sd.revealed) {
              sd.tl.play();
              sd.revealed = true;
            }
          } else if (!sd.isPersist) {
            sd.el.style.opacity = '0';
            sd.el.classList.remove('is-visible');
            if (sd.revealed && p < sd.enterPct) {
              sd.tl.reverse();
              sd.revealed = false;
            }
          }
        });
      },
    });

    gsapReady = true;
  }

  // ─── RESIZE ────────────────────────────────────────
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      setupCanvas();
      positionSections();
      drawFrame(currentFrame);
      ScrollTrigger.refresh();
    }, 200);
  });

  // ─── INIT ──────────────────────────────────────────
  async function init() {
    setupCanvas();

    // Start loading frames
    await loadFrames();

    // Draw first frame with sampled bg
    sampleBgColor(frames[0], 0);
    drawFrame(0);

    // Hide loader
    hideLoader();

    // Short delay then fire GSAP
    await new Promise(r => setTimeout(r, 100));
    setupGSAP();
  }

  init();

})();
