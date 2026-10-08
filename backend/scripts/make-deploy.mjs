#!/usr/bin/env node
/**
 * Build backend/deploy/ folder for SSH deploy (cross-platform).
 * Requires backend/.env to exist.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const deployDir = join(root, "deploy");
const envPath = join(root, ".env");

if (!existsSync(envPath)) {
  console.error("backend/.env not found. Copy .env.example to .env first.");
  process.exit(1);
}

if (!existsSync(join(root, "course-t4-backend.service"))) {
  console.error("course-t4-backend.service is required for deploy.");
  process.exit(1);
}

rmSync(deployDir, { recursive: true, force: true });
mkdirSync(deployDir, { recursive: true });

const entries = [
  "app",
  "server.js",
  "package.json",
  "package-lock.json",
  ".env",
  "course-t4-backend.service",
];

for (const name of entries) {
  const from = join(root, name);
  if (!existsSync(from)) {
    console.warn(`skip missing: ${name}`);
    continue;
  }
  cpSync(from, join(deployDir, name), { recursive: true });
}

console.log(`Backend deploy artifact: ${deployDir}`);
