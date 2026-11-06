const nav = document.querySelector<HTMLElement>('.sp-nav');

if (nav) {
  const sync = (): void => {
    nav.classList.toggle('is-scrolled', window.scrollY > 0);
  };
  sync();
  window.addEventListener('scroll', sync, { passive: true });
}

const menu = document.getElementById('mobile-menu');

if (menu) {
  menu.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest('a');
    if (link && menu.contains(link)) menu.hidePopover();
  });
}
