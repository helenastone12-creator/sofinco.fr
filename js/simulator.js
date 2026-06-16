/**
 * SOrloz - Multi-Step Simulator Logic
 * parcours-simulateur/index.html
 */

(function () {

  // ============================================
  // CONSTANTS & STATE
  // ============================================

  const TAEG_RATES = {
    perso: {
      getRate: function (amount) {
        if (amount >= 15000) return 4.90;
        if (amount >= 10000) return 6.90;
        if (amount >= 5000)  return 9.90;
        return 15.90;
      }
    },
    renouvelable: { rate: 21.99 },
    auto:         { rate: 4.90 },
    travaux:      { rate: 5.90 },
    moto:         { rate: 6.90 },
    rac:          { rate: 3.90 }
  };

  const AMOUNT_PRESETS = [3000, 5000, 10000, 15000, 20000];

  const state = {
    currentStep: 1,
    projectType: null,
    amount: 10000,
    duration: 36,
    taeg: 4.90,
    monthlyPayment: 0,
    totalAmount: 0,
    interest: 0,
    // Personal info
    civility: 'M',
    firstName: '',
    lastName: '',
    birthDate: '',
    email: '',
    phone: '',
    zipCode: '',
    // Professional info
    situation: '',
    income: '',
    housing: '',
    otherCredits: ''
  };

  const STEP_LABELS = [
    'Projet',
    'Montant',
    'Durée',
    'Résultats',
    'Identité',
    'Situation',
    'Confirmation'
  ];

  let totalSteps = 7;

  // ============================================
  // CALCULATION
  // ============================================

  function getTaeg(type, amount) {
    if (!TAEG_RATES[type]) return 9.90;
    if (type === 'perso') return TAEG_RATES.perso.getRate(amount);
    return TAEG_RATES[type].rate;
  }

  function calcPayment(amount, durationMonths, taeg) {
    const monthlyRate = taeg / 12 / 100;
    if (monthlyRate === 0) return amount / durationMonths;
    const payment = amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -durationMonths));
    return payment;
  }

  function calcSimulation() {
    const type = state.projectType || 'perso';
    state.taeg = getTaeg(type, state.amount);
    state.monthlyPayment = calcPayment(state.amount, state.duration, state.taeg);
    state.totalAmount = state.monthlyPayment * state.duration;
    state.interest = state.totalAmount - state.amount;
  }

  // ============================================
  // FORMAT UTILITIES
  // ============================================

  function fmt(n, decimals = 2) {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(n);
  }

  function fmtAmount(n) {
    return new Intl.NumberFormat('fr-FR').format(n) + ' €';
  }

  // ============================================
  // URL HASH NAVIGATION
  // ============================================

  function updateHash(step) {
    history.replaceState(null, null, `#/step${step}`);
  }

  function getStepFromHash() {
    const hash = window.location.hash;
    const match = hash.match(/#\/step(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  // ============================================
  // UI: PROGRESS BAR
  // ============================================

  function renderProgressBar() {
    const container = document.querySelector('.progress-steps');
    if (!container) return;

    let html = '';
    for (let i = 1; i <= totalSteps; i++) {
      let cls = 'progress-step';
      if (i < state.currentStep) cls += ' done';
      else if (i === state.currentStep) cls += ' active';

      const label = STEP_LABELS[i - 1] || `Étape ${i}`;
      const icon = i < state.currentStep ? '✓' : i;

      html += `
        <div class="${cls}">
          <div class="step-circle">${icon}</div>
          <span class="step-label">${label}</span>
        </div>
      `;
    }
    container.innerHTML = html;
  }

  // ============================================
  // STEP VISIBILITY
  // ============================================

  function showStep(step) {
    state.currentStep = step;
    updateHash(step);
    renderProgressBar();

    document.querySelectorAll('.sim-step').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`step${step}`);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ============================================
  // STEP 1: PROJECT TYPE
  // ============================================

  function initStep1() {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
      card.addEventListener('click', function () {
        cards.forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
        state.projectType = this.dataset.type;

        // If RAC, jump directly to step results (RAC has no amount selection)
        if (state.projectType === 'rac') {
          state.amount = 15000;
          state.duration = 48;
          setTimeout(() => showStep(4), 300);
        } else {
          setTimeout(() => showStep(2), 300);
        }
      });
    });
  }

  // ============================================
  // STEP 2: AMOUNT
  // ============================================

  function initStep2() {
    const slider = document.getElementById('sim-amount-slider');
    const input = document.getElementById('sim-amount-input');
    const presets = document.querySelectorAll('.amount-preset');
    const preview = document.getElementById('step2-monthly-preview');

    function updateStep2() {
      const val = parseInt(state.amount) || 10000;
      if (slider) slider.value = val;
      if (input) input.value = val;

      // Update presets
      presets.forEach(p => {
        p.classList.toggle('selected', parseInt(p.dataset.amount) === val);
      });

      // Update slider fill
      if (slider) {
        const min = parseInt(slider.min);
        const max = parseInt(slider.max);
        const pct = ((val - min) / (max - min)) * 100;
        slider.style.background = `linear-gradient(to right, #00334D ${pct}%, #E0E0E0 ${pct}%)`;
      }

      // Update monthly preview
      if (preview) {
        calcSimulation();
        preview.textContent = `≈ ${fmt(state.monthlyPayment)} €/mois`;
      }
    }

    if (slider) {
      slider.addEventListener('input', function () {
        state.amount = parseInt(this.value);
        if (input) input.value = this.value;
        updateStep2();
      });
    }

    if (input) {
      input.addEventListener('input', function () {
        let val = parseInt(this.value.replace(/\D/g, '')) || 1000;
        val = Math.max(1000, Math.min(75000, val));
        state.amount = val;
        if (slider) slider.value = val;
        updateStep2();
      });
    }

    presets.forEach(p => {
      p.addEventListener('click', function () {
        state.amount = parseInt(this.dataset.amount);
        if (input) input.value = state.amount;
        updateStep2();
      });
    });

    updateStep2();
  }

  // ============================================
  // STEP 3: DURATION
  // ============================================

  function initStep3() {
    const buttons = document.querySelectorAll('.duration-btn');
    const monthlyValue = document.querySelector('.monthly-value');
    const taegDisplay = document.getElementById('taeg-display');

    function updateStep3() {
      calcSimulation();

      buttons.forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.months) === state.duration);
      });

      if (monthlyValue) {
        monthlyValue.textContent = fmt(state.monthlyPayment);
      }

      if (taegDisplay) {
        taegDisplay.textContent = fmt(state.taeg, 2) + '%';
      }
    }

    buttons.forEach(btn => {
      btn.addEventListener('click', function () {
        state.duration = parseInt(this.dataset.months);
        updateStep3();
      });
    });

    // Default select 36 months
    updateStep3();
  }

  // ============================================
  // STEP 4: RESULTS
  // ============================================

  function renderResults() {
    calcSimulation();

    const fields = {
      'result-monthly':  fmt(state.monthlyPayment) + ' €/mois',
      'result-taeg':     fmt(state.taeg, 2) + '%',
      'result-total':    fmt(state.totalAmount) + ' €',
      'result-duration': state.duration + ' mois',
      'result-interest': fmt(state.interest) + ' €',
      'result-amount':   fmtAmount(state.amount)
    };

    for (const [id, val] of Object.entries(fields)) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    }

    // Amortization summary table
    const tbody = document.getElementById('amort-tbody');
    if (tbody) {
      const rows = generateAmortRows();
      tbody.innerHTML = rows;
    }
  }

  function generateAmortRows() {
    const monthlyRate = state.taeg / 12 / 100;
    let balance = state.amount;
    let html = '';
    const step = Math.ceil(state.duration / 6);

    for (let i = 1; i <= state.duration; i += step) {
      const interest = balance * monthlyRate;
      const principal = state.monthlyPayment - interest;
      balance = Math.max(0, balance - principal);

      if (i === 1 || i % step === 1 || i === state.duration) {
        html += `
          <tr>
            <td>Mois ${i}</td>
            <td>${fmt(state.monthlyPayment)} €</td>
            <td>${fmt(interest)} €</td>
            <td>${fmt(principal)} €</td>
            <td>${fmt(Math.max(0, balance))} €</td>
          </tr>
        `;
      }
    }
    return html;
  }

  // ============================================
  // STEP 5: PERSONAL INFO VALIDATION
  // ============================================

  function validateStep5() {
    let valid = true;

    const fields = [
      { id: 'inp-firstname', rule: v => v.length >= 2, msg: 'Prénom requis (min. 2 caractères)' },
      { id: 'inp-lastname',  rule: v => v.length >= 2, msg: 'Nom requis (min. 2 caractères)' },
      { id: 'inp-birthdate', rule: v => /^\d{2}\/\d{2}\/\d{4}$/.test(v) || /^\d{4}-\d{2}-\d{2}$/.test(v), msg: 'Date de naissance invalide' },
      { id: 'inp-email',     rule: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: 'Email invalide' },
      { id: 'inp-phone',     rule: v => /^(\+33|0)[0-9]{9}$/.test(v.replace(/\s/g, '')), msg: 'Téléphone invalide (format: 06 12 34 56 78)' },
      { id: 'inp-zipcode',   rule: v => /^\d{5}$/.test(v), msg: 'Code postal invalide (5 chiffres)' }
    ];

    fields.forEach(f => {
      const el = document.getElementById(f.id);
      if (!el) return;
      const val = el.value.trim();
      const parent = el.closest('.form-field');
      const errEl = parent?.querySelector('.error-msg');

      if (!f.rule(val)) {
        valid = false;
        el.classList.add('error');
        parent?.classList.add('has-error');
        if (errEl) errEl.textContent = f.msg;
      } else {
        el.classList.remove('error');
        parent?.classList.remove('has-error');
      }
    });

    if (valid) {
      state.civility  = document.querySelector('input[name="civility"]:checked')?.value || 'M';
      state.firstName = document.getElementById('inp-firstname')?.value.trim();
      state.lastName  = document.getElementById('inp-lastname')?.value.trim();
      state.birthDate = document.getElementById('inp-birthdate')?.value.trim();
      state.email     = document.getElementById('inp-email')?.value.trim();
      state.phone     = document.getElementById('inp-phone')?.value.trim();
      state.zipCode   = document.getElementById('inp-zipcode')?.value.trim();
    }

    return valid;
  }

  // ============================================
  // STEP 6: SITUATION VALIDATION
  // ============================================

  function validateStep6() {
    let valid = true;

    const situationEl = document.getElementById('inp-situation');
    if (situationEl && !situationEl.value) {
      valid = false;
      situationEl.classList.add('error');
    } else if (situationEl) {
      state.situation = situationEl.value;
      situationEl.classList.remove('error');
    }

    const incomeEl = document.getElementById('inp-income');
    if (incomeEl) {
      const val = parseFloat(incomeEl.value);
      if (!val || val <= 0) {
        valid = false;
        incomeEl.classList.add('error');
      } else {
        state.income = val;
        incomeEl.classList.remove('error');
      }
    }

    if (incomeEl) {
      state.housing = parseFloat(document.getElementById('inp-housing')?.value) || 0;
      state.otherCredits = parseFloat(document.getElementById('inp-other-credits')?.value) || 0;
    }

    return valid;
  }

  // ============================================
  // STEP 7: CONFIRMATION
  // ============================================

  function renderConfirmation() {
    const summary = document.getElementById('confirmation-summary');
    if (!summary) return;

    const projectLabels = {
      perso: 'Prêt personnel',
      auto: 'Crédit auto',
      travaux: 'Prêt travaux',
      moto: 'Crédit moto',
      renouvelable: 'Crédit renouvelable',
      rac: 'Rachat de crédits'
    };

    const data = [
      ['Civilité', state.civility === 'M' ? 'M.' : 'Mme'],
      ['Prénom', state.firstName],
      ['Nom', state.lastName],
      ['Date de naissance', state.birthDate],
      ['Email', state.email],
      ['Type de crédit', projectLabels[state.projectType] || state.projectType],
      ['Montant', fmtAmount(state.amount)],
      ['Durée', state.duration + ' mois'],
      ['Mensualité', fmt(state.monthlyPayment) + ' €/mois'],
      ['TAEG', fmt(state.taeg, 2) + '%'],
      ['Montant total dû', fmt(state.totalAmount) + ' €']
    ];

    summary.innerHTML = data.map(([label, value]) => `
      <div class="summary-row">
        <span class="label">${label}</span>
        <span class="value">${value || '—'}</span>
      </div>
    `).join('');
  }

  // ============================================
  // RADIO BUTTON CIVILITY
  // ============================================

  function initRadios() {
    const labels = document.querySelectorAll('.radio-label');
    labels.forEach(label => {
      const input = label.querySelector('input[type="radio"]');
      if (input) {
        label.addEventListener('click', function () {
          // Uncheck siblings
          document.querySelectorAll(`input[name="${input.name}"]`).forEach(r => {
            r.closest('.radio-label')?.classList.remove('checked');
          });
          input.checked = true;
          label.classList.add('checked');
        });
        if (input.checked) label.classList.add('checked');
      }
    });
  }

  // ============================================
  // STEP NAVIGATION BUTTONS
  // ============================================

  function initNavButtons() {
    // Step 2 nav
    document.querySelector('#step2 .btn-sim-prev')?.addEventListener('click', () => showStep(1));
    document.querySelector('#step2 .btn-sim-next')?.addEventListener('click', () => showStep(3));

    // Step 3 nav
    document.querySelector('#step3 .btn-sim-prev')?.addEventListener('click', () => showStep(2));
    document.querySelector('#step3 .btn-sim-next')?.addEventListener('click', () => {
      renderResults();
      showStep(4);
    });

    // Step 4 nav
    document.querySelector('#step4 .btn-modify')?.addEventListener('click', () => showStep(1));
    document.querySelector('#step4 .btn-apply')?.addEventListener('click', () => showStep(5));

    // Step 5 nav
    document.querySelector('#step5 .btn-sim-prev')?.addEventListener('click', () => showStep(4));
    document.querySelector('#step5 .btn-sim-next')?.addEventListener('click', () => {
      if (validateStep5()) showStep(6);
    });

    // Step 6 nav
    document.querySelector('#step6 .btn-sim-prev')?.addEventListener('click', () => showStep(5));
    document.querySelector('#step6 .btn-sim-next')?.addEventListener('click', () => {
      if (validateStep6()) {
        renderConfirmation();
        showStep(7);
      }
    });

    // Step 7 nav - back to home
    document.querySelector('#step7 .btn-home')?.addEventListener('click', () => {
      window.location.href = '../';
    });
  }

  // ============================================
  // URL PARAMS ON LOAD (from mini-simulator)
  // ============================================

  function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('amount')) state.amount = parseInt(params.get('amount')) || 10000;
    if (params.get('duration')) state.duration = parseInt(params.get('duration')) || 36;
    if (params.get('type')) state.projectType = params.get('type');

    // Update sliders/inputs after load
    const slider = document.getElementById('sim-amount-slider');
    const input = document.getElementById('sim-amount-input');
    if (slider) slider.value = state.amount;
    if (input) input.value = state.amount;

    // Pre-select duration button
    document.querySelectorAll('.duration-btn').forEach(btn => {
      btn.classList.toggle('selected', parseInt(btn.dataset.months) === state.duration);
    });

    // Pre-select project type card
    if (state.projectType) {
      document.querySelectorAll('.project-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.type === state.projectType);
      });

      // If type set, jump to step 2
      if (state.projectType !== 'rac') {
        showStep(2);
      } else {
        showStep(4);
        renderResults();
      }
    }
  }

  // ============================================
  // INIT
  // ============================================

  function init() {
    initStep1();
    initStep2();
    initStep3();
    initRadios();
    initNavButtons();

    // Apply URL params (if coming from mini-sim)
    applyUrlParams();

    // Hash-based navigation
    const stepFromHash = getStepFromHash();
    if (stepFromHash > 1 && state.projectType) {
      showStep(stepFromHash);
    } else {
      showStep(1);
    }

    window.addEventListener('hashchange', function () {
      const step = getStepFromHash();
      if (step !== state.currentStep) showStep(step);
    });
  }

  // Run when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
