// The cookie banner's buttons (src/components/Consent.astro). A choice goes to /api/consent, which keeps it in the
// `wc` cookie and starts or ends the visitor cookie. hit.ts calls ask() when the server says this visitor must be asked.
const box = document.querySelector<HTMLElement>('[data-consent]');

export function ask() {
  if (box) box.hidden = false;
}

box?.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((b) => b.addEventListener('click', () => {
  box.hidden = true;
  fetch('/api/consent', { method: 'POST', body: JSON.stringify({ choice: b.dataset.choice }), headers: { 'content-type': 'application/json' } }).catch(() => {});
}));

// "Cookie settings" in a footer: the banner again, so a yes can become a no
document.querySelectorAll<HTMLElement>('[data-cookies]').forEach((b) => b.addEventListener('click', () => {
  ask();
  box?.querySelector<HTMLButtonElement>('[data-choice=no]')?.focus();
}));
