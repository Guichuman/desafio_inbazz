import { Test, TestingModule } from '@nestjs/testing';
import { QueueMetricsService } from '@core/application/services/QueueMetricsService';
import { QueueMetricsController } from './QueueMetricsController';

describe('QueueMetricsController', () => {
  let controller: QueueMetricsController;
  let queueMetricsService: jest.Mocked<Pick<QueueMetricsService, 'obterMetricas'>>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: QueueMetricsService,
          useValue: { obterMetricas: jest.fn() },
        },
      ],
      controllers: [QueueMetricsController],
    }).compile();

    controller = app.get(QueueMetricsController);
    queueMetricsService = app.get(QueueMetricsService);
  });

  it('deve retornar as metricas fornecidas pelo service', async () => {
    queueMetricsService.obterMetricas.mockResolvedValue({
      nomeFila: 'pedidos-enriquecimento',
      aguardando: 2,
      emProcessamento: 1,
      concluidos: 5,
      falhados: 0,
      agendados: 0,
      naDlq: 0,
    });

    const resposta = await controller.metricas();

    expect(resposta.aguardando).toBe(2);
    expect(queueMetricsService.obterMetricas).toHaveBeenCalledTimes(1);
  });
});
