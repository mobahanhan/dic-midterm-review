(() => {
  const page = document.querySelector('.self-test-page');
  const mode = document.getElementById('self-test-prompt');
  if (!mode) return;
  const key = 'dic-pdf-self-test-prompt';
  try {
    const stored = localStorage.getItem(key);
    if (['both', 'zh', 'en'].includes(stored)) mode.value = stored;
  } catch {}
  page.dataset.prompt = mode.value;
  mode.addEventListener('change', () => {
    page.dataset.prompt = mode.value;
    try { localStorage.setItem(key, mode.value); } catch {}
  });

  const cards = [...page.querySelectorAll('.self-test-card')];
  for (const button of page.querySelectorAll('[data-set-cards]')) {
    button.addEventListener('click', () => {
      const open = button.dataset.setCards === 'open';
      cards.forEach(card => { card.open = open; });
      document.getElementById('self-test-status').textContent = open ? '本章释义已展开' : '本章释义已收起';
    });
  }
})();
