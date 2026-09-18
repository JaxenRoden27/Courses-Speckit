#!/usr/bin/env node
/**
 * Build backend deploy artifact (backend/deploy/).
 * Cross-platform — Node only.
 *
 * Usage: npm run bundle:backend:full
 *        node scripts/bundle-backend.mjs
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const backendDir = join(rootDir, "backend");

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

if (!existsSync(backendDir)) {
  console.error(`Missing backend directory: ${backendDir}`);
  process.exit(1);
}

if (!existsSync(join(backendDir, ".env"))) {
  console.error(
    "backend/.env not found. Copy backend/.env.example to backend/.env and configure it.",
  );
  process.exit(1);
}

console.log("Installing backend dependencies...");
run("npm", ["install"], backendDir);

console.log("Running backend bundle (deploy/ folder)...");
run("npm", ["run", "bundle"], backendDir);

console.log(`Backend deploy artifact: ${join(backendDir, "deploy")}`);
