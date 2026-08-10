# Changelog — Calculadora Financeira

## [Unreleased]

### Added

- Governanca de trabalho sobre GitHub Projects, Issues e Discussions: quadro dedicado do
  repositorio, formularios de issue para Incident, Maintenance e Spike, atalhos para
  Discussions no seletor de issues, workflow `add-to-project` (inerte ate a organizacao
  definir `LCV_PROJECTS_APP_CLIENT_ID`) e o ritual de registro G1..G4 documentado para
  Claude Code e ChatGPT-Codex.


## [Unreleased]

## [v04.03.03] - 2026-08-10

### Corrigido

- **A entrada da v04.03.02 apontava o guard para o caminho errado.** O texto
  citava `src/services/releaseConsistency.test.ts`, que foi a primeira
  tentativa; o teste acabou em `functions/api/__tests__/` porque o
  `tsconfig.app.json` compila `src` sem os tipos de node e a versão `.ts`
  quebrava o build com `TS2591`. Notas de release que apontam para um arquivo
  inexistente valem menos que nenhuma nota, então o caminho foi corrigido na
  entrada da v04.03.02 — e esta entrada registra a correção, para que a
  alteração de um texto já publicado não fique silenciosa. Achado do Copilot no
  PR #170.

## [v04.03.02] - 2026-08-10

### Corrigido

- **`APP_VERSION` e `SECURITY.md` estavam dois lançamentos atrás, e isso engoliu
  duas releases.** O `auto-release.yml` deriva a tag de `APP_VERSION` em
  `src/services/formatting.ts` (`VERSION_FILE`); como a constante ficou em
  `v04.02.04`, a v04.03.00 (migração Vertex) e a v04.03.01 (hotfix do
  `Illegal invocation`) foram publicadas **sem tag e sem release** — a última
  release do repositório era a v04.02.04, de 03/08 — e a interface mostrava
  `APP v04.02.04` rodando código v04.03.01. As quatro superfícies voltam a
  concordar; esta é a primeira release marcada que contém o transporte Vertex.

### Testes

- Novo `functions/api/__tests__/releaseConsistency.test.mjs`: deriva o marcador de
  release do `package.json` e trava `APP_VERSION`, o alvo do `README.md` e o do
  `SECURITY.md` no mesmo valor. É o guard que faltava para o drift não voltar a
  passar em silêncio — o `astrologo-app` já tinha o equivalente. (Caminho
  corrigido na v04.03.03; esta entrada citava a primeira tentativa em `src/`.)

## [v04.03.01] - 2026-08-08

**Hotfix — corrige `Illegal invocation` do fetch no runtime de produção do workerd e atualiza as instruções de setup do secret.**

### Corrigido

