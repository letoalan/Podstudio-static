/**
 * Rôle : extracteur de caractéristiques acoustiques (Silence, RMS, ZCR, tours de parole) pour classifier voix vs musique et monologue vs conversation.
 * Exemple : const stats = computeAcousticFeatures(samples); // { silenceRatio, rmsMean, rmsStd, signalClass, estimatedSpeakers }
 */

export function computeSilenceRatio(samples, threshold = 0.015, frameSize = 320) {
  if (!samples || samples.length === 0) return 0;
  const numFrames = Math.floor(samples.length / frameSize);
  if (numFrames <= 1) {
    let sumSq = 0;
    for (let i = 0; i < samples.length; i++) sumSq += samples[i] * samples[i];
    return Math.sqrt(sumSq / samples.length) < threshold ? 1 : 0;
  }
  let silent = 0;
  for (let f = 0; f < numFrames; f++) {
    const start = f * frameSize;
    let sumSq = 0;
    for (let i = start; i < start + frameSize; i++) sumSq += samples[i] * samples[i];
    if (Math.sqrt(sumSq / frameSize) < threshold) silent++;
  }
  return silent / numFrames;
}

export function computeRmsStats(samples, numWindows = 32) {
  if (!samples || samples.length === 0) return { mean: 0, std: 0 };
  const windowSize = Math.max(1, Math.floor(samples.length / numWindows));
  const rmsValues = [];

  for (let w = 0; w < numWindows; w++) {
    const start = w * windowSize;
    const end = Math.min(samples.length, start + windowSize);
    let sumSq = 0;
    for (let i = start; i < end; i++) sumSq += samples[i] * samples[i];
    rmsValues.push(Math.sqrt(sumSq / (end - start)));
  }

  const mean = rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length;
  const variance = rmsValues.reduce((acc, v) => acc + (v - mean) ** 2, 0) / rmsValues.length;
  return { mean, std: Math.sqrt(variance) };
}

function computeSliceZcr(samples, start, end) {
  let crossings = 0;
  for (let i = start; i < end - 1; i++) {
    if ((samples[i] >= 0 && samples[i + 1] < 0) || (samples[i] < 0 && samples[i + 1] >= 0)) {
      crossings++;
    }
  }
  return crossings / Math.max(1, end - start);
}

function estimateSlicePitch(samples, start, end, sampleRate = 16000) {
  const minLag = Math.floor(sampleRate / 400);
  const maxLag = Math.floor(sampleRate / 75);
  if (end - start <= maxLag * 2) return 0;
  let bestLag = 0;
  let maxCorr = -1;
  let zeroCorr = 0;
  for (let i = start; i < start + maxLag; i++) zeroCorr += samples[i] * samples[i];
  if (zeroCorr < 0.001) return 0;

  for (let lag = minLag; lag <= maxLag; lag += 2) {
    let corr = 0;
    for (let i = 0; i < maxLag; i += 2) corr += samples[start + i] * samples[start + i + lag];
    if (corr > maxCorr) { maxCorr = corr; bestLag = lag; }
  }
  return (maxCorr / zeroCorr > 0.35 && bestLag > 0) ? Math.round(sampleRate / bestLag) : 0;
}

export function detectSpeechBursts(samples, threshold = 0.018) {
  if (!samples || samples.length < 100) return [];
  const numFrames = Math.max(30, Math.min(150, Math.floor(samples.length / 512)));
  const frameSize = Math.floor(samples.length / numFrames);
  const bursts = [];
  let cur = null;

  for (let f = 0; f < numFrames; f++) {
    const start = f * frameSize;
    const end = Math.min(samples.length, start + frameSize);
    let sumSq = 0;
    for (let i = start; i < end; i++) sumSq += samples[i] * samples[i];
    const rms = Math.sqrt(sumSq / (end - start));

    if (rms >= threshold) {
      const zcr = computeSliceZcr(samples, start, end);
      const pitch = estimateSlicePitch(samples, start, end);
      if (!cur) cur = { count: 1, sumRms: rms, sumZcr: zcr, pitches: pitch ? [pitch] : [] };
      else { cur.count++; cur.sumRms += rms; cur.sumZcr += zcr; if (pitch) cur.pitches.push(pitch); }
    } else if (cur) {
      const avgP = cur.pitches.length ? cur.pitches.reduce((a, b) => a + b, 0) / cur.pitches.length : 0;
      bursts.push({ frames: cur.count, rms: cur.sumRms / cur.count, zcr: cur.sumZcr / cur.count, pitch: avgP });
      cur = null;
    }
  }
  if (cur) {
    const avgP = cur.pitches.length ? cur.pitches.reduce((a, b) => a + b, 0) / cur.pitches.length : 0;
    bursts.push({ frames: cur.count, rms: cur.sumRms / cur.count, zcr: cur.sumZcr / cur.count, pitch: avgP });
  }
  return bursts;
}

