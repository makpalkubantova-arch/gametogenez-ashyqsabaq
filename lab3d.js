/* 3D зертхана: сперматозоид, жұмыртқа жасушасы + полярлы денешіктер, ұрықтану. Айналдыру, үлкейту, анимация. */
import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';

let ctx = null;
export function stop() {
  if (!ctx) return;
  cancelAnimationFrame(ctx.raf); ctx.ro && ctx.ro.disconnect();
  ctx.controls.dispose(); ctx.renderer.dispose(); ctx = null;
}
window.LAB3D = { stop };

const MODELS = [
  { key: 'sperm', name: '♂ Сперматозоид', cap: 'Сперматозоид: басында ядро (n = 23) мен акросома, мойнында митохондриялар, құйрығы — қозғалыс талшығы. Айналдырып, үлкейтіп қараңдар.' },
  { key: 'egg', name: '♀ Жұмыртқа жасушасы', cap: 'Жұмыртқа жасушасы — ірі, цитоплазмасы қоректік затқа бай. Оны жылтыр қабық пен сәулелі тәж қоршайды; жанында — ұсақ полярлы денешіктер.' },
  { key: 'fert', name: '✨ Ұрықтану', cap: 'Көп сперматозоидтың тек біреуі ғана енеді. Сол сәтте II реттік ооцит мейоз II-ні аяқтайды: зигота 23 + 23 = 46 (2n).' }
];

function mat(color, o) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.45, metalness: 0.05 }, o || {})); }

function buildSperm(scale) {
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), mat(0x9cc4f2, { transparent: true, opacity: 0.55 }));
  head.scale.set(1.25, 0.85, 0.6); head.userData.part = 'head'; g.add(head);
  const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 24), mat(0x2f7fd8)); nuc.scale.set(1.2, 0.85, 0.6); nuc.position.x = 0.12; nuc.userData.part = 'nucleus'; g.add(nuc);
  const acr = new THREE.Mesh(new THREE.SphereGeometry(1.03, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2.6), mat(0x8a63e8, { transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
  acr.rotation.z = Math.PI / 2; acr.scale.set(0.86, 1.27, 0.62); acr.position.x = -0.05; acr.userData.part = 'acrosome'; g.add(acr);
  const mid = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 2.2, 24), mat(0x7fb3ec)); mid.rotation.z = Math.PI / 2; mid.position.x = 2.3; mid.userData.part = 'mito'; g.add(mid);
  for (let i = 0; i < 26; i++) {
    const a = i * 0.9, m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), mat(0xf2994a, { emissive: 0x6b3500, emissiveIntensity: 0.4 }));
    m.scale.set(1.6, 1, 1); m.position.set(1.25 + i * 0.082, Math.cos(a) * 0.3, Math.sin(a) * 0.3); m.userData.part = 'mito'; g.add(m);
  }
  const tailMat = mat(0x2f7fd8, { roughness: 0.6 });
  const tail = new THREE.Mesh(new THREE.BufferGeometry(), tailMat); tail.userData.part = 'tail'; g.add(tail);
  g.userData.wave = (t) => {
    const pts = []; for (let i = 0; i <= 60; i++) { const u = i / 60, x = 3.4 + u * 9; const amp = 0.15 + u * 0.75; pts.push(new THREE.Vector3(x, Math.sin(u * 9 - t * 7) * amp, Math.cos(u * 9 - t * 7) * amp * 0.25)); }
    tail.geometry.dispose(); tail.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, g.userData.fat ? 0.22 : 0.11, 10, false);
  };
  g.userData.wave(0);
  g.userData.labels = [['Акросома', new THREE.Vector3(-1.3, 0.4, 0)], ['Ядро (n = 23)', new THREE.Vector3(0.2, 0.9, 0)], ['Митохондриялар', new THREE.Vector3(2.3, 0.6, 0)], ['Құйрығы (талшық)', new THREE.Vector3(9, 0.9, 0)]];
  if (scale) g.scale.setScalar(scale);
  return g;
}

