import { EnderecoEnriquecido } from '@core/domain/pedido/EnderecoEnriquecido';
import { Pedido } from '@core/domain/pedido/Pedido';
import { StatusPedido } from '@core/domain/pedido/value-objects/StatusPedido';

class ItemPedidoResponseDto {
  sku!: string;
  quantidade!: number;
  precoUnitario!: number;
  subtotal!: number;

  constructor(props: ItemPedidoResponseDto) {
    Object.assign(this, props);
  }
}

class ClienteResponseDto {
  nome!: string;
  email!: string;
  zipcode?: string;

  constructor(props: ClienteResponseDto) {
    Object.assign(this, props);
  }
}

export class PedidoResponseDto {
  id!: number;
  orderIdExterno!: string;
  idempotencyKey!: string;
  status!: StatusPedido;

  cliente!: ClienteResponseDto;
  itens!: ItemPedidoResponseDto[];

  moedaOriginal!: string;
  valorTotal!: number;
  valorConvertido?: number;
  moedaConvertida?: string;
  endereco?: EnderecoEnriquecido;

  tentativasEnriquecimento!: number;
  motivoFalhaEnriquecimento?: string;

  dataInclusao!: Date;

  constructor(props: PedidoResponseDto) {
    Object.assign(this, props);
  }

  static fromDomain(pedido: Pedido): PedidoResponseDto {
    return new PedidoResponseDto({
      id: pedido.id,
      orderIdExterno: pedido.orderIdExterno,
      idempotencyKey: pedido.idempotencyKey,
      status: pedido.status,
      cliente: new ClienteResponseDto({
        nome: pedido.cliente.nome,
        email: pedido.cliente.email,
        zipcode: pedido.cliente.zipcode,
      }),
      itens: pedido.itens.map(
        (item) =>
          new ItemPedidoResponseDto({
            sku: item.sku,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            subtotal: item.calcularSubtotal(),
          }),
      ),
      moedaOriginal: pedido.moedaOriginal,
      valorTotal: pedido.valorTotal,
      valorConvertido: pedido.valorConvertido,
      moedaConvertida: pedido.moedaConvertida,
      endereco: pedido.endereco,
      tentativasEnriquecimento: pedido.tentativasEnriquecimento,
      motivoFalhaEnriquecimento: pedido.motivoFalhaEnriquecimento,
      dataInclusao: pedido.dataInclusao,
    });
  }
}
