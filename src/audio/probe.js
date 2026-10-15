/**
 * Rôle : lit la durée réelle d'un fichier audio importé via les métadonnées d'un élément <audio>.
 * Exemple : const seconds = await probeDuration(file); // 0 si illisible
 */
const defaultAudio = () => new Audio();

export function probeDuration(blob, createAudio = defaultAudio) {
  return new Promise((resolve) => {
    const audio = createAudio();
    const url = URL.createObjectURL(blob);
    const done = (value) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => done(Number.isFinite(audio.duration) ? audio.duration : 0);
    audio.onerror = () => done(0);
    audio.src = url;
  });
}
