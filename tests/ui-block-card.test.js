import { it, expect, vi } from 'vitest';
import { createBlock } from '../src/core/block-model.js';
import { createBlockCard } from '../src/ui/block-card.js';

it('renders a numbered badge with the given color and contrast text', () => {
  const block = createBlock({ id: 'b1' });
  const onSelect = vi.fn();
  const card = createBlockCard(block, { rank: 3, color: '#ffb300', onSelect });

  const badge = card.querySelector('.block-rail-badge');
  expect(card.dataset.blockId).toBe('b1');
  expect(badge.textContent).toBe('3');
  expect(badge.getAttribute('aria-label')).toBe('Bloc 3');
  expect(badge.style.backgroundColor).not.toBe('');
  expect(badge.style.color).toBe('rgb(0, 0, 0)');

  card.click();
  expect(onSelect).toHaveBeenCalledWith('b1');
});

it('flags an empty block as ignored and a filled one as normal', () => {
  const empty = createBlockCard(createBlock(), { rank: 1, color: '#8940fa' });
  expect(empty.classList.contains('is-empty')).toBe(true);
  expect(empty.querySelector('.block-empty-hint')).not.toBeNull();

  const filled = createBlockCard(createBlock({ clips: [{ start: 0, duration: 2 }] }), { rank: 2, color: '#8940fa' });
  expect(filled.classList.contains('is-empty')).toBe(false);
  expect(filled.querySelectorAll('.block-eq-bar').length).toBeGreaterThan(0);
});

it('triggers onDelete from header and mounts tools when isSelected is true', () => {
  const block = createBlock({ id: 'b2' });
  const onDelete = vi.fn();
  const onDuplicate = vi.fn();

  const card = createBlockCard(block, { rank: 2, color: '#8940fa', isSelected: true, onDelete, onDuplicate });
  expect(card.querySelector('.block-selected-tools')).not.toBeNull();

  card.querySelector('button[title="Supprimer le bloc"]').click();
  expect(onDelete).toHaveBeenCalledWith('b2');

  card.querySelector('button[title="Dupliquer ce bloc"]').click();
  expect(onDuplicate).toHaveBeenCalledWith('b2');
});
