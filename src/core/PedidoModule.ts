import { Module } from '@nestjs/common';
import { PedidoConsultaService } from '@core/application/services/PedidoConsultaService';
import { QueueMetricsService } from '@core/application/services/QueueMetricsService';
import { ReceberPedidoUseCase } from '@core/application/usecases/receber-pedido/ReceberPedidoUseCase';
import { PedidoInfrastructureModule } from './infrastructure/PedidoInfrastructureModule';
import { PedidosQueueModule } from './infrastructure/queue/PedidosQueueModule';
import { OrdersController } from './presentation/orders/OrdersController';
import { QueueMetricsController } from './presentation/queue/QueueMetricsController';
import { OrdersWebhookController } from './presentation/webhooks/OrdersWebhookController';

@Module({
  imports: [PedidoInfrastructureModule, PedidosQueueModule],
  controllers: [OrdersWebhookController, OrdersController, QueueMetricsController],
  providers: [ReceberPedidoUseCase, PedidoConsultaService, QueueMetricsService],
})
export class PedidoModule {}
