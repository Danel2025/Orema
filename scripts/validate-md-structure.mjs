#!/usr/bin/env node

/**
 * Validate that markdown files follow the project structure:
 * - Only README.md and CLAUDE.md allowed at root
 * - All other .md files must be in /docs or subdirectories
 */

import { readdir } from "fs/promises";
import { join } from "path";

const ALLOWED_ROOT_FILES = ["README.md", "CLAUDE.md"];

async function findMarkdownFiles(dir, baseDir = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    // Skip node_modules and hidden directories
    if (entry.name === "node_modules" || entry.name.startsWith(".")) {
      continue;
    }

    if (entry.isDirectory()) {
      const subFiles = await findMarkdownFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else if (entry.name.endsWith(".md")) {
      files.push(fullPath.replace(baseDir + "\\", "").replace(/\\/g, "/"));
    }
  }

  return files;
}

async function validateStructure() {
  const rootDir = process.cwd();
  const allMdFiles = await findMarkdownFiles(rootDir);

  const violations = [];

  for (const file of allMdFiles) {
    // Check if file is at root level (no directory separator)
    const isRootLevel = !file.includes("/");

    if (isRootLevel && !ALLOWED_ROOT_FILES.includes(file)) {
      violations.push(file);
    }
  }

  if (violations.length > 0) {
    console.error("❌ Markdown structure validation failed!\n");
    console.error("The following files should be moved to /docs:\n");
    violations.forEach((file) => console.error(`  - ${file}`));
    console.error("\nOnly README.md and CLAUDE.md are allowed at root.");
    console.error("See /docs/README.md for documentation structure.\n");
    process.exit(1);
  }

  console.log("✅ Markdown structure validation passed!");
}

validateStructure().catch((error) => {
  console.error("Error during validation:", error);
  process.exit(1);
});
