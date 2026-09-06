// UI 层：页面渲染 / 游戏调度 / 结算 / 无障碍 / 照片配对
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

  function diffSVG(curve) {
    const data = curve.slice(-30);
    if (data.length < 2) return `<div class="empty">再练几次，就能看到难度曲线</div>`;
    const w = 300, h = 56, pad = 5;
    const pts = data.map((d, i) => {
      const x = pad + i * (w - 2 * pad) / (data.length - 1);
      const y = h - pad - (d[1] / 6) * (h - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="spark diff"><polyline points="${pts}" fill="none" stroke="#4fae9e" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }

  function calendarHTML() {
    let cells = '';
    for (let i = 27; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = U.todayStr(d);
      const plan = DB.plan(ds).length, done = DB.dayDone(ds);
      let cls = 'cal-cell';
      if (done >= plan) cls += ' full'; else if (done > 0) cls += ' half';
      cells += `<span class="${cls}">${done >= plan ? '✓' : done > 0 ? '·' : ''}</span>`;
    }
    return `<div class="cal">${cells}</div>`;
  }

  // ---------- 无障碍 ----------
  function applyA11y() {
    const s = DB.s;
    const val = s.ts || 1;
    document.documentElement.style.setProperty('--fs', val);
    document.documentElement.classList.toggle('hc', !!s.hc);
  }

  // ---------- 首页 ----------
  const GREET = () => {
    const h = new Date().getHours();
    return h < 6 ? '夜深了' : h < 12 ? '早安' : h < 18 ? '午后好' : '晚上好';
  };

  function scrToday() {
    const el = $('#scr-today');
    const today = U.todayStr();
    const plan = DB.plan(today);
    const done = DB.dayDone(today);
    const streak = DB.streak();
    const vibe = ['记忆', '反应', '专注', '计算', '逻辑'][U.diffDays(DB.s.start, today) % 5];
    const greetRow = `${['今天练', '动动脑', '来一局'][U.diffDays(DB.s.start, today) % 3]}`;
    const sub = done >= plan.length ? '今天的指标完成啦 🎉' : `还差 ${plan.length - done} 局完成今日计划`;
    el.innerHTML = `
      <header class="greet">
        <div class="hello">${GREET()}，${U.esc(DB.s.name || '耀耀')}</div>
        <div class="sub">${sub} · 连击 ${streak} 天</div>
      </header>
      <div class="streak-banner">
        <div class="streak-ic">${ICONS.ui.flame}</div>
        <div class="streak-tx"><b>连续 ${streak} 天</b><span>再坚持一下，保持热手状态</span></div>
      </div>
      <section class="card">
        <h3>今日主题 · ${vibe}</h3>
        <div class="today-items"></div>
      </section>
      <section class="card quote">
        <div class="quote-ic">${ICONS.ui.bulb}</div>
        <p>${U.ri(TIPS)}</p>
      </section>
      ${done >= plan.length
        ? `<section class="card done-card"><div class="done-ic">${ICONS.ui.medal}</div><p>今日全部完成！去 <a href="#train">训练馆</a> 挑战进阶游戏。</p></section>`
        : `<button class="cta" id="start-btn">${greetRow} · 开始今天的 ${plan.length - done} 局</button>`}
    `;
    const wrap = el.querySelector('.today-items');
    plan.forEach(g => {
      const game = GAMES[g];
      const st = DB.skill(g);
      const d = `<div class="t-dot ${DB.s.days[today] && DB.s.days[today].done.includes(g) ? 'done' : ''}"></div>`;
      const item = U.h('button', 'today-item', `${d}<span class="ti-em">${game.emoji}</span><span class="ti-name">${game.name}</span><span class="ti-best">${st.best ? '最佳 ' + st.best : ''}</span>`);
      item.addEventListener('click', () => openGame(g));
      wrap.appendChild(item);
    });
    $('#start-btn')?.addEventListener('click', () => { openGame(plan[done] || plan[0]); });
  }

  // ---------- 训练馆 ----------
  function scrTrain() {
    const el = $('#scr-train');
    const total = DB.totalSessions();
    el.innerHTML = `
      <header class="greet"><div class="hello">训练馆</div><div class="sub">累计 ${total} 局 · 每次 5 分钟</div></header>
      <p class="hint">每天练 3 个「今日推荐」就够；想加练，来这里任意点。</p>
      <section class="card"><h3>每日推荐 <small>按今日计划</small></h3><div class="recs"></div></section>
      <section class="card"><h3>全部游戏 <small>进阶任意练</small></h3><div class="grid"></div></section>
    `;
    const recs = el.querySelector('.recs');
    DB.plan(U.todayStr()).forEach(g => {
      const game = GAMES[g];
      const b = U.h('button', 'rec-chip', `${game.emoji} ${game.name}`);
      b.addEventListener('click', () => openGame(g));
      recs.appendChild(b);
    });
    const grid = el.querySelector('.grid');
    const all = GAME_ORDER.concat(BONUS_ORDER);
    all.forEach(g => {
      const game = GAMES[g];
      const st = DB.skill(g);
      const w = U.h('button', 'game-card' + (BONUS_ORDER.includes(g) ? ' bonus' : ''), `
        <div class="gc-emoji" ${BONUS_ORDER.includes(g) ? '' : ''}>${game.emoji}</div>
        <div class="gc-name">${game.name}</div>
        <div class="gc-best">${st.best ? '最佳 ' + st.best : '未开张'}</div>`);
      w.addEventListener('click', () => openGame(g));
      grid.appendChild(w);
    });
  }

  function bindGames() { }

  function scrProgress() {
    const vals = DB.radar();
    const total = DB.totalSessions();
    const streak = DB.streak();
    const played = GAME_ORDER.filter(g => vals[g] > 0).length;
    const avg = played ? Math.round(GAME_ORDER.reduce((n, g) => n + vals[g], 0) / GAME_ORDER.length) : 0;
    const ach = DB.achievements();
    const wk = DB.weekly();
    const el = $('#scr-progress');
    el.innerHTML = `
      <header class="greet"><div class="hello">进步看得见</div><div class="sub">累计训练 ${total} 局</div></header>
      <section class="card"><h3>脑力五维 <small>近 7 天平均分</small></h3>
        <div class="stat-pills">
          <div class="stat-pill"><b>${total}</b><span>总局数</span></div>
          <div class="stat-pill"><b>${streak}</b><span>连续打卡</span></div>
          <div class="stat-pill"><b>${avg}</b><span>五维均分</span></div>
        </div>
        ${radarSVG(vals)}</section>
      <section class="card"><h3>${ICONS.ui.cal} 每周总结</h3>
        <div class="stat-pills">
          <div class="stat-pill"><b>${wk.games}</b><span>本周训练</span></div>
          <div class="stat-pill"><b>${wk.days}</b><span>本周天数</span></div>
          <div class="stat-pill"><b>${wk.bestDeltaG ? '+' + wk.bestDelta : '—'}</b><span>最强进步</span></div>
        </div>
        <p class="hint">${wk.bestDeltaG ? `进步最猛的是「${GAMES[wk.bestDeltaG].name}」，本周比上周平均 +${wk.bestDelta} 分。` : '保持一周，就能看到每个领域的真实趋势。'}</p>
      </section>
      <section class="card"><h3>${ICONS.ui.trophy} 成就 <small>里程碑</small></h3>
        <div class="achv-row">${ach.map(a => `<div class="achv-item ${a.earned ? 'earned' : ''}"><div class="achv-ic" style="${a.earned ? '' : 'opacity:.4'}">${ICONS.ui.medal}</div><b>${a.label}</b><span>${a.desc}</span></div>`).join('')}</div>
      </section>
      <section class="card"><h3>打卡日历 <small>近 4 周</small></h3>${calendarHTML()}
        <div class="cal-legend"><span class="cal-cell full">✓</span>全部完成 <span class="cal-cell half">·</span>练了一点</div></section>
      ${GAME_ORDER.concat(BONUS_ORDER).map(g => {
      const sk = DB.skill(g);
      const curve = DB.diffCurve(g);
      const label = g === 'match' ? '记忆 · 配对' : g === 'nback' ? '工作记忆 · 双n' : SHORT[g];
      return `<section class="card"><h3>${ICONS.games[g]} ${GAMES[g].name} <small>${label} · ${sk.best ? `最佳 ${sk.best} 分 · 最近 ${sk.last} 分` : '还没开始'}</small></h3>${sparkSVG(sk.hist)}
        ${curve.length > 1 ? `<div class="diff-meta">难度曲线</div>${diffSVG(curve)}` : ''}</section>`;
    }).join('')}`;
  }

  function scrMe() {
    const s = DB.s;
    const pics = (s.pairs || []).length;
    const el = $('#scr-me');
    el.innerHTML = `
      <header class="greet"><div class="hello">设置</div></header>
      <section class="card"><h3>称呼她</h3>
        <input id="name-in" class="name-in" maxlength="12" placeholder="耀耀" value="${U.esc(s.name)}">
        <p class="hint">开屏问候和成绩单都会用这个名字</p></section>
      <section class="card row" style="padding:16px 18px"><span style="display:flex;gap:8px;align-items:center">${s.sound ? ICONS.ui.sound : ICONS.ui.muted} 音效</span><button id="sound-btn" class="toggle ${s.sound ? 'on' : ''}">${s.sound ? '开' : '关'}</button></section>
      <section class="card"><h3>${ICONS.a11y.text} 阅读与无障碍</h3>
        <div class="a11y-row"><span>字号大小</span>
          <div class="seg"><button class="seg-btn ${(s.ts || 1) === 1 ? 'on' : ''}" data-ts="1">标准</button><button class="seg-btn ${(s.ts || 1) === 1.12 ? 'on' : ''}" data-ts="1.12">大</button><button class="seg-btn ${(s.ts || 1) === 1.25 ? 'on' : ''}" data-ts="1.25">超大</button></div>
        </div>
        <div class="a11y-row"><span>高对比度</span><button id="hc-btn" class="toggle ${s.hc ? 'on' : ''}">${s.hc ? '开' : '关'}</button></div>
        <div class="a11y-row"><span>震动反馈</span><button id="vib-btn" class="toggle ${s.vib ? 'on' : ''}">${s.vib ? '开' : '关'}</button></div>
      </section>
      <section class="card"><h3>翻牌配对的照片 <small>${pics ? `已选 ${pics} 张` : '可选'}</small></h3>
        <p class="hint">选最多 6 张你们照片，翻牌配对的牌面会换成它们。照片只存本机。</p>
        <button class="btn ghost" id="pick-pic">${pics ? '更换照片（' + pics + '/6）' : '选择照片'}</button>
        <div class="pic-thumbs" id="pic-thumbs"></div>
        <input type="file" id="pic-file" accept="image/*" multiple style="display:none">
      </section>
      <section class="card">
        <button class="link-btn" id="sci-btn"><span class="ic">${ICONS.ui.bulb}</span><span class="lbl">这个 App 为什么有效？</span><span class="more">›</span></button>
        <button class="link-btn" id="export-btn"><span class="ic">${ICONS.ui.export}</span><span class="lbl">导出/备份我的数据</span><span class="more">›</span></button>
        <button class="link-btn" id="import-btn"><span class="ic">${ICONS.ui.import}</span><span class="lbl">导入数据</span><span class="more">›</span></button>
        <input type="file" id="import-file" accept="application/json" style="display:none">
      </section>
      <section class="card"><button class="link-btn danger" id="reset-btn">重置全部数据</button></section>
      <p class="credit">为你定制 💗 脑力健身房 v1.2</p>`;

    $('#name-in').addEventListener('change', e => { s.name = e.target.value.trim(); DB.save(); });
    $('#sound-btn').addEventListener('click', e => { s.sound = !s.sound; DB.save(); e.currentTarget.className = 'toggle' + (s.sound ? ' on' : ''); e.currentTarget.textContent = s.sound ? '开' : '关'; });
    el.querySelectorAll('.seg-btn').forEach(b => b.addEventListener('click', () => {
      s.ts = parseFloat(b.dataset.ts); DB.save();
      el.querySelectorAll('.seg-btn').forEach(x => x.classList.toggle('on', x === b));
      applyA11y();
    }));
    $('#hc-btn').addEventListener('click', e => { s.hc = s.hc ? 0 : 1; DB.save(); e.currentTarget.className = 'toggle' + (s.hc ? ' on' : ''); e.currentTarget.textContent = s.hc ? '开' : '关'; applyA11y(); });
    $('#vib-btn').addEventListener('click', e => { s.vib = s.vib ? 0 : 1; DB.save(); e.currentTarget.className = 'toggle' + (s.vib ? ' on' : ''); e.currentTarget.textContent = s.vib ? '开' : '关'; });
    $('#pick-pic').addEventListener('click', () => $('#pic-file').click());
    $('#pic-file').addEventListener('change', e => {
      const files = [...e.target.files].slice(0, 6);
      const load = files.map(f => new Promise(res => {
        const rd = new FileReader();
        rd.onload = () => shrink(rd.result, 240, res);
        rd.readAsDataURL(f);
      }));
      Promise.all(load).then(list => { s.pairs = list.filter(Boolean).slice(0, 6); DB.save(); toast('已保存照片'); scrMe(); });
      e.target.value = '';
    });
    $('#sci-btn').addEventListener('click', () => go('science'));
    $('#export-btn').addEventListener('click', () => {
      const blob = new Blob([DB.exportData()], { type: 'application/json' });
      const a = U.h('a', '', '');
      a.href = URL.createObjectURL(blob);
      a.download = '脑力健身房-备份-' + U.todayStr() + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast('已导出备份文件');
    });
    $('#import-btn').addEventListener('click', () => $('#import-file').click());
    $('#import-file').addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { try { DB.importData(rd.result); toast('导入成功'); go('today'); } catch (err) { toast('文件格式不对'); } };
      rd.onerror = () => toast('读取失败');
      rd.readAsText(f);
      e.target.value = '';
    });
    $('#reset-btn').addEventListener('click', () => { if (confirm('确定清空所有训练记录吗？')) { DB.reset(); go('today'); } });
    renderPics();
  }

  // 照片压缩成小图 dataURL，避免撑爆 localStorage
  function shrink(dataUrl, max, cb) {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * k));
      c.height = Math.max(1, Math.round(img.height * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      cb(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => cb(null);
    img.src = dataUrl;
  }

  function renderPics() {
    const box = $('#pic-thumbs');
    if (!box) return;
    const pics = DB.s.pairs || [];
    box.innerHTML = pics.map((p, i) => `<span class="pic-thumb"><img src="${p}" alt=""><button class="pic-x" data-i="${i}">×</button></span>`).join('');
    box.querySelectorAll('.pic-x').forEach(b => b.addEventListener('click', () => {
      DB.s.pairs.splice(+b.dataset.i, 1); DB.save(); scrMe();
    }));
  }

  function scrScience() {
    const el = $('#scr-science');
    el.innerHTML = `
      <header class="greet"><button class="back-btn" id="sci-back">‹ 返回</button><div class="hello">这个 App 为什么有效？</div></header>
      <section class="card"><p class="sci-lead">「脑训练」不是玄学，也不是魔法。下面是设计时参考的主要研究结论，以及它们如何变成了你手里的功能。</p></section>
      <section class="card"><h3>1️⃣ 练什么，强什么</h3><p>认知训练的提升是「领域特异」的。汇总几十年随机对照试验的大型综述（Butler 等, 2018；Simons 等, 2016）发现：记忆训练提升记忆、推理训练提升推理、速度训练提升速度，但"练方块游戏 → 全面变聪明"没有证据。所以这里 1:1 训练五个具体能力，而不是许诺泛泛的"变聪明"。</p></section>
      <section class="card"><h3>2️⃣ 速度训练的证据最硬</h3><p>ACTIVE 试验（2802 人随机分组）中，加工速度训练的收益在 10 年随访仍然可见；后续分析（Edwards 等, 2017）显示接受速度训练者痴呆发生风险更低。「瞬间眼力」就是该试验所用 UFOV 任务的简化版。</p></section>
      <section class="card"><h3>3️⃣ 记忆要"用策略"，不只是刷题</h3><p>记忆策略训练（联想、分组、图像化、路径法）在元分析中有中等效应（Gross 等, 2012；Chen 等, 2022），且效果能保持较久。所以每局位置记忆前都藏着一个小技巧。</p></section>
      <section class="card"><h3>4️⃣ 难度要"跳一跳够得着"</h3><p>自适应难度是训练起效的关键成分。这里每局都按表现升降难度：连对升级、连错降级，永远练在最舒适的"边缘"。</p></section>
      <section class="card"><h3>5️⃣ 坚持 > 时长</h3><p>ACTIVE 试验每天约 60–75 分钟、共 10 次就见效；日常版做法是每天 5 分钟、不断打卡。默认每天 3 局，配合连击记录，就是按这个逻辑来的。</p></section>
      <section class="card"><h3>6️⃣ 别指望"游戏变 IQ"</h3><p>工作记忆训练的元分析（Melby-Lervåg 等, 2016）发现：只有"练什么强什么"的近迁移，对智力测验没有可信的提升。所以我们不宣传"提升智商"，只追踪看得见的进步。</p></section>
      <section class="card"><h3>7️⃣ 大脑真正的补品在 App 外</h3><p>学习全新技能（Park 等, 2014）、有氧运动、睡眠和社交，对认知的证据同样强、甚至更强。科学小贴士会不定期提醒你。</p></section>
      <section class="card"><h3>诚实条款</h3><p>分数是训练追踪，不是医学测评；本 App 不能诊断、治疗或预防任何疾病。云同步、双人模式与 iOS 主屏幕推送需要外部服务或苹果权限，本离线版暂未提供；如需长期备份，请定期使用「导出/备份数据」。</p>
        <p class="refs">Ball et al. (2002) JAMA · Edwards et al. (2017) Alzheimer's &amp; Dementia: TRCI · Simons et al. (2016) Psychol. Sci. Public Interest · Butler et al. (2018) Ann. Intern. Med. · Melby-Lervåg et al. (2016) Perspect. Psychol. Sci. · Gross et al. (2012) Aging &amp; Mental Health · Park et al. (2014) Psychological Science · Cochrane CD012277 (2019)</p></section>`;
    $('#sci-back').addEventListener('click', () => go('me'));
  }

  // ---------- 游戏调度 ----------
  function openGame(id) {
    const g = GAMES[id];
    if (!g) return;
    curGame = id;
    lastTab = document.querySelector('.screen:not(.hidden)').id.replace('scr-', '') || 'today';
    $('#game-title').textContent = g.name;
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
    buzz(newBest ? [40, 40, 40] : 30);
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

  // ---------- 轻提示 ----------
  let toastT = null;
  function toast(msg) {
    let t = document.getElementById('ui-toast');
    if (!t) { t = U.h('div', 'toast'); t.id = 'ui-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 1600);
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
  window.UI_applyA11y = applyA11y;
})();
