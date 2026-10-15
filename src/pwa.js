/**
 * Rôle : enregistre le service worker (PWA, mode hors-ligne) quand le navigateur le permet.
 * Exemple : await registerPwa();
 */
export async function registerPwa(win = globalThis) {
  if (!win.navigator || !('serviceWorker' in win.navigator)) return false;
  try {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({ immediate: true });
    return true;
  } catch {
    return false;
  }
}
