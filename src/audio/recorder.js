/**
 * Rôle : capture micro (MediaRecorder) avec pause/reprise, chronomètre et AnalyserNode pour le visualiseur.
 * Exemple : const rec = new Recorder(); await rec.start(); const { blob } = await rec.stop();
 */
export const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

/** Premier format supporté (repli Safari iOS : audio/mp4), '' si l'API ne sait pas répondre. */
export function pickMimeType(Impl = globalThis.MediaRecorder) {
  if (!Impl?.isTypeSupported) return '';
  return MIME_CANDIDATES.find((type) => Impl.isTypeSupported(type)) ?? '';
}

const defaultContext = () => new (globalThis.AudioContext || globalThis.webkitAudioContext)();
const defaultMedia = (constraints) => navigator.mediaDevices.getUserMedia(constraints);

export class Recorder {
  constructor(deps = {}) {
    this.getUserMedia = deps.getUserMedia ?? defaultMedia;
    this.MediaRecorderImpl = deps.MediaRecorder ?? globalThis.MediaRecorder;
    this.createContext = deps.createContext ?? defaultContext;
    this.events = new EventTarget();
    this.state = 'idle';
    this.analyser = null;
    this.accumulated = 0;
    this.resumedAt = 0;
  }

  setState(state) {
    this.state = state;
    this.events.dispatchEvent(new CustomEvent('state', { detail: state }));
  }

  elapsed() {
    const live = this.state === 'recording' ? (performance.now() - this.resumedAt) / 1000 : 0;
    return this.accumulated + live;
  }

  attachAnalyser() {
    this.context = this.createContext();
    const source = this.context.createMediaStreamSource(this.stream);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    source.connect(this.analyser);
  }

  async start() {
    if (this.state !== 'idle') return;
    this.stream = await this.getUserMedia({ audio: true });
    this.attachAnalyser();
    const mimeType = pickMimeType(this.MediaRecorderImpl);
    this.media = new this.MediaRecorderImpl(this.stream, mimeType ? { mimeType } : undefined);
    this.chunks = [];
    this.media.ondataavailable = (event) => {
      if (event.data?.size) this.chunks.push(event.data);
    };
    this.media.start(250);
    this.accumulated = 0;
    this.resumedAt = performance.now();
    this.setState('recording');
  }

  pause() {
    if (this.state !== 'recording') return;
    this.media.pause();
    this.accumulated = this.elapsed();
    this.setState('paused');
  }

  resume() {
    if (this.state !== 'paused') return;
    this.media.resume();
    this.resumedAt = performance.now();
    this.setState('recording');
  }

  stop() {
    if (this.state === 'idle') return Promise.resolve(null);
    const duration = this.elapsed();
    return new Promise((resolve) => {
      this.media.onstop = () => {
        const mimeType = this.media.mimeType || this.chunks[0]?.type || 'audio/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        this.release();
        this.setState('idle');
        resolve({ blob, duration, mimeType });
      };
      this.media.stop();
    });
  }

  release() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.context?.close?.();
    this.stream = null;
    this.context = null;
    this.analyser = null;
  }
}
