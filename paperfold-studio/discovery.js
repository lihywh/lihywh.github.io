const locale = navigator.language || 'en';
const isChinese = /^zh(?:-|$)/i.test(locale);
const traditional = /^zh-(?:hant|tw|hk|mo)(?:-|$)/i.test(locale);
if (isChinese) {
  document.documentElement.lang = traditional ? 'zh-Hant' : 'zh-CN';
  for (const element of document.querySelectorAll('[data-zh]')) element.textContent = element.dataset.zh;
}
