const locale = navigator.language || 'en';
const isChinese = /^zh(?:-|$)/i.test(locale);
const traditional = /^zh-(?:hant|tw|hk|mo)(?:-|$)/i.test(locale);
if (isChinese) {
  document.documentElement.lang = traditional ? 'zh-Hant' : 'zh-CN';
  for (const element of document.querySelectorAll('[data-zh]')) element.textContent = element.dataset.zh;
}

const video = document.getElementById('walkthrough');
function videoLanguage(lang) {
  video.src = './PaperFold-Studio-' + lang + '.mp4';
  video.poster = './poster-' + lang + '.jpg';
  video.lang = lang;
}
if (isChinese) videoLanguage('zh');
document.querySelectorAll('[data-video]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  videoLanguage(link.dataset.video);
  video.play().catch(() => {});
}));
