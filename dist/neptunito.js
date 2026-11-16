const get = id => document.getElementById(id);
const confettiColors = ['#ff626f', '#ffd46e', '#a3afff', '#72d6d8', '#fff6e4'];

function celebrate(button) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches) return;
  button.classList.remove('is-celebrating');
  button.querySelector('.confetti')?.remove();
  const confetti = document.createElement('span');
  confetti.className = 'confetti';
  confetti.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 24; i++) {
    const piece = document.createElement('i');
    const angle = i * Math.PI / 12;
    const radius = 75 + Math.random() * 75;
    piece.style.setProperty('--x', Math.cos(angle) * radius + 'px');
    piece.style.setProperty('--y', Math.sin(angle) * radius + 'px');
    piece.style.setProperty('--turn', (i % 2 ? 1 : -1) * (140 + i * 9) + 'deg');
    piece.style.setProperty('--piece', confettiColors[i % confettiColors.length]);
    confetti.append(piece);
  }
  button.append(confetti);
  button.classList.add('is-celebrating');
  setTimeout(() => {
    confetti.remove();
    if (!button.querySelector('.confetti')) button.classList.remove('is-celebrating');
  }, 1000);
}

export function setupHeroNeptunito() {
  const hero = get('hero-neptunito');
  const heroNote = get('hero-note');
  let greetings = 0;
  hero.addEventListener('click', () => {
    celebrate(hero);
    heroNote.textContent = ['¡Ese saludo merece confeti!', '¡Tripulación lista para despegar!', '¡Qué gusto verte por aquí!'][greetings++ % 3];
    hero.querySelector('.mascot-sprite').dataset.pose = greetings % 2 ? 'explain' : 'wave';
  });

}
