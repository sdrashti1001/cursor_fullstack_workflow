#!/usr/bin/env node

/**
 * Verify every skill name referenced in solve-ticket's routing table has a
 * matching .cursor/skills/<name>/SKILL.md file. Catches drift like a skill
 * folder being renamed without updating the table (or vice versa).
 *
 * Usage:  node scripts/check-skills.cjs
 * Exit:   0 if all referenced skills exist, 1 otherwise.
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SKILLS_DIR = path.join(ROOT, ".cursor", "skills");
const ORCHESTRATOR = path.join(SKILLS_DIR, "solve-ticket", "SKILL.md");

function extractSkillMapTable(markdown) {
  const lines = markdown.split("\n");
  const startIdx = lines.findIndex((l) => l.trim() === "### Skill map");
  if (startIdx === -1) {
    throw new Error('Could not find "### Skill map" section in solve-ticket/SKILL.md');
  }
  const tableLines = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("|")) {
      tableLines.push(line);
    } else if (tableLines.length > 0) {
      break;
    }
  }
  return tableLines;
}

function parseSkillNames(tableLines) {
  const names = new Set();
  // Skip header row (index 0) and separator row (index 1). First cell of
  // each remaining row is the row label (FE/BE/E2E), not a skill name.
  for (const line of tableLines.slice(2)) {
    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    for (const cell of cells.slice(1)) {
      if (cell === "—" || cell === "-") continue;
      if (/^[a-z0-9-]+$/i.test(cell)) names.add(cell);
    }
  }
  return [...names];
}

function main() {
  if (!fs.existsSync(ORCHESTRATOR)) {
    console.error(`ERROR: ${path.relative(ROOT, ORCHESTRATOR)} not found.`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(ORCHESTRATOR, "utf8");
  const tableLines = extractSkillMapTable(markdown);
  const skillNames = parseSkillNames(tableLines);

  const missing = [];
  const found = [];

  for (const name of skillNames) {
    const skillFile = path.join(SKILLS_DIR, name, "SKILL.md");
    if (fs.existsSync(skillFile)) {
      found.push(name);
    } else {
      missing.push(name);
    }
  }

  console.log(`Checked ${skillNames.length} skill(s) referenced in solve-ticket's routing table.`);
  console.log(`  OK:      ${found.length}`);
  console.log(`  MISSING: ${missing.length}`);

  if (missing.length > 0) {
    console.log("\nMissing skill folders (referenced in the table, no matching SKILL.md):");
    for (const name of missing) {
      console.log(`  - ${name}  (expected .cursor/skills/${name}/SKILL.md)`);
    }
    process.exit(1);
  }

  console.log("\nAll referenced skills resolve to a folder. ✅");
}

main();
