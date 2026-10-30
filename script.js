/**
 * VU Research — Warm Terracotta Sanctuary
 * High-Performance UI/UX Engine:
 * - Real-time Progress Tracker & Checklist
 * - Tactile Pebble Ripple & Keyboard Accessibility (WCAG 2.1 AA)
 * - Live PHQ-9 & MSPSS Subscale Scoring
 * - Smart "Next Unanswered" Navigation
 * - Web Audio 432Hz Ambient Soundscape Synthesizer
 * - Interactive Reflection Modal & JSON Export
 * - LocalStorage State Persistence
 */

document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'vu_research_warm_terracotta_data_v3';
  const TOTAL_CHECKPOINTS = 54;

  let state = {
    phq9Scores: {},
    likertScores: {},
    inputs: {},
    answeredQuestions: new Set(),
    soundscapeMode: false
  };

  // 1. Restore State from LocalStorage
  function restoreState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.phq9Scores) state.phq9Scores = parsed.phq9Scores;
        if (parsed.likertScores) state.likertScores = parsed.likertScores;
        if (parsed.inputs) state.inputs = parsed.inputs;
        if (parsed.answeredQuestions) state.answeredQuestions = new Set(parsed.answeredQuestions);

        // Restore input values
        Object.entries(state.inputs).forEach(([id, val]) => {
          const el = document.getElementById(id);
          if (el) el.value = val;
        });

        // Restore selected buttons
        Object.entries(state.likertScores).forEach(([q, val]) => {
          const group = document.querySelector(`[data-question="${q}"]`);
          if (group) {
            const btn = group.querySelector(`[data-value="${val}"], [data-label="${val}"]`);
            if (btn) {
              group.querySelectorAll('.pebble-btn').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
            }
          }
        });
      }
    } catch (e) {
      console.warn('Could not restore saved session', e);
    }
  }

  // Save State
  function saveState() {
    try {
      const payload = {
        phq9Scores: state.phq9Scores,
        likertScores: state.likertScores,
        inputs: state.inputs,
        answeredQuestions: Array.from(state.answeredQuestions),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {}
  }

  // 2. Ripple Micro-Interaction
  function createRipple(event, button) {
    const ripple = document.createElement('span');
    ripple.classList.add('pebble-ripple');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }

  // 3. Pebble Radio Group Controller
  function setupPebbleGroups() {
    const pebbleGroups = document.querySelectorAll('[data-pebble-group]');

    pebbleGroups.forEach(group => {
      const buttons = group.querySelectorAll('.pebble-btn');
      const targetReadoutId = group.getAttribute('data-readout');
      const readoutEl = targetReadoutId ? document.getElementById(targetReadoutId) : null;
      const isMulti = group.hasAttribute('data-multi');
      const isPhq = group.hasAttribute('data-phq');
      const questionId = group.getAttribute('data-question');
      const parentCard = group.closest('.question-card');

      // Make group accessible
      group.setAttribute('role', isMulti ? 'group' : 'radiogroup');

      buttons.forEach((btn, idx) => {
        btn.setAttribute('role', isMulti ? 'checkbox' : 'radio');
        btn.setAttribute('tabindex', btn.classList.contains('active') ? '0' : '-1');
        btn.setAttribute('aria-checked', btn.classList.contains('active') ? 'true' : 'false');

        // Click Handler
        btn.addEventListener('click', (e) => {
          createRipple(e, btn);

          if (!isMulti) {
            buttons.forEach(b => {
              b.classList.remove('active');
              b.setAttribute('tabindex', '-1');
              b.setAttribute('aria-checked', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('tabindex', '0');
            btn.setAttribute('aria-checked', 'true');
          } else {
            btn.classList.toggle('active');
            const isActive = btn.classList.contains('active');
            btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
          }

          // Readout Label
          const label = btn.getAttribute('data-label') || btn.innerText.trim();
          if (readoutEl) {
            readoutEl.textContent = label;
          }

          // Card Answered State
          if (parentCard) {
            parentCard.classList.add('answered');
          }

          // Record Score & State
          if (questionId) {
            state.answeredQuestions.add(questionId);

            if (isPhq) {
              const val = parseInt(btn.getAttribute('data-value'), 10) || 0;
              state.phq9Scores[questionId] = val;
              updatePhq9Score();
            } else {
              const val = btn.getAttribute('data-value') || label;
              state.likertScores[questionId] = val;
            }
          }

          // Highlight Guide Column if present
          highlightGuide(btn);

          updateProgress();
          saveState();
        });

        // Keyboard Navigation (Arrow Keys)
        btn.addEventListener('keydown', (e) => {
          let nextIdx = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            nextIdx = (idx + 1) % buttons.length;
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            nextIdx = (idx - 1 + buttons.length) % buttons.length;
          } else if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            btn.click();
            return;
          }

          if (nextIdx !== null) {
            e.preventDefault();
            buttons[nextIdx].focus();
            buttons[nextIdx].click();
          }
        });
      });
    });
  }

  // 4. Highlight Scoring Guide Column on Choice
  function highlightGuide(btn) {
    const val = btn.getAttribute('data-value') || btn.innerText.trim();
    const section = btn.closest('section');
    if (!section) return;

    const guideCards = section.querySelectorAll('.guide-card');
    if (!guideCards.length) return;

    guideCards.forEach(gc => gc.classList.remove('active'));
    // Match SD, D, N, A, SA or 1-7
    const matchMap = {
      'SD': '1', 'D': '2', 'N': '3', 'A': '4', 'SA': '5',
      'Never': '1', 'Rarely': '2', 'Occas.': '3', 'Often': '4', 'Daily': '5',
      'None': '1', 'Slight': '2', 'Moderate': '3', 'Very': '4', 'Extreme': '5'
    };
    const targetKey = matchMap[val] || val;
    guideCards.forEach(gc => {
      const gVal = gc.getAttribute('data-guide-val');
      if (gVal === targetKey) {
        gc.classList.add('active');
        setTimeout(() => gc.classList.remove('active'), 1800);
      }
    });
  }

  // 5. Input Field Change Handlers
  function setupInputs() {
    const inputs = document.querySelectorAll('input:not([type="checkbox"]), select');
    inputs.forEach(inp => {
      inp.addEventListener('input', () => {
        if (inp.id) {
          state.inputs[inp.id] = inp.value;
          if (inp.value.trim() !== '') {
            state.answeredQuestions.add(inp.id);
            const parent = inp.closest('.question-card');
            if (parent) parent.classList.add('answered');
          }
        }
        updateProgress();
        saveState();
      });
    });
  }

  // 6. PHQ-9 Real-Time Calculation
  function updatePhq9Score() {
    let total = 0;
    const phqQuestions = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9'];

    phqQuestions.forEach(q => {
      if (state.phq9Scores[q] !== undefined) {
        total += state.phq9Scores[q];
      } else {
        const activeBtn = document.querySelector(`[data-question="${q}"] .pebble-btn.active`);
        if (activeBtn) {
          const val = parseInt(activeBtn.getAttribute('data-value'), 10) || 0;
          state.phq9Scores[q] = val;
          total += val;
        }
      }
    });

    let severity = 'Minimal (নগণ্য)';
    let badgeClass = 'bg-[#FAF6F0] text-[#1C140E] border border-[#E6DED1]';
    let severityColor = '#BAA994';

    if (total >= 20) {
      severity = 'Severe Depression (তীব্র বিষণ্নতা)';
      badgeClass = 'bg-[#5A1E0B] text-white';
      severityColor = '#5A1E0B';
    } else if (total >= 15) {
      severity = 'Mod. Severe (মাঝারি তীব্র)';
      badgeClass = 'bg-[#7C2D12] text-white';
      severityColor = '#7C2D12';
    } else if (total >= 10) {
      severity = 'Moderate (মাঝারি)';
      badgeClass = 'bg-[#C2410C] text-white';
      severityColor = '#C2410C';
    } else if (total >= 5) {
      severity = 'Mild (মৃদু)';
      badgeClass = 'bg-[#DD956C] text-[#1C140E]';
      severityColor = '#DD956C';
    }

    // Update Header HUD
    const hudEl = document.getElementById('phq-hud-score');
    if (hudEl) {
      hudEl.textContent = `PHQ-9 Score: ${total} / 27 • ${severity}`;
      hudEl.className = `px-4 py-2 rounded-full text-xs font-bold tracking-wide shadow-sm transition-all duration-300 ${badgeClass}`;
    }

    // Update Floating HUD
    const floatingPhq = document.getElementById('floating-phq-badge');
    if (floatingPhq) {
      floatingPhq.textContent = `PHQ-9: ${total} (${severity.split(' ')[0]})`;
    }

    // Update Modal
    const modalScore = document.getElementById('modal-phq-score');
    const modalSeverity = document.getElementById('modal-phq-severity');
    const modalBar = document.getElementById('modal-phq-bar');
    if (modalScore) modalScore.textContent = `${total} / 27`;
    if (modalSeverity) modalSeverity.textContent = severity;
    if (modalBar) {
      const pct = Math.min(100, Math.round((total / 27) * 100));
      modalBar.style.width = `${pct}%`;
      modalBar.style.backgroundColor = severityColor;
    }
  }

  // 7. Calculate Progress Across 54 Items (0% to 100%)
  function updateProgress() {
    const questionKeys = new Set();

    // Check all pebble button groups
    document.querySelectorAll('[data-pebble-group]').forEach(group => {
      const q = group.getAttribute('data-question');
      if (q && group.querySelector('.pebble-btn.active')) {
        questionKeys.add(q);
      }
    });

    // Check Input A1 (Age)
    const ageEl = document.getElementById('input-age');
    if (ageEl && ageEl.value.trim() !== '') questionKeys.add('a1');

    // Check Input A2 (Height: ft or in)
    const ftEl = document.getElementById('input-height-ft');
    const inEl = document.getElementById('input-height-in');
    if ((ftEl && ftEl.value.trim() !== '') || (inEl && inEl.value.trim() !== '')) {
      questionKeys.add('a2');
    }

    // Check Input A4 (Weight)
    const wtEl = document.getElementById('input-weight');
    if (wtEl && wtEl.value.trim() !== '') questionKeys.add('a4');

    // Check Input G2 (Income)
    const incEl = document.getElementById('input-income');
    if (incEl && incEl.value.trim() !== '') questionKeys.add('g2');

    const answeredCount = Math.min(TOTAL_CHECKPOINTS, questionKeys.size);
    const pct = Math.round((answeredCount / TOTAL_CHECKPOINTS) * 100);

    // Slim top progress bar
    const bar = document.getElementById('zen-progress-bar');
    if (bar) bar.style.width = `${pct}%`;

    // Progress badges
    const progressText = document.getElementById('progress-indicator-text');
    if (progressText) progressText.textContent = `${answeredCount} / ${TOTAL_CHECKPOINTS} completed (${pct}%)`;

    const floatingProgress = document.getElementById('floating-progress-text');
    if (floatingProgress) floatingProgress.textContent = `${pct}% complete`;

    const mobileProgress = document.getElementById('mobile-progress-badge');
    if (mobileProgress) mobileProgress.textContent = `${pct}%`;

    // Update section checkmarks in Nav
    updateModuleCheckmarks();
  }

  function updateModuleCheckmarks() {
    const modules = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    modules.forEach(m => {
      const section = document.getElementById(`module-${m}`);
      if (!section) return;
      const groups = section.querySelectorAll('[data-pebble-group]');
      let allAnswered = true;
      groups.forEach(g => {
        if (!g.querySelector('.pebble-btn.active')) allAnswered = false;
      });

      const navPill = document.querySelector(`.waypoint-link[href="#module-${m}"]`);
      if (navPill) {
        let badge = navPill.querySelector('.module-complete-check');
        if (allAnswered) {
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'module-complete-check ml-1 text-[11px] font-bold text-emerald-600';
            badge.textContent = '✓';
            navPill.appendChild(badge);
          }
        } else if (badge) {
          badge.remove();
        }
      }
    });
  }

  // 8. Smart "Next Unanswered" Navigation
  function jumpToNextUnanswered() {
    const allGroups = document.querySelectorAll('[data-pebble-group]');
    for (const g of allGroups) {
      if (!g.querySelector('.pebble-btn.active')) {
        const card = g.closest('.question-card') || g;
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('highlight-unanswered');
        setTimeout(() => card.classList.remove('highlight-unanswered'), 3000);
        showToast('Jumped to next unanswered question');
        return;
      }
    }
    showToast('All 54 questions completed! Ready to submit.');
    document.getElementById('submission-card').scrollIntoView({ behavior: 'smooth' });
  }

  // 9. Sticky Nav Elevation & Scroll-Spy Navigation
  function setupScrollSpy() {
    const gardenNav = document.getElementById('garden-nav');
    const waypoints = document.querySelectorAll('.waypoint-link');
    const sections = Array.from(waypoints).map(link => {
      const id = link.getAttribute('href').replace('#', '');
      return document.getElementById(id);
    }).filter(Boolean);

    let ticking = false;
    let isNavScrolled = false;

    const updateNavElevation = () => {
      if (!gardenNav) return;
      if (window.innerWidth >= 768) {
        const scrolledPast = window.scrollY > 40;
        if (scrolledPast !== isNavScrolled) {
          isNavScrolled = scrolledPast;
          gardenNav.classList.toggle('nav-scrolled', isNavScrolled);
        }
      } else if (isNavScrolled) {
        isNavScrolled = false;
        gardenNav.classList.remove('nav-scrolled');
      }
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateNavElevation();

          let currentSectionId = '';
          const scrollPos = window.scrollY + 160;

          sections.forEach(sec => {
            if (sec.offsetTop <= scrollPos) {
              currentSectionId = sec.getAttribute('id');
            }
          });

          if (currentSectionId) {
            waypoints.forEach(link => {
              const href = link.getAttribute('href');
              const isCurrent = href === `#${currentSectionId}`;
              if (isCurrent) {
                link.classList.add('active');
                link.classList.remove('bg-[#FFFDF9]', 'text-[#3D2F24]');
                link.classList.add('bg-[#241812]', 'text-white');
              } else {
                link.classList.remove('active', 'bg-[#241812]', 'text-white');
                link.classList.add('bg-[#FFFDF9]', 'text-[#3D2F24]');
              }
            });
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', updateNavElevation, { passive: true });
    updateNavElevation();
  }

  // 10. Ambient Courtyard Rain Synthesizer (Web Audio API with Smooth Fade)
  let audioCtx = null;
  let isPlayingSound = false;
  let rainNodes = [];

  function toggleSoundscape() {
    const btn = document.getElementById('soundscape-toggle');
    const floatingBtn = document.getElementById('floating-sound-toggle');
    const statusText = document.getElementById('soundscape-status');
    const waveIndicator = document.getElementById('soundscape-waves');

    if (!isPlayingSound) {
      try {
        if (!audioCtx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        const bufferSize = audioCtx.sampleRate * 2;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
          b6 = white * 0.115926;
        }

        const rainSource = audioCtx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, audioCtx.currentTime);

        const drone = audioCtx.createOscillator();
        drone.type = 'sine';
        drone.frequency.setValueAtTime(432, audioCtx.currentTime);

        const droneGain = audioCtx.createGain();
        droneGain.gain.setValueAtTime(0.015, audioCtx.currentTime);

        const masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
        // Smooth fade-in
        masterGain.gain.exponentialRampToValueAtTime(0.35, audioCtx.currentTime + 1.2);

        rainSource.connect(filter);
        filter.connect(masterGain);
        drone.connect(droneGain);
        droneGain.connect(masterGain);
        masterGain.connect(audioCtx.destination);

        rainSource.start();
        drone.start();

        rainNodes = [rainSource, drone, masterGain];
        isPlayingSound = true;

        if (statusText) statusText.textContent = 'Courtyard Rain Active (432Hz Ambient Soundscape)';
        if (waveIndicator) waveIndicator.classList.remove('hidden');
        if (btn) btn.classList.add('bg-[#FAF6F0]', 'border-[#8A4500]');
        if (floatingBtn) floatingBtn.classList.add('bg-[#8A4500]', 'text-white');
        showToast('Ambient 432Hz Courtyard Rain Started');
      } catch (err) {
        console.error('Audio init error:', err);
        showToast('Audio not supported in this browser');
      }
    } else {
      if (rainNodes[2] && audioCtx) {
        const master = rainNodes[2];
        master.gain.setValueAtTime(master.gain.value, audioCtx.currentTime);
        master.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        setTimeout(() => {
          rainNodes.forEach(n => {
            try { n.stop ? n.stop() : n.disconnect(); } catch (e) {}
          });
          rainNodes = [];
        }, 850);
      }
      isPlayingSound = false;
      if (statusText) statusText.textContent = 'Soft Courtyard Rain Soundscape (432Hz ambient frequency)';
      if (waveIndicator) waveIndicator.classList.add('hidden');
      if (btn) btn.classList.remove('bg-[#FAF6F0]', 'border-[#8A4500]');
      if (floatingBtn) floatingBtn.classList.remove('bg-[#8A4500]', 'text-white');
      showToast('Soundscape Paused');
    }
  }

  // 11. Modal & Reflection Summary
  function setupModal() {
    const reviewBtn = document.getElementById('review-btn');
    const submitBtn = document.getElementById('submit-btn');
    const floatingReview = document.getElementById('floating-review-btn');
    const modal = document.getElementById('reflection-modal');
    const closeModal = document.getElementById('close-modal');
    const consentCheck = document.getElementById('consent-checkbox');

    function openModal() {
      if (consentCheck && !consentCheck.checked) {
        showToast('অনুগ্রহ করে সম্মতি বক্সে টিক দিন (Please agree to consent)');
        consentCheck.focus();
        consentCheck.parentElement.classList.add('ring-2', 'ring-red-400', 'p-1', 'rounded-lg');
        setTimeout(() => consentCheck.parentElement.classList.remove('ring-2', 'ring-red-400', 'p-1', 'rounded-lg'), 2500);
        return;
      }

      // Generate Pseudonymous Hash Token
      const token = 'VU-' + Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const tokenEl = document.getElementById('modal-crypto-token');
      if (tokenEl) tokenEl.textContent = token;

      // Calculate Scores
      updatePhq9Score();
      calculateMspssBreakdown();

      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    if (reviewBtn) reviewBtn.addEventListener('click', openModal);
    if (floatingReview) floatingReview.addEventListener('click', openModal);
    if (submitBtn) submitBtn.addEventListener('click', () => {
      openModal();
      showToast('Questionnaire completed! Review your reflections below.');
    });

    if (closeModal) closeModal.addEventListener('click', () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    });

    // Copy Token Action
    const copyBtn = document.getElementById('copy-token-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const tokenText = document.getElementById('modal-crypto-token').textContent;
        navigator.clipboard.writeText(tokenText).then(() => {
          showToast('Research Hash Token copied to clipboard!');
        });
      });
    }

    // Export JSON Action
    const exportBtn = document.getElementById('export-json-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportResponsesAsJSON);
    }
  }

  // 12. MSPSS Subscale Calculator
  function calculateMspssBreakdown() {
    const scores = {};
    for (let i = 1; i <= 12; i++) {
      const q = `f${i}`;
      scores[q] = parseFloat(state.likertScores[q]) || 5.0;
    }

    const soMean = ((scores['f1'] + scores['f2'] + scores['f5'] + scores['f10']) / 4).toFixed(1);
    const famMean = ((scores['f3'] + scores['f4'] + scores['f8'] + scores['f11']) / 4).toFixed(1);
    const friMean = ((scores['f6'] + scores['f7'] + scores['f9'] + scores['f12']) / 4).toFixed(1);
    const totalMean = (Object.values(scores).reduce((a, b) => a + b, 0) / 12).toFixed(1);

    const mspssTotalEl = document.getElementById('modal-mspss-score');
    if (mspssTotalEl) mspssTotalEl.textContent = `${totalMean} / 7.0`;

    const soEl = document.getElementById('modal-mspss-so');
    const famEl = document.getElementById('modal-mspss-fam');
    const friEl = document.getElementById('modal-mspss-fri');

    if (soEl) soEl.textContent = `${soMean} / 7.0`;
    if (famEl) famEl.textContent = `${famMean} / 7.0`;
    if (friEl) friEl.textContent = `${friMean} / 7.0`;

    const soBar = document.getElementById('modal-mspss-so-bar');
    const famBar = document.getElementById('modal-mspss-fam-bar');
    const friBar = document.getElementById('modal-mspss-fri-bar');

    if (soBar) soBar.style.width = `${(soMean / 7) * 100}%`;
    if (famBar) famBar.style.width = `${(famMean / 7) * 100}%`;
    if (friBar) friBar.style.width = `${(friMean / 7) * 100}%`;
  }

  // 13. Export JSON Responses
  function exportResponsesAsJSON() {
    const payload = {
      protocol: 'VU/ERC/2026/042',
      institution: 'Varendra University, CIR',
      timestamp: new Date().toISOString(),
      phq9Scores: state.phq9Scores,
      likertScores: state.likertScores,
      inputs: state.inputs,
      totalAnswered: state.answeredQuestions.size
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `VU_Research_Response_${Date.now()}.json`);
    dlAnchor.click();
    showToast('Downloaded response JSON file');
  }

  // 14. Toast Notification Utility
  function showToast(msg) {
    let toast = document.getElementById('zen-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'zen-toast';
      toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#241812] text-white px-5 py-2.5 rounded-full text-xs font-medium shadow-xl transition-all duration-300 opacity-0 pointer-events-none border border-[#8A4500]/40';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');
    setTimeout(() => {
      toast.classList.remove('opacity-100');
      toast.classList.add('opacity-0', 'pointer-events-none');
    }, 2800);
  }

  // 15. Bind Event Handlers
  const soundBtn = document.getElementById('soundscape-toggle');
  if (soundBtn) soundBtn.addEventListener('click', toggleSoundscape);

  const floatingSoundBtn = document.getElementById('floating-sound-toggle');
  if (floatingSoundBtn) floatingSoundBtn.addEventListener('click', toggleSoundscape);

  const nextUnansweredBtn = document.getElementById('jump-next-unanswered');
  if (nextUnansweredBtn) nextUnansweredBtn.addEventListener('click', jumpToNextUnanswered);

  const mobileNextBtn = document.getElementById('mobile-next-unanswered');
  if (mobileNextBtn) mobileNextBtn.addEventListener('click', jumpToNextUnanswered);

  const scrollTopBtn = document.getElementById('scroll-top-btn');
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Initialize
  restoreState();
  setupPebbleGroups();
  setupInputs();
  updatePhq9Score();
  updateProgress();
  setupScrollSpy();
  setupModal();
});
