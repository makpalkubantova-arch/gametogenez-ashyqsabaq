/* Тақта v2: бір экран — бір әрекет. Әдіс → Қалай орындаймыз → Тапсырма. Бағалау, сөз, рейтинг — бөлек панельдерде. */
(function () {
  const LD = window.LD, GT = window.GT, GV = window.GV;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = GT.esc, ST = LD.stages;
  const LS = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const SET = Object.assign({ autoTimer: true, guideAll: false, voice: true, videoUrl: '' }, LS.get('gt_set', {}));
  const S = { i: Math.min(ST.length - 1, Math.max(0, LS.get('gt_stage2', 0))), code: '', db: null, game: {}, roster: LS.get('gt_roster', []), manual: LS.get('gt_manual', {}),
    mood: {}, hwQ: 0, hwPick: '', spk: 0, spkDone: {}, vStep: -1, key: {}, gal: -1, grouped: false,
    labSc: LS.get('gt_lab', {}), lab: LS.get('gt_labst', { pos: -1, stars: [0, 0, 0], queue: null }) };
  const grp = (i) => LD.groups[i] || LD.groups[0];
  const role = (k) => LD.roles.find((r) => r.key === k);
  const task = (k) => LD.tasks.find((t) => t.k === k);
  const kMax = (k) => task(k).d.reduce((a, d) => a + d.p, 0);
  const cur = () => ST[S.i];
  const link = (f) => GT.base() + f + '?c=' + S.code + (S.db && S.db.demo ? '&demo=1' : '');

  function fit() { const k = Math.min(innerWidth / 1920, innerHeight / 1080); $('#stage').style.transform = `scale(${k})`; }
  addEventListener('resize', fit); fit();

  /* ---------- рейтинг (хатшы + квиз + мұғалімнің қолмен түзетуі) ---------- */
  function rating() {
    const rows = GT.rating(S.game, S.roster, S.labSc);
    rows.forEach((r) => {
      const m = S.manual[r.key];
      if (m) Object.keys(m).forEach((k) => { if (m[k] !== '' && m[k] != null) r.byK[k] = Math.min(kMax(k), Math.max(0, +m[k])); });
      r.total = Object.values(r.byK).reduce((a, b) => a + b, 0); r.b = GT.ball10(r.total, LD.MAX); r.band = GT.band(r.b);
    });
    return rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }
  function groupTotals(rows) { const t = LD.groups.map(() => 0); rows.forEach((r) => { if (r.g != null) t[r.g] += r.total; }); return t; }

  /* ---------- таймер ---------- */
  const T = { total: 0, left: 0, run: false, end: 0, sig60: false, last: -1 };
  const fmt = (s) => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  function tSet(sec, start) { T.total = sec; T.left = sec; T.run = false; T.sig60 = sec <= 60; T.last = -1; $('#count').classList.remove('on'); if (start && sec > 0) tStart(); tDraw(); }
  function tStart() { if (T.left <= 0) return; T.run = true; T.end = Date.now() + T.left * 1000; tDraw(); }
  function tToggle() { if (T.run) { T.run = false; tDraw(); } else tStart(); GT.tone(1, 0.01); }
  function tDraw() { $('#tval').textContent = fmt(T.left); $('#tplay').textContent = T.run ? '⏸' : '▶'; $('#timer').classList.toggle('low', T.left <= 60 && T.total > 0); $('#timer').classList.toggle('run', T.run); }
  function banner(t, ms) { const b = $('#banner'); b.textContent = t; b.classList.add('on'); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('on'), ms || 3800); }
  $('#tplay').onclick = tToggle; $('#treset').onclick = () => tSet(T.total);
  $('#tplus').onclick = () => { T.left += 60; T.total = Math.max(T.total, T.left); if (T.run) T.end += 60000; if (T.left > 60) T.sig60 = false; tDraw(); };
  /* спикер / галерея үшін кіші таймер */
  const MT = { run: false, end: 0, last: -1, done: null };
  function miniStart(sec, done) { MT.run = true; MT.end = Date.now() + sec * 1000; MT.last = -1; MT.done = done; }
  setInterval(() => {
    if (T.run) {
      T.left = (T.end - Date.now()) / 1000;
      if (!T.sig60 && T.left <= 60) { T.sig60 = true; GT.chime(); banner('⏰ 1 минут қалды!'); }
      const s = Math.ceil(T.left);
      if (s <= 10 && s > 0 && s !== T.last && !MT.run) { T.last = s; GT.tick(); $('#count').classList.add('on'); const n = $('#cnum'); n.textContent = s; n.style.animation = 'none'; void n.offsetWidth; n.style.animation = ''; }
      if (T.left <= 0) { T.left = 0; T.run = false; $('#count').classList.remove('on'); GT.melody(); const k = cur().k; banner(k && k !== 'K7' ? `⏰ Уақыт бітті! 📒 Хатшылар ${k} ұпайын енгізсін` : '🎵 Уақыт бітті!', 5000); }
      tDraw();
    }
    if (MT.run) {
      const left = Math.max(0, (MT.end - Date.now()) / 1000), s = Math.ceil(left), el = $('#mini');
      if (el) { el.textContent = fmt(left); el.style.background = s <= 10 ? '#FDE4E4' : 'rgba(255,255,255,.95)'; el.style.color = s <= 10 ? '#D64545' : '#10233F'; const ring = $('#ring'); if (ring) ring.style.strokeDashoffset = 314 * (1 - left / 60); }
      if (s <= 10 && s > 0 && s !== MT.last) { MT.last = s; GT.tick(); }
      if (left <= 0) { MT.run = false; GT.bell(); if (MT.done) MT.done(); }
    }
  }, 200);

  /* ---------- гид ---------- */
  let kk = null; const lv = () => { try { kk = (speechSynthesis.getVoices() || []).find((v) => /^kk/i.test(v.lang)) || null; } catch (e) {} };
  try { lv(); speechSynthesis.onvoiceschanged = lv; } catch (e) {}
  function guide(text) {
    const b = $('#bub'), m = $('#gmed'); $('#gtext').textContent = text; b.classList.add('on'); m.classList.add('talk');
    clearTimeout(b._t); clearTimeout(m._t); m._t = setTimeout(() => m.classList.remove('talk'), Math.min(6500, 900 + text.length * 45)); b._t = setTimeout(() => b.classList.remove('on'), 7000);
    if (kk && SET.voice) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.voice = kk; u.lang = kk.lang; speechSynthesis.speak(u); } catch (e) {} }
  }
  $('#gmed').onclick = () => guide(cur().guide);

  /* ---------- экрандар ---------- */
  const R = {};
  const how = (s) => `<div class="how"><h3>ҚАЛАЙ ОРЫНДАЙМЫЗ?</h3><ol>${s.how.map((h, i) => `<li><b>${i + 1}</b><span>${esc(h)}</span></li>`).join('')}</ol>
    ${s.id === 'groups' ? `<div style="display:flex;gap:12px;align-items:center;background:rgba(255,255,255,.12);border-radius:18px;padding:10px"><div class="qrbox" style="width:120px;height:120px;padding:6px;flex:none">${GT.qr(link('hatshy.html'), 120)}</div><div style="font-size:18px"><b style="color:var(--lm)">📒 ХАТШЫЛАРҒА</b><br>Әр топтан бір хатшы осы QR-ды сканерлейді</div></div>` : ''}
    <div class="say"><h4>🗣 СӨЙЛЕУ ҮЛГІСІ</h4>${(LD.say[s.id] || []).map((x) => `<i>${esc(x)}</i>`).join('')}</div></div>`;

  R.hello = () => `<div class="card" style="height:100%;display:grid;grid-template-columns:1.25fr .75fr;gap:30px;padding:30px 36px">
    <div style="display:flex;flex-direction:column"><div style="font-size:54px;font-weight:900;line-height:1.08;background:linear-gradient(90deg,#08795F,#1F4FD8 60%,#C2186E);-webkit-background-clip:text;background-clip:text;color:transparent">Сәлеметсіздер ме, құрметті қонақтар мен оқушылар!</div>
      <div style="font-size:29px;font-weight:800;margin:16px 0 4px">${esc(LD.lesson.topic)}</div><div class="mut" style="font-size:21px">${esc(LD.lesson.teacher)} · ${esc(LD.lesson.school)}</div>
      <div style="margin-top:20px;font-size:21px;font-weight:900;color:#0B6E58;letter-spacing:1px">БҮГІН САБАҚТА:</div>
      ${LD.goals.map((g, i) => `<div style="display:flex;gap:14px;align-items:center;font-size:26px;margin-top:12px"><b style="flex:none;width:46px;height:46px;border-radius:14px;background:${['#00B386', '#2563EB', '#E0398C'][i]};color:#fff;display:flex;align-items:center;justify-content:center">${['🔬', '🧬', '🏅'][i]}</b>${esc(g)}</div>`).join('')}
      <div style="margin-top:auto;font-size:20px;background:#FFF8E6;border-radius:16px;padding:12px 16px"><b>${esc(LD.lesson.value)}</b> · ${esc(LD.lesson.quote)}</div></div>
    <div><div style="font-size:26px;font-weight:900;margin-bottom:12px">Менің көңіл-күйім</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      ${[['🤩', 'Шабыттымын', '#00B386'], ['🙂', 'Жақсы', '#2563EB'], ['🤔', 'Ойланып тұрмын', '#F2994A'], ['😴', 'Шаршадым', '#7A3CFF']].map(([e, t, c], i) => `<button class="mood" data-i="${i}" style="border:3px solid ${c}44;background:#fff;border-radius:24px;padding:14px 8px;cursor:pointer;font-family:inherit"><span style="font-size:68px;display:block">${e}</span><b style="font-size:21px;color:${c}">${t}</b><div style="font-size:30px;font-weight:900;color:${c}" data-c="${i}">${S.mood[i] || 0}</div></button>`).join('')}</div></div></div>`;

  R.hw = () => { const q = LD.hot[S.hwQ]; return `<div style="display:grid;grid-template-columns:.8fr 1.2fr;gap:24px;height:100%">
    <div class="card" style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px"><div style="font-size:120px;line-height:1">🪑</div><div class="mut" style="font-size:22px;font-weight:800">«ЫСТЫҚ ОРЫНДЫҚТА»</div>
      <div id="pick" style="font-size:42px;font-weight:900;min-height:60px;color:#0B6E58">${esc(S.hwPick || '— ? —')}</div><button class="btn pink" id="spin" style="font-size:26px">🎲 Оқушыны таңдау</button>${S.roster.length ? '' : '<div class="mut" style="font-size:17px">Тізім ⚙️ баптауда енгізіледі</div>'}</div>
    <div class="card" style="display:flex;flex-direction:column"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:24px;color:#C2186E">🔥 СҰРАҚ ${S.hwQ + 1} / ${LD.hot.length}</b></div>
      <div style="font-size:48px;font-weight:900;line-height:1.2;margin:30px 0">${esc(q.q)}</div>
      <div id="ans" style="font-size:34px;font-weight:800;color:var(--ok);visibility:${S.key.hw ? 'visible' : 'hidden'}">✓ ${esc(q.a)}</div>
      <div style="margin-top:auto;display:flex;gap:12px"><button class="btn sec" id="ansB">🔑 Жауапты ашу</button><button class="btn" id="nextQ" ${S.hwQ >= LD.hot.length - 1 ? 'disabled' : ''}>Келесі сұрақ ▶</button></div></div></div>`; };

  R.groups = () => {
    if (!S.roster.length) return `<div class="card" style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center"><div style="font-size:90px">🧪</div><div style="font-size:34px;font-weight:900">Оқушылар тізімі әлі енгізілмеген</div><div class="mut" style="font-size:24px">⚙️ Баптау → «Тізім» бөліміне аты-жөнін деңгейімен (A/B/C) енгізіңіз</div><button class="btn" id="goSet">⚙️ Тізімді енгізу</button></div>`;
    return `<div style="display:grid;grid-template-columns:1fr 1fr 1fr 300px;gap:18px;height:100%">
      ${LD.groups.map((g, gi) => { const m = S.roster.filter((p) => p.g === gi); return `<div class="card" style="padding:18px 20px;border-top:10px solid ${g.c};background:${g.soft};overflow:hidden"><div style="font-size:20px;font-weight:900;color:${g.ink}">${g.icon} ${g.short}</div><div style="font-size:29px;font-weight:900;color:${g.ink};line-height:1.1;margin-bottom:8px">${esc(g.name)}</div>
        ${m.map((p, k) => `<div class="mem" style="display:flex;justify-content:space-between;gap:8px;background:#fff;border-radius:14px;padding:9px 12px;margin-top:8px;font-size:22px;font-weight:700;${S.grouped ? '' : 'opacity:0;transform:translateY(-30px) scale(.8)'};transition:.5s cubic-bezier(.2,.8,.2,1);transition-delay:${(k * 3 + gi) * 0.12}s"><span>${esc(p.name)}</span><span title="${p.role ? role(p.role).name : ''}">${p.role ? role(p.role).icon : ''}</span></div>`).join('')}</div>`; }).join('')}
      <div class="card" style="text-align:center;padding:16px;display:flex;flex-direction:column;align-items:center;gap:10px"><b style="font-size:22px">📱 Өз тобыңды тап</b><div class="qrbox" style="width:250px;height:250px">${GT.qr(link('quiz.html'), 250)}</div><div class="mut" style="font-size:17px">Сканерле → атыңды таңда → тобың мен рөлің шығады → телефонды шетке қой 📵</div>
        <button class="btn pink" id="doGroup" style="margin-top:auto;width:100%">🎲 ${S.grouped ? 'Қайта көрсету' : 'Топқа бөлу'}</button></div></div>`;
  };

  R.video = () => {
    if (SET.videoUrl) {
      const u = SET.videoUrl.trim(); const yt = u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
      const player = yt ? `<iframe src="https://www.youtube.com/embed/${yt[1]}?rel=0" style="width:100%;height:100%;border:0;border-radius:20px" allow="autoplay; fullscreen" allowfullscreen></iframe>` : `<video src="${esc(u)}" controls style="width:100%;height:100%;border-radius:20px;background:#000"></video>`;
      return `<div style="display:grid;grid-template-rows:auto 1fr auto;gap:12px;height:100%"><div class="card" style="padding:12px 18px;font-size:23px"><b style="color:#0B6E58">👀 КӨРГЕНДЕ ІЗДЕ:</b> ${LD.watch.map((q, i) => `<b style="color:#C2186E">${i + 1})</b> ${esc(q)}`).join(' &nbsp; ')}</div><div class="card" style="padding:10px">${player}</div><div class="card" style="padding:10px 18px"><button class="btn pink" id="vdisc">💬 Талқылау сұрақтары</button></div></div>`;
    }
    const st = Math.max(0, S.vStep);
    return `<div style="display:grid;grid-template-rows:auto 1fr auto;gap:12px;height:100%">
      <div class="card" style="padding:12px 18px;font-size:23px;display:flex;gap:18px;align-items:center"><b style="flex:none;color:#0B6E58">👀 КӨРГЕНДЕ ІЗДЕ:</b>${LD.watch.map((q, i) => `<span><b style="color:#C2186E">${i + 1})</b> ${esc(q)}</span>`).join('')}</div>
      <div class="card" id="vbox" style="padding:8px 18px;overflow:hidden">${S.vStep < 0 ? `<div style="height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px"><div style="font-size:120px">🎬</div><button class="btn" id="vplay2" style="font-size:30px;padding:18px 34px">▶ Бейнені бастау</button></div>` : GV.lanes(st)}</div>
      <div class="card" id="vctl" style="padding:12px 18px;display:flex;gap:14px;align-items:center"><button class="btn" id="vplay" style="padding:10px 20px">${S.vT ? '⏸' : '▶'}</button><button class="btn sec" id="vback" style="padding:10px 16px" title="Басынан">⟲</button><button class="btn sec" id="vzoom" style="padding:10px 16px" title="Үлкейту">⛶</button>
        <div style="flex:1"><div id="vcap" style="font-size:24px;font-weight:700;min-height:34px">${S.vStep < 0 ? 'Бейнеде: гаметогенездің 5 сатысы, екі жол' : esc(LD.captions[st])}</div><div style="display:flex;gap:6px;margin-top:6px">${LD.captions.map((_, i) => `<i class="vseg" style="flex:1;height:8px;border-radius:4px;background:${i <= S.vStep ? 'linear-gradient(90deg,#00B386,#E0398C)' : '#E1E7F0'}"></i>`).join('')}</div></div>
        <button class="btn pink" id="vdisc" style="padding:10px 18px" ${S.vStep >= 4 ? '' : 'disabled'}>💬 Талқылау</button></div></div>`;
  };

  const spWho = (x) => { const p = S.roster.find((r) => r.g === x.g && r.role === x.slot); return p ? p.name : (x.slot === 'sp1' ? '1-спикер' : '2-спикер'); };
  R.speak = () => {
    const sp = LD.speakers[S.spk], g = grp(sp.g);
    return `<div style="display:grid;grid-template-rows:auto 1fr auto;gap:12px;height:100%">
      <div style="display:flex;gap:8px">${LD.speakers.map((x, i) => `<button class="spt" data-i="${i}" style="flex:1;border:0;border-radius:16px;padding:9px 10px;font-family:inherit;font-weight:800;font-size:18px;cursor:pointer;text-align:left;color:${i === S.spk ? '#fff' : grp(x.g).ink};background:${i === S.spk ? grp(x.g).c : grp(x.g).soft};opacity:${S.spkDone[i] && i !== S.spk ? 0.55 : 1}">${S.spkDone[i] ? '✓' : i + 1}. ${esc(spWho(x))}<br><small style="font-weight:600">${esc(x.title)}</small></button>`).join('')}</div>
      <div class="card" style="padding:16px 22px;display:grid;grid-template-columns:1.15fr .85fr;gap:20px;border-top:8px solid ${g.c};min-height:0">
        <div class="zoomable" style="display:flex;align-items:center;min-height:0">${GV.render(sp.viz)}</div>
        <div style="display:flex;flex-direction:column;gap:10px;min-height:0"><div style="font-size:20px;font-weight:900;color:${g.ink}">🎤 ${esc(spWho(sp))} · ${g.short}</div><div style="font-size:33px;font-weight:900;line-height:1.1">${esc(sp.title)}</div>
          ${sp.pts.map((p, i) => `<div style="display:flex;gap:10px;font-size:22px;line-height:1.3"><b style="flex:none;width:32px;height:32px;border-radius:50%;background:${g.c};color:#fff;font-size:17px;display:flex;align-items:center;justify-content:center">${i + 1}</b>${esc(p)}</div>`).join('')}
          <div style="margin-top:auto;background:linear-gradient(90deg,#FFF6D9,#FFEFF7);border-radius:18px;padding:12px 16px;font-size:19px"><b style="font-size:25px;color:#9A7A1A">${esc(sp.sci.yr)} · ${esc(sp.sci.name)}</b><br>${esc(sp.sci.fact)}</div></div></div>
      <div class="card" style="padding:10px 16px;display:flex;gap:14px;align-items:center"><button class="btn sec" id="spPrev" ${S.spk ? '' : 'disabled'}>◀</button>
        <svg width="60" height="60" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="#E1E7F0" stroke-width="12"/><circle id="ring" cx="60" cy="60" r="50" fill="none" stroke="${g.c}" stroke-width="12" stroke-dasharray="314" stroke-dashoffset="0" transform="rotate(-90 60 60)" stroke-linecap="round"/></svg>
        <span id="mini" style="font-size:38px;font-weight:900;font-variant-numeric:tabular-nums;border-radius:12px;padding:0 10px">01:00</span><button class="btn" id="spGo">▶ 60 с</button>
        <span class="mut" style="flex:1;font-size:19px">Тыңдаушылар: №1 кластерге 1 ұғым + ғалым</span><button class="btn sec" id="sp3d">🧊 3D</button><button class="btn pink" id="spNext">${S.spk < 5 ? 'Келесі спикер ▶' : '✓ Аяқтау'}</button></div></div>`;
  };

  R.lab = () => `<div class="card" style="height:100%;padding:0;overflow:hidden;position:relative;background:#071C2B">
    <div class="lab3d" id="lab3d" style="border-radius:26px"></div>
    <div id="lwho" style="position:absolute;left:18px;top:16px;z-index:5;background:rgba(255,255,255,.95);border-radius:22px;padding:12px 20px;min-width:330px;box-shadow:0 10px 26px rgba(0,0,0,.3)"></div>
    <div id="ltask" style="position:absolute;left:50%;top:16px;transform:translateX(-50%);z-index:5;max-width:600px;text-align:center"></div>
    <div id="lstars" style="position:absolute;right:18px;top:16px;z-index:5;display:flex;flex-direction:column;gap:8px"></div>
    <div id="lres" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(.6);opacity:0;z-index:6;transition:.35s cubic-bezier(.2,.8,.2,1);pointer-events:none;text-align:center;background:rgba(255,255,255,.96);border-radius:28px;padding:22px 34px;max-width:720px;box-shadow:0 20px 50px rgba(0,0,0,.35)"></div>
    <div id="lconf" style="position:absolute;inset:0;pointer-events:none;z-index:7;overflow:hidden"></div>
    <div style="position:absolute;left:18px;right:18px;bottom:16px;z-index:5;display:flex;gap:12px;align-items:center">
      <button class="btn pink" id="lnext" style="font-size:24px">🎲 Келесі оқушы</button>
      <span id="mini" style="font-size:36px;font-weight:900;font-variant-numeric:tabular-nums;background:rgba(255,255,255,.95);border-radius:14px;padding:4px 14px">00:40</span>
      <button class="btn" id="lsaid" disabled style="font-size:22px">🗣 Қызметін айтты +1</button>
      <button class="btn sec" id="lskip" style="font-size:20px">⏭ Өткізу</button>
      <span style="flex:1"></span><button class="btn sec" id="lzin" style="font-size:24px;padding:10px 18px">＋</button><button class="btn sec" id="lzout" style="font-size:24px;padding:10px 18px">－</button></div></div>`;

  R.t3 = () => `<div class="card ${S.key.t3 ? 'showkey' : ''}" style="height:100%;display:flex;flex-direction:column;padding:20px 26px">
    <table class="t" style="font-size:27px"><thead><tr><th style="width:60px">№</th><th>Тұжырым</th><th style="width:220px">Д / Б</th></tr></thead><tbody>
    ${LD.detective.map((x, i) => `<tr><td><b>${i + 1}</b></td><td>${esc(x.s)}${x.fix ? `<div class="key" style="color:var(--bad);font-size:22px;font-weight:700">✎ ${esc(x.fix)}</div>` : ''}</td><td><span class="key" style="font-weight:900;color:${x.ok ? 'var(--ok)' : 'var(--bad)'}">${x.ok ? '✓ Дұрыс' : '✗ Бұрыс'}</span><span class="nokey mut">Д ☐ &nbsp; Б ☐</span></td></tr>`).join('')}</tbody></table>
    <div style="margin-top:auto;display:flex;gap:14px;align-items:center"><button class="btn" id="keyB">🔑 ${S.key.t3 ? 'Кілтті жасыру' : 'Жауап кілтін ашу'}</button><span class="mut" style="font-size:20px">Әділдік: өз жауабыңды кілтпен салыстыр, қатеңді мойында ✓</span></div></div>`;

  R.t4 = () => `<div class="card ${S.key.t4 ? 'showkey' : ''}" style="height:100%;display:flex;flex-direction:column;padding:20px 26px">
    <table class="t" style="font-size:26px"><thead><tr><th>Зерттеу сұрағы</th><th style="background:#2563EB">♂ Сперматогенез</th><th style="background:#E0398C">♀ Оогенез</th></tr></thead><tbody>
    ${LD.pairRows.map((r, i) => `<tr><td><b>${esc(r)}</b></td><td><span class="key">${esc(LD.pairKey[i][0])}</span><span class="nokey mut">…</span></td><td><span class="key">${esc(LD.pairKey[i][1])}</span><span class="nokey mut">…</span></td></tr>`).join('')}</tbody></table>
    <div style="margin-top:16px;font-size:26px;background:#EAF3FF;border-radius:18px;padding:14px 18px"><b style="color:#173B9A">❓ Қосымша сұрақ:</b> ${esc(LD.pairExtra)}</div>
    <div style="margin-top:auto"><button class="btn" id="keyB">🔑 ${S.key.t4 ? 'Үлгіні жасыру' : 'Үлгі жауапты ашу'}</button></div></div>`;

  R.t5 = () => `<div style="display:grid;grid-template-rows:1fr auto;gap:14px;height:100%">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">${LD.posters.map((p, i) => { const g = grp(p.g), on = S.gal === i; return `<div class="card" style="padding:18px 22px;border-top:10px solid ${g.c};background:${on ? '#fff' : g.soft};${on ? 'box-shadow:0 0 0 6px #F2994A,0 20px 40px rgba(0,0,0,.15);transform:scale(1.02)' : ''};transition:.3s">
      <div style="font-size:19px;font-weight:900;color:${g.ink}">${g.icon} ${g.short} · ${esc(g.name)}</div><div style="font-size:30px;font-weight:900;color:${g.ink};margin:6px 0 10px;line-height:1.1">${esc(p.name)}</div>
      <div style="font-size:24px;font-weight:700;line-height:1.3">${esc(p.q)}</div><div class="mut" style="font-size:19px;margin-top:10px;line-height:1.35">${esc(p.task)}</div>
      ${on ? '<div style="margin-top:12px;font-size:24px;font-weight:900;color:#C2186E">🎤 ҚАЗІР ҚОРҒАП ЖАТЫР</div>' : ''}</div>`; }).join('')}</div>
    <div class="card" style="padding:12px 18px;display:flex;gap:16px;align-items:center"><span id="mini" style="font-size:38px;font-weight:900;font-variant-numeric:tabular-nums;border-radius:12px;padding:0 10px">01:00</span>
      <button class="btn pink" id="galB">${S.gal < 0 ? '▶ Галерея қорғау (әр топқа 40 с)' : S.gal < 2 ? 'Келесі топ ▶' : '✓ Аяқтау'}</button><span style="font-size:21px">⭐⭐ + 💡 — басқа топтар «2 жұлдыз, 1 тілек» жапсырады</span></div></div>`;

  R.t6 = () => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;height:100%">
    <div class="card" style="background:linear-gradient(160deg,#063D3A,#0B5E58);color:#fff"><div style="font-size:26px;font-weight:900;color:var(--lm)">🏥 ӨМІРЛІК ЖАҒДАЯТ</div><div style="font-size:28px;line-height:1.45;margin-top:14px">${esc(LD.fs.text)}</div></div>
    <div class="card"><div style="font-size:24px;font-weight:900;color:#0B6E58">СҰРАҚТАР (№6 парақ)</div>${LD.fs.qs.map((q, i) => `<div style="display:flex;gap:12px;font-size:24px;line-height:1.3;margin-top:14px"><b style="flex:none;width:38px;height:38px;border-radius:50%;background:#E0398C;color:#fff;display:flex;align-items:center;justify-content:center;font-size:19px">${i + 1}</b>${esc(q)}</div>`).join('')}
      <div class="mut" style="font-size:19px;margin-top:16px">⏳ Уақыт жетпесе — үйге (A деңгейі)</div></div></div>`;

  R.quiz = () => `<div style="display:grid;grid-template-columns:480px 1fr;gap:22px;height:100%">
    <div class="card" style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px"><div class="qrbox" style="width:400px;height:400px">${GT.qr(link('quiz.html'), 400)}</div><div style="font-size:24px">Код: <b style="font-size:38px;letter-spacing:3px">${esc(S.code)}</b></div>
      <div style="display:flex;gap:10px"><button class="btn" id="qopen">▶ Ашу</button><button class="btn sec" id="qclose">⏹ Жабу</button></div></div>
    <div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:28px">📱 Нәтиже — тікелей</b><span id="qstat" class="chip">—</span></div><div id="qlive" style="margin-top:10px"></div></div></div>`;

  R.feedback = () => `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;height:100%" id="fbwrap"></div>`;

  R.end = () => `<div style="display:grid;grid-template-columns:1.1fr .9fr;gap:22px;height:100%">
    <div class="card" style="display:flex;flex-direction:column"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:30px">🏅 Рейтинг</b><button class="btn sec" id="fullR">Толық кесте</button></div><div id="podium" style="flex:1;display:flex;flex-direction:column"></div></div>
    <div class="card"><b style="font-size:30px">🏠 Деңгейлік үй тапсырмасы</b>${LD.homework.map((h) => `<div style="display:flex;gap:14px;margin-top:16px;font-size:22px;line-height:1.35;background:#F5F8FC;border-radius:18px;padding:14px"><b class="lv lv${h.lvl}" style="font-size:26px;height:fit-content">${h.lvl}</b><span>${esc(h.t)}</span></div>`).join('')}</div></div>`;

  /* ---------- көрсету ---------- */
  function show(i, opt) {
    opt = opt || {};
    const prev = S.i; S.i = Math.max(0, Math.min(ST.length - 1, i)); LS.set('gt_stage2', S.i);
    const s = cur();
    if (prev !== S.i) { stopV(); MT.run = false; if (window.LAB3D) window.LAB3D.stop(); L3 = null; }
    $('#num').textContent = S.i + 1; $('#title').textContent = s.title;
    const phone = LD.phoneAll.includes(s.id) ? '<span class="chip" style="background:#E0F7FF;color:#0B5E8C">📱 Телефон: бәріне</span>' : '<span class="chip">📵 Телефон жинаулы · тек 📒 хатшы</span>';
    const mode = { 'Жеке': '👤 Жеке', 'Жұп': '👥 Жұп', 'Топ': '🧪 Топ', 'Барлығы': '🙌 Барлығы' }[s.mode] || '';
    $('#method').innerHTML = `<span class="lab">ӘДІС</span><span class="nm">${esc(s.method.name)}</span><span class="es">${esc(s.method.essence)}</span><span class="chip">${mode}</span>${s.sheet ? `<span class="chip sh">📄 ${esc(s.sheet)}</span>` : ''}${phone}${s.k ? `<span class="chip k" id="kchip" title="Дескриптор — 📋">📒 ${s.k} · ${kMax(s.k)} балл</span>` : ''}`;
    $('#body').innerHTML = `${how(s)}<div class="task" id="task">${R[s.id]()}</div>`;
    $('#prog').innerHTML = ST.map((x, k) => `<i class="${k === S.i ? 'on' : k < S.i ? 'done' : ''}" data-k="${k}" title="${k + 1}. ${esc(x.title)} · ${x.min} мин">${x.ic}<small>${k + 1}</small></i>`).join('');
    if (!opt.keepTimer) tSet(s.min * 60, SET.autoTimer && !opt.noAuto);
    bind(s); live();
    if (!opt.quiet && (SET.guideAll || s.id === 'hello' || s.id === 'end')) guide(s.guide);
    if (S.db && prev !== S.i) setMeta(s.id === 'quiz' ? { quiz: true, stage: s.id } : { stage: s.id });
  }
  const redraw = () => { $('#task').innerHTML = R[cur().id](); bind(cur()); live(); };
  function bind(s) {
    const kc = $('#kchip'); if (kc) kc.onclick = () => openAssess('now');
    $$('.mood').forEach((b) => b.onclick = () => { const k = b.dataset.i; S.mood[k] = (S.mood[k] || 0) + 1; b.querySelector('[data-c]').textContent = S.mood[k]; GT.tone(600 + k * 120, 0.15); });
    $$('#task .zoomable').forEach((z) => z.onclick = () => zoom(z.innerHTML));
    if (s.id === 'hw') {
      $('#spin').onclick = () => { const names = S.roster.map((p) => p.name); if (!names.length) return banner('Тізім бос — ⚙️ баптауда енгізіңіз'); let n = 0; const iv = setInterval(() => { $('#pick').textContent = names[Math.floor(Math.random() * names.length)]; GT.tick(); if (++n > 18) { clearInterval(iv); S.hwPick = $('#pick').textContent; GT.chime(); } }, 90); };
      $('#ansB').onclick = () => { S.key.hw = 1; $('#ans').style.visibility = 'visible'; GT.chime(); };
      $('#nextQ').onclick = () => { S.hwQ = Math.min(LD.hot.length - 1, S.hwQ + 1); S.key.hw = 0; redraw(); };
    }
    if (s.id === 'groups') {
      const gs = $('#goSet'); if (gs) gs.onclick = () => openSet('list');
      const dg = $('#doGroup'); if (dg) dg.onclick = () => { if (S.grouped) { S.grouped = false; redraw(); setTimeout(() => { S.grouped = true; reveal(); }, 80); } else { S.grouped = true; reveal(); dg.textContent = '🎲 Қайта көрсету'; } };
    }
    if (s.id === 'video') {
      const play = () => { if (S.vT) { stopV(); return; } if (S.vStep >= 4) S.vStep = -1; S.vT = setInterval(stepV, 4200); stepV(); };
      ['#vplay', '#vplay2'].forEach((q) => { const b = $(q); if (b) b.onclick = play; });
      const vb = $('#vback'); if (vb) vb.onclick = () => { stopV(); S.vStep = -1; redraw(); };
      const vz = $('#vzoom'); if (vz) vz.onclick = () => { if (S.vStep >= 0) zoom(GV.lanes(S.vStep)); };
      const vd = $('#vdisc'); if (vd) vd.onclick = () => full(`<h2>💬 Талқылау</h2>${LD.brain.map((q, i) => `<div style="font-size:32px;margin-top:18px;line-height:1.3"><b style="color:#C2186E">${i + 1}.</b> ${esc(q)}</div>`).join('')}`);
    }
    if (s.id === 'speak') {
      const go = (i) => { S.spk = Math.max(0, Math.min(5, i)); MT.run = false; redraw(); };
      const timeUp = () => banner(S.spk < 5 ? '🎤 1 минут өтті — келесі спикер' : '🎤 1 минут өтті');
      $$('.spt').forEach((b) => b.onclick = () => go(+b.dataset.i));
      $('#spPrev').onclick = () => go(S.spk - 1);
      $('#spGo').onclick = () => miniStart(60, timeUp);
      $('#spNext').onclick = () => { S.spkDone[S.spk] = 1; if (S.spk < 5) { go(S.spk + 1); miniStart(60, timeUp); } else { MT.run = false; banner('✓ 6 спикер аяқталды · 📒 Хатшылар K2 ұпайын енгізсін', 5000); redraw(); } };
      $('#sp3d').onclick = open3d;
    }
    if (s.id === 'lab') bindLab();
    if (s.id === 't3' || s.id === 't4') $('#keyB').onclick = () => { S.key[s.id] = !S.key[s.id]; if (S.key[s.id]) GT.chime(); redraw(); };
    if (s.id === 't5') $('#galB').onclick = () => { if (S.gal >= 2) { S.gal = -1; MT.run = false; banner('✓ Галерея аяқталды · 📒 Хатшылар K5 ұпайын енгізсін', 5000); redraw(); return; } S.gal++; redraw(); miniStart(40, () => banner(`🖼️ ${grp(LD.posters[S.gal].g).short} уақыты бітті`)); };
    if (s.id === 'quiz') { $('#qopen').onclick = () => setMeta({ quiz: true }); $('#qclose').onclick = () => setMeta({ quiz: false }); }
    if (s.id === 'end') $('#fullR').onclick = openRate;
  }
  /* ---------- 3D жарыс ---------- */
  let L3 = null, labMod = null;
  function labQueue() {
    if (S.roster.length) { const byG = LD.groups.map((_, gi) => S.roster.filter((p) => p.g === gi).map((p) => [Math.random(), p]).sort((a, b) => a[0] - b[0]).map((x) => x[1])); const q = []; for (let r = 0; byG.some((a) => a[r]); r++) byG.forEach((a) => { if (a[r]) q.push({ name: a[r].name, g: a[r].g }); }); return q; }
    const q = []; for (let r = 0; r < 5; r++) LD.groups.forEach((g, gi) => q.push({ name: g.short + ' өкілі', g: gi, anon: true })); return q;
  }
  const labSave = () => { LS.set('gt_lab', S.labSc); LS.set('gt_labst', S.lab); };
  function labDraw() {
    const L = S.lab, st = L.state || 'idle', cq = L.cur;
    const nx = L.queue && L.queue[L.pos + 1];
    $('#lwho').innerHTML = cq ? `<div style="font-size:16px;font-weight:900;color:#4F6480;letter-spacing:1px">ТАҚТАДА</div><div id="lname" style="font-size:40px;font-weight:900;line-height:1.1;color:${grp(cq.g).ink}">${esc(cq.name)}</div><div style="font-size:19px;font-weight:800;color:${grp(cq.g).c}">${grp(cq.g).icon} ${grp(cq.g).short} · ${esc(grp(cq.g).name)}</div>${nx ? `<div class="mut" style="font-size:17px;margin-top:6px">Келесі: ${esc(nx.name)}</div>` : ''}`
      : `<div style="font-size:16px;font-weight:900;color:#4F6480;letter-spacing:1px">3D ЗЕРТХАНА</div><div id="lname" style="font-size:30px;font-weight:900">🎲 басыңыз</div><div class="mut" style="font-size:17px">${L.queue ? (L.queue.length - L.pos - 1) + ' оқушы кезекте' : (S.roster.length ? S.roster.length + ' оқушы' : 'Тізім жоқ — топ өкілдері')}</div>`;
    const q = L.q != null ? LD.lab3d[L.q] : null;
    $('#ltask').innerHTML = q && st !== 'idle' ? `<div style="background:linear-gradient(135deg,#00B386,#2563EB);color:#fff;border-radius:22px;padding:14px 26px;font-size:36px;font-weight:900;box-shadow:0 12px 30px rgba(0,0,0,.35)">🎯 ${esc(q.t)}</div><div style="color:#B6E31E;font-size:18px;font-weight:800;margin-top:6px">${q.m === 'sperm' ? '♂ Сперматозоид' : '♀ Жұмыртқа жасушасы'} · айналдыр, үлкейт, бас!</div>` : '';
    $('#lstars').innerHTML = LD.groups.map((g, i) => `<div style="background:${g.c};color:#fff;border-radius:16px;padding:8px 14px;font-weight:900;font-size:20px;display:flex;justify-content:space-between;gap:14px;min-width:160px">${g.icon} ${g.short}<span>⭐ ${L.stars[i] || 0}</span></div>`).join('');
    $('#lsaid').disabled = !(cq && !cq.anon && (st === 'ok' || st === 'bad' || st === 'timeout'));
  }
  const PARTN = { acrosome: 'Акросома', mito: 'Митохондриялар', polar: 'Полярлы денешік', zona: 'Жылтыр қабық', tail: 'Құйрық (талшық)', eggnuc: 'Жұмыртқа жасушасының ядросы', nucleus: 'Сперматозоид ядросы', cyto: 'Цитоплазма', head: 'Сперматозоидтың басы', corona: 'Сәулелі тәж' };
  function labResult(ok, q, txt) {
    const r = $('#lres'); r.innerHTML = `<div style="font-size:64px">${ok ? '✅' : txt ? '⏰' : '❌'}</div><div style="font-size:40px;font-weight:900;color:${ok ? '#0FA968' : '#D64545'}">${ok ? 'Дұрыс тапты!' : txt || 'Қате — дұрысы жарқырап тұр'}</div><div style="font-size:26px;margin-top:8px"><b>${esc(PARTN[q.part] || '')}</b> — ${esc(q.why)}</div><div style="font-size:22px;color:#4F6480;margin-top:10px">🗣 Енді қызметін өз сөзіңмен айт: «Бұл — …, оның қызметі — …»</div>`;
    r.style.opacity = 1; r.style.transform = 'translate(-50%,-50%) scale(1)'; clearTimeout(r._t); r._t = setTimeout(() => { r.style.opacity = 0; r.style.transform = 'translate(-50%,-50%) scale(.6)'; }, 4200);
  }
  function confetti() { const c = $('#lconf'); if (!c) return; const cols = ['#00B386', '#E0398C', '#2563EB', '#B6E31E', '#F2B705', '#7A3CFF']; c.innerHTML = [...Array(90)].map((_, i) => `<i style="position:absolute;left:${Math.random() * 100}%;top:-20px;width:${8 + Math.random() * 10}px;height:${10 + Math.random() * 14}px;background:${cols[i % 6]};border-radius:3px;transform:rotate(${Math.random() * 360}deg);transition:transform 2.2s cubic-bezier(.2,.6,.3,1),top 2.2s cubic-bezier(.2,.6,.3,1),opacity 2.2s;opacity:1"></i>`).join(''); requestAnimationFrame(() => requestAnimationFrame(() => $$('i', c).forEach((p) => { p.style.top = (60 + Math.random() * 50) + '%'; p.style.transform = `translateX(${(Math.random() - .5) * 300}px) rotate(${Math.random() * 900}deg)`; p.style.opacity = 0; }))); }
  function labPick(parts) {
    const L = S.lab; if (L.state !== 'ask' || !L3) return;
    const q = LD.lab3d[L.q], ok = labMod.judge(q.part, parts); MT.run = false;
    L.state = ok ? 'ok' : 'bad'; L3.highlight(q.part, ok ? 0x22ff88 : 0xffd400);
    if (ok) { L.stars[L.cur.g] = (L.stars[L.cur.g] || 0) + 1; GT.chime(); confetti(); if (!L.cur.anon) labScore(L.cur, 'K4_0', 1); }
    else { GT.tone(180, 0.35, 'sawtooth', 0.15); const box = $('#lab3d'); box.style.boxShadow = 'inset 0 0 0 10px #D64545'; setTimeout(() => box.style.boxShadow = '', 700); if (!L.cur.anon) labScore(L.cur, 'K4_0', 0); }
    labResult(ok, q); labSave(); labDraw(); live();
  }
  function labScore(p, dk, v) { const key = GT.nrm(p.name); const e = S.labSc[key] || { name: p.name, g: p.g, sc: {} }; e.sc[dk] = v; S.labSc[key] = e; LS.set('gt_lab', S.labSc); }
  function labNext() {
    const L = S.lab; if (!L.queue || L.pos >= L.queue.length - 1) { L.queue = labQueue(); L.pos = -1; }
    if (L3) L3.clear(); L.state = 'spin'; labDraw();
    const names = L.queue.map((x) => x.name); let n = 0;
    const iv = setInterval(() => { const el = $('#lname'); if (el) el.textContent = names[Math.floor(Math.random() * names.length)]; GT.tick(); if (++n > 16) { clearInterval(iv);
      L.pos++; L.cur = L.queue[L.pos]; L.turn = (L.turn || 0) + 1; L.q = (L.turn - 1) % LD.lab3d.length; L.state = 'ask';
      const q = LD.lab3d[L.q]; if (L3) L3.setModel(q.m); GT.melody(); labDraw(); labSave();
      miniStart(40, () => { if (S.lab.state === 'ask') { S.lab.state = 'timeout'; L3 && L3.highlight(q.part, 0xffd400); labResult(false, q, 'Уақыт бітті — міне, осы жерде'); labDraw(); } });
      const nm = $('#lname'); if (nm) { nm.style.transition = 'none'; nm.style.transform = 'scale(1.5)'; requestAnimationFrame(() => { nm.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)'; nm.style.transform = 'none'; }); }
    } }, 85);
  }
  function bindLab() {
    if (!S.lab.queue) { S.lab.queue = labQueue(); S.lab.pos = -1; }
    S.lab.state = S.lab.state === 'ask' ? 'idle' : (S.lab.state || 'idle'); if (S.lab.state === 'spin') S.lab.state = 'idle';
    labDraw();
    import('./lab3d.js').then((m) => { labMod = m; L3 = m.mount($('#lab3d'), { challenge: true, onPick: labPick }); const q = S.lab.q != null ? LD.lab3d[S.lab.q] : null; if (q) L3.setModel(q.m); }).catch((e) => { console.error(e); $('#lab3d').innerHTML = '<div class="l3cap">3D ашылмады: браузер WebGL-ді қолдамайды.</div>'; });
    $('#lnext').onclick = labNext;
    $('#lskip').onclick = () => { MT.run = false; S.lab.state = 'idle'; labNext(); };
    $('#lsaid').onclick = () => { const c = S.lab.cur; if (!c || c.anon) return; labScore(c, 'K4_1', 1); GT.chime(); $('#lsaid').disabled = true; banner('🗣 ' + c.name + ': +1 балл (K4)'); live(); };
    $('#lzin').onclick = () => L3 && L3.zoom(0.7); $('#lzout').onclick = () => L3 && L3.zoom(1.4);
  }
  function reveal() { requestAnimationFrame(() => requestAnimationFrame(() => $$('.mem').forEach((m) => { m.style.opacity = 1; m.style.transform = 'none'; }))); GT.melody(); }
  function stepV() {
    if (S.vStep >= 4) { stopV(); return; }
    S.vStep++; const box = $('#vbox'); if (!box) return;
    box.innerHTML = GV.lanes(S.vStep); $('#vcap').textContent = LD.captions[S.vStep];
    $$('.vseg').forEach((x, k) => x.style.background = k <= S.vStep ? 'linear-gradient(90deg,#00B386,#E0398C)' : '#E1E7F0');
    $('#vplay').textContent = S.vT ? '⏸' : '▶'; $('#vdisc').disabled = S.vStep < 4; GT.tone(520 + S.vStep * 90, 0.12);
    if (S.vStep >= 4) stopV();
  }
  function stopV() { clearInterval(S.vT); S.vT = null; const vp = $('#vplay'); if (vp) vp.textContent = '▶'; }

  /* ---------- live ---------- */
  function live() {
    const rows = rating(), tot = groupTotals(rows), g = S.game || {}, meta = g.meta || {};
    $('#ribbon').innerHTML = LD.groups.map((x, i) => `<span style="background:${x.c}" title="${esc(x.name)} — ұпай">${x.icon} ${x.short}<b>${tot[i]}</b></span>`).join('');
    const s = cur();
    if (s.id === 'quiz' && $('#qlive')) {
      const players = g.players || {}, ans = g.answers || {}, ids = Object.keys(players);
      $('#qstat').textContent = (meta.quiz ? '🟢 ашық' : '⚪ жабық') + ' · ' + ids.length + ' оқушы';
      const rs = ids.map((u) => { let c = 0, n = 0; LD.quiz.forEach((q, i) => { const a = ans[i] && ans[i][u]; if (a) { n++; if (GT.isRight(q, a.v)) c++; } }); return { name: players[u].name, g: players[u].g, c, n }; }).sort((a, b) => b.c - a.c || b.n - a.n);
      $('#qlive').innerHTML = rs.length ? rs.slice(0, 13).map((r, i) => `<div style="display:flex;gap:12px;align-items:center;font-size:23px;padding:6px 0"><b style="width:34px">${i + 1}</b><span style="width:330px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${grp(r.g).icon} ${esc(r.name)}</span><div class="bar"><i style="width:${r.n / 8 * 100}%"></i></div><b style="width:110px;text-align:right">✓ ${r.c}/8</b></div>`).join('') : '<div class="mut" style="font-size:24px;margin-top:20px">Оқушылар QR арқылы кіргенде осында шығады</div>';
    }
    if (s.id === 'feedback' && $('#fbwrap')) {
      const fb = g.feedback || {}, cnt = {}, notes = {}; Object.values(fb).forEach((f) => { if (f && f.k) { cnt[f.k] = (cnt[f.k] || 0) + 1; if (f.text) (notes[f.k] = notes[f.k] || []).push(f.name + ': ' + f.text); } });
      const all = Object.values(cnt).reduce((a, b) => a + b, 0) || 1, col = ['#F2994A', '#2563EB', '#00B386'];
      $('#fbwrap').innerHTML = LD.feedback.map((f, i) => `<div class="card" style="border-top:10px solid ${col[i]};display:flex;flex-direction:column;gap:10px;overflow:hidden"><div style="font-size:70px">${f.icon}</div><div style="font-size:28px;font-weight:900;color:${col[i]}">${esc(f.t)}</div><div class="mut" style="font-size:20px">${esc(f.d)}</div>
        <div style="display:flex;align-items:center;gap:12px"><div class="bar" style="height:22px"><i style="width:${(cnt[f.k] || 0) / all * 100}%"></i></div><b style="font-size:44px">${cnt[f.k] || 0}</b></div>
        <div style="font-size:18px;line-height:1.35">${(notes[f.k] || []).slice(-3).map((n) => `<div style="background:#F5F8FC;border-radius:10px;padding:6px 10px;margin-top:6px">💬 ${esc(n)}</div>`).join('')}</div></div>`).join('');
    }
    if (s.id === 'end' && $('#podium')) {
      const top = rows.filter((r) => r.total > 0).slice(0, 3), mx = Math.max(1, ...tot);
      const pod = [1, 0, 2].map((k, pos) => { const r = top[k]; const h = [230, 300, 180][pos]; return r ? `<div style="text-align:center;width:220px"><div style="font-size:24px;font-weight:900">${esc(r.name)}</div><div class="mut" style="font-size:18px">${grp(r.g).short} · ${r.total}/${LD.MAX} ұпай</div><div style="height:${h}px;margin-top:8px;border-radius:20px 20px 0 0;background:linear-gradient(180deg,${['#F2B705', '#B8C4D6', '#E39A5B'][k]},#fff);display:flex;align-items:flex-start;justify-content:center;padding-top:14px"><b style="font-size:54px">${r.b}</b></div></div>` : ''; }).join('');
      $('#podium').innerHTML = `<div style="display:flex;gap:16px;align-items:flex-end;justify-content:center;flex:1;padding-top:10px">${pod || '<div class="mut" style="font-size:24px;align-self:center">Хатшы мен квиз ұпайлары осында жиналады</div>'}</div>
        <div style="margin-top:14px">${LD.groups.map((x, i) => `<div style="display:flex;gap:12px;align-items:center;font-size:22px;margin-top:8px"><b style="width:280px;color:${x.ink}">${x.icon} ${esc(x.name)}</b><div class="bar" style="height:20px"><i style="width:${tot[i] / mx * 100}%;background:${x.c}"></i></div><b style="width:70px;text-align:right">${tot[i]}</b></div>`).join('')}</div>`;
    }
    const conn = S.db ? (S.db.demo ? '🟡 офлайн' : '🟢 ' + S.code) : '⏳ қосылуда';
    $('#sub').textContent = `${LD.lesson.subject} · ${LD.lesson.grade} · ${LD.lesson.topic} · ${conn}`;
    if (OV.kind === 'rate') renderRate();
  }
  function setMeta(o) { if (!S.db) return; S.db.update('games/' + S.code + '/meta', o).catch((e) => banner('⚠️ Байланыс: ' + (e.code || e.message), 5000)); }

  /* ---------- оверлейлер ---------- */
  const OV = { kind: '', tab: '' };
  const ov = $('#ov');
  function closeOV() { ov.classList.remove('on'); ov.innerHTML = ''; OV.kind = ''; if (window.LAB3D) window.LAB3D.stop(); }
  ov.onclick = (e) => { if (e.target === ov || e.target.classList.contains('x')) closeOV(); };
  function full(html, kind) { OV.kind = kind || 'full'; ov.innerHTML = `<div class="full"><button class="x">✕</button>${html}</div>`; ov.classList.add('on'); }
  function drawer(html, kind) { OV.kind = kind; ov.innerHTML = `<div class="drawer"><button class="x">✕</button>${html}</div>`; ov.classList.add('on'); }
  function zoom(html) { full(`<div style="height:100%;display:flex;align-items:center;justify-content:center">${html}</div>`); const sv = $('.full svg'); if (sv) { sv.style.width = '100%'; sv.style.height = '100%'; } }
  function open3d() { full('<div class="lab3d" id="lab3d"><div class="l3cap">⏳ 3D модель жүктелуде…</div></div>'); $('.full').style.padding = '0'; import('./lab3d.js').then((m) => m.mount($('#lab3d'))).catch(() => { $('#lab3d').innerHTML = '<div class="l3cap">3D ашылмады: браузер WebGL-ді қолдамайды.</div>'; }); }

  function openScript() {
    const s = cur();
    drawer(`<h2>💬 Мұғалім сөзі · ${S.i + 1}-экран</h2><div class="mut" style="font-size:19px">${esc(s.title)} · ${s.min} мин · әдіс: ${esc(s.method.name)}</div>
      <div style="background:#EAF8F3;border-radius:18px;padding:16px 18px;margin-top:14px;font-size:24px;line-height:1.45">${esc(s.T)}</div>
      <h3 style="margin:18px 0 6px">🧑‍🎓 Оқушылар не істейді</h3><div style="font-size:21px">${esc(s.S)}</div>
      <h3 style="margin:18px 0 6px">🗣 Оқушының сөйлеу үлгісі</h3>${(LD.say[s.id] || []).map((x) => `<div style="font-size:20px;margin-top:4px">• ${esc(x)}</div>`).join('')}
      ${s.k ? `<h3 style="margin:18px 0 6px">📒 Хатшыға</h3><div style="font-size:20px">Осы экраннан кейін хатшылар <b>${s.k}</b> ұпайын енгізеді (ең көбі ${kMax(s.k)} балл).</div>` : ''}
      <h3 style="margin:22px 0 8px">🗺 Сабақ жоспары</h3>${ST.map((x, k) => `<div class="pl" data-k="${k}" style="display:flex;gap:10px;padding:8px 10px;border-radius:12px;cursor:pointer;font-size:19px;${k === S.i ? 'background:#E3FFF5;font-weight:800' : ''}"><span style="width:34px">${x.ic}</span><span style="flex:1">${k + 1}. ${esc(x.title)}</span><span class="mut">${x.min} мин</span></div>`).join('')}`, 'script');
    $$('.pl').forEach((p) => p.onclick = () => { closeOV(); show(+p.dataset.k); });
  }
  function openAssess(tab) { OV.tab = tab || (OV.kind === 'assess' ? OV.tab : 'now'); drawer('', 'assess'); renderAssess(); }
  function descTable(t) { return `<table class="t" style="font-size:19px;margin-top:10px"><thead><tr><th>${t.k} · ${esc(t.kind)}: ${esc(t.title)}</th><th style="width:80px">Балл</th></tr></thead><tbody>${t.d.map((d) => `<tr><td>${esc(d.t)}</td><td style="text-align:center;font-weight:900">${d.p}</td></tr>`).join('')}</tbody></table>`; }
  function renderAssess() {
    const dr = $('.drawer'); if (!dr) return; const s = cur();
    let h = `<button class="x">✕</button><h2>📋 Бағалау</h2><div class="tabs">${[['now', 'Осы экран'], ['all', 'Барлық критерий'], ['res', 'Нәтижелер']].map(([k, t]) => `<button data-t="${k}" class="${OV.tab === k ? 'on' : ''}">${t}</button>`).join('')}</div>`;
    if (OV.tab === 'now') h += s.k ? `${descTable(task(s.k))}<div style="margin-top:14px;font-size:20px;background:#FFF1DA;border-radius:14px;padding:12px 16px">📒 Хатшы әр оқушыға телефоннан <b>${s.k}</b> бойынша балл қояды. Байланыс болмаса — «Нәтижелер» бөлімінде мұғалім өзі енгізеді.</div>` : `<div style="font-size:22px">Бұл экранда балл қойылмайды — ауызша мадақтау: «Жарайсың!», «Дәлелің нақты!»</div><div class="mut" style="font-size:19px;margin-top:8px"><b>Критерий:</b> ${esc(LD.lesson.criterion)}</div>`;
    if (OV.tab === 'all') h += `<div style="font-size:19px;margin-bottom:6px"><b>Критерий:</b> ${esc(LD.lesson.criterion)}</div>${LD.tasks.map(descTable).join('')}<div style="margin-top:14px;font-size:20px;background:#E9E3FF;border-radius:14px;padding:12px 16px">${esc(LD.ball.note)}</div>`;
    if (OV.tab === 'res') { const rows = rating(); h += `<div class="mut" style="font-size:17px;margin-bottom:8px">Сұр сан — хатшы балы. Ұяшыққа сан жазсаңыз — мұғалімнің түзетуі (басым). K7 — квизден автоматты.</div><table class="t" style="font-size:17px"><thead><tr><th style="padding:8px">Оқушы</th>${LD.tasks.map((t) => `<th style="padding:8px 4px;text-align:center">${t.k}<br><small>${kMax(t.k)}</small></th>`).join('')}<th style="padding:8px">Ұпай</th><th style="padding:8px">Балл</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td style="padding:6px 8px">${r.g != null ? grp(r.g).icon : ''} ${esc(r.name)}</td>${LD.tasks.map((t) => t.k === 'K7' ? `<td style="text-align:center;padding:4px">${r.byK.K7}</td>` : `<td style="padding:3px"><input data-key="${esc(r.key)}" data-k="${t.k}" value="${S.manual[r.key] && S.manual[r.key][t.k] != null ? S.manual[r.key][t.k] : ''}" placeholder="${r.byK[t.k]}" style="width:46px;font-size:18px;text-align:center;border:2px solid #DCEBEA;border-radius:8px;padding:4px"></td>`).join('')}<td style="padding:4px 8px"><b>${r.total}</b></td><td style="padding:4px 8px"><b>${r.b}</b></td></tr>`).join('') || '<tr><td colspan="10" class="mut">Тізім бос — ⚙️ баптауда енгізіңіз</td></tr>'}</tbody></table>
      <button class="btn sec" id="csv" style="margin-top:12px">⬇️ Excel (CSV)</button>`; }
    dr.innerHTML = h;
    $$('.tabs button', dr).forEach((b) => b.onclick = () => { OV.tab = b.dataset.t; renderAssess(); });
    $$('input[data-k]', dr).forEach((inp) => inp.onchange = () => { const k = inp.dataset.key; S.manual[k] = S.manual[k] || {}; S.manual[k][inp.dataset.k] = inp.value === '' ? null : Math.min(kMax(inp.dataset.k), Math.max(0, +inp.value)); LS.set('gt_manual', S.manual); live(); });
    const c = $('#csv'); if (c) c.onclick = csv;
  }
  function csv() { const rows = rating(); const lines = [['#', 'Оқушы', 'Топ', ...LD.tasks.map((t) => t.k), 'Ұпай', 'Балл', 'Деңгей'].join(';')].concat(rows.map((x, i) => [i + 1, x.name, x.g != null ? grp(x.g).name : '', ...LD.tasks.map((t) => x.byK[t.k]), x.total + '/' + LD.MAX, x.b, x.band].join(';'))); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })); a.download = 'gametogenez-reyting.csv'; a.click(); }
  function openRate() { full('', 'rate'); renderRate(); }
  function renderRate() {
    const f = $('.full'); if (!f) return; const rows = rating(), tot = groupTotals(rows), mx = Math.max(1, ...tot);
    f.innerHTML = `<button class="x">✕</button><h2>🏅 Рейтинг · ${S.i + 1}-экраннан кейін</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:10px 0 18px">${LD.groups.map((x, i) => `<div style="background:${x.soft};border-radius:20px;padding:14px 18px"><b style="color:${x.ink};font-size:22px">${x.icon} ${esc(x.name)}</b><div style="display:flex;align-items:center;gap:10px;margin-top:8px"><div class="bar" style="height:20px"><i style="width:${tot[i] / mx * 100}%;background:${x.c}"></i></div><b style="font-size:40px">${tot[i]}</b></div></div>`).join('')}</div>
      <table class="t" style="font-size:21px"><thead><tr><th>#</th><th>Оқушы</th>${LD.tasks.map((t) => `<th style="text-align:center">${t.k}</th>`).join('')}<th>Ұпай</th><th>Балл</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${i < 3 && r.total ? ['🥇', '🥈', '🥉'][i] : i + 1}</td><td>${r.g != null ? grp(r.g).icon : ''} ${esc(r.name)}</td>${LD.tasks.map((t) => `<td style="text-align:center">${r.byK[t.k] || '·'}</td>`).join('')}<td><b>${r.total}/${LD.MAX}</b></td><td><b style="font-size:26px">${r.b}</b> <span class="mut" style="font-size:16px">${r.band}</span></td></tr>`).join('') || '<tr><td colspan="11" class="mut">Әзірге ұпай жоқ</td></tr>'}</tbody></table>`;
  }
  function openSet(tab) { OV.tab = tab || 'list'; full('', 'set'); renderSet(); }
  function renderSet() {
    const f = $('.full'); if (!f) return; const tab = OV.tab;
    let h = `<button class="x">✕</button><h2>⚙️ Баптау</h2><div class="tabs">${[['list', '👥 Тізім және топтар'], ['links', '🔗 QR және сілтемелер'], ['opt', '🎛 Параметрлер']].map(([k, t]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${t}</button>`).join('')}<a class="btn sec" href="materialdar.html" target="_blank" style="text-decoration:none;font-size:19px;padding:10px 16px">📁 Материалдар</a></div>`;
    if (tab === 'list') h += `<div style="display:grid;grid-template-columns:.8fr 1.2fr;gap:24px;font-size:20px"><div><div class="mut" style="margin-bottom:8px">Әр жолға: <b>Аты-жөні - A/B/C</b> (A — озат, B — екпінді, C — қанағат). Тізім тек осы құрылғыда сақталады.</div><textarea id="rost" style="width:100%;height:420px;font-size:20px;border:2px solid #DCEBEA;border-radius:16px;padding:12px;font-family:inherit" placeholder="Әлиев Нұрсұлтан - A&#10;Серікова Аружан - B">${esc(S.roster.map((p) => p.name + ' - ' + p.l).join('\n'))}</textarea>
      <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap"><button class="btn" id="bal">⚖️ Тең топтарға бөлу</button><button class="btn sec" id="rebal">🔀 Араластыру</button></div></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;align-content:start">${LD.groups.map((g, gi) => { const m = S.roster.filter((p) => p.g === gi); return `<div style="border-radius:18px;padding:12px 14px;background:${g.soft};border:3px solid ${g.c}"><b style="color:${g.ink}">${g.icon} ${esc(g.name)}</b><div class="mut">${m.length} оқушы · Σ ${GT.groupSum(m)}</div>${m.map((p) => `<div style="display:flex;justify-content:space-between;margin-top:6px"><span>${esc(p.name)} <span class="lv lv${p.l}">${p.l}</span></span><span>${p.role ? role(p.role).icon : ''}</span></div>`).join('')}</div>`; }).join('')}</div></div>`;
    if (tab === 'links') h += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;text-align:center;font-size:19px">${[['quiz.html', '📱 Оқушылар: топ, квиз, кері байланыс'], ['hatshy.html', '📒 Хатшылар (әр топқа 1 телефон)']].map(([fl, t]) => `<div style="background:#F5F8FC;border-radius:20px;padding:16px"><b>${t}</b><div class="qrbox" style="width:260px;height:260px;margin:10px auto">${GT.qr(link(fl), 260)}</div><div class="mut" style="word-break:break-all;font-size:15px">${esc(link(fl))}</div></div>`).join('')}
      <div style="background:#F5F8FC;border-radius:20px;padding:16px"><b>Сабақ коды</b><div style="font-size:48px;font-weight:900;margin:10px 0">${esc(S.code)}</div><div class="mut">${S.db ? (S.db.demo ? 'Офлайн: телефондар қосылмайды — ұпайды 📋 «Нәтижелер»-ге енгізіңіз' : 'Firebase ✓ байланыс бар') : '…'}</div><button class="btn sec" id="newc" style="margin-top:12px">🆕 Жаңа сабақ (ұпайлар нөлденеді)</button></div></div>`;
    if (tab === 'opt') h += `<div style="font-size:22px;display:flex;flex-direction:column;gap:16px;max-width:1100px">
      <label><input type="checkbox" id="oAuto" ${SET.autoTimer ? 'checked' : ''}> Экранға өткенде таймер өздігінен қосылсын</label>
      <label><input type="checkbox" id="oGuide" ${SET.guideAll ? 'checked' : ''}> Гид әр экранда сөйлесін (әйтпесе тек басы мен соңында)</label>
      <label><input type="checkbox" id="oVoice" ${SET.voice ? 'checked' : ''}> Гид дауысы (${kk ? 'қазақ дауысы бар' : 'қазақ дауысы жоқ — тек жазу'})</label>
      <div><b>🎬 Өз бейнеңіз</b> (YouTube сілтемесі немесе .mp4). Бос қалса — сайттың анимациялық бейнесі көрсетіледі.<br><input type="text" id="oVideo" value="${esc(SET.videoUrl)}" placeholder="https://youtu.be/..." style="width:100%;font-size:20px;padding:12px;border-radius:12px;border:2px solid #DCEBEA;margin-top:8px"></div>
      <div class="mut" style="font-size:19px">Пернелер: ← → экран · Space таймер · M мұғалім сөзі · B бағалау · R рейтинг · T баптау · Esc жабу</div></div>`;
    f.innerHTML = h;
    $$('.tabs button', f).forEach((b) => b.onclick = () => { OV.tab = b.dataset.t; renderSet(); });
    if (tab === 'list') { const doBal = (sh) => { let list = GT.parseRoster($('#rost').value); if (!list.length) return banner('Тізім бос'); if (sh) list = list.map((p) => [Math.random(), p]).sort((a, b) => a[0] - b[0]).map((x) => x[1]); const out = []; GT.balance(list, LD.groups.length).forEach((m, gi) => GT.assignRoles(m).forEach((p) => out.push(Object.assign(p, { g: gi })))); S.roster = out; LS.set('gt_roster', out); S.grouped = false; pushRoster(); renderSet(); if (cur().id === 'groups' || cur().id === 'speak') redraw(); live(); }; $('#bal').onclick = () => doBal(false); $('#rebal').onclick = () => doBal(true); }
    if (tab === 'links') $('#newc').onclick = async () => { if (!confirm('Жаңа код жасалады, ағымдағы ұпайлар көрінбейді. Жалғастырасыз ба?')) return; LS.set('gt_code', ''); await connect(true); renderSet(); };
    if (tab === 'opt') { const sv = () => LS.set('gt_set', SET); $('#oAuto').onchange = (e) => { SET.autoTimer = e.target.checked; sv(); }; $('#oGuide').onchange = (e) => { SET.guideAll = e.target.checked; sv(); }; $('#oVoice').onchange = (e) => { SET.voice = e.target.checked; sv(); }; $('#oVideo').onchange = (e) => { SET.videoUrl = e.target.value.trim(); sv(); if (cur().id === 'video') redraw(); }; }
  }
  function pushRoster() { if (S.db && S.code) setMeta({ roster: S.roster.map((p) => ({ name: p.name, g: p.g, role: p.role || '' })) }); }

  /* ---------- Firebase ---------- */
  let unsub = null;
  async function connect(fresh) {
    if (!S.db) S.db = await GT.backend();
    const db = S.db; let code = fresh ? '' : LS.get('gt_code', '');
    for (let t = 0; t < 5; t++) {
      if (!code) code = GT.PREFIX + String(Math.floor(1000 + Math.random() * 9000));
      let meta = null; try { meta = await db.get('games/' + code + '/meta'); } catch (e) {}
      if (!meta) { try { await db.update('games/' + code + '/meta', { host: db.uid, created: db.TS, lesson: 'gametogenez-11' }); break; } catch (e) { code = ''; continue; } }
      if (meta.host === db.uid) break; code = '';
    }
    S.code = code; LS.set('gt_code', code);
    if (unsub) unsub(); unsub = db.on('games/' + code, (v) => { S.game = v || {}; live(); });
    pushRoster(); setMeta({ stage: cur().id });
    if (['groups', 'quiz'].includes(cur().id)) redraw(); /* QR кодқа сабақ коды керек */
  }

  /* ---------- басқару ---------- */
  $('#bn').onclick = () => show(S.i + 1); $('#bp').onclick = () => show(S.i - 1);
  $('#prog').onclick = (e) => { const i = e.target.closest('i'); if (i) show(+i.dataset.k); };
  $('#bScript').onclick = openScript; $('#bAssess').onclick = () => openAssess(); $('#bRate').onclick = openRate; $('#bSet').onclick = () => openSet(); $('#bMat').onclick = () => window.open('materialdar.html', '_blank');
  addEventListener('keydown', (e) => {
    if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') return closeOV();
    if (OV.kind) { if (['m', 'b', 'r', 't', 'ь', 'и', 'к', 'е'].includes(k)) closeOV(); return; }
    if (k === 'arrowright' || k === 'pagedown') show(S.i + 1); else if (k === 'arrowleft' || k === 'pageup') show(S.i - 1);
    else if (k === ' ') { e.preventDefault(); tToggle(); } else if (k === 'm' || k === 'ь') openScript(); else if (k === 'b' || k === 'и') openAssess(); else if (k === 'r' || k === 'к') openRate(); else if (k === 't' || k === 'е') openSet();
  });
  const route = () => { const m = location.hash.match(/^#s(\d+)/); if (m) show(+m[1] - 1); if (location.hash === '#teacher') openSet(); };
  addEventListener('hashchange', route);
  show(S.i, { noAuto: true }); route();
  connect().catch((e) => { console.error(e); });
  window.GTAPP = { S, show, openRate, openAssess, openSet, openScript, rating };
})();
