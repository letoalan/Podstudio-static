import { it, expect, vi, beforeEach } from 'vitest';
import { analyzeRecording, analyzeProjectBlocks } from '../src/audio/audio-analyzer.js';
import { CLASSIFIER_VERSION } from '../src/core/audio-classifier.js';
import { on } from '../src/core/bus.js';

vi.mock('../src/core/storage.js', () => ({
  updateRecordingAnalysis: vi.fn().mockResolvedValue(true),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

it('analyzeRecording returns null if sourceId or storage is missing', async () => {
  expect(await analyzeRecording(null, {})).toBeNull();
  expect(await analyzeRecording('src-1', null)).toBeNull();
});

it('analyzeRecording returns existing features if matching CLASSIFIER_VERSION', async () => {
  const existingFeatures = { signalClass: 'musique', silenceRatio: 0.05, rmsStd: 0.02 };
  const storage = {
    getRecording: vi.fn().mockResolvedValue({
      id: 'rec-1',
      classifierVersion: CLASSIFIER_VERSION,
      acousticFeatures: existingFeatures,
    }),
  };

  const feat = await analyzeRecording('rec-1', storage);
  expect(feat).toEqual(existingFeatures);
  expect(storage.getRecording).toHaveBeenCalledWith('rec-1');
});

it('analyzeRecording decodes audio, computes features and updates storage when not analyzed', async () => {
  const fakeSamples = new Float32Array(800).fill(0.2);
  const fakeCtx = {
    decodeAudioData: vi.fn().mockResolvedValue({
      duration: 3,
      getChannelData: () => fakeSamples,
    }),
  };

  const storage = {
    getRecording: vi.fn().mockResolvedValue({
      id: 'rec-new',
      audio: { arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)) },
    }),
  };

  const feat = await analyzeRecording('rec-new', storage, fakeCtx);
  expect(feat).not.toBeNull();
  expect(feat.signalClass).toBeDefined();

  // Test caching: second call returns without calling storage.getRecording again
  storage.getRecording.mockClear();
  const cached = await analyzeRecording('rec-new', storage);
  expect(cached).toBe(feat);
  expect(storage.getRecording).not.toHaveBeenCalled();
});

it('analyzeProjectBlocks skips transitions and analyzes unanalyzed clips, emitting block:classified', async () => {
  const classifiedEvents = [];
  const unsubscribe = on('block:classified', (data) => classifiedEvents.push(data));

  const existingFeatures = { signalClass: 'conversation', estimatedSpeakers: 2 };
  const storage = {
    getRecording: vi.fn().mockResolvedValue({
      id: 'src-conv',
      classifierVersion: CLASSIFIER_VERSION,
      acousticFeatures: existingFeatures,
    }),
  };

  const project = {
    blocks: [
      { id: 'b-trans', type: 'transition', clips: [] },
      {
        id: 'b-content',
        type: 'standard',
        clips: [
          { id: 'c-1', sourceId: 'src-conv', name: 'Interview' },
          { id: 'c-2', sourceId: null, name: 'Empty' },
        ],
      },
    ],
  };

  const onClassified = vi.fn();
  await analyzeProjectBlocks(project, storage, onClassified);

  expect(onClassified).toHaveBeenCalledTimes(1);
  expect(onClassified).toHaveBeenCalledWith({
    blockId: 'b-content',
    clipId: 'c-1',
    features: existingFeatures,
  });
  expect(project.blocks[1].clips[0].acousticFeatures).toEqual(existingFeatures);
  expect(project.blocks[1].acousticFeatures).toEqual(existingFeatures);
  expect(classifiedEvents.length).toBe(1);
  expect(classifiedEvents[0].blockId).toBe('b-content');

  unsubscribe();
});
