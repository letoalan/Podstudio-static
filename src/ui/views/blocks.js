/**
 * Rôle : vue principale Blocs (pile de cartes et transitions, export podcast, import bibliothèque et éditeur unifié).
 * Exemple : mountBlocksView(document.getElementById('view-studio'));
 */
import { h } from '../dom.js';
import { createBlock, createClip, isBlockEmpty } from '../../core/block-model.js';
import { createProject, addBlock, insertBlockAt, updateBlock, getProjectDuration } from '../../core/project.js';
import { formatHms } from '../../core/timeline-math.js';
import { createAutosave } from '../../core/autosave.js';
import { mountBlockList } from '../block-list.js';
import { mountEditorShell } from '../editor/editor-shell.js';
import { showToast } from '../toast.js';
import { on } from '../../core/bus.js';
import { BlockPlayer } from '../../audio/block-player.js';
import { togglePlayBlock, togglePlayAll } from '../block-playback.js';
import { serializeProject } from '../../core/project-io.js';
import { exportPodcastAction, handleOpenProject, saveProjectFile } from './blocks-export-helper.js';
import { analyzeProjectBlocks } from '../../audio/audio-analyzer.js';
import * as defaultStorage from '../../core/storage.js';

function renderGlobalBar(project, state, callbacks) {
  const dur = formatHms(getProjectDuration(project));
  const chapters = project.blocks.filter((b) => b.type !== 'transition').length;
  const trans = project.blocks.filter((b) => b.type === 'transition').length;
  const pill = h('span', { class: 'story-conductor-pill' }, '📻 Conducteur d\'Émission');
  const durBadge = h('span', { class: 'block-duration-badge' }, `⏱ Total : ${dur} (${chapters} chap.${trans > 0 ? `, ${trans} trans.` : ''})`);
  const btnPlayAll = h('button', { type: 'button', class: `btn ${state.isGlobalPlaying ? 'danger' : 'primary'} btn-sm`, onClick: callbacks.onTogglePlayAll }, state.isGlobalPlaying ? '⏹ Arrêter' : '▶ Tout écouter');
  const btnExport = h('button', { type: 'button', class: 'btn primary btn-sm', onClick: callbacks.onExport }, '🚀 Exporter le podcast');
  const btnSave = h('button', { type: 'button', class: 'btn secondary btn-sm', title: 'Sauvegarder JSON', onClick: callbacks.onSaveProject }, '💾 Sauvegarder');
  const fileInput = h('input', { type: 'file', accept: '.json', style: 'display:none;' });
  const btnOpen = h('button', { type: 'button', class: 'btn secondary btn-sm', title: 'Ouvrir JSON', onClick: () => fileInput.click() }, '📁 Ouvrir');
  fileInput.addEventListener('change', (e) => callbacks.onOpenProject(e.target.files?.[0]));
  return h('div', { class: 'blocks-global-bar' },
    h('div', { class: 'blocks-global-left' }, pill, durBadge, btnPlayAll, btnExport),
    h('div', { class: 'blocks-global-right' }, btnSave, btnOpen, fileInput));
}

function openEditorModal(overlay, block, rank, onCommit, onExit, storage) {
  overlay.classList.remove('hidden');
  mountEditorShell(overlay, {
    block, rank, storage, onUpdateBlock: onCommit,
    onClose: () => { overlay.classList.add('hidden'); overlay.innerHTML = ''; onExit(); },
  });
}


function populateBlockWithLibraryItem(block, item) {
  const trackId = block.tracks[0]?.id || 'track-1';
  return {
    ...block,
    clips: [createClip({
      sourceId: item.id, name: item.title || 'Clip',
      duration: item.duration || 5, trackId, start: 0,
      acousticFeatures: item.acousticFeatures || null,
    })],
    acousticFeatures: item.acousticFeatures || null,
    edited: false,
  };
}

const createBlockFromLibraryItem = (item) => populateBlockWithLibraryItem(createBlock(), item);

function showImportToast(item, newBlock, onOpen) {
  showToast(`« ${item.title} » importé dans le bloc !`, {
    type: 'success',
    action: { label: '✂️ Ouvrir l\'éditeur', onClick: () => onOpen(newBlock) },
  });
}

function applyImportItem(ctx, item, targetBlock, insertIdx, autosave, render, openEditor) {
  if (targetBlock && isBlockEmpty(targetBlock)) {
    const updated = populateBlockWithLibraryItem(targetBlock, item);
    ctx.project = updateBlock(ctx.project, targetBlock.id, updated);
    ctx.state.selectedBlockId = targetBlock.id;
    autosave.trigger(ctx.project);
    render();
    analyzeProjectBlocks(ctx.project, ctx.storage);
    showImportToast(item, updated, openEditor);
    return;
  }
  const nb = createBlockFromLibraryItem(item);
  ctx.project = (insertIdx !== null && insertIdx !== undefined)
    ? insertBlockAt(ctx.project, insertIdx, nb)
    : addBlock(ctx.project, nb);
  ctx.state.selectedBlockId = nb.id;
  autosave.trigger(ctx.project);
  render();
  analyzeProjectBlocks(ctx.project, ctx.storage);
  showImportToast(item, nb, openEditor);
}

