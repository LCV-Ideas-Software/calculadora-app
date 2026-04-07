# Changelog — Calculadora App (ex-Itaú Calculadora)

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


