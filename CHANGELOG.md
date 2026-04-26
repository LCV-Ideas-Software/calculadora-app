# Changelog — Calculadora Financeira

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
- gh-pages branch + Pages live em https://lcv-leo.github.io/calculadora-app/ + FUNDING.yml self-URL.
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
- Fechar alerta Dependabot #6 do repositório `lcv-leo/calculadora-app` sem aguardar bump upstream do `@google/genai`.

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
- **Dependabot groups**: @vitest/* e @biomejs/* adicionados

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
