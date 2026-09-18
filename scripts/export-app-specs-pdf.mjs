/**
 * Product-only specs PDF: ADRs, NFRs, C4 diagrams, and feature-N specs (with UI images).
 * Excludes Cursor rules, writing guides, framework.md, and living reference.
 *
 * Usage: npm run specs:pdf:app
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { mdToPdf } from "md-mermaid-pdf";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

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
  process.env["PROGRAMFILES(X86)"]
    ? `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`
    : null,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

const ARCH_DIAGRAM_ORDER = [
  "README.md",
  "c4-context.md",
  "c4-container.md",
  "c4-component-frontend.md",
  "c4-component-backend.md",
  "c4-deployment.md",
];

const PAGE_BREAK = '\n\n<div style="page-break-after: always;"></div>\n\n';

function listFiles(dir, predicate) {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir)
    .filter(predicate)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
    .map((name) => join(dir, name));
}

function toRepoRelative(absolutePath) {
  return relative(rootDir, absolutePath).split("\\").join("/");
}

function resolveChromeExecutable() {
  for (const candidate of SYSTEM_CHROME_PATHS) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

function installPuppeteerChrome() {
  console.log("Installing Puppeteer Chrome (one-time download)...");
  execSync("npx puppeteer browsers install chrome", {
    cwd: rootDir,
    stdio: "inherit",
  });
}

function getLaunchOptions() {
  const executablePath = resolveChromeExecutable();
  return executablePath ? { executablePath } : {};
}

/** ADR index + numbered ADRs only (no writing-adrs.md). */
function discoverAdrFiles() {
  const adrDir = join(rootDir, "docs", "adr");
  const files = [];
  const readme = join(adrDir, "README.md");

  if (existsSync(readme)) {
    files.push(toRepoRelative(readme));
  }

  for (const absolute of listFiles(adrDir, (name) => /^\d{4}-.+\.md$/i.test(name))) {
    files.push(toRepoRelative(absolute));
  }

  return files;
}

/** NFR product bars only — skip writing-*.md guides. */
function discoverNfrFiles() {
  const nfrDir = join(rootDir, "docs", "nfr");
  const files = [];
  const readme = join(nfrDir, "README.md");

  if (existsSync(readme)) {
    files.push(toRepoRelative(readme));
  }

  for (const absolute of listFiles(
    nfrDir,
    (name) =>
      name.endsWith(".md") &&
      name !== "README.md" &&
      !/^writing-/i.test(name),
  )) {
    files.push(toRepoRelative(absolute));
  }

  return files;
}

function discoverArchDiagramFiles() {
  const archDir = join(rootDir, "docs", "arch_diagrams");
  if (!existsSync(archDir)) {
    return [];
  }

  const found = listFiles(archDir, (name) => name.endsWith(".md")).map(toRepoRelative);
  const ordered = [];

  for (const name of ARCH_DIAGRAM_ORDER) {
    const path = `docs/arch_diagrams/${name}`;
    if (found.includes(path)) {
      ordered.push(path);
    }
  }

  for (const path of found) {
    if (!ordered.includes(path)) {
      ordered.push(path);
    }
  }

  return ordered;
}

/** Feature catalog + feature-N-*.md only (no framework / writing guides / reference). */
function discoverFeatureFiles() {
  const featuresDir = join(rootDir, "features");
  const files = [];
  const catalog = join(featuresDir, "README.md");

  if (existsSync(catalog)) {
    files.push(toRepoRelative(catalog));
  }

  for (const absolute of listFiles(featuresDir, (name) => /^feature-\d+-.*\.md$/i.test(name))) {
    files.push(toRepoRelative(absolute));
  }

  return files;
}

/**
 * Rewrite feature-relative UI image links so they resolve from repo root (PDF basedir).
 * `](../docs/ui/...)` → `](docs/ui/...)`
 */
