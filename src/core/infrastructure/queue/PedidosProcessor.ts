import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { EnriquecerPedidoUseCase } from '@core/application/usecases/enriquecer-pedido/EnriquecerPedidoUseCase';
import { IPedidoRepository } from '@core/application/interfaces/IPedidoRepository';
import { PedidoNaoEncontradoError } from '@core/domain/pedido/errors/PedidoNaoEncontradoError';
import {
  JOB_ENRIQUECER_PEDIDO,
  JobEnriquecerPedidoData,
  QUEUE_ENRIQUECIMENTO_PEDIDOS,
  QUEUE_ENRIQUECIMENTO_PEDIDOS_DLQ,
} from './constants';

@Processor(QUEUE_ENRIQUECIMENTO_PEDIDOS)
export class PedidosProcessor extends WorkerHost {
  private readonly logger = new Logger(PedidosProcessor.name);

  constructor(
    private readonly enriquecerPedidoUseCase: EnriquecerPedidoUseCase,
    @Inject(IPedidoRepository)
    private readonly pedidoRepository: IPedidoRepository,
    @InjectQueue(QUEUE_ENRIQUECIMENTO_PEDIDOS_DLQ)
    private readonly filaDlq: Queue,
  ) {
    super();
  }

  async process(processo: Job<JobEnriquecerPedidoData>): Promise<void> {
    try {
      await this.enriquecerPedidoUseCase.executar(processo.data.pedidoId);
    } catch (erro) {
      if (erro instanceof PedidoNaoEncontradoError) {
        this.logger.error(
          `Pedido id=${processo.data.pedidoId} nao encontrado (${erro.codigo}). Job descartado sem retry.`,
        );
        return;
      }
      throw erro;
    }
  }

  @OnWorkerEvent('failed')
  async aoFalhar(processo: Job<JobEnriquecerPedidoData>): Promise<void> {
    const tentativasMaximas = processo.opts.attempts ?? 1;
    const numeroTentativas = processo.attemptsMade;

    if (numeroTentativas < tentativasMaximas) {
      this.logger.warn(
        `Tentativa ${numeroTentativas}/${tentativasMaximas} falhou para pedido id=${processo.data.pedidoId}. ` +
          `Nova tentativa sera agendada pelo backoff configurado.`,
      );
      return;
    }

    this.logger.error(
      `Pedido id=${processo.data.pedidoId} esgotou as ${tentativasMaximas} tentativas. Movendo para DLQ.`,
    );

    try {
      await this.filaDlq.add(
        JOB_ENRIQUECER_PEDIDO,
        { ...processo.data, motivoFalha: processo.failedReason },
        { removeOnComplete: false, removeOnFail: false },
      );

      const pedido = await this.pedidoRepository.buscarPorId(processo.data.pedidoId);
      if (pedido) {
        pedido.falharEnriquecimentoDefinitivamente(
          processo.failedReason ?? 'Numero maximo de tentativas excedido',
        );
        await this.pedidoRepository.atualizar(pedido);
      }

      await processo.remove();
    } catch (erro) {
      this.logger.error(
        `Falha ao mover pedido id=${processo.data.pedidoId} para DLQ / atualizar status: ${erro}`,
      );
    }
  }
}
