import { EntitySchema } from 'typeorm';
import { ItemPedidoModel } from '../models/ItemPedidoModel';
import { PedidoModel } from '../models/PedidoModel';

export const ItemPedidoEntitySchema = new EntitySchema<ItemPedidoModel>({
  name: ItemPedidoModel.name,
  target: ItemPedidoModel,
  tableName: 'tb_pedido_item',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      primaryKeyConstraintName: 'pk_tb_pedido_item',
    },
    idPedido: { type: 'int', name: 'id_pedido' },
    sku: { type: 'varchar', name: 'sku', length: 50 },
    quantidade: { type: 'int', name: 'quantidade' },
    precoUnitario: { type: 'int', name: 'preco_unitario' },
  },
  indices: [{ name: 'idx_tb_pedido_item_id_pedido', columns: ['idPedido'] }],
  relations: {
    pedido: {
      type: 'many-to-one',
      target: PedidoModel.name,
      joinColumn: { name: 'id_pedido', foreignKeyConstraintName: 'fk_tb_pedido_item_tb_pedido' },
      onDelete: 'CASCADE',
    },
  },
});
