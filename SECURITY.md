# Security Policy

## Supported status

Current supported application version: v04.03.04. The current main branch is also supported for security fixes until the next application version is deployed.

## Automation and credentials

CI checks pull requests to `main`; Deploy repeats the application checks before
publishing to Cloudflare Pages. CodeQL uses Default Setup. Dependency Review,
Zizmor and Scorecard are official repository-local actions, not central services
controlled by another LCV repository.

Dependabot's native auto-merge workflow uses the organization-provided
`DEPENDABOT_AUTOMERGE_TOKEN` Dependabot secret. The shared credential is an
explicitly accepted organizational baseline; no new custom GitHub App or
controller is introduced. Native required checks must be in place before the
reform is admitted, so a dependency update cannot skip the product CI gate.

Deployment credentials remain scoped to `cloudflare-production`
(`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`). Linear's official Release action
reads `LINEAR_ACCESS_KEY` from `linear-release` only after a successful
push-triggered Deploy from this repository's `main`, at the exact deployed SHA.
GitHub Pages uses its native deployment identity. No credential values belong in
source control; nonsecret configuration identifiers are permitted.

## Reporting a vulnerability

Please do not open a public issue for suspected vulnerabilities, credential leaks, private data exposure, authentication bypasses, payment-flow issues, supply-chain issues, or deployment misconfiguration.

Report privately by email:

- security@lcv.dev

If GitHub private vulnerability reporting is enabled for this repository, that channel is also acceptable.

Please include:

- affected repository, component, route, package, workflow, or public surface;
- affected application version, commit SHA, or deployment URL when known;
- impact and exploitability;
- reproduction steps or a safe proof of concept, if available;
- whether any credential, personal data, payment data, private editorial material, or operational secret may be involved.

## Scope

In scope: application code, Workers/Pages functions, GitHub Actions, dependency and supply-chain configuration, repository publication boundaries, security documentation, and public service configuration documented in this repository.

Out of scope: social engineering, physical attacks, denial-of-service testing without prior written authorization, spam, automated noisy scanning, and reports that rely only on outdated browser or dependency versions without a concrete vulnerable path in this repository.

## Dependency updates

Dependabot checks all configured ecosystems every day, including weekends, at
05:00 (UTC-03:00), using the native `cron` schedule and `Etc/GMT+3`. GitHub may
start the jobs later when its update queue is busy. Version updates retain the
seven-day cooldown and existing groups; official `actions/*` and `github/*`
updates are excluded from that cooldown.

Security updates run independently of this schedule and cooldown. Each configured
ecosystem and directory has its own security group, separate from version updates.
A failing update can delay its security group; diagnose the failure before
adjusting the native group configuration or recreating a pull request. Any
configured version ignores also constrain security fixes, so review them when
upstream compatibility changes. Native auto-merge remains subject to every required check.

See the [Dependabot options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)
and [security update documentation](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configure-security-updates).

## Coordinated disclosure

LCV Ideas & Software will triage reports privately, request clarification when needed, and coordinate remediation before public disclosure. Public disclosure should wait until a fix or mitigation is available, unless there is an immediate user-safety reason to do otherwise.
