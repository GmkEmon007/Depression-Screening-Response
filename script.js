/**
 * VU Research — Warm Terracotta Sanctuary
 * Interactive Logic: Pebble Touch, Live PHQ-9 Scoring, MSPSS Subscales,
 * Soundscape Synthesizer, Scroll-Spy, and Reflection Modal.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial State & Storage Keys
  const STORAGE_KEY = 'vu_research_warm_terracotta_data_v1';
  let formData = {
    phq9Scores: {},
    likertScores: {},
    inputs: {},
    completedModules: new Set(['module-a', 'module-b'])
  };

  // Restore previous answers if available
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.inputs) formData.inputs = parsed.inputs;
    }
  } catch (e) {
    console.warn('Could not read localStorage', e);
  }

  // 2. Generic Pebble Selection Handler
  function setupPebbleGroups() {
    const pebbleGroups = document.querySelectorAll('[data-pebble-group]');
    
    pebbleGroups.forEach(group => {
      const buttons = group.querySelectorAll('.pebble-btn');
      const targetReadoutId = group.getAttribute('data-readout');
      const readoutEl = targetReadoutId ? document.getElementById(targetReadoutId) : null;
      const isMulti = group.hasAttribute('data-multi');
      const isPhq = group.hasAttribute('data-phq');
      const questionId = group.getAttribute('data-question');

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          if (!isMulti) {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
          } else {
            btn.classList.toggle('active');
          }

          // Readout label
          const label = btn.getAttribute('data-label') || btn.innerText.trim();
          if (readoutEl) {
            readoutEl.textContent = label;
          }

          // If PHQ-9 group, recalculate score
          if (isPhq && questionId) {
            const val = parseInt(btn.getAttribute('data-value'), 10) || 0;
            formData.phq9Scores[questionId] = val;
            updatePhq9Score();
          }

          // If Likert or other scale, record
          if (questionId) {
            formData.likertScores[questionId] = btn.getAttribute('data-value') || label;
          }

          // Save state debounced
          saveState();
        });
      });
    });
  }

  // 3. Live PHQ-9 Score Calculation
  function updatePhq9Score() {
    // Default initial answers from mockup:
    // B1: 1, B2: 1, B3: 2, B4: 1, B5: 3, B6: 3, B7: 2, B8: 0, B9: 0
    let total = 0;
    const phqQuestions = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9'];
    
    phqQuestions.forEach(q => {
      if (formData.phq9Scores[q] !== undefined) {
        total += formData.phq9Scores[q];
      } else {
        // Find currently active button in DOM
        const activeBtn = document.querySelector(`[data-question="${q}"] .pebble-btn.active`);
        if (activeBtn) {
          const val = parseInt(activeBtn.getAttribute('data-value'), 10) || 0;
          formData.phq9Scores[q] = val;
          total += val;
        }
      }
    });

    let severity = 'Minimal (নগণ্য)';
    let badgeColor = 'bg-linen-200 text-espresso-900';

    if (total >= 20) {
      severity = 'Severe Depression (তীব্র বিষণ্নতা)';
      badgeColor = 'bg-[#7C2D12] text-white';
    } else if (total >= 15) {
      severity = 'Mod. Severe (মাঝারি তীব্র)';
      badgeColor = 'bg-[#C2410C] text-white';
    } else if (total >= 10) {
      severity = 'Moderate (মাঝারি)';
      badgeColor = 'bg-[#D97706] text-white';
    } else if (total >= 5) {
      severity = 'Mild (মৃদু)';
      badgeColor = 'bg-[#EDBE9F] text-espresso-950';
    }

    const hudEl = document.getElementById('phq-hud-score');
    if (hudEl) {
      hudEl.textContent = `${total} / 27 • ${severity}`;
    }

    const floatingHud = document.getElementById('floating-phq-badge');
    if (floatingHud) {
      floatingHud.textContent = `PHQ-9: ${total} (${severity.split(' ')[0]})`;
    }
  }

  // 4. Scroll-Spy for Navigation Bar
  function setupScrollSpy() {
    const waypoints = document.querySelectorAll('.waypoint-link');
    const sections = Array.from(waypoints).map(link => {
      const id = link.getAttribute('href').replace('#', '');
      return document.getElementById(id);
    }).filter(Boolean);

    window.addEventListener('scroll', () => {
      let currentSectionId = '';
      const scrollPos = window.scrollY + 180;

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
    }, { passive: true });
  }

  // 5. Ambient Courtyard Rain Synthesizer (Web Audio API)
  let audioCtx = null;
  let isPlayingSound = false;
  let rainNodes = [];

  function toggleSoundscape() {
    const btn = document.getElementById('soundscape-toggle');
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

        // Pink noise rain synthesis
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
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
          b6 = white * 0.115926;
        }

        const rainSource = audioCtx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        // Bandpass filter for soothing rain sound
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(850, audioCtx.currentTime);

        // 432Hz peaceful harmonic drone
        const drone = audioCtx.createOscillator();
        drone.type = 'sine';
        drone.frequency.setValueAtTime(432, audioCtx.currentTime);

        const droneGain = audioCtx.createGain();
        droneGain.gain.setValueAtTime(0.012, audioCtx.currentTime);

        const masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.35, audioCtx.currentTime);

        rainSource.connect(filter);
        filter.connect(masterGain);
        drone.connect(droneGain);
        droneGain.connect(masterGain);
        masterGain.connect(audioCtx.destination);

        rainSource.start();
        drone.start();

        rainNodes = [rainSource, drone, masterGain];
        isPlayingSound = true;

        if (statusText) statusText.textContent = 'Courtyard Rain Active (432Hz)';
        if (waveIndicator) waveIndicator.classList.remove('hidden');
        if (btn) btn.classList.add('bg-[#FAF6F0]', 'border-[#8A4500]');
        showToast('Ambient Rain Soundscape Playing');
      } catch (err) {
        console.error('Audio init error:', err);
        showToast('Soundscape audio not supported in this browser');
      }
    } else {
      rainNodes.forEach(node => {
        try { node.stop ? node.stop() : node.disconnect(); } catch (e) {}
      });
      rainNodes = [];
      isPlayingSound = false;
      if (statusText) statusText.textContent = 'Soft Courtyard Rain Soundscape (432Hz ambient frequency)';
      if (waveIndicator) waveIndicator.classList.add('hidden');
      if (btn) btn.classList.remove('bg-[#FAF6F0]', 'border-[#8A4500]');
      showToast('Soundscape Paused');
    }
  }

  // 6. Review & Submit Modal
  function setupModal() {
    const reviewBtn = document.getElementById('review-btn');
    const submitBtn = document.getElementById('submit-btn');
    const modal = document.getElementById('reflection-modal');
    const closeModal = document.getElementById('close-modal');
    const consentCheck = document.getElementById('consent-checkbox');

    function openModal() {
      if (!consentCheck.checked) {
        showToast('অনুগ্রহ করে সম্মতি বক্সে টিক দিন (Please check consent)');
        consentCheck.focus();
        consentCheck.parentElement.classList.add('ring-2', 'ring-red-400', 'p-1', 'rounded-lg');
        setTimeout(() => consentCheck.parentElement.classList.remove('ring-2', 'ring-red-400', 'p-1', 'rounded-lg'), 2500);
        return;
      }

      // Populate Modal Statistics
      let phqTotal = 0;
      Object.values(formData.phq9Scores).forEach(v => phqTotal += v);

      document.getElementById('modal-phq-score').textContent = `${phqTotal} / 27`;
      let mspssMean = calculateMspss();
      document.getElementById('modal-mspss-score').textContent = `${mspssMean} / 7.0`;

      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    if (reviewBtn) reviewBtn.addEventListener('click', openModal);
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
  }

  function calculateMspss() {
    const fScores = [];
    for (let i = 1; i <= 12; i++) {
      const q = `f${i}`;
      if (formData.likertScores[q]) {
        fScores.push(parseFloat(formData.likertScores[q]) || 5.0);
      } else {
        fScores.push(5.0); // default
      }
    }
    const sum = fScores.reduce((a, b) => a + b, 0);
    return (sum / fScores.length).toFixed(1);
  }

  // 7. Toast Notification Utility
  function showToast(msg) {
    let toast = document.getElementById('zen-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'zen-toast';
      toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#241812] text-white px-5 py-2.5 rounded-full text-xs font-medium shadow-lg transition-all duration-300 opacity-0 pointer-events-none';
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

  // 8. State Persistence
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {}
  }

  // Bind Soundscape Toggle
  const soundBtn = document.getElementById('soundscape-toggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', toggleSoundscape);
  }

  // Initialize
  setupPebbleGroups();
  updatePhq9Score();
  setupScrollSpy();
  setupModal();
});
