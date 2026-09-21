import { Test, TestingModule } from '@nestjs/testing';
import { Cliente } from '@core/domain/pedido/Cliente';
import { ItemPedido } from '@core/domain/pedido/ItemPedido';
import { Pedido } from '@core/domain/pedido/Pedido';
import { PedidoNaoEncontradoError } from '@core/domain/pedido/errors/PedidoNaoEncontradoError';
import { PedidoConsultaService } from '@core/application/services/PedidoConsultaService';
import { construirResultadoPaginado } from '@shared/pagination/PaginatedResult';
import { OrdersController } from './OrdersController';

describe('OrdersController', () => {
  let controller: OrdersController;
  let pedidoConsultaService: jest.Mocked<
    Pick<PedidoConsultaService, 'listarPaginado' | 'buscarPorId'>
  >;

  const criarPedido = (id: number): Pedido => {
    const pedido = Pedido.criar({
      orderIdExterno: 'ext-123',
      idempotencyKey: `uuid-${id}`,
      cliente: new Cliente({ nome: 'Ana', email: 'ana@example.com' }),
      itens: [new ItemPedido({ sku: 'ABC123', quantidade: 1, precoUnitario: 10 })],
      moedaOriginal: 'USD',
    });
    pedido.id = id;
    return pedido;
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PedidoConsultaService,
          useValue: { listarPaginado: jest.fn(), buscarPorId: jest.fn() },
        },
      ],
      controllers: [OrdersController],
    }).compile();

    controller = app.get(OrdersController);
    pedidoConsultaService = app.get(PedidoConsultaService);
  });

  it('deve listar pedidos paginados aplicando o filtro informado na query', async () => {
    const pedidos = [criarPedido(1), criarPedido(2)];
    pedidoConsultaService.listarPaginado.mockResolvedValue(
      construirResultadoPaginado(pedidos, 2, 1, 20),
    );

    const resposta = await controller.listar({});

    expect(pedidoConsultaService.listarPaginado).toHaveBeenCalledTimes(1);
    expect(resposta.itens).toHaveLength(2);
    expect(resposta.totalRegistros).toBe(2);
  });

  it('deve retornar o pedido quando encontrado por id', async () => {
    const pedido = criarPedido(5);
    pedidoConsultaService.buscarPorId.mockResolvedValue(pedido);

    const resposta = await controller.buscarPorId(5);

    expect(resposta.id).toBe(5);
  });

  it('deve propagar PedidoNaoEncontradoError quando o pedido nao existir', async () => {
    pedidoConsultaService.buscarPorId.mockRejectedValue(new PedidoNaoEncontradoError(999));

    await expect(controller.buscarPorId(999)).rejects.toBeInstanceOf(PedidoNaoEncontradoError);
  });
});
