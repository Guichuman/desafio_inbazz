import { Test, TestingModule } from '@nestjs/testing';
import { IFilaPedidosService } from '../interfaces/IFilaPedidosService';
import { QueueMetricsService } from './QueueMetricsService';

describe('QueueMetricsService', () => {
  let service: QueueMetricsService;
  let filaPedidosService: jest.Mocked<IFilaPedidosService>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        QueueMetricsService,
        {
          provide: IFilaPedidosService,
          useValue: {
            enfileirarEnriquecimento: jest.fn(),
            obterMetricas: jest.fn(),
          },
        },
      ],
    }).compile();

    service = app.get(QueueMetricsService);
    filaPedidosService = app.get(IFilaPedidosService);
  });

  it('deve delegar a obtencao de metricas para o servico de fila', async () => {
    filaPedidosService.obterMetricas.mockResolvedValue({
      nomeFila: 'pedidos-enriquecimento',
      aguardando: 1,
      emProcessamento: 0,
      concluidos: 10,
      falhados: 2,
      agendados: 0,
      naDlq: 1,
    });

    const metricas = await service.obterMetricas();

    expect(filaPedidosService.obterMetricas).toHaveBeenCalledTimes(1);
    expect(metricas.naDlq).toBe(1);
  });
});
