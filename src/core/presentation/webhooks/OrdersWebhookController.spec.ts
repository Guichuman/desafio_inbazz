import { Test, TestingModule } from '@nestjs/testing';
import { Cliente } from '@core/domain/pedido/Cliente';
import { ItemPedido } from '@core/domain/pedido/ItemPedido';
import { Pedido } from '@core/domain/pedido/Pedido';
import { ReceberPedidoUseCase } from '@core/application/usecases/receber-pedido/ReceberPedidoUseCase';
import { PedidoSemItensError } from '@core/domain/pedido/errors/PedidoSemItensError';
import { OrdersWebhookController } from './OrdersWebhookController';
import { ReceberPedidoWebhookDto } from './dtos/ReceberPedidoWebhookDto';

describe('OrdersWebhookController', () => {
  let controller: OrdersWebhookController;
  let receberPedidoUseCase: jest.Mocked<Pick<ReceberPedidoUseCase, 'executar'>>;

  const dto: ReceberPedidoWebhookDto = {
    order_id: 'ext-123',
    customer: { email: 'ana@example.com', name: 'Ana' },
    items: [{ sku: 'ABC123', quantidade: 2, unit_price: 59.9 }],
    currency: 'usd',
    idempotency_key: 'uuid-1',
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ReceberPedidoUseCase,
          useValue: { executar: jest.fn() },
        },
      ],
      controllers: [OrdersWebhookController],
    }).compile();

    controller = app.get(OrdersWebhookController);
    receberPedidoUseCase = app.get(ReceberPedidoUseCase);
  });

  it('deve traduzir o dto do webhook para o input do use case em maiusculas na moeda', async () => {
    const pedidoCriado = Pedido.criar({
      orderIdExterno: 'ext-123',
      idempotencyKey: 'uuid-1',
      cliente: new Cliente({ nome: 'Ana', email: 'ana@example.com' }),
      itens: [new ItemPedido({ sku: 'ABC123', quantidade: 2, precoUnitario: 59.9 })],
      moedaOriginal: 'USD',
    });
    pedidoCriado.id = 1;
    receberPedidoUseCase.executar.mockResolvedValue({ pedido: pedidoCriado, novoPedido: true });

    const resposta = await controller.receber(dto);

    expect(receberPedidoUseCase.executar).toHaveBeenCalledWith({
      orderIdExterno: 'ext-123',
      idempotencyKey: 'uuid-1',
      cliente: { nome: 'Ana', email: 'ana@example.com', zipcode: undefined },
      itens: [{ sku: 'ABC123', quantidade: 2, precoUnitario: 59.9 }],
      moedaOriginal: 'USD',
    });
    expect(resposta.id).toBe(1);
    expect(resposta.status).toBe('RECEIVED');
  });

  it('deve propagar o erro de dominio quando o use case falhar', async () => {
    receberPedidoUseCase.executar.mockRejectedValue(new PedidoSemItensError());

    await expect(controller.receber(dto)).rejects.toBeInstanceOf(PedidoSemItensError);
  });
});
