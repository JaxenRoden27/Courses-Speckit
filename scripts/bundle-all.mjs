#!/usr/bin/env node
/**
 * Build frontend + backend deploy artifacts.
 * Cross-platform — Node only.
 *
 * Usage: npm run bundle:all
 *        node scripts/bundle-all.mjs
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

function runNode(script) {
  const result = spawnSync(process.execPath, [join(__dirname, script)], {
    cwd: rootDir,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runNode("bundle-backend.mjs");
runNode("bundle-frontend.mjs");

console.log("All deploy artifacts ready.");
console.log(`   Frontend → ${join(rootDir, "frontend", "dist")}`);
console.log(`   Backend  → ${join(rootDir, "backend", "deploy")}`);
