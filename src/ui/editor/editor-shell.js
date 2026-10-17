/**
 * Rôle : panneau de l'éditeur timeline unifié d'un bloc (barre d'outils, pistes, curseur, raccourcis, inspecteur et historique).
 * Exemple : const shell = mountEditorShell(container, { block, onUpdateBlock, onClose });
 */
import { h } from '../dom.js';
import { formatHms } from '../../core/timeline-math.js';
import { getBlockTotalDuration } from '../../core/block-model.js';
import { createHistory, pushState, undo as historyUndo, redo as historyRedo } from '../../core/history.js';
import { copyClips, cutClips, pasteClips } from '../../core/clipboard.js';
import { splitClip, deleteClip, moveClip } from '../../core/clip-ops.js';
import { createEditorToolbar } from './toolbar.js';
import { createTrackView } from './track-view.js';
import { createRuler } from './ruler.js';
import { createPlayhead } from './playhead.js';
import { bindEditorShortcuts } from './shortcuts.js';
import { BlockPlayer } from '../../audio/block-player.js';
import { loadProjectBuffers } from '../../audio/block-render.js';
import * as defaultStorage from '../../core/storage.js';
import { showToast } from '../toast.js';
import { createClipInspectorView } from './clip-inspector-view.js';

function createHeader(block, onClose, rank) {
  const backBtn = h('button', { type: 'button', class: 'btn secondary btn-sm' }, '← Retour aux blocs');
  backBtn.addEventListener('click', onClose);
  const title = h('h3', { class: 'editor-block-title' }, rank ? `Éditeur : bloc ${rank}` : 'Éditeur de bloc');
  const dur = h('span', { class: 'block-duration-badge' }, formatHms(getBlockTotalDuration(block)));
  return h('div', { class: 'editor-shell-header' }, backBtn, title, dur);
}

function applyPaste(ctx, clipboard = ctx.clipboard) {
  if (!clipboard) return;
  const nextBlock = pasteClips(clipboard, ctx.currentBlock);
  const newClip = nextBlock.clips[nextBlock.clips.length - 1];
  if (newClip) ctx.selectedClipId = newClip.id;
  ctx.commit(nextBlock);
}

function createPlaybackController(ctx, storage) {
  const stop = () => {
    if (ctx.animFrame) cancelAnimationFrame(ctx.animFrame);
    ctx.animFrame = null;
    ctx.player.stop();
  };

  const play = async () => {
    if (!ctx.currentBlock.clips?.length) {
      showToast('Ce bloc ne contient aucun clip audio.', { type: 'info' });
      return;
    }
    stop();
    const audioCtx = ctx.player.ensureContext();
    if (audioCtx?.state === 'suspended') await audioCtx.resume();
    if (!ctx.player.buffers?.size) {
      const bufs = await loadProjectBuffers({ blocks: [ctx.currentBlock] }, storage, audioCtx);
      ctx.player.setBuffers(bufs);
    }
    const totalDur = getBlockTotalDuration(ctx.currentBlock);
    const startSec = ctx.playhead.getTime() >= totalDur ? 0 : ctx.playhead.getTime();
    if (startSec === 0) ctx.playhead.setTime(0);
    ctx.player.play(ctx.currentBlock, startSec);

    const tick = () => {
      if (!ctx.player.isPlaying()) return;
      const pos = ctx.player.position();
      ctx.playhead.setTime(pos);
      if (pos >= totalDur) { stop(); ctx.playhead.setTime(0); return; }
      ctx.animFrame = requestAnimationFrame(tick);
    };
    ctx.animFrame = requestAnimationFrame(tick);
  };

  return { play, stop, toggle: () => (ctx.player.isPlaying() ? stop() : play()) };
}

function buildActions(ctx, playback) {
  const getSelected = () => ctx.currentBlock.clips.find((x) => x.id === ctx.selectedClipId);
  return {
    onPlay: () => playback.toggle(),
    onStop: () => { playback.stop(); ctx.playhead.setTime(0); },
    onUndo: () => {
      const res = historyUndo(ctx.history, ctx.currentBlock);
      if (res) { ctx.history = res.history; ctx.currentBlock = res.state; ctx.onUpdateBlock(ctx.currentBlock); ctx.render(); }
    },
    onRedo: () => {
      const res = historyRedo(ctx.history, ctx.currentBlock);
      if (res) { ctx.history = res.history; ctx.currentBlock = res.state; ctx.onUpdateBlock(ctx.currentBlock); ctx.render(); }
    },
    onCopy: () => { const c = getSelected(); if (c) ctx.clipboard = copyClips([c]); },
    onCut: () => { const res = cutClips(ctx.currentBlock, [ctx.selectedClipId]); ctx.clipboard = res.clipboard; ctx.commit(res.block); },
    onPaste: () => applyPaste(ctx),
    onDuplicate: () => { const c = getSelected(); if (c) { ctx.clipboard = copyClips([c]); applyPaste(ctx, ctx.clipboard); } },
    onSplit: () => {
      const c = getSelected();
      if (!c) return;
      const parts = splitClip(c, ctx.playhead.getTime());
      if (parts.length > 1) ctx.commit({ ...ctx.currentBlock, clips: ctx.currentBlock.clips.flatMap((x) => (x.id === c.id ? parts : [x])) });
    },
    onDelete: () => { if (ctx.selectedClipId) ctx.commit({ ...ctx.currentBlock, clips: deleteClip(ctx.currentBlock.clips, ctx.selectedClipId) }); },
    onZoomIn: () => { ctx.pps = Math.min(100, ctx.pps * 1.5); ctx.playhead.setPps(ctx.pps); ctx.render(); },
    onZoomOut: () => { ctx.pps = Math.max(5, ctx.pps / 1.5); ctx.playhead.setPps(ctx.pps); ctx.render(); },
    onAddTrack: () => {
      const tr = { id: `track-${ctx.currentBlock.tracks.length + 1}`, name: `Piste ${ctx.currentBlock.tracks.length + 1}`, volume: 1, muted: false, solo: false };
      ctx.commit({ ...ctx.currentBlock, tracks: [...ctx.currentBlock.tracks, tr] });
    },
  };
}

