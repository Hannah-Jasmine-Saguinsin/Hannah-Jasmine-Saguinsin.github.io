import { config } from './config.js';

const $ = id => document.getElementById(id);
const buttons = [];
let scene, active = -1, sound = false, low = false, audio;
const intro = $('intro');
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
const nav = $('module-nav'), panel = $('panel'), home = $('home');

const words = config.name.split(' ');
const last = words.pop();
$('name').replaceChildren(
  document.createTextNode(words.join(' ') + ' '),
  Object.assign(document.createElement('em'), { textContent: last + '.' })
);
$('title').textContent = config.title;
$('tagline').textContent = config.tagline;
for (const [key, value] of Object.entries(config.theme)) {
  document.documentElement.style.setProperty('--' + (key === 'background' ? 'bg' : key), value);
}

function elem(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

function beep() {
  if (!sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume().catch(() => {});
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, now);
    oscillator.frequency.exponentialRampToValueAtTime(740, now + 0.09);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.17);
  } catch {}
}

function addText(text) {
  if (text) $('content').append(elem('p', '', text));
}

function addLink(item) {
  if (!item?.url) return;
  let url;
  try {
    url = new URL(item.url, location.href);
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return;
  } catch { return; }

  const link = elem('a', 'social-link');
  link.href = url.href;
  if (url.protocol !== 'mailto:') {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }

  const icon = elem('span', 'social-icon', item.icon || '↗');
  icon.setAttribute('aria-hidden', 'true');
  const copy = elem('span', 'social-copy');
  copy.append(elem('strong', '', item.name));
  if (item.detail) copy.append(elem('small', '', item.detail));
  const arrow = elem('span', 'link-arrow', '↗');
  arrow.setAttribute('aria-hidden', 'true');
  link.append(icon, copy, arrow);
  $('content').append(link);
}

function renderContent(artifact) {
  $('content').replaceChildren();
  switch (artifact.id) {
    case 'identity':
      addText(config.bio);
      addText(config.education);
      break;
    case 'network':
      config.socials.forEach(addLink);
      break;
    case 'projects':
      config.projects.forEach(addLink);
      if (!config.projects.length) addText('Explore my repositories for ongoing work and experiments.');
      addLink(config.socials.find(s => s.name === 'GitHub'));
      break;
    case 'skills': {
      const list = elem('div', 'skill-list');
      config.skills.forEach(skill => list.append(elem('span', 'skill', skill)));
      $('content').append(list);
      break;
    }
    case 'contact':
      addText('Interested in a future project or exchanging ideas? Let’s connect.');
      config.socials
        .filter(s => ['LinkedIn', 'Messenger', 'Discord'].includes(s.name))
        .forEach(addLink);
      if (config.email) addLink({ name: 'Email', url: 'mailto:' + config.email, icon: '@' });
      if (config.cv) addLink({ name: 'View CV', url: config.cv, icon: 'CV' });
      break;
    default:
      addText(artifact.content);
      (artifact.links || []).forEach(addLink);
  }
}

function select(index, { focus = false } = {}) {
  const artifact = config.artifacts[index];
  if (!artifact) return;
  active = index;
  beep();
  home.hidden = true;
  panel.hidden = false;
  $('module').textContent = `ARTIFACT / ${String(index + 1).padStart(2, '0')}`;
  $('heading').textContent = artifact.name;
  $('description').textContent = artifact.description;
  renderContent(artifact);
  $('scene-title').textContent = artifact.name;
  buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(index === i)));
  scene?.focus(index);
  if (focus) $('heading').focus({ preventScroll: true });
  if (matchMedia('(max-width:700px)').matches) {
    panel.scrollIntoView({ block: 'start', behavior: paused ? 'instant' : 'smooth' });
  }
}

function overview({ focus = false } = {}) {
  active = -1;
  panel.hidden = true;
  home.hidden = false;
  $('scene-title').textContent = 'Artifact gallery';
  buttons.forEach(button => button.setAttribute('aria-pressed', 'false'));
  scene?.focus(-1);
  if (focus) $('explore').focus({ preventScroll: true });
}

