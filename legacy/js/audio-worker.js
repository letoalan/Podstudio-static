/**
 * Audio Worker
 * Handles converting raw PCM audio (WAV) to MP3 using lamejs.
 * This runs in a separate thread to avoid freezing the UI.
 */

importScripts('../vendor/lame.min.js');

self.onmessage = function (e) {
    const { command, audioData, sampleRate } = e.data;

    if (command === 'encode') {
        encodeMP3(audioData, sampleRate);
    }
};

function encodeMP3(audioData, sampleRate) {
    // Check if lamejs is loaded
    if (typeof lamejs === 'undefined') {
        self.postMessage({ error: 'LameJS library not found in vendor/' });
        return;
    }

    const mp3Encoder = new lamejs.Mp3Encoder(1, sampleRate, 128); // Mono, SampleRate, 128kbps
    const samples = convertFloat32ToInt16(audioData);

    let mp3Data = [];
    const blockSize = 1152; // Must be multiple of 576

    for (let i = 0; i < samples.length; i += blockSize) {
        const sampleChunk = samples.subarray(i, i + blockSize);
        const mp3buf = mp3Encoder.encodeBuffer(sampleChunk);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
    }

    const mp3buf = mp3Encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
    }

    const blob = new Blob(mp3Data, { type: 'audio/mp3' });
    self.postMessage({ command: 'complete', blob: blob });
}

function convertFloat32ToInt16(buffer) {
    let l = buffer.length;
    let buf = new Int16Array(l);
    while (l--) {
        // Clamp the value between -1 and 1
        let s = Math.max(-1, Math.min(1, buffer[l]));
        // Convert to 16-bit integer
        buf[l] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return buf;
}