function buildEgg(withPolar) {
  const g = new THREE.Group();
  const cyto = new THREE.Mesh(new THREE.SphereGeometry(3, 64, 48), mat(0xf6c3da, { transparent: true, opacity: 0.6, roughness: 0.7 })); cyto.userData.part = 'cyto'; g.add(cyto);
  const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.95, 40, 32), mat(0xc2457f)); nuc.position.set(-0.6, 0.5, 0.4); nuc.userData.part = 'eggnuc'; g.add(nuc);
  const yolk = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), mat(0xffe7a3), 260); const m4 = new THREE.Matrix4();
  for (let i = 0; i < 260; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(0.8 + Math.random() * 1.9); m4.setPosition(v); yolk.setMatrixAt(i, m4); } yolk.userData.part = 'cyto'; g.add(yolk);
  const zona = new THREE.Mesh(new THREE.SphereGeometry(3.55, 64, 48), mat(0xffffff, { transparent: true, opacity: 0.18, roughness: 0.2, side: THREE.DoubleSide })); zona.userData.part = 'zona'; g.add(zona);
  const cor = new THREE.InstancedMesh(new THREE.SphereGeometry(0.32, 12, 10), mat(0xe9a7c6, { roughness: 0.8 }), 150);
  for (let i = 0; i < 150; i++) { const v = new THREE.Vector3().randomDirection(); if (v.z > 0.55 && v.x < 0.2) v.z *= -1; v.multiplyScalar(4.1 + Math.random() * 0.5); m4.makeScale(1, 1, 1.5); m4.setPosition(v); cor.setMatrixAt(i, m4); } cor.userData.part = 'corona'; g.add(cor);
  g.userData.labels = [['Ядро (n)', new THREE.Vector3(-0.6, 1.6, 0.4)], ['Цитоплазма: қоректік заттар', new THREE.Vector3(1.4, -1.6, 2.2)], ['Жылтыр қабық', new THREE.Vector3(2.6, 2.4, 0)], ['Сәулелі тәж', new THREE.Vector3(-3.6, -2.6, 0)]];
  if (withPolar) {
    [[0.3, 3.25, 0.8, 0.42], [0.95, 3.0, 1.0, 0.34]].forEach(([x, y, z, r]) => { const p = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat(0xc2457f, { transparent: true, opacity: 0.85 })); p.position.set(x, y, z); p.userData.part = 'polar'; g.add(p); });
    g.userData.labels.push(['Полярлы денешіктер', new THREE.Vector3(0.6, 3.9, 1)]);
  }
  return g;
}

