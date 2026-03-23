# Changelog — Itaú Calculadora Admin
## [v03.24.13] — 2026-03-22
### Corrigido
- `public/index.html`: formulário de parâmetros com associação explícita `label for` e `aria-label` nos inputs, mantendo `id/name` únicos para conformidade de autofill
- `public/app.js`: campos dinâmicos do painel de rate limit com `label for` e `aria-label`, além de `id/name` únicos por rota para eliminar alertas de form field no console

## [v03.24.12] — 2026-03-22
### Corrigido
- `public/index.html`: adicionados atributos `name` e `autocomplete` nos campos do formulário de parâmetros para adequação de autofill e conformidade de form fields
- `public/app.js`: campos dinâmicos do painel de rate limit agora são renderizados com `id` e `name` únicos por rota (`enabled`, `max_requests`, `window_minutes`), eliminando alertas do console sobre inputs sem identificação

## [v03.24.11] — 2026-03-22
### Corrigido
- `public/app.js`: remoção de `return` prematuros na função `renderOverview()` que impediam renderização dos painéis de Telemetria e Histórico do Oráculo IA
- Painéis agora renderizam corretamente mesmo com dados vazios em outras seções

## [v03.24.10] — 2026-03-22
### Alterado
- `public/index.html`: adição de versão no footer do painel com sincronização a v03.24.10 (alinhado ao app principal)
- Versionamento centralizado para admin subproject seguindo o padrão `APP vXX.XX.XX`

## [v03.24.06] — 2026-03-22
### Alterado
- Ícones das notificações em tela migrados de emoji para SVG inline, alinhando o visual ao padrão do `mainsite`
- Refinamento visual do container de ícone do toast para consistência em sucesso, informação e erro

## [v03.24.05] — 2026-03-22
### Alterado
- Inclusão de notificações em tela (toast glassmorphism) para confirmar aplicação e salvamento de parâmetros
- Toasts com lógica de posicionamento inteligente por interação no viewport, seguindo o mesmo padrão de UX do `mainsite`

### Corrigido
- Feedback de erro/sucesso padronizado para ações de parâmetros e políticas de rate limit

## [v03.23.00] — 2026-03-22
### Alterado
- Implantado painel de controle de rate limit para **Síntese da IA** e **Envio de E-mail**, com ativação/desativação, limites por IP e janela em minutos
- Endpoints de IA (`/api/oraculo`) e de e-mail (`/api/enviar-email`) passam a respeitar políticas configuráveis no D1 por rota
- Admin passa a oferecer ação de **restaurar padrão** para cada política de rate limit

### Infra
- Novo módulo compartilhado `functions/api/_lib/rate-limit.mjs` para políticas/hits de rate limit
- Novo endpoint admin `GET/POST /api/admin/rate-limit` para leitura e atualização das políticas

## [v03.22.00] — 2026-03-22
### Alterado
- Painéis de **Telemetria da IA** e **Histórico de Análises** removidos do frontend público e movidos para o painel admin
- Frontend principal passa a enviar eventos de execução do Oráculo para backend (`/api/oraculo-observabilidade`) em vez de manter observabilidade apenas em `localStorage`
- Admin passa a exibir telemetria e histórico centralizados do Oráculo via `GET /api/admin/overview`

### Infra
- Novo endpoint `functions/api/oraculo-observabilidade.js` para persistência de observabilidade da IA no D1

## [v03.17.00] — 2026-03-22
### Alterado
- Criação do app administrativo separado em `admin/`, preparado para deploy exclusivo em subdomínio dedicado com Cloudflare Access
- Inclusão de workflow `.github/workflows/deploy-admin.yml` para deploy independente do admin via Wrangler
