/**
 * Rôle : worker d'encodage MP3 ; reçoit les canaux PCM, répond par progression puis Blob final.
 * Exemple : worker.postMessage({ command: 'encode', channels, sampleRate });
 */
import { Mp3Encoder } from '@breezystack/lamejs';
import { encodeMp3 } from './mp3-encoder.js';

self.onmessage = (event) => {
  const { command, channels, sampleRate } = event.data;
  if (command !== 'encode') return;
  try {
    const onProgress = (ratio) => self.postMessage({ type: 'progress', ratio });
    const chunks = encodeMp3(channels, sampleRate, Mp3Encoder, { onProgress });
    self.postMessage({ type: 'done', blob: new Blob(chunks, { type: 'audio/mpeg' }) });
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message });
  }
};
