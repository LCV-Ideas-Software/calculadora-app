import { expect, test } from "vitest";

import {
  verifyBundledLicenseArtifact,
  verifyThirdPartyInventory,
} from "./verify-thirdparty.mjs";

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
  "| `alpha` | runtime | MIT | MIT | Não | https://www.npmjs.com/package/alpha |",
  "| `beta` | desenvolvimento | Apache-2.0 | Apache-2.0 | Não | https://www.npmjs.com/package/beta |",
]) {
  return `# Third-Party Components

| Componente | Escopo | Licença declarada no lockfile | Licença aplicada | Modificado? | Origem |
|------------|--------|--------------------------------|-------------------|-------------|--------|
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
  const row = "| `alpha` | runtime | MIT | MIT | Não | https://www.npmjs.com/package/alpha |";
  expect(() => verify({ rootInventory: inventory([row, row]) })).toThrow(/duplicate/u);
});

test("rejects license drift", () => {
  const changed = inventory().replace("| `alpha` | runtime | MIT |", "| `alpha` | runtime | ISC |");
  expect(() => verify({ rootInventory: changed })).toThrow(/does not match/u);
});

test("rejects an invalid election for an OR license", () => {
  const orPackageLock = {
    packages: {
      ...packageLock.packages,
      "node_modules/alpha": { version: "1.0.0", license: "MIT OR Apache-2.0" },
    },
  };
  const changed = inventory().replace(
    "| `alpha` | runtime | MIT | MIT |",
    "| `alpha` | runtime | MIT OR Apache-2.0 | GPL-3.0-only |",
  );
  expect(() => verify({ packageLock: orPackageLock, rootInventory: changed })).toThrow(
    /not an allowed election/u,
  );
});

test("rejects divergence between root and public copies", () => {
  expect(() => verify({ publicInventory: `${inventory()}\n` })).toThrow(
    /must be byte-identical/u,
  );
});

const apacheText = "Apache License 2.0 — complete elected text";
const mitText = "MIT License — complete text";
const bundledPackageLock = {
  packages: {
    "node_modules/dompurify": {
      version: "3.4.14",
      license: "(MPL-2.0 OR Apache-2.0)",
    },
    "node_modules/react": { version: "19.2.8", license: "MIT" },
    "node_modules/react-dom": { version: "19.2.8", license: "MIT" },
    "node_modules/scheduler": { version: "0.27.0", license: "MIT" },
  },
};
const bundledInventory = inventory([
  "| `dompurify` | runtime | (MPL-2.0 OR Apache-2.0) | Apache-2.0 | Não | https://www.npmjs.com/package/dompurify |",
]);
const bundledNotices = [
  {
    name: "dompurify",
    version: "3.4.14",
    identifier: "(MPL-2.0 OR Apache-2.0)",
    text: apacheText,
  },
  { name: "react", version: "19.2.8", identifier: "MIT", text: mitText },
  { name: "react-dom", version: "19.2.8", identifier: "MIT", text: mitText },
  { name: "scheduler", version: "0.27.0", identifier: "MIT", text: mitText },
];
const banner = "/* Third-party notices: /legal/THIRD-PARTY-NOTICES.json */";

function verifyArtifact(overrides = {}) {
  verifyBundledLicenseArtifact({
    packageLock: overrides.packageLock ?? bundledPackageLock,
    rootInventory: overrides.rootInventory ?? bundledInventory,
    bundledNotices: JSON.stringify(overrides.notices ?? bundledNotices),
    javascriptAssets: overrides.javascriptAssets ?? [
      { fileName: "assets/index.js", content: `${banner}\napplication code` },
    ],
    electedLicenseTexts: overrides.electedLicenseTexts ?? {
      "dompurify:Apache-2.0": apacheText,
    },
  });
}

test("accepts the complete Vite license artifact", () => {
  expect(() => verifyArtifact()).not.toThrow();
});

test("rejects a bundled version absent from the lockfile", () => {
  const notices = bundledNotices.map((notice) =>
    notice.name === "react" ? { ...notice, version: "0.0.0" } : notice,
  );
  expect(() => verifyArtifact({ notices })).toThrow(/does not match package-lock.json/u);
});

test("rejects an empty bundled license text", () => {
  const notices = bundledNotices.map((notice) =>
    notice.name === "react" ? { ...notice, text: "" } : notice,
  );
  expect(() => verifyArtifact({ notices })).toThrow(/empty license text/u);
});

test("rejects a bundle report that omits DOMPurify", () => {
  expect(() =>
    verifyArtifact({ notices: bundledNotices.filter(({ name }) => name !== "dompurify") }),
  ).toThrow(/missing DOMPurify/u);
});

test("rejects a JavaScript asset without the notice banner", () => {
  expect(() =>
    verifyArtifact({
      javascriptAssets: [
        {
          fileName: "assets/index.js",
          content: `fetch("/legal/THIRD-PARTY-NOTICES.json")`,
        },
      ],
    }),
  ).toThrow(/does not start with the exact/u);
});

test("rejects text that differs from the elected DOMPurify license", () => {
  expect(() =>
    verifyArtifact({ electedLicenseTexts: { "dompurify:Apache-2.0": "different" } }),
  ).toThrow(/does not match the elected/u);
});
