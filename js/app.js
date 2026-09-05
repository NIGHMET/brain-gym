// 入口
document.addEventListener('DOMContentLoaded', () => {
  DB.load();
  const $ = s => document.querySelector(s);
  const tabs = [['today', '🏠', '今天'], ['train', '🎮', '训练'], ['progress', '📈', '进度'], ['me', '⚙️', '我的']];
  $('#tabbar').innerHTML = tabs.map(t => `<button data-go="${t[0]}"><span>${t[1]}</span>${t[2]}</button>`).join('');
  $('#tabbar').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) UI.go(b.dataset.go);
  });
  $('#game-back').addEventListener('click', () => UI.closeGame());
  UI.go('today');
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => { });
  }
});
