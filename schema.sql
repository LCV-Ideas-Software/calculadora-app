DROP TABLE IF EXISTS ptax_cache;

CREATE TABLE ptax_cache (
    data_cotacao TEXT,
    moeda TEXT,
    valor_ptax REAL NOT NULL,
    PRIMARY KEY (data_cotacao, moeda)
);