import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { IFilaPedidosService } from '@core/application/interfaces/IFilaPedidosService';
import { EnriquecerPedidoUseCase } from '@core/application/usecases/enriquecer-pedido/EnriquecerPedidoUseCase';
import { ICambioService } from '@core/application/interfaces/ICambioService';
import { ICepService } from '@core/application/interfaces/ICepService';
import { CambioHttpService } from '../services/cambio/CambioHttpService';
import { CepHttpService } from '../services/cep/CepHttpService';
import { HttpModule } from '@nestjs/axios';
import { PedidoInfrastructureModule } from '../PedidoInfrastructureModule';
import { QUEUE_ENRIQUECIMENTO_PEDIDOS, QUEUE_ENRIQUECIMENTO_PEDIDOS_DLQ } from './constants';
import { PedidosProcessor } from './PedidosProcessor';
import { PedidosQueueService } from './PedidosQueueService';

@Module({
  imports: [
    HttpModule,
    PedidoInfrastructureModule,
    BullModule.registerQueue(
      { name: QUEUE_ENRIQUECIMENTO_PEDIDOS },
      { name: QUEUE_ENRIQUECIMENTO_PEDIDOS_DLQ },
    ),
  ],
  providers: [
    { provide: IFilaPedidosService, useClass: PedidosQueueService },
    { provide: ICambioService, useClass: CambioHttpService },
    { provide: ICepService, useClass: CepHttpService },
    EnriquecerPedidoUseCase,
    PedidosProcessor,
  ],
  exports: [IFilaPedidosService],
})
export class PedidosQueueModule {}
