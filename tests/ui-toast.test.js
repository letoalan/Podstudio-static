import { describe, it, expect, vi, beforeEach } from 'vitest';
import { showToast } from '../src/ui/toast.js';

describe('ui/toast.js', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('creates region and displays toast message', () => {
    const toast = showToast('Enregistrement réussi', { type: 'success', duration: 0 });
    const region = document.querySelector('#toasts');
    expect(region).not.toBeNull();
    expect(region.getAttribute('role')).toBe('status');
    expect(toast.textContent).toBe('Enregistrement réussi');
    expect(toast.className).toContain('toast--success');
  });

  it('removes toast after specified duration', () => {
    vi.useFakeTimers();
    const toast = showToast('Alerte', { duration: 1000 });
    expect(document.body.contains(toast)).toBe(true);
    vi.advanceTimersByTime(1001);
    expect(document.body.contains(toast)).toBe(false);
  });
});
