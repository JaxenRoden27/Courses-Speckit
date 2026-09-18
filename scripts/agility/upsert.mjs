import { findAssetByRefOrName, listAssetsWhere, listChildAssets } from "./rest-helpers.mjs";

function buildStoryCreatePayload(scopeRef, epicOid, story) {
  return {
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
  };
}

function buildTestCreatePayload(scopeRef, storyOid, test) {
  return {
    Scope: scopeRef,
    AssetType: "Test",
    Name: test.name,
    Description: test.description,
    ExpectedResults: test.expectedResults,
    Reference: test.ref,
    Parent: storyOid,
  };
}

function emptyUpsertPlan() {
  return {
    storiesToCreate: [],
    storiesToUpdate: [],
    testsToCreate: [],
    testsToUpdate: [],
    payloads: [],
  };
}

/**
 * Build create/update payloads for a feature's stories and tests under an epic.
 * @param {object} feature from buildBacklog()
 * @param {string} scopeRef Scope OID
 * @param {string} epicOid Epic OID
 * @param {(path: string) => Promise<{ ok: boolean, status: number, text: string }>} restGet
 */
export async function buildFeatureUpsertPlan(feature, scopeRef, epicOid, restGet) {
  const plan = emptyUpsertPlan();
  const existingStories = await listAssetsWhere(restGet, "Story", `Super='${epicOid}'`);

  for (const story of feature.stories) {
    const existingStory = findAssetByRefOrName(existingStories, {
      ref: story.ref,
      name: story.name,
    });

    if (existingStory) {
      plan.storiesToUpdate.push({ oid: existingStory.oid, name: story.name, ref: story.ref });
      plan.payloads.push({
        from: existingStory.oid,
        update: { Description: story.description },
      });

      const existingTests = await listChildAssets(restGet, "Test", existingStory.oid);

      for (const test of story.tests) {
        const existingTest = findAssetByRefOrName(existingTests, {
          ref: test.ref,
          name: test.name,
        });

        if (existingTest) {
          plan.testsToUpdate.push({ oid: existingTest.oid, name: test.name, ref: test.ref });
          plan.payloads.push({
            from: existingTest.oid,
            update: {
              Description: test.description,
              ExpectedResults: test.expectedResults,
            },
          });
        } else {
          plan.testsToCreate.push({ storyOid: existingStory.oid, name: test.name, ref: test.ref });
          plan.payloads.push(buildTestCreatePayload(scopeRef, existingStory.oid, test));
        }
      }
    } else {
      plan.storiesToCreate.push({ name: story.name, ref: story.ref });
      plan.payloads.push(buildStoryCreatePayload(scopeRef, epicOid, story));
    }
  }

  return plan;
}

export function formatUpsertPlanSummary(plan) {
  return {
    storiesCreate: plan.storiesToCreate.length,
    storiesUpdate: plan.storiesToUpdate.length,
    testsCreate: plan.testsToCreate.length,
    testsUpdate: plan.testsToUpdate.length,
    operations: plan.payloads.length,
  };
}

export function printUpsertPlan(feature, plan) {
  const summary = formatUpsertPlanSummary(plan);
  console.log(`Feature ${feature.num} — ${feature.epic.name}`);
  console.log(
    `  Plan: ${summary.storiesCreate} story create, ${summary.storiesUpdate} story update, ` +
      `${summary.testsCreate} test create, ${summary.testsUpdate} test update ` +
      `(${summary.operations} API operation(s))`,
  );
  console.log("");

  if (plan.storiesToCreate.length > 0) {
    console.log("  Stories to create:");
    for (const story of plan.storiesToCreate) {
      console.log(`    + ${story.ref} — ${story.name}`);
    }
    console.log("");
  }

  if (plan.storiesToUpdate.length > 0) {
    console.log("  Stories to update (Description):");
    for (const story of plan.storiesToUpdate) {
      console.log(`    ~ ${story.ref} — ${story.name} (${story.oid})`);
    }
    console.log("");
  }

  if (plan.testsToCreate.length > 0) {
    console.log("  Tests to create:");
    for (const test of plan.testsToCreate) {
      console.log(`    + ${test.ref} — ${test.name}`);
    }
    console.log("");
  }

  if (plan.testsToUpdate.length > 0) {
    console.log("  Tests to update (Description, ExpectedResults):");
    for (const test of plan.testsToUpdate) {
      console.log(`    ~ ${test.ref} — ${test.name} (${test.oid})`);
    }
    console.log("");
  }

  console.log("  Payload preview:");
  console.log(JSON.stringify(plan.payloads, null, 2));
}
