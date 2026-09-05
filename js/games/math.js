// 闪电心算 —— 口算流畅度训练，难度自适应
GAMES.math = {
  name: '闪电心算',
  emoji: '🔢',
  hue: '#7fd8be',
  desc: '60 秒限时口算，连对自动升级',
  tip: '凑十法：8+7 想 8+2+5；两位数加减从高位往低位算，更快也更稳。',
  start(root, onDone, setStatus) {
    const sk = DB.skill('math');
    let level = U.clamp(sk.lvl || 1, 1, 8);
    let correct = 0, errors = 0, streak = 0, missStreak = 0, over = false;
    let a = 0, b = 0, c = 0, ans = 0, expr = '';

    root.appendChild(U.h('div', 'math-stage',
      `<div class="math-level" id="mt-lv">第 ${level} 关</div>
       <div class="math-expr" id="mt-expr"></div>
       <div class="math-in" id="mt-in">?</div>`));
    const pad = U.h('div', 'math-pad');
    ['1','2','3','4','5','6','7','8','9','⌫','0','OK'].forEach(k => {
      const b = U.h('button', 'math-key' + (k === 'OK' ? ' ok' : ''), k);
      b.addEventListener('click', () => key(k));
      pad.appendChild(b);
    });
    root.appendChild(pad);

    let input = '';
    function render() {
      document.getElementById('mt-in').textContent = input || '?';
      document.getElementById('mt-lv').textContent = `第 ${level} 关${streak >= 2 ? ` · 连对 ${streak}` : ''}`;
    }

    function gen() {
      const L = level;
      if (L === 1) { a = U.ri(1, 9); b = U.ri(1, 9); if (Math.random() < 0.5 && a > b) { ans = a - b; expr = `${a}−${b}`; } else { ans = a + b; expr = `${a}+${b}`; } }
      else if (L === 2) { a = U.ri(5, 19); b = U.ri(2, 15); if (Math.random() < 0.5 && a > b) { ans = a - b; expr = `${a}−${b}`; } else { ans = a + b; expr = `${a}+${b}`; } }
      else if (L === 3) { a = U.ri(15, 89); b = U.ri(3, 9); if (Math.random() < 0.5 && a > b) { ans = a - b; expr = `${a}−${b}`; } else { ans = a + b; expr = `${a}+${b}`; } }
      else if (L === 4) { a = U.ri(21, 89); b = U.ri(11, 59); if (Math.random() < 0.5 && a > b) { ans = a - b; expr = `${a}−${b}`; } else { ans = a + b; expr = `${a}+${b}`; } }
      else if (L === 5) { a = U.ri(3, 9); b = U.ri(3, 9); ans = a * b; expr = `${a}×${b}`; }
      else if (L === 6) { a = U.ri(3, 9); b = U.ri(3, 9); c = U.ri(3, 25); ans = a * b + c; expr = `${a}×${b}+${c}`; }
      else if (L === 7) { a = U.ri(2, 9); b = U.ri(2, 9); c = U.ri(2, 5); ans = (a + b) * c; expr = `(${a}+${b})×${c}`; }
      else { if (Math.random() < 0.5) { a = U.ri(12, 29); b = U.ri(3, 8); ans = a * b; expr = `${a}×${b}`; } else { a = U.ri(2, 8); b = U.ri(2, 6); c = U.ri(2, 20); ans = a * b + c; expr = `${a}×${b}+${c}`; } }
      document.getElementById('mt-expr').textContent = expr;
      input = '';
      render();
    }

    function key(k) {
      if (over) return;
      if (k === '⌫') { input = input.slice(0, -1); render(); return; }
      if (k === 'OK') { submit(); return; }
      if (input.length < 4) { input += k; render(); }
    }

    function submit() {
      if (!input) return;
      if (+input === ans) {
        correct++; streak++; missStreak = 0;
        SFX.pop();
        if (streak > 0 && streak % 3 === 0 && level < 8) { level++; toast(`升到第 ${level} 关！`); }
        gen();
      } else {
        errors++; streak = 0; missStreak++;
        SFX.bad();
        if (missStreak >= 2 && level > 1) { level--; missStreak = 0; toast(`降到第 ${level} 关，稳住`); }
        document.getElementById('mt-in').classList.add('shake');
        setTimeout(() => document.getElementById('mt-in').classList.remove('shake'), 300);
        input = '';
        render();
      }
    }

    let toastT = null;
    function toast(msg) {
      let t = document.getElementById('mt-toast');
      if (!t) { t = U.h('div', 'toast'); t.id = 'mt-toast'; root.appendChild(t); }
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(toastT);
      toastT = setTimeout(() => t.classList.remove('show'), 1400);
    }

    let left = 60;
    setStatus(`${left}s`);
    const tick = setInterval(() => {
      left--;
      setStatus(`${left}s`);
      if (left <= 0) end();
    }, 1000);

    function end() {
      if (over) return;
      over = true;
      clearInterval(tick);
      clearTimeout(toastT);
      const score = U.clamp(Math.round(correct * 4.2 + (level - 1) * 4), 0, 100);
      onDone({ score, detail: `答对 ${correct} 题 · 到达第 ${level} 关`, extra: { lvl: level } });
    }

    gen();
    return function cleanup() { clearInterval(tick); clearTimeout(toastT); };
  }
};
