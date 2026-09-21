import { FindOptionsOrder } from 'typeorm';
import { FiltroPedido } from '@core/application/value-objects/FiltroPedido';
import { PedidoModel } from '../models/PedidoModel';

export class PedidoOrderBuilder {
  private order: FindOptionsOrder<PedidoModel> = {};

  orderByDataInclusao(sentido: 'ASC' | 'DESC' = 'DESC'): this {
    this.order.dataInclusao = sentido;
    return this;
  }

  build(): FindOptionsOrder<PedidoModel> {
    return this.order;
  }

  static createFromFiltro(filtro: FiltroPedido): FindOptionsOrder<PedidoModel> {
    return new PedidoOrderBuilder().orderByDataInclusao(filtro.direcaoOrdenacao).build();
  }
}
