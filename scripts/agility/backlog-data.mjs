/**
 * Shared parser: feature specs → Agility backlog structure.
 *
 * Feature specs are auto-discovered from `features/feature-N-*.md`.
 * Epic names come from each file's `# Feature: …` heading.
 * Set DEFAULT_PROJECT to your Agility Scope name before first export/push.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const rootDir = join(__dirname, "..", "..");

export const DEFAULT_PROJECT = "Speckit App";

const FEATURE_FILE_RE = /^feature-(\d+)-.+\.md$/i;

/**
 * Discover `features/feature-N-*.md` and derive epic titles from `# Feature: …`.
 * @returns {{ num: number, file: string, epic: string }[]}
 */
export function discoverFeatureFiles() {
  const featuresDir = join(rootDir, "features");
  if (!existsSync(featuresDir)) {
    return [];
  }

  const discovered = [];

  for (const name of readdirSync(featuresDir)) {
    const match = name.match(FEATURE_FILE_RE);
    if (!match) continue;

    const num = Number(match[1]);
    const file = `features/${name}`;
    const content = readFileSync(join(featuresDir, name), "utf8");
    const titleMatch = content.match(/^#\s*Feature:\s*(.+)$/m);
    const epic = titleMatch ? titleMatch[1].trim() : `Feature ${num}`;

    discovered.push({ num, file, epic });
  }

  discovered.sort((a, b) => a.num - b.num || a.file.localeCompare(b.file));
  return discovered;
}

/** @type {{ num: number, file: string, epic: string }[]} */
export const FEATURE_FILES = discoverFeatureFiles();

export function storyRef(featureNum, usNum) {
  return `SK-F${featureNum}-US${featureNum}.${usNum}`;
}

export function storyId(featureNum, usNum) {
  return `US-${featureNum}.${usNum}`;
}

export function testRef(featureNum, index) {
  return `SK-F${featureNum}-AC${String(index).padStart(3, "0")}`;
}

export function epicRef(featureNum) {
  return `SK-F${featureNum}-EPIC`;
}

export function parseUserStories(content) {
  const stories = [];
  const storyRegex =
    /### US-\d+\.(\d+): ([^\n]+)\n\*\*As (?:a|the)\*\* ([^\n]+)\n\*\*I want(?: to)?\*\* ([^\n]+)\n\*\*So that\*\* ([^\n]+)/g;

  let match;
  while ((match = storyRegex.exec(content)) !== null) {
    stories.push({
      num: match[1],
      title: match[2].trim(),
      asA: match[3].trim(),
      iWant: match[4].trim(),
      soThat: match[5].trim(),
    });
  }

  return stories;
}

export function parseScenarios(content) {
  const acIndex = content.indexOf("## Acceptance Criteria");
  if (acIndex === -1) {
    return [];
  }

  const acBlock = content.slice(acIndex);
  const lines = acBlock.split("\n");
  const scenarios = [];
  let section = "";
  let current = null;

  for (const line of lines) {
    if (line.startsWith("### ") && !line.startsWith("#### ")) {
      const heading = line.slice(4).trim();
      if (!heading.startsWith("US-") && !heading.startsWith("`") && !heading.startsWith("[")) {
        section = heading;
      } else {
        section = heading;
      }
      continue;
    }

    if (line.startsWith("#### Scenario: ")) {
      if (current) {
        scenarios.push(current);
      }
      current = {
        section,
        title: line.slice("#### Scenario: ".length).trim(),
        steps: [],
      };
      continue;
    }

    if (current && line.startsWith("*")) {
      current.steps.push(line.replace(/^\*\s*/, "").trim());
    }
  }

  if (current) {
    scenarios.push(current);
  }

  return scenarios;
}

/** Map each Gherkin scenario to a user story id using the AC ### US-N.n heading. */
export function mapScenarioToStory(featureNum, scenario) {
  const idMatch = scenario.section.match(/US-(\d+)\.(\d+)/i);
  if (idMatch && Number(idMatch[1]) === featureNum) {
    return idMatch[2];
  }

  return "1";
}

export function formatGherkin(scenario) {
  return scenario.steps.map((step) => step.replace(/\*\*/g, "")).join("\n");
}

export function formatExpectedResults(scenario) {
  const thenSteps = scenario.steps
    .filter((step) => /^Then|^And/i.test(step.replace(/\*\*/g, "")))
    .map((step) => step.replace(/\*\*/g, ""));

  return thenSteps.length > 0 ? thenSteps.join("\n") : formatGherkin(scenario);
}

function storyDescription(story, feature, ref) {
  return [
    `As a/the ${story.asA}`,
    `I want ${story.iWant}`,
    `So that ${story.soThat}`,
    "",
    `Spec: ${feature.file}`,
    `Story ID: ${ref}`,
    `Branch: feature/${feature.num}-*`,
  ].join("\n");
}

/**
 * @param {string} project Agility Scope (project name)
 * @param {{ featureNums?: number[] }} [options]
 */
export function buildBacklog(project = DEFAULT_PROJECT, options = {}) {
  const { featureNums } = options;
  const featureFiles = discoverFeatureFiles();

  if (featureFiles.length === 0) {
    throw new Error(
      "No feature specs found. Add files matching features/feature-N-*.md with a `# Feature: …` heading.",
    );
  }

  const selectedFeatures =
    featureNums?.length > 0
      ? featureFiles.filter((feature) => featureNums.includes(feature.num))
      : featureFiles;

  if (featureNums?.length > 0 && selectedFeatures.length === 0) {
    const valid = featureFiles.map((feature) => feature.num).join(", ");
    throw new Error(`Unknown feature number(s): ${featureNums.join(", ")}. Valid: ${valid}`);
  }

  const features = [];
  let totalStories = 0;
  let totalTests = 0;

  for (const feature of selectedFeatures) {
    const content = readFileSync(join(rootDir, feature.file), "utf8");
    const epicReference = epicRef(feature.num);
    const stories = parseUserStories(content);
    const scenarios = parseScenarios(content);

    const testsByStory = new Map();
    for (const story of stories) {
      testsByStory.set(story.num, []);
    }

    let acIndex = 1;
    for (const scenario of scenarios) {
      const usNum = mapScenarioToStory(feature.num, scenario);
      const parentRef = storyRef(feature.num, usNum);
      const ref = testRef(feature.num, acIndex);
      acIndex += 1;

      const test = {
        ref,
        name: scenario.title,
        description: formatGherkin(scenario),
        expectedResults: formatExpectedResults(scenario),
        parentRef,
      };

      if (!testsByStory.has(usNum)) {
        testsByStory.set(usNum, []);
      }
      testsByStory.get(usNum).push(test);
      totalTests += 1;
    }

    const featureStories = stories.map((story) => {
      const ref = storyRef(feature.num, story.num);
      totalStories += 1;
      return {
        ref,
        name: `${storyId(feature.num, story.num)}: ${story.title}`,
        description: storyDescription(story, feature, ref),
        tests: testsByStory.get(story.num) ?? [],
      };
    });

    features.push({
      num: feature.num,
      epic: {
        ref: epicReference,
        name: feature.epic,
        description: `Epic for ${feature.file}. Spec-driven backlog.`,
        specLink: feature.file,
      },
      stories: featureStories,
    });
  }

  return {
    project,
    features,
    totals: {
      epics: features.length,
      stories: totalStories,
      tests: totalTests,
    },
  };
}
