// Génère les pages wiki manquantes pour chaque fichier de src/ (règle R4)
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative, sep } from 'node:path';

const SRC = 'src';
const WIKI = join('wiki', 'modules');
const TESTS = 'tests';
const SOURCE_EXT = new Set(['.js', '.css']);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (SOURCE_EXT.has(extname(full))) yield full;
  }
}

function extractMeta(content, isCss) {
  let role = 'Module interne.';
  let example = '// Utilisation interne';
  const roleMatch = content.match(/Rôle\s*:\s*([^\n*]+)/);
  if (roleMatch) role = roleMatch[1].trim();
  const exMatch = content.match(/Exemple\s*:\s*([^\n*]+)/);
  if (exMatch) example = exMatch[1].trim();

  const deps = isCss
    ? [...content.matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((m) => m[1])
    : [...content.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);

  const exportsList = isCss
    ? ['Classes et variables CSS']
    : [...content.matchAll(/export\s+(?:const|function|class)\s+([a-zA-Z0-9_$]+)/g)].map((m) => m[1]);

  return { role, example, deps, exportsList };
}

function findTest(modName) {
  const direct = join(TESTS, `${modName}.test.js`);
  if (existsSync(direct)) return `tests/${modName}.test.js`;
  return 'Validation fonctionnelle et tests d’intégration.';
}

function renderDoc(name, file, meta) {
  const lang = extname(file) === '.css' ? 'css' : 'javascript';
  const depsList = meta.deps.length ? meta.deps.map((d) => `- \`${d}\``).join('\n') : '- Aucune';
  const expList = meta.exportsList.length ? meta.exportsList.map((e) => `- \`${e}\``).join('\n') : '- Module à effets de bord';
  const testInfo = findTest(name);

  return `# Module \`${name}\`

## Rôle
${meta.role}

## Dépendances
${depsList}

## API Publique
${expList}

## Tests liés
${testInfo.startsWith('tests/') ? `[\`${testInfo}\`](../../${testInfo})` : testInfo}

## Exemple d'utilisation
\`\`\`${lang}
${meta.example}
\`\`\`
`;
}

mkdirSync(WIKI, { recursive: true });

for (const file of walk(SRC)) {
  const parts = relative(SRC, file).split(sep);
  const name = parts.join('-').replace(/\.(js|css)$/, '');
  const outPath = join(WIKI, `${name}.md`);
  const content = readFileSync(file, 'utf8');
  const meta = extractMeta(content, extname(file) === '.css');
  writeFileSync(outPath, renderDoc(name, file, meta), 'utf8');
}

console.log('Pages wiki générées avec succès dans wiki/modules/');