/* Баспа: қай бөлік басылды — дұрыс па? */
export function judge(target, parts) {
  const has = (p) => parts.includes(p);
  const inner = parts.filter((p) => p !== 'zona' && p !== 'corona');
  switch (target) {
    case 'zona': return parts.filter((p) => p !== 'corona')[0] === 'zona' && !has('cyto') && !has('eggnuc') && !has('polar');
    case 'corona': return parts[0] === 'corona';
    case 'cyto': return inner[0] === 'cyto' && !has('eggnuc');
    case 'head': return has('head') || has('nucleus') || has('acrosome');
    default: return has(target);
  }
}
export function mount(el, opts) {
  opts = opts || {};
  stop();
  el.innerHTML = `<div class="l3ui" ${opts.challenge ? 'style="display:none"' : ''}>${MODELS.map((m, i) => `<button data-i="${i}" class="${i ? '' : 'on'}">${m.name}</button>`).join('')}<button id="l3rot" class="on">⟳ Айналу</button><button id="l3lab" class="on">🏷 Белгілер</button></div>
    <div class="l3z" ${opts.challenge ? 'style="display:none"' : ''}><button id="l3in" title="Үлкейту">＋</button><button id="l3out" title="Кішірейту">－</button><button id="l3fit" title="Бастапқы көрініс" style="font-size:24px">⤢</button></div><div class="l3cap" id="l3cap" ${opts.challenge ? 'style="display:none"' : ''}></div>`;
  const W = () => el.clientWidth || 1600, H = () => el.clientHeight || 800;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(W(), H()); el.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, W() / H(), 0.1, 400);
  scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x2a1f40, 1.1));
  const dl = new THREE.DirectionalLight(0xffffff, 2.2); dl.position.set(6, 8, 10); scene.add(dl);
  const rim = new THREE.PointLight(0x7ad8ff, 40, 60); rim.position.set(-10, -4, -6); scene.add(rim);
  /* фон бөлшектері */
  const dust = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([...Array(900)].map(() => (Math.random() - 0.5) * 80), 3)), new THREE.PointsMaterial({ color: 0x8fb4ff, size: 0.12, transparent: true, opacity: 0.6 }));
  scene.add(dust);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 1.4; controls.minDistance = 3; controls.maxDistance = 60;
  ctx = { renderer, controls, raf: 0, cur: 0, group: null, fly: null, showLab: !opts.challenge, t0: performance.now(), hl: [] };
  if (opts.challenge) controls.autoRotateSpeed = 0.8;
  const labs = [];
  function setModel(i) {
    ctx.cur = i; if (ctx.group) scene.remove(ctx.group);
    labs.splice(0).forEach((l) => l.el.remove());
    const g = new THREE.Group(); let target = new THREE.Vector3(), dist = 16;
    ctx.hl = [];
    if (MODELS[i].key === 'sperm') { const s = buildSperm(); if (opts.challenge) { s.userData.fat = true; s.userData.wave(0); } s.position.x = -4.5; g.add(s); g.userData.anim = (t) => s.userData.wave(t); addLabels(s); target.set(0, 0, 0); dist = opts.challenge ? 11 : 15; }
    if (MODELS[i].key === 'egg') { const e = buildEgg(true); g.add(e); g.userData.anim = (t) => { e.rotation.y = t * 0.05; }; addLabels(e); dist = opts.challenge ? 12 : 14; }
    if (MODELS[i].key === 'fert') {
      const e = buildEgg(false); g.add(e);
      const sp = []; for (let k = 0; k < 11; k++) { const s = buildSperm(0.45); const dir = new THREE.Vector3().randomDirection(); dir.y *= 0.6; dir.normalize(); s.userData.dir = dir; s.userData.off = Math.random(); g.add(s); sp.push(s); }
      g.userData.anim = (t) => {
        const cyc = (t % 9) / 9;
        sp.forEach((s, k) => {
          const winner = k === 0; const r = winner ? Math.max(0.2, 16 - cyc * 18) : Math.max(4.9, 16 - cyc * 14 - s.userData.off * 2);
          s.position.copy(s.userData.dir).multiplyScalar(r); s.lookAt(0, 0, 0); s.rotateY(Math.PI / 2); s.userData.wave(t + k);
          s.visible = !(winner && r < 3.2);
        });
        e.children[0].material.emissive.setHex(cyc > 0.86 ? 0x553355 : 0x000000);
      };
      g.userData.labels = []; addLabelsRaw([['Жұмыртқа жасушасы', new THREE.Vector3(0, 4.9, 0), e], ['Сперматозоидтар', new THREE.Vector3(10, -6, 0), g]]); dist = 22;
    }
    scene.add(g); ctx.group = g;
    camera.position.set(0, dist * 0.35, dist * 2.6); controls.target.copy(target);
    ctx.fly = { from: dist * 2.6, to: dist, t: 0 };
    el.querySelectorAll('.l3ui [data-i]').forEach((b) => b.classList.toggle('on', +b.dataset.i === i));
    el.querySelector('#l3cap').textContent = MODELS[i].cap;
  }
  function addLabels(obj) { addLabelsRaw((obj.userData.labels || []).map(([t, v]) => [t, v, obj])); }
  function addLabelsRaw(list) { list.forEach(([t, v, obj]) => { const d = document.createElement('div'); d.className = 'l3lab'; d.textContent = t; el.appendChild(d); labs.push({ el: d, v, obj }); }); }
  el.querySelectorAll('.l3ui [data-i]').forEach((b) => b.onclick = () => setModel(+b.dataset.i));
  el.querySelector('#l3rot').onclick = (e) => { controls.autoRotate = !controls.autoRotate; e.target.classList.toggle('on', controls.autoRotate); };
  el.querySelector('#l3lab').onclick = (e) => { ctx.showLab = !ctx.showLab; e.target.classList.toggle('on', ctx.showLab); };
  const dolly = (k) => { const v = camera.position.clone().sub(controls.target); const len = THREE.MathUtils.clamp(v.length() * k, controls.minDistance, controls.maxDistance); ctx.fly = { from: v.length(), to: len, t: 0 }; };
  el.querySelector('#l3in').onclick = () => dolly(0.7); el.querySelector('#l3out').onclick = () => dolly(1.4); el.querySelector('#l3fit').onclick = () => setModel(ctx.cur);
  const ro = new ResizeObserver(() => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); }); ro.observe(el); ctx.ro = ro;
  const tmp = new THREE.Vector3();
  function loop() {
    if (!ctx) return; ctx.raf = requestAnimationFrame(loop);
    const t = (performance.now() - ctx.t0) / 1000;
    if (ctx.fly) { const f = ctx.fly; f.t = Math.min(1, f.t + 0.025); const e = 1 - Math.pow(1 - f.t, 3); const len = f.from + (f.to - f.from) * e; const v = camera.position.clone().sub(controls.target).setLength(len); camera.position.copy(controls.target).add(v); if (f.t >= 1) ctx.fly = null; }
    if (ctx.group && ctx.group.userData.anim) ctx.group.userData.anim(t);
    ctx.hl.forEach((h) => { h.m.emissive.setHex(h.c); h.m.emissiveIntensity = 0.55 + 0.45 * Math.sin(t * 7); });
    dust.rotation.y = t * 0.01;
    controls.update(); renderer.render(scene, camera);
    const w = W(), h = H();
    labs.forEach((l) => { tmp.copy(l.v); l.obj.localToWorld(tmp); tmp.project(camera); const vis = ctx.showLab && tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05; l.el.style.display = vis ? '' : 'none'; if (vis) { l.el.style.left = ((tmp.x + 1) / 2) * w + 'px'; l.el.style.top = ((1 - tmp.y) / 2) * h + 'px'; } });
  }
  /* басу (сүйреу емес) → raycast */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8 || !ctx || !opts.onPick) return; down = null;
    const r = renderer.domElement.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const parts = []; ray.intersectObject(ctx.group, true).forEach((h) => { let o = h.object; while (o && !o.userData.part) o = o.parent; if (o && parts[parts.length - 1] !== o.userData.part) parts.push(o.userData.part); });
    opts.onPick(parts, { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height });
  });
  const api = {
    setModel: (key) => setModel(MODELS.findIndex((m) => m.key === key)),
    highlight: (part, color) => { api.clear(); if (!ctx.group) return; ctx.group.traverse((o) => { if (o.userData.part === part && o.material && o.material.emissive) ctx.hl.push({ m: o.material, c: color || 0x22ff88, base: o.material.emissive.getHex() }); }); },
    clear: () => { (ctx ? ctx.hl : []).forEach((h) => { h.m.emissive.setHex(h.base); h.m.emissiveIntensity = 1; }); if (ctx) ctx.hl = []; },
    labels: (on) => { ctx.showLab = on; },
    zoom: (k) => dolly(k)
  };
  setModel(0); loop();
  return api;
}
