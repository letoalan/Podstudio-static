import { it, expect } from 'vitest';
import {
  createHistory,
  pushState,
  undo,
  redo,
  canUndo,
  canRedo,
  clearHistory,
} from '../src/core/history.js';

it('initializes history with empty stacks', () => {
  const h = createHistory(10);
  expect(canUndo(h)).toBe(false);
  expect(canRedo(h)).toBe(false);
  expect(undo(h, { step: 1 })).toBeNull();
  expect(redo(h, { step: 1 })).toBeNull();
});

it('pushes states and executes undo and redo correctly', () => {
  let h = createHistory();
  let current = { count: 1 };

  h = pushState(h, current);
  current = { count: 2 };
  h = pushState(h, current);
  current = { count: 3 };

  expect(canUndo(h)).toBe(true);
  expect(canRedo(h)).toBe(false);

  const undoRes1 = undo(h, current);
  expect(undoRes1.state).toEqual({ count: 2 });
  h = undoRes1.history;
  current = undoRes1.state;

  expect(canUndo(h)).toBe(true);
  expect(canRedo(h)).toBe(true);

  const redoRes = redo(h, current);
  expect(redoRes.state).toEqual({ count: 3 });
  h = redoRes.history;
  current = redoRes.state;

  expect(canRedo(h)).toBe(false);
});

it('clears future when a new state is pushed after undo', () => {
  let h = createHistory();
  h = pushState(h, { v: 'A' });
  const res = undo(h, { v: 'B' });
  h = res.history;
  expect(canRedo(h)).toBe(true);

  h = pushState(h, { v: 'C' });
  expect(canRedo(h)).toBe(false);
});

it('respects stack limit', () => {
  let h = createHistory(2);
  h = pushState(h, 1);
  h = pushState(h, 2);
  h = pushState(h, 3);
  expect(h.past).toEqual([2, 3]);
});

it('clears history completely', () => {
  let h = createHistory();
  h = pushState(h, 'test');
  h = clearHistory(h);
  expect(h.past).toEqual([]);
  expect(h.future).toEqual([]);
});
