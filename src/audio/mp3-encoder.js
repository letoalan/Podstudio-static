/**
 * Rôle : conversion PCM Float32 -> MP3 (LAME) par blocs de 1152 échantillons, sans dépendance au DOM.
 * Exemple : const chunks = encodeMp3([left, right], 44100, Mp3Encoder, { onProgress });
 */
export const MP3_KBPS = 128;
export const BLOCK_SIZE = 1152;

export function floatToInt16(samples) {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function encodeBlocks(encoder, pcm, onProgress) {
  const chunks = [];
  const total = pcm[0].length;
  for (let i = 0; i < total; i += BLOCK_SIZE) {
    const block = pcm.map((channel) => channel.subarray(i, i + BLOCK_SIZE));
    const out = encoder.encodeBuffer(...block);
    if (out.length > 0) chunks.push(out);
    onProgress?.(Math.min(1, (i + BLOCK_SIZE) / total));
  }
  return chunks;
}

export function encodeMp3(channels, sampleRate, Mp3Encoder, options = {}) {
  const { kbps = MP3_KBPS, onProgress } = options;
  const used = channels.slice(0, 2);
  const encoder = new Mp3Encoder(used.length, sampleRate, kbps);
  const chunks = encodeBlocks(encoder, used.map(floatToInt16), onProgress);
  const tail = encoder.flush();
  if (tail.length > 0) chunks.push(tail);
  return chunks;
}
