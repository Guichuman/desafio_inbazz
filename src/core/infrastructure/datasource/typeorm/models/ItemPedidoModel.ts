import { PedidoModel } from './PedidoModel';

export class ItemPedidoModel {
  id!: number;
  idPedido!: number;
  sku!: string;
  quantidade!: number;
  precoUnitario!: number;
  pedido?: PedidoModel;

  constructor(props?: Partial<ItemPedidoModel>) {
    if (props) {
      Object.assign(this, props);
    }
  }
}
