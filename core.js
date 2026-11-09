/* Ортақ ядро: backend (Firebase немесе демо), есім біріктіру, тең топтар, 10 балл, дыбыс, QR */
(function () {
  const C = (window.GT = {});
  C.FB = {
    apiKey: 'AIzaSyCHhQMw9NfW06xojU2lSR0lzGd47T-41ZU',
    authDomain: 'geoecologyashyksabak.firebaseapp.com',
    databaseURL: 'https://geoecologyashyksabak-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'geoecologyashyksabak',
    appId: '1:392314898838:web:770042e73ea996cd61f5b7'
  };
  C.PREFIX = 'GT'; /* ойын коды: GT1234 — Firebase-тегі games/ бөлімі */
  C.esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  C.nrm = (s) => String(s || '').toLowerCase().replace(/[әа]/g, 'а').replace(/қ/g, 'к').replace(/ғ/g, 'г').replace(/[ұүу]/g, 'у').replace(/[өо]/g, 'о').replace(/ң/g, 'н').replace(/[іи]/g, 'и').replace(/һ/g, 'х').replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();

  /* Деңгейі тең топтар (озат A=3, екпінді B=2, қанағат C=1) */
  C.balance = function (list, G) {
    const W = { A: 3, B: 2, C: 1 }, g = [...Array(G)].map(() => []), s = (x) => x.reduce((a, p) => a + W[p.l], 0);
    for (const L of ['A', 'B', 'C']) for (const p of list.filter((x) => x.l === L)) {
      const min = Math.min(...g.map((x) => x.length));
      const c = g.filter((x) => x.length === min).sort((a, b) => (L === 'C' ? s(b) - s(a) : s(a) - s(b)));
      c[0].push(p);
    }
    /* жақсарту: топ сомаларының айырмасы азаятын алмасуларды жасау (өлшемдер сақталады) */
    const cost = () => { const t = g.map(s); return Math.max(...t) - Math.min(...t); };
    for (let it = 0, imp = true; imp && it < 50; it++) {
      imp = false;
      for (let a = 0; a < G; a++) for (let b = a + 1; b < G; b++) for (let i = 0; i < g[a].length; i++) for (let j = 0; j < g[b].length; j++) {
        if (g[a][i].l === g[b][j].l) continue;
        const before = cost(); [g[a][i], g[b][j]] = [g[b][j], g[a][i]];
        if (cost() < before) imp = true; else [g[a][i], g[b][j]] = [g[b][j], g[a][i]];
      }
    }
    return g;
  };
  C.groupSum = (m) => m.reduce((a, p) => a + ({ A: 3, B: 2, C: 1 }[p.l] || 0), 0);
  /* Рөлдер: 1-спикер (A), 2-спикер (B), хатшы (B), постер қорғаушы (A емес) */
  C.assignRoles = function (members) {
    const free = members.map((p) => Object.assign({}, p, { role: '' }));
    const pick = (pref, role) => {
      for (const want of pref) { const p = free.find((x) => !x.role && (want === '*' || (want === '!A' ? x.l !== 'A' : x.l === want))); if (p) { p.role = role; return; } }
    };
    pick(['A', 'B', 'C'], 'sp1'); pick(['B', 'A', 'C'], 'sp2'); pick(['B', 'C', 'A'], 'hat'); pick(['!A', '*'], 'pos');
    return free;
  };
  C.parseRoster = function (text) {
    return String(text || '').split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => {
      const m = line.match(/^(.*?)[\s,;\-–—:]+([ABCАВСабвсabc])\s*$/);
      let name = m ? m[1] : line, l = m ? m[2].toUpperCase() : 'B';
      l = { 'А': 'A', 'В': 'B', 'С': 'C' }[l] || l;
      name = name.replace(/^\d+[.)]\s*/, '').trim();
      return { name, l: ['A', 'B', 'C'].includes(l) ? l : 'B' };
    }).filter((p) => p.name);
  };

  C.ball10 = (p, M) => Math.max(1, Math.floor((p * 10) / M + 0.5));
  C.band = (b) => (b >= 8 ? 'жоғары' : b >= 4 ? 'орта' : 'төмен');

  /* Квиз */
  C.isRight = function (q, v) {
    if (v === null || v === undefined || v === '') return false;
    if (q.t === 'num') return Math.abs(parseFloat(String(v).replace(',', '.')) - q.a) < 0.01;
    if (q.t === 'order') return Array.isArray(v) && v.length === q.a.length && v.every((x, k) => x === q.a[k]);
    return v === q.a;
  };

  /* Рейтинг: хатшы + квиз есім бойынша бірігеді, әр кілттің max-ы */
  C.rating = function (game, roster) {
    const LD = window.LD; game = game || {};
    const rows = new Map();
    const get = (name, g) => {
      const key = C.nrm(name); if (!key) return null;
      if (!rows.has(key)) rows.set(key, { key, name, g: g == null ? null : g, sc: {} });
      const r = rows.get(key); if (r.g == null && g != null) r.g = g; return r;
    };
    (roster || []).forEach((p) => get(p.name, p.g));
    const sec = game.sec || {};
    Object.keys(sec).forEach((dev) => { const part = sec[dev] || {}; Object.keys(part).forEach((k) => {
      const e = part[k]; if (!e || !e.name) return; const r = get(e.name, e.g);
      Object.keys(e.sc || {}).forEach((dk) => { r.sc[dk] = Math.max(r.sc[dk] || 0, Number(e.sc[dk]) || 0); });
    }); });
    const players = game.players || {}, answers = game.answers || {};
    Object.keys(players).forEach((uid) => {
      const p = players[uid]; if (!p || !p.name) return; const r = get(p.name, p.g);
      let c = 0, n = 0; LD.quiz.forEach((q, i) => { const a = answers[i] && answers[i][uid]; if (a) { n++; if (C.isRight(q, a.v)) c++; } });
      r.quizC = Math.max(r.quizC || 0, c); r.quizN = Math.max(r.quizN || 0, n);
      r.sc.K7_0 = Math.max(r.sc.K7_0 || 0, Math.min(4, Math.floor(c / 2)));
    });
    const out = [...rows.values()].map((r) => {
      const byK = {}; LD.tasks.forEach((t) => { byK[t.k] = t.d.reduce((s, d, i) => s + (r.sc[t.k + '_' + i] || 0), 0); });
      const total = Object.values(byK).reduce((a, b) => a + b, 0);
      const b = C.ball10(total, LD.MAX);
      return Object.assign(r, { byK, total, b, band: C.band(b) });
    }).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
    return out;
  };

  /* ---------- дыбыс ---------- */
  let AC = null;
  const ac = () => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {} return AC; };
  C.tone = function (f, d, type, vol, at) {
    const a = ac(); if (!a) return; const t = a.currentTime + (at || 0);
    const o = a.createOscillator(), g = a.createGain(); o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + 0.05);
  };
  C.chime = () => { [880, 1175, 1568].forEach((f, i) => C.tone(f, 0.6, 'sine', 0.18, i * 0.18)); };
  C.tick = () => C.tone(1400, 0.06, 'square', 0.06);
  C.melody = () => { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => C.tone(f, 0.35, 'triangle', 0.2, i * 0.2)); };
  C.bell = () => { C.tone(660, 1.2, 'sine', 0.25); C.tone(990, 1.0, 'sine', 0.12, 0.05); };

  /* ---------- QR ---------- */
  let qrN = 0;
  C.qr = function (text, px) {
    if (!window.qrcode) return '';
    const q = window.qrcode(0, 'H'); q.addData(text); q.make();
    const n = q.getModuleCount(), id = 'qg' + (qrN++), m = 4, S = n + m * 2;
    const inFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    const lo = Math.floor(n / 2) - 3, hi = Math.floor(n / 2) + 3; /* ортадағы логотип орны */
    let dots = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (!q.isDark(r, c) || inFinder(r, c)) continue;
      if (r >= lo && r <= hi && c >= lo && c <= hi) continue;
      dots += `<rect x="${c + m + 0.06}" y="${r + m + 0.06}" width="0.9" height="0.9" rx="0.3"/>`;
    }
    const finder = (r, c) => `<path fill="url(#${id})" fill-rule="evenodd" d="M${c + m + 1.6} ${r + m}h3.8a1.6 1.6 0 0 1 1.6 1.6v3.8a1.6 1.6 0 0 1 -1.6 1.6h-3.8a1.6 1.6 0 0 1 -1.6 -1.6v-3.8a1.6 1.6 0 0 1 1.6 -1.6zM${c + m + 1.8} ${r + m + 1}h3.4a0.8 0.8 0 0 1 0.8 0.8v3.4a0.8 0.8 0 0 1 -0.8 0.8h-3.4a0.8 0.8 0 0 1 -0.8 -0.8v-3.4a0.8 0.8 0 0 1 0.8 -0.8z"/><rect x="${c + m + 2}" y="${r + m + 2}" width="3" height="3" rx="0.7" fill="#9A1558"/>`;
    const cx = S / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="100%" height="100%" shape-rendering="geometricPrecision">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#08624E"/><stop offset=".5" stop-color="#173B9A"/><stop offset="1" stop-color="#8E1352"/></linearGradient></defs>
      <rect width="${S}" height="${S}" rx="2.4" fill="#fff"/>
      <g fill="url(#${id})">${dots}</g>${finder(0, 0)}${finder(0, n - 7)}${finder(n - 7, 0)}
      <circle cx="${cx}" cy="${cx}" r="3.3" fill="#fff"/><circle cx="${cx}" cy="${cx}" r="2.7" fill="#FFE6F2" stroke="#E0398C" stroke-width="0.45"/>
      <circle cx="${cx - 0.3}" cy="${cx - 0.2}" r="1.05" fill="#00B386"/><circle cx="${cx + 1.2}" cy="${cx - 1.3}" r="0.35" fill="#3B5BFF"/></svg>`;
  };
  C.base = () => location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');

  /* ---------- backend ---------- */
  function setIn(obj, parts, val) {
    if (!parts.length) return val;
    const o = obj && typeof obj === 'object' ? Object.assign({}, obj) : {};
    const [h, ...rest] = parts; const nv = setIn(o[h], rest, val);
    if (nv === null || nv === undefined) delete o[h]; else o[h] = nv; return o;
  }
  const getIn = (obj, parts) => parts.reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
  const TS = { '.sv': 'timestamp' };
  const resolveTs = (v) => { if (v && typeof v === 'object') { if (v['.sv'] === 'timestamp') return Date.now(); const o = Array.isArray(v) ? [] : {}; Object.keys(v).forEach((k) => { o[k] = resolveTs(v[k]); }); return o; } return v; };

  function localBackend() {
    const KEY = 'gt_demo_db';
    let uid; try { uid = sessionStorage.getItem('gt_demo_uid'); if (!uid) { uid = 'u' + Math.random().toString(36).slice(2, 10); sessionStorage.setItem('gt_demo_uid', uid); } } catch (e) { uid = 'u' + Math.random().toString(36).slice(2, 10); }
    const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
    const ls = new Set(); const fire = () => { const d = read(); ls.forEach((l) => l(d)); };
    let bc = null; try { bc = new BroadcastChannel('gt_demo'); bc.onmessage = fire; } catch (e) {}
    window.addEventListener('storage', (e) => { if (e.key === KEY) fire(); });
    const write = (fn) => { try { localStorage.setItem(KEY, JSON.stringify(fn(read()))); } catch (e) {} fire(); if (bc) bc.postMessage(1); };
    return {
      demo: true, uid, TS, now: () => Date.now(),
      set: async (p, v) => write((d) => setIn(d, p.split('/'), resolveTs(v))),
      update: async (p, o) => write((d) => { Object.keys(o).forEach((k) => { d = setIn(d, (p + '/' + k).split('/'), resolveTs(o[k])); }); return d; }),
      on: (p, cb) => { let last = '\u0000'; const l = (d) => { const v = getIn(d, p.split('/')); const s = JSON.stringify(v); if (s !== last) { last = s; cb(v === undefined ? null : v); } }; ls.add(l); l(read()); return () => ls.delete(l); },
      get: async (p) => { const v = getIn(read(), p.split('/')); return v === undefined ? null : v; }
    };
  }
  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  async function firebaseBackend() {
    const v = 'https://www.gstatic.com/firebasejs/10.12.2/';
    await loadScript(v + 'firebase-app-compat.js'); await loadScript(v + 'firebase-auth-compat.js'); await loadScript(v + 'firebase-database-compat.js');
    if (!firebase.apps.length) firebase.initializeApp(C.FB);
    await firebase.auth().signInAnonymously();
    const uid = firebase.auth().currentUser.uid; const db = firebase.database(); let off = 0;
    db.ref('.info/serverTimeOffset').on('value', (s) => { off = s.val() || 0; });
    return {
      demo: false, uid, TS: firebase.database.ServerValue.TIMESTAMP, now: () => Date.now() + off,
      set: (p, val) => db.ref(p).set(val), update: (p, o) => db.ref(p).update(o),
      on: (p, cb) => { const r = db.ref(p); const h = (s) => cb(s.val()); r.on('value', h); return () => r.off('value', h); },
      get: async (p) => (await db.ref(p).get()).val()
    };
  }
  C.backend = async function () {
    if (/[?&]demo=1/.test(location.search)) return localBackend();
    try { return await Promise.race([firebaseBackend(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 9000))]); }
    catch (e) { console.warn('Firebase қосылмады, демо режим', e); const b = localBackend(); b.offline = true; return b; }
  };
  C.arr = (x) => (Array.isArray(x) ? x.filter(Boolean) : x && typeof x === 'object' ? Object.keys(x).sort((a, b) => a - b).map((k) => x[k]).filter(Boolean) : []);
  C.code = () => { const m = location.search.match(/[?&]c=([A-Z0-9]+)/i); return m ? m[1].toUpperCase() : ''; };
})();
