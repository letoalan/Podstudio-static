/**
 * Rôle : affichage et contrôles d'une piste de la timeline (en-tête volume/mute/solo et conteneur des clips).
 * Exemple : const el = createTrackView(track, { clips, pps, onUpdateTrack, onSelectClip });
 */
import { h } from '../dom.js';
import { createClipView } from './clip-view.js';

function renderTrackHeader(track, onUpdateTrack) {
  const nameLabel = h('span', { class: 'track-name' }, track.name || 'Piste');
  const volInput = h('input', {
    type: 'range', min: '0', max: '2', step: '0.05', value: track.volume ?? 1, class: 'track-vol-slider', title: 'Volume',
  });
  volInput.addEventListener('input', (e) => onUpdateTrack({ volume: Number(e.target.value) }));

  const muteBtn = h('button', {
    type: 'button', class: `btn-track-toggle ${track.muted ? 'active' : ''}`, title: 'Couper le son (Mute)',
  }, 'M');
  muteBtn.addEventListener('click', () => onUpdateTrack({ muted: !track.muted }));

  const soloBtn = h('button', {
    type: 'button', class: `btn-track-toggle ${track.solo ? 'active' : ''}`, title: 'Piste en solo',
  }, 'S');
  soloBtn.addEventListener('click', () => onUpdateTrack({ solo: !track.solo }));

  const controls = h('div', { class: 'track-controls' }, volInput, muteBtn, soloBtn);
  return h('div', { class: 'track-header' }, nameLabel, controls);
}

export function createTrackView(track, { clips = [], pps = 20, selectedClipId, onSelectClip, onUpdateClip, onMoveClip, onUpdateTrack }) {
  const row = h('div', { class: 'timeline-track-row', 'data-track-id': track.id });
  const header = renderTrackHeader(track, onUpdateTrack);

  const lane = h('div', { class: 'timeline-track-lane', 'data-track-id': track.id });
  const trackClips = clips.filter((c) => c.trackId === track.id);

  for (const clip of trackClips) {
    const isSelected = clip.id === selectedClipId;
    const clipEl = createClipView(clip, {
      pps,
      isSelected,
      onSelect: onSelectClip,
      onTrim: onUpdateClip,
      onMove: (c, newStart, targetTrackId) => onMoveClip(c, { start: newStart, trackId: targetTrackId || track.id }),
    });
    lane.append(clipEl);
  }

  row.append(header, lane);
  return row;
}
