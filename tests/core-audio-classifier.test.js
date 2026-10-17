import { it, expect } from 'vitest';
import { classifyBlockContent } from '../src/core/audio-classifier.js';
import { createBlock } from '../src/core/block-model.js';

it('classifies empty block as empty', () => {
  const block = createBlock();
  const nature = classifyBlockContent(block);
  expect(nature.type).toBe('empty');
});

it('classifies unanalysed non-empty block as pending', () => {
  const block = createBlock({ clips: [{ duration: 25, trackId: 't-1', name: 'audio_01.mp3' }] });
  const nature = classifyBlockContent(block);
  expect(nature.type).toBe('pending');
  expect(nature.label).toBe('Analyse sonore…');
});

it('classifies short clip with sfx acoustic features as ambiance/bruitage', () => {
  const block = createBlock({
    clips: [{ duration: 2, trackId: 't-1', name: 'Ding' }],
    acousticFeatures: { signalClass: 'ambiance', silenceRatio: 0.8 },
  });
  const nature = classifyBlockContent(block);
  expect(nature.type).toBe('ambiance');
});

it('classifies clip matching music keywords with acoustic features as musique', () => {
  const block = createBlock({
    clips: [{ duration: 30, trackId: 't-1', name: 'Background Music' }],
    acousticFeatures: { signalClass: 'musique', silenceRatio: 0.05, rmsStd: 0.04 },
  });
  const nature = classifyBlockContent(block);
  expect(nature.type).toBe('musique');
  expect(nature.icon).toBe('🎵');
});

it('classifies multi-track clips with speech acoustic as conversation', () => {
  const block = createBlock({
    tracks: [{ id: 't-1' }, { id: 't-2' }],
    clips: [
      { duration: 15, trackId: 't-1', name: 'Host' },
      { duration: 20, trackId: 't-2', name: 'Guest' },
    ],
    acousticFeatures: { signalClass: 'speech', estimatedSpeakers: 2 },
  });
  const nature = classifyBlockContent(block);
  expect(nature.type).toBe('conversation');
  expect(nature.icon).toBe('👥');
});

it('classifies overlapping clips on timeline with speech acoustic as conversation', () => {
  const block = createBlock({
    clips: [
      { duration: 10, start: 0, trackId: 't-1', name: 'Intervenant 1' },
      { duration: 10, start: 8, trackId: 't-1', name: 'Intervenant 2' },
    ],
    acousticFeatures: { signalClass: 'speech', estimatedSpeakers: 1 },
  });
  const nature = classifyBlockContent(block);
  expect(nature.type).toBe('conversation');
});

it('classifies clip using acoustic profile as musique even with generic name', () => {
  const block = createBlock({
    clips: [{ duration: 40, trackId: 't-1', name: 'Enregistrement 1' }],
    acousticFeatures: { silenceRatio: 0.04, rmsStd: 0.03 },
  });
  const nature = classifyBlockContent(block);
  expect(nature.type).toBe('musique');
});

it('respects customNature override even without acoustic features', () => {
  const custom = { type: 'interview', label: 'Interview', icon: '🎙️', badge: 'Personnalisé' };
  const block = createBlock({ customNature: custom, clips: [{ duration: 20 }] });
  expect(classifyBlockContent(block)).toBe(custom);
});

it('classifies alternating clips on a single track as conversation (turn-taking)', () => {
  const block = createBlock({
    clips: [
      { duration: 8, start: 0, trackId: 't-1', name: 'Alice' },
      { duration: 7, start: 8.5, trackId: 't-1', name: 'Bob' },
      { duration: 9, start: 16, trackId: 't-1', name: 'Alice' },
    ],
    acousticFeatures: { signalClass: 'speech', estimatedSpeakers: 1 },
  });
  const nature = classifyBlockContent(block);
  expect(nature.type).toBe('conversation');
  expect(nature.details?.reasons.some((r) => r.includes('Alternance'))).toBe(true);
});

