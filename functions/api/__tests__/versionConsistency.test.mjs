import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readProjectFile = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), "utf8");

const internalVersionMarkerFromPackageVersion = (version) => {
  const segments = version.split(".");
  if (
    segments.length !== 3 ||
    segments.some((segment) => !/^\d+$/u.test(segment))
  ) {
    throw new TypeError(`Invalid package version: ${version}`);
  }
  return `v${segments.map((segment) => segment.padStart(2, "0")).join(".")}`;
};

describe("internal application version consistency", () => {
  it("mantém APP_VERSION, README e SECURITY alinhados com package.json", async () => {
    const [packageText, readme, securityPolicy, appVersionSource] =
      await Promise.all([
        readProjectFile("../../../package.json"),
        readProjectFile("../../../README.md"),
        readProjectFile("../../../SECURITY.md"),
        readProjectFile("../../../src/services/formatting.ts"),
      ]);
    const packageVersion = JSON.parse(packageText).version;
    const versionMarker =
      internalVersionMarkerFromPackageVersion(packageVersion);

    expect(appVersionSource).toContain(
      `const APP_VERSION = 'APP ${versionMarker}';`,
    );
    expect(readme).toContain(
      `Current application version: **${versionMarker}**`,
    );
    expect(securityPolicy).toContain(
      `Current supported application version: ${versionMarker}.`,
    );
  });
});
