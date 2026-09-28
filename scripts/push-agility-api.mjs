/**
 * Push OC CS Speckit backlog to Digital.ai Agility via Bulk JSON API.
 *
 * Auth: Access Token (Bearer) — create in Agility: My Settings → Access Tokens
 * Docs: https://docs.digital.ai/agility/docs/developerlibrary/access-token-authentication
 *       https://docs.digital.ai/agility/docs/asset-creation-examples-1
 *       https://docs.digital.ai/agility/docs/asset-updation-examples
 *
 * Usage:
 *   node scripts/push-agility-api.mjs
 *     Full push — create all epics, then stories + tests for every feature.
 *
 *   node scripts/push-agility-api.mjs --feature 3
 *     Feature push — stories + tests for feature 3 only (uses existing epic by name, or creates that epic).
 *
 *   node scripts/push-agility-api.mjs --feature 3 --upsert
 *     Feature upsert — update existing stories/tests by Reference or Name; create missing items.
 *
 *   node scripts/push-agility-api.mjs --dry-run
 *   node scripts/push-agility-api.mjs --verify
 *   node scripts/push-agility-api.mjs --project "My Project"
 *   node scripts/push-agility-api.mjs --feature 3 --dry-run
 *
 * Optional: copy .env.agility.example → .env.agility (gitignored)
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBacklog, DEFAULT_PROJECT } from "./agility/backlog-data.mjs";
import {
  buildFeatureUpsertPlan,
  formatUpsertPlanSummary,
  printUpsertPlan,
} from "./agility/upsert.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }
  const lines = readFileSync(path, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(join(rootDir, ".env.agility"));

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    dryRun: false,
    verifyOnly: false,
    project: null,
    featureNums: [],
    upsert: false,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--verify") {
      options.verifyOnly = true;
      continue;
    }

    if (arg === "--project") {
      options.project = args[i + 1] ?? null;
      i += 1;
      continue;
    }

    if (arg.startsWith("--project=")) {
      options.project = arg.slice("--project=".length);
      continue;
    }

    if (arg === "--feature" || arg === "-f") {
      const value = args[i + 1];
      if (!value) {
        throw new Error("Missing value for --feature (e.g. --feature 3)");
      }
      options.featureNums.push(Number.parseInt(value, 10));
      i += 1;
      continue;
    }

    if (arg.startsWith("--feature=")) {
      options.featureNums.push(Number.parseInt(arg.slice("--feature=".length), 10));
      continue;
    }

    if (arg === "--upsert") {
      options.upsert = true;
      continue;
    }
  }

  if (options.upsert && options.featureNums.length === 0) {
    throw new Error("--upsert requires --feature N (e.g. --feature 3 --upsert)");
  }

  for (const featureNum of options.featureNums) {
    if (!Number.isInteger(featureNum) || featureNum < 1) {
      throw new Error(`Invalid --feature value: ${featureNum}. Use a positive integer (e.g. 3).`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Push OC CS Speckit backlog to Digital.ai Agility (Bulk JSON API)

Usage:
  node scripts/push-agility-api.mjs [options]

Modes:
  (default)           Create all epics, then all stories + tests (features 1–5)
  --feature <n>       Stories + tests for feature N only (epic looked up by name; created if missing)
  -f <n>              Shorthand for --feature
  --upsert            With --feature: update existing stories/tests; create missing (requires --feature)

Options:
  --dry-run           Print payloads without calling the API
  --verify            Count epics/stories in the target project
  --project <name>    Agility Scope name (default: AGILITY_SCOPE or "${DEFAULT_PROJECT}")
  -h, --help          Show this help

Examples:
  npm run agility:push
  npm run agility:push -- --feature 3
  npm run agility:push -- --feature 3 --upsert
  npm run agility:push:dry-run -- --feature 2 --upsert
  npm run agility:verify

Environment (.env.agility):
  AGILITY_BASE_URL, AGILITY_ACCESS_TOKEN, AGILITY_SCOPE
`);
}

const cli = parseArgs(process.argv);

if (cli.help) {
  printHelp();
  process.exit(0);
}

const dryRun = cli.dryRun;
const verifyOnly = cli.verifyOnly;
const scopeName = cli.project ?? process.env.AGILITY_SCOPE ?? DEFAULT_PROJECT;
const featureOnly = cli.featureNums.length > 0;
const upsertMode = cli.upsert;
const backlogOptions = featureOnly ? { featureNums: cli.featureNums } : {};

const baseUrl = (process.env.AGILITY_BASE_URL ?? "").replace(/\/$/, "");
const accessToken = process.env.AGILITY_ACCESS_TOKEN ?? "";

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

if (!dryRun && !verifyOnly) {
  if (!baseUrl) {
    fail("Set AGILITY_BASE_URL (e.g. https://your-instance.com)");
  }
  if (!accessToken) {
    fail("Set AGILITY_ACCESS_TOKEN (Bearer token from Agility My Settings → Access Tokens)");
  }
}

function authHeaders(contentType = "application/json") {
  const headers = { Authorization: `Bearer ${accessToken}` };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return headers;
}

function parseBulkResponse(data, label) {
  if (!data || typeof data !== "object") {
    throw new Error(`${label}: unexpected non-JSON response`);
  }

  const failures = data.commandFailures?.commands ?? [];
  if (failures.length > 0) {
    throw new Error(
      `${label} reported ${failures.length} command failure(s):\n${JSON.stringify(failures, null, 2)}`,
    );
  }

  const created = data.assetsCreated?.oidTokens ?? [];
  const modified = data.assetsModified?.oidTokens ?? [];
  return { created, modified, raw: data };
}

async function apiPost(path, body, label = "Bulk API", { previewOnly = false } = {}) {
  const query = previewOnly ? "?previewOnly=true" : "";
  const url = `${baseUrl}${path}${query}`;
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const detail = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    throw new Error(`${label} failed (${response.status}): ${detail}`);
  }

  return parseBulkResponse(data, label);
}

async function restGet(path) {
  const response = await fetch(`${baseUrl}${path}`, { headers: authHeaders(null) });
  const text = await response.text();
  return { ok: response.ok, status: response.status, text };
}

function scopeWhereClause(scopeRef) {
  return scopeRef.startsWith("Scope:")
    ? `Scope='${scopeRef}'`
    : `Scope.Name='${scopeName.replace(/'/g, "''")}'`;
}

async function resolveScopeRef() {
  if (scopeName.startsWith("Scope:")) {
    return scopeName;
  }

  const where = `Name='${scopeName.replace(/'/g, "''")}'`;
  const { ok, status, text } = await restGet(
    `/rest-1.v1/Data/Scope?sel=Name&where=${encodeURIComponent(where)}`,
  );

  if (!ok) {
    throw new Error(`Scope lookup failed (${status}): ${text.slice(0, 400)}`);
  }

  const oid =
    text.match(/\bid="(Scope:\d+)"/)?.[1] ??
    text.match(/\bid='(Scope:\d+)'/)?.[1];
  if (!oid) {
    fail(
      `No Agility project named "${scopeName}". Use the exact Product Planning project name or set AGILITY_SCOPE=Scope:12345.`,
    );
  }

  return oid;
}

function extractAssetOid(text, assetType) {
  const pattern = new RegExp(`\\bid=["'](${assetType}:\\d+)["']`, "g");
  const matches = [...text.matchAll(pattern)];
  return matches.map((match) => match[1]);
}

async function findEpicOidByName(scopeRef, epicName) {
  const escapedName = epicName.replace(/'/g, "''");
  const where = `${scopeWhereClause(scopeRef)};Name='${escapedName}'`;
  const { ok, status, text } = await restGet(
    `/rest-1.v1/Data/Epic?sel=Name&where=${encodeURIComponent(where)}`,
  );

  if (!ok) {
    throw new Error(`Epic lookup failed (${status}): ${text.slice(0, 400)}`);
  }

  const oids = extractAssetOid(text, "Epic");
  if (oids.length === 0) {
    return null;
  }

  if (oids.length > 1) {
    console.warn(
      `Warning: ${oids.length} epics named "${epicName}" in scope — using ${oids[0]}. Remove duplicates in Agility to avoid ambiguity.`,
    );
  }

  return oids[0];
}

function buildEpicPayload(feature, scopeRef) {
  return {
    Scope: scopeRef,
    AssetType: "Epic",
    Name: feature.epic.name,
    Description: feature.epic.description,
  };
}

function buildEpicPayloads(backlog, scopeRef) {
  return backlog.features.map((feature) => buildEpicPayload(feature, scopeRef));
}

function buildStoryPayloads(feature, scopeRef, epicOid) {
  return feature.stories.map((story) => ({
    Scope: scopeRef,
    AssetType: "Story",
    Name: story.name,
    Description: story.description,
    Reference: story.ref,
    Super: epicOid,
    Children: story.tests.map((test) => ({
      AssetType: "Test",
      Name: test.name,
      Description: test.description,
      ExpectedResults: test.expectedResults,
      Reference: test.ref,
    })),
  }));
}

function countTests(feature) {
  return feature.stories.reduce((total, story) => total + story.tests.length, 0);
}

async function resolveEpicOid(feature, scopeRef, { createIfMissing }) {
  const existingOid = await findEpicOidByName(scopeRef, feature.epic.name);
  if (existingOid) {
    console.log(`  Epic found: ${feature.epic.name} (${existingOid})`);
    return existingOid;
  }

  if (!createIfMissing) {
    throw new Error(
      `Epic "${feature.epic.name}" not found in ${scopeName}. Run a full push or feature push first to create the epic, then use --upsert.`,
    );
  }

  console.log(`  Epic not found — creating: ${feature.epic.name}`);
  const epicResult = await apiPost("/api/asset", [buildEpicPayload(feature, scopeRef)], "Epic create");
  if (epicResult.created.length !== 1) {
    throw new Error(
      `Expected 1 epic OID, got ${epicResult.created.length}: ${epicResult.created.join(", ")}`,
    );
  }

  return epicResult.created[0];
}

async function pushStoriesForFeature(feature, scopeRef, epicOid) {
  const storyPayloads = buildStoryPayloads(feature, scopeRef, epicOid);

  console.log(
    `  Stories + tests: ${storyPayloads.length} stories, ${countTests(feature)} tests…`,
  );

  const storyResult = await apiPost(
    "/api/asset",
    storyPayloads,
    `Stories for ${feature.epic.name}`,
  );
  console.log(`  Created: ${storyResult.created.length} assets`);
}

async function upsertStoriesForFeature(feature, scopeRef, epicOid) {
  const plan = await buildFeatureUpsertPlan(feature, scopeRef, epicOid, restGet);
  const summary = formatUpsertPlanSummary(plan);

  console.log(
    `  Upsert plan: ${summary.storiesCreate} story create, ${summary.storiesUpdate} story update, ` +
      `${summary.testsCreate} test create, ${summary.testsUpdate} test update`,
  );

  if (plan.payloads.length === 0) {
    console.log("  Nothing to do.");
    return summary;
  }

  const result = await apiPost("/api/asset", plan.payloads, `Upsert ${feature.epic.name}`);

  console.log(
    `  Result: ${result.created.length} created, ${result.modified.length} modified`,
  );

  return summary;
}

async function countAssetsInScope(assetType, scopeRef) {
  const { ok, text } = await restGet(
    `/rest-1.v1/Data/${assetType}?sel=Name&where=${encodeURIComponent(scopeWhereClause(scopeRef))}&page=1,0`,
  );
  if (!ok) {
    return -1;
  }
  return (text.match(/<Asset /g) || []).length;
}

async function verifyPush(scopeRef) {
  console.log(`Verify — ${scopeName} (${scopeRef})`);
  console.log("");

  const epics = await countAssetsInScope("Epic", scopeRef);
  const stories = await countAssetsInScope("Story", scopeRef);

  console.log(`  Epics in project:   ${epics >= 0 ? epics : "query failed"}`);
  console.log(`  Stories in project: ${stories >= 0 ? stories : "query failed"}`);

  console.log("");
  console.log("Where to look in Agility UI:");
  console.log("  • Epics → Product Planning → Portfolio / Epics (not Team Backlog)");
  console.log("  • Stories → Product Planning → Backlog for this project");
  console.log("  • Tests → open a Story → Tests / Acceptance Criteria tab");
}

async function printUpsertDryRun(backlog, scopeRef) {
  console.log("DRY RUN — upsert plan (lookups + payloads for /api/asset)\n");
  console.log("Mode: feature upsert (update existing; create missing)\n");

  for (const feature of backlog.features) {
    const epicOid = await findEpicOidByName(scopeRef, feature.epic.name);
    if (!epicOid) {
      console.log(`Feature ${feature.num} — ${feature.epic.name}`);
      console.log(
        "  Epic not found — upsert requires an existing epic. Run a feature or full push first.",
      );
      console.log("");
      continue;
    }

    console.log(`  Epic found: ${feature.epic.name} (${epicOid})`);
    const plan = await buildFeatureUpsertPlan(feature, scopeRef, epicOid, restGet);
    printUpsertPlan(feature, plan);
    console.log("");
  }
}

function printDryRun(backlog, scopeRef, featureOnly) {
  console.log("DRY RUN — payloads that would be POSTed to /api/asset\n");

  if (featureOnly) {
    console.log("Mode: feature push (stories + tests only)\n");
    for (const feature of backlog.features) {
      console.log(
        `Feature ${feature.num} — ${feature.epic.name} (epic: lookup by name, create if missing)`,
      );
      console.log(JSON.stringify(buildStoryPayloads(feature, scopeRef, "Epic:<oid>"), null, 2));
      console.log("");
    }
    return;
  }

  console.log("Mode: full push (epics + stories + tests)\n");
  console.log("Phase 1 — create epics:");
  console.log(JSON.stringify(buildEpicPayloads(backlog, scopeRef), null, 2));
  console.log("\nPhase 2 — create stories + tests (direct create, linked via Super):");
  for (const feature of backlog.features) {
    console.log(`\nFeature ${feature.num} — ${feature.epic.name}:`);
    console.log(JSON.stringify(buildStoryPayloads(feature, scopeRef, "Epic:<oid>"), null, 2));
  }
}

async function pushFullBacklog(backlog, scopeRef) {
  console.log("Mode: full push (epics + stories + tests)\n");
  console.log("Phase 1: Creating epics…");
  const epicPayloads = buildEpicPayloads(backlog, scopeRef);
  const epicResult = await apiPost("/api/asset", epicPayloads, "Epic create");
  if (epicResult.created.length !== backlog.features.length) {
    throw new Error(
      `Expected ${backlog.features.length} epic OIDs, got ${epicResult.created.length}: ${epicResult.created.join(", ")}`,
    );
  }

  for (let i = 0; i < backlog.features.length; i += 1) {
    const feature = backlog.features[i];
    const epicOid = epicResult.created[i];
    console.log(`Phase 2 — Feature ${feature.num}: ${feature.epic.name} (${epicOid})`);
    await pushStoriesForFeature(feature, scopeRef, epicOid);
  }
}

async function pushFeatureBacklog(backlog, scopeRef) {
  const modeLabel = upsertMode ? "feature upsert" : "feature push";
  console.log(
    `Mode: ${modeLabel} — stories + tests for feature(s) ${cli.featureNums.join(", ")}\n`,
  );

  for (const feature of backlog.features) {
    console.log(`Feature ${feature.num}: ${feature.epic.name}`);
    const epicOid = await resolveEpicOid(feature, scopeRef, { createIfMissing: !upsertMode });
    if (upsertMode) {
      await upsertStoriesForFeature(feature, scopeRef, epicOid);
    } else {
      await pushStoriesForFeature(feature, scopeRef, epicOid);
    }
    console.log("");
  }
}

async function main() {
  if (verifyOnly) {
    if (!baseUrl || !accessToken) {
      fail("Set AGILITY_BASE_URL and AGILITY_ACCESS_TOKEN for --verify");
    }
    const scopeRef = await resolveScopeRef();
    await verifyPush(scopeRef);
    return;
  }

  const backlog = buildBacklog(scopeName, backlogOptions);
  const modeLabel = featureOnly
    ? upsertMode
      ? `feature ${cli.featureNums.join(", ")} upsert (stories + tests)`
      : `feature ${cli.featureNums.join(", ")} (stories + tests)`
    : "full backlog (epics + stories + tests)";

  console.log(`Agility push — ${scopeName}`);
  console.log(`  Mode: ${modeLabel}`);
  console.log(
    `  ${backlog.totals.epics} epic(s), ${backlog.totals.stories} stories, ${backlog.totals.tests} tests`,
  );
  console.log("");

  const scopeRef =
    dryRun && !(upsertMode && baseUrl && accessToken) ? scopeName : await resolveScopeRef();

  if (dryRun) {
    if (upsertMode && baseUrl && accessToken) {
      await printUpsertDryRun(backlog, scopeRef);
    } else {
      printDryRun(backlog, scopeRef, featureOnly);
    }
    console.log("\nSet AGILITY_BASE_URL and AGILITY_ACCESS_TOKEN, then re-run without --dry-run.");
    return;
  }

  console.log(`Scope resolved: ${scopeRef}`);

  if (featureOnly) {
    await pushFeatureBacklog(backlog, scopeRef);
  } else {
    await pushFullBacklog(backlog, scopeRef);
  }

  console.log("");
  await verifyPush(scopeRef);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
