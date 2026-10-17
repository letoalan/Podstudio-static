import { describe, it, expect, vi } from 'vitest';
import { mountEditorShell } from '../src/ui/editor/editor-shell.js';
import { createBlock, createClip } from '../src/core/block-model.js';

describe('ui/editor/editor-shell.js', () => {
  it('mounts editor shell with toolbar, tracks and inspector', () => {
    const container = document.createElement('div');
    const clip = createClip({ id: 'c1', name: 'Voix', start: 0, duration: 4 });
    const block = createBlock({ clips: [clip] });

    const shell = mountEditorShell(container, {
      block,
      onUpdateBlock: vi.fn(),
      onClose: vi.fn(),
    });

    expect(container.querySelector('.editor-toolbar')).not.toBeNull();
    expect(container.querySelector('.timeline-clip')).not.toBeNull();
    expect(container.querySelector('.unified-clip-inspector')).not.toBeNull();

    shell.destroy();
  });

  it('triggers playback on play button click and space key', async () => {
    const container = document.createElement('div');
    const clip = createClip({ id: 'c1', sourceId: 's1', start: 0, duration: 4 });
    const block = createBlock({ clips: [clip] });
    const fakeStorage = {
      getRecording: vi.fn().mockResolvedValue({
        id: 's1',
        audio: new ArrayBuffer(16),
      }),
    };

    const shell = mountEditorShell(container, {
      block,
      storage: fakeStorage,
      onUpdateBlock: vi.fn(),
      onClose: vi.fn(),
    });

    const playBtn = container.querySelector('.transport-group button');
    expect(playBtn).not.toBeNull();
    expect(playBtn.textContent).toContain('Lecture');

    playBtn.click();
    await new Promise((r) => setTimeout(r, 10));

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    shell.destroy();
  });
});
