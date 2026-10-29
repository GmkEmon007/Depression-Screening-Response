/**
 * VU Research — Warm Terracotta Sanctuary (Figma Auto-Layout Master)
 * Interactive Engine:
 * - Dynamic single-select Pebble Radios
 * - Live PHQ-9 depression severity calculation & floating HUD
 * - Smooth Garden Waypoints navigation with scroll-spy
 * - Synthesized Web Audio courtyard rain soundscape (432Hz)
 * - LocalStorage state preservation (Save Zen Seed)
 * - Complete Reflection submission & modal dialog
 */

(function () {
  'use strict';

  const state = {
    phq9Score: 0,
    soundscapeActive: false,
    audioCtx: null,
    rainSource: null,
    soundscapeTrigger: null
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setupPebbleButtons();
    setupWaypointNavigation();
    setupScrollSpy();
    setupSoundscapeToggle();
    setupSaveAndResume();
    setupFormSubmission();
    createFloatingHUD();
    createModalElements();
    createToastElement();
    calculatePHQ9Score();
    restoreZenSeed();
  }

  /* ==========================================================================
     1. Tactile Pebble Buttons
     ========================================================================== */
  function setupPebbleButtons() {
    const buttons = document.querySelectorAll('.pebble-touch');

    buttons.forEach(btn => {
      // Ignore navigation links, submit button, or header/footer elements
      if (
        btn.tagName.toLowerCase() === 'a' ||
        btn.type === 'submit' ||
        btn.closest('nav') ||
        btn.closest('footer') ||
        btn.innerText.includes('Complete Reflection') ||
        btn.innerText.includes('Save Zen Seed')
      ) {
        return;
      }

      // Determine parent button container
      const parentGroup = btn.closest('[role="radiogroup"]') || btn.closest('.grid') || btn.parentElement;
      if (!parentGroup) return;

      btn.setAttribute('role', 'radio');

      // Check if button was already selected
      if (btn.classList.contains('bg-sienna-700') || btn.classList.contains('pebble-active') || btn.getAttribute('aria-checked') === 'true') {
        btn.classList.add('pebble-active');
        btn.setAttribute('aria-checked', 'true');
      } else {
        btn.setAttribute('aria-checked', 'false');
      }

      btn.addEventListener('click', function (e) {
        e.preventDefault();

        // Deselect sibling buttons in this group
        const siblingButtons = parentGroup.querySelectorAll('.pebble-touch');
        siblingButtons.forEach(sBtn => {
          sBtn.classList.remove('pebble-active', 'bg-sienna-700', 'text-white');
          sBtn.setAttribute('aria-checked', 'false');
        });

        // Activate clicked button
        btn.classList.add('pebble-active');
        btn.setAttribute('aria-checked', 'true');

        // Recalculate PHQ-9 if inside Module B
        if (btn.closest('#module-b')) {
          calculatePHQ9Score();
        }
      });
    });
  }

  /* ==========================================================================
     2. Real-Time PHQ-9 Scoring Engine
     ========================================================================== */
  function calculatePHQ9Score() {
    const moduleB = document.getElementById('module-b');
    if (!moduleB) return;

    let score = 0;

    // Find all question cards inside Module B (B1 through B9)
    const questionCards = moduleB.querySelectorAll('.bg-warmalmond');

    questionCards.forEach(card => {
      const activeBtn = card.querySelector('.pebble-active, [aria-checked="true"]');
      if (activeBtn) {
        const text = activeBtn.innerText;
        // Parse points from "(0)", "(1)", "(2)", "(3)"
        const match = text.match(/\(([0-3])\)/);
        if (match) {
          score += parseInt(match[1], 10);
        } else {
          // Fallback by button index in group
          const allOptions = Array.from(card.querySelectorAll('.pebble-touch'));
          const idx = allOptions.indexOf(activeBtn);
          if (idx >= 0 && idx <= 3) {
            score += idx;
          }
        }
      }
    });

    state.phq9Score = score;
    updateHUD();
  }

  function getPHQ9Category(score) {
    if (score <= 4) {
      return { level: 'Minimal', bengali: 'স্বাভাবিক / ন্যূনতম লক্ষণ', className: 'severity-minimal', advice: 'Your responses indicate minimal symptoms. Continue your mindful vitality habits.' };
    } else if (score <= 9) {
      return { level: 'Mild', bengali: 'মৃদু বিষণ্ণতা', className: 'severity-mild', advice: 'Mild depressive symptoms noted. Regular restorative rest and academic pacing are advised.' };
    } else if (score <= 14) {
      return { level: 'Moderate', bengali: 'মাঝারি বিষণ্ণতা', className: 'severity-moderate', advice: 'Moderate symptoms observed. Consider speaking with an academic advisor or campus counselor.' };
    } else if (score <= 19) {
      return { level: 'Moderately Severe', bengali: 'উচ্চ-মাঝারি বিষণ্ণতা', className: 'severity-severe', advice: 'Elevated stress and depression indicators. Professional wellness consultation is encouraged.' };
    } else {
      return { level: 'Severe', bengali: 'তীব্র বিষণ্ণতা', className: 'severity-severe', advice: 'Significant clinical indicators detected. Immediate confidential counseling support is strongly recommended.' };
    }
  }

  /* ==========================================================================
     3. Floating HUD Indicator
     ========================================================================== */
  function createFloatingHUD() {
    let hud = document.querySelector('.zen-score-hud');
    if (!hud) {
      hud = document.createElement('aside');
      hud.className = 'zen-score-hud';
      hud.setAttribute('aria-label', 'Reflection Progress HUD');
      hud.innerHTML = `
        <div class="score-badge-circle" id="hudScoreCircle">0</div>
        <div class="space-y-0.5">
          <div class="flex items-center gap-1.5 text-[11px] font-bold text-[#1C140E] uppercase tracking-wider">
            <span>PHQ-9 Index</span>
            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#F3EDE2] text-[#291E16]" id="hudSeverityBadge">Minimal</span>
          </div>
          <div class="text-[11px] text-[#524032] font-['Noto_Serif_Bengali']" id="hudSeverityBn">স্বাভাবিক / ন্যূনতম লক্ষণ</div>
        </div>
      `;
      document.body.appendChild(hud);

      hud.addEventListener('click', () => {
        const modB = document.getElementById('module-b');
        if (modB) modB.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  function updateHUD() {
    const circle = document.getElementById('hudScoreCircle');
    const badge = document.getElementById('hudSeverityBadge');
    const bnText = document.getElementById('hudSeverityBn');

    if (!circle || !badge) return;

    const cat = getPHQ9Category(state.phq9Score);

    circle.textContent = state.phq9Score;
    circle.className = `score-badge-circle ${cat.className}`;
    badge.textContent = `${cat.level} (${state.phq9Score}/27)`;
    badge.className = `text-[9px] font-mono px-2 py-0.5 rounded-full font-semibold ${cat.className}`;
    if (bnText) bnText.textContent = cat.bengali;
  }

  /* ==========================================================================
     4. Garden Waypoints & Scroll-Spy
     ========================================================================== */
  function setupWaypointNavigation() {
    const waypointLinks = document.querySelectorAll('nav[aria-label="Garden Stations"] a[href^="#"]');

    waypointLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
          const headerOffset = 80;
          const elementPosition = targetSection.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  function setupScrollSpy() {
    const sections = document.querySelectorAll('section[id^="module-"]');
    const waypointLinks = document.querySelectorAll('nav[aria-label="Garden Stations"] a[href^="#"]');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const activeId = entry.target.getAttribute('id');

          waypointLinks.forEach(link => {
            const href = link.getAttribute('href').substring(1);
            if (href === activeId) {
              link.classList.add('bg-espresso-900', 'text-white', 'shadow-pebble-active');
              link.classList.remove('bg-warmalmond', 'text-espresso-900');
              const circle = link.querySelector('span');
              if (circle) circle.classList.add('bg-sienna-600', 'text-white');
            } else {
              link.classList.remove('bg-espresso-900', 'text-white', 'shadow-pebble-active');
              link.classList.add('bg-warmalmond', 'text-espresso-900');
              const circle = link.querySelector('span');
              if (circle) circle.classList.remove('bg-sienna-600', 'text-white');
            }
          });
        }
      });
    }, {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    });

    sections.forEach(sec => observer.observe(sec));
  }

  /* ==========================================================================
     5. Synthesized Courtyard Rain Ambient Soundscape (Web Audio API)
     ========================================================================== */
  function setupSoundscapeToggle() {
    // Find soundscape label in header
    const soundscapePill = document.querySelector('.bg-linen-100\\/90 .pt-6.mt-6 span.flex.items-center');
    if (!soundscapePill) return;

    soundscapePill.style.cursor = 'pointer';
    soundscapePill.classList.add('pebble-touch', 'px-3', 'py-1.5', 'rounded-full', 'border', 'border-linen-200', 'transition-all');
    soundscapePill.setAttribute('title', 'Click to toggle gentle courtyard rain ambient sound (432Hz)');

    soundscapePill.addEventListener('click', toggleSoundscape);
    state.soundscapeTrigger = soundscapePill;
  }

  function toggleSoundscape() {
    const trigger = state.soundscapeTrigger;

    if (!state.soundscapeActive) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!state.audioCtx) {
          state.audioCtx = new AudioContext();
        }
        if (state.audioCtx.state === 'suspended') {
          state.audioCtx.resume();
        }

        // Generate synthetic gentle courtyard rain (brown noise + lowpass filter)
        const bufferSize = state.audioCtx.sampleRate * 2;
        const noiseBuffer = state.audioCtx.createBuffer(1, bufferSize, state.audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 2.6;
        }

        const whiteNoise = state.audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = state.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, state.audioCtx.currentTime);

        const gainNode = state.audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.12, state.audioCtx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(state.audioCtx.destination);

        whiteNoise.start();

        state.rainSource = whiteNoise;
        state.soundscapeActive = true;

        if (trigger) {
          trigger.classList.add('soundscape-active');
          const icon = trigger.querySelector('.material-symbols-outlined');
          if (icon) icon.textContent = 'waves';
        }
        showToast('🌧️ Courtyard Rain Soundscape (432Hz) Activated');
      } catch (err) {
        console.warn('Web Audio error:', err);
      }
    } else {
      if (state.rainSource) {
        try {
          state.rainSource.stop();
          state.rainSource.disconnect();
        } catch (_) {}
      }
      state.soundscapeActive = false;

      if (trigger) {
        trigger.classList.remove('soundscape-active');
        const icon = trigger.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = 'volume_up';
      }
      showToast('Courtyard Rain Soundscape Paused');
    }
  }

  /* ==========================================================================
     6. Save Zen Seed & LocalStorage
     ========================================================================== */
  function setupSaveAndResume() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      if (btn.innerText && btn.innerText.includes('Save Zen Seed')) {
        btn.addEventListener('click', saveZenSeed);
      }
    });
  }

  function saveZenSeed() {
    const data = {
      timestamp: new Date().toISOString(),
      phq9Score: state.phq9Score,
      inputs: {},
      selects: {},
      selectedButtonIndices: []
    };

    document.querySelectorAll('input:not([type="submit"]):not([type="button"])').forEach(input => {
      if (input.id || input.name) {
        data.inputs[input.id || input.name] = input.type === 'checkbox' ? input.checked : input.value;
      }
    });

    document.querySelectorAll('select').forEach(sel => {
      if (sel.id) data.selects[sel.id] = sel.value;
    });

    document.querySelectorAll('.pebble-touch.pebble-active, .pebble-touch[aria-checked="true"]').forEach(btn => {
      const parent = btn.parentElement;
      if (parent) {
        const siblings = Array.from(parent.querySelectorAll('.pebble-touch'));
        const index = siblings.indexOf(btn);
        const cardTitle = parent.closest('.bg-warmalmond')?.querySelector('label, p, span')?.innerText?.slice(0, 30) || '';
        data.selectedButtonIndices.push({ cardTitle, index });
      }
    });

    try {
      localStorage.setItem('vu_terracotta_zen_seed', JSON.stringify(data));
      showToast('🌱 Zen Seed Safely Preserved in Browser Storage');
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  function restoreZenSeed() {
    try {
      const saved = localStorage.getItem('vu_terracotta_zen_seed');
      if (!saved) return;
      const data = JSON.parse(saved);

      if (data.inputs) {
        Object.keys(data.inputs).forEach(key => {
          const el = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
          if (el) {
            if (el.type === 'checkbox') el.checked = data.inputs[key];
            else el.value = data.inputs[key];
          }
        });
      }

      if (data.selects) {
        Object.keys(data.selects).forEach(id => {
          const sel = document.getElementById(id);
          if (sel) sel.value = data.selects[id];
        });
      }

      if (data.selectedButtonIndices && Array.isArray(data.selectedButtonIndices)) {
        data.selectedButtonIndices.forEach(item => {
          const cards = document.querySelectorAll('.bg-warmalmond');
          cards.forEach(card => {
            const label = card.querySelector('label, p, span')?.innerText?.slice(0, 30);
            if (label && label === item.cardTitle) {
              const buttons = card.querySelectorAll('.pebble-touch');
              if (buttons[item.index]) {
                buttons[item.index].click();
              }
            }
          });
        });
      }

      calculatePHQ9Score();
    } catch (_) {}
  }

  /* ==========================================================================
     7. Form Submission & Reflection Summary Modal
     ========================================================================== */
  function setupFormSubmission() {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', function (e) {
      e.preventDefault();

      // Check voluntary informed consent checkbox
      const consentBox = document.querySelector('input[type="checkbox"]');
      if (consentBox && !consentBox.checked) {
        consentBox.focus();
        showToast('⚠️ Please provide voluntary informed consent to proceed.');
        consentBox.closest('div').scrollIntoView({ behavior: 'smooth' });
        return;
      }

      openReflectionModal();
    });
  }

  function createModalElements() {
    let modal = document.querySelector('.zen-modal-backdrop');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'zen-modal-backdrop';
      modal.innerHTML = `
        <div class="zen-modal-card">
          <div class="flex items-center justify-between border-b border-[#E6DED1] pb-4 mb-6">
            <div class="flex items-center gap-3">
              <span class="w-10 h-10 rounded-2xl bg-[#FBECE3] flex items-center justify-center text-[#9A3412]">
                <span class="material-symbols-outlined text-xl">psychology</span>
              </span>
              <div>
                <h3 class="text-xl font-['Fraunces'] font-bold text-[#1C140E]">Mindful Reflection Summary</h3>
                <p class="text-xs text-[#524032]">CIR Ethics Clearance Protocol: <span class="font-mono font-semibold">VU/ERC/2026/042</span></p>
              </div>
            </div>
            <button class="p-2 rounded-full hover:bg-[#F3EDE2] text-[#291E16] transition-colors" id="closeModalBtn" aria-label="Close Modal">
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div class="space-y-6" id="modalContentBody"></div>

          <div class="mt-8 pt-4 border-t border-[#E6DED1] flex flex-wrap items-center justify-between gap-3">
            <button class="px-4 py-2.5 rounded-full border border-[#D5C9B8] text-xs text-[#1C140E] font-medium hover:bg-[#F3EDE2]" id="printReportBtn">
              <span class="material-symbols-outlined text-sm mr-1">print</span> Print Summary
            </button>
            <div class="flex gap-2">
              <button class="px-5 py-2.5 rounded-full border border-[#E6DED1] text-xs text-[#3D2F24]" id="downloadJsonBtn">
                <span class="material-symbols-outlined text-sm mr-1">download</span> Export JSON
              </button>
              <button class="px-6 py-2.5 rounded-full bg-[#8A4500] text-white font-medium text-xs shadow-md" id="confirmDoneBtn">
                Close Sanctuary
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#closeModalBtn').addEventListener('click', closeReflectionModal);
      modal.querySelector('#confirmDoneBtn').addEventListener('click', closeReflectionModal);
      modal.querySelector('#printReportBtn').addEventListener('click', () => window.print());
      modal.querySelector('#downloadJsonBtn').addEventListener('click', downloadReflectionData);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeReflectionModal();
      });
    }
  }

  function openReflectionModal() {
    const modal = document.querySelector('.zen-modal-backdrop');
    const body = document.getElementById('modalContentBody');
    if (!modal || !body) return;

    calculatePHQ9Score();
    const cat = getPHQ9Category(state.phq9Score);
    const token = 'VU-ENC-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const age = document.getElementById('student_age')?.value || '21';
    const weight = document.getElementById('student_weight')?.value || '62';
    const semester = document.getElementById('select_a7_semester')?.value || '5th Semester';

    body.innerHTML = `
      <div class="bg-[#F3EDE2] rounded-2xl p-4 border border-[#E6DED1] flex items-center justify-between">
        <div>
          <span class="text-[10px] uppercase tracking-widest text-[#524032] font-bold">Research Identification Token</span>
          <div class="font-mono text-sm font-bold text-[#9A3412]">${token}</div>
        </div>
        <div class="text-right text-[11px] text-[#524032]">
          <div class="font-bold">Varendra University</div>
          <div class="text-[10px]">Center for Interdisciplinary Research (CIR)</div>
        </div>
      </div>

      <div class="bg-[#FFFDF9] rounded-2xl p-5 border border-[#E6DED1] space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-[#1C140E] uppercase tracking-wide">PHQ-9 Depression Severity Index</span>
          <span class="px-3 py-1 rounded-full text-xs font-bold ${cat.className}">${cat.level} (${state.phq9Score} / 27)</span>
        </div>
        <div class="text-xs font-['Noto_Serif_Bengali'] text-[#1C140E]">${cat.bengali}</div>
        <p class="text-xs text-[#3D2F24] leading-relaxed">${cat.advice}</p>
      </div>

      <div class="grid grid-cols-3 gap-3 text-center text-xs">
        <div class="p-3 bg-[#FAF6F0] rounded-2xl border border-[#E6DED1]">
          <div class="text-[#524032] text-[10px]">Reported Age</div>
          <div class="font-bold text-[#1C140E] mt-0.5">${age} yrs</div>
        </div>
        <div class="p-3 bg-[#FAF6F0] rounded-2xl border border-[#E6DED1]">
          <div class="text-[#524032] text-[10px]">Academic Stage</div>
          <div class="font-bold text-[#1C140E] mt-0.5">${semester.split(' ')[0]}</div>
        </div>
        <div class="p-3 bg-[#FAF6F0] rounded-2xl border border-[#E6DED1]">
          <div class="text-[#524032] text-[10px]">Body Mass (KG)</div>
          <div class="font-bold text-[#1C140E] mt-0.5">${weight} kg</div>
        </div>
      </div>

      <div class="bg-[#FDF8F5] rounded-2xl p-4 border border-[#F6D7C3] space-y-2">
        <div class="flex items-center gap-2 text-xs font-bold text-[#1C140E]">
          <span class="material-symbols-outlined text-[#9A3412] text-sm">support_agent</span>
          <span>Confidential Support Sanctuary (মানসিক সহায়তা হেল্পলাইন):</span>
        </div>
        <p class="text-xs text-[#3D2F24] leading-relaxed">
          If you ever experience emotional overwhelm or need a compassionate listening ear:
        </p>
        <div class="flex flex-wrap gap-2 pt-1 text-[11px]">
          <span class="px-3 py-1 rounded-full bg-[#FFFDF9] border border-[#E6DED1] font-medium">📞 Kaan Pete Roi: +8801779554391</span>
          <span class="px-3 py-1 rounded-full bg-[#FFFDF9] border border-[#E6DED1] font-medium">🏥 National Helpline: 333</span>
          <span class="px-3 py-1 rounded-full bg-[#FFFDF9] border border-[#E6DED1] font-medium">🏛️ VU Student Wellness Cell</span>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  function closeReflectionModal() {
    const modal = document.querySelector('.zen-modal-backdrop');
    if (modal) modal.classList.remove('active');
  }

  function downloadReflectionData() {
    const data = {
      protocol: 'VU/ERC/2026/042',
      institution: 'Varendra University',
      timestamp: new Date().toISOString(),
      phq9Score: state.phq9Score,
      severityLevel: getPHQ9Category(state.phq9Score).level
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VU_Reflection_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Reflection Record Exported as JSON');
  }

  /* ==========================================================================
     8. Toast Utility
     ========================================================================== */
  function createToastElement() {
    let toast = document.querySelector('.zen-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'zen-toast';
      document.body.appendChild(toast);
    }
  }

  function showToast(msg) {
    const toast = document.querySelector('.zen-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
  }

})();
