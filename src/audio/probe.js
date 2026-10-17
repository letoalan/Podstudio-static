/**
 * Rôle : lit la durée et extrait les caractéristiques acoustiques d'un blob audio.
 * Exemple : const dur = await probeDuration(blob); const feat = await probeAudioFeatures(blob);
 */
import { computeAcousticFeatures } from '../core/audio-dsp.js';
import { decodeBlobTo16kMono } from './audio-analyzer.js';

const defaultAudio = () => new Audio();

export function probeDuration(blob, createAudio = defaultAudio) {
  return new Promise((resolve) => {
    const audio = createAudio();
    const url = URL.createObjectURL(blob);
    const done = (value) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => done(Number.isFinite(audio.duration) ? audio.duration : 0);
    audio.onerror = () => done(0);
    audio.src = url;
  });
}

export async function probeAudioFeatures(blob, audioCtx = null) {
  if (!blob) return null;
  const decoded = await decodeBlobTo16kMono(blob, audioCtx);
  if (!decoded) return null;
  return computeAcousticFeatures(decoded.samples, decoded.duration);
}
