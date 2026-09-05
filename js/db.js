// 数据层：localStorage 持久化 / 打卡 / 进度
(function () {
  const KEY = 'braingym.v1';
  const ORDER = ['corsi', 'stroop', 'flash', 'math', 'matrix'];

  const DB = {
    s: null,
    load() {
      let d = null;
      try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) { }
      this.s = d || this.fresh();
      if (!this.s.skill) this.s.skill = {};
      if (!this.s.days) this.s.days = {};
      return this.s;
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.s)); } catch (e) { } },
    fresh() { return { name: '耀耀', sound: true, start: U.todayStr(), days: {}, skill: {}, tipsSeen: {} }; },
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
      if (sk.hist.length > 90) sk.hist = sk.hist.slice(-90);
      if (extra) for (const k in extra) sk[k] = extra[k];
      this.save();
      return newBest;
    },
    streak() {
      const done = ds => this.dayDone(ds) >= this.plan(ds).length;
      let n = 0;
      const d = new Date();
      if (!done(U.todayStr(d))) d.setDate(d.getDate() - 1); // 今天没打完不打断连击
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
      return ORDER.reduce((n, g) => n + (this.s.skill[g] ? this.s.skill[g].hist.length : 0), 0);
    },
    reset() { this.s = this.fresh(); this.save(); }
  };

  window.DB = DB;
  window.GAME_ORDER = ORDER;
})();
