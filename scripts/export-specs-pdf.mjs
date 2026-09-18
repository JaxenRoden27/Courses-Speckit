import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { mdToPdf } from "md-mermaid-pdf";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const SYSTEM_CHROME_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  // macOS
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  // Windows
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
  // Linux
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

function installPuppeteerChrome() {
  console.log("Installing Puppeteer Chrome (one-time download)...");
  execSync("npx puppeteer browsers install chrome", {
    cwd: rootDir,
    stdio: "inherit",
  });
}

function getLaunchOptions() {
  const executablePath = resolveChromeExecutable();

  if (executablePath) {
    return { executablePath };
  }

  return {};
}

/** Preferred Cursor rule order; any other `.mdc` files are appended alphabetically. */
const RULE_ORDER = [
  "constitution.mdc",
  "feature-branch.mdc",
  "quality-attributes.mdc",
  "project-structure.mdc",
  "api-conventions.mdc",
  "auth-patterns.mdc",
  "frontend-services.mdc",
  "security.mdc",
  "testing-standards.mdc",
  "ui-style-system.mdc",
];

/** Preferred C4 diagram order under docs/arch_diagrams/. */
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

function discoverRuleFiles() {
  const rulesDir = join(rootDir, ".cursor", "rules");
  const found = listFiles(rulesDir, (name) => name.endsWith(".mdc")).map(toRepoRelative);
  const ordered = [];

  for (const name of RULE_ORDER) {
    const path = `.cursor/rules/${name}`;
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

/** ADR index first, then numbered ADRs (`0001-….md`) in numeric order. */
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

/** NFR index + quality-attributes (and any other markdown under docs/nfr/). */
function discoverNfrFiles() {
  const nfrDir = join(rootDir, "docs", "nfr");
  const files = [];
  const readme = join(nfrDir, "README.md");

  if (existsSync(readme)) {
    files.push(toRepoRelative(readme));
  }

  for (const absolute of listFiles(
    nfrDir,
    (name) => name.endsWith(".md") && name !== "README.md",
  )) {
    files.push(toRepoRelative(absolute));
  }

  return files;
}

/**
 * C4 / architecture diagrams under docs/arch_diagrams/.
 * Preferred order first; any other `.md` files appended alphabetically.
 */
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

/**
 * Catalog + framework, then `feature-N-*.md` (numeric), then reference docs.
 * New feature/ADR markdown is picked up automatically — no list edits required.
 */
function discoverSpecFiles() {
  const featuresDir = join(rootDir, "features");
  const files = [];

  for (const name of ["README.md", "framework.md"]) {
    const absolute = join(featuresDir, name);
    if (existsSync(absolute)) {
      files.push(toRepoRelative(absolute));
    }
  }

  for (const absolute of listFiles(featuresDir, (name) => /^feature-\d+-.*\.md$/i.test(name))) {
    files.push(toRepoRelative(absolute));
  }

  const referenceDir = join(featuresDir, "reference");
  const referenceReadme = join(referenceDir, "README.md");
  if (existsSync(referenceReadme)) {
    files.push(toRepoRelative(referenceReadme));
  }

  for (const absolute of listFiles(
    referenceDir,
    (name) => name.endsWith(".md") && name !== "README.md",
  )) {
    files.push(toRepoRelative(absolute));
  }

  return files;
}

function stripFrontmatter(content) {
  if (!content.startsWith("---")) {
    return content;
  }

  const end = content.indexOf("---", 3);
  if (end === -1) {
    return content;
  }

  return content.slice(end + 3).trimStart();
}

function readSection(relativePath) {
  const absolutePath = join(rootDir, relativePath);
  if (!existsSync(absolutePath)) {
    console.warn(`Skipping missing file: ${relativePath}`);
    return null;
  }

  const raw = readFileSync(absolutePath, "utf8");
  const body = relativePath.endsWith(".mdc") ? stripFrontmatter(raw) : raw;
  const title = relativePath.split("/").pop();

  return `<!-- source: ${relativePath} -->\n\n# ${title}\n\n${body.trim()}`;
}

/**
 * Arch diagrams: keep the file's own H1 + description with the Mermaid figure.
 * Soft page break between files (not before the first). Print CSS keeps heading + figure together.
 * Do not inject a redundant `# filename` heading (saves vertical space).
 */
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

/** Soft join: page break between diagrams; CSS keeps each H1/description with its Mermaid figure. */
function joinArchSections(paths) {
  return paths
    .map((path, index) => readArchSection(path, { pageBreakBefore: index > 0 }))
    .filter(Boolean)
    .join("\n\n");
}

function buildCombinedMarkdown() {
  const ruleFiles = discoverRuleFiles();
  const adrFiles = discoverAdrFiles();
  const nfrFiles = discoverNfrFiles();
  const archFiles = discoverArchDiagramFiles();
  const specFiles = discoverSpecFiles();

  const featureStart = specFiles.findIndex((path) => /\/feature-\d+-/.test(path));
  const referenceStart = specFiles.findIndex((path) => path.includes("/reference/"));

  const catalogAndFramework =
    featureStart === -1 ? specFiles : specFiles.slice(0, featureStart);
  const featureSpecs =
    featureStart === -1
      ? []
      : referenceStart === -1
        ? specFiles.slice(featureStart)
        : specFiles.slice(featureStart, referenceStart);
  const referenceSpecs = referenceStart === -1 ? [] : specFiles.slice(referenceStart);

  console.log(
    `PDF sources — ${ruleFiles.length} rules, ${adrFiles.length} ADRs, ${nfrFiles.length} NFRs, ` +
      `${archFiles.length} arch diagrams, ${specFiles.length} feature docs`,
  );

  return [
    "# Speckit — Rules & Specifications",
    "",
    "Generated from `.cursor/rules/`, `docs/adr/`, `docs/nfr/`, `docs/arch_diagrams/`, and `features/` (auto-discovered).",
    "Mermaid fences (including C4) are rendered in the PDF via `md-mermaid-pdf`.",
    "",
    "---",
    "",
    "# Part 1: Cursor Rules",
    "",
    joinSections(ruleFiles),
    PAGE_BREAK,
    "# Part 2: Architecture Decision Records",
    "",
    joinSections(adrFiles),
    PAGE_BREAK,
    "# Part 3: Quality Attributes (NFRs)",
    "",
    joinSections(nfrFiles),
    PAGE_BREAK,
    "# Part 4: Architecture Diagrams (C4)",
    "",
    joinArchSections(archFiles),
    PAGE_BREAK,
    "# Part 5: Feature Specifications",
    "",
    joinSections([...catalogAndFramework, ...featureSpecs]),
    PAGE_BREAK,
    "# Part 6: Reference (current integrated state)",
    "",
    joinSections(referenceSpecs),
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
    // Offline-friendly: use Mermaid bundled with md-mermaid-pdf (includes C4).
    mermaidSource: "bundled",
    mermaidConfig: {
      startOnLoad: false,
      theme: "default",
    },
    // Keep diagram headings with their figures; scale SVGs so they fit under the intro text.
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
      /* Prefer keeping the Mermaid block on the same page as the preceding heading/paragraph. */
      pre.mermaid, .mermaid {
        break-before: avoid-page;
        page-break-before: avoid;
        max-width: 100%;
        overflow: visible;
      }
      /* Cap height so the figure fits under title + short description on one Letter page. */
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
  const markdownPath = join(outputDir, "speckit-specs.md");
  const pdfPath = join(outputDir, "speckit-specs.pdf");

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
