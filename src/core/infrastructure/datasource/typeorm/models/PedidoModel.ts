import { ItemPedidoModel } from './ItemPedidoModel';

export class PedidoModel {
  id!: number;
  orderIdExterno!: string;
  idempotencyKey!: string;
  status!: string;

  clienteNome!: string;
  clienteEmail!: string;
  clienteZipcode?: string;

  moedaOriginal!: string;
  valorTotal!: number;
  valorConvertido?: number;
  moedaConvertida?: string;

  enderecoLogradouro?: string;
  enderecoBairro?: string;
  enderecoCidade?: string;
  enderecoUf?: string;

  tentativasEnriquecimento!: number;
  motivoFalhaEnriquecimento?: string;

  dataInclusao!: Date;

  itens!: ItemPedidoModel[];

  constructor(props?: Partial<PedidoModel>) {
    if (props) {
      Object.assign(this, props);
    }
  }
}
