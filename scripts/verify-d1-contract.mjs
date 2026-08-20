import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const D1_CONTRACT = Object.freeze({
  tables: {
    calc_parametros_customizados: ['id', 'chave', 'valor'],
    calc_ptax_cache: ['data_cotacao', 'moeda', 'valor_ptax'],
    calc_backtest_spot_vs_ptax: [
      'id',
      'created_at',
      'moeda',
      'data_compra',
      'taxa_prevista',
      'taxa_observada',
      'erro_percentual',
    ],
    calc_oraculo_observabilidade: [
      'id',
      'created_at',
      'status',
      'from_cache',
      'force_refresh',
      'duration_ms',
      'moeda',
      'valor_original',
      'preview',
      'error_message',
      'app_version',
    ],
    calc_rate_limit_policies: ['route_key', 'enabled', 'max_requests', 'window_minutes', 'updated_at', 'updated_by'],
    calc_rate_limit_hits: ['id', 'route_key', 'ip', 'created_at'],
    ai_usage_logs: [
      'id',
      'timestamp',
      'module',
      'model',
      'input_tokens',
      'output_tokens',
      'latency_ms',
      'status',
      'error_detail',
    ],
  },
  primaryKeys: {
    calc_ptax_cache: ['data_cotacao', 'moeda'],
    calc_rate_limit_policies: ['route_key'],
  },
  indexes: {
    idx_calc_backtest_created_at: {
      table: 'calc_backtest_spot_vs_ptax',
      columns: ['created_at'],
    },
    idx_calc_rate_limit_hits_lookup: {
      table: 'calc_rate_limit_hits',
      columns: ['route_key', 'ip', 'created_at'],
    },
  },
  retention: {
    calc_oraculo_observabilidade: 90,
    ai_usage_logs: 90,
  },
  columnConstraints: {
    'ai_usage_logs.timestamp': {
      notNull: true,
      defaultValue: "datetime('now')",
    },
  },
});

const sameOrderedValues = (actual, expected) =>
  actual.length === expected.length && actual.every((value, index) => value === expected[index]);

