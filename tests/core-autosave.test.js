import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAutosave } from '../src/core/autosave.js';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it('delays save by specified duration and debounces rapid triggers', async () => {
  const saveFn = vi.fn();
  const autosave = createAutosave(saveFn, 30000);

  autosave.trigger({ v: 1 });
  expect(autosave.isPending()).toBe(true);
  expect(saveFn).not.toHaveBeenCalled();

  vi.advanceTimersByTime(15000);
  autosave.trigger({ v: 2 });

  vi.advanceTimersByTime(20000);
  expect(saveFn).not.toHaveBeenCalled();

  vi.advanceTimersByTime(10000);
  expect(saveFn).toHaveBeenCalledTimes(1);
  expect(saveFn).toHaveBeenCalledWith({ v: 2 });
  expect(autosave.isPending()).toBe(false);
});

it('flushes pending changes immediately on demand', async () => {
  const saveFn = vi.fn();
  const autosave = createAutosave(saveFn, 30000);

  autosave.trigger({ data: 'important' });
  await autosave.flush();

  expect(saveFn).toHaveBeenCalledWith({ data: 'important' });
  expect(autosave.isPending()).toBe(false);

  await autosave.flush();
  expect(saveFn).toHaveBeenCalledTimes(1);
});

it('cancels pending save correctly', () => {
  const saveFn = vi.fn();
  const autosave = createAutosave(saveFn, 1000);

  autosave.trigger({ data: 'cancel me' });
  autosave.cancel();

  vi.advanceTimersByTime(2000);
  expect(saveFn).not.toHaveBeenCalled();
  expect(autosave.isPending()).toBe(false);
});

it('prevents calls after dispose', () => {
  const saveFn = vi.fn();
  const autosave = createAutosave(saveFn, 1000);

  autosave.dispose();
  autosave.trigger({ data: 'ignored' });
  vi.advanceTimersByTime(2000);
  expect(saveFn).not.toHaveBeenCalled();
});
