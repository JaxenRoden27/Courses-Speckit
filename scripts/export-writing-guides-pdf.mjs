#!/usr/bin/env node
/**
 * Export each student writing guide to a PDF (same engine as npm run specs:pdf).
 *
 * Usage:
 *   npm run writing-guides:pdf
 *   node scripts/export-writing-guides-pdf.mjs
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mdToPdf } from "md-mermaid-pdf";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const GUIDES = [
  "features/writing-feature-requirements.md",
  "features/writing-feature-design.md",
  "features/reference/writing-living-reference.md",
  "docs/adr/writing-adrs.md",
  "docs/nfr/writing-quality-attributes.md",
];

const SYSTEM_CHROME_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  process.env.LOCALAPPDATA
    ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
    : null,
  process.env.PROGRAMFILES
    ? `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`
    : null,
  process.env["PROGRAMFILES(X86)"]
    ? `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`
    : null,
  process.env.PROGRAMFILES
    ? `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`
    : null,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

function resolveChromeExecutable() {
  for (const candidate of SYSTEM_CHROME_PATHS) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function getLaunchOptions() {
  const executablePath = resolveChromeExecutable();
  return executablePath ? { executablePath } : {};
}

function installPuppeteerChrome() {
  console.log("Installing Puppeteer Chrome (one-time download)...");
  execSync("npx puppeteer browsers install chrome", {
    cwd: rootDir,
    stdio: "inherit",
  });
}

async function renderPdf(markdown, pdfPath) {
  const config = {
    dest: pdfPath,
    basedir: rootDir,
    pdf_options: {
      format: "Letter",
      margin: "20mm",
      printBackground: true,
    },
    launch_options: getLaunchOptions(),
    mermaidSource: "bundled",
  };

  try {
    return await mdToPdf({ content: markdown }, config);
  } catch (error) {
    const message = String(error?.message ?? error);
    const chromeMissing = message.includes("Could not find Chrome");
    if (!chromeMissing || resolveChromeExecutable()) {
      throw error;
    }
    installPuppeteerChrome();
    return mdToPdf(
      { content: markdown },
      { ...config, launch_options: getLaunchOptions() },
    );
  }
}

async function main() {
  for (const relative of GUIDES) {
    const mdPath = join(rootDir, relative);
    if (!existsSync(mdPath)) {
      throw new Error(`Missing writing guide: ${relative}`);
    }

    const pdfPath = mdPath.replace(/\.md$/i, ".pdf");
    mkdirSync(dirname(pdfPath), { recursive: true });

    const markdown = readFileSync(mdPath, "utf8");
    const pdf = await renderPdf(markdown, pdfPath);
    if (!pdf) {
      throw new Error(`PDF generation failed for ${relative}`);
    }

    // md-mermaid-pdf may return a buffer; ensure file exists on disk
    if (!existsSync(pdfPath) && pdf?.filename) {
      // already written via dest
    }
    if (!existsSync(pdfPath) && Buffer.isBuffer(pdf)) {
      writeFileSync(pdfPath, pdf);
    }

    console.log(`Wrote ${pdfPath}`);
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
