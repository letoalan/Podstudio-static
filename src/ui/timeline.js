/**
 * Rôle : timeline multipiste (lignes Voix/Musique, règle, clips, tête de lecture, zoom, sélection).
 * Exemple : const tl = new Timeline(el, { mixer, onSelect }); tl.render(); tl.zoomBy(1.5);
 */
import { emit, on } from '../core/bus.js';
import { DEFAULT_PPS, LANES, clampPps, pxToSeconds, secondsToPx, snap } from '../core/timeline-math.js';
import { copyClip, cutClip, pasteClip, splitAtPlayhead } from './clipboard.js';
import { h } from './dom.js';
import { buildClip } from './timeline-clip.js';
import { bindDrop } from './timeline-drop.js';
import { renderRuler } from './timeline-ruler.js';

const VIEW_PADDING = 30;
const MIN_VIEW_SECONDS = 60;

export class Timeline {
  constructor(container, { mixer, onSelect = () => {}, storage }) {
    this.mixer = mixer;
    this.onSelect = onSelect;
    this.pps = DEFAULT_PPS;
    this.selected = null;
    this.build(container);
    bindDrop(this, storage);
    this.ruler.addEventListener('click', (event) => this.seekFromEvent(event));
    this.scroll.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === 'v') {
        pasteClip(this);
        event.preventDefault();
      } else if (key === 's' && !event.ctrlKey && !event.metaKey) {
        splitAtPlayhead(this);
        event.preventDefault();
      }
    });
    on('timeline:changed', () => this.render());
    this.render();
  }

  build(container) {
    this.ruler = h('div', { class: 'timeline-ruler', title: 'Cliquer pour positionner la lecture' });
    this.lanes = LANES.map((_, lane) => h('div', { class: 'timeline-lane', dataset: { lane } }));
    this.playhead = h('div', { class: 'playhead', 'aria-hidden': 'true' });
    this.empty = h('p', { class: 'timeline-empty' }, 'Glissez des enregistrements ici, ou utilisez « ＋ Timeline ».');
    this.content = h('div', { class: 'timeline-content' }, this.ruler, ...this.lanes, this.playhead, this.empty);
    this.scroll = h('div', { class: 'timeline-scroll', tabindex: 0 }, this.content);
    const labels = LANES.map((name) => h('div', { class: 'lane-label' }, name));
    const labelColumn = h('div', { class: 'timeline-labels' }, h('div', { class: 'lane-label ruler-spacer' }), ...labels);
    container.append(h('div', { class: 'timeline' }, labelColumn, this.scroll));
  }

  clipHandlers() {
    return {
      onSelect: (id) => this.select(id),
      onMove: (id, patch) => {
        this.mixer.updateTrack(id, patch);
        this.render();
      },
      onDelete: (id) => this.removeClip(id),
      onCopy: (track) => copyClip(track),
      onCut: (track) => cutClip(track, this),
      laneAt: (y) => this.laneAt(y),
    };
  }

  render() {
    const tracks = this.mixer.getTracks();
    const seconds = Math.max(this.mixer.duration() + VIEW_PADDING, MIN_VIEW_SECONDS);
    this.content.style.width = `${secondsToPx(seconds, this.pps)}px`;
    renderRuler(this.ruler, seconds, this.pps);
    this.lanes.forEach((lane) => lane.replaceChildren());
    tracks.forEach((t) => this.lanes[t.lane]?.append(buildClip(t, this.pps, this.clipHandlers())));
    this.empty.hidden = tracks.length > 0;
    this.markSelected();
    this.setPlayhead(this.mixer.position());
  }

  select(id) {
    this.selected = this.mixer.tracks.has(id) ? id : null;
    this.markSelected();
    this.onSelect(this.selected ? this.mixer.tracks.get(id) : null);
  }

  markSelected() {
    this.content.querySelectorAll('.clip').forEach((el) => {
      el.classList.toggle('selected', el.dataset.id === this.selected);
    });
  }

  removeClip(id) {
    this.mixer.removeTrack(id);
    if (this.selected === id) this.selected = null;
    this.onSelect(null);
    this.render();
  }

  zoomBy(factor) {
    this.pps = clampPps(this.pps * factor);
    this.render();
  }

  setPlayhead(seconds) {
    const x = secondsToPx(seconds, this.pps);
    this.playhead.style.left = `${x}px`;
    const { scrollLeft, clientWidth } = this.scroll;
    if (clientWidth > 0 && (x > scrollLeft + clientWidth - 40 || x < scrollLeft)) {
      this.scroll.scrollLeft = Math.max(0, x - 40);
    }
  }

  offsetAtX(clientX) {
    const rect = this.scroll.getBoundingClientRect();
    return snap(pxToSeconds(clientX - rect.left + this.scroll.scrollLeft, this.pps));
  }

  laneAt(clientY) {
    const index = this.lanes.findIndex((lane) => {
      const rect = lane.getBoundingClientRect();
      return clientY >= rect.top && clientY <= rect.bottom;
    });
    return index === -1 ? 0 : index;
  }

  seekFromEvent(event) {
    const seconds = this.offsetAtX(event.clientX);
    this.mixer.seek(seconds);
    this.setPlayhead(seconds);
    emit('transport:update');
  }
}
