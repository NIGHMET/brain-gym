// 双人翻牌对战 —— 同设备双人轮流对战。
// 两人轮流翻牌：配对成功得 1 分并继续翻；翻错换对方。全部配完后分高者胜。
(function () {
  const SYMS = ['🍓', '🌙', '⭐', '🍀', '🐳', '🌸', '🍎', '🌈'];
  const N_PAIRS = 6;
  GAMES.duel = {
    name: '双人翻牌',
    desc: '和 TA 轮流翻牌，配对得分，分高者胜',
    emoji: '⚔️',
    hue: '#4f8ef7',
    tip: '两人轮流翻牌：配对成功得 1 分并继续翻；翻错就换对方。记住牌的位置，轮到你时一击即中。',
    start(root, onDone, setStatus) {
      const deck = (function () {
        const arr = [];
        for (let i = 0; i < N_PAIRS; i++) arr.push(SYMS[i]);
        const dd = arr.concat(arr);
        for (let i = dd.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const t = dd[i]; dd[i] = dd[j]; dd[j] = t;
        }
        return dd;
      })();
      const score = [0, 0];
      let turn = 0;
      let matched = 0, moves = 0, lock = false, first = null, timer = null;
      root.innerHTML = `
        <div class="duel-head">
          <div class="duel-player ${turn === 0 ? 'active' : ''}" data-p="0">
            <span class="duel-tag">A</span>
            <b id="duel-a">0</b>
          </div>
          <div class="duel-vs">VS</div>
          <div class="duel-player ${turn === 1 ? 'active' : ''}" data-p="1">
            <span class="duel-tag">B</span>
            <b id="duel-b">0</b>
          </div>
        </div>
        <p class="hint" id="duel-turn">轮到 <b>A</b> 翻牌</p>
        <div class="duel-grid"></div>`;
      const grid = root.querySelector('.duel-grid');
      const pEls = [root.querySelector('#duel-a'), root.querySelector('#duel-b')];
      const turnEl = root.querySelector('#duel-turn');
      deck.forEach(sym => {
        const el = document.createElement('button');
        el.className = 'mcard';
        el.dataset.sym = sym;
        el.innerHTML = `<span class="mback">?</span><span class="mface">${sym}</span>`;
        grid.appendChild(el);
      });
      function renderTurn() {
        root.querySelectorAll('.duel-player').forEach(p => p.classList.toggle('active', +p.dataset.p === turn));
        turnEl.innerHTML = `轮到 <b>${turn === 0 ? 'A' : 'B'}</b> 翻牌`;
      }
      function resolvePair() {
        const open = [...root.querySelectorAll('.mcard.open:not(.ok)')];
        if (open.length !== 2) return;
        const [a, b] = open;
        if (a.dataset.sym === b.dataset.sym) {
          a.classList.add('ok'); b.classList.add('ok');
          score[turn]++;
          pEls[turn].textContent = score[turn];
          matched++;
          SFX.good();
          if (matched === N_PAIRS) {
            const tie = score[0] === score[1];
            const winner = tie ? 0 : (score[0] > score[1] ? 0 : 1);
            const scoreVal = U.clamp(Math.round((score[winner] / N_PAIRS) * 100 + (tie ? 50 : 0)), 40, 100);
            setStatus(tie ? '平局！' : `玩家 ${winner === 0 ? 'A' : 'B'} 获胜！`);
            timer = setTimeout(() => onDone({
              score: scoreVal,
              detail: tie ? `平局 ${score[0]} : ${score[1]}` : `A ${score[0]} : B ${score[1]}，${winner === 0 ? 'A' : 'B'} 获胜`,
              extra: { duel: true, winner: tie ? -1 : winner, sA: score[0], sB: score[1] }
            }), 700);
          }
        } else {
          lock = true;
          a.classList.add('wrong'); b.classList.add('wrong');
          SFX.bad();
          timer = setTimeout(() => {
            a.classList.remove('open', 'wrong'); b.classList.remove('open', 'wrong');
            lock = false;
            turn = 1 - turn;
            renderTurn();
          }, 700);
        }
        first = null;
      }
      grid.addEventListener('click', e => {
        const el = e.target.closest('.mcard');
        if (!el || lock || el.classList.contains('ok') || el.classList.contains('open')) return;
        el.classList.add('open');
        if (first) {
          moves++;
          resolvePair();
        } else {
          first = el;
        }
      });
      renderTurn();
      setStatus('轮流翻牌，配对得分');
      return function cleanup() { if (timer) clearTimeout(timer); };
    }
  };
})();