nav.style.setProperty('--count', config.artifacts.length);
document.querySelector('.dock-caption span:last-child').textContent =
  '01 — ' + String(config.artifacts.length).padStart(2, '0') + ' / COLLECTION';
document.querySelector('.footnote span:first-child').textContent = '© 2026 ' + config.name;

config.artifacts.forEach((artifact, index) => {
  const button = elem('button', 'nav-item');
  button.type = 'button';
  button.style.setProperty('--item', artifact.color);
  button.setAttribute('aria-pressed', 'false');
  const icon = elem('span', 'nav-icon', artifact.icon);
  icon.setAttribute('aria-hidden', 'true');
  const text = elem('span', 'nav-text');
  text.append(
    elem('small', '', String(index + 1).padStart(2, '0') + ' / MODULE'),
    elem('strong', '', artifact.short || artifact.name)
  );
  button.append(icon, text);
  button.onclick = () => select(index);
  nav.append(button);
  buttons.push(button);
});

$('explore').onclick = () => {
  select(Math.max(0, config.artifacts.findIndex(a => a.id === 'network')), { focus: true });
};
$('close').onclick = () => overview({ focus: true });
document.querySelector('.brand').onclick = event => {
  event.preventDefault();
  overview();
};
$('reset').onclick = () => scene?.reset();
$('sound').hidden = !config.sound;
$('sound').onclick = () => {
  sound = !sound;
  $('sound').setAttribute('aria-pressed', String(sound));
  $('sound').querySelector('span').textContent = sound ? 'on' : 'off';
  beep();
};

function motion() {
  document.body.classList.toggle('motion-off', paused);
  $('motion').setAttribute('aria-pressed', String(paused));
  $('motion').querySelector('span').textContent = paused ? 'off' : 'on';
  scene?.pause(paused);
}

$('motion').onclick = () => {
  paused = !paused;
  motion();
};
motion();

$('quality').onclick = () => {
  low = !low;
  $('quality').setAttribute('aria-pressed', String(low));
  $('quality').querySelector('span').textContent = low ? 'low' : 'high';
  scene?.quality(low);
};

window.addEventListener('keydown', event => {
  if (intro.open || event.altKey || event.ctrlKey || event.metaKey ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
  if (event.key === 'Escape' && active >= 0) {
    overview({ focus: true });
    return;
  }
  if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    const count = config.artifacts.length;
    if (count) {
      const next = active < 0
        ? (event.key === 'ArrowRight' ? 0 : count - 1)
        : (active + (event.key === 'ArrowRight' ? 1 : -1) + count) % count;
      select(next);
      buttons[next].focus({ preventScroll: true });
    }
  }
});

if (config.intro && !paused) {
  let visited = false;
  try { visited = sessionStorage.getItem('nexus-entered') === '1'; } catch {}
  if (!visited && intro.showModal) {
    intro.showModal();
    $('enter').focus();
  }
}

function entered() {
  if (intro.open) intro.close();
  try { sessionStorage.setItem('nexus-entered', '1'); } catch {}
  beep();
  $('explore').focus({ preventScroll: true });
}

$('enter').onclick = entered;
intro.addEventListener('cancel', event => {
  event.preventDefault();
  entered();
});

function showRenderer(mode, diagnostic = '') {
  const available = Boolean(mode);
  $('world').hidden = !available;
  $('fallback').hidden = available;
  $('renderer-status').textContent = available ? 'LIVE / ' + mode.toUpperCase() : 'ACCESSIBLE MODE';
  $('renderer-info').textContent = diagnostic || mode;
  $('hint').textContent = available ? 'DRAG TO ROTATE · CLICK TO OPEN' : 'Use the destination buttons to explore';
  $('quality').hidden = !available;
  $('reset').hidden = !available;
}

import('./scene.js').then(({ createScene }) => {
  scene = createScene(config, select, showRenderer);
  scene.focus(active);
  scene.pause(paused);
  scene.quality(low);
  const selector = $('renderer');
  selector.addEventListener('change', () => scene.switchRenderer(selector.value));
  selector.disabled = false;
  scene.switchRenderer(selector.value);
}).catch(error => {
  console.error('Gallery module failed to load:', error);
  showRenderer('', `Could not load scene.js (${error.message}). Check that the script is served alongside main.js.`);
});
