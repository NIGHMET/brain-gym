// UI 层：页面渲染 / 游戏调度 / 结算
(function () {
  const $ = s => document.querySelector(s);
  const SHORT = { corsi: '记忆', stroop: '反应', flash: '专注', math: '计算', matrix: '逻辑' };
  let curGame = null, cleanupGame = null, lastTab = 'today';

  const TIPS = [
    '训练效果是"练哪强哪"——每个游戏都在点亮不同的技能树，别偏科哦。',
    '难度刚好"跳一跳够得着"时，大脑学习效率最高。太简单或太难？它自己会调。',
    '有氧运动 30 分钟对大脑的好处，可能比多做一局游戏更大——今天散步了吗？',
    '记忆的诀窍是"加工深度"：把数字变成画面或小故事，好过死记硬背。',
    '睡眠是记忆的保存键，熬夜训练等于白练一半。',
    '学全新技能（新语言、新菜、新舞）给大脑的刺激比重复游戏更猛，周末试试？',
    '反应速度类训练在 10 年随访研究中证据最硬，别跳过「瞬间眼力」。',
    '想记住一串东西，试着分成 3 个一组——工作记忆的容量就这么大。',
    '每天 5 分钟就好，贵在天天来。连击数是送给你自己的小奖励。',
    '跟人聊天也是脑力活动，社交活跃的大脑老得慢。',
    '喝水！脱水 2% 就能让注意力和记忆力打折扣。',
    '换只手刷牙、走条新路线回家——新鲜感是大脑的肥料。',
    '出错是好事：错误驱动学习，卡过壳的题记得最牢。',
    '训练前深呼吸一分钟，专注力会更在线。'
  ];

  // ---------- 小组件 ----------
  const starStr = n => '★'.repeat(n) + '☆'.repeat(3 - n);

  function radarSVG(vals) {
    const cx = 130, cy = 122, R = 84;
    const pt = (i, r) => { const a = (i * 72 - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    let rings = '';
    [0.25, 0.5, 0.75, 1].forEach(f => {
      rings += `<polygon points="${GAME_ORDER.map((g, i) => pt(i, R * f).map(v => v.toFixed(1)).join(',')).join(' ')}" fill="none" style="stroke:var(--line)" stroke-width="1"/>`;
    });
    let axes = '';
    GAME_ORDER.forEach((g, i) => { const [x, y] = pt(i, R); axes += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" style="stroke:var(--line)"/>`; });
    const rr = GAME_ORDER.map(g => R * Math.max(vals[g], 3) / 100);
    const data = GAME_ORDER.map((g, i) => pt(i, rr[i]).map(v => v.toFixed(1)).join(',')).join(' ');
    const dots = GAME_ORDER.map((g, i) => { const [x, y] = pt(i, rr[i]); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#ff8a5c"/>`; }).join('');
    const labels = GAME_ORDER.map((g, i) => { const [x, y] = pt(i, R + 22); return `<text x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}" text-anchor="middle" class="radar-label">${SHORT[g]} ${vals[g] || ''}</text>`; }).join('');
    return `<svg viewBox="0 0 260 240" class="radar">${rings}${axes}<polygon points="${data}" fill="rgba(255,138,92,.25)" stroke="#ff8a5c" stroke-width="2"/>${dots}${labels}</svg>`;
  }

  function sparkSVG(hist) {
    const data = hist.slice(-30);
    if (!data.length) return '<div class="empty">还没有记录，去玩一局吧</div>';
    const w = 300, h = 56, pad = 5;
    const pts = data.map((d, i) => {
      const x = data.length === 1 ? w / 2 : pad + i * (w - 2 * pad) / (data.length - 1);
      const y = h - pad - (d[1] / 100) * (h - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="spark"><polyline points="${pts}" fill="none" stroke="#ff8a5c" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }

  function calendarHTML() {
    let cells = '';
    for (let i = 27; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = U.todayStr(d);
      const plan = DB.plan(ds).length, done = DB.dayDone(ds);
      let cls = 'cal-cell';
      if (done >= plan) cls += ' full'; else if (done > 0) cls += ' half';
      if (i === 0) cls += ' today';
      cells += `<div class="${cls}">${done >= plan ? '✓' : d.getDate()}</div>`;
    }
    return `<div class="cal-grid">${cells}</div>`;
  }

  function confetti(host) {
    const colors = ['#ff8a5c', '#ffd166', '#7fd8be', '#6fa8dc', '#b8a9e8', '#ff6b6b'];
    for (let i = 0; i < 30; i++) {
      const s = U.h('span', 'confetti');
      s.style.left = Math.random() * 100 + '%';
      s.style.background = U.pick(colors);
      s.style.animationDelay = (Math.random() * 0.6) + 's';
      s.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
      s.style.transform = `rotate(${Math.random() * 360}deg)`;
      host.appendChild(s);
      setTimeout(() => s.remove(), 3000);
    }
  }

  const greet = () => { const h = new Date().getHours(); return h < 5 ? '夜深了' : h < 11 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好'; };

  // ---------- 页面 ----------
  function bindGames(rootEl) {
    rootEl.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => openGame(b.dataset.g)));
  }

  function scrToday() {
    const s = DB.s, name = s.name || '宝贝';
    const today = U.todayStr();
    const plan = DB.plan(today);
    const doneN = DB.dayDone(today);
    const allDone = doneN >= plan.length;
    const streak = DB.streak();
    const dayIdx = Math.abs(U.diffDays(s.start, today));
    const tip = TIPS[dayIdx % TIPS.length];
    const el = $('#scr-today');
    el.innerHTML = `
      <header class="greet"><div class="hello">${greet()}，${U.esc(name)}</div><div class="sub">${U.fmtDate(today)} · 一起锻炼第 ${dayIdx + 1} 天</div></header>
      <section class="card streak-card">
        <div class="flame">🔥</div>
        <div class="streak-num"><b>${streak}</b><span>连续打卡</span></div>
        <div class="streak-right">${allDone ? '今日已完成 🎉' : `今日 ${doneN}/${plan.length}`}</div>
      </section>
      <section class="card">
        <h3>今日训练 <small>约 5 分钟 · 练哪强哪</small></h3>
        <div class="plan-list">${plan.map(g => `
          <button class="plan-item" data-g="${g}">
            <span class="pi-emoji" style="background:${GAMES[g].hue}22">${GAMES[g].emoji}</span>
            <span class="pi-txt"><b>${GAMES[g].name}</b><small>${GAMES[g].desc}</small></span>
            <span class="pi-state ${doneN ? '' : 'go'}">${(s.days[today] || { done: [] }).done.includes(g) ? '✓' : '开始'}</span>
          </button>`).join('')}</div>
        ${allDone ? '<div class="done-banner">今天的功课完成啦！想加练随时来 💪</div>' : ''}
      </section>
      <section class="card tip-card"><h3>🧪 科学小贴士</h3><p>${tip}</p></section>
      <section class="card"><h3>随时加练</h3><div class="chips">${GAME_ORDER.map(g => `<button class="chip" data-g="${g}">${GAMES[g].emoji} ${GAMES[g].name}</button>`).join('')}</div></section>`;
    bindGames(el);
  }

  function scrTrain() {
    const el = $('#scr-train');
    el.innerHTML = `
      <header class="greet"><div class="hello">训练馆 🎮</div><div class="sub">五个游戏 · 五块技能树</div></header>
      ${GAME_ORDER.map(g => {
      const G = GAMES[g], sk = DB.skill(g);
      return `
        <button class="card game-card" data-g="${g}">
          <span class="pi-emoji" style="background:${G.hue}22">${G.emoji}</span>
          <span class="gc-txt"><b>${G.name}</b><small>${G.desc}</small>
            <span class="gc-meta">${sk.best ? `最佳 ${sk.best} 分` : '未挑战'}${sk.lvl && (g === 'math' || g === 'matrix') ? ` · 难度 ${sk.lvl}` : ''}</span>
          </span>
          <span class="pi-state go">GO</span>
        </button>`;
    }).join('')}`;
    bindGames(el);
  }

  function scrProgress() {
    const vals = DB.radar();
    const el = $('#scr-progress');
    el.innerHTML = `
      <header class="greet"><div class="hello">进步看得见 📈</div><div class="sub">累计训练 ${DB.totalSessions()} 局</div></header>
      <section class="card"><h3>脑力五维 <small>近 7 天平均分</small></h3>${radarSVG(vals)}</section>
      <section class="card"><h3>打卡日历 <small>近 4 周</small></h3>${calendarHTML()}
        <div class="cal-legend"><span class="cal-cell full">✓</span>全部完成 <span class="cal-cell half">·</span>练了一点</div></section>
      ${GAME_ORDER.map(g => {
      const sk = DB.skill(g);
      return `<section class="card"><h3>${GAMES[g].emoji} ${GAMES[g].name} <small>${sk.best ? `最佳 ${sk.best} 分 · 最近 ${sk.last} 分` : '还没开始'}</small></h3>${sparkSVG(sk.hist)}</section>`;
    }).join('')}`;
  }

  function scrMe() {
    const s = DB.s;
    const el = $('#scr-me');
    el.innerHTML = `
      <header class="greet"><div class="hello">设置 ⚙️</div></header>
      <section class="card"><h3>称呼她</h3>
        <input id="name-in" class="name-in" maxlength="12" placeholder="耀耀" value="${U.esc(s.name)}">
        <p class="hint">开屏问候和成绩单都会用这个名字</p></section>
      <section class="card row"><span>🔊 音效</span><button id="sound-btn" class="toggle ${s.sound ? 'on' : ''}">${s.sound ? '开' : '关'}</button></section>
      <section class="card"><button class="link-btn" id="sci-btn">🔬 这个 App 为什么有效？</button></section>
      <section class="card"><button class="link-btn danger" id="reset-btn">重置全部数据</button></section>
      <p class="credit">为你定制 💗 脑力健身房 v1.0</p>`;
    $('#name-in').addEventListener('change', e => { s.name = e.target.value.trim(); DB.save(); });
    $('#sound-btn').addEventListener('click', e => {
      s.sound = !s.sound; DB.save();
      e.currentTarget.className = 'toggle' + (s.sound ? ' on' : '');
      e.currentTarget.textContent = s.sound ? '开' : '关';
    });
    $('#sci-btn').addEventListener('click', () => go('science'));
    $('#reset-btn').addEventListener('click', () => { if (confirm('确定清空所有训练记录吗？')) { DB.reset(); go('today'); } });
  }

  function scrScience() {
    const el = $('#scr-science');
    el.innerHTML = `
      <header class="greet"><button class="back-btn" id="sci-back">‹ 返回</button><div class="hello">这个 App 为什么有效？🔬</div></header>
      <section class="card"><p class="sci-lead">「脑训练」不是玄学，也不是魔法。下面是设计时参考的主要研究结论，以及它们如何变成了你手里的功能。</p></section>
      <section class="card"><h3>1️⃣ 练什么，强什么</h3><p>认知训练的提升是「领域特异」的。汇总几十年随机对照试验的大型综述（Butler 等, 2018；Simons 等, 2016）发现：记忆训练提升记忆、推理训练提升推理、速度训练提升速度，但"练方块游戏 → 全面变聪明"没有证据。所以这里 1:1 训练五个具体能力，而不是许诺泛泛的"变聪明"。</p></section>
      <section class="card"><h3>2️⃣ 速度训练的证据最硬</h3><p>ACTIVE 试验（2802 人随机分组）中，加工速度训练的收益在 10 年随访仍然可见；后续分析（Edwards 等, 2017）显示接受速度训练者痴呆发生风险更低。「瞬间眼力」就是该试验所用 UFOV 任务的简化版。</p></section>
      <section class="card"><h3>3️⃣ 记忆要"用策略"，不只是刷题</h3><p>记忆策略训练（联想、分组、图像化、路径法）在元分析中有中等效应（Gross 等, 2012；Chen 等, 2022），且效果能保持较久。所以每局位置记忆前都藏着一个小技巧。</p></section>
      <section class="card"><h3>4️⃣ 难度要"跳一跳够得着"</h3><p>自适应难度是训练起效的关键成分。这里每局都按表现升降难度：连对升级、连错降级，永远练在最舒适的"边缘"。</p></section>
      <section class="card"><h3>5️⃣ 坚持 > 时长</h3><p>ACTIVE 试验每天约 60–75 分钟、共 10 次就见效；日常版做法是每天 5 分钟、不断打卡。默认每天 3 局，配合连击记录，就是按这个逻辑来的。</p></section>
      <section class="card"><h3>6️⃣ 别指望"游戏变 IQ"</h3><p>工作记忆训练的元分析（Melby-Lervåg 等, 2016）发现：只有"练什么强什么"的近迁移，对智力测验没有可信的提升。所以我们不宣传"提升智商"，只追踪看得见的进步。</p></section>
      <section class="card"><h3>7️⃣ 大脑真正的补品在 App 外</h3><p>学习全新技能（Park 等, 2014）、有氧运动、睡眠和社交，对认知的证据同样强、甚至更强。科学小贴士会不定期提醒你。</p></section>
      <section class="card"><h3>诚实条款</h3><p>分数是训练追踪，不是医学测评；本 App 不能诊断、治疗或预防任何疾病。</p>
        <p class="refs">Ball et al. (2002) JAMA · Edwards et al. (2017) Alzheimer's &amp; Dementia: TRCI · Simons et al. (2016) Psychol. Sci. Public Interest · Butler et al. (2018) Ann. Intern. Med. · Melby-Lervåg et al. (2016) Perspect. Psychol. Sci. · Gross et al. (2012) Aging &amp; Mental Health · Park et al. (2014) Psychological Science · Cochrane CD012277 (2019)</p></section>`;
    $('#sci-back').addEventListener('click', () => go('me'));
  }

  // ---------- 游戏调度 ----------
  function openGame(id) {
    const g = GAMES[id];
    if (!g) return;
    curGame = id;
    lastTab = document.querySelector('.screen:not(.hidden)').id.replace('scr-', '') || 'today';
    $('#game-title').textContent = `${g.emoji} ${g.name}`;
    $('#game-status').textContent = '';
    $('#game-layer').style.setProperty('--gc', g.hue);
    $('#result-overlay').classList.add('hidden');
    $('#game-layer').classList.remove('hidden');
    runGame();
  }

  function runGame() {
    const g = GAMES[curGame];
    const root = $('#game-root');
    root.innerHTML = '';
    const seen = DB.s.tipsSeen[curGame];
    const tip = U.h('details', 'tip' + (seen ? '' : ' open'),
      `<summary>💡 小技巧（点我收起）</summary><p>${g.tip}</p>`);
    tip.addEventListener('toggle', () => { DB.s.tipsSeen[curGame] = true; DB.save(); });
    root.appendChild(tip);
    const play = U.h('div', 'play-area');
    root.appendChild(play);
    cleanupGame = g.start(play, finishGame, t => { $('#game-status').textContent = t; });
  }

  function finishGame(res) {
    if (cleanupGame) { const c = cleanupGame; cleanupGame = null; c(); }
    const newBest = DB.record(curGame, res.score, res.extra || {});
    showResult(res, newBest);
  }

  function showResult(res, newBest) {
    const g = GAMES[curGame];
    const sk = DB.skill(curGame);
    const ov = $('#result-overlay');
    ov.innerHTML = `<div class="result-card">
      <div class="r-emoji">${newBest ? '🎉' : res.score >= 60 ? '👍' : '🌱'}</div>
      <div class="r-score" style="color:${g.hue}">${res.score}</div>
      <div class="r-stars">${starStr(res.score >= 85 ? 3 : res.score >= 60 ? 2 : 1)}</div>
      <div class="r-detail">${U.esc(res.detail || '')}</div>
      <div class="r-best">${newBest ? '新纪录！超越了最好的自己' : `历史最佳 ${sk.best} 分`}</div>
      <div class="r-btns"><button class="btn" id="r-again">再来一次</button><button class="btn ghost" id="r-done">收下成绩</button></div>
    </div>`;
    ov.classList.remove('hidden');
    if (newBest) { confetti(ov); SFX.win(); } else if (res.score >= 60) SFX.good();
    $('#r-again').addEventListener('click', () => { ov.classList.add('hidden'); runGame(); });
    $('#r-done').addEventListener('click', closeGame);
  }

  function closeGame() {
    if (cleanupGame) { cleanupGame(); cleanupGame = null; }
    $('#game-root').innerHTML = '';
    $('#result-overlay').innerHTML = '';
    $('#game-layer').classList.add('hidden');
    $('#result-overlay').classList.add('hidden');
    go(['today', 'train', 'progress', 'me'].includes(lastTab) ? lastTab : 'today');
  }

  // ---------- 路由 ----------
  const SCREENS = { today: scrToday, train: scrTrain, progress: scrProgress, me: scrMe, science: scrScience };

  function go(name) {
    document.querySelectorAll('.screen').forEach(e => e.classList.add('hidden'));
    $('#scr-' + name).classList.remove('hidden');
    SCREENS[name]();
    document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('active', b.dataset.go === name));
    window.scrollTo(0, 0);
  }

  window.UI = { go, openGame, closeGame };
})();
