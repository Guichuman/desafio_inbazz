import { EntitySchema } from 'typeorm';
import { ItemPedidoModel } from '../models/ItemPedidoModel';
import { PedidoModel } from '../models/PedidoModel';
import { DefaultColumnModel } from './DefaultColumnModel';

export const PedidoEntitySchema = new EntitySchema<PedidoModel>({
  name: PedidoModel.name,
  target: PedidoModel,
  tableName: 'tb_pedido',
  columns: {
    ...DefaultColumnModel,
    id: { ...DefaultColumnModel.id, primaryKeyConstraintName: 'pk_tb_pedido' },
    orderIdExterno: { type: 'varchar', name: 'order_id_externo', length: 100 },
    idempotencyKey: { type: 'uuid', name: 'idempotency_key' },
    status: { type: 'char', name: 'status', length: 1 },

    clienteNome: { type: 'varchar', name: 'cliente_nome', length: 64 },
    clienteEmail: { type: 'varchar', name: 'cliente_email', length: 64 },
    clienteZipcode: { type: 'varchar', name: 'cliente_zipcode', length: 10, nullable: true },

    moedaOriginal: { type: 'varchar', name: 'moeda_original', length: 3 },
    valorTotal: { type: 'int', name: 'valor_total' },
    valorConvertido: { type: 'int', name: 'valor_convertido', nullable: true },
    moedaConvertida: { type: 'varchar', name: 'moeda_convertida', length: 3, nullable: true },

    enderecoLogradouro: {
      type: 'varchar',
      name: 'endereco_logradouro',
      length: 256,
      nullable: true,
    },
    enderecoBairro: { type: 'varchar', name: 'endereco_bairro', length: 96, nullable: true },
    enderecoCidade: { type: 'varchar', name: 'endereco_cidade', length: 100, nullable: true },
    enderecoUf: { type: 'varchar', name: 'endereco_uf', length: 2, nullable: true },

    tentativasEnriquecimento: { type: 'int', name: 'tentativas_enriquecimento', default: 0 },
    motivoFalhaEnriquecimento: {
      type: 'text',
      name: 'motivo_falha_enriquecimento',
      nullable: true,
    },
  },
  uniques: [{ name: 'uk_tb_pedido_idempotency_key', columns: ['idempotencyKey'] }],
  indices: [
    { name: 'idx_tb_pedido_status', columns: ['status'] },
    { name: 'idx_tb_pedido_data_inclusao', columns: ['dataInclusao'] },
  ],
  relations: {
    itens: {
      type: 'one-to-many',
      target: ItemPedidoModel.name,
      inverseSide: 'pedido',
      cascade: true,
    },
  },
});
