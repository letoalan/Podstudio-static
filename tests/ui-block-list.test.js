import { it, expect, vi } from 'vitest';
import { createBlock } from '../src/core/block-model.js';
import { createProject } from '../src/core/project.js';
import { DEFAULT_PALETTE } from '../src/core/palette.js';
import { mountBlockList } from '../src/ui/block-list.js';

it('displays empty state and adds a nameless block', () => {
  const container = document.createElement('div');
  const project = createProject({ blocks: [] });
  const onChange = vi.fn();

  mountBlockList(container, { project, onChange, onOpenEditor: vi.fn() });
  expect(container.querySelector('.empty-block-state')).not.toBeNull();

  container.querySelector('.rail-add-bottom button').click();
  expect(onChange).toHaveBeenCalledTimes(1);
  const updated = onChange.mock.calls[0][0];
  expect(updated.blocks).toHaveLength(1);
  expect(updated.blocks[0]).not.toHaveProperty('title');
});

it('numbers blocks 1..n with cycling palette colors on rail badges', () => {
  const container = document.createElement('div');
  const blocks = Array.from({ length: 9 }, (_, i) => createBlock({ id: `b${i}`, clips: [{ duration: 1 }] }));
  const project = createProject({ blocks });
  const onSelect = vi.fn();

  mountBlockList(container, { project, onChange: vi.fn(), onSelect, onOpenEditor: vi.fn() });
  const badges = [...container.querySelectorAll('.block-rail-badge')];
  expect(badges.map((b) => b.textContent)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
  expect(badges[0].style.backgroundColor).toBe(badges[8].style.backgroundColor);
  expect(DEFAULT_PALETTE).toHaveLength(8);

  container.querySelectorAll('.block-card')[1].click();
  expect(onSelect).toHaveBeenCalledWith(blocks[1].id);
});

it('allows inserting a block between existing blocks', () => {
  const container = document.createElement('div');
  const project = createProject({
    blocks: [createBlock({ id: 'b1' }), createBlock({ id: 'b2' })],
  });
  const onChange = vi.fn();
  mountBlockList(container, { project, onChange, onOpenEditor: vi.fn() });

  const insertBtn = container.querySelector('.rail-insert-slot button');
  expect(insertBtn).not.toBeNull();
  insertBtn.click();

  expect(onChange).toHaveBeenCalledTimes(1);
  const updated = onChange.mock.calls[0][0];
  expect(updated.blocks).toHaveLength(3);
  expect(updated.blocks[0].id).toBe('b1');
  expect(updated.blocks[2].id).toBe('b2');
});

it('removes a block with its trash icon, including an empty one', () => {
  const container = document.createElement('div');
  const project = createProject({ blocks: [createBlock({ id: 'vide' })] });
  const onChange = vi.fn();
  mountBlockList(container, { project, onChange, onOpenEditor: vi.fn() });
  container.querySelector('button[title="Supprimer le bloc"]').click();
  expect(onChange.mock.calls[0][0].blocks).toHaveLength(0);
});

it('toggles insert capsule open state on center trigger click and mouseleave', () => {
  const container = document.createElement('div');
  const project = createProject({ blocks: [createBlock({ id: 'b1' })] });
  mountBlockList(container, { project, onChange: vi.fn(), onOpenEditor: vi.fn() });

  const slot = container.querySelector('.rail-add-bottom');
  const trigger = slot.querySelector('.btn-insert-trigger');
  expect(trigger).not.toBeNull();
  expect(slot.classList.contains('is-open')).toBe(false);

  trigger.click();
  expect(slot.classList.contains('is-open')).toBe(true);

  slot.dispatchEvent(new Event('mouseleave'));
  expect(slot.classList.contains('is-open')).toBe(false);
});

it('inserts a transition when clicking the transition wing', () => {
  const container = document.createElement('div');
  const project = createProject({
    blocks: [createBlock({ id: 'b1' }), createBlock({ id: 'b2' })],
  });
  const onChange = vi.fn();
  mountBlockList(container, { project, onChange, onOpenEditor: vi.fn() });

  const transBtn = container.querySelector('.btn-insert-trans');
  expect(transBtn).not.toBeNull();
  expect(transBtn.textContent).toContain('Transition');
  transBtn.click();

  expect(onChange).toHaveBeenCalledTimes(1);
  const updated = onChange.mock.calls[0][0];
  expect(updated.blocks).toHaveLength(3);
  expect(updated.blocks[1].type).toBe('transition');
});
