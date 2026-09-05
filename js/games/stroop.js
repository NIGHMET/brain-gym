// 颜色冲突 —— Stroop 任务（经典抑制控制/认知灵活性测评）
GAMES.stroop = {
  name: '颜色冲突',
  emoji: '🎨',
  hue: '#ff6b6b',
  desc: '别读字！只点文字显示的颜色',
  tip: '默念颜色名、别去读那个字。熟练后可以试试小声念出来，抑制"读字"冲动会越来越快。',
  start(root, onDone, setStatus) {
    const timers = [];
    const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
    const sk = DB.skill('stroop');
    const hard = sk.best >= 70;
    const COLORS = [
      { n: '红', c: '#ff5252' },
      { n: '绿', c: '#2ecc71' },
      { n: '蓝', c: '#4f9cf9' },
      { n: '黄', c: '#f7c948' }
    ];
    if (hard) COLORS.push({ n: '紫', c: '#b8a9e8' });
    const congruentP = hard ? 0.1 : 0.25; // 高手模式几乎全是不一致试次
    const DUR = 60;
    let correct = 0, errors = 0, rtSum = 0, rtN = 0, t0 = 0, locked = false, over = false;

    root.appendChild(U.h('div', 'stroop-stage', '<div id="st-word">？</div>'));
    const chips = U.h('div', 'stroop-chips');
    COLORS.forEach((col, i) => {
      const b = U.h('button', 'stroop-chip');
      b.style.background = col.c;
      b.setAttribute('aria-label', col.n);
      b.addEventListener('click', () => answer(i));
      chips.appendChild(b);
    });
    root.appendChild(chips);

    let left = DUR;
    setStatus(`${left}s`);
    const tick = setInterval(() => {
      left--;
      setStatus(`${left}s`);
      if (left <= 0) end();
    }, 1000);
    timers.push(tick);

    function next() {
      if (over) return;
      const ink = U.ri(0, COLORS.length - 1);
      const word = Math.random() < congruentP ? ink : U.ri(0, COLORS.length - 1);
      const w = document.getElementById('st-word');
      w.textContent = COLORS[word].n;
      w.style.color = COLORS[ink].c;
      w.classList.remove('pop-in');
      void w.offsetWidth; // 重启动画
      w.classList.add('pop-in');
      w.dataset.ink = ink;
      t0 = performance.now();
      locked = false;
    }

    function answer(i) {
      if (locked || over) return;
      locked = true;
      const ink = +document.getElementById('st-word').dataset.ink;
      rtSum += performance.now() - t0; rtN++;
      if (i === ink) { correct++; SFX.pop(); } else { errors++; SFX.bad(); }
      later(next, 220);
    }

    function end() {
      if (over) return;
      over = true;
      clearInterval(tick);
      const net = correct - errors * 1.5;
      const score = U.clamp(Math.round(net * 2.5), 0, 100);
      const avgRt = rtN ? Math.round(rtSum / rtN) : 0;
      onDone({
        score,
        detail: `答对 ${correct} · 答错 ${errors}${avgRt ? ` · 平均 ${(avgRt / 1000).toFixed(1)}s` : ''}`
      });
    }

    next();
    return function cleanup() { timers.forEach(clearTimeout); clearInterval(tick); };
  }
};
