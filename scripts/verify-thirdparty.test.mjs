import { expect, test } from "vitest";

import { verifyThirdPartyInventory } from "./verify-thirdparty.mjs";

const packageJson = {
  dependencies: { alpha: "^1.0.0" },
  devDependencies: { beta: "^2.0.0" },
};

const packageLock = {
  packages: {
    "node_modules/alpha": { version: "1.0.0", license: "MIT" },
    "node_modules/beta": { version: "2.0.0", license: "Apache-2.0" },
  },
};

function inventory(rows = [
  "| `alpha` | runtime | MIT | Não | https://www.npmjs.com/package/alpha |",
  "| `beta` | desenvolvimento | Apache-2.0 | Não | https://www.npmjs.com/package/beta |",
]) {
  return `# Third-Party Components

| Componente | Escopo | Licença declarada no lockfile | Modificado? | Origem |
|------------|--------|--------------------------------|-------------|--------|
${rows.join("\n")}
`;
}

function verify(overrides = {}) {
  const rootInventory = overrides.rootInventory ?? inventory();
  verifyThirdPartyInventory({
    packageJson: overrides.packageJson ?? packageJson,
    packageLock: overrides.packageLock ?? packageLock,
    rootInventory,
    publicInventory: overrides.publicInventory ?? rootInventory,
  });
}

test("accepts complete byte-identical direct-dependency inventories", () => {
  expect(() => verify()).not.toThrow();
});

test("does not couple inventory validity to dependency versions", () => {
  expect(() =>
    verify({
      packageLock: {
        packages: {
          ...packageLock.packages,
          "node_modules/alpha": { version: "1.9.9", license: "MIT" },
        },
      },
    }),
  ).not.toThrow();
});

test("rejects a missing direct dependency", () => {
  expect(() =>
    verify({ rootInventory: inventory([inventory().split("\n")[4]]) }),
  ).toThrow(/does not match direct dependency metadata/u);
});

test("rejects duplicate components", () => {
  const row = "| `alpha` | runtime | MIT | Não | https://www.npmjs.com/package/alpha |";
  expect(() => verify({ rootInventory: inventory([row, row]) })).toThrow(/duplicate/u);
});

test("rejects license drift", () => {
  const changed = inventory().replace("| `alpha` | runtime | MIT |", "| `alpha` | runtime | ISC |");
  expect(() => verify({ rootInventory: changed })).toThrow(/does not match/u);
});

test("rejects divergence between root and public copies", () => {
  expect(() => verify({ publicInventory: `${inventory()}\n` })).toThrow(
    /must be byte-identical/u,
  );
});
