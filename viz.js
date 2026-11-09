/* Өз SVG сызбаларымыз: гаметогенез жолақтары, сперматозоид, мейоз, ұрықтану */
(function () {
  const V = (window.GV = {});
  const B = '#2F7FD8', P = '#C2457F', G = '#1E9E7A', INK = '#14213D';
  let dl = 0, ANIM = true; const d = () => (ANIM ? `style="animation-delay:${Math.min(1.1, (dl += 0.07)).toFixed(2)}s"` : 'style="animation:none"');
  const tag = (x, y, t, c) => `<g class="cellin" ${d()}><rect x="${x - 24}" y="${y - 15}" width="48" height="30" rx="15" fill="${c}"/><text x="${x}" y="${y + 7}" text-anchor="middle" font-size="19" font-weight="900" fill="#fff">${t}</text></g>`;
  const txt = (x, y, t, s, c, w) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${s || 20}" font-weight="${w || 700}" fill="${c || INK}">${String(t).split('|').map((l, i) => `<tspan x="${x}" dy="${i ? (s || 20) * 1.15 : 0}">${l}</tspan>`).join('')}</text>`;
  V.cell = (x, y, r, c, pl) => `<g class="cellin" ${d()}><circle cx="${x}" cy="${y}" r="${r}" fill="${c}22" stroke="${c}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="${r * 0.38}" fill="${c}" opacity=".75"/></g>` + (pl ? tag(x + r * 0.8, y - r * 0.85, pl, c) : '');
  V.sperm = (x, y, s, c, rot) => `<g transform="translate(${x} ${y}) rotate(${rot || 0}) scale(${s})"><g class="swim"><path d="M18 0 C 40 -10, 52 10, 74 0 S 104 -8, 120 2" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="8" y="-4" width="12" height="8" rx="3" fill="${c}" opacity=".8"/><ellipse cx="0" cy="0" rx="12" ry="8" fill="${c}"/><path d="M-12 0 a12 8 0 0 1 6 -7" stroke="#fff" stroke-width="2.5" fill="none" opacity=".8"/></g></g>`;
  V.egg = (x, y, r, c) => `<g class="cellin" ${d()}><circle cx="${x}" cy="${y}" r="${r + 9}" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="4 5" opacity=".7"/><circle cx="${x}" cy="${y}" r="${r}" fill="#FFF3F8" stroke="${c}" stroke-width="4"/><circle cx="${x - r * .15}" cy="${y - r * .1}" r="${r * .3}" fill="${c}" opacity=".7"/>${[...Array(14)].map((_, i) => { const a = i / 14 * 6.283; return `<circle cx="${(x + Math.cos(a) * (r + 20)).toFixed(1)}" cy="${(y + Math.sin(a) * (r + 20)).toFixed(1)}" r="6" fill="${c}" opacity=".25"/>`; }).join('')}</g>`;
  const arrow = (x1, y, x2, c) => `<g class="cellin" ${d()}><path d="M${x1} ${y} H${x2 - 12}" stroke="${c || '#9AA6BD'}" stroke-width="4"/><path d="M${x2 - 14} ${y - 9} L${x2} ${y} L${x2 - 14} ${y + 9}Z" fill="${c || '#9AA6BD'}"/></g>`;
  let FULL = false;
  const STEPS = ['Көбею', 'Өсу', 'Пісіп-жетілу: мейоз I', 'Пісіп-жетілу: мейоз II', 'Қалыптасу'];

  function laneSperm(Y, step, X, lbl) {
    let s = '';
    ANIM = step === 0 || FULL; if (step >= 0) { s += [-42, 0, 42].map((o) => V.cell(X[0], Y + o, 17, B)).join('') + tag(X[0] + 42, Y - 64, '2n', B); if (lbl) s += txt(X[0], Y + 92, 'сперматогониялар', 18, B); }
    ANIM = step === 1 || FULL; if (step >= 1) { s += arrow(X[0] + 50, Y, X[1] - 52) + V.cell(X[1], Y, 40, B, '2n'); if (lbl) s += txt(X[1], Y + 92, 'I реттік|сперматоцит', 18, B); }
    ANIM = step === 2 || FULL; if (step >= 2) { s += arrow(X[1] + 50, Y, X[2] - 46) + V.cell(X[2], Y - 40, 28, B, 'n') + V.cell(X[2], Y + 40, 28, B); if (lbl) s += txt(X[2], Y + 104, 'II реттік|сперматоциттер', 18, B); }
    ANIM = step === 3 || FULL; if (step >= 3) { s += arrow(X[2] + 40, Y, X[3] - 40) + [-66, -22, 22, 66].map((o, i) => V.cell(X[3], Y + o, 19, B, i ? '' : 'n')).join(''); if (lbl) s += txt(X[3], Y + 112, 'сперматидалар', 18, B); }
    ANIM = step === 4 || FULL; if (step >= 4) { s += arrow(X[3] + 30, Y, X[4] - 70) + [-66, -22, 22, 66].map((o) => `<g class="cellin" ${d()}>${V.sperm(X[4] - 50, Y + o, 0.95, B)}</g>`).join('') + txt(X[4] + 10, Y + 112, '4 сперматозоид|(n)', 21, B, 900); }
    return s;
  }
  function laneOo(Y, step, X, lbl) {
    let s = '';
    ANIM = step === 0 || FULL; if (step >= 0) { s += [-42, 0, 42].map((o) => V.cell(X[0], Y + o, 17, P)).join('') + tag(X[0] + 42, Y - 64, '2n', P); if (lbl) s += txt(X[0], Y + 92, 'оогониялар', 18, P); }
    ANIM = step === 1 || FULL; if (step >= 1) { s += arrow(X[0] + 50, Y, X[1] - 64) + V.cell(X[1], Y, 54, P, '2n'); if (lbl) s += txt(X[1], Y + 92, 'I реттік ооцит', 18, P); }
    ANIM = step === 2 || FULL; if (step >= 2) { s += arrow(X[1] + 62, Y, X[2] - 58) + V.cell(X[2] - 6, Y, 48, P, 'n') + V.cell(X[2] + 52, Y - 46, 11, P); if (lbl) s += txt(X[2], Y + 92, 'II реттік ооцит|+ полярлы денешік', 17, P); }
    ANIM = step === 3 || FULL; if (step >= 3) { s += arrow(X[2] + 50, Y, X[3] - 56) + V.cell(X[3] - 6, Y, 46, P, 'n') + [[48, -50], [64, -26], [30, -66]].map(([a, b]) => V.cell(X[3] + a, Y + b, 10, P)).join(''); if (lbl) s += txt(X[3], Y + 92, 'жұмыртқа жасушасы|+ 3 полярлы денешік', 17, P); }
    ANIM = step === 4 || FULL; if (step >= 4) { s += arrow(X[3] + 54, Y, X[4] - 70) + V.egg(X[4], Y, 48, P) + txt(X[4], Y + 104, '1 жұмыртқа|жасушасы (n)', 21, P, 900); }
    return s;
  }
  /* Бейне кезеңі: екі жолақ, қадамдап */
  V.lanes = function (step) {
    dl = 0; FULL = false; const X = [150, 400, 680, 960, 1230];
    let s = `<svg viewBox="0 0 1380 700" class="anim">`;
    STEPS.forEach((t, i) => { s += `<g opacity="${i <= step ? 1 : 0.25}"><rect x="${X[i] - 118}" y="8" width="236" height="52" rx="14" fill="${i === step ? '#6C4BD8' : '#EEF1F8'}"/><text x="${X[i]}" y="41" text-anchor="middle" font-size="19" font-weight="800" fill="${i === step ? '#fff' : INK}">${i + 1}. ${t}</text></g>`; });
    s += `<text x="34" y="200" font-size="22" font-weight="900" fill="${B}" transform="rotate(-90 34 200)" text-anchor="middle">♂ СПЕРМАТОГЕНЕЗ</text>`;
    s += `<text x="34" y="520" font-size="22" font-weight="900" fill="${P}" transform="rotate(-90 34 520)" text-anchor="middle">♀ ООГЕНЕЗ</text>`;
    s += `<line x1="40" y1="360" x2="1370" y2="360" stroke="#E1E7F0" stroke-width="3" stroke-dasharray="8 8"/>`;
    s += laneSperm(200, step, X, true) + laneOo(530, step, X, true);
    return s + '</svg>';
  };
  V.single = function (kind) {
    dl = 0; FULL = true; const X = [100, 320, 560, 800, 1020];
    const Y = 210; let s = `<svg viewBox="0 0 1120 440" class="anim">`;
    STEPS.forEach((t, i) => { s += `<text x="${X[i]}" y="30" text-anchor="middle" font-size="16" font-weight="800" fill="#5B6B86">${i + 1}. ${t.replace('Пісіп-жетілу: ', '')}</text>`; });
    s += kind === 'oo' ? laneOo(Y, 4, X, true) : laneSperm(Y, 4, X, true);
    return s + '</svg>';
  };
  V.spermcell = function () {
    dl = 0; ANIM = true; const c = B;
    return `<svg viewBox="0 0 1120 440" class="anim"><g class="cellin" ${d()}>
      <path d="M520 220 C 640 150, 720 300, 840 220 S 980 160, 1090 230" stroke="${c}" stroke-width="9" fill="none" stroke-linecap="round" class="swim"/>
      <rect x="330" y="196" width="200" height="48" rx="20" fill="#7FB3EC"/>
      ${[...Array(9)].map((_, i) => `<ellipse cx="${348 + i * 21}" cy="220" rx="9" ry="18" fill="#F2994A" stroke="#B5651D" stroke-width="2"/>`).join('')}
      <ellipse cx="220" cy="220" rx="118" ry="78" fill="#CFE2F8" stroke="${c}" stroke-width="5"/>
      <ellipse cx="236" cy="220" rx="78" ry="54" fill="${c}" opacity=".8"/>
      <path d="M104 220 a118 78 0 0 1 60 -66 a30 66 0 0 0 0 132 a118 78 0 0 1 -60 -66Z" fill="#6C4BD8" opacity=".8"/></g>
      <g font-size="22" font-weight="800" fill="${INK}">
      <path d="M130 140 L110 70" stroke="#6C4BD8" stroke-width="3"/><text x="110" y="58" text-anchor="middle" fill="#6C4BD8">Акросома (ферменттер)</text>
      <path d="M250 260 L270 360" stroke="${c}" stroke-width="3"/><text x="270" y="390" text-anchor="middle" fill="${c}">Ядро: n = 23 хромосома</text>
      <path d="M440 196 L470 110" stroke="#B5651D" stroke-width="3"/><text x="480" y="96" text-anchor="middle" fill="#B5651D">Мойны: митохондриялар (энергия)</text>
      <path d="M850 225 L880 330" stroke="${c}" stroke-width="3"/><text x="890" y="360" text-anchor="middle" fill="${c}">Құйрығы: талшық (қозғалыс)</text>
      <text x="220" y="215" text-anchor="middle" fill="#fff" font-size="24">БАСЫ</text></g></svg>`;
  };
  V.polar = function () {
    dl = 0; ANIM = true; const c = P;
    let s = `<svg viewBox="0 0 1120 440" class="anim">`;
    s += V.cell(150, 220, 92, c, '2n') + txt(150, 352, 'I реттік ооцит', 21, c, 800);
    s += arrow(258, 220, 380) + txt(320, 196, 'мейоз I', 18, '#5B6B86');
    s += V.cell(480, 220, 86, c, 'n') + V.cell(590, 120, 20, c) + txt(480, 352, 'II реттік ооцит', 21, c, 800) + txt(600, 84, '1-полярлы денешік', 17, c);
    s += arrow(620, 220, 740) + txt(680, 196, 'мейоз II', 18, '#5B6B86');
    s += V.egg(860, 220, 84, c) + [[970, 110], [1000, 150], [960, 70]].map(([a, b]) => V.cell(a, b, 16, c)).join('') + txt(860, 362, 'жұмыртқа жасушасы', 21, c, 800) + txt(990, 40, 'полярлы денешіктер', 17, c);
    s += `<g class="cellin" ${d()}><rect x="300" y="392" width="520" height="40" rx="20" fill="#FBE6F0"/><text x="560" y="419" text-anchor="middle" font-size="20" font-weight="800" fill="#7E2152">Цитоплазма тең бөлінбейді → ресурс бір жасушада</text></g>`;
    return s + '</svg>';
  };
  /* Мейоз: хромосомалар */
  const chrom = (x, y, h, c1, c2, dup) => dup
    ? `<g><rect x="${x - 7}" y="${y - h / 2}" width="7" height="${h}" rx="3.5" fill="${c1}"/><rect x="${x + 1}" y="${y - h / 2}" width="7" height="${h}" rx="3.5" fill="${c2 || c1}"/><circle cx="${x}" cy="${y}" r="4" fill="#14213D"/></g>`
    : `<rect x="${x - 3.5}" y="${y - h / 2}" width="7" height="${h}" rx="3.5" fill="${c1}"/>`;
  V.meio = function () {
    dl = 0; ANIM = true; const R = '#E35D5D', BL = '#3D7BE0';
    let s = `<svg viewBox="0 0 1120 440" class="anim">`;
    const c0 = (x, y, r) => `<g class="cellin" ${d()}><circle cx="${x}" cy="${y}" r="${r}" fill="#DFF5EE" stroke="${G}" stroke-width="3"/>`;
    s += c0(130, 220, 96) + chrom(98, 200, 74, R, R, 1) + chrom(122, 200, 74, BL, BL, 1) + chrom(150, 240, 44, R, R, 1) + chrom(174, 240, 44, BL, BL, 1) + `</g>` + tag(205, 140, '2n', G) + txt(140, 350, 'Аналық жасуша|(4 хромосома)', 18, G, 800);
    s += arrow(232, 220, 330) + txt(280, 196, 'мейоз I', 18, '#5B6B86') + txt(280, 256, 'кроссинговер', 15, '#5B6B86');
    s += c0(420, 130, 64) + chrom(405, 125, 62, R, BL, 1) + chrom(440, 135, 40, BL, BL, 1) + `</g>` + c0(420, 320, 64) + chrom(405, 315, 62, BL, R, 1) + chrom(440, 325, 40, R, R, 1) + `</g>` + tag(486, 76, 'n', G);
    s += arrow(494, 220, 600) + txt(548, 196, 'мейоз II', 18, '#5B6B86');
    [[690, 70], [690, 175], [690, 275], [690, 380]].forEach(([x, y], i) => {
      const cc = [[R, BL], [BL, BL], [BL, R], [R, R]][i];
      s += c0(x, y, 46) + chrom(x - 10, y, 48, cc[0]) + chrom(x + 12, y + 4, 32, cc[1]) + `</g>`;
    });
    s += txt(690, 436, '4 гаплоид жасуша (n)', 18, G, 800);
    s += `<g class="cellin" ${d()}><rect x="780" y="140" width="320" height="170" rx="20" fill="#fff" stroke="${G}" stroke-width="3"/>
      <text x="940" y="190" text-anchor="middle" font-size="26" font-weight="900" fill="${G}">Адамда</text>
      <text x="940" y="236" text-anchor="middle" font-size="24" font-weight="800" fill="${INK}">дене жасушасы: 46</text>
      <text x="940" y="276" text-anchor="middle" font-size="24" font-weight="800" fill="${INK}">гамета: 23 · зигота: 46</text></g>`;
    return s + '</svg>';
  };
  V.ivf = function () {
    dl = 0; ANIM = true; const c = P;
    let s = `<svg viewBox="0 0 1120 440" class="anim">`;
    s += V.egg(330, 220, 120, c) + V.cell(470, 96, 18, c) + txt(330, 400, 'II реттік ооцит (метафаза II-де тоқтаған)', 20, c, 800) + txt(500, 66, 'полярлы денешік', 17, c);
    s += [[30, 140, 10], [10, 230, 0], [40, 320, -12], [110, 200, 4]].map(([x, y, r]) => `<g class="cellin" ${d()}>${V.sperm(x - 20, y, 0.9, B, r)}</g>`).join('');
    s += arrow(500, 220, 640) + txt(570, 196, 'ұрықтану', 20, '#5B6B86', 800);
    s += `<g class="cellin" ${d()}><rect x="650" y="110" width="440" height="220" rx="24" fill="#fff" stroke="${G}" stroke-width="3"/>
      <text x="870" y="160" text-anchor="middle" font-size="24" font-weight="900" fill="${G}">Мейоз II тек енді аяқталады</text>
      <text x="870" y="210" text-anchor="middle" font-size="22" font-weight="700" fill="${INK}">+ 2-полярлы денешік</text>
      <text x="870" y="260" text-anchor="middle" font-size="26" font-weight="900" fill="${INK}">Зигота: 23 + 23 = 46 (2n)</text>
      <text x="870" y="304" text-anchor="middle" font-size="19" font-weight="700" fill="#5B6B86">Шарты: қозғалғыш, жетілген гаметалар</text></g>`;
    return s + '</svg>';
  };
  V.render = (viz) => ({ sperm: () => V.single('sperm'), oo: () => V.single('oo'), spermcell: V.spermcell, polar: V.polar, meio: V.meio, ivf: V.ivf }[viz] || (() => ''))();
})();
