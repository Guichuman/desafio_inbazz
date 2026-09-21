export interface ItemPedidoProps {
  sku: string;
  quantidade: number;
  precoUnitario: number;
}

export class ItemPedido {
  readonly sku: string;
  readonly quantidade: number;
  readonly precoUnitario: number;

  constructor(props: ItemPedidoProps) {
    this.sku = props.sku;
    this.quantidade = props.quantidade;
    this.precoUnitario = props.precoUnitario;
  }

  calcularSubtotal(): number {
    return Number((this.quantidade * this.precoUnitario).toFixed(2));
  }
}
