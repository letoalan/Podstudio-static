/**
 * Rôle : rendu hors-ligne du mixage (OfflineAudioContext) puis export MP3.
 * Exemple : const { blob, duration } = await exportMp3(mixer.getTracks());
 */
import { scheduleEnvelope } from './envelope.js';
import { encodeInWorker } from './encoder-client.js';
import { timelineDuration, clipDuration } from '../core/timeline-math.js';

export const EXPORT_SAMPLE_RATE = 44100;
export const EXPORT_CHANNELS = 2;

function scheduleTrack(ctx, track) {
  const dur = clipDuration(track);
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = track.buffer;
  source.connect(gain);
  gain.connect(ctx.destination);
  scheduleEnvelope(gain.gain, { ...track, duration: dur }, track.offset, 0);
  if (track.trimStart || track.duration != null) {
    source.start(track.offset, track.trimStart || 0, dur);
  } else {
    source.start(track.offset);
  }
}

export async function renderMix(tracks, options = {}) {
  const { OfflineContext = globalThis.OfflineAudioContext, sampleRate = EXPORT_SAMPLE_RATE } = options;
  const spans = tracks.map((t) => ({ offset: t.offset, duration: clipDuration(t) }));
  const duration = timelineDuration(spans);
  if (duration <= 0) throw new Error('EMPTY_TIMELINE');
  const ctx = new OfflineContext(EXPORT_CHANNELS, Math.ceil(duration * sampleRate), sampleRate);
  tracks.forEach((track) => scheduleTrack(ctx, track));
  const rendered = await ctx.startRendering();
  const channels = Array.from({ length: rendered.numberOfChannels }, (_, i) =>
    rendered.getChannelData(i),
  );
  return { channels, sampleRate, duration };
}

export async function exportMp3(tracks, options = {}) {
  const { render, encode = encodeInWorker, onProgress } = options;
  const rendered = await renderMix(tracks, render);
  const blob = await encode(rendered.channels, rendered.sampleRate, { onProgress });
  return { blob, duration: rendered.duration };
}
