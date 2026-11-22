(() => {
  const one = (selector, parent = document) => parent.querySelector(selector);
  const all = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const language = document.documentElement.lang;
  const ui = {
    he: {open: 'פתיחת תפריט', close: 'סגירת תפריט', results: 'מספר התכשיטים המוצגים'},
    en: {open: 'Open navigation', close: 'Close navigation', results: 'Pieces shown'},
    ru: {open: 'Открыть меню', close: 'Закрыть меню', results: 'Украшений показано'}
  }[language];
  const header = one('.site-header');
  const menuButton = one('.mobile-menu');
  const languages = one('.lang');
  const hero = one('.hero');
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

  const selector = one('.campaign-selector');
  const sceneButtons = all('button', selector);
  let currentScene = 0;
  function selectScene(index) {
    currentScene = (index + sceneButtons.length) % sceneButtons.length;
    sceneButtons.forEach((button, i) => {
      const selected = i === currentScene;
      button.setAttribute('aria-pressed', String(selected));
      document.getElementById(button.getAttribute('aria-controls')).hidden = !selected;
    });
  }
  sceneButtons.forEach((button, i) => button.addEventListener('click', () => selectScene(i)));
  selector.hidden = false;

  // Leave vertical scrolling and pinch zoom to the browser.
  let swipe = null;
  hero.addEventListener('touchstart', event => {
    const touch = event.touches[0];
    swipe = event.touches.length === 1 && event.target.closest('.campaign-visual')
      ? {x: touch.clientX, y: touch.clientY} : null;
  }, {passive:true});
  hero.addEventListener('touchend', event => {
    if (!swipe) return;
    const dx = event.changedTouches[0].clientX - swipe.x;
    const dy = event.changedTouches[0].clientY - swipe.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) {
      selectScene(currentScene + (dx < 0 ? 1 : -1));
    }
    swipe = null;
  }, {passive:true});
  hero.addEventListener('touchcancel', () => { swipe = null; }, {passive:true});

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
