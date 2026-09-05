// 轻量音效：WebAudio 合成，无外部资源
(function () {
  let ctx = null;
  function ensure() {
    if (!DB.s || !DB.s.sound) return null;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }
  document.addEventListener('pointerdown', () => { if (window.DB && DB.s) ensure(); }, { once: true });

  function tone(freq, delay, dur, type, gain) {
    const c = ensure();
    if (!c) return;
    try {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(gain || 0.12, c.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + dur);
      o.connect(g); g.connect(c.destination);
      o.start(c.currentTime + delay);
      o.stop(c.currentTime + delay + dur + 0.02);
    } catch (e) { }
  }

  window.SFX = {
    good() { tone(660, 0, 0.09); tone(880, 0.09, 0.13); },
    bad() { tone(190, 0, 0.18, 'sawtooth', 0.07); },
    tap() { tone(520, 0, 0.05, 'triangle', 0.06); },
    pop() { tone(740, 0, 0.06, 'sine', 0.09); },
    win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.15, 'triangle', 0.1)); }
  };
})();
