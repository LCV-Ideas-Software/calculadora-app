import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT_INVENTORY = "THIRDPARTY.md";
const PUBLIC_INVENTORY = "public/legal/THIRDPARTY.md";
const BUNDLED_NOTICES = "dist/legal/THIRD-PARTY-NOTICES.json";
const BUNDLED_NOTICES_REFERENCE = "/legal/THIRD-PARTY-NOTICES.json";
const BUNDLED_NOTICES_BANNER = `/* Third-party notices: ${BUNDLED_NOTICES_REFERENCE} */`;
const TABLE_HEADER = [
  "Componente",
  "Escopo",
  "Licença declarada no lockfile",
  "Licença aplicada",
  "Modificado?",
  "Origem",
];

function normalizeCell(value) {
  return value.trim().replace(/^`|`$/gu, "");
}

function parseTable(markdown) {
  const lines = markdown.split(/\r?\n/u);
  const headerIndex = lines.findIndex((line) =>
    line.includes("| Componente | Escopo | Licença declarada no lockfile |"),
  );
  assert.notEqual(headerIndex, -1, "THIRDPARTY table header is missing");

  const header = lines[headerIndex]
    .split("|")
    .slice(1, -1)
    .map(normalizeCell);
  assert.deepEqual(header, TABLE_HEADER, "THIRDPARTY table header changed");

  const records = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.startsWith("|")) break;
    const cells = line.split("|").slice(1, -1).map(normalizeCell);
    assert.equal(cells.length, TABLE_HEADER.length, `invalid THIRDPARTY row: ${line}`);
    records.push({
      name: cells[0],
      scope: cells[1],
      license: cells[2],
      appliedLicense: cells[3],
      modified: cells[4],
      origin: cells[5],
    });
  }
  return records;
}

function allowedLicenseElections(expression) {
  const unwrapped = expression.replace(/^\((.*)\)$/u, "$1");
  return unwrapped.split(" OR ").map((license) => license.trim());
}

function expectedInventory(packageJson, packageLock) {
  const scopes = [
    ["dependencies", "runtime"],
    ["devDependencies", "desenvolvimento"],
  ];
  const expected = [];

  for (const [manifestKey, scope] of scopes) {
    for (const name of Object.keys(packageJson[manifestKey] ?? {})) {
      const lockEntry = packageLock.packages?.[`node_modules/${name}`];
      assert.ok(lockEntry, `${name} is missing from package-lock.json`);
      assert.equal(typeof lockEntry.license, "string", `${name} lacks lockfile license metadata`);
      assert.ok(lockEntry.license.trim(), `${name} has an empty lockfile license`);
      expected.push({
        name,
        scope,
        license: lockEntry.license,
        modified: "Não",
        origin: `https://www.npmjs.com/package/${name}`,
      });
    }
  }

  return expected.sort((left, right) => left.name.localeCompare(right.name, "en"));
}

export function verifyThirdPartyInventory({
  packageJson,
  packageLock,
  rootInventory,
  publicInventory,
}) {
  assert.equal(
    publicInventory,
    rootInventory,
    `${ROOT_INVENTORY} and ${PUBLIC_INVENTORY} must be byte-identical`,
  );

  const actual = parseTable(rootInventory);
  const names = actual.map(({ name }) => name);
  assert.equal(new Set(names).size, names.length, "THIRDPARTY contains duplicate components");

  const expected = expectedInventory(packageJson, packageLock);
  const actualMetadata = actual.map(({ appliedLicense: _appliedLicense, ...record }) => record);
  assert.deepEqual(
    actualMetadata,
    expected,
    "THIRDPARTY does not match direct dependency metadata",
  );

  for (const record of actual) {
    assert.ok(
      allowedLicenseElections(record.license).includes(record.appliedLicense),
      `${record.appliedLicense} is not an allowed election for ${record.name}: ${record.license}`,
    );
  }

  return actual;
}