- O client Vertex invocava o `fetch` global através de `this.fetchImpl`, vazando a instância como `this` — o workerd de produção rejeita com `TypeError: Illegal invocation` (o dev local tolera, por isso só se manifestou pós-deploy). O default agora encapsula o fetch em um wrapper que o invoca desacoplado. Diagnóstico confirmado pelos logs de produção do deployment (7 warns idênticos, countTokens + 3 candidatos × 2 tentativas).
- README passo 5: instrução de secret atualizada de `GEMINI_API_KEY` para `VERTEX_SA_KEY` (JSON de service account com `roles/aiplatform.user`), documentando os overrides opcionais `VERTEX_PROJECT`/`VERTEX_LOCATION` (finding P2 do bot de review no PR #163).

### Testes

- Novo teste de regressão simula a sensibilidade a `this` do fetch de produção (fake global que lança `Illegal invocation` quando invocado com `this` não-global): RED reproduziu o erro exato de produção, GREEN com o fix. Suíte total: 72/72.

## [v04.03.00] - 2026-08-08

**Minor — migra o transporte do Oráculo IA do endpoint AI Studio (API key) para o Vertex AI (Gemini Enterprise Agent Platform) com autenticação de service account.**

### Alterado

- O endpoint `/api/oraculo` passa a chamar `aiplatform.googleapis.com` (projeto `lcv-ideas-and-software`, location `global`; overrides via `VERTEX_PROJECT`/`VERTEX_LOCATION`) autenticando com service account (`VERTEX_SA_KEY`) via JWT RS256 assinado com WebCrypto e trocado por access token OAuth2. Com isso o consumo Gemini deixa o plano pré-pago do AI Studio e passa a faturar no pós-pago padrão do Cloud Billing. Prompts, cadeia de fallbacks, telemetria e contrato de resposta permanecem intactos.

### Adicionado

- Novo módulo `functions/api/_shared/vertex.ts`: client mínimo que espelha a superfície usada do SDK (`models.generateContent`/`models.countTokens`), com cache de access token por identidade de chave, single-flight para mints concorrentes e erros diagnósticos (status HTTP + trecho do corpo + causa OAuth).

### Removido

- Dependência `@google/genai`, órfã após a migração do transporte, e o override transitivo de `protobufjs` que existia exclusivamente pela cadeia dela. O override de `undici` permanece intocado (config pré-existente sem rationale documentado).

### Testes

- 17 testes novos do client Vertex — claims e assinatura do JWT verificada criptograficamente com a chave pública, mapeamento SDK→REST, URL global/regional, cache/expiração com margem, single-flight, isolamento por identidade de chave e caminhos de erro diagnósticos — e 3 novos do handler (construção do client, overrides de env, secret ausente). Suíte total: 71/71.

## [v04.02.04] - 2026-08-03

**Patch — corrige a precedência dos limiares MAPE customizados e resolve os findings de qualidade do motor de cálculo.**

### Corrigido

- Os limiares `backtest_mape_boa_percent` e `backtest_mape_atencao_percent` recebidos no payload deixam de ser ignorados e passam a seguir a precedência documentada: D1 > payload finito > variável de ambiente válida > default.
- Os limiares MAPE permanecem expressos em pontos percentuais (por exemplo, `1.25` significa 1,25%), sem a divisão por 100 aplicável às taxas fracionárias de spread e IOF.
- Simplificam-se duas guardas comprovadamente redundantes pelo fluxo de controle: um acerto no cache PTAX já sai do laço antes do fallback de rede, e o resultado do motor Cartão já está materializado antes da contingência da Conta Global.

### Testes

- A suíte do endpoint cobre todos os níveis de precedência, payload e ambiente não finitos, defaults e a escala percentual sem conversão.
- Um spy explícito comprova que o acerto no cache D1 não realiza chamadas externas.

## [v04.02.03] - 2026-07-21

**Patch de segurança — corrige negação de serviço transitiva em `protobufjs`.**

### Segurança

- Atualiza o override transitivo de `protobufjs` de `7.6.3` para `7.6.5`, corrigindo a possibilidade de loop infinito ao analisar opções malformadas em arquivos `.proto` (GHSA-j3f2-48v5-ccww / CVE-2026-59877) usada pela cadeia `@google/genai`.
- Mantém o escopo mínimo da correção: nenhuma API da aplicação ou dependência direta foi alterada; o lockfile remove apenas o submódulo que deixou de fazer parte de `protobufjs` no patch corrigido.

## [v04.02.02] - 2026-07-12

**Patch — finding do cross-review atendido: telemetria de IA com garantia pós-resposta.** Gate cumprido integralmente: cross-review **ALL READY unânime formal** (caller + 5 peers: codex, gemini, deepseek, grok, perplexity; outcome `converged | unanimous_ready`, sessão `4ed963d4`), cobrindo retroativamente o escopo de v04.02.01 + este patch.

### Corrigido

- **`logAiUsage` agora retorna a Promise do insert+prune e os dois call sites a registram em `context.waitUntil`** (senão `await`) — a retenção LGPD de `ai_usage_logs` deixa de ser best-effort órfã e ganha garantia de execução pós-resposta (finding do peer codex no round 1 do retro-review; mesmo padrão do prune de `calc_oraculo_observabilidade`). TDD com RED observado (`oraculo-model.test.mjs`).

### Adicionado

- Teste de fallback do Oráculo: força a rejeição do candidato `advanced` (mock rejeita config com `thinkingConfig`) e prova que o `compat` serve a resposta sem falha dura.
- Teste de telemetria: valida que INSERT e DELETE de `ai_usage_logs` executam dentro das Promises registradas no `waitUntil`.

## [v04.02.01] - 2026-07-11

**Patch — follow-ups da auditoria: retenção LGPD, migração Gemini e nota de conta global.** Cross-review dispensado nesta release por diretiva expressa do operador (gate suspenso até novo aviso; bloqueio técnico do servidor de review documentado na memória do workspace).

### Adicionado

- **Retenção LGPD (90 dias)** nas tabelas de telemetria: `calc_oraculo_observabilidade` (grava `valor_original` + preview de análise — dados pessoais) e `ai_usage_logs`, com prune fora do caminho de resposta (`context.waitUntil`) e coberto por testes (`retencao-lgpd.test.mjs`).
- Nota educativa no painel "compra cobrada em reais" sobre cartões de conta global (conversão reversa saldo→BRL pelo provedor, sem novo IOF) — fecha o ponto em aberto da auditoria sem lógica especulativa.

### Alterado

- **Modelo Gemini default: `gemini-2.5-flash` → `gemini-3.5-flash`.** O modelo anterior tem shutdown anunciado para 16/10/2026 (ai.google.dev/gemini-api/docs/deprecations); o novo é o substituto oficial GA. Candidato `advanced` migrado para o idioma 3.x (sem `temperature`/`topP`, `thinkingLevel: 'low'` no lugar de `thinkingBudgetTokens`); candidatos `compat`/`minimal` preservados como fallback runtime; override via env `GEMINI_MODEL` mantido. Testes com mock do SDK validam default e override (`oraculo-model.test.mjs`).

### Infra (fora do repositório, executado no D1 compartilhado)

- Índices canônicos `idx_calc_backtest_created_at` e `idx_calc_rate_limit_hits_lookup` criados; equivalentes legados `idx_itau_*` dessas duas tabelas removidos. Verificado em produção: `calc_ptax_cache` já possuía a PK composta exigida pelo upsert.

## [v04.02.00] - 2026-07-11

**Minor — auditoria profunda (118 agentes) + modo "compra internacional cobrada em reais" (DCC).** Auditoria multi-agente com verificação adversarial (84 achados confirmados) e pesquisa fiscal com fontes primárias (IOF 3,5% cartão+global confirmado vigente jul/2026 — Decreto 12.499/2025 restabelecido pelo STF). As 4 recomendações prioritárias aplicadas com TDD. Cross-review dispensado nesta release por diretiva expressa do operador (exceção one-time).

### Adicionado

- **Modo "compra cobrada em reais" (DCC)**: toggle no formulário + `functions/api/compra-reais.mjs` (módulo puro, 9 testes) + `CompraReaisPanel.tsx`. Modela os 3 cenários de compra internacional em BRL — adquirência local/MoR (sem IOF/spread), DCC pura (só IOF 3,5% sobre o valor em reais, base: Decreto 6.306/2007 art. 15-B, VII) e dupla conversão (spread do emissor × IOF) — com **diagnóstico reverso**: informando o valor da fatura, calcula o markup implícito e classifica o cenário provável. Inclui aviso educativo anti-DCC.
- `functions/api/__tests__/calcular.test.mjs` — primeiro teste do motor principal (stub D1 reutilizável em `__tests__/helpers/d1-stub.mjs`; valida cadeia base→spread→IOF→total→VET, origin 403, payload 400 e modo reais).
- `.github/workflows/ci.yml` — biome + build + vitest em pull_request/push (testes agora bloqueiam merge); `deploy.yml` ganhou passo `npm test` antes do build.
- `schema.sql` reconciliado como schema canônico não-destrutivo das 7 tabelas reais (`calc_*` + `ai_usage_logs`), incluindo a PK composta de `calc_ptax_cache` exigida pelo upsert `INSERT OR REPLACE` e índices de lookup.

### Corrigido

- **`pct()` exibia spread/IOF 100× menores** ("0,06%" em vez de "5,50%"): agora converte fração→percentual; caller `mape_7d_percent` (já em escala percentual) ajustado no `BacktestPanel`.
- **`parseLocalizedNumber` multiplicava por 10–100× entradas com ponto decimal** ("5.5"→55): agora detecta o último separador como decimal, aceitando "1.234,56", "1,234.56", "5.5" e "1,5".
- **Parser CSV de fechamento do Bacen lia a coluna errada** (`columns[2]`=Tipo A/B em vez de `columns[3]`=sigla): moedas fora da lista Olinda (MXN, ARS, CLP, COP…) nunca obtinham cotação. Extraído para `cotacao-csv.mjs` com teste sobre o layout real.

### Segurança

- `/api/calcular` e `/api/backtest` agora exigem Origin permitida e rate limit (30 req/10min por IP); `/api/backtest` não é mais endpoint público sem proteção.
- Todos os fetches externos (BCB Olinda, CSV BCB, AwesomeAPI, Yahoo) com timeout de 4s via `AbortSignal` (`fetch-timeout.mjs`) — upstream lento não prende mais o worker.
- `/api/enviar-email`: sanitizador não permite mais `<a>`/`<img>` (remove vetor de phishing/beacon com remetente verificado); relatório continua com formatação completa (texto+tabelas).
- `/api/calcular` não vaza mais `error.message` interno ao cliente e passou a emitir os security headers compartilhados.

### Infra

- Prune oportunístico do D1 via `context.waitUntil` (fora do caminho de resposta): spot-por-minuto de dias anteriores, backtest >30 dias e hits de rate-limit fora da janela — tabelas param de crescer sem limite no `bigdata_db` compartilhado.

## [v04.01.19] - 2026-05-15

**Patch — 4-gate quality directive compliance (eslint + biome + prettier + cross-review).** Workspace directive 2026-05-15: every code change must pass eslint + biome + prettier + cross-review before Commit & Sync / tag / release / deploy / publish. (Note: calculadora-app does not have eslint installed; biome serves both lint and format roles for JS/TS. eslint addition is deferred to a future ship.)

### Adicionado

- `npm run biome` (biome check . — uses biome.json scope) + `npm run biome:write` (biome check --write . — auto-fix).
- `deploy.yml` workflow runs `npm run biome` after `npm ci` and before `npm run build`.

### Configurado

- `biome.json` schema URL `2.4.11` → `2.4.14`.
- `biome.json` `files.includes` scopes biome to `src/` + `functions/`; excludes `dist/`, `build/`, `.wrangler/`, `node_modules/`, `coverage/`, CSS.
- Rule overrides para padrões legítimos React+Tailwind: `suspicious.{noArrayIndexKey,noImplicitAnyLet}`, `correctness.useExhaustiveDependencies`, `style.noNonNullAssertion`, `a11y.{useKeyWithClickEvents,useButtonType,noStaticElementInteractions,useAriaPropsSupportedByRole}`, `security.noDangerouslySetInnerHtml` — all off.

### Alterado

- 3 source files reformatted by `biome check --write .` (cosmetic only).

## [v04.01.18] - 2026-05-09
### Alterado
- **`site/index.html`** — iframe `github.com/sponsors/.../card` (caixa branca cross-origin) substituído por link card dark navy com ❤ pink + meta cyan + seta animada; card movido para DEPOIS dos botões (lcv.dev/sponsor primário, GitHub Sponsors alternativa). Companion ship Phase 3 (12 repos).

## [v04.01.17] - 2026-05-09
### Alterado
- **`site/index.html`** — `<style>` block reskinneado pra nova identidade visual dark-first navy/cyan da org LCV (paleta `#050b18`/`#38bdf8`/`#34d399`, gradientes radiais, glow shadows, gradient text no h1). Coordinated companion ship Phase 2 com `oraculo-financeiro` v01.10.04, `astrologo-app` v02.17.23, `admin-app` v02.01.01, `mainsite-app` v03.23.01/v02.19.01, `maestro-app` v0.5.17, `mtasts-motor` v02.00.10. Companion à Phase 1 (cross-review-v1 1.12.9, cross-review-v2 v02.18.07, deepseek-cli 0.3.1, grok-cli 1.6.2, sponsor-motor APP v01.02.02, `.github-org/site`). Sem mudança no app runtime; apenas a página GitHub Pages.
- Entrada [Unreleased] anterior (remoção do widget SumUp em `site/index.html`) consolidada aqui — o widget já havia sido removido em ships anteriores.

## [v04.01.16] - 2026-04-30
### Alterado
- `README.md` passou a seguir o novo padrão organizacional de abertura: logo harmonizado, bloco curto de status, tabela `The version history at a glance`, links públicos de release/clone corrigidos para `LCV-Ideas-Software/calculadora-app` e manutenção explícita do GitHub Sponsors em `example-beneficiary`.

## [v4.1.15] - 2026-04-26
### Alterado
- **`.github/workflows/pages.yml`** — `actions/configure-pages@v6.0.0` passou a declarar `with: enablement: true` para idempotência em forks/clones que ainda não tenham GitHub Pages habilitado (corrige `Get Pages site failed... HTTP 404` em primeiro run).
- **CI/Pages modernization** — workflows migraram de `gh-pages` legacy branch para o padrão atual (artifact deployment via `configure-pages` + `upload-pages-artifact` + `deploy-pages`, todos SHA-pinned).
### Validação
- Trilateral cross-review session `08bc6b9a-f3f5-434d-8276-2b21f562a843` (caller + Codex + Gemini) **READY**: paridade confirmada nos 9 repos públicos do workspace em security baseline, repo features, workflow perms, branch rulesets, Pages deployment, CodeQL Default Setup, 0 alertas abertos.

## [v4.1.14] - 2026-04-25 — first public release
### Segurança
- **CodeQL `js/incomplete-multi-character-sanitization` + `js/bad-tag-filter` + `js/incomplete-url-scheme-check`** (5 alertas high-severity em `functions/api/enviar-email.js`): substituída a sanitização baseada em regex por `sanitize-html` (allowlist parser-based, htmlparser2). Allowlist: tags HTML email-safe + atributos style/class + schemes http/https/mailto (img permite data:). 0 alertas abertos pós-fix.
### Rebrand (operator directive — risco jurídico)
- Removidas TODAS referências a "Itaú" e "Personnalité" em UI, email, system instructions Gemini, response labels, hostname canônico, file headers, asset filenames. Logo Itaú substituído por SVG genérico de calculadora financeira em `#003366` / `#EC7000` / `#ffffff` (paleta preservada per operator).
- Hostname `calculadora-itau.lcv.app.br` → `calculadora.lcv.app.br`.
- Disclaimer compliance reescrito sem mencionar instituição financeira específica.
- API response label `'Spot Calibrado Itaú'` → `'Spot Calibrado (alt)'`.
### Phase 2 hardening (workspace baseline)
- License: AGPL-3.0-or-later. README com seção AGPL §13 source-offer.
- `package.json`: bump 4.0.1 → 4.1.14, +metadata (description, license, author, repository, homepage, bugs, engines.node>=22), removido `private: true`.
- `wrangler.json`: literal `database_id` redatado via placeholder + injeção jq no deploy.yml a partir de `D1_DATABASE_ID` secret.
- Branch ruleset: `deletion` + `non_fast_forward` + `required_status_checks=deploy` + `code_scanning Any/Any`.
- Workflow permissions: `read` default, allowed_actions `selected`, SHA pinning required.
- README rewrite: 5-entry badges (status / version / runtime / framework / license), Fork & Deploy guide, AGPL §13 source-offer.
- Community files: `CODE_OF_CONDUCT.md` + `CONTRIBUTING.md` + `.github/CODEOWNERS`.
- gh-pages branch + Pages live em https://example-beneficiary.github.io/calculadora-app/ + FUNDING.yml self-URL.
- History scrub via `git-filter-repo` (literal D1 ID gone from blobs + commit messages).
- Operator-deferred (separate step): D1 table prefix `itau_*` rename → ALTER TABLE + tightly-coupled deploy (~30s downtime).
### Validação
- `npm run lint` + `npm run build`: GREEN.
- CI deploy GREEN no HEAD `4feea9b`.
- Cross-review session `fda3ee33` aceita o playbook (Codex + Gemini READY pós-remediation).

## [Publication Hygiene Followup] - 2026-04-23
### Segurança
- `database_id.txt` removido do índice Git via `git rm --cached` e adicionado ao `.gitignore` e ao `.npmignore`. Arquivo preservado no disco local. O ID do binding D1 já vivia em `wrangler.json` (fonte única autoritativa); a cópia solta no root era redundante e entrava no `npm pack` sem agregar valor.
### Validação
- `git ls-files | grep database_id` não retorna entradas.
- `npm pack --dry-run --json --ignore-scripts` não incluiu `database_id.txt`.

## [Security Publication Hardening] - 2026-04-23
### Segurança
- Memórias e contexto de agentes passaram a ser locais apenas: `.ai/`, `.aiexclude`, `.copilotignore` e `.github/copilot-instructions.md` foram adicionados ao ignore e removidos do índice Git com `git rm --cached`, preservando os arquivos no disco local.
- Regras de publicação foram endurecidas para impedir envio de `.env*`, `.dev.vars*`, `.wrangler/`, `.tmp/`, logs, bancos locais e artefatos de teste para GitHub/npm.
### Validação
- `git ls-files` confirmou ausência de memórias/artefatos locais rastreados; `npm pack --dry-run --json --ignore-scripts` não incluiu arquivos proibidos.

## [v04.01.14] - 2026-04-20
### Corrigido
- Vulnerabilidade crítica `CVE-2026-41242` (GHSA-xq3m-2v4x-88gg) em `protobufjs < 7.5.5` — arbitrary code execution via campos `type` manipulados em definições protobuf. Resolvida via `overrides` no `package.json` pinando `protobufjs` em `7.5.5`. Dependência transitiva puxada por `@google/genai@1.49.0`.
### Motivação
- Fechar alerta Dependabot #6 do repositório `example-beneficiary/calculadora-app` sem aguardar bump upstream do `@google/genai`.

## [v04.01.13] - 2026-04-17
### Corrigido
- `wrangler.json` deixou de declarar `observability` por ser config de Cloudflare Pages; os logs do GitHub Actions confirmaram a incompatibilidade com `wrangler 4.83.0`.
### Motivação
- Restaurar o deploy da `calculadora-app` sem reintroduzir configuração inválida para Pages.

## [v04.01.12] - 2026-04-17
### Alterado
- `wrangler.json` passou a declarar explicitamente `observability.logs.enabled = true`, `observability.logs.invocation_logs = true` e `observability.traces.enabled = true`.
### Motivação
- Alinhar o baseline de telemetria Cloudflare da `calculadora-app` ao padrão operacional do workspace.

## [v04.01.11] - 2026-04-17
### Alterado
- **Persistência operacional protegida**: `functions/api/calcular.js` deixou de aceitar sobrescrita pública de parâmetros compartilhados e passou a isolar a simulação do visitante sem gravar ajustes globais no D1.
- **Superfícies públicas endurecidas**: `contato`, `enviar-email`, `oraculo` e `oraculo-observabilidade` ganharam validação de origem, rate limiting e sanitização/escape dos payloads HTML sensíveis.
- **Oráculo com renderização mais segura**: o pipeline de `src/services/oraculo.ts` foi ajustado para reduzir risco de XSS antes do `dangerouslySetInnerHTML`, preservando o layout e o comportamento atuais do relatório.
- **Baseline público de headers**: `public/_headers` foi introduzido para explicitar CSP/headers defensivos do app público.
- **Qualidade de engenharia recuperada**: `lint`, `test` e `build` voltaram a ficar verdes, incluindo conversão das suítes Node legadas para `vitest` e correções de tipagem/acessibilidade no frontend.
### Motivação
- **Origem da rodada**: fechamento da auditoria defensiva de 2026-04-17, com foco em impedir mutação pública de parâmetros, reduzir a superfície de abuso e restaurar o gate de qualidade do app.

## [v04.01.10] - 2026-04-10
### Adicionado
- **Biome 2.x**: lint + format com organizeImports

### Alterado
- **vite**: 8.0.7 → 8.0.8
- **vitest**: 4.1.2 → 4.1.4
- **Dependabot groups**: @vitest/*e @biomejs/* adicionados

## [v04.01.09] - 2026-04-07
### Segurança
- **Vite 8.0.3 → 8.0.7**: Correção de 3 CVEs de severidade alta/média.

### Controle de versão
- `calculadora-app`: APP v04.01.08 → APP v04.01.09

## [v04.01.08] - 2026-04-06
### Adicionado
- **Cross-Service AI Telemetry**: Implementação de `logAiUsage` em `oraculo.ts` para registro de tokens, latência e status no `ai_usage_logs` (D1).
### Alterado
- **Compatibility Date**: `wrangler.json` atualizado para `2026-04-06`.
### Controle de versão
- `calculadora-app`: APP v04.01.07 → APP v04.01.08

## [v04.01.06] - 2026-04-04
### Resolvido
- **Infraestrutura IA**: Extinguida vulnerabilidade nativa 500 nas invocações do oraculo.ts estipulando 'gemini-2.5-flash' como fallback model.
- **Segurança Cognitiva**: Incorporada flag mandatória HARM_CATEGORY_CIVIC_INTEGRITY nos payloads garantindo aprovação total nas requisições.

## [v04.01.05] - 2026-04-02
### Alterado
- **Controle de Rate Limit**: erradicada toda lógica manual de rate-limit via banco de dados e headers HTTP dentro dos endpoints (como `oraculo.ts`, `contato.js`, `enviar-email.js`). O módulo local de checagem também foi deletado, transferindo integralmente a governança para a camada WAF de borda da Cloudflare, simplificando o código e reduzindo latência.

### Controle de versão
- `calculadora-app`: APP v04.01.04 → APP v04.01.05

## [v04.01.06] - 2026-04-04
### Resolvido
- **Infraestrutura IA**: Extinguida vulnerabilidade nativa 500 nas invocações do oraculo.ts estipulando 'gemini-2.5-flash' como fallback model.
- **Segurança Cognitiva**: Incorporada flag mandatória HARM_CATEGORY_CIVIC_INTEGRITY nos payloads garantindo aprovação total nas requisições.

## [v04.01.04] - 2026-03-31
### Corrigido
- **Compliance - docs legais locais em runtime**: o `LicencasModule` passou a carregar `LICENSE`, `NOTICE` e `THIRDPARTY` a partir de `public/legal/*` via `BASE_URL`, eliminando dependência de `raw.githubusercontent.com` no browser e removendo os 404 recorrentes em produção.

### Controle de versão
- `calculadora-app`: APP v04.01.03 → APP v04.01.04

## [v04.01.06] - 2026-04-04
### Resolvido
- **Infraestrutura IA**: Extinguida vulnerabilidade nativa 500 nas invocações do oraculo.ts estipulando 'gemini-2.5-flash' como fallback model.
- **Segurança Cognitiva**: Incorporada flag mandatória HARM_CATEGORY_CIVIC_INTEGRITY nos payloads garantindo aprovação total nas requisições.

## [v04.01.03] - 2026-03-31
### Corrigido
- **Compliance - GNU AGPLv3**: corrigido erro 404 no conteúdo descarregado do arquivo LICENSE, publicando o texto integral e atualizado da licença (~34KB) em conformidade técnica e jurídica.

### Controle de versão
- `calculadora-app`: APP v04.01.02   APP v04.01.03

## [v04.01.02] — 2026-03-31
### Alterado
- **Fluxo indireto `preview` padronizado**: branch operacional `preview` adotado no repositório para promoções consistentes para `main`.
- **Automação de promoção**: workflow `.github/workflows/preview-auto-pr.yml` adicionado/atualizado para abrir/reusar PR `preview -> main`, habilitar auto-merge e tentar merge imediato quando elegível.
- **Permissões do GitHub Actions**: ajuste para permitir criação/aprovação de PR por workflow, eliminando falhas 403 operacionais.

### Controle de versão
- `calculadora-app`: APP v04.01.01 → APP v04.01.02

## [v04.01.01] — 2026-03-29
### Alterado
- **CI/CD branch standardization**: workflow de deploy padronizado para publicar no branch `main` na Cloudflare Pages, com trigger GitHub em `main` e `concurrency.group` atualizado para `deploy-main`.

### Controle de versão
- `calculadora-app`: APP v04.01.00 → APP v04.01.01

## [v04.01.00] — 2026-03-28
### Adicionado
- **Formulário de Contato**: novo endpoint `functions/api/contato.js` com envio via Resend e rate limiting configurável (`contato` route, 5 req / 30 min). Componente `ContactModal.tsx` com máscara de telefone brasileiro e feedback via toast. Botão "📩 Contato" adicionado ao footer.
- **Análise IA no E-mail**: o email de relatório agora inclui a seção da Análise Inteligente (Oráculo) quando disponível, dentro de card estilizado com gradiente roxo.

### Alterado
- **Email Builder — Redesign Premium**: template HTML do email completamente reconstruído para espelhar a estética da nova frontend — cards por canal com gradientes individuais (azul/roxo/verde), badge ⭐ MELHOR no winner, hero total 18px, badges de Plantão/Contingência, summary pills com separadores, compliance footer e fundo com gradiente sutil.

### Corrigido
- **Email 400 Error**: campo `destinatario` corrigido para `emailDestino` (nome esperado pelo backend). Campo `relatorioTexto` restaurado. Parsing de resposta corrigido de `erro`/`mensagem` para `error`/`message`.

## [v04.00.00] — 2026-03-28
### Alterado (MAJOR — Migração Arquitetural Completa)
- **Renomeação**: projeto renomeado de `itau-calculadora` para `calculadora-app` em `package.json`, `wrangler.json` e `deploy.yml`. Cloudflare Pages e GitHub também atualizados.
- **Stack**: migrado de HTML monolítico + JS vanilla para **React 19 + TypeScript 5.9 + Vite 8 + Tailwind CSS 4**.
- **Componentização**: `public/index.html` (1.900 linhas) decomposto em 12 componentes React funcionais (`BackgroundCanvas`, `Toast`, `SimulationForm`, `ComparisonCard`, `ResultPanel`, `ParametersPanel`, `SensitivityPanel`, `BacktestPanel`, `ActionButtons`, `OracleSection`, `EmailModal`, `ScrollControls`).
- **Services**: lógica extraída em 6 serviços TypeScript tipados (`formatting`, `api`, `storage`, `oraculo`, `email`, `whatsapp`).
- **Hooks**: estado orquestrado via `useSimulation` e `useOraculo` com separação clara de responsabilidades.
- **CSS**: glassmorphism, field-box patterns e animações portados de inline `<style>` para `App.css` modular.
- **Formulário**: dropdown de moedas agora usa `Intl.DisplayNames` para 130+ moedas dinâmicas, substituindo lista hardcoded.
- **Build**: saída agora em `dist/` (Vite) — 228KB JS (71KB gzip), 47KB CSS (9KB gzip), 37 módulos, 251ms.

### Removido
- `public/index.html` — substituído por entry point Vite + React root
- `public/js/oraculo-feature.js` — migrado para `src/services/oraculo.ts`
- `public/js/email-feature.js` — migrado para `src/services/email.ts`
- `public/assets/tailwind.css` — substituído por `@tailwindcss/vite` plugin
- Cloudflare Web Analytics beacon — removido por decisão do usuário

### Preservado (sem alterações)
- `functions/api/` — todos os 9 endpoints backend permanecem vanilla JS
- `schema.sql` — schema D1
- `admin/` — sub-app admin inalterado

## [v03.24.13] — 2026-03-24
### Adicionado
- `public/index.html`: inclusão de aviso de compliance no rodapé do frontend, replicando o mesmo texto já presente no template de e-mail (`email-feature.js`). Posicionado no final do container principal com separador visual sutil.

## [v03.24.12] — 2026-03-22
### Alterado
- `public/index.html`: adição de botões flutuantes de rolagem **Voltar ao Topo** e **Ir para o Final** no frontend da calculadora
- Lógica de visibilidade e thresholds de scroll alinhados ao padrão do `mainsite-app/mainsite-frontend` (com rolagem suave em ambos os controles)

## [v03.24.11] — 2026-03-22
### Corrigido
- `public/js/oraculo-feature.js`: remoção de chamada a função indefinida `escaparAtributoHtml()` que impedia renderização correta dos tooltips
- CSS `::after` tooltip agora renderiza texto corretamente ao passar o mouse nos labels
- Remoção de conflito entre atributo `title` nativo HTML e tooltip customizado em CSS

## [v03.24.10] — 2026-03-22
### Alterado
- `public/js/oraculo-feature.js`: adição de campo `tooltip` em cada rótulo de bloco da IA com descrição contextual
- `public/index.html`: implementação de tooltip flutuante em hover nos labels do Oráculo usando CSS `::after`
- Sinalização visual de interatividade: cursor pointer, efeito de elevação (transform) e mudança de intensidade de cor no hover

## [v03.24.09] — 2026-03-22
### Alterado
- `public/js/oraculo-feature.js`: cada tipo de rótulo da análise IA passa a usar classe visual dedicada (`resumo`, `cenários`, `base matemática`, `análise técnica`, `recomendação`)
- `public/index.html`: aplicação de paleta distinta por label no bloco do Oráculo para melhorar leitura rápida e diferenciação semântica

## [v03.24.08] — 2026-03-22
### Alterado
- `public/js/oraculo-feature.js`: classificação dos blocos da análise de IA aprimorada para usar rótulos contextuais por conteúdo (ex.: resumo, cenários, análise técnica, recomendação)
- Rótulos deixam de cair sempre no padrão `Base Matemática` quando o texto não vem com cabeçalhos explícitos do modelo

## [v03.24.07] — 2026-03-23
### Corrigido
- Endpoint `functions/api/oraculo.js` reforçado com fallback progressivo de payload para a Gemini API quando houver `400/422` de validação do provedor
- Fluxo do Oráculo passa a tentar variações de compatibilidade antes de falhar, reduzindo indisponibilidade por mudanças de schema upstream
- Mensagem de erro para `400` no frontend agora indica rejeição do provedor de IA de forma mais clara em português

## [v03.24.06] — 2026-03-22
### Alterado
- `itau-calculadora-admin`: ícones das notificações em tela migrados de emoji para SVG inline, alinhando o visual ao padrão do `mainsite`
- `itau-calculadora-admin`: refinamento visual do container de ícone do toast para consistência em sucesso, informação e erro

## [v03.24.05] — 2026-03-22
### Alterado
- `itau-calculadora-admin`: inclusão de notificações em tela (toast glassmorphism) para confirmar aplicação e salvamento de parâmetros
- `itau-calculadora-admin`: toasts com lógica de posicionamento inteligente por interação no viewport, seguindo o mesmo padrão de UX do `mainsite`

### Corrigido
- `itau-calculadora-admin`: feedback de erro/sucesso padronizado para ações de parâmetros e políticas de rate limit

## [v03.24.04] — 2026-03-22
### Corrigido
- Substituição dos rótulos residuais `N/A` por `N/D` em blocos visíveis ao usuário no frontend
- Consolidação final do fluxo do Oráculo sem textos em inglês para usuário final

## [v03.24.03] — 2026-03-22
### Corrigido
- Substituição de rótulos em inglês visíveis ao usuário final no fluxo do Oráculo por equivalentes em português do Brasil (histórico e telemetria)
- Mensagens de erro retornadas pela API do Oráculo para o frontend padronizadas em português, sem repassar texto técnico em inglês do upstream

## [v03.24.02] — 2026-03-22
### Alterado
- Inclusão de cooldown visual com contagem regressiva nos botões do Oráculo quando ocorrer `429` (rate limit)
- UI do Oráculo passa a respeitar metadados de retry (`retryAfterSeconds`) vindos do módulo de integração

### Corrigido
- Evita reativação prematura dos botões da IA enquanto o cooldown de rate limit está ativo

## [v03.24.01] — 2026-03-22
### Corrigido
- Tratamento robusto da resposta do endpoint `/api/oraculo` no frontend para evitar quebra com `Unexpected token '<'` quando a resposta não vier em JSON
- Mensagens de erro do Oráculo mais claras para usuário final em cenários de `429` (rate limit) e falhas HTTP não-JSON
- Endpoint `functions/api/oraculo.js` passa a preservar status upstream relevantes da Gemini API (incluindo `429`) em vez de normalizar tudo para `502`

## [v03.24.00] — 2026-03-22
### Alterado
- Modernização da integração do Oráculo IA para endpoint `v1` da Gemini API, priorizando estabilidade de produção
- Substituição do alias dinâmico de modelo por modelo explícito estável (`gemini-2.5-pro`), com suporte a override via variável de ambiente `GEMINI_MODEL`
- Padronização do payload REST para formato canônico em `camelCase` (`systemInstruction`)

## [v03.05.00] — Anterior
### Histórico
- Versão anterior à padronização do controle de versão
