// Commutez front page: the demo countdown and the surface tabs.
// No dependencies, no network, nothing stored.
(function () {
  'use strict';

  // ---- Demo countdown -------------------------------------------------
  // Runs 12 → 0 minutes at 20× speed (one minute every 3 s), then starts
  // over. At 2 minutes or less the page goes into the app's blue "hurry"
  // state, the same threshold the app uses by default.
  var START = 12 * 60;
  var SPEED = 20;
  var URGENT_MIN = 2;
  var secs = START;
  var body = document.body;
  var norsk = /^(nb|no|nn)/.test(document.documentElement.lang);
  var TEXT = norsk
    ? { urgent: 'Blått betyr gå nå', legend: function (m, n) { return m + ' = minutter til du må gå · (' + n + ') = den neste'; } }
    : { urgent: 'Blue means go now', legend: function (m, n) { return m + ' = minutes until you leave · (' + n + ') = the next one'; } };

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
    setAll('[data-legend]', urgent ? TEXT.urgent : TEXT.legend(minutes, minutes + 7));
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
    if (focus) tab.focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); select(next, true); }
    });
  });

  // ---- A normal day: pinned surfaces on phones ---------------------------
  // Each surface block is taller than the screen and its content is sticky.
  // How far you have scrolled through the block picks which moment shows.
  var phone = window.matchMedia('(max-width: 760px)');
  var rows = Array.prototype.slice.call(document.querySelectorAll('.day-row:not(.head)')).map(function (row) {
    var pin = row.querySelector('.day-pin');
    var moments = Array.prototype.slice.call(row.querySelectorAll('.moment'));
    var dots = document.createElement('div');
    dots.className = 'day-steps';
    dots.setAttribute('aria-hidden', 'true');
    moments.forEach(function () { dots.appendChild(document.createElement('span')); });
    if (pin) pin.appendChild(dots);
    return { row: row, moments: moments, dots: Array.prototype.slice.call(dots.children), current: -1 };
  });

  function show(r, index) {
    if (r.current === index) return;
    r.current = index;
    r.moments.forEach(function (m, i) { m.classList.toggle('is-active', i === index); });
    r.dots.forEach(function (d, i) { d.classList.toggle('on', i === index); });
  }

  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    rows.forEach(function (r) {
      if (!phone.matches) { show(r, 0); return; }
      var rect = r.row.getBoundingClientRect();
      var travel = rect.height - vh;
      var progress = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
      show(r, Math.min(r.moments.length - 1, Math.floor(progress * r.moments.length)));
    });
  }
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
