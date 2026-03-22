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
}

async function loadOverviewAndParams() {
  setStatus('Atualizando painel...');

  const [overview, parametros] = await Promise.all([
    fetchJson('/api/admin/overview'),
    fetchJson('/api/admin/parametros')
  ]);

  renderOverview(overview);
  fillParamForm(parametros?.parametros_form || {});
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

loadOverviewAndParams().catch((error) => setStatus(error.message, true));
