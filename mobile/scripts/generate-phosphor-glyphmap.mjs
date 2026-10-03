import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const css = readFileSync(require.resolve('@phosphor-icons/web/regular/style.css'), 'utf8');

const glyphMap = {};
for (const [, name, hex] of css.matchAll(/\.ph-([a-z0-9-]+):before\s*\{\s*content:\s*"\\([0-9a-f]+)"/g)) {
  glyphMap[name] = parseInt(hex, 16);
}

const out = new URL('../src/components/phosphor-glyphmap.json', import.meta.url);
writeFileSync(out, JSON.stringify(glyphMap, null, 2) + '\n');
console.log(`wrote ${Object.keys(glyphMap).length} glyphs`);
