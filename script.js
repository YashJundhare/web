/* E20 portal interactions. Calculator assumptions are centralized below for easy review. */
(function () {
  'use strict';

  const blendProfiles = {
    e10: { label: 'E10', ethanol: 10, petrol: 90 },
    e20: { label: 'E20', ethanol: 20, petrol: 80 }
  };

  // Update the one-litre blend illustration when the user changes the blend.
  function updateBlend(blendKey) {
    const profile = blendProfiles[blendKey];
    if (!profile) return;

    const ethanolSegment = document.getElementById('ethanol-segment');
    const petrolSegment = document.getElementById('petrol-segment');
    ethanolSegment.style.width = `${profile.ethanol}%`;
    petrolSegment.style.width = `${profile.petrol}%`;
    document.getElementById('ethanol-litres').textContent = `${profile.ethanol * 10} mL`;
    document.getElementById('petrol-litres').textContent = `${profile.petrol * 10} mL`;
    document.getElementById('blend-title').textContent = `${profile.label} composition`;
    document.getElementById('blend-subtitle').textContent = `${profile.ethanol}% ethanol · ${profile.petrol}% petrol`;
    document.getElementById('hero-blend-value').textContent = profile.label;
    document.querySelector('.composition-bar').setAttribute(
      'aria-label', `${profile.label} contains ${profile.ethanol} percent ethanol and ${profile.petrol} percent petrol`
    );

    document.querySelectorAll('.blend-option').forEach((button) => {
      const selected = button.dataset.blend === blendKey;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  const compatibilityProfiles = {
    'post-2023': {
      status: 'Factory Ready',
      className: 'status-ready',
      summary: 'Vehicles designed for the BS6 Phase 2 rollout are more likely to use E20-compatible fuel-system materials. Confirm model approval.',
      elastomers: 'E20-rated materials expected',
      hoses: 'Ethanol-resistant specification',
      delivery: 'Injector system; verify model',
      efficiency: '~2% potential reduction',
      checks: [
        'Confirm E20 approval in the owner\'s manual.',
        'Use fuel from a reputable, properly maintained station.',
        'Follow the manufacturer\'s normal service schedule.'
      ]
    },
    '2010-2023': {
      status: 'Compatible with Routine Care',
      className: 'status-care',
      summary: 'Many vehicles from this period can operate on lower-ethanol blends, but E20 tolerance is model-specific. Inspect the fuel system and verify manufacturer guidance.',
      elastomers: 'Check seals for hardening or cracks',
      hoses: 'Inspect age and ethanol rating',
      delivery: 'Injector/jet calibration varies',
      efficiency: '~2–5% potential reduction',
      checks: [
        'Check the manual or manufacturer site for E20 approval.',
        'Have older hoses and seals inspected at routine service.',
        'Monitor cold starts, drivability and fuel consumption.'
      ]
    },
    'pre-2010': {
      status: 'Preventive Seal Upgrade Needed',
      className: 'status-upgrade',
      summary: 'Older fuel systems may contain elastomers that are less tolerant of higher ethanol blends. Seek a qualified inspection before changing fuel blend.',
      elastomers: 'Legacy rubber may swell or degrade',
      hoses: 'Upgrade only with approved components',
      delivery: 'Carburettor jets may need inspection',
      efficiency: '~3–5% potential reduction',
      checks: [
        'Ask a qualified mechanic to inspect hoses, seals and gaskets.',
        'Check carburettor jets or injectors for deposits and tuning.',
        'Use only manufacturer-approved fuel and replacement parts.'
      ]
    }
  };

  // Render readiness advice based on era and vehicle category, not as a formal certification.
  function updateCompatibility() {
    const era = document.getElementById('vehicle-era').value;
    const vehicleType = document.getElementById('vehicle-type').value;
    const profile = { ...compatibilityProfiles[era] };
    const typeNotes = {
      'two-wheeler': 'Two-wheeler guidance: ',
      'passenger-car': 'Passenger-car guidance: ',
      suv: 'SUV / MPV guidance: '
    };

    document.getElementById('readiness-title').textContent = profile.status;
    const badge = document.getElementById('readiness-badge');
    badge.className = `status-badge ${profile.className}`;
    badge.querySelector('span').textContent = profile.status;
    const icon = profile.className === 'status-ready' ? 'check-circle-2' :
      profile.className === 'status-care' ? 'alert-circle' : 'wrench';
    badge.querySelector('i').setAttribute('data-lucide', icon);
    document.getElementById('readiness-summary').textContent = `${typeNotes[vehicleType]}${profile.summary}`;
    document.getElementById('material-elastomers').textContent = profile.elastomers;
    document.getElementById('material-hoses').textContent = profile.hoses;
    document.getElementById('material-delivery').textContent = profile.delivery;
    document.getElementById('efficiency-drop').textContent = profile.efficiency;

    const checklist = document.getElementById('maintenance-checklist');
    checklist.replaceChildren(...profile.checks.map((item) => {
      const listItem = document.createElement('li');
      listItem.textContent = item;
      return listItem;
    }));
    renderIcons();
  }

  // Calculator assumptions: E20 has 20% ethanol by volume, 30% lower tailpipe CO
  // than neat-petrol baseline, and a project baseline of 0.03 kg CO per petrol litre.
  function calculateImpact(distanceKm, currentMileage, petrolPrice, efficiencyDrop) {
    const petrolLitres = distanceKm / currentMileage;
    const adjustedMileage = currentMileage * (1 - efficiencyDrop);
    const e20Litres = distanceKm / adjustedMileage;
    const baselineCost = petrolLitres * petrolPrice;
    const e20Cost = e20Litres * petrolPrice;
    const annualBaselineLitres = (distanceKm * 12) / currentMileage;
    const annualE20Litres = (distanceKm * 12) / adjustedMileage;
    const baselineCoKg = annualBaselineLitres * 0.03;
    const e20CoKg = baselineCoKg * (1 - 0.30);
    const annualPetrolDisplacement = annualBaselineLitres - (annualE20Litres * 0.80);

    return {
      adjustedMileage,
      baselineCost,
      e20Cost,
      monthlyDifference: e20Cost - baselineCost,
      extraLitres: e20Litres - petrolLitres,
      annualCoReduction: baselineCoKg - e20CoKg,
      annualPetrolDisplacement
    };
  }

  const indianNumber = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  const oneDecimal = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function updateRangeTrack(input) {
    const minimum = Number(input.min);
    const maximum = Number(input.max);
    const percentage = ((Number(input.value) - minimum) / (maximum - minimum)) * 100;
    input.style.background = `linear-gradient(to right, #059669 0%, #059669 ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`;
  }

  // Recalculate all outputs on every slider or tuning change.
  function updateCalculator() {
    const distance = Number(document.getElementById('monthly-distance').value);
    const mileage = Number(document.getElementById('vehicle-mileage').value);
    const price = Number(document.getElementById('petrol-price').value);
    const drop = Number(document.getElementById('vehicle-tuning').value);
    const result = calculateImpact(distance, mileage, price, drop);

    document.getElementById('distance-output').textContent = `${indianNumber.format(distance)} km`;
    document.getElementById('mileage-output').textContent = `${mileage} km/L`;
    document.getElementById('price-output').textContent = `₹${price}/L`;
    document.getElementById('adjusted-mileage').textContent = oneDecimal.format(result.adjustedMileage);
    document.getElementById('baseline-cost').textContent = `₹${indianNumber.format(result.baselineCost)}`;
    document.getElementById('e20-cost').textContent = `₹${indianNumber.format(result.e20Cost)}`;
    document.getElementById('monthly-difference').textContent = `${result.monthlyDifference >= 0 ? '+' : '−'}₹${indianNumber.format(Math.abs(result.monthlyDifference))}`;
    document.getElementById('extra-litres').textContent = `${result.extraLitres >= 0 ? '+' : '−'}${oneDecimal.format(Math.abs(result.extraLitres))} L`;
    document.getElementById('co-reduction').textContent = `${oneDecimal.format(result.annualCoReduction)} kg/year`;
    document.getElementById('oil-saved').textContent = `~${indianNumber.format(result.annualPetrolDisplacement)} L/year`;

    document.querySelectorAll('.range-field input[type="range"]').forEach(updateRangeTrack);
  }

  // Keep one FAQ panel open at a time for a compact, keyboard-accessible accordion.
  function setupFaq() {
    document.querySelectorAll('.faq-question').forEach((button) => {
      button.addEventListener('click', () => {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        document.querySelectorAll('.faq-question').forEach((otherButton) => {
          otherButton.setAttribute('aria-expanded', 'false');
          otherButton.closest('.faq-item').querySelector('.faq-answer').hidden = true;
        });
        if (!isExpanded) {
          button.setAttribute('aria-expanded', 'true');
          button.closest('.faq-item').querySelector('.faq-answer').hidden = false;
        }
      });
    });
  }

  function renderIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function setupNavigation() {
    const menuButton = document.getElementById('menu-toggle');
    const navigation = document.getElementById('primary-nav');
    menuButton.addEventListener('click', () => {
      const expanded = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!expanded));
      navigation.classList.toggle('open', !expanded);
    });
    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navigation.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initializePortal() {
    document.querySelectorAll('.blend-option').forEach((button) => {
      button.addEventListener('click', () => updateBlend(button.dataset.blend));
    });
    document.getElementById('vehicle-type').addEventListener('change', updateCompatibility);
    document.getElementById('vehicle-era').addEventListener('change', updateCompatibility);
    document.querySelectorAll('.range-field input[type="range"]').forEach((input) => {
      input.addEventListener('input', updateCalculator);
    });
    document.getElementById('vehicle-tuning').addEventListener('change', updateCalculator);
    setupFaq();
    setupNavigation();
    updateCompatibility();
    updateCalculator();
    renderIcons();
  }

  document.addEventListener('DOMContentLoaded', initializePortal);
})();
