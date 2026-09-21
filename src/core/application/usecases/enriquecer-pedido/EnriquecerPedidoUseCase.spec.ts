import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Cliente } from '@core/domain/pedido/Cliente';
import { ItemPedido } from '@core/domain/pedido/ItemPedido';
import { Pedido } from '@core/domain/pedido/Pedido';
import { PedidoNaoEncontradoError } from '@core/domain/pedido/errors/PedidoNaoEncontradoError';
import { StatusPedido } from '@core/domain/pedido/value-objects/StatusPedido';
import { ICambioService } from '../../interfaces/ICambioService';
import { ICepService } from '../../interfaces/ICepService';
import { IPedidoRepository } from '../../interfaces/IPedidoRepository';
import { EnriquecerPedidoUseCase } from './EnriquecerPedidoUseCase';

describe('EnriquecerPedidoUseCase', () => {
  let useCase: EnriquecerPedidoUseCase;
  let pedidoRepository: jest.Mocked<IPedidoRepository>;
  let cambioService: jest.Mocked<ICambioService>;
  let cepService: jest.Mocked<ICepService>;

  const criarPedido = (zipcode?: string): Pedido => {
    const pedido = Pedido.criar({
      orderIdExterno: 'ext-123',
      idempotencyKey: 'uuid-1',
      cliente: new Cliente({ nome: 'Ana', email: 'ana@example.com', zipcode }),
      itens: [new ItemPedido({ sku: 'ABC123', quantidade: 2, precoUnitario: 59.9 })],
      moedaOriginal: 'USD',
    });
    pedido.id = 1;
    return pedido;
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        EnriquecerPedidoUseCase,
        {
          provide: IPedidoRepository,
          useValue: {
            salvar: jest.fn(),
            atualizar: jest.fn(async (pedido) => pedido),
            buscarPorId: jest.fn(),
            buscarPorIdempotencyKey: jest.fn(),
            buscarPaginado: jest.fn(),
          },
        },
        {
          provide: ICambioService,
          useValue: { converter: jest.fn() },
        },
        {
          provide: ICepService,
          useValue: { buscarEndereco: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: () => 'BRL' },
        },
      ],
    }).compile();

    useCase = app.get(EnriquecerPedidoUseCase);
    pedidoRepository = app.get(IPedidoRepository);
    cambioService = app.get(ICambioService);
    cepService = app.get(ICepService);
  });

  it('deve lancar PedidoNaoEncontradoError quando o pedido nao existir', async () => {
    pedidoRepository.buscarPorId.mockResolvedValue(null);

    await expect(useCase.executar(999)).rejects.toThrow(PedidoNaoEncontradoError);
  });

  it('deve concluir o enriquecimento com cambio e endereco quando o cliente tiver zipcode', async () => {
    const pedido = criarPedido('01001-000');
    pedidoRepository.buscarPorId.mockResolvedValue(pedido);
    cambioService.converter.mockResolvedValue({ valorConvertido: 650, moedaConvertida: 'BRL' });
    cepService.buscarEndereco.mockResolvedValue({ cidade: 'Sao Paulo', uf: 'SP' });

    const resultado = await useCase.executar(1);

    expect(resultado.pedido.status).toBe(StatusPedido.ENRICHED);
    expect(resultado.pedido.valorConvertido).toBe(650);
    expect(resultado.pedido.endereco).toEqual({ cidade: 'Sao Paulo', uf: 'SP' });
  });

  it('deve concluir o enriquecimento mesmo sem zipcode, sem consultar CEP', async () => {
    const pedido = criarPedido();
    pedidoRepository.buscarPorId.mockResolvedValue(pedido);
    cambioService.converter.mockResolvedValue({ valorConvertido: 650, moedaConvertida: 'BRL' });

    await useCase.executar(1);

    expect(cepService.buscarEndereco).not.toHaveBeenCalled();
  });

  it('deve seguir sem endereco quando a consulta de CEP falhar, sem propagar erro', async () => {
    const pedido = criarPedido('01001-000');
    pedidoRepository.buscarPorId.mockResolvedValue(pedido);
    cambioService.converter.mockResolvedValue({ valorConvertido: 650, moedaConvertida: 'BRL' });
    cepService.buscarEndereco.mockRejectedValue(new Error('timeout'));

    const resultado = await useCase.executar(1);

    expect(resultado.pedido.status).toBe(StatusPedido.ENRICHED);
    expect(resultado.pedido.endereco).toBeUndefined();
  });

  it('deve registrar a tentativa de falha e repassar o erro quando o cambio falhar', async () => {
    const pedido = criarPedido();
    pedidoRepository.buscarPorId.mockResolvedValue(pedido);
    cambioService.converter.mockRejectedValue(new Error('servico de cambio indisponivel'));

    await expect(useCase.executar(1)).rejects.toThrow('servico de cambio indisponivel');

    expect(pedido.tentativasEnriquecimento).toBe(1);
    expect(pedido.motivoFalhaEnriquecimento).toBe('servico de cambio indisponivel');
    expect(pedidoRepository.atualizar).toHaveBeenCalledWith(pedido);
  });
});
