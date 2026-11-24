const locale = navigator.language || 'en';
const isChinese = /^zh(?:-|$)/i.test(locale);
const traditional = /^zh-(?:hant|tw|hk|mo)(?:-|$)/i.test(locale);
if (isChinese) {
  document.documentElement.lang = traditional ? 'zh-Hant' : 'zh-CN';
  for (const element of document.querySelectorAll('[data-zh]')) element.textContent = element.dataset.zh;
}

const list = document.getElementById('more-apps');
try {
  const response = await fetch('/download/apps.json');
  if (!response.ok) throw Error('Catalog unavailable');
  const apps = await response.json();
  const seen = new Set();
  for (const app of apps) {
    if (typeof app.page !== 'string' || !/^\/(?:[a-z0-9-]+\/)+$/.test(app.page) ||
        app.page === '/paperfold-studio/' || seen.has(app.page) || !app.en) continue;
    seen.add(app.page);
    const label = traditional ? app.hant : isChinese ? app.hans : app.en;
    const link = document.createElement('a');
    link.href = app.page;
    const image = document.createElement('img');
    image.src = app.page + 'icon.png';
    image.alt = '';
    image.loading = 'lazy';
    image.addEventListener('error', () => { image.hidden = true; }, {once:true});
    link.append(image, document.createTextNode(label || app.en));
    const item = document.createElement('li');
    item.append(link);
    list.append(item);
  }
} catch {
  list.parentElement.hidden = true;
}
