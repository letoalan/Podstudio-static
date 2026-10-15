import { describe, it, expect, vi } from 'vitest';
import { attachTrimHandles } from '../src/ui/timeline-trim.js';

const PointerEvent = globalThis.PointerEvent || class extends MouseEvent {
  constructor(type, init = {}) {
    super(type, init);
    this.pointerId = init.pointerId || 0;
  }
};

describe('ui/timeline-trim.js', () => {
  it('attaches start and end trim handles to clip element', () => {
    const el = document.createElement('div');
    const track = { id: 't1', buffer: { duration: 10 }, offset: 2, trimStart: 0, duration: 10 };
    attachTrimHandles(el, track, 10, { onTrim: vi.fn() });
    const startHandle = el.querySelector('.clip-trim--start');
    const endHandle = el.querySelector('.clip-trim--end');
    expect(startHandle).not.toBeNull();
    expect(endHandle).not.toBeNull();
  });

  it('handles start trim dragging via pointer events', () => {
    const el = document.createElement('div');
    const track = { id: 't1', buffer: { duration: 10 }, offset: 0, trimStart: 0, duration: 10 };
    const onTrim = vi.fn();
    attachTrimHandles(el, track, 10, { onTrim });
    const startHandle = el.querySelector('.clip-trim--start');

    startHandle.dispatchEvent(new PointerEvent('pointerdown', { clientX: 0, pointerId: 1 }));
    startHandle.dispatchEvent(new PointerEvent('pointermove', { clientX: 20 }));
    startHandle.dispatchEvent(new PointerEvent('pointerup', { clientX: 20 }));

    expect(onTrim).toHaveBeenCalledWith('t1', expect.objectContaining({
      offset: 2,
      trimStart: 2,
      duration: 8,
    }));
  });

  it('handles end trim dragging via pointer events', () => {
    const el = document.createElement('div');
    const track = { id: 't1', buffer: { duration: 10 }, offset: 0, trimStart: 0, duration: 10 };
    const onTrim = vi.fn();
    attachTrimHandles(el, track, 10, { onTrim });
    const endHandle = el.querySelector('.clip-trim--end');

    endHandle.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, pointerId: 1 }));
    endHandle.dispatchEvent(new PointerEvent('pointermove', { clientX: 80 }));
    endHandle.dispatchEvent(new PointerEvent('pointerup', { clientX: 80 }));

    expect(onTrim).toHaveBeenCalledWith('t1', expect.objectContaining({
      duration: 8,
    }));
  });
});
