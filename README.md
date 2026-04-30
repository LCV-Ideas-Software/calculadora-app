<p align="center">
  <img src=".github/assets/lcv-ideas-software-logo.svg" alt="LCV Ideas &amp; Software" width="520" />
</p>

# calculadora-app

[![status: stable](https://img.shields.io/badge/status-stable-brightgreen.svg)](#status)
[![version](https://img.shields.io/github/v/release/LCV-Ideas-Software/calculadora-app.svg)](https://github.com/LCV-Ideas-Software/calculadora-app/releases)
[![runtime: Cloudflare Pages](https://img.shields.io/badge/runtime-Cloudflare%20Pages-orange.svg)](https://pages.cloudflare.com/)
[![framework: React 19 + Vite 8](https://img.shields.io/badge/framework-React%2019%20%2B%20Vite%208-61dafb.svg)](https://react.dev/)
[![license: AGPL-3.0-or-later](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](./LICENSE)

**Calculadora Financeira** — simulador comparativo de câmbio internacional com análise por IA. React 19 + Vite 8 sobre Cloudflare Pages com D1 backing store, integração Gemini para análises contextuais.

**Status.** Stable. Current release: **v04.01.16**. See [CHANGELOG.md](./CHANGELOG.md) for the release history and validation notes.

The version history at a glance:

| Release | Scope |
|---|---|
| **`v04.01.16`** | **README organizational standardization.** Adopted the shared repository README opening pattern, corrected public release and clone links to the organization, surfaced the top-level version-history table, and kept the GitHub Sponsors link on `lcv-leo` by explicit beneficiary decision. |
| **`v04.01.15`** | **Pages modernization.** Migrated fully to the current GitHub Pages artifact-deployment model and enabled idempotent Pages setup for fresh clones/forks. |
| **`v04.01.14`** | **First public release.** Completed the public flip, CodeQL remediation, rebrand cleanup, AGPL publication hygiene, and deployment hardening. |
| **`Security Publication Hardening`** | **Publication boundary tightening.** Hardened ignore rules and package contents before public distribution. |

## What it does

Simulador comparativo entre **Cartão de Crédito** e **Conta Global** para operações de câmbio (compra de moeda estrangeira) por pessoa física no Brasil. Calcula a melhor opção considerando:

- Taxa PTAX oficial (cache D1 + fallback live)
- Taxa Spot calibrada (mercado interbancário)
- IOF + spread por modalidade
- Impacto fiscal sobre rendimento

A análise gerada por IA (Gemini 2.5 Pro) explica o resultado em linguagem executiva, sem invenção de dados — só interpreta os números calculados pelos endpoints determinísticos.

Funcionalidades adicionais:
- **Backtest**: comparativo histórico Spot vs PTAX para validar precisão da calibragem.
- **Oráculo**: análise contextual via Gemini.
- **Parâmetros customizados**: operador pode ajustar IOF/spread/calibragem via D1.
- **Email**: envio do resultado para o usuário (opt-in).

## Architecture

```
Browser -> Cloudflare Pages (React build)
                |
                v
       client-side fetch to /api/*
                |
                v
   Cloudflare Pages Functions (functions/api/*)
                |                       |
                v                       v
            D1: BIGDATA_DB        External APIs:
            (rate limit,          - PTAX (BCB)
             parametros,          - Spot (AwesomeAPI)
             ptax cache,          - Gemini AI
             backtest,
             observabilidade)
```

## Deploy your own fork

You will need:
- A Cloudflare account with Pages + D1 enabled.
- The Cloudflare CLI [`wrangler`](https://developers.cloudflare.com/workers/wrangler/).
- Node.js 22+.
- (Optional) A Google AI Studio API key for Gemini integration.

### 1. Clone + install

```bash
git clone https://github.com/LCV-Ideas-Software/calculadora-app.git
cd calculadora-app
npm ci
```

### 2. Create your D1 database

```bash
npx wrangler d1 create bigdata_db
# wrangler outputs:
#   database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Take note of the `database_id` value — you need it for step 3 BEFORE any subsequent `wrangler d1 execute` command.

### 3. Wire the database_id into wrangler.json

Replace the placeholder `00000000-0000-0000-0000-000000000000`:

```jsonc
{
  "d1_databases": [
    {
      "binding": "BIGDATA_DB",
      "database_name": "bigdata_db",
      "database_id": "<your-d1-id-from-step-2>"
    }
  ]
}
```

### 4. Apply schema

The Pages Functions self-bootstrap their tables via `CREATE TABLE IF NOT EXISTS` on first hit. A clean D1 will populate the necessary tables on the first request that needs them. If you prefer explicit setup, the inline DDL is in `functions/api/_shared/security.js` and `functions/api/calcular.js`.

### 5. Configure secrets (optional, only if using Gemini analysis)

Set `GEMINI_API_KEY` as a Cloudflare Pages secret via the dashboard or `wrangler secret put GEMINI_API_KEY --env production`.

### 6. Build + deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name=calculadora-app
```

## CI deploy (this repo)

This repo's [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs `npm install → npm run build → wrangler pages deploy` on every push to `main`. Before the deploy step, a `jq` substitution swaps the placeholder `database_id` in `wrangler.json` from a `D1_DATABASE_ID` GitHub Actions secret — keeping the literal D1 ID out of the public source tree.

## Repository conventions

- **License**: [AGPL-3.0-or-later](./LICENSE). Network-service trigger applies — running a modified fork as a public service obligates you to publish modifications. See AGPL §13 source-offer below.
- **Security disclosure**: see [SECURITY.md](./SECURITY.md).
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md).
- **Sponsorship**: see the repo's `Sponsor` button or [GitHub Sponsors profile](https://github.com/sponsors/lcv-leo).
- **Action pinning**: all GitHub Actions are pinned by full SHA per supply-chain hardening baseline.
- **Code owners**: [.github/CODEOWNERS](./.github/CODEOWNERS).

## Compliance notice

This calculator is an independent simulation tool. It is NOT affiliated with, endorsed by, or integrated with any specific financial institution. The numbers generated are not official, do not constitute a credit offer or promise, and do not replace information issued by any bank. For real-world transactions and proposals, consult your bank or financial advisor exclusively through their official channels.

## License

Copyright (C) 2026 Leonardo Cardozo Vargas.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY. See the GNU Affero General Public License for more details. The full license text is at [LICENSE](./LICENSE).

### AGPL §13 source-offer (operators of public deployments)

If you operate a modified copy of this app as a publicly-accessible network service, AGPL-3.0 §13 obligates you to make the corresponding source code available to your remote users. Comply via:

- A "Source" link in the app's footer pointing to your fork's repository URL.
- A `GET /source` route in `functions/api/` returning your fork's URL as `text/plain`.

If you only deploy this app for your own infrastructure (no external users), §13 does not apply.
