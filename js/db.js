// 数据层：localStorage 持久化 / 打卡 / 进度 / 备份 / 进阶游戏 / 无障碍
(function () {
  const KEY = 'braingym.v1';
  const ORDER = ['corsi', 'stroop', 'flash', 'math', 'matrix'];   // 每日五维
  const BONUS = ['match', 'nback', 'duel'];                       // 进阶加练（不并入每日计划/雷达，独立记成绩）

  const DB = {
    s: null,
    load() {
      let d = null;
      try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) { }
      this.s = d || this.fresh();
      if (!this.s.skill) this.s.skill = {};
      if (!this.s.days) this.s.days = {};
      if (!this.s.tipsSeen) this.s.tipsSeen = {};
      if (!this.s.pairs) this.s.pairs = [];           // 翻牌配对照片
      if (!this.s.hc) this.s.hc = 0;                  // 高对比度 0/1
      if (!this.s.ts) this.s.ts = 1;                  // 字号缩放 1/1.12/1.25
      if (!this.s.vib) this.s.vib = 1;                // 震动反馈 0/1
      return this.s;
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.s)); } catch (e) { } },
    fresh() { return { name: '耀耀', sound: true, start: U.todayStr(), days: {}, skill: {}, tipsSeen: {}, pairs: [], hc: 0, ts: 1, vib: 1 }; },
    skill(g) {
      if (!this.s.skill[g]) this.s.skill[g] = { best: 0, last: 0, lvl: 0, hist: [] };
      return this.s.skill[g];
    },
    // 每日计划：按起始日期轮转，每天 3 个，5 天一循环
    plan(dateStr) {
      const i = Math.abs(U.diffDays(this.s.start, dateStr)) % 5;
      return [ORDER[i], ORDER[(i + 1) % 5], ORDER[(i + 2) % 5]];
    },
    dayDone(dateStr) {
      const day = this.s.days[dateStr];
      if (!day) return 0;
      return this.plan(dateStr).filter(g => day.done.includes(g)).length;
    },
    record(g, score, extra) {
      const sk = this.skill(g);
      const t = U.todayStr();
      const day = this.s.days[t] || (this.s.days[t] = { done: [] });
      if (!day.done.includes(g)) day.done.push(g);
      const newBest = score > sk.best;
      sk.last = score;
      if (newBest) sk.best = score;
      sk.hist.push([t, score]);
      if (sk.hist.length > 180) sk.hist = sk.hist.slice(-180);
      if (extra) for (const k in extra) sk[k] = extra[k];
      this.save();
      return newBest;
    },
    streak() {
      const done = ds => this.dayDone(ds) >= this.plan(ds).length;
      let n = 0;
      const d = new Date();
      if (!done(U.todayStr(d))) d.setDate(d.getDate() - 1);
      for (let i = 0; i < 366; i++) {
        const ds = U.todayStr(d);
        if (done(ds)) { n++; d.setDate(d.getDate() - 1); } else break;
      }
      return n;
    },
    // 雷达图：每个领域取近 7 天平均分，没练过则取最近一次
    radar() {
      const out = {};
      const today = U.todayStr();
      for (const g of ORDER) {
        const sk = this.s.skill[g];
        if (!sk || !sk.hist || !sk.hist.length) { out[g] = 0; continue; }
        const recent = sk.hist.filter(([d]) => U.diffDays(d, today) < 7).map(x => x[1]);
        out[g] = recent.length ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length) : sk.hist[sk.hist.length - 1][1];
      }
      return out;
    },
    totalSessions() {
      return ORDER.concat(BONUS).reduce((n, g) => n + (this.s.skill[g] ? this.s.skill[g].hist.length : 0), 0);
    },
    reset() { this.s = this.fresh(); this.save(); },

    // ---- 每周训练总结 ----
    weekly() {
      const today = U.todayStr();
      let games = 0, days = 0, bestDeltaG = null, bestDelta = -1;
      const perDay = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = U.todayStr(d);
        const day = this.s.days[ds];
        const count = day ? day.done.length : 0;
        if (count > 0) days++;
        perDay[ds] = count;
        games += count;
      }
      // 找进步最大领域（本周均分 vs 上周均分）
      for (const g of ORDER.concat(BONUS)) {
        const sk = this.s.skill[g];
        if (!sk || !sk.hist || sk.hist.length < 2) continue;
        const wk = sk.hist.filter(([d]) => Math.abs(U.diffDays(d, today)) < 7).map(x => x[1]);
        const pw = sk.hist.filter(([d]) => U.diffDays(d, today) >= 7 && U.diffDays(d, today) < 14).map(x => x[1]);
        if (!wk.length || !pw.length) continue;
        const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
        const delta = Math.round(avg(wk) - avg(pw));
        if (delta > bestDelta) { bestDelta = delta; bestDeltaG = g; }
      }
      return { games, days, perDay, bestDelta, bestDeltaG };
    },
    // 难度曲线：取某游戏历史 (日期, 难度等级)，无等级则用分数近似
    diffCurve(g) {
      const sk = this.s.skill[g];
      if (!sk || !sk.hist || !sk.hist.length) return [];
      return sk.hist.map(([d, score]) => [d, sk.lvl || Math.round(score / 20)]);
    },

    // ---- 导出 / 导入备份 ----
    exportData() {
      return JSON.stringify({ version: 1, exportedAt: U.todayStr(), data: this.s }, null, 2);
    },
    importData(json) {
      const parsed = JSON.parse(json);
      const d = parsed && parsed.data ? parsed.data : parsed;
      if (!d || typeof d !== 'object') throw new Error('bad');
      if (!d.skill) d.skill = {};
      if (!d.days) d.days = {};
      this.s = d;
      this.save();
      return true;
    },

    // ---- 成就 ----
    achievements() {
      const total = this.totalSessions();
      const allBest = ORDER.every(g => this.skill(g).best > 0);
      const anyHigh = ORDER.some(g => this.skill(g).best >= 60);
      const reach = (g, s) => this.skill(g).best >= s;
      return [
        { id: 'first', label: '初次出发', desc: '完成第 1 局', earned: total >= 1 },
        { id: 'ten', label: '渐入佳境', desc: '累计 10 局', earned: total >= 10 },
        { id: 'fifty', label: '持之以恒', desc: '累计 50 局', earned: total >= 50 },
        { id: 'all', label: '五维全能', desc: '五项都挑战过', earned: allBest },
        { id: 'good', label: '轻车熟路', desc: '任一游戏 60 分', earned: anyHigh },
        { id: 'match', label: '记忆搭子', desc: '翻牌配对 60 分', earned: reach('match', 60) },
        { id: 'nback', label: '双线作战', desc: '双n-back 60 分', earned: reach('nback', 60) },
        { id: 'duel', label: '双人默契', desc: '双人翻牌 60 分', earned: reach('duel', 60) }
      ];
    },
    // 薄弱项推荐：练过但平均分最低的五维领域
    weakPick() {
      const vals = this.radar();
      const played = ORDER.filter(g => vals[g] > 0);
      if (played.length === 0 || played.length >= ORDER.length) return null;
      played.sort((a, b) => vals[a] - vals[b]);
      return played[0];
    }
  };

  window.DB = DB;
  window.GAME_ORDER = ORDER;
  window.BONUS_ORDER = BONUS;
})();
