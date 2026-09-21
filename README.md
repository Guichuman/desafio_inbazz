# Orquestrador de Pedidos — Desafio Backend Pleno (Buzzmates)

API em NestJS que recebe pedidos via webhook, valida e enfileira para processamento
assíncrono, enriquece os dados via câmbio e CEP (com retry/backoff e DLQ), e expõe
endpoints de consulta.

## Stack

NestJS 10 + TypeScript · PostgreSQL + TypeORM · BullMQ + Redis · class-validator/class-transformer · Jest

## Arquitetura

Clean Architecture em 4 camadas (`domain` → `application` → `infrastructure`/`presentation`),
seguindo o padrão dos projetos NestJS da Forma (ex: `cosmos-api`): dependências sempre
fluem pra dentro, infraestrutura é injetada por interface (`@Inject(IPedidoRepository)`).

```
src/
├── shared/        # kernel comum: DomainError, paginação, MoneyUtils, config
└── core/
    ├── domain/pedido/       # Pedido, Value Objects, erros de domínio
    ├── application/         # interfaces, use cases (ReceberPedido, EnriquecerPedido)
    ├── infrastructure/      # TypeORM (model/schema/mapper/repository), fila BullMQ, HTTP clients
    └── presentation/        # controllers, DTOs, filtro global de exceção
```

## Como rodar

### Docker (recomendado)

```bash
cp .env.example .env
docker compose up --build
```

API em `http://localhost:3000`.

### Local (Node 20+)

```bash
cp .env.example .env
docker compose up -d postgres redis   # só a infra
npm install
npm run start:dev
```

O schema é criado automaticamente (`synchronize`). Para criar manualmente:
`psql -U postgres -d orders_orchestrator -f sql/schema.sql`.

## Endpoints

- **`POST /webhooks/orders`** — recebe o pedido, valida, garante idempotência por
  `idempotency_key` (UUID) e enfileira o enriquecimento. Retorna `202` com o pedido
  (`RECEIVED`). Reenviar a mesma `idempotency_key` retorna o pedido já existente.
- **`GET /orders?status=&numeroPagina=&tamanhoPagina=`** — listagem paginada.
- **`GET /orders/:id`** — detalhe, incluindo dados de enriquecimento.
- **`GET /queue/metrics`** — métricas da fila de enriquecimento.

```json
{
  "order_id": "ext-123",
  "customer": { "email": "user@example.com", "name": "Ana", "zipcode": "01001-000" },
  "items": [{ "sku": "ABC123", "qty": 2, "unit_price": 59.9 }],
  "currency": "USD",
  "idempotency_key": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

`customer.zipcode` é uma extensão opcional: quando informado, o pedido também é
enriquecido com o endereço via ViaCEP.

## Fluxo de enriquecimento (retry / DLQ)

Pedido persistido como `RECEIVED` → enfileirado no BullMQ → `EnriquecerPedidoUseCase`
converte o valor para `CAMBIO_MOEDA_DESTINO` via Frankfurter e, se houver `zipcode`,
busca o endereço via ViaCEP (best-effort — falha no CEP não bloqueia nem aciona retry)
→ pedido marcado `ENRICHED`. Se a conversão de câmbio falhar, o BullMQ tenta de novo com
backoff exponencial; após esgotar `QUEUE_ENRIQUECIMENTO_MAX_ATTEMPTS`, o job vai para a
fila `pedidos-enriquecimento-dlq` e o pedido é marcado `FAILED_ENRICHMENT`.

## Testes

```bash
npm run test        # unitarios
npm run test:cov    # com cobertura
npm run test:e2e    # fluxo completo, com Postgres + Redis reais
```

> Não rode `npm run test:e2e` com `npm run start:dev` aberto ao mesmo tempo apontando
> pro mesmo Redis — os dois viram workers concorrentes da mesma fila.

## Principais decisões

- **BullMQ + Redis** em vez de SQS: sobe 100% local, sem depender de AWS/localstack.
- **`synchronize: true`** em vez de migrations: proporcional ao escopo do desafio.
- **`idempotency_key` como `UUID` nativo** (não `VARCHAR`): mais correto e eficiente;
  trade-off é não aceitar hash, mas o desafio sempre envia UUID de fato.
- **Valores monetários em `INT` (centavos)** no banco; domínio trabalha em reais, a
  conversão fica isolada em [`MoneyUtils.ts`](src/shared/utils/MoneyUtils.ts).
- **CEP é best-effort**: só a conversão de câmbio participa do ciclo de retry/DLQ.
- **`status` como `CHAR(1)` no banco / texto descritivo na API**, seguindo o padrão do
  `cosmos-api`.
- **Erros de domínio tipados** (`codigo` + `httpStatus`), mapeados para HTTP por um
  `DomainExceptionFilter` global — mensagens de validação em português.
