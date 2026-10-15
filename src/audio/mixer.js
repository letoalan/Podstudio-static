/**
 * Rôle : lecture multipiste en temps réel (Web Audio) avec décalage, volume, fondus et lignes.
 * Exemple : const mixer = new Mixer(); await mixer.addTrack('c1', blob, { offset: 2 }); mixer.play();
 */
import { scheduleEnvelope } from './envelope.js';
import { timelineDuration, clipDuration } from '../core/timeline-math.js';

const EDITABLE = ['offset', 'volume', 'fadeIn', 'fadeOut', 'lane', 'title', 'trimStart', 'duration'];
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

function sanitize(patch) {
  const clean = {};
  for (const key of EDITABLE) if (key in patch) clean[key] = patch[key];
  if ('offset' in clean) clean.offset = clamp(clean.offset, 0, Infinity);
  if ('volume' in clean) clean.volume = clamp(clean.volume, 0, 1);
  if ('fadeIn' in clean) clean.fadeIn = clamp(clean.fadeIn, 0, Infinity);
  if ('fadeOut' in clean) clean.fadeOut = clamp(clean.fadeOut, 0, Infinity);
  if ('lane' in clean) clean.lane = clamp(Math.round(clean.lane), 0, 1);
  if ('trimStart' in clean) clean.trimStart = clamp(clean.trimStart, 0, Infinity);
  if ('duration' in clean) clean.duration = clamp(clean.duration, 0.05, Infinity);
  return clean;
}

const defaultContext = () => new (globalThis.AudioContext || globalThis.webkitAudioContext)();

export class Mixer {
  constructor(createContext = defaultContext) {
    this.createContext = createContext;
    this.ctx = null;
    this.tracks = new Map();
    this.playing = false;
    this.origin = 0;
    this.startPos = 0;
    this.pausedAt = 0;
  }

  context() {
    if (!this.ctx) this.ctx = this.createContext();
    return this.ctx;
  }

  async addTrack(id, source, meta = {}) {
    const data = source instanceof ArrayBuffer ? source : await source.arrayBuffer();
    const buffer = await this.context().decodeAudioData(data);
    return this.addBuffer(id, buffer, meta);
  }

  addBuffer(id, buffer, meta = {}) {
    const base = { offset: 0, volume: 1, fadeIn: 0, fadeOut: 0, lane: 0, title: '', kind: 'record', trimStart: 0, duration: null };
    const track = { ...base, ...meta, ...sanitize(meta), id, buffer, nodes: null };
    this.tracks.set(id, track);
    if (this.playing) this.startTrack(track, this.position());
    return track;
  }

  removeTrack(id) {
    const track = this.tracks.get(id);
    if (!track) return false;
    this.stopTrack(track);
    return this.tracks.delete(id);
  }

  updateTrack(id, patch) {
    const track = this.tracks.get(id);
    if (!track) return null;
    Object.assign(track, sanitize(patch));
    if (this.playing) {
      this.stopTrack(track);
      this.startTrack(track, this.position());
    }
    return track;
  }

  getTracks() {
    return [...this.tracks.values()];
  }

  duration() {
    const spans = this.getTracks().map((t) => ({ offset: t.offset, duration: clipDuration(t) }));
    return timelineDuration(spans);
  }

  position() {
    if (!this.playing) return this.pausedAt;
    return this.startPos + (this.ctx.currentTime - this.origin);
  }

  isFinished() {
    return this.playing && this.position() >= this.duration();
  }

  play() {
    if (this.playing || this.tracks.size === 0) return false;
    const ctx = this.context();
    if (ctx.state === 'suspended') ctx.resume();
    const from = this.pausedAt >= this.duration() ? 0 : this.pausedAt;
    this.startPos = from;
    this.origin = ctx.currentTime;
    this.playing = true;
    this.tracks.forEach((track) => this.startTrack(track, from));
    return true;
  }

  pause() {
    if (!this.playing) return;
    this.pausedAt = this.position();
    this.halt();
  }

  stop() {
    this.halt();
    this.pausedAt = 0;
  }

  seek(seconds) {
    const wasPlaying = this.playing;
    this.halt();
    this.pausedAt = Math.max(0, seconds);
    if (wasPlaying) this.play();
  }

  halt() {
    this.tracks.forEach((track) => this.stopTrack(track));
    this.playing = false;
  }

  startTrack(track, from) {
    const dur = clipDuration(track);
    if (track.offset + dur <= from) return;
    const ctx = this.ctx;
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = track.buffer;
    source.connect(gain);
    gain.connect(ctx.destination);
    const when = ctx.currentTime + Math.max(0, track.offset - from);
    const elapsed = Math.max(0, from - track.offset);
    const remaining = Math.max(0, dur - elapsed);
    const bufferOffset = (track.trimStart || 0) + elapsed;
    scheduleEnvelope(gain.gain, { ...track, duration: dur }, when, elapsed);
    if (track.duration != null) source.start(when, bufferOffset, remaining);
    else source.start(when, bufferOffset);
    track.nodes = { source, gain };
  }

  stopTrack(track) {
    if (!track.nodes) return;
    try {
      track.nodes.source.stop();
    } catch {
      // source déjà terminée : rien à faire
    }
    track.nodes.source.disconnect();
    track.nodes.gain.disconnect();
    track.nodes = null;
  }
}
