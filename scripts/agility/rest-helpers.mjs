/**
 * Parse Agility REST XML asset list responses and query assets by parent link.
 */

function extractAttributeValue(block, attrName) {
  const attributePattern = new RegExp(
    `<Attribute[^>]*\\bname=["']${attrName}["'][^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</Attribute>`,
    "i",
  );
  const attributeMatch = block.match(attributePattern);
  if (attributeMatch) {
    return attributeMatch[1].trim();
  }

  const tagPattern = new RegExp(`<${attrName}>([^<]*)</${attrName}>`, "i");
  const tagMatch = block.match(tagPattern);
  return tagMatch?.[1]?.trim() ?? "";
}

/**
 * @param {string} xmlText REST XML response body
 * @param {string} assetType e.g. "Story", "Test", "Epic"
 * @returns {{ oid: string, name: string, reference: string }[]}
 */
export function parseRestAssetList(xmlText, assetType) {
  const assets = [];
  const assetPattern = /<Asset\b([^>]*)>([\s\S]*?)<\/Asset>/gi;
  let match;

  while ((match = assetPattern.exec(xmlText)) !== null) {
    const attrs = match[1];
    const body = match[2];
    const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
    if (!idMatch) {
      continue;
    }

    const oid = idMatch[1];
    if (!oid.startsWith(`${assetType}:`)) {
      continue;
    }

    assets.push({
      oid,
      name: extractAttributeValue(body, "Name"),
      reference: extractAttributeValue(body, "Reference"),
    });
  }

  return assets;
}

/**
 * @param {{ oid: string, name: string, reference: string }[]} assets
 * @param {{ ref?: string, name: string }} target
 */
export function findAssetByRefOrName(assets, { ref, name }) {
  if (ref) {
    const byRef = assets.find((asset) => asset.reference === ref);
    if (byRef) {
      return byRef;
    }
  }

  const matches = assets.filter((asset) => asset.name === name);
  if (matches.length > 1) {
    console.warn(
      `Warning: ${matches.length} assets named "${name}" — using ${matches[0].oid}. Set Reference on assets for reliable upsert.`,
    );
  }

  return matches[0] ?? null;
}

/**
 * @param {(path: string) => Promise<{ ok: boolean, status: number, text: string }>} restGet
 * @param {string} assetType
 * @param {string} where
 */
export async function listAssetsWhere(restGet, assetType, where) {
  const { ok, status, text } = await restGet(
    `/rest-1.v1/Data/${assetType}?sel=Name,Reference&where=${encodeURIComponent(where)}&page=1,0`,
  );

  if (!ok) {
    throw new Error(`${assetType} query failed (${status}): ${text.slice(0, 400)}`);
  }

  return parseRestAssetList(text, assetType);
}

/**
 * List child assets linked via Parent or Super (Agility varies by asset type).
 * @param {(path: string) => Promise<{ ok: boolean, status: number, text: string }>} restGet
 * @param {string} assetType
 * @param {string} parentOid
 */
export async function listChildAssets(restGet, assetType, parentOid) {
  const parentClause = `Parent='${parentOid}'`;
  const parentAssets = await listAssetsWhere(restGet, assetType, parentClause);
  if (parentAssets.length > 0) {
    return parentAssets;
  }

  return listAssetsWhere(restGet, assetType, `Super='${parentOid}'`);
}
