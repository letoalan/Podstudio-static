/**
 * Rôle : pont promesse <-> Web Worker pour encoder du PCM en MP3 sans bloquer l'interface.
 * Exemple : const blob = await encodeInWorker(channels, 44100, { onProgress: (r) => {} });
 */
const defaultWorker = () =>
  new Worker(new URL('./encoder.worker.js', import.meta.url), { type: 'module' });

function handleMessage(data, { worker, resolve, reject, onProgress }) {
  if (data.type === 'progress') return onProgress?.(data.ratio);
  worker.terminate();
  if (data.type === 'done') resolve(data.blob);
  else reject(new Error(data.message || 'ENCODER_ERROR'));
}

export function encodeInWorker(channels, sampleRate, options = {}) {
  const { onProgress, createWorker = defaultWorker } = options;
  return new Promise((resolve, reject) => {
    const worker = createWorker();
    worker.onmessage = (event) => handleMessage(event.data, { worker, resolve, reject, onProgress });
    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message || 'WORKER_ERROR'));
    };
    worker.postMessage(
      { command: 'encode', channels, sampleRate },
      channels.map((channel) => channel.buffer),
    );
  });
}
