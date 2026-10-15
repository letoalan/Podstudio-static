/**
 * Rôle : helpers DOM sûrs (création d'éléments sans innerHTML, téléchargement de Blob).
 * Exemple : document.body.append(h('button', { class: 'btn', onClick: save }, 'Sauvegarder'));
 */
function applyAttr(el, key, value) {
  if (value == null || value === false) return;
  if (key.startsWith('on') && typeof value === 'function') {
    el.addEventListener(key.slice(2).toLowerCase(), value);
  } else if (key === 'class') {
    el.className = value;
  } else if (key === 'dataset') {
    Object.assign(el.dataset, value);
  } else if (key === 'style' && typeof value === 'object') {
    Object.assign(el.style, value);
  } else {
    el.setAttribute(key, value === true ? '' : String(value));
  }
}

function appendChildren(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs ?? {})) applyAttr(el, key, value);
  appendChildren(el, children);
  return el;
}

export const clear = (el) => el.replaceChildren();

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = h('a', { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const makeUrl = (blob) => URL.createObjectURL(blob);
