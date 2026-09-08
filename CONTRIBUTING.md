# Contributing to calculadora-app

Thanks for your interest. Quick guide for filing issues and opening pull requests.

---

## Before you start

1. **Read the [README](./README.md)** — it covers what the app does, the architecture, and how to deploy your own fork.
2. **Read [SECURITY.md](./SECURITY.md)** — for security reports, do NOT open a public issue.
3. **Check existing issues** before opening a new one.

---

## Filing issues

- **Bug reports**: include steps to reproduce, the URL/route hit, the expected vs actual behavior, and (if applicable) browser console / network errors.
- **Feature requests**: explain the use case and why it doesn't fit a downstream fork.
- **Documentation gaps**: open an issue or a PR directly.

---

## Opening a pull request

### Local gates

```bash
npm ci
npm run biome   # biome check
npm run build   # tsc + vite build
npm test        # vitest
```

All three must be GREEN. CI repeats them on pull requests to `main`; Deploy
repeats them before publishing a push to `main` or an authorized manual run.
The separate Public Format and custom legal-inventory gates are retired by the
current governance standard. Preserve the native Vite license report and review
legal-document parity when changing the dependency inventory or legal surface.

### PR description

Include what changed, why, how you tested. Public surface changes (UI, API response shape, D1 schema) need careful review.

### Action pinning

This repo enforces SHA-pinned GitHub Actions per supply-chain hardening baseline. Don't downgrade pinned actions to floating tags. Dependabot opens version-bump PRs with new SHAs + tag comments.

---

## License

The project license remains [AGPL-3.0-or-later](./LICENSE). Read
[INBOUND.md](./INBOUND.md) for the ownership and written-rights verification
required before copyrightable contributions are admitted. Opening a PR does not
transfer copyright. AGPL §13 applies to network-service operators of modified
forks under its terms.

---

## Code of Conduct

By participating, you agree to follow [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) (Contributor Covenant 3.0). General support: `chamados@lcv.dev`. Code of Conduct violations: `conductcode@lcv.dev`.

---

## Maintainer

Single maintainer: [@example-beneficiary](https://github.com/example-beneficiary). Response time best-effort.
