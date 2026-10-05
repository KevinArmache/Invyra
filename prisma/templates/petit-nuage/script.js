document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('rsvp-form');
  var success = document.getElementById('rsvp-success');
  var message = document.getElementById('rsvp-status-msg');
  var editBtn = document.getElementById('rsvp-edit-btn');
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-rsvp]'));
  var MESSAGES = {
    confirmed: 'Merci ! Nous avons hâte de vous voir.',
    maybe: 'Réponse notée : peut-être.',
    declined: 'Vous allez nous manquer. Merci de nous avoir prévenus.'
  };
  var current = window.GUEST_DATA && window.GUEST_DATA.rsvp_status ? window.GUEST_DATA.rsvp_status : null;
  var submitting = false;

  function setActive(status) {
    buttons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-rsvp') === status);
    });
  }
  function setDisabled(disabled) {
    buttons.forEach(function (btn) { btn.disabled = disabled; });
  }
  function showSuccess(status) {
    current = status;
    setActive(status);
    if (message) message.textContent = MESSAGES[status] || MESSAGES.maybe;
    if (form) form.hidden = true;
    if (success) success.hidden = false;
  }
  function showForm() {
    if (form) form.hidden = false;
    if (success) success.hidden = true;
    setActive(current);
    setDisabled(false);
  }

  if (current) showSuccess(current);

  if (editBtn) {
    editBtn.addEventListener('click', function (e) {
      e.preventDefault();
      submitting = false;
      showForm();
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (submitting) return;
      var status = btn.getAttribute('data-rsvp');
      if (!status) return;
      submitting = true;
      setActive(status);
      setDisabled(true);
      window.parent.postMessage({
        type: 'RSVP_SUBMIT',
        data: { rsvp_status: status, dietary_restrictions: '', plus_one: false, notes: '' }
      }, '*');
      setTimeout(function () {
        showSuccess(status);
        submitting = false;
      }, 450);
    });
  });
});

(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var SVG = 'http://www.w3.org/2000/svg';

  // ── Itinéraire tiré du lieu affiché ──────────────────────────────────────
  var place = document.querySelector('[data-place]');
  each(document.querySelectorAll('[data-map]'), function (link) {
    var query = place && place.textContent.trim();
    if (query) link.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
  });

  // Relance une animation CSS portée par une classe.
  function replay(el, name) {
    el.classList.remove(name);
    void el.offsetWidth;
    el.classList.add(name);
  }

  // ── Couleurs pastel : un appui fait sauter le ballon ────────────────────
  var balloons = document.querySelectorAll('[data-balloon]');
  each(balloons, function (balloon) {
    function pick() {
      each(balloons, function (other) { if (other !== balloon) other.classList.remove('is-picked'); });
      replay(balloon, 'is-picked');
    }
    balloon.addEventListener('click', pick);
    balloon.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
    });
  });

  // ── Programme : un appui sur un body le fait balancer ───────────────────
  each(document.querySelectorAll('[data-swing]'), function (item) {
    var onesie = item.querySelector('.pn-onesie');
    if (!onesie) return;
    onesie.addEventListener('click', function () { replay(item, 'is-swinging'); });
  });

  // ── Ballons qui s'envolent à la confirmation ────────────────────────────
  var confirm = document.querySelector('[data-rsvp="confirmed"]');
  if (confirm && !reduce && confirm.animate) {
    confirm.addEventListener('click', function () {
      var box = confirm.getBoundingClientRect();
      var colors = ['#f4c7c3', '#bcd7ec', '#c5d8bf', '#f8e3a3', '#e48f72', '#ddd3f0'];
      for (var i = 0; i < 14; i++) {
        var balloon = document.createElementNS(SVG, 'svg');
        var use = document.createElementNS(SVG, 'use');
        use.setAttribute('href', '#pn-balloon');
        balloon.appendChild(use);
        balloon.setAttribute('class', 'pn-fly');
        balloon.setAttribute('aria-hidden', 'true');
        balloon.style.color = colors[i % colors.length];
        balloon.style.left = box.left + Math.random() * box.width - 17 + 'px';
        balloon.style.top = box.top + 'px';
        balloon.style.width = 26 + Math.random() * 18 + 'px';
        document.body.appendChild(balloon);
        var sway = (Math.random() - .5) * 120;
        var rise = box.top + 220 + Math.random() * 200;
        var animation = balloon.animate([
          { transform: 'translate(0, 0) rotate(0deg)', opacity: 0 },
          { opacity: 1, offset: .12 },
          { transform: 'translate(' + sway * .4 + 'px, ' + -rise * .5 + 'px) rotate(' + sway * .06 + 'deg)', offset: .55 },
          { transform: 'translate(' + sway + 'px, ' + -rise + 'px) rotate(' + -sway * .05 + 'deg)', opacity: 0 }
        ], { duration: 2600 + Math.random() * 1400, delay: i * 70, easing: 'cubic-bezier(.3, .1, .4, 1)', fill: 'backwards' });
        animation.onfinish = (function (el) { return function () { el.remove(); }; })(balloon);
      }
    });
  }

  if (reduce || !('IntersectionObserver' in window)) return;

  // ── Révélations au défilement ───────────────────────────────────────────
  root.classList.add('fx');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });

  // ── Le mobile du berceau descend doucement au défilement ────────────────
  var hero = document.querySelector('[data-hero]');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (hero) hero.style.setProperty('--sy', Math.min(window.scrollY || 0, innerHeight).toFixed(0));
    });
  }

  function start() {
    each(document.querySelectorAll('[data-reveal]'), function (el) { io.observe(el); });
    addEventListener('scroll', onScroll, { passive: true });
  }
  if (window.whenOpened) window.whenOpened(start); else start();
})();
