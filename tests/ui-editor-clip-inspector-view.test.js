import { describe, it, expect, vi } from 'vitest';
import { createClipInspectorView } from '../src/ui/editor/clip-inspector-view.js';
import { createClip } from '../src/core/block-model.js';

describe('ui/editor/clip-inspector-view.js', () => {
  it('renders an empty state hint when no clip is selected', () => {
    const el = createClipInspectorView({ clip: null });
    expect(el.querySelector('.empty-state-sm')).not.toBeNull();
  });

  it('renders inputs and triggers onUpdateClip on changes', () => {
    const clip = createClip({ name: 'Voix Principale', gain: 0.8, start: 1, offset: 0, duration: 4 });
    const onUpdateClip = vi.fn();
    const el = createClipInspectorView({ clip, onUpdateClip });

    const nameInput = el.querySelector('input[type="text"]');
    expect(nameInput.value).toBe('Voix Principale');
    nameInput.value = 'Voix Modifiée';
    nameInput.dispatchEvent(new Event('change'));

    expect(onUpdateClip).toHaveBeenCalled();
    expect(onUpdateClip.mock.calls[0][0].name).toBe('Voix Modifiée');
  });

  it('triggers action buttons (copy, cut, resetTrim, remove)', () => {
    const clip = createClip({ id: 'c-1', name: 'Test' });
    const onCopy = vi.fn();
    const onCut = vi.fn();
    const onResetTrim = vi.fn();
    const onRemove = vi.fn();

    const el = createClipInspectorView({ clip, onCopy, onCut, onResetTrim, onRemove });
    const buttons = el.querySelectorAll('.inspector-actions button');

    buttons[0].click(); // Copier
    expect(onCopy).toHaveBeenCalledWith(clip);

    buttons[1].click(); // Couper
    expect(onCut).toHaveBeenCalledWith(clip);

    buttons[2].click(); // Réinitialiser
    expect(onResetTrim).toHaveBeenCalledWith(clip);

    buttons[3].click(); // Supprimer
    expect(onRemove).toHaveBeenCalledWith('c-1');
  });
});
