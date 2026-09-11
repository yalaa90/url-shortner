import { createRequire } from 'node:module';
import { writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

const require = createRequire(import.meta.url);

const pkgDir = dirname(require.resolve('@swimlane/ngx-charts/package.json'));
const libDir = join(pkgDir, 'lib');
const fesmFile = 'fesm2020/swimlane-ngx-charts.mjs';
const fesmAbs = join(pkgDir, fesmFile);

const fesmSource = readFileSync(fesmAbs, 'utf8');
const exportedNames = new Set(
  [...fesmSource.matchAll(/^export \{ ([\s\S]*?) \};/gm)].flatMap((m) =>
    m[1]
      .split(',')
      .map((s) => s.trim().split(/\s+as\s+/)[0])
      .filter(Boolean)
  )
);

let shimsCreated = 0;

function exportNamesFromDts(content) {
  const names = [];
  const decl = /^export declare (?:abstract )?(?:class|const|let|var|enum|function) ([A-Za-z0-9_$]+)/gm;
  for (const m of content.matchAll(decl)) names.push(m[1]);

  const reExport = /^export \{ ([^}]+) \}/gm;
  for (const m of content.matchAll(reExport)) {
    const chunk = m[1];
    for (const part of chunk.split(',')) {
      const name = part.trim().split(/\s+as\s+/)[0].trim();
      const hasFrom = /^export \{[\s\S]*?\} from/.test(chunk);
      if (name && !hasFrom) names.push(name);
    }
  }
  return [...new Set(names)].filter((n) => exportedNames.has(n));
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(path);
    } else if (entry.name.endsWith('.d.ts') && !entry.name.endsWith('.d.ts.map')) {
      const rel = relative(libDir, path).replace(/\.d\.ts$/, '');
      const names = exportNamesFromDts(readFileSync(path, 'utf8'));
      if (names.length === 0) continue;
      const shimPath = join(libDir, `${rel}.mjs`);
      const fesmRel = relative(dirname(shimPath), fesmAbs).split(sep).join('/');
      const spec = fesmRel.startsWith('.') ? fesmRel : `./${fesmRel}`;
      writeFileSync(shimPath, `export { ${names.join(', ')} } from ${JSON.stringify(spec)};\n`);
      shimsCreated++;
    }
  }
}

walk(libDir);

const pkgPath = join(pkgDir, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.exports = pkg.exports || {};
pkg.exports['./lib/*'] = './lib/*.mjs';
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(`ngx-charts patch: generated ${shimsCreated} deep-import shim(s) and opened ./lib/* in exports.`);