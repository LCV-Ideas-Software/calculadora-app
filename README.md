<p align="center">
  <img src=".github/assets/lcv-ideas-software-logo.svg" alt="LCV Ideas &amp; Software" width="520" />
</p>

# calculadora-app

[![status: stable](https://img.shields.io/badge/status-stable-brightgreen.svg)](#status)
[![release](https://img.shields.io/github/v/release/LCV-Ideas-Software/calculadora-app?sort=semver)](https://github.com/LCV-Ideas-Software/calculadora-app/releases)
[![Deploy](https://github.com/LCV-Ideas-Software/calculadora-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/LCV-Ideas-Software/calculadora-app/actions/workflows/deploy.yml)
[![Pages](https://github.com/LCV-Ideas-Software/calculadora-app/actions/workflows/pages.yml/badge.svg)](https://github.com/LCV-Ideas-Software/calculadora-app/actions/workflows/pages.yml)
[![CodeQL](https://github.com/LCV-Ideas-Software/calculadora-app/actions/workflows/codeql.yml/badge.svg)](https://github.com/LCV-Ideas-Software/calculadora-app/actions/workflows/codeql.yml)
[![runtime: Cloudflare Pages](https://img.shields.io/badge/runtime-Cloudflare%20Pages-orange.svg)](https://pages.cloudflare.com/)
[![framework: React 19 + Vite 8](https://img.shields.io/badge/framework-React%2019%20%2B%20Vite%208-61dafb.svg)](https://react.dev/)
[![license: AGPL-3.0-or-later](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](./LICENSE)

**Calculadora Financeira** — simulador comparativo de câmbio internacional com análise por IA. React 19 + Vite 8 sobre Cloudflare Pages com D1 backing store, integração Gemini para análises contextuais.

**Status.** Stable. Current release: **v04.03.01**. See [CHANGELOG.md](./CHANGELOG.md) for the full release history.

The version history at a glance:

| Release                              | Scope                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`v04.03.01`**                      | **Production hotfix.** Fixes the workerd-only `Illegal invocation` error: the Vertex client invoked global fetch through an instance property, leaking the instance as `this`; the default now wraps fetch detached. Regression test simulates the this-sensitive production fetch (72/72). Also updates README secret setup to VERTEX_SA_KEY (review-bot P2).    |
| **`v04.03.00`**                      | **Vertex AI transport migration.** Oráculo IA now calls Vertex AI with service-account auth (WebCrypto RS256 JWT -> OAuth2, per-key token cache, single-flight), moving Gemini billing from AI Studio prepaid credits to standard postpaid Cloud billing; prompts, fallback chain, telemetry and the GEMINI_MODEL override unchanged.                             |
| **`v04.02.04`**                      | **Backtest threshold precedence fix.** Custom MAPE thresholds now follow D1 > finite payload > valid environment > default, preserving percentage-point scale; focused tests cover every tier and prove that a PTAX cache hit performs no external request. |
| **`v04.02.03`**                      | **Dependency security patch.** Resolves GHSA-j3f2-48v5-ccww / CVE-2026-59877 by moving the transitive `protobufjs` override used by `@google/genai` from 7.6.3 to 7.6.5. |
| **`v04.02.02`**                      | **Cross-review finding fixed.** AI telemetry (insert + LGPD prune of ai_usage_logs) now returns its Promise and is registered via context.waitUntil at both call sites (post-response execution guarantee); fallback-chain and telemetry tests added. Shipped under formal unanimous cross-review ALL READY (caller + 5 peers).  |
| **`v04.02.01`**                      | **Audit follow-ups.** LGPD 90-day retention on AI telemetry tables; Gemini default migrated to the official GA replacement ahead of the announced model shutdown (3.x-idiomatic config, env override kept); global-account educational note in the BRL-charge panel; canonical D1 indexes.  |
| **`v04.02.00`**                      | **Deep audit + DCC mode.** 118-agent audit with adversarial verification; new "cobrado em reais" (DCC) mode with reverse invoice diagnostics (3 scenarios: local acquiring / pure DCC / double conversion); display-scale and locale-parsing hotfixes; BCB CSV parser fix for exotic currencies; rate limiting + fetch timeouts + e-mail sanitizer hardening; first engine tests, dedicated CI workflow, D1 pruning and canonical schema.sql.  |
| **`v04.01.19`**                      | **4-gate quality directive compliance.** Added Biome gate and deploy workflow coverage; eslint remains deferred because this repository does not currently install eslint, so Biome serves as the active JS/TS lint and format gate for this release.                                                                           |
| **`v04.01.18`**                      | **Site sponsor card iteration.** `site/index.html` GitHub Sponsors iframe (caixa branca cross-origin) substituído por link card dark navy com ❤ pink + meta cyan + seta animada; card movido para DEPOIS dos botões (lcv.dev/sponsor primário, GitHub Sponsors alternativa). Companion ship Phase 3 (12 repos).                                                   |
| **`v04.01.17`**                      | **Site visual identity refresh.** `site/index.html` (GitHub Pages) reskinneada para a nova identidade dark-first navy/cyan da org LCV (`#050b18`/`#38bdf8`/`#34d399`, gradientes radiais, glow shadows, gradient text no h1). Coordinated Phase 2 companion ship (calculadora, oraculo, astrologo, admin, mainsite, maestro, mtasts). Sem mudança no app runtime. |
| **`v04.01.16`**                      | **README organizational standardization.** Adopted the shared repository README opening pattern, corrected public release and clone links to the organization, surfaced the top-level version-history table, and kept the GitHub Sponsors link on `example-beneficiary` by explicit beneficiary decision.                                                                     |
| **`v04.01.15`**                      | **Pages modernization.** Migrated fully to the current GitHub Pages artifact-deployment model and enabled idempotent Pages setup for fresh clones/forks.                                                                                                                                                                                                          |
| **`v04.01.14`**                      | **First public release.** Completed the public flip, CodeQL remediation, rebrand cleanup, AGPL publication hygiene, and deployment hardening.                                                                                                                                                                                                                     |
| **`Security Publication Hardening`** | **Publication boundary tightening.** Hardened ignore rules and package contents before public distribution.                                                                                                                                                                                                                                                       |

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
npx wrangler d1 create example_db
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
      "database_name": "example_db",
      "database_id": "<your-d1-id-from-step-2>",
    },
  ],
}
```

### 4. Apply schema

The Pages Functions self-bootstrap their tables via `CREATE TABLE IF NOT EXISTS` on first hit. A clean D1 will populate the necessary tables on the first request that needs them. If you prefer explicit setup, the inline DDL is in `functions/api/_shared/security.js` and `functions/api/calcular.js`.

### 5. Configure secrets (optional, only if using Gemini analysis)

Set `VERTEX_SA_KEY` as a Cloudflare Pages secret — the full JSON key of a GCP service account with the `roles/aiplatform.user` role — via the dashboard or `wrangler pages secret put VERTEX_SA_KEY --project-name <project>`. The Oráculo endpoint calls Vertex AI (Gemini Enterprise Agent Platform); optional plain-text vars `VERTEX_PROJECT` and `VERTEX_LOCATION` override the default GCP project and location (`global`).

### 6. Build + deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name=calculadora-app
```

## CI deploy (this repo)

This repo's [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs `npm install → npm run build → wrangler pages deploy` on every push to `main`. Before the deploy step, a `jq` substitution swaps the placeholder `database_id` in `wrangler.json` from a `D1_DATABASE_ID` GitHub Actions secret — keeping the literal D1 ID out of the public source tree.

## Repository conventions

- **License**: [AGPL-3.0-or-later](./LICENSE). Network-service trigger applies: running a modified fork as a public service obligates you to publish modifications.
- **Notices**: see [NOTICE](./NOTICE) and [THIRDPARTY](./THIRDPARTY.md).
- **Security disclosure**: see [SECURITY.md](./SECURITY.md).
- **Code of conduct**: see [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
- **Changelog**: [CHANGELOG.md](./CHANGELOG.md).
- **Contributing**: see [CONTRIBUTING.md](./CONTRIBUTING.md).
- **Sponsorship**: see the repo's `Sponsor` button or [central sponsor page](https://www.lcv.dev/sponsor).
- **Action pinning**: all GitHub Actions are pinned by full SHA per supply-chain hardening baseline.
- **Code owners**: [.github/CODEOWNERS](.github/CODEOWNERS).

## Links

- Site: [https://calculadora-app.lcv.dev](https://calculadora-app.lcv.dev)
- GitHub: [https://github.com/LCV-Ideas-Software/calculadora-app](https://github.com/LCV-Ideas-Software/calculadora-app)
- Sponsors: [https://github.com/sponsors/LCV-Ideas-Software](https://github.com/sponsors/LCV-Ideas-Software)

## License

AGPL-3.0-or-later. See [LICENSE](./LICENSE), [NOTICE](./NOTICE), and [THIRDPARTY](./THIRDPARTY.md).

---

<p align="center"><span style="font-size: 1.5em;"><strong>Copyright © 2026 LCV Ideas &amp; Software</strong></span><br><sub>LEONARDO CARDOZO VARGAS TECNOLOGIA DA INFORMACAO LTDA<br>Rua Pais Leme, 215 Conj 1713 - Pinheiros<br>São Paulo - SP - CEP 05424-150<br>CNPJ: 66.584.678/0001-77 - IM: 3039854</sub></p>
