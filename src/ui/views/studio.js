/**
 * Rôle : vue Studio (visualiseur, chronomètre, boutons enregistrer/pause/stop, sauvegarde en bibliothèque).
 * Exemple : mountStudio(document.getElementById('view-studio'), { recorder });
 */
import * as defaultStorage from '../../core/storage.js';
import { Recorder } from '../../audio/recorder.js';
import { emit } from '../../core/bus.js';
import { formatDateTime } from '../../core/format.js';
import { formatHms } from '../../core/timeline-math.js';
import { h } from '../dom.js';
import { showToast } from '../toast.js';
import { Visualizer } from '../visualizer.js';

const LABELS = { idle: 'Prêt', recording: 'Enregistrement…', paused: 'En pause' };

export function micErrorMessage(error) {
  if (error?.name === 'NotAllowedError') return 'Accès au micro refusé : autorisez-le dans le navigateur.';
  if (error?.name === 'NotFoundError') return 'Aucun micro détecté.';
  return `Micro indisponible : ${error?.message ?? 'erreur inconnue'}`;
}

function buildDom() {
  const refs = {
    canvas: h('canvas', { id: 'audio-visualizer', 'aria-label': 'Visualisation du signal audio' }),
    timer: h('div', { class: 'timer-display', role: 'timer' }, '00:00:00'),
    status: h('div', { class: 'status-badge', role: 'status' }, LABELS.idle),
    record: h('button', { type: 'button', class: 'record-btn', id: 'btn-record', 'aria-label': 'Démarrer l\'enregistrement' }, h('span', { class: 'record-inner' })),
    pause: h('button', { type: 'button', class: 'ctrl-btn', id: 'btn-pause', 'aria-label': 'Pause', hidden: true }, '⏸'),
    stop: h('button', { type: 'button', class: 'ctrl-btn', id: 'btn-stop', 'aria-label': 'Arrêter et sauvegarder', hidden: true }, '⏹'),
    hint: h('p', { class: 'hint-text' }, 'Appuyez pour commencer'),
  };
  const root = h('div', { class: 'studio' },
    h('div', { class: 'visualizer-card' }, refs.canvas, h('div', { class: 'timer-overlay' }, refs.timer, refs.status)),
    h('div', { class: 'controls-card' }, refs.record, h('div', { class: 'secondary-controls' }, refs.pause, refs.stop), refs.hint));
  return { root, refs };
}

function applyState(refs, state) {
  refs.status.textContent = LABELS[state];
  refs.status.dataset.state = state;
  refs.record.disabled = state !== 'idle';
  refs.pause.hidden = state === 'idle';
  refs.stop.hidden = state === 'idle';
  refs.pause.textContent = state === 'paused' ? '▶' : '⏸';
  refs.pause.setAttribute('aria-label', state === 'paused' ? 'Reprendre' : 'Pause');
  refs.hint.hidden = state !== 'idle';
}

async function saveRecording(result, storage) {
  const title = `Enregistrement du ${formatDateTime(new Date())}`;
  await storage.saveRecording({ title, source: 'record', duration: result.duration, mimeType: result.mimeType }, result.blob);
  emit('library:changed');
  showToast('Enregistrement ajouté à la bibliothèque', { type: 'success' });
}

export function mountStudio(container, deps = {}) {
  const recorder = deps.recorder ?? new Recorder();
  const storage = deps.storage ?? defaultStorage;
  const { root, refs } = buildDom();
  container.append(h('div', { class: 'section-header' }, h('h2', {}, 'Studio')), root);
  const viz = deps.visualizer ?? new Visualizer(refs.canvas);
  let timerId = null;

  recorder.events.addEventListener('state', (e) => applyState(refs, e.detail));
  refs.record.addEventListener('click', async () => {
    try {
      await recorder.start();
    } catch (error) {
      return showToast(micErrorMessage(error), { type: 'error', duration: 6000 });
    }
    viz.start(recorder.analyser);
    timerId = setInterval(() => { refs.timer.textContent = formatHms(recorder.elapsed()); }, 200);
  });
  refs.pause.addEventListener('click', () => (recorder.state === 'paused' ? recorder.resume() : recorder.pause()));
  refs.stop.addEventListener('click', async () => {
    clearInterval(timerId);
    viz.stop();
    const result = await recorder.stop();
    refs.timer.textContent = '00:00:00';
    if (result) await saveRecording(result, storage);
  });
  return { recorder };
}
