/**
 * Rôle : bus d'événements global (EventTarget) qui découple les modules UI.
 * Exemple : const off = on('library:changed', refresh); emit('library:changed'); off();
 */
const target = new EventTarget();

export function emit(name, detail) {
  target.dispatchEvent(new CustomEvent(name, { detail }));
}

export function on(name, handler) {
  const listener = (event) => handler(event.detail);
  target.addEventListener(name, listener);
  return () => target.removeEventListener(name, listener);
}
