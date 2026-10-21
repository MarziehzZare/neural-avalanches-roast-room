const lenses = [
  { name: 'John M. Beggs', short: 'Beggs', avatar: '/avatars/illustrated/beggs.png', focus: 'Branching, structured repertoires, and information claims', question: 'Does a branching account explain structured activity beyond the size histogram? Was an information advantage measured or only modeled?', skin: '#c88f6a', hair: '#49352e', coat: '#2d5365', hairStyle: 1, glasses: false, beard: false },
  { name: 'Dietmar Plenz', short: 'Plenz', avatar: '/avatars/illustrated/plenz.png', focus: 'LFP measurement and the perturbation-to-function bridge', question: 'Does event construction respect the preparation? Do perturbation and a measured input-output objective support the functional claim?', skin: '#d6a67d', hair: '#5b5045', coat: '#465a68', hairStyle: 2, glasses: true, beard: false },
  { name: 'Dante R. Chialvo', short: 'Chialvo', avatar: '/avatars/illustrated/chialvo.png', focus: 'Macroscopic critical phenomenology and cross-scale models', question: 'Which independent macroscopic signatures support the phase-transition interpretation, and how does the measured signal map to it?', skin: '#b98262', hair: '#37312e', coat: '#5b5249', hairStyle: 3, glasses: false, beard: true },
  { name: 'Miguel A. Muñoz', short: 'Muñoz', avatar: '/avatars/illustrated/munoz.png', focus: 'Transition identity, synchronization, and bistable alternatives', question: 'Which transition and self-organization mechanism is actually claimed? Could synchronization or phase coexistence explain the same avalanches?', skin: '#cf9a72', hair: '#343b37', coat: '#334f47', hairStyle: 1, glasses: true, beard: true },
  { name: 'Alain Destexhe', short: 'Destexhe', avatar: '/avatars/illustrated/destexhe.png', focus: 'Statistical specificity and stochastic counterexamples', question: 'What evidence rules out thresholded stochastic or irregular noncritical dynamics?', skin: '#d9ab85', hair: '#85817a', coat: '#605b57', hairStyle: 2, glasses: true, beard: false },
  { name: 'Viola Priesemann', short: 'Priesemann', avatar: '/avatars/illustrated/priesemann.png', focus: 'Driven propagation and subsampling-aware inference', question: 'How do ongoing drive, partial observation, and estimator assumptions change the inferred distance to instability?', skin: '#d3a181', hair: '#654c3d', coat: '#664e56', hairStyle: 4, glasses: false, beard: false },
  { name: 'Anna Levina', short: 'Levina', avatar: '/avatars/illustrated/levina.png', focus: 'Adaptive mechanisms, finite-size limits, and sampling transforms', question: 'Does an explicit adaptive mechanism robustly produce this regime, and how does partial observation alter its appearance?', skin: '#c58f71', hair: '#3e3837', coat: '#59647b', hairStyle: 4, glasses: true, beard: false },
];

const $ = (selector) => document.querySelector(selector);
const savedReviewKey = 'neural-avalanches:last-review';
let latestReview = '';

function showReview(review) {
  $('#request-text').textContent = review;
  $('#dialog-title').textContent = 'Council review';
  $('#dialog-description').textContent = 'One AI model applied seven simulated research lenses. This is not their participation or independent peer review.';
  $('#copy-request').textContent = 'Copy review';
  $('#download-pdf').hidden = false;
  $('#copy-status').textContent = '';
  $('#request-dialog').showModal();
}

