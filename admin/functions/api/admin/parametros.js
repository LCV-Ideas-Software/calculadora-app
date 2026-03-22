import { requireCloudflareAccess } from '../_lib/access.mjs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

const DEFAULTS = {
  iof_cartao: 0.035,
  iof_global: 0.035,
  spread_cartao: 0.055,
  spread_global_aberto: 0.0078,
  spread_global_fechado: 0.0118,
  fator_calibragem_global: 0.99934,
  backtest_mape_boa_percent: 1.0,
  backtest_mape_atencao_percent: 2.0
};

async function ensureTable(env) {
  await env.DB.prepare(
    'CREATE TABLE IF NOT EXISTS parametros_customizados (id INTEGER PRIMARY KEY AUTOINCREMENT, chave TEXT NOT NULL, valor TEXT NOT NULL)'
  ).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS parametros_auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at INTEGER NOT NULL,
      admin_email TEXT NOT NULL,
      chave TEXT NOT NULL,
      valor_anterior TEXT,
      valor_novo TEXT NOT NULL,
      origem TEXT NOT NULL
    )
  `).run();
}

async function readLatestParams(env) {
  const rows = await env.DB.prepare('SELECT chave, valor FROM parametros_customizados ORDER BY id DESC').all();
  const result = { ...DEFAULTS };

  for (const row of rows.results || []) {
    const parsed = Number.parseFloat(row.valor);
    if (Number.isFinite(parsed) && row.chave in DEFAULTS) {
      result[row.chave] = parsed;
    }
  }

  return result;
}

function toRate(percentValue) {
  const n = Number(percentValue);
  if (!Number.isFinite(n)) return null;
  return n / 100;
}

function validateRate(name, rate) {
  if (!Number.isFinite(rate)) return `${name} inválido.`;
  if (rate < 0 || rate > 1) return `${name} deve estar entre 0% e 100%.`;
  return null;
}

export async function onRequestGet(context) {
  const access = requireCloudflareAccess(context);
  if (!access.ok) return access.response;

  try {
    const { env } = context;
    await ensureTable(env);
    const parametros = await readLatestParams(env);

    return json({
      admin_email: access.email,
      parametros_vigentes: parametros,
      parametros_form: {
        iof_cartao_percent: Number((parametros.iof_cartao * 100).toFixed(4)),
        iof_global_percent: Number((parametros.iof_global * 100).toFixed(4)),
        spread_cartao_percent: Number((parametros.spread_cartao * 100).toFixed(4)),
        spread_global_aberto_percent: Number((parametros.spread_global_aberto * 100).toFixed(4)),
        spread_global_fechado_percent: Number((parametros.spread_global_fechado * 100).toFixed(4)),
        fator_calibragem_global: parametros.fator_calibragem_global,
        backtest_mape_boa_percent: parametros.backtest_mape_boa_percent,
        backtest_mape_atencao_percent: parametros.backtest_mape_atencao_percent
      }
    });
  } catch (error) {
    return json({ erro: 'Falha ao carregar parâmetros administrativos.' }, 500);
  }
}

export async function onRequestPost(context) {
  const access = requireCloudflareAccess(context);
  if (!access.ok) return access.response;

  try {
    const { request, env } = context;
    const body = await request.json();

    const iofCartao = toRate(body.iof_cartao_percent);
    const iofGlobal = toRate(body.iof_global_percent);
    const spreadCartao = toRate(body.spread_cartao_percent);
    const spreadAberto = toRate(body.spread_global_aberto_percent);
    const spreadFechado = toRate(body.spread_global_fechado_percent);
    const calibragem = Number(body.fator_calibragem_global);
    const mapeBoa = Number(body.backtest_mape_boa_percent);
    const mapeAtencao = Number(body.backtest_mape_atencao_percent);

    const validations = [
      validateRate('IOF Cartão', iofCartao),
      validateRate('IOF Global', iofGlobal),
      validateRate('Spread Cartão', spreadCartao),
      validateRate('Spread Global Aberto', spreadAberto),
      validateRate('Spread Global Fechado', spreadFechado),
      !Number.isFinite(calibragem) || calibragem <= 0 ? 'Fator de calibragem deve ser maior que 0.' : null,
      !Number.isFinite(mapeBoa) || mapeBoa < 0 || mapeBoa > 100 ? 'MAPE Boa inválido.' : null,
      !Number.isFinite(mapeAtencao) || mapeAtencao < 0 || mapeAtencao > 100 ? 'MAPE Atenção inválido.' : null,
      Number.isFinite(mapeBoa) && Number.isFinite(mapeAtencao) && mapeAtencao <= mapeBoa
        ? 'MAPE Atenção deve ser maior que MAPE Boa.'
        : null
    ].filter(Boolean);

    if (validations.length) {
      return json({ erro: validations[0] }, 400);
    }

    await ensureTable(env);

    const values = {
      iof_cartao: iofCartao,
      iof_global: iofGlobal,
      spread_cartao: spreadCartao,
      spread_global_aberto: spreadAberto,
      spread_global_fechado: spreadFechado,
      fator_calibragem_global: calibragem,
      backtest_mape_boa_percent: mapeBoa,
      backtest_mape_atencao_percent: mapeAtencao
    };

    const atuais = await readLatestParams(env);
    const mudancas = Object.entries(values)
      .filter(([chave, valorNovo]) => !Number.isFinite(atuais[chave]) || Number(atuais[chave]) !== Number(valorNovo))
      .map(([chave, valorNovo]) => ({
        chave,
        valorAnterior: Number.isFinite(atuais[chave]) ? atuais[chave] : null,
        valorNovo
      }));

    for (const [chave, valor] of Object.entries(values)) {
      await env.DB.prepare('INSERT INTO parametros_customizados (chave, valor) VALUES (?, ?)')
        .bind(chave, String(valor))
        .run();
    }

    for (const mudanca of mudancas) {
      await env.DB.prepare(`
        INSERT INTO parametros_auditoria (created_at, admin_email, chave, valor_anterior, valor_novo, origem)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
        .bind(
          Date.now(),
          access.email,
          mudanca.chave,
          mudanca.valorAnterior == null ? null : String(mudanca.valorAnterior),
          String(mudanca.valorNovo),
          'admin-panel'
        )
        .run();
    }

    return json({
      ok: true,
      admin_email: access.email,
      saved_at: new Date().toISOString(),
      parametros_salvos: values,
      mudancas_registradas: mudancas.length
    });
  } catch (error) {
    return json({ erro: 'Falha ao salvar parâmetros administrativos.' }, 500);
  }
}
