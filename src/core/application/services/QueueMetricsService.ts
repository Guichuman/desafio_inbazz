import { Inject, Injectable } from '@nestjs/common';
import { IFilaPedidosService, MetricasFila } from '../interfaces/IFilaPedidosService';

@Injectable()
export class QueueMetricsService {
  constructor(
    @Inject(IFilaPedidosService)
    private readonly filaPedidosService: IFilaPedidosService,
  ) {}

  async obterMetricas(): Promise<MetricasFila> {
    return this.filaPedidosService.obterMetricas();
  }
}