export function verifyD1Contract(snapshot) {
  const errors = [];
  const schemaRows = Array.isArray(snapshot?.schema) ? snapshot.schema : [];
  const indexRows = Array.isArray(snapshot?.indexes) ? snapshot.indexes : [];
  const retentionRows = Array.isArray(snapshot?.retention) ? snapshot.retention : [];

  const columnsByTable = new Map();
  const primaryKeysByTable = new Map();
  const schemaByColumn = new Map();
  for (const row of schemaRows) {
    if (typeof row?.table_name !== 'string' || typeof row?.column_name !== 'string') continue;
    schemaByColumn.set(`${row.table_name}.${row.column_name}`, row);
    const columns = columnsByTable.get(row.table_name) ?? [];
    columns.push(row.column_name);
    columnsByTable.set(row.table_name, columns);
    if (Number.isInteger(row.pk_position) && row.pk_position > 0) {
      const primaryKeys = primaryKeysByTable.get(row.table_name) ?? [];
      primaryKeys.push({
        column: row.column_name,
        position: row.pk_position,
      });
      primaryKeysByTable.set(row.table_name, primaryKeys);
    }
  }

  for (const [table, requiredColumns] of Object.entries(D1_CONTRACT.tables)) {
    const actualColumns = columnsByTable.get(table);
    if (!actualColumns) {
      errors.push(`missing table: ${table}`);
      continue;
    }
    for (const column of requiredColumns) {
      if (!actualColumns.includes(column)) errors.push(`missing column: ${table}.${column}`);
    }
  }

  for (const [table, expectedColumns] of Object.entries(D1_CONTRACT.primaryKeys)) {
    const actual = (primaryKeysByTable.get(table) ?? []).sort((left, right) => left.position - right.position);
    const actualColumns = actual.map(({ column }) => column);
    if (!sameOrderedValues(actualColumns, expectedColumns)) {
      errors.push(
        `primary key mismatch: ${table} expected [${expectedColumns.join(', ')}] got [${actualColumns.join(', ')}]`,
      );
    }
    const actualPositions = actual.map(({ position }) => position);
    const expectedPositions = expectedColumns.map((_, index) => index + 1);
    if (!sameOrderedValues(actualPositions, expectedPositions)) {
      errors.push(
        `primary key positions mismatch: ${table} expected [${expectedPositions.join(', ')}] got [${actualPositions.join(', ')}]`,
      );
    }
  }

  for (const [key, constraint] of Object.entries(D1_CONTRACT.columnConstraints)) {
    const actual = schemaByColumn.get(key);
    if (!actual) continue;
    if (constraint.notNull && actual.not_null !== 1) {
      errors.push(`column must be NOT NULL: ${key}`);
    }
    if (actual.default_value !== constraint.defaultValue) {
      errors.push(`column default mismatch: ${key} expected ${constraint.defaultValue} got ${actual.default_value}`);
    }
  }

  const indexesByName = new Map();
  const invalidIndexPositions = new Set();
  for (const row of indexRows) {
    if (
      typeof row?.index_name !== 'string' ||
      typeof row?.table_name !== 'string' ||
      typeof row?.column_name !== 'string'
    ) {
      continue;
    }
    if (!Number.isInteger(row.column_position)) {
      invalidIndexPositions.add(row.index_name);
      continue;
    }
    const index = indexesByName.get(row.index_name) ?? {
      tables: new Set(),
      columns: [],
      uniqueFlags: new Set(),
      partialFlags: new Set(),
    };
    index.tables.add(row.table_name);
    index.uniqueFlags.add(row.is_unique);
    index.partialFlags.add(row.is_partial);
    index.columns.push({
      column: row.column_name,
      position: row.column_position,
    });
    indexesByName.set(row.index_name, index);
  }

  for (const [name, expected] of Object.entries(D1_CONTRACT.indexes)) {
    if (invalidIndexPositions.has(name)) {
      errors.push(`invalid index position: ${name}`);
    }
    const actual = indexesByName.get(name);
    if (!actual) {
      errors.push(`missing index: ${name}`);
      continue;
    }
    const actualTables = [...actual.tables].sort();
    if (actualTables.length !== 1 || actualTables[0] !== expected.table) {
      errors.push(`index table mismatch: ${name} expected ${expected.table} got [${actualTables.join(', ')}]`);
    }
    if (actual.uniqueFlags.size !== 1 || !actual.uniqueFlags.has(0)) {
      errors.push(`index must be non-unique: ${name}`);
    }
    if (actual.partialFlags.size !== 1 || !actual.partialFlags.has(0)) {
      errors.push(`index must be non-partial: ${name}`);
    }
    const orderedColumns = actual.columns.sort((left, right) => left.position - right.position);
    const actualColumns = orderedColumns.map(({ column }) => column);
    if (!sameOrderedValues(actualColumns, expected.columns)) {
      errors.push(
        `index columns mismatch: ${name} expected [${expected.columns.join(', ')}] got [${actualColumns.join(', ')}]`,
      );
    }
    const actualPositions = orderedColumns.map(({ position }) => position);
    const expectedPositions = expected.columns.map((_, position) => position);
    if (!sameOrderedValues(actualPositions, expectedPositions)) {
      errors.push(
        `index positions mismatch: ${name} expected [${expectedPositions.join(', ')}] got [${actualPositions.join(', ')}]`,
      );
    }
  }

  const retentionByTable = new Map(
    retentionRows.filter((row) => typeof row?.table_name === 'string').map((row) => [row.table_name, row]),
  );
  for (const [table, maxAgeDays] of Object.entries(D1_CONTRACT.retention)) {
    const actual = retentionByTable.get(table);
    if (!actual) {
      errors.push(`missing retention evidence: ${table}`);
      continue;
    }
    if (Number(actual.max_age_days) !== maxAgeDays) {
      errors.push(`retention window mismatch: ${table} expected ${maxAgeDays} got ${actual.max_age_days}`);
    }
    if (!Number.isInteger(actual.stale_rows) || actual.stale_rows !== 0) {
      errors.push(`retention violation: ${table} has ${actual.stale_rows} stale row(s)`);
    }
  }

  return { ok: errors.length === 0, errors: errors.sort() };
}

async function readSnapshot(path) {
  if (path === '-') {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  return JSON.parse(await readFile(path, 'utf8'));
}

async function main() {
  const snapshotPath = process.argv[2];
  if (!snapshotPath) {
    console.error('Uso: npm run verify:d1-contract -- <snapshot.json|->');
    process.exitCode = 2;
    return;
  }

  const result = verifyD1Contract(await readSnapshot(snapshotPath));
  if (!result.ok) {
    console.error(['D1 contract drift detected:', ...result.errors.map((error) => `- ${error}`)].join('\n'));
    process.exitCode = 1;
    return;
  }
  console.log('D1 contract verified: required schema metadata, indexes, primary keys and retention match.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