function buildCallbacks(ctx, player, autosave, render, openEditor) {
  const pb = { state: ctx.state, storage: ctx.storage, player, render };
  return {
    global: {
      onTogglePlayAll: () => togglePlayAll(ctx.project, pb),
      onExport: () => exportPodcastAction(ctx.project, ctx.storage),
      onSaveProject: () => saveProjectFile(ctx.project),
      onOpenProject: (file) => handleOpenProject(file, (loaded) => { ctx.project = loaded; render(); }),
    },
    list: {
      project: ctx.project, selectedBlockId: ctx.state.selectedBlockId, playingBlockId: ctx.state.playingBlockId, storage: ctx.storage,
      onSelect: (id) => { ctx.state.selectedBlockId = id; render(); },
      onChange: (next) => {
        ctx.project = next; autosave.trigger(ctx.project); render();
        analyzeProjectBlocks(ctx.project, ctx.storage);
      },
      onOpenEditor: openEditor,
      onTogglePlay: (block) => togglePlayBlock(block, pb),
      onDropLibrary: async (libId, idx) => {
        const item = await ctx.storage.getRecording(libId);
        if (item) applyImportItem(ctx, item, ctx.project.blocks[idx], idx, autosave, render, openEditor);
      },
    },
  };
}

let lastImportTime = 0;
let lastImportItemId = null;

function setupBlockImportListener(ctx, autosave, render, openEditor) {
  return on('block:import', (item) => {
    const now = Date.now();
    if (item?.id && item.id === lastImportItemId && now - lastImportTime < 400) return;
    lastImportTime = now;
    lastImportItemId = item?.id || null;
    const selBlock = ctx.project.blocks.find((b) => b.id === ctx.state.selectedBlockId && isBlockEmpty(b));
    const targetBlock = selBlock || ctx.project.blocks.find(isBlockEmpty);
    applyImportItem(ctx, item, targetBlock, null, autosave, render, openEditor);
  });
}

function setupClassifierListener(ctx, autosave, render) {
  return on('block:classified', ({ blockId, features }) => {
    ctx.project = {
      ...ctx.project,
      blocks: ctx.project.blocks.map((b) => (b.id === blockId ? {
        ...b, acousticFeatures: features, clips: b.clips.map((c) => ({ ...c, acousticFeatures: features })),
      } : b)),
    };
    autosave.trigger(ctx.project);
    render();
  });
}

function handleOpenEditorModal(ctx, player, overlay, b, autosave, render) {
  player.stop();
  ctx.state.playingBlockId = null;
  const rank = ctx.project.blocks.findIndex((x) => x.id === b.id) + 1;
  openEditorModal(overlay, b, rank, (u) => {
    ctx.project = { ...ctx.project, blocks: ctx.project.blocks.map((x) => (x.id === u.id ? u : x)) };
    autosave.trigger(ctx.project);
  }, render, ctx.storage);
}

export function mountBlocksView(container, options = {}) {
  const ctx = {
    storage: options.storage || defaultStorage,
    project: options.project || createProject({ title: 'Mon Podcast' }),
    state: { selectedBlockId: options.project?.blocks[0]?.id || null, isGlobalPlaying: false, playingBlockId: null },
  };
  const player = new BlockPlayer();
  const autosave = createAutosave((p) => localStorage.setItem('podstudio_active_project', serializeProject(p)), 2000);
  const overlay = h('div', { class: 'editor-overlay-host hidden' });
  const content = h('div', { class: 'blocks-view-content' });
  const openEditor = (b) => handleOpenEditorModal(ctx, player, overlay, b, autosave, render);

  const render = () => {
    content.innerHTML = '';
    const cb = buildCallbacks(ctx, player, autosave, render, openEditor);
    const globalBar = renderGlobalBar(ctx.project, ctx.state, cb.global);
    const listHost = h('div', { class: 'blocks-rail-host' });
    mountBlockList(listHost, cb.list);
    content.append(globalBar, listHost);
  };

  const unsubs = [
    setupClassifierListener(ctx, autosave, render),
    setupBlockImportListener(ctx, autosave, render, openEditor),
  ];
  container.innerHTML = '';
  container.append(content, overlay);
  render();
  analyzeProjectBlocks(ctx.project, ctx.storage);
  return {
    getProject: () => ctx.project,
    setProject: (p) => { ctx.project = p; render(); },
    destroy: () => unsubs.forEach((u) => u?.()),
  };
}
