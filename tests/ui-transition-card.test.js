import { describe, it, expect, vi } from 'vitest';
import { createTransitionBlock } from '../src/core/transition-model.js';
import { createTransitionCard } from '../src/ui/transition-card.js';

describe('ui/transition-card.js', () => {
  it('renders an arc bridge by default and expands to ghost mode on click', () => {
    const block = createTransitionBlock({ transitionType: 'crossfade', duration: 1.5 });
    const card = createTransitionCard(block);

    expect(card.classList.contains('is-arc-mode')).toBe(true);
    const trigger = card.querySelector('.transition-arc-trigger');
    expect(trigger.textContent).toContain('1.5s');

    // Click trigger to expand into ghost mode
    trigger.click();
    expect(card.classList.contains('is-ghost-mode')).toBe(true);
    expect(card.querySelector('.transition-title').textContent).toContain('⚡ Transition');

    // Click minus button to collapse back to arc mode
    const btnMinus = card.querySelector('.transition-btn-collapse');
    btnMinus.click();
    expect(card.classList.contains('is-arc-mode')).toBe(true);
  });

  it('triggers onUpdate when changing transition type in ghost mode', () => {
    const block = createTransitionBlock({ transitionType: 'pause', duration: 1.0, isGhost: true });
    const onUpdate = vi.fn();
    const card = createTransitionCard(block, { onUpdate });

    const select = card.querySelector('.transition-select');
    select.value = 'jingle';
    select.dispatchEvent(new Event('change'));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.calls[0][0].transition.type).toBe('jingle');
  });

  it('triggers onDelete when clicking the delete button in ghost mode', () => {
    const block = createTransitionBlock({ id: 'trans-42', isGhost: true });
    const onDelete = vi.fn();
    const card = createTransitionCard(block, { onDelete });

    const btnDel = card.querySelector('.transition-btn-del');
    btnDel.click();

    expect(onDelete).toHaveBeenCalledWith('trans-42');
  });
});
