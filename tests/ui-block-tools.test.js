import { it, expect, vi } from 'vitest';
import { createBlock } from '../src/core/block-model.js';
import { mountBlockTools } from '../src/ui/block-tools.js';

it('renders action tools for active block', () => {
  const container = document.createElement('div');
  const block = createBlock({ id: 'b1' });
  const onOpenEditor = vi.fn();
  const onDuplicate = vi.fn();
  const onDelete = vi.fn();

  mountBlockTools(container, {
    block,
    onUpdateBlock: vi.fn(),
    onOpenEditor,
    onDuplicate,
    onDelete,
  });

  const btnEdit = container.querySelector('button[title*="diteur"]');
  const btnDup = container.querySelector('button[title*="Dupliquer"]');
  const btnDel = container.querySelector('button[title*="Supprimer"]');

  expect(btnEdit).not.toBeNull();
  expect(btnDup).not.toBeNull();
  expect(btnDel).not.toBeNull();

  btnEdit.click();
  expect(onOpenEditor).toHaveBeenCalledWith(block);

  btnDup.click();
  expect(onDuplicate).toHaveBeenCalledWith('b1');

  btnDel.click();
  expect(onDelete).toHaveBeenCalledWith('b1');
});
