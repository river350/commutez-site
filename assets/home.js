// Commutez front page: the demo countdown, the surface tabs and, on phones,
// the pinned stages that step in place as you scroll.
// No dependencies, no network, nothing stored.
(function () {
  'use strict';

  var phone = window.matchMedia('(max-width: 760px)');
  var norsk = /^(nb|no|nn)/.test(document.documentElement.lang);
  var TEXT = norsk
    ? {
        urgent: 'Blått betyr gå nå',
        legend: function (m, n) { return m + ' = minutter til du må gå · (' + n + ') = den neste'; },
        short: function (m) { return m + ' min til du må gå'; }
      }
    : {
        urgent: 'Blue means go now',
        legend: function (m, n) { return m + ' = minutes until you leave · (' + n + ') = the next one'; },
        short: function (m) { return m + ' min until you leave'; }
      };

  // ---- Demo countdown -------------------------------------------------
  // Runs 12 → 0 minutes at 20× speed (one minute every 3 s), then starts
  // over. At 2 minutes or less the page goes into the app's blue "hurry"
  // state, the same threshold the app uses by default.
  var START = 12 * 60;
  var SPEED = 20;
  var URGENT_MIN = 2;
  var secs = START;
  var body = document.body;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function setAll(selector, text) {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = text;
  }

  function render() {
    var minutes = Math.max(0, Math.ceil(secs / 60));
    var urgent = minutes <= URGENT_MIN;
    setAll('[data-min]', String(minutes));
    setAll('[data-next]', String(minutes + 7));
    setAll('[data-run]', String(Math.max(0, minutes - 1)));
    setAll('[data-mmss]', Math.floor(secs / 60) + ':' + pad(secs % 60));
    setAll('[data-legend]', urgent ? TEXT.urgent
      : (phone.matches ? TEXT.short(minutes) : TEXT.legend(minutes, minutes + 7)));
    body.classList.toggle('is-urgent', urgent);
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  render();
  if (!reduce) {
    setInterval(function () {
      if (document.hidden) return;
      secs -= SPEED;
      if (secs < 0) secs = START;
      render();
    }, 1000);
  }

  // ---- Surface tabs ---------------------------------------------------
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));

  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus({ preventScroll: true });
    // Keep the active tab in view in the narrow tab row. Scroll only the row:
    // tab.scrollIntoView() would also touch the page and cancel a scroll
    // that's under way (it broke tapping the tabs on iPhone).
    var row = tab.parentElement;
    if (phone.matches && row && row.scrollWidth > row.clientWidth) {
      var left = tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2;
      row.scrollTo({ left: Math.max(0, left), behavior: 'auto' });
    }
  }

  // ---- Pinned stages (phones) -----------------------------------------
  // A stage is a tall container with a sticky child. We add one snap point
  // per step (one screen apart) and a track that gives the scroll room.
  // How far the container has scrolled past the top bar, in px, picks the
  // step. Lengths are measured from the snap points, so they always match
  // the CSS (one screen = 100svh minus the bar).
  function makeStage(container, count, onStep) {
    if (!container || count < 1) return null;
    var snaps = [];
    for (var k = 0; k < count; k++) {
      var snap = document.createElement('span');
      snap.className = 'snap-pt';
      snap.setAttribute('aria-hidden', 'true');
      snap.style.top = 'calc(var(--screen) * ' + k + ')';
      container.appendChild(snap);
      snaps.push(snap);
    }
    var track = document.createElement('div');
    track.className = 'step-track';
    track.setAttribute('aria-hidden', 'true');
    track.style.height = 'calc(var(--screen) * ' + (count - 1) + ')';
    container.appendChild(track);
    return { container: container, snaps: snaps, track: track, count: count, onStep: onStep, current: -1 };
  }

  function removeStage(stage) {
    if (!stage) return;
    stage.snaps.forEach(function (s) { s.remove(); });
    stage.track.remove();
  }

  function stepOf(stage) {
    var bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar')) || 0;
    var step = stage.snaps.length > 1 ? stage.snaps[1].offsetTop - stage.snaps[0].offsetTop : window.innerHeight;
    if (step <= 0) return 0;
    // +step/2 so a snap that lands a pixel short still counts as that step
    var travelled = bar - stage.container.getBoundingClientRect().top + step / 2;
    return Math.min(stage.count - 1, Math.max(0, Math.floor(travelled / step)));
  }

  // Jump straight to step k. Not smooth: with hard snapping a smooth scroll
  // gets caught on every step in between.
  function scrollToStep(stage, k) {
    var snap = stage.snaps[k];
    if (!snap) return;
    var bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar')) || 0;
    var y = snap.getBoundingClientRect().top + window.pageYOffset - bar;
    // Switch off smooth scrolling and snapping for the jump. Safari otherwise
    // re-snaps to the step it remembers as soon as the panel changes, which
    // flashed the new tab and sent you back to the old one.
    var root = document.documentElement;
    root.style.scrollBehavior = 'auto';
    root.style.scrollSnapType = 'none';
    window.scrollTo(0, Math.round(y));
    function restore() { root.style.scrollSnapType = ''; root.style.scrollBehavior = ''; }
    window.requestAnimationFrame(function () { window.requestAnimationFrame(restore); });
    setTimeout(restore, 100); // in case frames are paused
  }

  // "One number": one step per surface tab.
  var howStage = makeStage(document.getElementById('how'), tabs.length, function (i) {
    if (tabs[i]) select(tabs[i], false);
  });

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      select(tab, false);
      if (phone.matches && howStage) {
        howStage.current = i;
        scrollToStep(howStage, i);
      }
    });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); select(next, true); }
    });
  });

  // "A normal day": the surfaces you have switched on, four moments each,
  // surfaces in turn. "Show me" switches surfaces on and off; the stage is
  // rebuilt so the page gets shorter with fewer surfaces.
  var dayRows = Array.prototype.slice.call(document.querySelectorAll('.day-row:not(.head)')).map(function (row) {
    var pin = row.querySelector('.day-pin');
    var moments = Array.prototype.slice.call(row.querySelectorAll('.moment'));
    var dots = document.createElement('div');
    dots.className = 'day-steps';
    dots.setAttribute('aria-hidden', 'true');
    moments.forEach(function () { dots.appendChild(document.createElement('span')); });
    if (pin) pin.appendChild(dots);
    return { row: row, surface: row.getAttribute('data-surface'), moments: moments, dots: Array.prototype.slice.call(dots.children) };
  });

  function shownRows() {
    return dayRows.filter(function (r) { return !r.row.classList.contains('is-off'); });
  }

  function showDay(index) {
    var before = 0;
    var currentSurface = null;
    dayRows.forEach(function (r) { r.row.classList.remove('is-current'); });
    shownRows().forEach(function (r) {
      var n = r.moments.length;
      var mine = index >= before && index < before + n;
      if (mine) currentSurface = r.surface;
      var m = mine ? index - before : (index < before ? 0 : n - 1);
      r.row.classList.toggle('is-current', mine);
      r.moments.forEach(function (el, i) { el.classList.toggle('is-active', i === m); });
      r.dots.forEach(function (el, i) { el.classList.toggle('on', i === m); });
      before += n;
    });
    markSurface(currentSurface);
  }

  // underline the switch of the surface on screen (phones only)
  function markSurface(key) {
    var buttons = document.querySelectorAll('.day-filter [data-surface]');
    for (var i = 0; i < buttons.length; i++) {
      var on = !!key && buttons[i].getAttribute('data-surface') === key;
      buttons[i].classList.toggle('is-current', on);
      if (on) buttons[i].setAttribute('aria-current', 'true'); else buttons[i].removeAttribute('aria-current');
    }
  }

  var dayScroller = document.querySelector('.day-scroll');
  var dayStage = null;
  var stages = [];
  function buildDayStage() {
    removeStage(dayStage);
    var steps = shownRows().reduce(function (n, r) { return n + r.moments.length; }, 0);
    dayStage = makeStage(dayScroller, steps, showDay);
    stages = [howStage, dayStage].filter(Boolean);
  }
  buildDayStage();

  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('.day-filter [data-surface]'));
  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') === 'true';
      var onCount = filterButtons.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }).length;
      if (on && onCount === 1) return; // keep at least one surface
      btn.setAttribute('aria-pressed', on ? 'false' : 'true');
      var key = btn.getAttribute('data-surface');
      dayRows.forEach(function (r) { if (r.surface === key) r.row.classList.toggle('is-off', on); });
      buildDayStage();
      showDay(0);
      update();
    });
  });

  function update() {
    ticking = false;
    if (!phone.matches) {
      // desktop: the tabs work by click; the day grid shows everything
      dayRows.forEach(function (r) { r.row.classList.remove('is-current'); });
      markSurface(null);
      stages.forEach(function (s) { s.current = -1; });
      return;
    }
    stages.forEach(function (s) {
      var i = stepOf(s);
      if (i !== s.current) { s.current = i; s.onStep(i); }
    });
  }

  // ---- Swipe carousels (phones): dots under "your week" and "details" ---
  Array.prototype.slice.call(document.querySelectorAll('.cards, .details')).forEach(function (list) {
    var items = Array.prototype.slice.call(list.children);
    if (items.length < 2) return;
    var dots = document.createElement('div');
    dots.className = 'swipe-dots';
    dots.setAttribute('aria-hidden', 'true');
    items.forEach(function () { dots.appendChild(document.createElement('span')); });
    list.parentNode.insertBefore(dots, list.nextSibling);
    var marks = Array.prototype.slice.call(dots.children);
    function mark() {
      var stepX = items[1].offsetLeft - items[0].offsetLeft || 1;
      var i = Math.min(items.length - 1, Math.max(0, Math.round(list.scrollLeft / stepX)));
      marks.forEach(function (m, k) { m.classList.toggle('on', k === i); });
    }
    list.addEventListener('scroll', mark, { passive: true });
    mark();
  });

  var ticking = false;
  var settle = 0;
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    // and once more when scrolling (or a snap) has come to rest
    clearTimeout(settle);
    settle = setTimeout(update, 120);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scrollend', update);
  window.addEventListener('resize', function () { render(); onScroll(); });
  showDay(0);
  update();
})();
