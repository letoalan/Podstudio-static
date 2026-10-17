// R2 : échoue si un fichier (code, CSS, test, wiki, plan) dépasse 200 lignes.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const MAX_LINES = 200;
const ROOTS = ['src', 'tests', 'wiki', 'scripts', 'index.html', 'new.md', 'plan.md'];
const EXTENSIONS = new Set(['.js', '.mjs', '.css', '.html', '.md']);

function* walk(path) {
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path)) yield* walk(join(path, entry));
  } else if (EXTENSIONS.has(extname(path))) {
    yield path;
  }
}

function countLines(file) {
  const text = readFileSync(file, 'utf8');
  return text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
}

const offenders = [];
for (const root of ROOTS) {
  try {
    for (const file of walk(root)) {
      const lines = countLines(file);
      if (lines > MAX_LINES) offenders.push(`${file} (${lines} lignes)`);
    }
  } catch {
    // racine absente : ignorée
  }
}

if (offenders.length > 0) {
  console.error(`R2 violée (> ${MAX_LINES} lignes) :\n - ${offenders.join('\n - ')}`);
  process.exit(1);
}
console.log(`R2 OK : aucun fichier au-dessus de ${MAX_LINES} lignes.`);
