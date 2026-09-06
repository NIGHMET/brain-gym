// 双 n-back —— 进阶工作记忆训练。
// 3×3 网格，每个刺激同时有「位置」和「颜色」；n=2。
// 当本轮位置/颜色 与 n 步前相同时，对应按下「位置」或「颜色」按钮。
// 练：工作记忆更新 / 双重任务注意切换。
(function () {
  const SIZE = 9;   // 3×3 网格
  const N = 2;      // n-back = 2
  const TRIALS = 20;
  const COLORS = ['#ff8a5c', '#57c99a', '#6fa8dc', '#b8a9e8', '#ffc84a'];

  GAMES.nback = {
    name: '双 n-back',
    desc: '记住 n 步前的位置和颜色，进阶挑战',
    emoji: '🧩',
    hue: '#4fae9e',
    tip: '这是工作记忆里最硬的挑战之一。别急着两个维度都反应——先跟上「位置」，再慢慢叠加「颜色」；错了也没关系，出错会让大脑练得更强。',
    start(root, onDone, setStatus) {
      // 生成序列：每个刺激 {pos, color}；尽量让"位置相同"与"颜色相同"不重叠，减少歧义
      const seq = [];
      for (let i = 0; i < TRIALS; i++) {
        let pos = U.ri(0, SIZE - 1);
        let color = COLORS[U.ri(0, COLORS.length - 1)];
        if (i >= N && Math.random() < 0.55) {
          if (Math.random() < 0.5) pos = seq[i - N].pos;
          else color = seq[i - N].color;
        }
        seq.push({ pos, color });
      }
      const posTargets = new Set(), colorTargets = new Set();
      for (let i = N; i < TRIALS; i++) {
        if (seq[i].pos === seq[i - N].pos) posTargets.add(i);
        if (seq[i].color === seq[i - N].color) colorTargets.add(i);
      }

      let idx = 0, right = 0, missTurn = 0;
      let timers = [];
      const cells = [];

      root.innerHTML = `
        <div class="nback-head">
          <div class="nb-left"><span class="nb-n">n=${N}</span><span class="nb-prog" id="nb-prog">第 1 / ${TRIALS} 步</span></div>
          <div class="nb-right" id="nb-right">0</div>
        </div>
        <div class="nb-grid" id="nb-grid"></div>
        <div class="nb-note" id="nb-note">准备…</div>
        <div class="nb-btns">
          <button class="nb-btn pos" id="nb-pos">位置</button>
          <button class="nb-btn col" id="nb-col">颜色</button>
        </div>`;

      const grid = root.querySelector('#nb-grid');
      for (let i = 0; i < SIZE; i++) { const c = document.createElement('div'); c.className = 'nb-cell'; grid.appendChild(c); cells.push(c); }
      const progEl = root.querySelector('#nb-prog');
      const rightEl = root.querySelector('#nb-right');
      const noteEl = root.querySelector('#nb-note');
      const posBtn = root.querySelector('#nb-pos');
      const colBtn = root.querySelector('#nb-col');

      function draw(i) {
        const s = seq[i];
        cells.forEach(c => { c.style.background = 'transparent'; });
        cells[s.pos].style.background = s.color;
      }

      function next() {
        if (idx >= TRIALS) { finish(); return; }
        draw(idx);
        noteEl.textContent = idx >= N ? '若位置与 n 步前相同点「位置」，颜色相同点「颜色」' : '先看，记住位置和颜色';
        progEl.textContent = `第 ${idx + 1} / ${TRIALS} 步`;
        idx++;
        const t = setTimeout(next, idx === 1 ? 1800 : 1550);
        timers.push(t);
      }

      function respond(kind) {
        const trial = idx - 1;
        if (trial < 0) return;
        const expect = kind === 'pos' ? posTargets.has(trial) : colorTargets.has(trial);
        if (expect) right++;
        else missTurn++;
        rightEl.textContent = right;
        const btn = kind === 'pos' ? posBtn : colBtn;
        btn.classList.add(expect ? 'correct' : 'miss');
        setTimeout(() => btn.classList.remove('correct', 'miss'), 240);
        if (expect) SFX.good(); else SFX.bad();
      }
      posBtn.addEventListener('click', () => respond('pos'));
      colBtn.addEventListener('click', () => respond('col'));

      function finish() {
        const acc = Math.round(right * 100 / TRIALS);
        const score = U.clamp(acc, 0, 100);
        setStatus(`${right}/${TRIALS} 正确`);
        onDone({ score, detail: `${right}/${TRIALS} 正确 · 按错 ${missTurn} 次`, extra: { lvl: Math.max(1, Math.round(acc / 25)) } });
      }

      timers.push(setTimeout(next, 900));
      return function cleanup() { timers.forEach(clearTimeout); };
    }
  };
})();
