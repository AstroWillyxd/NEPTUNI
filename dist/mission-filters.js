export function setupMissionFilters(onFilter) {
  const groups = [...document.querySelectorAll('.mission-group')];
  const filters = [...document.querySelectorAll('.world-filters button')];
  const count = document.getElementById('filter-count');

  for (const filter of filters) {
    filter.addEventListener('click', () => {
      const world = filter.dataset.world;
      let total = 0;
      for (const button of filters) button.setAttribute('aria-pressed', String(button === filter));
      for (const group of groups) {
        let visible = 0;
        for (const card of group.querySelectorAll('.mission-card')) {
          card.hidden = world !== 'Todas' && card.dataset.worldName !== world;
          if (!card.hidden) visible++;
        }
        group.hidden = visible === 0;
        const year = group.dataset.groupYear;
        document.querySelector(`.year-link[data-year="${year}"]`).hidden = group.hidden;
        group.querySelector('.group-heading').textContent = `${year} · ${visible} ${visible === 1 ? 'misión' : 'misiones'}`;
        total += visible;
      }
      count.textContent = `${total} misiones${world === 'Todas' ? '' : ' · ' + world}`;
      onFilter();
    });
  }
}
