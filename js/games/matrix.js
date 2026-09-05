// 图形推理 —— 矩阵推理（瑞文式）训练：发现属性变化规律
GAMES.matrix = {
  name: '图形推理',
  emoji: '🧩',
  hue: '#6fa8dc',
  desc: '找出行与列的变化规律，补上缺的图',
  tip: '先横着看每一行在怎么变（形状？数量？颜色？），再竖着检查列，规律往往不止一条。',
  start(root, onDone, setStatus) {
    const sk = DB.skill('matrix');
    const tier = sk.best >= 75 ? 3 : sk.best >= 50 ? 2 : 1;
    const N = 8;
    const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star'];
    const COLORS = ['#ff8a5c', '#4f9cf9', '#f7c948'];
    const RANGE = { sh: 5, co: 3, ct: 3 };
    const ATTRS = ['sh', 'co', 'ct'];
    let qi = 0, correct = 0, qT0 = 0, points = 0, bar = null, locked = false, over = false;
    const timers = [];

    const board = U.h('div', 'mx-wrap',
      `<div class="mx-q">第 <b id="mx-qi">1</b>/${N} 题 · ${tier === 1 ? '入门' : tier === 2 ? '进阶' : '高手'}规律</div>
       <div class="mx-grid" id="mx-grid"></div>
       <div class="mx-timer"><div id="mx-bar"></div></div>
       <div class="mx-opts" id="mx-opts"></div>`);
    root.appendChild(board);

    function glyph(shape, color, size) {
      const s = size || 24;
      let inner = '';
      if (shape === 'circle') inner = `<circle cx="12" cy="12" r="10"/>`;
      else if (shape === 'square') inner = `<rect x="3" y="3" width="18" height="18" rx="3"/>`;
      else if (shape === 'triangle') inner = `<polygon points="12,2.5 21.5,20.5 2.5,20.5"/>`;
      else if (shape === 'diamond') inner = `<polygon points="12,1.5 22.5,12 12,22.5 1.5,12"/>`;
      else inner = `<polygon points="12,1 14.7,8.28 22.46,8.6 16.37,13.42 18.47,20.9 12,16.6 5.53,20.9 7.63,13.42 1.54,8.6 9.3,8.28"/>`;
      return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="${color}">${inner}</svg>`;
    }

    // ct 存 0..2，渲染 1..3 个
    function cellHTML(a) {
      let g = '';
      for (let i = 0; i < a.ct + 1; i++) g += glyph(SHAPES[a.sh], COLORS[a.co], 22);
      return `<div class="mx-cell">${g}</div>`;
    }

    function makeQuestion() {
      const base = { sh: U.ri(0, 4), co: U.ri(0, 2), ct: U.ri(0, 2) };
      let rules = [];
      if (tier === 1) rules = [{ attr: U.pick(ATTRS), dir: 'row' }];
      else if (tier === 2) {
        const r1 = U.pick(ATTRS);
        rules = [{ attr: r1, dir: 'row' }, { attr: U.pick(ATTRS.filter(x => x !== r1)), dir: 'col' }];
      } else {
        const r1 = U.pick(ATTRS);
        const rest = ATTRS.filter(x => x !== r1);
        rules = [{ attr: r1, dir: 'row' }, { attr: rest[0], dir: 'col' }, { attr: rest[1], dir: 'row' }];
      }
      const cell = (r, c) => {
        const a = Object.assign({}, base);
        rules.forEach(rl => { a[rl.attr] = (a[rl.attr] + (rl.dir === 'row' ? r : c)) % RANGE[rl.attr]; });
        return a;
      };
      const grid = [];
      for (let r = 0; r < 3; r++) { const row = []; for (let c = 0; c < 3; c++) row.push(cell(r, c)); grid.push(row); }
      const answer = Object.assign({}, grid[2][2]);
      const ansStr = JSON.stringify(answer);
      // 干扰项：在正确答案的各属性上 ±1
      const seen = new Set([ansStr]);
      const distractors = [];
      for (const p of U.shuffle(ATTRS.flatMap(at => [-1, 1].map(d => {
        const x = Object.assign({}, answer);
        x[at] = (x[at] + d + RANGE[at]) % RANGE[at];
        return x;
      })))) {
        const s = JSON.stringify(p);
        if (!seen.has(s)) { seen.add(s); distractors.push(p); }
        if (distractors.length === 3) break;
      }
      const opts = U.shuffle([answer].concat(distractors));
      return { grid, ansStr, opts };
    }

    function renderQ() {
      locked = false;
      const q = makeQuestion();
      board._q = q;
      document.getElementById('mx-qi').textContent = qi + 1;
      const g = document.getElementById('mx-grid');
      g.innerHTML = '';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        if (r === 2 && c === 2) g.appendChild(U.h('div', 'mx-cell missing', '?'));
        else g.insertAdjacentHTML('beforeend', cellHTML(q.grid[r][c]));
      }
      const o = document.getElementById('mx-opts');
      o.innerHTML = '';
      q.opts.forEach(p => {
        const key = JSON.stringify(p);
        const b = U.h('button', 'mx-opt');
        b.dataset.key = key;
        b.innerHTML = cellHTML(p);
        b.addEventListener('click', ev => choose(key, q, ev.currentTarget));
        o.appendChild(b);
      });
      qT0 = performance.now();
      startBar();
    }

    function startBar() {
      const el = document.getElementById('mx-bar');
      el.style.transition = 'none';
      el.style.width = '100%';
      void el.offsetWidth;
      el.style.transition = 'width 30s linear';
      el.style.width = '0%';
      clearTimeout(bar);
      bar = setTimeout(() => { if (!locked && !over) choose('TIMEOUT', board._q, null); }, 30000);
      timers.push(bar);
    }

    function choose(key, q, el) {
      if (locked || over) return;
      locked = true;
      clearTimeout(bar);
      const dt = (performance.now() - qT0) / 1000;
      const ok = key === q.ansStr;
      if (ok) {
        correct++;
        points += 10 + (dt <= 12 ? 2 : dt <= 22 ? 1 : 0);
        SFX.pop();
      } else { SFX.bad(); }
      const hole = document.getElementById('mx-grid').querySelector('.missing');
      hole.innerHTML = cellHTML(q.grid[2][2]);
      hole.classList.remove('missing');
      hole.classList.add(ok ? 'right' : 'wrong');
      if (el) el.classList.add(ok ? 'right' : 'wrong');
      // 把正确选项描个边
      for (const b of document.getElementById('mx-opts').children) {
        if (b.dataset.key === q.ansStr) b.classList.add('right');
      }
      qi++;
      setStatus(`${qi}/${N}`);
      setTimeout(() => { if (qi >= N) end(); else renderQ(); }, 700);
      timers.push(setTimeout(() => { }, 0));
    }

    function end() {
      if (over) return;
      over = true;
      const score = U.clamp(Math.round(points / (N * 12) * 100), 0, 100);
      onDone({ score, detail: `答对 ${correct}/${N}`, extra: { lvl: tier } });
    }

    renderQ();
    return function cleanup() { timers.forEach(clearTimeout); clearTimeout(bar); };
  }
};
