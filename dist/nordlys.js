/* Nordlys — dansk udgave af Aurora Glass v3 til Home Assistant.
   Baseret på Aurora Glass v3 (c) lucalux00 — https://github.com/lucalux00/aurora-glass-v3 — GPL-3.0.
   Ændret oktober 2026: brugerflade oversat til dansk, valuta kr., da-DK-format, nyt navn (nordlys-card),
   ny konfiguration "labels" til egne navne på lys, rum og scener. Kommentarer i koden er fortsat på italiensk.
   Udgives under GPL-3.0 (se LICENSE). */
/* VERSION: ret kun her (se CLAUDE.md) */
window.NORDLYS_VERSION = "2.24";


/* ---- disegno.js ---- */
/* ============================================================================
   AURORA GLASS v3 — motore di disegno delle immagini dei pulsanti
   Ogni immagine è una funzione draw(on, t): t va da 0 a 1 e il ciclo si chiude
   da solo (così la GIF si ripete senza scatti). Lo usa tools/render_btn.py per
   produrre i file PNG (spento) e GIF (acceso) in assets/btn/.
   ========================================================================== */
(function (g) {
  var TAU = Math.PI * 2;
  var DEFS = [], N = 0, PFX = '', RC = 0;
  var f = function (n) { return Math.round(n * 100) / 100; };
  var sn = function (t, k, p) { return Math.sin(TAU * (t * (k || 1) + (p || 0))); };
  var cs = function (t, k, p) { return Math.cos(TAU * (t * (k || 1) + (p || 0))); };
  var fr = function (x) { return x - Math.floor(x); };
  var clamp = function (x, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, x)); };
  var hsl = function (h, s, l, a) { return 'hsla(' + h + ',' + s + '%,' + l + '%,' + (a === undefined ? 1 : a) + ')'; };
  function rnd(seed) { var s = (seed * 9301 + 49297) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = (s * 16807) % 2147483647; return (s % 100000) / 100000; }; }
  function uid(p) { return PFX + p + (N++); }

  /* gradienti */
  function lg(stops, o) {
    o = o || {};
    var i = uid('lg');
    DEFS.push('<linearGradient id="' + i + '" x1="' + (o.x1 || 0) + '" y1="' + (o.y1 || 0) + '" x2="' + (o.x2 === undefined ? 0 : o.x2) + '" y2="' + (o.y2 === undefined ? 1 : o.y2) + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '" stop-opacity="' + (s[2] === undefined ? 1 : s[2]) + '"/>'; }).join('') + '</linearGradient>');
    return 'url(#' + i + ')';
  }
  function rg(stops, o) {
    o = o || {};
    var i = uid('rg');
    DEFS.push('<radialGradient id="' + i + '" cx="' + (o.cx === undefined ? .5 : o.cx) + '" cy="' + (o.cy === undefined ? .5 : o.cy) + '" r="' + (o.r === undefined ? .5 : o.r) + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '" stop-opacity="' + (s[2] === undefined ? 1 : s[2]) + '"/>'; }).join('') + '</radialGradient>');
    return 'url(#' + i + ')';
  }

  /* primitive */
  function R(x, y, w, h, fill, rx, ex) { return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '"' + (rx ? ' rx="' + rx + '"' : '') + ' fill="' + fill + '" ' + (ex || '') + '/>'; }
  function C(cx, cy, r, fill, ex) { return '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '" fill="' + fill + '" ' + (ex || '') + '/>'; }
  function E(cx, cy, rx, ry, fill, ex) { return '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + fill + '" ' + (ex || '') + '/>'; }
  function P(pts, fill, ex) { return '<polygon points="' + pts + '" fill="' + fill + '" ' + (ex || '') + '/>'; }
  function PA(d, fill, ex) { return '<path d="' + d + '" fill="' + fill + '" ' + (ex || '') + '/>'; }
  function ST(d, stroke, w, ex) { return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round" ' + (ex || '') + '/>'; }
  function Gr(inner, tf, ex) { return '<g' + (tf ? ' transform="' + tf + '"' : '') + ' ' + (ex || '') + '>' + inner + '</g>'; }
  function glow(cx, cy, r, col, a) { return C(cx, cy, r, rg([[0, col, a === undefined ? 1 : a], [.45, col, (a === undefined ? 1 : a) * .35], [1, col, 0]])); }
  function blur(inner, sd) { return '<g filter="url(#' + PFX + 'b' + sd + ')">' + inner + '</g>'; }
  function cone(xt, yt, wt, xb, yb, wb, col, a) {
    return P(f(xt - wt / 2) + ',' + yt + ' ' + f(xt + wt / 2) + ',' + yt + ' ' + f(xb + wb / 2) + ',' + yb + ' ' + f(xb - wb / 2) + ',' + yb, lg([[0, col, a], [1, col, 0]]));
  }
  function motes(t, x, y, w, h, n, col, seed, r0) {
    var rd = rnd(seed || 3), s = '';
    for (var i = 0; i < n; i++) {
      var px = rd(), py = rd(), ph = rd(), q = fr(t + ph);
      s += C(x + w * px + 7 * sn(t, 1, ph), y + h * (1 - q), (r0 || 1.3) * (0.6 + py * .9), col, 'opacity="' + f(Math.sin(Math.PI * q) * .75) + '"');
    }
    return s;
  }
  function stars(n, x, y, w, h, t, seed, col) {
    var rd = rnd(seed || 5), s = '';
    for (var i = 0; i < n; i++) {
      var px = rd(), py = rd(), ph = rd();
      s += C(x + w * px, y + h * py, 0.7 + rd() * 1.2, col || '#fff', 'opacity="' + f(.35 + .65 * Math.abs(sn(t, 1, ph))) + '"');
    }
    return s;
  }
  function roomBase(hue, floorY) {
    floorY = floorY || 178;
    return R(0, 0, 256, floorY, lg([[0, hsl(hue, 34, 34)], [1, hsl(hue, 38, 21)]])) +
      R(0, floorY, 256, 256 - floorY, lg([[0, hsl(hue, 28, 19)], [1, hsl(hue, 34, 8)]])) +
      R(0, floorY - 5, 256, 6, hsl(hue, 22, 44)) + R(0, floorY + 1, 256, 2, 'rgba(255,255,255,.07)');
  }

  var ART = {};
  function filters() {
    return '<filter id="' + PFX + 'b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>' +
      '<filter id="' + PFX + 'b4" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4"/></filter>' +
      '<filter id="' + PFX + 'b8" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="8"/></filter>' +
      '<filter id="' + PFX + 'b14" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="14"/></filter>' +
      '<filter id="' + PFX + 'off" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0.32"/><feComponentTransfer><feFuncR type="linear" slope=".58"/><feFuncG type="linear" slope=".6"/><feFuncB type="linear" slope=".72" intercept=".02"/></feComponentTransfer></filter>';
  }

  function render(key, on, t) {
    var a = ART[key];
    if (!a) throw new Error("ukendt billede: " + key);
    DEFS = []; N = 0; PFX = 'k' + (RC++) + '_';
    var bg = R(0, 0, 256, 256, lg([[0, hsl(a.hue, 40, 20)], [1, hsl(a.hue, 45, 9)]]));
    var inner = a.draw(!!on, t || 0);
    var dimmed = !on && a.dim !== false;
    var vign = R(0, 0, 256, 256, rg([[.55, '#000', 0], [1, '#000', .38]], { r: .75 }));
    return '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><defs>' + filters() + DEFS.join('') + '</defs>' +
      '<g' + (dimmed ? ' filter="url(#' + PFX + 'off)"' : '') + '>' + bg + inner + '</g>' + vign + '</svg>';
  }

  function begin(prefix) { DEFS = []; N = 0; PFX = prefix || ('k' + (RC++) + '_'); }
  function defs() { return DEFS.join(''); }

  g.AR = { begin: begin, defs: defs, filters: filters, TAU: TAU, f: f, sn: sn, cs: cs, fr: fr, clamp: clamp, hsl: hsl, rnd: rnd, lg: lg, rg: rg, R: R, C: C, E: E, P: P, PA: PA, ST: ST, Gr: Gr,
    glow: glow, blur: blur, uid: uid, cone: cone, motes: motes, stars: stars, roomBase: roomBase, ART: ART, render: render };
})(window);


/* ---- mondi-base.js ---- */
/* ============================================================================
   AURORA GLASS v3 — MONDI: base comune
   - palette continua per ogni ora del giorno (alba → giorno → tramonto → notte)
   - posizione di sole e luna lungo l'arco
   - cielo, stelle, nuvole, uccelli e piccoli helper SMIL riusati da tutti i mondi
   Ogni mondo produce un SVG autonomo e animato (CSS + SMIL): lo stesso file
   funziona come <img>, come sfondo CSS e dentro Home Assistant.
   ========================================================================== */
(function (g) {
  var A = g.AR, f = A.f;
  var poly = A.P, path = A.PA, rect = A.R, circ = A.C, ell = A.E, line = A.ST, grp = A.Gr;

  /* ------------------------------------------------------------- colori */
  function h2r(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function r2h(r) { return '#' + r.map(function (v) { return ('0' + Math.round(Math.max(0, Math.min(255, v))).toString(16)).slice(-2); }).join(''); }
  function mix(a, b, t) { var x = h2r(a), y = h2r(b); return r2h([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; })); }

  /* fasce: s1..s3 cielo (alto→basso) · hf/hn colline lontane/vicine · win luce finestre · sun · cl nuvole · st stelle
     dy luce del giorno (0 notte → 1 giorno) · b1..b3 colori dello sfondo UI · a1,a2 colori dei pulsanti */
  var KEYS = [
    [0,    { s1: '#070B24', s2: '#141A52', s3: '#2A2A78', hf: '#121A4A', hn: '#0A0F33', win: '#FFD27A', sun: '#FFF1B0', cl: .06, st: 1,   dy: 0,   b1: '#7C5CFF', b2: '#3B82F6', b3: '#22D3EE', a1: '#7C5CFF', a2: '#D946EF' }],
    [5,    { s1: '#070B24', s2: '#141A52', s3: '#2A2A78', hf: '#121A4A', hn: '#0A0F33', win: '#FFD27A', sun: '#FFF1B0', cl: .06, st: 1,   dy: 0,   b1: '#7C5CFF', b2: '#3B82F6', b3: '#22D3EE', a1: '#7C5CFF', a2: '#D946EF' }],
    [6.5,  { s1: '#3A2A7A', s2: '#D9648C', s3: '#FFC38A', hf: '#7A4F93', hn: '#44286B', win: '#FFE3A3', sun: '#FFC27A', cl: .38, st: .3,  dy: .35, b1: '#FB7185', b2: '#F59E0B', b3: '#8B5CF6', a1: '#F43F5E', a2: '#F59E0B' }],
    [8.5,  { s1: '#4A90E6', s2: '#8ACBFB', s3: '#F6E6D2', hf: '#6AB48C', hn: '#3F8F66', win: '#FFF6D2', sun: '#FFF3B8', cl: .7,  st: 0,   dy: .9,  b1: '#38BDF8', b2: '#34D399', b3: '#818CF8', a1: '#0284C7', a2: '#6366F1' }],
    [12,   { s1: '#2F86E6', s2: '#74BFFB', s3: '#D4EEFF', hf: '#6DB98F', hn: '#3F8F66', win: '#FFF6D2', sun: '#FFF3B8', cl: .8,  st: 0,   dy: 1,   b1: '#38BDF8', b2: '#34D399', b3: '#818CF8', a1: '#0284C7', a2: '#6366F1' }],
    [16.5, { s1: '#3B86E0', s2: '#86C2F4', s3: '#F8E6C8', hf: '#6DB98F', hn: '#3F8F66', win: '#FFF6D2', sun: '#FFF3B8', cl: .75, st: 0,   dy: .95, b1: '#38BDF8', b2: '#34D399', b3: '#818CF8', a1: '#0284C7', a2: '#6366F1' }],
    [18.5, { s1: '#35205F', s2: '#C23F7A', s3: '#FF9A62', hf: '#7A3A78', hn: '#4A1F5E', win: '#FFD27A', sun: '#FFB36B', cl: .4,  st: .25, dy: .3,  b1: '#F97316', b2: '#EC4899', b3: '#8B5CF6', a1: '#EA580C', a2: '#DB2777' }],
    [20.5, { s1: '#10103A', s2: '#2B2260', s3: '#4A2D78', hf: '#2A1F58', hn: '#150F3A', win: '#FFD27A', sun: '#FFB36B', cl: .15, st: .8,  dy: .05, b1: '#8B5CF6', b2: '#6366F1', b3: '#22D3EE', a1: '#7C5CFF', a2: '#D946EF' }],
    [22,   { s1: '#070B24', s2: '#141A52', s3: '#2A2A78', hf: '#121A4A', hn: '#0A0F33', win: '#FFD27A', sun: '#FFF1B0', cl: .06, st: 1,   dy: 0,   b1: '#7C5CFF', b2: '#3B82F6', b3: '#22D3EE', a1: '#7C5CFF', a2: '#D946EF' }],
    [24,   { s1: '#070B24', s2: '#141A52', s3: '#2A2A78', hf: '#121A4A', hn: '#0A0F33', win: '#FFD27A', sun: '#FFF1B0', cl: .06, st: 1,   dy: 0,   b1: '#7C5CFF', b2: '#3B82F6', b3: '#22D3EE', a1: '#7C5CFF', a2: '#D946EF' }]
  ];
  function palette(h) {
    h = ((h % 24) + 24) % 24;
    var i = 0; while (i < KEYS.length - 2 && h > KEYS[i + 1][0]) i++;
    var a = KEYS[i], b = KEYS[i + 1], t = (h - a[0]) / (b[0] - a[0]), K = {};
    Object.keys(a[1]).forEach(function (k) {
      var x = a[1][k], y = b[1][k];
      K[k] = typeof x === 'number' ? x + (y - x) * t : mix(x, y, t);
    });
    K.nt = 1 - K.dy;                        // "notte" 0..1
    K.cloud = mix('#ffffff', K.s3, .35);    // colore delle nuvole
    return K;
  }
  function body(h) {
    var sunT = (h - 5.5) / 15, hm = (h >= 19.5) ? h - 19.5 : h + 4.5, moonT = hm / 11;
    function arc(t) { t = Math.min(1, Math.max(0, t)); return { x: 50 + 540 * t, y: 192 - Math.sin(Math.PI * t) * 140 }; }
    var s = arc(sunT), m = arc(moonT);
    return { sun: { x: s.x, y: s.y, vis: (sunT >= 0 && sunT <= 1) ? 1 : 0, t: sunT }, moon: { x: m.x, y: m.y, vis: (moonT >= 0 && moonT <= 1) ? 1 : 0, t: moonT } };
  }

  /* ------------------------------------------------------------- SMIL */
  function an(attr, values, dur, ex) { return '<animate attributeName="' + attr + '" values="' + values + '" dur="' + dur + 's" repeatCount="indefinite" ' + (ex || '') + '/>'; }
  function at(type, values, dur, ex) { return '<animateTransform attributeName="transform" type="' + type + '" values="' + values + '" dur="' + dur + 's" repeatCount="indefinite" ' + (ex || '') + '/>'; }
  function circA(cx, cy, r, fill, inner, ex) { return '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '" fill="' + fill + '" ' + (ex || '') + '>' + inner + '</circle>'; }
  function ellA(cx, cy, rx, ry, fill, inner, ex) { return '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + fill + '" ' + (ex || '') + '>' + inner + '</ellipse>'; }

  var BASECSS = '.tw{animation:tw 3.2s ease-in-out infinite}@keyframes tw{0%,100%{opacity:.95}50%{opacity:.2}}' +
    '.c1{animation:cl 80s linear infinite}.c2{animation:cl 120s linear infinite;animation-delay:-45s}.c3{animation:cl 100s linear infinite;animation-delay:-75s}' +
    '@keyframes cl{from{transform:translateX(-260px)}to{transform:translateX(900px)}}' +
    '.fl{animation:fl 2.8s steps(1) infinite}@keyframes fl{0%,100%{opacity:1}7%{opacity:.25}12%{opacity:1}55%{opacity:.7}58%{opacity:1}}' +
    '.pu{animation:pu 3s ease-in-out infinite}@keyframes pu{50%{opacity:.45}}';

  /* ------------------------------------------------------------- elementi comuni */
  function stars(K, o) {
    o = o || {};
    var rd = A.rnd(o.seed || 5), n = o.n || 38, s = '', ymax = o.ymax || 130;
    for (var i = 0; i < n; i++) {
      s += '<circle class="tw" cx="' + f(rd() * 640) + '" cy="' + f(rd() * ymax) + '" r="' + f(.5 + rd() * 1.1) + '" fill="#fff" style="animation-delay:-' + f(rd() * 4) + 's;animation-duration:' + f(2.4 + rd() * 2.8) + 's"/>';
    }
    return '<g opacity="' + f(Math.max(K.st, o.min || 0)) + '">' + s + '</g>';
  }
  function sunmoon(K, B, o) {
    o = o || {};
    var s = '';
    s += '<g transform="translate(' + f(B.sun.x) + ' ' + f(B.sun.y) + ')" opacity="' + B.sun.vis + '"><circle r="62" fill="' + A.rg([[0, '#fff', .95], [.22, K.sun, .6], [1, K.sun, 0]]) + '"/><circle r="15" fill="' + K.sun + '"/></g>';
    s += '<g transform="translate(' + f(B.moon.x) + ' ' + f(B.moon.y) + ')" opacity="' + B.moon.vis + '"><circle r="52" fill="' + A.rg([[0, '#DDE6FF', .5], [1, '#DDE6FF', 0]]) + '"/><circle r="13" fill="#EEF2FF"/><circle cx="-4" cy="-3" r="2.4" fill="#C9D3F5"/><circle cx="4" cy="4" r="3" fill="#C9D3F5"/></g>';
    return s;
  }
  function cloud(x, y, sc, cls, K) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')" opacity="' + f(K.cl) + '"><g class="' + cls + '" fill="' + K.cloud + '"><ellipse cx="30" cy="12" rx="34" ry="9"/><ellipse cx="48" cy="5" rx="22" ry="10"/><ellipse cx="14" cy="8" rx="20" ry="8"/></g></g>';
  }
  function sky(K, B, o) {
    o = o || {};
    var s = rect(0, 0, 640, 260, A.lg([[0, K.s1], [.62, K.s2], [1, K.s3]]));
    if (o.stars !== 0) s += stars(K, { n: o.stars, seed: o.seed, min: o.minStar, ymax: o.ymax });
    if (!o.noBodies) s += sunmoon(K, B);
    var n = o.clouds === undefined ? 3 : o.clouds;
    if (n > 0) s += cloud(0, 54, 1, 'c1', K);
    if (n > 1) s += cloud(0, 28, .75, 'c2', K);
    if (n > 2) s += cloud(0, 92, .9, 'c3', K);
    return s;
  }
  function bird(y, dur, delay, sc, col) {
    sc = sc || 1;
    return '<g transform="scale(' + sc + ')"><g>' + at('translate', f(-40 / sc) + ' ' + f(y / sc) + ';' + f(700 / sc) + ' ' + f((y - 14) / sc), dur, 'begin="-' + delay + 's"') +
      '<path d="M0 0 q5 -6 10 0 q5 -6 10 0" fill="none" stroke="' + (col || '#1a1a3a') + '" stroke-width="2" stroke-linecap="round">' +
      an('d', 'M0 0 q5 -6 10 0 q5 -6 10 0;M0 0 q5 4 10 0 q5 4 10 0;M0 0 q5 -6 10 0 q5 -6 10 0', .9) + '</path></g></g>';
  }
  function smoke(x, y, col, n) {
    var s = '';
    n = n || 4;
    for (var i = 0; i < n; i++) {
      var dly = -(i * 4 / n);
      s += '<circle cx="' + x + '" cy="' + y + '" r="3" fill="' + (col || '#cfd6ee') + '" opacity="0">' +
        an('cy', y + ';' + (y - 46), 4, 'begin="' + f(dly) + 's"') + an('cx', x + ';' + (x + 10), 4, 'begin="' + f(dly) + 's"') + an('r', '3;10', 4, 'begin="' + f(dly) + 's"') + an('opacity', '0;.45;0', 4, 'begin="' + f(dly) + 's"') + '</circle>';
    }
    return s;
  }
  function snow(n, seed, col, ymax) {
    var rd = A.rnd(seed || 41), s = '';
    for (var i = 0; i < n; i++) {
      var x = rd() * 640, d = 5 + rd() * 6, r = .9 + rd() * 1.6, dx = 12 + rd() * 22;
      s += '<circle cx="' + f(x) + '" cy="-6" r="' + f(r) + '" fill="' + (col || '#fff') + '" opacity=".85">' +
        an('cy', '-6;' + (ymax || 262), d, 'begin="-' + f(rd() * d) + 's"') + an('cx', f(x) + ';' + f(x + dx) + ';' + f(x - dx * .4) + ';' + f(x), d, 'begin="-' + f(rd() * d) + 's"') + '</circle>';
    }
    return s;
  }

  /* ------------------------------------------------------------- registro */
  var W = {};
  function svg(id, h) {
    var w = W[id];
    var K = palette(h), B = body(h);
    A.begin('w' + id + '_');
    var inner = w.draw(K, h, B);
    var out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 260" width="640" height="260"><defs>' + A.filters() + A.defs() + '</defs><style>' + BASECSS + (w.css || '') + '</style>' + inner + '</svg>';
    return g.__NLY_STATIC ? freezeSvg(out) : out;
  }
  /* Nordlys: statisk tilstand - hver SMIL-animation springer til sit slutbillede og fryser, CSS-animationer slås fra */
  function freezeSvg(s) {
    return s.replace(/<animate(?:Transform|Motion)?\b[^>]*>/g, function (t) {
      t = t.replace(/\sdur="[^"]*"/, ' dur="0.001s"').replace(/\srepeatCount="[^"]*"/, ' repeatCount="1"').replace(/\sbegin="[^"]*"/, '').replace(/\sfill="[^"]*"/, '');
      return t.replace(/^<animate(?:Transform|Motion)?/, function (m) { return m + ' fill="freeze"'; });
    }).replace(/animation:[^;}"]*/g, 'animation:none');
  }
  function dataURL(id, h) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(id, h)); }

  g.AMB = { W: W, palette: palette, body: body, mix: mix, svg: svg, dataURL: dataURL,
    H: { poly: poly, path: path, rect: rect, circ: circ, ell: ell, line: line, grp: grp, an: an, at: at, circA: circA, ellA: ellA, sky: sky, stars: stars, sunmoon: sunmoon, cloud: cloud, bird: bird, smoke: smoke, snow: snow, mix: mix } };
})(window);


/* ---- mondi-a.js ---- */
/* AURORA GLASS v3 — MONDI (1/2): Casetta · Città · Montagna · Mare e faro · Foresta magica */
(function () {
  var A = AR, W = AMB.W, H = AMB.H, f = A.f, mix = H.mix;
  var poly = H.poly, path = H.path, rect = H.rect, circ = H.circ, ell = H.ell, line = H.line, grp = H.grp, an = H.an, at = H.at, circA = H.circA, ellA = H.ellA, sky = H.sky, bird = H.bird, smoke = H.smoke, snow = H.snow;

  /* abete con oscillazione leggera */
  function pine(x, y, hg, col, ph, cap) {
    var w = hg * .42, s = '';
    s += poly(f(x) + ',' + f(y - hg) + ' ' + f(x - w * .55) + ',' + f(y - hg * .62) + ' ' + f(x + w * .55) + ',' + f(y - hg * .62), col);
    s += poly(f(x) + ',' + f(y - hg * .82) + ' ' + f(x - w * .78) + ',' + f(y - hg * .34) + ' ' + f(x + w * .78) + ',' + f(y - hg * .34), col);
    s += poly(f(x) + ',' + f(y - hg * .58) + ' ' + f(x - w) + ',' + f(y - hg * .06) + ' ' + f(x + w) + ',' + f(y - hg * .06), col);
    s += rect(x - w * .09, y - hg * .1, w * .18, hg * .12, col);
    if (cap) s += poly(f(x) + ',' + f(y - hg) + ' ' + f(x - w * .3) + ',' + f(y - hg * .82) + ' ' + f(x + w * .3) + ',' + f(y - hg * .82), cap) + poly(f(x) + ',' + f(y - hg * .82) + ' ' + f(x - w * .42) + ',' + f(y - hg * .6) + ' ' + f(x + w * .42) + ',' + f(y - hg * .6), cap, 'opacity=".9"');
    return '<g>' + at('rotate', '-1.4 ' + f(x) + ' ' + f(y) + ';1.4 ' + f(x) + ' ' + f(y) + ';-1.4 ' + f(x) + ' ' + f(y), 5 + (ph || 0) % 3, 'begin="-' + f(ph || 0) + 's"') + s + '</g>';
  }
  H.pine = pine;
  function winDark(K, ws) { var c = mix('#0b1233', K.s2, K.dy * .55), s = ''; ws.forEach(function (w) { s += rect(w.x, w.y, w.w, w.h, c, 3, 'opacity=".85"'); }); return s; }

  /* ============================================================ CASETTA */
  var WIN_CASA = [{ k: 'camera', x: 398, y: 162, w: 28, h: 20 }, { k: 'cameretta', x: 494, y: 162, w: 28, h: 20 }, { k: 'salotto', x: 398, y: 196, w: 34, h: 22 }, { k: 'cucina', x: 488, y: 196, w: 34, h: 22 }, { k: 'ingresso', x: 447, y: 190, w: 26, h: 36 }];
  W.casetta = { name: "Huset", icon: 'mdi-home-variant', desc: "Sol, måne, skyer og dit hus med vinduer, der tænder", windows: WIN_CASA, draw: function (K, h, B) {
    var s = sky(K, B, { clouds: 3 }), dark = mix(K.hn, '#000', .34), roof = mix(K.hn, '#000', .45);
    s += path('M-10 190 Q90 140 190 176 T380 160 T650 178 V260 H-10Z', K.hf) + path('M-10 232 Q120 200 270 220 T650 212 V260 H-10Z', K.hn);
    s += pine(312, 224, 50, dark, 0) + pine(601, 222, 54, dark, 1.5) + pine(622, 227, 36, dark, 3);
    s += rect(441, 104, 16, 30, roof) + poly('366,154 460,98 554,154', roof) + rect(380, 150, 160, 76, mix(K.hn, '#1b2350', .25), 2) + circ(460, 128, 9, 'rgba(0,0,0,.35)');
    s += winDark(K, WIN_CASA) + poly('447,226 473,226 502,260 418,260', 'rgba(255,255,255,.07)');
    s += smoke(449, 100, K.cloud) + bird(60, 34, 0, 1) + bird(84, 46, 18, .8);
    return s;
  } };

  /* ============================================================ CITTÀ */
  var WIN_CITTA = [{ k: 'salotto', x: 396, y: 118, w: 15, h: 17 }, { k: 'cucina', x: 430, y: 118, w: 15, h: 17 }, { k: 'camera', x: 396, y: 156, w: 15, h: 17 }, { k: 'cameretta', x: 430, y: 156, w: 15, h: 17 }];
  function car(y, dir, dur, dly, col, K) {
    var body = rect(0, 0, 28, 8, col, 3) + poly('5,0 9,-6 20,-6 24,0', col) + rect(10, -5, 4, 4, 'rgba(255,255,255,.55)', 1) + rect(16, -5, 4, 4, 'rgba(255,255,255,.55)', 1) + circ(27, 3, 2.6, '#fff') + circ(1, 3, 2, '#ff3b4e') + circ(8, 8, 3, '#111') + circ(21, 8, 3, '#111');
    var glow = circ(30, 3, 14, A.rg([[0, '#fff', .55 * K.nt + .1], [1, '#fff', 0]])) + rect(-34, 1, 34, 4, A.lg([[0, '#ff3b4e', 0], [1, '#ff3b4e', .5 * K.nt + .15]], { x1: 0, y1: 0, x2: 1, y2: 0 }));
    var x0 = dir > 0 ? -60 : 700, x1 = dir > 0 ? 700 : -60;
    return '<g>' + at('translate', x0 + ' ' + y + ';' + x1 + ' ' + y, dur, 'begin="-' + dly + 's"') + '<g transform="scale(' + (dir > 0 ? 1 : -1) + ' 1)">' + glow + body + '</g></g>';
  }
  W.citta = { name: "Byen", icon: 'mdi-city-variant', desc: "Skyskrabere med vinduer, der tænder, biler, fly og neonskilte", windows: WIN_CITTA, draw: function (K, h, B) {
    var s = sky(K, B, { clouds: 2, stars: 34 }), rd = A.rnd(77), far = mix(K.hf, K.s3, .3), lit = K.nt * .72 + .05;
    var x = -10; while (x < 640) { var w = 24 + rd() * 20, hh = 44 + rd() * 66; s += rect(x, 222 - hh, w, hh + 20, far); x += w + 2 + rd() * 4; }
    var B2 = [[-14, 56, 112], [38, 62, 98], [96, 50, 152], [150, 62, 112], [216, 46, 134], [310, 58, 120], [360, 100, 178], [466, 56, 112], [526, 60, 144], [588, 62, 104]];
    var dark = mix(K.hn, '#000', .12);
    B2.forEach(function (b, bi) {
      var bx = b[0], bw = b[1], bh = b[2], top = 232 - bh;
      s += rect(bx, top, bw, bh + 4, dark) + rect(bx, top, bw, 3, mix(dark, K.s3, .25));
      var cols = Math.floor((bw - 8) / 11), rows = Math.floor((bh - 12) / 13);
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var wx = bx + 6 + c * 11, wy = top + 9 + r * 13, reserved = false;
        WIN_CITTA.forEach(function (w) { if (wx + 5 > w.x - 2 && wx < w.x + w.w + 2 && wy + 6 > w.y - 2 && wy < w.y + w.h + 2) reserved = true; });
        if (reserved) continue;
        var on = rd() < lit;
        s += rect(wx, wy, 5.5, 7, on ? K.win : mix(K.hn, K.s2, .2 + .2 * K.dy), 0.8, (on && rd() < .12) ? 'class="fl" style="animation-delay:-' + f(rd() * 3) + 's"' : (on ? '' : 'opacity=".75"'));
      }
      if (bi === 8) { // insegna neon
        s += rect(bx + 8, top - 26, 44, 20, '#12041f', 3) +
          '<rect x="' + (bx + 11) + '" y="' + (top - 23) + '" width="38" height="14" rx="2" fill="#FF3DA8" opacity="' + f(.35 + .6 * K.nt) + '">' + an('fill', '#FF3DA8;#22D3EE;#FF3DA8', 4) + '</rect>' +
          circ(bx + 30, top - 16, 22, A.rg([[0, '#FF3DA8', .5 * K.nt], [1, '#FF3DA8', 0]])) + rect(bx + 14, top - 6, 2, 6, '#555') + rect(bx + 44, top - 6, 2, 6, '#555');
      }
      if (bi === 2) s += rect(bx + 24, top - 18, 2, 18, '#666') + circA(bx + 25, top - 19, 2.4, '#ff3b4e', an('opacity', '1;.1;1', 1.4));
    });
    // torre
    s += poly('282,232 304,232 298,70 288,70', mix(K.hn, '#000', .2)) + rect(292, 40, 2, 34, '#777') + ell(293, 120, 18, 4, mix(K.hn, K.s3, .25)) + ell(293, 150, 14, 3.4, mix(K.hn, K.s3, .25)) +
      '<circle cx="293" cy="38" r="3" fill="#ff3b4e">' + an('opacity', '1;.1;1', 1.6) + '</circle>' + circ(293, 38, 14, A.rg([[0, '#ff3b4e', .6 * K.nt], [1, '#ff3b4e', 0]]));
    s += winDark(K, WIN_CITTA);
    // strada
    s += rect(0, 236, 640, 24, '#0b0e1c') + rect(0, 235, 640, 2, mix(K.hn, K.s3, .25));
    for (var d = 0; d < 14; d++) s += rect(d * 50 + 8, 247, 26, 2.4, 'rgba(255,255,255,.5)', 1);
    s += car(238, 1, 9, 2, '#E85D75', K) + car(250, -1, 13, 5, '#FBBF24', K) + car(238, 1, 17, 11, '#22D3EE', K);
    // aereo
    s += '<g opacity="' + f(.35 + .65 * K.nt) + '"><g>' + at('translate', '-30 44;680 24', 38, 'begin="-12s"') + ell(0, 0, 9, 2.4, '#d6dcf0') + poly('-2,0 -8,-6 -4,0', '#d6dcf0') + poly('0,0 6,5 2,0', '#aeb6d2') + circA(-9, 0, 1.6, '#ff3b4e', an('opacity', '1;0;1', 1)) + '</g></g>';
    return s;
  } };

  /* ============================================================ MONTAGNA */
  W.montagna = { name: "Bjerget", icon: 'mdi-image-filter-hdr', desc: "Snedækkede tinder, svævebane, hytte, nordlys og faldende sne", windows: [{ k: 'salotto', x: 484, y: 222, w: 10, h: 9 }, { k: 'cucina', x: 500, y: 222, w: 10, h: 9 }], draw: function (K, h, B) {
    var s = sky(K, B, { clouds: 2, stars: 44 });
    var snowc = mix('#ffffff', K.s3, .22 + .3 * K.nt);
    // aurora
    var au = K.nt * .8;
    if (au > .02) {
      var g1 = A.lg([[0, '#22FFA8', 0], [.5, '#22FFA8', .75], [1, '#8B5CF6', 0]]), g2 = A.lg([[0, '#22D3EE', 0], [.5, '#B07CFF', .6], [1, '#FF5CCB', 0]]);
      s += '<g opacity="' + f(au) + '" filter="url(#' + 'wmontagna_b14)">' +
        '<g>' + at('translate', '-24 0;24 8;-24 0', 11) + path('M-40 120 C 80 20 200 100 300 40 S 520 90 700 30 L700 100 C 520 150 400 80 300 110 S 80 150 -40 120Z', g1) + '</g>' +
        '<g>' + at('translate', '20 0;-20 6;20 0', 14) + path('M-40 150 C 120 70 240 120 340 70 S 540 110 700 60 L700 120 C 540 160 420 110 340 130 S 120 170 -40 150Z', g2, 'opacity=".8"') + '</g></g>';
    }
    // montagne
    s += poly('-10,206 60,134 108,172 170,88 242,182 300,122 372,192 440,98 520,172 584,132 650,182 650,262 -10,262', mix(K.hf, K.s3, .35));
    [[170, 88, 18, 26], [440, 98, 18, 26], [300, 122, 12, 18]].forEach(function (p) {
      s += poly(p[0] + ',' + p[1] + ' ' + (p[0] - p[2]) + ',' + (p[1] + p[3]) + ' ' + (p[0] - p[2] * .45) + ',' + (p[1] + p[3] - 6) + ' ' + (p[0] - p[2] * .1) + ',' + (p[1] + p[3] + 3) + ' ' + (p[0] + p[2] * .3) + ',' + (p[1] + p[3] - 5) + ' ' + (p[0] + p[2]) + ',' + (p[1] + p[3]), snowc);
    });
    s += poly('-10,236 80,170 150,216 230,160 320,226 420,174 520,224 600,180 650,214 650,262 -10,262', K.hf) + poly('230,160 214,182 224,178 232,188 244,176', snowc, 'opacity=".9"') + poly('420,174 404,194 414,190 424,200 438,188', snowc, 'opacity=".9"');
    // funivia
    s += line('M20 56 L610 128', mix(K.hn, '#000', .2), 1.6) + rect(330, 80, 3, 48, mix(K.hn, '#000', .3)) + poly('322,78 341,78 336,70 327,70', mix(K.hn, '#000', .3));
    s += '<g>' + '<animateMotion dur="16s" repeatCount="indefinite" path="M20 56 L610 128" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear"/>' + rect(-1, 0, 2, 12, mix(K.hn, '#000', .3)) + rect(-8, 12, 16, 11, '#E85D75', 2) + rect(-6, 14, 5, 5, mix('#FFE9B0', K.win, .5), 1) + rect(1, 14, 5, 5, mix('#FFE9B0', K.win, .5), 1) + '</g>';
    // foresta
    var rd = A.rnd(12), tc = mix(K.hn, '#06140f', .55);
    for (var i = 0; i < 30; i++) { var x = i * 22 + rd() * 10; if (x > 460 && x < 520) continue; s += pine(x, 244 + rd() * 6, 28 + rd() * 22, i % 2 ? tc : mix(tc, K.hn, .3), rd() * 4, snowc); }
    s += rect(-10, 244, 660, 20, mix('#ffffff', K.s3, .35 + .3 * K.nt));
    // baita
    s += rect(476, 214, 40, 28, mix('#7a4a2b', K.hn, .35 + .3 * K.nt)) + poly('470,216 496,198 522,216', mix('#3b2a22', K.hn, .3)) + rect(504, 200, 6, 12, mix('#3b2a22', K.hn, .3)) + poly('470,216 496,198 522,216 518,216 496,202 474,216', snowc) + rect(484, 222, 10, 9, mix('#0b1233', K.s2, K.dy * .5)) + rect(500, 222, 10, 9, mix('#0b1233', K.s2, K.dy * .5)) + smoke(507, 198, K.cloud);
    s += snow(16, 61, '#fff', 262);
    return s;
  } };

  /* ============================================================ MARE E FARO */
  function waves(y, col, op, dur, dir) {
    var d = 'M-160 ' + y; for (var i = 0; i < 12; i++) d += ' q20 -9 40 0 t40 0';
    d += ' V270 H-160Z';
    return '<g opacity="' + op + '"><g>' + at('translate', dir > 0 ? '0 0;80 0' : '0 0;-80 0', dur) + path(d, col) + '</g></g>';
  }
  W.mare = { name: "Hav og fyrtårn", icon: 'mdi-lighthouse', desc: "Rullende bølger, sejlbåd, måger, delfin og et fyrtårn, der drejer", windows: [], draw: function (K, h, B) {
    var s = sky(K, B, { clouds: 3 }), hz = 158;
    var sea1 = mix(mix(K.s2, '#0b3a6b', .55), K.s3, .2), sea2 = mix(mix(K.s1, '#06203f', .6), '#000', .1);
    s += rect(0, hz, 640, 110, A.lg([[0, sea1], [1, sea2]]));
    // riflesso di sole/luna
    [[B.sun, K.sun], [B.moon, '#DDE8FF']].forEach(function (p) {
      var b = p[0]; if (!b.vis || b.y > hz - 6) return;
      for (var i = 0; i < 9; i++) s += '<ellipse cx="' + f(b.x) + '" cy="' + (hz + 6 + i * 11) + '" rx="' + f(6 + i * 3) + '" ry="1.8" fill="' + p[1] + '" opacity="' + f(.55 - i * .045) + '">' + an('rx', f(6 + i * 3) + ';' + f(9 + i * 3.6) + ';' + f(6 + i * 3), 2.2 + i * .17) + an('opacity', f(.55 - i * .045) + ';' + f(.3 - i * .02) + ';' + f(.55 - i * .045), 2.2 + i * .17) + '</ellipse>';
    });
    s += rect(0, hz - 1, 640, 2, 'rgba(255,255,255,.18)');
    s += waves(176, mix(sea1, '#fff', .12), .35, 9, 1) + waves(198, mix(sea1, '#000', .1), .4, 6.5, -1) + waves(226, mix(sea2, '#000', .1), .55, 4.5, 1);
    // faro
    var fx = 540, lx = fx, ly = 128;
    s += poly('486,262 516,226 566,228 596,262', mix(K.hn, '#000', .3)) + poly('524,230 556,230 548,140 532,140', '#F4F6FF') + poly('528,205 552,205 550,188 530,188', '#E5484D') + poly('534,168 548,168 546,152 536,152', '#E5484D');
    s += rect(526, 134, 28, 6, mix(K.hn, '#000', .4), 1) + rect(532, 118, 16, 16, mix(K.hn, '#000', .35), 2) + poly('528,118 540,104 552,118', '#E5484D') + rect(534, 122, 12, 10, mix('#2a3350', K.win, K.nt), 1);
    var nl = K.nt;
    if (nl > .05) {
      var beam = A.lg([[0, '#FFF3C4', .85 * nl], [1, '#FFF3C4', 0]], { x1: 0, y1: 0, x2: 1, y2: 0 });
      s += circ(lx, 127, 26, A.rg([[0, '#FFF3C4', .9 * nl], [1, '#FFF3C4', 0]]));
      s += '<g transform="translate(' + lx + ' 127)"><g>' + at('scale', '1 1;.87 1;.5 1;.04 1;-.5 1;-.87 1;-1 1;-.87 1;-.5 1;-.04 1;.5 1;.87 1;1 1', 9) +
        poly('0,-5 -330,-26 -330,26 0,5', A.lg([[0, '#FFF3C4', .85 * nl], [1, '#FFF3C4', 0]], { x1: 1, y1: 0, x2: 0, y2: 0 })) + poly('0,-5 330,-26 330,26 0,5', A.lg([[0, '#FFF3C4', .85 * nl], [1, '#FFF3C4', 0]], { x1: 0, y1: 0, x2: 1, y2: 0 })) + '</g></g>';
    }
    // barca
    s += '<g><g>' + at('translate', '0 0;0 -3;0 0', 3.4) + '<g>' + at('rotate', '-3 200 214;3 200 214;-3 200 214', 4.2) +
      poly('170,214 230,214 220,230 180,230', '#8E5A33') + rect(170, 211, 60, 4, '#E9C46A') + rect(199, 150, 3, 62, '#C9CCDD') + poly('201,152 201,206 238,206', '#FFFFFF') + poly('199,160 199,206 172,206', '#FFE3C4') + poly('201,150 214,154 201,158', '#E5484D') + '</g></g></g>';
    // delfino
    s += '<g opacity="' + f(K.dy) + '"><g><animateMotion dur="11s" begin="-3s" repeatCount="indefinite" rotate="auto" path="M60 214 Q130 120 220 216" keyTimes="0;1" keyPoints="0;1" calcMode="linear"/>' +
      path('M-18 0 Q-6 -10 10 -4 Q18 -2 22 -5 Q20 2 14 3 Q4 8 -18 0Z', '#5B8FB9') + poly('-4,-7 2,-16 4,-6', '#4A7BA0') + poly('-18,0 -26,-6 -24,3', '#4A7BA0') + circ(14, -3, 1.2, '#fff') + '</g></g>';
    s += bird(70, 40, 5, 1, '#fff') + bird(96, 52, 30, .8, '#fff') + bird(54, 62, 14, .7, '#fff');
    return s;
  } };

  /* ============================================================ FORESTA MAGICA */
  W.foresta = { name: "Trylleskoven", icon: 'mdi-pine-tree', desc: "Solstråler om dagen, ildfluer, selvlysende svampe og en ugle om natten", windows: [], draw: function (K, h, B) {
    var s = sky(K, B, { clouds: 1, stars: 36 }), rd = A.rnd(33), nl = K.nt, dl = K.dy;
    var far = mix(K.hf, K.s3, .25), mid = mix(K.hn, '#0b2a1c', .35), nea = mix(K.hn, '#04120c', .6);
    // raggi di sole
    if (dl > .1) {
      var ray = A.lg([[0, K.sun, .6], [1, K.sun, 0]]), rs = '';
      [90, 160, 240, 330].forEach(function (x, i) { rs += '<g>' + an('opacity', '.35;.8;.35', 5 + i, 'begin="-' + i + 's"') + poly(x + ',-10 ' + (x + 26) + ',-10 ' + (x + 120) + ',260 ' + (x + 54) + ',260', ray) + '</g>'; });
      s += '<g opacity="' + f(dl * .65) + '">' + rs + '</g>';
    }
    // alberi lontani e medi
    s += path('M-10 200 Q80 170 170 196 T340 190 T520 194 T650 188 V262 H-10Z', far);
    for (var i = 0; i < 16; i++) s += pine(i * 42 + rd() * 14, 206, 52 + rd() * 36, far, rd() * 4);
    s += path('M-10 226 Q100 204 220 222 T440 220 T650 214 V262 H-10Z', mid);
    for (var j = 0; j < 12; j++) { var x = j * 56 + rd() * 20; s += pine(x, 232, 70 + rd() * 44, mid, rd() * 4); }
    // nebbia
    [[120, 214, 120], [380, 222, 150], [560, 212, 110]].forEach(function (m, i) {
      s += '<g opacity="' + f(.22 + .12 * nl) + '" filter="url(#wforesta_b14)"><g>' + at('translate', '-34 0;34 0;-34 0', 14 + i * 3) + ell(m[0], m[1], m[2], 14, mix('#ffffff', K.s3, .3)) + '</g></g>';
    });
    // stagno
    s += ell(300, 246, 88, 12, mix(K.s2, '#0b1d2a', .45)) + ell(300, 246, 88, 12, 'rgba(255,255,255,.08)');
    var refl = B.moon.vis ? '#DDE8FF' : K.sun;
    s += ellA(310, 246, 16 + 8 * dl, 4, refl, an('rx', '14;22;14', 3.6), 'opacity="' + f(.3 + .3 * nl) + '"');
    ['0', '-1.4'].forEach(function (b) { s += '<ellipse cx="270" cy="248" rx="4" ry="1.2" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1">' + an('rx', '4;30', 2.8, 'begin="' + b + 's"') + an('ry', '1.2;6', 2.8, 'begin="' + b + 's"') + an('opacity', '.8;0', 2.8, 'begin="' + b + 's"') + '</ellipse>'; });
    // terreno scuro
    s += path('M-10 250 Q120 236 300 252 T650 244 V262 H-10Z', nea);
    // funghi
    [[70, 248, 1, '#FF7AC8'], [118, 252, .7, '#22D3EE'], [468, 250, 1.1, '#FF7AC8'], [520, 254, .8, '#B07CFF'], [572, 248, .9, '#22D3EE']].forEach(function (m, i) {
      var gl = .25 + .65 * nl;
      s += '<g opacity="' + f(gl) + '">' + circ(m[0], m[1] - 10 * m[2], 30 * m[2], A.rg([[0, m[3], .7], [1, m[3], 0]])) + '</g>' + rect(m[0] - 2.4 * m[2], m[1] - 10 * m[2], 4.8 * m[2], 10 * m[2], '#EDE7F6', 1.5) + path('M' + f(m[0] - 11 * m[2]) + ' ' + f(m[1] - 9 * m[2]) + ' Q' + m[0] + ' ' + f(m[1] - 28 * m[2]) + ' ' + f(m[0] + 11 * m[2]) + ' ' + f(m[1] - 9 * m[2]) + 'Z', m[3]) + circ(m[0] - 3 * m[2], m[1] - 16 * m[2], 1.6 * m[2], 'rgba(255,255,255,.7)') + circ(m[0] + 4 * m[2], m[1] - 14 * m[2], 1.2 * m[2], 'rgba(255,255,255,.7)');
    });
    // gufo su un ramo
    s += path('M470 118 Q520 112 600 122 L600 128 Q520 120 470 124Z', '#3a2a22') + ell(552, 100, 11, 15, '#7A5A44') + poly('544,88 542,78 550,86', '#7A5A44') + poly('560,88 562,78 554,86', '#7A5A44') + ell(552, 105, 7, 9, '#C9A98A') +
      '<g>' + circ(548, 96, 4.6, '#FFE29A') + circ(556, 96, 4.6, '#FFE29A') + '<ellipse cx="548" cy="96" rx="4.6" ry="4.6" fill="#1b1330">' + an('ry', '0.1;0.1;4.6;4.6;4.6', 5.4, 'keyTimes="0;.03;.06;.3;1"') + '</ellipse><ellipse cx="556" cy="96" rx="4.6" ry="4.6" fill="#1b1330">' + an('ry', '0.1;0.1;4.6;4.6;4.6', 5.4, 'keyTimes="0;.03;.06;.3;1"') + '</ellipse>' + circ(548, 96, 1.8, '#1b1330') + circ(556, 96, 1.8, '#1b1330') + poly('552,98 550,101 554,101', '#E9B44C') + '</g>' + circ(552, 96, 26, A.rg([[0, '#FFE29A', .35 * nl], [1, '#FFE29A', 0]]));
    // lucciole
    var ff = '';
    for (var k = 0; k < 26; k++) {
      var fx = 30 + rd() * 580, fy = 120 + rd() * 120, d = 6 + rd() * 6, dx = (rd() - .5) * 60, dy = (rd() - .5) * 36;
      ff += '<g>' + at('translate', '0 0;' + f(dx) + ' ' + f(dy) + ';' + f(-dx * .5) + ' ' + f(dy * .6) + ';0 0', d, 'begin="-' + f(rd() * d) + 's"') + circ(fx, fy, 9, A.rg([[0, '#FFF59A', .8], [1, '#FFF59A', 0]])) + '<circle cx="' + f(fx) + '" cy="' + f(fy) + '" r="1.6" fill="#FFFBD0">' + an('opacity', '1;.15;1', 1.6 + rd() * 2, 'begin="-' + f(rd() * 3) + 's"') + '</circle></g>';
    }
    s += '<g opacity="' + f(nl * .95) + '">' + ff + '</g>';
    return s;
  } };
})();


/* ---- mondi-b.js ---- */
/* AURORA GLASS v3 — MONDI (2/2): Spazio · Giappone · Cyberpunk · Natale · Oceano */
(function () {
  var A = AR, W = AMB.W, H = AMB.H, f = A.f, mix = H.mix;
  var poly = H.poly, path = H.path, rect = H.rect, circ = H.circ, ell = H.ell, line = H.line, grp = H.grp, an = H.an, at = H.at, circA = H.circA, ellA = H.ellA,
      sky = H.sky, bird = H.bird, smoke = H.smoke, snow = H.snow, pine = H.pine;
  function winDark(K, ws) { var c = mix('#0b1233', K.s2, K.dy * .55), s = ''; ws.forEach(function (w) { s += rect(w.x, w.y, w.w, w.h, c, 3, 'opacity=".85"'); }); return s; }

  /* ============================================================ SPAZIO */
  W.spazio = { name: "Rummet", icon: 'mdi-rocket-launch', desc: "Stjernetåger, planet med ringe, svævende astronaut, stjerneskud, satellit og UFO", windows: [], draw: function (K, h, B) {
    var s = rect(0, 0, 640, 260, A.lg([[0, mix('#04010d', K.s1, .45)], [1, mix('#0a0730', K.s2, .5)]]));
    var neb = [[120, 90, 190, 70, K.b1, 18], [420, 60, 200, 60, K.b2, 23], [300, 200, 230, 50, K.b3, 29]];
    neb.forEach(function (n, i) { s += '<g opacity=".5" filter="url(#wspazio_b14)"><g>' + at('translate', '-18 0;18 10;-18 0', n[5]) + ell(n[0], n[1], n[2], n[3], n[4]) + '</g></g>'; });
    s += H.stars(K, { n: 80, seed: 9, ymax: 260, min: 1 });
    // pianeta con anelli
    var px = 520, py = 168;
    s += '<g>' + at('translate', '0 0;-6 5;0 0', 14) + '<g transform="rotate(-16 ' + px + ' ' + py + ')">' + '<ellipse cx="' + px + '" cy="' + py + '" rx="112" ry="22" fill="none" stroke="' + mix(K.b1, '#ffffff', .4) + '" stroke-width="8" opacity=".55"/>' + '<ellipse cx="' + px + '" cy="' + py + '" rx="94" ry="18" fill="none" stroke="' + mix(K.b3, '#ffffff', .3) + '" stroke-width="3" opacity=".5"/></g>';
    var pg = A.lg([[0, mix(K.b2, '#ffffff', .25)], [.5, mix(K.b1, '#2a1a6a', .3)], [1, mix(K.b1, '#0b0630', .7)]], { x1: 0, y1: 0, x2: .7, y2: 1 }), pcid = A.uid('pc');
    s += '<clipPath id="' + pcid + '"><circle cx="' + px + '" cy="' + py + '" r="62"/></clipPath><g clip-path="url(#' + pcid + ')">' + circ(px, py, 62, pg);
    [-34, -14, 8, 30].forEach(function (dy, i) { s += rect(px - 70, py + dy, 140, 7 + i * 2, 'rgba(255,255,255,' + (.14 + i * .03) + ')'); });
    s += circ(px - 24, py - 24, 70, A.rg([[0, '#fff', .3], [1, '#fff', 0]])) + '</g>' + circ(px, py, 62, 'none', 'stroke="rgba(255,255,255,.2)" stroke-width="1.5"');
    s += '<g transform="rotate(-16 ' + px + ' ' + py + ')"><path d="M' + (px - 112) + ' ' + py + ' A112 22 0 0 0 ' + (px + 112) + ' ' + py + '" fill="none" stroke="' + mix(K.b1, '#ffffff', .4) + '" stroke-width="8" opacity=".75"/><path d="M' + (px - 94) + ' ' + py + ' A94 18 0 0 0 ' + (px + 94) + ' ' + py + '" fill="none" stroke="' + mix(K.b3, '#ffffff', .3) + '" stroke-width="3" opacity=".7"/></g></g>';
    // lune
    s += circ(110, 56, 20, A.lg([[0, '#EEF0FF'], [1, '#8E93C6']], { x1: 0, y1: 0, x2: 1, y2: 1 })) + circ(103, 50, 4, 'rgba(60,60,110,.35)') + circ(116, 63, 5, 'rgba(60,60,110,.3)') + circ(116, 48, 2.6, 'rgba(60,60,110,.3)');
    s += circ(52, 196, 14, A.lg([[0, '#FF9A7A'], [1, '#B8402E']], { x1: 0, y1: 0, x2: 1, y2: 1 })) + circ(48, 192, 3, 'rgba(120,30,20,.4)');
    // astronauta
    var astro = path('M-6 -4 Q-30 -22 -52 -46', 'none', 'stroke="#C9CEDB" stroke-width="2.4" stroke-linecap="round" opacity=".7"') +
      rect(-17, -9, 8, 22, '#C9CEDB', 3) + rect(-12, -10, 24, 28, '#F4F6FF', 8) + rect(-12, 8, 24, 5, '#E5484D') + rect(6, -2, 11, 5, '#F4F6FF', 3) + grp(rect(-20, -2, 11, 5, '#F4F6FF', 3), 'rotate(18 -9 0)') +
      grp(rect(-11, 16, 8, 18, '#F4F6FF', 4) + rect(-12, 30, 10, 5, '#98A3B8', 2), 'rotate(8 -7 16)') + grp(rect(3, 16, 8, 18, '#F4F6FF', 4) + rect(2, 30, 10, 5, '#98A3B8', 2), 'rotate(-12 7 16)') +
      circ(0, -22, 15, '#F4F6FF') + ell(0, -22, 11.5, 10, A.lg([[0, '#1d2a5c'], [1, '#6b8cff']], { x1: 0, y1: 0, x2: 1, y2: 1 })) + ell(-4, -26, 4, 2.6, 'rgba(255,255,255,.55)') + circ(0, -22, 15, 'none', 'stroke="#C9CEDB" stroke-width="1.4"') + rect(-4, -3, 8, 5, '#C9CEDB', 2);
    s += '<g transform="translate(330 124)"><g>' + at('translate', '0 0;5 -9;0 0', 6.5) + '<g>' + at('rotate', '-9 0 0;9 0 0;-9 0 0', 9) + astro + '</g></g></g>';
    // stelle cadenti
    [[560, 14, 9, 0], [440, 20, 13, -4]].forEach(function (m, i) {
      s += '<g opacity="0">' + an('opacity', '0;1;0;0', m[2], 'keyTimes="0;.02;.11;1" begin="' + m[3] + 's"') + at('translate', m[0] + ' ' + m[1] + ';' + (m[0] - 250) + ' ' + (m[1] + 150) + ';' + (m[0] - 250) + ' ' + (m[1] + 150), m[2], 'keyTimes="0;.11;1" begin="' + m[3] + 's"') +
        '<line x1="0" y1="0" x2="60" y2="-36" stroke="' + A.lg([[0, '#fff', 1], [1, '#fff', 0]], { x1: 0, y1: 0, x2: 1, y2: 0, }) + '" stroke-width="2.4" stroke-linecap="round"/>' + circ(0, 0, 2.6, '#fff') + '</g>';
    });
    // satellite
    s += '<g>' + at('translate', '-40 70;700 36', 38, 'begin="-14s"') + rect(-5, -3, 10, 6, '#C9CEDB', 1) + rect(-22, -2, 15, 5, '#4F7BFF', 1) + rect(7, -2, 15, 5, '#4F7BFF', 1) + rect(-1, -7, 2, 4, '#98A3B8') + circA(0, -8, 1.6, '#ff3b4e', an('opacity', '1;0;1', 1.2)) + '</g>';
    // UFO
    s += '<g>' + at('translate', '-60 44;190 28;410 58;700 34', 46, 'begin="-30s"') + ell(0, 0, 17, 5, A.lg([[0, '#D6DAEA'], [1, '#7C84A6']])) + path('M-8 -2 Q0 -14 8 -2Z', 'rgba(140,255,200,.7)') + circA(-9, 1.4, 1.5, '#FFE29A', an('opacity', '1;.2;1', .9)) + circA(0, 2, 1.5, '#FF7AC8', an('opacity', '.2;1;.2', .9)) + circA(9, 1.4, 1.5, '#7FD6FF', an('opacity', '1;.2;1', .9, 'begin="-.4s"')) + '</g>';
    return s;
  } };

  /* ============================================================ GIAPPONE */
  W.giappone = { name: "Japan", icon: 'mdi-temple-buddhist', desc: "Fuji-bjerget, torii, pagode, kirsebærtræ med faldende blomsterblade og lanterner", windows: [], draw: function (K, h, B) {
    var s = sky(K, B, { clouds: 2, stars: 40 }), nl = K.nt, rd = A.rnd(58);
    var red = mix('#D6362D', K.hn, .35 * nl + .08), dark = mix(K.hn, '#000', .28);
    // fuji
    s += path('M110 226 Q214 196 258 108 Q290 58 322 108 Q368 196 470 226Z', mix(K.hf, K.s3, .4)) + path('M256 116 Q290 56 324 116 L312 108 L302 124 L292 108 L282 126 L270 110Z', mix('#ffffff', K.s3, .15 + .3 * nl));
    s += '<g opacity="' + f(.45) + '" filter="url(#wgiappone_b14)"><g>' + at('translate', '-30 0;30 0;-30 0', 16) + ell(300, 168, 130, 10, mix('#ffffff', K.s3, .4)) + '</g></g>';
    s += path('M-10 200 Q100 172 220 200 T450 196 T650 200 V262 H-10Z', K.hf) + path('M-10 232 Q150 208 300 228 T650 220 V262 H-10Z', K.hn);
    // pagoda
    var px = 540, wt = '';
    for (var i = 0; i < 5; i++) {
      var yb = 226 - i * 30, w = 78 - i * 11;
      s += rect(px - (w - 20) / 2, yb - 26, w - 20, 22, dark) + poly(f(px - w / 2 - 8) + ',' + (yb - 25) + ' ' + f(px + w / 2 + 8) + ',' + (yb - 25) + ' ' + f(px + w / 2 - 4) + ',' + (yb - 36) + ' ' + f(px - w / 2 + 4) + ',' + (yb - 36), mix(dark, '#000', .25)) + path('M' + f(px - w / 2 - 8) + ' ' + (yb - 25) + ' q-6 -2 -9 -8 q6 2 9 4Z', mix(dark, '#000', .25)) + path('M' + f(px + w / 2 + 8) + ' ' + (yb - 25) + ' q6 -2 9 -8 q-6 2 -9 4Z', mix(dark, '#000', .25));
      wt += rect(px - 4, yb - 22, 8, 12, K.win, 1, 'opacity="' + f(.15 + .85 * nl) + '"');
    }
    s += wt + rect(px - 1.6, 226 - 4 * 30 - 62, 3.2, 28, dark) + circ(px, 226 - 4 * 30 - 62, 3, '#E9C46A');
    // torii
    var tx = 150;
    s += rect(tx - 36, 150, 9, 82, red) + rect(tx + 27, 150, 9, 82, red) + path('M' + (tx - 56) + ' 152 Q' + tx + ' 138 ' + (tx + 56) + ' 152 L' + (tx + 54) + ' 162 Q' + tx + ' 150 ' + (tx - 54) + ' 162Z', mix(red, '#000', .25)) + rect(tx - 46, 170, 92, 7, red) + rect(tx - 4, 160, 8, 12, red);
    [[tx - 20, 0], [tx, .6], [tx + 20, 1.2]].forEach(function (l) {
      s += '<g>' + at('rotate', '-5 ' + l[0] + ' 177;5 ' + l[0] + ' 177;-5 ' + l[0] + ' 177', 3.4, 'begin="-' + l[1] + 's"') + rect(l[0] - .6, 177, 1.2, 8, '#222') + circ(l[0], 196, 22, A.rg([[0, '#FF8A4D', .75 * nl], [1, '#FF8A4D', 0]])) + ell(l[0], 193, 6, 8, '#E5484D') + rect(l[0] - 4, 185, 8, 2, '#3a1d1d') + rect(l[0] - 4, 199, 8, 2, '#3a1d1d') + '</g>';
    });
    // ciliegio
    var cc = mix('#F9A8C9', K.hn, .5 * nl);
    s += path('M52 238 C 44 204 60 184 40 142 M48 196 C 62 188 74 170 90 168', 'none', 'stroke="' + mix('#6b4a3a', K.hn, .4) + '" stroke-width="9" stroke-linecap="round"');
    for (var c = 0; c < 22; c++) s += circ(20 + rd() * 110, 100 + rd() * 62, 16 + rd() * 16, rd() > .5 ? cc : mix(cc, '#ffffff', .25), 'opacity="' + f(.75 + rd() * .2) + '"');
    for (var p = 0; p < 26; p++) {
      var x0 = 10 + rd() * 130, y0 = 110 + rd() * 50, d = 6 + rd() * 6, dx = 50 + rd() * 120;
      s += '<g>' + at('translate', f(x0) + ' ' + f(y0) + ';' + f(x0 + dx) + ' 258', d, 'begin="-' + f(rd() * d) + 's"') + '<g>' + at('rotate', '0;360', 2 + rd() * 3) + ell(0, 0, 3, 1.7, mix('#FFC1D8', K.hn, .35 * nl), 'opacity=".95"') + '</g></g>';
    }
    return s;
  } };

  /* ============================================================ CYBERPUNK */
  function fcar(y, dir, dur, dly, col) {
    var x0 = dir > 0 ? -60 : 700, x1 = dir > 0 ? 700 : -60;
    return '<g>' + at('translate', x0 + ' ' + y + ';' + x1 + ' ' + (y + 6), dur, 'begin="-' + dly + 's"') + '<g transform="scale(' + dir + ' 1)">' + rect(-44, -1, 44, 2.6, A.lg([[0, col, 0], [1, col, .85]], { x1: 0, y1: 0, x2: 1, y2: 0 })) + ell(0, 0, 11, 3.6, '#20243a') + ell(2, -2.2, 5, 2.6, col, 'opacity=".9"') + circ(10, 0, 7, A.rg([[0, '#fff', .8], [1, col, 0]])) + '</g></g>';
  }
  W.cyberpunk = { name: 'Cyberpunk', icon: 'mdi-robot-industrial', desc: "Neonby i regnvejr: blinkende skilte, flyvende biler og hologram", windows: [], draw: function (K, h, B) {
    var nl = K.nt, rd = A.rnd(91);
    var s = rect(0, 0, 640, 260, A.lg([[0, mix(K.s1, '#2a0a4a', .55)], [.6, mix(K.s2, '#8a1d6a', .3 + .25 * nl)], [1, mix(K.s3, '#ff5aa8', .25 + .3 * nl)]]));
    s += H.stars(K, { n: 24, seed: 3, ymax: 90 }) + H.sunmoon(K, B) + H.cloud(0, 60, 1, 'c1', K);
    var far = mix('#2a0a4a', K.s2, .45);
    for (var i = 0; i < 18; i++) {
      var x = i * 38 + rd() * 10, w = 26 + rd() * 22, hh = 80 + rd() * 100;
      s += rect(x, 232 - hh, w, hh, far) + '<line x1="' + f(x + 6) + '" y1="' + f(232 - hh + 8) + '" x2="' + f(x + 6) + '" y2="228" stroke="' + (i % 2 ? '#22D3EE' : '#FF3DA8') + '" stroke-width="2" stroke-dasharray="2 5" opacity="' + f(.15 + .65 * nl) + '"/><line x1="' + f(x + w - 7) + '" y1="' + f(232 - hh + 14) + '" x2="' + f(x + w - 7) + '" y2="228" stroke="#FFD27A" stroke-width="2" stroke-dasharray="2 6" opacity="' + f(.1 + .5 * nl) + '"/>';
    }
    // ologramma
    s += '<g transform="translate(330 70)" opacity="' + f(.35 + .6 * nl) + '"><g>' + at('scale', '1 1;.05 1;-1 1;.05 1;1 1', 6) + poly('0,-34 22,0 0,34 -22,0', 'rgba(34,211,238,.18)', 'stroke="#22D3EE" stroke-width="1.6"') + poly('0,-34 0,34', 'none', 'stroke="#22D3EE" stroke-width="1"') + ell(0, 0, 22, 6, 'none', 'stroke="#FF3DA8" stroke-width="1.2"') + '</g>' + circ(0, 0, 42, A.rg([[0, '#22D3EE', .35], [1, '#22D3EE', 0]])) + '</g>';
    // torri
    var T = [[-6, 70, 150, '#FF3DA8'], [78, 54, 124, '#22D3EE'], [150, 66, 176, '#FF3DA8'], [296, 70, 150, '#22D3EE'], [380, 58, 120, '#FF3DA8'], [452, 70, 170, '#22D3EE'], [540, 66, 134, '#FF3DA8'], [598, 60, 152, '#22D3EE']];
    T.forEach(function (t, i) {
      var top = 238 - t[2], body = mix('#150626', K.s1, .3);
      s += rect(t[0], top, t[1], t[2] + 4, body) + rect(t[0], top, 2.4, t[2], t[3], 0, 'opacity="' + f(.35 + .6 * nl) + '"') + rect(t[0] + t[1] - 2.4, top, 2.4, t[2], t[3], 0, 'opacity="' + f(.2 + .5 * nl) + '"') + rect(t[0] - 1, top - 2, t[1] + 2, 3, t[3], 0, 'opacity="' + f(.4 + .6 * nl) + '"');
      for (var r = 0; r < Math.floor(t[2] / 16); r++) for (var c = 0; c < Math.floor((t[1] - 12) / 11); c++) if (rd() < .22 + .5 * nl) s += rect(t[0] + 7 + c * 11, top + 9 + r * 16, 5, 6, rd() > .5 ? '#FFD27A' : (rd() > .5 ? '#22D3EE' : '#FF7AC8'), 0.8, 'opacity=".85"');
      if (i % 2 === 0) s += '<g class="' + (i % 4 === 0 ? 'fl' : 'pu') + '" style="animation-delay:-' + f(rd() * 3) + 's">' + rect(t[0] + t[1] / 2 - 4, top + 24, 8, 54, t[3], 2, 'opacity="' + f(.3 + .7 * nl) + '"') + rect(t[0] + t[1] / 2 - 4, top + 24, 8, 54, 'none', 2, 'stroke="#fff" stroke-width="1" opacity="' + f(.6 * nl) + '"') + circ(t[0] + t[1] / 2, top + 50, 24, A.rg([[0, t[3], .5 * nl], [1, t[3], 0]])) + '</g>';
      if (i % 3 === 1) s += rect(t[0] + t[1] / 2 - 1, top - 20, 2, 18, '#777') + circA(t[0] + t[1] / 2, top - 21, 2.2, '#ff3b4e', an('opacity', '1;.1;1', 1.3));
    });
    // auto volanti
    s += fcar(52, 1, 9, 1, '#FF3DA8') + fcar(92, -1, 13, 6, '#22D3EE') + fcar(130, 1, 17, 12, '#FFD27A');
    // strada bagnata
    s += rect(0, 238, 640, 24, '#0a0414') + rect(0, 238, 640, 2, '#FF3DA8', 0, 'opacity="' + f(.3 + .5 * nl) + '"');
    [[60, '#FF3DA8'], [190, '#22D3EE'], [330, '#FF3DA8'], [470, '#22D3EE'], [580, '#FF3DA8']].forEach(function (r, i) { s += '<g opacity="' + f(.2 + .5 * nl) + '" filter="url(#wcyberpunk_b8)">' + ell(r[0], 250, 38, 4, r[1], 'class="pu" style="animation-delay:-' + i * .6 + 's"') + '</g>'; });
    [[120, 248, 0], [260, 252, -1], [410, 247, -2], [540, 251, -.5]].forEach(function (r) { s += '<ellipse cx="' + r[0] + '" cy="' + r[1] + '" rx="2" ry=".6" fill="none" stroke="rgba(200,230,255,.7)" stroke-width="1">' + an('rx', '2;18', 1.8, 'begin="' + r[2] + 's"') + an('ry', '.6;4', 1.8, 'begin="' + r[2] + 's"') + an('opacity', '.9;0', 1.8, 'begin="' + r[2] + 's"') + '</ellipse>'; });
    // pioggia
    for (var q = 0; q < 46; q++) {
      var rx = rd() * 700 - 30, d = .8 + rd() * .5;
      s += '<g opacity="' + f(.35 + .3 * rd()) + '">' + at('translate', f(rx) + ' -20;' + f(rx - 50) + ' 270', d, 'begin="-' + f(rd() * d) + 's"') + '<line x1="0" y1="0" x2="-4" y2="13" stroke="#BFE0FF" stroke-width="1.1" stroke-linecap="round"/></g>';
    }
    return s;
  } };

  /* ============================================================ NATALE */
  W.natale = { name: "Jul", icon: 'mdi-pine-tree-variant', desc: "Snedækket hus med kulørte lys, juletræ, snemand og julemandens kane", windows: [{ k: 'camera', x: 398, y: 162, w: 28, h: 20 }, { k: 'cameretta', x: 494, y: 162, w: 28, h: 20 }, { k: 'salotto', x: 398, y: 196, w: 34, h: 22 }, { k: 'cucina', x: 488, y: 196, w: 34, h: 22 }, { k: 'ingresso', x: 447, y: 190, w: 26, h: 36 }], draw: function (K, h, B) {
    var s = sky(K, B, { clouds: 2, stars: 44 }), nl = K.nt;
    var sn1 = mix('#ffffff', K.s3, .3 + .3 * nl), sn2 = mix('#ffffff', K.s2, .38 + .3 * nl), dark = mix(K.hn, '#000', .3), roof = mix(K.hn, '#000', .4);
    s += path('M-10 192 Q90 150 190 180 T380 166 T650 182 V262 H-10Z', sn1) + path('M-10 234 Q120 206 270 224 T650 216 V262 H-10Z', sn2);
    // slitta
    s += '<g>' + at('translate', '-150 70;780 40', 32, 'begin="-10s"') + '<g>' + at('translate', '0 0;0 -8;0 0', 3) + '<g transform="scale(.9)">' +
      path('M-90 6 q8 -14 24 -10 l-4 8z', '#8E5A33') + ell(-56, 0, 12, 6, '#A86D3F') + circ(-44, -6, 5, '#A86D3F') + circ(-40, -10, 1.4, '#222') + path('M-44 -10 l-3 -10 m3 6 l5 -9', 'none', 'stroke="#6B4423" stroke-width="1.6" stroke-linecap="round"') + circA(-39, -5, 1.8, '#ff3b4e', an('opacity', '1;.3;1', .8)) + path('M-30 0 h20', 'none', 'stroke="#c9a06a" stroke-width="1"') +
      ell(-14, 0, 12, 6, '#A86D3F') + circ(-2, -6, 5, '#A86D3F') + path('M-2 -10 l-3 -10 m3 6 l5 -9', 'none', 'stroke="#6B4423" stroke-width="1.6" stroke-linecap="round"') +
      path('M2 4 Q10 -2 18 4 L32 4 Q34 16 22 16 L4 16Z', '#E5484D') + path('M0 16 Q20 22 36 14', 'none', 'stroke="#E9C46A" stroke-width="2.4" stroke-linecap="round"') + ell(12, -6, 7, 8, '#E5484D') + circ(12, -14, 4, '#FBD3B5') + poly('8,-16 12,-24 16,-16', '#E5484D') + rect(20, -4, 12, 8, '#2a8f5b', 2) + '</g></g>' +
      circ(-110, 6, 34, A.rg([[0, '#FFE29A', .5], [1, '#FFE29A', 0]])) + '</g>';
    // alberi
    s += pine(300, 226, 46, dark, 1, '#fff') + pine(336, 228, 34, dark, 2, '#fff') + pine(16, 232, 56, dark, 0, '#fff') + pine(54, 234, 40, dark, 3, '#fff');
    // casa con neve
    s += rect(441, 104, 16, 30, roof) + poly('366,154 460,98 554,154', roof) + rect(380, 150, 160, 76, mix(K.hn, '#5a3a40', .35), 2) + poly('362,157 460,96 558,157 548,157 460,106 372,157', '#fff', 'opacity=".95"') + rect(439, 98, 20, 6, '#fff') + winDark(K, [{ x: 398, y: 162, w: 28, h: 20 }, { x: 494, y: 162, w: 28, h: 20 }, { x: 398, y: 196, w: 34, h: 22 }, { x: 488, y: 196, w: 34, h: 22 }, { x: 447, y: 190, w: 26, h: 36 }]) + poly('447,226 473,226 502,260 418,260', 'rgba(255,255,255,.12)') + smoke(449, 96, K.cloud);
    // luci sul tetto
    var cols = ['#FF4D4D', '#FFD93D', '#4DD2FF', '#7CFF6B'], k = 0;
    for (var t = 0; t <= 1.001; t += 1 / 8) { [[366, 154, 460, 98], [460, 98, 554, 154]].forEach(function (sg, si) { if (si === 1 && t === 0) return; var x = sg[0] + (sg[2] - sg[0]) * t, y = sg[1] + (sg[3] - sg[1]) * t + 3; var c = cols[(k++) % 4]; s += circA(x, y, 3, c, an('opacity', '1;.25;1', 1.6, 'begin="-' + f((k % 4) * .4) + 's"')) + circ(x, y, 9, A.rg([[0, c, .5], [1, c, 0]])); }); }
    // albero di Natale
    var gx = 592, gy = 228;
    s += rect(gx - 4, gy - 10, 8, 12, '#6B4423') + poly(gx + ',' + (gy - 74) + ' ' + (gx - 20) + ',' + (gy - 40) + ' ' + (gx + 20) + ',' + (gy - 40), '#1f7a4d') + poly(gx + ',' + (gy - 58) + ' ' + (gx - 26) + ',' + (gy - 22) + ' ' + (gx + 26) + ',' + (gy - 22), '#26925a') + poly(gx + ',' + (gy - 40) + ' ' + (gx - 32) + ',' + (gy - 8) + ' ' + (gx + 32) + ',' + (gy - 8), '#2fae6a');
    [[-8, -50, '#FF4D4D'], [10, -36, '#FFD93D'], [-16, -22, '#4DD2FF'], [14, -16, '#FF7AC8'], [0, -28, '#FFD93D']].forEach(function (b, i) { s += circA(gx + b[0], gy + b[1], 3.2, b[2], an('opacity', '1;.4;1', 1.8, 'begin="-' + i * .3 + 's"')); });
    s += '<g transform="translate(' + gx + ' ' + (gy - 78) + ')"><g>' + at('scale', '1 1;1.25 1.25;1 1', 1.6) + '<path d="M0 -8 L2.4 -2 L8.4 -2 L3.6 1.8 L5.4 8 L0 4.4 L-5.4 8 L-3.6 1.8 L-8.4 -2 L-2.4 -2Z" fill="#FFE066"/>' + circ(0, 0, 16, A.rg([[0, '#FFE066', .8], [1, '#FFE066', 0]])) + '</g></g>';
    // pupazzo
    var mx = 250, my = 232;
    s += ell(mx, my + 1, 24, 4, 'rgba(0,0,0,.2)') + circ(mx, my - 14, 16, '#fff') + circ(mx, my - 38, 12, '#fff') + circ(mx, my - 56, 9, '#fff') + rect(mx - 9, my - 66, 18, 3, '#222') + rect(mx - 6, my - 78, 12, 13, '#222', 1) + circ(mx - 3, my - 57, 1.2, '#222') + circ(mx + 3, my - 57, 1.2, '#222') + poly((mx) + ',' + (my - 55) + ' ' + (mx + 11) + ',' + (my - 53) + ' ' + mx + ',' + (my - 51), '#FF8A3D') + rect(mx - 10, my - 48, 20, 4, '#E5484D', 2) + '<g>' + at('rotate', '-4 ' + mx + ' ' + (my - 46) + ';6 ' + mx + ' ' + (my - 46) + ';-4 ' + mx + ' ' + (my - 46), 2.4) + rect(mx + 4, my - 48, 4, 14, '#E5484D', 2) + '</g>' + circ(mx, my - 38, 1.5, '#222') + circ(mx, my - 30, 1.5, '#222');
    s += snow(46, 17, '#fff', 262);
    return s;
  } };

  /* ============================================================ OCEANO */
  function fish(col, sc) { return '<g transform="scale(' + (sc || 1) + ')">' + ell(0, 0, 9, 4.4, col) + poly('-8,0 -15,-5 -15,5', col) + circ(5, -1, 1.1, '#111') + path('M-1 -4 Q1 0 -1 4', 'none', 'stroke="rgba(255,255,255,.55)" stroke-width="1.4"') + '</g>'; }
  function school(y, dir, dur, dly, col, n, rdSeed) {
    var rd = A.rnd(rdSeed), s = '';
    for (var i = 0; i < n; i++) s += '<g transform="translate(' + f(i * 15 * -dir + rd() * 8) + ' ' + f((rd() - .5) * 30) + ')">' + '<g>' + at('translate', '0 0;0 ' + f(3 + rd() * 3) + ';0 0', 1.8 + rd(), 'begin="-' + f(rd() * 2) + 's"') + '<g transform="scale(' + dir + ' 1)">' + fish(col, .8 + rd() * .3) + '</g></g></g>';
    var x0 = dir > 0 ? -90 : 740, x1 = dir > 0 ? 740 : -90;
    return '<g>' + at('translate', x0 + ' ' + y + ';' + x1 + ' ' + (y + 12), dur, 'begin="-' + dly + 's"') + s + '</g>';
  }
  function jelly(x, y, sc, col, dly) {
    var tent = '';
    [-8, -3, 3, 8].forEach(function (tx, i) { tent += path('M' + tx + ' 2 q-3 8 0 16 t0 16 t0 12', 'none', 'stroke="' + col + '" stroke-width="2" stroke-linecap="round" opacity=".7"', '') .replace('/>', '>' + an('d', 'M' + tx + ' 2 q-3 8 0 16 t0 16 t0 12;M' + tx + ' 2 q3 8 0 16 t0 16 t0 12;M' + tx + ' 2 q-3 8 0 16 t0 16 t0 12', 2.4, 'begin="-' + i * .4 + 's"') + '</path>'); });
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')"><g>' + at('translate', '0 0;6 -14;0 0', 7, 'begin="-' + dly + 's"') + '<g>' + at('scale', '1 1;1.1 .88;1 1', 2.6, 'begin="-' + dly + 's"') + circ(0, -4, 26, A.rg([[0, col, .4], [1, col, 0]])) + path('M-15 0 A15 13 0 0 1 15 0 Q0 6 -15 0Z', col, 'opacity=".85"') + path('M-9 -4 Q-4 -10 2 -9', 'none', 'stroke="rgba(255,255,255,.6)" stroke-width="1.6" stroke-linecap="round"') + tent + '</g></g></g>';
  }
  W.oceano = { name: "Under vandet", icon: 'mdi-fish', desc: "Under vandet: fiskestimer, selvlysende vandmænd, hval, ubåd, tang og bobler", windows: [], draw: function (K, h, B) {
    var dl = K.dy, nl = K.nt;
    var top = mix('#0A2A5A', '#4CCFE6', dl), mid = mix('#07204A', '#1E88C8', dl), bot = mix('#040B24', '#0A3C6E', dl);
    var s = rect(0, 0, 640, 260, A.lg([[0, top], [.55, mid], [1, bot]]));
    if (dl > .08) {
      var ray = A.lg([[0, '#fff', .55], [1, '#fff', 0]]), rs = '', sx = Math.min(560, Math.max(80, B.sun.x));
      [-120, -50, 20, 90, 160].forEach(function (dx, i) { rs += '<g>' + an('opacity', '.3;.9;.3', 4.5 + i * .7, 'begin="-' + i + 's"') + poly((sx + dx * .3) + ',-10 ' + (sx + dx * .3 + 22) + ',-10 ' + (sx + dx + 70) + ',262 ' + (sx + dx - 10) + ',262', ray) + '</g>'; });
      s += '<g opacity="' + f(dl * .5) + '">' + rs + '</g>';
    }
    if (B.moon.vis) s += circ(B.moon.x, 4, 70, A.rg([[0, '#DDE8FF', .4], [1, '#DDE8FF', 0]]));
    // balena
    s += '<g opacity="' + f(.28 + .1 * dl) + '"><g>' + at('translate', '-220 70;760 56', 64, 'begin="-24s"') + path('M0 0 Q40 -26 110 -12 Q150 -4 170 8 L196 -10 L192 14 L200 30 L172 18 Q140 30 90 24 Q30 26 0 0Z', mix(K.hn, '#0a1a3a', .5)) + circ(30, -4, 1.6, '#fff') + '</g></g>';
    // sabbia + corallo
    s += path('M-10 240 Q100 224 220 240 T450 238 T650 232 V262 H-10Z', mix('#E8D2A6', '#0a1a3a', .55 - .35 * dl)) + path('M-10 252 Q140 240 300 252 T650 246 V262 H-10Z', mix('#CDB68A', '#08122a', .6 - .35 * dl));
    [[60, '#FF7AA8'], [330, '#FF9A5C'], [590, '#B07CFF']].forEach(function (c) {
      var cc = mix(c[1], '#0a1a3a', .45 - .3 * dl);
      s += path('M' + c[0] + ' 244 q-4 -22 -14 -30 M' + c[0] + ' 244 q2 -30 -2 -44 M' + c[0] + ' 244 q8 -20 18 -26 M' + (c[0] - 7) + ' 222 q-8 -6 -10 -14 M' + (c[0] + 6) + ' 214 q10 -4 14 -12', 'none', 'stroke="' + cc + '" stroke-width="7" stroke-linecap="round"');
    });
    // alghe
    [[20, 56, '#2FA66B'], [110, 70, '#3CC47C'], [160, 44, '#2FA66B'], [420, 64, '#3CC47C'], [470, 48, '#2FA66B'], [610, 74, '#3CC47C']].forEach(function (a, i) {
      var c = mix(a[2], '#0a2a3a', .5 - .4 * dl);
      s += '<g transform="translate(' + a[0] + ' 250)"><g>' + at('skewX', '-7;7;-7', 3.4 + i * .4, 'begin="-' + i * .5 + 's"') + path('M0 0 q-9 ' + f(-a[1] / 3) + ' 0 ' + f(-a[1] / 2) + ' q9 ' + f(-a[1] / 3) + ' 0 ' + f(-a[1] / 2), 'none', 'stroke="' + c + '" stroke-width="6" stroke-linecap="round"') + '</g></g>';
    });
    // pesci
    s += school(70, 1, 24, 6, '#FFB347', 7, 3) + school(130, -1, 30, 14, '#4DD2FF', 6, 5) + school(190, 1, 20, 3, '#FF7AC8', 5, 8);
    // sottomarino
    s += '<g>' + at('translate', '-140 176;760 152', 52, 'begin="-30s"') + '<g>' + at('translate', '0 0;0 -4;0 0', 3.6) + ell(0, 0, 36, 13, '#F2B544') + rect(-10, -22, 18, 12, '#E09A24', 3) + rect(-3, -30, 3, 10, '#C9CEDB') + rect(-3, -32, 10, 3, '#C9CEDB') + circ(-16, -1, 5.6, '#1d3a5a') + circ(-16, -1, 3.6, mix('#8FEFFF', '#fff', .2)) + circ(0, -1, 5.6, '#1d3a5a') + circ(0, -1, 3.6, '#8FEFFF') + circ(16, -1, 5.6, '#1d3a5a') + circ(16, -1, 3.6, '#8FEFFF') + circ(0, -1, 26, A.rg([[0, '#8FEFFF', .3 + .3 * nl], [1, '#8FEFFF', 0]])) + '<g transform="translate(-38 0)">' + '<g>' + at('rotate', '0;360', .5) + rect(-1.4, -9, 2.8, 18, '#C9CEDB') + rect(-9, -1.4, 18, 2.8, '#C9CEDB') + '</g></g></g></g>';
    // meduse
    s += jelly(150, 150, 1, mix('#FF7AC8', '#ffffff', .15), 0) + jelly(400, 110, .8, mix('#7FD6FF', '#ffffff', .1), 3) + jelly(560, 170, 1.1, mix('#C084FC', '#ffffff', .1), 5);
    // bolle
    var rd = A.rnd(14);
    for (var b = 0; b < 16; b++) { var bx = rd() * 640, d = 6 + rd() * 5, r = 1.6 + rd() * 3; s += '<circle cx="' + f(bx) + '" cy="270" r="' + f(r) + '" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.65)" stroke-width="1">' + an('cy', '270;-10', d, 'begin="-' + f(rd() * d) + 's"') + an('cx', f(bx) + ';' + f(bx + 12) + ';' + f(bx - 6) + ';' + f(bx), d, 'begin="-' + f(rd() * d) + 's"') + '</circle>'; }
    return s;
  } };
})();


/* ---- effetti.js ---- */
/* ============================================================================
   AURORA GLASS v3 — EFFETTI (meteo e atmosfera) disegnati su canvas.
   Si possono sovrapporre a qualsiasi mondo: pioggia, temporale, neve, nebbia,
   foglie, petali, lucciole, stelle cadenti, fuochi d'artificio, bolle, coriandoli.
   ========================================================================== */
(function (g) {
  var TAU = Math.PI * 2, rnd = Math.random;
  function pick(a) { return a[Math.floor(rnd() * a.length)]; }

  function Fx(canvas, o) {
    o = o || {};
    this.c = canvas; this.x = canvas.getContext('2d');
    this.kind = 'none'; this.P = []; this.w = 1; this.h = 1; this.dpr = 1; this.t = 0; this.last = 0;
    this.k = o.k || 1;                 // moltiplicatore densità
    this.alpha = o.alpha === undefined ? 1 : o.alpha;
    this.running = false; this.onFlash = o.onFlash || null;
    this.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.S = {};                       // stato per effetto (timer, fulmini…)
    var self = this;
    this._loop = function (ts) { self.loop(ts); };
  }
  Fx.prototype.resize = function () {
    var r = this.c.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.c.width = Math.round(this.w * this.dpr); this.c.height = Math.round(this.h * this.dpr);
    this.x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.init();
  };
  Fx.prototype.set = function (kind) {
    this.kind = kind || 'none';
    this.S = {};
    this.resize();
    if (this.kind === 'none') { this.stop(); this.x.clearRect(0, 0, this.w, this.h); }
    else this.start();
  };
  Fx.prototype.start = function () {
    if (g.__NLY_STATIC) { var self = this; this.running = false; requestAnimationFrame(function () { var e = E[self.kind]; if (!e) return; self.x.clearRect(0, 0, self.w, self.h); self.x.globalAlpha = self.alpha; e.draw(self, 0); self.x.globalAlpha = 1; self.x.globalCompositeOperation = 'source-over'; }); return; }
    if (!this.running) { this.running = true; this.last = 0; requestAnimationFrame(this._loop); }
  };
  Fx.prototype.stop = function () { this.running = false; };
  Fx.prototype.init = function () { var e = E[this.kind]; this.P = []; if (e && e.init) e.init(this); };
  Fx.prototype.loop = function (ts) {
    if (!this.running) return;
    var dt = this.last ? Math.min(.05, (ts - this.last) / 1000) : .016;
    this.last = ts; this.t += dt;
    var e = E[this.kind];
    if (!e || document.hidden) { requestAnimationFrame(this._loop); return; }
    var x = this.x;
    x.clearRect(0, 0, this.w, this.h);
    x.globalAlpha = this.alpha;
    if (this.reduced) { dt = 0; }
    e.draw(this, dt);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    requestAnimationFrame(this._loop);
  };
  function area(fx, per) { return Math.max(8, Math.round(fx.w * fx.h / per * fx.k)); }

  /* ---------------------------------------------------------------- pioggia / temporale */
  function rainInit(heavy) {
    return function (fx) {
      var n = area(fx, heavy ? 3200 : 5200);
      for (var i = 0; i < n; i++) fx.P.push({ x: rnd() * (fx.w + 120) - 40, y: rnd() * fx.h, v: 650 + rnd() * 520, l: 10 + rnd() * 14, a: .22 + rnd() * .38 });
      fx.S.sp = []; fx.S.next = 2 + rnd() * 4; fx.S.flash = 0; fx.S.bolt = null; fx.S.boltT = 0;
    };
  }
  function bolt(fx) {
    var pts = [], x = fx.w * (.2 + rnd() * .6), y = 0, ty = fx.h * (.55 + rnd() * .3);
    pts.push([x, y]);
    while (y < ty) { y += 10 + rnd() * 16; x += (rnd() - .5) * 34; pts.push([x, y]); }
    var br = [], k = 1 + Math.floor(rnd() * 2);
    for (var i = 0; i < k; i++) { var s = pts[2 + Math.floor(rnd() * (pts.length - 4))], bx = s[0], by = s[1], seg = [[bx, by]]; for (var j = 0; j < 4; j++) { bx += (rnd() - .3) * 28; by += 8 + rnd() * 12; seg.push([bx, by]); } br.push(seg); }
    return { main: pts, br: br };
  }
  function rainDraw(heavy) {
    return function (fx, dt) {
      var x = fx.x, S = fx.S, wind = -.22;
      if (heavy) { x.fillStyle = 'rgba(8,10,34,.16)'; x.fillRect(0, 0, fx.w, fx.h); }
      x.lineWidth = 1.1; x.lineCap = 'round';
      for (var i = 0; i < fx.P.length; i++) {
        var d = fx.P[i], dy = d.v * dt;
        d.y += dy; d.x += dy * wind;
        if (d.y > fx.h) { if (S.sp.length < 36 && rnd() < .5) S.sp.push({ x: d.x, y: fx.h - 2, t: 0 }); d.y = -d.l; d.x = rnd() * (fx.w + 120) - 20; }
        x.strokeStyle = 'rgba(190,222,255,' + d.a + ')';
        x.beginPath(); x.moveTo(d.x, d.y); x.lineTo(d.x + d.l * wind, d.y + d.l); x.stroke();
      }
      for (var s = S.sp.length - 1; s >= 0; s--) {
        var p = S.sp[s]; p.t += dt * 3.2;
        if (p.t >= 1) { S.sp.splice(s, 1); continue; }
        x.strokeStyle = 'rgba(210,235,255,' + (.5 * (1 - p.t)) + ')';
        x.beginPath(); x.ellipse(p.x, p.y, 2 + p.t * 9, 1 + p.t * 2.4, 0, 0, TAU); x.stroke();
      }
      if (heavy) {
        S.next -= dt;
        if (S.next <= 0) { S.next = 3 + rnd() * 6; S.flash = 1; S.bolt = bolt(fx); S.boltT = .22; }
        if (S.flash > .01) {
          x.fillStyle = 'rgba(214,228,255,' + (S.flash * .42) + ')'; x.fillRect(0, 0, fx.w, fx.h);
          S.flash *= Math.pow(.02, dt * 2.2);
          if (fx.onFlash) fx.onFlash(S.flash);
        } else if (S.flash !== 0) { S.flash = 0; if (fx.onFlash) fx.onFlash(0); }
        if (S.bolt && S.boltT > 0) {
          S.boltT -= dt;
          x.save(); x.shadowColor = '#bcd4ff'; x.shadowBlur = 18; x.strokeStyle = 'rgba(255,255,255,' + Math.min(1, S.boltT * 7) + ')'; x.lineWidth = 2.4; x.lineJoin = 'round';
          function poly(pp) { x.beginPath(); pp.forEach(function (q, i) { i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); }); x.stroke(); }
          poly(S.bolt.main); x.lineWidth = 1.3; S.bolt.br.forEach(poly); x.restore();
        }
      }
    };
  }

  /* ---------------------------------------------------------------- neve */
  function snowInit(fx) { var n = area(fx, 4800); for (var i = 0; i < n; i++) fx.P.push({ x: rnd() * fx.w, y: rnd() * fx.h, r: 1 + rnd() * 2.6, v: 24 + rnd() * 56, ph: rnd() * TAU, sw: 8 + rnd() * 22 }); }
  function snowDraw(fx, dt) {
    var x = fx.x; x.fillStyle = '#fff';
    fx.P.forEach(function (p) {
      p.y += p.v * dt; p.x += Math.sin(fx.t * .9 + p.ph) * p.sw * dt;
      if (p.y > fx.h + 4) { p.y = -4; p.x = rnd() * fx.w; }
      x.globalAlpha = fx.alpha * (.45 + p.r / 5.2); x.beginPath(); x.arc(p.x, p.y, p.r, 0, TAU); x.fill();
    });
  }

  /* ---------------------------------------------------------------- nebbia */
  function fogInit(fx) { var n = Math.max(5, Math.round(fx.w / 150 * fx.k)); for (var i = 0; i < n; i++) fx.P.push({ x: rnd() * fx.w, y: fx.h * (.2 + rnd() * .8), r: 90 + rnd() * 170, v: (5 + rnd() * 14) * (rnd() > .5 ? 1 : -1), a: .10 + rnd() * .12 }); }
  function fogDraw(fx, dt) {
    var x = fx.x;
    fx.P.forEach(function (p) {
      p.x += p.v * dt; if (p.x > fx.w + p.r) p.x = -p.r; if (p.x < -p.r) p.x = fx.w + p.r;
      var gr = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); gr.addColorStop(0, 'rgba(236,242,255,' + p.a + ')'); gr.addColorStop(1, 'rgba(236,242,255,0)');
      x.fillStyle = gr; x.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    });
  }

  /* ---------------------------------------------------------------- foglie / petali */
  var LEAF = ['#E8742B', '#C8402A', '#F2B544', '#A8461F', '#D9A21B'];
  var PET = ['#FFC1D8', '#F9A8C9', '#FFD6E6', '#F48FB1'];
  function leafInit(petal) {
    return function (fx) {
      var n = area(fx, petal ? 6500 : 8500);
      for (var i = 0; i < n; i++) fx.P.push({ x: rnd() * fx.w, y: rnd() * fx.h, s: petal ? 3 + rnd() * 3 : 5 + rnd() * 5, v: 28 + rnd() * 48, ph: rnd() * TAU, rot: rnd() * TAU, rv: (rnd() - .5) * 4, sw: 20 + rnd() * 34, c: petal ? pick(PET) : pick(LEAF) });
    };
  }
  function leafDraw(petal) {
    return function (fx, dt) {
      var x = fx.x;
      fx.P.forEach(function (p) {
        p.y += p.v * dt; p.x += (Math.sin(fx.t * 1.2 + p.ph) * p.sw + (petal ? 26 : 8)) * dt; p.rot += p.rv * dt;
        if (p.y > fx.h + 12) { p.y = -12; p.x = rnd() * fx.w; }
        if (p.x > fx.w + 12) p.x = -12;
        x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.fillStyle = p.c; x.beginPath();
        if (petal) { x.ellipse(0, 0, p.s, p.s * .55, 0, 0, TAU); }
        else { x.moveTo(0, -p.s); x.quadraticCurveTo(p.s * .95, -p.s * .2, 0, p.s); x.quadraticCurveTo(-p.s * .95, -p.s * .2, 0, -p.s); }
        x.fill();
        if (!petal) { x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = .8; x.beginPath(); x.moveTo(0, -p.s); x.lineTo(0, p.s); x.stroke(); }
        x.restore();
      });
    };
  }

  /* ---------------------------------------------------------------- lucciole */
  function flyInit(fx) { var n = area(fx, 9000); for (var i = 0; i < n; i++) fx.P.push({ x: rnd() * fx.w, y: rnd() * fx.h, vx: (rnd() - .5) * 30, vy: (rnd() - .5) * 30, ph: rnd() * TAU, r: 4 + rnd() * 7 }); }
  function flyDraw(fx, dt) {
    var x = fx.x; x.globalCompositeOperation = 'lighter';
    fx.P.forEach(function (p) {
      p.vx += (rnd() - .5) * 90 * dt; p.vy += (rnd() - .5) * 90 * dt; p.vx *= .985; p.vy *= .985;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < -10) p.x = fx.w + 10; if (p.x > fx.w + 10) p.x = -10; if (p.y < -10) p.y = fx.h + 10; if (p.y > fx.h + 10) p.y = -10;
      var a = .2 + .8 * (.5 + .5 * Math.sin(fx.t * 1.8 + p.ph)), gr = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.6);
      gr.addColorStop(0, 'rgba(255,248,160,' + a + ')'); gr.addColorStop(.3, 'rgba(255,240,120,' + a * .45 + ')'); gr.addColorStop(1, 'rgba(255,240,120,0)');
      x.fillStyle = gr; x.beginPath(); x.arc(p.x, p.y, p.r * 2.6, 0, TAU); x.fill();
      x.fillStyle = 'rgba(255,255,230,' + a + ')'; x.beginPath(); x.arc(p.x, p.y, 1.4, 0, TAU); x.fill();
    });
  }

  /* ---------------------------------------------------------------- stelle cadenti */
  function metInit(fx) { fx.S.next = .4; fx.S.m = []; var n = area(fx, 7000); for (var i = 0; i < n; i++) fx.P.push({ x: rnd() * fx.w, y: rnd() * fx.h * .75, ph: rnd() * TAU, r: .5 + rnd() * 1.2 }); }
  function metDraw(fx, dt) {
    var x = fx.x, S = fx.S;
    fx.P.forEach(function (p) { x.globalAlpha = fx.alpha * (.25 + .6 * Math.abs(Math.sin(fx.t * 1.3 + p.ph))); x.fillStyle = '#fff'; x.beginPath(); x.arc(p.x, p.y, p.r, 0, TAU); x.fill(); });
    x.globalAlpha = fx.alpha;
    S.next -= dt;
    if (S.next <= 0) { S.next = .9 + rnd() * 2.2; S.m.push({ x: fx.w * (.35 + rnd() * .75), y: -10 + rnd() * fx.h * .3, vx: -(520 + rnd() * 320), vy: 280 + rnd() * 200, len: 90 + rnd() * 80, life: 0 }); }
    for (var i = S.m.length - 1; i >= 0; i--) {
      var m = S.m[i]; m.x += m.vx * dt; m.y += m.vy * dt; m.life += dt;
      if (m.life > 1.3 || m.y > fx.h + 20 || m.x < -120) { S.m.splice(i, 1); continue; }
      var sp = Math.hypot(m.vx, m.vy), tx = m.x - m.vx / sp * m.len, ty = m.y - m.vy / sp * m.len, a = Math.min(1, (1.3 - m.life) * 2);
      var gr = x.createLinearGradient(m.x, m.y, tx, ty); gr.addColorStop(0, 'rgba(255,255,255,' + a + ')'); gr.addColorStop(1, 'rgba(160,190,255,0)');
      x.strokeStyle = gr; x.lineWidth = 2.2; x.lineCap = 'round'; x.beginPath(); x.moveTo(m.x, m.y); x.lineTo(tx, ty); x.stroke();
      x.fillStyle = 'rgba(255,255,255,' + a + ')'; x.beginPath(); x.arc(m.x, m.y, 2, 0, TAU); x.fill();
    }
  }

  /* ---------------------------------------------------------------- fuochi d'artificio */
  function fwInit(fx) { fx.S.next = .3; fx.S.r = []; fx.S.s = []; }
  function fwDraw(fx, dt) {
    var x = fx.x, S = fx.S; x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
    S.next -= dt;
    if (S.next <= 0) { S.next = .7 + rnd() * 1.3; S.r.push({ x: fx.w * (.12 + rnd() * .76), y: fx.h + 4, ty: fx.h * (.14 + rnd() * .36), v: fx.h * (.9 + rnd() * .5), h: Math.floor(rnd() * 360) }); }
    for (var i = S.r.length - 1; i >= 0; i--) {
      var r = S.r[i]; r.y -= r.v * dt; r.v *= (1 - .6 * dt);
      x.strokeStyle = 'hsla(' + r.h + ',100%,80%,.9)'; x.lineWidth = 2; x.beginPath(); x.moveTo(r.x, r.y); x.lineTo(r.x, r.y + 12); x.stroke();
      if (r.y <= r.ty || r.v < 24) {
        var n = 46 + Math.floor(rnd() * 30), two = rnd() > .5;
        for (var k = 0; k < n; k++) { var a = TAU * k / n + rnd() * .1, sp = 50 + rnd() * 140 * (two && k % 2 ? .55 : 1); S.s.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, h: two && k % 2 ? (r.h + 160) % 360 : r.h + rnd() * 24 }); }
        S.r.splice(i, 1);
      }
    }
    for (var s = S.s.length - 1; s >= 0; s--) {
      var p = S.s[s], px = p.x, py = p.y; p.vy += 110 * dt; p.vx *= (1 - .9 * dt); p.vy *= (1 - .5 * dt); p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * .75;
      if (p.life <= 0) { S.s.splice(s, 1); continue; }
      x.strokeStyle = 'hsla(' + p.h + ',100%,' + (62 + 20 * p.life) + '%,' + p.life + ')'; x.lineWidth = 1.8 * p.life + .4; x.beginPath(); x.moveTo(px, py); x.lineTo(p.x, p.y); x.stroke();
    }
  }

  /* ---------------------------------------------------------------- bolle */
  function bubInit(fx) { var n = area(fx, 9500); for (var i = 0; i < n; i++) fx.P.push({ x: rnd() * fx.w, y: rnd() * fx.h, r: 3 + rnd() * 9, v: 20 + rnd() * 44, ph: rnd() * TAU, sw: 6 + rnd() * 14 }); }
  function bubDraw(fx, dt) {
    var x = fx.x;
    fx.P.forEach(function (p) {
      p.y -= p.v * dt; p.x += Math.sin(fx.t * 1.4 + p.ph) * p.sw * dt;
      if (p.y < -p.r * 2) { p.y = fx.h + p.r * 2; p.x = rnd() * fx.w; }
      x.fillStyle = 'rgba(255,255,255,.08)'; x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 1.2;
      x.beginPath(); x.arc(p.x, p.y, p.r, 0, TAU); x.fill(); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.arc(p.x, p.y, p.r * .62, Math.PI * 1.15, Math.PI * 1.5); x.stroke();
    });
  }

  /* ---------------------------------------------------------------- coriandoli */
  var CONF = ['#FF4D6D', '#FFD93D', '#4DD2FF', '#7CFF6B', '#B07CFF', '#FF9A3D'];
  function confInit(fx) { var n = area(fx, 5200); for (var i = 0; i < n; i++) fx.P.push({ x: rnd() * fx.w, y: rnd() * fx.h, w: 5 + rnd() * 6, h: 3 + rnd() * 4, v: 50 + rnd() * 90, rot: rnd() * TAU, rv: (rnd() - .5) * 6, ph: rnd() * TAU, sw: 14 + rnd() * 26, c: pick(CONF) }); }
  function confDraw(fx, dt) {
    var x = fx.x;
    fx.P.forEach(function (p) {
      p.y += p.v * dt; p.x += Math.sin(fx.t * 1.6 + p.ph) * p.sw * dt; p.rot += p.rv * dt;
      if (p.y > fx.h + 10) { p.y = -10; p.x = rnd() * fx.w; }
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.scale(1, Math.abs(Math.cos(fx.t * 3 + p.ph)) * .9 + .1); x.fillStyle = p.c; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); x.restore();
    });
  }

  var E = {
    pioggia:    { name: "Regn",          icon: 'mdi-weather-pouring',         init: rainInit(false), draw: rainDraw(false) },
    temporale:  { name: "Tordenvejr",        icon: 'mdi-weather-lightning-rainy', init: rainInit(true),  draw: rainDraw(true) },
    neve:       { name: "Sne",             icon: 'mdi-weather-snowy',           init: snowInit,        draw: snowDraw },
    nebbia:     { name: "Tåge",           icon: 'mdi-weather-fog',             init: fogInit,         draw: fogDraw },
    foglie:     { name: "Efterårsblade", icon: 'mdi-leaf-maple',              init: leafInit(false), draw: leafDraw(false) },
    petali:     { name: "Blomsterblade",           icon: 'mdi-flower-tulip',            init: leafInit(true),  draw: leafDraw(true) },
    lucciole:   { name: "Ildfluer",         icon: 'mdi-shimmer',                 init: flyInit,         draw: flyDraw },
    stelle:     { name: "Stjerneskud",   icon: 'mdi-star-shooting',           init: metInit,         draw: metDraw },
    fuochi:     { name: "Fyrværkeri", icon: 'mdi-firework',             init: fwInit,          draw: fwDraw },
    bolle:      { name: "Bobler",            icon: 'mdi-chart-bubble',          init: bubInit,         draw: bubDraw },
    coriandoli: { name: "Konfetti",       icon: 'mdi-party-popper',            init: confInit,        draw: confDraw }
  };
  g.FX = { Fx: Fx, E: E };
})(window);


/* ---- aurora-app.js ---- */
/* ============================================================================
   AURORA GLASS v3 — logica dell'interfaccia
   Una sola codebase per due usi:
   · anteprima (index.html): dati finti, tutto simulato
   · scheda di Home Assistant (ha/): dati veri delle entità, servizi veri
   ctx = { root, host, layer, scroll, assets, live, embedded, haIcons, config, call, moreInfo }
   ========================================================================== */
(function (g) {
  "use strict";
  g.AuroraApp = function (ctx) {
    var ROOT = ctx.root, HOST = ctx.host, LAYER = ctx.layer || HOST, SCROLL = ctx.scroll || window;
    var LIVE = !!ctx.live, HA = !!ctx.haIcons, EMB = !!ctx.embedded, CFG = ctx.config || {};
    var $ = function (s, r) { return (r || ROOT).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || ROOT).querySelectorAll(s)); };
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || CFG.animations === false;
    var timers = [], unbinds = [], running = false;
    var LPEND = {}, LSEQ = {}; /* Nordlys: ventende lys-kommandoer, så knappen ikke hopper tilbage */
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function store(k, v) { try { if (v === undefined) return localStorage.getItem("aurora-v3-" + k); localStorage.setItem("aurora-v3-" + k, v); } catch (e) {} return null; }
    function every(fn, ms) { var id = setInterval(fn, ms); timers.push(id); return id; }
    function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
    function on(target, ev, fn, opt) { target.addEventListener(ev, fn, opt); unbinds.push(function () { target.removeEventListener(ev, fn, opt); }); }

    /* ------------------------------------------------------------------ icone (ha-icon dentro Home Assistant, webfont MDI nell'anteprima) */
    function hydrate(node) {
      if (!HA) return;
      $$("i.mdi", node || ROOT).forEach(function (i) {
        if (i.dataset.hy) return;
        var n = null; i.classList.forEach(function (c) { if (!n && /^mdi-/.test(c)) n = c.slice(4); });
        if (!n) return;
        i.dataset.hy = "1"; i.innerHTML = '<ha-icon icon="mdi:' + n + '"></ha-icon>';
      });
    }
    function setIco(node, name) {
      if (!node) return;
      name = name.replace(/^mdi-/, "");
      if (HA) { var h = $("ha-icon", node); if (!h) { node.classList.add("mdi"); node.innerHTML = "<ha-icon></ha-icon>"; node.dataset.hy = "1"; h = $("ha-icon", node); } h.setAttribute("icon", "mdi:" + name); }
      else node.className = "mdi mdi-" + name + (node.classList.contains("bolt") ? " bolt" : "");
    }
    function el(tag, cls, html, attrs) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) { e.innerHTML = html; hydrate(e); } if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
    var PEN = '<span class="edit-badge"><i class="mdi mdi-pencil"></i></span>';

    /* ------------------------------------------------------------------ immagini dei pulsanti */
    var BASE = ctx.assets || "assets/btn/", IMG = {};
    ["luce_salotto", "luce_ingresso", "luce_corridoio", "luce_cucina", "luce_balcone", "luce_camera", "luce_cameretta", "luce_bagno_piccolo", "luce_bagno_doccia", "luce_lavanderia", "luce_sgabuzzino",
     "scena_buongiorno", "scena_cinema", "scena_cena", "scena_notte", "scena_esco",
     "sensore_movimento", "sensore_porta", "sensore_finestra", "sensore_cancello"].forEach(function (k) { IMG[k] = { kind: "pair", off: BASE + k + "_off.png", on: BASE + k + "_on.gif" }; });
    IMG.allarme_off = { kind: "single", src: BASE + "allarme_off.png" };
    ["allarme_notte", "allarme_fuori", "allarme_scattato"].forEach(function (k) { IMG[k] = { kind: "single", src: BASE + k + ".gif" }; });
    IMG.clima_off = { kind: "single", src: BASE + "clima_off.png" };
    ["cool", "heat", "dry", "fan", "auto"].forEach(function (k) { IMG["clima_" + k] = { kind: "single", src: BASE + "clima_" + k + ".gif" }; });
    var LIBGROUPS = [["Lys", "luce_"], ["Scener", "scena_"], ["Sensorer", "sensore_"], ["Alarm", "allarme_"], ["Klima", "clima_"]];
    var LIBNAMES = { luce_salotto: "Stue", luce_ingresso: "Indgang", luce_corridoio: "Gang", luce_cucina: "Køkken", luce_balcone: "Altan", luce_camera: "Soveværelse", luce_cameretta: "Børneværelse", luce_bagno_piccolo: "Bad 1", luce_bagno_doccia: "Bruser", luce_lavanderia: "Bryggers", luce_sgabuzzino: "Depot",
      scena_buongiorno: "Godmorgen", scena_cinema: "Biograf", scena_cena: "Middag", scena_notte: "Nat", scena_esco: "Ud", sensore_movimento: "Bevægelse", sensore_porta: "Dør", sensore_finestra: "Vindue", sensore_cancello: "Låge", allarme_off: "Fra", allarme_notte: "Nat", allarme_fuori: "Ude", allarme_scattato: "Udløst", clima_off: "Slukket", clima_cool: "Køl", clima_heat: "Varme", clima_dry: "Affugt", clima_fan: "Blæser", clima_auto: "Auto" };
    var OV = {};
    try { OV = JSON.parse(store("img") || "{}") || {}; } catch (e) { OV = {}; }
    function saveOV() { try { localStorage.setItem("aurora-v3-img", JSON.stringify(OV)); return true; } catch (e) { toast("Billedet er for stort: kan ikke gemme det", "mdi-alert-circle", "var(--warn)"); return false; } }
    function resolve(ov, base, onState) {
      var o = OV[ov] || null, b = IMG[base];
      if (!b) return "";
      if (b.kind === "single") return (o && o.src) || b.src;
      return (o && o[onState ? "on" : "off"]) || b[onState ? "on" : "off"];
    }
    function refreshImg(node) {
      var im = $("img", node);
      if (!im) return;
      var src = resolve(node.dataset.ov || node.dataset.img, node.dataset.img, node.dataset.on === "1");
      if (CFG.animations === false && src) {
        if (/\.gif(\?|$)/i.test(src) && !/^data:/i.test(src)) src = src.replace(/\.gif(\?|$)/i, ".still.png$1"); /* færdigt stillbillede ved siden af GIF'en */
        else if (/^data:image\/gif/i.test(src)) { if (!FROZEN[src]) { freezeGif(src); return; } src = FROZEN[src]; } /* egne uploadede GIF'er */
      }
      if (im.getAttribute("src") !== src) im.setAttribute("src", src);
    }
    function refreshAll() { $$("[data-img]").forEach(refreshImg); }
    /* Nordlys: statisk tilstand - animerede GIF'er vises som stillbillede */
    var FROZEN = {}, FREEZING = {};
    function freezeGif(src) {
      if (FREEZING[src]) return; FREEZING[src] = true;
      var i = new Image();
      i.onload = function () { try { var c = document.createElement("canvas"); c.width = i.naturalWidth; c.height = i.naturalHeight; c.getContext("2d").drawImage(i, 0, 0); FROZEN[src] = c.toDataURL("image/png"); } catch (e) { FROZEN[src] = src; } refreshAll(); };
      i.onerror = function () { FROZEN[src] = src; refreshAll(); };
      i.src = src;
    }

    /* ------------------------------------------------------------------ dati */
    var LIGHTS = {
      salotto: ["Stue", "luce_salotto", "mdi-sofa"], ingresso: ["Entré", "luce_ingresso", "mdi-door"], corridoio: ["Gang", "luce_corridoio", "mdi-wall-sconce-flat"],
      cucina: ["Køkken", "luce_cucina", "mdi-chef-hat"], balcone: ["Terrasse", "luce_balcone", "mdi-outdoor-lamp"], camera: ["Soveværelse", "luce_camera", "mdi-bed-king"], cameretta: ["Børneværelse", "luce_cameretta", "mdi-teddy-bear"],
      bagno_piccolo: ["Lille bad", "luce_bagno_piccolo", "mdi-toilet"], bagno_doccia: ["Badeværelse", "luce_bagno_doccia", "mdi-shower-head"], lavanderia: ["Bryggers", "luce_lavanderia", "mdi-washing-machine"], sgabuzzino: ["Depot", "luce_sgabuzzino", "mdi-package-variant-closed"]
    };
    var ROOMS = [
      { n: "Opholdsrum", ic: "mdi-sofa", c: "#8B5CF6", w: 3, l: ["salotto", "ingresso", "corridoio"], s: ["salotto", "ingresso", "corridoio"], o: ["ingresso", "balcone_salotto"] },
      { n: "Køkken", ic: "mdi-chef-hat", c: "#F59E0B", w: 3, l: ["cucina", "balcone"], s: ["cucina"], o: ["balcone_cucina"], cell: true },
      { n: "Soverum", ic: "mdi-bed-king", c: "#3B82F6", w: 2, l: ["camera", "cameretta"], s: ["camera", "cameretta"], o: ["cameretta", "balcone_camera"] },
      { n: "Bad", ic: "mdi-shower-head", c: "#14B8A6", w: 2, l: ["bagno_piccolo", "bagno_doccia"], s: [], o: ["bagno"] },
      { n: "Bryggers", ic: "mdi-washing-machine", c: "#22C55E", w: 2, l: ["lavanderia", "sgabuzzino"], s: ["lavanderia", "sgabuzzino"], o: ["lavanderia"] }
    ];
    var MOTION = [["salotto", "Stue"], ["ingresso", "Indgang"], ["cucina", "Køkken"], ["corridoio", "Gang"], ["cameretta", "Børneværelse"], ["lavanderia", "Bryggers"], ["sgabuzzino", "Depot"], ["camera", "Soveværelse"]];
    var OPENS = { ingresso: ["Hoveddør", "sensore_porta", "Åben", "Lukket"], balcone_salotto: ["Altandør stue", "sensore_finestra", "Åben", "Lukket"], balcone_cucina: ["Altandør køkken", "sensore_finestra", "Åben", "Lukket"],
      cameretta: ["Vindue børneværelse", "sensore_finestra", "Åben", "Lukket"], balcone_camera: ["Altandør soveværelse", "sensore_finestra", "Åben", "Lukket"], bagno: ["Vindue bad", "sensore_finestra", "Åben", "Lukket"], lavanderia: ["Vindue bryggers", "sensore_finestra", "Åben", "Lukket"], cancello: ["Lås", "sensore_cancello", "Låst op", "Låst"] };
    var OP = {}, OPNA = {}, motNa = 0;
    Object.keys(OPENS).forEach(function (k) { OP[k] = false; });
    var SCENES = [
      { id: "morning", n: "Godmorgen", sub: "Køkken, gang, bad", img: "scena_buongiorno", ic: "mdi-weather-sunset-up", s1: "#F59E0B", s2: "#F43F5E", lights: ["cucina", "corridoio", "bagno_piccolo"], alarm: null, msg: "Godmorgen! Køkken, gang og bad er tændt." },
      { id: "cinema", n: "Biograf", sub: "Kun stuen", img: "scena_cinema", ic: "mdi-movie-open", s1: "#8B5CF6", s2: "#EC4899", lights: ["salotto"], alarm: null, msg: "Biograf: kun stuen er tændt." },
      { id: "dinner", n: "Middag", sub: "Køkken og stue", img: "scena_cena", ic: "mdi-silverware-fork-knife", s1: "#F97316", s2: "#FACC15", lights: ["cucina", "salotto"], alarm: null, msg: "Middag: køkken og stue er tændt." },
      { id: "night", n: "Godnat", sub: "Slukker alt · alarm nat", img: "scena_notte", ic: "mdi-weather-night", s1: "#6366F1", s2: "#22D3EE", lights: [], alarm: "armed_night", msg: "Godnat! Lyset er slukket, og alarmen er sat til nat." },
      { id: "away", n: "Ud af huset", sub: "Slukker alt · alarm ude", img: "scena_esco", ic: "mdi-door-open", s1: "#10B981", s2: "#06B6D4", lights: [], alarm: "armed_away", msg: "Huset er lukket: lyset er slukket, og alarmen er tilkoblet." }
    ];
    var ALARM = {
      disarmed:    { t: "Frakoblet",         d: "Huset er åbent. Vælg en tilstand for at tilkoble alarmen.",             s: "off",   short: "Alarm fra",        art: "allarme_off" },
      armed_night: { t: "Tilkoblet · Nat",      d: "Døre og vinduer overvåges. Bevægelse indendørs ignoreres.", s: "armed", short: "Alarm nat",      art: "allarme_notte" },
      armed_away:  { t: "Tilkoblet · Ude", d: "Hele huset overvåges, også bevægelse indendørs.",        s: "armed", short: "Alarm ude", art: "allarme_fuori" },
      arming:      { t: "Tilkobler…",     d: "Alarmen tilkobles om få sekunder.",                            s: "armed", short: "Alarm tilkobles", art: "allarme_fuori" },
      triggered:   { t: "ALARM UDLØST",      d: "Alarmen er gået. Tjek kameraerne.",                      s: "alarm", short: "ALARM UDLØST",     art: "allarme_scattato" }
    };
    var state = { lights: { salotto: true, ingresso: false, corridoio: false, cucina: true, balcone: false, camera: false, cameretta: false, bagno_piccolo: false, bagno_doccia: false, lavanderia: false, sgabuzzino: false }, alarm: "disarmed", scene: null };

    /* entità di Home Assistant (modificabili con la config della scheda: entities: { ... }) */
    var ENT = {
      /* nomi di ESEMPIO: sostituiscili nella configurazione YAML della scheda (vedi la guida) */
      lights: { salotto: "light.salotto", ingresso: "light.ingresso", corridoio: "light.corridoio", cucina: "light.cucina", balcone: "light.balcone", camera: "light.camera", cameretta: "light.cameretta", bagno_piccolo: "light.bagno_piccolo", bagno_doccia: "light.bagno_doccia", lavanderia: "light.lavanderia", sgabuzzino: "light.sgabuzzino" },
      motion: { salotto: ["binary_sensor.salotto_movimento"], ingresso: ["binary_sensor.ingresso_movimento"], cucina: ["binary_sensor.cucina_movimento"], corridoio: ["binary_sensor.corridoio_movimento"],
        cameretta: ["binary_sensor.cameretta_movimento"], lavanderia: ["binary_sensor.lavanderia_movimento"], sgabuzzino: ["binary_sensor.sgabuzzino_movimento"], camera: ["binary_sensor.camera_movimento"] },
      opens: { ingresso: "binary_sensor.porta_ingresso", balcone_salotto: "binary_sensor.balcone_salotto", balcone_cucina: "binary_sensor.balcone_cucina", cameretta: "binary_sensor.finestra_cameretta", balcone_camera: "binary_sensor.balcone_camera", bagno: "binary_sensor.finestra_bagno", lavanderia: "binary_sensor.finestra_lavanderia", cancello: "lock.serratura_ingresso" },
      alarm: "alarm_control_panel.allarme", weather: "weather.forecast_home", power: "sensor.potenza_casa",
      energy: {
        power: "sensor.potenza_casa", voltage: "sensor.tensione_casa", energyTotal: "sensor.energia_totale_casa",
        today: "sensor.energia_oggi", yesterday: "sensor.energia_ieri", month: "sensor.energia_mese", lastMonth: "sensor.energia_mese_scorso", year: "sensor.energia_anno",
        costToday: "sensor.costo_oggi", costYesterday: "sensor.costo_ieri", costMonth: "sensor.costo_mese", costLastMonth: "sensor.costo_mese_scorso", costYear: "sensor.costo_anno",
        base: "sensor.consumo_di_fondo", avg3: "sensor.potenza_media_3_ore", limit: "input_number.soglia_potenza", limitDefault: 3000,
        price: "input_number.prezzo_energia", priceDefault: 0.30,   /* tariffa €/kWh: helper di HA (creato al primo salvataggio) e valore di esempio */
        liveRefresh: 0,   /* secondi: se > 0 chiede a Home Assistant di rileggere il contatore (utile per Shelly e simili) */
        appliances: []
      },
      climate: "climate.salotto",
      cameras: []
    };
    (function mergeCfg() {
      var e = CFG.entities || {}; var lb = CFG.labels || {}; Object.keys(lb.lights || {}).forEach(function (k) { if (LIGHTS[k] && lb.lights[k]) LIGHTS[k][0] = String(lb.lights[k]); }); (lb.rooms || []).forEach(function (n, i) { if (ROOMS[i] && n) ROOMS[i].n = String(n); }); (lb.scenes || []).forEach(function (x, i) { if (SCENES[i] && x) { if (x.n) SCENES[i].n = String(x.n); if (x.sub) SCENES[i].sub = String(x.sub); if (x.msg) SCENES[i].msg = String(x.msg); } });
      ["lights", "motion", "opens"].forEach(function (g2) { if (e[g2]) Object.keys(e[g2]).forEach(function (k) { ENT[g2][k] = e[g2][k]; }); });
      ["alarm", "weather", "temperature", "power", "climate", "cameras"].forEach(function (k) { if (e[k] !== undefined) ENT[k] = e[k]; });
      if (e.energy) Object.keys(e.energy).forEach(function (k) { ENT.energy[k] = e.energy[k]; });
      /* luci oltre alle 11 standard: extraLights: [{ k: "strip_led", n: "Strip LED", id: "light.strip_led", room: "Cucina", ic: "mdi-led-strip-variant" }] */
      (e.extraLights || []).forEach(function (x) {
        if (!x || !x.k || !x.id || LIGHTS[x.k]) return;
        var room = ROOMS.filter(function (r) { return r.n === x.room; })[0] || ROOMS[0];
        LIGHTS[x.k] = [x.n || x.k, x.img || LIGHTS[room.l[0]][1], x.ic || "mdi-lightbulb", "luce_" + x.k];
        ENT.lights[x.k] = x.id; room.l.push(x.k); state.lights[x.k] = false;
      });
      /* Nordlys: en lys-plads sat til null/false i entities.lights fjernes; rum uden lys skjules */
      Object.keys(ENT.lights).forEach(function (k) { if (e.lights && Object.prototype.hasOwnProperty.call(e.lights, k) && !e.lights[k]) { delete ENT.lights[k]; delete state.lights[k]; ROOMS.forEach(function (r) { r.l = r.l.filter(function (x) { return x !== k; }); }); } });
      for (var ri = ROOMS.length - 1; ri >= 0; ri--) if (!ROOMS[ri].l.length) ROOMS.splice(ri, 1);
    })();
    var HASS = null;
    function sv(id) { return HASS && id && HASS.states[id] ? HASS.states[id] : null; }
    function availId(ids) { ids = Array.isArray(ids) ? ids : [ids]; for (var i = 0; i < ids.length; i++) { var s = sv(ids[i]); if (s && s.state !== "unavailable" && s.state !== "unknown") return ids[i]; } return ids[0]; }
    function isUnavail(s) { return !s || s.state === "unavailable" || s.state === "unknown"; }
    function call(domain, service, data) {
      if (!ctx.call) return Promise.resolve();
      try { return Promise.resolve(ctx.call(domain, service, data)).catch(function (e) { toast("Mislykkedes: " + ((e && e.message) || "fejl i Home Assistant"), "mdi-alert-circle", "var(--warn)"); }); }
      catch (e) { toast("Mislykkedes: " + e.message, "mdi-alert-circle", "var(--warn)"); return Promise.resolve(); }
    }
    function moreInfo(id) { if (!id) return; if (ctx.moreInfo) ctx.moreInfo(id); }

    /* ------------------------------------------------------------------ toast + scintille */
    var toastT;
    function toast(msg, icon, color) {
      var t = $("#toast");
      $("#toast-text").textContent = msg;
      var i = $("i", t); setIco(i, icon || "mdi-check-circle"); i.style.color = color || "var(--ok)";
      t.classList.add("show"); clearTimeout(toastT);
      toastT = setTimeout(function () { t.classList.remove("show"); }, 2600);
    }
    function burst(x, y, c1, c2) {
      if (reduce) return;
      var off = EMB ? LAYER.getBoundingClientRect() : { left: 0, top: 0 };
      for (var k = 0; k < 16; k++) {
        var s = el("span", "spark"); s.style.left = (x - off.left) + "px"; s.style.top = (y - off.top) + "px"; s.style.background = k % 2 ? c1 : c2; LAYER.appendChild(s);
        var a = Math.random() * Math.PI * 2, d = 36 + Math.random() * 64;
        var an = s.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: "translate(calc(-50% + " + Math.cos(a) * d + "px), calc(-50% + " + Math.sin(a) * d + "px)) scale(0)", opacity: 0 }], { duration: 600 + Math.random() * 300, easing: "cubic-bezier(.16,1,.3,1)" });
        an.onfinish = (function (n) { return function () { n.remove(); }; })(s);
      }
    }

    /* ------------------------------------------------------------------ costruzione interfaccia */
    function buildScenes() {
      var box = $("#scenes");
      SCENES.forEach(function (sc) {
        var b = el("button", "scene", '<img class="s-img" alt="" draggable="false"><span class="s-ico"><i class="mdi ' + sc.ic + '"></i></span><span><b>' + sc.n + "</b><small>" + sc.sub + "</small></span>" + PEN, { type: "button", "data-scene": sc.id, "data-img": sc.img, "data-label": "Scene " + sc.n, "data-on": "0" });
        b.style.setProperty("--s1", sc.s1); b.style.setProperty("--s2", sc.s2);
        b.addEventListener("mouseenter", function () { b.dataset.on = "1"; refreshImg(b); });
        b.addEventListener("mouseleave", function () { b.dataset.on = state.scene === sc.id ? "1" : "0"; refreshImg(b); });
        b.addEventListener("click", function () { runScene(sc, b); });
        box.appendChild(b);
      });
    }
    function motionLabel(k) { return MOTION.filter(function (m) { return m[0] === k; })[0][1]; }
    function hasMotion(k) { return !LIVE || (ENT.motion[k] && ENT.motion[k].length); }
    function sensChip(k) {
      var label = motionLabel(k);
      return '<span class="sens" data-sensor="' + k + '" data-img="sensore_movimento" data-ov="mov_' + k + '" data-label="Movimento ' + label + '" data-on="0"><span class="s-ph"><img class="s-img" alt="" draggable="false"></span><i class="mdi mdi-motion-sensor"></i>' + label + PEN + "</span>";
    }
    function openChip(id) {
      if (LIVE && !ENT.opens[id]) return "";
      var o = OPENS[id];
      return '<span class="sens" data-op="' + id + '" data-img="' + o[1] + '" data-ov="op_' + id + '" data-label="' + o[0] + '" data-on="0"><span class="s-ph"><img class="s-img" alt="" draggable="false"></span><i class="mdi mdi-door-closed"></i>' + o[0] + PEN + "</span>";
    }
    function longPress(node, fn) {
      var t = 0, fired = false;
      node.addEventListener("pointerdown", function () { fired = false; clearTimeout(t); t = setTimeout(function () { fired = true; fn(); }, 550); });
      ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { node.addEventListener(ev, function () { clearTimeout(t); }); });
      node.addEventListener("click", function (e) { if (fired) { e.stopImmediatePropagation(); e.preventDefault(); fired = false; } }, true);
    }
    function buildRooms() {
      var box = $("#rooms");
      ROOMS.forEach(function (r) {
        var card = el("article", "card room w" + r.w); card.style.setProperty("--room", r.c);
        var orbs = "";
        r.l.forEach(function (k) {
          var L = LIGHTS[k];
          orbs += '<button class="orb" type="button" data-light="' + k + '" data-img="' + L[1] + '"' + (L[3] ? ' data-ov="' + L[3] + '"' : "") + ' data-label="Lys ' + L[0].toLowerCase() + '" data-on="0" aria-pressed="false">' +
            '<img class="o-img" alt="" draggable="false"><span class="o-shade"></span><span class="sw"></span><span class="o-ico"><i class="mdi ' + L[2] + '"></i></span>' +
            '<span class="o-txt"><span class="o-name">' + L[0] + "</span><span class=\"o-state\">Slukket</span></span>" + PEN + "</button>";
        });
        var chips = r.s.filter(hasMotion).map(sensChip).join("") + r.o.map(openChip).join("");
        var body = orbs;
        if (r.cell) body += '<div class="sens-cell sensors">' + chips + "</div>"; else if (chips) body += '<div class="sensors strip">' + chips + "</div>";
        card.innerHTML = '<div class="room-head"><span class="r-ico"><i class="mdi ' + r.ic + '"></i></span><h3>' + r.n + '</h3><span class="count">0/' + r.l.length + '</span></div><div class="bar"><i></i></div><div class="room-body">' + body + "</div>";
        hydrate(card);
        $$(".room-head .r-ico, .room-head h3", card).forEach(function (n) { n.addEventListener("click", function () { if (HOST.hasAttribute("data-rtoggle")) roomToggle(card); }); });
        box.appendChild(card);
      });
      $$(".orb").forEach(function (o) {
        o.addEventListener("click", function () {
          var k = o.dataset.light;
          if (LIVE) {
            var s = sv(ENT.lights[k]);
            if (isUnavail(s)) { toast(LIGHTS[k][0] + ": enheden er ikke tilgængelig", "mdi-alert-circle", "var(--warn)"); return; }
            var want = !state.lights[k], seq = (LSEQ[k] = (LSEQ[k] || 0) + 1);
            LPEND[k] = { want: want, until: Date.now() + 6000, s0: sv(ENT.lights[k]) };
            call("homeassistant", want ? "turn_on" : "turn_off", { entity_id: ENT.lights[k] });
            later(function () {
              if (LSEQ[k] !== seq) return; /* et nyere tryk har overtaget */
              var s2 = sv(ENT.lights[k]);
              if (isUnavail(s2)) toast(LIGHTS[k][0] + ": svarer ikke, ved ikke om kommandoen kom frem", "mdi-alert-circle", "var(--warn)");
              else if ((s2.state === "on") !== want) toast(LIGHTS[k][0] + ": kommandoen havde ingen effekt", "mdi-alert-circle", "var(--warn)");
              syncLights(); render();
            }, 4000);
          }
          state.lights[k] = !state.lights[k]; state.scene = null;
          o.classList.remove("pop"); void o.offsetWidth; o.classList.add("pop");
          if (state.lights[k]) { var rc = o.getBoundingClientRect(); burst(rc.left + 34, rc.top + 34, getComputedStyle(o).getPropertyValue("--room") || "#fff", "#fff"); }
          render();
        });
        o.addEventListener("animationend", function (e) { if (e.animationName === "pop") o.classList.remove("pop"); });
        if (LIVE) longPress(o, function () { if (!o._drag) moreInfo(ENT.lights[o.dataset.light]); });
        if (LIVE) dimDrag(o);
      });
      $$("[data-op]").forEach(function (c) { c.addEventListener("click", function () { onOpenTap(c.dataset.op); }); c.style.cursor = "pointer"; });
      $$(".sens[data-sensor]").forEach(function (c) { if (LIVE) { c.addEventListener("click", function () { moreInfo(availId(ENT.motion[c.dataset.sensor])); }); c.style.cursor = "pointer"; } });
    }
    /* Nordlys: roomToggle — ét tryk på rummet: er noget tændt, slukkes alt; ellers tændes alt */
    function roomToggle(card) {
      var ks = $$(".orb", card).map(function (o) { return o.dataset.light; }).filter(function (k) { return !LIVE || !isUnavail(sv(ENT.lights[k])); });
      if (!ks.length) return;
      var want = !ks.some(function (k) { return state.lights[k]; });
      if (LIVE) {
        ks.forEach(function (k) { LSEQ[k] = (LSEQ[k] || 0) + 1; LPEND[k] = { want: want, until: Date.now() + 6000, s0: sv(ENT.lights[k]) }; });
        call("homeassistant", want ? "turn_on" : "turn_off", { entity_id: ks.map(function (k) { return ENT.lights[k]; }) });
        later(function () { syncLights(); render(); }, 4000);
      }
      ks.forEach(function (k) { state.lights[k] = want; }); state.scene = null;
      render();
    }
    /* Nordlys: lightSlider — lysstyrke for en dæmpbar lampe, 0 når slukket */
    function lightBri(k) {
      var s = sv(ENT.lights[k]); if (!s || !s.attributes) return null;
      var modes = s.attributes.supported_color_modes || [];
      if (!modes.some(function (m) { return m !== "onoff"; })) return null;
      return s.state === "on" ? Math.max(1, Math.round((s.attributes.brightness || 255) / 2.55)) : 0;
    }
    function dimDrag(o) {
      o.addEventListener("click", function (e) { if (o._sup) { e.stopImmediatePropagation(); e.preventDefault(); o._sup = false; } }, true);
      o.addEventListener("pointerdown", function (e) {
        if (!HOST.hasAttribute("data-lslider") || !o.classList.contains("dim")) return;
        var x0 = e.clientX, y0 = e.clientY, active = false, r = o.getBoundingClientRect(), pid = e.pointerId;
        function pct(x) { return Math.max(1, Math.min(100, Math.round((x - r.left) / r.width * 100))); }
        function done() { o.removeEventListener("pointermove", mv); o.removeEventListener("pointerup", up); o.removeEventListener("pointercancel", done); o.classList.remove("dragging"); o._drag = false; }
        function mv(ev) {
          var dx = ev.clientX - x0, dy = ev.clientY - y0;
          if (!active) {
            if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { active = true; o._drag = true; o.classList.add("dragging"); try { o.setPointerCapture(pid); } catch (_) {} }
            else { if (Math.abs(dy) > 8) done(); return; }
          }
          o._dp = pct(ev.clientX); o.style.setProperty("--bri", o._dp + "%"); $(".o-state", o).textContent = "Lysstyrke " + o._dp + "%";
        }
        function up() {
          if (active && o._dp) {
            var k = o.dataset.light, p = o._dp;
            o._hold = { p: p, until: Date.now() + 6000 }; o._sup = true; setTimeout(function () { o._sup = false; }, 500);
            LSEQ[k] = (LSEQ[k] || 0) + 1; LPEND[k] = { want: true, until: Date.now() + 6000, s0: sv(ENT.lights[k]) };
            call("light", "turn_on", { entity_id: ENT.lights[k], brightness_pct: p });
            state.lights[k] = true; state.scene = null;
          }
          done(); render();
        }
        o.addEventListener("pointermove", mv); o.addEventListener("pointerup", up); o.addEventListener("pointercancel", done);
      });
    }
    function buildSecurity() {
      var mt = $("#motion-tiles");
      MOTION.filter(function (m) { return hasMotion(m[0]); }).forEach(function (m) {
        var b = el("button", "stile", '<img class="st-img" alt="" draggable="false"><i class="mdi mdi-motion-sensor st-ico"></i><span class="st-txt"><span class="st-name">' + m[1] + "</span><span class=\"st-state\">Ingen bevægelse</span></span>" + PEN, { type: "button", "data-sensor": m[0], "data-img": "sensore_movimento", "data-ov": "mov_" + m[0], "data-label": "Bevægelse " + m[1], "data-on": "0" });
        b.addEventListener("click", function () { if (LIVE) moreInfo(availId(ENT.motion[m[0]])); else motion(m[0]); });
        mt.appendChild(b);
      });
      var ot = $("#open-tiles");
      Object.keys(OPENS).filter(function (id) { return !LIVE || ENT.opens[id]; }).forEach(function (id) {
        var o = OPENS[id];
        var b = el("button", "stile", '<img class="st-img" alt="" draggable="false"><i class="mdi mdi-door-closed st-ico"></i><span class="st-txt"><span class="st-name">' + o[0] + '</span><span class="st-state">' + o[3] + "</span></span>" + PEN, { type: "button", "data-op": id, "data-img": o[1], "data-ov": "op_" + id, "data-label": o[0], "data-on": "0" });
        b.addEventListener("click", function () { onOpenTap(id); });
        ot.appendChild(b);
      });
    }

    /* ------------------------------------------------------------------ render */
    function render() {
      var total = 0, nUn = 0;
      $$(".orb").forEach(function (o) {
        var on = !!state.lights[o.dataset.light];
        if (on) total++;
        o.setAttribute("aria-pressed", on ? "true" : "false"); o.dataset.on = on ? "1" : "0";
        var na = LIVE && isUnavail(sv(ENT.lights[o.dataset.light]));
        if (na) nUn++;
        o.classList.toggle("na", na);
        var stTxt = na ? "Ikke tilgængelig" : (on ? "Tændt" : "Slukket");
        if (LIVE && HOST.hasAttribute("data-lslider")) {
          var b = na ? null : lightBri(o.dataset.light), h = o._hold;
          if (h && (Date.now() > h.until || b === h.p || (b && Math.abs(b - h.p) <= 2))) h = o._hold = null;
          if (h) b = h.p;
          o.classList.toggle("dim", b !== null);
          if (b !== null && !o._drag) { o.style.setProperty("--bri", (on ? b : 0) + "%"); if (on) stTxt = "Tændt · " + b + "%"; }
        }
        if (!o._drag) $(".o-state", o).textContent = stTxt;
        refreshImg(o);
      });
      $$(".room").forEach(function (r) {
        var orbs = $$(".orb", r), n = orbs.filter(function (o) { return state.lights[o.dataset.light]; }).length;
        $(".count", r).textContent = n + "/" + orbs.length;
        $(".bar i", r).style.width = (n / orbs.length * 100) + "%";
      });
      $$(".wglow").forEach(function (w) { w.classList.toggle("on", !!state.lights[w.dataset.k]); });
      var a = ALARM[state.alarm] || ALARM.disarmed;
      var lt = total ? total + (total === 1 ? " lys tændt" : " lys tændt") : (LIVE ? "Intet lys tændt" : "Alt lys er slukket");
      if (LIVE && nUn) lt += " · " + nUn + (nUn === 1 ? " svarer ikke" : " svarer ikke");
      $("#status-text").textContent = lt + " · " + a.short;
      $$(".scene").forEach(function (b) { var act = b.dataset.scene === state.scene; b.classList.toggle("active", act); b.dataset.on = act ? "1" : "0"; refreshImg(b); });
    }

    /* ------------------------------------------------------------------ scene */
    function runScene(sc, b) {
      var onIds = [], offIds = [], skipped = 0;
      if (LIVE) {
        Object.keys(ENT.lights).forEach(function (k) { var s = sv(ENT.lights[k]); if (isUnavail(s)) { skipped++; return; } (sc.lights.indexOf(k) > -1 ? onIds : offIds).push(ENT.lights[k]); });
        if (onIds.length) call("homeassistant", "turn_on", { entity_id: onIds });
        if (offIds.length) call("homeassistant", "turn_off", { entity_id: offIds });
        if (sc.alarm) armAlarm(sc.alarm, true);
      } else if (sc.alarm) setAlarm(sc.alarm, true);
      Object.keys(state.lights).forEach(function (k) { state.lights[k] = sc.lights.indexOf(k) > -1; });
      state.scene = sc.id;
      var r = $(".s-img", b).getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, sc.s1, sc.s2);
      if (!LIVE) toast(sc.msg, sc.ic, sc.s1);
      else { toast("Scene " + sc.n + ": sender kommandoer…", sc.ic, sc.s1); later(function () { sceneReport(sc, onIds, offIds, skipped); }, 3200); }
      render();
    }
    /* il messaggio finale descrive lo stato letto da Home Assistant, non quello che speravamo */
    function sceneReport(sc, onIds, offIds, skipped) {
      var bad = 0, na = skipped, parts = [];
      syncLights();
      onIds.forEach(function (id) { var s = sv(id); if (isUnavail(s)) na++; else if (s.state !== "on") bad++; });
      offIds.forEach(function (id) { var s = sv(id); if (isUnavail(s)) na++; else if (s.state === "on") bad++; });
      parts.push(bad ? bad + (bad === 1 ? " lys svarede ikke" : " lys svarede ikke") : "lys som forventet");
      if (na) parts.push(na + (na === 1 ? " kan ikke nås" : " kan ikke nås"));
      if (sc.alarm) { var al = sv(ENT.alarm); parts.push($("#codebox").classList.contains("open") ? "alarm: kræver kode" : (al ? ALARM[mapAlarm(al.state)].short.toLowerCase() : "alarm ikke fundet")); }
      if (bad && state.scene === sc.id) state.scene = null;
      render();
      toast("Scene " + sc.n + ": " + parts.join(" · "), sc.ic, (bad || na) ? "var(--warn)" : sc.s1);
    }

    /* ------------------------------------------------------------------ allarme */
    function movePill() {
      var pill = $("#seg-pill"), btn = $('#seg button[aria-pressed="true"]');
      if (!pill) return;
      if (!btn || !btn.offsetWidth) { pill.style.opacity = btn ? 1 : 0; return; }
      pill.style.opacity = 1; pill.style.width = btn.offsetWidth + "px"; pill.style.transform = "translateX(" + (btn.offsetLeft - 5) + "px)";
    }
    function setAlarm(key, silent) {
      state.alarm = key;
      var a = ALARM[key] || ALARM.disarmed;
      HOST.dataset.alarm = a.s;
      $("#alarm").dataset.state = a.s;
      $("#alarm-title").textContent = a.t; $("#alarm-desc").textContent = a.d;
      $$("#seg button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.mode === key || (key === "arming" && b.dataset.mode === "armed_away") ? "true" : "false"); });
      $("#alert").hidden = key !== "triggered";
      $("#shield").dataset.img = a.art; refreshImg($("#shield"));
      movePill();
      if (!silent) { render(); toast(a.t, key === "disarmed" ? "mdi-shield-off" : "mdi-shield-check", key === "disarmed" ? "var(--ok)" : "var(--warn)"); }
    }
    var codeCb = null;
    function askCode(title, cb) {
      $("#code-sub").textContent = title; $("#code-in").value = ""; codeCb = cb;
      $("#codebox").classList.add("open"); $("#codebox").setAttribute("aria-hidden", "false");
      later(function () { $("#code-in").focus(); }, 200);
    }
    function closeCode() { $("#codebox").classList.remove("open"); $("#codebox").setAttribute("aria-hidden", "true"); codeCb = null; }
    function armAlarm(mode, fromScene) {
      var s = sv(ENT.alarm);
      if (!s) { toast("Alarmcentral ikke fundet", "mdi-alert-circle", "var(--warn)"); return; }
      var feat = s.attributes.supported_features || 0, svc, needCode;
      if (mode === "disarmed") { svc = "alarm_disarm"; needCode = !!s.attributes.code_format; }
      else if (mode === "armed_away") { svc = "alarm_arm_away"; needCode = !!s.attributes.code_format && s.attributes.code_arm_required !== false; }
      else { svc = (feat & 4) ? "alarm_arm_night" : "alarm_arm_home"; needCode = !!s.attributes.code_format && s.attributes.code_arm_required !== false; }
      var run = function (code) {
        var d = { entity_id: ENT.alarm }; if (code) d.code = code; call("alarm_control_panel", svc, d);
        if (!fromScene) later(function () {
          var a2 = sv(ENT.alarm), k2 = a2 ? mapAlarm(a2.state) : null;
          if (k2 === mode || (mode !== "disarmed" && (k2 === "arming" || k2 === "triggered"))) toast(ALARM[k2].t, k2 === "disarmed" ? "mdi-shield-off" : "mdi-shield-check", k2 === "disarmed" ? "var(--ok)" : "var(--warn)");
          else toast("Alarm: centralen udførte ikke kommandoen (forkert kode eller ikke tilgængelig)", "mdi-alert-circle", "var(--warn)");
        }, 3500);
      };
      if (needCode) askCode((s.attributes.friendly_name || "Alarm") + " · " + ALARM[mode].t, run); else run();
      if (!fromScene) toast(needCode ? "Kode kræves til: " + ALARM[mode].t : "Sender: " + ALARM[mode].t + "…", "mdi-shield-sync", "var(--warn)");
    }
    function mapAlarm(st) {
      if (st === "triggered") return "triggered";
      if (st === "arming" || st === "pending") return "arming";
      if (st === "armed_away" || st === "armed_vacation") return "armed_away";
      if (st && st.indexOf("armed") === 0) return "armed_night";
      return "disarmed";
    }

    /* ------------------------------------------------------------------ sensori */
    var lastMotion = null, lastAt = 0;
    function setMotionUI(key, act, na) {
      $$('[data-sensor="' + key + '"]').forEach(function (n) {
        n.classList.toggle("active", !!act); n.classList.toggle("na", !!na); n.dataset.on = act ? "1" : "0"; refreshImg(n);
        var st = $(".st-state", n); if (st) st.textContent = na ? "Ikke tilgængelig" : (act ? "Bevægelse!" : "Ingen bevægelse");
      });
    }
    function motion(key) {   // solo anteprima
      var label = motionLabel(key);
      setMotionUI(key, true, false);
      $("#hero-motion").textContent = "Bevægelse: " + label;
      lastMotion = label; lastAt = Date.now();
      later(function () { setMotionUI(key, false, false); $("#hero-motion").textContent = "Roligt i huset"; }, 3200);
    }
    function motionLoop() { if (!running) return; motion(MOTION[Math.floor(Math.random() * MOTION.length)][0]); later(motionLoop, 5200 + Math.random() * 3800); }
    function setOpenUI(id, open, na) {
      var o = OPENS[id]; OP[id] = open; OPNA[id] = !!na;
      $$('[data-op="' + id + '"]').forEach(function (n) {
        n.classList.toggle("open", open); n.classList.toggle("na", !!na); n.dataset.on = open ? "1" : "0"; refreshImg(n);
        var st = $(".st-state", n); if (st) st.textContent = na ? "Ikke tilgængelig" : (open ? o[2] : o[3]);
      });
      var n = Object.keys(OP).filter(function (k) { return OP[k] && (!LIVE || ENT.opens[k]); }).length;
      var nn = Object.keys(OPNA).filter(function (k) { return OPNA[k] && (!LIVE || ENT.opens[k]); }).length, off = nn ? nn + (nn === 1 ? " sensor offline" : " sensorer offline") : "";
      $("#open-sub").textContent = n === 0 ? (nn ? "Intet åbent · " + off : "Alt lukket") : n + (n === 1 ? " åbning aktiv" : " åbninger aktive") + (nn ? " · " + off : "");
    }
    function onOpenTap(id) { if (LIVE) moreInfo(ENT.opens[id]); else setOpenUI(id, !OP[id], false); }
    function lastMotionText() {
      if (!lastMotion) return;
      var s = Math.round((Date.now() - lastAt) / 1000), t = s < 4 ? "nu" : s < 60 ? s + " sek. siden" : s < 3600 ? Math.round(s / 60) + " min. siden" : Math.round(s / 3600) + " t. siden";
      $("#last-motion").textContent = "Seneste bevægelse: " + lastMotion + " · " + t + (motNa ? " · " + motNa + (motNa === 1 ? " sensor offline" : " sensorer offline") : "");
    }

    /* ------------------------------------------------------------------ viste + dock */
    function scrollTop0() { var o = { top: 0, behavior: reduce ? "auto" : "smooth" }; if (SCROLL === window) window.scrollTo(o); else SCROLL.scrollTo(o); }
    var VIEWS = { home: "#view-home", sic: "#view-sic", en: "#view-en" };
    /* Nordlys: wasteTab: true flytter Affald til sin egen fane i bundmenuen */
    if (CFG.wasteTab) { VIEWS.waste = "#view-waste"; var wwr = $("#waste-wrap"), vwa = $("#view-waste"); if (wwr && vwa) vwa.appendChild(wwr);
      var wdk = Array.isArray(CFG.dock) ? CFG.dock.map(function (x) { return String(x).toLowerCase(); }) : null, wbt = $('.dock [data-view="waste"]');
      if (wbt && (!wdk || wdk.indexOf("affald") > -1 || wdk.indexOf("waste") > -1)) wbt.hidden = false; }
    function show(which) {
      Object.keys(VIEWS).forEach(function (k) { var v = $(VIEWS[k]); if (k === which) { v.hidden = false; v.classList.remove("enter"); void v.offsetWidth; v.classList.add("enter"); } else v.hidden = true; });
      $$(".dock [data-view]").forEach(function (b) { if (b.dataset.view === which) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
      scrollTop0();
      if (LIVE) { if (which === "sic") camsEnter(); else camsStopAll(); }
      if (which === "en") enEnter();
      requestAnimationFrame(function () { movePill(); if (which === "home") { fxHero.resize(); } });
    }
    $$(".dock [data-view]").forEach(function (b) { b.addEventListener("click", function () { show(b.dataset.view); }); });
    $("#dock-scenes").addEventListener("click", function () { show("home"); later(function () { $("#scenes").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); }, 60); });
    $("#dock-off").addEventListener("click", function (e) {
      var r = e.currentTarget.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 10, "#A5B4FC", "#67E8F9");
      Object.keys(state.lights).forEach(function (k) { state.lights[k] = false; }); state.scene = null;
      if (!LIVE) { toast("Alt lys er slukket", "mdi-lightbulb-off-outline", "var(--acc-text)"); render(); return; }
      /* il comando va a TUTTE le luci configurate, senza fidarsi dello stato letto: ogni tanto un dispositivo risulta "non disponibile" o con lo stato in ritardo */
      var ids = Object.keys(ENT.lights).map(function (k) { return ENT.lights[k]; }).filter(function (id) { return !!sv(id); });
      if (!ids.length) { toast("Intet lys fundet: tjek entiteterne i konfigurationen", "mdi-alert-circle", "var(--warn)"); render(); return; }
      call("homeassistant", "turn_off", { entity_id: ids });
      toast("Slukker " + ids.length + " lys…", "mdi-lightbulb-off-outline", "var(--acc-text)");
      later(function () {
        var rest = ids.filter(function (id) { var s = sv(id); return s && (s.state === "on" || isUnavail(s)); });
        if (!rest.length) { syncLights(); render(); toast("Alt lys er slukket", "mdi-lightbulb-off-outline", "var(--ok)"); return; }
        call("homeassistant", "turn_off", { entity_id: rest });   /* secondo tentativo per chi non ha risposto */
        later(function () {
          syncLights(); render();
          var on = ids.filter(function (id) { var s = sv(id); return s && s.state === "on"; }).length, na = ids.filter(function (id) { return isUnavail(sv(id)); }).length;
          if (on) toast(on + (on === 1 ? " lys er stadig tændt" : " lys er stadig tændt") + (na ? " · " + na + (na === 1 ? " kan ikke nås" : " kan ikke nås") : ""), "mdi-alert-circle", "var(--warn)");
          else if (na) toast(na + (na === 1 ? " lys svarer ikke: ved ikke, om det er slukket" : " lys svarer ikke: ved ikke, om de er slukket"), "mdi-alert-circle", "var(--warn)");
          else toast("Alt lys er slukket", "mdi-lightbulb-off-outline", "var(--ok)");
        }, 3500);
      }, 3000);
      render();
    });
    $$("#seg button").forEach(function (b) { b.addEventListener("click", function () { if (LIVE) armAlarm(b.dataset.mode); else setAlarm(b.dataset.mode); }); });
    $("#sim-alarm").addEventListener("click", function () { show("sic"); setAlarm("triggered", true); render(); toast("Alarm udløst!", "mdi-alarm-light", "var(--danger)"); });
    $("#alert-off").addEventListener("click", function () { if (LIVE) armAlarm("disarmed"); else setAlarm("disarmed"); });
    $("#code-cancel").addEventListener("click", closeCode);
    $("#code-ok").addEventListener("click", function () { var c = $("#code-in").value, cb = codeCb; closeCode(); if (cb && c) cb(c); });
    $("#code-in").addEventListener("keydown", function (e) { if (e.key === "Enter") $("#code-ok").click(); });

    /* ------------------------------------------------------------------ mondo + ora del giorno */
    var S = { world: store("world") || "casetta", fx: store("fx") || "none", fxPage: store("fxpage") === "1", cycle: false, btn: ({ kompakt: "compact", kompakte: "compact", compact: "compact", billeder: "img", img: "img" })[String(CFG.buttons || "").toLowerCase()] || store("btn") || "img" }; /* Nordlys: buttons: kompakt|billeder låser knapstilen på alle enheder */
    if (!AMB.W[S.world]) S.world = "casetta";
    if (S.fx !== "none" && !FX.E[S.fx]) S.fx = "none";
    var drawerOpen = false;
    var clockLive = true, hour = 21, artFront = $("#art-a"), artBack = $("#art-b"), artKey = "", artTok = 0;
    var userName = "Alex", NONAME = (Array.isArray(CFG.hide) ? CFG.hide : []).some(function (x) { x = String(x).toLowerCase(); return x === "navn" || x === "name"; }), NOWIN = (Array.isArray(CFG.hide) ? CFG.hide : []).some(function (x) { x = String(x).toLowerCase(); return x === "vinduer" || x === "windows"; }); /* Nordlys: hide: vinduer = ingen lys i husets vinduer */
    var NOART = (Array.isArray(CFG.hide) ? CFG.hide : []).some(function (x) { x = String(x).toLowerCase(); return x === "landskab" || x === "landscape" || x === "hus-billede"; }); /* Nordlys: hide: landskab = ingen hus/landskab i toppen, kun ur og chips */

    function snap(h) { var q = clockLive ? 4 : 2; return Math.round(h * q) / q; }
    function setArt(force) {
      var h = snap(hour), key = S.world + "|" + h;
      if (NOART) return;
      if (key === artKey && !force) return;
      artKey = key;
      var tok = ++artTok, back = artBack;
      back.onload = function () { if (tok !== artTok) return; back.classList.add("show"); artFront.classList.remove("show"); artBack = artFront; artFront = back; };
      back.src = AMB.dataURL(S.world, h);
      if (drawerOpen) refreshWorldThumbs();
    }
    function buildWindows() {
      var layer = $("#win-layer"); layer.innerHTML = "";
      if (NOWIN) return;
      (AMB.W[S.world].windows || []).forEach(function (w) {
        var d = el("div", "wglow" + (state.lights[w.k] ? " on" : ""), "", { "data-k": w.k });
        d.style.left = (w.x / 640 * 100) + "%"; d.style.top = (w.y / 260 * 100) + "%"; d.style.width = (w.w / 640 * 100) + "%"; d.style.height = (w.h / 260 * 100) + "%";
        layer.appendChild(d);
      });
    }
    function applyWorld() {
      $("#hero-tag-text").textContent = AMB.W[S.world].name;
      buildWindows(); setArt(true); store("world", S.world);
      $$(".wcard").forEach(function (c) { c.classList.toggle("sel", c.dataset.world === S.world); });
    }
    function setWorld(id, quiet) { S.world = id; applyWorld(); if (!quiet) toast("Verden: " + AMB.W[id].name, AMB.W[id].icon, "var(--acc-text)"); }
    function applyHour(h) {
      hour = h;
      var K = AMB.palette(h);
      ["b1", "b2", "b3", "a1", "a2"].forEach(function (k) { HOST.style.setProperty("--" + k, K[k]); });
      HOST.style.setProperty("--win", K.win);
      var hh = Math.floor(h) % 24, mm = Math.round((h - Math.floor(h)) * 60);
      if (mm === 60) { mm = 0; hh = (hh + 1) % 24; }
      $("#clock").innerHTML = pad(hh) + '<span class="colon">:</span>' + pad(mm);
      $("#phase-out").textContent = pad(hh) + ":" + pad(mm);
      $("#phase-range").value = h;
      setIco($("#phase-icon"), K.dy < .12 ? "mdi-weather-night" : K.dy > .8 ? "mdi-weather-sunny" : (h < 12 ? "mdi-weather-sunset-up" : "mdi-weather-sunset-down"));
      var gr = (h >= 22 || h < 5) ? "Godnat" : h < 12 ? "Godmorgen" : h < 18 ? "God eftermiddag" : "Godaften";
      $("#greet").textContent = gr + (NONAME ? "" : ", " + userName);
      setArt();
    }
    function tickClock() { if (!clockLive) return; var d = new Date(); applyHour(d.getHours() + d.getMinutes() / 60); }
    var months = ["januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"];
    var days = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
    function tickDate() { var n = new Date(); $("#date-text").textContent = days[n.getDay()] + " " + n.getDate() + ". " + months[n.getMonth()]; }
    $("#phase-range").addEventListener("input", function (e) { clockLive = false; applyHour(parseFloat(e.target.value)); });
    $("#phase-real").addEventListener("click", function () { clockLive = true; tickClock(); toast("Rigtig tid er gendannet", "mdi-clock-outline", "var(--acc-text)"); });

    /* ------------------------------------------------------------------ effetti */
    var fxHero = new FX.Fx($("#fx-hero"), { k: 1, alpha: 1, onFlash: flash });
    var fxPage = new FX.Fx($("#fx-page"), { k: .55, alpha: .6, onFlash: flash });
    function flash(a) { HOST.style.setProperty("--flash", a.toFixed(3)); }
    function applyFx() {
      fxHero.set(S.fx); fxPage.set(S.fxPage ? S.fx : "none");
      store("fx", S.fx); store("fxpage", S.fxPage ? "1" : "0");
      $$(".fxchip").forEach(function (c) { c.classList.toggle("sel", c.dataset.fx === S.fx); });
      $("#fx-page-toggle").setAttribute("aria-pressed", S.fxPage ? "true" : "false");
    }

    /* ------------------------------------------------------------------ tema + stile pulsanti */
    function setTheme(t) { HOST.dataset.theme = t; setIco($("#theme-ico"), t === "dark" ? "mdi-weather-night" : "mdi-white-balance-sunny"); store("theme", t); }
    $("#theme-btn").addEventListener("click", function () { setTheme(HOST.dataset.theme === "dark" ? "light" : "dark"); });
    function setBtn(v) { S.btn = v; HOST.dataset.btn = v; store("btn", v); $$("#btn-style button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === v ? "true" : "false"); }); }

    /* ------------------------------------------------------------------ pannello Stile */
    function buildDrawer() {
      var w = $("#worlds");
      Object.keys(AMB.W).forEach(function (id) {
        var d = AMB.W[id], b = el("button", "wcard", '<img alt="" draggable="false"><span><i class="mdi ' + d.icon + '"></i>' + d.name + "</span>", { type: "button", "data-world": id, title: d.desc });
        b.addEventListener("click", function () { setWorld(id); });
        w.appendChild(b);
      });
      var fg = $("#fxgrid");
      var none = el("button", "fxchip", "<i class=\"mdi mdi-cancel\"></i>Ingen", { type: "button", "data-fx": "none" });
      none.addEventListener("click", function () { S.fx = "none"; applyFx(); });
      fg.appendChild(none);
      Object.keys(FX.E).forEach(function (id) {
        var e = FX.E[id], c = el("button", "fxchip", '<i class="mdi ' + e.icon + '"></i>' + e.name, { type: "button", "data-fx": id });
        c.addEventListener("click", function () { S.fx = id; applyFx(); });
        fg.appendChild(c);
      });
    }
    function refreshWorldThumbs() { $$(".wcard").forEach(function (c) { $("img", c).src = AMB.dataURL(c.dataset.world, snap(hour)); }); }
    function openDrawer() { drawerOpen = true; refreshWorldThumbs(); $("#drawer").classList.add("open"); $("#drawer").setAttribute("aria-hidden", "false"); $("#scrim").classList.add("open"); later(function () { $("#dr-close").focus({ preventScroll: true }); }, 350); }
    function closeDrawer() { drawerOpen = false; $("#drawer").classList.remove("open"); $("#drawer").setAttribute("aria-hidden", "true"); $("#scrim").classList.remove("open"); }
    ["style-btn", "hint-style", "dock-style", "hero-tag"].forEach(function (id) { $("#" + id).addEventListener("click", openDrawer); });
    $("#dr-close").addEventListener("click", closeDrawer); $("#scrim").addEventListener("click", closeDrawer);
    $("#fx-page-toggle").addEventListener("click", function () { S.fxPage = !S.fxPage; applyFx(); });
    var cycleT = 0;
    $("#cycle-toggle").addEventListener("click", function () {
      S.cycle = !S.cycle; this.setAttribute("aria-pressed", S.cycle ? "true" : "false"); clearInterval(cycleT);
      if (S.cycle) { cycleT = setInterval(function () { var ids = Object.keys(AMB.W), i = ids.indexOf(S.world); setWorld(ids[(i + 1) % ids.length], true); }, 30000); timers.push(cycleT); toast("Verdenen skifter hvert 30. sekund", "mdi-shuffle-variant", "var(--acc-text)"); }
    });
    $$("#btn-style button").forEach(function (b) { b.addEventListener("click", function () { setBtn(b.dataset.v); }); });
    $("#reset-all").addEventListener("click", function () { try { Object.keys(localStorage).filter(function (k) { return k.indexOf("aurora-v3-") === 0; }).forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {} location.reload(); });

    /* ------------------------------------------------------------------ modalità modifica + editor */
    function setEdit(onOff) { if (onOff) HOST.dataset.edit = "1"; else delete HOST.dataset.edit; $("#edit-banner").hidden = !onOff; }
    $("#edit-start").addEventListener("click", function () { closeDrawer(); setEdit(true); show("home"); });
    $("#hint-edit").addEventListener("click", function () { setEdit(true); });
    $("#edit-done").addEventListener("click", function () { setEdit(false); });
    on(ROOT, "click", function (e) {
      if (HOST.dataset.edit !== "1" || e.target.closest("#editor") || e.target.closest("#edit-banner") || e.target.closest("#drawer") || e.target.closest(".topbar") || e.target.closest(".dock")) return;
      var t = e.target.closest("[data-img]");
      if (!t) return;
      e.preventDefault(); e.stopPropagation(); openEditor(t);
    }, true);

    var edBase = "", edOv = "", edTab = 0;
    function openEditor(node) {
      edBase = node.dataset.img; edOv = node.dataset.ov || edBase;
      var b = IMG[edBase]; edTab = 0;
      LIBGROUPS.forEach(function (g2, i) { if (edBase.indexOf(g2[1]) === 0) edTab = i; });
      $("#ed-title").textContent = node.dataset.label || "Skift billede";
      $("#ed-sub").textContent = b.kind === "pair" ? "Et billede til slukket (PNG) og et til tændt (gerne en animeret GIF)" : "Billedet, der vises i denne tilstand";
      renderEditor();
      $("#editor").classList.add("open"); $("#editor").setAttribute("aria-hidden", "false");
    }
    function closeEditor() { $("#editor").classList.remove("open"); $("#editor").setAttribute("aria-hidden", "true"); }
    function slotHTML(label, slot) {
      return '<div class="slot"><h4>' + label + '</h4><label class="drop" data-slot="' + slot + '"><img alt="" src="' + resolve(edOv, edBase, slot === "on") + "\"><span class=\"hintt\">Klik eller træk en fil hertil</span><input type=\"file\" accept=\"image/*\"></label></div>";
    }
    function renderEditor() {
      var b = IMG[edBase], slots = $("#ed-slots");
      if (b.kind === "pair") { slots.className = "slots"; slots.innerHTML = slotHTML("Slukket", "off") + slotHTML("Tændt", "on"); }
      else { slots.className = "slots one"; slots.innerHTML = "<div class=\"slot\"><h4>Billede</h4><label class=\"drop\" data-slot=\"src\"><img alt=\"\" src=\"" + resolve(edOv, edBase, true) + "\"><span class=\"hintt\">Klik eller træk en fil hertil</span><input type=\"file\" accept=\"image/*\"></label></div>"; }
      $$(".drop", slots).forEach(function (d) {
        var slot = d.dataset.slot;
        $("input", d).addEventListener("change", function (e) { if (e.target.files[0]) readFile(e.target.files[0], slot); });
        d.addEventListener("dragover", function (e) { e.preventDefault(); d.classList.add("over"); });
        d.addEventListener("dragleave", function () { d.classList.remove("over"); });
        d.addEventListener("drop", function (e) { e.preventDefault(); d.classList.remove("over"); if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0], slot); });
      });
      var tabs = $("#lib-tabs"); tabs.innerHTML = "";
      LIBGROUPS.forEach(function (g2, i) { var t = el("button", "", g2[0], { type: "button", "aria-pressed": i === edTab ? "true" : "false" }); t.addEventListener("click", function () { edTab = i; renderEditor(); }); tabs.appendChild(t); });
      var lib = $("#lib"); lib.innerHTML = "";
      Object.keys(IMG).filter(function (k) { return k.indexOf(LIBGROUPS[edTab][1]) === 0; }).forEach(function (k) {
        var it = IMG[k], c = el("button", "", '<img alt="" src="' + (it.kind === "pair" ? it.off : it.src) + '"><span>' + LIBNAMES[k] + "</span>", { type: "button", title: LIBNAMES[k] });
        if (it.kind === "pair") { c.addEventListener("mouseenter", function () { $("img", c).src = it.on; }); c.addEventListener("mouseleave", function () { $("img", c).src = it.off; }); }
        c.addEventListener("click", function () { applyLib(k); });
        lib.appendChild(c);
      });
    }
    function readFile(file, slot) {
      if (!/^image\//.test(file.type)) { toast("Vælg en billedfil (PNG, JPG, GIF, WebP)", "mdi-alert-circle", "var(--warn)"); return; }
      if (file.size > 3 * 1024 * 1024) { toast("Filen er for stor (maks. 3 MB)", "mdi-alert-circle", "var(--warn)"); return; }
      var fr = new FileReader();
      fr.onload = function () {
        var prev = OV[edOv] ? JSON.parse(JSON.stringify(OV[edOv])) : null;
        OV[edOv] = OV[edOv] || {}; OV[edOv][slot] = fr.result;
        if (!saveOV()) { if (prev) OV[edOv] = prev; else delete OV[edOv]; return; }
        refreshAll(); renderEditor(); toast("Billedet er opdateret", "mdi-image-check", "var(--ok)");
      };
      fr.readAsDataURL(file);
    }
    function applyLib(k) {
      var it = IMG[k], b = IMG[edBase];
      if (b.kind === "pair") OV[edOv] = { off: it.off || it.src, on: it.on || it.src }; else OV[edOv] = { src: it.on || it.src };
      saveOV(); refreshAll(); renderEditor(); toast("Billedet «" + LIBNAMES[k] + "» er sat ind", "mdi-image-check", "var(--ok)");
    }
    $("#ed-reset").addEventListener("click", function () { delete OV[edOv]; saveOV(); refreshAll(); renderEditor(); toast("Det originale billede er gendannet", "mdi-restore", "var(--acc-text)"); });
    $("#ed-done").addEventListener("click", closeEditor); $("#ed-close").addEventListener("click", closeEditor);
    $("#editor").addEventListener("click", function (e) { if (e.target === this) closeEditor(); });
    on(document, "keydown", function (e) { if (e.key === "Escape") { if ($("#codebox").classList.contains("open")) closeCode(); else if ($("#editor").classList.contains("open")) closeEditor(); else if (drawerOpen) closeDrawer(); else if (HOST.dataset.edit === "1") setEdit(false); } });

    /* ------------------------------------------------------------------ Home Assistant: sincronizzazione */
    var tracked = {};
    function trackedIds() {
      var ids = [ENT.alarm, ENT.weather, ENT.temperature, ENT.power, ENT.climate];
      Object.keys(ENT.lights).forEach(function (k) { ids.push(ENT.lights[k]); });
      Object.keys(ENT.motion).forEach(function (k) { (ENT.motion[k] || []).forEach(function (i) { ids.push(i); }); });
      Object.keys(ENT.opens).forEach(function (k) { ids.push(ENT.opens[k]); });
      (ENT.cameras || []).forEach(function (c) { if (c.cam) ids.push(c.cam); });
      Object.keys(ENT.energy).forEach(function (k) { var v = ENT.energy[k]; if (typeof v === 'string' && v.indexOf('.') > 0) ids.push(v); });
      ENT.energy.appliances.forEach(function (x) { ids.push(x.p); if (x.e) ids.push(x.e); });
      wasteList().forEach(function (x) { ids.push(x.e); });
      return ids.filter(Boolean);
    }
    function condIcon(c) { return { sunny: "mdi-weather-sunny", "clear-night": "mdi-weather-night", cloudy: "mdi-weather-cloudy", partlycloudy: "mdi-weather-partly-cloudy", rainy: "mdi-weather-rainy", pouring: "mdi-weather-pouring", snowy: "mdi-weather-snowy", "snowy-rainy": "mdi-weather-snowy-rainy", fog: "mdi-weather-fog", lightning: "mdi-weather-lightning", "lightning-rainy": "mdi-weather-lightning-rainy", windy: "mdi-weather-windy", hail: "mdi-weather-hail" }[c] || "mdi-weather-partly-cloudy"; }
    function fmt(n, d) { return Number(n).toLocaleString("da-DK", { maximumFractionDigits: d === undefined ? 1 : d }); }
    function syncLights() { var now = Date.now(); Object.keys(ENT.lights).forEach(function (k) { var s = sv(ENT.lights[k]), on = !!s && s.state === "on", p = LPEND[k]; if (p) { if ((on === p.want && s !== p.s0) || now > p.until || isUnavail(s)) delete LPEND[k]; else { state.lights[k] = p.want; return; } } state.lights[k] = on; }); }
    /* Nordlys: waste = affaldssensorer (fx Affaldshåndtering DK). Liste af entity_id eller { e, n } */
    function wasteList() { return (Array.isArray(CFG.waste) ? CFG.waste : []).map(function (x) { return typeof x === "string" ? { e: x } : { e: x && (x.e || x.entity), n: x && (x.n || x.name) }; }).filter(function (x) { return x.e; }); }
    function renderWaste() {
      var wrap = $("#waste-wrap"), box = $("#waste"), L = wasteList(); if (!wrap || !box) return;
      if (!L.length) { wrap.hidden = true; return; }
      var html = L.map(function (x, i) {
        var s = sv(x.e), a = (s && s.attributes) || {}, na = isUnavail(s), d = na ? NaN : parseInt(s.state, 10);
        var nm = x.n || a.name || a.friendly_name || x.e, dur = na ? "Ikke tilgængelig" : (d === 0 ? "I dag" : d === 1 ? "I morgen" : (a.duration || ("Om " + s.state + " dage")));
        var pic = a.entity_picture ? '<img src="' + a.entity_picture + '" alt="" draggable="false">' : '<i class="mdi mdi-trash-can-outline"></i>';
        return '<button class="wtile' + (d <= 1 ? " soon" : "") + (na ? " na" : "") + '" type="button" data-i="' + i + '">' + pic + "<b>" + nm + "</b><small>" + dur + "</small></button>";
      }).join("");
      wrap.hidden = false;
      if (box.dataset.sig !== html) { box.dataset.sig = html; box.innerHTML = html; hydrate(box); $$(".wtile", box).forEach(function (b) { b.addEventListener("click", function () { if (LIVE) moreInfo(L[+b.dataset.i].e); }); }); }
    }
    function syncLive(first) {
      renderWaste();
      // luci
      syncLights();
      // scena evidenziata solo finché lo stato coincide
      if (state.scene) { var sc = SCENES.filter(function (x) { return x.id === state.scene; })[0]; if (sc && Object.keys(ENT.lights).some(function (k) { return !isUnavail(sv(ENT.lights[k])) && (sc.lights.indexOf(k) > -1) !== state.lights[k]; })) state.scene = null; }
      // allarme
      var a = sv(ENT.alarm);
      if (a) { var key = mapAlarm(a.state); if (key !== state.alarm || first) setAlarm(key, true); var eb = $(".alarm-txt .eyebrow"); if (eb && a.attributes.friendly_name) eb.textContent = a.attributes.friendly_name; }
      // movimento
      var act = null, newest = null, mTot = 0, mNa = 0;
      MOTION.forEach(function (m) {
        var id = availId(ENT.motion[m[0]] || []), s = sv(id), na = isUnavail(s), isOn = !!s && s.state === "on";
        setMotionUI(m[0], isOn, na);
        if (hasMotion(m[0])) { mTot++; if (na) mNa++; }
        if (isOn && !act) act = m[1];
        if (s && !na && s.last_changed && (!newest || new Date(s.last_changed) > newest.t)) newest = { t: new Date(s.last_changed), label: m[1] };
      });
      motNa = mNa;
      $("#hero-motion").textContent = act ? "Bevægelse: " + act : (mTot && mNa === mTot ? "Bevægelsessensorer offline" : mNa ? "Ingen bevægelse · " + mNa + (mNa === 1 ? " sensor offline" : " sensorer offline") : "Roligt i huset");
      if (newest) { lastMotion = newest.label; lastAt = newest.t.getTime(); lastMotionText(); } else $("#last-motion").textContent = mTot && mNa === mTot ? "Ingen bevægelsessensor svarer" : "Ingen nylig bevægelse";
      // aperture
      Object.keys(OPENS).forEach(function (id) {
        if (!ENT.opens[id]) return;
        var s = sv(ENT.opens[id]), na = isUnavail(s), open = !!s && (s.state === "on" || s.state === "open" || s.state === "unlocked" || s.state === "unlocking" || s.state === "jammed");
        setOpenUI(id, open, na);
      });
      // chip meteo e consumi
      var w = sv(ENT.weather), ct = $("#chip-temp");
      /* Nordlys: entities.temperature = en temperatursensor (fx Netatmo); vejrikonet kommer stadig fra weather */
      var ts = sv(ENT.temperature);
      if (ts && !isUnavail(ts) && !isNaN(parseFloat(ts.state))) { ct.hidden = false; $("#temp-val").textContent = fmt(parseFloat(ts.state)) + " " + (ts.attributes.unit_of_measurement || "°C"); setIco($("#temp-ico"), w ? condIcon(w.state) : "mdi-thermometer"); }
      else if (w && w.attributes.temperature !== undefined) { ct.hidden = false; $("#temp-val").textContent = fmt(w.attributes.temperature) + " " + (w.attributes.temperature_unit || "°C"); setIco($("#temp-ico"), condIcon(w.state)); } else ct.hidden = true;
      var p = sv(ENT.energy.power) || sv(ENT.power), cp = $("#chip-power");
      if (p && !isUnavail(p) && !isNaN(parseFloat(p.state))) { cp.hidden = false; var v = parseFloat(p.state), u = p.attributes.unit_of_measurement || "W"; if (u === "kW") v *= 1000; chipPower(v); } else cp.hidden = true;
      var nm = HASS && HASS.user && HASS.user.name ? HASS.user.name.split(" ")[0] : "";
      if (nm && nm !== userName) { userName = nm; tickClock(); if (!clockLive) applyHour(hour); }
      climaFromHass(); renderClima();
      var enBtn = $('.dock [data-view="en"]'); if (enBtn) enBtn.hidden = !(sv(ENT.energy.power) || sv(ENT.power));
      renderEnergy(); if (!$("#view-en").hidden) enLoad(false);
      camsStatus();
      render();
    }
    /* ---- telecamere: anteprima (snapshot) aggiornata + diretta a tocco ---- */
    var camTiles = [];
    function camRefresh(t) {
      var s = sv(t.c.img), ep = s && s.attributes.entity_picture;
      if (!ep) { t.im.hidden = true; t.na.hidden = false; return; }
      t.last = Date.now();
      t.im.onload = function () { t.im.hidden = false; t.na.hidden = true; camMeta(t); };
      t.im.onerror = function () { t.im.hidden = true; t.na.hidden = false; camMeta(t); };
      t.im.src = ep + (ep.indexOf("?") > -1 ? "&" : "?") + "_t=" + Date.now();
    }
    function camWhen(iso) {
      var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || "");
      if (!m) return "";
      var now = new Date(), same = now.getFullYear() == m[1] && (now.getMonth() + 1) == +m[2] && now.getDate() == +m[3];
      return (same ? "i dag " : m[3] + "/" + m[2] + " ") + m[4] + ":" + m[5];
    }
    function camOffline(t) { return !!t.c.cam && isUnavail(sv(t.c.cam)); }
    function camMeta(t) {
      var off = camOffline(t), ok = !t.im.hidden, d = new Date(), parts = [];
      if (t.c.kind === "motion") { var s = sv(t.c.img), w = s && camWhen(s.state); if (w) parts.push("Seneste bevægelse " + w); }
      else if (ok) parts.push("Billede hentet kl. " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()));
      t.meta.textContent = parts.join(" · ");
      if (t.off) t.off.hidden = !off;
      var msg = t.na.querySelector("span");
      if (msg) msg.innerHTML = off ? "Kamera offline<br>HA kan ikke nå det lige nu" : "Forhåndsvisning ikke tilgængelig<br>tryk for at åbne kameraet";
    }
    function camsStatus() { camTiles.forEach(camMeta); }
    function camLive(t, onOff) {
      if (!t.c.live || !window.loadCardHelpers) return;
      clearTimeout(t.timer);
      if (onOff) {
        window.loadCardHelpers().then(function (h) {
          try { var e = h.createCardElement({ type: "picture-entity", entity: t.c.live, camera_view: "live", show_name: false, show_state: false }); e.hass = HASS; t.liveBox.innerHTML = ""; t.liveBox.appendChild(e); t.liveEl = e; }
          catch (err) { toast("Live ikke tilgængelig", "mdi-alert-circle", "var(--warn)"); return; }
          t.liveBox.hidden = false; t.im.hidden = true; t.na.hidden = true; t.bLive.classList.add("on"); t.bLive.querySelector("span").textContent = "Stop";
          t.timer = setTimeout(function () { camLive(t, false); }, 120000);
        });
      } else {
        if (t.liveEl) { t.liveBox.innerHTML = ""; t.liveEl = null; }
        t.liveBox.hidden = true; t.bLive.classList.remove("on"); t.bLive.querySelector("span").textContent = "Live"; t.im.hidden = false; camRefresh(t);
      }
    }
    function camsStopAll() { camTiles.forEach(function (t) { if (t.liveEl) camLive(t, false); }); }
    function camsEnter() { camTiles.forEach(function (t) { if (!t.liveEl) camRefresh(t); }); }
    function camsTick() {
      if (!LIVE || !camTiles.length || $("#view-sic").hidden || document.hidden) return;
      camTiles.forEach(function (t) { if (!t.liveEl && t.c.poll && Date.now() - t.last > t.c.poll * 1000) camRefresh(t); });
    }
    function buildCams() {
      var box = $("#cams");
      if (!box) return;
      box.innerHTML = ""; camTiles = [];
      var list = (ENT.cameras || []).filter(function (c) { return sv(c.img) || sv(c.live) || sv(c.cam); });
      if (!list.length) { box.hidden = true; return; }
      list.forEach(function (c) {
        var card = el("article", "card cam",
          '<div class="cam-head"><h4>' + c.n + '</h4><span class="cam-off" hidden>Offline</span><span class="cam-meta"></span>' +
          "<button class=\"cbtn\" type=\"button\" data-a=\"refresh\" title=\"Opdatér forhåndsvisning\"><i class=\"mdi mdi-refresh\"></i></button>" +
          (c.live ? "<button class=\"cbtn go\" type=\"button\" data-a=\"live\"><i class=\"mdi mdi-play-circle\"></i><span>Live</span></button>" : "") +
          "<button class=\"cbtn\" type=\"button\" data-a=\"open\" title=\"Åbn\"><i class=\"mdi mdi-arrow-expand\"></i></button></div>" +
          '<div class="feed-live"><img class="cam-img" alt="" draggable="false"><div class="live-box" hidden></div>' +
          "<div class=\"cam-na\" hidden><i class=\"mdi mdi-video-off-outline\"></i><span>Forhåndsvisning ikke tilgængelig<br>tryk for at åbne kameraet</span></div></div>");
        box.appendChild(card);
        hydrate(card);
        var t = { c: c, last: 0, im: $(".cam-img", card), na: $(".cam-na", card), liveBox: $(".live-box", card), meta: $(".cam-meta", card), off: $(".cam-off", card), bLive: $('[data-a="live"]', card), liveEl: null, timer: 0 };
        camTiles.push(t);
        $('[data-a="refresh"]', card).addEventListener("click", function () { camRefresh(t); });
        if (t.bLive) t.bLive.addEventListener("click", function () { camLive(t, !t.liveEl); });
        var target = c.live || c.cam || c.img;
        $('[data-a="open"]', card).addEventListener("click", function () { moreInfo(target); });
        t.na.addEventListener("click", function () { moreInfo(target); });
        t.im.addEventListener("click", function () { moreInfo(target); });
      });
      camsEnter();
    }
    function setHass(h) {
      var firstTime = !HASS;
      HASS = h;
      if (!LIVE) return;
      var dirty = firstTime, ids = trackedIds();
      for (var i = 0; i < ids.length; i++) { var s = h.states[ids[i]]; if (tracked[ids[i]] !== s) { tracked[ids[i]] = s; dirty = true; } }
      if (dirty) syncLive(firstTime);
      if (firstTime) buildCams();
      for (var j = 0; j < camTiles.length; j++) if (camTiles[j].liveEl) camTiles[j].liveEl.hass = h;
    }

    /* ------------------------------------------------------------------ clima (Panasonic) */
    var CL_MODES = [["off", "Slukket", "mdi-power"], ["heat_cool", "Auto", "mdi-thermostat-auto"], ["cool", "Køl", "mdi-snowflake"], ["dry", "Affugt", "mdi-water-percent"], ["fan_only", "Blæser", "mdi-fan"], ["heat", "Varme", "mdi-fire"]];
    var CL_COL = { off: "#64748B", cool: "#38BDF8", heat: "#FB923C", dry: "#2DD4BF", fan_only: "#A5B4FC", heat_cool: "#C084FC" };
    var CL_STATUS = { off: "Slukket", cool: "Køler", heat: "Varmer", dry: "Affugter", fan_only: "Kun blæser", heat_cool: "Automatisk" };
    var CL_IT = { Auto: "Auto", Low: "Laveste", LowMid: "Lav", Mid: "Mellem", HighMid: "Høj", High: "Højeste", Up: "Op", UpMid: "Mellem-op", DownMid: "Mellem-ned", Down: "Ned", Left: "Venstre", LeftMid: "Midt-venstre", RightMid: "Midt-højre", Right: "Højre", none: "Normal", quiet: "Stille", powerful: "Kraftig", eco: "Eco", boost: "Boost", comfort: "Comfort", sleep: "Nat", away: "Væk" };
    function it(k) { return CL_IT[k] || k; }
    var clima = { avail: true, name: "Klimaanlæg", mode: "off", action: "off", cur: 23, tgt: 25, min: 16, max: 30, step: .5, modes: ["off", "heat_cool", "cool", "dry", "fan_only", "heat"],
      fan: "Auto", fans: ["Auto", "Low", "LowMid", "Mid", "HighMid", "High"], swing: "Up", swings: ["Auto", "Up", "UpMid", "Mid", "DownMid", "Down"], hswing: "Auto", hswings: ["Auto", "Left", "LeftMid", "Mid", "RightMid", "Right"], preset: "none", presets: ["none", "quiet", "powerful"] };
    var clTimer = 0;
    function climaFromHass() {
      var s = sv(ENT.climate);
      if (!s) { clima.avail = false; return; }
      var a = s.attributes;
      clima.avail = s.state !== "unavailable";
      clima.name = a.friendly_name || clima.name; clima.mode = (s.state === "unavailable" || s.state === "unknown") ? "off" : s.state; clima.action = a.hvac_action || "";
      if (a.current_temperature !== undefined && a.current_temperature !== null) clima.cur = a.current_temperature;
      if (a.temperature !== undefined && a.temperature !== null && !clTimer) clima.tgt = a.temperature;
      clima.min = a.min_temp || 16; clima.max = a.max_temp || 30; clima.step = a.target_temp_step || a.target_temperature_step || .5;
      clima.modes = a.hvac_modes || clima.modes;
      clima.fan = a.fan_mode; clima.fans = a.fan_modes || []; clima.swing = a.swing_mode; clima.swings = a.swing_modes || [];
      clima.hswing = a.swing_horizontal_mode; clima.hswings = a.swing_horizontal_modes || []; clima.preset = a.preset_mode; clima.presets = a.preset_modes || [];
    }
    function climaArt() {
      var m = clima.mode;
      if (m === "off") return "clima_off";
      if (m === "cool") return "clima_cool";
      if (m === "heat") return "clima_heat";
      if (m === "dry") return "clima_dry";
      if (m === "fan_only") return "clima_fan";
      return clima.action === "heating" ? "clima_heat" : clima.action === "cooling" ? "clima_cool" : "clima_auto";
    }
    function fillSel(id, list, cur) {
      var sel = $(id), w = sel.closest("label");
      if (!list || !list.length) { w.hidden = true; return; }
      w.hidden = false; var sig = list.join("|");
      if (sel.dataset.sig !== sig) { sel.innerHTML = list.map(function (k) { return '<option value="' + k + '">' + it(k) + "</option>"; }).join(""); sel.dataset.sig = sig; }
      sel.value = cur;
    }
    function renderClima() {
      var wrap = $("#clima-wrap"), box = $("#clima");
      if (!wrap) return;
      if (LIVE && !sv(ENT.climate)) { wrap.hidden = true; return; }
      wrap.hidden = false;
      var m = clima.mode, col = CL_COL[m] || CL_COL.off;
      box.style.setProperty("--cl", col); box.dataset.mode = m; box.classList.toggle("na", !clima.avail);
      $("#cl-name").textContent = clima.name; $("#cl-sub").textContent = clima.name;
      var st = !clima.avail ? "Ikke tilgængelig" : (CL_STATUS[m] || m);
      if (clima.avail && m !== "off" && clima.action === "idle") st += " · på pause";
      $("#cl-status").textContent = st;
      $("#cl-cur").textContent = "Inde " + fmt(clima.cur) + " °C";
      var hint = "";
      if (!clima.avail) hint = "Klimaanlægget svarer ikke: tjek forbindelsen.";
      else if (m === "cool" && clima.action !== "cooling" && clima.tgt >= clima.cur) hint = "Tændt, men på pause: indenfor er der " + fmt(clima.cur) + "°, og du har valgt " + fmt(clima.tgt) + "°. Sænk temperaturen for at starte køling.";
      else if (m === "heat" && clima.action !== "heating" && clima.tgt <= clima.cur) hint = "Tændt, men på pause: indenfor er der " + fmt(clima.cur) + "°, og du har valgt " + fmt(clima.tgt) + "°. Hæv temperaturen for at starte opvarmning.";
      var hn = $("#cl-hint"); hn.textContent = hint; hn.hidden = !hint;
      $("#cl-tgt").textContent = Number(clima.tgt).toLocaleString("da-DK", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      var art = $("#cl-art"); art.dataset.img = climaArt(); refreshImg(art);
      var mw = $("#cl-modes"), msig = clima.modes.join("|") + "#" + m;
      if (mw.dataset.sig !== msig) {
        mw.dataset.sig = msig; mw.innerHTML = "";
        CL_MODES.filter(function (x) { return clima.modes.indexOf(x[0]) > -1; }).forEach(function (x) {
          var b = el("button", "cchip", '<i class="mdi ' + x[2] + '"></i>' + x[1], { type: "button", "data-mode": x[0], "aria-pressed": x[0] === m ? "true" : "false" });
          b.style.setProperty("--cl", CL_COL[x[0]]); mw.appendChild(b);
        });
      }
      var fw = $("#cl-fans"), fsig = clima.fans.join("|") + "#" + clima.fan; $("#cl-fan-sec").hidden = !clima.fans.length;
      if (fw.dataset.sig !== fsig) {
        fw.dataset.sig = fsig; fw.innerHTML = "";
        clima.fans.forEach(function (k) { fw.appendChild(el("button", "cchip sm", it(k), { type: "button", "data-fan": k, "aria-pressed": k === clima.fan ? "true" : "false" })); });
      }
      fillSel("#cl-swing", clima.swings, clima.swing); fillSel("#cl-hswing", clima.hswings, clima.hswing); fillSel("#cl-preset", clima.presets, clima.preset);
      $("#cl-minus").disabled = $("#cl-plus").disabled = !clima.avail;
    }
    function climaCall(svc, data, local) {
      if (LIVE) { var d = { entity_id: ENT.climate }; Object.keys(data || {}).forEach(function (k) { d[k] = data[k]; }); call("climate", svc, d); }
      if (local) local();
      renderClima();
    }
    function climaToast(m, nt) {
      var lab = (CL_MODES.filter(function (x) { return x[0] === m; })[0] || [0, m])[1];
      if (!LIVE) { toast("Klima: " + CL_STATUS[m] + (nt !== null ? " a " + fmt(nt) + "° (inde " + fmt(clima.cur) + "°)" : ""), "mdi-air-conditioner", CL_COL[m]); return; }
      toast("Klima: kommandoen «" + lab + "»" + (nt !== null ? " a " + fmt(nt) + "°" : "") + " er sendt", "mdi-air-conditioner", CL_COL[m]);
    }
    function buildClima() {
      if (!$("#clima")) return;
      $("#cl-modes").addEventListener("click", function (e) {
        var b = e.target.closest("[data-mode]"); if (!b) return; var m = b.dataset.mode, wasOff = clima.mode === "off";
        if (LIVE && !clima.avail) { toast("Klimaanlægget kan ikke nås: ingen kommando sendt", "mdi-alert-circle", "var(--warn)"); return; }
        climaCall(m === "off" ? "turn_off" : "set_hvac_mode", m === "off" ? {} : { hvac_mode: m }, function () { clima.mode = m; clima.action = m === "off" ? "off" : ""; });
        // accendendo in freddo/caldo, se la temperatura impostata non farebbe partire nulla, la porto 2° oltre quella di casa
        var nt = null, st = clima.step || .5;
        if (wasOff && m === "cool" && clima.tgt >= clima.cur) nt = Math.max(clima.min, Math.floor((clima.cur - 2) / st) * st);
        if (wasOff && m === "heat" && clima.tgt <= clima.cur) nt = Math.min(clima.max, Math.ceil((clima.cur + 2) / st) * st);
        if (nt !== null && nt !== clima.tgt) {
          clima.tgt = nt;
          if (LIVE) setTimeout(function () { call("climate", "set_temperature", { entity_id: ENT.climate, temperature: nt }); }, 1200);
          climaToast(m, nt);
        } else climaToast(m, null);
        renderClima();
      });
      $("#cl-fans").addEventListener("click", function (e) { var b = e.target.closest("[data-fan]"); if (!b) return; var k = b.dataset.fan; climaCall("set_fan_mode", { fan_mode: k }, function () { clima.fan = k; }); });
      $("#cl-swing").addEventListener("change", function (e) { var k = e.target.value; climaCall("set_swing_mode", { swing_mode: k }, function () { clima.swing = k; }); });
      $("#cl-hswing").addEventListener("change", function (e) { var k = e.target.value; climaCall("set_swing_horizontal_mode", { swing_horizontal_mode: k }, function () { clima.hswing = k; }); });
      $("#cl-preset").addEventListener("change", function (e) { var k = e.target.value; climaCall("set_preset_mode", { preset_mode: k }, function () { clima.preset = k; }); });
      function step(dir) {
        var v = Math.round((clima.tgt + dir * clima.step) / clima.step) * clima.step;
        clima.tgt = Math.min(clima.max, Math.max(clima.min, v)); renderClima();
        clearTimeout(clTimer);
        clTimer = setTimeout(function () { clTimer = 0; if (LIVE) call("climate", "set_temperature", { entity_id: ENT.climate, temperature: clima.tgt }); }, 700);
        timers.push(clTimer);
      }
      $("#cl-minus").addEventListener("click", function () { step(-1); });
      $("#cl-plus").addEventListener("click", function () { step(1); });
      renderClima();
    }

    /* ------------------------------------------------------------------ numeri che scorrono (consumo in tempo reale) */
    var TW = {}, lastP = null, deltaT = 0;
    function tweenW(node, unitNode, to) {
      if (!node) return;
      var key = node.id, st = TW[key] || (TW[key] = { v: to, raf: 0 });
      function paint(v) { var f = fmtW(v); if (unitNode) { node.textContent = f.n; unitNode.textContent = f.u; } else node.textContent = f.n + " " + f.u; }
      cancelAnimationFrame(st.raf);
      var from = st.v;
      if (reduce || from === to || document.hidden) { st.v = to; paint(to); return; }
      var t0 = performance.now(), dur = 1100;
      (function step(now) { var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3), v = from + (to - from) * e; st.v = v; paint(v); if (k < 1) st.raf = requestAnimationFrame(step); else st.v = to; })(t0);
    }
    function showDelta(v) {
      if (lastP !== null && Math.abs(v - lastP) >= 3) {
        var d = $("#power-delta"), dv = v - lastP;
        if (d) { d.textContent = (dv > 0 ? "▲ +" : "▼ −") + Math.round(Math.abs(dv)); d.className = "pdelta " + (dv > 0 ? "up" : "dn"); clearTimeout(deltaT); deltaT = setTimeout(function () { d.className = "pdelta"; }, 5000); }
      }
      lastP = v;
    }
    function chipPower(v) { showDelta(v); tweenW($("#power-val"), null, v); }
    function enAge() {
      var n = $("#en-age"); if (!n) return;
      if (!LIVE) { n.textContent = "· live"; return; }
      var s = sv(ENT.energy.power) || sv(ENT.power);
      if (!s || !s.last_updated) { n.textContent = ""; return; }
      var sec = Math.max(0, Math.round((Date.now() - new Date(s.last_updated).getTime()) / 1000));
      n.textContent = "· opdateret " + (sec < 2 ? "nu" : sec + " sek. siden");
    }
    /* chiede a Home Assistant di rileggere il contatore ogni pochi secondi, finché guardi la dashboard */
    var lastPoll = 0;
    function livePoll() {
      var n = ENT.energy.liveRefresh;
      if (!LIVE || !n || n <= 0 || document.hidden || !HASS) return;
      var id = ENT.energy.power; if (!sv(id) || isUnavail(sv(id))) return;
      var now = Date.now(); if (now - lastPoll < Math.max(n, 2.5) * 1000) return;
      lastPoll = now; call("homeassistant", "update_entity", { entity_id: id });
    }

    /* ------------------------------------------------------------------ energia / consumi (Shelly EM) */
    var EN = { range: "24h", series: [], busy: false, last: 0, rangeKey: "", days: [], daysAt: 0, tipIdx: -1, dayUnit: "kwh", pEff: 0.3, pDrawn: 0 };
    function enNum(id) { var s = sv(id); if (!s || isUnavail(s)) return null; var v = parseFloat(s.state); return isNaN(v) ? null : v; }
    function fmtKwh(v) { return v === null ? "—" : Number(v).toLocaleString("da-DK", { minimumFractionDigits: v >= 100 ? 0 : 1, maximumFractionDigits: v >= 100 ? 0 : 2 }); }
    function fmtEur(v) { return v === null ? "—" : Number(v).toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kr."; }
    function fmtW(v) { return v >= 1000 ? { n: Number(v / 1000).toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), u: "kW" } : { n: Math.round(v).toLocaleString("da-DK"), u: "W" }; }
    var demoE = { p: 180, t0: Date.now() };
    function demoPower() { var m = (Date.now() - demoE.t0) / 1000; return Math.max(60, 190 + 90 * Math.sin(m / 9) + 60 * Math.sin(m / 3.1) + (Math.sin(m / 47) > .8 ? 1400 : 0)); }
    /* tariffa €/kWh: helper di Home Assistant (vale su tutti i dispositivi) → copia locale → valore di esempio */
    var PEND = null;
    /* Nordlys: energy.sellPositive: true viser salg med + og køb med − (måler, Udvikling og tooltip) */
    function SPOS() { return !!ENT.energy.sellPositive; }
    function LIVEP() { return String(ENT.energy.price || "").indexOf("sensor.") === 0; }
    function priceInfo() {
      var v = enNum(ENT.energy.price);
      if (PEND && (Date.now() > PEND.until || (v !== null && Math.abs(v - PEND.v) < 1e-6))) PEND = null;
      if (PEND) return { v: PEND.v, src: "ha" };
      /* Nordlys: energy.price som sensor (fx Energi Data Service) = live timepris, kan ikke rettes i kortet */
      if (LIVEP()) return { v: v !== null ? v : 0, src: "live" };
      if (v !== null && v > 0) return { v: v, src: "ha" };
      var l = parseFloat(store("price"));
      if (l > 0) return { v: l, src: "local" };
      return { v: 0, src: LIVE ? "none" : "demo" };
    }
    function enModel() {
      var E = ENT.energy, m, sc = {};
      if (!LIVE) {
        m = { power: demoPower(), volt: 229.8, base: 98, avg3: 204, limit: 3400, today: 3.4, yest: 10.3, month: 71.4, lmonth: 211.3, year: 2043.9, na: false,
          apps: [{ n: "Vaskemaskine", w: 460, e: .42, ic: "mdi-washing-machine", c: "#38BDF8" }, { n: "Tørretumbler", w: 0, e: .01, ic: "mdi-tumble-dryer", c: "#F472B6" }, { n: "Opvaskemaskine", w: 1080, e: .55, ic: "mdi-dishwasher", c: "#22D3EE" }, { n: "Ovn", w: 0, e: 0, ic: "mdi-stove", c: "#FB923C" }, { n: "Stikdåse", w: 12, e: .14, ic: "mdi-power-socket-eu", c: "#A78BFA" }, { n: "Køleskab", w: 74, e: .62, ic: "mdi-fridge", c: "#34D399" }] };
      } else {
        var lim = enNum(E.limit) || E.limitDefault;
        m = { power: enNum(E.power) !== null ? enNum(E.power) : enNum(ENT.power), volt: enNum(E.voltage), grid: enNum(E.grid), gridUnit: (sv(E.grid) || { attributes: {} }).attributes.unit_of_measurement, solar: enNum(E.solar), solarUnit: (sv(E.solar) || { attributes: {} }).attributes.unit_of_measurement, solarToday: enNum(E.solarToday), ev: enNum(E.ev), evCfg: !!E.ev, evUnit: (sv(E.ev) || { attributes: {} }).attributes.unit_of_measurement, evToday: enNum(E.evToday), evStatus: (sv(E.evStatus) || {}).state, base: enNum(E.base), avg3: enNum(E.avg3), limit: lim,
          today: enNum(E.today), yest: enNum(E.yesterday), month: enNum(E.month), lmonth: enNum(E.lastMonth), year: enNum(E.year),
          na: isUnavail(sv(E.power)),
          apps: E.appliances.map(function (x) { var s = sv(x.p); return { n: x.n, w: enNum(x.p), e: x.e ? enNum(x.e) : null, ic: x.ic, c: x.c, na: !s || isUnavail(s) }; }) };
        sc = { today: enNum(E.costToday), yest: enNum(E.costYesterday), month: enNum(E.costMonth), lmonth: enNum(E.costLastMonth), year: enNum(E.costYear) };
      }
      var pi = priceInfo(), implied = null;
      var hasSens = [sc.today, sc.yest, sc.month, sc.lmonth, sc.year].some(function (x) { return x !== undefined && x !== null; });
      if (pi.v <= 0) {
        if (sc.year !== undefined && sc.year !== null && m.year > 0) implied = sc.year / m.year;
        else if (sc.month !== undefined && sc.month !== null && m.month > 0) implied = sc.month / m.month;
      }
      m.price = pi; m.implied = implied;
      m.pEff = pi.v > 0 ? pi.v : (implied || E.priceDefault);
      m.src = pi.v > 0 ? pi.src : (hasSens ? "sensori" : "esempio");
      /* costo = kWh × tariffa; senza tariffa impostata si usano i sensori di costo che hai già, o un valore di esempio */
      if (EN.cost) sc = { today: EN.cost.today, yest: EN.cost.yest, month: EN.cost.month, lmonth: EN.cost.lmonth, year: EN.cost.year };
      function cost(kwh, sens) { if (EN.cost && sens !== undefined && sens !== null) return sens; if (pi.v > 0) return kwh === null ? null : kwh * pi.v; if (sens !== undefined && sens !== null) return sens; return kwh === null ? null : kwh * m.pEff; }
      m.cToday = cost(m.today, sc.today); m.cYest = cost(m.yest, sc.yest); m.cMonth = cost(m.month, sc.month); m.cLmonth = cost(m.lmonth, sc.lmonth); m.cYear = cost(m.year, sc.year);
      return m;
    }
    function enLevel(m) {
      var pct = m.power / m.limit;
      if (m.na) return ["low", "Ingen data", 0];
      if (m.base && m.power <= m.base * 1.25) return ["low", "Kun grundforbrug", pct];
      if (pct < .25) return ["low", "Lavt forbrug", pct];
      if (pct < .55) return ["mid", "Normalt forbrug", pct];
      if (pct < .8) return ["high", "Højt forbrug", pct];
      return ["crit", "Pas på: tæt på grænsen", pct];
    }
    function renderEnergy() {
      if (!$("#en-hero")) return;
      var m = enModel(), lv = enLevel(m), f = fmtW(m.power || 0);
      var hero = $("#en-hero"); hero.dataset.lvl = lv[0]; hero.classList.toggle("na", !!m.na);
      if (m.na) { $("#en-num").textContent = "—"; $("#en-unit").textContent = "W"; } else tweenW($("#en-num"), $("#en-unit"), m.power || 0);
      var dash = Math.max(0, Math.min(100, (m.power || 0) / m.limit * 100)).toFixed(1);
      $("#en-arc").setAttribute("stroke-dasharray", dash + " 100"); $("#en-glow").setAttribute("stroke-dasharray", dash + " 100");
      $("#en-title").textContent = lv[1];
      $("#en-sub").textContent = "Hele husets måling · advarselsgrænse " + fmtW(m.limit).n + " " + fmtW(m.limit).u;
      var chips = "";
      EN.pEff = m.pEff;
      /* Nordlys: energy.solar = solcelleproduktion (W/kW) i egen måler, energy.solarToday = produceret i dag (kWh), energy.solarPeak = max (W) */
      var dual = m.solar !== undefined && m.solar !== null, hasNet = m.grid !== undefined && m.grid !== null;
      /* Nordlys: energy.ev = elbillader (W/kW) i egen måler, energy.evToday = ladet i dag (kWh), energy.evStatus = laderens tilstand, energy.evPeak = max (W) */
      var hasEv = !!m.evCfg, nG = 1 + (dual ? 1 : 0) + (hasNet ? 1 : 0) + (hasEv ? 1 : 0);
      hero.classList.toggle("dual", nG >= 2); hero.classList.toggle("triple", nG >= 3); hero.classList.toggle("quad", nG >= 4); $("#sol-gauge").hidden = !dual; $("#net-gauge").hidden = !hasNet; $("#ev-gauge").hidden = !hasEv; $("#en-glab").hidden = nG < 2;
      /* Nordlys: energy.grid = nettoeffekt mod elnettet (+ køb, − salg) */
      if (hasNet) {
        var gw = m.grid * (m.gridUnit === "kW" ? 1000 : 1), sell = gw < -0.5, ng = $("#net-gauge"), gpk = sell ? (typeof ENT.energy.solarPeak === "number" ? ENT.energy.solarPeak : 7000) : m.limit;
        ng.classList.toggle("sell", sell); ng.classList.toggle("sig", !!ENT.energy.signalColors); $("#net-lab").textContent = sell ? "Salg" : "Køb"; $("#net-sign").textContent = (sell !== SPOS()) ? "−" : "+";
        tweenW($("#net-num"), $("#net-unit"), Math.abs(gw));
        var nd = Math.max(0, Math.min(100, Math.abs(gw) / gpk * 100)).toFixed(1); $("#net-arc").setAttribute("stroke-dasharray", nd + " 100"); $("#net-glow").setAttribute("stroke-dasharray", nd + " 100");
      }
      if (dual) {
        var sw = Math.max(0, m.solar) * (m.solarUnit === "kW" ? 1000 : 1), pk = typeof ENT.energy.solarPeak === "number" ? ENT.energy.solarPeak : (enNum(ENT.energy.solarPeak) || 7000);
        tweenW($("#sol-num"), $("#sol-unit"), sw);
        /* Nordlys: energy.signalColors: true = solceller grønne når de producerer, køb rødt, salg grønt */
        $("#sol-gauge").classList.toggle("sig-on", !!ENT.energy.signalColors && sw > 0.5);
        var sd = Math.max(0, Math.min(100, sw / pk * 100)).toFixed(1); $("#sol-arc").setAttribute("stroke-dasharray", sd + " 100"); $("#sol-glow").setAttribute("stroke-dasharray", sd + " 100");
        if (m.solarToday !== null && m.solarToday !== undefined) chips += "<span class=\"echip sun\"><i class=\"mdi mdi-solar-power-variant\"></i>Produceret i dag <b>" + fmtKwh(m.solarToday) + " kWh</b></span>";
      }
      if (hasEv) {
        var evNa = m.ev === null || m.ev === undefined; /* lader mangler eller svarer ikke: vis "—" */
        var ew = evNa ? 0 : Math.max(0, m.ev) * (m.evUnit === "kW" ? 1000 : 1), epk = typeof ENT.energy.evPeak === "number" ? ENT.energy.evPeak : (enNum(ENT.energy.evPeak) || 11000);
        if (evNa) { var TWev = TW["ev-num"]; if (TWev) { cancelAnimationFrame(TWev.raf); TWev.v = 0; } $("#ev-num").textContent = "—"; $("#ev-unit").textContent = ""; } else tweenW($("#ev-num"), $("#ev-unit"), ew);
        var ed = Math.max(0, Math.min(100, ew / epk * 100)).toFixed(1); $("#ev-arc").setAttribute("stroke-dasharray", ed + " 100"); $("#ev-glow").setAttribute("stroke-dasharray", ed + " 100");
        var EVS = { disconnected: "Ikke tilsluttet", connected_requesting: "Venter på opladning", connected_charging: "Lader", connected_finished: "Færdig" };
        if (evNa && !sv(ENT.energy.ev)) chips += "<span class=\"echip ev\"><i class=\"mdi mdi-ev-station\"></i>Elbil <b>Ingen lader</b></span>";
        else if (evNa) chips += "<span class=\"echip ev\"><i class=\"mdi mdi-ev-station\"></i>Elbil <b>Svarer ikke</b></span>";
        else if (m.evStatus && EVS[m.evStatus]) chips += "<span class=\"echip ev\"><i class=\"mdi mdi-ev-station\"></i>Elbil <b>" + EVS[m.evStatus] + "</b></span>";
        if (m.evToday !== null && m.evToday !== undefined) chips += "<span class=\"echip ev\"><i class=\"mdi mdi-car-electric\"></i>Ladet i dag <b>" + fmtKwh(m.evToday) + " kWh</b></span>";
      }
      var buyW = m.grid !== undefined && m.grid !== null ? Math.max(0, m.grid * (m.gridUnit === "kW" ? 1000 : 1)) : m.power;
      var sellW = m.grid !== undefined && m.grid !== null ? Math.max(0, -m.grid * (m.gridUnit === "kW" ? 1000 : 1)) : 0, spv = enNum(ENT.energy.salePrice);
      /* Nordlys: energy.salePrice = salgspris nu (kr/kWh); ved salg vises "Tjener nu" i stedet for "Koster nu" */
      if (sellW > 0.5 && spv !== null && !m.na) chips += "<span class=\"echip sell\" title=\"Salgspris nu " + fmtP(spv) + " kr/kWh\"><i class=\"mdi mdi-cash-plus\"></i>Tjener nu <b>" + fmtEur(sellW / 1000 * spv) + "/h</b></span>";
      else if (m.power !== null && !m.na) chips += "<span class=\"echip cost\" title=\"" + (LIVEP() ? "Elpris nu" : "Tryk for at ændre elprisen") + "\"><i class=\"mdi mdi-cash\"></i>Koster nu <b>" + fmtEur(buyW / 1000 * m.pEff) + "/h</b></span>";
      if (m.base !== null) chips += "<span class=\"echip\"><i class=\"mdi mdi-sleep\"></i>Grundforbrug <b>" + Math.round(m.base) + " W</b></span>";
      if (m.avg3 !== null) chips += "<span class=\"echip\"><i class=\"mdi mdi-chart-bell-curve\"></i>Gns. 3 t <b>" + Math.round(m.avg3) + " W</b></span>";
      if (m.volt !== null) chips += "<span class=\"echip\"><i class=\"mdi mdi-sine-wave\"></i>Spænding <b>" + fmtKwh(m.volt).replace(",0", "") + " V</b></span>";
      var ch = $("#en-chips"); if (ch.dataset.sig !== chips) { ch.dataset.sig = chips; ch.innerHTML = chips; hydrate(ch); }
      // tariffa
      var pb = $("#en-price"), P = m.price;
      if (pb) {
        pb.classList.toggle("unset", P.v <= 0);
        $("#pb-main").textContent = P.src === "live" ? "Elpris nu " + fmtP(P.v) + " kr/kWh" : P.v > 0 ? "Elpris " + fmtP(P.v) + " kr/kWh" : (m.src === "sensori" ? "Elpris ikke sat" : "Eksempel-elpris " + fmtP(m.pEff) + " kr/kWh");
        $("#pb-sub").textContent = (enNum(ENT.energy.salePrice) !== null ? "Salgspris nu " + fmtP(enNum(ENT.energy.salePrice)) + " kr/kWh · " : "") + (P.src === "live" ? "Live timepris inkl. moms og tariffer" + (EN.cost ? " · kr. = hver times forbrug × timens pris" : " · pris = kWh × elpris nu") : P.src === "ha" ? "Gemt i Home Assistant · pris = kWh × elpris" : P.src === "local" ? "Gemt på denne enhed · pris = kWh × elpris"
          : m.src === "sensori" ? "Priserne kommer fra dine sensorer (≈ " + fmtP(m.pEff) + " kr/kWh). Indtast din elpris for at se de rigtige priser" : "Indtast din elpris for at se de rigtige priser");
        $("#pb-cta").textContent = P.v > 0 ? "Ret" : "Indstil"; $("#pb-cta").parentNode.hidden = P.src === "live";
      }
      if (EN.pDrawn !== EN.pEff && EN.days.length) drawDays();
      // KPI
      var dom = new Date(), dim = new Date(dom.getFullYear(), dom.getMonth() + 1, 0).getDate(), est = (m.month !== null && dom.getDate() > 0) ? m.month / dom.getDate() * dim : null;
      var kp = [
        ["mdi-calendar-today", "I dag", m.today, m.cToday, ""], ["mdi-calendar-arrow-left", "I går", m.yest, m.cYest, ""],
        ["mdi-calendar-month", "Denne måned", m.month, m.cMonth, est !== null ? "Forventet ved månedens udgang ≈ " + Math.round(est) + " kWh" + (m.cMonth !== null ? " · " + fmtEur(m.cMonth / dom.getDate() * dim) : "") : ""],
        ["mdi-calendar-month-outline", "Sidste måned", m.lmonth, m.cLmonth, ""], ["mdi-calendar-star", "I år", m.year, m.cYear, ""]];
      var RV = EN.rev ? [EN.rev.today, EN.rev.yest, EN.rev.month, EN.rev.lmonth, EN.rev.year] : null;
      var KS = ENT.energy.kpiSolar ? (EN.solk ? [EN.solk.today, EN.solk.yest, EN.solk.month, EN.solk.lmonth, EN.solk.year] : [null, null, null, null, null]) : null;
      if (KS) { var st0 = enNum(ENT.energy.solarToday); if (st0 !== null) { var dd0 = st0 - (KS[0] || 0); KS[0] = st0; if (KS[2] !== null) KS[2] += dd0; if (KS[4] !== null) KS[4] += dd0; } }
      /* Nordlys: energy.kpiEv: true viser elbilens kWh i hvert felt (fra evEnergy, ellers evToday) */
      var KE = ENT.energy.kpiEv ? (EN.evk ? [EN.evk.today, EN.evk.yest, EN.evk.month, EN.evk.lmonth, EN.evk.year] : [null, null, null, null, null]) : null;
      if (KE) { var et0 = enNum(ENT.energy.evToday); if (et0 !== null && et0 > (KE[0] || 0)) { var ed0 = et0 - (KE[0] || 0); KE[0] = et0; if (KE[2] !== null) KE[2] += ed0; if (KE[4] !== null) KE[4] += ed0; } }
      /* Nordlys: energy.kpiNet: true viser nederst i hvert felt resultatet = solgt for − købt for */
      var KN = !!ENT.energy.kpiNet;
      var kh = kp.map(function (k, ki) { var rv = RV ? RV[ki] : null, soldH = rv !== null && rv !== undefined ? '<em class="k-sold">+' + fmtEur(rv) + " solgt</em>" : "";
        var nv = KN && k[3] !== null && k[3] !== undefined ? (rv || 0) - k[3] : null, netH = KN ? '<span class="k-net' + (nv === null ? "" : nv >= 0 ? " pos" : " neg") + '">' + (nv === null ? "&nbsp;" : "Resultat <b>" + (nv >= 0 ? "+" : "−") + fmtEur(Math.abs(nv)) + "</b>") + "</span>" : "";
        return '<article class="card kpi' + (KS ? " split" : "") + (k[2] === null ? " na" : "") + '"><span class="k-l"><i class="mdi ' + k[0] + '"></i>' + k[1] + '</span><span class="k-v">' + fmtKwh(k[2]) + "<small>kWh</small></span><span class=\"k-c" + (SPOS() && k[3] ? " neg" : "") + "\">" + (SPOS() && k[3] ? "−" : "") + fmtEur(k[3]) + (KS ? "" : soldH) + "</span>" + (KE ? '<span class="k-evl"><i class="mdi mdi-car-electric"></i>Elbil <b>' + (KE[ki] === null || KE[ki] === undefined ? "—" : fmtKwh(KE[ki]) + " kWh") + "</b>" + (KE[ki] && k[2] ? "<small>" + Math.min(100, Math.round(KE[ki] / k[2] * 100)) + " %</small>" : "") + "</span>" + (function () { var kr = evKr(["today", "yest", "month", "lmonth", "year"][ki]); return kr !== null && KE[ki] !== null && KE[ki] !== undefined ? '<span class="k-evc">' + fmtEur(kr) + "</span>" : ""; })() : "") + (KS ? "" : '<span class="k-s">' + (k[4] || "&nbsp;") + "</span>")
          + (KS ? '<span class="k-sol"><span class="k-l"><i class="mdi mdi-solar-power-variant"></i>Solceller</span><span class="k-v">' + fmtKwh(KS[ki]) + "<small>kWh</small></span>" + (soldH || '<em class="k-sold">&nbsp;</em>') + "</span>" + netH + (k[4] ? '<span class="k-s">' + k[4] + "</span>" : "") : netH) + "</article>"; }).join("");
      var kb = $("#en-kpis"); if (kb.dataset.sig !== kh) { kb.dataset.sig = kh; kb.innerHTML = kh; hydrate(kb); }
      // elettrodomestici
      var apps = m.apps, sum = 0; apps.forEach(function (x) { if (x.w) sum += x.w; });
      var other = Math.max(0, (m.power || 0) - sum), tot = Math.max(m.power || 0, sum, 1);
      var segs = apps.filter(function (x) { return x.w > 3; }).map(function (x) { return [x.n, x.c, x.w]; });
      if (other > 3) segs.push(["Andet (lys, standby…)", "#64748B", other]);
      var sh = $("#en-share"), shHtml = segs.map(function (g2) { return '<i style="width:' + (g2[2] / tot * 100).toFixed(1) + "%;background:" + g2[1] + '"></i>'; }).join("");
      if (sh.dataset.sig !== shHtml) { sh.dataset.sig = shHtml; sh.innerHTML = shHtml; }
      var lg = $("#en-share-legend");
      if (!lg) { lg = el("div", "share-legend"); lg.id = "en-share-legend"; sh.insertAdjacentElement("afterend", lg); }
      lg.innerHTML = segs.map(function (g2) { return '<span style="--c:' + g2[1] + '">' + g2[0] + " <b>" + Math.round(g2[2]) + " W</b></span>"; }).join("") || "<span style=\"--c:#34D399\">Ingen apparater tændt</span>";
      var ap = $("#en-apps"), ah = apps.map(function (x, i) {
        var run = x.w !== null && x.w >= 5;
        return '<button class="app' + (run ? " run" : "") + (x.na ? " na" : "") + '" type="button" data-app="' + i + '" style="--c:' + x.c + '"><span class="a-ico"><i class="mdi ' + x.ic + '"></i></span><span class="a-name">' + x.n + '</span><span class="a-w">' + (x.na || x.w === null ? "—" : (x.w >= 1000 ? fmtW(x.w).n + " kW" : Math.round(x.w) + " W")) + '</span><span class="a-e">' + (x.e !== null ? fmtKwh(x.e) + " kWh i dag" : (x.na ? "Ikke tilgængelig" : "&nbsp;")) + "</span></button>";
      }).join("");
      if (ap.dataset.sig !== ah) { ap.dataset.sig = ah; ap.innerHTML = ah; hydrate(ap); $$(".app", ap).forEach(function (b) { b.addEventListener("click", function () { if (LIVE) moreInfo(ENT.energy.appliances[+b.dataset.app].p); }); }); }
    }
    /* ---- tariffa: finestra per impostare il costo del kWh ---- */
    function fmtP(v) { return Number(v).toLocaleString("da-DK", { minimumFractionDigits: 3, maximumFractionDigits: 3 }); }
    function prNum(sel) { var v = parseFloat(String($(sel).value).replace(",", ".")); return isNaN(v) ? null : v; }
    function prSet(v) { $("#pr-in").value = (Math.round(v * 1000) / 1000).toFixed(3); prMark(); }
    function prMark() { var v = prNum("#pr-in"); $$("#pr-pre button").forEach(function (b) { b.setAttribute("aria-pressed", v !== null && Math.abs(+b.dataset.v - v) < 0.0005 ? "true" : "false"); }); }
    function prCalcOut() {
      var b = prNum("#pr-bill"), k = prNum("#pr-kwh"), o = $("#pr-calc-out");
      if (b > 0 && k > 0) { var v = b / k; o.innerHTML = "Reel pris: <b>" + fmtP(v) + " kr/kWh</b>"; var u = el("button", "linkb", "Brug denne", { type: "button" }); u.addEventListener("click", function () { prSet(v); }); o.appendChild(u); } else o.textContent = "";
    }
    function openPrice() {
      var m = enModel(), cur = m.price.v > 0 ? m.price.v : m.pEff, box = $("#pricebox");
      prSet(cur);
      var pre = $("#pr-pre"); pre.innerHTML = "";
      [0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50].forEach(function (v) { var b = el("button", "", fmtP(v).slice(0, 4), { type: "button", "data-v": v }); b.addEventListener("click", function () { prSet(v); }); pre.appendChild(b); });
      prMark();
      var h = $("#pr-hint");
      if (m.implied > 0 && m.price.v <= 0) {
        h.hidden = false; h.innerHTML = "Dine eksisterende sensorer regner med cirka <b>" + fmtP(m.implied) + " kr/kWh</b>.";
        var u = el("button", "linkb", "Brug denne", { type: "button" }); u.addEventListener("click", function () { prSet(m.implied); }); h.appendChild(u);
      } else h.hidden = true;
      $("#pr-bill").value = ""; $("#pr-kwh").value = ""; $("#pr-calc-out").textContent = ""; $("#pr-calc").open = false;
      $("#pr-where").textContent = !LIVE ? "Forhåndsvisning: elprisen gemmes kun i denne browser."
        : sv(ENT.energy.price) ? "Gemmes i Home Assistant (" + ENT.energy.price + "): gælder på alle dine enheder."
        : "Første gang du gemmer, oprettes hjælperen " + ENT.energy.price + " (kræver administrator); ellers gemmes den på denne enhed.";
      box.classList.add("open"); box.setAttribute("aria-hidden", "false");
      later(function () { var i = $("#pr-in"); i.focus(); i.select(); }, 220);
    }
    function closePrice() { var box = $("#pricebox"); box.classList.remove("open"); box.setAttribute("aria-hidden", "true"); }
    function prDone(msg) { $("#pr-ok").disabled = false; closePrice(); toast(msg, "mdi-cash-check", "var(--ok)"); renderEnergy(); drawDays(); }
    function savePrice() {
      var v = prNum("#pr-in");
      if (v === null || v < 0.001 || v > 5) { toast("Indtast en pris mellem 0,001 og 5 kr/kWh", "mdi-alert-circle", "var(--warn)"); return; }
      v = Math.round(v * 10000) / 10000;
      if (!LIVE) { store("price", String(v)); prDone("Elpris gemt: " + fmtP(v) + " kr/kWh"); return; }
      var id = ENT.energy.price, btn = $("#pr-ok"); btn.disabled = true;
      var local = function (why) { store("price", String(v)); prDone("Elpris gemt på denne enhed" + (why ? " (" + why + ")" : "")); };
      var name = id.split(".")[1].replace(/_/g, " ").replace(/\bkwh\b/i, "kWh"); name = name.charAt(0).toUpperCase() + name.slice(1);
      var req = sv(id) ? Promise.resolve(ctx.call("input_number", "set_value", { entity_id: id, value: v }))
        : HASS.callWS({ type: "input_number/create", name: name, icon: "mdi:cash-multiple", min: 0, max: 5, step: 0.001, mode: "box", unit_of_measurement: "kr/kWh", initial: v });
      req.then(function () { PEND = { v: v, src: "ha", until: Date.now() + 8000 }; prDone("Elpris gemt i Home Assistant: " + fmtP(v) + " kr/kWh"); })
        .catch(function (e) { local(/unauthor|admin|permission/i.test((e && e.message) || (e && e.code) || "") ? "kræver en administrator for at gemme i HA" : "kunne ikke gemme den i HA"); });
    }
    function buildPrice() {
      var open = function () { if (LIVEP()) { if (LIVE) moreInfo(ENT.energy.price); return; } openPrice(); };
      $("#en-price").addEventListener("click", open); $("#en-kpis").addEventListener("click", open);
      $("#en-chips").addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".echip.cost")) open(); });
      $("#pr-close").addEventListener("click", closePrice); $("#pr-cancel").addEventListener("click", closePrice);
      $("#pricebox").addEventListener("click", function (e) { if (e.target === e.currentTarget) closePrice(); });
      $("#pr-ok").addEventListener("click", savePrice);
      $("#pr-minus").addEventListener("click", function () { prSet(Math.max(0.001, (prNum("#pr-in") || 0) - 0.005)); });
      $("#pr-plus").addEventListener("click", function () { prSet(Math.min(5, (prNum("#pr-in") || 0) + 0.005)); });
      $("#pr-in").addEventListener("input", prMark);
      $("#pr-in").addEventListener("keydown", function (e) { if (e.key === "Enter") savePrice(); });
      $("#pr-bill").addEventListener("input", prCalcOut); $("#pr-kwh").addEventListener("input", prCalcOut);
      $("#pricebox").addEventListener("keydown", function (e) { if (e.key === "Escape") closePrice(); });
    }
    /* ---- storico ---- */
    function bucketSeries(raw, t0, t1, n) {
      var out = [], span = (t1 - t0) / n, i, k;
      for (i = 0; i < n; i++) out.push({ t: t0 + i * span, sum: 0, w: 0, mx: 0 });
      for (k = 0; k < raw.length; k++) {
        var a = raw[k], v = parseFloat(a.v); if (isNaN(v)) continue;
        var s = Math.max(a.t, t0), e = Math.min(raw[k + 1] ? raw[k + 1].t : t1, t1); if (e <= s) continue;
        for (i = Math.max(0, Math.floor((s - t0) / span)); i < n && out[i].t < e; i++) { var bs = Math.max(s, out[i].t), be = Math.min(e, out[i].t + span); if (be > bs) { out[i].sum += v * (be - bs); out[i].w += be - bs; if (v > out[i].mx) out[i].mx = v; } }
      }
      return out.filter(function (b) { return b.w > 0; }).map(function (b) { return { t: b.t, v: b.sum / b.w, mx: b.mx }; });
    }
    function tms(x) { if (typeof x === "number") return x < 1e12 ? x * 1000 : x; return Date.parse(x); }
    function enFetch(range, sid) {
      var now = Date.now();
      if (!LIVE && sid) return Promise.resolve([]);
      if (!LIVE) {
        var n = range === "3h" ? 60 : range === "24h" ? 96 : 84, step = range === "3h" ? 180e3 : range === "24h" ? 900e3 : 7200e3, a = [];
        for (var i = 0; i < n; i++) { var tt = now - (n - i) * step, hh = new Date(tt).getHours() + new Date(tt).getMinutes() / 60, v = 140 + 70 * Math.sin(i / 5) + (hh > 18 && hh < 22 ? 420 : 0) + (hh > 12 && hh < 14 ? 520 : 0) + 40 * Math.sin(i * 1.7) + (i % 29 === 0 ? 900 : 0); a.push({ t: tt, v: Math.max(70, v), mx: Math.max(70, v) * 1.2 }); }
        return Promise.resolve(a);
      }
      var id = sid || ENT.energy.power;
      if (range === "3h") {
        var t0 = now - 3 * 3600e3;
        return HASS.callWS({ type: "history/history_during_period", start_time: new Date(t0).toISOString(), end_time: new Date(now).toISOString(), entity_ids: [id], minimal_response: true, no_attributes: true, significant_changes_only: false }).then(function (r) {
          var arr = (r[id] || []).map(function (x) { return { t: tms(x.lu !== undefined ? x.lu : (x.last_updated || x.lc)), v: x.s !== undefined ? x.s : x.state }; }).filter(function (x) { return !isNaN(x.t); });
          return bucketSeries(arr, t0, now, 60);
        });
      }
      var per = range === "24h" ? "5minute" : "hour", st = now - (range === "24h" ? 24 : 168) * 3600e3;
      return HASS.callWS({ type: "recorder/statistics_during_period", start_time: new Date(st).toISOString(), end_time: new Date(now).toISOString(), statistic_ids: [id], period: per, types: ["mean", "max"] }).then(function (r) {
        var a = (r[id] || []).map(function (x) { return { t: tms(x.start), v: x.mean, mx: x.max }; }).filter(function (x) { return x.v !== null && x.v !== undefined; });
        if (range === "24h" && a.length > 120) { var g3 = Math.ceil(a.length / 96), o = []; for (var i = 0; i < a.length; i += g3) { var c = a.slice(i, i + g3), s = 0, mx = 0; c.forEach(function (z) { s += z.v; if ((z.mx || z.v) > mx) mx = z.mx || z.v; }); o.push({ t: c[0].t, v: s / c.length, mx: mx }); } a = o; }
        return a;
      });
    }
    function fmtHM(ts) { var d = new Date(ts); return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
    function drawChart() {
      var svg = $("#en-svg"), data = EN.series, W = 600, H = 170, base = enNum(ENT.energy.base);
      $("#en-empty").hidden = !!data.length;
      if (!data.length) { svg.innerHTML = ""; $("#en-axis").innerHTML = ""; $("#en-stats").innerHTML = ""; return; }
      var sol = EN.sol || [], speak = null;
      var maxV = 0, peak = data[0], sum = 0; data.forEach(function (d) { var m2 = d.mx || d.v; if (m2 > maxV) maxV = m2; if (d.v > peak.v) peak = d; sum += d.v; });
      sol.forEach(function (d) { if (d.v > maxV) maxV = d.v; if (!speak || d.v > speak.v) speak = d; });
      var evs = EN.evs || [], epeak = null; evs.forEach(function (d) { if (d.v > maxV) maxV = d.v; if (!epeak || d.v > epeak.v) epeak = d; });
      var net = (EN.net || []).map(function (d) { return SPOS() ? { t: d.t, v: -d.v } : d; }), minV = 0, npk = null, isSell = function (v) { return SPOS() ? v > 0 : v < 0; }; net.forEach(function (d) { if (d.v > maxV) maxV = d.v; if (d.v < minV) minV = d.v; if (isSell(d.v) && (!npk || Math.abs(d.v) > Math.abs(npk.v))) npk = d; });
      var top = Math.max(100, Math.ceil(maxV * 1.12 / 100) * 100), t0 = data[0].t, t1 = data[data.length - 1].t, dt = Math.max(1, t1 - t0);
      var lo = minV < 0 ? -Math.ceil(-minV * 1.12 / 100) * 100 : 0;
      var xs = function (t2) { return (t2 - t0) / dt * W; }, ys = function (v) { return H - 6 - ((v - lo) / (top - lo)) * (H - 14); }, y0 = ys(0);
      var pts = data.map(function (d) { return [xs(d.t), ys(d.v)]; });
      var line = pts.map(function (p2, i) { return (i ? "L" : "M") + p2[0].toFixed(1) + " " + p2[1].toFixed(1); }).join(" ");
      var area = line + " L" + pts[pts.length - 1][0].toFixed(1) + " " + y0.toFixed(1) + " L" + pts[0][0].toFixed(1) + " " + y0.toFixed(1) + " Z";
      var grid = [.25, .5, .75].map(function (g3) { return '<line class="grid" x1="0" x2="' + W + '" y1="' + ys(top * g3).toFixed(1) + '" y2="' + ys(top * g3).toFixed(1) + '"/>'; }).join("");
      var sl = "";
      if (sol.length) { var sp = sol.filter(function (d) { return d.t >= t0 - 1 && d.t <= t1 + 1; }).map(function (d) { return [xs(d.t), ys(d.v)]; });
        if (sp.length > 1) { var sline = sp.map(function (p2, i) { return (i ? "L" : "M") + p2[0].toFixed(1) + " " + p2[1].toFixed(1); }).join(" "); sl = '<path class="sarea" d="' + sline + " L" + sp[sp.length - 1][0].toFixed(1) + " " + y0.toFixed(1) + " L" + sp[0][0].toFixed(1) + " " + y0.toFixed(1) + ' Z"/><path class="sline" d="' + sline + '"/>'; } }
      var nl = "";
      if (net.length) { var np = net.filter(function (d) { return d.t >= t0 - 1 && d.t <= t1 + 1; }).map(function (d) { return [xs(d.t), ys(d.v)]; });
        if (np.length > 1) { var zo = Math.max(0, Math.min(1, y0 / H)).toFixed(4); nl = '<linearGradient id="netgrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="' + H + '"><stop offset="0" stop-color="' + (SPOS() ? "#34D399" : "#60A5FA") + '"/><stop offset="' + zo + '" stop-color="' + (SPOS() ? "#34D399" : "#60A5FA") + '"/><stop offset="' + zo + '" stop-color="' + (SPOS() ? "#60A5FA" : "#34D399") + '"/><stop offset="1" stop-color="' + (SPOS() ? "#60A5FA" : "#34D399") + '"/></linearGradient>' + (lo < 0 ? '<line class="zero" x1="0" x2="' + W + '" y1="' + y0.toFixed(1) + '" y2="' + y0.toFixed(1) + '"/>' : "") + '<path class="nline" d="' + np.map(function (p2, i) { return (i ? "L" : "M") + p2[0].toFixed(1) + " " + p2[1].toFixed(1); }).join(" ") + '"/>'; } }
      var el2 = "";
      if (evs.length) { var ep = evs.filter(function (d) { return d.t >= t0 - 1 && d.t <= t1 + 1; }).map(function (d) { return [xs(d.t), ys(d.v)]; });
        if (ep.length > 1) { var eline = ep.map(function (p2, i) { return (i ? "L" : "M") + p2[0].toFixed(1) + " " + p2[1].toFixed(1); }).join(" "); el2 = '<path class="earea" d="' + eline + " L" + ep[ep.length - 1][0].toFixed(1) + " " + y0.toFixed(1) + " L" + ep[0][0].toFixed(1) + " " + y0.toFixed(1) + ' Z"/><path class="eline" d="' + eline + '"/>'; } }
      var bl = base !== null && base < top ? '<line class="base" x1="0" x2="' + W + '" y1="' + ys(base).toFixed(1) + '" y2="' + ys(base).toFixed(1) + '"/>' : "";
      svg.innerHTML = '<defs><linearGradient id="enarea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--acc-text)" stop-opacity=".45"/><stop offset="1" stop-color="var(--acc-text)" stop-opacity="0"/></linearGradient><linearGradient id="solarea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBBF24" stop-opacity=".35"/><stop offset="1" stop-color="#FBBF24" stop-opacity="0"/></linearGradient><linearGradient id="evarea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A78BFA" stop-opacity=".35"/><stop offset="1" stop-color="#A78BFA" stop-opacity="0"/></linearGradient></defs>' + grid + bl + '<path class="area" d="' + area + '"/>' + sl + el2 + nl + '<path class="line" d="' + line + '"/><line class="cursor" id="en-cur" x1="0" x2="0" y1="0" y2="' + H + '" style="display:none"/>';
      var ax = $("#en-axis"), lab = []; for (var k = 0; k < 5; k++) { var tt = t0 + dt * k / 4, d2 = new Date(tt); lab.push("<span>" + (EN.range === "7g" ? ["søn", "man", "tir", "ons", "tor", "fre", "lør"][d2.getDay()] + " " + pad(d2.getHours()) + "h" : fmtHM(tt)) + "</span>"); }
      ax.innerHTML = lab.join("");
      var pk = fmtW(peak.v), av = Math.round(sum / data.length);
      $("#en-stats").innerHTML = "<span class=\"echip\"><i class=\"mdi mdi-arrow-up-bold\"></i>Top <b>" + pk.n + " " + pk.u + "</b> kl. <b>" + fmtHM(peak.t) + "</b></span><span class=\"echip\"><i class=\"mdi mdi-chart-line\"></i>Gennemsnit <b>" + av + ' W</b></span>' + (npk ? "<span class=\"echip sell\"><i class=\"mdi mdi-transmission-tower-export\"></i>Salg top <b>" + fmtW(Math.abs(npk.v)).n + " " + fmtW(Math.abs(npk.v)).u + "</b> kl. <b>" + fmtHM(npk.t) + "</b></span>" : "") + (speak && speak.v > 0 ? "<span class=\"echip sun\"><i class=\"mdi mdi-solar-power-variant\"></i>Solceller top <b>" + fmtW(speak.v).n + " " + fmtW(speak.v).u + "</b> kl. <b>" + fmtHM(speak.t) + "</b></span>" : "") + (epeak && epeak.v > 0 ? "<span class=\"echip ev\"><i class=\"mdi mdi-car-electric\"></i>Elbil top <b>" + fmtW(epeak.v).n + " " + fmtW(epeak.v).u + "</b> kl. <b>" + fmtHM(epeak.t) + "</b></span>" : "") + (base !== null ? "<span class=\"echip\"><i class=\"mdi mdi-minus\"></i>Stiplet linje = grundforbrug</span>" : "");
      hydrate($("#en-stats"));
      EN.geo = { xs: xs, ys: ys, t0: t0, dt: dt, W: W, data: data, sol: sol, net: net, evs: evs };
    }
    function enLoad(force) {
      var key = EN.range;
      if (!force && EN.rangeKey === key && Date.now() - EN.last < 45000) return;
      if (EN.busy) return; EN.busy = true;
      var sid = ENT.energy.solar, sk = ((sv(sid) || { attributes: {} }).attributes.unit_of_measurement === "kW") ? 1000 : 1;
      var ps = sid ? enFetch(key, sid).then(function (b) { return b.map(function (z) { return { t: z.t, v: Math.max(0, z.v * sk), mx: Math.max(0, (z.mx || z.v) * sk) }; }); }).catch(function () { return []; }) : Promise.resolve([]);
      var gid = ENT.energy.grid, gk = ((sv(gid) || { attributes: {} }).attributes.unit_of_measurement === "kW") ? 1000 : 1;
      var pg = gid ? enFetch(key, gid).then(function (b) { return b.map(function (z) { return { t: z.t, v: z.v * gk }; }); }).catch(function () { return []; }) : Promise.resolve([]);
      /* Nordlys: energy.chartEv: true tegner elbilladerens effekt (energy.ev) som egen kurve i Udvikling */
      var eid = ENT.energy.chartEv ? ENT.energy.ev : null, ek = ((sv(eid) || { attributes: {} }).attributes.unit_of_measurement === "kW") ? 1000 : 1;
      var pe = eid ? enFetch(key, eid).then(function (b) { return b.map(function (z) { return { t: z.t, v: Math.max(0, z.v * ek) }; }); }).catch(function () { return []; }) : Promise.resolve([]);
      Promise.all([enFetch(key), ps, pg, pe]).then(function (r) { EN.series = r[0]; EN.sol = r[1]; EN.net = r[2]; EN.evs = r[3]; EN.rangeKey = key; EN.last = Date.now(); EN.busy = false; drawChart(); }).catch(function () { EN.busy = false; EN.series = []; EN.sol = []; EN.net = []; EN.evs = []; drawChart(); });
    }
    function daysLoad() {
      if (Date.now() - EN.daysAt < 600000 && EN.days.length) return;
      EN.daysAt = Date.now();
      if (!LIVE) { var d0 = new Date(), a = []; for (var i = 13; i >= 0; i--) { var dd = new Date(d0 - i * 864e5); a.push({ d: dd, v: i === 0 ? 3.4 : 6 + 5 * Math.abs(Math.sin(i * 1.3)) + (i % 5 === 0 ? 3 : 0) }); } EN.days = a; drawDays(); return; }
      var st = new Date(); st.setDate(st.getDate() - 13); st.setHours(0, 0, 0, 0);
      HASS.callWS({ type: "recorder/statistics_during_period", start_time: st.toISOString(), end_time: new Date().toISOString(), statistic_ids: [ENT.energy.energyTotal], period: "day", types: ["change"] }).then(function (r) {
        EN.days = (r[ENT.energy.energyTotal] || []).map(function (x) { return { d: new Date(tms(x.start)), v: x.change }; }).filter(function (x) { return x.v !== null && x.v !== undefined; }); drawDays();
      }).catch(function () { EN.days = []; drawDays(); });
      /* Nordlys: energy.costTotal (kr købt) og energy.revenueTotal (kr solgt) = samlede kr-tællere; giver kr. pr. dag, i dag, i går, måned og år */
      var now0 = new Date(), m0 = new Date(now0.getFullYear(), now0.getMonth() - 1, 1), y0 = new Date(now0.getFullYear(), 0, 1), ms = m0 < y0 ? m0 : y0;
      /* Nordlys: energy.kpiSolar: true deler felterne i to, nederste del viser solcelleproduktionen */
      [["cost", ENT.energy.costTotal], ["rev", ENT.energy.revenueTotal], ["solk", ENT.energy.kpiSolar ? (ENT.energy.solarEnergy || ENT.energy.solarToday) : null], ["evk", ENT.energy.kpiEv ? (ENT.energy.evEnergy || ENT.energy.evToday) : null], ["evc", ENT.energy.evCost]].forEach(function (q) {
        var key = q[0], cid = q[1]; if (!cid) return;
        Promise.all([
          HASS.callWS({ type: "recorder/statistics_during_period", start_time: st.toISOString(), end_time: now0.toISOString(), statistic_ids: [cid], period: "day", types: ["change"] }),
          HASS.callWS({ type: "recorder/statistics_during_period", start_time: ms.toISOString(), end_time: now0.toISOString(), statistic_ids: [cid], period: "month", types: ["change"] }),
          /* i dag i 5-minutters statistik, så tallet ikke halter en hel time bagefter */
          HASS.callWS({ type: "recorder/statistics_during_period", start_time: new Date(now0.getFullYear(), now0.getMonth(), now0.getDate()).toISOString(), end_time: now0.toISOString(), statistic_ids: [cid], period: "5minute", types: ["change"] })
        ]).then(function (r) {
          var c = { days: {}, today: null, yest: null, month: null, lmonth: null, year: 0 }, td = now0.toDateString(), yd = new Date(now0 - 864e5).toDateString();
          (r[0][cid] || []).forEach(function (x) { if (x.change === null || x.change === undefined) return; var k = new Date(tms(x.start)).toDateString(); c.days[k] = x.change; if (k === td) c.today = x.change; if (k === yd) c.yest = x.change; });
          (r[1][cid] || []).forEach(function (x) { if (x.change === null || x.change === undefined) return; var d = new Date(tms(x.start)); if (d.getFullYear() === now0.getFullYear()) c.year += x.change; if (d.getMonth() === now0.getMonth() && d.getFullYear() === now0.getFullYear()) c.month = x.change; if (d.getTime() === m0.getTime()) c.lmonth = x.change; });
          var t5 = null; (r[2][cid] || []).forEach(function (x) { if (x.change !== null && x.change !== undefined) t5 = (t5 || 0) + x.change; });
          if (t5 !== null && t5 > (c.today || 0)) { if (c.month !== null) c.month += t5 - (c.today || 0); c.year += t5 - (c.today || 0); c.days[td] = t5; c.today = t5; }
          if (c.today === null) c.today = 0;
          EN[key] = c; renderEnergy(); drawDays();
        }).catch(function () {});
      });
      /* Nordlys: ekstra serier pr. dag: solceller (solarEnergy/solarToday), køb (gridImport), salg (gridExport) */
      EN.xdays = {};
      /* Nordlys: elbillens kr. = energy.evCost (kr-tæller) + timer før tælleren fandtes: timens kWh (evEnergy) × timens pris (price) */
      var evE = ENT.energy.evEnergy || ENT.energy.evToday, evC = ENT.energy.evCost, prI = ENT.energy.price;
      if (evE && prI && (ENT.energy.kpiEv || ENT.energy.dayEv) && /^sensor\./.test(prI)) {
        /* med evCost hentes timer kun frem til dagen efter tællerens første dag; uden evCost højst 62 dage tilbage */
        var bst = evC ? ms : new Date(Math.max(ms.getTime(), now0 - 62 * 864e5));
        (evC ? HASS.callWS({ type: "recorder/statistics_during_period", start_time: ms.toISOString(), end_time: now0.toISOString(), statistic_ids: [evC], period: "day", types: ["change"] }).then(function (r) { var f = (r[evC] || [])[0]; return f ? Math.min(now0.getTime(), tms(f.start) + 2 * 864e5) : now0.getTime(); }) : Promise.resolve(now0.getTime())).then(function (bend) {
          return HASS.callWS({ type: "recorder/statistics_during_period", start_time: bst.toISOString(), end_time: new Date(bend).toISOString(), statistic_ids: [evE, prI].concat(evC ? [evC] : []), period: "hour", types: ["change", "state"] });
        }).then(function (r) {
          var pr = {}, cFirst = Infinity; (r[prI] || []).forEach(function (x) { if (x.state !== null && x.state !== undefined) pr[tms(x.start)] = x.state; });
          if (evC) (r[evC] || []).forEach(function (x) { var t = tms(x.start); if (t < cFirst) cFirst = t; });
          var b = { days: {}, today: 0, yest: 0, month: 0, lmonth: 0, year: 0 }, td = now0.toDateString(), yd = new Date(now0 - 864e5).toDateString();
          (r[evE] || []).forEach(function (x) { var t = tms(x.start); if (t >= cFirst || !(x.change > 0)) return; var p0 = pr[t] !== undefined ? pr[t] : EN.pEff, kr = x.change * p0, d = new Date(t), ds = d.toDateString();
            b.days[ds] = (b.days[ds] || 0) + kr; if (ds === td) b.today += kr; if (ds === yd) b.yest += kr;
            if (d.getFullYear() === now0.getFullYear()) { b.year += kr; if (d.getMonth() === now0.getMonth()) b.month += kr; }
            if (d.getFullYear() === m0.getFullYear() && d.getMonth() === m0.getMonth()) b.lmonth += kr; });
          EN.evbf = b; renderEnergy(); drawDays();
        }).catch(function () {});
      }
      [["sun", ENT.energy.solarEnergy || ENT.energy.solarToday], ["buy", ENT.energy.gridImport], ["sell", ENT.energy.gridExport], ["ev", ENT.energy.dayEv ? evE : null]].forEach(function (q) {
        var k = q[0], sid = q[1]; if (!sid) return;
        HASS.callWS({ type: "recorder/statistics_during_period", start_time: st.toISOString(), end_time: new Date().toISOString(), statistic_ids: [sid], period: "day", types: ["change"] }).then(function (r) {
          var o = {}; (r[sid] || []).forEach(function (x) { if (x.change !== null && x.change !== undefined) o[new Date(tms(x.start)).toDateString()] = Math.max(0, x.change); }); EN.xdays[k] = o; drawDays();
        }).catch(function () {});
      });
    }
    function evKr(p) { if (!EN.evc && !EN.evbf) return null; var c = EN.evc ? EN.evc[p] : null, b = EN.evbf ? EN.evbf[p] : 0; return (c || 0) + (b || 0); }
    function evKrDay(ds) { var c = EN.evc ? EN.evc.days[ds] : undefined, b = EN.evbf ? EN.evbf.days[ds] : undefined; return c === undefined && b === undefined ? undefined : (c || 0) + (b || 0); }
    function drawDays() {
      var box = $("#en-days"), a = EN.days, sum = $("#en-days-sum"); if (!box) return;
      EN.pDrawn = EN.pEff;
      var eur = EN.dayUnit === "eur";
      var DJ = Array.isArray(ENT.energy.daySeries) ? "," + ENT.energy.daySeries.map(function (z) { return String(z).toLowerCase(); }).join(",") + "," : "";
      var DT = !!DJ && !/,(forbrug|use|sol|solceller|sun),/.test(DJ);
      $("#en-days-t").textContent = DT ? (eur ? "Køb og salg i kr. pr. dag" : "Køb og salg pr. dag") : (eur ? "Pris pr. dag" : "Forbrug pr. dag");
      if (!a.length) { box.innerHTML = "<div class=\"en-empty\" style=\"position:static;height:120px;display:grid\">Ingen historik</div>"; if (sum) sum.innerHTML = ""; return; }
      var CD = EN.cost && EN.cost.days ? EN.cost.days : {};
      var vals = a.map(function (x) { var c = CD[x.d.toDateString()]; return eur ? (c !== undefined ? c : x.v * EN.pEff) : x.v; }), XD = EN.xdays || {};
      var SER = [["sun", "solceller", "Solceller i alt", "mdi-solar-power-variant"], ["buy", "købt", "Købt i alt", "mdi-transmission-tower-import"], ["sell", "solgt", "Solgt i alt", "mdi-transmission-tower-export"], ["ev", "elbil", "Elbil i alt", "mdi-car-electric"]].filter(function (q) { return XD[q[0]] && Object.keys(XD[q[0]]).length; });
      /* Nordlys: energy.daySeries = hvilke søjler der vises pr. dag: forbrug, sol, køb, salg (uden nøglen vises alle) */
      var DSL = Array.isArray(ENT.energy.daySeries) ? ENT.energy.daySeries.map(function (z) { z = String(z).toLowerCase(); return { forbrug: "use", use: "use", sol: "sun", solceller: "sun", sun: "sun", "køb": "buy", kob: "buy", buy: "buy", salg: "sell", sell: "sell", elbil: "ev", ev: "ev" }[z] || z; }) : null;
      var showUse = !DSL || DSL.indexOf("use") > -1; if (DSL) SER = SER.filter(function (q) { return DSL.indexOf(q[0]) > -1; });
      /* kr. for en søjle: salg fra revenueTotal, køb fra costTotal (når energy.grid er sat, tæller costTotal kun købt strøm), ellers kWh × elpris */
      var krv = function (k, ds, v) { var r = k === "ev" ? evKrDay(ds) : k === "sell" && EN.rev ? EN.rev.days[ds] : k === "buy" && ENT.energy.grid && EN.cost ? EN.cost.days[ds] : undefined; return r !== undefined ? r : v * EN.pEff; };
      var tot = {}, mx = (showUse ? Math.max.apply(null, vals) : 0) || (SER.length ? 0 : 1);
      SER.forEach(function (q) { tot[q[0]] = 0; a.forEach(function (x) { var v = XD[q[0]][x.d.toDateString()]; if (v !== undefined) { tot[q[0]] += v; var vv = eur ? krv(q[0], x.d.toDateString(), v) : v; if (vv > mx) mx = vv; } }); });
      if (!mx) mx = 1;
      var today = new Date().toDateString(), wd = ["D", "L", "M", "M", "G", "V", "S"], tk = 0;
      a.forEach(function (x) { tk += x.v; });
      var fv = function (v) { return eur ? Number(v).toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : fmtKwh(v); };
      /* Nordlys: energy.dayLabel: "dato" skriver 25/10 under søjlerne i stedet for ugedag + dato */
      var dlab = function (d) { return String(ENT.energy.dayLabel || "").toLowerCase() === "dato" ? d.getDate() + '<span class="d-m">/' + (d.getMonth() + 1) + "</span>" : wd[d.getDay()] + d.getDate(); };
      /* Nordlys: energy.dayStack: true lægger søjlerne for hver dag oven på hinanden i én søjle, hvor farverne glider over i hinanden */
      /* Nordlys: energy.dayNet: true viser resultatet (salg − køb) under hver søjle; i kr. = solgt for − købt for */
      var dnet = function (x) { if (!ENT.energy.dayNet) return ""; var ds = x.d.toDateString(), b = (XD.buy || {})[ds], sl = (XD.sell || {})[ds], v;
        if (eur) { if (b === undefined && sl === undefined) return '<span class="d-n">&nbsp;</span>'; v = krv("sell", ds, sl || 0) - krv("buy", ds, b || 0); }
        else { if (b === undefined && sl === undefined) return '<span class="d-n">&nbsp;</span>'; v = (sl || 0) - (b || 0); }
        return '<span class="d-n ' + (v >= 0 ? "pos" : "neg") + '">' + (v >= 0 ? "+" : "−") + fv(Math.abs(v)) + "</span>"; };
      var STK = !!ENT.energy.dayStack && SER.length > 0, SCOL = { "": ["#7C5CFF", "#A78BFA"], sun: ["#F59E0B", "#FDE68A"], buy: ["#3B82F6", "#93C5FD"], sell: ["#10B981", "#6EE7B7"], ev: ["#8B5CF6", "#C4B5FD"] }, sums = [], mxS = 0;
      if (STK) { a.forEach(function (x, i) { var ds = x.d.toDateString(), t = showUse ? vals[i] : 0; SER.forEach(function (q) { var v = XD[q[0]][ds]; if (v === undefined) return; t += eur ? krv(q[0], ds, v) : v; }); sums[i] = t; if (t > mxS) mxS = t; }); if (!mxS) mxS = 1; }
      box.classList.toggle("multi", !STK && SER.length + (showUse ? 1 : 0) > 2); box.classList.toggle("stack", STK);
      box.innerHTML = a.map(function (x, i) {
        var ds = x.d.toDateString(), hp = Math.max(3, vals[i] / mx * 100), title = x.d.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" }) + " · forbrug " + fmtKwh(x.v) + " kWh · " + fmtEur(x.v * EN.pEff);
        if (!SER.length) return '<div class="day' + (ds === today ? " today" : "") + '" title="' + title + '"><span class="d-v">' + fv(vals[i]) + '</span><span class="bar2" style="height:' + hp + '%"></span><span class="d-l">' + dlab(x.d) + "</span></div>";
        var bars = showUse ? [["", hp, vals[i]]] : [], lab = showUse ? fv(vals[i]) : "";
        SER.forEach(function (q) { var v = XD[q[0]][ds]; if (v === undefined) { bars.push([q[0], 0, 0]); return; } var vv = eur ? krv(q[0], ds, v) : v; bars.push([q[0], Math.max(3, vv / mx * 100), vv]); title += " · " + q[1] + " " + fmtKwh(v) + " kWh"; lab += '<em class="' + q[0] + '">' + fv(vv) + "</em>"; });
        if (!bars.length) bars.push(["", 0, 0]);
        if (STK) {
          var tt = sums[i] || 0, acc = 0, F = 7, st2 = [];
          bars.forEach(function (b, bi) { if (!(b[2] > 0)) return; var c = SCOL[b[0]] || SCOL[""], p0 = acc / (tt || 1) * 100, p1 = (acc + b[2]) / (tt || 1) * 100; acc += b[2];
            st2.push(c[0] + " " + (st2.length ? Math.min(p1, p0 + F) : p0).toFixed(1) + "%", c[1] + " " + Math.max(p0, p1 - F).toFixed(1) + "%"); });
          var bgs = st2.length ? "linear-gradient(to top, " + st2.join(", ") + ")" : "transparent";
          return '<div class="day stk' + (ds === today ? " today" : "") + '" title="' + title + '"><span class="d-v">' + lab + '</span><span class="bar2 stkbar" style="height:' + Math.max(tt > 0 ? 3 : 0, tt / mxS * 100) + "%;background:" + bgs + '"></span>' + dnet(x) + '<span class="d-l">' + dlab(x.d) + "</span></div>";
        }
        var wp = Math.max.apply(null, bars.map(function (b) { return b[1]; })) || 1;
        return '<div class="day pair' + (ds === today ? " today" : "") + '" title="' + title + '"><span class="d-v">' + lab + '</span><span class="bars" style="height:' + wp + '%">' + bars.map(function (b) { return '<span class="bar2' + (b[0] ? " " + b[0] : "") + '" style="height:' + (b[1] / wp * 100) + '%"></span>'; }).join("") + '</span>' + dnet(x) + '<span class="d-l">' + dlab(x.d) + "</span></div>";
      }).join("");
      var tkr = 0, hasC = Object.keys(CD).length > 0; a.forEach(function (x) { var c = CD[x.d.toDateString()]; tkr += c !== undefined ? c : x.v * EN.pEff; });
      if (sum) { sum.innerHTML = "<span class=\"echip\"><i class=\"mdi mdi-sigma\"></i>I alt <b>" + fmtKwh(tk) + ' kWh</b> · <b>' + fmtEur(tkr) + "</b></span><span class=\"echip\"><i class=\"mdi mdi-chart-line\"></i>Gennemsnit pr. dag <b>" + fmtKwh(tk / a.length) + ' kWh</b> · <b>' + fmtEur(tkr / a.length) + "</b></span>" + SER.map(function (q) { return "<span class=\"echip " + q[0] + "\"><i class=\"mdi " + q[3] + "\"></i>" + q[2] + " <b>" + fmtKwh(tot[q[0]]) + " kWh</b>" + (q[0] === "ev" ? (function () { var r2 = 0, hv = false; a.forEach(function (x) { var z = evKrDay(x.d.toDateString()); if (z !== undefined) { r2 += z; hv = true; } }); return hv ? " · <b>" + fmtEur(r2) + "</b>" : ""; })() : "") + (q[0] === "sell" && EN.rev ? (function () { var r2 = 0; a.forEach(function (x) { var z = EN.rev.days[x.d.toDateString()]; if (z !== undefined) r2 += z; }); return " · <b>+" + fmtEur(r2) + "</b>"; })() : "") + "</span>"; }).join("") + "<span class=\"echip\"><i class=\"mdi mdi-information-outline\"></i>" + (hasC ? "kr. fra timepriser" + (Object.keys(CD).length < a.length ? " (ældre dage × " + fmtP(EN.pEff) + " kr/kWh)" : "") : "Beregnet med " + fmtP(EN.pEff) + " kr/kWh") + "</span>"; hydrate(sum); }
    }
    function enEnter() { renderEnergy(); enLoad(true); daysLoad(); }
    function buildEnergy() {
      if (!$("#en-hero")) return;
      $$("#en-range button").forEach(function (b) { b.addEventListener("click", function () { EN.range = b.dataset.r; $$("#en-range button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); enLoad(true); }); });
      var plot = $("#en-plot"), tip = $("#en-tip");
      function move(e) {
        if (!EN.geo) return; var r = plot.getBoundingClientRect(), x = Math.min(Math.max(e.clientX - r.left, 0), r.width), t2 = EN.geo.t0 + x / r.width * EN.geo.dt, best = null, bd = 1e18;
        EN.geo.data.forEach(function (d) { var dd = Math.abs(d.t - t2); if (dd < bd) { bd = dd; best = d; } });
        if (!best) return; var w = fmtW(best.v), cur = $("#en-cur"), px = EN.geo.xs(best.t);
        cur.style.display = ""; cur.setAttribute("x1", px); cur.setAttribute("x2", px);
        tip.hidden = false; tip.style.left = Math.min(Math.max(px / EN.geo.W * r.width, 40), r.width - 40) + "px"; var sb = null, sd2 = 1e18; (EN.geo.sol || []).forEach(function (d) { var dd = Math.abs(d.t - best.t); if (dd < sd2) { sd2 = dd; sb = d; } });
        tip.textContent = fmtHM(best.t) + " · " + w.n + " " + w.u + (EN.pEff > 0 ? " · " + fmtEur(best.v / 1000 * EN.pEff) + "/h" : "") + (sb && sd2 < 3600e3 ? " · ☀ " + fmtW(sb.v).n + " " + fmtW(sb.v).u : "");
        var eb = null, ed2 = 1e18; (EN.geo.evs || []).forEach(function (d) { var dd = Math.abs(d.t - best.t); if (dd < ed2) { ed2 = dd; eb = d; } });
        if (eb && ed2 < 3600e3 && eb.v >= 50) tip.textContent += " · Elbil " + fmtW(eb.v).n + " " + fmtW(eb.v).u;
        var nb = null, nd2 = 1e18; (EN.geo.net || []).forEach(function (d) { var dd = Math.abs(d.t - best.t); if (dd < nd2) { nd2 = dd; nb = d; } });
        if (nb && nd2 < 3600e3) tip.textContent += " · " + ((SPOS() ? nb.v > 0 : nb.v < 0) ? (SPOS() ? "Salg +" : "Salg −") : (SPOS() ? "Køb −" : "Køb +")) + fmtW(Math.abs(nb.v)).n + " " + fmtW(Math.abs(nb.v)).u;
      }
      plot.addEventListener("pointermove", move); plot.addEventListener("pointerdown", move);
      plot.addEventListener("pointerleave", function () { tip.hidden = true; var c = $("#en-cur"); if (c) c.style.display = "none"; });
      $("#chip-power").addEventListener("click", function () { show("en"); });
      EN.dayUnit = store("dayunit") === "eur" ? "eur" : "kwh";
      $$("#en-dunit button").forEach(function (b) {
        b.setAttribute("aria-pressed", b.dataset.u === EN.dayUnit ? "true" : "false");
        b.addEventListener("click", function () { EN.dayUnit = b.dataset.u; store("dayunit", EN.dayUnit); $$("#en-dunit button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); }); drawDays(); });
      });
      buildPrice();
      renderEnergy();
    }

    /* ------------------------------------------------------------------ ciclo di vita */
    var ro = null;
    function start() {
      if (running) return; running = true;
      every(function () { if (!LIVE) { chipPower(demoPower()); if (!$("#view-en").hidden) renderEnergy(); } else { livePoll(); if (!$("#view-en").hidden) enLoad(false); } enAge(); tickClock(); lastMotionText(); camsTick(); var d = new Date(), ts = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()); $$("[data-stamp]").forEach(function (n) { n.textContent = ts; }); }, 1000);
      every(tickDate, 60000);
      if (!LIVE) later(motionLoop, 1800);
      applyFx();
      if (window.ResizeObserver) { var rzT; ro = new ResizeObserver(function () { clearTimeout(rzT); rzT = setTimeout(function () { fxHero.resize(); fxPage.resize(); movePill(); }, 120); }); ro.observe($("#shell")); }
    }
    function stop() {
      running = false;
      timers.forEach(function (t) { clearInterval(t); clearTimeout(t); }); timers = [];
      if (ro) { ro.disconnect(); ro = null; }
      fxHero.stop(); fxPage.stop();
    }
    function destroy() { stop(); unbinds.forEach(function (u) { u(); }); unbinds = []; }

    /* ------------------------------------------------------------------ avvio */
    if (LIVE) { HOST.setAttribute("data-live", "1"); var fnote = $("footer.note"); if (fnote) fnote.textContent = "Nordlys " + (window.NORDLYS_VERSION || "") + " · forbundet til Home Assistant"; }
    if (EMB) HOST.setAttribute("data-embedded", "1");
    hydrate(ROOT);
    buildScenes(); buildRooms(); buildSecurity(); buildDrawer(); buildClima(); buildEnergy(); refreshAll();
    var th = store("theme"); setTheme(th === "light" ? "light" : "dark");
    setBtn(S.btn === "compact" ? "compact" : "img");
    tickDate(); tickClock(); applyWorld();
    render(); setAlarm("disarmed", true); render();
    start();
    later(function () { Object.keys(IMG).forEach(function (k) { var it = IMG[k]; [it.on, it.src].forEach(function (u) { if (u) { var i = new Image(); i.src = u; } }); }); }, 1200);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);

    return { clima: clima, state: state, S: S, setHass: setHass, start: start, stop: stop, destroy: destroy, setWorld: setWorld, applyHour: applyHour, openDrawer: openDrawer, setEdit: setEdit, fxHero: fxHero, setAlarm: setAlarm, show: show, openPrice: openPrice, ENT: ENT, runScene: function (id) { var sc = SCENES.filter(function (x) { return x.id === id; })[0]; runScene(sc, $('[data-scene="' + id + '"]')); } };
  };
})(window);


/* ---- scheda ---- */
/* ============================================================================
   AURORA GLASS v3 — scheda personalizzata per Home Assistant
   <aurora-v3-card> : una scheda a tutta pagina (usala in una vista "panel").
   Config facoltativa (YAML):
     type: custom:aurora-v3-card
     assets: /local/aurora-v3/btn/        # cartella delle immagini
     entities:                            # per cambiare le entità collegate
       lights: { salotto: light.soggiorno, ... }
   ========================================================================== */
(function () {
  // Installata da HACS la scheda sta in /hacsfiles/aurora-glass-v3/: le immagini sono accanto al file.
  function defaultAssets() {
    var s = document.querySelector('script[src*="/hacsfiles/"][src*="nordlys.js"]');
    return s ? s.src.replace(/nordlys\.js.*$/, "btn/") : "/local/aurora-v3/btn/";
  }
  var CSS = "\n/* ==========================================================================\n   AURORA GLASS v3 — \"Cielo vivo\"\n   I colori di tutta l'interfaccia vengono dalla palette dell'ora del giorno\n   (js/mondi-base.js). I token sono registrati con @property per scivolare.\n   ========================================================================== */\n\n\n\n\n\n\n\n:host {\n  --ease: cubic-bezier(.16, 1, .3, 1);\n  --spring: cubic-bezier(.34, 1.56, .64, 1);\n  --font-display: 'Sora', 'Manrope', system-ui, sans-serif;\n  --font-ui: 'Manrope', system-ui, -apple-system, 'Segoe UI', sans-serif;\n  --ok: #34D399; --warn: #FBBF24; --danger: #FB7185;\n  --b1: #7C5CFF; --b2: #3B82F6; --b3: #22D3EE; --a1: #7C5CFF; --a2: #D946EF; --win: #FFD27A;\n  transition: --b1 1.6s ease, --b2 1.6s ease, --b3 1.6s ease, --a1 1.6s ease, --a2 1.6s ease, --win 1.6s ease;\n  color-scheme: dark;\n  --bg: #070A16;\n  --surface: rgba(255,255,255,.06);\n  --surface-2: rgba(255,255,255,.10);\n  --surface-solid: #12172D;\n  --border: rgba(255,255,255,.10);\n  --hi: rgba(255,255,255,.16);\n  --text: #F5F7FF; --dim: #A3AED0; --faint: #6B7599;\n  --acc-text: color-mix(in srgb, var(--b1) 55%, #fff);\n  --blob-o: .55;\n  --shadow: 0 24px 60px -26px rgba(0,0,0,.75);\n}\n:host([data-theme=\"light\"]) {\n  color-scheme: light;\n  --bg: #EDF0FA;\n  --surface: rgba(255,255,255,.68); --surface-2: rgba(20,25,60,.07); --surface-solid: #FFFFFF;\n  --border: rgba(20,25,60,.10); --hi: rgba(255,255,255,.95);\n  --text: #141838; --dim: #55608A; --faint: #8E97B8;\n  --acc-text: color-mix(in srgb, var(--a1) 85%, #000);\n  --blob-o: .38;\n  --shadow: 0 24px 50px -28px rgba(30,40,90,.38);\n  --ok: #059669; --warn: #B45309; --danger: #E11D48;\n}\n:host([data-alarm=\"alarm\"]) { --b1: #F43F5E !important; --b2: #EF4444 !important; --b3: #FB923C !important; --a1: #E11D48 !important; --a2: #F97316 !important; }\n\n* { box-sizing: border-box; }\nhtml { scroll-behavior: smooth; }\nbody { margin: 0; min-height: 100vh; background: var(--bg); color: var(--text); font-family: var(--font-ui); font-size: 16px; line-height: 1.4; -webkit-font-smoothing: antialiased; overflow-x: hidden; }\nbutton { font: inherit; color: inherit; }\n.shell { position: relative; isolation: isolate; min-height: var(--shell-min, 100vh); color: var(--text); font-family: var(--font-ui); font-size: 16px; line-height: 1.4; -webkit-font-smoothing: antialiased; }\n.scroll { position: var(--sp, static); inset: 0; overflow: var(--so, visible); scroll-behavior: smooth; }\ni.mdi { font-style: normal; }\nimg { -webkit-user-drag: none; user-select: none; }\n[hidden] { display: none !important; }\n:focus-visible { outline: 2px solid var(--acc-text); outline-offset: 3px; border-radius: 12px; }\n\n/* ---------- sfondo vivo ---------- */\n.bg { position: var(--lp, fixed); inset: 0; z-index: -3; overflow: hidden; background: var(--bg); }\n.bg i { position: absolute; width: 74vmax; height: 74vmax; border-radius: 50%; opacity: var(--blob-o); will-change: transform; }\n.bg .o1 { left: -24vmax; top: -30vmax; background: radial-gradient(circle, var(--b1), transparent 64%); animation: drift1 30s ease-in-out infinite alternate; }\n.bg .o2 { right: -30vmax; top: 8vh; background: radial-gradient(circle, var(--b2), transparent 64%); animation: drift2 38s ease-in-out infinite alternate; }\n.bg .o3 { left: 12vw; bottom: -44vmax; background: radial-gradient(circle, var(--b3), transparent 64%); animation: drift3 44s ease-in-out infinite alternate; }\n@keyframes drift1 { to { transform: translate(14vw, 12vh) scale(1.15); } }\n@keyframes drift2 { to { transform: translate(-16vw, 14vh) scale(.9); } }\n@keyframes drift3 { to { transform: translate(18vw, -10vh) scale(1.2); } }\n.grain { position: var(--lp, fixed); inset: 0; z-index: -1; pointer-events: none; opacity: .08; mix-blend-mode: overlay; background-image: url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\"); }\n.fx-page { position: var(--lp, fixed); inset: 0; width: 100%; height: 100%; z-index: -2; pointer-events: none; }\n:host([data-theme=\"light\"]) .fx-page { filter: drop-shadow(0 0 1.5px rgba(30,50,110,.55)); }\n.vignette { position: var(--lp, fixed); inset: 0; z-index: 40; pointer-events: none; background: rgba(214,228,255, calc(var(--flash, 0) * .28)); box-shadow: inset 0 0 0 0 transparent; }\n:host([data-alarm=\"alarm\"]) .vignette { animation: vig 1.1s ease-in-out infinite; }\n@keyframes vig { 0%, 100% { box-shadow: inset 0 0 120px 10px rgba(244,63,94,.0); } 50% { box-shadow: inset 0 0 160px 24px rgba(244,63,94,.38); } }\n\n/* ---------- barra superiore ---------- */\n.wrap { width: min(1240px, 100%); margin: 0 auto; padding: 0 clamp(14px, 3vw, 32px); }\n.topbar { position: sticky; top: 0; z-index: 30; background: color-mix(in srgb, var(--bg) 58%, transparent); backdrop-filter: blur(16px) saturate(1.5); -webkit-backdrop-filter: blur(16px) saturate(1.5); border-bottom: 1px solid var(--border); }\n.topbar .wrap { display: flex; align-items: center; gap: 12px; height: 66px; }\n.brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 700; letter-spacing: -.02em; font-size: 1.05rem; white-space: nowrap; }\n.brand em { font-style: normal; font-weight: 500; color: var(--dim); }\n.logo { width: 28px; height: 28px; border-radius: 50%; background: conic-gradient(from 0deg, var(--b1), var(--b2), var(--b3), var(--b1)); -webkit-mask: radial-gradient(farthest-side, transparent 52%, #000 55%); mask: radial-gradient(farthest-side, transparent 52%, #000 55%); animation: spin 7s linear infinite; }\n@keyframes spin { to { transform: rotate(360deg); } }\n.ver { font-size: .62rem; font-weight: 800; letter-spacing: .08em; color: #fff; padding: 3px 8px; border-radius: 99px; background: linear-gradient(135deg, var(--a1), var(--a2)); }\n.status { margin: 0 auto; display: flex; align-items: center; gap: 10px; padding: 8px 16px; border-radius: 99px; background: var(--surface); border: 1px solid var(--border); font-size: .84rem; font-weight: 600; color: var(--dim); min-width: 0; }\n.status span#status-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.status .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--ok); flex: none; animation: ping2 2.4s ease-in-out infinite; }\n:host([data-alarm=\"armed\"]) .status .dot { background: var(--warn); }\n:host([data-alarm=\"alarm\"]) .status .dot { background: var(--danger); animation-duration: 1s; }\n@keyframes ping2 { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.35); opacity: .65; } 100% { transform: scale(1); opacity: 1; } }\n.top-actions { display: flex; align-items: center; gap: 10px; }\n\n.style-btn { position: relative; display: inline-flex; align-items: center; gap: 8px; padding: 0 16px; height: 40px; border: 0; border-radius: 99px; cursor: pointer; font-weight: 800; font-size: .86rem; color: #fff; background: linear-gradient(135deg, var(--a1), var(--a2)); box-shadow: 0 10px 24px -10px var(--a1); transition: transform .4s var(--spring); overflow: hidden; }\n.style-btn i { font-size: 1.15rem; animation: wiggle 3.2s ease-in-out infinite; }\n@keyframes wiggle { 0%, 80%, 100% { transform: rotate(0); } 86% { transform: rotate(-16deg) scale(1.15); } 93% { transform: rotate(14deg) scale(1.15); } }\n.style-btn::after { content: \"\"; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,.35) 50%, transparent 62%); transform: translateX(-130%); animation: shine 4.5s ease-in-out infinite; }\n@keyframes shine { 0%, 55% { transform: translateX(-130%); } 80%, 100% { transform: translateX(130%); } }\n.style-btn:hover { transform: translateY(-2px) scale(1.04); }\n.style-btn:active { transform: scale(.95); }\n\n.phase { display: flex; align-items: center; gap: 10px; padding: 6px 12px 6px 10px; border-radius: 99px; background: var(--surface); border: 1px solid var(--border); font-size: .78rem; font-weight: 700; color: var(--dim); }\n.phase i { font-size: 1.15rem; color: var(--acc-text); }\n.phase output { min-width: 3.4em; text-align: right; font-variant-numeric: tabular-nums; color: var(--text); }\ninput.ph[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 99px; outline-offset: 6px; background: linear-gradient(90deg, #1b1f4d, #e0678c 28%, #74bffb 45%, #74bffb 62%, #ea580c 78%, #1b1f4d); }\ninput.ph[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #fff; border: 3px solid var(--a1); box-shadow: 0 2px 8px rgba(0,0,0,.4); cursor: grab; transition: transform .2s var(--spring); }\ninput.ph[type=range]::-webkit-slider-thumb:hover { transform: scale(1.2); }\ninput.ph[type=range]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 3px solid var(--a1); cursor: grab; }\n.icon-btn { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; cursor: pointer; font-size: 1.2rem; background: var(--surface); border: 1px solid var(--border); color: var(--dim); transition: transform .4s var(--spring), color .2s, border-color .2s; }\n.icon-btn:hover { color: var(--text); border-color: var(--acc-text); transform: rotate(18deg) scale(1.08); }\n.icon-btn:active { transform: scale(.9); }\n\n/* ---------- hints ---------- */\n.hints { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding-top: 18px; }\n.hint { font-size: .76rem; font-weight: 600; color: var(--dim); padding: 6px 12px; border-radius: 99px; background: var(--surface); border: 1px solid var(--border); display: inline-flex; align-items: center; gap: 6px; }\n.hint i { color: var(--acc-text); }\nbutton.hint { cursor: pointer; transition: transform .3s var(--spring), border-color .2s, color .2s; }\nbutton.hint:hover { color: var(--text); border-color: var(--acc-text); transform: translateY(-2px); }\nbutton.hint.danger:hover { border-color: var(--danger); }\nbutton.hint.danger i { color: var(--danger); }\n\n/* ---------- card ---------- */\nmain { display: flex; flex-direction: column; gap: 22px; padding: 18px 0 150px; }\n.card { position: relative; border-radius: 28px; background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow), inset 0 1px 0 var(--hi); backdrop-filter: blur(14px) saturate(1.3); -webkit-backdrop-filter: blur(14px) saturate(1.3); }\n@keyframes rise { from { opacity: 0; transform: translateY(18px) scale(.985); } to { opacity: 1; transform: none; } }\n.enter > * { animation: rise .7s var(--ease) both; animation-delay: calc(var(--i, 0) * 70ms); }\n.sec-title { display: flex; align-items: center; gap: 10px; margin: 0 0 12px 4px; font-family: var(--font-display); font-weight: 700; font-size: .98rem; letter-spacing: -.01em; }\n.sec-title small { font-family: var(--font-ui); font-weight: 600; color: var(--faint); font-size: .76rem; }\n.sec-title::before { content: \"\"; width: 4px; height: 16px; border-radius: 4px; background: linear-gradient(var(--a1), var(--a2)); }\n\n/* ---------- hero con il mondo animato ---------- */\n.hero { overflow: hidden; min-height: 290px; display: flex; }\n.hero-art { position: absolute; right: 0; bottom: 0; height: 100%; aspect-ratio: 640 / 260; z-index: 0;\n  -webkit-mask-image: linear-gradient(90deg, transparent 0%, rgba(0,0,0,.7) 20%, #000 40%); mask-image: linear-gradient(90deg, transparent 0%, rgba(0,0,0,.7) 20%, #000 40%); }\n.hero-art img { position: absolute; inset: 0; width: 100%; height: 100%; display: block; opacity: 0; transition: opacity 1.1s ease; }\n.hero-art img.show { opacity: 1; }\n.wglow { position: absolute; border-radius: 2px; background: var(--win); box-shadow: 0 0 9px 2px var(--win); opacity: 0; transition: opacity .6s ease; pointer-events: none; }\n.wglow.on { opacity: 1; }\n.fx-hero { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; }\n.hero-body { position: relative; z-index: 2; padding: clamp(22px, 3vw, 36px); display: flex; flex-direction: column; justify-content: center; gap: 4px; }\n.hero-tag { position: absolute; z-index: 3; right: 16px; top: 14px; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; font-size: .74rem; font-weight: 700; color: #fff; background: rgba(8,10,30,.45); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.18); cursor: pointer; transition: transform .35s var(--spring), background .2s; }\n.hero-tag:hover { transform: translateY(-2px); background: rgba(8,10,30,.62); }\n.eyebrow { margin: 0; font-size: .74rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--faint); }\n.greet { margin: 2px 0 0; font-family: var(--font-display); font-weight: 600; font-size: clamp(1.1rem, 2.2vw, 1.5rem); letter-spacing: -.02em; }\n.clock { font-family: var(--font-display); font-weight: 800; line-height: 1; letter-spacing: -.05em; font-variant-numeric: tabular-nums; font-size: clamp(3.6rem, 9vw, 6.6rem); margin: 4px 0 8px; background: linear-gradient(110deg, var(--text) 10%, var(--acc-text) 55%, var(--a2) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; filter: drop-shadow(0 6px 24px color-mix(in srgb, var(--a1) 35%, transparent)); }\n.clock .colon { animation: blink 1s steps(1) infinite; }\n@keyframes blink { 50% { opacity: .25; } }\n.hero-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }\n.chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px 8px 10px; border-radius: 99px; font-size: .82rem; font-weight: 600; color: var(--dim); background: color-mix(in srgb, var(--bg) 45%, transparent); border: 1px solid var(--border); backdrop-filter: blur(8px); }\n.chip i { font-size: 1.1rem; color: var(--acc-text); }\n.chip b { color: var(--text); font-weight: 700; }\n.chip i.bolt { animation: zap 2.6s ease-in-out infinite; }\n@keyframes zap { 0%, 100% { transform: scale(1); } 8% { transform: scale(1.3) rotate(-8deg); } 16% { transform: scale(1); } }\n\n/* ---------- scene rapide (immagini) ---------- */\n.scenes { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }\n.scene { --s1: #fff; --s2: #fff; position: relative; overflow: hidden; display: flex; align-items: center; gap: 14px; min-height: 92px; padding: 12px 14px 12px 12px; border-radius: 24px; background: var(--surface); border: 1px solid var(--border); color: var(--text); text-align: left; cursor: pointer; box-shadow: inset 0 1px 0 var(--hi); transition: transform .45s var(--spring), border-color .25s, box-shadow .4s, background .4s; -webkit-tap-highlight-color: transparent; }\n.scene::after { content: \"\"; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(105deg, transparent 38%, rgba(255,255,255,.2) 50%, transparent 62%); transform: translateX(-130%); transition: transform .9s var(--ease); }\n.scene:hover { transform: translateY(-4px); border-color: color-mix(in srgb, var(--s1) 60%, transparent); box-shadow: 0 20px 44px -20px var(--s1), inset 0 1px 0 var(--hi); }\n.scene:hover::after { transform: translateX(130%); }\n.scene:active { transform: scale(.95); transition-duration: .12s; }\n.scene .s-img { flex: none; width: 68px; height: 68px; border-radius: 20px; object-fit: cover; box-shadow: 0 10px 22px -8px var(--s1); transition: transform .6s var(--spring); }\n.scene .s-ico { display: none; flex: none; width: 48px; height: 48px; border-radius: 16px; place-items: center; font-size: 1.55rem; color: #fff; background: linear-gradient(135deg, var(--s1), var(--s2)); box-shadow: 0 10px 22px -8px var(--s1); }\n.scene:hover .s-img { transform: scale(1.08) rotate(-3deg); }\n.scene b { display: block; font-family: var(--font-display); font-size: .95rem; font-weight: 700; letter-spacing: -.01em; }\n.scene small { display: block; color: var(--dim); font-size: .74rem; font-weight: 500; margin-top: 2px; }\n.scene.active { background: linear-gradient(135deg, color-mix(in srgb, var(--s1) 34%, transparent), color-mix(in srgb, var(--s2) 24%, transparent)); border-color: color-mix(in srgb, var(--s1) 70%, transparent); box-shadow: 0 18px 40px -22px var(--s1), inset 0 1px 0 var(--hi); }\n.spark { position: var(--lp, fixed); width: 7px; height: 7px; border-radius: 50%; pointer-events: none; z-index: 70; }\n\n/* ---------- stanze e luci (immagini) ---------- */\n.rooms { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px; }\n.room { --room: #8B5CF6; padding: 18px; display: flex; flex-direction: column; gap: 14px; overflow: hidden; }\n.room.w3 { grid-column: span 3; } .room.w2 { grid-column: span 2; }\n.room-head { display: flex; align-items: center; gap: 12px; position: relative; }\n.r-ico { width: 38px; height: 38px; border-radius: 13px; display: grid; place-items: center; font-size: 1.3rem; color: #fff; background: linear-gradient(135deg, var(--room), color-mix(in srgb, var(--room) 55%, #000)); box-shadow: 0 8px 18px -8px var(--room); }\n.room-head h3 { margin: 0; font-family: var(--font-display); font-size: 1rem; font-weight: 700; letter-spacing: -.01em; }\n.room-head .count { margin-left: auto; font-size: .76rem; font-weight: 800; padding: 4px 10px; border-radius: 99px; background: color-mix(in srgb, var(--room) 18%, transparent); color: color-mix(in srgb, var(--room) 75%, var(--text)); font-variant-numeric: tabular-nums; }\n.bar { height: 4px; border-radius: 4px; background: var(--surface-2); overflow: hidden; margin-top: -4px; }\n.bar i { display: block; height: 100%; width: 0; border-radius: 4px; background: linear-gradient(90deg, var(--room), color-mix(in srgb, var(--room) 60%, #fff)); transition: width .7s var(--ease); }\n.room-body { display: grid; gap: 10px; align-content: start; }\n.w3 .room-body { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n.w2 .room-body { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n\n.orb { position: relative; overflow: hidden; aspect-ratio: 1 / 1; padding: 0; border-radius: 22px; text-align: left; cursor: pointer; background: var(--surface); border: 1px solid var(--border); color: #fff; transition: transform .45s var(--spring), border-color .45s, box-shadow .45s; -webkit-tap-highlight-color: transparent; }\n.orb .o-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .7s var(--ease); }\n.orb:hover { transform: translateY(-3px); border-color: color-mix(in srgb, var(--room) 60%, var(--border)); }\n.orb:hover .o-img { transform: scale(1.06); }\n.orb:active { transform: scale(.94); transition-duration: .1s; }\n.orb.pop { animation: pop .55s var(--spring); }\n@keyframes pop { 0% { transform: scale(1); } 35% { transform: scale(.92); } 70% { transform: scale(1.05); } 100% { transform: scale(1); } }\n.o-shade { position: absolute; inset: auto 0 0 0; height: 56%; background: linear-gradient(to top, rgba(4,6,18,.86), transparent); pointer-events: none; }\n.o-ico { display: none; position: relative; width: 46px; height: 46px; border-radius: 15px; place-items: center; font-size: 1.6rem; background: var(--surface-2); color: var(--dim); transition: background .4s, color .4s; }\n.o-txt { position: absolute; left: 14px; right: 14px; bottom: 12px; display: flex; flex-direction: column; z-index: 2; }\n.o-name { font-weight: 800; font-size: .95rem; text-shadow: 0 1px 6px rgba(0,0,0,.5); }\n.o-state { font-size: .76rem; color: rgba(255,255,255,.72); margin-top: 1px; }\n.orb .sw { position: absolute; top: 12px; right: 12px; width: 40px; height: 24px; border-radius: 99px; background: rgba(8,10,30,.55); border: 1px solid rgba(255,255,255,.22); backdrop-filter: blur(6px); transition: background .35s; z-index: 2; }\n.orb .sw::after { content: \"\"; position: absolute; top: 2px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.35); transition: transform .5s var(--spring); }\n.orb[aria-pressed=\"true\"] { border-color: color-mix(in srgb, var(--room) 80%, transparent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--room) 50%, transparent), 0 20px 40px -18px var(--room); }\n.orb[aria-pressed=\"true\"] .o-state { color: #fff; font-weight: 800; }\n.orb[aria-pressed=\"true\"] .sw { background: var(--room); border-color: transparent; }\n.orb[aria-pressed=\"true\"] .sw::after { transform: translateX(16px); }\n\n.sensors { display: flex; flex-wrap: wrap; gap: 6px; }\n.w3 .sensors.strip, .w2 .sensors.strip { grid-column: 1 / -1; }\n.sens { display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px 4px 4px; border-radius: 99px; font-size: .74rem; font-weight: 700; color: var(--dim); background: var(--surface-2); border: 1px solid transparent; transition: background .3s, color .3s, border-color .3s, transform .35s var(--spring); position: relative; }\n.sens .s-ph { position: relative; width: 32px; height: 32px; border-radius: 50%; overflow: hidden; flex: none; background: #0b1020; }\n.sens .s-ph img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: scale(1.75); }\n.sens > i { display: none; font-size: .95rem; margin-left: 6px; }\n.sens.active { color: var(--ok); background: color-mix(in srgb, var(--ok) 15%, transparent); border-color: color-mix(in srgb, var(--ok) 45%, transparent); transform: scale(1.05); }\n.sens-cell { display: flex; flex-direction: column; gap: 8px; justify-content: center; }\n\n/* ---------- sicurezza ---------- */\n.alert { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: 22px; color: #fff; font-weight: 700; background: linear-gradient(100deg, #E11D48, #F97316); box-shadow: 0 16px 40px -14px #E11D48; animation: rise .5s var(--spring) both; }\n.alert i { font-size: 1.6rem; animation: shake .7s ease-in-out infinite; }\n@keyframes shake { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-12deg); } 75% { transform: rotate(12deg); } }\n.alert span { flex: 1; }\n.alert button { border: 0; border-radius: 14px; padding: 10px 16px; font-weight: 800; cursor: pointer; background: #fff; color: #BE123C; transition: transform .3s var(--spring); }\n.alert button:hover { transform: scale(1.06); }\n.alarm { --al: var(--ok); display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: clamp(18px, 3vw, 34px); padding: clamp(20px, 3vw, 30px); overflow: hidden; transition: border-color .6s; }\n.alarm[data-state=\"armed\"] { --al: var(--warn); }\n.alarm[data-state=\"alarm\"] { --al: var(--danger); border-color: color-mix(in srgb, var(--danger) 70%, transparent); }\n.alarm::before { content: \"\"; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(90% 140% at 0% 50%, color-mix(in srgb, var(--al) 26%, transparent), transparent 62%); transition: background .6s; }\n.shield { position: relative; width: 132px; height: 132px; border-radius: 30px; overflow: hidden; box-shadow: 0 18px 40px -14px var(--al); cursor: default; }\n.shield img { width: 100%; height: 100%; object-fit: cover; display: block; }\n.alarm-txt { position: relative; min-width: 0; }\n.alarm-txt .eyebrow { color: var(--dim); }\n.alarm-txt h2 { margin: 4px 0 6px; font-family: var(--font-display); font-weight: 800; font-size: clamp(1.5rem, 3.4vw, 2.3rem); letter-spacing: -.03em; }\n.alarm-txt p.d { margin: 0; color: var(--dim); font-size: .92rem; max-width: 46ch; }\n.seg { position: relative; display: flex; padding: 5px; border-radius: 20px; background: color-mix(in srgb, var(--bg) 40%, transparent); border: 1px solid var(--border); }\n.seg-pill { position: absolute; top: 5px; bottom: 5px; left: 5px; width: 90px; border-radius: 15px; background: linear-gradient(135deg, var(--al), color-mix(in srgb, var(--al) 55%, #000)); box-shadow: 0 8px 20px -8px var(--al); transition: transform .55s var(--spring), width .55s var(--spring), opacity .3s, background .5s; }\n.seg button { position: relative; z-index: 1; border: 0; background: transparent; padding: 14px 20px; border-radius: 15px; font-weight: 700; font-size: .88rem; color: var(--dim); cursor: pointer; transition: color .25s; white-space: nowrap; }\n.seg button[aria-pressed=\"true\"] { color: #fff; }\n.seg button:not([aria-pressed=\"true\"]):hover { color: var(--text); }\n.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }\n.panel { padding: 20px; }\n.panel h3 { margin: 0 0 4px; font-family: var(--font-display); font-size: 1rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }\n.panel .sub { margin: 0 0 14px; color: var(--dim); font-size: .82rem; }\n.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 10px; }\n.stile { position: relative; overflow: hidden; display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 20px; padding: 0; background: var(--surface-2); color: var(--text); cursor: pointer; text-align: left; transition: transform .4s var(--spring), border-color .3s, box-shadow .3s; }\n.stile .st-img { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; display: block; }\n.stile .st-ico { display: none; margin: 10px 0 0 10px; font-size: 1.5rem; color: var(--dim); }\n.stile .st-txt { padding: 8px 10px 10px; display: flex; flex-direction: column; }\n.stile .st-name { font-weight: 800; font-size: .8rem; }\n.stile .st-state { font-size: .7rem; color: var(--dim); font-weight: 600; }\n.stile:hover { transform: translateY(-3px); }\n.stile.active, .stile.open { border-color: color-mix(in srgb, var(--ok) 60%, transparent); box-shadow: 0 14px 30px -16px var(--ok); }\n.stile.active .st-state { color: var(--ok); }\n.stile.open { border-color: color-mix(in srgb, var(--warn) 65%, transparent); box-shadow: 0 14px 30px -16px var(--warn); }\n.stile.open .st-state { color: var(--warn); }\n.cams { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }\n.cam { padding: 14px; display: flex; flex-direction: column; gap: 10px; }\n.cam h4 { margin: 2px 4px 0; font-family: var(--font-display); font-size: .92rem; font-weight: 700; }\n.feed { position: relative; overflow: hidden; border-radius: 20px; aspect-ratio: 16 / 8.5; background: repeating-linear-gradient(0deg, rgba(255,255,255,.04) 0 1px, transparent 1px 4px), radial-gradient(120% 90% at 30% 20%, color-mix(in srgb, var(--b1) 60%, #10142e), transparent 70%), linear-gradient(135deg, #141a3a, color-mix(in srgb, var(--b3) 40%, #0b0f24)); }\n.feed::before { content: \"\"; position: absolute; inset: -20% -60%; background: linear-gradient(115deg, transparent 42%, rgba(255,255,255,.14) 50%, transparent 58%); animation: sweep 6s ease-in-out infinite; }\n@keyframes sweep { 0%, 100% { transform: translateX(-40%); } 50% { transform: translateX(40%); } }\n.live { position: absolute; top: 12px; left: 12px; display: flex; align-items: center; gap: 7px; padding: 4px 10px; border-radius: 99px; background: rgba(0,0,0,.4); color: #fff; font-size: .66rem; font-weight: 800; letter-spacing: .08em; }\n.live::before { content: \"\"; width: 7px; height: 7px; border-radius: 50%; background: #FF4D6A; animation: ping2 1.4s ease-in-out infinite; }\n.stamp { position: absolute; right: 12px; bottom: 10px; color: rgba(255,255,255,.8); font-size: .7rem; font-weight: 700; font-variant-numeric: tabular-nums; text-shadow: 0 1px 4px rgba(0,0,0,.6); }\n\n/* ---------- modalità compatta (solo icone) ---------- */\n:host([data-btn=\"compact\"]) .scene .s-img, :host([data-btn=\"compact\"]) .orb .o-img, :host([data-btn=\"compact\"]) .o-shade, :host([data-btn=\"compact\"]) .sens .s-ph, :host([data-btn=\"compact\"]) .stile .st-img { display: none; }\n:host([data-btn=\"compact\"]) .scene .s-ico, :host([data-btn=\"compact\"]) .o-ico, :host([data-btn=\"compact\"]) .stile .st-ico { display: grid; }\n:host([data-btn=\"compact\"]) .sens > i { display: inline-block; }\n:host([data-btn=\"compact\"]) .sens { padding: 6px 12px; }\n:host([data-btn=\"compact\"]) .orb { aspect-ratio: auto; min-height: 112px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between; color: var(--text); }\n:host([data-btn=\"compact\"]) .o-txt { position: static; }\n:host([data-btn=\"compact\"]) .o-name { text-shadow: none; }\n:host([data-btn=\"compact\"]) .o-state { color: var(--dim); }\n:host([data-btn=\"compact\"]) .orb[aria-pressed=\"true\"] { background: linear-gradient(160deg, color-mix(in srgb, var(--room) 26%, transparent), color-mix(in srgb, var(--room) 6%, transparent)); }\n:host([data-btn=\"compact\"]) .orb[aria-pressed=\"true\"] .o-ico { background: var(--room); color: #fff; }\n:host([data-btn=\"compact\"]) .orb[aria-pressed=\"true\"] .o-state { color: color-mix(in srgb, var(--room) 70%, var(--text)); }\n\n/* ---------- dock ---------- */\n.dock { position: var(--lp, fixed); left: 50%; bottom: max(18px, env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 35; display: flex; align-items: flex-end; gap: 6px; padding: 8px; border-radius: 28px; background: color-mix(in srgb, var(--surface-solid) 62%, transparent); border: 1px solid var(--border); backdrop-filter: blur(22px) saturate(1.6); -webkit-backdrop-filter: blur(22px) saturate(1.6); box-shadow: 0 24px 60px -16px rgba(0,0,0,.6), inset 0 1px 0 var(--hi); }\n.dock button { position: relative; display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 70px; padding: 10px 10px 8px; border: 0; border-radius: 20px; background: transparent; color: var(--dim); cursor: pointer; transform-origin: bottom center; transition: transform .4s var(--spring), color .2s, background .3s; -webkit-tap-highlight-color: transparent; }\n.dock button i { font-size: 1.6rem; line-height: 1; }\n.dock button span { font-size: .68rem; font-weight: 700; letter-spacing: .02em; white-space: nowrap; }\n.dock button:hover { transform: translateY(-8px) scale(1.18); color: var(--text); }\n.dock button:hover + button, .dock button:has(+ button:hover) { transform: translateY(-3px) scale(1.07); }\n.dock button:active { transform: translateY(-2px) scale(.95); transition-duration: .1s; }\n.dock button[aria-current=\"page\"] { color: #fff; background: linear-gradient(135deg, var(--a1), var(--a2)); box-shadow: 0 10px 24px -8px var(--a1); }\n.dock .sep { width: 1px; align-self: stretch; margin: 8px 4px; background: var(--border); }\n.toast { position: var(--lp, fixed); left: 50%; bottom: 128px; z-index: 80; transform: translate(-50%, 24px) scale(.96); opacity: 0; pointer-events: none; display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-radius: 99px; font-weight: 700; font-size: .88rem; background: var(--surface-solid); border: 1px solid var(--border); box-shadow: 0 18px 40px -12px rgba(0,0,0,.55); transition: transform .5s var(--spring), opacity .3s; max-width: calc(100vw - 28px); }\n.toast.show { transform: translate(-50%, 0) scale(1); opacity: 1; }\n.toast i { font-size: 1.25rem; color: var(--ok); }\nfooter.note { text-align: center; color: var(--faint); font-size: .78rem; padding: 6px 0 0; }\n\n/* ---------- pannello Stile ---------- */\n.scrim { position: var(--lp, fixed); inset: 0; z-index: 50; background: rgba(4,6,18,.5); backdrop-filter: blur(3px); opacity: 0; pointer-events: none; transition: opacity .4s ease; }\n.scrim.open { opacity: 1; pointer-events: auto; }\n.drawer { position: var(--lp, fixed); top: 0; right: 0; bottom: 0; z-index: 55; width: min(430px, 100vw); display: flex; flex-direction: column; background: color-mix(in srgb, var(--surface-solid) 86%, transparent); backdrop-filter: blur(26px) saturate(1.5); -webkit-backdrop-filter: blur(26px) saturate(1.5); border-left: 1px solid var(--border); box-shadow: -30px 0 80px -30px rgba(0,0,0,.6); transform: translateX(104%); transition: transform .6s var(--ease); }\n.drawer.open { transform: none; }\n.dr-head { display: flex; align-items: center; gap: 12px; padding: 18px 20px 12px; }\n.dr-head h2 { margin: 0; font-family: var(--font-display); font-size: 1.15rem; font-weight: 800; letter-spacing: -.02em; flex: 1; }\n.dr-body { flex: 1; overflow-y: auto; padding: 4px 20px 26px; display: flex; flex-direction: column; gap: 22px; }\n.dr-sec h3 { margin: 0 0 10px; font-family: var(--font-display); font-size: .85rem; letter-spacing: .02em; display: flex; align-items: center; gap: 8px; }\n.dr-sec h3 small { font-family: var(--font-ui); font-weight: 600; color: var(--faint); }\n.worlds { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }\n.wcard { position: relative; overflow: hidden; padding: 0; border: 2px solid transparent; border-radius: 18px; background: var(--surface-2); cursor: pointer; text-align: left; transition: transform .4s var(--spring), border-color .3s, box-shadow .3s; }\n.wcard img { display: block; width: 100%; aspect-ratio: 640 / 260; object-fit: cover; }\n.wcard span { position: absolute; left: 0; right: 0; bottom: 0; padding: 18px 10px 8px; font-weight: 800; font-size: .8rem; color: #fff; background: linear-gradient(to top, rgba(4,6,18,.8), transparent); display: flex; align-items: center; gap: 6px; }\n.wcard:hover { transform: translateY(-3px) scale(1.02); }\n.wcard.sel { border-color: var(--acc-text); box-shadow: 0 12px 30px -12px var(--a1); }\n.wcard.sel::after { content: \"\\2713\"; font-weight: 900; position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%; background: linear-gradient(135deg, var(--a1), var(--a2)); color: #fff; font-size: 1rem; }\n.fxgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }\n.fxchip { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 6px 10px; border: 1px solid var(--border); border-radius: 16px; background: var(--surface-2); color: var(--dim); font-size: .72rem; font-weight: 700; cursor: pointer; text-align: center; transition: transform .35s var(--spring), border-color .25s, background .25s, color .25s; }\n.fxchip i { font-size: 1.5rem; }\n.fxchip:hover { transform: translateY(-2px); color: var(--text); }\n.fxchip.sel { color: #fff; background: linear-gradient(135deg, var(--a1), var(--a2)); border-color: transparent; box-shadow: 0 10px 22px -10px var(--a1); }\n.row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 16px; background: var(--surface-2); font-size: .84rem; font-weight: 700; }\n.row small { display: block; font-weight: 500; color: var(--dim); font-size: .72rem; }\n.row .grow { flex: 1; }\n.toggle { position: relative; width: 44px; height: 26px; border-radius: 99px; border: 0; background: rgba(120,130,170,.35); cursor: pointer; flex: none; transition: background .3s; }\n.toggle::after { content: \"\"; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.35); transition: transform .45s var(--spring); }\n.toggle[aria-pressed=\"true\"] { background: linear-gradient(135deg, var(--a1), var(--a2)); }\n.toggle[aria-pressed=\"true\"]::after { transform: translateX(18px); }\n.segm { display: flex; padding: 4px; border-radius: 14px; background: var(--surface-2); gap: 2px; }\n.segm button { flex: 1; border: 0; background: transparent; padding: 9px 10px; border-radius: 11px; font-weight: 700; font-size: .8rem; color: var(--dim); cursor: pointer; transition: background .3s, color .3s; }\n.segm button[aria-pressed=\"true\"] { color: #fff; background: linear-gradient(135deg, var(--a1), var(--a2)); }\n.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 14px; padding: 12px 16px; font-weight: 800; font-size: .86rem; cursor: pointer; color: #fff; background: linear-gradient(135deg, var(--a1), var(--a2)); transition: transform .35s var(--spring); }\n.btn:hover { transform: translateY(-2px); } .btn:active { transform: scale(.96); }\n.btn.ghost { color: var(--text); background: var(--surface-2); border: 1px solid var(--border); }\n.btn.wide { width: 100%; }\n\n/* ---------- modalità modifica + editor immagini ---------- */\n.edit-banner { position: sticky; top: 66px; z-index: 29; }\n.edit-banner .wrap { padding-top: 10px; }\n.edit-banner .in { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 18px; font-weight: 700; font-size: .86rem; color: #fff; background: linear-gradient(100deg, var(--a1), var(--a2)); box-shadow: 0 14px 30px -14px var(--a1); animation: rise .5s var(--spring) both; }\n.edit-banner .in i { font-size: 1.3rem; }\n.edit-banner .in span { flex: 1; }\n.edit-banner .in button { border: 0; border-radius: 12px; padding: 8px 14px; font-weight: 800; cursor: pointer; background: #fff; color: #1b1740; }\n.edit-badge { display: none; position: absolute; top: 8px; left: 8px; width: 28px; height: 28px; border-radius: 50%; place-items: center; font-size: .95rem; color: #fff; z-index: 6; background: linear-gradient(135deg, var(--a1), var(--a2)); box-shadow: 0 6px 14px -4px var(--a1); animation: pulse-b 1.6s ease-in-out infinite; pointer-events: none; }\n@keyframes pulse-b { 50% { transform: scale(1.14); } }\n:host([data-edit=\"1\"]) [data-img] { outline: 2px dashed color-mix(in srgb, var(--acc-text) 80%, transparent); outline-offset: 2px; cursor: copy !important; }\n:host([data-edit=\"1\"]) .edit-badge { display: grid; }\n:host([data-edit=\"1\"]) .sens .edit-badge { top: -6px; left: -6px; width: 20px; height: 20px; font-size: .7rem; }\n:host([data-edit=\"1\"]) .shield { cursor: copy; }\n.modal { position: var(--lp, fixed); inset: 0; z-index: 90; display: grid; place-items: center; padding: 16px; background: rgba(4,6,18,.6); backdrop-filter: blur(6px); opacity: 0; pointer-events: none; transition: opacity .35s; }\n.modal.open { opacity: 1; pointer-events: auto; }\n.mcard { width: min(820px, 100%); max-height: calc(100vh - 32px); overflow: auto; border-radius: 28px; background: color-mix(in srgb, var(--surface-solid) 94%, transparent); border: 1px solid var(--border); box-shadow: 0 40px 100px -30px rgba(0,0,0,.7); padding: 22px; display: flex; flex-direction: column; gap: 18px; transform: translateY(24px) scale(.97); transition: transform .5s var(--spring); }\n.modal.open .mcard { transform: none; }\n.mhead { display: flex; align-items: center; gap: 12px; }\n.mhead h2 { margin: 0; font-family: var(--font-display); font-size: 1.1rem; font-weight: 800; flex: 1; letter-spacing: -.02em; }\n.mhead small { display: block; font-family: var(--font-ui); font-weight: 600; color: var(--dim); font-size: .78rem; margin-top: 2px; }\n.slots { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }\n.slots.one { grid-template-columns: minmax(0, 260px); justify-content: center; }\n.slot { display: flex; flex-direction: column; gap: 8px; }\n.slot h4 { margin: 0; font-size: .78rem; letter-spacing: .1em; text-transform: uppercase; color: var(--faint); font-weight: 800; }\n.drop { position: relative; aspect-ratio: 1 / 1; max-height: 230px; width: 100%; border-radius: 22px; overflow: hidden; border: 2px dashed var(--border); background: var(--surface-2); display: grid; place-items: center; cursor: pointer; transition: border-color .25s, transform .3s var(--spring); }\n.drop:hover, .drop.over { border-color: var(--acc-text); transform: scale(1.02); }\n.drop img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }\n.drop .hintt { position: absolute; left: 0; right: 0; bottom: 0; padding: 22px 10px 10px; text-align: center; font-size: .74rem; font-weight: 700; color: #fff; background: linear-gradient(to top, rgba(4,6,18,.82), transparent); }\n.drop input { display: none; }\n.libtabs { display: flex; gap: 6px; flex-wrap: wrap; }\n.libtabs button { border: 1px solid var(--border); background: var(--surface-2); color: var(--dim); border-radius: 99px; padding: 6px 14px; font-weight: 700; font-size: .78rem; cursor: pointer; }\n.libtabs button[aria-pressed=\"true\"] { color: #fff; background: linear-gradient(135deg, var(--a1), var(--a2)); border-color: transparent; }\n.lib { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 8px; }\n.lib button { padding: 0; border: 2px solid transparent; border-radius: 16px; overflow: hidden; background: var(--surface-2); cursor: pointer; transition: transform .3s var(--spring), border-color .25s; position: relative; }\n.lib button:hover { transform: scale(1.06); border-color: var(--acc-text); }\n.lib img { display: block; width: 100%; aspect-ratio: 1 / 1; object-fit: cover; }\n.lib span { position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 4px 4px; font-size: .62rem; font-weight: 800; color: #fff; text-align: center; background: linear-gradient(to top, rgba(4,6,18,.8), transparent); }\n.mfoot { display: flex; gap: 10px; justify-content: space-between; flex-wrap: wrap; }\n.note-sm { font-size: .76rem; color: var(--dim); margin: 0; }\n\n/* ---------- dati reali (Home Assistant) ---------- */\n:host([data-live]) [data-demo] { display: none !important; }\n.sens.na, .stile.na, .orb.na { opacity: .5; }\n.sens.na .s-ph, .stile.na .st-img { filter: grayscale(1); }\n.drow { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 16px; background: var(--surface-2); }\n.drow i { font-size: 1.3rem; color: var(--acc-text); }\n.drow output { min-width: 3.2em; text-align: right; font-weight: 800; font-variant-numeric: tabular-nums; font-size: .86rem; }\n.code-in { width: 100%; padding: 14px 16px; border-radius: 16px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text); font: inherit; font-size: 1.4rem; letter-spacing: .4em; text-align: center; }\n.cam .feed-live { border-radius: 20px; overflow: hidden; background: #0b0f24; min-height: 120px; }\n.cam .feed-live > * { display: block; }\n.cam .feed-live ha-card { border-radius: 0; box-shadow: none; }\n.cam-na { display: grid; place-items: center; align-content: center; gap: 8px; aspect-ratio: 16 / 8.5; color: var(--dim); font-weight: 700; font-size: .82rem; text-align: center; cursor: pointer; background: linear-gradient(135deg, color-mix(in srgb, var(--b1) 22%, #0b0f24), #0b0f24); }\n.cam-na i { font-size: 2.2rem; color: var(--acc-text); }\n\n/* ---------- indicatore \"in tempo reale\" ---------- */\n.livedot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-left: 8px; vertical-align: middle; background: #34D399; box-shadow: 0 0 0 0 rgba(52,211,153,.7); animation: livep 1.8s ease-out infinite; flex: none; }\n.eyebrow .livedot { margin: 0 8px 0 0; }\n@keyframes livep { 0% { box-shadow: 0 0 0 0 rgba(52,211,153,.7); } 70%, 100% { box-shadow: 0 0 0 9px rgba(52,211,153,0); } }\n.pdelta { font-size: .68rem; font-weight: 800; margin-left: 2px; opacity: 0; transition: opacity .5s; font-variant-numeric: tabular-nums; }\n.pdelta.up { color: #FB923C; opacity: 1; } .pdelta.dn { color: #34D399; opacity: 1; }\n#power-val, #en-num { font-variant-numeric: tabular-nums; }\n#en-age { font-weight: 700; letter-spacing: 0; text-transform: none; color: var(--faint); }\n\n/* ---------- energia ---------- */\n.en-top { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); gap: 14px; }\n.en-hero { --lc: #34D399; display: flex; align-items: center; gap: 18px; padding: 22px; overflow: hidden; }\n.en-hero[data-lvl=\"mid\"] { --lc: #FBBF24; } .en-hero[data-lvl=\"high\"] { --lc: #FB923C; } .en-hero[data-lvl=\"crit\"] { --lc: #F43F5E; } .en-hero.na { opacity: .6; }\n.en-hero::before { content: \"\"; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(70% 120% at 0% 50%, color-mix(in srgb, var(--lc) 22%, transparent), transparent 62%); transition: background .8s; }\n.en-gauge { position: relative; flex: none; width: 210px; height: 190px; }\n.gsvg { width: 100%; height: 100%; display: block; overflow: visible; }\n.g-track { fill: none; stroke: var(--surface-2); stroke-width: 15; stroke-linecap: round; }\n.g-val { fill: none; stroke: url(#engrad); stroke-width: 15; stroke-linecap: round; transition: stroke-dasharray 1s var(--ease); }\n.g-glow { opacity: .55; }\n.g-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-bottom: 6px; pointer-events: none; }\n.g-num { font-family: var(--font-display); font-weight: 800; font-size: 2.9rem; letter-spacing: -.05em; line-height: 1; font-variant-numeric: tabular-nums; }\n.g-unit { font-weight: 800; font-size: .95rem; color: var(--dim); margin-top: 2px; letter-spacing: .06em; }\n.en-side { position: relative; min-width: 0; display: flex; flex-direction: column; gap: 4px; }\n.en-side h3 { margin: 2px 0 2px; font-family: var(--font-display); font-weight: 800; font-size: clamp(1.25rem, 2.4vw, 1.7rem); letter-spacing: -.03em; color: var(--lc); }\n.en-side p.d { margin: 0; color: var(--dim); font-size: .88rem; }\n.en-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }\n.echip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 99px; font-size: .74rem; font-weight: 700; color: var(--dim); background: var(--surface-2); }\n.echip b { color: var(--text); font-weight: 800; font-variant-numeric: tabular-nums; }\n.echip i { font-size: 1rem; color: var(--acc-text); }\n.en-chart { padding: 18px 20px 16px; display: flex; flex-direction: column; gap: 8px; }\n.en-chart-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }\n.en-chart-head h3 { margin: 0; font-family: var(--font-display); font-size: 1rem; font-weight: 700; }\n.en-chart-head h3 small { font-family: var(--font-ui); font-weight: 600; color: var(--faint); font-size: .76rem; margin-left: 6px; }\n.rchips { display: inline-flex; padding: 3px; border-radius: 12px; background: var(--surface-2); gap: 2px; }\n.rchips button { border: 0; background: transparent; color: var(--dim); padding: 6px 12px; border-radius: 9px; font-weight: 700; font-size: .76rem; cursor: pointer; transition: background .25s, color .25s; }\n.rchips button[aria-pressed=\"true\"] { color: #fff; background: linear-gradient(135deg, var(--a1), var(--a2)); }\n.en-plot { position: relative; height: 170px; }\n.en-plot svg { width: 100%; height: 100%; display: block; overflow: visible; }\n.en-plot .area { fill: url(#enarea); } .en-plot .line { fill: none; stroke: var(--acc-text); stroke-width: 2.4; vector-effect: non-scaling-stroke; stroke-linejoin: round; }\n.en-plot .base { stroke: var(--faint); stroke-width: 1; stroke-dasharray: 4 5; vector-effect: non-scaling-stroke; opacity: .7; }\n.en-plot .grid { stroke: var(--border); stroke-width: 1; vector-effect: non-scaling-stroke; }\n.en-plot .cursor { stroke: var(--text); stroke-width: 1; opacity: .55; vector-effect: non-scaling-stroke; }\n.en-tip { position: absolute; top: 4px; transform: translateX(-50%); padding: 5px 9px; border-radius: 10px; font-size: .72rem; font-weight: 800; white-space: nowrap; pointer-events: none; background: var(--surface-solid); border: 1px solid var(--border); box-shadow: 0 8px 20px -8px rgba(0,0,0,.5); }\n.en-empty { position: absolute; inset: 0; display: grid; place-items: center; color: var(--faint); font-weight: 700; font-size: .84rem; }\n.en-axis { display: flex; justify-content: space-between; font-size: .68rem; color: var(--faint); font-weight: 700; font-variant-numeric: tabular-nums; }\n.en-stats { display: flex; flex-wrap: wrap; gap: 6px; }\n.kpis { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }\n.kpi { padding: 16px 16px 14px; display: flex; flex-direction: column; gap: 4px; position: relative; overflow: hidden; }\n.kpi .k-l { display: flex; align-items: center; gap: 7px; font-size: .72rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--faint); }\n.kpi .k-l i { color: var(--acc-text); font-size: 1.05rem; }\n.kpi .k-v { font-family: var(--font-display); font-weight: 800; font-size: 1.7rem; letter-spacing: -.04em; font-variant-numeric: tabular-nums; line-height: 1.1; }\n.kpi .k-v small { font-family: var(--font-ui); font-size: .8rem; font-weight: 700; color: var(--dim); letter-spacing: 0; margin-left: 3px; }\n.kpi .k-c { font-weight: 800; font-size: .9rem; color: var(--acc-text); font-variant-numeric: tabular-nums; }\n.kpi .k-s { font-size: .72rem; color: var(--dim); font-weight: 600; }\n.kpi.na { opacity: .55; }\n.kpi .k-sol { display: flex; flex-direction: column; gap: 3px; margin-top: 8px; padding-top: 10px; border-top: 1px solid var(--border); }\n.kpi .k-sol .k-l i { color: #FBBF24; }\n.kpi .k-sol .k-v { font-size: 1.35rem; color: #FDE68A; }\n.kpi.split .k-s { margin-top: 4px; }\n.kpi .k-net { display: block; margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--border); font-size: .9rem; font-weight: 700; color: var(--dim); }\n.kpi .k-net b { font-weight: 800; font-variant-numeric: tabular-nums; }\n.kpi .k-net.pos b { color: #34D399; } .kpi .k-net.neg b { color: #FB7185; }\n.kpi .k-c.neg { color: #FB7185; }\n.en-days { padding: 18px 20px 16px; }\n.days { display: grid; grid-template-columns: repeat(14, minmax(0, 1fr)); gap: 6px; align-items: end; height: 150px; margin-top: 10px; }\n.day { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; height: 100%; min-width: 0; }\n.day .bar2 { width: 100%; max-width: 34px; min-height: 3px; border-radius: 8px 8px 4px 4px; background: linear-gradient(to top, var(--a1), var(--a2)); opacity: .8; transition: height .9s var(--ease); position: relative; }\n.day.today .bar2 { opacity: 1; box-shadow: 0 0 18px -2px var(--a1); }\n.day .d-v { font-size: .66rem; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--dim); }\n.day .d-l { font-size: .64rem; font-weight: 700; color: var(--faint); }\n.share { display: flex; height: 14px; border-radius: 99px; overflow: hidden; background: var(--surface-2); margin: 0 2px 8px; }\n.share i { display: block; height: 100%; transition: width .9s var(--ease); }\n.share-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 0 2px 12px; font-size: .74rem; font-weight: 700; color: var(--dim); }\n.share-legend span::before { content: \"\"; display: inline-block; width: 9px; height: 9px; border-radius: 3px; background: var(--c); margin-right: 6px; }\n.apps { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }\n.app { --c: #8B5CF6; position: relative; display: flex; flex-direction: column; gap: 3px; padding: 14px; border-radius: 22px; background: var(--surface); border: 1px solid var(--border); box-shadow: inset 0 1px 0 var(--hi); transition: border-color .4s, box-shadow .4s, transform .4s var(--spring); cursor: pointer; text-align: left; color: var(--text); }\n.app:hover { transform: translateY(-3px); }\n.app .a-ico { position: relative; width: 48px; height: 48px; border-radius: 16px; display: grid; place-items: center; font-size: 1.6rem; color: var(--dim); background: var(--surface-2); margin-bottom: 6px; transition: background .4s, color .4s; }\n.app .a-name { font-weight: 800; font-size: .88rem; }\n.app .a-w { font-family: var(--font-display); font-weight: 800; font-size: 1.3rem; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }\n.app .a-e { font-size: .72rem; color: var(--dim); font-weight: 600; }\n\n/* ---------- tariffa (€/kWh) ---------- */\n.price-bar { display: flex; align-items: center; gap: 14px; padding: 14px 18px; width: 100%; text-align: left; color: var(--text); font: inherit; cursor: pointer; transition: transform .35s var(--spring), border-color .25s; }\n.price-bar:hover { transform: translateY(-2px); border-color: var(--acc-text); }\n.price-bar .pb-ico { width: 46px; height: 46px; border-radius: 15px; display: grid; place-items: center; font-size: 1.55rem; color: #fff; flex: none; background: linear-gradient(135deg, var(--a1), var(--a2)); }\n.price-bar.unset .pb-ico { background: linear-gradient(135deg, #F59E0B, #F43F5E); }\n.price-bar .pb-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }\n.price-bar .pb-txt b { font-family: var(--font-display); font-weight: 800; font-size: 1.04rem; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }\n.price-bar .pb-txt small { color: var(--dim); font-size: .76rem; font-weight: 600; line-height: 1.3; }\n.price-bar .pb-cta { display: inline-flex; align-items: center; gap: 6px; padding: 9px 15px; border-radius: 99px; font-weight: 800; font-size: .8rem; flex: none; background: var(--surface-2); color: var(--acc-text); }\n.kpis { cursor: pointer; }\n.echip.cost { cursor: pointer; }\n.echip.sun i { color: #FBBF24; }\n.en-gauges { display: flex; gap: 4px; flex: none; }\n.en-gauge[hidden], .g-lab[hidden] { display: none; }\n.en-gauge.sol .g-val { stroke: url(#solgrad); }\n.g-lab { font-size: .66rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--faint); margin-top: 5px; }\n.en-hero.dual .en-gauge { width: 165px; height: 150px; }\n.en-hero.dual .g-num { font-size: 2.25rem; }\n.en-hero.dual { flex-wrap: wrap; row-gap: 6px; }\n.en-hero.dual .en-side { flex: 1 1 240px; }\n.en-plot .sarea { fill: url(#solarea); }\n.g-numrow { display: inline-flex; align-items: baseline; }\n.g-sign { margin-right: .04em; }\n.en-gauge.net .g-val { stroke: url(#buygrad); }\n.en-gauge.net.sell .g-val { stroke: url(#sellgrad); }\n.en-gauge.sol.sig-on .g-num { color: #34D399; }\n.en-gauge.net.sig:not(.sell) .g-num { color: #FB7185; }\n.en-gauge.net.sig.sell .g-num { color: #34D399; }\n.en-hero.dual.triple .en-gauge { width: 140px; height: 128px; }\n.en-hero.dual.triple .g-num { font-size: 1.9rem; }\n.en-hero.dual.triple .en-gauges { gap: 0; }\n@media (max-width: 720px) { .en-hero.dual.triple .en-gauge { width: 100px; height: 92px; } .en-hero.dual.triple .g-num { font-size: 1.3rem; } .en-hero.dual.triple .g-unit { font-size: .7rem; } .en-hero.dual.triple .g-lab { font-size: .56rem; letter-spacing: .08em; } .en-hero.dual.triple .g-track, .en-hero.dual.triple .g-val { stroke-width: 18; } }\n.en-plot .sline { fill: none; stroke: #FBBF24; stroke-width: 2.4; vector-effect: non-scaling-stroke; stroke-linejoin: round; }\n.day .bars { display: flex; align-items: flex-end; gap: 2px; width: 100%; max-width: 40px; }\n.day .bars .bar2 { flex: 1 1 0; min-width: 0; max-width: none; }\n.day .bar2.sun { background: linear-gradient(to top, #F59E0B, #FDE68A); }\n.day.today .bar2.sun { box-shadow: 0 0 18px -2px #F59E0B; }\n.day .d-v em { display: block; font-style: normal; color: #FBBF24; text-align: center; }\n.day .d-v em.buy { color: #60A5FA; } .day .d-v em.ev { color: #C4B5FD; }\n.day .bar2.ev { background: linear-gradient(to top, #8B5CF6, #C4B5FD); } .day .d-v em.sell { color: #34D399; }\n.day .bar2.buy { background: linear-gradient(to top, #3B82F6, #93C5FD); }\n.day .bar2.sell { background: linear-gradient(to top, #10B981, #6EE7B7); }\n.days.stack .day .bar2.stkbar { max-width: 40px; opacity: .92; }\n.day .d-n { font-size: .64rem; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--dim); white-space: nowrap; margin-bottom: -3px; }\n.day .d-n.pos { color: #34D399; } .day .d-n.neg { color: #FB7185; }\n@media (max-width: 720px) { .day .d-n { display: none; } .day .d-m { display: none; } }\n.days.stack .day.today .bar2.stkbar { opacity: 1; box-shadow: 0 0 18px -4px rgba(255,255,255,.35); }\n.days.multi .day .bars { max-width: 52px; gap: 1px; }\n.days.multi .day .bar2 { border-radius: 4px 4px 2px 2px; }\n.k-sold { display: block; font-style: normal; font-size: .9rem; font-weight: 800; color: #34D399; margin-top: 2px; font-variant-numeric: tabular-nums; }\n.echip.buy i { color: #60A5FA; } .echip.sell i { color: #34D399; }\n.en-plot .nline { fill: none; stroke: url(#netgrad); stroke-width: 2; vector-effect: non-scaling-stroke; stroke-linejoin: round; }\n.en-plot .zero { stroke: var(--dim); stroke-width: 1; stroke-dasharray: 2 4; vector-effect: non-scaling-stroke; opacity: .6; }\n@media (max-width: 720px) { .en-hero.dual .en-gauge { width: 140px; height: 128px; } .en-hero.dual .g-num { font-size: 1.9rem; } }\n.pr-field { display: flex; align-items: center; gap: 8px; }\n.pr-field .icon-btn { flex: none; }\n.pr-box { flex: 1; min-width: 0; display: flex; align-items: baseline; justify-content: center; gap: 6px; padding: 10px 12px; border-radius: 18px; border: 1px solid var(--border); background: var(--surface-2); }\n.pr-box:focus-within { border-color: var(--acc-text); }\n.pr-box input { width: 4.6em; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--text); font-family: var(--font-display); font-weight: 800; font-size: 1.9rem; letter-spacing: -.04em; text-align: right; font-variant-numeric: tabular-nums; -moz-appearance: textfield; }\n.pr-box input::-webkit-outer-spin-button, .pr-box input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }\n.pr-box span { font-weight: 800; color: var(--dim); font-size: .8rem; white-space: nowrap; }\n.pr-pre { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }\n.pr-pre button, .linkb { border: 1px solid var(--border); background: var(--surface-2); color: var(--dim); border-radius: 99px; padding: 6px 13px; font: inherit; font-weight: 800; font-size: .78rem; cursor: pointer; font-variant-numeric: tabular-nums; transition: transform .3s var(--spring), color .2s, border-color .2s; }\n.pr-pre button:hover, .linkb:hover { color: var(--text); border-color: var(--acc-text); transform: translateY(-2px); }\n.pr-pre button[aria-pressed=\"true\"] { color: #fff; border-color: transparent; background: linear-gradient(135deg, var(--a1), var(--a2)); }\n.linkb { padding: 4px 11px; font-size: .74rem; margin-left: 6px; color: var(--acc-text); }\n.pr-hint { margin: 0; padding: 10px 14px; border-radius: 14px; font-size: .8rem; font-weight: 600; color: var(--dim); background: var(--surface-2); }\n.pr-hint b { color: var(--text); }\n.pr-calc { border-radius: 16px; background: var(--surface-2); padding: 12px 14px; }\n.pr-calc summary { cursor: pointer; font-weight: 800; font-size: .84rem; display: flex; align-items: center; gap: 8px; list-style: none; }\n.pr-calc summary::-webkit-details-marker { display: none; }\n.pr-calc summary i { color: var(--acc-text); font-size: 1.2rem; }\n.pr-calc-in { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }\n.pr-calc-in label { display: flex; flex-direction: column; gap: 5px; font-size: .72rem; font-weight: 700; color: var(--dim); }\n.pr-calc-in label span { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface); color: var(--dim); font-weight: 800; }\n.pr-calc-in input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--text); font: inherit; font-weight: 800; font-size: 1rem; font-variant-numeric: tabular-nums; }\n.pr-calc-out { margin: 10px 0 4px; font-size: .86rem; font-weight: 700; color: var(--dim); min-height: 1.2em; }\n.pr-calc-out b { color: var(--text); font-size: 1rem; }\n.app.run { border-color: color-mix(in srgb, var(--c) 60%, transparent); box-shadow: 0 16px 34px -18px var(--c); }\n.app.run .a-ico { color: #fff; background: linear-gradient(135deg, var(--c), color-mix(in srgb, var(--c) 55%, #000)); animation: halo2 2.2s ease-out infinite; }\n@keyframes halo2 { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--c) 60%, transparent); } 70%, 100% { box-shadow: 0 0 0 12px transparent; } }\n.app.na { opacity: .5; }\n\n/* ---------- clima ---------- */\n.clima { --cl: #64748B; display: grid; grid-template-columns: auto 1fr; gap: clamp(16px, 3vw, 30px); padding: clamp(18px, 2.4vw, 26px); overflow: hidden; transition: border-color .5s; }\n.clima::before { content: \"\"; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(80% 140% at 0% 40%, color-mix(in srgb, var(--cl) 26%, transparent), transparent 62%); transition: background .6s; }\n.clima:not([data-mode=\"off\"]) { border-color: color-mix(in srgb, var(--cl) 45%, var(--border)); }\n.clima.na { opacity: .6; }\n.cl-art { position: relative; width: 230px; aspect-ratio: 1 / 1; border-radius: 28px; overflow: hidden; box-shadow: 0 22px 44px -18px var(--cl); align-self: start; }\n.cl-art img { width: 100%; height: 100%; object-fit: cover; display: block; }\n.cl-main { position: relative; display: flex; flex-direction: column; gap: 16px; min-width: 0; }\n.cl-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; flex-wrap: wrap; }\n.cl-top h3 { margin: 4px 0 4px; font-family: var(--font-display); font-weight: 800; font-size: clamp(1.4rem, 3vw, 2rem); letter-spacing: -.03em; }\n.cl-top p.d { margin: 0; color: var(--dim); font-size: .9rem; }\n.tctl { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 26px; background: color-mix(in srgb, var(--bg) 40%, transparent); border: 1px solid var(--border); }\n.tbig { font-family: var(--font-display); font-weight: 800; font-size: 2.6rem; letter-spacing: -.04em; line-height: 1; min-width: 4.4ch; text-align: center; font-variant-numeric: tabular-nums; }\n.tbig small { font-size: 1rem; font-weight: 700; color: var(--dim); margin-left: 2px; }\n.rbtn { width: 52px; height: 52px; border: 0; border-radius: 50%; display: grid; place-items: center; cursor: pointer; font-size: 1.6rem; color: #fff; background: linear-gradient(135deg, var(--cl), color-mix(in srgb, var(--cl) 55%, #000)); box-shadow: 0 10px 22px -10px var(--cl); transition: transform .35s var(--spring), opacity .25s; }\n.rbtn:hover { transform: scale(1.1); } .rbtn:active { transform: scale(.88); transition-duration: .08s; }\n.rbtn:disabled { opacity: .4; cursor: default; }\n.cl-sec h5 { margin: 0 0 8px; font-size: .72rem; letter-spacing: .12em; text-transform: uppercase; color: var(--faint); font-weight: 800; }\n.cchips { display: flex; flex-wrap: wrap; gap: 8px; }\n.cchip { --cl: #64748B; display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 14px; border: 1px solid var(--border); background: var(--surface-2); color: var(--dim); font-weight: 700; font-size: .82rem; cursor: pointer; transition: transform .35s var(--spring), background .3s, color .3s, box-shadow .3s; }\n.cchip.sm { padding: 8px 12px; font-size: .78rem; }\n.cchip:hover { transform: translateY(-2px); color: var(--text); }\n.cchip[aria-pressed=\"true\"] { color: #fff; border-color: transparent; background: linear-gradient(135deg, var(--cl), color-mix(in srgb, var(--cl) 55%, #000)); box-shadow: 0 10px 22px -10px var(--cl); }\n.clima[data-mode=\"off\"] .cchip.sm[aria-pressed=\"true\"] { background: var(--surface-2); color: var(--text); box-shadow: none; border-color: var(--border); }\n.cl-sel { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }\n.cl-sel label { display: flex; flex-direction: column; gap: 6px; font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--faint); }\n.cl-sel select { width: 100%; padding: 11px 12px; border-radius: 14px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text); font: inherit; font-size: .84rem; font-weight: 700; letter-spacing: 0; text-transform: none; cursor: pointer; }\n.cl-sel select option { background: var(--surface-solid); color: var(--text); }\n.cam-head { display: flex; align-items: center; gap: 8px; margin: 2px 2px 0; }\n.cam-head h4 { margin: 0; flex: 1; font-family: var(--font-display); font-size: .92rem; font-weight: 700; }\n.cl-hint { margin: 10px 0 0; padding: 9px 13px; border-radius: 14px; max-width: 48ch; font-size: .8rem; font-weight: 700; line-height: 1.35; color: var(--warn); background: color-mix(in srgb, var(--warn) 15%, transparent); border: 1px solid color-mix(in srgb, var(--warn) 35%, transparent); }\n.cam-off { font-size: .64rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #fff; background: #E11D48; padding: 3px 8px; border-radius: 99px; }\n.cam-meta { font-size: .68rem; color: var(--faint); font-weight: 700; }\n.cbtn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text); border-radius: 12px; padding: 7px 10px; font-weight: 800; font-size: .74rem; cursor: pointer; transition: transform .3s var(--spring), background .25s; }\n.cbtn:hover { transform: translateY(-2px); }\n.cbtn.go { color: #fff; border-color: transparent; background: linear-gradient(135deg, #F43F5E, #F97316); }\n.cbtn.go.on { background: linear-gradient(135deg, #64748B, #334155); }\n.feed-live { position: relative; }\n.cam-img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; display: block; cursor: pointer; }\n.live-box { background: #000; }\n\n/* ---------- responsive ---------- */\n@media (max-width: 1020px) {\n  .en-top { grid-template-columns: 1fr; }\n  .kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n  .clima { grid-template-columns: 1fr; }\n  .cl-art { width: min(260px, 100%); }\n  .cl-sel { grid-template-columns: 1fr 1fr; }\n  .scenes { grid-template-columns: repeat(3, minmax(0, 1fr)); }\n  .rooms { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .room.w3, .room.w2 { grid-column: span 1; }\n  .room.w3 { grid-column: span 2; }\n  .alarm { grid-template-columns: auto 1fr; }\n  .alarm .seg { grid-column: 1 / -1; }\n}\n@media (max-width: 720px) {\n  .status { display: none; }\n  .top-actions { margin-left: auto; }\n  .style-btn span, .ver { display: none; }\n  .style-btn { padding: 0 12px; }\n  .topbar .wrap { gap: 8px; }\n  .scenes { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .scene { flex-direction: column; align-items: flex-start; gap: 10px; }\n  .rooms { grid-template-columns: 1fr; }\n  .room.w3 { grid-column: span 1; }\n  .w3 .room-body { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .grid2, .cams { grid-template-columns: 1fr; }\n  .hero { min-height: 410px; }\n  .hero-art { height: auto; width: 100%; -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 42%); mask-image: linear-gradient(180deg, transparent 0%, #000 42%); }\n  .hero-body { padding-bottom: 190px; }\n  .hero-tag { top: auto; bottom: 12px; }\n  .dock button { min-width: 54px; padding: 9px 6px 7px; }\n  .dock button span { font-size: .6rem; }\n  .seg { width: 100%; } .seg button { flex: 1; padding: 14px 6px; }\n  .brand em { display: none; }\n  .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .en-hero { flex-direction: column; align-items: flex-start; }\n  .days { gap: 3px; } .day .d-v { display: none; }\n  .slots { grid-template-columns: 1fr 1fr; }\n  .shield { width: 104px; height: 104px; }\n}\n@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; scroll-behavior: auto !important; }\n}\n\n/* Nordlys: elbil-måler (energy.ev) */\n.en-gauge.ev .g-val { stroke: url(#evgrad); }\n.echip.ev i { color: #8B5CF6; }\n.eline { fill: none; stroke: #C084FC; stroke-width: 2.4; stroke-linejoin: round; vector-effect: non-scaling-stroke; }\n.earea { fill: url(#evarea); }\n.kpi .k-evl { display: flex; align-items: center; gap: 5px; font-size: .74rem; font-weight: 700; color: var(--dim); margin-top: 2px; }\n.kpi .k-evl i { color: #A78BFA; font-size: .95rem; }\n.kpi .k-evl b { color: #C4B5FD; font-weight: 800; font-variant-numeric: tabular-nums; }\n.kpi .k-evl small { margin-left: auto; font-weight: 700; color: var(--faint); }\n.kpi .k-evl b { white-space: nowrap; }\n.kpi .k-evc { font-size: .8rem; font-weight: 800; color: #C4B5FD; font-variant-numeric: tabular-nums; padding-left: 20px; }\n.en-hero.quad .en-gauges { display: grid; grid-template-columns: repeat(2, auto); justify-content: start; }\n\n/* Nordlys 2.3: forbrugsrammen i fuld bredde, Udvikling flyttet ned over Forbrug pr. dag */\n.en-top { grid-template-columns: 1fr; }\n@media (min-width: 721px) { .en-hero.quad .en-gauges { display: flex; } }\n\n/* Nordlys: affald (waste) */\n.waste { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; }\n.wtile { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 118px; padding: 16px 12px; border-radius: 22px; cursor: pointer; font: inherit; color: var(--text); text-align: center; background: var(--surface); border: 1px solid var(--border); box-shadow: inset 0 1px 0 var(--hi); }\n.wtile img, .wtile > i { width: 42px; height: 42px; font-size: 1.8rem; display: grid; place-items: center; }\n.wtile b { font-size: .92rem; font-weight: 800; line-height: 1.2; }\n.wtile small { font-size: .78rem; font-weight: 700; color: var(--dim); }\n.wtile.soon { border-color: color-mix(in srgb, var(--warn) 60%, transparent); }\n.wtile.soon small { color: var(--warn); }\n.wtile.na { opacity: .55; }\n:host([data-scaled]) .waste { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }\n:host([data-scaled]) .w3 .room-body { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }\n#view-waste .waste { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 14px; }\n#view-waste .wtile { min-height: 180px; gap: 10px; }\n#view-waste .wtile img, #view-waste .wtile > i { width: 68px; height: 68px; font-size: 2.6rem; }\n#view-waste .wtile b { font-size: 1.1rem; }\n#view-waste .wtile small { font-size: .95rem; }\n@media (max-width: 720px) { .waste { grid-template-columns: repeat(2, minmax(0, 1fr)); } }\n";
  var HTML = "<div class=\"shell\" id=\"shell\">\n\n<div class=\"bg\" aria-hidden=\"true\"><i class=\"o1\"></i><i class=\"o2\"></i><i class=\"o3\"></i></div>\n<canvas class=\"fx-page\" id=\"fx-page\" aria-hidden=\"true\"></canvas>\n<div class=\"grain\" aria-hidden=\"true\"></div>\n<div class=\"vignette\" aria-hidden=\"true\"></div>\n\n<div class=\"scroll\" id=\"scroll\">\n<header class=\"topbar\">\n  <div class=\"wrap\">\n    <div class=\"brand\"><span class=\"logo\" aria-hidden=\"true\"></span>Nordlys</div>\n    <div class=\"status\" id=\"status\" role=\"status\" aria-live=\"polite\"><span class=\"dot\"></span><span id=\"status-text\">…</span></div>\n    <div class=\"top-actions\">\n      <button class=\"style-btn\" id=\"style-btn\" type=\"button\" aria-haspopup=\"dialog\" aria-controls=\"drawer\"><i class=\"mdi mdi-palette-swatch-variant\"></i><span>Stil</span></button>\n      <button class=\"icon-btn\" id=\"theme-btn\" type=\"button\" aria-label=\"Skift lyst/mørkt tema\"><i class=\"mdi mdi-weather-night\" id=\"theme-ico\"></i></button>\n    </div>\n  </div>\n</header>\n\n<div class=\"edit-banner\" id=\"edit-banner\" hidden>\n  <div class=\"wrap\"><div class=\"in\"><i class=\"mdi mdi-image-edit\"></i><span>Redigering: tryk på en knap for at skifte billede eller GIF</span><button type=\"button\" id=\"edit-done\">Færdig</button></div></div>\n</div>\n\n<div class=\"wrap\">\n  <div class=\"hints\">\n    <span class=\"hint\"><i class=\"mdi mdi-gesture-tap\"></i>Tryk på scener og lys</span>\n    <button class=\"hint\" id=\"hint-style\" type=\"button\"><i class=\"mdi mdi-palette-swatch-variant\"></i>Skift verden, effekter og tid</button>\n    <button class=\"hint\" id=\"hint-edit\" type=\"button\"><i class=\"mdi mdi-image-edit\"></i>Skift billederne</button>\n    <button class=\"hint danger\" id=\"sim-alarm\" type=\"button\" data-demo><i class=\"mdi mdi-bell-ring\"></i>Simulér indbrud</button>\n  </div>\n\n  <main id=\"main\">\n    <!-- ===================== VISTA CASA ===================== -->\n    <section id=\"view-home\" class=\"enter\" aria-label=\"Hus\" style=\"display:flex;flex-direction:column;gap:22px\">\n      <article class=\"card hero\" id=\"hero\" style=\"--i:0\">\n        <div class=\"hero-art\" id=\"hero-art\" aria-hidden=\"true\">\n          <img id=\"art-a\" alt=\"\" draggable=\"false\"><img id=\"art-b\" alt=\"\" draggable=\"false\">\n          <div id=\"win-layer\"></div>\n        </div>\n        <canvas class=\"fx-hero\" id=\"fx-hero\" aria-hidden=\"true\"></canvas>\n        <button class=\"hero-tag\" id=\"hero-tag\" type=\"button\"><i class=\"mdi mdi-earth\"></i><span id=\"hero-tag-text\">Huset</span><i class=\"mdi mdi-chevron-right\"></i></button>\n        <div class=\"hero-body\">\n          <p class=\"eyebrow\" id=\"date-text\">Mandag 12. oktober</p>\n          <h1 class=\"greet\" id=\"greet\">Godaften</h1>\n          <div class=\"clock\" id=\"clock\" aria-live=\"off\">21<span class=\"colon\">:</span>00</div>\n          <div class=\"hero-chips\">\n            <span class=\"chip\" id=\"chip-temp\"><i class=\"mdi mdi-weather-partly-cloudy\" id=\"temp-ico\"></i>Ude <b id=\"temp-val\">21,4 °C</b></span>\n            <span class=\"chip\" id=\"chip-power\" role=\"button\" tabindex=\"0\" title=\"Åbn forbrug\" style=\"cursor:pointer\"><i class=\"mdi mdi-flash bolt\"></i>Forbrug <b id=\"power-val\">612 W</b><span class=\"pdelta\" id=\"power-delta\"></span><span class=\"livedot\" title=\"Live-opdatering\"></span></span>\n            <span class=\"chip\"><i class=\"mdi mdi-motion-sensor\"></i><span id=\"hero-motion\">Roligt i huset</span></span>\n          </div>\n        </div>\n      </article>\n\n      <div style=\"--i:1\">\n        <h2 class=\"sec-title\">Hurtige scener <small>ét tryk, hele huset</small></h2>\n        <div class=\"scenes\" id=\"scenes\"></div>\n      </div>\n\n      <div style=\"--i:2\">\n        <h2 class=\"sec-title\">Lys og rum <small>tryk på billedet for at tænde</small></h2>\n        <div class=\"rooms\" id=\"rooms\"></div>\n      </div>\n\n      <div style=\"--i:3\" id=\"waste-wrap\" hidden>\n        <h2 class=\"sec-title\">Affald <small>næste tømning</small></h2>\n        <div class=\"waste\" id=\"waste\"></div>\n      </div>\n\n      <div style=\"--i:3\" id=\"clima-wrap\">\n        <h2 class=\"sec-title\">Klima <small id=\"cl-sub\">Klimaanlæg</small></h2>\n        <article class=\"card clima\" id=\"clima\" data-mode=\"off\">\n          <div class=\"cl-art\" id=\"cl-art\" data-img=\"clima_off\" data-label=\"Billede af klimaanlæg\"><img alt=\"\" draggable=\"false\"><span class=\"edit-badge\"><i class=\"mdi mdi-pencil\"></i></span></div>\n          <div class=\"cl-main\">\n            <div class=\"cl-top\">\n              <div>\n                <p class=\"eyebrow\" id=\"cl-name\">Klimaanlæg</p>\n                <h3 id=\"cl-status\">Slukket</h3>\n                <p class=\"d\" id=\"cl-cur\">Inde 23 °C</p>\n                <p class=\"cl-hint\" id=\"cl-hint\" hidden></p>\n              </div>\n              <div class=\"tctl\" role=\"group\" aria-label=\"Ønsket temperatur\">\n                <button class=\"rbtn\" id=\"cl-minus\" type=\"button\" aria-label=\"Sænk\"><i class=\"mdi mdi-minus\"></i></button>\n                <div class=\"tbig\"><span id=\"cl-tgt\">25,0</span><small>°C</small></div>\n                <button class=\"rbtn\" id=\"cl-plus\" type=\"button\" aria-label=\"Hæv\"><i class=\"mdi mdi-plus\"></i></button>\n              </div>\n            </div>\n            <div class=\"cl-sec\"><h5>Tilstand</h5><div class=\"cchips\" id=\"cl-modes\"></div></div>\n            <div class=\"cl-sec\" id=\"cl-fan-sec\"><h5>Blæser</h5><div class=\"cchips\" id=\"cl-fans\"></div></div>\n            <div class=\"cl-sel\">\n              <label>Lameller lodret<select id=\"cl-swing\"></select></label>\n              <label>Lameller vandret<select id=\"cl-hswing\"></select></label>\n              <label>Forvalg<select id=\"cl-preset\"></select></label>\n            </div>\n          </div>\n        </article>\n      </div>\n    </section>\n\n    <!-- ===================== VISTA SICUREZZA ===================== -->\n    <section id=\"view-sic\" class=\"enter\" aria-label=\"Sikring\" hidden style=\"display:flex;flex-direction:column;gap:14px\">\n      <div class=\"alert\" id=\"alert\" role=\"alert\" hidden>\n        <i class=\"mdi mdi-alarm-light\"></i><span>ALARM — bevægelse registreret ved indgangen</span><button type=\"button\" id=\"alert-off\">Frakobl</button>\n      </div>\n\n      <article class=\"card alarm\" id=\"alarm\" data-state=\"off\" style=\"--i:1\">\n        <div class=\"shield\" id=\"shield\" data-img=\"allarme_off\" data-label=\"Billede af alarmstatus\"><img id=\"alarm-img\" alt=\"\" draggable=\"false\"><span class=\"edit-badge\"><i class=\"mdi mdi-pencil\"></i></span></div>\n        <div class=\"alarm-txt\">\n          <p class=\"eyebrow\">Alarmcentral</p>\n          <h2 id=\"alarm-title\">Frakoblet</h2>\n          <p class=\"d\" id=\"alarm-desc\">Huset er åbent.</p>\n        </div>\n        <div class=\"seg\" id=\"seg\" role=\"group\" aria-label=\"Alarmtilstand\">\n          <span class=\"seg-pill\" id=\"seg-pill\"></span>\n          <button type=\"button\" data-mode=\"disarmed\" aria-pressed=\"true\">Frakobl</button>\n          <button type=\"button\" data-mode=\"armed_night\" aria-pressed=\"false\">Nat</button>\n          <button type=\"button\" data-mode=\"armed_away\" aria-pressed=\"false\">Ude</button>\n        </div>\n      </article>\n\n      <div class=\"grid2\" style=\"--i:2\">\n        <article class=\"card panel\">\n          <h3><i class=\"mdi mdi-motion-sensor\" style=\"color:var(--acc-text)\"></i>Bevægelse</h3>\n          <p class=\"sub\" id=\"last-motion\">Ingen nylig bevægelse</p>\n          <div class=\"tiles\" id=\"motion-tiles\"></div>\n        </article>\n        <article class=\"card panel\">\n          <h3><i class=\"mdi mdi-door-closed-lock\" style=\"color:var(--acc-text)\"></i>Døre, vinduer og låge</h3>\n          <p class=\"sub\" id=\"open-sub\">Alt lukket</p>\n          <div class=\"tiles\" id=\"open-tiles\"></div>\n        </article>\n      </div>\n\n      <div class=\"cams\" id=\"cams\" style=\"--i:3\">\n        <article class=\"card cam\"><h4>Indgang</h4><div class=\"feed\"><span class=\"live\">LIVE</span><span class=\"stamp\" data-stamp>--:--:--</span></div></article>\n        <article class=\"card cam\"><h4>Have</h4><div class=\"feed\"><span class=\"live\">LIVE</span><span class=\"stamp\" data-stamp>--:--:--</span></div></article>\n      </div>\n    </section>\n\n    <section id=\"view-waste\" class=\"enter\" aria-label=\"Affald\" hidden style=\"display:flex;flex-direction:column;gap:22px\"></section>\n\n    <!-- ===================== VISTA ENERGIA ===================== -->\n    <section id=\"view-en\" class=\"enter\" aria-label=\"Energi\" hidden style=\"display:flex;flex-direction:column;gap:14px\">\n      <div class=\"en-top\" style=\"--i:0\">\n        <article class=\"card en-hero\" id=\"en-hero\" data-lvl=\"low\">\n          <div class=\"en-gauges\"><div class=\"en-gauge\">\n            <svg viewBox=\"0 0 220 200\" class=\"gsvg\" aria-hidden=\"true\">\n              <defs>\n                <linearGradient id=\"engrad\" x1=\"0\" y1=\"1\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#34D399\"/><stop offset=\".55\" stop-color=\"#FBBF24\"/><stop offset=\"1\" stop-color=\"#F43F5E\"/></linearGradient>\n                <filter id=\"engl\" x=\"-30%\" y=\"-30%\" width=\"160%\" height=\"160%\"><feGaussianBlur stdDeviation=\"6\"/></filter>\n              </defs>\n              <path class=\"g-track\" d=\"M 46.4 153.6 A 80 80 0 1 1 173.6 153.6\" pathLength=\"100\"/>\n              <path class=\"g-val g-glow\" id=\"en-glow\" d=\"M 46.4 153.6 A 80 80 0 1 1 173.6 153.6\" pathLength=\"100\" stroke-dasharray=\"0 100\" filter=\"url(#engl)\"/>\n              <path class=\"g-val\" id=\"en-arc\" d=\"M 46.4 153.6 A 80 80 0 1 1 173.6 153.6\" pathLength=\"100\" stroke-dasharray=\"0 100\"/>\n            </svg>\n            <div class=\"g-center\"><span class=\"g-num\" id=\"en-num\">0</span><span class=\"g-unit\" id=\"en-unit\">W</span><span class=\"g-lab\" id=\"en-glab\" hidden>Forbrug</span></div>\n          </div><div class=\"en-gauge sol\" id=\"sol-gauge\" hidden>\n            <svg viewBox=\"0 0 220 200\" class=\"gsvg\" aria-hidden=\"true\">\n              <defs><linearGradient id=\"solgrad\" x1=\"0\" y1=\"1\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#FDE68A\"/><stop offset=\"1\" stop-color=\"#F59E0B\"/></linearGradient></defs>\n              <path class=\"g-track\" d=\"M 46.4 153.6 A 80 80 0 1 1 173.6 153.6\" pathLength=\"100\"/>\n              <path class=\"g-val g-glow\" id=\"sol-glow\" d=\"M 46.4 153.6 A 80 80 0 1 1 173.6 153.6\" pathLength=\"100\" stroke-dasharray=\"0 100\" filter=\"url(#engl)\"/>\n              <path class=\"g-val\" id=\"sol-arc\" d=\"M 46.4 153.6 A 80 80 0 1 1 173.6 153.6\" pathLength=\"100\" stroke-dasharray=\"0 100\"/>\n            </svg>\n            <div class=\"g-center\"><span class=\"g-num\" id=\"sol-num\">0</span><span class=\"g-unit\" id=\"sol-unit\">W</span><span class=\"g-lab\">Solceller</span></div>\n          </div><div class=\"en-gauge net\" id=\"net-gauge\" hidden>\n            <svg viewBox=\"0 0 220 200\" class=\"gsvg\" aria-hidden=\"true\">\n              <defs><linearGradient id=\"sellgrad\" x1=\"0\" y1=\"1\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#6EE7B7\"/><stop offset=\"1\" stop-color=\"#10B981\"/></linearGradient><linearGradient id=\"buygrad\" x1=\"0\" y1=\"1\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#93C5FD\"/><stop offset=\"1\" stop-color=\"#3B82F6\"/></linearGradient></defs>\n              <path class=\"g-track\" d=\"M 46.4 153.6 A 80 80 0 1 1 173.6 153.6\" pathLength=\"100\"/>\n              <path class=\"g-val g-glow\" id=\"net-glow\" d=\"M 46.4 153.6 A 80 80 0 1 1 173.6 153.6\" pathLength=\"100\" stroke-dasharray=\"0 100\" filter=\"url(#engl)\"/>\n              <path class=\"g-val\" id=\"net-arc\" d=\"M 46.4 153.6 A 80 80 0 1 1 173.6 153.6\" pathLength=\"100\" stroke-dasharray=\"0 100\"/>\n            </svg>\n            <div class=\"g-center\"><span class=\"g-numrow\"><span class=\"g-num g-sign\" id=\"net-sign\">+</span><span class=\"g-num\" id=\"net-num\">0</span></span><span class=\"g-unit\" id=\"net-unit\">W</span><span class=\"g-lab\" id=\"net-lab\">Køb</span></div>\n          </div><div class=\"en-gauge ev\" id=\"ev-gauge\" hidden>\n            <svg viewBox=\"0 0 220 200\" class=\"gsvg\" aria-hidden=\"true\">\n              <defs><linearGradient id=\"evgrad\" x1=\"0\" y1=\"1\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#A5F3FC\"/><stop offset=\"1\" stop-color=\"#8B5CF6\"/></linearGradient></defs>\n              <path class=\"g-track\" d=\"M 46.4 153.6 A 80 80 0 1 1 173.6 153.6\" pathLength=\"100\"/>\n              <path class=\"g-val g-glow\" id=\"ev-glow\" d=\"M 46.4 153.6 A 80 80 0 1 1 173.6 153.6\" pathLength=\"100\" stroke-dasharray=\"0 100\" filter=\"url(#engl)\"/>\n              <path class=\"g-val\" id=\"ev-arc\" d=\"M 46.4 153.6 A 80 80 0 1 1 173.6 153.6\" pathLength=\"100\" stroke-dasharray=\"0 100\"/>\n            </svg>\n            <div class=\"g-center\"><span class=\"g-num\" id=\"ev-num\">0</span><span class=\"g-unit\" id=\"ev-unit\">W</span><span class=\"g-lab\">Elbil</span></div>\n          </div></div>\n          <div class=\"en-side\">\n            <p class=\"eyebrow\" id=\"en-eyebrow\"><span class=\"livedot\"></span>Effekt nu <span id=\"en-age\"></span></p>\n            <h3 id=\"en-title\">Lavt forbrug</h3>\n            <p class=\"d\" id=\"en-sub\">Hele husets måling</p>\n            <div class=\"en-chips\" id=\"en-chips\"></div>\n          </div>\n        </article>\n        \n      </div>\n      <button type=\"button\" class=\"card price-bar\" id=\"en-price\" style=\"--i:1\" aria-label=\"Indstil elprisen\">\n        <span class=\"pb-ico\"><i class=\"mdi mdi-cash\"></i></span>\n        <span class=\"pb-txt\"><b id=\"pb-main\">Elpris</b><small id=\"pb-sub\"></small></span>\n        <span class=\"pb-cta\"><i class=\"mdi mdi-pencil\"></i><span id=\"pb-cta\">Indstil</span></span>\n      </button>\n      <div class=\"kpis\" id=\"en-kpis\" style=\"--i:1\" title=\"Tryk for at ændre elprisen\"></div>\n      <article class=\"card en-chart\" style=\"--i:2\">\n          <div class=\"en-chart-head\">\n            <h3>Udvikling</h3>\n            <div class=\"rchips\" id=\"en-range\" role=\"group\" aria-label=\"Periode\">\n              <button type=\"button\" data-r=\"3h\" aria-pressed=\"false\">3 timer</button><button type=\"button\" data-r=\"24h\" aria-pressed=\"true\">24 timer</button><button type=\"button\" data-r=\"7g\" aria-pressed=\"false\">7 dage</button>\n            </div>\n          </div>\n          <div class=\"en-plot\" id=\"en-plot\"><svg viewBox=\"0 0 600 170\" preserveAspectRatio=\"none\" id=\"en-svg\" aria-hidden=\"true\"></svg><div class=\"en-tip\" id=\"en-tip\" hidden></div><div class=\"en-empty\" id=\"en-empty\" hidden>Ingen historik</div></div>\n          <div class=\"en-axis\" id=\"en-axis\"></div>\n          <div class=\"en-stats\" id=\"en-stats\"></div>\n        </article>\n\n      <article class=\"card en-days\" style=\"--i:2\">\n        <div class=\"en-chart-head\"><h3><span id=\"en-days-t\">Forbrug pr. dag</span> <small>sidste 14 dage</small></h3>\n          <div class=\"rchips\" id=\"en-dunit\" role=\"group\" aria-label=\"Enhed\"><button type=\"button\" data-u=\"kwh\" aria-pressed=\"true\">kWh</button><button type=\"button\" data-u=\"eur\" aria-pressed=\"false\">kr.</button></div></div>\n        <div class=\"days\" id=\"en-days\"></div>\n        <div class=\"en-stats\" id=\"en-days-sum\" style=\"margin-top:12px\"></div>\n      </article>\n      <div style=\"--i:3\">\n        <h2 class=\"sec-title\">Apparater <small>forbrug nu og i dag</small></h2>\n        <div class=\"share\" id=\"en-share\"></div>\n        <div class=\"apps\" id=\"en-apps\"></div>\n      </div>\n    </section>\n\n    <footer class=\"note\">Nordlys · forhåndsvisning: viser ikke rigtige data.</footer>\n  </main>\n</div>\n\n</div><!-- /scroll -->\n\n<nav class=\"dock\" aria-label=\"Navigation\">\n  <button type=\"button\" data-view=\"home\" aria-current=\"page\"><i class=\"mdi mdi-home-variant\"></i><span>Hus</span></button>\n  <button type=\"button\" data-view=\"sic\"><i class=\"mdi mdi-shield-home\"></i><span>Sikring</span></button>\n  <button type=\"button\" data-view=\"en\"><i class=\"mdi mdi-lightning-bolt\"></i><span>Energi</span></button>\n  <button type=\"button\" data-view=\"waste\" hidden><i class=\"mdi mdi-trash-can-outline\"></i><span>Affald</span></button>\n  <span class=\"sep\" aria-hidden=\"true\"></span>\n  <button type=\"button\" id=\"dock-scenes\"><i class=\"mdi mdi-palette\"></i><span>Scener</span></button>\n  <button type=\"button\" id=\"dock-off\"><i class=\"mdi mdi-lightbulb-off-outline\"></i><span>Sluk alt</span></button>\n  <button type=\"button\" id=\"dock-style\"><i class=\"mdi mdi-palette-swatch-variant\"></i><span>Stil</span></button>\n</nav>\n<div class=\"toast\" id=\"toast\" role=\"status\" aria-live=\"polite\"><i class=\"mdi mdi-check-circle\"></i><span id=\"toast-text\"></span></div>\n\n<!-- ===================== PANNELLO STILE ===================== -->\n<div class=\"scrim\" id=\"scrim\"></div>\n<aside class=\"drawer\" id=\"drawer\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"dr-title\" aria-hidden=\"true\">\n  <div class=\"dr-head\"><h2 id=\"dr-title\">Tilpas stilen</h2><button class=\"icon-btn\" id=\"dr-close\" type=\"button\" aria-label=\"Luk\"><i class=\"mdi mdi-close\"></i></button></div>\n  <div class=\"dr-body\">\n    <section class=\"dr-sec\"><h3><i class=\"mdi mdi-earth\"></i>Verden <small>10 animerede landskaber, alle med solopgang, dag, solnedgang og nat</small></h3><div class=\"worlds\" id=\"worlds\"></div></section>\n    <section class=\"dr-sec\"><h3><i class=\"mdi mdi-clock-outline\"></i>Tid på dagen <small>simulér himmel og farver</small></h3>\n      <div class=\"drow\"><i class=\"mdi mdi-weather-sunset\" id=\"phase-icon\"></i><input class=\"ph\" type=\"range\" id=\"phase-range\" min=\"0\" max=\"24\" step=\"0.25\" value=\"21\" aria-label=\"Simulér tid på dagen\"><output id=\"phase-out\">21:00</output></div>\n      <button class=\"btn ghost wide\" id=\"phase-real\" type=\"button\" style=\"margin-top:8px\"><i class=\"mdi mdi-clock-check-outline\"></i>Brug rigtig tid</button>\n    </section>\n    <section class=\"dr-sec\"><h3><i class=\"mdi mdi-weather-partly-rainy\"></i>Vejr og effekter <small>lægges oven på alle verdener</small></h3>\n      <div class=\"fxgrid\" id=\"fxgrid\"></div>\n      <div class=\"row\" style=\"margin-top:10px\"><span class=\"grow\">Også på sidens baggrund<small>Partikler bag alle kort</small></span><button class=\"toggle\" id=\"fx-page-toggle\" type=\"button\" aria-pressed=\"false\" aria-label=\"Effekt på hele siden\"></button></div>\n    </section>\n    <section class=\"dr-sec\"><h3><i class=\"mdi mdi-shuffle-variant\"></i>Overraskelse</h3>\n      <div class=\"row\"><span class=\"grow\">Skift verden hvert 30. sekund<small>En playliste af landskaber</small></span><button class=\"toggle\" id=\"cycle-toggle\" type=\"button\" aria-pressed=\"false\" aria-label=\"Skift verden automatisk\"></button></div>\n    </section>\n    <section class=\"dr-sec\"><h3><i class=\"mdi mdi-gesture-tap-button\"></i>Knapper</h3>\n      <div class=\"segm\" id=\"btn-style\"><button type=\"button\" data-v=\"img\" aria-pressed=\"true\">Billeder og GIF'er</button><button type=\"button\" data-v=\"compact\" aria-pressed=\"false\">Kompakte</button></div>\n      <button class=\"btn wide\" id=\"edit-start\" type=\"button\" style=\"margin-top:10px\"><i class=\"mdi mdi-image-edit\"></i>Skift billederne på knapperne</button>\n    </section>\n    <section class=\"dr-sec\"><button class=\"btn ghost wide\" id=\"reset-all\" type=\"button\"><i class=\"mdi mdi-restore\"></i>Nulstil alt</button></section>\n  </div>\n</aside>\n\n<!-- ===================== EDITOR IMMAGINI ===================== -->\n<div class=\"modal\" id=\"editor\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"ed-title\" aria-hidden=\"true\">\n  <div class=\"mcard\">\n    <div class=\"mhead\"><h2><span id=\"ed-title\">Skift billede</span><small id=\"ed-sub\"></small></h2><button class=\"icon-btn\" id=\"ed-close\" type=\"button\" aria-label=\"Luk\"><i class=\"mdi mdi-close\"></i></button></div>\n    <div class=\"slots\" id=\"ed-slots\"></div>\n    <div>\n      <div class=\"libtabs\" id=\"lib-tabs\" role=\"group\" aria-label=\"Bibliotek\"></div>\n      <div class=\"lib\" id=\"lib\" style=\"margin-top:10px\"></div>\n    </div>\n    <p class=\"note-sm\">Du kan også trække en fil (PNG, JPG, animeret GIF, WebP) hen på et felt. De valgte billeder gemmes i denne browser.</p>\n    <div class=\"mfoot\"><button class=\"btn ghost\" id=\"ed-reset\" type=\"button\"><i class=\"mdi mdi-restore\"></i>Gendan original</button><button class=\"btn\" id=\"ed-done\" type=\"button\"><i class=\"mdi mdi-check\"></i>Færdig</button></div>\n  </div>\n</div>\n\n<div class=\"modal\" id=\"codebox\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"code-title\" aria-hidden=\"true\">\n  <div class=\"mcard\" style=\"width:min(360px,100%)\">\n    <div class=\"mhead\"><h2><span id=\"code-title\">Indtast koden</span><small id=\"code-sub\"></small></h2></div>\n    <input class=\"code-in\" id=\"code-in\" type=\"password\" inputmode=\"numeric\" autocomplete=\"off\" aria-label=\"Alarmkode\">\n    <div class=\"mfoot\"><button class=\"btn ghost\" id=\"code-cancel\" type=\"button\">Annullér</button><button class=\"btn\" id=\"code-ok\" type=\"button\">Bekræft</button></div>\n  </div>\n</div>\n<div class=\"modal\" id=\"pricebox\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"pr-title\" aria-hidden=\"true\">\n  <div class=\"mcard\" style=\"width:min(440px,100%)\">\n    <div class=\"mhead\"><h2><span id=\"pr-title\">Elpris</span><small>Hvad du betaler pr. kWh på elregningen</small></h2><button class=\"icon-btn\" id=\"pr-close\" type=\"button\" aria-label=\"Luk\"><i class=\"mdi mdi-close\"></i></button></div>\n    <div class=\"pr-field\">\n      <button class=\"icon-btn\" id=\"pr-minus\" type=\"button\" aria-label=\"Sænk\"><i class=\"mdi mdi-minus\"></i></button>\n      <label class=\"pr-box\"><input id=\"pr-in\" type=\"number\" inputmode=\"decimal\" step=\"0.001\" min=\"0\" max=\"5\" aria-label=\"Pris i kroner pr. kWh\"><span>kr / kWh</span></label>\n      <button class=\"icon-btn\" id=\"pr-plus\" type=\"button\" aria-label=\"Hæv\"><i class=\"mdi mdi-plus\"></i></button>\n    </div>\n    <div class=\"pr-pre\" id=\"pr-pre\"></div>\n    <p class=\"pr-hint\" id=\"pr-hint\" hidden></p>\n    <details class=\"pr-calc\" id=\"pr-calc\">\n      <summary><i class=\"mdi mdi-calculator-variant\"></i>Ved det ikke: beregn den ud fra elregningen</summary>\n      <div class=\"pr-calc-in\">\n        <label>Beløb i alt<span><input id=\"pr-bill\" type=\"number\" inputmode=\"decimal\" step=\"0.01\" min=\"0\" placeholder=\"fx 845,50\"> kr.</span></label>\n        <label>kWh brugt<span><input id=\"pr-kwh\" type=\"number\" inputmode=\"decimal\" step=\"1\" min=\"0\" placeholder=\"fx 300\"> kWh</span></label>\n      </div>\n      <p class=\"pr-calc-out\" id=\"pr-calc-out\"></p>\n      <p class=\"note-sm\">Når du deler beløbet med antal kWh, kommer abonnement, nettarif og afgifter med: det er den reelle pris for hver kWh, du bruger.</p>\n    </details>\n    <p class=\"note-sm\" id=\"pr-where\"></p>\n    <div class=\"mfoot\"><button class=\"btn ghost\" id=\"pr-cancel\" type=\"button\">Annullér</button><button class=\"btn\" id=\"pr-ok\" type=\"button\"><i class=\"mdi mdi-check\"></i>Gem elpris</button></div>\n  </div>\n</div>\n</div><!-- /shell -->";
  var PROPS = "@property --b1 { syntax: '<color>'; inherits: true; initial-value: #7C5CFF; }\n@property --b2 { syntax: '<color>'; inherits: true; initial-value: #3B82F6; }\n@property --b3 { syntax: '<color>'; inherits: true; initial-value: #22D3EE; }\n@property --a1 { syntax: '<color>'; inherits: true; initial-value: #7C5CFF; }\n@property --a2 { syntax: '<color>'; inherits: true; initial-value: #D946EF; }\n@property --win { syntax: '<color>'; inherits: true; initial-value: #FFD27A; }";
  /* Nordlys: animations: false - samme design uden bevægelse, sløring og blend-lag */
  var STATIC_CSS = "\n*, *::before, *::after { animation: none !important; transition: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; scroll-behavior: auto !important; }\n.grain { display: none !important; }\n.bg i { will-change: auto !important; }\n.topbar { background: color-mix(in srgb, var(--bg) 90%, transparent) !important; }\n.dock { background: color-mix(in srgb, var(--surface-solid) 96%, transparent) !important; }\n.drawer { background: var(--surface-solid) !important; }\n.scrim, .modal { background: rgba(4,6,18,.82) !important; }\n.chip, .hero-tag, .orb .sw { background: color-mix(in srgb, var(--bg) 75%, transparent) !important; }\n";
  var OVERRIDES = [
    ":host { display: block; position: relative; --lp: absolute; --sp: absolute; --so: hidden auto; height: var(--aurora-height, calc(100vh - var(--header-height, 56px))); min-height: 520px; overflow: hidden; }",
    ".shell { height: 100%; min-height: 0; overflow: hidden; background: var(--bg); }",
    "i.mdi { display: inline-flex; align-items: center; justify-content: center; line-height: 1; vertical-align: middle; }",
    "i.mdi ha-icon { --mdc-icon-size: 1em; display: flex; width: 1em; height: 1em; }",
    ".scroll { scrollbar-width: thin; }",
    /* Nordlys: ens højde på kompakte lysknapper, også når et navn fylder to linjer */
    ":host([data-llist]) .room-body { grid-template-columns: 1fr !important; gap: 6px !important; } :host([data-llist]) .room.w3, :host([data-llist]) .room.w2 { grid-column: auto; } :host([data-llist]) .orb { aspect-ratio: auto !important; min-height: 0 !important; display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: flex-start !important; gap: 12px; padding: 8px 12px !important; border-radius: 16px; } :host([data-llist]) .orb .o-img, :host([data-llist]) .orb .o-shade, :host([data-llist]) .orb .edit-badge { display: none !important; } :host([data-llist]) .orb .o-ico { display: grid !important; flex: none; width: 38px; height: 38px; border-radius: 13px; font-size: 1.4rem; } :host([data-llist]) .orb .o-txt { position: static !important; min-height: 0 !important; flex: 1; min-width: 0; justify-content: center !important; } :host([data-llist]) .orb .o-name { text-shadow: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } :host([data-llist]) .orb .o-state { color: var(--dim); } :host([data-llist]) .orb[aria-pressed=\"true\"] .o-state { color: color-mix(in srgb, var(--room) 70%, var(--text)); } :host([data-llist]) .orb[aria-pressed=\"true\"] { background: linear-gradient(100deg, color-mix(in srgb, var(--room) 26%, transparent), color-mix(in srgb, var(--room) 6%, transparent)); } :host([data-llist]) .orb[aria-pressed=\"true\"] .o-ico { background: var(--room); color: #fff; } :host([data-llist]) .orb .sw { position: relative !important; top: auto !important; right: auto !important; order: 3; flex: none; } :host([data-llist]) .room { padding: 14px; gap: 10px; } :host([data-llist]) .room-head { padding: 0 13px; gap: 12px; } :host([data-llist]) .room-head .r-ico { flex: none; width: 38px; height: 38px; } :host([data-llist]) .orb { gap: 12px !important; } :host([data-rtoggle]) .room-head .r-ico, :host([data-rtoggle]) .room-head h3 { cursor: pointer; -webkit-tap-highlight-color: transparent; transition: transform .2s; } :host([data-rtoggle]) .room-head .r-ico:active { transform: scale(.9); } :host([data-lslider]) .orb.dim { touch-action: pan-y; } :host([data-lslider]) .orb.dim::before { content: \"\"; position: absolute; left: 0; top: 0; bottom: 0; width: var(--bri, 0%); background: color-mix(in srgb, var(--room) 34%, transparent); border-radius: inherit; pointer-events: none; transition: width .25s; z-index: 0; } :host([data-lslider]) .orb.dim.dragging::before { transition: none; } :host([data-llist][data-lslider]) .orb.dim > * { position: relative; z-index: 1; } :host([data-lslider]:not([data-llist])) .orb.dim { isolation: isolate; } :host([data-lslider]:not([data-llist])) .orb.dim::before { z-index: -1; }",
    ":host([data-noart]) .hero-art, :host([data-noart]) #fx-hero, :host([data-noart]) .hero-tag { display: none !important; } :host([data-noart]) .hero { min-height: 0 !important; } :host([data-noart]) .hero-body { padding: 16px 20px 18px !important; }",
    ":host([data-btn=\"compact\"]) .o-name { line-height: 1.25; } :host([data-btn=\"compact\"]) .o-txt { justify-content: flex-end; min-height: calc(2.375rem + 1.1rem); }"
  ].join("\n");

  function boot() {
    if (document.getElementById("aurora-v3-global")) return;
    var st = document.createElement("style"); st.id = "aurora-v3-global"; st.textContent = PROPS; document.head.appendChild(st);
    var l = document.createElement("link"); l.id = "aurora-v3-fonts"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&display=swap";
    document.head.appendChild(l);
  }

  class AuroraV3Card extends HTMLElement {
    constructor() { super(); this._root = this.attachShadow({ mode: "open" }); this._app = null; this._hass = null; }
    setConfig(config) { this._config = config || {}; if (!this._app) this._mount(); }
    _mount() {
      boot();
      var stat = this._config.animations === false; window.__NLY_STATIC = stat;
      var style = document.createElement("style"); style.textContent = CSS + "\n" + OVERRIDES + (stat ? STATIC_CSS : "");
      if (stat) this.setAttribute("data-static", "");
      /* Nordlys: scale: 0.8 gør hele kortet mindre (fx til en lille vægskærm); højden rettes, så kortet stadig fylder skærmen */
      var hdA = Array.isArray(this._config.hide) ? this._config.hide.map(function (x) { return String(x).toLowerCase(); }) : [];
      /* Nordlys: lightLayout: liste = lysknapperne som aflange rækker under hinanden (ikon, navn, kontakt) */
      if (String(this._config.lightLayout || "").toLowerCase() === "liste" || String(this._config.lightLayout || "").toLowerCase() === "list") this.setAttribute("data-llist", "");
      /* Nordlys: roomToggle: true = tryk på rummets ikon/navn tænder eller slukker alle rummets lys */
      if (this._config.roomToggle === true) this.setAttribute("data-rtoggle", "");
      /* Nordlys: lightSlider: true = træk vandret hen over en lysrække (lightLayout: liste) for at dæmpe */
      if (this._config.lightSlider === true) this.setAttribute("data-lslider", "");
      if (hdA.indexOf("landskab") > -1 || hdA.indexOf("landscape") > -1 || hdA.indexOf("hus-billede") > -1) this.setAttribute("data-noart", "");
      /* Nordlys: fit: true skalerer kortet automatisk, så forsiden (Hus) passer i skærmens højde */
      if (this._config.fit === true || this._config.scale === "auto") { this.setAttribute("data-scaled", ""); this._fitOn = true; }
      var sc = +this._config.scale; if (!this._fitOn && sc > 0 && sc !== 1) { this.style.zoom = sc; this.setAttribute("data-scaled", ""); this.style.height = "calc((100vh - var(--header-height, 56px)) / " + sc + ")"; }
      var wrap = document.createElement("div"); wrap.innerHTML = HTML;
      this._root.appendChild(style);
      while (wrap.firstChild) this._root.appendChild(wrap.firstChild);
      /* Nordlys: hide: [...] skjuler sektioner - scener (Hurtige scener), tips (hjælpeknapperne under topbjælken) */
      var hd = this._config.hide;
      if (Array.isArray(hd)) {
        var hw = hd.map(function (x) { return String(x).toLowerCase(); }), hr = this._root;
        var hs = function (k1, k2) { return hw.indexOf(k1) > -1 || hw.indexOf(k2) > -1; };
        if (hs("scener", "scenes")) { var sc = hr.querySelector("#scenes"); if (sc && sc.parentNode) sc.parentNode.hidden = true; }
        if (hs("tips", "hints")) { var hn = hr.querySelector(".hints"); if (hn) hn.hidden = true; }
        if (hs("bevægelse", "bevaegelse") || hs("motion", "roligt")) { var hm = hr.querySelector("#hero-motion"); if (hm && hm.parentNode) hm.parentNode.hidden = true; }
      }
      /* Nordlys: dock: [...] vælger hvilke knapper i bundmenuen der vises */
      var dk = this._config.dock;
      if (Array.isArray(dk)) {
        var want = dk.map(function (x) { return String(x).toLowerCase(); }), root = this._root;
        var DOCK = [["home", "hus", '[data-view="home"]'], ["sic", "sikring", '[data-view="sic"]'], ["en", "energi", '[data-view="en"]'], ["waste", "affald", '[data-view="waste"]'], ["scenes", "scener", "#dock-scenes"], ["off", "sluk", "#dock-off"], ["style", "stil", "#dock-style"]];
        var shown = {};
        DOCK.forEach(function (d) { var el = root.querySelector(".dock " + d[2]); shown[d[0]] = want.indexOf(d[0]) > -1 || want.indexOf(d[1]) > -1; if (el && !shown[d[0]]) el.hidden = true; });
        var sep = root.querySelector(".dock .sep");
        if (sep && !((shown.home || shown.sic || shown.en) && (shown.scenes || shown.off || shown.style))) sep.hidden = true;
      }
      var self = this, cfg = this._config;
      this._app = new window.AuroraApp({
        root: this._root, host: this, layer: this._root.querySelector("#shell"), scroll: this._root.querySelector("#scroll"),
        assets: cfg.assets || defaultAssets(), live: true, embedded: true, haIcons: true, config: cfg,
        call: function (domain, service, data) { return self._hass.callService(domain, service, data); },
        moreInfo: function (entityId) { self.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: entityId } })); }
      });
      if (this._hass) this._app.setHass(this._hass);
    }
    set hass(h) { this._hass = h; if (this._app) this._app.setHass(h); if (this._fitOn && !this._fitInit) this._fitStart(); }
    get hass() { return this._hass; }
    _fitStart() {
      this._fitInit = true; var self = this, R = this._root, tmr = null;
      var run = function () { clearTimeout(tmr); tmr = setTimeout(function () { self._fitNow(); }, 120); };
      this._fitRun = run;
      if (window.ResizeObserver) { this._fro = new ResizeObserver(run); var mn = R.querySelector("#view-home"); if (mn) this._fro.observe(mn); }
      window.addEventListener("resize", run);
      [300, 1200, 3000].forEach(function (t) { setTimeout(run, t); });
    }
    _fitNow() {
      var R = this._root, sc = R.querySelector("#scroll"), home = R.querySelector("#view-home");
      if (!sc || !home || home.offsetParent === null || !this.isConnected) return;
      var top = Math.max(0, this.getBoundingClientRect().top), A = (window.innerHeight || 800) - top, z = this._z || 1;
      for (var k = 0; k < 4; k++) {
        this.style.zoom = z; this.style.height = (A / z) + "px";
        var mw = R.querySelector("#main"), wr = mw && mw.parentElement, need = wr ? wr.offsetTop + wr.offsetHeight : sc.scrollHeight;
        var nz = Math.max(.4, Math.min(1, z * Math.min(1.25, (A / z) / need) * .995));
        if (Math.abs(nz - z) < .01) { z = Math.min(z, nz); break; } z = nz;
      }
      this.style.zoom = z; this.style.height = (A / z) + "px"; this._z = z;
    }
    getCardSize() { return 20; }
    getLayoutOptions() { return { grid_columns: 12, grid_rows: 12 }; }
    connectedCallback() { if (this._app) this._app.start(); }
    disconnectedCallback() { if (this._app) this._app.stop(); if (this._fitRun) window.removeEventListener("resize", this._fitRun); if (this._fro) this._fro.disconnect(); this._fitInit = false; }
    static getStubConfig() { return {}; }
  }
  console.info("%c NORDLYS %c " + window.NORDLYS_VERSION + " ", "background:#7C5CFF;color:#fff;font-weight:700", "background:#FBBF24;color:#141838;font-weight:700");
  if (!customElements.get("nordlys-card")) customElements.define("nordlys-card", AuroraV3Card);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "nordlys-card", name: "Nordlys", description: "Animeret dashboard på dansk (baseret på Aurora Glass v3, GPL-3.0)." });
  /* Nordlys ur: let kort til vægskærme (fx Shelly Wall Display på højkant) — ur, ude, forbrug, lys og affald. Ingen animationer.
     type: custom:nordlys-ur-card · temperature, weather, power · rooms: [{ name, icon, color, lights: [{ e, n, ic }] }] · waste: [entity | { e, n }]
     hide: [dato, hilsen, ude, forbrug] · scale: 1 (større/mindre) */
  var UR_CSS = ":host{display:block}"
    + ".ur{font-family:'Manrope',system-ui,sans-serif;color:#F5F7FF;-webkit-font-smoothing:antialiased;display:flex;flex-direction:column;gap:.75em}"
    + ".ur-top{background:linear-gradient(160deg,#151B36,#0D1226);border:1px solid rgba(255,255,255,.10);border-radius:1.2em;padding:.8em .95em .9em}"
    + ".ur-d{font-size:.62em;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#6B7599}"
    + ".ur-g{font-family:'Sora','Manrope',sans-serif;font-weight:700;font-size:1em;margin-top:.1em}"
    + ".ur-t{font-family:'Sora','Manrope',sans-serif;font-weight:800;line-height:1;letter-spacing:-.05em;font-variant-numeric:tabular-nums;font-size:3.3em;margin:.06em 0 .14em;background:linear-gradient(110deg,#F5F7FF 10%,#9DB8FF 55%,#8B7CF6 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}"
    + ".ur-c{display:flex;flex-wrap:wrap;gap:.4em}"
    + ".ur-ch{display:inline-flex;align-items:center;gap:.4em;padding:.38em .75em .38em .55em;border-radius:99px;font-size:.68em;font-weight:600;color:#A3AED0;background:rgba(7,10,22,.55);border:1px solid rgba(255,255,255,.10);cursor:pointer;-webkit-tap-highlight-color:transparent}"
    + ".ur-ch b{color:#F5F7FF;font-weight:700;font-variant-numeric:tabular-nums}.ur-ch ha-icon{--mdc-icon-size:1.25em;color:#9DB8FF}"
    + ".ur-dot{width:.5em;height:.5em;border-radius:50%;background:#34D399}.ur-dot.mid{background:#FBBF24}.ur-dot.hi{background:#FB7185}"
    + ".ur-h{display:flex;align-items:center;gap:.5em;font-family:'Sora','Manrope',sans-serif;font-weight:700;font-size:.8em;margin:.2em 0 -.2em .1em}.ur-h:before{content:'';width:3px;height:1em;border-radius:2px;background:#7C8CF8}.ur-h small{font-family:'Manrope',sans-serif;font-weight:600;font-size:.82em;color:#6B7599}"
    + ".ur-rooms{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.55em}"
    + ".ur-room{background:linear-gradient(160deg,#151B36,#0D1226);border:1px solid rgba(255,255,255,.10);border-radius:1.1em;padding:.6em}"
    + ".ur-rh{display:flex;align-items:center;gap:.5em;margin-bottom:.5em}.ur-ri{width:1.8em;height:1.8em;border-radius:.6em;display:grid;place-items:center;background:var(--rc);color:#fff}.ur-ri ha-icon{--mdc-icon-size:1.05em}"
    + ".ur-rn{font-weight:800;font-size:.8em;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ur-rc{font-size:.6em;font-weight:800;padding:.2em .6em;border-radius:99px;color:var(--rc);background:color-mix(in srgb,var(--rc) 18%,transparent)}"
    + ".ur-ls{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:.45em}"
    + ".ur-l{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:.3em;padding:.55em;border-radius:.85em;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);color:#F5F7FF;font:inherit;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent;min-width:0}"
    + ".ur-l .li{width:1.7em;height:1.7em;border-radius:.55em;display:grid;place-items:center;background:rgba(255,255,255,.08);color:#A3AED0}.ur-l .li ha-icon{--mdc-icon-size:1em}"
    + ".ur-l .sw{position:absolute;top:.6em;right:.55em;width:1.75em;height:1em;border-radius:99px;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.12)}.ur-l .sw:after{content:'';position:absolute;top:.1em;left:.1em;width:.72em;height:.72em;border-radius:50%;background:#fff}"
    + ".ur-l b{font-size:.72em;font-weight:800;line-height:1.2;width:100%;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;min-height:2.4em;display:flex;align-items:flex-end}.ur-l small{font-size:.6em;font-weight:600;color:#A3AED0}"
    + ".ur-l.on{background:linear-gradient(160deg,color-mix(in srgb,var(--rc) 30%,transparent),color-mix(in srgb,var(--rc) 8%,transparent));border-color:color-mix(in srgb,var(--rc) 45%,transparent)}.ur-l.on .li{background:var(--rc);color:#fff}.ur-l.on .sw{background:var(--rc)}.ur-l.on .sw:after{left:auto;right:.1em}.ur-l.on small{color:color-mix(in srgb,var(--rc) 65%,#fff)}"
    + ".ur-l.na{opacity:.5}.ur-room.one .ur-ri{display:none}"
    + ".ur-w{display:grid;grid-template-columns:repeat(auto-fill,minmax(5.6em,1fr));gap:.5em}"
    + ".ur-wt{display:flex;flex-direction:column;align-items:center;gap:.3em;padding:.6em .35em;border-radius:1em;border:1px solid rgba(255,255,255,.10);background:linear-gradient(160deg,#151B36,#0D1226);color:#F5F7FF;font:inherit;text-align:center;cursor:pointer;min-width:0}"
    + ".ur-wt img,.ur-wt ha-icon{width:2em;height:2em;--mdc-icon-size:1.6em}.ur-wt b{font-size:.62em;font-weight:800;line-height:1.2}.ur-wt small{font-size:.58em;font-weight:700;color:#A3AED0}"
    + ".ur-wt.soon{border-color:rgba(251,191,36,.6)}.ur-wt.soon small{color:#FBBF24}.ur-wt.na{opacity:.5}"
    + "[hidden]{display:none!important}";
  var UR_WX = { "clear-night": "mdi:weather-night", cloudy: "mdi:weather-cloudy", fog: "mdi:weather-fog", hail: "mdi:weather-hail", lightning: "mdi:weather-lightning", "lightning-rainy": "mdi:weather-lightning-rainy", partlycloudy: "mdi:weather-partly-cloudy", pouring: "mdi:weather-pouring", rainy: "mdi:weather-rainy", snowy: "mdi:weather-snowy", "snowy-rainy": "mdi:weather-snowy-rainy", sunny: "mdi:weather-sunny", windy: "mdi:weather-windy", "windy-variant": "mdi:weather-windy-variant", exceptional: "mdi:alert-circle-outline" };
  var UR_COL = ["#8B5CF6", "#F59E0B", "#22D3EE", "#F43F5E", "#34D399"];
  function urIc(x) { x = String(x || ""); return x.indexOf("mdi-") === 0 ? "mdi:" + x.slice(4) : x; }
  function urEsc(x) { return String(x === undefined || x === null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  class NordlysUrCard extends HTMLElement {
    constructor() { super(); this._r = this.attachShadow({ mode: "open" }); this._c = {}; this._t = null; this._sig = ""; this._pend = {}; }
    setConfig(c) {
      this._c = c || {}; boot(); c = this._c;
      var hd = (Array.isArray(c.hide) ? c.hide : []).map(function (x) { return String(x).toLowerCase(); }), H = function (k) { return hd.indexOf(k) > -1 ? " hidden" : ""; };
      var rooms = (Array.isArray(c.rooms) ? c.rooms : []).map(function (r, ri) { return { name: r.name || r.n || "", icon: urIc(r.icon || r.ic || "mdi:lightbulb-group"), color: r.color || UR_COL[ri % UR_COL.length], lights: (Array.isArray(r.lights) ? r.lights : []).map(function (l) { return typeof l === "string" ? { e: l } : { e: l.e || l.entity, n: l.n || l.name, ic: urIc(l.ic || l.icon) }; }).filter(function (l) { return l.e; }) }; }).filter(function (r) { return r.lights.length; });
      var waste = (Array.isArray(c.waste) ? c.waste : []).map(function (x) { return typeof x === "string" ? { e: x } : { e: x && (x.e || x.entity), n: x && (x.n || x.name) }; }).filter(function (x) { return x.e; });
      this._rooms = rooms; this._waste = waste;
      var h = "<style>" + UR_CSS + "</style><div class=\"ur\"><div class=\"ur-top\"><div class=\"ur-d\" id=\"d\"" + H("dato") + "></div><div class=\"ur-g\" id=\"g\"" + H("hilsen") + "></div><div class=\"ur-t\" id=\"t\"></div><div class=\"ur-c\">"
        + "<span class=\"ur-ch\" id=\"ct\"" + H("ude") + "><ha-icon id=\"wi\" icon=\"mdi:thermometer\"></ha-icon>Ude <b id=\"tv\">—</b></span>"
        + "<span class=\"ur-ch\" id=\"cp\"" + (c.power ? H("forbrug") : " hidden") + "><ha-icon icon=\"mdi:lightning-bolt\"></ha-icon>Forbrug <b id=\"pv\">—</b><i class=\"ur-dot\" id=\"pd\"></i></span></div></div>";
      if (rooms.length) {
        h += "<div class=\"ur-h\">Lys og rum</div><div class=\"ur-rooms\">" + rooms.map(function (r, ri) {
          var n = Math.min(3, r.lights.length);
          return "<div class=\"ur-room" + (n === 1 ? " one" : "") + "\" style=\"--rc:" + urEsc(r.color) + ";grid-column:span " + n + "\"><div class=\"ur-rh\"><span class=\"ur-ri\"><ha-icon icon=\"" + urEsc(r.icon) + "\"></ha-icon></span><span class=\"ur-rn\">" + urEsc(r.name) + "</span><span class=\"ur-rc\" id=\"rc" + ri + "\">0/" + r.lights.length + "</span></div><div class=\"ur-ls\" style=\"--n:" + n + "\">"
            + r.lights.map(function (l, li) { return "<button class=\"ur-l\" type=\"button\" id=\"l" + ri + "_" + li + "\" data-e=\"" + urEsc(l.e) + "\"><span class=\"li\"><ha-icon icon=\"" + urEsc(l.ic || r.icon) + "\"></ha-icon></span><i class=\"sw\"></i><b>" + urEsc(l.n || l.e) + "</b><small>—</small></button>"; }).join("") + "</div></div>";
        }).join("") + "</div>";
      }
      if (waste.length) h += "<div class=\"ur-h\">Affald <small>næste tømning</small></div><div class=\"ur-w\">" + waste.map(function (x, i) { return "<button class=\"ur-wt\" type=\"button\" id=\"w" + i + "\"><ha-icon icon=\"mdi:trash-can-outline\"></ha-icon><b>" + urEsc(x.n || "") + "</b><small>—</small></button>"; }).join("") + "</div>";
      this._r.innerHTML = h + "</div>";
      var self = this, R = this._r;
      R.getElementById("ct").addEventListener("click", function () { self._more(c.temperature || c.weather); });
      R.getElementById("cp").addEventListener("click", function () { self._more(c.power); });
      Array.prototype.forEach.call(R.querySelectorAll(".ur-l"), function (b) { b.addEventListener("click", function () { self._toggle(b); }); });
      waste.forEach(function (x, i) { R.getElementById("w" + i).addEventListener("click", function () { self._more(x.e); }); });
      this._sig = ""; this._tick(); this._fit(); if (this._hass) this.hass = this._hass;
    }
    _more(id) { if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: id } })); }
    _toggle(b) {
      var e = b.dataset.e, hs = this._hass; if (!hs || !e) return; var s = hs.states[e]; if (!s || s.state === "unavailable") return;
      var want = s.state !== "on", self = this; this._pend[e] = { want: want, s0: s, until: Date.now() + 5000 };
      b.classList.toggle("on", want); b.querySelector("small").textContent = want ? "Tændt" : "Slukket";
      hs.callService("homeassistant", want ? "turn_on" : "turn_off", { entity_id: e }).catch(function () { delete self._pend[e]; self._sig = ""; self.hass = self._hass; });
      setTimeout(function () { self._sig = ""; if (self._hass) self.hass = self._hass; }, 5100);
    }
    _fit() {
      var self = this, u = this._r.querySelector(".ur"); if (!u) return; var k = +this._c.scale || 1;
      var f = function () { var w = self.clientWidth || u.clientWidth; if (w) u.style.fontSize = (Math.max(12, Math.min(20, w / 24)) * k) + "px"; };
      f(); if (window.ResizeObserver) { if (this._ro) this._ro.disconnect(); this._ro = new ResizeObserver(f); this._ro.observe(this); }
    }
    _tick() {
      var r = this._r, n = new Date(), p = function (x) { return (x < 10 ? "0" : "") + x; }, h = n.getHours();
      if (!r.getElementById("t")) return;
      r.getElementById("t").textContent = p(h) + ":" + p(n.getMinutes());
      r.getElementById("d").textContent = n.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" });
      r.getElementById("g").textContent = (h >= 22 || h < 5) ? "Godnat" : h < 12 ? "Godmorgen" : h < 18 ? "God eftermiddag" : "Godaften";
      var self = this; clearTimeout(this._t); this._t = setTimeout(function () { self._tick(); if (self._hass) { self._sig = ""; self.hass = self._hass; } }, 60500 - n.getSeconds() * 1000 - n.getMilliseconds());
    }
    set hass(hs) {
      this._hass = hs; var c = this._c, r = this._r, st = hs.states || {}, tS = st[c.temperature], wS = st[c.weather], pS = st[c.power], self = this, now = Date.now();
      if (!r.getElementById("tv")) return;
      var ids = []; (this._rooms || []).forEach(function (rm) { rm.lights.forEach(function (l) { ids.push(l.e); }); }); (this._waste || []).forEach(function (x) { ids.push(x.e); });
      var sig = [tS && tS.state, wS && wS.state, wS && wS.attributes.temperature, pS && pS.state].concat(ids.map(function (id) { var s = st[id]; return s ? s.state + (s.attributes.entity_picture || "") : "-"; })).join("|") + Object.keys(this._pend).length;
      if (sig === this._sig) return; this._sig = sig;
      var t = tS && !isNaN(parseFloat(tS.state)) ? parseFloat(tS.state) : (wS && wS.attributes.temperature !== undefined ? +wS.attributes.temperature : null);
      var w = pS && !isNaN(parseFloat(pS.state)) ? parseFloat(pS.state) * ((pS.attributes.unit_of_measurement === "kW") ? 1000 : 1) : null;
      r.getElementById("tv").textContent = t === null ? "—" : t.toLocaleString("da-DK", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " °C";
      r.getElementById("wi").setAttribute("icon", wS && UR_WX[wS.state] ? UR_WX[wS.state] : "mdi:thermometer");
      r.getElementById("pv").textContent = w === null ? "—" : w >= 1000 ? (w / 1000).toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kW" : Math.round(w) + " W";
      var lim = +c.limit || 11000; r.getElementById("pd").className = "ur-dot" + (w !== null && w > lim * .7 ? " hi" : w !== null && w > lim * .35 ? " mid" : "");
      (this._rooms || []).forEach(function (rm, ri) {
        var cnt = 0;
        rm.lights.forEach(function (l, li) {
          var s = st[l.e], b = r.getElementById("l" + ri + "_" + li), na = !s || s.state === "unavailable" || s.state === "unknown", on = !!s && s.state === "on", pd = self._pend[l.e];
          if (pd) { if ((on === pd.want && s !== pd.s0) || now > pd.until || na) delete self._pend[l.e]; else on = pd.want; }
          if (on) cnt++;
          b.classList.toggle("on", on); b.classList.toggle("na", na);
          b.querySelector("small").textContent = na ? "Ikke tilgængelig" : on ? "Tændt" : "Slukket";
        });
        r.getElementById("rc" + ri).textContent = cnt + "/" + rm.lights.length;
      });
      (this._waste || []).forEach(function (x, i) {
        var s = st[x.e], a = (s && s.attributes) || {}, na = !s || s.state === "unavailable" || s.state === "unknown", d = na ? NaN : parseInt(s.state, 10), b = r.getElementById("w" + i);
        var nm = x.n || a.name || a.friendly_name || x.e, dur = na ? "Ikke tilgængelig" : (d === 0 ? "I dag" : d === 1 ? "I morgen" : (a.duration || ("Om " + s.state + " dage")));
        var pic = a.entity_picture ? "<img src=\"" + urEsc(a.entity_picture) + "\" alt=\"\">" : "<ha-icon icon=\"mdi:trash-can-outline\"></ha-icon>";
        var hh = pic + "<b>" + urEsc(nm) + "</b><small>" + urEsc(dur) + "</small>"; if (b.dataset.sig !== hh) { b.dataset.sig = hh; b.innerHTML = hh; }
        b.className = "ur-wt" + (d <= 1 ? " soon" : "") + (na ? " na" : "");
      });
    }
    connectedCallback() { this._tick(); }
    disconnectedCallback() { clearTimeout(this._t); }
    getCardSize() { return 8; }
    static getStubConfig() { return { temperature: "", weather: "", power: "" }; }
  }
  if (!customElements.get("nordlys-ur-card")) customElements.define("nordlys-ur-card", NordlysUrCard);
  window.customCards.push({ type: "nordlys-ur-card", name: "Nordlys ur", description: "Let kort til vægskærme: ur, ude, forbrug, lys og affald." });
  console.info("%c NORDLYS %c kort indlæst ", "background:#7C5CFF;color:#fff;border-radius:4px 0 0 4px;padding:2px 6px", "background:#1b1740;color:#fff;border-radius:0 4px 4px 0;padding:2px 6px");
})();
