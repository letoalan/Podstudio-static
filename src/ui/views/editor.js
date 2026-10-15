/**
 * Rôle : vue Éditeur — assemble transport, zoom, édition (copier/couper/coller/scinder), timeline, inspecteur et export.
 * Exemple : mountEditor(document.getElementById('view-editor'), { mixer });
 */
import { on } from '../../core/bus.js';
import { Mixer } from '../../audio/mixer.js';
import { copyClip, cutClip, pasteClip, splitAtPlayhead } from '../clipboard.js';
import { mountInspector } from '../clip-inspector.js';
import { createProjectControls } from '../project-action.js';
import { h } from '../dom.js';
import { runExport } from '../export-action.js';
import { Timeline } from '../timeline.js';
import { addRecordingToTimeline } from '../timeline-drop.js';
import { showToast } from '../toast.js';
import { Transport } from '../transport.js';

function zoomButtons(timeline) {
  const make = (label, text, factor) => h('button', {
    type: 'button', class: 'btn secondary btn-sm', 'aria-label': label, onClick: () => timeline.zoomBy(factor),
  }, text);
  return h('div', { class: 'zoom-controls' }, make('Zoom arrière', '−', 1 / 1.5), make('Zoom avant', '+', 1.5));
}

function editControls(timeline) {
  const make = (title, label, action) => h('button', {
    type: 'button', class: 'btn secondary btn-sm', title, 'aria-label': title, onClick: action,
  }, label);
  const getSelected = () => timeline.getSelectedTrack();

  return h('div', { class: 'edit-controls' },
    make('Copier le clip (Ctrl+C)', '📋 Copier', () => copyClip(getSelected())),
    make('Couper le clip (Ctrl+X)', '✂️ Couper', () => cutClip(getSelected(), timeline)),
    make('Coller le clip (Ctrl+V)', '📥 Coller', () => pasteClip(timeline)),
    make('Scinder au curseur rouge (S)', '✂️ Scinder', () => splitAtPlayhead(timeline)));
}

export function mountEditor(container, deps = {}) {
  const mixer = deps.mixer ?? new Mixer();
  const toolbar = h('div', { class: 'editor-toolbar' });
  const timelineHost = h('div', { class: 'editor-timeline' });
  const inspectorHost = h('div', { class: 'inspector' });
  const exportButton = h('button', { type: 'button', class: 'btn primary', id: 'btn-export-mix' }, 'Exporter en MP3');

  const holder = {};
  const timeline = new Timeline(timelineHost, {
    mixer, storage: deps.storage, onSelect: (track) => holder.inspector?.show(track),
  });
  const projectControls = createProjectControls(timeline);
  const headerActions = h('div', { class: 'header-actions' }, projectControls, exportButton);
  container.append(
    h('div', { class: 'section-header' }, h('h2', {}, 'Éditeur'), headerActions), toolbar, timelineHost, inspectorHost);

  const transport = new Transport(toolbar, { mixer, timeline, raf: deps.raf, caf: deps.caf });
  toolbar.append(editControls(timeline), zoomButtons(timeline));
  holder.inspector = mountInspector(inspectorHost, {
    mixer,
    onRemove: (id) => timeline.removeClip(id),
    onCopy: (track) => copyClip(track),
    onCut: (track) => cutClip(track, timeline),
  });

  exportButton.addEventListener('click', () => runExport(exportButton, { mixer, storage: deps.storage, exporter: deps.exporter }));
  on('timeline:add', async (item) => {
    const id = await addRecordingToTimeline(timeline, item);
    if (id) showToast(`« ${item.title} » ajouté à la timeline`, { type: 'success' });
  });
  return { mixer, timeline, transport };
}