function renderTracksToHost(ctx, tracksHost) {
  tracksHost.innerHTML = '';
  const duration = Math.max(10, getBlockTotalDuration(ctx.currentBlock) + 5);
  const ruler = createRuler({ duration, pps: ctx.pps, onSeek: (t) => ctx.playhead.setTime(t) });
  tracksHost.append(ruler, ctx.playhead.el);
  for (const track of ctx.currentBlock.tracks) {
    const trackEl = createTrackView(track, {
      clips: ctx.currentBlock.clips, pps: ctx.pps, selectedClipId: ctx.selectedClipId,
      onSelectClip: (c) => { ctx.selectedClipId = c.id; ctx.render(); },
      onUpdateClip: (c) => ctx.commit({ ...ctx.currentBlock, clips: ctx.currentBlock.clips.map((x) => (x.id === c.id ? c : x)) }),
      onMoveClip: (c, patch) => ctx.commit({ ...ctx.currentBlock, clips: ctx.currentBlock.clips.map((x) => (x.id === c.id ? moveClip(x, patch) : x)) }),
      onUpdateTrack: (patch) => ctx.commit({ ...ctx.currentBlock, tracks: ctx.currentBlock.tracks.map((t) => (t.id === track.id ? { ...t, ...patch } : t)) }),
    });
    tracksHost.append(trackEl);
  }
}

function renderInspector(ctx, inspectorHost) {
  inspectorHost.innerHTML = '';
  const selectedClip = ctx.currentBlock.clips.find((c) => c.id === ctx.selectedClipId) || null;
  const inspector = createClipInspectorView({
    clip: selectedClip,
    onUpdateClip: (updated) => ctx.commit({
      ...ctx.currentBlock,
      clips: ctx.currentBlock.clips.map((c) => (c.id === updated.id ? updated : c)),
    }),
    onCopy: (clip) => { ctx.clipboard = copyClips([clip]); },
    onCut: (clip) => {
      const res = cutClips(ctx.currentBlock, [clip.id]);
      ctx.clipboard = res.clipboard;
      ctx.commit(res.block);
    },
    onResetTrim: (clip) => ctx.commit({
      ...ctx.currentBlock,
      clips: ctx.currentBlock.clips.map((c) => (c.id === clip.id ? { ...c, offset: 0 } : c)),
    }),
    onRemove: (clipId) => ctx.commit({
      ...ctx.currentBlock,
      clips: deleteClip(ctx.currentBlock.clips, clipId),
    }),
  });
  inspectorHost.append(inspector);
}

export function mountEditorShell(container, { block, onUpdateBlock, onClose, level, rank, storage = defaultStorage }) {
  container.innerHTML = '';
  const ctx = {
    currentBlock: { ...block, edited: true }, history: createHistory(30), clipboard: null,
    selectedClipId: block.clips?.[0]?.id || null, pps: 20, player: new BlockPlayer(), onUpdateBlock,
    playhead: null, commit: null, render: null, animFrame: null,
  };
  const playback = createPlaybackController(ctx, storage);
  loadProjectBuffers({ blocks: [block] }, storage, ctx.player.ensureContext())
    .then((bufs) => ctx.player.setBuffers(bufs)).catch(() => {});

  const root = h('div', { class: 'editor-shell' });
  const tracksHost = h('div', { class: 'editor-tracks-host' });
  const inspectorHost = h('div', { class: 'editor-inspector-host' });
  ctx.playhead = createPlayhead({
    pps: ctx.pps,
    onSeek: (time) => ctx.player.isPlaying() && ctx.player.play(ctx.currentBlock, time),
  });
  ctx.commit = (next) => {
    if (ctx.player.isPlaying()) playback.stop();
    ctx.history = pushState(ctx.history, ctx.currentBlock);
    ctx.currentBlock = { ...next, edited: true };
    onUpdateBlock(ctx.currentBlock);
    ctx.render();
  };
  ctx.render = () => {
    renderTracksToHost(ctx, tracksHost);
    renderInspector(ctx, inspectorHost);
  };

  const actions = buildActions(ctx, playback);
  const header = createHeader(ctx.currentBlock, () => { playback.stop(); onClose(); }, rank);
  root.append(header, createEditorToolbar(actions, level), tracksHost, inspectorHost);
  container.append(root);
  ctx.render();
  const unbind = bindEditorShortcuts(window, actions);
  return { destroy: () => { playback.stop(); unbind(); } };
}
