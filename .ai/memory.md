## 2026-04-17 — Calculadora-App v04.01.12 (wrangler observability + traces)
### Escopo
Padronização do baseline de observabilidade Cloudflare na `calculadora-app`.
### Alterado
- `wrangler.json` agora garante `observability.logs.enabled = true`, `observability.logs.invocation_logs = true` e `observability.traces.enabled = true`.
### Motivação
- Alinhar o app ao padrão operacional do workspace para logs de invocação e traces.
### Versão
- APP v04.01.11 → APP v04.01.12
## 2026-04-10 — Biome 2.x + patches (v04.01.10)
- Biome 2.x adicionado (lint + format com organizeImports)
- vite 8.0.7 → 8.0.8, vitest 4.1.2 → 4.1.4
- Dependabot groups: @vitest/* e @biomejs/* adicionados

# AI Memory Log - Calculadora-App

## 2026-04-17 — Calculadora-App v04.01.11 (hardening de APIs públicas + qualidade verde)
### Escopo
Fechamento da auditoria defensiva de 2026-04-17 no `calculadora-app`, endurecendo as APIs públicas sensíveis, reduzindo risco de XSS/abuso e restaurando o gate completo de qualidade do projeto.
### Alterado
- **`functions/api/calcular.js`**: a simulação pública deixou de gravar parâmetros operacionais globais no D1 a partir de input arbitrário do visitante.
- **`functions/api/contato.js`, `enviar-email.js`, `oraculo.ts`, `oraculo-observabilidade.js`**: validação de origem, rate limiting e sanitização/escape de HTML sensível adicionados.
- **`src/services/oraculo.ts`**: renderização do relatório IA endurecida antes do `dangerouslySetInnerHTML`, preservando a experiência atual.
- **`public/_headers`**: baseline explícito de CSP/headers defensivos adicionado ao app público.
- **Qualidade**: frontend saneado o suficiente para voltar a passar `npm run lint`, `npm test` e `npm run build`.
### Motivação
- Responder à auditoria defensiva sem perder comportamento, visual nem ferramentas já operantes, reduzindo abuso público e retomando verificabilidade no CI local.
### Versão
- APP v04.01.10 → APP v04.01.11

## 2026-04-08 — GitHub Actions Purge & Dependabot Standardization
### Escopo
Auditoria completa de CI/CD para eliminação de "ghost runs" em toda a rede de repositórios do workspace, juntamente com a universalização da configuração do Dependabot ajustada às necessidades de empacotamento locais para mitigar tráfego e limites no API.

## 2026-04-04 - Oráculo Token Limits Optimization
### Scope
Remoção do teto impeditivo de resposta para Thinking Models nativos nas inferências do \oraculo.ts\.
### Resolved
- **Tokens Maximizados**: Limites de output ampliados para suportar grandes cargas de tokens gastos no engine v1beta (Gemini Flash). Subiu de 3/4K para 8192 max limit.

### Controle de versão
- calculadora-app: APP v04.01.06 -> APP v04.01.07


## 2026-04-03 — Cloudflare Paid Scale Integration
### Escopo
Migração arquitetural unificada para aproveitamento da infraestrutura Cloudflare Paid. Implementação de **Smart Placement** transversal para redução de latência via proximidade física com o banco de dados (BIGDATA_DB). Adoção da diretiva `usage_model: unbound` para mitigar o `Error 1102` (CPU limit excess). Embutimento global do proxy **Cloudflare AI Gateway** sobrepondo o SDK nativo (`@google/genai`) e habilitando Caching, Rate limiting Nativo e Observabilidade Unificada, mantendo operação híbrida com os LLMs da rede.

### Diretivas Respeitadas
- Conformidade 100% com `wrangler.json`.
- `tlsrpt-motor` e `cron-taxa-ipca` revalidados em infraestrutura moderna sem timeout.

## 2026-03-28 — Calculadora-App v04.01.00 — Post-Migration Stabilization (Email + Contact + Email Builder)
### Adicionado
- **Formulário de Contato**: endpoint `functions/api/contato.js` (Resend) + rate limiting `contato` (5 req / 30 min). Componente `ContactModal.tsx` com máscara BR. Botão "📩 Contato" no footer.
- **Análise IA no E-mail**: seção Oráculo incluída no template HTML quando disponível, com card estilizado gradiente roxo.
### Alterado
- **Email Builder Premium**: template HTML reconstruído espelhando nova frontend — cards por canal com gradientes individuais, badge ⭐ MELHOR, hero total 18px, summary pills, compliance footer, fundo com gradiente sutil.
### Corrigido
- **Email 400 Error**: campo `destinatario` → `emailDestino`, `relatorioTexto` restaurado, parsing de resposta corrigido.
### Controle de versão
- `calculadora-app`: APP v04.00.00 → APP v04.01.00

## 2026-03-28 — Calculadora-App v04.00.00 — Migração Arquitetural Completa (React 19 + TypeScript + Vite)
### Alterado (MAJOR)
- **Renomeação**: projeto renomeado de `itau-calculadora` para `calculadora-app` em `package.json`, `wrangler.json`, `deploy.yml`, Cloudflare Pages e GitHub.
- **Stack**: migrado de HTML monolítico (1.900 linhas) + JS vanilla para **React 19 + TypeScript 5.9 + Vite 8 + Tailwind CSS 4**.
- **Componentização**: `public/index.html` decomposto em 12 componentes React funcionais (`BackgroundCanvas`, `Toast`, `SimulationForm`, `ComparisonCard`, `ResultPanel`, `ParametersPanel`, `SensitivityPanel`, `BacktestPanel`, `ActionButtons`, `OracleSection`, `EmailModal`, `ScrollControls`).
- **Services**: lógica extraída em 6 serviços TypeScript tipados (`formatting`, `api`, `storage`, `oraculo`, `email`, `whatsapp`).
- **Hooks**: estado orquestrado via `useSimulation` e `useOraculo`.
- **CSS**: glassmorphism, field-box patterns e animações portados de inline `<style>` para `App.css` modular.
- **Formulário**: dropdown de moedas agora usa `Intl.DisplayNames` para 130+ moedas dinâmicas.
- **Build**: saída em `dist/` (Vite) — 228KB JS (71KB gzip), 47KB CSS (9KB gzip), 37 módulos, 251ms.
### Removido
- `public/index.html` (substituído por entry point Vite + React root), `public/js/oraculo-feature.js`, `public/js/email-feature.js`, `public/assets/tailwind.css`, Cloudflare Web Analytics beacon.
### Preservado
- `functions/api/` — todos os 9 endpoints backend permanecem vanilla JS. `schema.sql` e `admin/` inalterados.
### Controle de versão
- `calculadora-app`: APP v03.26.00 → APP v04.00.00

## 2026-03-26 — Astrólogo Admin v02.15.00 + Itaú Calculadora Admin v03.25.00 — UI/UX Redesign (tiptap.dev, Google Blue)

### Escopo
- **Ambos apps** receberam redesign completo seguindo design language do tiptap.dev.
- `astrologo-admin`: **Tailwind CSS removido** — todo CSS convertido para vanilla com classes semânticas (~700 linhas em `App.css`).
- `itau-calculadora-admin`: `styles.css` reescrito com design tokens tiptap.dev (~300 linhas).
- Paleta: cores anteriores → Google Blue `#1a73e8`. Background: warm gray `#f5f4f4`. Texto: `#0d0d0d`.
- Glassmorphism pesado removido → superfícies sólidas brancas com shadows `0 1px 3px`.
- Botões pill (100px radius). Cards 30px radius. Inputs 10px radius. Orbs sutis (opacity 0.20, blur 120px).
- `Inter` via Google Fonts adicionada a ambos `index.html`.
- Favicon admin SVG (gear+monitor) em Google Blue adicionado a ambos.
- Toast do itau-calculadora: cursor-following removido → bottom-right fixo.

### WCAG/eMAG
- focus-visible `#1a73e8`, skip-link, sr-only, prefers-reduced-motion.
- Form fields: `id`, `name`, `autoComplete` validados em todos os inputs de ambos apps.

### Controle de versão
- `astrologo-admin`: v02.14.01 → v02.15.00 → v02.15.01 (Notification.css fix) → v02.16.00 (scroll FABs).
- `itau-calculadora-admin`: v03.24.13 → v03.25.00 → v03.26.00 (scroll FABs).

### Qualidade
- `npm run build` ✅ astrologo-admin (659ms)
- **Hotfix v02.15.01**: `Notification.css` tinha class names errados — corrigido.
- **v02.16.00 + v03.26.00**: Botões flutuantes de rolagem (Voltar ao topo / Ir para o final) adicionados a ambos apps. Design tiptap.dev (branco, circular, hover Google Blue). Threshold 200px. Paridade com admin-app e mainsite-frontend.

## 2026-04-03 — Enforcing Canonical Domain Security & TypeScript Audit
### Escopo
Implementação de bloqueio em Edge para impedir a exposição pública de roteamentos sob o domínio interno `*.pages.dev`. Aplicado redirect mandatório (301) para os domínios canônicos definidos (`lcv.app.br` e suas ramificações) em todos os apps com exceção dos puramente internos, protegendo infraestrutura e performance SEO. Também foram resolvidos erros de compilação (`Unexpected any`) e typings TypeScript do motor do editor Post no `admin-app` referentes a integração Word Mammoth, bem como a injeção Cloudflare `PagesFunction` em `mainsite-frontend`.

### Controle de versão
- `admin-app`: APP v01.77.31 → APP v01.77.32
- `oraculo-financeiro`: APP v01.08.00 → APP v01.08.01
- `astrologo-app`: APP v02.17.02 → APP v02.17.03
- `mainsite-frontend`: APP v03.04.14 → APP v03.04.15
- `calculadora-app`: middleware deployment, versioning handled internally
- `apphub`: middleware deployment, versioning handled internally
- `adminapps`: middleware deployment, versioning handled internally

