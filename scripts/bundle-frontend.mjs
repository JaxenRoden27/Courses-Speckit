#!/usr/bin/env node
/**
 * Build frontend deploy artifact (frontend/dist/).
 * Cross-platform — Node only.
 *
 * Usage: npm run bundle:frontend:full
 *        node scripts/bundle-frontend.mjs
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const frontendDir = join(rootDir, "frontend");

function run(command, args, cwd) {
  console.log(`> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(frontendDir)) {
  console.error(`Missing frontend directory: ${frontendDir}`);
  process.exit(1);
}

console.log("Installing frontend dependencies...");
run("npm", ["install"], frontendDir);

console.log("Building frontend...");
run("npm", ["run", "build"], frontendDir);

console.log("Running frontend bundle (SPA .htaccess into dist/)...");
run("npm", ["run", "bundle"], frontendDir);

console.log(`Frontend deploy artifact: ${join(frontendDir, "dist")}`);
