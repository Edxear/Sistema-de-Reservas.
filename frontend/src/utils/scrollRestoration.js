export const buildScrollStorageKey = (location) => `scroll:${location?.key || `${location?.pathname || ''}${location?.search || ''}`}`;

export function applyRouteScroll({ navigationType, location, storage = sessionStorage, scrollTo = window.scrollTo.bind(window), frame = requestAnimationFrame }) {
  if (navigationType !== 'POP') {
    frame(() => scrollTo({ top: 0, left: 0, behavior: 'auto' }));
    return;
  }

  const saved = storage.getItem(buildScrollStorageKey(location));
  if (!saved) return;

  const y = Number(saved);
  if (Number.isNaN(y)) return;

  frame(() => scrollTo({ top: y, left: 0, behavior: 'auto' }));
}

export function persistRouteScroll({ location, y = window.scrollY, storage = sessionStorage }) {
  storage.setItem(buildScrollStorageKey(location), String(y));
}