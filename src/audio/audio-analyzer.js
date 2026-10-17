/**
 * Rôle : pipeline d'analyse audio asynchrone (16 kHz mono) avec cache, persistance IndexedDB et émission d'événements.
 * Exemple : await analyzeProjectBlocks(project, storage);
 */
import { computeAcousticFeatures } from '../core/audio-dsp.js';
import { CLASSIFIER_VERSION } from '../core/audio-classifier.js';
import { updateRecordingAnalysis } from '../core/storage.js';
import { emit } from '../core/bus.js';

const analysisCache = new Map();

export async function decodeBlobTo16kMono(audioBlob, ctx = null) {
  const AudioCtxClass = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!audioBlob || (!AudioCtxClass && !ctx)) return null;
  const decodeCtx = ctx || new AudioCtxClass();
  try {
    const ab = audioBlob instanceof ArrayBuffer ? audioBlob : await audioBlob.arrayBuffer();
    const decoded = await decodeCtx.decodeAudioData(ab.slice(0));
    const OfflineCtxClass = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
    if (!OfflineCtxClass) return { samples: decoded.getChannelData(0), duration: decoded.duration };

    const targetFrames = Math.min(16000 * 60, Math.ceil(decoded.duration * 16000));
    const offline = new OfflineCtxClass(1, targetFrames, 16000);
    const src = offline.createBufferSource();
    src.buffer = decoded;
    src.connect(offline.destination);
    src.start(0);
    const resampled = await offline.startRendering();
    return { samples: resampled.getChannelData(0), duration: decoded.duration };
  } catch {
    return null;
  }
}

export async function analyzeRecording(sourceId, storage, ctx = null) {
  if (!sourceId || !storage) return null;
  const cached = analysisCache.get(sourceId);
  if (cached && cached.version === CLASSIFIER_VERSION) return cached.features;

  const item = await storage.getRecording?.(sourceId);
  if (item?.acousticFeatures && item.classifierVersion === CLASSIFIER_VERSION) {
    analysisCache.set(sourceId, { features: item.acousticFeatures, version: CLASSIFIER_VERSION });
    return item.acousticFeatures;
  }

  const audioBlob = item?.audio;
  if (!audioBlob) return null;

  const decoded = await decodeBlobTo16kMono(audioBlob, ctx);
  if (!decoded) return null;

  const features = computeAcousticFeatures(decoded.samples, decoded.duration);
  analysisCache.set(sourceId, { features, version: CLASSIFIER_VERSION });
  await updateRecordingAnalysis(sourceId, { acousticFeatures: features, classifierVersion: CLASSIFIER_VERSION });
  return features;
}

export async function analyzeProjectBlocks(project, storage, onClassified = null) {
  if (!project?.blocks?.length || !storage) return;
  for (const block of project.blocks) {
    if (block.type === 'transition' || !block.clips?.length) continue;
    for (const clip of block.clips) {
      if (!clip.sourceId || (clip.acousticFeatures && clip.classifierVersion === CLASSIFIER_VERSION)) continue;
      const feat = await analyzeRecording(clip.sourceId, storage);
      if (feat) {
        clip.acousticFeatures = feat;
        clip.classifierVersion = CLASSIFIER_VERSION;
        block.acousticFeatures = feat;
        onClassified?.({ blockId: block.id, clipId: clip.id, features: feat });
        emit('block:classified', { blockId: block.id, clipId: clip.id, features: feat });
      }
    }
  }
}
