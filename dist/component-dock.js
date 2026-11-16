const keyOf = part => part.key || part.id;

export function createComponentDock({getParts, onSelect, onReset, onRead, onOpen, onView}) {
  const toggle = document.getElementById('components-toggle');
  const menu = document.getElementById('component-menu');
  const heading = document.getElementById('component-menu-heading');
  const scroll = document.getElementById('component-menu-scroll');
  const items = document.getElementById('component-menu-items');
  const up = document.getElementById('component-up');
  const description = document.getElementById('component-menu-description');
  const source = document.getElementById('component-menu-source');
  const status = document.getElementById('component-menu-status');
  const view = document.getElementById('component-view');

  let mission, path = [], available = false, loading = false, revision = 0;
  const index = new Map();

  function setOpen(open, focus = false) {
    if (open && menu.hidden) onOpen();
    menu.hidden = !open;
    if (open && focus) scroll.scrollTop = 0;
    toggle.setAttribute('aria-expanded', String(open));
    if (focus) (open ? heading : toggle).focus({preventScroll: true});
  }

  function render(focus = false) {
    const part = path.at(-1);
    const parent = part?.children?.length ? part : path.at(-2);
    const children = parent?.children || getParts(mission);
    heading.textContent = parent?.name || 'Sistemas de la nave';
    up.hidden = !part;
    description.hidden = !part;
    description.textContent = part?.description || part?.function || '';
    source.hidden = !part;
    source.href = part?.source || mission.source;
    source.textContent = part?.source ? 'Fuente del componente →' : 'Fuente de la misión →';
    items.replaceChildren();
    for (const child of children) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'component-choice';
      if (child === part) button.setAttribute('aria-current', 'true');
      const name = document.createElement('span');
      const arrow = document.createElement('span');
      name.textContent = child.name;
      arrow.textContent = child === part ? '✓' : '→';
      arrow.setAttribute('aria-hidden', 'true');
      button.append(name, arrow);
      button.addEventListener('click', () => select(keyOf(child), true));
      items.append(button);
    }
    if (focus && !menu.hidden) {
      const selected = items.querySelector('[aria-current="true"]');
      if (selected) {
        const panel = scroll.getBoundingClientRect();
        const row = selected.getBoundingClientRect();
        if (row.bottom > panel.bottom - 8) scroll.scrollTop += row.bottom - panel.bottom + 8;
        else if (row.top < panel.top + 8) scroll.scrollTop += row.top - panel.top - 8;
      } else scroll.scrollTop = 0;
      (selected || heading).focus({preventScroll: true});
    }
  }

  function report() {
    view.hidden = !available || !path.length;
    status.textContent = loading ? 'Cargando el modelo 3D…' : available ? '' : 'Ficha de componentes disponible.';
  }

  async function inspect(key, request) {
    if (!available) return;
    const ok = await (key ? onSelect(key) : onReset());
    if (request === revision && ok === false) status.textContent = 'La ficha de esta pieza está disponible.';
  }

  function select(key, focus = false) {
    const next = index.get(key);
    if (!next) return false;
    path = next;
    const request = ++revision;
    render(focus);
    onRead(next.at(-1));
    report();
    void inspect(key, request);
    return true;
  }

  toggle.addEventListener('click', () => setOpen(menu.hidden, true));
  view.addEventListener('click', onView);
  up.addEventListener('click', () => {
    if (path.length > 1) {
      select(keyOf(path.at(-2)), true);
    } else {
      path = [];
      onRead(null);
      const request = ++revision;
      render(true);
      report();
      void inspect(null, request);
    }
  });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false, true);
    }
  });

  return {
    load(next) {
      revision++;
      mission = next;
      path = [];
      available = false;
      loading = true;
      index.clear();
      function visit(parts, parents) {
        for (const part of parts) {
          const branch = [...parents, part];
          index.set(keyOf(part), branch);
          visit(part.children || [], branch);
        }
      }
      visit(getParts(mission), []);
      setOpen(true);
      scroll.scrollTop = 0;
      render();
      report();
    },
    ready(value, isLoading) {
      const starting = value && !available;
      available = value;
      loading = isLoading;
      report();
      if (starting && path.length) void inspect(keyOf(path.at(-1)), revision);
    },
    sync(part, renderedPath = []) {
      if (!mission || !available) return;
      const next = part ? index.get(keyOf(part)) || renderedPath : [];
      if (next.at(-1) === path.at(-1)) return;
      path = next;
      render();
      report();
    },
    select(key) {
      if (!index.has(key)) return false;
      setOpen(true);
      return select(key);
    },
    open() { setOpen(true); },
    close() { setOpen(false); }
  };
}
