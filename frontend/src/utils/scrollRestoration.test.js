/* eslint-env jest */

import { applyRouteScroll, buildScrollStorageKey, persistRouteScroll } from './scrollRestoration';

describe('scrollRestoration utilities', () => {
  test('builds key from location key when available', () => {
    expect(buildScrollStorageKey({ key: 'abc', pathname: '/x', search: '?q=1' })).toBe('scroll:abc');
  });

  test('resets scroll to top on non-POP navigation', () => {
    const scrollTo = jest.fn();
    const frame = (callback) => callback();

    applyRouteScroll({
      navigationType: 'PUSH',
      location: { pathname: '/guardia-medica', search: '' },
      storage: { getItem: jest.fn() },
      scrollTo,
      frame,
    });

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });

  test('restores saved scroll on POP navigation', () => {
    const scrollTo = jest.fn();
    const frame = (callback) => callback();
    const storage = { getItem: jest.fn().mockReturnValue('420') };

    applyRouteScroll({
      navigationType: 'POP',
      location: { key: 'entry-1', pathname: '/mantenimiento', search: '' },
      storage,
      scrollTo,
      frame,
    });

    expect(storage.getItem).toHaveBeenCalledWith('scroll:entry-1');
    expect(scrollTo).toHaveBeenCalledWith({ top: 420, left: 0, behavior: 'auto' });
  });

  test('persists current scroll position using the computed key', () => {
    const storage = { setItem: jest.fn() };

    persistRouteScroll({
      location: { key: 'entry-2' },
      y: 315,
      storage,
    });

    expect(storage.setItem).toHaveBeenCalledWith('scroll:entry-2', '315');
  });
});