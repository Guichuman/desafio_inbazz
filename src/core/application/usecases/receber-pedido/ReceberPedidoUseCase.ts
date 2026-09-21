import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cliente } from '@core/domain/pedido/Cliente';
import { ItemPedido } from '@core/domain/pedido/ItemPedido';
import { Pedido } from '@core/domain/pedido/Pedido';
import { IFilaPedidosService } from '../../interfaces/IFilaPedidosService';
import {
  IdempotencyKeyDuplicadaError,
  IPedidoRepository,
} from '../../interfaces/IPedidoRepository';
import { ReceberPedidoInput } from './ReceberPedidoInput';

export interface ReceberPedidoOutput {
  pedido: Pedido;
  novoPedido: boolean;
}

@Injectable()
export class ReceberPedidoUseCase {
  private readonly logger = new Logger(ReceberPedidoUseCase.name);

  constructor(
    @Inject(IPedidoRepository)
    private readonly pedidoRepository: IPedidoRepository,
    @Inject(IFilaPedidosService)
    private readonly filaPedidosService: IFilaPedidosService,
  ) {}

  async executar(input: ReceberPedidoInput): Promise<ReceberPedidoOutput> {
    const pedidoExistente = await this.pedidoRepository.buscarPorIdempotencyKey(
      input.idempotencyKey,
    );
    if (pedidoExistente) {
      return this.retornarPedidoExistente(pedidoExistente, input.idempotencyKey);
    }

    const pedido = Pedido.criar({
      orderIdExterno: input.orderIdExterno,
      idempotencyKey: input.idempotencyKey,
      cliente: new Cliente(input.cliente),
      itens: input.itens.map((item) => new ItemPedido(item)),
      moedaOriginal: input.moedaOriginal,
    });

    let pedidoCriado: Pedido;
    try {
      pedidoCriado = await this.pedidoRepository.salvar(pedido);
    } catch (erro) {
      if (erro instanceof IdempotencyKeyDuplicadaError) {
        const pedidoConcorrente = await this.pedidoRepository.buscarPorIdempotencyKey(
          input.idempotencyKey,
        );
        if (pedidoConcorrente) {
          return this.retornarPedidoExistente(pedidoConcorrente, input.idempotencyKey);
        }
      }
      throw erro;
    }

    await this.filaPedidosService.enfileirarEnriquecimento({ pedidoId: pedidoCriado.id });

    this.logger.log(`Pedido id=${pedidoCriado.id} recebido e enfileirado para enriquecimento.`);

    return { pedido: pedidoCriado, novoPedido: true };
  }

  private retornarPedidoExistente(pedido: Pedido, idempotencyKey: string): ReceberPedidoOutput {
    this.logger.log(
      `Pedido com idempotencyKey=${idempotencyKey} ja foi recebido anteriormente (id=${pedido.id}). Ignorando reprocessamento.`,
    );
    return { pedido, novoPedido: false };
  }
}
