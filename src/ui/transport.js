/**
 * Rôle : barre de transport (lecture/pause, stop, compteur) qui pilote le mixeur et la tête de lecture.
 * Exemple : const transport = new Transport(el, { mixer, timeline }); transport.refresh();
 */
import { on } from '../core/bus.js';
import { formatClock } from '../core/timeline-math.js';
import { h } from './dom.js';

export class Transport {
  constructor(container, { mixer, timeline, raf, caf }) {
    this.mixer = mixer;
    this.timeline = timeline;
    this.raf = raf ?? ((cb) => globalThis.requestAnimationFrame(cb));
    this.caf = caf ?? ((id) => globalThis.cancelAnimationFrame(id));
    this.frame = 0;
    this.tick = this.tick.bind(this);
    this.build(container);
    on('transport:update', () => this.refresh());
    this.refresh();
  }

  build(container) {
    this.playButton = h('button', {
      type: 'button', class: 'btn-transport', 'aria-label': 'Lecture', onClick: () => this.toggle(),
    }, '▶');
    const stopButton = h('button', {
      type: 'button', class: 'btn-transport', 'aria-label': 'Arrêt', onClick: () => this.stop(),
    }, '■');
    this.time = h('span', { class: 'transport-time', role: 'timer' }, '0:00 / 0:00');
    container.append(h('div', { class: 'transport' }, this.playButton, stopButton, this.time));
  }

  toggle() {
    if (this.mixer.playing) this.pause();
    else this.play();
  }

  play() {
    if (!this.mixer.play()) return;
    this.setPlaying(true);
    this.frame = this.raf(this.tick);
  }

  pause() {
    this.mixer.pause();
    this.setPlaying(false);
    this.caf(this.frame);
    this.refresh();
  }

  stop() {
    this.mixer.stop();
    this.setPlaying(false);
    this.caf(this.frame);
    this.refresh();
  }

  setPlaying(playing) {
    this.playButton.textContent = playing ? '⏸' : '▶';
    this.playButton.setAttribute('aria-label', playing ? 'Pause' : 'Lecture');
  }

  refresh() {
    const position = this.mixer.position();
    this.time.textContent = `${formatClock(position)} / ${formatClock(this.mixer.duration())}`;
    this.timeline.setPlayhead(position);
  }

  tick() {
    this.refresh();
    if (this.mixer.isFinished()) return this.stop();
    if (this.mixer.playing) this.frame = this.raf(this.tick);
  }
}
