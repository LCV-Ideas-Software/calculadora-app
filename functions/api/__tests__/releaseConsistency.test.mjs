import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const readProjectFile = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

const releaseMarkerFromPackageVersion = (version) => {
  const segments = version.split('.');
  if (segments.length !== 3 || segments.some((segment) => !/^\d+$/u.test(segment))) {
    throw new TypeError(`Invalid package version: ${version}`);
  }
  return `v${segments.map((segment) => segment.padStart(2, '0')).join('.')}`;
};

describe('release marker consistency', () => {
  // O auto-release deriva a tag de APP_VERSION em src/services/formatting.ts
  // (VERSION_FILE no workflow). Quando essa constante fica para trás, a release
  // some: v04.03.00 e v04.03.01 foram publicadas sem tag porque APP_VERSION
  // continuava em v04.02.04. Este guard trava as quatro superfícies juntas.
  it('mantém APP_VERSION, README e SECURITY alinhados com package.json', async () => {
    const [packageText, readme, securityPolicy, appVersionSource] = await Promise.all([
      readProjectFile('../../../package.json'),
      readProjectFile('../../../README.md'),
      readProjectFile('../../../SECURITY.md'),
      readProjectFile('../../../src/services/formatting.ts'),
    ]);
    const packageVersion = JSON.parse(packageText).version;
    const releaseMarker = releaseMarkerFromPackageVersion(packageVersion);

    expect(appVersionSource).toContain(`const APP_VERSION = 'APP ${releaseMarker}';`);
    expect(readme).toContain(`Current release: **${releaseMarker}**`);
    expect(securityPolicy).toContain(`Latest supported release: ${releaseMarker}.`);
  });
});
