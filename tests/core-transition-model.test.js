import { describe, it, expect } from 'vitest';
import {
  TRANSITION_TYPES,
  getTransitionMeta,
  normalizeTransition,
  createTransitionBlock,
  isTransitionBlock,
} from '../src/core/transition-model.js';

describe('core/transition-model.js', () => {
  it('provides the 5 required transition types', () => {
    const ids = TRANSITION_TYPES.map((t) => t.id);
    expect(ids).toContain('crossfade');
    expect(ids).toContain('pause');
    expect(ids).toContain('whoosh');
    expect(ids).toContain('jingle');
    expect(ids).toContain('fade');
  });

  it('retrieves transition metadata or defaults to crossfade', () => {
    expect(getTransitionMeta('pause').label).toBe('Silence / Pause');
    expect(getTransitionMeta('unknown').id).toBe('crossfade');
  });

  it('normalizes transitions and clamps durations between 0.2s and 10s', () => {
    const t1 = normalizeTransition({ type: 'jingle', duration: 2 });
    expect(t1.type).toBe('jingle');
    expect(t1.duration).toBe(2);

    const clampedLow = normalizeTransition({ duration: 0.05 });
    expect(clampedLow.duration).toBe(0.2);

    const clampedHigh = normalizeTransition({ duration: 50 });
    expect(clampedHigh.duration).toBe(10);
  });

  it('creates a transition block with correct structure and type check', () => {
    const block = createTransitionBlock({ transitionType: 'whoosh', duration: 1.2 });
    expect(block.type).toBe('transition');
    expect(block.transition.type).toBe('whoosh');
    expect(block.transition.duration).toBe(1.2);
    expect(isTransitionBlock(block)).toBe(true);
    expect(isTransitionBlock({ id: 'b1' })).toBe(false);
  });
});
