const catalog = document.querySelector('.app-catalog');
if (catalog) {
  const locale = document.documentElement.lang;
  const language = /^zh-(?:hant|tw|hk|mo)(?:-|$)/i.test(locale) ? 'hant'
    : /^zh(?:-|$)/i.test(locale) || /^zh(?:-|$)/i.test(navigator.language)
      ? (/^zh-(?:hant|tw|hk|mo)(?:-|$)/i.test(navigator.language) ? 'hant' : 'hans')
      : null;
  if (language) {
    catalog.lang = language === 'hant' ? 'zh-Hant' : 'zh-Hans';
    for (const label of catalog.querySelectorAll('[data-catalog-hans]')) {
      label.textContent = language === 'hant' ? label.dataset.catalogHant : label.dataset.catalogHans;
    }
  }
}
