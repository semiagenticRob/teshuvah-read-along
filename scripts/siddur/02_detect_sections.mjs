import fs from 'fs';
import path from 'path';
import { RULES_DIR, INTERMEDIATE_DIR, ensureDir } from './utils/paths.mjs';

ensureDir(INTERMEDIATE_DIR);

const rules = JSON.parse(fs.readFileSync(path.join(RULES_DIR, 'sections.json'), 'utf8'));
const manifest = {
  sections: rules.sections,
  essays: rules.essays,
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync(
  path.join(INTERMEDIATE_DIR, 'section_manifest.json'),
  JSON.stringify(manifest, null, 2),
);
console.log(`Stage 02: wrote section_manifest.json (${rules.sections.length} sections, ${rules.essays.length} essays)`);
