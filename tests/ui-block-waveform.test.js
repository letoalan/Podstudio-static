import { it, expect, vi } from 'vitest';
import { renderBlockEqualizer } from '../src/ui/block-waveform.js';
import { createBlock } from '../src/core/block-model.js';

it('renders empty hint for empty block', () => {
  const block = createBlock();
  const el = renderBlockEqualizer(block);
  expect(el.classList.contains('block-equalizer-lane')).toBe(true);
  expect(el.textContent).toContain('Bloc vide');
});

it('renders 54 equalizer bars for block with clips and handles seek click', () => {
  const block = createBlock({ clips: [{ duration: 10, start: 0 }] });
  const onSeek = vi.fn();
  const el = renderBlockEqualizer(block, { isPlaying: true, onSeek });

  expect(el.classList.contains('is-playing')).toBe(true);
  const bars = el.querySelectorAll('.block-eq-bar');
  expect(bars.length).toBe(54);

  // simulate click
  el.getBoundingClientRect = () => ({ left: 0, width: 200 });
  el.dispatchEvent(new MouseEvent('click', { clientX: 100 }));
  expect(onSeek).toHaveBeenCalledWith(5);
});
