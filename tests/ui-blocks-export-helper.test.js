import { it, expect, vi } from 'vitest';
import { exportPodcastAction, handleOpenProject } from '../src/ui/views/blocks-export-helper.js';

it('warns when exporting an empty podcast with 0 playable blocks', async () => {
  const project = { blocks: [] };
  const storage = {};
  await exportPodcastAction(project, storage);
  const toast = document.querySelector('.toast');
  expect(toast?.textContent).toContain('Le podcast est vide');
});

it('handles project import with invalid file without throwing', () => {
  const onLoaded = vi.fn();
  handleOpenProject(null, onLoaded);
  expect(onLoaded).not.toHaveBeenCalled();
});
