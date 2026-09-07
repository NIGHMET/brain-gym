// 双人翻牌对战 v2 —— 同设备双人轮流对战。
// v2 改进：难度选择（6/8/10 对）、对局计时、连击统计、换人动画、配对弹跳反馈、更丰富的结算信息、平局独立判定。
// 两人轮流翻牌：配对成功得 1 分并继续翻；翻错换对方。全部配完后分高者胜。
(function () {
  const SYMS = ['🍓', '🌙', '⭐', '🍀', '🐳', '🌸', '🍎', '🌈', '🍊', '🎈'];
  const LEVELS = [
    { pairs: 6,  label: '轻松 · 6 对',  cols: 4 },
    { pairs: 8,  label: '标准 · 8 对',  cols: 4 },
    { pairs: 10, label: '挑战 · 10 对', cols: 5 },
  ];
  const NAMES = ['A', 'B'];

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function fmt(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  GAMES.duel = {
    name: '双人翻牌',
    desc: '和 TA 轮流翻牌，配对得分，分高者胜',
    emoji: '⚔️',
    hue: '#4f8ef7',
    tip: '两人轮流翻牌：配对成功得 1 分并继续翻；翻错就换对方。连续配对触发连击，记住牌的位置，轮到你时一击即中。',
    start(root, onDone, setStatus) {
      let level = LEVELS[0];
      const score = [0, 0];
      const bestCombo = [0, 0];
      let combo = 0;
      let turn = 0;
      let matched = 0, moves = 0, lock = false, first = null, over = false;
      let timer = null, ticker = null, t0 = 0;

      let grid = null, turnEl = null, timeEl = null, movesEl = null, pEls = [];

      /* ---------- 设置页：难度选择 ---------- */
      root.innerHTML =
        '<div class="duel-setup">' +
          '<p class="hint">选择本局难度。两人轮流翻牌：配对成功得 1 分并继续，翻错换对方；全部配完分高者胜。</p>' +
          '<div class="duel-chips"></div>' +
          '<button class="btn" id="duel-go" type="button">开始对局</button>' +
        '</div>';
      const chipsEl = root.querySelector('.duel-chips');
      LEVELS.forEach(function (lv, i) {
        const c = document.createElement('button');
        c.type = 'button';
        c.className = 'rec-chip' + (i === 0 ? ' chosen' : '');
        c.textContent = lv.label;
        c.addEventListener('click', function () {
          level = lv;
          chipsEl.querySelectorAll('.rec-chip').forEach(function (x) { x.classList.remove('chosen'); });
          c.classList.add('chosen');
        });
        chipsEl.appendChild(c);
      });
      setStatus('选择难度，开始对战');
      root.querySelector('#duel-go').addEventListener('click', begin);

      function begin() {
        const arr = [];
        for (let i = 0; i < level.pairs; i++) arr.push(SYMS[i]);
        const deck = shuffle(arr.concat(arr));

        root.innerHTML =
          '<div class="duel-head">' +
            '<div class="duel-player active" data-p="0"><span class="duel-tag">A</span><b id="duel-a">0</b></div>' +
            '<div class="duel-vs">VS</div>' +
            '<div class="duel-player" data-p="1"><span class="duel-tag">B</span><b id="duel-b">0</b></div>' +
          '</div>' +
          '<div class="duel-bar"><span id="duel-time">0:00</span><span id="duel-moves">回合 0</span></div>' +
          '<p class="hint duel-turn" id="duel-turn">轮到 <b>A</b> 翻牌</p>' +
          '<div class="duel-grid' + (level.cols === 5 ? ' cols5' : '') + '"></div>';

        grid = root.querySelector('.duel-grid');
        turnEl = root.querySelector('#duel-turn');
        timeEl = root.querySelector('#duel-time');
        movesEl = root.querySelector('#duel-moves');
        pEls = [root.querySelector('#duel-a'), root.querySelector('#duel-b')];

        deck.forEach(function (sym) {
          const el = document.createElement('button');
          el.type = 'button';
          el.className = 'mcard';
          el.dataset.sym = sym;
          el.innerHTML = '<span class="mback">?</span><span class="mface">' + sym + '</span>';
          grid.appendChild(el);
        });

        t0 = Date.now();
        ticker = setInterval(function () { timeEl.textContent = fmt(Date.now() - t0); }, 1000);
        grid.addEventListener('click', onCard);
        setStatus('轮流翻牌，配对得分');
      }

      function renderTurn(switched) {
        root.querySelectorAll('.duel-player').forEach(function (p) {
          p.classList.toggle('active', +p.dataset.p === turn);
        });
        const fire = combo >= 2 ? ' <span class="duel-fire">🔥 连击 ×' + combo + '</span>' : '';
        turnEl.innerHTML = '轮到 <b>' + NAMES[turn] + '</b> 翻牌' + fire;
        if (switched) {
          turnEl.classList.remove('flash');
          void turnEl.offsetWidth;
          turnEl.classList.add('flash');
        }
      }

      function onCard(e) {
        const el = e.target.closest('.mcard');
        if (!el || lock || over || el.classList.contains('ok') || el.classList.contains('open')) return;
        el.classList.add('open');
        if (first) {
          moves++;
          movesEl.textContent = '回合 ' + moves;
          resolvePair(el);
        } else {
          first = el;
        }
      }

      function resolvePair(second) {
        const a = first, b = second;
        if (a.dataset.sym === b.dataset.sym) {
          a.classList.add('ok', 'pop');
          b.classList.add('ok', 'pop');
          combo++;
          if (combo > bestCombo[turn]) bestCombo[turn] = combo;
          score[turn]++;
          pEls[turn].textContent = score[turn];
          matched++;
          SFX.good();
          if (matched === level.pairs) { first = null; return finish(); }
          renderTurn(false);
        } else {
          lock = true;
          a.classList.add('wrong');
          b.classList.add('wrong');
          SFX.bad();
          combo = 0;
          timer = setTimeout(function () {
            a.classList.remove('open', 'wrong');
            b.classList.remove('open', 'wrong');
            lock = false;
            turn = 1 - turn;
            renderTurn(true);
          }, 750);
        }
        first = null;
      }

      function finish() {
        over = true;
        if (ticker) { clearInterval(ticker); ticker = null; }
        const elapsed = Date.now() - t0;
        timeEl.textContent = fmt(elapsed);
        const tie = score[0] === score[1];
        const winner = tie ? -1 : (score[0] > score[1] ? 0 : 1);
        const winPairs = tie ? score[0] : score[winner];
        // 与成就线「双人默契 · 60 分」兼容：胜者配对率映射 40–100，平局保底 +50。
        const scoreVal = U.clamp(Math.round((winPairs / level.pairs) * 100 + (tie ? 50 : 0)), 40, 100);
        const timeStr = fmt(elapsed);
        const comboStr = '最高连击 A×' + bestCombo[0] + ' · B×' + bestCombo[1];
        setStatus(tie ? '平局！' : '玩家 ' + NAMES[winner] + ' 获胜！');
        const detail = tie
          ? '平局 ' + score[0] + ' : ' + score[1] + ' · 用时 ' + timeStr + ' · ' + comboStr
          : 'A ' + score[0] + ' : B ' + score[1] + '，' + NAMES[winner] + ' 获胜 · 用时 ' + timeStr + ' · ' + comboStr;
        timer = setTimeout(function () {
          onDone({
            score: scoreVal,
            detail: detail,
            extra: {
              duel: true,
              winner: winner,
              sA: score[0],
              sB: score[1],
              pairs: level.pairs,
              moves: moves,
              time: elapsed,
              comboA: bestCombo[0],
              comboB: bestCombo[1],
            },
          });
        }, 900);
      }

      return function cleanup() {
        if (timer) clearTimeout(timer);
        if (ticker) clearInterval(ticker);
      };
    },
  };
})();
