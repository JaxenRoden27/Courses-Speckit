/**
 * Export OC CS Speckit user stories + Gherkin AC for Digital.ai Agility Excel import.
 *
 * Output: docs/agility-import/*.csv — paste into Agility Basic/Advanced import template worksheets:
 *   Portfolio Item (optional epics), Story, Test
 *
 * Usage: node scripts/export-agility-import.mjs
 *        node scripts/export-agility-import.mjs --project "OC CS Speckit"
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBacklog, DEFAULT_PROJECT } from "./agility/backlog-data.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const outDir = join(rootDir, "docs", "agility-import");

const PROJECT = process.argv.includes("--project")
  ? process.argv[process.argv.indexOf("--project") + 1]
  : DEFAULT_PROJECT;

function csvEscape(value) {
  const text = String(value ?? "").replace(/\r\n/g, "\n");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows) {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

function main() {
  const backlog = buildBacklog(PROJECT);

  const portfolioRows = [
    ["AssetType", "Name", "Scope", "Description", "Reference"],
  ];
  const storyRows = [
    [
      "AssetType",
      "Name",
      "Scope",
      "Description",
      "Reference",
      "Super",
      "Parent",
    ],
  ];
  const testRows = [
    ["AssetType", "Name", "Parent", "Description", "ExpectedResults", "Reference"],
  ];

  for (const feature of backlog.features) {
    portfolioRows.push([
      "Portfolio Item",
      feature.epic.name,
      PROJECT,
      feature.epic.description,
      feature.epic.ref,
    ]);

    for (const story of feature.stories) {
      storyRows.push([
        "Story",
        story.name,
        PROJECT,
        story.description,
        story.ref,
        feature.epic.ref,
        feature.epic.name,
      ]);
    }

    for (const story of feature.stories) {
      for (const test of story.tests) {
        testRows.push([
          "Test",
          test.name,
          story.ref,
          test.description,
          test.expectedResults,
          test.ref,
        ]);
      }
    }
  }

  mkdirSync(outDir, { recursive: true });

  writeFileSync(join(outDir, "PortfolioItem.csv"), toCsv(portfolioRows), "utf8");
  writeFileSync(join(outDir, "Story.csv"), toCsv(storyRows), "utf8");
  writeFileSync(join(outDir, "Test.csv"), toCsv(testRows), "utf8");

  console.log(`Wrote ${outDir}/`);
  console.log(`  PortfolioItem.csv — ${backlog.totals.epics} epics`);
  console.log(`  Story.csv — ${backlog.totals.stories} stories`);
  console.log(`  Test.csv — ${backlog.totals.tests} acceptance tests`);
  console.log(`  Scope (project): ${PROJECT}`);
  console.log("");
  console.log("Next: see docs/agility-import/README.md for import steps.");
}

main();
