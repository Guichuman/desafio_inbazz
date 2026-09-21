import { Test, TestingModule } from '@nestjs/testing';
import { Cliente } from '@core/domain/pedido/Cliente';
import { ItemPedido } from '@core/domain/pedido/ItemPedido';
import { Pedido } from '@core/domain/pedido/Pedido';
import { PedidoSemItensError } from '@core/domain/pedido/errors/PedidoSemItensError';
import { IFilaPedidosService } from '../../interfaces/IFilaPedidosService';
import {
  IdempotencyKeyDuplicadaError,
  IPedidoRepository,
} from '../../interfaces/IPedidoRepository';
import { ReceberPedidoInput } from './ReceberPedidoInput';
import { ReceberPedidoUseCase } from './ReceberPedidoUseCase';

describe('ReceberPedidoUseCase', () => {
  let useCase: ReceberPedidoUseCase;
  let pedidoRepository: jest.Mocked<IPedidoRepository>;
  let filaPedidosService: jest.Mocked<IFilaPedidosService>;

  const inputValido: ReceberPedidoInput = {
    orderIdExterno: 'ext-123',
    idempotencyKey: 'uuid-1',
    cliente: { nome: 'Ana', email: 'ana@example.com' },
    itens: [{ sku: 'ABC123', quantidade: 2, precoUnitario: 59.9 }],
    moedaOriginal: 'USD',
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        ReceberPedidoUseCase,
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
        {
          provide: IFilaPedidosService,
          useValue: {
            enfileirarEnriquecimento: jest.fn(),
            obterMetricas: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = app.get(ReceberPedidoUseCase);
    pedidoRepository = app.get(IPedidoRepository);
    filaPedidosService = app.get(IFilaPedidosService);
  });

  it('deve persistir o pedido e enfileirar o enriquecimento quando for a primeira vez', async () => {
    pedidoRepository.buscarPorIdempotencyKey.mockResolvedValue(null);
    pedidoRepository.salvar.mockImplementation(async (pedido) => {
      pedido.id = 1;
      return pedido;
    });

    const resultado = await useCase.executar(inputValido);

    expect(resultado.novoPedido).toBe(true);
    expect(resultado.pedido.id).toBe(1);
    expect(pedidoRepository.salvar).toHaveBeenCalledTimes(1);
    expect(filaPedidosService.enfileirarEnriquecimento).toHaveBeenCalledWith({ pedidoId: 1 });
  });

  it('nao deve persistir nem enfileirar novamente quando a idempotencyKey ja existir', async () => {
    const pedidoExistente = Pedido.criar({
      orderIdExterno: inputValido.orderIdExterno,
      idempotencyKey: inputValido.idempotencyKey,
      cliente: new Cliente(inputValido.cliente),
      itens: inputValido.itens.map((item) => new ItemPedido(item)),
      moedaOriginal: inputValido.moedaOriginal,
    });
    pedidoExistente.id = 99;

    pedidoRepository.buscarPorIdempotencyKey.mockResolvedValue(pedidoExistente);

    const resultado = await useCase.executar(inputValido);

    expect(resultado.novoPedido).toBe(false);
    expect(resultado.pedido.id).toBe(99);
    expect(pedidoRepository.salvar).not.toHaveBeenCalled();
    expect(filaPedidosService.enfileirarEnriquecimento).not.toHaveBeenCalled();
  });

  it('deve retornar o pedido concorrente quando salvar detectar idempotencyKey duplicada (race condition)', async () => {
    const pedidoConcorrente = Pedido.criar({
      orderIdExterno: inputValido.orderIdExterno,
      idempotencyKey: inputValido.idempotencyKey,
      cliente: new Cliente(inputValido.cliente),
      itens: inputValido.itens.map((item) => new ItemPedido(item)),
      moedaOriginal: inputValido.moedaOriginal,
    });
    pedidoConcorrente.id = 42;

    pedidoRepository.buscarPorIdempotencyKey
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(pedidoConcorrente);
    pedidoRepository.salvar.mockRejectedValue(
      new IdempotencyKeyDuplicadaError(inputValido.idempotencyKey),
    );

    const resultado = await useCase.executar(inputValido);

    expect(resultado.novoPedido).toBe(false);
    expect(resultado.pedido.id).toBe(42);
    expect(pedidoRepository.buscarPorIdempotencyKey).toHaveBeenCalledTimes(2);
    expect(filaPedidosService.enfileirarEnriquecimento).not.toHaveBeenCalled();
  });

  it('deve repropagar o erro quando salvar detectar idempotencyKey duplicada mas o pedido concorrente nao for encontrado', async () => {
    const erroDuplicidade = new IdempotencyKeyDuplicadaError(inputValido.idempotencyKey);

    pedidoRepository.buscarPorIdempotencyKey
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    pedidoRepository.salvar.mockRejectedValue(erroDuplicidade);

    await expect(useCase.executar(inputValido)).rejects.toThrow(erroDuplicidade);

    expect(filaPedidosService.enfileirarEnriquecimento).not.toHaveBeenCalled();
  });

  it('deve lancar PedidoSemItensError quando nao houver itens', async () => {
    pedidoRepository.buscarPorIdempotencyKey.mockResolvedValue(null);

    await expect(useCase.executar({ ...inputValido, itens: [] })).rejects.toThrow(
      PedidoSemItensError,
    );

    expect(pedidoRepository.salvar).not.toHaveBeenCalled();
    expect(filaPedidosService.enfileirarEnriquecimento).not.toHaveBeenCalled();
  });
});
