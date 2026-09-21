import { Controller, Get } from '@nestjs/common';
import { QueueMetricsService } from '@core/application/services/QueueMetricsService';
import { QueueMetricsResponseDto } from './dtos/QueueMetricsResponseDto';

@Controller('queue')
export class QueueMetricsController {
  constructor(private readonly queueMetricsService: QueueMetricsService) {}

  @Get('metrics')
  async metricas(): Promise<QueueMetricsResponseDto> {
    return this.queueMetricsService.obterMetricas();
  }
}
