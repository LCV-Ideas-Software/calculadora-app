import { describe, expect, it } from 'vitest';
import { D1_CONTRACT, verifyD1Contract } from '../../../scripts/verify-d1-contract.mjs';

function validSnapshot() {
  const schema = Object.entries(D1_CONTRACT.tables).flatMap(([table, columns]) =>
    columns.map((column) => ({
      table_name: table,
      column_name: column,
      pk_position: (D1_CONTRACT.primaryKeys[table] ?? []).indexOf(column) + 1,
    })),
  );
  schema.push({
    table_name: 'shared_extra_table',
    column_name: 'id',
    pk_position: 1,
  });

  const indexes = Object.entries(D1_CONTRACT.indexes).flatMap(([name, index]) =>
    index.columns.map((column, position) => ({
      index_name: name,
      table_name: index.table,
      column_name: column,
      column_position: position,
    })),
  );
  indexes.push({
    index_name: 'shared_extra_index',
    table_name: 'shared_extra_table',
    column_name: 'id',
    column_position: 0,
  });

  const retention = Object.entries(D1_CONTRACT.retention).map(([table, maxAgeDays]) => ({
    table_name: table,
    max_age_days: maxAgeDays,
    stale_rows: 0,
  }));

  return { schema, indexes, retention };
}

describe('contrato sanitizado do D1 compartilhado', () => {
  it('aceita o contrato ativo e ignora objetos extras do banco compartilhado', () => {
    expect(verifyD1Contract(validSnapshot())).toEqual({ ok: true, errors: [] });
  });

  it('falha fechado para drift de coluna, PK, índice e retenção', () => {
    const snapshot = validSnapshot();
    snapshot.schema = snapshot.schema
      .filter((row) => !(row.table_name === 'calc_oraculo_observabilidade' && row.column_name === 'valor_original'))
      .map((row) =>
        row.table_name === 'calc_ptax_cache' && row.column_name === 'moeda' ? { ...row, pk_position: 0 } : row,
      );
    snapshot.indexes = snapshot.indexes.filter(
      (row) => !(row.index_name === 'idx_calc_rate_limit_hits_lookup' && row.column_name === 'created_at'),
    );
    snapshot.retention = snapshot.retention.map((row) =>
      row.table_name === 'ai_usage_logs' ? { ...row, stale_rows: 1 } : row,
    );

    expect(verifyD1Contract(snapshot)).toEqual({
      ok: false,
      errors: [
        'index columns mismatch: idx_calc_rate_limit_hits_lookup expected [route_key, ip, created_at] got [route_key, ip]',
        'index positions mismatch: idx_calc_rate_limit_hits_lookup expected [0, 1, 2] got [0, 1]',
        'missing column: calc_oraculo_observabilidade.valor_original',
        'primary key mismatch: calc_ptax_cache expected [data_cotacao, moeda] got [data_cotacao]',
        'retention violation: ai_usage_logs has 1 stale row(s)',
      ],
    });
  });

  it('falha fechado quando posição de índice ou contagem de retenção é nula', () => {
    const snapshot = validSnapshot();
    snapshot.indexes = snapshot.indexes.map((row) =>
      row.index_name === 'idx_calc_backtest_created_at' ? { ...row, column_position: null } : row,
    );
    snapshot.retention = snapshot.retention.map((row) =>
      row.table_name === 'ai_usage_logs' ? { ...row, stale_rows: null } : row,
    );

    expect(verifyD1Contract(snapshot)).toEqual({
      ok: false,
      errors: [
        'invalid index position: idx_calc_backtest_created_at',
        'missing index: idx_calc_backtest_created_at',
        'retention violation: ai_usage_logs has null stale row(s)',
      ],
    });
  });

  it('mantém a janela LGPD canônica em 90 dias para as duas telemetrias', () => {
    expect(D1_CONTRACT.retention).toEqual({
      calc_oraculo_observabilidade: 90,
      ai_usage_logs: 90,
    });
  });
});
