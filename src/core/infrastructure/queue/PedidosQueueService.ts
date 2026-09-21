import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import {
  EnfileirarEnriquecimentoInput,
  IFilaPedidosService,
  MetricasFila,
} from '@core/application/interfaces/IFilaPedidosService';
import {
  JOB_ENRIQUECER_PEDIDO,
  JobEnriquecerPedidoData,
  QUEUE_ENRIQUECIMENTO_PEDIDOS,
  QUEUE_ENRIQUECIMENTO_PEDIDOS_DLQ,
} from './constants';

@Injectable()
export class PedidosQueueService implements IFilaPedidosService {
  constructor(
    @InjectQueue(QUEUE_ENRIQUECIMENTO_PEDIDOS)
    private readonly filaEnriquecimento: Queue<JobEnriquecerPedidoData>,
    @InjectQueue(QUEUE_ENRIQUECIMENTO_PEDIDOS_DLQ)
    private readonly filaDlq: Queue,
    private readonly configService: ConfigService,
  ) {}

  async enfileirarEnriquecimento(input: EnfileirarEnriquecimentoInput): Promise<void> {
    const tentativasMaximas = this.configService.get<number>(
      'QUEUE_ENRIQUECIMENTO_MAX_ATTEMPTS',
      3,
    );
    const backoffMs = this.configService.get<number>('QUEUE_ENRIQUECIMENTO_BACKOFF_MS', 2000);

    await this.filaEnriquecimento.add(
      JOB_ENRIQUECER_PEDIDO,
      { pedidoId: input.pedidoId },
      {
        attempts: tentativasMaximas,
        backoff: { type: 'exponential', delay: backoffMs },
        removeOnComplete: { age: 3600 },
      },
    );
  }

  async obterMetricas(): Promise<MetricasFila> {
    const contagens = await this.filaEnriquecimento.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
    );
    const naDlq = await this.filaDlq.count();

    return {
      nomeFila: this.filaEnriquecimento.name,
      aguardando: contagens.waiting ?? 0,
      emProcessamento: contagens.active ?? 0,
      concluidos: contagens.completed ?? 0,
      falhados: contagens.failed ?? 0,
      agendados: contagens.delayed ?? 0,
      naDlq,
    };
  }
}
