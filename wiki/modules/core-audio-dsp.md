# Module `src/core/audio-dsp.js`

## Rôle
Traitement du signal audio numérique (DSP) léger pour la reconnaissance automatique du contenu audio :
- `computeSilenceRatio(samples, threshold)` : mesure la proportion de silence dans le signal.
- `computeRmsStats(samples, numWindows)` : calcule la moyenne et la stabilité de la dynamique (écart-type RMS).
- `detectSpeechBursts(samples, numFrames, threshold)` : regroupe les trames actives en répliques ou tours de parole (durée, RMS, ZCR).
- `analyzeSpeakerShifts(bursts)` : estime la variance de timbre vocal (ZCR) et les transitions d'intervenants pour discriminer monologue vs conversation.
- `computeAcousticFeatures(samples, duration)` : profile acoustiquement le signal pour distinguer voix vs musique et monologue vs conversation.

## API exportée
- `computeSilenceRatio`
- `computeRmsStats`
- `detectSpeechBursts`
- `analyzeSpeakerShifts`
- `computeAcousticFeatures`

