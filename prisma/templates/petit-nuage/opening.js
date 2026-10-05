(function () {
  var op = document.querySelector('.pno');
  if (!op) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var zone = op.querySelector('[data-zone]');
  var canvas = op.querySelector('[data-foil]');
  var hint = op.querySelector('[data-hint]');
  var skip = op.querySelector('[data-skip]');
  var ctx = canvas.getContext('2d');

  var W = 0;
  var H = 0;
  var BRUSH = 22;
  var THRESHOLD = 0.5;
  // La surface est suivie sur une grille grossière : la part grattée se
  // calcule sans relire les pixels du canvas.
  var COLS = 24;
  var ROWS = 16;
  var cells = new Uint8Array(COLS * ROWS);
  var cleared = 0;
  var touched = false;
  var done = false;
  var drag = null;
  var started = false;

  function css(name, fallback) {
    var value = getComputedStyle(op).getPropertyValue(name).trim();
    return value || fallback;
  }

  // ── Sons : le grattage, puis une petite boîte à musique ─────────────────
  var audio = null;
  var scratchGain = null;
  function setupAudio() {
    try {
      var Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      audio = new Context();
      var buffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      var noise = audio.createBufferSource();
      var high = audio.createBiquadFilter();
      noise.buffer = buffer;
      noise.loop = true;
      high.type = 'highpass';
      high.frequency.value = 3200;
      scratchGain = audio.createGain();
      scratchGain.gain.value = 0;
      noise.connect(high);
      high.connect(scratchGain);
      scratchGain.connect(audio.destination);
      noise.start();
    } catch (e) {
      audio = null;
    }
  }
  function scratchSound(speed) {
    if (audio && scratchGain) scratchGain.gain.setTargetAtTime(Math.min(0.05, speed * 0.018), audio.currentTime, 0.04);
  }
  function chime() {
    if (!audio) return;
    try {
      var now = audio.currentTime;
      [784, 988, 1175, 1568].forEach(function (frequency, index) {
        var osc = audio.createOscillator();
        var gain = audio.createGain();
        var at = now + index * 0.12;
        osc.type = 'sine';
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.07, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.3);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start(at);
        osc.stop(at + 1.4);
      });
    } catch (e) {}
  }

  // ── La couche argentée ──────────────────────────────────────────────────
  function drawFoil() {
    // Taille de mise en page : celle du rectangle affiché varie pendant
    // l'animation d'entrée du ticket (mise à l'échelle).
    W = zone.clientWidth;
    H = zone.clientHeight;
    if (!W || !H) return;
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * ratio);
    canvas.height = Math.round(H * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.globalCompositeOperation = 'source-over';

    var gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, css('--foil-a', '#cfd8e6'));
    gradient.addColorStop(0.48, css('--foil-b', '#f4f6fa'));
    gradient.addColorStop(1, css('--foil-c', '#c3cddd'));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Grain métallique.
    for (var i = 0; i < W * H / 26; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(90,100,130,.08)';
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }

    // Petites étoiles en relief.
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (var y = 14; y < H; y += 34) {
      for (var x = (y / 34) % 2 ? 30 : 12; x < W; x += 36) {
        star(x, y, 3.4);
      }
    }

    ctx.fillStyle = css('--foil-ink', '#75809b');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 15px ' + css('--f-round', 'system-ui, sans-serif');
    if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';
    ctx.fillText('GRATTEZ ICI', W / 2, H / 2);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    star(W / 2, H / 2 - 26, 7);
    ctx.globalCompositeOperation = 'destination-out';
  }
  function star(x, y, r) {
    ctx.beginPath();
    for (var i = 0; i < 8; i++) {
      var angle = -Math.PI / 2 + i * Math.PI / 4;
      var radius = i % 2 ? r * 0.38 : r;
      ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
    ctx.closePath();
    ctx.fill();
  }

  // ── Grattage ────────────────────────────────────────────────────────────
  function mark(ax, ay, bx, by) {
    var cw = W / COLS;
    var ch = H / ROWS;
    var steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 6));
    for (var s = 0; s <= steps; s++) {
      var px = ax + (bx - ax) * s / steps;
      var py = ay + (by - ay) * s / steps;
      var c0 = Math.max(0, Math.floor((px - BRUSH) / cw));
      var c1 = Math.min(COLS - 1, Math.floor((px + BRUSH) / cw));
      var r0 = Math.max(0, Math.floor((py - BRUSH) / ch));
      var r1 = Math.min(ROWS - 1, Math.floor((py + BRUSH) / ch));
      for (var r = r0; r <= r1; r++) {
        for (var c = c0; c <= c1; c++) {
          var index = r * COLS + c;
          if (cells[index]) continue;
          if (Math.hypot((c + 0.5) * cw - px, (r + 0.5) * ch - py) <= BRUSH) {
            cells[index] = 1;
            cleared++;
          }
        }
      }
    }
  }
  function scratch(ax, ay, bx, by) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = BRUSH * 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx + 0.01, by);
    ctx.stroke();
    mark(ax, ay, bx, by);
    var progress = cleared / cells.length;
    if (progress >= THRESHOLD) finish();
    else if (progress > 0.18 && hint) hint.textContent = 'Encore un peu…';
  }

  function begin() {
    if (started) return;
    started = true;
    setupAudio();
    if (window.startInvitationMusic) window.startInvitationMusic();
  }

  // ── Révélation ──────────────────────────────────────────────────────────
  function burst() {
    if (reduce) return;
    var box = zone.getBoundingClientRect();
    var colors = [css('--butter', '#f5d27a'), css('--apricot', '#e48f72'), '#bcd7ec', '#c5d8bf', '#f4c7c3'];
    var cx = box.left + box.width / 2;
    var cy = box.top + box.height / 2;
    for (var i = 0; i < 26; i++) {
      var bit = document.createElement('span');
      bit.className = 'pno-bit ' + (i % 2 ? 'pno-bit--star' : 'pno-bit--dot');
      bit.style.left = cx + 'px';
      bit.style.top = cy + 'px';
      bit.style.background = colors[i % colors.length];
      op.appendChild(bit);
      var angle = Math.random() * Math.PI * 2;
      var distance = 90 + Math.random() * 150;
      var animation = bit.animate([
        { transform: 'translate(0, 0) scale(.4) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + Math.cos(angle) * distance + 'px, ' + (Math.sin(angle) * distance + 40) + 'px) scale(1) rotate(' + (Math.random() * 360 - 180) + 'deg)', opacity: 0 }
      ], { duration: 1000 + Math.random() * 600, easing: 'cubic-bezier(.2, .7, .4, 1)' });
      animation.onfinish = (function (el) { return function () { el.remove(); }; })(bit);
    }
  }
  function finish() {
    if (done) return;
    done = true;
    begin();
    drag = null;
    scratchSound(0);
    op.classList.add('is-touched', 'is-revealed');
    if (hint) hint.textContent = 'Surprise !';
    chime();
    burst();
    setTimeout(function () {
      if (window.openInvitation) window.openInvitation();
      if (audio) setTimeout(function () { try { audio.close(); } catch (e) {} }, 1600);
    }, reduce ? 300 : 1500);
  }

  // ── Gestes ──────────────────────────────────────────────────────────────
  var lastBuzz = 0;
  function point(e) {
    var rect = zone.getBoundingClientRect();
    return [(e.clientX - rect.left) * W / rect.width, (e.clientY - rect.top) * H / rect.height];
  }
  zone.addEventListener('pointerdown', function (e) {
    if (done || e.button) return;
    e.preventDefault();
    begin();
    if (!touched) {
      touched = true;
      op.classList.add('is-touched');
    }
    op.classList.add('is-scratching');
    var p = point(e);
    drag = { x: p[0], y: p[1], t: performance.now() };
    scratch(p[0], p[1], p[0], p[1]);
    try { zone.setPointerCapture(e.pointerId); } catch (error) {}
  });
  zone.addEventListener('pointermove', function (e) {
    if (!drag || done) return;
    var events = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    if (!events.length) events = [e];
    for (var i = 0; i < events.length; i++) {
      var p = point(events[i]);
      scratch(drag.x, drag.y, p[0], p[1]);
      // Assez gratté : finish() a clos le geste.
      if (done) return;
      var now = performance.now();
      scratchSound(Math.hypot(p[0] - drag.x, p[1] - drag.y) / Math.max(1, now - drag.t));
      drag = { x: p[0], y: p[1], t: now };
    }
    var t = performance.now();
    if (navigator.vibrate && t - lastBuzz > 110) {
      lastBuzz = t;
      try { navigator.vibrate(4); } catch (error) {}
    }
  });
  function release() {
    drag = null;
    op.classList.remove('is-scratching');
    scratchSound(0);
  }
  zone.addEventListener('pointerup', release);
  zone.addEventListener('pointercancel', release);
  zone.addEventListener('lostpointercapture', release);
  skip.addEventListener('click', finish);

  // Taille de la zone : la couche est redessinée tant qu'on n'y a pas touché.
  addEventListener('resize', function () { if (!touched) drawFoil(); });
  drawFoil();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { if (!touched) drawFoil(); });
  }
})();
