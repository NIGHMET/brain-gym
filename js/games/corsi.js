// 位置记忆 —— 改编自 Corsi 积木测验（经典工作记忆/视空间广度测评）
GAMES.corsi = {
  name: '位置记忆',
  emoji: '🧠',
  hue: '#b8a9e8',
  desc: '方块按顺序亮起，凭记忆点回去',
  tip: '把方块连成一条小路，在心里"走"一遍；或按左右两半分组记，比逐个死记牢得多。',
  start(root, onDone, setStatus) {
    const timers = [];
    const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
    const sk = DB.skill('corsi');
    let span = sk.lvl && sk.lvl >= 3 ? sk.lvl : 3; // 从上次水平附近开始
    let seq = [], idx = 0, fails = 0, trials = 0, maxSpan = 0, phase = 'idle';

    root.appendChild(U.h('div', 'corsi-status', '<b id="cs-main">准备好了吗？</b><span id="cs-sub">方块会按顺序亮起</span>'));
    const grid = U.h('div', 'corsi-grid');
    const cells = [];
    for (let i = 0; i < 16; i++) {
      const c = U.h('button', 'corsi-cell');
      c.dataset.i = i;
      grid.appendChild(c);
      cells.push(c);
    }
    root.appendChild(grid);
    const startBtn = U.h('button', 'btn big', '开始');
    root.appendChild(startBtn);

    cells.forEach(c => c.addEventListener('click', () => tap(+c.dataset.i)));

    function flash(i, cls) {
      cells[i].classList.add(cls);
      later(() => cells[i].classList.remove(cls), 260);
    }

    function trial() {
      phase = 'show';
      seq = [];
      let last = -1;
      for (let k = 0; k < span; k++) {
        let n;
        do { n = U.ri(0, 15); } while (n === last);
        seq.push(n); last = n;
      }
      idx = 0;
      document.getElementById('cs-main').textContent = `记住顺序（${span} 个）`;
      document.getElementById('cs-sub').textContent = `第 ${trials + 1} 轮`;
      setStatus(`广度 ${span}`);
      seq.forEach((n, k) => later(() => {
        cells[n].classList.add('lit');
        SFX.tap();
        later(() => cells[n].classList.remove('lit'), 480);
      }, 500 + k * 760));
      later(() => { phase = 'input'; document.getElementById('cs-main').textContent = '按顺序点出来！'; }, 500 + span * 760);
    }

    function tap(i) {
      if (phase !== 'input') return;
      if (i === seq[idx]) {
        SFX.pop();
        flash(i, 'good');
        idx++;
        if (idx === seq.length) {
          phase = 'wait';
          SFX.good();
          maxSpan = Math.max(maxSpan, span);
          trials++;
          span++;
          later(trial, 800);
        }
      } else {
        SFX.bad();
        flash(i, 'badflash');
        fails++;
        trials++;
        phase = 'wait';
        if (fails >= 2) later(end, 700);
        else later(trial, 900); // 同长度重试
      }
    }

    function end() {
      phase = 'over';
      const score = U.clamp(Math.round((maxSpan - 2) * 16.7), 0, 100);
      onDone({ score, detail: `记忆广度 ${maxSpan}`, extra: { lvl: Math.max(3, maxSpan - 1) } });
    }

    startBtn.addEventListener('click', () => { startBtn.remove(); trial(); });

    return function cleanup() { timers.forEach(clearTimeout); };
  }
};
