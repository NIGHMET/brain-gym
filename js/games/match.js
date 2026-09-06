// 翻牌配对 —— 经典记忆配对游戏。
// 翻开卡片找出成对。练：视觉工作记忆 / 空间记忆检索。
// 支持「用你们的照片当牌面」：在「我的」里选好照片后，牌面换成照片。
(function () {
  const SYMS = ['🍓', '🌙', '⭐', '🍀', '🐳', '🌸', '🍎', '🌈'];
  const N_PAIRS = 6; // 12 张牌 = 6 对

  GAMES.match = {
    name: '翻牌配对',
    desc: '翻开卡片，找到一样的搭档',
    emoji: '🃏',
    hue: '#e8864b',
    tip: '先翻开几张记住位置，第二次翻到就能凭位置找到对家。把牌分成左右两半记，比逐个死记快得多。',
    start(root, onDone, setStatus) {
      let moves = 0, matched = 0, lock = false;
      let first = null, timer = null;

      const photos = (DB.s.pairs || []).slice(0, N_PAIRS);
      const usePhoto = photos.length === N_PAIRS;
      const deckRaw = usePhoto
        ? photos.concat(photos)
        : (function () { const arr = []; for (let i = 0; i < N_PAIRS; i++) arr.push(SYMS[i]); return arr.concat(arr); })();

      const deck = deckRaw.map((v, i) => ({ v: v, pair: i % N_PAIRS }));
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = deck[i]; deck[i] = deck[j]; deck[j] = t; }

      root.innerHTML = `
        <div class="match-head">
          <div class="match-stats"><span>配对 <b id="m-done">0</b>/${N_PAIRS}</span><span>翻牌 <b id="m-moves">0</b></span></div>
          <div class="match-level">每步都算数，步数越少分越高</div>
        </div>
        ${usePhoto ? '<p class="hint">❤️ 已用你们的照片当牌面</p>' : ''}
        <div class="match-grid"></div>`;

      const grid = root.querySelector('.match-grid');
      deck.forEach(card => {
        const el = document.createElement('button');
        el.className = 'mcard';
        el.dataset.pair = card.pair;
        const face = usePhoto
          ? `<img class="mimg" src="${U.esc(card.v)}" alt="">`
          : `<span class="msym">${card.v}</span>`;
        el.innerHTML = `<span class="mback">${usePhoto ? '💗' : '?'}</span><span class="mface">${face}</span>`;
        grid.appendChild(el);
      });

      const doneEl = root.querySelector('#m-done');
      const movesEl = root.querySelector('#m-moves');
      setStatus('翻一对试试');

      function resolvePair() {
        const open = [...root.querySelectorAll('.mcard.open:not(.ok)')];
        if (open.length !== 2) return;
        const [a, b] = open;
        if (a.dataset.pair === b.dataset.pair) {
          a.classList.add('ok'); b.classList.add('ok');
          matched++;
          doneEl.textContent = matched;
          SFX.good();
          if (matched === N_PAIRS) {
            const score = U.clamp(Math.round(100 - Math.max(0, moves - N_PAIRS) * 9), 30, 100);
            setStatus('全部配对！');
            timer = setTimeout(() => onDone({ score, detail: `用了 ${moves} 步配完 ${N_PAIRS} 对`, extra: { lvl: Math.max(1, Math.round(100 / Math.max(moves, N_PAIRS))) } }), 700);
          }
        } else {
          lock = true;
          a.classList.add('wrong'); b.classList.add('wrong');
          SFX.bad();
          timer = setTimeout(() => { a.classList.remove('open', 'wrong'); b.classList.remove('open', 'wrong'); lock = false; }, 700);
        }
        first = null;
      }

      grid.addEventListener('click', e => {
        const el = e.target.closest('.mcard');
        if (!el || lock || el.classList.contains('ok') || el.classList.contains('open')) return;
        el.classList.add('open');
        if (first) {
          moves++;
          movesEl.textContent = moves;
          resolvePair();
        } else {
          first = el;
        }
      });

      return function cleanup() { if (timer) clearTimeout(timer); };
    }
  };
})();
