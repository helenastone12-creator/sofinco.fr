/**
 * SOrloz - Main JS
 * Navigation, interactions, mini-simulator
 */

document.addEventListener('DOMContentLoaded', function () {

  /* ==========================================
     HAMBURGER / MOBILE NAV
     ========================================== */
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
      hamburger.setAttribute('aria-expanded', mobileNav.classList.contains('open'));
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ==========================================
     MOBILE DROPDOWN TOGGLES
     ========================================== */
  const mobileNavLinks = document.querySelectorAll('.mobile-nav > ul > li > a');
  mobileNavLinks.forEach(link => {
    const dropdown = link.nextElementSibling;
    if (dropdown && dropdown.classList.contains('mobile-dropdown')) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
      });
    }
  });

  /* ==========================================
     ACTIVE NAV LINK
     ========================================== */
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.main-nav > ul > li > a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href').split('/')[1])) {
      link.closest('li').classList.add('active');
    }
  });

  /* ==========================================
     FAQ ACCORDION
     ========================================== */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', function () {
        const isOpen = item.classList.contains('open');
        // Close all
        faqItems.forEach(fi => {
          fi.classList.remove('open');
          const q = fi.querySelector('.faq-question');
          if (q) q.setAttribute('aria-expanded', 'false');
        });
        // Open clicked if was closed
        if (!isOpen) {
          item.classList.add('open');
          question.setAttribute('aria-expanded', 'true');
        }
      });

      // Keyboard support
      question.setAttribute('tabindex', '0');
      question.setAttribute('role', 'button');
      question.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          question.click();
        }
      });
    }
  });

  /* ==========================================
     MINI SIMULATOR (HOMEPAGE)
     ========================================== */
  const simTabs = document.querySelectorAll('.simulator-tab');
  simTabs.forEach(tab => {
    tab.addEventListener('click', function () {
      simTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      updateMiniSim();
    });
  });

  const amountSlider = document.getElementById('amount-slider');
  const amountDisplay = document.getElementById('amount-display');

  if (amountSlider && amountDisplay) {
    amountSlider.addEventListener('input', function () {
      const value = parseInt(this.value);
      amountDisplay.textContent = formatAmount(value);
      updateSliderFill(this);
    });
    updateSliderFill(amountSlider);
  }

  function updateMiniSim() {
    if (amountSlider && amountDisplay) {
      amountDisplay.textContent = formatAmount(parseInt(amountSlider.value));
    }
  }

  function updateSliderFill(slider) {
    const min = parseInt(slider.min) || 0;
    const max = parseInt(slider.max) || 100;
    const val = parseInt(slider.value) || 0;
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, #00334D ${pct}%, #E0E0E0 ${pct}%)`;
  }

  // Simulate button
  const simBtn = document.getElementById('mini-sim-btn');
  if (simBtn) {
    simBtn.addEventListener('click', function () {
      const amount = amountSlider ? amountSlider.value : 10000;
      const duration = document.getElementById('duration-select')?.value || 36;
      const activeTab = document.querySelector('.simulator-tab.active');
      const type = activeTab ? activeTab.dataset.type : 'perso';

      // Build URL and navigate to simulator
      const params = new URLSearchParams({ amount, duration, type });
      const base = getRelativeBase();
      window.location.href = `${base}parcours-simulateur/?${params.toString()}`;
    });
  }

  function getRelativeBase() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    // If we're at root or first level
    if (segments.length <= 1) return './';
    return '../'.repeat(segments.length - 1);
  }

  /* ==========================================
     SCROLL ANIMATIONS
     ========================================== */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.product-card, .feature-item, .review-card, .faq-item, .benefit-card').forEach(el => {
    observer.observe(el);
  });

  /* ==========================================
     SMOOTH SCROLL FOR ANCHOR LINKS
     ========================================== */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ==========================================
     HEADER SCROLL EFFECT
     ========================================== */
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 10) {
        header.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
      } else {
        header.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
      }
    });
  }

  /* ==========================================
     TOAST NOTIFICATION
     ========================================== */
  window.showToast = function (msg, duration = 3000) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  };

  /* ==========================================
     COOKIE / ACCESSIBILITY BUTTON
     ========================================== */
  const accessBtn = document.querySelector('.btn-accessibility');
  if (accessBtn) {
    accessBtn.addEventListener('click', function () {
      window.showToast('Paramètres d\'accessibilité: fonctionnalité en cours de développement.');
    });
  }

});

/* ==========================================
   UTILITY: FORMAT AMOUNT
   ========================================== */
function formatAmount(n) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' €';
}

function formatCurrency(n) {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n) + ' €';
}

// Export for simulator
window.formatAmount = formatAmount;
window.formatCurrency = formatCurrency;