function packageNameFromLockPath(packagePath) {
  const marker = "node_modules/";
  const markerIndex = packagePath.lastIndexOf(marker);
  if (markerIndex === -1) return undefined;

  const parts = packagePath.slice(markerIndex + marker.length).split("/");
  return parts[0]?.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

function lockfileLicenses(packageLock) {
  const records = new Map();
  for (const [packagePath, entry] of Object.entries(packageLock.packages ?? {})) {
    const name = packageNameFromLockPath(packagePath);
    if (!name || typeof entry.version !== "string" || typeof entry.license !== "string") {
      continue;
    }
    const key = `${name}@${entry.version}`;
    const identifiers = records.get(key) ?? new Set();
    identifiers.add(entry.license);
    records.set(key, identifiers);
  }
  return records;
}

function parseBundledNotices(serialized) {
  let notices;
  try {
    notices = JSON.parse(serialized);
  } catch (error) {
    assert.fail(`bundled notices are not valid JSON: ${error.message}`);
  }
  assert.ok(Array.isArray(notices), "bundled notices must be a JSON array");
  assert.ok(notices.length > 0, "bundled notices must not be empty");
  return notices;
}

export function verifyBundledLicenseArtifact({
  packageLock,
  rootInventory,
  bundledNotices,
  javascriptAssets,
  electedLicenseTexts,
}) {
  const inventory = parseTable(rootInventory);
  const notices = parseBundledNotices(bundledNotices);
  const lockedLicenses = lockfileLicenses(packageLock);
  const noticeKeys = new Set();

  for (const notice of notices) {
    assert.equal(typeof notice.name, "string", "bundled notice lacks a component name");
    assert.equal(typeof notice.version, "string", `${notice.name} lacks a bundled version`);
    assert.equal(typeof notice.identifier, "string", `${notice.name} lacks a license identifier`);
    assert.equal(typeof notice.text, "string", `${notice.name} lacks license text`);
    assert.ok(notice.text.trim(), `${notice.name} has empty license text`);

    const key = `${notice.name}@${notice.version}`;
    assert.ok(!noticeKeys.has(key), `bundled notices contain duplicate ${key}`);
    noticeKeys.add(key);
    assert.ok(
      lockedLicenses.get(key)?.has(notice.identifier),
      `${key} (${notice.identifier}) does not match package-lock.json`,
    );
  }

  assert.ok(javascriptAssets.length > 0, "production build emitted no JavaScript assets");
  for (const asset of javascriptAssets) {
    assert.ok(
      asset.content.startsWith(BUNDLED_NOTICES_BANNER),
      `${asset.fileName} does not start with the exact third-party notice banner`,
    );
  }

  const dompurifyInventory = inventory.find(({ name }) => name === "dompurify");
  assert.ok(dompurifyInventory, "THIRDPARTY lacks the DOMPurify license election");
  const electionKey = `dompurify:${dompurifyInventory.appliedLicense}`;
  const electedText = electedLicenseTexts[electionKey];
  assert.equal(
    typeof electedText,
    "string",
    `no installed license text mapped for ${electionKey}`,
  );
  const dompurifyNotice = notices.find(({ name }) => name === "dompurify");
  assert.ok(dompurifyNotice, "bundled notices are missing DOMPurify");
  assert.equal(
    dompurifyNotice.text.trim(),
    electedText.trim(),
    "DOMPurify bundled text does not match the elected license",
  );
}

async function collectJavaScriptAssets(directory, root = directory) {
  const assets = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      assets.push(...(await collectJavaScriptAssets(path, root)));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      assets.push({
        fileName: relative(root, path).replaceAll("\\", "/"),
        content: await readFile(path, "utf8"),
      });
    }
  }
  return assets;
}

async function main() {
  const root = process.cwd();
  const [packageJson, packageLock, rootInventory, publicInventory] = await Promise.all([
    readFile(resolve(root, "package.json"), "utf8").then(JSON.parse),
    readFile(resolve(root, "package-lock.json"), "utf8").then(JSON.parse),
    readFile(resolve(root, ROOT_INVENTORY), "utf8"),
    readFile(resolve(root, PUBLIC_INVENTORY), "utf8"),
  ]);

  const inventory = verifyThirdPartyInventory({
    packageJson,
    packageLock,
    rootInventory,
    publicInventory,
  });
  console.log("THIRDPARTY inventory matches all direct dependencies.");

  if (process.argv.includes("--artifact")) {
    const dompurify = inventory.find(({ name }) => name === "dompurify");
    const electedFile = {
      "Apache-2.0": "node_modules/dompurify/LICENSE",
      "MPL-2.0": "node_modules/dompurify/LICENSE-MPL",
    }[dompurify?.appliedLicense];
    assert.ok(electedFile, `unsupported DOMPurify election: ${dompurify?.appliedLicense}`);

    const [bundledNotices, javascriptAssets, electedLicenseText] = await Promise.all([
      readFile(resolve(root, BUNDLED_NOTICES), "utf8"),
      collectJavaScriptAssets(resolve(root, "dist")),
      readFile(resolve(root, electedFile), "utf8"),
    ]);
    verifyBundledLicenseArtifact({
      packageLock,
      rootInventory,
      bundledNotices,
      javascriptAssets,
      electedLicenseTexts: {
        [`dompurify:${dompurify.appliedLicense}`]: electedLicenseText,
      },
    });
    console.log("Bundled Vite notices match package-lock.json and every JavaScript asset.");
  }
}

const entryPoint = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : undefined;
if (entryPoint === import.meta.url) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