export function analyzeSpeakerShifts(bursts) {
  if (!bursts || bursts.length < 2) return { shiftCount: 0, estimatedSpeakers: 1, zcrStd: 0, pitchShifts: 0 };
  let shifts = 0;
  let pitchShifts = 0;
  for (let i = 1; i < bursts.length; i++) {
    const diffZcr = Math.abs(bursts[i].zcr - bursts[i - 1].zcr);
    const diffRms = Math.abs(bursts[i].rms - bursts[i - 1].rms);
    const ratioRms = bursts[i - 1].rms > 0 ? bursts[i].rms / bursts[i - 1].rms : 1;
    if (diffZcr >= 0.015 || diffRms >= 0.06 || ratioRms > 1.35 || ratioRms < 0.74) shifts++;
    if (bursts[i].pitch > 0 && bursts[i - 1].pitch > 0 && Math.abs(bursts[i].pitch - bursts[i - 1].pitch) >= 30) pitchShifts++;
  }
  const meanZcr = bursts.reduce((acc, b) => acc + b.zcr, 0) / bursts.length;
  const zcrVar = bursts.reduce((acc, b) => acc + (b.zcr - meanZcr) ** 2, 0) / bursts.length;
  const zcrStd = Math.sqrt(zcrVar);
  const isDialogue = (shifts >= 1 && (zcrStd >= 0.015 || pitchShifts >= 1 || shifts >= 2)) || (bursts.length >= 2 && (zcrStd >= 0.018 || pitchShifts >= 1));
  return { shiftCount: shifts, pitchShifts, estimatedSpeakers: isDialogue ? 2 : 1, zcrStd, meanZcr };
}

function computeLowEnergyFrameRatio(samples, numFrames = 32, threshold = 0.015) {
  if (!samples || samples.length === 0) return 0;
  const frameSize = Math.max(1, Math.floor(samples.length / numFrames));
  const rmsArr = [];
  let sumRms = 0;
  for (let f = 0; f < numFrames; f++) {
    const start = f * frameSize;
    const end = Math.min(samples.length, start + frameSize);
    let sumSq = 0;
    for (let i = start; i < end; i++) sumSq += samples[i] * samples[i];
    const rms = Math.sqrt(sumSq / (end - start));
    rmsArr.push(rms);
    sumRms += rms;
  }
  const meanRms = sumRms / numFrames;
  if (meanRms < threshold) return 0;
  return rmsArr.filter((r) => r < meanRms * 0.5).length / numFrames;
}

function determineAcousticClass(silenceRatio, lfr, zcrStd, burstCount, dur, diarization) {
  let music = 0;
  let speech = 0;
  if (silenceRatio < 0.12) music += 40;
  else if (silenceRatio < 0.18) music += 25;
  if (lfr < 0.22) music += 35;
  else if (lfr < 0.30) music += 20;
  if (zcrStd < 0.025) music += 25;
  if (burstCount <= 1 && silenceRatio < 0.15) music += 25;

  if (silenceRatio >= 0.18) speech += 35;
  if (lfr >= 0.32) speech += 35;
  if (zcrStd >= 0.032) speech += 25;
  if (burstCount >= 2 && silenceRatio >= 0.15) speech += 25;

  if (dur <= 3.5 && (silenceRatio > 0.35 || zcrStd < 0.015)) {
    return { dominantClass: 'sfx', signalClass: 'ambiance', confidence: 0.88 };
  }
  if (music > speech && music >= 40) {
    const isJingle = dur <= 20;
    return { dominantClass: 'music', signalClass: isJingle ? 'jingle' : 'musique', confidence: 0.90 };
  }
  if (speech >= music) {
    const isConv = diarization.estimatedSpeakers >= 2;
    return { dominantClass: 'speech', signalClass: isConv ? 'conversation' : 'monologue', confidence: 0.86 };
  }
  return { dominantClass: 'ambiguous', signalClass: 'unknown', confidence: 0.5 };
}

export function computeAcousticFeatures(samples, duration = 10) {
  const silenceRatio = computeSilenceRatio(samples);
  const rms = computeRmsStats(samples);
  const bursts = detectSpeechBursts(samples);
  const diarization = analyzeSpeakerShifts(bursts);
  const meanZcr = bursts.length ? bursts.reduce((a, b) => a + b.zcr, 0) / bursts.length : 0;
  const lfr = computeLowEnergyFrameRatio(samples);
  const cls = determineAcousticClass(silenceRatio, lfr, diarization.zcrStd, bursts.length, duration, diarization);

  return {
    silenceRatio,
    lfr,
    rmsMean: rms.mean,
    rmsStd: rms.std,
    meanZcr,
    burstCount: bursts.length,
    speakerShiftCount: diarization.shiftCount,
    pitchShiftCount: diarization.pitchShifts,
    estimatedSpeakers: cls.dominantClass === 'music' ? 1 : diarization.estimatedSpeakers,
    dominantClass: cls.dominantClass,
    signalClass: cls.signalClass,
    confidence: cls.confidence,
  };
}
