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

rmSync(deployDir, { recursive: true, force: true });
mkdirSync(deployDir, { recursive: true });

const entries = [
  "app",
  "server.js",
  "package.json",
  "package-lock.json",
  ".env",
];

for (const name of entries) {
  const from = join(root, name);
  if (!existsSync(from)) {
    console.warn(`skip missing: ${name}`);
    continue;
  }
  cpSync(from, join(deployDir, name), { recursive: true });
}

const serviceFile = join(root, "todo-speckit-backend.service");
if (existsSync(serviceFile)) {
  cpSync(serviceFile, join(deployDir, "todo-speckit-backend.service"));
}

console.log(`Backend deploy artifact: ${deployDir}`);
