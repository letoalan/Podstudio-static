import { it, expect, vi } from 'vitest';
import { createBlockBadge, createBlockRail } from '../src/ui/block-rail.js';

it('creates a block badge with rank and accessible label', () => {
  const badge = createBlockBadge({ rank: 5, color: '#3b82f6' });
  expect(badge.textContent).toBe('5');
  expect(badge.getAttribute('aria-label')).toBe('Bloc 5');
  expect(badge.style.backgroundColor).not.toBe('');
});

it('triggers onColorPick when color picker input changes', () => {
  const onColorPick = vi.fn();
  const badge = createBlockBadge({ rank: 2, color: '#ff0055', onColorPick });
  const input = badge.querySelector('input[type="color"]');
  expect(input).not.toBeNull();
  expect(input.value).toBe('#ff0055');

  input.value = '#22d3a5';
  input.dispatchEvent(new Event('change'));
  expect(onColorPick).toHaveBeenCalledWith('#22d3a5');
});

it('creates a block rail node with top/bottom lines', () => {
  const railNode = createBlockRail({ rank: 1, color: '#8940fa', isFirst: true, isLast: false });
  expect(railNode.dataset.rank).toBe('1');
  const lineTop = railNode.querySelector('.rail-line-top');
  const lineBottom = railNode.querySelector('.rail-line-bottom');
  expect(lineTop.classList.contains('is-hidden')).toBe(true);
  expect(lineBottom.classList.contains('is-hidden')).toBe(false);
});
