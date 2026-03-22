DROP TABLE IF EXISTS ptax_cache;
DROP TABLE IF EXISTS backtest_spot_vs_ptax;

CREATE TABLE ptax_cache (
    data_cotacao TEXT,
    moeda TEXT,
    valor_ptax REAL NOT NULL,
    PRIMARY KEY (data_cotacao, moeda)
);

CREATE TABLE backtest_spot_vs_ptax (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at INTEGER NOT NULL,
    moeda TEXT NOT NULL,
    data_compra TEXT NOT NULL,
    taxa_prevista REAL NOT NULL,
    taxa_observada REAL NOT NULL,
    erro_percentual REAL NOT NULL
);