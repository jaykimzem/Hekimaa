/* ================================================================
   HEKIMA UNIVERSITY MOLO MARATHON — main.js
   Features: Loader, Sticky Nav, Mobile Menu, Countdown, Counters,
             Scroll Reveal, FAQ Accordion
   ================================================================ */

(function () {
  'use strict';

  // ── Utility: wait for DOM ──────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initLoader();
    initStickyNav();
    initMobileMenu();
    initCountdown();
    initScrollReveal();
    initFAQ();
    initSmoothScroll();
  }

  // ── Loader ────────────────────────────────────────────────────────
  function initLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;

    // Hide loader after animation completes (~2.4s fill + 0.3s buffer)
    setTimeout(() => {
      loader.classList.add('hidden');
      // After loader is gone, trigger counter animations
      setTimeout(initCounters, 600);
    }, 2800);
  }

  // ── Sticky Navigation ─────────────────────────────────────────────
  function initStickyNav() {
    const header = document.getElementById('site-header');
    if (!header) return;

    const onScroll = () => {
      if (window.scrollY > 60) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Mobile Menu ───────────────────────────────────────────────────
  function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-menu');
    if (!hamburger || !menu) return;

    hamburger.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      menu.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }

  // ── Countdown Timer ───────────────────────────────────────────────
  function initCountdown() {
    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minsEl = document.getElementById('cd-mins');
    const secsEl = document.getElementById('cd-secs');
    if (!daysEl) return;

    // Race date: 8 August 2026 06:00 EAT (UTC+3)
    const raceDate = new Date('2026-08-08T06:00:00+03:00');

    function pad(n, len = 2) {
      return String(n).padStart(len, '0');
    }

    function tick() {
      const now = new Date();
      const diff = raceDate - now;

      if (diff <= 0) {
        daysEl.textContent = '000';
        hoursEl.textContent = '00';
        minsEl.textContent = '00';
        secsEl.textContent = '00';
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;

      daysEl.textContent = pad(days, 3);
      hoursEl.textContent = pad(hours);
      minsEl.textContent = pad(mins);
      secsEl.textContent = pad(secs);
    }

    tick();
    setInterval(tick, 1000);
  }

  // ── Animated Counters ─────────────────────────────────────────────
  function initCounters() {
    const counters = document.querySelectorAll('.stat-num[data-target]');
    if (!counters.length) return;

    counters.forEach(el => {
      const target = parseInt(el.getAttribute('data-target'), 10);
      const suffix = el.getAttribute('data-suffix') || '';
      if (isNaN(target)) return;

      let start = 0;
      const duration = 2000;
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);
        el.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(update);
      }

      requestAnimationFrame(update);
    });
  }

  // ── Scroll Reveal ─────────────────────────────────────────────────
  function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal-up');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );

    elements.forEach(el => observer.observe(el));

    // Also trigger counters when stats section becomes visible
    const statsSection = document.getElementById('stats');
    if (statsSection) {
      const statsObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          initCounters();
          statsObserver.disconnect();
        }
      }, { threshold: 0.3 });
      statsObserver.observe(statsSection);
    }
  }

  // ── FAQ Accordion ─────────────────────────────────────────────────
  function initFAQ() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach((item, index) => {
      const question = item.querySelector('.faq-q');
      const answer = item.querySelector('.faq-a');
      if (!question || !answer) return;

      question.addEventListener('click', () => {
        const isOpen = question.getAttribute('aria-expanded') === 'true';

        // Close all others
        items.forEach((otherItem, otherIdx) => {
          if (otherIdx === index) return;
          const otherQ = otherItem.querySelector('.faq-q');
          const otherA = otherItem.querySelector('.faq-a');
          if (otherQ) otherQ.setAttribute('aria-expanded', 'false');
          if (otherA) {
            otherA.classList.remove('open');
            otherA.setAttribute('aria-hidden', 'true');
          }
        });

        // Toggle current
        question.setAttribute('aria-expanded', String(!isOpen));
        answer.classList.toggle('open', !isOpen);
        answer.setAttribute('aria-hidden', String(isOpen));
      });
    });
  }

  // ── Smooth Scroll for anchor links ───────────────────────────────
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();
        const headerOffset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

})();
