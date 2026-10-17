/**
 * Rôle : rendu audio hors-ligne (OfflineAudioContext) d'un bloc ou du projet complet par concaténation de contextes.
 * Exemple : const buffer = await renderBlock(block, buffersMap); const full = await renderProject(project, buffersMap);
 */
import { getBlockTotalDuration } from '../core/block-model.js';
import { getPlayableBlocks } from '../core/project.js';
import { scheduleEnvelope } from './envelope.js';
import { concatAudioBuffers } from './concat.js';
import { renderTransitionBuffer } from './transitions.js';

function scheduleClipInOffline(clip, trackVol, buffer, ctx, startOffset) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  const totalVolume = (clip.gain ?? 1) * trackVol;
  const when = startOffset + clip.start;

  scheduleEnvelope(gain.gain, {
    volume: totalVolume,
    fadeIn: clip.fadeIn,
    fadeOut: clip.fadeOut,
    duration: clip.duration,
  }, when, 0);

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(when, clip.offset, clip.duration);
}

export async function renderBlock(block, buffersMap = new Map(), sampleRate = 44100) {
  const totalDuration = Math.max(0.1, getBlockTotalDuration(block));
  const totalFrames = Math.ceil(totalDuration * sampleRate);
  const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineCtx) throw new Error('OFFLINE_AUDIO_UNSUPPORTED');

  const ctx = new OfflineCtx(2, totalFrames, sampleRate);
  const padBefore = block.padBefore || 0;
  const hasSolo = block.tracks.some((t) => t.solo);

  for (const track of block.tracks) {
    const isAudible = hasSolo ? track.solo : !track.muted;
    const trackVol = isAudible ? (track.volume ?? 1) : 0;
    if (trackVol <= 0) continue;

    const clips = block.clips.filter((c) => c.trackId === track.id);
    for (const clip of clips) {
      const buf = buffersMap.get(clip.sourceId);
      if (buf) scheduleClipInOffline(clip, trackVol, buf, ctx, padBefore);
    }
  }

  return ctx.startRendering();
}

export async function renderProject(project, buffersMap = new Map(), sampleRate = 44100) {
  const playable = getPlayableBlocks(project);
  if (!playable.length) {
    const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const emptyCtx = new OfflineCtx(2, 4410, sampleRate);
    return emptyCtx.startRendering();
  }

  const renderedBlocks = [];
  for (const block of playable) {
    if (block.type === 'transition') {
      renderedBlocks.push(renderTransitionBuffer(block.transition, sampleRate));
    } else {
      const buf = await renderBlock(block, buffersMap, sampleRate);
      renderedBlocks.push(buf);
    }
  }
  return concatAudioBuffers(renderedBlocks, sampleRate);
}

export async function loadProjectBuffers(project, storage, ctx = null) {
  const AudioCtxClass = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!ctx && !AudioCtxClass) return new Map();
  const AudioCtx = ctx || new AudioCtxClass();
  const buffersMap = new Map();
  const playable = getPlayableBlocks(project);
  for (const block of playable) {
    for (const clip of block.clips) {
      if (!clip.sourceId || buffersMap.has(clip.sourceId)) continue;
      try {
        const item = await storage?.getRecording?.(clip.sourceId);
        const audioData = item?.audio || clip.audio;
        if (audioData) {
          const ab = audioData instanceof ArrayBuffer ? audioData : await audioData.arrayBuffer();
          const buf = await AudioCtx.decodeAudioData(ab.slice(0));
          buffersMap.set(clip.sourceId, buf);
        }
      } catch {
        /* ignore missing or undecodable buffer */
      }
    }
  }
  return buffersMap;
}
