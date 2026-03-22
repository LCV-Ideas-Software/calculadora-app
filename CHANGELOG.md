# Changelog — Itaú Calculadora

## [v03.23.00] — 2026-03-22
### Alterado
- Implantado no admin painel de controle de rate limit para **Síntese da IA** e **Envio de E-mail**, com ativação/desativação, limites por IP e janela em minutos
- Endpoint de IA (`/api/oraculo`) e endpoint de e-mail (`/api/enviar-email`) passam a respeitar políticas configuráveis no D1 por rota
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

## [v03.21.00] — 2026-03-22
### Infra
- `deploy-admin.yml` ajustado para modo **disabled** com gatilho impossível (`__disabled__`), garantindo somente um fluxo automático efetivo de deploy
- Deploy contínuo permanece centralizado em `.github/workflows/deploy.yml` (job único)

## [v03.20.00] — 2026-03-22
### Infra
- Workflow `deploy-admin.yml` marcado como **deprecated** e convertido para `workflow_dispatch` + `noop`, eliminando execução duplicada em `push`
- Deploy contínuo permanece centralizado em `.github/workflows/deploy.yml` com job único

## [v03.19.00] — 2026-03-22
### Infra
- Pipeline consolidado em **um único** `.github/workflows/deploy.yml`, com deploy do admin (`itau-calculadora-admin`) e do app principal no mesmo job
- Padronização explícita do deploy Cloudflare Pages para `--branch=production` em ambos os projetos
- Remoção do workflow separado `deploy-admin.yml` para evitar duplicidade operacional

## [v03.18.00] — 2026-03-22
### Corrigido
- Correção de compatibilidade no carregamento do módulo do Oráculo para evitar falha quando o navegador mantém versão anterior em cache (`obterAnaliseOraculoComMeta is not a function`)

### Alterado
- Inclusão de trilha de auditoria para alterações de parâmetros no admin (registro de antes/depois, usuário e timestamp)
- Inclusão de seção visual no painel admin para consulta das últimas alterações auditadas

## [v03.17.00] — 2026-03-22
### Alterado
- Inclusão do botão **Limpar dados locais** no bloco de histórico da IA para remover histórico + telemetria da sessão local, sem invalidar o cache de resposta do Oráculo

### Infra
- Criação do app administrativo separado em `admin/`, preparado para deploy exclusivo em subdomínio dedicado com Cloudflare Access
- Inclusão de workflow `.github/workflows/deploy-admin.yml` para deploy independente do admin via Wrangler

## [v03.16.00] — 2026-03-22
### Alterado
- Inclusão de skeleton loading no painel do Oráculo para reduzir sensação de espera durante consultas e refresh forçado
- Inclusão de histórico local das últimas análises do Oráculo (com origem cache/live e marcador de refresh manual)
- Inclusão de telemetria local de uso do Oráculo (consultas totais, taxa de cache hit, tempo médio, última resposta e falhas)

### Observabilidade
- Coleta local de métricas de latência e origem de resposta (cache vs live), preservadas em `localStorage` para feedback contínuo ao usuário

## [v03.15.00] — 2026-03-22
### Alterado
- Inclusão de botão para forçar nova análise do Oráculo, ignorando o cache da sessão quando o usuário desejar atualizar a resposta manualmente
- Badge do Oráculo passa a exibir a validade restante do cache, diferenciando análise reaproveitada vs análise recém-gerada

## [v03.14.00] — 2026-03-22
### Alterado
- Inclusão de indicador visual no bloco do Oráculo para distinguir análise recém-gerada vs análise reaproveitada do cache da sessão

### Performance
- Prewarm especulativo do Oráculo refinado com heurística de conexão (`saveData` / `effectiveType`) para evitar antecipação agressiva em redes lentas
- Agendamentos oportunistas passam a ser invalidados quando uma nova simulação substitui o cenário anterior

