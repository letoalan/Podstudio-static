import { it, expect } from 'vitest';
import { mountBlocksView } from '../src/ui/views/blocks.js';
import { createProject } from '../src/core/project.js';

it('mounts blocks view with global bar and rail cards', () => {
  const container = document.createElement('div');
  const project = createProject({
    title: 'Podcast Test',
    blocks: [],
  });

  const view = mountBlocksView(container, { project });
  expect(container.querySelector('.blocks-global-bar')).not.toBeNull();
  expect(container.querySelector('.block-list-container')).not.toBeNull();
  expect(view.getProject().title).toBe('Podcast Test');
  view.destroy();
});

it('populates existing empty block when block:import is emitted', async () => {
  const { emit } = await import('../src/core/bus.js');
  const { createBlock } = await import('../src/core/block-model.js');
  const container = document.createElement('div');
  const emptyBlock = createBlock({ topic: 'Monologue' });
  const project = createProject({
    title: 'Podcast Test',
    blocks: [emptyBlock],
  });
  const mockStorage = {
    getRecording: async () => null,
    getAudioBlob: async () => null,
  };
  const view = mountBlocksView(container, { project, storage: mockStorage });
  emit('block:import', { id: 'rec-test-1', title: 'Chronique 1', duration: 25 });
  const blocks = view.getProject().blocks;
  expect(blocks.length).toBe(1);
  expect(blocks[0].id).toBe(emptyBlock.id);
  expect(blocks[0].clips.length).toBe(1);
  expect(blocks[0].clips[0].sourceId).toBe('rec-test-1');
  expect(blocks[0].clips[0].name).toBe('Chronique 1');
  view.destroy();
});

