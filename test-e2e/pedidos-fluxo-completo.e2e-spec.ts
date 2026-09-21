import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { ICambioService } from '@core/application/interfaces/ICambioService';
import { ICepService } from '@core/application/interfaces/ICepService';
import { criarValidationPipe } from '@shared/validation/criarValidationPipe';
import { AppModule } from '../src/app.module';

describe('Fluxo completo de pedidos (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let cambioServiceMock: { converter: jest.Mock };
  let cepServiceMock: { buscarEndereco: jest.Mock };

  const aguardar = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

  const aguardarStatusPedido = async (
    pedidoId: number,
    statusesEsperados: string[],
    timeoutMs = 10000,
  ): Promise<request.Response> => {
    const inicio = Date.now();
    let ultimaResposta: request.Response;
    do {
      ultimaResposta = await request(app.getHttpServer()).get(`/orders/${pedidoId}`);
      if (statusesEsperados.includes(ultimaResposta.body.status)) {
        return ultimaResposta;
      }
      await aguardar(150);
    } while (Date.now() - inicio < timeoutMs);
    return ultimaResposta;
  };

  const payloadPedido = (overrides: Record<string, unknown> = {}) => ({
    order_id: 'ext-123',
    customer: { email: 'ana@example.com', name: 'Ana' },
    items: [{ sku: 'ABC123', qty: 2, unit_price: 59.9 }],
    currency: 'USD',
    idempotency_key: randomUUID(),
    ...overrides,
  });

  beforeAll(async () => {
    cambioServiceMock = { converter: jest.fn() };
    cepServiceMock = { buscarEndereco: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ICambioService)
      .useValue(cambioServiceMock)
      .overrideProvider(ICepService)
      .useValue(cepServiceMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(criarValidationPipe());
    await app.init();

    dataSource = app.get(getDataSourceToken());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE tb_pedido_item, tb_pedido RESTART IDENTITY CASCADE');
    cambioServiceMock.converter.mockReset();
    cepServiceMock.buscarEndereco.mockReset();
  });

  it('recebe o pedido via webhook, persiste com status RECEIVED e enfileira o enriquecimento', async () => {
    cambioServiceMock.converter.mockResolvedValue({ valorConvertido: 599, moedaConvertida: 'BRL' });

    const resposta = await request(app.getHttpServer())
      .post('/webhooks/orders')
      .send(payloadPedido())
      .expect(202);

    expect(resposta.body.status).toBe('RECEIVED');
    expect(resposta.body.valorTotal).toBe(119.8);

    const detalhe = await aguardarStatusPedido(resposta.body.id, ['ENRICHED']);

    expect(detalhe.body.status).toBe('ENRICHED');
    expect(detalhe.body.valorConvertido).toBe(599);
    expect(detalhe.body.moedaConvertida).toBe('BRL');
    expect(cambioServiceMock.converter).toHaveBeenCalledTimes(1);
  });

  it('garante idempotencia: reenviar o mesmo idempotency_key nao cria um novo pedido', async () => {
    cambioServiceMock.converter.mockResolvedValue({ valorConvertido: 599, moedaConvertida: 'BRL' });

    const payload = payloadPedido();
    const primeira = await request(app.getHttpServer())
      .post('/webhooks/orders')
      .send(payload)
      .expect(202);
    const segunda = await request(app.getHttpServer())
      .post('/webhooks/orders')
      .send(payload)
      .expect(202);

    expect(segunda.body.id).toBe(primeira.body.id);

    const listagem = await request(app.getHttpServer()).get('/orders').expect(200);
    expect(listagem.body.totalRegistros).toBe(1);
  });

  it('apos esgotar as tentativas de enriquecimento, marca o pedido como FAILED_ENRICHMENT e move o job para a DLQ', async () => {
    cambioServiceMock.converter.mockRejectedValue(new Error('servico de cambio indisponivel'));

    const resposta = await request(app.getHttpServer())
      .post('/webhooks/orders')
      .send(payloadPedido())
      .expect(202);

    const detalhe = await aguardarStatusPedido(resposta.body.id, ['FAILED_ENRICHMENT'], 15000);

    expect(detalhe.body.status).toBe('FAILED_ENRICHMENT');
    expect(detalhe.body.tentativasEnriquecimento).toBe(3);
    expect(detalhe.body.motivoFalhaEnriquecimento).toContain('servico de cambio indisponivel');

    const metricas = await request(app.getHttpServer()).get('/queue/metrics').expect(200);
    expect(metricas.body.naDlq).toBeGreaterThanOrEqual(1);
  }, 20000);

  it('valida o payload do webhook e rejeita quando nao houver itens', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/webhooks/orders')
      .send(payloadPedido({ items: [] }))
      .expect(400);

    expect(resposta.body.message).toContain('Pedido deve conter ao menos um item');
  });

  it('retorna mensagens de validacao em portugues, sem prefixo do campo pai em objetos aninhados', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/webhooks/orders')
      .send(
        payloadPedido({
          order_id: undefined,
          customer: { email: 'nao-e-um-email', name: 'Ana' },
          idempotency_key: 'nao-e-um-uuid',
        }),
      )
      .expect(400);

    expect(resposta.body.message).toEqual(
      expect.arrayContaining([
        'Order id obrigatório',
        'Email inválido',
        'Chave de idempotência deve ser um UUID válido',
      ]),
    );
    expect(resposta.body.message.some((m: string) => m.startsWith('customer.'))).toBe(false);
  });

  it('lista pedidos filtrando por status', async () => {
    cambioServiceMock.converter.mockResolvedValue({ valorConvertido: 599, moedaConvertida: 'BRL' });

    const resposta = await request(app.getHttpServer())
      .post('/webhooks/orders')
      .send(payloadPedido())
      .expect(202);

    await aguardarStatusPedido(resposta.body.id, ['ENRICHED']);

    const listagemEnriched = await request(app.getHttpServer())
      .get('/orders')
      .query({ status: 'ENRICHED' })
      .expect(200);
    expect(listagemEnriched.body.totalRegistros).toBe(1);

    const listagemFalhados = await request(app.getHttpServer())
      .get('/orders')
      .query({ status: 'FAILED_ENRICHMENT' })
      .expect(200);
    expect(listagemFalhados.body.totalRegistros).toBe(0);
  });

  it('retorna 404 ao pedir uma pagina alem do total disponivel', async () => {
    cambioServiceMock.converter.mockResolvedValue({ valorConvertido: 599, moedaConvertida: 'BRL' });

    await request(app.getHttpServer()).post('/webhooks/orders').send(payloadPedido()).expect(202);

    await request(app.getHttpServer())
      .get('/orders')
      .query({ numeroPagina: 2, tamanhoPagina: 20 })
      .expect(404);
  });

  it('retorna lista vazia (nao 404) ao paginar sobre uma base sem registros', async () => {
    await request(app.getHttpServer())
      .get('/orders')
      .query({ numeroPagina: 5, tamanhoPagina: 20 })
      .expect(200);
  });
});
