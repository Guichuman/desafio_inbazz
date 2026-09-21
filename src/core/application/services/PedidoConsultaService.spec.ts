import { Test, TestingModule } from '@nestjs/testing';
import { Cliente } from '@core/domain/pedido/Cliente';
import { ItemPedido } from '@core/domain/pedido/ItemPedido';
import { Pedido } from '@core/domain/pedido/Pedido';
import { PedidoNaoEncontradoError } from '@core/domain/pedido/errors/PedidoNaoEncontradoError';
import { construirResultadoPaginado } from '@shared/pagination/PaginatedResult';
import { IPedidoRepository } from '../interfaces/IPedidoRepository';
import { FiltroPedido } from '../value-objects/FiltroPedido';
import { PedidoConsultaService } from './PedidoConsultaService';

describe('PedidoConsultaService', () => {
  let service: PedidoConsultaService;
  let pedidoRepository: jest.Mocked<IPedidoRepository>;

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
        PedidoConsultaService,
        {
          provide: IPedidoRepository,
          useValue: {
            salvar: jest.fn(),
            atualizar: jest.fn(),
            buscarPorId: jest.fn(),
            buscarPorIdempotencyKey: jest.fn(),
            buscarPaginado: jest.fn(),
          },
        },
      ],
    }).compile();

    service = app.get(PedidoConsultaService);
    pedidoRepository = app.get(IPedidoRepository);
  });

  it('deve delegar a listagem paginada para o repositorio', async () => {
    const filtro = FiltroPedido.criar({ numeroPagina: 1, tamanhoPagina: 10 });
    const pedidos = [criarPedido(1), criarPedido(2)];
    pedidoRepository.buscarPaginado.mockResolvedValue(
      construirResultadoPaginado(pedidos, 2, 1, 10),
    );

    const resultado = await service.listarPaginado(filtro);

    expect(pedidoRepository.buscarPaginado).toHaveBeenCalledWith(filtro);
    expect(resultado.itens).toHaveLength(2);
    expect(resultado.totalRegistros).toBe(2);
  });

  it('deve retornar o pedido quando encontrado por id', async () => {
    const pedido = criarPedido(5);
    pedidoRepository.buscarPorId.mockResolvedValue(pedido);

    const resultado = await service.buscarPorId(5);

    expect(resultado.id).toBe(5);
  });

  it('deve lancar PedidoNaoEncontradoError quando o pedido nao existir', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(null);

    await expect(service.buscarPorId(999)).rejects.toThrow(PedidoNaoEncontradoError);
  });
});