try {
  latestReview = sessionStorage.getItem(savedReviewKey) || '';
} catch { /* Storage may be unavailable in a private browser. */ }
function showReadyResult() {
  $('#view-review').hidden = false;
  $('#download-latest-pdf').disabled = false;
  $('#result-card').classList.add('is-ready');
  $('#pdf-status').textContent = 'Review ready. Download your PDF here or read the answer again. No extra credit is used.';
}
if (latestReview) showReadyResult();
$('#view-review').addEventListener('click', () => showReview(latestReview));
async function downloadCurrentReview(button, status) {
  if (!latestReview) {
    status.textContent = 'No review is ready yet. Ask the council online first; then download its PDF here.';
    $('#claim').focus();
    return;
  }
  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = 'Preparing PDF…';
  status.textContent = 'Preparing your PDF…';
  try {
    const { downloadReviewPdf } = await import('/pdf-export.js');
    await downloadReviewPdf(latestReview);
    status.textContent = 'PDF downloaded. Check your browser downloads.';
  } catch {
    status.textContent = 'PDF download failed. Please try again; you can still copy the review.';
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}
$('#download-pdf').addEventListener('click', () => downloadCurrentReview($('#download-pdf'), $('#copy-status')));
$('#download-latest-pdf').addEventListener('click', () => downloadCurrentReview($('#download-latest-pdf'), $('#pdf-status')));
let selected = 0;
let activePhase = 'brief';
const phasePreviews = {
  openings: {
    title: 'Seven starting questions',
    summary: 'Each simulated lens begins from the same claim and states the inference it would test.',
    points: ['Define the observation and the precise claim.', 'Record what each lens sees as supported, uncertain, or missing.', 'Freeze the openings before any cross-examination.'],
  },
  'fault-lines': {
    title: 'Find the real fault lines',
    summary: 'The Chair identifies where the evidence could lead to different interpretations.',
    points: ['Keep avalanche observations, critical regime, mechanism, and functional benefit separate.', 'Name one to three cruxes that could change the conclusion.', 'State competing explanations and what would distinguish them.'],
  },
  debate: {
    title: 'Put one claim to the test',
    summary: 'The lenses challenge specific arguments, address one another, and explain why the reply matters.',
    points: ['Ask for a valid concession or a clear reason to hold position.', 'Compare predictions that can be checked against evidence.', 'Record what changed and what remains disputed.'],
  },
  ratification: {
    title: 'Record each final position',
    summary: 'In a Full council, every lens checks the draft and ratifies, amends, or dissents.',
    points: ['Keep amendments and minority views visible.', 'Check whether the synthesis represents the arguments accurately.', 'Ratification is not a vote on scientific truth.'],
  },
  synthesis: {
    title: 'Make the conclusion usable',
    summary: 'The final report leads with the narrowest defensible conclusion and the next discriminating test.',
    points: ['Show a claim and evidence ledger with exact sources.', 'Separate proposed tests from tests that were actually run.', 'Preserve the strongest dissent, limits, and what would change the call.'],
  },
};
const sampleExchange = [
  { speaker: 6, target: 5, why: 'Levina asks Priesemann whether subsampling preserves the event clusters used for inference.', line: 'If sampling splits or merges avalanches, how would you validate the inferred distance to instability?' },
  { speaker: 5, target: 6, why: 'Priesemann replies to Levina by separating observation effects from an adaptive mechanism.', line: 'Compare estimates across sampling fractions, then test the proposed recovery dynamics independently.' },
  { speaker: 0, target: 1, why: 'Beggs asks Plenz to test the branching picture against measurement and function.', line: 'Does a branching account explain structured activity beyond the avalanche-size histogram?' },
  { speaker: 1, target: 0, why: 'Plenz replies to Beggs by checking event definitions and perturbation evidence.', line: 'First define how events were measured. Then test whether perturbation changes a measured input-output objective.' },
  { speaker: 2, target: 4, why: 'Chialvo asks Destexhe which signatures could distinguish a critical regime from stochastic alternatives.', line: 'Which independent, cross-scale signature survives a matched stochastic control?' },
  { speaker: 4, target: 2, why: 'Destexhe replies to Chialvo by asking for a matched noncritical counterexample.', line: 'Test a thresholded stochastic model under the same sampling and binning before assigning the pattern to a transition.' },
  { speaker: 5, target: 3, why: 'Priesemann asks Muñoz whether drive and subsampling change the transition claim.', line: 'How would ongoing drive and partial observation change the inferred distance to instability?' },
  { speaker: 3, target: 5, why: 'Muñoz replies to Priesemann with alternative transition mechanisms.', line: 'Specify the transition being claimed. Synchronization or phase coexistence may produce similar avalanche statistics.' },
];
let exchangeIndex = -1;
let exchangePlaying = false;
let exchangeDone = false;
let exchangeTimer;
const blinking = new Set();
let speechFrame = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function renderSeats() {
  $('#seats').innerHTML = lenses.map((lens, index) => `<button class="seat ${index === selected ? 'selected' : ''}" type="button" style="--i:${index}" data-index="${index}" aria-label="${lens.name}: ${lens.focus}" aria-pressed="${index === selected}"><span class="think" aria-hidden="true"><i></i><i></i><i></i></span><span class="bust" data-shape="base"><span class="avatar-sprite" style="--sprite:url('${lens.avatar}')" aria-hidden="true"></span></span></button>`).join('');
  $('#plates').innerHTML = lenses.map((lens, index) => `<button class="nameplate ${index === selected ? 'selected' : ''}" type="button" data-index="${index}" aria-label="Select ${lens.name}"><b class="full-name">${lens.name}</b><b class="short-name">${lens.short}</b></button>`).join('');
  $('#seats').addEventListener('click', (event) => {
    const button = event.target.closest('.seat');
    if (!button) return;
    closeExchange(false);
    selectSeat(Number(button.dataset.index));
  });
  $('#plates').addEventListener('click', (event) => {
    const button = event.target.closest('.nameplate');
    if (button) {
      closeExchange(false);
      selectSeat(Number(button.dataset.index));
    }
  });
  new ResizeObserver(layoutStage).observe($('#stage'));
  layoutStage();
}

function layoutStage() {
  const stage = $('#stage');
  const W = stage.clientWidth;
  const narrow = matchMedia('(max-width: 820px)').matches;
  const H = narrow ? Math.round(W * .62) : stage.clientHeight;
  const cx = W / 2, cy = H * (narrow ? .98 : .9), rx = W * .48, ry = H * (narrow ? .46 : .42);
  Object.assign($('#table').style, { left: `${cx-rx}px`, top: `${cy-ry}px`, width: `${rx*2}px`, height: `${ry*2}px` });
  const edge = (x) => cy - ry * Math.sqrt(Math.max(0, 1 - ((x-cx)/rx)**2));
  const xs = narrow ? [.17,.28,.39,.5,.61,.72,.83] : [.085,.222,.361,.5,.639,.778,.915];
  lenses.forEach((lens, index) => {
    const x = W * xs[index];
    const d = ((x-cx)/rx)**2;
    const size = H * (narrow ? .5 + .08*d : .37 + .07*d);
    const bottom = edge(x) + size*.2;
    const seat = $('#seats').children[index];
    Object.assign(seat.style, { left:`${x-size/2}px`, top:`${bottom-size}px`, width:`${size}px`, height:`${size}px`, zIndex:10+Math.round(d*10) });
    const plate = $('#plates').children[index];
    Object.assign(plate.style, { left:`${x}px`, top:`${edge(x)+H*.01}px` });
  });
  if (narrow) {
    stage.style.paddingTop = `${H}px`;
    $('#center').style.cssText = '';
  } else {
    stage.style.paddingTop = '';
    const top = Math.max(...[1,2,3,4,5].map(index => {
      const plate = $('#plates').children[index];
      return plate.offsetTop + plate.offsetHeight/2;
    })) + H*.035;
    Object.assign($('#center').style, { left:`${W*.2}px`, width:`${W*.6}px`, top:`${top}px`, height:`${H-top-H*.09}px` });
  }
  moveSpot(selected);
}

function moveSpot(index) {
  const seat = $('#seats').children[index];
  if (!seat) return;
  const spot = $('#spot');
  spot.style.left = `${seat.offsetLeft + seat.offsetWidth/2}px`;
  spot.style.top = `${seat.offsetTop + seat.offsetHeight*.3}px`;
  spot.style.width = spot.style.height = `${seat.offsetWidth*1.9}px`;
  spot.classList.add('on');
}

function selectSeat(index) {
  selected = index;
  document.querySelectorAll('.seat').forEach((button, i) => {
    button.classList.toggle('selected', i === index);
    button.setAttribute('aria-pressed', String(i === index));
    updateFace(i);
  });
  document.querySelectorAll('.nameplate').forEach((button, i) => button.classList.toggle('selected', i === index));
  const lens = lenses[index];
  $('.detail-index').textContent = `LENS ${String(index + 1).padStart(2, '0')}`;
  $('#detail-name').textContent = lens.name;
  $('#detail-focus').textContent = lens.focus;
  $('#detail-question').textContent = lens.question;
  $('#stage-note').textContent = `${lens.short} is at the table`;
  moveSpot(index);
  if (!reducedMotion.matches) setTimeout(() => blinkOnce(index), 420);
}

function updateFace(index) {
  const bust = $('#seats').children[index]?.querySelector('.bust');
  if (!bust) return;
  const speaking = exchangePlaying && index === selected && [2, 3, 6].includes(speechFrame % 10);
  bust.dataset.shape = reducedMotion.matches ? 'base' : blinking.has(index) ? 'blink' : speaking ? 'open' : 'base';
}

function clearExchangeTimer() {
  clearTimeout(exchangeTimer);
  exchangeTimer = undefined;
}

function showExchangeTurn(index) {
  exchangeIndex = index;
  speechFrame = 0;
  const turn = sampleExchange[index];
  selectSeat(turn.speaker);
  $('#exchange-progress').textContent = `${index + 1} / ${sampleExchange.length}`;
  $('#exchange-speaker').textContent = lenses[turn.speaker].name;
  $('#exchange-target').textContent = lenses[turn.target].name;
  $('#exchange-why').textContent = turn.why;
  $('#exchange-line').textContent = turn.line;
  $('#exchange-line').setAttribute('aria-label', `${lenses[turn.speaker].short} speaks to ${lenses[turn.target].short}. Why: ${turn.why} ${turn.line}`);
  $('#stage-note').textContent = `${lenses[turn.speaker].short} addresses ${lenses[turn.target].short} in a simulated exchange`;
  document.querySelectorAll('.seat').forEach((seat, i) => {
    seat.classList.toggle('speaking', i === turn.speaker);
    seat.classList.toggle('addressed', i === turn.target);
    const direction = Math.sign(turn.target - turn.speaker);
    seat.style.transform = i === turn.speaker ? `translateX(${direction * 5}px) rotate(${direction * 2}deg) scale(1.05)`
      : i === turn.target ? `translateX(${-direction * 3}px) rotate(${-direction}deg) scale(1.02)` : '';
  });
  document.querySelectorAll('.nameplate').forEach((plate, i) => plate.classList.toggle('addressed', i === turn.target));
  updateFace(turn.speaker);
}

function scheduleExchangeTurn() {
  clearExchangeTimer();
  if (!exchangePlaying) return;
  exchangeTimer = setTimeout(() => {
    if (exchangeIndex < sampleExchange.length - 1) {
      showExchangeTurn(exchangeIndex + 1);
      scheduleExchangeTurn();
    } else {
      exchangePlaying = false;
      exchangeDone = true;
      $('#exchange-toggle').textContent = 'Replay';
      $('#stage').classList.add('exchange-paused');
      updateFace(selected);
    }
  }, Math.max(4200, sampleExchange[exchangeIndex].line.length * 42));
}

function startExchange() {
  $('#center .waiting').hidden = true;
  $('#center .waiting').inert = true;
  $('#phase-preview').hidden = true;
  $('#exchange-card').hidden = false;
  $('#stage').classList.add('exchanging');
  exchangePlaying = !reducedMotion.matches;
  exchangeDone = false;
  $('#stage').classList.toggle('exchange-paused', !exchangePlaying);
  $('#exchange-toggle').textContent = exchangePlaying ? 'Pause' : 'Play';
  showExchangeTurn(0);
  scheduleExchangeTurn();
  $('#exchange-toggle').focus({ preventScroll: true });
}

function closeExchange(restoreFocus = true) {
  if (exchangeIndex < 0) return;
  clearExchangeTimer();
  exchangeIndex = -1;
  exchangePlaying = false;
  exchangeDone = false;
  $('#stage').classList.remove('exchanging', 'exchange-paused');
  $('#exchange-card').hidden = true;
  $('#center .waiting').hidden = activePhase !== 'brief';
  $('#center .waiting').inert = false;
  $('#phase-preview').hidden = activePhase === 'brief';
  document.querySelectorAll('.seat').forEach(seat => {
    seat.classList.remove('speaking', 'addressed');
    seat.style.transform = '';
  });
  document.querySelectorAll('.nameplate').forEach(plate => plate.classList.remove('addressed'));
  updateFace(selected);
  $('#stage-note').textContent = `${lenses[selected].short} is at the table`;
  if (restoreFocus) (activePhase === 'debate' ? $('#preview-watch') : $('#watch-exchange')).focus({ preventScroll: true });
}

function showPhase(phase) {
  closeExchange(false);
  activePhase = phase;
  document.querySelectorAll('.stepper [role="tab"]').forEach(button => {
    const current = button.dataset.phase === phase;
    button.setAttribute('aria-selected', String(current));
    button.tabIndex = current ? 0 : -1;
    button.parentElement.classList.toggle('active', current);
  });
  $('#center').setAttribute('aria-labelledby', `step-${phase}`);
  $('#center .waiting').hidden = phase !== 'brief';
  $('#phase-preview').hidden = phase === 'brief';
  if (phase === 'brief') return;
  const preview = phasePreviews[phase];
  const quick = document.querySelector('input[name="mode"]:checked').value === 'QUICK';
  $('#phase-kicker').textContent = `${phase.replace('-', ' ')} · workflow preview`;
  $('#phase-title').textContent = phase === 'ratification' && quick ? 'Quick mode closes after debate' : preview.title;
  $('#phase-summary').textContent = phase === 'ratification' && quick
    ? 'Quick mode has two rounds. Final positions are recorded during cross-examination, with no separate ratification round.'
    : preview.summary;
  $('#phase-points').replaceChildren(...(phase === 'ratification' && quick
    ? ['The Full mode adds a distinct ratification round.', 'Quick mode still records final positions and dissent.', 'Neither mode treats agreement as proof.']
    : preview.points).map(point => {
      const item = document.createElement('li');
      item.textContent = point;
      return item;
    }));
  $('#preview-watch').hidden = phase !== 'debate';
}

const phaseTabs = [...document.querySelectorAll('.stepper [role="tab"]')];
phaseTabs.forEach((button, index) => {
  button.addEventListener('click', () => showPhase(button.dataset.phase));
  button.addEventListener('keydown', event => {
    const next = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1
      : event.key === 'Home' ? 0 : event.key === 'End' ? phaseTabs.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault();
    const target = phaseTabs[(next + phaseTabs.length) % phaseTabs.length];
    showPhase(target.dataset.phase);
    target.focus();
  });
});
document.querySelectorAll('input[name="mode"]').forEach(input => input.addEventListener('change', () => {
  if (activePhase === 'ratification') showPhase('ratification');
}));

$('#watch-exchange').addEventListener('click', startExchange);
$('#preview-watch').addEventListener('click', startExchange);
$('#exchange-close').addEventListener('click', () => closeExchange());
$('#exchange-next').addEventListener('click', () => {
  clearExchangeTimer();
  exchangePlaying = !reducedMotion.matches;
  exchangeDone = false;
  $('#stage').classList.toggle('exchange-paused', !exchangePlaying);
  $('#exchange-toggle').textContent = exchangePlaying ? 'Pause' : 'Play';
  showExchangeTurn((exchangeIndex + 1) % sampleExchange.length);
  scheduleExchangeTurn();
});
$('#exchange-toggle').addEventListener('click', () => {
  if (exchangeDone) {
    startExchange();
    return;
  }
  exchangePlaying = !exchangePlaying;
  $('#stage').classList.toggle('exchange-paused', !exchangePlaying);
  $('#exchange-toggle').textContent = exchangePlaying ? 'Pause' : 'Play';
  updateFace(selected);
  scheduleExchangeTurn();
});

function blinkOnce(index) {
  if (reducedMotion.matches || blinking.has(index)) return;
  blinking.add(index);
  updateFace(index);
  setTimeout(() => {
    blinking.delete(index);
    updateFace(index);
  }, 220);
}

function scheduleBlink(index) {
  const active = index === selected;
  const delay = active ? 1700 + Math.random() * 1900 : 3500 + Math.random() * 3500 + index * 170;
  setTimeout(() => {
    blinkOnce(index);
    scheduleBlink(index);
  }, delay);
}

lenses.forEach((_, index) => scheduleBlink(index));
setInterval(() => {
  if (!exchangePlaying) return;
  speechFrame++;
  updateFace(selected);
}, 180);
reducedMotion.addEventListener('change', () => lenses.forEach((_, index) => updateFace(index)));

let paidReviews = false;
let walletOpen = false;
let inviteAccess = false;
let roomCodeRequired = true;
let paperPilot = false;
function reviewingPaper() { return document.querySelector('input[name="review-target"]:checked').value === 'paper'; }
function updatePaperFileStatus(message, error = false) {
  const file = $('#paper-file').files[0];
  const status = $('#paper-file-status');
  status.textContent = message || (file ? `Selected: ${file.name} (${(file.size / 1_000_000).toFixed(1)} MB). Ready to review.` : 'No PDF selected yet.');
  status.classList.toggle('is-error', error);
  $('#paper-file').setAttribute('aria-invalid', error ? 'true' : 'false');
}
$('#paper-file').addEventListener('change', () => {
  const file = $('#paper-file').files[0];
  if (file && (!file.name.toLowerCase().endsWith('.pdf') || file.size > 5_000_000)) {
    updatePaperFileStatus('This file cannot be reviewed. Choose a PDF under 5 MB.', true);
  } else {
    updatePaperFileStatus();
    $('#form-status').textContent = '';
  }
});
function updateReviewTarget() {
  const paper = reviewingPaper();
  $('#question-fields').hidden = paper;
  $('#paper-fields').hidden = !paper;
  $('#prepare-request').hidden = paper;
  $('#submit-review').textContent = paper ? 'Review this paper' : 'Ask the council online';
  $('#question-title').textContent = paper ? 'Put a paper before the council' : 'What claim should the council pressure-test?';
  $('#question-description').textContent = paper
    ? 'Upload the paper and name the claim or figure you most want challenged. The seven lenses will read the paper before they debate it.'
    : 'Name the system, signal, event definition, observation, and inference when you know them. Unknown details can stay unknown.';
  $('#privacy-note').textContent = paper
    ? 'The full PDF is sent to the AI service. Upload only papers you are authorized to share. This is a pilot research critique, not peer review.'
    : 'Your question is sent to an AI service for analysis. Avoid unpublished or identifying material unless you are authorized to share it.';
  $('#form-status').textContent = '';
  $('#pilot-usage').hidden = true;
}
document.querySelectorAll('input[name="review-target"]').forEach(input => input.addEventListener('change', updateReviewTarget));
async function walletRequest(path, extra = {}) {
  const response = await fetch(path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessCode: $('#room-code').value, ...extra })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'The wallet could not be opened.');
  return result;
}
async function openWallet(path = '/api/wallet', extra = {}) {
  const result = await walletRequest(path, extra);
  walletOpen = true;
  inviteAccess = Boolean(result.invited);
  $('#room-code-wrap').hidden = !roomCodeRequired || inviteAccess;
  $('#wallet-status').textContent = result.locked ? 'This balance is on hold after a payment reversal. Contact the room owner.' : `${result.credits} review${result.credits === 1 ? '' : 's'} available`;
  $('#wallet-restore-note').hidden = result.credits !== 0;
  $('#buy-credits').dataset.locked = result.locked ? 'true' : 'false';
  $('#buy-credits').disabled = Boolean(result.locked);
  $('#recovery-code').value = result.recoveryCode;
  $('#recovery-details').hidden = false;
  return result;
}
fetch('/api/config').then(response => response.json()).then(async config => {
  if (!['test', 'live'].includes(config.payments)) return;
  paperPilot = Boolean(config.paperPilot);
  $('#paper-option').hidden = !paperPilot;
  paidReviews = true;
  roomCodeRequired = false;
  $('#room-code-wrap').hidden = true;
  $('#credits-panel').hidden = false;
  $('#credits-heading').textContent = config.payments === 'test' ? 'Review balance · test mode' : 'Review balance';
  $('#credits-description').textContent = `Full and Quick each use one review. Add 10 for US$5.${config.payments === 'test' ? ' Test payments do not charge a real card.' : ''}`;
  $('#buy-credits').disabled = false;
  const payment = new URL(location.href).searchParams.get('payment');
  if (payment === 'success') $('#wallet-status').textContent = 'Payment submitted. Your balance will update after Stripe confirms it.';
  if (payment === 'cancelled') $('#wallet-status').textContent = 'Checkout was cancelled. Your existing credits are safe.';
  const giftToken = location.hash.startsWith('#gift=') ? location.hash.slice(6) : '';
  if (giftToken) {
    try {
      const gift = await openWallet('/api/gift/claim', { inviteToken: giftToken });
      $('#wallet-status').textContent = `${gift.credits} complimentary review${gift.credits === 1 ? '' : 's'} available`;
    } catch (error) {
      try {
        const existing = await openWallet();
        if (!existing.invited) $('#wallet-status').textContent = error.message;
      } catch { $('#wallet-status').textContent = error.message; }
    }
    history.replaceState(null, '', `${location.pathname}${location.search}#question`);
    $('#question').scrollIntoView({ block: 'start' });
  } else {
    openWallet().catch(error => { $('#wallet-status').textContent = error.message; });
  }
}).catch(() => {});
$('#room-code').addEventListener('input', () => { walletOpen = false; });
$('#room-code').addEventListener('change', () => {
  if (paidReviews && $('#room-code').value.trim()) openWallet().catch(error => { $('#wallet-status').textContent = error.message; });
});
$('#open-wallet').addEventListener('click', async () => {
  try { await openWallet(); }
  catch (error) { $('#wallet-status').textContent = error.message; }
});
$('#restore-wallet').addEventListener('click', async () => {
  try { await openWallet('/api/wallet/recover', { recoveryCode: $('#restore-code').value.trim() }); }
  catch (error) { $('#wallet-status').textContent = error.message; }
});
$('#copy-recovery').addEventListener('click', async () => {
  await navigator.clipboard.writeText($('#recovery-code').value);
  $('#wallet-status').textContent = 'Backup code copied. Save it privately so you can restore credits in another browser.';
});
$('#buy-credits').addEventListener('click', async () => {
  const button = $('#buy-credits');
  try {
    if (!walletOpen) await openWallet();
    button.disabled = true;
    $('#wallet-status').textContent = 'Opening Stripe Checkout…';
    const result = await walletRequest('/api/checkout');
    location.assign(result.url);
  } catch (error) {
    $('#wallet-status').textContent = error.message;
    button.disabled = false;
  }
});

