// 瞬间眼力 —— UFOV（有用视野）式加工速度训练
// ACTIVE 试验中证据最强的训练类型：用余光在极短时间内定位目标
GAMES.flash = {
  name: '瞬间眼力',
  emoji: '⚡',
  hue: '#f7b733',
  desc: '盯住中心，用余光抓住一闪而过的目标',
  tip: '眼睛始终盯住中间的十字，别转动！感受目标在哪个方向"亮"了一下，再点那个位置。',
  start(root, onDone, setStatus) {
    const timers = [];
    const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
    const sk = DB.skill('flash');
    const TOTAL = 15;
    let D = U.clamp(sk.lvl || 500, 200, 560); // 闪现毫秒数，越练越短
    let trial = 0, correct = 0, phase = 'wait';

    const stage = U.h('div', 'ff-stage', '<div class="ff-cross">✛</div>');
    const dots = [];
    for (let i = 0; i < 8; i++) {
      const a = (i * 45 - 90) * Math.PI / 180;
      const d = U.h('button', 'ff-dot');
      d.style.left = `${50 + 36 * Math.cos(a)}%`;
      d.style.top = `${50 + 36 * Math.sin(a)}%`;
      d.dataset.i = i;
      stage.appendChild(d);
      dots.push(d);
      d.addEventListener('click', () => pick(i));
    }
    root.appendChild(stage);
    root.appendChild(U.h('div', 'ff-note', '目标会闪现一次，点它出现过的位置'));

    let target = -1;
    function doTrial() {
      phase = 'show';
      target = U.ri(0, 7);
      setStatus(`${trial + 1}/${TOTAL} · ${Math.round(D)}ms`);
      dots[target].classList.add('target');
      later(() => {
        dots.forEach(d => d.classList.add('mask')); // 遮罩消除视觉暂留
        later(() => {
          dots.forEach(d => d.classList.remove('mask', 'target'));
          phase = 'input';
        }, 220);
      }, D);
    }

    function pick(i) {
      if (phase !== 'input') return;
      phase = 'wait';
      trial++;
      if (i === target) { correct++; SFX.pop(); D = Math.max(130, D - 40); }
      else { SFX.bad(); D = Math.min(600, D + 70); }
      dots[i].classList.add(i === target ? 'good' : 'badflash');
      dots[target].classList.add('good');
      later(() => {
        dots.forEach(d => d.classList.remove('good', 'badflash', 'target'));
        if (trial >= TOTAL) end(); else later(doTrial, 350);
      }, 380);
    }

    function end() {
      phase = 'over';
      const acc = correct / TOTAL;
      const durScore = U.clamp(Math.round((560 - D) / 4.3), 0, 100);
      const score = U.clamp(Math.round(durScore * (0.5 + 0.5 * acc)), 0, 100);
      onDone({
        score,
        detail: `闪现 ${Math.round(D)}ms · 命中 ${correct}/${TOTAL}`,
        extra: { lvl: Math.round(D) }
      });
    }

    later(doTrial, 600);
    return function cleanup() { timers.forEach(clearTimeout); };
  }
};
