// R4 : chaque fichier de src/ doit avoir sa page wiki/modules/<chemin>.md
// (ex. src/core/db.js -> wiki/modules/core-db.md).
import { readdirSync, existsSync, statSync } from 'node:fs';
import { join, extname, relative, sep } from 'node:path';

const SRC = 'src';
const WIKI = join('wiki', 'modules');
const SOURCE_EXT = new Set(['.js', '.css']);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (SOURCE_EXT.has(extname(path))) yield path;
  }
}

function wikiPageFor(file) {
  const parts = relative(SRC, file).split(sep);
  const name = parts.join('-').replace(/\.(js|css)$/, '');
  return join(WIKI, `${name}.md`);
}

const missing = [];
for (const file of walk(SRC)) {
  const page = wikiPageFor(file);
  if (!existsSync(page)) missing.push(`${file} -> ${page}`);
}

if (missing.length > 0) {
  console.error(`R4 violée, pages wiki manquantes :\n - ${missing.join('\n - ')}`);
  process.exit(1);
}
console.log('R4 OK : chaque module possède sa page wiki.');
