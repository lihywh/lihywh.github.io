'use strict';
(async () => {
  const published = new Set(['/download/gomoku/', '/download/reversi/', '/download/gopad/', '/download/junqi/']);
  const current = location.pathname.replace(/galaxy\/$/, '');
  const response = await fetch('/download/apps.json');
  if (!response.ok) return;
  const apps = await response.json();
  const list = document.getElementById('galaxy-apps');
  for (const app of apps) {
    if (!published.has(app.page) || app.page === current) continue;
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = app.page + 'galaxy/';
    const icon = document.createElement('img');
    icon.src = app.page + 'icon.png';
    icon.width = 28;
    icon.height = 28;
    icon.alt = '';
    const name = document.createElement('span');
    name.textContent = app.en;
    link.append(icon, name);
    item.append(link);
    list.append(item);
  }
})().catch(() => {});
