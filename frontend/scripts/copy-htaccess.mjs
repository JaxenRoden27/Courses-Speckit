#!/usr/bin/env node
/** Copy public/.htaccess into dist/ for SPA deploy (cross-platform). */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "public", ".htaccess");
const destDir = join(root, "dist");
const dest = join(destDir, ".htaccess");

if (!existsSync(src)) {
  console.error(`Missing ${src}`);
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });
cpSync(src, dest);
console.log(`Copied .htaccess → ${dest}`);
