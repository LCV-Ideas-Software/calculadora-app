import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT_INVENTORY = "THIRDPARTY.md";
const PUBLIC_INVENTORY = "public/legal/THIRDPARTY.md";
const TABLE_HEADER = [
  "Componente",
  "Escopo",
  "Licença declarada no lockfile",
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
      modified: cells[3],
      origin: cells[4],
    });
  }
  return records;
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
  assert.deepEqual(actual, expected, "THIRDPARTY does not match direct dependency metadata");
}

async function main() {
  const root = process.cwd();
  const [packageJson, packageLock, rootInventory, publicInventory] = await Promise.all([
    readFile(resolve(root, "package.json"), "utf8").then(JSON.parse),
    readFile(resolve(root, "package-lock.json"), "utf8").then(JSON.parse),
    readFile(resolve(root, ROOT_INVENTORY), "utf8"),
    readFile(resolve(root, PUBLIC_INVENTORY), "utf8"),
  ]);

  verifyThirdPartyInventory({ packageJson, packageLock, rootInventory, publicInventory });
  console.log("THIRDPARTY inventory matches all direct dependencies.");
}

const entryPoint = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : undefined;
if (entryPoint === import.meta.url) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
