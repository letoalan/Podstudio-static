/**
 * Rôle : visualiseur d'onde sur <canvas> alimenté par un AnalyserNode (boucle requestAnimationFrame).
 * Exemple : const viz = new Visualizer(canvas); viz.start(recorder.analyser); viz.stop();
 */
const FALLBACK_COLOR = '#8940fa';

export class Visualizer {
  constructor(canvas, raf = (cb) => globalThis.requestAnimationFrame(cb), caf = (id) => globalThis.cancelAnimationFrame(id)) {
    this.canvas = canvas;
    this.ctx = canvas.getContext?.('2d') ?? null;
    this.raf = raf;
    this.caf = caf;
    this.running = false;
    this.frame = 0;
    this.analyser = null;
    this.loop = this.loop.bind(this);
  }

  resize() {
    const ratio = globalThis.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.floor((this.canvas.clientWidth || 300) * ratio));
    this.canvas.height = Math.max(1, Math.floor((this.canvas.clientHeight || 120) * ratio));
  }

  start(analyser) {
    this.analyser = analyser;
    this.data = new Uint8Array(analyser.fftSize);
    this.running = true;
    this.resize();
    this.loop();
  }

  stop() {
    this.running = false;
    this.caf(this.frame);
    this.drawLine(null);
  }

  loop() {
    if (!this.running) return;
    this.analyser.getByteTimeDomainData(this.data);
    this.drawLine(this.data);
    this.frame = this.raf(this.loop);
  }

  color() {
    const style = globalThis.getComputedStyle?.(this.canvas);
    return style?.getPropertyValue('--primary').trim() || FALLBACK_COLOR;
  }

  /** Dessine l'onde ; avec `null`, une ligne médiane au repos. */
  drawLine(data) {
    const { ctx, canvas } = this;
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 2 * (globalThis.devicePixelRatio || 1);
    ctx.strokeStyle = this.color();
    ctx.beginPath();
    const count = data ? data.length : 2;
    for (let i = 0; i < count; i++) {
      const v = data ? data[i] / 128 : 1;
      const x = (i / (count - 1)) * width;
      const y = (v * height) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}
