async function loadOfficialAppDirectory() {
  const section = document.querySelector('[data-app-directory]');
  if (!section) return;

  const locale = document.documentElement.lang.toLowerCase();
  const language = /^zh-(hant|tw|hk|mo)(-|$)/.test(locale)
    ? 'hant' : /^zh(-|$)/.test(locale) ? 'hans' : 'en';
  const copy = {
    en: ['More apps', 'More tabletop games', 'Other apps', 'App directory temporarily unavailable.'],
    hans: ['更多应用', '更多同桌游戏', '其他应用', '暂时无法加载应用目录。'],
    hant: ['更多應用', '更多同桌遊戲', '其他應用', '暫時無法載入應用目錄。'],
  }[language];
  const output = section.querySelector('[data-directory-content]');
  section.querySelector('[data-directory-title]').textContent = copy[0];

  try {
    const response = await fetch('/download/apps.json');
    if (!response.ok) throw new Error('Unable to load app directory');
    const apps = await response.json();

    for (const [group, label] of [['game', copy[1]], ['utility', copy[2]]]) {
      const items = apps.filter(app => app.group === group && app.page !== section.dataset.currentApp);
      if (!items.length) continue;
      const heading = document.createElement('h3');
      heading.textContent = label;
      const list = document.createElement('ul');
      list.className = section.dataset.listClass;
      list.dataset.appGroup = group;
      for (const app of items) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = app.page;
        const icon = document.createElement('img');
        icon.src = app.icon || app.page + 'icon.png';
        icon.alt = '';
        icon.width = icon.height = 40;
        icon.loading = 'lazy';
        const name = document.createElement('span');
        const title = document.createElement('strong');
        title.textContent = app[language] || app.en;
        name.append(title);
        if (language !== 'en' && app.en !== title.textContent) {
          const subtitle = document.createElement('small');
          subtitle.lang = 'en';
          subtitle.textContent = app.en;
          name.append(subtitle);
        }
        link.append(icon, name);
        item.append(link);
        list.append(item);
      }
      output.append(heading, list);
    }
  } catch {
    output.textContent = copy[3];
  }
}
loadOfficialAppDirectory();
