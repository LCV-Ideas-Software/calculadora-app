DROP TABLE IF EXISTS itau_ptax_cache;
DROP TABLE IF EXISTS itau_backtest_spot_vs_ptax;
DROP TABLE IF EXISTS itau_oraculo_observabilidade;
DROP TABLE IF EXISTS itau_rate_limit_policies;
DROP TABLE IF EXISTS itau_rate_limit_hits;
DROP TABLE IF EXISTS itau_parametros_customizados;
DROP TABLE IF EXISTS itau_parametros_auditoria;
DROP TABLE IF EXISTS itau_email_rate_limit;
DROP TABLE IF EXISTS itau_parametros_calculo;

CREATE TABLE itau_ptax_cache (
    data_cotacao TEXT,
    moeda TEXT,
    valor_ptax REAL NOT NULL,
    PRIMARY KEY (data_cotacao, moeda)
);

CREATE TABLE itau_backtest_spot_vs_ptax (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at INTEGER NOT NULL,
    moeda TEXT NOT NULL,
    data_compra TEXT NOT NULL,
    taxa_prevista REAL NOT NULL,
    taxa_observada REAL NOT NULL,
    erro_percentual REAL NOT NULL
);

CREATE TABLE itau_oraculo_observabilidade (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at INTEGER NOT NULL,
    status TEXT NOT NULL,
    from_cache INTEGER NOT NULL,
    force_refresh INTEGER NOT NULL,
    duration_ms INTEGER,
    moeda TEXT,
    valor_original REAL,
    preview TEXT,
    error_message TEXT,
    app_version TEXT
);

CREATE TABLE itau_rate_limit_policies (
    route_key TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL,
    max_requests INTEGER NOT NULL,
    window_minutes INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    updated_by TEXT
);

CREATE TABLE itau_rate_limit_hits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_key TEXT NOT NULL,
    ip TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE TABLE itau_parametros_customizados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chave TEXT NOT NULL,
    valor TEXT NOT NULL
);

CREATE TABLE itau_parametros_auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at INTEGER NOT NULL,
    admin_email TEXT NOT NULL,
    chave TEXT NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT NOT NULL,
    origem TEXT NOT NULL
);

CREATE TABLE itau_email_rate_limit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    timestamp INTEGER NOT NULL
);

CREATE TABLE itau_parametros_calculo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chave TEXT NOT NULL,
    valor TEXT NOT NULL,
    created_at INTEGER NOT NULL
);