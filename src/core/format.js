/**
 * Rôle : fonctions pures de formatage (octets, date) partagées par l'UI et le RSS.
 * Exemple : formatBytes(1536000) // "1,5 Mo"
 */
const UNITS = ['o', 'Ko', 'Mo', 'Go'];

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 o';
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / 1024 ** exp;
  const text = exp === 0 ? String(Math.round(value)) : value.toFixed(1).replace('.', ',');
  return `${text} ${UNITS[exp]}`;
}

export function formatDateTime(input) {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
