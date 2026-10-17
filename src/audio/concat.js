/**
 * Rôle : concaténation séquentielle de plusieurs AudioBuffers en un seul flux audio continu.
 * Exemple : const fullBuffer = concatAudioBuffers([buf1, buf2], 44100);
 */

function createCompatibleBuffer(numChannels, length, sampleRate) {
  if (typeof AudioBuffer !== 'undefined') {
    return new AudioBuffer({ numberOfChannels: numChannels, length, sampleRate });
  }
  const channels = Array.from({ length: numChannels }, () => new Float32Array(length));
  return {
    numberOfChannels: numChannels,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: (ch) => channels[ch],
  };
}

export function concatAudioBuffers(buffers = [], sampleRate = 44100) {
  const valid = buffers.filter((b) => b && b.length > 0);
  if (!valid.length) return createCompatibleBuffer(2, 0, sampleRate);
  if (valid.length === 1) return valid[0];

  const numChannels = Math.max(...valid.map((b) => b.numberOfChannels || 1));
  const totalLength = valid.reduce((acc, b) => acc + b.length, 0);
  const out = createCompatibleBuffer(numChannels, totalLength, sampleRate);

  for (let ch = 0; ch < numChannels; ch++) {
    const outData = out.getChannelData(ch);
    let offset = 0;
    for (const b of valid) {
      const srcData = b.numberOfChannels > ch ? b.getChannelData(ch) : b.getChannelData(0);
      outData.set(srcData, offset);
      offset += b.length;
    }
  }

  return out;
}