## [v03.13.00] — 2026-03-22
### Alterado
- Inclusão de cache inteligente do Oráculo Financeiro por payload da simulação, com reaproveitamento instantâneo de análises repetidas na mesma sessão
- Deduplicação de requisições simultâneas ao Oráculo para evitar chamadas duplicadas quando o usuário interage repetidamente com o botão da IA

### Performance
- Pré-carregamento oportunista dos módulos de E-Mail e Oráculo após a simulação, durante janelas ociosas do navegador
- Prewarm da análise do Oráculo em interações prováveis (`hover`, `focus` e `touchstart`) para reduzir a latência percebida no primeiro clique

## [v03.12.00] — 2026-03-22
### Alterado
- Inclusão de campos na UI para edição dos limiares de MAPE (`Boa` e `Atenção`) com validação antes do envio
- Integração de carregamento sob demanda para Oráculo Financeiro e envio de E-Mail, reduzindo o JavaScript inicial da página principal
- Extração da lógica pesada de formatação da análise IA e composição do HTML de e-mail para módulos ES em `public/js/`

### Performance
- Code splitting aplicado com `import()` dinâmico para que recursos de IA e e-mail só sejam carregados quando acionados pelo usuário

## [v03.11.00] — 2026-03-22
### Alterado
- Semáforo de qualidade do backtest tornado configurável por parâmetros (`backtest_mape_boa_percent` e `backtest_mape_atencao_percent`) com fallback em env/D1
- Bloco `backtest` do `calcular` passa a retornar classificação (`excelente|boa|atencao`) e faixas vigentes
- UI do card de backtest ajustada para usar classificação/faixas dinâmicas retornadas pela API (sem hardcode de limiares)

### Testes
- Inclusão de testes para classificação por faixas padrão e customizadas no módulo de backtest

## [v03.10.00] — 2026-03-22
### Alterado
- Inclusão de card visual de qualidade do backtest (MAPE 7 dias, erro atual e número de observações) no painel da calculadora
- Inclusão do resumo de backtest no texto compartilhável (copiar/WhatsApp)

## [v03.09.00] — 2026-03-22
### Alterado
- Inclusão de backtesting simples no `calcular`: comparação Spot Global vs PTAX de referência (Cartão) com erro percentual por execução
- Persistência de observações de backtest no D1 (`backtest_spot_vs_ptax`) e retorno de snapshot com MAPE 7 dias
- Novo endpoint `GET /api/backtest` para consulta de métricas (MAPE 7d e últimas observações)

### Testes
- Inclusão de suíte unitária para utilitários de backtest (erro percentual e MAPE)

## [v03.08.00] — 2026-03-22
### Alterado
- Inclusão de motor de sensibilidade determinística (otimista/base/pessimista) para Cartão e Conta Global no endpoint `calcular`
- Exibição de bloco de sensibilidade na interface com impacto em Total em BRL e VET por cenário

### Testes
- Inclusão de testes unitários para o módulo de sensibilidade (monotonicidade e piso de taxas)

## [v03.07.00] — 2026-03-22
### Alterado
- Centralização do contexto operacional em módulo único (`contexto-operacional.mjs`) para unificar janela de mercado e calendário de feriados entre endpoints
- Refatoração dos endpoints `calcular` e `parametros` para usar a mesma regra de `is_plantao` e `is_feriado`
- Inclusão de suíte inicial de testes automatizados para contexto operacional (dia útil, fim de semana, feriado fixo e feriado variável)

### Infra
- Script `npm test` habilitado via `node:test`

## [v03.06.00] — 2026-03-22
### Alterado
- Upgrade Gemini API: modelo gemini-pro-latest, endpoint v1beta, thinkingLevel HIGH, safetySettings, retry com 1 tentativa extra
- Padronização do sistema de versão para formato APP v00.00.00
- Cabeçalho de código adicionado ao backend (oraculo.js)

## [v03.05.00] — Anterior
### Histórico
- Versão anterior à padronização do controle de versão