function rewriteUiImagePaths(markdown) {
  return markdown
    .replace(/\]\(\.\.\/docs\/ui\//g, "](docs/ui/")
    .replace(/\]\(\.\/docs\/ui\//g, "](docs/ui/");
}

function readSection(relativePath) {
  const absolutePath = join(rootDir, relativePath);
  if (!existsSync(absolutePath)) {
    console.warn(`Skipping missing file: ${relativePath}`);
    return null;
  }

  let body = readFileSync(absolutePath, "utf8").trim();
  if (relativePath.startsWith("features/")) {
    body = rewriteUiImagePaths(body);
  }

  const title = relativePath.split("/").pop();
  return `<!-- source: ${relativePath} -->\n\n# ${title}\n\n${body}`;
}

function readArchSection(relativePath, { pageBreakBefore = false } = {}) {
  const absolutePath = join(rootDir, relativePath);
  if (!existsSync(absolutePath)) {
    console.warn(`Skipping missing file: ${relativePath}`);
    return null;
  }

  const body = readFileSync(absolutePath, "utf8").trim();
  const parts = [`<!-- source: ${relativePath} -->`, "", body];
  if (pageBreakBefore) {
    return PAGE_BREAK + parts.join("\n");
  }
  return parts.join("\n");
}

function joinSections(paths) {
  return paths.map(readSection).filter(Boolean).join(PAGE_BREAK);
}

function joinArchSections(paths) {
  return paths
    .map((path, index) => readArchSection(path, { pageBreakBefore: index > 0 }))
    .filter(Boolean)
    .join("\n\n");
}

function buildCombinedMarkdown() {
  const adrFiles = discoverAdrFiles();
  const nfrFiles = discoverNfrFiles();
  const archFiles = discoverArchDiagramFiles();
  const featureFiles = discoverFeatureFiles();

  console.log(
    `App PDF sources — ${adrFiles.length} ADRs, ${nfrFiles.length} NFRs, ` +
      `${archFiles.length} arch diagrams, ${featureFiles.length} feature docs ` +
      `(no rules / writing guides / reference)`,
  );

  return [
    "# Speckit App — Application Specifications",
    "",
    "Product specs only: architecture decisions, quality attributes, C4 diagrams, and feature specifications (including UI mockups when linked under `docs/ui/`).",
    "",
    "Excluded from this PDF: Cursor rules, SDD writing guides, `framework.md`, and living reference.",
    "For the full methodology pack (rules + guides + reference), run `npm run specs:pdf`.",
    "",
    "Mermaid C4 diagrams are rendered via `md-mermaid-pdf`.",
    "",
    "---",
    "",
    "# Part 1: Architecture Decision Records",
    "",
    joinSections(adrFiles),
    PAGE_BREAK,
    "# Part 2: Quality Attributes (NFRs)",
    "",
    joinSections(nfrFiles),
    PAGE_BREAK,
    "# Part 3: Architecture Diagrams (C4)",
    "",
    joinArchSections(archFiles),
    PAGE_BREAK,
    "# Part 4: Feature Specifications",
    "",
    joinSections(featureFiles),
  ].join("\n");
}

async function renderPdf(combinedMarkdown, pdfPath) {
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
    mermaidConfig: {
      startOnLoad: false,
      theme: "default",
    },
    css: `
      h1, h2, h3, h4 {
        break-after: avoid-page;
        page-break-after: avoid;
      }
      h1 + p, h2 + p, h3 + p {
        break-after: avoid-page;
        page-break-after: avoid;
      }
      p {
        orphans: 3;
        widows: 3;
      }
      img {
        max-width: 100%;
        height: auto;
        page-break-inside: avoid;
      }
      pre.mermaid, .mermaid {
        break-before: avoid-page;
        page-break-before: avoid;
        max-width: 100%;
        overflow: visible;
      }
      pre.mermaid svg, .mermaid svg {
        max-width: 100% !important;
        max-height: 7.2in !important;
        height: auto !important;
        display: block;
      }
    `,
  };

  try {
    return await mdToPdf({ content: combinedMarkdown }, config);
  } catch (error) {
    const message = String(error?.message ?? error);
    const chromeMissing = message.includes("Could not find Chrome");

    if (!chromeMissing || resolveChromeExecutable()) {
      throw error;
    }

    installPuppeteerChrome();

    return mdToPdf(
      { content: combinedMarkdown },
      { ...config, launch_options: getLaunchOptions() },
    );
  }
}

async function main() {
  const combinedMarkdown = buildCombinedMarkdown();
  const outputDir = join(rootDir, "docs");
  const markdownPath = join(outputDir, "app-specs.md");
  const pdfPath = join(outputDir, "app-specs.pdf");

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(markdownPath, combinedMarkdown, "utf8");

  const pdf = await renderPdf(combinedMarkdown, pdfPath);

  if (!pdf) {
    throw new Error("PDF generation failed.");
  }

  console.log(`Wrote ${markdownPath}`);
  console.log(`Wrote ${pdfPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
