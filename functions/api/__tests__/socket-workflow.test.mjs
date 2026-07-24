import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const workflow = readFileSync(
    new URL('../../../.github/workflows/socket.yml', import.meta.url),
    'utf8',
);

const scanSteps = workflow
    .split('      - name: Run Socket Security Scan (audit)')
    .slice(1);

it('sends bounded and correctly typed commit metadata in both Socket scans', () => {
    expect(scanSteps).toHaveLength(2);

    for (const scanStep of scanSteps) {
        expect(scanStep).toContain(
            'SOCKET_SCAN_COMMIT_SHA: ${{ github.sha }}',
        );
        expect(scanStep).toContain(
            'SOCKET_SCAN_COMMIT_MESSAGE="$(git show -s --format=%s "$SOCKET_SCAN_COMMIT_SHA")"',
        );
        expect(scanStep).toContain(
            '--commit-sha "$SOCKET_SCAN_COMMIT_SHA"',
        );
        expect(scanStep).toContain(
            '--commit-message="$SOCKET_SCAN_COMMIT_MESSAGE"',
        );
    }
});
