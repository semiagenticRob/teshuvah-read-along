/**
 * Stage 08 — Tag conditional blocks and sections.
 *
 * For each *.minyan.json in intermediate/sections/:
 *   1. Checks conditional.json rules
 *   2. For sectionLevel rules: adds conditionalRule to the section root
 *   3. For blockLevel rules: adds conditionalTags to every block in the section
 *   4. Writes to intermediate/sections/{id}.conditional.json
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const SECTIONS_DIR = join(REPO_ROOT, 'content', 'feigenbaum-2026', 'intermediate', 'sections');
const RULES_DIR = join(REPO_ROOT, 'content', 'feigenbaum-2026', 'rules');

// ─── Load rules ───────────────────────────────────────────────────────────────

const conditionalRules = JSON.parse(readFileSync(join(RULES_DIR, 'conditional.json'), 'utf8'));

// ─── Main ─────────────────────────────────────────────────────────────────────

const inputFiles = readdirSync(SECTIONS_DIR).filter(f => f.endsWith('.minyan.json'));

let sectionsWithConditionalRule = 0;
let sectionsWithBlockTags = 0;

for (const fname of inputFiles) {
  const inputPath = join(SECTIONS_DIR, fname);
  const sectionData = JSON.parse(readFileSync(inputPath, 'utf8'));
  const sectionId = sectionData.sectionId;

  // ── Section-level rules ──────────────────────────────────────────────────────
  const sectionRule = conditionalRules.sectionLevel.find(r => r.sectionId === sectionId);
  if (sectionRule) {
    sectionData.conditionalRule = sectionRule.rule;
    sectionsWithConditionalRule++;
    console.log(`  ${sectionId}: section-level conditionalRule → type=${sectionRule.rule.type}`);
  }

  // ── Block-level rules ────────────────────────────────────────────────────────
  const blockRules = conditionalRules.blockLevel.filter(r => r.sectionId === sectionId);

  for (const blockRule of blockRules) {
    if (blockRule.blockMatch && blockRule.blockMatch.wholeSection) {
      // Add conditionalTags to EVERY block in the section
      let blockCount = 0;
      for (const block of sectionData.blocks) {
        if (!block.conditionalTags) {
          block.conditionalTags = [];
        }
        block.conditionalTags.push(blockRule.rule);
        blockCount++;
      }
      sectionsWithBlockTags++;
      console.log(`  ${sectionId}: ${blockCount} block(s) tagged with conditionalTags → type=${blockRule.rule.type}`);
    }
  }

  const outputPath = join(SECTIONS_DIR, fname.replace('.minyan.json', '.conditional.json'));
  writeFileSync(outputPath, JSON.stringify(sectionData, null, 2), 'utf8');
}

console.log(`\nStage 08 complete. ${inputFiles.length} sections processed.`);
console.log(`  ${sectionsWithConditionalRule} section(s) with conditionalRule`);
console.log(`  ${sectionsWithBlockTags} section(s) with block-level tags`);
