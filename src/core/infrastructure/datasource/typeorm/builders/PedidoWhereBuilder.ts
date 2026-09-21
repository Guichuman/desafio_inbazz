import { FindOptionsWhere } from 'typeorm';
import { FiltroPedido } from '@core/application/value-objects/FiltroPedido';
import { PedidoModel } from '../models/PedidoModel';
import { StatusPedidoCodigoMapper } from '../mappers/StatusPedidoCodigoMapper';

export class PedidoWhereBuilder {
  static createFromFiltro(filtro: FiltroPedido): FindOptionsWhere<PedidoModel> {
    const where: FindOptionsWhere<PedidoModel> = {};

    if (filtro.status) {
      where.status = StatusPedidoCodigoMapper.paraCodigo(filtro.status);
    }

    return where;
  }
}
