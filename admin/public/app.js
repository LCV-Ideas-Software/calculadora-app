const statusEl = document.getElementById('status');

function setStatus(message, isError = false) {
  statusEl.textContent = message || '';
  statusEl.style.color = isError ? '#b91c1c' : '#0f766e';
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.erro || `Falha na requisição (${response.status}).`);
  }
  return data;
}

function fmtNumber(value, max = 4) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: max
  });
}

let rateLimitPolicies = [];

function getRateRouteLabel(routeKey) {
  if (routeKey === 'oraculo_ia') return 'Síntese da IA';
  if (routeKey === 'enviar_email') return 'Envio de E-mail';
  return routeKey;
}

function renderRateLimitPanels() {
  const host = document.getElementById('rate-limit-panels');
  if (!host) return;

  if (!rateLimitPolicies.length) {
    host.innerHTML = '<p>Sem políticas carregadas.</p>';
    return;
  }

  host.innerHTML = rateLimitPolicies.map((policy) => {
    const enabled = Boolean(policy.enabled);
    const statusText = enabled ? 'ATIVO' : 'INATIVO';
    const dotClass = enabled ? 'rate-dot' : 'rate-dot off';
    return `
      <article class="rate-panel" data-route-key="${policy.route_key}">
        <div class="rate-panel-head">
          <label class="rate-title">
            <input type="checkbox" data-field="enabled" ${enabled ? 'checked' : ''}>
            Habilitar Escudo (${getRateRouteLabel(policy.route_key)})
          </label>
          <button type="button" class="btn warn" data-action="restore">Restaurar padrão</button>
        </div>
        <p>Quando ativo, bloqueia temporariamente excessos de requisição por IP nesta rota.</p>
        <div class="rate-pill">
          <span class="${dotClass}"></span>
          ${statusText} • ${policy.max_requests} REQ / ${policy.window_minutes} MIN
        </div>

        <div class="rate-inputs">
          <label>MÁX. REQUISIÇÕES POR IP
            <input type="number" min="1" step="1" data-field="max_requests" value="${policy.max_requests}">
          </label>
          <label>JANELA (MINUTOS)
            <input type="number" min="1" step="1" data-field="window_minutes" value="${policy.window_minutes}">
          </label>
        </div>

        <p>Janela atual: ${policy.stats?.total_requests_window ?? 0} reqs / ${policy.stats?.distinct_ips_window ?? 0} IPs</p>

        <div class="rate-actions">
          <button type="button" class="btn primary" data-action="save">Salvar</button>
        </div>
      </article>
    `;
  }).join('');

  host.querySelectorAll('[data-action="save"]').forEach((btn) => {
    btn.addEventListener('click', async (event) => {
      const panel = event.currentTarget.closest('.rate-panel');
      const routeKey = panel?.getAttribute('data-route-key');
      if (!routeKey) return;

      const enabled = panel.querySelector('[data-field="enabled"]').checked;
      const maxRequests = Number(panel.querySelector('[data-field="max_requests"]').value);
      const windowMinutes = Number(panel.querySelector('[data-field="window_minutes"]').value);

      setStatus('Salvando política de rate limit...');

      try {
        const payload = {
          route_key: routeKey,
          action: 'update',
          enabled,
          max_requests: maxRequests,
          window_minutes: windowMinutes
        };

        const response = await fetchJson('/api/admin/rate-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        rateLimitPolicies = response.policies || [];
        renderRateLimitPanels();
        setStatus('Política atualizada com sucesso.');
      } catch (error) {
        setStatus(error.message, true);
      }
    });
  });

  host.querySelectorAll('[data-action="restore"]').forEach((btn) => {
    btn.addEventListener('click', async (event) => {
      const panel = event.currentTarget.closest('.rate-panel');
      const routeKey = panel?.getAttribute('data-route-key');
      if (!routeKey) return;

      setStatus('Restaurando política padrão...');

      try {
        const response = await fetchJson('/api/admin/rate-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ route_key: routeKey, action: 'restore_default' })
        });

        rateLimitPolicies = response.policies || [];
        renderRateLimitPanels();
        setStatus('Política restaurada para o padrão.');
      } catch (error) {
        setStatus(error.message, true);
      }
    });
  });
}

async function loadRateLimitPanel() {
  const data = await fetchJson('/api/admin/rate-limit');
  rateLimitPolicies = data.policies || [];
  renderRateLimitPanels();
}

function fillParamForm(formData) {
  const ids = [
    'iof_cartao_percent',
    'iof_global_percent',
    'spread_cartao_percent',
    'spread_global_aberto_percent',
    'spread_global_fechado_percent',
    'fator_calibragem_global',
    'backtest_mape_boa_percent',
    'backtest_mape_atencao_percent'
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = formData?.[id] ?? '';
  });
}

function readParamForm() {
  return {
    iof_cartao_percent: Number(document.getElementById('iof_cartao_percent').value),
    iof_global_percent: Number(document.getElementById('iof_global_percent').value),
    spread_cartao_percent: Number(document.getElementById('spread_cartao_percent').value),
    spread_global_aberto_percent: Number(document.getElementById('spread_global_aberto_percent').value),
    spread_global_fechado_percent: Number(document.getElementById('spread_global_fechado_percent').value),
    fator_calibragem_global: Number(document.getElementById('fator_calibragem_global').value),
    backtest_mape_boa_percent: Number(document.getElementById('backtest_mape_boa_percent').value),
    backtest_mape_atencao_percent: Number(document.getElementById('backtest_mape_atencao_percent').value)
  };
}