it('classifies monologue when acoustic confirms single speaker and context', () => {
  const block = createBlock({
    topic: 'Chronique de la semaine',
    clips: [{ duration: 45, trackId: 't-1', name: 'Enregistrement' }],
    acousticFeatures: { signalClass: 'monologue', estimatedSpeakers: 1 },
  });
  const nature = classifyBlockContent(block);
  expect(nature.type).toBe('monologue');
  expect(nature.details?.isConversation).toBe(false);
});

it('classifies conversation when acoustic diarization detects 2 speakers', () => {
  const block = createBlock({
    clips: [{ duration: 30, trackId: 't-1', name: 'Enregistrement brut' }],
    acousticFeatures: { signalClass: 'conversation', estimatedSpeakers: 2, speakerShiftCount: 3 },
  });
  const nature = classifyBlockContent(block);
  expect(nature.type).toBe('conversation');
  expect(nature.details?.speakerEstimate).toBeGreaterThanOrEqual(2);
});

it('classifies jingle with acoustic profile as jingle/musique', () => {
  const block1 = createBlock({
    clips: [{ duration: 4, trackId: 't-1', name: 'Virgule sonore' }],
    acousticFeatures: { signalClass: 'musique', silenceRatio: 0.08, rmsStd: 0.05 },
  });
  expect(classifyBlockContent(block1).type).toBe('musique');
  expect(classifyBlockContent(block1).label).toContain('Jingle');
});

it('classifies preset-jingle clip as jingle/musique without waiting for analysis', () => {
  const block = createBlock({ clips: [{ duration: 3, trackId: 't-1', sourceId: 'preset-jingle', name: 'Jingle' }] });
  const nature = classifyBlockContent(block);
  expect(nature.type).toBe('musique');
  expect(nature.icon).toBe('🔔');
});

it('classifies 2-speaker exchange on single track as conversation', () => {
  const block = createBlock({
    clips: [
      { duration: 10, start: 0, trackId: 't-1', name: 'Animateur' },
      { duration: 14, start: 10.5, trackId: 't-1', name: 'Invité' },
    ],
    acousticFeatures: { signalClass: 'speech', estimatedSpeakers: 1 },
  });
  const nature = classifyBlockContent(block);
  expect(nature.type).toBe('conversation');
  expect(nature.icon).toBe('👥');
});

it('classifies dialogue keyword clip as conversation with acoustic features', () => {
  const block = createBlock({
    clips: [{ duration: 25, trackId: 't-1', name: 'Dialogue_ep01.wav' }],
    acousticFeatures: { signalClass: 'speech', estimatedSpeakers: 1 },
  });
  const nature = classifyBlockContent(block);
  expect(nature.type).toBe('conversation');
});

it('never classifies musical audio with dynamics as conversation even with generic name', () => {
  const block = createBlock({
    clips: [{ duration: 45, trackId: 't-1', name: 'audio_track_02.mp3' }],
    acousticFeatures: { dominantClass: 'music', signalClass: 'musique', silenceRatio: 0.05, rmsStd: 0.12, estimatedSpeakers: 1 },
  });
  const nature = classifyBlockContent(block);
  expect(nature.type).toBe('musique');
  expect(nature.icon).toBe('🎵');
  expect(nature.type).not.toBe('conversation');
});

it('classifies short musical audio (jingle) as jingle and never monologue even with 1 speaker estimate', () => {
  const block = createBlock({
    clips: [{ duration: 8, trackId: 't-1', name: 'sound_03.wav' }],
    acousticFeatures: { dominantClass: 'music', signalClass: 'jingle', silenceRatio: 0.08, lfr: 0.18, estimatedSpeakers: 1 },
  });
  const nature = classifyBlockContent(block);
  expect(nature.type).toBe('musique');
  expect(nature.label).toContain('Jingle');
  expect(nature.icon).toBe('🔔');
  expect(nature.type).not.toBe('monologue');
});



