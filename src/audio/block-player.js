/**
 * Rôle : moteur de lecture multipiste d'un bloc avec gestion du volume, fondus, mute et solo.
 * Exemple : const player = new BlockPlayer(); player.setBuffers(map); player.play(block, 0);
 */
import { scheduleEnvelope } from './envelope.js';

export class BlockPlayer {
  constructor(ctx = null) {
    this.ctx = ctx;
    this.buffers = new Map();
    this.activeNodes = [];
    this.startedAt = 0;
    this.pauseOffset = 0;
    this.playing = false;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  setBuffers(buffersMap) {
    this.buffers = buffersMap instanceof Map ? buffersMap : new Map(Object.entries(buffersMap || {}));
  }

  isPlaying() {
    return this.playing;
  }

  position() {
    if (!this.playing) return this.pauseOffset;
    return this.pauseOffset + (this.ctx.currentTime - this.startedAt);
  }

  stop() {
    for (const node of this.activeNodes) {
      try { node.stop(); } catch { /* ignore */ }
    }
    this.activeNodes = [];
    this.playing = false;
    this.pauseOffset = 0;
  }

  pause() {
    if (!this.playing) return;
    this.pauseOffset = this.position();
    for (const node of this.activeNodes) {
      try { node.stop(); } catch { /* ignore */ }
    }
    this.activeNodes = [];
    this.playing = false;
  }

  play(block, startOffset = 0) {
    this.stop();
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.pauseOffset = Math.max(0, startOffset);
    this.startedAt = ctx.currentTime;
    this.playing = true;

    const hasSolo = block.tracks.some((t) => t.solo);
    for (const track of block.tracks) {
      const isAudible = hasSolo ? track.solo : !track.muted;
      const trackVol = isAudible ? (track.volume ?? 1) : 0;
      this.scheduleTrackClips(block, track.id, trackVol, ctx);
    }
  }

  scheduleTrackClips(block, trackId, trackVol, ctx) {
    const isFirst = block.tracks[0]?.id === trackId;
    const clips = block.clips.filter((c) => (
      c.trackId === trackId || (isFirst && (!c.trackId || !block.tracks.some((t) => t.id === c.trackId)))
    ));
    for (const clip of clips) {
      const buffer = this.buffers.get(clip.sourceId);
      if (!buffer) continue;
      this.scheduleSingleClip(clip, trackVol, buffer, ctx);
    }
  }

  scheduleSingleClip(clip, trackVol, buffer, ctx) {
    const pos = this.pauseOffset;
    if (pos >= clip.start + clip.duration) return;
    const clipStartDelay = Math.max(0, clip.start - pos);
    const when = ctx.currentTime + clipStartDelay;
    const skipInClip = Math.max(0, pos - clip.start);
    const offsetInBuffer = clip.offset + skipInClip;
    const remainingDur = Math.max(0, clip.duration - skipInClip);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    const totalVolume = (clip.gain ?? 1) * trackVol;
    scheduleEnvelope(gain.gain, { volume: totalVolume, fadeIn: clip.fadeIn, fadeOut: clip.fadeOut, duration: clip.duration }, when, skipInClip);

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(when, offsetInBuffer, remainingDur);
    this.activeNodes.push(source);
  }
}
