/**
 * Rôle : génération et pré-écoute des transitions audio (pause, whoosh, jingle, fondu au noir, fondu enchaîné).
 * Exemple : const buf = renderTransitionBuffer({ type: 'whoosh', duration: 1.2 });
 */
function createBuffer(channels, length, sampleRate) {
  if (typeof AudioBuffer !== 'undefined') {
    return new AudioBuffer({ numberOfChannels: channels, length, sampleRate });
  }
  const data = Array.from({ length: channels }, () => new Float32Array(length));
  return { numberOfChannels: channels, length, sampleRate, duration: length / sampleRate, getChannelData: (c) => data[c] };
}

function fillWhoosh(channelData, length, sampleRate) {
  for (let i = 0; i < length; i++) {
    const t = i / length;
    const env = Math.sin(Math.PI * t) ** 2;
    const freq = 150 + 600 * Math.sin(Math.PI * t);
    const wave = Math.sin(2 * Math.PI * freq * (i / sampleRate));
    const noise = (Math.random() * 2 - 1) * 0.4;
    channelData[i] = (wave * 0.6 + noise) * env * 0.5;
  }
}

function fillJingle(channelData, length, sampleRate) {
  const notes = [523.25, 659.25, 783.99]; // Do, Mi, Sol
  const noteDuration = length / (notes.length * sampleRate);
  for (let i = 0; i < length; i++) {
    const time = i / sampleRate;
    const noteIdx = Math.min(notes.length - 1, Math.floor(time / noteDuration));
    const noteTime = time - noteIdx * noteDuration;
    const env = Math.max(0, 1 - noteTime / noteDuration) ** 1.8;
    const freq = notes[noteIdx];
    const wave = Math.sin(2 * Math.PI * freq * time) + 0.3 * Math.sin(4 * Math.PI * freq * time);
    channelData[i] = wave * env * 0.35;
  }
}

export function renderTransitionBuffer(transition = {}, sampleRate = 44100) {
  const type = transition.type || 'pause';
  const duration = Math.max(0.2, Number(transition.duration) || 1.0);
  const length = Math.ceil(duration * sampleRate);
  const buf = createBuffer(2, length, sampleRate);
  const ch0 = buf.getChannelData(0);
  const ch1 = buf.getChannelData(1);

  if (type === 'whoosh') {
    fillWhoosh(ch0, length, sampleRate);
    fillWhoosh(ch1, length, sampleRate);
  } else if (type === 'jingle') {
    fillJingle(ch0, length, sampleRate);
    fillJingle(ch1, length, sampleRate);
  }
  // Pour pause, crossfade et fade, le buffer reste silencieux ou sert d'espacement
  return buf;
}

export async function previewTransition(transition, ctx = null) {
  const AudioCtx = ctx || new (globalThis.AudioContext || globalThis.webkitAudioContext)();
  if (AudioCtx.state === 'suspended') await AudioCtx.resume();
  const buffer = renderTransitionBuffer(transition, AudioCtx.sampleRate);
  const source = AudioCtx.createBufferSource();
  source.buffer = buffer;
  const gain = AudioCtx.createGain();
  gain.gain.value = 0.8;
  source.connect(gain);
  gain.connect(AudioCtx.destination);
  source.start(0);
  return { stop: () => { try { source.stop(); } catch { /* ignore */ } } };
}
