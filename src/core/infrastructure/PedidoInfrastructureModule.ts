import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IPedidoRepository } from '@core/application/interfaces/IPedidoRepository';
import { ItemPedidoEntitySchema } from './datasource/typeorm/schemas/ItemPedidoEntitySchema';
import { PedidoEntitySchema } from './datasource/typeorm/schemas/PedidoEntitySchema';
import { PedidoRepository } from './datasource/typeorm/PedidoRepository';

@Module({
  imports: [TypeOrmModule.forFeature([PedidoEntitySchema, ItemPedidoEntitySchema])],
  providers: [{ provide: IPedidoRepository, useClass: PedidoRepository }],
  exports: [IPedidoRepository],
})
export class PedidoInfrastructureModule {}
