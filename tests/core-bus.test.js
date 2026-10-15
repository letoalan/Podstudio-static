import { it, expect, vi } from 'vitest';
import { emit, on } from '../src/core/bus.js';

it('délivre le détail aux abonnés', () => {
  const handler = vi.fn();
  const off = on('test:event', handler);
  emit('test:event', { a: 1 });
  expect(handler).toHaveBeenCalledWith({ a: 1 });
  off();
});

it('ne notifie plus après désabonnement', () => {
  const handler = vi.fn();
  const off = on('test:off', handler);
  off();
  emit('test:off', 1);
  expect(handler).not.toHaveBeenCalled();
});

it('isole les noms d\'événements', () => {
  const handler = vi.fn();
  const off = on('test:a', handler);
  emit('test:b', 1);
  expect(handler).not.toHaveBeenCalled();
  off();
});
