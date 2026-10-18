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
    setAll('[data-legend]', urgent
      ? 'Blue means go now'
      : minutes + ' = minutes until you leave · (' + (minutes + 7) + ') = the next one');
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
})();
