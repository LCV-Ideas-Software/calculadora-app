import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const workflow = readFileSync(
    new URL('../../../.github/workflows/socket.yml', import.meta.url),
    'utf8',
);

const scanSteps = workflow
    .split('      - name: Run Socket Security Scan (audit)')
    .slice(1);

it('bounds the commit message sent by both Socket Security scans', () => {
    expect(scanSteps).toHaveLength(2);

    for (const scanStep of scanSteps) {
        expect(scanStep).toContain(
            'SOCKET_SCAN_COMMIT_MESSAGE: ${{ github.sha }}',
        );
        expect(scanStep).toContain(
            '--commit-message "$SOCKET_SCAN_COMMIT_MESSAGE"',
        );
    }
});
