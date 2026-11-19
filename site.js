(() => {
  const one = (selector, parent = document) => parent.querySelector(selector);
  const all = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const language = document.documentElement.lang;
  const ui = {
    he: {open: 'פתיחת תפריט', close: 'סגירת תפריט', results: 'מספר התכשיטים המוצגים', scenes: ['The Solitaire', 'The Tennis Bracelet', 'The Gold Hoops']},
    en: {open: 'Open navigation', close: 'Close navigation', results: 'Pieces shown', scenes: ['The Solitaire', 'The Tennis Bracelet', 'The Gold Hoops']},
    ru: {open: 'Открыть меню', close: 'Закрыть меню', results: 'Украшений показано', scenes: ['Солитер', 'Теннисный браслет', 'Золотые серьги']}
  }[language];
  const header = one('.site-header');
  const menuButton = one('.mobile-menu');
  const languages = one('.lang');
  const hero = one('.hero');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width:680px)');
  const menu = one('.main-nav');
  const menuIcon = one('use', menuButton);
  menuButton.hidden = false;
  function toggleMenu(open) {
    header.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? ui.close : ui.open);
    menuIcon.setAttribute('href', open ? '#i-close' : '#i-menu');
    if (open) languages.open = false;
  }
  menuButton.addEventListener('click', () => toggleMenu(!header.classList.contains('menu-open')));
  menu.addEventListener('click', () => toggleMenu(false));
  narrow.addEventListener('change', () => toggleMenu(false));
  languages.addEventListener('toggle', () => { if (languages.open) toggleMenu(false); });
  document.addEventListener('pointerdown', event => {
    if (!languages.contains(event.target)) languages.open = false;
    if (!header.contains(event.target)) toggleMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (languages.open) { languages.open = false; one('summary', languages).focus(); }
    if (header.classList.contains('menu-open')) { toggleMenu(false); menuButton.focus(); }
  });
  all('.lang-menu a').forEach(link => {
    link.addEventListener('click', () => {
      const areas = all('main section[id]');
      const atEnd = Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2;
      const current = atEnd ? areas.at(-1) : areas.filter(section => section.getBoundingClientRect().top < innerHeight * .42).pop();
      link.hash = current && current !== hero ? current.id : '';
    });
  });

  const pictures = one('.hero-pictures');
  const slides = ['ring', 'tennis', 'earrings'];
  const slideNodes = [one('.hero-image')];
  let index = 0;
  let request = 0;
  function slidePicture(n) {
    if (slideNodes[n]) return slideNodes[n];
    const picture = document.createElement('picture');
    picture.className = 'hero-image';
    const source = document.createElement('source');
    source.media = '(max-width:680px)';
    source.srcset = 'assets/' + slides[n] + '-mobile.webp';
    const img = document.createElement('img');
    img.alt = '';
    img.src = 'assets/' + slides[n] + '.webp';
    picture.append(source, img);
    pictures.append(picture);
    slideNodes[n] = picture;
    return picture;
  }
  async function advance(delta) {
    index = (index + delta + slides.length) % slides.length;
    const next = index;
    const generation = ++request;
    const photo = slidePicture(next);
    try { await one('img', photo).decode(); } catch { return; }
    if (generation !== request) return;
    slideNodes.forEach(node => node.classList.toggle('active', node === photo));
    one('.scene-name').textContent = ui.scenes[next];
    one('.scene-count').firstChild.textContent = String(next + 1).padStart(2,'0') + ' / 03';
  }
  one('.scene-next').addEventListener('click', () => advance(1));
  one('.scene-prev').addEventListener('click', () => advance(-1));
  one('.scene-buttons').hidden = false;
  let touchStart;
  hero.addEventListener('touchstart', event => {
    const touch = event.touches[0];
    touchStart = event.touches.length === 1 ? [touch.clientX, touch.clientY] : null;
  }, {passive:true});
  hero.addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart[0];
    const dy = event.changedTouches[0].clientY - touchStart[1];
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 2) advance(dx < 0 ? 1 : -1);
    touchStart = null;
  }, {passive:true});
  const headerSync = () => header.classList.toggle('solid', scrollY > 30);
  headerSync();
  let scrollFrame = 0, panX = 0, panY = 0;
  function updateFrame() {
    scrollFrame = 0;
    headerSync();
    if (!reducedMotion.matches && !narrow.matches && scrollY <= hero.offsetHeight) {
      pictures.style.setProperty('--pan-x', panX + 'px');
      pictures.style.setProperty('--pan-y', (panY + Math.min(scrollY * .09, 52)) + 'px');
    }
  }
  function scheduleFrame() { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateFrame); }
  window.addEventListener('scroll', scheduleFrame, {passive:true});
  hero.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || reducedMotion.matches) return;
    panX = (e.clientX / innerWidth - .5) * 8;
    panY = (e.clientY / hero.offsetHeight - .5) * 6;
    scheduleFrame();
  });
  hero.addEventListener('pointerleave', () => {panX = 0; panY = 0; scheduleFrame();});

  const filters = one('.filters'), pieces = all('.piece'), filterButtons = all('button', filters);
  filters.hidden = false;
  filterButtons.forEach((button, position) => button.addEventListener('click', () => {
    filterButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    pieces.forEach(piece => { piece.hidden = position !== 0 && piece.dataset.category !== button.dataset.filter; });
    one('#filter-status').textContent = ui.results + ' ' + pieces.filter(piece => !piece.hidden).length;
  }));

  const inquiry = {
    he: title => 'היי רפאל, אשמח לפרטים על ' + title + '.',
    en: title => 'Hello Refael, I would like to ask about the ' + title + '.',
    ru: title => 'Здравствуйте! Меня интересует украшение «' + title + '».'
  }[language];
  const dialog = one('#piece-dialog');
  if (typeof dialog.showModal === 'function') {
    let trigger = null;
    all('.piece-open').forEach(link => link.addEventListener('click', e => {
      if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) return;
      e.preventDefault();
      const originImage = one('img', link);
      const detail = one('#detail-image');
      detail.src = originImage.getAttribute('src');
      detail.alt = originImage.alt;
      const pieceTitle = one('h3', link).textContent;
      one('#detail-title').textContent = pieceTitle;
      const message = new URL(one('.contact-whatsapp').href);
      message.searchParams.set('text', inquiry(pieceTitle) + '\n' + link.href);
      one('.detail-whatsapp').href = message.href;
      one('#detail-kicker').textContent = one('.piece-latin', link).textContent;
      one('#detail-description').textContent = link.closest('.piece').dataset.description;
      one('#detail-post').href = link.href;
      trigger = link;
      dialog.showModal();
      dialog.scrollTop = 0;
      document.body.classList.add('dialog-open');
    }));
    one('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => {
      const b = dialog.getBoundingClientRect();
      if (e.target === dialog && (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      trigger?.focus({preventScroll:true});
    });
  }
  const tabs = one('.diamond-tabs');
  tabs.hidden = false;
  const originButtons = all('button', tabs);
  function selectOrigin(selected) {
    originButtons.forEach(button => {
      const active = button === selected;
      button.setAttribute('aria-pressed', String(active));
      document.getElementById(button.dataset.origin).hidden = !active;
    });
  }
  originButtons.forEach(button => button.addEventListener('click', () => selectOrigin(button)));
  selectOrigin(originButtons[0]);
})();