function renderOverview(data) {
  const isPlantao = Boolean(data?.contexto_operacional?.is_plantao);
  const mercadoStatus = isPlantao ? 'Fechado/Plantão' : 'Aberto';

  document.getElementById('admin-email').textContent = `Sessão: ${data?.admin_email || 'N/A'}`;
  document.getElementById('mercado-status').textContent = mercadoStatus;
  document.getElementById('mape-7d').textContent = `${fmtNumber(data?.backtest?.mape_7d_percent, 4)}%`;
  document.getElementById('obs-7d').textContent = fmtNumber(data?.backtest?.observacoes_7d, 0);
  document.getElementById('obs-total').textContent = fmtNumber(data?.backtest?.total_observacoes, 0);

  const list = document.getElementById('ultimas-observacoes');
  const items = data?.backtest?.ultimas_observacoes || [];
  if (!items.length) {
    list.innerHTML = '<li>Sem observações recentes.</li>';
    return;
  }

  list.innerHTML = items
    .map((item) => {
      const dt = new Date(Number(item.created_at));
      const when = Number.isFinite(dt.getTime())
        ? dt.toLocaleString('pt-BR', { hour12: false })
        : 'N/A';
      const erroPct = Number(item.erro_percentual) * 100;
      return `<li>${when} · ${item.moeda} · erro ${fmtNumber(erroPct, 4)}%</li>`;
    })
    .join('');

  const auditList = document.getElementById('auditoria-parametros');
  const changes = data?.auditoria_parametros?.ultimas_alteracoes || [];
  if (!changes.length) {
    auditList.innerHTML = '<li>Sem alterações auditadas até o momento.</li>';
    return;
  }

  auditList.innerHTML = changes
    .map((item) => {
      const dt = new Date(Number(item.created_at));
      const when = Number.isFinite(dt.getTime())
        ? dt.toLocaleString('pt-BR', { hour12: false })
        : 'N/A';

      const before = item.valor_anterior == null ? '∅' : item.valor_anterior;
      const after = item.valor_novo == null ? '∅' : item.valor_novo;

      return `<li>${when} · <strong>${item.chave}</strong>: ${before} → ${after} · ${item.admin_email}</li>`;
    })
    .join('');

  const telemetriaList = document.getElementById('ai-telemetria-admin');
  const telemetria = data?.oraculo_telemetria || {};
  const total = Number(telemetria.total || 0);
  const cacheHits = Number(telemetria.cache_hits || 0);
  const hitRate = total > 0 ? ((cacheHits / total) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0';

  telemetriaList.innerHTML = [
    `<li><strong>Consultas:</strong> ${fmtNumber(total, 0)}</li>`,
    `<li><strong>Cache hit rate:</strong> ${hitRate}%</li>`,
    `<li><strong>Tempo médio:</strong> ${fmtNumber(telemetria.avg_duration_ms, 0)}ms</li>`,
    `<li><strong>Última resposta:</strong> ${fmtNumber(telemetria.last_duration_ms, 0)}ms</li>`,
    `<li><strong>Falhas:</strong> ${fmtNumber(telemetria.errors, 0)}</li>`
  ].join('');

  const historicoList = document.getElementById('ai-historico-admin');
  const historico = data?.oraculo_historico?.ultimas_analises || [];
  if (!historico.length) {
    historicoList.innerHTML = '<li>Sem análises registradas.</li>';
    return;
  }

  historicoList.innerHTML = historico.map((item) => {
    const dt = new Date(Number(item.created_at));
    const when = Number.isFinite(dt.getTime())
      ? dt.toLocaleString('pt-BR', { hour12: false })
      : 'N/A';
    const origem = item.from_cache ? 'cache' : 'live';
    const refresh = item.force_refresh ? ' · refresh' : '';
    const status = item.status === 'error' ? 'erro' : 'ok';
    const valor = Number.isFinite(Number(item.valor_original))
      ? Number(item.valor_original).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '-';
    const texto = item.status === 'error'
      ? (item.error_message || 'Falha sem detalhe')
      : (item.preview || 'Sem prévia');

    return `<li><strong>${when}</strong> · ${status} · ${origem}${refresh} · ${item.moeda || '-'} ${valor}<br>${texto}</li>`;
  }).join('');
}

async function loadOverviewAndParams() {
  setStatus('Atualizando painel...');

  const [overview, parametros] = await Promise.all([
    fetchJson('/api/admin/overview'),
    fetchJson('/api/admin/parametros')
  ]);

  renderOverview(overview);
  fillParamForm(parametros?.parametros_form || {});
  await loadRateLimitPanel();
  setStatus('Painel atualizado.');
}

async function saveParams(event) {
  event.preventDefault();
  const payload = readParamForm();

  const btn = document.getElementById('btn-save');
  btn.disabled = true;
  setStatus('Salvando parâmetros...');

  try {
    await fetchJson('/api/admin/parametros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    setStatus('Parâmetros salvos com sucesso.');
    await loadOverviewAndParams();
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    btn.disabled = false;
  }
}

document.getElementById('param-form').addEventListener('submit', saveParams);
document.getElementById('btn-refresh').addEventListener('click', () => {
  loadOverviewAndParams().catch((error) => setStatus(error.message, true));
});

document.getElementById('btn-refresh-rate-limit').addEventListener('click', () => {
  loadRateLimitPanel()
    .then(() => setStatus('Painel de rate limit atualizado.'))
    .catch((error) => setStatus(error.message, true));
});

loadOverviewAndParams().catch((error) => setStatus(error.message, true));
