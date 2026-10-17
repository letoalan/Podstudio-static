/**
 * Rôle : inspecteur et réglages fins du clip sélectionné dans l'éditeur unifié (gain, fondus, début, rognage, actions).
 * Exemple : const insp = createClipInspectorView({ clip, onUpdateClip, onCopy, onCut, onRemove });
 */
import { h } from '../dom.js';

function field(label, input) {
  return h('label', { class: 'inspector-field' }, h('span', {}, label), input);
}

function numberInput(value, step = 0.1, min = 0) {
  return h('input', { type: 'number', min, step, value: Number(value || 0).toFixed(1), class: 'form-control-sm' });
}

function createFormInputs(clip) {
  return {
    name: h('input', { type: 'text', value: clip.name || 'Clip', class: 'form-control-sm', maxlength: 80 }),
    volume: h('input', { type: 'range', min: 0, max: 200, step: 1, value: Math.round((clip.gain ?? 1) * 100) }),
    start: numberInput(clip.start),
    offset: numberInput(clip.offset),
    duration: numberInput(clip.duration),
    fadeIn: numberInput(clip.fadeIn),
    fadeOut: numberInput(clip.fadeOut),
  };
}

function bindInputEvents(inputs, clip, onUpdateClip) {
  const read = () => ({
    name: inputs.name.value,
    gain: Number(inputs.volume.value) / 100,
    start: Math.max(0, Number(inputs.start.value) || 0),
    offset: Math.max(0, Number(inputs.offset.value) || 0),
    duration: Math.max(0.1, Number(inputs.duration.value) || 0.1),
    fadeIn: Math.max(0, Number(inputs.fadeIn.value) || 0),
    fadeOut: Math.max(0, Number(inputs.fadeOut.value) || 0),
  });

  const onCommit = () => onUpdateClip({ ...clip, ...read() });
  inputs.name.addEventListener('change', onCommit);
  inputs.volume.addEventListener('input', onCommit);
  inputs.start.addEventListener('change', onCommit);
  inputs.offset.addEventListener('change', onCommit);
  inputs.duration.addEventListener('change', onCommit);
  inputs.fadeIn.addEventListener('change', onCommit);
  inputs.fadeOut.addEventListener('change', onCommit);
}

export function createClipInspectorView({ clip, onUpdateClip, onCopy, onCut, onResetTrim, onRemove }) {
  const container = h('div', { class: 'unified-clip-inspector' });
  if (!clip) {
    container.append(h('p', { class: 'empty-state-sm' }, '💡 Cliquez sur un clip pour ajuster ses paramètres fins (volume, fondus, rognage).'));
    return container;
  }

  const inputs = createFormInputs(clip);
  bindInputEvents(inputs, clip, onUpdateClip);

  const actions = h('div', { class: 'inspector-actions' },
    h('button', { type: 'button', class: 'btn secondary btn-sm', onClick: () => onCopy?.(clip) }, '📋 Copier'),
    h('button', { type: 'button', class: 'btn secondary btn-sm', onClick: () => onCut?.(clip) }, '✂️ Couper'),
    h('button', { type: 'button', class: 'btn secondary btn-sm', onClick: () => onResetTrim?.(clip) }, '↺ Réinitialiser'),
    h('button', { type: 'button', class: 'btn danger-ghost btn-sm', onClick: () => onRemove?.(clip.id) }, '🗑️ Supprimer'));

  const volLabel = h('span', { class: 'vol-pct-badge' }, `${Math.round((clip.gain ?? 1) * 100)}%`);
  inputs.volume.addEventListener('input', () => { volLabel.textContent = `${inputs.volume.value}%`; });
  const volField = h('div', { class: 'inspector-field' }, h('span', {}, 'Volume'), inputs.volume, volLabel);

  const grid = h('div', { class: 'inspector-grid' },
    field('Nom du clip', inputs.name), volField, field('Début (s)', inputs.start),
    field('Rognage source (s)', inputs.offset), field('Durée (s)', inputs.duration),
    field('Fondu entrée (s)', inputs.fadeIn), field('Fondu sortie (s)', inputs.fadeOut));

  container.append(h('h4', { class: 'inspector-title' }, `🎛️ Paramètres : ${clip.name || 'Clip'}`), grid, actions);
  return container;
}
