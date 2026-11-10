/* Тақта: кезеңдер, таймер, гид, спикерлер, квиз басқару, рейтинг, мұғалім панелі */
(function () {
  const LD = window.LD, GT = window.GT, GV = window.GV;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = GT.esc;
  const ST = LD.stages;
  const S = { i: 0, code: '', db: null, game: {}, roster: [], spk: -1, spkDone: {}, mood: {}, videoStep: 0 };
  const LS = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  S.roster = LS.get('gt_roster', []);
  S.i = Math.min(ST.length - 1, Math.max(0, LS.get('gt_stage', 0)));

  /* ---------- сахна өлшемі ---------- */
  function fit() { const k = Math.min(innerWidth / 1920, innerHeight / 1080); $('#stage').style.transform = `scale(${k})`; }
  addEventListener('resize', fit); fit();

  /* ---------- таймер ---------- */
  const T = { total: 60, left: 60, run: false, end: 0, sig60: false, lastTick: -1 };
  const fmt = (s) => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  function tSet(sec) { T.total = sec; T.left = sec; T.run = false; T.sig60 = sec <= 60; T.lastTick = -1; $('#count').classList.remove('on'); tDraw(); }
  function tDraw() { $('#tval').textContent = fmt(T.left); $('#tplay').textContent = T.run ? '⏸' : '▶'; $('#timer').classList.toggle('low', T.left <= 60 && T.total > 0); }
  function banner(t, ms) { const b = $('#banner'); b.textContent = t; b.classList.add('on'); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('on'), ms || 3500); }
  $('#tplay').onclick = () => { if (T.left <= 0) return; T.run = !T.run; if (T.run) T.end = Date.now() + T.left * 1000; GT.tone(1, 0.01); tDraw(); };
  $('#treset').onclick = () => tSet(T.total);
  $('#tplus').onclick = () => { T.left += 60; T.total = Math.max(T.total, T.left); if (T.run) T.end += 60000; if (T.left > 60) T.sig60 = false; tDraw(); };
  $('#tbell').onclick = () => GT.bell();
  setInterval(() => {
    if (T.run) {
      T.left = (T.end - Date.now()) / 1000;
      if (!T.sig60 && T.left <= 60) { T.sig60 = true; GT.chime(); banner('⏰ 1 минут қалды!'); }
      const s = Math.ceil(T.left);
      if (s <= 10 && s > 0 && s !== T.lastTick) { T.lastTick = s; GT.tick(); const c = $('#count'); c.classList.add('on'); $('#cnum').textContent = s; const sp = $('#cnum'); sp.style.animation = 'none'; void sp.offsetWidth; sp.style.animation = ''; }
      if (T.left <= 0) { T.left = 0; T.run = false; $('#count').classList.remove('on'); GT.melody(); banner('🎵 Уақыт бітті!', 4000); }
      tDraw();
    }
    spkTick();
  }, 200);

  /* ---------- гид ---------- */
  let gT = null, kkVoice = null;
  function loadVoices() { try { kkVoice = (speechSynthesis.getVoices() || []).find((v) => /^kk/i.test(v.lang)) || null; } catch (e) {} }
  try { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {}
  function guide(text) {
    const g = $('#guide'); $('#gtext').textContent = text; g.classList.remove('hide'); g.classList.add('talk');
    clearTimeout(gT); clearTimeout(g._t);
    const talk = Math.min(6500, 900 + text.length * 45); g._t = setTimeout(() => g.classList.remove('talk'), talk);
    gT = setTimeout(() => { g.classList.add('hide'); g.classList.remove('talk'); }, 7000);
    if (kkVoice && LS.get('gt_voice', true)) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.voice = kkVoice; u.lang = kkVoice.lang; speechSynthesis.speak(u); } catch (e) {} }
  }
  $('#gmed').onclick = () => guide(ST[S.i].guide);

  /* ---------- зум ---------- */
  function zoom(html) { $('#zin').innerHTML = html; $('#zoomlay').classList.add('on'); }
  $('#zoomlay').onclick = () => $('#zoomlay').classList.remove('on');
  document.addEventListener('click', (e) => { const z = e.target.closest('.zoomable'); if (z) zoom(z.innerHTML); });

  /* ---------- көмекшілер ---------- */
  const grp = (i) => LD.groups[i] || LD.groups[0];
  const roleOf = (k) => LD.roles.find((r) => r.key === k);
  const task = (k) => LD.tasks.find((t) => t.k === k);
  function desc(k, compact) {
    const t = task(k); if (!t) return '';
    return `<div class="card" style="padding:12px 16px"><div style="font-size:20px;font-weight:900;color:var(--acc);margin-bottom:6px">📋 ${t.k} · Дескриптор</div>
      <table class="as cmp" style="font-size:18px"><tbody>${t.d.map((x) => `<tr><td>${esc(x.t)}</td><td class="p">${x.p} б.</td></tr>`).join('')}
      <tr><td style="font-weight:900">Барлығы</td><td class="p">${t.d.reduce((a, x) => a + x.p, 0)} б.</td></tr></tbody></table></div>`;
  }
  const head = (s) => `<h1 class="st"><span class="ic">${s.ic || '🧬'}</span><span class="tx">${esc(s.title)}</span></h1><div class="method">🧭 Әдіс: <em>${esc(s.method)}</em><span class="where">· ${esc(s.where)} · ${s.min ? s.min + ' мин' : 'қосымша'}</span></div>`;
  function membersOf(g) { return S.roster.filter((p) => p.g === g); }
  function speakerName(sp) { const p = S.roster.find((x) => x.g === sp.g && x.role === sp.slot); return p ? p.name : (sp.slot === 'sp1' ? '1-спикер' : '2-спикер') + ' · ' + grp(sp.g).short; }
  const link = (f) => GT.base() + f + '?c=' + S.code + (S.db && S.db.demo ? '&demo=1' : '');

  /* ---------- кезеңдер ---------- */
  const R = {};
  R.hello = (s) => `${head(s)}<div class="grid2" style="grid-template-columns:1.05fr .95fr">
    <div class="card big"><div style="font-size:24px;color:var(--mut);font-weight:700">${esc(LD.lesson.subject)} · ${esc(LD.lesson.grade)} · ${esc(LD.lesson.section)}</div>
      <div style="font-size:40px;font-weight:900;margin:8px 0 16px;line-height:1.15">${esc(LD.lesson.topic)}</div>
      <div><b>Педагог:</b> ${esc(LD.lesson.teacher)}</div><div><b>Мектеп:</b> ${esc(LD.lesson.school)}, ${esc(LD.lesson.place)}</div>
      <div style="margin-top:16px;background:#FFF8E6;border:2px solid #F3DFA2;border-radius:18px;padding:14px 18px;font-size:24px"><b>${esc(LD.lesson.value)}</b><br>Аптаның дәйексөзі: <i>${esc(LD.lesson.quote)}</i></div></div>
    <div class="card"><div style="font-size:30px;font-weight:900">Менің көңіл-күйім</div><div class="mut" style="font-size:21px;margin-bottom:12px">Эмодзиді басыңдар</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px" id="moods">${['🤩|Шабыттымын', '🙂|Жақсы', '🤔|Ойланып тұрмын', '😴|Шаршадым'].map((m, i) => { const [e, t] = m.split('|'); return `<button class="btn sec mood" data-i="${i}" style="font-size:22px;padding:12px 6px"><span style="font-size:56px;display:block">${e}</span>${t}<br><b data-c="${i}">${S.mood[i] || 0}</b></button>`; }).join('')}</div>
      <div style="margin-top:20px;font-size:30px;font-weight:900">«Нағыз биолог қандай қасиеттерге ие болуы керек?»</div>
      <div class="mut" style="font-size:23px;margin-top:6px">Әр оқушы бір ғылыми ұстаным айтады: «Мен ғылыми дәлелге сүйенемін», «Мен өзгенің пікірін құрметтеймін»…</div></div></div>`;
  R.hw = (s) => `${head(s)}<div class="grid2" style="grid-template-columns:1.25fr .75fr">
    <div class="grid2" style="gap:18px">${LD.hot.map((h, i) => `<div class="card hq" data-i="${i}" style="cursor:pointer"><div style="font-size:22px;color:var(--acc);font-weight:900">🔥 ${i + 1}-сұрақ</div><div style="font-size:30px;font-weight:800;margin:6px 0">${esc(h.q)}</div><div class="ans" style="font-size:25px;color:var(--ok);font-weight:800;visibility:hidden">✓ ${esc(h.a)}</div></div>`).join('')}</div>
    <div><div class="card" style="text-align:center;margin-bottom:18px"><div style="font-size:120px;line-height:1">🪑</div><div style="font-size:26px;font-weight:800">«Ыстық орындық»</div><div class="mut" style="font-size:21px">Сұрақты басса — жауабы ашылады</div></div>${desc('K1')}</div></div>`;
  R.groups = (s) => {
    const has = S.roster.length > 0;
    return `${head(s)}<div style="display:grid;grid-template-columns:1fr 1fr 1fr 300px;gap:20px">
    ${LD.groups.map((g, gi) => { const m = membersOf(gi); return `<div class="gbox" style="border-color:${g.c};background:${g.soft}"><div style="font-size:21px;font-weight:800;color:${g.ink}">${g.icon} ${g.short}${has ? ' · Σ ' + GT.groupSum(m) : ''}</div><div style="font-size:30px;font-weight:900;color:${g.ink}">${esc(g.name)}</div>
      <ul style="font-size:23px">${has ? m.map((p) => `<li><span>${esc(p.name)}</span><span>${p.role ? roleOf(p.role).icon + ' ' + roleOf(p.role).name : ''}</span></li>`).join('') : '<li class="mut">Тізім мұғалім панелінде енгізіледі (⚙️)</li>'}</ul></div>`; }).join('')}
    <div class="card" style="text-align:center;padding:16px"><div style="font-size:21px;font-weight:900">📒 Тек хатшыларға</div><div class="qrbox" style="width:240px;height:240px;margin:10px auto">${GT.qr(link('hatshy.html'), 240)}</div><div class="mut" style="font-size:17px">Әр топқа бір телефон: ұпайды осы жерге енгізеді</div></div></div>
    <div class="card" style="margin-top:18px;font-size:23px;display:flex;gap:30px;flex-wrap:wrap">${LD.roles.map((r) => `<span>${r.icon} <b>${r.name}</b> <span class="mut">(${r.need === 'not A' ? 'озат емес' : r.need === 'A' ? 'озат' : 'екпінді'})</span></span>`).join('')}<span class="mut">Деңгейлер тең: топ сомалары ±1</span></div>`;
  };
  R.goal = (s) => `${head(s)}<div class="grid2" style="grid-template-columns:.8fr 1.2fr">
    <div><div class="card big" style="margin-bottom:18px"><div style="font-size:22px;color:var(--mut);font-weight:800">ОҚУ МАҚСАТЫ</div>${esc(LD.lesson.objective)}<div style="font-size:22px;color:var(--mut);font-weight:800;margin-top:14px">САБАҚ МАҚСАТЫ</div><div style="font-size:26px">${esc(LD.lesson.goal)}</div></div>
      <div class="card" style="font-size:24px"><div style="font-size:22px;color:var(--mut);font-weight:800">БАҒАЛАУ КРИТЕРИЙІ</div>${esc(LD.lesson.criterion)}<div style="margin-top:12px;background:#F1ECFF;border-radius:14px;padding:12px 16px;font-weight:700">${esc(LD.ball.note)}</div></div></div>
    <div class="card" style="padding:12px"><table class="as cmp" style="font-size:16.5px"><thead><tr><th>К</th><th>Тапсырма → дескриптор</th><th>Балл</th></tr></thead><tbody>
      ${LD.tasks.map((t) => t.d.map((x, i) => `<tr>${i ? '' : `<td class="k" rowspan="${t.d.length}">${t.k}</td>`}<td>${i ? '' : `<b>${esc(t.kind)}: ${esc(t.title)}</b> · `}${esc(x.t)}</td><td class="p">${x.p}</td></tr>`).join('')).join('')}
      <tr><td></td><td style="font-weight:900">Барлығы</td><td class="p">${LD.MAX}</td></tr></tbody></table></div></div>`;
  R.video = (s) => `${head(s)}<div style="display:grid;grid-template-columns:1.45fr .55fr;gap:22px;height:720px">
    <div class="card" style="padding:12px;position:relative"><div id="lanes" class="zoomable" style="height:600px">${GV.lanes(S.videoStep)}</div>
      <div style="display:flex;gap:10px;justify-content:center"><button class="btn sec" id="vprev">◀ Қадам</button><button class="btn" id="vplay">▶ Анимация</button><button class="btn sec" id="vnext">Қадам ▶</button><span class="mut" style="align-self:center;font-size:19px">🔍 Сызбаны басса — үлкейеді</span></div></div>
    <div class="card" style="font-size:22px;overflow:auto"><div style="font-size:24px;font-weight:900;margin-bottom:8px">🧠 Миға шабуыл · 5.1-сурет</div>
      ${LD.brain.map((q, i) => `<div class="bq" style="padding:10px 0;border-top:1px solid var(--line);opacity:${i ? 0.25 : 1};cursor:pointer" data-i="${i}"><b>${i + 1}.</b> ${esc(q)}</div>`).join('')}
      <div class="mut" style="font-size:18px;margin-top:8px">Сұрақты басса — келесісі ашылады</div></div></div>`;
  R.lab3d = (s) => `<div class="lab3d" id="lab3d"><div class="l3cap">⏳ 3D модель жүктелуде…</div></div>`;
  R.speak = (s) => {
    if (S.spk < 0) return `${head(s)}<div class="spk">${LD.speakers.map((sp, i) => { const g = grp(sp.g); return `<button class="spb ${S.spkDone[i] ? 'done' : ''}" data-i="${i}" style="background:linear-gradient(135deg,${g.c},${g.ink})"><small>${g.icon} ${g.short} · ${esc(g.name)}</small><b>🎤 ${esc(speakerName(sp))}</b><small style="font-size:22px;margin-top:8px">${i + 1}. ${esc(sp.title)}</small><small>👨‍🔬 ${esc(sp.sci.name)} · ${esc(sp.sci.yr)}</small>${S.spkDone[i] ? '<small>✓ түсіндірді</small>' : ''}</button>`; }).join('')}</div>
      <div class="grid2" style="margin-top:20px;grid-template-columns:1fr .8fr"><div class="card" style="font-size:23px"><b>Тыңдаушыларға (2-парақ, кластер):</b> әр спикердің бөлімінен 1 негізгі ұғым + ғалымның аты. Спикер — 60 секунд.</div>${desc('K2')}</div>`;
    const sp = LD.speakers[S.spk], g = grp(sp.g);
    return `<div id="now"><span>🎤 Қазір түсіндіріп жатыр: <b>${esc(speakerName(sp))}</b> · ${esc(g.short)} · ${esc(sp.title)} · ${esc(sp.sci.name)}</span><span class="t60" id="t60">01:00</span><button class="btn sec" id="spback" style="padding:8px 16px;font-size:20px">✓ Аяқталды</button></div>
      <div class="info" style="--gc:${g.c}"><div class="card zoomable" style="padding:14px;height:560px;display:flex;align-items:center">${GV.render(sp.viz)}</div>
      <div><div class="card" style="padding:18px 24px;border-color:${g.c}"><div style="font-size:34px;font-weight:900;color:${g.ink};margin-bottom:6px">${S.spk + 1}. ${esc(sp.title)}</div><ul>${sp.pts.map((p, i) => `<li data-n="${i + 1}">${esc(p)}</li>`).join('')}</ul></div>
      <div class="sci"><svg width="92" height="92" viewBox="0 0 92 92"><circle cx="46" cy="46" r="44" fill="#E2B84B"/><circle cx="46" cy="46" r="37" fill="#F4ECDA"/><circle cx="46" cy="38" r="13" fill="#C9A27A"/><path d="M22 76 q24 -26 48 0" fill="#3A3A48"/><text x="46" y="88" font-size="11" text-anchor="middle" font-weight="900" fill="#5B430C">${esc(sp.sci.yr)}</text></svg>
        <div><div class="yr">${esc(sp.sci.yr)} · ${esc(sp.sci.name)}</div><div style="font-size:23px">${esc(sp.sci.fact)}</div></div></div></div></div>`;
  };
  R.t3 = (s) => `${head(s)}<div class="grid2" style="grid-template-columns:1.3fr .7fr"><div class="card" style="padding:14px 20px">
    <table class="as" style="font-size:24px"><thead><tr><th>№</th><th>Тұжырым</th><th style="width:210px">Дұрыс/Бұрыс</th></tr></thead><tbody>
    ${LD.detective.map((x, i) => `<tr><td class="k">${i + 1}</td><td>${esc(x.s)}<div class="key" style="display:none;color:var(--bad);font-weight:700;font-size:21px">${x.fix ? '✎ ' + esc(x.fix) : ''}</div></td><td><span class="key" style="display:none;font-weight:900;color:${x.ok ? 'var(--ok)' : 'var(--bad)'}">${x.ok ? '✓ Дұрыс' : '✗ Бұрыс'}</span><span class="nokey mut">______</span></td></tr>`).join('')}</tbody></table>
    <div style="display:flex;gap:12px;margin-top:12px"><button class="btn" id="keyb">🔑 Жауап кілтін ашу</button><span class="mut" style="font-size:20px;align-self:center">Әділдік: өз жауабыңды кілтпен салыстырып, қатеңді мойында.</span></div></div>
    <div>${desc('K3')}<div class="card" style="margin-top:16px;font-size:21px;background:#FFF8E6;border-color:#F3DFA2">♿ <b>ЕБҚ оқушыға:</b> «${esc(LD.sen.title)}» — жеке парақ (10 балл), мұғалім көмегімен.</div></div></div>`;
  R.t4 = (s) => `${head(s)}<div class="grid2" style="grid-template-columns:1.3fr .7fr"><div class="card" style="padding:14px 20px">
    <table class="as" style="font-size:23px"><thead><tr><th>Зерттеу сұрағы</th><th style="background:#2F7FD8">♂ Сперматогенез</th><th style="background:#C2457F">♀ Оогенез</th></tr></thead><tbody>
    ${LD.pairRows.map((r, i) => `<tr><td><b>${esc(r)}</b></td><td><span class="key" style="display:none">${esc(LD.pairKey[i][0])}</span><span class="nokey mut">…</span></td><td><span class="key" style="display:none">${esc(LD.pairKey[i][1])}</span><span class="nokey mut">…</span></td></tr>`).join('')}</tbody></table>
    <div style="margin-top:14px;font-size:25px"><b>❓ Қосымша сұрақ:</b> ${esc(LD.pairExtra)}</div><button class="btn" id="keyb" style="margin-top:12px">🔑 Үлгі жауапты ашу</button></div>
    <div><div class="card" style="font-size:23px;margin-bottom:16px">👥 Бірі — сперматогенез, екіншісі — оогенез. Ақпарат алмасып, кестені бірге толтырады.</div>${desc('K4')}</div></div>`;
  R.t5 = (s) => `${head(s)}<div class="grid3">${LD.posters.map((p, i) => { const g = grp(p.g); return `<div class="gbox gal" data-i="${i}" style="border-color:${g.c};background:${g.soft};font-size:19px;padding:12px 16px"><div style="font-weight:900;color:${g.ink};font-size:18px">${g.icon} ${g.short} · ${esc(g.name)}</div><div style="font-size:26px;font-weight:900;color:${g.ink}">${esc(p.name)}</div>
      <div style="margin:6px 0"><b>Сұрақ:</b> ${esc(p.q)}</div><div class="mut">${esc(p.task)}</div><div style="margin-top:8px">${p.nums.map((n) => `<span class="pill" style="background:#fff;margin:3px 4px 0 0;font-size:16px">🔢 ${esc(n)}</span>`).join('')}</div></div>`; }).join('')}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr .9fr;gap:18px;margin-top:14px"><div class="card" style="font-size:18px;padding:14px 18px"><b>🖼️ Постер жоспары (5 мин):</b><ol style="margin:6px 0 0;padding-left:26px">${LD.posterSteps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>
      <div class="card" style="font-size:18px;padding:14px 18px"><b>🎤 Қорғау үлгісі:</b> <i>${esc(LD.speech)}</i><div style="margin-top:10px"><b>⭐⭐ + 💡</b> Басқа топтар «2 жұлдыз, 1 тілек» стикерін жапсырады.</div><button class="btn" id="galb" style="margin-top:8px;font-size:19px;padding:10px 16px">▶ Галерея қорғау (әр топқа 1 мин)</button></div>${desc('K5')}</div>`;
  R.t6 = (s) => `${head(s)}<div class="grid2" style="grid-template-columns:1.25fr .75fr"><div class="card"><div style="font-size:24px;font-weight:900;color:var(--acc2)">🏥 Өмірлік жағдаят</div><div style="font-size:26px;line-height:1.4;margin:8px 0 14px">${esc(LD.fs.text)}</div>
      <ol style="font-size:23px;line-height:1.45;margin:0;padding-left:30px">${LD.fs.qs.map((q) => `<li>${esc(q)}</li>`).join('')}</ol></div>
    <div>${desc('K6')}<div class="card" style="margin-top:16px;font-size:22px;background:#FFF1DD;border-color:#F6CF9A">⏳ <b>Уақыт жетпесе:</b> бұл тапсырма үйге беріледі (A деңгейі).</div></div></div>`;
  R.quiz = (s) => `${head(s)}<div style="display:grid;grid-template-columns:520px 1fr;gap:24px">
    <div class="card" style="text-align:center"><div class="qrbox" style="width:360px;height:360px">${GT.qr(link('quiz.html'), 360)}</div>
      <div style="font-size:26px;margin-top:10px">Код: <b style="font-size:40px;letter-spacing:3px">${esc(S.code)}</b></div><div class="mut" style="font-size:16px;word-break:break-all">${esc(link('quiz.html'))}</div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:12px"><button class="btn ok" id="qopen">▶ Квизді ашу</button><button class="btn sec" id="qclose">⏹ Жабу</button></div></div>
    <div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:28px;font-weight:900">📱 Тікелей нәтиже</div><div id="qstat" class="pill" style="background:#EEF1F8;font-size:22px">—</div></div><div id="qlive" style="margin-top:10px"></div>
      <div class="mut" style="font-size:19px;margin-top:10px">8 сұрақ · әрқайсысына ${LD.quizTime} с · әр 2 дұрыс жауап = 1 балл (K7, ең көбі 4)</div></div></div>`;
  R.end = (s) => `${head(s)}<div style="display:grid;grid-template-columns:1.15fr .85fr .9fr;gap:20px">
    <div class="card" style="padding:16px 20px"><div style="display:flex;justify-content:space-between"><b style="font-size:26px">🏅 Рейтинг · 10 балл</b><button class="btn sec" id="fullr" style="padding:8px 14px;font-size:18px">Толық кесте</button></div><div id="rtop" style="margin-top:8px"></div></div>
    <div class="card"><b style="font-size:26px">💬 Гаметогенезді түсіну деңгейім</b><div id="fb" style="margin-top:8px"></div><div class="mut" style="font-size:18px;margin-top:6px">Оқушылар телефонда квизден кейін таңдайды</div></div>
    <div class="card" style="font-size:21px"><b style="font-size:26px">🏠 Деңгейлік үй тапсырмасы</b>${LD.homework.map((h) => `<div style="margin-top:10px;padding:10px 12px;border-radius:14px;background:#F5F7FB"><span class="lv lv${h.lvl}">${h.lvl}</span> ${esc(h.t)}</div>`).join('')}</div></div>`;

  /* ---------- көрсету ---------- */
  function show(i, opt) {
    S.i = Math.max(0, Math.min(ST.length - 1, i)); LS.set('gt_stage', S.i);
    const s = ST[S.i];
    if (!opt || !opt.keepSpk) { if (s.id !== 'speak') S.spk = -1; }
    const main = $('#main'); main.innerHTML = `<div class="slide">${R[s.id](s)}</div>`;
    $('#sT').textContent = s.T; $('#sS').textContent = s.S;
    $('#stn').textContent = (S.i + 1) + '/' + ST.length;
    $('#dots').innerHTML = ST.map((x, k) => `<i class="${k === S.i ? 'on' : ''} ${x.extra ? 'ex' : ''}" data-k="${k}" title="${esc(x.title)}"></i>`).join('');
    if (!opt || !opt.keepTimer) { if (s.min) tSet(s.min * 60); }
    bind(s); live();
    if (!opt || !opt.quiet) guide(s.guide);
    if (s.id !== 'lab3d' && window.LAB3D) window.LAB3D.stop();
  }
  function bind(s) {
    document.querySelectorAll('.mood').forEach((b) => b.onclick = () => { const k = b.dataset.i; S.mood[k] = (S.mood[k] || 0) + 1; b.querySelector('[data-c]').textContent = S.mood[k]; GT.tone(660 + k * 110, 0.15); });
    document.querySelectorAll('.hq').forEach((c) => c.onclick = () => { c.querySelector('.ans').style.visibility = 'visible'; c.classList.add('flash'); });
    const kb = $('#keyb'); if (kb) kb.onclick = () => { document.querySelectorAll('#main .key').forEach((x) => x.style.display = ''); document.querySelectorAll('#main .nokey').forEach((x) => x.style.display = 'none'); GT.chime(); };
    if (s.id === 'video') {
      const draw = () => { $('#lanes').innerHTML = GV.lanes(S.videoStep); };
      $('#vprev').onclick = () => { stopV(); S.videoStep = Math.max(0, S.videoStep - 1); draw(); };
      $('#vnext').onclick = () => { stopV(); S.videoStep = Math.min(4, S.videoStep + 1); draw(); };
      $('#vplay').onclick = () => { stopV(); S.videoStep = 0; draw(); S.vT = setInterval(() => { if (S.videoStep >= 4) return stopV(); S.videoStep++; draw(); GT.tone(520 + S.videoStep * 90, 0.12); }, 2300); };
      document.querySelectorAll('.bq').forEach((q) => q.onclick = () => { const n = +q.dataset.i + 1; const nx = document.querySelector(`.bq[data-i="${n}"]`); q.style.opacity = 1; if (nx) nx.style.opacity = 1; });
    }
    if (s.id === 'lab3d') import('./lab3d.js').then((m) => m.mount($('#lab3d'))).catch((e) => { $('#lab3d').innerHTML = '<div class="l3cap">3D модель ашылмады: браузер WebGL-ді қолдамайды.</div>'; console.error(e); });
    if (s.id === 'speak') {
      document.querySelectorAll('.spb').forEach((b) => b.onclick = () => { S.spk = +b.dataset.i; SP.end = Date.now() + 60000; SP.run = true; SP.last = -1; show(S.i, { keepSpk: true, keepTimer: true, quiet: true }); guide(LD.speakers[S.spk].sci.name + ': ' + LD.speakers[S.spk].sci.fact); });
      const back = $('#spback'); if (back) back.onclick = () => { S.spkDone[S.spk] = 1; S.spk = -1; SP.run = false; show(S.i, { keepTimer: true, quiet: true }); };
    }
    if (s.id === 'quiz') { $('#qopen').onclick = () => setMeta({ quiz: true }); $('#qclose').onclick = () => setMeta({ quiz: false }); }
    if (s.id === 'end') $('#fullr').onclick = () => openTP('rating');
    const gb = $('#galb'); if (gb) gb.onclick = () => gallery();
  }
  function stopV() { clearInterval(S.vT); S.vT = null; }
  /* галерея: әр топқа 1 минут */
  function gallery() {
    let k = 0; const step = () => {
      document.querySelectorAll('.gal').forEach((x, i) => { x.style.outline = i === k ? '6px solid #F2994A' : ''; x.style.transform = i === k ? 'scale(1.03)' : ''; });
      if (k >= 3) { GT.melody(); return; }
      tSet(60); $('#tplay').click(); banner('🖼️ ' + grp(LD.posters[k].g).short + ' қорғайды'); const cur = k; k++;
      clearTimeout(S.galT); S.galT = setTimeout(() => { if (ST[S.i].id === 't5') step(); }, 61000); void cur;
    }; step();
  }
  /* спикер таймері 60 с */
  const SP = { run: false, end: 0, last: -1 };
  function spkTick() {
    const el = $('#t60'); if (!el || !SP.run) return;
    const left = Math.max(0, (SP.end - Date.now()) / 1000), s = Math.ceil(left);
    el.textContent = fmt(left); el.style.background = s <= 10 ? '#D64545' : '#00A6A6';
    if (s <= 10 && s > 0 && s !== SP.last) { SP.last = s; GT.tick(); }
    if (left <= 0) { SP.run = false; GT.bell(); banner('🎤 60 секунд өтті'); }
  }

  /* ---------- live: квиз, рейтинг, кері байланыс ---------- */
  function live() {
    const g = S.game || {}, meta = g.meta || {};
    const conn = $('#conn'); if (S.db) conn.textContent = S.db.demo ? (S.db.offline ? '🟡 офлайн (демо)' : '🟡 демо') : '🟢 ' + S.code;
    if ($('#qlive')) {
      const players = g.players || {}, ans = g.answers || {}; const ids = Object.keys(players);
      $('#qstat').textContent = (meta.quiz ? '🟢 ашық' : '⚪ жабық') + ' · ' + ids.length + ' оқушы';
      const rows = ids.map((u) => { let c = 0, n = 0; LD.quiz.forEach((q, i) => { const a = ans[i] && ans[i][u]; if (a) { n++; if (GT.isRight(q, a.v)) c++; } }); return { name: players[u].name, g: players[u].g, c, n }; }).sort((a, b) => b.c - a.c || b.n - a.n);
      $('#qlive').innerHTML = rows.length ? rows.slice(0, 12).map((r, i) => `<div class="qopt" style="font-size:21px;padding:5px 0"><b style="width:30px">${i + 1}</b><span style="width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${grp(r.g).icon} ${esc(r.name)}</span><div class="bar"><i style="width:${(r.n / 8) * 100}%"></i></div><b style="width:110px;text-align:right">✓ ${r.c}/${r.n}</b></div>`).join('') + (rows.length > 12 ? `<div class="mut">… тағы ${rows.length - 12}</div>` : '') : '<div class="mut" style="font-size:22px">Оқушылар QR арқылы кіргенде осында шығады</div>';
    }
    if ($('#rtop')) {
      const r = GT.rating(g, S.roster);
      $('#rtop').innerHTML = r.length ? `<table class="as cmp" style="font-size:19px"><thead><tr><th>#</th><th>Оқушы</th><th>Ұпай</th><th>Балл</th></tr></thead><tbody>${r.slice(0, 8).map((x, i) => `<tr><td>${i + 1}</td><td>${x.g != null ? grp(x.g).icon : ''} ${esc(x.name)}</td><td>${x.total}/${LD.MAX}</td><td><b>${x.b}</b> <span class="mut">${x.band}</span></td></tr>`).join('')}</tbody></table>` : '<div class="mut">Хатшы мен квиз ұпайлары осында жиналады</div>';
    }
    if ($('#fb')) {
      const fb = g.feedback || {}; const cnt = {}; Object.values(fb).forEach((f) => { if (f && f.k) cnt[f.k] = (cnt[f.k] || 0) + 1; });
      const tot = Object.values(cnt).reduce((a, b) => a + b, 0) || 1;
      $('#fb').innerHTML = LD.feedback.map((f) => `<div style="padding:8px 0;border-top:1px solid var(--line)"><div style="font-size:22px;font-weight:800">${f.icon} ${esc(f.t)} <span style="float:right">${cnt[f.k] || 0}</span></div><div class="bar" style="margin-top:6px"><i style="width:${((cnt[f.k] || 0) / tot) * 100}%"></i></div><div class="mut" style="font-size:17px">${esc(f.d)}</div></div>`).join('');
    }
    if ($('#tp').classList.contains('on') && S.tpTab === 'rating') renderTP();
  }
  function setMeta(o) { if (!S.db) return; S.db.update('games/' + S.code + '/meta', o).catch((e) => banner('⚠️ Firebase: ' + (e.code || e.message), 5000)); }

  /* ---------- мұғалім панелі ---------- */
  function openTP(tab) { S.tpTab = tab || S.tpTab || 'list'; $('#tp').classList.add('on'); renderTP(); }
  function closeTP() { $('#tp').classList.remove('on'); if (location.hash === '#teacher') history.replaceState(null, '', '#board'); }
  $('#bt').onclick = () => openTP();
  $('#bm').onclick = () => window.open('materialdar.html', '_blank');
  $('#tp').onclick = (e) => { if (e.target.id === 'tp') closeTP(); };
  function renderTP() {
    const tab = S.tpTab;
    const tabs = [['list', '👥 Тізім және топтар'], ['rating', '🏅 Рейтинг'], ['links', '🔗 Сілтемелер'], ['help', 'ℹ️ Нұсқау']];
    const matBtn = `<a class="btn sec" href="materialdar.html" target="_blank" style="text-decoration:none">📁 Материалдар</a>`;
    let h = `<div style="display:flex;gap:10px;align-items:center;margin-bottom:16px"><h2 style="margin-right:auto">⚙️ Мұғалім панелі</h2>${tabs.map(([k, t]) => `<button class="btn ${k === tab ? '' : 'sec'} tpt" data-k="${k}">${t}</button>`).join('')}${matBtn}<button class="btn sec" id="tpx">✕</button></div>`;
    if (tab === 'list') {
      const txt = S.roster.map((p) => p.name + ' - ' + p.l).join('\n');
      h += `<div style="display:grid;grid-template-columns:.8fr 1.2fr;gap:24px"><div><div class="mut" style="font-size:19px;margin-bottom:8px">Әр жолға: <b>Аты-жөні - A/B/C</b> (A — озат, B — екпінді, C — қанағат). Тізім тек осы құрылғыда және сабақ базасында сақталады, сайттың кодына жазылмайды.</div>
        <textarea id="rost" placeholder="Әлиев Нұрсұлтан - A&#10;Серікова Аружан - B&#10;Болатов Ерлан - C">${esc(txt)}</textarea>
        <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap"><button class="btn" id="bal">⚖️ Тең топтарға бөлу</button><button class="btn sec" id="rebal">🔀 Қайта араластыру</button><button class="btn sec" id="clr">🗑 Тазалау</button></div></div>
        <div><div class="grid3" style="gap:14px">${LD.groups.map((g, gi) => { const m = membersOf(gi); return `<div class="gbox" style="border-color:${g.c};background:${g.soft};font-size:19px"><b style="color:${g.ink}">${g.icon} ${esc(g.name)}</b><div class="mut">${m.length} оқушы · Σ деңгей ${GT.groupSum(m)}</div><ul>${m.map((p) => `<li><span>${esc(p.name)} <span class="lv lv${p.l}">${p.l}</span></span><span>${p.role ? roleOf(p.role).icon : ''}</span></li>`).join('')}</ul></div>`; }).join('')}</div>
        <div class="mut" style="font-size:18px;margin-top:10px">🎤 1-спикер (A) · 🎤 2-спикер (B) · 📒 хатшы (B) · 🖼️ постер қорғаушы (A емес)</div></div></div>`;
    } else if (tab === 'rating') {
      const r = GT.rating(S.game, S.roster);
      h += `<div style="display:flex;gap:10px;margin-bottom:10px"><button class="btn" id="csv">⬇️ Excel (CSV)</button><span class="mut" style="align-self:center;font-size:19px">${esc(LD.ball.note)}</span></div>
        <table class="as" style="font-size:19px"><thead><tr><th>#</th><th>Оқушы</th><th>Топ</th>${LD.tasks.map((t) => `<th>${t.k}</th>`).join('')}<th>Ұпай</th><th>Балл</th><th>Деңгей</th></tr></thead><tbody>
        ${r.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.name)}</td><td>${x.g != null ? grp(x.g).icon + ' ' + grp(x.g).short : '—'}</td>${LD.tasks.map((t) => `<td>${x.byK[t.k]}</td>`).join('')}<td><b>${x.total}/${LD.MAX}</b></td><td><b style="font-size:24px">${x.b}</b></td><td>${x.band}</td></tr>`).join('') || `<tr><td colspan="12" class="mut">Әзірге ұпай жоқ</td></tr>`}</tbody></table>`;
    } else if (tab === 'links') {
      h += `<div class="grid3">${[['quiz.html', '📱 Квиз (оқушылар)'], ['hatshy.html', '📒 Хатшы (әр топқа 1 телефон)']].map(([f, t]) => `<div class="card" style="text-align:center"><b>${t}</b><div class="qrbox" style="width:260px;height:260px;margin:10px auto">${GT.qr(link(f), 260)}</div><div class="mut" style="font-size:16px;word-break:break-all">${esc(link(f))}</div></div>`).join('')}
        <div class="card"><b>Сабақ коды: <span style="font-size:36px">${esc(S.code)}</span></b><div class="mut" style="font-size:19px;margin:8px 0">Байланыс: ${S.db ? (S.db.demo ? 'демо — тек осы браузерде' : 'Firebase ✓') : '…'}</div><button class="btn sec" id="newc">🆕 Жаңа сабақ коды (ұпайлар нөлденеді)</button>
        <div style="margin-top:14px"><label style="font-size:20px"><input type="checkbox" id="voice" ${LS.get('gt_voice', true) ? 'checked' : ''}> Гид дауысы (${kkVoice ? 'қазақ дауысы бар' : 'қазақ дауысы жоқ — субтитр'})</label></div></div></div>`;
    } else {
      h += `<div class="card" style="font-size:22px;line-height:1.5"><ol style="margin:0;padding-left:28px">
        <li>Сабаққа дейін: «Тізім» бөліміне оқушыларды деңгейімен енгізіп, «Тең топтарға бөлу» батырмасын басыңыз.</li>
        <li>Хатшыларға «Топқа бөлу» слайдындағы QR-ды көрсетіңіз: олар өз тобын таңдап, K1–K6 ұпайын енгізеді.</li>
        <li>Квиз кезеңінде «▶ Квизді ашу» — оқушылар телефонмен QR арқылы кіреді (бұл — жалғыз телефон тапсырмасы).</li>
        <li>Соңында «Рейтинг» — хатшы мен квиз ұпайлары есім бойынша бірігіп, 10 балға айналады.</li>
        <li>Басқару: ← → пернелері, T — осы панель, таймерде ▶ ↺ +1 🔔. 60 с қалғанда — қоңырау, соңғы 10 с — санақ, 0-де — әуен.</li>
        <li>Слайдтағы сызбаны бассаңыз — үлкейеді (зум). 3D зертханада модельді тінтуірмен айналдырып, дөңгелекпен үлкейтесіз.</li></ol></div>`;
    }
    $('#tpin').innerHTML = h;
    document.querySelectorAll('.tpt').forEach((b) => b.onclick = () => { S.tpTab = b.dataset.k; renderTP(); });
    $('#tpx').onclick = closeTP;
    if (tab === 'list') {
      const doBal = (shuffle) => {
        let list = GT.parseRoster($('#rost').value); if (!list.length) return banner('Тізім бос');
        if (shuffle) list = list.map((p) => [Math.random(), p]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
        const gs = GT.balance(list, LD.groups.length); const out = [];
        gs.forEach((m, gi) => GT.assignRoles(m).forEach((p) => out.push(Object.assign(p, { g: gi }))));
        S.roster = out; LS.set('gt_roster', out); pushRoster(); renderTP(); if (ST[S.i].id === 'groups' || ST[S.i].id === 'speak') show(S.i, { keepTimer: true, quiet: true });
      };
      $('#bal').onclick = () => doBal(false); $('#rebal').onclick = () => doBal(true);
      $('#clr').onclick = () => { S.roster = []; LS.set('gt_roster', []); pushRoster(); renderTP(); };
    }
    if (tab === 'rating') $('#csv').onclick = () => {
      const r = GT.rating(S.game, S.roster);
      const lines = [['#', 'Оқушы', 'Топ', ...LD.tasks.map((t) => t.k), 'Ұпай', 'Балл', 'Деңгей'].join(';')].concat(r.map((x, i) => [i + 1, x.name, x.g != null ? grp(x.g).name : '', ...LD.tasks.map((t) => x.byK[t.k]), x.total + '/' + LD.MAX, x.b, x.band].join(';')));
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })); a.download = 'gametogenez-reyting.csv'; a.click();
    };
    if (tab === 'links') { $('#newc').onclick = async () => { if (!confirm('Жаңа код жасалады, ағымдағы ұпайлар көрінбейді. Жалғастырасыз ба?')) return; LS.set('gt_code', ''); await connect(true); renderTP(); show(S.i, { keepTimer: true, quiet: true }); }; $('#voice').onchange = (e) => LS.set('gt_voice', e.target.checked); }
  }
  function pushRoster() { if (S.db && S.code) setMeta({ roster: S.roster.map((p) => ({ name: p.name, g: p.g, role: p.role || '' })) }); }

  /* ---------- Firebase ---------- */
  let unsub = null;
  async function connect(fresh) {
    if (!S.db) S.db = await GT.backend();
    const db = S.db; let code = fresh ? '' : LS.get('gt_code', '');
    for (let tries = 0; tries < 5; tries++) {
      if (!code) code = GT.PREFIX + String(Math.floor(1000 + Math.random() * 9000));
      let meta = null; try { meta = await db.get('games/' + code + '/meta'); } catch (e) { meta = null; }
      if (!meta) { try { await db.update('games/' + code + '/meta', { host: db.uid, created: db.TS, lesson: 'gametogenez-11' }); break; } catch (e) { code = ''; continue; } }
      if (meta.host === db.uid) break; code = '';
    }
    S.code = code; LS.set('gt_code', code);
    if (unsub) unsub();
    unsub = db.on('games/' + code, (v) => { S.game = v || {}; live(); });
    pushRoster(); live();
  }

  /* ---------- басқару ---------- */
  $('#bn').onclick = () => show(S.i + 1); $('#bp').onclick = () => show(S.i - 1);
  $('#dots').onclick = (e) => { const k = e.target.dataset.k; if (k != null) show(+k); };
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') show(S.i + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') show(S.i - 1);
    else if (e.key === 't' || e.key === 'T' || e.key === 'е' || e.key === 'Е') { $('#tp').classList.contains('on') ? closeTP() : openTP(); }
    else if (e.key === 'Escape') { closeTP(); $('#zoomlay').classList.remove('on'); }
  });
  const route = () => { if (location.hash === '#teacher') openTP(); const m = location.hash.match(/^#s(\d+)/); if (m) show(+m[1] - 1); };
  addEventListener('hashchange', route);
  show(S.i); route();
  connect().catch((e) => { console.error(e); $('#conn').textContent = '⚠️ байланыс жоқ'; });
  window.GTAPP = { S, show, openTP };
})();
