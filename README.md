# Orquestrador de Pedidos — Desafio Backend Pleno (Buzzmates)

API em NestJS que recebe pedidos via webhook, valida e enfileira para processamento
assíncrono, enriquece os dados consultando serviços externos (câmbio e CEP) com
retry/backoff e DLQ, e expõe endpoints de consulta e administração.

## Sumário

- [Arquitetura](#arquitetura)
- [Stack](#stack)
- [Como rodar](#como-rodar)
- [Endpoints](#endpoints)
- [Fluxo de enriquecimento (retry / DLQ)](#fluxo-de-enriquecimento-retry--dlq)
- [Testes](#testes)
- [Decisões de arquitetura e trade-offs](#decisões-de-arquitetura-e-trade-offs)

## Arquitetura

O projeto segue o padrão de Clean Architecture em 4 camadas usado em outros projetos
NestJS da Forma (ex: `cosmos-api`): as dependências fluem sempre para dentro
(`presentation` → `application` → `domain`; `infrastructure` é injetada via interface,
nunca referenciada diretamente pelas camadas superiores).

```
src/
├── shared/                        # Kernel compartilhado (equivalente a libs/modules/src no cosmos-api)
│   ├── domain/DomainError.ts      # Base para erros de domínio (codigo + httpStatus)
│   ├── pagination/                # IFiltroPaginado / PaginatedResult
│   ├── utils/MoneyUtils.ts        # Conversão reais <-> centavos
│   └── config/                    # Validação de env (Joi) e factories de config
└── core/
    ├── domain/pedido/             # Aggregation Pedido, Value Objects, erros de domínio
    ├── application/
    │   ├── interfaces/            # Contratos (Repository, Fila, Câmbio, CEP)
    │   ├── value-objects/         # FiltroPedido (paginação)
    │   └── usecases/              # ReceberPedidoUseCase, EnriquecerPedidoUseCase
    ├── infrastructure/
    │   ├── datasource/typeorm/    # Model, EntitySchema, Mapper, Builders, Repository
    │   ├── queue/                 # BullMQ: fila, processor, DLQ
    │   └── services/              # Clientes HTTP externos (câmbio, CEP)
    └── presentation/
        ├── webhooks/              # POST /webhooks/orders
        ├── orders/                # GET /orders, GET /orders/:id
        ├── queue/                 # GET /queue/metrics
        └── filters/               # DomainExceptionFilter
```

Padrões seguidos (mesma convenção do `cosmos-api`):

- **Value Objects** imutáveis para conceitos de domínio (`ItemPedido`, `Cliente`, `StatusPedido`).
- **Erros de domínio tipados** (`PedidoNaoEncontradoError`, `PedidoSemItensError`,
  `PaginaNaoEncontradaError`), cada um com `codigo` e `httpStatus`, lançados diretamente
  pelos UseCases/Repository e mapeados para HTTP por um `DomainExceptionFilter` global.
- **Mapeamento de tabela**: Model + EntitySchema (TypeORM), sem decorators `@Entity`. Cada
  entidade declara `id` diretamente (sem classe base compartilhada).
- **Paginação em duas consultas** (`count()` depois `find()`, nunca `QueryBuilder`/SQL cru),
  com builders separados (`WhereBuilder`, `OrderBuilder`, `FindManyOptionsBuilder`) e
  validação de página inexistente (404) após o `count()` — mesmo padrão do `cosmos-api`.
- **Injeção por interface** (`@Inject(IPedidoRepository)`), nunca instanciação direta.

## Stack

- **NestJS 10** + TypeScript
- **PostgreSQL** + TypeORM (EntitySchema)
- **BullMQ + Redis** para fila, retry com backoff exponencial e DLQ
- **class-validator / class-transformer** para validação de payload
- **Jest** para testes unitários e e2e

## Como rodar

### Com Docker (recomendado)

```bash
cp .env.example .env
docker compose up --build
```

A API sobe em `http://localhost:3000`.

### Localmente (Node 20+)

```bash
cp .env.example .env
docker compose up -d postgres redis   # apenas a infra
npm install
npm run start:dev
```

O schema do banco é criado automaticamente (`synchronize`) — não há migrations
neste desafio (ver [Decisões de arquitetura](#decisões-de-arquitetura-e-trade-offs)).
Se preferir montar o schema manualmente (ou seu usuário do Postgres não tiver
permissão de DDL automático), use [`sql/schema.sql`](sql/schema.sql):

```bash
createdb -U postgres orders_orchestrator
psql -U postgres -d orders_orchestrator -f sql/schema.sql
```

## Endpoints

### `POST /webhooks/orders`

Recebe um pedido, valida, garante idempotência por `idempotency_key` e enfileira o
enriquecimento assíncrono. Retorna `202 Accepted` com o pedido persistido (status `RECEIVED`).

```json
{
  "order_id": "ext-123",
  "customer": { "email": "user@example.com", "name": "Ana", "zipcode": "01001-000" },
  "items": [{ "sku": "ABC123", "qty": 2, "unit_price": 59.9 }],
  "currency": "USD",
  "idempotency_key": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

> `customer.zipcode` é uma extensão opcional ao payload do desafio: quando informado,
> o pedido também é enriquecido com o endereço via ViaCEP.
>
> `idempotency_key` deve ser um UUID válido (`@IsUUID()` + coluna `uuid` no banco) — ver
> [Decisões de arquitetura](#decisões-de-arquitetura-e-trade-offs) sobre o trade-off em
> relação ao "uuid-or-hash" do enunciado original.

Reenviar o mesmo `idempotency_key` retorna o pedido já existente, sem duplicar ou
reenfileirar.

### `GET /orders?status=&numeroPagina=&tamanhoPagina=`

Lista pedidos paginados, com filtro opcional por status
(`RECEIVED`, `ENRICHING`, `ENRICHED`, `FAILED_ENRICHMENT`).

### `GET /orders/:id`

Detalha um pedido, incluindo dados de enriquecimento (`valorConvertido`, `moedaConvertida`,
`endereco`, `tentativasEnriquecimento`, `motivoFalhaEnriquecimento`).

### `GET /queue/metrics`

Métricas gerais da fila de enriquecimento:

```json
{
  "nomeFila": "pedidos-enriquecimento",
  "aguardando": 0,
  "emProcessamento": 0,
  "concluidos": 12,
  "falhados": 0,
  "agendados": 0,
  "naDlq": 1
}
```

## Fluxo de enriquecimento (retry / DLQ)

1. `ReceberPedidoUseCase` persiste o pedido (`RECEIVED`) e enfileira um job BullMQ.
2. `PedidosProcessor` consome o job e chama `EnriquecerPedidoUseCase`, que:
   - marca o pedido como `ENRICHING`;
   - converte o valor total para `CAMBIO_MOEDA_DESTINO` via API de câmbio (Frankfurter);
   - se o cliente informou `zipcode`, busca o endereço via ViaCEP — **best-effort**: falha
     no CEP não aciona retry, o pedido segue sem endereço (ver trade-offs abaixo);
   - em caso de sucesso, marca `ENRICHED` com os dados obtidos.
3. Se a conversão de câmbio falhar, o erro é propagado e o BullMQ agenda uma nova
   tentativa com backoff exponencial (`QUEUE_ENRIQUECIMENTO_BACKOFF_MS`).
4. Após esgotar `QUEUE_ENRIQUECIMENTO_MAX_ATTEMPTS` tentativas, o job é copiado para a
   fila `pedidos-enriquecimento-dlq` e o pedido é marcado como `FAILED_ENRICHMENT`.

## Testes

```bash
npm run test          # unitarios (domain, application, infrastructure, presentation)
npm run test:cov      # com cobertura
npm run test:e2e      # fluxo completo, com Postgres + Redis reais
```

Os testes e2e (`test-e2e/pedidos-fluxo-completo.e2e-spec.ts`) sobem a aplicação real
(TypeORM + BullMQ reais) e substituem apenas os clientes HTTP externos por dublês
controláveis, para validar de forma determinística: enriquecimento com sucesso,
idempotência, esgotamento de tentativas → `FAILED_ENRICHMENT` → DLQ, validação de
payload e filtro por status. Requer Postgres e Redis rodando (`docker compose up -d postgres redis`).

> **Não rode `npm run test:e2e` com `npm run start:dev` aberto ao mesmo tempo apontando
> para o mesmo Redis.** Os dois viram *workers* concorrentes da mesma fila BullMQ — o
> `start:dev` usa o `CambioHttpService` real (sem mock) e pode roubar o job do teste antes
> do worker do teste processá-lo, fazendo o teste falhar por pegar uma taxa de câmbio real
> em vez do valor mockado. Pare o `start:dev` (ou aponte-o para um Redis diferente) antes
> de rodar os testes e2e.

## Decisões de arquitetura e trade-offs

- **BullMQ + Redis em vez de SQS**: o `cosmos-api` usa SQS em produção, mas para este
  desafio o BullMQ evita depender de AWS/localstack — sobe 100% local via
  `docker-compose` e já oferece retry com backoff e DLQ nativamente.
- **`synchronize: true` em vez de migrations**: proporcional ao escopo de um desafio;
  simplifica o setup para quem for avaliar (`docker compose up` já cria o schema). Num
  projeto produtivo (como o `cosmos-api`) isso seria substituído por migrations versionadas.
- **CEP como enriquecimento best-effort**: o payload do desafio não tem endereço, então
  o CEP foi adicionado como campo opcional (`customer.zipcode`). Como nem todo pedido o
  informa, uma falha na consulta de CEP não deveria bloquear o pedido nem acionar
  retry/DLQ — apenas a conversão de câmbio (presente em 100% dos pedidos) participa do
  ciclo de retry/DLQ exigido pelo desafio.
- **Sem `jobId` determinístico na fila**: uma primeira versão usava `jobId: pedido-${id}`
  como camada extra de dedupe. Isso quebrou em teste: como o Postgres reutiliza IDs após
  um reset de dados, um job novo podia colidir com um job antigo (mesmo ID) ainda presente
  no Redis e silenciosamente não ser enfileirado. A idempotência real já é garantida pelo
  `idempotency_key` (unique) verificado *antes* de enfileirar, então o `jobId` customizado
  foi removido — dedupe duplo que não agregava segurança e ainda introduzia um bug.
- **i18n**: o `cosmos-api` usa `nestjs-i18n` para mensagens de erro multi-idioma. Não foi
  replicado aqui por ser desafio de idioma único — mas a estrutura (erro de domínio com
  `codigo` + `DomainExceptionFilter` central) é a mesma base sobre a qual o i18n do
  `cosmos-api` é construído, então adicionar não exigiria remodelar nada.
- **Valores monetários em centavos (INT), nunca float/decimal**: `tb_pedido.valor_total`,
  `valor_convertido` e `tb_pedido_item.preco_unitario` são `INT` no banco (guardam centavos,
  não reais). O domínio continua trabalhando em reais (ex: `59.9`) — a conversão (`× 100` / `÷ 100`) é
  isolada em [`shared/utils/MoneyUtils.ts`](src/shared/utils/MoneyUtils.ts) e usada apenas
  pelo `PedidoMapper`, na fronteira com a persistência.
- **Sem classe base para entidades**: `Pedido` declara `id` e `dataInclusao` diretamente,
  sem herdar de uma `AbstractEntity` compartilhada — desnecessário com uma única aggregation
  no domínio.
- **Paginação: `count()` + `find()` separados, não `findAndCount()`**: segue o padrão oficial
  de busca paginada da Forma (`PedidoRepository.buscarPaginado`) — conta o total, valida se a
  página pedida existe (`PaginaNaoEncontradaError`, 404) e só então busca os dados já com a
  relação `itens` carregada. Uma base vazia (`totalRegistros === 0`) retorna lista vazia em
  vez de 404, mesmo pedindo uma página além do total.
- **`idempotency_key` como `UUID` nativo, não `VARCHAR`**: o enunciado do desafio aceita
  `"uuid-or-hash"`, mas optamos pelo tipo `uuid` do Postgres (mais correto semanticamente,
  menor no disco, indexação mais eficiente) com validação `@IsUUID()` no DTO — devolvendo
  `400` limpo antes de chegar ao banco. Trade-off aceito: uma `idempotency_key` no formato
  hash (ex: SHA-256) seria rejeitada. Dado o contexto do desafio, o cliente do webhook
  sempre envia um UUID de fato.
- **`status` como `CHAR(1)` no banco, `VARCHAR` descritivo no domínio**: seguindo o padrão
  encontrado em `cosmos-api/apps/cosmos-api/sql/02-table.sql` (toda coluna de status usa
  código de 1 letra). `R`/`P`/`E`/`F` mapeiam para `RECEIVED`/`ENRICHING`/`ENRICHED`/
  `FAILED_ENRICHMENT` via [`StatusPedidoCodigoMapper`](src/core/infrastructure/datasource/typeorm/mappers/StatusPedidoCodigoMapper.ts),
  isolado na camada de infraestrutura — a API e o domínio nunca veem o código, só o texto.
- **Tamanhos de `VARCHAR` e nomes de constraint alinhados ao `cosmos-api`**: `email`/`nome`
  em 64 (padrão dominante em `02-table.sql`), `logradouro` em 256, `bairro` em 96,
  `data_inclusao` como `TIMESTAMP WITH TIME ZONE` (não `TIMESTAMP`), e PK/UK/FK/índices
  nomeados explicitamente (`pk_tb_pedido`, `uk_tb_pedido_idempotency_key`,
  `fk_tb_pedido_item_tb_pedido`, `idx_tb_pedido_status`, `idx_tb_pedido_data_inclusao`,
  `idx_tb_pedido_item_id_pedido`) em vez dos nomes automáticos do Postgres/TypeORM.
  `endereco_cidade` continua `VARCHAR` livre (não normalizado via FK para uma tabela de
  cidades como no `cosmos-api`): lá existe `tb_cidade`/`tb_estado`/`tb_pais` como cadastro
  de referência; aqui o valor vem direto da resposta do ViaCEP e não há esse cadastro —
  normalizar exigiria importar uma base geográfica completa, desproporcional para o desafio.
