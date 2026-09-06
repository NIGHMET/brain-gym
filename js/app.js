// 入口：初始化 / 底部导航 / 游戏返回
document.addEventListener('DOMContentLoaded', () => {
  DB.load();
  UI_applyA11y();
  document.querySelectorAll('#tabbar button').forEach(b => {
    b.addEventListener('click', () => UI.go(b.dataset.go));
  });
  const back = document.getElementById('game-back');
  if (back) back.addEventListener('click', () => UI.closeGame());
  UI.go('today');
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