$('#brief-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const paper = reviewingPaper();
  const claim = $('#claim').value.trim();
  const roomCode = $('#room-code').value.trim();
  const status = $('#form-status');
  if (paper && !paperPilot) {
    status.textContent = 'Paper reviews are not available in this room yet.';
    return;
  }
  const paperFile = $('#paper-file').files[0];
  if (paper && (!paperFile || !paperFile.name.toLowerCase().endsWith('.pdf') || paperFile.size > 5_000_000)) {
    const message = paperFile ? 'This file cannot be reviewed. Choose a PDF under 5 MB.' : 'No PDF selected. Choose a PDF to review.';
    status.textContent = message;
    updatePaperFileStatus(message, true);
    $('#paper-file').focus();
    return;
  }
  if (!paper && claim.length < 12) {
    status.textContent = 'Enter a question of at least 12 characters.';
    $('#claim').focus();
    return;
  }
  if (roomCodeRequired && !roomCode && !inviteAccess) {
    status.textContent = 'Enter the room access code before asking the council.';
    $('#room-code').focus();
    return;
  }
  if (paidReviews && !walletOpen) {
    try { await openWallet(); }
    catch (error) { status.textContent = error.message; return; }
  }
  const button = event.currentTarget.querySelector('button[type="submit"]');
  const buttonLabel = button.textContent;
  button.disabled = true;
  button.textContent = 'Reviewing… please wait';
  status.textContent = paper ? 'The council is reading your paper. Keep this page open…' : 'The council is reviewing your question…';
  try {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const form = new FormData();
    if (paper) {
      form.set('paper', paperFile);
      form.set('focus', $('#paper-focus').value.trim());
      form.set('mode', mode);
      form.set('accessCode', roomCode);
    }
    const response = await fetch(paper ? '/api/paper' : '/api/council', {
      method: 'POST',
      ...(paper ? { body: form } : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        claim,
        context: $('#context').value.trim(),
        mode,
        accessCode: roomCode
      }) })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'The review could not be completed. Please try again.');
    latestReview = result.review;
    try { sessionStorage.setItem(savedReviewKey, latestReview); } catch { /* The open tab still keeps this review. */ }
    showReadyResult();
    showReview(latestReview);
    status.textContent = 'Review ready. Use “View latest review” to reopen it after closing.';
    if (paper && result.usage) {
      const input = Number(result.usage.input_tokens || 0).toLocaleString();
      const output = Number(result.usage.output_tokens || 0).toLocaleString();
      $('#pilot-usage').textContent = `Pilot usage for this paper: ${input} input tokens and ${output} output tokens.`;
      $('#pilot-usage').hidden = false;
    }
    if (paidReviews) openWallet().catch(() => {});
  } catch (error) {
    status.textContent = error.message || 'The review could not be completed.';
    if (paidReviews && walletOpen) openWallet().catch(() => {});
  } finally {
    button.disabled = false;
    button.textContent = buttonLabel;
  }
});
$('#prepare-request').addEventListener('click', () => {
  const claim = $('#claim').value.trim();
  if (claim.length < 12) {
    $('#form-status').textContent = 'Enter your question first.';
    $('#claim').focus();
    return;
  }
  const context = $('#context').value.trim();
  const mode = document.querySelector('input[name="mode"]:checked').value;
  $('#request-text').textContent = `Run the neural-avalanches-roast-room ${mode} council on this research question:\n\n${claim}\n\n${context ? `System, modality, and evidence I can provide:\n${context}\n\n` : ''}Please follow the room's SKILL.md and evidence protocol. Label unknown facts and ask only for details that could change the inference. Do not treat the animated portraits as the real scientists' participation.`;
  $('#dialog-title').textContent = 'Bring this request into Codex';
  $('#dialog-description').textContent = 'Copy the request below and paste it into your Codex chat with this room installed.';
  $('#copy-request').textContent = 'Copy request';
  $('#download-pdf').hidden = true;
  $('#copy-status').textContent = '';
  $('#request-dialog').showModal();
});
$('#close-dialog').addEventListener('click', () => $('#request-dialog').close());
$('#request-dialog').addEventListener('click', (event) => { if (event.target === $('#request-dialog')) $('#request-dialog').close(); });
$('#copy-request').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('#request-text').textContent);
    $('#copy-status').textContent = 'Copied.';
  } catch {
    $('#copy-status').textContent = 'Select and copy the review above.';
  }
});

renderSeats();
selectSeat(0);
showPhase('brief');
