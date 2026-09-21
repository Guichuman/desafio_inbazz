CREATE TABLE IF NOT EXISTS tb_pedido (
    id                          SERIAL,
    order_id_externo            VARCHAR(100) NOT NULL,
    idempotency_key             UUID NOT NULL,
    status                      CHAR(1) NOT NULL,

    cliente_nome                VARCHAR(64) NOT NULL,
    cliente_email               VARCHAR(64) NOT NULL,
    cliente_zipcode             VARCHAR(10),

    moeda_original              VARCHAR(3) NOT NULL,
    valor_total                 INT NOT NULL,
    valor_convertido            INT,
    moeda_convertida            VARCHAR(3),

    endereco_logradouro         VARCHAR(256),
    endereco_bairro             VARCHAR(96),
    endereco_cidade             VARCHAR(100),
    endereco_uf                 VARCHAR(2),

    tentativas_enriquecimento   INT NOT NULL DEFAULT 0,
    motivo_falha_enriquecimento TEXT,

    data_inclusao               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE tb_pedido ADD CONSTRAINT pk_tb_pedido PRIMARY KEY (id);

ALTER TABLE tb_pedido
ADD CONSTRAINT uk_tb_pedido_idempotency_key UNIQUE (idempotency_key);

CREATE TABLE IF NOT EXISTS tb_pedido_item (
    id             SERIAL,
    id_pedido      INT NOT NULL,
    sku            VARCHAR(50) NOT NULL,
    quantidade     INT NOT NULL,
    preco_unitario INT NOT NULL
);

ALTER TABLE tb_pedido_item ADD CONSTRAINT pk_tb_pedido_item PRIMARY KEY (id);

ALTER TABLE tb_pedido_item
ADD CONSTRAINT fk_tb_pedido_item_tb_pedido FOREIGN KEY (id_pedido) REFERENCES tb_pedido (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tb_pedido_status ON tb_pedido (status);

CREATE INDEX IF NOT EXISTS idx_tb_pedido_data_inclusao ON tb_pedido (data_inclusao);

CREATE INDEX IF NOT EXISTS idx_tb_pedido_item_id_pedido ON tb_pedido_item (id_pedido);
